import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { logJourneyEvent } from "@/lib/journey-log";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { JURISDICTIONS } from "@shared/nationwide/jurisdictions";
import { COUNTIES_BY_STATE } from "@shared/nationwide/counties";
import {
  ChevronLeft, ChevronRight, Heart, Shield, Home, Users, Baby,
  DollarSign, Building2, Stethoscope, CheckCircle2, Loader2, Search,
  MapPin, Phone, FileText, ArrowRight, Star, Sparkles, ClipboardList,
  HandHeart, Printer, UserCheck, Calendar, Globe, Clock, XCircle, CheckCircle,
  Send, Copy, ExternalLink, Briefcase, HardHat, Flame, KeyRound, GraduationCap,
  MessageCircle, ListChecks, Loader2 as Loader2Icon
} from "lucide-react";

const STEPS = [
  { key: "welcome", label: "Welcome", icon: HandHeart },
  { key: "household", label: "Your Household", icon: Users },
  { key: "situation", label: "Your Situation", icon: Heart },
  { key: "current", label: "Current Benefits", icon: ClipboardList },
  { key: "results", label: "Your Results", icon: Star },
  { key: "next", label: "Next Steps", icon: ArrowRight },
];

// States that have at least one county in our nationwide dataset, sorted by full name.
const STATE_OPTIONS = JURISDICTIONS
  .filter(j => (COUNTIES_BY_STATE[j.code] || []).length > 0)
  .sort((a, b) => a.name.localeCompare(b.name));

// USPS code (e.g. "TX") -> 2-digit state FIPS (e.g. "48"). Used to assemble the
// 5-digit county FIPS the API expects: stateFips + 3-digit countyFips.
const STATE_FIPS_BY_USPS: Record<string, string> = Object.fromEntries(
  JURISDICTIONS.map(j => [j.code, j.fips])
);

const BENEFIT_INFO: Record<string, { name: string; icon: any; color: string; description: string; annualValue: number; docs: string[] }> = {
  SNAP: { name: "SNAP (Food Benefits)", icon: Home, color: "#22c55e", description: "Monthly funds loaded onto an EBT card for groceries", annualValue: 3024, docs: ["ID for all household members", "Proof of income (pay stubs, tax return)", "Proof of residence (utility bill, lease)", "Social Security numbers"] },
  Medicaid: { name: "Medicaid", icon: Stethoscope, color: "#3b82f6", description: "Free or low-cost health coverage including doctor visits, hospital, prescriptions, mental health", annualValue: 7200, docs: ["ID", "Proof of income", "Proof of residence", "Social Security number", "Immigration documents (if applicable)"] },
  CHIP: { name: "CHIP (Children's Health Insurance)", icon: Baby, color: "#06b6d4", description: "Health coverage for children in families who earn too much for Medicaid but can't afford private insurance", annualValue: 2400, docs: ["Child's birth certificate or ID", "Parent/guardian ID", "Proof of income", "Social Security numbers"] },
  WIC: { name: "WIC (Women, Infants & Children)", icon: Heart, color: "#ec4899", description: "Nutrition support, healthy food, breastfeeding support for pregnant women and children under 5", annualValue: 528, docs: ["ID for parent and child", "Proof of income", "Proof of residence", "Proof of pregnancy (if applicable)"] },
  Marketplace: { name: "Health Insurance Marketplace", icon: Building2, color: "#f97316", description: "Subsidized health insurance plans — many families pay $0-50/month with tax credits", annualValue: 5400, docs: ["ID", "Social Security number", "Proof of income", "Current insurance info (if any)"] },
  EITC: { name: "Earned Income Tax Credit", icon: DollarSign, color: "#eab308", description: "Tax refund up to $7,430 for working families — you may be owed money from previous years too", annualValue: 3584, docs: ["Tax return", "W-2s or 1099s", "Social Security numbers for all family members", "Child's birth certificate (if claiming children)"] },
  CTC: { name: "Child Tax Credit", icon: Users, color: "#14b8a6", description: "Up to $2,000 per child under 17 — refundable even if you owe no taxes", annualValue: 3600, docs: ["Tax return", "Child's Social Security number", "Proof child lived with you"] },
  SSI: { name: "SSI (Supplemental Security Income)", icon: Shield, color: "#8b5cf6", description: "Monthly income for people with disabilities or age 65+ with limited income", annualValue: 10092, docs: ["ID", "Medical records", "Proof of disability", "Bank statements", "Proof of income/resources"] },
  SSDI: { name: "SSDI (Social Security Disability)", icon: Shield, color: "#a855f7", description: "Monthly income for people who worked and paid into Social Security but can no longer work due to disability", annualValue: 16560, docs: ["ID", "Social Security number", "Medical records", "Work history", "Doctor contact information"] },
  TANF: { name: "TANF (Temporary Cash Assistance)", icon: DollarSign, color: "#f59e0b", description: "Monthly cash assistance for families with children and very low income, plus job-readiness support", annualValue: 6444, docs: ["ID", "Birth certificates for children", "Proof of income", "Social Security numbers", "Proof of residency"] },
  CCDF: { name: "Child Care Assistance", icon: Baby, color: "#0ea5e9", description: "Helps pay for child care so a parent can work, look for work, or attend school/training", annualValue: 8400, docs: ["Child's birth certificate", "Proof of income", "Proof of work/school enrollment", "Social Security numbers"] },
  LIHEAP: { name: "Home Energy Assistance (LIHEAP)", icon: Flame, color: "#ef4444", description: "Helps pay heating and cooling bills, and can help with weatherization or utility shutoff prevention", annualValue: 1200, docs: ["ID", "Proof of income", "A recent utility bill", "Social Security numbers"] },
  Section8: { name: "Housing Choice Vouchers (Section 8)", icon: KeyRound, color: "#6366f1", description: "Rental assistance that pays part of your rent directly to a private landlord", annualValue: 12000, docs: ["ID for all household members", "Social Security cards", "Birth certificates", "Income verification", "Rental history"] },
  VeteransBenefits: { name: "VA Disability & Benefits", icon: GraduationCap, color: "#065f46", description: "Disability compensation, health care, and other benefits for veterans based on service-connected conditions", annualValue: 18000, docs: ["DD-214", "Service records", "Medical records", "Social Security number"] },
  UnemploymentInsurance: { name: "Unemployment Insurance", icon: Briefcase, color: "#0891b2", description: "Weekly payments to replace part of your income while you look for a new job after losing one through no fault of your own", annualValue: 7800, docs: ["Social Security number", "Driver's license or state ID", "Employer names/addresses (last 18 months)", "Dates of employment and reason for separation", "Bank account for direct deposit"] },
  WorkersComp: { name: "Workers' Compensation", icon: HardHat, color: "#b45309", description: "Covers medical care and part of your lost wages if you were injured or got sick because of your job", annualValue: 15600, docs: ["Written notice of injury given to employer", "Medical records tying the injury to your job", "Incident report or witness statements", "Recent pay stubs", "Employer/insurance carrier information"] },
};

