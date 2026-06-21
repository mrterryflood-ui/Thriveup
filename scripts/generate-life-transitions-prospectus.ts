import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const OUT = path.join(process.cwd(), "attached_assets", "LifeTransitions-ALIGN-Prospectus.pdf");

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  indigo:    "#1e1b4b", indigoMid: "#312e81", indigoLt: "#4338ca",
  emerald:   "#064e3b", emeraldMid:"#065f46",  emeraldLt:"#059669",
  gold:      "#b45309", goldLt:    "#d97706",
  ruby:      "#9f1239", rubyLt:    "#be185d",
  violet:    "#6d28d9", teal:      "#0f766e",
  slate:     "#334155", muted:     "#64748b",  faint:"#94a3b8",
  white:     "#ffffff", offWhite:  "#f8fafc",  border:"#e2e8f0",
};
const PAGE = { w: 612, h: 792 };
const M    = { t: 48, b: 40, l: 50, r: 50 };
const CW   = PAGE.w - M.l - M.r;
const FB = "Helvetica-Bold", FR = "Helvetica", FI = "Helvetica-Oblique";
const LOGO = [
  path.join(process.cwd(),"attached_assets","4C3587C9-E0BC-45FD-9E4E-CD435BE825BD_1781970914957.png"),
  path.join(process.cwd(),"attached_assets","4C3587C9-E0BC-45FD-9E4E-CD435BE825BD_1781974706746.png"),
].find(p => fs.existsSync(p)) ?? null;

const doc = new PDFDocument({ size:"LETTER", margin:0, bufferPages:true });
const stream = fs.createWriteStream(OUT);
doc.pipe(stream);

// ════════════ HELPERS ════════════════════════════════════════════════════════
const cy = () => doc.y;
function hRule(color=C.border,lw=0.5){
  doc.save().strokeColor(color).lineWidth(lw).moveTo(M.l,cy()).lineTo(PAGE.w-M.r,cy()).stroke().restore();
}
function safe(reserve=80){ if(cy()>PAGE.h-M.b-reserve){ doc.addPage(); doc.y=M.t; } }

function chrome(title:string, pg:string){
  doc.rect(0,0,PAGE.w,6).fill(C.gold);
  doc.rect(0,6,PAGE.w,34).fill(C.offWhite);
  doc.font(FB).fontSize(9).fillColor(C.indigo).text("THRIVEUP ACADEMY  ·  TCAF",M.l,17,{lineBreak:false});
  doc.font(FR).fontSize(7.5).fillColor(C.muted).text(pg,0,19,{width:PAGE.w-M.r,align:"right",lineBreak:false});
  doc.font(FR).fontSize(7.5).fillColor(C.muted).text(title,M.l,29,{lineBreak:false});
  doc.rect(0,PAGE.h-22,PAGE.w,22).fill(C.indigo);
  doc.font(FR).fontSize(6.5).fillColor("rgba(255,255,255,0.50)")
    .text("Confidential · The Collaborative Advocate Foundation · EIN 41-3618003 · CAGE 209N1 · terryflood@thrivingcommunitiesforall.com · thriveup.app · June 2026",
      M.l,PAGE.h-13,{width:CW,align:"center",lineBreak:false});
  doc.y=52;
}
function newPage(title:string,pg:string){ doc.addPage(); chrome(title,pg); }

function banner(label:string, color=C.indigo, sub=""){
  const bh=sub?26:18;
  safe(bh+20);
  doc.save().rect(M.l,cy(),CW,bh).fill(color).restore();
  doc.font(FB).fontSize(8).fillColor(C.white).text(label.toUpperCase(),M.l+10,cy()+5,{width:CW-20,lineBreak:false});
  if(sub) doc.font(FR).fontSize(7).fillColor("rgba(255,255,255,0.68)").text(sub,M.l+10,cy()+16,{width:CW-20,lineBreak:false});
  doc.moveDown(sub?1.9:1.3);
}

function h3(t:string,color=C.indigo){
  safe(28);
  doc.font(FB).fontSize(8.5).fillColor(color).text(t.toUpperCase(),M.l,cy(),{width:CW,characterSpacing:0.4});
  doc.moveDown(0.2);
}
function body(t:string,indent=0){
  safe(20);
  doc.font(FR).fontSize(8.5).fillColor(C.slate).text(t,M.l+indent,cy(),{width:CW-indent,lineGap:2});
  doc.moveDown(0.4);
}
function kv(k:string,v:string,lw=100){
  safe(16);
  const ky=cy();
  doc.font(FB).fontSize(8).fillColor(C.muted).text(k+":",M.l,ky,{width:lw,lineBreak:false});
  doc.font(FR).fontSize(8.5).fillColor(C.slate).text(v,M.l+lw+4,ky,{width:CW-lw-4});
  doc.moveDown(0.3);
}
function bullet(items:string[],accent=C.violet,indent=8){
  for(const item of items){
    safe(18);
    const by=cy();
    doc.save().circle(M.l+indent-2,by+5.5,2.2).fill(accent).restore();
    doc.font(FR).fontSize(8.5).fillColor(C.slate).text(item,M.l+indent+4,by,{width:CW-indent-6,lineGap:1.5});
    doc.moveDown(0.25);
  }
}
function twoCol(items:{label:string;body:string}[],gap=10){
  const cw=(CW-gap)/2; const lx=M.l; const rx=M.l+cw+gap;
  const sy=cy(); let maxY=sy;
  const left=items.filter((_,i)=>i%2===0), right=items.filter((_,i)=>i%2!==0);
  doc.y=sy;
  left.forEach(it=>{
    safe(28);
    doc.font(FB).fontSize(8.5).fillColor(C.indigoMid).text(it.label,lx,doc.y,{width:cw});
    doc.font(FR).fontSize(8).fillColor(C.slate).text(it.body,lx,doc.y,{width:cw,lineGap:1.5});
    doc.moveDown(0.5); maxY=Math.max(maxY,doc.y);
  });
  doc.y=sy;
  right.forEach(it=>{
    safe(28);
    doc.font(FB).fontSize(8.5).fillColor(C.indigoMid).text(it.label,rx,doc.y,{width:cw});
    doc.font(FR).fontSize(8).fillColor(C.slate).text(it.body,rx,doc.y,{width:cw,lineGap:1.5});
    doc.moveDown(0.5); maxY=Math.max(maxY,doc.y);
  });
  doc.y=maxY;
}
function callout(text:string,color=C.violet,bg="#ede9fe"){
  safe(50);
  const oy=cy();
  const lh=doc.heightOfString(text,{font:FI,size:8.5,width:CW-20})+22;
  doc.save().rect(M.l,oy,CW,lh).fill(bg).restore();
  doc.save().rect(M.l,oy,4,lh).fill(color).restore();
  doc.font(FI).fontSize(8.5).fillColor(C.slate).text(text,M.l+12,oy+8,{width:CW-18,lineGap:2});
  doc.y=oy+lh+6;
}

