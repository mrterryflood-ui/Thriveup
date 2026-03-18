import { useState, useMemo } from "react";
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
  Microscope, Stethoscope,
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
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Transparency Dashboard", url: "/transparency", icon: Activity },
  { title: "Community", url: "/community", icon: Globe },
  { title: "Resource Finder", url: "/resources", icon: MapPin },
  { title: "Impact Dashboard", url: "/impact", icon: TrendingUp },
];

const workforceSolutionsItems: NavItem[] = [
  { title: "Career Explorer", url: "/academy/careers", icon: Briefcase },
  { title: "Mentor Network", url: "/academy/mentors", icon: Users },
  { title: "Find Mentor/Partner", url: "/academy/mentor-finder", icon: Handshake },
  { title: "My Pathway", url: "/academy/pathway", icon: Route },
  { title: "Dream Design", url: "/academy/dreams", icon: Target },
  { title: "Reentry Dashboard", url: "/reentry", icon: Shield },
  { title: "Community Partners", url: "/partners", icon: Handshake },
  { title: "For Justice Partners", url: "/justice-partners", icon: Scale },
];

const coalitionItems: NavItem[] = [
  { title: "DFC Command Center", url: "/dfc-command-center", icon: LayoutDashboard },
  { title: "Coalition Dashboard", url: "/coalition", icon: Users },
  { title: "DFC Reporting", url: "/dfc-reporting", icon: FileBarChart },
  { title: "DFC Readiness", url: "/dfc-readiness", icon: Target },
  { title: "DFC Wizards", url: "/dfc-wizards", icon: Wand2 },
];

const grantEngineItems: NavItem[] = [
  { title: "Grant Hub", url: "/grants", icon: Target },
  { title: "Program Management", url: "/program-management", icon: Briefcase },
  { title: "Ecosystem Hub", url: "/ecosystem", icon: Globe },
  { title: "Ecosystem Story", url: "/ecosystem-story", icon: BookMarked },
  { title: "Logic Model", url: "/logic-model", icon: Route },
  { title: "Narrative Builder", url: "/grant-narrative", icon: FileText },
  { title: "Advisory Board", url: "/advisory-board", icon: Users },
  { title: "Staffing Plan", url: "/staffing-plan", icon: Briefcase },
  { title: "Pilot Dashboard", url: "/pilot", icon: Users },
  { title: "Dosage Report", url: "/dosage", icon: Activity },
  { title: "MAP-GAP CQI", url: "/cqi", icon: Activity },
  { title: "Outcome Reporting", url: "/outcomes", icon: FileBarChart },
  { title: "Stakeholder Deck", url: "/presentation", icon: Presentation },
  { title: "Platform Metrics", url: "/platform-metrics", icon: BarChart3 },
  { title: "APEX Accelerators", url: "/apex-accelerators", icon: Landmark },
  { title: "Program Designer", url: "/program-designer", icon: Target },
  { title: "Program Lifecycle", url: "/program-lifecycle", icon: RefreshCw },
  { title: "Grant Packages", url: "/grant-packages", icon: Package },
  { title: "E-Sign Center", url: "/esign", icon: PenTool },
];

const aiToolsItems: NavItem[] = [
  { title: "AI Creation Studio", url: "/ai-tools", icon: Wand2 },
  { title: "Spark", url: "/ai-companion", icon: Sparkles },
  { title: "Sparky", url: "/sparky", icon: MessageCircle },
  { title: "AI Curriculum", url: "/curriculum", icon: Brain },
  { title: "Subjects", url: "/subjects", icon: GraduationCap },
  { title: "Achievements", url: "/achievements", icon: Award },
  { title: "Certificates", url: "/certificates", icon: ScrollText },
  { title: "Community Map", url: "/community-map", icon: Map },
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
  { title: "Announcements", url: "/academy/announcements", icon: Megaphone },
  { title: "Calendar", url: "/academy/calendar", icon: Calendar },
  { title: "Help & FAQ", url: "/academy/help", icon: HelpCircle },
];

