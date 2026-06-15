import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Shield, ChevronLeft, ChevronRight, Download, AlertTriangle, CheckCircle2, Phone, Lock, Home, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

function QuickExit() {
  return (
    <button onClick={() => window.location.replace("https://www.weather.com")}
      className="fixed top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-lg flex items-center gap-1.5"
      data-testid="button-quick-exit">
      <AlertTriangle className="h-3.5 w-3.5" />Quick Exit
    </button>
  );
}

const STEPS = [
  { key: "welcome", label: "Welcome", icon: Shield },
  { key: "immediate", label: "Immediate Safety", icon: AlertTriangle },
  { key: "escape", label: "Escape Plan", icon: Home },
  { key: "digital", label: "Digital Safety", icon: Lock },
  { key: "housing", label: "Housing Rights", icon: FileText },
  { key: "plan", label: "My Plan", icon: CheckCircle2 },
];

interface PlanData {
  safePlaces: string;
  trustedPeople: string;
  safeSignal: string;
  importantDocs: string;
  goBagItems: string;
  moneyPlan: string;
  phoneBackup: string;
  childrenPlan: string;
  petsPlan: string;
  accountsToChange: string;
  devicesShared: string;
  leaseNote: string;
  addressConfidentiality: string;
  additionalNotes: string;
}

const INITIAL: PlanData = {
  safePlaces: "", trustedPeople: "", safeSignal: "", importantDocs: "",
  goBagItems: "", moneyPlan: "", phoneBackup: "", childrenPlan: "", petsPlan: "",
  accountsToChange: "", devicesShared: "", leaseNote: "", addressConfidentiality: "", additionalNotes: "",
};