// funding pill table — used for the funding pathways page
function fundingTable(rows:{category:string;programs:string;funder:string;notes:string}[]){
  const cols=[{x:M.l,w:90},{x:M.l+94,w:148},{x:M.l+246,w:110},{x:M.l+360,w:152}];
  const hdrs=["Category","Programs / Tools","Lead Funder","Notes"];
  // header row
  safe(22);
  const hy=cy();
  doc.save().rect(M.l,hy,CW,14).fill(C.indigo).restore();
  hdrs.forEach((h,i)=>doc.font(FB).fontSize(7).fillColor(C.white).text(h,cols[i].x+3,hy+4,{width:cols[i].w-4,lineBreak:false}));
  doc.y=hy+16;
  rows.forEach((r,idx)=>{
    const vals=[r.category,r.programs,r.funder,r.notes];
    const rowH=Math.max(...vals.map((v,i)=>doc.heightOfString(v,{font:i===0?FB:FR,size:7.5,width:cols[i].w-6})))+6;
    safe(rowH+6);
    const ry=cy();
    if(idx%2===0) doc.save().rect(M.l,ry,CW,rowH).fill(C.offWhite).restore();
    vals.forEach((v,i)=>doc[i===0?'font':'font'](i===0?FB:FR).fontSize(7.5)
      .fillColor(i===0?C.indigoMid:C.slate)
      .text(v,cols[i].x+3,ry+3,{width:cols[i].w-6,lineGap:1.2}));
    doc.y=ry+rowH;
    doc.moveDown(0.1);
  });
}

// ════════════ COVER ══════════════════════════════════════════════════════════
doc.rect(0,0,PAGE.w,PAGE.h).fill(C.indigo);
doc.rect(0,PAGE.h*0.60,PAGE.w,PAGE.h*0.40).fill(C.emerald);
doc.rect(0,0,PAGE.w,6).fill(C.gold);
for(let i=0;i<8;i++) doc.save().opacity(0.03).moveTo(PAGE.w*0.55+i*28,0).lineTo(PAGE.w,PAGE.h*0.5-i*22).lineWidth(18).strokeColor(C.white).stroke().restore();

if(LOGO) doc.image(LOGO,PAGE.w/2-56,60,{width:112,height:112});

doc.font(FB).fontSize(30).fillColor(C.white).text("ThriveUp Academy",M.l,196,{width:CW,align:"center"});
doc.font(FB).fontSize(13).fillColor(C.gold).text("The Collaborative Advocate Foundation  ·  TCAF",M.l,234,{width:CW,align:"center"});
doc.save().rect(M.l+60,268,CW-120,1).fill(C.gold).restore();
doc.font(FI).fontSize(10.5).fillColor("rgba(255,255,255,0.82)")
  .text("The Nonprofit for Nonprofits. Built from Community. Powered by Data.",M.l,278,{width:CW,align:"center"});
doc.save().rect(M.l+60,298,CW-120,1).fill(C.gold).restore();

const cols3=[
  {label:"Division",val:"Community Dev · Behavioral Health\nWorkforce · Education · Justice\nHealth Equity · Agriculture · Rural"},
  {label:"Status",   val:"Operational — Pilot Phase\nTravis County, Texas\n50-State Architecture Ready"},
  {label:"Scale",    val:"15 Platforms  ·  271 Tables\n107 Languages  ·  721 Grants\n24+ Federal Benefit Programs"},
];
cols3.forEach(({label,val},i)=>{
  const mx=M.l+i*(CW/3);
  doc.font(FB).fontSize(7).fillColor(C.gold).text(label.toUpperCase(),mx,318,{width:CW/3-6});
  doc.font(FR).fontSize(8).fillColor("rgba(255,255,255,0.82)").text(val,mx,332,{width:CW/3-6});
});

// 15 platforms strip
const plats=["Whole-Person Health","Talk Your Talk","Sankofa Network","Black Maternal Health","Black Men's Health","HerHealth Network","SafeCogniCare","Perfectly Different","LifeBridge","Mission Transition","Minority Ctr of Excellence","ISSS","RPLICE/BetterScience","SafeReport","Civic Signal"];
let px=M.l; let py=385;
doc.font(FB).fontSize(6.5).fillColor(C.gold).text("15 PUBLIC-FACING PLATFORMS:",M.l,py,{lineBreak:false}); py+=13;
for(const p of plats){
  const tw=doc.widthOfString(p,{font:FR,size:6.5})+10;
  if(px+tw>PAGE.w-M.r){py+=13;px=M.l;}
  doc.save().rect(px,py,tw,11).fill("rgba(255,255,255,0.10)").restore();
  doc.font(FR).fontSize(6.5).fillColor("rgba(255,255,255,0.78)").text(p,px+5,py+2,{lineBreak:false});
  px+=tw+3;
}

const pbY=PAGE.h*0.61+16;
doc.font(FB).fontSize(8).fillColor(C.gold).text("PREPARED BY",M.l,pbY,{width:CW});
doc.font(FB).fontSize(12).fillColor(C.white).text("The Collaborative Advocate Foundation (TCAF)",M.l,pbY+14,{width:CW});
doc.font(FR).fontSize(9).fillColor("rgba(255,255,255,0.78)").text("Terry D. Flood, Ph.D., President",M.l,pbY+30,{width:CW});
doc.font(FR).fontSize(8.5).fillColor("rgba(255,255,255,0.58)").text("terryflood@thrivingcommunitiesforall.com  ·  thriveup.app",M.l,pbY+43,{width:CW});
const credY=pbY+64;
[{t:"EIN 41-3618003",s:"IRS 501(c)(3) Public Charity"},{t:"SAM UEI KDDVD1FGLW35",s:"CAGE 209N1 · Active 2027-05-06"},{t:"Two-Entity Strategy",s:"TCAF Nonprofit + ISS LLC (SBIR/STTR)"}]
.forEach(({t,s},i)=>{
  const cx=M.l+i*(CW/3);
  doc.save().rect(cx,credY,CW/3-6,30).fill("rgba(0,0,0,0.22)").restore();
  doc.font(FB).fontSize(7.5).fillColor(C.gold).text(t,cx+6,credY+5,{width:CW/3-14});
  doc.font(FR).fontSize(7).fillColor("rgba(255,255,255,0.62)").text(s,cx+6,credY+17,{width:CW/3-14});
});
doc.font(FR).fontSize(7.5).fillColor("rgba(255,255,255,0.30)")
  .text("VERSION 1.0  ·  JUNE 2026  ·  CONFIDENTIAL  ·  INVESTMENT & PARTNERSHIP READY",M.l,PAGE.h-28,{width:CW,align:"center",lineBreak:false});

// ════════════ PAGE 1 — STRATEGIC OVERVIEW ═══════════════════════════════════
newPage("Strategic Overview","Page 1 of 6");
banner("Strategic Overview",C.indigo,"Mission · Vision · Problem · Market · Stakeholders");

h3("Mission");
callout("To build, equip, and sustain the community infrastructure that nonprofits, service organizations, and the individuals they serve need — connecting people to funding, aligning service delivery with workforce development, and producing measurable community impact at every level of need.",C.indigo,"#e0e7ff");

h3("Vision");
body("A nation where every community organization has the data, technology, and partnerships to turn passion into lasting, provable impact — and every person has a structured growth pathway from their first moment of need to contributing in their community.");

hRule(); doc.moveDown(0.5);
h3("Executive Summary");
body("ThriveUp Academy / TCAF is a national community-infrastructure platform and the nonprofit for nonprofits — 15 public-facing service platforms, a 5-trade workforce simulation and credentialing engine, a live grant intelligence system tracking 721 opportunities, 24+ federal benefit program pathways, a dedicated rural equity suite, and agriculture tools — all under a single integrated architecture built to serve any U.S. county. Organizations use ThriveUp to discover funding, train and credential their workforce, measure outcomes, and demonstrate impact. Individuals use it to navigate benefits, build careers, access health services, and track growth through the ALIGN framework. Piloting in Travis County, Texas through a two-entity structure (TCAF 501c3 + ISS LLC SBIR/STTR-eligible) with a Hub Adoption Kit ready for 50-state replication.");

