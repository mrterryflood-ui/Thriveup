const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({ margin: 72, size: 'letter' });
doc.pipe(fs.createWriteStream('attached_assets/TCAF-Deneece-Letter-June2026.pdf'));

const BLUE = '#1a3a5c';
const BODY = '#1a1a1a';
const GRAY = '#666666';

function heading(text) {
  doc.font('Helvetica-Bold').fontSize(11).fillColor(BLUE).text(text);
  doc.moveDown(0.4);
}

function italic(text) {
  doc.font('Helvetica-Oblique').fontSize(10.5).fillColor(GRAY).text(text);
  doc.moveDown(0.3);
}

function body(text) {
  doc.font('Helvetica').fontSize(10.5).fillColor(BODY).text(text, { align: 'justify' });
  doc.moveDown(0.6);
}

function rule() {
  doc.moveTo(72, doc.y).lineTo(540, doc.y).strokeColor('#cccccc').lineWidth(0.5).stroke();
  doc.moveDown(0.6);
}

// ── Header ────────────────────────────────────────────────────────────────────
doc.font('Helvetica-Bold').fontSize(12).fillColor(BLUE).text('Terry Flood, Ph.D.');
doc.font('Helvetica').fontSize(10).fillColor(GRAY)
   .text('President, Thriving Communities for All')
   .text('terryflood@thrivingcommunitiesforall.com')
   .text('thrivingcommunitiesforall.com');
doc.moveDown(0.5);
rule();

// Date & addressee
doc.font('Helvetica').fontSize(10.5).fillColor(BODY).text('June 2, 2026');
doc.moveDown(0.7);
doc.font('Helvetica-Bold').fontSize(10.5).fillColor(BODY).text('Deneece Ferrales, Ph.D.');
doc.font('Helvetica').fontSize(10.5).fillColor(BODY)
   .text('Director of Williamson County Initiatives')
   .text('United Way for Greater Austin');
doc.moveDown(0.8);

// Salutation
doc.font('Helvetica').fontSize(10.5).fillColor(BODY).text('Deneece, Jennifer, Heather, and colleagues \u2014');
doc.moveDown(0.5);

body(
  'Thank you for sharing the 2025 Austin/Travis County ECE Landscape Survey and for the thoughtful framing questions you put to the group. I read both carefully and want to offer something concrete before the June 11 meeting \u2014 not just observations, but data, a framework, and specific tools our organization has been developing for exactly this kind of community systems work.'
);

// ── Section 1 ─────────────────────────────────────────────────────────────────
heading('What I noticed in the survey \u2014 and what it tells us about North Wilco');

body(
  'The United Way survey is well-executed and the findings are sobering. A few numbers landed hard: providers operating at 65% of licensed capacity while simultaneously reporting open slots \u2014 that paradox points directly to affordability, not supply, as the binding constraint. When the average monthly tuition for children under six is $1,260, and the median annual income for female-headed households with children in Travis County is $36,537, families are not choosing other options. They are stitching together informal arrangements because the formal system costs 41% of a single mother\'s gross income before rent.'
);

body(
  'The workforce data confirmed what providers already know: 40% annual teacher turnover is not a staffing problem \u2014 it is a wage problem that presents as a staffing problem. More than half of providers reported open positions they could not fill because the applicant pool was too small or candidates lacked qualifications. But the pipeline is not empty; it is underpaid. Childcare workers earn $24,000\u2013$32,000 a year against an Austin-area cost of living that requires roughly $80,000 for a single adult with one child. The workers exist. The math does not.'
);

body(
  'One finding deserves particular attention as you design the North Wilco analysis: providers accepting subsidies were far more likely to be under-enrolled across three or more age groups (76%) than providers outside the subsidy system (just under half). The subsidy infrastructure \u2014 meant to expand access \u2014 is concentrating enrollment instability in the providers most committed to serving low-income families. That is a structural flaw worth naming explicitly in the North Wilco document.'
);

// ── Section 2 ─────────────────────────────────────────────────────────────────
heading('What the North Wilco analysis should add \u2014 answers to your five questions');

italic('What does the ATX survey include that would strengthen the North Wilco analysis?');
body(
  'Three things the ATX survey does that your current landscape analysis does not: (1) it distinguishes licensed capacity from actual enrollment and desired enrollment \u2014 three different numbers that tell different stories; (2) it captures non-traditional hours availability (only 12% of Travis County providers offer evening or weekend care, and home-based providers carry almost all of that \u2014 a pattern I expect is more pronounced in the northern Williamson corridor); and (3) it tracks provider financial confidence as a leading indicator. A provider who is not confident in their stability over the next 12 months is likely to close before any external data system catches it.'
);

italic('Do we have access to additional data?');
body(
  'Yes \u2014 more than most people realize. TCAF operates a live Community Intelligence platform that pulls U.S. Census ACS five-year data for any county or corridor. For Williamson County right now: 617,396 residents, 6.3% poverty rate, $102,851 median household income, 25% Hispanic/Latino, 6.8% Black/African American. But the county-level number masks the ZIP-code story \u2014 Burnet sits at 12.1% poverty, Liberty Hill at 9.4%, while Cedar Park shows 5.1%. I can run those breakdowns for every ZIP in the northern corridor before June 11 and share them with the group in whatever format is most useful.'
);

