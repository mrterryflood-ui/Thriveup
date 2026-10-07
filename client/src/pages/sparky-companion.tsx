import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Bot, User, Briefcase, BookOpen, Users, Settings, Trash2, Heart, Wand2, ShieldAlert, History, Plus, ChevronLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SparkySessionInfo {
  id: string;
  title: string;
  context: string;
  language: string;
  lastMessageAt: string;
  createdAt: string;
}

const CONTEXT_OPTIONS = [
  { value: "general", label: "General Support", labelEs: "Apoyo General", icon: Heart },
  { value: "academic", label: "Academic Help", labelEs: "Ayuda Academica", icon: BookOpen },
  { value: "career", label: "Career & Workforce", labelEs: "Carrera y Empleo", icon: Briefcase },
  { value: "parenting", label: "Parenting Support", labelEs: "Apoyo para Padres", icon: Users },
  { value: "classroom", label: "Classroom Management", labelEs: "Gestion del Aula", icon: Settings },
];

const QUICK_PROMPTS: Record<string, Array<{ label: string; prefix: string }>> = {
  en: [
    { label: "Career guidance", prefix: "I'm looking for career guidance. Can you help me explore workforce opportunities and next steps? " },
    { label: "Resume help", prefix: "Can you help me with my resume? I need advice on presenting my skills and experience effectively. " },
    { label: "Understand Thrive scores", prefix: "Can you help me understand what Thrive scores mean and how to interpret them? " },
    { label: "Community resources", prefix: "What community resources are available to help me with my current situation? " },
    { label: "Support a learner", prefix: "I'm supporting a learner who is struggling. What strategies do you recommend? " },
    { label: "Self-care strategies", prefix: "I'm feeling burned out. What self-care strategies do you recommend? " },
    { label: "Explore the platform", prefix: "Can you explain the key features of the platform and how to make the most of them? " },
  ],
  es: [
    { label: "Orientacion profesional", prefix: "Estoy buscando orientacion profesional. Puedes ayudarme a explorar oportunidades laborales y proximos pasos? " },
    { label: "Ayuda con curriculum", prefix: "Puedes ayudarme con mi curriculum? Necesito consejos para presentar mis habilidades y experiencia. " },
    { label: "Entender puntajes Thrive", prefix: "Puedes ayudarme a entender que significan los puntajes Thrive y como interpretarlos? " },
    { label: "Recursos comunitarios", prefix: "Que recursos comunitarios estan disponibles para ayudarme con mi situacion actual? " },
    { label: "Apoyar a un alumno", prefix: "Estoy apoyando a un alumno que esta luchando. Que estrategias recomiendas? " },
    { label: "Autocuidado", prefix: "Me siento agotado/a. Que estrategias de autocuidado recomiendas? " },
    { label: "Explorar la plataforma", prefix: "Puedes explicar las funciones clave de la plataforma y como aprovecharlas al maximo? " },
  ],
};

const WELCOME_EN: Message = {
  role: "assistant",
  content: "Hello! I'm Sparky, your companion at ThriveUp. Whether you're a parent, teacher, returning citizen, veteran, career changer, or community leader — I'm here to help with career guidance, workforce resources, learner support, and navigating the platform. How can I assist you today?",
};

const WELCOME_ES: Message = {
  role: "assistant",
  content: "Hola! Soy Sparky, tu companero en ThriveUp. Ya seas padre, maestro, ciudadano en reintegracion, veterano, profesional en transicion o lider comunitario — estoy aqui para ayudarte con orientacion profesional, recursos laborales, apoyo al aprendizaje y navegacion de la plataforma. Como puedo ayudarte hoy?",
};

const STORAGE_KEY = "sparky_messages_v1";

function formatRelativeTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString();
}

