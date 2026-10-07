import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { ErrorRetry } from "@/components/error-retry";
import { PageHeader } from "@/components/page-header";
import {
  Battery,
  Gauge,
  Target,
  Users,
  Shield,
  Smile,
  ClipboardCheck,
} from "lucide-react";

const selfAssessmentSchema = z.object({
  energyLevel: z.number().min(1).max(10),
  stressLevel: z.number().min(1).max(10),
  focusLevel: z.number().min(1).max(10),
  belongingLevel: z.number().min(1).max(10),
  confidenceLevel: z.number().min(1).max(10),
  moodRating: z.number().min(1).max(10),
  reflectionText: z.string().optional(),
  goalsForToday: z.string().optional(),
  gratitudeNote: z.string().optional(),
  needsSupport: z.boolean(),
  supportType: z.string().optional(),
  consentGiven: z.boolean(),
});

type SelfAssessmentFormValues = z.infer<typeof selfAssessmentSchema>;

interface SelfAssessment {
  id: string;
  userId: string;
  assessmentType: string;
  energyLevel: number | null;
  stressLevel: number | null;
  focusLevel: number | null;
  belongingLevel: number | null;
  confidenceLevel: number | null;
  moodRating: number | null;
  reflectionText: string | null;
  goalsForToday: string | null;
  gratitudeNote: string | null;
  needsSupport: boolean;
  supportType: string | null;
  consentGiven: boolean;
  createdAt: string;
}

const RATING_FIELDS = [
  { key: "energyLevel" as const, label: "Energy Level", icon: Battery, description: "How energized do you feel?" },
  { key: "stressLevel" as const, label: "Stress Level", icon: Gauge, description: "How stressed are you?" },
  { key: "focusLevel" as const, label: "Focus Level", icon: Target, description: "How focused can you be?" },
  { key: "belongingLevel" as const, label: "Belonging Level", icon: Users, description: "How connected do you feel?" },
  { key: "confidenceLevel" as const, label: "Confidence Level", icon: Shield, description: "How confident are you?" },
  { key: "moodRating" as const, label: "Mood Rating", icon: Smile, description: "How is your mood overall?" },
];

const SUPPORT_TYPES = ["Academic Help", "Emotional Support", "Peer Conflict", "Home Situation", "Other"];

function getScoreColor(score: number) {
  if (score >= 8) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 5) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function LoadingSkeleton() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Skeleton className="h-36 w-full rounded-md" />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}

