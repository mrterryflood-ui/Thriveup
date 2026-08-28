import { AlertTriangle, Database, Sparkles } from "lucide-react";

interface EvidencePanelProps {
  evidence?: any;
  compact?: boolean;
}
type EvidenceSource = Record<string, unknown>;

/**
 * Shared disclosure for Community Brief data. Keep this on every public
 * consumer so a resolved ZCTA, a TCAF calculation, and AI prose cannot be
 * mistaken for a verified city-level Census finding.
 */
export function CommunityEvidencePanel({ evidence, compact = false }: EvidencePanelProps) {
  if (!evidence) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" data-testid="community-evidence-unavailable">
        <div className="flex gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>This legacy brief has no verifiable evidence contract. Its geography and claims should be reviewed before use.</p>
        </div>
      </div>
    );
  }

  const resolved = evidence.geography?.resolved ?? {};
  const sources: EvidenceSource[] = Array.isArray(evidence.sources) ? evidence.sources.filter((candidate: unknown): candidate is EvidenceSource => Boolean(candidate) && typeof candidate === "object") : [];
  const source = sources[0] ?? {};
  const text = (value: unknown, fallback = "") => typeof value === "string" || typeof value === "number" ? String(value) : fallback;
  const warnings = [
    ...(Array.isArray(evidence.dataQuality?.warnings) ? evidence.dataQuality.warnings : []),
    ...(Array.isArray(evidence.warnings) ? evidence.warnings : []),
  ].filter((warning: unknown): warning is string => typeof warning === "string" && warning.trim().length > 0);
  const scenario = evidence.claims?.tcafScenario && typeof evidence.claims.tcafScenario === "object" ? evidence.claims.tcafScenario : null;

  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-sm dark:border-blue-900 dark:bg-blue-950/20" data-testid="community-evidence-panel">
      <div className="flex items-start gap-3">
        <Database className="mt-0.5 h-5 w-5 shrink-0 text-blue-700 dark:text-blue-300" />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-blue-950 dark:text-blue-100">Evidence &amp; methodology</h2>
          <p className="mt-1 text-blue-900/80 dark:text-blue-200/80">
            Analyzed geography: <strong>{text(resolved.label, "not disclosed")}</strong>
            {resolved.type ? ` (${text(resolved.type).toUpperCase()}${resolved.identifier ? ` ${text(resolved.identifier)}` : ""})` : ""}.
          </p>
          {!compact && (
            <>
              <p className="mt-1 text-xs text-blue-900/75 dark:text-blue-200/75">
                {text(source.publisher, "Source not disclosed")}{source.dataset ? ` · ${text(source.dataset)}` : ""}{source.vintage ? ` · ${text(source.vintage)}` : ""}.
                {typeof source.retrievedAt === "string" ? ` Retrieved ${new Date(source.retrievedAt).toLocaleString()}.` : ""}
              </p>
              {sources.some((candidate) => typeof candidate.url === "string" && /^https?:\/\//.test(candidate.url)) && (
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {sources.slice(0, 20).map((candidate, index) => (
                    typeof candidate.url === "string" && /^https?:\/\//.test(candidate.url)
                      ? <a key={`${candidate.url}-${index}`} className="text-xs font-semibold underline" href={candidate.url} target="_blank" rel="noopener noreferrer">
                          {typeof candidate.publisher === "string" ? `Review ${candidate.publisher}` : `Review source ${index + 1}`}
                        </a>
                      : null
                  ))}
                </div>
              )}
              {resolved.method && <p className="mt-1 text-xs text-blue-900/75 dark:text-blue-200/75">Resolution: {text(resolved.method)}</p>}
            </>
          )}
          {warnings.map((warning, index) => (
            <p key={`${warning}-${index}`} className="mt-2 rounded bg-amber-100 px-2 py-1 text-xs text-amber-950 dark:bg-amber-950/50 dark:text-amber-100">
              {warning}
            </p>
          ))}
        </div>
      </div>
      {!compact && (
        <div className="mt-3 border-t border-blue-200 pt-3 text-xs text-blue-900/80 dark:border-blue-900 dark:text-blue-200/80">
          <p><strong>Observed:</strong> public-data estimates at the disclosed geography grain.</p>
          <p className="mt-1"><strong>TCAF-derived:</strong> scores and population estimates are calculations, not Census findings.</p>
           <p className="mt-1"><strong>TCAF scenario:</strong> {text(scenario?.disclosure, "not available.")}</p>
          <p className="mt-1 flex gap-1.5"><Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>AI narrative is decision-support synthesis, not an independently verified factual finding.</span></p>
        </div>
      )}
    </section>
  );
}