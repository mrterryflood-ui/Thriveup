import { db } from "./storage";
import { proposalPipeline } from "@shared/schema";
import { sql } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";

interface Proposal {
  id: string;
  title: string;
  shortTitle: string;
  solicitation: string;
  agency: string;
  entity: string;
  priority: number;
  status: string;
  fundingRange: string;
  budgetTarget: number;
  deadline: string | null;
  deadlineLabel: string;
  partnersRequired: boolean;
  partners: any[];
  frameworkDoc: string;
  implementationScience: { frameworks: string[]; instrument: string; researchDesign: string; evaluationLevel: string };
  readinessChecklist: { item: string; status: string; note: string }[];
  blockers: string[];
  winStrategy: string;
  nextActions: string[];
}

const newOpportunities: Proposal[] = [
  {
    id: "nsf-techaccess",
    title: "NSF TechAccess: AI-Ready America — State/Territory Coordination Hub",
    shortTitle: "NSF TechAccess",
    solicitation: "NSF 26-508",
    agency: "National Science Foundation",
    entity: "TCAF (501(c)(3))",
    priority: 5,
    status: "loi_drafted",
    fundingRange: "$1M/yr × 3 (Y4 optional)",
    budgetTarget: 3000000,
    deadline: "2026-06-16T23:59:59Z",
    deadlineLabel: "June 16, 2026",
    partnersRequired: false,
    partners: [],
    frameworkDoc: "/docs/grants/NSF-TechAccess-Proposal-Framework.md",
    implementationScience: { frameworks: ["CFIR 2.0", "RE-AIM"], instrument: "RPLICE", researchDesign: "Hub-coordination model with state-level implementation evaluation", evaluationLevel: "Hub workbench + nationwide discovery cache" },
    readinessChecklist: [
      { item: "LOI Draft", status: "complete", note: "NSF-TechAccess-LOI-Draft.md complete" },
      { item: "Logic Model", status: "complete", note: "NSF-TechAccess-Logic-Model.md complete" },
      { item: "Budget Framework", status: "complete", note: "NSF-TechAccess-Budget-Framework.md complete" },
      { item: "Full Proposal Framework", status: "complete", note: "NSF-TechAccess-Proposal-Framework.md complete" },
      { item: "AI-Ready America Alignment", status: "complete", note: "NSF-TechAccess-AI-Ready-America-Alignment.md complete" },
      { item: "Final Project Description polish", status: "action_required", note: "Convert framework to final NSF format" },
      { item: "PI Biosketch (NSF format)", status: "action_required", note: "Dr. Flood — NSF biosketch" },
      { item: "Data Management Plan", status: "not_started", note: "2 pages max" },
      { item: "Submit via Research.gov", status: "not_started", note: "Due June 16, 2026" }
    ],
    blockers: [],
    winStrategy: "Only applicant with a deployed multi-state Hub Workbench + Nationwide Discovery cache already operational. NSF 26-508 explicitly seeks state/territory coordination hubs — TCAF has built one.",
    nextActions: ["Convert Project Description to final NSF format", "Build Dr. Flood NSF biosketch", "Write Data Management Plan", "Submit via Research.gov by June 16"]
  },
  {
    id: "nsf-sosdci",
    title: "NSF Science of Science: Discovery, Communication, and Impact",
    shortTitle: "NSF SoSDCI",
    solicitation: "TBD — alignment doc only",
    agency: "National Science Foundation",
    entity: "TCAF (501(c)(3))",
    priority: 12,
    status: "alignment_documented",
    fundingRange: "TBD",
    budgetTarget: 0,
    deadline: null,
    deadlineLabel: "No NOFO active — alignment documented",
    partnersRequired: false,
    partners: [],
    frameworkDoc: "/docs/grants/NSF-SoSDCI-Alignment.md",
    implementationScience: { frameworks: ["RE-AIM"], instrument: "RPLICE", researchDesign: "TBD", evaluationLevel: "TBD" },
    readinessChecklist: [
      { item: "Alignment Documentation", status: "complete", note: "NSF-SoSDCI-Alignment.md complete" },
      { item: "Active NOFO Monitoring", status: "action_required", note: "Watch NSF for SoSDCI cycle" }
    ],
    blockers: ["No active NOFO — monitoring required"],
    winStrategy: "Platform itself is a science-of-science instrument: 24-platform ecosystem produces measurable evidence-to-practice translation data.",
    nextActions: ["Monitor NSF for SoSDCI cycle openings"]
  },
  {
    id: "cdmrp-prmrp",
    title: "CDMRP Peer-Reviewed Medical Research Program (PRMRP) — Concept Award",
    shortTitle: "CDMRP PRMRP",
    solicitation: "FY26 PRMRP — pre-announcement",
    agency: "Department of Defense — Congressionally Directed Medical Research Programs",
    entity: "TCAF (501(c)(3))",
    priority: 6,
    status: "concept_drafted",
    fundingRange: "$200K–$500K",
    budgetTarget: 350000,
    deadline: null,
    deadlineLabel: "Window May–Aug 2026 (FOA pre-announcement)",
    partnersRequired: false,
    partners: [],
    frameworkDoc: "/docs/grants/CDMRP-PRMRP-Concept-Award-Draft.md",
    implementationScience: { frameworks: ["CFIR 2.0"], instrument: "RPLICE", researchDesign: "Concept-stage exploratory", evaluationLevel: "Concept Award" },
    readinessChecklist: [
      { item: "Concept Award Draft", status: "complete", note: "CDMRP-PRMRP-Concept-Award-Draft.md complete" },
      { item: "Master Strategy", status: "complete", note: "CDMRP-FY2026-Master-Grant-Strategy.md covers 31 programs, $1.187B addressable" },
      { item: "FOA monitoring", status: "action_required", note: "FOA expected April–June 2026 release" }
    ],
    blockers: ["FOA not yet released — pre-announcement only"],
    winStrategy: "31 CDMRP FY26 programs analyzed in master strategy doc — $1.187B total addressable. PRMRP Concept Award is highest-probability entry point.",
    nextActions: ["Monitor CDMRP eBRAP for FOA release", "Have Concept Award narrative ready when FOA drops"]
  },
  {
    id: "borealis-dif",
    title: "Borealis DIF × Tech 2026",
    shortTitle: "Borealis DIF",
    solicitation: "Borealis DIF × Tech 2026",
    agency: "Borealis Philanthropy",
    entity: "TCAF (501(c)(3))",
    priority: 9,
    status: "draft_in_progress",
    fundingRange: "TBD",
    budgetTarget: 0,
    deadline: null,
    deadlineLabel: "Application draft in progress",
    partnersRequired: false,
    partners: [],
    frameworkDoc: "/docs/grants/Borealis-DIF-x-Tech-2026-Application-Draft.md",
    implementationScience: { frameworks: [], instrument: "RPLICE", researchDesign: "TBD", evaluationLevel: "TBD" },
    readinessChecklist: [
      { item: "Application Draft", status: "action_required", note: "Borealis-DIF-x-Tech-2026-Application-Draft.md in progress" }
    ],
    blockers: [],
    winStrategy: "Tech-for-equity funder; 24-platform ecosystem is direct fit.",
    nextActions: ["Complete application draft", "Confirm cycle deadline on Borealis portal"]
  },
  {
    id: "rwjf-global-ideas",
    title: "RWJF Global Ideas for U.S. Solutions",
    shortTitle: "RWJF Global Ideas",
    solicitation: "RWJF Global Ideas 2026",
    agency: "Robert Wood Johnson Foundation",
    entity: "TCAF (501(c)(3))",
    priority: 7,
    status: "narrative_drafted",
    fundingRange: "Up to $500K",
    budgetTarget: 500000,
    deadline: null,
    deadlineLabel: "Brief proposal cycle — verify on RWJF portal",
    partnersRequired: false,
    partners: [],
    frameworkDoc: "/docs/grants/RWJF-Global-Ideas-2026-Brief-Proposal.md",
    implementationScience: { frameworks: ["RE-AIM"], instrument: "RPLICE", researchDesign: "Cross-sector knowledge generation", evaluationLevel: "Community-driven knowledge system" },
    readinessChecklist: [
      { item: "Brief Proposal Narrative", status: "complete", note: "RWJF-Global-Ideas-2026-Brief-Proposal.md + RWJF-Brief-Proposal-Narrative-UPLOAD.doc ready" },
      { item: "PI CV — Dr. Flood", status: "complete", note: "RWJF-CV-Terry-Flood.doc ready" },
      { item: "Co-PI CV — M. Sisnett", status: "complete", note: "RWJF-CV-Meredith-Sisnett.doc ready" },
      { item: "Verify cycle status", status: "action_required", note: "Confirm submission window open" }
    ],
    blockers: ["RWJF restriction: must NOT have received RWJF funds since Jan 1, 2021 — verify"],
    winStrategy: "Sankofa Health Network + LifeBridge SDOH = community-driven health knowledge system serving Black communities.",
    nextActions: ["Confirm RWJF cycle status", "Submit via RWJF portal"]
  },
  {
    id: "spencer-foundation",
    title: "Spencer Foundation Small Research Grant 2026",
    shortTitle: "Spencer Foundation",
    solicitation: "Spencer Small Research Grant 2026",
    agency: "Spencer Foundation",
    entity: "TCAF (501(c)(3))",
    priority: 8,
    status: "submitted",
    fundingRange: "Up to $50K",
    budgetTarget: 50000,
    deadline: null,
    deadlineLabel: "SUBMITTED",
    partnersRequired: false,
    partners: [],
    frameworkDoc: "/docs/grants/Spencer-Foundation-Small-Research-Grant-2026.md",
    implementationScience: { frameworks: ["CFIR 2.0"], instrument: "RPLICE", researchDesign: "Small-scale education research", evaluationLevel: "Small Research Grant" },
    readinessChecklist: [
      { item: "Narrative v2.1 (SUBMITTED)", status: "complete", note: "Spencer-Foundation-Narrative-SUBMISSION.doc submitted" },
      { item: "Source narrative + 2 prior drafts", status: "complete", note: "v2.0 + v2.1 + final SUBMISSION on file" }
    ],
    blockers: [],
    winStrategy: "Small research grant on community-infrastructure approach to under-resourced learner outcomes.",
    nextActions: ["Await Spencer review decision"]
  },
  {
    id: "stdavids-clc",
    title: "St. David's Community-Led Change",
    shortTitle: "St. David's CLC",
    solicitation: "St. David's Community-Led Change",
    agency: "St. David's Foundation",
    entity: "TCAF (501(c)(3))",
    priority: 10,
    status: "loi_drafted",
    fundingRange: "$300K–$500K (separate from WAB2)",
    budgetTarget: 400000,
    deadline: null,
    deadlineLabel: "LOI package prepared",
    partnersRequired: false,
    partners: [],
    frameworkDoc: "/docs/grants/St-Davids-Community-Led-Change-LOI-Package.md",
    implementationScience: { frameworks: ["RE-AIM"], instrument: "RPLICE", researchDesign: "Community-led change evaluation", evaluationLevel: "Community-led" },
    readinessChecklist: [
      { item: "LOI Package", status: "complete", note: "St-Davids-Community-Led-Change-LOI-Package.md complete" },
      { item: "Strategic Alignment Doc", status: "complete", note: "St-Davids-Strategic-Alignment.md complete" },
      { item: "Confirm submission window", status: "action_required", note: "Verify St. David's CLC cycle status" }
    ],
    blockers: [],
    winStrategy: "Distinct from WAB2 LOI — addresses community-led change rather than women's behavioral health.",
    nextActions: ["Confirm CLC cycle status with St. David's program officer"]
  },
  {
    id: "rwjf-learning-abroad",
    title: "RWJF Learning from Abroad: Health Knowledge Systems",
    shortTitle: "RWJF Learning Abroad",
    solicitation: "RWJF Learning from Abroad 2026",
    agency: "Robert Wood Johnson Foundation",
    entity: "TCAF (501(c)(3))",
    priority: 30,
    status: "deadline_passed",
    fundingRange: "Up to $500K",
    budgetTarget: 500000,
    deadline: "2026-04-13T23:59:59Z",
    deadlineLabel: "April 13, 2026 — DEADLINE PASSED",
    partnersRequired: false,
    partners: [],
    frameworkDoc: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md",
    implementationScience: { frameworks: [], instrument: "RPLICE", researchDesign: "TBD", evaluationLevel: "TBD" },
    readinessChecklist: [
      { item: "Go/no-go decision (Apr 10 criteria matrix)", status: "action_required", note: "Confirm whether submitted or deferred" }
    ],
    blockers: ["Deadline passed Apr 13 — submission status unconfirmed"],
    winStrategy: "Sankofa Health Network for community-driven knowledge system.",
    nextActions: ["Log final disposition (submitted/not submitted) and reason"]
  },
  {
    id: "gates-ai-charitable",
    title: "Gates Foundation: AI to Accelerate Charitable Giving Grand Challenge",
    shortTitle: "Gates AI Challenge",
    solicitation: "Gates AI Charitable Giving GC",
    agency: "Bill & Melinda Gates Foundation",
    entity: "TCAF (501(c)(3))",
    priority: 31,
    status: "deadline_passed",
    fundingRange: "Up to $150K",
    budgetTarget: 150000,
    deadline: "2026-04-28T23:59:59Z",
    deadlineLabel: "April 28, 2026 — DEADLINE PASSED",
    partnersRequired: false,
    partners: [],
    frameworkDoc: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md",
    implementationScience: { frameworks: [], instrument: "RPLICE", researchDesign: "TBD", evaluationLevel: "TBD" },
    readinessChecklist: [
      { item: "Application status", status: "action_required", note: "Confirm whether submitted via submit.gatesfoundation.org" }
    ],
    blockers: ["Deadline passed Apr 28 — submission status unconfirmed"],
    winStrategy: "Incubator's grant discovery engine + AI LOI/narrative writer = AI for charitable infrastructure.",
    nextActions: ["Log final disposition and reason"]
  },
  {
    id: "cdc-dfc",
    title: "CDC Drug-Free Communities (DFC) — Year 1 New Coalition",
    shortTitle: "CDC DFC",
    solicitation: "CDC DFC FY26",
    agency: "CDC / ONDCP",
    entity: "TCAF (501(c)(3))",
    priority: 11,
    status: "awaiting_nofo",
    fundingRange: "$125K/yr × up to 10 yr ($1.25M)",
    budgetTarget: 1250000,
    deadline: null,
    deadlineLabel: "NOFO expected May 2026 (~45 day window after release)",
    partnersRequired: true,
    partners: [],
    frameworkDoc: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md",
    implementationScience: { frameworks: ["RE-AIM"], instrument: "RPLICE", researchDesign: "Coalition-based prevention with 12 statutory sectors", evaluationLevel: "Community coalition" },
    readinessChecklist: [
      { item: "DFC Command Center built", status: "complete", note: "Already deployed in TCAF platform" },
      { item: "SHIELD-Austin local need data", status: "complete", note: "78741, 78702, 78753 OD rate 33/100K" },
      { item: "12-sector coalition documentation", status: "action_required", note: "Document representatives from all 12 required sectors" },
      { item: "1:1 match (in-kind eligible)", status: "action_required", note: "Identify match commitments" },
      { item: "SAM.gov registration", status: "complete", note: "Resolved May 3, 2026" }
    ],
    blockers: ["NOFO not yet released", "12-sector coalition partners must be documented"],
    winStrategy: "DFC Command Center is built. SHIELD-Austin OD data provides compelling local need. Austin OD rate 33/100K.",
    nextActions: ["Document 12-sector coalition partners", "Monitor for NOFO release", "Prepare match commitments"]
  },
  {
    id: "twc-dshs-healthcare",
    title: "TWC + DSHS Healthcare Apprenticeship Grant",
    shortTitle: "TWC Healthcare Apprenticeship",
    solicitation: "TWC + DSHS — rolling",
    agency: "Texas Workforce Commission + TX DSHS",
    entity: "TCAF (501(c)(3))",
    priority: 13,
    status: "rolling_open",
    fundingRange: "Up to $500K/yr × FY2026 + FY2027",
    budgetTarget: 1000000,
    deadline: null,
    deadlineLabel: "Open / rolling — Texas ESBD",
    partnersRequired: true,
    partners: [],
    frameworkDoc: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md",
    implementationScience: { frameworks: ["RE-AIM"], instrument: "RPLICE", researchDesign: "Apprenticeship outcomes evaluation", evaluationLevel: "Workforce" },
    readinessChecklist: [
      { item: "ThriveUp Academy 50+ pathways", status: "complete", note: "WIOA-aligned curriculum already built" },
      { item: "Healthcare employer partner", status: "action_required", note: "Letter of support from healthcare facility/employer required" },
      { item: "DSH community alignment", status: "action_required", note: "Document Disproportionate Share Hospital community service" }
    ],
    blockers: ["Healthcare employer partner letter needed"],
    winStrategy: "Separate from TWC RFA 32026-00162. ThriveUp Academy expansion into healthcare apprenticeship; Austin healthcare workforce shortage is acute.",
    nextActions: ["Identify healthcare employer partner", "Secure letter of support", "Submit via Texas ESBD"]
  },
  {
    id: "fema-bric",
    title: "FEMA Building Resilient Infrastructure and Communities (BRIC)",
    shortTitle: "FEMA BRIC",
    solicitation: "FEMA BRIC FY26",
    agency: "FEMA",
    entity: "TCAF as service provider via City of Austin or Travis County",
    priority: 14,
    status: "partner_required",
    fundingRange: "Up to $20M federal share",
    budgetTarget: 5000000,
    deadline: "2026-07-23T15:00:00Z",
    deadlineLabel: "July 23, 2026, 3:00 PM ET",
    partnersRequired: true,
    partners: [],
    frameworkDoc: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md",
    implementationScience: { frameworks: ["RE-AIM"], instrument: "RPLICE", researchDesign: "Hazard mitigation with benefit-cost analysis", evaluationLevel: "Community resilience" },
    readinessChecklist: [
      { item: "Emergency Management platform", status: "complete", note: "Risk heat mapping + community resilience scoring built" },
      { item: "SafeReport incident management", status: "complete", note: "Built" },
      { item: "Local government applicant partner", status: "action_required", note: "City of Austin or Travis County must apply on TCAF behalf — nonprofits cannot apply directly" },
      { item: "Benefit-cost analysis", status: "not_started", note: "Required for cost-effectiveness scoring" }
    ],
    blockers: ["Nonprofits cannot apply directly — local government partner required"],
    winStrategy: "Emergency Management + SafeReport = community resilience infrastructure. Need City of Austin or Travis County emergency management as applying entity.",
    nextActions: ["Secure City of Austin or Travis County partner letter", "Build benefit-cost analysis", "Coordinate with state applicant"]
  },
  {
    id: "samhsa-nctsi-3",
    title: "SAMHSA National Child Traumatic Stress Initiative — Category III",
    shortTitle: "SAMHSA NCTSI Cat III",
    solicitation: "SAMHSA NCTSI Cat III FY26",
    agency: "SAMHSA",
    entity: "TCAF (501(c)(3))",
    priority: 15,
    status: "awaiting_nofo",
    fundingRange: "$400K–$1M/yr × up to 5 yr",
    budgetTarget: 1000000,
    deadline: null,
    deadlineLabel: "NOFO forecasted Apr–May 2026",
    partnersRequired: false,
    partners: [],
    frameworkDoc: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md",
    implementationScience: { frameworks: ["CFIR 2.0", "RE-AIM"], instrument: "RPLICE", researchDesign: "Trauma-focused implementation evaluation", evaluationLevel: "Cross-site NCTSN evaluation" },
    readinessChecklist: [
      { item: "ISSS MTSS/trauma-informed framework", status: "complete", note: "Built" },
      { item: "Perfectly Different + WholeMind", status: "complete", note: "Built" },
      { item: "PfISD partnership letter of support", status: "action_required", note: "Strengthens application — Traci Hendrix engaged" },
      { item: "NCTSN collaboration confirmation", status: "not_started", note: "Required for participation" }
    ],
    blockers: ["NOFO not yet released"],
    winStrategy: "ISSS + Perfectly Different + WholeMind = comprehensive child trauma response infrastructure with PfISD school access.",
    nextActions: ["Monitor SAMHSA forecast dashboard", "Prepare narrative framework now", "Secure PfISD letter"]
  },
  {
    id: "nih-par-25-144",
    title: "NIH Dissemination & Implementation Research in Health (R01) — HerHealth",
    shortTitle: "NIH D&I R01 (HerHealth)",
    solicitation: "PAR-25-144",
    agency: "NIH (NIMHD/NCI/NHLBI/NIMH)",
    entity: "TCAF (501(c)(3))",
    priority: 16,
    status: "researched",
    fundingRange: "Up to $500K/yr direct",
    budgetTarget: 500000,
    deadline: "2026-06-05T23:59:59Z",
    deadlineLabel: "June 5, 2026",
    partnersRequired: false,
    partners: [],
    frameworkDoc: "/docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md",
    implementationScience: { frameworks: ["RE-AIM"], instrument: "RPLICE", researchDesign: "RE-AIM evaluation of deployed digital health platform", evaluationLevel: "D&I R01" },
    readinessChecklist: [
      { item: "HerHealth platform deployed", status: "complete", note: "Production-ready, 70 conditions, 2,100+ resources" },
      { item: "RE-AIM evaluation design", status: "action_required", note: "Build measurement framework for reach/adoption/health behavior change across 7 condition domains" },
      { item: "PI Biosketch (NIH format)", status: "action_required", note: "Convert to NIH biosketch" },
      { item: "Specific Aims (1 page)", status: "not_started", note: "Required NIH" },
      { item: "Submit via ASSIST/eRA Commons", status: "not_started", note: "Due June 5" }
    ],
    blockers: [],
    winStrategy: "HerHealth is a deployed digital health intervention ready for D&I research — perfect fit for PAR-25-144. Study reach, adoption, behavior change among Black women using RE-AIM.",
    nextActions: ["Build Specific Aims", "Convert biosketch to NIH format", "Build RE-AIM measurement framework", "Submit via ASSIST"]
  },
  {
    id: "nih-pa-25-301",
    title: "NIH NIMHD Parent R01 — Health Disparities (HerHealth)",
    shortTitle: "NIH NIMHD R01",
    solicitation: "PA-25-301",
    agency: "NIH / NIMHD",
    entity: "TCAF (501(c)(3))",
    priority: 17,
    status: "researched",
    fundingRange: "$500K/yr direct",
    budgetTarget: 500000,
    deadline: "2026-06-05T23:59:59Z",
    deadlineLabel: "June 5, 2026",
    partnersRequired: false,
    partners: [],
    frameworkDoc: "/docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md",
    implementationScience: { frameworks: ["RE-AIM"], instrument: "RPLICE", researchDesign: "Observational study of culturally grounded digital health platform", evaluationLevel: "Parent R01" },
    readinessChecklist: [
      { item: "HerHealth platform deployed", status: "complete", note: "70 conditions covered" },
      { item: "Health disparity relevance evidence", status: "action_required", note: "Black women mortality data documentation" },
      { item: "PI Biosketch (NIH format)", status: "action_required", note: "Required" },
      { item: "Specific Aims (1 page)", status: "not_started", note: "Required NIH" }
    ],
    blockers: [],
    winStrategy: "Observational study of how culturally grounded digital health platform affects health information equity, SDOH navigation, and care engagement among Black women across 70 conditions.",
    nextActions: ["Build Specific Aims", "Document Black women mortality evidence base", "Submit via ASSIST"]
  },
  {
    id: "nih-par-25-143",
    title: "NIH D&I Research in Health (R21) — HerHealth Pilot",
    shortTitle: "NIH D&I R21",
    solicitation: "PAR-25-143",
    agency: "NIH (multiple ICs)",
    entity: "TCAF (501(c)(3))",
    priority: 18,
    status: "researched",
    fundingRange: "$275K total over 2 yr",
    budgetTarget: 275000,
    deadline: "2026-06-16T23:59:59Z",
    deadlineLabel: "June 16, 2026",
    partnersRequired: false,
    partners: [],
    frameworkDoc: "/docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md",
    implementationScience: { frameworks: ["RE-AIM"], instrument: "RPLICE", researchDesign: "Exploratory pilot of Nia AI navigator effectiveness", evaluationLevel: "R21 Exploratory" },
    readinessChecklist: [
      { item: "HerHealth + Nia AI navigator deployed", status: "complete", note: "Production" },
      { item: "Pilot study design", status: "action_required", note: "Health literacy + care-seeking behavior measurement in Black women, specific ZIP codes" },
      { item: "PI Biosketch (NIH format)", status: "action_required", note: "Required" }
    ],
    blockers: [],
    winStrategy: "Pilot HerHealth's impact on health literacy and care-seeking behavior — exploratory R21 to generate preliminary data for R01.",
    nextActions: ["Design pilot measurement", "Build biosketch", "Submit via ASSIST"]
  },
  {
    id: "nih-pa-25-304",
    title: "NIH NIMHD Parent R21 — Exploratory Minority Health (HerHealth)",
    shortTitle: "NIH NIMHD R21",
    solicitation: "PA-25-304",
    agency: "NIH / NIMHD",
    entity: "TCAF (501(c)(3))",
    priority: 19,
    status: "researched",
    fundingRange: "$275K total over 2 yr",
    budgetTarget: 275000,
    deadline: "2026-06-16T23:59:59Z",
    deadlineLabel: "June 16, 2026",
    partnersRequired: false,
    partners: [],
    frameworkDoc: "/docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md",
    implementationScience: { frameworks: ["RE-AIM"], instrument: "RPLICE", researchDesign: "Hypothesis-generating pilot for outcome measure validation", evaluationLevel: "R21 Exploratory" },
    readinessChecklist: [
      { item: "HerHealth platform deployed", status: "complete", note: "Production" },
      { item: "Outcome measure development plan", status: "action_required", note: "Validate measures for culturally grounded digital health" },
      { item: "Nia accuracy benchmark plan", status: "action_required", note: "Pilot test vs. generic chatbots" }
    ],
    blockers: [],
    winStrategy: "Develop and validate outcome measures for culturally grounded digital health platforms; pilot test Nia accuracy.",
    nextActions: ["Build outcome measure development plan", "Submit via ASSIST"]
  },
  {
    id: "nlm-g08",
    title: "NLM G08 Information Resource Grants to Reduce Health Disparities (HerHealth)",
    shortTitle: "NLM G08",
    solicitation: "NLM G08 — verify FOA number",
    agency: "National Library of Medicine, NIH",
    entity: "TCAF (501(c)(3))",
    priority: 32,
    status: "deadline_passed",
    fundingRange: "$150K–$400K over 2–3 yr",
    budgetTarget: 275000,
    deadline: "2026-04-24T23:59:59Z",
    deadlineLabel: "April 24, 2026 — DEADLINE PASSED",
    partnersRequired: false,
    partners: [],
    frameworkDoc: "/docs/grants/HerHealth-33-Grant-Opportunities-Prospectus.md",
    implementationScience: { frameworks: [], instrument: "RPLICE", researchDesign: "TBD", evaluationLevel: "TBD" },
    readinessChecklist: [
      { item: "Application status", status: "action_required", note: "Confirm whether submitted; if not, plan for next cycle" }
    ],
    blockers: ["Deadline passed Apr 24 — submission status unconfirmed"],
    winStrategy: "HerHealth IS a health information resource — 70 conditions, 2,100+ resources, AI navigation — written for platforms like this.",
    nextActions: ["Log final disposition", "Plan for next NLM G08 cycle"]
  }
];

