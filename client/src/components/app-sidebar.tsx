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
  Users, Globe, FileText, LogIn, LogOut, Flame, BarChart3, School, ScrollText, Wand2, Smartphone,
  Rocket, User, TrendingUp, Wallet, Building2, Trophy, Flag, Target, ShoppingBag,
  Zap, CalendarCheck, Lightbulb, Gamepad2, Map, Store, Briefcase, Route,
  Activity, ClipboardCheck, Handshake, ChevronRight, DollarSign,
  PenLine, Megaphone, Calendar, HelpCircle, ClipboardList, Printer, Link2,
  MessageCircle, MapPin, Presentation, Scale, FileBarChart, LayoutDashboard,
  Info, BookMarked,
  Mail, Landmark, RefreshCw, Package, PenTool,
  Microscope, Stethoscope, Film, HandHeart, Search, Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getRankForLevel } from "@/lib/curriculum-data";
import { useAuth } from "@/hooks/use-auth";
import type { StudentProgress, AcademyAvatar } from "@shared/schema";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

const communityIntelItems: NavItem[] = [
  { title: "Transparency Dashboard", url: "/transparency", icon: Activity },
  { title: "Impact Dashboard", url: "/impact", icon: TrendingUp },
  { title: "Resident Journey (demo)", url: "/resident-journey", icon: Route },
  { title: "Case Manager View", url: "/case-manager", icon: Shield },
  { title: "Resource Finder", url: "/resources", icon: MapPin },
  { title: "Community Map", url: "/community-map", icon: Map },
  { title: "Community Voice", url: "/voice", icon: MessageCircle },
  { title: "Regional Briefing", url: "/regional-briefing", icon: Sparkles },
  { title: "Neighborhood Intel", url: "/neighborhood", icon: MapPin },
  { title: "Opportunity Youth", url: "/opportunity-youth", icon: Users },
  { title: "Community", url: "/community", icon: Globe },
];

const workforceSolutionsItems: NavItem[] = [
  { title: "Workforce Dashboard", url: "/workforce-dashboard", icon: BarChart3 },
  { title: "Apprenticeship Tracker", url: "/apprenticeship-tracker", icon: Wrench },
  { title: "Workforce Training", url: "/workforce-training", icon: GraduationCap },
  { title: "Workforce Assessment", url: "/workforce-assessment", icon: ClipboardCheck },
  { title: "Career Explorer", url: "/academy/careers", icon: Briefcase },
  { title: "Employer Connections", url: "/workforce-employers", icon: Building2 },
  { title: "Mentorship Directory", url: "/mentorship-directory", icon: Users },
  { title: "Mentor Network", url: "/academy/mentors", icon: Users },
  { title: "Find Mentor/Partner", url: "/academy/mentor-finder", icon: Handshake },
  { title: "My Pathway", url: "/academy/pathway", icon: Route },
  { title: "Transition Plans", url: "/transition-plans", icon: GraduationCap },
  { title: "Dream Design", url: "/academy/dreams", icon: Target },
];

const fosterYouthItems: NavItem[] = [
  { title: "Foster Youth Hub", url: "/foster-youth", icon: HandHeart },
  { title: "Aging-Out Toolkit", url: "/foster-youth/toolkit", icon: ClipboardCheck },
  { title: "Transition Plan", url: "/foster-youth/transition-plan", icon: Route },
  { title: "Wellbeing Check-in", url: "/foster-youth/wellbeing", icon: Heart },
  { title: "My Rights", url: "/foster-youth/rights", icon: Scale },
  { title: "State Benefits (50 states)", url: "/foster-youth/benefits", icon: Landmark },
  { title: "FAFSA & ETV (foster mode)", url: "/fafsa-navigator?audience=foster", icon: GraduationCap },
  { title: "AI-assisted Intake", url: "/foster-youth/intake", icon: Sparkles },
  { title: "Cohort Analytics (admin)", url: "/foster-youth/cohort-analytics", icon: BarChart3 },
  { title: "State-Agency Portal", url: "/foster-youth/state-portal", icon: Building2 },
  { title: "Policy Comparison (50 states)", url: "/foster-youth/policy-comparison", icon: Scale },
];

