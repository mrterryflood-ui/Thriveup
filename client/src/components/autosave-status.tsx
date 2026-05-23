import { useEffect, useState } from "react";
import { Check, Cloud, CloudOff, Loader2, AlertCircle, LogIn } from "lucide-react";
import type { AutosaveStatus } from "@/hooks/use-autosave";

interface AutosaveStatusProps {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  className?: string;
}

function formatRelative(d: Date): string {
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return d.toLocaleDateString();
}

/**
 * Renders a small status pill: "Saved 3s ago" / "Saving…" / "Sign in to save".
 * Self-updates the relative timestamp every 30s.
 */
export function AutosaveStatusPill({ status, lastSavedAt, className = "" }: AutosaveStatusProps) {
  const [, force] = useState(0);
  useEffect(() => {
    if (!lastSavedAt) return;
    const t = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, [lastSavedAt]);

  const base = `inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${className}`;
  if (status === "saving") {
    return (
      <span className={`${base} bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300`} data-testid="autosave-status-saving">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving…
      </span>
    );
  }
  if (status === "saved" && lastSavedAt) {
    return (
      <span className={`${base} bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300`} data-testid="autosave-status-saved">
        <Check className="h-3 w-3" /> Saved {formatRelative(lastSavedAt)}
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className={`${base} bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300`} data-testid="autosave-status-error">
        <AlertCircle className="h-3 w-3" /> Couldn't save — will retry
      </span>
    );
  }
  if (status === "signed-out") {
    return (
      <a href="/api/login" className={`${base} bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 hover:underline`} data-testid="autosave-status-signin">
        <LogIn className="h-3 w-3" /> Sign in to save your work
      </a>
    );
  }
  return (
    <span className={`${base} bg-muted text-muted-foreground`} data-testid="autosave-status-idle">
      <Cloud className="h-3 w-3" /> Autosave on
    </span>
  );
}
