import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Plus, Target, CheckCircle2, Clock, AlertTriangle,
  Download, BarChart3, FileText, ArrowRight, Trash2, ExternalLink
} from "lucide-react";
import type { GrantOpportunity } from "@shared/schema";

function FitScoreBadge({ score }: { score: number | null }) {
  if (score === null || score === undefined) return <Badge variant="outline">Not scored</Badge>;
  if (score >= 70) return <Badge className="bg-emerald-600 text-white">{score}% Fit</Badge>;
  if (score >= 40) return <Badge className="bg-amber-600 text-white">{score}% Fit</Badge>;
  return <Badge variant="destructive">{score}% Fit</Badge>;
}

function StatusBadge({ status }: { status: string | null }) {
  const map: Record<string, { label: string; variant: string }> = {
    identified: { label: "Identified", variant: "outline" },
    researching: { label: "Researching", variant: "secondary" },
    preparing: { label: "Preparing", variant: "default" },
    submitted: { label: "Submitted", variant: "default" },
    awarded: { label: "Awarded", variant: "default" },
    declined: { label: "Declined", variant: "destructive" },
  };
  const info = map[status || "identified"] || map.identified;
  return <Badge variant={info.variant as any}>{info.label}</Badge>;
}

export default function GrantHubPage() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", agency: "", fundingAmount: "", description: "", eligibilityCriteria: "", focusAreas: "", sourceUrl: "", grantType: "" });

  const { data: grants = [], isLoading, error: grantsError, refetch } = useQuery<GrantOpportunity[]>({ queryKey: ["/api/grants"] });
  const { data: report } = useQuery({ queryKey: ["/api/grants/report/alignment"] });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/grants", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grants/report/alignment"] });
      setShowForm(false);
      setFormData({ title: "", agency: "", fundingAmount: "", description: "", eligibilityCriteria: "", focusAreas: "", sourceUrl: "", grantType: "" });
      toast({ title: "Grant opportunity added" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/grants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grants/report/alignment"] });
      toast({ title: "Grant removed" });
    },
  });

  const handleSubmit = () => {
    const fa = formData.focusAreas.split(",").map(s => s.trim()).filter(Boolean);
    createMutation.mutate({ ...formData, focusAreas: fa.length ? fa : undefined });
  };

  const alignmentReport = report as any;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-grant-hub-title">Grant Discovery Hub</h1>
          <p className="text-muted-foreground mt-1">Track grant opportunities, measure platform alignment, and generate readiness reports</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-grant" aria-label="Add grant opportunity">
            <Plus className="mr-2 h-4 w-4" /> Add Grant
          </Button>
        </div>
      </div>

      {alignmentReport && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center" data-testid="card-stat-total-grants">
            <p className="text-2xl font-bold text-primary">{alignmentReport.totalGrants || 0}</p>
            <p className="text-sm text-muted-foreground">Total Grants</p>
          </Card>
          <Card className="p-4 text-center" data-testid="card-stat-high-fit">
            <p className="text-2xl font-bold text-emerald-600">{alignmentReport.highFitGrants || 0}</p>
            <p className="text-sm text-muted-foreground">High Fit (70%+)</p>
          </Card>
          <Card className="p-4 text-center" data-testid="card-stat-medium-fit">
            <p className="text-2xl font-bold text-amber-600">{alignmentReport.mediumFitGrants || 0}</p>
            <p className="text-sm text-muted-foreground">Medium Fit</p>
          </Card>
          <Card className="p-4 text-center" data-testid="card-stat-capabilities">
            <p className="text-2xl font-bold text-blue-600">{alignmentReport.capabilities?.length || 0}</p>
            <p className="text-sm text-muted-foreground">Platform Capabilities</p>
          </Card>
        </div>
      )}

      {showForm && (
        <Card className="p-6 space-y-4" data-testid="card-grant-form">
          <h2 className="font-semibold text-lg">Add Grant Opportunity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Grant Title</label>
              <Input value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="e.g., OJJDP FY25 Second Chance Act" data-testid="input-grant-title" aria-label="Grant title" />
            </div>
            <div>
              <label className="text-sm font-medium">Funding Agency</label>
              <Input value={formData.agency} onChange={e => setFormData(p => ({ ...p, agency: e.target.value }))} placeholder="e.g., Office of Juvenile Justice" data-testid="input-grant-agency" aria-label="Funding agency" />
            </div>
            <div>
              <label className="text-sm font-medium">Funding Amount</label>
              <Input value={formData.fundingAmount} onChange={e => setFormData(p => ({ ...p, fundingAmount: e.target.value }))} placeholder="e.g., $750,000" data-testid="input-grant-amount" aria-label="Funding amount" />
            </div>
            <div>
              <label className="text-sm font-medium">Grant Type</label>
              <Input value={formData.grantType} onChange={e => setFormData(p => ({ ...p, grantType: e.target.value }))} placeholder="e.g., Youth Reentry" data-testid="input-grant-type" aria-label="Grant type" />
            </div>
            <div>
              <label className="text-sm font-medium">Source URL</label>
              <Input value={formData.sourceUrl} onChange={e => setFormData(p => ({ ...p, sourceUrl: e.target.value }))} placeholder="https://..." data-testid="input-grant-url" aria-label="Source URL" />
            </div>
            <div>
              <label className="text-sm font-medium">Focus Areas (comma-separated)</label>
              <Input value={formData.focusAreas} onChange={e => setFormData(p => ({ ...p, focusAreas: e.target.value }))} placeholder="workforce, reentry, education" data-testid="input-grant-focus" aria-label="Focus areas" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Grant description and objectives..." rows={3} data-testid="input-grant-description" aria-label="Grant description" />
          </div>
          <div>
            <label className="text-sm font-medium">Eligibility Criteria</label>
            <Textarea value={formData.eligibilityCriteria} onChange={e => setFormData(p => ({ ...p, eligibilityCriteria: e.target.value }))} placeholder="Who can apply, requirements..." rows={2} data-testid="input-grant-eligibility" aria-label="Eligibility criteria" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={!formData.title || createMutation.isPending} data-testid="button-submit-grant" aria-label="Save grant opportunity">
              {createMutation.isPending ? "Saving..." : "Save & Analyze Fit"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)} data-testid="button-cancel-grant" aria-label="Cancel">Cancel</Button>
          </div>
        </Card>
      )}

      {alignmentReport?.capabilities && (
        <Card className="p-6" data-testid="card-platform-capabilities">
          <h2 className="font-semibold text-lg mb-4">Platform Capabilities for Grant Alignment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(alignmentReport.capabilities as any[]).map((cap: any) => (
              <div key={cap.area} className="flex items-start gap-3 p-3 rounded-lg border">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">{cap.area}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {cap.features.map((f: string) => (
                      <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="font-semibold text-lg" data-testid="text-grants-list-heading">Grant Opportunities</h2>
        {grantsError ? (
          <Card className="p-6 text-center" data-testid="card-grants-error">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <p className="font-medium">Failed to load grants</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()} data-testid="button-retry-grants" aria-label="Retry loading grants">Retry</Button>
          </Card>
        ) : isLoading ? (
          <Card className="p-8 text-center text-muted-foreground">Loading grants...</Card>
        ) : grants.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground" data-testid="card-no-grants">
            <Target className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No grant opportunities added yet.</p>
            <p className="text-sm mt-1">Click "Add Grant" to track a new opportunity.</p>
          </Card>
        ) : (
          grants.map(grant => (
            <Card key={grant.id} className="p-5" data-testid={`card-grant-${grant.id}`}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold">{grant.title}</h3>
                    <FitScoreBadge score={grant.fitScore} />
                    <StatusBadge status={grant.status} />
                  </div>
                  {grant.agency && <p className="text-sm text-muted-foreground">{grant.agency}</p>}
                  {grant.fundingAmount && <p className="text-sm font-medium text-primary mt-1">{grant.fundingAmount}</p>}
                  {grant.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{grant.description}</p>}
                  {grant.focusAreas && (grant.focusAreas as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(grant.focusAreas as string[]).map(area => (
                        <Badge key={area} variant="secondary" className="text-xs">{area}</Badge>
                      ))}
                    </div>
                  )}
                  {grant.readinessChecklist && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Readiness ({(grant.readinessChecklist as any[]).filter((c: any) => c.status === "ready").length}/{(grant.readinessChecklist as any[]).length} criteria met)</p>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-emerald-600 h-2 rounded-full transition-all" style={{ width: `${((grant.readinessChecklist as any[]).filter((c: any) => c.status === "ready").length / (grant.readinessChecklist as any[]).length) * 100}%` }} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {grant.sourceUrl && (
                    <a href={grant.sourceUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" aria-label="View source" data-testid={`button-grant-link-${grant.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                  <Button variant="outline" size="icon" onClick={() => deleteMutation.mutate(grant.id)} aria-label="Delete grant" data-testid={`button-delete-grant-${grant.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