export default function AcademySelfAssessmentPage() {
  useEffect(() => { document.title = 'Self Assessment | ThriveUp'; }, []);

  const { toast } = useToast();

  const form = useForm<SelfAssessmentFormValues>({
    resolver: zodResolver(selfAssessmentSchema),
    defaultValues: {
      energyLevel: 5,
      stressLevel: 5,
      focusLevel: 5,
      belongingLevel: 5,
      confidenceLevel: 5,
      moodRating: 5,
      reflectionText: "",
      goalsForToday: "",
      gratitudeNote: "",
      needsSupport: false,
      supportType: undefined,
      consentGiven: true,
    },
  });

  const needsSupport = form.watch("needsSupport");

  const { data: history, isLoading: historyLoading, error: historyError, refetch: refetchHistory } = useQuery<SelfAssessment[]>({
    queryKey: ["/api/self-assessments"],
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SelfAssessmentFormValues) => {
      const res = await apiRequest("POST", "/api/self-assessment", {
        ...data,
        assessmentType: "daily_checkin",
        userId: "current",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/self-assessments"] });
      toast({ title: "Check-In Submitted", description: "Your daily check-in has been saved." });
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: SelfAssessmentFormValues) => {
    submitMutation.mutate(data);
  };

  const recentHistory = (history ?? []).slice(0, 7);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto" data-testid="academy-self-assessment-page">
      <PageHeader
        title="Daily Check-In"
        description="How are you doing today?"
        breadcrumbs={[{ label: "Academy", href: "/academy" }, { label: "Self-Assessment" }]}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="p-5" data-testid="card-ratings">
            <h2 className="font-semibold text-lg mb-4">Rate Your Day</h2>
            <div className="space-y-6">
              {RATING_FIELDS.map((field) => {
                const IconComp = field.icon;
                return (
                  <FormField
                    key={field.key}
                    control={form.control}
                    name={field.key}
                    render={({ field: formField }) => (
                      <FormItem>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <div className="rounded-md p-1.5 bg-rose-100 dark:bg-rose-900/30 shrink-0">
                            <IconComp className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                          </div>
                          <FormLabel className="font-medium text-sm">{field.label}</FormLabel>
                          <span
                            className={`ml-auto font-bold text-lg ${getScoreColor(formField.value)}`}
                            data-testid={`text-score-${field.key}`}
                          >
                            {formField.value}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{field.description}</p>
                        <FormControl>
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            value={[formField.value]}
                            onValueChange={(val) => formField.onChange(val[0])}
                            data-testid={`slider-${field.key}`}
                          />
                        </FormControl>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground">1</span>
                          <span className="text-[10px] text-muted-foreground">10</span>
                        </div>
                      </FormItem>
                    )}
                  />
                );
              })}
            </div>
          </Card>

          <Card className="p-5" data-testid="card-reflections">
            <h2 className="font-semibold text-lg mb-4">Reflections</h2>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="reflectionText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">What's on your mind today?</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Share your thoughts..."
                        className="resize-none"
                        rows={3}
                        data-testid="textarea-reflectionText"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="goalsForToday"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">What do you want to accomplish?</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Set your goals for today..."
                        className="resize-none"
                        rows={3}
                        data-testid="textarea-goalsForToday"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gratitudeNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Something you're grateful for</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="What are you thankful for today?"
                        className="resize-none"
                        rows={2}
                        data-testid="textarea-gratitudeNote"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </Card>

          <Card className="p-5" data-testid="card-support">
            <h2 className="font-semibold text-lg mb-4">Support</h2>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="needsSupport"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-needsSupport"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-medium">I need support</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {needsSupport && (
                <FormField
                  control={form.control}
                  name="supportType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">What kind of support?</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-supportType">
                            <SelectValue placeholder="Select support type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SUPPORT_TYPES.map((type) => (
                            <SelectItem
                              key={type}
                              value={type}
                              data-testid={`option-support-${type.toLowerCase().replace(/\s+/g, "-")}`}
                            >
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="consentGiven"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-consentGiven"
                        />
                      </FormControl>
                      <FormLabel className="text-sm">
                        I consent to sharing my check-in with my advisor
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </Card>

          <Button
            type="submit"
            className="w-full"
            disabled={submitMutation.isPending}
            data-testid="button-submit-checkin"
          >
            {submitMutation.isPending ? "Submitting..." : "Submit Check-In"}
          </Button>
        </form>
      </Form>

      <div className="mt-8" data-testid="section-history">
        <h2 className="font-semibold text-lg mb-4">Recent Check-Ins</h2>
        {historyError ? (
          <ErrorRetry message="Failed to load check-in history. Please try again." onRetry={refetchHistory} />
        ) : historyLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : recentHistory.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentHistory.map((entry) => (
              <Card key={entry.id} className="p-4" data-testid={`card-history-${entry.id}`}>
                <p className="text-xs text-muted-foreground mb-2" data-testid={`text-history-date-${entry.id}`}>
                  {new Date(entry.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {entry.energyLevel != null && (
                    <Badge variant="secondary" data-testid={`badge-energy-${entry.id}`}>
                      <Battery className="h-3 w-3 mr-1" /> {entry.energyLevel}
                    </Badge>
                  )}
                  {entry.moodRating != null && (
                    <Badge variant="secondary" data-testid={`badge-mood-${entry.id}`}>
                      <Smile className="h-3 w-3 mr-1" /> {entry.moodRating}
                    </Badge>
                  )}
                  {entry.focusLevel != null && (
                    <Badge variant="secondary" data-testid={`badge-focus-${entry.id}`}>
                      <Target className="h-3 w-3 mr-1" /> {entry.focusLevel}
                    </Badge>
                  )}
                  {entry.stressLevel != null && (
                    <Badge variant="secondary" data-testid={`badge-stress-${entry.id}`}>
                      <Gauge className="h-3 w-3 mr-1" /> {entry.stressLevel}
                    </Badge>
                  )}
                </div>
                {entry.needsSupport && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" data-testid={`badge-support-${entry.id}`}>
                    Support Requested
                  </Badge>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center" data-testid="card-no-history">
            <ClipboardCheck className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No check-ins yet. Submit your first one above.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
