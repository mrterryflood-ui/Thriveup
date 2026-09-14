import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Heart, MapPin, MessageCircle, Rocket, ShieldCheck, Sparkles } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const CATEGORY_OPTIONS: Array<{ value: string; label: string; hint: string }> = [
  { value: "service-working", label: "Something that's working", hint: "Lift up what's good." },
  { value: "gap-need", label: "A gap we need to fill", hint: "Honest unmet needs." },
  { value: "assistance-request", label: "Direct assistance request", hint: "Concrete asks from neighbors." },
  { value: "safety-concern", label: "Safety concern", hint: "Flagged for project safety review." },
  { value: "transportation", label: "Transportation", hint: "Getting around." },
  { value: "housing", label: "Housing", hint: "Roofs and rent." },
  { value: "food-access", label: "Food access", hint: "Groceries, pantries, hot meals." },
  { value: "mental-health", label: "Mental & emotional health", hint: "A domestic project category; follow-up depends on local capacity." },
  { value: "workforce-training", label: "Workforce & training", hint: "Routed to Trade Sims + Mission Transition." },
  { value: "youth-services", label: "Youth services", hint: "Routed to ISSS + Foster Youth wizard." },
  { value: "veteran-services", label: "Veteran services", hint: "Routed to Mission Transition." },
  { value: "story", label: "A story to tell", hint: "Long-form lived experience." },
];

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

