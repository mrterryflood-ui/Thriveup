import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { School, Users, BarChart3, BookOpen, Award, TrendingUp } from "lucide-react";
import { ErrorRetry } from "@/components/error-retry";
import { useAuth } from "@/hooks/use-auth";

interface ClassroomWithStats {
  id: string;
  name: string;
  gradeBand: string;
  inviteCode: string;
  teacherName: string;
  createdAt: string | null;
  studentCount: number;
  averageScore: number;
  totalLessonsCompleted: number;
  totalQuizzesCompleted: number;
  averagePoints: number;
}

interface TeacherDashboardData {
  classrooms: ClassroomWithStats[];
}

export default function TeacherDashboardPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();

  const { data, isLoading, error, refetch } = useQuery<TeacherDashboardData>({
    queryKey: ["/api/teacher/dashboard"],
    enabled: isAuthenticated,
  });

  if (authLoading) {
  
  useEffect(() => { document.title = "Teacher Dashboard | AI Mastery Academy"; }, []);
  return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-md mx-auto text-center mt-20">
        <Card className="p-8">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-bold mb-2" data-testid="text-login-prompt">
            Sign in to access Teacher Dashboard
          </h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Log in to view your classroom analytics and student progress.
          </p>
          <a href="/api/login">
            <Button data-testid="button-login">Sign In</Button>
          </a>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (error) return <div className="p-6"><ErrorRetry message="Failed to load teacher dashboard. Please try again." onRetry={refetch} /></div>;

  const classrooms = data?.classrooms ?? [];

  if (classrooms.length === 0) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold" data-testid="text-teacher-dashboard-title">Teacher Dashboard</h1>
          </div>
          <p className="text-muted-foreground">View analytics and track student progress across your classrooms.</p>
        </div>
        <div className="text-center py-16">
          <School className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h2 className="text-xl font-semibold mb-2" data-testid="text-empty-state">No classrooms yet</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Create your first classroom to start tracking student progress.
          </p>
          <Link href="/classrooms">
            <Button data-testid="button-create-first-classroom">Create your first classroom</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalStudents = classrooms.reduce((sum, c) => sum + c.studentCount, 0);
  const totalClassrooms = classrooms.length;
  const avgScore = totalClassrooms > 0
    ? Math.round(classrooms.reduce((sum, c) => sum + c.averageScore, 0) / totalClassrooms)
    : 0;
  const totalLessons = classrooms.reduce((sum, c) => sum + c.totalLessonsCompleted, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold" data-testid="text-teacher-dashboard-title">Teacher Dashboard</h1>
        </div>
        <p className="text-muted-foreground" data-testid="text-teacher-dashboard-subtitle">
          View analytics and track student progress across your classrooms.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-5" data-testid="card-total-students">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Total Students</span>
            <div className="rounded-md p-1.5 bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-total-students">{totalStudents}</p>
        </Card>
        <Card className="p-5" data-testid="card-total-classrooms">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Total Classrooms</span>
            <div className="rounded-md p-1.5 bg-violet-100 dark:bg-violet-900/30">
              <School className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-total-classrooms">{totalClassrooms}</p>
        </Card>
        <Card className="p-5" data-testid="card-avg-score">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Average Score</span>
            <div className="rounded-md p-1.5 bg-emerald-100 dark:bg-emerald-900/30">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-avg-score">{avgScore}%</p>
        </Card>
        <Card className="p-5" data-testid="card-total-lessons">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Total Lessons Completed</span>
            <div className="rounded-md p-1.5 bg-amber-100 dark:bg-amber-900/30">
              <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-total-lessons">{totalLessons}</p>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mb-4" data-testid="text-classrooms-section-heading">Your Classrooms</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classrooms.map((classroom) => (
          <Link key={classroom.id} href={`/classrooms/${classroom.id}`}>
            <Card className="p-5 hover-elevate cursor-pointer" data-testid={`card-dashboard-classroom-${classroom.id}`}>
              <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
                <div>
                  <h3 className="font-semibold" data-testid={`text-dashboard-classroom-name-${classroom.id}`}>
                    {classroom.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">Grades {classroom.gradeBand}</p>
                </div>
                <School className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 rounded-md bg-muted/50">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Users className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-bold" data-testid={`text-dc-students-${classroom.id}`}>{classroom.studentCount}</p>
                  <p className="text-xs text-muted-foreground">Students</p>
                </div>
                <div className="text-center p-2 rounded-md bg-muted/50">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-bold" data-testid={`text-dc-avg-score-${classroom.id}`}>{classroom.averageScore}%</p>
                  <p className="text-xs text-muted-foreground">Avg Score</p>
                </div>
                <div className="text-center p-2 rounded-md bg-muted/50">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <BookOpen className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-bold" data-testid={`text-dc-lessons-${classroom.id}`}>{classroom.totalLessonsCompleted}</p>
                  <p className="text-xs text-muted-foreground">Lessons</p>
                </div>
                <div className="text-center p-2 rounded-md bg-muted/50">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Award className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-bold" data-testid={`text-dc-points-${classroom.id}`}>{classroom.averagePoints}</p>
                  <p className="text-xs text-muted-foreground">Avg Points</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground flex-wrap">
                <span data-testid={`text-dc-quizzes-${classroom.id}`}>{classroom.totalQuizzesCompleted} quizzes completed</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
