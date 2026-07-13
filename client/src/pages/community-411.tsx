import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import {
  Search, MapPin, Phone, ExternalLink, ChevronRight,
  MessageCircle, Briefcase, Home, Apple, Heart, Scale,
  GraduationCap, Baby, Zap, AlertTriangle, Users,
  Bot, ArrowRight, Globe, Loader2, RefreshCw, X,
  Building2, HandHeart, Stethoscope, Brain, Shield,
  Info, Star, Clock, PhoneCall, CheckCircle2, ChevronDown,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface ServiceCategory {
  id: string;
  label: string;
  icon: any;
  color: string;
  bg: string;
  description: string;
  links: { label: string; href: string; internal?: boolean }[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface NeighborhoodData {
  zipCode: string;
  neighborhoodName: string;
  countyName: string;
  stateName: string;
  population?: number;
  medianHouseholdIncome?: number;
  povertyRate?: number;
  unemploymentRate?: number;
  snapParticipationRate?: number;
  whatGoingWell?: string[];
  needsAttention?: string[];
}

type Mode = "resident" | "navigator";

// ── Service categories ────────────────────────────────────────────────────────

const CATEGORIES: ServiceCategory[] = [
  {
    id: "benefits",
    label: "Benefits & Financial Help",
    icon: Shield,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    description: "SNAP, Medicaid, TANF, WIC, EITC, utility help",
    links: [
      { label: "Benefits Screener", href: "/benefits-screener", internal: true },
      { label: "YourTexasBenefits.com", href: "https://www.yourtexasbenefits.com" },
      { label: "Benefits Intelligence", href: "/benefits", internal: true },
    ],
  },
  {
    id: "housing",
    label: "Housing & Shelter",
    icon: Home,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    description: "Emergency shelter, rent help, affordable housing",
    links: [
      { label: "LifeBridge Housing", href: "/lifebridge", internal: true },
      { label: "Texas 2-1-1 Housing", href: "https://www.211texas.org" },
      { label: "Safe Passage", href: "/safe-passage", internal: true },
    ],
  },
  {
    id: "jobs",
    label: "Jobs & Training",
    icon: Briefcase,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/20",
    description: "Job board, trade sims, workforce programs",
    links: [
      { label: "Job Board", href: "/jobs", internal: true },
      { label: "Trade Simulations", href: "/trade-sims", internal: true },
      { label: "Workforce Programs", href: "/workforce", internal: true },
    ],
  },
  {
    id: "health",
    label: "Health & Mental Health",
    icon: Heart,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/20",
    description: "Clinics, mental health, substance use, screenings",
    links: [
      { label: "Health Screening", href: "/clinical-screening", internal: true },
      { label: "988 Lifeline", href: "https://988lifeline.org" },
      { label: "Texas 2-1-1 Health", href: "https://www.211texas.org" },
    ],
  },
  {
    id: "food",
    label: "Food & Basic Needs",
    icon: Apple,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-950/20",
    description: "Food pantries, SNAP, WIC, school meals",
    links: [
      { label: "Find Food Banks", href: "https://www.feedingamerica.org/find-your-local-foodbank" },
      { label: "SNAP Application", href: "https://www.yourtexasbenefits.com" },
      { label: "No Kid Hungry", href: "https://www.nokidhungry.org" },
    ],
  },
  {
    id: "education",
    label: "Education & College",
    icon: GraduationCap,
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-950/20",
    description: "GED, college access, FAFSA, tutoring",
    links: [
      { label: "College Access AI", href: "/college-access", internal: true },
      { label: "FAFSA Navigator", href: "/fafsa-navigator", internal: true },
      { label: "Adult Education", href: "/workforce", internal: true },
    ],
  },
  {
    id: "legal",
    label: "Legal & Rights",
    icon: Scale,
    color: "text-slate-600",
    bg: "bg-slate-50 dark:bg-slate-950/20",
    description: "Immigration, DV, tenant rights, record clearing",
    links: [
      { label: "Legal Navigator", href: "/safe-passage/legal-navigator", internal: true },
      { label: "Texas Law Help", href: "https://texaslawhelp.org" },
      { label: "Legal Aid Texas", href: "https://www.lonestarlegal.org" },
    ],
  },
  {
    id: "children",
    label: "Children & Families",
    icon: Baby,
    color: "text-pink-600",
    bg: "bg-pink-50 dark:bg-pink-950/20",
    description: "Child care, foster support, parenting, WIC",
    links: [
      { label: "Foster Youth Hub", href: "/foster-youth", internal: true },
      { label: "Child Care Resources", href: "/get-help", internal: true },
      { label: "WIC Program", href: "https://www.texaswic.org" },
    ],
  },
];

const CRISIS_LINES = [
  { label: "Emergency", number: "911", color: "bg-red-600" },
  { label: "2-1-1 Texas", number: "211", color: "bg-blue-600" },
  { label: "988 Crisis", number: "988", color: "bg-purple-600" },
  { label: "DV Hotline", number: "1-800-799-7233", color: "bg-orange-600" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function statBadge(label: string, value: string | number | undefined) {
  if (value == null) return null;
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Community411Page() {
  const [mode, setMode] = useState<Mode>("resident");
  const [zip, setZip] = useState("");
  const [zipInput, setZipInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId] = useState(() => `c411-${Date.now()}`);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // neighborhood context
  const neighborhoodQuery = useQuery<NeighborhoodData>({
    queryKey: ["/api/neighborhood/lookup", zip],
    enabled: !!zip && /^\d{5}$/.test(zip),
    retry: 1,
  });

  // resource search
  const [resourceQuery, setResourceQuery] = useState("");
  const resourceSearchQuery = useQuery<any[]>({
    queryKey: ["/api/resources/search", resourceQuery, selectedCategory],
    enabled: resourceQuery.length > 2 || !!selectedCategory,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (resourceQuery) params.set("q", resourceQuery);
      if (selectedCategory) params.set("categories", selectedCategory);
      const resp = await fetch(`/api/resources/search?${params.toString()}`);
      if (!resp.ok) return [];
      return resp.json();
    },
    retry: 1,
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft("");
    setSending(true);
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);

    // Prepend zip context if we have it
    const zipPrefix = zip
      ? `[User ZIP: ${zip}${neighborhoodQuery.data ? `, ${neighborhoodQuery.data.countyName}, ${neighborhoodQuery.data.stateName}` : ""}]\n\n`
      : "";

    try {
      const resp = await apiRequest("POST", "/api/navigator/chat", {
        message: zipPrefix + text,
        conversationId,
        responseMode: mode === "navigator" ? "detailed" : "brief",
      });
      const data = await resp.json();
      const reply = data.response || data.message || "I'm here to help — can you tell me a bit more about your situation?";
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Something went wrong reaching the AI. Please try again in a moment." }]);
    } finally {
      setSending(false);
    }
  };

  const handleZipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = zipInput.replace(/\D/g, "").slice(0, 5);
    if (cleaned.length === 5) setZip(cleaned);
  };

  const nd = neighborhoodQuery.data;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background border-b">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Community 411
              </h1>
              <p className="mt-1 text-muted-foreground max-w-xl">
                One front door for services, benefits, jobs, housing, health, and more —
                for anyone in your community, anywhere in the country.
              </p>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2 rounded-lg border p-1 bg-muted/40 shrink-0">
              <Button
                size="sm"
                variant={mode === "resident" ? "default" : "ghost"}
                onClick={() => setMode("resident")}
                data-testid="button-mode-resident"
              >
                <Users className="h-4 w-4 mr-1" /> I Need Help
              </Button>
              <Button
                size="sm"
                variant={mode === "navigator" ? "default" : "ghost"}
                onClick={() => setMode("navigator")}
                data-testid="button-mode-navigator"
              >
                <Stethoscope className="h-4 w-4 mr-1" /> Navigator / Staff
              </Button>
            </div>
          </div>

          {/* Crisis strip */}
          <div className="mt-6 flex flex-wrap gap-2">
            {CRISIS_LINES.map(c => (
              <div
                key={c.label}
                className={`${c.color} text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5`}
                data-testid={`badge-crisis-${c.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <PhoneCall className="h-3 w-3" />
                {c.label}: <span className="font-bold">{c.number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">

        {/* ── ZIP + neighborhood context ───────────────────────────────── */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleZipSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Enter your ZIP code to see local resources"
                  value={zipInput}
                  onChange={e => setZipInput(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  data-testid="input-zip"
                  maxLength={5}
                />
              </div>
              <Button type="submit" data-testid="button-zip-submit">
                <Search className="h-4 w-4 mr-1" /> Look Up
              </Button>
              {zip && (
                <Button variant="ghost" size="icon" onClick={() => { setZip(""); setZipInput(""); }} data-testid="button-zip-clear">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </form>

            {neighborhoodQuery.isLoading && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading community data…
              </div>
            )}

            {nd && (
              <div className="mt-4 rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">
                    {nd.neighborhoodName} — {nd.countyName}, {nd.stateName}
                  </span>
                  <Badge variant="outline" className="text-xs">{nd.zipCode}</Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                  {statBadge("Population", nd.population?.toLocaleString())}
                  {statBadge("Median Income", nd.medianHouseholdIncome ? `$${nd.medianHouseholdIncome.toLocaleString()}` : undefined)}
                  {statBadge("Poverty Rate", nd.povertyRate != null ? `${nd.povertyRate}%` : undefined)}
                  {statBadge("Unemployment", nd.unemploymentRate != null ? `${nd.unemploymentRate}%` : undefined)}
                </div>

                {mode === "navigator" && nd.needsAttention && nd.needsAttention.length > 0 && (
                  <div className="pt-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Needs Attention</p>
                    <div className="flex flex-wrap gap-1">
                      {nd.needsAttention.map(n => (
                        <Badge key={n} variant="outline" className="text-xs border-amber-400 text-amber-700 dark:text-amber-400">{n}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {nd.whatGoingWell && nd.whatGoingWell.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Strengths</p>
                    <div className="flex flex-wrap gap-1">
                      {nd.whatGoingWell.map(w => (
                        <Badge key={w} variant="outline" className="text-xs border-green-400 text-green-700 dark:text-green-400">{w}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Ask the AI ────────────────────────────────────────────────── */}
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-5 w-5 text-primary" />
              {mode === "resident" ? "Ask — I'll find what you need" : "AI Resource Navigator"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!chatOpen ? (
              <div
                className="flex items-center gap-3 rounded-lg border border-dashed p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => { setChatOpen(true); setMessages([]); }}
                data-testid="button-open-chat"
              >
                <MessageCircle className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {mode === "resident"
                      ? '"I need help with rent." "Where can I find food?" "I lost my job."'
                      : '"Show me housing resources for a family of 4 with LEP needs in 78653."'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Type anything — the AI navigates across all 15 service platforms.
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Chat history */}
                <div className="rounded-lg border bg-muted/20 p-3 space-y-3 max-h-80 overflow-y-auto">
                  {messages.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {mode === "resident"
                        ? "Tell me what you need help with — in your own words."
                        : "Describe the client's situation or the resources you're looking for."}
                    </p>
                  )}
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                      data-testid={`message-${m.role}-${i}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-background border text-foreground"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {sending && (
                    <div className="flex justify-start">
                      <div className="bg-background border rounded-lg px-3 py-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" /> Finding resources…
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <Textarea
                    className="resize-none text-sm min-h-[44px] max-h-[120px]"
                    placeholder={mode === "resident" ? "What do you need help with?" : "Describe the client's needs…"}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    data-testid="input-chat"
                  />
                  <div className="flex flex-col gap-1">
                    <Button size="sm" onClick={sendMessage} disabled={sending || !draft.trim()} data-testid="button-send-chat">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setChatOpen(false); setMessages([]); }} data-testid="button-close-chat">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Service categories ────────────────────────────────────────── */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-foreground">Browse by Need</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(active ? null : cat.id)}
                  className={`rounded-xl border p-4 text-left transition-all hover:shadow-sm ${
                    active
                      ? "border-primary ring-2 ring-primary/20 " + cat.bg
                      : "hover:border-primary/40 " + cat.bg
                  }`}
                  data-testid={`button-category-${cat.id}`}
                >
                  <Icon className={`h-5 w-5 mb-2 ${cat.color}`} />
                  <p className="text-sm font-semibold text-foreground leading-tight">{cat.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-tight">{cat.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Selected category services ────────────────────────────────── */}
        {selectedCategory && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {(() => {
                  const cat = CATEGORIES.find(c => c.id === selectedCategory)!;
                  const Icon = cat.icon;
                  return (
                    <>
                      <Icon className={`h-5 w-5 ${cat.color}`} />
                      {cat.label}
                      <Button variant="ghost" size="sm" className="ml-auto h-6 px-2 text-xs" onClick={() => setSelectedCategory(null)} data-testid="button-category-close">
                        <X className="h-3 w-3 mr-1" /> Close
                      </Button>
                    </>
                  );
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {CATEGORIES.find(c => c.id === selectedCategory)?.links.map(link => (
                  link.internal ? (
                    <a
                      key={link.label}
                      href={link.href}
                      className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/40 transition-colors"
                      data-testid={`link-service-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium text-foreground">{link.label}</span>
                      <Badge variant="outline" className="ml-auto text-xs">ThriveUp</Badge>
                    </a>
                  ) : (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/40 transition-colors"
                      data-testid={`link-service-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-foreground">{link.label}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                    </a>
                  )
                ))}
              </div>

              {/* Quick AI assist for this category */}
              <Button
                className="mt-4 w-full"
                variant="outline"
                onClick={() => {
                  const cat = CATEGORIES.find(c => c.id === selectedCategory)!;
                  setChatOpen(true);
                  setDraft(`I need help with ${cat.label.toLowerCase()}${zip ? ` in ZIP ${zip}` : ""}.`);
                }}
                data-testid="button-category-ask-ai"
              >
                <Bot className="h-4 w-4 mr-2" /> Ask AI for personalized help
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Resource search ───────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" /> Search Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder={'Search by keyword — e.g. "food pantry", "GED", "housing"'}
              value={resourceQuery}
              onChange={e => setResourceQuery(e.target.value)}
              data-testid="input-resource-search"
            />

            {resourceSearchQuery.isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Searching…
              </div>
            )}

            {resourceSearchQuery.data && resourceSearchQuery.data.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {resourceSearchQuery.data.slice(0, 20).map((r: any, i: number) => (
                  <div
                    key={r.id || i}
                    className="rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                    data-testid={`card-resource-${i}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{r.name || r.title}</p>
                        {r.organization && <p className="text-xs text-muted-foreground">{r.organization}</p>}
                        {r.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {r.category && <Badge variant="outline" className="text-xs">{r.category}</Badge>}
                          {r.state && <Badge variant="outline" className="text-xs">{r.state}</Badge>}
                        </div>
                      </div>
                      {(r.website || r.url) && (
                        <a
                          href={r.website || r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0"
                          data-testid={`link-resource-${i}`}
                        >
                          <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {resourceSearchQuery.data && resourceSearchQuery.data.length === 0 && resourceQuery.length > 2 && (
              <p className="text-sm text-muted-foreground py-2">
                No results for "{resourceQuery}". Try different keywords or use the AI navigator above.
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── Navigator-only: ecosystem quick links ────────────────────── */}
        {mode === "navigator" && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" /> Navigator Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-2">
                {[
                  { label: "Benefits Intelligence Dashboard", href: "/benefits", icon: Shield },
                  { label: "Household Profile", href: "/household-profile", icon: Users },
                  { label: "CHW Network", href: "/benefits", icon: HandHeart },
                  { label: "Equity Dashboard", href: "/equity-dashboard", icon: Globe },
                  { label: "Community Impact", href: "/community-impact", icon: Zap },
                  { label: "Partner Scorecard", href: "/partner-scorecard", icon: Star },
                  { label: "Safe Passage", href: "/safe-passage", icon: AlertTriangle },
                  { label: "My Appointments", href: "/my-appointments", icon: Clock },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-2 rounded-lg border bg-background p-3 text-sm font-medium hover:bg-muted/40 transition-colors"
                      data-testid={`link-nav-tool-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      {item.label}
                      <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto" />
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
