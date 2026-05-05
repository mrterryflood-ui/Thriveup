import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Users, Calendar, Flame, ShieldAlert } from "lucide-react";
import { ErrorRetry } from "@/components/error-retry";
import { PageHeader } from "@/components/page-header";

interface AttendanceLog {
  id: string;
  userId: string;
  studentName: string;
  loginDate: string;
  loginTime: string | null;
}

interface StudentStats {
  userId: string;
  studentName: string;
  totalLogins: number;
  lastLogin: string;
  streak: number;
  loginDates: string[];
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = Array.from(new Set(dates)).sort((a, b) => b.localeCompare(a));
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function groupByStudent(logs: AttendanceLog[]): StudentStats[] {
  const map = new Map<string, { name: string; dates: string[] }>();
  for (const log of logs) {
    const existing = map.get(log.userId);
    if (existing) {
      existing.dates.push(log.loginDate);
    } else {
      map.set(log.userId, { name: log.studentName, dates: [log.loginDate] });
    }
  }
  const stats: StudentStats[] = [];
  for (const [userId, data] of Array.from(map.entries())) {
    const sortedDates = [...data.dates].sort((a, b) => b.localeCompare(a));
    stats.push({
      userId,
      studentName: data.name,
      totalLogins: data.dates.length,
      lastLogin: sortedDates[0],
      streak: calculateStreak(data.dates),
      loginDates: sortedDates,
    });
  }
  return stats.sort((a, b) => b.lastLogin.localeCompare(a.lastLogin));
}

export default function AcademyAttendancePage() {
  useEffect(() => { document.title = 'Attendance | ThriveUp Academy'; }, []);
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = !!(user as any)?.isAdmin;

  const { data: logs, isLoading: logsLoading, error: logsError, refetch: refetchLogs } = useQuery<AttendanceLog[]>({
    queryKey: ["/api/attendance"],
    enabled: isAdmin,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#800000] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 pt-6">
        <PageHeader
          title="Attendance Tracking"
          description="Student login activity"
          breadcrumbs={[
            { label: "Academy", href: "/academy" },
            { label: "Attendance" },
          ]}
        />
        </div>
        <div className="max-w-4xl mx-auto p-4">
          <Card className="p-8 text-center">
            <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium" data-testid="text-admin-only">This page is for teachers and administrators only</p>
            <p className="text-sm text-muted-foreground mt-2">Please contact your administrator for access.</p>
          </Card>
        </div>
      </div>
    );
  }

  const studentStats = logs ? groupByStudent(logs) : [];
  const today = new Date().toISOString().split("T")[0];
  const todayLogins = new Set(logs?.filter((l) => l.loginDate === today).map((l) => l.userId) ?? []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <PageHeader
          title="Attendance Tracking"
          description="Monitor student login activity and streaks"
          breadcrumbs={[
            { label: "Academy", href: "/academy" },
            { label: "Attendance" },
          ]}
        />
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {logsError ? (
          <div className="p-6"><ErrorRetry message="Failed to load attendance data. Please try again." onRetry={refetchLogs} /></div>
        ) : logsLoading ? (
          <div data-testid="loading-skeleton-academy-attendance" className="space-y-4">
            <Card className="p-6">
              <Skeleton className="h-5 w-40 mb-4" />
              <div className="flex items-center gap-6 flex-wrap">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="text-center space-y-2">
                    <Skeleton className="h-9 w-16 mx-auto" />
                    <Skeleton className="h-3 w-28 mx-auto" />
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-6">
              <Skeleton className="h-5 w-36 mb-4" />
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-1/6" />
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/6" />
                    <Skeleton className="h-4 w-1/6" />
                    <Skeleton className="h-4 w-1/6" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <>
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-[#800000]" />
                <h3 className="text-lg font-semibold" data-testid="text-today-title">Today's Summary</h3>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#800000]" data-testid="text-today-count">{todayLogins.size}</p>
                  <p className="text-xs text-muted-foreground">Students Logged In Today</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#800000]" data-testid="text-total-students">{studentStats.length}</p>
                  <p className="text-xs text-muted-foreground">Total Students</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#800000]" data-testid="text-total-logins">{logs?.length ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Total Login Records</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-[#800000]" />
                <h3 className="text-lg font-semibold" data-testid="text-summary-title">Student Summary</h3>
              </div>
              {studentStats.length === 0 ? (
                <p className="text-sm text-muted-foreground" data-testid="text-no-data">No attendance data yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="table-attendance">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-medium">Student</th>
                        <th className="text-center py-2 px-2 font-medium">Total Logins</th>
                        <th className="text-center py-2 px-2 font-medium">Last Login</th>
                        <th className="text-center py-2 pl-2 font-medium">Streak</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentStats.map((s, i) => (
                        <tr key={s.userId} className="border-b last:border-0" data-testid={`row-student-${i}`}>
                          <td className="py-2 pr-4 font-medium" data-testid={`text-student-name-${i}`}>{s.studentName}</td>
                          <td className="text-center py-2 px-2" data-testid={`text-total-logins-${i}`}>{s.totalLogins}</td>
                          <td className="text-center py-2 px-2" data-testid={`text-last-login-${i}`}>{s.lastLogin}</td>
                          <td className="text-center py-2 pl-2">
                            <div className="flex items-center justify-center gap-1">
                              <Flame className="w-3 h-3 text-orange-500" />
                              <span data-testid={`text-streak-${i}`}>{s.streak}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {studentStats.map((s, i) => (
              <Card key={s.userId} className="p-6" data-testid={`card-student-${i}`}>
                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-[#800000]" />
                    <h4 className="font-semibold" data-testid={`text-card-name-${i}`}>{s.studentName}</h4>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" data-testid={`badge-logins-${i}`}>{s.totalLogins} logins</Badge>
                    <Badge variant="secondary" data-testid={`badge-streak-${i}`}>
                      <Flame className="w-3 h-3 mr-1 text-orange-500" />
                      {s.streak} day streak
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {s.loginDates.slice(0, 30).map((d, j) => (
                    <Badge key={j} variant="outline" className="text-xs" data-testid={`badge-date-${i}-${j}`}>
                      {d}
                    </Badge>
                  ))}
                  {s.loginDates.length > 30 && (
                    <Badge variant="outline" className="text-xs">+{s.loginDates.length - 30} more</Badge>
                  )}
                </div>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
