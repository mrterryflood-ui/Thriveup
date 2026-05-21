import { useTradeSimsTrial } from "@/hooks/use-trade-sims-trial";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, LogIn, Lock } from "lucide-react";

interface TradeSimsTrialGateProps {
  children: React.ReactNode;
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Wrap any Trade Sims page in this gate. Authenticated users see children
 * unchanged. Anonymous users see children for 10 cumulative minutes (timer
 * shown), after which a sign-in paywall replaces them.
 */
export function TradeSimsTrialGate({ children }: TradeSimsTrialGateProps) {
  const { loading, authenticated, expired, remainingMs, totalMs } = useTradeSimsTrial();

  if (authenticated) {
    return <>{children}</>;
  }

  if (loading) {
    // Don't flash content before we know the trial state.
    return (
      <div className="container max-w-3xl py-16 px-4" data-testid="trial-gate-loading">
        <div className="space-y-3">
          <div className="h-6 w-48 rounded bg-muted animate-pulse" />
          <div className="h-4 w-full rounded bg-muted animate-pulse" />
          <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="container max-w-3xl py-16 px-4" data-testid="trial-gate-expired">
        <Card className="border-2">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold">Your 10-minute preview is up</h1>
            <p className="text-sm text-muted-foreground max-w-prose mx-auto">
              The Trade Sims engine is free — we just ask you to sign in so we
              know who's using it and can keep building it. One click, then
              you're back to building.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Button asChild data-testid="button-trial-login">
                <a href="/api/login">
                  <LogIn className="mr-2 h-4 w-4" /> Sign in to keep going
                </a>
              </Button>
              <Button asChild variant="outline" data-testid="button-trial-home">
                <a href="/">Back to public site</a>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              No charge. Sign-in just unlocks the rest of the lessons and
              saves your progress.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Trial active — show children with a thin countdown banner.
  const pct = totalMs > 0 ? Math.max(0, Math.min(100, (remainingMs / totalMs) * 100)) : 0;
  const lowWarn = remainingMs < 2 * 60 * 1000;
  return (
    <div data-testid="trial-gate-active">
      <div
        className={`sticky top-0 z-30 border-b ${
          lowWarn ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300" : "bg-muted/40"
        }`}
        data-testid="trial-banner"
      >
        <div className="container max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 text-sm">
          <Clock className={`h-4 w-4 ${lowWarn ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"}`} />
          <span className={lowWarn ? "font-semibold" : ""}>
            Free preview: <span data-testid="text-trial-remaining">{formatRemaining(remainingMs)}</span> remaining
          </span>
          <div className="flex-1 max-w-xs hidden sm:block">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full ${lowWarn ? "bg-amber-500" : "bg-primary"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <Button asChild size="sm" variant={lowWarn ? "default" : "outline"} data-testid="button-trial-login-inline">
            <a href="/api/login">
              <LogIn className="mr-1 h-3.5 w-3.5" /> Sign in (free)
            </a>
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}
