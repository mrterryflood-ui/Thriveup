import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Download, ExternalLink, Calendar, Building2, Users, AlertTriangle, CheckCircle2 } from "lucide-react";
import strategicMd from "../../../docs/grants/sedgwick-rfp-26-0028/strategic-analysis.md?raw";
import proposalMd from "../../../docs/grants/sedgwick-rfp-26-0028/vitality-proposal.md?raw";
import strategicDocxUrl from "@assets/RFP-26-0028-Addendum2-Strategic-Analysis_1779560701300.docx?url";
import proposalDocxUrl from "@assets/RFP-26-0028-Vitality-Proposal_1779560701306.docx?url";

function MarkdownRender({ source }: { source: string }) {
  const blocks = useMemo(() => source.split(/\n{2,}/g).filter((b) => b.trim().length > 0), [source]);
  const inline = (s: string) => {
    const parts: Array<string | JSX.Element> = [];
    const re = /(\*\*[^*]+\*\*|\*[^*]+\*|"[^"]+")/g;
    let last = 0; let m: RegExpExecArray | null; let key = 0;
    while ((m = re.exec(s))) {
      if (m.index > last) parts.push(s.slice(last, m.index));
      const t = m[0];
      if (t.startsWith("**")) parts.push(<strong key={key++}>{t.slice(2, -2)}</strong>);
      else if (t.startsWith("*")) parts.push(<em key={key++}>{t.slice(1, -1)}</em>);
      else parts.push(<span key={key++} className="italic text-foreground">{t}</span>);
      last = m.index + t.length;
    }
    if (last < s.length) parts.push(s.slice(last));
    return parts;
  };
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none space-y-4">
      {blocks.map((b, i) => {
        const line = b.trim();
        if (line.startsWith("# ")) return <h1 key={i} className="text-3xl font-bold mt-6 mb-2 border-b pb-2">{inline(line.slice(2))}</h1>;
        if (line.startsWith("## ")) return <h2 key={i} className="text-2xl font-semibold mt-6 mb-2">{inline(line.slice(3))}</h2>;
        if (line.startsWith("### ")) return <h3 key={i} className="text-xl font-semibold mt-4 mb-2">{inline(line.slice(4))}</h3>;
        if (/^(Section\s+\d+|Appendix\s+[A-Z]|\d+\.\d+\s)/.test(line)) return <h3 key={i} className="text-xl font-semibold mt-6 mb-2 text-primary">{inline(line)}</h3>;
        if (/^\d+\.\s+[A-Z]/.test(line) && line.length < 110 && !line.includes("\n")) return <h3 key={i} className="text-lg font-semibold mt-4 mb-1">{inline(line)}</h3>;
        return <p key={i} className="text-sm leading-relaxed whitespace-pre-wrap">{inline(line)}</p>;
      })}
    </div>
  );
}

