/**
 * AiOrHuman — Classify text samples as AI-generated or human-written.
 *
 * Shows N text samples one at a time. Student clicks "AI" or "Human".
 * Immediate feedback + explanation of the telltale signs.
 * Final score card with replay.
 *
 * Teaches students to recognize patterns in AI-generated text:
 * hedging language, lack of specificity, formulaic structure,
 * perfect grammar, and absence of personal voice.
 */
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bot, User, CheckCircle2, X, RotateCcw, Trophy, ChevronRight,
} from "lucide-react";

export interface AiOrHumanData {
  type: "ai-or-human";
  samples: {
    text: string;
    isAI: boolean;
    explanation: string;
    aiClues?: string[];
    humanClues?: string[];
  }[];
  instructions?: string;
}

type Answer = "ai" | "human" | null;

export default function AiOrHuman({ data }: { data: AiOrHumanData }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>(Array(data.samples.length).fill(null));
  const [showFeedback, setShowFeedback] = useState(false);
  const [done, setDone] = useState(false);

  const sample = data.samples[current];
  const answer = answers[current];
  const score = answers.filter((a, i) => a !== null && ((a === "ai") === data.samples[i].isAI)).length;

  function choose(choice: "ai" | "human") {
    if (showFeedback) return;
    const next = [...answers];
    next[current] = choice;
    setAnswers(next);
    setShowFeedback(true);
  }

  function advance() {
    if (current < data.samples.length - 1) {
      setCurrent(c => c + 1);
      setShowFeedback(false);
    } else {
      setDone(true);
    }
  }

  function reset() {
    setCurrent(0);
    setAnswers(Array(data.samples.length).fill(null));
    setShowFeedback(false);
    setDone(false);
  }

  if (done) {
    const pct = Math.round((score / data.samples.length) * 100);
    return (
      <Card className="p-6 my-6 space-y-5" data-testid="activity-ai-or-human-done">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-lg">Results</h3>
        </div>

        <div className="text-center py-4 space-y-2">
          <div className="text-5xl font-black text-primary">{pct}%</div>
          <p className="text-lg font-semibold">{score} of {data.samples.length} correct</p>
          <p className="text-sm text-muted-foreground">
            {pct >= 80
              ? "Sharp eye. You can spot AI patterns that most people miss."
              : pct >= 60
              ? "Not bad — AI writing is designed to sound human. Keep practicing."
              : "AI is getting harder to detect. Focus on the clue patterns below."}
          </p>
        </div>

        {/* Per-sample review */}
        <div className="space-y-3">
          <p className="text-sm font-semibold">Review:</p>
          {data.samples.map((s, i) => {
            const a = answers[i];
            const correct = a !== null && ((a === "ai") === s.isAI);
            return (
              <div
                key={i}
                className={`rounded-lg border p-3 text-sm space-y-1 ${
                  correct ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20" : "border-red-300 bg-red-50 dark:bg-red-950/20"
                }`}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {correct
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    : <X className="h-4 w-4 text-red-500 shrink-0" />}
                  <span className="font-medium">Sample {i + 1}:</span>
                  <Badge variant="outline" className="text-xs">
                    {s.isAI ? <><Bot className="h-3 w-3 mr-1 inline" />AI-generated</> : <><User className="h-3 w-3 mr-1 inline" />Human-written</>}
                  </Badge>
                  <span className="text-xs text-muted-foreground">You said: {a === "ai" ? "AI" : "Human"}</span>
                </div>
                <p className="text-xs text-muted-foreground">{s.explanation}</p>
              </div>
            );
          })}
        </div>

        <Button variant="outline" onClick={reset} className="w-full" data-testid="button-retry-ai-or-human">
          <RotateCcw className="h-4 w-4 mr-2" /> Play again
        </Button>
      </Card>
    );
  }

  const isCorrect = answer !== null && ((answer === "ai") === sample.isAI);
  const clues = sample.isAI ? (sample.aiClues ?? []) : (sample.humanClues ?? []);

  return (
    <Card className="p-6 my-6 space-y-4" data-testid="activity-ai-or-human">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <Bot className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">AI or Human?</h3>
        <Badge variant="secondary" className="text-xs">
          {current + 1}/{data.samples.length}
        </Badge>
        {answers.filter(a => a !== null).length > 0 && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {score} correct so far
          </Badge>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {data.instructions ?? "Read carefully. Was this written by an AI or a human? Look for hedging language, perfect grammar, lack of personal specifics, and formulaic structure — common AI tells."}
      </p>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-1.5">
        <div
          className="bg-primary h-1.5 rounded-full transition-all"
          style={{ width: `${((current) / data.samples.length) * 100}%` }}
        />
      </div>

      {/* Text sample */}
      <div className="bg-muted/20 border-2 rounded-xl p-5 text-sm leading-relaxed whitespace-pre-wrap min-h-[120px]" data-testid="text-sample">
        {sample.text}
      </div>

      {/* Choice buttons */}
      {!showFeedback ? (
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => choose("ai")}
            variant="outline"
            className="h-14 text-base border-2 hover:border-primary hover:bg-primary/5 hover:text-primary"
            data-testid="button-choose-ai"
          >
            <Bot className="h-5 w-5 mr-2" /> AI-generated
          </Button>
          <Button
            onClick={() => choose("human")}
            variant="outline"
            className="h-14 text-base border-2 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-700 dark:hover:text-emerald-300"
            data-testid="button-choose-human"
          >
            <User className="h-5 w-5 mr-2" /> Human-written
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Feedback */}
          <div className={`rounded-xl p-4 space-y-2 ${
            isCorrect
              ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300"
              : "bg-red-50 dark:bg-red-950/30 border border-red-300"
          }`}>
            <div className="flex items-center gap-2">
              {isCorrect
                ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                : <X className="h-5 w-5 text-red-500" />}
              <p className="font-semibold text-sm">
                {isCorrect ? "Correct! " : "Not quite — "}
                This was {sample.isAI ? "AI-generated" : "human-written"}.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">{sample.explanation}</p>
            {clues.length > 0 && (
              <div className="pt-1">
                <p className="text-xs font-semibold mb-1">
                  {sample.isAI ? "AI tells in this text:" : "Human signals in this text:"}
                </p>
                <ul className="space-y-0.5">
                  {clues.map((clue, j) => (
                    <li key={j} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">•</span> {clue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <Button onClick={advance} className="w-full" data-testid="button-next-sample">
            {current < data.samples.length - 1 ? (
              <>Next sample <ChevronRight className="h-4 w-4 ml-1" /></>
            ) : (
              <>See results <Trophy className="h-4 w-4 ml-1" /></>
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}
