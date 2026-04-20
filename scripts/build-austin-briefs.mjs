import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import {
  Document, Packer, Paragraph, HeadingLevel, TextRun,
  Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle,
  PageOrientation,
} from "docx";

const OUT_DIR = "attached_assets/decks";
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const BRIEFS = [
  { md: "austin-housing-gap-assessment.md",        out: "Austin-Housing-Gap-Assessment-v2.docx" },
  { md: "austin-grant-presentation.md",            out: "Austin-Grant-Presentation-v2.docx" },
  { md: "austin-pflugerville-opportunity-pipeline.md", out: "Austin-Pflugerville-Opportunity-Pipeline-v2.docx" },
];

const NAVY = "1F3A5F";
const GREY = "5A5A5A";
const BORDER = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
const CELL_BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

function parseInline(text) {
  const runs = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) runs.push(new TextRun({ text: text.slice(last, m.index) }));
    const seg = m[0];
    if (seg.startsWith("**")) runs.push(new TextRun({ text: seg.slice(2, -2), bold: true }));
    else runs.push(new TextRun({ text: seg.slice(1, -1), italics: true }));
    last = m.index + seg.length;
  }
  if (last < text.length) runs.push(new TextRun({ text: text.slice(last) }));
  return runs.length ? runs : [new TextRun({ text })];
}

function makeCell(text, opts = {}) {
  return new TableCell({
    borders: CELL_BORDERS,
    width: opts.width,
    shading: opts.header ? { fill: NAVY } : undefined,
    children: [new Paragraph({
      spacing: { before: 40, after: 40 },
      children: opts.header
        ? [new TextRun({ text: text.replace(/\*\*/g, ""), bold: true, color: "FFFFFF", size: 18 })]
        : parseInline(text).map(r => {
            // re-create with smaller size for table cells
            return new TextRun({ ...(r), size: 18 });
          }),
    })],
  });
}

function buildTable(rows) {
  // rows[0] is header, rows[1] is alignment separator (skip), rest are data
  const header = rows[0];
  const dataRows = rows.slice(2);
  const colCount = header.length;
  const colWidth = Math.floor(9000 / colCount);
  const widthSpec = { size: colWidth, type: WidthType.DXA };

  const trHeader = new TableRow({
    tableHeader: true,
    children: header.map(c => makeCell(c, { header: true, width: widthSpec })),
  });
  const trData = dataRows.map(r => new TableRow({
    children: r.map(c => makeCell(c, { width: widthSpec })),
  }));
  return new Table({
    rows: [trHeader, ...trData],
    width: { size: 9000, type: WidthType.DXA },
    borders: {
      top: BORDER, bottom: BORDER, left: BORDER, right: BORDER,
      insideHorizontal: BORDER, insideVertical: BORDER,
    },
  });
}

function splitRow(line) {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map(s => s.trim());
}

function isTableLine(line) { return line.trim().startsWith("|") && line.includes("|", 1); }
function isAlignLine(line) { return /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(line); }

function mdToDocxChildren(md) {
  const lines = md.split(/\r?\n/);
  const children = [];
  let i = 0;
  while (i < lines.length) {
    let line = lines[i];

    // Horizontal rule
    if (/^---+\s*$/.test(line.trim())) {
      children.push(new Paragraph({
        spacing: { before: 120, after: 120 },
        border: { bottom: { color: "CCCCCC", style: BorderStyle.SINGLE, size: 6, space: 1 } },
        children: [new TextRun({ text: "" })],
      }));
      i++; continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 80 },
        children: [new TextRun({ text: line.slice(4), bold: true, color: NAVY, size: 24 })],
      })); i++; continue;
    }
    if (line.startsWith("## ")) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 280, after: 100 },
        children: [new TextRun({ text: line.slice(3), bold: true, color: NAVY, size: 28 })],
      })); i++; continue;
    }
    if (line.startsWith("# ")) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 160 },
        children: [new TextRun({ text: line.slice(2), bold: true, color: NAVY, size: 36 })],
      })); i++; continue;
    }

    // Tables
    if (isTableLine(line) && i + 1 < lines.length && isAlignLine(lines[i + 1])) {
      const tableRows = [];
      while (i < lines.length && isTableLine(lines[i])) {
        tableRows.push(splitRow(lines[i]));
        i++;
        if (tableRows.length === 1 && i < lines.length && isAlignLine(lines[i])) {
          tableRows.push(splitRow(lines[i]));
          i++;
        }
      }
      children.push(buildTable(tableRows));
      children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "" })] }));
      continue;
    }

    // Bullet lists
    if (/^\s*[-*]\s+/.test(line)) {
      const text = line.replace(/^\s*[-*]\s+/, "");
      children.push(new Paragraph({
        bullet: { level: 0 },
        spacing: { before: 40, after: 40 },
        children: parseInline(text),
      })); i++; continue;
    }

    // Numbered lists
    if (/^\s*\d+\.\s+/.test(line)) {
      const text = line.replace(/^\s*\d+\.\s+/, "");
      children.push(new Paragraph({
        numbering: { reference: "default-numbering", level: 0 },
        spacing: { before: 40, after: 40 },
        children: parseInline(text),
      })); i++; continue;
    }

    // Italic-only line (footer-ish)
    if (/^\*[^*].+\*$/.test(line.trim())) {
      children.push(new Paragraph({
        spacing: { before: 60, after: 60 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: line.trim().slice(1, -1), italics: true, color: GREY, size: 18 })],
      })); i++; continue;
    }

    // Blank line
    if (line.trim() === "") {
      children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "" })] }));
      i++; continue;
    }

    // Paragraph
    children.push(new Paragraph({
      spacing: { before: 60, after: 60 },
      children: parseInline(line),
    }));
    i++;
  }
  return children;
}

function buildDoc(md, title) {
  const children = mdToDocxChildren(md);
  return new Document({
    creator: "ThriveUp Academy",
    title,
    description: "Plain-language stakeholder brief",
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
      },
    },
    numbering: {
      config: [{
        reference: "default-numbering",
        levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.START }],
      }],
    },
    sections: [{
      properties: { page: { size: { orientation: PageOrientation.PORTRAIT } } },
      children,
    }],
  });
}

const built = [];
for (const { md, out } of BRIEFS) {
  if (!existsSync(md)) {
    console.warn(`SKIP: ${md} not found`);
    continue;
  }
  const content = readFileSync(md, "utf8");
  const doc = buildDoc(content, out.replace(/\.docx$/, ""));
  const buf = await Packer.toBuffer(doc);
  const outPath = path.join(OUT_DIR, out);
  writeFileSync(outPath, buf);
  built.push(outPath);
  console.log(`✔ ${outPath}  (${(buf.length / 1024).toFixed(1)} KB)`);
}

console.log(`\nDone. ${built.length} Word documents written to ${OUT_DIR}/`);
