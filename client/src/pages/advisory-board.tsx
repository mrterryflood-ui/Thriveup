import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Plus, UserPlus, Calendar, Trash2, Mail, Phone, Building2
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

export default function AdvisoryBoardPage() {
  const { toast } = useToast();
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [tab, setTab] = useState<"members" | "meetings">("members");

  const [memberForm, setMemberForm] = useState({
    name: "", role: "Community Member", organization: "", email: "", phone: "", livedExperience: "", bio: "", startDate: "",
  });
  const [meetingForm, setMeetingForm] = useState({
    title: "", meetingDate: "", location: "", agenda: "", decisions: "", actionItems: "",
  });

  const { data: rawMembers } = useQuery<BoardMember[]>({ queryKey: ["/api/advisory-board/members"] });
  const members = rawMembers ?? [];
  const { data: rawMeetings } = useQuery<BoardMeeting[]>({ queryKey: ["/api/advisory-board/meetings"] });
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

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-advisory-board-title">Community Advisory Board</h1>
          <p className="text-muted-foreground mt-1">Track board members, meetings, and lived experience credentials for grant scoring</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center" data-testid="stat-total-members">
          <p className="text-2xl font-bold text-primary">{activeMembers.length}</p>
          <p className="text-sm text-muted-foreground">Active Members</p>
        </Card>
        <Card className="p-4 text-center" data-testid="stat-lived-experience">
          <p className="text-2xl font-bold text-emerald-600">{livedExperienceCount}</p>
          <p className="text-sm text-muted-foreground">Lived Experience</p>
        </Card>
        <Card className="p-4 text-center" data-testid="stat-total-meetings">
          <p className="text-2xl font-bold text-blue-600">{meetings.length}</p>
          <p className="text-sm text-muted-foreground">Meetings Held</p>
        </Card>
        <Card className="p-4 text-center" data-testid="stat-roles-filled">
          <p className="text-2xl font-bold text-violet-600">{new Set(activeMembers.map((m) => m.role)).size}</p>
          <p className="text-sm text-muted-foreground">Unique Roles</p>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === "members" ? "default" : "outline"} onClick={() => setTab("members")} data-testid="button-tab-members">
          <Users className="mr-2 h-4 w-4" /> Members
        </Button>
        <Button variant={tab === "meetings" ? "default" : "outline"} onClick={() => setTab("meetings")} data-testid="button-tab-meetings">
          <Calendar className="mr-2 h-4 w-4" /> Meetings
        </Button>
      </div>

      {tab === "members" && (
        <>
          <div className="flex justify-end">
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
                  placeholder="Describe relevant lived experience (e.g., justice involvement, youth development participation, community leadership)"
                  data-testid="input-member-lived-experience"
                />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((member) => (
              <Card key={member.id} className="p-4" data-testid={`card-member-${member.id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-full p-2.5">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{member.name}</h3>
                      <Badge variant="outline" className="text-xs">{member.role}</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteMemberMutation.mutate(member.id)} data-testid={`button-delete-member-${member.id}`}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="mt-3 space-y-1.5 text-sm">
                  {member.organization && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" /> {member.organization}
                    </div>
                  )}
                  {member.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" /> {member.email}
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" /> {member.phone}
                    </div>
                  )}
                  {member.livedExperience && (
                    <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded border border-emerald-200 dark:border-emerald-800">
                      <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-0.5">Lived Experience</p>
                      <p className="text-xs text-muted-foreground">{member.livedExperience}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
          {members.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground" data-testid="empty-members">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No board members yet. Add your first community advisory board member.</p>
            </Card>
          )}
        </>
      )}

      {tab === "meetings" && (
        <>
          <div className="flex justify-end">
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
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {meeting.meetingDate}</span>
                      {meeting.location && <span>{meeting.location}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteMeetingMutation.mutate(meeting.id)} data-testid={`button-delete-meeting-${meeting.id}`}>
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
          {meetings.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground" data-testid="empty-meetings">
              <Calendar className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No meetings logged yet. Record your first advisory board meeting.</p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
