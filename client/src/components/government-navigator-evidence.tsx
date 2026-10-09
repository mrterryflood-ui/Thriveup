import { useMemo } from "react";
import { Link } from "wouter";
import { ArrowUpRight, Database, ExternalLink, ShieldAlert } from "lucide-react";
import type { GovernmentNavigatorReceipt } from "@shared/government-coordination";
import { canOpenPath } from "@shared/route-access";
import { useAuth } from "@/hooks/use-auth";
import { isStaffUser } from "@/components/require-auth";

const NEED_LABELS: Record<string, string> = {
  health: "Health",
  housing: "Housing",
  food: "Food access",
  "family-workforce": "Family & workforce",
  education: "Education",
  recovery: "Recovery",
};

const GEOGRAPHY_LABELS: Record<string, string> = {
  county: "County",
  tract: "Census tract",
  place: "Place",
  zcta: "ZCTA",
};

// CDC PLACES health-related social-needs measures. Retain and show the source
// code alongside every friendly label so a reader can verify the mapping.
const HRSN_LABELS: Record<string, string> = {
  LONELY: "Feelings of loneliness",
  FOODSTAMP: "Receipt of food stamps (SNAP)",
  FOODINSECU: "Food insecurity",
  HOUSINSECU: "Housing insecurity",
  UTILITY: "Threat of utility service shutoff",
  TRANSPOR: "Lack of reliable transportation",
  SOCIALSUPPORT: "Lack of social and emotional support",
};

const CDC_PLACES_URL = "https://www.cdc.gov/places/";

function readableCode(id: string): string {
  return HRSN_LABELS[id] ?? "Source measure";
}

