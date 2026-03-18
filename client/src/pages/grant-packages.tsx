import { useState } from "react";
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
  Loader2, Leaf, Plus, Trash2, Bell, Pencil,
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
}

interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  status: "verified" | "pending" | "action-needed";
  notes: string;
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
    competitiveEdge: [
      "14-platform ecosystem provides unprecedented coalition infrastructure",
      "SALP fidelity tracking exceeds typical reporting capabilities",
      "MAP-GAP methodology aligns directly with ONDCP's continuous improvement requirements",
      "Real-time core measures tracking (not batch reporting)",
      "Three Realities framework ensures community voice is centered, not assumed",
    ],
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
          { id: "c3", task: "Identify coalition gaps (sectors without confirmed partners)", owner: "Dr. Flood", status: "in-progress", dueDate: "2026-03-20" },
          { id: "c4", task: "Collect community-level data (CDC PLACES, SVI, YRBS)", owner: "AI", status: "done", dueDate: "2026-03-14" },
          { id: "c5", task: "Interview 3+ community stakeholders for Three Realities grounding", owner: "Dr. Flood", status: "pending", dueDate: "2026-03-22" },
        ],
      },
      {
        id: "build", name: "2. Build & Draft", description: "Write narrative sections, develop budget, compile docs", status: "active",
        tasks: [
          { id: "b1", task: "Draft Statement of Need with local data", owner: "AI + Dr. Flood Review", status: "in-progress", dueDate: "2026-03-22" },
          { id: "b2", task: "Draft Program Design section", owner: "AI + Dr. Flood Review", status: "pending", dueDate: "2026-03-25" },
          { id: "b3", task: "Build line-item budget", owner: "Dr. Flood", status: "pending", dueDate: "2026-03-27" },
          { id: "b4", task: "Finalize Logic Model with platform data", owner: "AI + Dr. Flood Review", status: "in-progress", dueDate: "2026-03-24" },
          { id: "b5", task: "Draft evaluation methodology", owner: "Better Science Lab + Dr. Flood", status: "pending", dueDate: "2026-03-28" },
          { id: "b6", task: "Compile coalition membership documentation", owner: "Dr. Flood", status: "pending", dueDate: "2026-03-26" },
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
      { id: "pe-1", category: "Registration", item: "SAM.gov registration active and current", status: "verified", notes: "Verify UEI number is valid" },
      { id: "pe-2", category: "Registration", item: "Grants.gov account active", status: "verified", notes: "AOR credentials confirmed" },
      { id: "pe-3", category: "Registration", item: "DUNS number on file", status: "verified", notes: "" },
      { id: "pe-4", category: "Compliance", item: "501(c)(3) determination letter attached", status: "pending", notes: "ThriveUp Academy 501(c)(3)" },
      { id: "pe-5", category: "Compliance", item: "Audit report (if applicable) included", status: "action-needed", notes: "Check if single audit required" },
      { id: "pe-6", category: "Compliance", item: "Indirect cost rate agreement", status: "pending", notes: "Negotiate with cognizant agency or use de minimis 10%" },
      { id: "pe-7", category: "Coalition", item: "All 12 sectors have confirmed representatives", status: "action-needed", notes: "Verify sector coverage completeness" },
      { id: "pe-8", category: "Coalition", item: "MOUs signed with key partners", status: "pending", notes: "Priority: schools, law enforcement, healthcare" },
      { id: "pe-9", category: "Data", item: "Baseline data collection instruments ready", status: "verified", notes: "DFC Reporting module has all 4 core measures" },
      { id: "pe-10", category: "Data", item: "IRB approval or exemption documented", status: "action-needed", notes: "Contact university partner for IRB review" },
      { id: "pe-11", category: "Technology", item: "Platform configured for DFC program tracking", status: "verified", notes: "Coalition Dashboard, Prevention Hub, DFC Reporting all live" },
      { id: "pe-12", category: "Technology", item: "Staff accounts and permissions configured", status: "pending", notes: "Set up after award notification" },
      { id: "pe-13", category: "Staffing", item: "Project Director identified", status: "verified", notes: "Dr. Terry Flood" },
      { id: "pe-14", category: "Staffing", item: "Evaluator identified or RFP drafted", status: "pending", notes: "Better Science Lab as research partner" },
      { id: "pe-15", category: "Financial", item: "Fiscal systems ready for federal funds", status: "pending", notes: "Chart of accounts, time tracking, match documentation" },
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
    competitiveEdge: [
      "50+ career pathways with stackable credentials already built in platform",
      "Integrated case management with Individual Employment Plans (IEPs)",
      "Real-time WIOA performance accountability tracking (entered employment, median earnings, credential attainment)",
      "Employer engagement portal with job placement pipeline",
      "MCE platform provides minority business support — rare in WIOA applications",
    ],
    sections: [
      { id: "wioa-narrative", name: "Program Narrative", description: "Service delivery design, career pathways, employer engagement strategy", icon: FileText, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI" },
      { id: "wioa-budget", name: "Budget & Cost Allocation", description: "Cost categories aligned to WIOA allowable costs", icon: DollarSign, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood" },
      { id: "wioa-performance", name: "Performance Targets", description: "Proposed targets for all 6 WIOA primary indicators", icon: BarChart3, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI" },
      { id: "wioa-eligibility", name: "Eligibility & Outreach Plan", description: "Target population, eligibility verification, recruitment strategy", icon: Users, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood" },
      { id: "wioa-employer", name: "Employer Partnership Letters", description: "Committed employer partners for work-based learning", icon: Building2, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood" },
      { id: "wioa-14elements", name: "14 Youth Elements Plan", description: "How all 14 required WIOA youth program elements are delivered", icon: ClipboardCheck, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "AI + Dr. Flood Review" },
      { id: "wioa-mou", name: "MOU with Workforce Board", description: "Memorandum of Understanding with Local Workforce Development Board", icon: Handshake, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood" },
    ],
    phases: [
      {
        id: "collaborate", name: "1. Collaborate & Research", description: "Understand local workforce board priorities and requirements", status: "upcoming",
        tasks: [
          { id: "wc1", task: "Identify target Local Workforce Development Board (LWDB)", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "wc2", task: "Review state WIOA plan and local area priorities", owner: "Dr. Flood + AI", status: "pending", dueDate: "TBD" },
          { id: "wc3", task: "Map platform capabilities to all 14 WIOA youth elements", owner: "AI", status: "pending", dueDate: "TBD" },
          { id: "wc4", task: "Identify 3-5 employer partners for work-based learning", owner: "Dr. Flood", status: "pending", dueDate: "TBD" },
          { id: "wc5", task: "Gather local labor market data for target occupations", owner: "AI", status: "pending", dueDate: "TBD" },
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
      { id: "wpe-1", category: "Registration", item: "SAM.gov registration active", status: "verified", notes: "" },
      { id: "wpe-2", category: "Compliance", item: "501(c)(3) status confirmed", status: "pending", notes: "" },
      { id: "wpe-3", category: "Compliance", item: "WIOA eligible provider status", status: "action-needed", notes: "Apply through state Eligible Training Provider List (ETPL)" },
      { id: "wpe-4", category: "Partnerships", item: "LWDB relationship established", status: "action-needed", notes: "Contact local board for partnership discussion" },
      { id: "wpe-5", category: "Partnerships", item: "Minimum 3 employer partners committed", status: "pending", notes: "" },
      { id: "wpe-6", category: "Data", item: "WIOA performance tracking configured", status: "verified", notes: "Workforce Dashboard tracks all 6 primary indicators" },
      { id: "wpe-7", category: "Staffing", item: "Case managers identified", status: "pending", notes: "" },
      { id: "wpe-8", category: "Technology", item: "Career pathway tools configured", status: "verified", notes: "Career Explorer, Pathway Builder, Assessment tools all live" },
      { id: "wpe-9", category: "Financial", item: "Cost allocation methodology documented", status: "pending", notes: "Required for WIOA cost categories" },
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
    competitiveEdge: [
      "ThriveUp serves exactly the target demographic — Black youth 16-24 facing employment barriers",
      "Integrated entrepreneurship pipeline through MCE (Minority Capital Exchange)",
      "AI-powered career exploration makes pathways tangible, not theoretical",
      "Financial literacy module teaches wealth-building, not just budgeting",
      "VOSB designation and minority business infrastructure show authentic community investment",
    ],
    sections: [
      { id: "nba-loi", name: "Letter of Inquiry (LOI)", description: "Initial inquiry with program overview, population served, and funding request", icon: FileText, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI" },
      { id: "nba-narrative", name: "Full Proposal Narrative", description: "Program design, theory of change, target population, implementation plan", icon: BookOpen, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI" },
      { id: "nba-budget", name: "Budget & Justification", description: "Detailed budget with cost-per-participant and overhead allocation", icon: DollarSign, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood" },
      { id: "nba-outcomes", name: "Outcomes Framework", description: "Measurable outcomes: employment, wage gains, credential attainment, business starts", icon: BarChart3, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI" },
      { id: "nba-org-capacity", name: "Organizational Capacity", description: "Board composition, leadership bios, financial statements, prior program results", icon: Building2, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood" },
      { id: "nba-equity", name: "Equity & Community Voice", description: "How program design centers Black community voice and lived experience", icon: Heart, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood" },
      { id: "nba-partnerships", name: "Partnership Documentation", description: "Employer partners, community organizations, educational institutions", icon: Handshake, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood" },
      { id: "nba-sustainability", name: "Sustainability & Scale Plan", description: "How program continues and grows beyond NBA Foundation funding", icon: Globe, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood" },
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
    competitiveEdge: [
      "Three Realities methodology IS 'community-informed' — exactly what St. David's requires",
      "LifeBridge platform handles benefits navigation and enrollment — direct alignment",
      "14-platform ecosystem provides the comprehensive service infrastructure they fund",
      "MCE provides minority business economic empowerment pipeline",
      "MAP-GAP continuous improvement aligns with foundation's data-driven approach",
      "Financial Literacy module directly supports economic stability for participants",
    ],
    sections: [
      { id: "std-loi", name: "Letter of Intent / Application", description: "Organization overview, program description, population served, funding request", icon: FileText, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI" },
      { id: "std-narrative", name: "Program Narrative", description: "Community-informed program design, economic stability services, public benefits enrollment strategy", icon: BookOpen, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI" },
      { id: "std-budget", name: "Budget & Justification", description: "Line-item budget with cost allocation for economic stability services", icon: DollarSign, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood" },
      { id: "std-community", name: "Community Voice Documentation", description: "Evidence of community-informed design — Three Realities analysis, stakeholder input, lived experience", icon: Users, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood" },
      { id: "std-outcomes", name: "Outcomes & Evaluation Plan", description: "Measurable outcomes: benefits enrollment rates, economic stability indicators, participant economic health", icon: BarChart3, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood + AI" },
      { id: "std-partnerships", name: "Partnership & Collaboration Letters", description: "Community organizations, benefits agencies, workforce partners in Central Texas", icon: Handshake, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood" },
      { id: "std-org-capacity", name: "Organizational Capacity", description: "Board composition, leadership bios, financial statements, prior results", icon: Building2, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood" },
      { id: "std-sustainability", name: "Sustainability Plan", description: "How economic stability services continue beyond St. David's funding", icon: Globe, status: "not-started", content: "", reviewNotes: "", lastUpdated: "", assignee: "Dr. Flood" },
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

function SectionDrafter({ section, grant, autoTrigger, onAutoTriggered }: { section: PackageSection; grant: GrantPackage; autoTrigger?: boolean; onAutoTriggered?: () => void }) {
  const { toast } = useToast();
  const [draftContent, setDraftContent] = useState(section.content || "");
  const [userInstructions, setUserInstructions] = useState("");
  const [refineInstructions, setRefineInstructions] = useState("");
  const [showRefine, setShowRefine] = useState(false);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);

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
      });
      return resp.json();
    },
    onSuccess: (data: { draft: string }) => {
      setDraftContent(data.draft);
      toast({ title: "Draft generated", description: `"${section.name}" has been drafted by AI. Review and edit as needed.` });
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
      });
      return resp.json();
    },
    onSuccess: (data: { draft: string }) => {
      setDraftContent(data.draft);
      setRefineInstructions("");
      setShowRefine(false);
      toast({ title: "Draft refined", description: "Your instructions have been applied." });
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
        {section.lastUpdated && (
          <div className="text-right">
            <p className="text-xs font-medium text-muted-foreground mb-1">Last Updated</p>
            <p className="text-sm">{section.lastUpdated}</p>
          </div>
        )}
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
              <Badge variant="secondary" className="text-[10px] ml-1">{draftContent.split(/\s+/).length} words</Badge>
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
            onChange={(e) => setDraftContent(e.target.value)}
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
  const [sectionStatuses, setSectionStatuses] = useState<Record<string, ApprovalStatus>>({});
  const [workflowMode, setWorkflowMode] = useState<"guided" | "auto">("guided");
  const [autoTriggerDraft, setAutoTriggerDraft] = useState(false);

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
    setSectionStatuses((prev) => ({ ...prev, [sectionId]: status }));
  };

  const approvedCount = currentGrant.sections.filter((s) => getSectionStatus(s.id, s.status) === "approved").length;
  const totalSections = currentGrant.sections.length;
  const packageProgress = Math.round((approvedCount / totalSections) * 100);

  const completedTasks = currentGrant.phases.flatMap((p) => p.tasks).filter((t) => t.status === "done").length;
  const totalTasks = currentGrant.phases.flatMap((p) => p.tasks).length;

  const verifiedChecklist = currentGrant.preExecutionChecklist.filter((c) => c.status === "verified").length;
  const totalChecklist = currentGrant.preExecutionChecklist.length;

  const handleDownloadPackage = () => {
    const approved = currentGrant.sections.filter((s) => getSectionStatus(s.id, s.status) === "approved");
    if (approved.length === 0) {
      alert("No sections have been approved yet. Review and approve sections before downloading the package.");
      return;
    }
    let content = `${"=".repeat(60)}\n${currentGrant.fullName}\nGrant Submission Package\nGenerated: ${new Date().toLocaleDateString()}\n${"=".repeat(60)}\n\n`;
    content += `Funder: ${currentGrant.funder}\nAmount: ${currentGrant.amount}\nDeadline: ${currentGrant.deadline}\n\n`;
    content += `PACKAGE STATUS: ${approvedCount}/${totalSections} sections approved\n\n`;
    approved.forEach((section) => {
      content += `${"─".repeat(40)}\n${section.name}\n${"─".repeat(40)}\n`;
      content += `${section.description}\n\n`;
      content += `Status: APPROVED\n`;
      content += `Last Updated: ${section.lastUpdated}\n`;
      content += `Assignee: ${section.assignee}\n\n`;
      if (section.content) content += `${section.content}\n\n`;
      if (section.reviewNotes) content += `Review Notes: ${section.reviewNotes}\n\n`;
    });
    content += `\n${"=".repeat(60)}\nPRE-EXECUTION CHECKLIST\n${"=".repeat(60)}\n\n`;
    currentGrant.preExecutionChecklist.forEach((item) => {
      const mark = item.status === "verified" ? "[X]" : item.status === "pending" ? "[ ]" : "[!]";
      content += `${mark} ${item.item} (${item.category})\n`;
      if (item.notes) content += `    Notes: ${item.notes}\n`;
    });
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentGrant.id}_submission_package_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-grant-packages-title">Grant Submission Packages</h1>
          <p className="text-muted-foreground mt-1">End-to-end pipeline: Collaborate → Build → Review → Submit → Execute</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPackage} data-testid="button-download-package">
            <Download className="h-4 w-4 mr-2" />
            Download Package
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
                      <div className="border-t">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-muted/30">
                              <th className="text-left p-3 text-xs font-medium text-muted-foreground w-8"></th>
                              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Task</th>
                              <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Owner</th>
                              <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Due</th>
                              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {phase.tasks.map((task) => (
                              <tr key={task.id} className="border-t hover:bg-muted/20">
                                <td className="p-3"><TaskStatusIcon status={task.status} /></td>
                                <td className="p-3 text-sm">{task.task}</td>
                                <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell">{task.owner}</td>
                                <td className="p-3 text-sm text-muted-foreground hidden md:table-cell">{task.dueDate}</td>
                                <td className="p-3">
                                  <Badge variant={task.status === "done" ? "default" : task.status === "in-progress" ? "secondary" : "outline"} className="text-[10px]">
                                    {task.status === "done" ? "Done" : task.status === "in-progress" ? "In Progress" : "Pending"}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
            <p className="text-sm text-muted-foreground mb-4">Everything that must be in place before Day 1 if awarded. Hold yourself accountable.</p>

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
              <div key={category} className="mb-4">
                <h4 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">{category}</h4>
                <div className="space-y-2">
                  {currentGrant.preExecutionChecklist.filter((c) => c.category === category).map((item) => (
                    <div key={item.id} className={`flex items-start gap-3 p-3 rounded-lg border ${
                      item.status === "verified" ? "bg-emerald-50/50 border-emerald-200/50 dark:bg-emerald-950/20 dark:border-emerald-800/50" :
                      item.status === "action-needed" ? "bg-red-50/50 border-red-200/50 dark:bg-red-950/20 dark:border-red-800/50" :
                      "bg-muted/30 border-border"
                    }`}>
                      <ChecklistStatusIcon status={item.status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.item}</p>
                        {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
                      </div>
                      <Badge variant={item.status === "verified" ? "default" : item.status === "action-needed" ? "destructive" : "secondary"} className="text-[10px] shrink-0">
                        {item.status === "verified" ? "Verified" : item.status === "action-needed" ? "Action Needed" : "Pending"}
                      </Badge>
                    </div>
                  ))}
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
