import { useState, useRef, useEffect } from "react";
import { useRoute, useSearch, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JURISDICTIONS } from "@shared/nationwide/jurisdictions";
import {
  APPLY_PROGRAM_META, getApplyStages, type ApplyStage,
} from "@shared/benefits-apply-guides";
import {
  ChevronLeft, ExternalLink, MapPin, Phone, FileText, CheckCircle2,
  Loader2, MessageCircle, Send, Shield, Clock, Building2, AlertTriangle,
} from "lucide-react";

interface GuideResponse {
  program: string;
  meta: {
    name: string;
    description: string;
    docs: string[];
    annualValue: number;
    hasPhysicalOffices: boolean;
    officeSearch?: { categories: string[]; q: string };
    stateVariance?: string;
  };
  guide: {
    applicationUrl: string;
    documentsRequired?: string[];
    enrollmentType?: string;
    processingDays?: string;
    notes?: string;
    officeFinder?: string;
    hotline?: string;
  };
  stages: ApplyStage[];
  stateApplied: string | null;
}

interface ResourceResult {
  state: string;
  stateCode: string;
  category: string;
  subcategory: string;
  name: string;
  description: string;
  url: string;
  phone?: string;
  address?: string;
}

type ChatMsg = { role: "user" | "assistant"; content: string };

