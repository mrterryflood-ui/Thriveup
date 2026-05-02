import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import {
  Scale, Users, Briefcase, Home, FileText, BookOpen,
  CheckCircle2, AlertTriangle, MessageSquare, BarChart3, Shield, GraduationCap,
} from "lucide-react";
import { PartnershipStatus, PartnershipStatusLegend } from "@/components/partnership-status";

export default function ReentryProgramPage() {
  useEffect(() => {
    document.title = "Reentry Program — Second Chance Act Aligned | TCAF & ALC";
  }, []);

  return (
    <div className="container max-w-5xl py-8 px-4 space-y-8">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5 border-violet-500 text-violet-700 dark:text-violet-300">
            <Scale className="h-3.5 w-3.5" aria-hidden="true" /> BJA Second Chance Act FY26 Aligned
          </Badge>
          <Badge variant="outline">Faith-Based + Non-Discriminatory</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
          Reentry Program
        </h1>
        <p className="text-lg text-muted-foreground">
          A wraparound reentry program for adults returning to Travis County, Texas — built around
          evidence-based risk-needs assessment, employment-first service sequencing, and a
          documented fidelity framework aligned to BJA Second Chance Act program standards.
        </p>
      </div>

      <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm space-y-1.5">
              <p className="font-semibold">Honest disclosure — program status</p>
              <p className="text-muted-foreground">
                This is a <span className="font-semibold text-foreground">first-time SCA applicant</span>. We have not yet held an SCA award and therefore have no SCA prior-performance data. The program model, evidence base, fidelity framework, partnership pathway, and outcome measurement documented on this page are <span className="font-semibold text-foreground">application-ready as of April 2026</span> and were built specifically to BJA SCA program standards. We disclose this transparently because BJA reviewers reward applicants who name their state honestly and document a credible delivery plan.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" aria-hidden="true" /> Population
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Adults returning to Travis County, Texas (Austin, Pflugerville, Manor) from Texas
            Department of Criminal Justice (TDCJ), Travis County Correctional Complex, and federal
            facilities. Open to all returning citizens regardless of religion, sexual orientation,
            gender identity, race, national origin, or offense category — consistent with our{" "}
            <Link href="/non-discrimination" className="text-primary hover:underline">non-discrimination policy</Link>.
          </p>
          <p>
            Priority population: returning citizens identified as moderate-to-high risk by the
            Texas Risk Assessment System (TRAS) and individuals with documented behavioral health
            or substance use disorder needs.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" /> Evidence Base
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Our intervention model is grounded in the Risk-Needs-Responsivity (RNR) framework
            (Andrews & Bonta, 2010) and the Council of State Governments Justice Center National
            Reentry Resource Center evidence base.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <ModelCard
              title="Risk-Needs-Responsivity (RNR)"
              source="Andrews, Bonta, & Hoge (1990); Andrews & Bonta (2010)"
              desc="Match service intensity to risk level (risk principle), target criminogenic needs (need principle), and tailor delivery to learning style and motivation (responsivity principle). Validated as the strongest predictor of recidivism reduction across meta-analyses."
            />
            <ModelCard
              title="Texas Risk Assessment System (TRAS)"
              source="Texas Department of Criminal Justice"
              desc="State-validated risk-needs instrument used at intake to determine risk level and identify the criminogenic needs that drive service planning."
            />
            <ModelCard
              title="Cognitive Behavioral Intervention — Reentry (CBI-R)"
              source="University of Cincinnati Corrections Institute"
              desc="Manualized cognitive-behavioral curriculum for moderate-to-high risk returning citizens. Evidence-based recidivism reduction. Delivered with documented fidelity monitoring."
            />
            <ModelCard
              title="Employment-First Sequencing"
              source="National Reentry Resource Center"
              desc="Stable employment is the strongest single predictor of reduced recidivism. Our service sequence prioritizes immediate income through ALC-network employer placements, with longer-term skills training layered in."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" aria-hidden="true" /> Service Components
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid sm:grid-cols-2 gap-3">
            <Service icon={Home} title="Housing navigation" desc="Connection to transitional and permanent housing, including faith-network host families and continuum-of-care providers." />
            <Service icon={Briefcase} title="Employment placement" desc="Direct placement into ALC-network and partner employers with second-chance hiring practices. Job retention coaching for 12 months." />
            <Service icon={GraduationCap} title="Skills training" desc="Construction trades (CDL, OSHA-10, forklift), digital literacy, customer-service certification, and credentialed care-economy pathways." />
            <Service icon={Shield} title="Behavioral health" desc="Warm referral to Integral Care (LMHA), CommUnityCare, and SUD treatment providers. Same-day handoff for crisis." />
            <Service icon={Users} title="Mentorship" desc="Trained returning-citizen mentors with at least 5 years of successful community reintegration." />
            <Service icon={FileText} title="Legal support" desc="Driver license restoration, Texas Order of Nondisclosure / Expunction screening, child-support arrears modification, and warrant resolution." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" /> Fidelity Framework
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Program fidelity is monitored through the Correctional Program Checklist (CPC; Latessa &
            Lovins) framework and documented through the RPLICE (Research-to-Practice Lifecycle
            Implementation & Community Evidence) protocol developed by TCAF.
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Quarterly CPC fidelity self-assessment with annual external review</li>
            <li>CBI-R session audio review for adherence to manualized curriculum (10% sample)</li>
            <li>Risk-needs reassessment at 90-day intervals</li>
            <li>Participant feedback collection at intake, 90 days, 180 days, exit</li>
            <li>Public quarterly outcome reporting via Transparency dashboard</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" aria-hidden="true" /> Corrections System Partnerships
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="space-y-2">
            <PartnerRow name="Texas Department of Criminal Justice — Reentry & Integration Division" role="State corrections — pre-release coordination and TRAS data sharing" stage="outreach" />
            <PartnerRow name="Travis County Correctional Complex" role="County jail — pre-release coordination" stage="aspirational" />
            <PartnerRow name="Travis County Adult Probation" role="Community supervision coordination" stage="discovery" />
            <PartnerRow name="Travis County District Attorney — Reentry & Restorative Justice" role="DA office reentry initiatives" stage="aspirational" />
            <PartnerRow name="Goodwill Central Texas" role="Workforce development and employer pipeline" stage="discovery" />
            <PartnerRow name="Integral Care (Travis County LMHA)" role="Behavioral health and SUD warm-handoff" stage="outreach" />
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
          <p>
            All BJA SCA mandatory performance measures plus additional outcomes tied to long-term
            self-sufficiency.
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            <Metric name="Returning citizens served (unduplicated)" />
            <Metric name="Risk-needs assessments completed" />
            <Metric name="CBI-R curriculum completions" />
            <Metric name="Job placements" />
            <Metric name="Job retention at 90 / 180 / 365 days" />
            <Metric name="Stable housing at 90 / 180 / 365 days" />
            <Metric name="Re-arrest within 12 / 24 months" />
            <Metric name="Reconviction within 12 / 24 months" />
            <Metric name="Reincarceration within 12 / 24 months" />
            <Metric name="Behavioral health connection within 30 days (where indicated)" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="pt-6 space-y-3">
          <p className="font-semibold">For corrections, courts, and community partners:</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="default" data-testid="button-reentry-contact">
              <a href="mailto:reentry@thecollaborativeadvocate.org">
                <MessageSquare className="mr-2 h-4 w-4" /> reentry@thecollaborativeadvocate.org
              </a>
            </Button>
            <Button asChild variant="outline" data-testid="button-reentry-grants">
              <Link href="/grants/applications">
                <FileText className="mr-2 h-4 w-4" /> View SCA applications in flight
              </Link>
            </Button>
            <Button asChild variant="outline" data-testid="button-reentry-non-discrim">
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

function ModelCard({ title, source, desc }: { title: string; source: string; desc: string }) {
  return (
    <Card className="p-4 bg-background">
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-[11px] text-muted-foreground italic mb-2">Source: {source}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </Card>
  );
}
function Service({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="p-3 rounded-md border bg-background space-y-1">
      <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" aria-hidden="true" /><p className="text-sm font-semibold">{title}</p></div>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
function PartnerRow({ name, role, stage }: { name: string; role: string; stage: any }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-md border bg-background" data-testid={`partner-reentry-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
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
      <BarChart3 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
      <span className="text-sm">{name}</span>
    </div>
  );
}
