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
  Users, Globe
} from "lucide-react";
import { getRankForLevel } from "@/lib/curriculum-data";
import type { StudentProgress } from "@shared/schema";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Subjects", url: "/subjects", icon: GraduationCap },
  { title: "AI Curriculum", url: "/curriculum", icon: Brain },
  { title: "Spark", url: "/ai-companion", icon: Sparkles },
  { title: "Achievements", url: "/achievements", icon: Award },
  { title: "Community", url: "/community", icon: Globe },
  { title: "Parents", url: "/parents", icon: Users },
];

const rankIcons: Record<string, typeof Shield> = {
  Shield, ShieldCheck, ShieldPlus, Swords, Medal,
};

export function AppSidebar() {
  const [location] = useLocation();
  const { data: progress } = useQuery<StudentProgress>({
    queryKey: ["/api/progress"],
  });

  const rank = progress ? getRankForLevel(progress.currentLevel) : null;
  const RankIcon = rank ? (rankIcons[rank.icon] || Shield) : Shield;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer" data-testid="link-home">
            <div className="rounded-md p-1.5 bg-gradient-to-br from-violet-500 to-indigo-600">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Learning</p>
              <p className="text-xs text-muted-foreground leading-tight">Academy</p>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url || 
                  (item.url === "/subjects" && location.startsWith("/subject")) ||
                  (item.url === "/curriculum" && location.startsWith("/curriculum")) ||
                  location.startsWith(item.url + "/");
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Heart className="h-3.5 w-3.5 shrink-0" />
          <span>Supporting the whole child</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