const communityPartnersItems: NavItem[] = [
  { title: "Community Partner Hub", url: "/partners/vann-hub", icon: Handshake },
  { title: "Family & Program Tracker", url: "/partners/family-program-tracker", icon: Users },
  { title: "RFP-Match Storyteller", url: "/partners/rfp-storyteller", icon: Sparkles },
];

function useDemoPartnersFlag(): boolean {
  const [on, setOn] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("tcaf_demo_partners") === "1";
  });
  useEffect(() => {
    function sync() {
      setOn(window.localStorage.getItem("tcaf_demo_partners") === "1");
    }
    window.addEventListener("storage", sync);
    window.addEventListener("tcaf-demo-partners-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("tcaf-demo-partners-changed", sync);
    };
  }, []);
  return on;
}

const justiceReentryItems: NavItem[] = [
  { title: "Reentry Program (overview)", url: "/reentry-program", icon: Scale },
  { title: "Reentry Operational Dashboard", url: "/reentry", icon: Scale },
  { title: "TX Reentry Stipend Pilot", url: "/reentry-stipend-pilot", icon: Landmark },
  { title: "National Reentry Standards", url: "/reentry/standards", icon: Scale },
  { title: "Strategic Plan", url: "/reentry/strategic-plan", icon: Scale },
  { title: "Outcome Reports", url: "/reentry/outcome-reports", icon: Scale },
  { title: "Resource Directory", url: "/resource-directory", icon: HandHeart },
  { title: "For Justice Partners", url: "/justice-partners", icon: Handshake },
  { title: "Justice Command Center", url: "/justice-command-center", icon: Shield },
];

// Programs — new top-level pillar surfacing the Cycle B agency-aligned program pages.
// Each program page is a focused, evidence-based, plain-English pitch built around a
// specific federal/foundation funder's reviewer lens.
const programsItems: NavItem[] = [
  { title: "Veterans Program", url: "/veterans", icon: Shield },
  { title: "Behavioral Health Program", url: "/behavioral-health", icon: Heart },
  { title: "Reentry Program", url: "/reentry-program", icon: Scale },
  { title: "Research & Methodology", url: "/methodology", icon: Microscope },
  { title: "Health & Wellness", url: "/health-wellness", icon: Activity },
  { title: "Prevention", url: "/prevention", icon: ShieldCheck },
];

const partnershipItems: NavItem[] = [
  { title: "Coalition Dashboard", url: "/coalition", icon: Users },
  { title: "Collaboration Hub", url: "/collaboration-hub", icon: Building2 },
  { title: "Community Partners", url: "/partners", icon: Handshake },
];

const programMgmtItems: NavItem[] = [
  { title: "Program Engine", url: "/program-engine", icon: Zap },
  { title: "Program Designer", url: "/program-designer", icon: Target },
  { title: "Program Management", url: "/program-management", icon: Briefcase },
  { title: "Program Lifecycle", url: "/program-lifecycle", icon: RefreshCw },
  { title: "PM Academy", url: "/pm-academy", icon: GraduationCap },
  { title: "MCE Contracts", url: "/mce-contracts", icon: Building2 },
  { title: "Proposal Command", url: "/proposal-command", icon: Zap },
];

// My Organization — surfaced as its own top-level group for any logged-in user
// (org owner OR partner). Hoisted out of grantEngineItems so partners don't
// have to scroll through 30+ grant tools to find their own profile + docs.
const myOrgItems: NavItem[] = [
  { title: "Organization Profile", url: "/settings/organization", icon: Building2 },
  { title: "Document Library", url: "/settings/documents", icon: FileText },
];

