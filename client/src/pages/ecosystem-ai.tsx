import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Send, Sparkles, Loader2, Bot, User, RefreshCw, ChevronRight, Zap, BookOpen, Database, Activity } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: Date;
  streaming?: boolean;
}

export default function EcosystemAIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { data: suggestions } = useQuery<{ questions: string[] }>({
    queryKey: ["/api/ecosystem-ai/suggested-questions"],
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStream = useCallback(async (query: string) => {
    if (isStreaming) return;
    setIsStreaming(true);

    setMessages(prev => [...prev, { role: "user", content: query, timestamp: new Date() }]);
    setInput("");

    setMessages(prev => [...prev, { role: "assistant", content: "", sources: [], timestamp: new Date(), streaming: true }]);

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/ecosystem-ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        throw new Error("Stream request failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      let sources: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.sources) {
              sources = data.sources;
            }
            if (data.content) {
              fullContent += data.content;
              setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last && last.role === "assistant") {
                  next[next.length - 1] = { ...last, content: fullContent, sources, streaming: true };
                }
                return next;
              });
            }
            if (data.done) {
              setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last && last.role === "assistant") {
                  next[next.length - 1] = { ...last, content: fullContent, sources, streaming: false };
                }
                return next;
              });
            }
            if (data.error) {
              setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last && last.role === "assistant") {
                  next[next.length - 1] = { ...last, content: "I had trouble processing that. Please try again.", streaming: false };
                }
                return next;
              });
            }
          } catch {}
        }
      }

      if (fullContent) {
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "assistant" && last.streaming) {
            next[next.length - 1] = { ...last, content: fullContent, sources, streaming: false };
          }
          return next;
        });
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "assistant") {
            next[next.length - 1] = { ...last, content: "Connection interrupted. Please try again.", streaming: false };
          }
          return next;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [isStreaming, messages.length]);

  function handleSubmit(query?: string) {
    const q = query || input.trim();
    if (!q || isStreaming) return;
    handleStream(q);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-violet-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-violet-950">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-3xl mx-auto w-full">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white dark:border-gray-900 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2" data-testid="text-ai-title">
            Ecosystem AI
          </h1>
          <p className="text-lg text-violet-600 dark:text-violet-400 font-medium mb-1">
            The Brain of the 20-Platform Ecosystem
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-8 max-w-lg text-sm">
            Real-time intelligence across every platform, grant, hub, and service.
            Powered by RAG with live compliance data, fidelity scores, and grant readiness.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8 w-full max-w-md">
            <div className="flex flex-col items-center p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <Database className="w-5 h-5 text-violet-500 mb-1" />
              <span className="text-xs font-semibold text-gray-900 dark:text-white">24 Platforms</span>
              <span className="text-[10px] text-gray-400">Connected</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <Activity className="w-5 h-5 text-green-500 mb-1" />
              <span className="text-xs font-semibold text-gray-900 dark:text-white">Live Data</span>
              <span className="text-[10px] text-gray-400">Real-time</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <BookOpen className="w-5 h-5 text-blue-500 mb-1" />
              <span className="text-xs font-semibold text-gray-900 dark:text-white">5 Grants</span>
              <span className="text-[10px] text-gray-400">$3.375M</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-8">
            {(suggestions?.questions || []).slice(0, 8).map((q, i) => (
              <button
                key={i}
                onClick={() => handleSubmit(q)}
                className="text-left p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-md transition-all group"
                data-testid={`button-suggested-question-${i}`}
              >
                <div className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-violet-500 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{q}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Sparkles className="w-3 h-3" />
            <span>RAG intelligence with live ecosystem data, MAP-GAP framework, and grant readiness scoring</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4 space-y-4 max-w-3xl mx-auto w-full">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === "user" ? "order-first" : ""}`}>
                <div className={`rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-violet-600 text-white rounded-br-md"
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-md shadow-sm"
                }`} data-testid={`message-${msg.role}-${i}`}>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                    {msg.streaming && <span className="inline-block w-2 h-4 bg-violet-500 ml-1 animate-pulse rounded-sm" />}
                  </div>
                </div>
                {msg.sources && msg.sources.length > 0 && !msg.streaming && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {msg.sources.map((s, j) => (
                      <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {!msg.streaming && (
                  <div className="text-[10px] text-gray-400 mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </div>
              )}
            </div>
          ))}

          {isStreaming && messages[messages.length - 1]?.content === "" && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing ecosystem data...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about platforms, grants, services, compliance, MAP-GAP..."
                className="resize-none pr-12 min-h-[44px] max-h-[120px] rounded-xl border-gray-200 dark:border-gray-700 focus:border-violet-400 dark:focus:border-violet-500"
                rows={1}
                data-testid="input-ai-query"
              />
            </div>
            <Button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isStreaming}
              className="h-[44px] w-[44px] rounded-xl bg-violet-600 hover:bg-violet-700 p-0"
              data-testid="button-send-query"
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] text-gray-400">
              <Sparkles className="w-3 h-3 inline mr-1" />
              RAG intelligence with live ecosystem data — streaming responses
            </p>
            {messages.length > 0 && (
              <button
                onClick={() => { setMessages([]); if (abortRef.current) abortRef.current.abort(); }}
                className="text-[10px] text-gray-400 hover:text-violet-500 flex items-center gap-1"
                data-testid="button-clear-chat"
              >
                <RefreshCw className="w-3 h-3" />
                New chat
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
