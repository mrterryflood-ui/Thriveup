import { useState, useEffect } from "react";

interface JobPosting {
  id: string;
  title: string;
  description: string;
  wageRange?: string;
  hoursPerWeek?: string;
  benefits?: string;
  requirements?: string;
  barrierFriendly: boolean;
  location?: string;
  status: string;
  createdAt: string;
}

interface Employer {
  id: string;
  companyName: string;
  industry: string;
  banTheBox: boolean;
  fairChanceHiring: boolean;
  barrierFriendly: boolean;
  description?: string;
  location?: string;
  website?: string;
}

interface JobWithEmployer {
  job: JobPosting;
  employer: Employer | null;
}

interface MatchResult {
  credentialsEarned: string[];
  fairChanceMatches: Array<{
    employer: Employer;
    matchReason: string[];
    openPostings: JobPosting[];
  }>;
  allFairChanceJobs: JobPosting[];
}

export default function JobBoard() {
  const [jobs, setJobs] = useState<JobWithEmployer[]>([]);
  const [matches, setMatches] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"all" | "matched">("matched");
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Fair-Chance Job Board | ThriveUp Academy";
    Promise.allSettled([
      fetch("/api/workforce/jobs").then((r) => r.json()),
      fetch("/api/workforce/match/me").then((r) => r.ok ? r.json() : null),
    ]).then(([jobsRes, matchRes]) => {
      if (jobsRes.status === "fulfilled" && Array.isArray(jobsRes.value)) {
        setJobs(jobsRes.value);
      }
      if (matchRes.status === "fulfilled" && matchRes.value?.fairChanceMatches) {
        setMatches(matchRes.value);
      }
      setLoading(false);
    });
  }, []);

  const displayJobs =
    view === "matched" && matches?.fairChanceMatches?.length
      ? matches.fairChanceMatches.flatMap((m) =>
          m.openPostings.map((p) => ({
            job: p,
            employer: m.employer,
            matchReasons: m.matchReason,
          }))
        )
      : jobs.map((j) => ({ ...j, matchReasons: [] as string[] }));

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="bg-white border-b border-slate-200 px-10 py-6">
        <div className="text-xs tracking-widest uppercase text-emerald-600 mb-1">
          ThriveUp Academy · Career Center
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1" data-testid="heading-job-board">
          Fair-Chance Job Board
        </h1>
        <p className="text-sm text-slate-500">
          Every employer here has a ban-the-box or fair-chance hiring policy.
        </p>
      </div>

      {matches?.credentialsEarned && matches.credentialsEarned.length > 0 && (
        <div className="bg-emerald-50 border-b border-emerald-100 px-10 py-3 flex items-center gap-3 flex-wrap" data-testid="banner-credentials">
          <span className="text-sm font-semibold text-emerald-900">Your credentials:</span>
          {matches.credentialsEarned.map((c) => (
            <span
              key={c}
              className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-semibold capitalize"
              data-testid={`badge-credential-${c}`}
            >
              {c}
            </span>
          ))}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex gap-2 mb-6">
          {([
            { id: "matched" as const, label: `Matched to your credentials (${matches?.fairChanceMatches.length ?? 0})` },
            { id: "all" as const, label: `All fair-chance jobs (${jobs.length})` },
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              data-testid={`button-view-${id}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === id
                  ? "bg-slate-900 text-white"
                  : "bg-transparent border border-slate-200 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center text-slate-400 py-16" data-testid="text-loading-jobs">
            Loading jobs…
          </div>
        )}

        {!loading && displayJobs.length === 0 && (
          <div className="text-center text-slate-400 py-16" data-testid="text-no-jobs">
            {view === "matched"
              ? "Complete trade sims to earn credentials and unlock matched jobs."
              : "No open fair-chance jobs at this time. Check back soon."}
          </div>
        )}

        <div className="grid gap-4">
          {displayJobs.map(({ job, employer, matchReasons }) => (
            <div
              key={job.id}
              onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
              data-testid={`card-job-${job.id}`}
              className={`bg-white rounded-xl p-5 cursor-pointer transition-all ${
                selectedJob === job.id
                  ? "border-2 border-emerald-400 shadow-sm"
                  : "border border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex justify-between items-start flex-wrap gap-3">
                <div>
                  <div className="text-base font-bold text-slate-900 mb-1">{job.title}</div>
                  <div className="text-sm text-slate-500">
                    {employer?.companyName ?? "Employer"} · {job.location ?? employer?.location ?? "Location TBD"}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {job.wageRange && (
                    <span className="text-base font-bold text-emerald-600" data-testid={`text-wage-${job.id}`}>
                      {job.wageRange}
                    </span>
                  )}
                  <div className="flex gap-1.5 flex-wrap">
                    {employer?.banTheBox && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
                        Ban the Box
                      </span>
                    )}
                    {employer?.fairChanceHiring && (
                      <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">
                        Fair Chance
                      </span>
                    )}
                    {job.barrierFriendly && (
                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">
                        Barrier Friendly
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {matchReasons && matchReasons.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {matchReasons.map((r) => (
                    <span
                      key={r}
                      className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded"
                    >
                      ✓ {r}
                    </span>
                  ))}
                </div>
              )}

              {selectedJob === job.id && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-700 leading-relaxed mb-3">{job.description}</p>
                  {job.requirements && (
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        Requirements
                      </div>
                      <div className="text-sm text-slate-700">{job.requirements}</div>
                    </div>
                  )}
                  {job.benefits && (
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        Benefits
                      </div>
                      <div className="text-sm text-slate-700">{job.benefits}</div>
                    </div>
                  )}
                  {employer?.website ? (
                    <a
                      href={employer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      data-testid={`link-employer-${employer.id}`}
                      className="inline-block px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      Learn more at {employer.companyName} →
                    </a>
                  ) : (
                    <div className="text-sm text-slate-500">
                      Contact your facilitator to apply for this position.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
