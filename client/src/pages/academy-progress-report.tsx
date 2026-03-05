import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Printer, Trophy, Zap, Award, Star, BookOpen, Users, Lightbulb, Heart, GraduationCap } from "lucide-react";
import { ErrorRetry } from "@/components/error-retry";
import { PageHeader } from "@/components/page-header";

export default function AcademyProgressReportPage() {
  useEffect(() => { document.title = 'Progress Report | AI Mastery Academy'; }, []);

  const { user, isLoading: authLoading } = useAuth();

  const { data: progress, isLoading: progressLoading, error: progressError, refetch: refetchProgress } = useQuery<any>({
    queryKey: ["/api/progress"],
    enabled: !!user,
  });

  const { data: achievements, isLoading: achievementsLoading } = useQuery<any>({
    queryKey: ["/api/achievements"],
    enabled: !!user,
  });

  const { data: pantherPower, isLoading: powerLoading } = useQuery<any>({
    queryKey: ["/api/academy/panther-power"],
    enabled: !!user,
  });

  const { data: thriveScore, isLoading: thriveLoading } = useQuery<any>({
    queryKey: ["/api/thrive/score"],
    enabled: !!user,
  });

  const isLoading = authLoading || progressLoading || achievementsLoading || powerLoading || thriveLoading;

  const powerCategories = [
    { label: "Education", value: pantherPower?.educationScore ?? 0, icon: GraduationCap },
    { label: "Character", value: pantherPower?.characterScore ?? 0, icon: Heart },
    { label: "Leadership", value: pantherPower?.leadershipScore ?? 0, icon: Star },
    { label: "Entrepreneurship", value: pantherPower?.entrepreneurshipScore ?? 0, icon: Lightbulb },
    { label: "Community", value: pantherPower?.communityScore ?? 0, icon: Users },
  ];

  if (progressError) {
    return <div className="p-6"><ErrorRetry message="Failed to load progress report." onRetry={refetchProgress} /></div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin w-8 h-8 border-4 border-[#800000] border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground" data-testid="text-loading">Loading progress report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 pt-4 print:hidden">
        <PageHeader
          title="Progress Report"
          breadcrumbs={[
            { label: "Academy", href: "/academy" },
            { label: "Progress Report" },
          ]}
        />
      </div>
      <div className="bg-[#800000] text-white py-8 px-4 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Progress Report</h1>
            <p className="text-white/80">Complete academic snapshot</p>
          </div>
          <Button
            variant="outline"
            className="border-white text-white bg-transparent"
            onClick={() => window.print()}
            data-testid="button-print"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#800000] flex items-center justify-center text-white font-bold text-lg">
              {(user?.firstName?.[0] ?? user?.email?.[0] ?? "S").toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold" data-testid="text-student-name">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.firstName ?? user?.email ?? "Student"}
              </h2>
              <p className="text-sm text-muted-foreground" data-testid="text-student-level">
                Level {progress?.currentLevel ?? 1}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-[#800000]" />
            <h3 className="text-lg font-semibold" data-testid="text-academic-title">Academic Progress</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="text-center p-3 rounded-md bg-muted/50">
              <p className="text-2xl font-bold text-[#800000]" data-testid="text-total-points">{progress?.totalPoints ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total Points</p>
            </div>
            <div className="text-center p-3 rounded-md bg-muted/50">
              <p className="text-2xl font-bold text-[#800000]" data-testid="text-current-streak">{progress?.streakDays ?? 0}</p>
              <p className="text-xs text-muted-foreground">Current Streak</p>
            </div>
            <div className="text-center p-3 rounded-md bg-muted/50">
              <p className="text-2xl font-bold text-[#800000]" data-testid="text-longest-streak">{progress?.longestStreak ?? 0}</p>
              <p className="text-xs text-muted-foreground">Longest Streak</p>
            </div>
            <div className="text-center p-3 rounded-md bg-muted/50">
              <p className="text-2xl font-bold text-[#800000]" data-testid="text-lessons-completed">{progress?.lessonsCompleted ?? 0}</p>
              <p className="text-xs text-muted-foreground">Lessons Completed</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-[#800000]" />
            <h3 className="text-lg font-semibold" data-testid="text-power-title">Panther Power</h3>
          </div>
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#800000]" data-testid="text-power-total">{pantherPower?.totalScore ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total Score</p>
            </div>
            <div className="text-center">
              <Badge variant="secondary" data-testid="text-power-level">Level {pantherPower?.level ?? 1}</Badge>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" data-testid="text-power-title-name">{pantherPower?.title ?? "Young Panther"}</p>
            </div>
          </div>
          <div className="space-y-3">
            {powerCategories.map((cat) => (
              <div key={cat.label} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <cat.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{cat.label}</span>
                  </div>
                  <span className="text-sm text-muted-foreground" data-testid={`text-power-${cat.label.toLowerCase()}`}>{cat.value}/100</span>
                </div>
                <Progress value={Math.min(cat.value, 100)} className="h-2" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-[#800000]" />
            <h3 className="text-lg font-semibold" data-testid="text-thrive-title">Thrive Score</h3>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#800000]" data-testid="text-thrive-score">
                {thriveScore?.compositeScore ?? thriveScore?.totalScore ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Composite Score</p>
            </div>
            {thriveScore?.description && (
              <p className="text-sm text-muted-foreground" data-testid="text-thrive-description">{thriveScore.description}</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-[#800000]" />
            <h3 className="text-lg font-semibold" data-testid="text-achievements-title">Achievements</h3>
          </div>
          {achievements?.earnedBadges && achievements.earnedBadges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {achievements.earnedBadges.map((eb: any, i: number) => (
                <Badge key={eb.id ?? i} variant="secondary" data-testid={`badge-earned-${i}`}>
                  <Award className="w-3 h-3 mr-1" />
                  {eb.badge?.name ?? eb.badgeId ?? "Badge"}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground" data-testid="text-no-badges">No badges earned yet. Keep learning to unlock achievements!</p>
          )}
        </Card>

        <div className="text-center text-xs text-muted-foreground py-4" data-testid="text-report-date">
          Report Generated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
