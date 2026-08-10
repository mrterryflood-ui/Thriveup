import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Route, Save, CheckCircle2, Calendar, Home, Heart, Briefcase, GraduationCap, Users, DollarSign } from "lucide-react";
import { CrisisStrip } from "@/components/foster-youth/crisis-strip";
import { getVersioned, setVersioned, safeRemove } from "@/lib/safe-storage";

const TRANSITION_PLAN_KEY = "foster-youth-transition-plan";
const TRANSITION_PLAN_VERSION = 1;

function isStringRecord(v: unknown): v is Record<string, string> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  return Object.values(v).every((x) => typeof x === "string");
}

interface PlanField {
  id: string;
  label: string;
  prompt: string;
  icon: typeof Home;
  domain: string;
}

const FIELDS_BEFORE: PlanField[] = [
  { id: "before-housing", label: "Where will I sleep on day 1?", prompt: "Confirmed address, lease signed, or program enrollment letter. NOT 'I'll figure it out.'", icon: Home, domain: "Housing" },
  { id: "before-medicaid", label: "Medicaid (FFCC) confirmed", prompt: "Application submitted, ID number received. ACA §2004 entitles you to coverage until age 26 with no income test.", icon: Heart, domain: "Healthcare" },
  { id: "before-doctor", label: "Primary care doctor selected", prompt: "Name, address, phone, in-network with my plan. First-appointment date.", icon: Heart, domain: "Healthcare" },
  { id: "before-meds", label: "30-day prescription supply", prompt: "If on any medication, refilled and in hand before exit day.", icon: Heart, domain: "Healthcare" },
  { id: "before-job", label: "Income source secured", prompt: "Job offer letter, school enrollment with stipend, Chafee transition payment, or other documented income.", icon: Briefcase, domain: "Income" },
  { id: "before-bank", label: "Bank account opened", prompt: "Account number, debit card, online login set up. Direct deposit form completed.", icon: DollarSign, domain: "Money" },
  { id: "before-school", label: "Education plan confirmed", prompt: "If continuing school: registered, financial aid finalized, transportation arranged. If not: GED or vocational program selected.", icon: GraduationCap, domain: "Education" },
  { id: "before-docs", label: "All vital documents in hand", prompt: "Birth certificate, SSN card, state ID, immunization record, school transcripts, court records. See the Toolkit.", icon: Calendar, domain: "Documents" },
  { id: "before-adult", label: "One adult I can call at 2am", prompt: "Name and phone number. Saved in my phone. Has agreed in advance.", icon: Users, domain: "Support" },
  { id: "before-crisis", label: "Crisis numbers saved", prompt: "988 (suicide & crisis), 1-800-RUNAWAY, 211 (resources), local crisis-team number, my Chafee worker.", icon: Heart, domain: "Support" },
];

const FIELDS_AFTER: PlanField[] = [
  { id: "after-30day", label: "30-day check-in", prompt: "Am I housed? Eating regularly? Going to work or school? Taking medications? Talking to my one adult?", icon: Calendar, domain: "Wellbeing" },
  { id: "after-60day", label: "60-day check-in", prompt: "Bills paid on time? Bank balance positive? Have I been to the doctor? Am I sleeping enough?", icon: Calendar, domain: "Wellbeing" },
  { id: "after-90day", label: "90-day check-in", prompt: "Is the plan working? What do I need to change? Am I building any savings? Have I made one new connection?", icon: Calendar, domain: "Wellbeing" },
  { id: "after-fafsa", label: "FAFSA filed (independent-student status)", prompt: "Filed as soon as it opens (Oct 1). Foster youth = automatic independent status. Pell + ETV up to $5,000/year.", icon: GraduationCap, domain: "Education" },
  { id: "after-fyi", label: "HUD FYI voucher applied (if eligible)", prompt: "Through your local Public Housing Authority. Up to 36 months of rental assistance. Age 18–24.", icon: Home, domain: "Housing" },
  { id: "after-snap", label: "SNAP enrollment", prompt: "yourtexasbenefits.com (TX) or your state portal. Most former foster youth qualify.", icon: DollarSign, domain: "Income" },
  { id: "after-credit", label: "Credit report rechecked", prompt: "Free at annualcreditreport.com. Foster youth experience identity theft at 3x the rate of peers.", icon: DollarSign, domain: "Money" },
];

