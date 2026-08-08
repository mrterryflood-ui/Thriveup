import { useLocation, Link } from "wouter";
import { Home, Heart, Target, Rocket, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

const TABS = [
  {
    label: "Home",
    labelKey: "shell.tab.home",
    icon: Home,
    href: "/hub",
    prefixes: ["/hub"] as string[],
    exact: ["/hub"] as string[],
  },
  {
    label: "Serve",
    labelKey: "shell.tab.serve",
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
    labelKey: "shell.tab.fund",
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
    labelKey: "shell.tab.grow",
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
    labelKey: "shell.tab.connect",
    icon: Network,
    href: "/hub/connect",
    prefixes: [
      "/hub/connect", "/hub/more", "/workbench", "/partners", "/coalition",
      "/ecosystem", "/coverage", "/about", "/community",
      "/network", "/impact", "/transparency", "/sdoh",
      "/city-comparison", "/research-hub", "/methodology",
      "/case-studies", "/contact", "/privacy",
      "/manor", "/pflugerville", "/austin", "/st-davids",
      "/voice", "/third-spaces", "/neighborhood", "/411",
      "/community-analysis",
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
  const { t } = useLanguage();

  return (
    <nav
      // Pad the bottom by the iOS home-indicator safe-area inset so the
      // interactive row is never covered on notched iPhones. The tappable
      // links keep a 60px min-height for comfortable touch targets.
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/60 flex items-stretch shadow-lg pb-[env(safe-area-inset-bottom)]"
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
              "flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[60px] text-[10px] font-semibold transition-colors duration-150 cursor-pointer select-none",
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
            <span className="leading-none">{t(tab.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
