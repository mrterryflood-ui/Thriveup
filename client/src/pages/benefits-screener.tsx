import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { JURISDICTIONS } from "@shared/nationwide/jurisdictions";
import { COUNTIES_BY_STATE } from "@shared/nationwide/counties";
import {
  ChevronLeft, ChevronRight, Heart, Shield, Home, Users, Baby,
  DollarSign, Building2, Stethoscope, CheckCircle2, Loader2, Search,
  MapPin, Phone, FileText, ArrowRight, Star, Sparkles, ClipboardList,
  HandHeart, Printer, UserCheck, Calendar, Globe
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
};

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
  preferredLanguage: string;
  currentBenefits: string[];
  contactName: string;
  contactPhone: string;
}

const INITIAL_DATA: ScreenerData = {
  state: "TX", county: "", zipCode: "", householdSize: "1", annualIncome: "",
  hasChildren: false, childrenUnder5: false, isPregnant: false,
  isDisabled: false, isElderly: false, preferredLanguage: "English",
  currentBenefits: [], contactName: "", contactPhone: "",
};

export default function BenefitsScreenerPage() {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ScreenerData>(INITIAL_DATA);
  const [result, setResult] = useState<any>(null);

  // Counties in the currently-selected state. Recomputed only when the state changes.
  const countiesInState = useMemo(
    () => COUNTIES_BY_STATE[data.state] || [],
    [data.state],
  );

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
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="h-7 w-7 text-red-500" />
            <h1 className="text-xl md:text-2xl font-bold" data-testid="text-screener-title">Benefits Eligibility Screener</h1>
          </div>
          <p className="text-sm text-muted-foreground">Free · Confidential · Takes 3 minutes</p>
          <div className="flex items-center gap-2 justify-center mt-2">
            <Badge variant="outline" className="text-xs">Powered by ThriveUp Academy</Badge>
            <Badge variant="outline" className="text-xs">The Collaborative Advocate Foundation</Badge>
          </div>
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
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Documents you'll need:</p>
                          <ul className="text-xs text-muted-foreground space-y-0.5">
                            {info.docs.map(d => (
                              <li key={d} className="flex items-center gap-1"><FileText className="h-3 w-3 shrink-0" /> {d}</li>
                            ))}
                          </ul>
                          {(() => {
                            const guide = result?.navigationGuides?.[b];
                            const url = guide?.applicationUrl;
                            const note = guide?.notes || guide?.processingNote;
                            const days = guide?.processingDays;
                            return url ? (
                              <div className="pt-1 space-y-1">
                                {days && <p className="text-xs text-muted-foreground">Processing: {days}</p>}
                                {note && <p className="text-xs text-muted-foreground italic">{note}</p>}
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white rounded-md px-3 py-1.5 mt-1"
                                  style={{ backgroundColor: info.color }}
                                  data-testid={`apply-link-${b}`}
                                >
                                  Apply Online →
                                </a>
                              </div>
                            ) : null;
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
