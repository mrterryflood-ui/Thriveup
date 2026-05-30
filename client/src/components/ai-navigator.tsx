import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Compass, Send, X, MessageSquarePlus, Trash2, ChevronLeft,
  Loader2, Sparkles, Phone, ExternalLink, AlertTriangle,
  History, Minimize2, Maximize2, Bot, User, Brain, ChevronDown, ChevronUp,
  Paperclip, Copy, Download, Check, FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NavigatorMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  deepThinking?: string;
  deepThinkingPending?: boolean;
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

const QUICK_PROMPTS = [
  { label: "I need housing help", icon: "🏠" },
  { label: "Help me find a job", icon: "💼" },
  { label: "I need food assistance", icon: "🍎" },
  { label: "Healthcare resources", icon: "🏥" },
  { label: "Legal help", icon: "⚖️" },
  { label: "Education programs", icon: "🎓" },
];

const NEED_COLORS: Record<string, string> = {
  housing: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  food: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  healthcare: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  employment: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  education: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  legal: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  financial: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  transportation: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
  "substance-abuse": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
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
          <span className="font-medium text-primary">{part.match(/^\d+/)?.[0]}.</span>
          <span>{renderInlineContent(part.replace(/^\d+\.\s/, ""))}</span>
        </div>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="block mt-2 mb-1">{part.slice(2, -2)}</strong>;
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

export function AINavigator() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [view, setView] = useState<"chat" | "history">("chat");
  const [messages, setMessages] = useState<NavigatorMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [deepThinkingExpanded, setDeepThinkingExpanded] = useState<Record<number, boolean>>({});
  const [attachedDocs, setAttachedDocs] = useState<AttachedDoc[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: conversations, refetch: refetchConversations } = useQuery<NavigatorConversation[]>({
    queryKey: ["/api/navigator/conversations"],
    enabled: isOpen,
  });

  const deleteConversation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/navigator/conversations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/navigator/conversations"] });
      toast({ title: "Conversation deleted", description: "The conversation has been removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to Delete", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversation = useCallback(async (convoId: string) => {
    try {
      const res = await fetch(`/api/navigator/conversations/${convoId}/messages`, { credentials: "include" });
      if (!res.ok) return;
      const msgs = await res.json();
      setMessages(msgs.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })));
      setActiveConversationId(convoId);
      setView("chat");
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  }, []);

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setActiveConversationId(null);
    setAttachedDocs([]);
    setView("chat");
  }, []);

  const copyMessage = useCallback(async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      toast({ title: "Could not copy", description: "Please select and copy the text manually.", variant: "destructive" });
    }
  }, [toast]);

  const downloadMessage = useCallback((text: string, idx: number) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `navigator-response-${idx + 1}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    // 80K chars ≈ 20K tokens — safely within Claude's 200K-token window even
    // with multiple docs attached. No artificial cap below this.
    const MAX_CHARS = 80_000;

    const addDoc = (name: string, rawText: string, type: "pdf" | "text") => {
      const text = rawText.slice(0, MAX_CHARS);
      setAttachedDocs(prev => {
        // Avoid duplicates by name
        if (prev.some(d => d.name === name)) return prev;
        return [...prev, { name, text, type, originalSize: rawText.length }];
      });
    };

    if (file.name.match(/\.(txt|md)$/i) || file.type === "text/plain" || file.type === "text/markdown") {
      const reader = new FileReader();
      reader.onload = (ev) => addDoc(file.name, (ev.target?.result as string) || "", "text");
      reader.readAsText(file);
      return;
    }

    if (file.name.match(/\.pdf$/i) || file.type === "application/pdf") {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/navigator/extract-text", { method: "POST", body: formData, credentials: "include" });
        if (!res.ok) throw new Error("Extraction failed");
        const { text, name } = await res.json();
        addDoc(name || file.name, text || "", "pdf");
      } catch {
        toast({ title: "Could not read PDF", description: "Try saving as a .txt file instead.", variant: "destructive" });
      }
      return;
    }

    toast({ title: "Unsupported file type", description: "Please upload a .pdf, .txt, or .md file.", variant: "destructive" });
  }, [toast]);

  const sendMessage = useCallback(async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isStreaming) return;

    // Capture the index of the assistant message we're about to create.
    // User msg goes at messages.length, assistant placeholder at messages.length + 1.
    const assistantIdx = messages.length + 1;

    const docContext = attachedDocs.length > 0
      ? attachedDocs.map(d => `[ATTACHED DOCUMENT: "${d.name}"]\n${d.text}`).join("\n\n---\n\n")
      : "";
    const apiText = docContext ? `${messageText}\n\n${docContext}` : messageText;
    const docLabel = attachedDocs.length > 0
      ? "\n\n" + attachedDocs.map(d => `📎 ${d.name}`).join("  ")
      : "";
    const displayText = messageText + docLabel;

    setMessages(prev => [
      ...prev,
      { role: "user", content: displayText },
      { role: "assistant", content: "" },
    ]);
    setInput("");
    setAttachedDocs([]);
    setIsStreaming(true);
    let fullText = "";  // hoisted so the catch block can inspect it

    try {
      const response = await fetch("/api/navigator/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: apiText, conversationId: activeConversationId }),
      });

      if (response.status === 401) {
        // Session expired — show a clear sign-in prompt rather than a generic error.
        setMessages(prev => {
          const updated = [...prev];
          if (updated[assistantIdx]) {
            updated[assistantIdx] = {
              ...updated[assistantIdx],
              content: "⚠️ Your session has expired. Please sign in to continue using the Navigator.",
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
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            try {
              const parsed = JSON.parse(line.slice(6));

              if (parsed.conversationId && !activeConversationId) {
                setActiveConversationId(parsed.conversationId);
              }

              if (parsed.error) {
                // Server-side AI failure — show a readable message rather than
                // letting the abrupt stream close bubble up as a network exception.
                setMessages(prev => {
                  const updated = [...prev];
                  if (updated[assistantIdx]) {
                    updated[assistantIdx] = {
                      ...updated[assistantIdx],
                      content: "I wasn't able to generate a response right now. The AI engines may be temporarily unavailable — please try again in a moment.",
                      deepThinkingPending: false,
                    };
                  }
                  return updated;
                });
                setIsStreaming(false);
                break;
              }

              if (parsed.content) {
                fullText += parsed.content;
                setMessages(prev => {
                  const updated = [...prev];
                  if (updated[assistantIdx]) {
                    updated[assistantIdx] = { ...updated[assistantIdx], content: fullText };
                  }
                  return updated;
                });
              }

              if (parsed.synthesisComplete) {
                // Fast engines done — unlock input so the user can re-prompt
                // while DeepSeek R1 continues its deep analysis in the background.
                setIsStreaming(false);
                setMessages(prev => {
                  const updated = [...prev];
                  if (updated[assistantIdx]) {
                    updated[assistantIdx] = { ...updated[assistantIdx], deepThinkingPending: true };
                  }
                  return updated;
                });
              }

              if (parsed.deepThinking) {
                setMessages(prev => {
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
                // Clear pending if R1 timed out without producing output
                setMessages(prev => {
                  const updated = [...prev];
                  if (updated[assistantIdx]) {
                    updated[assistantIdx] = { ...updated[assistantIdx], deepThinkingPending: false };
                  }
                  return updated;
                });
              }
            } catch {}
          }
        }
      }
    } catch {
      // Only replace content with an error if nothing was streamed yet.
      // If synthesis already completed (fullText has content), a connection
      // drop during the Phase-2 R1 wait is benign — don't overwrite good output.
      if (!fullText) {
        setMessages(prev => {
          const updated = [...prev];
          if (updated[assistantIdx]) {
            updated[assistantIdx] = {
              ...updated[assistantIdx],
              content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
              deepThinkingPending: false,
            };
          }
          return updated;
        });
      } else {
        // Connection dropped after synthesis — clear the pending R1 indicator
        setMessages(prev => {
          const updated = [...prev];
          if (updated[assistantIdx]) {
            updated[assistantIdx] = { ...updated[assistantIdx], deepThinkingPending: false };
          }
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, activeConversationId, messages, attachedDocs, refetchConversations]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 group"
        data-testid="button-open-navigator"
        aria-label="Open AI Navigator"
      >
        <Compass className="h-5 w-5 group-hover:rotate-45 transition-transform" />
        <span className="font-medium text-sm hidden sm:inline">Navigator</span>
      </button>
    );
  }

  const panelWidth = isExpanded ? "w-[600px]" : "w-[380px]";
  const panelHeight = isExpanded ? "h-[80vh]" : "h-[560px]";

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 ${panelWidth} ${panelHeight} flex flex-col bg-background border rounded-2xl shadow-2xl overflow-hidden transition-all duration-200`}
      data-testid="navigator-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5" />
          <div>
            <h3 className="font-semibold text-sm leading-tight">ThriveUp Navigator</h3>
            <p className="text-[10px] text-teal-100">Empathetic AI Resource Guide</p>
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
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            data-testid="button-toggle-expand"
            aria-label={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
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
            <p className="font-semibold text-base">Sign in to use the Navigator</p>
            <p className="text-sm text-muted-foreground mt-1">
              The Navigator is available to signed-in users. Your session may have expired.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = "/api/login"; }}
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
            <h4 className="font-medium text-sm" data-testid="text-history-title">Conversation History</h4>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {conversations && conversations.length > 0 ? (
                conversations.map(convo => (
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
                        <p className="font-medium text-sm truncate">{convo.title}</p>
                        {convo.summary && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{convo.summary}</p>
                        )}
                        {convo.identifiedNeeds && convo.identifiedNeeds.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {convo.identifiedNeeds.map(need => (
                              <Badge key={need} variant="secondary" className={`text-[10px] px-1.5 py-0 ${NEED_COLORS[need] || ""}`}>
                                {need}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {convo.lastMessageAt ? new Date(convo.lastMessageAt).toLocaleDateString() : ""}
                        </p>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation.mutate(convo.id);
                          if (activeConversationId === convo.id) startNewConversation();
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
                  <p className="text-xs mt-1">Start a conversation to see it here</p>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-3 border-t">
            <Button
              onClick={() => { startNewConversation(); setView("chat"); }}
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
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4" role="log" aria-live="polite" aria-label="Navigator conversation">
              {messages.length === 0 ? (
                <div className="space-y-4" data-testid="navigator-welcome">
                  <div className="text-center py-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900 dark:to-emerald-900 flex items-center justify-center mx-auto mb-3">
                      <Compass className="h-7 w-7 text-teal-600 dark:text-teal-400" />
                    </div>
                    <h4 className="font-semibold text-base" data-testid="text-navigator-welcome">Hi, I'm the Navigator</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      I'm here to help you find resources, connect with services, and navigate your next steps — whatever your situation.
                    </p>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-amber-800 dark:text-amber-200">
                        <p className="font-medium">If you're in crisis:</p>
                        <p className="mt-0.5">
                          <strong>988</strong> Suicide & Crisis Lifeline (call or text) |{" "}
                          <strong>911</strong> for emergencies |{" "}
                          Text <strong>HOME</strong> to <strong>741741</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quick start</p>
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
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} data-testid={`message-${msg.role}-${idx}`}>
                    {/* Message bubble row */}
                    <div className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
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
                          <div className="leading-relaxed">
                            {msg.content ? formatMessageContent(msg.content) : (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span className="text-xs text-muted-foreground">Thinking...</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="leading-relaxed whitespace-pre-wrap">{msg.content}</div>
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
                          {copiedIdx === idx
                            ? <Check className="h-3 w-3 text-green-500" />
                            : <Copy className="h-3 w-3" />}
                          <span>{copiedIdx === idx ? "Copied!" : "Copy"}</span>
                        </button>
                        <button
                          onClick={() => downloadMessage(msg.content, idx)}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-muted/50"
                          data-testid={`button-download-${idx}`}
                          aria-label="Download response"
                          title="Download as .txt"
                        >
                          <Download className="h-3 w-3" />
                          <span>Download</span>
                        </button>
                      </div>
                    )}

                    {/* Deep thinking pending indicator */}
                    {msg.role === "assistant" && msg.deepThinkingPending && (
                      <div className="ml-9 mt-1.5 flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400">
                        <Brain className="h-3 w-3 animate-pulse" />
                        <span>DeepSeek R1 is analyzing deeply — this takes ~30–60s</span>
                        <Loader2 className="h-3 w-3 animate-spin" />
                      </div>
                    )}

                    {/* Deep thinking expandable panel */}
                    {msg.role === "assistant" && msg.deepThinking && (
                      <div className="ml-9 mt-1.5">
                        <button
                          onClick={() => setDeepThinkingExpanded(prev => ({ ...prev, [idx]: !prev[idx] }))}
                          className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-200 transition-colors"
                          data-testid={`button-deep-thinking-${idx}`}
                        >
                          <Brain className="h-3 w-3" />
                          <span>DeepSeek R1 deep analysis</span>
                          {deepThinkingExpanded[idx] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                        {deepThinkingExpanded[idx] && (
                          <div className="mt-1.5 p-3 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 text-xs text-violet-900 dark:text-violet-100 leading-relaxed">
                            {formatMessageContent(msg.deepThinking)}
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
                  <div key={doc.name} className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-lg text-xs">
                    <FileText className="h-3.5 w-3.5 text-teal-600 flex-shrink-0" />
                    <span className="text-teal-800 dark:text-teal-200 truncate flex-1">
                      {doc.name}
                      <span className="text-teal-500 ml-1">
                        ({doc.originalSize > doc.text.length
                          ? `${Math.round(doc.text.length / 1000)}k of ${Math.round(doc.originalSize / 1000)}k chars`
                          : `${Math.round(doc.text.length / 1000)}k chars`})
                      </span>
                    </span>
                    <button
                      onClick={() => setAttachedDocs(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-teal-600 hover:text-teal-900 dark:hover:text-teal-100 transition-colors flex-shrink-0"
                      aria-label={`Remove ${doc.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
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
                placeholder={attachedDocs.length > 0 ? "What would you like me to do with these documents?" : "Tell me what you need help with..."}
                className="min-h-[40px] max-h-[100px] resize-none text-sm rounded-xl"
                rows={1}
                disabled={isStreaming}
                data-testid="textarea-navigator-input"
              />

              <Button
                onClick={() => sendMessage()}
                disabled={(!input.trim() && attachedDocs.length === 0) || isStreaming}
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
              Attach multiple PDFs / .txt / .md files · Copy or download any response · Not a substitute for professional advice.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
