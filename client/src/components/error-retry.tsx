import { AlertCircle } from "lucide-react";
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
      <Button onClick={onRetry} aria-label={t("state.error.tryAgain")} data-testid="button-error-retry">
        {t("state.error.tryAgain")}
      </Button>
    </Card>
  );
}
