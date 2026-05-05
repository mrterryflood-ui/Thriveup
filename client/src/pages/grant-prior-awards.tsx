import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, AlertCircle, ExternalLink, BookOpen, Search, FileSearch, Plus, Trash2 } from "lucide-react";

interface PriorAwardLink {
  title: string;
  url: string;
  pattern?: string;
}

interface ProposalRow {
  id: string;
  priority: number;
  deadline: string | null;
  data: any;
  priorAwardsReviewed: boolean;
  priorAwardsCount: number;
  priorAwardsNotes: string | null;
  priorAwardsLinks: PriorAwardLink[] | null;
  priorAwardsReviewedAt: string | null;
}

interface SummaryResponse {
  proposals: ProposalRow[];
  summary: {
    total: number;
    reviewed: number;
    notReviewed: number;
    meetingThreshold: number;
    percentReviewed: number;
  };
}

const RESEARCH_SOURCES = [
  { name: "NSF Award Search", url: "https://www.nsf.gov/awardsearch/", desc: "All NSF awards by program/year/keyword" },
  { name: "NIH RePORTER", url: "https://reporter.nih.gov/", desc: "NIH funded grants by PA/PAR/RFA, mechanism, IC" },
  { name: "USASpending.gov", url: "https://www.usaspending.gov/", desc: "All federal awards by agency/program/CFDA" },
  { name: "SAM.gov", url: "https://sam.gov/", desc: "Active opportunities + awarded contracts" },
  { name: "sbir.gov", url: "https://www.sbir.gov/sbirsearch/award/all", desc: "SBIR/STTR Phase I and Phase II awards" },
  { name: "CDMRP Funded Awards", url: "https://cdmrp.health.mil/search.aspx", desc: "DoD CDMRP awards by program" },
  { name: "Grants.gov Award History", url: "https://www.grants.gov/", desc: "Federal grant awards (linked from opps)" },
];