// Which "situation" toggle each newly-added program depends on, so the
// screener honestly reflects that these two are situational rather than
// income-based like most of the catalog above.
const SITUATIONAL_PROGRAM_FLAGS: Record<string, keyof ScreenerData> = {
  UnemploymentInsurance: "isUnemployed",
  WorkersComp: "hadWorkplaceInjury",
};

// Generic stage timeline for "How to Apply" — most safety-net programs
// follow this shape. A few programs (tax credits, VA disability) get a
// tailored variant below since "interview" and "waitlist" don't apply to them.
type ApplyStage = { title: string; detail: string };
const DEFAULT_APPLY_STAGES: ApplyStage[] = [
  { title: "Gather your documents", detail: "Collect the items in the checklist below before you start — having them ready avoids a stalled application." },
  { title: "Submit your application", detail: "Apply online, by phone, or in person at your local office (links below). Save your confirmation number or screenshot." },
  { title: "Verification / interview", detail: "The agency may call, mail a request, or schedule a short interview to confirm your information. Respond by the deadline in their letter — missing it is the #1 reason applications get denied." },
  { title: "Decision", detail: "You'll get a written notice (mail, email, or portal message) approving, denying, or asking for more information. Federal law caps how long most agencies can take — see processing time below." },
  { title: "If denied — appeal", detail: "You have the right to appeal almost any denial, usually within 30-90 days. Ask for the appeal in writing and keep a copy. A navigator or legal aid office can help for free." },
];
const APPLY_STAGE_OVERRIDES: Record<string, ApplyStage[]> = {
  EITC: [
    { title: "Gather your tax documents", detail: "W-2s/1099s, Social Security numbers for everyone on the return, and last year's return if you have it." },
    { title: "File your tax return", detail: "EITC and CTC are claimed by filing a federal tax return — even if you don't owe taxes or aren't required to file. Free filing help (VITA) is available if your income is under the IRS threshold." },
    { title: "IRS processes your return", detail: "By law, the IRS cannot issue EITC/CTC refunds before mid-February, even if you file in January." },
    { title: "Refund arrives", detail: "Track it at irs.gov/refunds. Direct deposit is fastest." },
  ],
  CTC: [
    { title: "Gather your tax documents", detail: "W-2s/1099s, Social Security numbers for each qualifying child, and last year's return if you have it." },
    { title: "File your tax return", detail: "The Child Tax Credit is claimed on your federal tax return. Free filing help (VITA) is available if your income is under the IRS threshold." },
    { title: "IRS processes your return", detail: "Processing typically takes a few weeks for e-filed returns with direct deposit." },
    { title: "Refund/credit arrives", detail: "Track it at irs.gov/refunds." },
  ],
  VeteransBenefits: [
    { title: "Gather your service & medical records", detail: "DD-214, any medical evidence connecting a condition to your service, and current treatment records." },
    { title: "File your claim", detail: "Apply online at VA.gov, by mail, or with free help from a Veterans Service Officer (VSO) — VSOs are trained, free, and often get better outcomes." },
    { title: "C&P exam", detail: "The VA may schedule a Compensation & Pension exam to evaluate your condition. Attend — missing it can result in denial." },
    { title: "Decision", detail: "The VA issues a rating decision by mail/portal. Average time is well over 100 days — check status at VA.gov." },
    { title: "If denied or rated too low — appeal", detail: "You can request a Higher-Level Review, file a Supplemental Claim, or appeal to the Board of Veterans' Appeals. A VSO can help for free." },
  ],
  UnemploymentInsurance: [
    { title: "File your claim immediately", detail: "File the same week you become unemployed — payments are not retroactive before your filing date in most states." },
    { title: "Weekly certification", detail: "Most states require you to certify weekly or bi-weekly that you're able, available, and actively searching for work — missing this pauses payment." },
    { title: "Waiting period", detail: "Most states have one unpaid waiting week built into the process." },
    { title: "Payments begin", detail: "Typically 2-3 weeks after a complete, verified claim." },
    { title: "If denied — appeal", detail: "You can appeal a denial, usually within 10-30 days depending on your state. Keep records of your job search." },
  ],
  WorkersComp: [
    { title: "Report the injury to your employer", detail: "Do this immediately, in writing if possible — many states have short deadlines (as little as a few days to 30 days)." },
    { title: "Get medical treatment", detail: "See a doctor (sometimes your employer/insurer designates one) and make sure the injury is documented as work-related." },
    { title: "Employer files the claim", detail: "Your employer or their insurance carrier files the claim with the state workers' comp agency. Follow up to confirm it was filed." },
    { title: "Insurer decision", detail: "The insurer accepts, denies, or disputes the claim. Wage-replacement and medical benefits begin if accepted." },
    { title: "If denied — appeal", detail: "You can request a hearing with your state's workers' comp board or use free legal aid — retaliation for a valid claim is illegal in every state." },
  ],
};
function getApplyStages(programCode: string): ApplyStage[] {
  return APPLY_STAGE_OVERRIDES[programCode] || DEFAULT_APPLY_STAGES;
}

