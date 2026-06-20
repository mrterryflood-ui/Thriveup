import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, Ear, Puzzle, Compass, Navigation,
  Facebook, Mic2, ArrowRight, Heart,
  Users, Sparkles
} from "lucide-react";
import { SiInstagram } from "react-icons/si";
import alignLogo from "@assets/4C3587C9-E0BC-45FD-9E4E-CD435BE825BD_1781974706746.png";

const FRAMEWORK = [
  {
    letter: "A",
    word: "Assess",
    icon: Search,
    color: "from-violet-500 to-purple-600",
    desc: "Understand where you are — spirit, soul, and body — before deciding where you're going.",
  },
  {
    letter: "L",
    word: "Listen",
    icon: Ear,
    color: "from-blue-500 to-cyan-600",
    desc: "Be heard first. Your story, your barriers, your strengths — all of it matters before any plan is made.",
  },
  {
    letter: "I",
    word: "Integrate",
    icon: Puzzle,
    color: "from-emerald-500 to-teal-600",
    desc: "Connect the dots across health, education, work, family, and community — not one issue at a time.",
  },
  {
    letter: "G",
    word: "Guide",
    icon: Compass,
    color: "from-amber-500 to-orange-600",
    desc: "Personalized plans built with you — not handed to you. Your pace, your readiness level, your goals.",
  },
  {
    letter: "N",
    word: "Navigate",
    icon: Navigation,
    color: "from-rose-500 to-pink-600",
    desc: "Move from awareness to action — with real resources, real relationships, and real accountability.",
  },
];

const OUTCOMES = [
  "Improved health", "Improved education", "Increased employment",
  "Financial stability", "Stronger families", "Community engagement",
  "Leadership development", "Social connectedness", "Improved quality of life",
];

