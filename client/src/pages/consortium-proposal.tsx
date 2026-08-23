import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, FileText, Send, Download, Loader2, ChevronRight, Building2, Zap, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ROLES = [
  { value: "prime", label: "Prime Applicant / Fiscal Agent" },
  { value: "program_lead", label: "Programmatic Lead" },
  { value: "network", label: "Network Convening / Grant Support" },
  { value: "education", label: "Education System Coordination" },
  { value: "behavioral_health", label: "Behavioral Health / Trauma-Informed" },
  { value: "data_hmis", label: "Data / HMIS / Coordinated Entry" },
  { value: "systems_architect", label: "Systems Architect / Implementation Science" },
  { value: "youth_voice", label: "Youth Voice / Lived Experience" },
  { value: "fiscal", label: "Fiscal / Compliance" },
];

const SECTIONS_BY_ROLE: Record<string, string[]> = {
  prime: ["Organizational Capacity", "Fiscal Administration", "Compliance and Reporting"],
  program_lead: ["Statement of Need", "Project Design", "Youth Action Board"],
  network: ["Community Partnerships", "Sustainability Plan"],
  education: ["Education Pathway Coordination", "McKinney-Vento Alignment"],
  behavioral_health: ["Trauma-Informed Care Framework", "Behavioral Health Integration"],
  data_hmis: ["HMIS Data Capacity", "Coordinated Entry Alignment", "Performance Measurement"],
  systems_architect: ["Systems Analysis", "Implementation Framework", "Workflow Architecture", "Performance Structure", "Continuous Improvement Methodology"],
  youth_voice: ["Youth Leadership and Governance", "Community Engagement"],
  fiscal: ["Budget Narrative", "Indirect Cost Approach"],
};

interface ConsortiumProposal {
  id: string;
  grantTitle: string;
  grantNofo?: string;
  grantDeadline?: string;
  awardAmount?: string;
  projectTitle: string;
  geography?: string;
  status: string;
  primeOrgName: string;
  primeUei?: string;
  primeEin?: string;
  indirectCostApproach?: string;
  mergedNarrative?: string;
  gppPushedAt?: string;
  members?: ConsortiumMember[];
}

interface ConsortiumMember {
  id: string;
  orgName: string;
  contactName?: string;
  contactEmail?: string;
  role: string;
  assignedSections: string[];
  sectionContent: Record<string, string>;
}

