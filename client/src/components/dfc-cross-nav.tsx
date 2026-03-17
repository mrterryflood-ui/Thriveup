import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Shield, Heart, FileBarChart, Target, Globe,
  ShieldCheck, Route, FileText, ArrowRight,
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
    { title: "DFC Reporting", description: "Core measures, surveys, and community readiness", href: "/dfc-reporting", icon: FileBarChart, metricKey: "coreMeasures" },
  ],
  coalition: [
    { title: "DFC Command Center", description: "Unified dashboard across all DFC tools", href: "/dfc-command-center", icon: Target, metricKey: "readinessScore" },
    { title: "DFC Readiness", description: "Application checklist and media campaigns", href: "/dfc-readiness", icon: Target, metricKey: "readinessItems" },
    { title: "Prevention Hub", description: "Youth substance prevention curriculum", href: "/prevention", icon: Shield, metricKey: "youthReached" },
    { title: "Ecosystem Hub", description: "Community partnerships and integration", href: "/ecosystem", icon: Globe },
  ],
  "dfc-reporting": [
    { title: "Prevention Hub", description: "Risk assessment and survey data source", href: "/prevention", icon: Shield, metricKey: "youthReached" },
    { title: "Coalition Dashboard", description: "Sector data and member tracking", href: "/coalition", icon: Users, metricKey: "coalitionMembers" },
    { title: "Community Readiness", description: "Readiness stage and dimension scoring", href: "/dfc-reporting", icon: Target },
    { title: "DFC Readiness", description: "Application checklist and readiness score", href: "/dfc-readiness", icon: Target, metricKey: "readinessItems" },
  ],
  "prevention-strategies": [
    { title: "Prevention Hub", description: "Youth curriculum and risk assessments", href: "/prevention", icon: Shield, metricKey: "youthReached" },
    { title: "Coalition Dashboard", description: "Sector mapping and coalition capacity", href: "/coalition", icon: Users, metricKey: "coalitionMembers" },
    { title: "DFC Reporting", description: "Outcome measurement and RE-AIM dashboard", href: "/dfc-reporting", icon: FileBarChart, metricKey: "coreMeasures" },
  ],
  "dfc-readiness": [
    { title: "Coalition Dashboard", description: "Verify 12-sector eligibility", href: "/coalition", icon: Users, metricKey: "coalitionMembers" },
    { title: "DFC Reporting", description: "Core measures and survey coverage", href: "/dfc-reporting", icon: FileBarChart, metricKey: "coreMeasures" },
    { title: "Grant Narrative", description: "Draft application narrative sections", href: "/grant-narrative", icon: FileText },
    { title: "Logic Model", description: "Build your prevention logic model", href: "/logic-model", icon: Route },
  ],
  "parent-education": [
    { title: "Prevention Hub", description: "Youth substance prevention curriculum", href: "/prevention", icon: Shield, metricKey: "youthReached" },
    { title: "DFC Reporting", description: "Family assessment data and outcomes", href: "/dfc-reporting", icon: FileBarChart, metricKey: "coreMeasures" },
    { title: "Coalition Dashboard", description: "Coalition sector engagement", href: "/coalition", icon: Users, metricKey: "coalitionMembers" },
  ],
};

interface CommandCenterData {
  coalitionHealth: {
    sectorCoverage: number;
    memberCount: number;
    latestCapacityScore: number;
  };
  preventionImpact: {
    youthReached: number;
    activeStrategies: number;
    activeEBPs: number;
  };
  communityEngagement: {
    parentCompletionRate: number;
  };
  grantReadiness: {
    readinessScore: number;
    completedItems: number;
    totalItems: number;
  };
}

function getMetricDisplay(key: string, data: CommandCenterData | undefined): string {
  if (!data) return "";
  switch (key) {
    case "coalitionMembers": return `${data.coalitionHealth.memberCount} members`;
    case "parentCompletion": return `${data.communityEngagement.parentCompletionRate}% complete`;
    case "activeStrategies": return `${data.preventionImpact.activeStrategies} active`;
    case "coreMeasures": return `${data.communityEngagement.surveyCoverage}/10 populations surveyed`;
    case "youthReached": return `${data.preventionImpact.youthReached} youth reached`;
    case "readinessScore": return `${data.grantReadiness.readinessScore}% ready`;
    case "readinessItems": return `${data.grantReadiness.completedItems}/${data.grantReadiness.totalItems} items`;
    default: return "";
  }
}

export function DFCCrossNav({ currentPage }: { currentPage: string }) {
  const items = NAV_MAP[currentPage] || [];

  const { data: commandData } = useQuery<CommandCenterData>({
    queryKey: ["/api/dfc/command-center"],
  });

  if (items.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t" data-testid="section-dfc-cross-nav">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Related DFC Tools</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => {
          const metric = item.metricKey ? getMetricDisplay(item.metricKey, commandData) : "";
          return (
            <Link key={item.href} href={item.href}>
              <Card className="p-4 hover-elevate cursor-pointer" data-testid={`card-cross-nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="flex items-start gap-3">
                  <div className="rounded-md p-2 bg-primary/10 shrink-0">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm">{item.title}</h4>
                      {metric && (
                        <Badge variant="secondary" className="text-[10px]">{metric}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-primary mt-2">
                      Go to <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
