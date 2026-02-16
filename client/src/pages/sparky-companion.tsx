import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Send, Bot, User, Briefcase, BookOpen, Users, Settings, Trash2, Heart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/lib/i18n";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CONTEXT_OPTIONS = [
  { value: "general", label: "General Support", labelEs: "Apoyo General", icon: Heart },
  { value: "academic", label: "Academic Help", labelEs: "Ayuda Academica", icon: BookOpen },
  { value: "parenting", label: "Parenting Support", labelEs: "Apoyo para Padres", icon: Users },
  { value: "classroom", label: "Classroom Management", labelEs: "Gestion del Aula", icon: Settings },
];

const QUICK_PROMPTS: Record<string, Array<{ label: string; prefix: string }>> = {
  en: [
    { label: "Understand Thrive scores", prefix: "Can you help me understand what Thrive scores mean and how to interpret them for my student? " },
    { label: "Homework battles", prefix: "I'm dealing with homework battles at home. What strategies can help? " },
    { label: "Interpret progress reports", prefix: "Can you help me interpret my student's progress report and identify areas to focus on? " },
    { label: "Support struggling students", prefix: "I have a student who is struggling academically and emotionally. What support strategies do you recommend? " },
    { label: "Self-care strategies", prefix: "As an educator/parent, I'm feeling burned out. What self-care strategies do you recommend? " },
    { label: "Explain Academy features", prefix: "Can you explain the key features of the Academy platform and how to make the most of them? " },
  ],
  es: [
    { label: "Entender puntajes Thrive", prefix: "Puedes ayudarme a entender que significan los puntajes Thrive y como interpretarlos para mi estudiante? " },
    { label: "Batallas con la tarea", prefix: "Estoy lidiando con batallas de tarea en casa. Que estrategias pueden ayudar? " },
    { label: "Interpretar reportes", prefix: "Puedes ayudarme a interpretar el reporte de progreso de mi estudiante e identificar areas de enfoque? " },
    { label: "Apoyar estudiantes", prefix: "Tengo un estudiante que esta luchando academica y emocionalmente. Que estrategias de apoyo recomiendas? " },
    { label: "Autocuidado", prefix: "Como educador/padre, me siento agotado/a. Que estrategias de autocuidado recomiendas? " },
    { label: "Funciones de Academy", prefix: "Puedes explicar las funciones clave de la plataforma Academy y como aprovecharlas al maximo? " },
  ],
};

const WELCOME_EN: Message = {
  role: "assistant",
  content: "Hello! I'm Sparky, your adult companion for the Academy. Whether you're a parent, teacher, or administrator, I'm here to help you support your students and navigate the platform. How can I assist you today?",
};

const WELCOME_ES: Message = {
  role: "assistant",
  content: "Hola! Soy Sparky, tu companero para adultos en la Academia. Ya seas padre, maestro o administrador, estoy aqui para ayudarte a apoyar a tus estudiantes y navegar la plataforma. Como puedo ayudarte hoy?",
};

export default function SparkyCompanionPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const welcomeMsg = language === "es" ? WELCOME_ES : WELCOME_EN;
  const [messages, setMessages] = useState<Message[]>([welcomeMsg]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState("general");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setMessages([language === "es" ? WELCOME_ES : WELCOME_EN]);
  }, [language]);

  const sendMessage = async (overrideMessage?: string) => {
    const trimmed = (overrideMessage || input).trim();
    if (!trimmed || isLoading) return;

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
        body: JSON.stringify({
          message: fullMessage,
          context,
          conversationHistory: history,
          language,
          userName: user?.firstName || undefined,
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
              if (parsed.content) {
                accumulated += parsed.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: accumulated };
                  return updated;
                });
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
  };

  const prompts = QUICK_PROMPTS[language === "es" ? "es" : "en"];
  const selectedContext = CONTEXT_OPTIONS.find(c => c.value === context);

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
      </div>

      <Card className="flex flex-col h-[calc(100vh-220px)]">
        <div className="flex items-center justify-between gap-2 p-3 border-b flex-wrap">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md" style={{ background: "#800000" }}>
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">Sparky</span>
            {selectedContext && (
              <Badge variant="secondary" className="text-xs" data-testid="badge-context">
                {language === "es" ? selectedContext.labelEs : selectedContext.label}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
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
            <Button size="icon" variant="ghost" onClick={clearChat} data-testid="button-clear-sparky-chat" aria-label={language === "es" ? "Limpiar chat" : "Clear chat"}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4" data-testid="container-sparky-messages" role="log" aria-label={language === "es" ? "Mensajes del chat" : "Chat messages"} aria-live="polite">
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
        </div>
      </Card>
    </div>
  );
}