hRule(); doc.moveDown(0.4);
h3("Problem");
twoCol([
  {label:"For Nonprofits",body:"Most CBOs lack grant intelligence, outcome measurement tools, and implementation-science frameworks to compete for federal funding and prove impact. Technology is expensive, siloed, English-only."},
  {label:"For Individuals & Families",body:"People navigating housing instability, workforce barriers, health disparities, justice involvement, and family crisis cycle through services without a growth pathway or documented progress."},
  {label:"For Rural Communities",body:"Rural counties face broadband deserts, hospital closures, agricultural economic stress, and connectivity gaps — while funding programs (USDA ReConnect, FQHC, FSA) go unclaimed from lack of navigation tools."},
  {label:"For Funders",body:"Funders see activity, not movement. Without a shared growth language and cross-sector outcome framework, community investment cannot demonstrate longitudinal transformation."},
]);

safe(160); hRule(); doc.moveDown(0.4);
h3("Market Opportunity");
twoCol([
  {label:"Market Size",body:"1.5M+ U.S. nonprofits. 40M+ Americans in poverty. $50B+ annual federal community development, workforce, health, and justice funding. $4.5B WIOA. $9.8B Title IV-E. $3.5B USDA Rural Development."},
  {label:"Funding Landscape",body:"HHS, DOL, DOJ, HUD, USDA, NSF, VA, DOEd, SAMHSA, HRSA, CDC. State: HHSC, TWC. Private: RWJF, Annie E. Casey, W.K. Kellogg, JPMorgan Chase, St. David's Foundation."},
  {label:"Policy Drivers",body:"SDOH equity mandates. FHIR interoperability. USDA rural broadband investment. DOL equity workforce agenda. Family First Prevention Services. AI literacy for workforce. Rural health access."},
  {label:"Timing",body:"Post-COVID recovery infrastructure investment. Funder shift from activity to evidence. Growing demand for cross-sector frameworks. SBIR/STTR expansion. Rural equity investment surge."},
]);

safe(200); hRule(); doc.moveDown(0.4);
h3("Stakeholders");
[
  ["Individuals & Families","Adults navigating housing, workforce, health, justice re-entry, foster care, and family crisis — served in 107 languages and dialects including AAVE, Spanglish, and signed languages."],
  ["Nonprofit Organizations","CBOs, faith communities, CHW networks, workforce programs, and social enterprises — using TCAF to find funding, train staff, prove outcomes, and connect to an ecosystem."],
  ["Rural & Agricultural Communities","Farmers, farmworkers, H-2A visa workers, rural residents facing hospital deserts, broadband gaps, and FSA program complexity — served by 6 dedicated rural tools and ag-specific pathways."],
  ["Government Agencies","City/county human services, state workforce and health agencies, federal grantmakers — using TCAF data for accountability, co-investment, and service delivery."],
  ["Researchers & Evaluators","Implementation scientists, university partners, think tanks — using CFIR/RE-AIM/EPIS tools and outcomes data for publication and policy influence."],
  ["Funders & Philanthropists","Foundation program officers, federal grant officers, impact investors — using ALIGN community dashboards and TCAF evidence packages to understand community transformation."],
  ["Shadow Workers","Informal caregivers, promotoras, peer mentors, driveway journeymen — credentialed and stipended through the Integration Through Invitation (ITI) model."],
  ["Industry & Employers","Healthcare systems, equity-committed employers, CDFIs, apprenticeship sponsors — accessing workforce pipeline, credential data, and hiring tools."],
].forEach(([label,desc])=>{
  safe(26);
  const sy=cy();
  doc.save().rect(M.l,sy,3,16).fill(C.violet).restore();
  doc.font(FB).fontSize(8.5).fillColor(C.indigoMid).text(label+":",M.l+8,sy,{width:145,lineBreak:false});
  doc.font(FR).fontSize(8.5).fillColor(C.slate).text(desc,M.l+158,sy,{width:CW-158,lineGap:1.5});
  doc.moveDown(0.38);
});

// ════════════ PAGE 2 — 15 PLATFORMS + RURAL + AG ══════════════════════════
newPage("Programs & Platforms","Page 2 of 6");
banner("Programs & Platforms",C.emerald,"15 Service Platforms · Rural Equity Suite · Agriculture Tools · Child Care");

h3("The 15 Public-Facing Service Platforms");

const domainColor:Record<string,string>={
  "Health Equity":C.ruby,"Behavioral Health":C.emeraldMid,"SDOH Navigation":C.emeraldLt,
  "Civic Engagement":C.indigoLt,"Research":C.violet,"Clinical / BH":C.emerald,
  "Health / Community":C.gold,"Youth / Education":C.goldLt,
  "Veterans":C.indigo,"Disability / IDD":C.indigoMid,"Community":C.violet,
};
const platforms=[
  {name:"Whole-Person Health (WPH)",domain:"Health Equity",desc:"Behavioral safety floor. PHQ-9, GAD-7, C-SSRS, PCL-5, ACES validated instruments. Longitudinal SDOH screening."},
  {name:"Talk Your Talk (TYT)",domain:"Civic Engagement",desc:"talkyourtalk.net — 89 spoken + 18 signed dialects = 107 total. AAVE, Spanglish, ASL, LSM honored. RTL layout for Arabic/Hebrew."},
  {name:"Sankofa Network",domain:"Health / Community",desc:"Cultural health platform rooted in African heritage. Bridges clinical services and community wisdom traditions."},
  {name:"Black Maternal Health Network",domain:"Health Equity",desc:"Maternal health navigation, doula/midwife directories, prenatal screening, maternal mortality risk reduction."},
  {name:"Black Men's Health Hub",domain:"Health Equity",desc:"Preventive care, mental health, and navigation resources specifically designed for and by Black men."},
  {name:"HerHealth Network",domain:"Health Equity",desc:"Holistic Black Feminine Health Hub. 70-condition coverage. CDMRP-aligned. Integrative health and reproductive justice."},
  {name:"SafeCogniCare",domain:"Behavioral Health",desc:"Cognitive health and dementia navigation. Caregiver burnout screening. Family resource routing."},
  {name:"Perfectly Different",domain:"Disability / IDD",desc:"Disability and IDD platform. Accessibility-first. SSI/SSDI navigation. Self-advocacy tools."},
  {name:"LifeBridge",domain:"SDOH Navigation",desc:"SDOH navigation hub. 9+ benefit programs screened per session. Warm referral handoffs. ALIGN on-ramp."},
  {name:"Mission Transition (M2C)",domain:"Veterans",desc:"Military-to-civilian. Benefits, employment, housing, and SDOH navigation. SSG Fox VA pathway integration."},
  {name:"Minority Center of Excellence",domain:"Community",desc:"Technical assistance hub for minority-serving orgs. Grant readiness, data literacy, SBIR/STTR navigation."},
  {name:"ISSS",domain:"Youth / Education",desc:"Integrated Supports for Thriving Youth. Multi-agency case management. 50-state foster care policy comparator."},
  {name:"RPLICE / BetterScience",domain:"Research",desc:"Research-to-Practice Lifecycle. CFIR/RE-AIM/EPIS tooling. MAP-GAP CQI. Outcomes reporting dashboards."},
  {name:"SafeReport",domain:"Clinical / BH",desc:"safereports.net — Compliance-grade AI for clinical settings. FHIR/CDS-Hooks. 0-PHI-egress. HITL-default-on."},
  {name:"Civic Signal",domain:"Civic Engagement",desc:"Civic engagement, advocacy tracking, policy navigation. Community voice. Election and policy information hub."},
];
platforms.forEach(p=>{
  safe(36);
  const py2=cy(); const dc=domainColor[p.domain]||C.indigo;
  doc.save().rect(M.l,py2,2,24).fill(dc).restore();
  doc.save().rect(M.l+2,py2,88,11).fill(dc).restore();
  doc.font(FB).fontSize(6.5).fillColor(C.white).text(p.domain.toUpperCase(),M.l+5,py2+2,{width:84,lineBreak:false});
  doc.font(FB).fontSize(8.5).fillColor(dc).text(p.name,M.l+8,py2+13,{width:CW-12});
  doc.font(FR).fontSize(7.5).fillColor(C.slate).text(p.desc,M.l+8,doc.y,{width:CW-12,lineGap:1.4});
  doc.moveDown(0.5);
});

