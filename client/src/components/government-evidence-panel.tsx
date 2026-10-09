import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowUpRight, BookOpen, ChevronRight, CircleAlert, Database, LoaderCircle, MapPinned, RefreshCw } from "lucide-react";
import { canOpenPath } from "@shared/route-access";
import { GOVERNMENT_GEOGRAPHIES, GOVERNMENT_NEEDS, GOVERNMENT_ROLES } from "@shared/government-coordination";
import type { GovernmentCoordination, GovernmentNeed, GovernmentRequest } from "@shared/government-coordination";
import { useAuth } from "@/hooks/use-auth";
import { isStaffUser } from "@/components/require-auth";

type GovernmentGeography = GovernmentRequest["geography"];
type GovernmentRole = GovernmentRequest["role"];
const GEO_LENGTHS: Record<GovernmentGeography, number> = { county: 5, tract: 11, place: 7, zcta: 5 };
const GEO_LABELS: Record<GovernmentGeography, string> = { county: "County", tract: "Census tract", place: "Place", zcta: "ZCTA" };
const NEED_LABELS: Record<GovernmentNeed, string> = {
  health: "Health",
  housing: "Housing",
  food: "Food access",
  "family-workforce": "Family & workforce",
  education: "Education",
  recovery: "Recovery",
};
const ROLE_LABELS: Record<GovernmentRole, string> = { resident: "Resident", chw: "Community health worker", planner: "Planner" };
const CONNECTION_LABELS: Record<string, string> = {
  "cdc-reader": "CDC reader",
  "existing-tool": "Existing tool connection",
  discovery: "Source discovery",
};
const ACCESS_LABELS: Record<string, string> = {
  "public-download": "Public download",
  "catalog-key": "Catalog key may be required",
  "account-or-license": "Account or license may be required",
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not reported";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function makeNavigatorHref(request: GovernmentRequest): string {
  const params = new URLSearchParams({
    governmentGeography: request.geography,
    governmentId: request.id,
    governmentNeed: request.need,
    governmentRole: request.role,
  });
  return `/ai-navigator?${params.toString()}`;
}

