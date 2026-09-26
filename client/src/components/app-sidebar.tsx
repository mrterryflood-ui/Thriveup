import { useState, useMemo, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Home, BookOpen, Award, Brain, Star, GraduationCap,
  Shield, ShieldCheck, ShieldPlus, Swords, Medal, Heart, Sparkles,
  Users, Globe, FileText, LogIn, LogOut, Flame, BarChart3, School, ScrollText, Wand2, Smartphone, Puzzle,
  Rocket, User, TrendingUp, Wallet, Building2, Trophy, Flag, Target, ShoppingBag,
  Zap, CalendarCheck, Lightbulb, Gamepad2, Map, Store, Briefcase, Route,
  Activity, ClipboardCheck, Handshake, ChevronRight, DollarSign, ArrowRightLeft,
  PenLine, Megaphone, Calendar, HelpCircle, ClipboardList, Printer, Link2,
  MessageCircle, MapPin, Presentation, Scale, FileBarChart, LayoutDashboard,
  Info, BookMarked,
  Mail, Landmark, RefreshCw, Package, PenTool,
  Microscope, Stethoscope, Film, HandHeart, Search, Wrench,
  Compass, Baby, Layers, Sprout, Bug, FlaskConical, Droplets, HeartHandshake, Mic, Building, Wheat,
  Wifi, AlertTriangle, FolderLock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import thriveupLogo from "../assets/thriveup-logo.png";
import { getRankForLevel } from "@/lib/curriculum-data";
import { useAuth } from "@/hooks/use-auth";
import { OrgSwitcher } from "@/components/org-switcher";
import { useCurrentOrgId } from "@/hooks/use-current-org";
import { clearCurrentOrgSelection } from "@/hooks/use-current-org";
import type { StudentProgress, AcademyAvatar } from "@shared/schema";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  authOnly?: boolean;
  adminOnly?: boolean;
  staffOnly?: boolean;
}

const SIDEBAR_DESCRIPTIONS: Record<string, string> = {
  "Equity Loss Engine": "Calculates the economic cost of inaction in a ZIP code across Census vintages. Use it to understand disparities and support funding requests.",
  "SDOH Impact Chain": "Maps how social conditions connect to health, education, and economic outcomes. Use it to see where an intervention can break a cycle.",
  "Policy Signal Engine": "Turns policy and community data into signals that help partners understand risks, opportunities, and timing.",
  "RPLICE Toolkit": "Guides research-to-practice work using CFIR, RE-AIM, and EPIS. Use it to plan implementation and measure whether a program is working.",
  "MAP-GAP Framework": "A structured method for mapping needs, analyzing gaps, and choosing accountable next steps with community partners.",
  "HerHealth Matters": "Women's health education, prevention, navigation, and provider connections.",
  "Maternal Health Network": "Prenatal, postpartum, doula, and maternal mental-health navigation.",
  "MaleHealth Matters": "Men's health education, prevention, screening navigation, and peer connection.",
  "RPLICE Research Hub": "Research-to-practice tools for evidence review, implementation planning, and evaluation.",
  "Austin EBI Planning": "Private staff workspace for documenting Austin's evidence-based intervention, local adaptations, fidelity controls, evaluation contract, and approval blockers.",
};

