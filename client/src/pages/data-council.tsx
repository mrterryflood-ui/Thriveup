import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Shield, Users, BarChart3, Lock, Eye, CheckCircle2,
  FileText, Globe, Heart, ArrowRight, Gavel, BookOpen,
  Building2, Mail, Calendar, AlertTriangle,
} from "lucide-react";

const RIGHTS = [
  { icon: Eye,         label: "Right to See",        desc: "You can see everything we have about you, any time you ask. No buried menus. One request, full access within 72 hours." },
  { icon: Lock,        label: "Right to Correct",     desc: "If we have something wrong, you can correct it. Your record, your truth." },
  { icon: Shield,      label: "Right to Delete",      desc: "You can request deletion of your personal data at any time. We'll confirm within 30 days." },
  { icon: AlertTriangle,label: "Right to Object",     desc: "If you don't want your data used for research, grant reporting, or anything else — you say so, and we stop. No questions." },
  { icon: CheckCircle2,label: "Right to Know the Use", desc: "Before your data is included in any aggregate report, you receive plain-language notice of exactly what, to whom, and why." },
  { icon: Globe,       label: "Right to Port",        desc: "You can take your data out in a standard format. It's yours. We don't lock it in." },
];

const CONSENT_LAYERS = [
  { toggle: "Share with funders for grant reporting",    default: "OFF", who: "Foundation staff, funder reviewers" },
  { toggle: "Name me publicly in impact stories",        default: "OFF", who: "Public audience, media, website" },
  { toggle: "Include in academic research",              default: "OFF", who: "IRB-approved researchers" },
  { toggle: "Aggregate my data in community dashboards", default: "OFF", who: "Community members, policymakers" },
  { toggle: "Use my story in AI training data",          default: "OFF", who: "Platform improvement team only" },
  { toggle: "Connect me with peer mentors",              default: "OFF", who: "Vetted peer mentors in the network" },
  { toggle: "Notify my caseworker of my activity",       default: "OFF", who: "Named caseworker only" },
  { toggle: "Receive outreach from partner orgs",        default: "OFF", who: "Affiliated network partners" },
];

const COUNCIL_ROLES = [
  { role: "Community Resident Representatives (4)", desc: "Two from Central Texas; two nationally. Elected annually by registered participants. Full voting rights on all data use decisions." },
  { role: "Shadow Worker Representative (1)",        desc: "A peer mentor, promotora, or informal caregiver who is active in the Integration Through Invitation network. Ensures the platform's non-credentialed community members have governance voice." },
  { role: "Partner Organization Representatives (2)", desc: "One faith-based org; one CHW-led nonprofit. Nominated by the affiliate network." },
  { role: "Independent Researcher / Academic (1)",   desc: "Non-affiliated implementation scientist or data ethicist. Appointed by TCAF board annually." },
  { role: "Youth Representative (1)",                desc: "Age 16–24. Academy participant or CTE student. Full voting rights." },
  { role: "TCAF President (non-voting ex officio)",  desc: "Dr. Terry Flood attends as a resource. Does not vote. Council retains full autonomy over data governance decisions." },
];

