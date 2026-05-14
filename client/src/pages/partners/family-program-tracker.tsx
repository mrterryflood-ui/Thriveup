import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Users, CalendarCheck, Heart, Upload, Download, FileSpreadsheet, AlertTriangle, Info, ShieldAlert, UtensilsCrossed, Bus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from "recharts";
import type {
  CommunityPartnerOrg, Household, HouseholdMember, CommunityProgram,
  ProgramEnrollment, ProgramAttendance, HouseholdServiceReceived,
} from "@shared/schema";

type HouseholdWithCounts = Household & { memberCount: number; activeEnrollmentCount: number };

type HouseholdDetail = {
  household: Household;
  members: HouseholdMember[];
  enrollments: ProgramEnrollment[];
  attendance: ProgramAttendance[];
  services: HouseholdServiceReceived[];
};

type OrgStats = {
  orgId: string;
  households: number;
  members: number;
  activePrograms: number;
  totalAttendanceEvents: number;
  presentEvents: number;
  attendanceRate: number | null;
  servicesRecorded: number;
  mealsServed: number;
  transportProvided: number;
  programs: Array<{ programId: string; programName: string; category: string; enrolled: number; present: number }>;
};

const CATEGORY_COLORS: Record<string, string> = {
  youth: "#6366f1",
  women_wellness: "#ec4899",
  family: "#0ea5e9",
  faith_formation: "#a855f7",
  health_screening: "#10b981",
  mentoring: "#f59e0b",
  adult_education: "#14b8a6",
};

const SAMPLE_CSV = `household_name,member_name,relationship,age,language,city,zip,contact_phone,contact_email,is_primary_contact
Example Family,A. Example,parent,38,en,Wichita,67214,316-555-0199,example@example.org,true
Example Family,Example child,child,12,en,Wichita,67214,,,
`;

