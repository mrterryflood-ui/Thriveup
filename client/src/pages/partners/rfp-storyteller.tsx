import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, FileText, ShieldCheck, Sparkles, Quote, Building2 } from "lucide-react";
import type { CommunityPartnerOrg } from "@shared/schema";

type OrgStats = {
  orgId: string; households: number; members: number; activePrograms: number;
  totalAttendanceEvents: number; presentEvents: number; attendanceRate: number | null;
  servicesRecorded: number; mealsServed: number; transportProvided: number;
  programs: Array<{ programId: string; programName: string; category: string; enrolled: number; present: number }>;
};

type RfpRequirement = {
  id: string;
  verbatim: string;
  source: string;
  satisfiedBy: (s: OrgStats | undefined) => { text: string; ok: boolean; kind: "live" | "capability" };
};

const SAMHSA_REQS: RfpRequirement[] = [
  {
    id: "samhsa-r1",
    verbatim: "Demonstrate the applicant's organizational experience serving the targeted racial/ethnic minority population, with documented reach, retention, and engagement data.",
    source: "SAMHSA Minority Behavioral Health pattern (FY26)",
    satisfiedBy: (s) => ({
      ok: !!s && s.households > 0,
      text: `${s?.households ?? 0} households · ${s?.members ?? 0} individuals tracked at the family-unit level; ${s?.attendanceRate ?? 0}% recurring attendance across active programs.`,
      kind: "live" as const,
    }),
  },
  {
    id: "samhsa-r2",
    verbatim: "Describe how the applicant will measure attendance, dosage, and engagement with culturally responsive services on an ongoing basis.",
    source: "SAMHSA Minority BH pattern",
    satisfiedBy: (s) => ({
      ok: !!s && s.totalAttendanceEvents > 0,
      text: `${s?.totalAttendanceEvents ?? 0} attendance events captured · ${s?.mealsServed ?? 0} meals served · ${s?.transportProvided ?? 0} transport rides logged. Weekly Wednesday cohort cadence documented per family.`,
      kind: "live" as const,
    }),
  },
  {
    id: "samhsa-r3",
    verbatim: "Address access barriers including transportation, food insecurity, and language access for the target population.",
    source: "SAMHSA Minority BH pattern",
    satisfiedBy: (s) => ({
      ok: !!s && s.mealsServed > 0,
      text: `Meals + transportation provided at every Wednesday youth session (${s?.mealsServed ?? 0} meals, ${s?.transportProvided ?? 0} rides). Multilingual roster includes Spanish and Vietnamese households via Talk Your Talk (89 spoken + 18 sign).`,
      kind: "live" as const,
    }),
  },
  {
    id: "samhsa-r4",
    verbatim: "Document a clear evidence base and behavioral-health screening protocol (e.g., PHQ-9, GAD-7) embedded in service delivery.",
    source: "SAMHSA Minority BH pattern",
    satisfiedBy: (s) => ({
      ok: !!s && s.servicesRecorded > 0,
      text: `${s?.servicesRecorded ?? 0} discrete service events recorded — including PHQ-9 / GAD-7 screenings, counseling, cancer-screening, food assistance, and resource referrals. Whole-Person Health platform (mentalwellnesssupport.net) supplies the screening surface.`,
      kind: "live" as const,
    }),
  },
  {
    id: "samhsa-r5",
    verbatim: "Demonstrate ability to track outcomes longitudinally and report to the federal awarding agency.",
    source: "SAMHSA Minority BH pattern",
    satisfiedBy: (_s) => ({
      ok: true,
      text: `Tamper-evident donor/outcome receipts with provenance hashing; CSV export of full roster + attendance + services; outcome-reporting endpoint already in production for Texas pilot.`,
      kind: "capability" as const,
    }),
  },
];

