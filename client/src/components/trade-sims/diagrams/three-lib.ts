/**
 * Centralized Three.js re-export for the Trade Sims flagship 3D diagrams.
 *
 * The project uses vanilla Three.js without `@types/three` (installing types
 * is out of scope — package.json is change-with-explicit-ask). Importing
 * `three` directly triggers TS7016 (no declaration file) at each import site.
 * Re-exporting once here keeps that untyped-boundary acknowledgement in a
 * single module instead of repeating it across every 3D component, matching
 * the "specialists, never re-inlined" discipline.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export * as THREE from "three";
import * as THREE_NS from "three";
export { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * Cheap, side-effect-free WebGL support probe. Returns false on any device
 * where `new THREE.WebGLRenderer()` would throw (headless browsers, GPU-less
 * environments, some mobile webviews, WebGL disabled). MUST be called BEFORE
 * constructing a renderer so we can fail soft to a 2D fallback instead of
 * letting the exception kill the whole lesson page.
 */
/**
 * Construct a WebGLRenderer with NO throwing path. We create the canvas and
 * the GL context ourselves (context creation is where headless/GPU-less
 * environments fail — sometimes only on the SECOND context, so a separate
 * probe canvas is not a reliable guard) and hand both to Three. If context
 * creation returns null or the constructor still throws, we return null and
 * the caller falls back to the 2D diagram.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createRendererSafe(opts: { antialias?: boolean; alpha?: boolean } = {}): any | null {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  try {
    const canvas = document.createElement("canvas");
    const attrs = { antialias: opts.antialias ?? true, alpha: opts.alpha ?? false };
    const context =
      (canvas.getContext("webgl2", attrs) as WebGLRenderingContext | null) ||
      (canvas.getContext("webgl", attrs) as WebGLRenderingContext | null);
    if (!context || typeof context.getParameter !== "function") return null;
    // Some broken stacks hand back a context object whose first real GL call
    // fails. Exercise it once before trusting it.
    if (context.getParameter(context.VERSION) == null) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (THREE_NS as any).WebGLRenderer({ canvas, context, ...attrs });
  } catch {
    return null;
  }
}

export function isWebGLAvailable(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      (canvas.getContext("webgl2") as WebGLRenderingContext | null) ||
      (canvas.getContext("webgl") as WebGLRenderingContext | null) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    return !!gl && typeof (gl as WebGLRenderingContext).getParameter === "function";
  } catch {
    return false;
  }
}
