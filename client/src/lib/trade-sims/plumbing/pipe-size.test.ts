import { PIPE_TABLE, PIPE_SIZES_ORDERED } from "./pipe-table.js";

let pass = 0; let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { console.log(`  PASS  ${label}`); pass++; }
  else { console.error(`  FAIL  ${label}`); fail++; }
}

// All entries have positive diameters
for (const [size, row] of Object.entries(PIPE_TABLE)) {
  ok(`${size}: nominalMm > 0`, row.nominalMm > 0);
  ok(`${size}: hwC in 100-150`, row.hwC >= 100 && row.hwC <= 150);
  ok(`${size}: label non-empty`, row.label.length > 0);
}

// Diameters are in ascending order
const diams = PIPE_SIZES_ORDERED.map(s => PIPE_TABLE[s].nominalMm);
for (let i = 1; i < diams.length; i++) {
  ok(`ascending order: ${PIPE_SIZES_ORDERED[i-1]} < ${PIPE_SIZES_ORDERED[i]}`, diams[i] > diams[i-1]);
}

// Known exact mappings
ok('½" = 15 mm', PIPE_TABLE["1/2"].nominalMm === 15);
ok('¾" = 19 mm', PIPE_TABLE["3/4"].nominalMm === 19);
ok('1" = 25 mm', PIPE_TABLE["1"].nominalMm === 25);
ok('1¼" = 32 mm', PIPE_TABLE["1-1/4"].nominalMm === 32);
ok('1½" = 38 mm', PIPE_TABLE["1-1/2"].nominalMm === 38);
ok('2" = 50 mm', PIPE_TABLE["2"].nominalMm === 50);
ok('3" = 75 mm', PIPE_TABLE["3"].nominalMm === 75);
ok('4" = 100 mm', PIPE_TABLE["4"].nominalMm === 100);

// 8 sizes defined
ok('8 standard sizes defined', Object.keys(PIPE_TABLE).length === 8);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
