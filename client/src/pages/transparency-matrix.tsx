import { useEffect } from "react";
import { RequireAuth } from "@/components/require-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import {
  CheckCircle2, Clock, FlaskConical, Activity, FileText, Shield,
  AlertTriangle, MapPin, Users, BarChart3, Heart, Scale, Microscope, Briefcase,
} from "lucide-react";

type MatrixStatus = "operational" | "pilot" | "in-development" | "exploratory";

const STATUS_META: Record<MatrixStatus, { label: string; tone: string; icon: any }> = {
  operational: { label: "Operational", tone: "border-emerald-500 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30", icon: CheckCircle2 },
  pilot: { label: "Active Pilot", tone: "border-sky-500 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/30", icon: Activity },
  "in-development": { label: "In Development", tone: "border-amber-500 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30", icon: Clock },
  exploratory: { label: "Exploratory / Aspirational", tone: "border-violet-500 text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/30", icon: FlaskConical },
};

interface MatrixRow {
  area: string;
  description: string;
  status: MatrixStatus;
  evidence: string;
  category: "infra" | "program" | "research";
  icon: any;
}

const MATRIX_ROWS: MatrixRow[] = [
  // Infrastructure / Organizational
  { area: "Abundant Life Church 501(c)(3) status", description: "Active IRS 501(c)(3) determination — legal applicant and fiscal sponsor for all current grant submissions.", status: "operational", evidence: "IRS determination letter on file (available to funders on request).", category: "infra", icon: Shield },
  { area: "TCAF 501(c)(3) determination", description: "Independent 501(c)(3) application filed 4/27/2026; pending IRS review.", status: "in-development", evidence: "IRS Tracking 281OIP7B. Currently operating as a sub-recipient under ALC fiscal sponsorship.", category: "infra", icon: FileText },
  { area: "TCAF–ALC Memorandum of Understanding", description: "Signed MOU governing fiscal-sponsorship relationship and roles.", status: "operational", evidence: "Executed MOU on file.", category: "infra", icon: FileText },
  { area: "24-platform Autonomous Community Operating System", description: "Live platform ecosystem with 23 of 24 platforms reachable, automated outbound pinger every 10 minutes, public uptime reporting.", status: "operational", evidence: "Live status visible on the Transparency Dashboard. Pinger logs available to reviewers.", category: "infra", icon: Activity },
  { area: "Donor receipt provenance (SHA-256 hash chain)", description: "Cryptographic chain across donor receipts ensuring tamper-evidence.", status: "operational", evidence: "Public receipts log on the Transparency Dashboard.", category: "infra", icon: Shield },
  { area: "Live Census API integration", description: "US Census Bureau ACS 5-year and CDC PLACES integration powering SDOH tools.", status: "operational", evidence: "Live data refresh visible on neighborhood-intel and opportunity-youth pages.", category: "infra", icon: BarChart3 },

  // Programs
  { area: "St. David's Foundation WAB2 — 5-county benefits enrollment", description: "Travis, Williamson, Hays, Bastrop, Caldwell counties; single front door + 9-benefit screener + operator workspace.", status: "pilot", evidence: "WAB2 LOI v7 submitted 4/27/2026; St. David's actively evaluating. Enrollment infrastructure operational and ready for enrollee throughput on award.", category: "program", icon: Heart },
  { area: "Travis County Justice Command Center", description: "Live justice intelligence platform with county-level data integration and resource directory.", status: "operational", evidence: "Platform live; admin-gated detailed view available.", category: "program", icon: Scale },
  { area: "Veterans Suicide Prevention Program (SSG Fox)", description: "Evidence-based program model, mandatory baseline screening protocol, peer-support workforce plan, and clinical partnership pathway.", status: "in-development", evidence: "FY27 launch cohort. Program documentation application-ready; clinical partnership outreach active. See /veterans.", category: "program", icon: Shield },
  { area: "Behavioral Health Program (Centene · St. David's)", description: "Stepped-care behavioral health navigation with validated screening battery and Texas Medicaid MCO alignment.", status: "in-development", evidence: "Foundation outreach active. Program model application-ready. See /behavioral-health.", category: "program", icon: Heart },
  { area: "Reentry Program (BJA Second Chance Act)", description: "RNR-anchored reentry program with employment-first sequencing, CBI-R curriculum, and CPC fidelity framework.", status: "in-development", evidence: "First-time SCA applicant. Program model application-ready; corrections-system partnership outreach active. See /reentry-program.", category: "program", icon: Scale },
  { area: "Black Maternal Health Network", description: "One of 10 health-focused platforms in the ACOS ecosystem; live and reachable.", status: "pilot", evidence: "Platform live; awaiting funded pilot to support operational scaling.", category: "program", icon: Heart },
  { area: "Mission Transition (M2C) Veterans platform", description: "Veterans transition platform; live and reachable.", status: "pilot", evidence: "Platform live; awaiting funded pilot.", category: "program", icon: Shield },

  // Research / Methodology
  { area: "RPLICE methodology", description: "Research-to-Practice Lifecycle Implementation & Community Evidence protocol.", status: "operational", evidence: "Documented and applied internally. First peer-reviewed submission targeted Q3 2026. See /research.", category: "research", icon: Microscope },
  { area: "MAP-GAP continuous improvement framework", description: "Measure-Analyze-Plan / Gap Analysis Protocol for program quality improvement.", status: "operational", evidence: "Documented and operating; see /mapgap-framework and /cqi.", category: "research", icon: Microscope },
  { area: "MG-PATR multi-generational measurement", description: "Multi-Generational Performance Assessment & Trend Reporting framework.", status: "in-development", evidence: "Methodology documented; awaiting longitudinal data accumulation for first reporting.", category: "research", icon: BarChart3 },
  { area: "NSF research-institution co-PI partnership", description: "University co-PI required for NSF lead-applicant eligibility.", status: "exploratory", evidence: "Outreach active to UT Austin Dell Med, Huston-Tillotson, Texas State, and ACC. No signed co-PI agreement yet. See /research.", category: "research", icon: Users },
  { area: "Peer-reviewed publication record", description: "Peer-reviewed publications under TCAF authorship.", status: "in-development", evidence: "First submissions targeted Q3 2026; pre-prints will release via OSF on submission. No published peer-reviewed papers yet.", category: "research", icon: FileText },
];

