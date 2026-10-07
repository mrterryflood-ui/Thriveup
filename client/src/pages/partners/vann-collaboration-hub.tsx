import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Handshake, Users, Sparkles, Heart, BookOpen, Globe, LifeBuoy, ShieldAlert,
  Radio, GraduationCap, ArrowRight, FileText, MapPin, ClipboardCheck, Quote,
} from "lucide-react";

const ECOSYSTEM = [
  { id: "thriveup-academy", name: "ThriveUp", icon: GraduationCap, value: "Workforce, financial literacy, FAFSA, attendance & dosage tracking — the platform your tracker plugs into.", href: "/academy", category: "TCAF" },
  { id: "whole-person-health", name: "Whole-Person Health", icon: Heart, value: "Behavioral-health screenings (PHQ-9, GAD-7) and crisis routing. Direct fit for your Sedgwick County Mental Health Advisory Board lane.", href: "https://mentalwellnesssupport.net", category: "ecosystem" },
  { id: "bible-study-buddies", name: "Bible Study Buddies", icon: BookOpen, value: "Faith-formation curriculum & cohorts. Built for the Iasis Joshua Generation / Academy of Excellence Wednesday tracks.", href: "/network-members", category: "ecosystem" },
  { id: "talk-your-talk", name: "Talk Your Talk", icon: Globe, value: "89 spoken + 18 sign = 107 total languages, RTL-aware. Spanish + Vietnamese materials for the Wichita households who need them.", href: "https://talkyourtalk.net", category: "ecosystem" },
  { id: "lifebridge-virtual-211", name: "LifeBridge (Virtual 211)", icon: LifeBuoy, value: "Wraparound resource navigation + CHW dispatch. Every family's referrals tracked at the household level.", href: "/resources", category: "ecosystem" },
  { id: "safereport", name: "SafeReport", icon: ShieldAlert, value: "50-state mandatory-reporter system. Critical safety net for any youth program serving minors.", href: "/safereport", category: "ecosystem" },
  { id: "sankofa-health-network", name: "Sankofa Health Network", icon: Users, value: "African-diaspora health knowledge layer. Pairs naturally with SCWT's Healthy Me initiative.", href: "/sankofa", category: "ecosystem" },
  { id: "herhealth-network", name: "HerHealth Network", icon: Heart, value: "Black maternal & women's health hub. Direct overlap with Sistahs Can We Talk's mission.", href: "/herhealth", category: "ecosystem" },
  { id: "civic-signal", name: "Civic Signal", icon: Radio, value: "Community engagement substrate. Pairs with your KSUN Radio 95.9 Saturday platform.", href: "/civic-signal", category: "ecosystem" },
];

