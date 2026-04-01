import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import {
  Users, Shield, Heart, Globe, MapPin, Link2,
  ShieldCheck, FileText, ArrowRight, ClipboardCheck,
  Brain, BarChart3, Target, Network, Search,
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
    { title: "LOI Writer", description: "Draft & validate your 500-word LOI with real data", href: "/loi-writer", icon: FileText },
    { title: "Benefits Screener", description: "9-program screening tool for field use", href: "/benefits-screener", icon: ClipboardCheck },
    { title: "SDOH Impact Chain", description: "Visualize the poverty → crime chain across 5 counties", href: "/sdoh-chain", icon: Link2 },
    { title: "Community Map", description: "GIS tract-level enrollment gaps and barriers", href: "/community-map", icon: MapPin },
    { title: "Ecosystem Hub", description: "24-platform ecosystem command center", href: "/ecosystem", icon: Network },
    { title: "Grant Hub", description: "Full grant management and narrative builder", href: "/grants", icon: Target },
    { title: "SDOH Explorer", description: "Public, replicable SDOH analysis for any US county", href: "/sdoh-explorer", icon: Search },
  ],
  "loi-writer": [
    { title: "Coalition Portal", description: "Partner data, county summaries, and coalition structure", href: "/coalition", icon: Users },
    { title: "SDOH Impact Chain", description: "Poverty → education → benefits → crime chain with data", href: "/sdoh-chain", icon: Link2 },
    { title: "Benefits Screener", description: "9-program screener feeding real enrollment data", href: "/benefits-screener", icon: ClipboardCheck },
    { title: "Community Map", description: "GIS view of tract-level gaps and barriers", href: "/community-map", icon: MapPin },
    { title: "Ecosystem Hub", description: "24-platform command center", href: "/ecosystem", icon: Network },
    { title: "SDOH Explorer", description: "Public, replicable analysis — share with anyone", href: "/sdoh-explorer", icon: Search },
  ],
  "benefits-screener": [
    { title: "Coalition Portal", description: "See how screenings feed the 5-county strategy", href: "/coalition", icon: Users },
    { title: "LOI Writer", description: "Screening data powers the LOI narrative", href: "/loi-writer", icon: FileText },
    { title: "SDOH Impact Chain", description: "Where screenings break the poverty chain", href: "/sdoh-chain", icon: Link2 },
    { title: "Community Map", description: "Map view of enrollment gaps by tract", href: "/community-map", icon: MapPin },
  ],
  "sdoh-chain": [
    { title: "Coalition Portal", description: "Partner network addressing each chain link", href: "/coalition", icon: Users },
    { title: "LOI Writer", description: "Turn chain analysis into grant narrative", href: "/loi-writer", icon: FileText },
    { title: "Benefits Screener", description: "Direct intervention — screen families now", href: "/benefits-screener", icon: ClipboardCheck },
    { title: "Community Map", description: "See the chain geographically by census tract", href: "/community-map", icon: MapPin },
    { title: "Grant Hub", description: "Full grant strategy and narrative", href: "/grants", icon: Target },
    { title: "SDOH Explorer", description: "Replicable public analysis — verify every number", href: "/sdoh-explorer", icon: Search },
  ],
  "community-map": [
    { title: "SDOH Impact Chain", description: "Chain analysis for the tracts you're viewing", href: "/sdoh-chain", icon: Link2 },
    { title: "Coalition Portal", description: "Partner coverage for these neighborhoods", href: "/coalition", icon: Users },
    { title: "LOI Writer", description: "Use this geographic data in the LOI", href: "/loi-writer", icon: FileText },
    { title: "Benefits Screener", description: "Screen families in these tracts", href: "/benefits-screener", icon: ClipboardCheck },
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
