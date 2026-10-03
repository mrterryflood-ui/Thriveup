import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight, Compass, LockKeyhole, MoveRight } from "lucide-react";
import {
  WORKSPACES,
  WORKSPACE_TASKS,
  canUseTask,
  isWorkspaceId,
  type WorkspaceTask,
} from "@shared/workspace-catalog";
import { useWorkspace, useWorkspaceAccess } from "@/lib/workspace-context";
import { GuidedStart } from "@/components/guided-start";
import { FocusedInvitation } from "@/components/focused-invitation";

function WorkspaceTaskCard({ task }: { task: WorkspaceTask }) {
  const { setWorkspace } = useWorkspace();
  const viewer = useWorkspaceAccess();
  const allowed = canUseTask(task, viewer);
  if (!allowed) {
    const roleRequired = task.access === "staff" || task.access === "admin";
    return (
      <article className="rounded-2xl border border-[#d6ddd5] bg-[#f6f7f1] p-4 sm:p-6" data-testid={`workspace-signin-${task.id}`}>
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e5eadf] text-[#58756a]">
            <LockKeyhole aria-hidden="true" size={17} />
          </span>
          <div>
            <h3 className="font-[var(--font-display)] text-lg font-semibold leading-tight text-[#203b38]">{task.label}</h3>
            <p className="mt-1 text-sm leading-5 text-[#65786f]">{task.description}</p>
            <p className="mt-3 text-xs leading-5 text-[#5d7168]">{task.nextStep}</p>
            {roleRequired && <p className="mt-2 text-xs leading-5 text-[#5d7168]" data-testid={`workspace-role-${task.id}`}>Requires existing {task.access} authorization. Signing in or choosing this workspace does not grant it.</p>}
            {viewer.loading && <p role="status" className="mt-4 text-xs text-[#5d7168]">Checking account access…</p>}
            {!viewer.loading && !viewer.authenticated && <a
              href={`/api/login?returnTo=${encodeURIComponent(task.href)}`}
              onClick={() => setWorkspace(task.workspace)}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#b9ccc0] bg-white px-3 text-xs font-semibold text-[#28675d] hover:bg-[#edf3ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24756b]"
              data-testid={`workspace-login-${task.id}`}
            >
              {roleRequired ? "Sign in with authorized account" : "Sign in to continue"} <ArrowRight aria-hidden="true" size={14} />
            </a>}
            {!viewer.loading && viewer.authenticated && <p className="mt-4 text-xs font-semibold text-[#5d7168]" data-testid={`workspace-denied-${task.id}`}>Your current account does not have this access.</p>}
          </div>
        </div>
      </article>
    );
  }
  return (
    <Link
      href={task.href}
      onClick={() => setWorkspace(task.workspace)}
      className="group flex min-h-[150px] flex-col justify-between rounded-2xl border border-[#d5dfd9] bg-[#fbfaf6] p-3 transition hover:-translate-y-0.5 hover:border-[#83aa9c] hover:shadow-[0_18px_35px_-26px_rgba(26,70,62,.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28786d] focus-visible:ring-offset-2 sm:min-h-[190px] sm:p-6"
      data-testid={`workspace-task-${task.id}`}
    >
      <div>
        <div className="mb-2 sm:mb-4 flex items-center justify-between gap-3">
          <span className="rounded-full bg-[#e8efe7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#53776b]">Next step</span>
          <MoveRight aria-hidden="true" size={17} className="text-[#438074] transition-transform group-hover:translate-x-1" />
        </div>
        <h3 className="font-[var(--font-display)] text-xl font-semibold leading-tight tracking-[-.025em] text-[#213d38]">{task.label}</h3>
        <p className="mt-2 text-sm leading-5 text-[#63776f]">{task.description}</p>
      </div>
      <p className="mt-3 sm:mt-5 border-t border-[#e2e8e1] pt-2 sm:pt-3 text-xs leading-5 text-[#61766d]">{task.nextStep}</p>
    </Link>
  );
}

