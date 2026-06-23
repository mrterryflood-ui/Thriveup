import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles, Users, Heart, Zap, TrendingUp, HandHeart,
  ArrowRight, Star, Globe, Mic2, BookOpen, ChevronRight
} from "lucide-react";
import alignLogo from "@assets/align-logo-optimized.webp";

const THRIVE_PILLARS = [
  {
    letter: "E", word: "Empower",
    icon: Zap,
    color: "from-violet-500 to-purple-600",
    desc: "Discover and activate your gifts — the skills, knowledge, and wisdom you've built through your journey.",
    actions: [
      { label: "Initiatives", url: "/initiatives" },
      { label: "Open Innovation Lab", url: "/open-innovation-lab" },
    ],
  },
  {
    letter: "A", word: "Activate",
    icon: TrendingUp,
    color: "from-blue-500 to-cyan-600",
    desc: "Move your vision into the world. Launch projects, join coalitions, advocate for change.",
    actions: [
      { label: "Coalition Dashboard", url: "/coalition" },
      { label: "Collaboration Hub", url: "/collaboration-hub" },
    ],
  },
  {
    letter: "G", word: "Grow",
    icon: BookOpen,
    color: "from-emerald-500 to-teal-600",
    desc: "Keep learning, keep evolving. Your journey doesn't end at stability — it accelerates.",
    actions: [
      { label: "Academy", url: "/academy" },
      { label: "Mentorship Directory", url: "/mentorship-directory" },
    ],
  },
  {
    letter: "U", word: "Uplift",
    icon: HandHeart,
    color: "from-amber-500 to-orange-600",
    desc: "Reach back for the person who is where you once were. Be the guide someone else needs.",
    actions: [
      { label: "Community Partners", url: "/partners" },
      { label: "Volunteer & Shadow Work", url: "/align" },
    ],
  },
  {
    letter: "S", word: "Serve",
    icon: Globe,
    color: "from-rose-500 to-pink-600",
    desc: "Contribute your strengths to your community. Service is the fullest expression of THRIVE.",
    actions: [
      { label: "Community", url: "/community" },
      { label: "Community Map", url: "/community-map" },
    ],
  },
];

const PATHWAYS = [
  {
    title: "Peer Mentor",
    icon: Users,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800",
    desc: "Walk alongside someone in the Assess or Listen phase. Lived experience is a qualification, not a liability.",
    url: "/mentorship-directory",
  },
  {
    title: "Shadow Worker → Named Contributor",
    icon: Star,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
    desc: "Promotoras, peer navigators, informal caregivers, faith leaders, driveway journeymen — your informal work counts. Get recognized, credentialed, and compensated.",
    url: "/align",
  },
  {
    title: "Community Leader",
    icon: Globe,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
    desc: "Launch an initiative, convene a coalition, or represent your community in TCAF's network. You've earned a seat at the table.",
    url: "/initiatives",
  },
  {
    title: "Workforce & Trade Professional",
    icon: TrendingUp,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
    desc: "Credentialed skills, apprenticeship completion, industry connection — THRIVE means your economic stability is real and growing.",
    url: "/workforce-assessment",
  },
];

const IMPACT_STATS = [
  { value: "15", label: "Service Platforms" },
  { value: "107", label: "Languages Supported" },
  { value: "4", label: "AI Engines" },
  { value: "50+", label: "States & Territories" },
];

