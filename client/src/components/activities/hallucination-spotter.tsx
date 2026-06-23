/**
 * HallucinationSpotter — Click-to-flag suspicious claims in AI-generated text.
 *
 * Students read a paragraph of AI-generated text, click on sentences they
 * think are fabricated, then reveal which were actually hallucinations.
 * Scored on precision + recall (both false positives and misses count).
 */
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, CheckCircle2, X, Eye, RotateCcw, Flag,
} from "lucide-react";

export interface HallucinationSpotterData {
  type: "hallucination-spotter";
  context: string;
  sentences: { text: string; isHallucination: boolean; explanation: string }[];
  instructions?: string;
}

type Phase = "flagging" | "revealed";

function scoreResult(
  flagged: Set<number>,
  sentences: HallucinationSpotterData["sentences"],
): { tp: number; fp: number; fn: number; score: number; max: number } {
  let tp = 0, fp = 0, fn = 0;
  sentences.forEach((s, i) => {
    const isFlagged = flagged.has(i);
    if (s.isHallucination && isFlagged) tp++;
    else if (!s.isHallucination && isFlagged) fp++;
    else if (s.isHallucination && !isFlagged) fn++;
  });
  const hallCount = sentences.filter(s => s.isHallucination).length;
  const max = hallCount * 2;
  const score = Math.max(0, tp * 2 - fp - fn);
  return { tp, fp, fn, score, max };
}

export default function HallucinationSpotter({ data }: { data: HallucinationSpotterData }) {
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [phase, setPhase] = useState<Phase>("flagging");

  const { tp, fp, fn, score, max } = scoreResult(flagged, data.sentences);
  const hallCount = data.sentences.filter(s => s.isHallucination).length;

  function toggleFlag(i: number) {
    if (phase !== "flagging") return;
    setFlagged(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function reset() {
    setFlagged(new Set());
    setPhase("flagging");
  }

  return (
    <Card className="p-6 my-6 space-y-4" data-testid="activity-hallucination-spotter">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <h3 className="font-semibold text-lg">Hallucination Spotter</h3>
        {phase === "flagging" && (
          <Badge variant="secondary" className="text-xs">
            {flagged.size} flagged · {hallCount} hallucinations hidden
          </Badge>
        )}
        {phase === "revealed" && (
          <Badge
            className={`text-xs ${score >= max * 0.7 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300"}`}
          >
            Score: {score}/{max}
          </Badge>
        )}
      </div>

      {/* Context */}
      <div className="text-xs font-medium text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
        Topic: {data.context}
      </div>

      {phase === "flagging" && (
        <div className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
          <Flag className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            {data.instructions ?? "Click any sentence you think the AI may have fabricated. You can flag multiple. When done, hit Reveal to see the truth."}
          </span>
        </div>
      )}

      {/* Sentence cards */}
      <div className="space-y-2">
        {data.sentences.map((sentence, i) => {
          const isFlagged = flagged.has(i);
          const isHall = sentence.isHallucination;

          let bgClass = "bg-muted/20 border-border hover:bg-muted/40 cursor-pointer";
          if (phase === "flagging" && isFlagged) bgClass = "bg-red-50 dark:bg-red-950/20 border-red-400 cursor-pointer";
          if (phase === "revealed") {
            if (isHall && isFlagged) bgClass = "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 cursor-default"; // TP
            else if (isHall && !isFlagged) bgClass = "bg-red-100 dark:bg-red-950/30 border-red-600 cursor-default";      // FN
            else if (!isHall && isFlagged) bgClass = "bg-amber-50 dark:bg-amber-950/20 border-amber-500 cursor-default"; // FP
            else bgClass = "bg-muted/20 border-border cursor-default";                                                    // TN
          }

          return (
            <div
              key={i}
              onClick={() => toggleFlag(i)}
              className={`rounded-lg border-2 px-4 py-3 text-sm transition-all ${bgClass}`}
              data-testid={`sentence-${i}`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">{sentence.text}</div>
                {/* Flagging mode indicator */}
                {phase === "flagging" && isFlagged && (
                  <Flag className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                )}
                {/* Revealed indicators */}
                {phase === "revealed" && isHall && isFlagged && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                {phase === "revealed" && isHall && !isFlagged && (
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                )}
                {phase === "revealed" && !isHall && isFlagged && (
                  <X className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                )}
              </div>
              {/* Explanation post-reveal */}
              {phase === "revealed" && (isHall || isFlagged) && (
                <div className={`mt-2 pt-2 border-t text-xs space-y-0.5 ${
                  isHall ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"
                }`}>
                  <p className="font-semibold">
                    {isHall
                      ? isFlagged ? "✓ Hallucination — you caught it!" : "✗ Hallucination — you missed it"
                      : "✗ Not a hallucination — false alarm"}
                  </p>
                  <p className="text-muted-foreground">{sentence.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {phase === "flagging" ? (
        <Button
          onClick={() => setPhase("revealed")}
          className="w-full"
          data-testid="button-reveal-hallucinations"
        >
          <Eye className="h-4 w-4 mr-2" /> Reveal the hallucinations
        </Button>
      ) : (
        <div className="space-y-3">
          {/* Score card */}
          <div className="rounded-xl bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2">
              {score >= max * 0.7 ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
              <p className="font-semibold">
                Score: {score}/{max} — {tp} caught, {fn} missed, {fp} false alarm{fp !== 1 ? "s" : ""}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {score >= max * 0.8
                ? "Outstanding. You have sharp critical eyes — you'd catch AI errors that fool most readers."
                : score >= max * 0.5
                ? "Good instincts. The missed hallucinations are tricky — they sound plausible because AI fabricates with confidence."
                : "Hallucinations are hard to spot because AI doesn't signal doubt. The rule: verify any specific claim (numbers, dates, names, citations) before using it."}
            </p>
          </div>
          <Button variant="outline" onClick={reset} className="w-full" data-testid="button-retry-hallucination">
            <RotateCcw className="h-4 w-4 mr-2" /> Try again
          </Button>
        </div>
      )}
    </Card>
  );
}
