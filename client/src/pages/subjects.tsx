import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams as useWouterParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen, Calculator, Microscope, Globe, Heart, Salad,
  ChevronRight, Sparkles, GraduationCap, Clock, Target
} from "lucide-react";
import type { Subject, Module } from "@shared/schema";

const GRADE_BANDS = ["3-5", "6-8", "9-12"];

const GRADE_BAND_LABELS: Record<string, string> = {
  "3-5": "Grades 3-5",
  "6-8": "Grades 6-8",
  "9-12": "Grades 9-12",
};

const GRADE_BAND_DESCRIPTIONS: Record<string, string> = {
  "3-5": "Deeper thinking, collaborative projects, and connecting learning to the real world.",
  "6-8": "Abstract reasoning, identity exploration, research skills, and preparing for high school.",
  "9-12": "Advanced analysis, leadership development, mental health awareness, and life planning.",
};

const SUBJECT_ICONS: Record<string, typeof BookOpen> = {
  BookOpen, Calculator, Microscope, Globe, Heart, Salad,
};

const SUBJECT_COLORS: Record<string, { bg: string; gradient: string }> = {
  rose: { bg: "bg-rose-100 dark:bg-rose-900/30", gradient: "from-rose-500 to-pink-600" },
  blue: { bg: "bg-blue-100 dark:bg-blue-900/30", gradient: "from-blue-500 to-indigo-600" },
  emerald: { bg: "bg-emerald-100 dark:bg-emerald-900/30", gradient: "from-emerald-500 to-teal-600" },
  amber: { bg: "bg-amber-100 dark:bg-amber-900/30", gradient: "from-amber-500 to-orange-600" },
  pink: { bg: "bg-pink-100 dark:bg-pink-900/30", gradient: "from-pink-500 to-rose-600" },
  teal: { bg: "bg-teal-100 dark:bg-teal-900/30", gradient: "from-teal-500 to-cyan-600" },
};

export default function SubjectsPage() {
  const [selectedBand, setSelectedBand] = useState<string>("3-5");

  const { data: allSubjects, isLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const filteredSubjects = allSubjects?.filter(s => s.gradeBand === selectedBand) || [];

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="flex gap-2 mb-8">
          {GRADE_BANDS.map((_, i) => <Skeleton key={i} className="h-9 w-24" />)}
        </div>
        {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold" data-testid="text-subjects-heading">Subjects</h1>
        </div>
        <p className="text-muted-foreground" data-testid="text-subjects-description">
          Six core subject areas designed to support the whole child across grades 3 through 12.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {GRADE_BANDS.map((band) => (
          <Button
            key={band}
            variant={selectedBand === band ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedBand(band)}
            data-testid={`button-grade-band-${band}`}
            className="toggle-elevate"
          >
            {band}
          </Button>
        ))}
      </div>

      <Card className="p-5 mb-8">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <h2 className="font-semibold mb-1" data-testid="text-grade-band-label">
              {GRADE_BAND_LABELS[selectedBand]}
            </h2>
            <p className="text-sm text-muted-foreground">{GRADE_BAND_DESCRIPTIONS[selectedBand]}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSubjects.map((subject) => {
          const Icon = SUBJECT_ICONS[subject.iconName] || BookOpen;
          const colors = SUBJECT_COLORS[subject.color] || SUBJECT_COLORS.rose;
          return (
            <Link key={subject.id} href={`/subject/${subject.id}`}>
              <Card className="p-5 hover-elevate cursor-pointer group h-full" data-testid={`card-subject-${subject.id}`}>
                <div className="flex items-start gap-4">
                  <div className={`rounded-md p-2.5 bg-gradient-to-br ${colors.gradient} shrink-0`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold">{subject.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{subject.description}</p>
                    <Badge variant="outline" className="text-xs">{subject.theme}</Badge>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {filteredSubjects.length === 0 && (
        <Card className="p-8 text-center" data-testid="card-empty-subjects">
          <p className="text-muted-foreground" data-testid="text-empty-subjects">No subjects found for this grade band yet.</p>
        </Card>
      )}
    </div>
  );
}

export function SubjectDetailPage() {
  const params = useWouterParams<{ subjectId: string }>();
  const subjectId = params.subjectId || "";

  const { data: subject, isLoading: subjectLoading } = useQuery<Subject>({
    queryKey: ["/api/subjects", subjectId],
  });

  const { data: subjectModules, isLoading: modulesLoading } = useQuery<Module[]>({
    queryKey: ["/api/subjects", subjectId, "modules"],
  });

  const isLoading = subjectLoading || modulesLoading;

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!subject) return null;

  const Icon = SUBJECT_ICONS[subject.iconName] || BookOpen;
  const colors = SUBJECT_COLORS[subject.color] || SUBJECT_COLORS.rose;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link href="/subjects">
        <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-subjects">
          <ChevronRight className="mr-1 h-4 w-4 rotate-180" /> All Subjects
        </Button>
      </Link>

      <Card className={`p-8 mb-8 bg-gradient-to-br ${colors.gradient} text-white border-none`}>
        <div className="flex items-start gap-5 flex-wrap">
          <div className="rounded-md p-3 bg-white/20 shrink-0">
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <Badge className="mb-2 bg-white/20 text-white border-white/30">{subject.gradeBand}</Badge>
            <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-subject-detail-name">{subject.name}</h1>
            <p className="text-white/80 text-sm mb-2" data-testid="text-subject-detail-theme">{subject.theme}</p>
            <p className="text-white/70 text-sm leading-relaxed" data-testid="text-subject-detail-description">{subject.description}</p>
          </div>
        </div>
      </Card>

      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" /> Modules
      </h2>

      <div className="space-y-3">
        {subjectModules?.map((mod) => (
          <Link key={mod.id} href={`/module/${mod.id}`}>
            <Card className="p-5 hover-elevate cursor-pointer group" data-testid={`card-module-${mod.id}`}>
              <div className="flex items-start gap-4 flex-wrap">
                <div className={`rounded-md flex items-center justify-center w-10 h-10 font-bold text-sm shrink-0 ${colors.bg}`}>
                  {mod.moduleNumber}
                </div>
                <div className="flex-1 min-w-[200px]">
                  <h3 className="font-semibold mb-1">{mod.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{mod.description}</p>
                  {mod.storyArcTitle && (
                    <Badge variant="outline" className="text-xs">{mod.storyArcTitle}</Badge>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

