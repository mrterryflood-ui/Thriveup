import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, basename } from 'node:path';
import { marked } from 'marked';
import { chromium } from 'playwright';

const inputPath = process.argv[2];
const outputPath = process.argv[3];
if (!inputPath || !outputPath) {
  console.error('Usage: node md-to-pdf.mjs <input.md> <output.pdf>');
  process.exit(1);
}

const md = readFileSync(inputPath, 'utf8');
marked.setOptions({ gfm: true, breaks: false });
const body = marked.parse(md);

const title = basename(inputPath, '.md');
const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
  @page { size: Letter; margin: 1in; }
  html, body { font-family: "Arial", "Helvetica Neue", -apple-system, sans-serif; font-size: 11pt; color: #111; line-height: 1.25; }
  body { margin: 0; }
  h1 { font-size: 15pt; margin: 0 0 5pt 0; border-bottom: 1pt solid #000; padding-bottom: 3pt; }
  h2 { font-size: 12pt; margin: 9pt 0 3pt 0; border-bottom: 0.5pt solid #999; padding-bottom: 2pt; }
  h3 { font-size: 11pt; margin: 7pt 0 2pt 0; }
  h4 { font-size: 10.5pt; margin: 6pt 0 2pt 0; }
  p { margin: 0 0 4pt 0; text-align: justify; }
  ul, ol { margin: 0 0 4pt 0; padding-left: 18pt; }
  li { margin-bottom: 1pt; }
  blockquote { border-left: 2pt solid #888; margin: 4pt 0; padding: 2pt 0 2pt 10pt; color: #333; font-style: italic; }
  code { font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 9pt; background: #f3f3f3; padding: 0 2pt; border-radius: 2pt; }
  pre { font-size: 9pt; background: #f6f6f6; padding: 6pt; border-radius: 2pt; overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; margin: 4pt 0 8pt 0; font-size: 9pt; page-break-inside: avoid; }
  th, td { border: 0.5pt solid #888; padding: 3pt 5pt; vertical-align: top; text-align: left; }
  th { background: #ececec; font-weight: 600; }
  hr { border: 0; border-top: 0.5pt solid #aaa; margin: 10pt 0; }
  strong { font-weight: 700; }
  a { color: #003366; text-decoration: none; }
  h1, h2, h3 { page-break-after: avoid; }
  tr, li { page-break-inside: avoid; }
</style></head><body>${body}</body></html>`;

mkdirSync(dirname(outputPath), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
await page.pdf({
  path: outputPath,
  format: 'Letter',
  printBackground: true,
  margin: { top: '0.75in', right: '0.75in', bottom: '0.75in', left: '0.75in' },
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: '<div style="font-size:8pt; width:100%; text-align:center; color:#666;">ARPA-H SOL-24-106 — TCAF / M&T — <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
});
await browser.close();
const stats = await import('node:fs').then(f => f.statSync(outputPath));
console.log(`PDF written: ${outputPath} (${(stats.size/1024).toFixed(1)} KB)`);
