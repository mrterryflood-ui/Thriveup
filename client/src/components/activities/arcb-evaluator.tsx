/**
 * ArcbEvaluator — ARCB framework evaluation tool.
 *
 * Students rate an AI response on four dimensions:
 *   Accuracy · Relevance · Completeness · Bias
 * Then compare their rating to the expert evaluation.
 *
 * Teaches students to critically assess AI outputs with a structured rubric
 * rather than accepting them at face value.
 */
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, AlertTriangle, Bot, Scale } from "lucide-react";

export interface ArcbEvaluatorData {
  type: "arcb-evaluator";
  prompt: string;
  aiResponse: string;
  expertRatings: { accuracy: number; relevance: number; completeness: number; bias: number };
  expertNotes: { accuracy: string; relevance: string; completeness: string; bias: string };
}

const DIMENSIONS = [
  {
    key: "accuracy" as const,
    label: "Accuracy",
    letter: "A",
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    desc: "Is the information factually correct? Could any of it be hallucinated?",
    lowLabel: "Many errors / hallucinations",
    highLabel: "Fully verifiable and correct",
  },
  {
    key: "relevance" as const,
    label: "Relevance",
    letter: "R",
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    desc: "Does it actually answer the question asked? Or does it go off-topic?",
    lowLabel: "Off-topic or tangential",
    highLabel: "Directly answers the question",
  },
  {
    key: "completeness" as const,
    label: "Completeness",
    letter: "C",
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    desc: "Are important aspects missing? Is it thorough enough to be useful?",
    lowLabel: "Major gaps / missing context",
    highLabel: "Thorough and complete",
  },
  {
    key: "bias" as const,
    label: "Bias",
    letter: "B",
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/30",
    desc: "Does it show one-sided framing, stereotypes, or omit important perspectives?",
    lowLabel: "Highly biased or one-sided",
    highLabel: "Balanced and unbiased",
  },
];

function RatingSlider({
  value, onChange, disabled,
}: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-4">1</span>
      <div className="flex-1 flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            disabled={disabled}
            onClick={() => onChange(n)}
            className={`flex-1 h-8 rounded text-xs font-semibold transition-all border ${
              value === n
                ? "bg-primary text-primary-foreground border-primary scale-105"
                : value >= n
                ? "bg-primary/20 border-primary/40 text-primary"
                : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
            } ${disabled ? "cursor-default" : "cursor-pointer"}`}
            data-testid={`rating-btn-${n}`}
          >
            {n}
          </button>
        ))}
      </div>
      <span className="text-xs text-muted-foreground w-4">5</span>
    </div>
  );
}

function DiffBadge({ mine, expert }: { mine: number; expert: number }) {
  const diff = Math.abs(mine - expert);
  if (diff === 0) return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] border-emerald-300">Exact match!</Badge>;
  if (diff === 1) return <Badge variant="outline" className="text-[10px] text-amber-600">Off by 1</Badge>;
  return <Badge variant="destructive" className="text-[10px] opacity-80">Off by {diff}</Badge>;
}

export default function ArcbEvaluator({ data }: { data: ArcbEvaluatorData }) {
  const [ratings, setRatings] = useState<Record<string, number>>({ accuracy: 0, relevance: 0, completeness: 0, bias: 0 });
  const [notes, setNotes] = useState<Record<string, string>>({ accuracy: "", relevance: "", completeness: "", bias: "" });
  const [submitted, setSubmitted] = useState(false);

  const allRated = Object.values(ratings).every(v => v > 0);
  const totalScore = Math.round(
    Object.entries(ratings).reduce((sum, [k, v]) => {
      const expert = data.expertRatings[k as keyof typeof data.expertRatings];
      return sum + Math.max(0, 5 - Math.abs(v - expert));
    }, 0),
  );
  const maxScore = 5 * DIMENSIONS.length;

  return (
    <Card className="p-6 my-6 space-y-5" data-testid="activity-arcb-evaluator">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <Scale className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">ARCB Evaluation Lab</h3>
        <Badge variant="secondary" className="text-xs">Accuracy · Relevance · Completeness · Bias</Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        Don't trust AI blindly. Evaluate this AI response using the ARCB framework.
        Rate each dimension 1–5, then compare your judgment to the expert analysis.
      </p>

      {/* The prompt */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Original prompt</p>
        <div className="bg-muted/40 rounded-lg px-4 py-3 text-sm italic">{data.prompt}</div>
      </div>

      {/* The AI response */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <Bot className="h-3.5 w-3.5" /> AI response to evaluate
        </p>
        <div className="bg-muted/20 border rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
          {data.aiResponse}
        </div>
      </div>

      {/* Rating grid */}
      <div className="space-y-5">
        <p className="text-sm font-medium">Rate each dimension:</p>
        {DIMENSIONS.map(dim => (
          <div key={dim.key} className={`rounded-xl p-4 space-y-3 ${dim.bg}`}>
            <div className="flex items-center gap-2">
              <span className={`font-black text-xl ${dim.color}`}>{dim.letter}</span>
              <div>
                <p className="font-semibold text-sm">{dim.label}</p>
                <p className="text-xs text-muted-foreground">{dim.desc}</p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                <span>{dim.lowLabel}</span>
                <span>{dim.highLabel}</span>
              </div>
              <RatingSlider
                value={ratings[dim.key] ?? 0}
                onChange={v => setRatings(prev => ({ ...prev, [dim.key]: v }))}
                disabled={submitted}
              />
            </div>

            <Textarea
              value={notes[dim.key]}
              onChange={e => setNotes(prev => ({ ...prev, [dim.key]: e.target.value }))}
              placeholder={`What did you notice about the ${dim.label.toLowerCase()} of this response?`}
              rows={2}
              className="text-xs resize-none bg-background/60"
              disabled={submitted}
              data-testid={`textarea-note-${dim.key}`}
            />

            {/* Expert comparison (post-submit) */}
            {submitted && (
              <div className="border-t pt-3 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold">Expert rating: {data.expertRatings[dim.key]}/5</span>
                  <DiffBadge mine={ratings[dim.key]} expert={data.expertRatings[dim.key]} />
                  <span className="text-xs text-muted-foreground">You gave: {ratings[dim.key]}/5</span>
                </div>
                <p className="text-xs text-muted-foreground">{data.expertNotes[dim.key]}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit / result */}
      {!submitted ? (
        <Button
          onClick={() => setSubmitted(true)}
          disabled={!allRated}
          className="w-full"
          data-testid="button-submit-arcb"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" /> Submit my evaluation
        </Button>
      ) : (
        <div className="rounded-xl bg-muted/30 p-4 space-y-2">
          <div className="flex items-center gap-2">
            {totalScore >= maxScore * 0.8 ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
            <p className="font-semibold">
              Evaluation score: {totalScore}/{maxScore} points
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {totalScore >= maxScore * 0.8
              ? "Sharp evaluation! Your ARCB judgment closely matches the expert analysis. Keep using this framework on every AI output."
              : totalScore >= maxScore * 0.6
              ? "Good effort. Review the expert notes above to see where your judgment differed — calibrating your internal rubric takes practice."
              : "The expert ratings may surprise you. Read the explanations carefully — AI outputs can look polished while hiding real problems."}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">
              ARCB is your lifelong tool. Apply it every time AI gives you information you plan to use or share.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
