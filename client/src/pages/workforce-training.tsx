import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TrainingProgram, TrainingEnrollment } from "@shared/schema";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GraduationCap,
  Search,
  Clock,
  DollarSign,
  MapPin,
  ExternalLink,
  BookOpen,
  Award,
  Shield,
  CheckCircle2,
  Filter,
  Users,
  Briefcase,
  Star,
} from "lucide-react";
import { Link } from "wouter";

const PROGRAM_TYPES = [
  "All", "certification", "apprenticeship", "online-certification",
  "residential", "community", "career-services", "vocational",
  "associate-degree",
];

const TYPE_LABELS: Record<string, string> = {
  "All": "All Programs",
  "certification": "Certification",
  "apprenticeship": "Apprenticeship",
  "online-certification": "Online Certification",
  "residential": "Residential",
  "community": "Community",
  "career-services": "Career Services",
  "vocational": "Vocational",
  "associate-degree": "Associate Degree",
};

export default function WorkforceTrainingPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [barrierOnly, setBarrierOnly] = useState(false);
  const [justiceOnly, setJusticeOnly] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);

  const { data: programs, isLoading: loadingPrograms } = useQuery<TrainingProgram[]>({
    queryKey: ["/api/workforce/training-programs"],
  });

  const { data: enrollments, isLoading: loadingEnrollments } = useQuery<TrainingEnrollment[]>({
    queryKey: ["/api/workforce/enrollments"],
  });

  const enrollMutation = useMutation({
    mutationFn: async (data: { userName: string; programId: string; status?: string }) => {
      const res = await apiRequest("POST", "/api/workforce/enrollments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce/enrollments"] });
      toast({ title: "Enrolled!", description: "You've been enrolled in this training program." });
      setSelectedProgram(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateEnrollmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { status?: string; attendanceRate?: number; credentialsEarned?: string[]; actualCompletion?: string; notes?: string } }) => {
      const res = await apiRequest("PATCH", `/api/workforce/enrollments/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce/enrollments"] });
      toast({ title: "Updated", description: "Enrollment status updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filtered = (programs || []).filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "All" && p.programType !== typeFilter) return false;
    if (barrierOnly && !p.barrierFriendly) return false;
    if (justiceOnly && !p.justiceInvolvedFriendly) return false;
    return true;
  });

  const enrolledProgramIds = new Set((enrollments || []).map((e) => e.programId));

  if (loadingPrograms) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto" data-testid="section-workforce-training">
      <PageHeader
        title="Training Programs & Credentials"
        description="Browse training programs, track enrollments, and earn industry-recognized credentials"
        icon={<GraduationCap className="h-7 w-7" />}
      />

      {(enrollments || []).length > 0 && (
        <Card className="p-5 mb-6 border-blue-200 dark:border-blue-800/50" data-testid="card-my-enrollments">
          <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> My Enrollments
          </h2>
          <div className="space-y-3">
            {(enrollments || []).map((enrollment) => {
              const program = (programs || []).find((p) => p.id === enrollment.programId);
              const completionRate = enrollment.attendanceRate || 0;
              return (
                <Card key={enrollment.id} className="p-4" data-testid={`card-enrollment-${enrollment.id}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{program?.name || "Training Program"}</p>
                      <p className="text-xs text-muted-foreground">{program?.provider || ""}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="secondary" className={enrollment.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : enrollment.status === "enrolled" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"}>
                          {enrollment.status}
                        </Badge>
                        {enrollment.credentialsEarned?.length > 0 && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                            <Award className="h-3 w-3 mr-1" /> {enrollment.credentialsEarned.length} credential(s)
                          </Badge>
                        )}
                      </div>
                      {enrollment.status === "enrolled" && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Attendance</span>
                            <span>{completionRate}%</span>
                          </div>
                          <Progress value={completionRate} className="h-1.5" />
                        </div>
                      )}
                    </div>
                    {enrollment.status === "enrolled" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateEnrollmentMutation.mutate({ id: enrollment.id, data: { status: "completed", actualCompletion: new Date().toISOString(), attendanceRate: 100 } })}
                        data-testid={`button-complete-enrollment-${enrollment.id}`}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Complete
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search training programs..."
            className="pl-9"
            data-testid="input-search-programs"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {PROGRAM_TYPES.slice(0, 5).map(type => (
            <Badge
              key={type}
              variant={typeFilter === type ? "default" : "outline"}
              className={`cursor-pointer ${typeFilter === type ? "bg-blue-600 text-white" : ""}`}
              onClick={() => setTypeFilter(type)}
              data-testid={`filter-type-${type}`}
            >
              {TYPE_LABELS[type] || type}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Badge
          variant={barrierOnly ? "default" : "outline"}
          className={`cursor-pointer ${barrierOnly ? "bg-amber-600 text-white" : ""}`}
          onClick={() => setBarrierOnly(!barrierOnly)}
          data-testid="filter-barrier-friendly"
        >
          <Shield className="h-3 w-3 mr-1" /> Barrier-Friendly
        </Badge>
        <Badge
          variant={justiceOnly ? "default" : "outline"}
          className={`cursor-pointer ${justiceOnly ? "bg-emerald-600 text-white" : ""}`}
          onClick={() => setJusticeOnly(!justiceOnly)}
          data-testid="filter-justice-friendly"
        >
          <Users className="h-3 w-3 mr-1" /> Justice-Involved Friendly
        </Badge>
        <span className="text-sm text-muted-foreground" data-testid="text-program-count">
          {filtered.length} program{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="section-program-grid">
        {filtered.map((program) => (
          <Card
            key={program.id}
            className="p-5 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedProgram(program)}
            data-testid={`card-program-${program.id}`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-sm" data-testid={`text-program-name-${program.id}`}>{program.name}</h3>
              {enrolledProgramIds.has(program.id) && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 shrink-0">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Enrolled
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{program.description}</p>
            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{program.provider}</span>
              {program.durationWeeks && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{program.durationWeeks} weeks</span>}
              {program.cost && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{program.cost}</span>}
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="text-xs">{TYPE_LABELS[program.programType] || program.programType}</Badge>
              {program.barrierFriendly && <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"><Shield className="h-3 w-3 mr-1" />Barrier-Friendly</Badge>}
              {program.justiceInvolvedFriendly && <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Justice-Friendly</Badge>}
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && !loadingPrograms && (
        <Card className="p-8 text-center" data-testid="card-no-programs">
          <GraduationCap className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No training programs found. Try adjusting your filters.</p>
        </Card>
      )}

      <Dialog open={!!selectedProgram} onOpenChange={() => setSelectedProgram(null)}>
        <DialogContent className="max-w-lg" data-testid="dialog-program-detail">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-program-name">{selectedProgram?.name}</DialogTitle>
          </DialogHeader>
          {selectedProgram && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{selectedProgram.description}</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Provider</p>
                  <p className="text-sm font-medium">{selectedProgram.provider}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm font-medium">{TYPE_LABELS[selectedProgram.programType] || selectedProgram.programType}</p>
                </div>
                {selectedProgram.durationWeeks && (
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm font-medium">{selectedProgram.durationWeeks} weeks</p>
                  </div>
                )}
                {selectedProgram.cost && (
                  <div>
                    <p className="text-xs text-muted-foreground">Cost</p>
                    <p className="text-sm font-medium">{selectedProgram.cost}</p>
                  </div>
                )}
                {selectedProgram.location && (
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-medium">{selectedProgram.location}</p>
                  </div>
                )}
                {selectedProgram.eligibility && (
                  <div>
                    <p className="text-xs text-muted-foreground">Eligibility</p>
                    <p className="text-sm font-medium">{selectedProgram.eligibility}</p>
                  </div>
                )}
              </div>

              {selectedProgram.credentials?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Credentials Offered</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedProgram.credentials.map((cred: string, i: number) => (
                      <Badge key={i} variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs">
                        <Award className="h-3 w-3 mr-1" />{cred}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                {selectedProgram.barrierFriendly && <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"><Shield className="h-3 w-3 mr-1" />Barrier-Friendly</Badge>}
                {selectedProgram.justiceInvolvedFriendly && <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Justice-Involved Friendly</Badge>}
              </div>

              <div className="flex items-center gap-3 pt-2 flex-wrap">
                {!enrolledProgramIds.has(selectedProgram.id) ? (
                  <Button
                    onClick={() => enrollMutation.mutate({
                      userName: "Participant",
                      programId: selectedProgram.id,
                      status: "enrolled",
                    })}
                    disabled={enrollMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-none"
                    data-testid="button-enroll-program"
                  >
                    {enrollMutation.isPending ? "Enrolling..." : "Enroll in Program"}
                  </Button>
                ) : (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Already Enrolled
                  </Badge>
                )}
                {selectedProgram.url && (
                  <a href={selectedProgram.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" data-testid="button-visit-program-website">
                      <ExternalLink className="h-3 w-3 mr-1" /> Visit Website
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