safe(50); hRule(); doc.moveDown(0.4);
h3("Rural Equity Suite — 6 Dedicated Tools");
body("TCAF is one of the only community platforms with a dedicated rural infrastructure stack. Six tools specifically built for rural counties facing hospital deserts, broadband gaps, agricultural stress, and USDA program complexity.");
twoCol([
  {label:"Rural Workforce",body:"NFJP-eligible pathway finder. Career mapping across 10 tracks (technical, conservation, ag, health, energy, market). State-by-state training resources. 18 states with FIPS codes."},
  {label:"Rural Connectivity",body:"FCC broadband availability checker. USDA ReConnect eligibility. Community Facilities grants. Service desert scoring. Cell coverage alternatives. GPS-coordinate-level analysis."},
  {label:"Rural Health",body:"Farm stress crisis lines. FQHC finder. Hospital closure risk scores. Telehealth access mapping. Maternal care deserts. Rural health grant navigation. 35 states covered."},
  {label:"Rural Housing",body:"Rural housing program navigation and screening. USDA Section 502/504 direct and guaranteed loans. Self-help housing. Rural rental assistance programs."},
  {label:"Rural Intel",body:"County-level intelligence dashboard. Typeahead search by county name or FIPS. Poverty, workforce, health, and infrastructure data. Gap analysis for funders and planners."},
  {label:"Rural Alerts",body:"Real-time rural emergency and resource alerts. Agricultural disaster declarations. USDA program deadline alerts. Community Facilities grant announcement notifications."},
]);

safe(60); hRule(); doc.moveDown(0.4);
h3("Agriculture & Farmworker Tools");
twoCol([
  {label:"FSA Eligibility Engine",body:"USDA Farm Service Agency program eligibility logic. Row crop, livestock, conservation, and specialty crop programs. State and county office routing."},
  {label:"Farm Cooperative Navigator",body:"Cooperative formation guidance, shared equipment pools, value-add processing pathways, USDA cooperative development grants."},
  {label:"Farm Profitability Tools",body:"Enterprise budgeting, input cost analysis, market access pathways, crop insurance navigation."},
  {label:"Producer Voice",body:"Input cost crisis, market access barriers, climate stress — farmer and rancher advocacy and data tools. Structured voice channel for ag communities."},
  {label:"Farmworker ITI",body:"Integration Through Invitation for seasonal farmworkers and H-2A visa workers in English and Spanish. Rights navigation, wage theft resources, housing assistance."},
  {label:"Agricultural Trade Sims",body:"Ag-specific simulation modules. Conservation practices, precision agriculture tools, soil health modeling."},
]);

safe(60); hRule(); doc.moveDown(0.4);
h3("Child Care Funding & Workforce Tools");
twoCol([
  {label:"Child Care Workforce Hub",body:"$9.3B annual TX productivity loss from child care gaps (US Chamber, 2022). $12.7B annual US employer cost (Council for a Strong America, 2023). Workforce training and credential pathways for child care providers."},
  {label:"North Texas Child Care",body:"Regional child care needs mapping. Provider directory. Quality improvement pathways. Child Care & Development Fund (CCDF) navigation."},
  {label:"Wilco Child Care Hub",body:"North Wilco Childcare Coalition workspace. CCAMPIS strategy. Travis/Williamson County enrollment targeting. TWC-CCS coordination."},
  {label:"WAB2 Enrollment Hub",body:"Multi-factor eligibility + enrollment engine. Travis County (80 target), Williamson County (350 target). Pflugerville corridor. CCAMPIS and ARPA remainder fund alignment."},
]);

// ════════════ PAGE 3 — TRAINING, EDUCATION, RESEARCH, TECHNOLOGY ══════════
newPage("Training, Education, Research & Technology","Page 3 of 6");
banner("Training · Education · Research · Technology",C.indigoMid,"Trade Simulation · Academy · Implementation Science · AI Stack");

h3("Training & Simulation — ThriveUp Academy Trade Sims");
body("5 industry-grade physics simulations, 15 lessons each (75 total), AI tutoring in 10 languages, credential routing at 80% completion. Real physics calculations — not animations.");
const trades=[
  {t:"Electrical",e:"Modified Nodal Analysis (MNA) DC Solver",s:"Standard undergraduate EE",c:"OSHA 10 · IBEW/NECA · NCCER L1"},
  {t:"Automotive",e:"MNA via Adapter (component-defs.ts)",s:"Reuses EE solver — engineering-clean",c:"ASE G1 · OEM Tech · NCCER"},
  {t:"Plumbing",  e:"Hardy-Cross Newton-Raphson Flow Solver",s:"Standard civil/mechanical pipe-network",c:"TSBPE · UA pathway · NCCER L1"},
  {t:"Welding",   e:"Heat-Input Evaluator per AWS D1.1 §5.7",s:"American Welding Society Structural Code",c:"AWS SENSE · AWS D1.1 · Iron Workers"},
  {t:"HVAC",      e:"Thermal-Airflow Engine",s:"Thermal equilibrium + duct flow model",c:"EPA 608 Universal · NATE RTW · SMART"},
];
trades.forEach(({t,e,s,c})=>{
  safe(30);
  const ty=cy();
  doc.save().rect(M.l,ty,26,20).fill(C.indigoMid).restore();
  doc.font(FB).fontSize(7.5).fillColor(C.white).text(t.slice(0,4).toUpperCase(),M.l+1,ty+6,{width:26,align:"center",lineBreak:false});
  doc.font(FB).fontSize(8.5).fillColor(C.indigoMid).text(t,M.l+32,ty,{width:90});
  doc.font(FR).fontSize(7.5).fillColor(C.muted).text(e+" — "+s,M.l+32,doc.y,{width:CW-34});
  doc.font(FR).fontSize(7.5).fillColor(C.slate).text("Credentials: "+c,M.l+32,doc.y,{width:CW-34});
  doc.moveDown(0.45);
});
body("Credential routing fires at 80% completion — in production at server/trade-sims-cert-routes.ts. 9 certifications: OSHA, NCCER, AWS, ASE, EPA, NATE, TDLR, TSBPE. 2–3 registered apprenticeship pathways per trade.");

