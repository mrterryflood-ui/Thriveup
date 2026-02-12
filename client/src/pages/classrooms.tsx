import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { School, Users, Copy, Plus, UserPlus, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Classroom, ClassroomMember } from "@shared/schema";

const createClassroomSchema = z.object({
  name: z.string().min(1, "Classroom name is required"),
  gradeBand: z.string().min(1, "Grade band is required"),
});

const joinClassroomSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required"),
});

type CreateClassroomForm = z.infer<typeof createClassroomSchema>;
type JoinClassroomForm = z.infer<typeof joinClassroomSchema>;

interface ClassroomsData {
  teacherClassrooms: (Classroom & { studentCount: number })[];
  studentClassrooms: Classroom[];
}

interface MemberWithProgress {
  id: string;
  classroomId: string;
  userId: string;
  studentName: string;
  joinedAt: string | null;
  lessonsCompleted: number;
  quizzesCompleted: number;
  averageScore: number;
  totalPoints: number;
  badgesEarned: number;
}

interface ClassroomDetailData {
  classroom: Classroom;
  members: MemberWithProgress[];
  stats: {
    studentCount: number;
    averageScore: number;
    averageLessonsCompleted: number;
  };
}

function LoginPrompt() {
  return (
    <div className="p-6 max-w-md mx-auto text-center mt-20">
      <Card className="p-8">
        <School className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-bold mb-2" data-testid="text-login-prompt">
          Sign in to access Classrooms
        </h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Log in to create or join classrooms and track student progress.
        </p>
        <a href="/api/login">
          <Button data-testid="button-login">Sign In</Button>
        </a>
      </Card>
    </div>
  );
}

