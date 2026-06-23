/**
 * PromptLab — Live prompt engineering sandbox for AI literacy lessons.
 *
 * Modes:
 *   basic  — freeform textarea, send to AI, see response, iterate
 *   craft  — structured CRAFT fields (Context / Role / Action / Format / Tone)
 *            that assemble into one prompt; student can toggle view
 *
 * Completion gate: student must send at least minPrompts (default 3) prompts.
 */
import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Send, RotateCcw, Sparkles, Bot, User,
  ChevronDown, ChevronUp, CheckCircle2, Lightbulb, Copy,
} from "lucide-react";

export interface PromptLabData {
  type: "prompt-lab";
  mode?: "basic" | "craft";
  systemPrompt?: string;
  starterPrompt?: string;
  challengePrompts?: string[];
  targetOutputHint?: string;
  minPrompts?: number;
  lessonContext?: string;
}

interface Turn {
  prompt: string;
  response: string;
  timestamp: Date;
}

const CRAFT_LABELS: { key: string; label: string; placeholder: string; desc: string }[] = [
  { key: "context", label: "Context", placeholder: "Background info the AI needs to know…", desc: "Set the scene — who, what, why" },
  { key: "role", label: "Role", placeholder: "Act as a [type of expert]…", desc: "What persona should the AI adopt?" },
  { key: "action", label: "Action", placeholder: "Write / Explain / Summarize / Compare…", desc: "The specific task you want done" },
  { key: "format", label: "Format", placeholder: "bullet list, 3 paragraphs, table…", desc: "How should the output look?" },
  { key: "tone", label: "Tone", placeholder: "friendly, academic, plain English…", desc: "Voice and register of the response" },
];

function assembleCRAFT(fields: Record<string, string>): string {
  const parts: string[] = [];
  if (fields.context) parts.push(`Context: ${fields.context}`);
  if (fields.role) parts.push(`You are: ${fields.role}`);
  if (fields.action) parts.push(`Task: ${fields.action}`);
  if (fields.format) parts.push(`Format: ${fields.format}`);
  if (fields.tone) parts.push(`Tone: ${fields.tone}`);
  return parts.join("\n");
}

