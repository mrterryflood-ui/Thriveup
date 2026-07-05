import {
  Wrench, Briefcase, Route, Handshake,
  Building2, GraduationCap, Target, Lightbulb,
  BarChart3, ClipboardCheck, Rocket, User,
  Zap, CalendarCheck, PenLine, Printer,
  Sparkles, Brain, Gamepad2, Map, Store,
  TrendingUp, Wallet, DollarSign, Calendar,
  Megaphone, HelpCircle, ShoppingBag, Wand2,
  MessageCircle, Compass, Layers, Shield,
} from "lucide-react";
import { HubShell, type HubCardDef } from "@/components/hub-shell";
import { OrchestraStrip } from "@/components/orchestra-strip";
import { useAuth } from "@/hooks/use-auth";
import { useHubRole } from "@/lib/hub-role";

const CARDS: HubCardDef[] = [
  { icon: Layers,       title: "Workforce Pell Grant",  subtitle: "Up to $4,310 for career training",     href: "/workforce-pell",        tag: "Workforce",   variant: "hero", color: "indigo",  badge: "New Jul 2026" },
  { icon: Wrench,       title: "Trade Sims",            subtitle: "Try free → real skills, real pay",     href: "/academy/trade-sims",    tag: "Trade Sims",  variant: "hero", color: "blue",    badge: "Free" },
  { icon: Shield,       title: "MOS Translator",        subtitle: "Military service → civilian credentials", href: "/mos-translator",      tag: "Veterans",    variant: "hero", color: "slate",   badge: "Veterans" },
  { icon: Briefcase,    title: "Career Explorer",       subtitle: "Discover high-demand careers",         href: "/academy/careers",       tag: "Workforce",   variant: "hero", color: "indigo" },
  { icon: Rocket,       title: "Panther Village",       subtitle: "Your academic home base",              href: "/academy",               tag: "Academy",     variant: "hero", color: "violet" },
  { icon: Brain,        title: "AI Creation Studio",    subtitle: "Build with AI tools",                  href: "/ai-tools",              tag: "AI",          variant: "hero", color: "purple" },

  { icon: MessageCircle,title: "Sparky AI",             subtitle: "Your personal AI companion",           href: "/sparky",                tag: "AI",          color: "violet" },
  { icon: Compass,      title: "Navigator AI",          subtitle: "Research & navigation assistant",      href: "/navigator",             tag: "AI",          color: "blue" },
  { icon: Wand2,        title: "AI Workforce Academy",  subtitle: "AI skills for the workforce",          href: "/ai-workforce",          tag: "AI",          color: "purple" },
  { icon: Brain,        title: "AI Curriculum (Youth)", subtitle: "Youth AI learning curriculum",         href: "/curriculum",            tag: "AI",          color: "indigo",  roles: ["youth", "community", "chw", "admin"] },

  { icon: Route,        title: "My Pathway",            subtitle: "Your personalized career path",        href: "/academy/pathway",       tag: "Workforce",   color: "blue",    authOnly: true, roles: ["youth", "community", "chw", "admin"] },
  { icon: Wrench,       title: "Apprenticeship Tracker",subtitle: "Track apprenticeship progress",        href: "/apprenticeship-tracker",tag: "Workforce",   color: "orange",  authOnly: true },
  { icon: Handshake,    title: "Mentors & Pathways",    subtitle: "Find a mentor in your field",          href: "/mentorship-directory",  tag: "Workforce",   color: "teal" },
  { icon: Building2,    title: "Employer Connections",  subtitle: "Hiring partner network",               href: "/workforce-employers",   tag: "Workforce",   color: "slate" },
  { icon: GraduationCap,title: "Transition Plans",      subtitle: "Education-to-career transitions",      href: "/transition-plans",      tag: "Workforce",   color: "green" },
  { icon: Target,       title: "Dream Design",          subtitle: "Design your ideal future",             href: "/academy/dreams",        tag: "Workforce",   color: "amber",   roles: ["youth", "community", "admin"] },
  { icon: Lightbulb,    title: "Life Lessons",          subtitle: "Real-world skill building",            href: "/academy/lessons",       tag: "Workforce",   color: "yellow",  roles: ["youth", "community", "chw", "admin"] },
  { icon: BarChart3,    title: "WIOA Outcomes",         subtitle: "Live placement rate, wages, retention",href: "/wioa-outcomes",         tag: "Workforce",   color: "emerald", authOnly: true, roles: ["admin", "org", "grant"] },
  { icon: BarChart3,    title: "Workforce Dashboard",   subtitle: "Program-wide workforce metrics",       href: "/workforce-dashboard",   tag: "Workforce",   color: "indigo",  authOnly: true, roles: ["admin", "org", "grant"] },
  { icon: ClipboardCheck,title: "Workforce Assessment", subtitle: "Skills & readiness assessment",        href: "/workforce-assessment",  tag: "Workforce",   color: "blue",    authOnly: true, roles: ["chw", "admin"] },
  { icon: GraduationCap,title: "Workforce Training",    subtitle: "Structured training programs",         href: "/workforce-training",    tag: "Workforce",   color: "violet" },

  { icon: User,         title: "My Avatar",             subtitle: "Customize your academic identity",     href: "/academy/avatar",        tag: "Academy",     color: "violet",  authOnly: true, roles: ["youth", "community", "admin"] },
  { icon: Zap,          title: "Panther Power",         subtitle: "Points, streaks, and power-ups",       href: "/academy/power",         tag: "Academy",     color: "yellow",  authOnly: true, roles: ["youth", "community", "admin"] },
  { icon: ClipboardCheck,title: "Daily Check-In",       subtitle: "Track your daily progress",            href: "/academy/self-assessment",tag: "Academy",    color: "teal",    authOnly: true, roles: ["youth", "community", "admin"] },
  { icon: CalendarCheck, title: "Daily Quests",         subtitle: "Complete today's learning quests",     href: "/academy/quests",        tag: "Academy",     color: "emerald", authOnly: true, roles: ["youth", "community", "admin"] },
  { icon: PenLine,      title: "My Journal",            subtitle: "Reflect and record your growth",       href: "/academy/journal",       tag: "Academy",     color: "blue",    authOnly: true, roles: ["youth", "community", "admin"] },
  { icon: Printer,      title: "Progress Report",       subtitle: "Shareable progress snapshots",         href: "/academy/progress-report",tag: "Academy",    color: "slate",   authOnly: true },
  { icon: GraduationCap,title: "STAAR Test Prep",       subtitle: "Texas state test preparation",         href: "/academy/staar-prep",    tag: "Academy",     color: "amber",   roles: ["youth", "admin"] },
  { icon: Sparkles,     title: "Concepts",              subtitle: "Visual concept explorations",          href: "/concepts",              tag: "Academy",     color: "purple" },
  { icon: GraduationCap,title: "Subjects",              subtitle: "All learning subjects",                href: "/subjects",              tag: "Academy",     color: "indigo" },
  { icon: Gamepad2,     title: "Game Room",             subtitle: "Learn through play",                   href: "/academy/games",         tag: "Academy",     color: "rose",    roles: ["youth", "community", "admin"] },
  { icon: Map,          title: "Adventures",            subtitle: "Scenario-based learning",              href: "/academy/scenarios",     tag: "Academy",     color: "cyan",    roles: ["youth", "community", "admin"] },
  { icon: Store,        title: "Marketplace",           subtitle: "Redeem your Panther Points",           href: "/academy/marketplace",   tag: "Academy",     color: "orange",  roles: ["youth", "community", "admin"] },
  { icon: TrendingUp,   title: "Stock Market",          subtitle: "Financial literacy simulator",         href: "/academy/stocks",        tag: "Academy",     color: "green",   roles: ["youth", "community", "admin"] },
  { icon: Wallet,       title: "My Wallet",             subtitle: "Manage your Panther Points",           href: "/academy/wallet",        tag: "Academy",     color: "amber",   authOnly: true, roles: ["youth", "community", "admin"] },
  { icon: DollarSign,   title: "Financial Literacy",    subtitle: "Real money skills",                    href: "/academy/financial-literacy",tag: "Academy", color: "emerald" },
  { icon: GraduationCap,title: "FAFSA Navigator",       subtitle: "Federal financial aid guide",          href: "/fafsa-navigator",       tag: "Academy",     color: "blue",    roles: ["youth", "community", "chw", "admin"] },
  { icon: Calendar,     title: "Academy Calendar",      subtitle: "Events, deadlines, check-ins",         href: "/academy/calendar",      tag: "Academy",     color: "indigo",  roles: ["youth", "community", "chw", "admin"] },
  { icon: Megaphone,    title: "Announcements",         subtitle: "Platform-wide news",                   href: "/academy/announcements", tag: "Academy",     color: "rose" },
  { icon: HelpCircle,   title: "Help & FAQ",            subtitle: "Get support",                          href: "/academy/help",          tag: "Academy",     color: "slate" },
  { icon: ShoppingBag,  title: "Print Shop",            subtitle: "Custom merch & certificates",          href: "/academy/merch",         tag: "Academy",     color: "pink",    authOnly: true, roles: ["youth", "admin"] },
];

export default function HubGrowPage() {
  const { isAuthenticated } = useAuth();
  const { role } = useHubRole();
  return (
    <HubShell
      title="Grow"
      subtitle="Trade Sims · Workforce · Academy · AI Tools"
      headerGradient="from-blue-600 via-indigo-600 to-blue-800"
      chips={["All", "Trade Sims", "Workforce", "Veterans", "Academy", "AI"]}
      cards={CARDS}
      isAuthenticated={isAuthenticated}
      role={role}
      itiSurface="trade-sims"
      itiContext="grow-hub"
      itiPrompt="Are you teaching trades or skills informally in your community?"
      itiRoleTags={["Driveway Journeyman", "Informal Trainer", "Peer Coach", "Neighborhood Mechanic", "Community Teacher"]}
      extra={<OrchestraStrip hub="grow" />}
    />
  );
}