const grantEngineItems: NavItem[] = [
  { title: "This Week (Monday Brief)", url: "/this-week", icon: Calendar },
  { title: "Live Grant Opportunities", url: "/grants", icon: Target },
  { title: "My Grants & Win Rate", url: "/my-grants", icon: Trophy },
  { title: "Winning Proposals Library", url: "/won-proposals", icon: Trophy },
  { title: "Teaming Network & Capabilities", url: "/teaming-network", icon: Users },
  { title: "RFP-Driven Writer", url: "/grant-narrative", icon: FileText },
  { title: "RFP Fidelity Engine", url: "/rfp-fidelity", icon: ShieldCheck },
  { title: "Sedgwick Vitality (RFP 26-0028)", url: "/grants/sedgwick-vitality", icon: FileBarChart },
  { title: "Application Tracker", url: "/grants/applications", icon: ClipboardCheck },
  { title: "Grant Packages", url: "/grant-packages", icon: Package },
  { title: "St. David's Prep", url: "/stdavids-prep", icon: Heart },
  { title: "Coalition Portal", url: "/coalition", icon: Globe },
  { title: "LOI Writer", url: "/loi-writer", icon: FileText },
  { title: "SDOH Impact Chain", url: "/sdoh-chain", icon: Link2 },
  { title: "SDOH Explorer (Public)", url: "/sdoh-explorer", icon: Search },
  { title: "City Comparison", url: "/city-comparison", icon: Scale },
  { title: "Narrative Builder", url: "/grant-narrative", icon: FileText },
  { title: "Prior Award Research", url: "/grant-prior-awards", icon: Search },
  { title: "Ecosystem Orchestration", url: "/ecosystem-orchestration", icon: Activity },
  { title: "Ecosystem Hub", url: "/ecosystem", icon: Globe },
  { title: "Ecosystem Story", url: "/ecosystem-story", icon: BookMarked },
  { title: "Logic Model", url: "/logic-model", icon: Route },
  { title: "Advisory Board", url: "/advisory-board", icon: Users },
  { title: "Staffing Plan", url: "/staffing-plan", icon: Briefcase },
  { title: "Stakeholder Deck", url: "/presentations", icon: Presentation },
  { title: "E-Sign Center", url: "/esign", icon: PenTool },
  { title: "APEX Accelerators", url: "/apex-accelerators", icon: Landmark },
  { title: "Ops Center", url: "/ops-center", icon: Activity },
  { title: "Ecosystem AI", url: "/ecosystem-ai", icon: Brain },
];

const dataReportingItems: NavItem[] = [
  { title: "Data Sources", url: "/data-sources", icon: LayoutDashboard },
  { title: "Platform Metrics", url: "/platform-metrics", icon: BarChart3 },
  { title: "Pilot Dashboard", url: "/pilot", icon: Users },
  { title: "Dosage Report", url: "/dosage", icon: Activity },
  { title: "Outcome Reporting", url: "/outcomes", icon: FileBarChart },
];

const whereWeOperateItems: NavItem[] = [
  { title: "Coverage Map", url: "/coverage", icon: Map },
  { title: "Bring TCAF to Your State", url: "/coverage#request", icon: HandHeart },
];

// Texas is our FIRST county-deployment (St. David's WAB2 pilot region), not the whole product.
// These items mirror, in order, what the WAB2 LOI v7 (submitted 4/27/2026) promised
// St. David's Foundation: a 5-county benefits enrollment engine with a single
// front door, a 9-benefit screener, peer-mirrored Network View, partner
// coalition, and operator workspace — followed by the implementing neighborhoods.
const texasPilotItems: NavItem[] = [
  { title: "St. David's Hub (front door)", url: "/st-davids", icon: LayoutDashboard },
  { title: "9-Benefit Screener", url: "/benefits-screener", icon: ClipboardList },
  { title: "Benefits Command Center", url: "/benefits", icon: HandHeart },
  { title: "Coalition Partners", url: "/coalition", icon: Handshake },
  { title: "Live Network View", url: "/network", icon: BarChart3 },
  { title: "Operator Workspace", url: "/st-davids-wab2", icon: Wrench },
  { title: "Austin Initiative", url: "/austin", icon: MapPin },
  { title: "Manor Hub", url: "/manor", icon: MapPin },
  { title: "Pflugerville Hub", url: "/pflugerville", icon: MapPin },
  { title: "Voices of Austin", url: "/voices-of-austin", icon: Megaphone },
  { title: "Texas Assessment", url: "/texas-assessment", icon: Map },
  { title: "Third Spaces", url: "/third-spaces", icon: Building2 },
];

