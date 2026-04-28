import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Receipt, Shield, ArrowRight, Sparkles, FileCheck, Users, DollarSign,
  Loader2, CheckCircle2, ExternalLink, Heart, Lock, BarChart3, MessageSquare,
} from "lucide-react";

const GIFT_TIERS = [
  {
    amount: 500,
    label: "$500",
    title: "One resident's housing-stability month",
    description:
      "Funds 30 days of transitional housing for one returning resident in their highest-risk window. Receipt ties your gift to the specific housing-placement event in the chain.",
    icon: Heart,
    color: "from-rose-500/10 to-rose-500/5 border-rose-500/30",
    iconColor: "text-rose-500",
  },
  {
    amount: 2500,
    label: "$2,500",
    title: "Benefits-screening cohort of 5",
    description:
      "Covers full multi-benefit screening + warm-hand-off enrollment for 5 residents — SNAP, Medicaid, CHIP, WIC, EITC. Average annual value unlocked: ~$60,000 in benefits per cohort.",
    icon: FileCheck,
    color: "from-blue-500/10 to-blue-500/5 border-blue-500/30",
    iconColor: "text-blue-500",
  },
  {
    amount: 10000,
    label: "$10,000",
    title: "One workforce-placement pipeline",
    description:
      "Funds the full pipeline for one resident: training enrollment, AI career coach, employer warm-introduction, interview prep. Receipt chains every step end-to-end.",
    icon: BarChart3,
    color: "from-violet-500/10 to-violet-500/5 border-violet-500/30",
    iconColor: "text-violet-500",
  },
];