safe(60); hRule(); doc.moveDown(0.4);
h3("Education — ThriveUp Academy Learning Engine");
twoCol([
  {label:"Live Economic Simulation",body:"academyWallets, academyStocks, academyPortfolios — real market simulation. academyCompetitions for gamified cohorts. academyMerchOrders for real fulfillment. academyPantherPower GAM-ready merit scoring."},
  {label:"Financial & Civic Literacy",body:"academyLifeLessons: financial literacy, civic engagement, SDOH navigation, health literacy. Behavioral audit trail (academy_choice_logs). Full outcomes record per learner."},
  {label:"Branching Narrative Scenarios",body:"academyScenarios + nodes + logs: interactive branching stories for FAFSA, foster care, workforce decisions. Full behavioral audit trail for research and outcome reporting."},
  {label:"FAFSA & College Access",body:"FAFSA navigation, financial aid literacy, college application support. Chafee / ETV for foster youth. Scholarship search with AI fit-scoring. 50-state policy comparator."},
  {label:"AI Literacy + STEM",body:"AI-ready workforce training modules. Computational thinking. Data literacy. STEM pathway planning aligned to workforce demand in local labor markets."},
  {label:"PM Academy",body:"Project management training for nonprofit and community leaders. Grant management, outcome tracking, team coordination, and stakeholder communication skills."},
]);

safe(60); hRule(); doc.moveDown(0.4);
h3("Research & Implementation Science");
twoCol([
  {label:"CFIR 2.0 — 39 Constructs",body:"5 CFIR domains, 39 constructs operationalized in research-hub.tsx. Standards-routes.ts maps capabilities to NRRC and CFIR 2.0 fidelity benchmarks."},
  {label:"RE-AIM + EPIS",body:"RE-AIM community-level evaluation at THRIVE phase. EPIS org readiness (Exploration → Preparation → Implementation → Sustainment) across ALIGN phases."},
  {label:"RNR / CBI / NRRC — Justice",body:"Risk-Need-Responsivity, Cognitive Behavioral Intervention, and NRRC outcome reports. Gold standard in criminal justice corrections. Recidivism baselines tracked over time."},
  {label:"MAP-GAP CQI",body:"1,705-line continuous quality improvement engine. Identifies and prioritizes ecosystem gaps. Drives funder recruitment and partner coordination decisions."},
  {label:"RPLICE Bridge",body:"Auto-routes analysis findings to relevant platforms (BH findings → SafeReport). Cross-platform intelligence. Grounded in active-commitment docs, not generic web."},
  {label:"Outcomes & Evidence",body:"Funder-grade outcome dashboards. NRRC outcome reports. Evidence Registry (communityEvidence table). Platform-Funder fit table (platformFunderFit). Donor outcome receipts."},
]);

safe(60); hRule(); doc.moveDown(0.4);
h3("AI Stack — We Don't Use AI. We Orchestrate It.");
twoCol([
  {label:"4-Engine Collaborative Synthesis",body:"Gemini 2.0 Flash · Claude Haiku 4.5 · GPT-4o-mini · OpenRouter DeepSeek R1. Resilience architecture: any engine outage doesn't break the session. All calls auto-wrapped in Ethical/EI Preamble."},
  {label:"86-Chunk RAG Engine",body:"Grounded in TCAF's own active-commitment documents. Relevant platform docs, evidence registry, and grant intelligence feed the knowledge base — not the generic web."},
  {label:"107-Language Dialect-Aware Translation",body:"Preserves AAVE, Spanglish, and regional dialects. RTL layout for Arabic/Hebrew. Socratic-hint + ensemble-debrief AI tutor modes. 10 languages in Trade Sims."},
  {label:"AI Grant Intelligence",body:"Tier-weighted keyword scoring (e.g., 'PHI-safe' +10, 'HITL' +12) + semantic AI fit-analysis. 721 grants tracked. Weekly digest. AI proposal drafting + RFP fidelity compliance matrix."},
]);

h3("Platform Scale (Primary-Source Verified, 2026-05-22)");
const scale=[["271","Drizzle/PostgreSQL tables"],["211","Frontend pages"],["84","Server route/logic files"],
  ["721","Grants tracked across SAM.gov, Grants.gov, USASpending.gov"],["107","Languages / dialects (89 spoken + 18 signed)"],
  ["75","Trade simulation lessons (5 trades × 15)"],["39","CFIR constructs operationalized in code"],
  ["24+","Federal benefit program pathways"],["6","Dedicated rural equity tools"],["15","Public-facing service platforms"],
];
scale.forEach(([n,l])=>{
  safe(16);
  const sy=cy();
  doc.save().rect(M.l,sy,42,14).fill(C.indigo).restore();
  doc.font(FB).fontSize(10).fillColor(C.gold).text(n,M.l,sy+1,{width:42,align:"center",lineBreak:false});
  doc.font(FR).fontSize(8.5).fillColor(C.slate).text(l,M.l+48,sy+3,{width:CW-50,lineBreak:false});
  doc.moveDown(0.68);
});

// ════════════ PAGE 4 — FUNDING PATHWAYS ══════════════════════════════════
newPage("Funding Pathways","Page 4 of 6");
banner("Funding Pathways — The Complete Picture",C.ruby,"Federal Benefits · USDA · DOL · HHS · HUD · DOJ · Child Care · Housing · Veterans · Justice · SBIR");

callout("ThriveUp Academy navigates funding across every major federal agency and dozens of state and private streams. This is not a single grant pipeline — it is a comprehensive funding ecosystem covering individuals, families, organizations, agricultural producers, rural communities, veterans, justice-involved adults, and nonprofits seeking capital.",C.ruby,"#fff1f2");

h3("Federal Benefit Programs — 24+ Pathways for Individuals & Families");
fundingTable([
  {category:"Healthcare",programs:"Medicaid · CHIP · Medicare · ACA Marketplace · Healthy Texas Women · VA Health Care · IHS · Ryan White HIV/AIDS",funder:"HHS / CMS / VA",notes:"Screened per session via LifeBridge. All 50 states."},
  {category:"Food & Nutrition",programs:"SNAP · WIC · School Breakfast/Lunch · TEFAP · SFMNP",funder:"USDA FNS",notes:"Benefits screener. SNAP CPP focus group pathway active."},
  {category:"Income Support",programs:"SSI · SSDI · TANF · EITC · Child Tax Credit (CTC)",funder:"SSA / IRS / HHS",notes:"Integrated into benefits command center."},
  {category:"Housing & Energy",programs:"Section 8 HCV · HUD-VASH (Veterans) · LIHEAP · Weatherization · HOME Investment",funder:"HUD / DOE",notes:"Austin Housing Initiative + rural housing tools."},
  {category:"Child Care & Family",programs:"CCDF/CCDS · Head Start / Early Head Start · CCAMPIS · Child Tax Credit · Title IV-B/E",funder:"HHS ACF / DOEd",notes:"WAB2 enrollment hub. N. Wilco Coalition. Child care workforce tools."},
  {category:"Telecommunications",programs:"Lifeline · ACP (broadband) · E-Rate · USDA ReConnect",funder:"FCC / USDA",notes:"Rural Connectivity tool. FCC broadband availability checker."},
  {category:"Legal & Safety",programs:"Legal Aid (LSC) · VAWA housing protections · Elder Justice Act · DV shelters",funder:"DOJ / HHS",notes:"Safe Passage platform. LifeBridge routing."},
  {category:"Education / FAFSA",programs:"Pell Grant · FSEOG · Work-Study · Direct Loans · Chafee ETV · GEAR UP",funder:"DOEd",notes:"FAFSA Navigator. Foster youth Chafee/ETV routing."},
]);

