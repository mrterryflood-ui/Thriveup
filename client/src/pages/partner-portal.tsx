import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useCurrentOrgId } from "@/hooks/use-current-org";
import { EvidenceSummary } from "@/components/evidence-label";
import {
  CheckCircle2, Circle, ArrowRight, Building2, FileText, Users, Sparkles,
  Map, Compass, Network, TrendingUp, Heart, RotateCcw, Home, GraduationCap,
  Baby, Zap, Shield, Command, AlertCircle, ExternalLink, ChevronRight,
  Clock, XCircle, CheckCircle, Plus, RefreshCw, CalendarCheck, LockKeyhole,
} from "lucide-react";
import { getToolsForOrg } from "@/lib/partner-tools";
import type { PartnerTool } from "@/lib/partner-tools";
import { useState } from "react";

function isSafeExternalUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

const ICON_MAP: Record<string, React.ElementType> = {
  Compass, FileText, Sparkles, Map, Network, Users, Zap, TrendingUp,
  Heart, Shield, Command, RotateCcw, Home, GraduationCap, Baby,
  Building2,
};

interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  done: boolean;
  path: string | null;
}

interface PortalData {
  org: {
    id: string;
    name: string;
    missionText: string | null;
    focusAreas: string[];
    populationsServed: string[];
    state: string | null;
    is501c3: boolean;
    ein: string | null;
    websiteUrl?: string;
  } | null;
  onboarding: {
    steps: OnboardingStep[];
    pct: number;
  };
  stats: {
    docCount: number;
    memberCount: number;
    focusAreas: string[];
    populationsServed: string[];
  } | null;
}

interface CurrentUserRole {
  role: string;
}

interface EventWorkspaceAccessStatus {
  authorized: boolean;
}

function ToolCard({ tool }: { tool: PartnerTool }) {
  const Icon = ICON_MAP[tool.icon] ?? Zap;
  return (
    <Link
      href={tool.path === "/community-resource-directory" ? "/resource-directory" : tool.path}
      data-testid={`card-tool-${tool.id}`}
      className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full"
    >
        <div className="flex items-start justify-between gap-2">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          {tool.badge && (
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {tool.badge}
            </Badge>
          )}
        </div>
        <div>
          <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
            {tool.label}
            <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-3">
            {tool.description}
          </p>
        </div>
    </Link>
  );
}

