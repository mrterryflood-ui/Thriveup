import { useMemo } from "react";
import { Link } from "wouter";
import { ArrowDown, ArrowRight, Compass, MoveRight } from "lucide-react";
import {
  WORKSPACES,
  WORKSPACE_TASKS,
  canUseTask,
  type WorkspaceTask,
} from "@shared/workspace-catalog";
import { useWorkspace, useWorkspaceAccess } from "@/lib/workspace-context";
import { GuidedStart } from "@/components/guided-start";
import { FocusedInvitation } from "@/components/focused-invitation";

function TaskCard({ task }: { task: WorkspaceTask }) {
  const { setWorkspace } = useWorkspace();
  const workspace = WORKSPACES.find((item) => item.id === task.workspace);
  return (
    <Link
      href={task.href}
      onClick={() => setWorkspace(task.workspace)}
      className="group flex min-h-[176px] flex-col justify-between rounded-2xl border border-[#d5dfd9] bg-[#fbfaf6] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#83aa9c] hover:shadow-[0_18px_35px_-26px_rgba(26,70,62,.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28786d] focus-visible:ring-offset-2 sm:p-6"
      data-testid={`home-task-${task.id}`}
      aria-label={`${task.label}. ${task.description}`}
    >
      <span>
        <span className="mb-4 block text-[10px] font-bold uppercase tracking-[.16em] text-[#648078]">{workspace?.label}</span>
        <span className="block font-[var(--font-display)] text-xl font-semibold leading-tight tracking-[-.025em] text-[#213d38]">{task.label}</span>
        <span className="mt-2 block max-w-sm text-sm leading-5 text-[#63776f]">{task.description}</span>
      </span>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#24756b]">
        Start here <MoveRight aria-hidden="true" size={16} className="transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

export default function FocusedHome() {
  const { workspace, setWorkspace, storageUnavailable } = useWorkspace();
  const viewer = useWorkspaceAccess();
  const primaryTasks = useMemo(
    () => WORKSPACE_TASKS.filter((task) => task.primary && canUseTask(task, viewer)),
    [viewer.authenticated, viewer.staff, viewer.admin],
  );
  const returningWorkspace = WORKSPACES.find((item) => item.id === workspace);

  function chooseWorkspace(id: (typeof WORKSPACES)[number]["id"]) {
    setWorkspace(id);
  }

  return (
    <div className="min-h-[100dvh] bg-[#eef2ec] text-[#203b38]">
      <div className="mx-auto max-w-[1240px] px-4 pb-16 pt-5 sm:px-7 lg:px-10">
        <header className="flex justify-end">
          <Link href="/tools" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#cad7cf] bg-[#f8f8f2] px-4 text-sm font-semibold text-[#375c53] transition hover:border-[#8cac9f] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24756b]" data-testid="home-discover-tools">
            Discover more <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </header>

        <section className="relative mt-8 overflow-hidden rounded-[2rem] bg-[#174b45] px-6 py-9 text-[#f8f5e9] sm:px-10 sm:py-12 lg:px-14 lg:py-[4.25rem]" aria-labelledby="home-title">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-28 h-[27rem] w-[27rem] rounded-full border border-[#f0c65f]/20" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-14 h-[21rem] w-[21rem] rounded-full border border-[#f0c65f]/15" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-[-7rem] right-[14%] h-[15rem] w-[15rem] rounded-full bg-[#efc661]/[.08]" />
          <div className="relative grid gap-9 lg:grid-cols-[1fr_300px] lg:items-end">
            <div className="max-w-[720px]">
              <p className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.19em] text-[#d6e4dc]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#efc661]" /> A practical place to begin
              </p>
              <h1 id="home-title" className="font-[var(--font-display)] text-[2.65rem] font-medium leading-[.98] tracking-[-.055em] sm:text-6xl lg:text-[4.35rem]">
                Find your next<br className="hidden sm:block" /> useful step.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#dbe7e0] sm:text-lg">
                TCAF and ThriveUp bring tools, information, and support into reach—without asking you to learn the whole system first.
              </p>
            </div>
            <div className="relative rounded-2xl border border-white/15 bg-white/[.07] p-5 backdrop-blur-sm lg:mb-1">
              <p className="text-xs font-semibold uppercase tracking-[.15em] text-[#d3e2da]">Choose what fits today</p>
              <p className="mt-2 text-sm leading-6 text-[#f7f6ec]">Start with a task, choose your perspective, or ask for a guided suggestion.</p>
              <a href="#start-with-a-task" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#f2d47e] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d47e]">
                See starting points <ArrowDown aria-hidden="true" size={15} />
              </a>
            </div>
          </div>
        </section>

        {returningWorkspace && (
          <section className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#d2ddd5] bg-[#f8f8f2] px-5 py-4 sm:flex-row sm:items-center sm:justify-between" data-testid="home-resume-workspace">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#6b8177]">Your last selected workspace</p>
              <p className="mt-1 text-sm font-semibold text-[#29443e]">{returningWorkspace.label} <span className="font-normal text-[#677a72]">— {returningWorkspace.purpose}</span></p>
            </div>
            <Link href={`/workspace/${returningWorkspace.id}`} className="inline-flex min-h-10 items-center gap-2 self-start rounded-lg px-3 text-sm font-semibold text-[#24756b] hover:bg-[#eaf1eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24756b] sm:self-auto" data-testid="home-resume-link">
              Continue there <ArrowRight aria-hidden="true" size={15} />
            </Link>
          </section>
        )}

        <section id="start-with-a-task" className="pt-12 sm:pt-16" aria-labelledby="task-first-title">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#668078]">01 · Task first</p>
              <h2 id="task-first-title" className="mt-2 font-[var(--font-display)] text-3xl font-semibold tracking-[-.04em] text-[#203b38] sm:text-[2.5rem]">What brings you here?</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#62766e]">Choose a direct public starting point. Each one opens a real ThriveUp workflow.</p>
            </div>
            <span className="inline-flex items-center gap-2 text-xs font-medium text-[#71847c]"><Compass aria-hidden="true" size={15} /> Your destination stays your choice</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {primaryTasks.map((task) => <TaskCard key={task.id} task={task} />)}
          </div>
        </section>

        <section className="mt-14 border-t border-[#d4dfd7] pt-10 sm:mt-16 sm:pt-12" aria-labelledby="workspace-choice-title">
          <div className="grid gap-7 lg:grid-cols-[.76fr_1.24fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#668078]">02 · Choose a workspace</p>
              <h2 id="workspace-choice-title" className="mt-2 font-[var(--font-display)] text-3xl font-semibold leading-tight tracking-[-.04em] text-[#203b38]">A different view for every role.</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[#62766e]">Workspaces organize related tasks. Picking one is a preference, not a permission or eligibility decision.</p>
              {storageUnavailable && <p className="mt-3 text-xs leading-5 text-[#7a6340]" role="status">Your browser could not save this preference. You can still choose a workspace for this visit.</p>}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {WORKSPACES.map((item, index) => (
                <Link
                  key={item.id}
                  href={`/workspace/${item.id}`}
                  onClick={() => chooseWorkspace(item.id)}
                  className={`group relative flex min-h-[142px] flex-col justify-between overflow-hidden rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-[0_15px_30px_-24px_rgba(26,70,62,.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24756b] focus-visible:ring-offset-2 ${index === 0 ? "border-[#c2d6cb] bg-[#e3eee4]" : index === 1 ? "border-[#d8d4bc] bg-[#f3f0df]" : index === 2 ? "border-[#d6d4c6] bg-[#eeeee5]" : "border-[#c6d8d6] bg-[#e2eeeb]"}`}
                  data-testid={`home-workspace-${item.id}`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-[.15em] text-[#668078]">Workspace 0{index + 1}</span>
                  <span>
                    <span className="block font-[var(--font-display)] text-lg font-semibold leading-tight text-[#203b38]">{item.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-[#62766e]">{item.audience}</span>
                  </span>
                  <ArrowRight aria-hidden="true" size={17} className="absolute bottom-5 right-5 text-[#39786d] transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-14 sm:mt-16" aria-label="Guided navigation">
          <GuidedStart />
        </section>

        <FocusedInvitation />
        <footer className="mt-12 flex flex-col gap-3 border-t border-[#d4dfd7] pt-5 text-xs leading-5 text-[#687c73] sm:flex-row sm:items-center sm:justify-between">
          <p>TCAF · ThriveUp — a nonprofit for residents, nonprofits, and communities to thrive.</p>
          <Link href="/platform-overview" className="w-fit rounded-sm font-semibold text-[#3c7065] underline decoration-[#9ab7a8] underline-offset-4 hover:text-[#174b45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24756b]" data-testid="home-platform-overview">
            About the platform
          </Link>
        </footer>
      </div>
    </div>
  );
}