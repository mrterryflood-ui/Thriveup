import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wand2, Search, User, Settings, Route, CalendarCheck,
  BookOpen, Briefcase, Heart, Shield, Crown, Users,
  Lightbulb, GraduationCap, TrendingUp, ShoppingBag,
  Map, Trophy, CheckCircle2, ChevronRight, Sparkles,
  Eye, Zap, Star,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AcademyWizard from "@/components/academy-wizard";
import { WIZARD_STEPS } from "@/lib/wizard-data";

const CAREER_INTERESTS = [
  "Technology", "Healthcare", "Business", "Arts & Creative",
  "Engineering", "Education", "Skilled Trades", "Military",
  "Law & Justice", "Science & Research", "Finance",
  "Media & Communications", "Public Service", "Agriculture",
  "Architecture & Design",
];

const PANTHER_POWER_CATEGORIES = [
  { key: "education", label: "Education", icon: BookOpen },
  { key: "character", label: "Character", icon: Heart },
  { key: "leadership", label: "Leadership", icon: Crown },
  { key: "entrepreneurship", label: "Entrepreneurship", icon: Lightbulb },
  { key: "community", label: "Community", icon: Users },
];

const FEATURE_TOGGLES = [
  { key: "stockExchange", label: "Stock Exchange", icon: TrendingUp },
  { key: "marketplace", label: "Marketplace", icon: ShoppingBag },
  { key: "advancedCYOA", label: "Advanced CYOA", icon: Map },
  { key: "mentorRequests", label: "Mentor Requests", icon: Users },
  { key: "competitionEntry", label: "Competition Entry", icon: Trophy },
  { key: "careerExplorer", label: "Career Explorer", icon: Briefcase },
  { key: "pathwayPlanning", label: "Pathway Planning", icon: Route },
];

const WIZARD_TYPES = [
  {
    type: "student-config",
    title: "Initial Student Setup",
    description: "Full personalization: learning style, interests, pace, feature access, mentor preferences, and support notes",
    icon: Settings,
    color: "bg-rose-100 dark:bg-rose-900/30",
    iconColor: "text-rose-600 dark:text-rose-400",
    steps: 8,
  },
  {
    type: "career-pathway",
    title: "Career Pathway Builder",
    description: "Build or rebuild a student's career pathway plan with education path, interests, and year goals",
    icon: Route,
    title2: "Build Pathway",
    color: "bg-sky-100 dark:bg-sky-900/30",
    iconColor: "text-sky-600 dark:text-sky-400",
    steps: 5,
  },
  {
    type: "quarterly-review",
    title: "Quarterly Advisory Review",
    description: "Assess Panther Power growth, milestone progress, pathway adjustments, and set action items",
    icon: CalendarCheck,
    color: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    steps: 5,
  },
];

interface StudentConfig {
  learningStyle: string;
  learningPace: string;
  careerInterests: string[];
  pantherPowerFocus: string[];
  featureAccess: Record<string, boolean>;
  mentorFieldPreference: string;
  mentorCommunicationStyle: string;
  supportNotes: string;
}

const DEFAULT_CONFIG: StudentConfig = {
  learningStyle: "",
  learningPace: "",
  careerInterests: [],
  pantherPowerFocus: [],
  featureAccess: Object.fromEntries(FEATURE_TOGGLES.map(f => [f.key, true])),
  mentorFieldPreference: "",
  mentorCommunicationStyle: "",
  supportNotes: "",
};

