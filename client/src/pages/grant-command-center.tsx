import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Target, Clock, CheckCircle2, AlertTriangle, Calendar,
  Plus, Search, FileText, DollarSign, Building2,
  ChevronRight, ExternalLink, Filter, TrendingUp,
  BarChart3, Bell, Archive, XCircle, Send
} from "lucide-react";

type GrantStatus =
  | "identified"
  | "researching"
  | "loi_drafting"
  | "loi_submitted"
  | "proposal_drafting"
  | "proposal_submitted"
  | "awarded"
  | "rejected"
  | "archived"
  | "recurring_watch";

type Platform =
  | "TCAF"
  | "HerHealth Network"
  | "TheHealthyBlkMan"
  | "YourHealthBirthright"
  | "ThriveUp Academy"
  | "LifeBridge"
  | "Sankofa Health Network"
  | "Sankofa Maternal Health"
  | "Sankofa Feminine Health"
  | "WholeMind Learning"
  | "SafeCogniCare"
  | "SafeReport"
  | "Mission Transition"
  | "MCE"
  | "Pinnacle Business"
  | "Perfectly Different"
  | "ISSS"
  | "Whole-Person Health"
  | "Emergency Management"
  | "Ecosystem Nexus"
  | "Multiple";

interface GrantEntry {
  id: string;
  name: string;
  funder: string;
  solicitation?: string;
  amount: string;
  amountNum: number;
  deadline?: string;
  deadlineDate?: Date;
  status: GrantStatus;
  platforms: Platform[];
  category: "federal" | "state" | "foundation" | "corporate" | "other";
  recurringCycle?: string;
  nextCycleDate?: string;
  documents: { name: string; path: string }[];
  notes: string;
  url?: string;
  submitUrl?: string;
  submitPortal?: string;
  priority: 1 | 2 | 3;
  submittedDate?: string;
  contactName?: string;
  contactEmail?: string;
}