export default function FosterYouthTransitionPlanPage() {
  const [values, setValues] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    const stored = getVersioned<Record<string, string>>(
      TRANSITION_PLAN_KEY,
      { version: TRANSITION_PLAN_VERSION },
      isStringRecord,
    );
    return stored ?? {};
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setVersioned<Record<string, string>>(TRANSITION_PLAN_KEY, values, {
      version: TRANSITION_PLAN_VERSION,
      pruneKeys: [TRANSITION_PLAN_KEY],
    });
  }, [values]);

  const setField = (id: string, v: string) => {
    setValues((prev) => ({ ...prev, [id]: v }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const filledBefore = FIELDS_BEFORE.filter((f) => (values[f.id] || "").trim().length > 0).length;
  const filledAfter = FIELDS_AFTER.filter((f) => (values[f.id] || "").trim().length > 0).length;

  const renderField = (f: PlanField) => {
    const Icon = f.icon;
    const isFilled = (values[f.id] || "").trim().length > 0;
    return (
      <Card key={f.id} className={isFilled ? "border-emerald-300 dark:border-emerald-800" : ""} data-testid={`card-field-${f.id}`}>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg p-2 bg-primary/10 shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base" data-testid={`text-field-label-${f.id}`}>{f.label}</CardTitle>
                <Badge variant="outline" className="text-xs" data-testid={`badge-field-domain-${f.id}`}>{f.domain}</Badge>
                {isFilled && <CheckCircle2 className="h-4 w-4 text-emerald-600" data-testid={`icon-field-done-${f.id}`} />}
              </div>
              <CardDescription className="text-xs mt-1" data-testid={`text-field-prompt-${f.id}`}>{f.prompt}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={values[f.id] || ""}
            onChange={(e) => setField(f.id, e.target.value)}
            placeholder="Type your answer here. Specifics, not 'figure it out later'."
            rows={2}
            data-testid={`textarea-field-${f.id}`}
          />
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-foster-youth-transition-plan">
      <CrisisStrip />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link href="/foster-youth">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-hub">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Foster Youth Hub
          </Button>
        </Link>

        <div className="flex items-start gap-4 mb-6 flex-wrap">
          <div className="rounded-xl p-3 bg-gradient-to-br from-violet-500 to-purple-600 shrink-0 shadow-md">
            <Route className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-[280px]">
            <Badge variant="secondary" className="mb-2" data-testid="badge-tool">Tool 2 of 6</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight" data-testid="text-tp-title">Transition Plan</h1>
            <p className="text-muted-foreground italic" data-testid="text-tp-title-es">Plan de Transición</p>
          </div>
        </div>

        <Alert className="mb-6" data-testid="alert-bring-to-court">
          <Calendar className="h-4 w-4" />
          <AlertTitle>Bring this to your transition court hearing</AlertTitle>
          <AlertDescription>
            Federal law (Fostering Connections Act §475(5)(H)) requires your case plan within 90 days of exit to include a personalized transition plan addressing housing, health insurance, education, opportunities for mentors, workforce, and continuing support. <strong>This is yours. Print it. Bring it. Make them respond to it.</strong>
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="before" data-testid="tabs-plan">
          <TabsList className="grid w-full grid-cols-2" data-testid="tabs-plan-list">
            <TabsTrigger value="before" data-testid="tab-before">Before exit ({filledBefore}/{FIELDS_BEFORE.length})</TabsTrigger>
            <TabsTrigger value="after" data-testid="tab-after">After exit ({filledAfter}/{FIELDS_AFTER.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="before" className="space-y-4 mt-4" data-testid="tabcontent-before">
            <p className="text-sm text-muted-foreground" data-testid="text-before-intro">The 90 days before your exit date. Each line is a question your future self will wish you had answered.</p>
            {FIELDS_BEFORE.map(renderField)}
          </TabsContent>

          <TabsContent value="after" className="space-y-4 mt-4" data-testid="tabcontent-after">
            <p className="text-sm text-muted-foreground" data-testid="text-after-intro">The 90 days after exit. Check in with yourself. Adjust the plan. The plan is not the test — the check-in is.</p>
            {FIELDS_AFTER.map(renderField)}
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex gap-3 flex-wrap" data-testid="section-actions">
          <Button onClick={handleSave} data-testid="button-save">
            <Save className="mr-2 h-4 w-4" /> {saved ? "Saved!" : "Save my plan"}
          </Button>
          <Button variant="outline" onClick={() => window.print()} data-testid="button-print">Print for court hearing</Button>
          <Button
            variant="outline"
            onClick={() => {
              if (typeof window !== "undefined" && window.confirm("Clear all your saved answers on this device? This cannot be undone.")) {
                setValues({});
                safeRemove(TRANSITION_PLAN_KEY);
                setSaved(false);
              }
            }}
            data-testid="button-clear-plan"
          >
            Clear my plan
          </Button>
          <Link href="/foster-youth/wellbeing">
            <Button variant="outline" data-testid="button-go-wellbeing">Wellbeing check-in →</Button>
          </Link>
        </div>

        <Alert className="mt-6" data-testid="alert-saves-locally">
          <Save className="h-4 w-4" />
          <AlertTitle>Saved on your device</AlertTitle>
          <AlertDescription>Your answers save in your browser. No account, no sign-in.</AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