export default function AcademyStudentWizardPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeWizard, setActiveWizard] = useState<string | null>(null);
  const [config, setConfig] = useState<StudentConfig>({ ...DEFAULT_CONFIG });

  const { data: students, isLoading: loadingStudents } = useQuery<any[]>({
    queryKey: ["/api/academy/admin/students"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/student-config", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Configuration Saved", description: "Student's personalized learning profile has been updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/academy/admin/students"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save configuration.", variant: "destructive" });
    },
  });

  const filteredStudents = (students ?? []).filter((s: any) =>
    !searchQuery || (s.name || s.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedStudent = (students ?? []).find((s: any) => (s.id || s.userId) === selectedStudentId);

  const toggleCareerInterest = useCallback((interest: string) => {
    setConfig(prev => ({
      ...prev,
      careerInterests: prev.careerInterests.includes(interest)
        ? prev.careerInterests.filter(i => i !== interest)
        : prev.careerInterests.length < 5
          ? [...prev.careerInterests, interest]
          : prev.careerInterests,
    }));
  }, []);

  const togglePowerFocus = useCallback((cat: string) => {
    setConfig(prev => ({
      ...prev,
      pantherPowerFocus: prev.pantherPowerFocus.includes(cat)
        ? prev.pantherPowerFocus.filter(c => c !== cat)
        : [...prev.pantherPowerFocus, cat],
    }));
  }, []);

  const toggleFeature = useCallback((key: string) => {
    setConfig(prev => ({
      ...prev,
      featureAccess: { ...prev.featureAccess, [key]: !prev.featureAccess[key] },
    }));
  }, []);

  const handleSave = () => {
    if (!selectedStudentId) return;
    saveMutation.mutate({ studentId: selectedStudentId, ...config });
  };

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-rose-700 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Wand2 className="h-8 w-8" />
            <h1 className="text-3xl font-bold" data-testid="text-wizard-heading">Student Configuration Wizard</h1>
          </div>
          <p className="text-rose-200 text-lg">Personalize every Panther's learning journey — adaptable, tailored, collaborative</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              Select Student
            </h2>
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-student-search"
            />
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {loadingStudents ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
              ) : filteredStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">No students found</p>
              ) : (
                filteredStudents.map((s: any) => {
                  const sid = s.id || s.userId;
                  const isSelected = selectedStudentId === sid;
                  return (
                    <Card
                      key={sid}
                      className={`p-3 cursor-pointer hover-elevate ${isSelected ? "ring-2 ring-rose-500" : ""}`}
                      onClick={() => { setSelectedStudentId(sid); setActiveWizard(null); }}
                      data-testid={`card-student-${sid}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{s.name || s.email || "Student"}</p>
                          <p className="text-xs text-muted-foreground">Grade 6</p>
                        </div>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-rose-500 shrink-0" />}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {!selectedStudentId ? (
              <Card className="p-12 text-center">
                <Wand2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Student to Begin</h3>
                <p className="text-muted-foreground">Choose a student from the list to configure their personalized learning experience.</p>
              </Card>
            ) : activeWizard ? (
              <div>
                <Button variant="ghost" onClick={() => setActiveWizard(null)} className="mb-4" data-testid="button-back-to-wizards">
                  Back to Wizard Selection
                </Button>
                <AcademyWizard
                  wizardType={activeWizard}
                  steps={WIZARD_STEPS[activeWizard] || []}
                  onComplete={() => {
                    setActiveWizard(null);
                    toast({ title: "Wizard Complete", description: "The guided setup is finished." });
                  }}
                  onDismiss={() => setActiveWizard(null)}
                />
                {activeWizard === "student-config" && (
                  <div className="mt-6 space-y-6">
                    <Card className="p-6">
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Eye className="h-5 w-5 text-muted-foreground" />
                        Learning Style & Pace
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Learning Style</label>
                          <Select value={config.learningStyle} onValueChange={(v) => setConfig(p => ({ ...p, learningStyle: v }))}>
                            <SelectTrigger data-testid="select-learning-style">
                              <SelectValue placeholder="Select style" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="visual">Visual</SelectItem>
                              <SelectItem value="auditory">Auditory</SelectItem>
                              <SelectItem value="reading">Reading / Writing</SelectItem>
                              <SelectItem value="kinesthetic">Kinesthetic</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Learning Pace</label>
                          <Select value={config.learningPace} onValueChange={(v) => setConfig(p => ({ ...p, learningPace: v }))}>
                            <SelectTrigger data-testid="select-learning-pace">
                              <SelectValue placeholder="Select pace" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="accelerated">Accelerated</SelectItem>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="supportive">Supportive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                        Career Interest Areas
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">Select up to 5 career interest areas</p>
                      <div className="flex flex-wrap gap-2">
                        {CAREER_INTERESTS.map((interest) => (
                          <Badge
                            key={interest}
                            className={`cursor-pointer toggle-elevate ${config.careerInterests.includes(interest) ? "toggle-elevated bg-rose-600 text-white" : ""}`}
                            onClick={() => toggleCareerInterest(interest)}
                            data-testid={`badge-interest-${interest.toLowerCase().replace(/\s+/g, "-")}`}
                          >
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-6">
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-muted-foreground" />
                        Panther Power Focus
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">Select categories for weighted growth tracking</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {PANTHER_POWER_CATEGORIES.map(({ key, label, icon: Icon }) => (
                          <Card
                            key={key}
                            className={`p-3 cursor-pointer hover-elevate ${config.pantherPowerFocus.includes(key) ? "ring-2 ring-rose-500" : ""}`}
                            onClick={() => togglePowerFocus(key)}
                            data-testid={`card-power-${key}`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{label}</span>
                              {config.pantherPowerFocus.includes(key) && (
                                <CheckCircle2 className="h-4 w-4 text-rose-500 ml-auto" />
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-6">
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        Feature Access
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">Enable or disable specific Academy features for this student</p>
                      <div className="space-y-3">
                        {FEATURE_TOGGLES.map(({ key, label, icon: Icon }) => (
                          <div key={key} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{label}</span>
                            </div>
                            <Switch
                              checked={config.featureAccess[key] ?? true}
                              onCheckedChange={() => toggleFeature(key)}
                              data-testid={`switch-feature-${key}`}
                            />
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-6">
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        Mentor Preferences
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Preferred Career Field</label>
                          <Select value={config.mentorFieldPreference} onValueChange={(v) => setConfig(p => ({ ...p, mentorFieldPreference: v }))}>
                            <SelectTrigger data-testid="select-mentor-field">
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                              {CAREER_INTERESTS.map(f => (
                                <SelectItem key={f} value={f.toLowerCase().replace(/\s+/g, "-")}>{f}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Communication Style</label>
                          <Select value={config.mentorCommunicationStyle} onValueChange={(v) => setConfig(p => ({ ...p, mentorCommunicationStyle: v }))}>
                            <SelectTrigger data-testid="select-mentor-comm">
                              <SelectValue placeholder="Select style" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in-person">In-Person</SelectItem>
                              <SelectItem value="virtual">Virtual</SelectItem>
                              <SelectItem value="both">Both</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <Star className="h-5 w-5 text-muted-foreground" />
                        Support Notes
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">IEP accommodations, social-emotional considerations, family context, or strengths. Visible to staff only.</p>
                      <Textarea
                        value={config.supportNotes}
                        onChange={(e) => setConfig(p => ({ ...p, supportNotes: e.target.value }))}
                        placeholder="Add support notes for this student..."
                        className="min-h-[100px]"
                        data-testid="textarea-support-notes"
                      />
                    </Card>

                    <Button
                      onClick={handleSave}
                      disabled={saveMutation.isPending}
                      className="w-full bg-rose-700 hover:bg-rose-800 text-white"
                      data-testid="button-save-config"
                    >
                      {saveMutation.isPending ? "Saving..." : "Save Student Configuration"}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                    <User className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg" data-testid="text-selected-student">
                      {selectedStudent?.name || selectedStudent?.email || "Student"}
                    </h2>
                    <p className="text-sm text-muted-foreground">Choose a wizard to begin configuring this student's experience</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {WIZARD_TYPES.map((wiz) => {
                    const Icon = wiz.icon;
                    return (
                      <Card
                        key={wiz.type}
                        className="p-5 hover-elevate cursor-pointer"
                        onClick={() => setActiveWizard(wiz.type)}
                        data-testid={`card-wizard-${wiz.type}`}
                      >
                        <div className={`rounded-md p-3 ${wiz.color} w-fit mb-3`}>
                          <Icon className={`h-6 w-6 ${wiz.iconColor}`} />
                        </div>
                        <h3 className="font-semibold mb-1">{wiz.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{wiz.description}</p>
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline">{wiz.steps} steps</Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Card>
                    );
                  })}
                </div>

                <Card className="p-5 bg-muted/30">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-sm mb-1">About Student Wizards</h3>
                      <p className="text-sm text-muted-foreground">
                        Each wizard guides you through a structured process for personalizing this student's experience.
                        The <strong>Initial Setup</strong> configures learning style, interests, and feature access.
                        The <strong>Pathway Builder</strong> creates their career plan.
                        The <strong>Quarterly Review</strong> assesses growth and adjusts goals. Every child gets what they need.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