export default function GovernmentEvidencePanel() {
  const { user, isAuthenticated } = useAuth();
  const [geography, setGeography] = useState<GovernmentGeography>("county");
  const [id, setId] = useState("");
  const [need, setNeed] = useState<GovernmentNeed>("health");
  const [role, setRole] = useState<GovernmentRole>("resident");
  const [submitted, setSubmitted] = useState<GovernmentRequest | null>(null);
  const [formError, setFormError] = useState("");
  const [selectedMeasureIds, setSelectedMeasureIds] = useState<string[]>([]);

  const query = useQuery<GovernmentCoordination, Error>({
    queryKey: ["/api/data-sources/coordination", submitted],
    enabled: !!submitted,
    retry: false,
    queryFn: async ({ signal }) => {
      if (!submitted) throw new Error("Submit a geography to request evidence.");
      const params = new URLSearchParams({
        geography: submitted.geography,
        id: submitted.id,
        need: submitted.need,
        role: submitted.role,
      });
      const response = await fetch(`/api/data-sources/coordination?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        signal,
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        let detail = `${response.status} ${response.statusText}`.trim();
        try {
          const body = await response.json() as { error?: unknown };
          if (typeof body.error === "string" && body.error.trim()) detail = body.error;
        } catch {
          // HTTP status is still surfaced if the server did not return JSON.
        }
        throw new Error(`Evidence request failed: ${detail}`);
      }
      return await response.json() as GovernmentCoordination;
    },
  });

  const coordination = query.data;
  const evidence = coordination?.evidence;
  const visibleTools = useMemo(() => {
    const roleValue = (user as { role?: string; isTcafAdmin?: boolean } | null | undefined)?.role;
    const admin = roleValue === "admin" || (user as { isTcafAdmin?: boolean } | null | undefined)?.isTcafAdmin === true;
    const viewer = { authenticated: isAuthenticated, staff: isStaffUser(user), admin };
    return (coordination?.tools ?? []).filter((tool) => canOpenPath(tool.path, viewer));
  }, [coordination?.tools, isAuthenticated, user]);

  useEffect(() => {
    if (coordination) setSelectedMeasureIds(coordination.relevantMeasureIds ?? []);
  }, [coordination]);

  const displayedMeasures = useMemo(
    () => evidence?.measures.filter((measure) => selectedMeasureIds.includes(measure.id)) ?? [],
    [evidence?.measures, selectedMeasureIds],
  );

  function clearResultForEdit() {
    setSubmitted(null);
    setFormError("");
    setSelectedMeasureIds([]);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSubmitted(null);
    setSelectedMeasureIds([]);
    const requiredLength = GEO_LENGTHS[geography];
    if (!new RegExp(`^\\d{${requiredLength}}$`).test(id)) {
      setFormError(`${GEO_LABELS[geography]} IDs must contain exactly ${requiredLength} digits.`);
      return;
    }
    setSubmitted({ geography, id, need, role });
  }

  function toggleMeasure(idToToggle: string) {
    setSelectedMeasureIds((current) =>
      current.includes(idToToggle) ? current.filter((measureId) => measureId !== idToToggle) : [...current, idToToggle],
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#b9c9c5] bg-[#f2f7f4] shadow-sm" data-testid="government-evidence-panel" aria-labelledby="government-evidence-title">
      <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
        <div className="relative overflow-hidden bg-[#173c3b] px-5 py-7 text-[#f6f3e9] sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-12 -top-10 h-56 w-56 rounded-full border border-[#a6c2a9]/20" />
          <div className="pointer-events-none absolute -right-1 top-7 h-40 w-40 rounded-full border border-[#a6c2a9]/25" />
          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#a6c2a9]/40 bg-[#f6f3e9]/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#d4e2d0]">
              <MapPinned className="h-4 w-4" aria-hidden="true" /> GOVERNMENT DATA COORDINATION
            </div>
            <h2 id="government-evidence-title" className="max-w-md text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-[2.15rem]">
              Start with a place. See what the evidence can say.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#d0ded7]">
              Request available public evidence for one geography and need. Results are descriptive context—not individual eligibility, service capacity, or a recommendation to act.
            </p>
            <div className="mt-8 border-t border-[#f6f3e9]/20 pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c2d9c5]">Evidence boundaries</p>
              <ul className="mt-3 space-y-2.5 text-sm leading-5 text-[#e0e9e2]">
                <li className="flex gap-2"><span className="text-[#e7b86c]">01</span><span>Source discovery is not retrieved evidence.</span></li>
                <li className="flex gap-2"><span className="text-[#e7b86c]">02</span><span>Modeled estimates describe populations, not people.</span></li>
                <li className="flex gap-2"><span className="text-[#e7b86c]">03</span><span>Availability here does not establish openings or eligibility.</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <form onSubmit={submit} className="space-y-4" data-testid="form-government-evidence">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-[#253b38]" htmlFor="government-geography">
                Geography
                <select id="government-geography" className="mt-1.5 h-12 w-full rounded-lg border border-[#b9c9c5] bg-[#fcfdf9] px-3 text-sm font-normal text-[#203330] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bb713e]" value={geography} onChange={(event) => { setGeography(event.target.value as GovernmentGeography); clearResultForEdit(); }} data-testid="select-government-geography">
                  {GOVERNMENT_GEOGRAPHIES.map((item) => <option key={item} value={item}>{GEO_LABELS[item]}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-[#253b38]" htmlFor="government-id">
                Exact geography ID
                <input id="government-id" inputMode="numeric" autoComplete="off" pattern="[0-9]*" maxLength={GEO_LENGTHS[geography]} value={id} onChange={(event) => { setId(event.target.value.replace(/\D/g, "").slice(0, GEO_LENGTHS[geography])); clearResultForEdit(); }} placeholder={`${GEO_LENGTHS[geography]} digits`} className="mt-1.5 h-12 w-full rounded-lg border border-[#b9c9c5] bg-[#fcfdf9] px-3 font-mono text-sm font-normal tracking-wider text-[#203330] placeholder:font-sans placeholder:tracking-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bb713e]" aria-describedby="government-id-hint" data-testid="input-government-id" />
              </label>
              <p id="government-id-hint" className="-mt-2 text-xs text-[#5c706a] sm:col-span-2">Enter the full Census county, tract, place, or ZCTA identifier. No location is preselected.</p>
              <label className="block text-sm font-semibold text-[#253b38]" htmlFor="government-need">
                Topic
                <select id="government-need" className="mt-1.5 h-12 w-full rounded-lg border border-[#b9c9c5] bg-[#fcfdf9] px-3 text-sm font-normal text-[#203330] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bb713e]" value={need} onChange={(event) => { setNeed(event.target.value as GovernmentNeed); clearResultForEdit(); }} data-testid="select-government-need">
                  {GOVERNMENT_NEEDS.map((item) => <option key={item} value={item}>{NEED_LABELS[item]}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-[#253b38]" htmlFor="government-role">
                Perspective
                <select id="government-role" className="mt-1.5 h-12 w-full rounded-lg border border-[#b9c9c5] bg-[#fcfdf9] px-3 text-sm font-normal text-[#203330] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bb713e]" value={role} onChange={(event) => { setRole(event.target.value as GovernmentRole); clearResultForEdit(); }} data-testid="select-government-role">
                  {GOVERNMENT_ROLES.map((item) => <option key={item} value={item}>{ROLE_LABELS[item]}</option>)}
                </select>
              </label>
            </div>
            {formError && <p role="alert" className="rounded-lg border border-[#bc6248]/30 bg-[#fff2ec] px-3 py-2 text-sm text-[#873f31]" data-testid="government-form-error">{formError}</p>}
            <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#bd6f3b] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#a65c31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173c3b] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 sm:w-auto" disabled={query.isFetching} data-testid="button-request-government-evidence">
              {query.isFetching ? <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Checking sources…</> : <>Check available evidence <ChevronRight className="h-4 w-4" aria-hidden="true" /></>}
            </button>
          </form>

          {query.isFetching && (
            <div className="mt-6 rounded-xl border border-[#c8d8d1] bg-[#e8f0eb] p-4" role="status" data-testid="government-loading">
              <div className="h-4 w-44 animate-pulse rounded bg-[#b7cbc0]" />
              <div className="mt-3 h-3 w-full animate-pulse rounded bg-[#c8d8d1]" />
              <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-[#c8d8d1]" />
              <span className="sr-only">Checking the requested geography against available sources.</span>
            </div>
          )}

          {query.isError && (
            <div className="mt-6 rounded-xl border border-[#d9a99c] bg-[#fff4ef] p-4" role="alert" data-testid="government-request-error">
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#a64d38]" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[#71382b]">The evidence request could not be completed</h3>
                  <p className="mt-1 break-words text-sm text-[#805347]">{query.error.message}</p>
                  <button type="button" onClick={() => void query.refetch()} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md border border-[#c98977] px-3 text-sm font-semibold text-[#71382b] hover:bg-[#fbe5dd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a64d38]" data-testid="button-retry-government-evidence"><RefreshCw className="h-4 w-4" aria-hidden="true" /> Retry</button>
                </div>
              </div>
            </div>
          )}

          {coordination && (
            <div className="mt-6 space-y-5" data-testid="government-result">
              <div className="flex flex-wrap items-start justify-between gap-3 border-t border-[#cbd8d2] pt-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#657873]">Request checked</p>
                  <p className="mt-1 text-sm font-medium text-[#253b38]">{GEO_LABELS[coordination.request.geography]} {coordination.request.id} · {NEED_LABELS[coordination.request.need]}</p>
                </div>
                <p className="text-xs text-[#657873]" data-testid="government-checked-at">Checked {formatDate(coordination.checkedAt)}</p>
              </div>

              {coordination.error && (
                <div className="rounded-lg border border-[#d9a99c] bg-[#fff4ef] p-3 text-sm text-[#71382b]" role="alert" data-testid="government-partial-error">
                  <strong>Source response:</strong> {coordination.error}
                </div>
              )}

              {!evidence && (
                <div className="rounded-xl border border-dashed border-[#aebfba] bg-[#f8faf7] p-5" data-testid="government-no-evidence">
                  <div className="flex items-start gap-3">
                    <Database className="mt-0.5 h-5 w-5 text-[#668178]" aria-hidden="true" />
                    <div>
                      <h3 className="font-semibold text-[#253b38]">No retrieved evidence for this request</h3>
                      <p className="mt-1 text-sm leading-5 text-[#5c706a]">A source listing or suggested connection below is not evidence retrieved for this geography.</p>
                    </div>
                  </div>
                </div>
              )}

              {evidence && (
                <div className="rounded-xl border border-[#bfd0c7] bg-[#fcfdf9] p-4 sm:p-5" data-testid="government-evidence">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#637872]">Retrieved population evidence</p>
                      <h3 className="mt-1 text-xl font-semibold tracking-tight text-[#203330]">{evidence.label}{evidence.state ? `, ${evidence.state}` : ""}</h3>
                      <p className="mt-1 text-sm text-[#5c706a]">Dataset {evidence.datasetId} · release {evidence.release} · {evidence.status}</p>
                    </div>
                    <a className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-[#b9c9c5] px-3 text-sm font-medium text-[#31554d] hover:bg-[#edf3ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bd6f3b]" href={evidence.sourceUrl} target="_blank" rel="noreferrer" data-testid="link-government-evidence-source">Source record <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></a>
                  </div>
                  <dl className="mt-4 grid gap-x-5 gap-y-2 border-y border-[#e0e8e2] py-3 text-xs sm:grid-cols-2">
                    <div><dt className="inline font-semibold text-[#536962]">Source release: </dt><dd className="inline text-[#536962]">{evidence.release}</dd></div>
                    <div><dt className="inline font-semibold text-[#536962]">Source updated: </dt><dd className="inline text-[#536962]">{formatDate(evidence.sourceUpdatedAt)}</dd></div>
                    <div><dt className="inline font-semibold text-[#536962]">Source fetched: </dt><dd className="inline text-[#536962]" data-testid="government-source-fetched">{formatDate(evidence.fetchedAt)}</dd></div>
                    <div><dt className="inline font-semibold text-[#536962]">Rejected source rows: </dt><dd className="inline text-[#536962]">{evidence.rejectedRows}</dd></div>
                  </dl>
                  <p className="mt-3 text-xs leading-5 text-[#667972]" data-testid="government-source-coverage">
                    Coverage: {evidence.coverage.returnedMeasureCount} returned measure records from {evidence.coverage.datasetMeasureCount} measure definitions in this source release.
                    {evidence.coverage.unavailableMeasureIds.length > 0 && ` Unavailable here: ${evidence.coverage.unavailableMeasureIds.join(", ")}.`}
                    {!evidence.coverage.geographyVerified && " This identifier has not been confirmed by source rows."}
                  </p>
                  {evidence.limitations.length > 0 && <p className="mt-3 text-xs leading-5 text-[#667972]"><strong>Limitations:</strong> {evidence.limitations.join(" ")}</p>}

                  <fieldset className="mt-4">
                    <legend className="text-sm font-semibold text-[#253b38]">Measures in the source inventory</legend>
                    <p className="mt-1 text-xs text-[#647771]">Relevant measures are selected by default. Toggle the inventory to review other reported measures.</p>
                    {evidence.measures.length === 0 ? (
                      <p className="mt-3 rounded-lg bg-[#f1f5f2] p-3 text-sm text-[#5c706a]" data-testid="government-empty-measures">The source returned no measures for this geography.</p>
                    ) : (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2" data-testid="government-measure-inventory">
                        {evidence.measures.map((measure) => (
                          <label key={measure.id} className="flex min-h-11 cursor-pointer items-start gap-2 rounded-lg border border-[#d9e3dc] bg-white px-3 py-2.5 text-sm text-[#314740] hover:border-[#90aaa0]">
                            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#bd6f3b]" checked={selectedMeasureIds.includes(measure.id)} onChange={() => toggleMeasure(measure.id)} data-testid={`toggle-measure-${measure.id}`} />
                            <span><span className="block font-medium">{measure.label}</span><span className="font-mono text-[11px] text-[#74867f]">{measure.id}</span></span>
                          </label>
                        ))}
                      </div>
                    )}
                  </fieldset>

                  {displayedMeasures.length > 0 && (
                    <div className="mt-4 space-y-2" data-testid="government-selected-measures">
                      {displayedMeasures.map((measure) => (
                        <article key={measure.id} className="rounded-lg border border-[#e0e8e2] bg-[#f7faf7] p-3">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                            <h4 className="text-sm font-semibold text-[#253b38]">{measure.label}</h4>
                            <p className="font-mono text-sm text-[#31554d]">{measure.value === null ? "Not reported" : `${measure.value}${measure.unit ? ` ${measure.unit}` : ""}`}</p>
                          </div>
                          <p className="mt-1 text-xs text-[#657873]">{measure.category} · {measure.year} · {measure.method} · {measure.valueType}</p>
                          <p className="mt-1 text-xs text-[#657873]">95% CI: {measure.lower95 === null || measure.upper95 === null ? "Not reported" : `${measure.lower95} to ${measure.upper95}`}{measure.population !== null ? ` · Population ${measure.population}` : ""}</p>
                          {measure.footnote && <p className="mt-2 text-xs leading-5 text-[#657873]"><strong>Footnote:</strong> {measure.footnote}</p>}
                        </article>
                      ))}
                    </div>
                  )}
                  {evidence.measures.length > 0 && displayedMeasures.length === 0 && <p className="mt-3 text-sm text-[#5c706a]" data-testid="government-no-measures-selected">No measures selected. Select any measure above to show its estimate and metadata.</p>}
                </div>
              )}

              {coordination.nextQuestion && (
                <div className="rounded-xl border-l-4 border-[#bd6f3b] bg-[#f8efe5] px-4 py-3" data-testid="government-next-question">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#825535]">A question to consider</p>
                  <p className="mt-1 text-sm leading-5 text-[#4d4237]">{coordination.nextQuestion}</p>
                </div>
              )}

              {coordination.resources.length > 0 && (
                <section aria-labelledby="government-resources-title" className="space-y-2" data-testid="government-resources">
                  <div>
                    <h3 id="government-resources-title" className="text-sm font-semibold text-[#253b38]">Sources and possible connections</h3>
                    <p className="mt-1 text-xs leading-5 text-[#657873]">These entries may be discovery links, downloads, account-gated datasets, or connected tools. Only the evidence block above represents data retrieved for this request.</p>
                  </div>
                  {coordination.resources.map((resource) => (
                    <article key={resource.id} className="rounded-lg border border-[#d9e3dc] bg-[#fcfdf9] p-3" data-testid={`government-resource-${resource.id}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-[#253b38]">{resource.name}</h4>
                        <span className="rounded-full bg-[#e7efea] px-2 py-0.5 text-[11px] font-medium text-[#4d675e]">{CONNECTION_LABELS[resource.connection] ?? resource.connection}</span>
                        <span className="rounded-full bg-[#f2eee4] px-2 py-0.5 text-[11px] text-[#76634a]">{ACCESS_LABELS[resource.access] ?? resource.access}</span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-[#657873]">{resource.limitation}</p>
                      <a href={resource.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-[#31554d] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bd6f3b]" data-testid={`link-resource-${resource.id}`}>Open source details <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></a>
                    </article>
                  ))}
                </section>
              )}

              {visibleTools.length > 0 && (
                <section aria-labelledby="government-tools-title" className="space-y-2" data-testid="government-tools">
                  <div>
                    <h3 id="government-tools-title" className="text-sm font-semibold text-[#253b38]">Continue in another tool</h3>
                    <p className="mt-1 text-xs leading-5 text-[#657873]">Only routes visible to your signed-in account are shown. Opening another tool may require entering the place again; this shared journey remains available here.</p>
                  </div>
                  {visibleTools.map((tool) => (
                    <Link key={`${tool.path}-${tool.title}`} href={tool.path} className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-[#cbd8d2] bg-[#fcfdf9] px-3 py-2 text-sm text-[#31554d] hover:border-[#91aaa0] hover:bg-[#eef4ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bd6f3b]" data-testid={`link-government-tool-${tool.path.replace(/[^a-z0-9]/gi, "-")}`}>
                      <span><span className="block font-semibold">{tool.title}</span><span className="block text-xs text-[#657873]">{tool.reason} {tool.access ? `· ${tool.access}` : ""}</span></span><ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </Link>
                  ))}
                </section>
              )}

              <div className="rounded-xl border border-[#cbd8d2] bg-[#eaf1eb] p-4" data-testid="government-handoff">
                <div className="flex items-start gap-3">
                  <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-[#456b5d]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-[#253b38]">Carry this context to Navigator</h3>
                    <p className="mt-1 text-sm leading-5 text-[#5c706a]">{coordination.handoff.instruction}</p>
                    <p className="mt-1 text-xs text-[#657873]">Context: {coordination.handoff.geography} · {NEED_LABELS[coordination.handoff.need]}</p>
                    <p className="mt-2 text-xs text-[#657873]">This passes a geography and topic as context only. It does not make an eligibility, capacity, or service decision.</p>
                    <Link href={makeNavigatorHref(coordination.request)} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#173c3b] px-4 text-sm font-semibold text-white hover:bg-[#24524b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bd6f3b] focus-visible:ring-offset-2" data-testid="link-government-navigator">Continue with this context <ChevronRight className="h-4 w-4" aria-hidden="true" /></Link>
                    {coordination.handoff.evidenceUrl && <a href={coordination.handoff.evidenceUrl} target="_blank" rel="noreferrer" className="ml-3 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-[#31554d] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bd6f3b]" data-testid="link-government-handoff-evidence">Evidence reference <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></a>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!submitted && !query.isFetching && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-dashed border-[#b9c9c5] bg-[#f8faf7] p-4" data-testid="government-empty-state">
              <Database className="mt-0.5 h-5 w-5 shrink-0 text-[#668178]" aria-hidden="true" />
              <p className="text-sm leading-5 text-[#5c706a]">Choose a geography, enter its exact ID, and submit to check what evidence is available. Nothing is looked up until you submit.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
