import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Smile, Meh, Brain, BatteryLow, Sparkles, BookOpen, Calendar } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import type { StudentReflection } from "@shared/schema";

const moods = [
  { value: "happy", label: "Happy", icon: Smile },
  { value: "neutral", label: "Neutral", icon: Meh },
  { value: "focused", label: "Focused", icon: Brain },
  { value: "tired", label: "Tired", icon: BatteryLow },
  { value: "excited", label: "Excited", icon: Sparkles },
] as const;

function getMoodIcon(mood: string | null) {
  const found = moods.find((m) => m.value === mood);
  if (!found) return null;
  const Icon = found.icon;
  return <Icon className="h-4 w-4" />;
}

function getMoodLabel(mood: string | null) {
  const found = moods.find((m) => m.value === mood);
  return found?.label ?? "";
}

export default function AcademyJournalPage() {
  useEffect(() => { document.title = 'Reflection Journal | AI Mastery Academy'; }, []);
  const { user, isLoading: authLoading } = useAuth();
  const [period, setPeriod] = useState("daily");
  const [mood, setMood] = useState("");
  const [content, setContent] = useState("");

  const { data: reflections, isLoading } = useQuery<StudentReflection[]>({
    queryKey: ["/api/reflections"],
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { period: string; mood: string; content: string; entryDate: string }) => {
      const res = await apiRequest("POST", "/api/reflections", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reflections"] });
      setContent("");
      setMood("");
      setPeriod("daily");
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) return;
    const today = new Date().toISOString().split("T")[0];
    createMutation.mutate({
      period,
      mood,
      content: content.trim(),
      entryDate: today,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-[#800000] text-white py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-64 bg-white/20" />
            <Skeleton className="h-4 w-48 mt-2 bg-white/20" />
          </div>
        </div>
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-[#800000] text-white py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-journal-title">
              <BookOpen className="h-8 w-8" /> Reflection Journal
            </h1>
            <p className="mt-2 text-white/80" data-testid="text-journal-description">
              Write your daily and weekly reflections
            </p>
          </div>
        </div>
        <div className="max-w-4xl mx-auto p-4">
          <Card className="p-8 text-center" data-testid="card-login-prompt">
            <p className="text-lg text-muted-foreground">Please log in to access your reflection journal.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <PageHeader
          title="Reflection Journal"
          description="Track your learning journey with daily reflections"
          breadcrumbs={[{ label: "Academy", href: "/academy" }, { label: "Journal" }]}
        />
      </div>

      <div className="bg-[#800000] text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-journal-title">
            <BookOpen className="h-8 w-8" /> Reflection Journal
          </h1>
          <p className="mt-2 text-white/80" data-testid="text-journal-description">
            Write your daily and weekly reflections to track your growth
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <Card className="p-6" data-testid="card-new-reflection">
          <h2 className="text-xl font-semibold mb-4" data-testid="text-new-entry-heading">New Entry</h2>

          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[140px]">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Period</label>
              <Select value={period} onValueChange={setPeriod} data-testid="select-period">
                <SelectTrigger data-testid="select-period-trigger">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily" data-testid="select-period-daily">Daily</SelectItem>
                  <SelectItem value="weekly" data-testid="select-period-weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Mood</label>
              <div className="flex gap-1" data-testid="mood-selector">
                {moods.map((m) => {
                  const Icon = m.icon;
                  const isSelected = mood === m.value;
                  return (
                    <Button
                      key={m.value}
                      size="icon"
                      variant={isSelected ? "default" : "ghost"}
                      className={isSelected ? "bg-[#800000]" : ""}
                      onClick={() => setMood(m.value)}
                      data-testid={`button-mood-${m.value}`}
                      title={m.label}
                      aria-label={`Select mood: ${m.label}`}
                    >
                      <Icon className="h-5 w-5" />
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Your Reflection</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What did you learn today? How are you feeling about your progress?"
              className="min-h-[120px]"
              data-testid="textarea-reflection"
            />
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-muted-foreground flex items-center gap-1" data-testid="text-entry-date">
              <Calendar className="h-4 w-4" />
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || createMutation.isPending}
              className="bg-[#800000]"
              data-testid="button-submit-reflection"
            >
              {createMutation.isPending ? "Saving..." : "Save Reflection"}
            </Button>
          </div>
        </Card>

        <h2 className="text-xl font-semibold" data-testid="text-past-entries-heading">Past Entries</h2>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : !reflections || reflections.length === 0 ? (
          <Card className="p-8 text-center" data-testid="card-no-entries">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2" data-testid="text-empty-title">Your Journal Awaits</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Reflecting on your learning helps you grow. Write your first entry above to start tracking your thoughts, moods, and progress over time.
            </p>
            <Button
              onClick={() => {
                const textarea = document.querySelector('[data-testid="textarea-reflection"]') as HTMLTextAreaElement;
                if (textarea) textarea.focus();
              }}
              className="bg-[#800000]"
              data-testid="button-start-first-entry"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Write Your First Reflection
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {[...reflections]
              .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
              .map((entry) => (
                <Card key={entry.id} className="p-4" data-testid={`card-reflection-${entry.id}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground" data-testid={`text-date-${entry.id}`}>
                        {new Date(entry.entryDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <Badge variant="secondary" data-testid={`badge-period-${entry.id}`}>
                        {entry.period}
                      </Badge>
                    </div>
                    {entry.mood && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground" data-testid={`text-mood-${entry.id}`}>
                        {getMoodIcon(entry.mood)}
                        <span>{getMoodLabel(entry.mood)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap" data-testid={`text-content-${entry.id}`}>
                    {entry.content}
                  </p>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
