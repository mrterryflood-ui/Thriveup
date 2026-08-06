/**
 * EngineSelector — lets users choose which AI engine powers their experience.
 * Preference is saved to localStorage and applied to all AI calls site-wide.
 * This is the user's right to control their own AI experience — not a setting
 * buried in a menu, but a first-class control available wherever AI is used.
 */
import { useState, useEffect } from "react";
import { Cpu, ChevronDown, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface EngineOption {
  id: string;          // provider id sent to server
  label: string;       // display name
  description: string; // plain-language what it's good for
  badge?: string;      // e.g. "Reasoning", "Fast", "Web-aware"
  badgeColor?: string;
}

export const ENGINE_OPTIONS: EngineOption[] = [
  {
    id: "auto",
    label: "Auto (recommended)",
    description: "The platform picks the best available engine for your question — usually the fastest high-quality option.",
    badge: "Default",
    badgeColor: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  {
    id: "openrouter-claude",
    label: "Claude (Anthropic)",
    description: "Excellent at nuanced writing, grant narratives, and complex multi-step reasoning. Best for drafts and analysis.",
    badge: "Narrative",
    badgeColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  },
  {
    id: "replit-ai-integrations",
    label: "GPT (OpenAI)",
    description: "Broad general knowledge, fast responses, strong at structured data, summaries, and Q&A.",
    badge: "Fast",
    badgeColor: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
  {
    id: "deepseek-r1",
    label: "DeepSeek R1",
    description: "Step-by-step logical reasoning. Best for eligibility analysis, compliance checks, and budget math.",
    badge: "Reasoning",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  {
    id: "gemini",
    label: "Gemini (Google)",
    description: "Google's multimodal model. Good at summarization, document understanding, and research synthesis.",
    badge: "Research",
    badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  },
  {
    id: "perplexity",
    label: "Perplexity Sonar",
    description: "Live web search built in. Best when you need current grant deadlines, news, or real-time information.",
    badge: "Web-aware",
    badgeColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  },
];

export const PREFERRED_ENGINE_KEY = "tcaf_preferred_engine";

export function getPreferredEngine(): string {
  try { return localStorage.getItem(PREFERRED_ENGINE_KEY) || "auto"; } catch { return "auto"; }
}

export function setPreferredEngine(id: string): void {
  try { localStorage.setItem(PREFERRED_ENGINE_KEY, id); } catch {}
}

interface EngineSelectorProps {
  value?: string;
  onChange?: (engineId: string) => void;
  compact?: boolean;   // show only icon + name, no description
  className?: string;
}

export function EngineSelector({ value, onChange, compact = false, className = "" }: EngineSelectorProps) {
  const [selected, setSelected] = useState<string>(value ?? getPreferredEngine());

  useEffect(() => {
    if (value !== undefined) setSelected(value);
  }, [value]);

  const current = ENGINE_OPTIONS.find(e => e.id === selected) ?? ENGINE_OPTIONS[0];

  function choose(id: string) {
    setSelected(id);
    setPreferredEngine(id);
    onChange?.(id);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-1.5 font-normal ${className}`}
          data-testid="engine-selector-trigger"
        >
          <Cpu className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate max-w-[120px]">{current.label}</span>
          {current.badge && !compact && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${current.badgeColor}`}>
              {current.badge}
            </span>
          )}
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <Cpu className="h-3 w-3" />
          Choose your AI engine
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 cursor-help ml-auto opacity-50" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              Your choice is saved and used for all AI advisor and grant search responses. You can change it anytime.
            </TooltipContent>
          </Tooltip>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ENGINE_OPTIONS.map(opt => (
          <DropdownMenuItem
            key={opt.id}
            onClick={() => choose(opt.id)}
            className="flex items-start gap-2 py-2.5 cursor-pointer"
            data-testid={`engine-option-${opt.id}`}
          >
            <CheckCircle2
              className={`h-4 w-4 shrink-0 mt-0.5 transition-opacity ${selected === opt.id ? "text-emerald-500 opacity-100" : "opacity-0"}`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{opt.label}</span>
                {opt.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${opt.badgeColor}`}>
                    {opt.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{opt.description}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
