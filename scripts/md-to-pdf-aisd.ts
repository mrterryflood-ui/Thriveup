import PDFDocument from "pdfkit";
import fs from "fs";

const DOCS = [
  'docs/grants/aisd-26rfp052/00-README-and-Submission-Checklist.md',
  'docs/grants/aisd-26rfp052/01-Proposal-Response-Form.md',
  'docs/grants/aisd-26rfp052/02-Sample-Unit-Plan-and-Lessons.md',
  'docs/grants/aisd-26rfp052/03-Required-Forms-Filled.md',
];

function renderInline(doc: PDFKit.PDFDocument, text: string, baseSize: number) {
  // Bold **x** and inline `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  parts.forEach((part) => {
    if (!part) return;
    if (part.startsWith("**") && part.endsWith("**")) {
      doc.font("Helvetica-Bold").fontSize(baseSize).text(part.slice(2, -2), { continued: true });
    } else if (part.startsWith("`") && part.endsWith("`")) {
      doc.font("Courier").fontSize(baseSize - 0.5).text(part.slice(1, -1), { continued: true });
    } else {
      doc.font("Helvetica").fontSize(baseSize).text(part, { continued: true });
    }
  });
  doc.text("");
}

function renderMd(doc: PDFKit.PDFDocument, md: string) {
  const lines = md.split("\n");
  let inTable = false;
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (tableRows.length === 0) return;
    // Drop separator row (---|---|---)
    const rows = tableRows.filter((r) => !r.every((c) => /^:?-+:?$/.test(c.trim())));
    if (rows.length === 0) {
      tableRows = [];
      return;
    }
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colCount = rows[0].length;
    const colWidth = pageWidth / colCount;
    doc.fontSize(8.5).font("Helvetica");
    rows.forEach((row, ri) => {
      const startY = doc.y;
      // Pre-measure max height
      const heights = row.map((cell) =>
        doc.heightOfString(cell.replace(/\*\*/g, "").replace(/`/g, ""), {
          width: colWidth - 6,
        }),
      );
      const rowH = Math.max(...heights) + 4;
      if (startY + rowH > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
      }
      const y = doc.y;
      row.forEach((cell, ci) => {
        const x = doc.page.margins.left + ci * colWidth;
        if (ri === 0) doc.font("Helvetica-Bold");
        else doc.font("Helvetica");
        doc.rect(x, y, colWidth, rowH).strokeColor("#bbb").lineWidth(0.5).stroke();
        doc.fillColor("#000").text(
          cell.replace(/\*\*/g, "").replace(/`/g, ""),
          x + 3,
          y + 2,
          { width: colWidth - 6, height: rowH - 4 },
        );
      });
      doc.y = y + rowH;
    });
    doc.moveDown(0.4);
    tableRows = [];
  };

  for (const raw of lines) {
    const line = raw;

    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const cells = line.trim().slice(1, -1).split("|").map((c) => c.trim());
      tableRows.push(cells);
      inTable = true;
      continue;
    } else if (inTable) {
      flushTable();
      inTable = false;
    }

    if (line.startsWith("# ")) {
      doc.moveDown(0.3).font("Helvetica-Bold").fontSize(18).fillColor("#000").text(line.slice(2));
      doc
        .moveTo(doc.page.margins.left, doc.y + 2)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y + 2)
        .strokeColor("#000")
        .lineWidth(1.2)
        .stroke();
      doc.moveDown(0.5);
    } else if (line.startsWith("## ")) {
      doc.moveDown(0.6).font("Helvetica-Bold").fontSize(13).fillColor("#000").text(line.slice(3));
      doc.moveDown(0.2);
    } else if (line.startsWith("### ")) {
      doc.moveDown(0.4).font("Helvetica-Bold").fontSize(11.5).fillColor("#000").text(line.slice(4));
      doc.moveDown(0.1);
    } else if (line.trim() === "---") {
      doc.moveDown(0.3);
      doc
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .strokeColor("#ccc")
        .lineWidth(0.5)
        .stroke();
      doc.moveDown(0.3);
    } else if (/^\s*[-*]\s+/.test(line)) {
      const txt = line.replace(/^\s*[-*]\s+/, "");
      doc.font("Helvetica").fontSize(10).fillColor("#000").text("•  ", { continued: true });
      renderInline(doc, txt, 10);
    } else if (/^\s*\d+\.\s+/.test(line)) {
      const m = line.match(/^\s*(\d+\.)\s+(.*)$/);
      if (m) {
        doc.font("Helvetica").fontSize(10).fillColor("#000").text(m[1] + "  ", { continued: true });
        renderInline(doc, m[2], 10);
      }
    } else if (line.trim() === "") {
      doc.moveDown(0.4);
    } else {
      doc.fillColor("#000");
      renderInline(doc, line, 10);
    }
  }
  if (inTable) flushTable();
}

(async () => {
  for (const mdPath of DOCS) {
    const md = fs.readFileSync(mdPath, "utf8");
    const outPath = mdPath.replace(/\.md$/, ".pdf");
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 50, bottom: 50, left: 54, right: 54 },
    });
    doc.pipe(fs.createWriteStream(outPath));
    renderMd(doc, md);
    doc.end();
    await new Promise<void>((resolve) =>
      doc.on("end", () => resolve()),
    );
    console.log("wrote", outPath);
  }
})();
