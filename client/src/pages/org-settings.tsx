import { useEffect, useState } from "react";
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

const FOCUS_OPTIONS = ["Workforce Development","Behavioral Health","Health Equity","Reentry & Justice","Youth Development","Education","Housing","Food Security","Veterans","Disability Services","Maternal Health","Substance Use","Domestic Violence","Immigrant Services","Foster Care","Senior Services","Civic Engagement","Arts & Culture","Environment","Economic Development"];
const POPULATION_OPTIONS = ["Black/African American","Latino/Hispanic","Indigenous","Asian/Pacific Islander","Immigrants & Refugees","Veterans & Military Families","Foster & Justice-Involved Youth","Justice-Involved Adults","LGBTQ+","People with Disabilities","Seniors (65+)","Low-Income Families","Rural Communities","Survivors of Violence","Unhoused Individuals"];
const BUDGET_RANGES = ["Under $100K","$100K–$500K","$500K–$1M","$1M–$5M","$5M–$25M","$25M+"];
const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];

type Org = {
  id: string; name: string; ein?: string | null; is501c3: boolean;
  missionText?: string | null; capabilityStatementText?: string | null;
  focusAreas?: string[]; populationsServed?: string[];
  state?: string | null; counties?: string[]; budgetRange?: string | null; websiteUrl?: string | null;
  naicsCodes?: string[]; pscCodes?: string[];
  uei?: string | null; cageCode?: string | null; samStatus?: string | null;
};

