import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { ArrowRight, Check, CornerDownRight, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import {
  WORKSPACES,
  WORKSPACE_TASKS,
  canUseTask,
  inferNavigation,
  type WorkspaceId,
  type WorkspaceTask,
} from "@shared/workspace-catalog";
import { useWorkspace, useWorkspaceAccess } from "@/lib/workspace-context";

type Decision = ReturnType<typeof inferNavigation>;

export function GuidedStart({ workspace }: { workspace?: WorkspaceId }) {
  const { setWorkspace } = useWorkspace();
  const viewer = useWorkspaceAccess();
  const [input, setInput] = useState("");
  const [decision, setDecision] = useState<Decision | null>(null);
  const [chosenTaskId, setChosenTaskId] = useState<string | null>(null);
  const scopeKey = workspace ?? "all";

  useEffect(() => {
    setInput("");
    setDecision(null);
    setChosenTaskId(null);
  }, [scopeKey]);

  const taskById = useMemo(() => new Map(WORKSPACE_TASKS.map((task) => [task.id, task])), []);
  const suggestedTasks = (decision?.taskIds ?? [])
    .map((id) => taskById.get(id))
    .filter((task): task is WorkspaceTask => Boolean(task));
  const usableTasks = suggestedTasks.filter((task) => canUseTask(task, viewer));
  const hasRestrictedSuggestions = suggestedTasks.length > usableTasks.length;
  const chosenTask = chosenTaskId ? taskById.get(chosenTaskId) : undefined;
  const canOpenChosenTask = Boolean(chosenTask && canUseTask(chosenTask, viewer));
  const publicFallbacks = WORKSPACE_TASKS.filter(
    (task) => task.access === "public" && task.primary && (!workspace || task.workspace === workspace),
  );
  const fallbacks = publicFallbacks.length
    ? publicFallbacks
    : WORKSPACE_TASKS.filter((task) => task.access === "public" && task.primary).slice(0, 3);

  function findNextStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = inferNavigation(input, workspace);
    setDecision(result);
    setChosenTaskId(null);
  }

  function clearConversation() {
    setInput("");
    setDecision(null);
    setChosenTaskId(null);
  }

  return (
    <section
      aria-labelledby="guided-start-title"
      className="overflow-hidden rounded-[1.75rem] border border-[#cfdbd6] bg-[#fbfaf6] shadow-[0_24px_70px_-48px_rgba(27,60,55,.45)]"
      data-testid="guided-start"
    >
      <div className="grid md:grid-cols-[.82fr_1.18fr]">
        <div className="relative flex flex-col justify-between overflow-hidden bg-[#174b45] p-6 text-[#f8f5e9] sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-14 h-52 w-52 rounded-full border border-[#f3c866]/25" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-2 top-0 h-40 w-40 rounded-full border border-[#f3c866]/20" />
          <div className="relative">
            <div className="mb-7 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3c866] text-[#173c38]">
              <Sparkles aria-hidden="true" size={19} />
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[.18em] text-[#cfe0d9]">Optional · guided start</p>
            <h2 id="guided-start-title" className="max-w-xs font-[var(--font-display)] text-3xl leading-[1.08] tracking-[-.035em] sm:text-[2.5rem]">
              Start with what you need.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#d9e6e0]">
              Describe a goal in a sentence. We’ll suggest a place to begin from the product’s task catalog.
            </p>
          </div>
          <div className="relative mt-8 flex items-start gap-2.5 border-t border-white/15 pt-4 text-xs leading-5 text-[#cfe0d9]">
            <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-[#f3c866]" size={15} />
            <span>Your words stay in this page only. They are not saved, added to a link, or sent to a service.</span>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <form onSubmit={findNextStep}>
            <label htmlFor="guided-start-input" className="mb-2 block text-sm font-semibold text-[#203b38]">
              What would you like to do?
            </label>
            <textarea
              id="guided-start-input"
              value={input}
              onChange={(event) => { setInput(event.target.value.slice(0, 600)); setDecision(null); setChosenTaskId(null); }}
              maxLength={600}
              rows={3}
              placeholder="For example: I’m looking for help with rent."
              className="w-full resize-y rounded-xl border border-[#cbd8d2] bg-white px-4 py-3 text-sm leading-6 text-[#233b37] outline-none transition placeholder:text-[#82918a] focus:border-[#24756b] focus:ring-2 focus:ring-[#24756b]/20"
              aria-describedby="guided-start-note"
              data-testid="guided-start-input"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <p id="guided-start-note" className="text-xs text-[#667a73]">Keep it general. Do not include sensitive personal details.</p>
              <button
                type="submit"
                disabled={!input.trim()}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#174b45] px-4 text-sm font-semibold text-white transition hover:bg-[#21655c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174b45] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
                data-testid="guided-start-submit"
              >
                Find a next step <ArrowRight aria-hidden="true" size={16} />
              </button>
            </div>
          </form>

          {decision && (
            <div className="mt-6 border-t border-[#e0e7e2] pt-5" aria-live="polite" data-testid="guided-start-result">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#5d766d]">
                    {decision.status === "suggested" ? "A possible next step" : decision.status === "clarify" ? "Let’s narrow it down" : "No direct match"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#29443e]">{decision.reason}</p>
                </div>
                <button
                  type="button"
                  onClick={clearConversation}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-[#536c64] hover:bg-[#edf2ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24756b]"
                  aria-label="Clear and start over"
                  data-testid="guided-start-clear"
                >
                  <RotateCcw aria-hidden="true" size={14} /> Start over
                </button>
              </div>

              {decision.question && (
                <p className="mt-3 rounded-lg bg-[#f0f4ef] px-3.5 py-3 text-sm font-medium leading-5 text-[#29443e]">{decision.question}</p>
              )}

              {hasRestrictedSuggestions && (
                <p className="mt-3 rounded-lg border border-[#ead9ad] bg-[#fff8e8] px-3.5 py-3 text-xs leading-5 text-[#68552c]" data-testid="guided-start-restricted">
                  Some matching workflows require existing authorization, so they are not shown as destinations here. Choosing a workspace does not grant access.
                </p>
              )}

              {usableTasks.length > 0 && (
                <div className="mt-4 grid gap-2">
                  {usableTasks.map((task) => {
                    const active = chosenTaskId === task.id;
                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => setChosenTaskId(task.id)}
                        aria-pressed={active}
                        className={`flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24756b] ${active ? "border-[#24756b] bg-[#edf5ef]" : "border-[#dde5df] bg-white hover:border-[#9cb9ad] hover:bg-[#f5f8f4]"}`}
                        data-testid={`guided-start-choice-${task.id}`}
                      >
                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${active ? "border-[#24756b] bg-[#24756b] text-white" : "border-[#b8c7bf] text-transparent"}`}>
                          <Check aria-hidden="true" size={12} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-[#203b38]">{task.label}</span>
                          <span className="mt-0.5 block text-xs leading-5 text-[#657a71]">{task.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {chosenTask && canOpenChosenTask && (
                <div className="mt-4 rounded-xl border border-[#cbded3] bg-[#f5f8f4] p-4" data-testid="guided-start-confirmation">
                  <div className="flex items-start gap-2">
                    <CornerDownRight aria-hidden="true" className="mt-0.5 shrink-0 text-[#357b6e]" size={16} />
                    <div>
                      <p className="text-sm font-semibold text-[#203b38]">{chosenTask.label}</p>
                      <p className="mt-1 text-xs leading-5 text-[#5b7168]">{chosenTask.nextStep}</p>
                    </div>
                  </div>
                  <Link
                    href={chosenTask.href}
                    onClick={() => setWorkspace(chosenTask.workspace)}
                    className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#174b45] px-4 text-sm font-semibold text-white transition hover:bg-[#21655c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174b45] focus-visible:ring-offset-2"
                    data-testid="guided-start-continue"
                  >
                    Continue to this task <ArrowRight aria-hidden="true" size={15} />
                  </Link>
                </div>
              )}

              {decision.status === "unknown" || usableTasks.length === 0 ? (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[.12em] text-[#5d766d]">Or choose a public starting point</p>
                  <div className="flex flex-wrap gap-2">
                    {fallbacks.slice(0, 3).map((task) => (
                      <Link
                        key={task.id}
                        href={task.href}
                        onClick={() => setWorkspace(task.workspace)}
                        className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#cad8d0] bg-white px-3 py-2 text-xs font-semibold text-[#29443e] hover:bg-[#f0f4ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24756b]"
                        data-testid={`guided-start-fallback-${task.id}`}
                      >
                        {task.label} <ArrowRight aria-hidden="true" size={13} />
                      </Link>
                    ))}
                  </div>
                  <Link href="/navigator" onClick={() => setWorkspace("residents")} className="mt-3 inline-flex min-h-11 items-center text-sm underline" aria-label="Open AI Navigator for a broader conversation" data-testid="guided-start-navigator">Ask the AI Navigator a broader question</Link>
                </div>
              ) : null}

              <p className="mt-4 text-[11px] leading-5 text-[#76877f]" data-testid="guided-start-disclosure">
                Evidence: {decision.evidence}. {decision.limits}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default GuidedStart;