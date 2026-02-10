import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Send, Bot, User, GraduationCap } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AICompanionProps {
  subject?: string;
  lessonContext?: string;
  className?: string;
}

const GRADE_LEVELS = ["PreK-K", "1-2", "3-5", "6-8", "9-12"];

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content: "Hi there! I'm Spark, your learning buddy. What would you like to explore today?",
};

export default function AICompanion({ subject, lessonContext, className }: AICompanionProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [gradeLevel, setGradeLevel] = useState("3-5");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const assistantMessage: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch("/api/ai-companion/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          gradeLevel,
          subject,
          lessonContext,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

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
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: accumulated,
                  };
                  return updated;
                });
              }
            } catch {
              // skip unparseable chunks
            }
          }
        }
      }

      if (!accumulated) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "I'm sorry, I wasn't able to generate a response. Please try again.",
          };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Something went wrong. Please try again in a moment.",
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

  return (
    <Card className={`flex flex-col ${className || "h-[500px]"}`}>
      <div className="flex items-center justify-between gap-2 p-4 border-b flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-semibold">Spark</span>
        </div>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          <Select value={gradeLevel} onValueChange={setGradeLevel}>
            <SelectTrigger className="w-[120px]" data-testid="select-grade-level">
              <SelectValue placeholder="Grade Level" />
            </SelectTrigger>
            <SelectContent>
              {GRADE_LEVELS.map((level) => (
                <SelectItem key={level} value={level} data-testid={`select-grade-${level}`}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4" data-testid="container-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            data-testid={`message-${msg.role}-${i}`}
          >
            {msg.role === "assistant" && (
              <div className="rounded-md p-1.5 bg-primary/10 shrink-0 mt-0.5">
                <Bot className="h-4 w-4 text-primary" />
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
          <div className="flex items-center gap-1 pl-10">
            <span className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-primary/60 animate-pulse [animation-delay:0.2s]" />
            <span className="w-2 h-2 rounded-full bg-primary/60 animate-pulse [animation-delay:0.4s]" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Spark anything..."
            disabled={isLoading}
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
            data-testid="input-chat-message"
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
