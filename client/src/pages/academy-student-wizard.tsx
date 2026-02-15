import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wand2,
  UserCheck,
  Briefcase,
  ClipboardCheck,
  ArrowLeft,
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

export default function AcademyStudentWizardPage() {
  const [selectedWizard, setSelectedWizard] = useState<WizardType>(null);

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

          <Card className="p-8 text-center" data-testid="card-wizard-placeholder">
            <Wand2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{wizard?.title}</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Coming Soon
            </p>
            <p className="text-muted-foreground max-w-md mx-auto">
              This wizard will be fully interactive when connected to real
              student data
            </p>
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
                <div className="flex items-center justify-between">
                  <Badge variant="outline" data-testid={`badge-wizard-${wizard.id}`}>
                    Coming Soon
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