export default function TransparencyMatrixPageGated() {
  return (
    <RequireAuth reason="The Transparency Matrix lists internal capability status across the funder pursuit pipeline. It is intended for partners and staff, not the public site.">
      <TransparencyMatrixPage />
    </RequireAuth>
  );
}

function TransparencyMatrixPage() {
  useEffect(() => {
    document.title = "Transparency Matrix | TCAF & ALC";
  }, []);

  const groups: { key: MatrixRow["category"]; label: string; icon: any }[] = [
    { key: "infra", label: "Infrastructure & Organizational", icon: Briefcase },
    { key: "program", label: "Programs & Service Delivery", icon: Heart },
    { key: "research", label: "Research & Methodology", icon: Microscope },
  ];

  return (
    <div className="container max-w-6xl py-8 px-4 space-y-8">
      <div className="space-y-3">
        <Badge variant="outline" className="gap-1.5 border-amber-500 text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Honest by default
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
          Transparency Matrix
        </h1>
        <p className="text-lg text-muted-foreground">
          Every TCAF/ALC capability surfaced in plain English with its honest current status:
          operational, active pilot, in development, or exploratory. We publish this matrix so a
          funder, partner, or community member can verify what is real today versus what is on the
          roadmap.
        </p>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-primary" aria-hidden="true" /> Status Definitions
          </CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
          {(Object.keys(STATUS_META) as MatrixStatus[]).map((s) => {
            const meta = STATUS_META[s];
            const Icon = meta.icon;
            return (
              <div key={s} className={`p-3 rounded-md border ${meta.tone}`} data-testid={`status-def-${s}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <p className="font-semibold">{meta.label}</p>
                </div>
                <p className="text-xs">
                  {s === "operational" && "Live today. Independently verifiable evidence available to reviewers."}
                  {s === "pilot" && "Live and operating in a defined pilot scope; awaiting funded scale-up."}
                  {s === "in-development" && "Application-ready or build-ready. Documentation, partnerships, and protocols exist; no awarded operational scale yet."}
                  {s === "exploratory" && "Active outreach or design exploration. No commitment yet from the named external party."}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {groups.map((group) => {
        const GroupIcon = group.icon;
        const rows = MATRIX_ROWS.filter((r) => r.category === group.key);
        return (
          <Card key={group.key} data-testid={`group-${group.key}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GroupIcon className="h-5 w-5 text-primary" aria-hidden="true" /> {group.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rows.map((row) => {
                const meta = STATUS_META[row.status];
                const StatusIcon = meta.icon;
                const RowIcon = row.icon;
                return (
                  <div key={row.area} className="p-4 rounded-md border bg-background space-y-2" data-testid={`row-${row.area.toLowerCase().replace(/[^a-z0-9]+/g, "-").substring(0, 40)}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-[260px]">
                        <RowIcon className="h-4 w-4 text-primary shrink-0 mt-1" aria-hidden="true" />
                        <p className="font-semibold text-sm">{row.area}</p>
                      </div>
                      <Badge variant="outline" className={`gap-1.5 ${meta.tone}`}>
                        <StatusIcon className="h-3 w-3" aria-hidden="true" /> {meta.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{row.description}</p>
                    <Separator />
                    <p className="text-xs"><span className="font-semibold">Evidence:</span> <span className="text-muted-foreground">{row.evidence}</span></p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      <Card className="bg-muted/30">
        <CardContent className="pt-6 space-y-3 text-sm">
          <p className="font-semibold">Want to verify any line in this matrix?</p>
          <p className="text-muted-foreground">
            Email <a href="mailto:president@thecollaborativeadvocate.org" className="text-primary hover:underline" data-testid="link-verify-email">president@thecollaborativeadvocate.org</a> with the area you want to verify and we will provide supporting documentation (IRS letter, MOU, partnership correspondence, methodology documentation, or platform access) within five business days.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" data-testid="button-stakeholder-map">
              <Link href="/stakeholder-map"><Users className="mr-2 h-4 w-4" /> Stakeholder Engagement Map</Link>
            </Button>
            <Button asChild variant="outline" data-testid="button-about">
              <Link href="/about"><Briefcase className="mr-2 h-4 w-4" /> About / Our Structure</Link>
            </Button>
            <Button asChild variant="outline" data-testid="button-non-discrim-tm">
              <Link href="/non-discrimination"><Shield className="mr-2 h-4 w-4" /> Non-Discrimination</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