export default function VannCollaborationHubPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" data-testid="page-vann-hub">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Handshake className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Community Partner Hub</h1>
        </div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Featured collaboration: Sistahs Can We Talk + Iasis Christian Center
        </p>
        <p className="text-muted-foreground max-w-3xl">
          A working-session workspace for Dr. J. Michelle Vann (Sistahs Can We Talk &amp; Iasis Christian Center) and TCAF /
          ThriveUp. Two seeded organizations, the full ecosystem map, a working family/youth tracker, and
          two live RFP-match storylines — designed to be picked up and used on day one.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-5 w-5" /> Family &amp; Program Tracker</CardTitle>
            <CardDescription>Households, members, weekly attendance, services engaged. CSV upload, exports, recharts. Day-one usable.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild data-testid="cta-tracker">
              <Link href="/partners/family-program-tracker">Open the tracker <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-5 w-5" /> RFP-Match Storyteller</CardTitle>
            <CardDescription>Two anchor RFPs (SAMHSA Minority BH + Wichita CDBG) with every requirement matched verbatim to a live data point.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild data-testid="cta-storyteller">
              <Link href="/partners/rfp-storyteller">Open the storyteller <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Who's who */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Who's at the table</CardTitle>
          <CardDescription>Three vehicles, one person. Each plays a distinct role in any partnership we structure.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <WhoCard
            name="Sistahs Can We Talk Inc."
            type="501(c)(3) since 2015"
            role="Primary KS-side grant applicant. BIPOC women's health, free cancer screenings, Healthy Me Initiative, youth mentoring, digital storytelling. 29th &amp; Grove neighborhood, Wichita."
            footer="Founder &amp; President: Dr. J. Michelle Vann"
            href="http://www.sistahscanwetalk.com"
          />
          <WhoCard
            name="Iasis Christian Center"
            type="Pentecostal/Apostolic, 37+ years"
            role="Wednesday youth programs: Joshua Generation (12+) and Academy of Excellence (≤11), 5:30–7pm — meal &amp; transportation provided. Children's Ministry Sundays."
            footer="Senior Pastor: William Vann · First Lady: Michelle Vann"
            href="https://www.iccwichita.org"
            warning="COI disclosure required on any federal grant citing Iasis attendance data — spouse relationship."
          />
          <WhoCard
            name="Vanntastic Solutions"
            type="For-profit LLC"
            role="Executive wellness coaching, speaking, books (Healthy Plates, Stop the Merry-Go-Round, Help Along the Journey, From Supporting Role to Leading Lady)."
            footer="Principal: Dr. J. Michelle Vann · TEDxNewmanUniversity speaker"
          />
        </CardContent>
      </Card>

      {/* Other affiliations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Affiliations that change the strategy</CardTitle>
          <CardDescription>These extend the reach of any joint pursuit beyond the three vehicles above.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="outline" data-testid="badge-aff-sedgwick"><MapPin className="h-3 w-3 mr-1" />Sedgwick County Mental Health Advisory Board (seat)</Badge>
          <Badge variant="outline" data-testid="badge-aff-ksun"><Radio className="h-3 w-3 mr-1" />KSUN Radio 95.9 — Spotlight on Business host</Badge>
          <Badge variant="outline">Tabor College Wichita (Adjunct)</Badge>
          <Badge variant="outline">Friends University (former Dual-Credit Coordinator)</Badge>
          <Badge variant="outline">Wichita Public Schools (20-yr veteran, retired)</Badge>
          <Badge variant="outline">Greater Wichita Ministerial League</Badge>
          <Badge variant="outline">WeKan (Women Entrepreneurs of Kansas)</Badge>
          <Badge variant="outline">Health &amp; Wellness Coalition of Wichita</Badge>
          <Badge variant="outline">Anthropocene Alliance member</Badge>
          <Badge variant="outline">Camp Destination Innovation (community member)</Badge>
        </CardContent>
      </Card>

      {/* Ecosystem map */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">The full ecosystem you'd be plugging into</CardTitle>
          <CardDescription>
            Nine surfaces, one integrated platform. The tracker is the front door; everything else extends it.
            Externally we describe this as <strong>15 service platforms operated by TCAF</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {ECOSYSTEM.map(e => {
            const Icon = e.icon;
            const external = e.href.startsWith("http");
            const Wrapper = external
              ? ({ children }: { children: React.ReactNode }) => <a href={e.href} target="_blank" rel="noopener noreferrer">{children}</a>
              : ({ children }: { children: React.ReactNode }) => <Link href={e.href}>{children}</Link>;
            return (
              <Wrapper key={e.name}>
                <div className="border rounded p-3 hover:border-primary hover:shadow-sm transition cursor-pointer h-full" data-testid={`card-ecosystem-${e.id}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{e.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{e.value}</p>
                </div>
              </Wrapper>
            );
          })}
        </CardContent>
      </Card>

      {/* Walkthrough script */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><ClipboardCheck className="h-5 w-5" /> 7-minute walkthrough script</CardTitle>
          <CardDescription>Click through these in order during the conversation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Step n={1} time="0:00">Open this hub. "Here's everything together — your two organizations, your network, and the platform around it."</Step>
          <Step n={2} time="1:00">Click into the <strong>Family &amp; Program Tracker</strong>. Switch from Sistahs CWT → Iasis. "Same infrastructure; two separate rosters; the COI disclosure appears automatically on the Iasis side."</Step>
          <Step n={3} time="2:30">Open a household. Show: members, language preference, program enrollments, attendance trend, services received. "Family is the unit. Not just the kid in Joshua Gen — the whole household."</Step>
          <Step n={4} time="4:00">Click <strong>Check in attendance</strong>. Mark a Wednesday session. "This is what next Wednesday at 5:30 looks like with this open on a tablet."</Step>
          <Step n={5} time="5:00">Open the <strong>RFP-Match Storyteller</strong>. Show the SAMHSA panel — every requirement satisfied by a live number. Switch to the Wichita CDBG tab. "Federal scaling-up. Local scaling-out. Same data."</Step>
          <Step n={6} time="6:30">Return to this hub. "Bible Study Buddies for Iasis. Whole-Person Health for your Sedgwick board. HerHealth + Sankofa for Sistahs. Talk Your Talk for the Spanish + Vietnamese families. LifeBridge for everything else."</Step>
          <Step n={7} time="7:00">"Two organizations, one partnership. Pick a federal target with us and we file it in 60 days."</Step>
        </CardContent>
      </Card>

      {/* COI */}
      <Alert className="border-amber-500/40 bg-amber-500/5">
        <ShieldAlert className="h-4 w-4 text-amber-600" />
        <AlertTitle>Standing disclosure (always visible on the Iasis instance)</AlertTitle>
        <AlertDescription className="text-sm">
          Iasis Christian Center is led by Pastor William Vann, spouse of Dr. J. Michelle Vann (Sistahs CWT Founder).
          On any federal grant application citing Iasis attendance data, this relationship is disclosed in the
          application's conflict-of-interest section. Routine — not a programmatic barrier.
        </AlertDescription>
      </Alert>

      {/* Anchor pursuits */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><FileText className="h-5 w-5" /> The two anchor pursuits</CardTitle>
          <CardDescription>What this partnership ships in the next 12 months.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="border rounded p-3">
            <div className="font-medium">Federal · scaling-up</div>
            <div className="text-xs text-muted-foreground mt-1">SAMHSA Minority Behavioral Health · TCAF prime · Sistahs CWT named subrecipient · evaluation via TCAF's research bench · letter of support from her Sedgwick County MH Board seat.</div>
          </div>
          <div className="border rounded p-3">
            <div className="font-medium">Local · scaling-out</div>
            <div className="text-xs text-muted-foreground mt-1">City of Wichita CDBG Public Services 2026 ($475K pool, $50K floor) · Sistahs CWT prime · TCAF as technology + evaluation partner · ZoomGrants-ready exports already built into the tracker.</div>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground italic flex items-start gap-2">
        <Quote className="h-3 w-3 mt-0.5 shrink-0" />
        <span>
          Honest disclosure: Demo cohort data is illustrative placeholders for the conversation. No real Sistahs CWT or Iasis member data is represented. TCAF is IRS-determined 501(c)(3) (Letter 947, eff. 01/14/2026), SAM.gov Active (UEI KDDVD1FGLW35, CAGE 209N1). St. David's Foundation status: actively evaluating.
        </span>
      </div>
    </div>
  );
}

function WhoCard({ name, type, role, footer, href, warning }: { name: string; type: string; role: string; footer: string; href?: string; warning?: string }) {
  const inner = (
    <div className="border rounded p-3 h-full hover:border-primary transition" data-testid={`card-who-${name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}>
      <div className="text-sm font-medium">{name}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">{type}</div>
      <div className="text-xs mt-2">{role}</div>
      <div className="text-[10px] text-muted-foreground mt-2">{footer}</div>
      {warning && (
        <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-2 border-t pt-2 flex items-start gap-1">
          <ShieldAlert className="h-3 w-3 mt-0.5 shrink-0" />
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
  return href ? <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a> : inner;
}

function Step({ n, time, children }: { n: number; time: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 border-l-2 border-primary/40 pl-3 py-1">
      <span className="text-xs font-medium text-muted-foreground shrink-0 w-12">{time}</span>
      <span className="text-xs">{children}</span>
    </div>
  );
}