safe(60); hRule(); doc.moveDown(0.5);
h3("USDA & Agriculture Funding Pathways");
fundingTable([
  {category:"Farm Service Agency",programs:"CRP · ARC/PLC · ARCPLC · Emergency Loans · Farm Storage Facility Loans",funder:"USDA FSA",notes:"FSA Eligibility Engine. All major program types."},
  {category:"Rural Development",programs:"Section 502/504 Direct & Guaranteed Loans · RBDG · USDA ReConnect · Community Facilities",funder:"USDA RD",notes:"Rural Housing + Connectivity tools."},
  {category:"NRCS Conservation",programs:"EQIP · CSP · RCPP · ACEP · REAP",funder:"USDA NRCS",notes:"Linked from Rural Intel + Farm Profitability."},
  {category:"Farmworker Support",programs:"NFJP (National Farmworker Jobs Program) · H-2A rights · MSFW services",funder:"DOL",notes:"Rural Workforce tool. Farmworker ITI. Spanish-language."},
  {category:"Value-Add / Cooperative",programs:"VAPG · RCDG · Agricultural Marketing Promotion",funder:"USDA AMS / RD",notes:"Farm Cooperative Navigator."},
]);

safe(60); hRule(); doc.moveDown(0.5);
h3("Workforce & Economic Development Funding");
fundingTable([
  {category:"Workforce Development",programs:"WIOA Title I Adult/Dislocated · Title II Adult Ed · Perkins V · H-1B Training Grants",funder:"DOL ETA",notes:"Trade Sims credential routing. Workforce tools."},
  {category:"Texas Workforce",programs:"TWC Skills Development Fund · Self-Sufficiency Fund · Child Care Services (CCS)",funder:"TWC",notes:"Trade Sims + child care workforce tools."},
  {category:"Apprenticeship",programs:"Apprenticeship Building America (ABA) · ApprenticeshipUSA · IBEW/UA/ABC pathways",funder:"DOL",notes:"5 trades × 2–3 apprenticeship pathways each."},
  {category:"Small Business / SBIR",programs:"SBIR Phase I/II/III · STTR · APEX Accelerators (formerly PTACs) · SBA 8(a)",funder:"SBA / NSF / HHS",notes:"ISS LLC eligible. APEX Accelerator tool. Minority Ctr of Excellence."},
  {category:"Opportunity Youth",programs:"YouthBuild · Job Corps · Second Chance Pell · Workforce Innovation",funder:"DOL / DOEd",notes:"Opportunity Youth page. ALIGN Navigate phase."},
]);

safe(60); hRule(); doc.moveDown(0.5);
h3("Health, Behavioral Health & Justice Funding");
fundingTable([
  {category:"Behavioral Health",programs:"SAMHSA CCBHC · SOR · MHBG · SABG · 988 Suicide & Crisis",funder:"SAMHSA / HHS",notes:"SafeReport. Whole-Person Health. Healthcare Grants tool."},
  {category:"Rural Health",programs:"HRSA FQHC · Rural Health Clinic · RHCDS · FLEX Program · Telehealth grants",funder:"HRSA",notes:"Rural Health Hub. FQHC finder. Hospital closure risk."},
  {category:"Women's Health",programs:"CDMRP (PRMRP/PRCRP) · Merck for Mothers · Black Maternal Health Initiative",funder:"DoD / HHS / Private",notes:"HerHealth Network. Black Maternal Health platform."},
  {category:"Justice / Reentry",programs:"Second Chance Act · RSAT · JAG (Byrne) · Reentry Housing Vouchers · SCA",funder:"DOJ / HUD",notes:"Justice Command Center. RNR/CBI/NRRC stack. Reentry stipend pilot."},
  {category:"Veterans",programs:"SSG Fox Suicide Prevention · HVRP · HUD-VASH · VR&E Chapter 31",funder:"VA / DOL VETS",notes:"Mission Transition platform. SSG Fox active pursuit."},
]);

safe(60); hRule(); doc.moveDown(0.5);
h3("Research, Innovation & Grant Intelligence");
fundingTable([
  {category:"Implementation Science",programs:"NIH R01/R34 · AHRQ · PCORI · Promise Neighborhoods (84.215N) · NSF TechAccess",funder:"NIH / NSF / DOEd",notes:"RPLICE. NSF 26-508 LOI active. Promise Neighborhoods pursuing."},
  {category:"Grant Intelligence Engine",programs:"721 grants tracked · SAM.gov · Grants.gov · USASpending.gov · Foundation/Corporate",funder:"Multiple",notes:"Tier-weighted AI fit-scoring. Weekly digest. RFP Fidelity Engine."},
  {category:"Community Development",programs:"CDBG · SSBG · Promise Zones · Choice Neighborhoods · Social Innovation Fund",funder:"HUD / HHS",notes:"Ecosystem Hub. Coalition portal. Community map."},
  {category:"Technology / AI",programs:"ARPA-H · NSF SBIR · DARPA · Dept of Commerce CHIPS",funder:"Federal R&D",notes:"ISS LLC SBIR/STTR pathway. AI tools hub."},
]);

// ════════════ PAGE 5 — TRACTION, REVENUE & IMPACT ════════════════════════
newPage("Traction, Revenue & Impact","Page 5 of 6");
banner("Traction · Revenue Model · Impact Framework · Validation",C.emerald);

h3("Current Operational Status");
[
  ["Platform","Operational — live at thriveup.app and lifetransitionsaid.org/thriveup/align"],
  ["Deployment","Active pilot — Travis County, TX (Williamson, Hays, Bastrop, Caldwell counties)"],
  ["Entity Status","TCAF 501(c)(3) determined 2026-01-14 · ISS LLC active · SAM.gov ACTIVE both entities"],
  ["Partners","Minority Center of Excellence · LifeBridge · SafeCogniCare · El Buen Samaritano · North Wilco Childcare Coalition"],
  ["Grant Pipeline","721 tracked opportunities · Fit ≥70 = 208 · ≥80 = 186 · ≥90 = 160 · Active pursuit queue maintained"],
  ["Codebase","271 tables · 211 pages · 84 server files · 206 routes — all primary-source-verified 2026-05-22"],
].forEach(([k,v])=>kv(k,v,95));

hRule(); doc.moveDown(0.4);
h3("Revenue Model — 5 Diversified Streams");
[
  {n:"1",l:"Federal & Foundation Grants",d:"HHS, DOL, DOJ, HUD, USDA, NSF, VA, DOEd, SAMHSA, HRSA, RWJF, Annie E. Casey, W.K. Kellogg, JPMorgan Chase. Multi-year grants. No single grant >40% of operating revenue by policy."},
  {n:"2",l:"Hub Adoption Kit — SaaS Licensing",d:"Packaged platform license for counties, states, or regional operators. Recurring SaaS revenue independent of grant cycles. Each Hub brings TCAF's full platform infrastructure to a new region."},
  {n:"3",l:"Government Service Contracts",d:"Direct service contracts with city, county, and state agencies. Benefits navigation, workforce simulation, community health, SDOH navigation. NAICS 624190 primary. SDVOSB status unlocks VA set-asides."},
  {n:"4",l:"SBIR / STTR (ISS LLC)",d:"ISS LLC (CAGE 9VKK3) SBIR/STTR-eligible. AI tutoring engine, physics simulation, dialect-aware translation, and rural connectivity tools are viable Phase I/II candidates across NSF, HHS, and DoD."},
  {n:"5",l:"Research Partnerships",d:"University and think-tank partnerships for evaluation design, data access (ITI-consented), co-publication, and implementation science training. Overhead-eligible on federal research grants."},
].forEach(({n,l,d})=>{
  safe(36);
  const ry=cy();
  doc.save().rect(M.l,ry,20,20).fill(C.emerald).restore();
  doc.font(FB).fontSize(9).fillColor(C.gold).text(n,M.l+2,ry+5,{width:18,align:"center",lineBreak:false});
  doc.font(FB).fontSize(9).fillColor(C.emerald).text(l,M.l+26,ry,{width:CW-28});
  doc.font(FR).fontSize(8).fillColor(C.slate).text(d,M.l+26,doc.y,{width:CW-28,lineGap:1.5});
  doc.moveDown(0.5);
});

