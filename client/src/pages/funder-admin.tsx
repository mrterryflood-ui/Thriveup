/**
 * /funder-dashboard — Staff admin page for managing funder dashboards.
 * Lists all funders, lets staff create new ones, copy share links.
 * Requires staff/admin role.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Copy, ExternalLink, BarChart3, DollarSign, Users } from "lucide-react";

interface FunderSummary {
  id: string;
  name: string;
  type: string;
  shareToken: string;
  dashboardUrl: string;
  createdAt: string;
  stats: {
    total: number;
    enrolled: number;
    valueUnlocked: number;
  };
}

const FUNDER_TYPES = [
  { value: "foundation", label: "Foundation" },
  { value: "hospital", label: "Hospital Community Benefit" },
  { value: "united_way", label: "United Way" },
  { value: "government", label: "Government" },
  { value: "corporate", label: "Corporate" },
  { value: "other", label: "Other" },
];

export default function FunderAdminPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("foundation");

  const { data, isLoading } = useQuery<{ funders: FunderSummary[] }>({
    queryKey: ["/api/funder/list"],
    queryFn: async () => {
      const res = await fetch("/api/funder/list");
      if (!res.ok) throw new Error("Failed to load funders");
      return res.json();
    },
  });

  const create = useMutation({
    mutationFn: async ({ name, type }: { name: string; type: string }) => {
      const res = await fetch("/api/funder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error ?? "Failed to create funder");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/funder/list"] });
      setOpen(false);
      setName("");
      setType("foundation");
      toast({ title: "Funder created", description: "Share the dashboard link with the funder." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  function copyLink(token: string) {
    const url = `${window.location.origin}/funder/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "Link copied", description: "Send this to the funder's program officer." });
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-background p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100">Funder Dashboards</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Each funder gets a private, token-gated impact dashboard showing referrals, enrollments,
            and estimated annual value unlocked.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Funder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Funder Dashboard</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium block mb-1">Funder name</label>
                <Input
                  placeholder="e.g. St. David's Foundation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Funder type</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FUNDER_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                disabled={!name.trim() || create.isPending}
                onClick={() => create.mutate({ name: name.trim(), type })}
              >
                {create.isPending ? "Creating…" : "Create Dashboard"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Funder list */}
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : !data?.funders?.length ? (
        <Card className="bg-muted/30">
          <CardContent className="pt-8 text-center text-muted-foreground">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium mb-1">No funder dashboards yet</p>
            <p className="text-sm">Click "New Funder" to create the first one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.funders.map((f) => (
            <Card key={f.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-semibold text-base truncate">{f.name}</h2>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {FUNDER_TYPES.find((t) => t.value === f.type)?.label ?? f.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(f.createdAt).toLocaleDateString()}
                    </p>

                    {/* Stats row */}
                    <div className="flex gap-6 mt-3">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Users className="h-3.5 w-3.5 text-blue-500" />
                        <span className="font-semibold">{f.stats.total}</span>
                        <span className="text-muted-foreground">referrals</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <BarChart3 className="h-3.5 w-3.5 text-green-500" />
                        <span className="font-semibold text-green-600">{f.stats.enrolled}</span>
                        <span className="text-muted-foreground">enrolled</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="font-semibold text-emerald-600">
                          ${(f.stats.valueUnlocked || 0).toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">value</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => copyLink(f.shareToken)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      asChild
                    >
                      <a href={`/funder/${f.shareToken}`} target="_blank" rel="noopener">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reference: how referrals get linked */}
      <Card className="mt-8 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Linking referrals to a funder
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <p>
            When a CHW submits a referral, include{" "}
            <code className="bg-white/60 dark:bg-black/30 px-1 rounded">funderId</code> in the
            POST body (e.g. from the screening intake form) to tie it to a funder's dashboard.
          </p>
          <p>
            Enrollment confirmations come in via{" "}
            <code className="bg-white/60 dark:bg-black/30 px-1 rounded">
              PATCH /api/referrals/:id/outcome
            </code>{" "}
            and automatically roll up to the funder view.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
