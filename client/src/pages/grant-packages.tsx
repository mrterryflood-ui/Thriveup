import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Briefcase, Trophy, CheckCircle2, Circle, Clock,
  AlertTriangle, Download, FileText, DollarSign, Users,
  Target, ArrowRight, ChevronDown, ChevronRight, Eye,
  Lock, Unlock, BarChart3, Calendar, MapPin, BookOpen,
  ClipboardCheck, Layers, Globe, Sparkles, Building2,
  Activity, Lightbulb, Heart, Handshake, Scale,
  Package, CheckSquare, XCircle, Upload, Camera, Search,
  Loader2, Leaf, Plus, Trash2, Bell, Pencil, ExternalLink,
} from "lucide-react";

type ApprovalStatus = "not-started" | "draft" | "in-review" | "approved" | "needs-revision";
type PhaseId = "collaborate" | "build" | "review" | "submit" | "pre-execute";

interface PackageSection {
  id: string;
  name: string;
  description: string;
  icon: typeof FileText;
  status: ApprovalStatus;
  content: string;
  reviewNotes: string;
  lastUpdated: string;
  assignee: string;
  pageLimit?: string;
  wordCount?: string;
}

interface ServiceArea {
  region: string;
  state: string;
  counties?: string[];
  city?: string;
  lwdbName?: string;
  lwdbUrl?: string;
  keyIndustries: string[];
  targetEmployers: Array<{ name: string; sector: string; type: string }>;
  laborMarketNotes: string;
  locationEligibility: "national" | "statewide" | "regional" | "local";
  locationNotes: string;
  multiSiteEligible: boolean;
  multiSiteNotes?: string;
}

interface PartnerRequirement {
  partnerType: string;
  requiredInDocs: boolean;
  timing: "pre-award" | "post-award" | "both";
  docSections: string[];
  description: string;
  evidenceNeeded: string;
}

interface PartnershipTimeline {
  summary: string;
  workflowOrder: string;
  requirements: PartnerRequirement[];
}

interface GrantPackage {
  id: string;
  name: string;
  fullName: string;
  funder: string;
  amount: string;
  deadline: string;
  deadlineUrgency: "on-track" | "approaching" | "urgent";
  icon: typeof Shield;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  referenceUrl?: string;
  referenceLabel?: string;
  grantKnowledge?: string;
  serviceArea?: ServiceArea;
  partnershipTimeline?: PartnershipTimeline;
  competitiveEdge: string[];
  sections: PackageSection[];
  phases: PhaseStatus[];
  preExecutionChecklist: ChecklistItem[];
  winStrategy: WinStrategy;
}

interface PhaseStatus {
  id: PhaseId;
  name: string;
  description: string;
  status: "complete" | "active" | "upcoming";
  tasks: PhaseTask[];
}

interface PhaseTask {
  id: string;
  task: string;
  owner: string;
  status: "done" | "in-progress" | "pending";
  dueDate: string;
  guidance?: string;
  aiCanHelp?: boolean;
  aiAction?: string;
}

interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  status: "verified" | "pending" | "action-needed";
  notes: string;
  guidance?: string;
  resources?: Array<{ label: string; url: string }>;
}

interface WinStrategy {
  differentiators: string[];
  reviewerPriorities: string[];
  scoringTips: string[];
  commonPitfalls: string[];
}

