import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ErrorRetryProps {
  message: string;
  onRetry: () => void;
}

export function ErrorRetry({ message, onRetry }: ErrorRetryProps) {
  return (
    <Card className="p-6 flex flex-col items-center justify-center gap-4 text-center" data-testid="error-retry-container">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <p className="text-sm text-muted-foreground" data-testid="error-retry-message">{message}</p>
      <Button onClick={onRetry} aria-label="Try again" data-testid="button-error-retry">
        Try Again
      </Button>
    </Card>
  );
}
