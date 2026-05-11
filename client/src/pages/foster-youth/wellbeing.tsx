import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Heart, Phone, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";

interface ScreenItem {
  id: string;
  instrument: string;
  text: string;
  textEs: string;
  scale: { value: number; label: string }[];
}

const PHQ2_OPTIONS = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half the days" },
  { value: 3, label: "Nearly every day" },
];

const ITEMS: ScreenItem[] = [
  { id: "phq1", instrument: "PHQ-2", text: "Over the last 2 weeks: Little interest or pleasure in doing things.", textEs: "En las últimas 2 semanas: Poco interés o placer en hacer cosas.", scale: PHQ2_OPTIONS },
  { id: "phq2", instrument: "PHQ-2", text: "Over the last 2 weeks: Feeling down, depressed, or hopeless.", textEs: "En las últimas 2 semanas: Sentirse deprimido, decaído o sin esperanza.", scale: PHQ2_OPTIONS },
  { id: "gad1", instrument: "GAD-2", text: "Over the last 2 weeks: Feeling nervous, anxious, or on edge.", textEs: "En las últimas 2 semanas: Sentirse nervioso, ansioso o al límite.", scale: PHQ2_OPTIONS },
  { id: "gad2", instrument: "GAD-2", text: "Over the last 2 weeks: Not being able to stop or control worrying.", textEs: "En las últimas 2 semanas: No poder dejar de preocuparse o controlar la preocupación.", scale: PHQ2_OPTIONS },
];

const HOUSING_OPTIONS = [
  { value: "stable", label: "I have a place I can stay tonight and for the next month" },
  { value: "shortterm", label: "I have somewhere to stay tonight, but not sure beyond that" },
  { value: "couch", label: "I'm couch-surfing or staying with people night by night" },
  { value: "unsheltered", label: "I don't know where I'm sleeping tonight" },
];

const FOOD_OPTIONS = [
  { value: "secure", label: "I have enough food and money for food this week" },
  { value: "low", label: "I'm running low on food or money for food" },
  { value: "skipping", label: "I'm skipping meals because I don't have enough" },
  { value: "none", label: "I have no food right now" },
];

