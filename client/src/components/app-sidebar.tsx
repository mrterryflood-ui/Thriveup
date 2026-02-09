import { useLocation, Link } from "wouter";
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
  Home, BookOpen, Award, Brain, Compass
} from "lucide-react";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Curriculum", url: "/curriculum", icon: BookOpen },
  { title: "Achievements", url: "/achievements", icon: Award },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer" data-testid="link-home">
            <div className="rounded-md p-1.5 bg-gradient-to-br from-violet-500 to-indigo-600">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">AI Mastery</p>
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
                const isActive = location === item.url || location.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      data-active={isActive}
                      className={isActive ? "bg-sidebar-accent" : ""}
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
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Compass className="h-3.5 w-3.5 shrink-0" />
          <span>Guiding the AI generation</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
