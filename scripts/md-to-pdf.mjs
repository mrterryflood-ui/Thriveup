import PDFDocument from "pdfkit";
import fs from "fs";

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error("usage: node scripts/md-to-pdf.mjs <in.md> <out.pdf>");
  process.exit(1);
}

const md = fs.readFileSync(inPath, "utf8");
const lines = md.split(/\r?\n/);

const NAVY = "#1F3A5F";
const ACCENT = "#B8862E";
const TEXT = "#222222";
const MUTED = "#555555";
const RULE = "#CCCCCC";
const TABLE_HEAD_BG = "#EEF2F7";

const PAGE_MARGIN = 54;
const doc = new PDFDocument({ size: "LETTER", margin: PAGE_MARGIN, bufferPages: true, info: { Title: "TCAF Benefits Enrollment Collaborative", Author: "ThriveUp Community Action Foundation (TCAF)" } });
doc.pipe(fs.createWriteStream(outPath));

const W = doc.page.width - PAGE_MARGIN * 2;

function ensureSpace(needed) {
  if (doc.y + needed > doc.page.height - PAGE_MARGIN) doc.addPage();
}

function rule() {
  ensureSpace(20);
  doc.moveTo(PAGE_MARGIN, doc.y + 4).lineTo(PAGE_MARGIN + W, doc.y + 4).strokeColor(RULE).lineWidth(0.5).stroke();
  doc.moveDown(0.6);
}

function heading(text, level) {
  const sizes = { 1: 22, 2: 16, 3: 13, 4: 11 };
  const size = sizes[level] || 12;
  ensureSpace(size + 18);
  doc.moveDown(level === 1 ? 0.2 : 0.6);
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(size).text(text, { width: W });
  doc.moveDown(0.3);
}

// Render a paragraph that may contain bold (**x**), italic (*x* or _x_), inline link [t](u), inline code `x`
function inlineRuns(text) {
  const out = [];
  let cursor = 0;
  const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(\[([^\]]+)\]\(([^)]+)\))|(`([^`]+)`)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > cursor) out.push({ text: text.slice(cursor, m.index) });
    if (m[2] !== undefined) out.push({ text: m[2], bold: true });
    else if (m[4] !== undefined) out.push({ text: m[4], italic: true });
    else if (m[6] !== undefined) out.push({ text: m[6], italic: true });
    else if (m[8] !== undefined) out.push({ text: m[8], link: m[9] });
    else if (m[11] !== undefined) out.push({ text: m[11], code: true });
    cursor = m.index + m[0].length;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor) });
  if (out.length === 0) out.push({ text });
  return out;
}

function paragraph(text, opts = {}) {
  const runs = inlineRuns(text);
  ensureSpace(14);
  doc.fillColor(opts.color || TEXT).fontSize(opts.size || 10.5);
  runs.forEach((r, i) => {
    const isLast = i === runs.length - 1;
    if (r.bold) doc.font("Helvetica-Bold");
    else if (r.italic) doc.font("Helvetica-Oblique");
    else if (r.code) doc.font("Courier");
    else doc.font("Helvetica");
    if (r.link) {
      doc.fillColor("#0563C1").text(r.text, { continued: !isLast, link: r.link, underline: true });
      doc.fillColor(opts.color || TEXT);
    } else {
      doc.text(r.text, { continued: !isLast });
    }
  });
  doc.moveDown(0.4);
}

function bullet(text) {
  ensureSpace(14);
  const runs = inlineRuns(text);
  doc.fillColor(TEXT).font("Helvetica").fontSize(10.5);
  doc.text("•  ", PAGE_MARGIN + 6, doc.y, { continued: true, width: W - 6 });
  runs.forEach((r, i) => {
    const isLast = i === runs.length - 1;
    if (r.bold) doc.font("Helvetica-Bold");
    else if (r.italic) doc.font("Helvetica-Oblique");
    else if (r.code) doc.font("Courier");
    else doc.font("Helvetica");
    if (r.link) {
      doc.fillColor("#0563C1").text(r.text, { continued: !isLast, link: r.link, underline: true });
      doc.fillColor(TEXT);
    } else {
      doc.text(r.text, { continued: !isLast });
    }
  });
  doc.moveDown(0.2);
}

function renderTable(rows) {
  const cols = rows[0].length;
  const colW = W / cols;
  const rowH = 22;
  const tableHeight = rowH * rows.length;
  ensureSpace(tableHeight + 10);
  let y = doc.y + 4;
  rows.forEach((cells, ri) => {
    if (ri === 0) {
      doc.rect(PAGE_MARGIN, y, W, rowH).fillColor(TABLE_HEAD_BG).fill();
    }
    cells.forEach((cell, ci) => {
      const x = PAGE_MARGIN + ci * colW;
      doc.lineWidth(0.5).strokeColor(RULE).rect(x, y, colW, rowH).stroke();
      doc.fillColor(ri === 0 ? NAVY : TEXT)
         .font(ri === 0 ? "Helvetica-Bold" : "Helvetica")
         .fontSize(10)
         .text(cell.trim().replace(/\*\*/g, ""), x + 6, y + 6, { width: colW - 12, height: rowH - 8, ellipsis: false });
    });
    y += rowH;
  });
  doc.y = y + 6;
}

let i = 0;
while (i < lines.length) {
  const line = lines[i];
  const trimmed = line.trim();

  if (/^\|.+\|$/.test(trimmed) && i + 1 < lines.length && /^\|[\s:|-]+\|$/.test(lines[i + 1].trim())) {
    const tableRows = [trimmed.split("|").slice(1, -1)];
    i += 2;
    while (i < lines.length && /^\|.+\|$/.test(lines[i].trim())) {
      tableRows.push(lines[i].trim().split("|").slice(1, -1));
      i++;
    }
    renderTable(tableRows);
    continue;
  }
  if (trimmed === "") { doc.moveDown(0.3); i++; continue; }
  if (/^---+$/.test(trimmed)) { rule(); i++; continue; }
  const h = /^(#{1,4})\s+(.+)$/.exec(trimmed);
  if (h) { heading(h[2], h[1].length); i++; continue; }
  if (/^[-*]\s+/.test(trimmed)) { bullet(trimmed.replace(/^[-*]\s+/, "")); i++; continue; }
  paragraph(trimmed);
  i++;
}

// Footer on every page
const range = doc.bufferedPageRange();
for (let p = range.start; p < range.start + range.count; p++) {
  doc.switchToPage(p);
  doc.fontSize(8).fillColor(MUTED).font("Helvetica")
     .text(`ThriveUp Community Action Foundation (TCAF)  ·  UEI KDDVD1FGLW35  ·  Page ${p + 1} of ${range.count}`,
       PAGE_MARGIN, doc.page.height - PAGE_MARGIN + 10, { width: W, align: "center", lineBreak: false });
}

doc.end();
await new Promise(r => doc.on("end", r));
console.log(`Wrote ${outPath} (${fs.statSync(outPath).size} bytes)`);
