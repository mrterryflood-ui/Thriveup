/**
 * BiasDetective — Side-by-side AI response comparison.
 *
 * Shows two AI responses to the same prompt. Student identifies which
 * is more biased, flags specific phrases, and explains the bias type.
 * Reveal shows which was biased and why.
 */
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Scale, CheckCircle2, AlertTriangle, Eye, RotateCcw, Search,
} from "lucide-react";

export interface BiasDetectiveData {
  type: "bias-detective";
  prompt: string;
  responseA: { text: string; isBiased: boolean; biasType?: string; explanation: string };
  responseB: { text: string; isBiased: boolean; biasType?: string; explanation: string };
  biasTypes?: string[];
  hint?: string;
}

const DEFAULT_BIAS_TYPES = [
  "Selection bias (cherry-picked examples)",
  "Framing bias (loaded language)",
  "Representation bias (omitted perspectives)",
  "Confirmation bias (one-sided conclusions)",
  "Cultural bias (assumes one worldview)",
];

type Choice = "A" | "B" | "equal" | null;
type Phase = "choosing" | "revealed";

export default function BiasDetective({ data }: { data: BiasDetectiveData }) {
  const [choice, setChoice] = useState<Choice>(null);
  const [biasType, setBiasType] = useState("");
  const [explanation, setExplanation] = useState("");
  const [phase, setPhase] = useState<Phase>("choosing");

  const biasedResponse = data.responseA.isBiased ? "A" : "B";
  const isCorrect =
    (choice === "A" && data.responseA.isBiased) ||
    (choice === "B" && data.responseB.isBiased) ||
    (choice === "equal" && !data.responseA.isBiased && !data.responseB.isBiased);

  const biasTypes = data.biasTypes ?? DEFAULT_BIAS_TYPES;

  function reset() {
    setChoice(null);
    setBiasType("");
    setExplanation("");
    setPhase("choosing");
  }

  return (
    <Card className="p-6 my-6 space-y-4" data-testid="activity-bias-detective">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <Search className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Bias Detective</h3>
        <Badge variant="secondary" className="text-xs">Spot the bias</Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        Same prompt. Two AI responses. One is more biased than the other.
        Read both carefully, then make your call — and explain your reasoning.
      </p>

      {/* Prompt display */}
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prompt given to AI</p>
        <div className="bg-muted/40 rounded-lg px-4 py-3 text-sm italic">"{data.prompt}"</div>
      </div>

      {/* Two response panels */}
      <div className="grid sm:grid-cols-2 gap-3">
        {(["A", "B"] as const).map(letter => {
          const resp = letter === "A" ? data.responseA : data.responseB;
          const isChosen = choice === letter;
          const isBiased = resp.isBiased;

          let borderClass = "border-2 border-muted";
          if (phase === "choosing" && isChosen) borderClass = "border-2 border-primary ring-2 ring-primary/20";
          if (phase === "revealed" && isBiased) borderClass = "border-2 border-red-500";
          if (phase === "revealed" && !isBiased) borderClass = "border-2 border-emerald-500";

          return (
            <div key={letter} className={`rounded-xl p-4 space-y-3 transition-all ${borderClass} bg-background`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg text-primary">Response {letter}</span>
                {phase === "revealed" && (
                  isBiased
                    ? <Badge className="bg-red-500/10 text-red-700 dark:text-red-300 border-red-300 text-xs">Biased</Badge>
                    : <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 text-xs">More balanced</Badge>
                )}
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{resp.text}</p>
              {phase === "revealed" && (
                <div className={`pt-2 border-t text-xs space-y-1 ${isBiased ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300"}`}>
                  {isBiased && resp.biasType && (
                    <p className="font-semibold">Type: {resp.biasType}</p>
                  )}
                  <p className="text-muted-foreground">{resp.explanation}</p>
                </div>
              )}
              {phase === "choosing" && (
                <button
                  onClick={() => setChoice(letter)}
                  className={`w-full text-sm py-2 rounded-lg border font-medium transition-all ${
                    isChosen
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-muted border-border"
                  }`}
                  data-testid={`button-choose-${letter}`}
                >
                  {isChosen ? "✓ Selected" : `This response is more biased`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Equal bias option */}
      {phase === "choosing" && (
        <button
          onClick={() => setChoice("equal")}
          className={`w-full text-sm py-2 rounded-lg border font-medium transition-all ${
            choice === "equal"
              ? "bg-primary/10 border-primary text-primary"
              : "hover:bg-muted border-dashed border-border text-muted-foreground"
          }`}
          data-testid="button-choose-equal"
        >
          <Scale className="inline h-4 w-4 mr-1" />
          Both are equally biased / balanced
        </button>
      )}

      {/* Bias type + explanation (before submit) */}
      {phase === "choosing" && choice && (
        <div className="space-y-3 border-t pt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">What type of bias did you notice?</Label>
            <div className="flex flex-wrap gap-2">
              {biasTypes.map(bt => (
                <button
                  key={bt}
                  onClick={() => setBiasType(bt === biasType ? "" : bt)}
                  className={`text-xs px-2 py-1 rounded-md border transition-all ${
                    biasType === bt
                      ? "bg-primary/10 border-primary text-primary"
                      : "hover:bg-muted border-border"
                  }`}
                  data-testid={`button-bias-type`}
                >
                  {bt}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium">Explain what you noticed (1–2 sentences):</Label>
            <Textarea
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              placeholder="I chose Response ___ because…"
              rows={2}
              className="text-sm resize-none"
              data-testid="textarea-bias-explanation"
            />
          </div>
          <Button
            onClick={() => setPhase("revealed")}
            disabled={!explanation.trim()}
            className="w-full"
            data-testid="button-reveal-bias"
          >
            <Eye className="h-4 w-4 mr-2" /> Reveal the analysis
          </Button>
        </div>
      )}

      {/* Result */}
      {phase === "revealed" && (
        <div className="rounded-xl bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            {isCorrect
              ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              : <AlertTriangle className="h-5 w-5 text-amber-500" />}
            <p className="font-semibold">
              {isCorrect
                ? `Correct! Response ${biasedResponse} was the more biased one.`
                : `Response ${biasedResponse} was the more biased one — ${choice === "equal" ? "they're not equally balanced" : `you chose ${choice}`}.`}
            </p>
          </div>

          {data.hint && (
            <div className="text-sm text-muted-foreground bg-background/60 rounded-lg p-3">
              <span className="font-medium text-foreground">Key lesson: </span>{data.hint}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Your explanation: </span>{explanation}
          </div>

          <p className="text-xs text-muted-foreground">
            Bias detective skills matter beyond school — biased AI outputs shape hiring decisions, loan approvals,
            news feeds, and medical diagnoses. The habit of asking "what perspective is missing?" protects you and others.
          </p>

          <Button variant="outline" onClick={reset} className="w-full" data-testid="button-retry-bias">
            <RotateCcw className="h-4 w-4 mr-2" /> Try again
          </Button>
        </div>
      )}
    </Card>
  );
}