const aiToolsItems: NavItem[] = [
  { title: "AI Workforce Academy", url: "/ai-workforce", icon: GraduationCap },
  { title: "AI Creation Studio", url: "/ai-tools", icon: Wand2 },
  { title: "Spark", url: "/ai-companion", icon: Sparkles },
  { title: "Sparky", url: "/sparky", icon: MessageCircle },
  { title: "AI Curriculum (Youth)", url: "/curriculum", icon: Brain },
  { title: "Subjects", url: "/subjects", icon: GraduationCap },
  { title: "Achievements", url: "/achievements", icon: Award },
  { title: "Certificates", url: "/certificates", icon: ScrollText },
  { title: "Roku & CTV Ads", url: "/roku-ads", icon: Smartphone },
  { title: "Video Pipeline", url: "/video-pipeline", icon: Film },
];

const myStudentItems: NavItem[] = [
  { title: "Panther Village", url: "/academy", icon: Rocket },
  { title: "My Avatar", url: "/academy/avatar", icon: User },
  { title: "Panther Power", url: "/academy/power", icon: Zap },
  { title: "Daily Check-In", url: "/academy/self-assessment", icon: ClipboardCheck },
  { title: "My Pathway", url: "/academy/pathway", icon: Route },
  { title: "Thrive Dashboard", url: "/academy/thrive", icon: Activity },
  { title: "Daily Quests", url: "/academy/quests", icon: CalendarCheck },
  { title: "My Journal", url: "/academy/journal", icon: PenLine },
  { title: "Progress Report", url: "/academy/progress-report", icon: Printer },
  { title: "STAAR Test Prep", url: "/academy/staar-prep", icon: GraduationCap },
];

const campusLifeItems: NavItem[] = [
  { title: "Game Room", url: "/academy/games", icon: Gamepad2 },
  { title: "Competitions", url: "/academy/competitions", icon: Trophy },
  { title: "House Points", url: "/academy/houses", icon: Flag },
  { title: "Adventures", url: "/academy/scenarios", icon: Map },
  { title: "Marketplace", url: "/academy/marketplace", icon: Store },
  { title: "Stock Market", url: "/academy/stocks", icon: TrendingUp },
  { title: "My Wallet", url: "/academy/wallet", icon: Wallet },
  { title: "Financial Literacy", url: "/academy/financial-literacy", icon: DollarSign },
  { title: "FAFSA Navigator", url: "/fafsa-navigator", icon: GraduationCap },
  { title: "Announcements", url: "/academy/announcements", icon: Megaphone },
  { title: "Calendar", url: "/academy/calendar", icon: Calendar },
  { title: "Help & FAQ", url: "/academy/help", icon: HelpCircle },
];

const careerMentorsItems: NavItem[] = [
  { title: "Life Lessons", url: "/academy/lessons", icon: Lightbulb },
  { title: "Trade Sims", url: "/academy/trade-sims", icon: Zap },
  { title: "Concepts", url: "/concepts", icon: Sparkles },
];

const buildCreateItems: NavItem[] = [
  { title: "Build Campus", url: "/academy/campus", icon: Building2 },
  { title: "Print Shop", url: "/academy/merch", icon: ShoppingBag },
];