function CreateClassroomForm() {
  const { toast } = useToast();
  const form = useForm<CreateClassroomForm>({
    resolver: zodResolver(createClassroomSchema),
    defaultValues: { name: "", gradeBand: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateClassroomForm) => {
      const res = await apiRequest("POST", "/api/classrooms", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms"] });
      form.reset();
      toast({ title: "Classroom created", description: "Your classroom is ready. Share the invite code with students." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card className="p-6" data-testid="card-create-classroom">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Plus className="h-5 w-5 text-primary" /> Create Classroom
      </h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Classroom Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. AI Explorers - Period 3" {...field} data-testid="input-classroom-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gradeBand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grade Band</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-grade-band">
                      <SelectValue placeholder="Select grade band" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="3-5" data-testid="option-grade-3-5">Grades 3-5</SelectItem>
                    <SelectItem value="6-8" data-testid="option-grade-6-8">Grades 6-8</SelectItem>
                    <SelectItem value="9-12" data-testid="option-grade-9-12">Grades 9-12</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={createMutation.isPending} data-testid="button-create-classroom">
            {createMutation.isPending ? "Creating..." : "Create Classroom"}
          </Button>
        </form>
      </Form>
    </Card>
  );
}

function JoinClassroomForm() {
  const { toast } = useToast();
  const form = useForm<JoinClassroomForm>({
    resolver: zodResolver(joinClassroomSchema),
    defaultValues: { inviteCode: "" },
  });

  const joinMutation = useMutation({
    mutationFn: async (data: JoinClassroomForm) => {
      const res = await apiRequest("POST", "/api/classrooms/join", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms"] });
      form.reset();
      toast({ title: "Joined classroom", description: "You have successfully joined the classroom." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card className="p-6" data-testid="card-join-classroom">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-primary" /> Join Classroom
      </h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => joinMutation.mutate(data))} className="space-y-4">
          <FormField
            control={form.control}
            name="inviteCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invite Code</FormLabel>
                <FormControl>
                  <Input placeholder="Enter invite code" {...field} data-testid="input-invite-code" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={joinMutation.isPending} data-testid="button-join-classroom">
            {joinMutation.isPending ? "Joining..." : "Join Classroom"}
          </Button>
        </form>
      </Form>
    </Card>
  );
}

function InviteCodeDisplay({ code }: { code: string }) {
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied", description: "Invite code copied to clipboard." });
  };

  return (
    <div className="flex items-center gap-2">
      <code className="px-2 py-1 rounded-md bg-muted text-sm font-mono" data-testid={`text-invite-code-${code}`}>
        {code}
      </code>
      <Button size="icon" variant="ghost" onClick={copyToClipboard} data-testid={`button-copy-code-${code}`}>
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}

function TeacherClassroomsList({ classrooms }: { classrooms: (Classroom & { studentCount: number })[] }) {
  if (classrooms.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <School className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No classrooms created yet. Create your first one above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {classrooms.map((classroom) => (
        <Card key={classroom.id} className="p-5" data-testid={`card-teacher-classroom-${classroom.id}`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="font-semibold" data-testid={`text-classroom-name-${classroom.id}`}>{classroom.name}</h4>
                <Badge variant="secondary" className="text-xs" data-testid={`badge-grade-${classroom.id}`}>
                  Grades {classroom.gradeBand}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1" data-testid={`text-student-count-${classroom.id}`}>
                  <Users className="h-3.5 w-3.5" /> {classroom.studentCount} students
                </span>
              </div>
              <div className="mt-2">
                <InviteCodeDisplay code={classroom.inviteCode} />
              </div>
            </div>
            <Link href={`/classrooms/${classroom.id}`}>
              <Button variant="outline" size="sm" data-testid={`button-view-classroom-${classroom.id}`}>
                View Details
              </Button>
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}

function StudentClassroomsList({ classrooms }: { classrooms: Classroom[] }) {
  if (classrooms.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">You haven't joined any classrooms yet. Use an invite code above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {classrooms.map((classroom) => (
        <Card key={classroom.id} className="p-5" data-testid={`card-student-classroom-${classroom.id}`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h4 className="font-semibold" data-testid={`text-joined-classroom-name-${classroom.id}`}>{classroom.name}</h4>
              <p className="text-sm text-muted-foreground">
                Teacher: {classroom.teacherName} &middot; Grades {classroom.gradeBand}
              </p>
            </div>
            <Link href={`/classrooms/${classroom.id}`}>
              <Button variant="outline" size="sm" data-testid={`button-view-joined-classroom-${classroom.id}`}>
                View Details
              </Button>
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function ClassroomsPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery<ClassroomsData>({
    queryKey: ["/api/classrooms"],
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-6 w-72" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <School className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold" data-testid="text-classrooms-heading">Classrooms</h1>
        </div>
        <p className="text-muted-foreground" data-testid="text-classrooms-subtitle">
          Create or join classrooms to collaborate and track learning progress.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <CreateClassroomForm />
        <JoinClassroomForm />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : data ? (
        <div className="space-y-8">
          {data.teacherClassrooms.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" data-testid="text-my-classrooms-heading">
                <School className="h-5 w-5 text-primary" /> My Classrooms
              </h2>
              <TeacherClassroomsList classrooms={data.teacherClassrooms} />
            </div>
          )}

          {data.studentClassrooms.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" data-testid="text-joined-classrooms-heading">
                <BookOpen className="h-5 w-5 text-primary" /> Joined Classrooms
              </h2>
              <StudentClassroomsList classrooms={data.studentClassrooms} />
            </div>
          )}

          {data.teacherClassrooms.length === 0 && data.studentClassrooms.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <School className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium mb-1">No classrooms yet</p>
              <p className="text-sm">Create a classroom as a teacher or join one with an invite code.</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function ClassroomDetailPage({ params }: { params: { classroomId: string } }) {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<ClassroomDetailData>({
    queryKey: ["/api/classrooms", params.classroomId],
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 mt-6" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 mt-6" />
      </div>
    );
  }

  if (!data) return null;

  const { classroom, members, stats } = data;

  const copyInviteCode = () => {
    navigator.clipboard.writeText(classroom.inviteCode);
    toast({ title: "Copied", description: "Invite code copied to clipboard." });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/classrooms">
          <Button variant="ghost" size="sm" className="mb-2" data-testid="button-back-to-classrooms">
            Back to Classrooms
          </Button>
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold mb-1" data-testid="text-classroom-detail-name">{classroom.name}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary" data-testid="badge-detail-grade">{`Grades ${classroom.gradeBand}`}</Badge>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Invite Code:</span>
                <code className="px-2 py-1 rounded-md bg-muted text-sm font-mono font-bold" data-testid="text-detail-invite-code">
                  {classroom.inviteCode}
                </code>
                <Button size="icon" variant="ghost" onClick={copyInviteCode} data-testid="button-copy-detail-code">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="p-5" data-testid="card-stat-students">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Students</span>
            <div className="rounded-md p-1.5 bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-stat-student-count">{stats.studentCount}</p>
        </Card>
        <Card className="p-5" data-testid="card-stat-avg-score">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Average Score</span>
            <div className="rounded-md p-1.5 bg-violet-100 dark:bg-violet-900/30">
              <School className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-stat-avg-score">{stats.averageScore}%</p>
        </Card>
        <Card className="p-5" data-testid="card-stat-avg-lessons">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Avg Lessons Completed</span>
            <div className="rounded-md p-1.5 bg-emerald-100 dark:bg-emerald-900/30">
              <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-stat-avg-lessons">{stats.averageLessonsCompleted}</p>
        </Card>
      </div>

      <Card className="p-6" data-testid="card-student-table">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Students
        </h2>

        {members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No students have joined yet. Share the invite code to get started.</p>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="hidden sm:grid grid-cols-6 gap-3 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <div className="col-span-1">Name</div>
              <div className="col-span-1 text-center">Lessons</div>
              <div className="col-span-1 text-center">Quizzes</div>
              <div className="col-span-1 text-center">Avg Score</div>
              <div className="col-span-1 text-center">Points</div>
              <div className="col-span-1 text-center">Badges</div>
            </div>
            {members.map((member, index) => (
              <div
                key={member.id}
                className={`grid grid-cols-1 sm:grid-cols-6 gap-3 px-3 py-3 rounded-md ${index % 2 === 0 ? "bg-muted/30" : ""}`}
                data-testid={`row-student-${member.id}`}
              >
                <div className="col-span-1 font-medium text-sm" data-testid={`text-student-name-${member.id}`}>
                  {member.studentName}
                </div>
                <div className="col-span-1 text-center text-sm" data-testid={`text-student-lessons-${member.id}`}>
                  <span className="sm:hidden text-muted-foreground text-xs mr-1">Lessons:</span>
                  {member.lessonsCompleted}
                </div>
                <div className="col-span-1 text-center text-sm" data-testid={`text-student-quizzes-${member.id}`}>
                  <span className="sm:hidden text-muted-foreground text-xs mr-1">Quizzes:</span>
                  {member.quizzesCompleted}
                </div>
                <div className="col-span-1 text-center text-sm" data-testid={`text-student-score-${member.id}`}>
                  <span className="sm:hidden text-muted-foreground text-xs mr-1">Avg Score:</span>
                  {member.averageScore}%
                </div>
                <div className="col-span-1 text-center text-sm" data-testid={`text-student-points-${member.id}`}>
                  <span className="sm:hidden text-muted-foreground text-xs mr-1">Points:</span>
                  {member.totalPoints}
                </div>
                <div className="col-span-1 text-center text-sm" data-testid={`text-student-badges-${member.id}`}>
                  <span className="sm:hidden text-muted-foreground text-xs mr-1">Badges:</span>
                  {member.badgesEarned}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