function displayDate(value: string | null | undefined): string {
  if (!value) return "Not reported";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatEstimate(value: number | null, unit: string): string {
  return value === null ? "No estimate reported (null), not zero" : `${value}${unit ? ` ${unit}` : ""}`;
}

interface GovernmentNavigatorEvidenceProps {
  receipt: GovernmentNavigatorReceipt;
}

export default function GovernmentNavigatorEvidence({ receipt }: GovernmentNavigatorEvidenceProps) {
  const { user, isAuthenticated } = useAuth();
  const evidence = receipt.evidence;
  const tools = useMemo(() => {
    const identity = user as { role?: string; isTcafAdmin?: boolean } | null | undefined;
    const viewer = {
      authenticated: isAuthenticated,
      staff: isStaffUser(user),
      admin: identity?.role === "admin" || identity?.isTcafAdmin === true,
    };
    return receipt.tools
      .filter((tool) => tool.path !== "/ai-navigator" && !tool.path.startsWith("/ai-navigator/"))
      .filter((tool) => canOpenPath(tool.path, viewer));
  }, [isAuthenticated, receipt.tools, user]);

  const sourceUrl = evidence?.sourceUrl ?? CDC_PLACES_URL;
  const availableDefinitions = evidence?.coverage.datasetMeasureCount;
  const returnedRecords = evidence?.coverage.returnedMeasureCount;
  const unavailableById = new Map<string, string>();
  for (const id of evidence?.coverage.unavailableMeasureIds ?? []) unavailableById.set(id, readableCode(id));
  for (const measure of evidence?.measures ?? []) {
    if (measure.value === null) unavailableById.set(measure.id, measure.label || readableCode(measure.id));
  }
  const unavailableMeasures = [...unavailableById.entries()];
  const observationYears = [...new Set((evidence?.measures ?? []).map((measure) => measure.year))].sort((a, b) => a - b);
  const requestGeography = GEOGRAPHY_LABELS[receipt.request.geography] ?? receipt.request.geography;
  const requestNeed = NEED_LABELS[receipt.request.need] ?? receipt.request.need;
  const noConfirmedEvidence = !evidence ||
    evidence.status === "empty" ||
    evidence.measures.length === 0 ||
    !evidence.coverage.geographyVerified;

  return (
    <section
      className="my-3 w-full min-w-0 overflow-hidden rounded-xl border border-[#b9c9c5] bg-[#f2f7f4] text-[#253b38] shadow-sm"
      aria-label="Government evidence receipt"
      data-testid="government-navigator-evidence"
    >
      <header className="border-b border-[#cbd8d2] bg-[#e7efea] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Database className="h-4 w-4 shrink-0 text-[#456b5d]" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#456b5d]">Source record · separate from AI response</p>
        </div>
        <p className="mt-2 break-words text-sm font-semibold" data-testid="government-receipt-request">
          {requestGeography} {receipt.request.id} · {requestNeed}
        </p>
        <p className="mt-1 text-xs leading-5 text-[#5c706a]">
          Requested perspective: {receipt.request.role === "chw" ? "Community health worker" : receipt.request.role === "planner" ? "Planner" : "Resident"}
          <span className="mx-1.5" aria-hidden="true">·</span>
          Source label: {evidence?.label ?? "CDC PLACES"}
        </p>
      </header>

      <div className="space-y-4 p-4">
        <p className="rounded-lg border border-[#cbd8d2] bg-[#fcfdf9] px-3 py-2 text-xs leading-5 text-[#526760]" data-testid="government-receipt-scope">
          This receipt verifies source coverage only. It does not verify or endorse the surrounding assistant narrative.
        </p>

        {receipt.error && (
          <div className="flex items-start gap-2 rounded-lg border border-[#d9a99c] bg-[#fff4ef] p-3 text-sm text-[#71382b]" role="status" data-testid="government-receipt-error">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="min-w-0 break-words"><strong>Evidence retrieval notice:</strong> {receipt.error}</p>
          </div>
        )}

        {noConfirmedEvidence && (
          <div className="rounded-lg border border-dashed border-[#aebfba] bg-[#fcfdf9] p-3" data-testid="government-receipt-no-evidence">
            <h3 className="text-sm font-semibold text-[#253b38]">
              {!evidence ? "No evidence was retrieved for this request." : !evidence.coverage.geographyVerified ? "The source did not confirm this geography." : "No source measure records were returned."}
            </h3>
            <p className="mt-1 text-xs leading-5 text-[#5c706a]">
              No missing value is treated as zero. Source suggestions and tool links below are not retrieved evidence.
            </p>
          </div>
        )}

        {evidence && (
          <div className="min-w-0 rounded-lg border border-[#cbd8d2] bg-[#fcfdf9] p-3" data-testid="government-receipt-source-data">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#637872]">CDC PLACES source coverage</p>
                <h3 className="mt-1 break-words text-sm font-semibold text-[#253b38]">
                  {evidence.label}{evidence.state ? `, ${evidence.state}` : ""}
                </h3>
                <p className="mt-1 break-all font-mono text-[11px] leading-5 text-[#657873]">Dataset {evidence.datasetId}</p>
              </div>
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-md border border-[#b9c9c5] px-3 text-xs font-semibold text-[#31554d] hover:bg-[#edf3ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bd6f3b]"
                data-testid="government-receipt-cdc-link"
              >
                CDC source <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </a>
            </div>

            <dl className="mt-3 grid min-w-0 gap-x-4 gap-y-2 border-y border-[#e0e8e2] py-3 text-xs sm:grid-cols-2">
              <div className="min-w-0"><dt className="font-semibold text-[#536962]">Source release</dt><dd className="mt-0.5 break-words text-[#536962]" data-testid="government-receipt-release">{evidence.release}</dd></div>
              <div className="min-w-0"><dt className="font-semibold text-[#536962]">Observation years in returned records</dt><dd className="mt-0.5 break-words text-[#536962]" data-testid="government-receipt-observation-years">{observationYears.length ? observationYears.join(", ") : "No measure years returned"}</dd></div>
              <div className="min-w-0"><dt className="font-semibold text-[#536962]">Records retrieved at</dt><dd className="mt-0.5 break-words text-[#536962]" data-testid="government-receipt-retrieved-at">{displayDate(evidence.fetchedAt)}</dd></div>
              <div className="min-w-0"><dt className="font-semibold text-[#536962]">Receipt checked at</dt><dd className="mt-0.5 break-words text-[#536962]" data-testid="government-receipt-checked-at">{displayDate(receipt.checkedAt)}</dd></div>
            </dl>

            {typeof returnedRecords === "number" && typeof availableDefinitions === "number" ? (
              <p className="mt-3 break-words text-xs leading-5 text-[#536962]" data-testid="government-receipt-coverage">
                Exact source measure-record coverage: <strong>{returnedRecords} of {availableDefinitions}</strong> measure definitions returned for this lookup.
                {evidence.coverage.geographyVerified
                  ? " The source confirmed the requested geography."
                  : " The source has not confirmed the requested geography; returned records are not confirmed for it."}
              </p>
            ) : (
              <p className="mt-3 text-xs leading-5 text-[#536962]" data-testid="government-receipt-coverage-unavailable">
                Source coverage counts are unavailable; no coverage total is inferred.
              </p>
            )}

            {unavailableMeasures.length > 0 && (
              <div className="mt-3 rounded-lg border border-[#e4d5b7] bg-[#faf5e9] p-3" data-testid="government-receipt-unavailable">
                <h4 className="text-xs font-semibold text-[#69583d]">Unavailable or null-value measures</h4>
                <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#69583d]">
                  {unavailableMeasures.map(([id, label]) => (
                    <li key={id} className="min-w-0 break-words">
                      <span className="font-mono font-semibold">{id}</span>
                      <span> — {label}; estimate unavailable, not zero.</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {evidence.measures.length > 0 && (
              <details className="mt-3 min-w-0 rounded-lg border border-[#d9e3dc] bg-white" data-testid="government-receipt-measures">
                <summary className="flex min-h-11 cursor-pointer items-center px-3 py-2 text-sm font-semibold text-[#31554d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#bd6f3b]">
                  Open exact source measures ({evidence.measures.length})
                </summary>
                <div className="space-y-2 border-t border-[#e0e8e2] p-3">
                  {evidence.measures.map((measure) => (
                    <article key={measure.id} className="min-w-0 rounded-md bg-[#f7faf7] p-3" data-testid={`government-receipt-measure-${measure.id}`}>
                      <h4 className="break-words text-sm font-semibold text-[#253b38]">{measure.label}</h4>
                      <p className="mt-1 break-all font-mono text-xs text-[#657873]">{measure.id}</p>
                      <p className="mt-2 break-words text-sm text-[#31554d]">{formatEstimate(measure.value, measure.unit)}</p>
                      <p className="mt-1 text-xs leading-5 text-[#657873]">{measure.year} observation · {measure.method} · {measure.valueType}</p>
                      <p className="mt-1 break-words text-xs leading-5 text-[#657873]">
                        95% confidence interval: {measure.lower95 === null || measure.upper95 === null ? "Unavailable" : `${measure.lower95} to ${measure.upper95}${measure.unit ? ` ${measure.unit}` : ""}`}
                      </p>
                      {measure.footnote && <p className="mt-2 break-words text-xs leading-5 text-[#657873]"><strong>Source footnote:</strong> {measure.footnote}</p>}
                    </article>
                  ))}
                </div>
              </details>
            )}

            {evidence.limitations.length > 0 && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5 text-[#657873]" data-testid="government-receipt-limitations">
                {evidence.limitations.map((limitation, index) => <li key={`${index}-${limitation}`} className="break-words">{limitation}</li>)}
              </ul>
            )}
          </div>
        )}

        <p className="text-xs leading-5 text-[#657873]" data-testid="government-receipt-method-limits">
          PLACES estimates are modeled crude prevalence for populations. They are not individual facts, diagnoses, eligibility findings, or service-capacity reports, and do not establish that an intervention caused an outcome.
        </p>

        {receipt.nextQuestion && (
          <div className="rounded-lg border-l-4 border-[#bd6f3b] bg-[#f8efe5] px-3 py-2.5" data-testid="government-receipt-next-question">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#825535]">A question to consider</p>
            <p className="mt-1 break-words text-sm leading-5 text-[#4d4237]">{receipt.nextQuestion}</p>
          </div>
        )}

        <section className="border-t border-[#cbd8d2] pt-3" aria-labelledby="government-receipt-tools-title" data-testid="government-receipt-tools">
          <h3 id="government-receipt-tools-title" className="text-sm font-semibold text-[#253b38]">Available next tools</h3>
          <p className="mt-1 text-xs leading-5 text-[#657873]">
            These open a separate workspace; the geography may need confirmation there. Links do not imply an action, eligibility, or capacity finding.
          </p>
          {tools.length > 0 ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {tools.map((tool) => (
                <Link
                  key={`${tool.path}-${tool.title}`}
                  href={tool.path}
                  className="flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-lg border border-[#cbd8d2] bg-[#fcfdf9] px-3 py-2 text-sm text-[#31554d] hover:border-[#91aaa0] hover:bg-[#eef4ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bd6f3b]"
                  data-testid={`government-receipt-tool-${tool.path.replace(/[^a-z0-9]/gi, "-")}`}
                >
                  <span className="min-w-0">
                    <span className="block break-words font-semibold">{tool.title}</span>
                    <span className="block break-words text-xs leading-5 text-[#657873]">{tool.reason}{tool.access ? ` · ${tool.access}` : ""}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-2 rounded-lg bg-[#fcfdf9] p-3 text-xs leading-5 text-[#657873]" data-testid="government-receipt-no-tools">
              No additional existing tool is available for this signed-in access level. This does not change the evidence receipt above.
            </p>
          )}
        </section>
      </div>
    </section>
  );
}
