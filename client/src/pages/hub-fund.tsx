import {
  Calendar, Target, Trophy, ClipboardCheck,
  ShieldCheck, FileText, PenLine, Package,
  Users, Search, Route, Briefcase,
  Presentation, PenTool, Landmark, Stethoscope,
  FileBarChart, DollarSign, Zap, BarChart3,
} from "lucide-react";
import { HubShell, type HubCardDef } from "@/components/hub-shell";
import { useAuth } from "@/hooks/use-auth";
import { useHubRole } from "@/lib/hub-role";

const CARDS: HubCardDef[] = [
  { icon: Calendar,      title: "This Week",              subtitle: "Monday Grant Brief",               href: "/this-week",              tag: "Opportunities", variant: "hero", color: "amber" },
  { icon: Target,        title: "Live Grant Opportunities",subtitle: "721 grants tracked",              href: "/grants",                 tag: "Opportunities", variant: "hero", color: "orange" },
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

export default function HubFundPage() {
  const { isAuthenticated } = useAuth();
  const { role } = useHubRole();
  return (
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
    />
  );
}
