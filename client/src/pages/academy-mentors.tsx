import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";
import { ErrorRetry } from "@/components/error-retry";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  User,
  Briefcase,
  Star,
  Clock,
  ChevronRight,
  Send,
  CheckCircle2,
  Circle,
  XCircle,
  Info,
} from "lucide-react";

interface MentorProfile {
  id: string;
  name: string;
  title: string;
  organization: string | null;
  careerField: string;
  bio: string | null;
  expertise: string[] | null;
  availability: string | null;
  contactEmail: string | null;
  yearsExperience: number | null;
  isActive: boolean;
  isExample: boolean;
  createdAt: string;
}

interface MentorRequest {
  id: string;
  studentId: string;
  studentName: string;
  mentorId: string;
  mentorName: string;
  careerField: string;
  message: string | null;
  status: string;
  approvedBy: string | null;
  approvedByName: string | null;
  createdAt: string;
}

function getAvailabilityBadge(availability: string | null) {
  switch (availability?.toLowerCase()) {
    case "available":
      return { className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", label: "Available" };
    case "limited":
      return { className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", label: "Limited" };
    case "unavailable":
      return { className: "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400", label: "Unavailable" };
    default:
      return { className: "", label: availability || "Unknown" };
  }
}

function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "pending":
      return { className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", icon: Clock };
    case "approved":
      return { className: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300", icon: CheckCircle2 };
    case "active":
      return { className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: CheckCircle2 };
    case "completed":
      return { className: "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400", icon: Circle };
    case "declined":
      return { className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300", icon: XCircle };
    default:
      return { className: "", icon: Circle };
  }
}

const AVATAR_COLORS = [
  "bg-sky-200 dark:bg-sky-800",
  "bg-emerald-200 dark:bg-emerald-800",
  "bg-amber-200 dark:bg-amber-800",
  "bg-violet-200 dark:bg-violet-800",
  "bg-rose-200 dark:bg-rose-800",
  "bg-teal-200 dark:bg-teal-800",
];

function LoadingSkeleton() {

  useEffect(() => { document.title = "Mentor Network | ThriveUp Academy"; }, []);
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Skeleton className="h-36 w-full rounded-md" />
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56" />
        ))}
      </div>
    </div>
  );
}