export async function seedProposalPipeline(): Promise<void> {
  const existingCount = await db.execute(sql`SELECT COUNT(*) AS count FROM proposal_pipeline`);
  const count = Number((existingCount.rows[0] as any)?.count ?? 0);
  if (count > 0) {
    console.log(`[ProposalPipelineSeed] Table already has ${count} rows — skipping seed.`);
    return;
  }

  const snapshotPath = path.join(process.cwd(), ".local/snapshots/proposal-pipeline-2026-05-03.json");
  let originalProposals: Proposal[] = [];
  try {
    const raw = await fs.readFile(snapshotPath, "utf-8");
    originalProposals = JSON.parse(raw).proposals as Proposal[];
  } catch (e) {
    console.error("[ProposalPipelineSeed] Could not read snapshot:", e);
    return;
  }

  const all = [...originalProposals, ...newOpportunities];
  for (const p of all) {
    await db.insert(proposalPipeline).values({
      id: p.id,
      priority: p.priority,
      deadline: p.deadline ? new Date(p.deadline) : null,
      data: p as any,
    }).onConflictDoNothing();
  }
  console.log(`[ProposalPipelineSeed] Inserted ${all.length} proposals (${originalProposals.length} original + ${newOpportunities.length} new from Cycle H memory).`);
}
