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
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Home, BookOpen, Award, Brain, Star, GraduationCap,
  Shield, ShieldCheck, ShieldPlus, Swords, Medal, Heart, Sparkles,
  Users, Globe, FileText, LogIn, LogOut, Flame, BarChart3, School, ScrollText, Wand2, Smartphone,
  Rocket, User, TrendingUp, Wallet, Building2, Trophy, Flag, Target, ShoppingBag,
  Zap, CalendarCheck, Lightbulb, Gamepad2, Store, Briefcase, Route,
  Activity, ClipboardCheck, AlertTriangle, Handshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getRankForLevel } from "@/lib/curriculum-data";
import { useAuth } from "@/hooks/use-auth";
import type { StudentProgress } from "@shared/schema";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Subjects", url: "/subjects", icon: GraduationCap },
  { title: "AI Curriculum", url: "/curriculum", icon: Brain },
  { title: "Spark", url: "/ai-companion", icon: Sparkles },
  { title: "Achievements", url: "/achievements", icon: Award },
  { title: "Certificates", url: "/certificates", icon: ScrollText },
  { title: "Classrooms", url: "/classrooms", icon: School },
  { title: "Classroom Wizard", url: "/classrooms/wizard", icon: Wand2 },
  { title: "Teacher Dashboard", url: "/teacher-dashboard", icon: BarChart3 },
  { title: "Curriculum Docs", url: "/curriculum-documents", icon: FileText },
  { title: "Community", url: "/community", icon: Globe },
  { title: "Parents", url: "/parents", icon: Users },
  { title: "Parent Dashboard", url: "/parents/dashboard", icon: BarChart3 },
  { title: "Social Media Literacy", url: "/social-media-literacy", icon: Smartphone },
];

const academyItems = [
  { title: "Panther Village", url: "/academy", icon: Rocket },
  { title: "Panther Power", url: "/academy/power", icon: Zap },
  { title: "Daily Quests", url: "/academy/quests", icon: CalendarCheck },
  { title: "Life Lessons", url: "/academy/lessons", icon: Lightbulb },
  { title: "My Avatar", url: "/academy/avatar", icon: User },
  { title: "Stock Market", url: "/academy/stocks", icon: TrendingUp },
  { title: "My Wallet", url: "/academy/wallet", icon: Wallet },
  { title: "Build Campus", url: "/academy/campus", icon: Building2 },
  { title: "Competitions", url: "/academy/competitions", icon: Trophy },
  { title: "House Points", url: "/academy/houses", icon: Flag },
  { title: "Dream Design", url: "/academy/dreams", icon: Target },
  { title: "Print Shop", url: "/academy/merch", icon: ShoppingBag },
  { title: "Adventures", url: "/academy/scenarios", icon: Gamepad2 },
  { title: "Marketplace", url: "/academy/marketplace", icon: Store },
  { title: "Career Explorer", url: "/academy/careers", icon: Briefcase },
  { title: "My Pathway", url: "/academy/pathway", icon: Route },
  { title: "Mentor Network", url: "/academy/mentors", icon: Users },
  { title: "Find Mentor/Partner", url: "/academy/mentor-finder", icon: Handshake },
  { title: "Longitudinal Dashboard", url: "/academy/longitudinal", icon: BarChart3 },
  { title: "Thrive Dashboard", url: "/academy/thrive", icon: Activity },
  { title: "Daily Check-In", url: "/academy/self-assessment", icon: ClipboardCheck },
  { title: "Arthur's Journey", url: "/academy/tutorial", icon: GraduationCap },
  { title: "Student Wizards", url: "/academy/student-wizard", icon: Wand2 },
  { title: "Admin Dashboard", url: "/academy/admin", icon: BarChart3 },
  { title: "Admin Guide", url: "/academy/admin-tutorial", icon: BookOpen },
];

const rankIcons: Record<string, typeof Shield> = {
  Shield, ShieldCheck, ShieldPlus, Swords, Medal,
};

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
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url || 
                  (item.url === "/subjects" && location.startsWith("/subject")) ||
                  (item.url === "/curriculum" && location.startsWith("/curriculum/")) ||
                  (item.url === "/curriculum-documents" && location.startsWith("/curriculum-documents/")) ||
                  (item.url === "/classrooms" && location.startsWith("/classrooms/")) ||
                  (item.url === "/certificates" && location.startsWith("/certificates/")) ||
                  (item.url !== "/parents" && location.startsWith(item.url + "/"));
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
          <SidebarGroupLabel>TxEA 6th Grade Academy</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {academyItems.map((item) => {
                const isActive = location === item.url ||
                  (item.url === "/academy" && location.startsWith("/academy/") && !academyItems.some(a => a.url !== "/academy" && location === a.url));
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
            <a href="/api/login">
              <Button variant="default" size="sm" className="w-full" data-testid="button-login">
                <LogIn className="mr-2 h-4 w-4" /> Sign In
              </Button>
            </a>
          )
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <Heart className="h-3.5 w-3.5 shrink-0" />
          <span>Education, Character, Leadership</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
