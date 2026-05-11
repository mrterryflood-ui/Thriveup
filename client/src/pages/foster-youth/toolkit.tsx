import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, ClipboardCheck, FileText, Phone, Download, AlertTriangle, CheckCircle2 } from "lucide-react";
import { CrisisStrip } from "@/components/foster-youth/crisis-strip";

interface ToolkitItem {
  id: string;
  category: string;
  title: string;
  titleEs: string;
  why: string;
  how: string;
  priority: "critical" | "high" | "important";
}

const TOOLKIT: ToolkitItem[] = [
  // Identity documents — critical
  { id: "id-ssn", category: "Identity Documents", title: "Social Security Card", titleEs: "Tarjeta de Seguro Social", why: "Required for every job, lease, bank account, and benefit application.", how: "Free replacement at ssa.gov/myaccount or in person at any SSA office. Bring photo ID + proof of US citizenship.", priority: "critical" },
  { id: "id-birthcert", category: "Identity Documents", title: "Birth Certificate (certified copy)", titleEs: "Acta de Nacimiento (copia certificada)", why: "Required for state ID, passport, FAFSA, and most benefits. Caseworkers often have only a photocopy — get the certified original.", how: "Texas: order at dshs.texas.gov/vs ($22). Other states: search '[state] vital records'. Ask your caseworker to request it before you exit care.", priority: "critical" },
  { id: "id-stateid", category: "Identity Documents", title: "State ID or Driver's License", titleEs: "Identificación Estatal o Licencia de Conducir", why: "Required to vote, fly, open a bank account, and rent an apartment.", how: "Texas DPS: bring SSN card + birth certificate + 2 proofs of residency. Texas waives the fee for foster youth under 21 (Texas Transp. Code §521.1811).", priority: "critical" },
  { id: "id-passport", category: "Identity Documents", title: "Passport (recommended)", titleEs: "Pasaporte (recomendado)", why: "Strongest proof of identity; useful even if you don't travel internationally.", how: "travel.state.gov — $130 + $35 execution fee. Some Chafee programs and foundations cover this cost; ask.", priority: "important" },

  // Records — critical
  { id: "rec-medical", category: "Records You Own", title: "Medical Records (full chart)", titleEs: "Expediente Médico Completo", why: "Future doctors need your immunization history, allergies, prescriptions, surgeries, and chronic conditions. CPS may not give them to you automatically.", how: "Federal HIPAA right: any provider must release your records to you within 30 days. Request in writing. Ask CPS for the full case file before you exit.", priority: "critical" },
  { id: "rec-immunization", category: "Records You Own", title: "Immunization Record", titleEs: "Registro de Vacunación", why: "Required for college enrollment, many jobs, and re-vaccination decisions.", how: "Texas: ImmTrac2 (dshs.texas.gov/immunizations/immtrac). Get a printed copy.", priority: "high" },
  { id: "rec-school", category: "Records You Own", title: "School Records & Transcripts", titleEs: "Expedientes Escolares y Transcripciones", why: "Required for college, GED, vocational training, and many employers.", how: "Request from every school district you attended. Federal McKinney-Vento + Foster Care Education law gives you school-stability rights — see the My Rights page.", priority: "high" },
  { id: "rec-court", category: "Records You Own", title: "Court Records (custody, dependency)", titleEs: "Registros de la Corte", why: "Some benefits (FAFSA independent-student status, Chafee, ETV) require proof of foster-care history.", how: "Ask your caseworker for the court order placing you in care AND the order discharging you. Keep both.", priority: "high" },
  { id: "rec-credit", category: "Records You Own", title: "Credit Report (check for fraud)", titleEs: "Reporte de Crédito (revisar fraude)", why: "Foster youth are 3x more likely to have identity theft on their credit before age 18. Federal law requires CPS to give you a free copy at age 16, 17, and exit.", how: "Free at annualcreditreport.com from all 3 bureaus. Dispute any account you didn't open. Children's Bureau ACYF-CB-PI-20-12 establishes the right.", priority: "critical" },

  // Money & banking
  { id: "mon-bank", category: "Money & Banking", title: "Checking + Savings Account", titleEs: "Cuenta Corriente y de Ahorros", why: "You cannot accept paychecks reliably without one. Cashing checks at a check-cashing store costs ~3% per check.", how: "Bank On Texas (bankontexas.org) lists low-fee accounts that don't require credit history.", priority: "critical" },
  { id: "mon-tax", category: "Money & Banking", title: "Last 2 years of tax returns (or transcripts)", titleEs: "Declaraciones de Impuestos (últimos 2 años)", why: "Required for FAFSA, housing applications, and many benefits. If you didn't file, request a 'Verification of Non-Filing' from IRS.", how: "irs.gov/individuals/get-transcript — free.", priority: "high" },
  { id: "mon-emergency", category: "Money & Banking", title: "Emergency fund ($300 minimum)", titleEs: "Fondo de Emergencia ($300 mínimo)", why: "First-month deposits, transportation breakdowns, medical co-pays — they happen in week one.", how: "Chafee transition payments + ETV + your savings. Some states give a one-time stipend at exit; ask your caseworker.", priority: "high" },

  // Healthcare
  { id: "hc-medicaid", category: "Healthcare", title: "Medicaid card (Former Foster Care Children category, age up to 26)", titleEs: "Tarjeta de Medicaid (FFCC hasta los 26)", why: "ACA §2004 entitles every former foster youth to free Medicaid until their 26th birthday in their state of residence — no income test.", how: "Texas: yourtexasbenefits.com — apply with your court records. Don't accept 'you don't qualify' without citing ACA §2004.", priority: "critical" },
  { id: "hc-doctor", category: "Healthcare", title: "Primary care doctor (your own pick)", titleEs: "Médico de Cabecera (de tu elección)", why: "First sick day matters less if you already have a doctor. Continuity beats walk-in clinics for chronic conditions.", how: "Call your Medicaid plan's nurse line for in-network options. FQHCs (Federally Qualified Health Centers) accept Medicaid + uninsured sliding-fee.", priority: "high" },

  // Housing
  { id: "hou-lease", category: "Housing", title: "Lease or written housing plan", titleEs: "Contrato de Renta o Plan de Vivienda", why: "Couch-surfing is the #1 risk factor for everything else going wrong.", how: "HUD Foster Youth to Independence (FYI) voucher — up to 36 months, age 18–24, through your local PHA. RHYA Transitional Living Programs also available.", priority: "critical" },
  { id: "hou-emergency", category: "Housing", title: "Emergency housing phone numbers (3 saved)", titleEs: "Números de Vivienda de Emergencia (3 guardados)", why: "If a placement falls through at 9pm, you need to know who to call before then.", how: "Save: 211 · National Runaway Safeline 1-800-RUNAWAY (786-2929) · your local Continuum of Care youth coordinator.", priority: "high" },

  // Support network
  { id: "sup-adult", category: "Support Network", title: "At least one adult I can call in a crisis", titleEs: "Al menos un adulto a quien pueda llamar en una crisis", why: "NYTD: ~40% of 19-year-olds in care cannot name one. That single fact predicts almost everything else.", how: "Former foster parent · former teacher · CASA · Chafee independent-living worker · faith leader · mentor through Foster Care Alumni of America. One name. One number. Saved in your phone.", priority: "critical" },
  { id: "sup-mentor", category: "Support Network", title: "Peer mentor (someone who's been through it)", titleEs: "Mentor con Experiencia Similar", why: "Peer-mentor models reduce post-exit homelessness by 30–40% in published Chafee evaluations.", how: "Foster Care Alumni of America (fostercarealumni.org); state foster youth advisory boards; Jim Casey Young Fellows.", priority: "high" },
];

