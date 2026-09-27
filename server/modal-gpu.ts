/**
 * Modal GPU adapter — routes model-bound generation to the self-hosted Modal
 * GPU endpoint (modal/gpu_server.py) instead of a vendor API.
 *
 * Enabled only when both env vars are present:
 *   THRIVEUP_MODAL_URL  = public web endpoint URL from `modal deploy`
 *   THRIVEUP_MODAL_KEY  = shared secret matching the Modal secret thriveup-modal-key
 *
 * Doctrine guards:
 *  - Output is explicitly model_generated; callers must label it as such and
 *    must never pipe it into measurement tables (no fabricated evidence).
 *  - Deterministic failure: if the endpoint is down or the env is unset we
 *    throw a typed error with available=false, never silently substitute
 *    invented text.
 */

import type { Request, Response } from "express";

export interface ModalGenerateResult {
  completion: string;
  model: string;
  gpu_class: string;
  model_generated: true;
}

export class ModalUnavailableError extends Error {
  constructor(detail: string) {
    super(`Modal GPU unavailable: ${detail}`);
    this.name = "ModalUnavailableError";
  }
}

export function modalGpuConfig(): { url: string; key: string } | null {
  const url = process.env.THRIVEUP_MODAL_URL;
  const key = process.env.THRIVEUP_MODAL_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export async function modalGenerate(prompt: string, maxTokens = 512): Promise<ModalGenerateResult> {
  const cfg = modalGpuConfig();
  if (!cfg) {
    throw new ModalUnavailableError("THRIVEUP_MODAL_URL/THRIVEUP_MODAL_KEY not configured");
  }
  if (!prompt.trim()) {
    throw new ModalUnavailableError("empty prompt");
  }
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-modal-key": cfg.key },
    body: JSON.stringify({ prompt, max_tokens: maxTokens, x_modal_key: cfg.key }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) {
    throw new ModalUnavailableError(`endpoint HTTP ${res.status}`);
  }
  return (await res.json()) as ModalGenerateResult;
}

/** GET /api/modal/gpu/status — which GPU tier this deployment would use. */
export function registerModalRoutes(app: { get: (path: string, h: (req: Request, res: Response) => void) => void }): void {
  app.get("/api/modal/gpu/status", (_req, res) => {
    const cfg = modalGpuConfig();
    res.json({
      configured: !!cfg,
      endpoint: cfg?.url ?? null,
      gpu_tiers_available: ["T4", "L4", "A10G", "A100", "H100"],
      note: "Tier is chosen at `modal deploy` time via GPU_CLASS=<tier>; see modal/gpu_server.py.",
    });
  });
}