function NewProposalDialog({ onCreated }: { onCreated: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    grantTitle: "", grantNofo: "", grantDeadline: "", awardAmount: "",
    projectTitle: "", geography: "", primeOrgName: "", primeUei: "", primeEin: "",
    indirectCostApproach: "de_minimis_10",
  });

  const create = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/consortium/proposals", data),
    onSuccess: () => { toast({ title: "Consortium proposal created" }); setOpen(false); onCreated(); },
    onError: () => toast({ title: "Failed to create", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />New Consortium Proposal</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create Consortium Proposal</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium">Grant / NOFO Title *</label>
              <Input placeholder="e.g. HUD Youth Homelessness System Improvement" value={form.grantTitle} onChange={e => setForm(f => ({ ...f, grantTitle: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">NOFO Number</label>
              <Input placeholder="e.g. CPD-2600-DC-0035" value={form.grantNofo} onChange={e => setForm(f => ({ ...f, grantNofo: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Award Amount</label>
              <Input placeholder="e.g. $1,000,000" value={form.awardAmount} onChange={e => setForm(f => ({ ...f, awardAmount: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Deadline</label>
              <Input type="datetime-local" value={form.grantDeadline} onChange={e => setForm(f => ({ ...f, grantDeadline: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Geography</label>
              <Input placeholder="e.g. Wichita & Sedgwick County, KS" value={form.geography} onChange={e => setForm(f => ({ ...f, geography: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Project Title *</label>
              <Input placeholder="e.g. Turning Point Youth Homelessness Response Collaborative" value={form.projectTitle} onChange={e => setForm(f => ({ ...f, projectTitle: e.target.value }))} />
            </div>
            <div className="col-span-2 border-t pt-3">
              <p className="text-sm font-semibold mb-2">Prime Applicant</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Prime Org Name *</label>
              <Input placeholder="e.g. Prime Fit Youth Foundation" value={form.primeOrgName} onChange={e => setForm(f => ({ ...f, primeOrgName: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">UEI</label>
              <Input placeholder="SAM.gov UEI" value={form.primeUei} onChange={e => setForm(f => ({ ...f, primeUei: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">EIN</label>
              <Input placeholder="XX-XXXXXXX" value={form.primeEin} onChange={e => setForm(f => ({ ...f, primeEin: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Indirect Cost Approach</label>
              <Select value={form.indirectCostApproach} onValueChange={v => setForm(f => ({ ...f, indirectCostApproach: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="de_minimis_10">De Minimis 10% of MTDC (fastest path)</SelectItem>
                  <SelectItem value="negotiated_rate">Negotiated Rate (requires NICRA)</SelectItem>
                  <SelectItem value="no_indirect">No Indirect Costs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full" onClick={() => create.mutate(form)} disabled={create.isPending || !form.grantTitle || !form.projectTitle || !form.primeOrgName}>
            {create.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Create Proposal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddMemberDialog({ proposalId, onAdded }: { proposalId: string; onAdded: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ orgName: "", contactName: "", contactEmail: "", role: "", assignedSections: [] as string[] });

  const add = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", `/api/consortium/proposals/${proposalId}/members`, data),
    onSuccess: () => { toast({ title: "Team member added" }); setOpen(false); onAdded(); setForm({ orgName: "", contactName: "", contactEmail: "", role: "", assignedSections: [] }); },
    onError: () => toast({ title: "Failed to add member", variant: "destructive" }),
  });

  const suggestedSections = form.role ? (SECTIONS_BY_ROLE[form.role] || []) : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" />Add Team Member</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <label className="text-sm font-medium">Organization Name *</label>
            <Input placeholder="e.g. Turning Point" value={form.orgName} onChange={e => setForm(f => ({ ...f, orgName: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium">Role *</label>
            <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v, assignedSections: SECTIONS_BY_ROLE[v] || [] }))}>
              <SelectTrigger><SelectValue placeholder="Select role..." /></SelectTrigger>
              <SelectContent>
                {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium">Contact Name</label>
              <Input placeholder="Jane Smith" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Contact Email</label>
              <Input placeholder="jane@org.org" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} />
            </div>
          </div>
          {suggestedSections.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Assigned Sections (auto-suggested by role)</p>
              <div className="flex flex-wrap gap-1">
                {suggestedSections.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
              </div>
            </div>
          )}
          <Button className="w-full" onClick={() => add.mutate(form)} disabled={add.isPending || !form.orgName || !form.role}>
            {add.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Add Member
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionGenerator({ proposal, member, onGenerated }: { proposal: ConsortiumProposal; member: ConsortiumMember; onGenerated: () => void }) {
  const { toast } = useToast();
  const [selectedSection, setSelectedSection] = useState(member.assignedSections[0] || "");
  const [context, setContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  async function generate() {
    if (!selectedSection) return;
    setGenerating(true);
    try {
      const res = await apiRequest("POST", `/api/consortium/proposals/${proposal.id}/generate-section`, {
        memberId: member.id, section: selectedSection, additionalContext: context,
      });
      const data = await res.json();
      setPreview(data.content);
      toast({ title: `"${selectedSection}" generated` });
      onGenerated();
    } catch {
      toast({ title: "Generation failed", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  const existingContent = member.sectionContent[selectedSection];

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Select value={selectedSection} onValueChange={setSelectedSection}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select section..." />
          </SelectTrigger>
          <SelectContent>
            {member.assignedSections.map(s => (
              <SelectItem key={s} value={s}>
                {s} {member.sectionContent[s] ? "✓" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={generate} disabled={!selectedSection || generating} aria-label={`Generate ${selectedSection || "proposal section"}`}>
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          <span className="sr-only">Generate {selectedSection || "proposal section"}</span>
        </Button>
      </div>
      {(preview || existingContent) && (
        <div className="bg-muted/50 rounded p-3 text-sm max-h-40 overflow-y-auto whitespace-pre-wrap">
          {preview || existingContent}
        </div>
      )}
    </div>
  );
}

function ProposalWorkspace({ proposalId, onBack }: { proposalId: string; onBack: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [pushing, setPushing] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);

  const { data: proposal, isLoading, isError, error, refetch } = useQuery<ConsortiumProposal>({
    queryKey: ["/api/consortium/proposals", proposalId],
    queryFn: () => apiRequest("GET", `/api/consortium/proposals/${proposalId}`).then(r => r.json()),
  });

  async function push(type: "entity" | "pursuit" | "collaborative" | "proposal") {
    if (!proposal) return;
    setPushing(type);
    try {
      const body: Record<string, string> = { consortiumId: proposal.id };
      const r = await apiRequest("POST", `/api/thriveup/push-${type}`, body);
      const data = await r.json();
      if (data.sent) toast({ title: `Pushed ${type} to GrantPathPro` });
      else if (data.preview) toast({ title: "Delivery is not configured", description: data.error || "No payload was sent. Configure both the GrantPathPro URL and credential, then try again.", variant: "destructive" });
      else toast({ title: `GrantPathPro delivery failed`, description: data.error || "The configured delivery target did not accept the request.", variant: "destructive" });
      console.log(`[Push ${type}]`, data);
    } catch {
      toast({ title: `Push failed`, variant: "destructive" });
    } finally {
      setPushing(null);
    }
  }

  async function merge() {
    if (!proposal) return;
    setMerging(true);
    try {
      const r = await apiRequest("POST", `/api/consortium/proposals/${proposal.id}/merge`, {});
      const data = await r.json();
      qc.invalidateQueries({ queryKey: ["/api/consortium/proposals", proposalId] });
      toast({ title: "Narrative merged" });
    } catch {
      toast({ title: "Merge failed", variant: "destructive" });
    } finally {
      setMerging(false);
    }
  }

  function downloadMerged() {
    if (!proposal?.mergedNarrative) return;
    const blob = new Blob([proposal.mergedNarrative], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${proposal.projectTitle.replace(/\s+/g, "_")}_merged.txt`;
    a.click();
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (isError) return <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>Could not load this proposal: {error instanceof Error ? error.message : "request failed"}. <Button variant="ghost" className="h-auto p-0 underline" onClick={() => refetch()}>Retry</Button></AlertDescription></Alert>;
  if (!proposal) return <div className="text-center py-12 text-muted-foreground">Proposal not found.</div>;

  const deadline = proposal.grantDeadline ? new Date(proposal.grantDeadline) : null;
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - Date.now()) / 86400000) : null;
  const sectionsDone = (proposal.members || []).reduce((n, m) => n + Object.values(m.sectionContent).filter(Boolean).length, 0);
  const sectionsTotal = (proposal.members || []).reduce((n, m) => n + m.assignedSections.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground mb-1 flex items-center gap-1">
            ← All Proposals
          </button>
          <h2 className="text-xl font-bold">{proposal.projectTitle}</h2>
          <p className="text-muted-foreground text-sm">{proposal.grantTitle}{proposal.grantNofo ? ` — ${proposal.grantNofo}` : ""}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline"><Building2 className="h-3 w-3 mr-1" />{proposal.primeOrgName}</Badge>
            {proposal.geography && <Badge variant="outline">{proposal.geography}</Badge>}
            {proposal.awardAmount && <Badge variant="secondary">{proposal.awardAmount}</Badge>}
            {daysLeft !== null && <Badge variant={daysLeft <= 3 ? "destructive" : daysLeft <= 7 ? "secondary" : "outline"}>{daysLeft}d left</Badge>}
            <Badge variant="outline">{sectionsDone}/{sectionsTotal} sections</Badge>
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={merge} disabled={merging}>
            {merging ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileText className="h-4 w-4 mr-1" />}
            Merge Narrative
          </Button>
          {proposal.mergedNarrative && (
            <Button size="sm" variant="outline" onClick={downloadMerged}>
              <Download className="h-4 w-4 mr-1" />Download
            </Button>
          )}
        </div>
      </div>

      {/* Push to GPP */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Send className="h-4 w-4" />Push to GrantPathPro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(["entity", "pursuit", "collaborative", "proposal"] as const).map(type => (
              <Button key={type} variant="outline" size="sm" onClick={() => push(type)} disabled={pushing === type}>
                {pushing === type ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Push in order: Entity → Pursuit → Collaborative → Proposal. GPP_API_URL must be set for live push — otherwise returns a preview payload.
          </p>
        </CardContent>
      </Card>

      {/* Team Members */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4" />Team Members</h3>
          <AddMemberDialog proposalId={proposal.id} onAdded={() => qc.invalidateQueries({ queryKey: ["/api/consortium/proposals", proposalId] })} />
        </div>
        {(!proposal.members || proposal.members.length === 0) ? (
          <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No team members yet. Add the prime applicant and each partner org.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {proposal.members.map(member => {
              const roleLabel = ROLES.find(r => r.value === member.role)?.label || member.role;
              const done = Object.values(member.sectionContent).filter(Boolean).length;
              return (
                <Card key={member.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold">{member.orgName}</p>
                        <p className="text-sm text-muted-foreground">{roleLabel}</p>
                        {member.contactName && <p className="text-xs text-muted-foreground">{member.contactName}{member.contactEmail ? ` · ${member.contactEmail}` : ""}</p>}
                      </div>
                      <Badge variant={done === member.assignedSections.length && done > 0 ? "default" : "secondary"}>
                        {done}/{member.assignedSections.length} sections
                      </Badge>
                    </div>
                    {member.assignedSections.length > 0 && (
                      <SectionGenerator
                        proposal={proposal}
                        member={member}
                        onGenerated={() => qc.invalidateQueries({ queryKey: ["/api/consortium/proposals", proposalId] })}
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Merged narrative preview */}
      {proposal.mergedNarrative && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Merged Narrative Preview</CardTitle></CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded p-4 text-sm max-h-64 overflow-y-auto whitespace-pre-wrap font-mono">
              {proposal.mergedNarrative}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function GppStatusBanner() {
  const { data, isLoading, isError, error, refetch } = useQuery<{ configured: boolean; url: string | null }>({
    queryKey: ["/api/consortium/gpp-status"],
    queryFn: () => apiRequest("GET", "/api/consortium/gpp-status").then(r => r.json()),
    staleTime: 60_000,
  });

  if (isLoading || data?.configured) return null;

  return (
    <Alert className={isError ? "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800" : "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800"}>
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
        {isError ? <><strong>GrantPathPro connection status is unknown.</strong> {error instanceof Error ? error.message : "The status check failed."} <Button variant="ghost" className="h-auto p-0 underline" onClick={() => refetch()}>Retry</Button></> : <><strong>GrantPathPro delivery is not connected.</strong> You can continue building proposals in ThriveUp, but no changes are queued or sent automatically. Use the explicit push controls after a valid GrantPathPro URL and credential are configured.</>}
      </AlertDescription>
    </Alert>
  );
}

function GppSyncBadge({ pushedAt }: { pushedAt?: string }) {
  if (!pushedAt) return (
    <Badge variant="outline" className="text-xs text-muted-foreground gap-1">
      <Clock className="h-3 w-3" />GPP pending
    </Badge>
  );
  const when = new Date(pushedAt);
  const minutesAgo = Math.round((Date.now() - when.getTime()) / 60000);
  const label = minutesAgo < 2 ? "just now" : minutesAgo < 60 ? `${minutesAgo}m ago` : when.toLocaleDateString();
  return (
    <Badge variant="outline" className="text-xs text-green-700 border-green-300 gap-1">
      <CheckCircle className="h-3 w-3" />GPP synced {label}
    </Badge>
  );
}

export default function ConsortiumProposalPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);

  const { data: proposals = [], isLoading, isError, error, refetch } = useQuery<ConsortiumProposal[]>({
    queryKey: ["/api/consortium/proposals"],
    queryFn: () => apiRequest("GET", "/api/consortium/proposals").then(r => r.json()),
  });

  if (selected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <ProposalWorkspace proposalId={selected} onBack={() => setSelected(null)} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Consortium Proposals</h1>
          <p className="text-muted-foreground text-sm mt-1">Multi-org grant proposals — prime applicant + partner team, section-by-section, push to GrantPathPro</p>
        </div>
        <NewProposalDialog onCreated={() => qc.invalidateQueries({ queryKey: ["/api/consortium/proposals"] })} />
      </div>

      <GppStatusBanner />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : isError ? (
        <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>Could not load consortium proposals: {error instanceof Error ? error.message : "request failed"}. <Button variant="ghost" className="h-auto p-0 underline" onClick={() => refetch()}>Retry</Button></AlertDescription></Alert>
      ) : proposals.length === 0 ? (
        <div className="border border-dashed rounded-xl p-16 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h3 className="font-semibold mb-1">No consortium proposals yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Start with the HUD YHSI application — Prime Fit as prime, add each partner with their role.</p>
          <NewProposalDialog onCreated={() => qc.invalidateQueries({ queryKey: ["/api/consortium/proposals"] })} />
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map(p => {
            const deadline = p.grantDeadline ? new Date(p.grantDeadline) : null;
            const daysLeft = deadline ? Math.ceil((deadline.getTime() - Date.now()) / 86400000) : null;
            return (
              <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" role="button" tabIndex={0} aria-label={`Open proposal: ${p.projectTitle}`} onClick={() => setSelected(p.id)} onKeyDown={event => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelected(p.id);
                }
              }}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{p.projectTitle}</p>
                    <p className="text-sm text-muted-foreground">{p.grantTitle}{p.grantNofo ? ` · ${p.grantNofo}` : ""}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline" className="text-xs"><Building2 className="h-3 w-3 mr-1" />{p.primeOrgName}</Badge>
                      {p.geography && <Badge variant="outline" className="text-xs">{p.geography}</Badge>}
                      {p.awardAmount && <Badge variant="secondary" className="text-xs">{p.awardAmount}</Badge>}
                      <GppSyncBadge pushedAt={p.gppPushedAt} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {daysLeft !== null && (
                      <Badge variant={daysLeft <= 3 ? "destructive" : daysLeft <= 7 ? "secondary" : "outline"}>
                        {daysLeft}d
                      </Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
