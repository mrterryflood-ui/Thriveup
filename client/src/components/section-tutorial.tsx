import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, ChevronDown, ChevronUp, Lightbulb, ArrowRight,
  CheckCircle2, Star, Eye, EyeOff
} from "lucide-react";

export interface TutorialStep {
  title: string;
  description: string;
  tip?: string;
}

export interface TutorialExample {
  title: string;
  scenario: string;
  outcome: string;
}

export interface SectionTutorialProps {
  sectionName: string;
  headline: string;
  description: string;
  steps: TutorialStep[];
  examples: TutorialExample[];
  tips?: string[];
  accentColor?: string;
}

export default function SectionTutorial({
  sectionName,
  headline,
  description,
  steps,
  examples,
  tips = [],
  accentColor = "blue",
}: SectionTutorialProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  const colorMap: Record<string, { bg: string; border: string; text: string; badge: string; step: string }> = {
    blue: { bg: "bg-blue-950/40", border: "border-blue-800/50", text: "text-blue-300", badge: "bg-blue-900/60 text-blue-200", step: "bg-blue-900/30 border-blue-800/40" },
    purple: { bg: "bg-purple-950/40", border: "border-purple-800/50", text: "text-purple-300", badge: "bg-purple-900/60 text-purple-200", step: "bg-purple-900/30 border-purple-800/40" },
    green: { bg: "bg-emerald-950/40", border: "border-emerald-800/50", text: "text-emerald-300", badge: "bg-emerald-900/60 text-emerald-200", step: "bg-emerald-900/30 border-emerald-800/40" },
    amber: { bg: "bg-amber-950/40", border: "border-amber-800/50", text: "text-amber-300", badge: "bg-amber-900/60 text-amber-200", step: "bg-amber-900/30 border-amber-800/40" },
    red: { bg: "bg-red-950/40", border: "border-red-800/50", text: "text-red-300", badge: "bg-red-900/60 text-red-200", step: "bg-red-900/30 border-red-800/40" },
    cyan: { bg: "bg-cyan-950/40", border: "border-cyan-800/50", text: "text-cyan-300", badge: "bg-cyan-900/60 text-cyan-200", step: "bg-cyan-900/30 border-cyan-800/40" },
    orange: { bg: "bg-orange-950/40", border: "border-orange-800/50", text: "text-orange-300", badge: "bg-orange-900/60 text-orange-200", step: "bg-orange-900/30 border-orange-800/40" },
    rose: { bg: "bg-rose-950/40", border: "border-rose-800/50", text: "text-rose-300", badge: "bg-rose-900/60 text-rose-200", step: "bg-rose-900/30 border-rose-800/40" },
    teal: { bg: "bg-teal-950/40", border: "border-teal-800/50", text: "text-teal-300", badge: "bg-teal-900/60 text-teal-200", step: "bg-teal-900/30 border-teal-800/40" },
  };

  const colors = colorMap[accentColor] || colorMap.blue;

  return (
    <Card className={`${colors.bg} border ${colors.border} mb-6`} data-testid={`tutorial-${sectionName}`}>
      <div
        className="flex items-center justify-between p-4 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
        data-testid={`tutorial-toggle-${sectionName}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors.badge}`}>
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${colors.text}`}>{headline}</span>
              <Badge variant="outline" className={`text-[10px] ${colors.badge} border-0`}>
                Tutorial
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          <div className="space-y-2">
            <h4 className={`text-xs font-semibold uppercase tracking-wider ${colors.text}`}>
              Step-by-Step Guide
            </h4>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className={`flex gap-3 p-3 rounded-lg border ${colors.step}`}>
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full ${colors.badge} flex items-center justify-center text-xs font-bold`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{step.title}</p>
                    <p className="text-xs text-slate-300 mt-0.5">{step.description}</p>
                    {step.tip && (
                      <div className="flex items-start gap-1.5 mt-1.5">
                        <Lightbulb className="w-3 h-3 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-yellow-300/80 italic">{step.tip}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setShowExamples(!showExamples); }}
              className={`text-xs ${colors.text} hover:text-white gap-1.5 px-0`}
              data-testid={`tutorial-examples-toggle-${sectionName}`}
            >
              {showExamples ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showExamples ? "Hide" : "Show"} Real Examples ({examples.length})
            </Button>

            {showExamples && (
              <div className="mt-2 space-y-2">
                {examples.map((ex, i) => (
                  <div key={i} className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="text-sm font-medium text-white">{ex.title}</span>
                    </div>
                    <p className="text-xs text-slate-300 mb-2">{ex.scenario}</p>
                    <div className="flex items-start gap-1.5">
                      <ArrowRight className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-300">{ex.outcome}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {tips.length > 0 && (
            <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/40">
              <h4 className="text-xs font-semibold text-yellow-400 mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" /> Pro Tips
              </h4>
              <ul className="space-y-1.5">
                {tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
