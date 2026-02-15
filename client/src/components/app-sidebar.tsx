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
  PenLine, Megaphone, Calendar, HelpCircle, ClipboardList, Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getRankForLevel } from "@/lib/curriculum-data";
import { useAuth } from "@/hooks/use-auth";
import type { StudentProgress } from "@shared/schema";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface NavSubGroup {
  title: string;
  icon: LucideIcon;
  items: NavItem[];
  defaultOpen?: boolean;
}

const platformItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "AI Curriculum", url: "/curriculum", icon: Brain },
  { title: "Spark", url: "/ai-companion", icon: Sparkles },
  { title: "Community", url: "/community", icon: Globe },
  { title: "Subjects", url: "/subjects", icon: GraduationCap },
  { title: "Achievements", url: "/achievements", icon: Award },
  { title: "Certificates", url: "/certificates", icon: ScrollText },
];

const academySubGroups: NavSubGroup[] = [
  {
    title: "My Student",
    icon: User,
    items: [
      { title: "My Avatar", url: "/academy/avatar", icon: User },
      { title: "Panther Power", url: "/academy/power", icon: Zap },
      { title: "Daily Check-In", url: "/academy/self-assessment", icon: ClipboardCheck },
      { title: "My Pathway", url: "/academy/pathway", icon: Route },
      { title: "Thrive Dashboard", url: "/academy/thrive", icon: Activity },
      { title: "Daily Quests", url: "/academy/quests", icon: CalendarCheck },
      { title: "My Journal", url: "/academy/journal", icon: PenLine },
      { title: "Progress Report", url: "/academy/progress-report", icon: Printer },
    ],
  },
  {
    title: "Campus Life",
    icon: Gamepad2,
    items: [
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
    ],
  },
  {
    title: "Career & Mentors",
    icon: Briefcase,
    items: [
      { title: "Career Explorer", url: "/academy/careers", icon: Briefcase },
      { title: "Mentor Network", url: "/academy/mentors", icon: Users },
      { title: "Find Mentor/Partner", url: "/academy/mentor-finder", icon: Handshake },
      { title: "Dream Design", url: "/academy/dreams", icon: Target },
      { title: "Life Lessons", url: "/academy/lessons", icon: Lightbulb },
    ],
  },
  {
    title: "Build & Create",
    icon: Building2,
    items: [
      { title: "Build Campus", url: "/academy/campus", icon: Building2 },
      { title: "Print Shop", url: "/academy/merch", icon: ShoppingBag },
    ],
  },
  {
    title: "Staff & Admin",
    icon: BarChart3,
    defaultOpen: false,
    items: [
      { title: "Admin Dashboard", url: "/academy/admin", icon: BarChart3 },
      { title: "Admin Guide", url: "/academy/admin-tutorial", icon: BookOpen },
      { title: "Student Wizards", url: "/academy/student-wizard", icon: Wand2 },
      { title: "Arthur's Journey", url: "/academy/tutorial", icon: GraduationCap },
      { title: "Longitudinal Dashboard", url: "/academy/longitudinal", icon: BarChart3 },
      { title: "Attendance", url: "/academy/attendance", icon: ClipboardList },
    ],
  },
];

const teachingItems: NavItem[] = [
  { title: "Classrooms", url: "/classrooms", icon: School },
  { title: "Classroom Wizard", url: "/classrooms/wizard", icon: Wand2 },
  { title: "Teacher Dashboard", url: "/teacher-dashboard", icon: BarChart3 },
  { title: "Parents", url: "/parents", icon: Users },
  { title: "Parent Dashboard", url: "/parents/dashboard", icon: BarChart3 },
  { title: "Curriculum Docs", url: "/curriculum-documents", icon: FileText },
  { title: "Social Media Literacy", url: "/social-media-literacy", icon: Smartphone },
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
  if (url !== "/parents" && url !== "/academy" && location.startsWith(url + "/")) return true;
  return false;
}

