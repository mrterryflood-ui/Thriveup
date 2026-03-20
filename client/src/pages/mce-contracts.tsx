import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Briefcase, Plus, Building2, Calendar, DollarSign, FileText,
  Users, CheckCircle, Clock, AlertTriangle, Search, ChevronRight,
  Shield, TrendingUp, BookOpen, ArrowRight,
} from "lucide-react";
import type { MceContract, MceContractDeliverable, MceVendor } from "@shared/schema";

const STAGES = ["opportunity", "proposal", "negotiation", "awarded", "active", "closeout"] as const;
const CONTRACT_TYPES = ["prime", "sub", "teaming"] as const;
const DELIVERABLE_STATUSES = ["not_started", "in_progress", "submitted", "accepted", "rejected"] as const;
const CERTIFICATIONS = ["8(a)", "HUBZone", "SDVOSB", "WOSB", "MBE", "DBE"] as const;

const STAGE_COLORS: Record<string, string> = {
  opportunity: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
  proposal: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  negotiation: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  awarded: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  closeout: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

const DELIVERABLE_COLORS: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  submitted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

function formatCurrency(val: string | number | null | undefined): string {
  const num = parseFloat(String(val || "0"));
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(num);
}

const FAR_REFERENCES = [
  { clause: "FAR 19.000", title: "Small Business Programs Overview", description: "Overview of the government's policy to provide maximum practicable opportunities to small businesses." },
  { clause: "FAR 19.5", title: "Small Business Set-Asides", description: "Requirements for setting aside acquisitions exclusively for small business concerns. Contracting officers must set aside acquisitions over $250K when there is a reasonable expectation of receiving offers from at least two responsible small businesses." },
  { clause: "FAR 19.8", title: "Contracting with SBA (8(a) Program)", description: "Procedures for awarding contracts under the SBA 8(a) Business Development Program. Sole-source awards up to $4.5M for services. Competitive thresholds apply above that." },
  { clause: "FAR 19.13", title: "HUBZone Program", description: "Historically Underutilized Business Zones program. Price evaluation preference of 10%. Set-aside and sole-source authority for firms in designated HUBZones." },
  { clause: "FAR 19.14", title: "Service-Disabled Veteran-Owned Small Business (SDVOSB)", description: "Set-aside and sole-source procurement for SDVOSBs. Sole-source awards up to $4.5M for services and $7M for manufacturing." },
  { clause: "FAR 19.15", title: "Women-Owned Small Business (WOSB)", description: "Set-aside and sole-source contracting for WOSBs and Economically Disadvantaged WOSBs in designated NAICS codes." },
  { clause: "FAR 52.219-8", title: "Utilization of Small Business Concerns", description: "Clause requiring prime contractors to use best efforts to maximize subcontracting with small businesses, including SDB, WOSB, HUBZone, SDVOSB concerns." },
  { clause: "FAR 52.219-9", title: "Small Business Subcontracting Plan", description: "Requires large business prime contractors to submit subcontracting plans with goals for small business participation." },
  { clause: "FAR 52.219-14", title: "Limitations on Subcontracting", description: "For set-aside contracts, the concern must perform a certain percentage of work itself. Services: 50%. Supplies: 50% of manufacturing costs. Construction: 15%." },
  { clause: "FAR 52.219-16", title: "Liquidated Damages for Subcontracting Plan", description: "Provides for liquidated damages if a contractor fails to make a good-faith effort to comply with its subcontracting plan." },
  { clause: "FAR 4.6", title: "Contract Reporting (FPDS)", description: "Federal Procurement Data System reporting requirements. All contract actions over $3,500 must be reported." },
  { clause: "FAR 22.4", title: "Labor Standards (Davis-Bacon)", description: "Prevailing wage requirements for construction contracts over $2,000. Workers must be paid locally prevailing wages and fringe benefits." },
];

function PipelineTracker() {
  const { toast } = useToast();
  const { data: contracts, isLoading } = useQuery<MceContract[]>({ queryKey: ["/api/mce/contracts"] });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", agency: "", value: "", contractType: "prime" as string,
    stage: "opportunity" as string, notes: "", certificationsRequired: [] as string[],
    obligatedAmount: "", expendedAmount: "", inKindMatch: "",
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/mce/contracts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mce/contracts"] });
      setShowForm(false);
      setForm({ title: "", agency: "", value: "", contractType: "prime", stage: "opportunity", notes: "", certificationsRequired: [], obligatedAmount: "", expendedAmount: "", inKindMatch: "" });
      toast({ title: "Contract created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/mce/contracts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mce/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mce/compliance-calendar"] });
    },
  });

  const toggleCert = (cert: string) => {
    setForm(prev => ({
      ...prev,
      certificationsRequired: prev.certificationsRequired.includes(cert)
        ? prev.certificationsRequired.filter(c => c !== cert)
        : [...prev.certificationsRequired, cert],
    }));
  };

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;

  const grouped = STAGES.reduce((acc, stage) => {
    acc[stage] = (contracts || []).filter(c => c.stage === stage);
    return acc;
  }, {} as Record<string, MceContract[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-lg font-semibold" data-testid="text-pipeline-title">Contract Pipeline</h3>
        <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-contract">
          <Plus className="h-4 w-4 mr-2" /> New Contract
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Contract Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} data-testid="input-contract-title" />
              <Input placeholder="Agency" value={form.agency} onChange={e => setForm({ ...form, agency: e.target.value })} data-testid="input-contract-agency" />
              <Input placeholder="Value" type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} data-testid="input-contract-value" />
              <Select value={form.contractType} onValueChange={v => setForm({ ...form, contractType: v })}>
                <SelectTrigger data-testid="select-contract-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTRACT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={form.stage} onValueChange={v => setForm({ ...form, stage: v })}>
                <SelectTrigger data-testid="select-contract-stage"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Obligated Amount" type="number" value={form.obligatedAmount} onChange={e => setForm({ ...form, obligatedAmount: e.target.value })} data-testid="input-obligated-amount" />
              <Input placeholder="Expended Amount" type="number" value={form.expendedAmount} onChange={e => setForm({ ...form, expendedAmount: e.target.value })} data-testid="input-expended-amount" />
              <Input placeholder="In-Kind Match" type="number" value={form.inKindMatch} onChange={e => setForm({ ...form, inKindMatch: e.target.value })} data-testid="input-in-kind-match" />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Certifications Required</p>
              <div className="flex gap-2 flex-wrap">
                {CERTIFICATIONS.map(cert => (
                  <Badge
                    key={cert}
                    className={`cursor-pointer toggle-elevate ${form.certificationsRequired.includes(cert) ? "toggle-elevated bg-primary/10" : ""}`}
                    variant="outline"
                    onClick={() => toggleCert(cert)}
                    data-testid={`badge-cert-${cert}`}
                  >
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>
            <Textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} data-testid="input-contract-notes" />
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => createMutation.mutate(form)} disabled={!form.title || !form.agency || createMutation.isPending} data-testid="button-save-contract">
                {createMutation.isPending ? "Saving..." : "Save Contract"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} data-testid="button-cancel-contract">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {STAGES.map(stage => (
          <div key={stage} className="space-y-2">
            <div className="flex items-center justify-between gap-1">
              <Badge className={STAGE_COLORS[stage]} data-testid={`badge-stage-${stage}`}>{stage}</Badge>
              <span className="text-xs text-muted-foreground">{grouped[stage].length}</span>
            </div>
            {grouped[stage].map(contract => (
              <Card key={contract.id} className="hover-elevate">
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate" data-testid={`text-contract-${contract.id}`}>{contract.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{contract.agency}</p>
                  <p className="text-xs font-semibold mt-1">{formatCurrency(contract.value)}</p>
                  <Badge variant="outline" className="mt-1 text-xs">{contract.contractType}</Badge>
                  {contract.certificationsRequired && (contract.certificationsRequired as string[]).length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {(contract.certificationsRequired as string[]).map(c => (
                        <span key={c} className="text-[10px] text-muted-foreground">{c}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-1 mt-2">
                    {STAGES.indexOf(stage) > 0 && (
                      <Button size="icon" variant="ghost" onClick={() => updateMutation.mutate({ id: contract.id, data: { stage: STAGES[STAGES.indexOf(stage) - 1] } })} data-testid={`button-move-back-${contract.id}`}>
                        <ChevronRight className="h-3 w-3 rotate-180" />
                      </Button>
                    )}
                    {STAGES.indexOf(stage) < STAGES.length - 1 && (
                      <Button size="icon" variant="ghost" onClick={() => updateMutation.mutate({ id: contract.id, data: { stage: STAGES[STAGES.indexOf(stage) + 1] } })} data-testid={`button-move-forward-${contract.id}`}>
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {grouped[stage].length === 0 && (
              <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-md">
                No contracts
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function VendorRegistry() {
  const { toast } = useToast();
  const { data: vendors, isLoading } = useQuery<MceVendor[]>({ queryKey: ["/api/mce/vendors"] });
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    companyName: "", contactName: "", contactEmail: "", phone: "",
    certifications: [] as string[], capabilityStatementUrl: "", notes: "",
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/mce/vendors", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mce/vendors"] });
      setShowForm(false);
      setForm({ companyName: "", contactName: "", contactEmail: "", phone: "", certifications: [], capabilityStatementUrl: "", notes: "" });
      toast({ title: "Vendor added" });
    },
  });

  const toggleCert = (cert: string) => {
    setForm(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert],
    }));
  };

  const filtered = (vendors || []).filter(v =>
    v.companyName.toLowerCase().includes(search.toLowerCase()) ||
    (v.contactName || "").toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-lg font-semibold" data-testid="text-vendor-title">Vendor / Subcontractor Registry</h3>
        <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-vendor">
          <Plus className="h-4 w-4 mr-2" /> Add Vendor
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" data-testid="input-search-vendors" />
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Company Name" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} data-testid="input-vendor-company" />
              <Input placeholder="Contact Name" value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} data-testid="input-vendor-contact" />
              <Input placeholder="Email" type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} data-testid="input-vendor-email" />
              <Input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} data-testid="input-vendor-phone" />
              <Input placeholder="Capability Statement URL" value={form.capabilityStatementUrl} onChange={e => setForm({ ...form, capabilityStatementUrl: e.target.value })} className="col-span-full" data-testid="input-vendor-capability-url" />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Certifications</p>
              <div className="flex gap-2 flex-wrap">
                {CERTIFICATIONS.map(cert => (
                  <Badge
                    key={cert}
                    className={`cursor-pointer toggle-elevate ${form.certifications.includes(cert) ? "toggle-elevated bg-primary/10" : ""}`}
                    variant="outline"
                    onClick={() => toggleCert(cert)}
                    data-testid={`badge-vendor-cert-${cert}`}
                  >
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>
            <Textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} data-testid="input-vendor-notes" />
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => createMutation.mutate(form)} disabled={!form.companyName || createMutation.isPending} data-testid="button-save-vendor">
                {createMutation.isPending ? "Saving..." : "Save Vendor"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} data-testid="button-cancel-vendor">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map(vendor => (
          <Card key={vendor.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold" data-testid={`text-vendor-${vendor.id}`}>{vendor.companyName}</p>
                  {vendor.contactName && <p className="text-sm text-muted-foreground">{vendor.contactName}</p>}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                    {vendor.contactEmail && <span>{vendor.contactEmail}</span>}
                    {vendor.phone && <span>{vendor.phone}</span>}
                  </div>
                  {vendor.capabilityStatementUrl && (
                    <a href={vendor.capabilityStatementUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block" data-testid={`link-vendor-capability-${vendor.id}`}>
                      Capability Statement
                    </a>
                  )}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(vendor.certifications as string[])?.map(cert => (
                    <Badge key={cert} variant="outline" className="text-xs">{cert}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8" data-testid="text-no-vendors">No vendors found.</p>
        )}
      </div>
    </div>
  );
}

function DeliverableTracker() {
  const { toast } = useToast();
  const { data: contracts } = useQuery<MceContract[]>({ queryKey: ["/api/mce/contracts"] });
  const [selectedContract, setSelectedContract] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", dueDate: "", notes: "" });

  const effectiveContract = selectedContract || (contracts && contracts.length > 0 ? String(contracts[0]?.id) : "");

  const { data: deliverables, isLoading } = useQuery<MceContractDeliverable[]>({
    queryKey: ["/api/mce/contracts", effectiveContract, "deliverables"],
    queryFn: () => fetch(`/api/mce/contracts/${effectiveContract}/deliverables`).then(r => r.json()),
    enabled: !!effectiveContract,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/mce/contracts/${effectiveContract}/deliverables`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mce/contracts", effectiveContract, "deliverables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mce/compliance-calendar"] });
      setShowForm(false);
      setForm({ title: "", dueDate: "", notes: "" });
      toast({ title: "Deliverable added" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/mce/deliverables/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mce/contracts", effectiveContract, "deliverables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mce/compliance-calendar"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-lg font-semibold" data-testid="text-deliverables-title">Deliverable Tracker</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={effectiveContract} onValueChange={setSelectedContract}>
            <SelectTrigger className="w-48" data-testid="select-contract-filter"><SelectValue placeholder="Select contract" /></SelectTrigger>
            <SelectContent>
              {contracts?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowForm(!showForm)} disabled={!effectiveContract} data-testid="button-add-deliverable">
            <Plus className="h-4 w-4 mr-2" /> Add Deliverable
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Deliverable Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} data-testid="input-deliverable-title" />
              <Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} data-testid="input-deliverable-due-date" />
            </div>
            <Textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} data-testid="input-deliverable-notes" />
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => createMutation.mutate({ ...form, dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined })} disabled={!form.title || createMutation.isPending} data-testid="button-save-deliverable">
                {createMutation.isPending ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} data-testid="button-cancel-deliverable">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <div className="space-y-2">
          {deliverables?.map(d => (
            <Card key={d.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium" data-testid={`text-deliverable-${d.id}`}>{d.title}</p>
                      <Badge className={DELIVERABLE_COLORS[d.status]} data-testid={`badge-deliverable-status-${d.id}`}>{d.status.replace(/_/g, " ")}</Badge>
                    </div>
                    {d.dueDate && <p className="text-xs text-muted-foreground mt-1">Due: {new Date(d.dueDate).toLocaleDateString()}</p>}
                    {d.notes && <p className="text-xs text-muted-foreground mt-1">{d.notes}</p>}
                  </div>
                  <Select value={d.status} onValueChange={v => updateMutation.mutate({ id: d.id, data: { status: v } })}>
                    <SelectTrigger className="w-36" data-testid={`select-deliverable-status-${d.id}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DELIVERABLE_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!deliverables || deliverables.length === 0) && (
            <p className="text-center text-muted-foreground py-8" data-testid="text-no-deliverables">
              {effectiveContract ? "No deliverables yet." : "Select a contract first."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ComplianceCalendar() {
  const { data: events, isLoading } = useQuery<any[]>({ queryKey: ["/api/mce/compliance-calendar"] });

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  const urgencyColor = (urgency: string) => {
    if (urgency === "red") return "border-l-red-500";
    if (urgency === "yellow") return "border-l-yellow-500";
    return "border-l-green-500";
  };

  const urgencyBg = (urgency: string) => {
    if (urgency === "red") return "bg-red-50 dark:bg-red-950/20";
    if (urgency === "yellow") return "bg-yellow-50 dark:bg-yellow-950/20";
    return "";
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold" data-testid="text-compliance-title">Compliance Calendar</h3>
      <div className="flex gap-4 flex-wrap text-sm">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500" /> Less than 7 days</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500" /> 7-30 days</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500" /> More than 30 days</div>
      </div>
      <div className="space-y-2">
        {events?.map(event => (
          <Card key={event.id} className={`border-l-4 ${urgencyColor(event.urgency)} ${urgencyBg(event.urgency)} rounded-none`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="text-sm font-medium" data-testid={`text-event-${event.id}`}>{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.type.replace(/_/g, " ")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{new Date(event.date).toLocaleDateString()}</p>
                  <p className="text-xs text-muted-foreground">{event.daysUntil > 0 ? `${event.daysUntil} days away` : event.daysUntil === 0 ? "Today" : `${Math.abs(event.daysUntil)} days ago`}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!events || events.length === 0) && (
          <p className="text-center text-muted-foreground py-8" data-testid="text-no-events">No upcoming compliance events. Add contracts with dates to populate the calendar.</p>
        )}
      </div>
    </div>
  );
}

function ContractFinancials() {
  const { data: contracts, isLoading } = useQuery<MceContract[]>({ queryKey: ["/api/mce/contracts"] });

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;

  const activeContracts = (contracts || []).filter(c => ["awarded", "active"].includes(c.stage));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold" data-testid="text-financials-title">Contract Financials</h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Obligated</p>
            <p className="text-2xl font-bold" data-testid="text-total-obligated">
              {formatCurrency((contracts || []).reduce((sum, c) => sum + parseFloat(String(c.obligatedAmount || "0")), 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Expended</p>
            <p className="text-2xl font-bold" data-testid="text-total-expended">
              {formatCurrency((contracts || []).reduce((sum, c) => sum + parseFloat(String(c.expendedAmount || "0")), 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total In-Kind Match</p>
            <p className="text-2xl font-bold" data-testid="text-total-inkind">
              {formatCurrency((contracts || []).reduce((sum, c) => sum + parseFloat(String(c.inKindMatch || "0")), 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {activeContracts.map(contract => {
          const obligated = parseFloat(String(contract.obligatedAmount || "0"));
          const expended = parseFloat(String(contract.expendedAmount || "0"));
          const remaining = obligated - expended;
          const burnRate = obligated > 0 ? (expended / obligated) * 100 : 0;
          const inKind = parseFloat(String(contract.inKindMatch || "0"));

          return (
            <Card key={contract.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-semibold" data-testid={`text-financial-contract-${contract.id}`}>{contract.title}</p>
                    <p className="text-xs text-muted-foreground">{contract.agency}</p>
                  </div>
                  <Badge className={STAGE_COLORS[contract.stage]}>{contract.stage}</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Obligated</p>
                    <p className="font-semibold">{formatCurrency(obligated)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Expended</p>
                    <p className="font-semibold">{formatCurrency(expended)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Remaining</p>
                    <p className="font-semibold">{formatCurrency(remaining)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">In-Kind Match</p>
                    <p className="font-semibold">{formatCurrency(inKind)}</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>Burn Rate</span>
                    <span>{burnRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={burnRate} className="h-2" data-testid={`progress-burn-rate-${contract.id}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
        {activeContracts.length === 0 && (
          <p className="text-center text-muted-foreground py-8" data-testid="text-no-financials">No awarded/active contracts to show financials for.</p>
        )}
      </div>
    </div>
  );
}

function FARReference() {
  const [search, setSearch] = useState("");
  const filtered = FAR_REFERENCES.filter(r =>
    r.clause.toLowerCase().includes(search.toLowerCase()) ||
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold" data-testid="text-far-title">FAR Quick Reference</h3>
      <p className="text-sm text-muted-foreground">Key Federal Acquisition Regulation clauses relevant to small and minority businesses.</p>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search FAR clauses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" data-testid="input-search-far" />
      </div>
      <div className="space-y-2">
        {filtered.map(ref => (
          <Card key={ref.clause}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs font-mono">{ref.clause}</Badge>
                    <p className="font-semibold text-sm" data-testid={`text-far-${ref.clause.replace(/\s/g, '-')}`}>{ref.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{ref.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8" data-testid="text-no-far-results">No matching FAR clauses found.</p>
        )}
      </div>
    </div>
  );
}

export default function MceContractsPage() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">MCE Contract Management Center</h1>
        <p className="text-muted-foreground">Manage contracts, vendors, deliverables, compliance, and financials for the Minority Center of Excellence.</p>
      </div>

      <Tabs defaultValue="pipeline">
        <TabsList className="flex-wrap">
          <TabsTrigger value="pipeline" data-testid="tab-pipeline">
            <Briefcase className="h-4 w-4 mr-1" /> Pipeline
          </TabsTrigger>
          <TabsTrigger value="vendors" data-testid="tab-vendors">
            <Users className="h-4 w-4 mr-1" /> Vendors
          </TabsTrigger>
          <TabsTrigger value="deliverables" data-testid="tab-deliverables">
            <CheckCircle className="h-4 w-4 mr-1" /> Deliverables
          </TabsTrigger>
          <TabsTrigger value="compliance" data-testid="tab-compliance">
            <Calendar className="h-4 w-4 mr-1" /> Compliance
          </TabsTrigger>
          <TabsTrigger value="financials" data-testid="tab-financials">
            <DollarSign className="h-4 w-4 mr-1" /> Financials
          </TabsTrigger>
          <TabsTrigger value="far" data-testid="tab-far">
            <BookOpen className="h-4 w-4 mr-1" /> FAR Reference
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline"><PipelineTracker /></TabsContent>
        <TabsContent value="vendors"><VendorRegistry /></TabsContent>
        <TabsContent value="deliverables"><DeliverableTracker /></TabsContent>
        <TabsContent value="compliance"><ComplianceCalendar /></TabsContent>
        <TabsContent value="financials"><ContractFinancials /></TabsContent>
        <TabsContent value="far"><FARReference /></TabsContent>
      </Tabs>
    </div>
  );
}