export default function FosterYouthWellbeingPage() {
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [housing, setHousing] = useState<string>("");
  const [food, setFood] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  const setItem = (id: string, v: number) => setResponses((p) => ({ ...p, [id]: v }));

  const phqScore = (responses.phq1 ?? 0) + (responses.phq2 ?? 0);
  const gadScore = (responses.gad1 ?? 0) + (responses.gad2 ?? 0);
  const phqFlag = phqScore >= 3;
  const gadFlag = gadScore >= 3;
  const housingFlag = housing === "couch" || housing === "unsheltered";
  const foodFlag = food === "skipping" || food === "none";
  const anyRedFlag = phqFlag || gadFlag || housingFlag || foodFlag;

  const allAnswered = ITEMS.every((i) => responses[i.id] !== undefined) && housing && food;

  return (
    <div className="min-h-screen bg-background" data-testid="page-foster-youth-wellbeing">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Link href="/foster-youth">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-hub">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Foster Youth Hub
          </Button>
        </Link>

        <div className="flex items-start gap-4 mb-6 flex-wrap">
          <div className="rounded-xl p-3 bg-gradient-to-br from-rose-500 to-pink-600 shrink-0 shadow-md">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-[280px]">
            <Badge variant="secondary" className="mb-2" data-testid="badge-tool">Tool 3 of 6</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight" data-testid="text-wb-title">Wellbeing Check-in</h1>
            <p className="text-muted-foreground italic" data-testid="text-wb-title-es">Revisión de Bienestar</p>
          </div>
        </div>

        {/* Always-on crisis banner */}
        <Alert className="mb-6 border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30" data-testid="alert-crisis-banner">
          <AlertTriangle className="h-4 w-4 text-rose-600" />
          <AlertTitle>If you're thinking about hurting yourself, call 988 right now.</AlertTitle>
          <AlertDescription className="mt-2 flex flex-wrap gap-3">
            <a href="tel:988" className="underline font-semibold" data-testid="link-crisis-988">988 — Suicide & Crisis Lifeline</a>
            <a href="sms:741741?body=HOME" className="underline font-semibold" data-testid="link-crisis-text">Text HOME to 741741</a>
            <a href="tel:18007865437" className="underline font-semibold" data-testid="link-crisis-runaway">1-800-RUNAWAY</a>
          </AlertDescription>
        </Alert>

        <Card className="mb-6" data-testid="card-instrument-info">
          <CardHeader>
            <CardTitle className="text-base" data-testid="text-instruments-title">What this is</CardTitle>
            <CardDescription data-testid="text-instruments-desc">
              Two short, validated screeners used by primary-care doctors worldwide: <strong>PHQ-2</strong> (depression) and <strong>GAD-2</strong> (anxiety). Plus two questions about housing and food. <strong>This is not a diagnosis.</strong> If anything is high, the next page connects you with someone who can help.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* PHQ-2 + GAD-2 */}
        <section className="space-y-4 mb-6" data-testid="section-screen-mental-health">
          {ITEMS.map((item) => (
            <Card key={item.id} data-testid={`card-item-${item.id}`}>
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs" data-testid={`badge-instrument-${item.id}`}>{item.instrument}</Badge>
                </div>
                <CardTitle className="text-base" data-testid={`text-question-${item.id}`}>{item.text}</CardTitle>
                <CardDescription className="italic text-xs" data-testid={`text-question-es-${item.id}`}>{item.textEs}</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={responses[item.id]?.toString() ?? ""}
                  onValueChange={(v) => setItem(item.id, parseInt(v, 10))}
                  data-testid={`radiogroup-${item.id}`}
                >
                  {item.scale.map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value.toString()} id={`${item.id}-${opt.value}`} data-testid={`radio-${item.id}-${opt.value}`} />
                      <Label htmlFor={`${item.id}-${opt.value}`} className="cursor-pointer text-sm">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Housing */}
        <Card className="mb-4" data-testid="card-housing">
          <CardHeader>
            <CardTitle className="text-base" data-testid="text-housing-question">Housing right now</CardTitle>
            <CardDescription className="italic text-xs" data-testid="text-housing-question-es">Vivienda en este momento</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={housing} onValueChange={setHousing} data-testid="radiogroup-housing">
              {HOUSING_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={`housing-${opt.value}`} data-testid={`radio-housing-${opt.value}`} />
                  <Label htmlFor={`housing-${opt.value}`} className="cursor-pointer text-sm">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Food */}
        <Card className="mb-6" data-testid="card-food">
          <CardHeader>
            <CardTitle className="text-base" data-testid="text-food-question">Food right now</CardTitle>
            <CardDescription className="italic text-xs" data-testid="text-food-question-es">Comida en este momento</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={food} onValueChange={setFood} data-testid="radiogroup-food">
              {FOOD_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={`food-${opt.value}`} data-testid={`radio-food-${opt.value}`} />
                  <Label htmlFor={`food-${opt.value}`} className="cursor-pointer text-sm">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Button onClick={() => setSubmitted(true)} disabled={!allAnswered} className="w-full mb-6" size="lg" data-testid="button-see-results">
          See my results
        </Button>

        {submitted && (
          <Card className={anyRedFlag ? "border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20" : "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20"} data-testid="card-results">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" data-testid="text-results-title">
                {anyRedFlag ? <AlertTriangle className="h-5 w-5 text-rose-600" /> : <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                Your results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-1" data-testid="text-results-scores">
                <p>PHQ-2 (depression screen): <strong>{phqScore} of 6</strong> {phqFlag && <Badge variant="destructive" className="ml-2">positive screen</Badge>}</p>
                <p>GAD-2 (anxiety screen): <strong>{gadScore} of 6</strong> {gadFlag && <Badge variant="destructive" className="ml-2">positive screen</Badge>}</p>
                <p>Housing: <strong>{HOUSING_OPTIONS.find((o) => o.value === housing)?.label}</strong> {housingFlag && <Badge variant="destructive" className="ml-2">unstable</Badge>}</p>
                <p>Food: <strong>{FOOD_OPTIONS.find((o) => o.value === food)?.label}</strong> {foodFlag && <Badge variant="destructive" className="ml-2">food insecure</Badge>}</p>
              </div>

              {anyRedFlag && (
                <div className="space-y-3 pt-2 border-t border-rose-200 dark:border-rose-900" data-testid="section-warm-handoff">
                  <p className="font-semibold" data-testid="text-handoff-title">Warm handoff — three things you can do in the next hour:</p>
                  <ol className="list-decimal pl-5 space-y-2 text-sm">
                    {(phqFlag || gadFlag) && (
                      <li data-testid="action-mh">
                        <strong>Mental health:</strong> Call <a href="tel:988" className="underline">988</a> to talk now, or visit{" "}
                        <a href="https://mentalwellnesssupport.net" target="_blank" rel="noreferrer" className="underline">Whole-Person Mental Health Support</a> for free, evidence-based screening and crisis routing.
                      </li>
                    )}
                    {housingFlag && (
                      <li data-testid="action-housing">
                        <strong>Housing:</strong> Call <a href="tel:211" className="underline">211</a> for emergency shelter, or <a href="tel:18007865437" className="underline">1-800-RUNAWAY</a>. Ask your local PHA about HUD <strong>Foster Youth to Independence (FYI)</strong> vouchers — up to 36 months of rental assistance, ages 18–24.
                      </li>
                    )}
                    {foodFlag && (
                      <li data-testid="action-food">
                        <strong>Food:</strong> Call <a href="tel:211" className="underline">211</a> for the closest food pantry. Apply for SNAP at your state benefits portal — most former foster youth qualify.
                      </li>
                    )}
                    <li data-testid="action-resources">
                      <strong>20,670 verified resources:</strong> Search by need + location at{" "}
                      <a href="https://lifetransitionsaid.org/resources" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-1">LifeBridge resource finder <ExternalLink className="h-3 w-3" /></a>.
                    </li>
                  </ol>
                </div>
              )}

              {!anyRedFlag && (
                <div className="pt-2 border-t border-emerald-200 dark:border-emerald-900 text-sm" data-testid="text-no-flags">
                  No red flags right now. That's good. Re-check in 30 days, or whenever something changes.
                </div>
              )}

              <div className="pt-2 text-xs text-muted-foreground" data-testid="text-disclaimer">
                <strong>Disclaimer:</strong> Screening tools are not diagnoses. They tell you and a clinician where to look next. Your answers are not stored on any server.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
