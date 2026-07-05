import {
  Calendar, Target, Trophy, ClipboardCheck,
  ShieldCheck, FileText, PenLine, Package,
  Users, Search, Route, Briefcase,
  Presentation, PenTool, Landmark, Stethoscope,
  FileBarChart, DollarSign, Zap, BarChart3,
  Sparkles, Star, Clock, ExternalLink, ArrowRight,
} from "lucide-react";
import { HubShell, type HubCardDef } from "@/components/hub-shell";
import { OrchestraStrip } from "@/components/orchestra-strip";
import { useAuth } from "@/hooks/use-auth";
import { useHubRole } from "@/lib/hub-role";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

const CARDS: HubCardDef[] = [
  { icon: Calendar,      title: "This Week",              subtitle: "Monday Grant Brief",               href: "/this-week",              tag: "Opportunities", variant: "hero", color: "amber" },
  { icon: Target,        title: "Live Grant Opportunities",subtitle: "Funding intelligence for your mission", href: "/grants",            tag: "Opportunities", variant: "hero", color: "orange" },
  { icon: FileText,      title: "RFP / Narrative Writer", subtitle: "AI-powered proposal writing",     href: "/grant-narrative",        tag: "Writing",       variant: "hero", color: "blue",    authOnly: true, roles: ["grant", "admin", "org"] },
  { icon: ShieldCheck,   title: "RFP Fidelity Engine",    subtitle: "Rubric-first compliance check",   href: "/rfp-fidelity",           tag: "Writing",       variant: "hero", color: "indigo",  authOnly: true, roles: ["grant", "admin", "org"] },
  { icon: Trophy,        title: "My Grants & Win Rate",   subtitle: "Track your grant pipeline",        href: "/my-grants",              tag: "Applications",  color: "amber",  authOnly: true, roles: ["grant", "admin", "org"] },
  { icon: ClipboardCheck,title: "Application Tracker",    subtitle: "Status across all submissions",    href: "/grants/applications",    tag: "Applications",  color: "orange", authOnly: true, roles: ["grant", "admin", "org"] },
  { icon: PenLine,       title: "LOI Writer",             subtitle: "Letter of Intent drafting",        href: "/loi-writer",             tag: "Writing",       color: "blue",   authOnly: true, roles: ["grant", "admin", "org"] },
  { icon: Package,       title: "Grant Packages",         subtitle: "Submission packages library",      href: "/grant-packages",         tag: "Writing",       color: "teal",   authOnly: true, roles: ["grant", "admin", "org"] },
  { icon: Trophy,        title: "Winning Proposals",      subtitle: "Library of funded proposals",      href: "/won-proposals",          tag: "Writing",       color: "amber",  authOnly: true, roles: ["grant", "admin", "org"] },
  { icon: PenTool,       title: "E-Sign Center",          subtitle: "Digital signature workflow",       href: "/esign",                  tag: "Writing",       color: "slate",  authOnly: true, roles: ["grant", "admin", "org"] },
  { icon: Users,         title: "Teaming Network",        subtitle: "Capabilities & partner matching",  href: "/teaming-network",        tag: "Analytics",     color: "indigo", authOnly: true, roles: ["grant", "admin", "org"] },
  { icon: Search,        title: "Prior Award Research",   subtitle: "What funders have funded before",  href: "/grant-prior-awards",     tag: "Analytics",     color: "violet", authOnly: true, roles: ["grant", "admin", "org"] },
  { icon: Route,         title: "Logic Model",            subtitle: "Theory of change builder",         href: "/logic-model",            tag: "Analytics",     color: "blue",   authOnly: true, roles: ["grant", "admin", "org"] },
  { icon: Briefcase,     title: "Staffing Plan",          subtitle: "Personnel & budget planning",      href: "/staffing-plan",          tag: "Analytics",     color: "slate",  authOnly: true, roles: ["grant", "admin", "org"] },
  { icon: Presentation,  title: "Stakeholder Deck",       subtitle: "Funder-ready presentations",       href: "/presentations",          tag: "Analytics",     color: "purple", authOnly: true, roles: ["grant", "admin", "org"] },
  { icon: Landmark,      title: "APEX Accelerators",      subtitle: "Federal contracting support",      href: "/apex-accelerators",      tag: "Opportunities", color: "indigo" },
  { icon: FileBarChart,  title: "Sedgwick Vitality",      subtitle: "RFP 26-0028 workspace",            href: "/grants/sedgwick-vitality",tag: "Applications", color: "rose",   authOnly: true, roles: ["grant", "admin", "org"] },
  { icon: Stethoscope,   title: "Healthcare Grants",      subtitle: "Healthcare-specific catalog",      href: "/healthcare-grants",      tag: "Opportunities", color: "emerald", authOnly: true, roles: ["grant", "admin", "org", "chw"] },
  { icon: DollarSign,    title: "AI Consulting",          subtitle: "AI consulting services",           href: "/ai-consulting",          tag: "Opportunities", color: "blue" },
  { icon: Zap,           title: "Proposal Command",       subtitle: "Full proposal management",         href: "/proposal-command",       tag: "Applications",  color: "amber",  authOnly: true, roles: ["grant", "admin", "org"] },
  { icon: BarChart3,     title: "Platform Metrics",       subtitle: "Grant performance analytics",      href: "/platform-metrics",       tag: "Analytics",     color: "slate",  authOnly: true, roles: ["admin"] },
];

