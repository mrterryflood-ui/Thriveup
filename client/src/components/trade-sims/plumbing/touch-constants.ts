/**
 * Touch-target sizing for the plumbing SVG canvas.
 *
 * The canvas renders in an 820x440 viewBox scaled down to the container
 * width, so SVG units SHRINK on phones: at the 390px mobile viewport the
 * scale is ~390/820 = 0.476. Any invisible hit geometry must therefore be
 * sized in *scaled screen pixels*, not raw viewBox units — a 24-unit hit
 * band is only ~11px on a phone and effectively untappable.
 *
 * scripts/verify-touch-targets.ts asserts these constants keep every hit
 * target >= MIN_TOUCH_PX at MIN_VIEWPORT_W so the requirement cannot
 * silently regress.
 */

/** Canvas viewBox dimensions (must match CW/CH in visual-plumbing-canvas). */
export const CANVAS_VIEWBOX_W = 820;
export const CANVAS_VIEWBOX_H = 440;

/** Minimum effective touch-target size (CSS px) at the narrowest viewport. */
export const MIN_TOUCH_PX = 32;
export const MIN_VIEWPORT_W = 390;

/** Invisible wire hit-path stroke width, in viewBox units. */
export const WIRE_HIT_STROKE = 72;

/** Invisible terminal hit-circle radius, in viewBox units. */
export const TERMINAL_HIT_R = 36;

/** Effective on-screen size (CSS px) of a viewBox-unit length at a viewport width. */
export function scaledPx(units: number, viewportW: number = MIN_VIEWPORT_W): number {
  return (units * viewportW) / CANVAS_VIEWBOX_W;
}
