import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error("ErrorBoundary caught:", error.message, chunk ? "(chunk load error — will reload)" : "", errorInfo);

    // Auto-reload once for chunk errors (stale deployment cache)
    if (chunk && !this.state.reloadAttempted) {
      this.setState({ reloadAttempted: true });
      // Small delay so the state update lands before the reload
      setTimeout(() => window.location.reload(), 300);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    // Chunk error: show a minimal "Updating..." screen while the reload fires
    if (this.state.isChunkError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center" data-testid="error-boundary-chunk">
          <RefreshCw className="h-10 w-10 text-primary mb-4 animate-spin" />
          <h2 className="text-lg font-semibold mb-2">Loading latest version…</h2>
          <p className="text-muted-foreground text-sm max-w-md">
            A new version of the app was deployed. Refreshing automatically.
          </p>
          <Button
            variant="outline"
            className="mt-5"
            onClick={() => window.location.reload()}
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
            onClick={() => this.setState({ hasError: false, error: null, isChunkError: false, reloadAttempted: false })}
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
