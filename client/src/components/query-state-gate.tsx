import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorRetry } from "@/components/error-retry";

interface QueryStateGateProps<T> {
  /** The result object returned by useQuery. */
  query: Pick<UseQueryResult<T>, "isLoading" | "isError" | "data" | "refetch">;
  /** Rendered once data has loaded successfully. */
  children: (data: T) => ReactNode;
  /** Optional custom loading node (defaults to a skeleton block). */
  loading?: ReactNode;
  /** Message shown in the error-with-retry card. When omitted, ErrorRetry
   *  falls back to its translated default. */
  errorMessage?: string;
  /** Optional test id applied to the wrapper for loading/error states. */
  "data-testid"?: string;
}

/**
 * Small reusable gate around a react-query result. Renders one of three
 * states — loading skeleton, error-with-retry (calls query.refetch), or the
 * children with the loaded data — matching the app's existing ErrorRetry style
 * (see client/src/pages/quiz.tsx). Prevents queries from silently rendering
 * empty data when they actually failed.
 */
export function QueryStateGate<T>({
  query,
  children,
  loading,
  errorMessage,
  "data-testid": testId,
}: QueryStateGateProps<T>) {
  if (query.isLoading) {
    return (
      <div data-testid={testId ? `${testId}-loading` : "query-gate-loading"}>
        {loading ?? <Skeleton className="h-32 w-full" />}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div data-testid={testId ? `${testId}-error` : "query-gate-error"}>
        <ErrorRetry message={errorMessage} onRetry={() => void query.refetch()} />
      </div>
    );
  }

  return <>{children(query.data as T)}</>;
}
