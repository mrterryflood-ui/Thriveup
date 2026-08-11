import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
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
import {
  Heart, Users, Shield, ClipboardCheck, MapPin, Phone,
  Calendar, Activity, ChevronRight, CheckCircle2, AlertTriangle,
  Clock, Home, FileText, Star, GraduationCap, BookOpen,
  Stethoscope, Brain, ExternalLink, Plus, TrendingUp,
  ArrowRight, Sparkles, Building2, UserCheck, Clipboard, Lightbulb, Loader2,
  Copy, Send,
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
  statusUrl?: string;
}

interface CreateReferralResponse {
  id?: string;
  statusUrl?: string;
  orgConfirmUrl?: string;
}

const SAMPLE_CASELOAD = [
  { id: "cl-1", name: "Client A", status: "active", riskLevel: "moderate", lastContact: "2026-03-15", nextFollowUp: "2026-03-22", screeningsComplete: 3, screeningsTotal: 5, notes: "Needs housing referral" },
  { id: "cl-2", name: "Client B", status: "active", riskLevel: "low", lastContact: "2026-03-16", nextFollowUp: "2026-03-30", screeningsComplete: 5, screeningsTotal: 5, notes: "All screenings complete" },
  { id: "cl-3", name: "Client C", status: "active", riskLevel: "high", lastContact: "2026-03-10", nextFollowUp: "2026-03-18", screeningsComplete: 1, screeningsTotal: 5, notes: "Urgent: substance use concerns, family crisis" },
  { id: "cl-4", name: "Client D", status: "active", riskLevel: "moderate", lastContact: "2026-03-14", nextFollowUp: "2026-03-21", screeningsComplete: 2, screeningsTotal: 5, notes: "Transportation barrier to appointments" },
  { id: "cl-5", name: "Client E", status: "inactive", riskLevel: "low", lastContact: "2026-02-28", nextFollowUp: null, screeningsComplete: 5, screeningsTotal: 5, notes: "Graduated from program" },
];

const SAMPLE_VISITS = [
  { id: "hv-1", clientName: "Client C", visitDate: "2026-03-17", visitType: "Initial Assessment", duration: 60, notes: "Completed intake, identified immediate needs for food assistance and counseling referral.", followUpNeeded: true, followUpDate: "2026-03-19" },
  { id: "hv-2", clientName: "Client A", visitDate: "2026-03-15", visitType: "Follow-Up", duration: 45, notes: "Reviewed housing options, connected with shelter coordinator.", followUpNeeded: true, followUpDate: "2026-03-22" },
  { id: "hv-3", clientName: "Client D", visitDate: "2026-03-14", visitType: "Screening", duration: 30, notes: "Completed behavioral health screening. Moderate risk identified.", followUpNeeded: false, followUpDate: null },
];

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

  const { data: liveData, isError: caseloadError } = useQuery({ queryKey: ["/api/chw/caseload"], retry: false });
  const { data: liveResources, isError: resourcesError } = useQuery({ queryKey: ["/api/chw/resources"], retry: false });

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
  const caseload: any[] = (!caseloadError && (liveData as any)?.caseload?.length) ? (liveData as any).caseload : SAMPLE_CASELOAD;
  const isLiveCaseload = !caseloadError && !!(liveData as any)?.isLive && (liveData as any)?.caseload?.length > 0;
  const visits = SAMPLE_VISITS;
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
                    <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2 mt-1 dark:text-red-400 dark:bg-red-950/30 dark:border-red-800" role="alert" data-testid="notice-org-closed">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-600 mt-0.5" />
                      <span>
                        <strong>{capacityMatch.orgName}</strong> has <strong>closed intake</strong> for this program right now. Referrals can't be sent — choose a different organization.
                      </span>
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
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Clipboard className="h-4 w-4 text-teal-500" /> My Sent Referrals
                  </h4>
                  {sentError ? (
                    <p className="text-xs text-red-600 dark:text-red-400" data-testid="text-sent-referrals-error">
                      Could not load referrals — check your connection and refresh.
                    </p>
                  ) : sentReferrals.length === 0 ? (
                    <p className="text-xs text-muted-foreground" data-testid="text-no-sent-referrals">
                      No referrals sent yet.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {sentReferrals.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between gap-2 rounded-md border p-2"
                          data-testid={`card-sent-referral-${r.id}`}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {r.orgName || "Organization"}
                              {r.programCode ? <span className="text-muted-foreground font-normal"> · {r.programCode}</span> : null}
                            </p>
                            {r.clientDisplayName && (
                              <p className="text-xs text-muted-foreground truncate">{r.clientDisplayName}</p>
                            )}
                          </div>
                          <div className="shrink-0">{getReferralStatusChip(r.status)}</div>
                        </div>
                      ))}
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
          <TabsTrigger value="training" data-testid="tab-training">Training</TabsTrigger>
          <TabsTrigger value="supervisor" data-testid="tab-supervisor">Supervisor View</TabsTrigger>
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
                {!isLiveCaseload && <Badge variant="outline" className="text-xs text-amber-600">Demo data</Badge>}
              </h3>
            </div>
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
            </div>
            <div className="space-y-3" data-testid="section-visits">
              {visits.map(visit => (
                <Card key={visit.id} className="p-4" data-testid={`card-visit-${visit.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-semibold">{visit.clientName}</p>
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
                          {/* tel: link lets CHWs call directly from their phone — Task #164 */}
                          <a
                            href={`tel:${resource.phone.replace(/\D/g, "")}`}
                            className="hover:text-teal-600 hover:underline"
                            data-testid={`link-phone-${resource.id}`}
                          >{resource.phone}</a>
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
