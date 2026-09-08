import { useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Baby,
  Building2,
  ExternalLink,
  Info,
  MapPin,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EvidenceSummary } from "@/components/evidence-label";
import { ConsentDisclosure } from "@/components/consent-disclosure";

type StateRow = {
  stateFips: string;
  state: string;
  providerEstablishments: number | null;
  childcareEmployees: number | null;
  estimatedChildren0To12: number | null;
  establishmentsPer1000Children: number | null;
  cbpAvailable: boolean;
  acsAvailable: boolean;
  dataStatus: "complete" | "partial" | "unavailable";
};

type NationalOverview = {
  retrievedAt: string;
  coverage: {
    statesIncluded: number;
    statesWithCompleteData: number;
    providerDataVintage: string;
    childPopulationVintage: string;
  };
  national: {
    providerEstablishments: number | null;
    childcareEmployees: number | null;
    estimatedChildren0To12: number | null;
    establishmentsPer1000Children: number | null;
  };
  states: StateRow[];
  economicContext: {
    sourceName: string;
    sourceUrl: string;
    dataVintage: string;
    reportPublished: string;
    totalHouseholds: number;
    povertyHouseholds: number;
    aliceHouseholds: number;
    belowAliceThresholdHouseholds: number;
    belowAliceThresholdRate: number;
    disclosure: string;
  };
  sources: Array<{ name: string; url: string; role: string; vintage: string }>;
  warnings: string[];
};

type CountyResult = {
  stateFips: string;
  countyFips: string;
  displayName: string;
  county: string;
  summary: {
    totalProviders: number | null;
    totalLicensedCapacity: number | null;
    dataSource: string;
  };
  slotGap: {
    estimatedDemand: number | null;
    slotGap: number | null;
    coverageRate: number | null;
    methodology: string;
    dataSource: string;
  };
  warnings: string[];
};

function formatNumber(value: number | null): string {
  return value === null || !Number.isFinite(value) ? "Not available" : value.toLocaleString();
}

function formatRate(value: number | null): string {
  return value === null || !Number.isFinite(value) ? "Not available" : `${value.toFixed(1)} per 1,000`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`National childcare response has an invalid ${field}.`);
  return value.trim();
}

function nullableNumber(value: unknown, field: string): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || !Number.isSafeInteger(value)) {
    throw new Error(`National childcare response has an invalid ${field}.`);
  }
  return value;
}

function nullableRate(value: unknown, field: string, max: number): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > max) {
    throw new Error(`National childcare response has an invalid ${field}.`);
  }
  return value;
}

function requiredNumber(value: unknown, field: string): number {
  const parsed = nullableNumber(value, field);
  if (parsed === null) throw new Error(`National childcare response is missing ${field}.`);
  return parsed;
}

function requiredHttpUrl(value: unknown, field: string): string {
  const raw = requiredString(value, field);
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:") throw new Error();
    return parsed.toString();
  } catch {
    throw new Error(`National childcare response has an invalid ${field}.`);
  }
}

