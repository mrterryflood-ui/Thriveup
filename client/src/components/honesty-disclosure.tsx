import type { GateVerdict } from "@shared/inference-honesty";

export function HonestyDisclosure({ verdict }: { verdict?: GateVerdict }) {
  if (!verdict) return <p className="mt-3 border-t pt-2 text-xs text-muted-foreground" data-testid="navigator-honesty">No numeric check was recorded for this saved reply.</p>;
  const label = verdict.status === "not_evaluated" ? "Numeric check not evaluated"
    : verdict.status === "unavailable" ? "Numeric check unavailable"
    : verdict.pass ? "No unsupported screened figures or forecast-label issues detected" : "Numeric or forecast-label review needed";
  return <details className="mt-3 border-t pt-2 text-xs text-muted-foreground" data-testid="navigator-honesty">
    <summary className="cursor-pointer min-h-8 flex items-center" data-testid="navigator-honesty-summary">{label}</summary>
    <p className="mt-2">{verdict.scope}</p>
    <p className="mt-2">Evidence: {verdict.evidenceOrigin === "server-context" ? "assembled server context" : verdict.evidenceOrigin === "caller-supplied" ? "caller-supplied facts, not independently verified" : "none supplied"}. This advisory verdict does not replace existing grounding controls.</p>
    {verdict.reasons.length > 0 && <ul className="mt-2 list-disc pl-4">{verdict.reasons.map((reason, index) => <li key={index}>{reason}</li>)}</ul>}
  </details>;
}