// PUBLIC About — the trust surfaces a funder, partner, or community member should see.
// Operational items (business-plan, business-documents, business-card, etc.) are
// admin-gated below — they are not part of the public storefront.
const aboutItems: NavItem[] = [
  { title: "About / Our Structure", url: "/about", icon: Info },
  { title: "Open Innovation Lab", url: "/open-innovation-lab", icon: Microscope },
  { title: "Non-Discrimination", url: "/non-discrimination", icon: Shield },
  { title: "Pricing & Services", url: "/pricing", icon: DollarSign },
  { title: "AI Consulting", url: "/ai-consulting", icon: Brain },
  { title: "Contact Us", url: "/contact", icon: Mail },
  { title: "Privacy Policy", url: "/privacy", icon: Shield },
];

// Internal grant-development workspace — only shown to authenticated staff and partners.
// Pages here also enforce auth at the route level via <RequireAuth>.
const internalWorkspaceItems: NavItem[] = [
  { title: "Healthcare Grants Catalog", url: "/healthcare-grants", icon: Stethoscope },
  { title: "Grant Packages", url: "/grant-packages", icon: Package },
  { title: "Transparency Matrix", url: "/transparency-matrix", icon: ClipboardCheck },
  { title: "Stakeholder Engagement Map", url: "/stakeholder-map", icon: Users },
];

// Admin-only operational pages. Hidden from public navigation; only surfaced when
// userRole === "admin". These pages contain internal financials, personal contact
// templates, and operational workspaces not intended for funder/community view.
const adminOpsItems: NavItem[] = [
  { title: "Business Plan", url: "/business-plan", icon: Briefcase },
  { title: "Business Documents", url: "/business-documents", icon: FileText },
  { title: "Business Card", url: "/business-card", icon: User },
  { title: "St. David's Operator Workspace", url: "/st-davids-wab2", icon: Wrench },
  { title: "Ops Center", url: "/ops-center", icon: Activity },
  { title: "Directive Compliance", url: "/directive-compliance", icon: ClipboardCheck },
  { title: "Trade Sims Signups", url: "/admin/trade-sims-signups", icon: Users },
  { title: "API Documentation", url: "/api-docs", icon: Globe },
];

const preventionItems: NavItem[] = [
  { title: "Prevention Hub", url: "/prevention", icon: Shield },
  { title: "Prevention Strategies", url: "/prevention-strategies", icon: ShieldCheck },
  { title: "Parent Education", url: "/parent-education", icon: Heart },
  { title: "Facilitator Hub", url: "/facilitator-hub", icon: ClipboardCheck },
];

const healthWellnessItems: NavItem[] = [
  { title: "Health Network", url: "/health-network", icon: Heart },
  { title: "Health Hub", url: "/health-wellness", icon: Activity },
  { title: "CHW Dashboard", url: "/chw-dashboard", icon: Stethoscope },
];

const researchItems: NavItem[] = [
  { title: "MAP-GAP Framework", url: "/mapgap-framework", icon: RefreshCw },
  { title: "MAP-GAP CQI", url: "/cqi", icon: Target },
  { title: "RPLICE Toolkit", url: "/rplice-tools", icon: Microscope },
  { title: "Research Hub", url: "/research-hub", icon: Microscope },
  { title: "Case Studies", url: "/case-studies", icon: BookOpen },
  { title: "Peer Review", url: "/peer-review", icon: Users },
  { title: "Implementation Plan", url: "/implementation", icon: ClipboardList },
];

const caseManagementItems: NavItem[] = [
  { title: "Intake Wizard", url: "/intake", icon: ClipboardCheck },
  { title: "My Journey", url: "/my-journey", icon: Rocket },
  { title: "Cohort Onboarding", url: "/cohort-onboarding", icon: Users },
  { title: "Service Delivery", url: "/services", icon: Activity },
];

