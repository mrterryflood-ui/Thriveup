import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UppyFile } from "@uppy/core";
import { FileText, Trash2, Download, Building2, Upload, Info, Link2, Copy } from "lucide-react";

type OrgDoc = {
  id: string;
  affiliateName: string;
  kind: string;
  title: string;
  fileUrl: string;
  fileName?: string | null;
  fileSize?: number | null;
  contentType?: string | null;
  notes?: string | null;
  uploadedAt: string;
};

const SUGGESTED_AFFILIATES = [
  "Hargrave Innovative Solutions (HIS)",
  "Love Clinic & Med Spa",
  "Vanntastic Solutions LLC",
  "Sistahs Can We Talk Inc.",
  "The Collaborative Advocate Foundation (TCAF)",
  "ISS LLC",
];

const KIND_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "capability_statement", label: "Capability Statement" },
  { value: "501c3_letter", label: "501(c)(3) Determination Letter" },
  { value: "w9", label: "W-9" },
  { value: "insurance_cert", label: "Insurance Certificate (COI)" },
  { value: "past_performance", label: "Past Performance Writeup" },
  { value: "resume_bio", label: "Resume / Bio" },
  { value: "audited_financials", label: "Audited Financials / 990" },
  { value: "sam_registration", label: "SAM.gov Registration Confirmation" },
  { value: "license_credential", label: "License / Credential" },
  { value: "moa_mou", label: "MOA / MOU" },
  { value: "policies", label: "Policies & Procedures" },
  { value: "other", label: "Other" },
];

function kindLabel(value: string) {
  return KIND_OPTIONS.find(k => k.value === value)?.label ?? value;
}