function SidebarInfo({ title }: { title: string }) {
  const description = SIDEBAR_DESCRIPTIONS[title];
  if (!description) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
           className="h-11 w-11 shrink-0 rounded-full text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          aria-label={`About ${title}`}
          data-testid={`button-sidebar-info-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
        >
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs text-xs leading-relaxed">
        {description}
      </TooltipContent>
    </Tooltip>
  );
}

// =========================================================================
// IA v2 (2026-05-23) — 7 hubs.
// Audit found 207 sidebar items across 28 groups (26 rendered simultaneously),
// with duplicates (My Pathway in 2 places, mentors in 3, grants split across 4
// groups) and 3 "teaching*" arrays defined but never rendered. This rewrite
// collapses everything to 7 always-visible hubs + My Organization (auth) +
// Admin (admin-only, sub-sectioned). Every existing URL is preserved; only
// the grouping changes. Items marked authOnly:true are hidden when signed out.
// =========================================================================

// QUICK TASKS — plain-language "what did you come here to do?" links.
// Rendered at the very top of the sidebar, always expanded, so the five
// biggest public tools are one click away from anywhere.
const quickTaskItems: NavItem[] = [
  { title: "Apply for benefits", url: "/benefits-screener", icon: ClipboardList },
  { title: "Find help near me", url: "/get-help", icon: HandHeart },
  { title: "Talk to someone (AI Navigator)", url: "/navigator", icon: MessageCircle },
  { title: "Health & wellness", url: "/health-wellness", icon: Activity },
  { title: "Learn new skills", url: "/curriculum", icon: GraduationCap },
];

// HUB 1 — Get Funded: everything grant-pursuit related.
const getFundedItems: NavItem[] = [
  { title: "This Week (Monday Brief)", url: "/this-week", icon: Calendar },
  { title: "Live Grant Opportunities", url: "/grants", icon: Target, authOnly: true, adminOnly: true },
  { title: "My Grants & Win Rate", url: "/my-grants", icon: Trophy, authOnly: true, adminOnly: true },
  { title: "Application Tracker", url: "/grants/applications", icon: ClipboardCheck, authOnly: true, adminOnly: true },
  { title: "Community Story Pack", url: "/community-story-pack", icon: Globe },
  { title: "Embed Portal on Your Website", url: "/widget-install", icon: Smartphone },
  { title: "Agency Connector", url: "/agency-connector", icon: Puzzle },
  { title: "Partner Dashboard", url: "/partner-dashboard", icon: LayoutDashboard },
  { title: "For Nonprofits", url: "/for-nonprofits", icon: Handshake },
  { title: "For Other Agencies (Platform Funding)", url: "/for-agencies", icon: Building2 },
  { title: "Grant Intelligence Package", url: "/grant-conduit", icon: Sparkles },
  { title: "RFP Fidelity Engine", url: "/rfp-fidelity", icon: ShieldCheck, authOnly: true, adminOnly: true },
  { title: "RFP / Narrative Writer", url: "/grant-narrative", icon: FileText, authOnly: true, adminOnly: true },
  { title: "LOI Writer", url: "/loi-writer", icon: PenLine, authOnly: true, adminOnly: true },
  { title: "Grant Packages", url: "/grant-packages", icon: Package, authOnly: true, adminOnly: true },
  { title: "Winning Proposals Library", url: "/won-proposals", icon: Trophy, authOnly: true, adminOnly: true },
  { title: "Teaming Network & Capabilities", url: "/teaming-network", icon: Users, authOnly: true, adminOnly: true },
  { title: "Prior Award Research", url: "/grant-prior-awards", icon: Search, authOnly: true, adminOnly: true },
  { title: "Logic Model", url: "/logic-model", icon: Route, authOnly: true },
  { title: "Staffing Plan", url: "/staffing-plan", icon: Briefcase, authOnly: true },
  { title: "Stakeholder Deck", url: "/presentations", icon: Presentation, authOnly: true },
  { title: "E-Sign Center", url: "/esign", icon: PenTool, authOnly: true },
  { title: "TX Contractor Opportunities", url: "/contractor-opportunities", icon: Briefcase },
  { title: "Grants 101 — How It Works", url: "/grants-101", icon: GraduationCap },
  { title: "APEX Accelerators", url: "/apex-accelerators", icon: Landmark, authOnly: true, adminOnly: true },
  { title: "Sedgwick Vitality (RFP 26-0028)", url: "/grants/sedgwick-vitality", icon: FileBarChart, authOnly: true, adminOnly: true },
  { title: "Healthcare Grants Catalog", url: "/healthcare-grants", icon: Stethoscope, authOnly: true, adminOnly: true },
  { title: "CEDS Regional Alignment", url: "/ceds", icon: Map },
];

// HUB 2a — Benefits & Intake: the public front door for any person seeking help.
// Resident Journey (demo) lives here — primary entry point for the Marcus story
// and for anyone starting their own personal journey.
const servePeopleItems: NavItem[] = [
  { title: "Get Help Now (Quick Start)", url: "/get-help", icon: HandHeart },
  { title: "Resource Finder", url: "/resources", icon: MapPin },
  { title: "9-Benefit Screener", url: "/benefits-screener", icon: ClipboardList },
  { title: "Benefits Command Center", url: "/benefits", icon: HandHeart },
  { title: "What's Happening in Your County", url: "/resident-equity", icon: Users },
  { title: "Intake Wizard", url: "/intake", icon: ClipboardCheck },
  { title: "Resident Journey (demo)", url: "/resident-journey", icon: Route },
  { title: "Resource Directory", url: "/resource-directory", icon: HandHeart },
  { title: "My Journey", url: "/my-journey", icon: Rocket, authOnly: true },
  { title: "My Appointments", url: "/my-appointments", icon: CalendarCheck, authOnly: true },
  { title: "My Document Vault", url: "/my-documents", icon: FolderLock, authOnly: true },
  { title: "My Household", url: "/my-household", icon: Home, authOnly: true },
  { title: "Learning Preferences", url: "/learner-settings", icon: BookOpen, authOnly: true },
  { title: "Service Delivery", url: "/services", icon: Activity, authOnly: true },
  { title: "Cohort Onboarding", url: "/cohort-onboarding", icon: Users, authOnly: true },
  { title: "Case Manager View", url: "/case-manager", icon: Shield, authOnly: true },
];

// HUB 2b — Foster Youth: dedicated hub for youth aging out of care.
const fosterYouthItems: NavItem[] = [
  { title: "Foster Youth Hub", url: "/foster-youth", icon: HandHeart },
  { title: "Aging-Out Toolkit", url: "/foster-youth/toolkit", icon: ClipboardCheck },
  { title: "Foster Transition Plan", url: "/foster-youth/transition-plan", icon: Route },
  { title: "Wellbeing Check-in", url: "/foster-youth/wellbeing", icon: Heart },
  { title: "My Rights (Foster)", url: "/foster-youth/rights", icon: Scale },
  { title: "State Benefits (50 states)", url: "/foster-youth/benefits", icon: Landmark },
  { title: "FAFSA & ETV (foster)", url: "/fafsa-navigator?audience=foster", icon: GraduationCap },
  { title: "AI-assisted Intake (Foster)", url: "/foster-youth/intake", icon: Sparkles },
  { title: "State-Agency Portal", url: "/foster-youth/state-portal", icon: Building2, authOnly: true },
  { title: "Policy Comparison (50 states)", url: "/foster-youth/policy-comparison", icon: Scale },
  { title: "Youth Voice (YHSI)", url: "/youth-voice", icon: Megaphone },
  { title: "Know Your Rights", url: "/youth-rights", icon: ClipboardList },
  { title: "YHSI Operations", url: "/yhsi-ops", icon: ClipboardList, authOnly: true, adminOnly: true },
  { title: "YHSI System Improvement", url: "/yhsi-system", icon: ClipboardList, authOnly: true },
];

// HUB 2c — Justice & Reentry: reentry, probation/parole, justice system navigation.
const justiceReentryItems: NavItem[] = [
  { title: "Safe Passage (Reentry Toolkit)", url: "/safe-passage", icon: Route },
  { title: "Reentry Intake", url: "/reentry/intake", icon: ClipboardCheck },
  { title: "Streets Program", url: "/streets", icon: Route },
  { title: "Reentry Program", url: "/reentry-program", icon: Scale },
  { title: "Reentry Standards", url: "/reentry/standards", icon: Scale },
  { title: "Justice Partners", url: "/justice-partners", icon: Handshake },
  { title: "Fair-Chance Employers", url: "/jobs", icon: Trophy },
  { title: "Housing Court FOIA Tracker", url: "/foia-tracker", icon: FileText, authOnly: true },
  { title: "Partner Effectiveness Scorecard", url: "/partner-scorecard", icon: BarChart3, authOnly: true },
  { title: "Reentry Dashboard", url: "/reentry", icon: Scale, authOnly: true },
  { title: "TX Reentry Stipend Pilot", url: "/reentry-stipend-pilot", icon: Landmark, authOnly: true },
  { title: "Reentry Strategic Plan", url: "/reentry/strategic-plan", icon: Scale, authOnly: true },
  { title: "Reentry Outcome Reports", url: "/reentry/outcome-reports", icon: FileBarChart, authOnly: true },
  { title: "Justice Command Center", url: "/justice-command-center", icon: Shield, authOnly: true },
];

// HUB 2d — Prevention & Health: behavioral health, prevention, veterans, CHW.
const preventionHealthItems: NavItem[] = [
  { title: "Gun Violence Intelligence", url: "/gun-violence", icon: Shield },
  { title: "Virus & Outbreak Trends", url: "/virus-trends", icon: Activity },
  { title: "Veterans Program", url: "/veterans", icon: Shield },
  { title: "Behavioral Health Program", url: "/behavioral-health", icon: Heart },
  { title: "Prevention Hub", url: "/prevention", icon: ShieldCheck },
  { title: "Parent Education", url: "/parent-education", icon: Heart },
  { title: "Health & Wellness Hub", url: "/health-wellness", icon: Activity },
  { title: "Facilitator Hub", url: "/facilitator-hub", icon: ClipboardCheck, authOnly: true },
  { title: "Health Network", url: "/health-network", icon: Heart, authOnly: true },
  { title: "CHW Dashboard", url: "/chw-dashboard", icon: Stethoscope, authOnly: true },
  { title: "Member Health Engagement", url: "/member-health", icon: ClipboardList, authOnly: true },
];

// HUB 3 — Workforce & Trades: Trade Sims is #1 (most discoverable entry point).
// My Pathway lives here only. Mentor entries consolidated to 1 (Mentors & Pathways).
const workforceTradesItems: NavItem[] = [
  // Journey order (2026): coordinated retraining pathway leads the hub —
  // Explore (hub) → Train (Trade Sims) → Prove it (certificates) → Next step.
  { title: "Workforce Pathways", url: "/workforce", icon: Compass },
  { title: "Workforce Readiness", url: "/workforce-readiness", icon: ClipboardCheck },
  { title: "Resume Builder", url: "/resume-builder", icon: FileText },
  { title: "Trade Sims (Try Free →)", url: "/academy/trade-sims", icon: Wrench },
  { title: "My Certificates", url: "/certificates", icon: ScrollText, authOnly: true },
  { title: "Career Explorer", url: "/academy/careers", icon: Briefcase },
  { title: "My Pathway", url: "/academy/pathway", icon: Route },
  { title: "Apprenticeship Tracker", url: "/apprenticeship-tracker", icon: Wrench },
  { title: "Mentors & Pathways", url: "/mentorship-directory", icon: Handshake },
  { title: "Employer Connections", url: "/workforce-employers", icon: Building2 },
  { title: "Shadow Worker Hub", url: "/shadow-worker-hub", icon: Heart },
  { title: "Transition Plans", url: "/transition-plans", icon: GraduationCap },
  { title: "Dream Design", url: "/academy/dreams", icon: Target },
  { title: "Life Lessons", url: "/academy/lessons", icon: Lightbulb },
  { title: "MOS Translator", url: "/mos-translator", icon: Shield },
  { title: "Workforce Pell Grant", url: "/workforce-pell", icon: DollarSign },
  { title: "WIOA Outcomes", url: "/wioa-outcomes", icon: BarChart3, authOnly: true, adminOnly: true },
  { title: "Workforce Dashboard", url: "/workforce-dashboard", icon: BarChart3, authOnly: true, adminOnly: true },
  { title: "Workforce Assessment", url: "/workforce-assessment", icon: ClipboardCheck },
  { title: "Workforce Training", url: "/workforce-training", icon: GraduationCap },
];

// HUB 4 — Academy & Learning: student portal, campus life, AI tools,
// curriculum, build & create — all under one roof.
const academyLearningItems: NavItem[] = [
  { title: "Panther Village", url: "/academy", icon: Rocket },
  { title: "My Avatar", url: "/academy/avatar", icon: User, authOnly: true },
  { title: "Panther Power", url: "/academy/power", icon: Zap, authOnly: true },
  { title: "Daily Check-In", url: "/academy/self-assessment", icon: ClipboardCheck, authOnly: true },
  { title: "Thrive Dashboard", url: "/academy/thrive", icon: Activity, authOnly: true },
  { title: "Daily Quests", url: "/academy/quests", icon: CalendarCheck, authOnly: true },
  { title: "My Journal", url: "/academy/journal", icon: PenLine, authOnly: true },
  { title: "Progress Report", url: "/academy/progress-report", icon: Printer, authOnly: true },
  { title: "STAAR Test Prep", url: "/academy/staar-prep", icon: GraduationCap },
  { title: "Concepts", url: "/concepts", icon: Sparkles },
  { title: "Subjects", url: "/subjects", icon: GraduationCap },
  { title: "Achievements", url: "/achievements", icon: Award, authOnly: true },
  { title: "Certificates", url: "/certificates", icon: ScrollText, authOnly: true },
  { title: "AI Curriculum (Youth)", url: "/curriculum", icon: Brain },
  { title: "Game Room", url: "/academy/games", icon: Gamepad2 },
  { title: "Competitions", url: "/academy/competitions", icon: Trophy },
  { title: "House Points", url: "/academy/houses", icon: Flag, authOnly: true },
  { title: "Adventures", url: "/academy/scenarios", icon: Map },
  { title: "Marketplace", url: "/academy/marketplace", icon: Store },
  { title: "Stock Market", url: "/academy/stocks", icon: TrendingUp },
  { title: "My Wallet", url: "/academy/wallet", icon: Wallet, authOnly: true },
  { title: "Financial Literacy", url: "/academy/financial-literacy", icon: DollarSign },
  { title: "FAFSA Navigator", url: "/fafsa-navigator", icon: GraduationCap },
  { title: "Calendar", url: "/academy/calendar", icon: Calendar },
  { title: "Announcements", url: "/academy/announcements", icon: Megaphone },
  { title: "Help & FAQ", url: "/academy/help", icon: HelpCircle },
  { title: "Build Campus", url: "/academy/campus", icon: Building2, authOnly: true },
  { title: "Print Shop", url: "/academy/merch", icon: ShoppingBag, authOnly: true },
  { title: "AI Workforce Academy", url: "/ai-workforce", icon: GraduationCap },
  { title: "AI Creation Studio", url: "/ai-tools", icon: Wand2 },
  { title: "Sparky (AI Companion)", url: "/sparky", icon: MessageCircle },
  { title: "Navigator (AI)", url: "/navigator", icon: Compass },
];

// HUB 5 — Partners & Coalitions: every coalition / community / ecosystem
// surface. The "who are we working with" door.
const partnersCoalitionsItems: NavItem[] = [
  { title: "Join as a Partner", url: "/partners/join", icon: Handshake },
  { title: "API Documentation", url: "/api-docs", icon: Globe },
  { title: "Coalition Portal", url: "/coalition-portal", icon: Handshake },
  { title: "Engagement Hub", url: "/engagement-hub", icon: Activity },
  { title: "ALIGN — Connect. Grow. Serve. Thrive.", url: "/align", icon: Sparkles },
  { title: "Why ThriveUp? (Stakeholder Q&A)", url: "/why-thriveup", icon: FileText },
  { title: "My ALIGN Journey", url: "/align/my-journey", icon: Route },
  { title: "Org ALIGN Assessment", url: "/align/org-assessment", icon: Building2 },
  { title: "Community Overview", url: "/align/community", icon: Globe },
  { title: "THRIVE — Empower. Activate. Grow.", url: "/thrive", icon: Star },
  { title: "My Initiatives", url: "/initiatives", icon: Lightbulb },
  { title: "Community Partners", url: "/partners", icon: Handshake },
  { title: "Coalition Dashboard", url: "/coalition", icon: Users },
  { title: "Collaboration Hub", url: "/collaboration-hub", icon: Building2, authOnly: true },
  { title: "Vann Partner Hub", url: "/partners/vann-hub", icon: Handshake, authOnly: true },
  { title: "Family & Program Tracker", url: "/partners/family-program-tracker", icon: Users, authOnly: true },
  { title: "RFP-Match Storyteller", url: "/partners/rfp-storyteller", icon: Sparkles, authOnly: true },
  { title: "Ecosystem Hub", url: "/ecosystem", icon: Globe },
  { title: "Ecosystem Story", url: "/ecosystem-story", icon: BookMarked },
  { title: "Ecosystem Orchestration", url: "/ecosystem-orchestration", icon: Activity, authOnly: true },
  { title: "Ecosystem AI", url: "/ecosystem-ai", icon: Brain, authOnly: true },
  { title: "Civic Signal", url: "/civic-signal", icon: Activity },
  { title: "Advisory Board", url: "/advisory-board", icon: Users },
  { title: "Community", url: "/community", icon: Globe },
  { title: "Community Voice", url: "/voice", icon: MessageCircle },
  { title: "Open Innovation Lab", url: "/open-innovation-lab", icon: Microscope },
  { title: "Embed Our Tools", url: "/for-partners", icon: Globe },
];

// Connected sites are intentionally kept in one discoverable directory rather
// than competing with the homepage's focused featured pathways.
const connectedSiteItems: NavItem[] = [
  { title: "ThriveUp / TCAF", url: "/ecosystem", icon: Layers },
  { title: "Whole-Person Health", url: "https://mentalwellnesssupport.net", icon: Heart },
  { title: "HerHealth Matters", url: "https://herhealthmatters2.com", icon: Stethoscope },
  { title: "Maternal Health Network", url: "https://herhealthmatters2.com", icon: Baby },
  { title: "MaleHealth Matters", url: "https://malehealthmatters2.com", icon: User },
  { title: "Mission Transition", url: "https://vetmissiontransition.com", icon: Shield },
  { title: "LifeBridge", url: "https://lifetransitionsaid.org", icon: Compass },
  { title: "Talk Your Talk", url: "https://talkyourtalk.net", icon: MessageCircle },
  { title: "WholeMind Learning", url: "https://wholemindlearning.com", icon: BookOpen },
  { title: "Perfectly Different", url: "https://neurodifferentassistant.app", icon: Brain },
  { title: "SafeReport", url: "https://safereports.net", icon: FileText },
  { title: "SafeCogniCare", url: "https://safecognicare.com", icon: Activity },
  { title: "Integrated Supports for Thriving Youth", url: "https://implementationineducatio.com", icon: GraduationCap },
  { title: "Minority Center of Excellence", url: "https://minoritycenterofexcellence.com", icon: Briefcase },
  { title: "RPLICE Research Hub", url: "https://www.bettersciencelab.com", icon: Microscope },
];

// HUB 6 — Where We Operate: national coverage, transparency, neighborhood
// intel, impact dashboards. CTX-specific items live in the CTX hub above.
const whereWeOperateItems: NavItem[] = [
  { title: "Equity Loss Engine", url: "/equity-loss", icon: BarChart3 },
  { title: "Nationwide Equity-Loss Browse", url: "/equity-loss/national", icon: BarChart3 },
  { title: "Implementation & Evaluation", url: "/corridor-intelligence", icon: Route },
  { title: "Coverage Map", url: "/coverage", icon: Map },
  { title: "Bring TCAF to Your State", url: "/coverage#request", icon: HandHeart },
  { title: "Live Network View", url: "/network", icon: BarChart3 },
  { title: "Texas Assessment", url: "/texas-assessment", icon: Map, authOnly: true },
  { title: "Third Spaces", url: "/third-spaces", icon: Building2 },
  { title: "Neighborhood Intel", url: "/neighborhood", icon: MapPin },
  { title: "Community 411", url: "/411", icon: Globe },
  { title: "Visual Intelligence", url: "/community-analysis", icon: FlaskConical },
  { title: "Opportunity Youth", url: "/opportunity-youth", icon: Users },
  { title: "Transparency Dashboard", url: "/transparency", icon: Activity },
  { title: "Impact Dashboard", url: "/impact", icon: TrendingUp },
  { title: "Platform Metrics", url: "/platform-metrics", icon: BarChart3, authOnly: true },
  { title: "Pilot Dashboard", url: "/pilot", icon: Users, authOnly: true },
  { title: "Dosage Report", url: "/dosage", icon: Activity, authOnly: true },
  { title: "Outcome Reporting", url: "/outcomes", icon: FileBarChart, authOnly: true },
  { title: "SDOH Impact Chain", url: "/sdoh-chain", icon: Link2 },
  { title: "Equity Dashboard", url: "/equity-dashboard", icon: BarChart3 },
  { title: "Policy Signal Engine", url: "/policy-engine", icon: BarChart3 },
  { title: "City Comparison", url: "/city-comparison", icon: Scale },
  { title: "Data Sources", url: "/data-sources", icon: LayoutDashboard, authOnly: true },
];

// HUB 7 — About & Trust: the public-facing storefront a funder, partner,
// or community member should be able to scan in under a minute. Research /
// methodology lives here because it's part of "why we're credible."
const aboutTrustItems: NavItem[] = [
  { title: "About / Our Structure", url: "/about", icon: Info },
  { title: "Donors", url: "/donors", icon: HandHeart },
  { title: "Public Standards", url: "/standards/public", icon: ClipboardCheck },
  { title: "Pricing & Services", url: "/pricing", icon: DollarSign },
  { title: "AI Consulting", url: "/ai-consulting", icon: Brain },
  { title: "Methodology", url: "/methodology", icon: Microscope },
  { title: "Research Hub", url: "/research-hub", icon: Microscope },
  { title: "MAP-GAP Framework", url: "/mapgap-framework", icon: RefreshCw },
  { title: "RPLICE Toolkit", url: "/rplice-tools", icon: Microscope },
  { title: "Case Studies", url: "/case-studies", icon: BookOpen },
  { title: "Peer Review", url: "/peer-review", icon: Users },
  { title: "Implementation Plan", url: "/implementation", icon: ClipboardList },
  { title: "Contact Us", url: "/contact", icon: Mail },
  { title: "Community Data Council", url: "/data-council", icon: Users },
  { title: "Non-Discrimination", url: "/non-discrimination", icon: Shield },
  { title: "Privacy Policy", url: "/privacy", icon: Shield },
];

// HUB 9 — Child Care & Workforce: subsidized child care system, TRS quality, workforce connection.
const hubChildCareWorkforce: NavItem[] = [
  { title: "Child Care Overview", url: "/child-care", icon: Baby },
  { title: "National Supply & Economic Context", url: "/child-care/national", icon: Globe },
  { title: "Williamson County Initiative", url: "/child-care-wilco", icon: MapPin },
  { title: "North Texas Region", url: "/child-care-north-texas", icon: BarChart3 },
  { title: "Workforce Connection & Policy", url: "/child-care-workforce", icon: TrendingUp },
];

// HUB 8 — Rural & Agriculture: USDA NIFA Open Data Framework suite.
const hubRuralAg: NavItem[] = [
  { title: "County Ag Intelligence", url: "/rural-intel", icon: Wheat },
  { title: "Farm Cooperative Builder", url: "/farm-cooperative", icon: Users },
  { title: "Farm Profitability Navigator", url: "/farm-profitability", icon: DollarSign },
  { title: "Invasive Species Watch", url: "/invasive-species", icon: Bug },
  { title: "FSA / NRCS Eligibility", url: "/fsa-eligibility", icon: Building },
  { title: "Ag Trade Simulations", url: "/ag-trade-sims", icon: FlaskConical },
  { title: "Farmworker ITI", url: "/farmworker-iti", icon: HeartHandshake },
  { title: "Producer Voice", url: "/producer-voice", icon: Mic },
  { title: "Rural Situational Intel", url: "/rural-alerts", icon: AlertTriangle },
  { title: "Rural Healthcare Hub", url: "/rural-health", icon: Stethoscope },
  { title: "Rural Connectivity", url: "/rural-connectivity", icon: Wifi },
  { title: "Rural Housing Hub", url: "/rural-housing", icon: Home },
  { title: "Rural Workforce Pipeline", url: "/rural-workforce", icon: GraduationCap },
];

// HUB CTX — Central Texas: geographic front door for the 5-county CTX pilot.
// Consolidates all CTX-specific navigation — CTX Benefits Initiative (renamed from
// St. David's WAB2 after WAB2 grant declined 2026-05-15), community hubs, N. Wilco
// childcare Voice project, and regional briefing into one door.
const ctxHubItems: NavItem[] = [
  { title: "CTX Benefits Initiative", url: "/st-davids", icon: LayoutDashboard },
  { title: "WAB2 Enrollment", url: "/wab2-enrollment", icon: LayoutDashboard },
  { title: "SNAP Navigator", url: "/benefits-screener", icon: ClipboardList },
  { title: "Benefits Navigator", url: "/benefits", icon: HandHeart },
  { title: "N. Wilco Childcare Coalition", url: "/north-wilco-childcare-coalition", icon: Baby },
  { title: "Our Approach", url: "/our-approach", icon: Layers },
  { title: "N. Wilco Childcare Voice", url: "/voice/north-wilco-childcare-gaps", icon: MessageCircle },
  { title: "Regional Briefing", url: "/regional-briefing", icon: Sparkles, authOnly: true, adminOnly: true },
  { title: "Austin Initiative", url: "/austin", icon: MapPin },
  { title: "Austin EBI Planning", url: "/austin-community-bridge/readiness", icon: ShieldCheck, authOnly: true, staffOnly: true },
  { title: "Manor Hub", url: "/manor", icon: MapPin },
  { title: "Pflugerville Hub", url: "/pflugerville", icon: MapPin },
  { title: "Voices of Austin", url: "/voices-of-austin", icon: Megaphone },
  { title: "CTX Operator Workspace", url: "/st-davids-wab2", icon: Wrench, authOnly: true },
  { title: "CTX Benefits Initiative Prep", url: "/stdavids-prep", icon: FileText, authOnly: true },
];

// AUTH-ONLY — My Organization. Hoisted out of grant tools so partners
// don't scroll past 30+ items to find their own org profile.
const myOrgItems: NavItem[] = [
  { title: "Organization Dashboard", url: "/partner-portal", icon: LayoutDashboard },
  { title: "Organization Profile", url: "/settings/organization", icon: Building2 },
  { title: "Community Events & Impact", url: "/organization/events", icon: CalendarCheck },
  { title: "Document Library", url: "/settings/documents", icon: FileText },
];

// ADMIN-ONLY — sub-sectioned under one Admin parent so it doesn't pollute
// the main 7-hub navigation. Each inner array is a distinct admin domain.
const adminOperationsItems: NavItem[] = [
  { title: "Ops Center", url: "/ops-center", icon: Activity },
  { title: "Funder Impact Dashboard", url: "/funder-dashboard", icon: DollarSign },
  { title: "Business Plan", url: "/business-plan", icon: Briefcase },
  { title: "Business Documents", url: "/business-documents", icon: FileText },
  { title: "Business Card", url: "/business-card", icon: User },
  { title: "Directive Compliance", url: "/directive-compliance", icon: ClipboardCheck },
  { title: "Trade Sims Signups", url: "/admin/trade-sims-signups", icon: Users, authOnly: true, adminOnly: true },
  { title: "ChildCORE Integration", url: "/childcore-integration", icon: ArrowRightLeft, authOnly: true, adminOnly: true },
];

const adminProgramItems: NavItem[] = [
  { title: "Program Engine", url: "/program-engine", icon: Zap },
  { title: "Program Designer", url: "/program-designer", icon: Target },
  { title: "Program Management", url: "/program-management", icon: Briefcase },
  { title: "Program Lifecycle", url: "/program-lifecycle", icon: RefreshCw },
  { title: "PM Academy", url: "/pm-academy", icon: GraduationCap },
  { title: "MCE Contracts", url: "/mce-contracts", icon: Building2 },
  { title: "SDVOSB Tracker", url: "/sdvosb-tracker", icon: Shield },
  { title: "Proposal Command", url: "/proposal-command", icon: Zap },
  { title: "Consortium Proposals", url: "/consortium-proposals", icon: Users },
];

const adminInternalItems: NavItem[] = [
  { title: "Prompt-to-Publish Studio", url: "/admin/studio", icon: Sparkles },
  { title: "Transparency Matrix", url: "/transparency-matrix", icon: ClipboardCheck },
  { title: "Stakeholder Engagement Map", url: "/stakeholder-map", icon: Users },
  { title: "MAP-GAP CQI", url: "/cqi", icon: Target },
  { title: "Cohort Analytics (Foster)", url: "/foster-youth/cohort-analytics", icon: BarChart3 },
  { title: "Prevention Strategies", url: "/prevention-strategies", icon: ShieldCheck },
  { title: "Roku & CTV Ads", url: "/roku-ads", icon: Smartphone },
  { title: "Video Pipeline", url: "/video-pipeline", icon: Film },
];

const adminAcademyItems: NavItem[] = [
  { title: "Admin Dashboard", url: "/academy/admin", icon: BarChart3 },
  { title: "Longitudinal Dashboard", url: "/academy/longitudinal", icon: BarChart3 },
  { title: "Risk Monitor", url: "/academy/risk-monitor", icon: Shield },
  { title: "Student Wizards", url: "/academy/student-wizard", icon: Wand2 },
  { title: "Arthur's Journey", url: "/academy/tutorial", icon: GraduationCap },
  { title: "Admin Guide", url: "/academy/admin-tutorial", icon: BookOpen },
];

const adminTeachingItems: NavItem[] = [
  { title: "Classrooms", url: "/classrooms", icon: School },
  { title: "Classroom Wizard", url: "/classrooms/wizard", icon: Wand2 },
  { title: "Teacher Dashboard", url: "/teacher-dashboard", icon: BarChart3 },
  { title: "Attendance", url: "/academy/attendance", icon: ClipboardList },
  { title: "Support Portal", url: "/academy/integration", icon: Link2 },
  { title: "Parent Dashboard", url: "/parents", icon: Users },
  { title: "Curriculum Docs", url: "/curriculum-documents", icon: FileText },
  { title: "Social Media Literacy", url: "/social-media-literacy", icon: Smartphone },
];

// The sidebar is the source of truth for destination visibility. The command
// palette consumes this registry too, so adding or tightening a sidebar gate
// cannot silently expose the same destination through search.
const SIDEBAR_NAV_ITEMS: NavItem[] = [
  ...quickTaskItems,
  ...getFundedItems,
  ...servePeopleItems,
  ...fosterYouthItems,
  ...justiceReentryItems,
  ...preventionHealthItems,
  ...workforceTradesItems,
  ...academyLearningItems,
  ...partnersCoalitionsItems,
  ...connectedSiteItems,
  ...whereWeOperateItems,
  ...aboutTrustItems,
  ...hubChildCareWorkforce,
  ...hubRuralAg,
  ...ctxHubItems,
  ...myOrgItems.map((item) => ({ ...item, authOnly: true })),
  ...adminOperationsItems.map((item) => ({ ...item, adminOnly: true, authOnly: true })),
  ...adminProgramItems.map((item) => ({ ...item, adminOnly: true, authOnly: true })),
  ...adminInternalItems.map((item) => ({ ...item, adminOnly: true, authOnly: true })),
  ...adminAcademyItems.map((item) => ({ ...item, adminOnly: true, authOnly: true })),
  ...adminTeachingItems.map((item) => ({ ...item, adminOnly: true, authOnly: true })),
];

export function getSidebarNavigationAccess(url: string): Pick<NavItem, "authOnly" | "adminOnly" | "staffOnly"> & { matched: boolean } {
  const path = url.split("?")[0];
  const match = SIDEBAR_NAV_ITEMS
    .filter((item) => {
      const itemPath = item.url.split("?")[0];
      return path === itemPath || path.startsWith(`${itemPath}/`);
    })
    .sort((a, b) => b.url.length - a.url.length)[0];
  return {
    authOnly: match?.authOnly,
    adminOnly: match?.adminOnly,
    staffOnly: match?.staffOnly,
    matched: Boolean(match),
  };
}

const rankIcons: Record<string, typeof Shield> = {
  Shield, ShieldCheck, ShieldPlus, Swords, Medal,
};

function isItemActive(location: string, url: string): boolean {
  const locationPath = location.split("?")[0];
  const urlPath = url.split("?")[0];
  if (location === url) return true;
  if (locationPath === urlPath && !url.includes("?")) return true;
  if (url === "/subjects" && (locationPath === "/subjects" || locationPath.startsWith("/subjects/"))) return true;
  if (url === "/curriculum" && locationPath.startsWith("/curriculum/")) return true;
  if (url === "/curriculum-documents" && locationPath.startsWith("/curriculum-documents/")) return true;
  if (url === "/classrooms" && locationPath.startsWith("/classrooms/")) return true;
  if (url === "/certificates" && locationPath.startsWith("/certificates/")) return true;
  if (url === "/implementation" && (locationPath === "/implementation" || locationPath.startsWith("/implementation/"))) return true;
  if (url === "/foster-youth" && locationPath.startsWith("/foster-youth/")) return true;
  if (url === "/reentry" && locationPath.startsWith("/reentry/")) return true;
  if (urlPath !== "/parents" && urlPath !== "/academy" && !url.includes("?") && locationPath.startsWith(urlPath + "/")) return true;
  return false;
}

function filterAuth(items: NavItem[], isAuthenticated: boolean, isAdmin: boolean, isStaff = false): NavItem[] {
  return items.filter((i) => {
    const access = getSidebarNavigationAccess(i.url);
    if (access.adminOnly && !isAdmin) return false;
    if (access.staffOnly && !isStaff) return false;
    if (access.authOnly && !isAuthenticated) return false;
    return true;
  });
}

function groupContainsActive(location: string, items: NavItem[]): boolean {
  return items.some((item) => isItemActive(location, item.url));
}

function NavSection({
  label,
  items,
  location,
  icon: Icon,
  currentUrl,
  defaultOpen = false,
}: {
  label: string;
  items: NavItem[];
  location: string;
  icon?: LucideIcon;
  currentUrl?: string;
  defaultOpen?: boolean;
}) {
  const containsActive = groupContainsActive(location, items);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const resolvedOpen = isOpen || containsActive;
  const testId = `trigger-sidebar-${label.toLowerCase().replace(/\s+/g, '-')}`;

  if (items.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <Collapsible open={resolvedOpen} onOpenChange={setIsOpen} className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton data-testid={testId} aria-label={`${label} section`}>
                  {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
                  <span className="font-semibold">{label}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">{items.length}</span>
                  <ChevronRight className="ml-1 h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" aria-hidden="true" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {items.map((item) => {
                    const isActive = isItemActive(location, item.url);
                    return (
                      <SidebarMenuSubItem key={item.title}>
                        <div className="flex items-center">
                          <SidebarMenuSubButton
                            asChild
                            data-active={isActive}
                            className={`min-w-0 min-h-11 flex-1 ${isActive ? "bg-sidebar-accent" : ""}`}
                            data-testid={`link-sidebar-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                          >
                            <Link href={item.url} aria-label={item.title} aria-current={isActive && item.url === currentUrl ? "page" : undefined}>
                              <item.icon className="h-4 w-4" aria-hidden="true" />
                              <span className="truncate">{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                          <SidebarInfo title={item.title} />
                        </div>
                      </SidebarMenuSubItem>
                    );
                  })}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

