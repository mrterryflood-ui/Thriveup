import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Wand2,
  UserCheck,
  Briefcase,
  ClipboardCheck,
  ArrowLeft,
  ArrowRight,
  Check,
  Star,
  Plus,
  X,
} from "lucide-react";

type WizardType = null | "initial" | "career" | "quarterly";

const WIZARDS = [
  {
    id: "initial",
    title: "Initial Setup Wizard",
    description: "Configure a student's learning style, pace, and focus areas",
    icon: UserCheck,
    color: "bg-rose-100 dark:bg-rose-900/30",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    id: "career",
    title: "Career Pathway Builder",
    description: "Help a student map their career interests and milestones",
    icon: Briefcase,
    color: "bg-sky-100 dark:bg-sky-900/30",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
  {
    id: "quarterly",
    title: "Quarterly Review",
    description: "Conduct a quarterly progress review with a student",
    icon: ClipboardCheck,
    color: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
];

const LEARNING_STYLES = ["Visual", "Auditory", "Reading/Writing", "Kinesthetic"];
const PACE_OPTIONS = ["Self-paced", "Guided", "Accelerated"];
const FOCUS_AREAS = ["Reading", "Math", "Science", "Writing", "Social Skills", "Technology"];

const INTEREST_AREAS = ["Technology", "Healthcare", "Arts", "Engineering", "Business", "Education", "Law", "Science", "Trades", "Military"];
const STRENGTHS = ["Problem Solving", "Communication", "Creativity", "Leadership", "Teamwork", "Technical"];

const RATING_CATEGORIES = ["Academics", "Behavior", "Effort", "Participation"];

function InitialSetupWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [learningStyles, setLearningStyles] = useState<string[]>([]);
  const [pace, setPace] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);

  const totalSteps = 4;
  const progress = ((step + 1) / totalSteps) * 100;

  function toggleItem(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  }


  useEffect(() => { document.title = "Student Setup | AI Mastery Academy"; }, []);
  return (
    <div className="space-y-6" data-testid="wizard-initial-setup">
      <Progress value={progress} className="h-2" data-testid="progress-wizard" />
      <p className="text-sm text-muted-foreground text-center">Step {step + 1} of {totalSteps}</p>

      {step === 0 && (
        <div data-testid="step-learning-styles">
          <h3 className="text-lg font-semibold mb-2">Learning Style Preferences</h3>
          <p className="text-sm text-muted-foreground mb-4">Select all that apply</p>
          <div className="grid grid-cols-2 gap-3">
            {LEARNING_STYLES.map((style) => (
              <Button
                key={style}
                variant={learningStyles.includes(style) ? "default" : "outline"}
                className="justify-start toggle-elevate"
                onClick={() => toggleItem(learningStyles, setLearningStyles, style)}
                data-testid={`button-style-${style.toLowerCase().replace(/\//g, "-")}`}
              >
                {learningStyles.includes(style) && <Check className="h-4 w-4 mr-2 shrink-0" />}
                {style}
              </Button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div data-testid="step-pace-preference">
          <h3 className="text-lg font-semibold mb-2">Pace Preference</h3>
          <p className="text-sm text-muted-foreground mb-4">Choose one learning pace</p>
          <div className="space-y-3">
            {PACE_OPTIONS.map((option) => (
              <Button
                key={option}
                variant={pace === option ? "default" : "outline"}
                className="w-full justify-start toggle-elevate"
                onClick={() => setPace(option)}
                data-testid={`button-pace-${option.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {pace === option && <Check className="h-4 w-4 mr-2 shrink-0" />}
                {option}
              </Button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div data-testid="step-focus-areas">
          <h3 className="text-lg font-semibold mb-2">Focus Areas</h3>
          <p className="text-sm text-muted-foreground mb-4">Select areas to focus on</p>
          <div className="grid grid-cols-2 gap-3">
            {FOCUS_AREAS.map((area) => (
              <Button
                key={area}
                variant={focusAreas.includes(area) ? "default" : "outline"}
                className="justify-start toggle-elevate"
                onClick={() => toggleItem(focusAreas, setFocusAreas, area)}
                data-testid={`button-focus-${area.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {focusAreas.includes(area) && <Check className="h-4 w-4 mr-2 shrink-0" />}
                {area}
              </Button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div data-testid="step-summary">
          <h3 className="text-lg font-semibold mb-4">Summary</h3>
          <div className="space-y-4">
            <Card className="p-4">
              <p className="text-sm font-medium mb-2">Learning Styles</p>
              <div className="flex flex-wrap gap-2">
                {learningStyles.length > 0 ? learningStyles.map((s) => (
                  <Badge key={s} variant="secondary" data-testid={`badge-summary-style-${s}`}>{s}</Badge>
                )) : <span className="text-sm text-muted-foreground">None selected</span>}
              </div>
            </Card>
            <Card className="p-4">
              <p className="text-sm font-medium mb-2">Pace</p>
              <p className="text-sm text-muted-foreground" data-testid="text-summary-pace">{pace || "None selected"}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm font-medium mb-2">Focus Areas</p>
              <div className="flex flex-wrap gap-2">
                {focusAreas.length > 0 ? focusAreas.map((a) => (
                  <Badge key={a} variant="secondary" data-testid={`badge-summary-focus-${a}`}>{a}</Badge>
                )) : <span className="text-sm text-muted-foreground">None selected</span>}
              </div>
            </Card>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
          data-testid="button-wizard-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        {step < totalSteps - 1 ? (
          <Button onClick={() => setStep(step + 1)} data-testid="button-wizard-next">
            Next <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={onComplete} data-testid="button-wizard-complete">
            <Check className="h-4 w-4 mr-2" /> Complete Setup
          </Button>
        )}
      </div>
    </div>
  );
}

function CareerPathwayWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [dreamJob, setDreamJob] = useState("");

  const totalSteps = 4;
  const progress = ((step + 1) / totalSteps) * 100;

  function toggleItem(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  }

  function getPathwaySuggestions() {
    const suggestions: string[] = [];
    if (interests.includes("Technology") || interests.includes("Engineering")) suggestions.push("Software Engineering", "Data Science");
    if (interests.includes("Healthcare")) suggestions.push("Medical Professional", "Public Health");
    if (interests.includes("Arts")) suggestions.push("Graphic Design", "Media Production");
    if (interests.includes("Business")) suggestions.push("Entrepreneurship", "Marketing");
    if (interests.includes("Education")) suggestions.push("Teaching", "Instructional Design");
    if (interests.includes("Law")) suggestions.push("Legal Studies", "Policy Analysis");
    if (interests.includes("Science")) suggestions.push("Research Scientist", "Environmental Science");
    if (interests.includes("Trades")) suggestions.push("Skilled Trades", "Construction Management");
    if (interests.includes("Military")) suggestions.push("Military Leadership", "Defense Technology");
    if (suggestions.length === 0) suggestions.push("Explore more interests to see suggestions");
    return suggestions.slice(0, 4);
  }

  return (
    <div className="space-y-6" data-testid="wizard-career-pathway">
      <Progress value={progress} className="h-2" data-testid="progress-wizard" />
      <p className="text-sm text-muted-foreground text-center">Step {step + 1} of {totalSteps}</p>

      {step === 0 && (
        <div data-testid="step-interests">
          <h3 className="text-lg font-semibold mb-2">Interest Areas</h3>
          <p className="text-sm text-muted-foreground mb-4">Pick your top 3 interests</p>
          <div className="grid grid-cols-2 gap-3">
            {INTEREST_AREAS.map((area) => (
              <Button
                key={area}
                variant={interests.includes(area) ? "default" : "outline"}
                className="justify-start toggle-elevate"
                onClick={() => {
                  if (interests.includes(area)) {
                    setInterests(interests.filter((i) => i !== area));
                  } else if (interests.length < 3) {
                    setInterests([...interests, area]);
                  }
                }}
                disabled={!interests.includes(area) && interests.length >= 3}
                data-testid={`button-interest-${area.toLowerCase()}`}
              >
                {interests.includes(area) && <Check className="h-4 w-4 mr-2 shrink-0" />}
                {area}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{interests.length}/3 selected</p>
        </div>
      )}

      {step === 1 && (
        <div data-testid="step-strengths">
          <h3 className="text-lg font-semibold mb-2">Your Strengths</h3>
          <p className="text-sm text-muted-foreground mb-4">Select all that describe you</p>
          <div className="grid grid-cols-2 gap-3">
            {STRENGTHS.map((s) => (
              <Button
                key={s}
                variant={strengths.includes(s) ? "default" : "outline"}
                className="justify-start toggle-elevate"
                onClick={() => toggleItem(strengths, setStrengths, s)}
                data-testid={`button-strength-${s.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {strengths.includes(s) && <Check className="h-4 w-4 mr-2 shrink-0" />}
                {s}
              </Button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div data-testid="step-dream-job">
          <h3 className="text-lg font-semibold mb-2">Dream Job</h3>
          <p className="text-sm text-muted-foreground mb-4">What do you dream of becoming?</p>
          <Input
            placeholder="e.g. Software Engineer, Doctor, Artist..."
            value={dreamJob}
            onChange={(e) => setDreamJob(e.target.value)}
            data-testid="input-dream-job"
          />
        </div>
      )}

      {step === 3 && (
        <div data-testid="step-career-summary">
          <h3 className="text-lg font-semibold mb-4">Your Career Pathway</h3>
          <div className="space-y-4">
            <Card className="p-4">
              <p className="text-sm font-medium mb-2">Top Interests</p>
              <div className="flex flex-wrap gap-2">
                {interests.map((i) => (
                  <Badge key={i} variant="secondary" data-testid={`badge-summary-interest-${i}`}>{i}</Badge>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <p className="text-sm font-medium mb-2">Strengths</p>
              <div className="flex flex-wrap gap-2">
                {strengths.length > 0 ? strengths.map((s) => (
                  <Badge key={s} variant="secondary" data-testid={`badge-summary-strength-${s}`}>{s}</Badge>
                )) : <span className="text-sm text-muted-foreground">None selected</span>}
              </div>
            </Card>
            {dreamJob && (
              <Card className="p-4">
                <p className="text-sm font-medium mb-2">Dream Job</p>
                <p className="text-sm text-muted-foreground" data-testid="text-summary-dream-job">{dreamJob}</p>
              </Card>
            )}
            <Card className="p-4">
              <p className="text-sm font-medium mb-2">Suggested Pathways</p>
              <div className="flex flex-wrap gap-2">
                {getPathwaySuggestions().map((s) => (
                  <Badge key={s} data-testid={`badge-suggestion-${s.toLowerCase().replace(/\s+/g, "-")}`}>{s}</Badge>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
          data-testid="button-wizard-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        {step < totalSteps - 1 ? (
          <Button onClick={() => setStep(step + 1)} data-testid="button-wizard-next">
            Next <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={onComplete} data-testid="button-wizard-complete">
            <Check className="h-4 w-4 mr-2" /> Complete Pathway
          </Button>
        )}
      </div>
    </div>
  );
}

function QuarterlyReviewWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [achievements, setAchievements] = useState<string[]>([]);
  const [achievementInput, setAchievementInput] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [goalInput, setGoalInput] = useState("");

  const totalSteps = 4;
  const progress = ((step + 1) / totalSteps) * 100;

  function setRating(category: string, value: number) {
    setRatings({ ...ratings, [category]: value });
  }

  function addAchievement() {
    if (achievementInput.trim()) {
      setAchievements([...achievements, achievementInput.trim()]);
      setAchievementInput("");
    }
  }

  function addGoal() {
    if (goalInput.trim()) {
      setGoals([...goals, goalInput.trim()]);
      setGoalInput("");
    }
  }

  return (
    <div className="space-y-6" data-testid="wizard-quarterly-review">
      <Progress value={progress} className="h-2" data-testid="progress-wizard" />
      <p className="text-sm text-muted-foreground text-center">Step {step + 1} of {totalSteps}</p>

      {step === 0 && (
        <div data-testid="step-self-rating">
          <h3 className="text-lg font-semibold mb-2">Self-Rating</h3>
          <p className="text-sm text-muted-foreground mb-4">Rate your progress (1-5) in each area</p>
          <div className="space-y-4">
            {RATING_CATEGORIES.map((cat) => (
              <div key={cat} data-testid={`rating-row-${cat.toLowerCase()}`}>
                <p className="text-sm font-medium mb-2">{cat}</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <Button
                      key={v}
                      size="icon"
                      variant="ghost"
                      onClick={() => setRating(cat, v)}
                      data-testid={`button-rating-${cat.toLowerCase()}-${v}`}
                    >
                      <Star
                        className={`h-5 w-5 ${(ratings[cat] ?? 0) >= v ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`}
                      />
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div data-testid="step-achievements">
          <h3 className="text-lg font-semibold mb-2">Achievements This Quarter</h3>
          <p className="text-sm text-muted-foreground mb-4">List things you accomplished</p>
          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="Add an achievement..."
              value={achievementInput}
              onChange={(e) => setAchievementInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addAchievement()}
              data-testid="input-achievement"
            />
            <Button size="icon" onClick={addAchievement} data-testid="button-add-achievement" aria-label="Add achievement">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {achievements.map((a, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-md border p-2" data-testid={`achievement-item-${i}`}>
                <span className="text-sm">{a}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setAchievements(achievements.filter((_, idx) => idx !== i))}
                  data-testid={`button-remove-achievement-${i}`}
                  aria-label={`Remove achievement ${i + 1}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {achievements.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No achievements added yet</p>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div data-testid="step-goals">
          <h3 className="text-lg font-semibold mb-2">Goals for Next Quarter</h3>
          <p className="text-sm text-muted-foreground mb-4">Set goals for improvement</p>
          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="Add a goal..."
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addGoal()}
              data-testid="input-goal"
            />
            <Button size="icon" onClick={addGoal} data-testid="button-add-goal" aria-label="Add goal">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {goals.map((g, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-md border p-2" data-testid={`goal-item-${i}`}>
                <span className="text-sm">{g}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setGoals(goals.filter((_, idx) => idx !== i))}
                  data-testid={`button-remove-goal-${i}`}
                  aria-label={`Remove goal ${i + 1}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {goals.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No goals added yet</p>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div data-testid="step-review-summary">
          <h3 className="text-lg font-semibold mb-4">Quarterly Review Summary</h3>
          <div className="space-y-4">
            <Card className="p-4">
              <p className="text-sm font-medium mb-3">Self-Ratings</p>
              <div className="space-y-2">
                {RATING_CATEGORIES.map((cat) => (
                  <div key={cat} className="flex items-center justify-between gap-2">
                    <span className="text-sm">{cat}</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <Star
                          key={v}
                          className={`h-4 w-4 ${(ratings[cat] ?? 0) >= v ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <p className="text-sm font-medium mb-2">Achievements ({achievements.length})</p>
              {achievements.length > 0 ? (
                <ul className="space-y-1">
                  {achievements.map((a, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              ) : <span className="text-sm text-muted-foreground">None listed</span>}
            </Card>
            <Card className="p-4">
              <p className="text-sm font-medium mb-2">Goals ({goals.length})</p>
              {goals.length > 0 ? (
                <ul className="space-y-1">
                  {goals.map((g, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      {g}
                    </li>
                  ))}
                </ul>
              ) : <span className="text-sm text-muted-foreground">None listed</span>}
            </Card>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
          data-testid="button-wizard-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        {step < totalSteps - 1 ? (
          <Button onClick={() => setStep(step + 1)} data-testid="button-wizard-next">
            Next <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={onComplete} data-testid="button-wizard-complete">
            <Check className="h-4 w-4 mr-2" /> Submit Review
          </Button>
        )}
      </div>
    </div>
  );
}

export default function AcademyStudentWizardPage() {
  const [selectedWizard, setSelectedWizard] = useState<WizardType>(null);
  const { toast } = useToast();

  function handleComplete() {
    const wizard = WIZARDS.find((w) => w.id === selectedWizard);
    toast({
      title: `${wizard?.title} completed`,
      description: "Your selections have been saved successfully.",
    });
    setSelectedWizard(null);
  }

  if (selectedWizard) {
    const wizard = WIZARDS.find((w) => w.id === selectedWizard);
    return (
      <div className="min-h-screen">
        <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-rose-700 text-white p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Wand2 className="h-8 w-8" />
              <h1 className="text-3xl font-bold">Student Setup Wizards</h1>
            </div>
            <p className="text-rose-200 text-lg">
              Personalize every student's learning journey
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-6">
          <Button
            variant="ghost"
            onClick={() => setSelectedWizard(null)}
            className="mb-6"
            data-testid="button-back-to-wizards"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Wizard Selection
          </Button>

          <Card className="p-6" data-testid="card-wizard-content">
            <div className="flex items-center gap-3 mb-6">
              {wizard && <wizard.icon className="h-6 w-6 text-primary" />}
              <h2 className="text-xl font-bold">{wizard?.title}</h2>
            </div>
            {selectedWizard === "initial" && <InitialSetupWizard onComplete={handleComplete} />}
            {selectedWizard === "career" && <CareerPathwayWizard onComplete={handleComplete} />}
            {selectedWizard === "quarterly" && <QuarterlyReviewWizard onComplete={handleComplete} />}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-rose-700 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Wand2 className="h-8 w-8" />
            <h1 className="text-3xl font-bold" data-testid="text-page-title">
              Student Setup Wizards
            </h1>
          </div>
          <p className="text-rose-200 text-lg">
            Personalize every student's learning journey
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {WIZARDS.map((wizard) => {
            const Icon = wizard.icon as any;
            return (
              <Card
                key={wizard.id}
                className="p-6 hover-elevate cursor-pointer transition-all"
                onClick={() => setSelectedWizard(wizard.id as WizardType)}
                data-testid={`card-wizard-${wizard.id}`}
              >
                <div className={`rounded-md p-3 ${wizard.color} w-fit mb-4`}>
                  <Icon className={`h-6 w-6 ${wizard.iconColor}`} />
                </div>
                <h3
                  className="text-lg font-semibold mb-2"
                  data-testid={`text-wizard-title-${wizard.id}`}
                >
                  {wizard.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {wizard.description}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                    data-testid={`badge-wizard-${wizard.id}`}
                  >
                    <Check className="h-3 w-3 mr-1" /> Ready
                  </Badge>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => setSelectedWizard(wizard.id as WizardType)}
                    data-testid={`button-start-wizard-${wizard.id}`}
                  >
                    Start Wizard
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
