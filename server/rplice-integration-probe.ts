const START_DELAY_MS = 90_000;
const INTERVAL_MS = 30 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 12_000;

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Cache-Control": "no-cache, no-store",
        Pragma: "no-cache",
        ...((init.headers as Record<string, string>) || {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function runRpliceIntegrationProbeOnce(): Promise<{ ok: boolean; checks: string[]; failures: string[] }> {
  const checks: string[] = [];
  const failures: string[] = [];

  const base = (process.env.RPLICE_BASE_URL || "https://www.bettersciencelab.com").replace(/\/$/, "");
  const key = (process.env.RPLICE_API_KEY || "").trim();

  try {
    const publicResp = await fetchWithTimeout(`${base}/api/research`);
    if (publicResp.ok) checks.push("public_research_ok");
    else failures.push(`public_research_${publicResp.status}`);
  } catch {
    failures.push("public_research_unreachable");
  }

  if (!key) {
    failures.push("missing_rplice_api_key");
  } else {
    try {
      const authResp = await fetchWithTimeout(`${base}/api/v1/partner/execution/catalog`, {
        headers: {
          Authorization: `******
          "Content-Type": "application/json",
        },
      });
      if (authResp.ok) checks.push("partner_execution_catalog_ok");
      else failures.push(`partner_execution_catalog_${authResp.status}`);
    } catch {
      failures.push("partner_execution_catalog_unreachable");
    }
  }

  return { ok: failures.length === 0, checks, failures };
}

export function startRpliceIntegrationProbe(): void {
  const run = async () => {
    try {
      const result = await runRpliceIntegrationProbeOnce();
      if (result.ok) {
        console.log(`[rplice-probe] ✅ integration healthy (${result.checks.join(", ")})`);
      } else {
        console.error(`[rplice-probe] ❌ integration degraded (${result.failures.join(", ")})`);
      }
    } catch (err: any) {
      console.error(`[rplice-probe] crashed: ${err?.message || err}`);
    }
  };

  setTimeout(() => {
    run();
    setInterval(run, INTERVAL_MS);
  }, START_DELAY_MS);
}
