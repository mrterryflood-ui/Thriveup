import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

interface PlaceContext { place: string | null; status: "available" | "empty" | "unsupported" }

/** Identity-scoped, cancellable read of the existing journey's broad geography only. */
export function useMagnetJourneyPlace(explicitPlace: boolean) {
  const { user, isLoading: authLoading } = useAuth();
  const uid = user?.id;
  const query = useQuery<PlaceContext>({
    queryKey: ["/api/community-gravity/context", uid],
    enabled: !!uid && !explicitPlace,
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/community-gravity/context", { signal, credentials: "include" });
      if (!response.ok) throw new Error(`Journey place unavailable (${response.status})`);
      return response.json();
    },
    staleTime: 60_000,
    gcTime: 0,
    retry: false,
  });
  return {
    place: !explicitPlace && uid ? query.data?.place ?? null : null,
    pending: !explicitPlace && (authLoading || (!!uid && query.isPending)),
    error: !explicitPlace && !!uid && query.isError,
    unsupported: !explicitPlace && !!uid && query.data?.status === "unsupported",
  };
}