interface ScreenerData {
  state: string;       // USPS code (e.g., "TX", "IL")
  county: string;      // 5-digit county FIPS (e.g., "48453") — never shown to the user
  zipCode: string;
  householdSize: string;
  annualIncome: string;
  hasChildren: boolean;
  childrenUnder5: boolean;
  isPregnant: boolean;
  isDisabled: boolean;
  isElderly: boolean;
  isUnemployed: boolean;
  hadWorkplaceInjury: boolean;
  preferredLanguage: string;
  currentBenefits: string[];
  contactName: string;
  contactPhone: string;
}

const INITIAL_DATA: ScreenerData = {
  state: "TX", county: "", zipCode: "", householdSize: "1", annualIncome: "",
  hasChildren: false, childrenUnder5: false, isPregnant: false,
  isDisabled: false, isElderly: false, isUnemployed: false, hadWorkplaceInjury: false,
  preferredLanguage: "English",
  currentBenefits: [], contactName: "", contactPhone: "",
};

// ── Capacity badge helpers ────────────────────────────────────────────────────
// An org using programCode="general" is shown under every benefit ONLY when its
// serviceZips is null/empty (i.e. they serve the whole area). If serviceZips is
// non-empty and the user's ZIP was not in that list, the capacity endpoint already
// filtered them out, so we don't re-filter here — but we do honour the
// programCode match to avoid showing truly unrelated records.
function CapacityBadge({ programCode, capacityOrgs, userZip }: {
  programCode: string;
  capacityOrgs: any[];
  userZip: string;
}) {
  const matches = capacityOrgs.filter((o) => {
    // Exact program match: always show.
    if (o.programCode === programCode) return true;
    // "general" record: show ONLY when the org has no serviceZips restriction
    // (null or empty array = it serves the entire area / all programs).
    // If serviceZips is non-empty, the org is ZIP-scoped to specific areas and
    // must not appear as a universal match for every benefit card.
    if (o.programCode === "general" && (!o.serviceZips || o.serviceZips.length === 0)) return true;
    return false;
  });
  if (matches.length === 0) return null;

  const open = matches.filter((o) => o.status === "open");
  const waitlist = matches.filter((o) => o.status === "waitlist");
  const closed = matches.filter((o) => o.status === "closed");

  // Inline contact actions: "Call" tel: link when the org published a phone,
  // "Apply / learn more" when it published a URL. Rendered under the status line.
  const ContactLinks = ({ o }: { o: any }) => {
    // Only render http(s) URLs — never javascript:/data: from a bad record.
    const safeUrl = typeof o.contactUrl === "string" && /^https?:\/\//i.test(o.contactUrl.trim())
      ? o.contactUrl.trim()
      : null;
    if (!o.contactPhone && !safeUrl) return null;
    return (
      <span className="flex items-center gap-3 mt-0.5">
        {o.contactPhone && (
          <a
            href={`tel:${String(o.contactPhone).replace(/[^+\d]/g, "")}`}
            className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400 underline underline-offset-2"
            onClick={(e) => e.stopPropagation()}
            data-testid={`capacity-call-${o.id}`}
          >
            <Phone className="h-3 w-3 shrink-0" /> Call {o.contactPhone}
          </a>
        )}
        {safeUrl && (
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400 underline underline-offset-2"
            onClick={(e) => e.stopPropagation()}
            data-testid={`capacity-link-${o.id}`}
          >
            <ExternalLink className="h-3 w-3 shrink-0" /> Apply / learn more
          </a>
        )}
      </span>
    );
  };

  // Render a "as of N days ago" staleness note when the capacity record is
  // older than 7 days (stale:true set by the server). Fresh entries show nothing.
  const StaleNote = ({ o }: { o: any }) => {
    if (!o.stale) return null;
    // Compute days-ago label when updatedAt is available; fall back to generic.
    let label = "info may be outdated";
    if (o.updatedAt) {
      const days = Math.floor((Date.now() - new Date(o.updatedAt).getTime()) / (24 * 60 * 60 * 1000));
      label = days >= 1 ? `as of ${days} day${days !== 1 ? "s" : ""} ago` : "info may be outdated";
    }
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 italic"
        data-testid={`capacity-stale-note-${o.id}`}
        title="This capacity data is more than 7 days old. Verify with the organization before referring."
      >
        <Clock className="h-2.5 w-2.5 shrink-0" />
        {label}
      </span>
    );
  };

  return (
    <div className="mt-2 pl-9 space-y-1" data-testid={`capacity-${programCode}`}>
      {open.map((o) => (
        <div key={o.id} className={`flex items-start gap-2 text-xs ${o.stale ? "text-green-600/70 dark:text-green-500/60" : "text-green-700 dark:text-green-400"}`}>
          <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span className="flex flex-col">
            <span><strong className="font-semibold">{o.orgName}</strong> — Open now{o.note ? `: ${o.note}` : ""}</span>
            <StaleNote o={o} />
            <ContactLinks o={o} />
          </span>
        </div>
      ))}
      {waitlist.map((o) => (
        <div key={o.id} className={`flex items-start gap-2 text-xs ${o.stale ? "text-amber-600/70 dark:text-amber-500/60" : "text-amber-700 dark:text-amber-400"}`}>
          <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span className="flex flex-col">
            <span>
              <strong className="font-semibold">{o.orgName}</strong> — Waitlist
              {o.waitWeeks ? ` ~${o.waitWeeks} wk${o.waitWeeks !== 1 ? "s" : ""}` : ""}
              {o.note ? `: ${o.note}` : ""}
            </span>
            <StaleNote o={o} />
            <ContactLinks o={o} />
          </span>
        </div>
      ))}
      {closed.map((o) => (
        <div key={o.id} className={`flex items-start gap-2 text-xs ${o.stale ? "text-red-500/70 dark:text-red-400/60" : "text-red-600 dark:text-red-400"}`}>
          <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span className="flex flex-col">
            <span><strong className="font-semibold">{o.orgName}</strong> — Closed intake{o.note ? `: ${o.note}` : ""}</span>
            <StaleNote o={o} />
            <ContactLinks o={o} />
          </span>
        </div>
      ))}
    </div>
  );
}