export default function OrgSettingsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data, isLoading } = useQuery<{ organization: Org | null }>({ queryKey: ["/api/me/organization"] });
  const [form, setForm] = useState<Org | null>(null);
  const [countiesInput, setCountiesInput] = useState("");
  const [naicsInput, setNaicsInput] = useState("");
  const [pscInput, setPscInput] = useState("");

  useEffect(() => {
    if (data?.organization && !form) {
      setForm(data.organization);
      setCountiesInput((data.organization.counties ?? []).join(", "));
      setNaicsInput((data.organization.naicsCodes ?? []).join(", "));
      setPscInput((data.organization.pscCodes ?? []).join(", "));
    }
  }, [data, form]);

  useEffect(() => {
    if (data && data.organization === null) setLocation("/onboarding/org");
  }, [data, setLocation]);

  const update = useMutation({
    mutationFn: async () => {
      if (!form) return;
      const payload = {
        ...form,
        counties: countiesInput.split(",").map(s => s.trim()).filter(Boolean),
        naicsCodes: naicsInput.split(/[,\s]+/).map(s => s.trim()).filter(s => /^\d{2,6}$/.test(s)),
        pscCodes: pscInput.split(/[,\s]+/).map(s => s.trim().toUpperCase()).filter(s => /^[A-Z0-9]{2,5}$/.test(s)),
      };
      const res = await apiRequest("PATCH", "/api/me/organization", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/organization"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
      toast({ title: "Profile updated", description: "Grant fit scores are being recomputed." });
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  if (isLoading || !form) return <div className="container max-w-3xl mx-auto py-10 px-4">Loading…</div>;

  const toggle = (arr: string[] | undefined, value: string): string[] => {
    const a = arr ?? [];
    return a.includes(value) ? a.filter(v => v !== value) : [...a, value];
  };

  return (
    <div className="container max-w-3xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-settings-title">Organization profile</h1>
        <p className="text-muted-foreground mt-1">Every change re-scores your grant feed.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Basics</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Name</Label><Input data-testid="input-org-name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>EIN</Label><Input data-testid="input-ein" value={form.ein ?? ""} onChange={e => setForm({...form, ein: e.target.value})} /></div>
            <div className="space-y-2"><Label>Website</Label><Input data-testid="input-website" value={form.websiteUrl ?? ""} onChange={e => setForm({...form, websiteUrl: e.target.value})} /></div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="is501c3" checked={form.is501c3} onCheckedChange={v => setForm({...form, is501c3: !!v})} data-testid="checkbox-501c3" />
            <Label htmlFor="is501c3">501(c)(3) determined</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Mission</CardTitle><CardDescription>Drives fit scoring.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Mission statement</Label><Textarea rows={4} data-testid="textarea-mission" value={form.missionText ?? ""} onChange={e => setForm({...form, missionText: e.target.value})} /></div>
          <div className="space-y-2"><Label>Capability statement</Label><Textarea rows={4} data-testid="textarea-capabilities" value={form.capabilityStatementText ?? ""} onChange={e => setForm({...form, capabilityStatementText: e.target.value})} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Focus & populations</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Focus areas</Label>
            <div className="flex flex-wrap gap-2">
              {FOCUS_OPTIONS.map(f => (
                <Badge key={f} variant={(form.focusAreas ?? []).includes(f) ? "default" : "outline"} className="cursor-pointer" onClick={() => setForm({...form, focusAreas: toggle(form.focusAreas, f)})}>{f}</Badge>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Populations served</Label>
            <div className="flex flex-wrap gap-2">
              {POPULATION_OPTIONS.map(p => (
                <Badge key={p} variant={(form.populationsServed ?? []).includes(p) ? "default" : "outline"} className="cursor-pointer" onClick={() => setForm({...form, populationsServed: toggle(form.populationsServed, p)})}>{p}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Geography & budget</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>State</Label>
            <Select value={form.state ?? ""} onValueChange={v => setForm({...form, state: v})}>
              <SelectTrigger data-testid="select-state"><SelectValue placeholder="Choose state…" /></SelectTrigger>
              <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Counties (comma-separated)</Label><Input data-testid="input-counties" value={countiesInput} onChange={e => setCountiesInput(e.target.value)} /></div>
          <div className="space-y-2">
            <Label>Budget range</Label>
            <Select value={form.budgetRange ?? ""} onValueChange={v => setForm({...form, budgetRange: v})}>
              <SelectTrigger data-testid="select-budget"><SelectValue placeholder="Choose range…" /></SelectTrigger>
              <SelectContent>{BUDGET_RANGES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Document library</CardTitle>
          <CardDescription>
            Upload capability statements, 501(c)(3) letters, W-9s, insurance certificates, past-performance writeups, and credentials
            for every affiliated entity (HIS, Love Clinic, Vanntastic, Sistahs CWT, TCAF, etc.). One library, reusable across every proposal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => setLocation("/settings/documents")} data-testid="button-open-documents">
            Open document library →
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Federal contracting identifiers</CardTitle>
          <CardDescription>
            Used by the Grant Discovery Engine to filter set-asides, SAM.gov contract vehicles, and prior-award lookups.
            NAICS = 6-digit industry codes (e.g., 541611 — Admin Management Consulting). PSC = 2–5 character Product/Service codes (e.g., R408 — Program Management).
            Codes are normalized on save — separate with commas or spaces.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>UEI</Label><Input data-testid="input-uei" value={form.uei ?? ""} placeholder="12-char SAM UEI" onChange={e => setForm({...form, uei: e.target.value.trim().toUpperCase()})} /></div>
            <div className="space-y-2"><Label>CAGE Code</Label><Input data-testid="input-cage" value={form.cageCode ?? ""} placeholder="5-char CAGE" onChange={e => setForm({...form, cageCode: e.target.value.trim().toUpperCase()})} /></div>
            <div className="space-y-2">
              <Label>SAM.gov status</Label>
              <Select value={form.samStatus ?? ""} onValueChange={v => setForm({...form, samStatus: v})}>
                <SelectTrigger data-testid="select-sam-status"><SelectValue placeholder="Choose…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="not_registered">Not registered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>NAICS codes</Label>
            <Input data-testid="input-naics" value={naicsInput} placeholder="e.g., 541611, 541612, 624190" onChange={e => setNaicsInput(e.target.value)} />
            <p className="text-xs text-muted-foreground">Comma or space-separated. 2–6 digit numeric codes only — anything else is filtered on save.</p>
            {(form.naicsCodes ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {(form.naicsCodes ?? []).map(c => <Badge key={c} variant="secondary" data-testid={`badge-naics-${c}`}>{c}</Badge>)}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>PSC / Product-Service codes</Label>
            <Input data-testid="input-psc" value={pscInput} placeholder="e.g., R408, R499, R701" onChange={e => setPscInput(e.target.value)} />
            <p className="text-xs text-muted-foreground">Comma or space-separated. 2–5 alphanumeric chars (auto-uppercased).</p>
            {(form.pscCodes ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {(form.pscCodes ?? []).map(c => <Badge key={c} variant="secondary" data-testid={`badge-psc-${c}`}>{c}</Badge>)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Button size="lg" disabled={update.isPending} onClick={() => update.mutate()} data-testid="button-save">
        {update.isPending ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
