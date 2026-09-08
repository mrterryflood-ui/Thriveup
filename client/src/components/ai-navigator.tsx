import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { safeGetRaw, safeSetRaw, safeRemove } from "@/lib/safe-storage";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Compass,
  Send,
  X,
  MessageSquarePlus,
  Trash2,
  ChevronLeft,
  Loader2,
  Sparkles,
  Phone,
  ExternalLink,
  AlertTriangle,
  History,
  Minimize2,
  Maximize2,
  Bot,
  User,
  Brain,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Copy,
  Download,
  Check,
  FileText,
  Expand,
  Lightbulb,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// DIS Condition 3 — Navigator AI disclosure
import { NavigatorDisclosure } from "@/components/ai-augmentation-disclosure";

interface HuntGrant {
  id: string;
  title: string;
  agency: string;
  fitScore?: number;
  reason?: string;
  closeDate?: string;
  cfdaList?: string[];
  sourceUrl: string;
  matchedQuery?: string;
  synopsis?: string;
}

interface NavigatorMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  deepThinking?: string;
  deepThinkingPending?: boolean;
  grantResults?: HuntGrant[];
  grantOrgName?: string;
  totalFound?: number;
  gunViolenceContext?: {
    geography?: string | null;
    state?: string | null;
  } | null;
}

interface NavigatorConversation {
  id: string;
  title: string;
  summary?: string;
  identifiedNeeds?: string[];
  lastMessageAt?: string;
  createdAt?: string;
}

interface AttachedDoc {
  name: string;
  text: string;
  type: "pdf" | "text";
  originalSize: number; // total chars before slicing
}

interface DeepThinkPolling {
  requestId: number;
  assistantIdx: number;
  pollTimer: ReturnType<typeof setInterval> | null;
  elapsedTimer: ReturnType<typeof setInterval> | null;
  abortController: AbortController;
}

const QUICK_PROMPTS = [
  { label: "I need housing help", icon: "🏠" },
  { label: "Help me find a job", icon: "💼" },
  { label: "I need food assistance", icon: "🍎" },
  { label: "Healthcare resources", icon: "🏥" },
  { label: "Legal help", icon: "⚖️" },
  { label: "Education programs", icon: "🎓" },
];

const PLATFORM_ACTIONS: Array<{
  label: string;
  icon: string;
  message?: string;
  href?: string;
}> = [
  {
    label: "Benefits check",
    icon: "🧾",
    message:
      "Run a full benefits screening. Check all 9 programs — SNAP, Medicaid, CHIP, WIC, Marketplace, EITC, CTC, SSI, SSDI — and tell me what I may qualify for.",
  },
  {
    label: "Find grants",
    icon: "💰",
    message:
      "Find grant opportunities that match our organization. We are a community development nonprofit focused on workforce training, benefits navigation, and reentry services in Central Texas.",
  },
  { label: "Trade Sims", icon: "🔧", href: "/academy/trade-sims" },
  { label: "Workforce Pell", icon: "🎓", href: "/workforce-pell" },
  { label: "MOS Translator", icon: "🎖️", href: "/mos-translator" },
  {
    label: "Career path",
    icon: "🗺️",
    message:
      "Help me build a personalized career pathway plan. I want to understand which TCAF programs lead to in-demand jobs and how to stack credentials.",
  },
  {
    label: "WIOA + Pell",
    icon: "📋",
    message:
      "Explain how to stack a Workforce Pell Grant with WIOA funding. What does each program cover, and what are the step-by-step enrollment steps?",
  },
  {
    label: "Housing + food",
    icon: "🏠",
    message:
      "I need help with housing and food security. Connect me to LifeBridge resources near me — emergency rental assistance, food pantries, utility help, and SNAP enrollment.",
  },
  {
    label: "Health resources",
    icon: "❤️",
    message:
      "Help me access health resources through Sankofa Health and Whole-Person Health. I may need behavioral health support, maternal health info, or a community health worker connection.",
  },
  {
    label: "Reentry support",
    icon: "🔓",
    message:
      "I need reentry support after incarceration. Help me find housing, employment, expungement assistance, and benefits I qualify for — and route me to the right TCAF platform.",
  },
  {
    label: "Veteran services",
    icon: "🇺🇸",
    message:
      "I'm a veteran. Help me translate my military experience to civilian credentials, find WIOA and VA benefits I qualify for, and connect to M2C transition support.",
  },
  { label: "Equity Dashboard", icon: "📊", href: "/equity-dashboard" },
  {
    label: "Resources near me",
    icon: "📍",
    message:
      "What community resources are available near me? I'm looking for food, housing, childcare, transportation, and employment support.",
  },
  { label: "My progress", icon: "🏆", href: "/academy/progress-report" },
];

const NEED_COLORS: Record<string, string> = {
  housing: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  food: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  healthcare: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  employment: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  education:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  legal:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  financial:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  transportation:
    "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
  "substance-abuse":
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  childcare: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
};