function normalizeNationalOverview(raw: unknown): NationalOverview {
  if (!isRecord(raw)) throw new Error("National childcare response was not an object.");
  const coverage = raw.coverage;
  const national = raw.national;
  const economicContext = raw.economicContext;
  if (!isRecord(coverage) || !isRecord(national) || !isRecord(economicContext)) {
    throw new Error("National childcare response is missing required sections.");
  }
  if (!Array.isArray(raw.states) || !Array.isArray(raw.sources) || !Array.isArray(raw.warnings)) {
    throw new Error("National childcare response is missing state, source, or warning data.");
  }
  const stateKeys = new Set<string>();
  const states = raw.states.map((value, index): StateRow => {
    if (!isRecord(value)) throw new Error(`National childcare state row ${index + 1} is invalid.`);
    const status = requiredString(value.dataStatus, `state row ${index + 1} status`);
    if (status !== "complete" && status !== "partial" && status !== "unavailable") {
      throw new Error(`National childcare state row ${index + 1} has an invalid status.`);
    }
    const stateFips = requiredString(value.stateFips, `state row ${index + 1} FIPS`);
    if (stateKeys.has(stateFips)) throw new Error(`National childcare state row ${index + 1} is duplicated.`);
    stateKeys.add(stateFips);
    return {
      stateFips,
      state: requiredString(value.state, `state row ${index + 1} name`),
      providerEstablishments: nullableNumber(value.providerEstablishments, `state row ${index + 1} establishments`),
      childcareEmployees: nullableNumber(value.childcareEmployees, `state row ${index + 1} employees`),
      estimatedChildren0To12: nullableNumber(value.estimatedChildren0To12, `state row ${index + 1} children`),
       establishmentsPer1000Children: nullableRate(value.establishmentsPer1000Children, `state row ${index + 1} density`, Number.MAX_SAFE_INTEGER),
       cbpAvailable: value.cbpAvailable === true
         ? true
         : value.cbpAvailable === false
         ? false
         : (() => { throw new Error(`National childcare state row ${index + 1} has an invalid CBP availability flag.`); })(),
       acsAvailable: value.acsAvailable === true
         ? true
         : value.acsAvailable === false
         ? false
         : (() => { throw new Error(`National childcare state row ${index + 1} has an invalid ACS availability flag.`); })(),
      dataStatus: status,
    };
  });
  const sources = raw.sources.map((value, index) => {
    if (!isRecord(value)) throw new Error(`National childcare source ${index + 1} is invalid.`);
    return {
      name: requiredString(value.name, `source ${index + 1} name`),
      url: requiredHttpUrl(value.url, `source ${index + 1} URL`),
      role: requiredString(value.role, `source ${index + 1} role`),
      vintage: requiredString(value.vintage, `source ${index + 1} vintage`),
    };
  });
  const warnings = raw.warnings.map((value, index) => requiredString(value, `warning ${index + 1}`));
  const retrievedAt = requiredString(raw.retrievedAt, "retrieval time");
  if (!Number.isFinite(Date.parse(retrievedAt))) throw new Error("National childcare response has an invalid retrieval time.");
  return {
    retrievedAt,
    coverage: {
      statesIncluded: requiredNumber(coverage.statesIncluded, "coverage state count"),
      statesWithCompleteData: requiredNumber(coverage.statesWithCompleteData, "coverage complete count"),
      providerDataVintage: requiredString(coverage.providerDataVintage, "provider vintage"),
      childPopulationVintage: requiredString(coverage.childPopulationVintage, "child-population vintage"),
    },
    national: {
      providerEstablishments: nullableNumber(national.providerEstablishments, "national establishments"),
      childcareEmployees: nullableNumber(national.childcareEmployees, "national employees"),
      estimatedChildren0To12: nullableNumber(national.estimatedChildren0To12, "national children"),
       establishmentsPer1000Children: nullableRate(national.establishmentsPer1000Children, "national density", Number.MAX_SAFE_INTEGER),
    },
    states,
    economicContext: {
      sourceName: requiredString(economicContext.sourceName, "economic source"),
      sourceUrl: requiredHttpUrl(economicContext.sourceUrl, "economic source URL"),
      dataVintage: requiredString(economicContext.dataVintage, "economic vintage"),
      reportPublished: requiredString(economicContext.reportPublished, "economic report date"),
      totalHouseholds: requiredNumber(economicContext.totalHouseholds, "economic household count"),
      povertyHouseholds: requiredNumber(economicContext.povertyHouseholds, "poverty household count"),
      aliceHouseholds: requiredNumber(economicContext.aliceHouseholds, "ALICE household count"),
      belowAliceThresholdHouseholds: requiredNumber(economicContext.belowAliceThresholdHouseholds, "ALICE threshold count"),
       belowAliceThresholdRate: (() => {
         const rate = nullableRate(economicContext.belowAliceThresholdRate, "ALICE threshold rate", 100);
         if (rate === null) throw new Error("National childcare response is missing ALICE threshold rate.");
         return rate;
       })(),
      disclosure: requiredString(economicContext.disclosure, "economic disclosure"),
    },
    sources,
    warnings,
  };
}

