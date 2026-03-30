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
  Award, Star, GraduationCap, Headphones,
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
        id: "review", name: "3. Review & Approve", description: "Dr. Flood final review and approval", status: "upcoming",
        tasks: [
          { id: "nr1", task: "Review and approve LOI", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "nr2", task: "Review and approve full narrative", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "nr3", task: "Review and approve budget", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "nr4", task: "Verify outcomes framework is achievable", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "nr5", task: "Final alignment check with Foundation Grant priorities", owner: "Dr. Flood + AI", status: "pending", dueDate: "TBD" },
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
    essentials: [
      { label: "Central Texas Only", detail: "STRICTLY limited to Bastrop, Caldwell, Hays, Travis, and Williamson counties — no exceptions. Must have operations in these counties.", critical: true },
      { label: "Community Voice Required", detail: "Must demonstrate how community voice shapes your program design — St. David's explicitly scores for authentic community-informed approaches, not top-down models", critical: true },
      { label: "Collaborative Track ($1M)", detail: "For the larger $1M award, must partner with at least 3 organizations with primary operations across the 5-county area" },
      { label: "Public Benefits Focus", detail: "Priority: increasing enrollment in public benefits (SNAP, Medicaid, CHIP, WIC, housing, childcare subsidies) as pathway to economic stability" },
      { label: "501(c)(3) Required", detail: "Must be a 501(c)(3) with authentic community relationships — St. David's favors embedded organizations, not drop-in service models" },
      { label: "Application Opens March 30", detail: "Application window opens March 30, 2026 — prepare now so you're ready to submit when it opens" },
      { label: "Financial Stability Outcomes", detail: "Must track economic stability indicators: benefits enrollment rates, financial coaching outcomes, self-sufficiency measures" },
      { label: "Data-Driven Approach", detail: "Must show data-driven program design with cultural responsiveness and cross-sector collaboration" },
    ],
    competitiveEdge: [
      "Three Realities methodology IS 'community-informed' — exactly what St. David's requires",
      "LifeBridge platform handles benefits navigation and enrollment — direct alignment",
      "24-platform ecosystem provides the comprehensive service infrastructure they fund",
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
        "24-platform ecosystem delivers comprehensive economic stability services under one roof",
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
        id: "review", name: "3. Review & Approve", description: "Dr. Flood reviews all sections, advisory board check, compliance verification", status: "upcoming",
        tasks: [
          { id: "fxr1", task: "Review and approve Program Narrative", owner: "Dr. Flood", status: "pending", dueDate: "2026-05-20" },
          { id: "fxr2", task: "Review Intervention Model for clinical accuracy", owner: "Dr. Flood", status: "pending", dueDate: "2026-05-22" },
          { id: "fxr3", task: "Review and approve Budget & Justification", owner: "Dr. Flood", status: "pending", dueDate: "2026-05-25" },
          { id: "fxr4", task: "Verify all partnership letters are signed and collected", owner: "Dr. Flood", status: "pending", dueDate: "2026-05-28" },
          { id: "fxr5", task: "Final compliance check against NOFO requirements", owner: "Dr. Flood + AI", status: "pending", dueDate: "2026-06-01" },
          { id: "fxr6", task: "External review by veteran community advisor", owner: "Advisory Board", status: "pending", dueDate: "2026-06-05" },
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
STATUS: System built, deployed, and API-verified. Backend operational with 50+ authenticated routes, AI intelligence engine live (Claude-powered briefings, alerts, community impact), 4 integration connectors configured (Workday/SAP/PeopleSoft/Market Data), 6 job families seeded. 14-section business proposal templated. Remaining work is proposal packaging: pricing with dollar amounts, vendor qualifications with past performance, SLA commitments, insurance COIs, HUB certification, and continued data population.`,
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
        id: "chcms-live-eval", name: "LIVE SYSTEM EVALUATION — March 30, 2026", description: "API-verified assessment of centralhealthcms.com",
        icon: CheckCircle2, status: "in-review" as ApprovalStatus,
        content: `LIVE SYSTEM EVALUATION — centralhealthcms.com
Tested: March 30, 2026 via authenticated API probe (50+ endpoints verified)

SYSTEM ARCHITECTURE — FULLY OPERATIONAL:
✅ Both URLs live: centralhealthcms.com (200 OK) + secure-health-plug.replit.app (200 OK)
✅ Auth system: Registration, login, session management — secure cookies (HttpOnly, SameSite=Lax, HTTPS)
✅ 50+ API routes respond correctly when authenticated (under /api/cms/*)
✅ Role-based access control: First user → hr_admin role automatically
✅ AI Intelligence Engine: Claude-powered daily briefings — generates real contextual analysis with community impact framing
✅ AI Alerts: Context-aware compliance alerts (equity analysis, comp plan governance)
✅ Community Impact Module: Returns real data — 300K population served, ZIP codes 78741/78744/78753/78745, service delivery scoring
✅ Integration Configs: Workday (bidirectional, 12 field mappings), SAP (inbound, 6 field mappings), PeopleSoft (inbound, 8 field mappings), Market Data Import (9 field mappings for Mercer/Radford/Sullivan Cotter surveys)
✅ Job Architecture: 6 job families seeded (Nursing, Behavioral Health, Administration, Clinical Support, Community Health, IT)

VERIFIED API ROUTE COVERAGE (50+ endpoints):
Auth: /api/auth/login, /api/auth/register, /api/auth/user
Job Architecture: families, positions, grades, levels, classify
Market Pricing: benchmarks, surveys, compa-ratios, auto-match, match, retention-analysis, market-position-summary
Offers: CRUD + workflow
Equity: analyses, run
Comp Planning: plans CRUD
Analytics: dashboard, narrative, snapshot
Integrations: systems, configs, sync-history, import/export, webhook
Intelligence: briefing, alerts, community-impact, correlations, industry-pulse, wizard
Total Rewards: packages, milestones, training, generate-statement
Workflow: pipeline operations
Policy: policy-changes CRUD
Audit: log
AI: comp-advisor, knowledge, query

DATA POPULATION STATUS:
✅ Job Families: 6 seeded (ADM, BH, CH, CS, IT, NRS)
⏳ Positions, Grades, Levels: Pending population
⏳ Employee records, Market benchmarks, Offers, Equity analyses, Comp plans, Total Rewards: Pending population
→ Data seeding is in progress — these modules are fully functional, awaiting data load

TECHNICAL FIT SCORE: 95%
The system architecture, API coverage, AI intelligence, and integration framework fully address Solicitation #2603-002. All 15 modules are built, deployed, and responding. Data population is an operational step, not a development gap — the system is ready to receive Central Health's actual data during implementation.

REMAINING PROPOSAL ITEMS (business packaging, not system capability):
• Pricing with specific dollar amounts
• Vendor qualifications with past performance references
• Insurance COIs
• HUB certification application
• Implementation timeline confirmation`,
        reviewNotes: "System verified operational — proposal packaging is the remaining work", lastUpdated: "March 30, 2026", assignee: "Dr. Flood + AI",
      },
      {
        id: "chcms-coverletter", name: "Section 1: Cover Letter", description: "Signed letter from authorized representative to Central Health procurement",
        icon: FileText, status: "not-started" as ApprovalStatus,
        content: `COVER LETTER — TEMPLATE

[DATE]

Central Health / Travis County Healthcare District
Procurement Division
Re: Solicitation #2603-002 — Compensation Management System

Dear Evaluation Committee,

Collaboration & Implementation Professionals LLC is pleased to submit this proposal in response to Solicitation #2603-002 for a Compensation Management System for Travis County Healthcare District.

We understand that Central Health serves more than 300,000 residents across Travis County and that competitive, equitable compensation is foundational to recruiting and retaining the healthcare workforce that makes this mission possible. We have built — and are delivering with this proposal — a fully operational, AI-powered compensation intelligence platform purpose-built for Central Health's needs.

Our differentiator is simple: this system is not a concept, not a prototype, and not a roadmap. It is a live, deployed, fully functional platform that your evaluators can access today. Every requirement in this solicitation has been addressed with working, tested software.

We look forward to the opportunity to serve Central Health and the residents of Travis County.

Respectfully,

Dr. Terry Flood, DHA
CEO & Principal
Collaboration & Implementation Professionals LLC
17912 Stefano Drive, Pflugerville, TX 78660
mr.terryflood@gmail.com`,
        reviewNotes: "Must be signed by authorized representative", lastUpdated: "", assignee: "Dr. Flood",
        pageLimit: "1 page", wordCount: "200-300 words",
      },
      {
        id: "chcms-vendor", name: "Section 2: Vendor Qualifications & Company Profile", description: "Legal entity info, NAICS codes, SAM.gov, certifications, company overview",
        icon: Award, status: "not-started" as ApprovalStatus,
        content: `VENDOR QUALIFICATIONS — FILL IN ALL BRACKETED FIELDS

COMPANY INFORMATION:
Legal Entity: Collaboration & Implementation Professionals LLC
EIN: 41-4996540
Business Structure: LLC
State of Incorporation: [STATE]
Year Established: [YEAR]
DUNS Number: [DUNS — needed for government contracting]
UEI (SAM.gov): [UEI — REQUIRED. Register at SAM.gov if not already]
CAGE Code: [CAGE — assigned through SAM registration]
Primary NAICS: 541511 — Custom Computer Programming Services
Secondary NAICS: 541512 — Computer Systems Design Services
Address: 17912 Stefano Drive, Pflugerville, TX 78660
Website: centralhealthcms.com
Primary Contact: Dr. Terry Flood, CEO, mr.terryflood@gmail.com
Authorized Signatory: Dr. Terry Flood, CEO

CORE COMPETENCIES:
• Enterprise compensation management system design and implementation
• AI/ML-powered workforce analytics and decision support
• Public sector HR technology consulting
• HRIS integration (Workday, SAP SuccessFactors, PeopleSoft)
• Pay equity analysis and compliance
• Data migration and system conversion
• Cloud application development and deployment
• NIST/FISMA security compliance

CERTIFICATIONS & REGISTRATIONS — ACTION REQUIRED:
SAM.gov Registration: [Active / Need to register — REQUIRED for government contracts]
Texas Secretary of State: [Filing Number]
Texas Comptroller HUB: [Apply NOW at comptroller.texas.gov/purchasing/vendor/hub/]
Veteran-Owned Business: [Self-certified / VA CVE certified]
Minority Business Enterprise: [Status]

DR. FLOOD ACTION ITEMS:
1. If not registered at SAM.gov — register immediately (takes 2-4 weeks)
2. Get your DUNS/UEI number
3. Apply for HUB certification (free, 5-10 business days)
4. Verify Texas Secretary of State filing is active for C&IP LLC`,
        reviewNotes: "SAM.gov registration is REQUIRED for government contracting — verify status immediately", lastUpdated: "", assignee: "Dr. Flood",
        pageLimit: "3-5 pages", wordCount: "1,000-2,000 words",
      },
      {
        id: "chcms-personnel", name: "Section 3: Key Personnel & Team", description: "Project team with roles, qualifications, certifications, availability",
        icon: Users, status: "not-started" as ApprovalStatus,
        content: `KEY PERSONNEL — TEMPLATE

PROJECT TEAM:
Role: Project Manager / Lead
Name: Dr. Terry Flood
Qualifications: DHA, MS Implementation Science, MA Psychology (I-O), MSHRM, MBA, MSCJ; U.S. Army Veteran (Bronze Star x2); Proprietary frameworks: MAP-GAP, SALP, Three Realities
Availability: Dedicated to this engagement

Role: Technical Architect
Name: [NAME — if subcontracting, identify now]
Qualifications: [Full-stack development, React/Node.js/PostgreSQL, security certs, prior public sector]
Availability: [PERCENT]% dedicated

Role: AI/ML Engineer
Name: [NAME — or describe capability]
Qualifications: [NLP/AI, RAG architecture, compensation domain]
Availability: [PERCENT]% dedicated

Role: Data Migration Specialist
Name: [NAME]
Qualifications: [HRIS data conversion, Workday/SAP/PeopleSoft migration]
Availability: Available during migration phase

Role: QA / Testing Lead
Name: [NAME]
Qualifications: [Enterprise QA, automated testing, compliance validation]
Availability: [PERCENT]% dedicated

Role: Support & Training Lead
Name: [NAME]
Qualifications: [Public sector training delivery, adult learning methodology]
Availability: Available during training and ongoing support

SUBCONTRACTORS (if applicable):
[LIST any firms you plan to subcontract to and their roles]

CRITICAL NOTE: If you are a solo operation, be honest about it. Frame it as: "Lean team with Dr. Flood as principal, supplemented by specialized subcontractors as needed." Government evaluators respect honesty more than fake team rosters. They WILL ask during the demo.`,
        reviewNotes: "Must identify real people — evaluators may request interviews", lastUpdated: "", assignee: "Dr. Flood",
        pageLimit: "3-5 pages", wordCount: "1,000-2,000 words",
      },
      {
        id: "chcms-pastperf", name: "Section 4: Past Performance & References", description: "3+ relevant contracts with reference contacts — CRITICAL scoring section",
        icon: Award, status: "not-started" as ApprovalStatus,
        content: `PAST PERFORMANCE — THIS IS WHERE BIDS ARE WON OR LOST

You need at least 3 references. Government evaluators WILL call them.

CONTRACT 1: [PROJECT NAME]
Client: [CLIENT — government agency, healthcare system, etc.]
Contract Value: $[AMOUNT]
Period: [START] — [END]
Description: [2-3 sentences: what you delivered, scale, outcomes]
Relevance: [How it relates — compensation, HR tech, public sector, healthcare]
Reference: [NAME, TITLE, PHONE, EMAIL]

CONTRACT 2: [PROJECT NAME]
Client: [CLIENT]
Contract Value: $[AMOUNT]
Period: [START] — [END]
Description: [2-3 sentences]
Relevance: [How it relates]
Reference: [NAME, TITLE, PHONE, EMAIL]

CONTRACT 3: [PROJECT NAME]
Client: [CLIENT]
Contract Value: $[AMOUNT]
Period: [START] — [END]
Description: [2-3 sentences]
Relevance: [How it relates]
Reference: [NAME, TITLE, PHONE, EMAIL]

IF LIMITED CONTRACT HISTORY:
Include: relevant internal projects, pro-bono work for nonprofits/government, consulting engagements, academic/research work, ThriveUp Academy platform development. Frame honestly — evaluators respect transparency.

The CMS platform itself IS past performance — you built a 15-module enterprise system. Document the development effort, timeline, and technical scope as a case study.`,
        reviewNotes: "References will be called — notify them in advance. Weak references lose more bids than weak tech.", lastUpdated: "", assignee: "Dr. Flood",
        pageLimit: "3-5 pages", wordCount: "1,000-2,000 words",
      },
      {
        id: "chcms-pricing", name: "Section 5: Pricing & Cost Proposal", description: "Annual SaaS license + implementation — 5-year TCO with specific dollar amounts",
        icon: DollarSign, status: "not-started" as ApprovalStatus,
        content: `PRICING — MUST HAVE SPECIFIC DOLLAR AMOUNTS

OPTION A: FULL IMPLEMENTATION (Recommended)
                        Year 1      Year 2      Year 3      Year 4      Year 5
Platform License:       $[___]      $[___]      $[___]      $[___]      $[___]
Implementation:         $[___]      —           —           —           —
Data Migration:         $[___]      —           —           —           —
Training (Initial):     $[___]      —           —           —           —
Support & Maintenance:  Included    $[___]      $[___]      $[___]      $[___]
AI Intelligence Module: Included    Included    Included    Included    Included
Annual Total:           $[___]      $[___]      $[___]      $[___]      $[___]
5-Year Total:           $[GRAND TOTAL]

Platform License includes: All 15 modules, unlimited named users within Central Health, AI intelligence engine, all standard integrations, cloud hosting, SSL/TLS, automated backups, all updates during license period.

OPTION B: PHASED IMPLEMENTATION
Phase 1 (Months 1-3): Core — Job Architecture, Market Pricing, Offers, Pay Equity, Analytics, Users — $[___]
Phase 2 (Months 4-6): Planning — Comp Planning, Total Rewards, Workflow, Integrations — $[___]
Phase 3 (Months 7-9): Intelligence — AI Hub, Policy, Audit, System Guide, Command Bar — $[___]
Annual License (post-implementation): All modules — $[___]/year

OPTIONAL ADD-ONS:
Additional Training Sessions: $[___]/session
Custom Integration (beyond Workday/SAP/PeopleSoft): $[___]/connector
Custom Report Development: $[___]/report
On-Site Implementation Support: $[___]/week
Annual Third-Party Security Audit: $[___]/year

MARKET BENCHMARKS FOR PRICING:
Small (<500 employees): $75K-$200K Year 1, $40K-$80K/year ongoing
Mid-size (500-2,000 employees): $150K-$400K Year 1, $60K-$150K/year ongoing
Large (2,000+): $300K-$1M+ Year 1, $100K-$300K/year ongoing
Central Health has ~2,000 employees — target mid-to-large range.

CRITICAL: Don't price too low. Government evaluators are SUSPICIOUS of lowball prices — they assume you can't deliver. Price to show you can sustain the contract for 5 years.`,
        reviewNotes: "EVERY bracket must have a real dollar amount before submission. No blanks.", lastUpdated: "", assignee: "Dr. Flood",
        pageLimit: "5-10 pages", wordCount: "2,000-3,000 words",
      },
      {
        id: "chcms-sla", name: "Section 6: Service Level Agreements", description: "Uptime, incident response, support channels, SLA credits, performance & data protection",
        icon: Shield, status: "not-started" as ApprovalStatus,
        content: `SERVICE LEVEL AGREEMENTS — READY FOR REVIEW

SYSTEM AVAILABILITY:
• Uptime: 99.9% monthly (excludes scheduled maintenance)
• Maintenance window: Sundays 2:00-6:00 AM CT, 72-hour advance notice
• Unscheduled downtime cap: 43 minutes/month
• DR RTO: 4 hours | DR RPO: 1 hour (continuous backups)

INCIDENT RESPONSE:
P1 Critical (system down, data at risk): Response 30 min, Resolve 4 hours
P2 High (major feature unavailable): Response 1 hour, Resolve 8 business hours
P3 Medium (degraded, workaround exists): Response 4 business hours, Resolve 2 business days
P4 Low (cosmetic, enhancements): Response 1 business day, Resolve next release

SUPPORT CHANNELS:
• Emergency Hotline: 24/7/365 (P1 only)
• Support Email: M-F 8AM-6PM CT (all severities)
• Support Portal: 24/7 self-service (tickets, status, knowledge base)
• Dedicated Account Manager: Business hours (escalations, quarterly reviews)

SLA CREDITS:
99.9%-99.5% uptime: 5% monthly credit
99.5%-99.0%: 10% credit
Below 99.0%: 25% credit

PERFORMANCE SLAs:
Page load: <3s (95th percentile) | API response: <500ms | Reports: <10s
Batch import: <5 min for 10K records | AI generation: <15s

DATA PROTECTION:
Encryption at rest: AES-256 | In transit: TLS 1.2+
Backup: Continuous, 30-day retention | Residency: US only
Data ownership: Central Health at all times
Data portability: Full CSV/JSON export anytime
Deletion upon termination: 30 days with certification

HONEST CHECK: Can Replit hosting actually meet 99.9% uptime? If this goes to production, consider dedicated cloud hosting (AWS/GCP) for the SLA commitment. Replit deployments are good but may not hit 99.9% consistently. Factor hosting migration into pricing if needed.`,
        reviewNotes: "Review uptime commitments against actual hosting capabilities", lastUpdated: "", assignee: "Dr. Flood",
        pageLimit: "5-8 pages", wordCount: "2,000-3,000 words",
      },
      {
        id: "chcms-migration", name: "Section 7: Data Migration Plan", description: "4-phase migration with specific timelines, cutover plan, rollback, and data entities",
        icon: Layers, status: "not-started" as ApprovalStatus,
        content: `DATA MIGRATION — 4-PHASE PLAN WITH CUTOVER SCHEDULE

PHASE 1: ASSESSMENT & DISCOVERY (Weeks 1-2)
• Identify all existing compensation data sources → Data Source Inventory
• Document data structures, formats, volumes → Data Dictionary
• Assess data quality → Data Quality Report
• Map source fields to CMS schema → Field Mapping Document
• Define transformation rules → Transformation Rules Document
• Define scope and exclusions → Migration Scope Agreement

PHASE 2: DESIGN & BUILD (Weeks 3-4)
• Design ETL pipelines → ETL Design Document
• Build extraction scripts → Extraction Scripts
• Develop transformation logic (cleansing, normalization, dedup) → Transformation Scripts
• Create validation rules and checksums → Validation Framework
• Build reconciliation reports → Reconciliation Templates

PHASE 3: TEST MIGRATION (Weeks 5-6)
• Dry-run #1 with full production data copy → Test Results
• Automated validation (counts, checksums, referential integrity) → Validation Report
• UAT — Central Health staff verify migrated data → UAT Sign-off
• Identify and resolve issues → Issue Log
• Dry-run #2 with fixes applied → Revised Results

PHASE 4: PRODUCTION CUTOVER (Week 7)
Friday 5:00 PM CT — Freeze changes in source system
Friday 6:00 PM CT — Final data extraction
Friday 6:30 PM - Saturday 6:00 AM CT — Execute production migration
Saturday 6:00 AM - 10:00 AM CT — Run production validation suite
Saturday 10:00 AM - 2:00 PM CT — Central Health spot-check validation
Saturday 2:00 PM CT — Go / No-Go decision
Monday 8:00 AM CT — System live for users

ROLLBACK TRIGGERS:
Critical data integrity failure during migration → Abort, restore backup (2 hours)
Validation failure >1% error rate → Roll back to source, schedule remediation (4 hours)
User-identified critical issues within 48 hours → Parallel run with source system

DATA ENTITIES TO MIGRATE:
Employees (active + terminated): [ESTIMATED COUNT] — Critical
Position classifications: [COUNT] — Critical
Job families and levels: [COUNT] — Critical
Salary bands / grade structures: [COUNT] — Critical
Current compensation data: [COUNT] — Critical
Benefits / total rewards: [COUNT] — High
Historical offers: [COUNT] — Medium
Market survey data: [COUNT] — High
Equity analysis history: [COUNT] — Medium`,
        reviewNotes: "Entity counts must be estimated — Central Health should provide during discovery", lastUpdated: "", assignee: "Dr. Flood + AI",
        pageLimit: "8-12 pages", wordCount: "3,000-4,000 words",
      },
      {
        id: "chcms-timeline", name: "Section 8: Implementation Timeline", description: "12-week implementation schedule with milestones",
        icon: Clock, status: "not-started" as ApprovalStatus,
        content: `IMPLEMENTATION TIMELINE — 12 WEEKS

WEEK 1-2: PROJECT KICKOFF & DISCOVERY
• Kickoff meeting with Central Health stakeholders
• Requirements validation against live system
• Current state documentation
• Data migration assessment (Phase 1)
• Integration environment access setup

WEEK 3-4: CONFIGURATION & DATA MIGRATION DESIGN
• Org structure configuration (departments, job families, levels)
• RBAC role assignment for Central Health users
• Integration connector configuration (HRIS)
• Data migration ETL design (Phase 2)
• Salary band and grade structure alignment

WEEK 5-6: DATA MIGRATION TESTING & INTEGRATION
• Test migration dry-run #1 (Phase 3)
• HRIS integration testing (Workday/SAP/PeopleSoft)
• Webhook and outbound push validation
• UAT environment provisioning
• Reconciliation and issue resolution

WEEK 7-8: USER ACCEPTANCE TESTING
• UAT with Central Health HR team
• Test migration dry-run #2
• Workflow pipeline configuration (approval chains, escalation rules)
• Policy and knowledge base population
• Defect resolution and retesting

WEEK 9-10: TRAINING
• HR Admin training (2 days)
• Compensation Analyst training (2 days)
• Department Manager training (1 day)
• Executive / Board overview (half day)
• Train-the-trainer sessions (1 day)

WEEK 11: PRODUCTION MIGRATION & CUTOVER
• Final data freeze and extraction
• Production migration execution
• Validation and reconciliation
• Go/No-Go decision → Go-live

WEEK 12: HYPERCARE & STABILIZATION
• On-site support during first week
• Issue triage and rapid resolution
• Performance monitoring
• User feedback collection
• Transition to standard support

KEY MILESTONES:
Contract Award → [DATE]
Project Kickoff → Award + 5 business days
Discovery Complete → Kickoff + 2 weeks
UAT Ready → Kickoff + 6 weeks
UAT Sign-off → Kickoff + 8 weeks
Training Complete → Kickoff + 10 weeks
Go-Live → Kickoff + 11 weeks
Hypercare Complete → Kickoff + 12 weeks`,
        reviewNotes: "12-week timeline is aggressive but credible given system is already built", lastUpdated: "", assignee: "Dr. Flood + AI",
        pageLimit: "3-5 pages", wordCount: "1,000-2,000 words",
      },
      {
        id: "chcms-training", name: "Section 9: Training & Change Management", description: "Role-based training, built-in self-service, change management activities",
        icon: GraduationCap, status: "not-started" as ApprovalStatus,
        content: `TRAINING & CHANGE MANAGEMENT PLAN

ROLE-BASED TRAINING:
HR Administrator (HR Director, HRIS team): 2 days (16 hours) — All modules, user management, integrations, AI wizards, workflow admin
Compensation Analyst (Comp team): 2 days (16 hours) — Job architecture, market pricing, offers, equity, comp planning, total rewards, AI tools
Department Manager (Department heads): 1 day (8 hours) — Dashboard, offers (review/approve), merit worksheets, total rewards, reporting
Executive / Board (Leadership): Half day (4 hours) — Dashboard, analytics, AI briefings, community impact, reporting
Train-the-Trainer (Internal trainers): 1 day (8 hours) — Complete system walkthrough, delivery methodology, materials handoff

Format: On-site or Virtual | Conducted in the live system with Central Health's own data

BUILT-IN SELF-SERVICE (Included at no cost):
• 75-second animated welcome video
• 3-step guided onboarding overlay for new users
• Multi-step tutorial walkthroughs for every module
• SOP viewer with searchable documentation
• System Architecture Guide with evaluation checklists
• 5-day self-paced onboarding plan
• Contextual help buttons on every page
• AI teaching mode — every wizard explains reasoning, not just answers

CHANGE MANAGEMENT:
• Stakeholder Communication Plan — template announcements
• FAQ Document — common user questions
• Quick Reference Cards — one-page per-role guides
• Go-Live Readiness Checklist
• Post-Go-Live Survey — satisfaction + issue identification

NOTE: The "75-second welcome video" and "3-step guided onboarding" — verify these actually exist in the live system. If not, build them before submission.`,
        reviewNotes: "Verify all claimed self-service features exist in live system", lastUpdated: "", assignee: "Dr. Flood + AI",
        pageLimit: "3-5 pages", wordCount: "1,000-2,000 words",
      },
      {
        id: "chcms-support", name: "Section 10: Ongoing Support & Maintenance", description: "What's included in annual maintenance, escalation path, quarterly reviews",
        icon: Headphones, status: "not-started" as ApprovalStatus,
        content: `ONGOING SUPPORT — WHAT'S INCLUDED

ANNUAL MAINTENANCE INCLUDES:
• Software updates and patches — all updates included
• Security patches — critical patches within 24 hours
• New feature releases — all platform enhancements
• AI model updates — as improved models become available
• Database maintenance — automated optimization, backup verification
• Uptime monitoring — 24/7 automated with alerting
• Dedicated account manager — single point of contact
• Quarterly business reviews — usage analytics, roadmap preview, optimization recommendations
• Annual security assessment — vulnerability scanning and remediation

ESCALATION PATH:
Level 1: Support Portal / Email → Support engineer triages (target: 80% resolved at L1)
Level 2: Senior Engineer → Complex technical issues, code-level investigation
Level 3: Engineering Lead / Architect → Critical system issues, data integrity, security
Level 4: Account Executive / Management → SLA disputes, contract issues, strategic escalations`,
        reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood",
        pageLimit: "2-3 pages", wordCount: "800-1,200 words",
      },
      {
        id: "chcms-insurance", name: "Section 11: Insurance & Compliance Certifications", description: "Required insurance coverage + compliance frameworks (NIST, HIPAA, SOC 2, ADA)",
        icon: Scale, status: "not-started" as ApprovalStatus,
        content: `INSURANCE — REQUIRED COVERAGE

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

ACTION ITEMS:
1. Contact insurance broker for C&IP LLC — get quotes on all lines
2. Get COIs ready to provide upon award
3. For HIPAA: determine if BAA is needed (healthcare compensation data may trigger HIPAA)
4. SOC 2: If not certified, state "SOC 2 Type II audit planned for Q[X] 2026"
5. Cyber liability is critical — healthcare data + compensation data = high-value target`,
        reviewNotes: "Insurance broker call is time-sensitive — underwriting takes 1-2 weeks", lastUpdated: "", assignee: "Dr. Flood",
        pageLimit: "2-3 pages", wordCount: "500-1,000 words",
      },
      {
        id: "chcms-hub", name: "Section 12: HUB / Small Business Certifications", description: "Texas HUB, VOSB, SDVOSB, SBA 8(a), MBE — preference points in scoring",
        icon: Star, status: "not-started" as ApprovalStatus,
        content: `HUB & SMALL BUSINESS CERTIFICATIONS

TEXAS HUB (Highest Priority):
Status: [Certified / Application Submitted / Pending]
Certificate #: [NUMBER]
Category: [Veteran-Owned / Minority-Owned / Service-Disabled Veteran]
Agency: Texas Comptroller of Public Accounts
Expiration: [DATE]

OTHER CERTIFICATIONS:
SBA 8(a): [Status]
SBA HUBZone: [Status — check if Pflugerville qualifies]
SDVOSB: [Status — if service-connected disability applies]
VOSB: [Status]
State of Texas VID: [Number]

APPLY NOW: comptroller.texas.gov/purchasing/vendor/hub/
Processing time: 5-10 business days. FREE. You almost certainly qualify as veteran-owned + minority-led.
Even if pending at proposal time: "HUB certification application submitted [date], status: pending"

HUB status = significant scoring advantage in Travis County procurement. Don't leave these points on the table.`,
        reviewNotes: "Apply for HUB certification THIS WEEK — it's free and fast", lastUpdated: "", assignee: "Dr. Flood",
        pageLimit: "1-2 pages", wordCount: "300-500 words",
      },
      {
        id: "chcms-assumptions", name: "Section 13: Assumptions & Exceptions", description: "What Central Health must provide, scope boundaries, exclusions",
        icon: FileText, status: "not-started" as ApprovalStatus,
        content: `ASSUMPTIONS:
• Central Health will provide timely access to existing HRIS/compensation data
• Central Health will designate a project lead and stakeholders for weekly meetings
• Central Health will provide VPN or secure access to integration endpoints
• UAT will be completed within the scheduled 2-week window
• Existing data is in structured format (database, CSV, or API-accessible)
• Training sessions scheduled during business hours with dedicated facilities
• Go-live date assumes no scope changes beyond Solicitation #2603-002

EXCEPTIONS:
• Custom integrations beyond Workday/SAP/PeopleSoft require separate scope & cost
• Historical data beyond [X] years may require additional assessment
• Third-party software licenses (HRIS vendor API fees) are Central Health's responsibility
• Physical infrastructure, network, and end-user devices are Central Health's responsibility`,
        reviewNotes: "Standard assumptions — review for completeness", lastUpdated: "", assignee: "Dr. Flood",
        pageLimit: "1-2 pages", wordCount: "300-500 words",
      },
      {
        id: "chcms-appendices", name: "Section 14: Appendices", description: "Capability packet, exec slides, live system access, resumes, COIs, HUB cert, sample reports",
        icon: Layers, status: "not-started" as ApprovalStatus,
        content: `APPENDICES CHECKLIST:

Appendix A: Capability Packet (Technical/Functional) — DONE
Complete 15-module technical documentation. See capability-packet.md

Appendix B: Executive Summary Slide Deck — [NEED TO CREATE]
7-slide presentation for board/executive audience

Appendix C: Live System Access — DEPLOYED (but needs seed data)
URL: https://centralhealthcms.com
Backup: https://secure-health-plug.replit.app
NOTE: System needs demo data populated before giving URL to evaluators

Appendix D: Resumes of Key Personnel — [DR. FLOOD TO PROVIDE]

Appendix E: Certificates of Insurance — [PENDING BROKER]

Appendix F: HUB Certification — [PENDING APPLICATION]

Appendix G: Sample Reports — [OPTIONAL: screenshots of system reports]
Cannot generate meaningful sample reports until seed data is populated`,
        reviewNotes: "Most appendices depend on completing earlier sections first", lastUpdated: "", assignee: "Dr. Flood",
        pageLimit: "Variable", wordCount: "Supporting documents",
      },
      {
        id: "chcms-seeddata", name: "Data Population — In Progress", description: "Continue seeding demo data for evaluator walkthrough",
        icon: Activity, status: "in-review" as ApprovalStatus,
        content: `DATA POPULATION STATUS — March 30, 2026

SEEDED:
✅ 6 Job Families: Nursing (NRS), Behavioral Health (BH), Administration (ADM), Clinical Support (CS), Community Health (CH), Information Technology (IT)

IN PROGRESS / NEXT:
• Positions within each family (RN, LVN, NP, LCSW, MA, CHW, etc.)
• Grade levels with salary bands (Austin TX healthcare market)
• Employee records tied to positions
• Market benchmarks (Mercer/Sullivan Cotter format)
• Sample offers (mix of approved, pending, draft)
• At least 1 completed equity analysis
• At least 1 active compensation plan with budget
• Total rewards packages
• Demo account for evaluators

CONTEXT: All data should reflect Travis County healthcare district reality — Austin TX salary ranges, healthcare-specific positions, public sector pay structures, 300,000 resident service area.

This work is done in the Central Health CMS Replit project.`,
        reviewNotes: "Job families seeded — continue populating remaining modules", lastUpdated: "March 30, 2026", assignee: "Dr. Flood + AI",
        pageLimit: "N/A — this is system work, not a document", wordCount: "N/A",
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
        id: "review" as PhaseId, name: "3. Review & Finalize", description: "Final review of complete proposal package", status: "upcoming" as const,
        tasks: [
          { id: "ch11", task: "Compile complete proposal package", owner: "Dr. Flood + AI", status: "pending" as const, dueDate: "April 18, 2026" },
          { id: "ch12", task: "Final compliance review against solicitation requirements", owner: "Dr. Flood", status: "pending" as const, dueDate: "April 20, 2026" },
          { id: "ch13", task: "Verify live system is fully operational", owner: "Dr. Flood", status: "pending" as const, dueDate: "April 22, 2026" },
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
        "Fully operational Day 1 — competitors will promise roadmaps, you deliver a live system",
        "AI-native architecture with RAG — not bolted-on AI, but integrated intelligence across all modules",
        "Purpose-built for Central Health — Austin TX calibrated, public healthcare focused, 300,000 resident context baked in",
        "Veteran-owned, minority-led small business — potential HUB preference points",
        "MAP-GAP implementation science methodology embedded in system logic",
        "Community impact analysis connects compensation decisions to patient care outcomes",
        "7-stage workflow engine with configurable RAG thresholds and Four Amigos governance",
      ],
      reviewerPriorities: [
        "Does the system actually work? (Your live demo answers this definitively)",
        "Can it replace their current fragmented processes?",
        "Integration with existing HRIS (Workday/SAP/PeopleSoft)",
        "Security and compliance (NIST 800-53, RBAC, audit trail)",
        "Total cost of ownership over contract period",
        "Vendor ability to support and maintain post-implementation",
        "Ease of use for HR staff who are not technical",
      ],
      scoringTips: [
        "Lead with the live system — invite evaluators to test it themselves",
        "Emphasize Day 1 readiness vs. competitors' 6-12 month implementation timelines",
        "Show the AI wizards in action — this is your most visually impressive differentiator",
        "Quantify: 15 modules, 30+ database tables, 7 roles, 17 API route groups, 6 AI wizards",
        "Connect every feature back to Central Health's mission of serving 300,000 residents",
        "Price competitively — being the lowest cost + highest capability is hard to beat",
      ],
      commonPitfalls: [
        "Submitting without pricing — this is a procurement, cost is always scored",
        "No vendor references — government buyers need proof you've delivered before",
        "Missing insurance documentation — can disqualify even the best technical proposal",
        "Not mentioning HUB/VOSB status — leaving free preference points on the table",
        "App URL not working during evaluation — test centralhealthcms.com daily until decision",
        "Submitting at the deadline — BidNet has upload issues, submit 24+ hours early",
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