// ── CHW Send-Referral dialog ──────────────────────────────────────────────────
interface SendReferralState {
  programCode: string;
  programName: string;
  orgName: string;
  orgId: string;
  clientName: string;
  clientPhone: string;
}

function SendReferralDialog({
  open,
  initial,
  screeningId,
  capacityOrgs,
  onClose,
}: {
  open: boolean;
  initial: SendReferralState | null;
  screeningId: number | null;
  capacityOrgs: any[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<SendReferralState>(initial ?? {
    programCode: "", programName: "", orgName: "", orgId: "", clientName: "", clientPhone: "",
  });
  const [statusUrl, setStatusUrl] = useState<string | null>(null);
  const [waitlistAcknowledged, setWaitlistAcknowledged] = useState(false);

  // Sync form when a new referral target is opened
  useEffect(() => {
    if (initial) { setForm(initial); setWaitlistAcknowledged(false); }
  }, [initial?.programCode]);

  // Live capacity check for the org being referred to. Matches by orgId when
  // set, otherwise by case-insensitive org name; exact program record wins
  // over a "general" record.
  const capacityMatch = useMemo(() => {
    const norm = (s: string) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
    const nameNorm = norm(form.orgName);
    const programNorm = norm(form.programCode);
    if (!nameNorm && !form.orgId) return null;
    const candidates = capacityOrgs.filter((o) => {
      const idMatch = form.orgId && o.orgId === form.orgId;
      const nameMatch = norm(o.orgName) === nameNorm;
      if (!idMatch && !nameMatch) return false;
      return norm(o.programCode) === programNorm || norm(o.programCode) === "general";
    });
    if (candidates.length === 0) return null;
    return candidates.find((o) => norm(o.programCode) === programNorm) ?? candidates[0];
  }, [capacityOrgs, form.orgName, form.orgId, form.programCode]);

  const isClosed = capacityMatch?.status === "closed";
  const isWaitlist = capacityMatch?.status === "waitlist";

  const referralMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/referrals", {
        programCode: form.programCode,
        orgName: form.orgName,
        orgId: form.orgId || undefined,
        clientDisplayName: form.clientName || undefined,
        clientPhone: form.clientPhone || undefined,
        screeningId: screeningId ?? undefined,
        waitlistAcknowledged: waitlistAcknowledged || undefined,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setStatusUrl(data.statusUrl ?? null);
      toast({ title: "Referral sent!", description: `Referral created for ${form.orgName}.` });
    },
    onError: (err: any) => {
      // Server returns 409 with a specific message for closed/waitlist orgs.
      const raw = String(err?.message || "");
      const msg = raw.startsWith("409:")
        ? (() => { try { return JSON.parse(raw.slice(4).trim()).error; } catch { return raw.slice(4).trim(); } })()
        : "Could not create referral. Try again.";
      toast({ title: "Referral blocked", description: msg, variant: "destructive" });
    },
  });

  function copyStatusUrl() {
    if (!statusUrl) return;
    const full = `${window.location.origin}${statusUrl}`;
    navigator.clipboard.writeText(full).then(() =>
      toast({ title: "Copied!", description: "Status link copied to clipboard." })
    );
  }

  function handleClose() {
    setStatusUrl(null);
    setForm({ programCode: "", programName: "", orgName: "", orgId: "", clientName: "", clientPhone: "" });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" /> Send Referral
          </DialogTitle>
          <DialogDescription>
            {form.programName && <span className="font-medium text-foreground">{form.programName}</span>}
          </DialogDescription>
        </DialogHeader>

        {statusUrl ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-300 p-4 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto" />
              <p className="font-semibold text-green-800 dark:text-green-300">Referral Created!</p>
              <p className="text-sm text-muted-foreground">Share this status link with the client so they can track their referral:</p>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  readOnly
                  value={`${window.location.origin}${statusUrl}`}
                  className="text-xs"
                  data-testid="referral-status-url"
                />
                <Button size="icon" variant="outline" onClick={copyStatusUrl} title="Copy link">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" asChild>
                  <a href={statusUrl} target="_blank" rel="noopener noreferrer" title="Open status page">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
            <Button className="w-full" variant="outline" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Organization name <span className="text-destructive">*</span></Label>
              <Input
                value={form.orgName}
                onChange={e => setForm({ ...form, orgName: e.target.value })}
                placeholder="e.g. Austin Community Food Bank"
                data-testid="referral-org-name"
              />
            </div>
            <div className="space-y-1">
              <Label>Client name <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                value={form.clientName}
                onChange={e => setForm({ ...form, clientName: e.target.value })}
                placeholder="First name only is fine"
                data-testid="referral-client-name"
              />
            </div>
            <div className="space-y-1">
              <Label>Client phone <span className="text-muted-foreground text-xs">(optional — for status link delivery)</span></Label>
              <Input
                value={form.clientPhone}
                onChange={e => setForm({ ...form, clientPhone: e.target.value })}
                placeholder="e.g. 512-555-0100"
                data-testid="referral-client-phone"
              />
            </div>
            {isClosed && (
              <div className="flex items-start gap-2 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 rounded-md p-3" role="alert" data-testid="referral-capacity-closed">
                <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-semibold">{capacityMatch.orgName}</strong> has <strong>closed intake</strong> for this program right now.
                  Referrals can't be sent — please choose a different organization.
                </span>
              </div>
            )}
            {isWaitlist && (
              <div className="space-y-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-md p-3" role="alert" data-testid="referral-capacity-waitlist">
                <p className="flex items-start gap-2">
                  <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-semibold">{capacityMatch.orgName}</strong> is currently on a <strong>waitlist</strong>
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
                  The client understands the wait — send anyway
                </label>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!form.orgName.trim() || referralMutation.isPending || isClosed || (isWaitlist && !waitlistAcknowledged)}
                onClick={() => referralMutation.mutate()}
                data-testid="button-submit-referral"
              >
                {referralMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" /> Send Referral</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// "How to Apply" guided walkthrough: stage timeline + document checklist +
// official links + a program-scoped AI coach chat. Opened from a result card.
function ApplyGuideDialog({ programCode, guide, state, onClose }: {
  programCode: string | null;
  guide: any;
  state: string;
  onClose: () => void;
}) {
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const info = programCode ? BENEFIT_INFO[programCode] : null;

  useEffect(() => {
    setChatMessages([]);
    setChatInput("");
  }, [programCode]);

  const coachMutation = useMutation({
    mutationFn: async (question: string) => {
      // /api/navigator/chat streams Server-Sent Events (not plain JSON) — read
      // and accumulate the "content" chunks the same way the main Navigator does.
      const scoped = `[The user is asking specifically about how to apply for ${info?.name || programCode} in ${state || "their state"}. Answer only about this program's application process, documents, offices, deadlines, and appeals — keep it concrete and specific.] ${question}`;
      const response = await fetch("/api/navigator/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: scoped, responseMode: "brief" }),
      });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.content) fullText += parsed.content;
            } catch {
              // ignore malformed/partial SSE fragments
            }
          }
        }
      }
      return fullText || "I don't have a specific answer to that — try calling the hotline above.";
    },
    onSuccess: (text) => {
      setChatMessages(prev => [...prev, { role: "assistant", text }]);
    },
    onError: () => {
      setChatMessages(prev => [...prev, { role: "assistant", text: "Something went wrong reaching the AI coach. Please try again, or call the hotline below." }]);
    },
  });

  const sendChat = () => {
    const q = chatInput.trim();
    if (!q || coachMutation.isPending) return;
    setChatMessages(prev => [...prev, { role: "user", text: q }]);
    setChatInput("");
    coachMutation.mutate(q);
  };

  if (!programCode || !info) return null;
  const Icon = info.icon;
  const stages = getApplyStages(programCode);
  const url = guide?.applicationUrl;
  const officeFinder = guide?.officeFinder;
  const hotline = guide?.hotline;
  const days = guide?.processingDays;

  return (
    <Dialog open={!!programCode} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" data-testid="dialog-apply-guide">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" style={{ color: info.color }} /> How to Apply: {info.name}
          </DialogTitle>
          <DialogDescription>Step-by-step, with real links and a place to ask questions.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {days && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Typical processing time: {days}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-white rounded-md px-3 py-1.5" style={{ backgroundColor: info.color }} data-testid="guide-apply-link">
                <ExternalLink className="h-3 w-3" /> Apply Online →
              </a>
            )}
            {officeFinder && (
              <a href={officeFinder} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold border rounded-md px-3 py-1.5 hover:bg-muted transition-colors" data-testid="guide-office-finder">
                <MapPin className="h-3 w-3" /> Find Local Office
              </a>
            )}
            {hotline && (
              <a href={`tel:${hotline.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 text-xs font-semibold border rounded-md px-3 py-1.5 hover:bg-muted transition-colors" data-testid="guide-hotline">
                <Phone className="h-3 w-3" /> Call {hotline}
              </a>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold mb-2 flex items-center gap-1.5"><ListChecks className="h-4 w-4" /> What happens, step by step</p>
            <ol className="space-y-3">
              {stages.map((s, i) => (
                <li key={s.title} className="flex gap-3">
                  <div className="shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</div>
                  <div>
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2 flex items-center gap-1.5"><FileText className="h-4 w-4" /> Documents you'll need</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {info.docs.map((d: string) => (
                <li key={d} className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" /> {d}</li>
              ))}
            </ul>
          </div>

          <div className="border rounded-lg p-3 bg-muted/30">
            <p className="text-sm font-semibold mb-2 flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> Ask the Apply Coach</p>
            <p className="text-xs text-muted-foreground mb-2">Ask a specific question about applying for {info.name} — like "what if I don't have a birth certificate?"</p>
            <div className="space-y-2 max-h-48 overflow-y-auto mb-2">
              {chatMessages.map((m, i) => (
                <div key={i} className={`text-xs rounded-md p-2 ${m.role === "user" ? "bg-primary/10 ml-6" : "bg-background border mr-6"}`}>
                  {m.text}
                </div>
              ))}
              {coachMutation.isPending && (
                <div className="text-xs rounded-md p-2 bg-background border mr-6 flex items-center gap-1.5 text-muted-foreground">
                  <Loader2Icon className="h-3 w-3 animate-spin" /> Thinking…
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") sendChat(); }}
                placeholder="Type your question…"
                className="text-xs h-8"
                data-testid="input-apply-coach"
              />
              <Button size="sm" className="h-8" onClick={sendChat} disabled={!chatInput.trim() || coachMutation.isPending} data-testid="button-apply-coach-send">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function BenefitsScreenerPage() {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ScreenerData>(INITIAL_DATA);
  const [result, setResult] = useState<any>(null);
  const [chwMode, setChwMode] = useState(false);
  const [referralTarget, setReferralTarget] = useState<SendReferralState | null>(null);
  const [screeningId, setScreeningId] = useState<number | null>(null);
  const [applyGuideProgram, setApplyGuideProgram] = useState<string | null>(null);

  // Counties in the currently-selected state. Recomputed only when the state changes.
  const countiesInState = useMemo(
    () => COUNTIES_BY_STATE[data.state] || [],
    [data.state],
  );

  // Fetch live capacity data when we have results (step 4)
  const { data: capacityData } = useQuery<{ orgs: any[]; count: number }>({
    queryKey: ["/api/directory/capacity", data.zipCode],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (data.zipCode) params.set("zip", data.zipCode);
      const res = await fetch(`/api/directory/capacity?${params}`);
      return res.json();
    },
    enabled: step === 4,
    staleTime: 5 * 60 * 1000,
  });
  const capacityOrgs = capacityData?.orgs ?? [];

  const screenMutation = useMutation({
    mutationFn: async () => {
      const stateFips = STATE_FIPS_BY_USPS[data.state] || "";
      // Backend expects 5-digit county FIPS (state FIPS + 3-digit county FIPS).
      const fullCountyFips = stateFips && data.county ? stateFips + data.county : "";
      const res = await apiRequest("POST", "/api/benefits/screenings", {
        screeningType: "wizard",
        householdSize: parseInt(data.householdSize),
        annualIncome: parseFloat(data.annualIncome) || 0,
        hasChildren: data.hasChildren,
        isPregnant: data.isPregnant,
        isDisabled: data.isDisabled,
        isElderly: data.isElderly,
        isUnemployed: data.isUnemployed,
        hadWorkplaceInjury: data.hadWorkplaceInjury,
        currentBenefits: data.currentBenefits,
        stateFips,
        countyFips: fullCountyFips,
        zipCode: data.zipCode,
        preferredLanguage: data.preferredLanguage,
      });
      return res.json();
    },
    onSuccess: (res) => {
      setResult(res);
      setStep(4);
      // Capture the screening ID so referrals can link back to it.
      if (res?.id) setScreeningId(parseInt(res.id, 10));
      queryClient.invalidateQueries({ queryKey: ["/api/benefits/screenings"] });
      const eligibleCount = Array.isArray(res?.eligibility) ? res.eligibility.filter((e: any) => e.eligible).length : 0;
      logJourneyEvent({
        eventType: "benefit_screened",
        eventDomain: "benefits",
        eventTitle: `Benefits screening completed (${eligibleCount} programs eligible)`,
        eventPayload: { eligibleCount, state: data.state, county: data.county, householdSize: data.householdSize },
        sourcePage: "Benefits Screener",
      });
    },
    onError: () => toast({ title: "Error", description: "Screening failed. Please try again.", variant: "destructive" }),
  });

  const canProceed = () => {
    if (step === 1) return data.county && data.householdSize && data.annualIncome;
    if (step === 2) return true;
    if (step === 3) return true;
    return true;
  };

  const handleNext = () => {
    if (step === 3) {
      screenMutation.mutate();
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-background" data-testid="benefits-screener">
      <SendReferralDialog
        open={!!referralTarget}
        initial={referralTarget}
        screeningId={screeningId}
        capacityOrgs={capacityOrgs}
        onClose={() => setReferralTarget(null)}
      />
      <ApplyGuideDialog
        programCode={applyGuideProgram}
        guide={applyGuideProgram ? result?.navigationGuides?.[applyGuideProgram] : null}
        state={data.state}
        onClose={() => setApplyGuideProgram(null)}
      />
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="h-7 w-7 text-red-500" />
            <h1 className="text-xl md:text-2xl font-bold" data-testid="text-screener-title">Benefits Eligibility Screener</h1>
          </div>
          <p className="text-sm text-muted-foreground">Free · Confidential · Takes 3 minutes</p>
          <div className="flex items-center gap-2 justify-center mt-2 flex-wrap">
            <Badge variant="outline" className="text-xs">Powered by ThriveUp Academy</Badge>
            <Badge variant="outline" className="text-xs">The Collaborative Advocate Foundation</Badge>
          </div>
          {/* CHW Field Mode toggle — lets navigators send referrals directly from results */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <Label htmlFor="chw-mode-toggle" className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
              <UserCheck className="h-3.5 w-3.5" /> CHW Field Mode
            </Label>
            <Switch
              id="chw-mode-toggle"
              checked={chwMode}
              onCheckedChange={setChwMode}
              data-testid="switch-chw-mode"
            />
          </div>
          {chwMode && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
              Field mode active — "Send Referral" buttons will appear on each result
            </p>
          )}
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Step {step + 1} of {STEPS.length}: {STEPS[step].label}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.key} className={`flex flex-col items-center ${i <= step ? 'text-primary' : 'text-muted-foreground/40'}`}>
                  <Icon className="h-4 w-4" />
                </div>
              );
            })}
          </div>
        </div>

        {step === 0 && (
          <Card data-testid="step-welcome">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center space-y-3">
                <Sparkles className="h-12 w-12 mx-auto text-yellow-500" />
                <h2 className="text-xl font-bold">Let's Find Your Benefits</h2>
                <p className="text-muted-foreground">
                  You may qualify for programs that help with food, healthcare, childcare, and more.
                  We'll ask a few simple questions and show you everything you might be eligible for — all at once.
                </p>
              </div>
              <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-4 space-y-2 text-sm">
                  <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> <strong>Free</strong> — this costs you nothing</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> <strong>Confidential</strong> — your information is protected</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> <strong>No immigration status required</strong> — mixed-status families welcome</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> <strong>9 programs checked at once</strong> — SNAP, Medicaid, CHIP, EITC, WIC, and more</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> <strong>Help available</strong> — we'll connect you with someone who can assist in person</p>
                </CardContent>
              </Card>
              <div className="text-center">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Globe className="h-3 w-3" /> Available in English and Spanish
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card data-testid="step-household">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5" /> About Your Household</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>What state do you live in?</Label>
                  <Select
                    value={data.state}
                    onValueChange={v => setData({ ...data, state: v, county: "" })}
                  >
                    <SelectTrigger data-testid="select-state"><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {STATE_OPTIONS.map(s => (
                        <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>What county do you live in?</Label>
                  <Select value={data.county} onValueChange={v => setData({ ...data, county: v })} disabled={!data.state}>
                    <SelectTrigger data-testid="select-county">
                      <SelectValue placeholder={data.state ? "Select your county" : "Select a state first"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {countiesInState.map(c => (
                        <SelectItem key={c.countyFips} value={c.countyFips}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Zip code (optional)</Label>
                <Input value={data.zipCode} onChange={e => setData({...data, zipCode: e.target.value})} placeholder="e.g., 78660" data-testid="input-zip" />
              </div>
              <div>
                <Label>How many people live in your household? (including you)</Label>
                <Select value={data.householdSize} onValueChange={v => setData({...data, householdSize: v})}>
                  <SelectTrigger data-testid="select-household-size"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} {n === 1 ? "person" : "people"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>What is your household's total yearly income? (before taxes)</Label>
                <Input type="number" value={data.annualIncome} onChange={e => setData({...data, annualIncome: e.target.value})} placeholder="e.g., 25000" data-testid="input-income" />
                <p className="text-xs text-muted-foreground mt-1">Include all income from all household members — wages, tips, child support, disability payments</p>
              </div>
              <div>
                <Label>Preferred language</Label>
                <Select value={data.preferredLanguage} onValueChange={v => setData({...data, preferredLanguage: v})}>
                  <SelectTrigger data-testid="select-language"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="Vietnamese">Vietnamese</SelectItem>
                    <SelectItem value="Arabic">Arabic</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card data-testid="step-situation">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Heart className="h-5 w-5" /> Your Situation</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">These help us check for additional programs you might qualify for.</p>
              {[
                { key: "hasChildren", label: "Do you have children under 18 in your household?", icon: Baby },
                { key: "childrenUnder5", label: "Do you have children under 5? (or are pregnant)", icon: Heart },
                { key: "isPregnant", label: "Is anyone in the household currently pregnant?", icon: Heart },
                { key: "isDisabled", label: "Does anyone in the household have a disability?", icon: Shield },
                { key: "isElderly", label: "Is anyone in the household age 65 or older?", icon: UserCheck },
                { key: "isUnemployed", label: "Has anyone recently lost a job and is looking for work?", icon: Briefcase },
                { key: "hadWorkplaceInjury", label: "Has anyone been injured or gotten sick because of their job?", icon: HardHat },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                      <Label className="cursor-pointer">{item.label}</Label>
                    </div>
                    <Switch
                      checked={(data as any)[item.key]}
                      onCheckedChange={v => setData({...data, [item.key]: v})}
                      data-testid={`switch-${item.key}`}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card data-testid="step-current">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ClipboardList className="h-5 w-5" /> What Are You Currently Receiving?</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Select any benefits you're already enrolled in. This helps us find what you're missing.</p>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(BENEFIT_INFO).map(([key, info]) => {
                  const Icon = info.icon;
                  const isSelected = data.currentBenefits.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => setData({...data, currentBenefits: isSelected ? data.currentBenefits.filter(b => b !== key) : [...data.currentBenefits, key]})}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                      data-testid={`button-benefit-${key}`}
                    >
                      <Icon className="h-5 w-5 shrink-0" style={{ color: info.color }} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{info.name}</p>
                      </div>
                      {isSelected && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">Don't worry if you're not sure — we'll still check everything.</p>
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/20 p-3 text-xs text-muted-foreground space-y-1" data-testid="notice-consent">
                <p className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground">Before you continue:</strong> This is a <strong>screening estimate, not an eligibility determination</strong>. Only the benefit program can decide if you qualify. The information you entered is <strong>stored securely to help a navigator connect you to services</strong> and is never sold or shared for marketing. By selecting "Check My Benefits" you consent to this use.
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && result && (
          <div className="space-y-4" data-testid="step-results">
            <Card className="border-green-500 bg-green-50/50 dark:bg-green-950/20">
              <CardContent className="pt-6 text-center space-y-2">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
                <h2 className="text-xl font-bold">Screening Complete!</h2>
                <p className="text-muted-foreground">
                  Based on your information, you may qualify for <strong>{result.gapBenefits?.length || 0} additional benefits</strong> worth up to
                </p>
                <p className="text-3xl font-bold text-green-600" data-testid="text-annual-value">
                  ${(result.estimatedAnnualValue || 0).toLocaleString()}/year
                </p>
              </CardContent>
            </Card>

            <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-900 dark:text-amber-100 flex items-start gap-2" data-testid="disclaimer-results">
              <Shield className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>This is an estimate, not a determination.</strong> These results show programs you <em>may</em> qualify for based on the information you entered. Final eligibility and benefit amounts are decided only by each program's official application. A navigator can help you apply.
              </span>
            </div>

            {result.gapBenefits?.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Benefits You May Qualify For</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {result.gapBenefits.map((b: string) => {
                    const info = BENEFIT_INFO[b];
                    if (!info) return null;
                    const Icon = info.icon;
                    return (
                      <div key={b} className="border rounded-lg p-4" data-testid={`result-benefit-${b}`}>
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className="h-6 w-6 shrink-0" style={{ color: info.color }} />
                          <div className="flex-1">
                            <h3 className="font-semibold">{info.name}</h3>
                            <p className="text-sm text-muted-foreground">{info.description}</p>
                          </div>
                          <Badge variant="secondary" className="shrink-0">~${info.annualValue.toLocaleString()}/yr</Badge>
                        </div>
                        <div className="mt-3 pl-9 space-y-2">
                          <CapacityBadge programCode={b} capacityOrgs={capacityOrgs} userZip={data.zipCode} />
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Documents you'll need:</p>
                          <ul className="text-xs text-muted-foreground space-y-0.5">
                            {info.docs.map(d => (
                              <li key={d} className="flex items-center gap-1"><FileText className="h-3 w-3 shrink-0" /> {d}</li>
                            ))}
                          </ul>
                          {(() => {
                            const guide = result?.navigationGuides?.[b];
                            const url = guide?.applicationUrl;
                            const officeFinder = guide?.officeFinder;
                            const hotline = guide?.hotline;
                            const note = guide?.notes || guide?.processingNote;
                            const days = guide?.processingDays;
                            if (!url && !officeFinder && !hotline) return null;
                            const safeHotlineHref = hotline
                              ? `tel:${hotline.replace(/[^\d+]/g, "")}`
                              : null;
                            return (
                              <div className="pt-2 space-y-2">
                                {days && <p className="text-xs text-muted-foreground">Processing: {days}</p>}
                                {note && <p className="text-xs text-muted-foreground italic">{note}</p>}
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {url && (
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-white rounded-md px-3 py-1.5"
                                      style={{ backgroundColor: info.color }}
                                      data-testid={`apply-link-${b}`}
                                    >
                                      <ExternalLink className="h-3 w-3" /> Apply Online →
                                    </a>
                                  )}
                                  {officeFinder && (
                                    <a
                                      href={officeFinder}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 text-xs font-semibold border rounded-md px-3 py-1.5 text-foreground hover:bg-muted transition-colors"
                                      data-testid={`office-finder-${b}`}
                                    >
                                      <MapPin className="h-3 w-3" /> Find Local Office
                                    </a>
                                  )}
                                  {hotline && safeHotlineHref && (
                                    <a
                                      href={safeHotlineHref}
                                      className="inline-flex items-center gap-1.5 text-xs font-semibold border rounded-md px-3 py-1.5 text-foreground hover:bg-muted transition-colors"
                                      data-testid={`hotline-${b}`}
                                    >
                                      <Phone className="h-3 w-3" /> Call {hotline}
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                          <Button
                            size="sm"
                            variant="default"
                            className="mt-2 gap-1.5 text-xs"
                            data-testid={`button-apply-guide-${b}`}
                            onClick={() => setApplyGuideProgram(b)}
                          >
                            <ListChecks className="h-3.5 w-3.5" /> Walk Me Through It
                          </Button>
                          {/* CHW Field Mode — Send Referral button */}
                          {chwMode && (() => {
                            // Pre-fill org from capacity data if an open org matches this program
                            const matchOrg = capacityOrgs.find(o =>
                              (o.programCode === b || (o.programCode === "general" && (!o.serviceZips || o.serviceZips.length === 0)))
                              && o.status === "open"
                            );
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-2 gap-1.5 text-xs border-primary text-primary hover:bg-primary/10"
                                data-testid={`button-send-referral-${b}`}
                                onClick={() => setReferralTarget({
                                  programCode: b,
                                  programName: info.name,
                                  orgName: matchOrg?.orgName ?? "",
                                  orgId: matchOrg?.orgId ?? "",
                                  clientName: "",
                                  clientPhone: "",
                                })}
                              >
                                <Send className="h-3.5 w-3.5" /> Send Referral
                              </Button>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {result.currentBenefits?.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm text-muted-foreground">Benefits You're Already Receiving</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {result.currentBenefits.map((b: string) => {
                      const info = BENEFIT_INFO[b];
                      return <Badge key={b} variant="outline">{info?.name || b}</Badge>;
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> We'll help you track renewal dates so you don't lose these benefits.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4" data-testid="step-next">
            <Card className="border-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
              <CardContent className="pt-6 text-center space-y-3">
                <UserCheck className="h-12 w-12 mx-auto text-blue-600" />
                <h2 className="text-xl font-bold">We're Here to Help</h2>
                <p className="text-muted-foreground">
                  You don't have to do this alone. A Community Health Worker or benefits navigator can help you gather documents, fill out applications, and follow up until you're enrolled.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Your Next Steps</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { step: "1", title: "Gather your documents", desc: "Use the checklist above to collect what you need. Don't worry about getting everything perfect — we can help.", icon: FileText },
                  { step: "2", title: "Get matched with a navigator", desc: "We'll connect you with someone in your area who speaks your language and can help in person.", icon: UserCheck },
                  { step: "3", title: "Apply together", desc: "Your navigator will walk you through each application. Emergency food, rent, and transportation help is available while applications are pending.", icon: HandHeart },
                  { step: "4", title: "Stay enrolled", desc: "We'll send reminders before your benefits need to be renewed so you never lose coverage.", icon: Calendar },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.step} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Badge className="shrink-0 mt-0.5">{item.step}</Badge>
                      <div>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium text-sm">{item.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Want to Connect Now?</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Your name (optional)</Label>
                  <Input value={data.contactName} onChange={e => setData({...data, contactName: e.target.value})} placeholder="First name is fine" data-testid="input-contact-name" />
                </div>
                <div>
                  <Label>Phone number (optional)</Label>
                  <Input value={data.contactPhone} onChange={e => setData({...data, contactPhone: e.target.value})} placeholder="We'll call or text you" data-testid="input-contact-phone" />
                </div>
                <a
                  href="https://www.211texas.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                  data-testid="button-connect"
                >
                  <Button className="w-full" size="lg">
                    <Phone className="h-4 w-4 mr-2" /> Connect Me with a Navigator
                  </Button>
                </a>
                <p className="text-xs text-muted-foreground text-center">
                  Or dial <strong>2-1-1</strong> (free, 24/7, available in 170+ languages) · TTY: 1-800-735-2989
                </p>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Printer className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Save or Print Your Results</p>
                    <p className="text-xs text-muted-foreground">Take a screenshot or print this page to bring with you when you apply.</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => window.print()} data-testid="button-print">
                      <Printer className="h-3 w-3 mr-1" /> Print Results
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center text-xs text-muted-foreground space-y-1 pb-8">
              <p>This screening is for informational purposes only. Final eligibility is determined by the program.</p>
              <p>Data sources: U.S. Census Bureau ACS, Federal Poverty Level Guidelines, state Medicaid/SNAP agencies</p>
              <p className="font-medium">The Collaborative Advocate Foundation · 501(c)(3) · EIN 41-3618003</p>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6">
          {step > 0 && step < 4 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)} data-testid="button-back">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          ) : <div />}

          {step < 4 && (
            <Button
              onClick={handleNext}
              disabled={!canProceed() || screenMutation.isPending}
              className="ml-auto"
              size="lg"
              data-testid="button-next"
            >
              {screenMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Checking benefits...</>
              ) : step === 3 ? (
                <><Search className="h-4 w-4 mr-2" /> Check My Benefits</>
              ) : step === 0 ? (
                <>Let's Get Started <ChevronRight className="h-4 w-4 ml-1" /></>
              ) : (
                <>Next <ChevronRight className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          )}

          {step === 4 && (
            <Button onClick={() => setStep(5)} className="ml-auto" size="lg" data-testid="button-next-steps">
              What Do I Do Next? <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}

          {step === 5 && (
            <Button variant="outline" onClick={() => { setStep(0); setData(INITIAL_DATA); setResult(null); }} className="ml-auto" data-testid="button-start-over">
              Screen Another Person
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