export default function DataCouncilPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-10 pb-16 space-y-14" data-testid="page-data-council">

      {/* Hero */}
      <div className="text-center space-y-4">
        <Badge variant="secondary" className="mx-auto">Community Data Governance</Badge>
        <h1 className="text-4xl font-bold tracking-tight" data-testid="text-council-title">
          The Community Data Council
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          The platform generates real data about real people. This council has binding authority over how aggregate data is used, shared, and reported — independent of TCAF staff and funders.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" /> 9 seats total</span>
          <span className="hidden sm:inline">·</span>
          <span className="flex items-center gap-1.5"><Gavel className="h-4 w-4 text-primary" /> Binding authority — not advisory</span>
          <span className="hidden sm:inline">·</span>
          <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-primary" /> Meets quarterly</span>
        </div>
      </div>

      {/* Why this council exists */}
      <section>
        <h2 className="text-xl font-bold mb-3">Why this council exists</h2>
        <div className="prose prose-sm max-w-none text-muted-foreground space-y-3 leading-relaxed">
          <p>
            Platforms that serve communities have a documented history of extracting data from those communities and using it to benefit everyone except the community itself. Funders get reports. Researchers get publications. Technology companies get training data. The families who shared their stories get a press release with their name on it — if they were lucky enough to consent at all.
          </p>
          <p>
            The Community Data Council exists to break that pattern. It is the governing body with final authority over how aggregate, anonymized data from this platform is used. TCAF cannot include community data in a funder report without council approval. TCAF cannot enter a data-sharing agreement with a research institution without council review. TCAF cannot change the consent architecture without council sign-off.
          </p>
          <p>
            This is not a checkbox. It is the community's actual veto over their own data.
          </p>
        </div>
      </section>

      {/* Your rights */}
      <section>
        <h2 className="text-xl font-bold mb-1">Your individual rights</h2>
        <p className="text-sm text-muted-foreground mb-5">These apply to every person who uses any platform in the Foundation Network. They are not conditional on your consent settings.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {RIGHTS.map((right) => (
            <Card key={right.label} className="border" data-testid={`card-right-${right.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardContent className="pt-5 space-y-2">
                <right.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <p className="font-semibold text-sm">{right.label}</p>
                <p className="text-xs text-muted-foreground leading-snug">{right.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 8 consent layers */}
      <section>
        <h2 className="text-xl font-bold mb-1">The 8 consent layers — all default OFF</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Every sharing decision is a separate toggle. None of them are on unless you turn them on. You can change your settings any time from your profile.
        </p>
        <div className="border rounded-xl overflow-hidden divide-y" data-testid="table-consent-layers">
          <div className="grid grid-cols-12 bg-muted/40 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <span className="col-span-6">What you're consenting to</span>
            <span className="col-span-2 text-center">Default</span>
            <span className="col-span-4">Who sees it</span>
          </div>
          {CONSENT_LAYERS.map((layer) => (
            <div key={layer.toggle} className="grid grid-cols-12 px-4 py-3 text-sm items-center hover:bg-muted/20 transition-colors" data-testid={`row-consent-${layer.toggle.slice(0, 20).toLowerCase().replace(/\s+/g, '-')}`}>
              <span className="col-span-6 font-medium">{layer.toggle}</span>
              <span className="col-span-2 text-center">
                <Badge variant="outline" className="text-[10px] border-rose-300 text-rose-600 dark:border-rose-700 dark:text-rose-400">OFF</Badge>
              </span>
              <span className="col-span-4 text-xs text-muted-foreground">{layer.who}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          To update your consent settings: sign in → Profile → Privacy Settings. Each toggle has a plain-language explanation of exactly what it does.
        </p>
      </section>

      {/* Council seats */}
      <section>
        <h2 className="text-xl font-bold mb-1">Who sits on the council</h2>
        <p className="text-sm text-muted-foreground mb-5">Nine seats. Six are filled by community members, not TCAF staff.</p>
        <div className="space-y-3">
          {COUNCIL_ROLES.map((seat) => (
            <div key={seat.role} className="flex gap-3 p-4 rounded-xl bg-muted/30 border" data-testid={`card-seat-${seat.role.slice(0,20).toLowerCase().replace(/\s+/g, '-')}`}>
              <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold text-sm">{seat.role}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{seat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What the council controls */}
      <section>
        <h2 className="text-xl font-bold mb-4">What the council controls</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: FileText,  label: "Aggregate data use",        desc: "Any use of de-identified, aggregated community data in funder reports, research, policy briefs, or publications requires council approval." },
            { icon: BookOpen,  label: "Research agreements",       desc: "Data-sharing with IRB-approved researchers requires council review. Community benefit must be demonstrated." },
            { icon: BarChart3, label: "Consent architecture",      desc: "Any change to the 8 consent toggles — including defaults — requires council approval before deployment." },
            { icon: Building2, label: "Funder data commitments",   desc: "If a funder requires community data as a grant condition, the council reviews and can reject if it conflicts with community interests." },
            { icon: Globe,     label: "Annual Data Report",        desc: "The council reviews and approves the annual public data report before it is released. Community members see it first." },
            { icon: Shield,    label: "Privacy policy changes",    desc: "Council reviews and approves any change to the platform's privacy policy with 60-day advance notice to participants." },
          ].map((item) => (
            <Card key={item.label} className="border">
              <CardContent className="pt-5 space-y-2">
                <item.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <p className="font-semibold text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground leading-snug">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Apply / contact */}
      <section className="text-center space-y-4 py-4">
        <h2 className="text-xl font-bold">Join the council or ask questions</h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Community Resident Representative seats are elected annually in October. Shadow Worker and Youth Representative seats are open now. Applications accepted on a rolling basis.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/contact">
            <Button className="gap-2" data-testid="button-apply-council">
              <Mail className="h-4 w-4" /> Apply for a Seat <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/transparency">
            <Button variant="outline" className="gap-2" data-testid="button-view-transparency">
              <BarChart3 className="h-4 w-4" /> View Transparency Dashboard
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          Questions about your data? Email <a href="mailto:terryflood@thrivingcommunitiesforall.com" className="underline">terryflood@thrivingcommunitiesforall.com</a> — subject line: "Data Council."
        </p>
      </section>

    </div>
  );
}
