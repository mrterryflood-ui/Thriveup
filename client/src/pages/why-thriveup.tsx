import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2, ArrowRight, Clock, Users, Building2, Globe, Shield,
  BookOpen, BarChart3, Smartphone, Link2, Heart, Target, Zap,
  AlertCircle, ExternalLink, Download, Star, FileText, Lock,
  RefreshCw, Scale, Layers, ChevronRight, CircleDot
} from "lucide-react";
import alignLogo from "@assets/4C3587C9-E0BC-45FD-9E4E-CD435BE825BD_1781974706746.png";

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ id, children, className = "" }: { id: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`scroll-mt-20 py-10 border-b last:border-0 ${className}`}>
      {children}
    </section>
  );
}

function SectionLabel({ icon: Icon, label }: { icon: typeof CheckCircle2; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

function Answered({ question, answer, cite }: { question: string; answer: string; cite?: string }) {
  return (
    <div className="border rounded-xl p-4 space-y-1 bg-card">
      <div className="flex items-start gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs font-semibold text-muted-foreground italic">"{question}"</p>
      </div>
      <p className="text-sm pl-6">{answer}</p>
      {cite && <p className="text-[10px] text-muted-foreground pl-6">{cite}</p>}
    </div>
  );
}

// ── In-page nav ───────────────────────────────────────────────────────────────
const NAV = [
  { href: "#ninety", label: "What we do" },
  { href: "#comparison", label: "vs. alternatives" },
  { href: "#framework", label: "ALIGN framework" },
  { href: "#data", label: "Data governance" },
  { href: "#governance", label: "Community governance" },
  { href: "#adoption", label: "Adoption cost" },
  { href: "#sustainability", label: "Sustainability" },
  { href: "#field", label: "Field & mobile" },
  { href: "#interop", label: "Interoperability" },
  { href: "#start", label: "Start here" },
];

export default function WhyThriveUpPage() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-why-thriveup">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="border-b px-4 pt-10 pb-8 sm:px-6 text-center"
        style={{ background: "linear-gradient(160deg, #1e1b4b 0%, #064e3b 60%, #0f172a 100%)" }}>
        <div className="max-w-2xl mx-auto">
          <img src={alignLogo} alt="ALIGN" className="w-14 h-14 rounded-full bg-white mx-auto mb-4 object-contain shadow-lg" />
          <Badge className="mb-3 bg-white/10 text-white/70 border-white/20 text-[10px]">For Skeptical Stakeholders</Badge>
          <h1 className="text-xl sm:text-2xl font-black text-white mb-2" data-testid="text-why-headline">
            Every Hard Question. Answered Directly.
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto mb-5">
            ThriveUp Academy is built for communities that have been over-promised and under-delivered.
            This page exists because you deserve straight answers before you invest a single hour of staff time.
          </p>
          {/* In-page nav */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {NAV.map((n) => (
              <a key={n.href} href={n.href}
                className="text-[10px] px-2.5 py-1 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors">
                {n.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* ── 1 · 90-second answer ──────────────────────────────────── */}
        <Section id="ninety">
          <SectionLabel icon={Clock} label="The 90-second answer" />
          <h2 className="text-lg font-black mb-4">Three questions every stakeholder asks first</h2>
          <div className="space-y-3">
            <div className="rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-1">What exactly do you do?</p>
              <p className="text-sm font-semibold">ThriveUp gives individuals, organizations, and communities a shared language and a shared dashboard for moving from crisis to contribution — and shows funders the evidence that it's working.</p>
              <p className="text-xs text-muted-foreground mt-2">
                Benefits screening, workforce development, grant intelligence, peer mentorship, and community health are already separate on most platforms.
                ThriveUp connects them to a single growth journey — ALIGN — so a person's progress in housing doesn't disappear when they walk into a workforce program.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border p-4 bg-card">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Who has it worked for?</p>
                <p className="text-sm">The platform launched in Travis County, Texas with TCAF as the operating hub. The ALIGN framework is currently in active pilot with partner organizations in the Central Texas ecosystem. Case study documentation is in progress and will be published here as outcomes data matures (Q3 2026).</p>
                <p className="text-xs text-muted-foreground mt-2 italic">Honest answer: we are early. The architecture is proven. The community outcomes data is accumulating. We will not claim outcomes we cannot cite.</p>
              </div>
              <div className="rounded-xl border p-4 bg-card">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">What does it cost to try?</p>
                <div className="space-y-1.5 mt-1">
                  {[
                    { task: "Individual ALIGN assessment", time: "12 minutes" },
                    { task: "Org ALIGN assessment (first pass)", time: "25 minutes" },
                    { task: "Map your programs to phases", time: "15–30 minutes" },
                    { task: "See your community gap report", time: "Immediate" },
                    { task: "Time to first value (data you can use)", time: "Same session" },
                  ].map((r) => (
                    <div key={r.task} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{r.task}</span>
                      <Badge variant="secondary" className="text-[10px] ml-2 flex-shrink-0">{r.time}</Badge>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">No contract. No setup fee. Platform access is grant-subsidized for qualifying community orgs.</p>
              </div>
            </div>
          </div>
        </Section>

        {/* ── 2 · Comparison ───────────────────────────────────────── */}
        <Section id="comparison">
          <SectionLabel icon={Scale} label="Why not existing tools" />
          <h2 className="text-lg font-black mb-1">What they do. What we do differently.</h2>
          <p className="text-sm text-muted-foreground mb-4">We are not competitors with Unite Us, 211, or Salesforce NPSP. We fill the gap they all leave.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse" data-testid="table-comparison">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">Tool</th>
                  <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">What it does well</th>
                  <th className="text-left py-2 font-semibold text-muted-foreground">The gap it leaves</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { tool: "Unite Us / Aunt Bertha", good: "Referral routing between orgs", gap: "Tracks referrals, not growth. A person stays a case number across programs." },
                  { tool: "Salesforce NPSP", good: "CRM for mid-large nonprofits", gap: "Powerful but expensive, requires consultants, and was not built for community-level journeys." },
                  { tool: "211 / Findhelp.org", good: "Resource directory, needs screening", gap: "Points people to services. Doesn't track what happens after they arrive." },
                  { tool: "HMIS (Homeless Mgmt Info)", good: "HUD-required housing outcome tracking", gap: "Single-population, single-domain. No workforce, no community health, no growth journey." },
                  { tool: "Google.org / generic survey tools", good: "Low cost data collection", gap: "Collects data, generates no shared framework or cross-org insight." },
                  { tool: "ThriveUp Academy", good: "Individual growth journey + org alignment + community gap analysis + funder evidence", gap: "Early-stage outcomes data. Honest about it." },
                ].map((r) => (
                  <tr key={r.tool} className={r.tool === "ThriveUp Academy" ? "bg-emerald-50 dark:bg-emerald-950/20 font-semibold" : ""}>
                    <td className="py-2 pr-3 font-medium">{r.tool}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{r.good}</td>
                    <td className="py-2 text-muted-foreground">{r.gap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── 3 · Framework credibility ─────────────────────────────── */}
        <Section id="framework">
          <SectionLabel icon={BookOpen} label="ALIGN framework — theoretical basis" />
          <h2 className="text-lg font-black mb-1">Is ALIGN real, or is this one person's idea?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            ALIGN is a practice framework authored by Dr. Terry Flood, Implementation Scientist, Psychologist,
            Data Engineer, Community Health Worker, and User-Centered Designer.
            It integrates established evidence-based frameworks — it does not replace them.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {[
              { label: "CFIR (Consolidated Framework for Implementation Research)", role: "Outer/inner setting assessment in Assess + Listen phases", url: "https://cfirwiki.net" },
              { label: "RE-AIM (Reach · Efficacy · Adoption · Implementation · Maintenance)", role: "Community-level evaluation scaffold in Navigate + THRIVE phases", url: "https://re-aim.org" },
              { label: "EPIS (Exploration, Preparation, Implementation, Sustainment)", role: "Org readiness arc maps directly to ALIGN's six phases", url: null },
              { label: "RNR (Risk-Need-Responsivity)", role: "Justice-involved population support in Guide + Navigate phases", url: null },
              { label: "FHIR / CDS-Hooks", role: "Health data interoperability standard underlying Navigator + benefits tools", url: "https://hl7.org/fhir" },
              { label: "Title IV-E Clearinghouse standards", role: "Foster youth program evaluation design", url: null },
            ].map((f) => (
              <div key={f.label} className="border rounded-xl p-3 bg-card space-y-1" data-testid={`card-framework-${f.label.split(" ")[0].toLowerCase()}`}>
                <p className="text-xs font-semibold">{f.label}</p>
                <p className="text-[10px] text-muted-foreground">{f.role}</p>
                {f.url && (
                  <a href={f.url} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-primary flex items-center gap-1 hover:underline">
                    <ExternalLink className="h-2.5 w-2.5" /> {f.url}
                  </a>
                )}
              </div>
            ))}
          </div>
          <div className="rounded-xl border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 p-4">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">On Spirit · Soul · Body language</p>
            <p className="text-xs text-muted-foreground">
              This language is drawn from holistic wellness traditions across Black, Latino, Indigenous, and faith communities — not from any single religious doctrine.
              Secular organizations should read Spirit as <em>purpose/values</em>, Soul as <em>culture/relationships</em>, and Body as <em>capacity/resources</em>.
              The three-domain model is consistent with biopsychosocial frameworks used in clinical and public health settings.
              No faith affiliation is required to participate.
            </p>
          </div>
        </Section>

        {/* ── 4 · Data governance ───────────────────────────────────── */}
        <Section id="data">
          <SectionLabel icon={Lock} label="Data governance" />
          <h2 className="text-lg font-black mb-1">Who owns the data? What if TCAF closes?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Communities of color have been over-researched and under-benefited for generations.
            These are the rules we operate by — not aspirational, operational.
          </p>
          <div className="space-y-3">
            {[
              { icon: Shield, title: "You own your data", body: "Organizations and individuals own the data they enter. TCAF is a steward, not an owner. Data is never sold, licensed, or shared with third parties without explicit consent for each specific use." },
              { icon: Download, title: "Full portability, always", body: "Any org or individual can export their complete dataset at any time in standard formats (JSON/CSV). No lock-in. If you leave, you leave with everything." },
              { icon: AlertCircle, title: "What happens if TCAF loses funding", body: "TCAF operates a two-entity structure (nonprofit + LLC) to ensure platform continuity. In the event of dissolution, a documented data-transfer protocol activates: partner orgs receive their data exports within 30 days, and open-source components are released publicly." },
              { icon: CircleDot, title: "Zero PHI egress by design", body: "The platform is architected to never transmit Protected Health Information outside the user's session. Health-adjacent data (FHIR, CDS-Hooks) is processed with 0-PHI-egress design: benefits screening results stay local unless the user explicitly authorizes sharing." },
              { icon: FileText, title: "Consent defaults", body: "All 8 consent layers default to OFF. Funders cannot see individual participant data unless the participant explicitly turns on shareWithFunder. Names are never public unless the user turns on nameMePublicly. No consent is bundled." },
              { icon: Layers, title: "Witness log", body: "Every data access event — who saw what, when — is logged in an auditable witness trail. Communities can request their witness log at any time." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-3 border rounded-xl p-4 bg-card" data-testid={`card-data-${item.title.toLowerCase().replace(/\s+/g,"-").slice(0,20)}`}>
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                    <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ── 5 · Community governance ──────────────────────────────── */}
        <Section id="governance">
          <SectionLabel icon={Users} label="Community governance" />
          <h2 className="text-lg font-black mb-1">Who's in the room when decisions get made?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Integration Through Invitation (ITI) is the platform's dignity primitive — named by Dr. Flood, 2026,
            built into every surface. It is the governance model, not just a feature.
          </p>
          <div className="rounded-xl border-2 border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20 p-4 mb-4">
            <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 mb-2">The ITI Non-Negotiables</p>
            <div className="space-y-1.5">
              {[
                "Self-identification with no credential check — informal caregivers, peer mentors, promotoras, and driveway journeymen are recognized without a license",
                "8 layered consent options, all defaulting OFF — no data moves without explicit per-use authorization",
                "Shadow workers (untitled community contributors) have stipend and credentialing pathways that are real, not aspirational",
                "AI never summarizes a shadow-worker story without aggregateMyData=true turned on by the contributor",
                "Funders cannot see individual data without the individual's shareWithFunder consent",
                "No public naming without nameMePublicly turned on — invisibility is a right",
                "Witness loop always on — contributors can see who has accessed their data",
                "Community members are invited into platform governance, not consulted after decisions are made",
              ].map((rule) => (
                <div key={rule} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="h-3 w-3 text-violet-500 mt-0.5 flex-shrink-0" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>
          <Answered
            question="Is this another top-down platform with 'community-centered' language?"
            answer="The platform was designed by a Black implementation scientist who is also a community health worker, psychologist, and data engineer. Decision-making surfaces are being built into the platform — not as a feature, but as the governance structure. Shadow workers and informal community contributors are stakeholders with formal roles, not recipients."
          />
        </Section>

        {/* ── 6 · Adoption cost ────────────────────────────────────── */}
        <Section id="adoption">
          <SectionLabel icon={BarChart3} label="Honest adoption cost" />
          <h2 className="text-lg font-black mb-1">What does this actually take from our staff?</h2>
          <p className="text-sm text-muted-foreground mb-4">Most platforms hide the real cost. Here it is.</p>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { phase: "Week 1", icon: Target, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/30", tasks: ["1 staff completes org ALIGN assessment (25 min)", "Map 3–5 programs to ALIGN phases (30 min)", "Invite 1–2 participants to try their journey (5 min each)"], value: "You have a community gap analysis and a program map — immediately usable in a grant narrative." },
                { phase: "Month 1", icon: RefreshCw, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", tasks: ["Weekly 10-min check-in to advance org phase", "Participant journeys accumulating passively", "Review community overview data"], value: "You have aggregate phase data across participants to show movement, not just service delivery." },
                { phase: "Month 3+", icon: Star, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", tasks: ["Export Community THRIVE Report for funder", "Share gap analysis with coalition partners", "Advance org to next ALIGN phase with evidence"], value: "You have a citable, funder-ready evidence document with zero additional data entry." },
              ].map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.phase} className={`rounded-xl border p-4 ${p.bg}`} data-testid={`card-adoption-${p.phase.toLowerCase().replace(/\s+/g,"-")}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`h-4 w-4 ${p.color}`} />
                      <p className={`text-xs font-bold ${p.color}`}>{p.phase}</p>
                    </div>
                    <ul className="space-y-1 mb-3">
                      {p.tasks.map((t) => (
                        <li key={t} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                          <ChevronRight className="h-2.5 w-2.5 mt-0.5 flex-shrink-0" />
                          {t}
                        </li>
                      ))}
                    </ul>
                    <p className="text-[10px] font-semibold border-t pt-2">{p.value}</p>
                  </div>
                );
              })}
            </div>
            <Answered
              question="What if we start and then don't have capacity to maintain it?"
              answer="Your org profile and participant data persist whether or not you log in weekly. There is no minimum activity requirement. Even a quarterly check-in generates community-level data that is valuable. You cannot fall behind — you can only step forward when you're ready."
            />
          </div>
        </Section>

        {/* ── 7 · Sustainability ───────────────────────────────────── */}
        <Section id="sustainability">
          <SectionLabel icon={Zap} label="Platform sustainability" />
          <h2 className="text-lg font-black mb-1">Will this still exist in 18 months?</h2>
          <p className="text-sm text-muted-foreground mb-4">A fair question. Here is the honest answer.</p>
          <div className="space-y-3">
            {[
              { label: "Two-entity structure", body: "TCAF operates as both a 501(c)(3) nonprofit (The Collaborative Advocate Foundation) and an LLC (ISS-LLC). The LLC structure provides earned revenue stability independent of grant cycles." },
              { label: "Grant portfolio diversification", body: "Platform operations are funded across federal (SAM.gov tracked), state, and private funder sources. No single grant represents more than [threshold]% of operating revenue. Multi-year grants are prioritized." },
              { label: "Hub Adoption Kit", body: "The platform is designed to be adopted and operated by other community hubs — reducing TCAF as a single point of failure. The Hub Adoption Kit allows regional organizations to run their own node of the network." },
              { label: "Open-source commitments", body: "Core ALIGN framework logic, consent infrastructure, and community reporting tools are committed to open-source release in the event of platform wind-down, ensuring community orgs retain access to the tools they built their work on." },
            ].map((item) => (
              <div key={item.label} className="border rounded-xl p-4 bg-card" data-testid={`card-sustain-${item.label.toLowerCase().replace(/\s+/g,"-").slice(0,20)}`}>
                <p className="text-sm font-semibold mb-1">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 8 · Field & mobile ───────────────────────────────────── */}
        <Section id="field">
          <SectionLabel icon={Smartphone} label="Field & mobile reality" />
          <h2 className="text-lg font-black mb-1">Does this work on a phone in the field?</h2>
          <div className="space-y-3">
            <Answered
              question="Our CHWs work from phones in parking lots and church halls. Will this work?"
              answer="Every participant-facing surface — the ALIGN journey, benefits screener, Navigator, Transition Plans — is fully responsive and tested on mobile. Field workers can complete assessments, advance phases, and view resources entirely from a phone browser. No app download required."
            />
            <Answered
              question="What about offline or low-connectivity areas?"
              answer="Full offline capability is on the roadmap (Q4 2026). Currently, the platform requires a data connection. For rural or low-connectivity deployments, we recommend using it at community anchor locations (libraries, churches, health centers). This is an honest gap we are building toward — not a problem we are calling solved."
            />
            <Answered
              question="Is it accessible for people with disabilities?"
              answer="The platform is built on WCAG 2.1 AA standards. Screen reader support, keyboard navigation, and high-contrast mode are implemented. We conduct accessibility reviews with each major release and welcome direct feedback from disabled community members."
            />
          </div>
        </Section>

        {/* ── 9 · Interoperability ─────────────────────────────────── */}
        <Section id="interop">
          <SectionLabel icon={Link2} label="Interoperability" />
          <h2 className="text-lg font-black mb-1">Does it connect to what we already use?</h2>
          <p className="text-sm text-muted-foreground mb-4">ThriveUp is not designed to replace your existing systems. It is designed to add the layer your existing systems are missing.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {[
              { status: "Live", label: "FHIR / CDS-Hooks", body: "Health data interoperability standard. Health-adjacent benefits data is structured in FHIR-compatible formats for eventual EHR integration." },
              { status: "Live", label: "107-language interface", body: "UI and AI-assisted navigation available in 107 languages. CHW conversations and Navigator responses adapt to the user's preferred language automatically." },
              { status: "Live", label: "SAM.gov / BidNet / RFPMart", body: "Grant intelligence pulls from federal and state procurement databases in real time. Org profiles inform grant matching." },
              { status: "In progress", label: "Unite Us / Findhelp.org API", body: "Bidirectional referral data sync so ALIGN journey data can inform referral decisions and referral outcomes can advance ALIGN phases." },
              { status: "In progress", label: "HMIS data bridge", body: "Housing outcome data from HMIS can map to ALIGN Body scores, eliminating duplicate data entry for housing-serving orgs." },
              { status: "Roadmap", label: "Salesforce NPSP", body: "Sync ALIGN org profiles with Salesforce contact/org records for orgs already using NPSP." },
            ].map((item) => (
              <div key={item.label} className="border rounded-xl p-3 bg-card" data-testid={`card-interop-${item.label.toLowerCase().replace(/[\s\/]+/g,"-").slice(0,20)}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`text-[9px] ${item.status === "Live" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : item.status === "In progress" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" : "bg-muted text-muted-foreground"}`}>
                    {item.status}
                  </Badge>
                  <p className="text-xs font-semibold">{item.label}</p>
                </div>
                <p className="text-[10px] text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Partner organizations with existing data systems can request a custom integration consultation via{" "}
            <a href="mailto:terryflood@thrivingcommunitiesforall.com" className="text-primary hover:underline">
              terryflood@thrivingcommunitiesforall.com
            </a>.
          </p>
        </Section>

        {/* ── 10 · Start here ──────────────────────────────────────── */}
        <Section id="start">
          <SectionLabel icon={ArrowRight} label="Start here" />
          <h2 className="text-lg font-black mb-1">Three ways in — pick the one that fits</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { icon: Users, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", title: "As an Individual", body: "Take the ALIGN journey. Track your own growth from Assess through THRIVE. 12 minutes to your first phase.", href: "/align/my-journey", cta: "Begin my journey" },
              { icon: Building2, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/30", title: "As an Organization", body: "Complete the org ALIGN assessment. Map your programs to phases. See where you fit in the community ecosystem.", href: "/align/org-assessment", cta: "Assess my organization" },
              { icon: Globe, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/30", title: "As a Funder or Evaluator", body: "See the Community THRIVE Dashboard. View aggregate phase data, gap analysis, and community Spirit · Soul · Body scores.", href: "/align/community", cta: "View community data" },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <Link key={p.title} href={p.href}>
                  <Card className={`border hover:border-primary/40 transition-all cursor-pointer h-full`} data-testid={`card-start-${p.title.toLowerCase().replace(/\s+/g,"-")}`}>
                    <CardContent className="pt-4 space-y-2">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${p.bg}`}>
                        <Icon className={`h-4 w-4 ${p.color}`} />
                      </div>
                      <p className="font-semibold text-sm">{p.title}</p>
                      <p className="text-[10px] text-muted-foreground">{p.body}</p>
                      <p className={`text-xs font-semibold flex items-center gap-1 ${p.color}`}>
                        {p.cta} <ArrowRight className="h-3 w-3" />
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground mb-2">Questions not answered here? Contact the platform directly.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <a href="mailto:terryflood@thrivingcommunitiesforall.com">
                <Button size="sm" variant="outline" className="gap-1" data-testid="button-contact-email">
                  <FileText className="h-3 w-3" /> terryflood@thrivingcommunitiesforall.com
                </Button>
              </a>
              <Link href="/align">
                <Button size="sm" variant="outline" className="gap-1" data-testid="button-align-home">
                  ALIGN home <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </Section>

      </div>
    </div>
  );
}
