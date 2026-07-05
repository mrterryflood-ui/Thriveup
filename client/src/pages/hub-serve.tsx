import {
  MapPin, HandHeart, ClipboardList, Route, Heart,
  Shield, Users, Activity, GraduationCap, Scale,
  Stethoscope, ShieldCheck, ClipboardCheck, Landmark,
  Building2, Sparkles, BarChart3, MessageCircle,
} from "lucide-react";
import { HubShell, type HubCardDef } from "@/components/hub-shell";
import { OrchestraStrip } from "@/components/orchestra-strip";
import { useAuth } from "@/hooks/use-auth";
import { useHubRole } from "@/lib/hub-role";

const CARDS: HubCardDef[] = [
  { icon: MapPin,         title: "Resource Finder",            subtitle: "Search 200+ local services",       href: "/resources",              tag: "Benefits",     variant: "hero", color: "emerald" },
  { icon: HandHeart,      title: "Benefits Command Center",    subtitle: "All benefits in one place",        href: "/benefits",               tag: "Benefits",     variant: "hero", color: "teal" },
  { icon: HandHeart,      title: "Foster Youth Hub",           subtitle: "Support for youth aging out",      href: "/foster-youth",           tag: "Foster Youth", variant: "hero", color: "green" },
  { icon: Scale,          title: "Reentry Program",            subtitle: "Justice-involved pathways",        href: "/reentry-program",        tag: "Justice",      variant: "hero", color: "indigo" },

  { icon: ClipboardList,  title: "9-Benefit Screener",         subtitle: "Find benefits you qualify for",    href: "/benefits-screener",      tag: "Benefits" },
  { icon: ClipboardCheck, title: "Intake Wizard",              subtitle: "Start your journey",               href: "/intake",                 tag: "Benefits",     color: "teal" },
  { icon: Route,          title: "Resident Journey (demo)",    subtitle: "Walk through Marcus's story",      href: "/resident-journey",       tag: "Benefits",     color: "green" },
  { icon: HandHeart,      title: "Resource Directory",         subtitle: "Full searchable directory",        href: "/resource-directory",     tag: "Benefits",     color: "emerald" },
  { icon: Route,          title: "My Journey",                 subtitle: "Your personal roadmap",            href: "/my-journey",             tag: "Benefits",     color: "teal",   authOnly: true, roles: ["community", "youth", "chw", "admin"] },
  { icon: Activity,       title: "Service Delivery",           subtitle: "Track service delivery",           href: "/services",               tag: "Benefits",     color: "green",  authOnly: true, roles: ["chw", "admin", "org"] },
  { icon: Shield,         title: "Case Manager View",          subtitle: "Case manager dashboard",           href: "/case-manager",           tag: "Benefits",     color: "slate",  authOnly: true, roles: ["chw", "admin"] },
  { icon: Users,          title: "Cohort Onboarding",          subtitle: "Group onboarding flow",            href: "/cohort-onboarding",      tag: "Benefits",     color: "indigo", authOnly: true, roles: ["chw", "admin", "org"] },

  { icon: ClipboardCheck, title: "Aging-Out Toolkit",          subtitle: "Practical tools for transition",   href: "/foster-youth/toolkit",   tag: "Foster Youth", color: "green" },
  { icon: Route,          title: "Foster Transition Plan",     subtitle: "Build your transition plan",       href: "/foster-youth/transition-plan", tag: "Foster Youth", color: "teal" },
  { icon: Heart,          title: "Wellbeing Check-in",         subtitle: "Regular wellness check-ins",       href: "/foster-youth/wellbeing", tag: "Foster Youth", color: "rose" },
  { icon: Scale,          title: "My Rights (Foster)",         subtitle: "Know your rights",                 href: "/foster-youth/rights",    tag: "Foster Youth", color: "indigo" },
  { icon: Landmark,       title: "State Benefits (50 states)", subtitle: "Benefits by state",                href: "/foster-youth/benefits",  tag: "Foster Youth", color: "slate" },
  { icon: GraduationCap,  title: "FAFSA & ETV (Foster)",       subtitle: "Education funding for foster youth", href: "/fafsa-navigator?audience=foster", tag: "Foster Youth", color: "blue" },
  { icon: Sparkles,       title: "AI-assisted Intake",         subtitle: "AI-guided intake process",         href: "/foster-youth/intake",    tag: "Foster Youth", color: "violet" },
  { icon: Building2,      title: "State-Agency Portal",        subtitle: "Connect with state agencies",      href: "/foster-youth/state-portal", tag: "Foster Youth", color: "slate", authOnly: true, roles: ["chw", "admin"] },

  { icon: Scale,          title: "Reentry Standards",          subtitle: "Evidence-based standards",         href: "/reentry/standards",      tag: "Justice",      color: "indigo" },
  { icon: Users,          title: "Justice Partners",           subtitle: "Partner organizations",            href: "/justice-partners",       tag: "Justice",      color: "blue" },
  { icon: Scale,          title: "Reentry Dashboard",          subtitle: "Participant dashboard",            href: "/reentry",                tag: "Justice",      color: "violet", authOnly: true },
  { icon: Landmark,       title: "TX Reentry Stipend Pilot",   subtitle: "Stipend pilot program",            href: "/reentry-stipend-pilot",  tag: "Justice",      color: "amber",  authOnly: true, roles: ["chw", "admin", "org"] },
  { icon: BarChart3,      title: "Reentry Outcome Reports",    subtitle: "Impact data & reporting",          href: "/reentry/outcome-reports",tag: "Justice",      color: "slate",  authOnly: true, roles: ["admin", "grant", "org"] },
  { icon: Shield,         title: "Justice Command Center",     subtitle: "Admin command center",             href: "/justice-command-center", tag: "Justice",      color: "red",    authOnly: true, roles: ["admin"] },

  { icon: Shield,         title: "Veterans Program",           subtitle: "Support for veterans",             href: "/veterans",               tag: "Health",       color: "blue" },
  { icon: Heart,          title: "Behavioral Health",          subtitle: "Mental health resources",          href: "/behavioral-health",      tag: "Health",       color: "rose" },
  { icon: ShieldCheck,    title: "Prevention Hub",             subtitle: "Prevention programs",              href: "/prevention",             tag: "Health",       color: "emerald" },
  { icon: Heart,          title: "Parent Education",           subtitle: "Parenting support & resources",    href: "/parent-education",       tag: "Health",       color: "pink" },
  { icon: Activity,       title: "Health & Wellness Hub",      subtitle: "Whole-person wellness",            href: "/health-wellness",        tag: "Health",       color: "teal" },
  { icon: ClipboardCheck, title: "Facilitator Hub",            subtitle: "Program facilitator tools",        href: "/facilitator-hub",        tag: "Health",       color: "slate",  authOnly: true, roles: ["chw", "admin"] },
  { icon: Heart,          title: "Health Network",             subtitle: "Provider network",                 href: "/health-network",         tag: "Health",       color: "rose",   authOnly: true, roles: ["chw", "admin", "org"] },
  { icon: Stethoscope,    title: "CHW Dashboard",              subtitle: "Community health worker tools",    href: "/chw-dashboard",          tag: "Health",       color: "amber",  authOnly: true, roles: ["chw", "admin"] },
  { icon: MessageCircle,  title: "Community Voice",            subtitle: "Hear from the community",          href: "/voice",                  tag: "Health",       color: "violet" },
];

export default function HubServePage() {
  const { isAuthenticated } = useAuth();
  const { role } = useHubRole();
  return (
    <HubShell
      title="Serve People"
      subtitle="Benefits · Foster Youth · Justice · Health"
      headerGradient="from-emerald-600 via-teal-600 to-green-700"
      chips={["All", "Benefits", "Foster Youth", "Justice", "Health"]}
      cards={CARDS}
      isAuthenticated={isAuthenticated}
      role={role}
      itiSurface="lifebridge"
      itiContext="serve-hub"
      itiPrompt="Are you already helping people in your community?"
      itiRoleTags={["Informal Caregiver", "Neighbor Helper", "Promotora", "Peer Support", "Faith Leader", "Driveway Helper"]}
      extra={<OrchestraStrip hub="serve" />}
    />
  );
}
