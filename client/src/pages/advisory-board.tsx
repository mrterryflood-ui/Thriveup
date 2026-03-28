import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Plus, UserPlus, Calendar, Trash2, Mail, Phone, Building2,
  Shield, Award, BookOpen, Heart
} from "lucide-react";

interface BoardMember {
  id: string;
  name: string;
  role: string;
  organization: string | null;
  email: string | null;
  phone: string | null;
  livedExperience: string | null;
  bio: string | null;
  startDate: string | null;
  status: string;
  createdAt: string;
}

interface BoardMeeting {
  id: string;
  title: string;
  meetingDate: string;
  location: string | null;
  agenda: string | null;
  minutes: string | null;
  attendeeIds: string[];
  decisions: string | null;
  actionItems: string | null;
  createdAt: string;
}

const ROLE_OPTIONS = [
  "Chairperson",
  "Vice Chair",
  "Secretary",
  "Community Member",
  "Youth Representative",
  "Parent/Family Representative",
  "Lived Experience Advocate",
  "Partner Agency Representative",
  "Faith Leader",
  "Business/Employer Representative",
  "Education Representative",
  "Government Representative",
];

const ROLE_DESCRIPTIONS: Record<string, { description: string; icon: typeof Users; color: string }> = {
  "Chairperson": { description: "Presides over board meetings, sets agenda priorities, serves as primary liaison between the advisory board and program leadership.", icon: Award, color: "text-amber-600" },
  "Vice Chair": { description: "Supports the Chairperson, assumes leadership in their absence, coordinates committee activities and special initiatives.", icon: Shield, color: "text-blue-600" },
  "Secretary": { description: "Records meeting minutes, maintains board documentation, manages communication and scheduling for board activities.", icon: BookOpen, color: "text-indigo-600" },
  "Community Member": { description: "Represents the broader community perspective, ensures program responsiveness to neighborhood-level needs and concerns.", icon: Users, color: "text-emerald-600" },
  "Youth Representative": { description: "Provides authentic youth voice, shares peer perspectives, advises on youth engagement strategies and program relevance.", icon: Heart, color: "text-rose-600" },
  "Parent/Family Representative": { description: "Advocates for family needs, provides parent perspective on services, supports family engagement strategies.", icon: Users, color: "text-violet-600" },
  "Lived Experience Advocate": { description: "Brings direct experience with justice involvement or system navigation, ensures program design is informed by authentic participant voice.", icon: Heart, color: "text-amber-600" },
  "Partner Agency Representative": { description: "Represents a partnering organization, facilitates inter-agency coordination, and helps align services across providers.", icon: Building2, color: "text-blue-600" },
  "Faith Leader": { description: "Provides spiritual and community support perspective, connects program to faith-based networks and resources.", icon: Heart, color: "text-emerald-600" },
  "Business/Employer Representative": { description: "Represents employer perspectives, advises on workforce needs, facilitates job placement and career pathway connections.", icon: Building2, color: "text-indigo-600" },
  "Education Representative": { description: "Provides education system perspective, advises on academic pathways, connects program to school and college resources.", icon: BookOpen, color: "text-violet-600" },
  "Government Representative": { description: "Represents government agency perspective, advises on policy alignment, facilitates government partnership opportunities.", icon: Shield, color: "text-rose-600" },
};

const GRANT_SCORING_CRITERIA = [
  { criterion: "Board Size", target: "8-15 members", description: "Optimal size for meaningful governance while maintaining diverse representation" },
  { criterion: "Lived Experience", target: "30%+ members", description: "Federal grants prioritize boards with authentic voice from people impacted by programs" },
  { criterion: "Youth Voice", target: "2+ representatives", description: "WIOA and OJJDP require youth participation in program governance and design" },
  { criterion: "Meeting Frequency", target: "Quarterly minimum", description: "Regular meetings demonstrate active governance and continuous program input" },
  { criterion: "Role Diversity", target: "6+ unique roles", description: "Multi-sector representation strengthens grant applications and program design" },
  { criterion: "Documentation", target: "Minutes for all meetings", description: "Meeting records demonstrate active community engagement and informed decision-making" },
];

