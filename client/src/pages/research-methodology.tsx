import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import {
  Microscope, FlaskConical, BookOpen, FileText, GitBranch,
  Database, Lock, AlertTriangle, MessageSquare, Award, Users, ExternalLink,
} from "lucide-react";
import { PartnershipStatus, PartnershipStatusLegend } from "@/components/partnership-status";

export default function ResearchMethodologyPage() {
  useEffect(() => {
    document.title = "Research & Methodology | TCAF";
  }, []);

  return (
    <div className="container max-w-5xl py-8 px-4 space-y-8">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5 border-indigo-500 text-indigo-700 dark:text-indigo-300">
            <Microscope className="h-3.5 w-3.5" aria-hidden="true" /> Implementation Science · Open Methodology
          </Badge>
          <Badge variant="outline">Open Evidence · Pre-Print First</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
          Research & Methodology
        </h1>
        <p className="text-lg text-muted-foreground">
          Our research posture, the proprietary methodologies that anchor the platform, the open
          evidence framework we operate under, and our path to peer-reviewed publication.
        </p>
      </div>

      <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm space-y-1.5">
              <p className="font-semibold">Honest disclosure — research posture</p>
              <p className="text-muted-foreground">
                TCAF is an <span className="font-semibold text-foreground">applied implementation
                science organization</span>, not a traditional research university. We do not yet hold
                peer-reviewed publications in the methodologies described below; first peer-reviewed
                submissions are targeted for Q3 2026. Lead-applicant eligibility for peer-review-grade
                research funding is being addressed through active outreach to research-institution
                co-PIs (status documented below). We disclose this transparently because credible
                research postures are built on honest disclosure of where you are today.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" aria-hidden="true" /> Research Focus Areas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid sm:grid-cols-2 gap-2">
            <Focus name="Implementation science in community-based settings" />
            <Focus name="Healthcare workforce development" />
            <Focus name="Social Determinants of Health (SDOH) intervention measurement" />
            <Focus name="Public-health violence prevention" />
            <Focus name="Competency-based education and workforce certification" />
            <Focus name="AI-augmented community service delivery" />
            <Focus name="Evidence translation between research and frontline practice" />
            <Focus name="Faith-based + secular partnership models for under-served populations" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" /> Proprietary Methodologies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Each methodology below is documented in plain English, paired with citations to the
            underlying evidence base, and released as open methodology under the Open Innovation Lab.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <MethodCard
              acronym="RPLICE"
              full="Research-to-Practice Lifecycle Implementation & Community Evidence"
              desc="A protocol for moving published evidence into community-based program delivery while preserving fidelity and capturing community-specific evidence back into the research base. Anchored in the Knowledge-to-Action framework (Graham et al., 2006) and the Consolidated Framework for Implementation Research (CFIR; Damschroder et al., 2009)."
            />
            <MethodCard
              acronym="MAP-GAP"
              full="Measure-Analyze-Plan / Gap Analysis Protocol"
              desc="A continuous-improvement methodology for community programs: structured observation (MAP), prioritization of gaps (GAP), execution, validation, and persistent learning. Anchored in the Plan-Do-Study-Act (PDSA) cycle and the Institute for Healthcare Improvement Model for Improvement."
            />
            <MethodCard
              acronym="SALP"
              full="Strategic Adaptive Leadership Protocol"
              desc="A leadership model for community-based programs operating under uncertainty. Anchored in adaptive leadership theory (Heifetz, Grashow, & Linsky, 2009) and the Cynefin framework (Snowden & Boone, 2007)."
            />
            <MethodCard
              acronym="MG-PATR"
              full="Multi-Generational Performance Assessment & Trend Reporting"
              desc="A measurement framework for tracking program outcomes across generational cohorts within community-based programs. Anchored in life-course epidemiology and longitudinal cohort design literature."
            />
            <MethodCard
              acronym="ACOS"
              full="Adaptive Capability Orchestration System"
              desc="The system architecture pattern underlying our 24-platform ecosystem. Anchored in the dynamic capabilities literature (Teece, Pisano, & Shuen, 1997) and microservice/event-driven architecture patterns."
            />
            <MethodCard
              acronym="Three Realities Diagnostic"
              full="Multi-Dimensional Reality Assessment Framework"
              desc="A diagnostic protocol for distinguishing between organizational stated reality, operational reality, and beneficiary-experienced reality. Anchored in espoused-theory vs theory-in-use literature (Argyris & Schön, 1974)."
            />
          </div>
          <p className="text-xs text-muted-foreground italic pt-2 border-t">
            All methodologies are released as open documentation. The full method reference is available via the <Link href="/research-hub" className="text-primary hover:underline">Research Hub</Link> and the <Link href="/methodology" className="text-primary hover:underline">Methodology Catalog</Link>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" aria-hidden="true" /> Open Evidence Infrastructure
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Every program outcome is tracked in a public-by-default measurement system. Data
            provenance is preserved through cryptographic hash chains (SHA-256) so that reviewers and
            independent auditors can verify the integrity of every reported number.
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            <Capability icon={Lock} name="SHA-256 hash chain provenance" desc="Donor receipts and outcome records cryptographically chained" />
            <Capability icon={Database} name="Live US Census API integration" desc="Real-time SDOH data via Census Bureau ACS 5-year and PLACES" />
            <Capability icon={GitBranch} name="Versioned methodology" desc="Every methodology change tracked in version history" />
            <Capability icon={FileText} name="Public outcomes dashboard" desc="Quarterly outcomes published to the Transparency dashboard" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" aria-hidden="true" /> Research Institution Partnerships
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            For peer-review-grade research funding mechanisms, we are actively pursuing
            university co-PI partnerships. Status disclosed transparently.
          </p>
          <div className="space-y-2">
            <PartnerRow name="The University of Texas at Austin — Dell Medical School" role="Health-services research and implementation science co-PI candidate" stage="aspirational" />
            <PartnerRow name="Huston-Tillotson University" role="Historically Black University — co-investigator and broader-impacts partner" stage="aspirational" />
            <PartnerRow name="Austin Community College — Center for Public Policy & Political Studies" role="Workforce / community engagement research partner" stage="aspirational" />
            <PartnerRow name="Texas State University — School of Social Work" role="Implementation research and outcome measurement partner" stage="aspirational" />
          </div>
          <PartnershipStatusLegend />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" aria-hidden="true" /> Publication Pathway
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            First peer-reviewed submissions targeted for Q3 2026. Target outlets include:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li><span className="font-medium text-foreground">Implementation Science</span> — RPLICE protocol and CFIR-anchored implementation case studies</li>
            <li><span className="font-medium text-foreground">Health Affairs</span> — community-based behavioral health workforce development findings</li>
            <li><span className="font-medium text-foreground">Journal of Community Health</span> — multi-generational outcome measurement (MG-PATR)</li>
            <li><span className="font-medium text-foreground">Social Science Computer Review</span> — AI-augmented community service delivery (ACOS)</li>
          </ul>
          <p className="text-xs text-muted-foreground italic">
            Pre-prints will be released via the Open Science Framework (OSF) on submission. All
            datasets supporting publications will be released as de-identified open data with
            documented data dictionaries.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="pt-6 space-y-3">
          <p className="font-semibold">For research collaborators and academic partners:</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="default" data-testid="button-research-contact">
              <a href="mailto:research@thecollaborativeadvocate.org">
                <MessageSquare className="mr-2 h-4 w-4" /> research@thecollaborativeadvocate.org
              </a>
            </Button>
            <Button asChild variant="outline" data-testid="button-research-hub">
              <Link href="/research-hub">
                <FlaskConical className="mr-2 h-4 w-4" /> Open Research Hub
              </Link>
            </Button>
            <Button asChild variant="outline" data-testid="button-methodology-catalog">
              <Link href="/mapgap-framework">
                <BookOpen className="mr-2 h-4 w-4" /> Methodology Catalog
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Focus({ name }: { name: string }) {
  return (
    <div className="flex items-start gap-2">
      <FlaskConical className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
      <span>{name}</span>
    </div>
  );
}
function MethodCard({ acronym, full, desc }: { acronym: string; full: string; desc: string }) {
  return (
    <Card className="p-4 bg-background">
      <div className="flex items-baseline gap-2 mb-1">
        <p className="font-bold text-base">{acronym}</p>
        <p className="text-[11px] text-muted-foreground italic">{full}</p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </Card>
  );
}
function Capability({ icon: Icon, name, desc }: { icon: any; name: string; desc: string }) {
  return (
    <div className="p-3 rounded-md border bg-background space-y-1">
      <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" aria-hidden="true" /><p className="text-sm font-semibold">{name}</p></div>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
function PartnerRow({ name, role, stage }: { name: string; role: string; stage: any }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-md border bg-background" data-testid={`partner-research-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").substring(0, 40)}`}>
      <div className="flex-1 min-w-[200px]">
        <p className="text-sm font-semibold">{name}</p>
        <p className="text-xs text-muted-foreground">{role}</p>
      </div>
      <PartnershipStatus stage={stage} />
    </div>
  );
}
