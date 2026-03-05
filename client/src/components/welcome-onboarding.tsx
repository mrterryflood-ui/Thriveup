import { useState } from "react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Home,
  User,
  Briefcase,
  Zap,
  Heart,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface WelcomeOnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
}

const STEPS = [
  {
    icon: Home,
    title: "Welcome to Panther Village!",
    description:
      "You've just arrived at your very own virtual campus! Panther Village is where everything happens — from learning to earning to building your future.",
    secondary: "Ready to explore? Let's take a quick tour!",
    bgColor: "bg-rose-100 dark:bg-rose-900/40",
    iconColor: "text-rose-700 dark:text-rose-300",
  },
  {
    icon: User,
    title: "Build Your Avatar",
    description:
      "First things first — create your avatar! Choose your look, style, and background. This is how you'll appear on campus.",
    secondary:
      "Your avatar also shows your personality based on your daily check-ins. It's all about being YOU.",
    link: "/academy/avatar",
    linkLabel: "Go to Avatar Builder",
    bgColor: "bg-violet-100 dark:bg-violet-900/40",
    iconColor: "text-violet-700 dark:text-violet-300",
  },
  {
    icon: Briefcase,
    title: "Explore Career Paths",
    description:
      "Discover 50+ career fields — from software engineering to welding, military service to entrepreneurship. There's no wrong path, only YOUR path.",
    secondary:
      "Save careers that interest you and track your journey all the way to graduation.",
    link: "/academy/careers",
    linkLabel: "Explore Careers",
    bgColor: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-700 dark:text-blue-300",
  },
  {
    icon: Zap,
    title: "Earn Panther Power",
    description:
      "Everything you do earns Panther Power points across five categories: Education, Character, Leadership, Entrepreneurship, and Community.",
    secondary:
      "Complete quests, participate in competitions, and watch your power grow!",
    link: "/academy/power",
    linkLabel: "View Panther Power",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/40",
    iconColor: "text-yellow-700 dark:text-yellow-300",
  },
  {
    icon: Heart,
    title: "Your Daily Check-In",
    description:
      "Every day, you can do a quick check-in to share how you're feeling — your energy, focus, mood, and more. It's private and helps your teachers support you better.",
    secondary: "This is 100% optional and always confidential.",
    link: "/academy/self-assessment",
    linkLabel: "Try a Check-In",
    bgColor: "bg-pink-100 dark:bg-pink-900/40",
    iconColor: "text-pink-700 dark:text-pink-300",
  },
  {
    icon: Sparkles,
    title: "You're Ready!",
    description:
      "That's it! You're officially an AI Mastery Academy Panther. Your campus, your career, your future — it all starts right here.",
    secondary: "Click 'Start Exploring' to begin your journey!",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-700 dark:text-emerald-300",
  },
];

export default function WelcomeOnboarding({
  isOpen,
  onComplete,
}: WelcomeOnboardingProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;
  const IconComp = current.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onComplete(); }}>
      <DialogContent
        className="max-w-lg"
        data-testid="onboarding-dialog"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Student Onboarding</DialogTitle>

        <div className="flex flex-col items-center text-center" data-testid={`onboarding-step-${step}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${current.bgColor}`}>
            <IconComp className={`h-10 w-10 ${current.iconColor}`} />
          </div>

          <h2 className="text-xl font-bold mb-3">{current.title}</h2>

          <p className="text-sm text-muted-foreground mb-2 max-w-sm">
            {current.description}
          </p>

          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            {current.secondary}
          </p>

          {current.link && (
            <Link href={current.link} data-testid="link-onboarding-action">
              <Button
                variant="outline"
                size="sm"
                className="mb-4 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300"
                data-testid={`onboarding-link-${step}`}
                onClick={onComplete}
              >
                {current.linkLabel}
              </Button>
            </Link>
          )}

          {isLast && (
            <Button
              className="mb-4 bg-rose-700 hover:bg-rose-800 text-white"
              data-testid="button-start-exploring"
              onClick={onComplete}
            >
              Start Exploring
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={onComplete}
            data-testid="button-skip-onboarding"
          >
            Skip
          </Button>

          <div className="flex items-center gap-1.5" data-testid="onboarding-progress-dots">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === step
                    ? "bg-rose-700 dark:bg-rose-400"
                    : "bg-muted-foreground/25"
                }`}
                data-testid={`onboarding-dot-${i}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1">
            {!isFirst && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setStep(step - 1)}
                data-testid="button-previous-step"
                aria-label="Previous step"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {!isLast && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setStep(step + 1)}
                data-testid="button-next-step"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