export default function SedgwickVitalityProposalPage() {
  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6" data-testid="sedgwick-vitality-page">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" data-testid="badge-rfp-id">RFP #26-0028</Badge>
            <Badge className="bg-amber-100 text-amber-900"><Calendar className="h-3 w-3 mr-1" /> Due June 2, 2026 · 1:45 PM CDT</Badge>
            <Badge className="bg-emerald-100 text-emerald-900">Active Bid</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Vitality Weight Management Program</h1>
          <p className="text-muted-foreground mt-1">Sedgwick County Employee Ancillary Benefits — Weight Loss / Weight Management</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={strategicDocxUrl} download data-testid="link-download-strategic"><Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Strategic Analysis (.docx)</Button></a>
          <a href={proposalDocxUrl} download data-testid="link-download-proposal"><Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Full Proposal (.docx)</Button></a>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Building2 className="h-4 w-4" /> Prime Contractor</CardTitle></CardHeader>
          <CardContent className="text-sm"><div className="font-semibold">Hargrave Innovative Solutions</div><div className="text-muted-foreground">Eric Hargrave, CEO</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Users className="h-4 w-4" /> Team</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <div>HIS · Love Clinic MedSpa</div><div>Vanntastic Solutions · TCAF</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Headline Economic Argument</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <div className="font-bold text-emerald-700 dark:text-emerald-400">~$2.09M / yr</div>
            <div className="text-xs text-muted-foreground">Managed-GLP-1 capture vs. unmanaged status quo (373-member cohort)</div>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Fidelity check — before final submission</AlertTitle>
        <AlertDescription className="text-sm space-y-1">
          <div>This RFP is wired into the <a href="/rfp-fidelity" className="underline text-primary" data-testid="link-fidelity">RFP Fidelity Engine</a>. Once the base RFP + both Addenda are uploaded against this grant, extract the compliance matrix and run the final audit. Section L instructions (acknowledgment of Addendum #2 on response page, mandatory signed cover page, format/page-limit rules) are a pre-flight gate — noncompliance = rejection before Section M is scored.</div>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="strategic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="strategic" data-testid="tab-strategic">Strategic Analysis (Addendum #2)</TabsTrigger>
          <TabsTrigger value="proposal" data-testid="tab-proposal">Full Vitality Proposal</TabsTrigger>
          <TabsTrigger value="critique" data-testid="tab-critique">Honest Critique</TabsTrigger>
        </TabsList>

        <TabsContent value="strategic">
          <Card>
            <CardHeader>
              <CardTitle>Strategic Analysis of RFP #26-0028 Addendum #2</CardTitle>
              <CardDescription>Prepared by Eric Hargrave (HIS, Prime) · Issued May 22, 2026 by Tammy Culley, Purchasing Agent</CardDescription>
            </CardHeader>
            <CardContent><MarkdownRender source={strategicMd} /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proposal">
          <Card>
            <CardHeader>
              <CardTitle>Vitality Weight Management Program — Proposal</CardTitle>
              <CardDescription>Submitted to Tammy Culley, Sedgwick County Purchasing · Date of submission: June 2, 2026</CardDescription>
            </CardHeader>
            <CardContent><MarkdownRender source={proposalMd} /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="critique">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Honest critique — is this well written?</CardTitle>
              <CardDescription>Per Iron Rule #2 (verify, don't conjecture) and Iron Rule #5 (write TO the reviewer). Verified numbers, flagged claims, and concrete tightening notes.</CardDescription>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none text-sm space-y-4">
              <h3>Overall verdict</h3>
              <p><strong>Strong. Well above average for a four-partner public-sector benefits response.</strong> The proposal is rubric-aware (it answers the three KPIs the County named in Addendum #2 — engagement, GLP-1 utilization, cost savings — in that exact order). It anchors price against a number the County itself disclosed ($2.09M GLP-1 capture), which is exactly the posture the RFP Fidelity Doctrine asks for. It coexists with the incumbent stack (UHC + OptumRx + Rally) rather than picking a fight. Cover letter is tight, in-language, and routes communication through Tammy Culley only — correct.</p>

              <h3>Math I verified</h3>
              <ul>
                <li><strong>$5.15M unmanaged spend</strong> = 373 × $13,800/yr (RAND 2023). ✓ Checks.</li>
                <li><strong>$2.09M managed capture</strong> = 373 × $5,600/yr. ✓ Checks.</li>
                <li><strong>~1,525 at-risk adults</strong> = 4,213 × 36.2% (CDC PLACES county prevalence). ✓ Checks.</li>
                <li><strong>$1.71M Year-1 cost</strong> = 534 members × $3,200. ✓ Checks (534 ≈ 35% of 1,525).</li>
                <li><strong>$3.05M total economic opportunity</strong> = $2.09M + $0.675M + $0.282M. ✓ Checks.</li>
              </ul>

              <h3>What's strong</h3>
              <ul>
                <li><strong>The "$2.09M capture" frame is exactly right.</strong> The County did not name a budget; it named "focused on cost savings." Leading with a savings number drawn from <em>their own disclosed cohort</em> is the highest-leverage move available, and the proposal does it correctly.</li>
                <li><strong>Dual clinical pathway is a real differentiator.</strong> Most competitors will pick one (in-house prescribing OR coach-supports-existing-PCP). Vitality offers both; Addendum #2 explicitly accepts either. This is a clean win in the clinical-design section.</li>
                <li><strong>"Coexist with Rally, integrate with UHC/OptumRx" beats "rip and replace."</strong> Removes a procurement-killer objection before it's raised.</li>
                <li><strong>KPI ordering matches Addendum #2 verbatim.</strong> Engagement → proper GLP-1 use → savings. Don't reorder these.</li>
                <li><strong>BMI-data limitation acknowledged honestly.</strong> Turning a weakness (no BMI distribution from carrier) into a methodology credibility point (CDC PLACES as defensible substitute) is good craft.</li>
              </ul>

              <h3>Risks and tightening (fix before submission)</h3>
              <ul>
                <li>
                  <strong>The "47% attrition" claim is the single biggest exposure.</strong> "705 used GLP-1 in past 12 months" minus "373 currently on therapy" does not cleanly equal a 47% discontinuation rate. That delta can include: members who completed a planned course, members whose PA was approved but who never filled, members who switched drugs within the GLP-1 class, and recent starts who are still titrating. A sharp reviewer (or a competing vendor's rebuttal) will challenge this. Recommend softening to: <em>"~47% twelve-month non-continuation rate (705 → 373), consistent with published unmanaged-GLP-1 discontinuation patterns of 30–50% (cite: Prime Therapeutics 2024, Blue Health Intelligence 2023)."</em> Same headline, defensible math.
                </li>
                <li>
                  <strong>"$2.09M capture" should be labeled as modeled opportunity, not savings.</strong> Use "modeled Year-1 capture opportunity" in the ROI section, then commit to specific measurable thresholds (e.g., "≥30% of the current 373-cohort retained in managed protocol at month 12"). At-risk pricing tied to that threshold turns a model into a guarantee, which is what wins value-based procurement.
                </li>
                <li>
                  <strong>"Active Secret-level clearance" for Dr. Flood — verify before submission.</strong> If still active, leave in (it's a credibility asset). If lapsed, change to "former Secret clearance" or remove. Per Iron Rule #2, do not let an unverified credential ride into a public proposal.
                </li>
                <li>
                  <strong>Dr. Flood's title.</strong> Per user preference: <em>President, not CEO</em>, for Dr. Flood on TCAF (501(c)(3)) work. Cover letter and bio block should read "President, TCAF" — not "CEO" anywhere on this proposal.
                </li>
                <li>
                  <strong>Credential string ("DHA, EdD, MSIOP, MSW(c), MSL, MSCJPP, MSHRM, MSIS(c), BHA, CHW-I").</strong> Stacked credential lists weaken, not strengthen, an executive bio. Recommend trimming to two terminal degrees plus one functional credential: <em>"Dr. Terry D. Flood, DHA, EdD — President, TCAF; CHW-I; healthcare data + FHIR/HL7 architecture lead."</em>
                </li>
                <li>
                  <strong>Dr. Vann TEDx claim and Dr. Love DNP/KS licensure.</strong> Both are likely true; both should be on file in Appendix C as primary-source confirmations (TEDx talk URL; KS BON licensure lookup screenshot). Iron Rule #2 — don't ship verifiable claims without the source folder.
                </li>
                <li>
                  <strong>"$5.15M per year in GLP-1 pharmacy spend with zero clinical wraparound"</strong> is a sharp line but slightly overstated — OptumRx prior authorization <em>is</em> a (minimal) wraparound. Soften to "with no clinical or behavioral wraparound beyond prior authorization."
                </li>
                <li>
                  <strong>Section L (instructions) gate.</strong> Confirm: signed Addendum #2 acknowledgment on the RFP response page (not just in Appendix C), page/font/margin rules from base RFP, mandatory forms (W-9, references, insurance certs), and the exact submission method/portal. Run the full <a href="/rfp-fidelity" className="underline text-primary">Fidelity Engine</a> matrix before submission.
                </li>
                <li>
                  <strong>Vanntastic Solutions LLC is for-profit.</strong> Per the standing rule, Vanntastic is named here as a subcontractor (allowed), but never as applicant on nonprofit/government grants. This proposal correctly has HIS (for-profit) as prime, so the structure is fine — flagging only because the doctrine is load-bearing for any future bid.
                </li>
              </ul>

              <h3>What's missing from this excerpt (verify present in full file)</h3>
              <ul>
                <li>Explicit Section L compliance crosswalk table (the County's instructions item-by-item, with "where addressed").</li>
                <li>Section M evaluation-criteria response paragraphs each opening: <em>"In response to [criterion]'s requirement that [verbatim], Vitality…"</em> ending with <em>"[Evidence: Appendix X]"</em>.</li>
                <li>Past performance with at least one comparable public-sector benefits engagement per partner.</li>
                <li>Insurance certificates (general liability, professional liability, cyber) on file at proposal-due time.</li>
                <li>Specific opt-in/at-risk pricing schedule that ties the Year-2 fee to the three County KPIs.</li>
              </ul>

              <h3>One-line summary</h3>
              <p><strong>The thesis is correct, the math is correct, the posture is correct. Soften the "47% attrition" framing, fix Dr. Flood's title, verify clearance + DNP licensure, and run the Fidelity Engine matrix before submission. Then it's a serious bid.</strong></p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
