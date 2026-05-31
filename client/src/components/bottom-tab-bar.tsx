import { useLocation, Link } from "wouter";
import { Home, Heart, Target, Rocket, Network } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  {
    label: "Home",
    icon: Home,
    href: "/hub",
    prefixes: ["/hub"] as string[],
    exact: ["/hub"] as string[],
  },
  {
    label: "Serve",
    icon: Heart,
    href: "/hub/serve",
    prefixes: [
      "/hub/serve", "/benefits", "/foster-youth", "/reentry",
      "/veterans", "/behavioral-health", "/prevention",
      "/resources", "/intake", "/resident-journey",
      "/resource-directory", "/my-journey", "/services",
      "/case-manager", "/cohort-onboarding", "/chw-",
      "/health-", "/parent-education", "/justice-",
    ] as string[],
  },
  {
    label: "Fund",
    icon: Target,
    href: "/hub/fund",
    prefixes: [
      "/hub/fund", "/grants", "/my-grants", "/rfp-fidelity",
      "/grant-narrative", "/loi-writer", "/grant-packages",
      "/won-proposals", "/teaming-network", "/grant-prior-awards",
      "/logic-model", "/staffing-plan", "/esign",
      "/apex-accelerators", "/this-week", "/presentations",
      "/healthcare-grants", "/sedgwick",
    ] as string[],
  },
  {
    label: "Grow",
    icon: Rocket,
    href: "/hub/grow",
    prefixes: [
      "/hub/grow", "/academy", "/subjects", "/subject/",
      "/curriculum", "/workforce", "/mentorship",
      "/apprenticeship", "/fafsa-navigator", "/ai-tools",
      "/ai-companion", "/sparky", "/navigator", "/ai-workforce",
      "/transition-plans", "/dream-",
    ] as string[],
  },
  {
    label: "Connect",
    icon: Network,
    href: "/hub/connect",
    prefixes: [
      "/hub/connect", "/hub/more", "/workbench", "/partners", "/coalition",
      "/ecosystem", "/coverage", "/about", "/community",
      "/network", "/impact", "/transparency", "/sdoh",
      "/city-comparison", "/research-hub", "/methodology",
      "/case-studies", "/contact", "/privacy",
      "/manor", "/pflugerville", "/austin", "/st-davids",
      "/voice", "/third-spaces", "/neighborhood",
      "/advisory", "/open-innovation", "/opportunity-youth",
      "/peer-review", "/pricing", "/rplice", "/mapgap",
      "/pilot", "/dosage", "/outcomes", "/platform-metrics",
    ] as string[],
  },
] as const;

function isTabActive(location: string, tab: (typeof TABS)[number]): boolean {
  return tab.prefixes.some(p => {
    if (p.endsWith("/") || p === location) return location === p || location.startsWith(p);
    return location === p || location.startsWith(p + "/") || location.startsWith(p + "?");
  });
}

export function BottomTabBar() {
  const [location] = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/60 flex items-stretch h-[60px] shadow-lg"
      data-testid="nav-bottom-tab-bar"
    >
      {TABS.map(tab => {
        const active = isTabActive(location, tab);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors duration-150 cursor-pointer select-none",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            data-testid={`tab-${tab.label.toLowerCase()}`}
          >
            <span className={cn(
              "flex items-center justify-center w-10 h-6 rounded-full transition-all duration-150",
              active && "bg-primary/10"
            )}>
              <Icon className={cn("w-[18px] h-[18px]", active && "stroke-[2.5]")} />
            </span>
            <span className="leading-none">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
