import type { Express } from "express";
import PDFDocument from "pdfkit";

const NAVY = "#1a365d";
const TEAL = "#0d9488";
const GRAY = "#4a5568";
const LIGHT_GRAY = "#718096";
const W = 512;

function renderMarkdownToPdf(doc: PDFDocument, content: string) {
  const lines = content.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      if (doc.y > 650) doc.addPage();
      const heading = line.replace(/^# /, "").replace(/\s*\(\d+ pts\)/, "");
      const pts = line.match(/\((\d+) pts\)/)?.[1];
      doc.moveDown(0.8);
      doc.rect(50, doc.y, W, 28).fill(NAVY);
      doc.fontSize(12).font("Helvetica-Bold").fillColor("white")
        .text(heading + (pts ? ` — ${pts} pts` : ""), 56, doc.y - 22, { width: W - 12 });
      doc.moveDown(1.6);
      i++; continue;
    }

    if (line.startsWith("## ")) {
      if (doc.y > 680) doc.addPage();
      doc.moveDown(0.6);
      doc.fontSize(11).font("Helvetica-Bold").fillColor(TEAL)
        .text(line.replace(/^## /, ""), 50, undefined, { width: W });
      doc.moveDown(0.4);
      i++; continue;
    }

    if (line.startsWith("### ")) {
      if (doc.y > 680) doc.addPage();
      doc.fontSize(10).font("Helvetica-Bold").fillColor(GRAY)
        .text(line.replace(/^### /, ""), 50, undefined, { width: W });
      doc.moveDown(0.3);
      i++; continue;
    }

    if (line === "---") {
      doc.moveDown(0.5);
      doc.rect(50, doc.y, W, 1).fill("#e2e8f0");
      doc.moveDown(0.8);
      i++; continue;
    }

    if (line.match(/^[-*•]\s/)) {
      if (doc.y > 720) doc.addPage();
      const bullet = line.replace(/^[-*•]\s/, "");
      doc.fontSize(9.5).font("Helvetica").fillColor(GRAY)
        .text(`• ${bullet}`, 58, undefined, { width: W - 8 });
      doc.moveDown(0.2);
      i++; continue;
    }

    if (line.trim() === "") {
      doc.moveDown(0.4);
      i++; continue;
    }

    // Regular paragraph
    if (doc.y > 700) doc.addPage();
    doc.fontSize(9.5).font("Helvetica").fillColor(GRAY)
      .text(line, 50, undefined, { width: W });
    doc.moveDown(0.25);
    i++;
  }
}

export function registerExportPdfRoutes(app: Express) {
  app.post("/api/export/pdf", async (req, res) => {
    try {
      const { content, title, subtitle, filename } = req.body as {
        content: string;
        title?: string;
        subtitle?: string;
        filename?: string;
      };

      if (!content) return res.status(400).json({ error: "content is required" });

      const safeFilename = (filename || title || "document")
        .replace(/[^a-zA-Z0-9_\-. ]/g, "_")
        .replace(/\s+/g, "_")
        .replace(/\.md$/, "");

      const doc = new PDFDocument({ size: "LETTER", margin: 50, bufferPages: true });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}.pdf"`);
      doc.pipe(res);

      // ── COVER HEADER ──
      doc.rect(0, 0, 612, 120).fill(NAVY);
      doc.fontSize(20).font("Helvetica-Bold").fillColor("white")
        .text(title || "Document", 50, 28, { width: W });
      if (subtitle) {
        doc.fontSize(11).font("Helvetica").fillColor("#bee3f8")
          .text(subtitle, 50, 60, { width: W });
      }
      doc.fontSize(8.5).font("Helvetica").fillColor("#bee3f8")
        .text(`Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · ThriveUp Academy / TCAF`, 50, 96, { width: W });

      doc.moveDown(5.5);
      doc.rect(50, doc.y, W, 1.5).fill(TEAL);
      doc.moveDown(1.5);

      renderMarkdownToPdf(doc, content);

      // ── FOOTER on last page ──
      doc.moveDown(2);
      doc.rect(50, doc.y, W, 1).fill(TEAL);
      doc.moveDown(0.5);
      doc.fontSize(8).font("Helvetica-Oblique").fillColor(LIGHT_GRAY)
        .text("Thriving Communities for All (TCAF) · ThriveUp Academy · thrivingcommunitiesforall.com", 50, undefined, { width: W, align: "center" });

      doc.end();
    } catch (err) {
      console.error("Export PDF error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate PDF." });
      }
    }
  });
}
