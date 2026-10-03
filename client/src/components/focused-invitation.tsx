import { lazy, Suspense, useState } from "react";
const Invitation = lazy(() => import("@/components/integration-invitation").then(module => ({ default: module.IntegrationInvitation })));

export function FocusedInvitation() {
  const [open, setOpen] = useState(false);
  return <section className="mt-8 border-t border-[#d4dfd7] pt-5" aria-label="Community participation">
    <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls="focused-invitation-form" aria-label="Explore contributing your community experience" data-testid="focused-invitation-toggle" className="min-h-11 text-sm font-semibold text-[#3c7065] underline">Contribute your community experience</button>
    <p className="text-xs text-[#687c73]">Optional participation, with your own consent choices.</p>
    <div id="focused-invitation-form" hidden={!open} className="mt-4">{open && <Suspense fallback={<p role="status">Loading participation options…</p>}><Invitation surface="public-site" surfaceContext="focused-platform-entry" /></Suspense>}</div>
  </section>;
}