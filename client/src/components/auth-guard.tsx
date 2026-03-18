import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";
import type { ComponentType } from "react";

function AuthRequiredPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6" data-testid="section-auth-required">
      <Card className="p-8 max-w-md text-center space-y-4">
        <Lock className="h-10 w-10 mx-auto text-muted-foreground" />
        <h2 className="text-xl font-semibold">Sign In Required</h2>
        <p className="text-muted-foreground">
          This section is available to authenticated team members only. Please sign in to continue.
        </p>
        <a
          href="/api/login"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          data-testid="button-sign-in"
        >
          Sign In
        </a>
      </Card>
    </div>
  );
}

export function withAuthGuard(Component: ComponentType) {
  return function GuardedComponent() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      );
    }

    if (!isAuthenticated) {
      return <AuthRequiredPage />;
    }

    return <Component />;
  };
}