export default function AdvisoryBoardPage() {
  const { toast } = useToast();
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [tab, setTab] = useState<"members" | "meetings" | "scoring">("members");

  const [memberForm, setMemberForm] = useState({
    name: "", role: "Community Member", organization: "", email: "", phone: "", livedExperience: "", bio: "", startDate: "",
  });
  const [meetingForm, setMeetingForm] = useState({
    title: "", meetingDate: "", location: "", agenda: "", decisions: "", actionItems: "",
  });

  const { data: rawMembers, isLoading: membersLoading } = useQuery<BoardMember[]>({ queryKey: ["/api/advisory-board/members"] });
  const members = rawMembers ?? [];
  const { data: rawMeetings, isLoading: meetingsLoading } = useQuery<BoardMeeting[]>({ queryKey: ["/api/advisory-board/meetings"] });
  const meetings = rawMeetings ?? [];

  const createMemberMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/advisory-board/members", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisory-board/members"] });
      setShowMemberForm(false);
      setMemberForm({ name: "", role: "Community Member", organization: "", email: "", phone: "", livedExperience: "", bio: "", startDate: "" });
      toast({ title: "Board member added" });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/advisory-board/members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisory-board/members"] });
      toast({ title: "Board member removed" });
    },
  });

  const createMeetingMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/advisory-board/meetings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisory-board/meetings"] });
      setShowMeetingForm(false);
      setMeetingForm({ title: "", meetingDate: "", location: "", agenda: "", decisions: "", actionItems: "" });
      toast({ title: "Meeting logged" });
    },
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/advisory-board/meetings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advisory-board/meetings"] });
      toast({ title: "Meeting removed" });
    },
  });

  const activeMembers = members.filter((m) => m.status === "active");
  const livedExperienceCount = activeMembers.filter((m) => m.livedExperience && m.livedExperience.trim().length > 0).length;
  const uniqueRoles = new Set(activeMembers.map((m) => m.role)).size;
  const livedExperiencePct = activeMembers.length > 0 ? Math.round((livedExperienceCount / activeMembers.length) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-advisory-board-title">Community Advisory Board</h1>
          <p className="text-muted-foreground mt-1">Track board composition, meetings, and lived experience representation for grant compliance</p>
        </div>
      </div>

      {membersLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 text-center">
              <Skeleton className="h-8 w-12 mx-auto mb-1" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center" data-testid="stat-total-members">
            <p className="text-2xl font-bold text-primary">{activeMembers.length}</p>
            <p className="text-sm text-muted-foreground">Active Members</p>
          </Card>
          <Card className="p-4 text-center" data-testid="stat-lived-experience">
            <p className="text-2xl font-bold text-emerald-600">{livedExperienceCount}</p>
            <p className="text-sm text-muted-foreground">Lived Experience ({livedExperiencePct}%)</p>
          </Card>
          <Card className="p-4 text-center" data-testid="stat-total-meetings">
            <p className="text-2xl font-bold text-blue-600">{meetings.length}</p>
            <p className="text-sm text-muted-foreground">Meetings Held</p>
          </Card>
          <Card className="p-4 text-center" data-testid="stat-roles-filled">
            <p className="text-2xl font-bold text-violet-600">{uniqueRoles}</p>
            <p className="text-sm text-muted-foreground">Unique Roles</p>
          </Card>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button variant={tab === "members" ? "default" : "outline"} onClick={() => setTab("members")} data-testid="button-tab-members">
          <Users className="mr-2 h-4 w-4" /> Members
        </Button>
        <Button variant={tab === "meetings" ? "default" : "outline"} onClick={() => setTab("meetings")} data-testid="button-tab-meetings">
          <Calendar className="mr-2 h-4 w-4" /> Meetings
        </Button>
        <Button variant={tab === "scoring" ? "default" : "outline"} onClick={() => setTab("scoring")} data-testid="button-tab-scoring">
          <Award className="mr-2 h-4 w-4" /> Grant Scoring
        </Button>
      </div>

      {tab === "members" && (
        <>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="font-semibold">Board Members</h2>
              <p className="text-sm text-muted-foreground">Federal grants require diverse community representation with authentic lived experience voice</p>
            </div>
            <Button onClick={() => setShowMemberForm(!showMemberForm)} data-testid="button-add-member">
              <UserPlus className="mr-2 h-4 w-4" /> Add Member
            </Button>
          </div>

          {showMemberForm && (
            <Card className="p-5 space-y-4" data-testid="card-member-form">
              <h2 className="font-semibold">Add Board Member</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Name *</label>
                  <Input value={memberForm.name} onChange={(e) => setMemberForm((p) => ({ ...p, name: e.target.value }))} data-testid="input-member-name" />
                </div>
                <div>
                  <label className="text-sm font-medium">Role *</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={memberForm.role}
                    onChange={(e) => setMemberForm((p) => ({ ...p, role: e.target.value }))}
                    data-testid="select-member-role"
                  >
                    {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {ROLE_DESCRIPTIONS[memberForm.role] && (
                    <p className="text-xs text-muted-foreground mt-1">{ROLE_DESCRIPTIONS[memberForm.role].description}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Organization</label>
                  <Input value={memberForm.organization} onChange={(e) => setMemberForm((p) => ({ ...p, organization: e.target.value }))} data-testid="input-member-org" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" value={memberForm.email} onChange={(e) => setMemberForm((p) => ({ ...p, email: e.target.value }))} data-testid="input-member-email" />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input value={memberForm.phone} onChange={(e) => setMemberForm((p) => ({ ...p, phone: e.target.value }))} data-testid="input-member-phone" />
                </div>
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input type="date" value={memberForm.startDate} onChange={(e) => setMemberForm((p) => ({ ...p, startDate: e.target.value }))} data-testid="input-member-start" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Lived Experience Credentials</label>
                <textarea
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]"
                  value={memberForm.livedExperience}
                  onChange={(e) => setMemberForm((p) => ({ ...p, livedExperience: e.target.value }))}
                  data-testid="input-member-lived-experience"
                />
                <p className="text-xs text-muted-foreground mt-1">Describe relevant lived experience such as justice involvement, youth development participation, community leadership, or personal recovery journey</p>
              </div>
              <div>
                <label className="text-sm font-medium">Bio</label>
                <textarea
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]"
                  value={memberForm.bio}
                  onChange={(e) => setMemberForm((p) => ({ ...p, bio: e.target.value }))}
                  data-testid="input-member-bio"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => createMemberMutation.mutate(memberForm)} disabled={!memberForm.name || createMemberMutation.isPending} data-testid="button-submit-member">
                  {createMemberMutation.isPending ? "Adding..." : "Add Member"}
                </Button>
                <Button variant="outline" onClick={() => setShowMemberForm(false)} data-testid="button-cancel-member">Cancel</Button>
              </div>
            </Card>
          )}

          <Card className="p-5" data-testid="card-role-guide">
            <h2 className="font-semibold text-lg mb-1">Board Role Guide</h2>
            <p className="text-sm text-muted-foreground mb-3">Recommended roles and their responsibilities for a comprehensive advisory board</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {ROLE_OPTIONS.map((role) => {
                const roleDesc = ROLE_DESCRIPTIONS[role];
                const Icon = roleDesc?.icon || Users;
                const color = roleDesc?.color || "text-primary";
                const hasRole = activeMembers.some((m) => m.role === role);
                return (
                  <div key={role} className={`p-2.5 rounded-lg border text-sm ${hasRole ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" : "bg-muted border-transparent"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-3.5 w-3.5 ${color} shrink-0`} />
                      <span className="font-medium">{role}</span>
                      {hasRole && <Badge variant="secondary" className="text-[10px] ml-auto">Filled</Badge>}
                    </div>
                    {roleDesc && <p className="text-xs text-muted-foreground">{roleDesc.description}</p>}
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((member) => {
              const roleDesc = ROLE_DESCRIPTIONS[member.role];
              const Icon = roleDesc?.icon || Users;
              const color = roleDesc?.color || "text-primary";
              return (
                <Card key={member.id} className="p-4" data-testid={`card-member-${member.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 rounded-full p-2.5">
                        <Icon className={`h-5 w-5 ${color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{member.name}</h3>
                        <Badge variant="outline" className="text-xs">{member.role}</Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteMemberMutation.mutate(member.id)} data-testid={`button-delete-member-${member.id}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="mt-3 space-y-1.5 text-sm">
                    {member.organization && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5 shrink-0" /> {member.organization}
                      </div>
                    )}
                    {member.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" /> {member.email}
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" /> {member.phone}
                      </div>
                    )}
                    {member.bio && (
                      <p className="text-xs text-muted-foreground mt-2">{member.bio}</p>
                    )}
                    {member.livedExperience && (
                      <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded border border-emerald-200 dark:border-emerald-800">
                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-0.5">Lived Experience Credentials</p>
                        <p className="text-xs text-muted-foreground">{member.livedExperience}</p>
                      </div>
                    )}
                    {member.startDate && (
                      <p className="text-xs text-muted-foreground mt-1">Board member since {member.startDate}</p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
          {members.length === 0 && !membersLoading && (
            <Card className="p-8 text-center text-muted-foreground" data-testid="empty-members">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="font-medium mb-1">No board members yet</p>
              <p className="text-sm">Add community advisory board members to strengthen grant applications and ensure authentic community voice in program design.</p>
            </Card>
          )}
        </>
      )}

      {tab === "meetings" && (
        <>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="font-semibold">Board Meetings</h2>
              <p className="text-sm text-muted-foreground">Document meetings, decisions, and action items for grant compliance evidence</p>
            </div>
            <Button onClick={() => setShowMeetingForm(!showMeetingForm)} data-testid="button-add-meeting">
              <Plus className="mr-2 h-4 w-4" /> Log Meeting
            </Button>
          </div>

          {showMeetingForm && (
            <Card className="p-5 space-y-4" data-testid="card-meeting-form">
              <h2 className="font-semibold">Log Board Meeting</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Title *</label>
                  <Input value={meetingForm.title} onChange={(e) => setMeetingForm((p) => ({ ...p, title: e.target.value }))} data-testid="input-meeting-title" />
                </div>
                <div>
                  <label className="text-sm font-medium">Date *</label>
                  <Input type="date" value={meetingForm.meetingDate} onChange={(e) => setMeetingForm((p) => ({ ...p, meetingDate: e.target.value }))} data-testid="input-meeting-date" />
                </div>
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Input value={meetingForm.location} onChange={(e) => setMeetingForm((p) => ({ ...p, location: e.target.value }))} data-testid="input-meeting-location" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Agenda</label>
                <textarea
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]"
                  value={meetingForm.agenda}
                  onChange={(e) => setMeetingForm((p) => ({ ...p, agenda: e.target.value }))}
                  data-testid="input-meeting-agenda"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Decisions Made</label>
                <textarea
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]"
                  value={meetingForm.decisions}
                  onChange={(e) => setMeetingForm((p) => ({ ...p, decisions: e.target.value }))}
                  data-testid="input-meeting-decisions"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Action Items</label>
                <textarea
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]"
                  value={meetingForm.actionItems}
                  onChange={(e) => setMeetingForm((p) => ({ ...p, actionItems: e.target.value }))}
                  data-testid="input-meeting-actions"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => createMeetingMutation.mutate(meetingForm)} disabled={!meetingForm.title || !meetingForm.meetingDate || createMeetingMutation.isPending} data-testid="button-submit-meeting">
                  {createMeetingMutation.isPending ? "Logging..." : "Log Meeting"}
                </Button>
                <Button variant="outline" onClick={() => setShowMeetingForm(false)} data-testid="button-cancel-meeting">Cancel</Button>
              </div>
            </Card>
          )}

          <div className="space-y-4">
            {meetings.map((meeting) => (
              <Card key={meeting.id} className="p-4" data-testid={`card-meeting-${meeting.id}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{meeting.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {meeting.meetingDate}</span>
                      {meeting.location && <span>{meeting.location}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteMeetingMutation.mutate(meeting.id)} data-testid={`button-delete-meeting-${meeting.id}`}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                {meeting.agenda && (
                  <div className="mt-3 p-2 bg-muted rounded">
                    <p className="text-xs font-medium mb-1">Agenda</p>
                    <p className="text-sm">{meeting.agenda}</p>
                  </div>
                )}
                {meeting.decisions && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Decisions</p>
                    <p className="text-sm">{meeting.decisions}</p>
                  </div>
                )}
                {meeting.actionItems && (
                  <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Action Items</p>
                    <p className="text-sm">{meeting.actionItems}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
          {meetings.length === 0 && !meetingsLoading && (
            <Card className="p-8 text-center text-muted-foreground" data-testid="empty-meetings">
              <Calendar className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="font-medium mb-1">No meetings logged yet</p>
              <p className="text-sm">Record advisory board meetings to document community engagement and meet grant compliance requirements.</p>
            </Card>
          )}
        </>
      )}

      {tab === "scoring" && (
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-lg">Grant Scoring Readiness</h2>
            <p className="text-sm text-muted-foreground">How your advisory board composition maps to federal grant scoring criteria</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {GRANT_SCORING_CRITERIA.map((item) => {
              let status = "needs-attention";
              if (item.criterion === "Board Size" && activeMembers.length >= 8) status = "met";
              else if (item.criterion === "Lived Experience" && livedExperiencePct >= 30) status = "met";
              else if (item.criterion === "Youth Voice" && activeMembers.filter((m) => m.role === "Youth Representative").length >= 2) status = "met";
              else if (item.criterion === "Meeting Frequency" && meetings.length >= 4) status = "met";
              else if (item.criterion === "Role Diversity" && uniqueRoles >= 6) status = "met";
              else if (item.criterion === "Documentation" && meetings.length > 0) status = "in-progress";

              return (
                <Card key={item.criterion} className="p-4" data-testid={`card-scoring-${item.criterion.toLowerCase().replace(/\s+/g, "-")}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{item.criterion}</h3>
                        <Badge variant={status === "met" ? "default" : "secondary"} className={status === "met" ? "bg-emerald-600" : ""}>
                          {status === "met" ? "Met" : status === "in-progress" ? "In Progress" : "Needs Attention"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">Target: {item.target}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="p-5" data-testid="card-compliance-summary">
            <h2 className="font-semibold text-lg mb-3">Federal Compliance Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-sm text-blue-700 dark:text-blue-400 mb-1">WIOA Requirements</h3>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>Youth participation in governance</li>
                  <li>Community stakeholder representation</li>
                  <li>Local Workforce Board coordination</li>
                  <li>Regular community input sessions</li>
                </ul>
              </div>
              <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-lg border border-violet-200 dark:border-violet-800">
                <h3 className="font-semibold text-sm text-violet-700 dark:text-violet-400 mb-1">OJJDP Requirements</h3>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>Lived experience representation</li>
                  <li>Community voice in reentry design</li>
                  <li>Family engagement advocacy</li>
                  <li>Multi-agency partnership governance</li>
                </ul>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <h3 className="font-semibold text-sm text-emerald-700 dark:text-emerald-400 mb-1">SAMHSA Requirements</h3>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>Cultural competency representation</li>
                  <li>Recovery community voice</li>
                  <li>Health equity stakeholder input</li>
                  <li>Community capacity building</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
