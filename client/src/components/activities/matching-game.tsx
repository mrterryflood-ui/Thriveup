import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RotateCcw, CheckCircle2, ArrowRight } from "lucide-react";

interface MatchingData {
  type: "matching";
  pairs: { left: string; right: string }[];
  instructions: string;
}

export default function MatchingGame({ data }: { data: MatchingData }) {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrongPair, setWrongPair] = useState<{ left: number; right: number } | null>(null);
  const [shuffledRight, setShuffledRight] = useState<number[]>(() =>
    Array.from({ length: data.pairs.length }, (_, i) => i).sort(() => Math.random() - 0.5)
  );

  const allMatched = matched.size === data.pairs.length;

  const handleLeftClick = useCallback((index: number) => {
    if (matched.has(index)) return;
    setSelectedLeft(index);
    setWrongPair(null);
  }, [matched]);

  const handleRightClick = useCallback((originalIndex: number) => {
    if (selectedLeft === null || matched.has(originalIndex)) return;

    if (selectedLeft === originalIndex) {
      setMatched(prev => { const next = new Set(prev); next.add(originalIndex); return next; });
      setSelectedLeft(null);
      setWrongPair(null);
    } else {
      setWrongPair({ left: selectedLeft, right: originalIndex });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedLeft(null);
      }, 800);
    }
  }, [selectedLeft, matched]);

  function reset() {
    setSelectedLeft(null);
    setMatched(new Set());
    setWrongPair(null);
    setShuffledRight(Array.from({ length: data.pairs.length }, (_, i) => i).sort(() => Math.random() - 0.5));
  }

  return (
    <Card className="p-6 my-6" data-testid="activity-matching">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Matching Game</h3>
        <Badge variant="secondary" className="text-xs">{matched.size}/{data.pairs.length} matched</Badge>
      </div>

      <p className="text-sm text-muted-foreground mb-5">{data.instructions}</p>

      {allMatched ? (
        <div className="text-center py-8">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
          <p className="font-bold text-lg mb-1">Perfect! All matched!</p>
          <p className="text-sm text-muted-foreground mb-4">You matched all {data.pairs.length} pairs correctly!</p>
          <Button variant="outline" size="sm" onClick={reset} data-testid="button-play-again-matching">
            <RotateCcw className="mr-1 h-4 w-4" /> Play Again
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            {data.pairs.map((pair, i) => {
              const isMatched = matched.has(i);
              const isSelected = selectedLeft === i;
              const isWrong = wrongPair?.left === i;
              return (
                <button
                  key={`left-${i}`}
                  onClick={() => handleLeftClick(i)}
                  disabled={isMatched}
                  className={`w-full text-left p-3 rounded-md border text-sm transition-all ${
                    isMatched
                      ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 opacity-60"
                      : isWrong
                      ? "bg-destructive/10 border-destructive/40"
                      : isSelected
                      ? "bg-primary/10 border-primary ring-2 ring-primary/20"
                      : "hover-elevate"
                  }`}
                  data-testid={`button-match-left-${i}`}
                >
                  <span className="font-medium">{pair.left}</span>
                  {isMatched && <CheckCircle2 className="inline-block ml-2 h-4 w-4 text-emerald-500" />}
                </button>
              );
            })}
          </div>
          <div className="space-y-2">
            {shuffledRight.map((originalIndex) => {
              const pair = data.pairs[originalIndex];
              const isMatched = matched.has(originalIndex);
              const isWrong = wrongPair?.right === originalIndex;
              return (
                <button
                  key={`right-${originalIndex}`}
                  onClick={() => handleRightClick(originalIndex)}
                  disabled={isMatched}
                  className={`w-full text-left p-3 rounded-md border text-sm transition-all ${
                    isMatched
                      ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 opacity-60"
                      : isWrong
                      ? "bg-destructive/10 border-destructive/40"
                      : selectedLeft !== null
                      ? "hover-elevate cursor-pointer"
                      : "opacity-70"
                  }`}
                  data-testid={`button-match-right-${originalIndex}`}
                >
                  <span>{pair.right}</span>
                  {isMatched && <CheckCircle2 className="inline-block ml-2 h-4 w-4 text-emerald-500" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