const CDBG_REQS: RfpRequirement[] = [
  {
    id: "cdbg-r1",
    verbatim: "Public service activity must benefit low- and moderate-income persons, with documented intake data and service delivery records.",
    source: "City of Wichita CDBG Public Services 2026 GRC",
    satisfiedBy: (s) => ({
      ok: !!s && s.households > 0,
      text: `${s?.households ?? 0} households served in Wichita ZIPs 67213/67214/67217/67219/67220 — including 29th & Grove neighborhood (80% POC, 68% low-income). Intake demographics captured per household; service records timestamped.`,
      kind: "live" as const,
    }),
  },
  {
    id: "cdbg-r2",
    verbatim: "Evidence-based program model with measurable outputs (number of unduplicated persons served, units of service delivered).",
    source: "Wichita CDBG GRC",
    satisfiedBy: (s) => ({
      ok: !!s && s.members > 0,
      text: `${s?.members ?? 0} unduplicated individuals · ${s?.activePrograms ?? 0} active program tracks · ${s?.totalAttendanceEvents ?? 0} service units (program sessions) delivered.`,
      kind: "live" as const,
    }),
  },
  {
    id: "cdbg-r3",
    verbatim: "Quarterly performance reporting through ZoomGrants with output and outcome metrics.",
    source: "Wichita CDBG GRC",
    satisfiedBy: (_s) => ({
      ok: true,
      text: `CSV export endpoint produces ZoomGrants-ready rosters and attendance counts in one click. Output metrics auto-aggregated; outcome metrics tied to service-event records.`,
      kind: "capability" as const,
    }),
  },
  {
    id: "cdbg-r4",
    verbatim: "Coordination with other public service providers and demonstrated community partnerships.",
    source: "Wichita CDBG GRC",
    satisfiedBy: (_s) => ({
      ok: true,
      text: `Active partnerships: Health & Wellness Coalition of Wichita, Sedgwick County Health Department, Kansas Department of Health and Environment, Greater Wichita Ministerial League, Sedgwick County Mental Health Advisory Board. Anthropocene Alliance member.`,
      kind: "capability" as const,
    }),
  },
  {
    id: "cdbg-r5",
    verbatim: "Applicant must be a 501(c)(3) in good standing with the Kansas Secretary of State and meet financial-management standards.",
    source: "Wichita CDBG GRC",
    satisfiedBy: (_s) => ({
      ok: true,
      text: `Sistahs Can We Talk Inc. is a Kansas 501(c)(3) (founded 2015) with active community-partnership documentation. Technology + evaluation partner TCAF: IRS Letter 947 (eff. 01/14/2026), SAM.gov Active, CAGE 209N1.`,
      kind: "capability" as const,
    }),
  },
];

