// Youth Voice Portal — public. Youth with lived experience share input that
// shapes YHSI programs; a capability token (shown once) lets them revisit
// their entry and see the staff-written impact note. No login, no legal name.
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, KeyRound, Sparkles, ShieldCheck, Copy } from "lucide-react";

const INPUT_TYPES = [
  { value: "program_design", label: "How a program should work" },
  { value: "application_feedback", label: "Feedback on the grant application" },
  { value: "service_gap", label: "A service that's missing" },
  { value: "policy", label: "A policy that should change" },
  { value: "safety", label: "Something about safety" },
  { value: "other", label: "Something else" },
];

export default function YouthVoicePage() {
  const { toast } = useToast();
  const [alias, setAlias] = useState("");
  const [ageRange, setAgeRange] = useState("prefer_not");
  const [inputType, setInputType] = useState("program_design");
  const [body, setBody] = useState("");
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);
  const [lookupId, setLookupId] = useState("");
  const [lookupToken, setLookupToken] = useState("");
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const { data: wall } = useQuery<{
    totalContributions: number | null;
    incorporated: Array<{ id: string; contributorAlias: string; inputType: string; relatedProgram: string | null; impactNote: string | null }>;
  }>({ queryKey: ["/api/yhsi/voice-wall"] });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/yhsi/voice", {
        contributorAlias: alias.trim() || undefined,
        ageRange,
        livedExperience: true,
        inputType,
        body: body.trim(),
      });
      return res.json();
    },
    onSuccess: (data: { accessToken: string; entry: { id: string } }) => {
      setSavedToken(data.accessToken);
      setSavedEntryId(data.entry.id);
      setBody("");
      toast({ title: "Thank you — your voice is in.", description: "Save your access code so you can check back on what happened with your input." });
    },
    onError: (err: Error) => {
      toast({ title: "Couldn't save your input", description: err.message, variant: "destructive" });
    },
  });

  const lookup = async () => {
    setLookupError(null);
    setLookupResult(null);
    try {
      const res = await fetch(`/api/yhsi/voice/${encodeURIComponent(lookupId.trim())}`, {
        headers: { "x-voice-token": lookupToken.trim() },
      });
      if (!res.ok) throw new Error("We couldn't find that entry. Double-check the entry ID and access code.");
      setLookupResult(await res.json());
    } catch (e: any) {
      setLookupError(e.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8" data-testid="page-youth-voice">
      <PageHeader
        title="Youth Voice"
        description="If you've experienced housing instability, your experience is expertise. What you share here directly shapes our programs — and you can check back to see exactly how."
      />

      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" /> Share what should change</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> No login. No legal name. Use any name you want — or none.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {savedToken ? (
            <div className="rounded-lg border bg-muted/40 p-4 space-y-3" data-testid="voice-token-panel">
              <p className="font-medium flex items-center gap-2"><KeyRound className="h-4 w-4" /> Save these two things — they're shown only once:</p>
              <div className="text-sm space-y-1 font-mono break-all">
                <p><span className="text-muted-foreground">Entry ID:</span> {savedEntryId}</p>
                <p><span className="text-muted-foreground">Access code:</span> {savedToken}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" data-testid="button-copy-token"
                  onClick={() => { navigator.clipboard.writeText(`Entry ID: ${savedEntryId}\nAccess code: ${savedToken}`); toast({ title: "Copied" }); }}>
                  <Copy className="h-4 w-4 mr-1" /> Copy both
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setSavedToken(null); setSavedEntryId(null); }} data-testid="button-share-another">
                  Share something else
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="voice-alias">Name (optional)</Label>
                  <Input id="voice-alias" data-testid="input-alias" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Any name you like" maxLength={120} />
                </div>
                <div className="space-y-1">
                  <Label>Age range</Label>
                  <Select value={ageRange} onValueChange={setAgeRange}>
                    <SelectTrigger data-testid="select-age-range"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="14-17">14–17</SelectItem>
                      <SelectItem value="18-20">18–20</SelectItem>
                      <SelectItem value="21-24">21–24</SelectItem>
                      <SelectItem value="prefer_not">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>What is this about?</Label>
                  <Select value={inputType} onValueChange={setInputType}>
                    <SelectTrigger data-testid="select-input-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INPUT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="voice-body">Your input</Label>
                <Textarea id="voice-body" data-testid="input-body" value={body} onChange={(e) => setBody(e.target.value)} rows={5} maxLength={10000}
                  placeholder="What would have actually helped you? What should this program do differently? What do adults keep getting wrong?" />
              </div>
              <Button data-testid="button-submit-voice" disabled={!body.trim() || submitMutation.isPending} onClick={() => submitMutation.mutate()}>
                {submitMutation.isPending ? "Sending…" : "Send it"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Check on your input</CardTitle>
          <CardDescription>Enter your Entry ID and access code to see its status and how it shaped the program.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Input data-testid="input-lookup-id" placeholder="Entry ID" value={lookupId} onChange={(e) => setLookupId(e.target.value)} />
            <Input data-testid="input-lookup-token" placeholder="Access code" value={lookupToken} onChange={(e) => setLookupToken(e.target.value)} />
          </div>
          <Button variant="outline" data-testid="button-lookup" disabled={!lookupId.trim() || !lookupToken.trim()} onClick={lookup}>Check status</Button>
          {lookupError && <p className="text-sm text-destructive" data-testid="text-lookup-error">{lookupError}</p>}
          {lookupResult && (
            <div className="rounded-lg border p-4 space-y-2 text-sm" data-testid="lookup-result">
              <div className="flex items-center gap-2">
                <Badge>{lookupResult.status === "incorporated" ? "Incorporated into the program" : lookupResult.status === "reviewed" ? "Reviewed by staff" : lookupResult.status === "not_actionable" ? "Reviewed — not actionable right now" : "Received — waiting for review"}</Badge>
              </div>
              <p className="whitespace-pre-wrap text-muted-foreground">{lookupResult.body}</p>
              {lookupResult.impactNote && (
                <div className="rounded bg-muted/50 p-3">
                  <p className="font-medium flex items-center gap-1"><Sparkles className="h-4 w-4" /> How your input shaped things:</p>
                  <p className="whitespace-pre-wrap">{lookupResult.impactNote}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> What youth input has already changed</CardTitle>
          <CardDescription>
            {typeof wall?.totalContributions === "number" ? `${wall.totalContributions} contributions so far.` : "Every contribution is read by a real person."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(wall?.incorporated?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground" data-testid="text-wall-empty">Incorporated changes will appear here with credit to the young people who suggested them.</p>
          ) : (
            wall!.incorporated.map((e) => (
              <div key={e.id} className="rounded-lg border p-3 text-sm space-y-1" data-testid={`wall-entry-${e.id}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{e.contributorAlias}</span>
                  <Badge variant="outline">{INPUT_TYPES.find((t) => t.value === e.inputType)?.label || e.inputType}</Badge>
                  {e.relatedProgram && <Badge variant="secondary">{e.relatedProgram}</Badge>}
                </div>
                {e.impactNote && <p className="text-muted-foreground whitespace-pre-wrap">{e.impactNote}</p>}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