export default function DonorsPage() {
  const { toast } = useToast();
  const [briefText, setBriefText] = useState("");

  const briefMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/benefits/coalition/ai-loi", { mode: "donor" });
      return res.json();
    },
    onSuccess: (data: any) => {
      setBriefText(data.loi || "");
      toast({ title: "Donor brief generated", description: `${data.wordCount} words · live data snapshot` });
    },
    onError: (err: any) => {
      toast({ title: "Brief generation failed", description: String(err?.message || err), variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-blue-50/40 dark:from-amber-950/10 dark:via-background dark:to-blue-950/10" data-testid="page-donors">
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-16 space-y-12">

        {/* HERO ----------------------------------------------------------- */}
        <header className="text-center space-y-4 max-w-4xl mx-auto">
          <Badge variant="outline" className="text-xs px-3 py-1" data-testid="badge-pilot">
            <Sparkles className="h-3 w-3 mr-1" /> Outcome Receipts · Pilot
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight" data-testid="text-hero-title">
            Close the trust gap that keeps donors on the sidelines.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            Every charitable gift becomes a cryptographically-verifiable receipt tied to a specific resident outcome — housing placed, benefits enrolled, job interview booked. Independently verifiable. PII-free. Built on real data running live in Central Texas.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button size="lg" asChild data-testid="button-see-receipt">
              <Link href="/donor-receipt-demo">
                <Receipt className="h-4 w-4 mr-2" /> See a live receipt
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild data-testid="button-talk-founder">
              <Link href="/contact">
                <MessageSquare className="h-4 w-4 mr-2" /> Talk to the founder
              </Link>
            </Button>
          </div>
        </header>

        {/* TRUST GAP EXPLAINER -------------------------------------------- */}
        <section className="grid md:grid-cols-3 gap-4" data-testid="section-trust-gap">
          <Card data-testid="card-problem">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <span className="rounded-full w-6 h-6 grid place-items-center bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-bold">1</span>
                The trust gap
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Most donors give once, never see what happened, and stop. Annual reports are too late and too vague. The result: trillions sit on the sidelines while real people miss real services.
            </CardContent>
          </Card>
          <Card data-testid="card-mechanism">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <span className="rounded-full w-6 h-6 grid place-items-center bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold">2</span>
                The mechanism
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Every service event in a resident's journey is hashed into a tamper-evident chain. A gift is bound to a specific event hash. Anyone can re-derive the chain and verify the receipt — no platform login, no permission needed.
            </CardContent>
          </Card>
          <Card data-testid="card-outcome">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <span className="rounded-full w-6 h-6 grid place-items-center bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold">3</span>
                The outcome
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Donors give more, give sooner, and renew. Nonprofits stop spending evenings on PDF reports and start spending them on residents. Funders get the audit trail they've always wanted.
            </CardContent>
          </Card>
        </section>

        {/* GIFT TIERS ----------------------------------------------------- */}
        <section data-testid="section-gift-tiers">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold" data-testid="text-tiers-title">What your gift verifiably reaches</h2>
            <p className="text-muted-foreground mt-2">Every tier produces a receipt you can independently verify.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {GIFT_TIERS.map((tier) => {
              const Icon = tier.icon;
              return (
                <Card key={tier.amount} className={`bg-gradient-to-br ${tier.color}`} data-testid={`card-tier-${tier.amount}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Icon className={`h-6 w-6 ${tier.iconColor}`} />
                      <Badge variant="secondary" className="font-mono">{tier.label}</Badge>
                    </div>
                    <CardTitle className="text-lg pt-2" data-testid={`text-tier-title-${tier.amount}`}>{tier.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{tier.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="text-center mt-6">
            <Button variant="outline" asChild data-testid="button-tier-receipt">
              <Link href="/donor-receipt-demo">
                See exactly what these receipts look like
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </section>

        {/* TWO-WAY TRUST -------------------------------------------------- */}
        <section className="grid md:grid-cols-2 gap-4" data-testid="section-two-way">
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4 text-primary" /> What's in a receipt
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p>• Anonymized resident alias (e.g., <span className="font-mono text-foreground">Resident #M-2026-001</span>) — no names, no PII.</p>
              <p>• The specific event the gift reached: type, domain, title, timestamp.</p>
              <p>• Cryptographic hash of the event, plus the hash of the previous event in the chain.</p>
              <p>• Chain head and total event count, so independent verifiers can re-derive everything.</p>
              <p>• A verify endpoint anyone can call — no login.</p>
            </CardContent>
          </Card>
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4 text-primary" /> What's NOT in a receipt
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p>• No names, addresses, or identifying details — by design.</p>
              <p>• No FIPS codes or census tract identifiers exposed in the donor view.</p>
              <p>• No medical, legal, or financial detail beyond the event title.</p>
              <p>• Resident consent governs whether a service appears in the chain at all.</p>
              <p>• If an event is later corrected, downstream hashes change — tamper-evident, not silent.</p>
            </CardContent>
          </Card>
        </section>

        {/* AI BRIEF ------------------------------------------------------- */}
        <section data-testid="section-ai-brief">
          <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-600" /> Generate a fresh donor brief
              </CardTitle>
              <CardDescription>
                Live data snapshot from the WAB2 enrollment engine, written by the same collaborative AI that drafts our LOIs — but tuned for donor confidence, not grant compliance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => briefMutation.mutate()} disabled={briefMutation.isPending} data-testid="button-generate-brief">
                {briefMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating with live data…</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Generate donor brief</>
                )}
              </Button>
              {briefText && (
                <Textarea
                  value={briefText}
                  readOnly
                  className="min-h-[280px] font-serif text-sm leading-relaxed"
                  data-testid="textarea-brief"
                />
              )}
              {briefMutation.data && (
                <div className="text-xs text-muted-foreground flex flex-wrap gap-3" data-testid="text-brief-meta">
                  <span>{briefMutation.data.wordCount} words</span>
                  <span>·</span>
                  <span>Engines: {(briefMutation.data.collaborative?.engines || []).join(", ") || "n/a"}</span>
                  <span>·</span>
                  <span>RAG chunks: {briefMutation.data.collaborative?.ragChunks ?? 0}</span>
                  <span>·</span>
                  <span>{briefMutation.data.dataSnapshot?.totalEligible?.toLocaleString()} eligible · {briefMutation.data.dataSnapshot?.totalGap?.toLocaleString()} gap</span>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* PILOT HONESTY -------------------------------------------------- */}
        <section data-testid="section-pilot-honesty">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Pilot status — being honest
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                The Collaborative Advocate Foundation (TCAF) is veteran-founded and Black-led. Our 501(c)(3) determination is in active filing with the IRS (filed April 27, 2026 · Tracking 281OIP7B). Founder: Dr. Terry Flood, DHA — President.
              </p>
              <p>
                During the determination window, Abundant Life Church (a 501(c)(3) in good standing) is the fiduciary on grant submissions and tax-deductible gifts. Donors can also designate gifts to TCAF directly; receipts will be issued under the appropriate entity.
              </p>
              <p>
                The Outcome Receipts pilot is live on a real cohort in Travis, Williamson, Hays, Bastrop, and Caldwell counties. Resident PII is stripped at the receipt boundary. Hashes are deterministic and re-derivable.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* CTA FOOTER ----------------------------------------------------- */}
        <section className="text-center space-y-4 py-8" data-testid="section-final-cta">
          <h2 className="text-2xl md:text-3xl font-bold">Ready to fund work you can verify?</h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild data-testid="button-cta-receipt">
              <Link href="/donor-receipt-demo">
                <Receipt className="h-4 w-4 mr-2" /> See the live receipt
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild data-testid="button-cta-contact">
              <Link href="/contact">
                <MessageSquare className="h-4 w-4 mr-2" /> Start a pilot conversation
              </Link>
            </Button>
            <Button variant="ghost" size="lg" asChild data-testid="button-cta-st-davids">
              <Link href="/st-davids">
                See the underlying enrollment engine
                <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            TCAF · 17912 Stefano Drive, Pflugerville, TX 78660 · EIN 41-3618003 (501(c)(3) determination pending)
          </p>
        </section>

      </div>
    </div>
  );
}
