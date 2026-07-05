import {
  Network, Megaphone, Globe, Users, Map,
  Mic, BarChart3, Microscope, TrendingUp,
  Activity, BookMarked, Handshake, Building2,
  MessageCircle, Radio, Sparkles, Heart,
  ExternalLink, MapPin, Search, Info,
  DollarSign, Mail, RefreshCw, BookOpen,
} from "lucide-react";
import { HubShell, type HubCardDef } from "@/components/hub-shell";
import { OrchestraStrip } from "@/components/orchestra-strip";
import { useAuth } from "@/hooks/use-auth";
import { useHubRole } from "@/lib/hub-role";

const CARDS: HubCardDef[] = [
  { icon: Heart,        title: "Join the Foundation Network",  subtitle: "Affiliates get platform access, grant support & shared outcomes", href: "/partners/join",          tag: "Network",   variant: "hero", color: "teal",   badge: "New" },
  { icon: MessageCircle,title: "Community Voice",              subtitle: "Community tells us what's missing — we act on it",               href: "/voice",                  tag: "Media",     variant: "hero", color: "violet" },
  { icon: Globe,        title: "Civic Signal",                 subtitle: "1,448 court records · 880 ordinances · 360 meetings — live",     href: "https://power2thepeople.net", tag: "Civic", variant: "hero", color: "indigo", badge: "Live" },
  { icon: Megaphone,    title: "Voices of Austin",             subtitle: "Community storytelling — real people, real outcomes",            href: "/voices-of-austin",       tag: "Media",     variant: "hero", color: "rose" },

  { icon: Users,        title: "Coalition Dashboard",          subtitle: "Health & metrics for the full partner network",                  href: "/coalition",              tag: "Network",   color: "blue" },
  { icon: Handshake,    title: "Community Partners",           subtitle: "Organizations in the Foundation Network",                        href: "/partners",               tag: "Network",   color: "indigo" },
  { icon: Building2,    title: "Collaboration Hub",            subtitle: "Partner workspace — shared tools & coordination",                href: "/collaboration-hub",      tag: "Network",   color: "slate",  authOnly: true, roles: ["admin", "org", "grant"] },
  { icon: Sparkles,     title: "RFP-Match Storyteller",        subtitle: "Align partner stories to RFP rubrics",                          href: "/partners/rfp-storyteller",tag: "Network",  color: "violet", authOnly: true, roles: ["admin", "grant", "org"] },
  { icon: Network,      title: "Ecosystem Hub",                subtitle: "All 25 platforms — one view",                                   href: "/ecosystem",              tag: "Network",   color: "blue" },
  { icon: BookMarked,   title: "Ecosystem Story",              subtitle: "The backbone narrative — for funders and partners",              href: "/ecosystem-story",        tag: "Network",   color: "indigo" },
  { icon: Activity,     title: "Ecosystem Orchestration",      subtitle: "Platform-wide coordination & directive enforcement",             href: "/ecosystem-orchestration",tag: "Network",  color: "purple", authOnly: true, roles: ["admin"] },

  { icon: Mic,          title: "Morning with Meredith",        subtitle: "Community podcast — routes listeners into the platform",         href: "https://meredithsisnett.com", tag: "Media", color: "rose" },
  { icon: Radio,        title: "Community Calendar",           subtitle: "Events, coalitions, and public meetings",                       href: "/community",              tag: "Media",     color: "cyan" },
  { icon: Map,          title: "Community Map",                subtitle: "Visual overview of who we serve and where",                     href: "/community-map",          tag: "Media",     color: "teal" },
  { icon: Microscope,   title: "Open Innovation Lab",          subtitle: "Research, co-creation, and evidence building",                  href: "/open-innovation-lab",    tag: "Media",     color: "rose" },

  { icon: Globe,        title: "Civic Signal (power2thepeople.net)", subtitle: "Live civic feed — courts, ordinances, public meetings",   href: "https://power2thepeople.net", tag: "Civic", color: "indigo" },
  { icon: Search,       title: "SDOH Explorer",                subtitle: "Neighborhood-by-neighborhood social determinants data",         href: "/sdoh-explorer",          tag: "Civic",     color: "blue" },
  { icon: Map,          title: "Coverage Map",                 subtitle: "National coverage — 50-state architecture",                    href: "/coverage",               tag: "Civic",     color: "cyan" },
  { icon: MapPin,       title: "Bring TCAF to Your State",     subtitle: "Request the Foundation Network in your community",             href: "/coverage#request",       tag: "Civic",     color: "emerald" },
  { icon: BarChart3,    title: "Live Network View",            subtitle: "Real-time ecosystem metrics",                                   href: "/network",                tag: "Civic",     color: "blue" },
  { icon: Building2,    title: "Third Spaces",                 subtitle: "Physical community hubs — libraries, churches, centers",        href: "/third-spaces",           tag: "Civic",     color: "indigo" },
  { icon: MapPin,       title: "Neighborhood Intel",           subtitle: "Block-level data for any U.S. neighborhood",                   href: "/neighborhood",           tag: "Civic",     color: "teal" },

  { icon: TrendingUp,   title: "Impact Dashboard",             subtitle: "Community impact — verified and public",                        href: "/impact",                 tag: "Impact",    color: "emerald" },
  { icon: Activity,     title: "Transparency Dashboard",       subtitle: "What we promised vs. what we delivered",                       href: "/transparency",           tag: "Impact",    color: "slate" },
  { icon: BarChart3,    title: "Dosage Report",                subtitle: "Service dosage tracking",                                      href: "/dosage",                 tag: "Impact",    color: "orange", authOnly: true, roles: ["admin", "chw"] },
  { icon: Activity,     title: "Outcome Reporting",            subtitle: "Formal outcome reports for funders",                            href: "/outcomes",               tag: "Impact",    color: "slate",  authOnly: true, roles: ["admin", "grant", "org"] },

  { icon: Info,         title: "About / Our Structure",        subtitle: "Who we are, how we're organized",                              href: "/about",                  tag: "About",     color: "slate" },
  { icon: DollarSign,   title: "Pricing & Services",           subtitle: "Hub Adoption Kit — how partners plug in",                      href: "/pricing",                tag: "About",     color: "amber" },
  { icon: Microscope,   title: "Methodology",                  subtitle: "Implementation science foundation — CFIR, RE-AIM, RNR",        href: "/methodology",            tag: "About",     color: "blue" },
  { icon: BookOpen,     title: "Case Studies",                 subtitle: "Evidence from communities we've served",                       href: "/case-studies",           tag: "About",     color: "indigo" },
  { icon: Users,        title: "Advisory Board",               subtitle: "The people who keep us accountable",                           href: "/advisory-board",         tag: "About",     color: "slate" },
  { icon: RefreshCw,    title: "MAP-GAP Framework",            subtitle: "Continuous improvement methodology",                           href: "/mapgap-framework",       tag: "About",     color: "teal" },
  { icon: Mail,         title: "Contact Us",                   subtitle: "Get in touch — partners, funders, community",                  href: "/contact",                tag: "About",     color: "slate" },
];

export default function HubConnectPage() {
  const { isAuthenticated } = useAuth();
  const { role } = useHubRole();
  return (
    <HubShell
      title="Connect"
      subtitle="Foundation Network · Media · Civic · Impact · About"
      headerGradient="from-teal-600 via-cyan-600 to-teal-800"
      chips={["All", "Network", "Media", "Civic", "Impact", "About"]}
      cards={CARDS}
      isAuthenticated={isAuthenticated}
      role={role}
      itiSurface="public-site"
      itiContext="connect-hub"
      itiPrompt="Does your organization serve the community without formal recognition or funding?"
      itiRoleTags={["Faith Leader", "Community Organizer", "Informal Advocate", "Neighborhood Connector", "Promotora"]}
      extra={<OrchestraStrip hub="connect" />}
    />
  );
}
