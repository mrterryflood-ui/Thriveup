import {
  LayoutDashboard, ClipboardList, HandHeart, MessageCircle,
  Sparkles, MapPin, Megaphone, Wrench, FileText,
  Handshake, Users, Building2, Globe, BookMarked,
  Activity, Brain, Map, Microscope, BarChart3,
  TrendingUp, Scale, Search, Link2, Shield,
  Info, DollarSign, RefreshCw, BookOpen, Mail,
  ClipboardCheck, Rocket, Settings,
} from "lucide-react";
import { HubShell, type HubCardDef } from "@/components/hub-shell";
import { useAuth } from "@/hooks/use-auth";

const CARDS: HubCardDef[] = [
  { icon: LayoutDashboard, title: "CTX Benefits Initiative", subtitle: "Central Texas pilot hub",          href: "/st-davids",              tag: "Central Texas", color: "orange" },
  { icon: ClipboardList,   title: "SNAP Navigator",          subtitle: "Food benefits fast",               href: "/benefits-screener",      tag: "Central Texas", color: "amber" },
  { icon: HandHeart,       title: "Benefits Navigator",      subtitle: "Benefits command center",          href: "/benefits",               tag: "Central Texas", color: "emerald" },
  { icon: MessageCircle,   title: "N. Wilco Childcare Voice",subtitle: "Childcare gap community voice",    href: "/voice/north-wilco-childcare-gaps", tag: "Central Texas", color: "teal" },
  { icon: Sparkles,        title: "Regional Briefing",       subtitle: "AI-powered regional intel",        href: "/regional-briefing",      tag: "Central Texas", color: "violet" },
  { icon: MapPin,          title: "Austin Initiative",       subtitle: "Austin program details",           href: "/austin",                 tag: "Central Texas", color: "blue" },
  { icon: MapPin,          title: "Manor Hub",               subtitle: "Manor community hub",              href: "/manor",                  tag: "Central Texas", color: "indigo" },
  { icon: MapPin,          title: "Pflugerville Hub",        subtitle: "Pflugerville community hub",       href: "/pflugerville",           tag: "Central Texas", color: "purple" },
  { icon: Megaphone,       title: "Voices of Austin",        subtitle: "Community storytelling",           href: "/voices-of-austin",       tag: "Central Texas", color: "rose" },
  { icon: Wrench,          title: "CTX Operator Workspace",  subtitle: "Operator tools & setup",           href: "/st-davids-wab2",         tag: "Central Texas", color: "slate",  authOnly: true },
  { icon: FileText,        title: "CTX Initiative Prep",     subtitle: "Proposal preparation",             href: "/stdavids-prep",          tag: "Central Texas", color: "orange", authOnly: true },

  { icon: Handshake,       title: "Community Partners",      subtitle: "Partner organizations",            href: "/partners",               tag: "Partners",      color: "indigo" },
  { icon: Users,           title: "Coalition Dashboard",     subtitle: "Coalition health & metrics",       href: "/coalition",              tag: "Partners",      color: "blue" },
  { icon: Building2,       title: "Collaboration Hub",       subtitle: "Partner workspace",                href: "/collaboration-hub",      tag: "Partners",      color: "slate",  authOnly: true },
  { icon: Handshake,       title: "Vann Partner Hub",        subtitle: "Dr. Vann partnership tools",       href: "/partners/vann-hub",      tag: "Partners",      color: "teal",   authOnly: true },
  { icon: Users,           title: "Family & Program Tracker",subtitle: "Track families & programs",        href: "/partners/family-program-tracker", tag: "Partners", color: "emerald", authOnly: true },
  { icon: Sparkles,        title: "RFP-Match Storyteller",   subtitle: "Align partner stories to RFPs",    href: "/partners/rfp-storyteller",tag: "Partners",     color: "violet", authOnly: true },
  { icon: Globe,           title: "Ecosystem Hub",           subtitle: "Connected platform ecosystem",     href: "/ecosystem",              tag: "Partners",      color: "blue" },
  { icon: BookMarked,      title: "Ecosystem Story",         subtitle: "Our ecosystem narrative",          href: "/ecosystem-story",        tag: "Partners",      color: "indigo" },
  { icon: Activity,        title: "Ecosystem Orchestration", subtitle: "Platform-wide coordination",       href: "/ecosystem-orchestration",tag: "Partners",      color: "purple", authOnly: true },
  { icon: Brain,           title: "Ecosystem AI",            subtitle: "AI-assisted ecosystem tools",      href: "/ecosystem-ai",           tag: "Partners",      color: "violet", authOnly: true },
  { icon: Users,           title: "Advisory Board",          subtitle: "Our advisory board",               href: "/advisory-board",         tag: "Partners",      color: "slate" },
  { icon: Globe,           title: "Community",               subtitle: "ThriveUp community hub",           href: "/community",              tag: "Partners",      color: "cyan" },
  { icon: Map,             title: "Community Map",           subtitle: "Visual community overview",        href: "/community-map",          tag: "Partners",      color: "teal" },
  { icon: Microscope,      title: "Open Innovation Lab",     subtitle: "Research & co-creation",           href: "/open-innovation-lab",    tag: "Partners",      color: "rose" },

  { icon: Map,             title: "Coverage Map",            subtitle: "National coverage overview",       href: "/coverage",               tag: "Impact",        color: "cyan" },
  { icon: HandHeart,       title: "Bring TCAF to Your State",subtitle: "Request TCAF in your area",        href: "/coverage#request",       tag: "Impact",        color: "emerald" },
  { icon: BarChart3,       title: "Live Network View",       subtitle: "Real-time network metrics",        href: "/network",                tag: "Impact",        color: "blue" },
  { icon: Building2,       title: "Third Spaces",            subtitle: "Physical community hubs",          href: "/third-spaces",           tag: "Impact",        color: "indigo" },
  { icon: MapPin,          title: "Neighborhood Intel",      subtitle: "Block-level community data",       href: "/neighborhood",           tag: "Impact",        color: "teal" },
  { icon: Users,           title: "Opportunity Youth",       subtitle: "Youth disconnection data",         href: "/opportunity-youth",      tag: "Impact",        color: "amber" },
  { icon: Activity,        title: "Transparency Dashboard",  subtitle: "Public accountability metrics",    href: "/transparency",           tag: "Impact",        color: "slate" },
  { icon: TrendingUp,      title: "Impact Dashboard",        subtitle: "Community impact metrics",         href: "/impact",                 tag: "Impact",        color: "emerald" },
  { icon: Users,           title: "Pilot Dashboard",         subtitle: "CTX pilot analytics",              href: "/pilot",                  tag: "Impact",        color: "blue",   authOnly: true },
  { icon: Activity,        title: "Dosage Report",           subtitle: "Service dosage tracking",          href: "/dosage",                 tag: "Impact",        color: "orange", authOnly: true },
  { icon: FileText,        title: "Outcome Reporting",       subtitle: "Formal outcome reports",           href: "/outcomes",               tag: "Impact",        color: "slate",  authOnly: true },
  { icon: Link2,           title: "SDOH Impact Chain",       subtitle: "Social determinants pathway",      href: "/sdoh-chain",             tag: "Impact",        color: "violet" },
  { icon: Search,          title: "SDOH Explorer",           subtitle: "Explore SDOH data",                href: "/sdoh-explorer",          tag: "Impact",        color: "indigo" },
  { icon: Scale,           title: "City Comparison",         subtitle: "Compare cities & counties",        href: "/city-comparison",        tag: "Impact",        color: "teal" },

  { icon: Info,            title: "About / Our Structure",   subtitle: "Who we are",                       href: "/about",                  tag: "About",         color: "slate" },
  { icon: DollarSign,      title: "Pricing & Services",      subtitle: "Hub Adoption Kit pricing",         href: "/pricing",                tag: "About",         color: "amber" },
  { icon: Microscope,      title: "Methodology",             subtitle: "Implementation science foundation",href: "/methodology",            tag: "About",         color: "blue" },
  { icon: Microscope,      title: "Research Hub",            subtitle: "Published research & evidence",    href: "/research-hub",           tag: "About",         color: "indigo" },
  { icon: RefreshCw,       title: "MAP-GAP Framework",       subtitle: "Continuous improvement process",   href: "/mapgap-framework",       tag: "About",         color: "teal" },
  { icon: Microscope,      title: "RPLICE Toolkit",          subtitle: "Implementation science tools",     href: "/rplice-tools",           tag: "About",         color: "violet" },
  { icon: BookOpen,        title: "Case Studies",            subtitle: "Documented program outcomes",      href: "/case-studies",           tag: "About",         color: "orange" },
  { icon: Users,           title: "Peer Review",             subtitle: "Academic peer review portal",      href: "/peer-review",            tag: "About",         color: "rose" },
  { icon: ClipboardCheck,  title: "Implementation Plan",     subtitle: "Rollout & fidelity planning",      href: "/implementation",         tag: "About",         color: "emerald" },
  { icon: Mail,            title: "Contact Us",              subtitle: "Get in touch",                     href: "/contact",                tag: "About",         color: "blue" },
  { icon: Shield,          title: "Non-Discrimination",      subtitle: "Our equity commitment",            href: "/non-discrimination",     tag: "About",         color: "slate" },
  { icon: Shield,          title: "Privacy Policy",          subtitle: "How we protect your data",         href: "/privacy",                tag: "About",         color: "slate" },
  { icon: Rocket,          title: "Workbench",               subtitle: "Assemble your custom workspace",   href: "/workbench",              tag: "About",         color: "purple" },
  { icon: Settings,        title: "Organization Profile",    subtitle: "Manage your org settings",         href: "/settings/organization",  tag: "About",         color: "slate",  authOnly: true },
];

export default function HubMorePage() {
  const { isAuthenticated } = useAuth();
  return (
    <HubShell
      title="More"
      subtitle="Central Texas · Partners · Impact · About"
      headerGradient="from-slate-700 via-slate-600 to-slate-800"
      chips={["All", "Central Texas", "Partners", "Impact", "About"]}
      cards={CARDS}
      isAuthenticated={isAuthenticated}
    />
  );
}