const teachingPublicItems: NavItem[] = [
  { title: "Parent Dashboard", url: "/parents", icon: Users },
  { title: "Curriculum Docs", url: "/curriculum-documents", icon: FileText },
  { title: "Social Media Literacy", url: "/social-media-literacy", icon: Smartphone },
  { title: "Implementation Plan", url: "/implementation", icon: ClipboardList },
];

const teachingTeacherItems: NavItem[] = [
  { title: "Classrooms", url: "/classrooms", icon: School },
  { title: "Classroom Wizard", url: "/classrooms/wizard", icon: Wand2 },
  { title: "Teacher Dashboard", url: "/teacher-dashboard", icon: BarChart3 },
  { title: "Attendance", url: "/academy/attendance", icon: ClipboardList },
  { title: "Support Portal", url: "/academy/integration", icon: Link2 },
  { title: "Impact Dashboard", url: "/impact", icon: TrendingUp },
];

const teachingAdminItems: NavItem[] = [
  { title: "Admin Dashboard", url: "/academy/admin", icon: BarChart3 },
  { title: "Grant Discovery", url: "/grants", icon: Target },
  { title: "Sparky (Staff)", url: "/sparky", icon: MessageCircle },
  { title: "Admin Guide", url: "/academy/admin-tutorial", icon: BookOpen },
  { title: "Student Wizards", url: "/academy/student-wizard", icon: Wand2 },
  { title: "Arthur's Journey", url: "/academy/tutorial", icon: GraduationCap },
  { title: "Longitudinal Dashboard", url: "/academy/longitudinal", icon: BarChart3 },
  { title: "Risk Monitor", url: "/academy/risk-monitor", icon: Shield },
  { title: "API Documentation", url: "/api-docs", icon: Globe },
];

const rankIcons: Record<string, typeof Shield> = {
  Shield, ShieldCheck, ShieldPlus, Swords, Medal,
};

function isItemActive(location: string, url: string): boolean {
  if (location === url) return true;
  if (url === "/subjects" && location.startsWith("/subject")) return true;
  if (url === "/curriculum" && location.startsWith("/curriculum/")) return true;
  if (url === "/curriculum-documents" && location.startsWith("/curriculum-documents/")) return true;
  if (url === "/classrooms" && location.startsWith("/classrooms/")) return true;
  if (url === "/certificates" && location.startsWith("/certificates/")) return true;
  if (url === "/implementation" && location.startsWith("/implementation")) return true;
  if (url !== "/parents" && url !== "/academy" && location.startsWith(url + "/")) return true;
  return false;
}

function groupContainsActive(location: string, items: NavItem[]): boolean {
  return items.some((item) => isItemActive(location, item.url));
}

