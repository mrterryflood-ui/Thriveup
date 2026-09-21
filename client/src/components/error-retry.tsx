import { AlertCircle, Home } from "lucide-react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";

interface ErrorRetryProps {
  /** Optional message. Falls back to the translated default when omitted. */
  message?: string;
  onRetry: () => void;
}

export function ErrorRetry({ message, onRetry }: ErrorRetryProps) {
  const { t } = useLanguage();
  return (
    <Card className="p-6 flex flex-col items-center justify-center gap-4 text-center" data-testid="error-retry-container">
      <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
      <p className="text-sm text-muted-foreground" data-testid="error-retry-message" role="alert">
        {message ?? t("state.error.default")}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={onRetry} aria-label={t("state.error.tryAgain")} data-testid="button-error-retry">
          {t("state.error.tryAgain")}
        </Button>
        <Button asChild variant="outline">
          <Link href="/" aria-label="Go back to the home page" data-testid="button-error-home">
            <Home className="h-4 w-4 mr-1.5" aria-hidden="true" />
            Go home
          </Link>
        </Button>
      </div>
    </Card>
  );
}
