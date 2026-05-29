import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Compass, Send, X, MessageSquarePlus, Trash2, ChevronLeft,
  Loader2, Sparkles, Phone, ExternalLink, AlertTriangle,
  History, Minimize2, Maximize2, Bot, User, Brain, ChevronDown, ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NavigatorMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  deepThinking?: string;
}

interface NavigatorConversation {
  id: string;
  title: string;
  summary?: string;
  identifiedNeeds?: string[];
  lastMessageAt?: string;
  createdAt?: string;
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
  const phoneRegex = /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|1[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\d{3})/g;
  const urlRegex = /(https?:\/\/[^\s,)]+)/g;

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
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [view, setView] = useState<"chat" | "history">("chat");
  const [messages, setMessages] = useState<NavigatorMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [deepThinkingExpanded, setDeepThinkingExpanded] = useState<Record<number, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      const res = await fetch(`/api/navigator/conversations/${convoId}/messages`);
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
    setView("chat");
  }, []);

  const sendMessage = useCallback(async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isStreaming) return;

    const userMsg: NavigatorMessage = { role: "user", content: messageText };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    const assistantMsg: NavigatorMessage = { role: "assistant", content: "" };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const response = await fetch("/api/navigator/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          conversationId: activeConversationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              try {
                const parsed = JSON.parse(data);
                if (parsed.conversationId && !activeConversationId) {
                  setActiveConversationId(parsed.conversationId);
                }
                if (parsed.content) {
                  fullText += parsed.content;
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { ...updated[updated.length - 1], role: "assistant", content: fullText };
                    return updated;
                  });
                }
                if (parsed.deepThinking) {
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { ...updated[updated.length - 1], deepThinking: parsed.deepThinking };
                    return updated;
                  });
                }
                if (parsed.done) {
                  refetchConversations();
                }
              } catch {
              }
            }
          }
        }
      }
    } catch (error) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, activeConversationId, messages, refetchConversations]);

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
  const panelHeight = isExpanded ? "h-[80vh]" : "h-[550px]";

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 ${panelWidth} ${panelHeight} flex flex-col bg-background border rounded-2xl shadow-2xl overflow-hidden transition-all duration-200`}
      data-testid="navigator-panel"
    >
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

      {view === "history" ? (
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
                          <div className="leading-relaxed">{msg.content}</div>
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </div>

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

          <div className="p-3 border-t bg-background">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tell me what you need help with..."
                className="min-h-[40px] max-h-[100px] resize-none text-sm rounded-xl"
                rows={1}
                disabled={isStreaming}
                data-testid="textarea-navigator-input"
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isStreaming}
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
              Navigator connects you to real resources. Not a substitute for professional advice.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
