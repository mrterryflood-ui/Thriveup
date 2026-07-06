/**
 * Gap 5 — Reading-level adaptation settings.
 * Lets learners set their reading level + accessibility preferences.
 * These settings are read by the lesson player and Spark AI to adapt content.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BookOpen, Settings, Eye, Volume2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormDescription,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const READING_LEVELS = [
  {
    value: "elementary",
    label: "Elementary (grades 1–5)",
    description: "Short sentences, simple words, everyday examples",
    example: "\"You did great! Here's what that means for you...\"",
  },
  {
    value: "middle",
    label: "Middle school (grades 6–8)",
    description: "Clearer explanations, some terms introduced",
    example: "\"Great work. Here's what we covered and why it matters...\"",
  },
  {
    value: "high",
    label: "High school (grades 9–12)",
    description: "Standard reading level, full vocabulary",
    example: "\"Excellent progress. Let's review the key concepts from this module...\"",
  },
  {
    value: "adult",
    label: "Adult (college/professional)",
    description: "Full professional vocabulary and technical terms",
    example: "\"Your assessment reflects strong competency in the CFIR implementation domains...\"",
  },
];

const settingsSchema = z.object({
  readingLevel: z.enum(["elementary", "middle", "high", "adult"]),
  preferredLanguage: z.string().min(2),
  captionsEnabled: z.boolean(),
  highContrastEnabled: z.boolean(),
  screenReaderMode: z.boolean(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function LearnerSettings() {
  const { toast } = useToast();

  const { data: profile, isLoading } = useQuery<SettingsForm & { id: string; userId: string }>({
    queryKey: ["/api/learner-profile"],
  });

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    values: profile ? {
      readingLevel: (profile.readingLevel as any) ?? "adult",
      preferredLanguage: profile.preferredLanguage ?? "en",
      captionsEnabled: profile.captionsEnabled ?? false,
      highContrastEnabled: profile.highContrastEnabled ?? false,
      screenReaderMode: profile.screenReaderMode ?? false,
    } : undefined,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      return apiRequest("PUT", "/api/learner-profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learner-profile"] });
      toast({ title: "Settings saved", description: "Your learning preferences have been updated." });
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  const selected = form.watch("readingLevel");
  const selectedLevel = READING_LEVELS.find(l => l.value === selected);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Learning Preferences</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tell us how you learn best. Lessons and AI responses will adapt to match.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white dark:bg-gray-800 rounded-xl animate-pulse border border-gray-200 dark:border-gray-700" />
            ))}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(d => saveMutation.mutate(d))} className="space-y-6">
              {/* Reading level */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    Reading level
                  </CardTitle>
                  <CardDescription>
                    Lessons, Spark AI responses, and explanations will be written to match your level.
                    You can change this anytime.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField control={form.control} name="readingLevel" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="grid grid-cols-1 gap-2">
                          {READING_LEVELS.map(level => (
                            <button
                              key={level.value}
                              type="button"
                              data-testid={`reading-level-${level.value}`}
                              onClick={() => field.onChange(level.value)}
                              className={`text-left p-3 rounded-lg border-2 transition-colors ${
                                field.value === level.value
                                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white text-sm">{level.label}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{level.description}</p>
                                </div>
                                {field.value === level.value && (
                                  <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </FormControl>
                    </FormItem>
                  )} />

                  {selectedLevel && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">How Spark will respond to you:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedLevel.example}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Language */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="w-4 h-4 text-green-500" />
                    Language
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField control={form.control} name="preferredLanguage" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred language for content</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-language">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="vi">Tiếng Việt</SelectItem>
                          <SelectItem value="zh">中文</SelectItem>
                          <SelectItem value="ar">العربية</SelectItem>
                          <SelectItem value="ko">한국어</SelectItem>
                          <SelectItem value="pt">Português</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              {/* Accessibility */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="w-4 h-4 text-purple-500" />
                    Accessibility
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: "captionsEnabled" as const, label: "Captions / subtitles", description: "Show captions on all video and audio content" },
                    { name: "highContrastEnabled" as const, label: "High contrast mode", description: "Use higher contrast colors throughout the platform" },
                    { name: "screenReaderMode" as const, label: "Screen reader optimization", description: "Simplify layouts and add extra labels for screen readers" },
                  ].map(({ name, label, description }) => (
                    <FormField key={name} control={form.control} name={name} render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                        <div>
                          <FormLabel className="font-medium text-sm">{label}</FormLabel>
                          <FormDescription className="text-xs mt-0.5">{description}</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid={`switch-${name}`}
                          />
                        </FormControl>
                      </FormItem>
                    )} />
                  ))}
                </CardContent>
              </Card>

              <Button
                type="submit"
                disabled={saveMutation.isPending}
                data-testid="btn-save-settings"
                className="w-full"
              >
                {saveMutation.isPending ? "Saving..." : "Save preferences"}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
