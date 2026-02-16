import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  BookOpen,
  MessageCircle,
  Heart,
  ArrowRight,
  Lightbulb,
  CheckCircle,
} from "lucide-react";

const moduleReferences: Record<string, { module: string; reminder: string }> = {
  "stocks:buy_stock": {
    module: "Money Foundations",
    reminder: "Before buying, ask: Is this money I can afford to lose? Do I have my rainy day fund set first?",
  },
  "stocks:sell_stock": {
    module: "Patience Pays",
    reminder: "Remember: short-term capital gains are taxed higher. Patience often pays more than quick moves.",
  },
  "stocks:large_trade": {
    module: "Risk, Diversification & Smart Decisions",
    reminder: "Putting too much into one stock is like eating only one food — if it goes bad, you're in trouble.",
  },
  "marketplace:purchase": {
    module: "Rainy Day Fund & Asset Accountability",
    reminder: "Is this a need or a want? Do you still have enough saved for unexpected expenses?",
  },
  "scenarios:risky_choice": {
    module: "Investing vs. Gambling",
    reminder: "Is this a calculated risk with potential upside, or are you just hoping to get lucky?",
  },
};

const stagesOfChange = [
  "Not Sure Yet",
  "Thinking About It",
  "Getting Ready",
  "Taking Action",
  "Keeping It Going",
];

interface RiskDecisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riskLevel: "low" | "moderate" | "high";
  featureArea: string;
  actionType: string;
  warningMessage: string;
  financialLiteracyModule?: string;
  metadata?: Record<string, any>;
  onProceed: () => void;
  onCancel: () => void;
}

function getRiskBadgeClasses(riskLevel: "low" | "moderate" | "high") {
  switch (riskLevel) {
    case "low":
      return "bg-green-600 text-white border-green-700";
    case "moderate":
      return "bg-amber-500 text-white border-amber-600";
    case "high":
      return "bg-red-600 text-white border-red-700";
  }
}

export function RiskDecisionDialog({
  open,
  onOpenChange,
  riskLevel,
  featureArea,
  actionType,
  warningMessage,
  financialLiteracyModule,
  metadata,
  onProceed,
  onCancel,
}: RiskDecisionDialogProps) {
  const [stage, setStage] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (open) {
      setStage(1);
    }
  }, [open]);

  const logDecisionMutation = useMutation({
    mutationFn: async (overrideChosen: boolean) => {
      await apiRequest("POST", "/api/risk-decisions", {
        featureArea,
        actionType,
        riskLevel,
        warningMessage,
        overrideChosen,
        metadata,
        financialLiteracyModule,
      });
    },
  });

  const moduleKey = `${featureArea}:${actionType}`;
  const moduleRef = moduleReferences[moduleKey];
  const displayModule = financialLiteracyModule || moduleRef?.module || "Financial Literacy";
  const displayReminder = moduleRef?.reminder || "Think carefully about how this decision fits into your overall financial plan.";

  function handleCancel() {
    logDecisionMutation.mutate(false);
    onCancel();
  }

  function handleProceed() {
    logDecisionMutation.mutate(true);
    onProceed();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg" data-testid="dialog-risk-decision">
        {stage === 1 && (
          <div className="space-y-4" data-testid="stage-warning">
            <DialogHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <Shield className="h-5 w-5" style={{ color: "#800000" }} />
                <DialogTitle className="text-lg" style={{ color: "#800000" }} data-testid="title-warning">
                  Hold Up — Let's Think About This
                </DialogTitle>
              </div>
              <DialogDescription className="sr-only">
                Risk warning for your financial decision
              </DialogDescription>
            </DialogHeader>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium" data-testid="text-warning-message">
                  {warningMessage}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold" data-testid="text-module-title">What We've Learned</p>
                </div>
                <p className="text-sm text-muted-foreground" data-testid="text-module-reminder">
                  Remember from {displayModule}: "{displayReminder}"
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold" data-testid="text-real-talk-title">Real Talk</p>
                </div>
                <p className="text-sm text-muted-foreground" data-testid="text-real-talk">
                  We know life doesn't always go by the textbook. Sometimes you need money now, not later. Sometimes the safe choice doesn't feel like an option. That's okay. This isn't about judging you — it's about making sure you have the information before you decide.
                </p>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button
                style={{ backgroundColor: "#800000", borderColor: "#800000", color: "white" }}
                onClick={handleCancel}
                data-testid="button-risk-think"
              >
                I'll Think About It
              </Button>
              <Button
                variant="outline"
                onClick={() => setStage(2)}
                data-testid="button-risk-understand"
              >
                I Understand the Risk
              </Button>
            </div>
          </div>
        )}

        {stage === 2 && (
          <div className="space-y-4" data-testid="stage-consult">
            <DialogHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <MessageCircle className="h-5 w-5" style={{ color: "#800000" }} />
                <DialogTitle className="text-lg" style={{ color: "#800000" }} data-testid="title-consult">
                  One More Thing...
                </DialogTitle>
              </div>
              <DialogDescription className="sr-only">
                Consultation recommendation before proceeding
              </DialogDescription>
            </DialogHeader>

            <p className="text-sm" data-testid="text-consult-message">
              We recommend talking to a parent, teacher, or trusted adult before making this decision. They might see something you haven't considered yet, and getting advice isn't a sign of weakness — it's a sign of wisdom.
            </p>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Lightbulb className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold" data-testid="text-stages-title">Stages of Change</p>
                </div>
                <div className="flex flex-wrap items-center gap-1" data-testid="display-stages-of-change">
                  {stagesOfChange.map((s, i) => (
                    <span key={s} className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">{s}</span>
                      {i < stagesOfChange.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      )}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground" data-testid="text-stages-description">
                  Everyone starts somewhere. Whether you're just learning about money or already making moves, each stage is progress. There's no wrong place to be.
                </p>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Risk Level:</span>
              <Badge
                className={getRiskBadgeClasses(riskLevel)}
                data-testid="badge-risk-level"
              >
                {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button
                style={{ backgroundColor: "#800000", borderColor: "#800000", color: "white" }}
                onClick={handleCancel}
                data-testid="button-risk-consult"
              >
                I'll Talk to Someone First
              </Button>
              <Button
                variant="outline"
                onClick={() => setStage(3)}
                data-testid="button-risk-proceed"
              >
                I've Made My Decision — Proceed
              </Button>
            </div>
          </div>
        )}

        {stage === 3 && (
          <div className="space-y-4" data-testid="stage-acknowledgment">
            <DialogHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <CheckCircle className="h-5 w-5" style={{ color: "#800000" }} />
                <DialogTitle className="text-lg" style={{ color: "#800000" }} data-testid="title-acknowledgment">
                  Your Decision, Your Journey
                </DialogTitle>
              </div>
              <DialogDescription className="sr-only">
                Decision acknowledgment
              </DialogDescription>
            </DialogHeader>

            <p className="text-sm" data-testid="text-acknowledgment-message">
              Your choice has been noted. This isn't a punishment — it's how we learn. Your teachers and mentors will be able to see this decision so they can check in, offer support, and celebrate your growth. We're all on the same team.
            </p>

            <p className="text-xs text-muted-foreground italic" data-testid="text-learning-note">
              Every decision is a learning opportunity. Win or lose, the experience makes you smarter.
            </p>

            <div className="flex justify-end">
              <Button
                style={{ backgroundColor: "#800000", borderColor: "#800000", color: "white" }}
                onClick={handleProceed}
                disabled={logDecisionMutation.isPending}
                data-testid="button-risk-continue"
              >
                {logDecisionMutation.isPending ? "Logging..." : "Continue"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