export default function ThrivePage() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-thrive">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pt-12 pb-10 sm:px-6 text-center"
        style={{ background: "linear-gradient(160deg, #064e3b 0%, #065f46 40%, #0f172a 100%)" }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 left-1/3 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-1/3 h-56 w-56 rounded-full bg-amber-500/15 blur-3xl" />
        </div>

        <div className="relative max-w-2xl mx-auto">
          <div className="mb-4 flex justify-center">
            <img
              src={alignLogo}
              alt="ALIGN THRIVE"
              className="w-28 h-28 sm:w-36 sm:h-36 object-contain rounded-full bg-white shadow-2xl ring-4 ring-white/20"
              data-testid="img-thrive-logo"
            />
          </div>

          <div className="flex justify-center mb-3">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs px-3 py-1">
              <Star className="h-3 w-3 mr-1" /> ALIGN Journey Complete
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2" data-testid="text-thrive-headline">
            THRIVE
          </h1>
          <p className="text-emerald-300/80 text-sm tracking-widest uppercase mb-4">
            Empower · Activate · Grow · Uplift · Serve
          </p>
          <p className="text-white/70 text-sm max-w-lg mx-auto leading-relaxed mb-6">
            You've moved through the ALIGN journey. Now the work changes —
            from receiving to giving, from surviving to contributing, from participant to leader.
            This is what community transformation looks like from the inside.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/align/my-journey">
              <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10 gap-1" data-testid="button-thrive-journey">
                My Journey <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
            <Link href="/initiatives">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1" data-testid="button-thrive-initiatives">
                <Sparkles className="h-3 w-3" /> Launch an Initiative
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── THRIVE acronym pillars ────────────────────────────────────── */}
      <section className="px-4 py-8 sm:px-6 border-b bg-card" data-testid="section-thrive-pillars">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground text-center mb-5">
            What THRIVE Looks Like
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {THRIVE_PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.letter}
                  className="rounded-xl border bg-background p-3 space-y-2"
                  data-testid={`card-thrive-${p.word.toLowerCase()}`}>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${p.color} shadow-sm`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-muted-foreground">{p.letter} — </span>
                    <span className="text-xs font-semibold">{p.word}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed hidden sm:block">{p.desc}</p>
                  <div className="flex flex-wrap gap-1 hidden sm:flex">
                    {p.actions.map((a) => (
                      <Link key={a.url} href={a.url}>
                        <Badge variant="secondary" className="text-[9px] cursor-pointer hover:bg-primary/10 gap-0.5">
                          {a.label} <ChevronRight className="h-2.5 w-2.5" />
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Mobile descriptions */}
          <div className="mt-4 space-y-3 sm:hidden">
            {THRIVE_PILLARS.map((p) => (
              <div key={p.letter} className="space-y-1">
                <p className="text-xs font-bold">{p.word}</p>
                <p className="text-[10px] text-muted-foreground">{p.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {p.actions.map((a) => (
                    <Link key={a.url} href={a.url}>
                      <Badge variant="secondary" className="text-[10px]">{a.label}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contribution pathways ─────────────────────────────────────── */}
      <section className="px-4 py-8 sm:px-6" data-testid="section-thrive-pathways">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Pathways</p>
          <h2 className="text-base font-bold mb-4">How will you contribute?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PATHWAYS.map((pw) => {
              const Icon = pw.icon;
              return (
                <Card key={pw.title} className={`border ${pw.bg}`} data-testid={`card-pathway-${pw.title.toLowerCase().replace(/\s+/g, "-").slice(0, 20)}`}>
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-lg border flex items-center justify-center ${pw.bg}`}>
                        <Icon className={`h-4 w-4 ${pw.color}`} />
                      </div>
                      <p className="font-semibold text-sm">{pw.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{pw.desc}</p>
                    <Link href={pw.url}>
                      <Button variant="ghost" size="sm" className="gap-1 px-0 h-auto text-xs" data-testid={`link-pathway-${pw.title.slice(0, 10).toLowerCase().replace(/\s+/g, "-")}`}>
                        Get started <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Platform impact stats ─────────────────────────────────────── */}
      <section className="px-4 py-8 sm:px-6 bg-card border-y" data-testid="section-thrive-impact">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
            The Community You're Part Of
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {IMPACT_STATS.map((s) => (
              <div key={s.label} className="space-y-1" data-testid={`stat-thrive-${s.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            You are part of a national infrastructure that connects people, organizations, and communities across every state and territory.
            What you've learned on your ALIGN journey is now a resource for others.
          </p>
        </div>
      </section>

      {/* ── Stay connected ───────────────────────────────────────────── */}
      <section className="px-4 py-8 sm:px-6" data-testid="section-thrive-connect">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Heart className="h-4 w-4 text-rose-500" />
            <p className="font-semibold text-sm">Spirit · Soul · Body — fully alive</p>
            <Heart className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            THRIVE is not a destination — it's a posture. You keep growing, you keep serving,
            you keep showing up. The community needs what only you can bring.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link href="/align/my-journey">
              <Button size="sm" variant="outline" data-testid="button-thrive-back-journey">My Journey</Button>
            </Link>
            <Link href="/align">
              <Button size="sm" variant="outline" data-testid="button-thrive-back-align">ALIGN Home</Button>
            </Link>
            <a href="#" data-testid="link-thrive-podcast">
              <Button size="sm" variant="outline" className="gap-1">
                <Mic2 className="h-3 w-3" /> Weekly Podcast — Coming Soon
              </Button>
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
