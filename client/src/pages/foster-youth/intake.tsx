import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Sparkles, Upload, CheckCircle2, FileText, Loader2, Save, Phone, ExternalLink } from "lucide-react";
import { CrisisStrip } from "@/components/foster-youth/crisis-strip";
import { IntegrationInvitation } from "@/components/integration-invitation";
import { STATE_ILP } from "@/data/foster-youth/state-ilp";
import { useToast } from "@/hooks/use-toast";
import { getVersioned, setVersioned, safeRemove } from "@/lib/safe-storage";

// Token-based access for youth WITHOUT accounts. Minimize exposure: keep the
// id+token in sessionStorage (cleared when the tab closes) with an expiry
// envelope, not localStorage forever.
const INTAKE_CRED_KEY = "foster-youth-intake-credentials";
const INTAKE_CRED_VERSION = 1;
const INTAKE_CRED_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

interface IntakeCred { id: string; token: string }
function isIntakeCred(v: unknown): v is IntakeCred {
  return !!v && typeof v === "object"
    && typeof (v as any).id === "string"
    && typeof (v as any).token === "string";
}

type Step = 1 | 2 | 3 | 4;

interface IntakeForm {
  firstName: string;
  preferredName: string;
  pronouns: string;
  age: string;
  ageOutDate: string;
  stateCode: string;
  currentSituation: string;
  immediateNeeds: string[];
  hasStateId: boolean;
  hasSsnCard: boolean;
  hasBirthCert: boolean;
  hasMedicaid: boolean;
  hasHousing: boolean;
  enrolledSchool: boolean;
  employed: boolean;
}

const NEED_OPTIONS = [
  { id: "housing", label: "Place to sleep tonight" },
  { id: "food", label: "Food today" },
  { id: "id", label: "State ID / driver's license" },
  { id: "medicaid", label: "Health insurance / Medicaid" },
  { id: "money", label: "Income / cash assistance" },
  { id: "school", label: "School enrollment / FAFSA" },
  { id: "job", label: "Job / training" },
  { id: "mental", label: "Mental health support" },
  { id: "transit", label: "Transportation" },
  { id: "legal", label: "Legal help" },
];

const DOC_TYPES = [
  { id: "state_id", label: "State ID / driver's license" },
  { id: "ssn", label: "Social Security card" },
  { id: "birth_cert", label: "Birth certificate" },
  { id: "court_order", label: "Court order / case paperwork" },
  { id: "medicaid_card", label: "Medicaid / insurance card" },
  { id: "school_records", label: "School records / transcripts" },
  { id: "etv_award", label: "ETV award letter" },
  { id: "lease", label: "Lease / housing letter" },
  { id: "other", label: "Other supporting document" },
];

const empty: IntakeForm = {
  firstName: "", preferredName: "", pronouns: "", age: "", ageOutDate: "",
  stateCode: "TX", currentSituation: "",
  immediateNeeds: [],
  hasStateId: false, hasSsnCard: false, hasBirthCert: false, hasMedicaid: false,
  hasHousing: false, enrolledSchool: false, employed: false,
};

interface UploadedDoc { id: string; docType: string; filename: string; size?: number }

interface IntakeRow {
  id: string;
  aiSummary: string | null;
  aiEligiblePrograms: any;
  aiPriorities: any;
  ai30DayPlan: any;
  ai60DayPlan: any;
  ai90DayPlan: any;
  aiWarmHandoffs: any;
  aiProvider: string | null;
  aiAnalyzedAt: string | null;
}

