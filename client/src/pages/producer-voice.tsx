import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mic, MapPin, TrendingUp, Users, AlertTriangle, Sprout, ChevronRight, ExternalLink, MessageSquare } from "lucide-react";

const AG_TOPICS = [
  { id: "input-costs", label: "Input Cost Crisis", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  { id: "market-access", label: "Market Access", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { id: "water-access", label: "Water / Irrigation", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300" },
  { id: "labor", label: "Farm Labor Shortage", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  { id: "land-access", label: "Land Access & Tenure", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  { id: "credit", label: "Credit / Financing", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  { id: "technical-assistance", label: "Technical Assistance Gaps", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" },
  { id: "climate", label: "Climate & Weather Risk", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  { id: "invasive-species", label: "Pest / Invasive Species", color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300" },
  { id: "infrastructure", label: "Rural Infrastructure", color: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300" },
  { id: "beginning-farmer", label: "Beginning Farmer Barriers", color: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300" },
  { id: "equity", label: "Equity / Discrimination", color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300" },
];

const URGENCY_COLORS: Record<string, string> = {
  critical: "border-l-4 border-l-red-500",
  high: "border-l-4 border-l-orange-500",
  medium: "border-l-4 border-l-amber-500",
  low: "border-l-4 border-l-slate-300",
};

function VoiceCard({ pin }: { pin: any }) {
  const topic = AG_TOPICS.find(t => t.id === pin.topic);
  return (
    <Card className={`${URGENCY_COLORS[pin.urgencyLevel] || ""}`}>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {pin.headline && <p className="font-semibold text-sm mb-1">{pin.headline}</p>}
            {pin.description && <p className="text-sm text-slate-600 dark:text-slate-400">{pin.description.slice(0, 200)}{pin.description.length > 200 ? "…" : ""}</p>}
            <div className="flex flex-wrap gap-1.5 mt-2 items-center">
              {topic && <Badge className={`text-xs ${topic.color}`}>{topic.label}</Badge>}
              {pin.countyName && <span className="text-xs text-slate-400 flex items-center gap-0.5"><MapPin className="w-3 h-3" />{pin.countyName}</span>}
              {pin.urgencyLevel && <span className={`text-xs font-semibold capitalize ${pin.urgencyLevel === "critical" ? "text-red-600" : pin.urgencyLevel === "high" ? "text-orange-600" : "text-slate-500"}`}>{pin.urgencyLevel}</span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-400">{pin.upvoteCount || 0} 👍</p>
            <p className="text-xs text-slate-400 mt-0.5">{pin.responseCount || 0} responses</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProducerVoicePage() {
  const { toast } = useToast();
  const [selectedTopic, setSelectedTopic] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [countyName, setCountyName] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState("medium");
  const [submitted, setSubmitted] = useState(false);

  // Reuse Community Voice API — agricultural project
  const AG_PROJECT_SLUG = "producer-voice";

  const { data: voicePins, refetch } = useQuery({
    queryKey: ["/api/voice/projects", AG_PROJECT_SLUG, "pins", filterTopic],
    queryFn: async () => {
      const params = filterTopic ? `?topic=${filterTopic}` : "";
      const r = await apiRequest("GET", `/api/voice/projects/${AG_PROJECT_SLUG}/pins${params}`);
      return r.json();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTopic || !description) return;
      const r = await apiRequest("POST", `/api/voice/projects/${AG_PROJECT_SLUG}/pins`, {
        topic: selectedTopic,
        headline,
        description,
        countyName,
        urgencyLevel,
        pinType: "challenge",
        isAnonymous: true,
      });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Voice submitted!", description: "Your experience has been recorded. Thank you for speaking up." });
      setSubmitted(true);
      setHeadline(""); setDescription(""); setCountyName(""); setSelectedTopic("");
      refetch();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const upvoteMutation = useMutation({
    mutationFn: async (pinId: number) => {
      const r = await apiRequest("POST", `/api/voice/projects/${AG_PROJECT_SLUG}/pins/${pinId}/upvote`, {});
      return r.json();
    },
    onSuccess: () => refetch(),
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5">
        <nav className="text-xs text-slate-500 mb-2 flex items-center gap-1"><Mic className="w-3 h-3" /><span>Producer Voice — ThriveUp Academy</span></nav>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">Producer Voice</h1>
        <p className="mt-1 text-slate-500 max-w-2xl">Farmers, ranchers, and food producers: share what's blocking your operation. Anonymous. Your voice shapes USDA program design and ThriveUp advocacy.</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Submit Voice */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mic className="w-5 h-5 text-green-600" />Share Your Challenge</CardTitle>
                <CardDescription>Anonymous. No name or farm info collected. All consents off by default.</CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-6">
                    <Sprout className="w-12 h-12 mx-auto text-green-500 mb-3" />
                    <p className="font-semibold text-green-700 dark:text-green-400 mb-1">Voice recorded</p>
                    <p className="text-sm text-slate-500 mb-4">Your experience is now part of the producer record.</p>
                    <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>Submit another</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Topic *</label>
                      <div className="flex flex-wrap gap-1.5">
                        {AG_TOPICS.map(t => (
                          <button key={t.id} data-testid={`topic-${t.id}`}
                            className={`px-2 py-1 text-xs rounded-full border transition-colors ${selectedTopic === t.id ? `${t.color} border-transparent` : "border-slate-300 dark:border-slate-600 hover:border-green-500"}`}
                            onClick={() => setSelectedTopic(t.id)}>
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Headline (optional)</label>
                      <Input data-testid="input-headline" placeholder='e.g. "Fertilizer costs up 80% — can't break even"' value={headline} onChange={e => setHeadline(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Your Experience *</label>
                      <Textarea data-testid="input-description" rows={4} placeholder="Describe what's happening on your operation and how it's affecting you…" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">County (optional)</label>
                        <Input data-testid="input-voice-county" placeholder="Travis County, TX" value={countyName} onChange={e => setCountyName(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Urgency</label>
                        <Select value={urgencyLevel} onValueChange={setUrgencyLevel}>
                          <SelectTrigger data-testid="select-urgency"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button data-testid="button-submit-voice" className="w-full" disabled={!selectedTopic || !description || submitMutation.isPending}
                      onClick={() => submitMutation.mutate()}>
                      {submitMutation.isPending ? "Submitting…" : "Submit My Voice"}
                    </Button>
                    <p className="text-xs text-slate-400 text-center">Anonymous · No name required · Your county stays private unless you add it</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            {voicePins && (
              <Card className="mt-4">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-700">{voicePins.total || voicePins.pins?.length || 0}</p>
                      <p className="text-xs text-slate-500">Total voices</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-700">
                        {voicePins.pins?.reduce((s: number, p: any) => s + (p.upvoteCount || 0), 0) || 0}
                      </p>
                      <p className="text-xs text-slate-500">Total endorsements</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Voice Feed */}
          <div className="lg:col-span-2">
            <div className="flex flex-wrap gap-2 mb-4 items-center">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Filter by topic:</p>
              <button className={`px-3 py-1 text-xs rounded-full border transition-colors ${!filterTopic ? "bg-green-600 text-white border-green-600" : "border-slate-300 dark:border-slate-600"}`}
                onClick={() => setFilterTopic("")}>All</button>
              {AG_TOPICS.map(t => (
                <button key={t.id} data-testid={`filter-${t.id}`}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${filterTopic === t.id ? `${t.color} border-transparent` : "border-slate-300 dark:border-slate-600"}`}
                  onClick={() => setFilterTopic(filterTopic === t.id ? "" : t.id)}>
                  {t.label}
                </button>
              ))}
            </div>

            {voicePins?.pins?.length > 0 ? (
              <div className="space-y-3">
                {voicePins.pins.map((pin: any, i: number) => (
                  <div key={pin.id || i} className="group">
                    <VoiceCard pin={pin} />
                    <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => upvoteMutation.mutate(pin.id)}>
                        👍 Endorse ({pin.upvoteCount || 0})
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-24 text-center">
                <div>
                  <MessageSquare className="w-14 h-14 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 font-medium">No producer voices yet</p>
                  <p className="text-xs text-slate-400 mt-2">Be the first to share what's happening on your operation</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* NIFA Grant Link */}
        <div className="mt-8 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-green-800 dark:text-green-300 mb-1">How Producer Voice feeds policy</p>
              <p className="text-sm text-green-700 dark:text-green-400">
                Aggregated producer challenges (never individual data) are cited in ThriveUp's USDA NIFA grant applications, NRCS Comment Periods, and FSA Farm Bill feedback submissions. Your anonymized voice becomes documented evidence for policy change.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
