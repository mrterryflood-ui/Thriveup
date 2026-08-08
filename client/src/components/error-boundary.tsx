import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// A chunk error is only auto-recovered by reloading. But if the new deployment
// is genuinely broken (chunk keeps failing), an unconditional reload spins in an
// infinite loop. We persist an attempt counter in sessionStorage so the cap
// survives across reloads, and stop auto-reloading once the cap is hit —
// falling back to a manual "Reload now" button instead of a reload loop.
const CHUNK_RELOAD_KEY = "thriveup.chunkReloadAttempts";
const MAX_CHUNK_RELOADS = 2;

function getChunkReloadAttempts(): number {
  if (typeof window === "undefined") return 0;
  try {
    return parseInt(window.sessionStorage.getItem(CHUNK_RELOAD_KEY) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

function bumpChunkReloadAttempts(): number {
  const next = getChunkReloadAttempts() + 1;
  try {
    window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(next));
  } catch {
    /* noop */
  }
  return next;
}

function clearChunkReloadAttempts() {
  try {
    window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  } catch {
    /* noop */
  }
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
  reloadAttempted: boolean;
}

/**
 * Returns true when the error is a lazy-chunk load failure.
 * This happens after every new deployment: the old hashed chunk filenames
 * no longer exist, so dynamic import() 404s and React throws.
 * The correct recovery is a full page reload to pick up the new filenames.
 */
function isChunkLoadError(error: Error): boolean {
  const msg = (error?.message || "") + (error?.name || "") + String(error);
  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Loading chunk") ||
    msg.includes("Loading CSS chunk") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("dynamically imported module") ||
    msg.includes("Unable to preload CSS") ||
    // Vite production chunk errors
    msg.includes("__vite__") ||
    msg.includes("assets/") && msg.includes("404")
  );
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, isChunkError: false, reloadAttempted: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const chunk = isChunkLoadError(error);
    // If it's a chunk error and we haven't tried reloading yet, trigger auto-reload
    if (chunk) {
      return { hasError: true, error, isChunkError: true };
    }
    return { hasError: true, error, isChunkError: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const chunk = isChunkLoadError(error);
    console.error("ErrorBoundary caught:", error.message, chunk ? "(chunk load error)" : "", errorInfo);

    // Auto-reload for chunk errors (stale deployment cache), but only up to a
    // hard cap so a persistently-broken chunk can't loop forever. Once the cap
    // is reached we render the manual "Reload now" button instead.
    if (chunk) {
      const attempts = getChunkReloadAttempts();
      if (attempts < MAX_CHUNK_RELOADS && !this.state.reloadAttempted) {
        this.setState({ reloadAttempted: true });
        bumpChunkReloadAttempts();
        // Small delay so the state update lands before the reload.
        setTimeout(() => window.location.reload(), 300);
      }
    }
  }

  // Manual retry: reset the boundary and refresh data instead of hard-reloading.
  // This clears the error, invalidates queries so stale/failed data refetches,
  // and lets React re-render the subtree — avoiding window.location.reload loops.
  private handleRetry = () => {
    clearChunkReloadAttempts();
    void queryClient.invalidateQueries();
    this.setState({ hasError: false, error: null, isChunkError: false, reloadAttempted: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    // Chunk error: if we're still within the auto-reload cap, show the "Updating…"
    // screen while the reload fires. If the cap is exhausted (persistently broken
    // chunk), stop spinning and offer a manual reload so we don't loop forever.
    if (this.state.isChunkError) {
      const autoReloading = this.state.reloadAttempted && getChunkReloadAttempts() <= MAX_CHUNK_RELOADS;
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center" data-testid="error-boundary-chunk">
          <RefreshCw className={`h-10 w-10 text-primary mb-4 ${autoReloading ? "animate-spin" : ""}`} />
          <h2 className="text-lg font-semibold mb-2">
            {autoReloading ? "Loading latest version…" : "Couldn't load the latest version"}
          </h2>
          <p className="text-muted-foreground text-sm max-w-md">
            {autoReloading
              ? "A new version of the app was deployed. Refreshing automatically."
              : "We tried refreshing automatically but it didn't take. Please reload manually."}
          </p>
          <Button
            variant="outline"
            className="mt-5"
            onClick={() => { clearChunkReloadAttempts(); window.location.reload(); }}
            data-testid="button-error-reload"
          >
            Reload now
          </Button>
        </div>
      );
    }

    // Real application error
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center" data-testid="error-boundary-fallback">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          An unexpected error occurred. Please try refreshing the page or navigating back.
        </p>
        {this.state.error && (
          <p className="text-xs text-muted-foreground font-mono mb-4 max-w-md break-all opacity-60">
            {this.state.error.message}
          </p>
        )}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={this.handleRetry}
            data-testid="button-error-retry"
          >
            Try Again
          </Button>
          <Button
            onClick={() => window.location.href = "/"}
            data-testid="button-error-home"
          >
            Go Home
          </Button>
        </div>
      </div>
    );
  }
}