export default function VoiceWizardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [centerInput, setCenterInput] = useState("30.4394, -97.6200");
  const [defaultZoom, setDefaultZoom] = useState(12);
  const [categories, setCategories] = useState<string[]>(["service-working", "gap-need", "assistance-request"]);
  const [accessMode, setAccessMode] = useState<"public" | "email" | "hybrid">("public");
  const [crisisRoutingEnabled, setCrisisRoutingEnabled] = useState(true);

  const slug = slugify(name) || "untitled-project";
  const [lat, lng] = centerInput.split(",").map((s) => parseFloat(s.trim()));
  const validCenter = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

  const launch = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/voice/projects/wizard", {
        slug,
        name: name.trim(),
        description: description.trim() || null,
        centerLat: lat,
        centerLng: lng,
        defaultZoom,
        accessMode,
        crisisRoutingEnabled,
        pinCategories: categories,
        status: "active",
        publiclyVisible: true,
      });
    },
    onSuccess: async (resp) => {
      const data = (await resp.json()) as { project?: { slug: string } };
      await queryClient.invalidateQueries({ queryKey: ["/api/voice/projects"] });
      toast({ title: "Your project is live!", description: "Thank you for listening to your community." });
      if (data?.project?.slug) setLocation(`/voice/${data.project.slug}`);
    },
    onError: async (err: Error) => {
      let msg = err.message;
      try { const j = JSON.parse(err.message); msg = j.error ?? msg; } catch { /* keep msg */ }
      toast({ title: "Couldn't launch", description: msg, variant: "destructive" });
    },
  });

  const stepValid = (n: number): boolean => {
    if (n === 1) return name.trim().length >= 3;
    if (n === 2) return validCenter;
    if (n === 3) return categories.length >= 1;
    return true;
  };

  return (
    <div className="container max-w-3xl py-10 px-4">
      <Link href="/voice" data-testid="link-back-to-voice">
        <Button variant="ghost" size="sm" className="mb-4"><ArrowLeft className="h-4 w-4 mr-1" />Back to projects</Button>
      </Link>
      <div className="mb-8 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
          <Heart className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Start a listening project</h1>
        <p className="text-muted-foreground mt-2">
           Built for the community you serve. Every voice is reviewed through the project’s local process. <span className="font-medium">Thank you for doing this work.</span>
        </p>
        <Progress value={(step / 4) * 100} className="mt-6 h-2" data-testid="progress-wizard" />
        <p className="text-xs text-muted-foreground mt-2">Step {step} of 4</p>
      </div>

      {step === 1 && (
        <Card data-testid="wizard-step-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Name your project</CardTitle>
            <CardDescription>Give it a name your neighbors will recognize. You can change it later.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Pflugerville Youth Safety Listening Tour" data-testid="input-project-name" maxLength={140} />
              <p className="text-xs text-muted-foreground">Public link: <code className="text-foreground">/voice/{slug}</code></p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Why are you listening? <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell residents what you're hoping to hear and what will happen with their voice." rows={4} data-testid="input-project-description" maxLength={2000} />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card data-testid="wizard-step-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Where on the map?</CardTitle>
            <CardDescription>Center the map on the neighborhood, city, or service area you're listening to.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="center">Center coordinates (latitude, longitude)</Label>
              <Input id="center" value={centerInput} onChange={(e) => setCenterInput(e.target.value)} placeholder="30.4394, -97.6200" data-testid="input-center" />
              <p className="text-xs text-muted-foreground">Tip: paste from Google Maps — right-click the spot, copy the coordinates.</p>
              {!validCenter && centerInput && <p className="text-xs text-destructive">That doesn't look like valid coordinates yet.</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="zoom">Default zoom level: <span className="font-mono">{defaultZoom}</span></Label>
              <input id="zoom" type="range" min={8} max={16} value={defaultZoom} onChange={(e) => setDefaultZoom(parseInt(e.target.value))} className="w-full" data-testid="input-zoom" />
              <p className="text-xs text-muted-foreground">8 = wide region · 12 = city · 16 = block.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card data-testid="wizard-step-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5" /> What are you listening for?</CardTitle>
            <CardDescription>Pick the categories residents can choose from. Choose at least one — pick what matches your community.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {CATEGORY_OPTIONS.map((c) => {
                const checked = categories.includes(c.value);
                return (
                  <label key={c.value} className={`flex gap-3 rounded-lg border p-3 cursor-pointer hover-elevate ${checked ? "border-primary bg-primary/5" : ""}`} data-testid={`category-${c.value}`}>
                    <Checkbox checked={checked} onCheckedChange={(v) => setCategories((arr) => v ? [...arr, c.value] : arr.filter((x) => x !== c.value))} />
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{c.label}</div>
                      <div className="text-xs text-muted-foreground">{c.hint}</div>
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3">{categories.length} selected</p>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card data-testid="wizard-step-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Access & safety</CardTitle>
            <CardDescription>How can people drop a pin — and how should we handle safety concerns?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <Label>Who can drop a pin?</Label>
              <RadioGroup value={accessMode} onValueChange={(v) => setAccessMode(v as typeof accessMode)} className="gap-3">
                <label className="flex gap-3 rounded-lg border p-3 cursor-pointer hover-elevate" data-testid="access-public">
                  <RadioGroupItem value="public" className="mt-0.5" />
                  <div><div className="font-medium text-sm">Anyone (public)</div><div className="text-xs text-muted-foreground">Lowest barrier. Highest reach.</div></div>
                </label>
                <label className="flex gap-3 rounded-lg border p-3 cursor-pointer hover-elevate" data-testid="access-email">
                  <RadioGroupItem value="email" className="mt-0.5" />
                  <div><div className="font-medium text-sm">Email required</div><div className="text-xs text-muted-foreground">Lighter spam, harder for unbanked / unhoused residents.</div></div>
                </label>
                <label className="flex gap-3 rounded-lg border p-3 cursor-pointer hover-elevate" data-testid="access-hybrid">
                  <RadioGroupItem value="hybrid" className="mt-0.5" />
                  <div><div className="font-medium text-sm">Hybrid (optional email)</div><div className="text-xs text-muted-foreground">Anyone can pin, anyone can leave contact info if they want a callback.</div></div>
                </label>
              </RadioGroup>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Switch checked={crisisRoutingEnabled} onCheckedChange={setCrisisRoutingEnabled} data-testid="switch-crisis" />
              <div>
                <div className="font-medium text-sm">Crisis routing</div>
                 <p className="text-xs text-muted-foreground">When a pin mentions self-harm, abuse, or being unsafe, flag it for project safety review. No external notification is sent automatically. <span className="font-medium">Recommended ON.</span></p>
              </div>
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                <strong>Ready to launch:</strong> "{name || "Untitled"}" at <code>{slug}</code>, centered on {validCenter ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : "(unset)"}, listening for {categories.length} categor{categories.length === 1 ? "y" : "ies"}, {accessMode} access, crisis routing {crisisRoutingEnabled ? "ON" : "OFF"}.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1} data-testid="button-prev"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        {step < 4 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!stepValid(step)} data-testid="button-next">Next<ArrowRight className="h-4 w-4 ml-1" /></Button>
        ) : (
          <Button onClick={() => launch.mutate()} disabled={launch.isPending || !stepValid(1) || !stepValid(2) || !stepValid(3)} data-testid="button-launch">
            <Rocket className="h-4 w-4 mr-1" />{launch.isPending ? "Launching..." : "Launch project"}
          </Button>
        )}
      </div>
    </div>
  );
}