function NavSection({ label, items, location }: { label: string; items: NavItem[]; location: string }) {
  const containsActive = groupContainsActive(location, items);
  const [isOpen, setIsOpen] = useState(false);
  const resolvedOpen = isOpen || containsActive;
  const testId = `trigger-sidebar-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <Collapsible open={resolvedOpen} onOpenChange={setIsOpen} className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton data-testid={testId} aria-label={`${label} section`}>
                  <span>{label}</span>
                  <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" aria-hidden="true" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {items.map((item) => {
                    const isActive = isItemActive(location, item.url);
                    return (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton
                          asChild
                          data-active={isActive}
                          className={isActive ? "bg-sidebar-accent" : ""}
                          data-testid={`link-sidebar-${item.title.toLowerCase().replace(/\s/g, '-')}`}
                        >
                          <Link href={item.url} aria-label={item.title}>
                            <item.icon className="h-4 w-4" aria-hidden="true" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
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

export function AppSidebar() {
  const [location] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const demoPartnersOn = useDemoPartnersFlag();
  const { data: progressData } = useQuery<StudentProgress>({
    queryKey: ["/api/progress"],
  });
  const progress = progressData ?? null;

  const { data: avatarData } = useQuery<AcademyAvatar>({
    queryKey: ["/api/academy/avatar"],
    enabled: isAuthenticated,
  });
  const userRole = avatarData?.role || "student";
  const isAdmin = userRole === "admin";
  const isTeacher = userRole === "teacher" || isAdmin;

  const rank = progress ? getRankForLevel(progress.currentLevel) : null;
  const RankIcon = rank ? (rankIcons[rank.icon] || Shield) : Shield;

  const initials = user
    ? ((user.firstName?.[0] || "") + (user.lastName?.[0] || "")).toUpperCase() || (user.email?.[0]?.toUpperCase() || "?")
    : "?";

  const visibleTeachingItems = useMemo(() => {
    const items = [...teachingPublicItems];
    if (isTeacher) items.push(...teachingTeacherItems);
    if (isAdmin) items.push(...teachingAdminItems);
    return items;
  }, [isTeacher, isAdmin]);

  const teachingActive = useMemo(() => {
    return groupContainsActive(location, visibleTeachingItems);
  }, [location, visibleTeachingItems]);

  const [teachingOpen, setTeachingOpen] = useState(false);

  const resolvedTeachingOpen = teachingOpen || teachingActive;

  return (
    <Sidebar aria-label="Main navigation">
      <SidebarHeader className="p-4">
        <Link href="/" aria-label="ThriveUp Academy home">
          <div className="flex items-center gap-2.5 cursor-pointer" data-testid="link-home">
            <div className="rounded-md p-1.5 bg-gradient-to-br from-violet-700 to-indigo-800">
              <Heart className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">ThriveUp Academy</p>
              <p className="text-xs text-muted-foreground leading-tight">The Collaborative Advocate Foundation</p>
            </div>
          </div>
        </Link>
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

        {/* Top of sidebar — the two highest-frequency surfaces:
            1. Texas (St. David's Pilot) — the active funded pilot, mirrors the LOI
            2. Grant Engine — the live federal/foundation/state grant scanner (290+
               opportunities, scans Grants.gov + SAM.gov + USASpending + state TX
               + foundations every 24 hours). "Live Grant Opportunities" is the
               top item inside this group. */}
        {/* PUBLIC NAVIGATION — 8 focused pillars in priority order:
            1. Texas Pilot (live funded work)
            2. Programs (agency-aligned program pitches — Cycle B)
            3. Grant Engine (live grant scanner)
            4. Research & Methodology (intellectual merit)
            5. Community Intelligence (transparency + dashboards)
            6. Workforce & Economic (employer pipelines)
            7. Criminal Justice & Reentry
            8. Partnerships & Coalitions
            Plus: AI Literacy, Where We Operate, About */}
        <NavSection label="Central Texas Pilot" items={texasPilotItems} location={location} />
        <NavSection label="Youth Aging Out of Foster Care" items={fosterYouthItems} location={location} />
        {demoPartnersOn && (
          <NavSection label="Community Partners" items={communityPartnersItems} location={location} />
        )}
        <NavSection label="Programs" items={programsItems} location={location} />
        {isAuthenticated && (
          <NavSection label="My Organization" items={myOrgItems} location={location} />
        )}
        {isAuthenticated && (
          <NavSection label="Grant Engine (internal)" items={grantEngineItems} location={location} />
        )}
        {isAuthenticated && (
          <NavSection label="Internal Workspace" items={internalWorkspaceItems} location={location} />
        )}
        <NavSection label="Research & Methodology" items={researchItems} location={location} />
        <NavSection label="Community Intelligence" items={communityIntelItems} location={location} />
        <NavSection label="Workforce & Economic" items={workforceSolutionsItems} location={location} />
        <NavSection label="Career, Trades & Mentors" items={careerMentorsItems} location={location} />
        <NavSection label="Criminal Justice & Reentry" items={justiceReentryItems} location={location} />
        <NavSection label="Partnerships & Coalitions" items={partnershipItems} location={location} />
        <NavSection label="Where We Operate" items={whereWeOperateItems} location={location} />
        <NavSection label="AI Literacy & Tools" items={aiToolsItems} location={location} />
        {isAuthenticated && (
          <>
            <NavSection label="Student Portal" items={myStudentItems} location={location} />
            <NavSection label="Campus Life" items={campusLifeItems} location={location} />
            <NavSection label="Build & Create" items={buildCreateItems} location={location} />
          </>
        )}

        {isAuthenticated && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <Collapsible open={resolvedTeachingOpen} onOpenChange={setTeachingOpen} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton data-testid="link-sidebar-teaching-&-staff" aria-label="Teaching & Staff section">
                        <Users className="h-4 w-4" aria-hidden="true" />
                        <span>Teaching & Staff</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" aria-hidden="true" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {visibleTeachingItems.map((item) => {
                          const isActive = isItemActive(location, item.url);
                          return (
                            <SidebarMenuSubItem key={item.title}>
                              <SidebarMenuSubButton
                                asChild
                                data-active={isActive}
                                className={isActive ? "bg-sidebar-accent" : ""}
                                data-testid={`link-sidebar-${item.title.toLowerCase().replace(/\s/g, '-')}`}
                              >
                                <Link href={item.url} aria-label={item.title}>
                                  <item.icon className="h-4 w-4" aria-hidden="true" />
                                  <span>{item.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
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
        )}

        <NavSection label="About & Trust" items={aboutItems} location={location} />

        {/* Admin-only operational sections — surfaced only when userRole === "admin".
            Includes case management, program management, prevention, health admin,
            data reporting, and internal business documents that are not part of
            the public funder-facing storefront. */}
        {isAdmin && (
          <>
            <NavSection label="Admin · Operations" items={adminOpsItems} location={location} />
            <NavSection label="Admin · Case Management" items={caseManagementItems} location={location} />
            <NavSection label="Admin · Program Mgmt" items={programMgmtItems} location={location} />
            <NavSection label="Admin · Prevention" items={preventionItems} location={location} />
            <NavSection label="Admin · Health Network" items={healthWellnessItems} location={location} />
            <NavSection label="Admin · Data & Reporting" items={dataReportingItems} location={location} />
          </>
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
            <a href="/api/logout" aria-label="Sign out">
              <Button variant="ghost" size="sm" className="w-full justify-start" data-testid="button-logout">
                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" /> Sign Out
              </Button>
            </a>
          ) : (
            <div className="space-y-1.5">
              <a href="/api/login" aria-label="Sign in">
                <Button variant="default" size="sm" className="w-full" data-testid="button-login">
                  <LogIn className="mr-2 h-4 w-4" aria-hidden="true" /> Sign In
                </Button>
              </a>
              <p className="text-[10px] text-muted-foreground text-center" data-testid="text-login-hint">
                Use your school email or Google account
              </p>
            </div>
          )
        )}
        <Link href="/contact" aria-label="Contact Us">
          <Button variant="ghost" size="sm" className="w-full justify-start" data-testid="link-contact">
            <Mail className="mr-2 h-4 w-4" aria-hidden="true" /> Contact Us
          </Button>
        </Link>
        <Link href="/privacy" aria-label="Privacy Policy">
          <Button variant="ghost" size="sm" className="w-full justify-start" data-testid="link-privacy-policy">
            <Shield className="mr-2 h-4 w-4" aria-hidden="true" /> Privacy Policy
          </Button>
        </Link>
        <Link href="/non-discrimination" aria-label="Non-Discrimination Statement">
          <Button variant="ghost" size="sm" className="w-full justify-start" data-testid="link-non-discrimination">
            <Shield className="mr-2 h-4 w-4" aria-hidden="true" /> Non-Discrimination
          </Button>
        </Link>
        <Link href="/about" aria-label="About TCAF and ALC">
          <Button variant="ghost" size="sm" className="w-full justify-start" data-testid="link-about-footer">
            <Heart className="mr-2 h-4 w-4" aria-hidden="true" /> About / Our Structure
          </Button>
        </Link>
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
  );
}