// Sidebar search — a tiny client-side filter across every nav item.
// Solves "I know what I want but can't remember which hub it's in."
function useSidebarSearch(allItems: NavItem[]) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!trimmed) return [];
    return allItems
      .filter((i) => i.title.toLowerCase().includes(trimmed) || i.url.toLowerCase().includes(trimmed))
      .slice(0, 12);
  }, [allItems, trimmed]);
  return { query, setQuery, results };
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { orgId } = useCurrentOrgId();
  const { data: progressData } = useQuery<StudentProgress>({
    queryKey: ["/api/progress"],
    enabled: isAuthenticated,
  });
  const progress = progressData ?? null;

  const { data: avatarData } = useQuery<AcademyAvatar>({
    queryKey: ["/api/academy/avatar"],
    enabled: isAuthenticated,
  });
  const userRole = avatarData?.role || "student";
  const isAdmin = userRole === "admin" || user?.isTcafAdmin === true;
  const isTeacher = userRole === "teacher" || isAdmin;
  const isStaff = ["admin", "teacher", "case_manager", "facilitator", "staff"].includes(userRole);

  const rank = progress ? getRankForLevel(progress.currentLevel) : null;
  const RankIcon = rank ? (rankIcons[rank.icon] || Shield) : Shield;

  const initials = user
    ? ((user.firstName?.[0] || "") + (user.lastName?.[0] || "")).toUpperCase() || (user.email?.[0]?.toUpperCase() || "?")
    : "?";

  // Visible items per hub (auth-gated).
  const hubCtx = useMemo(() => filterAuth(ctxHubItems, isAuthenticated, isAdmin), [isAuthenticated, isAdmin]);
  const hub1 = useMemo(() => filterAuth(getFundedItems, isAuthenticated, isAdmin), [isAuthenticated, isAdmin]);
  const hub2 = useMemo(() => filterAuth(servePeopleItems, isAuthenticated, isAdmin), [isAuthenticated, isAdmin]);
  const hubFoster = useMemo(() => filterAuth(fosterYouthItems, isAuthenticated, isAdmin), [isAuthenticated, isAdmin]);
  const hubJustice = useMemo(() => filterAuth(justiceReentryItems, isAuthenticated, isAdmin), [isAuthenticated, isAdmin]);
  const hubPrevHealth = useMemo(() => filterAuth(preventionHealthItems, isAuthenticated, isAdmin), [isAuthenticated, isAdmin]);
  const hub3 = useMemo(() => filterAuth(workforceTradesItems, isAuthenticated, isAdmin), [isAuthenticated, isAdmin]);
  const hub4 = useMemo(() => filterAuth(academyLearningItems, isAuthenticated, isAdmin), [isAuthenticated, isAdmin]);
  const hub5 = useMemo(() => filterAuth(partnersCoalitionsItems, isAuthenticated, isAdmin), [isAuthenticated, isAdmin]);
  const hub6 = useMemo(() => filterAuth(whereWeOperateItems, isAuthenticated, isAdmin), [isAuthenticated, isAdmin]);
  const hub7 = useMemo(() => filterAuth(aboutTrustItems, isAuthenticated, isAdmin), [isAuthenticated, isAdmin]);
  const hubChildCare = useMemo(() => filterAuth(hubChildCareWorkforce, isAuthenticated, isAdmin), [isAuthenticated, isAdmin]);
  const hubRural = useMemo(() => filterAuth(hubRuralAg, isAuthenticated, isAdmin), [isAuthenticated, isAdmin]);
  const organizationNavItems = useMemo<NavItem[]>(() => orgId ? [
    ...myOrgItems,
    {
      title: "Community Opportunity Mirror",
      url: `/app/entity/${encodeURIComponent(orgId)}`,
      icon: Compass,
    },
  ] : myOrgItems, [orgId]);
  const visibleOrganizationNavItems = useMemo(
    () => filterAuth(organizationNavItems, isAuthenticated, isAdmin, isStaff),
    [organizationNavItems, isAuthenticated, isAdmin, isStaff],
  );

  // Search corpus mirrors what's actually navigable for THIS viewer:
  // - CTX hub + 7 public hubs (already auth-filtered above)
  // - My Organization only when signed in
  // - All Admin sub-sections only when admin (incl. teaching when teacher)
  const allItems = useMemo(() => {
    const items: NavItem[] = [...quickTaskItems, ...hubCtx, ...hub1, ...hub2, ...hubFoster, ...hubJustice, ...hubPrevHealth, ...hub3, ...hub4, ...hub5, ...hub6, ...hub7, ...hubChildCare, ...hubRural];
    if (isAuthenticated) items.push(...visibleOrganizationNavItems);
    if (isAdmin) {
      items.push(
        ...adminOperationsItems,
        ...adminProgramItems,
        ...adminInternalItems,
        ...adminAcademyItems,
      );
      if (isTeacher) items.push(...adminTeachingItems);
    }
    return items;
  }, [hub1, hub2, hub3, hub4, hub5, hub6, hub7, hubChildCare, hubRural, isAuthenticated, isAdmin, isTeacher, visibleOrganizationNavItems]);
  const activeNavUrl = useMemo(
    () => allItems.find((item) => isItemActive(location, item.url))?.url,
    [allItems, location],
  );
  const search = useSidebarSearch(allItems);

  return (
    <TooltipProvider delayDuration={250} skipDelayDuration={100}>
    <Sidebar role="navigation" aria-label="Main navigation">
      <SidebarHeader className="p-4">
        <Link href="/" aria-label="ThriveUp Academy home">
          <div className="flex items-center gap-2.5 cursor-pointer" data-testid="link-home">
            <img src={thriveupLogo} alt="ThriveUp logo" className="h-9 w-9 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm leading-tight tracking-wide uppercase">ThriveUp</p>
              <p className="text-[10px] text-muted-foreground leading-tight">a service of The Collaborative Advocate Foundation</p>
            </div>
          </div>
        </Link>
        <OrgSwitcher isAuthenticated={!!isAuthenticated} />
      </SidebarHeader>
      <SidebarContent>
        {isAuthenticated && user && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="px-3 py-2">
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImageUrl || undefined} alt={`${user.firstName || "User"} profile picture`} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" data-testid="text-sidebar-username">
                      {user.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}` : user.email || "Student"}
                    </p>
                    {progress && progress.streakDays > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Flame className="h-3 w-3 text-orange-500" aria-hidden="true" />
                        <span aria-label={`${progress.streakDays} day streak`}>{progress.streakDays} day streak</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Quick-find search. Solves "I know what I want, can't find the door." */}
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="px-3 pb-2">
              <label htmlFor="sidebar-search" className="sr-only">Search navigation</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <input
                  id="sidebar-search"
                  type="search"
                  placeholder="Find a page…"
                  value={search.query}
                  onChange={(e) => search.setQuery(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 text-xs rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  data-testid="input-sidebar-search"
                  aria-label="Find a page"
                />
              </div>
              {search.results.length > 0 && (
                <div className="mt-2 rounded-md border bg-popover shadow-sm overflow-hidden" data-testid="sidebar-search-results">
                  {search.results.map((item) => (
                    <Link
                      key={item.url + item.title}
                      href={item.url}
                      onClick={() => search.setQuery("")}
                       className="flex min-h-11 items-center gap-2 px-2.5 py-1.5 text-xs hover:bg-accent border-b last:border-b-0"
                      data-testid={`link-search-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    >
                      <item.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Foundation Network — 4-pillar quick-nav */}
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="px-3 pb-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-semibold">Foundation Network</p>
              <div className="grid grid-cols-2 gap-1.5">
                <Link href="/hub/serve" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 min-h-11 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors" data-testid="link-pillar-serve">
                  <Heart className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Serve
                </Link>
                <Link href="/hub/grow" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 min-h-11 text-xs font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors" data-testid="link-pillar-grow">
                  <Rocket className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Grow
                </Link>
                <Link href="/hub/fund" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 min-h-11 text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors" data-testid="link-pillar-fund">
                  <Target className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Fund
                </Link>
                <Link href="/hub/connect" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 min-h-11 text-xs font-semibold bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors" data-testid="link-pillar-connect">
                  <Compass className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Connect
                </Link>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible defaultOpen={false} className="group/collapsible">
            <SidebarGroupLabel>
              <CollapsibleTrigger className="w-full">
                <Globe className="mr-2 h-4 w-4" />
                Connected sites
                <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {connectedSiteItems.map((item) => (
                    <SidebarMenuItem key={`${item.title}-${item.url}`}>
                      <div className="flex items-center">
                        <SidebarMenuButton asChild className="min-w-0 flex-1">
                          <a
                            href={item.url}
                            target={item.url.startsWith("https://") ? "_blank" : undefined}
                            rel={item.url.startsWith("https://") ? "noopener noreferrer" : undefined}
                            aria-label={item.title}
                            data-testid={`link-connected-site-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                          >
                            <item.icon className="h-4 w-4" aria-hidden="true" />
                            <span className="truncate">{item.title}</span>
                          </a>
                        </SidebarMenuButton>
                        <SidebarInfo title={item.title} />
                      </div>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* QUICK TASKS — always visible, task-first entry points. */}
        <SidebarGroup>
          <SidebarGroupLabel>I want to…</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickTaskItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    data-active={isItemActive(location, item.url)}
                    className={`min-h-11 ${isItemActive(location, item.url) ? "bg-sidebar-accent" : ""}`}
                    data-testid={`link-quicktask-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  >
                    <Link href={item.url} aria-label={item.title} aria-current={isItemActive(location, item.url) && item.url === activeNavUrl ? "page" : undefined}>
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* EIGHT HUBS — seven thematic hubs plus Central Texas geographic front door. */}
        <NavSection label="Central Texas" items={hubCtx} location={location} currentUrl={activeNavUrl} icon={MapPin} />
        <NavSection label="Get Funded" items={hub1} location={location} currentUrl={activeNavUrl} icon={Trophy} />
        <NavSection label="Benefits & Intake" items={hub2} location={location} currentUrl={activeNavUrl} icon={HandHeart} />
        <NavSection label="Foster Youth" items={hubFoster} location={location} currentUrl={activeNavUrl} icon={Heart} />
        <NavSection label="Justice & Reentry" items={hubJustice} location={location} currentUrl={activeNavUrl} icon={Scale} />
        <NavSection label="Prevention & Health" items={hubPrevHealth} location={location} currentUrl={activeNavUrl} icon={ShieldCheck} />
        <NavSection label="Child Care & Workforce" items={hubChildCare} location={location} currentUrl={activeNavUrl} icon={Baby} />
        <NavSection label="Rural & Agriculture" items={hubRural} location={location} currentUrl={activeNavUrl} icon={Sprout} />
        <NavSection label="Workforce & Trades" items={hub3} location={location} currentUrl={activeNavUrl} icon={Briefcase} />
        <NavSection label="Academy & Learning" items={hub4} location={location} currentUrl={activeNavUrl} icon={GraduationCap} />
        <NavSection label="Partners & Coalitions" items={hub5} location={location} currentUrl={activeNavUrl} icon={Handshake} />
        <NavSection label="Where We Operate" items={hub6} location={location} currentUrl={activeNavUrl} icon={Compass} />
        <NavSection label="About & Trust" items={hub7} location={location} currentUrl={activeNavUrl} icon={Info} />

        {isAuthenticated && (
          <NavSection label="My Organization" items={organizationNavItems} location={location} currentUrl={activeNavUrl} icon={Building2} />
        )}

        {/* Admin — collapsed under one parent, sub-sectioned within. */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavSection label="Operations" items={adminOperationsItems} location={location} currentUrl={activeNavUrl} icon={Activity} />
              <NavSection label="Programs & Lifecycle" items={adminProgramItems} location={location} currentUrl={activeNavUrl} icon={Zap} />
              <NavSection label="Internal Tools" items={adminInternalItems} location={location} currentUrl={activeNavUrl} icon={ClipboardCheck} />
              <NavSection label="Academy Admin" items={adminAcademyItems} location={location} currentUrl={activeNavUrl} icon={School} />
              {isTeacher && (
                <NavSection label="Teaching & Staff" items={adminTeachingItems} location={location} currentUrl={activeNavUrl} icon={Users} />
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {rank && (
          <SidebarGroup>
            <SidebarGroupLabel>Your Rank</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-3 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0" aria-hidden="true">
                    <RankIcon className="h-4.5 w-4.5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight" data-testid="text-sidebar-rank">{rank.title}</p>
                    {rank.stars > 0 ? (
                      <div className="flex items-center gap-0.5 mt-0.5" aria-label={`${rank.stars} stars`}>
                        {Array.from({ length: rank.stars }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden="true" />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Level {progress?.currentLevel}</p>
                    )}
                  </div>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4" aria-label="Sidebar footer">
        {!authLoading && (
          isAuthenticated ? (
            <Button asChild variant="ghost" size="sm" className="w-full justify-start" data-testid="button-logout">
              <a href="/api/logout" aria-label="Sign out" onClick={() => clearCurrentOrgSelection()}>
                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" /> Sign Out
              </a>
            </Button>
          ) : (
            <div className="space-y-1.5">
              <Button asChild variant="default" size="sm" className="w-full" data-testid="button-login">
                <a href="/api/login" aria-label="Sign in">
                  <LogIn className="mr-2 h-4 w-4" aria-hidden="true" /> Sign In
                </a>
              </Button>
              <p className="text-[10px] text-muted-foreground text-center" data-testid="text-login-hint">
                Sign in to autosave your work across devices
              </p>
            </div>
          )
        )}
        <div className="mt-3 pt-2 border-t space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Heart className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>ThriveUp Academy · TCAF · ALC</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-snug" data-testid="text-pilot-transparency">
            National community-infrastructure platform. Live pilot in Travis County, Texas — the template for the all-50-states + 5-territory rollout via the open Hub Adoption Kit. TCAF is an IRS-determined 501(c)(3) (Letter 947, effective January 14, 2026); SAM.gov Active (UEI KDDVD1FGLW35); CAGE 209N1.
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
    </TooltipProvider>
  );
}