const SPOTLIGHT_GRANTS = [
  {
    id: "wsnt-child-care",
    title: "NORTEX Child Care Workforce",
    funder: "EDA / WSNT Region",
    amount: "$485,000",
    deadline: "Aug 22, 2026",
    fit: 94,
    href: "/grants",
    badge: "High Fit",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    desc: "Workforce infrastructure for child care provider pipeline in North Texas. Matches TCAF's CBI + CFIR capability stack.",
  },
  {
    id: "doj-reentry",
    title: "DOJ Second Chance Act Reentry",
    funder: "U.S. Dept. of Justice",
    amount: "$1,000,000",
    deadline: "Sep 5, 2026",
    fit: 88,
    href: "/grants",
    badge: "High Fit",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    desc: "Reentry services for justice-involved adults. TCAF's NRRC model and RNR-aligned workforce pathways are a direct match.",
  },
  {
    id: "hrsa-chw",
    title: "HRSA CHW Training Grant",
    funder: "Health Resources & Services",
    amount: "$750,000",
    deadline: "Oct 1, 2026",
    fit: 91,
    href: "/grants",
    badge: "Strong Match",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    desc: "CHW training and certification pathway funding. Directly funds the ITI shadow-worker-to-CHW pipeline.",
  },
];

export default function HubFundPage() {
  const { isAuthenticated } = useAuth();
  const { role } = useHubRole();

  return (
    <div data-testid="page-hub-fund">
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" aria-hidden="true" />
            <h2 className="font-bold text-base" data-testid="text-spotlight-heading">Top 3 Grant Picks — July 2026</h2>
            <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">AI-Ranked by Fit</Badge>
          </div>
          <Link href="/grant-command-center">
            <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1" data-testid="link-full-command-center">
              Full Command Center <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </span>
          </Link>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 mb-6" data-testid="grid-grant-spotlight">
          {SPOTLIGHT_GRANTS.map(grant => (
            <Card key={grant.id} className="border border-amber-200 dark:border-amber-800/60 hover:shadow-md transition-shadow" data-testid={`card-spotlight-${grant.id}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${grant.badgeColor}`}>{grant.badge}</span>
                    </div>
                    <p className="font-semibold text-sm leading-snug" data-testid={`text-spotlight-title-${grant.id}`}>{grant.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{grant.funder}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{grant.desc}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="font-bold text-sm text-emerald-700 dark:text-emerald-400" data-testid={`text-spotlight-amount-${grant.id}`}>{grant.amount}</p>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      <span>{grant.deadline}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Star className="h-3 w-3 text-amber-500" aria-hidden="true" />
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">{grant.fit}%</span>
                    </div>
                    <Link href={grant.href}>
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 mt-1" data-testid={`button-spotlight-view-${grant.id}`}>
                        View <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <HubShell
        title="Get Funded"
        subtitle="Grants · Proposals · Compliance · Analytics"
        headerGradient="from-amber-500 via-orange-500 to-amber-700"
        chips={["All", "Opportunities", "Writing", "Applications", "Analytics"]}
        cards={CARDS}
        isAuthenticated={isAuthenticated}
        role={role}
        itiSurface="public-site"
        itiContext="fund-hub"
        itiPrompt="Do you support your community without formal grant funding?"
        itiRoleTags={["Promotora", "Peer Navigator", "Informal Caseworker", "Community Organizer", "Shadow Workforce"]}
        extra={<OrchestraStrip hub="fund" />}
      />
    </div>
  );
}