export default function RfpStorytellerPage() {
  const [orgId, setOrgId] = useState<string>("sistahs-cwt");
  const orgsQ = useQuery<{ orgs: CommunityPartnerOrg[] }>({ queryKey: ["/api/community/orgs"] });
  const statsQ = useQuery<OrgStats>({ queryKey: ["/api/community/orgs", orgId, "stats"], enabled: !!orgId });
  const orgs = orgsQ.data?.orgs || [];
  const currentOrg = orgs.find(o => o.id === orgId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" data-testid="page-rfp-storyteller">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">RFP-Match Storyteller</h1>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          Every requirement in a funder's RFP, side-by-side with the live data point from your tracker that satisfies it.
          Two anchor RFPs shown: one federal (scaling-up), one local (scaling-out). Switch organizations to see how
          the same infrastructure tells different stories for different funders.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Telling the story for:</CardTitle>
              <CardDescription>The data on the right is computed live from the tracker.</CardDescription>
            </div>
            <Select value={orgId} onValueChange={setOrgId}>
              <SelectTrigger className="w-[280px]" data-testid="select-org">
                <SelectValue placeholder="Choose organization" />
              </SelectTrigger>
              <SelectContent>
                {orgs.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {currentOrg?.coiDisclosure && (
            <Alert className="border-amber-500/40 bg-amber-500/5" data-testid="alert-coi-rfp">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              <AlertTitle>COI disclosure required</AlertTitle>
              <AlertDescription className="text-xs">{currentOrg.coiDisclosure}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="samhsa">
        <TabsList>
          <TabsTrigger value="samhsa" data-testid="tab-samhsa">SAMHSA Minority Behavioral Health (federal)</TabsTrigger>
          <TabsTrigger value="cdbg" data-testid="tab-cdbg">Wichita CDBG Public Services (local)</TabsTrigger>
        </TabsList>

        <TabsContent value="samhsa" className="space-y-4">
          <RfpPanel
            title="SAMHSA Minority Behavioral Health"
            badge="FEDERAL · TCAF-LED · Sistahs CWT subrecipient"
            description="Federal block-grant pattern for projects addressing behavioral-health disparities in racial/ethnic minority populations. Scaling-up case: national platform applied at the Wichita site."
            reqs={SAMHSA_REQS}
            stats={statsQ.data}
            sampleNarrative={`Our community partner Sistahs Can We Talk Inc. has been serving BIPOC women and youth in Wichita's 29th & Grove neighborhood since 2015, an area carrying 2.5× the state liver-cancer rate from historical industrial contamination. Across an active cohort of ${statsQ.data?.households ?? 0} households (${statsQ.data?.members ?? 0} individuals), the family-unit tracker captures ${statsQ.data?.totalAttendanceEvents ?? 0} program-engagement events with an ${statsQ.data?.attendanceRate ?? 0}% recurring attendance rate, ${statsQ.data?.mealsServed ?? 0} meals served, and ${statsQ.data?.transportProvided ?? 0} transport rides — directly addressing the access barriers SAMHSA identifies. PHQ-9 and GAD-7 screenings are embedded in the Healthy Me Initiative; outputs roll up to a tamper-evident outcome ledger.`}
          />
        </TabsContent>

        <TabsContent value="cdbg" className="space-y-4">
          <RfpPanel
            title="City of Wichita CDBG Public Services 2026"
            badge="LOCAL · Sistahs CWT–LED · TCAF tech & evaluation partner"
            description="Wichita CDBG Public Services pool ($475K total, $50K floor). Scaling-out case: the same national infrastructure deployed locally with the partner as prime."
            reqs={CDBG_REQS}
            stats={statsQ.data}
            sampleNarrative={`Sistahs Can We Talk Inc. (Kansas 501(c)(3), founded 2015) requests CDBG support to expand the Healthy Me Initiative + youth mentoring serving ${statsQ.data?.members ?? 0} low- and moderate-income individuals across ${statsQ.data?.households ?? 0} households in Wichita ZIPs 67213/67214/67217. With evaluation and technology infrastructure provided by The Collaborative Advocate Foundation (IRS-determined 501(c)(3); SAM.gov Active; CAGE 209N1), the project will deliver ${statsQ.data?.activePrograms ?? 0} active program tracks with ${statsQ.data?.totalAttendanceEvents ?? 0} documented service-unit events per cycle and ZoomGrants-ready quarterly reporting on output and outcome metrics.`}
          />
        </TabsContent>
      </Tabs>

      <Alert>
        <FileText className="h-4 w-4" />
        <AlertTitle>How this works</AlertTitle>
        <AlertDescription className="text-sm">
          Each panel reads the live tracker for the selected organization and substitutes the numbers directly into the
          narrative paragraph. When you upload your real roster, every figure here updates automatically — which is what
          made the original tracker resonate. Add a household, the next federal app pulls in the new count without a code change.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function RfpPanel({ title, badge, description, reqs, stats, sampleNarrative }: {
  title: string; badge: string; description: string; reqs: RfpRequirement[]; stats?: OrgStats; sampleNarrative: string;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> {title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px]">{badge}</Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-3">
        {reqs.map((r) => {
          const result = r.satisfiedBy(stats);
          return (
            <Card key={r.id} className={result.ok ? "border-green-500/30" : "border-amber-500/30"} data-testid={`card-req-${r.id}`}>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                      <Quote className="h-3 w-3" /> RFP requirement (verbatim)
                    </div>
                    <p className="text-sm italic">"{r.verbatim}"</p>
                    <div className="text-[10px] text-muted-foreground">{r.source}</div>
                  </div>
                  <div className="space-y-2 md:border-l md:pl-4">
                    <div className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                      <CheckCircle2 className={`h-3 w-3 ${result.ok ? "text-green-600" : "text-amber-600"}`} />
                      {result.kind === "capability"
                        ? "Operational capability (not a live metric)"
                        : result.ok
                          ? "Satisfied by live tracker data"
                          : "Will be satisfied once data is loaded"}
                    </div>
                    <p className="text-sm" data-testid={`text-satisfied-${r.id}`}>{result.text}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sample narrative paragraph for the application</CardTitle>
          <CardDescription>Drop-in language with live numbers from the tracker.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed bg-muted/50 p-3 rounded" data-testid="text-sample-narrative">{sampleNarrative}</p>
        </CardContent>
      </Card>
    </div>
  );
}
