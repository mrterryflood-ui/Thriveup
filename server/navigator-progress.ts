import type { Response } from "express";

export type NavigatorPhase = "received" | "context" | "research" | "answer" | "checking";
const PHASE_LABELS: Record<NavigatorPhase, string> = {
  received: "Question received. Preparing your first answer.",
  context: "Checking available community information.",
  research: "Looking up sources for your question.",
  answer: "Generating your answer.",
  checking: "Checking the answer against available evidence.",
};

/** Transport feedback only, never a claim that research succeeded. */
export function startNavigatorProgress(
  res: Response,
  controller: AbortController,
  options: { intervalMs?: number; deadlineMs?: number } = {},
) {
  const started = Date.now();
  let phase: NavigatorPhase = "received";
  let detail: string | undefined;
  let disposed = false;
  const write = (event: unknown) => {
    if (!res.destroyed && !res.writableEnded && !disposed) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  };
  const update = () => {
    const elapsedMs = Date.now() - started;
    write({ progress: {
      phase,
      elapsedMs,
      message: elapsedMs >= 10_000
        ? `${detail || PHASE_LABELS[phase]} This is taking longer than the 10-second first-answer target. You can stop and retry.`
        : detail || PHASE_LABELS[phase],
    } });
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    clearInterval(interval);
    clearTimeout(deadline);
    res.off("close", dispose);
    res.off("finish", dispose);
    controller.signal.removeEventListener("abort", dispose);
  };
  const interval = setInterval(update, options.intervalMs ?? 10_000);
  const deadline = setTimeout(() => {
    write({ error: "This request reached the 40-second limit and was stopped. Your question can be retried; no completed answer is available.", timedOut: true });
    dispose();
    controller.abort(new Error("Navigator request deadline"));
    if (!res.destroyed && !res.writableEnded) res.end();
  }, options.deadlineMs ?? 40_000);
  res.once("close", dispose);
  res.once("finish", dispose);
  controller.signal.addEventListener("abort", dispose, { once: true });
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  update();
  return {
    setPhase(next: NavigatorPhase, message?: string) { phase = next; detail = message; update(); },
    dispose,
  };
}

export class NavigatorStageTimeout extends Error {}

/** Bound waiting and cooperatively abort enrichment. Already-issued native DB
 * queries may finish; their result is not admitted after the stage expires. */
export async function withinNavigatorBudget<T>(
  work: Promise<T> | ((signal: AbortSignal) => Promise<T>),
  timeoutMs: number,
  signal: AbortSignal,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const stage = new AbortController();
  const abort = () => {
    stage.abort(new Error("Navigator request cancelled"));
    rejectAbort(new Error("Navigator request cancelled"));
  };
  let rejectAbort: (error: Error) => void = () => {};
  try {
    if (signal.aborted) throw new Error("Navigator request cancelled");
    return await Promise.race([
      typeof work === "function" ? work(stage.signal) : work,
      new Promise<never>((_, reject) => {
        rejectAbort = reject;
        timer = setTimeout(() => {
          const error = new NavigatorStageTimeout("Optional context exceeded its time budget");
          stage.abort(error);
          reject(error);
        }, timeoutMs);
        signal.addEventListener("abort", abort, { once: true });
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
    signal.removeEventListener("abort", abort);
  }
}

/** Stop later DB operations in a multi-step optional context assembly.
 * Does not promise to interrupt a statement already submitted to PostgreSQL. */
export function guardNavigatorContextDb<T extends object>(database: T, signal?: AbortSignal): T {
  if (!signal) return database;
  return new Proxy(database, {
    get(target, key) {
      const value = Reflect.get(target, key);
      if (typeof value !== "function") return value;
      return (...args: unknown[]) => {
        signal.throwIfAborted();
        return Reflect.apply(value, target, args);
      };
    },
  });
}