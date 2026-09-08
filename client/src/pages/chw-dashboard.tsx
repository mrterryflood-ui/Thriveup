import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";
import { TrainingGuideButton } from "@/components/training-guide";
// DIS Alignment Condition 2 + 3
import { ConsentDisclosure } from "@/components/consent-disclosure";
import { AIAugmentationDisclosure } from "@/components/ai-augmentation-disclosure";
import {
  Heart, Users, Shield, ClipboardCheck, MapPin, Phone,
  Calendar, Activity, ChevronRight, CheckCircle2, AlertTriangle,
  Clock, Home, FileText, Star, GraduationCap, BookOpen,
  Stethoscope, Brain, ExternalLink, Plus, TrendingUp,
  ArrowRight, Sparkles, Building2, UserCheck, Clipboard, Lightbulb, Loader2,
  Copy, Send, ShieldAlert,
} from "lucide-react";

interface ScreeningReferral {
  id: string;
  clientName: string;
  screeningType: string;
  referralDate: string;
  status: string;
  provider: string;
  notes: string;
  priority: string;
}

interface HomeVisit {
  id: string;
  clientName: string;
  clientDisplayName?: string | null;
  clientScreeningId?: string | null;
  caseRef?: { screeningId: string; label: string } | null;
  visitDate: string;
  visitType: string;
  duration: number;
  notes: string;
  followUpNeeded: boolean;
  followUpDate: string | null;
}

interface CommunityResource {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  hours: string;
  description: string;
  acceptingClients: boolean;
  website?: string;
}

interface TrainingModule {
  id: string;
  title: string;
  category: string;
  description: string;
  duration: string;
  status: string;
  completedDate: string | null;
}

interface FunderOption {
  id: string;
  name: string;
}

interface SentReferral {
  id: string;
  programCode?: string;
  orgName?: string;
  clientDisplayName?: string | null;
  status: string;
  createdAt?: string;
  resolvedAt?: string | null;
  benefitValueEstimate?: number | null;
  valueSource?: string | null;
  statusUrl?: string;
  /** Org confirmation URL — present only for referrals this CHW created.
   *  Server scopes this to req.user.id so CHW A cannot see CHW B's tokens. */
  orgConfirmUrl?: string | null;
}

interface CreateReferralResponse {
  id?: string;
  statusUrl?: string;
  orgConfirmUrl?: string;
}

type ThreeRealitiesDiagnostic = {
  researchReality?: { summary?: string; citations?: string[]; keyFindings?: string[] };
  politicalReality?: { summary?: string; barriers?: string[]; funderAlignment?: string | null };
  groundTruth?: { observationCount?: number; themes?: string[]; summary?: string };
  gapDiagnosis?: { primaryGap?: string; cfirDomain?: string | null; ericStrategy?: string | null };
};

type WsrcaCounty = {
  county: string;
  stateFips: string;
  countyFips: string;
  totalProviders: number | null;
  licensedProviders: number | null;
  totalLicensedCapacity: number | null;
  estimatedDemand: number | null;
  slotGap: number | null;
  coverageRate: number | null;
  dataSource?: string;
  retrievedAt?: string;
  warnings: string[];
  error?: string;
};

type WsrcaOverview = {
  footprint: string;
  counties: WsrcaCounty[];
  retrievedAt: string;
};

type ChildcareSearchData = {
  stateFips: string;
  countyFips: string;
  county: string;
  displayName: string;
  summary: {
    totalProviders: number | null;
    totalLicensedCapacity: number | null;
    dataSource: string;
    retrievedAt: string;
  };
  slotGap: {
    estimatedDemand: number | null;
    slotGap: number | null;
    coverageRate: number | null;
    methodology: string;
    dataSource: string;
  };
  warnings: string[];
};

function childcareNumber(value: unknown, field: string, allowMissing = false, allowNegative = false): number | null {
  if (value === null || (allowMissing && value === undefined)) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || (!allowNegative && value < 0)) {
    throw new Error(`Childcare response has an invalid ${field}.`);
  }
  return value;
}

function childcareCount(value: unknown, field: string, allowMissing = false, allowNegative = false): number | null {
  const parsed = childcareNumber(value, field, allowMissing, allowNegative);
  if (parsed !== null && !Number.isSafeInteger(parsed)) {
    throw new Error(`Childcare response has an invalid ${field}.`);
  }
  return parsed;
}

function childcareRate(value: unknown, field: string, allowMissing = false): number | null {
  const parsed = childcareNumber(value, field, allowMissing);
  if (parsed !== null && (parsed < 0 || parsed > 1)) {
    throw new Error(`Childcare response has an invalid ${field}.`);
  }
  return parsed;
}

function childcareFips(value: unknown, field: string, digits: 2 | 3): string {
  const parsed = childcareText(value, field);
  if (!new RegExp(`^\\d{${digits}}$`).test(parsed)) {
    throw new Error(`Childcare response has an invalid ${field}.`);
  }
  return parsed;
}