export default function SafetyPlanningPage() {
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState<PlanData>(INITIAL);
  const [logged, setLogged] = useState(false);

  function update(field: keyof PlanData, value: string) {
    setPlan(p => ({ ...p, [field]: value }));
  }

  function next() {
    if (step === 0 && !logged) {
      apiRequest("POST", "/api/safe-passage/log", { serviceType: "safety-plan", county: null, language: null }).catch(() => {});
      setLogged(true);
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  }

  function downloadPlan() {
    const lines = [
      "MY PERSONAL SAFETY PLAN",
      "Created: " + new Date().toLocaleDateString(),
      "=".repeat(50),
      "",
      "IMMEDIATE SAFETY",
      "Safe places to go: " + (plan.safePlaces || "(not filled in)"),
      "Trusted people to call: " + (plan.trustedPeople || "(not filled in)"),
      "My signal word/phrase: " + (plan.safeSignal || "(not filled in)"),
      "",
      "ESCAPE PLAN",
      "Important documents to grab: " + (plan.importantDocs || "(not filled in)"),
      "Go bag items: " + (plan.goBagItems || "(not filled in)"),
      "Money / cash plan: " + (plan.moneyPlan || "(not filled in)"),
      "Backup phone plan: " + (plan.phoneBackup || "(not filled in)"),
      "Plan for children: " + (plan.childrenPlan || "(not filled in)"),
      "Plan for pets: " + (plan.petsPlan || "(not filled in)"),
      "",
      "DIGITAL SAFETY",
      "Accounts to secure/change: " + (plan.accountsToChange || "(not filled in)"),
      "Shared devices/location: " + (plan.devicesShared || "(not filled in)"),
      "",
      "HOUSING",
      "Lease/housing notes: " + (plan.leaseNote || "(not filled in)"),
      "Address confidentiality: " + (plan.addressConfidentiality || "(not filled in)"),
      "",
      "ADDITIONAL NOTES",
      plan.additionalNotes || "(none)",
      "",
      "=".repeat(50),
      "National DV Hotline: 1-800-799-7233 (24/7)",
      "Text START to 88788 if calling isn't safe",
      "SAFE Alliance Austin: 512-267-7233",
      "thehotline.org (private chat)",
      "",
      "Store this plan somewhere safe — not on a shared device.",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "my-safety-plan.txt"; a.click();
    URL.revokeObjectURL(url);
  }

  const Field = ({ label, field, hint, rows = 2 }: { label: string; field: keyof PlanData; hint?: string; rows?: number }) => (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      <Textarea rows={rows} value={plan[field]} onChange={e => update(field, e.target.value)}
        className="resize-none text-sm" placeholder="Write here..." data-testid={`textarea-${field}`} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50/20 dark:from-slate-950 dark:to-violet-950/10">
      <QuickExit />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/safe-passage" className="text-xs text-slate-500 hover:text-teal-600 flex items-center gap-1 mb-6">
          <ChevronLeft className="h-3 w-3" /> Back to Safe Passage
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 dark:text-slate-50">Safety Planning</h1>
            <p className="text-xs text-slate-500">Private · Not stored on our servers · Download when done</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>{STEPS[step].label}</span>
            <span>Step {step + 1} of {STEPS.length}</span>
          </div>
          <Progress value={((step + 1) / STEPS.length) * 100} className="h-1.5" />
          <div className="flex gap-1.5 mt-2">
            {STEPS.map((s, i) => (
              <div key={s.key} className={`flex-1 h-1 rounded-full transition-colors ${i <= step ? "bg-violet-500" : "bg-slate-200 dark:bg-slate-700"}`} />
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-5">
            {step === 0 && (
              <div className="space-y-4">
                <CardTitle className="text-base">Welcome — About This Tool</CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-300">A safety plan is a personalized guide that helps you stay safer — whether you're still in a dangerous situation, planning to leave, or have already left.</p>
                <div className="space-y-2">
                  {["Everything you write stays on your device — nothing is sent to any server.", "You can download a text file to keep somewhere safe.", "You can stop and restart anytime — your answers aren't saved if you close the browser.", "If someone might see your screen, use the Quick Exit button (top right) to leave immediately."].map(item => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-violet-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-600 dark:text-slate-300">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg p-3">
                  <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">If you are in immediate danger, call 911 or the DV Hotline: 1-800-799-7233</p>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <CardTitle className="text-base">Immediate Safety</CardTitle>
                <p className="text-sm text-slate-500">These are the people and places you can turn to right now.</p>
                <Field label="Safe places I can go quickly" field="safePlaces" hint="A neighbor, a 24-hr business, a shelter, a friend's home — anywhere you can get to fast" />
                <Field label="Trusted people I can call" field="trustedPeople" hint="Name and phone number for each person. Be specific." />
                <Field label="My safety signal" field="safeSignal" hint="A word, phrase, or action I can use with a trusted person to let them know I need help without saying it out loud." />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <CardTitle className="text-base">Escape Plan</CardTitle>
                <p className="text-sm text-slate-500">If you need to leave quickly, having these ready makes everything faster and safer.</p>
                <Field label="Important documents to grab" field="importantDocs" hint="ID, birth certificates, Social Security cards, lease, bank info, immigration documents, passport, protective order" />
                <Field label="Go-bag: what to pack if I have 5 minutes" field="goBagItems" hint="Clothes, medications, phone charger, cash, keys, important documents" />
                <Field label="Money plan" field="moneyPlan" hint="Emergency cash hidden somewhere safe, a bank account in only my name, a prepaid card" />
                <Field label="Backup phone plan" field="phoneBackup" hint="A trusted person who can lend a phone, a cheap prepaid phone, knowing local shelter numbers by heart" />
                <Field label="Plan for children" field="childrenPlan" hint="Who picks them up from school, what to tell them, emergency contacts at school" />
                <Field label="Plan for pets" field="petsPlan" hint="Emergency pet boarding, a trusted friend who can take them, local DV shelter pet policies" />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <CardTitle className="text-base">Digital Safety</CardTitle>
                <p className="text-sm text-slate-500">Technology can be used to track or monitor you. These steps help protect your privacy.</p>
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-1.5">
                  {[
                    "Delete your browsing history after using this site (Ctrl+Shift+H or ⌘+Shift+H)",
                    "Check for shared locations in Google Maps, Find My, or Find My Friends",
                    "Review app permissions on your phone — does a partner have access?",
                    "Consider creating a new email account on a safe device",
                    "Change passwords on a device your partner has never touched",
                  ].map(tip => (
                    <div key={tip} className="flex items-start gap-2">
                      <Lock className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 dark:text-amber-200">{tip}</p>
                    </div>
                  ))}
                </div>
                <Field label="Accounts and apps I need to change or secure" field="accountsToChange" hint="Email, social media, banking, Amazon, Google, Apple ID, Venmo" />
                <Field label="Shared devices or location-sharing to disable" field="devicesShared" hint="Family plan phones, tablets, smart speakers, car GPS, shared Apple/Google accounts" />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <CardTitle className="text-base">Housing Rights</CardTitle>
                <p className="text-sm text-slate-500">Texas law gives you specific protections as a DV/SA survivor.</p>
                <div className="space-y-3">
                  {[
                    { title: "Break your lease — no penalty", body: "Texas Property Code §92.0161: with a police report, protective order, or written statement from a qualified third party (shelter worker, counselor, medical provider), you can terminate your lease with 30 days notice. No lease-break fee." },
                    { title: "VAWA housing protections", body: "If you live in federally subsidized housing (HUD, Section 8, LIHTC), your landlord cannot evict you because of DV — even if the abuser is on the lease. You can request that the abuser be removed from the lease instead." },
                    { title: "Address Confidentiality Program (Safe at Home)", body: "Texas AG's office provides a substitute address for all government records — so your real address never appears in public records. Apply at oag.texas.gov/acp." },
                  ].map(r => (
                    <div key={r.title} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">{r.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{r.body}</p>
                    </div>
                  ))}
                </div>
                <Field label="My housing situation notes" field="leaseNote" hint="Who is on my lease, when it ends, what steps I need to take" />
                <Field label="Address confidentiality notes" field="addressConfidentiality" hint="Have I applied for ACP? What address do I use for records?" />
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <CardTitle className="text-base">My Safety Plan — Review & Download</CardTitle>
                <p className="text-sm text-slate-500">Your plan is ready. Download it as a text file and store it somewhere only you can access — not on a shared device or cloud account.</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries({ "Safe places": plan.safePlaces, "Trusted people": plan.trustedPeople, "Go-bag items": plan.goBagItems, "Digital safety": plan.accountsToChange }).map(([k, v]) => (
                    <div key={k} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{k}</p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 line-clamp-2">{v || "Not filled in"}</p>
                    </div>
                  ))}
                </div>
                <Field label="Any additional notes or reminders" field="additionalNotes" rows={3} />
                <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white" onClick={downloadPlan} data-testid="button-download-plan">
                  <Download className="h-4 w-4 mr-2" />
                  Download My Safety Plan (.txt)
                </Button>
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Keep these numbers:</p>
                  <p className="text-xs text-slate-500">National DV Hotline: <strong>1-800-799-7233</strong> (text "START" to 88788)</p>
                  <p className="text-xs text-slate-500">SAFE Alliance Austin: <strong>512-267-7233</strong></p>
                  <p className="text-xs text-slate-500">TX Crime Victims' Compensation: <strong>1-800-983-9933</strong></p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link href="/safe-passage/benefits-bridge"><Button variant="outline" size="sm" data-testid="link-to-benefits">Find Benefits & Financial Help →</Button></Link>
                  <Link href="/safe-passage/legal-navigator"><Button variant="outline" size="sm" data-testid="link-to-legal">Know Your Legal Rights →</Button></Link>
                  <Link href="/safe-passage/housing-finder"><Button variant="outline" size="sm" data-testid="link-to-housing">Find Transitional Housing →</Button></Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-4">
          <Button variant="outline" size="sm" onClick={() => setStep(s => Math.max(s - 1, 0))} disabled={step === 0} data-testid="button-prev">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button size="sm" onClick={next} className="bg-violet-600 hover:bg-violet-700 text-white" data-testid="button-next">
              Continue <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Link href="/safe-passage"><Button variant="outline" size="sm" data-testid="button-done">Done — Back to Safe Passage</Button></Link>
          )}
        </div>
      </div>
    </div>
  );
}
