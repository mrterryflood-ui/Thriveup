import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import {
  Shield, Heart, Phone, Users, Award, FileText,
  AlertTriangle, CheckCircle2, ExternalLink, BookOpen, Stethoscope,
  HandHeart, ClipboardCheck, MessageSquare,
} from "lucide-react";
import { PartnershipStatus, PartnershipStatusLegend } from "@/components/partnership-status";

export default function VeteransProgramPage() {
  useEffect(() => {
    document.title = "Veterans Program — SSG Fox Suicide Prevention Pathway | TCAF";
  }, []);

  return (
    <div className="container max-w-5xl py-8 px-4 space-y-8">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5 border-blue-500 text-blue-700 dark:text-blue-300">
            <Shield className="h-3.5 w-3.5" aria-hidden="true" /> VA OMHSP — SSG Fox FY27 Aligned
          </Badge>
          <Badge variant="outline" className="gap-1.5">Veteran-Founded · Veteran-Led</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
          Veterans Suicide Prevention Program
        </h1>
        <p className="text-lg text-muted-foreground">
          A Central Texas, community-based pathway to suicide prevention, peer support, and stable
          benefits for Veterans and their families — built by a Veteran-led team and structured to
          the SSG Fox Veterans Suicide Prevention Grant Program standards.
        </p>
      </div>

      {/* Crisis line — always first */}
      <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-950/30" data-testid="card-crisis-line">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Phone className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0 mt-1" aria-hidden="true" />
            <div className="space-y-1.5">
              <p className="font-bold text-red-700 dark:text-red-300">If you are a Veteran in crisis, or concerned about one:</p>
              <p className="text-sm">
                Call the <span className="font-semibold">Veterans Crisis Line: Dial 988, then Press 1</span>.
                Text <span className="font-semibold">838255</span>. Chat at{" "}
                <a href="https://www.veteranscrisisline.net/" target="_blank" rel="noopener noreferrer"
                  className="underline font-semibold inline-flex items-center gap-1" data-testid="link-vcl">
                  veteranscrisisline.net <ExternalLink className="h-3 w-3" />
                </a>. Available 24/7. Free and confidential.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Honest disclosure — FY27 launch */}
      <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm space-y-1.5">
              <p className="font-semibold">Honest disclosure — program status</p>
              <p className="text-muted-foreground">
                This is an <span className="font-semibold text-foreground">FY27 launch cohort</span>. We have not yet served Veterans under an SSG Fox award. The program model, clinical partnership pathway, peer-support workforce plan, and outcome measurement framework documented on this page are <span className="font-semibold text-foreground">application-ready as of April 2026</span>. Active outreach is underway with named clinical partners (status documented below). We disclose this transparently because the SSG Fox NOFO rewards applicants who name their state honestly and document a credible plan to serve.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Who we will serve */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" aria-hidden="true" /> Who We Serve
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            All eligible Veterans and their family members regardless of religion, sexual orientation,
            gender identity, race, national origin, disability, or character of discharge —
            consistent with VA SSG Fox non-discrimination conditions.{" "}
            <Link href="/non-discrimination" className="text-primary hover:underline" data-testid="link-non-discrim">Read full statement</Link>.
          </p>
          <Separator />
          <div className="grid sm:grid-cols-2 gap-3">
            <Population label="Post-9/11 Veterans transitioning to civilian life" />
            <Population label="Vietnam-era Veterans facing late-life isolation" />
            <Population label="Veterans with previous suicide attempts or ideation" />
            <Population label="Veterans with VA enrollment barriers (OTH discharge, rural access)" />
            <Population label="National Guard and Reserve members between activations" />
            <Population label="Veteran family members (spouses, partners, parents, children)" />
          </div>
        </CardContent>
      </Card>

      {/* Program model — evidence-based */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" /> Evidence-Based Program Model
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            Our suicide prevention program is built around four evidence-based interventions cited in
            the VA/DoD Clinical Practice Guideline for the Assessment and Management of Patients at
            Risk for Suicide (2024) and the SAMHSA Suicide Prevention Resource Center evidence base.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <ModelCard
              title="Safety Planning Intervention (SPI)"
              source="Stanley & Brown (2012)"
              desc="Brief, collaborative intervention completed at first contact. Six-step safety plan: warning signs, internal coping strategies, social supports, professional help, environment safety, and reasons for living."
            />
            <ModelCard
              title="Counseling on Access to Lethal Means (CALM)"
              source="Suicide Prevention Resource Center"
              desc="Evidence-based clinical training to reduce suicide risk by limiting at-risk individuals' access to firearms and other lethal means. All TCAF/ALC clinical staff and peer specialists complete CALM training."
            />
            <ModelCard
              title="Caring Contacts"
              source="Motto & Bostrom (2001); Comtois et al. (2019)"
              desc="Brief, non-demanding, periodic messages of care from program staff to Veterans following crisis contact or program enrollment. Demonstrated reduction in suicide attempts in randomized trials."
            />
            <ModelCard
              title="Peer Support Specialist Model"
              source="VA Peer Support Service standards"
              desc="Veteran-to-Veteran lived-experience peer specialists, certified through Texas DSHS Peer Specialist certification or VA-recognized equivalent, embedded across every program touchpoint."
            />
          </div>
        </CardContent>
      </Card>

      {/* Mandatory baseline screening */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" aria-hidden="true" /> Mandatory Baseline Mental Health Screening
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            The SSG Fox NOFO requires baseline mental health screening for every program participant
            age 18 or older. Our screening protocol pairs the validated PHQ-9 (depression) and GAD-7
            (anxiety) instruments with the Columbia-Suicide Severity Rating Scale (C-SSRS) screen
            version, administered at intake by trained clinical staff or certified peer specialists
            under clinical supervision.
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li><span className="font-medium text-foreground">PHQ-9</span> — Patient Health Questionnaire (depression severity, validated for Veteran populations)</li>
            <li><span className="font-medium text-foreground">GAD-7</span> — Generalized Anxiety Disorder scale (anxiety severity, validated)</li>
            <li><span className="font-medium text-foreground">C-SSRS Screen</span> — Columbia Suicide Severity Rating Scale (suicide ideation and behavior screen)</li>
            <li><span className="font-medium text-foreground">AUDIT-C</span> — Alcohol Use Disorders Identification Test (substance use co-occurring screen)</li>
          </ul>
          <p className="text-xs text-muted-foreground italic">
            Screening positive on any instrument triggers same-day warm handoff to a clinical partner
            (Local Mental Health Authority or VA medical center) per the documented warm-handoff
            protocol.
          </p>
        </CardContent>
      </Card>

      {/* Clinical partners */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" aria-hidden="true" /> Clinical Partnership Pathway
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            SSG Fox requires documented clinical partnerships for warm-handoff care. Our partnership
            pathway is structured around the Travis County continuum of care.
          </p>
          <div className="space-y-2">
            <PartnerRow
              name="Integral Care (Travis County LMHA)"
              role="Local Mental Health Authority — primary clinical referral partner"
              stage="outreach"
            />
            <PartnerRow
              name="Central Texas Veterans Health Care System (Temple, TX)"
              role="VA medical center — coordinated care for VA-enrolled Veterans"
              stage="outreach"
            />
            <PartnerRow
              name="CommUnityCare Health Centers"
              role="Federally Qualified Health Center — primary care integration"
              stage="discovery"
            />
            <PartnerRow
              name="Austin VA Outpatient Clinic"
              role="VA outpatient mental health and primary care services"
              stage="aspirational"
            />
          </div>
          <PartnershipStatusLegend />
        </CardContent>
      </Card>

      {/* Peer support workforce */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HandHeart className="h-5 w-5 text-primary" aria-hidden="true" /> Peer Support Workforce
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Every Veteran-facing role on the program team is held by a Veteran with lived experience
            and current peer-support certification. Certifications recognized:
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            <CertRow name="Texas DSHS Peer Specialist Certification" />
            <CertRow name="VA Peer Support Specialist Training" />
            <CertRow name="MHA National Certified Peer Specialist (NCPS)" />
            <CertRow name="ASIST (Applied Suicide Intervention Skills Training)" />
            <CertRow name="QPR (Question, Persuade, Refer) Suicide Prevention Gatekeeper Training" />
            <CertRow name="CALM (Counseling on Access to Lethal Means)" />
          </div>
          <p className="text-xs text-muted-foreground italic">
            Workforce pathway: existing Veteran community members enroll in Texas DSHS Peer Specialist
            training (40-hour curriculum + 250 supervised practice hours) and receive stipend support
            during certification. Documented in TCAF's workforce development plan.
          </p>
        </CardContent>
      </Card>

      {/* Outcome measurement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" aria-hidden="true" /> Outcome Measurement Framework
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Every SSG Fox required outcome metric is tracked in our outcome measurement system. Pre-,
            mid-, and post-program data collection, with quarterly reporting to VA OMHSP per grant
            terms.
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            <Metric name="Veterans served (unduplicated)" />
            <Metric name="Veterans completing baseline screening" />
            <Metric name="Veterans receiving safety plans" />
            <Metric name="Warm-handoffs to clinical care" />
            <Metric name="Peer support session hours" />
            <Metric name="PHQ-9 / GAD-7 / C-SSRS change scores" />
            <Metric name="Benefits-enrollment outcomes (VA, SNAP, housing)" />
            <Metric name="Suicide attempts averted (incident tracking)" />
          </div>
        </CardContent>
      </Card>

      {/* CTAs */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6 space-y-3">
          <p className="font-semibold">For Veterans, families, and clinical partners:</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="default" data-testid="button-veteran-contact">
              <a href="mailto:veterans@thecollaborativeadvocate.org">
                <MessageSquare className="mr-2 h-4 w-4" /> veterans@thecollaborativeadvocate.org
              </a>
            </Button>
            <Button asChild variant="outline" data-testid="button-program-contact">
              <a href="mailto:president@thecollaborativeadvocate.org">
                <FileText className="mr-2 h-4 w-4" /> Partnership inquiries
              </a>
            </Button>
            <Button asChild variant="outline" data-testid="button-non-discrim">
              <Link href="/non-discrimination">
                <Shield className="mr-2 h-4 w-4" /> Non-discrimination policy
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

function ModelCard({ title, source, desc }: { title: string; source: string; desc: string }) {
  return (
    <Card className="p-4 bg-background">
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-[11px] text-muted-foreground italic mb-2">Source: {source}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </Card>
  );
}

function PartnerRow({ name, role, stage }: { name: string; role: string; stage: any }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-md border bg-background" data-testid={`partner-row-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
      <div className="flex-1 min-w-[200px]">
        <p className="text-sm font-semibold">{name}</p>
        <p className="text-xs text-muted-foreground">{role}</p>
      </div>
      <PartnershipStatus stage={stage} />
    </div>
  );
}

function CertRow({ name }: { name: string }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
      <span>{name}</span>
    </div>
  );
}