const STATUS_CONFIG: Record<GrantStatus, { label: string; color: string; icon: any }> = {
  identified: { label: "Identified", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: Target },
  researching: { label: "Researching", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", icon: Search },
  loi_drafting: { label: "LOI Drafting", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: FileText },
  loi_submitted: { label: "LOI Submitted", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: Send },
  proposal_drafting: { label: "Proposal Drafting", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", icon: FileText },
  proposal_submitted: { label: "Submitted", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200", icon: CheckCircle2 },
  awarded: { label: "Awarded", color: "bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100", icon: DollarSign },
  rejected: { label: "Not Selected", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300", icon: XCircle },
  archived: { label: "Archived", color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400", icon: Archive },
  recurring_watch: { label: "Watching", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200", icon: Bell },
};

const INITIAL_GRANTS: GrantEntry[] = [
  {
    id: "rare-impact-2026",
    name: "Rare Impact Fund — Nonclinical Youth MH Workforce",
    funder: "Rare Impact Fund (Selena Gomez / Hopewell Fund)",
    solicitation: "Strengthening the Nonclinical Youth Mental Health Workforce",
    amount: "$350,000",
    amountNum: 350000,
    deadline: "April 10, 2026",
    deadlineDate: new Date("2026-04-10"),
    status: "loi_submitted",
    platforms: ["TCAF", "ThriveUp Academy", "LifeBridge", "Sankofa Health Network"],
    category: "foundation",
    documents: [
      { name: "LOI Narrative (Submitted)", path: "/docs/grants/TCAF-Rare-Impact-Fund-LOI-Narrative-SUBMITTED.md" },
      { name: "Organizational Budget", path: "/docs/grants/TCAF-Organizational-Budget-FY2025-2026.doc" },
      { name: "Leadership Overview", path: "/docs/grants/TCAF-Leadership-Staff-Overview.doc" },
    ],
    notes: "LOI submitted April 9. $350K over 2 years. All 5 pipeline stages. Waiting for Stage 2 invitation.",
    url: "https://forms.gle/jeP6kpsLMt6haw9m8",
    submitUrl: "https://forms.gle/jeP6kpsLMt6haw9m8",
    submitPortal: "Google Forms",
    priority: 1,
    submittedDate: "April 9, 2026",
    contactName: "Rare Impact Fund Program Team",
  },
  {
    id: "twc-rfa-32026",
    name: "TWC RFA 32026-00162 — Workforce Readiness Curriculum",
    funder: "Texas Workforce Commission",
    solicitation: "RFA 32026-00162",
    amount: "TBD",
    amountNum: 0,
    deadline: "April 14, 2026",
    deadlineDate: new Date("2026-04-14"),
    status: "proposal_drafting",
    platforms: ["TCAF", "ThriveUp Academy"],
    category: "state",
    documents: [
      { name: "TWC Narrative Draft", path: "/docs/grants/TWC-RFA-32026-00162-NARRATIVE.md" },
    ],
    notes: "Live curriculum is the differentiator. 5 modules, 20 lessons, 50 questions serving via API. Due April 14, 10AM CDT.",
    submitUrl: "https://apps.hhs.texas.gov/esbd/",
    submitPortal: "Texas ESBD",
    priority: 1,
  },
  {
    id: "agency-fund-2026",
    name: "Agency Fund EOI",
    funder: "Agency Fund",
    amount: "TBD",
    amountNum: 0,
    deadline: "April 26, 2026",
    deadlineDate: new Date("2026-04-26"),
    status: "identified",
    platforms: ["TCAF"],
    category: "foundation",
    documents: [],
    notes: "Expression of Interest. Needs scoping and drafting.",
    priority: 2,
  },
  {
    id: "stdavids-wab2-2026",
    name: "St. David's Foundation — We All Benefit 2.0",
    funder: "St. David's Foundation",
    solicitation: "WAB2 LOI",
    amount: "TBD",
    amountNum: 0,
    deadline: "April 27, 2026",
    deadlineDate: new Date("2026-04-27"),
    status: "loi_drafting",
    platforms: ["TCAF", "ThriveUp Academy", "LifeBridge", "Sankofa Health Network"],
    category: "foundation",
    documents: [
      { name: "WAB2 LOI Package", path: "/docs/grants/St-Davids-WAB2-LOI-Package.md" },
    ],
    notes: "LOI package ready. Waiting on signed PfISD support letter from Traci Hendrix (traci.hendrix@pfisd.net). She sent to CAO for review.",
    url: "https://stdavidsfoundation.org/funding-opportunities",
    submitUrl: "https://stdavidsfoundation.org/funding-opportunities",
    submitPortal: "St. David's Foundation Portal",
    priority: 1,
    contactName: "Traci Hendrix",
    contactEmail: "traci.hendrix@pfisd.net",
  },
  {
    id: "nsf-techaccess-loi-2026",
    name: "NSF TechAccess: AI-Ready America — LOI",
    funder: "National Science Foundation",
    solicitation: "NSF 26-508",
    amount: "$1,000,000/yr x 3 years",
    amountNum: 3000000,
    deadline: "June 16, 2026",
    deadlineDate: new Date("2026-06-16"),
    status: "researching",
    platforms: ["TCAF", "ThriveUp Academy", "WholeMind Learning", "Multiple"],
    category: "federal",
    documents: [
      { name: "Alignment & Gap Assessment", path: "/docs/grants/NSF-TechAccess-AI-Ready-America-Alignment.md" },
      { name: "Proposal Framework (15-page)", path: "/docs/grants/NSF-TechAccess-Proposal-Framework.md" },
    ],
    notes: "Texas Coordination Hub. Needs university Co-PI partner (Huston-Tillotson or Texas State recommended). Biggest single opportunity at $3M total.",
    url: "https://www.nsf.gov/pubs/2026/nsf26508/nsf26508.htm",
    submitUrl: "https://www.research.gov/",
    submitPortal: "Research.gov",
    priority: 1,
    contactName: "NSF AI-Ready Program",
    contactEmail: "ai-ready@nsf.gov",
  },
  {
    id: "nsf-techaccess-full-2026",
    name: "NSF TechAccess: AI-Ready America — Full Proposal",
    funder: "National Science Foundation",
    solicitation: "NSF 26-508",
    amount: "$1,000,000/yr x 3 years",
    amountNum: 3000000,
    deadline: "July 16, 2026",
    deadlineDate: new Date("2026-07-16"),
    status: "proposal_drafting",
    platforms: ["TCAF", "ThriveUp Academy", "WholeMind Learning", "Multiple"],
    category: "federal",
    documents: [
      { name: "Proposal Framework (15-page)", path: "/docs/grants/NSF-TechAccess-Proposal-Framework.md" },
    ],
    notes: "15-page project description. Dependent on LOI submission June 16 and university partner secured by May 15.",
    submitUrl: "https://www.research.gov/",
    submitPortal: "Research.gov",
    priority: 1,
  },
  {
    id: "nih-r03-aim-housing",
    name: "NIH R03 AIM-Housing — Housing Instability Cascade Mapping",
    funder: "NIH",
    solicitation: "PA-25-302",
    amount: "$100,000",
    amountNum: 100000,
    deadline: "June 16, 2026",
    deadlineDate: new Date("2026-06-16"),
    status: "proposal_drafting",
    platforms: ["TCAF", "LifeBridge"],
    category: "federal",
    documents: [],
    notes: "Housing instability cascade mapping in Austin, TX (ZIP codes 78741, 78702, 78753). Partners: Austin Housing Authority, ECHO, Foundation Communities, Central Health, Integral Care. RPLICE Pipeline at /r03-pipeline. SAM.gov registration required (EIN 41-3618003). Most urgent NIH submission.",
    url: "https://grants.nih.gov/grants/guide/pa-files/PA-25-302.html",
    submitUrl: "https://public.era.nih.gov/assist",
    submitPortal: "NIH ASSIST / eRA Commons",
    priority: 1,
  },
  {
    id: "nih-r03-shield-austin",
    name: "NIH R03 SHIELD-Austin — Overdose Prevention Cascade",
    funder: "NIH",
    solicitation: "PAR-25-233",
    amount: "$100,000",
    amountNum: 100000,
    deadline: "October 5, 2026",
    deadlineDate: new Date("2026-10-05"),
    status: "proposal_drafting",
    platforms: ["TCAF", "LifeBridge", "Sankofa Health Network"],
    category: "federal",
    documents: [],
    notes: "Overdose prevention cascade mapping in Austin, TX (78741, 78702, 78753). Partners: Integral Care, Travis County Opioid Task Force, Austin Harm Reduction Coalition, ATCEMS. Austin OD rate 33/100K (highest in TX), 279 fentanyl deaths 2023, 78753 OD rate 44.8/100K.",
    url: "https://grants.nih.gov/grants/guide/pa-files/PAR-25-233.html",
    submitUrl: "https://public.era.nih.gov/assist",
    submitPortal: "NIH ASSIST / eRA Commons",
    priority: 2,
  },
  {
    id: "nih-r01-integrate-austin",
    name: "NIH R01 INTEGRATE-Austin — Full-Scale Housing + Substance Use Intervention",
    funder: "NIH",
    solicitation: "Standard R01 — FOA TBD",
    amount: "$1,250,000",
    amountNum: 1250000,
    deadline: "TBD (after R03 pilot data)",
    status: "researching",
    platforms: ["TCAF", "LifeBridge", "Sankofa Health Network"],
    category: "federal",
    documents: [],
    notes: "Full-scale integrated intervention combining housing stabilization with substance use prevention across 6-8 sites. Cluster randomized stepped-wedge design. Builds on both R03 pilots (AIM-Housing + SHIELD-Austin) as preliminary data. All R03 partners plus expanded network. $1.25M over 5 years.",
    submitUrl: "https://public.era.nih.gov/assist",
    submitPortal: "NIH ASSIST / eRA Commons",
    priority: 2,
  },
  {
    id: "nih-r21-minority-health",
    name: "NIH R21 — Minority Health & Digital Health Disparities",
    funder: "NIH / NIMHD",
    amount: "$275,000",
    amountNum: 275000,
    status: "recurring_watch",
    platforms: ["HerHealth Network", "Sankofa Health Network", "TheHealthyBlkMan", "YourHealthBirthright"],
    category: "federal",
    recurringCycle: "3 cycles/year (Feb, Jun, Oct)",
    nextCycleDate: "June 2026",
    documents: [],
    notes: "R21 exploratory/developmental grants. HerHealth Network is strong fit — 70 conditions, AI navigator, SDOH integration. Need academic partner for PI.",
    priority: 2,
  },
  {
    id: "nih-sbir-health-tech",
    name: "NIH SBIR/STTR — Health Technology for Underserved",
    funder: "NIH",
    solicitation: "PA-24-095",
    amount: "$275,000 (Phase I) / $1.5M (Phase II)",
    amountNum: 275000,
    status: "recurring_watch",
    platforms: ["HerHealth Network", "SafeCogniCare", "Sankofa Health Network"],
    category: "federal",
    recurringCycle: "3 cycles/year (Jan, Apr, Sep)",
    nextCycleDate: "September 2026",
    documents: [],
    notes: "SBIR requires small business concern status. May need to apply through HIS. Digital health for underserved populations.",
    priority: 3,
  },
  {
    id: "hhs-omh-health-equity",
    name: "HHS Office of Minority Health — Health Equity Grants",
    funder: "HHS / Office of Minority Health",
    amount: "$200,000–$500,000",
    amountNum: 400000,
    status: "recurring_watch",
    platforms: ["HerHealth Network", "Sankofa Health Network", "TheHealthyBlkMan", "YourHealthBirthright"],
    category: "federal",
    recurringCycle: "Annual (varies, typically Spring)",
    nextCycleDate: "Check minorityhealth.hhs.gov",
    documents: [],
    notes: "Minority women's health, technology dissemination, health equity. HerHealth is direct fit.",
    url: "https://minorityhealth.hhs.gov",
    priority: 2,
  },
  {
    id: "hrsa-community-health",
    name: "HRSA — Community Health & SDOH Grants",
    funder: "HRSA",
    amount: "$100,000–$500,000",
    amountNum: 300000,
    status: "recurring_watch",
    platforms: ["TCAF", "HerHealth Network", "LifeBridge", "Sankofa Health Network"],
    category: "federal",
    recurringCycle: "Annual (varies by program)",
    documents: [],
    notes: "Underserved communities, patient navigation, free access. Multiple program areas: Health Workforce, Community Health, SDOH.",
    priority: 2,
  },
  {
    id: "komen-stand-for-her",
    name: "Susan G. Komen — Stand for H.E.R.",
    funder: "Susan G. Komen",
    amount: "$100,000–$500,000",
    amountNum: 300000,
    status: "recurring_watch",
    platforms: ["HerHealth Network"],
    category: "foundation",
    recurringCycle: "Annual (check komen.org)",
    documents: [],
    notes: "Black women's breast cancer disparities. HerHealth Cancer Platform covers breast cancer (IBC, triple-negative, BRCA). Direct alignment with 25% reduction goal.",
    priority: 2,
  },
  {
    id: "rwjf-evidence-action",
    name: "Robert Wood Johnson Foundation — Evidence for Action",
    funder: "RWJF",
    amount: "$100,000–$400,000",
    amountNum: 300000,
    status: "recurring_watch",
    platforms: ["TCAF", "HerHealth Network", "Sankofa Health Network"],
    category: "foundation",
    recurringCycle: "Rolling (quarterly review)",
    documents: [],
    notes: "Health equity, knowledge systems, community-centered platform, racial justice. Strong fit for HerHealth + RPLICE evaluation.",
    url: "https://www.rwjf.org/en/grants.html",
    priority: 2,
  },
  {
    id: "kellogg-health-equity",
    name: "W.K. Kellogg Foundation — Racial Equity & Health",
    funder: "W.K. Kellogg Foundation",
    amount: "$100,000–$500,000",
    amountNum: 300000,
    status: "recurring_watch",
    platforms: ["TCAF", "HerHealth Network", "YourHealthBirthright", "Sankofa Health Network"],
    category: "foundation",
    recurringCycle: "Rolling",
    documents: [],
    notes: "Racial equity, health, vulnerable children and families, Black community. YourHealthBirthright maternal health is strong fit.",
    priority: 2,
  },
  {
    id: "google-org-ai",
    name: "Google.org — AI for Social Good",
    funder: "Google.org",
    amount: "$250,000–$2,000,000",
    amountNum: 1000000,
    status: "recurring_watch",
    platforms: ["TCAF", "HerHealth Network", "Multiple"],
    category: "corporate",
    recurringCycle: "Annual (varies)",
    documents: [],
    notes: "AI for good, health equity technology. TCAF's collaborative AI engine (4 models) and HerHealth's Nia AI navigator are strong differentiators.",
    priority: 2,
  },
  {
    id: "microsoft-ai-health",
    name: "Microsoft Philanthropies — Health Equity & AI",
    funder: "Microsoft Philanthropies",
    amount: "$100,000–$500,000",
    amountNum: 300000,
    status: "recurring_watch",
    platforms: ["TCAF", "HerHealth Network", "Multiple"],
    category: "corporate",
    recurringCycle: "Annual",
    documents: [],
    notes: "Health equity, AI, underserved communities. Platform ecosystem + AI infrastructure is strong match.",
    priority: 3,
  },
  {
    id: "jnj-womens-health",
    name: "Johnson & Johnson Foundation — Women's & Maternal Health",
    funder: "Johnson & Johnson Foundation",
    amount: "$100,000–$500,000",
    amountNum: 300000,
    status: "recurring_watch",
    platforms: ["HerHealth Network", "YourHealthBirthright"],
    category: "corporate",
    recurringCycle: "Annual",
    documents: [],
    notes: "Women's health, maternal health. HerHealth (70 conditions) + YourHealthBirthright (birth equity) are direct fits.",
    priority: 3,
  },
  {
    id: "merck-cardiac-equity",
    name: "Merck Foundation — Collaborative for Equity in Cardiac Care",
    funder: "Merck Foundation",
    amount: "$100,000–$300,000",
    amountNum: 200000,
    status: "recurring_watch",
    platforms: ["HerHealth Network", "TheHealthyBlkMan"],
    category: "corporate",
    recurringCycle: "Annual",
    documents: [],
    notes: "Health equity, cardiovascular disparities, Black women. HerHealth Cardiovascular Platform + TheHealthyBlkMan cardiovascular coverage.",
    priority: 3,
  },
  {
    id: "tx-hhsc-sdoh",
    name: "Texas HHSC — SDOH & Minority Health Programs",
    funder: "Texas Health and Human Services Commission",
    amount: "$50,000–$300,000",
    amountNum: 150000,
    status: "recurring_watch",
    platforms: ["TCAF", "HerHealth Network", "LifeBridge"],
    category: "state",
    recurringCycle: "Annual (check HHSC website)",
    documents: [],
    notes: "SDOH programs, health equity planning, minority health initiatives. LifeBridge benefits navigation + HerHealth SDOH integration.",
    priority: 2,
  },
  {
    id: "ford-foundation-racial-justice",
    name: "Ford Foundation — Racial Justice & Technology Equity",
    funder: "Ford Foundation",
    amount: "$200,000–$1,000,000",
    amountNum: 500000,
    status: "recurring_watch",
    platforms: ["TCAF", "HerHealth Network", "Multiple"],
    category: "foundation",
    recurringCycle: "Rolling",
    documents: [],
    notes: "Racial justice, technology equity. TCAF's ecosystem built by and for underserved communities. Strong narrative fit.",
    priority: 3,
  },
  {
    id: "stdavids-future-cycles",
    name: "St. David's Foundation — Future Grant Cycles",
    funder: "St. David's Foundation",
    amount: "$250,000–$7,000,000",
    amountNum: 1000000,
    status: "recurring_watch",
    platforms: ["TCAF", "HerHealth Network", "Sankofa Health Network"],
    category: "foundation",
    recurringCycle: "Multiple cycles/year — monitor stdavidsfoundation.org/funding-opportunities weekly",
    documents: [],
    notes: "Missed Healthy Births ($7M, July 2025), Culturally Responsive MH ($4.2M, July 2025), Healthcare Workforce (May 2025). Must track future cycles actively. $250K minimum budget requirement for some programs.",
    url: "https://stdavidsfoundation.org/funding-opportunities",
    priority: 1,
  },
  {
    id: "gwbailey-stem",
    name: "Glenn W. Bailey Foundation — STEM Programs",
    funder: "Glenn W. Bailey Foundation",
    amount: "Varies",
    amountNum: 50000,
    status: "researching",
    platforms: ["TCAF", "ThriveUp Academy", "WholeMind Learning"],
    category: "foundation",
    recurringCycle: "Rolling monthly review",
    documents: [],
    notes: "STEM education focus. STEM Stars (6-12th grade) or Teen Tech (competition) could work. Requires STEM-specific framing of ThriveUp Academy. Will not cover >10% admin/salary costs.",
    url: "https://www.gwbaileyfoundation.org/programgrants",
    priority: 3,
  },
  {
    id: "rwjf-health-knowledge-2026",
    name: "RWJF — Learning from Abroad: Health Knowledge Systems",
    funder: "Robert Wood Johnson Foundation",
    amount: "Up to $500,000",
    amountNum: 500000,
    deadline: "April 13, 2026 (brief proposal)",
    deadlineDate: new Date("2026-04-13"),
    status: "identified",
    platforms: ["Sankofa Health Network", "Whole-Person Health", "LifeBridge"],
    category: "foundation",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "Must be U.S.-based org. Must NOT have received RWJF funds since Jan 1, 2021. No biomedical/clinical/bench science. Focus on community-driven health knowledge, narrative change, cross-sector collaboration. Fiscal sponsor allowed. Sankofa + LifeBridge = community health knowledge system for Black communities in Austin.",
    url: "https://www.rwjf.org/en/grants/active-funding-opportunities/2026/learning-from-abroad-to-reimagine-health-knowledge-systems-for-equity-and-wellbeing.html",
    submitUrl: "https://www.rwjf.org/en/grants/active-funding-opportunities/2026/learning-from-abroad-to-reimagine-health-knowledge-systems-for-equity-and-wellbeing.html",
    submitPortal: "RWJF Online Portal",
    priority: 1,
  },
  {
    id: "gates-ai-charitable-2026",
    name: "Gates Foundation — AI to Accelerate Charitable Giving",
    funder: "Bill & Melinda Gates Foundation",
    amount: "Up to $150,000",
    amountNum: 150000,
    deadline: "April 28, 2026",
    deadlineDate: new Date("2026-04-28"),
    status: "identified",
    platforms: ["TCAF", "Ecosystem Nexus", "Multiple"],
    category: "foundation",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "Must answer: 'How might AI support charitable donors to give more and give sooner?' Awards to orgs not individuals. Indirect costs allowed within $150K cap. No min budget. Travel to convenings covered separately. The Incubator's grant discovery engine + AI LOI/narrative writer = AI tool accelerating nonprofit giving infrastructure.",
    url: "https://gcgh.grandchallenges.org/challenge/artificial-intelligence-ai-accelerate-charitable-giving",
    submitUrl: "https://submit.gatesfoundation.org/prog/artificial_intelligence_ai_to_accelerate_charitable_giving/",
    submitPortal: "Gates Foundation Submit Portal",
    priority: 1,
  },
  {
    id: "cdc-dfc-year1-2026",
    name: "CDC Drug-Free Communities (DFC) — Year 1 New Coalition",
    funder: "CDC / ONDCP",
    amount: "$125,000/yr × 10 yrs ($1.25M total)",
    amountNum: 1250000,
    deadline: "~45 days after NOFO (expected May 2026)",
    status: "identified",
    platforms: ["TCAF", "LifeBridge"],
    category: "federal",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "10 statutory requirements: Must have reps from ALL 12 sectors (youth, parents, business, media, school, youth-serving orgs, law enforcement, religious, civic, healthcare, govt, other). Coalition 6+ months old. Must address 2+ substances. No geographic overlap with existing DFC. 1:1 match required (can be in-kind). SAM.gov TIN mismatch must be resolved first. DFC Command Center already built.",
    url: "https://www.cdc.gov/overdose-prevention/php/drug-free-communities/index.html",
    submitUrl: "https://www.grants.gov",
    submitPortal: "Grants.gov",
    priority: 1,
    contactEmail: "DFC_NOFO@cdc.gov",
  },
  {
    id: "twc-healthcare-apprenticeship-2026",
    name: "TWC + DSHS Healthcare Apprenticeship Grant",
    funder: "Texas Workforce Commission + DSHS",
    amount: "Up to $500,000/yr",
    amountNum: 500000,
    deadline: "Open / rolling — check TWC portal",
    status: "identified",
    platforms: ["ThriveUp Academy"],
    category: "state",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "Must support creation/expansion of Registered Apprenticeship programs in healthcare. Must target in-demand healthcare occupations (RN, allied health). Must serve DSH program communities. Need healthcare employer partner (letter of support only). $1M total ($500K/yr FY26+FY27). Separate from TWC RFA 32026-00162.",
    url: "https://www.twc.texas.gov/agency/funding-opportunities/grant-opportunities",
    submitUrl: "https://www.txsmartbuy.com/esbd",
    submitPortal: "Texas ESBD",
    priority: 1,
  },
  {
    id: "fema-bric-2026",
    name: "FEMA BRIC — Building Resilient Infrastructure & Communities",
    funder: "FEMA",
    amount: "Up to $20M/project",
    amountNum: 20000000,
    deadline: "July 23, 2026 at 3:00 PM ET",
    deadlineDate: new Date("2026-07-23"),
    status: "identified",
    platforms: ["Emergency Management", "SafeReport"],
    category: "federal",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "NONPROFITS CANNOT APPLY DIRECTLY — must partner with local government (city/county) as subapplicant. $1B total available. Must be hazard mitigation activity. Benefit-cost analysis required. Need City of Austin or Travis County as applying partner. Letter of support from city/county emergency management office required.",
    url: "https://www.fema.gov/grants/mitigation/building-resilient-infrastructure-communities",
    submitUrl: "https://go.fema.gov/",
    submitPortal: "FEMA GO (via local gov partner)",
    priority: 2,
  },
  {
    id: "samhsa-nctsi-cat3-2026",
    name: "SAMHSA NCTSI Category III — Child Traumatic Stress",
    funder: "SAMHSA",
    amount: "$400K–$1M/yr (up to 5 years)",
    amountNum: 1000000,
    deadline: "NOFO forecasted April–May 2026",
    status: "identified",
    platforms: ["Perfectly Different", "ISSS", "WholeMind Learning"],
    category: "federal",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "Must be domestic public/private nonprofit. Must implement evidence-based trauma-focused treatments for children/adolescents. Must collaborate with NCTSN. Must participate in cross-site evaluation. Need clinical staff qualified for trauma interventions. ISSS MTSS frameworks + Perfectly Different neurodiversity tools + WholeMind K-12 = comprehensive child trauma infrastructure. Letter of support from PfISD strengthens application. Monitor SAMHSA forecast dashboard weekly.",
    url: "https://www.samhsa.gov/grants/grants-dashboard/forecasts",
    submitUrl: "https://www.grants.gov",
    submitPortal: "Grants.gov",
    priority: 1,
  },
  {
    id: "hrsa-mch-pip-2026",
    name: "HRSA Maternal & Child Health Policy Innovation (MCH PIP)",
    funder: "HRSA / Maternal & Child Health Bureau",
    amount: "Varies (competitive)",
    amountNum: 500000,
    status: "recurring_watch",
    platforms: ["Sankofa Maternal Health", "Sankofa Feminine Health", "HerHealth Network"],
    category: "federal",
    recurringCycle: "Watch HRSA portal for next cycle",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "Must be domestic org: nonprofit, CBO, for-profit, higher ed, or tribal. Must propose city/county/state policy initiatives for maternal/child health outcomes. SDOH focus strongly encouraged (housing, food, transport). Must provide TA to policymakers. Must address MCHB priorities: maternal mortality, infant mortality, obstetric emergencies. Letter of support from state/local health dept recommended. No open NOFO currently.",
    url: "https://grants.hrsa.gov",
    submitUrl: "https://www.grants.gov",
    submitPortal: "Grants.gov",
    priority: 2,
  },
  {
    id: "dol-hvrp-2026",
    name: "DOL HVRP — Homeless Veterans Reintegration Program",
    funder: "DOL Veterans' Employment & Training Service",
    amount: "Multi-year (3-year performance period)",
    amountNum: 500000,
    status: "recurring_watch",
    platforms: ["Mission Transition", "MCE", "Pinnacle Business"],
    category: "federal",
    recurringCycle: "Annual — FY2026 FOA closed Feb 25; watch for FY2027",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "Must be state/local govt, nonprofit 501(c)(3), or for-profit. 3 tracks: HVRP (all homeless vets), IVTP (incarcerated vets), HWVHVWC (women vets + vets w/ children). Must provide outreach, case management, job readiness, placement, follow-up. Must coordinate with VA healthcare, HUD-VASH, local CoC. Must track employment outcomes quarterly. SAM.gov required. Letter of support from VA Medical Center recommended.",
    url: "https://www.dol.gov/agencies/vets/serviceproviders/grants",
    submitUrl: "https://www.grants.gov",
    submitPortal: "Grants.gov + JustGrants",
    priority: 2,
  },
  {
    id: "dol-ivtp-2026",
    name: "DOL IVTP — Incarcerated Veterans Transition Program",
    funder: "DOL Veterans' Employment & Training Service",
    amount: "Multi-year (3-year performance period)",
    amountNum: 500000,
    status: "recurring_watch",
    platforms: ["Mission Transition", "MCE"],
    category: "federal",
    recurringCycle: "Annual — same FOA as HVRP",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "Same org eligibility as HVRP. Must serve veterans in/recently released from penal institutions or mental health facilities. Must provide pre-release planning + post-release employment services. Must coordinate with correctional facilities. Must track recidivism and employment retention. Justice Command Center court-ready reports + Thrive Scores + 5-phase reentry pipeline = perfect fit. Letter of support from correctional facility or state DOC recommended.",
    submitUrl: "https://www.grants.gov",
    submitPortal: "Grants.gov + JustGrants",
    priority: 2,
  },
  {
    id: "essa-title-iva-scg-2026",
    name: "Title IV-A / Stronger Connections Grant (via PfISD)",
    funder: "U.S. DOE / Bipartisan Safer Communities Act",
    amount: "Varies (from $1B total pool)",
    amountNum: 500000,
    deadline: "Funds must be obligated by September 30, 2026",
    deadlineDate: new Date("2026-09-30"),
    status: "identified",
    platforms: ["ISSS", "WholeMind Learning", "Perfectly Different", "SafeReport"],
    category: "federal",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "NONPROFITS CANNOT APPLY DIRECTLY — must partner with LEA (school district). LEA must be 'high-need' per SEA. Covers safe/healthy schools, mental health, bullying prevention, SEL. 20% must go to 'well-rounded educational opportunities', 20% to 'safe and healthy students'. Nonprofit serves as subcontractor/MOU partner. MOU must be executed before Sep 30, 2026. Ask PfISD if they received SCG funding. Letter of support from PfISD (Traci Hendrix already engaged).",
    submitUrl: "https://www2.ed.gov/fund/grant/apply/grantapps/index.html",
    submitPortal: "Via School District (PfISD)",
    priority: 1,
  },
  {
    id: "samhsa-ccbhc-pdi-2026",
    name: "SAMHSA CCBHC-PDI — Certified Community Behavioral Health Clinics",
    funder: "SAMHSA",
    amount: "$2M–$4M/year",
    amountNum: 4000000,
    status: "recurring_watch",
    platforms: ["Whole-Person Health", "Sankofa Health Network", "LifeBridge"],
    category: "federal",
    recurringCycle: "Monitor SAMHSA FY2026 forecast dashboard",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "Must be nonprofit behavioral health org or local govt behavioral health authority. For-profits ineligible. Must meet 6 CCBHC certification areas: (1) Staffing (licensed clinicians, psychiatrist access), (2) Availability (no one turned away, 24/7 crisis), (3) Care coordination, (4) Scope (9 required service categories), (5) Quality/reporting, (6) Governance. Must serve ALL individuals regardless of ability to pay. GAP: Need clinical staffing partnerships + 24/7 crisis services. No open NOFO yet.",
    url: "https://www.samhsa.gov/certified-community-behavioral-health-clinics",
    submitUrl: "https://www.grants.gov",
    submitPortal: "Grants.gov",
    priority: 2,
  },
  {
    id: "cdc-reach-2028",
    name: "CDC REACH — Racial & Ethnic Approaches to Community Health",
    funder: "CDC",
    amount: "Up to $800K/year (5-year cooperative agreement)",
    amountNum: 800000,
    status: "recurring_watch",
    platforms: ["Sankofa Health Network", "HerHealth Network", "LifeBridge"],
    category: "federal",
    recurringCycle: "Current cycle 2023–2028; next competition ~2028",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "Must be state/local health dept, tribe, university, or CBO. Must reduce chronic disease disparities in racial/ethnic minorities. Must use culturally appropriate evidence-based strategies. Must address hypertension, diabetes, obesity, physical inactivity, nutrition, tobacco, or cancer screening. Cooperative agreement = CDC has substantial involvement. Must collect standardized health outcome data. Current cycle mid-stream — explore subaward with existing Central TX REACH recipient. Letters of support from local health dept, community partners, faith orgs.",
    url: "https://www.cdc.gov/reach/index.html",
    submitUrl: "https://www.grants.gov",
    submitPortal: "Grants.gov",
    priority: 3,
  },
  {
    id: "googleorg-ai-social-good",
    name: "Google.org — AI for Social Good",
    funder: "Google.org",
    amount: "$1M–$3M per organization",
    amountNum: 3000000,
    status: "recurring_watch",
    platforms: ["TCAF", "Ecosystem Nexus", "Multiple"],
    category: "corporate",
    recurringCycle: "Gov Innovation Challenge closed Apr 3; watch for new cycles",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "Must be nonprofit, social enterprise, or academic institution. Must have clear social impact purpose. Must demo how AI/generative AI solves critical public service challenge. Must participate in Google.org Accelerator if selected. Individuals cannot apply. Must show capacity to implement AI at scale. $60M total across two challenge tracks. 24-platform AI operating system = exactly this. Prepare 2-page AI ecosystem brief for next cycle.",
    url: "https://www.google.org/impact-challenges/",
    priority: 2,
  },
  {
    id: "va-gpd-pdo-2027",
    name: "VA GPD Per Diem Only — Veteran Transitional Housing",
    funder: "VA",
    amount: "Per diem reimbursement (3-year grants)",
    amountNum: 300000,
    status: "recurring_watch",
    platforms: ["Mission Transition", "LifeBridge"],
    category: "federal",
    recurringCycle: "FY2027 NOFO expected late 2026; awards start Oct 1, 2026",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "Must be public or nonprofit entity. Must provide transitional housing OR service center for homeless veterans. Up to 24 months per veteran, goal = permanent housing. Must provide wraparound services (case management, employment, benefits, health). Must coordinate with VA Medical Center homeless programs. Must meet fire/life safety codes. Must have VA per diem agreement. SAM.gov required. GAP: Need physical housing site or partnership with Austin veteran housing provider (Caritas, Foundation Communities). Letter of support from local VA Medical Center required.",
    url: "https://www.va.gov/homeless/gpd.asp",
    submitUrl: "https://www.grants.gov",
    submitPortal: "Grants.gov",
    priority: 3,
  },
  {
    id: "wioa-youth-formula-2026",
    name: "WIOA Title I Youth Formula — via Workforce Board",
    funder: "DOL via TWC via Local Workforce Boards",
    amount: "$948M nationally; varies locally",
    amountNum: 200000,
    status: "recurring_watch",
    platforms: ["ThriveUp Academy"],
    category: "federal",
    recurringCycle: "Ongoing — procurement cycles vary by local board",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "CANNOT apply directly to DOL — must respond to local Workforce Board procurement. Must be selected as Youth Service Provider by Workforce Solutions Capital Area (Austin). Must serve out-of-school youth (16–24) or in-school youth (14–21) with barriers. Must provide 14 WIOA youth program elements. 75% of funds = out-of-school youth. 20% = work experience. Must track credential attainment, employment, measurable skills gains. ThriveUp Academy 50+ career pathways + Panther Village gamification + PfISD hybrid model = purpose-built WIOA youth provider. Contact Workforce Solutions Capital Area about upcoming procurement.",
    submitUrl: "https://www.wfscapitalarea.com/",
    submitPortal: "Workforce Solutions Capital Area",
    priority: 2,
  },
  {
    id: "kpmg-ai-impact-2026",
    name: "KPMG AI Impact Initiative",
    funder: "KPMG U.S. Foundation",
    amount: "$500K–$1.1M + pro bono consulting",
    amountNum: 1100000,
    status: "recurring_watch",
    platforms: ["TCAF", "Multiple"],
    category: "corporate",
    recurringCycle: "No public RFP — selected through partnership outreach",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "U.S.-based nonprofit required. No traditional application — KPMG selects through partner outreach/nominations. Must demo AI integration use case for nonprofit operations. Must participate in skills-based volunteering. Tech partners: Salesforce, Microsoft, ServiceNow, Google Cloud. Prior recipients: First Book ($500K), Big Brothers Big Sisters ($500K), Women's Health Access Matters ($1.1M). 24-platform AI OS = exactly what KPMG funds. Requires executive outreach to KPMG Foundation community impact team.",
    priority: 2,
  },
  {
    id: "sba-mbda-minority-biz",
    name: "SBA/MBDA — Minority Business Development Grants",
    funder: "SBA / Minority Business Development Agency",
    amount: "Varies by program",
    amountNum: 200000,
    status: "recurring_watch",
    platforms: ["MCE", "Pinnacle Business"],
    category: "federal",
    recurringCycle: "Recurring — check mbda.gov",
    documents: [
      { name: "Criteria Matrix", path: "/docs/grants/GRANT-OPPORTUNITY-CRITERIA-MATRIX.md" },
    ],
    notes: "Must serve minority-owned businesses or aspiring minority entrepreneurs. Can be nonprofit, for-profit, educational institution, or govt entity. Must provide business consulting, TA, or capacity building. Must track client outcomes (revenue growth, certifications, contracts won). SAM.gov required. MCE provides SAM.gov integration + certification tools. Pinnacle Business provides consulting + contractor enablement. Letters of support from local minority business orgs or chambers.",
    url: "https://www.mbda.gov/",
    submitUrl: "https://www.grants.gov",
    submitPortal: "Grants.gov",
    priority: 3,
  },
];

function StatusBadge({ status }: { status: GrantStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <Badge className={`${config.color} text-[10px] font-medium gap-1`} data-testid={`badge-status-${status}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function PriorityDot({ priority }: { priority: 1 | 2 | 3 }) {
  const colors = { 1: "bg-red-500", 2: "bg-yellow-500", 3: "bg-blue-400" };
  const labels = { 1: "Critical", 2: "High", 3: "Watch" };
  return (
    <div className="flex items-center gap-1.5" data-testid={`priority-${priority}`}>
      <div className={`w-2 h-2 rounded-full ${colors[priority]}`} />
      <span className="text-[10px] text-muted-foreground">{labels[priority]}</span>
    </div>
  );
}

function daysUntil(date?: Date): number | null {
  if (!date) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function DeadlineTag({ date }: { date?: Date }) {
  const days = daysUntil(date);
  if (days === null) return <span className="text-xs text-muted-foreground">No deadline</span>;
  if (days < 0) return <span className="text-xs text-muted-foreground">Passed</span>;
  if (days === 0) return <span className="text-xs font-bold text-red-600">TODAY</span>;
  if (days <= 3) return <span className="text-xs font-bold text-red-600">{days}d left</span>;
  if (days <= 7) return <span className="text-xs font-semibold text-orange-600">{days}d left</span>;
  if (days <= 30) return <span className="text-xs text-yellow-600">{days}d left</span>;
  return <span className="text-xs text-muted-foreground">{days}d</span>;
}

function GrantRow({ grant }: { grant: GrantEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b last:border-b-0" data-testid={`grant-row-${grant.id}`}>
      <div
        className="flex items-center gap-3 p-3 hover:bg-muted/30 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${expanded ? "rotate-90" : ""}`} />
        <PriorityDot priority={grant.priority} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{grant.name}</p>
          <p className="text-[11px] text-muted-foreground">{grant.funder}</p>
        </div>
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {grant.platforms.slice(0, 2).map((p) => (
            <Badge key={p} variant="outline" className="text-[9px]">{p}</Badge>
          ))}
          {grant.platforms.length > 2 && (
            <Badge variant="outline" className="text-[9px]">+{grant.platforms.length - 2}</Badge>
          )}
        </div>
        <div className="text-right shrink-0 w-20">
          <p className="text-xs font-semibold">{grant.amount}</p>
          <DeadlineTag date={grant.deadlineDate} />
        </div>
        <StatusBadge status={grant.status} />
      </div>

      {expanded && (
        <div className="px-10 pb-4 space-y-3 bg-muted/10">
          {(grant.submitUrl || grant.url) && (
            <div className="flex gap-2 mb-1">
              {grant.submitUrl && (
                <a
                  href={grant.submitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                  data-testid={`link-submit-${grant.id}`}
                >
                  <Send className="h-3.5 w-3.5" />
                  Submit via {grant.submitPortal || "Portal"}
                </a>
              )}
              {grant.url && grant.url !== grant.submitUrl && (
                <a
                  href={grant.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium hover:bg-muted transition-colors"
                  data-testid={`link-foa-${grant.id}`}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Funding Opportunity
                </a>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="font-semibold text-muted-foreground mb-1">Details</p>
              {grant.solicitation && <p>Solicitation: {grant.solicitation}</p>}
              {grant.deadline && <p>Deadline: {grant.deadline}</p>}
              {grant.submittedDate && <p>Submitted: {grant.submittedDate}</p>}
              {grant.recurringCycle && <p>Cycle: {grant.recurringCycle}</p>}
              {grant.nextCycleDate && <p>Next Cycle: {grant.nextCycleDate}</p>}
              <p>Category: {grant.category}</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground mb-1">Platforms</p>
              <div className="flex flex-wrap gap-1">
                {grant.platforms.map((p) => (
                  <Badge key={p} variant="outline" className="text-[9px]">{p}</Badge>
                ))}
              </div>
              {grant.contactName && (
                <div className="mt-2">
                  <p className="font-semibold text-muted-foreground mb-0.5">Contact</p>
                  <p>{grant.contactName}</p>
                  {grant.contactEmail && <p className="text-muted-foreground">{grant.contactEmail}</p>}
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-muted-foreground mb-1">Documents</p>
              {grant.documents.length > 0 ? (
                <ul className="space-y-1">
                  {grant.documents.map((doc) => (
                    <li key={doc.path} className="flex items-center gap-1">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span>{doc.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground italic">No documents yet</p>
              )}
            </div>
          </div>
          <div className="text-xs">
            <p className="font-semibold text-muted-foreground mb-1">Notes</p>
            <p className="text-muted-foreground">{grant.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarView({ grants }: { grants: GrantEntry[] }) {
  const months = [
    "April 2026", "May 2026", "June 2026", "July 2026",
    "August 2026", "September 2026", "October 2026", "November 2026", "December 2026"
  ];

  const monthGrants = months.map((month) => {
    const [monthName, year] = month.split(" ");
    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
    const yearNum = parseInt(year);

    const active = grants.filter((g) => {
      if (g.deadlineDate) {
        return g.deadlineDate.getMonth() === monthIndex && g.deadlineDate.getFullYear() === yearNum;
      }
      return false;
    });

    const recurring = grants.filter((g) => {
      if (g.status === "recurring_watch" && g.nextCycleDate) {
        return g.nextCycleDate.toLowerCase().includes(monthName.toLowerCase());
      }
      return false;
    });

    return { month, active, recurring };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3" data-testid="calendar-view">
      {monthGrants.map(({ month, active, recurring }) => (
        <Card key={month} className={`p-3 ${active.length > 0 ? "border-primary/30" : ""}`}>
          <p className="text-xs font-bold mb-2">{month}</p>
          {active.length === 0 && recurring.length === 0 && (
            <p className="text-[10px] text-muted-foreground italic">No deadlines</p>
          )}
          {active.map((g) => (
            <div key={g.id} className="flex items-center gap-2 mb-1.5">
              <PriorityDot priority={g.priority} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium truncate">{g.name}</p>
                <p className="text-[9px] text-muted-foreground">{g.deadline} — {g.amount}</p>
              </div>
              <StatusBadge status={g.status} />
            </div>
          ))}
          {recurring.map((g) => (
            <div key={g.id} className="flex items-center gap-2 mb-1.5 opacity-70">
              <Bell className="h-3 w-3 text-indigo-500" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium truncate">{g.name}</p>
                <p className="text-[9px] text-muted-foreground">{g.recurringCycle}</p>
              </div>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}

function PipelineStats({ grants }: { grants: GrantEntry[] }) {
  const active = grants.filter((g) => !["archived", "rejected", "recurring_watch"].includes(g.status));
  const submitted = grants.filter((g) => ["loi_submitted", "proposal_submitted"].includes(g.status));
  const watching = grants.filter((g) => g.status === "recurring_watch");
  const totalPipeline = active.reduce((sum, g) => sum + g.amountNum, 0);

  const urgentCount = active.filter((g) => {
    const days = daysUntil(g.deadlineDate);
    return days !== null && days >= 0 && days <= 7;
  }).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3" data-testid="pipeline-stats">
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <Target className="h-4 w-4 text-primary" />
          <p className="text-[10px] font-medium text-muted-foreground">Active Grants</p>
        </div>
        <p className="text-xl font-bold">{active.length}</p>
      </Card>
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <Send className="h-4 w-4 text-green-600" />
          <p className="text-[10px] font-medium text-muted-foreground">Submitted</p>
        </div>
        <p className="text-xl font-bold">{submitted.length}</p>
      </Card>
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <p className="text-[10px] font-medium text-muted-foreground">Due This Week</p>
        </div>
        <p className="text-xl font-bold">{urgentCount}</p>
      </Card>
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="h-4 w-4 text-indigo-500" />
          <p className="text-[10px] font-medium text-muted-foreground">Watching</p>
        </div>
        <p className="text-xl font-bold">{watching.length}</p>
      </Card>
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="h-4 w-4 text-emerald-600" />
          <p className="text-[10px] font-medium text-muted-foreground">Active Pipeline</p>
        </div>
        <p className="text-xl font-bold">${(totalPipeline / 1000000).toFixed(1)}M</p>
      </Card>
    </div>
  );
}

export default function GrantCommandCenterPage() {
  const [grants] = useState<GrantEntry[]>(INITIAL_GRANTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  const allPlatforms = useMemo(() => {
    const set = new Set<string>();
    grants.forEach((g) => g.platforms.forEach((p) => set.add(p)));
    return Array.from(set).sort();
  }, [grants]);

  const filtered = useMemo(() => {
    return grants.filter((g) => {
      if (searchTerm && !g.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !g.funder.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (statusFilter !== "all" && g.status !== statusFilter) return false;
      if (categoryFilter !== "all" && g.category !== categoryFilter) return false;
      if (platformFilter !== "all" && !g.platforms.includes(platformFilter as Platform)) return false;
      return true;
    }).sort((a, b) => {
      if (a.status === "recurring_watch" && b.status !== "recurring_watch") return 1;
      if (b.status === "recurring_watch" && a.status !== "recurring_watch") return -1;
      if (!a.deadlineDate && !b.deadlineDate) return a.priority - b.priority;
      if (!a.deadlineDate) return 1;
      if (!b.deadlineDate) return -1;
      return a.deadlineDate.getTime() - b.deadlineDate.getTime();
    });
  }, [grants, searchTerm, statusFilter, categoryFilter, platformFilter]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <BarChart3 className="h-6 w-6 text-primary" />
            Grant Command Center
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Unified clearinghouse — TCAF + all ecosystem platforms
          </p>
        </div>
      </div>

      <PipelineStats grants={grants} />

      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipeline" data-testid="tab-pipeline">
            <Target className="h-3.5 w-3.5 mr-1.5" /> Pipeline
          </TabsTrigger>
          <TabsTrigger value="calendar" data-testid="tab-calendar">
            <Calendar className="h-3.5 w-3.5 mr-1.5" /> Calendar
          </TabsTrigger>
          <TabsTrigger value="watching" data-testid="tab-watching">
            <Bell className="h-3.5 w-3.5 mr-1.5" /> Recurring Watch
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-3">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search grants or funders..."
                className="pl-9 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] h-9" data-testid="select-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[130px] h-9" data-testid="select-category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="federal">Federal</SelectItem>
                <SelectItem value="state">State</SelectItem>
                <SelectItem value="foundation">Foundation</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
              </SelectContent>
            </Select>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[160px] h-9" data-testid="select-platform">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {allPlatforms.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            {filtered.filter(g => g.status !== "recurring_watch").length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No grants match your filters</p>
              </div>
            ) : (
              filtered.filter(g => g.status !== "recurring_watch").map((grant) => (
                <GrantRow key={grant.id} grant={grant} />
              ))
            )}
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <CalendarView grants={grants} />
        </TabsContent>

        <TabsContent value="watching" className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Recurring grant opportunities being monitored. These are grants with annual or rolling cycles that TCAF platforms align with.
          </p>
          <Card>
            {grants.filter(g => g.status === "recurring_watch").map((grant) => (
              <GrantRow key={grant.id} grant={grant} />
            ))}
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Platform-to-Grant Coverage Map
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b">
                <th className="text-left p-1.5 font-semibold">Platform</th>
                <th className="text-center p-1.5 font-semibold">Active</th>
                <th className="text-center p-1.5 font-semibold">Watching</th>
                <th className="text-center p-1.5 font-semibold">Total $</th>
                <th className="text-left p-1.5 font-semibold">Top Funders</th>
              </tr>
            </thead>
            <tbody>
              {allPlatforms.map((platform) => {
                const platformGrants = grants.filter((g) => g.platforms.includes(platform as Platform));
                const active = platformGrants.filter((g) => !["archived", "rejected", "recurring_watch"].includes(g.status));
                const watching = platformGrants.filter((g) => g.status === "recurring_watch");
                const totalAmt = platformGrants.reduce((s, g) => s + g.amountNum, 0);
                const funders = [...new Set(platformGrants.map((g) => g.funder))].slice(0, 3);

                return (
                  <tr key={platform} className="border-b last:border-b-0 hover:bg-muted/20">
                    <td className="p-1.5 font-medium">{platform}</td>
                    <td className="p-1.5 text-center">{active.length}</td>
                    <td className="p-1.5 text-center">{watching.length}</td>
                    <td className="p-1.5 text-center">${(totalAmt / 1000).toFixed(0)}K</td>
                    <td className="p-1.5 text-muted-foreground truncate max-w-[200px]">{funders.join(", ")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
