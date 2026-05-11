import { Phone } from "lucide-react";

/**
 * Always-visible crisis routing strip used on every foster-youth page.
 * Stable test IDs the congruence audit asserts on every page:
 *   - banner-crisis
 *   - link-crisis-988
 *   - link-crisis-text
 *   - link-crisis-runaway
 */
export function CrisisStrip() {
  return (
    <div className="bg-rose-50 dark:bg-rose-950/30 border-b border-rose-200 dark:border-rose-900" data-testid="banner-crisis">
      <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="font-medium text-rose-900 dark:text-rose-100">In crisis right now?</span>
        <a href="tel:988" className="inline-flex items-center gap-1 underline font-semibold text-rose-700 dark:text-rose-300" data-testid="link-crisis-988">
          <Phone className="h-3 w-3" /> 988 — Suicide &amp; Crisis Lifeline
        </a>
        <a href="sms:741741?body=HOME" className="inline-flex items-center gap-1 underline font-semibold text-rose-700 dark:text-rose-300" data-testid="link-crisis-text">
          Text HOME to 741741
        </a>
        <a href="tel:18007865437" className="inline-flex items-center gap-1 underline font-semibold text-rose-700 dark:text-rose-300" data-testid="link-crisis-runaway">
          1-800-RUNAWAY
        </a>
      </div>
    </div>
  );
}