safe(80); hRule(); doc.moveDown(0.4);
h3("Impact Framework");
[
  {l:"Inputs",b:"Org assessments, individual journeys, benefits screened, program data, grant intelligence, workforce completions, rural connectivity data, farmworker ITI consents, research data — all ITI-consented."},
  {l:"Activities",b:"ALIGN journey facilitation · benefits navigation · trade simulation + credentialing · grant intelligence + proposal writing · org capacity building · rural/ag tool navigation · clinical screening · coalition coordination."},
  {l:"Outputs",b:"ALIGN phase advancement events · org capacity scores · benefits matches · credential completions · grants submitted · clinical screenings · community THRIVE Index scores · rural service desert reductions."},
  {l:"Outcomes",b:"Individuals advancing from crisis to contribution · orgs increasing grant-readiness · practitioners credentialed · rural residents accessing unclaimed federal programs · communities reducing phase gaps."},
  {l:"KPIs",b:"% individuals advancing ≥1 ALIGN phase per 90 days · grant win rate · credential completions per quarter · rural program claims facilitated · org capacity score change · community THRIVE Index trend."},
].forEach(({l,b})=>{
  safe(26);
  const iy=cy();
  doc.save().rect(M.l,iy,3,18).fill(C.gold).restore();
  doc.font(FB).fontSize(8.5).fillColor(C.indigoMid).text(l,M.l+9,iy,{width:82,lineBreak:false});
  doc.font(FR).fontSize(8).fillColor(C.slate).text(b,M.l+98,iy,{width:CW-98,lineGap:1.5});
  doc.moveDown(0.45);
});

safe(80); hRule(); doc.moveDown(0.4);
h3("Validation Strategy");
twoCol([
  {label:"Implementation Science",body:"CFIR 39 constructs + RE-AIM community evaluation + EPIS org readiness. Standards-routes.ts maps capabilities to NRRC and CFIR 2.0 fidelity benchmarks."},
  {label:"Justice Stack",body:"RNR assessments + CBI programs + NRRC outcome reports. Recidivism baselines tracked over time. Gold standard in corrections research."},
  {label:"Clinical Validation",body:"PHQ-9, GAD-7, C-SSRS, PCL-5, ACES in SafeReport. FHIR/CDS-Hooks clinical interoperability. HITL-default-on for all clinical workflows."},
  {label:"Continuous Improvement",body:"MAP-GAP CQI (1,705 lines) identifies ecosystem gaps. Quarterly data review. Phase transition velocity data improves resource recommendations."},
]);

// ════════════ PAGE 6 — ROADMAP & INVESTMENT ══════════════════════════════
newPage("Roadmap, Partnerships & Investment","Page 6 of 6");
banner("Roadmap · Partnerships · Risk · Investment Ask",C.indigoMid);

h3("12-Month Objectives (2026–2027)");
twoCol([
  {label:"Technology",body:"Mobile offline mode (Q4 2026). HMIS integration. Unite Us bidirectional referral sync. FHIR CDS-Hooks live clinical integration. 6th trade simulation. Rural tool API expansions."},
  {label:"Organizations & Users",body:"50+ org ALIGN assessments. 500+ individual journeys. 5 Hub deployments initiated. SDVOSB certification filed. APEX Accelerator enrollment for partner orgs."},
  {label:"Research",body:"First case study (Q3 2026). University research partnership signed. CFIR fidelity baseline published. NSF TechAccess submission. Promise Neighborhoods LOI."},
  {label:"Revenue",body:"First Hub licensing. 3 government service contracts. SBIR Phase I submitted. $500K+ ARR target. Federal agency pilot designation."},
]);

h3("24-Month Objectives (2027–2028)");
twoCol([
  {label:"Scale",body:"Hub Adoption Kit in 5+ additional counties/regions. 2 state government partnerships signed. Rural tool deployment in 3 additional USDA-targeted rural areas."},
  {label:"Validation",body:"Peer-reviewed ALIGN publication. Title IV-E Clearinghouse evaluation submitted. SBIR Phase II awarded. NRRC outcomes report published."},
  {label:"Revenue",body:"$1M+ ARR. Federal HHS/DOL agency recognition. GSA Schedule (ISS LLC). DOL/HHS pilot designation. Rural Development partnership."},
  {label:"Platforms",body:"3 additional platforms. SafeReport Epic integration live. RPLICE national IS community launched. USDA partnership for rural tools."},
]);

h3("36-Month Vision");
bullet([
  "National: Hub Adoption Kit in all 50 states. Federal strategic partner — HHS, DOL, DOJ, HUD, USDA.",
  "SDVOSB: VA sole-source contracts up to $5M once SBA VetCert certification complete.",
  "Research: TCAF publication stream. National CFIR/RE-AIM training and certification program.",
  "Rural: USDA Rural Development formal partnership. Rural connectivity tool adopted by 3+ state broadband offices.",
  "Agriculture: NFJP partnership for farmworker training. FSA eligibility engine cited in USDA grant proposals.",
  "Revenue: $5M ARR — grants, contracts, Hub licensing, research, SBIR.",
]);

safe(110); hRule(); doc.moveDown(0.4);
h3("Partnership Opportunities");
twoCol([
  {label:"Federal Funding Partners",body:"HHS, DOL, DOJ, HUD, USDA Rural Development, NSF, VA, DOEd, SAMHSA, HRSA, CDC, ACF."},
  {label:"Foundation Partners",body:"Robert Wood Johnson, Annie E. Casey, W.K. Kellogg, JPMorgan Chase, Lumina, Gates Foundation, St. David's Foundation."},
  {label:"Research Partners",body:"UT Austin, Texas A&M, Morehouse School of Medicine, Howard University, RAND, implementation science institutes."},
  {label:"Technology Partners",body:"Epic (FHIR), Salesforce.org NPSP, Unite Us, Microsoft Azure AI, AWS Nonprofit, Socrata/Tyler, USDA GIS."},
  {label:"Government Partners",body:"Texas HHSC, Travis County, City of Austin, TWC, HUD, DOL ETA, AmeriCorps, SAMHSA, ACF, USDA RD."},
  {label:"Community + Industry",body:"Faith networks, HBCUs, tribal nations, promotora networks, CHW associations, apprenticeship sponsors (IBEW, UA, ABC, Iron Workers, SMART)."},
]);