export default function AcademyMentorsPage() {
  const { toast } = useToast();
  const [fieldFilter, setFieldFilter] = useState("all");
  const [requestMentor, setRequestMentor] = useState<MentorProfile | null>(null);
  const [requestMessage, setRequestMessage] = useState("");

  const { data: mentors, isLoading: mentorsLoading, isError: mentorsError, error: mentorsErrorObj, refetch } = useQuery<MentorProfile[]>({
    queryKey: ["/api/mentors"],
  });

  const { data: myRequests, isLoading: requestsLoading } = useQuery<MentorRequest[]>({
    queryKey: ["/api/mentors/my-requests"],
  });

  const requestMutation = useMutation({
    mutationFn: async ({ mentorId, message }: { mentorId: string; message: string }) => {
      const res = await apiRequest("POST", "/api/mentors/request", { mentorId, message });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentors/my-requests"] });
      setRequestMentor(null);
      setRequestMessage("");
      toast({ title: "Request Sent!", description: "Your mentor pairing request has been submitted." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (mentorsLoading) {
    return <LoadingSkeleton />;
  }

  if (mentorsError) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <ErrorRetry message={mentorsErrorObj instanceof Error ? mentorsErrorObj.message : "Failed to load mentor data. Please try again."} onRetry={refetch} />
      </div>
    );
  }

  const allMentors = (mentors ?? []).filter((m) => m.isActive);
  const careerFields = Array.from(new Set(allMentors.map((m) => m.careerField))).sort();
  const filteredMentors =
    fieldFilter === "all"
      ? allMentors
      : allMentors.filter((m) => m.careerField === fieldFilter);

  return (
    <div className="p-6 max-w-6xl mx-auto" data-testid="academy-mentors-page">
      <PageHeader
        title="Mentor Network"
        description="Connect with professionals who care about your future."
        breadcrumbs={[{label:"Academy",href:"/academy"},{label:"Mentor Network"}]}
      />
      <div
        className="rounded-md bg-gradient-to-r from-rose-900 to-red-700 p-8 mb-8"
        data-testid="section-hero"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-md p-2.5 bg-white/10">
            <Users className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white" data-testid="text-mentors-title">
            Mentor Network
          </h1>
        </div>
        <p className="text-rose-100 text-lg" data-testid="text-mentors-subtitle">
          Connect with Professionals Who Care About Your Future
        </p>
      </div>

      <Tabs defaultValue="browse" data-testid="tabs-mentors">
        <TabsList className="mb-6" data-testid="tabs-list">
          <TabsTrigger value="browse" data-testid="tab-browse">
            <Users className="h-4 w-4 mr-1.5" />
            Browse Mentors
          </TabsTrigger>
          <TabsTrigger value="my-requests" data-testid="tab-my-requests">
            <Send className="h-4 w-4 mr-1.5" />
            My Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <div
            className="rounded-md bg-rose-900/10 dark:bg-rose-900/20 border border-rose-900/20 dark:border-rose-800/30 p-4 mb-6 flex items-start gap-3"
            data-testid="banner-example-info"
          >
            <Info className="h-5 w-5 text-rose-800 dark:text-rose-300 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-900 dark:text-rose-200">
              The profiles below marked as &lsquo;Example&rsquo; are sample mentors showing the types of professionals in your community. Your school will add real Austin-based mentors for you to connect with.
            </p>
          </div>

          <div className="mb-6 max-w-xs" data-testid="section-field-filter">
            <Select value={fieldFilter} onValueChange={setFieldFilter}>
              <SelectTrigger data-testid="select-career-field-filter">
                <SelectValue placeholder="Filter by career field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="option-field-all">All Fields</SelectItem>
                {careerFields.map((field) => (
                  <SelectItem key={field} value={field} data-testid={`option-field-${field}`}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(() => {
            const realMentors = filteredMentors.filter((m) => !m.isExample);
            const exampleMentors = filteredMentors.filter((m) => m.isExample);

            const renderMentorCard = (mentor: MentorProfile, idx: number) => {
              const availBadge = getAvailabilityBadge(mentor.availability);
              const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              return (
                <Card
                  key={mentor.id}
                  className="p-4"
                  data-testid={`card-mentor-${mentor.id}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${avatarColor}`}>
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm truncate" data-testid={`text-mentor-name-${mentor.id}`}>
                        {mentor.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate" data-testid={`text-mentor-title-${mentor.id}`}>
                        {mentor.title}
                      </p>
                    </div>
                  </div>

                  {mentor.isExample && (
                    <Badge
                      variant="outline"
                      className="mb-2 text-rose-700 border-rose-300 dark:text-rose-300 dark:border-rose-700"
                      data-testid={`badge-example-${mentor.id}`}
                    >
                      Example Profile
                    </Badge>
                  )}

                  {mentor.organization && (
                    <p className="text-xs text-muted-foreground mb-2" data-testid={`text-mentor-org-${mentor.id}`}>
                      {mentor.organization}
                    </p>
                  )}

                  <Badge
                    variant="secondary"
                    className="mb-2"
                    data-testid={`badge-mentor-field-${mentor.id}`}
                  >
                    <Briefcase className="h-3 w-3 mr-1" />
                    {mentor.careerField}
                  </Badge>

                  {mentor.bio && (
                    <p
                      className="text-xs text-muted-foreground line-clamp-2 mb-3"
                      data-testid={`text-mentor-bio-${mentor.id}`}
                    >
                      {mentor.bio}
                    </p>
                  )}

                  {mentor.expertise && mentor.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3" data-testid={`section-expertise-${mentor.id}`}>
                      {mentor.expertise.slice(0, 3).map((exp) => (
                        <Badge
                          key={exp}
                          variant="outline"
                          className="text-[10px] px-1.5"
                          data-testid={`badge-expertise-${mentor.id}-${exp}`}
                        >
                          {exp}
                        </Badge>
                      ))}
                      {mentor.expertise.length > 3 && (
                        <Badge variant="outline" className="text-[10px] px-1.5">
                          +{mentor.expertise.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                    {mentor.yearsExperience != null && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1" data-testid={`text-experience-${mentor.id}`}>
                        <Star className="h-3 w-3" />
                        {mentor.yearsExperience} yrs
                      </span>
                    )}
                    <Badge
                      variant="secondary"
                      className={availBadge.className}
                      data-testid={`badge-availability-${mentor.id}`}
                    >
                      {availBadge.label}
                    </Badge>
                  </div>

                  {mentor.availability?.toLowerCase() !== "unavailable" && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setRequestMentor(mentor);
                        setRequestMessage("");
                      }}
                      data-testid={`button-request-${mentor.id}`}
                    >
                      <Send className="h-3.5 w-3.5 mr-1" />
                      Request Pairing
                    </Button>
                  )}
                </Card>
              );
            };

            if (filteredMentors.length === 0) {
              return (
                <Card className="p-8 text-center" data-testid="card-no-mentors">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No mentors found matching your criteria.</p>
                </Card>
              );
            }

            return (
              <div className="space-y-8">
                {realMentors.length > 0 && (
                  <div data-testid="section-real-mentors">
                    <h2 className="text-lg font-semibold mb-4">Mentors</h2>
                    <div
                      className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                      data-testid="section-mentor-grid"
                    >
                      {realMentors.map((mentor, idx) => renderMentorCard(mentor, idx))}
                    </div>
                  </div>
                )}

                {exampleMentors.length > 0 && (
                  <div data-testid="section-example-mentors">
                    <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Example Profiles</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {exampleMentors.map((mentor, idx) => renderMentorCard(mentor, idx))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </TabsContent>

        <TabsContent value="my-requests">
          {requestsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : (myRequests ?? []).length > 0 ? (
            <div className="space-y-3" data-testid="section-my-requests">
              {(myRequests ?? []).map((req) => {
                const statusInfo = getStatusBadge(req.status);
                const StatusIcon = statusInfo.icon;
                return (
                  <Card key={req.id} className="p-4" data-testid={`card-request-${req.id}`}>
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm" data-testid={`text-request-mentor-${req.id}`}>
                          {req.mentorName}
                        </h3>
                        <p className="text-xs text-muted-foreground" data-testid={`text-request-field-${req.id}`}>
                          {req.careerField}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={statusInfo.className}
                        data-testid={`badge-request-status-${req.id}`}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {req.status}
                      </Badge>
                    </div>
                    {req.message && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2" data-testid={`text-request-message-${req.id}`}>
                        {req.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1" data-testid={`text-request-date-${req.id}`}>
                      <Clock className="h-3 w-3" />
                      {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center" data-testid="card-no-requests">
              <Send className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No pairing requests yet. Browse mentors to get started!</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!requestMentor} onOpenChange={() => setRequestMentor(null)}>
        <DialogContent data-testid="dialog-request-pairing">
          {requestMentor && (
            <>
              <DialogHeader>
                <DialogTitle data-testid="text-dialog-mentor-name">
                  Request Pairing with {requestMentor.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {requestMentor.title}
                  {requestMentor.organization ? ` at ${requestMentor.organization}` : ""}
                </p>
                <div>
                  <label className="text-sm font-medium mb-1 block">Message</label>
                  <Textarea
                    placeholder="Tell this mentor why you'd like to connect..."
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    className="resize-none"
                    data-testid="input-request-message"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => setRequestMentor(null)}
                    data-testid="button-cancel-request"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() =>
                      requestMutation.mutate({
                        mentorId: requestMentor.id,
                        message: requestMessage,
                      })
                    }
                    disabled={!requestMessage.trim() || requestMutation.isPending}
                    data-testid="button-submit-request"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    {requestMutation.isPending ? "Sending..." : "Send Request"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
