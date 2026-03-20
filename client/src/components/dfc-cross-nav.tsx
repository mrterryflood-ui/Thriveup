import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import {
  Users, Shield, Heart, Globe,
  ShieldCheck, FileText, ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface CrossNavItem {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  metricKey?: string;
}

const NAV_MAP: Record<string, CrossNavItem[]> = {
  prevention: [
    { title: "Coalition Dashboard", description: "Manage your 12-sector DFC coalition", href: "/coalition", icon: Users, metricKey: "coalitionMembers" },
    { title: "Parent Education", description: "Family engagement and education modules", href: "/parent-education", icon: Heart, metricKey: "parentCompletion" },
    { title: "Prevention Strategies", description: "EBPs, environmental strategies, and CFIR", href: "/prevention-strategies", icon: ShieldCheck, metricKey: "activeStrategies" },
  ],
  coalition: [
    { title: "Prevention Hub", description: "Youth substance prevention curriculum", href: "/prevention", icon: Shield, metricKey: "youthReached" },
    { title: "Ecosystem Hub", description: "Community partnerships and integration", href: "/ecosystem", icon: Globe },
    { title: "Grant Narrative", description: "Draft application narrative sections", href: "/grant-narrative", icon: FileText },
  ],
  "prevention-strategies": [
    { title: "Prevention Hub", description: "Youth curriculum and risk assessments", href: "/prevention", icon: Shield, metricKey: "youthReached" },
    { title: "Coalition Dashboard", description: "Sector mapping and coalition capacity", href: "/coalition", icon: Users, metricKey: "coalitionMembers" },
  ],
  "parent-education": [
    { title: "Prevention Hub", description: "Youth substance prevention curriculum", href: "/prevention", icon: Shield, metricKey: "youthReached" },
    { title: "Coalition Dashboard", description: "Coalition sector engagement", href: "/coalition", icon: Users, metricKey: "coalitionMembers" },
  ],
};


export function DFCCrossNav({ currentPage }: { currentPage: string }) {
  const items = NAV_MAP[currentPage] || [];

  if (items.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t" data-testid="section-dfc-cross-nav">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Related Tools</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="p-4 hover-elevate cursor-pointer" data-testid={`card-cross-nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="flex items-start gap-3">
                <div className="rounded-md p-2 bg-primary/10 shrink-0">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-primary mt-2">
                    Go to <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
