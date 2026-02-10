import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, RotateCcw, CheckCircle2 } from "lucide-react";

interface EmotionCheckData {
  type: "emotion_check";
  emotions: string[];
  prompt: string;
  followUp?: string;
}

const EMOTION_COLORS: Record<string, string> = {
  "Happy": "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700",
  "Sad": "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700",
  "Angry": "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700",
  "Scared": "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700",
  "Calm": "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700",
  "Excited": "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700",
  "Worried": "bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700",
  "Proud": "bg-teal-100 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700",
  "Confident": "bg-sky-100 dark:bg-sky-900/30 border-sky-300 dark:border-sky-700",
  "Uncertain": "bg-slate-100 dark:bg-slate-900/30 border-slate-300 dark:border-slate-700",
  "Curious": "bg-cyan-100 dark:bg-cyan-900/30 border-cyan-300 dark:border-cyan-700",
  "Anxious": "bg-rose-100 dark:bg-rose-900/30 border-rose-300 dark:border-rose-700",
  "Hopeful": "bg-lime-100 dark:bg-lime-900/30 border-lime-300 dark:border-lime-700",
  "Overwhelmed": "bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700",
  "Determined": "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700",
  "Confused": "bg-gray-100 dark:bg-gray-900/30 border-gray-300 dark:border-gray-700",
};

const EMOTION_ICONS: Record<string, string> = {
  "Happy": "sun",
  "Sad": "cloud-rain",
  "Angry": "cloud-lightning",
  "Scared": "shield-alert",
  "Calm": "waves",
  "Excited": "zap",
  "Worried": "cloud",
  "Proud": "trophy",
};

function getEmotionColor(emotion: string): string {
  for (const [key, value] of Object.entries(EMOTION_COLORS)) {
    if (emotion.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return "bg-muted/50 border-muted-foreground/20";
}

export default function EmotionCheck({ data }: { data: EmotionCheckData }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);

  function handleSelect(emotion: string) {
    setSelected(emotion);
    setTimeout(() => setShowFollowUp(true), 500);
  }

  function reset() {
    setSelected(null);
    setShowFollowUp(false);
  }

  return (
    <Card className="p-6 my-6" data-testid="activity-emotion-check">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Heart className="h-5 w-5 text-pink-500" />
        <h3 className="font-semibold text-lg">Feelings Check-In</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-6">{data.prompt}</p>

      {showFollowUp && selected ? (
        <div className="text-center py-6">
          <div className={`inline-block p-4 rounded-full mb-4 ${getEmotionColor(selected)}`}>
            <Heart className="h-8 w-8" />
          </div>
          <p className="font-bold text-lg mb-2">You're feeling: {selected}</p>
          {data.followUp && (
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">{data.followUp}</p>
          )}
          <div className="p-4 rounded-md bg-primary/5 max-w-md mx-auto mb-4">
            <p className="text-sm">
              Remember: There are no wrong feelings. Every feeling is trying to tell you something important. You are brave for checking in with yourself.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={reset} data-testid="button-check-in-again">
            <RotateCcw className="mr-1 h-4 w-4" /> Check In Again
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {data.emotions.map((emotion) => (
            <button
              key={emotion}
              onClick={() => handleSelect(emotion)}
              className={`p-4 rounded-md border-2 text-center transition-all hover-elevate ${
                selected === emotion
                  ? `${getEmotionColor(emotion)} ring-2 ring-primary/20`
                  : "border-muted-foreground/10"
              }`}
              data-testid={`button-emotion-${emotion.replace(/\s/g, '-').toLowerCase()}`}
            >
              <Heart className="h-5 w-5 mx-auto mb-2 text-pink-400" />
              <span className="text-sm font-medium block">{emotion}</span>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