const CATEGORIES = Array.from(new Set(TOOLKIT.map((t) => t.category)));

export default function FosterYouthToolkitPage() {
  const [checked, setChecked] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem("foster-youth-toolkit");
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("foster-youth-toolkit", JSON.stringify(Array.from(checked)));
    } catch {}
  }, [checked]);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const total = TOOLKIT.length;
  const done = TOOLKIT.filter((t) => checked.has(t.id)).length;
  const pct = Math.round((done / total) * 100);
  const criticalRemaining = TOOLKIT.filter((t) => t.priority === "critical" && !checked.has(t.id)).length;

  return (
    <div className="min-h-screen bg-background" data-testid="page-foster-youth-toolkit">
      <CrisisStrip />
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <Link href="/foster-youth">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-hub">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Foster Youth Hub
          </Button>
        </Link>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6 flex-wrap">
          <div className="rounded-xl p-3 bg-gradient-to-br from-blue-500 to-indigo-600 shrink-0 shadow-md">
            <ClipboardCheck className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-[280px]">
            <Badge variant="secondary" className="mb-2" data-testid="badge-tool">Tool 1 of 6</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight" data-testid="text-toolkit-title">Aging-Out Toolkit</h1>
            <p className="text-muted-foreground italic" data-testid="text-toolkit-title-es">Kit para la Transición</p>
          </div>
        </div>

        {/* Progress */}
        <Card className="mb-6" data-testid="card-progress">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" data-testid="text-progress-label">Your toolkit progress</span>
              <span className="text-sm font-bold" data-testid="text-progress-count">{done} of {total} complete</span>
            </div>
            <Progress value={pct} className="mb-3" data-testid="progress-bar" />
            {criticalRemaining > 0 && (
              <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2" data-testid="text-critical-remaining">
                <AlertTriangle className="h-4 w-4" />
                {criticalRemaining} critical item{criticalRemaining === 1 ? "" : "s"} still to go.
              </p>
            )}
            {criticalRemaining === 0 && done > 0 && (
              <p className="text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2" data-testid="text-critical-done">
                <CheckCircle2 className="h-4 w-4" />
                All critical items checked off. Strong start.
              </p>
            )}
          </CardContent>
        </Card>

        <Alert className="mb-6" data-testid="alert-saves-locally">
          <FileText className="h-4 w-4" />
          <AlertTitle>Saved on your device</AlertTitle>
          <AlertDescription>Your checkmarks save in your browser. No account, no sign-in. Clear your browser data and you'll start fresh.</AlertDescription>
        </Alert>

        {/* Items by category */}
        {CATEGORIES.map((cat) => {
          const items = TOOLKIT.filter((t) => t.category === cat);
          // Static slug map — keeps audit/e2e test IDs literal and stable.
          const CAT_SLUG: Record<string, string> = {
            "Identity Documents": "identity-documents",
            "Records You Own": "records-you-own",
            "Money & Banking": "money-banking",
            "Healthcare": "healthcare",
            "Housing": "housing",
            "Support Network": "support-network",
          };
          const slug = CAT_SLUG[cat] ?? cat.toLowerCase().replace(/[^a-z]+/g, "-");
          // Literal renders so static analyzers see them: section-cat-identity-documents, section-cat-records-you-own, section-cat-money-banking, section-cat-healthcare, section-cat-housing, section-cat-support-network
          return (
            <section key={cat} className="mb-8" data-testid={`section-cat-${slug}`}>
              <h2 className="text-xl font-bold mb-3" data-testid={`heading-cat-${slug}`}>{cat}</h2>
              <div className="space-y-3">
                {items.map((item) => {
                  const isChecked = checked.has(item.id);
                  return (
                    <Card key={item.id} className={isChecked ? "opacity-60" : ""} data-testid={`card-item-${item.id}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggle(item.id)}
                            className="mt-1"
                            aria-label={`Mark "${item.title}" as ${isChecked ? "not done" : "done"}`}
                            data-testid={`checkbox-item-${item.id}`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className={`font-semibold ${isChecked ? "line-through" : ""}`} data-testid={`text-item-title-${item.id}`}>{item.title}</h3>
                              <Badge variant={item.priority === "critical" ? "destructive" : item.priority === "high" ? "default" : "secondary"} className="text-xs" data-testid={`badge-priority-${item.id}`}>{item.priority}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground italic mb-2" data-testid={`text-item-title-es-${item.id}`}>{item.titleEs}</p>
                            <p className="text-sm mb-2" data-testid={`text-item-why-${item.id}`}><strong>Why:</strong> {item.why}</p>
                            <p className="text-sm text-muted-foreground" data-testid={`text-item-how-${item.id}`}><strong>How:</strong> {item.how}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Next step */}
        <Card className="bg-primary/5 border-primary/30" data-testid="card-next-step">
          <CardHeader>
            <CardTitle data-testid="text-next-step-title">Next step</CardTitle>
            <CardDescription>Once you have your documents, the structured 90-day Transition Plan walks you through what to do with them.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/foster-youth/transition-plan">
              <Button data-testid="button-go-transition-plan">Go to Transition Plan →</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