function formatBytes(n: number | null | undefined) {
  if (!n || n <= 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function OrgDocumentsLibraryPage() {
  const { toast } = useToast();
  // Maps the signed upload URL to the canonical `/objects/...` object path so
  // we can persist the served path (not the expiring signed URL) when Uppy reports completion.
  const objectPathByUploadURL = useRef<Map<string, string>>(new Map());

  const getUploadParameters = useCallback(
    async (file: UppyFile<Record<string, unknown>, Record<string, unknown>>) => {
      const response = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        }),
      });
      if (!response.ok) throw new Error("Failed to get upload URL");
      const data = (await response.json()) as { uploadURL: string; objectPath: string };
      objectPathByUploadURL.current.set(data.uploadURL, data.objectPath);
      return {
        method: "PUT" as const,
        url: data.uploadURL,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      };
    },
    [],
  );

  const [affiliateName, setAffiliateName] = useState<string>(SUGGESTED_AFFILIATES[0]);
  const [customAffiliate, setCustomAffiliate] = useState("");
  const [kind, setKind] = useState<string>("capability_statement");
  const [notes, setNotes] = useState("");
  const [filterAffiliate, setFilterAffiliate] = useState<string>("__all__");
  const [filterKind, setFilterKind] = useState<string>("__all__");

  const effectiveAffiliate = (customAffiliate.trim() || affiliateName).trim();

  const { data, isLoading } = useQuery<{ documents: OrgDoc[] }>({ queryKey: ["/api/me/org-documents"] });
  const docs = data?.documents ?? [];

  const knownAffiliates = useMemo(() => {
    const set = new Set<string>(SUGGESTED_AFFILIATES);
    docs.forEach(d => set.add(d.affiliateName));
    return Array.from(set);
  }, [docs]);

  const filtered = docs.filter(d =>
    (filterAffiliate === "__all__" || d.affiliateName === filterAffiliate) &&
    (filterKind === "__all__" || d.kind === filterKind)
  );

  const grouped = useMemo(() => {
    const map = new Map<string, OrgDoc[]>();
    filtered.forEach(d => {
      if (!map.has(d.affiliateName)) map.set(d.affiliateName, []);
      map.get(d.affiliateName)!.push(d);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const bulkRegister = useMutation({
    mutationFn: async (payload: { files: Array<{ title: string; fileUrl: string; fileName?: string; fileSize?: number; contentType?: string }> }) => {
      const res = await apiRequest("POST", "/api/me/org-documents/bulk", {
        affiliateName: effectiveAffiliate,
        kind,
        notes: notes.trim() || undefined,
        files: payload.files,
      });
      return res.json();
    },
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/org-documents"] });
      const n = resp?.documents?.length ?? 0;
      toast({ title: `Uploaded ${n} document${n === 1 ? "" : "s"}`, description: `Filed under ${effectiveAffiliate} → ${kindLabel(kind)}.` });
      setNotes("");
      setCustomAffiliate("");
    },
    onError: (e: Error) => {
      const msg = (e.message || "").toLowerCase();
      if (msg.includes("401") || msg.includes("unauthor")) {
        toast({ title: "Sign in required", description: "Sign in to upload documents to your library.", variant: "destructive" });
      } else if (msg.includes("403") || msg.includes("organization")) {
        toast({ title: "Organization profile required", description: "Create your org profile first.", variant: "destructive" });
      } else {
        toast({ title: "Save failed", description: e.message, variant: "destructive" });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/me/org-documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/org-documents"] });
      toast({ title: "Document removed" });
    },
  });

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6" data-testid="org-documents-page">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Organization Document Library</h1>
        <p className="text-muted-foreground mt-1">
          One library, every affiliated entity. Upload capability statements, 501(c)(3) letters, W-9s, insurance certs,
          past-performance writeups, and credentials — tag each by which entity (HIS, Love Clinic, Vanntastic, Sistahs CWT, TCAF, etc.) it belongs to,
          and reuse across every proposal.
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>How this works</AlertTitle>
        <AlertDescription className="text-sm">
          Pick the entity + document kind, then drag-and-drop up to 20 files at once. Files upload directly to private
          object storage (signed URL flow) — never to our server. You can come back any time to add more or filter the library
          when assembling a teaming submission.
        </AlertDescription>
      </Alert>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Link2 className="h-4 w-4" /> Partners can do this themselves</CardTitle>
          <CardDescription className="text-sm">
            Each affiliated entity (HIS, Love Clinic, Vanntastic, Sistahs CWT, etc.) signs in with their own login,
            creates their org profile, and manages their own documents. Send them this link — fully hands-off:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-sm bg-background border rounded px-3 py-1.5 font-mono select-all" data-testid="text-partner-link">
              {typeof window !== "undefined" ? `${window.location.origin}/partners/join` : "/partners/join"}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  navigator.clipboard.writeText(`${window.location.origin}/partners/join`);
                  toast({ title: "Link copied", description: "Paste it in email, text, or Slack to your partners." });
                }
              }}
              data-testid="button-copy-partner-link"
            >
              <Copy className="h-3.5 w-3.5 mr-1" /> Copy
            </Button>
            <a href="/partners/join" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" data-testid="button-preview-partner-link">Preview →</Button>
            </a>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Bulk upload</CardTitle>
          <CardDescription>Set the entity + kind once, then drop multiple files. Each file becomes its own library entry.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Affiliated entity (who does this doc belong to?)</Label>
              <Select value={affiliateName} onValueChange={setAffiliateName}>
                <SelectTrigger data-testid="select-affiliate"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {knownAffiliates.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                placeholder="Or type a new entity name (overrides selection)"
                value={customAffiliate}
                onChange={e => setCustomAffiliate(e.target.value)}
                data-testid="input-custom-affiliate"
              />
            </div>
            <div className="space-y-2">
              <Label>Document kind</Label>
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger data-testid="select-kind"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KIND_OPTIONS.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes (optional — applies to every file in this batch)</Label>
            <Textarea
              placeholder="e.g., 'FY2026 capability statement — final approved version, supersedes 2025'"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              data-testid="input-notes"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <ObjectUploader
              maxNumberOfFiles={20}
              maxFileSize={50 * 1024 * 1024}
              onGetUploadParameters={getUploadParameters}
              onComplete={(result) => {
                const successful = result.successful ?? [];
                if (successful.length === 0) return;
                const files: Array<{ title: string; fileUrl: string; fileName?: string; fileSize?: number; contentType?: string }> = [];
                const skipped: string[] = [];
                successful.forEach(f => {
                  const uploadURL = (f.uploadURL as string | undefined) ?? "";
                  const objectPath = objectPathByUploadURL.current.get(uploadURL);
                  if (!objectPath || !objectPath.startsWith("/objects/")) {
                    skipped.push(f.name || "(unnamed file)");
                    return;
                  }
                  files.push({
                    title: f.name || "Untitled document",
                    fileUrl: objectPath,
                    fileName: f.name,
                    fileSize: typeof f.size === "number" ? f.size : undefined,
                    contentType: f.type || undefined,
                  });
                  objectPathByUploadURL.current.delete(uploadURL);
                });
                if (skipped.length > 0) {
                  toast({
                    title: `Skipped ${skipped.length} file${skipped.length === 1 ? "" : "s"}`,
                    description: `Upload completed but object path was missing — please re-upload: ${skipped.join(", ")}`,
                    variant: "destructive",
                  });
                }
                if (files.length > 0) bulkRegister.mutate({ files });
              }}
              buttonClassName=""
            >
              <span className="inline-flex items-center gap-2"><Upload className="h-4 w-4" /> Drop files / click to upload</span>
            </ObjectUploader>
            <span className="text-xs text-muted-foreground">
              Files will be filed as: <span className="font-medium text-foreground">{effectiveAffiliate || "—"}</span> · {kindLabel(kind)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Library</CardTitle>
          <CardDescription>{docs.length} document{docs.length === 1 ? "" : "s"} across {new Set(docs.map(d => d.affiliateName)).size} entit{new Set(docs.map(d => d.affiliateName)).size === 1 ? "y" : "ies"}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <Select value={filterAffiliate} onValueChange={setFilterAffiliate}>
              <SelectTrigger data-testid="select-filter-affiliate"><SelectValue placeholder="Filter by entity…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All entities</SelectItem>
                {Array.from(new Set(docs.map(d => d.affiliateName))).sort().map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterKind} onValueChange={setFilterKind}>
              <SelectTrigger data-testid="select-filter-kind"><SelectValue placeholder="Filter by kind…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All kinds</SelectItem>
                {KIND_OPTIONS.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading library…</p>
          ) : grouped.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 border border-dashed rounded-md" data-testid="empty-library">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No documents yet. Use the uploader above to start your library.</p>
            </div>
          ) : (
            grouped.map(([entity, items]) => (
              <div key={entity} className="space-y-2">
                <h3 className="font-semibold text-base flex items-center gap-2" data-testid={`group-${entity}`}>
                  <Building2 className="h-4 w-4 text-muted-foreground" /> {entity}
                  <Badge variant="secondary">{items.length}</Badge>
                </h3>
                <div className="space-y-1.5">
                  {items.map(d => (
                    <div key={d.id} className="flex items-center justify-between gap-3 border rounded-md px-3 py-2" data-testid={`row-doc-${d.id}`}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate" title={d.title}>{d.title}</span>
                          <Badge variant="outline" className="text-xs">{kindLabel(d.kind)}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
                          <span>{new Date(d.uploadedAt).toLocaleDateString()}</span>
                          {d.fileSize ? <span>{formatBytes(d.fileSize)}</span> : null}
                          {d.contentType ? <span>{d.contentType}</span> : null}
                          {d.notes ? <span className="italic truncate max-w-md" title={d.notes}>"{d.notes}"</span> : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a href={d.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" data-testid={`button-download-${d.id}`} title="Download / view">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Remove "${d.title}" from the library? The underlying file stays in object storage.`)) {
                              deleteMutation.mutate(d.id);
                            }
                          }}
                          data-testid={`button-delete-${d.id}`}
                          title="Remove from library"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