export default function FamilyProgramTrackerPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [openHousehold, setOpenHousehold] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [csvText, setCsvText] = useState<string>("");
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [attProgramId, setAttProgramId] = useState<string>("");
  const [attDate, setAttDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [attMarks, setAttMarks] = useState<Record<string, "present" | "absent" | "late" | "excused">>({});
  const [attTransport, setAttTransport] = useState(false);

  const orgsQ = useQuery<{ orgs: CommunityPartnerOrg[] }>({ queryKey: ["/api/community/orgs"] });
  const orgs = orgsQ.data?.orgs || [];
  useEffect(() => {
    if (!selectedOrg && orgs.length) setSelectedOrg(orgs[0].id);
  }, [orgs, selectedOrg]);
  const currentOrg = orgs.find(o => o.id === selectedOrg);

  const statsQ = useQuery<OrgStats>({ queryKey: ["/api/community/orgs", selectedOrg, "stats"], enabled: !!selectedOrg });
  const programsQ = useQuery<{ programs: CommunityProgram[] }>({ queryKey: ["/api/community/orgs", selectedOrg, "programs"], enabled: !!selectedOrg });
  const householdsQ = useQuery<{ households: HouseholdWithCounts[] }>({ queryKey: ["/api/community/orgs", selectedOrg, "households"], enabled: !!selectedOrg });
  const detailQ = useQuery<HouseholdDetail>({
    queryKey: ["/api/community/households", openHousehold, selectedOrg],
    enabled: !!openHousehold && !!selectedOrg,
    queryFn: async () => {
      const r = await fetch(`/api/community/households/${openHousehold}?orgId=${encodeURIComponent(selectedOrg)}`, { credentials: "include" });
      if (!r.ok) throw new Error(`Failed to load household: ${r.status}`);
      return r.json();
    },
  });

  const programs = programsQ.data?.programs || [];
  const householdRows = householdsQ.data?.households || [];

  const uploadMut = useMutation({
    mutationFn: async (csv: string) =>
      apiRequest("POST", `/api/community/orgs/${selectedOrg}/households/bulk-csv`, { csv }).then(r => r.json()),
    onSuccess: (r: { householdsCreated?: number; membersCreated?: number; errors?: Array<{ row: number; reason: string }> }) => {
      toast({ title: "Upload complete", description: `${r.householdsCreated || 0} households · ${r.membersCreated || 0} members${(r.errors?.length || 0) ? ` · ${r.errors?.length} row error(s)` : ""}` });
      qc.invalidateQueries({ queryKey: ["/api/community/orgs", selectedOrg, "households"] });
      qc.invalidateQueries({ queryKey: ["/api/community/orgs", selectedOrg, "stats"] });
      setUploadOpen(false);
      setCsvText("");
    },
    onError: (e: Error) => toast({ title: "Upload failed", description: e.message, variant: "destructive" }),
  });

  const attendanceMut = useMutation({
    mutationFn: async () => {
      const items = Object.entries(attMarks).map(([memberId, status]) => {
        const enrolledMember = (detailMemberEnrollments[memberId] || []).find(e => e.programId === attProgramId);
        return enrolledMember ? {
          enrollmentId: enrolledMember.id,
          memberId,
          programId: attProgramId,
          orgId: selectedOrg,
          sessionDate: new Date(attDate).toISOString(),
          status,
          receivedMeal: status === "present" || status === "late",
          receivedTransport: attTransport && (status === "present" || status === "late"),
        } : null;
      }).filter(Boolean);
      return apiRequest("POST", "/api/community/attendance", { items }).then(r => r.json());
    },
    onSuccess: (r: { recorded?: number }) => {
      toast({ title: "Attendance recorded", description: `${r.recorded || 0} entries saved.` });
      qc.invalidateQueries({ queryKey: ["/api/community/orgs", selectedOrg, "stats"] });
      qc.invalidateQueries({ queryKey: ["/api/community/households", openHousehold, selectedOrg] });
      setAttendanceOpen(false);
      setAttMarks({});
    },
    onError: (e: Error) => toast({ title: "Could not record attendance", description: e.message, variant: "destructive" }),
  });

  // map from memberId -> enrollments (for the attendance dialog)
  const detail = detailQ.data;
  const detailMemberEnrollments = useMemo(() => {
    const m: Record<string, ProgramEnrollment[]> = {};
    for (const e of detail?.enrollments || []) {
      if (!m[e.memberId]) m[e.memberId] = [];
      m[e.memberId].push(e);
    }
    return m;
  }, [detail]);

  const programNameById = useMemo(() => Object.fromEntries(programs.map(p => [p.id, p.name])), [programs]);

  // attendance-trend by week (last 12 weeks)
  const attendanceTrend = useMemo(() => {
    const map = new Map<string, { week: string; present: number; absent: number; meal: number }>();
    for (const a of detail?.attendance || []) {
      const d = new Date(a.sessionDate);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      if (!map.has(key)) map.set(key, { week: key, present: 0, absent: 0, meal: 0 });
      const row = map.get(key)!;
      if (a.status === "present" || a.status === "late") row.present++;
      else row.absent++;
      if (a.receivedMeal) row.meal++;
    }
    return Array.from(map.values()).slice(0, 12).reverse();
  }, [detail]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" data-testid="page-family-program-tracker">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Family & Program Tracker</h1>
        </div>
        <p className="text-muted-foreground">
          Track attendance, family structure, and the services each family is engaged in — across community partner organizations.
          Households are the unit of work. Per-org isolation is enforced.
        </p>
      </div>

      {/* Org picker + quick actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>Community Partner</CardTitle>
              <CardDescription>Choose which partner organization's roster you're working with.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedOrg} onValueChange={(v) => { setSelectedOrg(v); setOpenHousehold(null); }}>
                <SelectTrigger className="w-[280px]" data-testid="select-org">
                  <SelectValue placeholder="Choose an organization" />
                </SelectTrigger>
                <SelectContent>
                  {orgs.map(o => (
                    <SelectItem key={o.id} value={o.id} data-testid={`option-org-${o.id}`}>
                      {o.name} <span className="ml-1 text-xs text-muted-foreground">({o.orgType})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)} data-testid="button-open-upload">
                <Upload className="h-4 w-4 mr-1" /> CSV Upload
              </Button>
              <Button variant="outline" size="sm" asChild data-testid="button-export-csv">
                <a href={`/api/community/orgs/${selectedOrg}/export.csv`}>
                  <Download className="h-4 w-4 mr-1" /> Export CSV
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {currentOrg && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" data-testid="badge-org-status">{currentOrg.status}</Badge>
                <Badge variant="outline">{currentOrg.city}, {currentOrg.stateCode}</Badge>
                {currentOrg.websiteUrl && (
                  <a href={currentOrg.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" data-testid="link-org-website">
                    {currentOrg.websiteUrl.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
              {currentOrg.missionSummary && (
                <p className="text-sm text-muted-foreground" data-testid="text-org-mission">{currentOrg.missionSummary}</p>
              )}
              {currentOrg.coiDisclosure && (
                <Alert variant="default" className="border-amber-500/40 bg-amber-500/5" data-testid="alert-coi">
                  <ShieldAlert className="h-4 w-4 text-amber-600" />
                  <AlertTitle>Conflict-of-interest disclosure</AlertTitle>
                  <AlertDescription className="text-sm">{currentOrg.coiDisclosure}</AlertDescription>
                </Alert>
              )}
              {currentOrg.notes && currentOrg.status === "demo" && (
                <Alert variant="default" className="border-blue-500/40 bg-blue-500/5" data-testid="alert-demo">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle>Demo data</AlertTitle>
                  <AlertDescription className="text-xs">{currentOrg.notes}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatTile label="Households" value={statsQ.data?.households} icon={Users} testId="stat-households" />
        <StatTile label="Individuals" value={statsQ.data?.members} icon={Users} testId="stat-members" />
        <StatTile label="Active Programs" value={statsQ.data?.activePrograms} icon={Building2} testId="stat-programs" />
        <StatTile label="Attendance Events" value={statsQ.data?.totalAttendanceEvents} icon={CalendarCheck} testId="stat-attendance" />
        <StatTile label="Meals Served" value={statsQ.data?.mealsServed} icon={UtensilsCrossed} testId="stat-meals" />
        <StatTile label="Transport Rides" value={statsQ.data?.transportProvided} icon={Bus} testId="stat-transport" />
      </div>

      <Tabs defaultValue="households" className="space-y-4">
        <TabsList>
          <TabsTrigger value="households" data-testid="tab-households">Households</TabsTrigger>
          <TabsTrigger value="reach" data-testid="tab-reach">Program Reach</TabsTrigger>
          <TabsTrigger value="services" data-testid="tab-services">Services Engaged</TabsTrigger>
        </TabsList>

        <TabsContent value="households" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Households ({householdRows.length})</CardTitle>
                <CardDescription>Click a household to see family detail.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[700px] overflow-y-auto">
                {householdRows.length === 0 && (
                  <div className="text-sm text-muted-foreground p-3 border border-dashed rounded" data-testid="text-empty-households">
                    No households yet. Use <strong>CSV Upload</strong> to bring your roster in — day-one usable.
                  </div>
                )}
                {householdRows.map(h => (
                  <button
                    key={h.id}
                    onClick={() => setOpenHousehold(h.id)}
                    className={`w-full text-left p-3 rounded border hover:bg-accent transition ${openHousehold === h.id ? "border-primary bg-accent" : "border-border"}`}
                    data-testid={`button-household-${h.id}`}
                  >
                    <div className="font-medium text-sm">{h.householdName}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-[10px]">{h.memberCount} members</Badge>
                      <Badge variant="secondary" className="text-[10px]">{h.activeEnrollmentCount} enrollments</Badge>
                      {h.primaryLanguage !== "en" && <Badge variant="outline" className="text-[10px]">{h.primaryLanguage}</Badge>}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{detail?.household.householdName || "Family detail"}</CardTitle>
                    <CardDescription>Members · enrollments · attendance · services received.</CardDescription>
                  </div>
                  {detail && (
                    <Button size="sm" onClick={() => {
                      const defaultProg = programs[0]?.id || "";
                      setAttProgramId(defaultProg);
                      const seed: Record<string, "present" | "absent" | "late" | "excused"> = {};
                      for (const mem of detail?.members || []) {
                        const isEnrolled = (detailMemberEnrollments[mem.id] || []).some(e => e.programId === defaultProg && e.status === "active");
                        if (isEnrolled) seed[mem.id] = "present";
                      }
                      setAttMarks(seed);
                      setAttTransport(false);
                      setAttendanceOpen(true);
                    }} data-testid="button-attendance-checkin">
                      <CalendarCheck className="h-4 w-4 mr-1" /> Check in attendance
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!detail && <p className="text-sm text-muted-foreground" data-testid="text-no-detail">Select a household to see family-unit detail.</p>}
                {detail && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {detail.members.map(m => (
                        <div key={m.id} className="border rounded p-2 text-sm" data-testid={`card-member-${m.id}`}>
                          <div className="font-medium flex items-center justify-between">
                            <span>{m.displayName}{m.isPrimaryContact ? " ★" : ""}</span>
                            <Badge variant="outline" className="text-[10px]">{m.relationship}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {m.ageYears != null ? `Age ${m.ageYears}` : "Adult"}
                            {m.preferredLanguage && m.preferredLanguage !== "en" ? ` · ${m.preferredLanguage}` : ""}
                            {m.contactPhone ? ` · ${m.contactPhone}` : ""}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {(detailMemberEnrollments[m.id] || []).filter(e => e.status === "active").map(e => (
                              <Badge key={e.id} variant="secondary" className="text-[10px]" data-testid={`badge-enrollment-${e.id}`}>
                                {programNameById[e.programId] || e.programId}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {attendanceTrend.length > 0 && (
                      <div>
                        <div className="text-xs font-medium mb-1">Attendance trend (last 12 sessions)</div>
                        <div className="h-40">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={attendanceTrend}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                              <XAxis dataKey="week" fontSize={10} />
                              <YAxis fontSize={10} />
                              <Tooltip />
                              <Line type="monotone" dataKey="present" stroke="#16a34a" strokeWidth={2} name="Present" />
                              <Line type="monotone" dataKey="absent" stroke="#dc2626" strokeWidth={2} name="Absent" />
                              <Line type="monotone" dataKey="meal" stroke="#f59e0b" strokeWidth={2} name="Meals served" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {detail.services.length > 0 && (
                      <div>
                        <div className="text-xs font-medium mb-1">Services this family has received</div>
                        <div className="flex flex-wrap gap-1">
                          {detail.services.map(s => (
                            <Badge key={s.id} variant="outline" data-testid={`badge-service-${s.id}`}>
                              <Heart className="h-3 w-3 mr-1" />
                              {s.serviceType.replace(/_/g, " ")}
                              <span className="ml-1 text-[10px] opacity-60">{new Date(s.serviceDate).toLocaleDateString()}</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reach">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Program reach</CardTitle>
              <CardDescription>How many people are enrolled per program, and how many attendance events each program has generated.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statsQ.data?.programs || []} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="programName" width={180} fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="enrolled" name="Enrolled">
                      {(statsQ.data?.programs || []).map((p, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[p.category] || "#64748b"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Wraparound services engaged</CardTitle>
              <CardDescription>Discrete services families have received beyond program attendance (screenings, counseling, referrals, food assistance, etc.).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <strong>{statsQ.data?.servicesRecorded ?? 0}</strong> service events recorded across this org.
                Click into any household to see service history specific to that family.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CSV upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk CSV upload — Households &amp; Members</DialogTitle>
            <DialogDescription>
              One row per <em>member</em>. Members with the same <code>household_name</code> are grouped. Required columns:
              <code> household_name, member_name, relationship</code>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCsvText(SAMPLE_CSV)} data-testid="button-load-sample">
                <FileSpreadsheet className="h-4 w-4 mr-1" /> Load sample
              </Button>
              <span className="text-xs text-muted-foreground">2 MB / 2,000 rows max.</span>
            </div>
            <Textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={SAMPLE_CSV}
              rows={10}
              className="font-mono text-xs"
              data-testid="textarea-csv"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUploadOpen(false)} data-testid="button-cancel-upload">Cancel</Button>
            <Button onClick={() => uploadMut.mutate(csvText)} disabled={!csvText || uploadMut.isPending} data-testid="button-submit-upload">
              {uploadMut.isPending ? "Uploading…" : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attendance check-in dialog */}
      <Dialog open={attendanceOpen} onOpenChange={setAttendanceOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Check in attendance — {detail?.household.householdName}</DialogTitle>
            <DialogDescription>Pick a program and a session date; mark each enrolled member's status.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Program</Label>
                <Select value={attProgramId} onValueChange={(v) => {
                  setAttProgramId(v);
                  const seed: Record<string, "present" | "absent" | "late" | "excused"> = {};
                  for (const mem of detail?.members || []) {
                    const isEnrolled = (detailMemberEnrollments[mem.id] || []).some(e => e.programId === v && e.status === "active");
                    if (isEnrolled) seed[mem.id] = "present";
                  }
                  setAttMarks(seed);
                }}>
                  <SelectTrigger data-testid="select-att-program"><SelectValue placeholder="Choose program" /></SelectTrigger>
                  <SelectContent>
                    {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Session date</Label>
                <Input type="date" value={attDate} onChange={(e) => setAttDate(e.target.value)} data-testid="input-att-date" />
              </div>
            </div>
            <div className="space-y-1">
              {(detail?.members || []).filter(m => (detailMemberEnrollments[m.id] || []).some(e => e.programId === attProgramId && e.status === "active")).map(m => (
                <div key={m.id} className="flex items-center justify-between border rounded p-2">
                  <span className="text-sm">{m.displayName} <span className="text-xs text-muted-foreground">({m.relationship}{m.ageYears != null ? `, ${m.ageYears}` : ""})</span></span>
                  <Select value={attMarks[m.id] || "present"} onValueChange={(v) => setAttMarks(prev => ({ ...prev, [m.id]: v as "present" | "absent" | "late" | "excused" }))}>
                    <SelectTrigger className="w-32" data-testid={`select-att-${m.id}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="excused">Excused</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
              {!(detail?.members || []).some(m => (detailMemberEnrollments[m.id] || []).some(e => e.programId === attProgramId && e.status === "active")) && (
                <p className="text-xs text-muted-foreground p-2">No members of this family are enrolled in the selected program.</p>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm border rounded p-2" data-testid="label-att-transport">
              <input type="checkbox" checked={attTransport} onChange={(e) => setAttTransport(e.target.checked)} data-testid="checkbox-att-transport" />
              <span>Transportation provided for the family this session</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAttendanceOpen(false)}>Cancel</Button>
            <Button onClick={() => attendanceMut.mutate()} disabled={attendanceMut.isPending || !attProgramId || Object.keys(attMarks).length === 0} data-testid="button-submit-attendance">
              {attendanceMut.isPending ? "Saving…" : "Save attendance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatTile({ label, value, icon: Icon, testId }: { label: string; value?: number | null; icon: React.ComponentType<{ className?: string }>; testId: string }) {
  return (
    <Card data-testid={testId}>
      <CardContent className="p-3 flex items-center gap-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold">{value ?? 0}</div>
        </div>
      </CardContent>
    </Card>
  );
}
