/**
 * ConceptDiagram — renders the authored `diagramKey` for a Trade Sims lesson.
 *
 * Two tiers:
 *   1. SVG diagrams (default) — animated, labeled, theme-aware, they TEACH the
 *      concept. Cheap, inline, always in the bundle.
 *   2. Flagship 3D (4 keys) — vanilla Three.js, lazy-loaded so `three` never
 *      bloats the lesson bundle unless the learner opens a 3D concept. Rotating
 *      / touch-interactive. Follows the community-impact viz3d mount/cleanup
 *      discipline (useEffect mount, dispose renderer on unmount, cap pixel
 *      ratio, handle resize).
 *
 * FAIL-SOFT (never take the lesson page down): 3D is only shown when WebGL is
 * available and the renderer constructs cleanly. THREE layers of defense:
 *   (a) each 3D component probes WebGL + wraps `new WebGLRenderer` in try/catch
 *       and calls `onError` instead of throwing;
 *   (b) an ErrorBoundary here catches anything a 3D component (or its lazy
 *       import) still throws during render;
 *   (c) on either signal we render the matching 2D SVG twin (SVG_FALLBACKS),
 *       which teaches the same concept flat. Never a blank crash or overlay.
 *
 * Unknown / missing diagramKey → render NOTHING (no placeholder junk).
 *
 * Mobile-first: the 3D wrapper is height-capped and `touch-action: none` on the
 * canvas so a drag rotates the model without trapping page scroll.
 */
import { Component, lazy, Suspense, useState, type ReactNode } from "react";
import { SVG_DIAGRAMS, SVG_FALLBACKS } from "./diagrams/svg-diagrams";

// Lazy 3D — each import() is its own chunk pulling in `three`.
const ThreeWaterHead = lazy(() => import("./diagrams/three-water-head"));
const ThreeSeriesCircuit = lazy(() => import("./diagrams/three-series-circuit"));
const ThreeRefrigeration = lazy(() => import("./diagrams/three-refrigeration"));
const ThreeWeldJoint = lazy(() => import("./diagrams/three-weld-joint"));

type Diagram3DComponent = React.LazyExoticComponent<
  (props: { onError?: () => void }) => JSX.Element
>;

const THREE_DIAGRAMS: Record<string, Diagram3DComponent> = {
  "water-head-column": ThreeWaterHead,
  "series-circuit-flow": ThreeSeriesCircuit,
  "refrigeration-cycle": ThreeRefrigeration,
  "weld-joint-geometry": ThreeWeldJoint,
};

// One-line caption per diagram so a learner knows what they are looking at and,
// for 3D, how to interact. Keyed by diagramKey. Missing key → no caption.
const CAPTIONS: Record<string, string> = {
  "water-head-column": "Drag to rotate · pressure at the base rises with column height (head)",
  "series-circuit-flow": "Drag to rotate · watch identical current circulate the whole loop",
  "refrigeration-cycle": "Drag to rotate · warm on the high-pressure side, cool on the low side",
  "weld-joint-geometry": "Drag to rotate · leg and throat define the fillet's strength",
};

/**
 * Second line of defense: catches any error thrown while rendering the lazy 3D
 * subtree (chunk load failure, an unexpected throw during mount, etc.) and
 * calls `onFail` so the parent swaps in the 2D twin. Renders nothing itself
 * while failing — the parent owns the fallback UI.
 */
class Diagram3DBoundary extends Component<
  { onFail: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

/** Render a flat SVG twin for a flagship key (used when 3D is unavailable). */
function FallbackSvg({ diagramKey }: { diagramKey: string }) {
  const Twin = SVG_FALLBACKS[diagramKey];
  const caption = CAPTIONS[diagramKey];
  if (!Twin) return null;
  return (
    <figure
      className="rounded-lg border border-border bg-muted/30 px-3 py-3 text-foreground"
      data-testid={`concept-diagram-svg-fallback-${diagramKey}`}
    >
      <Twin />
      {caption && (
        <figcaption className="text-xs text-muted-foreground pt-2 text-center">
          {caption.replace(/^Drag to rotate · /, "")}
        </figcaption>
      )}
    </figure>
  );
}

export function ConceptDiagram({ diagramKey }: { diagramKey?: string | null }) {
  // When a 3D diagram can't run (no WebGL / renderer throws / chunk fails), we
  // flip this and render the 2D twin instead. Hooks must run unconditionally,
  // so this is declared before any early return.
  const [use3DFailed, setUse3DFailed] = useState(false);

  if (!diagramKey) return null;

  const ThreeComp = THREE_DIAGRAMS[diagramKey];
  const SvgComp = SVG_DIAGRAMS[diagramKey];

  // Unknown key: render nothing.
  if (!ThreeComp && !SvgComp) return null;

  const caption = CAPTIONS[diagramKey];

  if (ThreeComp) {
    // Fell back already → show the flat twin.
    if (use3DFailed) return <FallbackSvg diagramKey={diagramKey} />;

    return (
      <figure
        className="rounded-lg border border-border bg-slate-950 overflow-hidden"
        data-testid={`concept-diagram-3d-${diagramKey}`}
      >
        <div style={{ height: 300 }} className="w-full">
          <Diagram3DBoundary onFail={() => setUse3DFailed(true)}>
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                  Loading 3D model…
                </div>
              }
            >
              <ThreeComp onError={() => setUse3DFailed(true)} />
            </Suspense>
          </Diagram3DBoundary>
        </div>
        {caption && (
          <figcaption className="text-xs text-slate-400 px-3 py-2 text-center">{caption}</figcaption>
        )}
      </figure>
    );
  }

  // SVG diagram (default tier).
  const Svg = SvgComp!;
  return (
    <figure
      className="rounded-lg border border-border bg-muted/30 px-3 py-3 text-foreground"
      data-testid={`concept-diagram-svg-${diagramKey}`}
    >
      <Svg />
      {caption && <figcaption className="text-xs text-muted-foreground pt-2 text-center">{caption}</figcaption>}
    </figure>
  );
}

export default ConceptDiagram;
