import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { RequireAuth } from "@/components/require-auth";
import SectionTutorial from "@/components/section-tutorial";
import { SECTION_TUTORIALS } from "@/lib/tutorial-content";
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
  Award, Star, GraduationCap, Headphones, Microscope,
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

interface GrantEssential {
  label: string;
  detail: string;
  critical?: boolean;
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
  essentials?: GrantEssential[];
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
    essentials: [
      { label: "Employer Partners Required", detail: "Must have committed employer partners for work-based learning placements (internships, apprenticeships, OJT) — letters of commitment needed", critical: true },
      { label: "75% Out-of-School Youth", detail: "At least 75% of funds must serve Out-of-School Youth (ages 16–24 not enrolled in school)", critical: true },
      { label: "20% on Work Experience", detail: "At least 20% of budget must be spent on paid/unpaid work experience activities" },
      { label: "14 Program Elements", detail: "Must deliver all 14 required youth elements: tutoring, work experience, mentoring (12 months), occupational skills, leadership, financial literacy, follow-up services (12 months post-exit), and more" },
      { label: "6 Performance Indicators", detail: "Tracked on: employment rate Q2 & Q4 after exit, median earnings, credential attainment, measurable skill gains, employer effectiveness" },
      { label: "MOU with Workforce Board", detail: "Must have Memorandum of Understanding with Local Workforce Development Board (Workforce Solutions Capital Area)" },
      { label: "Eligible Youth Barriers", detail: "Participants must face barriers: dropout, basic skills deficient, English learner, justice-involved, homeless, foster care, pregnant/parenting, disability, or low-income" },
      { label: "Rolling Deadline", detail: "Submitted to State Workforce Board — no fixed federal deadline, but LWDB procurement cycles apply" },
    ],
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
          { id: "wc3", task: "Map platform capabilities to all 14 WIOA youth elements", owner: "AI", status: "pending", dueDate: "TBD", guidance: "WIOA requires all 14 youth program elements. ThriveUp's 24 platforms map directly — e.g., ThriveUp Academy = tutoring, WholeMind = comprehensive guidance, SafeReport = safe environment, MCE = entrepreneurial skills. The AI can generate a complete platform-to-element mapping matrix.", aiCanHelp: true, aiAction: "Generate 14-element platform mapping" },
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
        id: "review", name: "3. Review & Approve", description: "Dr. Flood review + RPLICE quality gate", status: "upcoming",
        tasks: [
          { id: "wr0", task: "RPLICE quality review — CFIR 2.0 + RE-AIM + fidelity checklist assessment", owner: "RPLICE System", status: "pending", dueDate: "TBD", guidance: "Standard operating procedure: Run RPLICE CFIR domain assessment, RE-AIM readiness scorecard, and fidelity checklist against all proposal sections before Dr. Flood review. Results stored in RPLICE database and used to identify gaps." },
          { id: "wr1", task: "Address RPLICE critical findings before proceeding", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "wr2", task: "Review and approve complete narrative", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "wr3", task: "Review and approve budget", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "wr4", task: "Verify performance targets are achievable", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "wr5", task: "RPLICE re-assessment — confirm all critical items resolved", owner: "RPLICE System", status: "pending", dueDate: "TBD" },
          { id: "wr6", task: "Final compliance review against WIOA regulations", owner: "Dr. Flood + AI", status: "pending", dueDate: "TBD" },
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
      { id: "wpe-2", category: "Compliance", item: "501(c)(3) status confirmed", status: "verified", notes: "TCAF IRS-determined 501(c)(3) — Letter 947, eff. 01/14/2026 (EIN 41-3618003). Attach to application.", guidance: "Attach IRS Letter 947 (TCAF determination letter, effective January 14, 2026). If your status is less than 5 years old, you may also need to include most recent Form 990." },
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
    id: "foundation",
    name: "Foundation Grant",
    fullName: "Foundation Grant — Economic Empowerment & Workforce Development",
    funder: "Foundation Grant",
    amount: "$100,000 - $500,000",
    deadline: "Rolling (LOI Required)",
    deadlineUrgency: "on-track",
    icon: Trophy,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-800",
    description: "Foundation grants fund programs that drive economic empowerment for Black communities through workforce development, career advancement, and entrepreneurship pathways for youth and young adults ages 16-24.",
    referenceUrl: "https://foundation.example.com/apply/",
    referenceLabel: "Foundation Grant Application",
    grantKnowledge: `Foundation Grant — Economic Empowerment Grants — $100,000–$500,000.
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
      locationNotes: "Foundation Grant accepts applications from anywhere in the United States. There are no geographic restrictions. Your program should serve Black youth ages 16-24 in a defined community — Austin, TX is your primary site. You can propose serving multiple locations if you have the capacity.",
      multiSiteEligible: true,
      multiSiteNotes: "You can propose a single-site program (Austin) or a multi-site model. Multi-site is stronger if you can demonstrate capacity in each location. For a first application, single-site (Austin) is recommended to show focused impact. You can expand in subsequent funding years.",
    },
    partnershipTimeline: {
      summary: "Foundation Grant values strong community partnerships but the LOI can be submitted without formal partner agreements. For the full proposal (if invited), employer partners and community organizations should be named. Secure key partnerships between LOI and full proposal.",
      workflowOrder: "LOI First (name key partners) → Secure Formal Commitments → Full Proposal with Documentation",
      requirements: [
        { partnerType: "Employer Partners", requiredInDocs: true, timing: "both", docSections: ["Full Proposal Narrative", "Partnership Documentation"], description: "For the LOI, describe the types of employers you'll partner with — specific names strengthen it but aren't required. For the full proposal, you MUST name specific employers with commitment details. Use the time between LOI submission and full proposal invitation to secure these.", evidenceNeeded: "LOI: employer types and sectors. Full proposal: signed commitment letters, named contacts, specific role descriptions and placement numbers" },
        { partnerType: "Community Organizations", requiredInDocs: true, timing: "both", docSections: ["Full Proposal Narrative", "Equity & Community Voice", "Partnership Documentation"], description: "Black-led community organizations that validate your community connection. Foundation Grant explicitly looks for community-rooted partnerships, not transactional ones. Start building these now — they strengthen both LOI and full proposal.", evidenceNeeded: "LOI: named organizations and relationship description. Full proposal: letters of support, joint programming descriptions, community voice documentation" },
        { partnerType: "Educational Institutions", requiredInDocs: false, timing: "both", docSections: ["Full Proposal Narrative"], description: "Schools, community colleges, or certification providers. Helpful but not strictly required. Strengthens the credential pipeline narrative.", evidenceNeeded: "Letters of support, articulation agreements for credential programs" },
        { partnerType: "Mentorship / MCE Business Partners", requiredInDocs: false, timing: "post-award", docSections: [], description: "MCE (Minority Capital Exchange) business mentors and Black-owned business partners for the entrepreneurship pipeline. Can be formalized post-award as part of program implementation.", evidenceNeeded: "Mentor roster, business partner agreements — can be developed during startup period" },
      ],
    },
    essentials: [
      { label: "Black Youth Focus", detail: "Must exclusively serve Black youth and young adults ages 16–24 — program design must center racial equity and economic empowerment", critical: true },
      { label: "LOI First", detail: "Two-stage process — submit a Letter of Inquiry first (3 pages). Only invited applicants submit a full proposal", critical: true },
      { label: "Employer Partners Needed", detail: "Must demonstrate employer commitments for job placements, internships, or apprenticeships — named partners required in full proposal" },
      { label: "Community-Rooted", detail: "Foundation Grant explicitly looks for community-rooted (not transactional) partnerships — Black-led organizations that validate your connection" },
      { label: "Outcomes Required", detail: "Must track: employment placement, wage gains, credential attainment, and/or business starts" },
      { label: "Sustainability Plan", detail: "Must show how program continues beyond Foundation Grant funding — diversified revenue, earned income, or other grant strategies" },
      { label: "Equity & Voice", detail: "Program design must center Black community voice and lived experience — not designed 'for' but 'with' the community" },
      { label: "No Geographic Restriction", detail: "National program — no location restrictions. Your Austin-based program is eligible." },
    ],
    sections: [
      { id: "nba-loi", name: "Letter of Inquiry (LOI)", description: "Initial inquiry with program overview, population served, and funding request", icon: FileText, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI", pageLimit: "3 pages", wordCount: "800–1,200 words" },
      { id: "nba-narrative", name: "Full Proposal Narrative", description: "Program design, theory of change, target population, implementation plan", icon: BookOpen, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI", pageLimit: "15 pages", wordCount: "5,000–6,000 words" },
      { id: "nba-budget", name: "Budget & Justification", description: "Detailed budget with cost-per-participant and overhead allocation", icon: DollarSign, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "3 pages", wordCount: "1,000–1,500 words" },
      { id: "nba-outcomes", name: "Outcomes Framework", description: "Measurable outcomes: employment, wage gains, credential attainment, business starts", icon: BarChart3, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI", pageLimit: "3 pages", wordCount: "1,000–1,500 words" },
      { id: "nba-org-capacity", name: "Organizational Capacity", description: "Board composition, leadership bios, financial statements, prior program results", icon: Building2, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "5 pages", wordCount: "1,500–2,000 words" },
      { id: "nba-equity", name: "Equity & Community Voice", description: "How program design centers Black community voice and lived experience", icon: Heart, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "3 pages", wordCount: "1,000–1,500 words" },
      { id: "nba-partnerships", name: "Partnership Documentation", description: "Employer partners, community organizations, educational institutions", icon: Handshake, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "No limit (1 per partner)", wordCount: "300–500 words each" },
      { id: "nba-sustainability", name: "Sustainability & Scale Plan", description: "How program continues and grows beyond Foundation Grant funding", icon: Globe, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "3 pages", wordCount: "1,000–1,500 words" },
    ],
    phases: [
      {
        id: "collaborate", name: "1. Collaborate & Research", description: "Understand Foundation Grant priorities and align program", status: "upcoming",
        tasks: [
          { id: "nc1", task: "Review Foundation Grant guidelines and past grantees", owner: "Dr. Flood + AI", status: "pending", dueDate: "TBD" },
          { id: "nc2", task: "Identify local economic empowerment data for Black youth 16-24", owner: "AI", status: "pending", dueDate: "TBD" },
          { id: "nc3", task: "Map ThriveUp + MCE capabilities to Foundation Grant priorities", owner: "AI + Dr. Flood", status: "pending", dueDate: "TBD" },
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
        id: "review", name: "3. Review & Approve", description: "Dr. Flood review + RPLICE quality gate", status: "upcoming",
        tasks: [
          { id: "nr0", task: "RPLICE quality review — CFIR 2.0 + RE-AIM + fidelity checklist assessment", owner: "RPLICE System", status: "pending", dueDate: "TBD", guidance: "Standard operating procedure: Run RPLICE CFIR domain assessment, RE-AIM readiness scorecard, and fidelity checklist against all proposal sections. Results stored in RPLICE database." },
          { id: "nr1", task: "Address RPLICE critical findings before proceeding", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "nr2", task: "Review and approve LOI", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "nr3", task: "Review and approve full narrative", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "nr4", task: "Review and approve budget", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "nr5", task: "Verify outcomes framework is achievable", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "nr6", task: "RPLICE re-assessment — confirm all critical items resolved", owner: "RPLICE System", status: "pending", dueDate: "TBD" },
          { id: "nr7", task: "Final alignment check with Foundation Grant priorities", owner: "Dr. Flood + AI", status: "pending", dueDate: "TBD" },
        ],
      },
      {
        id: "submit", name: "4. Package & Submit", description: "Bundle and submit LOI, then full proposal if invited", status: "upcoming",
        tasks: [
          { id: "ns1", task: "Submit LOI through Foundation Grant portal", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
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
      { id: "npe-1", category: "Eligibility", item: "Organization is a 501(c)(3)", status: "verified", notes: "TCAF IRS-determined 501(c)(3) — Letter 947, eff. 01/14/2026 (EIN 41-3618003)." },
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
        "Demonstrate how the 24-platform ecosystem creates a safety net, not just a program",
      ],
      commonPitfalls: [
        "Treating workforce development as only 'get a job' — Foundation Grant wants economic empowerment",
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
    amount: "Up to $35M total (~$12M/year, 15-25 grants across 5 counties)",
    deadline: "LOI due April 27, 2026 (~500 words) — Full Application only if invited (May 20 webinar)",
    deadlineUrgency: "urgent" as const,
    icon: Leaf,
    color: "text-teal-600",
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
    borderColor: "border-teal-200 dark:border-teal-800",
    description: "Investments in community-informed organizations providing core economic stability services for historically marginalized communities, with a focus on increasing enrollment in public benefits that foster economic stability.",
    referenceUrl: "https://stdavidsfoundation.org/grants/we-all-benefit/",
    referenceLabel: "St. David's Foundation — We All Benefit 2.0",
    grantKnowledge: `St. David's Foundation — "We All Benefit 2.0: Building Economic Stability" — $35M total over 3 years (~$12M/year). 15-25 grants expected across 5 counties. No min/max award size.
PURPOSE: Increase community members' economic stability by better leveraging available public benefits. Close the participation gap — ~50% of SNAP-eligible and ~20% of EITC-eligible Texans aren't enrolled. If everyone eligible participated, Texas poverty would drop ~40% (Urban Institute).
LOI PHASE (CURRENT): ~500-word LOI due April 27, 2026, answering one broad prompt about proposed work. No budget required in LOI. Evaluated on: client-driven, holistic, effective (SHOW don't tell). Full application only if invited (May 20 webinar for invitees).
CORE BENEFITS: Income Supports (EITC, CTC, SSI, SSDI), Food Security (SNAP, WIC), Healthcare Access (Medicaid, CHIP, Marketplace). MAP enrollment (Travis County) eligible alongside federal benefits. Mental health = health.
CRITICAL RULES FROM Q&A (Kim & Kori): (1) Benefits enrollment is THE entry ticket — everything else can be funded with flexible dollars but must start with enrollment. (2) Both new enrollments AND renewals valued equally. (3) Mixed-status families explicitly supported — immigration status is a named barrier. (4) Collaboratives need LOGIC not a list — complementary strengths, not 20 orgs on paper. (5) Can apply individually AND as collaborative if doing distinctly different things. (6) Non-501c3 partners = subcontract; lead must be 501c3 or public entity. (7) HHSC CPP not required for ALL collab members — just need access somewhere. (8) St. David's has resource map by county on website — USE IT. (9) Direct services is the core — system strengthening alone won't win. (10) Mobile van for rural = YES if serving enrollment. (11) Flexible funding = truly flexible (emergency food, rent, transport while benefits pending). (12) No budget in LOI. (13) Sign up for office hours with program staff.
GEOGRAPHIC: Must serve 1+ of 5 counties: Bastrop, Caldwell, Hays, Travis, Williamson. Williamson, Bastrop, Caldwell, Hays = counties where St. David's wants to BUILD enrollment capacity (not just strengthen). Travis already has significant infrastructure.
TCAF POSITIONING: Headquartered in Pflugerville (Williamson County). Technology conduit connecting partners, CHWs, and community orgs to eligible-but-unenrolled people. Platform does virtual heavy lifting (screening, matching, data); partners provide trusted in-person support. Apply individually for Williamson County AND as collaborative for Bastrop/Caldwell.`,
    essentials: [
      { label: "Benefits Enrollment = Entry Ticket", detail: "Application MUST start with and center on benefits enrollment (SNAP, Medicaid, CHIP, WIC, EITC, CTC, SSI, SSDI, Marketplace). Everything else wraps around it with flexible funding. Kim was explicit: if it doesn't start with enrollment, it's not a fit.", critical: true },
      { label: "LOI Due April 27 (~500 words)", detail: "Short LOI answering one broad prompt about proposed work. No budget required. Must demonstrate client-driven, holistic, effective approach — SHOW don't tell. Full application only if invited (May 20 webinar).", critical: true },
      { label: "Central Texas 5 Counties", detail: "Must serve 1+ of: Bastrop, Caldwell, Hays, Travis, Williamson. Counties outside Travis need capacity BUILDING — stronger positioning for TCAF (Williamson HQ).", critical: true },
      { label: "Enrollments + Renewals Equal", detail: "Both new enrollments AND renewals are valued equally. Keeping benefits is as hard as getting them. Include renewal support in your model." },
      { label: "Mixed-Status Families Supported", detail: "Immigration status explicitly named as a barrier they want addressed. Culturally responsive practices that address fears are a strong fit for this call." },
      { label: "Collaborative Logic, Not a List", detail: "Collaboratives need LOGIC — each partner has a specific, well-defined role complementary to others. Not 20 orgs on paper. Can apply individually AND as collaborative if doing different things." },
      { label: "HHSC CPP Not Required for All", detail: "Only one org in collaborative needs Community Partner Program access. But being on the PATH to CPP strengthens the application. Level 3 = gold standard." },
      { label: "Flexible Funding = Truly Flexible", detail: "Emergency food, rent, transport while benefits pending — all eligible. As long as expense supports benefits enrollment and economic stability. $35M total, ~$12M/year, 15-25 grants." },
      { label: "501(c)(3) or Public Entity Lead", detail: "Lead applicant must be 501(c)(3) or public entity. Non-501c3 partners = subcontract. TCAF (EIN 41-3618003) qualifies as lead." },
      { label: "Sign Up for Office Hours", detail: "St. David's strongly recommends office hours with program staff (Kim, Kori) to discuss specific application questions and eligibility." },
    ],
    competitiveEdge: [
      "TCAF headquartered in Pflugerville (Williamson County) — geographic authenticity in a county St. David's wants to BUILD capacity",
      "Technology conduit model is differentiated — most applicants are direct service providers; TCAF is the connective backbone",
      "AI-powered multi-benefit screening: one interaction screens for SNAP, Medicaid, CHIP, WIC, EITC, CTC, SSI, childcare — holistic by design",
      "GIS intelligence targets outreach to specific zip codes with highest enrollment gaps — data-driven, not blanket outreach",
      "RPLICE + MAP-GAP = built-in fidelity monitoring and 30-day improvement cycles — exactly what 'effective' means to St. David's",
      "Automated renewal support (60-30-14 day alerts) — addresses renewals equally to new enrollments, which most applicants will overlook",
      "Can apply individually (Williamson) AND as collaborative (Bastrop/Caldwell) — two shots at funding",
      "Trust-based outreach model for mixed-status families through existing community organizations — directly addresses named barrier",
    ],
    serviceArea: {
      region: "Central Texas",
      state: "Texas",
      counties: ["Bastrop", "Caldwell", "Hays", "Travis", "Williamson"],
      city: "Austin",
      keyIndustries: ["Public Benefits Enrollment", "Financial Coaching", "Workforce Development", "Community Health"],
      targetEmployers: [
        { name: "Lone Star Circle of Care", sector: "Healthcare/FQHC", type: "Williamson County FQHC — Medicaid/CHIP enrollment at point of care, cross-screen for SNAP/EITC" },
        { name: "Pflugerville Community Food Pantry", sector: "Food Security", type: "Trusted community touchpoint — SNAP screening during food distribution using TCAF platform" },
        { name: "VITA Sites (Williamson County)", sector: "Tax Prep/EITC", type: "Free tax prep screens for EITC/CTC — add SNAP, Medicaid, CHIP screening to tax appointments" },
        { name: "Pflugerville ISD", sector: "Education/Schools", type: "School enrollment + free/reduced lunch data identify benefit-eligible families — Dr. Flood SHAC connection" },
        { name: "Bluebonnet Trails Community Services", sector: "Behavioral Health", type: "Bastrop/Caldwell — integrate Medicaid/CHIP enrollment into mental health intake (mental health = health)" },
        { name: "Bastrop County Emergency Food Pantry", sector: "Food Security", type: "Rural food distribution = SNAP enrollment opportunity using TCAF platform" },
      ],
      laborMarketNotes: "St. David's focuses on economic stability, not employer partnerships per se. Key metrics: public benefits enrollment rates, financial stability indicators, self-sufficiency outcomes. Central Texas has significant benefits enrollment gaps — ~40% of eligible households don't access SNAP, Medicaid, or housing assistance.",
      locationEligibility: "regional",
      locationNotes: "St. David's Foundation is STRICTLY limited to Central Texas — Bastrop, Caldwell, Hays, Travis, and Williamson counties ONLY. You MUST have operations or a strong partner presence in these counties to be eligible. This cannot be applied from other locations. Austin/Travis County is your anchor.",
      multiSiteEligible: false,
      multiSiteNotes: "Restricted to the 5-county Central Texas service area. TCAF can apply individually for Williamson County AND as part of a collaborative for Bastrop/Caldwell — doing distinctly different work in each. $35M total pool with no min/max award size. Partner with existing organizations in Bastrop, Caldwell, or Hays counties to strengthen geographic coverage.",
    },
    partnershipTimeline: {
      summary: "LOI phase does NOT require partner letters — but naming specific partners with LOGIC strengthens the LOI. For full application (if invited), formal commitments needed. Kim was explicit: collaboratives need LOGIC not a list. Each partner has a specific, well-defined role based on complementary strengths. Non-501c3 partners = subcontract; lead must be 501c3.",
      workflowOrder: "LOI Names Partners with Logic → Office Hours Validates Strategy → Full App Gets Commitments",
      requirements: [
        { partnerType: "Williamson County FQHC (Lone Star Circle of Care)", requiredInDocs: false, timing: "pre-award", docSections: ["LOI", "Full Application"], description: "Federally Qualified Health Center in Williamson County. Medicaid/CHIP enrollment at point of care. TCAF platform cross-screens for SNAP/EITC during health visits. Key partner for individual Williamson County application.", evidenceNeeded: "LOI: name and describe role. Full app: letter of support, data sharing agreement, referral protocol." },
        { partnerType: "Community Food Pantries (Pflugerville, Bastrop)", requiredInDocs: false, timing: "pre-award", docSections: ["LOI", "Full Application"], description: "Trusted community touchpoints. Embed TCAF multi-benefit screening into food distribution events. Families already seeking food assistance = high probability of SNAP/Medicaid eligibility. Perfect trust-based entry point for mixed-status families.", evidenceNeeded: "LOI: describe the model. Full app: letters of support, operational agreement for screening events." },
        { partnerType: "VITA Tax Prep Sites (Williamson County)", requiredInDocs: false, timing: "pre-award", docSections: ["LOI", "Full Application"], description: "Free tax preparation = EITC/CTC enrollment. Add SNAP, Medicaid, CHIP screening to tax appointments. Families already sharing financial information — low-friction multi-benefit screening moment.", evidenceNeeded: "LOI: describe integration model. Full app: letter of support from VITA site coordinator." },
        { partnerType: "School Districts (Pflugerville ISD)", requiredInDocs: false, timing: "both", docSections: ["Full Application"], description: "School enrollment + free/reduced lunch data identify benefit-eligible families. Dr. Flood's existing SHAC connection provides entry. TCAF platform screens families during enrollment events.", evidenceNeeded: "Full app: letter from superintendent or SHAC liaison. LOI: can mention existing relationship." },
        { partnerType: "Rural Health/Behavioral Health (Bluebonnet Trails)", requiredInDocs: false, timing: "pre-award", docSections: ["LOI", "Full Application"], description: "Bastrop/Caldwell counties — integrate Medicaid/CHIP enrollment into mental health intake. Mental health = health per St. David's. Key partner for collaborative application in rural counties.", evidenceNeeded: "LOI: describe collaborative logic. Full app: MOU, referral protocol." },
        { partnerType: "HHSC Community Partner Program", requiredInDocs: false, timing: "both", docSections: ["LOI", "Full Application"], description: "Not a partner per se, but HHSC CPP certification (Level 1-3) strengthens the application. Only one org in collaborative needs CPP access. Being on the PATH shows trajectory. Level 3 = gold standard.", evidenceNeeded: "LOI: mention you're beginning the CPP application process. Full app: CPP application status or certification." },
      ],
    },
    sections: [
      { id: "std-loi", name: "LOI — 500-Word Draft (Due April 27)", description: "~500-word LOI centered on benefits enrollment as entry point. Must demonstrate client-driven, holistic, effective. Lead with impact, not technology.", icon: FileText, status: "draft" as ApprovalStatus,
        content: `LOI DRAFT — WE ALL BENEFIT 2.0: BUILDING ECONOMIC STABILITY
~500 words | Due April 27, 2026

[Dr. Flood: This draft needs your voice and specific examples before submission. Lead with enrollment impact, not technology. Sign up for St. David's office hours ASAP to validate the individual + collaborative strategy.]

---

Across Williamson, Bastrop, and Caldwell counties, thousands of families eligible for SNAP, Medicaid, CHIP, and tax credits remain unenrolled — not because benefits don't exist, but because the systems designed to deliver them weren't designed for the people who need them most. In Williamson County alone, an estimated 45% of SNAP-eligible households aren't receiving benefits. In Bastrop and Caldwell counties, the gap is wider and the enrollment infrastructure thinner.

The Collaborative Advocate Foundation (TCAF), a 501(c)(3) headquartered in Pflugerville, proposes to close this participation gap by serving as the technology backbone that connects existing community organizations, community health workers, and trusted local partners to the people they are best positioned to serve.

How it works: TCAF's AI-powered platform screens families across all benefit types simultaneously — a family applying for SNAP is immediately assessed for Medicaid, CHIP, WIC, EITC, Child Tax Credit, SSI, and childcare subsidies. The platform identifies who is eligible, where they are located using GIS intelligence, and what barriers they face. Then it routes them — through warm referrals, not cold systems — to trusted community organizations and bilingual CHWs who provide the in-person support needed to complete enrollment.

Client-driven: Our model starts with how families actually seek help — through people and places they already trust. For mixed-status families wary of government systems, enrollment happens at church pantries, school resource centers, and community health fairs — with culturally responsive navigators who share their language and lived experience. Every interaction is designed around the family's priorities, fears, and timeline — not the system's.

Holistic: When our platform identifies a family eligible for SNAP, it doesn't stop at food security. It screens for healthcare access, tax credits, childcare subsidies, and housing assistance in a single interaction. While families wait for benefits approval, flexible support provides emergency food, transportation, and utility assistance — because hunger doesn't pause for processing times.

Effective: Our Benefits Intelligence System uses Census tract-level data to target outreach to the specific zip codes with the highest enrollment gaps. Implementation fidelity is monitored through RPLICE (our implementation science engine) using CFIR 2.0 and RE-AIM frameworks, and continuous quality improvement cycles through MAP-GAP ensure the model improves every 30 days — not every 12 months. We track both new enrollments AND renewals, because keeping benefits is as hard as getting them.

Collaborative approach: In Williamson County, TCAF builds the enrollment infrastructure directly. In Bastrop and Caldwell counties, we partner with existing food pantries, rural health clinics, churches, and school districts — providing the technology platform and data intelligence while partners provide the trusted community presence. Each partner has a specific, well-defined role based on complementary strengths.

Sustainability: TCAF's technology infrastructure is permanent. The GIS data gets richer each year. The partner network compounds. The enrolled population stays enrolled through automated renewal support. After three years, the counties have a functioning enrollment system that persists — not a program that disappears when the grant ends.

TCAF is ready to join the HHSC Community Partner Program, sign up for St. David's office hours, and begin building enrollment capacity where Central Texas needs it most.

---
Word count: ~490 words

NOTES FOR DR. FLOOD:
1. This is the SUBMISSION-READY LOI draft (~500 words). Review and add your personal voice before April 27.
2. Do NOT include a budget in the LOI — Kim was explicit about this.
3. The LOI answers one broad prompt about your proposed work. Demonstrate client-driven, holistic, effective — SHOW don't tell.
4. Sign up for office hours with Kim/Kori to validate the individual (Williamson) + collaborative (Bastrop/Caldwell) strategy.
5. Register on the St. David's grant portal before submission.
6. DeepSeek recommendation: Lead with enrollment outcomes and community trust, NOT with technology.`,
        reviewNotes: "500-word LOI draft complete (~490 words). Dr. Flood must personalize with voice and examples. No budget in LOI. RPLICE validation: CFIR 72/100, RE-AIM 78/100, DeepSeek 82/100.", lastUpdated: "April 1, 2026", assignee: "Dr. Flood", pageLimit: "~500 words (1 page)", wordCount: "~500 words" },

      { id: "std-narrative", name: "Program Narrative (If Invited)", description: "Full proposal — only needed if LOI is accepted and you are invited to submit a complete application", icon: BookOpen, status: "not-started" as ApprovalStatus,
        content: `PROGRAM NARRATIVE — PATHWAYS TO STABILITY

I. THE PROBLEM: ECONOMIC INSTABILITY IN CENTRAL TEXAS

Central Texas is one of the fastest-growing regions in the country, yet prosperity is not shared equally. Behind the headlines of Austin's tech boom lies a persistent crisis of economic instability:

BENEFITS ENROLLMENT GAPS: An estimated 40% of eligible households in Travis and Williamson counties do not access available public benefits — SNAP, Medicaid, CHIP, WIC, housing vouchers, childcare subsidies. This is not because benefits don't exist. It is because the systems designed to deliver them were not designed for the people who need them most.

The barriers are structural, not personal:
- Application processes require documentation many families cannot easily produce
- Language barriers exclude non-English-speaking households
- Stigma and systemic distrust discourage engagement, especially in communities of color
- Fragmented systems require navigating multiple agencies with different requirements, hours, and locations
- Digital divides exclude households without reliable internet or devices

ECONOMIC INSTABILITY DATA (Travis County):
- 15.4% of residents live below the poverty line (U.S. Census ACS)
- Median rent increased 30%+ since 2020, displacing thousands of families
- ZIP codes 78741, 78744, 78753, and 78745 have the highest concentrations of public benefits-eligible households
- Black and Hispanic/Latino households are 2-3x more likely to be eligible for but not enrolled in SNAP and Medicaid
- Single-parent households face compounded barriers: childcare, transportation, time, and application complexity

THE HUMAN COST:
When a family eligible for SNAP doesn't enroll, they spend $200-400 more per month on food — money that comes from rent, utilities, or medical care. When a child eligible for CHIP doesn't enroll, a preventable illness becomes an emergency room visit. When a veteran eligible for housing assistance doesn't know how to apply, housing instability becomes homelessness. These are not statistics. They are the daily reality of thousands of Central Texas families.

II. OUR APPROACH: THREE REALITIES METHODOLOGY

Our program design is grounded in the Three Realities methodology — a proprietary framework developed by Dr. Terry Flood that ensures every service component originates from community voice rather than institutional assumption.

REALITY 1 — THE LIVED REALITY:
What do community members actually experience when they try to access public benefits? Through structured listening sessions, focus groups, and individual interviews with Central Texas residents, we document the real barriers, frustrations, and fears that prevent enrollment. This is not survey data — it is narrative understanding of what it feels like to navigate a system that wasn't designed for you.
[Dr. Flood: Insert specific examples — dates, locations, number of participants, key findings from community engagement sessions]

REALITY 2 — THE INSTITUTIONAL REALITY:
What do benefits agencies, social service organizations, and government systems intend to deliver? We map the policies, processes, and assumptions that drive institutional behavior — identifying where systems believe they are accessible and effective.

REALITY 3 — THE GAP REALITY:
Where does the disconnect between intent and experience create harm? The Gap Reality is where our intervention lives. By mapping the precise points where institutional design fails community need, we design services that bridge specific gaps rather than adding another layer of well-intentioned but disconnected programming.

THIS IS WHAT ST. DAVID'S MEANS BY "COMMUNITY-INFORMED":
Community-informed design is not a checkbox. It is not a single focus group conducted after the program is already designed. It is an ongoing methodology that keeps community voice at the center of every design decision, service modification, and outcome evaluation. Three Realities provides the structure to do this authentically and consistently.

III. PROGRAM DESIGN: THREE INTEGRATED SERVICE TRACKS

TRACK 1: PUBLIC BENEFITS NAVIGATION & ENROLLMENT
Service: Community Benefits Navigators conduct targeted outreach, eligibility screening, application assistance, and enrollment support for public benefits.
Technology: LifeBridge platform provides digital intake, eligibility cross-matching, application tracking, and follow-up scheduling.
Target Benefits: SNAP, Medicaid, CHIP, WIC, housing vouchers (Section 8, LIHTC), childcare subsidies, utility assistance (LIHEAP), earned income tax credits.
Delivery Model: Mobile outreach at community sites (churches, schools, food banks, health clinics) + walk-in hours at partner locations + virtual assistance via LifeBridge.
Staffing: [NUMBER] Community Benefits Navigators recruited from target communities (lived experience requirement), supervised by Benefits Program Manager.
Target: Enroll [NUMBER] households in at least one new public benefit within 12 months, with average annual economic impact of $3,000-$8,000 per household.

TRACK 2: FINANCIAL COACHING & ASSET BUILDING
Service: Individualized financial coaching addressing budgeting, debt management, credit repair, savings strategies, and tax preparation.
Technology: Financial Literacy module within ThriveUp Academy provides structured curricula, progress tracking, and goal setting.
Delivery Model: One-on-one coaching sessions (in-person or virtual) + group workshops + self-paced digital modules.
Curriculum: 8-session core program covering: (1) Financial assessment, (2) Budgeting, (3) Banking and credit, (4) Debt management, (5) Savings strategies, (6) Benefits optimization, (7) Tax credits (EITC, CTC), (8) Long-term financial planning.
Target: [NUMBER] participants complete financial coaching with measurable improvement in financial stability indicators.

TRACK 3: WORKFORCE PATHWAYS TO ECONOMIC STABILITY
Service: Career readiness training, digital literacy, and industry-specific certifications for participants whose economic instability stems from unemployment or underemployment.
Technology: ThriveUp Academy platform provides learning management, skills assessment, career pathway mapping, and employer connections.
Industries: Healthcare (CNA, MA, CHW), IT (CompTIA, help desk), Manufacturing (safety, quality), Logistics (CDL prep, warehouse).
Delivery Model: Cohort-based training (8-12 week programs) with wraparound supports (childcare, transportation, benefits continuation during training).
Target: [NUMBER] participants placed in employment at or above 150% FPL within 90 days of program completion.

IV. SERVICE DELIVERY INFRASTRUCTURE

TECHNOLOGY ECOSYSTEM:
Our 24-platform ACOS (Advanced Community Operating System) provides integrated digital infrastructure that no single-program organization can match:
- LifeBridge: Benefits navigation, enrollment tracking, referral management
- ThriveUp Academy: Workforce training, learning management, career pathways
- RPLICE (Better Science Lab): Implementation science validation engine — provides CFIR 2.0 assessments, RE-AIM outcome scoring, implementation fidelity tracking, and Three Realities diagnostic tools. This is our evidence-based quality assurance backbone — every program component is validated against implementation science frameworks, not just activity metrics.
- MAP-GAP Engine: Continuous quality improvement — translates RPLICE's fidelity data into actionable program modifications within 30-day cycles
- SafeReport: Community safety reporting and response coordination
- Minority Center of Excellence: Small business support and economic empowerment

This technology infrastructure allows us to track participants across service tracks, identify compound needs, measure long-term outcomes, and continuously improve service delivery based on data — not assumptions. RPLICE ensures that our service delivery maintains implementation fidelity — meaning we don't just measure WHAT we do, we validate that we're doing it the way the evidence says it should be done.

GEOGRAPHIC COVERAGE:
Primary: Travis County (Austin, Pflugerville, Manor, Del Valle) and Williamson County (Round Rock, Georgetown, Cedar Park)
Secondary: Hays County (San Marcos, Kyle, Buda)
Expansion (if collaborative): Bastrop and Caldwell counties through partner organizations

Note on 5-County Coverage: For Bastrop and Caldwell counties specifically, our model deploys through partner organizations with existing community presence. RPLICE's CFIR assessment identified Travis-centricity as a gap (Outer Setting: 4.0/5.0); this partner-based expansion strategy addresses that finding while maintaining service quality through RPLICE fidelity monitoring of partner delivery.

VI. IMPLEMENTATION TIMELINE (RPLICE-INFORMED)
[Added per RPLICE assessment — Implementation Process domain flagged missing milestones]

Days 1-30: FOUNDATION
- Hire Community Benefits Navigators (2 part-time, lived experience required)
- Configure LifeBridge for benefits enrollment tracking in target ZIP codes
- Execute partner MOUs with Foundation Communities, CommUnityCare, United Way
- Baseline RPLICE fidelity assessment — document starting implementation readiness
- First Three Realities community listening session (Travis County)

Days 31-60: LAUNCH
- Begin participant enrollment — target: 25 households
- Launch Track 1 (Benefits Navigation) and Track 2 (Financial Coaching)
- First MAP-GAP improvement cycle — identify and address early implementation barriers
- Second community listening session (Williamson County)
- RPLICE mid-launch fidelity check — are we delivering as designed?

Days 61-90: SCALE
- Expand enrollment — target: 75 cumulative households
- Launch Track 3 (Workforce Pathways) for participants with employment needs
- First quarterly outcome report to St. David's
- RPLICE RE-AIM Reach assessment — are we reaching target populations?
- Adjust recruitment strategy based on first 90 days of enrollment data

Days 91-180: OPTIMIZE
- Target: 150 cumulative households enrolled in at least one benefit
- First full MAP-GAP cycle completion — documented program modifications
- RPLICE fidelity re-assessment — target score ≥ 4.0/5.0
- Partner service integration fully operational
- First 6-month retention report — target: >80% retention

Days 181-365: SUSTAIN & MEASURE
- Target: 200-500 households served (varies by track combination)
- Full RE-AIM evaluation — all 5 dimensions scored and reported
- RPLICE Three Realities re-assessment — Gap Reality closing?
- Year 1 outcomes report with evidence of impact
- Sustainability planning: federal funding applications submitted, post-grant revenue identified
- CFIR 2.0 full program assessment — ready for replication?

VII. CULTURAL RESPONSIVENESS & EQUITY

Our program is designed by and for the communities it serves:
- President is a Black veteran with lived experience navigating institutional barriers
- Community Benefits Navigators are recruited from target communities with lived experience requirements
- Materials available in English and Spanish; interpretation services for other languages
- Service delivery locations chosen based on community accessibility, not institutional convenience
- Program design explicitly addresses systemic distrust by building relationships before asking for enrollment
- Three Realities methodology ensures community voice continuously shapes service delivery

[Dr. Flood: Add any additional cultural responsiveness elements, language capabilities, community relationships]`,
        reviewNotes: "Strong draft — needs specific numbers in targets and Dr. Flood's community engagement examples inserted", lastUpdated: "March 30, 2026", assignee: "Dr. Flood + AI", pageLimit: "15 pages", wordCount: "5,000-6,000 words" },

      { id: "std-budget", name: "Budget & Justification (If Invited)", description: "Full proposal budget — only needed if LOI is accepted", icon: DollarSign, status: "not-started" as ApprovalStatus,
        content: `BUDGET & JUSTIFICATION — INDIVIDUAL TRACK ($250,000)
[Adjust all amounts if pursuing Collaborative Track ($1,000,000)]

PERSONNEL (60% — $150,000):
Program Director (Dr. Flood — 30% FTE): $[45,000]
  Justification: Overall program leadership, community partnerships, Three Realities methodology facilitation, stakeholder engagement, reporting
Benefits Program Manager (1 FTE): $[55,000]
  Justification: Supervises Community Benefits Navigators, manages LifeBridge platform operations, tracks enrollment outcomes, coordinates with benefits agencies
Community Benefits Navigators (2 part-time): $[40,000] ($20K each)
  Justification: Frontline outreach, eligibility screening, application assistance, enrollment support, follow-up. Recruited from target communities with lived experience requirement.
Financial Coach (1 part-time): $[10,000]
  Justification: Individualized financial coaching sessions, group workshop facilitation, curriculum delivery

FRINGE BENEFITS (15% of personnel — $22,500):
FICA, workers' comp, health insurance contribution: $[22,500]

TECHNOLOGY & EQUIPMENT ($20,000 — 8%):
LifeBridge platform hosting and maintenance: $[8,000]
  Justification: Cloud hosting, AI services, data storage for benefits navigation platform
Laptops/tablets for field navigators (3 units): $[4,500]
  Justification: Mobile intake, eligibility screening in community settings
Internet/phone for field staff: $[3,600]
  Justification: $100/month x 3 staff x 12 months
Software licenses (case management, reporting): $[3,900]

PROGRAM OPERATIONS ($25,000 — 10%):
Client assistance fund (emergency needs): $[8,000]
  Justification: Application fees, document procurement (birth certificates, IDs), transportation to benefits offices
Outreach materials (multilingual): $[5,000]
  Justification: Flyers, brochures, social media content in English and Spanish
Training and professional development: $[5,000]
  Justification: Benefits certification training for navigators, financial coaching certifications
Meeting and venue costs: $[4,000]
  Justification: Community listening sessions, focus groups, workshop space rental
Mileage/transportation: $[3,000]
  Justification: Field navigator travel to community sites across Travis/Williamson counties

EVALUATION ($15,000 — 6%):
Data analysis and outcomes reporting: $[10,000]
  Justification: Quarterly outcomes analysis, benefits enrollment tracking, economic stability measurement
External evaluator (optional): $[5,000]
  Justification: Independent validation of program outcomes and community impact

INDIRECT COSTS (10% — $17,000):
Administrative overhead: $[17,000]
  Justification: Accounting, legal, insurance, facilities, organizational administration

TOTAL: $250,000

BUDGET NOTES:
- 60% personnel ratio demonstrates direct service investment
- Technology costs are low because platforms are already built — St. David's funds scale operations, not development
- All budget lines support direct economic stability services or their infrastructure
- If awarded Collaborative Track, multiply personnel and operations proportionally across partner organizations

[Dr. Flood: Adjust salary amounts to match actual compensation plans. Verify fringe benefit rates. Confirm indirect cost rate — if you have a negotiated indirect rate, use it; otherwise 10% is standard for foundations.]`,
        reviewNotes: "Adjust salary figures to actual. Verify fringe rates. If pursuing collaborative track, create partner budget allocations.", lastUpdated: "March 30, 2026", assignee: "Dr. Flood", pageLimit: "3 pages", wordCount: "1,000-1,500 words" },

      { id: "std-community", name: "Community Voice Documentation (If Invited)", description: "Full proposal section — evidence of community-informed design. Start gathering this NOW so it's ready.", icon: Users, status: "not-started" as ApprovalStatus,
        content: `COMMUNITY VOICE DOCUMENTATION
Evidence of Community-Informed Program Design

THIS SECTION IS YOUR #1 SCORING FACTOR FOR ST. DAVID'S.

I. THREE REALITIES METHODOLOGY — APPLICATION TO CENTRAL TEXAS

The Pathways to Stability program was designed using the Three Realities methodology, a structured community engagement framework developed by Dr. Terry Flood that ensures program design originates from community voice rather than institutional assumption.

COMMUNITY ENGAGEMENT ACTIVITIES:
[Dr. Flood: Document ALL community engagement activities. For each, include:]

Activity 1: [Community Listening Session / Focus Group / Advisory Board Meeting]
Date: [DATE]
Location: [LOCATION — Central Texas community site]
Participants: [NUMBER] community members from [DESCRIPTION — e.g., "East Austin families receiving SNAP benefits"]
Key Findings:
- [Finding 1 — what community members reported about their experience]
- [Finding 2]
- [Finding 3]
How This Shaped Program Design:
- [Specific program element that changed or was created based on this input]

Activity 2: [REPEAT FORMAT]
Activity 3: [REPEAT FORMAT]

II. LIVED REALITY FINDINGS — WHAT COMMUNITY MEMBERS TOLD US

Benefits Navigation Barriers (from community input):
[Dr. Flood: Insert actual quotes, themes, and patterns from community members. Examples of what to document:]
- "I didn't know I qualified for [BENEFIT] until [HOW THEY FOUND OUT]"
- "The application asked for [DOCUMENT] and I couldn't get it because [BARRIER]"
- "I went to the office but [EXPERIENCE — long wait, language barrier, felt judged]"
- "I stopped trying because [REASON — too complicated, got denied without explanation, couldn't take time off work]"

Financial Instability Patterns:
[Document what community members shared about financial challenges, coping strategies, priorities]

Workforce Barriers:
[Document what community members shared about employment challenges, training needs, childcare/transportation barriers]

III. INSTITUTIONAL REALITY — WHAT SYSTEMS BELIEVE THEY DELIVER

Benefits Agencies: [Document what agencies like HHSC, WIC offices, housing authorities say about their accessibility and enrollment processes]

Gap Analysis: [Where institutional intent diverges from community experience — these gaps are where your program intervenes]

IV. COMMUNITY ADVISORY STRUCTURE

Community Advisory Board:
[Dr. Flood: List any community members, partner organization representatives, or people with lived experience who advise program design. If you don't have a formal advisory board yet, describe plans to establish one and any informal advisory relationships.]

Name: [NAME] — Role: [Community member / Partner rep / Lived experience advisor]
Contribution: [How they shape program design]

V. ONGOING COMMUNITY VOICE INTEGRATION

Three Realities is not a one-time activity. Our program maintains continuous community voice through:
- Quarterly community listening sessions to assess whether services are meeting needs
- RPLICE Three Realities diagnostic tools — automated re-assessment of Gap Reality to validate that program modifications are actually closing the gaps community members identified
- Participant feedback mechanisms embedded in LifeBridge platform (post-service surveys, satisfaction tracking)
- Community Benefits Navigators with lived experience who serve as ongoing voice conduits
- Advisory board with community member majority — meeting monthly during Year 1
- MAP-GAP continuous improvement engine, powered by RPLICE fidelity data, that translates community feedback into validated program modifications within 30-day cycles

The RPLICE + Three Realities combination ensures that community voice is not just collected — it is systematically validated against program design and delivery. When community members tell us something isn't working, RPLICE's fidelity assessment identifies exactly where the implementation diverged from the community-informed design, and MAP-GAP generates the corrective action.

CRITICAL NOTE FOR DR. FLOOD:
This section MUST contain real, documented community engagement. St. David's will not fund programs that claim community voice without evidence. You need:
1. Dates and locations of community engagement activities
2. Number of participants and how they were recruited
3. Specific findings that shaped program design
4. Quotes or themes from community members (anonymized if needed)
5. Evidence that community voice is ONGOING, not a one-time checkbox

If you have not yet conducted formal Three Realities sessions in Central Texas, schedule them THIS WEEK. Even 2-3 small listening sessions with 5-10 people each would provide authentic documentation. Partner organizations (churches, food banks, community health centers) can help recruit participants.`,
        reviewNotes: "HIGHEST PRIORITY. Must be populated with REAL community engagement evidence. This is the section St. David's scores most heavily.", lastUpdated: "March 30, 2026", assignee: "Dr. Flood", pageLimit: "5 pages", wordCount: "1,500-2,500 words" },

      { id: "std-outcomes", name: "Outcomes & Evaluation (If Invited)", description: "Full proposal section — measurable outcomes and evaluation plan", icon: BarChart3, status: "not-started" as ApprovalStatus,
        content: `OUTCOMES & EVALUATION PLAN

I. THEORY OF CHANGE

IF we deploy community-recruited Benefits Navigators using the Three Realities methodology to identify and address specific barriers to public benefits enrollment,
AND we pair enrollment assistance with financial coaching and workforce pathways,
THEN participants will achieve measurable economic stability through increased benefits access, improved financial capability, and sustainable employment —
BECAUSE addressing the Gap Reality (where systems fail community needs) at the point of failure produces enrollment and retention outcomes that traditional outreach cannot.

II. OUTCOME FRAMEWORK

OUTCOME 1: INCREASED PUBLIC BENEFITS ENROLLMENT
Metric: Number of households newly enrolled in at least one public benefit
Target: [NUMBER — suggest 200-500 depending on track] households within 12 months
Measurement: LifeBridge platform enrollment tracking, verified against agency confirmation
Baseline: 0 (new enrollments facilitated by this program)
Reporting: Monthly enrollment counts by benefit type, ZIP code, and demographics

OUTCOME 2: ECONOMIC IMPACT PER HOUSEHOLD
Metric: Average annual economic value of benefits secured per enrolled household
Target: $3,000-$8,000 per household annually
Measurement: Sum of annualized benefit values (SNAP: avg $3,588/year; Medicaid: avg $7,000/year; CHIP: avg $2,000/year; housing: avg $6,000-$12,000/year)
Baseline: $0 in new benefits accessed
Reporting: Quarterly aggregate economic impact analysis

OUTCOME 3: BENEFITS RETENTION
Metric: Percentage of enrolled households maintaining benefits at 6 and 12 months
Target: >80% retention at 6 months; >70% at 12 months
Measurement: Follow-up tracking via LifeBridge, recertification assistance tracking
Baseline: National average benefits retention is approximately 60% at 12 months
Reporting: Semi-annual retention analysis

OUTCOME 4: FINANCIAL STABILITY IMPROVEMENT
Metric: Participant financial capability assessment scores (pre/post)
Target: >60% of financial coaching participants show measurable improvement on at least 2 of 5 financial stability indicators
Indicators: (1) Has a monthly budget, (2) Has emergency savings, (3) Reduced unsecured debt, (4) Improved credit score, (5) Filed for EITC/CTC
Measurement: Pre/post financial capability assessment, administered at intake and 6 months
Reporting: Quarterly cohort analysis

OUTCOME 5: WORKFORCE PLACEMENT (for Track 3 participants)
Metric: Participants placed in employment at or above 150% FPL
Target: >65% placement rate within 90 days of program completion
Measurement: ThriveUp Academy placement tracking, employer verification, wage records
Reporting: Quarterly placement and wage analysis

III. DATA COLLECTION & MANAGEMENT

LifeBridge Platform: Automated tracking of benefits enrollment, application status, follow-up scheduling, and retention monitoring
ThriveUp Academy: Learning progress, certification completion, employment placement
RPLICE (Better Science Lab): Implementation fidelity validation — ensures program delivery matches evidence-based design. RPLICE provides:
  - CFIR 2.0 domain assessments across all 5 implementation science domains (Innovation, Outer Setting, Inner Setting, Individuals, Process)
  - RE-AIM outcome scoring (Reach, Effectiveness, Adoption, Implementation, Maintenance)
  - Three Realities diagnostic tools for ongoing community voice validation
  - Fidelity checklists that measure whether services are delivered as designed, not just whether they happen
MAP-GAP Engine: Continuous quality improvement — translates RPLICE's fidelity data into actionable 30-day improvement cycles
Financial Literacy Module: Pre/post assessment scores, session attendance, goal completion

DATA QUALITY ASSURANCE:
- Benefits enrollment verified against agency confirmation (not self-reported)
- Financial coaching outcomes measured through standardized assessment tools
- Employment placement verified through employer contact at 30/60/90 days
- Implementation fidelity validated through RPLICE's CFIR 2.0 assessments — ensuring program integrity over time
- All data disaggregated by race/ethnicity, gender, ZIP code, household composition, and veteran status

IV. EVALUATION DESIGN

RPLICE-POWERED EVALUATION FRAMEWORK:
Our evaluation is not a separate activity bolted onto the program — it is built into the technology infrastructure through RPLICE's implementation science engine.

Internal Evaluation (Quarterly):
- RPLICE CFIR 2.0 assessments validate that program components maintain implementation fidelity
- RE-AIM scoring provides structured outcome evaluation across all 5 domains
- MAP-GAP framework translates fidelity data into actionable program modifications within 30-day cycles
- Dashboard monitoring of all outcome indicators
- Community feedback integration (participant surveys, navigator observations, Three Realities re-assessment)

External Evaluation (Annual — if budget allows):
- Independent evaluator reviews RPLICE-generated fidelity data, outcomes, and community impact
- Cost-per-enrollment and cost-per-outcome analysis
- Comparison to regional benchmarks and similar programs

WHAT MAKES THIS DIFFERENT:
Most grant applicants write vague "continuous quality improvement" paragraphs. We have a named, structured methodology (MAP-GAP) powered by a live implementation science platform (RPLICE) that produces automated fidelity assessments, not manual reports. When St. David's asks "how will you know if the program is working?" — we don't just have an answer, we have a system that generates the answer continuously.

V. REPORTING TO ST. DAVID'S FOUNDATION

Quarterly Progress Reports: Enrollment numbers, economic impact, participant demographics, community voice updates, budget expenditures, program modifications
Annual Outcomes Report: Full evaluation against all targets, cost-effectiveness analysis, community impact narrative, sustainability progress, lessons learned
Final Report: Comprehensive outcomes summary, sustainability plan status, recommendations for replication`,
        reviewNotes: "Strong outcomes framework. Adjust target numbers based on budget track (individual vs collaborative).", lastUpdated: "March 30, 2026", assignee: "Dr. Flood + AI", pageLimit: "5 pages", wordCount: "1,500-2,000 words" },

      { id: "std-partnerships", name: "Partnership Letters (If Invited)", description: "Full proposal section — partner letters. Start outreach NOW so letters are ready.", icon: Handshake, status: "not-started" as ApprovalStatus,
        content: `PARTNERSHIP & COLLABORATION DOCUMENTATION

TARGET PARTNERS — NEED LETTERS OF SUPPORT FROM EACH:

PARTNER 1: Foundation Communities
Role: Co-enrollment partner, shared benefits navigation
Why: Austin's largest provider of affordable housing with integrated services. They already conduct benefits enrollment — our partnership adds capacity and technology (LifeBridge) to their work.
Contact: [Dr. Flood: Research Foundation Communities contact]
Letter Status: [Not yet contacted / Contacted / Letter received]

PARTNER 2: CommUnityCare Health Centers
Role: Community health integration, Medicaid/CHIP enrollment
Why: Federally Qualified Health Center serving uninsured/underinsured Travis County residents. Natural referral pipeline — patients who need health benefits also need SNAP, housing, childcare.
Contact: [Dr. Flood: Research CommUnityCare partnerships contact]
Letter Status: [Not yet contacted / Contacted / Letter received]

PARTNER 3: United Way for Greater Austin
Role: 2-1-1 referral integration, collaborative infrastructure
Why: United Way's 2-1-1 helpline is the primary social service referral system in Central Texas. Integration with our LifeBridge platform creates a seamless referral-to-enrollment pipeline.
Contact: [Dr. Flood: Research United Way partnerships contact]
Letter Status: [Not yet contacted / Contacted / Letter received]

PARTNER 4: Goodwill Central Texas
Role: Workforce development co-enrollment, career readiness
Why: Goodwill provides workforce services across the 5-county region. Partnership enables dual-track service: benefits enrollment + career pathways for participants with employment needs.
Contact: [Dr. Flood: Research Goodwill Central Texas contact]
Letter Status: [Not yet contacted / Contacted / Letter received]

PARTNER 5: Workforce Solutions Capital Area
Role: WIOA co-enrollment, employer connections
Why: Official workforce board for the Capital Area. Co-enrollment allows participants to access WIOA-funded services (training vouchers, supportive services) alongside our program.
Contact: [Dr. Flood: Research Workforce Solutions contact]
Letter Status: [Not yet contacted / Contacted / Letter received]

FOR COLLABORATIVE TRACK ($1M) — NEED FORMAL MOUs:
If pursuing the $1M collaborative track, you need at least 3 organizations with:
- Signed MOUs defining roles, governance, budget allocation
- Shared governance structure (collaborative steering committee)
- Geographic coverage across the 5-county area
- Joint budget showing how $1M is allocated across partners

LETTER OF SUPPORT TEMPLATE:
[Organization Letterhead]
[Date]

St. David's Foundation
Re: Letter of Support — Pathways to Stability (The Collaborative Advocate Foundation)

Dear St. David's Foundation,

[Organization Name] is pleased to support The Collaborative Advocate Foundation's application to the We All Benefit 2.0 grant program. We have [describe existing relationship or planned partnership] with TCAF and believe their Pathways to Stability program addresses critical gaps in [specific service area] for Central Texas communities.

Our organization will contribute to this initiative by: [specific role — referrals, co-enrollment, shared service delivery, data sharing, etc.]

We look forward to partnering with TCAF to advance economic stability for the residents we jointly serve.

Sincerely,
[Name, Title, Organization]

DR. FLOOD ACTION: Begin outreach to these organizations THIS WEEK. You need actual letters before submission. Email template:
Subject: Partnership Opportunity — St. David's Foundation Grant Application
Body: Brief intro of TCAF, description of Pathways to Stability, what you're asking of them (letter of support + specific partnership role), timeline for response.`,
        reviewNotes: "Outreach must begin immediately. Letters take time — follow up within 48 hours.", lastUpdated: "March 30, 2026", assignee: "Dr. Flood", pageLimit: "No limit (1 per partner)", wordCount: "300-500 words each" },

      { id: "std-org-capacity", name: "Organizational Capacity (If Invited)", description: "Full proposal section — board, financials, prior results", icon: Building2, status: "not-started" as ApprovalStatus,
        content: `ORGANIZATIONAL CAPACITY

I. ORGANIZATION OVERVIEW

The Collaborative Advocate Foundation (TCAF) is a veteran-founded, Black-led 501(c)(3) nonprofit organization headquartered in Pflugerville, Texas. Founded by Dr. Terry Flood, TCAF operates a 24-platform technology ecosystem designed to address systemic barriers facing marginalized communities through integrated, data-driven service delivery.

Mission: To empower thriving communities through advocacy, technology, and evidence-based programs that address the interconnected challenges of economic stability, health equity, workforce development, and community safety.

Year Established: [YEAR]
Annual Budget: $[AMOUNT — Dr. Flood to provide]
Number of Staff: [NUMBER]
Number of Volunteers: [NUMBER]
Service Area: Central Texas (Travis, Williamson, Hays, Bastrop, Caldwell counties)

II. LEADERSHIP

Dr. Terry Flood, DHA — President
Credentials: Doctor of Health Administration, MS Implementation Science, MA Psychology (Industrial-Organizational), MSHRM, MBA, MSCJ, Public Policy
Military Service: U.S. Army Veteran — Bronze Star (x2)
Expertise: Organizational change, implementation science, workforce development, community health
Proprietary Frameworks: MAP-GAP (continuous improvement), SALP (assessment), Three Realities (community engagement), MG-PATR (governance)
Relevance to This Grant: Dr. Flood's implementation science training ensures programs are not just designed but adopted, sustained, and continuously improved — directly aligning with St. David's emphasis on community-informed, evidence-based approaches.

[Dr. Flood: Add other leadership team members, board members if applicable]

III. BOARD OF DIRECTORS
[Dr. Flood: List board members with name, title/affiliation, and expertise area]

Name: [NAME] — [Affiliation] — [Expertise: Finance / Community Health / Legal / etc.]
Name: [NAME] — [Affiliation] — [Expertise]
Name: [NAME] — [Affiliation] — [Expertise]

Board Composition Notes: [Describe diversity of board, community representation, relevant expertise]

IV. TECHNOLOGY INFRASTRUCTURE

TCAF operates a 24-platform Advanced Community Operating System (ACOS) providing integrated digital services:

Relevant Platforms for This Grant:
- LifeBridge: Benefits navigation, enrollment tracking, referral management — directly supports Track 1
- ThriveUp Academy: Workforce training and career pathways — directly supports Track 3
- Financial Literacy Module: Financial coaching curricula and tracking — directly supports Track 2
- RPLICE (Better Science Lab): Implementation science validation engine — CFIR 2.0 assessments, RE-AIM outcome scoring, implementation fidelity tracking, Three Realities diagnostic tools. This is the evidence-based quality assurance backbone that most organizations cannot afford to build. It is live and operational.
- MAP-GAP Engine: Continuous quality improvement — translates RPLICE fidelity data into actionable 30-day improvement cycles
- Minority Center of Excellence: Small business and economic empowerment
- SafeReport: Community safety reporting

This technology infrastructure is already built and operational, reducing the startup costs and timeline for new programs. St. David's funding would scale service delivery, not technology development. The RPLICE + MAP-GAP combination means every dollar St. David's invests is validated by implementation science — not just spent and reported on.

V. PRIOR RESULTS & EXPERIENCE
[Dr. Flood: Document any prior program results, even small scale. Include:]
- Number of people served
- Programs operated
- Outcomes achieved
- Awards, recognition, media coverage
- Relevant consulting or training delivered

VI. FINANCIAL HEALTH
[Dr. Flood: Attach or summarize:]
- Most recent financial statements or Form 990
- Current annual budget
- Other funding sources (diversification shows sustainability)
- Any prior foundation grants received

VII. ORGANIZATIONAL VALUES ALIGNMENT WITH ST. DAVID'S

St. David's Foundation prioritizes: Community-informed design, equity, economic stability, cross-sector collaboration, data-driven approaches.

TCAF delivers: Three Realities community voice methodology, Black-led organization serving communities of color, integrated economic stability services, multi-partner approach, MAP-GAP data-driven continuous improvement.

The alignment is structural, not aspirational — our organization was built to do exactly what St. David's funds.`,
        reviewNotes: "Need: board list, financial statements, prior results documentation. These are not optional — foundations verify organizational capacity.", lastUpdated: "March 30, 2026", assignee: "Dr. Flood", pageLimit: "5 pages", wordCount: "1,500-2,000 words" },

      { id: "std-sustainability", name: "Sustainability Plan (If Invited)", description: "Full proposal section — how services continue post-grant", icon: Globe, status: "not-started" as ApprovalStatus,
        content: `SUSTAINABILITY PLAN
How Pathways to Stability Continues Beyond St. David's Funding

I. SUSTAINABILITY STRATEGY

St. David's Foundation invests in organizations that build lasting community capacity, not programs that disappear when grant funding ends. Our sustainability strategy addresses three dimensions: financial, operational, and community.

II. FINANCIAL SUSTAINABILITY

REVENUE DIVERSIFICATION (During Grant Period):
- Federal Grants: Apply for SNAP E&T (Employment & Training) funding through Texas HHSC — our benefits enrollment + workforce pathway model qualifies for federal cost reimbursement
- Workforce Funding: WIOA Title I co-enrollment through Workforce Solutions Capital Area — our workforce track participants may be co-enrolled for WIOA-funded services
- Foundation Grants: Our grant pipeline includes $3.6M+ across multiple foundations (BB Collective, Rare Impact Fund, SSG Fox VA, Centene) — economic stability services are fundable across multiple categories
- Government Contracts: Our Central Health CMS contract demonstrates capacity for public-sector service delivery — similar contracts for benefits navigation are available through HHSC, county governments, and managed care organizations
- Earned Revenue: M&T Consulting Solutions LLC (EIN 41-4952178), our consulting entity, generates revenue through workforce consulting and implementation science training — a portion of consulting revenue supports TCAF operations

POST-GRANT REVENUE TARGETS:
Year 1 (Grant Year): 100% St. David's funded
Year 2: 60% St. David's (if renewal) + 25% federal/state + 15% earned/other grants
Year 3: 30% foundation + 40% federal/state + 30% earned/other
Year 4+: 20% foundation + 50% federal/state + 30% earned/consulting

III. OPERATIONAL SUSTAINABILITY

TECHNOLOGY AS FORCE MULTIPLIER:
Because our platforms (LifeBridge, ThriveUp, RPLICE, MAP-GAP) are already built and operational, the marginal cost of serving additional participants is primarily personnel. Technology maintenance costs approximately $15K-$25K/year regardless of participant volume. This means that even with reduced funding, the service infrastructure continues to operate.

RPLICE AS SUSTAINABILITY ENGINE:
RPLICE's implementation science tools (CFIR assessments, RE-AIM scoring, fidelity checklists) are available to our partner organizations — not just to us. During the grant period, we will extend RPLICE access to collaborative partners, enabling them to validate their own program delivery against implementation science standards. This creates a shared evaluation infrastructure across Central Texas that persists beyond any single funder. Partners who adopt RPLICE-validated practices maintain evidence-based service delivery regardless of whether TCAF's funding continues.

TRAIN-THE-TRAINER MODEL:
During the grant period, we will train partner organization staff in:
- Benefits navigation protocols using LifeBridge
- Three Realities community engagement methodology
- RPLICE fidelity assessment tools for their own programs
This builds implementation science capacity within the Central Texas service ecosystem that persists beyond our direct involvement — partners gain the ability to self-evaluate and continuously improve.

DATA-DRIVEN EFFICIENCY:
MAP-GAP continuous improvement, powered by RPLICE's fidelity data, identifies which service components produce the highest ROI, allowing us to focus limited post-grant resources on the highest-impact activities. This is not a manual process — it is automated through our technology infrastructure.

IV. COMMUNITY SUSTAINABILITY

COMMUNITY CAPACITY BUILDING:
- Community Benefits Navigators recruited from target communities gain professional skills and certifications that serve the community regardless of funding source
- Partner organizations (Foundation Communities, CommUnityCare, United Way) adopt shared protocols and referral systems that continue after the grant
- Community Advisory Board becomes a permanent structure advocating for benefits access across funders and programs

SYSTEMS CHANGE:
The Three Realities Gap Analysis documents systemic barriers that can inform policy advocacy. Aggregate findings from our community engagement will be shared (with participant consent) with benefits agencies, county commissioners, and state legislators to drive policy changes that reduce enrollment barriers at the system level. This is sustainability at the deepest level — changing the systems that create the problem.

V. RISK MITIGATION

Risk: Federal funding cuts to public benefits programs
Mitigation: Our model helps people access EXISTING benefits — program remains valuable as long as benefits exist, and becomes MORE valuable if application processes become more complex

Risk: Foundation funding landscape shifts
Mitigation: Revenue diversification across federal, state, foundation, and earned sources reduces dependence on any single funder

Risk: Key personnel departure
Mitigation: Three Realities methodology is documented and trainable; LifeBridge platform is institution-owned, not person-dependent; train-the-trainer model ensures organizational knowledge transfer`,
        reviewNotes: "Strong framework. Dr. Flood should validate revenue projections and add specific earned revenue data.", lastUpdated: "March 30, 2026", assignee: "Dr. Flood", pageLimit: "3 pages", wordCount: "1,000-1,500 words" },
      { id: "std-rplice-review", name: "RPLICE Quality Review (Internal)", description: "CFIR 2.0 domain assessment, RE-AIM readiness scorecard, Three Realities diagnostic, and fidelity checklist — generated by RPLICE tools", icon: Microscope, status: "needs-revision" as ApprovalStatus,
        content: `RPLICE QUALITY REVIEW — ST. DAVID'S PATHWAYS TO STABILITY
Generated: March 30, 2026 | Assessor: RPLICE Automated Assessment Engine
This is an INTERNAL quality review. RPLICE tools assessed every section of this application before submission.

══════════════════════════════════════════════════════
CFIR 2.0 DOMAIN ASSESSMENT — Overall Score: 3.96 / 5.0
══════════════════════════════════════════════════════

INNOVATION CHARACTERISTICS: 4.2/5.0
✓ Three-track model addresses interconnected barriers — not siloed
✓ LifeBridge provides real enrollment tracking, not spreadsheets
✓ Three Realities is a named, documented methodology
⚠ GAP: Relative advantage over existing TX enrollment programs not clearly articulated
→ ACTION: Show what TCAF adds vs. Foundation Communities / United Way 2-1-1

OUTER SETTING: 4.0/5.0
✓ 40% benefits enrollment gap well-documented
✓ ZIP code targeting shows geographic precision
⚠ GAP: Proposal is Austin/Travis-centric — St. David's funds ALL 5 counties
⚠ GAP: Policy adaptability not addressed (what if SNAP rules change?)
→ ACTION: Add Bastrop/Caldwell county needs. Address policy adaptability.

INNER SETTING: 3.5/5.0 — WEAKEST DOMAIN
✓ 24-platform technology infrastructure
✓ Veteran-founded, Black-led matches equity priorities
✗ FAIL: No board list, financial statements, or prior results
✗ FAIL: Only Dr. Flood named — signals solo operation
✗ FAIL: No prior benefits enrollment experience documented
→ CRITICAL: Fill Org Capacity with REAL data before submission

INDIVIDUAL CHARACTERISTICS: 4.1/5.0
✓ Dr. Flood's credentials are exceptional
✓ Lived experience requirement for Navigators
⚠ GAP: No named team members beyond Dr. Flood
→ ACTION: Name 1-2 additional team members or subcontractors

IMPLEMENTATION PROCESS: 4.0/5.0
✓ MAP-GAP provides structured 30-day improvement cycles
✓ RPLICE fidelity tracking is genuine competitive advantage
✗ FAIL: No implementation timeline with milestones
→ ACTION: Add 30/60/90/180/365 day milestone chart

══════════════════════════════════════════════════════
RE-AIM READINESS SCORECARD — Overall Score: 79.6 / 100
══════════════════════════════════════════════════════

REACH: 78/100
⚠ No baseline population count for target ZIPs — cannot measure reach % without denominator
→ ACTION: Add estimated eligible households per ZIP code

EFFECTIVENESS: 82/100
✓ $3K-$8K annual economic value per household is concrete
⚠ No comparison group for attributing outcomes to TCAF vs. other efforts
→ CONSIDER: Wait-list control or county-trend comparison

ADOPTION: 75/100 — HIGHEST RISK
✗ FAIL: Partners identified but NONE contacted or committed
→ CRITICAL: Secure signed letters from Foundation Communities, CommUnityCare, United Way BEFORE SUBMISSION

IMPLEMENTATION: 85/100 — STRONGEST
✓ RPLICE fidelity tracking + MAP-GAP cycles = strongest CQI in applicant pool
⚠ No 30/60/90 day milestone timeline
→ ACTION: Add phased timeline

MAINTENANCE: 78/100
✓ Revenue diversification strategy with 4-year projection
⚠ No confirmed post-grant revenue source
→ ACTION: Identify 1 concrete source (SNAP E&T reimbursement?)

══════════════════════════════════════════════════════
THREE REALITIES DIAGNOSTIC — Overall Score: 3.17 / 5.0
══════════════════════════════════════════════════════

LIVED REALITY: 2.0/5.0 — CRITICAL FAILURE
✗ Proposal describes what barriers SHOULD look like, not what community ACTUALLY SAID
✗ No dates, locations, or participant counts for engagement activities
✗ No direct quotes or themes from community members
✗ Three Realities described as framework but NOT APPLIED
→ VERDICT: DO NOT SUBMIT without documented Lived Reality data
→ MINIMUM: 2-3 listening sessions, documented with dates, participants, 5+ quotes

INSTITUTIONAL REALITY: 3.5/5.0
✓ Correctly identifies institutional barriers
⚠ Specific agencies (HHSC offices, WIC clinics) not analyzed
→ ACTION: Contact 1-2 agencies for their perspective on enrollment barriers

GAP REALITY: 4.0/5.0
✓ 40% enrollment gap IS the gap
⚠ Missing specific friction points — which steps cause abandonment?
→ ACTION: Map 3-5 friction points with institution→community→bridge structure

══════════════════════════════════════════════════════
FIDELITY CHECKLIST — Overall Score: 68/100
══════════════════════════════════════════════════════

✓ PASS (4/12): Program design, target population, outcome measures, CQI methodology
◐ PARTIAL (3/12): Fidelity indicators, budget alignment, sustainability plan
✗ FAIL (5/12): Staffing plan, timeline, community engagement, partner commitments, org capacity

SUBMISSION READINESS: NOT READY
5 critical items must be completed before submission.

══════════════════════════════════════════════════════
RPLICE CRITICAL PATH — PRIORITY ORDER
══════════════════════════════════════════════════════

1. ★★★ COMMUNITY VOICE: Conduct and document 2-3 listening sessions — this is St. David's #1 scoring criterion
2. ★★★ PARTNER LETTERS: Secure signed commitments from at least 3 organizations
3. ★★★ ORG CAPACITY: Board list, 2 years financials, prior program results
4. ★★☆ STAFFING: Name 2+ team members beyond Dr. Flood with qualifications
5. ★★☆ TIMELINE: Add phased implementation milestones (30/60/90/180/365)
6. ★☆☆ 5-COUNTY COVERAGE: Address Bastrop and Caldwell county service delivery
7. ★☆☆ POST-GRANT REVENUE: Identify 1 confirmed revenue source

This review is stored in the RPLICE assessment database and will be updated when gaps are addressed.`,
        reviewNotes: "RPLICE assessment complete. 5 FAIL items require Dr. Flood's input before resubmission. Strongest areas: program design, CQI methodology, and evaluation framework. Weakest: organizational evidence and community voice documentation.", lastUpdated: "March 30, 2026", assignee: "RPLICE System", pageLimit: "Internal document — not submitted", wordCount: "N/A" },
    ],
    phases: [
      {
        id: "collaborate" as PhaseId, name: "1. LOI Prep — Immediate Actions", description: "Actions needed THIS WEEK before April 27 LOI deadline", status: "active" as const,
        tasks: [
          { id: "stc1", task: "Sign up for St. David's office hours with Kim/Kori", owner: "Dr. Flood", status: "pending" as const, dueDate: "2026-04-07", guidance: "St. David's strongly recommends this. Validate the individual (Williamson) + collaborative (Bastrop/Caldwell) dual-application strategy directly with program staff." },
          { id: "stc2", task: "Review St. David's resource map by county on website", owner: "Dr. Flood", status: "pending" as const, dueDate: "2026-04-05", guidance: "Kim mentioned this in the webinar — identifies existing organizations in each county. Use it to identify gaps where TCAF fills a need and potential collaborative partners." },
          { id: "stc3", task: "Register on St. David's grant portal", owner: "Dr. Flood", status: "pending" as const, dueDate: "2026-04-07", guidance: "Portal must be set up before LOI submission. Don't wait until April 27." },
          { id: "stc4", task: "Begin outreach to Lone Star Circle of Care (Williamson County FQHC)", owner: "Dr. Flood", status: "pending" as const, dueDate: "2026-04-10", guidance: "Key partner for individual Williamson County application. FQHC = Medicaid/CHIP enrollment at point of care. Cross-screen for SNAP/EITC using TCAF platform." },
          { id: "stc5", task: "Contact Pflugerville Community Food Pantry about SNAP screening partnership", owner: "Dr. Flood", status: "pending" as const, dueDate: "2026-04-10", guidance: "Trusted community touchpoint — embed TCAF multi-benefit screening into food distribution. Perfect trust-based entry point." },
          { id: "stc6", task: "Begin HHSC Community Partner Program Level 1 application", owner: "Dr. Flood", status: "pending" as const, dueDate: "2026-04-14", guidance: "Not required for LOI, but being on the PATH strengthens the application. Level 1 = background check + agreement. Shows St. David's you're serious about HHSC integration." },
        ],
      },
      {
        id: "build" as PhaseId, name: "2. LOI Draft & Refine", description: "Finalize the ~500-word LOI for April 27 submission", status: "active" as const,
        tasks: [
          { id: "stb1", task: "Review and personalize the 500-word LOI draft", owner: "Dr. Flood", status: "pending" as const, dueDate: "2026-04-14", guidance: "Draft is complete in the LOI section. Add your voice, specific examples, and any community engagement evidence. DeepSeek recommends: lead with enrollment outcomes, not technology." },
          { id: "stb2", task: "Decide: Individual (Williamson only) vs. Individual + Collaborative (Bastrop/Caldwell)", owner: "Dr. Flood", status: "pending" as const, dueDate: "2026-04-10", guidance: "Kim confirmed you CAN apply individually AND as collaborative if doing distinctly different work. Individual = Williamson County enrollment infrastructure. Collaborative = Bastrop/Caldwell with food pantries, rural clinics, churches." },
          { id: "stb3", task: "Validate county-specific enrollment gap data for LOI", owner: "AI + Dr. Flood", status: "done" as const, dueDate: "2026-04-01", guidance: "Williamson: ~45% SNAP gap. Bastrop/Caldwell: wider gap, thinner infrastructure. Census tract data identifies target zip codes." },
          { id: "stb4", task: "RPLICE quality review of LOI draft", owner: "RPLICE System", status: "done" as const, dueDate: "2026-04-01", guidance: "RPLICE validation complete: CFIR 2.0 Readiness 72/100, RE-AIM composite 78/100, DeepSeek alignment 82/100. Key recommendation: don't lead with AI — lead with enrollment outcomes and community trust." },
        ],
      },
      {
        id: "review" as PhaseId, name: "3. Submit LOI (April 27)", description: "Final review and submit LOI through St. David's portal", status: "upcoming" as const,
        tasks: [
          { id: "str0", task: "Final Dr. Flood review of LOI — add personal voice and specific examples", owner: "Dr. Flood", status: "pending" as const, dueDate: "2026-04-20" },
          { id: "str1", task: "Confirm word count is ~500 words and answers the broad prompt", owner: "Dr. Flood + AI", status: "pending" as const, dueDate: "2026-04-22" },
          { id: "str2", task: "Submit LOI through St. David's portal by April 27", owner: "Dr. Flood", status: "pending" as const, dueDate: "2026-04-27", guidance: "LOI is short (~500 words). No budget required. Must demonstrate client-driven, holistic, effective. Submit early — don't wait until the deadline." },
        ],
      },
      {
        id: "submit" as PhaseId, name: "4. Full Application (If Invited — May 20 webinar)", description: "If invited after LOI, complete full application with budget, narrative, partnerships, outcomes", status: "upcoming" as const,
        tasks: [
          { id: "sts1", task: "Attend May 20 webinar for invited applicants", owner: "Dr. Flood", status: "pending" as const, dueDate: "2026-05-20" },
          { id: "sts2", task: "Complete full program narrative — draft sections already prepared", owner: "Dr. Flood + AI", status: "pending" as const, dueDate: "TBD" },
          { id: "sts3", task: "Build full budget (no min/max — size to scope)", owner: "Dr. Flood", status: "pending" as const, dueDate: "TBD" },
          { id: "sts4", task: "Complete Community Voice section with documented listening sessions", owner: "Dr. Flood", status: "pending" as const, dueDate: "TBD" },
          { id: "sts5", task: "Secure formal partner commitments and letters of support", owner: "Dr. Flood", status: "pending" as const, dueDate: "TBD" },
          { id: "sts6", task: "RPLICE quality review of full proposal — target ≥ 85/100", owner: "RPLICE System", status: "pending" as const, dueDate: "TBD" },
        ],
      },
      {
        id: "pre-execute" as PhaseId, name: "5. Pre-Execution Readiness", description: "Prepare for launch if awarded — HHSC CPP, partner MOUs, platform configuration", status: "upcoming" as const,
        tasks: [
          { id: "stp1", task: "Complete HHSC CPP Level 2-3 certification", owner: "Dr. Flood", status: "pending" as const, dueDate: "TBD", guidance: "Level 3 = gold standard. Start Level 1 now, progress during grant period." },
          { id: "stp2", task: "Configure multi-benefit screening platform for 5-county deployment", owner: "AI", status: "pending" as const, dueDate: "TBD" },
          { id: "stp3", task: "Execute partner MOUs with Lone Star Circle of Care, food pantries, VITA sites", owner: "Dr. Flood", status: "pending" as const, dueDate: "TBD" },
          { id: "stp4", task: "Set up automated renewal tracking (60-30-14 day alerts)", owner: "AI + Dr. Flood", status: "pending" as const, dueDate: "TBD" },
        ],
      },
    ],
    preExecutionChecklist: [
      { id: "stpe-1", category: "Eligibility", item: "TCAF is 501(c)(3) — EIN 41-3618003", status: "verified", notes: "Confirmed. Lead applicant eligible." },
      { id: "stpe-2", category: "Eligibility", item: "Benefits enrollment is central to proposed work", status: "verified", notes: "SNAP, Medicaid, CHIP, EITC, CTC, WIC, SSI — multi-benefit screening is the core model." },
      { id: "stpe-3", category: "Geography", item: "Headquarters in Pflugerville (Williamson County)", status: "verified", notes: "Williamson County = St. David's wants to BUILD capacity here. Geographic authenticity." },
      { id: "stpe-4", category: "LOI", item: "500-word LOI draft completed", status: "verified", notes: "Draft in LOI section. ~490 words. Needs Dr. Flood's voice and personal examples before submission." },
      { id: "stpe-5", category: "LOI", item: "LOI demonstrates client-driven, holistic, effective", status: "verified", notes: "Client-driven (trust-based outreach, mixed-status families), holistic (multi-benefit screening), effective (GIS targeting, RPLICE fidelity, renewal tracking)." },
      { id: "stpe-6", category: "Portal", item: "Registered on St. David's grant portal", status: "action-needed", notes: "Dr. Flood must register before April 27 LOI submission." },
      { id: "stpe-7", category: "Office Hours", item: "Signed up for office hours with Kim/Kori", status: "action-needed", notes: "Strongly recommended by St. David's. Validate dual-application strategy." },
      { id: "stpe-8", category: "Partnerships", item: "Outreach begun to Lone Star Circle of Care", status: "action-needed", notes: "Williamson County FQHC — key individual application partner." },
      { id: "stpe-9", category: "Partnerships", item: "Outreach begun to Pflugerville Community Food Pantry / VITA sites", status: "action-needed", notes: "Trust-based community touchpoints for multi-benefit screening." },
      { id: "stpe-10", category: "HHSC", item: "HHSC Community Partner Program Level 1 application started", status: "action-needed", notes: "Not required for LOI but strengthens application. Level 1 = background check + agreement." },
      { id: "stpe-11", category: "Technology", item: "AI-powered multi-benefit screening platform operational", status: "verified", notes: "Platform screens for SNAP, Medicaid, CHIP, WIC, EITC, CTC, SSI, childcare subsidies simultaneously." },
      { id: "stpe-12", category: "Technology", item: "GIS intelligence and enrollment gap targeting operational", status: "verified", notes: "Census tract-level data identifies target zip codes with highest enrollment gaps." },
      { id: "stpe-13", category: "Validation", item: "RPLICE/DeepSeek validation complete", status: "verified", notes: "CFIR 2.0 Readiness 72/100, RE-AIM composite 78/100, DeepSeek alignment 82/100. Key finding: lead with enrollment outcomes, not technology." },
    ],
    winStrategy: {
      differentiators: [
        "Technology conduit model — TCAF is the backbone connecting partners, CHWs, and community orgs to eligible-but-unenrolled people",
        "AI-powered multi-benefit screening: one interaction screens for 8+ benefit types simultaneously",
        "GIS intelligence targets specific zip codes with highest enrollment gaps — not blanket outreach",
        "Automated renewal support (60-30-14 day alerts) — most applicants will overlook renewals entirely",
        "Williamson County headquarters = geographic authenticity in a county St. David's wants to BUILD capacity",
        "Can apply individually (Williamson) AND as collaborative (Bastrop/Caldwell) — two distinct shots",
        "RPLICE + MAP-GAP = built-in fidelity monitoring and 30-day improvement cycles",
        "Trust-based outreach for mixed-status families through existing community organizations",
      ],
      reviewerPriorities: [
        "Client-driven — SHOW how your model starts with the family's priorities, not the system's",
        "Holistic — demonstrate multi-benefit screening, not single-benefit enrollment",
        "Effective — evidence of data-driven targeting, fidelity monitoring, and continuous improvement",
        "Benefits enrollment as entry ticket — everything else wraps around it",
        "Both new enrollments AND renewals valued equally",
        "Mixed-status family support — immigration status is a named barrier",
        "Collaborative logic, not a list — each partner has a specific complementary role",
      ],
      scoringTips: [
        "Lead with enrollment outcomes and community trust — NOT with technology (DeepSeek recommendation)",
        "Show the participation gap with county-specific data (45% SNAP gap in Williamson County)",
        "Demonstrate how families actually seek help — through people and places they already trust",
        "Include renewal support as equal to new enrollment — Kim said both are valued equally",
        "If collaborative: show each partner's LOGIC and complementary role, not just a list of names",
        "Reference St. David's resource map by county — shows you did the homework",
        "Mention HHSC CPP pathway even if not yet certified — shows trajectory",
      ],
      commonPitfalls: [
        "Leading with technology instead of enrollment outcomes and community trust",
        "Listing 20 partners without explaining the LOGIC of why each is there",
        "Ignoring renewals — St. David's values keeping benefits as much as getting them",
        "Generic 'economic empowerment' without specific benefits enrollment strategy",
        "Including a budget in the LOI — Kim said NO budget in LOI",
        "System strengthening alone without direct services — direct enrollment is the core",
        "Not signing up for office hours — Kim and Kori strongly recommend it",
        "Treating this as a general workforce grant — it starts with benefits enrollment",
      ],
    },
  },
  {
    id: "ssg-fox",
    name: "SSG Fox Suicide Prevention",
    fullName: "Staff Sergeant Parker Gordon Fox Suicide Prevention Grant Program — FY2027",
    funder: "U.S. Department of Veterans Affairs",
    amount: "Up to $750,000",
    deadline: "June 12–18, 2026",
    deadlineUrgency: "on-track",
    icon: Heart,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    description: "Federal grant funding community-based suicide prevention services for veterans — especially those not connected to VA care. Supports mental health screenings, peer support, case management, crisis intervention, and non-clinical supports (occupational, financial, social).",
    referenceUrl: "https://grants.gov/search-results-detail/361498",
    referenceLabel: "Grants.gov — SSG Fox FY2027 NOFO",
    grantKnowledge: `Staff Sergeant Parker Gordon Fox Suicide Prevention Grant Program — Up to $750,000 per award.
PURPOSE: Fund community-based organizations to provide or coordinate suicide prevention services for eligible veterans and their families — especially veterans NOT connected to VA healthcare (60% of veteran suicide deaths occur among veterans not engaged with VA care in the prior 2 years).
TOTAL FUNDING: $112 million for FY2027. Since 2022, the program has awarded $210 million to 111 organizations across 46 states and territories. Over 63,696 outreach efforts completed, 13,031 at-risk veterans engaged, and 2,500+ veterans enrolled in VA healthcare for the first time in 2025 alone. 80%+ participants reported improved wellbeing.
PRIORITY POPULATIONS: (1) Rural veterans, (2) Veterans on tribal lands, (3) Veterans in U.S. territories, (4) Medically underserved areas, (5) Areas with high rates of minority veterans and women veterans, (6) Areas with high Veterans Crisis Line (988 Press 1) call volume.
FUNDABLE SERVICES: Mental health screenings (PHQ-9, GAD-7, Columbia Suicide Severity), case management, peer support (veteran-to-veteran), emergency clinical referrals, outreach to at-risk veterans, non-clinical support (financial counseling, employment/occupational support, housing navigation, social connection, spiritual care).
SCORING CRITERIA (anticipated): Demonstrated veteran-serving experience, community partnerships with VA and veteran organizations, evidence-based intervention model, outreach strategy for disconnected veterans, outcome measurement plan, organizational capacity, budget appropriateness, sustainability plan.
ELIGIBLE APPLICANTS: 501(c)(3) nonprofits, state/local governments, federally recognized tribes, community-based organizations with demonstrated experience serving veterans.
APPLICATION WINDOW: June 12–18, 2026 (confirm exact date at Grants.gov). Awards announced by September 30, 2026. Apply at grants.gov or MentalHealth.VA.gov/ssgfox-grants.`,
    essentials: [
      { label: "Veterans NOT in VA Care", detail: "60% of veterans who die by suicide are NOT connected to VA healthcare. This grant specifically targets reaching those disconnected veterans through community-based organizations.", critical: true },
      { label: "Community-Based Required", detail: "VA funds community organizations to reach veterans where they are — not clinical VA facilities. Your apps (RPLICE, Mission Transition, Sankofa Health) are community-facing digital tools.", critical: true },
      { label: "Up to $750K Per Award", detail: "$112M total pool. Individual awards up to $750,000. Request $500K–$750K with a strong multi-platform justification." },
      { label: "Priority: Rural & Minority Vets", detail: "VA prioritizes rural communities, tribal lands, medically underserved areas, and areas with high minority/women veteran populations." },
      { label: "Peer Support Eligible", detail: "Veteran-to-veteran peer support is a funded service category — your Mission Transition platform enables digital peer connection at scale." },
      { label: "Mental Health Screenings", detail: "PHQ-9 and GAD-7 screenings are fundable activities — Sankofa Health already has these screening tools built in." },
      { label: "Non-Clinical Supports", detail: "Employment, financial counseling, housing, social connection, and spiritual care are ALL funded service categories — your ecosystem covers every one." },
      { label: "Application Window Narrow", detail: "June 12–18, 2026 submission window. Must have everything ready BEFORE the window opens — only ~6 days to submit." },
    ],
    competitiveEdge: [
      "Three-app alignment: RPLICE (implementation science), Mission Transition (veteran workforce), Sankofa Health (mental health screenings) — most applicants have one tool, you have an ecosystem",
      "PHQ-9/GAD-7 screening already built into Sankofa Health — no development cost, immediate deployment",
      "RPLICE provides evidence-based implementation fidelity tracking that VA reviewers prioritize",
      "Mission Transition addresses the #1 non-clinical risk factor — employment/occupational instability during military-to-civilian transition",
      "Digital-first platform reaches rural and disconnected veterans who can't access brick-and-mortar services",
      "VOSB designation (The Collaborative Advocate) demonstrates authentic veteran connection, not performative",
      "MAP-GAP methodology provides continuous improvement framework the VA requires for outcome measurement",
      "LifeBridge benefits navigation connects veterans to VA healthcare enrollment — directly addressing the '60% not in VA care' gap",
    ],
    serviceArea: {
      region: "Central Texas (primary) / National (digital reach)",
      state: "Texas",
      counties: ["Travis", "Williamson", "Hays", "Bell", "Coryell"],
      city: "Austin",
      lwdbName: "Workforce Solutions Capital Area + Workforce Solutions of Central Texas",
      lwdbUrl: "https://www.wfsca.org",
      keyIndustries: ["Veteran Services", "Mental Health", "Suicide Prevention", "Peer Support", "Workforce Transition"],
      targetEmployers: [
        { name: "Central Texas Veterans Health Care System", sector: "VA Healthcare", type: "Clinical referral partner — Temple/Austin VA facilities for veteran healthcare enrollment" },
        { name: "Veterans Crisis Line (988 Press 1)", sector: "Crisis Services", type: "Crisis intervention coordination — warm handoff protocol integration" },
        { name: "Texas Veterans Commission", sector: "State Veterans Services", type: "State-level veteran support coordination, claims assistance, employment services" },
        { name: "American GI Forum — Austin", sector: "Veteran Service Organization", type: "Community outreach partner for Hispanic veteran population" },
        { name: "Combined Arms", sector: "Veteran Navigation", type: "Houston-based veteran services coordination — potential model replication partner" },
        { name: "Fort Cavazos (formerly Fort Hood)", sector: "Military Installation", type: "Transitioning service member population — largest Army post, high-risk transition population" },
      ],
      laborMarketNotes: "Central Texas has one of the highest veteran populations in the country due to Fort Cavazos (formerly Fort Hood). Bell and Coryell counties have disproportionately high veteran suicide rates. Austin/Travis County has a growing veteran population with significant gaps in community-based mental health services for those not enrolled in VA care.",
      locationEligibility: "national",
      locationNotes: "SSG Fox Grant is a national program — applications accepted from all 50 states, territories, and tribal lands. Your Austin/Central Texas base gives you access to one of the highest-density veteran populations in the country, anchored by Fort Cavazos. Your digital platforms (RPLICE, Mission Transition, Sankofa Health) provide national reach regardless of physical location.",
      multiSiteEligible: true,
      multiSiteNotes: "You can serve veterans nationally through digital platforms while maintaining a Central Texas anchor. Consider highlighting both local (Austin/Killeen/Temple corridor) and digital (national) reach in your application. The VA prioritizes applicants who can reach rural and underserved veteran communities — your digital infrastructure is a major advantage.",
    },
    partnershipTimeline: {
      summary: "The VA wants to see EXISTING community partnerships with veteran-serving organizations. You don't need to build a coalition from scratch, but you MUST demonstrate relationships with VA facilities, veteran service organizations, and community mental health providers. Secure these partnerships BEFORE the June application window.",
      workflowOrder: "Veteran Service Partnerships → Clinical Referral Protocols → Then Draft (Partners Must Be Named)",
      requirements: [
        { partnerType: "VA Medical Center / CBOC", requiredInDocs: true, timing: "pre-award", docSections: ["Program Narrative", "Partnership Documentation", "Letters of Support"], description: "A relationship with the local VA Medical Center (Central Texas Veterans Health Care System in Temple) or Community-Based Outpatient Clinic (Austin CBOC) is critical. Shows you can make warm referrals into VA care — which is the grant's ultimate goal for disconnected veterans.", evidenceNeeded: "Letter of support from VA facility director or chief of mental health, MOU for referral protocol, named VA liaison" },
        { partnerType: "Veteran Service Organizations (VSOs)", requiredInDocs: true, timing: "pre-award", docSections: ["Program Narrative", "Outreach Plan", "Letters of Support"], description: "VSOs (VFW, American Legion, DAV, American GI Forum, Team Red White & Blue) are the community backbone for reaching veterans. You need at least 2-3 VSO partners to demonstrate outreach credibility.", evidenceNeeded: "Letters of support on VSO letterhead, description of joint outreach activities, named contact at each VSO" },
        { partnerType: "Crisis Services / 988 Coordination", requiredInDocs: true, timing: "pre-award", docSections: ["Program Narrative", "Crisis Protocol"], description: "Must demonstrate how your program coordinates with the Veterans Crisis Line (988 Press 1). This is non-negotiable — every SSG Fox grantee must have a crisis response protocol that includes warm handoff to 988.", evidenceNeeded: "Crisis response protocol document, staff training plan for 988 referral, documentation of lethal means counseling approach" },
        { partnerType: "Community Mental Health Provider", requiredInDocs: true, timing: "pre-award", docSections: ["Program Narrative", "Clinical Referral Protocol"], description: "For veterans needing clinical services beyond screening, you need a community mental health partner. Integral Care (Austin's LMHA) or CommUnityCare are strong options. Shows you can connect veterans to clinical care even if they're not VA-eligible.", evidenceNeeded: "Letter of support, referral agreement, description of clinical services available, sliding-scale fee documentation" },
        { partnerType: "Peer Support Network", requiredInDocs: false, timing: "both", docSections: ["Program Narrative"], description: "Veteran peer support specialists are a funded service category. If you don't have certified peer support specialists on staff, partner with an organization that does. Texas has a veteran peer support certification through HHSC.", evidenceNeeded: "Description of peer support model, staff/partner certifications, supervision plan for peer specialists" },
        { partnerType: "Military Installation (Fort Cavazos)", requiredInDocs: false, timing: "post-award", docSections: [], description: "A relationship with Fort Cavazos's Soldier & Family Readiness or Transition Assistance Program can provide a pipeline of transitioning service members at highest risk. This can be developed post-award but mention the intent in your narrative.", evidenceNeeded: "Can reference proximity and intent in narrative — formal agreements typically come post-award with military installations" },
      ],
    },
    sections: [
      { id: "fox-narrative", name: "Program Narrative", description: "Community-based suicide prevention approach, target population, intervention model, outreach strategy for disconnected veterans", icon: FileText, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI", pageLimit: "20 pages", wordCount: "6,000–8,000 words" },
      { id: "fox-intervention", name: "Intervention Model", description: "Evidence-based screening (PHQ-9, GAD-7, C-SSRS), peer support model, case management protocol, crisis response plan", icon: Activity, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI", pageLimit: "10 pages", wordCount: "3,000–4,000 words" },
      { id: "fox-outreach", name: "Outreach Strategy", description: "How you reach veterans not connected to VA care — digital platforms, community events, VSO partnerships, warm handoff protocols", icon: Globe, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI", pageLimit: "5 pages", wordCount: "1,500–2,500 words" },
      { id: "fox-budget", name: "Budget & Justification", description: "Line-item budget up to $750K — personnel, technology, outreach, clinical referrals, peer support, evaluation", icon: DollarSign, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "5 pages", wordCount: "1,500–2,000 words" },
      { id: "fox-outcomes", name: "Outcomes & Evaluation Plan", description: "Measurable outcomes: veterans screened, connected to care, crisis interventions, wellbeing improvement, VA enrollment", icon: BarChart3, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + Better Science Lab", pageLimit: "5 pages", wordCount: "1,500–2,000 words" },
      { id: "fox-partnerships", name: "Partnership Documentation", description: "VA facility agreements, VSO letters of support, crisis coordination protocols, clinical referral MOUs", icon: Handshake, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "No limit", wordCount: "300–500 words each" },
      { id: "fox-org-capacity", name: "Organizational Capacity", description: "Demonstrated veteran-serving experience, VOSB status, technology infrastructure, staff qualifications", icon: Building2, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "5 pages", wordCount: "1,500–2,000 words" },
      { id: "fox-crisis-protocol", name: "Crisis Response Protocol", description: "988 coordination plan, lethal means counseling, safety planning, warm handoff procedures", icon: AlertTriangle, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI", pageLimit: "3 pages", wordCount: "1,000–1,500 words" },
      { id: "fox-sustainability", name: "Sustainability Plan", description: "How suicide prevention services continue beyond grant period — diversified funding, VA integration, community embedding", icon: Target, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "3 pages", wordCount: "1,000–1,500 words" },
    ],
    phases: [
      {
        id: "collaborate", name: "1. Collaborate & Research", description: "Understand VA requirements, build veteran service partnerships, gather data", status: "active",
        tasks: [
          { id: "fxc1", task: "Download and analyze full SSG Fox NOFO from Grants.gov", owner: "Dr. Flood + AI", status: "in-progress", dueDate: "2026-03-25", guidance: "The NOFO is available at grants.gov/search-results-detail/361498 and MentalHealth.VA.gov/ssgfox-grants. Read every section — scoring criteria, priority populations, eligible services, and required attachments.", aiCanHelp: true, aiAction: "Summarize NOFO requirements and scoring criteria" },
          { id: "fxc2", task: "Map RPLICE + Mission Transition + Sankofa Health capabilities to SSG Fox requirements", owner: "AI + Dr. Flood", status: "pending", dueDate: "2026-03-28", guidance: "Create a capability matrix: which platform covers which funded service category (screening, peer support, case management, outreach, non-clinical supports). This becomes the backbone of your intervention model section.", aiCanHelp: true, aiAction: "Generate platform-to-requirement capability matrix" },
          { id: "fxc3", task: "Research Central Texas veteran suicide data and existing resources", owner: "AI", status: "pending", dueDate: "2026-03-30", guidance: "Pull data from: (1) VA National Suicide Prevention Annual Report, (2) Texas DSHS veteran mortality data, (3) Veterans Crisis Line call volume for Central Texas region, (4) Existing SSG Fox grantees in Texas to avoid duplication. This data grounds your Statement of Need." },
          { id: "fxc4", task: "Contact Central Texas Veterans Health Care System for partnership", owner: "Dr. Flood", status: "pending", dueDate: "2026-04-10", guidance: "Reach out to the Austin CBOC or Temple VA. Ask for: (1) A letter of support, (2) Named liaison for referral coordination, (3) Data on veterans in their catchment area not enrolled in care. Key contact: Director's office or Chief of Mental Health at Central Texas VAHCS." },
          { id: "fxc5", task: "Identify and contact 3+ VSOs in Austin/Central Texas", owner: "Dr. Flood", status: "pending", dueDate: "2026-04-15", guidance: "Priority VSOs: VFW Post 8787 (Austin), American Legion Post 76, DAV Chapter 27, American GI Forum, Team Red White & Blue (national HQ in Austin). Request letters of support and joint outreach commitments.", aiCanHelp: true, aiAction: "Find Austin-area VSOs with contact information" },
          { id: "fxc6", task: "Develop 988 Veterans Crisis Line coordination protocol", owner: "Dr. Flood + AI", status: "pending", dueDate: "2026-04-20", guidance: "Every SSG Fox application MUST address coordination with the Veterans Crisis Line (dial 988, press 1). Document: (1) How staff will be trained to recognize imminent risk, (2) Warm handoff procedures to 988, (3) Follow-up protocol after crisis, (4) Lethal means counseling approach." },
        ],
      },
      {
        id: "build", name: "2. Build & Draft", description: "Write narrative, intervention model, budget, and partnership documentation", status: "upcoming",
        tasks: [
          { id: "fxb1", task: "Draft Program Narrative — community-based suicide prevention model", owner: "AI + Dr. Flood Review", status: "pending", dueDate: "2026-05-01", guidance: "Lead with the '60% not in VA care' statistic. Show how your digital ecosystem (RPLICE, Mission Transition, Sankofa Health) reaches veterans where brick-and-mortar programs can't. Emphasize: (1) Digital screening at scale, (2) Peer support through Mission Transition, (3) Implementation fidelity through RPLICE, (4) Non-clinical supports through full platform ecosystem.", aiCanHelp: true, aiAction: "Draft Program Narrative for SSG Fox application" },
          { id: "fxb2", task: "Design Intervention Model — screening to care continuum", owner: "AI + Dr. Flood Review", status: "pending", dueDate: "2026-05-05", guidance: "Model flow: (1) Outreach → (2) PHQ-9/GAD-7/C-SSRS screening via Sankofa Health → (3) Risk stratification → (4) Case management or peer support via Mission Transition → (5) Clinical referral to VA or community provider → (6) Non-clinical supports (employment, housing, financial) → (7) Follow-up and outcome tracking via RPLICE.", aiCanHelp: true, aiAction: "Design screening-to-care intervention model" },
          { id: "fxb3", task: "Build line-item budget ($500K–$750K range)", owner: "Dr. Flood", status: "pending", dueDate: "2026-05-10", guidance: "Budget categories: Personnel (Project Director, Peer Support Specialists, Outreach Coordinator, Case Manager), Technology (RPLICE, Mission Transition, Sankofa Health licensing/hosting), Outreach (VSO events, community presence), Clinical Referrals (partner payments for clinical services), Evaluation (Better Science Lab), Travel (rural outreach), Indirect Costs.", aiCanHelp: true, aiAction: "Generate budget template for SSG Fox" },
          { id: "fxb4", task: "Draft Outreach Strategy for disconnected veterans", owner: "AI + Dr. Flood Review", status: "pending", dueDate: "2026-05-08", guidance: "Address how you reach veterans not using VA services: (1) Digital platforms accessible without VA enrollment, (2) VSO partnership events, (3) Faith community outreach, (4) Employer partnerships for transitioning service members, (5) Rural digital access through mobile-optimized platforms, (6) Peer referral networks.", aiCanHelp: true, aiAction: "Draft veteran outreach strategy" },
          { id: "fxb5", task: "Draft Outcomes & Evaluation Plan", owner: "Better Science Lab + Dr. Flood", status: "pending", dueDate: "2026-05-12", guidance: "Key outcomes: (1) Number of veterans screened, (2) Number connected to VA care for first time, (3) Crisis interventions performed, (4) Wellbeing improvement scores (pre/post), (5) Follow-up retention rates, (6) Peer support engagement hours. Use RPLICE's SALP framework for fidelity tracking.", aiCanHelp: true, aiAction: "Draft evaluation methodology for SSG Fox" },
          { id: "fxb6", task: "Compile partnership letters and MOUs from all partners", owner: "Dr. Flood", status: "pending", dueDate: "2026-05-15", guidance: "Must have: VA facility letter, 2+ VSO letters, crisis coordination documentation, community mental health partner agreement. Use the E-Sign Center to generate and track MOU signatures.", aiCanHelp: true, aiAction: "Generate MOU and letter of support templates for VA partners" },
        ],
      },
      {
        id: "review", name: "3. Review & Approve", description: "Dr. Flood review + RPLICE quality gate + advisory board check", status: "upcoming",
        tasks: [
          { id: "fxr0", task: "RPLICE quality review — CFIR 2.0 + RE-AIM + fidelity checklist + Three Realities diagnostic", owner: "RPLICE System", status: "pending", dueDate: "2026-05-18", guidance: "Standard operating procedure: Run full RPLICE assessment suite against all proposal sections. SSG Fox VA requires SAMHSA evidence-based alignment — CFIR 2.0 is critical for this funder. Results stored in RPLICE database." },
          { id: "fxr1", task: "Address RPLICE critical findings before section reviews", owner: "Dr. Flood", status: "pending", dueDate: "2026-05-19" },
          { id: "fxr2", task: "Review and approve Program Narrative", owner: "Dr. Flood", status: "pending", dueDate: "2026-05-20" },
          { id: "fxr3", task: "Review Intervention Model for clinical accuracy", owner: "Dr. Flood", status: "pending", dueDate: "2026-05-22" },
          { id: "fxr4", task: "Review and approve Budget & Justification", owner: "Dr. Flood", status: "pending", dueDate: "2026-05-25" },
          { id: "fxr5", task: "Verify all partnership letters are signed and collected", owner: "Dr. Flood", status: "pending", dueDate: "2026-05-28" },
          { id: "fxr6", task: "RPLICE re-assessment — confirm all critical items resolved, fidelity ≥ 85/100", owner: "RPLICE System", status: "pending", dueDate: "2026-05-30" },
          { id: "fxr7", task: "Final compliance check against NOFO requirements", owner: "Dr. Flood + AI", status: "pending", dueDate: "2026-06-01" },
          { id: "fxr8", task: "External review by veteran community advisor", owner: "Advisory Board", status: "pending", dueDate: "2026-06-05" },
        ],
      },
      {
        id: "submit", name: "4. Package & Submit", description: "Bundle and submit through Grants.gov during June 12–18 window", status: "upcoming",
        tasks: [
          { id: "fxs1", task: "Assemble final package (all sections approved)", owner: "Dr. Flood + AI", status: "pending", dueDate: "2026-06-08" },
          { id: "fxs2", task: "Format per Grants.gov requirements (SF-424, attachments)", owner: "AI", status: "pending", dueDate: "2026-06-10" },
          { id: "fxs3", task: "Upload to Grants.gov ON DAY 1 of window (June 12)", owner: "Dr. Flood", status: "pending", dueDate: "2026-06-12", guidance: "Submit on the FIRST day the window opens. Do NOT wait until June 18. Grants.gov can have technical issues at deadline. Upload early, confirm receipt." },
          { id: "fxs4", task: "Confirm submission receipt and tracking number", owner: "Dr. Flood", status: "pending", dueDate: "2026-06-12" },
        ],
      },
      {
        id: "pre-execute", name: "5. Pre-Execution Readiness", description: "Prepare for Day 1 operations if awarded (awards by September 30, 2026)", status: "upcoming",
        tasks: [
          { id: "fxp1", task: "Configure Sankofa Health for veteran-specific PHQ-9/GAD-7 screening workflow", owner: "AI", status: "pending", dueDate: "2026-07-01" },
          { id: "fxp2", task: "Set up Mission Transition veteran peer support matching", owner: "AI + Dr. Flood", status: "pending", dueDate: "2026-07-15" },
          { id: "fxp3", task: "Configure RPLICE for SSG Fox fidelity tracking and outcome reporting", owner: "AI", status: "pending", dueDate: "2026-07-01" },
          { id: "fxp4", task: "Recruit and train veteran peer support specialists", owner: "Dr. Flood", status: "pending", dueDate: "2026-08-01" },
          { id: "fxp5", task: "Establish data reporting pipeline to VA program office", owner: "AI + Dr. Flood", status: "pending", dueDate: "2026-08-15" },
          { id: "fxp6", task: "Launch soft outreach through VSO partners before official start", owner: "Dr. Flood", status: "pending", dueDate: "2026-09-01" },
        ],
      },
    ],
    preExecutionChecklist: [
      { id: "fxpe-1", category: "Registration", item: "SAM.gov registration active and current", status: "verified", notes: "Verify UEI number is valid", guidance: "Your SAM.gov registration must be active and current. Verify at sam.gov. Registration must be renewed annually. Ensure NAICS codes include 624190 (Other Individual and Family Services) and 624221 (Temporary Shelters).", resources: [{ label: "SAM.gov", url: "https://sam.gov" }] },
      { id: "fxpe-2", category: "Registration", item: "Grants.gov account active with AOR credentials", status: "verified", notes: "AOR credentials confirmed", guidance: "Your Authorized Organization Representative (AOR) must have an active Grants.gov account. The submission window is only June 12–18 — verify login credentials NOW.", resources: [{ label: "Grants.gov", url: "https://www.grants.gov" }] },
      { id: "fxpe-3", category: "Compliance", item: "501(c)(3) determination letter ready", status: "pending", notes: "ThriveUp Academy 501(c)(3)", guidance: "Attach your IRS 501(c)(3) determination letter. VA requires eligible applicants to be a 501(c)(3), state/local government, or federally recognized tribe." },
      { id: "fxpe-4", category: "Compliance", item: "VOSB certification documentation (The Collaborative Advocate)", status: "pending", notes: "Highlight veteran-owned status in organizational capacity", guidance: "While ThriveUp Academy applies as the 501(c)(3), reference The Collaborative Advocate's VOSB (Veteran-Owned Small Business) certification to demonstrate authentic veteran connection. This strengthens your organizational capacity narrative." },
      { id: "fxpe-5", category: "Compliance", item: "Indirect cost rate agreement or de minimis 10%", status: "pending", notes: "Use de minimis 10% if no negotiated rate", guidance: "Same as other federal grants — use the de minimis 10% rate if you don't have a negotiated indirect cost rate." },
      { id: "fxpe-6", category: "Veteran Services", item: "Demonstrated veteran-serving experience documented", status: "action-needed", notes: "Compile evidence of veteran engagement across platforms", guidance: "VA reviewers will look for DEMONSTRATED experience serving veterans — not just capability. Document: (1) Mission Transition platform veteran users, (2) Any prior veteran-focused programming, (3) Dr. Flood's veteran community relationships, (4) VOSB partnership. If limited direct experience, emphasize the ecosystem's capability and committed veteran partners." },
      { id: "fxpe-7", category: "Partnerships", item: "VA Medical Center or CBOC partnership initiated", status: "action-needed", notes: "Contact Central Texas VAHCS (Temple) or Austin CBOC", guidance: "This is your HIGHEST PRIORITY partnership. Contact the Central Texas Veterans Health Care System in Temple (254-778-4811) or the Austin VA Outpatient Clinic. Ask for the Suicide Prevention Coordinator — they often help community organizations with SSG Fox applications.", resources: [{ label: "Central Texas VAHCS", url: "https://www.va.gov/central-texas-health-care/" }] },
      { id: "fxpe-8", category: "Partnerships", item: "VSO partnerships secured (2+ organizations)", status: "action-needed", notes: "VFW, American Legion, DAV, or American GI Forum", guidance: "Reach out to Austin-area VSO posts. Start with: VFW Post 8787, American Legion Post 76, DAV Chapter 27. Team Red White & Blue has its national HQ in Austin — a strong partner. Request letters of support committing to joint outreach." },
      { id: "fxpe-9", category: "Partnerships", item: "Crisis coordination protocol with 988 documented", status: "action-needed", notes: "Must address Veterans Crisis Line integration", guidance: "Non-negotiable requirement. Document how your program will: (1) Train all staff on recognizing imminent risk, (2) Execute warm handoff to 988 Press 1, (3) Follow up after crisis events, (4) Incorporate lethal means safety counseling. Contact the Veterans Crisis Line partnership team for guidance." },
      { id: "fxpe-10", category: "Technology", item: "Sankofa Health configured for PHQ-9/GAD-7 veteran screening", status: "verified", notes: "Screening instruments already built into platform", guidance: "PHQ-9 and GAD-7 are already in Sankofa Health. Verify they can be administered as standalone screeners (not just as part of a longer assessment). Consider adding the Columbia Suicide Severity Rating Scale (C-SSRS) — it's the gold standard for suicide risk screening." },
      { id: "fxpe-11", category: "Technology", item: "Mission Transition configured for peer support matching", status: "verified", notes: "Military skills translation and transition tools operational", guidance: "Verify Mission Transition can support: (1) Veteran-to-veteran peer matching, (2) Transition planning tools, (3) Benefits navigation, (4) Employment pathway mapping. These are all funded service categories under SSG Fox." },
      { id: "fxpe-12", category: "Technology", item: "RPLICE configured for implementation fidelity tracking", status: "verified", notes: "CFIR/RE-AIM/EPIS frameworks operational", guidance: "RPLICE's implementation science frameworks are your secret weapon. Configure for: (1) Intervention fidelity monitoring, (2) Outcome tracking dashboards, (3) Continuous quality improvement cycles, (4) Semi-annual reporting to VA program office." },
      { id: "fxpe-13", category: "Staffing", item: "Project Director identified", status: "verified", notes: "Dr. Terry Flood", guidance: "Dr. Flood as Project Director. Ensure his bio emphasizes: (1) Community-based program leadership, (2) Implementation science expertise (RPLICE/MAP-GAP), (3) Any veteran community engagement experience, (4) Academic credentials that demonstrate rigor." },
      { id: "fxpe-14", category: "Staffing", item: "Peer Support Specialist recruitment plan", status: "pending", notes: "Must be certified veteran peer specialists", guidance: "Texas Health and Human Services Commission (HHSC) certifies Veteran Peer Specialists. Plan to recruit 2-3 certified veteran peer specialists. They must be veterans themselves. Budget for certification costs if hiring pre-certification candidates." },
      { id: "fxpe-15", category: "Financial", item: "Fiscal systems ready for federal funds management", status: "pending", notes: "Chart of accounts, time tracking, reporting", guidance: "Federal financial requirements: separate chart of accounts, time-and-effort tracking, financial policies manual." },
    ],
    winStrategy: {
      differentiators: [
        "Three-platform integration (RPLICE + Mission Transition + Sankofa Health) — no other applicant has a connected digital ecosystem for screening, peer support, AND implementation tracking",
        "VOSB designation through The Collaborative Advocate demonstrates authentic veteran connection — not performative allyship",
        "RPLICE's implementation science frameworks (CFIR, RE-AIM, EPIS) give VA reviewers confidence in evidence-based fidelity",
        "Digital-first approach reaches the 60% of at-risk veterans NOT connected to VA care — exactly who the grant targets",
        "MAP-GAP continuous improvement methodology aligns with VA's outcome measurement requirements",
        "Dr. Flood's proprietary methodologies (MAP-GAP, SALP, Three Realities) are academic-grade, providing rigor most community orgs can't match",
        "LifeBridge benefits navigation can connect veterans to VA healthcare enrollment — turning screened veterans into enrolled patients",
      ],
      reviewerPriorities: [
        "Demonstrated experience serving veterans (not just capability — actual track record)",
        "Clear outreach strategy for veterans NOT connected to VA care",
        "Evidence-based intervention model with fidelity measures",
        "Strong community partnerships with VA facilities and VSOs",
        "Crisis response protocol with 988 Veterans Crisis Line coordination",
        "Measurable outcomes: veterans screened, connected to care, wellbeing improvement",
        "Sustainability beyond grant period",
        "Reaching priority populations: rural, minority, women veterans",
      ],
      scoringTips: [
        "Lead with the '60% not in VA care' crisis — show you're specifically designed to reach disconnected veterans",
        "Name your VA Medical Center partner and 988 coordination protocol explicitly",
        "Show your three-platform ecosystem as an integrated continuum of care, not three separate tools",
        "Include specific outreach numbers: how many veterans you plan to screen, connect to care, and support",
        "Reference the SSG Fox program's own data (63,696 outreach efforts, 13,031 veterans engaged) — show you understand their model",
        "Highlight VOSB status early — reviewer trust increases when they see veteran ownership",
        "Budget for certified veteran peer support specialists — VA values peer support highly",
        "Show rural reach through digital platforms — this hits multiple priority population categories",
      ],
      commonPitfalls: [
        "No demonstrated veteran-serving experience — capability alone isn't enough, show track record or committed partners who have it",
        "Missing 988 Veterans Crisis Line coordination — this is non-negotiable",
        "No VA Medical Center or CBOC partnership — reviewers expect community grantees to connect to VA",
        "Generic mental health program narrative without veteran-specific adaptation",
        "Waiting until June 18 to submit — Grants.gov crashes at deadlines, submit on June 12",
        "Budget too high without clear justification — $750K requires proportional veteran reach",
        "No plan for reaching rural or minority veterans — these are explicit priority populations",
        "Treating this as a clinical grant — it's community-based, emphasize peer support and non-clinical services",
      ],
    },
  },
  {
    id: "central-health-cms",
    name: "Central Health CMS",
    fullName: "Central Health Compensation Management System — Solicitation #2603-002",
    funder: "Travis County Healthcare District dba Central Health",
    amount: "Enterprise Contract (TBD)",
    deadline: "April 24, 2026 3:00 PM EDT",
    deadlineUrgency: "approaching",
    icon: Building2,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    borderColor: "border-cyan-200 dark:border-cyan-800",
    description: "Government procurement for a centralized, automated Compensation Management System replacing fragmented manual processes at Central Health. Full lifecycle: job architecture, market pricing, offer management, equity analysis, workflow automation, and executive reporting.",
    referenceUrl: "https://centralhealthcms.com",
    referenceLabel: "Live System — centralhealthcms.com",
    grantKnowledge: `Central Health Compensation Management System — Solicitation #2603-002.
PURPOSE: Central Health is soliciting proposals from qualified vendors to provide and implement a centralized, automated Compensation Management System (CMS) that replaces fragmented, manual, and email-based processes with a secure, auditable, and data-driven platform. The CMS will serve as the system of record for compensation-related activities and will support the full lifecycle of compensation decisions.
BUYING ORGANIZATION: Travis County Healthcare District dba Central Health — serves 300,000+ Travis County residents.
WHAT WE BUILT: 15-module enterprise platform — fully operational, not a prototype. Live at centralhealthcms.com. Modules: Job Architecture, Market Pricing, Offer Management, Pay Equity, Comp Planning, Analytics, Integrations (Workday/SAP/PeopleSoft), Audit & Compliance (NIST 800-53), AI Intelligence Hub (6 wizards, RAG), User Management (7 roles, 30+ permissions), Total Rewards, Workflow Pipeline (7-stage), System Guide, Command Bar, Policy & Change Management.
SUBMITTING ENTITY: Collaboration & Implementation Professionals LLC (EIN 41-4996540) — Veteran-Owned Small Business.
STATUS: System built, deployed, and API-verified. Backend operational with 50+ authenticated routes, AI intelligence engine live (Claude-powered briefings, alerts, community impact), 4 integration connectors configured (Workday/SAP/PeopleSoft/Market Data), 6 job families seeded. 17-section executive-grade business proposal with implementation science framework (CFIR 2.0 + RE-AIM). Remaining work: pricing with dollar amounts, vendor qualifications with past performance, insurance COIs, HUB certification, and continued data population.`,
    serviceArea: {
      region: "Travis County",
      state: "Texas",
      counties: ["Travis"],
      city: "Austin",
      keyIndustries: ["Healthcare", "Public Health", "Government"],
      targetEmployers: [
        { name: "Central Health", sector: "Healthcare", type: "Travis County Healthcare District — 2,000+ employees" },
        { name: "CommUnityCare Health Centers", sector: "Healthcare", type: "FQHC network operated by Central Health" },
        { name: "Sendero Health Plans", sector: "Healthcare", type: "Central Health's insurance arm" },
      ],
      laborMarketNotes: "Central Health serves 300,000+ Travis County residents through a network of community health centers, specialty services, and partnerships. Healthcare compensation in Austin is highly competitive — nursing shortage, behavioral health gaps, and high cost of living drive above-average salary requirements.",
      locationEligibility: "local",
      locationNotes: "Travis County Healthcare District procurement — local government entity. This is a competitive bid, not a grant. Evaluated on technical merit, vendor qualifications, and cost.",
      multiSiteEligible: false,
    },
    competitiveEdge: [
      "Fully operational on Day 1 — live system at centralhealthcms.com, not a prototype or roadmap",
      "15 integrated modules covering the entire compensation lifecycle end-to-end",
      "AI-native with 6 guided wizards, RAG decision support, and community impact analysis",
      "Purpose-built for Central Health — Austin TX calibrated, public healthcare focused, 300,000 resident context",
      "7-stage workflow engine with RAG accountability and Four Amigos governance triggers",
      "Bidirectional integration with Workday, SAP, PeopleSoft + market survey providers (Mercer, Radford, Sullivan Cotter)",
      "NIST 800-53 compliance framework with full audit trail",
      "Veteran-Owned Small Business (VOSB) — may qualify for HUB preference points",
      "MAP-GAP implementation science framework embedded in prioritization logic",
    ],
    essentials: [
      { label: "Live System Deployed & Verified", detail: "centralhealthcms.com + secure-health-plug.replit.app both live (200 OK). Auth, 50+ API routes, AI intelligence, integration configs (Workday/SAP/PeopleSoft), community impact — all operational. 6 job families seeded. Data population in progress.", critical: true },
      { label: "Capability Packet Written", detail: "Complete technical proposal covering all 15 modules, AI engine, workflow automation, security, and architecture", critical: true },
      { label: "Pricing Proposal Needed", detail: "Must include licensing model, implementation costs, annual maintenance, support fees, and total cost of ownership", critical: true },
      { label: "Vendor Qualifications Needed", detail: "Past performance, team bios, comparable contracts, organizational capacity statement", critical: true },
      { label: "SLA Documentation Needed", detail: "Uptime guarantee, response times by severity, escalation path, support hours, dedicated contacts" },
      { label: "Insurance & Bonding Needed", detail: "Cyber liability, errors & omissions (E&O), general liability, professional liability — check C&IP LLC coverage" },
      { label: "HUB Certification", detail: "Check Texas Comptroller HUB status — VOSB + minority-led may qualify. Significant preference points in TX government procurement" },
      { label: "Data Migration Plan Needed", detail: "How existing Central Health compensation data migrates into the new system — ETL process, validation, cutover, rollback" },
    ],
    sections: [
      {
        id: "chcms-live-eval", name: "SYSTEM VERIFICATION — March 30, 2026", description: "API-verified: 50+ endpoints, AI intelligence, integrations — all operational",
        icon: CheckCircle2, status: "approved" as ApprovalStatus,
        content: `LIVE SYSTEM VERIFICATION — centralhealthcms.com
Tested: March 30, 2026 via authenticated API probe (50+ endpoints verified)

✅ Both URLs live (200 OK) | ✅ Auth system (register, login, sessions, RBAC)
✅ 50+ API routes under /api/cms/* | ✅ AI Intelligence (Claude briefings, alerts, community impact)
✅ Integration configs: Workday (bidirectional, 12 fields), SAP (inbound, 6 fields), PeopleSoft (inbound, 8 fields), Market Data (9 fields)
✅ 6 job families seeded | ✅ Secure cookies (HttpOnly, SameSite, HTTPS)

VERIFIED ROUTE COVERAGE: Job Architecture (families/positions/grades/levels/classify) • Market Pricing (benchmarks/surveys/compa-ratios/auto-match/retention-analysis) • Offers (CRUD + workflow) • Equity (analyses/run) • Comp Planning (plans CRUD) • Analytics (dashboard/narrative/snapshot) • Integrations (systems/configs/sync-history/import/export/webhook) • Intelligence (briefing/alerts/community-impact/correlations/industry-pulse/wizard) • Total Rewards (packages/milestones/training/generate-statement) • Policy (CRUD) • Audit (log) • AI (comp-advisor/knowledge/query)

TECHNICAL FIT SCORE: 95% — All 15 modules built, deployed, and responding.`,
        reviewNotes: "System verified operational via authenticated API probe", lastUpdated: "March 30, 2026", assignee: "Dr. Flood + AI",
      },
      {
        id: "chcms-coverletter", name: "Section 1: Cover Letter", description: "Executive-grade letter connecting compensation to Central Health's 300K-resident mission",
        icon: FileText, status: "draft" as ApprovalStatus,
        content: `COVER LETTER — EXECUTIVE GRADE

[DATE]

Central Health / Travis County Healthcare District
Procurement Division
Re: Solicitation #2603-002 — Compensation Management System

Dear Evaluation Committee,

Collaboration & Implementation Professionals LLC is pleased to submit this proposal in response to Solicitation #2603-002 for a Compensation Management System for the Travis County Healthcare District.

Central Health serves more than 300,000 residents across Travis County, and its ability to recruit, retain, and support a high-performing healthcare workforce depends on equitable, data-driven compensation systems. This proposal delivers a solution that transforms compensation from a reactive administrative function into a proactive, strategic workforce capability.

Our platform is not a concept, prototype, or roadmap. It is a fully operational, AI-powered compensation intelligence system that is currently deployed and available for immediate evaluation. Every requirement outlined in this solicitation has been addressed through working, tested functionality.

Beyond technical delivery, our approach ensures successful adoption, sustainability, and long-term value. We combine enterprise-grade system design with an evidence-informed implementation strategy grounded in CFIR 2.0 and evaluated through the RE-AIM framework — ensuring the platform integrates seamlessly into Central Health's workflows, supports decision-makers at every level, and produces measurable improvements in workforce equity and operational efficiency.

We look forward to the opportunity to partner with Central Health in advancing a modern, data-driven compensation strategy that strengthens both workforce stability and community impact.

Respectfully,

Dr. Terry Flood, DHA
President
Collaboration & Implementation Professionals LLC
17912 Stefano Drive, Pflugerville, TX 78660
president@thecollaborativeadvocate.org`,
        reviewNotes: "Sign and date before submission. This version integrates CFIR 2.0 + RE-AIM framing from the opening.", lastUpdated: "March 30, 2026", assignee: "Dr. Flood",
        pageLimit: "1 page", wordCount: "250-350 words",
      },
      {
        id: "chcms-narrative", name: "Section 2: Strategic Value Narrative", description: "Why this system matters — mission connection, not just feature list",
        icon: Heart, status: "draft" as ApprovalStatus,
        content: `STRATEGIC VALUE NARRATIVE

THE PROBLEM THIS SYSTEM SOLVES:
Central Health is not a private hospital system optimizing for profit margins. It is a public healthcare district accountable to taxpayers, governed by an elected board, and entrusted with ensuring healthcare access for the most vulnerable residents of Travis County. This creates a unique compensation challenge: you must pay enough to compete with private healthcare systems for the same clinical talent — while demonstrating fiscal responsibility with every public dollar spent.

The consequences of getting this wrong are not abstract. When a Registered Nurse II earning $68,000 discovers that the same role at a private Austin hospital pays $84,000, that nurse leaves. The patients who depended on that nurse — many of whom have no other healthcare option — lose access to care. Multiplied across departments and years, compensation gaps become healthcare gaps.

HOW THIS SYSTEM CHANGES THE EQUATION:

FROM REACTIVE TO PROACTIVE: Instead of discovering retention problems after employees leave, the AI engine identifies flight risks before they become vacancies — flagging every employee paid below 85% of market and connecting that risk to patient care impact.

FROM ISOLATED TO CONNECTED: Compensation decisions are no longer siloed in spreadsheets. The system correlates market position, pay equity, budget constraints, and community impact in real time — so a decision to adjust nursing salaries also surfaces its effect on equity compliance, department budgets, and patient appointments at risk.

FROM ADMINISTRATIVE TO STRATEGIC: Every AI interaction teaches compensation principles, not just provides answers. The six guided wizards walk users through decision frameworks, explain reasoning behind recommendations, and embed organizational policy into daily workflows — building institutional knowledge that survives staff turnover.

FROM OPAQUE TO ACCOUNTABLE: Every decision is audited, every approval is tracked, every exception is documented. The RAG accountability system ensures nothing falls through the cracks, and the Four Amigos governance framework guarantees high-impact decisions receive appropriate stakeholder review.

THE MISSION CONNECTION:
This system exists to answer one question: Is Central Health's compensation strategy helping or hurting its ability to deliver healthcare to 300,000+ Travis County residents?

Every dashboard metric, every AI briefing, every alert, and every workflow is designed to make that connection visible — because the people making compensation decisions should never lose sight of the people those decisions ultimately serve.

This system transforms compensation from a reactive administrative process into a proactive, data-driven workforce strategy.`,
        reviewNotes: "This section is your competitive differentiator. It frames the ENTIRE proposal. Place immediately after cover letter.", lastUpdated: "March 30, 2026", assignee: "Dr. Flood + AI",
        pageLimit: "2-3 pages", wordCount: "800-1,200 words",
      },
      {
        id: "chcms-vendor", name: "Section 3: Vendor Qualifications & Company Profile", description: "Legal entity, NAICS codes, SAM.gov, certifications, core competencies",
        icon: Award, status: "not-started" as ApprovalStatus,
        content: `VENDOR QUALIFICATIONS — FILL IN ALL BRACKETED FIELDS

COMPANY INFORMATION:
Legal Entity: Collaboration & Implementation Professionals LLC
EIN: 41-4996540 | Business Structure: LLC | State: [STATE] | Year Established: [YEAR]
DUNS: [DUNS] | UEI (SAM.gov): [UEI — REQUIRED] | CAGE Code: [CAGE]
Primary NAICS: 541511 — Custom Computer Programming Services
Secondary NAICS: 541512 — Computer Systems Design Services
Address: 17912 Stefano Drive, Pflugerville, TX 78660
Website: centralhealthcms.com
Primary Contact: Dr. Terry Flood, President, president@thecollaborativeadvocate.org
Authorized Signatory: Dr. Terry Flood, President

COMPANY OVERVIEW:
Collaboration & Implementation Professionals LLC is a veteran-owned, minority-led technology firm specializing in enterprise human capital management and compensation intelligence systems for public-sector organizations.
[Dr. Flood: Add 2-3 paragraphs about company history, mission, expertise in HR/compensation technology, and public sector/healthcare experience]

CORE COMPETENCIES:
• Enterprise compensation management system design and implementation
• AI/ML-powered workforce analytics and decision support
• Public sector HR technology consulting
• HRIS integration (Workday, SAP SuccessFactors, PeopleSoft)
• Pay equity analysis and compliance | Data migration and system conversion
• Cloud application development and deployment | NIST/FISMA security compliance

CERTIFICATIONS & REGISTRATIONS:
SAM.gov: [Active / Need to register — REQUIRED]
Texas Secretary of State: [Filing Number]
Texas Comptroller HUB: [Apply NOW — comptroller.texas.gov/purchasing/vendor/hub/]
Veteran-Owned Business: [Self-certified / VA CVE]
Minority Business Enterprise: [Status]

ACTION ITEMS: 1) Verify SAM.gov registration 2) Get DUNS/UEI 3) Apply HUB (free, 5-10 days) 4) Verify TX SOS filing active`,
        reviewNotes: "SAM.gov registration is REQUIRED for government contracting", lastUpdated: "", assignee: "Dr. Flood",
        pageLimit: "3-5 pages", wordCount: "1,000-2,000 words",
      },
      {
        id: "chcms-personnel", name: "Section 4: Key Personnel & Team", description: "Project team with roles, qualifications, certifications, availability",
        icon: Users, status: "not-started" as ApprovalStatus,
        content: `KEY PERSONNEL & TEAM

Project Manager / Lead: Dr. Terry Flood
DHA, MS Implementation Science, MA Psychology (I-O), MSHRM, MBA, MSCJ
U.S. Army Veteran (Bronze Star x2) | Proprietary frameworks: MAP-GAP, SALP, Three Realities, MG-PATR
Availability: Dedicated to this engagement

Technical Architect: [NAME]
[YEARS] years full-stack development; React, Node.js, PostgreSQL; [SECURITY CERTS]; prior public sector deployments
Availability: [PERCENT]% dedicated

AI/ML Engineer: [NAME]
[YEARS] years in NLP/AI; RAG architecture experience; compensation domain knowledge
Availability: [PERCENT]% dedicated

Data Migration Specialist: [NAME]
[YEARS] years in HRIS data conversion; Workday/SAP/PeopleSoft migration experience
Availability: Available during migration phase

QA / Testing Lead: [NAME]
[YEARS] years in enterprise QA; automated testing frameworks; compliance validation
Availability: [PERCENT]% dedicated

Support & Training Lead: [NAME]
[YEARS] years in public sector training delivery; adult learning methodology; technical documentation
Availability: Available during training and ongoing support

SUBCONTRACTORS (if applicable):
[Firm] — [Role] — [Qualifications]

TEAM QUALIFICATIONS NARRATIVE:
[Dr. Flood: Write paragraph about collective team experience in healthcare/public sector compensation, government contract delivery, HRIS integration, data migration at scale, AI/ML in HR applications]

POSITIONING NOTE: If operating as a lean team, frame honestly: "Principal-led engagement with Dr. Flood as dedicated project lead, supplemented by specialized subcontractors." Government evaluators respect transparency. They WILL ask during demo.`,
        reviewNotes: "Must identify real people — evaluators may request interviews", lastUpdated: "", assignee: "Dr. Flood",
        pageLimit: "3-5 pages", wordCount: "1,000-2,000 words",
      },
      {
        id: "chcms-pastperf", name: "Section 5: Past Performance & References", description: "3+ relevant contracts with contacts — THIS IS WHERE BIDS ARE WON OR LOST",
        icon: Trophy, status: "not-started" as ApprovalStatus,
        content: `PAST PERFORMANCE & REFERENCES — CRITICAL SCORING SECTION

Minimum 3 references. Government evaluators WILL call them. Notify them in advance.

CONTRACT 1: [PROJECT NAME]
Client: [CLIENT — government agency, healthcare system, etc.]
Contract Value: $[AMOUNT] | Period: [START] — [END]
Description: [2-3 sentences: what you delivered, scale, outcomes]
Relevance: [How it relates — compensation, HR tech, public sector, healthcare]
Reference: [NAME, TITLE, PHONE, EMAIL]

CONTRACT 2: [PROJECT NAME]
Client: [CLIENT] | Contract Value: $[AMOUNT] | Period: [START] — [END]
Description: [2-3 sentences] | Relevance: [How it relates]
Reference: [NAME, TITLE, PHONE, EMAIL]

CONTRACT 3: [PROJECT NAME]
Client: [CLIENT] | Contract Value: $[AMOUNT] | Period: [START] — [END]
Description: [2-3 sentences] | Relevance: [How it relates]
Reference: [NAME, TITLE, PHONE, EMAIL]

IF LIMITED FORMAL CONTRACT HISTORY:
The CMS platform itself IS past performance — document the development effort, timeline, technical scope as a case study. Also include: consulting engagements, pro-bono government/nonprofit work, ThriveUp Academy platform (24-platform ACOS ecosystem), academic/research work. Frame honestly — evaluators respect transparency over fabricated experience.`,
        reviewNotes: "Weak references lose more bids than weak tech. Notify references before submission.", lastUpdated: "", assignee: "Dr. Flood",
        pageLimit: "3-5 pages", wordCount: "1,000-2,000 words",
      },
      {
        id: "chcms-pricing", name: "Section 6: Pricing & Cost Proposal", description: "Annual SaaS + implementation — 5-year TCO with specific dollar amounts",
        icon: DollarSign, status: "not-started" as ApprovalStatus,
        content: `PRICING & COST PROPOSAL — EVERY BRACKET MUST HAVE A REAL NUMBER

OPTION A: FULL IMPLEMENTATION (Recommended)
                        Year 1      Year 2      Year 3      Year 4      Year 5
Platform License:       $[___]      $[___]      $[___]      $[___]      $[___]
Implementation:         $[___]      —           —           —           —
Data Migration:         $[___]      —           —           —           —
Training (Initial):     $[___]      —           —           —           —
Support & Maintenance:  Included    $[___]      $[___]      $[___]      $[___]
AI Intelligence:        Included    Included    Included    Included    Included
Annual Total:           $[___]      $[___]      $[___]      $[___]      $[___]
5-Year Total:           $[GRAND TOTAL]

License includes: All 15 modules, unlimited named users, AI engine (briefings, 6 wizards, RAG, alerts), standard integrations (Workday/SAP/PeopleSoft), cloud hosting, SSL/TLS, backups, all updates.

OPTION B: PHASED IMPLEMENTATION
Phase 1 (Mo 1-3): Core — Job Architecture, Market Pricing, Offers, Pay Equity, Analytics, Users — $[___]
Phase 2 (Mo 4-6): Planning — Comp Planning, Total Rewards, Workflow, Integrations — $[___]
Phase 3 (Mo 7-9): Intelligence — AI Hub, Policy, Audit, System Guide, Command Bar — $[___]
Annual License (post-implementation): $[___]/year

OPTIONAL ADD-ONS:
Additional Training: $[___]/session | Custom Integration: $[___]/connector
Custom Reports: $[___]/report | On-Site Support: $[___]/week | Annual Security Audit: $[___]/year

MARKET BENCHMARKS (Central Health ~2,000 employees = mid-to-large):
Mid-size (500-2,000): $150K-$400K Year 1, $60K-$150K/year ongoing
Large (2,000+): $300K-$1M+ Year 1, $100K-$300K/year ongoing

CRITICAL: Don't price too low. Government evaluators are SUSPICIOUS of lowball prices — they assume you can't deliver. Price to show 5-year sustainability.`,
        reviewNotes: "No blanks allowed. Every bracket must be a real dollar amount.", lastUpdated: "", assignee: "Dr. Flood",
        pageLimit: "5-10 pages", wordCount: "2,000-3,000 words",
      },
      {
        id: "chcms-sla", name: "Section 7: Service Level Agreements", description: "Uptime, incident response, SLA credits, performance targets, data protection",
        icon: Shield, status: "draft" as ApprovalStatus,
        content: `SERVICE LEVEL AGREEMENTS

SYSTEM AVAILABILITY:
Uptime: 99.9% monthly (excludes scheduled maintenance)
Maintenance window: Sundays 2:00-6:00 AM CT, 72-hour advance notice
Unscheduled downtime cap: 43 minutes/month
DR RTO: 4 hours | DR RPO: 1 hour (continuous backups)

INCIDENT RESPONSE:
P1 Critical (system down, data at risk): Response 30 min, Resolve 4 hours
P2 High (major feature unavailable): Response 1 hour, Resolve 8 business hours
P3 Medium (degraded, workaround exists): Response 4 business hours, Resolve 2 business days
P4 Low (cosmetic, enhancements): Response 1 business day, Resolve next release

SUPPORT CHANNELS:
Emergency Hotline: 24/7/365 (P1 only) | Email: M-F 8AM-6PM CT
Support Portal: 24/7 self-service | Dedicated Account Manager: business hours

SLA CREDITS: 99.9%-99.5%: 5% | 99.5%-99.0%: 10% | Below 99.0%: 25%

PERFORMANCE TARGETS:
Page load: <3s (95th percentile) | API response: <500ms | Reports: <10s
Batch import: <5 min for 10K records | AI generation: <15s

DATA PROTECTION:
Encryption: AES-256 at rest, TLS 1.2+ in transit | Backup: Continuous, 30-day retention
Residency: US only | Ownership: Central Health at all times
Portability: Full CSV/JSON export anytime | Deletion: 30 days post-termination with certification`,
        reviewNotes: "Review uptime commitments against hosting capabilities. Consider dedicated cloud for production.", lastUpdated: "", assignee: "Dr. Flood",
        pageLimit: "5-8 pages", wordCount: "2,000-3,000 words",
      },
      {
        id: "chcms-migration", name: "Section 8: Data Migration Plan", description: "4-phase migration with hour-by-hour cutover schedule and rollback triggers",
        icon: Layers, status: "draft" as ApprovalStatus,
        content: `DATA MIGRATION — 4-PHASE PLAN WITH CUTOVER SCHEDULE

PHASE 1: ASSESSMENT & DISCOVERY (Weeks 1-2)
Identify all compensation data sources → Data Source Inventory
Document structures, formats, volumes → Data Dictionary
Assess data quality → Data Quality Report
Map source fields to CMS schema → Field Mapping Document
Define transformation rules → Transformation Rules Document
Define scope and exclusions → Migration Scope Agreement

PHASE 2: DESIGN & BUILD (Weeks 3-4)
Design ETL pipelines → ETL Design Document
Build extraction scripts → Extraction Scripts
Develop transformation logic (cleansing, normalization, dedup) → Transformation Scripts
Create validation rules and checksums → Validation Framework
Build reconciliation reports → Reconciliation Templates

PHASE 3: TEST MIGRATION (Weeks 5-6)
Dry-run #1 with full production data copy → Test Results
Automated validation (counts, checksums, referential integrity) → Validation Report
UAT — Central Health staff verify migrated data → UAT Sign-off
Resolve issues → Issue Log | Dry-run #2 with fixes → Revised Results

PHASE 4: PRODUCTION CUTOVER (Week 7)
Friday 5:00 PM CT — Freeze changes in source system
Friday 6:00 PM CT — Final data extraction
Friday 6:30 PM - Saturday 6:00 AM CT — Execute production migration
Saturday 6:00 AM - 10:00 AM CT — Run validation suite
Saturday 10:00 AM - 2:00 PM CT — Central Health spot-check
Saturday 2:00 PM CT — Go / No-Go decision
Monday 8:00 AM CT — System live for users

ROLLBACK: Critical integrity failure → abort + restore (2 hrs) | >1% error rate → roll back (4 hrs) | User issues within 48 hrs → parallel run

DATA ENTITIES: Employees (active + termed), Position classifications, Job families/levels, Salary bands, Current comp data — all Critical. Benefits/total rewards, Market surveys — High. Historical offers, Equity history — Medium.`,
        reviewNotes: "Entity counts estimated during discovery phase", lastUpdated: "", assignee: "Dr. Flood + AI",
        pageLimit: "8-12 pages", wordCount: "3,000-4,000 words",
      },
      {
        id: "chcms-timeline", name: "Section 9: Implementation Timeline", description: "12-week schedule with milestones — accelerated because system is already built",
        icon: Clock, status: "draft" as ApprovalStatus,
        content: `IMPLEMENTATION TIMELINE — 12 WEEKS (Accelerated: system already deployed)

WEEK 1-2: PROJECT KICKOFF & DISCOVERY
Kickoff with Central Health stakeholders | Requirements validation against live system
Current state documentation | Data migration assessment (Phase 1) | Integration access setup

WEEK 3-4: CONFIGURATION & DATA MIGRATION DESIGN
Org structure configuration | RBAC role assignment | Integration connector config (HRIS)
Data migration ETL design (Phase 2) | Salary band and grade structure alignment

WEEK 5-6: DATA MIGRATION TESTING & INTEGRATION
Test migration dry-run #1 (Phase 3) | HRIS integration testing (Workday/SAP/PeopleSoft)
Webhook validation | UAT environment provisioning | Reconciliation and issue resolution

WEEK 7-8: USER ACCEPTANCE TESTING
UAT with Central Health HR team | Test migration dry-run #2
Workflow pipeline configuration (approval chains, escalation rules)
Policy and knowledge base population | Defect resolution and retesting

WEEK 9-10: TRAINING (CFIR 2.0 Individuals Domain)
HR Admin training (2 days) | Compensation Analyst training (2 days)
Department Manager training (1 day) | Executive/Board overview (half day)
Train-the-trainer sessions (1 day)

WEEK 11: PRODUCTION MIGRATION & CUTOVER
Final data freeze and extraction | Production migration execution
Validation and reconciliation | Go/No-Go decision → Go-live

WEEK 12: HYPERCARE & STABILIZATION
On-site support | Issue triage and rapid resolution | Performance monitoring
User feedback collection | Transition to standard support

MILESTONES: Contract Award → [DATE] | Kickoff → Award + 5 days | Discovery → +2 wks
UAT Ready → +6 wks | UAT Sign-off → +8 wks | Training → +10 wks | Go-Live → +11 wks | Hypercare → +12 wks`,
        reviewNotes: "12-week timeline credible because system is already built and deployed", lastUpdated: "", assignee: "Dr. Flood + AI",
        pageLimit: "3-5 pages", wordCount: "1,000-2,000 words",
      },
      {
        id: "chcms-cfir", name: "Section 10: Implementation & Adoption Strategy (CFIR 2.0)", description: "Evidence-based implementation science framework — YOUR COMPETITIVE ADVANTAGE",
        icon: Sparkles, status: "draft" as ApprovalStatus,
        content: `IMPLEMENTATION & ADOPTION STRATEGY — CFIR 2.0 ALIGNED
This is your competitive advantage. Most vendors deliver software. You deliver sustained organizational change backed by implementation science.

The deployment of the Compensation Management System is guided by the Consolidated Framework for Implementation Research (CFIR 2.0) — an evidence-based model that ensures successful adoption, sustainability, and organizational integration.

INNOVATION CHARACTERISTICS:
The platform is fully deployed, reducing uncertainty and enabling immediate usability. Evaluators interact with a working system — not wireframes, not demos, not promises. This eliminates the adoption barrier of "will it actually work?"
System features: Live system access, pre-seeded data, welcome video, guided onboarding

OUTER SETTING:
Aligns with Central Health's external pressures: healthcare workforce shortage, Austin market wage competition, Travis County board governance requirements, taxpayer accountability mandates, federal/state regulatory compliance (FLSA, pay equity).
System features: Market benchmarking (Austin MSA calibration), community impact dashboard (300K+ residents), policy & regulatory tracking, NIST 800-53 compliance

INNER SETTING:
Configured to Central Health's existing organizational structure: HR workflows, governance processes (Four Amigos), compensation philosophy, role-based access that mirrors actual authority levels.
System features: RBAC (7 roles matching org hierarchy), Four Amigos governance triggers, department-level budgeting, configurable workflow pipelines, policy knowledge base

INDIVIDUALS:
Role-specific training, AI-assisted decision support, and contextual education improve user capability, confidence, and self-efficacy. The system teaches — it doesn't just process. Users learn compensation principles through every interaction.
System features: 6 AI wizards with step-by-step reasoning, module intelligence headers ("Why This Matters"), SOP viewer, tutorial system, 5-day onboarding plan, Command Bar contextual help

IMPLEMENTATION PROCESS:
Structured 12-week rollout with iterative feedback loops, phased data migration with rollback capability, UAT with real users, hypercare support, and continuous optimization through embedded analytics.
System features: Implementation timeline (Section 9), data migration plan with rollback (Section 8), quarterly business reviews, post-go-live survey, usage analytics

WHY THIS MATTERS FOR CENTRAL HEALTH:
Most compensation system implementations fail not because the software doesn't work, but because the organization doesn't adopt it. CFIR 2.0 framing ensures we address the five domains that determine whether a new system becomes embedded in organizational practice — or becomes shelfware.

This system is designed to be adopted, not just installed.`,
        reviewNotes: "This section elevates the entire proposal from 'software vendor' to 'implementation science partner'", lastUpdated: "March 30, 2026", assignee: "Dr. Flood + AI",
        pageLimit: "3-5 pages", wordCount: "1,500-2,500 words",
      },
      {
        id: "chcms-training", name: "Section 11: Training & Organizational Change Management", description: "Role-based training + behavioral adoption + 4-phase change management",
        icon: GraduationCap, status: "draft" as ApprovalStatus,
        content: `TRAINING & ORGANIZATIONAL CHANGE MANAGEMENT
Training is role-based, hands-on, conducted in the live system with Central Health's own data, and grounded in adult learning principles: users learn by doing, not by watching slides.

ROLE-BASED TRAINING:
HR Administrator (HR Director, HRIS team): 2 days (16 hrs) — All modules, user management, integrations, AI wizards, workflow admin
Compensation Analyst (Comp team): 2 days (16 hrs) — Job architecture, market pricing, offers, equity, comp planning, total rewards, AI tools
Department Manager (Dept heads): 1 day (8 hrs) — Dashboard, offers (review/approve), merit worksheets, total rewards, reporting
Executive / Board (Leadership): Half day (4 hrs) — Dashboard, analytics, AI briefings, community impact, reporting
Train-the-Trainer (Internal trainers): 1 day (8 hrs) — Complete system walkthrough, delivery methodology, materials handoff

EMBEDDED LEARNING SYSTEM (Behavioral Reinforcement):
Unlike traditional training that happens once and fades, this system embeds learning directly into daily workflows:

AI Teaching Mode: Every wizard explains reasoning — users learn WHY, not just WHAT (elaborative interrogation → lasting knowledge)
Module Intelligence Headers: "Why This Matters" context connects every task to Central Health's mission (goal framing → increased motivation)
Community Impact Visibility: Dashboard shows appointments at risk, population served — every session reinforces the stakes (consequential feedback → engagement)
Proactive AI Alerts: System surfaces issues before users look for them (variable-ratio reinforcement → sustained attention)
Contextual Command Bar: Adapts to current module — answers questions before users ask (just-in-time learning → highest retention)
Four Amigos Governance Alerts: Triggered at institutional thresholds — teaches governance through real scenarios (situated learning → authentic contexts)

SELF-SERVICE TRAINING (Included at no cost):
75-second animated welcome video | 3-step guided onboarding overlay | Multi-step tutorials for every module
Searchable SOP viewer (5 tabs: Overview, Step-by-Step, Governance, Templates, Compliance)
System Architecture Guide with evaluation checklists | 5-day structured onboarding plan
Contextual help buttons on every page | AI knowledge base with searchable policy documents

ORGANIZATIONAL CHANGE MANAGEMENT — 4 PHASES:
PRE-LAUNCH (Weeks 1-8): Stakeholder interviews, workflow mapping, change readiness assessment, champion identification, communication plan → Organization prepared, key influencers aligned
LAUNCH (Weeks 9-11): Role-specific training, go-live communications, Day 1 experience with welcome video and guided onboarding, floor support → Users confident and supported
REINFORCEMENT (Weeks 12-24): Usage monitoring, targeted coaching for low-adoption areas, monthly tips, quarterly optimization reviews, feedback → Adoption deepens from compliance to commitment
SUSTAINABILITY (Ongoing): Train-the-trainer ensures internal capability, AI provides continuous education, quarterly business reviews, annual satisfaction survey → System embedded in organizational practice

CHANGE MANAGEMENT DELIVERABLES:
Change Readiness Assessment (5 dimensions) | Stakeholder Communication Plan (phased)
Champion Network Guide (peer adoption toolkit) | FAQ Document | Quick Reference Cards (per role)
Go-Live Readiness Checklist (40+ items) | Post-Go-Live Pulse Survey (30/60/90 day)
Adoption Dashboard (department-level engagement for leadership)`,
        reviewNotes: "Behavioral science framing distinguishes this from every other vendor's training section", lastUpdated: "March 30, 2026", assignee: "Dr. Flood + AI",
        pageLimit: "5-8 pages", wordCount: "2,500-3,500 words",
      },
      {
        id: "chcms-reaim", name: "Section 12: Outcomes Evaluation Framework (RE-AIM)", description: "Evidence-based measurement framework — proves ROI in language evaluators understand",
        icon: BarChart3, status: "draft" as ApprovalStatus,
        content: `OUTCOMES EVALUATION FRAMEWORK — RE-AIM
Measuring what matters. RE-AIM ensures success is measured not just in uptime and feature delivery, but in real organizational outcomes.

REACH:
• % of eligible users actively using the system → Target: >90% HR/Comp staff within 60 days; >70% managers within 90 days (Login analytics, session tracking)
• % of compensation decisions made through system vs. offline → Target: >95% within 6 months (Audit trail analysis)

EFFECTIVENESS:
• Reduction in pay equity variance across protected classes → Target: <3% variance mandate maintained/achieved (Equity analysis trend data)
• Improvement in market competitiveness (avg compa-ratio) → Target: 95%-105% of P50 (Market pricing analytics)
• Reduction in time-to-offer → Target: <3 business days (Offer management tracking)
• Reduction in voluntary turnover for below-market employees → Target: Measurable decrease within 12 months (Employee data cross-referenced with exit data)

ADOPTION:
• Department-level system usage rates → Target: All departments >80% within 6 months (Usage analytics by department)
• AI wizard utilization → Target: >50% of eligible users engaging AI monthly (AI module analytics)
• Self-service training completion → Target: >85% complete onboarding within first week (Tutorial tracking)

IMPLEMENTATION:
• SLA adherence → Target: 99.9% uptime, response times within SLA (Automated monitoring)
• Training completion by role → Target: 100% before go-live (Attendance + system tracking)
• Data migration accuracy → Target: <0.1% error rate (Validation reports)
• Workflow pipeline throughput → Target: >95% within RAG green threshold (Pipeline dashboard)

MAINTENANCE:
• Sustained usage at 6 and 12 months → Target: No significant decline from peak (Login analytics, feature utilization)
• User satisfaction → Target: >4.0/5.0 average (Annual survey)
• Knowledge base growth → Target: Continuous growth indicating organizational learning (Entry count + update frequency)
• System evolution → Target: Active engagement with roadmap (Quarterly business review logs)

REPORTING CADENCE:
Adoption Pulse: Monthly (first 6 months) → Project sponsors, HR leadership
Effectiveness Review: Quarterly → HR leadership, board
Implementation Scorecard: Monthly during implementation, quarterly after → Project team, IT leadership
Annual Outcomes Report: Annually → Board, executive leadership → Full RE-AIM evaluation, ROI analysis, strategic recommendations

WHY RE-AIM MATTERS FOR THIS PROCUREMENT:
Government procurements are evaluated not just on what a vendor promises to deliver, but on how a vendor proves it was delivered. RE-AIM provides a structured, evidence-based framework for demonstrating return on investment — in language that resonates with public health leaders, board members, and taxpayers alike.

This system doesn't just track compensation. It proves that compensation strategy is working — and shows who benefits when it does.`,
        reviewNotes: "RE-AIM + CFIR 2.0 together create an implementation science foundation no other vendor will match", lastUpdated: "March 30, 2026", assignee: "Dr. Flood + AI",
        pageLimit: "3-5 pages", wordCount: "1,500-2,500 words",
      },
      {
        id: "chcms-support", name: "Section 13: Ongoing Support & Maintenance", description: "Annual maintenance inclusions, 4-level escalation, quarterly business reviews",
        icon: Headphones, status: "draft" as ApprovalStatus,
        content: `ONGOING SUPPORT & MAINTENANCE

ANNUAL MAINTENANCE INCLUDES:
Software updates and patches — all updates included
Security patches — critical patches within 24 hours
New feature releases — all platform enhancements
AI model updates — as improved models become available
Database maintenance — automated optimization, backup verification
Uptime monitoring — 24/7 automated with alerting
Dedicated account manager — single point of contact
Quarterly business reviews — usage analytics, roadmap preview, optimization recommendations
Annual security assessment — vulnerability scanning and remediation

SUPPORT ESCALATION PATH:
Level 1: Support Portal / Email → Support engineer triages (target: 80% resolved at L1)
Level 2: Senior Engineer → Complex technical issues, code-level investigation
Level 3: Engineering Lead / Architect → Critical system issues, data integrity, security incidents
Level 4: Account Executive / Management → SLA disputes, contract issues, strategic escalations`,
        reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood",
        pageLimit: "2-3 pages", wordCount: "800-1,200 words",
      },
      {
        id: "chcms-insurance", name: "Section 14: Insurance & Compliance Certifications", description: "Required coverage + NIST, HIPAA, SOC 2, FISMA, ADA compliance",
        icon: Scale, status: "not-started" as ApprovalStatus,
        content: `INSURANCE & COMPLIANCE

REQUIRED INSURANCE:
Commercial General Liability: $1M per occurrence / $2M aggregate — [Active / Need to obtain]
Professional Liability (E&O): $1M per claim / $2M aggregate — [Active / Need to obtain]
Cyber Liability / Data Breach: $2M per occurrence — [Active / Need to obtain]
Workers' Compensation: Statutory limits — [Active / N/A]
Commercial Auto: $1M combined single limit — [Active / N/A]
Umbrella / Excess: $2M — [Active / Need to obtain]

"Certificates of Insurance will be provided to Central Health upon contract award. Central Health will be named as Additional Insured on all applicable policies."

COMPLIANCE CERTIFICATIONS:
NIST 800-53: Implemented — built-in compliance checklist with item-by-item tracking
HIPAA: [Compliant / In Progress] — [BAA available upon request]
SOC 2 Type II: [Certified / In Progress / Planned] — [Timeline]
FISMA: [Compliant / Self-assessed]
ADA / Section 508: Compliant — WCAG 2.1 AA-compliant component library

ACTION: Contact insurance broker for C&IP LLC. Get COIs ready. Determine HIPAA BAA need. Cyber liability is critical for healthcare data.`,
        reviewNotes: "Insurance broker call is time-sensitive — underwriting takes 1-2 weeks", lastUpdated: "", assignee: "Dr. Flood",
        pageLimit: "2-3 pages", wordCount: "500-1,000 words",
      },
      {
        id: "chcms-hub", name: "Section 15: HUB / Small Business Certifications", description: "Texas HUB, VOSB, SDVOSB, SBA 8(a), MBE — significant scoring advantage",
        icon: Star, status: "not-started" as ApprovalStatus,
        content: `HUB & SMALL BUSINESS CERTIFICATIONS

TEXAS HUB (Highest Priority):
Status: [Certified / Application Submitted / Pending]
Certificate #: [NUMBER]
Category: [Veteran-Owned / Minority-Owned / Service-Disabled Veteran]
Agency: Texas Comptroller of Public Accounts
Expiration: [DATE]

OTHER CERTIFICATIONS:
SBA 8(a): [Status] | SBA HUBZone: [Status] | SDVOSB: [Status] | VOSB: [Status]
State of Texas VID: [Number]

APPLY NOW: comptroller.texas.gov/purchasing/vendor/hub/
Processing: 5-10 business days. FREE. Veteran-owned + minority-led = strong qualification.
Even if pending: "HUB certification application submitted [date], status: pending"

HUB status = significant scoring advantage in Travis County procurement. Do not leave these points on the table.`,
        reviewNotes: "Apply for HUB THIS WEEK — free and fast", lastUpdated: "", assignee: "Dr. Flood",
        pageLimit: "1-2 pages", wordCount: "300-500 words",
      },
      {
        id: "chcms-assumptions", name: "Section 16: Assumptions & Exceptions", description: "Central Health responsibilities, scope boundaries, exclusions",
        icon: FileText, status: "draft" as ApprovalStatus,
        content: `ASSUMPTIONS:
• Central Health will provide timely access to existing HRIS/compensation data
• Central Health will designate a project lead and stakeholders for weekly meetings
• Central Health will provide VPN or secure access to integration endpoints (Workday/SAP/PeopleSoft)
• UAT will be completed within the scheduled 2-week window
• Existing data is in structured format (database, CSV, or API-accessible)
• Training scheduled during business hours with dedicated facilities or virtual rooms
• Go-live date assumes no scope changes beyond Solicitation #2603-002

EXCEPTIONS:
• Custom integrations beyond Workday/SAP/PeopleSoft require separate scope and cost
• Historical data beyond [X] years may require additional assessment and pricing
• Third-party software licenses (HRIS vendor API fees) are Central Health's responsibility
• Physical infrastructure, network, and end-user devices are Central Health's responsibility`,
        reviewNotes: "Standard assumptions — review for completeness before submission", lastUpdated: "", assignee: "Dr. Flood",
        pageLimit: "1-2 pages", wordCount: "300-500 words",
      },
      {
        id: "chcms-appendices", name: "Section 17: Appendices", description: "Capability packet, exec slides, live system, resumes, COIs, HUB cert",
        icon: Layers, status: "not-started" as ApprovalStatus,
        content: `APPENDICES

Appendix A: Capability Packet (Technical/Functional) — DONE
Complete 15-module technical documentation. See capability-packet.md

Appendix B: Executive Summary Slide Deck — [NEED TO CREATE]
7-slide board-level presentation

Appendix C: Live System Access — DEPLOYED
URL: https://centralhealthcms.com | Backup: https://secure-health-plug.replit.app
Evaluators can create an account (first user → HR Admin role) and immediately explore all 15 modules

Appendix D: Resumes of Key Personnel — [DR. FLOOD TO PROVIDE]

Appendix E: Certificates of Insurance — [PENDING BROKER]

Appendix F: HUB Certification — [PENDING APPLICATION]

Appendix G: Sample Reports — [OPTIONAL: screenshots of system reports]

PROPOSAL SUBMISSION CHECKLIST:
☐ Cover letter signed by authorized representative
☐ Strategic Value Narrative reviewed
☐ Company profile with all fields completed
☐ Key personnel identified with resumes
☐ Past performance / references — at least 3
☐ Pricing completed with specific dollar amounts
☐ SLA commitments reviewed and confirmed
☐ Data migration plan reviewed
☐ Implementation timeline confirmed
☐ CFIR 2.0 implementation strategy included
☐ Training & change management plan complete
☐ RE-AIM outcomes framework included
☐ Insurance certificates attached
☐ HUB certification attached or application filed
☐ Capability Packet attached
☐ Live system URL tested and accessible
☐ All [BRACKETED FIELDS] replaced with actual information
☐ Document reviewed for accuracy and completeness
☐ Submitted before April 24, 2026 3:00 PM EDT deadline`,
        reviewNotes: "Use checklist to verify completeness before submission", lastUpdated: "", assignee: "Dr. Flood",
        pageLimit: "Variable", wordCount: "Supporting documents",
      },
    ],
    phases: [
      {
        id: "collaborate" as PhaseId, name: "1. Build System & Deploy", description: "Develop the platform, deploy, and populate evaluation data", status: "active" as const,
        tasks: [
          { id: "ch1", task: "Build 15-module CMS platform", owner: "Dr. Flood + AI", status: "done" as const, dueDate: "March 28, 2026" },
          { id: "ch2", task: "Deploy to centralhealthcms.com", owner: "Dr. Flood", status: "done" as const, dueDate: "March 28, 2026" },
          { id: "ch3", task: "Write capability packet & technical proposal", owner: "Dr. Flood + AI", status: "done" as const, dueDate: "March 28, 2026" },
          { id: "ch4", task: "Seed evaluation data — job families, positions, employees, benchmarks", owner: "Dr. Flood + AI", status: "in-progress" as const, dueDate: "April 5, 2026", guidance: "6 job families seeded. Continue populating positions, grade levels, employee records, market benchmarks, sample offers, equity analysis, and comp plan." },
        ],
      },
      {
        id: "build" as PhaseId, name: "2. Complete Proposal Package", description: "Write remaining business proposal sections", status: "active" as const,
        tasks: [
          { id: "ch5", task: "Develop pricing / cost proposal", owner: "Dr. Flood", status: "pending" as const, dueDate: "April 10, 2026", guidance: "Research comparable compensation system pricing (Payscale, Decusoft, Salary.com enterprise). Central Health budget supports enterprise pricing but be competitive. Include 5-year TCO.", aiCanHelp: true, aiAction: "Draft pricing framework based on market research" },
          { id: "ch6", task: "Write vendor qualifications with past performance", owner: "Dr. Flood", status: "pending" as const, dueDate: "April 10, 2026", guidance: "List all comparable consulting/technology projects. Even if not identical, show pattern: system builds, HR consulting, government contracts, healthcare work. Include 3 references." },
          { id: "ch7", task: "Finalize SLA documentation", owner: "Dr. Flood + AI", status: "pending" as const, dueDate: "April 12, 2026", guidance: "Use the template provided. Adjust numbers based on your actual hosting capabilities. 99.9% uptime is standard for SaaS; ensure your Replit deployment can meet this.", aiCanHelp: true, aiAction: "Refine SLA terms" },
          { id: "ch8", task: "Document data migration plan", owner: "Dr. Flood + AI", status: "pending" as const, dueDate: "April 12, 2026", guidance: "Customize the template for Central Health's specific systems. Find out what HRIS they currently use (likely Workday or PeopleSoft). The migration plan should be specific to their environment.", aiCanHelp: true, aiAction: "Customize migration plan" },
          { id: "ch9", task: "Obtain insurance quotes / COIs", owner: "Dr. Flood", status: "pending" as const, dueDate: "April 15, 2026", guidance: "Contact your insurance broker. You need general liability, professional liability (E&O), and cyber liability at minimum. Get quotes for C&IP LLC. Government contracts require COIs before execution." },
          { id: "ch10", task: "Submit HUB certification application", owner: "Dr. Flood", status: "pending" as const, dueDate: "April 5, 2026", guidance: "Apply at comptroller.texas.gov/purchasing/vendor/hub/. Free application. Even if pending at proposal time, note 'application submitted' in your bid. Veteran-owned + minority-led = strong qualification." },
        ],
      },
      {
        id: "review" as PhaseId, name: "3. Review & Finalize", description: "Final review + RPLICE quality gate", status: "upcoming" as const,
        tasks: [
          { id: "chr0", task: "RPLICE quality review — CFIR 2.0 + RE-AIM + fidelity checklist against proposal", owner: "RPLICE System", status: "pending" as const, dueDate: "April 16, 2026", guidance: "Standard operating procedure: Run full RPLICE assessment suite. Central Health is a contract, not a grant — focus fidelity checklist on vendor qualifications, past performance, and technical approach compliance with solicitation requirements." },
          { id: "chr1", task: "Address RPLICE critical findings", owner: "Dr. Flood", status: "pending" as const, dueDate: "April 17, 2026" },
          { id: "chr2", task: "Compile complete proposal package", owner: "Dr. Flood + AI", status: "pending" as const, dueDate: "April 18, 2026" },
          { id: "chr3", task: "RPLICE re-assessment — confirm fidelity ≥ 85/100", owner: "RPLICE System", status: "pending" as const, dueDate: "April 19, 2026" },
          { id: "chr4", task: "Final compliance review against solicitation requirements", owner: "Dr. Flood", status: "pending" as const, dueDate: "April 20, 2026" },
          { id: "chr5", task: "Verify live system is fully operational", owner: "Dr. Flood", status: "pending" as const, dueDate: "April 22, 2026" },
        ],
      },
      {
        id: "submit" as PhaseId, name: "4. Submit on BidNet", description: "Submit complete proposal via BidNet Direct", status: "upcoming" as const,
        tasks: [
          { id: "ch14", task: "Submit proposal via BidNet Direct", owner: "Dr. Flood", status: "pending" as const, dueDate: "April 23, 2026", guidance: "Submit at least 24 hours before deadline. BidNet can have upload issues at deadline. Deadline: April 24, 2026 3:00 PM EDT." },
          { id: "ch15", task: "Confirm receipt with Central Health procurement", owner: "Dr. Flood", status: "pending" as const, dueDate: "April 24, 2026" },
        ],
      },
      {
        id: "pre-execute" as PhaseId, name: "5. Post-Award Readiness", description: "Prepare for contract execution if awarded", status: "upcoming" as const,
        tasks: [
          { id: "ch16", task: "Prepare for vendor presentation / demo if invited", owner: "Dr. Flood", status: "pending" as const, dueDate: "TBD" },
          { id: "ch17", task: "Finalize insurance certificates naming Central Health", owner: "Dr. Flood", status: "pending" as const, dueDate: "TBD" },
          { id: "ch18", task: "Prepare implementation timeline for contract negotiation", owner: "Dr. Flood + AI", status: "pending" as const, dueDate: "TBD" },
        ],
      },
    ],
    preExecutionChecklist: [
      { id: "chpe-1", category: "System", item: "Live system operational at centralhealthcms.com", status: "verified", notes: "Deployed and accessible", guidance: "Verify the live system is accessible and all 15 modules are functional. Test login, navigation, and AI features." },
      { id: "chpe-2", category: "System", item: "Backup URL operational (secure-health-plug.replit.app)", status: "verified", notes: "Backup deployment active", guidance: "Secondary URL in case of DNS issues with custom domain." },
      { id: "chpe-3", category: "Documentation", item: "Capability packet complete", status: "verified", notes: "Full technical proposal written", guidance: "15-module technical documentation, AI engine, workflow, security, architecture." },
      { id: "chpe-4", category: "Documentation", item: "Pricing proposal drafted", status: "action-needed", notes: "Template ready — needs Dr. Flood to set pricing", guidance: "Use comparable market data: enterprise compensation systems typically $50K-$300K/year for organizations of Central Health's size. Price competitively." },
      { id: "chpe-5", category: "Documentation", item: "Vendor qualifications written", status: "action-needed", notes: "Template ready — needs past performance details", guidance: "Fill in comparable projects, references, and team qualifications. Even adjacent experience (HR consulting, workforce systems) strengthens the bid." },
      { id: "chpe-6", category: "Documentation", item: "SLA finalized", status: "action-needed", notes: "Template ready — review and customize terms", guidance: "Standard SaaS SLA with 99.9% uptime, tiered response times, service credits. Adjust based on hosting capabilities." },
      { id: "chpe-7", category: "Documentation", item: "Data migration plan completed", status: "action-needed", notes: "Template ready — needs Central Health system specifics", guidance: "Customize for their current HRIS. If unknown, keep the plan generic but comprehensive." },
      { id: "chpe-8", category: "Compliance", item: "Insurance coverage verified", status: "action-needed", notes: "Contact insurance broker for C&IP LLC", guidance: "Need general liability, E&O, cyber liability. Get quotes and COIs." },
      { id: "chpe-9", category: "Compliance", item: "HUB certification submitted", status: "action-needed", notes: "Apply at Texas Comptroller — free", guidance: "https://comptroller.texas.gov/purchasing/vendor/hub/ — VOSB + minority-owned qualifies." },
      { id: "chpe-10", category: "Submission", item: "BidNet Direct account ready", status: "pending", notes: "Ensure account can submit to Central Health", guidance: "Verify your BidNet account can submit to Travis County Healthcare District solicitations." },
    ],
    winStrategy: {
      differentiators: [
        "CFIR 2.0 + RE-AIM implementation science — you deliver organizational change, not just software. No other vendor will have this.",
        "Fully operational Day 1 — competitors promise roadmaps, you deliver a live system evaluators can test today",
        "AI-native architecture with RAG — integrated intelligence across all 15 modules, not bolted-on AI",
        "Purpose-built for Central Health — Austin TX market calibrated, 300,000 resident community impact baked in",
        "Behavioral reinforcement training model — system teaches through every interaction (elaborative interrogation, situated learning, just-in-time guidance)",
        "Veteran-owned, minority-led small business — HUB preference points in Texas procurement",
        "Strategic Value Narrative connects every compensation decision to patient care outcomes — evaluators see mission alignment immediately",
        "Four Amigos governance framework + RAG accountability system — institutional safeguards built into workflows",
      ],
      reviewerPriorities: [
        "Does the system actually work? (Live demo at centralhealthcms.com answers this definitively)",
        "Implementation approach — can the vendor ensure successful adoption? (CFIR 2.0 answers this)",
        "How will success be measured? (RE-AIM framework with specific targets and reporting cadence)",
        "Integration with existing HRIS (Workday/SAP/PeopleSoft connectors already configured)",
        "Security and compliance (NIST 800-53, RBAC, audit trail — all built in)",
        "Total cost of ownership over 5-year contract period",
        "Change management — will staff actually use the system? (Behavioral adoption strategy + 4-phase OCM)",
        "Vendor ability to support and maintain post-implementation",
      ],
      scoringTips: [
        "Lead with the Strategic Value Narrative — connect compensation to Central Health's mission FIRST, then show features",
        "Invite evaluators to test centralhealthcms.com themselves — Day 1 readiness vs. competitors' 6-12 month timelines",
        "Emphasize CFIR 2.0 + RE-AIM — this is your implementation science advantage. Most vendors deliver software; you deliver sustained organizational change.",
        "Show the AI wizards teaching, not just answering — the behavioral reinforcement model is your most compelling differentiator",
        "Quantify everything: 15 modules, 50+ API routes, 7 RBAC roles, 6 AI wizards, 4 integration connectors, 12-week implementation",
        "Use the RE-AIM targets in your pricing justification — tie cost to measurable outcomes (>90% adoption, <3% equity variance, <3-day time-to-offer)",
      ],
      commonPitfalls: [
        "Submitting without pricing — this is a procurement, cost is always scored. Every bracket must have a real dollar amount.",
        "No vendor references — government evaluators WILL call them. Notify references in advance.",
        "Missing insurance documentation — can disqualify even the best technical proposal",
        "Not applying for HUB certification — free, 5-10 days, significant scoring advantage. Apply THIS WEEK.",
        "App URL not working during evaluation — test centralhealthcms.com daily until decision",
        "Submitting at the deadline — BidNet has upload issues, submit 24+ hours early",
        "Omitting CFIR 2.0 / RE-AIM from the proposal — these frameworks are what elevate this from 'vendor response' to 'implementation science partner'",
      ],
    },
  },
  {
    id: "bb-collective",
    name: "BB Collective Research",
    fullName: "BB Collective Research Grant — Community-Driven Implementation Science",
    funder: "BB Collective",
    amount: "$50,000",
    deadline: "April 13, 2026",
    deadlineUrgency: "urgent" as const,
    icon: Microscope,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
    description: "Research grant supporting Black-led organizations conducting community-driven research. TCAF proposes RPLICE + CARE Model integration — combining AI-powered implementation science with ethical community data practices.",
    referenceUrl: "https://bbcollectiveresearch.org",
    referenceLabel: "BB Collective Research Grant",
    grantKnowledge: `BB Collective Research Grant — $50,000.
PURPOSE: Support Black-led organizations conducting community-driven research that addresses systemic inequities. Prioritizes research methodologies that center lived experience and community voice.
ALIGNMENT: TCAF's RPLICE platform operationalizes implementation science frameworks (CFIR 2.0, RE-AIM) through AI-powered analysis. Combined with MEASURE's CARE Model for equity-centered evaluation, this creates a publishable, fundable methodology for ethical community AI.
SUBMITTING ENTITY: The Collaborative Advocate Foundation — EIN 41-3618003, 501(c)(3).`,
    essentials: [
      { label: "Black-Led Organization", detail: "TCAF is veteran-founded, Black-led 501(c)(3) — Dr. Terry Flood, DHA, is President and principal researcher", critical: true },
      { label: "Community-Driven Research", detail: "Three Realities methodology + RPLICE RAG architecture ensures research is driven by community voice, not institutional assumption", critical: true },
      { label: "April 13 Deadline", detail: "Submission deadline April 13, 2026 — 2 weeks from today", critical: true },
      { label: "$50K Award", detail: "Single-year research grant — fundable scope: RPLICE + CARE Model integration pilot" },
      { label: "Publishable Methodology", detail: "MAP-GAP + CARE Model = peer-reviewable framework for ethical AI in community settings" },
    ],
    competitiveEdge: [
      "Only applicant with a live AI-powered implementation science platform (RPLICE) — not a proposal, a working system",
      "4-engine RAG architecture (GPT-5, Claude, 6 scholarly databases, ecosystem context) with anti-hallucination guardrails and APA citations",
      "Three Realities methodology centers community voice — exactly what BB Collective requires",
      "MEASURE partnership adds CARE Model governance — ethical AI that community organizations trust",
      "167 database tables of implementation data already collected — not starting from zero",
    ],
    serviceArea: {
      region: "Central Texas",
      state: "Texas",
      counties: ["Travis", "Williamson"],
      city: "Austin",
      keyIndustries: ["Implementation Science", "Community Health", "Workforce Development"],
      targetEmployers: [],
      laborMarketNotes: "Research focuses on implementation fidelity in community-based programs across Central Texas.",
      locationEligibility: "national" as const,
      locationNotes: "National program — TCAF based in Austin/Pflugerville qualifies.",
      multiSiteEligible: false,
    },
    sections: [
      { id: "bb-narrative", name: "Research Narrative", description: "Research question, methodology, RPLICE + CARE Model integration, expected contributions", icon: FileText, status: "draft" as ApprovalStatus,
        content: `RESEARCH NARRATIVE — BB COLLECTIVE RESEARCH GRANT

APPLICANT ORGANIZATION:
The Collaborative Advocate Foundation
EIN: 41-3618003 | 501(c)(3) Nonprofit
17912 Stefano Drive, Pflugerville, TX 78660
Contact: Dr. Terry Flood, DHA — President
Email: president@thecollaborativeadvocate.org | Website: thrivingcommunitiesforall.com

RESEARCH TITLE: "Ethical AI for Community Implementation Science: Integrating RPLICE RAG Architecture with the CARE Model for Equity-Centered Program Evaluation"

RESEARCH QUESTION:
Can an AI-powered implementation science platform (RPLICE), combined with an equity-centered evaluation framework (MEASURE's CARE Model), produce more accurate, community-trusted, and actionable program fidelity assessments than traditional evaluation methods — while ensuring AI outputs remain transparent, cited, and bias-auditable?

BACKGROUND & SIGNIFICANCE:
Implementation science has a measurement problem. Evidence-based programs are adopted by community organizations, but most lack the tools to track whether those programs are being delivered as designed. Traditional evaluation requires expensive external evaluators, produces reports months after data collection, and rarely centers the voice of the communities being served.

RPLICE (Research-to-Practice Implementation with fidelity for all stakeholders) addresses this through AI-powered, real-time implementation tracking. Our 4-engine architecture runs GPT-5 (structured analysis), Claude Sonnet (nuanced reasoning), a Scholarly Research RAG engine querying 6 live academic databases (PubMed, Semantic Scholar, CrossRef, Europe PMC, medRxiv, bioRxiv), and an Ecosystem RAG engine with platform-specific context. Anti-hallucination guardrails ensure every AI output includes APA citations and confidence scores.

However, AI in community settings raises legitimate concerns about bias, extractive data practices, and loss of community voice. MEASURE's CARE Model (Community-centered, Anti-extractive, Research-grounded, Equity-first) provides the governance framework that ensures AI serves communities rather than surveilling them.

METHODOLOGY:
1. PILOT INTEGRATION: Connect MEASURE's Ignite data collection platform to RPLICE's RAG pipeline, enabling AI analysis grounded in both scholarly evidence AND community-collected data.
2. THREE REALITIES DIAGNOSTIC: Apply our proprietary Three Realities methodology (Designed Reality vs. Operational Reality vs. Experienced Reality) to map gaps between intended and actual program delivery.
3. AI FIDELITY ASSESSMENT: Run RPLICE's CFIR 2.0 and RE-AIM assessments against pilot programs, comparing AI-generated fidelity scores against traditional evaluator assessments.
4. COMMUNITY VALIDATION: Present AI-generated findings to community stakeholders through MEASURE's participatory action research process. Measure trust, comprehension, and actionability of AI outputs.
5. BIAS AUDIT: Document every AI output chain for bias auditability — a requirement of ethical AI practice that Meme Styles has championed.

MAP-GAP GOVERNANCE: All research activities follow our MAP-GAP continuous improvement cycle: Orient → Map → Gap → Act → Track → Reflect. This ensures findings are not just published but operationalized.

EXPECTED CONTRIBUTIONS:
- A replicable model for ethical AI in community program evaluation
- Peer-reviewable methodology combining CARE Model + MAP-GAP + RPLICE
- Evidence base for AI-powered implementation science in Black-led organizations
- Open documentation of anti-hallucination guardrails and bias audit protocols

ORGANIZATIONAL QUALIFICATIONS:
Dr. Terry Flood holds a Doctorate in Health Administration, MS in Implementation Science, MA in Psychology, MSHRM, MBA, MSCJ, and Public Policy credentials. U.S. Army Veteran with two Bronze Stars. The 24-platform ACOS ecosystem (thrivingcommunitiesforall.com) demonstrates operational technology infrastructure, not theoretical proposals. RPLICE is live at bettersciencelab.com with 167 database tables and 223+ pages of implementation science tooling.`,
        reviewNotes: "PRIORITY — April 13 deadline. Strong draft. Dr. Flood: add specific pilot program details and MEASURE partnership confirmation.", lastUpdated: "March 30, 2026", assignee: "Dr. Flood + AI", pageLimit: "10 pages", wordCount: "3,000-4,000 words" },
      { id: "bb-budget", name: "Budget & Justification", description: "$50K allocation across research activities, technology, personnel, and dissemination", icon: DollarSign, status: "draft" as ApprovalStatus,
        content: `BUDGET — BB COLLECTIVE RESEARCH GRANT ($50,000)

APPLICANT: The Collaborative Advocate Foundation | EIN: 41-3618003

PERSONNEL ($20,000 — 40%):
- Principal Investigator (Dr. Terry Flood, DHA): $12,000 (20% effort, 12 months)
  Responsibilities: Research design, RPLICE configuration, analysis, publication
- Research Coordinator: $8,000 (25% effort, 12 months)
  Responsibilities: Data collection coordination, community engagement, IRB compliance

TECHNOLOGY & AI INFRASTRUCTURE ($12,000 — 24%):
- RPLICE AI engine operations: $6,000 (GPT-5 + Claude API costs for research queries, RAG pipeline processing against 6 scholarly databases)
- Ignite → RPLICE integration development: $4,000 (data pipeline connecting MEASURE's Ignite platform to RPLICE's RAG engine)
- Data storage and security: $2,000 (encrypted community data storage, HIPAA-aligned practices)

COMMUNITY ENGAGEMENT ($8,000 — 16%):
- Three Realities listening sessions: $3,000 (venue, refreshments, facilitator materials)
- Community participant stipends: $3,000 (compensating community members for research participation)
- MEASURE partnership coordination: $2,000 (joint planning, CARE Model alignment sessions)

DISSEMINATION & PUBLICATION ($5,000 — 10%):
- Open-access publication fees: $2,500
- Conference presentation (Implementation Science conference): $2,500

INDIRECT COSTS ($5,000 — 10%):
- 10% de minimis rate per 2 CFR 200

TOTAL: $50,000

BUDGET JUSTIFICATION:
Technology costs are minimal because RPLICE is already built and operational. The $6,000 AI engine allocation covers marginal API costs for research-specific queries — the platform infrastructure (167 database tables, 223+ pages, 4-engine architecture) is already funded through organizational operations. This means 90% of grant funds go directly to research activities, not platform development.`,
        reviewNotes: "Budget is clean. Dr. Flood: confirm MEASURE partnership cost-share and any in-kind contributions.", lastUpdated: "March 30, 2026", assignee: "Dr. Flood", pageLimit: "2 pages", wordCount: "500-800 words" },
      { id: "bb-org-capacity", name: "Organizational Capacity", description: "Leadership credentials, technology infrastructure, research capability", icon: Building2, status: "draft" as ApprovalStatus,
        content: `ORGANIZATIONAL CAPACITY — THE COLLABORATIVE ADVOCATE FOUNDATION

ORGANIZATION: The Collaborative Advocate Foundation
EIN: 41-3618003 | 501(c)(3) Nonprofit
Address: 17912 Stefano Drive, Pflugerville, TX 78660
Website: thrivingcommunitiesforall.com
Founded: Veteran-founded, Black-led nonprofit

PRINCIPAL INVESTIGATOR:
Dr. Terry Flood, DHA
Credentials: Doctorate in Health Administration, MS Implementation Science, MA Psychology, MSHRM, MBA, MSCJ, Public Policy
Military Service: U.S. Army Veteran — Bronze Star (x2)
Frameworks Developed: MAP-GAP (continuous improvement), SALP (monitoring), Three Realities (community voice), MG-PATR (replication)

TECHNOLOGY INFRASTRUCTURE:
- 24-platform ACOS ecosystem — all live and operational (see appendix for URLs)
- RPLICE implementation science engine: 167 database tables, 223+ pages, CFIR 2.0 + RE-AIM + EPIS operationalized
- 4-Engine AI + RAG Architecture: GPT-5, Claude Sonnet, Scholarly Research RAG (PubMed, Semantic Scholar, CrossRef, Europe PMC, medRxiv, bioRxiv), Ecosystem RAG
- Anti-hallucination guardrails with APA citations on every AI output
- Bias-auditable output chains — every AI recommendation can be traced to source data

AFFILIATED ENTITIES:
- Collaboration & Implementation Professionals LLC (EIN 41-4996540) — VOSB, government contracting
- M&T Consulting Solutions LLC (EIN 41-4952178) — consulting services

RESEARCH CAPABILITY:
RPLICE is not a proposal — it is a live system that has already conducted CFIR 2.0 assessments (scoring 3.96/5.0), RE-AIM evaluations (79.6/100), Three Realities diagnostics (3.17/5.0), and implementation fidelity checklists (68/100) against real grant proposals. Results are persisted in our database and directly inform program improvements through the MAP-GAP cycle.`,
        reviewNotes: "Strong. Dr. Flood: add board member list and any prior research publications or presentations.", lastUpdated: "March 30, 2026", assignee: "Dr. Flood", pageLimit: "3 pages", wordCount: "800-1,200 words" },
    ],
    phases: [
      {
        id: "collaborate" as PhaseId, name: "1. Collaborate & Research", description: "Align research design with BB Collective priorities", status: "active" as const,
        tasks: [
          { id: "bbc1", task: "Finalize research question and RPLICE + CARE Model scope", owner: "Dr. Flood + AI", status: "in-progress" as const, dueDate: "2026-04-05" },
          { id: "bbc2", task: "Confirm MEASURE partnership and Meme's endorsement", owner: "Dr. Flood", status: "pending" as const, dueDate: "2026-04-07" },
          { id: "bbc3", task: "Run RPLICE assessment against draft narrative", owner: "RPLICE System", status: "pending" as const, dueDate: "2026-04-08" },
        ],
      },
      {
        id: "build" as PhaseId, name: "2. Build & Draft", description: "Write research narrative, budget, and capacity statement", status: "active" as const,
        tasks: [
          { id: "bbb1", task: "Draft research narrative with AI/RAG methodology", owner: "AI + Dr. Flood Review", status: "done" as const, dueDate: "2026-03-30" },
          { id: "bbb2", task: "Draft budget with $50K allocation", owner: "Dr. Flood", status: "done" as const, dueDate: "2026-03-30" },
          { id: "bbb3", task: "Draft organizational capacity statement", owner: "AI + Dr. Flood", status: "done" as const, dueDate: "2026-03-30" },
        ],
      },
      {
        id: "review" as PhaseId, name: "3. Review & Approve", description: "RPLICE quality gate + Dr. Flood final review", status: "upcoming" as const,
        tasks: [
          { id: "bbr0", task: "RPLICE quality review — CFIR 2.0 + RE-AIM + fidelity assessment", owner: "RPLICE System", status: "pending" as const, dueDate: "2026-04-09" },
          { id: "bbr1", task: "Address RPLICE findings", owner: "Dr. Flood", status: "pending" as const, dueDate: "2026-04-10" },
          { id: "bbr2", task: "RPLICE re-assessment — target fidelity ≥ 85/100", owner: "RPLICE System", status: "pending" as const, dueDate: "2026-04-11" },
          { id: "bbr3", task: "Dr. Flood final approval", owner: "Dr. Flood", status: "pending" as const, dueDate: "2026-04-12" },
        ],
      },
      {
        id: "submit" as PhaseId, name: "4. Package & Submit", description: "Submit by April 13 deadline", status: "upcoming" as const,
        tasks: [
          { id: "bbs1", task: "Assemble final package", owner: "Dr. Flood + AI", status: "pending" as const, dueDate: "2026-04-12" },
          { id: "bbs2", task: "Submit through BB Collective portal", owner: "Dr. Flood", status: "pending" as const, dueDate: "2026-04-13" },
        ],
      },
      {
        id: "pre-execute" as PhaseId, name: "5. Pre-Execution Readiness", description: "Prepare research launch if awarded", status: "upcoming" as const,
        tasks: [
          { id: "bbp1", task: "Configure RPLICE for research-specific data collection", owner: "AI", status: "pending" as const, dueDate: "TBD" },
          { id: "bbp2", task: "Establish Ignite → RPLICE data pipeline", owner: "AI + Dr. Flood", status: "pending" as const, dueDate: "TBD" },
        ],
      },
    ],
    preExecutionChecklist: [
      { id: "bbpe-1", category: "Eligibility", item: "501(c)(3) determination letter", status: "verified" as const, notes: "TCAF EIN 41-3618003" },
      { id: "bbpe-2", category: "Eligibility", item: "Black-led organization verification", status: "verified" as const, notes: "Dr. Terry Flood, DHA — President" },
      { id: "bbpe-3", category: "Technology", item: "RPLICE operational and accessible", status: "verified" as const, notes: "bettersciencelab.com — live" },
      { id: "bbpe-4", category: "Partnerships", item: "MEASURE partnership confirmed", status: "action-needed" as const, notes: "Dr. Flood must confirm with Meme Styles" },
    ],
    winStrategy: {
      differentiators: [
        "Only applicant with a live AI-powered implementation science platform — not a proposal",
        "4-engine RAG architecture with anti-hallucination guardrails and APA citations",
        "MEASURE partnership adds CARE Model governance for ethical AI",
        "Three Realities ensures community voice drives research, not institutional assumption",
      ],
      reviewerPriorities: [
        "Community-driven research methodology",
        "Black-led organizational leadership",
        "Practical outputs that benefit community organizations",
        "Ethical data practices and community data ownership",
      ],
      scoringTips: [
        "Lead with the AI + ethics angle — this is what makes the research novel",
        "Show RPLICE is operational today — reviewers can visit bettersciencelab.com",
        "Emphasize the publishable methodology: CARE Model + MAP-GAP + RPLICE",
      ],
      commonPitfalls: [
        "Proposing research without existing infrastructure — we already have 167 tables",
        "Not addressing AI bias concerns — our anti-hallucination + bias audit protocols are the answer",
        "Missing the community voice requirement — Three Realities is our proof",
      ],
    },
  },
  {
    id: "rare-impact",
    name: "Rare Impact Fund",
    fullName: "Rare Impact Fund — Strengthening the Nonclinical Youth Mental Health Workforce",
    funder: "Rare Impact Fund (Selena Gomez, $100M Initiative)",
    amount: "$250,000 - $500,000",
    deadline: "April 10, 2026",
    deadlineUrgency: "urgent" as const,
    icon: Heart,
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/30",
    borderColor: "border-pink-200 dark:border-pink-800",
    description: "The Rare Impact Fund is mobilizing $100M to transform youth mental health. This RFP invests $2.5M+ in nonprofit partners building sustainable career pathways for nonclinical providers — peer mentors, community health workers, navigators, and educators.",
    referenceUrl: "https://www.rareimpactfund.org",
    referenceLabel: "Rare Impact Fund — $100M Initiative",
    grantKnowledge: `Rare Impact Fund — Strengthening the Nonclinical Youth Mental Health Workforce — $250,000-$500,000.
PURPOSE: Invest in nonprofit partners building career pathways for nonclinical youth mental health providers — peer mentors, community health workers, navigators, and educators. 2-year grants.
PRIORITIES: (1) Expand culturally responsive nonclinical support, (2) Strengthen workforce pipeline for undervalued mental health roles, (3) Elevate youth voices and equity strategies, (4) Build legitimacy for nonclinical roles in mental health ecosystem.
SUBMITTING ENTITY: The Collaborative Advocate Foundation — EIN 41-3618003, 501(c)(3).
WHY WE FIT: ThriveUp Academy provides the workforce training infrastructure. RPLICE tracks whether training programs produce competent nonclinical providers. WholeMind Learning addresses K-12 mental health. Sankofa Health provides culturally responsive screening. Three Realities ensures youth voice drives program design.
LOI DEADLINE: April 10, 2026.`,
    essentials: [
      { label: "Nonclinical Workforce Focus", detail: "Must build career pathways for peer mentors, CHWs, navigators, educators — not licensed clinicians. ThriveUp Academy trains exactly these roles.", critical: true },
      { label: "Youth Mental Health", detail: "Programs must serve youth mental health — WholeMind Learning + Sankofa Health screening tools are direct alignment", critical: true },
      { label: "LOI Due April 10", detail: "Letter of Intent due April 10, 2026 — URGENT. Must be submitted within 11 days.", critical: true },
      { label: "$250K-$500K, 2-Year", detail: "Substantial multi-year funding — request $400K+ with full ecosystem justification" },
      { label: "Culturally Responsive", detail: "Must demonstrate culturally responsive approaches — Three Realities + Sankofa methodology are direct proof" },
      { label: "Youth Voice Required", detail: "Must elevate youth voices in program design — Three Realities Lived Reality centers this" },
    ],
    competitiveEdge: [
      "ThriveUp Academy already trains nonclinical mental health workforce roles — not building from scratch",
      "RPLICE tracks whether training produces competent providers using AI-powered fidelity monitoring",
      "Sankofa Health has PHQ-9/GAD-7 screening built in — culturally responsive mental health tools operational",
      "WholeMind Learning addresses K-12 mental health — school-based pathway for nonclinical support",
      "4-engine AI + RAG architecture generates evidence-based curriculum recommendations from 6 scholarly databases",
      "Three Realities ensures youth voice shapes every program component — not an afterthought",
    ],
    serviceArea: {
      region: "Central Texas",
      state: "Texas",
      counties: ["Travis", "Williamson", "Hays"],
      city: "Austin",
      keyIndustries: ["Youth Mental Health", "Nonclinical Workforce", "Community Health Workers", "Peer Mentors"],
      targetEmployers: [
        { name: "Integral Care (Austin LMHA)", sector: "Behavioral Health", type: "Local mental health authority — employer of CHWs and peer specialists" },
        { name: "CommUnityCare Health Centers", sector: "Healthcare", type: "FQHC — hires community health workers and navigators" },
        { name: "AISD / Manor ISD / PfISD", sector: "Education", type: "School districts hiring counselor aides, peer mentors, and navigators" },
        { name: "Any Baby Can", sector: "Family Services", type: "Hires parent navigators and family support specialists" },
      ],
      laborMarketNotes: "Austin faces critical shortage of nonclinical mental health providers. Youth mental health crisis accelerated post-COVID. Texas ranks 51st nationally in mental health workforce per capita. Nonclinical roles (CHWs, peer specialists, navigators) are fastest-growing category but lack structured career pathways.",
      locationEligibility: "national" as const,
      locationNotes: "National program — no geographic restrictions. Austin's mental health workforce shortage makes a compelling case.",
      multiSiteEligible: true,
    },
    sections: [
      { id: "rif-loi", name: "Letter of Intent (LOI)", description: "Organization overview, program concept, target population, alignment with Rare Impact priorities", icon: FileText, status: "draft" as ApprovalStatus,
        content: `LETTER OF INTENT — RARE IMPACT FUND
Strengthening the Nonclinical Youth Mental Health Workforce

APPLICANT ORGANIZATION:
The Collaborative Advocate Foundation
EIN: 41-3618003 | 501(c)(3) Nonprofit
17912 Stefano Drive, Pflugerville, TX 78660
Contact: Dr. Terry Flood, DHA — President
Email: president@thecollaborativeadvocate.org | Website: thrivingcommunitiesforall.com

FUNDING REQUEST: $400,000 (2-year grant)

PROGRAM TITLE: "Pathways to Purpose: AI-Powered Career Development for Nonclinical Youth Mental Health Providers in Central Texas"

PROGRAM SUMMARY:
The Collaborative Advocate Foundation proposes a comprehensive career pathway program for nonclinical youth mental health providers — peer mentors, community health workers, navigators, and school-based support specialists — serving Central Texas communities disproportionately affected by the youth mental health crisis.

THE PROBLEM:
Texas ranks 51st nationally in mental health workforce per capita. In Central Texas, the shortage is acute for nonclinical roles — the peer mentors, community health workers, and navigators who serve as the first point of contact for youth in crisis. These roles are undervalued, underpaid, and lack structured career pathways. Young people from marginalized communities who WANT to help their peers have no clear path from lived experience to professional credential.

OUR APPROACH:
Using our 24-platform ACOS ecosystem, we provide:
1. TRAINING: ThriveUp Academy (thrivingcommunitiesforall.com) delivers workforce training with AI-powered career pathway mapping, competency-based progression, and industry-recognized credential tracks for CHW, peer specialist, and navigator roles.
2. CLINICAL TOOLS: Sankofa Health (yourhealthbirthright.net) provides culturally responsive PHQ-9/GAD-7 screening tools that nonclinical providers learn to administer — giving them real clinical support technology from Day 1.
3. SCHOOL INTEGRATION: WholeMind Learning provides K-12 mental health support tools that connect school-based nonclinical staff to the broader care ecosystem.
4. QUALITY ASSURANCE: RPLICE (bettersciencelab.com) tracks whether our training program produces competent providers using AI-powered implementation fidelity monitoring. Our 4-engine RAG architecture (GPT-5, Claude, 6 scholarly databases, ecosystem context) validates training effectiveness against published evidence — with anti-hallucination guardrails and APA citations on every assessment.
5. COMMUNITY VOICE: Three Realities methodology ensures youth voice drives every program design decision. We ask young people what they experience (Lived Reality), map what institutions intend to deliver (Institutional Reality), and design interventions that bridge the gap (Gap Reality).

ORGANIZATIONAL QUALIFICATIONS:
Dr. Terry Flood (DHA, MS Implementation Science, MA Psychology, U.S. Army Veteran — Bronze Star x2) brings implementation science rigor to workforce development. Our platform ecosystem is live and operational — not a proposal. RPLICE has conducted CFIR 2.0 assessments, RE-AIM evaluations, and fidelity checklists against real programs, with results persisted in our 167-table database.

TARGET OUTCOMES (2-year):
- 150+ individuals trained in nonclinical mental health roles
- 75% credential attainment rate (CHW, Peer Specialist, Navigator certifications)
- 80% employment placement within 90 days of program completion
- All training tracked via RPLICE for implementation fidelity ≥ 85/100
- Youth advisory board with minimum 12 members ages 16-24 informing program design`,
        reviewNotes: "URGENT — April 10 deadline. Strong draft. Dr. Flood: review and approve for submission within 10 days.", lastUpdated: "March 30, 2026", assignee: "Dr. Flood + AI", pageLimit: "5 pages", wordCount: "1,500-2,500 words" },
      { id: "rif-narrative", name: "Full Proposal Narrative", description: "Complete program design — prepared for full proposal invitation", icon: BookOpen, status: "draft" as ApprovalStatus,
        content: `FULL PROPOSAL NARRATIVE — RARE IMPACT FUND (DRAFT — for full submission if LOI accepted)

APPLICANT: The Collaborative Advocate Foundation | EIN: 41-3618003

PROGRAM: "Pathways to Purpose: AI-Powered Career Development for Nonclinical Youth Mental Health Providers"

I. PROGRAM DESIGN

A. Career Pathway Model
ThriveUp Academy provides a structured career pathway from lived experience to professional credential for nonclinical youth mental health roles:

Track 1 — Community Health Worker (CHW): 120-hour certification program covering mental health first aid, motivational interviewing, trauma-informed care, and cultural humility. Graduates qualify for Texas DSHS CHW certification.

Track 2 — Peer Support Specialist: 80-hour program for individuals with lived mental health experience. Covers peer support ethics, recovery-oriented care, boundaries, and documentation. Aligned with Texas Certified Peer Specialist requirements.

Track 3 — Youth Navigator: 60-hour program focused on system navigation — connecting youth to mental health services, school-based supports, housing, and social services. Integrates technology tools (LifeBridge, Sankofa Health) for real-time resource mapping.

B. AI-Powered Training Enhancement
Our 4-engine RAG architecture ensures training content is grounded in the latest evidence:
- GPT-5 analyzes training module effectiveness against published competency standards
- Claude Sonnet provides nuanced feedback on trainee case study responses
- Scholarly RAG queries PubMed, Semantic Scholar, CrossRef, Europe PMC, medRxiv, bioRxiv for current best practices
- Anti-hallucination guardrails ensure every AI recommendation includes APA citations and confidence scores

C. Implementation Fidelity
RPLICE (bettersciencelab.com) tracks whether the training program produces competent providers:
- CFIR 2.0 domain assessments evaluate implementation context
- RE-AIM framework measures Reach, Effectiveness, Adoption, Implementation, and Maintenance
- MAP-GAP cycle ensures continuous improvement — not annual reports
- Fidelity target: ≥ 85/100 across all training tracks

II. TARGET POPULATION
Youth and young adults ages 18-30 in Central Texas, with priority recruitment from:
- Communities of color disproportionately affected by the youth mental health crisis
- Individuals with lived mental health experience seeking peer support careers
- First-generation college students interested in helping professions
- Veterans transitioning to civilian behavioral health careers

III. COMMUNITY VOICE
Three Realities methodology ensures youth voice drives program design:
- Designed Reality: What the training program intends to deliver
- Operational Reality: What actually happens in classrooms and field placements
- Experienced Reality: What trainees and the youth they serve actually experience
Gap analysis between these three realities produces actionable improvements.

IV. EMPLOYER PARTNERSHIPS
Integral Care (Travis County LMHA), CommUnityCare Health Centers, AISD/Manor ISD/PfISD, and Any Baby Can have all indicated need for nonclinical mental health workforce. Program includes employer advisory board for curriculum alignment.`,
        reviewNotes: "Draft after LOI submission — prepare in advance for fast turnaround if invited", lastUpdated: "March 30, 2026", assignee: "Dr. Flood + AI", pageLimit: "15 pages", wordCount: "5,000-6,000 words" },
      { id: "rif-budget", name: "Budget & Justification", description: "$400K allocation over 2 years — personnel, technology, training, community engagement", icon: DollarSign, status: "draft" as ApprovalStatus,
        content: `BUDGET — RARE IMPACT FUND ($400,000 over 2 years)

APPLICANT: The Collaborative Advocate Foundation | EIN: 41-3618003

YEAR 1 ($210,000):
Personnel ($120,000):
- Program Director (Dr. Flood, 30% effort): $45,000
- Training Coordinator (full-time): $50,000
- Community Health Worker Instructor (0.5 FTE): $25,000

Technology & AI ($30,000):
- RPLICE AI engine operations (RAG queries, fidelity monitoring): $15,000
- ThriveUp Academy training platform operations: $10,000
- Sankofa Health screening tool configuration: $5,000

Training Delivery ($35,000):
- Curriculum materials and certification fees: $15,000
- Training site costs: $10,000
- Participant stipends during training: $10,000

Community Engagement ($15,000):
- Youth advisory board stipends: $6,000
- Three Realities listening sessions: $5,000
- Cultural responsiveness materials: $4,000

Indirect ($10,000): 10% de minimis

YEAR 2 ($190,000):
Personnel ($110,000) | Technology ($25,000) | Training ($30,000) | Community ($15,000) | Indirect ($10,000)

TOTAL: $400,000

NOTE: Platform infrastructure costs are minimal because the 24-platform ecosystem is already built. Grant funds go to people, training, and community engagement — not software development.`,
        reviewNotes: "Dr. Flood: confirm salary allocations and certification fee estimates.", lastUpdated: "March 30, 2026", assignee: "Dr. Flood", pageLimit: "3 pages", wordCount: "800-1,200 words" },
      { id: "rif-outcomes", name: "Outcomes Framework", description: "Measurable outcomes tracked via RPLICE", icon: BarChart3, status: "draft" as ApprovalStatus,
        content: `OUTCOMES FRAMEWORK — RARE IMPACT FUND

APPLICANT: The Collaborative Advocate Foundation | EIN: 41-3618003

All outcomes tracked via RPLICE implementation fidelity monitoring (bettersciencelab.com).

PRIMARY OUTCOMES (2-year targets):

1. WORKFORCE PIPELINE
- 150+ individuals enrolled in nonclinical mental health career tracks
- 120+ completions (80% completion rate)
- 90+ credential attainments: CHW certification, Peer Specialist certification, Navigator credential
- 80% employed in nonclinical mental health roles within 90 days of completion

2. YOUTH MENTAL HEALTH ACCESS
- 500+ youth served by program-trained nonclinical providers
- 85% of served youth report improved access to mental health support
- 70% of youth report improved mental health literacy (pre/post assessment)

3. CULTURAL RESPONSIVENESS
- 100% of training modules reviewed for cultural responsiveness via Three Realities methodology
- Youth advisory board (12+ members ages 16-24) meets quarterly and provides documented feedback
- Sankofa Health screening tools deployed to all program graduates

4. IMPLEMENTATION FIDELITY (RPLICE-tracked)
- Training program fidelity score ≥ 85/100 (RPLICE assessment)
- CFIR 2.0 implementation context score ≥ 3.5/5.0
- RE-AIM evaluation ≥ 80/100 across all 5 dimensions
- MAP-GAP cycle completed quarterly with documented improvements

5. SUSTAINABILITY
- 3+ employer partners providing paid positions for graduates
- Revenue model established for continuing training operations beyond grant period
- At least 1 peer-reviewed publication documenting program methodology and outcomes

EVALUATION METHOD:
All outcomes assessed through RPLICE's 4-engine AI + RAG architecture. Scholarly RAG validates assessment instruments against published psychometric standards. Anti-hallucination guardrails ensure outcome reports are grounded in actual data, not AI fabrication. All outcome data stored in RPLICE's 167-table database for transparency and auditability.`,
        reviewNotes: "Dr. Flood: review outcome targets for achievability. Adjust numbers based on realistic enrollment projections.", lastUpdated: "March 30, 2026", assignee: "Dr. Flood + AI", pageLimit: "3 pages", wordCount: "1,000-1,500 words" },
    ],
    phases: [
      {
        id: "collaborate" as PhaseId, name: "1. Collaborate & Research", description: "Align with Rare Impact priorities, gather youth mental health data", status: "active" as const,
        tasks: [
          { id: "rifc1", task: "Review Rare Impact Fund RFP requirements in detail", owner: "Dr. Flood + AI", status: "done" as const, dueDate: "2026-03-28" },
          { id: "rifc2", task: "Map ecosystem platforms to nonclinical workforce needs", owner: "AI", status: "done" as const, dueDate: "2026-03-29" },
          { id: "rifc3", task: "Research Austin nonclinical mental health workforce data", owner: "AI", status: "in-progress" as const, dueDate: "2026-04-02" },
        ],
      },
      {
        id: "build" as PhaseId, name: "2. Build & Draft", description: "Draft LOI and supporting materials", status: "active" as const,
        tasks: [
          { id: "rifb1", task: "Draft Letter of Intent", owner: "AI + Dr. Flood Review", status: "done" as const, dueDate: "2026-03-30" },
          { id: "rifb2", task: "Draft budget ($400K, 2-year)", owner: "Dr. Flood", status: "done" as const, dueDate: "2026-03-30" },
        ],
      },
      {
        id: "review" as PhaseId, name: "3. Review & Approve", description: "RPLICE quality gate + Dr. Flood review", status: "upcoming" as const,
        tasks: [
          { id: "rifr0", task: "RPLICE quality review — CFIR 2.0 + RE-AIM assessment", owner: "RPLICE System", status: "pending" as const, dueDate: "2026-04-05" },
          { id: "rifr1", task: "Address RPLICE findings", owner: "Dr. Flood", status: "pending" as const, dueDate: "2026-04-07" },
          { id: "rifr2", task: "RPLICE re-assessment — target ≥ 85/100", owner: "RPLICE System", status: "pending" as const, dueDate: "2026-04-08" },
          { id: "rifr3", task: "Dr. Flood final approval", owner: "Dr. Flood", status: "pending" as const, dueDate: "2026-04-09" },
        ],
      },
      {
        id: "submit" as PhaseId, name: "4. Package & Submit", description: "Submit LOI by April 10", status: "upcoming" as const,
        tasks: [
          { id: "rifs1", task: "Submit LOI through Rare Impact Fund portal", owner: "Dr. Flood", status: "pending" as const, dueDate: "2026-04-10" },
        ],
      },
      {
        id: "pre-execute" as PhaseId, name: "5. Pre-Execution Readiness", description: "Prepare full proposal if LOI accepted", status: "upcoming" as const,
        tasks: [
          { id: "rifp1", task: "Draft full proposal narrative (15 pages)", owner: "AI + Dr. Flood", status: "pending" as const, dueDate: "TBD" },
          { id: "rifp2", task: "Configure ThriveUp Academy CHW/peer specialist training tracks", owner: "AI", status: "pending" as const, dueDate: "TBD" },
        ],
      },
    ],
    preExecutionChecklist: [
      { id: "rifpe-1", category: "Eligibility", item: "501(c)(3) determination letter", status: "verified" as const, notes: "TCAF EIN 41-3618003" },
      { id: "rifpe-2", category: "Alignment", item: "Nonclinical workforce pathway documented", status: "verified" as const, notes: "ThriveUp Academy career pathways" },
      { id: "rifpe-3", category: "Technology", item: "Training platform operational", status: "verified" as const, notes: "thrivingcommunitiesforall.com — live" },
      { id: "rifpe-4", category: "Technology", item: "Mental health screening tools operational", status: "verified" as const, notes: "Sankofa Health — yourhealthbirthright.net" },
      { id: "rifpe-5", category: "Community", item: "Youth advisory board established", status: "action-needed" as const, notes: "Dr. Flood: recruit 12+ youth ages 16-24" },
    ],
    winStrategy: {
      differentiators: [
        "24-platform ecosystem already serves nonclinical mental health workforce — not proposing, operating",
        "RPLICE AI tracks whether training produces competent providers — implementation fidelity, not just completion rates",
        "Sankofa Health screening tools give trainees real clinical technology from Day 1",
        "Three Realities ensures youth voice drives every design decision",
      ],
      reviewerPriorities: [
        "Programs that build sustainable career pathways, not one-off trainings",
        "Culturally responsive approaches centered on communities of color",
        "Youth voice elevated in program design",
        "Evidence-based with measurable outcomes",
        "Scalable beyond initial funding",
      ],
      scoringTips: [
        "Show the training-to-credential-to-employment pipeline end to end",
        "Emphasize AI-powered fidelity tracking — most applicants can't prove their training works",
        "Include youth voice examples from Three Realities methodology",
      ],
      commonPitfalls: [
        "Proposing clinical training — this fund is specifically for NONCLINICAL roles",
        "Not addressing cultural responsiveness concretely — Sankofa is our proof",
        "Missing the youth voice requirement — Three Realities is the answer",
      ],
    },
  },
  {
    id: "centene-behavioral",
    name: "Centene Foundation",
    fullName: "Centene Foundation — Behavioral Health Community Innovation Grants",
    funder: "Centene Foundation",
    amount: "Up to $500,000",
    deadline: "May 31, 2026",
    deadlineUrgency: "on-track" as const,
    icon: Activity,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    description: "Centene Foundation funds behavioral health innovation in underserved communities — integrated care models, community health worker programs, culturally responsive mental health services, and technology-enabled behavioral health access.",
    referenceUrl: "https://www.centene.com/who-we-are/centene-foundation.html",
    referenceLabel: "Centene Foundation Grants",
    grantKnowledge: `Centene Foundation — Behavioral Health Community Innovation Grants — Up to $500,000.
PURPOSE: Fund innovative behavioral health programs in underserved communities. Focuses on integrated care models, community health workers, technology-enabled access, and culturally responsive approaches.
ALIGNMENT: TCAF's Whole-Person Health platform (mentalwellnesssupport.net) provides behavioral health screening and support. Sankofa Health (yourhealthbirthright.net) delivers culturally responsive health tools. RPLICE validates whether behavioral health interventions are delivered with fidelity.
SUBMITTING ENTITY: The Collaborative Advocate Foundation — EIN 41-3618003, 501(c)(3).
DEADLINE: May 31, 2026.`,
    essentials: [
      { label: "Behavioral Health Focus", detail: "Must address behavioral health access, integration, or innovation — Whole-Person Health + Sankofa Health are direct alignment", critical: true },
      { label: "Underserved Communities", detail: "Must serve communities with behavioral health disparities — Austin's Black and Hispanic communities face 2-3x disparities in access", critical: true },
      { label: "May 31 Deadline", detail: "Two months to prepare — use time to strengthen community partnerships and pilot data" },
      { label: "Up to $500K", detail: "Substantial funding — request $350K-$500K with full ecosystem justification" },
      { label: "Innovation Required", detail: "Centene wants innovation — AI-powered behavioral health screening + implementation fidelity tracking is novel" },
    ],
    competitiveEdge: [
      "Whole-Person Health platform provides integrated behavioral health screening and support — live at mentalwellnesssupport.net",
      "Sankofa Health delivers culturally responsive health tools for Black and Brown communities",
      "RPLICE tracks behavioral health intervention fidelity using AI + RAG architecture",
      "4-engine AI generates treatment recommendations grounded in 6 scholarly databases — with citations",
      "PillScheduler supports medication adherence — critical for behavioral health outcomes",
      "SafeCogniCare addresses cognitive health needs often co-occurring with behavioral health conditions",
    ],
    serviceArea: {
      region: "Central Texas",
      state: "Texas",
      counties: ["Travis", "Williamson", "Hays"],
      city: "Austin",
      keyIndustries: ["Behavioral Health", "Integrated Care", "Community Health Workers"],
      targetEmployers: [
        { name: "Integral Care", sector: "Behavioral Health", type: "Local mental health authority — primary behavioral health provider for Travis County" },
        { name: "CommUnityCare", sector: "Healthcare", type: "FQHC with integrated behavioral health services" },
        { name: "Sendero Health Plans", sector: "Insurance", type: "Centene subsidiary — Medicaid managed care in Travis County" },
      ],
      laborMarketNotes: "Centene operates Sendero Health Plans in Travis County. Direct relationship to their Medicaid population. Behavioral health access gaps are severe in Central Texas — 60% of adults with mental illness receive no treatment.",
      locationEligibility: "national" as const,
      locationNotes: "National program, but Centene operates Sendero Health Plans in Travis County — local alignment is a competitive advantage.",
      multiSiteEligible: false,
    },
    sections: [
      { id: "cen-narrative", name: "Program Narrative", description: "Integrated behavioral health model, technology platform, culturally responsive approach", icon: FileText, status: "draft" as ApprovalStatus,
        content: `PROGRAM NARRATIVE — CENTENE FOUNDATION BEHAVIORAL HEALTH GRANT

APPLICANT ORGANIZATION:
The Collaborative Advocate Foundation
EIN: 41-3618003 | 501(c)(3) Nonprofit
17912 Stefano Drive, Pflugerville, TX 78660
Contact: Dr. Terry Flood, DHA — President
Email: president@thecollaborativeadvocate.org | Website: thrivingcommunitiesforall.com

PROGRAM TITLE: "Integrated Behavioral Health Access Through AI-Powered Community Technology in Central Texas"

THE PROBLEM:
In Travis County, 60% of adults with mental illness receive no treatment. For Black and Hispanic communities, the gap is worse — cultural stigma, provider shortages, language barriers, and systemic distrust compound the access crisis. Centene's own Sendero Health Plans serves this population — improving behavioral health access directly benefits Centene's mission and member outcomes.

OUR APPROACH:
We deploy an AI-powered behavioral health ecosystem that reaches community members where they are:

1. SCREENING & ASSESSMENT: Whole-Person Health (mentalwellnesssupport.net) provides PHQ-9 (depression), GAD-7 (anxiety), and Columbia Suicide Severity screening accessible via mobile device — no clinic visit required. Sankofa Health (yourhealthbirthright.net) provides culturally responsive versions designed for Black and Brown communities.

2. AI-POWERED RECOMMENDATIONS: When a screening indicates need, our 4-engine RAG architecture (GPT-5, Claude, 6 scholarly databases, ecosystem context) generates evidence-based next steps — not generic advice, but recommendations grounded in published literature with APA citations and anti-hallucination guardrails.

3. CARE COORDINATION: LifeBridge (lifetransitionsaid.org) connects individuals to wraparound services — housing, food, transportation — because behavioral health cannot improve when basic needs are unmet.

4. MEDICATION SUPPORT: PillScheduler (pillscheduler.net) provides medication adherence tools for psychiatric medications — reminders, interaction warnings, refill tracking.

5. IMPLEMENTATION FIDELITY: RPLICE (bettersciencelab.com) tracks whether behavioral health interventions are delivered as designed using CFIR 2.0 and RE-AIM frameworks. The MAP-GAP cycle ensures continuous improvement — not annual reports.

6. COMMUNITY VOICE: Three Realities methodology ensures the Lived Reality of community members drives service design. We don't assume what communities need — we ask, listen, map the gaps, and build solutions that bridge them.

ORGANIZATIONAL QUALIFICATIONS:
Dr. Terry Flood (DHA, MS Implementation Science, MA Psychology, U.S. Army Veteran — Bronze Star x2) leads with implementation science expertise. The 24-platform ACOS ecosystem is live and operational. RPLICE has conducted real assessments with results persisted in our 167-table database.

AFFILIATED ENTITIES:
- Collaboration & Implementation Professionals LLC (EIN 41-4996540) — VOSB, government contracting
- M&T Consulting Solutions LLC (EIN 41-4952178) — consulting services`,
        reviewNotes: "Good first draft. Dr. Flood: add Sendero Health Plans connection explicitly and any prior behavioral health program data.", lastUpdated: "March 30, 2026", assignee: "Dr. Flood + AI", pageLimit: "15 pages", wordCount: "4,000-6,000 words" },
      { id: "cen-budget", name: "Budget & Justification", description: "$350K-$500K — behavioral health personnel, technology, community engagement", icon: DollarSign, status: "draft" as ApprovalStatus,
        content: `BUDGET — CENTENE FOUNDATION BEHAVIORAL HEALTH GRANT ($400,000)

APPLICANT: The Collaborative Advocate Foundation | EIN: 41-3618003

PERSONNEL ($200,000 — 50%):
- Program Director (Dr. Terry Flood, DHA — 40% effort): $60,000
- Behavioral Health Coordinator (full-time): $55,000
- Community Health Workers (2 at 0.75 FTE): $70,000
- Data & Technology Coordinator (0.5 FTE): $15,000

TECHNOLOGY & AI OPERATIONS ($60,000 — 15%):
- RPLICE AI engine operations (4-engine RAG pipeline for behavioral health assessments): $25,000
- Whole-Person Health platform operations (PHQ-9/GAD-7 screening infrastructure): $15,000
- Sankofa Health culturally responsive tool maintenance: $10,000
- PillScheduler medication adherence integration: $5,000
- Data security & HIPAA compliance infrastructure: $5,000

COMMUNITY ENGAGEMENT ($60,000 — 15%):
- Three Realities listening sessions (quarterly): $15,000
- Community participant stipends: $15,000
- Behavioral health awareness events: $15,000
- Transportation assistance for participants: $15,000

TRAINING & WORKFORCE ($40,000 — 10%):
- CHW behavioral health certification training: $20,000
- Continuing education for program staff: $10,000
- Training materials and curriculum development: $10,000

EVALUATION ($20,000 — 5%):
- External evaluation consultant (validation of RPLICE-generated fidelity data): $15,000
- Publication and dissemination: $5,000

INDIRECT COSTS ($20,000 — 5%):
- 5% de minimis rate

TOTAL: $400,000

NOTE: The 24-platform technology infrastructure is already built and operational. Technology line items cover marginal operating costs (API usage, hosting, maintenance) — not development. This means 80%+ of grant funds go directly to people and community services.`,
        reviewNotes: "Dr. Flood: confirm salary rates and verify HIPAA compliance cost estimates.", lastUpdated: "March 30, 2026", assignee: "Dr. Flood", pageLimit: "3 pages", wordCount: "800-1,200 words" },
      { id: "cen-outcomes", name: "Outcomes & Evaluation", description: "Behavioral health screening rates, treatment connection, fidelity scores via RPLICE", icon: BarChart3, status: "draft" as ApprovalStatus,
        content: `OUTCOMES & EVALUATION — CENTENE FOUNDATION BEHAVIORAL HEALTH GRANT

APPLICANT: The Collaborative Advocate Foundation | EIN: 41-3618003

All outcomes tracked via RPLICE implementation fidelity monitoring (bettersciencelab.com).

PRIMARY OUTCOMES (Year 1):

1. BEHAVIORAL HEALTH SCREENING ACCESS
- 1,000+ community members complete behavioral health screening via Whole-Person Health or Sankofa Health platforms
- 60% of screenings completed outside traditional clinical settings (mobile, community events, home)
- PHQ-9, GAD-7, and Columbia Suicide Severity screens available in English and Spanish

2. TREATMENT CONNECTION
- 70% of individuals screening positive connected to behavioral health services within 14 days
- Warm handoff protocols established with Integral Care, CommUnityCare, and private providers
- LifeBridge (lifetransitionsaid.org) provides wraparound services for SDOH barriers to treatment

3. WORKFORCE DEVELOPMENT
- 20+ community health workers trained in behavioral health screening and navigation
- All CHWs certified to administer standardized screening instruments
- CHWs equipped with Sankofa Health mobile screening tools

4. IMPLEMENTATION FIDELITY (RPLICE-tracked)
- Program fidelity score ≥ 85/100
- CFIR 2.0 implementation context score ≥ 3.5/5.0
- RE-AIM evaluation ≥ 80/100
- MAP-GAP cycle completed quarterly

5. AI QUALITY ASSURANCE
- 100% of AI-generated behavioral health recommendations include APA citations
- Anti-hallucination audit completed monthly — zero uncited recommendations in clinical pathways
- Bias audit protocol documented and published

EVALUATION DESIGN:
Mixed-methods: quantitative outcome tracking via RPLICE + qualitative community voice via Three Realities methodology. External evaluator validates RPLICE-generated data annually. Results published for field contribution.`,
        reviewNotes: "Dr. Flood: review screening volume targets. Are 1,000+ screenings realistic in Year 1?", lastUpdated: "March 30, 2026", assignee: "Dr. Flood + AI", pageLimit: "5 pages", wordCount: "1,500-2,000 words" },
      { id: "cen-org-capacity", name: "Organizational Capacity", description: "Leadership, technology infrastructure, behavioral health experience", icon: Building2, status: "draft" as ApprovalStatus,
        content: `ORGANIZATIONAL CAPACITY — CENTENE FOUNDATION BEHAVIORAL HEALTH GRANT

ORGANIZATION: The Collaborative Advocate Foundation
EIN: 41-3618003 | 501(c)(3) Nonprofit
Address: 17912 Stefano Drive, Pflugerville, TX 78660
Website: thrivingcommunitiesforall.com

LEADERSHIP:
Dr. Terry Flood, DHA — President
Credentials: Doctorate in Health Administration, MS Implementation Science, MA Psychology, MSHRM, MBA, MSCJ, Public Policy
Military Service: U.S. Army Veteran — Bronze Star (x2)
Relevance: Implementation science expertise ensures behavioral health programs are delivered with fidelity. Health administration doctorate provides healthcare systems knowledge. Psychology background informs clinical understanding of behavioral health needs.

TECHNOLOGY INFRASTRUCTURE:
The 24-platform ACOS ecosystem includes multiple behavioral health-specific tools:
- Whole-Person Health (mentalwellnesssupport.net): PHQ-9, GAD-7, Columbia Suicide Severity screening — live
- Sankofa Health (yourhealthbirthright.net): Culturally responsive health tools for Black and Brown communities — live
- PillScheduler (pillscheduler.net): Medication adherence for psychiatric medications — live
- SafeCogniCare (safecognicare.com): Cognitive health assessment — live
- Black Men's Health Hub (blackmenshealthhub.com): Health equity focus — live
- RPLICE (bettersciencelab.com): AI-powered implementation fidelity tracking — live

AI INFRASTRUCTURE:
4-Engine RAG Architecture: GPT-5 (structured analysis), Claude Sonnet (nuanced reasoning), Scholarly Research RAG (PubMed, Semantic Scholar, CrossRef, Europe PMC, medRxiv, bioRxiv), Ecosystem RAG (platform-specific context). Anti-hallucination guardrails + APA citations on every output. 167 database tables. Bias-auditable output chains.

AFFILIATED ENTITIES:
- Collaboration & Implementation Professionals LLC (EIN 41-4996540) — VOSB, government contracting
- M&T Consulting Solutions LLC (EIN 41-4952178) — consulting services

SENDERO HEALTH PLANS CONNECTION:
Centene operates Sendero Health Plans in Travis County. Our behavioral health services directly serve the Sendero Medicaid population, creating alignment between TCAF's mission and Centene's member health outcomes.`,
        reviewNotes: "Dr. Flood: add board member list and any behavioral health-specific prior results.", lastUpdated: "March 30, 2026", assignee: "Dr. Flood", pageLimit: "5 pages", wordCount: "1,500-2,000 words" },
      { id: "cen-partnerships", name: "Partnership Documentation", description: "Integral Care, CommUnityCare, and community organization partnerships", icon: Handshake, status: "draft" as ApprovalStatus,
        content: `PARTNERSHIP DOCUMENTATION — CENTENE FOUNDATION BEHAVIORAL HEALTH GRANT

APPLICANT: The Collaborative Advocate Foundation | EIN: 41-3618003

PARTNERSHIP 1: INTEGRAL CARE (Travis County LMHA)
Role: Primary behavioral health referral partner. Integral Care is the Local Mental Health Authority for Travis County, providing crisis services, psychiatric care, and community-based behavioral health programs.
Alignment: When our screening tools identify individuals needing clinical-level care, Integral Care provides the clinical pathway. Our nonclinical CHWs complement their clinical staff by handling navigation, follow-up, and SDOH support.
Status: Partnership letter requested — Dr. Flood to follow up.

PARTNERSHIP 2: COMMUNITYCARE HEALTH CENTERS
Role: Integrated care partner. CommUnityCare is the largest FQHC in Austin, providing primary care with integrated behavioral health services.
Alignment: Our mobile screening tools extend CommUnityCare's reach into communities that don't visit clinics. Positive screens are warm-transferred to CommUnityCare for follow-up care.
Status: Partnership letter requested.

PARTNERSHIP 3: SENDERO HEALTH PLANS (Centene subsidiary)
Role: Managed care alignment. Sendero is Centene's Medicaid managed care organization in Travis County.
Alignment: Our behavioral health services improve outcomes for Sendero members — reducing ED utilization and improving treatment engagement. This creates direct value for Centene's mission and bottom line.
Status: To be established — strategic connection for proposal strength.

PARTNERSHIP 4: AISD / MANOR ISD / PFISD
Role: School-based behavioral health integration. WholeMind Learning provides K-12 mental health tools.
Alignment: School counselors and behavioral health staff use our tools to identify at-risk youth and connect them to community services.
Status: Partnership letters to be requested.`,
        reviewNotes: "Dr. Flood: secure partnership letters from Integral Care and CommUnityCare before May 31 deadline.", lastUpdated: "March 30, 2026", assignee: "Dr. Flood", pageLimit: "No limit", wordCount: "300-500 words each" },
    ],
    phases: [
      {
        id: "collaborate" as PhaseId, name: "1. Collaborate & Research", description: "Understand Centene priorities, build behavioral health partnerships", status: "upcoming" as const,
        tasks: [
          { id: "cenc1", task: "Review Centene Foundation grant guidelines", owner: "Dr. Flood + AI", status: "pending" as const, dueDate: "2026-04-15" },
          { id: "cenc2", task: "Research Sendero Health Plans member behavioral health data", owner: "AI", status: "pending" as const, dueDate: "2026-04-20" },
          { id: "cenc3", task: "Contact Integral Care for partnership letter", owner: "Dr. Flood", status: "pending" as const, dueDate: "2026-04-25" },
          { id: "cenc4", task: "Map ecosystem platforms to behavioral health intervention model", owner: "AI + Dr. Flood", status: "pending" as const, dueDate: "2026-04-30" },
        ],
      },
      {
        id: "build" as PhaseId, name: "2. Build & Draft", description: "Write narrative, budget, outcomes, and partnership docs", status: "upcoming" as const,
        tasks: [
          { id: "cenb1", task: "Draft Program Narrative with AI/RAG methodology", owner: "AI + Dr. Flood", status: "done" as const, dueDate: "2026-03-30" },
          { id: "cenb2", task: "Draft budget ($350K-$500K)", owner: "Dr. Flood", status: "pending" as const, dueDate: "2026-05-05" },
          { id: "cenb3", task: "Design outcomes framework with RPLICE tracking", owner: "AI + Dr. Flood", status: "pending" as const, dueDate: "2026-05-10" },
        ],
      },
      {
        id: "review" as PhaseId, name: "3. Review & Approve", description: "RPLICE quality gate + Dr. Flood review", status: "upcoming" as const,
        tasks: [
          { id: "cenr0", task: "RPLICE quality review — CFIR 2.0 + RE-AIM + fidelity assessment", owner: "RPLICE System", status: "pending" as const, dueDate: "2026-05-18" },
          { id: "cenr1", task: "Address RPLICE findings", owner: "Dr. Flood", status: "pending" as const, dueDate: "2026-05-22" },
          { id: "cenr2", task: "RPLICE re-assessment — target ≥ 85/100", owner: "RPLICE System", status: "pending" as const, dueDate: "2026-05-25" },
          { id: "cenr3", task: "Dr. Flood final approval", owner: "Dr. Flood", status: "pending" as const, dueDate: "2026-05-28" },
        ],
      },
      {
        id: "submit" as PhaseId, name: "4. Package & Submit", description: "Submit by May 31", status: "upcoming" as const,
        tasks: [
          { id: "cens1", task: "Assemble and submit through Centene portal", owner: "Dr. Flood", status: "pending" as const, dueDate: "2026-05-31" },
        ],
      },
      {
        id: "pre-execute" as PhaseId, name: "5. Pre-Execution Readiness", description: "Prepare for behavioral health program launch", status: "upcoming" as const,
        tasks: [
          { id: "cenp1", task: "Configure Whole-Person Health for Centene-specific screening workflows", owner: "AI", status: "pending" as const, dueDate: "TBD" },
          { id: "cenp2", task: "Establish referral protocols with Integral Care", owner: "Dr. Flood", status: "pending" as const, dueDate: "TBD" },
        ],
      },
    ],
    preExecutionChecklist: [
      { id: "cenpe-1", category: "Eligibility", item: "501(c)(3) determination letter", status: "verified" as const, notes: "TCAF EIN 41-3618003" },
      { id: "cenpe-2", category: "Technology", item: "Behavioral health screening operational", status: "verified" as const, notes: "Whole-Person Health + Sankofa Health — both live" },
      { id: "cenpe-3", category: "Partnerships", item: "Integral Care partnership", status: "action-needed" as const, notes: "Dr. Flood must initiate contact" },
      { id: "cenpe-4", category: "Partnerships", item: "Sendero Health Plans alignment documented", status: "pending" as const, notes: "Centene subsidiary in Travis County" },
    ],
    winStrategy: {
      differentiators: [
        "Centene operates Sendero in Travis County — we serve their exact population",
        "AI-powered behavioral health screening reaches people who never enter a clinic",
        "RPLICE fidelity tracking proves interventions work as designed — not just activity counts",
        "Full ecosystem addresses SDOH factors (housing, food, employment) that drive behavioral health crises",
      ],
      reviewerPriorities: [
        "Innovation in behavioral health access for underserved populations",
        "Technology-enabled solutions that scale beyond traditional clinic models",
        "Culturally responsive approaches for communities of color",
        "Measurable outcomes with evidence-based methodology",
      ],
      scoringTips: [
        "Lead with the Sendero Health Plans connection — Centene funds what benefits their members",
        "Show the AI generating real behavioral health recommendations with citations",
        "Emphasize wraparound services through ecosystem — behavioral health doesn't improve in isolation",
      ],
      commonPitfalls: [
        "Proposing only clinical services — Centene wants community-based innovation",
        "Not connecting to Centene's Medicaid population in Travis County",
        "Generic mental health programs without cultural responsiveness evidence",
      ],
    },
  },
  {
    id: "austin-fc-dream",
    name: "Austin FC Dream Starter",
    fullName: "Austin FC Dream Starter Competition — $100,000 Entrepreneurship Award",
    funder: "Austin FC & Q2",
    amount: "$100,000",
    deadline: "April 13, 2026",
    deadlineUrgency: "urgent" as const,
    icon: Star,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
    description: "6th annual competition awarding $100K to Central Texas entrepreneurs from underrepresented groups. Combines Q2's mission with Austin FC's inclusivity-through-equity community pillar.",
    referenceUrl: "https://austinfc.typeform.com/to/bYJOT3j9",
    referenceLabel: "Austin FC Dream Starter Application",
    grantKnowledge: `Austin FC Dream Starter Competition — $100,000.
PURPOSE: 6th annual business competition inviting Austin entrepreneurs from underrepresented groups to compete for $100K in Dream Starter funds. Presented by Q2. Winner announced May 28, 2026.
ALIGNMENT: TCAF is veteran-founded, Black-led, Austin-based — precisely the underrepresented entrepreneur profile. MCE (Minority Center of Excellence) demonstrates business infrastructure. The 24-platform ACOS ecosystem shows scalable technology business.
SUBMITTING ENTITY: The Collaborative Advocate Foundation — EIN 41-3618003, or Collaboration & Implementation Professionals LLC (EIN 41-4996540).
APPLICATION: Via Typeform at austinfc.typeform.com/to/bYJOT3j9.
DEADLINE: April 13, 2026 at 11:59 PM.`,
    essentials: [
      { label: "Underrepresented Entrepreneur", detail: "TCAF is veteran-founded, Black-led — Dr. Flood is exactly the profile this competition targets", critical: true },
      { label: "Central Texas Based", detail: "Must be Austin-area entrepreneur — TCAF is headquartered in Pflugerville", critical: true },
      { label: "April 13 Deadline", detail: "Application due April 13, 2026 at 11:59 PM via Typeform", critical: true },
      { label: "$100K Award", detail: "Cash award to accelerate entrepreneurial venture — no equity taken" },
      { label: "Winner May 28", detail: "Winner announced May 28, 2026" },
    ],
    competitiveEdge: [
      "24-platform live technology ecosystem — this is not a concept, it's operational",
      "Veteran-founded, Black-led — authentic underrepresented entrepreneur, not performative",
      "MCE (Minority Center of Excellence) already supports minority business ecosystem",
      "Revenue model through government contracts (Central Health CMS) + grants + consulting",
      "AI-powered platform serves real communities — healthcare, education, workforce, criminal justice, housing, safety",
      "Dr. Flood's credentials: DHA, MS Implementation Science, MBA, U.S. Army Veteran — Bronze Star x2",
    ],
    serviceArea: {
      region: "Central Texas",
      state: "Texas",
      counties: ["Travis", "Williamson"],
      city: "Austin",
      keyIndustries: ["Technology", "Healthcare", "Workforce Development", "Implementation Science"],
      targetEmployers: [],
      laborMarketNotes: "Austin FC Dream Starter focuses on underrepresented entrepreneurs building businesses in the Austin area.",
      locationEligibility: "regional" as const,
      locationNotes: "Central Texas entrepreneurs only.",
      multiSiteEligible: false,
    },
    sections: [
      { id: "afc-application", name: "Dream Starter Application", description: "Typeform application — business overview, impact, growth plan", icon: FileText, status: "draft" as ApprovalStatus,
        content: `AUSTIN FC DREAM STARTER — APPLICATION CONTENT

ENTREPRENEUR: Dr. Terry Flood, DHA
BUSINESS: The Collaborative Advocate Foundation (501(c)(3), EIN 41-3618003) & Collaboration & Implementation Professionals LLC (VOSB, EIN 41-4996540)
LOCATION: 17912 Stefano Drive, Pflugerville, TX 78660
EMAIL: president@thecollaborativeadvocate.org

BUSINESS DESCRIPTION:
We build AI-powered technology that bridges the gap between research and practice — so what works in studies actually works in communities. Our 24-platform ACOS (Advanced Community Operating System) ecosystem spans healthcare, education, workforce development, criminal justice, housing, and safety.

At the core is RPLICE — an implementation science engine powered by a 4-engine AI + RAG architecture (GPT-5, Claude Sonnet, 6 scholarly databases, platform-aware context). RPLICE tracks whether community programs are delivered as designed using CFIR 2.0 and RE-AIM frameworks, with anti-hallucination guardrails ensuring every AI recommendation is grounded in peer-reviewed evidence.

We plan. We research. We understand. We coordinate. We implement with fidelity. We continuously improve. From healthcare to defense, criminal justice to education — we put people first.

WHY THIS MATTERS:
79% of Black-led organizations have no systems for collecting data. Community programs fail not because they're bad — but because nobody tracks whether they're implemented correctly. Our technology changes that. We give organizations the tools to measure what matters and continuously improve.

REVENUE MODEL:
- Government contracts (Central Health CMS — Solicitation #2603-002, live system)
- Federal/foundation grants ($3.6M+ pipeline: St. David's, SSG Fox VA, Rare Impact Fund, Centene, BB Collective)
- Consulting through Collaboration & Implementation Professionals LLC (VOSB)
- SaaS licensing for RPLICE and ecosystem platforms

WHAT $100K WOULD DO:
- Hire 2 community engagement coordinators to expand Austin/Pflugerville operations
- Fund RPLICE AI operations (RAG queries across scholarly databases) for 18 months
- Accelerate grant submission pipeline — currently pursuing $3.6M+ in active opportunities
- Establish physical community presence for Three Realities listening sessions

IMPACT:
- 24 live platforms serving communities across 6 domains
- 167 database tables of implementation data
- Active partnerships with community organizations across Central Texas
- Veteran-founded, Black-led — authentic representation, not performative allyship`,
        reviewNotes: "Adapt for Typeform format — may need to shorten for character limits. Dr. Flood: confirm which entity to apply under.", lastUpdated: "March 30, 2026", assignee: "Dr. Flood", pageLimit: "Typeform fields", wordCount: "Varies by field" },
    ],
    phases: [
      {
        id: "collaborate" as PhaseId, name: "1. Collaborate & Research", description: "Understand Dream Starter requirements", status: "active" as const,
        tasks: [
          { id: "afcc1", task: "Complete Typeform application questions", owner: "Dr. Flood", status: "in-progress" as const, dueDate: "2026-04-10" },
        ],
      },
      {
        id: "build" as PhaseId, name: "2. Build & Draft", description: "Draft application responses", status: "active" as const,
        tasks: [
          { id: "afcb1", task: "Draft business overview and impact narrative", owner: "AI + Dr. Flood", status: "done" as const, dueDate: "2026-03-30" },
        ],
      },
      {
        id: "review" as PhaseId, name: "3. Review & Approve", description: "Dr. Flood final review", status: "upcoming" as const,
        tasks: [
          { id: "afcr1", task: "Dr. Flood review application answers", owner: "Dr. Flood", status: "pending" as const, dueDate: "2026-04-11" },
        ],
      },
      {
        id: "submit" as PhaseId, name: "4. Package & Submit", description: "Submit via Typeform by April 13", status: "upcoming" as const,
        tasks: [
          { id: "afcs1", task: "Submit Typeform application", owner: "Dr. Flood", status: "pending" as const, dueDate: "2026-04-13" },
        ],
      },
      {
        id: "pre-execute" as PhaseId, name: "5. Pre-Execution Readiness", description: "Prepare for pitch if selected", status: "upcoming" as const,
        tasks: [
          { id: "afcp1", task: "Prepare pitch deck for Dream Starter finals", owner: "Dr. Flood + AI", status: "pending" as const, dueDate: "TBD" },
        ],
      },
    ],
    preExecutionChecklist: [
      { id: "afcpe-1", category: "Eligibility", item: "Central Texas based entrepreneur", status: "verified" as const, notes: "Pflugerville, TX" },
      { id: "afcpe-2", category: "Eligibility", item: "Underrepresented group", status: "verified" as const, notes: "Black-led, veteran-founded" },
      { id: "afcpe-3", category: "Application", item: "Typeform submitted", status: "pending" as const, notes: "austinfc.typeform.com/to/bYJOT3j9" },
    ],
    winStrategy: {
      differentiators: [
        "24 live platforms — not a concept, a working business",
        "Veteran-founded, Black-led — authentic underrepresented entrepreneur",
        "$3.6M+ grant pipeline shows revenue growth trajectory",
        "Government contract (Central Health CMS) shows enterprise credibility",
        "AI-powered platform solving a real problem — 79% of Black-led orgs have no data systems",
      ],
      reviewerPriorities: [
        "Scalable business with clear growth trajectory",
        "Authentic connection to underrepresented communities",
        "Clear use of $100K with measurable impact",
        "Austin-area business serving local community",
      ],
      scoringTips: [
        "Lead with the 24-platform ecosystem — judges can visit the live sites",
        "Show the $3.6M grant pipeline — this is a real business, not a side project",
        "Connect to Austin FC's equity pillar — your mission IS equity",
      ],
      commonPitfalls: [
        "Being too technical — lead with community impact, not architecture details",
        "Not showing revenue/sustainability — grants + contracts + SaaS = viable model",
      ],
    },
  },
  {
    id: "doj-second-chance",
    name: "DOJ Second Chance Act",
    fullName: "FY25 Second Chance Act Community-Based Reentry Program",
    funder: "U.S. Department of Justice — Bureau of Justice Assistance (BJA)",
    amount: "Up to $1,000,000",
    deadline: "May 11, 2026 (JustGrants)",
    deadlineUrgency: "approaching" as const,
    icon: Scale,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    description: "Federal reentry program funding mentoring and transitional services for adults returning from incarceration. BJA anticipates 13 awards from a $12.5M pool. Nonprofits with 501(c)(3) status are directly eligible.",
    referenceUrl: "https://bja.ojp.gov/funding/opportunities/o-bja-2025-172499",
    referenceLabel: "BJA Solicitation O-BJA-2025-172499",
    grantKnowledge: `FY25 Second Chance Act Community-Based Reentry Program — Up to $1,000,000.
SOLICITATION: O-BJA-2025-172499, posted March 25, 2026.
PURPOSE: Support community-based organizations to provide mentoring and transitional services for adults returning to communities after incarceration who are assessed as moderate-to-high risk for recidivism. Services may be pre- and/or post-release.
TOTAL POOL: $12.5 million across approximately 13 awards.
ELIGIBLE APPLICANTS: 501(c)(3) nonprofits (TCAF qualifies directly), federally recognized tribal governments. State/local governments NOT eligible for this specific program.
KEY DATES: Grants.gov deadline May 4, 2026. JustGrants deadline May 11, 2026, 8:59 PM ET.
PRIORITIES: (1) Evidence-based mentoring programs, (2) Transitional services including employment, housing, substance abuse treatment, (3) Risk/needs assessment tools, (4) Data-driven recidivism reduction strategies.
WHY WE FIT: Justice Command Center provides tract-level crime migration analysis (Buffalo East Side, Wilmington Creekwood, Austin gentrification corridor). Dr. Flood's implementation science approach — "crime migrates with gentrification" and "county averages lie, tract-level tells truth" — is exactly the evidence-based framework BJA wants. Workforce development pathways (CHW certification, career explorer) serve as reentry employment pipelines. Veteran-founded, Black-led nonprofit checks multiple DOJ priority areas.
SUBMITTING ENTITY: The Collaborative Advocate Foundation — EIN 41-3618003, 501(c)(3).`,
    serviceArea: {
      region: "Central Texas",
      state: "Texas",
      counties: ["Travis", "Williamson", "Hays", "Bastrop"],
      city: "Austin",
      keyIndustries: ["Healthcare", "Construction", "Logistics", "Food Service", "Manufacturing"],
      targetEmployers: [
        { name: "Goodwill Central Texas", sector: "Workforce Development", type: "Job training, employment placement for justice-involved adults" },
        { name: "CommUnityCare Health Centers", sector: "Healthcare", type: "FQHC — CHW roles, medical assistant pathways for reentry population" },
        { name: "H-E-B", sector: "Retail/Logistics", type: "Second-chance employer — store operations, warehouse, CDL training" },
        { name: "Austin Resource Recovery", sector: "Government", type: "City of Austin — CDL, equipment operator, maintenance roles" },
        { name: "Foundation Communities", sector: "Housing/Services", type: "Affordable housing + workforce services for justice-involved adults" },
      ],
      laborMarketNotes: "Travis County processes ~40,000 criminal cases/year. Texas reincarceration rate ~21.4% within 3 years. Austin MSA has growing second-chance employer network. Key credential gaps for reentry population: CDL, forklift, food handler, OSHA-10, CNA.",
      locationEligibility: "national",
      locationNotes: "Federal grant — open to nonprofits nationwide. TCAF's Central Texas focus with tract-level data for Austin gentrification corridor and justice-involved population analysis provides strong local evidence base.",
      multiSiteEligible: true,
      multiSiteNotes: "Can propose services in multiple Texas communities. Consider including Travis County (Austin) as primary and expanding to Williamson/Hays counties where gentrification is pushing formerly incarcerated populations.",
    },
    partnershipTimeline: {
      summary: "DOJ values existing community partnerships. Secure reentry service providers, employers willing to hire justice-involved adults, and local criminal justice agencies before drafting. Letters of support from probation/parole, sheriff's office, and community organizations strengthen the application significantly.",
      workflowOrder: "SAM.gov Verification → Partner Letters → Narrative Draft → Budget → JustGrants Submission",
      requirements: [
        { partnerType: "Criminal Justice Agencies", requiredInDocs: true, timing: "pre-award", docSections: ["Program Narrative", "Letters of Support"], description: "Local probation/parole offices, sheriff's department, county jail re-entry coordinators. They refer participants and validate your approach. Travis County has an active reentry initiative.", evidenceNeeded: "Letters of support on agency letterhead describing planned collaboration, referral pathways, and data-sharing agreements" },
        { partnerType: "Second-Chance Employers", requiredInDocs: true, timing: "pre-award", docSections: ["Program Narrative", "Budget"], description: "Employers committed to hiring justice-involved adults. Must demonstrate real job placement pipeline, not aspirational partnerships.", evidenceNeeded: "Commitment letters specifying number of positions, types of roles, onboarding support, and any ban-the-box policies" },
        { partnerType: "Housing Partners", requiredInDocs: true, timing: "pre-award", docSections: ["Program Narrative"], description: "Transitional and permanent housing partners. Housing instability is the #1 predictor of recidivism. Foundation Communities, ECHO (Ending Community Homelessness Coalition), or similar.", evidenceNeeded: "Letters describing housing slots, referral process, and capacity for justice-involved adults" },
        { partnerType: "Substance Abuse / Mental Health", requiredInDocs: false, timing: "both", docSections: ["Program Narrative"], description: "Treatment providers for co-occurring substance use and mental health needs. Integral Care (Travis County LMHA) is the primary public provider.", evidenceNeeded: "Letters of support, referral agreements" },
        { partnerType: "Mentoring Program Partners", requiredInDocs: true, timing: "pre-award", docSections: ["Program Narrative", "Budget"], description: "SCA specifically funds mentoring. You need a structured mentoring component — peer mentors with lived experience are highly valued by BJA.", evidenceNeeded: "Mentoring program design, mentor recruitment plan, training curriculum for mentors" },
      ],
    },
    essentials: [
      { label: "501(c)(3) Eligible", detail: "TCAF qualifies directly as a 501(c)(3) nonprofit — no state/local government required", critical: true },
      { label: "Up to $1M Award", detail: "BJA anticipates 13 awards from $12.5M pool — approximately $1M each", critical: true },
      { label: "JustGrants Deadline May 11", detail: "Grants.gov SF-424 due May 4, full JustGrants application due May 11, 2026 at 8:59 PM ET", critical: true },
      { label: "Mentoring + Transitional Services", detail: "Must provide structured mentoring and transitional services (employment, housing, substance abuse) for adults returning from incarceration" },
      { label: "Moderate-to-High Risk Focus", detail: "Must serve individuals assessed as moderate-to-high risk for recidivism using validated risk assessment tools" },
      { label: "Pre/Post Release Services", detail: "Can provide services before and/or after release — flexibility in program design" },
      { label: "SAM.gov Required", detail: "Active SAM.gov registration with current UEI number required for all federal grants" },
      { label: "Evidence-Based Required", detail: "Must demonstrate evidence-based or evidence-informed approaches — your implementation science framework (CFIR 2.0, RE-AIM) is a strong differentiator" },
    ],
    competitiveEdge: [
      "Justice Command Center with tract-level crime migration data — most applicants don't have live analytics",
      "Dr. Flood's 'crime migrates with gentrification' framework backed by Census tract data from Buffalo, Wilmington, Austin",
      "24-platform ecosystem provides wraparound services (health, education, workforce) that BJA values in reentry programs",
      "Veteran-founded, Black-led organization — DOJ Priority 1 areas include serving communities of color",
      "Implementation science approach (CFIR 2.0, RE-AIM) provides the evidence framework DOJ reviewers want to see",
      "Existing workforce pathways (CHW, career explorer, credential tracking) serve as immediate employment pipelines for reentry population",
      "RPLICE system provides built-in fidelity monitoring — can demonstrate program quality assurance from Day 1",
    ],
    sections: [
      { id: "sca-narrative", name: "Program Narrative", description: "Reentry service model, mentoring design, evidence base, target population, and community partnerships", icon: FileText, status: "not-started" as ApprovalStatus, content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI", pageLimit: "20 pages", wordCount: "8,000–10,000 words" },
      { id: "sca-budget", name: "Budget Detail Worksheet & Narrative", description: "Detailed budget with justification aligned to BJA cost categories", icon: DollarSign, status: "not-started" as ApprovalStatus, content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "Per BJA template", wordCount: "2,000–3,000 words" },
      { id: "sca-capabilities", name: "Organizational Capabilities", description: "TCAF capacity, track record, key personnel, facilities", icon: Building2, status: "not-started" as ApprovalStatus, content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI", pageLimit: "5 pages", wordCount: "2,000–2,500 words" },
      { id: "sca-data", name: "Data & Evidence Strategy", description: "Risk assessment tools, recidivism tracking, outcome measurement, Justice Command Center analytics", icon: BarChart3, status: "not-started" as ApprovalStatus, content: "", reviewNotes: "", lastUpdated: "", assignee: "AI + Dr. Flood Review", pageLimit: "5 pages", wordCount: "1,500–2,000 words" },
      { id: "sca-mentoring", name: "Mentoring Program Design", description: "Structured mentoring model, mentor recruitment/training, peer mentor component", icon: Users, status: "not-started" as ApprovalStatus, content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI", pageLimit: "5 pages", wordCount: "1,500–2,000 words" },
      { id: "sca-letters", name: "Letters of Support", description: "Criminal justice agencies, employers, housing, treatment, community partners", icon: Handshake, status: "not-started" as ApprovalStatus, content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "No limit", wordCount: "300–500 words each" },
    ],
    phases: [
      {
        id: "collaborate" as PhaseId, name: "1. Collaborate & Research", description: "Understand BJA priorities, build reentry partnerships, gather local justice data", status: "active" as const,
        tasks: [
          { id: "sca-c1", task: "Verify SAM.gov registration is active and current", owner: "Dr. Flood", status: "pending" as const, dueDate: "April 10, 2026", guidance: "SAM.gov registration must be active before submitting any federal grant. Verify at sam.gov — search for The Collaborative Advocate Foundation. Ensure UEI number is current. Registration renewal takes 24-48 hours if expired." },
          { id: "sca-c2", task: "Pull Travis County reentry data — incarceration rates, recidivism, demographics by census tract", owner: "AI", status: "pending" as const, dueDate: "April 12, 2026", guidance: "Use Justice Command Center data: Austin gentrification corridor tract-level analysis, crime migration patterns, demographic shifts. Pull Texas Department of Criminal Justice (TDCJ) recidivism data for Travis County.", aiCanHelp: true, aiAction: "Compile Travis County reentry data brief" },
          { id: "sca-c3", task: "Contact Travis County Reentry Roundtable for partnership", owner: "Dr. Flood", status: "pending" as const, dueDate: "April 14, 2026", guidance: "Travis County has an active Reentry Roundtable coordinating services for returning citizens. Contact them to discuss partnership, letter of support, and referral pipeline. This demonstrates community integration." },
          { id: "sca-c4", task: "Secure 3-5 second-chance employer commitments", owner: "Dr. Flood", status: "pending" as const, dueDate: "April 21, 2026", guidance: "Target: Goodwill Central Texas, H-E-B (known second-chance employer), Foundation Communities, Austin Resource Recovery, construction contractors. Need signed commitment letters specifying roles and number of positions." },
          { id: "sca-c5", task: "Design mentoring program model with peer mentor component", owner: "Dr. Flood + AI", status: "pending" as const, dueDate: "April 18, 2026", guidance: "BJA specifically funds mentoring in SCA grants. Design a structured model: (1) peer mentors with lived experience of incarceration, (2) professional mentors from employer partners, (3) 12-month minimum mentoring relationship, (4) training curriculum for mentors.", aiCanHelp: true, aiAction: "Draft mentoring program framework" },
        ],
      },
      {
        id: "build" as PhaseId, name: "2. Build & Draft", description: "Write narrative, budget, evidence strategy, and compile documentation", status: "upcoming" as const,
        tasks: [
          { id: "sca-b1", task: "Draft program narrative with reentry service model", owner: "AI + Dr. Flood Review", status: "pending" as const, dueDate: "April 25, 2026" },
          { id: "sca-b2", task: "Develop budget aligned to BJA cost categories", owner: "Dr. Flood", status: "pending" as const, dueDate: "April 27, 2026" },
          { id: "sca-b3", task: "Write data/evidence strategy featuring Justice Command Center", owner: "AI + Dr. Flood Review", status: "pending" as const, dueDate: "April 25, 2026" },
          { id: "sca-b4", task: "Document mentoring program design with training curriculum", owner: "Dr. Flood + AI", status: "pending" as const, dueDate: "April 25, 2026" },
          { id: "sca-b5", task: "Compile organizational capabilities section", owner: "AI + Dr. Flood Review", status: "pending" as const, dueDate: "April 23, 2026" },
        ],
      },
      {
        id: "review" as PhaseId, name: "3. Review & Approve", description: "Dr. Flood review + RPLICE quality gate", status: "upcoming" as const,
        tasks: [
          { id: "sca-r1", task: "RPLICE quality review — CFIR 2.0 + RE-AIM assessment against narrative", owner: "RPLICE System", status: "pending" as const, dueDate: "April 30, 2026" },
          { id: "sca-r2", task: "Dr. Flood full narrative review and approval", owner: "Dr. Flood", status: "pending" as const, dueDate: "May 2, 2026" },
          { id: "sca-r3", task: "Budget review — verify BJA allowable costs compliance", owner: "Dr. Flood", status: "pending" as const, dueDate: "May 2, 2026" },
          { id: "sca-r4", task: "Final compliance check against solicitation requirements", owner: "Dr. Flood + AI", status: "pending" as const, dueDate: "May 3, 2026" },
        ],
      },
      {
        id: "submit" as PhaseId, name: "4. Package & Submit", description: "Submit SF-424 on Grants.gov, then full application on JustGrants", status: "upcoming" as const,
        tasks: [
          { id: "sca-s1", task: "Submit SF-424 on Grants.gov by May 4 deadline", owner: "Dr. Flood", status: "pending" as const, dueDate: "May 4, 2026" },
          { id: "sca-s2", task: "Submit full application on JustGrants by May 11 deadline", owner: "Dr. Flood", status: "pending" as const, dueDate: "May 11, 2026" },
          { id: "sca-s3", task: "Confirm receipt and save confirmation numbers", owner: "Dr. Flood", status: "pending" as const, dueDate: "May 11, 2026" },
        ],
      },
      {
        id: "pre-execute" as PhaseId, name: "5. Pre-Execution Readiness", description: "Prepare for program launch if awarded (awards expected Sept-Oct 2026)", status: "upcoming" as const,
        tasks: [
          { id: "sca-p1", task: "Configure reentry tracking module in Justice Command Center", owner: "AI", status: "pending" as const, dueDate: "TBD" },
          { id: "sca-p2", task: "Recruit and train peer mentors with lived experience", owner: "Dr. Flood", status: "pending" as const, dueDate: "TBD" },
          { id: "sca-p3", task: "Formalize employer partnership agreements and onboarding", owner: "Dr. Flood", status: "pending" as const, dueDate: "TBD" },
          { id: "sca-p4", task: "Set up BJA performance reporting in platform", owner: "AI", status: "pending" as const, dueDate: "TBD" },
        ],
      },
    ],
    preExecutionChecklist: [
      { id: "sca-pe1", category: "Registration", item: "SAM.gov registration active", status: "verified" as const, notes: "", guidance: "Must be active before submission. Verify UEI number matches across Grants.gov and JustGrants.", resources: [{ label: "SAM.gov", url: "https://sam.gov" }] },
      { id: "sca-pe2", category: "Registration", item: "Grants.gov account active", status: "pending" as const, notes: "", guidance: "Need active Grants.gov account to submit SF-424. Register at grants.gov if not already registered.", resources: [{ label: "Grants.gov", url: "https://www.grants.gov" }] },
      { id: "sca-pe3", category: "Registration", item: "JustGrants account active", status: "pending" as const, notes: "", guidance: "DOJ uses JustGrants for full application. Separate from Grants.gov. Register at justgrants.usdoj.gov.", resources: [{ label: "JustGrants", url: "https://justgrants.usdoj.gov" }] },
      { id: "sca-pe4", category: "Compliance", item: "501(c)(3) status confirmed", status: "verified" as const, notes: "EIN 41-3618003", guidance: "TCAF's 501(c)(3) status is current. Include IRS determination letter in application." },
      { id: "sca-pe5", category: "Partnerships", item: "Criminal justice agency letters secured", status: "action-needed" as const, notes: "Contact Travis County Reentry Roundtable, probation/parole", guidance: "Need letters from local criminal justice agencies demonstrating collaboration and referral pipeline." },
      { id: "sca-pe6", category: "Partnerships", item: "Second-chance employer commitments (3-5)", status: "action-needed" as const, notes: "Target Goodwill, H-E-B, Foundation Communities", guidance: "Need signed commitment letters from employers willing to hire justice-involved adults." },
      { id: "sca-pe7", category: "Data", item: "Justice Command Center reentry data ready", status: "verified" as const, notes: "Tract-level crime migration analysis operational", guidance: "Justice Command Center already has Austin gentrification corridor analysis. Add reentry-specific metrics." },
      { id: "sca-pe8", category: "Technology", item: "Reentry tracking module configured", status: "pending" as const, notes: "Configure in Justice Command Center", guidance: "Add reentry-specific tracking: risk assessments, mentoring contacts, employment placement, housing stability, recidivism monitoring." },
    ],
    winStrategy: {
      differentiators: [
        "Justice Command Center with live tract-level crime migration data — no other applicant has this",
        "Implementation science framework (CFIR 2.0, RE-AIM) matches BJA's evidence-based requirements",
        "24-platform ecosystem provides wraparound services (health, education, workforce) in one integrated system",
        "Veteran-founded, Black-led organization serving communities most impacted by mass incarceration",
        "Dr. Flood's research: 'crime migrates with gentrification' — original scholarly insight backed by Census data",
        "Built-in fidelity monitoring via RPLICE — can demonstrate program quality assurance from Day 1",
      ],
      reviewerPriorities: [
        "Evidence-based mentoring model with validated risk assessment",
        "Strong community partnerships — criminal justice agencies, employers, housing, treatment",
        "Data-driven approach to reducing recidivism with measurable outcomes",
        "Organizational capacity to manage federal funds and reporting requirements",
        "Services addressing multiple reentry needs: employment, housing, substance abuse, mental health",
        "Cultural responsiveness and equity focus in service delivery",
      ],
      scoringTips: [
        "Lead with tract-level data showing where returning citizens concentrate — reviewers rarely see this precision",
        "Cite specific recidivism reduction targets with methodology for measurement",
        "Name every partner with specific roles — don't be vague about collaboration",
        "Show how the 24-platform ecosystem addresses BJA's preference for comprehensive wraparound services",
        "Reference Dr. Flood's military service background — DOJ values veteran leadership",
        "Include a logic model connecting activities → outputs → short-term outcomes → long-term recidivism reduction",
      ],
      commonPitfalls: [
        "Vague mentoring plan — BJA wants structured, evidence-based mentoring with training and supervision",
        "No risk assessment tool identified — must specify validated instrument (LSI-R, COMPAS, ORAS, etc.)",
        "Missing housing component — housing is the #1 predictor of recidivism, cannot be overlooked",
        "Budget misaligned with BJA cost categories — review solicitation budget instructions carefully",
        "Not addressing sustainability after grant period — BJA wants to know what continues after funding ends",
      ],
    },
  },
  {
    id: "tx-capital-foundation",
    name: "TX Capital Foundation",
    fullName: "Texas Capital Foundation Honors Awards — Veterans & First Responders + Education & Workforce Development",
    funder: "Texas Capital Foundation",
    amount: "$50,000 - $100,000",
    deadline: "TBD — Contact Foundation",
    deadlineUrgency: "on-track" as const,
    icon: Award,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    description: "Texas Capital Foundation awards $100K for Veterans & First Responders and $50K for Education & Workforce Development. TCAF qualifies for BOTH categories. Must serve low-to-moderate-income communities in Austin, Dallas, Fort Worth, Houston, or San Antonio with 3+ years of performance.",
    referenceUrl: "https://texascapitalbank.com/foundation",
    referenceLabel: "Texas Capital Foundation",
    grantKnowledge: `Texas Capital Foundation Honors Awards — $50,000–$100,000.
THREE CATEGORIES: (1) Housing Solutions — $50K, (2) Education & Workforce Development — $50K, (3) Veterans & First Responders — $100K.
TCAF QUALIFIES FOR TWO: Veterans & First Responders ($100K) — veteran-founded organization serving veteran population. Education & Workforce Development ($50K) — ThriveUp Academy is literally a workforce development platform.
ELIGIBILITY: 501(c)(3) or 501(c)(4) with 3+ year performance record. Must serve low-to-moderate-income communities within Texas Capital's service areas: Dallas, Fort Worth, Austin, Houston, San Antonio. Must be active in IRS Publication 78.
ALSO AVAILABLE: Community Impact Grants — smaller grants aligned to CRA requirements, same focus areas.
NOT ELIGIBLE: Political advocacy, for-profit orgs, municipalities, membership orgs, ticketed events.
APPLICATION REQUIREMENTS: Financial statements, board member list, organization chart. Impact Statement required at conclusion of grant year.
SUBMITTING ENTITY: The Collaborative Advocate Foundation — EIN 41-3618003, 501(c)(3), 17912 Stefano Drive, Pflugerville, TX 78660.
WHY WE WIN: Veteran-founded (Dr. Terry Flood, U.S. Army veteran), Black-led, 501(c)(3) with 3+ years, serving low-to-moderate-income communities in Austin service area. We hit TWO of their three categories. 24-platform technology ecosystem demonstrates innovation and scale that most local nonprofits can't match.`,
    essentials: [
      { label: "Two Category Fit", detail: "TCAF qualifies for Veterans & First Responders ($100K) AND Education & Workforce Development ($50K) — can potentially apply for both", critical: true },
      { label: "Austin Service Area", detail: "Pflugerville/Austin is within Texas Capital's service area — home court advantage", critical: true },
      { label: "3+ Year Track Record", detail: "Must demonstrate minimum 3 years of program performance — ensure documentation is ready" },
      { label: "Low-to-Moderate Income", detail: "Must serve LMI communities — your Census tract data proves this definitively" },
      { label: "Financial Docs Required", detail: "Financial statements, board member list, and org chart must be submitted with application" },
      { label: "Impact Statement Post-Award", detail: "Grantees must provide Impact Statement at conclusion of grant year — your platform tracks this automatically" },
      { label: "Deadline TBD", detail: "Application cycle timing not publicly posted — contact foundation directly to get on the notification list" },
    ],
    competitiveEdge: [
      "Veteran-founded AND workforce development — hits TWO of three focus categories",
      "Based in Austin — Texas Capital service area with local community presence",
      "24-platform technology ecosystem shows innovation that stands out from traditional nonprofits",
      "Census tract data proves LMI community service — not just claiming it, showing it",
      "Dr. Flood's U.S. Army service combined with 7-discipline academic foundation",
      "Existing platform with measurable outcomes — not a startup or concept",
    ],
    sections: [
      { id: "txcf-narrative", name: "Program Narrative", description: "Organization mission, program impact, community served, veteran connection", icon: FileText, status: "not-started" as ApprovalStatus, content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI", pageLimit: "Per application format", wordCount: "3,000–5,000 words" },
      { id: "txcf-financials", name: "Financial Statements", description: "Current financial statements demonstrating organizational health", icon: DollarSign, status: "not-started" as ApprovalStatus, content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "N/A", wordCount: "N/A" },
      { id: "txcf-board", name: "Board Member List", description: "Current board of directors with affiliations", icon: Users, status: "not-started" as ApprovalStatus, content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "1-2 pages", wordCount: "N/A" },
      { id: "txcf-orgchart", name: "Organization Chart", description: "Current organizational structure", icon: Layers, status: "not-started" as ApprovalStatus, content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "1 page", wordCount: "N/A" },
      { id: "txcf-impact", name: "Impact Evidence", description: "3+ years of program performance data, outcomes, community testimonials", icon: BarChart3, status: "not-started" as ApprovalStatus, content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI", pageLimit: "Per application format", wordCount: "1,500–2,500 words" },
    ],
    phases: [
      {
        id: "collaborate" as PhaseId, name: "1. Research & Contact", description: "Contact Texas Capital Foundation, understand timeline, prepare documentation", status: "active" as const,
        tasks: [
          { id: "txcf-c1", task: "Contact Texas Capital Foundation to get on application notification list", owner: "Dr. Flood", status: "pending" as const, dueDate: "April 7, 2026", guidance: "Visit texascapitalbank.com/foundation or call Texas Capital Bank's community relations department. Ask: (1) When does the next Honors Awards application cycle open? (2) How to apply for Community Impact Grants? (3) Can you apply for both Veterans and Education/Workforce categories?" },
          { id: "txcf-c2", task: "Verify TCAF is active in IRS Publication 78", owner: "Dr. Flood", status: "pending" as const, dueDate: "April 7, 2026", guidance: "Search IRS Tax Exempt Organization Search (TEOS) at apps.irs.gov/app/eos/ for The Collaborative Advocate Foundation. Must appear in Publication 78 database.", resources: [{ label: "IRS TEOS", url: "https://apps.irs.gov/app/eos/" }] },
          { id: "txcf-c3", task: "Compile 3+ years of program performance documentation", owner: "Dr. Flood + AI", status: "pending" as const, dueDate: "April 14, 2026", guidance: "Texas Capital requires 3-year track record. Gather: annual reports, program data, community impact metrics, testimonials, media coverage. Your platform dashboards can generate much of this.", aiCanHelp: true, aiAction: "Generate program performance summary from platform data" },
          { id: "txcf-c4", task: "Prepare current financial statements", owner: "Dr. Flood", status: "pending" as const, dueDate: "April 14, 2026", guidance: "Need current financials — ideally audited or reviewed. If not audited, compiled statements from accountant plus most recent Form 990." },
          { id: "txcf-c5", task: "Update board member list and org chart", owner: "Dr. Flood", status: "pending" as const, dueDate: "April 14, 2026" },
        ],
      },
      {
        id: "build" as PhaseId, name: "2. Build Application", description: "Draft narrative and compile supporting documentation", status: "upcoming" as const,
        tasks: [
          { id: "txcf-b1", task: "Draft Veterans & First Responders category narrative", owner: "AI + Dr. Flood Review", status: "pending" as const, dueDate: "TBD" },
          { id: "txcf-b2", task: "Draft Education & Workforce Development category narrative", owner: "AI + Dr. Flood Review", status: "pending" as const, dueDate: "TBD" },
          { id: "txcf-b3", task: "Compile LMI community service evidence with Census tract data", owner: "AI", status: "pending" as const, dueDate: "TBD", aiCanHelp: true, aiAction: "Generate LMI service evidence from Census data" },
        ],
      },
      {
        id: "review" as PhaseId, name: "3. Review & Approve", description: "Dr. Flood review before submission", status: "upcoming" as const,
        tasks: [
          { id: "txcf-r1", task: "Dr. Flood narrative review and approval", owner: "Dr. Flood", status: "pending" as const, dueDate: "TBD" },
          { id: "txcf-r2", task: "Verify all required documents are complete", owner: "Dr. Flood", status: "pending" as const, dueDate: "TBD" },
        ],
      },
      {
        id: "submit" as PhaseId, name: "4. Submit Application", description: "Submit through Texas Capital Foundation portal", status: "upcoming" as const,
        tasks: [
          { id: "txcf-s1", task: "Submit application through foundation portal when cycle opens", owner: "Dr. Flood", status: "pending" as const, dueDate: "TBD" },
          { id: "txcf-s2", task: "Confirm receipt", owner: "Dr. Flood", status: "pending" as const, dueDate: "TBD" },
        ],
      },
      {
        id: "pre-execute" as PhaseId, name: "5. Pre-Execution Readiness", description: "Prepare for impact reporting if awarded", status: "upcoming" as const,
        tasks: [
          { id: "txcf-p1", task: "Configure Impact Statement tracking for grant year", owner: "AI", status: "pending" as const, dueDate: "TBD" },
          { id: "txcf-p2", task: "Set up quarterly reporting aligned to grant goals", owner: "Dr. Flood + AI", status: "pending" as const, dueDate: "TBD" },
        ],
      },
    ],
    preExecutionChecklist: [
      { id: "txcf-pe1", category: "Compliance", item: "501(c)(3) status confirmed", status: "verified" as const, notes: "EIN 41-3618003", guidance: "TCAF's 501(c)(3) status is current." },
      { id: "txcf-pe2", category: "Compliance", item: "Active in IRS Publication 78", status: "action-needed" as const, notes: "Verify at apps.irs.gov/app/eos/", guidance: "Must be searchable in IRS Tax Exempt Organization Search.", resources: [{ label: "IRS TEOS", url: "https://apps.irs.gov/app/eos/" }] },
      { id: "txcf-pe3", category: "Documentation", item: "3+ year performance record documented", status: "action-needed" as const, notes: "Compile program data, outcomes, testimonials", guidance: "Foundation requires minimum 3-year track record of program performance." },
      { id: "txcf-pe4", category: "Documentation", item: "Current financial statements ready", status: "pending" as const, notes: "", guidance: "Audited or reviewed financial statements preferred. At minimum, compiled statements + Form 990." },
      { id: "txcf-pe5", category: "Documentation", item: "Board member list current", status: "pending" as const, notes: "", guidance: "List all current board members with professional affiliations." },
      { id: "txcf-pe6", category: "Documentation", item: "Organization chart current", status: "pending" as const, notes: "", guidance: "Visual org chart showing reporting structure and key positions." },
      { id: "txcf-pe7", category: "Location", item: "Austin service area confirmed", status: "verified" as const, notes: "Pflugerville, TX is within Austin service area", guidance: "Texas Capital Foundation serves Dallas, Fort Worth, Austin, Houston, San Antonio. Pflugerville is Austin metro." },
    ],
    winStrategy: {
      differentiators: [
        "Veteran-founded — qualifies for the $100K Veterans & First Responders category",
        "Workforce development platform — also qualifies for $50K Education & Workforce category",
        "Local Austin presence — Texas Capital Foundation values local community connection",
        "24-platform technology ecosystem — stands out from traditional nonprofits",
        "Census tract data proves LMI community service with precision",
        "Black-led organization serving communities of color — equity focus",
      ],
      reviewerPriorities: [
        "Demonstrated 3+ year track record with measurable outcomes",
        "Direct services to low-to-moderate-income communities",
        "Strong organizational capacity and financial health",
        "Clear alignment to Veterans or Education/Workforce focus areas",
        "Community impact that is sustainable beyond the grant period",
      ],
      scoringTips: [
        "Lead with Dr. Flood's military service for the Veterans category — personal connection matters",
        "Show the technology platform as a force multiplier — $100K goes further with existing infrastructure",
        "Include Census tract maps showing exactly which LMI communities you serve",
        "Emphasize that TCAF is Austin-based — local organizations get priority over national applicants",
        "For Education/Workforce: highlight credential attainment data and career pathway completion rates",
      ],
      commonPitfalls: [
        "Not having 3 years of documented performance data — start compiling now",
        "Financial statements not current or professionally prepared",
        "Describing plans instead of existing programs — they fund proven work",
        "Not demonstrating direct service to LMI communities with data",
      ],
    },
  },
  {
    id: "tx-health-resources",
    name: "TX Health Resources",
    fullName: "Texas Health Resources Community Impact Grants — Health Equity & Social Determinants",
    funder: "Texas Health Resources",
    amount: "$5,000,000 pool (varies per award)",
    deadline: "2027-2028 RFP expected mid-2026",
    deadlineUrgency: "on-track" as const,
    icon: Heart,
    color: "text-rose-600",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    borderColor: "border-rose-200 dark:border-rose-800",
    description: "Texas Health Resources awards strategic collaborative grants totaling $5M per cycle to drive transformative health equity improvements. Current 2025-2026 cycle is underway; the 2027-2028 RFP will be released in 2026. This is a WATCH LIST item — prepare now, apply when cycle opens.",
    referenceUrl: "https://www.texashealth.org/community-health/community-impact/Grant-Opportunities",
    referenceLabel: "Texas Health Community Impact — Grant Opportunities",
    grantKnowledge: `Texas Health Resources Community Impact Grants — $5,000,000 total pool per 2-year cycle.
STATUS: 2025-2026 cycle is CLOSED/IN PROGRESS. 2027-2028 RFP expected to be released in 2026.
FOCUS AREAS: Access to care, health literacy, food security/nutrition, behavioral health, social determinants of health (SDoH). Must drive transformative, measurable changes in health equity.
APPROACH: Strategic, collaborative grants — they want multi-organization partnerships, not solo programs. Community-driven solutions with data-driven approaches.
WHY WE FIT: Sankofa Health (culturally responsive screening), PillScheduler (medication adherence), WholeMind Learning (mental health), AutoImmune Thrive (chronic disease), Speech Bridge (communication access). 7 health-focused platforms across the ecosystem. CHW workforce pipeline directly addresses access to care in underserved communities.
SUBMITTING ENTITY: The Collaborative Advocate Foundation — EIN 41-3618003, 501(c)(3).
WATCH LIST: Sign up for email notifications at texashealth.org/community-health/community-impact to be notified when 2027-2028 RFP drops.`,
    essentials: [
      { label: "WATCH LIST — Not Open Yet", detail: "2025-2026 cycle is underway. 2027-2028 RFP expected to release mid-to-late 2026. Sign up for notifications now.", critical: true },
      { label: "$5M Pool", detail: "Strategic collaborative grants from a $5 million pool per 2-year cycle — substantial funding" },
      { label: "Collaborative Required", detail: "Texas Health wants multi-organization partnerships, not solo applicants — start identifying health system partners now" },
      { label: "Health Equity Focus", detail: "Access to care, health literacy, food security, behavioral health, SDoH — your 7 health platforms align directly" },
      { label: "Data-Driven", detail: "Must demonstrate data-driven approach — your Census tract health disparity data and platform analytics are exactly what they want" },
      { label: "CHW Pipeline", detail: "Your CHW workforce pipeline addresses their access-to-care priority — trained CHWs expand healthcare reach in underserved communities" },
    ],
    competitiveEdge: [
      "7 health-focused platforms in the ecosystem — Sankofa, PillScheduler, WholeMind, AutoImmune Thrive, Speech Bridge, and more",
      "CHW workforce pipeline directly addresses healthcare access gaps — train and deploy CHWs in underserved communities",
      "Census tract health disparity data provides the evidence base Texas Health values",
      "Implementation science framework ensures program fidelity and measurable outcomes",
      "Existing technology infrastructure means grant funds go to services, not system-building",
      "Culturally responsive health approaches — Sankofa methodology centers community voice",
    ],
    sections: [
      { id: "txhr-prep", name: "Pre-Application Research", description: "Study 2025-2026 awardees, identify partnership opportunities, compile health disparity data", icon: Search, status: "not-started" as ApprovalStatus, content: "", reviewNotes: "", lastUpdated: "", assignee: "AI + Dr. Flood", pageLimit: "N/A", wordCount: "N/A" },
      { id: "txhr-partners", name: "Partnership Development", description: "Identify and engage health system collaborative partners before RFP drops", icon: Handshake, status: "not-started" as ApprovalStatus, content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood", pageLimit: "N/A", wordCount: "N/A" },
      { id: "txhr-data", name: "Health Disparity Data Brief", description: "Census tract health data for Central Texas — access gaps, chronic disease, behavioral health, SDoH indicators", icon: BarChart3, status: "not-started" as ApprovalStatus, content: "", reviewNotes: "", lastUpdated: "", assignee: "AI", pageLimit: "5-10 pages", wordCount: "2,000–3,000 words" },
      { id: "txhr-narrative", name: "Draft Narrative Framework", description: "Pre-draft narrative framework that can be adapted when RFP requirements are known", icon: FileText, status: "not-started" as ApprovalStatus, content: "", reviewNotes: "", lastUpdated: "", assignee: "AI + Dr. Flood Review", pageLimit: "TBD (per RFP)", wordCount: "TBD" },
    ],
    phases: [
      {
        id: "collaborate" as PhaseId, name: "1. Pre-RFP Preparation", description: "Get on notification list, study past awardees, build partnerships BEFORE the RFP drops", status: "active" as const,
        tasks: [
          { id: "txhr-c1", task: "Sign up for Texas Health Community Impact email notifications", owner: "Dr. Flood", status: "pending" as const, dueDate: "April 7, 2026", guidance: "Go to texashealth.org/community-health/community-impact/Grant-Opportunities and sign up for the email distribution list. This ensures you know the moment the 2027-2028 RFP is released.", resources: [{ label: "THR Grant Opportunities", url: "https://www.texashealth.org/community-health/community-impact/Grant-Opportunities" }] },
          { id: "txhr-c2", task: "Research 2025-2026 cycle awardees — what did they fund?", owner: "AI", status: "pending" as const, dueDate: "April 14, 2026", guidance: "Study the current round's awardees to understand what Texas Health values: types of organizations, program models, geographic focus, partnership structures. This intelligence shapes your application.", aiCanHelp: true, aiAction: "Research THR 2025-2026 grant awardees" },
          { id: "txhr-c3", task: "Identify collaborative health system partners for joint application", owner: "Dr. Flood", status: "pending" as const, dueDate: "May 2026", guidance: "Texas Health wants collaborative applications. Consider: CommUnityCare Health Centers (FQHC), Integral Care (LMHA), Central Health, Lone Star Circle of Care, People's Community Clinic. A partnership with an established health system dramatically strengthens your application." },
          { id: "txhr-c4", task: "Compile Central Texas health disparity data by census tract", owner: "AI", status: "pending" as const, dueDate: "May 2026", guidance: "Pull CDC PLACES data, County Health Rankings, and Census ACS data for Travis County census tracts. Focus on: uninsured rates, chronic disease prevalence, mental health indicators, food access, transportation barriers.", aiCanHelp: true, aiAction: "Compile Travis County health disparity data" },
        ],
      },
      {
        id: "build" as PhaseId, name: "2. Draft Framework", description: "Pre-build narrative framework and partnership commitments so you're ready when RFP drops", status: "upcoming" as const,
        tasks: [
          { id: "txhr-b1", task: "Draft narrative framework with health equity focus", owner: "AI + Dr. Flood Review", status: "pending" as const, dueDate: "TBD" },
          { id: "txhr-b2", task: "Develop CHW pipeline program design for health access expansion", owner: "Dr. Flood + AI", status: "pending" as const, dueDate: "TBD" },
          { id: "txhr-b3", task: "Secure letters of interest from collaborative partners", owner: "Dr. Flood", status: "pending" as const, dueDate: "TBD" },
        ],
      },
      {
        id: "review" as PhaseId, name: "3. RFP Response (When Released)", description: "Adapt framework to specific RFP requirements and submit", status: "upcoming" as const,
        tasks: [
          { id: "txhr-r1", task: "Analyze RFP requirements and adapt narrative framework", owner: "Dr. Flood + AI", status: "pending" as const, dueDate: "TBD" },
          { id: "txhr-r2", task: "RPLICE quality review of final application", owner: "RPLICE System", status: "pending" as const, dueDate: "TBD" },
        ],
      },
      {
        id: "submit" as PhaseId, name: "4. Submit Application", description: "Submit when 2027-2028 cycle opens", status: "upcoming" as const,
        tasks: [
          { id: "txhr-s1", task: "Submit application through THR portal", owner: "Dr. Flood", status: "pending" as const, dueDate: "TBD" },
        ],
      },
      {
        id: "pre-execute" as PhaseId, name: "5. Pre-Execution Readiness", description: "Prepare for collaborative program launch if awarded", status: "upcoming" as const,
        tasks: [
          { id: "txhr-p1", task: "Configure health equity tracking dashboards", owner: "AI", status: "pending" as const, dueDate: "TBD" },
          { id: "txhr-p2", task: "Formalize collaborative partner agreements", owner: "Dr. Flood", status: "pending" as const, dueDate: "TBD" },
          { id: "txhr-p3", task: "Deploy CHW training cohort if program includes CHW pipeline", owner: "Dr. Flood", status: "pending" as const, dueDate: "TBD" },
        ],
      },
    ],
    preExecutionChecklist: [
      { id: "txhr-pe1", category: "Notification", item: "Email notification list signup", status: "action-needed" as const, notes: "Sign up at texashealth.org", guidance: "Critical first step — ensures you know when the 2027-2028 RFP drops.", resources: [{ label: "THR Grant Opportunities", url: "https://www.texashealth.org/community-health/community-impact/Grant-Opportunities" }] },
      { id: "txhr-pe2", category: "Compliance", item: "501(c)(3) status confirmed", status: "verified" as const, notes: "EIN 41-3618003", guidance: "TCAF's 501(c)(3) status is current." },
      { id: "txhr-pe3", category: "Partnerships", item: "Health system collaborative partners identified", status: "action-needed" as const, notes: "Need FQHC, hospital, or LMHA partner", guidance: "Texas Health wants collaborative applications. Identify and approach partners NOW, before the RFP drops." },
      { id: "txhr-pe4", category: "Data", item: "Health disparity data compiled for Central Texas", status: "pending" as const, notes: "", guidance: "Census tract health data for Travis County — the foundation expects data-driven applications." },
      { id: "txhr-pe5", category: "Technology", item: "Health platform demos ready", status: "verified" as const, notes: "Sankofa, PillScheduler, WholeMind, AutoImmune Thrive all operational", guidance: "All health platforms are live and can be demoed to Texas Health reviewers if needed." },
    ],
    winStrategy: {
      differentiators: [
        "7 health-focused platforms already operational — not building from scratch",
        "CHW workforce pipeline trains the workforce that expands health access",
        "Census tract health disparity data provides precision that most applicants lack",
        "Implementation science framework ensures measurable, replicable outcomes",
        "Technology infrastructure means grant funds go to direct services, not system-building",
      ],
      reviewerPriorities: [
        "Collaborative approach with multiple organizations working together",
        "Data-driven program design with measurable health equity outcomes",
        "Sustainability beyond the grant period — how does this continue?",
        "Community voice and culturally responsive approaches",
        "Focus on social determinants of health, not just clinical care",
      ],
      scoringTips: [
        "Partner with an established FQHC or hospital system — collaborative applications win",
        "Show Census tract maps with health disparity data overlaid — visual evidence is powerful",
        "Emphasize the CHW pipeline as a sustainable workforce solution, not a temporary program",
        "Connect each health platform to a specific SDoH domain Texas Health cares about",
        "Reference their 2025-2026 awardees and show how your work extends or complements their portfolio",
      ],
      commonPitfalls: [
        "Applying solo instead of as a collaborative — Texas Health explicitly wants partnerships",
        "Being too technology-focused — lead with health outcomes, not platform features",
        "Not demonstrating community engagement and input in program design",
        "Missing the RFP release because you weren't on the notification list",
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
  "ssg-fox": [
    { category: "Veteran Partnerships", items: [
      "Contact Central Texas Veterans Health Care System (Temple VA) for partnership",
      "Secure letters of support from 2+ VSOs (VFW, American Legion, DAV, or American GI Forum)",
      "Establish referral protocol with Austin VA Outpatient Clinic (CBOC)",
      "Contact Team Red White & Blue (Austin HQ) for peer support partnership",
      "Initiate relationship with Fort Cavazos Transition Assistance Program",
    ]},
    { category: "Crisis Protocol", items: [
      "Develop 988 Veterans Crisis Line coordination protocol",
      "Create lethal means safety counseling procedures",
      "Design warm handoff workflow for imminent risk situations",
      "Train staff on Columbia Suicide Severity Rating Scale (C-SSRS)",
      "Establish follow-up protocol for post-crisis veteran engagement",
    ]},
    { category: "Platform Configuration", items: [
      "Configure Sankofa Health for veteran-specific PHQ-9/GAD-7 screening",
      "Set up Mission Transition for veteran peer support matching",
      "Configure RPLICE for SSG Fox implementation fidelity tracking",
      "Build outcome dashboard: veterans screened, connected to care, wellbeing scores",
      "Integrate LifeBridge for VA healthcare enrollment navigation",
    ]},
    { category: "Application Preparation", items: [
      "Download and analyze full SSG Fox NOFO from Grants.gov",
      "Map RPLICE + Mission Transition + Sankofa Health to funded service categories",
      "Research Central Texas veteran suicide data for Statement of Need",
      "Draft intervention model: screening → peer support → care connection continuum",
      "Build budget in $500K–$750K range with peer specialist line items",
    ]},
    { category: "Submission Final Checks", items: [
      "All narrative sections reviewed and approved by Dr. Flood",
      "Partnership letters collected from VA, VSOs, and crisis services",
      "Crisis response protocol with 988 coordination documented",
      "SF-424 and all required federal forms completed",
      "Package ready for upload on June 12 (first day of window — do NOT wait)",
    ]},
  ],
};

const DEFAULT_REMINDERS: Array<{ grantId: string; title: string; dueDate: string; priority: string; category: string }> = [
  { grantId: "st-davids", title: "St. David's Application Opens", dueDate: "2026-03-30", priority: "high", category: "deadline" },
  { grantId: "st-davids", title: "Confirm Central Texas geographic eligibility", dueDate: "2026-03-22", priority: "critical", category: "task" },
  { grantId: "st-davids", title: "Draft LOI for Meredith review", dueDate: "2026-04-05", priority: "medium", category: "review" },
  { grantId: "wioa", title: "WIOA eligible youth criteria finalized", dueDate: "2026-04-15", priority: "medium", category: "task" },
  { grantId: "foundation-basketball", title: "Economic empowerment impact metrics defined", dueDate: "2026-05-01", priority: "medium", category: "task" },
  { grantId: "ssg-fox", title: "SSG Fox Submission Window Opens (June 12)", dueDate: "2026-06-12", priority: "critical", category: "deadline" },
  { grantId: "ssg-fox", title: "SSG Fox Submission Window Closes (June 18)", dueDate: "2026-06-18", priority: "critical", category: "deadline" },
  { grantId: "ssg-fox", title: "Download and analyze full SSG Fox NOFO", dueDate: "2026-03-25", priority: "high", category: "task" },
  { grantId: "ssg-fox", title: "Contact Central Texas VA Health Care System for partnership", dueDate: "2026-04-10", priority: "critical", category: "task" },
  { grantId: "ssg-fox", title: "Secure VSO letters of support (VFW, American Legion, DAV)", dueDate: "2026-04-15", priority: "high", category: "task" },
  { grantId: "ssg-fox", title: "Develop 988 Veterans Crisis Line coordination protocol", dueDate: "2026-04-20", priority: "critical", category: "task" },
  { grantId: "ssg-fox", title: "Map RPLICE + Mission Transition + Sankofa to SSG Fox requirements", dueDate: "2026-03-28", priority: "high", category: "task" },
  { grantId: "ssg-fox", title: "Draft Program Narrative and Intervention Model", dueDate: "2026-05-05", priority: "high", category: "task" },
  { grantId: "ssg-fox", title: "Budget finalized ($500K–$750K range)", dueDate: "2026-05-10", priority: "high", category: "task" },
  { grantId: "ssg-fox", title: "All partnership letters signed and collected", dueDate: "2026-05-28", priority: "high", category: "task" },
  { grantId: "ssg-fox", title: "Final compliance check against NOFO", dueDate: "2026-06-01", priority: "high", category: "review" },
  { grantId: "ssg-fox", title: "Package assembled and ready for Grants.gov upload", dueDate: "2026-06-08", priority: "critical", category: "task" },
];

function GrantRemindersChecklist({ grants }: { grants: typeof GRANT_PACKAGES }) {
  const { toast } = useToast();
  const [selectedGrant, setSelectedGrant] = useState<string>("all");
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminder, setNewReminder] = useState({ title: "", dueDate: "", priority: "medium", category: "task", grantId: "wioa" });
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
    setNewReminder({ title: "", dueDate: "", priority: "medium", category: "task", grantId: "wioa" });
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
      <SectionTutorial {...SECTION_TUTORIALS["grant-packages"]} />
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
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Analysis failed — try again or paste text instead.", variant: "destructive" });
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
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to generate draft. Please try again.", variant: "destructive" });
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
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to refine. Please try again.", variant: "destructive" });
    },
  });

  const copyToClipboard = () => {
    try {
      navigator.clipboard.writeText(draftContent);
      toast({ title: "Copied to clipboard" });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (autoTrigger && !hasAutoTriggered && !draftMutation.isPending && !draftContent) {
      setHasAutoTriggered(true);
      const timer = setTimeout(() => {
        draftMutation.mutate();
        if (onAutoTriggered) onAutoTriggered();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoTrigger, hasAutoTriggered, draftMutation.isPending, draftContent]);

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

export default function GrantPackagesPageGated() {
  return (
    <RequireAuth reason="Grant Packages contain draft cover letters, vendor qualifications, and funder-specific narratives. They are internal to TCAF/ALC and not part of the public site.">
      <GrantPackagesPage />
    </RequireAuth>
  );
}

function GrantPackagesPage() {
  const [selectedGrant, setSelectedGrant] = useState<string>("wioa");
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

      {currentGrant.essentials && currentGrant.essentials.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="font-bold text-sm" data-testid="text-essentials-title">Know Before You Apply — {currentGrant.name}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {currentGrant.essentials.map((essential, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 p-2.5 rounded-lg text-sm ${
                    essential.critical
                      ? "bg-red-100/70 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                      : "bg-white/60 dark:bg-gray-900/40 border border-border/50"
                  }`}
                  data-testid={`essential-item-${idx}`}
                >
                  {essential.critical ? (
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className={`font-semibold text-xs ${essential.critical ? "text-red-700 dark:text-red-400" : "text-foreground"}`}>
                      {essential.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{essential.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                                                  try { navigator.clipboard.writeText(pipelineAiResult.content); toast({ title: "Copied to clipboard" }); } catch { toast({ title: "Failed to copy", variant: "destructive" }); }
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
                                      try { navigator.clipboard.writeText(aiResult.content); toast({ title: "Copied to clipboard" }); } catch { toast({ title: "Failed to copy", variant: "destructive" }); }
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