export default function FosterYouthIntakePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<IntakeForm>(empty);
  const [intakeId, setIntakeId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [sessionId] = useState<string>(() => {
    const k = "foster-youth-session-id";
    let v = typeof window !== "undefined" ? localStorage.getItem(k) : null;
    if (!v) { v = crypto.randomUUID(); if (typeof window !== "undefined") localStorage.setItem(k, v); }
    return v!;
  });

  // Restore last intake's id+token from sessionStorage so a refresh doesn't
  // lose access. Envelope validates version + expiry; expired/invalid drops.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const c = getVersioned<IntakeCred>(
      INTAKE_CRED_KEY,
      { version: INTAKE_CRED_VERSION, store: "session" },
      isIntakeCred,
    );
    if (c) { setIntakeId(c.id); setAccessToken(c.token); }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (intakeId && accessToken) {
      setVersioned<IntakeCred>(
        INTAKE_CRED_KEY,
        { id: intakeId, token: accessToken },
        { version: INTAKE_CRED_VERSION, store: "session", ttlMs: INTAKE_CRED_TTL_MS },
      );
    }
  }, [intakeId, accessToken]);

  const authHeaders = (): Record<string, string> => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (accessToken) h["x-intake-token"] = accessToken;
    return h;
  };
  const [uploads, setUploads] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<IntakeRow | null>(null);

  useEffect(() => {
    void fetch("/api/foster-youth/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, eventType: "intake_started", page: "/foster-youth/intake" }),
    }).catch(() => {});
  }, [sessionId]);

  const stateInfo = useMemo(() => STATE_ILP.find((s) => s.code === form.stateCode), [form.stateCode]);

  const update = <K extends keyof IntakeForm>(key: K, val: IntakeForm[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  async function saveIntake(nextStep?: Step) {
    const payload: Record<string, unknown> = {
      sessionId,
      ...form,
      age: form.age ? parseInt(form.age, 10) : null,
    };
    // First save = POST (server generates id + accessToken). Subsequent saves = PATCH with token.
    const isFirst = !intakeId || !accessToken;
    const url = isFirst ? "/api/foster-youth/intake" : `/api/foster-youth/intake/${intakeId}`;
    const method = isFirst ? "POST" : "PATCH";
    const r = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
    if (!r.ok) {
      toast({ title: "Save failed", description: await r.text(), variant: "destructive" });
      return null;
    }
    const data = await r.json();
    if (data.intake?.id) setIntakeId(data.intake.id);
    if (data.accessToken) setAccessToken(data.accessToken);
    if (nextStep) setStep(nextStep);
    // Return the fresh token alongside the row: React state set above is not
    // visible to the caller in this same tick, so first-upload flows must use
    // this value, not the (stale) accessToken state.
    return data.intake ? { ...data.intake, __accessToken: data.accessToken ?? accessToken } : null;
  }

  async function handleFile(file: File, docType: string) {
    let id = intakeId;
    let token = accessToken;
    if (!id || !token) {
      const created = await saveIntake();
      if (!created) return;
      id = created.id;
      token = created.__accessToken ?? null;
    }
    if (!id || !token) {
      toast({ title: "Upload failed", description: "Could not start your intake session. Please try saving again.", variant: "destructive" });
      return;
    }
    // Explicit headers with the fresh token — never rely on possibly-stale state.
    const hdrs: Record<string, string> = { "Content-Type": "application/json", "x-intake-token": token };
    setUploading(true);
    try {
      const reqUrl = await fetch(`/api/foster-youth/intake/${id}/upload-url`, {
        method: "POST",
        headers: hdrs,
        body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size, docType }),
      });
      if (!reqUrl.ok) throw new Error(await reqUrl.text() || "upload URL failed");
      const { uploadURL, objectPath } = await reqUrl.json();
      const put = await fetch(uploadURL, { method: "PUT", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file });
      if (!put.ok) throw new Error("upload PUT failed");
      // Best-effort text extraction for text-like files; PDFs/images need server OCR (later).
      let extractedText: string | undefined;
      if (file.type.startsWith("text/") || file.name.endsWith(".txt")) {
        extractedText = (await file.text()).slice(0, 20000);
      }
      const reg = await fetch(`/api/foster-youth/intake/${id}/document`, {
        method: "POST",
        headers: hdrs,
        body: JSON.stringify({ docType, filename: file.name, contentType: file.type, size: file.size, objectPath, extractedText }),
      });
      if (!reg.ok) throw new Error(await reg.text() || "doc register failed");
      const data = await reg.json();
      setUploads((u) => [...u, { id: data.document.id, docType, filename: file.name, size: file.size }]);
      toast({ title: "Uploaded", description: file.name });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function runAnalysis() {
    const saved = await saveIntake();
    if (!saved) return;
    const id = saved.id;
    setAnalyzing(true);
    try {
      const r = await fetch(`/api/foster-youth/intake/${id}/analyze`, { method: "POST", headers: authHeaders() });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setAnalysis(data.intake as IntakeRow);
      setStep(4);
    } catch (err: any) {
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  }

  const canStep2 = form.age && form.stateCode && form.currentSituation.trim().length > 0;

  return (
    <div className="min-h-screen bg-background" data-testid="page-foster-youth-intake">
      <CrisisStrip />
      {/* Youth-facing form: enforce >=44px touch targets on mobile for the
          form controls and buttons (Buttons default to 36px, Inputs/Select to
          36px). The `sm:` breakpoint relaxes back to the compact defaults on
          larger pointers. Checkbox/upload rows already tap the full p-3 label. */}
      <div className="max-w-4xl mx-auto px-4 py-6 [&_button]:min-h-[44px] [&_input]:min-h-[44px] [&_textarea]:min-h-[44px] [&_[role=combobox]]:min-h-[44px] sm:[&_button]:min-h-0 sm:[&_input]:min-h-0 sm:[&_textarea]:min-h-0 sm:[&_[role=combobox]]:min-h-0">
        <IntegrationInvitation
          surface="foster-intake"
          prompt="Are you already holding a foster youth's life together?"
          description="Kinship caregivers, former foster youth mentoring younger kids, ILP graduates supporting peers, faith-community aunties and uncles — you're inside this system. No license check. No proof asked. You decide what we do with what you share."
          suggestedRoleTags={["kinship caregiver", "former foster youth mentor", "ILP peer navigator", "lived-experience mentor", "faith community supporter", "bilingual advocate"]}
          className="mb-6"
        />
        <Link href="/foster-youth">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-hub">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Foster Youth Hub
          </Button>
        </Link>

        <div className="flex items-start gap-4 mb-6 flex-wrap">
          <div className="rounded-xl p-3 bg-gradient-to-br from-violet-500 to-purple-600 shrink-0 shadow-md">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-[280px]">
            <Badge variant="secondary" className="mb-2" data-testid="badge-tool">AI-assisted intake</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight" data-testid="text-intake-title">Tell us about you in 4 steps.</h1>
            <p className="text-muted-foreground italic" data-testid="text-intake-title-es">Cuéntanos sobre ti en 4 pasos.</p>
          </div>
        </div>

        <Alert className="mb-6" data-testid="alert-honest">
          <AlertTitle>Honest about what this is.</AlertTitle>
          <AlertDescription>
            This is a working tool. It saves what you enter, lets you upload documents (court paperwork, IDs, school records), and runs an AI to suggest the federal and state programs you likely qualify for and your immediate next steps. <strong>It is not legal advice and does not replace your caseworker.</strong> No login required. You control your information.
          </AlertDescription>
        </Alert>

        {/* Step indicator */}
        <div className="flex gap-2 mb-6" data-testid="stepper">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className={`flex-1 h-2 rounded ${step >= n ? "bg-primary" : "bg-muted"}`} data-testid={`step-indicator-${n}`} />
          ))}
        </div>

        {step === 1 && (
          <Card data-testid="card-step-1">
            <CardHeader>
              <CardTitle>Step 1 of 4 — Basics</CardTitle>
              <CardDescription>Only the things we actually use. You can skip anything.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First name (optional)</Label>
                  <Input id="firstName" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} data-testid="input-first-name" />
                </div>
                <div>
                  <Label htmlFor="preferredName">Preferred name (optional)</Label>
                  <Input id="preferredName" value={form.preferredName} onChange={(e) => update("preferredName", e.target.value)} data-testid="input-preferred-name" />
                </div>
                <div>
                  <Label htmlFor="pronouns">Pronouns (optional)</Label>
                  <Input id="pronouns" value={form.pronouns} onChange={(e) => update("pronouns", e.target.value)} placeholder="they/them, she/her, he/him..." data-testid="input-pronouns" />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" min={13} max={26} value={form.age} onChange={(e) => update("age", e.target.value)} data-testid="input-age" />
                </div>
                <div>
                  <Label htmlFor="ageOutDate">Age-out / discharge date (if known)</Label>
                  <Input id="ageOutDate" type="date" value={form.ageOutDate} onChange={(e) => update("ageOutDate", e.target.value)} data-testid="input-age-out-date" />
                </div>
                <div>
                  <Label htmlFor="stateCode">State</Label>
                  <Select value={form.stateCode} onValueChange={(v) => update("stateCode", v)}>
                    <SelectTrigger data-testid="select-state-trigger"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATE_ILP.map((s) => <SelectItem key={s.code} value={s.code} data-testid={`option-state-${s.code}`}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="currentSituation">In your own words, what's going on right now?</Label>
                <Textarea id="currentSituation" rows={4} value={form.currentSituation} onChange={(e) => update("currentSituation", e.target.value)} placeholder="Where are you living? Are you in school or working? What's the most urgent thing?" data-testid="textarea-situation" />
              </div>
              <div>
                <Label className="block mb-2">What do you need help with first? (check all that apply)</Label>
                <div className="grid sm:grid-cols-2 gap-2" data-testid="needs-checklist">
                  {NEED_OPTIONS.map((n) => {
                    const checked = form.immediateNeeds.includes(n.id);
                    return (
                      <label key={n.id} className="flex items-center gap-2 cursor-pointer rounded border p-2 hover:bg-accent">
                        <Checkbox
                          checked={checked}
                          aria-label={n.label}
                          onCheckedChange={(c) => {
                            const next = c ? [...form.immediateNeeds, n.id] : form.immediateNeeds.filter((x) => x !== n.id);
                            update("immediateNeeds", next);
                          }}
                          data-testid={`checkbox-need-${n.id}`}
                        />
                        <span className="text-sm">{n.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => saveIntake(2)} disabled={!canStep2} data-testid="button-next-step-2">
                  Save & continue <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card data-testid="card-step-2">
            <CardHeader>
              <CardTitle>Step 2 of 4 — What's already in place?</CardTitle>
              <CardDescription>Honest answers help us skip what you already have.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                ["hasStateId", "I have a state ID or driver's license"],
                ["hasSsnCard", "I have my Social Security card"],
                ["hasBirthCert", "I have my birth certificate"],
                ["hasMedicaid", "I have Medicaid or other health insurance"],
                ["hasHousing", "I have stable housing for the next 30 days"],
                ["enrolledSchool", "I'm enrolled in school or a training program"],
                ["employed", "I have a job"],
              ].map(([k, label]) => (
                <label key={k} className="flex items-center gap-3 cursor-pointer rounded border p-3 hover:bg-accent">
                  <Checkbox
                    checked={(form as any)[k]}
                    aria-label={label as string}
                    onCheckedChange={(c) => update(k as keyof IntakeForm, !!c as any)}
                    data-testid={`checkbox-${k}`}
                  />
                  <span>{label}</span>
                </label>
              ))}
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(1)} data-testid="button-prev-step-1"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button>
                <Button onClick={() => saveIntake(3)} data-testid="button-next-step-3">Save & continue <ArrowRight className="ml-1 h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card data-testid="card-step-3">
            <CardHeader>
              <CardTitle>Step 3 of 4 — Upload documents (optional)</CardTitle>
              <CardDescription>The more we know, the more specific the plan. Files are stored privately.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                {DOC_TYPES.map((d) => (
                  <label key={d.id} className="flex items-center gap-2 rounded border p-3 cursor-pointer hover:bg-accent" data-testid={`upload-row-${d.id}`}>
                    <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm flex-1">{d.label}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f, d.id); e.target.value = ""; }}
                      data-testid={`input-file-${d.id}`}
                    />
                    <span className="text-xs text-primary underline">Choose file</span>
                  </label>
                ))}
              </div>

              {uploads.length > 0 && (
                <div className="rounded border p-3 bg-muted/30" data-testid="uploaded-list">
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Uploaded</h3>
                  <ul className="text-sm space-y-1">
                    {uploads.map((u) => (
                      <li key={u.id} className="flex items-center gap-2" data-testid={`uploaded-item-${u.id}`}>
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span>{u.filename}</span>
                        <Badge variant="outline" className="text-xs">{u.docType}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {uploading && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</p>}

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(2)} data-testid="button-prev-step-2"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button>
                <Button onClick={runAnalysis} disabled={analyzing} data-testid="button-run-analysis">
                  {analyzing ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Analyzing…</> : <><Sparkles className="mr-1 h-4 w-4" /> Run AI analysis</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <div data-testid="card-step-4" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle data-testid="text-result-title">Your personalized plan</CardTitle>
                <CardDescription>
                  Generated{analysis?.aiProvider ? ` with ${analysis.aiProvider}` : ""}.
                  {stateInfo ? <> State: <strong>{stateInfo.name}</strong> · Agency: <strong>{stateInfo.agencyName}</strong>{stateInfo.ilpPhone ? <> · {stateInfo.ilpPhone}</> : null}</> : null}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis?.aiSummary && (
                  <p className="text-sm leading-relaxed" data-testid="text-ai-summary">{analysis.aiSummary}</p>
                )}
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => window.print()} data-testid="button-print-plan"><Save className="mr-1 h-4 w-4" /> Print / save</Button>
                  <Link href={`/foster-youth/benefits`}>
                    <Button variant="outline" size="sm" data-testid="button-open-benefits"><ExternalLink className="mr-1 h-4 w-4" /> Open benefits navigator</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {Array.isArray(analysis?.aiPriorities) && analysis!.aiPriorities.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Top priorities</CardTitle></CardHeader>
                <CardContent>
                  <ol className="space-y-3" data-testid="list-priorities">
                    {(analysis!.aiPriorities as any[]).map((p, i) => (
                      <li key={i} className="rounded border p-3" data-testid={`priority-item-${i}`}>
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="font-semibold">{p.rank ?? i + 1}. {p.title}</div>
                          {p.deadline_days != null && <Badge variant="secondary">{p.deadline_days} days</Badge>}
                        </div>
                        {p.why && <p className="text-sm text-muted-foreground mt-1">{p.why}</p>}
                        {p.owner && <p className="text-xs mt-1">Owner: <strong>{p.owner}</strong></p>}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}

            {Array.isArray(analysis?.aiEligiblePrograms) && analysis!.aiEligiblePrograms.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Programs you likely qualify for</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2" data-testid="list-eligible-programs">
                    {(analysis!.aiEligiblePrograms as any[]).map((p, i) => (
                      <li key={i} className="rounded border p-3" data-testid={`program-item-${i}`}>
                        <div className="font-semibold">{p.name}</div>
                        {p.why && <p className="text-sm text-muted-foreground">{p.why}</p>}
                        {p.next_step && <p className="text-sm mt-1"><strong>Next step:</strong> {p.next_step}</p>}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {(["ai30DayPlan","ai60DayPlan","ai90DayPlan"] as const).map((k, idx) => {
              const arr = analysis?.[k];
              if (!Array.isArray(arr) || arr.length === 0) return null;
              const labels = ["30-day plan","60-day plan","90-day plan"];
              return (
                <Card key={k}>
                  <CardHeader><CardTitle>{labels[idx]}</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 text-sm space-y-1" data-testid={`list-${k}`}>
                      {(arr as any[]).map((it, i) => <li key={i}>{String(it)}</li>)}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}

            {Array.isArray(analysis?.aiWarmHandoffs) && analysis!.aiWarmHandoffs.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Warm-handoff list</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2" data-testid="list-warm-handoffs">
                    {(analysis!.aiWarmHandoffs as any[]).map((h, i) => (
                      <li key={i} className="rounded border p-3" data-testid={`handoff-item-${i}`}>
                        <div className="font-semibold">{h.name}</div>
                        {h.reason && <p className="text-sm text-muted-foreground">{h.reason}</p>}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {h.phone && <a href={`tel:${String(h.phone).replace(/[^0-9]/g, "")}`}><Button size="sm" variant="outline"><Phone className="mr-1 h-3 w-3" /> {h.phone}</Button></a>}
                          {h.url && <a href={h.url} target="_blank" rel="noreferrer"><Button size="sm" variant="outline"><ExternalLink className="mr-1 h-3 w-3" /> Open</Button></a>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(3)} data-testid="button-prev-step-3"><ArrowLeft className="mr-1 h-4 w-4" /> Back to documents</Button>
              <Button variant="outline" onClick={() => { safeRemove(INTAKE_CRED_KEY, "session"); setLocation("/foster-youth"); }} data-testid="button-done">Done</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