function normalizeCountyResult(raw: unknown): CountyResult {
  if (!isRecord(raw)) throw new Error("County lookup returned an invalid response.");
  if (
    typeof raw.displayName !== "string" ||
    !raw.displayName.trim() ||
    typeof raw.county !== "string" ||
    !raw.county.trim() ||
    typeof raw.stateFips !== "string" ||
    !raw.stateFips.trim() ||
    typeof raw.countyFips !== "string" ||
    !raw.countyFips.trim() ||
    !isRecord(raw.summary) ||
    !isRecord(raw.slotGap) ||
    !Array.isArray(raw.warnings)
  ) {
    throw new Error("County lookup response is missing required fields.");
  }
  const summary = raw.summary;
  const slotGap = raw.slotGap;
  const numericOrNull = (value: unknown, field: string, allowNegative = false, max = Number.MAX_SAFE_INTEGER, integer = true): number | null => {
    if (value === null) return null;
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      (!allowNegative && value < 0) ||
      value > max ||
      (integer && !Number.isSafeInteger(value))
    ) {
      throw new Error(`County lookup response has an invalid ${field}.`);
    }
    return value;
  };
  if (
    typeof summary.dataSource !== "string" ||
    !summary.dataSource.trim() ||
    typeof slotGap.methodology !== "string" ||
    !slotGap.methodology.trim() ||
    typeof slotGap.dataSource !== "string" ||
    !slotGap.dataSource.trim()
  ) {
    throw new Error("County lookup response has invalid source metadata.");
  }
  return {
    stateFips: raw.stateFips.trim(),
    countyFips: raw.countyFips.trim(),
    displayName: raw.displayName,
    county: raw.county,
    summary: {
      totalProviders: numericOrNull(summary.totalProviders, "total providers"),
      totalLicensedCapacity: numericOrNull(summary.totalLicensedCapacity, "licensed capacity"),
      dataSource: summary.dataSource.trim(),
    },
    slotGap: {
      estimatedDemand: numericOrNull(slotGap.estimatedDemand, "estimated demand"),
      slotGap: numericOrNull(slotGap.slotGap, "slot gap", true),
      coverageRate: numericOrNull(slotGap.coverageRate, "coverage rate", false, 1, false),
      methodology: slotGap.methodology.trim(),
      dataSource: slotGap.dataSource.trim(),
    },
    warnings: raw.warnings.map((warning, index) => {
      if (typeof warning !== "string") throw new Error(`County lookup warning ${index + 1} is invalid.`);
      return warning;
    }),
  };
}

function statusLabel(status: StateRow["dataStatus"]): string {
  if (status === "complete") return "Both sources";
  if (status === "partial") return "Partial";
  return "Unavailable";
}

function statusClass(status: StateRow["dataStatus"]): string {
  if (status === "complete") return "text-emerald-700 border-emerald-200 bg-emerald-50";
  if (status === "partial") return "text-amber-700 border-amber-200 bg-amber-50";
  return "text-slate-600 border-slate-200 bg-slate-50";
}