const APPROVAL_LABELS: Record<ApprovalStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  "not-started": { label: "Not Started", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", icon: Circle },
  "draft": { label: "Draft", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", icon: FileText },
  "in-review": { label: "In Review", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", icon: Eye },
  "approved": { label: "Approved", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", icon: CheckCircle2 },
  "needs-revision": { label: "Needs Revision", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", icon: AlertTriangle },
};

const GRANT_PACKAGES: GrantPackage[] = [
  {
    id: "dfc",
    name: "Drug-Free Communities",
    fullName: "CDC/ONDCP Drug-Free Communities Support Program",
    funder: "CDC / ONDCP",
    amount: "$125,000/year (5 years = $625,000)",
    deadline: "April 14, 2026",
    deadlineUrgency: "approaching",
    icon: Shield,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    description: "Federal grant supporting community coalitions to prevent youth substance use through evidence-based strategies and 12-sector coalition building.",
    referenceUrl: "https://www.samhsa.gov/grants/grant-announcements/sp-24-001",
    referenceLabel: "SAMHSA/ONDCP DFC NOFO",
    grantKnowledge: `Drug-Free Communities (DFC) Support Program — $125,000/year for 5 years ($625,000 total).
PURPOSE: Establish and strengthen community coalitions to reduce youth substance use. Requires a community coalition representing 12 sectors: youth, parents, businesses, media, schools, youth-serving orgs, law enforcement, religious orgs, civic/volunteer, healthcare, state/local government, other substance use orgs.
KEY REQUIREMENTS: (1) Coalition must have been active for at least 6 months. (2) Must address at least 2 substances. (3) Must collect 4 core measures: past 30-day use, perception of risk, perception of disapproval, and age of first use. (4) Must use evidence-based prevention strategies from SAMHSA's registry. (5) Community readiness assessment required. (6) Logic model with theory of change. (7) Sustainability plan. (8) Match requirement: dollar-for-dollar cash/in-kind match.
SCORING CRITERIA: Statement of Need (20 pts), Proposed Approach/Program Design (30 pts), Organizational Capacity (15 pts), Data Collection & Evaluation (15 pts), Budget (10 pts), Community Readiness (10 pts).
ELIGIBLE APPLICANTS: 501(c)(3) community-based organizations; coalitions with 12-sector representation.
APPLICATION DEADLINE: April 14, 2026. SF-424, SF-424A, Project Narrative, Budget, Logic Model, Letters of Support, Coalition membership list required.`,
    competitiveEdge: [
      "14-platform ecosystem provides unprecedented coalition infrastructure",
      "SALP fidelity tracking exceeds typical reporting capabilities",
      "MAP-GAP methodology aligns directly with ONDCP's continuous improvement requirements",
      "Real-time core measures tracking (not batch reporting)",
      "Three Realities framework ensures community voice is centered, not assumed",
    ],
    serviceArea: {
      region: "Central Texas",
      state: "Texas",
      counties: ["Travis", "Williamson", "Hays"],
      city: "Austin",
      keyIndustries: ["Substance Use Prevention", "Youth Services", "Community Health", "Education"],
      targetEmployers: [],
      laborMarketNotes: "DFC does not require employer partnerships — it is a coalition-based prevention grant. Focus is on coalition sector representation, not labor market alignment.",
      locationEligibility: "national",
      locationNotes: "DFC is a national grant — you can apply from any community in the United States. Your coalition must represent a defined geographic community (city, county, or region). You are applying for Austin/Travis County as your primary community. You could also apply for a separate coalition in another community if you have the infrastructure.",
      multiSiteEligible: true,
      multiSiteNotes: "You can submit separate DFC applications for different communities. Each application requires its own 12-sector coalition specific to that community. Consider: a second application for Williamson County or Hays County if you build separate coalitions. Each coalition can receive up to $125K/year independently.",
    },
    partnershipTimeline: {
      summary: "DFC REQUIRES partners named in your application. Coalition members, their sectors, and their commitments must all be documented BEFORE you draft. Secure partnerships first, then write.",
      workflowOrder: "Partnerships FIRST → Then Draft Documents",
      requirements: [
        { partnerType: "12-Sector Coalition Members", requiredInDocs: true, timing: "pre-award", docSections: ["Coalition Documentation", "Program Narrative", "Letters of Support"], description: "Every coalition member from all 12 sectors must be named, with their organization, sector, and role documented. This is a core scoring criterion — reviewers check for completeness.", evidenceNeeded: "Coalition membership roster, signed MOUs, meeting minutes showing active participation, bylaws listing members" },
        { partnerType: "Schools / School Districts", requiredInDocs: true, timing: "pre-award", docSections: ["Coalition Documentation", "Program Narrative", "Letters of Support"], description: "At least one school or school district representative must be in your coalition (sector 5). They should commit to data sharing (YRBS data), program access, and prevention activity implementation.", evidenceNeeded: "Letter of support on school letterhead, signed MOU, named contact person" },
        { partnerType: "Law Enforcement", requiredInDocs: true, timing: "pre-award", docSections: ["Coalition Documentation", "Letters of Support"], description: "At least one law enforcement agency (sector 7). They provide local substance trend data, community presence, and enforcement alignment with prevention.", evidenceNeeded: "Letter of support from chief/commander, MOU, named liaison officer" },
        { partnerType: "Healthcare Providers", requiredInDocs: true, timing: "pre-award", docSections: ["Coalition Documentation", "Letters of Support"], description: "At least one healthcare organization (sector 10). They can provide screening, referral data, and clinical perspective on youth substance impact.", evidenceNeeded: "Letter of support, MOU, agreement to share de-identified community health data" },
        { partnerType: "Evaluator / Research Partner", requiredInDocs: true, timing: "pre-award", docSections: ["Evaluation Plan", "Budget & Justification"], description: "DFC requires an evaluation plan. An independent evaluator (like Better Science Lab) should be named in the budget and evaluation section. They must be separate from program delivery staff.", evidenceNeeded: "Evaluator bio/CV, letter of commitment, evaluation methodology overview, budget line item" },
        { partnerType: "In-Kind Match Contributors", requiredInDocs: true, timing: "pre-award", docSections: ["Budget & Justification"], description: "DFC requires dollar-for-dollar match ($125K/year). Match can be cash or in-kind. Partners providing match (meeting space, staff time, volunteer hours) must be documented with dollar values.", evidenceNeeded: "Match commitment letters with specific dollar amounts, in-kind valuation documentation" },
      ],
    },
    sections: [
      { id: "dfc-narrative", name: "Program Narrative", description: "Statement of Need, Program Design, Goals & Objectives, Implementation Plan", icon: FileText, status: "draft", content: "Comprehensive narrative addressing youth substance use prevention through evidence-based coalition strategies.", reviewNotes: "", lastUpdated: "2026-03-15", assignee: "Dr. Flood + AI", pageLimit: "25 pages", wordCount: "7,500–10,000 words" },
      { id: "dfc-budget", name: "Budget & Justification", description: "Line-item budget with narrative justification for all costs", icon: DollarSign, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "5 pages", wordCount: "1,500–2,000 words" },
      { id: "dfc-logic-model", name: "Logic Model", description: "Inputs → Activities → Outputs → Short/Long-term Outcomes", icon: Layers, status: "draft", content: "Theory of change: Relief → Stabilize → Contribute with MAP-GAP cycle integration.", reviewNotes: "", lastUpdated: "2026-03-14", assignee: "Dr. Flood + AI", pageLimit: "2 pages", wordCount: "500–800 words" },
      { id: "dfc-coalition", name: "Coalition Documentation", description: "12-sector membership roster, MOUs, meeting minutes, bylaws", icon: Users, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "10 pages", wordCount: "3,000–4,000 words" },
      { id: "dfc-data-plan", name: "Data Collection Plan", description: "4 core measures methodology, survey instruments, IRB if needed", icon: BarChart3, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI", pageLimit: "5 pages", wordCount: "1,500–2,000 words" },
      { id: "dfc-community", name: "Community Readiness Assessment", description: "Tri-Ethnic Center model assessment results and action plan", icon: MapPin, status: "draft", content: "Community readiness assessment using DFC Readiness tool with gap identification.", reviewNotes: "", lastUpdated: "2026-03-12", assignee: "Dr. Flood", pageLimit: "5 pages", wordCount: "1,500–2,000 words" },
      { id: "dfc-letters", name: "Letters of Support", description: "Coalition member commitments, community partner letters", icon: Handshake, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "No limit (1 per partner)", wordCount: "200–400 words each" },
      { id: "dfc-sustainability", name: "Sustainability Plan", description: "Post-grant continuation strategy with revenue diversification", icon: Globe, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "3 pages", wordCount: "1,000–1,500 words" },
      { id: "dfc-evaluation", name: "Evaluation Plan", description: "Process and outcome evaluation design with independent evaluator", icon: Sparkles, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + Better Science Lab", pageLimit: "5 pages", wordCount: "1,500–2,000 words" },
    ],
    phases: [
      {
        id: "collaborate", name: "1. Collaborate & Research", description: "Gather data, align team, understand requirements", status: "active",
        tasks: [
          { id: "c1", task: "Review NOFO and scoring criteria in detail", owner: "Dr. Flood", status: "done", dueDate: "2026-03-10" },
          { id: "c2", task: "Map all 14 platform capabilities to DFC requirements", owner: "AI + Dr. Flood", status: "done", dueDate: "2026-03-12" },
          { id: "c3", task: "Identify coalition gaps (sectors without confirmed partners)", owner: "Dr. Flood", status: "in-progress", dueDate: "2026-03-20", guidance: "DFC requires representation from 12 community sectors. Map your current coalition members against: (1) Youth, (2) Parents, (3) Business, (4) Media, (5) Schools, (6) Youth-serving orgs, (7) Law enforcement, (8) Religious, (9) Civic/volunteer, (10) Healthcare, (11) Government, (12) Other orgs. Find gaps and reach out to sector leaders in Austin.", aiCanHelp: true, aiAction: "Identify missing sectors and suggest Austin partners" },
          { id: "c4", task: "Collect community-level data (CDC PLACES, SVI, YRBS)", owner: "AI", status: "done", dueDate: "2026-03-14", guidance: "Data collected from CDC PLACES, Social Vulnerability Index, and Youth Risk Behavior Survey for Travis County. Key findings: elevated youth substance use rates, high social vulnerability in east Austin zip codes, significant disparities by race/ethnicity." },
          { id: "c5", task: "Interview 3+ community stakeholders for Three Realities grounding", owner: "Dr. Flood", status: "pending", dueDate: "2026-03-22", guidance: "Three Realities methodology requires capturing: (1) The community's lived reality, (2) The institutional reality, (3) The data/evidence reality. Schedule 30-minute interviews with at least 1 youth/parent, 1 school administrator or counselor, and 1 community health provider. Document quotes for narrative use." },
        ],
      },
      {
        id: "build", name: "2. Build & Draft", description: "Write narrative sections, develop budget, compile docs", status: "active",
        tasks: [
          { id: "b1", task: "Draft Statement of Need with local data", owner: "AI + Dr. Flood Review", status: "in-progress", dueDate: "2026-03-22", guidance: "Use CDC PLACES, SVI, and YRBS data already collected. Statement of Need should show: (1) prevalence of youth substance use in Austin/Travis County, (2) disparities by race/neighborhood, (3) gap between need and current services, (4) why a coalition approach is necessary. The AI can draft this from your data — go to Sections & Approval tab.", aiCanHelp: true, aiAction: "Draft Statement of Need section" },
          { id: "b2", task: "Draft Program Design section", owner: "AI + Dr. Flood Review", status: "pending", dueDate: "2026-03-25", guidance: "Program Design should map your 14 platforms to DFC strategies. WAIT until coalition partners are confirmed — you need to name specific coalition activities and partner roles in this section. Partners must be in this document.", aiCanHelp: true, aiAction: "Draft Program Design section" },
          { id: "b3", task: "Build line-item budget", owner: "Dr. Flood", status: "pending", dueDate: "2026-03-27", guidance: "DFC budget is $125K/year max. Key categories: Personnel (Project Director, Coalition Coordinator), Travel, Supplies, Contractual (evaluator), Other (meeting costs, prevention materials). Remember: dollar-for-dollar match required — document in-kind contributions from coalition partners.", aiCanHelp: true, aiAction: "Generate budget template with line items" },
          { id: "b4", task: "Finalize Logic Model with platform data", owner: "AI + Dr. Flood Review", status: "in-progress", dueDate: "2026-03-24", guidance: "Logic Model must show: Inputs (coalition, platforms, funding) → Activities (prevention strategies, data collection, coalition meetings) → Outputs (# trained, # events, # data points) → Short-term Outcomes (reduced perception of risk) → Long-term Outcomes (reduced youth substance use). The AI can generate this from your platform capabilities.", aiCanHelp: true, aiAction: "Generate Logic Model framework" },
          { id: "b5", task: "Draft evaluation methodology", owner: "Better Science Lab + Dr. Flood", status: "pending", dueDate: "2026-03-28", guidance: "DFC requires 4 core measures collected via community surveys. Better Science Lab should design the methodology. Include: survey instruments, sampling strategy, data collection timeline, analysis plan. The evaluator must be independent of program delivery.", aiCanHelp: true, aiAction: "Draft evaluation methodology outline" },
          { id: "b6", task: "Compile coalition membership documentation", owner: "Dr. Flood", status: "pending", dueDate: "2026-03-26", guidance: "You need: (1) Complete membership roster with all 12 sectors, (2) Signed MOUs from each member, (3) Coalition bylaws, (4) Meeting minutes from at least 2 meetings, (5) Letters of support from each member organization. THIS IS WHERE YOUR PARTNER OUTREACH MATTERS — you can't compile what you don't have yet.", aiCanHelp: true, aiAction: "Generate coalition roster template and MOU template" },
        ],
      },
      {
        id: "review", name: "3. Review & Approve", description: "Dr. Flood reviews every section, signs off before submission", status: "upcoming",
        tasks: [
          { id: "r1", task: "Review and approve Program Narrative", owner: "Dr. Flood", status: "pending", dueDate: "2026-04-01" },
          { id: "r2", task: "Review and approve Budget & Justification", owner: "Dr. Flood", status: "pending", dueDate: "2026-04-02" },
          { id: "r3", task: "Review and approve Logic Model", owner: "Dr. Flood", status: "pending", dueDate: "2026-04-02" },
          { id: "r4", task: "Final compliance check against NOFO requirements", owner: "Dr. Flood + AI", status: "pending", dueDate: "2026-04-05" },
          { id: "r5", task: "External review by advisory board member", owner: "Advisory Board", status: "pending", dueDate: "2026-04-07" },
        ],
      },
      {
        id: "submit", name: "4. Package & Submit", description: "Bundle all approved docs, upload to Grants.gov", status: "upcoming",
        tasks: [
          { id: "s1", task: "Assemble final package (all sections approved)", owner: "Dr. Flood + AI", status: "pending", dueDate: "2026-04-09" },
          { id: "s2", task: "Format per Grants.gov requirements", owner: "AI", status: "pending", dueDate: "2026-04-10" },
          { id: "s3", task: "Upload to Grants.gov (allow 48hr buffer)", owner: "Dr. Flood", status: "pending", dueDate: "2026-04-12" },
          { id: "s4", task: "Confirm submission receipt and tracking number", owner: "Dr. Flood", status: "pending", dueDate: "2026-04-12" },
        ],
      },
      {
        id: "pre-execute", name: "5. Pre-Execution Readiness", description: "Prepare for Day 1 if awarded", status: "upcoming",
        tasks: [
          { id: "p1", task: "Draft 90-day implementation timeline", owner: "Dr. Flood + AI", status: "pending", dueDate: "2026-04-20" },
          { id: "p2", task: "Identify and pre-recruit key staff positions", owner: "Dr. Flood", status: "pending", dueDate: "2026-04-25" },
          { id: "p3", task: "Set up data collection instruments in platform", owner: "AI", status: "pending", dueDate: "2026-04-22" },
          { id: "p4", task: "Schedule coalition kickoff meeting", owner: "Dr. Flood", status: "pending", dueDate: "2026-04-28" },
        ],
      },
    ],
    preExecutionChecklist: [
      { id: "pe-1", category: "Registration", item: "SAM.gov registration active and current", status: "verified", notes: "Verify UEI number is valid", guidance: "Your SAM.gov registration must be active and current. Verify at sam.gov — search by ThriveUp Academy's UEI. Registration must be renewed annually. Ensure NAICS codes include 624190 (Other Individual and Family Services) and 611710 (Educational Support Services).", resources: [{ label: "SAM.gov", url: "https://sam.gov" }] },
      { id: "pe-2", category: "Registration", item: "Grants.gov account active", status: "verified", notes: "AOR credentials confirmed", guidance: "Your Authorized Organization Representative (AOR) must have an active Grants.gov account. The AOR is the person who will submit the application. Verify login credentials now — don't discover issues on submission day.", resources: [{ label: "Grants.gov", url: "https://www.grants.gov" }] },
      { id: "pe-3", category: "Registration", item: "DUNS number on file", status: "verified", notes: "", guidance: "DUNS numbers have been replaced by UEI (Unique Entity Identifier) through SAM.gov. Confirm your UEI is on file and matches across all systems." },
      { id: "pe-4", category: "Compliance", item: "501(c)(3) determination letter attached", status: "pending", notes: "ThriveUp Academy 501(c)(3)", guidance: "Attach your IRS 501(c)(3) determination letter. If your status is less than 3 years old, include your most recent Form 990 as well. DFC requires the applicant to be a 501(c)(3) or unit of local government." },
      { id: "pe-5", category: "Compliance", item: "Audit report (if applicable) included", status: "action-needed", notes: "Check if single audit required", guidance: "If ThriveUp Academy spent $750,000+ in federal funds in the most recent fiscal year, a Single Audit (2 CFR 200 Subpart F) is required. If you haven't received federal funds yet, you're exempt — but document that clearly. If you need an audit, engage a CPA firm experienced with federal audits immediately.", resources: [{ label: "2 CFR 200 Audit Requirements", url: "https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200/subpart-F" }] },
      { id: "pe-6", category: "Compliance", item: "Indirect cost rate agreement", status: "pending", notes: "Negotiate with cognizant agency or use de minimis 10%", guidance: "You have two options: (1) Negotiate an indirect cost rate with your cognizant federal agency, or (2) Use the de minimis rate of 10% of modified total direct costs. For a first-time federal applicant, the de minimis 10% rate is the fastest path — no negotiation needed, just document it in your budget narrative." },
      { id: "pe-7", category: "Coalition", item: "All 12 sectors have confirmed representatives", status: "action-needed", notes: "Verify sector coverage completeness", guidance: "This is your MOST CRITICAL action item. DFC requires all 12 sectors:\n1. Youth\n2. Parents\n3. Business community\n4. Media\n5. Schools\n6. Youth-serving organizations\n7. Law enforcement\n8. Religious/fraternal\n9. Civic/volunteer groups\n10. Healthcare professionals\n11. State/local government\n12. Other substance use organizations\n\nMap your current members to sectors. Identify gaps. Use the 'Find Partners' button below to get AI recommendations for Austin-area organizations to fill each gap." },
      { id: "pe-8", category: "Coalition", item: "MOUs signed with key partners", status: "pending", notes: "Priority: schools, law enforcement, healthcare", guidance: "MOUs should specify: (1) each partner's role in the coalition, (2) specific contributions (staff time, meeting space, data sharing, in-kind), (3) commitment period (5 years to match grant). Priority sectors for MOUs: schools (Austin ISD), law enforcement (APD), healthcare (CommUnityCare or Integral Care). Use 'Outreach Templates' button to generate MOU cover letters." },
      { id: "pe-9", category: "Data", item: "Baseline data collection instruments ready", status: "verified", notes: "DFC Reporting module has all 4 core measures", guidance: "Your platform tracks all 4 DFC core measures: (1) past 30-day use, (2) perception of risk/harm, (3) perception of disapproval, (4) age of first use. Ensure survey instruments match DFC's required questions exactly." },
      { id: "pe-10", category: "Data", item: "IRB approval or exemption documented", status: "action-needed", notes: "Contact university partner for IRB review", guidance: "DFC data collection involves surveying youth about substance use, which typically requires IRB review. Contact UT Austin's Office of Research Support (IRB office) or Texas State University for an IRB review. If your data collection uses only anonymous aggregate surveys, you may qualify for IRB exemption — but you still need the exemption letter documented.", resources: [{ label: "UT Austin IRB", url: "https://research.utexas.edu/ors/human-subjects/" }] },
      { id: "pe-11", category: "Technology", item: "Platform configured for DFC program tracking", status: "verified", notes: "Coalition Dashboard, Prevention Hub, DFC Reporting all live", guidance: "Your Coalition Dashboard, Prevention Hub, and DFC Reporting module are operational. Verify they can export data in formats SAMHSA requires for semi-annual progress reports." },
      { id: "pe-12", category: "Technology", item: "Staff accounts and permissions configured", status: "pending", notes: "Set up after award notification", guidance: "This can be completed post-award during the 90-day startup period. Plan for: Project Director account, Coalition Coordinator account, Evaluator read-only access, and coalition member portal access." },
      { id: "pe-13", category: "Staffing", item: "Project Director identified", status: "verified", notes: "Dr. Terry Flood", guidance: "Dr. Terry Flood is confirmed as Project Director. Ensure his bio/CV is updated to reflect relevant coalition leadership and substance use prevention experience. DFC reviewers want to see the PD has community coalition experience." },
      { id: "pe-14", category: "Staffing", item: "Evaluator identified or RFP drafted", status: "pending", notes: "Better Science Lab as research partner", guidance: "Better Science Lab is your evaluation partner. Confirm their commitment with a letter of support and include their evaluation approach in the application. They should be listed as a subcontractor in the budget. Ensure they have experience with SAMHSA/DFC evaluation requirements and can help with the 4 core measures analysis." },
      { id: "pe-15", category: "Financial", item: "Fiscal systems ready for federal funds", status: "pending", notes: "Chart of accounts, time tracking, match documentation", guidance: "Federal grants require: (1) A chart of accounts that separates DFC funds from other funding, (2) Time-and-effort tracking for all staff charged to the grant, (3) Match documentation system to track your $125K/year in-kind match, (4) Financial policies manual. If you don't have these, consider hiring a part-time grants accountant or contracting with a fiscal sponsor experienced in federal grants." },
    ],
    winStrategy: {
      differentiators: [
        "Only applicant with a 14-platform integrated ecosystem — not a single tool, but an entire infrastructure",
        "MAP-GAP methodology provides structured continuous improvement that ONDCP reviewers prioritize",
        "SALP fidelity tracking gives real-time curriculum adherence data (most programs report quarterly)",
        "Three Realities framework proves community grounding isn't performative — it's methodological",
        "Dr. Flood's proprietary methodologies (MAP-GAP, SALP, Three Realities, MG-PATR) are academic-grade, not consultant-grade",
      ],
      reviewerPriorities: [
        "Strong coalition with documented 12-sector membership",
        "Evidence-based prevention strategies with fidelity measures",
        "Clear data collection plan for the 4 core measures",
        "Community readiness and needs assessment completeness",
        "Sustainability beyond the grant period",
        "Youth involvement in prevention activities",
      ],
      scoringTips: [
        "Lead with data — local prevalence rates, community needs, existing gaps",
        "Show the coalition is real and active, not aspirational",
        "Connect every platform capability to a specific ONDCP requirement",
        "Demonstrate existing infrastructure — reviewers fund what's ready, not what's planned",
        "Include specific metrics and targets, not vague promises",
      ],
      commonPitfalls: [
        "Coalition exists on paper but has no documented activity",
        "Prevention strategies not from SAMHSA's NREPP or similar registries",
        "Budget doesn't align with narrative activities",
        "No independent evaluator identified",
        "Sustainability plan is vague ('we'll seek other funding')",
      ],
    },
  },
  {
    id: "wioa",
    name: "WIOA Title I Youth",
    fullName: "Workforce Innovation and Opportunity Act — Title I Youth Programs",
    funder: "U.S. Department of Labor (DOL)",
    amount: "$200,000 - $500,000/year",
    deadline: "Rolling (State Workforce Board)",
    deadlineUrgency: "on-track",
    icon: Briefcase,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    description: "Federal workforce development funding for career pathways, skills training, credential attainment, and employment services for youth and adults facing barriers.",
    referenceUrl: "https://www.dol.gov/agencies/eta/youth/wioa-formula",
    referenceLabel: "DOL WIOA Youth Programs",
    grantKnowledge: `WIOA Title I Youth Programs — $200,000–$500,000/year via Local Workforce Development Board formula allocation.
PURPOSE: Provide comprehensive workforce services to eligible youth ages 16–24 (In-School Youth and Out-of-School Youth) who face barriers to employment and education. At least 75% of funds must serve Out-of-School Youth (OSY). At least 20% of funds must be spent on Work Experience (paid/unpaid internships, pre-apprenticeship, OJT).
14 REQUIRED YOUTH PROGRAM ELEMENTS: (1) Tutoring/study skills/dropout prevention, (2) Alternative secondary school services, (3) Paid/unpaid work experience, (4) Occupational skills training, (5) Education offered concurrently with workforce preparation, (6) Leadership development, (7) Supportive services, (8) Adult mentoring (12 months minimum), (9) Follow-up services (12 months post-exit), (10) Comprehensive guidance and counseling, (11) Financial literacy education, (12) Entrepreneurial skills training, (13) Services that provide labor market info, (14) Transition to postsecondary activities.
6 PRIMARY PERFORMANCE INDICATORS: (1) Employment Rate Q2 after exit, (2) Employment Rate Q4 after exit, (3) Median Earnings Q2 after exit, (4) Credential Attainment within 4 quarters, (5) Measurable Skill Gains, (6) Effectiveness in Serving Employers.
ELIGIBLE YOUTH BARRIERS: School dropout, basic skills deficient, English learner, offender, homeless/runaway/foster, pregnant/parenting, disability, low-income requiring assistance.
APPLICATION: Submitted to Local Workforce Development Board; requires MOU, program design, budget, performance targets, employer engagement plan.
SERVICE AREA: Central Texas (Travis, Williamson, Hays, Bastrop, Caldwell counties). Target LWDB: Workforce Solutions Capital Area (serving Travis County and surrounding region). Key industry sectors: Healthcare, Information Technology, Advanced Manufacturing, Construction, Transportation/Logistics.`,
    serviceArea: {
      region: "Central Texas",
      state: "Texas",
      counties: ["Travis", "Williamson", "Hays", "Bastrop", "Caldwell"],
      city: "Austin",
      lwdbName: "Workforce Solutions Capital Area",
      lwdbUrl: "https://www.wfsca.org/",
      keyIndustries: ["Healthcare", "Information Technology", "Advanced Manufacturing", "Construction", "Transportation/Logistics"],
      targetEmployers: [
        { name: "Ascension Seton", sector: "Healthcare", type: "Hospital system — CNA, Medical Assistant, Patient Care Tech pathways" },
        { name: "St. David's HealthCare", sector: "Healthcare", type: "Hospital system — Allied health, nursing pathways" },
        { name: "CommUnityCare Health Centers", sector: "Healthcare", type: "FQHC — Community health worker, medical assistant roles" },
        { name: "Dell Technologies", sector: "Information Technology", type: "IT support, help desk, cybersecurity entry-level" },
        { name: "Indeed", sector: "Information Technology", type: "Customer support, data entry, tech support pathways" },
        { name: "Samsung Austin Semiconductor", sector: "Advanced Manufacturing", type: "Production technician, quality control, equipment maintenance" },
        { name: "Tesla Gigafactory Texas", sector: "Advanced Manufacturing", type: "Production associate, logistics, warehouse operations" },
        { name: "Austin ISD", sector: "Education", type: "Paraprofessional, after-school program staff, custodial" },
        { name: "H-E-B", sector: "Retail/Logistics", type: "Store operations, warehouse, CDL training partnerships" },
        { name: "City of Austin", sector: "Government", type: "Parks & rec, public works, administrative assistant pathways" },
      ],
      laborMarketNotes: "Austin MSA youth unemployment (16-24) at ~10.2% vs 7.8% statewide. Travis County has ~18,000 OSY ages 16-24. Growth sectors: healthcare (+12% projected 5yr), IT (+15%), construction (+9%). Median entry-level wage $16.50/hr. Major credential gaps in CNA, CompTIA, CDL, welding certifications.",
      locationEligibility: "statewide",
      locationNotes: "WIOA Title I Youth is administered through each state's Local Workforce Development Boards (LWDBs). You apply to the LWDB serving your target area. In Texas there are 28 LWDBs — you can apply to one or multiple. Your primary target is Workforce Solutions Capital Area (Austin/Travis County). You could also apply to other Texas LWDBs for additional service areas (e.g., Workforce Solutions Rural Capital Area for Williamson/Hays/Bastrop counties).",
      multiSiteEligible: true,
      multiSiteNotes: "You can submit separate applications to different LWDBs in Texas for different service areas. Each LWDB has its own funding allocation and priorities. Consider: Workforce Solutions Capital Area (Travis Co.), Workforce Solutions Rural Capital Area (Williamson, Hays, Bastrop, Caldwell, Blanco, Burnet, Fayette, Lee, Llano counties), or even boards in other Texas metros (Dallas, Houston, San Antonio) if you want to expand.",
    },
    partnershipTimeline: {
      summary: "WIOA employer partners MUST be named in your application — they demonstrate your work-based learning capacity. The LWDB relationship must exist BEFORE you apply. Secure employer commitments and LWDB intro first, then draft.",
      workflowOrder: "LWDB Relationship → Employer Commitments → Then Draft Documents",
      requirements: [
        { partnerType: "Local Workforce Development Board (LWDB)", requiredInDocs: true, timing: "pre-award", docSections: ["Program Narrative", "Partnership Documentation"], description: "The LWDB IS your funder for WIOA. You must have an existing relationship with them before applying. They need to know you, your programs, and your capacity. This is not optional — they select service providers based on relationships, track record, and alignment with their local plan.", evidenceNeeded: "Documentation of meetings with LWDB staff, understanding of their local plan, formal application through their procurement process" },
        { partnerType: "Employer Partners (Work-Based Learning)", requiredInDocs: true, timing: "pre-award", docSections: ["Program Narrative", "Budget & Justification", "Partnership Documentation"], description: "WIOA requires 20% of funds on work experience. You must name employers who will provide internships, OJT, or pre-apprenticeships. Signed commitment letters dramatically strengthen your application. Reviewers want to see real employer relationships, not aspirational ones.", evidenceNeeded: "Signed letters of commitment on company letterhead specifying: number of positions, types of roles, supervision commitment, timeline. At minimum 3-5 employers across different sectors." },
        { partnerType: "Educational Partners", requiredInDocs: true, timing: "pre-award", docSections: ["Program Narrative"], description: "Partners who provide credentials, certifications, or educational services. Community colleges, trade schools, certification bodies. Named in the narrative to show your training pipeline.", evidenceNeeded: "Letters of support, articulation agreements, credential program descriptions" },
        { partnerType: "Referral / Community Partners", requiredInDocs: false, timing: "both", docSections: ["Program Narrative"], description: "Organizations that will refer youth to your program or provide wraparound services (housing, childcare, transportation). Helpful to name but not strictly required. Can be formalized post-award.", evidenceNeeded: "Letters of support are helpful but MOUs can be finalized post-award" },
        { partnerType: "Case Management / Support Services", requiredInDocs: false, timing: "post-award", docSections: [], description: "Detailed case management partnerships and service agreements can be formalized after award. You should describe your approach in the narrative but formal agreements come later.", evidenceNeeded: "Service agreements, referral protocols — formalized during 90-day startup period after award" },
      ],
    },
    competitiveEdge: [
      "50+ career pathways with stackable credentials already built in platform",
      "Integrated case management with Individual Employment Plans (IEPs)",
      "Real-time WIOA performance accountability tracking (entered employment, median earnings, credential attainment)",
      "Employer engagement portal with job placement pipeline",
      "MCE platform provides minority business support — rare in WIOA applications",
    ],
    sections: [
      { id: "wioa-narrative", name: "Program Narrative", description: "Service delivery design, career pathways, employer engagement strategy", icon: FileText, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI", pageLimit: "20 pages", wordCount: "6,000–8,000 words" },
      { id: "wioa-budget", name: "Budget & Cost Allocation", description: "Cost categories aligned to WIOA allowable costs", icon: DollarSign, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "5 pages", wordCount: "1,500–2,000 words" },
      { id: "wioa-performance", name: "Performance Targets", description: "Proposed targets for all 6 WIOA primary indicators", icon: BarChart3, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI", pageLimit: "3 pages", wordCount: "1,000–1,500 words" },
      { id: "wioa-eligibility", name: "Eligibility & Outreach Plan", description: "Target population, eligibility verification, recruitment strategy", icon: Users, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "5 pages", wordCount: "1,500–2,000 words" },
      { id: "wioa-employer", name: "Employer Partnership Letters", description: "Committed employer partners for work-based learning", icon: Building2, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "No limit (1 per employer)", wordCount: "300–500 words each" },
      { id: "wioa-14elements", name: "14 Youth Elements Plan", description: "How all 14 required WIOA youth program elements are delivered", icon: ClipboardCheck, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "AI + Dr. Flood Review", pageLimit: "8 pages", wordCount: "2,500–3,500 words" },
      { id: "wioa-mou", name: "MOU with Workforce Board", description: "Memorandum of Understanding with Local Workforce Development Board", icon: Handshake, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "3 pages", wordCount: "800–1,200 words" },
    ],
    phases: [
      {
        id: "collaborate", name: "1. Collaborate & Research", description: "Understand local workforce board priorities and requirements", status: "upcoming",
        tasks: [
          { id: "wc1", task: "Identify target Local Workforce Development Board (LWDB)", owner: "Dr. Flood", status: "pending", dueDate: "TBD", guidance: "Your primary target is Workforce Solutions Capital Area (wfsca.org) which serves Travis County. You could also apply to Workforce Solutions Rural Capital Area for Williamson, Hays, Bastrop, Caldwell counties. Contact the Youth Program Manager at your target LWDB to discuss funding availability and local priorities before writing." },
          { id: "wc2", task: "Review state WIOA plan and local area priorities", owner: "Dr. Flood + AI", status: "pending", dueDate: "TBD", guidance: "Texas Workforce Commission publishes the state WIOA plan at twc.texas.gov. Your LWDB also publishes a Local Plan with specific priority sectors, performance targets, and youth service strategies. Align your proposal to BOTH. The AI can analyze these documents if you share them.", aiCanHelp: true, aiAction: "Analyze state/local WIOA plan alignment" },
          { id: "wc3", task: "Map platform capabilities to all 14 WIOA youth elements", owner: "AI", status: "pending", dueDate: "TBD", guidance: "WIOA requires all 14 youth program elements. ThriveUp's 14 platforms map directly — e.g., ThriveUp Academy = tutoring, WholeMind = comprehensive guidance, SafeReport = safe environment, MCE = entrepreneurial skills. The AI can generate a complete platform-to-element mapping matrix.", aiCanHelp: true, aiAction: "Generate 14-element platform mapping" },
          { id: "wc4", task: "Identify 3-5 employer partners for work-based learning", owner: "Dr. Flood", status: "pending", dueDate: "TBD", guidance: "WIOA requires 20% of funds on Work Experience. Target Austin-area employers in growth sectors: Healthcare (Ascension Seton, St. David's, CommUnityCare), IT (Dell, Indeed), Manufacturing (Samsung, Tesla Gigafactory), Logistics (H-E-B, Amazon). Reach out to HR/workforce development contacts. You need signed commitment letters." },
          { id: "wc5", task: "Gather local labor market data for target occupations", owner: "AI", status: "pending", dueDate: "TBD", guidance: "Pull Austin MSA data from BLS, Texas Workforce Commission, and EMSI/Lightcast. Key data points: youth unemployment rate (16-24), in-demand occupations, median wages by sector, credential gaps, OSY population estimates for Travis County (~18,000). The AI can compile this into a data brief.", aiCanHelp: true, aiAction: "Compile Austin labor market data brief" },
        ],
      },
      {
        id: "build", name: "2. Build & Draft", description: "Write proposal sections and compile documentation", status: "upcoming",
        tasks: [
          { id: "wb1", task: "Draft program design with career pathway model", owner: "AI + Dr. Flood Review", status: "pending", dueDate: "TBD" },
          { id: "wb2", task: "Develop budget aligned to WIOA allowable costs", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "wb3", task: "Set performance targets based on state negotiated levels", owner: "Dr. Flood + AI", status: "pending", dueDate: "TBD" },
          { id: "wb4", task: "Document 14 youth elements delivery plan", owner: "AI + Dr. Flood Review", status: "pending", dueDate: "TBD" },
          { id: "wb5", task: "Secure employer commitment letters", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
        ],
      },
      {
        id: "review", name: "3. Review & Approve", description: "Dr. Flood reviews and approves all sections", status: "upcoming",
        tasks: [
          { id: "wr1", task: "Review and approve complete narrative", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "wr2", task: "Review and approve budget", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "wr3", task: "Verify performance targets are achievable", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "wr4", task: "Final compliance review against WIOA regulations", owner: "Dr. Flood + AI", status: "pending", dueDate: "TBD" },
        ],
      },
      {
        id: "submit", name: "4. Package & Submit", description: "Bundle and submit to workforce board", status: "upcoming",
        tasks: [
          { id: "ws1", task: "Assemble final package per LWDB format requirements", owner: "AI + Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "ws2", task: "Submit to Local Workforce Development Board", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "ws3", task: "Confirm receipt and review timeline", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
        ],
      },
      {
        id: "pre-execute", name: "5. Pre-Execution Readiness", description: "Prepare for program launch", status: "upcoming",
        tasks: [
          { id: "wp1", task: "Configure WIOA performance tracking in platform", owner: "AI", status: "pending", dueDate: "TBD" },
          { id: "wp2", task: "Set up Individual Employment Plan templates", owner: "AI + Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "wp3", task: "Recruit and onboard case managers", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "wp4", task: "Establish employer partner onboarding workflow", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
        ],
      },
    ],
    preExecutionChecklist: [
      { id: "wpe-1", category: "Registration", item: "SAM.gov registration active", status: "verified", notes: "", guidance: "Your SAM.gov registration must be current and active. Verify at sam.gov — search for ThriveUp Academy. Ensure your UEI number matches across all federal systems.", resources: [{ label: "SAM.gov", url: "https://sam.gov" }] },
      { id: "wpe-2", category: "Compliance", item: "501(c)(3) status confirmed", status: "pending", notes: "", guidance: "Attach your IRS 501(c)(3) determination letter to the application. If your status is less than 5 years old, you may also need to include most recent Form 990. ThriveUp Academy's EIN should be on file." },
      { id: "wpe-3", category: "Compliance", item: "WIOA eligible provider status", status: "action-needed", notes: "Apply through state Eligible Training Provider List (ETPL)", guidance: "Texas requires training providers to be on the state's Eligible Training Provider List (ETPL). Apply through the Texas Workforce Commission. This process can take 30-90 days — start immediately. Without ETPL status, you cannot receive WIOA training funds.", resources: [{ label: "Texas ETPL Application", url: "https://www.twc.texas.gov/programs/eligible-training-provider-system" }] },
      { id: "wpe-4", category: "Partnerships", item: "LWDB relationship established", status: "action-needed", notes: "Contact local board for partnership discussion", guidance: "Contact Workforce Solutions Capital Area (WFSCA). Ask for the Youth Program Director. Request a meeting to discuss: (1) current funding availability for WIOA Title I Youth, (2) their local priorities and performance targets, (3) what they look for in service providers, (4) MOU requirements. This is the most critical relationship — they are your funder.", resources: [{ label: "WFSCA Website", url: "https://www.wfsca.org/" }] },
      { id: "wpe-5", category: "Partnerships", item: "Minimum 3 employer partners committed", status: "pending", notes: "", guidance: "You need signed commitment letters from employers who will provide work-based learning opportunities (internships, OJT, pre-apprenticeships). Target Austin employers in growth sectors:\n• Healthcare: Ascension Seton, St. David's HealthCare, CommUnityCare\n• IT: Dell Technologies, Indeed, National Instruments\n• Manufacturing: Samsung Austin Semiconductor, Tesla Gigafactory\n• Retail/Logistics: H-E-B, Amazon\n• Government: City of Austin, Travis County\nReach out to HR/community relations departments. Offer to provide pre-screened, trained youth." },
      { id: "wpe-6", category: "Data", item: "WIOA performance tracking configured", status: "verified", notes: "Workforce Dashboard tracks all 6 primary indicators", guidance: "Your platform already tracks the 6 WIOA primary indicators. Ensure data can be exported in formats compatible with the state workforce data system (TWIST in Texas)." },
      { id: "wpe-7", category: "Staffing", item: "Case managers identified", status: "pending", notes: "", guidance: "WIOA programs require dedicated case managers with reasonable caseloads (typically 1:25-35 ratio). You need case managers experienced with WIOA documentation requirements: eligibility verification, ISS development, service tracking, follow-up contacts. Consider hiring from Workforce Solutions alumni or social work programs at UT Austin or Texas State." },
      { id: "wpe-8", category: "Technology", item: "Career pathway tools configured", status: "verified", notes: "Career Explorer, Pathway Builder, Assessment tools all live", guidance: "Your platform's career pathway tools are operational. Ensure they are configured with Austin-area labor market data, local employer information, and credential requirements for in-demand occupations." },
      { id: "wpe-9", category: "Financial", item: "Cost allocation methodology documented", status: "pending", notes: "Required for WIOA cost categories", guidance: "WIOA requires costs categorized as: (1) Youth Program activities (minimum 80%), (2) Administrative costs (maximum 10%), (3) Work Experience (minimum 20% of total). You need a cost allocation methodology if costs are shared across programs. Consider using the de minimis 10% indirect cost rate if you don't have a negotiated rate." },
    ],
    winStrategy: {
      differentiators: [
        "Integrated technology platform — most WIOA providers use disconnected systems",
        "50+ career pathways already built with credential tracking",
        "MCE minority business platform adds unique small business pipeline",
        "Real-time performance accountability (not quarterly batch reporting)",
        "AI-powered career matching reduces time-to-placement",
      ],
      reviewerPriorities: [
        "Strong employer partnerships with documented commitments",
        "Clear career pathways aligned to local labor market demand",
        "Performance targets that are ambitious but achievable",
        "All 14 youth program elements addressed",
        "Evidence of organizational capacity to manage federal funds",
        "Measurable outcomes with tracking methodology",
      ],
      scoringTips: [
        "Align career pathways to the state's in-demand occupation list",
        "Show existing employer relationships, not planned ones",
        "Reference local labor market data for every career pathway",
        "Demonstrate how technology reduces cost-per-participant",
        "Include credential attainment projections with baseline data",
      ],
      commonPitfalls: [
        "Career pathways not aligned to local labor market demand",
        "No documented employer partnerships",
        "Performance targets set without understanding state negotiated levels",
        "Missing one or more of the 14 required youth program elements",
        "Budget includes unallowable costs under WIOA",
      ],
    },
  },
  {
    id: "nba-foundation",
    name: "NBA Foundation",
    fullName: "NBA Foundation — Economic Empowerment & Workforce Development",
    funder: "NBA Foundation",
    amount: "$100,000 - $500,000",
    deadline: "Rolling (LOI Required)",
    deadlineUrgency: "on-track",
    icon: Trophy,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-800",
    description: "The NBA Foundation funds programs that drive economic empowerment for Black communities through workforce development, career advancement, and entrepreneurship pathways for youth and young adults ages 16-24.",
    referenceUrl: "https://nbafoundation.nba.com/apply/",
    referenceLabel: "NBA Foundation Application",
    grantKnowledge: `NBA Foundation — Economic Empowerment Grants — $100,000–$500,000.
PURPOSE: Drive economic empowerment in Black communities, especially for youth and young adults ages 16-24. Focuses on workforce development, career advancement, entrepreneurship, and wealth creation pathways.
FUNDING PRIORITIES: (1) Employment and career pathways for Black youth, (2) Entrepreneurship and wealth-building programs, (3) Economic mobility through skills training, (4) Community-driven approaches that center Black leadership and voice.
APPLICATION PROCESS: Two-stage — Letter of Inquiry (LOI) first, then full proposal by invitation. LOI should include: organization overview, program summary, target population, proposed budget, expected outcomes.
WHAT THEY LOOK FOR: Programs led by or deeply connected to Black communities; measurable economic outcomes (job placement, wage increases, business starts, credential attainment); innovative approaches; strong organizational track record; sustainability beyond grant period; community voice in design.
GRANT TYPES: General Operating, Program-Specific, and Capacity Building. Multi-year grants available.
ELIGIBILITY: 501(c)(3) organizations or fiscal sponsors; must demonstrate authentic connection to Black community; preference for organizations with diverse leadership.`,
    competitiveEdge: [
      "ThriveUp serves exactly the target demographic — Black youth 16-24 facing employment barriers",
      "Integrated entrepreneurship pipeline through MCE (Minority Capital Exchange)",
      "AI-powered career exploration makes pathways tangible, not theoretical",
      "Financial literacy module teaches wealth-building, not just budgeting",
      "VOSB designation and minority business infrastructure show authentic community investment",
    ],
    serviceArea: {
      region: "Central Texas",
      state: "Texas",
      counties: ["Travis", "Williamson", "Hays"],
      city: "Austin",
      keyIndustries: ["Healthcare", "Information Technology", "Skilled Trades", "Entrepreneurship", "Logistics"],
      targetEmployers: [
        { name: "Ascension Seton / St. David's", sector: "Healthcare", type: "Entry-level CNA, medical assistant, patient care tech roles" },
        { name: "Dell Technologies / Indeed", sector: "Technology", type: "IT support, help desk, customer success — entry to mid-level" },
        { name: "Capital Metro", sector: "Transportation", type: "CDL training, operations, maintenance pathways" },
        { name: "Austin Chamber Black Business", sector: "Entrepreneurship", type: "MCE-aligned small business pipeline, mentorship network" },
        { name: "Goodwill Central Texas", sector: "Workforce", type: "Career readiness, job coaching, community integration" },
      ],
      laborMarketNotes: "Austin MSA Black youth unemployment significantly higher than metro average. Strong demand in healthcare, IT, and skilled trades. MCE can connect to Black-owned businesses for entrepreneurship mentorship pipeline.",
      locationEligibility: "national",
      locationNotes: "NBA Foundation accepts applications from anywhere in the United States. There are no geographic restrictions. Your program should serve Black youth ages 16-24 in a defined community — Austin, TX is your primary site. You can propose serving multiple locations if you have the capacity.",
      multiSiteEligible: true,
      multiSiteNotes: "You can propose a single-site program (Austin) or a multi-site model. Multi-site is stronger if you can demonstrate capacity in each location. For a first application, single-site (Austin) is recommended to show focused impact. You can expand in subsequent funding years.",
    },
    partnershipTimeline: {
      summary: "NBA Foundation values strong community partnerships but the LOI can be submitted without formal partner agreements. For the full proposal (if invited), employer partners and community organizations should be named. Secure key partnerships between LOI and full proposal.",
      workflowOrder: "LOI First (name key partners) → Secure Formal Commitments → Full Proposal with Documentation",
      requirements: [
        { partnerType: "Employer Partners", requiredInDocs: true, timing: "both", docSections: ["Full Proposal Narrative", "Partnership Documentation"], description: "For the LOI, describe the types of employers you'll partner with — specific names strengthen it but aren't required. For the full proposal, you MUST name specific employers with commitment details. Use the time between LOI submission and full proposal invitation to secure these.", evidenceNeeded: "LOI: employer types and sectors. Full proposal: signed commitment letters, named contacts, specific role descriptions and placement numbers" },
        { partnerType: "Community Organizations", requiredInDocs: true, timing: "both", docSections: ["Full Proposal Narrative", "Equity & Community Voice", "Partnership Documentation"], description: "Black-led community organizations that validate your community connection. NBA Foundation explicitly looks for community-rooted partnerships, not transactional ones. Start building these now — they strengthen both LOI and full proposal.", evidenceNeeded: "LOI: named organizations and relationship description. Full proposal: letters of support, joint programming descriptions, community voice documentation" },
        { partnerType: "Educational Institutions", requiredInDocs: false, timing: "both", docSections: ["Full Proposal Narrative"], description: "Schools, community colleges, or certification providers. Helpful but not strictly required. Strengthens the credential pipeline narrative.", evidenceNeeded: "Letters of support, articulation agreements for credential programs" },
        { partnerType: "Mentorship / MCE Business Partners", requiredInDocs: false, timing: "post-award", docSections: [], description: "MCE (Minority Capital Exchange) business mentors and Black-owned business partners for the entrepreneurship pipeline. Can be formalized post-award as part of program implementation.", evidenceNeeded: "Mentor roster, business partner agreements — can be developed during startup period" },
      ],
    },
    sections: [
      { id: "nba-loi", name: "Letter of Inquiry (LOI)", description: "Initial inquiry with program overview, population served, and funding request", icon: FileText, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI", pageLimit: "3 pages", wordCount: "800–1,200 words" },
      { id: "nba-narrative", name: "Full Proposal Narrative", description: "Program design, theory of change, target population, implementation plan", icon: BookOpen, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI", pageLimit: "15 pages", wordCount: "5,000–6,000 words" },
      { id: "nba-budget", name: "Budget & Justification", description: "Detailed budget with cost-per-participant and overhead allocation", icon: DollarSign, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "3 pages", wordCount: "1,000–1,500 words" },
      { id: "nba-outcomes", name: "Outcomes Framework", description: "Measurable outcomes: employment, wage gains, credential attainment, business starts", icon: BarChart3, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI", pageLimit: "3 pages", wordCount: "1,000–1,500 words" },
      { id: "nba-org-capacity", name: "Organizational Capacity", description: "Board composition, leadership bios, financial statements, prior program results", icon: Building2, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "5 pages", wordCount: "1,500–2,000 words" },
      { id: "nba-equity", name: "Equity & Community Voice", description: "How program design centers Black community voice and lived experience", icon: Heart, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "3 pages", wordCount: "1,000–1,500 words" },
      { id: "nba-partnerships", name: "Partnership Documentation", description: "Employer partners, community organizations, educational institutions", icon: Handshake, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "No limit (1 per partner)", wordCount: "300–500 words each" },
      { id: "nba-sustainability", name: "Sustainability & Scale Plan", description: "How program continues and grows beyond NBA Foundation funding", icon: Globe, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "3 pages", wordCount: "1,000–1,500 words" },
    ],
    phases: [
      {
        id: "collaborate", name: "1. Collaborate & Research", description: "Understand NBA Foundation priorities and align program", status: "upcoming",
        tasks: [
          { id: "nc1", task: "Review NBA Foundation guidelines and past grantees", owner: "Dr. Flood + AI", status: "pending", dueDate: "TBD" },
          { id: "nc2", task: "Identify local economic empowerment data for Black youth 16-24", owner: "AI", status: "pending", dueDate: "TBD" },
          { id: "nc3", task: "Map ThriveUp + MCE capabilities to NBA Foundation priorities", owner: "AI + Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "nc4", task: "Identify 3+ Black-owned business partners for mentorship pipeline", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "nc5", task: "Gather testimonials from current program participants", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
        ],
      },
      {
        id: "build", name: "2. Build & Draft", description: "Draft LOI and full proposal materials", status: "upcoming",
        tasks: [
          { id: "nb1", task: "Draft Letter of Inquiry (2-3 pages)", owner: "AI + Dr. Flood Review", status: "pending", dueDate: "TBD" },
          { id: "nb2", task: "Draft full proposal narrative (if LOI accepted)", owner: "AI + Dr. Flood Review", status: "pending", dueDate: "TBD" },
          { id: "nb3", task: "Build budget with cost-per-participant model", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "nb4", task: "Design outcomes framework with measurable targets", owner: "AI + Dr. Flood Review", status: "pending", dueDate: "TBD" },
          { id: "nb5", task: "Compile organizational capacity documentation", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "nb6", task: "Write equity and community voice section", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
        ],
      },
      {
        id: "review", name: "3. Review & Approve", description: "Dr. Flood final review and approval", status: "upcoming",
        tasks: [
          { id: "nr1", task: "Review and approve LOI", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "nr2", task: "Review and approve full narrative", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "nr3", task: "Review and approve budget", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "nr4", task: "Verify outcomes framework is achievable", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "nr5", task: "Final alignment check with NBA Foundation priorities", owner: "Dr. Flood + AI", status: "pending", dueDate: "TBD" },
        ],
      },
      {
        id: "submit", name: "4. Package & Submit", description: "Bundle and submit LOI, then full proposal if invited", status: "upcoming",
        tasks: [
          { id: "ns1", task: "Submit LOI through NBA Foundation portal", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "ns2", task: "If invited: assemble full proposal package", owner: "Dr. Flood + AI", status: "pending", dueDate: "TBD" },
          { id: "ns3", task: "Submit full proposal per foundation guidelines", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "ns4", task: "Confirm receipt and follow up timeline", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
        ],
      },
      {
        id: "pre-execute", name: "5. Pre-Execution Readiness", description: "Prepare for launch if awarded", status: "upcoming",
        tasks: [
          { id: "np1", task: "Configure participant intake for 16-24 demographic", owner: "AI", status: "pending", dueDate: "TBD" },
          { id: "np2", task: "Set up MCE entrepreneurship pathway for participants", owner: "AI + Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "np3", task: "Establish employer partner onboarding", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "np4", task: "Design 90-day launch plan with milestone checkpoints", owner: "Dr. Flood + AI", status: "pending", dueDate: "TBD" },
        ],
      },
    ],
    preExecutionChecklist: [
      { id: "npe-1", category: "Eligibility", item: "Organization is a 501(c)(3)", status: "pending", notes: "ThriveUp Academy" },
      { id: "npe-2", category: "Eligibility", item: "Serves Black youth/young adults ages 16-24", status: "verified", notes: "Core target population" },
      { id: "npe-3", category: "Eligibility", item: "Focus on economic empowerment (not general services)", status: "verified", notes: "Career pathways + entrepreneurship" },
      { id: "npe-4", category: "Capacity", item: "Board of Directors with diverse representation", status: "pending", notes: "" },
      { id: "npe-5", category: "Capacity", item: "Financial statements (last 2 years)", status: "action-needed", notes: "Compile audited financials" },
      { id: "npe-6", category: "Capacity", item: "Prior program outcomes documented", status: "pending", notes: "Gather pilot data and case studies" },
      { id: "npe-7", category: "Partnerships", item: "Black-owned business mentorship partners identified", status: "action-needed", notes: "MCE network as pipeline" },
      { id: "npe-8", category: "Partnerships", item: "Educational institution partnerships documented", status: "pending", notes: "" },
      { id: "npe-9", category: "Technology", item: "Career Explorer and Financial Literacy configured", status: "verified", notes: "Both modules live in platform" },
      { id: "npe-10", category: "Technology", item: "MCE entrepreneurship pipeline accessible", status: "verified", notes: "MCE platform integrated" },
    ],
    winStrategy: {
      differentiators: [
        "Not just workforce training — integrated entrepreneurship pipeline through MCE",
        "AI-powered career exploration makes pathways real for 16-24 year olds",
        "Financial literacy curriculum uses real stories (LeBron, Shaq) that resonate with target demographic",
        "Three Realities ensures Black community voice drives program design, not assumptions",
        "VOSB + minority business infrastructure shows authentic investment, not performative allyship",
      ],
      reviewerPriorities: [
        "Programs that create pathways to economic empowerment, not just job placement",
        "Strong connection to Black community with authentic voice",
        "Measurable outcomes tied to economic indicators (wages, credentials, business starts)",
        "Scalability — can this model grow beyond initial funding?",
        "Organizational capacity and leadership that reflects community served",
        "Innovation — what makes this different from typical workforce programs?",
      ],
      scoringTips: [
        "Lead with the participant journey — show what a 19-year-old experiences from Day 1",
        "Emphasize the entrepreneurship pathway (MCE) — most applicants only offer job placement",
        "Show AI tools as equity multipliers, not replacement for human connection",
        "Include participant voice and stories (anonymized) in the narrative",
        "Demonstrate how the 14-platform ecosystem creates a safety net, not just a program",
      ],
      commonPitfalls: [
        "Treating workforce development as only 'get a job' — NBA Foundation wants economic empowerment",
        "Not centering Black community voice in program design",
        "Outcomes focused only on employment — include wealth-building metrics",
        "No clear theory of change connecting activities to long-term economic mobility",
        "Sustainability plan that depends entirely on future grants",
      ],
    },
  },
  {
    id: "st-davids",
    name: "St. David's Foundation",
    fullName: "St. David's Foundation — We All Benefit 2.0: Building Economic Stability",
    funder: "St. David's Foundation",
    amount: "Up to $250,000 (individual) / $1,000,000 (collaborative)",
    deadline: "Application Opens March 30, 2026",
    deadlineUrgency: "approaching",
    icon: Leaf,
    color: "text-teal-600",
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
    borderColor: "border-teal-200 dark:border-teal-800",
    description: "Investments in community-informed organizations providing core economic stability services for historically marginalized communities, with a focus on increasing enrollment in public benefits that foster economic stability.",
    referenceUrl: "https://stdavidsfoundation.org/grants/we-all-benefit/",
    referenceLabel: "St. David's Foundation — We All Benefit 2.0",
    grantKnowledge: `St. David's Foundation — "We All Benefit 2.0: Building Economic Stability" — Up to $250,000 (individual) / $1,000,000 (collaborative).
PURPOSE: Invest in community-informed organizations that provide core economic stability services to Central Texas communities, with focus on increasing enrollment in public benefits that foster economic stability and build pathways to self-sufficiency.
GEOGRAPHIC ELIGIBILITY (CRITICAL): Must serve Central Texas — specifically Bastrop, Caldwell, Hays, Travis, or Williamson counties. Collaborative track ($1M) requires at least 3 organizations with primary operations in these counties.
FUNDING PRIORITIES: (1) Public benefits enrollment (SNAP, Medicaid, CHIP, WIC, housing, childcare subsidies), (2) Financial coaching and asset building, (3) Workforce development as economic stability pathway, (4) Addressing barriers to benefits access, (5) Community-informed program design (organizations must demonstrate how community voice shapes their work).
WHAT MAKES A STRONG APPLICATION: Community-informed design is paramount — St. David's explicitly looks for how organizations listen to and incorporate the voices of people they serve. Data-driven approaches, cross-sector collaboration, cultural responsiveness, addressing systemic barriers, demonstrating impact on economic stability indicators.
APPLICATION PROCESS: Application opens March 30, 2026. Letter of Intent may be required. Full application includes: program narrative, budget, community voice evidence, outcomes plan, organizational capacity, partnership documentation.
ELIGIBILITY: 501(c)(3) organizations operating in Central Texas counties. Collaborative track requires 3+ organizations with combined geographic coverage. St. David's favors organizations with authentic community relationships, not drop-in service models.`,
    competitiveEdge: [
      "Three Realities methodology IS 'community-informed' — exactly what St. David's requires",
      "LifeBridge platform handles benefits navigation and enrollment — direct alignment",
      "14-platform ecosystem provides the comprehensive service infrastructure they fund",
      "MCE provides minority business economic empowerment pipeline",
      "MAP-GAP continuous improvement aligns with foundation's data-driven approach",
      "Financial Literacy module directly supports economic stability for participants",
    ],
    serviceArea: {
      region: "Central Texas",
      state: "Texas",
      counties: ["Bastrop", "Caldwell", "Hays", "Travis", "Williamson"],
      city: "Austin",
      keyIndustries: ["Public Benefits Enrollment", "Financial Coaching", "Workforce Development", "Community Health"],
      targetEmployers: [
        { name: "Foundation Communities", sector: "Housing/Benefits", type: "Benefits enrollment partner, shared service delivery" },
        { name: "Workforce Solutions Capital Area", sector: "Workforce", type: "Co-enrollment for WIOA services, case management" },
        { name: "CommUnityCare Health Centers", sector: "Healthcare", type: "Community health integration, SNAP/Medicaid enrollment" },
        { name: "United Way for Greater Austin", sector: "Social Services", type: "2-1-1 referral pipeline, collaborative infrastructure" },
        { name: "Goodwill Central Texas", sector: "Workforce", type: "Career readiness, community benefits navigation partner" },
      ],
      laborMarketNotes: "St. David's focuses on economic stability, not employer partnerships per se. Key metrics: public benefits enrollment rates, financial stability indicators, self-sufficiency outcomes. Central Texas has significant benefits enrollment gaps — ~40% of eligible households don't access SNAP, Medicaid, or housing assistance.",
      locationEligibility: "regional",
      locationNotes: "St. David's Foundation is STRICTLY limited to Central Texas — Bastrop, Caldwell, Hays, Travis, and Williamson counties ONLY. You MUST have operations or a strong partner presence in these counties to be eligible. This cannot be applied from other locations. Austin/Travis County is your anchor.",
      multiSiteEligible: false,
      multiSiteNotes: "This grant is restricted to the 5-county Central Texas service area. However, the collaborative track ($1M) requires at least 3 organizations with operations across these counties. You could partner with organizations in Bastrop, Caldwell, or Hays counties to strengthen geographic coverage while you focus on Travis/Williamson.",
    },
    partnershipTimeline: {
      summary: "St. David's Foundation REQUIRES community-informed design evidence. Partners must be named in your application, especially for the collaborative track ($1M). For individual track ($250K), strong community partnerships are a key scoring factor. Build relationships BEFORE drafting.",
      workflowOrder: "Community Relationships → Partner Commitments → Then Draft (Community Voice Must Inform the Writing)",
      requirements: [
        { partnerType: "Collaborative Partners (for $1M track)", requiredInDocs: true, timing: "pre-award", docSections: ["Program Narrative", "Partnership Documentation", "Community Voice Documentation"], description: "The collaborative track requires at least 3 organizations with primary operations in the 5-county area. These must be named with specific roles, shared governance structure, and joint budget. This is not optional — it IS the application.", evidenceNeeded: "Collaborative agreement, shared governance structure, joint budget, individual org capacity statements, MOUs between all partners" },
        { partnerType: "Community Voice Partners", requiredInDocs: true, timing: "pre-award", docSections: ["Community Voice Documentation", "Program Narrative"], description: "St. David's explicitly requires evidence of how community voice shapes your work. You need organizations or community members who can validate that your program design comes FROM the community, not TO the community. Three Realities methodology is your proof.", evidenceNeeded: "Documentation of community input sessions, advisory board minutes with community members, testimonials, focus group summaries, Three Realities analysis documentation" },
        { partnerType: "Benefits Enrollment Partners", requiredInDocs: true, timing: "pre-award", docSections: ["Program Narrative", "Partnership Documentation"], description: "Since this grant focuses on public benefits enrollment and economic stability, you need partners who handle SNAP, Medicaid, CHIP, housing, childcare subsidy enrollment. Foundation Communities, CommUnityCare, and United Way 2-1-1 are key.", evidenceNeeded: "Letters of support, data sharing agreements, referral protocols, joint service delivery plans" },
        { partnerType: "Financial Coaching Partners", requiredInDocs: false, timing: "both", docSections: ["Program Narrative"], description: "Partners providing financial coaching, asset building, or credit counseling. Your Financial Literacy module covers some of this, but community-based financial coaching partners add credibility.", evidenceNeeded: "Letters of support, description of coaching model, any certifications (AFC, etc.)" },
        { partnerType: "Workforce Development Partners", requiredInDocs: false, timing: "post-award", docSections: [], description: "Since economic stability includes workforce pathways, your existing workforce infrastructure is relevant. Formal workforce partnerships can be developed post-award as implementation begins.", evidenceNeeded: "Can reference existing ThriveUp workforce capabilities in narrative without formal new agreements" },
      ],
    },
    sections: [
      { id: "std-loi", name: "Letter of Intent / Application", description: "Organization overview, program description, population served, funding request", icon: FileText, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI", pageLimit: "5 pages", wordCount: "1,500–2,000 words" },
      { id: "std-narrative", name: "Program Narrative", description: "Community-informed program design, economic stability services, public benefits enrollment strategy", icon: BookOpen, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI", pageLimit: "15 pages", wordCount: "5,000–6,000 words" },
      { id: "std-budget", name: "Budget & Justification", description: "Line-item budget with cost allocation for economic stability services", icon: DollarSign, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "3 pages", wordCount: "1,000–1,500 words" },
      { id: "std-community", name: "Community Voice Documentation", description: "Evidence of community-informed design — Three Realities analysis, stakeholder input, lived experience", icon: Users, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "5 pages", wordCount: "1,500–2,500 words" },
      { id: "std-outcomes", name: "Outcomes & Evaluation Plan", description: "Measurable outcomes: benefits enrollment rates, economic stability indicators, participant economic health", icon: BarChart3, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI", pageLimit: "5 pages", wordCount: "1,500–2,000 words" },
      { id: "std-partnerships", name: "Partnership & Collaboration Letters", description: "Community organizations, benefits agencies, workforce partners in Central Texas", icon: Handshake, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "No limit (1 per partner)", wordCount: "300–500 words each" },
      { id: "std-org-capacity", name: "Organizational Capacity", description: "Board composition, leadership bios, financial statements, prior results", icon: Building2, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "5 pages", wordCount: "1,500–2,000 words" },
      { id: "std-sustainability", name: "Sustainability Plan", description: "How economic stability services continue beyond St. David's funding", icon: Globe, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "3 pages", wordCount: "1,000–1,500 words" },
    ],
    phases: [
      {
        id: "collaborate", name: "1. Collaborate & Research", description: "Understand St. David's priorities and Central Texas landscape", status: "active",
        tasks: [
          { id: "stc1", task: "Review full NOFO when application opens March 30", owner: "Dr. Flood + AI", status: "pending", dueDate: "2026-03-30" },
          { id: "stc2", task: "Research St. David's 2024-2030 strategic plan and priorities", owner: "AI", status: "in-progress", dueDate: "2026-03-25" },
          { id: "stc3", task: "Map ThriveUp + LifeBridge capabilities to economic stability requirements", owner: "AI + Dr. Flood", status: "pending", dueDate: "2026-04-01" },
          { id: "stc4", task: "Identify Central Texas community partners for collaborative application", owner: "Dr. Flood + Meredith", status: "pending", dueDate: "2026-04-05" },
          { id: "stc5", task: "Gather economic stability data for target communities (Bastrop, Caldwell, Hays, Travis, Williamson)", owner: "AI", status: "pending", dueDate: "2026-04-03" },
          { id: "stc6", task: "Determine individual vs. collaborative application strategy", owner: "Dr. Flood + Meredith", status: "pending", dueDate: "2026-04-05" },
        ],
      },
      {
        id: "build", name: "2. Build & Draft", description: "Draft application materials after NOFO review", status: "upcoming",
        tasks: [
          { id: "stb1", task: "Draft program narrative emphasizing community-informed design", owner: "AI + Dr. Flood Review", status: "pending", dueDate: "TBD (after NOFO)" },
          { id: "stb2", task: "Develop budget — consider collaborative ($1M) vs individual ($250K)", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "stb3", task: "Document Three Realities community engagement process", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "stb4", task: "Design public benefits enrollment strategy using LifeBridge", owner: "AI + Dr. Flood Review", status: "pending", dueDate: "TBD" },
          { id: "stb5", task: "Build outcomes framework around economic stability metrics", owner: "AI + Dr. Flood Review", status: "pending", dueDate: "TBD" },
          { id: "stb6", task: "Secure partnership commitment letters from Central Texas orgs", owner: "Dr. Flood + Meredith", status: "pending", dueDate: "TBD" },
        ],
      },
      {
        id: "review", name: "3. Review & Approve", description: "Dr. Flood final review and approval", status: "upcoming",
        tasks: [
          { id: "str1", task: "Review and approve program narrative", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "str2", task: "Review and approve budget", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "str3", task: "Verify community voice documentation is authentic and complete", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "str4", task: "Final alignment check with St. David's priorities", owner: "Dr. Flood + Meredith", status: "pending", dueDate: "TBD" },
        ],
      },
      {
        id: "submit", name: "4. Package & Submit", description: "Submit through St. David's grants portal", status: "upcoming",
        tasks: [
          { id: "sts1", task: "Assemble final package per foundation format", owner: "Dr. Flood + AI", status: "pending", dueDate: "TBD" },
          { id: "sts2", task: "Submit through St. David's online Grants Portal", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "sts3", task: "Confirm receipt and follow up timeline", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
        ],
      },
      {
        id: "pre-execute", name: "5. Pre-Execution Readiness", description: "Prepare for launch if awarded", status: "upcoming",
        tasks: [
          { id: "stp1", task: "Configure LifeBridge for public benefits enrollment tracking", owner: "AI", status: "pending", dueDate: "TBD" },
          { id: "stp2", task: "Set up economic stability outcome tracking in platform", owner: "AI + Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "stp3", task: "Establish Central Texas community partnerships", owner: "Dr. Flood + Meredith", status: "pending", dueDate: "TBD" },
          { id: "stp4", task: "Design 90-day launch plan for economic stability services", owner: "Dr. Flood + AI", status: "pending", dueDate: "TBD" },
        ],
      },
    ],
    preExecutionChecklist: [
      { id: "stpe-1", category: "Eligibility", item: "Organization is a 501(c)(3) or fiscal sponsor identified", status: "pending", notes: "ThriveUp Academy 501(c)(3)" },
      { id: "stpe-2", category: "Eligibility", item: "Serves historically marginalized communities", status: "verified", notes: "Core mission alignment" },
      { id: "stpe-3", category: "Eligibility", item: "Focus on economic stability services", status: "verified", notes: "Workforce, financial literacy, benefits enrollment" },
      { id: "stpe-4", category: "Geography", item: "Operations in Central Texas service area (Bastrop, Caldwell, Hays, Travis, Williamson)", status: "action-needed", notes: "Confirm geographic eligibility or identify Central Texas partner" },
      { id: "stpe-5", category: "Capacity", item: "Community-informed program design documented", status: "verified", notes: "Three Realities methodology" },
      { id: "stpe-6", category: "Capacity", item: "Financial statements (last 2 years)", status: "action-needed", notes: "Compile audited financials" },
      { id: "stpe-7", category: "Capacity", item: "Prior program outcomes documented", status: "pending", notes: "Gather pilot data" },
      { id: "stpe-8", category: "Partnerships", item: "Central Texas community partners identified", status: "action-needed", notes: "Key for collaborative application ($1M track)" },
      { id: "stpe-9", category: "Partnerships", item: "Benefits enrollment agency partnerships", status: "pending", notes: "Medicaid, CHIP, ACA enrollment partners" },
      { id: "stpe-10", category: "Technology", item: "LifeBridge benefits navigation configured", status: "verified", notes: "LifeBridge platform integrated" },
      { id: "stpe-11", category: "Technology", item: "Financial Literacy module ready", status: "verified", notes: "Full curriculum live in platform" },
      { id: "stpe-12", category: "Technology", item: "Economic stability outcome tracking configured", status: "verified", notes: "Outcome Reporting + Workforce Dashboard" },
    ],
    winStrategy: {
      differentiators: [
        "Three Realities methodology IS community-informed design — not a checkbox, a methodology",
        "LifeBridge platform provides actual benefits navigation infrastructure, not just referrals",
        "14-platform ecosystem delivers comprehensive economic stability services under one roof",
        "MCE + Financial Literacy create entrepreneurship-to-wealth pipeline, not just benefits enrollment",
        "MAP-GAP ensures continuous improvement — foundation sees measurable progress, not static programs",
        "Collaborative application ($1M track) with Meredith + Central Texas partners maximizes funding",
      ],
      reviewerPriorities: [
        "Community-informed design — evidence that community voice drives the program, not assumptions",
        "Focus on public benefits enrollment (Medicaid, CHIP, ACA, SNAP, etc.)",
        "Serving historically marginalized communities with documented need",
        "Economic stability outcomes beyond just job placement",
        "Organizational capacity to deliver in Central Texas service area",
        "Sustainability beyond foundation funding period",
      ],
      scoringTips: [
        "Lead with Three Realities — show community voice is methodological, not performative",
        "Emphasize LifeBridge benefits navigation as core infrastructure",
        "If applying as collaborative: show each partner's unique contribution",
        "Include specific public benefits enrollment targets with baseline data",
        "Show how technology reduces barriers to benefits access",
        "Reference St. David's 2024-2030 strategic plan language in your narrative",
      ],
      commonPitfalls: [
        "Applying without operations in Central Texas service area",
        "Generic 'economic empowerment' language without specific benefits enrollment strategy",
        "No evidence of community input in program design",
        "Budget misaligned with economic stability activities",
        "Individual application when collaborative would be stronger and unlock more funding",
        "Ignoring the 'public benefits' focus — this isn't general workforce development",
      ],
    },
  },
];

function StatusBadge({ status }: { status: ApprovalStatus }) {
  const config = APPROVAL_LABELS[status];
  const Icon = config.icon;
  return (
    <Badge className={`${config.color} gap-1`} data-testid={`badge-status-${status}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function ChecklistStatusIcon({ status }: { status: ChecklistItem["status"] }) {
  if (status === "verified") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (status === "pending") return <Clock className="h-4 w-4 text-amber-500" />;
  return <AlertTriangle className="h-4 w-4 text-red-500" />;
}

function TaskStatusIcon({ status }: { status: PhaseTask["status"] }) {
  if (status === "done") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (status === "in-progress") return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
  return <Circle className="h-4 w-4 text-gray-400" />;
}

const EXECUTION_CHECKLIST_TEMPLATES: Record<string, Array<{ category: string; items: string[] }>> = {
  dfc: [
    { category: "Coalition Building", items: [
      "Identify and recruit 12 community sectors for coalition",
      "Establish coalition governance structure and bylaws",
      "Schedule monthly coalition meetings for Year 1",
      "Complete coalition member MOUs/letters of commitment",
      "Set up coalition communication platform",
    ]},
    { category: "Needs Assessment", items: [
      "Collect community-level drug use prevalence data",
      "Administer youth risk behavior survey",
      "Conduct community readiness assessment",
      "Map existing prevention resources and gaps",
      "Compile demographic and socioeconomic data",
    ]},
    { category: "Program Design", items: [
      "Select evidence-based prevention programs",
      "Develop logic model aligned with ONDCP requirements",
      "Define SMART objectives with measurable outcomes",
      "Create sustainability plan beyond grant period",
      "Establish data collection and evaluation protocols",
    ]},
    { category: "Budget & Compliance", items: [
      "Prepare detailed line-item budget with justification",
      "Verify indirect cost rate agreement",
      "Confirm match/cost-share requirements (cash + in-kind)",
      "Set up financial tracking and reporting systems",
      "Identify and document all subcontractors",
    ]},
    { category: "Submission Final Checks", items: [
      "All narrative sections reviewed by Dr. Flood",
      "Budget aligns with narrative activities",
      "Letters of support collected from all partners",
      "SF-424 and all required federal forms completed",
      "Package submitted before April 14, 2026 deadline",
    ]},
  ],
  wioa: [
    { category: "Program Requirements", items: [
      "Define eligible youth population and outreach plan",
      "Map 14 WIOA youth program elements to curriculum",
      "Establish employer partnerships for work experience",
      "Design follow-up services protocol (12-month minimum)",
      "Create individual service strategy templates",
    ]},
    { category: "Compliance & Reporting", items: [
      "Set up participant tracking system",
      "Configure performance outcome measurement",
      "Prepare quarterly reporting templates",
      "Document eligibility determination procedures",
      "Establish data validation protocols",
    ]},
  ],
  "foundation-basketball": [
    { category: "Program Impact", items: [
      "Define target communities and participant demographics",
      "Map Three Realities framework to program design",
      "Establish baseline economic indicators for participants",
      "Design workforce pathway with credential milestones",
      "Create participant success story collection protocol",
    ]},
    { category: "Organizational Capacity", items: [
      "Demonstrate 501(c)(3) operational history",
      "Prepare organizational budget and financial statements",
      "Document board diversity and governance",
      "Map partner network and roles",
      "Prepare evaluation methodology",
    ]},
  ],
  "st-davids": [
    { category: "Geographic Eligibility", items: [
      "Confirm operations in Central Texas service area (Bastrop, Caldwell, Hays, Travis, or Williamson counties)",
      "Identify local partner organization if not in Central Texas",
      "Document community presence and partnerships in region",
      "Map services to county-level impact areas",
    ]},
    { category: "Program Alignment", items: [
      "Align proposal with 'Building Economic Stability' focus",
      "Map Three Realities framework to community-informed design",
      "Document how LifeBridge captures ground truth data",
      "Identify collaborative partners for $1M track eligibility",
      "Design public benefits integration into workforce programming",
    ]},
    { category: "Application Readiness", items: [
      "Draft Letter of Intent (LOI)",
      "Prepare community voice documentation",
      "Complete program narrative aligned with St. David's priorities",
      "Budget prepared with economic stability outcomes",
      "Review submission with Meredith Sisnett (advisor)",
    ]},
  ],
};

const DEFAULT_REMINDERS: Array<{ grantId: string; title: string; dueDate: string; priority: string; category: string }> = [
  { grantId: "dfc", title: "DFC Application Deadline", dueDate: "2026-04-14", priority: "critical", category: "deadline" },
  { grantId: "dfc", title: "Coalition letters of support collected", dueDate: "2026-03-28", priority: "high", category: "task" },
  { grantId: "dfc", title: "Final budget review with Dr. Flood", dueDate: "2026-04-01", priority: "high", category: "review" },
  { grantId: "dfc", title: "Logic model finalized", dueDate: "2026-03-25", priority: "high", category: "task" },
  { grantId: "dfc", title: "SF-424 forms completed", dueDate: "2026-04-07", priority: "high", category: "task" },
  { grantId: "st-davids", title: "St. David's Application Opens", dueDate: "2026-03-30", priority: "high", category: "deadline" },
  { grantId: "st-davids", title: "Confirm Central Texas geographic eligibility", dueDate: "2026-03-22", priority: "critical", category: "task" },
  { grantId: "st-davids", title: "Draft LOI for Meredith review", dueDate: "2026-04-05", priority: "medium", category: "review" },
  { grantId: "wioa", title: "WIOA eligible youth criteria finalized", dueDate: "2026-04-15", priority: "medium", category: "task" },
  { grantId: "foundation-basketball", title: "Economic empowerment impact metrics defined", dueDate: "2026-05-01", priority: "medium", category: "task" },
];

function GrantRemindersChecklist({ grants }: { grants: typeof GRANT_PACKAGES }) {
  const { toast } = useToast();
  const [selectedGrant, setSelectedGrant] = useState<string>("all");
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminder, setNewReminder] = useState({ title: "", dueDate: "", priority: "medium", category: "task", grantId: "dfc" });
  const [localReminders, setLocalReminders] = useState(DEFAULT_REMINDERS.map((r, i) => ({ ...r, id: `default-${i}`, status: "pending" as string, description: null as string | null })));
  const [localChecklist, setLocalChecklist] = useState<Record<string, Record<string, boolean>>>({});

  const filteredReminders = selectedGrant === "all"
    ? localReminders
    : localReminders.filter((r) => r.grantId === selectedGrant);

  const sortedReminders = [...filteredReminders].sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const pA = priorityOrder[a.priority] ?? 2;
    const pB = priorityOrder[b.priority] ?? 2;
    if (pA !== pB) return pA - pB;
    return a.dueDate.localeCompare(b.dueDate);
  });

  const toggleChecklistItem = (grantId: string, itemKey: string) => {
    setLocalChecklist((prev) => ({
      ...prev,
      [grantId]: {
        ...(prev[grantId] || {}),
        [itemKey]: !(prev[grantId]?.[itemKey]),
      },
    }));
  };

  const addReminder = () => {
    if (!newReminder.title || !newReminder.dueDate) {
      toast({ title: "Missing fields", description: "Title and due date are required", variant: "destructive" });
      return;
    }
    setLocalReminders((prev) => [
      ...prev,
      { ...newReminder, id: `custom-${Date.now()}`, status: "pending", description: null },
    ]);
    setNewReminder({ title: "", dueDate: "", priority: "medium", category: "task", grantId: "dfc" });
    setShowAddReminder(false);
    toast({ title: "Reminder added", description: `"${newReminder.title}" added to your reminders` });
  };

  const toggleReminderDone = (id: string) => {
    setLocalReminders((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: r.status === "completed" ? "pending" : "completed" } : r)
    );
  };

  const deleteReminder = (id: string) => {
    setLocalReminders((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "Reminder removed" });
  };

  const getDaysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "critical") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    if (priority === "high") return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    if (priority === "medium") return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  };

  const getCategoryIcon = (cat: string) => {
    if (cat === "deadline") return <Calendar className="h-3.5 w-3.5" />;
    if (cat === "review") return <Eye className="h-3.5 w-3.5" />;
    return <ClipboardCheck className="h-3.5 w-3.5" />;
  };

  const activeReminders = localReminders.filter((r) => r.status !== "completed");
  const overdueCount = activeReminders.filter((r) => getDaysUntil(r.dueDate) < 0).length;
  const upcomingCount = activeReminders.filter((r) => {
    const d = getDaysUntil(r.dueDate);
    return d >= 0 && d <= 7;
  }).length;

  const getGrantLabel = (gId: string) => grants.find((g) => g.id === gId)?.name || gId;

  const checklistGrants = selectedGrant === "all"
    ? Object.keys(EXECUTION_CHECKLIST_TEMPLATES)
    : [selectedGrant].filter((k) => k in EXECUTION_CHECKLIST_TEMPLATES);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-muted-foreground">Overdue</span>
            </div>
            <p className="text-2xl font-bold text-red-600" data-testid="text-overdue-count">{overdueCount}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-muted-foreground">Due This Week</span>
            </div>
            <p className="text-2xl font-bold text-amber-600" data-testid="text-upcoming-count">{upcomingCount}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-muted-foreground">Active Reminders</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600" data-testid="text-active-count">{activeReminders.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground mr-1">Filter:</span>
        <Button
          size="sm"
          variant={selectedGrant === "all" ? "default" : "outline"}
          onClick={() => setSelectedGrant("all")}
          data-testid="filter-all-grants"
        >
          All Grants
        </Button>
        {grants.map((g) => (
          <Button
            key={g.id}
            size="sm"
            variant={selectedGrant === g.id ? "default" : "outline"}
            onClick={() => setSelectedGrant(g.id)}
            data-testid={`filter-grant-${g.id}`}
          >
            {g.name}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Reminders & Deadlines
            </CardTitle>
            <Button size="sm" onClick={() => setShowAddReminder(!showAddReminder)} data-testid="button-add-reminder">
              <Plus className="h-4 w-4 mr-1" />
              Add Reminder
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddReminder && (
            <Card className="bg-muted/40 p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                    placeholder="What needs to happen?"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                    data-testid="input-reminder-title"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Due Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                    value={newReminder.dueDate}
                    onChange={(e) => setNewReminder({ ...newReminder, dueDate: e.target.value })}
                    data-testid="input-reminder-date"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Grant</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                    value={newReminder.grantId}
                    onChange={(e) => setNewReminder({ ...newReminder, grantId: e.target.value })}
                    data-testid="select-reminder-grant"
                  >
                    {grants.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                      value={newReminder.priority}
                      onChange={(e) => setNewReminder({ ...newReminder, priority: e.target.value })}
                      data-testid="select-reminder-priority"
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                      value={newReminder.category}
                      onChange={(e) => setNewReminder({ ...newReminder, category: e.target.value })}
                      data-testid="select-reminder-category"
                    >
                      <option value="task">Task</option>
                      <option value="deadline">Deadline</option>
                      <option value="review">Review</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={addReminder} data-testid="button-save-reminder">Save Reminder</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAddReminder(false)}>Cancel</Button>
              </div>
            </Card>
          )}

          {sortedReminders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No reminders for this grant yet. Add one above.</p>
          ) : (
            <div className="space-y-2">
              {sortedReminders.map((r) => {
                const days = getDaysUntil(r.dueDate);
                const isOverdue = days < 0 && r.status !== "completed";
                const isDueSoon = days >= 0 && days <= 3 && r.status !== "completed";
                return (
                  <div
                    key={r.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      r.status === "completed"
                        ? "bg-muted/30 opacity-60"
                        : isOverdue
                        ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                        : isDueSoon
                        ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                        : "bg-background"
                    }`}
                    data-testid={`reminder-${r.id}`}
                  >
                    <button
                      onClick={() => toggleReminderDone(r.id)}
                      className="shrink-0"
                      data-testid={`button-toggle-reminder-${r.id}`}
                    >
                      {r.status === "completed" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400 hover:text-emerald-500 transition-colors" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${r.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                        {r.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] gap-1">
                          {getCategoryIcon(r.category)}
                          {r.category}
                        </Badge>
                        {selectedGrant === "all" && (
                          <Badge variant="outline" className="text-[10px]">{getGrantLabel(r.grantId)}</Badge>
                        )}
                        <span className={`text-[10px] ${isOverdue ? "text-red-600 font-semibold" : isDueSoon ? "text-amber-600 font-semibold" : "text-muted-foreground"}`}>
                          {r.status === "completed" ? "Done" : isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
                        </span>
                      </div>
                    </div>

                    <Badge className={`text-[10px] shrink-0 ${getPriorityColor(r.priority)}`}>
                      {r.priority}
                    </Badge>

                    <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                      {new Date(r.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>

                    <button
                      onClick={() => deleteReminder(r.id)}
                      className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                      data-testid={`button-delete-reminder-${r.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Execution Checklist
          </CardTitle>
          <p className="text-sm text-muted-foreground">Step-by-step checklist so nothing gets missed. Check off items as you complete them.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {checklistGrants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No execution checklist available for this grant.</p>
          ) : (
            checklistGrants.map((gId) => {
              const template = EXECUTION_CHECKLIST_TEMPLATES[gId];
              if (!template) return null;
              const totalItems = template.reduce((sum, cat) => sum + cat.items.length, 0);
              const checkedItems = template.reduce((sum, cat) =>
                sum + cat.items.filter((_, idx) => localChecklist[gId]?.[`${cat.category}-${idx}`]).length
              , 0);
              const pct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
              return (
                <div key={gId} className="space-y-3">
                  {selectedGrant === "all" && (
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{getGrantLabel(gId)}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{checkedItems}/{totalItems}</span>
                        <Progress value={pct} className="w-24 h-2" />
                        <span className="text-xs font-medium">{pct}%</span>
                      </div>
                    </div>
                  )}
                  {selectedGrant !== "all" && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-muted-foreground">{checkedItems}/{totalItems} completed</span>
                      <Progress value={pct} className="w-32 h-2" />
                      <span className="text-sm font-medium">{pct}%</span>
                    </div>
                  )}
                  {template.map((cat) => (
                    <div key={cat.category} className="space-y-1.5">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Layers className="h-3 w-3" />
                        {cat.category}
                      </h4>
                      <div className="space-y-1 ml-1">
                        {cat.items.map((item, idx) => {
                          const key = `${cat.category}-${idx}`;
                          const checked = !!localChecklist[gId]?.[key];
                          return (
                            <label
                              key={key}
                              className={`flex items-start gap-2.5 p-2 rounded-md cursor-pointer transition-colors hover:bg-muted/50 ${
                                checked ? "opacity-60" : ""
                              }`}
                              data-testid={`checklist-item-${gId}-${key}`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleChecklistItem(gId, key)}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                data-testid={`checkbox-${gId}-${key}`}
                              />
                              <span className={`text-sm ${checked ? "line-through text-muted-foreground" : ""}`}>{item}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {selectedGrant === "all" && <hr className="my-4" />}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ScanResult {
  grantName: string;
  funder: string;
  amount: string;
  deadline: string;
  description: string;
  eligibility: string[];
  fitScore: number;
  fitAnalysis: string[];
  platformAlignment: string[];
  gaps: string[];
  recommendation: string;
  nextSteps: string[];
}

function OpportunityScanner() {
  const { toast } = useToast();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [scanMode, setScanMode] = useState<"upload" | "text">("upload");

  const scanMutation = useMutation({
    mutationFn: async (data: { image?: string; text?: string }) => {
      const res = await apiRequest("POST", "/api/grants/scan-opportunity", data);
      return res.json() as Promise<ScanResult>;
    },
    onSuccess: (result) => {
      setScanResult(result);
      toast({ title: "Opportunity analyzed successfully" });
    },
    onError: () => {
      toast({ title: "Analysis failed — try again or paste text instead", variant: "destructive" });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setPreviewUrl(base64);
      scanMutation.mutate({ image: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleTextAnalysis = () => {
    if (!textInput.trim()) return;
    scanMutation.mutate({ text: textInput });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
            <Camera className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg" data-testid="text-scanner-title">Opportunity Scanner</h3>
            <p className="text-sm text-muted-foreground">Upload a screenshot or paste text from any grant opportunity — get instant fit analysis</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            variant={scanMode === "upload" ? "default" : "outline"}
            size="sm"
            onClick={() => setScanMode("upload")}
            data-testid="button-scan-upload"
          >
            <Upload className="h-4 w-4 mr-1.5" />
            Upload Screenshot
          </Button>
          <Button
            variant={scanMode === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => setScanMode("text")}
            data-testid="button-scan-text"
          >
            <FileText className="h-4 w-4 mr-1.5" />
            Paste Text
          </Button>
        </div>

        {scanMode === "upload" ? (
          <div className="space-y-3">
            <label
              htmlFor="grant-upload"
              className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              data-testid="label-upload-area"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Uploaded grant opportunity" className="h-full object-contain rounded" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="h-8 w-8" />
                  <p className="text-sm font-medium">Drop a screenshot here or click to upload</p>
                  <p className="text-xs">PNG, JPG, or PDF — snap a photo of any grant flyer, email, or posting</p>
                </div>
              )}
              <input id="grant-upload" type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} data-testid="input-file-upload" />
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste the grant opportunity description, email, or any text about the funding opportunity here..."
              className="w-full h-40 p-3 text-sm border rounded-lg resize-none bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              data-testid="input-text-paste"
            />
            <Button
              onClick={handleTextAnalysis}
              disabled={!textInput.trim() || scanMutation.isPending}
              data-testid="button-analyze-text"
            >
              {scanMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...</>
              ) : (
                <><Search className="h-4 w-4 mr-2" />Analyze Opportunity</>
              )}
            </Button>
          </div>
        )}

        {scanMutation.isPending && (
          <div className="mt-4 p-4 rounded-lg bg-muted/50 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium">Analyzing opportunity...</p>
              <p className="text-xs text-muted-foreground">Extracting details, scoring fit, mapping to platform capabilities</p>
            </div>
          </div>
        )}
      </Card>

      {scanResult && (
        <Card className="p-4 border-2 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">{scanResult.grantName}</h3>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
              scanResult.fitScore >= 80 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" :
              scanResult.fitScore >= 60 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" :
              "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
            }`}>
              <Target className="h-4 w-4" />
              <span className="font-bold text-sm">{scanResult.fitScore}% Fit</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Funder</p>
              <p className="text-sm font-medium">{scanResult.funder}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="text-sm font-medium">{scanResult.amount}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Deadline</p>
              <p className="text-sm font-medium">{scanResult.deadline}</p>
            </div>
          </div>

          <p className="text-sm mb-4">{scanResult.description}</p>

          {scanResult.eligibility.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">Eligibility Requirements</h4>
              <ul className="space-y-1">
                {scanResult.eligibility.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <ClipboardCheck className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Platform Alignment
              </h4>
              <ul className="space-y-1">
                {scanResult.platformAlignment.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Gaps to Address
              </h4>
              <ul className="space-y-1">
                {scanResult.gaps.length > 0 ? scanResult.gaps.map((g, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <span>{g}</span>
                  </li>
                )) : (
                  <li className="text-sm text-muted-foreground">No significant gaps identified</li>
                )}
              </ul>
            </div>
          </div>

          <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <h4 className="text-sm font-semibold mb-1">Recommendation</h4>
            <p className="text-sm">{scanResult.recommendation}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Next Steps</h4>
            <ol className="space-y-1">
              {scanResult.nextSteps.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </Card>
      )}
    </div>
  );
}

function SectionDrafter({ section, grant, autoTrigger, onAutoTriggered, onDraftUpdate, savedDraft, onSaveDraft }: { section: PackageSection; grant: GrantPackage; autoTrigger?: boolean; onAutoTriggered?: () => void; onDraftUpdate?: (sectionId: string, content: string) => void; savedDraft?: string; onSaveDraft?: (sectionId: string, content: string) => void }) {
  const { toast } = useToast();
  const [draftContent, setDraftContent] = useState(savedDraft || section.content || "");
  const [userInstructions, setUserInstructions] = useState("");
  const [refineInstructions, setRefineInstructions] = useState("");
  const [showRefine, setShowRefine] = useState(false);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (savedDraft !== undefined && savedDraft !== draftContent && savedDraft !== "") {
      setDraftContent(savedDraft);
    }
  }, [savedDraft]);

  const debouncedSave = useCallback((content: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (onSaveDraft) onSaveDraft(section.id, content);
    }, 1500);
  }, [section.id, onSaveDraft]);

  const draftMutation = useMutation({
    mutationFn: async () => {
      const resp = await apiRequest("POST", "/api/grants/draft-section", {
        grantId: grant.id,
        sectionId: section.id,
        sectionName: section.name,
        sectionDescription: section.description,
        grantName: `${grant.name} — ${grant.fullName}`,
        grantDescription: grant.description,
        existingContent: draftContent || undefined,
        userInstructions: userInstructions || undefined,
        grantKnowledge: grant.grantKnowledge || undefined,
        pageLimit: section.pageLimit || undefined,
        wordCount: section.wordCount || undefined,
      });
      return resp.json();
    },
    onSuccess: (data: { draft: string }) => {
      setDraftContent(data.draft);
      if (onDraftUpdate) onDraftUpdate(section.id, data.draft);
      if (onSaveDraft) onSaveDraft(section.id, data.draft);
      toast({ title: "Draft generated & saved", description: `"${section.name}" has been drafted by AI. Review and edit as needed.` });
    },
    onError: () => {
      toast({ title: "Failed to generate draft", description: "Please try again", variant: "destructive" });
    },
  });

  const refineMutation = useMutation({
    mutationFn: async () => {
      const resp = await apiRequest("POST", "/api/grants/refine-section", {
        currentDraft: draftContent,
        refinementInstructions: refineInstructions,
        sectionName: section.name,
        grantName: `${grant.name} — ${grant.fullName}`,
        grantKnowledge: grant.grantKnowledge || undefined,
        wordCount: section.wordCount || undefined,
        pageLimit: section.pageLimit || undefined,
      });
      return resp.json();
    },
    onSuccess: (data: { draft: string }) => {
      setDraftContent(data.draft);
      if (onDraftUpdate) onDraftUpdate(section.id, data.draft);
      if (onSaveDraft) onSaveDraft(section.id, data.draft);
      setRefineInstructions("");
      setShowRefine(false);
      toast({ title: "Draft refined & saved", description: "Your instructions have been applied." });
    },
    onError: () => {
      toast({ title: "Failed to refine", description: "Please try again", variant: "destructive" });
    },
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(draftContent);
    toast({ title: "Copied to clipboard" });
  };

  if (autoTrigger && !hasAutoTriggered && !draftMutation.isPending && !draftContent) {
    setHasAutoTriggered(true);
    setTimeout(() => {
      draftMutation.mutate();
      if (onAutoTriggered) onAutoTriggered();
    }, 100);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Assignee</p>
          <p className="text-sm">{section.assignee}</p>
        </div>
        <div className="flex items-center gap-3">
          {draftContent && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1" data-testid={`auto-save-indicator-${section.id}`}>
              <CheckCircle2 className="h-3 w-3" />
              Auto-saved
            </span>
          )}
          {section.lastUpdated && (
            <div className="text-right">
              <p className="text-xs font-medium text-muted-foreground mb-1">Last Updated</p>
              <p className="text-sm">{section.lastUpdated}</p>
            </div>
          )}
        </div>
      </div>

      {draftMutation.isPending && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">AI is drafting "{section.name}"...</p>
            <p className="text-xs text-blue-700 dark:text-blue-300">This takes 10-30 seconds. The AI knows your grant requirements and organizational context.</p>
          </div>
        </div>
      )}

      {!draftContent && !draftMutation.isPending && (
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-dashed">
          <div className="text-center space-y-2">
            <Sparkles className="h-8 w-8 mx-auto text-primary/60" />
            <div>
              <p className="text-sm font-medium">Ready to draft "{section.name}"</p>
              <p className="text-xs text-muted-foreground mt-1">
                The AI will write a complete draft based on your grant requirements, organizational strengths, and Dr. Flood's methodologies.
              </p>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Special instructions (optional)</label>
            <textarea
              className="w-full px-3 py-2 border rounded-md text-sm bg-background min-h-[50px] resize-y"
              placeholder="e.g., Emphasize coalition diversity, include local drug prevalence data, focus on sustainability..."
              value={userInstructions}
              onChange={(e) => setUserInstructions(e.target.value)}
              data-testid={`input-instructions-${section.id}`}
            />
          </div>
          <Button
            onClick={() => draftMutation.mutate()}
            disabled={draftMutation.isPending}
            className="w-full"
            size="lg"
            data-testid={`button-generate-draft-${section.id}`}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate AI Draft
          </Button>
        </div>
      )}

      {draftContent && !draftMutation.isPending && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3 w-3" />
              Draft Content
              {(() => {
                const currentWords = draftContent.split(/\s+/).filter(Boolean).length;
                const targetMatch = section.wordCount?.match(/(\d[\d,]*)/);
                const targetMin = targetMatch ? parseInt(targetMatch[1].replace(/,/g, ""), 10) : 0;
                const isShort = targetMin > 0 && currentWords < targetMin * 0.8;
                return (
                  <Badge variant={isShort ? "destructive" : "secondary"} className="text-[10px] ml-1" data-testid={`badge-word-count-${section.id}`}>
                    {currentWords.toLocaleString()} words{section.wordCount ? ` / target: ${section.wordCount}` : ""}
                    {isShort ? " ⚠ under target" : ""}
                  </Badge>
                );
              })()}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copyToClipboard} data-testid={`button-copy-${section.id}`}>
                <Download className="h-3.5 w-3.5 mr-1" />
                Copy
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowRefine(!showRefine)} data-testid={`button-refine-toggle-${section.id}`}>
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Refine with AI
              </Button>
              <Button size="sm" variant="outline" onClick={() => draftMutation.mutate()} data-testid={`button-regenerate-${section.id}`}>
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Regenerate
              </Button>
            </div>
          </div>

          <textarea
            className="w-full px-4 py-3 border rounded-lg text-sm bg-background min-h-[350px] resize-y leading-relaxed"
            value={draftContent}
            onChange={(e) => { setDraftContent(e.target.value); if (onDraftUpdate) onDraftUpdate(section.id, e.target.value); debouncedSave(e.target.value); }}
            data-testid={`textarea-draft-${section.id}`}
          />

          {showRefine && (
            <div className="bg-muted/40 p-3 rounded-lg space-y-2 border">
              <label className="text-xs font-semibold text-muted-foreground block flex items-center gap-1.5">
                <Pencil className="h-3 w-3" />
                Tell the AI what to change
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-md text-sm bg-background min-h-[60px] resize-y"
                placeholder="e.g., Make the outcomes more specific, add a paragraph about Three Realities, shorten the introduction, add more local data..."
                value={refineInstructions}
                onChange={(e) => setRefineInstructions(e.target.value)}
                data-testid={`input-refine-${section.id}`}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => refineMutation.mutate()}
                  disabled={refineMutation.isPending || !refineInstructions.trim()}
                  data-testid={`button-apply-refine-${section.id}`}
                >
                  {refineMutation.isPending ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Refining...</>
                  ) : (
                    <><Sparkles className="h-3.5 w-3.5 mr-1.5" />Apply Refinement</>
                  )}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowRefine(false)}>Cancel</Button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Edit the text directly above. When satisfied, set your status below to move the workflow forward.</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GrantPackagesPage() {
  const [selectedGrant, setSelectedGrant] = useState<string>("dfc");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(["collaborate", "build"]));
  const [expandedChecklistItems, setExpandedChecklistItems] = useState<Set<string>>(new Set());
  const [checklistAiResults, setChecklistAiResults] = useState<Record<string, { content: string; type: string }>>({});
  const [checklistAiLoading, setChecklistAiLoading] = useState<string | null>(null);
  const [checklistAiLoadingType, setChecklistAiLoadingType] = useState<string | null>(null);
  const [sectionStatuses, setSectionStatuses] = useState<Record<string, ApprovalStatus>>({});
  const [savedDrafts, setSavedDrafts] = useState<Record<string, string>>({});
  const [workflowMode, setWorkflowMode] = useState<"guided" | "auto">("guided");
  const [autoTriggerDraft, setAutoTriggerDraft] = useState(false);
  const { toast } = useToast();

  const { data: rawSavedDraftsData } = useQuery({
    queryKey: ["/api/grants/section-drafts", selectedGrant],
    enabled: !!selectedGrant,
  });
  const savedDraftsData = rawSavedDraftsData ?? null;

  useEffect(() => {
    if (savedDraftsData && Array.isArray(savedDraftsData)) {
      const draftsMap: Record<string, string> = {};
      const statusMap: Record<string, ApprovalStatus> = {};
      for (const d of savedDraftsData as Array<{ sectionId: string; draftContent: string; approvalStatus: string }>) {
        if (d.draftContent) draftsMap[d.sectionId] = d.draftContent;
        if (d.approvalStatus && d.approvalStatus !== "not-started") statusMap[d.sectionId] = d.approvalStatus as ApprovalStatus;
      }
      setSavedDrafts(draftsMap);
      setSectionStatuses((prev) => ({ ...prev, ...statusMap }));
    }
  }, [savedDraftsData]);

  const saveDraftMutation = useMutation({
    mutationFn: async (params: { grantId: string; sectionId: string; draftContent: string; approvalStatus?: string }) => {
      await apiRequest("POST", "/api/grants/section-drafts/save", params);
    },
  });

  const handleSaveDraft = useCallback((sectionId: string, content: string) => {
    setSavedDrafts((prev) => ({ ...prev, [sectionId]: content }));
    saveDraftMutation.mutate({
      grantId: selectedGrant,
      sectionId,
      draftContent: content,
      approvalStatus: sectionStatuses[sectionId] || "draft",
    });
  }, [selectedGrant, sectionStatuses, saveDraftMutation]);

  const handleSaveStatus = useCallback((sectionId: string, status: ApprovalStatus) => {
    setSectionStatuses((prev) => ({ ...prev, [sectionId]: status }));
    saveDraftMutation.mutate({
      grantId: selectedGrant,
      sectionId,
      draftContent: savedDrafts[sectionId] || "",
      approvalStatus: status,
    });
  }, [selectedGrant, savedDrafts, saveDraftMutation]);

  const currentGrant = GRANT_PACKAGES.find((g) => g.id === selectedGrant);
  if (!currentGrant) return null;

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePhase = (id: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getSectionStatus = (sectionId: string, defaultStatus: ApprovalStatus): ApprovalStatus => {
    return sectionStatuses[sectionId] ?? defaultStatus;
  };

  const updateSectionStatus = (sectionId: string, status: ApprovalStatus) => {
    handleSaveStatus(sectionId, status);
  };

  const approvedCount = currentGrant.sections.filter((s) => getSectionStatus(s.id, s.status) === "approved").length;
  const totalSections = currentGrant.sections.length;
  const packageProgress = Math.round((approvedCount / totalSections) * 100);

  const completedTasks = currentGrant.phases.flatMap((p) => p.tasks).filter((t) => t.status === "done").length;
  const totalTasks = currentGrant.phases.flatMap((p) => p.tasks).length;

  const verifiedChecklist = currentGrant.preExecutionChecklist.filter((c) => c.status === "verified").length;
  const totalChecklist = currentGrant.preExecutionChecklist.length;

  const draftContentsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (Object.keys(savedDrafts).length > 0) {
      draftContentsRef.current = { ...draftContentsRef.current, ...savedDrafts };
    }
  }, [savedDrafts]);

  const updateDraftContent = (sectionId: string, content: string) => {
    draftContentsRef.current[sectionId] = content;
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleChecklistAiAssist = async (itemId: string, itemText: string, assistType: string) => {
    setChecklistAiLoading(itemId);
    setChecklistAiLoadingType(assistType);
    try {
      const response = await apiRequest("POST", "/api/grants/checklist-ai-assist", {
        checklistItem: itemText,
        grantName: currentGrant.fullName,
        grantKnowledge: currentGrant.grantKnowledge,
        serviceArea: currentGrant.serviceArea || null,
        partnershipTimeline: currentGrant.partnershipTimeline || null,
        assistType,
      });
      const data = await response.json();
      setChecklistAiResults((prev) => ({
        ...prev,
        [itemId]: { content: data.content, type: assistType },
      }));
    } catch (error) {
      toast({
        title: "AI assist failed",
        description: "Could not generate AI assistance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setChecklistAiLoading(null);
      setChecklistAiLoadingType(null);
    }
  };

  const handleDownloadPackage = async (includeAll: boolean = false) => {
    const sectionsToInclude = includeAll
      ? currentGrant.sections.filter((s) => {
          const status = getSectionStatus(s.id, s.status);
          const hasDraft = draftContentsRef.current[s.id] || s.content;
          return hasDraft || status === "approved" || status === "draft" || status === "in-review";
        })
      : currentGrant.sections.filter((s) => getSectionStatus(s.id, s.status) === "approved");

    if (sectionsToInclude.length === 0) {
      toast({
        title: "Nothing to export",
        description: includeAll
          ? "No sections have been drafted yet. Generate drafts before exporting."
          : "No sections have been approved yet. Approve sections or use 'Export All Drafted Sections'.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const readySections = currentGrant.sections.filter((s) => getSectionStatus(s.id, s.status) === "approved").length;
      const draftedSections = currentGrant.sections.filter((s) => {
        const hasDraft = draftContentsRef.current[s.id] || s.content;
        return hasDraft;
      }).length;
      const missingSections = currentGrant.sections.filter((s) => {
        const hasDraft = draftContentsRef.current[s.id] || s.content;
        return !hasDraft;
      });

      const allSectionsForToc = currentGrant.sections.map((s) => {
        const status = getSectionStatus(s.id, s.status);
        const hasDraft = draftContentsRef.current[s.id] || s.content;
        return {
          name: s.name,
          status: status === "approved" ? "Approved" : hasDraft ? "Draft" : "Not Started",
        };
      });

      const exportSections = sectionsToInclude.map((section) => ({
        name: section.name,
        description: section.description,
        content: draftContentsRef.current[section.id] || section.content || "",
        wordCount: section.wordCount || "",
        pageLimit: section.pageLimit || "",
        status: getSectionStatus(section.id, section.status),
      }));

      const response = await fetch("/api/grants/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          grantName: currentGrant.fullName,
          funder: currentGrant.funder,
          amount: currentGrant.amount,
          deadline: currentGrant.deadline,
          referenceUrl: currentGrant.referenceUrl || "",
          sections: exportSections,
          readySections,
          draftedSections,
          totalSections,
          missingSectionNames: missingSections.map((s) => s.name),
          allSectionsForToc,
        }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeGrant = currentGrant.fullName.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
      a.download = `${safeGrant}_submission_package_${new Date().toISOString().split("T")[0]}.docx`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Export complete", description: "Word document downloaded successfully." });
    } catch (error) {
      console.error("Export failed:", error);
      toast({ title: "Export failed", description: "Could not generate the Word document.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const [isExportingReport, setIsExportingReport] = useState(false);

  const handleExportActionReport = async () => {
    setIsExportingReport(true);
    try {
      const grantsPayload = GRANT_PACKAGES.map((grant) => ({
        name: grant.fullName,
        funder: grant.funder,
        amount: grant.amount,
        deadline: grant.deadline,
        workflowOrder: grant.partnershipTimeline?.workflowOrder || null,
        partnershipSummary: grant.partnershipTimeline?.summary || null,
        partnerRequirements: (grant.partnershipTimeline?.requirements || []).map((r) => ({
          partnerType: r.partnerType,
          timing: r.timing,
          requiredInDocs: r.requiredInDocs,
          docSections: r.docSections,
          description: r.description,
          evidenceNeeded: r.evidenceNeeded,
        })),
        checklist: grant.preExecutionChecklist.map((c) => ({
          id: c.id,
          category: c.category,
          item: c.item,
          status: c.status,
          notes: c.notes,
          guidance: c.guidance || null,
          resources: c.resources || null,
        })),
        serviceAreaRegion: grant.serviceArea?.region || null,
        targetEmployers: (grant.serviceArea?.targetEmployers || []).map((e) => ({
          name: e.name,
          sector: e.sector,
          type: e.type,
        })),
        pipelineTasks: grant.phases.map((phase) => ({
          name: phase.name,
          tasks: phase.tasks.map((t) => ({
            task: t.task,
            owner: t.owner,
            status: t.status,
            dueDate: t.dueDate,
            guidance: t.guidance || null,
          })),
        })),
      }));

      const response = await fetch("/api/grants/export-action-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ grants: grantsPayload }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ThriveUp_Grant_Action_Report_${new Date().toISOString().split("T")[0]}.docx`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Action Report downloaded", description: "Your comprehensive grant readiness report is ready." });
    } catch (error) {
      console.error("Action report export failed:", error);
      toast({ title: "Export failed", description: "Could not generate the action report.", variant: "destructive" });
    } finally {
      setIsExportingReport(false);
    }
  };

  const handleExportSingleGrantReport = async () => {
    setIsExportingReport(true);
    try {
      const grant = currentGrant;
      const grantsPayload = [{
        name: grant.fullName,
        funder: grant.funder,
        amount: grant.amount,
        deadline: grant.deadline,
        workflowOrder: grant.partnershipTimeline?.workflowOrder || null,
        partnershipSummary: grant.partnershipTimeline?.summary || null,
        partnerRequirements: (grant.partnershipTimeline?.requirements || []).map((r) => ({
          partnerType: r.partnerType,
          timing: r.timing,
          requiredInDocs: r.requiredInDocs,
          docSections: r.docSections,
          description: r.description,
          evidenceNeeded: r.evidenceNeeded,
        })),
        checklist: grant.preExecutionChecklist.map((c) => ({
          id: c.id,
          category: c.category,
          item: c.item,
          status: c.status,
          notes: c.notes,
          guidance: c.guidance || null,
          resources: c.resources || null,
        })),
        serviceAreaRegion: grant.serviceArea?.region || null,
        locationEligibility: grant.serviceArea?.locationEligibility || null,
        keyIndustries: grant.serviceArea?.keyIndustries || [],
        laborMarketNotes: grant.serviceArea?.laborMarketNotes || null,
        lwdbName: grant.serviceArea?.lwdbName || null,
        lwdbUrl: grant.serviceArea?.lwdbUrl || null,
        targetEmployers: (grant.serviceArea?.targetEmployers || []).map((e) => ({
          name: e.name,
          sector: e.sector,
          type: e.type,
        })),
        pipelineTasks: grant.phases.map((phase) => ({
          name: phase.name,
          tasks: phase.tasks.map((t) => ({
            task: t.task,
            owner: t.owner,
            status: t.status,
            dueDate: t.dueDate,
            guidance: t.guidance || null,
          })),
        })),
        competitiveEdge: grant.competitiveEdge || [],
        winStrategy: grant.winStrategy ? {
          keyMessage: grant.winStrategy.keyMessage,
          differentiators: grant.winStrategy.differentiators,
          reviewerTips: grant.winStrategy.reviewerTips,
        } : null,
      }];

      const response = await fetch("/api/grants/export-action-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ grants: grantsPayload }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = grant.fullName.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 50);
      a.download = `${safeName}_Action_Report_${new Date().toISOString().split("T")[0]}.docx`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Action Report downloaded", description: `${grant.name} action report is ready.` });
    } catch (error) {
      console.error("Single grant report export failed:", error);
      toast({ title: "Export failed", description: "Could not generate the action report.", variant: "destructive" });
    } finally {
      setIsExportingReport(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-grant-packages-title">Grant Submission Packages</h1>
          <p className="text-muted-foreground mt-1">End-to-end pipeline: Collaborate → Build → Review → Submit → Execute</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleExportActionReport} disabled={isExportingReport} data-testid="button-export-action-report" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
            {isExportingReport ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ClipboardCheck className="h-4 w-4 mr-2" />}
            {isExportingReport ? "Generating..." : "Download Action Report"}
          </Button>
          <Button variant="outline" onClick={() => handleDownloadPackage(true)} disabled={isExporting} data-testid="button-export-all">
            {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {isExporting ? "Exporting..." : "Export Full Package (.docx)"}
          </Button>
          <Link href="/grants">
            <Button variant="outline" data-testid="link-grant-hub">
              <Target className="h-4 w-4 mr-2" />
              Grant Hub
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {GRANT_PACKAGES.map((grant) => {
          const grantApproved = grant.sections.filter((s) => getSectionStatus(s.id, s.status) === "approved").length;
          const grantTotal = grant.sections.length;
          const grantPct = Math.round((grantApproved / grantTotal) * 100);
          const Icon = grant.icon;
          return (
            <button
              key={grant.id}
              onClick={() => { setSelectedGrant(grant.id); setActiveTab("overview"); }}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                selectedGrant === grant.id
                  ? `${grant.borderColor} ring-2 ring-primary/20 ${grant.bgColor}`
                  : "border-border hover:border-primary/30"
              }`}
              data-testid={`button-grant-${grant.id}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`${grant.color} p-2 rounded-lg ${grant.bgColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{grant.name}</h3>
                  <p className="text-xs text-muted-foreground">{grant.funder}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground">{grant.amount}</span>
                <Badge variant={grant.deadlineUrgency === "urgent" ? "destructive" : grant.deadlineUrgency === "approaching" ? "default" : "secondary"} className="text-[10px]">
                  {grant.deadline}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Package Progress</span>
                  <span className="font-medium">{grantApproved}/{grantTotal} approved</span>
                </div>
                <Progress value={grantPct} className="h-1.5" />
              </div>
            </button>
          );
        })}
      </div>

      <Card className={`${currentGrant.bgColor} ${currentGrant.borderColor} border-2`}>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <currentGrant.icon className={`h-6 w-6 ${currentGrant.color}`} />
              <div>
                <h2 className="font-bold text-lg">{currentGrant.fullName}</h2>
                <p className="text-sm text-muted-foreground">{currentGrant.description}</p>
                {currentGrant.referenceUrl && (
                  <a href={currentGrant.referenceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1" data-testid="grant-reference-link">
                    <ExternalLink className="h-3 w-3" />
                    {currentGrant.referenceLabel || "View NOFO / Grant Page"}
                  </a>
                )}
              </div>
            </div>
            <div className="flex gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{approvedCount}/{totalSections}</p>
                <p className="text-xs text-muted-foreground">Sections Approved</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{completedTasks}/{totalTasks}</p>
                <p className="text-xs text-muted-foreground">Tasks Done</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{verifiedChecklist}/{totalChecklist}</p>
                <p className="text-xs text-muted-foreground">Checklist Verified</p>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <Download className="h-4 w-4 inline mr-1.5" />
              Download a complete action report for this grant — includes checklist, partners, pipeline tasks, win strategy, and guidance.
            </p>
            <Button
              onClick={() => handleExportSingleGrantReport()}
              disabled={isExportingReport}
              data-testid="button-export-grant-report"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              {isExportingReport ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {isExportingReport ? "Generating Report..." : `Download ${currentGrant.name} Action Report`}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <Package className="h-4 w-4 mr-1.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="sections" data-testid="tab-sections">
            <FileText className="h-4 w-4 mr-1.5" />
            Sections & Approval
          </TabsTrigger>
          <TabsTrigger value="pipeline" data-testid="tab-pipeline">
            <Layers className="h-4 w-4 mr-1.5" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="checklist" data-testid="tab-checklist">
            <ClipboardCheck className="h-4 w-4 mr-1.5" />
            Pre-Execution
          </TabsTrigger>
          <TabsTrigger value="win-strategy" data-testid="tab-win-strategy">
            <Lightbulb className="h-4 w-4 mr-1.5" />
            Win Strategy
          </TabsTrigger>
          <TabsTrigger value="reminders" data-testid="tab-reminders">
            <Calendar className="h-4 w-4 mr-1.5" />
            Reminders
          </TabsTrigger>
          <TabsTrigger value="scanner" data-testid="tab-scanner">
            <Camera className="h-4 w-4 mr-1.5" />
            Opportunity Scanner
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Target className="h-5 w-5" /> Package Readiness</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Section Approval</span>
                    <span className="font-medium">{packageProgress}%</span>
                  </div>
                  <Progress value={packageProgress} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Task Completion</span>
                    <span className="font-medium">{Math.round((completedTasks / totalTasks) * 100)}%</span>
                  </div>
                  <Progress value={(completedTasks / totalTasks) * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Pre-Execution Checklist</span>
                    <span className="font-medium">{Math.round((verifiedChecklist / totalChecklist) * 100)}%</span>
                  </div>
                  <Progress value={(verifiedChecklist / totalChecklist) * 100} className="h-2" />
                </div>
                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2">
                    {packageProgress === 100 ? (
                      <>
                        <Unlock className="h-5 w-5 text-emerald-600" />
                        <span className="font-semibold text-emerald-600">Ready to Submit</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-5 w-5 text-amber-500" />
                        <span className="font-semibold text-amber-600">Not Yet Ready — {totalSections - approvedCount} sections need approval</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-5 w-5" /> Competitive Edge</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {currentGrant.competitiveEdge.map((edge, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{edge}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {currentGrant.serviceArea && (
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Service Area & Location
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    {currentGrant.serviceArea.locationEligibility === "national" ? "National — Apply from anywhere" :
                     currentGrant.serviceArea.locationEligibility === "statewide" ? `Statewide — ${currentGrant.serviceArea.state}` :
                     currentGrant.serviceArea.locationEligibility === "regional" ? `Regional — ${currentGrant.serviceArea.region}` :
                     `Local — ${currentGrant.serviceArea.city}`}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold mb-1 flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5" /> Primary Location
                    </p>
                    <p className="text-sm">{currentGrant.serviceArea.city}, {currentGrant.serviceArea.state}</p>
                    {currentGrant.serviceArea.counties && (
                      <p className="text-xs text-muted-foreground mt-0.5">Counties: {currentGrant.serviceArea.counties.join(", ")}</p>
                    )}
                    {currentGrant.serviceArea.lwdbName && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        LWDB: {currentGrant.serviceArea.lwdbUrl ? (
                          <a href={currentGrant.serviceArea.lwdbUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{currentGrant.serviceArea.lwdbName}</a>
                        ) : currentGrant.serviceArea.lwdbName}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1 flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" /> Key Industries
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {currentGrant.serviceArea.keyIndustries.map((ind, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">{ind}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-background border">
                  <p className="text-xs font-semibold mb-1">Location Eligibility</p>
                  <p className="text-sm">{currentGrant.serviceArea.locationNotes}</p>
                </div>

                {currentGrant.serviceArea.multiSiteEligible && currentGrant.serviceArea.multiSiteNotes && (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <p className="text-xs font-semibold mb-1 flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Multi-Site Eligible
                    </p>
                    <p className="text-sm">{currentGrant.serviceArea.multiSiteNotes}</p>
                  </div>
                )}

                {!currentGrant.serviceArea.multiSiteEligible && currentGrant.serviceArea.multiSiteNotes && (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs font-semibold mb-1 flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="h-3.5 w-3.5" /> Geographic Restriction
                    </p>
                    <p className="text-sm">{currentGrant.serviceArea.multiSiteNotes}</p>
                  </div>
                )}

                {currentGrant.serviceArea.targetEmployers.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" /> Target Employers & Partners ({currentGrant.serviceArea.region})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentGrant.serviceArea.targetEmployers.map((emp, i) => (
                        <div key={i} className="p-2 rounded border bg-background text-sm" data-testid={`employer-card-${i}`}>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">{emp.sector} — {emp.type}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentGrant.serviceArea.laborMarketNotes && (
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="text-xs font-semibold mb-1 flex items-center gap-1.5">
                      <BarChart3 className="h-3.5 w-3.5" /> Labor Market Intelligence
                    </p>
                    <p className="text-xs">{currentGrant.serviceArea.laborMarketNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {currentGrant.partnershipTimeline && (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Handshake className="h-5 w-5 text-amber-600" />
                  Partnership & Connection Timeline
                  <Badge variant="outline" className="ml-auto text-[10px] font-semibold text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700">
                    {currentGrant.partnershipTimeline.workflowOrder}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-amber-100/50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm font-semibold" data-testid="text-partnership-summary">{currentGrant.partnershipTimeline.summary}</p>
                </div>

                <div className="space-y-3">
                  {currentGrant.partnershipTimeline.requirements.map((req, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${
                      req.requiredInDocs ? "bg-red-50/30 dark:bg-red-950/10 border-red-200/50 dark:border-red-800/50" : "bg-background border-border"
                    }`} data-testid={`partner-req-${i}`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold">{req.partnerType}</p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {req.requiredInDocs && (
                            <Badge variant="destructive" className="text-[10px]">Must Be in Docs</Badge>
                          )}
                          <Badge variant={req.timing === "pre-award" ? "default" : req.timing === "post-award" ? "secondary" : "outline"} className="text-[10px]">
                            {req.timing === "pre-award" ? "Pre-Award" : req.timing === "post-award" ? "Post-Award" : "Both"}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs mb-2">{req.description}</p>
                      {req.requiredInDocs && req.docSections.length > 0 && (
                        <div className="flex items-center gap-1 mb-2">
                          <span className="text-[10px] text-muted-foreground font-medium">Referenced in:</span>
                          {req.docSections.map((sec, si) => (
                            <Badge key={si} variant="secondary" className="text-[9px]">{sec}</Badge>
                          ))}
                        </div>
                      )}
                      <div className="p-2 rounded bg-muted/50 border">
                        <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Evidence Needed</p>
                        <p className="text-xs">{req.evidenceNeeded}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab("checklist")}
                    data-testid="button-goto-checklist-partners"
                  >
                    <Search className="h-3.5 w-3.5 mr-1.5" />
                    Find Partners with AI
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab("checklist")}
                    data-testid="button-goto-checklist-templates"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Generate Outreach Templates
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {(() => {
            const allApproved = approvedCount === totalSections;
            const someDrafted = currentGrant.sections.some((s) => draftContentsRef.current[s.id] || s.content);
            const needsApproval = currentGrant.sections.some((s) => {
              const hasDraft = draftContentsRef.current[s.id] || s.content;
              return hasDraft && getSectionStatus(s.id, s.status) !== "approved";
            });
            const noDrafts = !someDrafted;
            const hasPreAwardPartners = currentGrant.partnershipTimeline?.requirements.some((r) => r.requiredInDocs && r.timing === "pre-award");
            const partnerChecklistPending = currentGrant.preExecutionChecklist.filter((c) =>
              (c.category === "Partnerships" || c.category === "Coalition") && c.status !== "verified"
            ).length;

            let nextStepTitle = "";
            let nextStepDescription = "";
            let nextStepAction = "";
            let nextStepTab = "";
            let nextStepColor = "border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20";

            if (hasPreAwardPartners && partnerChecklistPending > 0 && noDrafts) {
              nextStepTitle = "Secure Partnerships First — Before Drafting";
              nextStepDescription = `This grant requires partners to be named in your documents. You have ${partnerChecklistPending} partnership item${partnerChecklistPending > 1 ? "s" : ""} that need attention. Use the AI to find partners, generate outreach templates, and get commitment letters BEFORE you start drafting sections.`;
              nextStepAction = "Find Partners & Get Templates →";
              nextStepTab = "checklist";
              nextStepColor = "border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/20";
            } else if (noDrafts) {
              nextStepTitle = "Start Drafting Sections";
              nextStepDescription = "Go to Sections & Approval to generate your first AI draft. The AI knows your grant requirements, service area, and organizational context — it will write a strong first draft for each section.";
              nextStepAction = "Go to Sections & Approval →";
              nextStepTab = "sections";
              nextStepColor = "border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20";
            } else if (needsApproval) {
              const unapprovedSections = currentGrant.sections.filter((s) => {
                const hasDraft = draftContentsRef.current[s.id] || s.content;
                return hasDraft && getSectionStatus(s.id, s.status) !== "approved";
              }).map(s => s.name);
              nextStepTitle = "Review & Approve Drafted Sections";
              nextStepDescription = `You have ${unapprovedSections.length} drafted section${unapprovedSections.length > 1 ? "s" : ""} waiting for your review: ${unapprovedSections.join(", ")}. Read each draft, use "Refine with AI" for improvements, then approve when ready.`;
              nextStepAction = "Review Sections →";
              nextStepTab = "sections";
              nextStepColor = "border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20";
            } else if (allApproved) {
              const checklistActionNeeded = currentGrant.preExecutionChecklist.filter((c) => c.status === "action-needed").length;
              if (checklistActionNeeded > 0) {
                nextStepTitle = "Complete Pre-Execution Checklist";
                nextStepDescription = `All sections approved! Now verify ${checklistActionNeeded} pre-execution item${checklistActionNeeded > 1 ? "s" : ""} that need action before you can submit. These ensure you're ready for Day 1 if awarded.`;
                nextStepAction = "Go to Pre-Execution →";
                nextStepTab = "checklist";
                nextStepColor = "border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20";
              } else {
                nextStepTitle = "Ready to Export & Submit!";
                nextStepDescription = "All sections approved and pre-execution items verified. Export your complete package as a Word document and submit to the funder.";
                nextStepAction = "Export Package (.docx)";
                nextStepTab = "";
                nextStepColor = "border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20";
              }
            }

            return nextStepTitle ? (
              <Card className={`${nextStepColor}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <ArrowRight className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" data-testid="text-next-step-title">{nextStepTitle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{nextStepDescription}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (nextStepTab) {
                        setActiveTab(nextStepTab);
                      } else {
                        handleDownloadPackage(true);
                      }
                    }}
                    data-testid="button-next-step"
                  >
                    {nextStepAction}
                  </Button>
                </CardContent>
              </Card>
            ) : null;
          })()}

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-5 w-5" /> Accountability Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-2">
                {currentGrant.phases.map((phase, idx) => {
                  const phaseDone = phase.tasks.filter((t) => t.status === "done").length;
                  const phaseTotal = phase.tasks.length;
                  return (
                    <div key={phase.id} className="flex-1 flex items-center gap-2">
                      <div className={`flex-1 p-3 rounded-lg border ${
                        phase.status === "complete" ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800" :
                        phase.status === "active" ? "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800" :
                        "bg-muted/50 border-border"
                      }`}>
                        <p className="text-xs font-semibold mb-1">{phase.name.split(". ")[1]}</p>
                        <p className="text-xs text-muted-foreground">{phaseDone}/{phaseTotal} tasks</p>
                        <Progress value={(phaseDone / phaseTotal) * 100} className="h-1 mt-1.5" />
                      </div>
                      {idx < currentGrant.phases.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setActiveTab("sections")} data-testid="card-nav-sections">
              <CardContent className="p-4 flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold text-sm">Review & Approve Sections</p>
                  <p className="text-xs text-muted-foreground">{approvedCount}/{totalSections} sections approved</p>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setActiveTab("pipeline")} data-testid="card-nav-pipeline">
              <CardContent className="p-4 flex items-center gap-3">
                <Layers className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold text-sm">Track Pipeline Tasks</p>
                  <p className="text-xs text-muted-foreground">{completedTasks}/{totalTasks} tasks completed</p>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setActiveTab("checklist")} data-testid="card-nav-checklist">
              <CardContent className="p-4 flex items-center gap-3">
                <ClipboardCheck className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold text-sm">Pre-Execution Checklist</p>
                  <p className="text-xs text-muted-foreground">{verifiedChecklist}/{totalChecklist} items verified</p>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sections" className="space-y-4 mt-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg" data-testid="text-sections-title">Workflow & Collaboration</h3>
                <p className="text-sm text-muted-foreground">AI drafts each section. You review, refine, and approve. Nothing ships without your sign-off.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-muted-foreground">Mode:</span>
                  <Button
                    size="sm"
                    variant={workflowMode === "guided" ? "default" : "ghost"}
                    className="h-7 text-xs px-2"
                    onClick={() => setWorkflowMode("guided")}
                    data-testid="button-mode-guided"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Human-in-Loop
                  </Button>
                  <Button
                    size="sm"
                    variant={workflowMode === "auto" ? "default" : "ghost"}
                    className="h-7 text-xs px-2"
                    onClick={() => setWorkflowMode("auto")}
                    data-testid="button-mode-auto"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Auto-Draft All
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => handleDownloadPackage(true)}
                  disabled={isExporting}
                  data-testid="button-export-sections"
                >
                  {isExporting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Download className="h-3 w-3 mr-1" />}
                  {isExporting ? "Exporting..." : "Export Package (.docx)"}
                </Button>
                {packageProgress === 100 ? (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">All Approved</Badge>
                ) : (
                  <Badge variant="secondary">{approvedCount}/{totalSections} Approved</Badge>
                )}
              </div>
            </div>

            {workflowMode === "auto" && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Auto-Draft Mode</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                      Click "Draft All Sections" to have AI generate drafts for every section at once. You can then review and approve each one.
                    </p>
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        currentGrant.sections.forEach((s) => {
                          if (getSectionStatus(s.id, s.status) !== "approved") {
                            expandedSections.add(s.id);
                          }
                        });
                        setExpandedSections(new Set(expandedSections));
                        setAutoTriggerDraft(true);
                      }}
                      data-testid="button-draft-all"
                    >
                      <Sparkles className="h-4 w-4 mr-1.5" />
                      Draft All Sections
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {currentGrant.sections.map((section) => {
                const currentStatus = getSectionStatus(section.id, section.status);
                const isExpanded = expandedSections.has(section.id);
                const SectionIcon = section.icon;
                return (
                  <div key={section.id} className={`border rounded-lg overflow-hidden ${currentStatus === "approved" ? "border-emerald-200 dark:border-emerald-800" : "border-border"}`}>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full text-left p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors"
                      data-testid={`button-section-${section.id}`}
                    >
                      <SectionIcon className={`h-5 w-5 ${currentGrant.color} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm">{section.name}</h4>
                          <StatusBadge status={currentStatus} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                        {(section.pageLimit || section.wordCount) && (
                          <div className="flex items-center gap-3 mt-1">
                            {section.pageLimit && (
                              <span className="text-[10px] font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded" data-testid={`section-page-limit-${section.id}`}>
                                {section.pageLimit}
                              </span>
                            )}
                            {section.wordCount && (
                              <span className="text-[10px] font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded" data-testid={`section-word-count-${section.id}`}>
                                {section.wordCount}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground hidden sm:block">{section.assignee}</span>
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 pt-0 border-t bg-muted/20">
                        <div className="space-y-4 mt-3">
                          <SectionDrafter
                            section={section}
                            grant={currentGrant}
                            autoTrigger={autoTriggerDraft && workflowMode === "auto" && currentStatus !== "approved"}
                            onAutoTriggered={() => setAutoTriggerDraft(false)}
                            onDraftUpdate={updateDraftContent}
                            savedDraft={savedDrafts[section.id]}
                            onSaveDraft={handleSaveDraft}
                          />

                          <div className="pt-3 border-t">
                            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                              <Shield className="h-3 w-3" />
                              Your Decision
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {(["draft", "in-review", "needs-revision", "approved"] as ApprovalStatus[]).map((status) => {
                                const config = APPROVAL_LABELS[status];
                                const Icon = config.icon;
                                return (
                                  <Button
                                    key={status}
                                    size="sm"
                                    variant={currentStatus === status ? "default" : "outline"}
                                    onClick={() => updateSectionStatus(section.id, status)}
                                    data-testid={`button-status-${section.id}-${status}`}
                                  >
                                    <Icon className="h-3.5 w-3.5 mr-1.5" />
                                    {config.label}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4 mt-4">
          <Card className="p-4">
            <h3 className="font-bold text-lg mb-1" data-testid="text-pipeline-title">Submission Pipeline</h3>
            <p className="text-sm text-muted-foreground mb-4">Track every task from collaboration to submission. Your accountability tracker.</p>

            <div className="space-y-4">
              {currentGrant.phases.map((phase) => {
                const isExpanded = expandedPhases.has(phase.id);
                const phaseDone = phase.tasks.filter((t) => t.status === "done").length;
                const phaseTotal = phase.tasks.length;
                return (
                  <div key={phase.id} className={`border rounded-lg overflow-hidden ${
                    phase.status === "complete" ? "border-emerald-200 dark:border-emerald-800" :
                    phase.status === "active" ? "border-blue-200 dark:border-blue-800" : "border-border"
                  }`}>
                    <button
                      onClick={() => togglePhase(phase.id)}
                      className={`w-full text-left p-4 flex items-center gap-3 ${
                        phase.status === "active" ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                      }`}
                      data-testid={`button-phase-${phase.id}`}
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        phase.status === "complete" ? "bg-emerald-100 dark:bg-emerald-900/40" :
                        phase.status === "active" ? "bg-blue-100 dark:bg-blue-900/40" :
                        "bg-muted"
                      }`}>
                        {phase.status === "complete" ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : phase.status === "active" ? (
                          <Activity className="h-5 w-5 text-blue-600 animate-pulse" />
                        ) : (
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">{phase.name}</h4>
                          <Badge variant={phase.status === "active" ? "default" : "secondary"} className="text-[10px]">
                            {phaseDone}/{phaseTotal}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{phase.description}</p>
                      </div>
                      <Progress value={(phaseDone / phaseTotal) * 100} className="w-24 h-1.5 hidden sm:block" />
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>

                    {isExpanded && (
                      <div className="border-t divide-y">
                        {phase.tasks.map((task) => {
                          const taskTyped = task as { id: string; task: string; owner: string; status: string; dueDate: string; guidance?: string; aiCanHelp?: boolean; aiAction?: string };
                          return (
                            <div key={task.id} className="hover:bg-muted/20">
                              <div className="flex items-center gap-3 p-3">
                                <TaskStatusIcon status={task.status} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">{task.task}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-muted-foreground">{task.owner}</span>
                                    <span className="text-xs text-muted-foreground">·</span>
                                    <span className="text-xs text-muted-foreground">{task.dueDate}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {taskTyped.aiCanHelp && (
                                    <Badge variant="secondary" className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                                      <Sparkles className="h-3 w-3 mr-1" /> AI Assist
                                    </Badge>
                                  )}
                                  <Badge variant={task.status === "done" ? "default" : task.status === "in-progress" ? "secondary" : "outline"} className="text-[10px]">
                                    {task.status === "done" ? "Done" : task.status === "in-progress" ? "In Progress" : "Pending"}
                                  </Badge>
                                </div>
                              </div>
                              {(taskTyped.guidance || taskTyped.aiCanHelp) && (
                                <div className="px-3 pb-3 pl-10 space-y-2">
                                  {taskTyped.guidance && (
                                    <div className="p-2.5 rounded-md bg-muted/40 border text-xs">
                                      <div className="flex items-start gap-1.5">
                                        <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                                        <p className="whitespace-pre-line">{taskTyped.guidance}</p>
                                      </div>
                                    </div>
                                  )}

                                  {(() => {
                                    const isPartnerTask = task.task.toLowerCase().includes("partner") || task.task.toLowerCase().includes("coalition") || task.task.toLowerCase().includes("employer") || task.task.toLowerCase().includes("lwdb") || task.task.toLowerCase().includes("stakeholder");
                                    const pipelineAiResult = checklistAiResults[`pipeline-${task.id}`];
                                    const pipelineLoading = checklistAiLoading === `pipeline-${task.id}`;
                                    return (
                                      <>
                                        <div className="flex flex-wrap gap-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs h-7"
                                            disabled={pipelineLoading}
                                            onClick={() => handleChecklistAiAssist(`pipeline-${task.id}`, task.task, "action-guide")}
                                            data-testid={`button-pipeline-guide-${task.id}`}
                                          >
                                            {pipelineLoading && checklistAiLoadingType === "action-guide" ? (
                                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                            ) : (
                                              <Sparkles className="h-3 w-3 mr-1" />
                                            )}
                                            Step-by-Step Guide
                                          </Button>
                                          {isPartnerTask && (
                                            <>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-xs h-7 border-violet-300 text-violet-700 dark:border-violet-700 dark:text-violet-300"
                                                disabled={pipelineLoading}
                                                onClick={() => handleChecklistAiAssist(`pipeline-${task.id}`, task.task, "find-partners")}
                                                data-testid={`button-pipeline-partners-${task.id}`}
                                              >
                                                {pipelineLoading && checklistAiLoadingType === "find-partners" ? (
                                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                ) : (
                                                  <Search className="h-3 w-3 mr-1" />
                                                )}
                                                Find Partners
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-xs h-7 border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300"
                                                disabled={pipelineLoading}
                                                onClick={() => handleChecklistAiAssist(`pipeline-${task.id}`, task.task, "outreach-template")}
                                                data-testid={`button-pipeline-template-${task.id}`}
                                              >
                                                {pipelineLoading && checklistAiLoadingType === "outreach-template" ? (
                                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                ) : (
                                                  <Pencil className="h-3 w-3 mr-1" />
                                                )}
                                                Outreach Templates
                                              </Button>
                                            </>
                                          )}
                                        </div>

                                        {pipelineAiResult && (
                                          <div className="p-3 rounded-lg border bg-background">
                                            <div className="flex items-center justify-between mb-2">
                                              <p className="text-xs font-semibold flex items-center gap-1.5">
                                                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                                                {pipelineAiResult.type === "find-partners" ? "Partner Recommendations" : pipelineAiResult.type === "outreach-template" ? "Outreach Templates" : "Action Guide"}
                                              </p>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-xs h-6 px-2"
                                                onClick={() => {
                                                  navigator.clipboard.writeText(pipelineAiResult.content);
                                                  toast({ title: "Copied to clipboard" });
                                                }}
                                                data-testid={`button-copy-pipeline-${task.id}`}
                                              >
                                                <Upload className="h-3 w-3 mr-1" /> Copy
                                              </Button>
                                            </div>
                                            <div className="text-sm prose prose-sm dark:prose-invert max-w-none whitespace-pre-line">
                                              {pipelineAiResult.content}
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-4 mt-4">
          <Card className="p-4">
            <h3 className="font-bold text-lg mb-1" data-testid="text-checklist-title">Pre-Execution Readiness Checklist</h3>
            <p className="text-sm text-muted-foreground mb-4">Everything that must be in place before Day 1 if awarded. AI can help you work through each item.</p>

            <div className="mb-4 p-3 rounded-lg bg-muted/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium">{currentGrant.preExecutionChecklist.filter((c) => c.status === "verified").length} Verified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">{currentGrant.preExecutionChecklist.filter((c) => c.status === "pending").length} Pending</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">{currentGrant.preExecutionChecklist.filter((c) => c.status === "action-needed").length} Action Needed</span>
                </div>
              </div>
              <Progress value={(verifiedChecklist / totalChecklist) * 100} className="w-32 h-2" />
            </div>

            {Array.from(new Set(currentGrant.preExecutionChecklist.map((c) => c.category))).map((category) => (
              <div key={category} className="mb-6">
                <h4 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">{category}</h4>
                <div className="space-y-3">
                  {currentGrant.preExecutionChecklist.filter((c) => c.category === category).map((item) => {
                    const itemTyped = item as typeof item & { guidance?: string; resources?: Array<{ label: string; url: string }> };
                    const isExpanded = expandedChecklistItems.has(item.id);
                    const aiResult = checklistAiResults[item.id];
                    const isLoading = checklistAiLoading === item.id;
                    const showPartners = item.category === "Partnerships" || item.item.toLowerCase().includes("partner") || item.item.toLowerCase().includes("employer");
                    return (
                      <div key={item.id} className={`rounded-lg border overflow-hidden ${
                        item.status === "verified" ? "bg-emerald-50/50 border-emerald-200/50 dark:bg-emerald-950/20 dark:border-emerald-800/50" :
                        item.status === "action-needed" ? "bg-red-50/50 border-red-200/50 dark:bg-red-950/20 dark:border-red-800/50" :
                        "bg-muted/30 border-border"
                      }`}>
                        <button
                          onClick={() => {
                            setExpandedChecklistItems((prev) => {
                              const next = new Set(prev);
                              if (next.has(item.id)) next.delete(item.id);
                              else next.add(item.id);
                              return next;
                            });
                          }}
                          className="w-full text-left p-3 flex items-start gap-3"
                          data-testid={`button-checklist-${item.id}`}
                        >
                          <ChecklistStatusIcon status={item.status} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{item.item}</p>
                            {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={item.status === "verified" ? "default" : item.status === "action-needed" ? "destructive" : "secondary"} className="text-[10px]">
                              {item.status === "verified" ? "Verified" : item.status === "action-needed" ? "Action Needed" : "Pending"}
                            </Badge>
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t px-3 pb-3 pt-2 space-y-3">
                            {itemTyped.guidance && (
                              <div className="p-2.5 rounded-md bg-muted/40 border text-xs">
                                <div className="flex items-start gap-1.5">
                                  <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                                  <p className="whitespace-pre-line">{itemTyped.guidance}</p>
                                </div>
                              </div>
                            )}

                            {itemTyped.resources && itemTyped.resources.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {itemTyped.resources.map((r, ri) => (
                                  <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded" data-testid={`link-resource-${item.id}-${ri}`}>
                                    <ExternalLink className="h-3 w-3" /> {r.label}
                                  </a>
                                ))}
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2 pt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7"
                                disabled={isLoading}
                                onClick={() => handleChecklistAiAssist(item.id, item.item, "action-guide")}
                                data-testid={`button-ai-guide-${item.id}`}
                              >
                                {isLoading && checklistAiLoadingType === "action-guide" ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Sparkles className="h-3 w-3 mr-1" />
                                )}
                                Step-by-Step Guide
                              </Button>
                              {showPartners && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7"
                                    disabled={isLoading}
                                    onClick={() => handleChecklistAiAssist(item.id, item.item, "find-partners")}
                                    data-testid={`button-ai-partners-${item.id}`}
                                  >
                                    {isLoading && checklistAiLoadingType === "find-partners" ? (
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    ) : (
                                      <Search className="h-3 w-3 mr-1" />
                                    )}
                                    Find Partners
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7"
                                    disabled={isLoading}
                                    onClick={() => handleChecklistAiAssist(item.id, item.item, "outreach-template")}
                                    data-testid={`button-ai-template-${item.id}`}
                                  >
                                    {isLoading && checklistAiLoadingType === "outreach-template" ? (
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    ) : (
                                      <Pencil className="h-3 w-3 mr-1" />
                                    )}
                                    Outreach Templates
                                  </Button>
                                </>
                              )}
                            </div>

                            {aiResult && (
                              <div className="p-3 rounded-lg border bg-background">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-semibold flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                                    AI {aiResult.type === "find-partners" ? "Partner Recommendations" : aiResult.type === "outreach-template" ? "Outreach Templates" : "Action Guide"}
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs h-6 px-2"
                                    onClick={() => {
                                      navigator.clipboard.writeText(aiResult.content);
                                      toast({ title: "Copied to clipboard" });
                                    }}
                                    data-testid={`button-copy-ai-${item.id}`}
                                  >
                                    <Upload className="h-3 w-3 mr-1" /> Copy
                                  </Button>
                                </div>
                                <div className="text-sm prose prose-sm dark:prose-invert max-w-none whitespace-pre-line">
                                  {aiResult.content}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="win-strategy" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-5 w-5 text-emerald-600" /> Your Differentiators</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {currentGrant.winStrategy.differentiators.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Eye className="h-5 w-5 text-blue-600" /> What Reviewers Prioritize</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {currentGrant.winStrategy.reviewerPriorities.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Target className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Lightbulb className="h-5 w-5 text-amber-600" /> Scoring Tips</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {currentGrant.winStrategy.scoringTips.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-5 w-5 text-red-600" /> Common Pitfalls to Avoid</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {currentGrant.winStrategy.commonPitfalls.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4 mt-4">
          <GrantRemindersChecklist grants={GRANT_PACKAGES} />
        </TabsContent>

        <TabsContent value="scanner" className="space-y-4 mt-4">
          <OpportunityScanner />
        </TabsContent>
      </Tabs>

      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-3">Related Tools</h3>
        <div className="flex flex-wrap gap-2">
          <Link href="/grants"><Button variant="outline" size="sm" data-testid="link-grant-hub-bottom"><Target className="h-3.5 w-3.5 mr-1.5" />Grant Hub</Button></Link>
          <Link href="/grant-narrative"><Button variant="outline" size="sm" data-testid="link-narrative-builder"><FileText className="h-3.5 w-3.5 mr-1.5" />Narrative Builder</Button></Link>
          <Link href="/program-designer"><Button variant="outline" size="sm" data-testid="link-program-designer"><Target className="h-3.5 w-3.5 mr-1.5" />Program Designer</Button></Link>
          <Link href="/logic-model"><Button variant="outline" size="sm" data-testid="link-logic-model"><Layers className="h-3.5 w-3.5 mr-1.5" />Logic Model</Button></Link>
          <Link href="/program-lifecycle"><Button variant="outline" size="sm" data-testid="link-lifecycle"><Activity className="h-3.5 w-3.5 mr-1.5" />Program Lifecycle</Button></Link>
          <Link href="/transparency-dashboard"><Button variant="outline" size="sm" data-testid="link-transparency"><BarChart3 className="h-3.5 w-3.5 mr-1.5" />Transparency Dashboard</Button></Link>
          <Link href="/case-studies"><Button variant="outline" size="sm" data-testid="link-case-studies"><BookOpen className="h-3.5 w-3.5 mr-1.5" />Case Studies</Button></Link>
          <Link href="/ecosystem"><Button variant="outline" size="sm" data-testid="link-ecosystem"><Globe className="h-3.5 w-3.5 mr-1.5" />Ecosystem Hub</Button></Link>
        </div>
      </Card>
    </div>
  );
}