export default function SparkyCompanionPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const welcomeMsg = language === "es" ? WELCOME_ES : WELCOME_EN;
  const [messages, setMessages] = useState<Message[]>([welcomeMsg]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState("");
  const [context, setContext] = useState("general");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [view, setView] = useState<"chat" | "history">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: sessions, refetch: refetchSessions } = useQuery<SparkySessionInfo[]>({
    queryKey: ["/api/sparky/sessions"],
    enabled: !!user,
  });

  const deleteSession = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/sparky/sessions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/sparky/sessions"] }),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setMessages([language === "es" ? WELCOME_ES : WELCOME_EN]);
  }, [language]);

  // Restore from localStorage on mount (non-auth or before DB loads)
  useEffect(() => {
    if (!user) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
        } catch {}
      }
    }
  }, [user]);

  // Auto-resume most recent DB session when sessions load
  useEffect(() => {
    if (user && sessions && sessions.length > 0 && !activeSessionId && messages.length <= 1) {
      loadSession(sessions[0].id);
    }
  }, [user, sessions]);

  // Save to localStorage after every exchange (works even if DB isn't available)
  useEffect(() => {
    if (messages.length > 1) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-100))); } catch {}
    }
  }, [messages]);

  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sparky/sessions/${sessionId}/messages`, { credentials: "include" });
      if (!res.ok) return;
      const msgs = await res.json();
      const welcome = language === "es" ? WELCOME_ES : WELCOME_EN;
      setMessages([welcome, ...msgs.map((m: { role: string; content: string }) => ({ role: m.role as "user" | "assistant", content: m.content }))]);
      setActiveSessionId(sessionId);
      setSendError(false);
      setLastFailedMessage("");
      setView("chat");
    } catch (err) {
      console.error("Failed to load session:", err);
    }
  }, [language]);

  const startNewSession = useCallback(() => {
    setMessages([language === "es" ? WELCOME_ES : WELCOME_EN]);
    setActiveSessionId(null);
    setSendError(false);
    setLastFailedMessage("");
    setView("chat");
  }, [language]);

  const sendMessage = async (overrideMessage?: string) => {
    const trimmed = (overrideMessage || input).trim();
    if (!trimmed || isLoading) return;
    setSendError(false);

    const contextLabel = CONTEXT_OPTIONS.find(c => c.value === context)?.label || context;
    const fullMessage = `[Context: ${contextLabel}] ${trimmed}`;

    const userMessage: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    if (!overrideMessage) setInput("");
    setIsLoading(true);

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const history = messages.filter(m => m.content).map(m => ({ role: m.role, content: m.content }));

      const response = await fetch("/api/sparky/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: fullMessage,
          context,
          conversationHistory: history,
          language,
          userName: user?.firstName || undefined,
          sessionId: activeSessionId,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.sessionId && !activeSessionId) {
                setActiveSessionId(parsed.sessionId);
              }
              if (parsed.content) {
                accumulated += parsed.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: accumulated };
                  return updated;
                });
              }
              if (parsed.done) {
                refetchSessions();
              }
            } catch {}
          }
        }
      }

      if (!accumulated) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: language === "es"
              ? "Lo siento, no pude generar una respuesta. Por favor intenta de nuevo."
              : "I'm sorry, I wasn't able to respond. Please try again.",
          };
          return updated;
        });
      }
    } catch {
      setSendError(true);
      setLastFailedMessage(trimmed);
      toast({
        title: language === "es" ? "No se pudo enviar el mensaje" : "Message failed to send",
        description: language === "es" ? "Comprueba tu conexion e intentalo de nuevo." : "Check your connection and try again.",
        variant: "destructive",
      });
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: language === "es"
            ? "Algo salio mal. Por favor intenta de nuevo en un momento."
            : "Something went wrong. Please try again in a moment.",
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([language === "es" ? WELCOME_ES : WELCOME_EN]);
    setActiveSessionId(null);
    setSendError(false);
    setLastFailedMessage("");
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const prompts = QUICK_PROMPTS[language === "es" ? "es" : "en"];
  const selectedContext = CONTEXT_OPTIONS.find(c => c.value === context);

  useEffect(() => { document.title = "Sparky AI Companion | ThriveUp"; }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-sparky-companion-heading">
          <MessageCircle className="h-7 w-7" style={{ color: "#800000" }} />
          {language === "es" ? "Sparky — Companero para Adultos" : "Sparky — Adult Companion"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {language === "es"
            ? "Sparky esta aqui para apoyar a padres, maestros y administradores con orientacion, estrategias y navegacion de la plataforma."
            : "Sparky is here to support parents, teachers, and administrators with guidance, strategies, and platform navigation."}
        </p>
        <Link href="/ai-tools?mode=adult">
          <Button variant="outline" size="sm" className="mt-2" data-testid="button-sparky-ai-tools">
            <Wand2 className="h-3.5 w-3.5 mr-1.5" />
            {language === "es" ? "Abrir herramientas de IA" : "Open AI Creation Tools"}
          </Button>
        </Link>
      </div>

      <Card className="flex flex-col h-[calc(100vh-220px)]">
        <div className="flex items-center justify-between gap-2 p-3 border-b flex-wrap">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md" style={{ background: "#800000" }}>
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">Sparky</span>
            {view === "chat" && selectedContext && (
              <Badge variant="secondary" className="text-xs" data-testid="badge-context">
                {language === "es" ? selectedContext.labelEs : selectedContext.label}
              </Badge>
            )}
            {view === "chat" && activeSessionId && (
              <Badge variant="outline" className="text-xs text-muted-foreground" data-testid="badge-session-saved">
                {language === "es" ? "Guardado" : "Saved"}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {view === "chat" && (
              <>
                <Select value={context} onValueChange={setContext}>
                  <SelectTrigger className="w-[180px]" data-testid="select-context" aria-label={language === "es" ? "Seleccionar contexto" : "Select context"}>
                    <Briefcase className="h-3 w-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTEXT_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value} data-testid={`context-${c.value}`}>
                        <span className="flex items-center gap-1">
                          <c.icon className="h-3 w-3" />
                          {language === "es" ? c.labelEs : c.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={startNewSession}
                  data-testid="button-sparky-new-chat"
                  title={language === "es" ? "Nueva conversacion" : "New conversation"}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={clearChat}
                  data-testid="button-clear-sparky-chat"
                  aria-label={language === "es" ? "Limpiar chat" : "Clear chat"}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            {user && (
              <Button
                size="icon"
                variant={view === "history" ? "secondary" : "ghost"}
                onClick={() => setView(v => v === "history" ? "chat" : "history")}
                data-testid="button-sparky-history"
                title={language === "es" ? "Historial de conversaciones" : "Conversation history"}
              >
                <History className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {view === "history" ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center gap-2 p-3 border-b">
              <Button variant="ghost" size="sm" onClick={() => setView("chat")} data-testid="button-sparky-back-to-chat">
                <ChevronLeft className="h-4 w-4 mr-1" />
                {language === "es" ? "Volver al chat" : "Back to chat"}
              </Button>
              <span className="text-sm font-medium text-muted-foreground">
                {language === "es" ? "Conversaciones guardadas" : "Saved conversations"}
              </span>
            </div>
            <ScrollArea className="flex-1 p-3">
              {!sessions || sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <History className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm">
                    {language === "es"
                      ? "No hay conversaciones guardadas aun."
                      : "No saved conversations yet."}
                  </p>
                  <p className="text-xs mt-1">
                    {language === "es"
                      ? "Tus proximas conversaciones apareceran aqui."
                      : "Your next conversations will appear here."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2" data-testid="list-sparky-sessions">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`group flex items-start justify-between gap-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer ${session.id === activeSessionId ? "bg-muted border-primary/40" : ""}`}
                      onClick={() => loadSession(session.id)}
                      data-testid={`session-item-${session.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{session.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{formatRelativeTime(session.lastMessageAt)}</span>
                          {session.context && session.context !== "general" && (
                            <Badge variant="secondary" className="text-xs py-0 px-1">
                              {CONTEXT_OPTIONS.find(c => c.value === session.context)?.[language === "es" ? "labelEs" : "label"] || session.context}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={(e) => { e.stopPropagation(); deleteSession.mutate(session.id); }}
                        data-testid={`button-delete-session-${session.id}`}
                        title={language === "es" ? "Eliminar conversacion" : "Delete conversation"}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="p-3 border-t">
              <Button
                className="w-full"
                onClick={startNewSession}
                data-testid="button-sparky-new-chat-from-history"
              >
                <Plus className="h-4 w-4 mr-2" />
                {language === "es" ? "Nueva conversacion" : "New Conversation"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto p-4 space-y-4" data-testid="container-sparky-messages" role="log" aria-label={language === "es" ? "Mensajes del chat" : "Chat messages"} aria-live="polite">
              {messages.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground" data-testid="text-sparky-empty-state">
                  Ask Sparky anything about your trade training to get started.
                </p>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  data-testid={`sparky-message-${msg.role}-${i}`}
                >
                  {msg.role === "assistant" && (
                    <div className="rounded-md p-1.5 shrink-0 mt-0.5" style={{ background: "rgba(128,0,0,0.1)" }}>
                      <Bot className="h-4 w-4" style={{ color: "#800000" }} />
                    </div>
                  )}
                  <div
                    className={`rounded-md px-3 py-2 max-w-[80%] text-sm whitespace-pre-wrap ${
                      msg.role === "assistant" ? "bg-primary/10" : "bg-muted"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="rounded-md p-1.5 bg-muted shrink-0 mt-0.5">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.content === "" && (
                <div className="flex items-center gap-1 pl-10" aria-label={language === "es" ? "Sparky esta pensando" : "Sparky is thinking"}>
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" />
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-pulse [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-pulse [animation-delay:0.4s]" />
                </div>
              )}

              {sendError && (
                <div
                  className="flex items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                  data-testid="banner-sparky-send-error"
                >
                  <span>
                    {language === "es"
                      ? "No se pudo enviar tu mensaje. Comprueba tu conexion e intentalo de nuevo."
                      : "Your message could not be sent. Check your connection and try again."}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Remove the failed user turn + error placeholder so the
                      // retry replaces the failed turn instead of duplicating it.
                      setMessages((prev) => prev.slice(0, Math.max(0, prev.length - 2)));
                      setSendError(false);
                      sendMessage(lastFailedMessage);
                    }}
                    disabled={isLoading}
                    aria-label={language === "es" ? "Reintentar el ultimo mensaje" : "Retry last message"}
                    data-testid="button-sparky-retry-message"
                  >
                    {language === "es" ? "Reintentar" : "Retry"}
                  </Button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {messages.length <= 2 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5" data-testid="section-sparky-quick-prompts">
                {prompts.map((p, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage(p.prefix)}
                    disabled={isLoading}
                    data-testid={`button-sparky-quick-prompt-${i}`}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            )}

            <div className="p-3 border-t">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={language === "es" ? "Preguntale algo a Sparky..." : "Ask Sparky anything..."}
                  disabled={isLoading}
                  className="flex-1 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                  data-testid="input-sparky-chat-message"
                  aria-label={language === "es" ? "Escribe tu mensaje" : "Type your message"}
                />
                <Button
                  size="icon"
                  onClick={() => sendMessage()}
                  disabled={isLoading || !input.trim()}
                  data-testid="button-sparky-send-message"
                  aria-label={language === "es" ? "Enviar mensaje" : "Send message"}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground" data-testid="disclaimer-ai-mistakes">
                {language === "es"
                  ? "La IA puede cometer errores — verifica los datos importantes."
                  : "AI can make mistakes — verify important facts."}
              </p>
              <div
                className="mt-2 flex items-start gap-2 rounded-md border bg-muted/50 px-3 py-2 text-xs text-muted-foreground"
                data-testid="banner-sparky-privacy-disclosure"
              >
                <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <p>
                  {language === "es"
                    ? <><strong>Privacidad:</strong> Tu conversacion con Sparky es privada y se guarda en tu cuenta. <strong>Una excepcion:</strong> si dices que vas a hacerte dano o lastimar a alguien, avisamos a nuestro equipo. Llama al <strong>988</strong> o <strong>911</strong> si hay peligro inmediato. <Link href="/privacy" className="underline" data-testid="link-sparky-privacy">Politica</Link>.</>
                    : <><strong>Privacy:</strong> Your conversation with Sparky is saved to your account. <strong>One exception:</strong> if you say you're going to hurt yourself or someone else, we alert our care team. Call <strong>988</strong> or <strong>911</strong> if in immediate danger. <Link href="/privacy" className="underline" data-testid="link-sparky-privacy">Policy</Link>.</>}
                </p>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
