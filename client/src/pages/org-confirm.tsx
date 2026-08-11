import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, AlertTriangle, Loader2, Building2, DollarSign } from "lucide-react";

/**
 * Public org-confirmation page — NO session required. A partner org receives a
 * one-time token link and confirms the enrollment outcome for a referral so the
 * dollars roll up to the right funder dashboard.
 *
 * Server contract (built in parallel):
 *   POST /api/referrals/org-confirm/:orgToken
 *   body: { status, benefitValueEstimate?, notes? }
 *   200 -> success; 404 -> invalid token; 409 -> already confirmed (final)
 */

const STATUS_OPTIONS = [
  { value: "enrolled", label: "Enrolled — client is receiving services" },
  { value: "accepted", label: "Accepted — pending enrollment" },
  { value: "ineligible", label: "Ineligible — did not qualify" },
  { value: "withdrew", label: "Withdrew — client declined or dropped out" },
];

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "not_found" }
  | { kind: "conflict" }
  | { kind: "error"; message: string };

export default function OrgConfirmPage() {
  const [, params] = useRoute("/org-confirm/:token");
  const token = params?.token ?? "";

  const [status, setStatus] = useState("");
  const [benefitValueEstimate, setBenefitValueEstimate] = useState("");
  const [notes, setNotes] = useState("");
  const [state, setState] = useState<SubmitState>({ kind: "idle" });

  useEffect(() => {
    document.title = "Confirm Referral Outcome | ThriveUp";
  }, []);

  async function handleSubmit() {
    if (!status) return;
    setState({ kind: "submitting" });
    try {
      const body: Record<string, unknown> = { status };
      const trimmedValue = benefitValueEstimate.trim();
      if (trimmedValue !== "") {
        const parsed = Number(trimmedValue);
        if (!Number.isNaN(parsed)) body.benefitValueEstimate = parsed;
      }
      if (notes.trim() !== "") body.notes = notes.trim();

      const res = await fetch(`/api/referrals/org-confirm/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setState({ kind: "success" });
        return;
      }
      if (res.status === 404) {
        setState({ kind: "not_found" });
        return;
      }
      if (res.status === 409) {
        setState({ kind: "conflict" });
        return;
      }
      const errBody = await res.json().catch(() => ({}));
      setState({
        kind: "error",
        message: errBody.error || `Something went wrong (${res.status}). Please try again.`,
      });
    } catch {
      setState({
        kind: "error",
        message: "Network error — please check your connection and try again.",
      });
    }
  }

  const isSubmitting = state.kind === "submitting";

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white dark:from-teal-950/20 dark:to-background p-4 sm:p-6 flex items-start justify-center">
      <div className="w-full max-w-lg mx-auto pt-6 sm:pt-12" data-testid="org-confirm-page">
        <div className="flex items-center gap-2 mb-4">
          <div className="rounded-md p-2 bg-teal-100 dark:bg-teal-900/30">
            <Building2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <span className="font-semibold text-teal-900 dark:text-teal-100">ThriveUp Referrals</span>
        </div>

        {state.kind === "success" ? (
          <Card data-testid="state-success">
            <CardContent className="pt-8 pb-8 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
              <h1 className="text-lg font-bold mb-1">Thank you — outcome recorded</h1>
              <p className="text-sm text-muted-foreground">
                This referral outcome has been confirmed and credited to the funder's impact
                dashboard. You can close this page.
              </p>
            </CardContent>
          </Card>
        ) : state.kind === "not_found" ? (
          <Card data-testid="state-not-found">
            <CardContent className="pt-8 pb-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-3" />
              <h1 className="text-lg font-bold mb-1">Link not valid</h1>
              <p className="text-sm text-muted-foreground">
                This confirmation link is invalid or has expired. Please contact the community
                health worker who sent it for a new link.
              </p>
            </CardContent>
          </Card>
        ) : state.kind === "conflict" ? (
          <Card data-testid="state-conflict">
            <CardContent className="pt-8 pb-8 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-blue-500 mb-3" />
              <h1 className="text-lg font-bold mb-1">Already confirmed</h1>
              <p className="text-sm text-muted-foreground">
                This referral outcome has already been recorded and is final. No further changes
                are needed. If you believe this is a mistake, contact the referring worker.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Confirm enrollment outcome for this referral</CardTitle>
              <p className="text-sm text-muted-foreground pt-1">
                A community health worker referred a client to your program. Let us know what
                happened so the impact is credited accurately.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="org-confirm-status">Outcome</Label>
                <Select value={status} onValueChange={setStatus} disabled={isSubmitting}>
                  <SelectTrigger
                    id="org-confirm-status"
                    className="min-h-[44px]"
                    data-testid="select-status"
                  >
                    <SelectValue placeholder="Select an outcome…" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value} data-testid={`option-status-${o.value}`}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-confirm-value">
                  Estimated annual benefit value <span className="text-muted-foreground font-normal">(optional, USD)</span>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="org-confirm-value"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="1"
                    placeholder="e.g. 4800"
                    className="min-h-[44px] pl-9"
                    value={benefitValueEstimate}
                    onChange={(e) => setBenefitValueEstimate(e.target.value)}
                    disabled={isSubmitting}
                    data-testid="input-benefit-value"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Approximate dollar value of the services or benefits the client will receive over
                  a year, if known.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-confirm-notes">
                  Notes <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="org-confirm-notes"
                  placeholder="Anything the referring worker should know…"
                  className="min-h-[88px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSubmitting}
                  data-testid="input-notes"
                />
              </div>

              {state.kind === "error" && (
                <div
                  className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded p-3"
                  data-testid="state-error"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{state.message}</span>
                </div>
              )}

              <Button
                className="w-full min-h-[44px]"
                disabled={!status || isSubmitting}
                onClick={handleSubmit}
                data-testid="button-submit"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…
                  </>
                ) : (
                  "Confirm outcome"
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
