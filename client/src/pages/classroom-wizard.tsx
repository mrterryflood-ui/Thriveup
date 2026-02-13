import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wand2,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  BookOpen,
  Target,
  MessageSquare,
  RefreshCw,
  School,
  Users,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Subject } from "@shared/schema";

interface WizardData {
  name: string;
  gradeBand: string;
  subjectFocus: string;
  description: string;
  learningObjectives: string[];
  suggestedActivities: string[];
  welcomeMessage: string;
}

const STEPS = ["Basics", "AI Suggestions", "Review & Create"];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-2 mb-8" data-testid="step-indicator">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
              i < currentStep
                ? "bg-primary text-primary-foreground"
                : i === currentStep
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
            data-testid={`step-circle-${i}`}
          >
            {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
          </div>
          <span
            className={`text-sm hidden sm:inline ${
              i === currentStep ? "font-semibold" : "text-muted-foreground"
            }`}
          >
            {step}
          </span>
          {i < STEPS.length - 1 && (
            <div className="w-8 h-px bg-border mx-1" />
          )}
        </div>
      ))}
    </div>
  );
}

function Step1Basics({
  data,
  onChange,
  onNext,
  subjects,
}: {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  subjects: Subject[] | undefined;
}) {
  const isValid = data.name.trim().length > 0 && data.gradeBand.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1" data-testid="text-step1-heading">
          Set Up Your Classroom
        </h2>
        <p className="text-muted-foreground text-sm">
          Tell us about your classroom and our AI assistant will help you get started.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Classroom Name</label>
          <Input
            placeholder="e.g. AI Explorers - Period 3"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            data-testid="input-wizard-name"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Grade Band</label>
          <Select value={data.gradeBand} onValueChange={(val) => onChange({ gradeBand: val })}>
            <SelectTrigger data-testid="select-wizard-grade">
              <SelectValue placeholder="Select grade band" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3-5">Grades 3-5</SelectItem>
              <SelectItem value="6-8">Grades 6-8</SelectItem>
              <SelectItem value="9-12">Grades 9-12</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Subject Focus (Optional)</label>
          <Select value={data.subjectFocus} onValueChange={(val) => onChange({ subjectFocus: val })}>
            <SelectTrigger data-testid="select-wizard-subject">
              <SelectValue placeholder="All subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects?.map((s) => (
                <SelectItem key={s.id} value={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!isValid} data-testid="button-step1-next">
          Next: AI Suggestions <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Step2AISuggestions({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const generateSuggestions = useCallback(async () => {
    setIsGenerating(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/classroom-wizard/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          gradeBand: data.gradeBand,
          subjectFocus: data.subjectFocus,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("Failed to generate suggestions");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.done) break;
              if (parsed.content) fullText += parsed.content;
            } catch {}
          }
        }
      }

      const sections = parseAISuggestions(fullText);
      onChange(sections);
      setHasGenerated(true);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Generation error:", err);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [data.name, data.gradeBand, data.subjectFocus, onChange]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1 flex items-center gap-2" data-testid="text-step2-heading">
          <Sparkles className="h-5 w-5 text-primary" /> AI-Powered Setup
        </h2>
        <p className="text-muted-foreground text-sm">
          Let Spark help you create a tailored classroom experience for your students.
        </p>
      </div>

      {!hasGenerated ? (
        <Card className="p-8 text-center">
          <Wand2 className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Ready to Generate</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
            Based on your classroom details, Spark will suggest learning objectives, activities, a description, and a welcome message.
          </p>
          <Button
            onClick={generateSuggestions}
            disabled={isGenerating}
            data-testid="button-generate-suggestions"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 h-4 w-4" /> Generate Suggestions
              </>
            )}
          </Button>
        </Card>
      ) : (
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-primary" /> Classroom Description
              </h3>
            </div>
            <Textarea
              value={data.description}
              onChange={(e) => onChange({ description: e.target.value })}
              className="min-h-[80px] resize-y"
              data-testid="textarea-description"
            />
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 text-sm mb-3">
              <Target className="h-4 w-4 text-primary" /> Learning Objectives
            </h3>
            <div className="space-y-2">
              {data.learningObjectives.map((obj, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground mt-2 shrink-0">{i + 1}.</span>
                  <Input
                    value={obj}
                    onChange={(e) => {
                      const updated = [...data.learningObjectives];
                      updated[i] = e.target.value;
                      onChange({ learningObjectives: updated });
                    }}
                    data-testid={`input-objective-${i}`}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 text-sm mb-3">
              <Sparkles className="h-4 w-4 text-primary" /> Suggested Activities
            </h3>
            <div className="space-y-2">
              {data.suggestedActivities.map((act, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground mt-2 shrink-0">{i + 1}.</span>
                  <Input
                    value={act}
                    onChange={(e) => {
                      const updated = [...data.suggestedActivities];
                      updated[i] = e.target.value;
                      onChange({ suggestedActivities: updated });
                    }}
                    data-testid={`input-activity-${i}`}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 text-sm mb-3">
              <MessageSquare className="h-4 w-4 text-primary" /> Welcome Message for Students
            </h3>
            <Textarea
              value={data.welcomeMessage}
              onChange={(e) => onChange({ welcomeMessage: e.target.value })}
              className="min-h-[80px] resize-y"
              data-testid="textarea-welcome"
            />
          </Card>

          <div className="flex justify-center">
            <Button variant="outline" onClick={generateSuggestions} disabled={isGenerating} data-testid="button-regenerate">
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`} />
              Regenerate
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" onClick={onBack} data-testid="button-step2-back">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext} disabled={!hasGenerated} data-testid="button-step2-next">
          Next: Review <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Step3Review({
  data,
  onBack,
  onSubmit,
  isSubmitting,
}: {
  data: WizardData;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1" data-testid="text-step3-heading">
          Review Your Classroom
        </h2>
        <p className="text-muted-foreground text-sm">
          Everything looks good? Create your classroom to get started.
        </p>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <School className="h-6 w-6 text-primary" />
          <div>
            <h3 className="font-bold text-lg" data-testid="text-review-name">{data.name}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">Grades {data.gradeBand}</Badge>
              {data.subjectFocus && data.subjectFocus !== "all" && (
                <Badge variant="outline">{data.subjectFocus}</Badge>
              )}
            </div>
          </div>
        </div>

        {data.description && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
            <p className="text-sm" data-testid="text-review-description">{data.description}</p>
          </div>
        )}

        {data.learningObjectives.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" /> Learning Objectives
            </h4>
            <ul className="space-y-1">
              {data.learningObjectives.map((obj, i) => (
                <li key={i} className="text-sm flex items-start gap-2" data-testid={`text-review-objective-${i}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  {obj}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.suggestedActivities.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Planned Activities
            </h4>
            <ul className="space-y-1">
              {data.suggestedActivities.map((act, i) => (
                <li key={i} className="text-sm flex items-start gap-2" data-testid={`text-review-activity-${i}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  {act}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.welcomeMessage && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> Welcome Message
            </h4>
            <Card className="p-3 bg-muted/30">
              <p className="text-sm italic" data-testid="text-review-welcome">{data.welcomeMessage}</p>
            </Card>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" onClick={onBack} data-testid="button-step3-back">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting} data-testid="button-create-classroom">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Creating...
            </>
          ) : (
            <>
              <Check className="mr-1.5 h-4 w-4" /> Create Classroom
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function parseAISuggestions(text: string): Partial<WizardData> {
  const result: Partial<WizardData> = {
    description: "",
    learningObjectives: [],
    suggestedActivities: [],
    welcomeMessage: "",
  };

  const sections = text.split(/\n(?=##\s)/);

  for (const section of sections) {
    const lower = section.toLowerCase();
    if (lower.includes("description")) {
      const lines = section.split("\n").slice(1).filter(l => l.trim());
      result.description = lines.join(" ").trim();
    } else if (lower.includes("objective")) {
      result.learningObjectives = section
        .split("\n")
        .slice(1)
        .map(l => l.replace(/^[-*\d.)\s]+/, "").trim())
        .filter(l => l.length > 0)
        .slice(0, 5);
    } else if (lower.includes("activit")) {
      result.suggestedActivities = section
        .split("\n")
        .slice(1)
        .map(l => l.replace(/^[-*\d.)\s]+/, "").trim())
        .filter(l => l.length > 0)
        .slice(0, 5);
    } else if (lower.includes("welcome")) {
      const lines = section.split("\n").slice(1).filter(l => l.trim());
      result.welcomeMessage = lines.join(" ").trim();
    }
  }

  if (!result.description && !result.learningObjectives?.length) {
    const lines = text.split("\n").filter(l => l.trim());
    result.description = lines.slice(0, 2).join(" ").trim();
    result.learningObjectives = lines.slice(2, 6).map(l => l.replace(/^[-*\d.)\s]+/, "").trim()).filter(Boolean);
    result.suggestedActivities = lines.slice(6, 10).map(l => l.replace(/^[-*\d.)\s]+/, "").trim()).filter(Boolean);
    result.welcomeMessage = lines.slice(10).join(" ").trim() || "Welcome to our classroom! Let's learn and grow together.";
  }

  return result;
}

function LoginPrompt() {
  return (
    <div className="p-6 max-w-md mx-auto text-center mt-20">
      <Card className="p-8">
        <Wand2 className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-bold mb-2" data-testid="text-wizard-login-prompt">
          Sign in to create a classroom
        </h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Log in to use the AI-powered classroom creation wizard.
        </p>
        <a href="/api/login">
          <Button data-testid="button-wizard-login">Sign In</Button>
        </a>
      </Card>
    </div>
  );
}

export default function ClassroomWizardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wizardData, setWizardData] = useState<WizardData>({
    name: "",
    gradeBand: "",
    subjectFocus: "",
    description: "",
    learningObjectives: [],
    suggestedActivities: [],
    welcomeMessage: "",
  });

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const updateData = (updates: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/classrooms", {
        name: wizardData.name,
        gradeBand: wizardData.gradeBand,
        description: wizardData.description,
        learningObjectives: wizardData.learningObjectives,
        suggestedActivities: wizardData.suggestedActivities,
        welcomeMessage: wizardData.welcomeMessage,
      });
      const classroom = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms"] });
      toast({ title: "Classroom created!", description: "Your AI-powered classroom is ready. Share the invite code with students." });
      navigate(`/classrooms/${classroom.id}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-1">
          <Wand2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold" data-testid="text-wizard-heading">
            Classroom Wizard
          </h1>
        </div>
        <p className="text-muted-foreground text-sm mb-6">
          Create a new classroom with AI-generated curriculum suggestions.
        </p>
      </div>

      <StepIndicator currentStep={step} />

      {step === 0 && (
        <Step1Basics
          data={wizardData}
          onChange={updateData}
          onNext={() => setStep(1)}
          subjects={subjects}
        />
      )}
      {step === 1 && (
        <Step2AISuggestions
          data={wizardData}
          onChange={updateData}
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <Step3Review
          data={wizardData}
          onBack={() => setStep(1)}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