function groupContainsActive(location: string, items: NavItem[]): boolean {
  return items.some((item) => isItemActive(location, item.url));
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: progress } = useQuery<StudentProgress>({
    queryKey: ["/api/progress"],
  });

  const rank = progress ? getRankForLevel(progress.currentLevel) : null;
  const RankIcon = rank ? (rankIcons[rank.icon] || Shield) : Shield;

  const initials = user
    ? ((user.firstName?.[0] || "") + (user.lastName?.[0] || "")).toUpperCase() || (user.email?.[0]?.toUpperCase() || "?")
    : "?";

  const anyAcademyActive = useMemo(() => {
    return location.startsWith("/academy");
  }, [location]);

  const teachingActive = useMemo(() => {
    return groupContainsActive(location, teachingItems);
  }, [location]);

  const [schoolOpen, setSchoolOpen] = useState(true);
  const [gradeOpen, setGradeOpen] = useState(true);
  const [teachingOpen, setTeachingOpen] = useState(false);

  const resolvedTeachingOpen = teachingOpen || teachingActive;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer" data-testid="link-home">
            <div className="rounded-md p-1.5 bg-gradient-to-br from-rose-900 to-red-950">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">TxEA</p>
              <p className="text-xs text-muted-foreground leading-tight">Panthers</p>
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
                    <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" data-testid="text-sidebar-username">
                      {user.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}` : user.email || "Student"}
                    </p>
                    {progress && progress.streakDays > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Flame className="h-3 w-3 text-orange-500" />
                        <span>{progress.streakDays} day streak</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platformItems.map((item) => {
                const isActive = isItemActive(location, item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      data-active={isActive}
                      className={isActive ? "bg-sidebar-accent" : ""}
                      data-testid={`link-sidebar-${item.title.toLowerCase().replace(/\s/g, '-')}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>School / Classroom</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible open={schoolOpen} onOpenChange={setSchoolOpen} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton data-testid="link-sidebar-txea-panthers">
                      <School className="h-4 w-4" />
                      <span>TxEA Panthers</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <Collapsible open={gradeOpen} onOpenChange={setGradeOpen} className="group/grade">
                        <SidebarMenuSubItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuSubButton data-testid="link-sidebar-6th-grade-academy" className="cursor-pointer">
                              <GraduationCap className="h-4 w-4" />
                              <span>6th Grade Academy</span>
                              <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/grade:rotate-90" />
                            </SidebarMenuSubButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              <SidebarMenuSubItem>
                                {(() => {
                                  const isActive = location === "/academy" && !location.startsWith("/academy/");
                                  return (
                                    <SidebarMenuSubButton
                                      asChild
                                      data-active={isActive}
                                      className={isActive ? "bg-sidebar-accent" : ""}
                                      data-testid="link-sidebar-panther-village"
                                    >
                                      <Link href="/academy">
                                        <Rocket className="h-4 w-4" />
                                        <span>Panther Village</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  );
                                })()}
                              </SidebarMenuSubItem>

                              {academySubGroups.map((group) => {
                                const hasActive = groupContainsActive(location, group.items);
                                const defaultShouldOpen = group.defaultOpen !== false ? false : false;
                                return (
                                  <CollapsibleSubGroup
                                    key={group.title}
                                    group={group}
                                    location={location}
                                    forceOpen={hasActive}
                                    defaultOpen={group.defaultOpen ?? false}
                                  />
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuSubItem>
                      </Collapsible>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible open={resolvedTeachingOpen} onOpenChange={setTeachingOpen} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton data-testid="link-sidebar-teaching-&-parents">
                      <Users className="h-4 w-4" />
                      <span>Teaching & Parents</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {teachingItems.map((item) => {
                        const isActive = isItemActive(location, item.url);
                        return (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton
                              asChild
                              data-active={isActive}
                              className={isActive ? "bg-sidebar-accent" : ""}
                              data-testid={`link-sidebar-${item.title.toLowerCase().replace(/\s/g, '-')}`}
                            >
                              <Link href={item.url}>
                                <item.icon className="h-4 w-4" />
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

        {rank && (
          <SidebarGroup>
            <SidebarGroupLabel>Your Rank</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-3 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                    <RankIcon className="h-4.5 w-4.5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight" data-testid="text-sidebar-rank">{rank.title}</p>
                    {rank.stars > 0 ? (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {Array.from({ length: rank.stars }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-amber-500 text-amber-500" />
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
      <SidebarFooter className="p-4">
        {!authLoading && (
          isAuthenticated ? (
            <a href="/api/logout">
              <Button variant="ghost" size="sm" className="w-full justify-start" data-testid="button-logout">
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </a>
          ) : (
            <div className="space-y-1.5">
              <a href="/api/login">
                <Button variant="default" size="sm" className="w-full" data-testid="button-login">
                  <LogIn className="mr-2 h-4 w-4" /> Sign In
                </Button>
              </a>
              <p className="text-[10px] text-muted-foreground text-center" data-testid="text-login-hint">
                Use your school email or Google account
              </p>
            </div>
          )
        )}
        <Link href="/privacy">
          <Button variant="ghost" size="sm" className="w-full justify-start" data-testid="link-privacy-policy">
            <Shield className="mr-2 h-4 w-4" /> Privacy Policy
          </Button>
        </Link>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <Heart className="h-3.5 w-3.5 shrink-0" />
          <span>Education, Character, Leadership</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function CollapsibleSubGroup({
  group,
  location,
  forceOpen,
  defaultOpen,
}: {
  group: NavSubGroup;
  location: string;
  forceOpen: boolean;
  defaultOpen: boolean;
}) {
  const [userOpen, setUserOpen] = useState(defaultOpen);
  const isOpen = userOpen || forceOpen;

  return (
    <Collapsible open={isOpen} onOpenChange={setUserOpen} className="group/subgroup">
      <SidebarMenuSubItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuSubButton
            className="cursor-pointer"
            data-testid={`link-sidebar-${group.title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <group.icon className="h-4 w-4" />
            <span>{group.title}</span>
            <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/subgroup:rotate-90" />
          </SidebarMenuSubButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {group.items.map((item) => {
              const isActive = isItemActive(location, item.url);
              return (
                <SidebarMenuSubItem key={item.title}>
                  <SidebarMenuSubButton
                    asChild
                    data-active={isActive}
                    className={isActive ? "bg-sidebar-accent" : ""}
                    data-testid={`link-sidebar-${item.title.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuSubItem>
    </Collapsible>
  );
}