export default function AlignPage() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-align">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pt-12 pb-10 sm:px-6 text-center"
        style={{ background: "linear-gradient(160deg, #1e1b4b 0%, #312e81 40%, #0f172a 100%)" }}>
        {/* Ambient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />
        </div>

        <div className="relative max-w-2xl mx-auto">
          {/* Logo */}
          <div className="mb-4 flex justify-center">
            <img
              src={alignLogo}
              alt="ALIGN — Aligning People with Purpose"
              className="w-52 h-52 sm:w-64 sm:h-64 object-contain rounded-full bg-white shadow-2xl ring-4 ring-white/20"
              data-testid="img-align-logo"
            />
          </div>

          <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-2">A TCAF Initiative</p>

          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1" data-testid="text-align-headline">
            Aligning People with Purpose.
          </h1>
          <p className="text-white/60 text-xs tracking-widest uppercase mb-4">
            Empower · Activate · Grow · Uplift · Serve
          </p>
          <p className="text-white/70 text-sm max-w-lg mx-auto leading-relaxed mb-6">
            Where people, purpose, and community come together. ALIGN helps individuals and
            communities move from awareness to action — grounded in spirit, soul, and body.
          </p>

          <div className="flex flex-wrap gap-2 justify-center mb-8">
            <Badge className="bg-white/10 text-white/80 border-white/20 text-[11px]">Individuals seeking growth</Badge>
            <Badge className="bg-white/10 text-white/80 border-white/20 text-[11px]">Families navigating transitions</Badge>
            <Badge className="bg-white/10 text-white/80 border-white/20 text-[11px]">Organizations strengthening communities</Badge>
          </div>

          {/* Framework pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {FRAMEWORK.map((f) => (
              <div key={f.letter}
                className="flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1.5">
                <span className="text-xs font-black text-white">{f.letter}</span>
                <span className="text-xs text-white/70">{f.word}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Framework cards ───────────────────────────────────────────── */}
      <section className="px-4 py-8 sm:px-6 bg-card border-b" data-testid="section-align-framework">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground text-center mb-5">
            The ALIGN Framework
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {FRAMEWORK.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.letter}
                  className="rounded-xl border bg-background p-3 space-y-2 text-center"
                  data-testid={`card-align-${f.word.toLowerCase()}`}>
                  <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${f.color} shadow-sm`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-muted-foreground">{f.letter} — </span>
                    <span className="text-xs font-semibold">{f.word}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed hidden sm:block">{f.desc}</p>
                </div>
              );
            })}
          </div>
          {/* Mobile descriptions */}
          <div className="mt-4 space-y-2 sm:hidden">
            {FRAMEWORK.map((f) => (
              <p key={f.letter} className="text-xs text-muted-foreground">
                <span className="font-bold text-foreground">{f.word}:</span> {f.desc}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ── ALIGN Platform CTA ───────────────────────────────────────── */}
      <section className="px-4 py-8 sm:px-6" data-testid="section-align-cta">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground text-center mb-4">
            Begin Your Journey
          </p>
          <div className="rounded-2xl border bg-card overflow-hidden shadow-lg">
            {/* Brand strip */}
            <div className="flex flex-col items-center gap-3 px-6 py-8 text-center"
              style={{ background: "linear-gradient(160deg, #1e1b4b 0%, #1a3a2a 100%)" }}>
              <img
                src={alignLogo}
                alt="ALIGN logo"
                className="w-28 h-28 object-contain rounded-full bg-white shadow-xl"
              />
              <div>
                <p className="text-white font-black text-lg tracking-widest">ALIGN</p>
                <p className="text-white/60 text-xs tracking-widest uppercase">Aligning People with Purpose</p>
              </div>
            </div>
            {/* CTA body */}
            <div className="px-6 py-6 space-y-4 text-center">
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                The full ALIGN platform — intake, assessment, personalized guidance, and community
                connection — lives at Life Transitions Aid, our partner site. Start your journey there.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="https://lifetransitionsaid.org/thriveup/align"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-align-platform">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    Open the ALIGN Platform <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
                <Link href="/benefits-screener">
                  <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto" data-testid="button-align-screener">
                    Start Benefits Assessment
                  </Button>
                </Link>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Opens in a new tab · Powered by Life Transitions Aid &amp; TCAF
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Theory of Change ─────────────────────────────────────────── */}
      <section className="px-4 py-8 sm:px-6 bg-card border-y" data-testid="section-align-theory">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-6">
            Theory of Change
          </p>

          {/* Foundation */}
          <div className="mb-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800 px-4 py-2">
              <Heart className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <span className="text-sm font-semibold text-violet-800 dark:text-violet-300">Spirit · Soul · Body</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Foundation</p>
          </div>

          <div className="text-muted-foreground text-lg mb-3">↓</div>

          {/* ALIGN */}
          <div className="mb-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 px-4 py-2">
              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">ALIGN Process</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Assess · Listen · Integrate · Guide · Navigate</p>
          </div>

          <div className="text-muted-foreground text-lg mb-3">↓</div>

          {/* THRIVE */}
          <div className="mb-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-4 py-2">
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">THRIVE</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Empower · Activate · Grow · Uplift · Serve</p>
          </div>

          <div className="text-muted-foreground text-lg mb-4">↓</div>

          {/* Outcomes */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Outcomes</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {OUTCOMES.map((o) => (
                <Badge key={o} variant="secondary" className="text-[10px]">{o}</Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Two customers ────────────────────────────────────────────── */}
      <section className="px-4 py-8 sm:px-6" data-testid="section-align-customers">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-card p-5 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center">
                <Heart className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <p className="font-semibold text-sm">Individuals</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Seeking growth, resources, support, purpose, and action. ALIGN meets you where you are
              — across health, career, family, faith, and community — and walks with you.
            </p>
            <Link href="/benefits-screener">
              <Button variant="outline" size="sm" className="w-full mt-1" data-testid="button-align-individual">
                Start Your Assessment <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>

          <div className="rounded-xl border bg-card p-5 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="font-semibold text-sm">Organizations & Communities</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Nonprofits, faith communities, schools, and local governments — coordinating efforts,
              identifying gaps, measuring impact, and strengthening the populations they serve.
            </p>
            <Link href="/our-approach">
              <Button variant="outline" size="sm" className="w-full mt-1" data-testid="button-align-org">
                How We Partner <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stay Connected (social + podcast) ────────────────────────── */}
      <section className="px-4 py-8 sm:px-6 bg-card border-t" data-testid="section-align-social">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Stay Connected
          </p>
          <h2 className="text-base font-bold mb-4">Follow the ALIGN community</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-align-facebook"
              className="flex items-center gap-2 rounded-xl border bg-background px-4 py-2.5 text-sm font-medium hover:bg-primary/5 transition-colors no-underline text-foreground">
              <Facebook className="h-4 w-4 text-blue-600" />
              Facebook Page
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-align-instagram"
              className="flex items-center gap-2 rounded-xl border bg-background px-4 py-2.5 text-sm font-medium hover:bg-primary/5 transition-colors no-underline text-foreground">
              <SiInstagram className="h-4 w-4 text-pink-600" />
              Instagram
            </a>
            <a
              href="#"
              data-testid="link-align-podcast"
              className="flex items-center gap-2 rounded-xl border bg-background px-4 py-2.5 text-sm font-medium hover:bg-primary/5 transition-colors no-underline text-foreground">
              <Mic2 className="h-4 w-4 text-violet-600" />
              Weekly Podcast — Coming Soon
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            A TCAF initiative · <Link href="/our-approach" className="hover:underline">How we work</Link>
          </p>
        </div>
      </section>

    </div>
  );
}
