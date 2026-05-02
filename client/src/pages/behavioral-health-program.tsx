import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import {
  Heart, Activity, Users, Stethoscope, ClipboardCheck, FileText,
  CheckCircle2, AlertTriangle, MessageSquare, BarChart3, MapPin, Building2,
} from "lucide-react";
import { PartnershipStatus, PartnershipStatusLegend } from "@/components/partnership-status";

export default function BehavioralHealthProgramPage() {
  useEffect(() => {
    document.title = "Behavioral Health Program | TCAF & ALC";
  }, []);

  return (
    <div className="container max-w-5xl py-8 px-4 space-y-8">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5 border-emerald-500 text-emerald-700 dark:text-emerald-300">
            <Heart className="h-3.5 w-3.5" aria-hidden="true" /> Centene Foundation · St. David's Foundation Aligned
          </Badge>
          <Badge variant="outline">Texas Medicaid Aware</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
          Behavioral Health Program
        </h1>
        <p className="text-lg text-muted-foreground">
          A focused community-based behavioral health program for under-served Travis County
          residents — built around evidence-based screening, peer-supported navigation, and
          measurable outcomes inside the Texas Medicaid managed-care footprint.
        </p>
      </div>

      <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm space-y-1.5">
              <p className="font-semibold">Honest disclosure — program status</p>
              <p className="text-muted-foreground">
                This program is in <span className="font-semibold text-foreground">launch
                preparation</span>. The screening protocol, navigation model, partnership pathway, and
                outcome framework documented here are application-ready as of April 2026. Foundation
                outreach is active (status documented). We disclose this transparently because
                foundation program officers reward focused programs with credible operational plans
                over inflated claims.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" aria-hidden="true" /> Population & Geographic Focus
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="font-semibold">Geographic focus:</span> Travis County, Texas — with
            initial concentration in Pflugerville, Manor, and East Austin census tracts identified
            through CDC PLACES, ATSDR Social Vulnerability Index, and CMS Medicaid managed-care
            enrollment data as having the highest behavioral health unmet need in the region.
          </p>
          <p>
            <span className="font-semibold">Population focus:</span> Texas Medicaid beneficiaries
            (STAR, STAR+PLUS, STAR Kids), CHIP enrollees, and uninsured adults under 200% FPL.
            Special focus on populations historically under-served by traditional behavioral health
            delivery: Black, Hispanic/Latino, immigrant, and rural-adjacent residents.
          </p>
          <Separator />
          <div className="grid sm:grid-cols-2 gap-3">
            <Population label="Adults experiencing depression, anxiety, or trauma without access to ongoing care" />
            <Population label="Postpartum mothers screening positive for postpartum depression" />
            <Population label="Adolescents and transition-age youth (16–25) at risk for SUD" />
            <Population label="Family members of individuals with serious mental illness" />
            <Population label="Veterans not enrolled in VA care" />
            <Population label="Returning citizens reentering after incarceration" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" aria-hidden="true" /> Texas Medicaid MCO Alignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            The program is designed to integrate with Texas Medicaid managed-care organizations
            (MCOs) operating in the Travis Service Delivery Area, with particular alignment to
            the populations served by the MCOs operating in our footprint.
          </p>
          <div className="space-y-2">
            <PartnerRow
              name="Superior HealthPlan (Centene)"
              role="Texas Medicaid STAR + STAR+PLUS MCO — primary alignment for Centene Foundation pathway"
              stage="aspirational"
            />
            <PartnerRow
              name="Dell Children's Health Plan"
              role="Texas Medicaid STAR Kids MCO — pediatric and adolescent behavioral health alignment"
              stage="aspirational"
            />
            <PartnerRow
              name="Sendero Health Plans"
              role="Travis County local Medicaid MCO — county-rooted alignment"
              stage="aspirational"
            />
          </div>
          <p className="text-xs text-muted-foreground italic">
            Program services are designed to MCO-billable behavioral health and care-coordination
            standards (HCPCS T1017 case management, H0004 individual counseling, H0038 self-help/peer
            services) so that long-term sustainability paths through MCO contracting are open.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" aria-hidden="true" /> Screening & Intervention Protocol
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Validated, evidence-based screening at every intake. Stepped-care intervention model
            scaled to severity.
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            <Tool name="PHQ-9" desc="Depression severity — adults" />
            <Tool name="GAD-7" desc="Generalized anxiety — adults" />
            <Tool name="EPDS" desc="Edinburgh Postnatal Depression Scale — postpartum mothers" />
            <Tool name="PHQ-A" desc="Adolescent depression screening (11–17)" />
            <Tool name="C-SSRS" desc="Columbia Suicide Severity Rating Scale" />
            <Tool name="AUDIT-C" desc="Alcohol use disorder screen" />
            <Tool name="DAST-10" desc="Drug abuse screening tool" />
            <Tool name="PC-PTSD-5" desc="PTSD primary-care screen" />
          </div>
          <Separator />
          <p className="font-semibold">Stepped-care interventions:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li><span className="font-medium text-foreground">Mild–moderate</span>: Peer-supported navigation, brief CBT-informed coaching, warm referral to community resources, and follow-up contacts</li>
            <li><span className="font-medium text-foreground">Moderate–severe</span>: Same-day warm handoff to a clinical partner (LMHA, FQHC, or community mental health provider), case management, ongoing peer support</li>
            <li><span className="font-medium text-foreground">Crisis</span>: Direct connection to 988 Suicide & Crisis Lifeline, mobile crisis response, or Integral Care psychiatric emergency services</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" aria-hidden="true" /> Clinical Partnership Pathway
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="space-y-2">
            <PartnerRow name="Integral Care (Travis County LMHA)" role="Local Mental Health Authority — primary clinical referral and crisis-response partner" stage="outreach" />
            <PartnerRow name="CommUnityCare Health Centers" role="Federally Qualified Health Center — primary care + behavioral health integration" stage="discovery" />
            <PartnerRow name="St. David's Foundation network providers" role="Foundation-aligned community health partners" stage="outreach" />
            <PartnerRow name="People's Community Clinic" role="Federally Qualified Health Center — East Austin and Manor service area" stage="aspirational" />
          </div>
          <PartnershipStatusLegend />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" /> Outcome Measurement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid sm:grid-cols-2 gap-2">
            <Metric name="Adults screened (unduplicated)" />
            <Metric name="Adults connected to ongoing clinical care within 14 days" />
            <Metric name="PHQ-9 / GAD-7 score change at 90 days" />
            <Metric name="Postpartum mothers screened with EPDS" />
            <Metric name="Crisis warm-handoff completion rate" />
            <Metric name="Peer support session hours" />
            <Metric name="Medicaid enrollment assists" />
            <Metric name="Participant-reported quality-of-life change (PROMIS-10)" />
          </div>
          <p className="text-xs text-muted-foreground italic">
            All outcomes reported quarterly and surfaced on the public Transparency dashboard. Data
            collection complies with HIPAA and 42 CFR Part 2 (substance use confidentiality) where
            applicable.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="pt-6 space-y-3">
          <p className="font-semibold">For foundation program officers and clinical partners:</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="default" data-testid="button-bh-contact">
              <a href="mailto:behavioralhealth@thecollaborativeadvocate.org">
                <MessageSquare className="mr-2 h-4 w-4" /> behavioralhealth@thecollaborativeadvocate.org
              </a>
            </Button>
            <Button asChild variant="outline" data-testid="button-bh-grants">
              <Link href="/grants/applications">
                <FileText className="mr-2 h-4 w-4" /> View grant applications in flight
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Population({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
function Tool({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="p-2 rounded border bg-background">
      <p className="text-sm font-semibold">{name}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
function PartnerRow({ name, role, stage }: { name: string; role: string; stage: any }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-md border bg-background" data-testid={`partner-bh-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
      <div className="flex-1 min-w-[200px]">
        <p className="text-sm font-semibold">{name}</p>
        <p className="text-xs text-muted-foreground">{role}</p>
      </div>
      <PartnershipStatus stage={stage} />
    </div>
  );
}
function Metric({ name }: { name: string }) {
  return (
    <div className="flex items-start gap-2">
      <Activity className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
      <span className="text-sm">{name}</span>
    </div>
  );
}
