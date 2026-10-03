import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, MoveRight } from "lucide-react";
import {
  WORKSPACES,
  homeEntryTasks,
  type WorkspaceTask,
} from "@shared/workspace-catalog";
import { useWorkspace } from "@/lib/workspace-context";
import { GuidedStart } from "@/components/guided-start";
import { FocusedInvitation } from "@/components/focused-invitation";

function TaskLink({ task }: { task: WorkspaceTask }) {
  const { setWorkspace } = useWorkspace();

  return (
    <Link
      href={task.href}
      onClick={() => setWorkspace(task.workspace)}
      className="group flex min-h-[62px] items-center justify-between gap-3 rounded-xl border border-[#cbd9cf] bg-[#fbfaf5] px-4 py-2 text-left transition hover:border-[#729b88] hover:bg-[#f5f6eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28786d] focus-visible:ring-offset-2 sm:min-h-[70px] sm:px-5 sm:py-3"
      data-testid={`home-task-${task.id}`}
      aria-label={`${task.label}. ${task.description}`}
    >
      <span className="min-w-0">
        <span className="block font-[var(--font-display)] text-base font-semibold leading-tight tracking-[-.02em] text-[#213d38] sm:text-lg">{task.label}</span>
        <span className="mt-0.5 block text-xs leading-4 text-[#63776f]">{task.description}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[#24756b] sm:text-sm">
        Start <MoveRight aria-hidden="true" size={15} className="transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

export default function FocusedHome() {
  const { workspace, setWorkspace, storageUnavailable } = useWorkspace();
  const [guideOpen, setGuideOpen] = useState(false);
  const guideTrigger = useRef<HTMLButtonElement>(null);
  const primaryTasks = homeEntryTasks();
  const returningWorkspace = WORKSPACES.find((item) => item.id === workspace);

  useEffect(() => {
    // Returning from a task must not leave keyboard focus on a removed link.
    document.getElementById("home-title")?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!guideOpen) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("guided-start-input")?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [guideOpen]);

  function closeGuide() {
    setGuideOpen(false);
    guideTrigger.current?.focus();
  }

  return (
    <div className="min-h-[100dvh] bg-[#eef2ec] text-[#203b38]">
      <div className="mx-auto max-w-[1240px] px-4 pb-16 pt-3 sm:px-7 sm:pt-5 lg:px-10">
        <header className="flex min-h-9 items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#53776b]">TCAF <span className="px-1 text-[#a28b4b]">/</span> ThriveUp</p>
          <Link href="/workspaces" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[#cad7cf] bg-[#f8f8f2] px-3 text-[11px] leading-4 font-semibold text-[#375c53] transition hover:border-[#8cac9f] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24756b]" data-testid="home-professional-entry">
            <span className="max-w-[150px]">Teams, funders &amp; communities</span> <ArrowRight aria-hidden="true" size={14} className="shrink-0" />
          </Link>
        </header>

        <div>
          <section className="mt-3 flex flex-col gap-1 sm:mt-7 sm:gap-2" aria-labelledby="home-title">
            <p className="hidden sm:block text-[10px] font-bold uppercase tracking-[.17em] text-[#668078]">A practical place to begin</p>
            <h1 id="home-title" tabIndex={-1} className="font-[var(--font-display)] text-[1.6rem] font-semibold leading-[1.03] tracking-[-.045em] text-[#203b38] focus:outline-none sm:text-5xl">
              What would help today?
            </h1>
            <p className="max-w-2xl text-xs leading-5 text-[#62766e] sm:mt-1 sm:text-base sm:leading-6">
              Choose one task. No account needed.
            </p>
          </section>

          <section className="mt-3 sm:mt-7" id="start-with-a-task" aria-labelledby="task-first-title">
            <div className="mb-2 flex items-center justify-between gap-3 sm:mb-3">
              <h2 id="task-first-title" className="text-xs font-bold uppercase tracking-[.14em] text-[#53776b] sm:text-sm">Choose a next step</h2>
              <span className="text-[10px] text-[#71847c] sm:text-xs">Public tools · no sign-in</span>
            </div>
            <div className="grid gap-1 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
              {primaryTasks.map((task) => <TaskLink key={task.id} task={task} />)}
            </div>
            <button
              ref={guideTrigger}
              type="button"
              onClick={() => guideOpen ? closeGuide() : setGuideOpen(true)}
              aria-expanded={guideOpen}
              aria-controls="home-guide-panel"
              className="mt-2 inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-[#c8d7cd] bg-[#e3ece3] px-4 text-left text-sm font-semibold text-[#28594f] transition hover:border-[#88aa99] hover:bg-[#edf3e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24756b] sm:mt-3 sm:w-auto sm:min-w-[290px]"
              data-testid="home-guide-toggle"
            >
              <span>I’m not sure—help me start</span>
              <span className="text-xs font-medium text-[#61776d]">{guideOpen ? "Close" : "Optional"}</span>
            </button>
            <div
              id="home-guide-panel"
              className={guideOpen ? "mt-3" : "hidden"}
              data-testid="home-guide-panel"
              aria-hidden={!guideOpen}
            >
              {guideOpen && (
                <>
                  <div className="mb-2 flex justify-end">
                    <button type="button" onClick={closeGuide} className="rounded-md px-2 py-1 text-xs font-semibold text-[#536c64] hover:bg-[#e3ece3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24756b]">
                      Close guidance
                    </button>
                  </div>
                  <GuidedStart />
                </>
              )}
            </div>
            <Link href="/get-help" className="mt-1 inline-flex min-h-11 items-center text-xs font-semibold text-[#375c53] underline underline-offset-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24756b]" data-testid="home-crisis-help">Urgent support &amp; crisis contacts</Link>
          </section>

          {returningWorkspace && (
            <section className="mt-3 flex flex-col gap-2 rounded-xl border border-[#d2ddd5] bg-[#f8f8f2] px-4 py-3 sm:mt-5 sm:flex-row sm:items-center sm:justify-between" data-testid="home-resume-workspace">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[.15em] text-[#6b8177]">Last selected perspective</p>
                <p className="mt-0.5 text-xs font-semibold text-[#29443e]">{returningWorkspace.label} <span className="font-normal text-[#677a72]">— {returningWorkspace.purpose}</span></p>
              </div>
              <Link href={`/workspace/${returningWorkspace.id}`} className="inline-flex min-h-8 items-center gap-1 self-start rounded-lg px-2 text-xs font-semibold text-[#24756b] hover:bg-[#eaf1eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24756b] sm:self-auto" data-testid="home-resume-link">
                Continue there <ArrowRight aria-hidden="true" size={14} />
              </Link>
            </section>
          )}

          {storageUnavailable && <p className="mt-2 text-xs leading-5 text-[#7a6340]" role="status">Your browser could not save this preference. You can still choose a perspective for this visit.</p>}

          <section className="mt-8 border-t border-[#d4dfd7] pt-5 sm:mt-14 sm:pt-10" aria-labelledby="workspace-choice-title">
            <div className="mb-4 flex flex-col gap-1 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#668078]">Explore by perspective</p>
                <h2 id="workspace-choice-title" className="mt-1 font-[var(--font-display)] text-2xl font-semibold leading-tight tracking-[-.04em] text-[#203b38] sm:text-3xl">More ways to work with ThriveUp.</h2>
              </div>
              <p className="max-w-md text-xs leading-5 text-[#62766e]">A workspace helps organize tasks. It does not grant access or determine eligibility.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {WORKSPACES.map((item, index) => (
                <Link
                  key={item.id}
                  href={`/workspace/${item.id}`}
                  onClick={() => setWorkspace(item.id)}
                  className={`group relative flex min-h-[118px] flex-col justify-between overflow-hidden rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-[0_15px_30px_-24px_rgba(26,70,62,.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24756b] focus-visible:ring-offset-2 sm:min-h-[142px] sm:rounded-2xl sm:p-5 ${index === 0 ? "border-[#c2d6cb] bg-[#e3eee4]" : index === 1 ? "border-[#d8d4bc] bg-[#f3f0df]" : index === 2 ? "border-[#d6d4c6] bg-[#eeeee5]" : "border-[#c6d8d6] bg-[#e2eeeb]"}`}
                  data-testid={`home-workspace-${item.id}`}
                >
                  <span className="text-[9px] font-bold uppercase tracking-[.15em] text-[#668078]">Perspective 0{index + 1}</span>
                  <span>
                    <span className="block font-[var(--font-display)] text-base font-semibold leading-tight text-[#203b38] sm:text-lg">{item.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-[#62766e]">{item.audience}</span>
                  </span>
                  <ArrowRight aria-hidden="true" size={16} className="absolute bottom-4 right-4 text-[#39786d] transition-transform group-hover:translate-x-1 sm:bottom-5 sm:right-5" />
                </Link>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs">
              <Link href="/workspaces" className="font-semibold text-[#3c7065] underline decoration-[#9ab7a8] underline-offset-4 hover:text-[#174b45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24756b]" data-testid="home-workspace-directory">Browse all perspectives</Link>
              <Link href="/platform-overview" className="font-semibold text-[#3c7065] underline decoration-[#9ab7a8] underline-offset-4 hover:text-[#174b45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24756b]" data-testid="home-platform-overview">About the platform</Link>
            </div>
          </section>

          <FocusedInvitation />
        </div>

        <footer className="mt-8 flex flex-col gap-2 border-t border-[#d4dfd7] pt-4 text-xs leading-5 text-[#687c73] sm:mt-12 sm:flex-row sm:items-center sm:justify-between">
          <p>TCAF · ThriveUp — a nonprofit for residents, nonprofits, and communities to thrive.</p>
          <Link href="/tools" className="w-fit rounded-sm font-semibold text-[#3c7065] underline decoration-[#9ab7a8] underline-offset-4 hover:text-[#174b45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24756b]" data-testid="home-discover-tools">Explore all tools</Link>
        </footer>
      </div>
    </div>
  );
}