function formatMessageContent(content: string) {
  const parts = content.split(/(\n)/);
  return parts.map((part, i) => {
    if (part === "\n") return <br key={i} />;

    if (part.startsWith("- ") || part.startsWith("• ")) {
      return (
        <div key={i} className="flex gap-2 ml-2 my-0.5">
          <span className="text-primary mt-0.5">•</span>
          <span>{renderInlineContent(part.substring(2))}</span>
        </div>
      );
    }

    if (/^\d+\.\s/.test(part)) {
      return (
        <div key={i} className="flex gap-2 ml-2 my-0.5">
          <span className="font-medium text-primary">
            {part.match(/^\d+/)?.[0]}.
          </span>
          <span>{renderInlineContent(part.replace(/^\d+\.\s/, ""))}</span>
        </div>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="block mt-2 mb-1">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={i}>{renderInlineContent(part)}</span>;
  });
}

function renderInlineContent(text: string) {
  const boldRegex = /\*\*(.*?)\*\*/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(<strong key={match.index}>{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <>{parts}</>;
}

function GrantResultCards({
  grants,
  orgName,
  totalFound,
  isAuthenticated,
}: {
  grants: HuntGrant[];
  orgName: string;
  totalFound: number;
  isAuthenticated: boolean;
}) {
  const { toast } = useToast();
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Set<string>>(new Set());

  const saveToPipeline = async (g: HuntGrant) => {
    if (!isAuthenticated) {
      toast({ title: "Sign in to save grants", variant: "destructive" });
      return;
    }
    setSaving((prev) => new Set([...prev, g.id]));
    try {
      const res = await fetch("/api/grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: g.title,
          agency: g.agency,
          description: g.synopsis || g.reason || "",
          sourceUrl: g.sourceUrl,
          entityName: orgName,
          source: "ai-hunt",
          fitScore: g.fitScore,
          cfda: g.cfdaList?.[0] || null,
          deadline: g.closeDate ? new Date(g.closeDate).toISOString() : null,
          status: "identified",
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved((prev) => new Set([...prev, g.id]));
      queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grants/stats"] });
      toast({
        title: "Added to pipeline",
        description: `"${g.title}" saved under ${orgName}`,
      });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving((prev) => {
        const n = new Set(prev);
        n.delete(g.id);
        return n;
      });
    }
  };

  const saveAll = async () => {
    const unsaved = grants.filter((g) => !saved.has(g.id));
    for (const g of unsaved) await saveToPipeline(g);
  };

  return (
    <div
      className="ml-11 mt-3 space-y-2"
      data-testid="grant-hunt-results-cards"
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">
          ⚡ {totalFound} grants found on Grants.gov · top {grants.length}{" "}
          ranked for <span className="italic">{orgName}</span>
        </p>
        {isAuthenticated && saved.size < grants.length && (
          <button
            onClick={saveAll}
            className="text-[10px] px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 hover:bg-violet-200 font-medium transition-colors"
            data-testid="button-save-all-grants"
          >
            Save all to pipeline
          </button>
        )}
      </div>
      {grants.map((g, i) => (
        <div
          key={g.id}
          className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/40 dark:bg-violet-950/20 px-3 py-2 flex items-start gap-3"
          data-testid={`grant-card-${i}`}
        >
          <div className="shrink-0 text-center min-w-[36px]">
            <div
              className={`text-sm font-bold ${(g.fitScore || 0) >= 70 ? "text-emerald-600" : (g.fitScore || 0) >= 50 ? "text-amber-600" : "text-slate-500"}`}
            >
              {g.fitScore ?? "?"}%
            </div>
            <div className="text-[9px] text-muted-foreground">fit</div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold leading-tight truncate">
              {g.title}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {g.agency}
              {g.closeDate
                ? ` · Due ${new Date(g.closeDate).toLocaleDateString()}`
                : ""}
              {g.cfdaList?.length ? ` · CFDA ${g.cfdaList[0]}` : ""}
            </p>
            {g.reason && (
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 italic">
                {g.reason}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <a
              href={g.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded hover:bg-violet-100 dark:hover:bg-violet-900 text-muted-foreground hover:text-violet-700"
              title="View on Grants.gov"
              data-testid={`link-grant-${i}`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            {isAuthenticated && (
              <button
                onClick={() => saveToPipeline(g)}
                disabled={saved.has(g.id) || saving.has(g.id)}
                className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors ${saved.has(g.id) ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" : "bg-violet-600 text-white hover:bg-violet-700"}`}
                data-testid={`button-save-grant-${i}`}
              >
                {saved.has(g.id) ? (
                  <Check className="h-3 w-3" />
                ) : saving.has(g.id) ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
                {saved.has(g.id) ? "Saved" : "Pipeline"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Youth Mode storage ownership ─────────────────────────────────────────────
// Two Navigator instances can mount at once: the /navigator page and the
// globally-mounted floating bubble. Only ONE of them may passively sync the
// learner profile into the tcaf_youth_mode localStorage key, otherwise the
// hidden bubble can overwrite the value the page just restored from a youth
// conversation. Page mode always wins ownership over the bubble.
const mountedNavigators: { id: symbol; mode: "bubble" | "page" }[] = [];
function youthModeStorageOwner(): symbol | null {
  const page = mountedNavigators.find((n) => n.mode === "page");
  return (page ?? mountedNavigators[0])?.id ?? null;
}

export function AINavigator({
  mode = "bubble",
}: { mode?: "bubble" | "page" } = {}) {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(mode === "page");
  const [isExpanded, setIsExpanded] = useState(false);
  const [view, setView] = useState<"chat" | "history">("chat");
  const [messages, setMessages] = useState<NavigatorMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [deepThinkingExpanded, setDeepThinkingExpanded] = useState<
    Record<number, boolean>
  >({});
  const [attachedDocs, setAttachedDocs] = useState<AttachedDoc[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [savedIdx, setSavedIdx] = useState<number | null>(null);
  const [responseMode, setResponseMode] = useState<
    "brief" | "detailed" | "report"
  >("detailed");
  const [youthMode, setYouthMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("tcaf_youth_mode") === "true";
    } catch {
      return false;
    }
  });
  // R1 background polling state
  const [deepThinkElapsed, setDeepThinkElapsed] = useState(0);
  const deepThinkPollingRef = useRef<DeepThinkPolling | null>(null);
  const requestAbortRef = useRef<AbortController | null>(null);
  const requestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigatorRequestIdRef = useRef(0);
  const submittedDraftRef = useRef<{
    message: string;
    attachments: AttachedDoc[];
  } | null>(null);
  const mountedRef = useRef(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Prevents auto-resume from immediately reloading the last convo after user clicks New
  const userStartedNewRef = useRef(false);

  const { data: conversations, isError: conversationsError, refetch: refetchConversations } = useQuery<
    NavigatorConversation[]
  >({
    queryKey: ["/api/navigator/conversations"],
    enabled: isAuthenticated && !authLoading && (isOpen || mode === "page"),
  });

  useEffect(() => {
    if (conversationsError) {
      toast({
        title: "Conversation history unavailable",
        description: "Your current chat is still available. Try refreshing history shortly.",
        variant: "destructive",
      });
    }
  }, [conversationsError, toast]);

  // ── Youth Mode persistence ──────────────────────────────────────────────────
  // Fetch the server-side preference for signed-in users
  const { data: learnerProfile } = useQuery<{ youthMode?: boolean }>({
    queryKey: ["/api/learner-profile"],
    enabled: isAuthenticated && !authLoading,
    staleTime: 5 * 60 * 1000,
  });

  // Tracks whether the user has toggled youth mode locally this session.
  // When true, incoming GET responses must NOT overwrite the user's local choice.
  const youthModeUserEditedRef = useRef(false);

  // Debounce timer — cancelled on unmount and auth changes
  const youthModeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Always holds the latest intended value so the debounced write uses final intent
  const youthModeLatestRef = useRef<boolean>(youthMode);

  // Register this instance for Youth Mode storage ownership (page mode wins)
  const instanceIdRef = useRef<symbol>(Symbol("ai-navigator"));
  useEffect(() => {
    const entry = { id: instanceIdRef.current, mode };
    mountedNavigators.push(entry);
    return () => {
      const idx = mountedNavigators.indexOf(entry);
      if (idx !== -1) mountedNavigators.splice(idx, 1);
    };
  }, [mode]);

  // Sync from server — only applies before the user makes any local edit
  useEffect(() => {
    if (!isAuthenticated || learnerProfile === undefined) return;
    if (youthModeUserEditedRef.current) return; // user already toggled — don't overwrite
    const serverValue = learnerProfile.youthMode ?? false;
    setYouthMode(serverValue);
    youthModeLatestRef.current = serverValue;
    // Only the owning instance may passively write localStorage — a hidden
    // bubble must never stomp the value the /navigator page just restored.
    if (youthModeStorageOwner() === instanceIdRef.current) {
      try {
        localStorage.setItem("tcaf_youth_mode", String(serverValue));
      } catch {
        /* storage blocked */
      }
    }
  }, [isAuthenticated, learnerProfile]);

  // Cancel any pending write on unmount (component removed from tree)
  useEffect(() => {
    return () => {
      if (youthModeDebounceRef.current)
        clearTimeout(youthModeDebounceRef.current);
    };
  }, []);

  const stopDeepThinkPolling = useCallback(
    (requestId?: number, clearPending = true) => {
      const polling = deepThinkPollingRef.current;
      if (!polling || (requestId !== undefined && polling.requestId !== requestId))
        return;
      if (polling.pollTimer) clearInterval(polling.pollTimer);
      if (polling.elapsedTimer) clearInterval(polling.elapsedTimer);
      polling.abortController.abort();
      deepThinkPollingRef.current = null;
      if (mountedRef.current) setDeepThinkElapsed(0);
      if (clearPending && mountedRef.current) {
        setMessages((prev) => {
          const updated = [...prev];
          if (updated[polling.assistantIdx]) {
            updated[polling.assistantIdx] = {
              ...updated[polling.assistantIdx],
              deepThinkingPending: false,
            };
          }
          return updated;
        });
      }
    },
    [],
  );

  // A stream can remain transport-active indefinitely (for example, through
  // proxy keepalives), so cleanup is governed by an absolute wall clock.
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current);
      requestAbortRef.current?.abort();
      stopDeepThinkPolling(undefined, false);
    };
  }, [stopDeepThinkPolling]);

  // Cancel pending write and reset edit flag whenever auth identity changes
  // (sign-out, account switch) so a queued write can't bleed into a new session.
  useEffect(() => {
    if (youthModeDebounceRef.current)
      clearTimeout(youthModeDebounceRef.current);
    youthModeUserEditedRef.current = false;
  }, [user?.id]); // keyed on user identity, not just isAuthenticated boolean

  // Toggle handler: instant UI + localStorage; debounced, session-bound server write
  const handleYouthModeToggle = useCallback(
    (next: boolean) => {
      // 1. Mark locally edited so the GET response can't undo this choice
      youthModeUserEditedRef.current = true;

      // 2. Update UI and localStorage immediately for responsiveness
      setYouthMode(next);
      youthModeLatestRef.current = next;
      try {
        localStorage.setItem("tcaf_youth_mode", String(next));
      } catch {
        /* storage blocked */
      }

      if (!isAuthenticated) return;

      // 3. Optimistically update query cache
      queryClient.setQueryData(["/api/learner-profile"], (old: any) => ({
        ...old,
        youthMode: next,
      }));

      // 4. Debounce: absorb rapid toggles; only the final value is sent to the server
      if (youthModeDebounceRef.current)
        clearTimeout(youthModeDebounceRef.current);

      // Capture the session owner at toggle time to detect account switches before the write fires
      const sessionUserId = user?.id;

      youthModeDebounceRef.current = setTimeout(async () => {
        // Bail if auth identity changed since toggle was queued.
        // Note: sessionUserId may be undefined during initial auth load even when
        // isAuthenticated is true — the useEffect above already cancels pending
        // writes on identity change, so undefined here is safe to proceed.
        // We only skip if sessionUserId was defined at toggle time and has since changed.
        if (sessionUserId !== undefined && sessionUserId !== user?.id) return;

        const valueToSave = youthModeLatestRef.current; // final intent after all rapid toggles
        try {
          const res = await fetch("/api/learner-profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ youthMode: valueToSave }),
          });
          if (res.ok) {
            // Confirm cache reflects exactly what was persisted
            queryClient.setQueryData(["/api/learner-profile"], (old: any) => ({
              ...old,
              youthMode: valueToSave,
            }));
          } else {
            const body = await res.text().catch(() => "");
            console.error(
              "[youth-mode] Failed to save preference:",
              res.status,
              body,
            );
            // Invalidate so the cache doesn't retain a stale optimistic value
            queryClient.invalidateQueries({
              queryKey: ["/api/learner-profile"],
            });
            toast({
              title: "Youth Mode preference not saved",
              description:
                "Couldn't save to your account — setting applies this session only.",
              variant: "destructive",
            });
          }
        } catch (err) {
          console.error("[youth-mode] Network error saving preference:", err);
          queryClient.invalidateQueries({ queryKey: ["/api/learner-profile"] });
          toast({
            title: "Youth Mode preference not saved",
            description:
              "Check your connection — the setting applies this session only.",
            variant: "destructive",
          });
        }
      }, 600);
    },
    [isAuthenticated, user?.id, toast],
  );

  const deleteConversation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/navigator/conversations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/navigator/conversations"],
      });
      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Delete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversation = useCallback(async (convoId: string) => {
    try {
      const res = await fetch(
        `/api/navigator/conversations/${convoId}/messages`,
        { credentials: "include" },
      );
      if (!res.ok) return;
      const payload = await res.json();
      // Endpoint returns { messages, youthMode }; tolerate the old bare-array shape.
      const msgs = Array.isArray(payload) ? payload : (payload.messages ?? []);
      userStartedNewRef.current = false; // resume auto-behaviour after explicit load
      setMessages(
        msgs.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        })),
      );
      // Restore Youth Mode for threads that were started (or continued) in it,
      // so re-opened chats stay youth-friendly end to end.
      if (!Array.isArray(payload) && payload.youthMode === true) {
        setYouthMode(true);
        youthModeLatestRef.current = true;
        // Guard against the profile query resolving later and stomping the
        // conversation-level restore (thread-on beats profile-off).
        youthModeUserEditedRef.current = true;
        try {
          localStorage.setItem("tcaf_youth_mode", "true");
        } catch {
          /* storage blocked */
        }
      }
      setActiveConversationId(convoId);
      setView("chat");
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  }, []);

  const startNewConversation = useCallback(() => {
    userStartedNewRef.current = true;
    // Persist across hard-refresh within the same browser tab. Safe helper
    // never throws in private mode (falls back to in-memory for this tab).
    safeSetRaw("navigator_skip_resume", "1", "session");
    setMessages([]);
    setActiveConversationId(null);
    setAttachedDocs([]);
    setView("chat");
  }, []);

  // Once the user has actually started a real conversation, clear the skip flag
  // so a future hard-refresh auto-resumes their new conversation correctly.
  useEffect(() => {
    if (activeConversationId) {
      safeRemove("navigator_skip_resume", "session");
      userStartedNewRef.current = false;
    }
  }, [activeConversationId]);

  // Auto-resume the most recent conversation when the navigator opens.
  // Skip if the user explicitly clicked New Conversation (or refreshed after doing so).
  useEffect(() => {
    const skipFlag = safeGetRaw("navigator_skip_resume", "session") === "1";
    if (skipFlag) {
      userStartedNewRef.current = true; // keep ref in sync
      return;
    }
    if (userStartedNewRef.current) return;
    if (
      (isOpen || mode === "page") &&
      isAuthenticated &&
      conversations &&
      conversations.length > 0 &&
      !activeConversationId &&
      messages.length === 0
    ) {
      loadConversation(conversations[0].id);
    }
  }, [
    isOpen,
    isAuthenticated,
    conversations,
    activeConversationId,
    messages.length,
    loadConversation,
    mode,
  ]);

  const copyMessage = useCallback(
    async (text: string, idx: number) => {
      let copied = false;
      // Primary: modern Clipboard API (requires secure context / HTTPS)
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch {
        // Fallback: execCommand for embedded/insecure contexts (HTTP dev, iframes)
        try {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.cssText =
            "position:fixed;left:-9999px;top:-9999px;opacity:0";
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          copied = document.execCommand("copy");
          document.body.removeChild(ta);
        } catch {
          /* both paths failed */
        }
      }
      if (copied) {
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
      } else {
        toast({
          title: "Could not copy",
          description: "Please select and copy the text manually.",
          variant: "destructive",
        });
      }
    },
    [toast],
  );

  const saveAsInitiative = useCallback(
    async (text: string, idx: number) => {
      const titleMatch = text.match(/^#+ (.+)/m) || text.match(/^(.{10,60})/m);
      const title = titleMatch
        ? titleMatch[1].trim()
        : `Initiative ${new Date().toLocaleDateString()}`;
      try {
        const res = await fetch("/api/initiatives", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title,
            content: text,
            category: "initiative",
          }),
        });
        if (!res.ok) throw new Error("save failed");
        const created = await res.json();
        setSavedIdx(idx);
        setTimeout(() => setSavedIdx(null), 3000);
        toast({
          title: "Initiative saved!",
          description: (
            <span>
              View it at{" "}
              <a
                href={`/initiatives/${created.slug}`}
                className="underline font-medium"
                onClick={() =>
                  (window.location.href = `/initiatives/${created.slug}`)
                }
              >
                My Initiatives
              </a>
            </span>
          ),
        });
      } catch {
        toast({ title: "Sign in to save initiatives", variant: "destructive" });
      }
    },
    [toast],
  );

  const downloadMessage = useCallback(async (text: string, idx: number) => {
    // Derive a title from the first heading or first line
    const titleMatch = text.match(/^#+ (.+)/m) || text.match(/^(.{10,60})/m);
    const title = titleMatch
      ? titleMatch[1].trim()
      : `Navigator Response ${idx + 1}`;
    try {
      const res = await fetch("/api/navigator/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: text, title }),
      });
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, "_").slice(0, 50)}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback to plain text if export endpoint fails
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `navigator-response-${idx + 1}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (!files.length) return;
      e.target.value = "";

      // 80K chars ≈ 20K tokens — safely within Claude's 200K-token window even
      // with multiple docs attached. No artificial cap below this.
      const MAX_CHARS = 80_000;

      const addDoc = (name: string, rawText: string, type: "pdf" | "text") => {
        const text = rawText.slice(0, MAX_CHARS);
        setAttachedDocs((prev) => {
          if (prev.some((d) => d.name === name)) return prev;
          return [...prev, { name, text, type, originalSize: rawText.length }];
        });
      };

      for (const file of files) {
        if (
          file.name.match(/\.(txt|md)$/i) ||
          file.type === "text/plain" ||
          file.type === "text/markdown"
        ) {
          await new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
              addDoc(file.name, (ev.target?.result as string) || "", "text");
              resolve();
            };
            reader.readAsText(file);
          });
          continue;
        }

        if (file.name.match(/\.pdf$/i) || file.type === "application/pdf") {
          const formData = new FormData();
          formData.append("file", file);
          try {
            const res = await fetch("/api/navigator/extract-text", {
              method: "POST",
              body: formData,
              credentials: "include",
            });
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            const { text, name, ocrUsed } = await res.json();
            if (!text || text.trim().length === 0) {
              toast({
                title: `${file.name} — could not extract text`,
                description:
                  "This PDF may be encrypted or an unsupported format. Try copy-pasting the content directly into the chat.",
                variant: "destructive",
              });
            } else {
              addDoc(name || file.name, text, "pdf");
              if (ocrUsed) {
                toast({
                  title: `${file.name} — read via OCR`,
                  description:
                    "Scanned PDF processed with vision AI. Text may have minor errors.",
                });
              }
            }
          } catch (err) {
            toast({
              title: `Could not read ${file.name}`,
              description:
                "It may be a scanned or protected PDF. Try copy-pasting the text instead.",
              variant: "destructive",
            });
          }
          continue;
        }

        toast({
          title: "Unsupported file type",
          description: `${file.name}: please use .pdf, .txt, or .md.`,
          variant: "destructive",
        });
      }
    },
    [toast],
  );

  const sendMessage = useCallback(
    async (text?: string) => {
      const messageText = text || input.trim();
      if (!messageText || isStreaming) return;

      // Capture the index of the assistant message we're about to create.
      // User msg goes at messages.length, assistant placeholder at messages.length + 1.
      const assistantIdx = messages.length + 1;

      const docContext =
        attachedDocs.length > 0
          ? attachedDocs
              .map((d) => `[ATTACHED DOCUMENT: "${d.name}"]\n${d.text}`)
              .join("\n\n---\n\n")
          : "";
      const apiText = docContext
        ? `${messageText}\n\n${docContext}`
        : messageText;
      const docLabel =
        attachedDocs.length > 0
          ? "\n\n" + attachedDocs.map((d) => `📎 ${d.name}`).join("  ")
          : "";
      const displayText = messageText + docLabel;

      // A newer submission owns its own stream and deep-think poll. Abort and
      // dispose prior work so it cannot update this new request later.
      requestAbortRef.current?.abort();
      if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current);
      stopDeepThinkPolling();
      const requestId = ++navigatorRequestIdRef.current;

      setMessages((prev) => [
        ...prev,
        { role: "user", content: displayText },
        { role: "assistant", content: "" },
      ]);
      setInput("");
      setAttachedDocs([]);
      submittedDraftRef.current = {
        message: messageText,
        attachments: attachedDocs,
      };
      setIsStreaming(true);
      let fullText = ""; // hoisted so the catch block can inspect it
      let requestTimedOut = false;
      const controller = new AbortController();
      requestAbortRef.current = controller;
      const requestTimeout = setTimeout(() => {
        requestTimedOut = true;
        controller.abort();
      }, 90_000);
      requestTimeoutRef.current = requestTimeout;

      try {
        const response = await fetch("/api/navigator/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal: controller.signal,
          body: JSON.stringify({
            message: apiText,
            conversationId: activeConversationId,
            responseMode,
            youthMode,
          }),
        });
        if (navigatorRequestIdRef.current !== requestId) return;

        if (response.status === 401) {
          // Session expired — show a clear sign-in prompt rather than a generic error.
          setMessages((prev) => {
            const updated = [...prev];
            if (updated[assistantIdx]) {
              updated[assistantIdx] = {
                ...updated[assistantIdx],
                content:
                  "⚠️ Your session has expired. Please sign in to continue using the Navigator.",
              };
            }
            return updated;
          });
          setIsStreaming(false);
          return;
        }

        if (!response.ok) throw new Error(`Request failed: ${response.status}`);

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          let sseBuffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            // SSE records end at a blank line, not at arbitrary transport chunk
            // boundaries. Keep incomplete records (including split JSON lines).
            sseBuffer += decoder.decode(value, { stream: true });
            const records = sseBuffer.split(/\r?\n\r?\n/);
            sseBuffer = records.pop() ?? "";
            for (const record of records) {
              const data = record
                .split(/\r?\n/)
                .filter((line) => line.startsWith("data:"))
                .map((line) => line.slice(5).replace(/^ /, ""))
                .join("\n");
              if (!data) continue;
              try {
                const parsed = JSON.parse(data);
                // The user may have submitted another message after Phase 1
                // unlocked the composer. Never let this older stream mutate the
                // newer request or install a stale R1 poll.
                if (navigatorRequestIdRef.current !== requestId) continue;

                if (parsed.conversationId && !activeConversationId) {
                  setActiveConversationId(parsed.conversationId);
                }

                if (parsed.error) {
                  // Server-side AI failure — show a readable message rather than
                  // letting the abrupt stream close bubble up as a network exception.
                  setMessages((prev) => {
                    const updated = [...prev];
                    if (updated[assistantIdx]) {
                      updated[assistantIdx] = {
                        ...updated[assistantIdx],
                        content:
                          "I wasn't able to generate a response right now. The AI engines may be temporarily unavailable — please try again in a moment.",
                        deepThinkingPending: false,
                      };
                    }
                    return updated;
                  });
                  setIsStreaming(false);
                  break;
                }

                if (parsed.grantHuntProgress) {
                  setMessages((prev) => {
                    const updated = [...prev];
                    if (updated[assistantIdx]) {
                      updated[assistantIdx] = {
                        ...updated[assistantIdx],
                        content:
                          updated[assistantIdx].content ||
                          `🔍 ${parsed.grantHuntProgress.message}`,
                      };
                    }
                    return updated;
                  });
                }

                if (parsed.urlFetchWarning) {
                  toast({
                    title: "URL could not be fetched",
                    description: parsed.urlFetchWarning,
                    variant: "destructive",
                  });
                }

                if (parsed.grantHuntResults) {
                  setMessages((prev) => {
                    const updated = [...prev];
                    if (updated[assistantIdx]) {
                      updated[assistantIdx] = {
                        ...updated[assistantIdx],
                        grantResults: parsed.grantHuntResults,
                        grantOrgName: parsed.grantOrgName,
                        totalFound: parsed.totalFound,
                      };
                    }
                    return updated;
                  });
                }

                if (parsed.content) {
                  fullText += parsed.content;
                  setMessages((prev) => {
                    const updated = [...prev];
                    if (updated[assistantIdx]) {
                      updated[assistantIdx] = {
                        ...updated[assistantIdx],
                        content: fullText,
                      };
                    }
                    return updated;
                  });
                }

                if (parsed.synthesisComplete) {
                  // Fast engines done — unlock input so the user can re-prompt
                  // while DeepSeek R1 continues its deep analysis in the background.
                  setIsStreaming(false);
                  setMessages((prev) => {
                    const updated = [...prev];
                    if (updated[assistantIdx]) {
                      updated[assistantIdx] = {
                        ...updated[assistantIdx],
                        deepThinkingPending: true,
                      };
                    }
                    return updated;
                  });
                }

                if (parsed.deepThinking) {
                  setMessages((prev) => {
                    const updated = [...prev];
                    if (updated[assistantIdx]) {
                      updated[assistantIdx] = {
                        ...updated[assistantIdx],
                        deepThinking: parsed.deepThinking,
                        deepThinkingPending: false,
                      };
                    }
                    return updated;
                  });
                }

                if (parsed.done) {
                  refetchConversations();
                  if (parsed.gunViolenceContext) {
                    setMessages((prev) => {
                      const updated = [...prev];
                      if (updated[assistantIdx]) {
                        updated[assistantIdx] = {
                          ...updated[assistantIdx],
                          gunViolenceContext: parsed.gunViolenceContext,
                        };
                      }
                      return updated;
                    });
                  }
                  const jobId: string | undefined = parsed.deepThinkJobId;
                  if (jobId) {
                    // Phase 1 SSE closed — start polling for DeepSeek R1 result.
                    // Each poll owns its timers and fetch controller. Its
                    // cleanup only touches itself, never a newer request.
                    stopDeepThinkPolling();
                    setDeepThinkElapsed(0);
                    let elapsed = 0;
                    const capturedIdx = assistantIdx;

                    // *** Show the spinner immediately so user sees R1 is running ***
                    setMessages((prev) => {
                      const updated = [...prev];
                      if (updated[capturedIdx]) {
                        updated[capturedIdx] = {
                          ...updated[capturedIdx],
                          deepThinkingPending: true,
                        };
                      }
                      return updated;
                    });

                    const polling: DeepThinkPolling = {
                      requestId,
                      assistantIdx: capturedIdx,
                      pollTimer: null,
                      elapsedTimer: null,
                      abortController: new AbortController(),
                    };
                    deepThinkPollingRef.current = polling;

                    // Elapsed-time counter — updates every second so user sees progress
                    polling.elapsedTimer = setInterval(() => {
                      if (deepThinkPollingRef.current !== polling) return;
                      elapsed += 1;
                      setDeepThinkElapsed(elapsed);
                    }, 1000);

                    // Poll every 4s, give up after 90s
                    let pollCount = 0;
                    const MAX_POLLS = 22; // 22 × 4s = 88s
                    let pollInFlight = false;
                    polling.pollTimer = setInterval(async () => {
                      if (
                        deepThinkPollingRef.current !== polling ||
                        pollInFlight
                      )
                        return;
                      pollCount++;
                      if (pollCount > MAX_POLLS) {
                        stopDeepThinkPolling(requestId);
                        return;
                      }
                      pollInFlight = true;
                      try {
                        const resp = await fetch(
                          `/api/navigator/deep-think/${jobId}`,
                          {
                            credentials: "include",
                            signal: polling.abortController.signal,
                          },
                        );
                        const data = await resp.json();
                        if (deepThinkPollingRef.current !== polling) return;
                        if (data.status === "complete" && data.text) {
                          stopDeepThinkPolling(requestId, false);
                          setMessages((prev) => {
                            const updated = [...prev];
                            if (updated[capturedIdx]) {
                              updated[capturedIdx] = {
                                ...updated[capturedIdx],
                                deepThinking: data.text,
                                deepThinkingPending: false,
                              };
                            }
                            return updated;
                          });
                        }
                      } catch (err) {
                        if (
                          !(err instanceof DOMException && err.name === "AbortError")
                        ) {
                          // A transient poll failure is retried by the next tick.
                        }
                      } finally {
                        pollInFlight = false;
                      }
                    }, 4000);
                  } else {
                    // No R1 job — clear pending indicator
                    setMessages((prev) => {
                      const updated = [...prev];
                      if (updated[assistantIdx]) {
                        updated[assistantIdx] = {
                          ...updated[assistantIdx],
                          deepThinkingPending: false,
                        };
                      }
                      return updated;
                    });
                  }
                }
              } catch (err) {
                console.error("[Navigator] Ignoring malformed SSE event:", err);
              }
            }
          }
        }
      } catch (err) {
        if (navigatorRequestIdRef.current !== requestId || !mountedRef.current)
          return;
        // Only replace content with an error if nothing was streamed yet.
        // If synthesis already completed (fullText has content), a connection
        // drop during the Phase-2 R1 wait is benign — don't overwrite good output.
        if (requestTimedOut) {
          // The composer is the retry path. Restore the exact submitted payload
          // even when a partial answer arrived before the absolute deadline.
          const draft = submittedDraftRef.current;
          if (draft) {
            setInput(draft.message);
            setAttachedDocs(draft.attachments);
          }
        }
        if (!fullText) {
          setMessages((prev) => {
            const updated = [...prev];
            if (updated[assistantIdx]) {
              updated[assistantIdx] = {
                ...updated[assistantIdx],
                content: requestTimedOut
                  ? "I'm sorry, this Navigator request took longer than 90 seconds and was stopped. Your message and attachments have been restored below—press Send to retry."
                  : "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
                deepThinkingPending: false,
              };
            }
            return updated;
          });
        } else {
          // Connection dropped after synthesis — clear the pending R1 indicator
          setMessages((prev) => {
            const updated = [...prev];
            if (updated[assistantIdx]) {
              updated[assistantIdx] = {
                ...updated[assistantIdx],
                content: requestTimedOut
                  ? `${updated[assistantIdx].content}\n\n⚠️ This request reached the 90-second limit. Your message and attachments have been restored below—press Send to retry.`
                  : updated[assistantIdx].content,
                deepThinkingPending: false,
              };
            }
            return updated;
          });
        }
      } finally {
        if (requestTimeoutRef.current === requestTimeout) {
          clearTimeout(requestTimeout);
          requestTimeoutRef.current = null;
        }
        if (requestAbortRef.current === controller) {
          requestAbortRef.current = null;
        }
        if (
          mountedRef.current &&
          navigatorRequestIdRef.current === requestId
        ) {
          setIsStreaming(false);
        }
      }
    },
    [
      input,
      isStreaming,
      activeConversationId,
      messages,
      attachedDocs,
      refetchConversations,
      responseMode,
      toast,
      youthMode,
      stopDeepThinkPolling,
    ],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd+Enter sends — plain Enter always creates a new line
    // This prevents accidental submission mid-thought, especially on mobile.
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Full-page mode ────────────────────────────────────────────────────────
  if (mode === "page") {
    return (
      <div className="flex h-full overflow-hidden bg-background">
        {/* Left rail: conversation history — desktop only */}
        <div className="hidden md:flex w-72 flex-col border-r bg-muted/10 shrink-0">
          <div className="px-4 py-3 border-b bg-gradient-to-r from-teal-600 to-emerald-600">
            <p className="font-semibold text-sm text-white">
              Conversation History
            </p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {!isAuthenticated ? (
                <div className="text-center py-10 px-3 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">
                    Sign in to save conversations
                  </p>
                  <p className="text-xs mt-1 mb-3">
                    Your chats are private and won't be stored until you sign
                    in.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => {
                      window.location.href = "/api/login";
                    }}
                  >
                    Sign In to Save
                  </Button>
                </div>
              ) : conversations && conversations.length > 0 ? (
                conversations.map((convo) => (
                  <div
                    key={convo.id}
                    className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${activeConversationId === convo.id ? "border-primary bg-primary/5" : ""}`}
                    data-testid={`card-convo-page-${convo.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        className="flex-1 min-w-0 text-left"
                        onClick={() => loadConversation(convo.id)}
                      >
                        <p className="font-medium text-sm truncate">
                          {convo.title}
                        </p>
                        {convo.summary && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {convo.summary}
                          </p>
                        )}
                        {convo.identifiedNeeds &&
                          convo.identifiedNeeds.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {convo.identifiedNeeds.map((need) => (
                                <Badge
                                  key={need}
                                  variant="secondary"
                                  className={`text-[10px] px-1.5 py-0 ${NEED_COLORS[need] || ""}`}
                                >
                                  {need}
                                </Badge>
                              ))}
                            </div>
                          )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {convo.lastMessageAt
                            ? new Date(convo.lastMessageAt).toLocaleDateString()
                            : ""}
                        </p>
                      </button>
                      <button
                        onClick={() => {
                          deleteConversation.mutate(convo.id);
                          if (activeConversationId === convo.id)
                            startNewConversation();
                        }}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs mt-1">Start chatting below</p>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-3 border-t">
            <Button
              onClick={startNewConversation}
              className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
              data-testid="button-page-new-convo"
            >
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              New Conversation
            </Button>
          </div>
        </div>

        {/* Right: header + chat + input */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white shrink-0">
            <div className="flex items-center gap-3">
              <Compass className="h-6 w-6" />
              <div>
                <h1 className="font-bold text-base leading-tight">
                  ThriveUp Navigator
                </h1>
                <p className="text-[11px] text-teal-100">
                  4-engine parallel analysis · DeepSeek R1 deep thinking
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Mobile: history toggle */}
              <button
                onClick={() => setView(view === "history" ? "chat" : "history")}
                className="flex md:hidden items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-sm"
                data-testid="button-page-mobile-history"
              >
                <History className="h-4 w-4" />
              </button>
              <button
                onClick={startNewConversation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-sm font-medium"
                data-testid="button-page-new-chat"
              >
                <MessageSquarePlus className="h-4 w-4" />
                <span className="hidden sm:inline">New</span>
              </button>
            </div>
          </div>

          {/* Mobile: history view */}
          {view === "history" && (
            <div className="md:hidden flex-1 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                  {!isAuthenticated ? (
                    <div className="text-center py-12 px-3 text-muted-foreground">
                      <History className="h-10 w-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-medium">
                        Sign in to save conversations
                      </p>
                      <p className="text-xs mt-1 mb-3">
                        Chats aren't stored until you sign in.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => {
                          window.location.href = "/api/login";
                        }}
                      >
                        Sign In
                      </Button>
                    </div>
                  ) : conversations && conversations.length > 0 ? (
                    conversations.map((convo) => (
                      <div
                        key={convo.id}
                        className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${activeConversationId === convo.id ? "border-primary bg-primary/5" : ""}`}
                      >
                        <button
                          className="w-full text-left"
                          onClick={() => {
                            loadConversation(convo.id);
                            setView("chat");
                          }}
                        >
                          <p className="font-medium text-sm">{convo.title}</p>
                          {convo.summary && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {convo.summary}
                            </p>
                          )}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <History className="h-10 w-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No conversations yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-3 border-t">
                <Button
                  onClick={() => {
                    startNewConversation();
                    setView("chat");
                  }}
                  className="w-full"
                >
                  Start New
                </Button>
              </div>
            </div>
          )}

          {/* Chat messages */}
          {view === "chat" && (
            <>
              <ScrollArea className="flex-1">
                <div
                  className="px-5 py-4 space-y-5 max-w-4xl mx-auto"
                  role="log"
                  aria-live="polite"
                  aria-label="Navigator conversation"
                >
                  {messages.length === 0 ? (
                    <div className="space-y-6 py-10">
                      <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900 dark:to-emerald-900 flex items-center justify-center mx-auto mb-4">
                          <Compass className="h-10 w-10 text-teal-600 dark:text-teal-400" />
                        </div>
                        <h2 className="font-bold text-2xl">
                          Hi, I'm the Navigator
                        </h2>
                        <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">
                          Here to help you find resources, connect with
                          services, and think through your next steps — whatever
                          the challenge.
                        </p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 max-w-lg mx-auto">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                          <div className="text-sm text-amber-800 dark:text-amber-200">
                            <p className="font-medium">If you're in crisis:</p>
                            <p className="mt-1">
                              <strong>988</strong> Suicide & Crisis Lifeline ·{" "}
                              <strong>911</strong> for emergencies · Text{" "}
                              <strong>HOME</strong> to <strong>741741</strong>
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
                        {QUICK_PROMPTS.map((prompt) => (
                          <button
                            key={prompt.label}
                            onClick={() => sendMessage(prompt.label)}
                            disabled={isStreaming}
                            className="flex items-center gap-2 p-3 rounded-xl border text-left text-sm hover:bg-muted/50 transition-colors disabled:opacity-50 bg-background"
                            data-testid={`button-page-quick-${prompt.label.replace(/\s+/g, "-").toLowerCase()}`}
                          >
                            <span className="text-xl">{prompt.icon}</span>
                            <span>{prompt.label}</span>
                          </button>
                        ))}
                      </div>
                      <div className="max-w-xl mx-auto">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          Platform actions
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {PLATFORM_ACTIONS.map((action) => (
                            <button
                              key={action.label}
                              disabled={isStreaming}
                              onClick={() => {
                                if (action.href) {
                                  navigate(action.href);
                                } else if (action.message) {
                                  sendMessage(action.message);
                                }
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100 dark:bg-teal-950/40 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-900/50 transition-colors disabled:opacity-50"
                              data-testid={`button-page-action-${action.label.replace(/\s+/g, "-").toLowerCase()}`}
                            >
                              <span>{action.icon}</span>
                              <span>{action.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div
                        key={idx}
                        data-testid={`message-page-${msg.role}-${idx}`}
                      >
                        <div
                          className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          {msg.role === "assistant" && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900 dark:to-emerald-900 flex items-center justify-center shrink-0 mt-0.5">
                              <Bot className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-br-sm" : "bg-muted/60 border rounded-bl-sm"}`}
                          >
                            {msg.role === "assistant" ? (
                              <div className="leading-relaxed select-text cursor-text">
                                {msg.content ? (
                                  formatMessageContent(msg.content)
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-muted-foreground">
                                      Thinking...
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="leading-relaxed whitespace-pre-wrap select-text cursor-text">
                                {msg.content}
                              </div>
                            )}
                          </div>
                          {msg.role === "user" && (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                          )}
                        </div>
                        {msg.role === "assistant" &&
                          msg.grantResults &&
                          msg.grantResults.length > 0 && (
                            <GrantResultCards
                              grants={msg.grantResults}
                              orgName={msg.grantOrgName || ""}
                              totalFound={msg.totalFound || 0}
                              isAuthenticated={isAuthenticated}
                            />
                          )}
                        {msg.role === "assistant" && msg.gunViolenceContext && (
                          <div className="ml-11 mt-1.5 flex flex-wrap gap-2">
                            <a
                              href="/gun-violence"
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-1.5 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                              data-testid={`link-gv-hub-${idx}`}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              View full report — Gun Violence Intelligence Hub
                            </a>
                            {(msg.gunViolenceContext.geography ||
                              msg.gunViolenceContext.state) && (
                              <a
                                href={`/gun-violence-intelligence?tab=story${msg.gunViolenceContext.geography ? `&geo=${encodeURIComponent(msg.gunViolenceContext.geography)}` : ""}${msg.gunViolenceContext.state ? `&state=${encodeURIComponent(msg.gunViolenceContext.state)}` : ""}`}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg px-3 py-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                                data-testid={`link-continue-in-story-${idx}`}
                              >
                                <Sparkles className="h-3.5 w-3.5" />
                                Continue in Tell-a-Story — see the full grounded
                                report for this area
                              </a>
                            )}
                          </div>
                        )}
                        {msg.role === "assistant" && msg.content && (
                          <div className="ml-11 mt-1.5 flex items-center gap-1">
                            <button
                              onClick={() => copyMessage(msg.content, idx)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted/50"
                              data-testid={`button-page-copy-${idx}`}
                            >
                              {copiedIdx === idx ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-green-500" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => downloadMessage(msg.content, idx)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted/50"
                              data-testid={`button-page-export-${idx}`}
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>Export</span>
                            </button>
                            {isAuthenticated && (
                              <button
                                onClick={() =>
                                  saveAsInitiative(msg.content, idx)
                                }
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-teal-600 transition-colors px-2 py-1 rounded hover:bg-teal-50 dark:hover:bg-teal-950/30"
                                data-testid={`button-page-save-initiative-${idx}`}
                              >
                                {savedIdx === idx ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-teal-500" />
                                    <span className="text-teal-600">
                                      Saved!
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Lightbulb className="h-3.5 w-3.5" />
                                    <span>Save as Initiative</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                        {msg.role === "assistant" &&
                          msg.deepThinkingPending && (
                            <div className="ml-11 mt-2">
                              <div className="flex items-center gap-2 text-xs bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg px-3 py-2.5">
                                <Brain className="h-4 w-4 text-purple-500 animate-pulse shrink-0" />
                                <span className="font-semibold text-purple-700 dark:text-purple-300">
                                  R1 deep analysis — {deepThinkElapsed}s...
                                </span>
                                <span className="text-muted-foreground hidden sm:inline">
                                  {deepThinkElapsed < 20
                                    ? "Starting up DeepSeek R1 reasoning engine"
                                    : deepThinkElapsed < 50
                                      ? "R1 is reasoning through the problem deeply"
                                      : "Almost there — R1 is finishing its analysis"}
                                </span>
                              </div>
                            </div>
                          )}
                        {msg.role === "assistant" && msg.deepThinking && (
                          <div className="ml-11 mt-2">
                            <button
                              onClick={() =>
                                setDeepThinkingExpanded((prev) => ({
                                  ...prev,
                                  [idx]: !prev[idx],
                                }))
                              }
                              className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg px-3 py-2 transition-colors w-full text-left"
                              data-testid={`button-page-deep-${idx}`}
                            >
                              <Brain className="h-3.5 w-3.5 shrink-0" />
                              <Sparkles className="h-3 w-3 shrink-0" />
                              <span className="font-medium">
                                DeepSeek R1 deep analysis
                              </span>
                              <span className="ml-auto">
                                {deepThinkingExpanded[idx] ? (
                                  <ChevronUp className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                )}
                              </span>
                            </button>
                            {deepThinkingExpanded[idx] && (
                              <div className="mt-1.5 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 text-sm leading-relaxed select-text cursor-text">
                                {formatMessageContent(msg.deepThinking)}
                                <button
                                  onClick={() =>
                                    copyMessage(msg.deepThinking!, idx + 10000)
                                  }
                                  className="mt-3 flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-100 transition-colors px-2 py-1 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30"
                                  data-testid={`button-copy-deep-${idx}`}
                                >
                                  {copiedIdx === idx + 10000 ? (
                                    <>
                                      <Check className="h-3 w-3 text-green-500" />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" />
                                      <span>Copy R1 analysis</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input area */}
              <div className="px-5 py-4 border-t bg-background shrink-0">
                <div className="max-w-4xl mx-auto">
                  {attachedDocs.length > 0 && (
                    <div className="mb-3 space-y-1.5">
                      {attachedDocs.map((doc, i) => (
                        <div
                          key={`${doc.name}-${i}`}
                          className="flex items-center gap-2 px-3 py-2 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-lg text-sm"
                        >
                          <FileText className="h-4 w-4 text-teal-600 shrink-0" />
                          <span className="text-teal-800 dark:text-teal-200 truncate flex-1">
                            {doc.name}{" "}
                            <span className="text-teal-500 text-xs ml-1">
                              (
                              {doc.originalSize > doc.text.length
                                ? `${Math.round(doc.text.length / 1000)}k of ${Math.round(doc.originalSize / 1000)}k chars`
                                : `${Math.round(doc.text.length / 1000)}k chars`}
                              )
                            </span>
                          </span>
                          <button
                            onClick={() =>
                              setAttachedDocs((prev) =>
                                prev.filter((_, j) => j !== i),
                              )
                            }
                            className="text-teal-600 hover:text-teal-900 dark:hover:text-teal-100 shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Response depth selector — page mode */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Response depth:
                    </span>
                    {(["brief", "detailed", "report"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setResponseMode(m)}
                        data-testid={`button-response-mode-${m}`}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                          responseMode === m
                            ? "bg-teal-600 text-white border-teal-600"
                            : "bg-background text-muted-foreground border-border hover:border-teal-400 hover:text-teal-700"
                        }`}
                      >
                        {m === "brief"
                          ? "Quick"
                          : m === "detailed"
                            ? "Detailed"
                            : "Full Report"}
                      </button>
                    ))}
                    <span
                      className="mx-1 h-4 w-px bg-border"
                      aria-hidden="true"
                    />
                    <button
                      onClick={() => handleYouthModeToggle(!youthMode)}
                      data-testid="button-youth-mode"
                      role="switch"
                      aria-checked={youthMode}
                      title="Youth Mode: youth-friendly language, your rights info, and safety-first guidance"
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                        youthMode
                          ? "bg-violet-600 text-white border-violet-600"
                          : "bg-background text-muted-foreground border-border hover:border-violet-400 hover:text-violet-700"
                      }`}
                    >
                      Youth Mode {youthMode ? "On" : "Off"}
                    </button>
                  </div>
                  {youthMode && (
                    <p
                      className="text-[11px] text-violet-700 dark:text-violet-300 mb-2"
                      data-testid="text-youth-mode-note"
                    >
                      Youth Mode is on — responses use youth-friendly language,
                      include your rights, and put safety first.
                    </p>
                  )}
                  <div className="flex gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.txt,.md,text/plain,text/markdown,application/pdf"
                      className="hidden"
                      onChange={handleFileSelect}
                      data-testid="input-file-upload-page"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isStreaming}
                      className="relative shrink-0 p-2.5 rounded-xl border hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                      title="Attach PDF, .txt, or .md — click multiple times to add more"
                      data-testid="button-attach-page"
                    >
                      <Paperclip className="h-5 w-5" />
                      {attachedDocs.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[9px] font-bold text-white">
                          {attachedDocs.length}
                        </span>
                      )}
                    </button>
                    <Textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        attachedDocs.length > 0
                          ? "What would you like me to do with these documents?"
                          : "Ask anything — paste a URL, upload a doc, or type your question... (Ctrl+Enter to send)"
                      }
                      className="min-h-[48px] max-h-[180px] resize-none rounded-xl text-sm"
                      rows={2}
                      disabled={isStreaming}
                      aria-label="Message to the Navigator assistant"
                      data-testid="textarea-navigator-input-page"
                    />
                    <Button
                      onClick={() => sendMessage()}
                      disabled={
                        (!input.trim() && attachedDocs.length === 0) ||
                        isStreaming
                      }
                      size="icon"
                      className="h-12 w-12 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shrink-0"
                      data-testid="button-send-page"
                      aria-label="Send message"
                    >
                      {isStreaming ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[11px] text-center text-muted-foreground mt-2">
                    Attach PDFs · .txt · .md · Paste a public HTTP(S) URL to
                    fetch up to 1 MB · Ctrl+Enter to send · Not a substitute for
                    professional advice
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Bubble / floating widget mode ─────────────────────────────────────────
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] sm:bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 group"
        data-testid="button-open-navigator"
        aria-label="Open AI Navigator"
      >
        <Compass className="h-5 w-5 group-hover:rotate-45 transition-transform" />
        <span className="font-medium text-sm hidden sm:inline">Navigator</span>
      </button>
    );
  }

  // Fluid width: never exceed the viewport minus the fixed insets, so the
  // panel stays fully on-screen at narrow widths (e.g. 360px) instead of the
  // old fixed 380px/600px that overflowed. `left-4 right-4` clamps it on small
  // screens; `sm:` restores the anchored, capped desktop panel.
  const panelWidth = isExpanded
    ? "w-auto sm:w-[min(600px,calc(100vw-3rem))]"
    : "w-auto sm:w-[min(380px,calc(100vw-3rem))]";
  const panelHeight = isExpanded ? "h-[80vh]" : "h-[min(560px,80vh)]";

  return (
    <div
      className={`fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 ${panelWidth} ${panelHeight} flex flex-col bg-background border rounded-2xl shadow-2xl overflow-hidden transition-all duration-200`}
      data-testid="navigator-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5" />
          <div>
            <h3 className="font-semibold text-sm leading-tight">
              ThriveUp Navigator
            </h3>
            <p className="text-[10px] text-teal-100">
              Empathetic AI Resource Guide
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setView(view === "history" ? "chat" : "history")}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            data-testid="button-toggle-history"
            aria-label="Toggle conversation history"
          >
            <History className="h-4 w-4" />
          </button>
          <button
            onClick={startNewConversation}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            data-testid="button-new-conversation"
            aria-label="New conversation"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </button>
          <Link
            href="/navigator"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors flex items-center"
            data-testid="button-expand-to-page"
            aria-label="Open full Navigator page"
            title="Full page"
          >
            <Expand className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            data-testid="button-toggle-expand"
            aria-label={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            data-testid="button-close-navigator"
            aria-label="Close navigator"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Sign-in gate — shown when session is expired or user is not logged in */}
      {!authLoading && !isAuthenticated ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900 dark:to-emerald-900 flex items-center justify-center">
            <Compass className="h-7 w-7 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <p className="font-semibold text-base">
              Sign in to use the Navigator
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              The Navigator is available to signed-in users. Your session may
              have expired.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = "/api/login";
            }}
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
            data-testid="button-navigator-signin"
          >
            Sign In
          </Button>
        </div>
      ) : authLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : view === "history" ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-4 py-2 border-b">
            <h4
              className="font-medium text-sm"
              data-testid="text-history-title"
            >
              Conversation History
            </h4>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {conversations && conversations.length > 0 ? (
                conversations.map((convo) => (
                  <div
                    key={convo.id}
                    className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${activeConversationId === convo.id ? "border-primary bg-primary/5" : ""}`}
                    data-testid={`card-conversation-${convo.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        className="flex-1 min-w-0 text-left"
                        onClick={() => loadConversation(convo.id)}
                        aria-label={`Load conversation: ${convo.title}`}
                      >
                        <p className="font-medium text-sm truncate">
                          {convo.title}
                        </p>
                        {convo.summary && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {convo.summary}
                          </p>
                        )}
                        {convo.identifiedNeeds &&
                          convo.identifiedNeeds.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {convo.identifiedNeeds.map((need) => (
                                <Badge
                                  key={need}
                                  variant="secondary"
                                  className={`text-[10px] px-1.5 py-0 ${NEED_COLORS[need] || ""}`}
                                >
                                  {need}
                                </Badge>
                              ))}
                            </div>
                          )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {convo.lastMessageAt
                            ? new Date(convo.lastMessageAt).toLocaleDateString()
                            : ""}
                        </p>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation.mutate(convo.id);
                          if (activeConversationId === convo.id)
                            startNewConversation();
                        }}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        data-testid={`button-delete-conversation-${convo.id}`}
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs mt-1">
                    Start a conversation to see it here
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-3 border-t">
            <Button
              onClick={() => {
                startNewConversation();
                setView("chat");
              }}
              className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
              data-testid="button-start-new-chat"
            >
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              Start New Conversation
            </Button>
          </div>
        </div>
      ) : (
        /* Chat view */
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* DIS Condition 3 — AI augmentation disclosure (compact strip) */}
          <NavigatorDisclosure
            hasPersonalContext={!!user}
            hasResearchContext
            className="px-3 pt-2"
          />
          <ScrollArea className="flex-1">
            <div
              className="p-4 space-y-4"
              role="log"
              aria-live="polite"
              aria-label="Navigator conversation"
            >
              {messages.length === 0 ? (
                <div className="space-y-4" data-testid="navigator-welcome">
                  <div className="text-center py-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900 dark:to-emerald-900 flex items-center justify-center mx-auto mb-3">
                      <Compass className="h-7 w-7 text-teal-600 dark:text-teal-400" />
                    </div>
                    <h4
                      className="font-semibold text-base"
                      data-testid="text-navigator-welcome"
                    >
                      Hi, I'm the Navigator
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      I'm here to help you find resources, connect with
                      services, and navigate your next steps — whatever your
                      situation.
                    </p>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-amber-800 dark:text-amber-200">
                        <p className="font-medium">If you're in crisis:</p>
                        <p className="mt-0.5">
                          <strong>988</strong> Suicide & Crisis Lifeline (call
                          or text) | <strong>911</strong> for emergencies | Text{" "}
                          <strong>HOME</strong> to <strong>741741</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Quick start
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {QUICK_PROMPTS.map((prompt) => (
                        <button
                          key={prompt.label}
                          onClick={() => sendMessage(prompt.label)}
                          disabled={isStreaming}
                          className="flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs hover:bg-muted/50 transition-colors disabled:opacity-50"
                          data-testid={`button-quick-prompt-${prompt.label.replace(/\s+/g, "-").toLowerCase()}`}
                        >
                          <span>{prompt.icon}</span>
                          <span>{prompt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Platform actions
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {PLATFORM_ACTIONS.map((action) => (
                        <button
                          key={action.label}
                          disabled={isStreaming}
                          onClick={() => {
                            if (action.href) {
                              navigate(action.href);
                            } else if (action.message) {
                              sendMessage(action.message);
                            }
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100 dark:bg-teal-950/40 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-900/50 transition-colors disabled:opacity-50"
                          data-testid={`button-bubble-action-${action.label.replace(/\s+/g, "-").toLowerCase()}`}
                        >
                          <span>{action.icon}</span>
                          <span>{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} data-testid={`message-${msg.role}-${idx}`}>
                    {/* Message bubble row */}
                    <div
                      className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900 dark:to-emerald-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                          msg.role === "user"
                            ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-br-md"
                            : "bg-muted/60 border rounded-bl-md"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div className="leading-relaxed select-text cursor-text">
                            {msg.content ? (
                              formatMessageContent(msg.content)
                            ) : (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span className="text-xs text-muted-foreground">
                                  Thinking...
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="leading-relaxed whitespace-pre-wrap select-text cursor-text">
                            {msg.content}
                          </div>
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </div>

                    {/* Assistant action bar: copy + download */}
                    {msg.role === "assistant" && msg.content && (
                      <div className="ml-9 mt-1 flex items-center gap-1">
                        <button
                          onClick={() => copyMessage(msg.content, idx)}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-muted/50"
                          data-testid={`button-copy-${idx}`}
                          aria-label="Copy response"
                          title="Copy"
                        >
                          {copiedIdx === idx ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>{copiedIdx === idx ? "Copied!" : "Copy"}</span>
                        </button>
                        <button
                          onClick={() => downloadMessage(msg.content, idx)}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-muted/50"
                          data-testid={`button-download-${idx}`}
                          aria-label="Download as Word document"
                          title="Download as Word (.docx)"
                        >
                          <Download className="h-3 w-3" />
                          <span>Word</span>
                        </button>
                      </div>
                    )}

                    {/* Deep thinking pending indicator — shows live elapsed seconds */}
                    {msg.role === "assistant" && msg.deepThinkingPending && (
                      <div className="ml-9 mt-1.5 flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
                        <Brain className="h-3.5 w-3.5 animate-pulse flex-shrink-0" />
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">
                            R1 deep analysis
                            {deepThinkElapsed > 0
                              ? ` — ${deepThinkElapsed}s`
                              : ""}
                            <span className="animate-pulse">...</span>
                          </span>
                          <span className="text-violet-400 dark:text-violet-500 text-[10px]">
                            {deepThinkElapsed < 20
                              ? "Starting up DeepSeek R1 reasoning engine"
                              : deepThinkElapsed < 50
                                ? "R1 is reasoning through the problem deeply"
                                : "Almost there — R1 is finishing its analysis"}
                          </span>
                        </div>
                        <Loader2 className="h-3 w-3 animate-spin flex-shrink-0 ml-auto" />
                      </div>
                    )}

                    {/* Deep thinking expandable panel */}
                    {msg.role === "assistant" && msg.deepThinking && (
                      <div className="ml-9 mt-1.5">
                        <button
                          onClick={() =>
                            setDeepThinkingExpanded((prev) => ({
                              ...prev,
                              [idx]: !prev[idx],
                            }))
                          }
                          className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-200 transition-colors"
                          data-testid={`button-deep-thinking-${idx}`}
                        >
                          <Brain className="h-3 w-3" />
                          <span>DeepSeek R1 deep analysis</span>
                          {deepThinkingExpanded[idx] ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                        {deepThinkingExpanded[idx] && (
                          <div className="mt-1.5 p-3 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 text-xs text-violet-900 dark:text-violet-100 leading-relaxed select-text cursor-text">
                            {formatMessageContent(msg.deepThinking)}
                            <button
                              onClick={() =>
                                copyMessage(msg.deepThinking!, idx + 10000)
                              }
                              className="mt-2 flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400 hover:text-violet-900 dark:hover:text-violet-100 transition-colors px-1.5 py-0.5 rounded hover:bg-violet-100 dark:hover:bg-violet-900/30"
                              data-testid={`button-copy-deep-bubble-${idx}`}
                            >
                              {copiedIdx === idx + 10000 ? (
                                <>
                                  <Check className="h-3 w-3 text-green-500" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy R1 analysis</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="p-3 border-t bg-background">
            {/* Attached documents list */}
            {attachedDocs.length > 0 && (
              <div className="mb-2 space-y-1">
                {attachedDocs.map((doc, i) => (
                  <div
                    key={`${doc.name}-${i}`}
                    className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-lg text-xs"
                  >
                    <FileText className="h-3.5 w-3.5 text-teal-600 flex-shrink-0" />
                    <span className="text-teal-800 dark:text-teal-200 truncate flex-1">
                      {doc.name}
                      <span className="text-teal-500 ml-1">
                        (
                        {doc.originalSize > doc.text.length
                          ? `${Math.round(doc.text.length / 1000)}k of ${Math.round(doc.originalSize / 1000)}k chars`
                          : `${Math.round(doc.text.length / 1000)}k chars`}
                        )
                      </span>
                    </span>
                    <button
                      onClick={() =>
                        setAttachedDocs((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        )
                      }
                      className="text-teal-600 hover:text-teal-900 dark:hover:text-teal-100 transition-colors flex-shrink-0"
                      aria-label={`Remove ${doc.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Response depth selector — bubble mode */}
            <div className="flex items-center gap-1 mb-2">
              {(["brief", "detailed", "report"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setResponseMode(m)}
                  data-testid={`button-response-mode-bubble-${m}`}
                  className={`flex-1 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                    responseMode === m
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-background text-muted-foreground border-border hover:border-teal-400"
                  }`}
                >
                  {m === "brief"
                    ? "Quick"
                    : m === "detailed"
                      ? "Detailed"
                      : "Full Report"}
                </button>
              ))}
              <button
                onClick={() => handleYouthModeToggle(!youthMode)}
                data-testid="button-youth-mode-bubble"
                role="switch"
                aria-checked={youthMode}
                title="Youth Mode: youth-friendly language, your rights info, and safety-first guidance"
                className={`flex-1 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                  youthMode
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-background text-muted-foreground border-border hover:border-violet-400"
                }`}
              >
                Youth {youthMode ? "On" : "Off"}
              </button>
            </div>
            <div className="flex gap-2">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.md,text/plain,text/markdown,application/pdf"
                className="hidden"
                onChange={handleFileSelect}
                data-testid="input-file-upload"
              />

              {/* Attach button — badge shows count when docs are queued */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isStreaming}
                className="relative flex-shrink-0 p-2 rounded-xl border hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                data-testid="button-attach-document"
                aria-label="Attach document"
                title="Attach PDF, .txt, or .md — click multiple times to add more"
              >
                <Paperclip className="h-4 w-4" />
                {attachedDocs.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[9px] font-bold text-white">
                    {attachedDocs.length}
                  </span>
                )}
              </button>

              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  attachedDocs.length > 0
                    ? "What would you like me to do with these documents?"
                    : "Tell me what you need help with... (tap Send or Ctrl+Enter)"
                }
                className="min-h-[40px] max-h-[100px] resize-none text-sm rounded-xl"
                rows={1}
                disabled={isStreaming}
                aria-label="Message to the Navigator assistant"
                data-testid="textarea-navigator-input"
              />

              <Button
                onClick={() => sendMessage()}
                disabled={
                  (!input.trim() && attachedDocs.length === 0) || isStreaming
                }
                size="icon"
                className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 flex-shrink-0"
                data-testid="button-send-navigator"
                aria-label="Send message"
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-1.5">
              Attach multiple PDFs / .txt / .md files · Copy or download any
              response · Not a substitute for professional advice.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
