import { useState } from "react";
import { Link } from "wouter";
import { entryTaskForPath } from "@shared/workspace-catalog";

// Only the three public entry workflows. No identity/intake storage or telemetry.
const START_CONTROLS: Record<string, string> = {
  "find-support": '[data-testid="input-search-help"]',
  "check-benefits": '[data-testid="input-zip"], [data-testid="button-next"]',
  "learn-work": '[data-testid="link-building-learning-center"]',
};

export function TaskStartHint({ path }: { path: string }) {
  const [dismissed, setDismissed] = useState(false);
  const [notice, setNotice] = useState("");
  const task = entryTaskForPath(path);
  if (!task || dismissed) return null;

  function showFirstStep() {
    if (!task) return false;
    const control = document.querySelector<HTMLElement>(START_CONTROLS[task.id]);
    if (!control || control.matches(":disabled") || control.getAttribute("aria-disabled") === "true") {
      setNotice("Use the current step's controls below, or try again after the page finishes loading.");
      return false;
    }
    setNotice("");
    control.scrollIntoView({ block: "center", behavior: "instant" });
    control.focus({ preventScroll: true });
    return true;
  }

  function dismissHint() {
    // Transfer focus before unmounting the currently focused dismissal button.
    if (!showFirstStep()) document.getElementById("main-content")?.focus({ preventScroll: true });
    setDismissed(true);
  }

  return (
    <section aria-label="Your first step" className="border-b bg-[#eef2ec] px-4 py-3 text-[#203b38]" data-testid="task-start-hint">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold">{task.label}</p>
        <p className="mt-1 text-sm leading-5" data-testid="task-start-instruction">{task.nextStep}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-4">
          <button type="button" onClick={showFirstStep} className="min-h-11 text-sm font-semibold underline underline-offset-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24756b]" data-testid="task-start-show">Show me where to start</button>
          <Link href="/" className="min-h-11 inline-flex items-center text-sm underline underline-offset-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24756b]" data-testid="task-start-change">Choose a different task</Link>
          <button type="button" onClick={dismissHint} className="min-h-11 text-sm rounded px-2 hover:bg-[#dce7dd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24756b]" data-testid="task-start-dismiss">Got it</button>
        </div>
        {notice && <p role="status" className="text-xs leading-5">{notice}</p>}
      </div>
    </section>
  );
}