italic('If we include provider information, what should we capture?');
body(
  'The most valuable provider data is what the state licensing system does not collect: informal and unlicensed care capacity, subsidy awareness and uptake barriers, and provider financial fragility. Licensed centers are documented. The unlicensed family, friend, and neighbor providers \u2014 the grandmothers, aunties, and bilingual informal caregivers who are the actual backbone of childcare in northern Williamson \u2014 are invisible to every public dataset. Any landscape analysis that does not count them is documenting the tip of the iceberg.'
);

// ── Page 2 ────────────────────────────────────────────────────────────────────
doc.addPage();

heading('If we can only ask three questions of childcare providers, what should they be?');

body(
  'After working through the data for the northern Williamson corridor, I would recommend these three:'
);

// Q1
doc.font('Helvetica-Bold').fontSize(10.5).fillColor(BLUE).text('Question 1');
doc.font('Helvetica-Oblique').fontSize(10.5).fillColor(BODY).text(
  '"Do you currently provide regular childcare to children who are not your own, with or without a state license?"'
);
doc.moveDown(0.3);
body(
  'This surfaces the invisible informal economy \u2014 the 300\u2013500 unlicensed providers we estimate are operating in the northern ZIPs alone. Without this question, any provider survey will undercount actual capacity by 30\u201340% and miss the highest-leverage intervention point entirely.'
);

// Q2
doc.font('Helvetica-Bold').fontSize(10.5).fillColor(BLUE).text('Question 2');
doc.font('Helvetica-Oblique').fontSize(10.5).fillColor(BODY).text(
  '"What is the single biggest barrier preventing you from serving more children or improving the quality of care you provide?"'
);
doc.moveDown(0.3);
body(
  'This separates real constraints from assumed ones. Providers in rural Burnet and Liberty Hill name different barriers than providers in Leander or Cedar Park. Do not assume the Austin/Travis County answer \u2014 wages and staff retention \u2014 maps directly onto the northern corridor.'
);

// Q3
doc.font('Helvetica-Bold').fontSize(10.5).fillColor(BLUE).text('Question 3');
doc.font('Helvetica-Oblique').fontSize(10.5).fillColor(BODY).text(
  '"Have you ever been told about, or tried to access, a state childcare subsidy, a training program, or a credential pathway \u2014 and if so, what happened?"'
);
doc.moveDown(0.3);
body(
  'This measures system connectivity \u2014 the degree to which providers and families actually reach programs designed for them. A subsidy program with 8% coverage of eligible families is not failing because of eligibility rules; it is failing because no one knows it exists, or the application takes six weeks and families need care on Monday.'
);

// ── Section 4 ─────────────────────────────────────────────────────────────────
heading('What TCAF brings to this coalition');

body(
  'We have been doing the North Wilco landscape analysis. I have three working documents \u2014 a full ZIP-level briefing covering 78641, 78613, 78642, 78611, and 78645 with named stakeholders; a primary-source data table identifying what is verified and what needs a direct pull; and a full implementation strategy framed specifically for United Way of Williamson County \u2014 that I would like to bring to the June 11 meeting or share before it, whichever is most useful to the group.'
);

body(
  'Beyond the documents, TCAF operates RPLICE \u2014 a research-to-practice platform built to do exactly the kind of baseline assessment the North Wilco analysis needs next. I would like to propose we run it as a joint initiative: United Way\'s community relationships and provider access combined with RPLICE\'s data infrastructure and evaluation framework. We scope it together, pursue funding together, and the data belongs to the coalition. A structured scan can fill the primary-source gaps your current analysis flags \u2014 unlicensed FFN provider count, faith-network childcare capacity, CCDF wait-list distribution by ZIP \u2014 and produce a verifiable baseline that funders, school districts, and state agencies can act on.'
);

body(
  'One more thing worth naming directly: the providers who hold this community together \u2014 the unlicensed grandmothers, the Spanish-monolingual home-based caregivers, the faith-network nursery coordinators \u2014 have told us in listening sessions that they want training, credentials, and connection. What they do not trust is being data-extracted without being seen. Any provider outreach strategy for the North Wilco analysis should lead with dignity and consent, not a survey form. We have a framework for that and I am glad to walk the group through it at the June 11 table.'
);

body(
  'I look forward to being in the room on June 11. Please let me know if a pre-meeting call would be helpful to coordinate any of this before then.'
);

doc.moveDown(0.5);
doc.font('Helvetica').fontSize(10.5).fillColor(BODY).text('With respect and partnership,');
doc.moveDown(1.0);
doc.font('Helvetica-Bold').fontSize(11).fillColor(BLUE).text('Terry Flood, Ph.D.');
doc.font('Helvetica').fontSize(10).fillColor(GRAY)
   .text('President, Thriving Communities for All')
   .text('terryflood@thrivingcommunitiesforall.com')
   .text('thrivingcommunitiesforall.com');

doc.moveDown(1.5);
rule();

doc.font('Helvetica-Oblique').fontSize(9).fillColor(GRAY).text(
  'Attachments available on request: North Wilco ZIP-level briefing (78641, 78613, 78642, 78611, 78645) \u00b7 Primary-source data table \u00b7 Full implementation strategy for United Way of Williamson County \u00b7 RPLICE Baseline Assessment framework',
  { align: 'left' }
);

doc.end();
console.log('done');
