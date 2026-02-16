import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Send, Bot, User, GraduationCap, Zap, Brain, Heart, Flame, Moon, Trash2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AICompanionProps {
  subject?: string;
  lessonContext?: string;
  className?: string;
  language?: string;
}

const GRADE_LEVELS = ["3-5", "6-8", "9-12"];

const MOOD_OPTIONS = [
  { value: "focused", label: "Focused", labelEs: "Enfocado/a", icon: Brain },
  { value: "curious", label: "Curious", labelEs: "Curioso/a", icon: Zap },
  { value: "frustrated", label: "Frustrated", labelEs: "Frustrado/a", icon: Flame },
  { value: "excited", label: "Excited", labelEs: "Emocionado/a", icon: Sparkles },
  { value: "tired", label: "Tired", labelEs: "Cansado/a", icon: Moon },
];

const QUICK_PROMPTS: Record<string, Array<{label: string; prefix: string}>> = {
  en: [
    { label: "Help me understand", prefix: "I'm having trouble understanding this. Can you help me? " },
    { label: "Quiz me", prefix: "Can you quiz me on what I've been learning? " },
    { label: "Real world example", prefix: "Can you give me a real-world example of how this works? " },
    { label: "Explain simpler", prefix: "Can you explain that in a simpler way? " },
    { label: "I'm stuck", prefix: "I'm stuck and don't know where to start. Can you help me break this down? " },
  ],
  es: [
    { label: "Ayudame a entender", prefix: "Tengo problemas para entender esto. Puedes ayudarme? " },
    { label: "Hazme un quiz", prefix: "Puedes hacerme un quiz sobre lo que he aprendido? " },
    { label: "Ejemplo real", prefix: "Puedes darme un ejemplo del mundo real de como funciona esto? " },
    { label: "Explica mas simple", prefix: "Puedes explicar eso de una manera mas simple? " },
    { label: "Estoy atascado/a", prefix: "Estoy atascado/a y no se por donde empezar. Puedes ayudarme? " },
  ],
};

const WELCOME_EN: Message = {
  role: "assistant",
  content: "Hey there, Panther! I'm Spark, your learning companion. I'm here to help you explore, think, and grow. What's on your mind today?",
};

const WELCOME_ES: Message = {
  role: "assistant",
  content: "Hola, Pantera! Soy Spark, tu companero de aprendizaje. Estoy aqui para ayudarte a explorar, pensar y crecer. Que tienes en mente hoy?",
};

export default function AICompanion({ subject, lessonContext, className, language = "en" }: AICompanionProps) {
  const welcomeMsg = language === "es" ? WELCOME_ES : WELCOME_EN;
  const [messages, setMessages] = useState<Message[]>([welcomeMsg]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [gradeLevel, setGradeLevel] = useState("6-8");
  const [mood, setMood] = useState<string | null>(null);
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

    let fullMessage = trimmed;
    if (mood) {
      const moodLabel = MOOD_OPTIONS.find(m => m.value === mood)?.label || mood;
      fullMessage = `[I'm feeling ${moodLabel.toLowerCase()} right now] ${trimmed}`;
    }

    const userMessage: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    if (!overrideMessage) setInput("");
    setIsLoading(true);

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const history = messages.filter(m => m.content).map(m => ({ role: m.role, content: m.content }));

      const response = await fetch("/api/ai-companion/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: fullMessage,
          gradeLevel,
          subject,
          lessonContext,
          conversationHistory: history,
          language,
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
    setMood(null);
  };

  const prompts = QUICK_PROMPTS[language === "es" ? "es" : "en"];

  return (
    <Card className={`flex flex-col ${className || "h-[500px]"}`}>
      <div className="flex items-center justify-between gap-2 p-3 border-b flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md" style={{ background: "#800000" }}>
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold">Spark</span>
          {mood && (
            <Badge variant="secondary" className="text-xs" data-testid="badge-mood">
              {MOOD_OPTIONS.find(m => m.value === mood)?.[language === "es" ? "labelEs" : "label"]}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={mood || ""} onValueChange={(v) => setMood(v || null)}>
            <SelectTrigger className="w-[130px]" data-testid="select-mood" aria-label={language === "es" ? "Como te sientes?" : "How are you feeling?"}>
              <Heart className="h-3 w-3 mr-1" />
              <SelectValue placeholder={language === "es" ? "Como estas?" : "How I feel"} />
            </SelectTrigger>
            <SelectContent>
              {MOOD_OPTIONS.map((m) => (
                <SelectItem key={m.value} value={m.value} data-testid={`mood-${m.value}`}>
                  <span className="flex items-center gap-1"><m.icon className="h-3 w-3" />{language === "es" ? m.labelEs : m.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={gradeLevel} onValueChange={setGradeLevel}>
            <SelectTrigger className="w-[100px]" data-testid="select-grade-level" aria-label={language === "es" ? "Nivel de grado" : "Grade level"}>
              <GraduationCap className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRADE_LEVELS.map((level) => (
                <SelectItem key={level} value={level} data-testid={`select-grade-${level}`}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="icon" variant="ghost" onClick={clearChat} data-testid="button-clear-chat" aria-label={language === "es" ? "Limpiar chat" : "Clear chat"}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4" data-testid="container-messages" role="log" aria-label={language === "es" ? "Mensajes del chat" : "Chat messages"} aria-live="polite">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            data-testid={`message-${msg.role}-${i}`}
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
          <div className="flex items-center gap-1 pl-10" aria-label={language === "es" ? "Spark esta pensando" : "Spark is thinking"}>
            <span className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-primary/60 animate-pulse [animation-delay:0.2s]" />
            <span className="w-2 h-2 rounded-full bg-primary/60 animate-pulse [animation-delay:0.4s]" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {messages.length <= 2 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5" data-testid="section-quick-prompts">
          {prompts.map((p, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              onClick={() => sendMessage(p.prefix)}
              disabled={isLoading}
              data-testid={`button-quick-prompt-${i}`}
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
            placeholder={language === "es" ? "Preguntale algo a Spark..." : "Ask Spark anything..."}
            disabled={isLoading}
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
            data-testid="input-chat-message"
            aria-label={language === "es" ? "Escribe tu mensaje" : "Type your message"}
          />
          <Button
            size="icon"
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            data-testid="button-send-message"
            aria-label={language === "es" ? "Enviar mensaje" : "Send message"}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
