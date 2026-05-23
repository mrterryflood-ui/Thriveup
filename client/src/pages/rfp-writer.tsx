import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAutosave } from "@/hooks/use-autosave";
import { AutosaveStatusPill } from "@/components/autosave-status";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Sparkles, ShieldCheck, Building2, AlertCircle, Trash2, Download } from "lucide-react";

type RfpDoc = { id: string; orgId: string; grantId?: string | null; title: string; kind: "base" | "amendment" | "qa"; version: number; parsedText: string; uploadedAt: string };
type Rubric = { sections: Array<{ name: string; pointValue?: number; requirements: string[]; headingPattern?: string; toneNotes?: string }>; pageLimit?: string; wordLimit?: string; submissionFormat?: string; totalPoints?: number; notes?: string };
type DraftSection = { sectionName: string; pointValue?: number; body: string };
type Draft = { sections: DraftSection[]; complianceNotes: string };
type Coverage = { rows: Array<{ sectionName: string; pointValue?: number; covered: boolean; evidenceCited: boolean; weakSignals: string[] }>; overallScore: number };
type AgencyIntel = { agencyName: string; typicalAwardSize?: string; whatTheyFund?: string; languagePatterns?: string[]; recentWinners?: Array<{ recipient: string; project?: string; amount?: number; year?: number }> };

function useQueryParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