export default function GrantPriorAwardsPage() {
  const { toast } = useToast();
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<SummaryResponse>({
    queryKey: ["/api/proposal-pipeline/prior-awards/summary"],
  });

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6" data-testid="page-grant-prior-awards">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileSearch className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Prior Award Research</h1>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          The single best thing to do before writing a proposal is read 20-30 prior award abstracts in
          the same program. Program offices have an unwritten theory of what they fund. The solicitation
          tells you what they say they fund; prior awards show what they actually fund.
          <span className="block mt-1 text-xs">
            Source: Robert Tabbara, Federal Capture Strategist (LinkedIn, May 4, 2026).
          </span>
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total Pursuits" value={data?.summary.total ?? "—"} testid="stat-total" />
        <SummaryCard label="Research Done" value={data?.summary.reviewed ?? "—"} testid="stat-reviewed" />
        <SummaryCard label="≥20 Abstracts Read" value={data?.summary.meetingThreshold ?? "—"} testid="stat-threshold" />
        <SummaryCard label="% Reviewed" value={data ? `${data.summary.percentReviewed}%` : "—"} testid="stat-percent" />
      </div>

      {/* What to look for */}
      <Card data-testid="card-methodology">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> What to look for in prior awards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Tech maturity (TRL):</strong> early-stage or near-ready prototypes?</li>
            <li><strong>Problem framing:</strong> mission-, capability-, or technology-focused?</li>
            <li><strong>Language &amp; vocabulary:</strong> mirror the program office's words.</li>
            <li><strong>Company profile:</strong> university spinouts, small businesses, first-time applicants?</li>
            <li><strong>Abstract length &amp; depth:</strong> how technical, how specific?</li>
            <li><strong>What does NOT get funded:</strong> if 30 abstracts look nothing like yours, the program is wrong OR your framing must shift.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Research sources */}
      <Card data-testid="card-sources">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" /> Free public award databases
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {RESEARCH_SOURCES.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 border rounded-md hover-elevate"
              data-testid={`link-source-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              aria-label={`Open ${s.name} in a new tab`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{s.name}</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
            </a>
          ))}
        </CardContent>
      </Card>

      {/* Pursuit list */}
      <Card data-testid="card-pursuits">
        <CardHeader>
          <CardTitle>Active pursuits — research status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !data?.proposals.length ? (
            <p className="text-sm text-muted-foreground">No proposals in pipeline.</p>
          ) : (
            <div className="space-y-2">
              {data.proposals.map((p) => (
                <ProposalRow
                  key={p.id}
                  proposal={p}
                  open={openId === p.id}
                  onOpenChange={(v) => setOpenId(v ? p.id : null)}
                  onSaved={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/proposal-pipeline/prior-awards/summary"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/proposal-pipeline"] });
                    toast({ title: "Saved", description: "Prior-awards research updated." });
                    setOpenId(null);
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value, testid }: { label: string; value: any; testid: string }) {
  return (
    <Card data-testid={`card-${testid}`}>
      <CardContent className="p-4">
        <div className="text-xs uppercase text-muted-foreground tracking-wide">{label}</div>
        <div className="text-3xl font-bold mt-1" data-testid={`text-${testid}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function ProposalRow({
  proposal, open, onOpenChange, onSaved,
}: {
  proposal: ProposalRow;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const title = proposal.data?.shortTitle || proposal.data?.title || proposal.id;
  const agency = proposal.data?.agency || "—";
  const deadlineLabel = proposal.data?.deadlineLabel || (proposal.deadline ? new Date(proposal.deadline).toLocaleDateString() : "—");

  const [reviewed, setReviewed] = useState(proposal.priorAwardsReviewed);
  const [count, setCount] = useState(proposal.priorAwardsCount);
  const [notes, setNotes] = useState(proposal.priorAwardsNotes ?? "");
  const [links, setLinks] = useState<PriorAwardLink[]>(proposal.priorAwardsLinks ?? []);

  const mutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/proposal-pipeline/${proposal.id}/prior-awards`, {
        priorAwardsReviewed: reviewed,
        priorAwardsCount: count,
        priorAwardsNotes: notes || null,
        priorAwardsLinks: links.length ? links : null,
      });
    },
    onSuccess: onSaved,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-full text-left p-3 border rounded-md hover-elevate flex items-center gap-3"
          data-testid={`row-pursuit-${proposal.id}`}
        >
          {proposal.priorAwardsReviewed ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" data-testid={`icon-reviewed-${proposal.id}`} />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" data-testid={`icon-pending-${proposal.id}`} />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate" data-testid={`text-title-${proposal.id}`}>{title}</div>
            <div className="text-xs text-muted-foreground truncate">{agency} · Deadline: {deadlineLabel}</div>
          </div>
          <Badge variant={proposal.priorAwardsCount >= 20 ? "default" : "secondary"} data-testid={`badge-count-${proposal.id}`}>
            {proposal.priorAwardsCount} read
          </Badge>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid={`text-dialog-title-${proposal.id}`}>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`reviewed-${proposal.id}`}
              checked={reviewed}
              onCheckedChange={(v) => setReviewed(!!v)}
              data-testid={`checkbox-reviewed-${proposal.id}`}
            />
            <Label htmlFor={`reviewed-${proposal.id}`}>Prior award research complete</Label>
          </div>
          <div>
            <Label htmlFor={`count-${proposal.id}`}>Number of abstracts read (target: 20–30)</Label>
            <Input
              id={`count-${proposal.id}`}
              type="number"
              min={0}
              value={count}
              onChange={(e) => setCount(Math.max(0, parseInt(e.target.value) || 0))}
              data-testid={`input-count-${proposal.id}`}
            />
          </div>
          <div>
            <Label htmlFor={`notes-${proposal.id}`}>Pattern notes (TRL, framing, vocabulary, company type)</Label>
            <Textarea
              id={`notes-${proposal.id}`}
              rows={6}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Most awards are TRL 4-6, capability-focused framing, 5-8yr small businesses with 1+ prior NSF award. Common keywords: 'broadening participation', 'research-validated', 'evidence-based'."
              data-testid={`textarea-notes-${proposal.id}`}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Linked prior awards</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setLinks([...links, { title: "", url: "", pattern: "" }])}
                data-testid={`button-add-link-${proposal.id}`}
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {links.map((l, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-start" data-testid={`row-link-${proposal.id}-${idx}`}>
                  <Input
                    className="col-span-3"
                    placeholder="Award title"
                    value={l.title}
                    onChange={(e) => setLinks(links.map((x, i) => i === idx ? { ...x, title: e.target.value } : x))}
                    data-testid={`input-link-title-${proposal.id}-${idx}`}
                  />
                  <Input
                    className="col-span-4"
                    placeholder="URL"
                    value={l.url}
                    onChange={(e) => setLinks(links.map((x, i) => i === idx ? { ...x, url: e.target.value } : x))}
                    data-testid={`input-link-url-${proposal.id}-${idx}`}
                  />
                  <Input
                    className="col-span-4"
                    placeholder="Pattern observed"
                    value={l.pattern ?? ""}
                    onChange={(e) => setLinks(links.map((x, i) => i === idx ? { ...x, pattern: e.target.value } : x))}
                    data-testid={`input-link-pattern-${proposal.id}-${idx}`}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setLinks(links.filter((_, i) => i !== idx))}
                    data-testid={`button-remove-link-${proposal.id}-${idx}`}
                    aria-label="Remove link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {links.length === 0 && <p className="text-xs text-muted-foreground">No prior awards linked yet.</p>}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid={`button-cancel-${proposal.id}`}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            data-testid={`button-save-${proposal.id}`}
          >
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
