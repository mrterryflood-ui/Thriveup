import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ExternalHyperlink } from "docx";
import fs from "fs";
import path from "path";

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error("usage: node scripts/md-to-docx.mjs <in.md> <out.docx>");
  process.exit(1);
}

const md = fs.readFileSync(inPath, "utf8");
const lines = md.split(/\r?\n/);

const FONT = "Calibri";
const NAVY = "1F3A5F";

function parseInline(text) {
  // Returns array of TextRun / ExternalHyperlink children
  const out = [];
  let cursor = 0;
  // Combined regex: bold **x**, italic *x* or _x_, link [t](u), inline code `x`
  const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(\[([^\]]+)\]\(([^)]+)\))|(`([^`]+)`)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > cursor) {
      out.push(new TextRun({ text: text.slice(cursor, m.index), font: FONT }));
    }
    if (m[2] !== undefined) {
      out.push(new TextRun({ text: m[2], bold: true, font: FONT }));
    } else if (m[4] !== undefined) {
      out.push(new TextRun({ text: m[4], italics: true, font: FONT }));
    } else if (m[6] !== undefined) {
      out.push(new TextRun({ text: m[6], italics: true, font: FONT }));
    } else if (m[8] !== undefined) {
      out.push(new ExternalHyperlink({
        link: m[9],
        children: [new TextRun({ text: m[8], style: "Hyperlink", color: "0563C1", underline: {}, font: FONT })],
      }));
    } else if (m[11] !== undefined) {
      out.push(new TextRun({ text: m[11], font: "Consolas" }));
    }
    cursor = m.index + m[0].length;
  }
  if (cursor < text.length) {
    out.push(new TextRun({ text: text.slice(cursor), font: FONT }));
  }
  if (out.length === 0) out.push(new TextRun({ text, font: FONT }));
  return out;
}

const blocks = [];

function pushPara(text, opts = {}) {
  blocks.push(new Paragraph({
    children: parseInline(text),
    spacing: { after: 120, ...(opts.spacing || {}) },
    alignment: opts.alignment,
    heading: opts.heading,
  }));
}

function pushHeading(text, level) {
  const sizes = { 1: 32, 2: 26, 3: 22, 4: 18 };
  blocks.push(new Paragraph({
    children: [new TextRun({ text, bold: true, size: sizes[level] || 22, color: NAVY, font: FONT })],
    spacing: { before: level === 1 ? 0 : 240, after: 120 },
    heading: { 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3, 4: HeadingLevel.HEADING_4 }[level],
  }));
}

function pushBullet(text) {
  blocks.push(new Paragraph({
    children: parseInline(text),
    bullet: { level: 0 },
    spacing: { after: 80 },
  }));
}

function pushTable(rows) {
  const tableRows = rows.map((cells, rowIdx) => new TableRow({
    tableHeader: rowIdx === 0,
    children: cells.map(cell => {
      const text = cell.trim();
      const children = rowIdx === 0
        ? [new TextRun({ text, bold: true, font: FONT })]
        : parseInline(text);
      return new TableCell({
        children: [new Paragraph({ children, spacing: { after: 0 } })],
        width: { size: Math.floor(9000 / cells.length), type: WidthType.DXA },
        shading: rowIdx === 0 ? { fill: "EEF2F7" } : undefined,
      });
    }),
  }));
  blocks.push(new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  }));
  blocks.push(new Paragraph({ children: [new TextRun({ text: "", font: FONT })], spacing: { after: 120 } }));
}

let i = 0;
let pendingTable = null;

while (i < lines.length) {
  const line = lines[i];
  const trimmed = line.trim();

  // Table block: header row, separator row, body rows
  if (/^\|.+\|$/.test(trimmed) && i + 1 < lines.length && /^\|[\s:|-]+\|$/.test(lines[i + 1].trim())) {
    const tableRows = [];
    const header = trimmed.split("|").slice(1, -1);
    tableRows.push(header);
    i += 2;
    while (i < lines.length && /^\|.+\|$/.test(lines[i].trim())) {
      tableRows.push(lines[i].trim().split("|").slice(1, -1));
      i++;
    }
    pushTable(tableRows);
    continue;
  }

  if (trimmed === "") {
    i++;
    continue;
  }
  if (/^---+$/.test(trimmed)) {
    blocks.push(new Paragraph({
      children: [new TextRun({ text: "", font: FONT })],
      border: { bottom: { color: "999999", space: 1, style: BorderStyle.SINGLE, size: 6 } },
      spacing: { after: 120 },
    }));
    i++;
    continue;
  }
  const h = /^(#{1,4})\s+(.+)$/.exec(trimmed);
  if (h) {
    pushHeading(h[2], h[1].length);
    i++;
    continue;
  }
  if (/^[-*]\s+/.test(trimmed)) {
    pushBullet(trimmed.replace(/^[-*]\s+/, ""));
    i++;
    continue;
  }
  pushPara(trimmed);
  i++;
}

const doc = new Document({
  creator: "ThriveUp Community Action Foundation (TCAF)",
  title: path.basename(inPath, ".md"),
  styles: {
    default: {
      document: { run: { font: FONT, size: 22 } },
    },
  },
  sections: [{
    properties: { page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
    children: blocks,
  }],
});

const buf = await Packer.toBuffer(doc);
fs.writeFileSync(outPath, buf);
console.log(`Wrote ${outPath} (${buf.length} bytes, ${blocks.length} blocks)`);
