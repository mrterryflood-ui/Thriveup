import { useState } from "react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Building2, MapPin, Target, Users, CheckCircle2 } from "lucide-react";

const FOCUS_OPTIONS = ["Workforce Development","Behavioral Health","Health Equity","Reentry & Justice","Youth Development","Education","Housing","Food Security","Veterans","Disability Services","Maternal Health","Substance Use","Domestic Violence","Immigrant Services","Foster Care","Senior Services","Civic Engagement","Arts & Culture","Environment","Economic Development"];
const POPULATION_OPTIONS = ["Black/African American","Latino/Hispanic","Indigenous","Asian/Pacific Islander","Immigrants & Refugees","Veterans & Military Families","Foster & Justice-Involved Youth","Justice-Involved Adults","LGBTQ+","People with Disabilities","Seniors (65+)","Low-Income Families","Rural Communities","Survivors of Violence","Unhoused Individuals"];
const BUDGET_RANGES = ["Under $100K","$100K–$500K","$500K–$1M","$1M–$5M","$5M–$25M","$25M+"];
const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];

export default function OrgOnboardingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", ein: "", is501c3: false,
    missionText: "", capabilityStatementText: "",
    focusAreas: [] as string[], populationsServed: [] as string[],
    state: "", counties: [] as string[], countiesInput: "",
    budgetRange: "", websiteUrl: "",
  });

  // If user already has an org, send them to settings.
  const { data: existing } = useQuery<{ organization: { id: string } | null }>({
    queryKey: ["/api/me/organization"],
  });
  useEffect(() => {
    if (existing?.organization) {
      setLocation("/settings/organization");
    }
  }, [existing, setLocation]);

  const create = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        counties: form.countiesInput.split(",").map(s => s.trim()).filter(Boolean),
      };
      const res = await apiRequest("POST", "/api/me/organization", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/organization"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
      toast({
        title: "Profile created — next, upload your documents",
        description: "Drop in your capability statement, 501(c)(3) letter, W-9, COI, and past performance. These auto-populate every proposal you team on.",
      });
      setLocation("/partner-portal");
    },
    onError: (e: Error) => toast({ title: "Couldn't create profile", description: e.message, variant: "destructive" }),
  });

  const toggle = (arr: string[], value: string) => arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];

  const canProceed = (() => {
    if (step === 1) return form.name.trim().length > 1;
    if (step === 2) return form.missionText.trim().length > 20;
    if (step === 3) return form.focusAreas.length > 0 && form.populationsServed.length > 0;
    if (step === 4) return !!form.state;
    return true;
  })();

  return (
    <div className="container max-w-3xl mx-auto py-10 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Building2 className="w-4 h-4" /> Step {step} of 5
        </div>
        <h1 className="text-3xl font-bold" data-testid="text-onboarding-title">Tell us about your organization</h1>
        <p className="text-muted-foreground mt-2">We use this to score every grant against your mission — not somebody else's.</p>
        <div className="flex gap-1 mt-4">
          {[1,2,3,4,5].map(n => (
            <div key={n} className={`h-2 flex-1 rounded ${n <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-5">
          {step === 1 && (
            <>
              <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" /> Basics</CardTitle>
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization name *</Label>
                <Input id="org-name" data-testid="input-org-name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Topeka Youth Futures" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ein">EIN (optional)</Label>
                  <Input id="ein" data-testid="input-ein" value={form.ein} onChange={e => setForm({...form, ein: e.target.value})} placeholder="12-3456789" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website (optional)</Label>
                  <Input id="website" data-testid="input-website" value={form.websiteUrl} onChange={e => setForm({...form, websiteUrl: e.target.value})} placeholder="https://…" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="is501c3" checked={form.is501c3} onCheckedChange={v => setForm({...form, is501c3: !!v})} data-testid="checkbox-501c3" />
                <Label htmlFor="is501c3">We have IRS 501(c)(3) determination</Label>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5" /> Your mission</CardTitle>
              <CardDescription>Plain language. What you actually do, for whom. This drives every fit score.</CardDescription>
              <div className="space-y-2">
                <Label htmlFor="mission">Mission *</Label>
                <Textarea id="mission" data-testid="textarea-mission" rows={4} value={form.missionText} onChange={e => setForm({...form, missionText: e.target.value})} placeholder="We connect formerly-incarcerated adults in Shawnee County to peer support, housing, and workforce training that meets them where they are…" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="caps">Capability statement (optional)</Label>
                <Textarea id="caps" data-testid="textarea-capabilities" rows={4} value={form.capabilityStatementText} onChange={e => setForm({...form, capabilityStatementText: e.target.value})} placeholder="Programs, evidence base, staff certifications, past awards, key partnerships…" />
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Focus & populations</CardTitle>
              <CardDescription>Pick everything that actually applies. Be honest — overclaiming hurts fit scores.</CardDescription>
              <div className="space-y-2">
                <Label>Focus areas *</Label>
                <div className="flex flex-wrap gap-2">
                  {FOCUS_OPTIONS.map(f => (
                    <Badge key={f} variant={form.focusAreas.includes(f) ? "default" : "outline"} className="cursor-pointer" data-testid={`chip-focus-${f.replace(/\W+/g,"-").toLowerCase()}`} onClick={() => setForm({...form, focusAreas: toggle(form.focusAreas, f)})}>{f}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Populations served *</Label>
                <div className="flex flex-wrap gap-2">
                  {POPULATION_OPTIONS.map(p => (
                    <Badge key={p} variant={form.populationsServed.includes(p) ? "default" : "outline"} className="cursor-pointer" data-testid={`chip-pop-${p.replace(/\W+/g,"-").toLowerCase()}`} onClick={() => setForm({...form, populationsServed: toggle(form.populationsServed, p)})}>{p}</Badge>
                  ))}
                </div>
              </div>
            </>
          )}
          {step === 4 && (
            <>
              <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" /> Geography</CardTitle>
              <CardDescription>Where you serve. Used to filter out grants you don't qualify for.</CardDescription>
              <div className="space-y-2">
                <Label>Primary state *</Label>
                <Select value={form.state} onValueChange={v => setForm({...form, state: v})}>
                  <SelectTrigger data-testid="select-state"><SelectValue placeholder="Choose state…" /></SelectTrigger>
                  <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="counties">Counties or cities served (comma-separated)</Label>
                <Input id="counties" data-testid="input-counties" value={form.countiesInput} onChange={e => setForm({...form, countiesInput: e.target.value})} placeholder="Shawnee, Douglas, Jackson" />
              </div>
              <div className="space-y-2">
                <Label>Annual budget range</Label>
                <Select value={form.budgetRange} onValueChange={v => setForm({...form, budgetRange: v})}>
                  <SelectTrigger data-testid="select-budget"><SelectValue placeholder="Choose range…" /></SelectTrigger>
                  <SelectContent>{BUDGET_RANGES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </>
          )}
          {step === 5 && (
            <>
              <CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Review</CardTitle>
              <div className="rounded-lg border p-4 space-y-2 text-sm">
                <div><span className="font-semibold">Name:</span> {form.name}</div>
                <div><span className="font-semibold">EIN:</span> {form.ein || "—"} {form.is501c3 && <Badge variant="secondary" className="ml-2">501(c)(3)</Badge>}</div>
                <div><span className="font-semibold">Mission:</span> {form.missionText.slice(0, 160)}{form.missionText.length > 160 ? "…" : ""}</div>
                <div><span className="font-semibold">Focus areas:</span> {form.focusAreas.join(", ") || "—"}</div>
                <div><span className="font-semibold">Populations:</span> {form.populationsServed.join(", ") || "—"}</div>
                <div><span className="font-semibold">Geography:</span> {form.state}{form.countiesInput ? ` — ${form.countiesInput}` : ""}</div>
                <div><span className="font-semibold">Budget:</span> {form.budgetRange || "—"}</div>
              </div>
              <p className="text-sm text-muted-foreground">When you finish, we'll start scoring grants for your mission in the background. First scores appear within a minute.</p>
            </>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" disabled={step === 1} onClick={() => setStep(step - 1)} data-testid="button-back">Back</Button>
            {step < 5 ? (
              <Button disabled={!canProceed} onClick={() => setStep(step + 1)} data-testid="button-next">
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button disabled={create.isPending} onClick={() => create.mutate()} data-testid="button-finish">
                {create.isPending ? "Creating…" : "Create profile & score grants"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