function StepItem({ step, index }: { step: OnboardingStep; index: number }) {
  const content = (
    <div
      data-testid={`step-${step.id}`}
      className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
        step.done
          ? "opacity-60"
          : "bg-primary/5 border border-primary/20 hover:bg-primary/10"
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {step.done ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <div className="h-5 w-5 rounded-full border-2 border-primary flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary">{index + 1}</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold ${step.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {step.label}
        </div>
        {!step.done && (
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>
        )}
      </div>
      {!step.done && step.path && (
        <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      )}
    </div>
  );

  if (!step.done && step.path) {
    return <Link href={step.path} className="block">{content}</Link>;
  }
  return content;
}

const PROGRAM_CODES = [
  "general", "SNAP", "Medicaid", "CHIP", "WIC", "EITC", "CTC", "SSI", "SSDI",
  "TANF", "CCDF", "LIHEAP", "Section8", "VeteransBenefits", "Marketplace",
];

function CapacityPanel({ isAuthenticated }: { isAuthenticated: boolean }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { orgId } = useCurrentOrgId();
  const [newProgram, setNewProgram] = useState("general");
  const [newStatus, setNewStatus] = useState("open");
  const [newWaitWeeks, setNewWaitWeeks] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<{ entries: any[]; orgId: string; orgName: string }>({
    queryKey: ["/api/partner-portal/capacity", orgId],
    enabled: isAuthenticated && !!orgId,
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/partner-portal/capacity", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(orgId ? { "x-org-id": orgId } : {}) },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/partner-portal/capacity", orgId] });
      setShowAdd(false);
      setNewProgram("general");
      setNewStatus("open");
      setNewWaitWeeks("");
      setNewNote("");
      setNewPhone("");
      setNewUrl("");
      toast({ title: "Intake status updated", description: "CHWs will see the change immediately." });
    },
    onError: (e: any) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const StatusBadge = ({ status, stale }: { status: string; stale?: boolean }) => {
    if (stale) return <Badge variant="outline" className="text-amber-600 border-amber-400 text-[10px]">⚠ Stale</Badge>;
    if (status === "open") return <Badge className="bg-green-600 text-white text-[10px]">Open now</Badge>;
    if (status === "waitlist") return <Badge className="bg-amber-500 text-white text-[10px]">Waitlist</Badge>;
    return <Badge variant="destructive" className="text-[10px]">Closed</Badge>;
  };

  return (
    <Card data-testid="card-capacity-panel">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Intake Capacity Status</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setShowAdd(!showAdd)}
            data-testid="button-add-capacity"
          >
            <Plus className="h-3 w-3" /> Add / Update
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          CHWs see this status on the Benefits Screener before making referrals.
          Entries older than 14 days are flagged stale.
        </p>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800 dark:border-red-800 dark:bg-red-950/20 dark:text-red-200" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <div className="flex-1"><span className="font-semibold block">Capacity status could not be loaded</span><span>Please retry before making an availability decision.</span></div>
            <Button type="button" size="sm" variant="outline" onClick={() => void refetch()} data-testid="button-retry-capacity">Retry</Button>
          </div>
        )}

        {!isLoading && !error && (!data?.entries || data.entries.length === 0) && !showAdd && (
          <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">No intake status published</span>
              Add your capacity status so CHWs know if you're accepting referrals.
            </div>
          </div>
        )}

        {data?.entries?.map((e) => (
          <div key={e.id} className="flex items-center justify-between p-2 border rounded-lg text-xs" data-testid={`capacity-entry-${e.programCode}`}>
            <div className="space-y-0.5">
              <span className="font-semibold">{e.programCode}</span>
              {e.waitWeeks && <span className="text-muted-foreground ml-2">~{e.waitWeeks} wk wait</span>}
              {e.note && <p className="text-muted-foreground">{e.note}</p>}
              {(e.contactPhone || e.contactUrl) && (
                <p className="text-muted-foreground">
                  {e.contactPhone && <a href={`tel:${e.contactPhone}`} className="text-primary hover:underline" data-testid={`capacity-entry-phone-${e.programCode}`}>📞 {e.contactPhone}</a>}
                  {e.contactPhone && e.contactUrl && <span> · </span>}
                  {e.contactUrl && isSafeExternalUrl(e.contactUrl) ? <a href={e.contactUrl} target="_blank" rel="noopener noreferrer" className="break-all text-primary hover:underline" data-testid={`capacity-entry-url-${e.programCode}`}>🔗 {e.contactUrl} <ExternalLink className="inline h-3 w-3" aria-hidden="true" /></a> : e.contactUrl ? <span>Source link unavailable</span> : null}
                </p>
              )}
            </div>
              <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={e.status} stale={e.stale} />
              <Select
                value={e.status}
                onValueChange={(v) => updateMutation.mutate({ programCode: e.programCode, status: v, waitWeeks: e.waitWeeks, note: e.note, contactPhone: e.contactPhone, contactUrl: e.contactUrl, serviceZips: e.serviceZips })}
              >
                <SelectTrigger aria-label={`Update ${e.programCode} capacity status`} className="h-6 w-24 text-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="waitlist">Waitlist</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}

        {showAdd && (
          <div className="border rounded-lg p-3 space-y-3 bg-muted/20" data-testid="form-add-capacity">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label htmlFor="capacity-program" className="text-xs">Program</Label>
                <Select value={newProgram} onValueChange={setNewProgram}>
                  <SelectTrigger id="capacity-program" aria-label="Program" className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROGRAM_CODES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="capacity-status" className="text-xs">Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="capacity-status" aria-label="Status" className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="waitlist">Waitlist</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {newStatus === "waitlist" && (
              <div>
                <Label className="text-xs">Approximate wait (weeks)</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={newWaitWeeks}
                  onChange={(e) => setNewWaitWeeks(e.target.value)}
                  placeholder="e.g. 3"
                />
              </div>
            )}
            <div>
              <Label className="text-xs">Note (optional)</Label>
              <Input
                className="h-8 text-xs"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="e.g. Call first to confirm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label htmlFor="capacity-phone" className="text-xs">Intake phone (optional)</Label>
                <Input
                  type="tel"
                  className="h-8 text-xs"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. 512-555-0142"
                  data-testid="input-capacity-phone"
                  id="capacity-phone"
                />
              </div>
              <div>
                <Label htmlFor="capacity-url" className="text-xs">Apply / info URL (optional)</Label>
                <Input
                  type="url"
                  className="h-8 text-xs"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://…"
                  data-testid="input-capacity-url"
                  id="capacity-url"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              CHWs see a "Call" and "Apply / learn more" link on the Benefits Screener when these are set.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => updateMutation.mutate({
                  programCode: newProgram,
                  status: newStatus,
                  waitWeeks: newWaitWeeks ? parseInt(newWaitWeeks) : undefined,
                  note: newNote || undefined,
                  contactPhone: newPhone.trim() || undefined,
                  contactUrl: newUrl.trim() || undefined,
                })}
                disabled={updateMutation.isPending}
                data-testid="button-save-capacity"
              >
                {updateMutation.isPending ? <><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Saving…</> : "Save status"}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PartnerPortalPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { orgId } = useCurrentOrgId();
  const [, setLocation] = useLocation();
  const { data: currentUserRole } = useQuery<CurrentUserRole>({
    queryKey: ["/api/academy/avatar"],
    enabled: isAuthenticated,
  });

  const { data, isLoading, error, refetch: refetchPortal } = useQuery<PortalData>({
    queryKey: ["/api/partner-portal/home", orgId ?? "default"],
    enabled: isAuthenticated && !!orgId,
    queryFn: async () => (await apiRequest("GET", "/api/partner-portal/home", undefined, orgId ? { "x-org-id": orgId } : undefined)).json(),
  });
  const eventWorkspaceAccess = useQuery<EventWorkspaceAccessStatus>({
    queryKey: ["/api/nonprofit-events/access", orgId ?? "default"],
    enabled: isAuthenticated && Boolean(currentUserRole),
    queryFn: async () => {
      try {
        return (await apiRequest("GET", "/api/nonprofit-events/access", undefined, orgId ? { "x-org-id": orgId } : undefined)).json();
      } catch (error) {
        if (error instanceof Error && /^(403|404):/.test(error.message)) return { authorized: false };
        throw error;
      }
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="portal-loading">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Loading your portal…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-8 space-y-4" data-testid="portal-unauthenticated">
          <Building2 className="h-10 w-10 text-primary mx-auto" />
          <h2 className="text-xl font-bold">Partner Portal</h2>
          <p className="text-sm text-muted-foreground">Sign in to access your organization's portal.</p>
          <a href="/api/login?returnTo=/partner-portal">
            <Button className="w-full" data-testid="button-signin-portal">Sign in to continue</Button>
          </a>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 space-y-4 text-center" data-testid="portal-error">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Partner Portal unavailable</h2>
          <p className="text-sm text-muted-foreground">Your organization data could not be loaded. No empty organization state was assumed.</p>
          <Button type="button" onClick={() => void refetchPortal()} data-testid="button-retry-portal">Try again</Button>
        </Card>
      </div>
    );
  }

  if (!data?.org) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 space-y-4 text-center" data-testid="portal-no-org">
          <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold">Set up your organization first</h2>
          <p className="text-sm text-muted-foreground">
            Create your organization profile to unlock your partner portal, tool access, and collaboration features.
          </p>
          <Link href="/onboarding/org">
            <Button className="w-full" data-testid="button-create-org">
              Create organization profile <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const { org, onboarding, stats } = data;
  const tools = getToolsForOrg(stats?.focusAreas ?? []);
  const nextStep = onboarding.steps.find((s) => !s.done);
  const allDone = onboarding.pct === 100;
  const canSeeEventWorkspaceSpotlight = eventWorkspaceAccess.data?.authorized === true;

  return (
    <div className="min-h-screen bg-background" data-testid="partner-portal-page">
      {/* Hero header */}
      <div className="border-b bg-gradient-to-r from-primary/5 via-primary/3 to-background">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs" data-testid="badge-org-type">
                  Community Partner
                </Badge>
                {org.is501c3 && (
                  <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50">
                    501(c)(3) Verified
                  </Badge>
                )}
                {org.state && (
                  <Badge variant="outline" className="text-xs">
                    {org.state}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="text-org-name">
                {org.name}
              </h1>
              {org.missionText && (
                <p className="text-sm text-muted-foreground max-w-xl leading-relaxed line-clamp-2" data-testid="text-org-mission">
                  {org.missionText}
                </p>
              )}
              {(org.focusAreas?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {org.focusAreas.slice(0, 5).map((area) => (
                    <Badge key={area} variant="outline" className="text-[10px]">
                      {area}
                    </Badge>
                  ))}
                  {org.focusAreas.length > 5 && (
                    <Badge variant="outline" className="text-[10px]">
                      +{org.focusAreas.length - 5} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2 shrink-0 flex-wrap">
              <Link href="/settings/organization">
                <Button variant="outline" size="sm" data-testid="button-edit-profile">
                  Edit Profile
                </Button>
              </Link>
              <Link href="/settings/documents">
                <Button variant="outline" size="sm" data-testid="button-manage-docs">
                  Documents {stats && stats.docCount > 0 && `(${stats.docCount})`}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 space-y-8">

        {/* Stats row */}
        {stats && (
          <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="stats-row">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary" data-testid="stat-docs">{stats.docCount}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Documents uploaded</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary" data-testid="stat-tools">{tools.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Tools unlocked</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary" data-testid="stat-focus">{stats.focusAreas.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Focus areas</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary" data-testid="stat-setup">{onboarding.pct}%</div>
              <div className="text-xs text-muted-foreground mt-0.5">Setup complete</div>
            </Card>
          </div>

          <EvidenceSummary claims={[{
            value: stats?.memberCount ?? null, unit: "partner members", source: "TCAF Partner Network Administrative Records",
            sourceId: "tcaf-partner-network", asOfDate: null, geographyKey: org?.state ?? null, confidence: "verified",
            decisionCaption: "Use your organization's verified administrative metrics to plan next steps.",
          }]} />
          </>
        )}

        {canSeeEventWorkspaceSpotlight && (
          <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-sm" data-testid="card-event-workspace-spotlight">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                    <CalendarCheck className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-primary text-primary-foreground" data-testid="badge-event-workspace-new">New</Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
                        Private organization workspace
                      </span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Community Events &amp; Impact</h2>
                      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                        Plan community events, record aggregate attendance only, connect source-linked needs to accountable actions, and prepare small-count-suppressed internal reports. Consent-gated stories stay separate from those reports.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <Link href="/organization/events">
                    <Button data-testid="button-open-event-workspace">
                      Open workspace <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/settings/organization">
                    <Button variant="outline" data-testid="button-manage-event-workspace-access">
                      Manage access
                    </Button>
                  </Link>
                </div>
              </div>
              <p className="mt-4 border-t border-primary/15 pt-3 text-xs text-muted-foreground">
                Access is limited to authorized organization staff. Organization owners manage access from Organization Profile without changing a person’s regular member or collaborator role.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column: onboarding journey */}
          <div className="lg:col-span-1 space-y-4">
            <Card data-testid="card-onboarding">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Getting started</CardTitle>
                  <span className="text-xs font-bold text-primary">{onboarding.pct}%</span>
                </div>
                <Progress value={onboarding.pct} className="h-1.5 mt-2" data-testid="progress-onboarding" />
                {allDone && (
                  <CardDescription className="text-green-600 text-xs font-medium mt-1">
                    ✓ All steps complete — you're fully set up.
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {onboarding.steps.map((step, i) => (
                  <StepItem key={step.id} step={step} index={i} />
                ))}
              </CardContent>
            </Card>

            {/* Intake Capacity */}
            <CapacityPanel isAuthenticated={isAuthenticated} />

            {/* What TCAF needs */}
            <Card data-testid="card-tcaf-needs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">What TCAF needs from you</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                {!stats || stats.docCount === 0 ? (
                  <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-amber-800 block">Upload your documents</span>
                      Capability statement, 501(c)(3) letter, and W-9 are required before we can team on any proposals.
                      <Link href="/settings/documents">
                        <a className="text-primary font-semibold block mt-1 hover:underline">
                          Upload now →
                        </a>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-foreground">Documents uploaded — you're ready to team on proposals.</span>
                  </div>
                )}
                {!org.ein && (
                  <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-blue-800 block">Add your EIN</span>
                      Required for federal grant teaming.
                      <Link href="/settings/organization">
                        <a className="text-primary font-semibold block mt-1 hover:underline">Update profile →</a>
                      </Link>
                    </div>
                  </div>
                )}
                <div className="border-t pt-2 mt-2 space-y-1.5">
                  <p className="text-[11px] font-semibold text-foreground">Contacts</p>
                  <div className="text-[11px] leading-relaxed">
                    Questions about teaming or proposals:{" "}
                    <a href="mailto:terryflood@thrivingcommunitiesforall.com" className="text-primary hover:underline">
                      terryflood@thrivingcommunitiesforall.com
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick links */}
            <Card data-testid="card-quick-links">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Quick links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {[
                  { label: "Collaboration hub", path: "/collaboration-hub" },
                  { label: "LifeBridge resources", path: "/resource-directory" },
                  { label: "Community map", path: "/community-map" },
                  { label: "Partner directory", path: "/partners" },
                  { label: "Benefits screener", path: "/benefits-screener" },
                ].map(({ label, path }) => (
                  <Link key={path} href={path}>
                    <a
                      data-testid={`link-quick-${path.replace(/\//g, "-")}`}
                      className="flex items-center gap-2 text-xs text-foreground hover:text-primary transition-colors py-1.5 px-2 rounded-md hover:bg-primary/5 group"
                    >
                      <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                      {label}
                    </a>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right column: tool tiles */}
          <div className="lg:col-span-2 space-y-4" id="tools">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold" data-testid="text-tools-heading">
                  Your tools
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {tools.length} tools matched to your focus areas
                  {(stats?.focusAreas?.length ?? 0) === 0 &&
                    " — add focus areas to your profile for a personalized set."}
                </p>
              </div>
              <Link href="/settings/organization">
                <Button variant="ghost" size="sm" className="text-xs" data-testid="button-customize-tools">
                  Customize
                </Button>
              </Link>
            </div>

            {tools.length === 0 ? (
              <Card className="p-8 text-center text-sm text-muted-foreground" data-testid="tools-empty">
                <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
                <p>Add focus areas to your organization profile to see your personalized tool set.</p>
                <Link href="/settings/organization">
                  <Button className="mt-4" size="sm" data-testid="button-add-focus">
                    Add focus areas
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3" data-testid="tools-grid">
                {tools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            )}

            {/* How it all fits together */}
            <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20" data-testid="card-how-it-works">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-primary">How we work together</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-3 text-xs">
                  {[
                    {
                      icon: Building2,
                      title: "You bring the mission",
                      desc: "Your org's focus areas, populations, and community presence shape every tool and proposal you access here.",
                    },
                    {
                      icon: Network,
                      title: "TCAF brings the infrastructure",
                      desc: "Platform, grant engine, coalition coordination, data tracking, AI tools, and a national partner network.",
                    },
                    {
                      icon: TrendingUp,
                      title: "Together we produce outcomes",
                      desc: "Every referral, placement, and dollar is tracked. You get shared credit, shared data, and shared visibility.",
                    },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="space-y-1.5">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <p className="font-semibold text-foreground">{title}</p>
                      <p className="text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-primary/10 text-center">
                  <p className="text-xs text-muted-foreground italic">
                    "Two wings, same bird — one heart, purpose, and direction, various missions."
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
