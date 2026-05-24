import { useEffect, useState } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { Link } from "wouter";

type Submission = {
  id: string;
  title: string;
  prime: string;
  due: Date;
  href: string;
};

const SUBMISSIONS_THIS_WEEK: Submission[] = [
  {
    id: "sedgwick-26-0028",
    title: "Sedgwick County RFP #26-0028 — Vitality Weight Management",
    prime: "HIS Prime · TCAF/Love/Vanntastic subs",
    due: new Date("2026-06-02T13:45:00-05:00"),
    href: "/grants/sedgwick-vitality",
  },
  {
    id: "lake-worth-2026-0400-26",
    title: "Lake Worth ISD RFP #2026-0400-26 — K-12 PD/Services",
    prime: "TCAF Prime · HIS compliance sub",
    due: new Date("2026-06-04T17:00:00-05:00"),
    href: "/grant-command-center",
  },
];

function formatCountdown(target: Date, now: Date): { text: string; severity: "critical" | "urgent" | "soon" } {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return { text: "PAST DUE", severity: "critical" };
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  let text: string;
  if (days >= 1) text = `${days}d ${hours}h`;
  else if (hours >= 1) text = `${hours}h ${mins}m`;
  else text = `${mins}m`;
  const severity: "critical" | "urgent" | "soon" =
    ms < 24 * 3_600_000 ? "critical" : ms < 72 * 3_600_000 ? "urgent" : "soon";
  return { text, severity };
}

export function SubmissionRemindersBanner() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const active = SUBMISSIONS_THIS_WEEK.filter(
    (s) => s.due.getTime() - now.getTime() > -3_600_000,
  );
  if (active.length === 0) return null;

  return (
    <div
      role="alert"
      aria-label="This-week submission reminders"
      className="w-full border-b border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100"
      data-testid="banner-submission-reminders"
    >
      <div className="px-3 py-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
        <div className="flex items-center gap-2 font-semibold shrink-0">
          <AlertTriangle className="h-4 w-4" />
          <span>Due this week:</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {active.map((s) => {
            const { text, severity } = formatCountdown(s.due, now);
            const sevClass =
              severity === "critical"
                ? "bg-red-600 text-white"
                : severity === "urgent"
                ? "bg-orange-600 text-white"
                : "bg-amber-600 text-white";
            return (
              <Link
                key={s.id}
                href={s.href}
                className="flex items-center gap-2 hover:underline"
                data-testid={`link-reminder-${s.id}`}
              >
                <span
                  className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${sevClass}`}
                  data-testid={`countdown-${s.id}`}
                >
                  <Clock className="h-3 w-3" /> {text}
                </span>
                <span className="font-medium">{s.title}</span>
                <span className="text-amber-700 dark:text-amber-300 hidden md:inline">
                  · {s.prime}
                </span>
                <span className="text-amber-700 dark:text-amber-300">
                  · {s.due.toLocaleString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    timeZoneName: "short",
                  })}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