const careerMentorsItems: NavItem[] = [
  { title: "Life Lessons", url: "/academy/lessons", icon: Lightbulb },
];

const buildCreateItems: NavItem[] = [
  { title: "Build Campus", url: "/academy/campus", icon: Building2 },
  { title: "Print Shop", url: "/academy/merch", icon: ShoppingBag },
];

const campusExtrasItems: NavItem[] = [
  { title: "Life Lessons", url: "/academy/lessons", icon: Lightbulb },
];

const aboutItems: NavItem[] = [
  { title: "About / Leadership", url: "/about", icon: Info },
  { title: "Business Plan", url: "/business-plan", icon: Briefcase },
];

const preventionItems: NavItem[] = [
  { title: "Prevention Hub", url: "/prevention", icon: Shield },
  { title: "Prevention Strategies", url: "/prevention-strategies", icon: ShieldCheck },
  { title: "Parent Education", url: "/parent-education", icon: Heart },
  { title: "Facilitator Hub", url: "/facilitator-hub", icon: ClipboardCheck },
];

const healthWellnessItems: NavItem[] = [
  { title: "Health Hub", url: "/health-wellness", icon: Heart },
  { title: "CHW Dashboard", url: "/chw-dashboard", icon: Stethoscope },
];

const researchItems: NavItem[] = [
  { title: "MAP-GAP Framework", url: "/mapgap-framework", icon: RefreshCw },
  { title: "Research Hub", url: "/research-hub", icon: Microscope },
  { title: "Case Studies", url: "/case-studies", icon: BookOpen },
  { title: "Implementation Plan", url: "/implementation", icon: ClipboardList },
  { title: "MAP-GAP CQI", url: "/cqi", icon: Target },
];

const caseManagementItems: NavItem[] = [
  { title: "Reentry Dashboard", url: "/reentry", icon: Shield },
  { title: "Intake Wizard", url: "/intake", icon: ClipboardCheck },
  { title: "My Journey", url: "/my-journey", icon: Rocket },
  { title: "Cohort Onboarding", url: "/cohort-onboarding", icon: Users },
  { title: "Service Delivery", url: "/services", icon: Activity },
  { title: "Community Partners", url: "/partners", icon: Handshake },
  { title: "Outcome Reporting", url: "/outcomes", icon: FileBarChart },
  { title: "Justice Partners", url: "/justice-partners", icon: Scale },
];

const teachingPublicItems: NavItem[] = [
  { title: "Parents", url: "/parents", icon: Users },
  { title: "Parent Dashboard", url: "/parents/dashboard", icon: BarChart3 },
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
  const [isOpen, setIsOpen] = useState(true);
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

        <NavSection label="Community Intelligence" items={communityIntelItems} location={location} />
        <NavSection label="Workforce Solutions" items={workforceSolutionsItems} location={location} />
        <NavSection label="Coalition" items={coalitionItems} location={location} />
        <NavSection label="Grant Engine" items={grantEngineItems} location={location} />
        <NavSection label="AI Tools" items={aiToolsItems} location={location} />
        <NavSection label="Prevention" items={preventionItems} location={location} />
        <NavSection label="Health & Wellness" items={healthWellnessItems} location={location} />
        <NavSection label="Research & Implementation" items={researchItems} location={location} />
        <NavSection label="Case Management" items={caseManagementItems} location={location} />
        {isAuthenticated && (
          <>
            <NavSection label="Student Portal" items={myStudentItems} location={location} />
            <NavSection label="Campus Life" items={campusLifeItems} location={location} />
            <NavSection label="Campus Extras" items={campusExtrasItems} location={location} />
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

        <NavSection label="About" items={aboutItems} location={location} />

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
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <Heart className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>ThriveUp Academy</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
