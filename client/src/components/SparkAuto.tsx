import { useState, useEffect, useRef } from "react";
import { Sparkles, X, Send } from "lucide-react";

interface SparkAutoProps {
  lessonTitle: string;
  lessonContent: string;
  triggerSpark?: boolean;
  sparkContext?: string;
  gradeLevel?: "3-5" | "6-8" | "9-12" | "adult";
  language?: "en" | "es";
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function SparkAuto({
  lessonTitle,
  lessonContent,
  triggerSpark = false,
  sparkContext,
  gradeLevel = "adult",
  language = "en",
}: SparkAutoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [autoTriggered, setAutoTriggered] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (triggerSpark && !autoTriggered) {
      setIsOpen(true);
      setAutoTriggered(true);
      setMessages([{
        role: "assistant",
        content: language === "es"
          ? "Vi que tuviste algunas dificultades con el cuestionario. Déjame ayudarte con los conceptos específicos que necesitas repasar."
          : "I noticed you had some difficulty with the quiz. Let me help you work through the specific concepts you need to review.",
      }]);
    }
  }, [triggerSpark, autoTriggered, language]);

  const lessonContextFull = lessonTitle + ": " + lessonContent.substring(0, 800);
  const effectiveContext = sparkContext
    ? sparkContext + "\n\nLesson context: " + lessonContextFull
    : lessonContextFull;

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    const userMsg: Message = { role: "user", content: userMessage };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/ai-companion/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          gradeLevel,
          lessonContext: effectiveContext,
          conversationHistory: newMessages.map((m) => ({ role: m.role, content: m.content })),
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
              ? "Lo siento, algo salió mal. Intenta de nuevo."
              : "I'm having trouble connecting right now. Try again in a moment.",
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
            ? "Algo salió mal. Por favor intenta de nuevo."
            : "Something went wrong. Please try again in a moment.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        data-testid="button-open-spark-auto"
        className="w-full flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors text-sm font-medium"
      >
        <Sparkles className="h-4 w-4" />
        {language === "es" ? "¿Necesitas ayuda? Pregúntale a Spark" : "Need help? Ask Spark"}
      </button>
    );
  }

  const isAutoPulled = autoTriggered && triggerSpark;

  return (
    <div
      data-testid="container-spark-auto"
      className={`flex flex-col rounded-xl border shadow-lg overflow-hidden ${
        isAutoPulled ? "border-orange-300" : "border-purple-200"
      }`}
      style={{ height: 400 }}
    >
      <div className={`flex items-center justify-between px-4 py-3 border-b ${
        isAutoPulled ? "bg-orange-50 border-orange-200" : "bg-purple-50 border-purple-100"
      }`}>
        <div className="flex items-center gap-2">
          <Sparkles className={`h-4 w-4 ${isAutoPulled ? "text-orange-600" : "text-purple-600"}`} />
          <span className="text-sm font-semibold text-gray-800">
            Spark
            {isAutoPulled && (
              <span className="ml-2 text-xs font-normal text-orange-600">
                — Let's review what you missed
              </span>
            )}
          </span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          data-testid="button-close-spark-auto"
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        data-testid="container-spark-messages"
        role="log"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <p className="text-sm text-gray-500 text-center mt-8">
            {language === "es"
              ? "¡Hola! Soy Spark. ¿En qué puedo ayudarte?"
              : "Hi! I'm Spark. What can I help you with today?"}
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-xs rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-purple-600 text-white"
                : isAutoPulled ? "bg-orange-50 text-gray-800 border border-orange-100" : "bg-gray-100 text-gray-800"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.content === "" && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 px-4 py-3 border-t">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder={language === "es" ? "Escribe tu pregunta…" : "Ask Spark anything…"}
          disabled={loading}
          data-testid="input-spark-auto-message"
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-50"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          data-testid="button-spark-auto-send"
          className="px-3 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-40 hover:bg-purple-700 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <p className="px-4 pb-2 text-center text-xs text-gray-400" data-testid="disclaimer-ai-mistakes">
        {language === "es"
          ? "La IA puede cometer errores — verifica los datos importantes."
          : "AI can make mistakes — verify important facts."}
      </p>
    </div>
  );
}