export default function WorkspaceHome({ workspace: workspaceProp }: { workspace?: string }) {
  const params = useParams<{ workspace?: string }>();
  const workspaceId = workspaceProp ?? params.workspace;
  const { setWorkspace, storageUnavailable } = useWorkspace();

  useEffect(() => {
    if (isWorkspaceId(workspaceId)) setWorkspace(workspaceId);
  }, [workspaceId, setWorkspace]);

  if (!isWorkspaceId(workspaceId)) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#eef2ec] px-5 py-12">
        <section className="w-full max-w-xl rounded-[1.75rem] border border-[#d4dfd7] bg-[#fbfaf6] p-7 shadow-[0_24px_70px_-48px_rgba(27,60,55,.45)] sm:p-10" aria-labelledby="invalid-workspace-title" data-testid="invalid-workspace">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#668078]">Workspace not found</p>
          <h1 id="invalid-workspace-title" className="mt-3 font-[var(--font-display)] text-3xl font-semibold tracking-[-.04em] text-[#203b38]">That destination isn’t available.</h1>
          <p className="mt-3 text-sm leading-6 text-[#63776f]">Choose a starting point from the ThriveUp home page instead.</p>
          <Link href="/" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#174b45] px-4 text-sm font-semibold text-white hover:bg-[#21655c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#174b45] focus-visible:ring-offset-2" data-testid="invalid-workspace-home">
            <ArrowLeft aria-hidden="true" size={16} /> Return home
          </Link>
        </section>
      </div>
    );
  }

  const workspace = WORKSPACES.find((item) => item.id === workspaceId);
  if (!workspace) return null;
  const tasks = WORKSPACE_TASKS.filter((task) => task.workspace === workspaceId);
  const visibleTasks = tasks;

  return (
      <div className="min-h-[100dvh] bg-[#eef2ec] text-[#203b38]">
      <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-3 sm:px-7 sm:pt-5 lg:px-10">
        <header className="flex min-h-9 items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#53776b]">TCAF <span className="px-1 text-[#a28b4b]">/</span> ThriveUp</p>
          <Link href="/workspaces" className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[#cad7cf] bg-[#f8f8f2] px-3.5 text-xs font-semibold text-[#375c53] transition hover:border-[#8cac9f] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24756b]" data-testid="workspace-switch">
            <Compass aria-hidden="true" size={15} /> Change workspace
          </Link>
        </header>

        <section className="relative mt-3 overflow-hidden rounded-2xl bg-[#174b45] px-5 py-4 text-[#f8f5e9] sm:mt-7 sm:rounded-[2rem] sm:px-10 sm:py-10 lg:px-14" aria-labelledby="workspace-title">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-28 h-[27rem] w-[27rem] rounded-full border border-[#f0c65f]/20" />
          <div className="relative max-w-[760px]">
            <p className="hidden sm:block mb-3 text-xs font-bold uppercase tracking-[.18em] text-[#d3e2da]">{workspace.audience}</p>
            <h1 id="workspace-title" className="font-[var(--font-display)] text-[1.4rem] font-medium leading-[1.02] tracking-[-.045em] sm:text-5xl lg:text-6xl">{workspace.label}</h1>
            <p className="mt-1.5 max-w-xl text-xs leading-5 text-[#dbe7e0] sm:mt-3 sm:text-base sm:leading-7">{workspace.purpose}</p>
            <div className="hidden sm:inline-flex items-center leading-4 text-[#e1eae4] mt-4 gap-2 rounded-full border border-white/15 bg-white/[.07] px-3.5 py-2 text-xs">
              <Compass aria-hidden="true" size={12} className="shrink-0 text-[#f0cf77] sm:h-[14px] sm:w-[14px]" />
              This workspace organizes tasks; it does not grant access.
            </div>
          </div>
        </section>

        {storageUnavailable && <p className="mt-4 text-xs leading-5 text-[#7a6340]" role="status">Your browser could not save this preference. Your selected workspace is still available for this visit.</p>}

        <section className="pt-5 sm:pt-12" aria-labelledby="workspace-tasks-title">
          <div className="mb-3 flex flex-col gap-1 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="hidden sm:block text-[10px] font-bold uppercase tracking-[.16em] text-[#668078]">Choose one next step</p>
              <h2 id="workspace-tasks-title" className="mt-0.5 font-[var(--font-display)] text-2xl font-semibold tracking-[-.04em] text-[#203b38] sm:mt-2 sm:text-3xl">Start with a task.</h2>
            </div>
            <p className="hidden sm:block max-w-sm text-xs leading-5 text-[#6b7f76]">Each description explains what opens next. Availability and permissions depend on the destination.</p>
          </div>
          {visibleTasks.length ? (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3 sm:gap-3">
              {visibleTasks.map((task) => <WorkspaceTaskCard key={task.id} task={task} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#bdcdc2] bg-[#f6f7f1] p-7 text-sm leading-6 text-[#61766d]" data-testid="workspace-empty">
              There are no directly available tasks in this workspace yet. <Link href="/tools" className="font-semibold text-[#28675d] underline underline-offset-4">Explore the full tools catalog</Link>.
            </div>
          )}
        </section>

        <section className="mt-8 sm:mt-12" aria-label="Optional guided navigation">
          <GuidedStart workspace={workspaceId} />
        </section>
        {workspaceId === "community" && <FocusedInvitation />}

        <footer className="mt-10 flex flex-col gap-3 border-t border-[#d4dfd7] pt-5 text-xs leading-5 text-[#687c73] sm:flex-row sm:items-center sm:justify-between">
          <p>Choose a destination that fits your next step. You can switch perspectives at any time.</p>
          <Link href="/" className="w-fit inline-flex items-center gap-1.5 rounded-sm font-semibold text-[#3c7065] hover:text-[#174b45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24756b]" data-testid="workspace-back-home">
            <ArrowLeft aria-hidden="true" size={13} /> All starting points
          </Link>
        </footer>
      </div>
    </div>
  );
}