export default function PromptLab({ data }: { data: PromptLabData }) {
  const mode = data.mode ?? "basic";
  const minPrompts = data.minPrompts ?? 3;

  const [prompt, setPrompt] = useState(data.starterPrompt ?? "");
  const [craftFields, setCraftFields] = useState<Record<string, string>>({
    context: "", role: "", action: "", format: "", tone: "",
  });
  const [craftPreviewOpen, setCraftPreviewOpen] = useState(false);
  const [history, setHistory] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeChallengeIdx, setActiveChallengeIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const done = history.length >= minPrompts;
  const activePrompt = mode === "craft" ? assembleCRAFT(craftFields) : prompt;

  async function sendPrompt() {
    const p = activePrompt.trim();
    if (!p || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/lesson-lab/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p, systemPrompt: data.systemPrompt }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `Server error ${res.status}`);
      }
      const j = await res.json();
      setHistory(prev => [...prev, { prompt: p, response: j.response, timestamp: new Date() }]);
      if (mode === "basic") setPrompt("");
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (e: any) {
      setError(e.message ?? "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function loadChallenge(idx: number) {
    const cp = data.challengePrompts?.[idx];
    if (!cp) return;
    setActiveChallengeIdx(idx);
    if (mode === "basic") setPrompt(cp);
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <Card className="p-6 my-6 space-y-4" data-testid="activity-prompt-lab">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <Bot className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Prompt Engineering Lab</h3>
        <Badge variant="secondary" className="text-xs">
          {history.length}/{minPrompts} prompts sent
        </Badge>
        {done && (
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs border-emerald-300">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Lab complete
          </Badge>
        )}
      </div>

      {/* System prompt display */}
      {data.systemPrompt && (
        <div className="text-xs bg-muted/40 rounded-lg px-3 py-2 font-mono text-muted-foreground border-l-2 border-primary/40">
          <span className="font-semibold text-foreground/70">System prompt: </span>
          {data.systemPrompt}
        </div>
      )}

      {/* Lesson context hint */}
      {data.targetOutputHint && (
        <div className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 rounded-lg px-3 py-2">
          <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{data.targetOutputHint}</span>
        </div>
      )}

      {/* Challenge prompts */}
      {data.challengePrompts && data.challengePrompts.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Try these challenge prompts:</p>
          <div className="flex flex-wrap gap-2">
            {data.challengePrompts.map((cp, i) => (
              <button
                key={i}
                onClick={() => loadChallenge(i)}
                className={`text-xs px-2 py-1 rounded-md border transition-all ${
                  activeChallengeIdx === i
                    ? "bg-primary/10 border-primary text-primary"
                    : "hover:bg-muted border-border"
                }`}
                data-testid={`button-challenge-${i}`}
              >
                #{i + 1} {cp.slice(0, 40)}{cp.length > 40 ? "…" : ""}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversation history */}
      {history.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {history.map((turn, i) => (
            <div key={i} className="space-y-2">
              {/* User turn */}
              <div className="flex items-start gap-2 justify-end">
                <div className="bg-primary/10 rounded-xl rounded-tr-sm px-3 py-2 text-sm max-w-[85%]">
                  <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                    <User className="h-3 w-3" /> You
                  </p>
                  <pre className="whitespace-pre-wrap font-sans text-sm">{turn.prompt}</pre>
                </div>
              </div>
              {/* AI turn */}
              <div className="flex items-start gap-2">
                <div className="bg-muted rounded-xl rounded-tl-sm px-3 py-2 text-sm max-w-[90%] relative group">
                  <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <Bot className="h-3 w-3" /> AI Response
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{turn.response}</p>
                  <button
                    onClick={() => copyText(turn.response, `resp-${i}`)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted-foreground/20"
                    title="Copy response"
                  >
                    {copied === `resp-${i}` ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input area */}
      <div className="space-y-3 border-t pt-4">
        {mode === "craft" ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-medium">Fill in the CRAFT elements to build your prompt:</p>
            {CRAFT_LABELS.map(({ key, label, placeholder, desc }) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs flex items-center gap-1.5">
                  <span className="font-bold text-primary">{label[0]}</span>
                  <span className="font-medium">{label}</span>
                  <span className="text-muted-foreground font-normal">— {desc}</span>
                </Label>
                <Input
                  value={craftFields[key] ?? ""}
                  onChange={e => setCraftFields(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="text-sm"
                  data-testid={`input-craft-${key}`}
                />
              </div>
            ))}
            {/* Assembled preview */}
            <button
              onClick={() => setCraftPreviewOpen(v => !v)}
              className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {craftPreviewOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Preview assembled prompt
            </button>
            {craftPreviewOpen && (
              <pre className="text-xs bg-muted/50 rounded-lg p-3 whitespace-pre-wrap font-mono border">
                {activePrompt || "(fill in CRAFT fields above)"}
              </pre>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Your prompt</Label>
            <Textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Write your prompt here. Be specific — tell the AI who it is, what you want, and how you want it formatted."
              rows={4}
              className="text-sm resize-none"
              data-testid="textarea-prompt"
              onKeyDown={e => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendPrompt();
              }}
            />
            <p className="text-xs text-muted-foreground">{prompt.length} chars · Ctrl+Enter to send</p>
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex items-center gap-2">
          <Button
            onClick={sendPrompt}
            disabled={!activePrompt.trim() || loading}
            className="flex-1 sm:flex-none"
            data-testid="button-send-prompt"
          >
            {loading ? (
              <><span className="animate-pulse">Thinking…</span></>
            ) : (
              <><Send className="h-4 w-4 mr-1.5" /> Send to AI</>
            )}
          </Button>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setHistory([]); setPrompt(data.starterPrompt ?? ""); }}
              data-testid="button-clear-lab"
            >
              <RotateCcw className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
        </div>

        {!done && history.length > 0 && (
          <p className="text-xs text-muted-foreground">
            <Sparkles className="inline h-3 w-3 mr-1 text-primary" />
            Good start! Iterate — try a different approach or refine your prompt.
            {minPrompts - history.length} more {minPrompts - history.length === 1 ? "send" : "sends"} to complete this activity.
          </p>
        )}
        {done && (
          <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            You've sent {history.length} prompts — lab complete! Reflect on what made your best prompt effective.
          </div>
        )}
      </div>
    </Card>
  );
}