function ChatPanel({ program, programName, state }: { program: string; programName: string; state: string }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setError(null);
    setInput("");
    const nextMessages: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setSending(true);
    try {
      const res = await fetch("/api/benefits/how-to-apply/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ program, state, message: text, history: messages.slice(-8) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "The assistant is unavailable right now.");
      setMessages([...nextMessages, { role: "assistant", content: String(data.response || "") }]);
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card data-testid="apply-chat-panel">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" /> Ask About Your {programName} Application
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Mid-application and stuck? Describe what you're seeing or ask what a question means — answers stay
          focused on {programName}. This is informational guidance, not legal advice or an eligibility decision.
          Please don't type Social Security or account numbers here.
        </p>
        <div className="max-h-80 overflow-y-auto space-y-2 pr-1" data-testid="apply-chat-messages">
          {messages.length === 0 && (
            <div className="text-xs text-muted-foreground italic border rounded-md p-3 space-y-1">
              <p>Try asking:</p>
              <p>· "What does 'household income' include on this form?"</p>
              <p>· "What happens after I hit submit?"</p>
              <p>· "I don't have one of the documents — can I still apply?"</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`text-sm rounded-lg p-3 whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-primary/10 ml-8"
                  : "bg-muted mr-8"
              }`}
              data-testid={`apply-chat-msg-${m.role}-${i}`}
            >
              {m.content}
            </div>
          ))}
          {sending && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mr-8 p-3">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {error && (
          <p className="text-xs text-destructive flex items-center gap-1" role="alert" data-testid="apply-chat-error">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
          </p>
        )}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={`Ask anything about applying for ${programName}…`}
            maxLength={2000}
            data-testid="apply-chat-input"
          />
          <Button onClick={send} disabled={sending || !input.trim()} size="icon" data-testid="apply-chat-send">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BenefitsHowToApplyPage() {
  const [, params] = useRoute("/benefits/how-to-apply/:program");
  const search = useSearch();
  const program = params?.program || "";
  const meta = APPLY_PROGRAM_META[program];

  const initialState = (() => {
    const s = new URLSearchParams(search).get("state") || "";
    return /^[A-Za-z]{2}$/.test(s) ? s.toUpperCase() : "TX";
  })();
  const [state, setState] = useState(initialState);

  const { data: guideData, isLoading, isError } = useQuery<GuideResponse>({
    queryKey: ["/api/benefits/how-to-apply", program, state],
    queryFn: async () => {
      const res = await fetch(`/api/benefits/how-to-apply/${encodeURIComponent(program)}?state=${state}`);
      if (!res.ok) throw new Error("Failed to load guide");
      return res.json();
    },
    enabled: !!meta,
    staleTime: 10 * 60 * 1000,
  });

  // Local offices via the existing resource-finder search infrastructure.
  const officeSearch = meta?.officeSearch;
  const { data: offices } = useQuery<ResourceResult[]>({
    queryKey: ["/api/resources/search", state, officeSearch?.categories?.join(","), officeSearch?.q],
    queryFn: async () => {
      const params = new URLSearchParams({
        state,
        categories: officeSearch!.categories.join(","),
        q: officeSearch!.q,
      });
      const res = await fetch(`/api/resources/search?${params}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!meta?.hasPhysicalOffices && !!officeSearch,
    staleTime: 10 * 60 * 1000,
  });
  const localOffices = (offices || []).filter((o) => o.phone || o.address).slice(0, 5);

  if (!meta) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4" data-testid="apply-unknown-program">
        <p className="text-muted-foreground">We don't have an application guide for "{program}".</p>
        <Link href="/benefits-screener">
          <Button variant="outline"><ChevronLeft className="h-4 w-4 mr-1" /> Back to Benefits Screener</Button>
        </Link>
      </div>
    );
  }

  const guide = guideData?.guide;
  const stages = guideData?.stages || getApplyStages(program);
  const docs = guide?.documentsRequired?.length ? guide.documentsRequired : meta.docs;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-background" data-testid={`how-to-apply-${program}`}>
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4">
        <Link href="/benefits-screener" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" data-testid="link-back-screener">
          <ChevronLeft className="h-4 w-4" /> Back to Benefits Screener
        </Link>

        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold" data-testid="apply-title">How to Apply: {meta.name}</h1>
          <p className="text-sm text-muted-foreground">{meta.description}</p>
          <Badge variant="secondary">Worth roughly ${meta.annualValue.toLocaleString()}/year</Badge>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground shrink-0">Your state:</span>
          <Select value={state} onValueChange={setState}>
            <SelectTrigger className="w-56" data-testid="apply-state-select"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">
              {JURISDICTIONS.map((j) => (
                <SelectItem key={j.code} value={j.code}>{j.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {meta.stateVariance && (
          <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-900 dark:text-amber-100 flex items-start gap-2" data-testid="apply-state-variance">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{meta.stateVariance}</span>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your state's application details…
          </div>
        )}
        {isError && (
          <p className="text-sm text-destructive" role="alert">Couldn't load application details. Please refresh the page.</p>
        )}

        {guide && (
          <Card data-testid="apply-official-links">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ExternalLink className="h-5 w-5" /> Where to Apply</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {guide.enrollmentType && <p className="text-sm"><strong>When:</strong> {guide.enrollmentType}</p>}
              {guide.processingDays && (
                <p className="text-sm flex items-start gap-1.5">
                  <Clock className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                  <span><strong>Processing time:</strong> {guide.processingDays}</span>
                </p>
              )}
              {guide.notes && <p className="text-sm text-muted-foreground italic">{guide.notes}</p>}
              <div className="flex flex-wrap gap-2">
                <Button asChild data-testid="apply-official-link">
                  <a href={guide.applicationUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1.5" /> Official Application Site
                  </a>
                </Button>
                {guide.officeFinder && (
                  <Button variant="outline" asChild data-testid="apply-office-finder">
                    <a href={guide.officeFinder} target="_blank" rel="noopener noreferrer">
                      <MapPin className="h-4 w-4 mr-1.5" /> Find Your Local Office
                    </a>
                  </Button>
                )}
                {guide.hotline && (
                  <Button variant="outline" asChild data-testid="apply-hotline">
                    <a href={`tel:${guide.hotline.replace(/[^\d+]/g, "")}`}>
                      <Phone className="h-4 w-4 mr-1.5" /> Call {guide.hotline}
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {meta.hasPhysicalOffices && localOffices.length > 0 && (
          <Card data-testid="apply-local-offices">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5" /> Local Help Near You</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {localOffices.map((o) => (
                <div key={o.name} className="border rounded-lg p-3 space-y-1" data-testid={`apply-office-${o.name.replace(/\s+/g, "-").toLowerCase()}`}>
                  <p className="font-medium text-sm">{o.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{o.description}</p>
                  {o.address && (
                    <p className="text-xs flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0" /> {o.address}</p>
                  )}
                  <div className="flex gap-2 pt-1">
                    {o.phone && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`tel:${o.phone.replace(/[^\d+]/g, "")}`}><Phone className="h-3 w-3 mr-1" /> {o.phone}</a>
                      </Button>
                    )}
                    {o.url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={o.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1" /> Website</a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card data-testid="apply-doc-checklist">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5" /> Document Checklist</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {docs.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" /> {d}
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-3">
              Missing something? Apply anyway — most programs let you submit remaining documents afterward, and a navigator can help you track them down.
            </p>
          </CardContent>
        </Card>

        <Card data-testid="apply-stages">
          <CardHeader><CardTitle className="text-lg">What to Expect, Step by Step</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {stages.map((s, i) => (
              <div key={s.title} className="flex items-start gap-3 p-3 border rounded-lg" data-testid={`apply-stage-${i + 1}`}>
                <Badge className="shrink-0 mt-0.5">{i + 1}</Badge>
                <div>
                  <p className="font-medium text-sm">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <ChatPanel program={program} programName={meta.name} state={state} />

        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/20 p-3 text-xs text-muted-foreground flex items-start gap-2 mb-8" data-testid="apply-disclaimer">
          <Shield className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            This guide is informational only — final eligibility and benefit amounts are decided by the program agency.
            Details like URLs, hotlines, and deadlines can change; always trust the official site if it differs from what you see here.
          </span>
        </div>
      </div>
    </div>
  );
}
