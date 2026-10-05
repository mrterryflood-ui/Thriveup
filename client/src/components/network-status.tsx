import { useQuery } from "@tanstack/react-query";

/** Network-wide reported health, not proof that this page or an individual service is healthy. */
export function NetworkStatus({ enabled }: { enabled: boolean }) {
  const q = useQuery<{ totalPlatforms: number; onlinePlatforms: number }>({
    queryKey: ["/api/ecosystem/health"],
    enabled,
    staleTime: 180_000,
    retry: false,
    queryFn: async ({ signal }) => {
      const r = await fetch("/api/ecosystem/health", { signal });
      if (!r.ok) throw new Error(`Network status unavailable (${r.status})`);
      const data = await r.json();
      if (!Number.isInteger(data.totalPlatforms) || !Number.isInteger(data.onlinePlatforms)
        || data.totalPlatforms < 0 || data.onlinePlatforms < 0 || data.onlinePlatforms > data.totalPlatforms) {
        throw new Error("Network status returned an invalid aggregate");
      }
      return data;
    },
  });
  return <span role="status" aria-live="polite" data-testid="network-status" title="Network-wide heartbeat report, not this page's availability.">
    {q.isPending ? "Network status loading" : q.isError || !q.data ? "Network status unavailable" : `Network: ${q.data.onlinePlatforms}/${q.data.totalPlatforms} reported online`}
  </span>;
}