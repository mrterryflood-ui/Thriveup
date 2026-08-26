import { useEffect, useState, type FormEvent } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Flag,
  HeartPulse,
  Map,
  Printer,
  ShieldCheck,
  Target,
  Users,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/hooks/use-auth";

const CORRECTIONS_KEY = "austin-community-bridge-review-notes";

const DELIVERABLES = [
  {
    id: "baseline",
    label: "Baseline & geography packet",
    output: "One approved Austin decision unit, source register, vintage/grain table, and valid crosswalk.",
    status: "Blocked until geography, source ownership, and authorization are confirmed.",
    icon: Map,
    tone: "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30",
  },
  {
    id: "evidence",
    label: "Evidence-to-implementation packet",
    output: "RPLICE evidence map, CFIR readiness worksheet, fidelity/adaptation log, and stop/adjust/scale rules.",
    status: "Candidate bundle is locally hypothesized; it is not yet an EBI claim.",
    icon: ClipboardCheck,
    tone: "border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/30",
  },
  {
    id: "action",
    label: "Action & learning board",
    output: "A visible chain from condition → evidence → intervention → action → implementation → outcome → learning.",
    status: "Design is ready for review; no Austin action owner or completed action has been authorized.",
    icon: Target,
    tone: "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30",
  },
  {
    id: "governance",
    label: "Governance & correction record",
    output: "Consent, youth safety, data ownership, claims release, challenge, and correction decisions.",
    status: "Required before public classification, recruitment, referral operations, or partner representation.",
    icon: ShieldCheck,
    tone: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30",
  },
] as const;

const MEASURES = [
  ["Reach", "Participation by role and geography with consent and suppression protections.", "Not representative unless a denominator and method are approved."],
  ["Adoption", "Authorized partner action owners and the actions they accept.", "A meeting or invitation is not adoption."],
  ["Implementation", "Core components completed and local adaptations recorded.", "Completion requires an accountable human record."],
  ["Feasibility", "Whether staffing, data, coordination, and referral paths operated as designed.", "Failures and unavailable steps remain visible."],
  ["Acceptability", "Youth, resident, and partner feedback on safety, clarity, usefulness, and burden.", "Participation is voluntary and consent-appropriate."],
  ["Maintenance readiness", "Named owner, data process, and review cadence after the pilot.", "Intent alone is not sustainability."],
] as const;

type Correction = {
  id: string;
  section: string;
  note: string;
  createdAt: string;
};

function loadCorrections(storageKey: string): Correction[] {
  const stored = window.localStorage.getItem(storageKey);
  const parsed: unknown = stored ? JSON.parse(stored) : [];
  if (!Array.isArray(parsed)) throw new Error("Austin review notes are not a valid list");
  const valid = parsed.filter((item): item is Correction => (
    Boolean(item) &&
    typeof item === "object" &&
    typeof (item as Correction).id === "string" &&
    typeof (item as Correction).section === "string" &&
    typeof (item as Correction).note === "string" &&
    typeof (item as Correction).createdAt === "string"
  ));
  if (valid.length !== parsed.length) throw new Error("Austin review notes contain an invalid entry");
  return valid;
}

