import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { writeEphemeralSessionValue } from "@/lib/ephemeral-session";

/**
 * Posture B for N. Williamson County: present the regional briefing's working
 * hypotheses as guesses, not findings. Residents contest each one (thumbs up/down +
 * free text). Submission creates an ITI invitation tagged with the hypothesis so we
 * can see who agreed/disagreed with what and follow back if they consent.
 *
 * Hard-coded with the 5 hypotheses from the 2026 briefing. Future surfaces can
 * pass their own via props (Week 4 if/when other regions adopt the pattern).
 */

interface Hypothesis {
  id: string;
  label: string;
  detail: string;
}

const N_WILCO_HYPOTHESES: Hypothesis[] = [
  { id: "infant-slots", label: "Infant childcare slots are the tightest gap",
    detail: "Our guess: 0–18-month slots are scarce because they're more expensive to staff (1:4 ratio in TX). Right?" },
  { id: "ccs-deserts", label: "There are CCS (subsidy) deserts in N. Wilco",
    detail: "Our guess: some ZIPs in N. Wilco have CCS-eligible families but no providers willing to take CCS reimbursement rates." },
  { id: "shift-work-hours", label: "Shift-worker hours are unmet — Samsung/AMAT night shifts",
    detail: "Our guess: Samsung Taylor + Applied Materials Hutto run 24/7; we don't have licensed care at 11pm-7am." },
  { id: "special-needs", label: "Special-needs slots are nearly absent",
    detail: "Our guess: ECI-eligible kids and kids with IEPs/504s can't find licensed providers trained to serve them." },
  { id: "bilingual", label: "Bilingual (Spanish/English) care is under-supplied",
    detail: "Our guess: Spanish-dominant households have to choose between language and licensing." },
];

interface HypothesisContestProps {
  surface: string;       // "voice-project"
  surfaceContext: string; // slug e.g. "north-wilco-childcare-gaps"
  hypotheses?: Hypothesis[];
  className?: string;
}

type Vote = "agree" | "disagree" | null;
interface Response { hypothesisId: string; vote: Vote; missedNote: string }

export function HypothesisContest({
  surface, surfaceContext, hypotheses = N_WILCO_HYPOTHESES, className,
}: HypothesisContestProps) {
  const { toast } = useToast();
  const [responses, setResponses] = useState<Record<string, { vote: Vote; missedNote: string }>>(
    () => Object.fromEntries(hypotheses.map(h => [h.id, { vote: null, missedNote: "" }]))
  );
  const [whatElse, setWhatElse] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const anyResponse = Object.values(responses).some(r => r.vote !== null || r.missedNote.trim().length > 0) || whatElse.trim().length > 0;

  async function submit() {
    if (!anyResponse) {
      toast({ title: "Pick at least one", description: "Thumbs up/down on any hypothesis or write what we missed." });
      return;
    }
    setBusy(true);
    try {
      const summary = hypotheses
        .map(h => {
          const r = responses[h.id];
          if (!r.vote && !r.missedNote.trim()) return null;
          return `${h.label}: ${r.vote ?? "no-vote"}${r.missedNote.trim() ? ` — "${r.missedNote.trim()}"` : ""}`;
        })
        .filter(Boolean)
        .join("\n");
      const work = [summary, whatElse.trim() ? `What we missed: ${whatElse.trim()}` : ""].filter(Boolean).join("\n\n");

      const res = await fetch("/api/iti/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surface, surfaceContext,
          workDescription: `[hypothesis-contest]\n${work}`,
          workRolesSelfIdentified: ["hypothesis-contest-respondent"],
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      const j = await res.json();
      if (j.accessToken && j.invitation?.id) {
        writeEphemeralSessionValue(`iti-token:${surface}:${surfaceContext}`, j.accessToken);
        writeEphemeralSessionValue(`iti-id:${surface}:${surfaceContext}`, j.invitation.id);
      }
      setSubmitted(true);
      toast({ title: "Heard you", description: "Your contest of these guesses is now on the record." });
    } catch (e: any) {
      toast({ title: "Couldn't submit", description: e.message ?? "Try again.", variant: "destructive" });
    } finally { setBusy(false); }
  }

  if (submitted) {
    return (
      <Card className={className} data-testid="hypothesis-contest-thanks">
        <CardContent className="p-6 flex gap-3 items-start">
          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">Your contest of our guesses is on the record.</div>
            <div className="text-sm text-muted-foreground mt-1">Scroll down — the invitation panel will let you control what we do with what you said. You can withdraw any time.</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid="hypothesis-contest">
      <CardHeader>
        <CardTitle>These are our current guesses. Are they true for you?</CardTitle>
        <CardDescription>
          We did a regional briefing in May 2026 and came up with 5 hypotheses about N. Williamson County childcare. We don't want you to pick from our taxonomy — we want you to <strong>contest</strong> these guesses. Thumbs up, thumbs down, and tell us what we missed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hypotheses.map((h) => {
          const r = responses[h.id];
          return (
            <div key={h.id} className="border rounded-md p-3" data-testid={`hypothesis-${h.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-medium">{h.label}</div>
                  <div className="text-sm text-muted-foreground mt-1">{h.detail}</div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant={r.vote === "agree" ? "default" : "outline"}
                    onClick={() => setResponses(s => ({ ...s, [h.id]: { ...s[h.id], vote: r.vote === "agree" ? null : "agree" } }))}
                    data-testid={`button-agree-${h.id}`}
                  ><ThumbsUp className="h-4 w-4" /></Button>
                  <Button
                    size="sm"
                    variant={r.vote === "disagree" ? "destructive" : "outline"}
                    onClick={() => setResponses(s => ({ ...s, [h.id]: { ...s[h.id], vote: r.vote === "disagree" ? null : "disagree" } }))}
                    data-testid={`button-disagree-${h.id}`}
                  ><ThumbsDown className="h-4 w-4" /></Button>
                </div>
              </div>
              {r.vote && (
                <Textarea
                  className="mt-2 text-sm"
                  placeholder={r.vote === "disagree" ? "What did we get wrong?" : "What did we miss inside this one?"}
                  value={r.missedNote}
                  onChange={(e) => setResponses(s => ({ ...s, [h.id]: { ...s[h.id], missedNote: e.target.value } }))}
                  data-testid={`textarea-note-${h.id}`}
                />
              )}
            </div>
          );
        })}

        <div>
          <div className="font-medium text-sm mb-1">What's the gap we didn't even guess at?</div>
          <Textarea
            placeholder="Tell us in your own words. We promise to count this against our own hypotheses."
            value={whatElse}
            onChange={(e) => setWhatElse(e.target.value)}
            data-testid="textarea-what-else"
          />
        </div>

        <Button onClick={submit} disabled={busy || !anyResponse} data-testid="button-submit-hypothesis-contest">
          {busy ? "Submitting…" : "Put my contest on the record"}
        </Button>
        <div className="text-xs text-muted-foreground">
          This creates a private record under your control. After submitting, the invitation panel below lets you decide what (if anything) we do with what you said.
        </div>
      </CardContent>
    </Card>
  );
}