function childcareText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Childcare response has an invalid ${field}.`);
  }
  return value;
}

function childcareWarnings(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) throw new Error(`Childcare response has invalid ${field}.`);
  return value.map((warning, index) => childcareText(warning, `${field} ${index + 1}`));
}

function normalizeWsrcaOverview(raw: unknown): WsrcaOverview {
  if (!raw || typeof raw !== "object") throw new Error("WSRCA childcare response was not an object.");
  const value = raw as Record<string, unknown>;
  if (!Array.isArray(value.counties)) throw new Error("WSRCA childcare response is missing counties.");
  const counties = value.counties.map((rawCounty, index): WsrcaCounty => {
    if (!rawCounty || typeof rawCounty !== "object") throw new Error(`WSRCA county ${index + 1} is invalid.`);
    const county = rawCounty as Record<string, unknown>;
    const hasError = county.error !== undefined;
    const metricFields = [
      "totalProviders",
      "licensedProviders",
      "totalLicensedCapacity",
      "estimatedDemand",
      "slotGap",
      "coverageRate",
    ];
    if (!hasError && metricFields.some((field) => county[field] === undefined)) {
      throw new Error(`WSRCA county ${index + 1} is missing metric data.`);
    }
    const normalized: WsrcaCounty = {
      county: childcareText(county.county, `WSRCA county ${index + 1} name`),
      stateFips: childcareFips(county.stateFips, `WSRCA county ${index + 1} state FIPS`, 2),
      countyFips: childcareFips(county.countyFips, `WSRCA county ${index + 1} county FIPS`, 3),
      totalProviders: childcareCount(county.totalProviders, "total providers", hasError),
      licensedProviders: childcareCount(county.licensedProviders, "licensed providers", hasError),
      totalLicensedCapacity: childcareCount(county.totalLicensedCapacity, "licensed capacity", hasError),
      estimatedDemand: childcareCount(county.estimatedDemand, "estimated demand", hasError),
      slotGap: childcareCount(county.slotGap, "slot gap", hasError, true),
      coverageRate: childcareRate(county.coverageRate, "coverage rate", hasError),
      warnings: hasError && county.warnings === undefined
        ? []
        : childcareWarnings(county.warnings, `WSRCA county ${index + 1} warnings`),
    };
    if (!hasError) {
      normalized.dataSource = childcareText(county.dataSource, "data source");
      normalized.retrievedAt = childcareText(county.retrievedAt, "retrieval time");
      if (!Number.isFinite(Date.parse(normalized.retrievedAt))) throw new Error(`WSRCA county ${index + 1} has an invalid retrieval time.`);
    }
    if (county.error !== undefined) normalized.error = childcareText(county.error, "county error");
    return normalized;
  });
  return {
    footprint: childcareText(value.footprint, "WSRCA footprint"),
    counties,
    retrievedAt: childcareText(value.retrievedAt, "WSRCA retrieval time"),
  };
}

function normalizeChildcareSearch(raw: unknown): ChildcareSearchData {
  if (!raw || typeof raw !== "object") throw new Error("Childcare search response was not an object.");
  const value = raw as Record<string, unknown>;
  const summary = value.summary;
  const slotGap = value.slotGap;
  if (!summary || typeof summary !== "object" || !slotGap || typeof slotGap !== "object") {
    throw new Error("Childcare search response is missing summary data.");
  }
  const summaryValue = summary as Record<string, unknown>;
  const slotGapValue = slotGap as Record<string, unknown>;
  return {
    stateFips: childcareFips(value.stateFips, "state FIPS", 2),
    countyFips: childcareFips(value.countyFips, "county FIPS", 3),
    county: childcareText(value.county, "county"),
    displayName: childcareText(value.displayName, "display name"),
    summary: {
      totalProviders: childcareCount(summaryValue.totalProviders, "total providers"),
      totalLicensedCapacity: childcareCount(summaryValue.totalLicensedCapacity, "licensed capacity"),
      dataSource: childcareText(summaryValue.dataSource, "summary data source"),
      retrievedAt: childcareText(summaryValue.retrievedAt, "retrieval time"),
    },
    slotGap: {
      estimatedDemand: childcareCount(slotGapValue.estimatedDemand, "estimated demand"),
      slotGap: childcareCount(slotGapValue.slotGap, "slot gap", false, true),
      coverageRate: childcareRate(slotGapValue.coverageRate, "coverage rate"),
      methodology: childcareText(slotGapValue.methodology, "slot-gap methodology"),
      dataSource: childcareText(slotGapValue.dataSource, "slot-gap data source"),
    },
    warnings: childcareWarnings(value.warnings, "search warnings"),
  };
}


// DEMO placeholder records — shown only when the live Partner API is not connected.
// Phone numbers use the non-dialable 555-01xx range (NANP reserved) so a CHW
// cannot accidentally call a real number from stale sample data.
// Names and websites are real Austin-area orgs for reference only;
// always verify current contact info before making a referral.
const SAMPLE_RESOURCES: CommunityResource[] = [
  { id: "cr-1", name: "CommUnityCare Health Centers", category: "Primary Care", address: "123 Main St", phone: "(512) 555-0101", hours: "Mon-Fri 8am-6pm", description: "Sliding-scale primary care, behavioral health, dental", acceptingClients: true, website: "https://communitycaretx.org" },
  { id: "cr-2", name: "Austin Travis County Integral Care", category: "Mental Health", address: "456 Oak Ave", phone: "(512) 555-0102", hours: "Mon-Sat 9am-7pm", description: "Counseling, substance use treatment, crisis services", acceptingClients: true, website: "https://integralcare.org" },
  { id: "cr-3", name: "Central Texas Food Bank", category: "Food Access", address: "789 Elm St", phone: "(512) 555-0103", hours: "Tue-Thu 10am-4pm", description: "Emergency food, nutrition education, SNAP enrollment assistance", acceptingClients: true, website: "https://centraltexasfoodbank.org" },
  { id: "cr-4", name: "LifeWorks", category: "Housing", address: "321 Pine Rd", phone: "(512) 555-0104", hours: "Mon-Fri 9am-5pm", description: "Rapid rehousing, emergency shelter referrals, landlord mediation", acceptingClients: false, website: "https://lifeworksaustin.org" },
  { id: "cr-5", name: "Workforce Solutions Capital Area", category: "Employment", address: "654 Cedar Blvd", phone: "(512) 555-0105", hours: "Mon-Fri 8am-5pm", description: "Job training, resume workshops, career counseling, GED programs", acceptingClients: true, website: "https://workforcesolutionscapitalarea.com" },
  { id: "cr-6", name: "Austin Public Health WIC", category: "Maternal Health", address: "987 Maple Dr", phone: "(512) 555-0106", hours: "Mon-Wed-Fri 8am-4pm", description: "WIC enrollment, prenatal care coordination, breastfeeding support", acceptingClients: true, website: "https://www.austintexas.gov/health/programs/women-infants-and-children-wic" },
  { id: "cr-7", name: "Austin Recovery", category: "Prevention", address: "147 Birch Ln", phone: "(512) 555-0107", hours: "Mon-Fri 9am-6pm", description: "Prevention education, youth programs, naloxone training", acceptingClients: true, website: "https://www.infiniterecovery.com" },
  { id: "cr-8", name: "Texas RioGrande Legal Aid", category: "Legal", address: "258 Walnut St", phone: "(512) 555-0108", hours: "Mon-Thu 9am-5pm", description: "Free legal representation, immigration assistance, tenant rights", acceptingClients: true, website: "https://www.trla.org" },
];

const SAMPLE_TRAININGS: TrainingModule[] = [
  { id: "tr-1", title: "CHW Core Competencies", category: "Foundational", description: "Comprehensive overview of the 10 CHW core competencies including communication, advocacy, and cultural mediation.", duration: "8 hours", status: "completed", completedDate: "2026-02-15" },
  { id: "tr-2", title: "Motivational Interviewing", category: "Skills", description: "Evidence-based communication technique to strengthen personal motivation for change.", duration: "6 hours", status: "completed", completedDate: "2026-03-01" },
  { id: "tr-3", title: "Behavioral Health First Aid", category: "Clinical", description: "Recognize signs of mental health and substance use disorders; provide initial help and guide to appropriate care.", duration: "8 hours", status: "in_progress", completedDate: null },
  { id: "tr-4", title: "Trauma-Informed Care", category: "Clinical", description: "Understanding trauma and its impact on health; applying trauma-informed principles in community settings.", duration: "4 hours", status: "not_started", completedDate: null },
  { id: "tr-5", title: "Health Equity & Social Determinants", category: "Knowledge", description: "Understanding how social, economic, and environmental factors affect health outcomes in communities.", duration: "4 hours", status: "not_started", completedDate: null },
  { id: "tr-6", title: "Chronic Disease Self-Management", category: "Clinical", description: "Stanford model for helping clients manage chronic conditions through goal-setting and action planning.", duration: "6 hours", status: "not_started", completedDate: null },
  { id: "tr-7", title: "Cultural Humility in Practice", category: "Foundational", description: "Ongoing self-reflection and culturally responsive practices for serving diverse communities.", duration: "3 hours", status: "completed", completedDate: "2026-01-20" },
  { id: "tr-8", title: "Naloxone Administration (OEND)", category: "Skills", description: "Opioid Education and Naloxone Distribution — recognizing overdose and administering naloxone.", duration: "2 hours", status: "not_started", completedDate: null },
  { id: "tr-9", title: "Community Needs Assessment", category: "Knowledge", description: "Methods for assessing community health needs including surveys, focus groups, and data analysis.", duration: "4 hours", status: "not_started", completedDate: null },
  { id: "tr-10", title: "Data Collection & Documentation", category: "Skills", description: "Best practices for client documentation, HIPAA compliance, and data entry for outcome tracking.", duration: "3 hours", status: "in_progress", completedDate: null },
];

function getRiskBadge(level: string) {
  switch (level) {
    case "low": return <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Low</Badge>;
    case "moderate": return <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Moderate</Badge>;
    case "high": return <Badge className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">High</Badge>;
    default: return <Badge variant="secondary" className="text-[10px]">{level}</Badge>;
  }
}

function getReferralStatusChip(status: string) {
  const s = (status || "").toLowerCase();
  switch (s) {
    case "enrolled":
      return <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Enrolled</Badge>;
    case "accepted":
      return <Badge className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Accepted</Badge>;
    case "ineligible":
      return <Badge className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">Ineligible</Badge>;
    case "withdrew":
      return <Badge variant="secondary" className="text-[10px]">Withdrew</Badge>;
    case "pending":
    case "sent":
      return <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Pending</Badge>;
    default:
      return <Badge variant="secondary" className="text-[10px]">{status || "—"}</Badge>;
  }
}

function getTrainingStatusBadge(status: string) {
  switch (status) {
    case "completed": return <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Completed</Badge>;
    case "in_progress": return <Badge className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">In Progress</Badge>;
    default: return <Badge variant="secondary" className="text-[10px]">Not Started</Badge>;
  }
}

export default function ChwDashboardPage() {
  useEffect(() => { document.title = "CHW Dashboard | ThriveUp"; }, []);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [trainingFilter, setTrainingFilter] = useState("all");

  // ── Community Safety summary (ZIP-level gun-violence data) ────────────────
  const [safetyZip, setSafetyZip] = useState("");
  const [safetyZipInput, setSafetyZipInput] = useState("");
  const { data: safetySummary, isFetching: safetySummaryLoading } = useQuery<any>({
    queryKey: ["/api/gun-violence/summary", safetyZip],
    queryFn: async () => {
      if (!safetyZip) return null;
      const res = await fetch(`/api/gun-violence/summary?zip=${encodeURIComponent(safetyZip)}`);
      if (!res.ok) throw new Error("Failed to load safety summary");
      return res.json();
    },
    enabled: !!safetyZip,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: liveData, isError: caseloadError } = useQuery({ queryKey: ["/api/chw/caseload"], enabled: isAuthenticated, retry: false });
  const { data: liveVisitsData, isError: visitsError } = useQuery({ queryKey: ["/api/chw/visits"], enabled: isAuthenticated, retry: false });
  const { data: liveResources, isError: resourcesError } = useQuery({ queryKey: ["/api/chw/resources"], enabled: isAuthenticated, retry: false });
  // The safety ZIP is the dashboard's current community geography selection.
  const threeRealitiesGeographyKey = safetyZip;
  const { data: threeRealities, isLoading: threeRealitiesLoading } = useQuery<ThreeRealitiesDiagnostic>({
    queryKey: ["/api/three-realities", threeRealitiesGeographyKey],
    queryFn: async () => {
      const res = await fetch(`/api/three-realities/${encodeURIComponent(threeRealitiesGeographyKey)}`);
      if (!res.ok) throw new Error("Failed to load Three Realities assessment");
      return res.json();
    },
    enabled: activeTab === "three-realities" && !!threeRealitiesGeographyKey,
    retry: false,
  });

  // ── Log Visit dialog state ────────────────────────────────────────────────
  const [visitOpen, setVisitOpen] = useState(false);
  const [visitClientDisplayName, setVisitClientDisplayName] = useState("");
  const [visitClientScreeningId, setVisitClientScreeningId] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [visitType, setVisitType] = useState("Follow-Up");
  const [visitDuration, setVisitDuration] = useState("");
  const [visitNotes, setVisitNotes] = useState("");
  const [visitFollowUpNeeded, setVisitFollowUpNeeded] = useState(false);
  const [visitFollowUpDate, setVisitFollowUpDate] = useState("");

  function resetVisitForm() {
    setVisitClientDisplayName("");
    setVisitClientScreeningId("");
    setVisitDate("");
    setVisitType("Follow-Up");
    setVisitDuration("");
    setVisitNotes("");
    setVisitFollowUpNeeded(false);
    setVisitFollowUpDate("");
  }

  // ── New Referral dialog state ─────────────────────────────────────────────
  const [referralOpen, setReferralOpen] = useState(false);
  const [programCode, setProgramCode] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgId, setOrgId] = useState("");
  const [clientDisplayName, setClientDisplayName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [funderId, setFunderId] = useState("");
  const [referralNotes, setReferralNotes] = useState("");
  const [lastResult, setLastResult] = useState<CreateReferralResponse | null>(null);
  // Captured at submit time (before resetReferralForm clears clientPhone) so the
  // post-submission SMS link can pre-fill the client's number.
  const [submittedClientPhone, setSubmittedClientPhone] = useState("");
  const [waitlistAcknowledged, setWaitlistAcknowledged] = useState(false);
  // Outcome filter for sent referrals (#197) — default "needs-follow-up"
  const [outcomeFilter, setOutcomeFilter] = useState<string>("needs-follow-up");

  // Childcare gap intelligence — WSRCA footprint + nationwide search
  const [childcareSearchInput, setChildcareSearchInput] = useState("");
  const [childcareSearchQuery, setChildcareSearchQuery] = useState("");

  // Childcare data — WSRCA 9-county footprint (loaded when tab is active)
  const { data: wsrcaData, isFetching: wsrcaLoading, error: wsrcaQueryError, refetch: refetchWsrca } = useQuery<WsrcaOverview, Error>({
    queryKey: ["/api/childcare/wsrca/overview"],
    queryFn: async () => {
      const res = await fetch("/api/childcare/wsrca/overview");
      if (!res.ok) throw new Error("WSRCA data unavailable");
      return normalizeWsrcaOverview(await res.json());
    },
    enabled: isAuthenticated && activeTab === "childcare",
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  // Childcare search — nationwide by county name + state string
  const { data: childcareSearchData, isFetching: childcareSearchLoading, error: childcareSearchError, refetch: refetchChildcareSearch } = useQuery<ChildcareSearchData, Error>({
    queryKey: ["/api/childcare/search", childcareSearchQuery],
    queryFn: async () => {
      if (!childcareSearchQuery) throw new Error("Enter a county to search.");
      const res = await fetch(`/api/childcare/search?location=${encodeURIComponent(childcareSearchQuery)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Not found" }));
        throw new Error(err.error ?? "Search failed");
      }
      return normalizeChildcareSearch(await res.json());
    },
    enabled: !!childcareSearchQuery,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  // Live capacity registry — used to block referrals to closed orgs and warn
  // about waitlists before submission (server enforces the same rules).
  const { data: capacityData } = useQuery<{ orgs: any[] }>({
    queryKey: ["/api/directory/capacity"],
    queryFn: async () => {
      const res = await fetch("/api/directory/capacity");
      if (!res.ok) throw new Error("Failed to load capacity");
      return res.json();
    },
    enabled: isAuthenticated && referralOpen,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const capacityOrgs: any[] = capacityData?.orgs ?? [];

  // Freshest capacity record for the org being referred to. Matches by
  // case-insensitive org name; an exact program record wins over "general".
  const capacityMatch = (() => {
    const norm = (s: string) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
    const nameNorm = norm(orgName);
    const programNorm = norm(programCode);
    if (!nameNorm) return null;
    const candidates = capacityOrgs.filter((o) => {
      if (norm(o.orgName) !== nameNorm) return false;
      return norm(o.programCode) === programNorm || norm(o.programCode) === "general";
    });
    if (candidates.length === 0) return null;
    return candidates.find((o) => norm(o.programCode) === programNorm) ?? candidates[0];
  })();
  const capacityClosed = capacityMatch?.status === "closed";
  const capacityWaitlist = capacityMatch?.status === "waitlist";

  // Funder list — same endpoint the staff funder admin page uses.
  const { data: fundersData } = useQuery<{ funders: FunderOption[] }>({
    queryKey: ["/api/funder/list"],
    queryFn: async () => {
      const res = await fetch("/api/funder/list");
      if (!res.ok) throw new Error("Failed to load funders");
      return res.json();
    },
    enabled: isAuthenticated,
    retry: false,
  });
  const funders: FunderOption[] = fundersData?.funders ?? [];

  // My sent referrals.
  const { data: sentData, isError: sentError } = useQuery<{ referrals: SentReferral[] }>({
    queryKey: ["/api/referrals/my-sent"],
    queryFn: async () => {
      const res = await fetch("/api/referrals/my-sent");
      if (!res.ok) throw new Error("Failed to load sent referrals");
      return res.json();
    },
    enabled: isAuthenticated,
    retry: false,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sentReferrals: SentReferral[] = Array.isArray((sentData as any)?.referrals)
    ? (sentData as any).referrals
    : Array.isArray(sentData as any)
      ? (sentData as any)
      : [];

  const orgResourceOptions: { id?: string; name: string; acceptingClients?: boolean }[] = ((): { id?: string; name: string; acceptingClients?: boolean }[] => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rs: any[] = (liveResources as any)?.resources?.length ? (liveResources as any).resources : [];
    return rs.map((r: any) => ({ id: r.id, name: r.name, acceptingClients: r.acceptingClients !== false })).filter((r) => !!r.name);
  })();
  // Warn CHW (without fully blocking) when selected org is on waitlist.
  const selectedOrgNotAccepting = orgId
    ? orgResourceOptions.find((o) => o.id === orgId)?.acceptingClients === false
    : false;

  // Open alternatives — shown when selected org is closed (#179).
  // Prefer orgs offering the same program code; fall back to "general" entries
  // that serve the whole area. Sorted so exact-program matches come first.
  const openAlternatives: any[] = capacityClosed
    ? (() => {
        const norm = (s: string) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
        const programNorm = norm(programCode);
        const targetName = norm(capacityMatch?.orgName ?? "");
        const candidates = capacityOrgs.filter(
          (o) => o.status === "open" && norm(o.orgName) !== targetName,
        );
        // Rank: exact programCode match > "general" > anything else
        const ranked = candidates.sort((a, b) => {
          const scoreA =
            norm(a.programCode) === programNorm ? 0
              : norm(a.programCode) === "general" ? 1
              : 2;
          const scoreB =
            norm(b.programCode) === programNorm ? 0
              : norm(b.programCode) === "general" ? 1
              : 2;
          return scoreA - scoreB;
        });
        return ranked.slice(0, 4);
      })()
    : [];

  // Filtered sent referrals (#197) — "needs-follow-up" shows unresolved (sent/pending/accepted)
  const filteredReferrals = (() => {
    if (outcomeFilter === "all") return sentReferrals;
    if (outcomeFilter === "needs-follow-up")
      return sentReferrals.filter((r) =>
        ["sent", "pending", "accepted"].includes((r.status || "").toLowerCase())
      );
    if (outcomeFilter === "resolved")
      return sentReferrals.filter((r) =>
        ["enrolled", "ineligible", "withdrew", "completed", "declined"].includes((r.status || "").toLowerCase())
      );
    return sentReferrals;
  })();

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(
      () => toast({ title: "Copied", description: "Link copied to clipboard." }),
      () => toast({ title: "Copy failed", description: "Could not copy to clipboard.", variant: "destructive" }),
    );
  }

  function resetReferralForm() {
    setProgramCode("");
    setOrgName("");
    setOrgId("");
    setClientDisplayName("");
    setClientPhone("");
    setFunderId("");
    setReferralNotes("");
    setWaitlistAcknowledged(false);
  }

  const logVisit = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        visitDate: visitDate,
        visitType: visitType,
      };
      if (visitClientDisplayName.trim()) body.clientDisplayName = visitClientDisplayName.trim();
      if (visitClientScreeningId) body.clientScreeningId = visitClientScreeningId;
      if (visitDuration) body.durationMinutes = visitDuration;
      if (visitNotes.trim()) body.notes = visitNotes.trim();
      body.followUpNeeded = visitFollowUpNeeded;
      if (visitFollowUpNeeded && visitFollowUpDate) body.followUpDate = visitFollowUpDate;
      const res = await apiRequest("POST", "/api/chw/visits", body);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error ?? `HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chw/visits"] });
      resetVisitForm();
      setVisitOpen(false);
      toast({ title: "Visit logged", description: "Home visit recorded successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Could not log visit", description: err.message, variant: "destructive" });
    },
  });

  const createReferral = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        programCode: programCode.trim(),
        orgName: orgName.trim(),
      };
      if (orgId) body.orgId = orgId;
      if (clientDisplayName.trim()) body.clientDisplayName = clientDisplayName.trim();
      if (clientPhone.trim()) body.clientPhone = clientPhone.trim();
      if (funderId) body.funderId = funderId;
      if (referralNotes.trim()) body.notes = referralNotes.trim();
      if (waitlistAcknowledged) body.waitlistAcknowledged = true;
      const res = await apiRequest("POST", "/api/referrals", body);
      return (await res.json()) as CreateReferralResponse;
    },
    onSuccess: (data) => {
      // Capture before resetReferralForm clears clientPhone.
      setSubmittedClientPhone(clientPhone.trim());
      setLastResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/referrals/my-sent"] });
      resetReferralForm();
      toast({
        title: "Referral submitted",
        description: data.statusUrl
          ? "Track it below or copy the status link to share."
          : "Referral created successfully.",
      });
    },
    onError: (err: Error) => {
      // Server returns 409 with a JSON body for closed/waitlist orgs.
      const raw = String(err.message || "");
      const msg = raw.startsWith("409:")
        ? (() => { try { return JSON.parse(raw.slice(4).trim()).error; } catch { return raw.slice(4).trim(); } })()
        : raw;
      toast({ title: "Could not submit referral", description: msg, variant: "destructive" });
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const caseload: any[] = (!caseloadError && Array.isArray((liveData as any)?.caseload)) ? (liveData as any).caseload : [];
  const isLiveCaseload = !caseloadError && !!(liveData as any)?.isLive;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const visits: any[] = (!visitsError && Array.isArray((liveVisitsData as any)?.visits)) ? (liveVisitsData as any).visits : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allResources: any[] = (!resourcesError && (liveResources as any)?.resources?.length) ? (liveResources as any).resources : SAMPLE_RESOURCES;
  const isLiveResources = !resourcesError && !!(liveResources as any)?.isLive && (liveResources as any)?.resources?.length > 0;
  const resources: any[] = resourceFilter === "all" ? allResources : allResources.filter((r: any) => r.category === resourceFilter);
  const resourceCategories: string[] = Array.from(new Set<string>(allResources.map((r: any) => r.category as string)));

  const trainings = trainingFilter === "all" ? SAMPLE_TRAININGS : SAMPLE_TRAININGS.filter(t => t.status === trainingFilter);
  const completedTrainings = SAMPLE_TRAININGS.filter(t => t.status === "completed").length;
  const totalTrainingHours = SAMPLE_TRAININGS.filter(t => t.status === "completed").reduce((sum, t) => sum + parseInt(t.duration), 0);

  const activeCases = caseload.filter((c: any) => c.status === "active").length;
  const highRisk = caseload.filter((c: any) => c.riskLevel === "high" && c.status === "active").length;
  const overdueFollowUps = caseload.filter((c: any) => c.nextFollowUp && new Date(c.nextFollowUp) < new Date()).length;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto" data-testid="chw-dashboard-page">
      <PageHeader title="Community Health Worker Dashboard" breadcrumbs={[{ label: "CHW Dashboard" }]} />

      <div className="rounded-md bg-gradient-to-r from-teal-900 to-cyan-700 p-4 sm:p-6 lg:p-8 mb-8" data-testid="section-hero">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="rounded-md p-2.5 bg-white/10">
            <Heart className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white" data-testid="text-page-title">
            Community Health Worker Dashboard
          </h1>
          <TrainingGuideButton moduleId="chw-dashboard" />
        </div>
        <p className="text-teal-100 text-base sm:text-lg" data-testid="text-page-subtitle">
          Manage caseloads, track screenings, log home visits, connect to community resources, and build professional skills
        </p>
      </div>

      {isAuthenticated && (
        <div className="flex items-center justify-end mb-4" data-testid="section-referral-actions">
          <Dialog
            open={referralOpen}
            onOpenChange={(o) => {
              setReferralOpen(o);
              if (!o) setLastResult(null);
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-new-referral">
                <Send className="h-4 w-4" /> New Referral
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" data-testid="dialog-new-referral">
              <DialogHeader>
                <DialogTitle>New Referral</DialogTitle>
              </DialogHeader>

              {/* DIS Condition 2 — Consent disclosure before collecting client information */}
              <ConsentDisclosure
                purpose="Create a service referral on behalf of a client to connect them with a partner organization."
                fields={[
                  { name: "Client display name", why: "Helps the receiving organization identify the referral. No legal name required.", required: false },
                  { name: "Client phone number", why: "Allows the receiving organization to follow up directly.", required: false, sensitive: true },
                  { name: "Program code and organization", why: "Identifies which program and partner organization will receive this referral.", required: true },
                  { name: "Funder attribution", why: "Credits the referral to the correct funding source for impact reporting.", required: false },
                  { name: "Referral notes", why: "Provides the receiving organization with relevant context for this client.", required: false, sensitive: true },
                ]}
                sharing="This referral is visible to the receiving organization and logged in the platform. Client display name and phone are shared with the receiving org. Notes are shared with the receiving org."
                withdrawal="You can cancel this dialog without submitting. Submitted referrals are immutable — contact a supervisor to void a submitted referral."
                compact
              />

              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="ref-program-code">Program code</Label>
                  <Input
                    id="ref-program-code"
                    placeholder="e.g. SNAP-2026"
                    value={programCode}
                    onChange={(e) => setProgramCode(e.target.value)}
                    data-testid="input-program-code"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ref-org-name">Organization</Label>
                  {orgResourceOptions.length > 0 && (
                    <Select
                      value={orgId || undefined}
                      onValueChange={(val) => {
                        setOrgId(val);
                        const match = orgResourceOptions.find((o) => o.id === val);
                        if (match) setOrgName(match.name);
                      }}
                    >
                      <SelectTrigger className="mb-2" data-testid="select-org-resource">
                        <SelectValue placeholder="Pick from your resources (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {orgResourceOptions.map((o) => (
                          <SelectItem key={o.id ?? o.name} value={o.id ?? o.name}>
                            {o.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Input
                    id="ref-org-name"
                    placeholder="Organization name"
                    value={orgName}
                    onChange={(e) => {
                      setOrgName(e.target.value);
                      setOrgId("");
                    }}
                    data-testid="input-org-name"
                  />
                  {capacityClosed && (
                    <div className="space-y-2 mt-1">
                      <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2 dark:text-red-400 dark:bg-red-950/30 dark:border-red-800" role="alert" data-testid="notice-org-closed">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-600 mt-0.5" />
                        <span>
                          <strong>{capacityMatch.orgName}</strong> has <strong>closed intake</strong> for this program right now. Referrals can't be sent.
                        </span>
                      </div>
                      {openAlternatives.length > 0 && (
                        <div className="rounded border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 p-2 space-y-1.5" data-testid="notice-open-alternatives">
                          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Open alternatives right now:</p>
                          {openAlternatives.map((alt) => (
                            <button
                              key={alt.orgName}
                              type="button"
                              className="w-full text-left text-xs px-2 py-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 transition-colors"
                              onClick={() => { setOrgName(alt.orgName); setOrgId(""); }}
                              data-testid={`btn-alt-org-${alt.orgName}`}
                            >
                              <span className="font-medium">{alt.orgName}</span>
                              {alt.programCode && alt.programCode !== "general" && (
                                <span className="text-emerald-600 dark:text-emerald-400"> · {alt.programCode}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {capacityWaitlist && (
                    <div className="space-y-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mt-1 dark:text-amber-300 dark:bg-amber-950/30 dark:border-amber-800" role="alert" data-testid="notice-org-waitlist">
                      <p className="flex items-start gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 mt-0.5" />
                        <span>
                          <strong>{capacityMatch.orgName}</strong> is on a <strong>waitlist</strong>
                          {capacityMatch.waitWeeks ? <> — estimated wait ~{capacityMatch.waitWeeks} week{capacityMatch.waitWeeks !== 1 ? "s" : ""}</> : null}.
                        </span>
                      </p>
                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={waitlistAcknowledged}
                          onChange={(e) => setWaitlistAcknowledged(e.target.checked)}
                          data-testid="checkbox-waitlist-ack"
                        />
                        The client understands the wait — submit anyway
                      </label>
                    </div>
                  )}
                  {selectedOrgNotAccepting && !capacityClosed && !capacityWaitlist && (
                    <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mt-1" role="alert" data-testid="notice-org-not-accepting">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                      This org is on waitlist. You can still submit, but expect delays — consider an alternative if urgent.
                    </div>
                  )}
                  {/* Staleness warning (#180) — badge data older than 7 days */}
                  {capacityMatch?.stale && !capacityClosed && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded p-2 mt-1 dark:text-slate-400 dark:bg-slate-900/30 dark:border-slate-700" role="alert" data-testid="notice-capacity-stale">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      Capacity data for this org is over 7 days old — status may have changed. Verify before submitting.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ref-client-name">Client name <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input
                      id="ref-client-name"
                      placeholder="Display name"
                      value={clientDisplayName}
                      onChange={(e) => setClientDisplayName(e.target.value)}
                      data-testid="input-client-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ref-client-phone">Client phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input
                      id="ref-client-phone"
                      type="tel"
                      placeholder="(512) 555-0100"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      data-testid="input-client-phone"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ref-funder">Funder <span className="text-muted-foreground font-normal">(optional — credits the right dashboard)</span></Label>
                  <Select value={funderId || undefined} onValueChange={setFunderId}>
                    <SelectTrigger id="ref-funder" data-testid="select-funder">
                      <SelectValue placeholder={funders.length ? "Select a funder" : "No funders available"} />
                    </SelectTrigger>
                    <SelectContent>
                      {funders.map((f) => (
                        <SelectItem key={f.id} value={f.id} data-testid={`option-funder-${f.id}`}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ref-notes">Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Textarea
                    id="ref-notes"
                    placeholder="Anything the receiving org should know…"
                    value={referralNotes}
                    onChange={(e) => setReferralNotes(e.target.value)}
                    data-testid="input-referral-notes"
                  />
                </div>

                <Button
                  className="w-full"
                  disabled={!programCode.trim() || !orgName.trim() || createReferral.isPending || capacityClosed || (capacityWaitlist && !waitlistAcknowledged)}
                  onClick={() => createReferral.mutate()}
                  data-testid="button-submit-referral"
                >
                  {createReferral.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</>
                  ) : (
                    "Submit Referral"
                  )}
                </Button>

                {lastResult && (
                  <div className="rounded-md border bg-muted/30 p-3 space-y-3" data-testid="referral-result">
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" /> Referral submitted
                    </div>
                    {lastResult.statusUrl && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Status link (for you)</p>
                        <div className="flex items-center gap-2">
                          <Input readOnly value={lastResult.statusUrl} className="text-xs" data-testid="text-status-url" />
                          <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            onClick={() => copyToClipboard(lastResult.statusUrl!)}
                            data-testid="button-copy-status-url"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        {submittedClientPhone && (
                          <a
                            href={`sms:${submittedClientPhone.replace(/\D/g, "")}?body=${encodeURIComponent(`Your referral status: ${lastResult.statusUrl}`)}`}
                            className="inline-flex items-center gap-1.5 text-xs text-teal-600 hover:underline"
                            data-testid="link-sms-status"
                          >
                            <Send className="h-3 w-3" />
                            Send status link to client via SMS
                          </a>
                        )}
                      </div>
                    )}
                    {lastResult.orgConfirmUrl && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Org confirmation link (send to the org)</p>
                        <div className="flex items-center gap-2">
                          <Input readOnly value={lastResult.orgConfirmUrl} className="text-xs" data-testid="text-org-confirm-url" />
                          <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            onClick={() => copyToClipboard(lastResult.orgConfirmUrl!)}
                            data-testid="button-copy-org-confirm-url"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* My Sent Referrals */}
                <div className="pt-2 border-t" data-testid="section-my-sent-referrals">
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Clipboard className="h-4 w-4 text-teal-500" /> My Sent Referrals
                    </h4>
                  </div>
                  {/* Outcome filter tabs (#197) — default is "Needs follow-up" */}
                  <div className="flex gap-1 mb-2" data-testid="referral-filter-tabs">
                    {([
                      { value: "all", label: "All" },
                      { value: "needs-follow-up", label: "Needs follow-up" },
                      { value: "resolved", label: "Resolved" },
                    ] as const).map((tab) => (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => setOutcomeFilter(tab.value)}
                        data-testid={`tab-referral-filter-${tab.value}`}
                        className={[
                          "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                          outcomeFilter === tab.value
                            ? "bg-teal-600 text-white"
                            : "bg-muted text-muted-foreground hover:bg-muted/80",
                        ].join(" ")}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  {sentError ? (
                    <p className="text-xs text-red-600 dark:text-red-400" data-testid="text-sent-referrals-error">
                      Could not load referrals — check your connection and refresh.
                    </p>
                  ) : sentReferrals.length === 0 ? (
                    <p className="text-xs text-muted-foreground" data-testid="text-no-sent-referrals">
                      No referrals sent yet.
                    </p>
                  ) : filteredReferrals.length === 0 ? (
                    <p className="text-xs text-muted-foreground" data-testid="text-no-filtered-referrals">
                      {outcomeFilter === "needs-follow-up"
                        ? "No referrals need follow-up right now."
                        : outcomeFilter === "resolved"
                          ? "No resolved referrals yet."
                          : "No referrals found."}
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {filteredReferrals.map((r) => {
                        const needsFollowUp = ["sent", "pending", "accepted"].includes((r.status || "").toLowerCase());
                        const resolvedDate = r.resolvedAt
                          ? new Date(r.resolvedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                          : null;
                        const hasValue = r.benefitValueEstimate != null && r.benefitValueEstimate > 0;
                        const valueLabel = hasValue
                          ? r.valueSource === "reported"
                            ? `$${r.benefitValueEstimate!.toLocaleString()} (org-reported)`
                            : `$${r.benefitValueEstimate!.toLocaleString()} (program default)`
                          : null;
                        return (
                          <div
                            key={r.id}
                            className="rounded-md border p-2 space-y-1"
                            data-testid={`card-sent-referral-${r.id}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {r.orgName || "Organization"}
                                  {r.programCode ? <span className="text-muted-foreground font-normal"> · {r.programCode}</span> : null}
                                </p>
                                {r.clientDisplayName && (
                                  <p className="text-xs text-muted-foreground truncate">{r.clientDisplayName}</p>
                                )}
                              </div>
                              <div className="shrink-0 flex flex-col items-end gap-1">
                                {getReferralStatusChip(r.status)}
                                {needsFollowUp && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium" data-testid={`label-follow-up-${r.id}`}>
                                    <Clock className="h-3 w-3" /> Follow-up needed
                                  </span>
                                )}
                              </div>
                            </div>
                            {(resolvedDate || valueLabel) && (
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground pl-0.5" data-testid={`meta-resolved-${r.id}`}>
                                {resolvedDate && (
                                  <span>Resolved {resolvedDate}</span>
                                )}
                                {valueLabel && (
                                  <span data-testid={`label-value-source-${r.id}`}>{valueLabel}</span>
                                )}
                              </div>
                            )}
                            {/* #211: show "Copy org confirm link" only for unresolved referrals */}
                            {r.orgConfirmUrl && !r.resolvedAt && (
                              <div className="flex items-center gap-1.5 pt-1" data-testid={`section-org-confirm-${r.id}`}>
                                <span className="text-[10px] text-muted-foreground shrink-0">Org confirm link:</span>
                                <span className="text-[10px] text-muted-foreground truncate flex-1 font-mono">{r.orgConfirmUrl}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 shrink-0"
                                  onClick={() => copyToClipboard(`${window.location.origin}${r.orgConfirmUrl!}`)}
                                  title="Copy org confirmation link"
                                  data-testid={`button-copy-org-confirm-${r.id}`}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-6 flex-wrap" data-testid="tabs-chw">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="caseload" data-testid="tab-caseload">Caseload</TabsTrigger>
          <TabsTrigger value="visits" data-testid="tab-visits">Home Visits</TabsTrigger>
          <TabsTrigger value="resources" data-testid="tab-resources">Resources</TabsTrigger>
          <TabsTrigger value="childcare" data-testid="tab-childcare">Childcare</TabsTrigger>
          <TabsTrigger value="training" data-testid="tab-training">Training</TabsTrigger>
          <TabsTrigger value="supervisor" data-testid="tab-supervisor">Supervisor View</TabsTrigger>
          <TabsTrigger value="three-realities" data-testid="tab-three-realities">Three Realities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="section-stats">
              <Card className="p-4 text-center" data-testid="stat-active-cases">
                <Users className="h-5 w-5 mx-auto text-teal-500 mb-1" />
                <p className="text-2xl font-bold">{activeCases}</p>
                <p className="text-xs text-muted-foreground">Active Cases</p>
              </Card>
              <Card className="p-4 text-center" data-testid="stat-high-risk">
                <AlertTriangle className="h-5 w-5 mx-auto text-red-500 mb-1" />
                <p className="text-2xl font-bold">{highRisk}</p>
                <p className="text-xs text-muted-foreground">High Risk</p>
              </Card>
              <Card className="p-4 text-center" data-testid="stat-visits-month">
                <Home className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                <p className="text-2xl font-bold">{visits.length}</p>
                <p className="text-xs text-muted-foreground">Visits This Month</p>
              </Card>
              <Card className="p-4 text-center" data-testid="stat-training-hours">
                <GraduationCap className="h-5 w-5 mx-auto text-violet-500 mb-1" />
                <p className="text-2xl font-bold">{totalTrainingHours}h</p>
                <p className="text-xs text-muted-foreground">Training Hours</p>
              </Card>
            </div>

            {overdueFollowUps > 0 && (
              <Card className="p-4 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20" data-testid="alert-overdue">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">{overdueFollowUps} overdue follow-up{overdueFollowUps > 1 ? "s" : ""}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Review your caseload and schedule follow-up visits.</p>
                  </div>
                  <Button size="sm" variant="outline" className="ml-auto shrink-0" onClick={() => setActiveTab("caseload")} data-testid="button-view-overdue">
                    View <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-5" data-testid="card-quick-actions">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" /> Quick Actions
                </h3>
                <div className="space-y-2">
                  {[
                    { label: "Log Home Visit", icon: Home, tab: "visits" },
                    { label: "View Caseload", icon: Users, tab: "caseload" },
                    { label: "Find Resources", icon: MapPin, tab: "resources" },
                    { label: "Continue Training", icon: GraduationCap, tab: "training" },
                  ].map((action, i) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={i}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setActiveTab(action.tab)}
                        data-testid={`button-quick-${action.tab}`}
                      >
                        <Icon className="h-4 w-4 mr-2" /> {action.label}
                      </Button>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-5" data-testid="card-training-progress">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-violet-500" /> Training Progress
                </h3>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Modules Completed</span>
                    <span className="font-semibold">{completedTrainings}/{SAMPLE_TRAININGS.length}</span>
                  </div>
                  <Progress value={(completedTrainings / SAMPLE_TRAININGS.length) * 100} className="h-2" data-testid="progress-training" />
                </div>
                <div className="space-y-2">
                  {SAMPLE_TRAININGS.filter(t => t.status === "in_progress").map(t => (
                    <div key={t.id} className="flex items-center gap-2 text-sm" data-testid={`text-training-inprogress-${t.id}`}>
                      <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* ── Community Safety Summary (#216) ─────────────────────────────────
                 Auto-fetches local gun-violence data for a ZIP so a CHW doesn't
                 have to navigate away to the Navigator just to get safety context.
                 Links directly into Tell-a-Story pre-populated with the ZIP. */}
            <Card className="p-5" data-testid="card-community-safety">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-500" /> Community Safety Summary
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Enter a ZIP code to instantly pull local gun-violence incident data — no need to ask Navigator separately.
              </p>
              <div className="flex gap-2 mb-3">
                <Input
                  value={safetyZipInput}
                  onChange={e => setSafetyZipInput(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  placeholder="ZIP code (e.g. 60619)"
                  className="text-sm max-w-[180px]"
                  maxLength={5}
                  data-testid="input-safety-zip"
                  onKeyDown={e => { if (e.key === "Enter" && safetyZipInput.length === 5) setSafetyZip(safetyZipInput); }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={safetyZipInput.length !== 5 || safetySummaryLoading}
                  onClick={() => setSafetyZip(safetyZipInput)}
                  data-testid="button-safety-zip-search"
                >
                  {safetySummaryLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
                  <span className="ml-1.5">Lookup</span>
                </Button>
              </div>

              {safetyZip && safetySummary && !safetySummaryLoading && (
                <div className="space-y-2" data-testid="section-safety-summary-result">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-md border p-2 text-center">
                      <p className="text-lg font-bold tabular-nums text-rose-600" data-testid="text-safety-incidents">{safetySummary.incidents ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">Incidents</p>
                    </div>
                    <div className="rounded-md border p-2 text-center">
                      <p className="text-lg font-bold tabular-nums text-amber-600" data-testid="text-safety-victims">{safetySummary.victims ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">Victims</p>
                    </div>
                    <div className="rounded-md border p-2 text-center">
                      <p className="text-lg font-bold tabular-nums text-gray-700 dark:text-gray-300" data-testid="text-safety-fatalities">{safetySummary.fatalities ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">Fatalities</p>
                    </div>
                  </div>
                  {safetySummary.incidents === 0 && (
                    <p className="text-xs text-muted-foreground" data-testid="text-safety-no-data">
                      No incidents on record for ZIP {safetyZip} in the local registry. The registry may not yet have data for this area.
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`/gun-violence-intelligence?tab=story&geo=${encodeURIComponent(safetyZip)}`}
                      className="inline-flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium"
                      data-testid="link-safety-tell-story"
                    >
                      <Sparkles className="h-3 w-3" />
                      Generate full story for ZIP {safetyZip} →
                    </a>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Source: TCAF Gun Violence Registry · CDC WONDER · FBI UCR</p>
                </div>
              )}
            </Card>

            <Card className="p-5" data-testid="card-priority-clients">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Priority Clients
              </h3>
              <div className="space-y-2">
                {caseload.filter(c => c.status === "active" && (c.riskLevel === "high" || c.riskLevel === "moderate")).map(client => (
                  <Card key={client.id} className="p-3" data-testid={`card-priority-client-${client.id}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <UserCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium truncate">{client.name}</span>
                        {getRiskBadge(client.riskLevel)}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{client.screeningsComplete}/{client.screeningsTotal} screenings</span>
                      </div>
                    </div>
                    {client.notes && (
                      <p className="text-xs text-muted-foreground mt-1 pl-6">{client.notes}</p>
                    )}
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="caseload">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                Active Caseload ({activeCases} clients)
              </h3>
            </div>
            {caseloadError && (
              <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-700 dark:text-red-400" data-testid="notice-caseload-error">
                Could not load caseload — check your connection and refresh.
              </div>
            )}
            {!caseloadError && isLiveCaseload && caseload.length === 0 && (
              <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground text-sm" data-testid="notice-caseload-empty">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="font-medium">No clients assigned to you yet.</p>
                <p className="text-xs mt-1">Clients will appear here once screenings or referrals are assigned to your account.</p>
              </div>
            )}
            <div className="space-y-3" data-testid="section-caseload">
              {caseload.map(client => (
                <Card key={client.id} className="p-4" data-testid={`card-client-${client.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold">{client.name}</p>
                        {getRiskBadge(client.riskLevel)}
                        <Badge variant={client.status === "active" ? "default" : "secondary"} className="text-[10px]">{client.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Last: {new Date(client.lastContact).toLocaleDateString()}</span>
                        </div>
                        {client.nextFollowUp && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Next: {new Date(client.nextFollowUp).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <ClipboardCheck className="h-3 w-3" />
                          <span>{client.screeningsComplete}/{client.screeningsTotal} screenings</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress value={(client.screeningsComplete / client.screeningsTotal) * 100} className="h-1.5" />
                      </div>
                      {client.notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic">{client.notes}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="visits">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Home Visit Log</h3>
              {isAuthenticated && (
                <Dialog open={visitOpen} onOpenChange={(o) => { setVisitOpen(o); if (!o) resetVisitForm(); }}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2" data-testid="button-log-visit">
                      <Plus className="h-4 w-4" /> Log Visit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md" data-testid="dialog-log-visit">
                    <DialogHeader>
                      <DialogTitle>Log Home Visit</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-1">
                      {/* Client — pick from caseload OR free-type */}
                      <div className="space-y-1.5">
                        <Label>Client</Label>
                        {caseload.length > 0 && (
                          <Select
                            value={visitClientScreeningId || undefined}
                            onValueChange={(val) => {
                              setVisitClientScreeningId(val);
                              setVisitClientDisplayName("");
                            }}
                          >
                            <SelectTrigger className="mb-2" data-testid="select-visit-caseload-client">
                              <SelectValue placeholder="Pick from your caseload (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              {caseload.map((c: any) => (
                                <SelectItem key={c.screeningId ?? c.id} value={c.screeningId ?? c.id} data-testid={`option-visit-client-${c.id}`}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <Input
                          placeholder="Or type client name (walk-in / informal visit)"
                          value={visitClientDisplayName}
                          onChange={(e) => {
                            setVisitClientDisplayName(e.target.value);
                            setVisitClientScreeningId("");
                          }}
                          data-testid="input-visit-client-name"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Select from your caseload to link to a real case, or type freely for walk-in visits.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="visit-date">Visit date <span className="text-red-500">*</span></Label>
                          <Input
                            id="visit-date"
                            type="date"
                            value={visitDate}
                            onChange={(e) => setVisitDate(e.target.value)}
                            data-testid="input-visit-date"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="visit-type">Visit type</Label>
                          <Select value={visitType} onValueChange={setVisitType}>
                            <SelectTrigger id="visit-type" data-testid="select-visit-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["Follow-Up", "Initial Assessment", "Crisis Response", "Health Education", "Referral Coordination", "Other"].map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="visit-duration">Duration (minutes) <span className="text-muted-foreground font-normal">(optional)</span></Label>
                        <Input
                          id="visit-duration"
                          type="number"
                          min="1"
                          placeholder="e.g. 45"
                          value={visitDuration}
                          onChange={(e) => setVisitDuration(e.target.value)}
                          data-testid="input-visit-duration"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="visit-notes">Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
                        <Textarea
                          id="visit-notes"
                          placeholder="What happened during the visit…"
                          value={visitNotes}
                          onChange={(e) => setVisitNotes(e.target.value)}
                          data-testid="input-visit-notes"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          id="visit-followup"
                          type="checkbox"
                          checked={visitFollowUpNeeded}
                          onChange={(e) => setVisitFollowUpNeeded(e.target.checked)}
                          data-testid="checkbox-visit-followup"
                        />
                        <Label htmlFor="visit-followup" className="cursor-pointer">Follow-up needed</Label>
                      </div>

                      {visitFollowUpNeeded && (
                        <div className="space-y-1.5">
                          <Label htmlFor="visit-followup-date">Follow-up date</Label>
                          <Input
                            id="visit-followup-date"
                            type="date"
                            value={visitFollowUpDate}
                            onChange={(e) => setVisitFollowUpDate(e.target.value)}
                            data-testid="input-visit-followup-date"
                          />
                        </div>
                      )}

                      <Button
                        className="w-full"
                        disabled={!visitDate || logVisit.isPending}
                        onClick={() => logVisit.mutate()}
                        data-testid="button-submit-visit"
                      >
                        {logVisit.isPending ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
                        ) : (
                          "Save Visit"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {visitsError && (
              <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-700 dark:text-red-400" data-testid="notice-visits-error">
                Could not load visit log — check your connection and refresh.
              </div>
            )}
            {!visitsError && visits.length === 0 && (
              <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground text-sm" data-testid="notice-visits-empty">
                <Home className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="font-medium">No home visits logged yet.</p>
                <p className="text-xs mt-1">Use the "Log Visit" button above to record your first visit.</p>
              </div>
            )}
            <div className="space-y-3" data-testid="section-visits">
              {visits.map(visit => (
                <Card key={visit.id} className="p-4" data-testid={`card-visit-${visit.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-semibold">{visit.clientName}</p>
                        {visit.caseRef && (
                          <Badge variant="outline" className="text-[10px] border-teal-400 text-teal-700 dark:text-teal-400" data-testid={`badge-case-ref-${visit.id}`}>
                            Linked case
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px]">{visit.visitType}</Badge>
                        <span className="text-xs text-muted-foreground">{visit.duration} min</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(visit.visitDate).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground mt-2">{visit.notes}</p>
                      {visit.followUpNeeded && visit.followUpDate && (
                        <div className="flex items-center gap-1 mt-2 text-xs">
                          <Clock className="h-3 w-3 text-amber-500" />
                          <span className="text-amber-600 dark:text-amber-400">Follow-up: {new Date(visit.followUpDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-5" data-testid="card-visit-tips">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" /> Home Visit Best Practices
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { tip: "Start with rapport building — ask how they're doing before business", icon: Heart },
                  { tip: "Document everything during or immediately after the visit", icon: Clipboard },
                  { tip: "Use motivational interviewing techniques for behavior change", icon: Brain },
                  { tip: "Always have a safety plan and check in with your supervisor", icon: Shield },
                  { tip: "Bring resource materials in the client's preferred language", icon: BookOpen },
                  { tip: "Follow up on referrals made during previous visits", icon: CheckCircle2 },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-2 text-sm" data-testid={`text-tip-${i}`}>
                      <Icon className="h-3.5 w-3.5 text-teal-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{item.tip}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger className="w-48" data-testid="select-resource-filter">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {resourceCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">{resources.length} resources</span>
            </div>
            {!isLiveResources && (
              <div data-testid="notice-sample-resources" className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2 mb-3">
                Demo data — connect your resource directory via the Partner API to see your organization's real resources here.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="section-resources">
              {resources.map((resource: any) => (
                <Card key={resource.id} className="p-4" data-testid={`card-resource-${resource.id}`}>
                  <div className="flex items-start gap-3">
                    <div className="rounded-md p-2 bg-teal-100 dark:bg-teal-900/30 shrink-0">
                      <Building2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm truncate">{resource.name}</h4>
                        {!isLiveResources && (
                          <Badge variant="outline" className="text-[10px] shrink-0 border-amber-400 text-amber-700 dark:text-amber-400" data-testid={`badge-demo-${resource.id}`}>
                            Demo
                          </Badge>
                        )}
                        {resource.acceptingClients ? (
                          <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 shrink-0">Accepting</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] shrink-0">Waitlist</Badge>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px] mb-2">{resource.category}</Badge>
                      <p className="text-xs text-muted-foreground">{resource.description}</p>
                      <div className="grid grid-cols-1 gap-1 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span>{resource.address}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 shrink-0" />
                          {/* tel: link lets CHWs call directly from their phone — Task #164.
                              Demo/sample records use reserved 555-01xx numbers that are never
                              dialable; block the tap and explain instead of silently failing. */}
                          {isLiveResources ? (
                            <a
                              href={`tel:${resource.phone.replace(/\D/g, "")}`}
                              className="hover:text-teal-600 hover:underline"
                              data-testid={`link-phone-${resource.id}`}
                            >{resource.phone}</a>
                          ) : (
                            <span
                              className="text-muted-foreground/70 cursor-not-allowed"
                              title="Demo record — this number is a non-dialable placeholder, not a real organization contact."
                              data-testid={`text-demo-phone-${resource.id}`}
                            >{resource.phone} (demo — not callable)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>{resource.hours}</span>
                        </div>
                        {resource.website && (
                          <div className="flex items-center gap-1">
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <a href={resource.website} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline truncate">{resource.website}</a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-4 text-center" data-testid="card-resource-finder-cta">
              <p className="text-sm text-muted-foreground mb-3">Need to find more community resources?</p>
              <a href="/resources">
                <Button variant="outline" size="sm" data-testid="button-open-resource-finder">
                  <MapPin className="h-4 w-4 mr-1" /> Open Resource Finder
                </Button>
              </a>
            </Card>
          </div>
        </TabsContent>

        {/* ── Childcare Gap Intelligence ─────────────────────────────── */}
        <TabsContent value="childcare">
          <div className="space-y-6">
            {/* WSRCA 9-county footprint */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-5 w-5 text-teal-500" />
                <h3 className="font-semibold text-base">WSRCA Footprint — 9-County Central Texas</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Live data from Texas HHSC CCL dataset (data.texas.gov bc5r-88dy). Capacity and
                provider counts reflect active licensed operations. Slot gap = estimated demand
                minus licensed capacity (children 0–12, ACS 2022); positive means modeled need.
              </p>
              {wsrcaLoading && !wsrcaData ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-lg" />
                  ))}
                </div>
              ) : wsrcaData ? (
                <>
                {wsrcaLoading && (
                  <div className="mb-3 text-xs text-muted-foreground" role="status" data-testid="wsrca-refreshing">
                    Refreshing live HHSC CCL data; showing the last successful county results.
                  </div>
                )}
                {wsrcaQueryError && (
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900" role="alert" data-testid="wsrca-stale-warning">
                    <span>The latest WSRCA refresh failed. The county cards below are the last successful result.</span>
                    <Button type="button" size="sm" variant="outline" onClick={() => refetchWsrca()} disabled={wsrcaLoading}>
                      {wsrcaLoading ? "Retrying…" : "Try again"}
                    </Button>
                  </div>
                )}
                {wsrcaData.counties.some((county) => county.error) && (
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900" role="alert" data-testid="wsrca-partial-warning">
                    <span>Some WSRCA counties were unavailable from the live HHSC CCL source. Available county cards remain usable; this is not a zero-provider result.</span>
                    <Button type="button" size="sm" variant="outline" onClick={() => refetchWsrca()} disabled={wsrcaLoading} data-testid="button-retry-wsrca">
                      {wsrcaLoading ? "Retrying…" : "Retry WSRCA"}
                    </Button>
                  </div>
                )}
                {wsrcaData.counties.length === 0 ? (
                  <Card className="p-4 text-center text-sm text-muted-foreground" data-testid="wsrca-empty">
                    <div role="alert">The live HHSC CCL source returned no WSRCA county rows. This is not evidence of zero providers.</div>
                    <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => refetchWsrca()} disabled={wsrcaLoading}>
                      {wsrcaLoading ? "Retrying…" : "Retry WSRCA data"}
                    </Button>
                  </Card>
                ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="wsrca-counties">
                  {wsrcaData.counties.map((c) => {
                    const coveragePct = c.coverageRate != null ? Math.round(c.coverageRate * 100) : null;
                    const gapSign = (c.slotGap ?? 0) > 0;
                    return (
                      <Card key={c.county} className="p-4" data-testid={`wsrca-county-${c.county}`}>
                        {c.error ? (
                          <div className="text-xs text-destructive" role="alert">{c.county}: {c.error}</div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-sm">{c.county.replace(/_/g, " ")}</span>
                              {coveragePct != null && (
                                <Badge
                                  variant={coveragePct >= 80 ? "default" : coveragePct >= 50 ? "secondary" : "destructive"}
                                  className="text-xs"
                                >
                                  {coveragePct}% coverage
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span>Providers</span>
                              <span className="font-medium text-foreground text-right">{c.totalProviders?.toLocaleString() ?? "—"}</span>
                              <span>Licensed slots</span>
                              <span className="font-medium text-foreground text-right">{c.totalLicensedCapacity?.toLocaleString() ?? "—"}</span>
                              <span>Est. demand</span>
                              <span className="font-medium text-foreground text-right">
                                {c.estimatedDemand != null ? c.estimatedDemand.toLocaleString() : "—"}
                              </span>
                              <span>Slot gap</span>
                              <span className={`font-medium text-right ${gapSign ? "text-destructive" : "text-emerald-600"}`}>
                                {c.slotGap != null ? (gapSign ? `+${c.slotGap.toLocaleString()} needed` : `${Math.abs(c.slotGap).toLocaleString()} covered`) : "—"}
                              </span>
                            </div>
                            <p className="mt-3 border-t pt-2 text-[11px] leading-relaxed text-muted-foreground">
                              Slot gap is modeled demand versus active licensed capacity, not confirmed open vacancies. Source: {c.dataSource ?? "HHSC CCL"}{c.retrievedAt ? `; response timestamp ${new Date(c.retrievedAt).toLocaleDateString()}` : ""}.
                            </p>
                          </>
                        )}
                      </Card>
                    );
                  })}
                </div>
                )}
                </>
              ) : (
                <Card className="p-4 text-center text-sm text-muted-foreground">
                  <div role="alert">{wsrcaQueryError instanceof Error ? wsrcaQueryError.message : "WSRCA childcare data unavailable. HHSC CCL dataset may be temporarily unreachable."}</div>
                  <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => refetchWsrca()} disabled={wsrcaLoading} data-testid="button-retry-wsrca">
                    {wsrcaLoading ? "Retrying…" : "Retry WSRCA data"}
                  </Button>
                </Card>
              )}
            </div>

            {/* Nationwide county search */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-teal-500" />
                <h3 className="font-semibold text-base">Nationwide County Search</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Search any U.S. county. Texas counties use live HHSC CCL data; all other states use
                Census County Business Patterns (CBP 2022, NAICS 6244) with ACS child population estimates.
              </p>
              <div className="flex gap-2 mb-4">
                <Input
                  value={childcareSearchInput}
                  onChange={(e) => setChildcareSearchInput(e.target.value)}
                  placeholder="e.g. Williamson County, TX or Cook County, IL"
                  aria-label="County and state for childcare search"
                  className="flex-1"
                  data-testid="childcare-search-input"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && childcareSearchInput.trim()) {
                      setChildcareSearchQuery(childcareSearchInput.trim());
                    }
                  }}
                />
                <Button
                  size="sm"
                  disabled={!childcareSearchInput.trim() || childcareSearchLoading}
                  onClick={() => setChildcareSearchQuery(childcareSearchInput.trim())}
                  aria-busy={childcareSearchLoading}
                  aria-label={childcareSearchLoading ? "Searching childcare data" : "Search childcare data"}
                  data-testid="childcare-search-btn"
                >
                  {childcareSearchLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> <span>Searching…</span></> : "Search"}
                </Button>
              </div>

              {childcareSearchError && (
                <div className="text-sm text-destructive mb-3 flex flex-wrap items-center gap-2" role="alert" data-testid="childcare-search-error">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{childcareSearchError.message}</span>
                  <Button type="button" size="sm" variant="outline" onClick={() => refetchChildcareSearch()} disabled={childcareSearchLoading}>
                    Try again
                  </Button>
                </div>
              )}

              {!childcareSearchData && !childcareSearchError && !childcareSearchLoading && (
                <p className="text-sm text-muted-foreground" data-testid="childcare-search-empty">
                  Enter a county and state above to load the latest available childcare intelligence.
                </p>
              )}

              {childcareSearchData && (
                <Card className="p-4" role="status" aria-live="polite" data-testid="childcare-search-result">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-semibold">
                        {childcareSearchData.county}
                        {childcareSearchData.displayName?.includes(",")
                          ? `, ${childcareSearchData.displayName.split(",").slice(1).join(",").trim()}`
                          : ""}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                         {childcareSearchData.summary.dataSource} · Response timestamp {new Date(childcareSearchData.summary.retrievedAt).toLocaleDateString()}
                      </p>
                    </div>
                     {childcareSearchData.slotGap.coverageRate != null && (
                      <Badge
                        variant={
                           childcareSearchData.slotGap.coverageRate >= 0.8
                            ? "default"
                            : childcareSearchData.slotGap.coverageRate >= 0.5
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                       {Math.round(childcareSearchData.slotGap.coverageRate * 100)}% coverage
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
                    {[
                       { label: "Total providers", value: childcareSearchData.summary.totalProviders?.toLocaleString() ?? "—" },
                       { label: "Licensed slots", value: childcareSearchData.summary.totalLicensedCapacity != null ? childcareSearchData.summary.totalLicensedCapacity.toLocaleString() : "Not standardized outside Texas" },
                       { label: "Est. demand (0–12)", value: childcareSearchData.slotGap.estimatedDemand != null ? childcareSearchData.slotGap.estimatedDemand.toLocaleString() : "—" },
                       { label: "Slot gap", value: childcareSearchData.slotGap.slotGap != null ? (childcareSearchData.slotGap.slotGap > 0 ? `+${childcareSearchData.slotGap.slotGap.toLocaleString()} needed` : `${Math.abs(childcareSearchData.slotGap.slotGap).toLocaleString()} covered`) : "—" },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="font-semibold text-sm">{value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="border-t pt-2 text-[11px] leading-relaxed text-muted-foreground">
                    {childcareSearchData.slotGap.methodology} Source: {childcareSearchData.slotGap.dataSource}. Positive values mean modeled demand exceeds capacity; this is not a count of confirmed open vacancies or available slots.
                  </p>
                  {childcareSearchData.warnings.length > 0 && (
                    <div className="text-xs text-muted-foreground border-t pt-2 mt-2 space-y-1">
                      {childcareSearchData.warnings.map((w, i) => (
                        <p key={i} className="flex items-start gap-1">
                          <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5 text-amber-500" /> {w}
                        </p>
                      ))}
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="training">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={trainingFilter} onValueChange={setTrainingFilter}>
                <SelectTrigger className="w-44" data-testid="select-training-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                </SelectContent>
              </Select>
              <div className="ml-auto flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{completedTrainings}/{SAMPLE_TRAININGS.length} complete</span>
                <Progress value={(completedTrainings / SAMPLE_TRAININGS.length) * 100} className="w-24 h-2" />
              </div>
            </div>

            <div className="space-y-3" data-testid="section-trainings">
              {trainings.map(training => (
                <Card key={training.id} className="p-4" data-testid={`card-training-${training.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="rounded-md p-2 bg-violet-100 dark:bg-violet-900/30 shrink-0">
                        <GraduationCap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-semibold text-sm">{training.title}</h4>
                          {getTrainingStatusBadge(training.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">{training.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {training.duration}
                          </span>
                          <Badge variant="outline" className="text-[10px]">{training.category}</Badge>
                          {training.completedDate && (
                            <span>Completed: {new Date(training.completedDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-5" data-testid="card-certification-info">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" /> CHW Certification Pathway
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Complete the required training modules to earn your CHW certification. Many states now recognize CHW certification for Medicaid reimbursement.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { title: "Core Competencies", hours: "80 hours", desc: "Foundation skills for community health work" },
                  { title: "Supervised Practicum", hours: "40 hours", desc: "Field experience under certified CHW" },
                  { title: "Continuing Education", hours: "20 hours/year", desc: "Annual CE requirements for recertification" },
                ].map((req, i) => (
                  <div key={i} className="p-3 rounded-md bg-muted/30" data-testid={`text-cert-req-${i}`}>
                    <p className="text-sm font-medium">{req.title}</p>
                    <p className="text-xs text-muted-foreground">{req.hours}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{req.desc}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="supervisor">
          {(() => {
            const caseloadSize = activeCases;
            const highRiskRatio = activeCases > 0 ? highRisk / activeCases : 0;
            const overdueRatio = activeCases > 0 ? overdueFollowUps / activeCases : 0;
            const visitLoad = visits.length;
            const burnoutScore =
              (caseloadSize > 15 ? 30 : caseloadSize > 10 ? 15 : 0) +
              (highRiskRatio > 0.3 ? 30 : highRiskRatio > 0.15 ? 15 : 0) +
              (overdueRatio > 0.25 ? 25 : overdueRatio > 0.1 ? 12 : 0) +
              (visitLoad > 20 ? 15 : visitLoad > 12 ? 8 : 0);
            const burnoutLevel = burnoutScore >= 60 ? "high" : burnoutScore >= 30 ? "moderate" : "low";
            const burnoutColor = burnoutLevel === "high" ? "text-red-600 dark:text-red-400" : burnoutLevel === "moderate" ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400";
            const burnoutBg = burnoutLevel === "high" ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800" : burnoutLevel === "moderate" ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800";
            return (
              <div className="space-y-6" data-testid="tab-content-supervisor">
                <Card className={`p-5 border ${burnoutBg}`} data-testid="card-burnout-risk">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                    <div>
                      <h3 className="font-bold text-base flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        CHW Wellbeing & Burnout Risk
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">Based on caseload size, high-risk ratio, and visit frequency. Update weekly.</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-3xl font-bold ${burnoutColor}`} data-testid="text-burnout-score">{burnoutScore}</p>
                      <p className={`text-sm font-semibold capitalize ${burnoutColor}`} data-testid="text-burnout-level">{burnoutLevel} risk</p>
                    </div>
                  </div>
                  <Progress value={Math.min(burnoutScore, 100)} className="h-2 mb-4" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Caseload", value: `${caseloadSize}`, flag: caseloadSize > 15, tip: "Recommended max: 15 active cases per CHW" },
                      { label: "High-Risk %", value: `${Math.round(highRiskRatio * 100)}%`, flag: highRiskRatio > 0.3, tip: ">30% high-risk signals supervision gap" },
                      { label: "Overdue %", value: `${Math.round(overdueRatio * 100)}%`, flag: overdueRatio > 0.25, tip: ">25% overdue follow-ups = capacity alert" },
                      { label: "Visits/Mo", value: `${visitLoad}`, flag: visitLoad > 20, tip: ">20 home visits/month may indicate overload" },
                    ].map(({ label, value, flag, tip }) => (
                      <div key={label} className={`p-3 rounded-md ${flag ? "bg-red-100/60 dark:bg-red-900/20" : "bg-muted/30"}`} data-testid={`stat-supervisor-${label.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className={`text-xl font-bold ${flag ? "text-red-700 dark:text-red-400" : ""}`}>{value}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{tip}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Card className="p-5" data-testid="card-supervision-actions">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4 text-teal-500" /> Recommended Supervisor Actions
                    </h3>
                    <ul className="space-y-2">
                      {[
                        { done: caseloadSize <= 15, text: `Caseload within safe range (current: ${caseloadSize})` },
                        { done: overdueFollowUps === 0, text: `No overdue follow-ups (${overdueFollowUps} pending)` },
                        { done: highRisk === 0, text: `High-risk cases have active safety plans (${highRisk} flagged)` },
                        { done: burnoutScore < 30, text: "Burnout risk score below threshold" },
                        { done: false, text: "Schedule monthly 1:1 supervision session" },
                        { done: false, text: "Review secondary trauma & self-care check-in" },
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" data-testid={`action-supervisor-${i}`}>
                          {item.done
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            : <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />}
                          <span className={item.done ? "text-muted-foreground line-through" : ""}>{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>

                  <Card className="p-5" data-testid="card-research-anchors">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Brain className="h-4 w-4 text-violet-500" /> Research-Backed Benchmarks
                    </h3>
                    <div className="space-y-3 text-xs">
                      {[
                        { title: "Optimal Caseload (CDC / NACHW)", body: "10–15 active clients per CHW for sustained quality. Above 20 sharply increases error rates and burnout." },
                        { title: "High-Risk Threshold", body: "30%+ high-risk concentration signals need for supervisor co-visits, peer debriefs, or caseload redistribution." },
                        { title: "Supervision Frequency (APHA)", body: "Weekly group + monthly individual supervision reduces secondary traumatic stress by ~40%." },
                        { title: "Self-Care Protocol", body: "Structured debriefs after critical incidents within 48h. Referral to EAP when burnout score exceeds 60." },
                      ].map(({ title, body }) => (
                        <div key={title} className="p-2 rounded bg-muted/30">
                          <p className="font-semibold text-[11px]">{title}</p>
                          <p className="text-muted-foreground">{body}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                <Card className="p-5 border-violet-200 dark:border-violet-800" data-testid="card-itw-shadow-workers">
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-500" /> Shadow CHW Recognition (Integration Through Invitation)
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Community members doing CHW work informally — promotoras, peer navigators, faith health advocates — can self-identify for stipends and credentialing pathways. No credential check required.
                  </p>
                  <Button size="sm" variant="outline" asChild data-testid="button-shadow-chw-hub">
                    <a href="/shadow-worker-hub">View Shadow Worker Hub →</a>
                  </Button>
                </Card>
              </div>
            );
          })()}
        </TabsContent>
        <TabsContent value="three-realities" data-testid="tab-content-three-realities">
          {!threeRealitiesGeographyKey ? (
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">Enter a ZIP in the Community Safety section to view this community’s Three Realities diagnostic.</p>
            </Card>
          ) : threeRealitiesLoading ? (
            <Card className="p-5"><p className="text-sm text-muted-foreground">Loading assessment…</p></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle>Research Reality</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>{threeRealities?.researchReality?.summary ?? "No assessment yet"}</p>
                  {(threeRealities?.researchReality?.citations ?? []).map((citation, index) => <p key={index} className="text-xs text-muted-foreground">{citation}</p>)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Political Reality</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>{threeRealities?.politicalReality?.summary ?? "No assessment yet"}</p>
                  {(threeRealities?.politicalReality?.barriers ?? []).map((barrier, index) => <p key={index} className="text-xs text-muted-foreground">{barrier}</p>)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Ground Truth</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>{threeRealities?.groundTruth?.summary ?? "No assessment yet"}</p>
                  <p className="text-muted-foreground">{threeRealities?.groundTruth?.observationCount ?? 0} observations</p>
                  {(threeRealities?.groundTruth?.themes ?? []).map((theme, index) => <p key={index} className="text-xs text-muted-foreground">{theme}</p>)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Gap Diagnosis</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>{threeRealities?.gapDiagnosis?.primaryGap ?? "Insufficient data for diagnosis"}</p>
                  <p className="text-muted-foreground">CFIR domain: {threeRealities?.gapDiagnosis?.cfirDomain ?? "Not identified"}</p>
                  <p className="text-muted-foreground">ERIC strategy: {threeRealities?.gapDiagnosis?.ericStrategy ?? "Not identified"}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DirectoryRow({ name, operator, desc, href }: { name: string; operator: string; desc: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 rounded-md border bg-background hover:bg-muted/30 transition-colors"
      data-testid={`link-directory-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm font-semibold text-primary flex items-center gap-1.5">
          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {name}
        </p>
        <Badge variant="secondary" className="text-[10px]">Source: {operator}</Badge>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
    </a>
  );
}