export default function RfpWriterPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const grantIdParam = useQueryParam("grantId");

  const { data: orgData, isLoading: orgLoading } = useQuery<{ organization: { id: string; name: string } | null }>({ queryKey: ["/api/me/organization"] });
  const org = orgData?.organization;
  useEffect(() => {
    if (!orgLoading && !org) setLocation("/onboarding/org");
  }, [orgLoading, org, setLocation]);

  const { data: docsData, refetch: refetchDocs } = useQuery<{ documents: RfpDoc[] }>({ queryKey: ["/api/me/rfp-documents"], enabled: !!org });
  const docs = docsData?.documents ?? [];

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [agencyIntel, setAgencyIntel] = useState<AgencyIntel | null>(null);

  const [uploadForm, setUploadForm] = useState({ title: "", kind: "base" as "base"|"amendment"|"qa", version: 1, parsedText: "", grantId: grantIdParam || "" });

  // Autosave the RFP paste (the biggest "lose-on-navigate" pain): users
  // paste 50+ pages of RFP text here. Scope per-grant so each RFP has
  // its own draft slot.
  const autosave = useAutosave<{ uploadForm: typeof uploadForm }>({
    editorKind: "rfp_writer",
    scopeKey: grantIdParam || "default",
    value: { uploadForm },
    onHydrate: (saved) => {
      if (saved?.uploadForm) setUploadForm(saved.uploadForm);
    },
    shouldSave: (v) => v.uploadForm.parsedText.length > 0 || v.uploadForm.title.length > 0,
  });

  const upload = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/me/rfp-documents", {
        title: uploadForm.title,
        kind: uploadForm.kind,
        version: uploadForm.version,
        parsedText: uploadForm.parsedText,
        grantId: uploadForm.grantId || null,
      });
      return res.json();
    },
    onSuccess: (data: { document: RfpDoc }) => {
      setUploadForm({ ...uploadForm, title: "", parsedText: "" });
      setSelectedDocId(data.document.id);
      refetchDocs();
      toast({ title: "Document uploaded" });
    },
    onError: (e: Error) => toast({ title: "Upload failed", description: e.message, variant: "destructive" }),
  });

  const onFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    setUploadForm({ ...uploadForm, parsedText: text, title: uploadForm.title || file.name });
  };

  const extractRubric = useMutation({
    mutationFn: async (docId: string) => {
      const res = await apiRequest("GET", `/api/me/rfp-documents/${docId}/rubric`);
      return res.json();
    },
    onSuccess: (data: { rubric: Rubric }) => {
      setRubric(data.rubric);
      toast({ title: `Rubric extracted (${data.rubric.sections.length} sections)` });
    },
    onError: (e: Error) => toast({ title: "Extraction failed", description: e.message, variant: "destructive" }),
  });

  const generateDraft = useMutation({
    mutationFn: async () => {
      if (!selectedDocId) throw new Error("Select an RFP first");
      const res = await apiRequest("POST", "/api/me/grant-narratives/generate", { documentId: selectedDocId, grantId: grantIdParam || undefined });
      return res.json();
    },
    onSuccess: (data: { draft: Draft; rubric: Rubric; agencyIntel: AgencyIntel | null }) => {
      setDraft(data.draft);
      setRubric(data.rubric);
      setAgencyIntel(data.agencyIntel);
      setCoverage(null);
      toast({ title: "Draft generated", description: `${data.draft.sections.length} sections mirroring the RFP.` });
    },
    onError: (e: Error) => toast({ title: "Draft failed", description: e.message, variant: "destructive" }),
  });

  const scoreDraft = useMutation({
    mutationFn: async () => {
      if (!selectedDocId || !draft) throw new Error("Generate a draft first");
      const res = await apiRequest("POST", "/api/me/grant-narratives/score", { documentId: selectedDocId, draft });
      return res.json();
    },
    onSuccess: (data: { coverage: Coverage }) => {
      setCoverage(data.coverage);
      toast({ title: `Estimated reviewer score: ${data.coverage.overallScore}/100` });
    },
    onError: (e: Error) => toast({ title: "Scoring failed", description: e.message, variant: "destructive" }),
  });

  const deleteDoc = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/me/rfp-documents/${id}`),
    onSuccess: () => { refetchDocs(); if (selectedDocId) setSelectedDocId(null); },
  });

  const exportDraft = () => {
    if (!draft) return;
    const md = draft.sections.map(s => `# ${s.sectionName}${s.pointValue ? ` (${s.pointValue} pts)` : ""}\n\n${s.body}\n`).join("\n---\n\n") + `\n\n## Compliance notes\n${draft.complianceNotes}`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "grant-draft.md"; a.click(); URL.revokeObjectURL(url);
  };

  if (orgLoading) return <div className="container max-w-6xl mx-auto py-10 px-4">Loading…</div>;

  return (
    <div className="container max-w-6xl mx-auto py-10 px-4 space-y-6">
      <div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title"><FileText className="w-7 h-7" /> RFP-driven grant writer</h1>
          <AutosaveStatusPill status={autosave.status} lastSavedAt={autosave.lastSavedAt} />
        </div>
        <p className="text-muted-foreground mt-1">Upload the solicitation. The writer mirrors the RFP's exact sections, tone, and language — and pulls agency intelligence from USASpending so your draft sounds like work the agency actually funds.</p>
        {org && <Badge variant="outline" className="mt-2"><Building2 className="w-3 h-3 mr-1" /> Writing as {org.name}</Badge>}
      </div>

      <Tabs defaultValue="upload">
        <TabsList>
          <TabsTrigger value="upload" data-testid="tab-upload">1. RFP documents</TabsTrigger>
          <TabsTrigger value="rubric" data-testid="tab-rubric">2. Rubric</TabsTrigger>
          <TabsTrigger value="draft" data-testid="tab-draft">3. Draft</TabsTrigger>
          <TabsTrigger value="review" data-testid="tab-review">4. Review</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Upload an RFP, amendment, or Q&A</CardTitle><CardDescription>Plain text or .txt files. PDFs: paste the text (PDF parsing will come from the grant page in a later release). Amendments and Q&A override the base RFP on conflicts.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1"><Label>Title</Label><Input data-testid="input-doc-title" value={uploadForm.title} onChange={e => setUploadForm({...uploadForm, title: e.target.value})} placeholder="e.g., SSG Fox FY27 NOFO" /></div>
                <div className="space-y-1">
                  <Label>Kind</Label>
                  <Select value={uploadForm.kind} onValueChange={v => setUploadForm({...uploadForm, kind: v as any})}>
                    <SelectTrigger data-testid="select-doc-kind"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="base">Base RFP / NOFO</SelectItem>
                      <SelectItem value="amendment">Amendment</SelectItem>
                      <SelectItem value="qa">Q&A / FAQ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Version</Label><Input type="number" data-testid="input-doc-version" value={uploadForm.version} onChange={e => setUploadForm({...uploadForm, version: Number(e.target.value)})} /></div>
              </div>
              <div className="space-y-1">
                <Label>Upload .txt or paste text</Label>
                <Input type="file" accept=".txt,.md,text/plain" onChange={e => onFile(e.target.files?.[0] || null)} data-testid="input-doc-file" />
                <Textarea rows={8} data-testid="textarea-doc-text" value={uploadForm.parsedText} onChange={e => setUploadForm({...uploadForm, parsedText: e.target.value})} placeholder="Or paste the RFP text here…" />
              </div>
              <Button onClick={() => upload.mutate()} disabled={upload.isPending || !uploadForm.title || !uploadForm.parsedText} data-testid="button-upload">
                <Upload className="w-4 h-4 mr-2" /> {upload.isPending ? "Uploading…" : "Upload"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Your documents</CardTitle></CardHeader>
            <CardContent>
              {docs.length === 0 ? (
                <div className="text-muted-foreground text-sm py-6">No documents yet. Upload an RFP to get started.</div>
              ) : (
                <div className="space-y-2">
                  {docs.map(d => (
                    <div key={d.id} className={`border rounded-lg p-3 flex items-center justify-between ${selectedDocId === d.id ? "border-primary bg-primary/5" : ""}`} data-testid={`row-doc-${d.id}`}>
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">{d.title}<Badge variant="outline" className="text-xs">{d.kind}{d.kind !== "base" ? ` v${d.version}` : ""}</Badge></div>
                        <div className="text-xs text-muted-foreground">{d.parsedText.length.toLocaleString()} chars · {new Date(d.uploadedAt).toLocaleDateString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant={selectedDocId === d.id ? "default" : "outline"} onClick={() => setSelectedDocId(d.id)} data-testid={`button-select-${d.id}`}>Select</Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteDoc.mutate(d.id)} data-testid={`button-delete-${d.id}`}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rubric" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evaluation rubric</CardTitle>
              <CardDescription>Pulled directly from the RFP. Reviewers score against this — the draft mirrors every section name and tone cue.</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedDocId ? (
                <div className="text-muted-foreground text-sm">Select an RFP document first.</div>
              ) : !rubric ? (
                <Button onClick={() => extractRubric.mutate(selectedDocId)} disabled={extractRubric.isPending} data-testid="button-extract-rubric">
                  <Sparkles className="w-4 h-4 mr-2" /> {extractRubric.isPending ? "Extracting…" : "Extract rubric"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 text-sm">
                    {rubric.totalPoints && <Badge>Total: {rubric.totalPoints} pts</Badge>}
                    {rubric.pageLimit && <Badge variant="outline">Pages: {rubric.pageLimit}</Badge>}
                    {rubric.wordLimit && <Badge variant="outline">Words: {rubric.wordLimit}</Badge>}
                    {rubric.submissionFormat && <Badge variant="outline">Submit: {rubric.submissionFormat}</Badge>}
                  </div>
                  {rubric.notes && <div className="rounded border p-3 text-sm bg-muted/30"><AlertCircle className="w-4 h-4 inline mr-1" />{rubric.notes}</div>}
                  <div className="space-y-2">
                    {rubric.sections.map((s, i) => (
                      <div key={i} className="border rounded p-3" data-testid={`section-${i}`}>
                        <div className="font-semibold flex items-center gap-2">{s.headingPattern || s.name}{s.pointValue && <Badge variant="secondary">{s.pointValue} pts</Badge>}</div>
                        {s.requirements.length > 0 && <ul className="text-sm text-muted-foreground mt-1 list-disc list-inside">{s.requirements.map((r, j) => <li key={j}>{r}</li>)}</ul>}
                        {s.toneNotes && <div className="text-xs italic mt-2">Tone: {s.toneNotes}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate draft</CardTitle>
              <CardDescription>The writer reads your org profile, the rubric, and the agency's recent winners — then drafts section by section.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => generateDraft.mutate()} disabled={generateDraft.isPending || !selectedDocId} data-testid="button-generate-draft">
                <Sparkles className="w-4 h-4 mr-2" /> {generateDraft.isPending ? "Drafting (this takes a minute)…" : "Generate draft from RFP"}
              </Button>
              {agencyIntel && (
                <div className="border rounded p-3 bg-muted/30 text-sm space-y-1" data-testid="block-agency-intel">
                  <div className="font-semibold">Agency intelligence: {agencyIntel.agencyName}</div>
                  {agencyIntel.typicalAwardSize && <div>Typical award: {agencyIntel.typicalAwardSize}</div>}
                  {agencyIntel.whatTheyFund && <div className="italic">{agencyIntel.whatTheyFund}</div>}
                  {agencyIntel.languagePatterns && agencyIntel.languagePatterns.length > 0 && (
                    <div>Winning-language patterns: {agencyIntel.languagePatterns.map((p, i) => <Badge key={i} variant="outline" className="mr-1 mb-1">{p}</Badge>)}</div>
                  )}
                </div>
              )}
              {draft && (
                <div className="space-y-3 mt-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={exportDraft} data-testid="button-export"><Download className="w-3 h-3 mr-1" /> Export markdown</Button>
                  </div>
                  {draft.sections.map((s, i) => (
                    <Card key={i} data-testid={`draft-section-${i}`}>
                      <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2">{s.sectionName}{s.pointValue && <Badge variant="secondary">{s.pointValue} pts</Badge>}</CardTitle></CardHeader>
                      <CardContent>
                        <Textarea rows={Math.min(20, Math.max(6, Math.ceil(s.body.length / 80)))} value={s.body} onChange={e => {
                          const next = { ...draft, sections: draft.sections.map((x, j) => j === i ? { ...x, body: e.target.value } : x) };
                          setDraft(next);
                        }} data-testid={`textarea-section-${i}`} />
                      </CardContent>
                    </Card>
                  ))}
                  {draft.complianceNotes && (
                    <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Compliance to-dos</CardTitle></CardHeader><CardContent className="text-sm">{draft.complianceNotes}</CardContent></Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Score draft against rubric</CardTitle><CardDescription>Simulates a hostile reviewer reading your draft section-by-section.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => scoreDraft.mutate()} disabled={scoreDraft.isPending || !draft} data-testid="button-score">
                <ShieldCheck className="w-4 h-4 mr-2" /> {scoreDraft.isPending ? "Scoring…" : "Score this draft"}
              </Button>
              {coverage && (
                <div className="space-y-3">
                  <div className="text-3xl font-bold" data-testid="text-overall-score">Estimated score: {coverage.overallScore} / 100</div>
                  <div className="space-y-2">
                    {coverage.rows.map((r, i) => (
                      <div key={i} className="border rounded p-3" data-testid={`coverage-row-${i}`}>
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{r.sectionName}{r.pointValue && <span className="text-xs text-muted-foreground ml-2">({r.pointValue} pts)</span>}</div>
                          <div className="flex gap-1">
                            <Badge variant={r.covered ? "default" : "destructive"}>{r.covered ? "Covered" : "Gap"}</Badge>
                            <Badge variant={r.evidenceCited ? "default" : "outline"}>{r.evidenceCited ? "Evidence" : "No evidence"}</Badge>
                          </div>
                        </div>
                        {r.weakSignals.length > 0 && <div className="text-sm text-muted-foreground mt-2">⚠ {r.weakSignals.join(" · ")}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