safe(120); hRule(); doc.moveDown(0.4);
h3("Risk Management");
[
  ["Grant funding concentration","No single grant >40% of revenue by policy. Hub licensing + government contracts diversify base. Two-entity structure enables SBIR/STTR streams."],
  ["Community data trust","ITI: 8 consent layers, all defaults OFF. Full data portability. Zero PHI egress. Witness log available to all contributors."],
  ["Rural adoption barriers","6 dedicated rural tools, Spanish-language farmworker ITI, and USDA-aligned grant pathways address rural-specific adoption friction."],
  ["Adoption resistance from platforms","Complement positioning — TCAF fills the gap existing platforms leave (growth tracking + grant intelligence + rural tools). Not a replacement."],
].forEach(([risk,mit])=>{
  safe(36);
  doc.save().rect(M.l,cy(),CW,0.5).fill(C.border).restore(); doc.moveDown(0.2);
  doc.font(FB).fontSize(8).fillColor(C.ruby).text("Risk: ",M.l,cy(),{continued:true});
  doc.font(FR).fontSize(8).fillColor(C.slate).text(risk);
  doc.font(FB).fontSize(8).fillColor(C.emeraldMid).text("Mitigation: ",M.l,cy(),{continued:true});
  doc.font(FR).fontSize(8).fillColor(C.slate).text(mit);
  doc.moveDown(0.45);
});

safe(110); hRule(); doc.moveDown(0.4);
h3("Investment Need");
twoCol([
  {label:"Capital Requested",body:"$2.5M over 24 months — grants, impact investment, and/or government service contract."},
  {label:"Use of Funds",body:"Technology & integrations 40% · Community outreach & org onboarding 25% · Research & evaluation 20% · Operations & team 15%."},
  {label:"Expected Outcomes",body:"50+ org assessments · 500+ individual journeys · 5 Hub deployments · 2 peer-reviewed publications · rural tool deployment in 3 states."},
  {label:"Milestones",body:"Q3 2026 — case study · Q4 2026 — mobile offline · Q1 2027 — first Hub license · Q4 2027 — 5 Hub deployments · Q2 2028 — Title IV-E clearinghouse."},
]);

safe(100);
h3("Strategic Ask");
bullet([
  "Funding: $2.5M — grants, impact investment, or government service contracts.",
  "Pilot Participation: Organizations completing ALIGN assessments and sharing outcome data under ITI consent.",
  "Research Collaboration: University partners for evaluation design, peer-reviewed publication, framework validation.",
  "USDA Partnership: Rural Development office willing to formally adopt rural tools and farmworker ITI.",
  "Technology Integration: EHR, HMIS, and referral platform partners for FHIR/CDS-Hooks interoperability.",
  "SDVOSB Advisory: SBA and VA contacts to accelerate VetCert filing and VA set-aside pipeline.",
]);

safe(90);
const csY=cy();
const csT="If ThriveUp Academy succeeds, every nonprofit in America will have what TCAF has: grant intelligence to find funding, simulation tools to train and credential a workforce, research frameworks to prove impact, and human growth tracking to show funders not just what they funded — but what changed. Rural farmers will find the USDA programs that go unclaimed. Farmworkers will navigate their rights in their language. Communities will have the evidence to demand the investment they deserve. The nonprofit for nonprofits. Built from community. Powered by data.";
const csh=doc.heightOfString(csT,{font:FI,size:9,width:CW-22})+26;
doc.save().rect(M.l,csY,CW,csh).fill("#ede9fe").restore();
doc.save().rect(M.l,csY,5,csh).fill(C.violet).restore();
doc.font(FB).fontSize(8.5).fillColor(C.violet).text("Closing Statement",M.l+13,csY+8,{width:CW-20});
doc.font(FI).fontSize(9).fillColor(C.slate).text(csT,M.l+13,csY+22,{width:CW-20,lineGap:2});
doc.y=csY+csh+8;

// ════════════ APPENDIX ═══════════════════════════════════════════════════
newPage("Appendix — Leadership & Federal Credentials","Appendix");
banner("Appendix: Leadership · Federal Credentials · Entity Structure",C.slate);

h3("Leadership");
kv("Name","Terry D. Flood, Ph.D.",130);
kv("Title","President, The Collaborative Advocate Foundation (TCAF)  |  CEO, Integrated Services & Solutions LLC (ISS LLC)",130);
kv("Background","Implementation scientist · Psychologist · Data engineer · Community health worker · User-centered designer. Medically retired U.S. veteran (service-connected disability, MS). Active U.S. Government Secret-level clearance.",130);
kv("Contact","terryflood@thrivingcommunitiesforall.com  ·  254-319-8460",130);
kv("Address","17912 Stefano Drive, Pflugerville, TX 78660-7020",130);

hRule(); doc.moveDown(0.4);
h3("Federal Entity Credentials (Primary-Source Verified via SAM.gov)");
[
  {name:"The Collaborative Advocate Foundation (TCAF)",color:C.indigo,items:[
    ["Legal Name","The Collaborative Advocate Foundation  ·  Name Control: THEC"],
    ["EIN","41-3618003"],
    ["501(c)(3)","Determined 2026-01-14  ·  Public Charity §170(b)(1)(A)(vi)"],
    ["SAM UEI","KDDVD1FGLW35"],
    ["CAGE","209N1"],
    ["SAM Status","ACTIVE through 2027-05-06"],
    ["Eligible For","Federal grants, foundation grants, state grants, nonprofit set-asides, SDVOSB (pending)"],
    ["NAICS","624190 (primary) · 624229 · 923120 · 611430 · 541611 · 541690 · 541720"],
  ]},
  {name:"Integrated Services & Solutions LLC (ISS LLC)",color:C.emerald,items:[
    ["Legal Name","Integrated Services & Solutions LLC"],
    ["EIN","87-2795417"],
    ["Entity Type","For-profit LLC"],
    ["SAM UEI","C7YDV3P8EHL7"],
    ["CAGE","9VKK3"],
    ["SAM Status","ACTIVE through 2027-03-30"],
    ["Eligible For","SBIR/STTR, GSA Schedule, for-profit set-asides, government service contracts"],
    ["SDVOSB","SBA VetCert application in progress — Dr. Flood, medically retired, service-connected disability"],
  ]},
].forEach(({name,color,items})=>{
  safe(110);
  const ey=cy();
  doc.save().rect(M.l,ey,CW,16).fill(color).restore();
  doc.font(FB).fontSize(9).fillColor(C.white).text(name,M.l+8,ey+4,{width:CW-16});
  doc.moveDown(1.1);
  items.forEach(([k,v])=>kv(k,v,120));
  doc.moveDown(0.3);
});

safe(80); hRule(); doc.moveDown(0.4);
h3("Two-Entity Strategy");
callout("TCAF (nonprofit) pursues grants, foundation funding, and nonprofit set-aside contracts. ISS LLC (for-profit) pursues SBIR/STTR, GSA Schedule, and government service contracts. Both entities share ThriveUp platform IP under a licensing agreement — clean financial firewall, maximum funding eligibility. Once SDVOSB certification is complete, VA statute requires SDVOSB set-asides first (Veterans First), giving TCAF/ISS LLC sole-source authority up to $5M in services. This structure is unusual in early-stage community organizations and signals operational sophistication to federal program officers.",C.indigoMid,"#e0e7ff");

// ── Finalize ─────────────────────────────────────────────────────────────────
doc.end();
stream.on("finish",()=>console.log("✅  PDF written to:",OUT));
stream.on("error",(e)=>{console.error("❌",e);process.exit(1);});
