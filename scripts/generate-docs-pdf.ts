import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const BASE = "http://localhost:5000";
const OUT  = path.resolve("docs/generated");
fs.mkdirSync(OUT, { recursive: true });

const docs = [
  { path: "/letterhead.html",           file: "TCAF-HIS-Letterhead.pdf" },
  { path: "/capability-statement.html", file: "TCAF-HIS-Capability-Statement.pdf" },
];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();

  for (const doc of docs) {
    const page = await context.newPage();
    await page.goto(BASE + doc.path, { waitUntil: "networkidle" });
    const outPath = path.join(OUT, doc.file);
    await page.pdf({
      path: outPath,
      format: "Letter",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    console.log("✅  " + doc.file);
    await page.close();
  }

  await browser.close();
  console.log("\nSaved to: " + OUT);
})();