function StateTable({ states, onStateSelect }: { states: StateRow[]; onStateSelect: (state: string) => void }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"state" | "density">("density");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...states]
      .filter((row) => !query || row.state.toLowerCase().includes(query))
      .sort((a, b) => {
        if (sortBy === "state") return a.state.localeCompare(b.state);
        return (a.establishmentsPer1000Children ?? Number.POSITIVE_INFINITY)
          - (b.establishmentsPer1000Children ?? Number.POSITIVE_INFINITY);
      });
  }, [search, sortBy, states]);

  return (
    <Card data-testid="card-national-state-table">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">State comparison</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              A screening view of childcare establishments relative to the estimated child population.
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            {filtered.length} of {states.length} states
          </Badge>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find a state"
              className="pl-9"
              aria-label="Find a state"
              data-testid="input-state-search"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={sortBy === "density" ? "default" : "outline"}
              aria-pressed={sortBy === "density"}
              onClick={() => setSortBy("density")}
              data-testid="button-sort-density"
            >
              Lowest density
            </Button>
            <Button
              type="button"
              size="sm"
              variant={sortBy === "state" ? "default" : "outline"}
              aria-pressed={sortBy === "state"}
              onClick={() => setSortBy("state")}
              data-testid="button-sort-state"
            >
              A–Z
            </Button>
          </div>
        </div>
        <div className="sr-only" aria-live="polite">
          Sorted by {sortBy === "density" ? "lowest establishment density" : "state name"}.
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-2 sm:hidden">Swipe horizontally to compare all state fields.</p>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <caption className="sr-only">State childcare establishment and child population comparison</caption>
            <thead className="bg-muted/50 text-left">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">State</th>
                <th scope="col" className="px-3 py-2 font-medium text-right">Establishments</th>
                <th scope="col" className="px-3 py-2 font-medium text-right">Employees</th>
                <th scope="col" className="px-3 py-2 font-medium text-right">Children 0–12 est.</th>
                <th scope="col" className="px-3 py-2 font-medium text-right">Per 1,000 children</th>
                <th scope="col" className="px-3 py-2 font-medium">Evidence</th>
                <th scope="col" aria-label="Actions" className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((row) => (
                <tr key={row.stateFips} className="hover:bg-muted/30" data-testid={`state-row-${row.stateFips}`}>
                  <th scope="row" className="px-3 py-3 font-medium text-left">{row.state}</th>
                  <td className="px-3 py-3 text-right tabular-nums">{formatNumber(row.providerEstablishments)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatNumber(row.childcareEmployees)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatNumber(row.estimatedChildren0To12)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatRate(row.establishmentsPer1000Children)}</td>
                  <td className="px-3 py-3">
                    <Badge variant="outline" className={statusClass(row.dataStatus)}>
                      {statusLabel(row.dataStatus)}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <a
                      href="#county-lookup"
                      aria-label={`Search counties in ${row.state}`}
                      onClick={() => {
                        onStateSelect(row.state);
                        window.requestAnimationFrame(() =>
                          document.querySelector<HTMLInputElement>('[data-testid="input-national-county-search"]')?.focus(),
                        );
                      }}
                      className="text-sky-700 hover:underline text-xs whitespace-nowrap"
                      data-testid={`link-state-detail-${row.stateFips}`}
                    >
                      Search counties <ArrowRight aria-hidden="true" className="inline h-3 w-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && states.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8" data-testid="state-data-empty">
            No state rows were returned by the live Census sources.
          </p>
        )}
        {filtered.length === 0 && states.length > 0 && (
          <p className="text-sm text-muted-foreground text-center py-8" data-testid="state-search-empty">
            No state matches that search.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function CountyLookup({ stateHint }: { stateHint: string | null }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<CountyResult | null>(null);
  const latestRequest = useRef("");
  const lookup = useMutation<CountyResult, Error, string>({
    mutationFn: async (location) => {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 20_000);
      try {
        const response = await fetch(`/api/childcare/search?location=${encodeURIComponent(location)}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(isRecord(body) && typeof body.error === "string" ? body.error : "County lookup failed.");
        }
        return normalizeCountyResult(await response.json());
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw new Error("County lookup timed out. Please try again.");
        }
        throw error;
      } finally {
        window.clearTimeout(timer);
      }
    },
    onMutate: (location) => {
      latestRequest.current = location;
      setResult(null);
    },
    onSuccess: (data, location) => {
      if (latestRequest.current === location) setResult(data);
    },
    onError: (_error, location) => {
      if (latestRequest.current === location) setResult(null);
    },
    retry: false,
  });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const location = input.trim();
    if (location && !lookup.isPending) lookup.mutate(location);
  }

  return (
    <Card id="county-lookup" tabIndex={-1} data-testid="card-county-lookup">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin aria-hidden="true" className="h-5 w-5 text-sky-600" /> Go from national signal to county evidence
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Search the same live county intelligence used by the Navigator and CHW dashboard.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ConsentDisclosure
          compact
          purpose="Find county-level childcare supply information."
          fields={[{ name: "County or location", why: "Used only to retrieve the requested county's public childcare data." }]}
          sharing="Your search is sent to TCAF to retrieve public Census and childcare records; it is not shared with providers."
          withdrawal="Clear the search field or leave this page at any time."
        />
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={stateHint ? `Enter a county in ${stateHint}` : "Cook County, IL or Williamson County, TX"}
            aria-label="Search a county for childcare evidence"
            data-testid="input-national-county-search"
          />
          <Button type="submit" disabled={!input.trim() || lookup.isPending} aria-label={lookup.isPending ? "Searching county" : "Search county"} className="gap-2" data-testid="button-national-county-search">
            {lookup.isPending ? <RefreshCw aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Search aria-hidden="true" className="h-4 w-4" />}
            {lookup.isPending ? "Searching…" : "Search county"}
          </Button>
        </form>
        {stateHint && (
          <p className="text-xs text-muted-foreground" aria-live="polite">
            State selected from the comparison: <strong className="text-foreground">{stateHint}</strong>. Include the county name in your search.
          </p>
        )}
        {lookup.isError && (
          <div role="alert" className="text-sm text-red-700 border border-red-200 bg-red-50 rounded-md p-3" data-testid="national-county-error">
            {lookup.error.message}
            <Button type="button" variant="outline" size="sm" className="ml-3" disabled={!input.trim() || lookup.isPending} onClick={() => lookup.mutate(input.trim())}>
              Try again
            </Button>
          </div>
        )}
        {result && (
          <div role="status" aria-live="polite" className="rounded-md border bg-muted/20 p-4" data-testid="national-county-result">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <div className="font-semibold">{result.displayName}</div>
                <div className="text-xs text-muted-foreground mt-1">{result.summary.dataSource}</div>
              </div>
              <Badge variant="outline" className="w-fit">
                {result.summary.totalProviders?.toLocaleString() ?? "—"} provider establishments
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {[
                ["Estimated children 0–12", result.slotGap.estimatedDemand == null ? "Not available" : result.slotGap.estimatedDemand.toLocaleString()],
                ["Licensed capacity", result.summary.totalLicensedCapacity == null ? "Not available" : result.summary.totalLicensedCapacity.toLocaleString()],
                ["Slot gap", result.slotGap.slotGap == null ? "Not available" : result.slotGap.slotGap.toLocaleString()],
                ["Coverage", result.slotGap.coverageRate == null ? "Not available" : `${Math.round(result.slotGap.coverageRate * 100)}%`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border bg-background p-3">
                  <div className="text-sm font-semibold tabular-nums">{value}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{label}</div>
                </div>
              ))}
            </div>
            {result.summary.totalProviders === 0 && (
              <p className="text-xs text-muted-foreground mt-3">
                No providers were reported for this county in the current source response. This is not proof that no childcare exists.
              </p>
            )}
            {result.slotGap.dataSource && (
              <p className="text-xs text-muted-foreground mt-3">
                <strong className="text-foreground">Source:</strong> {result.slotGap.dataSource}
              </p>
            )}
            {result.slotGap.methodology && (
              <p className="text-xs text-muted-foreground mt-2">
                <strong className="text-foreground">How to read this:</strong> {result.slotGap.methodology}
              </p>
            )}
            {result.warnings.length > 0 && (
              <ul className="text-xs text-muted-foreground mt-2 list-disc pl-4 space-y-1">
                {result.warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div role="status" aria-live="polite" className="max-w-6xl mx-auto px-4 py-8 space-y-6" data-testid="national-loading">
      <span className="sr-only">Loading national childcare data</span>
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-20 w-full" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-28" />)}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function ChildCareNationalPage() {
  const [stateHint, setStateHint] = useState<string | null>(null);
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<NationalOverview>({
    queryKey: ["/api/childcare/national-overview"],
    queryFn: async ({ signal }) => {
      const controller = new AbortController();
      let timedOut = false;
      const timer = window.setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, 20_000);
      const abort = () => controller.abort();
      signal?.addEventListener("abort", abort);
      try {
        const response = await fetch("/api/childcare/national-overview", { signal: controller.signal });
        if (!response.ok) throw new Error("National childcare data is temporarily unavailable.");
        return normalizeNationalOverview(await response.json());
      } catch (error) {
        if (timedOut && error instanceof DOMException && error.name === "AbortError") {
          throw new Error("National childcare request timed out. Please try again.");
        }
        throw error;
      } finally {
        window.clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
      }
    },
    retry: false,
  });

  if (isLoading && !data) return <LoadingState />;

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16" data-testid="national-error">
        <Card className="border-red-200">
          <CardContent className="p-6">
              <div className="flex gap-3 items-start">
              <AlertTriangle aria-hidden="true" className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h1 className="font-semibold">National childcare data is unavailable</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  The live Census sources did not return a complete response. The page will not substitute zeros or modeled values.
                </p>
                <p className="text-xs text-muted-foreground mt-2">{error instanceof Error ? error.message : "Try again in a moment."}</p>
                <Button onClick={() => refetch()} disabled={isFetching} variant="outline" size="sm" className="mt-4 gap-2" data-testid="button-retry-national">
                  <RefreshCw aria-hidden="true" className="h-4 w-4" /> Try again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { national, economicContext, coverage } = data;
  const lastUpdated = new Date(data.retrievedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="min-h-screen bg-background" data-testid="page-child-care-national">
      {isError && (
        <div className="mx-auto max-w-6xl px-4 pt-4" role="alert" data-testid="national-stale-warning">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <span>Showing the last successful national result. A refresh did not complete, so the data may be stale.</span>
            <Button onClick={() => refetch()} disabled={isFetching} variant="outline" size="sm" className="gap-2">
              <RefreshCw aria-hidden="true" className="h-4 w-4" /> {isFetching ? "Refreshing…" : "Try again"}
            </Button>
          </div>
        </div>
      )}
      <section className="bg-gradient-to-br from-slate-950 via-sky-950 to-indigo-950 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <Badge className="bg-sky-400/15 text-sky-200 border-sky-300/30">National childcare intelligence</Badge>
            <Badge variant="outline" className="border-white/20 text-white/80">Live Census sources</Badge>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-black leading-tight">
              Childcare supply meets<br />
              <span className="text-sky-300">economic pressure.</span>
            </h1>
            <p className="text-sky-100/80 text-base md:text-lg mt-4 leading-relaxed">
              A national screening view that connects childcare establishments and child-population estimates with an attributed household hardship benchmark. It helps a community decide what to investigate next—not claim a slot gap that the source data cannot prove.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 mt-7">
            <Link
              href="/child-care"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-950 shadow hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              data-testid="button-county-explorer"
            >
              <MapPin aria-hidden="true" className="h-4 w-4" /> Open county explorer
            </Link>
            <Link
              href="/child-care-wilco"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/25 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              data-testid="button-texas-detail"
            >
              Texas capacity detail <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {isFetching && (
          <div role="status" aria-live="polite" className="text-xs text-muted-foreground" data-testid="national-refreshing">
            Refreshing live Census sources…
          </div>
        )}
        {coverage.statesWithCompleteData < coverage.statesIncluded && !isFetching && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
            data-testid="button-refresh-partial-national"
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" /> Refresh incomplete source data
          </Button>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span data-testid="text-national-updated">Response timestamp {lastUpdated}</span>
          <span>{coverage.statesWithCompleteData} of {coverage.statesIncluded} included states have both Census tables.</span>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="National childcare summary">
          {[
            { label: "Childcare establishments", value: formatNumber(national.providerEstablishments), detail: "Census CBP NAICS 6244", icon: Building2 },
            { label: "Estimated children 0–12", value: formatNumber(national.estimatedChildren0To12), detail: "ACS B01001 estimate", icon: Baby },
            { label: "Childcare employees", value: formatNumber(national.childcareEmployees), detail: "Census CBP employment", icon: Users },
            { label: "Establishments per 1,000", value: formatRate(national.establishmentsPer1000Children), detail: "Screening ratio, not slots", icon: BarChart3 },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} data-testid={`national-stat-${stat.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                <CardContent className="p-5">
                  <Icon className="h-5 w-5 text-sky-600 mb-4" />
                  <div className="text-2xl font-black tabular-nums">{stat.value}</div>
                  <div className="text-sm font-medium mt-1">{stat.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.detail}</div>
                </CardContent>
              </Card>
            );
          })}
        </section>
        <EvidenceSummary
          claims={[{
            value: national.providerEstablishments,
            unit: "childcare establishments",
            source: "HHSC CCL (TX) + Census CBP 2022 NAICS 6244",
            sourceId: "hhsc-ccl-childcare",
            asOfDate: "2022",
            geographyKey: "United States",
            confidence: "verified",
            decisionCaption: "Use establishment density as a screening signal, not as a count of available childcare slots.",
          }]}
        />

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-5 w-5 text-amber-600" /> Economic pressure context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                United for ALICE reports that {economicContext.belowAliceThresholdRate}% of U.S. households were below the ALICE Threshold in {economicContext.dataVintage}: {formatNumber(economicContext.belowAliceThresholdHouseholds)} households below the level needed to afford the basics where they live.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="rounded-md border bg-background/70 p-3">
                  <div className="text-lg font-bold">{formatNumber(economicContext.povertyHouseholds)}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">Poverty households</div>
                </div>
                <div className="rounded-md border bg-background/70 p-3">
                  <div className="text-lg font-bold">{formatNumber(economicContext.aliceHouseholds)}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">ALICE households</div>
                </div>
                <div className="rounded-md border bg-background/70 p-3">
                  <div className="text-lg font-bold">{economicContext.belowAliceThresholdRate}%</div>
                  <div className="text-[11px] text-muted-foreground mt-1">Below threshold</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{economicContext.disclosure}</p>
              <a
                href={economicContext.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-sky-700 hover:underline"
                data-testid="link-alice-source"
              >
                Read the United for ALICE national overview <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-sky-600" /> What this overview can answer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p><strong className="text-foreground">Can answer:</strong> where childcare establishments are more or less dense relative to the estimated child population, and which counties warrant a closer look.</p>
              <p><strong className="text-foreground">Cannot answer:</strong> how many licensed slots are open, whether families are on a waitlist, affordability, occupancy, or quality.</p>
              <p><strong className="text-foreground">County next step:</strong> Texas county views add HHSC licensed capacity; other county views disclose that capacity is not standardized in the federal source.</p>
              <Link href="/community-compare" className="inline-flex items-center gap-1 text-sky-700 hover:underline" data-testid="link-community-compare">
                Compare communities across TCAF intelligence <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        </section>

        <CountyLookup stateHint={stateHint} />
        <StateTable states={data.states} onStateSelect={setStateHint} />

        <Card className="border-slate-200 bg-slate-50/70 dark:bg-slate-900/30">
          <CardHeader>
            <CardTitle className="text-lg">Sources, method, and limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.sources.map((source, index) => (
                <div key={`${source.name}-${index}`} className="rounded-md border bg-background p-4">
                  <div className="font-medium text-sm">{source.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{source.role}</div>
                  <div className="text-xs text-muted-foreground mt-2">Vintage: {source.vintage}</div>
                  <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-sky-700 hover:underline mt-2">
                    Open source <ExternalLink aria-hidden="true" className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
            <div className="rounded-md border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
              <div className="flex items-start gap-2">
                <AlertTriangle aria-hidden="true" className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  {data.warnings.map((warning, index) => <p key={`${warning}-${index}`}>{warning}</p>)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}