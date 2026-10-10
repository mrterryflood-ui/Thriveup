import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { HUTTO_READY_LINKS, HUTTO_READY_TITLE, type HuttoPlatformKey } from "@shared/hutto-ready";

/** Shared "Hutto Ready" cross-platform strip (same six links, same order on every platform). */
export function HuttoReadyStrip({ current = "thriveup" }: { current?: HuttoPlatformKey }) {
  return (
    <nav aria-labelledby="hutto-ready-strip-title" className="border border-[#b8b9aa] bg-[#e9e8de] p-4 md:p-5" data-testid="hutto-ready-strip">
      <h2 id="hutto-ready-strip-title" className="font-mono text-[11px] font-semibold uppercase tracking-[.18em] text-[#9c472f]">{HUTTO_READY_TITLE}</h2>
      <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        {HUTTO_READY_LINKS.map((link, i) => {
          const here = link.key === current;
          const body = (
            <>
              <span className="block font-mono text-[10px] text-[#9c472f]">{String(i + 1).padStart(2, "0")}</span>
              <span className="block text-sm font-semibold leading-snug">{link.name}</span>
              <span className="block text-xs text-[#4f5d55]">{link.label}</span>
              {here && <span className="mt-1 inline-block rounded-full bg-[#18352b] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#f3f0e5]">You are here</span>}
            </>
          );
          const cls = `group flex min-h-[84px] h-full flex-col justify-between rounded-md border px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b74b30] ${here ? "border-[#18352b] bg-[#f2f0e7]" : "border-[#b8b9aa] bg-[#f7f6f0] hover:border-[#b74b30]"}`;
          return (
            <li key={link.key}>
              {here ? (
                <Link href="/hutto" aria-current="page" className={cls} data-testid={`hutto-strip-${link.key}`}>{body}</Link>
              ) : (
                <a href={link.href} target="_blank" rel="noopener noreferrer" className={cls} data-testid={`hutto-strip-${link.key}`} aria-label={`${link.name} — ${link.label} (opens in a new tab)`}>
                  {body}
                  <ArrowUpRight size={14} className="self-end text-[#9c472f]" aria-hidden="true" />
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
