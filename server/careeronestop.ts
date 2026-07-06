import { db } from "./storage";
import { employerPartners, jobPostings } from "../shared/schema";
import { eq } from "drizzle-orm";

const COS_BASE = "https://api.careeronestop.org/v1";
const COS_USER_ID = (process.env.CAREERONESTOP_USER_ID ?? "").trim();
const COS_API_KEY = (process.env.CAREERONESTOP_API_KEY ?? "").trim();

interface CosJobResult {
  JobID: string;
  JobTitle: string;
  Company: string;
  LocationDetails?: { City?: string; State?: string; PostalCode?: string };
  Pay?: { PayRateMin?: number; PayRateMax?: number; RateType?: string };
  JobDescription?: string;
  Requirements?: string;
  DatePosted?: string;
  OnetCode?: string;
}

const ONET_TO_CREDENTIAL: Record<string, string> = {
  "47-2111": "electrical",
  "47-2152": "plumbing",
  "49-9021": "hvac",
  "51-4121": "welding",
  "49-3023": "automotive",
  "45-2091": "ag-tech",
};

function inferCredentialTags(title: string, onetCode?: string): string[] {
  const tags: string[] = [];
  const t = title.toLowerCase();
  if (t.includes("electric")) tags.push("electrical");
  if (t.includes("plumb")) tags.push("plumbing");
  if (t.includes("hvac") || t.includes("refriger") || t.includes("air condition")) tags.push("hvac");
  if (t.includes("weld")) tags.push("welding");
  if (t.includes("auto") || t.includes("mechanic") || t.includes("technician")) tags.push("automotive");
  if (onetCode) {
    const prefix = onetCode.substring(0, 7);
    if (ONET_TO_CREDENTIAL[prefix]) tags.push(ONET_TO_CREDENTIAL[prefix]);
  }
  return [...new Set(tags)];
}

export async function fetchCareerOneStopJobs(params: {
  keyword?: string;
  location?: string;
  radius?: number;
  limit?: number;
}): Promise<CosJobResult[]> {
  if (!COS_USER_ID || !COS_API_KEY) {
    console.warn("[careeronestop] API credentials not configured. Set CAREERONESTOP_USER_ID and CAREERONESTOP_API_KEY.");
    return [];
  }

  const keyword = encodeURIComponent(params.keyword ?? "electrician plumber hvac welder automotive");
  const location = encodeURIComponent(params.location ?? "Austin, TX");
  const radius = params.radius ?? 25;
  const limit = params.limit ?? 50;

  const url = `${COS_BASE}/jobsearch/${COS_USER_ID}/${keyword}/${location}/${radius}/0/0/0/0/0/${limit}?enableJobFilter=0`;

  try {
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${COS_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "(unreadable)");
      console.error(`[careeronestop] API error: ${res.status} — URL: ${url.replace(COS_USER_ID, "***")} — Body: ${body.slice(0, 200)}`);
      return [];
    }

    const data = await res.json();
    return data.Jobs ?? [];
  } catch (err) {
    console.error("[careeronestop] fetch error:", err);
    return [];
  }
}

export async function syncCareerOneStopJobs(): Promise<{ synced: number; skipped: number }> {
  const jobs = await fetchCareerOneStopJobs({});
  let synced = 0;
  let skipped = 0;

  let [cosEmployer] = await db.select().from(employerPartners)
    .where(eq(employerPartners.companyName, "CareerOneStop (DOL)"));

  if (!cosEmployer) {
    [cosEmployer] = await db.insert(employerPartners).values({
      companyName: "CareerOneStop (DOL)",
      industry: "Multiple",
      banTheBox: false,
      fairChanceHiring: false,
      barrierFriendly: true,
      description: "Federal job listings from the U.S. Department of Labor CareerOneStop network.",
      website: "https://www.careeronestop.org",
      partnershipStatus: "active",
    }).returning();
  }

  for (const job of jobs) {
    if (!job.JobTitle || !job.Company) { skipped++; continue; }

    const credentialTags = inferCredentialTags(job.JobTitle, job.OnetCode);
    const wageMin = job.Pay?.PayRateMin ? Math.round(job.Pay.PayRateMin * 100) : undefined;
    const wageMax = job.Pay?.PayRateMax ? Math.round(job.Pay.PayRateMax * 100) : undefined;
    const wageRange = wageMin && wageMax
      ? `$${(wageMin/100).toFixed(2)}–$${(wageMax/100).toFixed(2)}/hr`
      : wageMin ? `$${(wageMin/100).toFixed(2)}/hr` : undefined;

    try {
      await db.insert(jobPostings).values({
        employerId: cosEmployer.id,
        title: job.JobTitle,
        description: job.JobDescription ?? job.JobTitle,
        wageRange,
        location: [
          job.LocationDetails?.City,
          job.LocationDetails?.State,
        ].filter(Boolean).join(", ") || "Austin, TX",
        requirements: job.Requirements,
        barrierFriendly: true,
        credentialTags,
        wageMin,
        wageMax,
        status: "open",
      } as any).onConflictDoNothing();
      synced++;
    } catch { skipped++; }
  }

  console.log(`[careeronestop] Sync complete: ${synced} synced, ${skipped} skipped`);
  return { synced, skipped };
}