export default function AustinCommunityBridgeDeliverablePage() {
  const { user } = useAuth();
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [section, setSection] = useState("Baseline & geography packet");
  const [note, setNote] = useState("");
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const storageKey = user?.id ? `${CORRECTIONS_KEY}:${user.id}` : null;

  useEffect(() => {
    document.title = "Austin Community Bridge | Private Deliverable";
  }, []);

  useEffect(() => {
    if (!storageKey) return;
    try {
      setCorrections(loadCorrections(storageKey));
      setStorageAvailable(true);
      setStorageError(null);
    } catch {
      setCorrections([]);
      setStorageAvailable(false);
      setStorageError("Browser storage is unavailable. Notes will remain visible only until this page is closed.");
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      try {
        setCorrections(loadCorrections(storageKey));
        setStorageAvailable(true);
        setStorageError(null);
      } catch {
        setStorageAvailable(false);
        setStorageError("A saved note changed in another tab but could not be read. Review storage permissions before continuing.");
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [storageKey]);

  function submitCorrection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = note.trim();
    if (!trimmed || !storageKey) return;
    try {
      const latest = loadCorrections(storageKey);
      const next: Correction = {
        id: `${Date.now()}-${latest.length}`,
        section,
        note: trimmed,
        createdAt: new Date().toLocaleString(),
      };
      const updated = [next, ...latest].slice(0, 25);
      window.localStorage.setItem(storageKey, JSON.stringify(updated));
      setCorrections(updated);
      setNote("");
      setStorageAvailable(true);
      setStorageError(null);
    } catch {
      setStorageAvailable(false);
      setStorageError("This browser could not save the note. Check storage permissions before relying on it.");
    }
  }

  function clearCorrections() {
    try {
      if (storageKey) window.localStorage.removeItem(storageKey);
      setCorrections([]);
      setStorageAvailable(true);
      setStorageError(null);
    } catch {
      setStorageAvailable(false);
      setStorageError("This browser could not clear the notes. They may remain until storage is available.");
    }
  }

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8" data-testid="austin-community-bridge-deliverable">
      <PageHeader
        title="Austin Community Bridge"
        description="Private implementation-science deliverable preview: from place-level evidence to accountable action and learning."
        actions={
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={() => window.print()} data-testid="button-print-austin-deliverable">
              <Printer className="h-4 w-4 mr-2" /> Print / PDF preview
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/community-map" data-testid="button-community-map">
                <Map className="h-4 w-4 mr-2" /> Open live mapping
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild data-testid="button-east-austin-readiness">
              <Link href="/austin-community-bridge/readiness">
                <ShieldCheck className="h-4 w-4 mr-2" /> Approval readiness
              </Link>
            </Button>
          </div>
        }
      />

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 text-white" data-testid="austin-deliverable-hero">
        <CardContent className="p-6 sm:p-9">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className="bg-white/15 text-white border-white/25">Private planning artifact</Badge>
            <Badge className="bg-amber-300/20 text-amber-100 border-amber-200/30">Austin</Badge>
            <Badge className="bg-rose-300/20 text-rose-100 border-rose-200/30">No public classification</Badge>
          </div>
          <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-8 items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-cyan-200 mb-3">The deliverable is the decision path</p>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
                Map the condition. Tell the story. Test the action.
              </h1>
              <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-3xl">
                This workspace turns the Austin blueprint into a reviewable output: place-level health, housing, opportunity, and cultural-continuity context; implementation-science fit; measurable learning; and a correction route before anything is released.
              </p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 p-5" data-testid="austin-honest-status">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-300 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Current evidence state</p>
                  <p className="text-sm text-slate-300 mt-1">
                    No Austin baseline has been approved, no Priority Opportunity Area has been selected, and no population outcome is reported here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section aria-labelledby="story-loop-heading" data-testid="section-austin-story-loop">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Chainweb + implementation science</p>
            <h2 id="story-loop-heading" className="text-2xl font-bold mt-1">A data story that ends in learning</h2>
          </div>
          <Link href="/community-impact" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            See the live community brief <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            ["Condition", HeartPulse],
            ["Evidence", FileText],
            ["Intervention", Target],
            ["Action", ArrowRight],
            ["Implementation", ClipboardCheck],
            ["Outcome", BarChart3],
            ["Learning", Flag],
          ].map(([label, Icon], index) => {
            const StepIcon = Icon as typeof HeartPulse;
            return (
              <div key={label as string} className="relative rounded-xl border bg-card p-3 min-h-[96px] flex flex-col justify-between" data-testid={`austin-story-step-${String(label).toLowerCase()}`}>
                <StepIcon className={`h-5 w-5 ${index === 0 ? "text-rose-500" : index === 5 ? "text-emerald-500" : "text-primary"}`} />
                <span className="text-sm font-semibold">{label as string}</span>
                {index < 6 && <span className="hidden lg:block absolute -right-3 top-10 text-muted-foreground z-10">→</span>}
              </div>
            );
          })}
        </div>
      </section>

      <Card data-testid="section-austin-implementation-decision">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-violet-600" /> How the method changes the next decision</CardTitle>
          <p className="text-sm text-muted-foreground">A worked example keeps implementation science operational instead of decorative.</p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-2 text-sm">
            {[
              ["Condition", "A valid place-level source shows a housing or health access signal.", "Source owner + geography must be recorded."],
              ["Evidence", "The source register and community validation explain what the signal does and does not mean.", "No individual risk label; no response gap from an overlay alone."],
              ["Decision", "An authorized governance group chooses whether to proceed, adapt, hold, or stop.", "Human decision record is required."],
              ["Owner / next action", "A named action owner accepts one feasible step and review date.", "A meeting is not adoption; completion needs verification."],
              ["Learning rule", "RE-AIM measures and corrections determine the next cycle.", "Unknown capacity, unsafe participation, or broken fidelity means hold or adjust."],
            ].map(([stage, detail, boundary]) => (
              <div key={stage} className="rounded-lg border p-3" data-testid={`austin-decision-${stage.toLowerCase().replace(/\s+\/\s+|\s+/g, "-")}`}>
                <p className="font-semibold">{stage}</p>
                <p className="mt-2">{detail}</p>
                <p className="mt-2 text-xs text-muted-foreground">{boundary}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <section aria-labelledby="outputs-heading" data-testid="section-austin-outputs">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">What you can preview now</p>
          <h2 id="outputs-heading" className="text-2xl font-bold mt-1">Four outputs, each with a release condition</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {DELIVERABLES.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.id} className={item.tone} data-testid={`austin-output-${item.id}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="h-5 w-5 text-primary" /> {item.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm font-medium">{item.output}</p>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <XCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <span>{item.status}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Card data-testid="section-austin-measures">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-emerald-600" /> Measures before outcomes</CardTitle>
          <p className="text-sm text-muted-foreground">
            These RE-AIM and implementation measures are ready to review. They are not observed Austin results.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MEASURES.map(([name, measure, limit]) => (
              <div key={name} className="rounded-lg border p-4" data-testid={`austin-measure-${name.toLowerCase().replace(/\s+/g, "-")}`}>
                <p className="font-semibold">{name}</p>
                <p className="text-sm mt-2">{measure}</p>
                <p className="text-xs text-muted-foreground mt-3 border-t pt-3"><strong>Boundary:</strong> {limit}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-dashed p-4 flex items-start gap-3" data-testid="austin-outcomes-honest-state">
            <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Observed outcomes: not yet reported</p>
              <p className="text-sm text-muted-foreground mt-1">
                A baseline, authorized action, and human-verified follow-up are prerequisites. This preview intentionally shows the measurement design instead of inventing a result.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="print:hidden" data-testid="section-austin-corrections">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Review and correct the preview</CardTitle>
          <p className="text-sm text-muted-foreground">
            Add a correction, missing source, boundary concern, or implementation question. Notes are stored only in this browser for this staff account; they are not a partner or public record.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={submitCorrection} className="grid md:grid-cols-[260px_1fr_auto] gap-3 items-end" data-testid="form-austin-correction">
            <label className="text-sm font-medium">
              Section
              <select value={section} onChange={(event) => setSection(event.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" data-testid="select-austin-correction-section">
                {DELIVERABLES.map((item) => <option key={item.id}>{item.label}</option>)}
                <option>Measures and outcomes</option>
                <option>Claims, consent, or safeguarding</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Correction or question
              <textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 min-h-10 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Example: This source is county-level and cannot be shown as a ZIP estimate." data-testid="textarea-austin-correction" />
            </label>
            <Button type="submit" disabled={!note.trim()} data-testid="button-save-austin-correction">Save note</Button>
          </form>
          {!storageAvailable && (
            <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100" role="alert" data-testid="austin-storage-error">
              {storageError}
            </p>
          )}
          {corrections.length > 0 ? (
            <div className="space-y-2" data-testid="austin-correction-list">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Draft notes ({corrections.length})</p>
                <Button type="button" variant="ghost" size="sm" onClick={clearCorrections} data-testid="button-clear-austin-corrections">Clear browser notes</Button>
              </div>
              {corrections.map((item) => (
                <div key={item.id} className="rounded-md border bg-muted/30 p-3 text-sm">
                  <div className="flex justify-between gap-3 text-xs text-muted-foreground"><span>{item.section}</span><span>{item.createdAt}</span></div>
                  <p className="mt-1">{item.note}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground" data-testid="austin-correction-empty">No draft corrections yet. Add one above before review.</p>
          )}
        </CardContent>
      </Card>

      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20 p-5 text-sm" data-testid="austin-deliverable-limits">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Release boundary</p>
            <p className="text-muted-foreground mt-1">
              This is a private planning and review surface. It does not claim partner approval, City authority, HBCU endorsement, an Austin deployment, an EBI label, a selected priority area, or a population outcome.
            </p>
            <Link href="/our-approach" className="inline-flex items-center gap-1 mt-3 font-semibold text-primary hover:underline">
              Read the platform safeguards <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}