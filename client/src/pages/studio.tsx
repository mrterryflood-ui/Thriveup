import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentOrgId } from "@/hooks/use-current-org";
import { CheckCircle2, Code2, Download, Eye, FileClock, Loader2, LockKeyhole, Send, ShieldCheck, Sparkles, Upload } from "lucide-react";

type JsonRecord = Record<string, unknown>;
interface StudioModule { moduleKey: string; key?: string; name?: string; title?: string; updatedAt?: string; publishedAt?: string; status?: string; manifest?: JsonRecord; version?: number; lifecycleStage?: string; }
interface ValidationResult { valid?: boolean; error?: JsonRecord; errors?: Array<string | JsonRecord>; warnings?: Array<string | JsonRecord>; message?: string; }
interface StudioCapability { moduleTypes?: string[]; fieldTypes?: string[]; actionTypes?: string[]; aiDrafting?: boolean; }

const asObject = (value: unknown): JsonRecord => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
const labelFor = (value: unknown, fallback: string) => typeof value === "string" && value.trim() ? value : fallback;
const readableIssue = (issue: string | JsonRecord) => typeof issue === "string" ? issue : labelFor(issue.message ?? issue.error ?? issue.path, "Validation issue");
const isStudioSeedFile = (value: unknown): value is { schemaVersion: 1; modules: JsonRecord[] } => {
  const candidate = asObject(value);
  return candidate.schemaVersion === 1
    && Array.isArray(candidate.modules)
    && candidate.modules.every((entry) => {
      const module = asObject(entry);
      const seedManifest = asObject(module.manifest);
      return typeof module.moduleKey === "string"
        && Number.isInteger(module.version)
        && ["draft", "published", "archived"].includes(String(module.lifecycleStage))
        && typeof module.public === "boolean"
        && seedManifest.moduleKey === module.moduleKey
        && seedManifest.lifecycleStage === module.lifecycleStage
        && seedManifest.public === module.public;
    });
};

function ManifestPreview({ manifest }: { manifest: JsonRecord }) {
  const title = labelFor(manifest.title ?? manifest.name, "Untitled module");
  const description = labelFor(manifest.description ?? manifest.summary, "No description has been provided.");
  const fields = Array.isArray(manifest.fields) ? manifest.fields.map(asObject) : [];
  const actions = Array.isArray(manifest.actions) ? manifest.actions.map(asObject) : [];
  const stages = Array.isArray(manifest.stages) ? manifest.stages.map(asObject) : [];
  const outputFormat = asObject(manifest.outputFormat);
  return (
    <section aria-label="Rendered manifest preview" data-testid="studio-rendered-preview" className="space-y-4">
      <div><h3 className="font-semibold">{title}</h3><p className="text-sm text-muted-foreground">{description}</p></div>
      {fields.length > 0 && <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Fields</p><div className="flex flex-wrap gap-2">{fields.map((field, index) => <Badge variant="secondary" key={`${labelFor(field.key, "field")}-${index}`}>{labelFor(field.label ?? field.key, `Field ${index + 1}`)}</Badge>)}</div></div>}
       {actions.length > 0 && <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Allowed actions</p><div className="flex flex-wrap gap-2">{actions.map((action, index) => <Badge variant="outline" key={`${labelFor(action.type, "action")}-${index}`}>{labelFor(action.label ?? action.type, `Action ${index + 1}`)}</Badge>)}</div></div>}
       {stages.length > 0 && <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Stages</p><ol className="space-y-1 text-sm">{stages.map((stage, index) => <li key={`${labelFor(stage.key, "stage")}-${index}`}><span className="font-medium">{index + 1}. {labelFor(stage.label, `Stage ${index + 1}`)}</span>{typeof stage.description === "string" && <span className="text-muted-foreground"> — {stage.description}</span>}</li>)}</ol></div>}
       {typeof outputFormat.format === "string" && <p className="text-xs text-muted-foreground">Output format: {outputFormat.format}</p>}
    </section>
  );
}

function InventoryImportCard() {
  const [source, setSource] = useState("");
  const [inventory, setInventory] = useState("");
  const [result, setResult] = useState<JsonRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(null); setResult(null);
    try {
      const parsed = JSON.parse(inventory);
      if (!Array.isArray(parsed) || parsed.length > 500) throw new Error("Inventory must be a JSON array of at most 500 files.");
      const files = parsed.map((entry, index) => {
        const item = asObject(entry);
        const path = typeof item.path === "string" ? item.path.trim() : "";
        const size = typeof item.size === "number" && Number.isFinite(item.size) && item.size >= 0 ? item.size : null;
        const language = typeof item.language === "string" ? item.language.trim().slice(0, 80) : undefined;
        if (!path || path.length > 500 || size === null) throw new Error(`File ${index + 1} must include a path and non-negative size.`);
        return { path, size, ...(language ? { language } : {}) };
      });
      if (files.reduce((total, file) => total + file.size, 0) > 5_000_000) throw new Error("Inventory cannot exceed 5MB of declared file sizes.");
      setBusy(true);
      const response = await apiRequest("POST", "/api/admin/studio/import-inventory", { sourceLabel: source.trim(), files });
      setResult(asObject(await response.json()));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Inventory import failed.");
    } finally { setBusy(false); }
  };
  const list = (key: string) => {
    const direct = result?.[key];
    const named = result?.[`${key}Files`];
    if (Array.isArray(direct)) return direct as unknown[];
    if (Array.isArray(named)) return named as unknown[];
    const items = Array.isArray(result?.items) ? result?.items.map(asObject) : [];
    return items.filter(item => item.classification === key);
  };
  const count = (key: string) => list(key).length || Number(asObject(result?.counts)[key] ?? result?.[`${key}Count`] ?? 0);
  return <Card data-testid="studio-import-inventory">
    <CardHeader><CardTitle>Safe project import inventory</CardTitle><CardDescription>Share a bounded file inventory for review—not project contents.</CardDescription></CardHeader>
    <CardContent className="space-y-4">
      <Alert><AlertTitle>Safety boundary</AlertTitle><AlertDescription>Only paths, sizes, and language labels are sent. Code is never uploaded or executed. Do not paste file contents or secrets.</AlertDescription></Alert>
      <form onSubmit={submit} className="space-y-3">
        <div><Label htmlFor="studio-import-source">Source label</Label><Input id="studio-import-source" maxLength={120} value={source} onChange={e => setSource(e.target.value)} placeholder="Existing project or repository label" data-testid="studio-import-source" /></div>
        <div><Label htmlFor="studio-import-json">File inventory JSON</Label><Textarea id="studio-import-json" maxLength={60000} value={inventory} onChange={e => setInventory(e.target.value)} placeholder={'[{"path":"src/app.tsx","size":1234,"language":"TypeScript"}]'} className="min-h-32 font-mono text-xs" data-testid="studio-import-inventory-input" /><p className="text-xs text-muted-foreground">At most 500 entries and 5MB declared size. Each entry: path, size, language (no contents).</p></div>
        <Button type="submit" disabled={busy || !source.trim() || !inventory.trim()} data-testid="studio-import-submit">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit inventory for review</Button>
      </form>
      {error && <Alert variant="destructive" data-testid="studio-import-error"><AlertTitle>Import inventory failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {result && <section className="space-y-3" data-testid="studio-import-success"><div data-testid="studio-import-results">
        <Alert><AlertTitle>Inventory review result</AlertTitle><AlertDescription>{labelFor(result.reviewPlan, "The inventory was received for bounded review.")}</AlertDescription></Alert>
        <div className="flex flex-wrap gap-2 text-sm"><Badge variant="secondary" data-testid="studio-import-blocked-count">Blocked: {count("blocked")}</Badge><Badge variant="secondary" data-testid="studio-import-review-count">Review: {count("review")}</Badge><Badge variant="secondary" data-testid="studio-import-unsupported-count">Unsupported: {count("unsupported")}</Badge></div>
        {(["blocked", "review", "unsupported"] as const).map(key => list(key).length > 0 && <div key={key}><p className="font-medium capitalize">{key}</p><ul className="list-disc pl-5 text-sm">{list(key).map((item, i) => { const entry = asObject(item); return <li key={i}>{labelFor(entry.path, typeof item === "string" ? item : "Inventory item")} {typeof entry.reason === "string" ? `(${entry.reason})` : ""}</li>; })}</ul></div>)}
        <p className="text-sm text-muted-foreground"><strong>Human review plan:</strong> confirm source ownership, inspect only approved file metadata, resolve blocked/unsupported entries, and authorize any later migration separately. No code is run from this inventory.</p>
      </div></section>}
    </CardContent>
  </Card>;
}

export default function StudioPage() {
  const [prompt, setPrompt] = useState("");
  const [rawManifest, setRawManifest] = useState("");
  const [manifest, setManifest] = useState<JsonRecord | null>(null);
  const [modifyInstruction, setModifyInstruction] = useState("");
  const [suggestedManifest, setSuggestedManifest] = useState<JsonRecord | null>(null);
  const [modifyStatus, setModifyStatus] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [selectedKey, setSelectedKey] = useState("");
  const [busy, setBusy] = useState<"generate" | "modify" | "validate" | "publish" | "export" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [validatedRawManifest, setValidatedRawManifest] = useState<string | null>(null);
  const editorRevision = useRef(0);
  const capabilityQuery = useQuery<StudioCapability>({ queryKey: ["/api/admin/studio/capability"], queryFn: getQueryFn({ on401: "sessionExpired" }) });
  const modulesQuery = useQuery<{ modules?: StudioModule[] }>({ queryKey: ["/api/admin/studio/modules"], queryFn: getQueryFn({ on401: "sessionExpired" }) });
  const capability = capabilityQuery.data;
  const moduleResponse = modulesQuery.data;
  const modules = moduleResponse?.modules ?? [];

  const parsedManifest = useMemo(() => {
    try { return rawManifest.trim() ? asObject(JSON.parse(rawManifest)) : null; } catch { return null; }
  }, [rawManifest]);

  useEffect(() => {
    if (!selectedKey && modules[0]) setSelectedKey(modules[0].moduleKey || modules[0].key || "");
  }, [modules, selectedKey]);
  const versionsQuery = useQuery<{ versions?: unknown[] }>({
    queryKey: [`/api/admin/studio/modules/${encodeURIComponent(selectedKey)}/versions`],
    queryFn: getQueryFn({ on401: "sessionExpired" }),
    enabled: !!selectedKey,
    retry: false,
  });
  const versions = Array.isArray(versionsQuery.data?.versions) ? versionsQuery.data.versions.map(asObject) : [];

  const generateTool = async () => {
    if (!prompt.trim()) return;
    const revision = editorRevision.current;
    setBusy("generate"); setError(null); setValidation(null); setSuggestedManifest(null); setModifyStatus(null);
    try {
      const result = asObject(await (await apiRequest("POST", "/api/admin/studio/generate", { prompt: prompt.trim() })).json());
      const next = asObject(result.manifest ?? result.draft);
      if (!Object.keys(next).length) throw new Error("The draft response did not include a manifest.");
        if (editorRevision.current !== revision) {
          setError("A tool draft was created, but the editor changed before it returned. Your edits were preserved; submit the same request to reopen the private draft.");
          return;
        }
        setManifest(next); setRawManifest(JSON.stringify(next, null, 2)); setValidatedRawManifest(null);
       setSelectedKey(labelFor(next.moduleKey, ""));
        await queryClient.invalidateQueries({ queryKey: ["/api/admin/studio/modules"] });
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Tool generation failed."); }
    finally { setBusy(null); }
  };
  const askAiToModify = async () => {
    if (!modifyInstruction.trim()) return;
    if (!parsedManifest) { setError("Enter valid manifest JSON before requesting an AI modification."); return; }
    const revision = editorRevision.current;
    const currentManifest = parsedManifest;
    setBusy("modify"); setError(null); setModifyStatus(null); setSuggestedManifest(null);
    try {
      const result = asObject(await (await apiRequest("POST", "/api/admin/studio/modify", {
        instruction: modifyInstruction.trim(),
        manifest: currentManifest,
      })).json());
      const next = asObject(result.manifest);
      if (!Object.keys(next).length) throw new Error("The modification response did not include a manifest.");
      if (editorRevision.current !== revision) {
        setModifyStatus("The editor changed while AI was preparing a suggestion. Your edits were preserved; request the change again from the current manifest.");
        return;
      }
      setSuggestedManifest(next);
      setModifyStatus(labelFor(result.message, "Suggested changes are ready for review. The current manifest has not been changed."));
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "AI modification failed."); }
    finally { setBusy(null); }
  };
  const applySuggestedManifest = () => {
    if (!suggestedManifest || busy !== null) return;
    editorRevision.current += 1;
    const nextRaw = JSON.stringify(suggestedManifest, null, 2);
    setRawManifest(nextRaw);
    setManifest(suggestedManifest);
    setSelectedKey(labelFor(suggestedManifest.moduleKey, selectedKey));
    setValidation(null);
    setValidatedRawManifest(null);
    setSuggestedManifest(null);
    setModifyStatus("AI suggestion applied to the editor. Validate this current draft before publishing.");
  };
  const validate = async () => {
    if (!parsedManifest) { setError("Raw manifest must be valid JSON before validation."); return; }
    const candidate = rawManifest;
    const revision = editorRevision.current;
    setBusy("validate"); setError(null);
    try {
      const result = asObject(await (await apiRequest("POST", "/api/admin/studio/validate", { manifest: parsedManifest })).json());
       const response = result as ValidationResult;
       if (response.valid === false && response.error?.fieldErrors) {
         response.errors = Object.entries(asObject(response.error.fieldErrors)).flatMap(([field, issues]) =>
           Array.isArray(issues) ? issues.map((issue) => `${field}: ${String(issue)}`) : [],
         );
       }
       if (editorRevision.current === revision) { setValidation(response); setManifest(parsedManifest); setValidatedRawManifest(response.valid ? candidate : null); }
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Validation failed."); }
    finally { setBusy(null); }
  };
  const publish = async () => {
    if (!selectedKey || !parsedManifest || validation?.valid !== true || validatedRawManifest !== rawManifest) { setError("Validate the current manifest successfully before publishing."); return; }
    setBusy("publish"); setError(null);
    try {
       const makePublic = [...(Array.isArray(parsedManifest.fields) ? parsedManifest.fields.map(asObject) : []), ...(Array.isArray(parsedManifest.actions) ? parsedManifest.actions.map(asObject) : [])].every((entry) => entry.dataScope === "public");
       const response = asObject(await (await apiRequest("POST", `/api/admin/studio/modules/${encodeURIComponent(selectedKey)}/publish`, { manifest: parsedManifest, makePublic })).json());
       const exportResult = asObject(response.export);
       const exportDestination = labelFor(exportResult.destination, "convex/seed_modules.json");
       const exportSynchronized = exportResult.status === "synchronized";
      setConfirmPublish(false);
       await queryClient.invalidateQueries({ queryKey: ["/api/admin/studio/modules"] });
       await versionsQuery.refetch();
       setPublishSuccess(exportSynchronized
         ? `Published ${makePublic ? "public" : "organization"} version ${String(asObject(response.module).version ?? "") || "successfully"}. Git-ready registry synchronized: ${exportDestination}. Runtime URL: /studio/${selectedKey}`
         : `${labelFor(exportResult.message, "Published version is live, but its registry export needs attention.")} Destination: ${exportDestination}`);
      setError(null);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Publish failed."); }
    finally { setBusy(null); }
  };
  const exportRegistry = async () => {
    setBusy("export"); setError(null);
    try {
      const result = asObject(await (await apiRequest("POST", "/api/admin/studio/export")).json());
      const content = result.content;
      if (!isStudioSeedFile(content)) throw new Error("The export response did not include a valid Studio registry.");
      const blob = new Blob([`${JSON.stringify(content, null, 2)}\n`], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = labelFor(result.filename, "seed_modules.json");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      setPublishSuccess(`${labelFor(result.message, "Studio registry exported.")} Server copy: ${labelFor(result.destination, "convex/seed_modules.json")}`);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Studio registry export failed."); }
    finally { setBusy(null); }
  };

  return <main className="container max-w-7xl px-4 py-8 space-y-6" data-testid="studio-page">
    <header className="rounded-xl border bg-gradient-to-r from-primary/10 via-background to-background p-6">
      <div className="flex items-start justify-between gap-4"><div className="flex items-start gap-4"><div className="rounded-lg bg-primary p-3 text-primary-foreground"><Sparkles /></div><div><p className="text-sm font-medium text-primary">Admin · Internal Tools</p><h1 className="text-3xl font-bold">Prompt-to-Publish Studio</h1><p className="mt-2 max-w-3xl text-muted-foreground">Turn a reviewed natural-language brief into a constrained module manifest. Drafts are not published. The runtime accepts safe fields and declared views only—never arbitrary code.</p><p className="mt-2 text-xs text-muted-foreground">Export downloads a Git-ready configuration and updates the server workspace copy at <code>convex/seed_modules.json</code>. It never commits or pushes Git changes.</p></div></div><Button type="button" variant="outline" onClick={exportRegistry} disabled={busy !== null} aria-label="Export Studio registry to Git-ready configuration" data-testid="studio-export-git-button">{busy === "export" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Export to Git / Download Config</Button></div>
       <div className="mt-4 flex flex-wrap gap-2"><Badge variant="secondary" data-testid="studio-capability-status">Manifest-only capability</Badge><Badge variant="outline"><LockKeyhole className="mr-1 h-3 w-3" />No arbitrary code execution</Badge></div>
    </header>
    {(error || capabilityQuery.error || modulesQuery.error) && <Alert variant="destructive" data-testid="studio-error"><AlertTitle>Studio request failed</AlertTitle><AlertDescription>{error || (capabilityQuery.error instanceof Error ? capabilityQuery.error.message : modulesQuery.error instanceof Error ? modulesQuery.error.message : "Studio controls could not be loaded.")}</AlertDescription></Alert>}
    {publishSuccess && <Alert data-testid="studio-publish-success"><AlertTitle>Publishing complete</AlertTitle><AlertDescription>{publishSuccess}</AlertDescription></Alert>}
    <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Describe the tool or feature you want to build...</CardTitle><CardDescription>Generation produces a reviewable private draft with declared inputs, stages, and safe output metadata. It cannot make a public change.</CardDescription></CardHeader><CardContent className="space-y-3"><Label htmlFor="studio-prompt">Natural-language builder request</Label><Textarea id="studio-prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Create an organization grant-readiness tool with stages for context, evidence, and review…" className="min-h-32" data-testid="studio-builder-prompt-input" />{capabilityQuery.isLoading && <p role="status" className="text-sm text-muted-foreground">Loading Studio capability…</p>}<Button onClick={generateTool} disabled={!prompt.trim() || busy !== null || capabilityQuery.isLoading || !capability?.aiDrafting} data-testid="studio-generate-button">{busy === "generate" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}✨ Generate Tool</Button></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Security boundary</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground"><p>Studio manifests describe content, fields, and approved views. They do not accept scripts, external executable code, or custom runtime behavior.</p><p>Validation checks the current manifest. Publishing requires an explicit confirmation and is separate from drafting.</p></CardContent></Card>
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex gap-2"><Code2 className="h-5 w-5" />Raw manifest JSON</CardTitle><CardDescription>Edit the manifest directly, then validate it before publishing.</CardDescription></CardHeader><CardContent className="space-y-3"><Textarea aria-label="Raw manifest JSON" value={rawManifest} onChange={e => { editorRevision.current += 1; setRawManifest(e.target.value); setValidation(null); setValidatedRawManifest(null); setSuggestedManifest(null); }} placeholder={'{\n  "title": "…",\n  "fields": []\n}'} className="min-h-[360px] font-mono text-xs" data-testid="studio-manifest-json" />
          <div className="rounded-md border bg-muted/30 p-3 space-y-3" data-testid="studio-modify-panel"><Label htmlFor="studio-modify-instruction">Ask AI to Modify</Label><Textarea id="studio-modify-instruction" value={modifyInstruction} onChange={e => setModifyInstruction(e.target.value)} placeholder="For example: Add a final review stage and a checklist output, without changing the organization scope." className="min-h-24" data-testid="studio-modify-prompt-input" /><Button type="button" variant="secondary" onClick={askAiToModify} disabled={!modifyInstruction.trim() || !parsedManifest || busy !== null} data-testid="studio-modify-button">{busy === "modify" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Ask AI to Modify</Button>{modifyStatus && <p className="text-sm text-muted-foreground" data-testid="studio-modify-status">{modifyStatus}</p>}{suggestedManifest && <div className="rounded border bg-background p-3 space-y-2" data-testid="studio-modify-suggestion"><p className="text-sm font-medium">Suggested draft ready</p><p className="text-xs text-muted-foreground">The existing editor has not changed. Applying this suggestion still requires validation and explicit human publication.</p><Button type="button" size="sm" onClick={applySuggestedManifest} disabled={busy !== null} data-testid="studio-modify-apply">Apply suggested changes</Button></div>}</div>
          <Button variant="outline" onClick={validate} disabled={!rawManifest.trim() || busy !== null} data-testid="studio-validate-button">{busy === "validate" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Validate manifest</Button>
        {rawManifest && !parsedManifest && <p className="text-sm text-destructive" data-testid="studio-json-error">JSON is not valid yet.</p>}
         {validation && <Alert variant={validation.valid === false ? "destructive" : "default"} data-testid="studio-validation-results"><AlertTitle>{validation.valid === false ? "Validation needs attention" : "Validation complete"}</AlertTitle><AlertDescription className="space-y-1">{validation.message && <p>{validation.message}</p>}{validation.errors?.map((issue, i) => <p key={i}>Error: {readableIssue(issue)}</p>)}{validation.warnings?.map((issue, i) => <p key={i}>Warning: {readableIssue(issue)}</p>)}</AlertDescription></Alert>}</CardContent></Card>
      <Card><CardHeader><CardTitle className="flex gap-2"><Eye className="h-5 w-5" />Safe rendered preview</CardTitle><CardDescription>Preview uses text and declared fields only; it does not execute manifest content.</CardDescription></CardHeader><CardContent>{(parsedManifest || manifest) ? <ManifestPreview manifest={parsedManifest || manifest!} /> : <p className="text-sm text-muted-foreground" data-testid="studio-preview-empty">Generate or paste a manifest to preview it.</p>}</CardContent></Card>
    </div>
      <Card><CardHeader><CardTitle className="flex gap-2"><Upload className="h-5 w-5" />Publish reviewed version</CardTitle><CardDescription>Choose the draft’s module key. A manifest with only public-scoped controls publishes publicly; a manifest with organization/aggregate controls publishes to authenticated organization workspaces.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="flex-1"><Label htmlFor="studio-module">Module</Label><select id="studio-module" value={selectedKey} onChange={e => setSelectedKey(e.target.value)} disabled={modulesQuery.isLoading} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" data-testid="studio-module-select"><option value="">{modulesQuery.isLoading ? "Loading modules…" : "Select a module"}</option>{modules.map(module => { const key = module.moduleKey || module.key || ""; return <option key={key} value={key}>{module.manifest && labelFor(module.manifest.title, key)}</option>; })}</select></div><Button onClick={() => setConfirmPublish(true)} disabled={!selectedKey || !parsedManifest || validation?.valid !== true || validatedRawManifest !== rawManifest || labelFor(parsedManifest.moduleKey, "") !== selectedKey || busy !== null} data-testid="studio-publish-button"><Upload className="mr-2 h-4 w-4" />Publish manifest</Button></CardContent></Card>
    <Card data-testid="studio-version-history"><CardHeader><CardTitle className="flex gap-2"><FileClock className="h-5 w-5" />Module & version history</CardTitle></CardHeader><CardContent>{!selectedKey ? <p className="text-sm text-muted-foreground">Select a module to view version history.</p> : versionsQuery.isLoading ? <p role="status" className="text-sm text-muted-foreground">Loading version history…</p> : versionsQuery.error ? <Alert variant="destructive"><AlertTitle>Version history unavailable</AlertTitle><AlertDescription>{versionsQuery.error instanceof Error ? versionsQuery.error.message : "Try again later."}</AlertDescription></Alert> : versions.length ? <ul className="space-y-2">{versions.map((version, index) => <li className="rounded-md border p-3 text-sm" key={String(version.id ?? version.version ?? index)}><span className="font-medium">{labelFor(version.version ?? version.name, `Version ${index + 1}`)}</span><span className="ml-2 text-muted-foreground">{labelFor(version.createdAt ?? version.publishedAt ?? version.updatedAt, "Date unavailable")}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">No version records are available for this module.</p>}</CardContent></Card>
     <InventoryImportCard />
    <Dialog open={confirmPublish} onOpenChange={setConfirmPublish}><DialogContent data-testid="studio-publish-confirmation"><DialogHeader><DialogTitle>Publish this manifest?</DialogTitle><DialogDescription>This makes the reviewed manifest available through the public module runtime. Drafting and validation alone do not publish anything.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setConfirmPublish(false)}>Cancel</Button><Button onClick={publish} disabled={busy === "publish"} data-testid="studio-confirm-publish-button">{busy === "publish" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm publish</Button></DialogFooter></DialogContent></Dialog>
  </main>;
}

export function StudioRuntimePage() {
  const [, params] = useRoute("/studio/:moduleKey");
  const moduleKey = params?.moduleKey || "";
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { orgId } = useCurrentOrgId();
  const publicModuleQuery = useQuery<JsonRecord>({ queryKey: [`/api/studio/modules/${encodeURIComponent(moduleKey)}`], queryFn: getQueryFn({ on401: "returnNull" }), enabled: !!moduleKey, retry: false });
  const organizationModuleQuery = useQuery<JsonRecord>({ queryKey: [`/api/studio/modules/${encodeURIComponent(moduleKey)}/organization`, orgId], queryFn: getQueryFn({ on401: "returnNull" }), enabled: !!moduleKey && !publicModuleQuery.data && isAuthenticated, retry: false });
  const data = publicModuleQuery.data ?? organizationModuleQuery.data;
  const isLoading = publicModuleQuery.isLoading || (!publicModuleQuery.data && isAuthenticated && organizationModuleQuery.isLoading);
  const error = publicModuleQuery.error && (!isAuthenticated || organizationModuleQuery.error);
  const module = asObject(data?.module ?? data);
  const manifest = asObject(module.manifest ?? data?.manifest ?? module);
  const fields = Array.isArray(manifest.fields) ? manifest.fields.map(asObject) : [];
  const actions = Array.isArray(manifest.actions) ? manifest.actions.map(asObject) : [];
  const publicFields = fields.filter(field => field.dataScope === "public");
  const organizationFields = fields.filter(field => field.dataScope === "organization" || field.dataScope === "aggregate");
  const hasOrganizationWorkspace = organizationFields.length > 0;
  const hasPublicSubmission = publicFields.length > 0 && actions.some(action => action.type === "submit-record" && action.dataScope === "public");
  const hasOrganizationSubmission = organizationFields.length > 0 && actions.some(action => action.type === "submit-record" && (action.dataScope === "organization" || action.dataScope === "aggregate"));
  const organizationRecordsQuery = useQuery<JsonRecord>({
    queryKey: [`/api/studio/modules/${encodeURIComponent(moduleKey)}/organization-records`, orgId],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!moduleKey && !!data && hasOrganizationWorkspace && isAuthenticated,
    retry: false,
  });
  const [record, setRecord] = useState<JsonRecord>({});
  const [status, setStatus] = useState<string | null>(null);
  const [statusIsError, setStatusIsError] = useState(false);
  const [runtimeBusy, setRuntimeBusy] = useState<"public" | "organization" | "delete" | null>(null);
  const fieldSignature = JSON.stringify(fields.map((field) => ({
    key: labelFor(field.key, ""),
    type: field.type === "checkbox" ? "checkbox" : "text",
  })));
  useEffect(() => {
    setRecord(Object.fromEntries(fields.map((field) => [labelFor(field.key, ""), field.type === "checkbox" ? false : ""]).filter(([key]) => Boolean(key))));
  }, [fieldSignature]);
  const acceptsRecords = hasPublicSubmission || hasOrganizationSubmission;
  const records = Array.isArray(organizationRecordsQuery.data?.records)
    ? organizationRecordsQuery.data.records.map(asObject)
    : Array.isArray(organizationRecordsQuery.data) ? (organizationRecordsQuery.data as unknown[]).map(asObject) : [];
  const recordId = (item: JsonRecord) => String(item.id ?? item.recordId ?? "");
  const resetRecord = () => setRecord(Object.fromEntries(fields.map(field => [labelFor(field.key, ""), field.type === "checkbox" ? false : ""])));
  const submit = async (event: FormEvent, scope: "public" | "organization") => {
    event.preventDefault();
    if (runtimeBusy) return;
    setStatus(null); setStatusIsError(false); setRuntimeBusy(scope);
    try {
      const scopedFields = scope === "public" ? publicFields : organizationFields;
      const values = Object.fromEntries(scopedFields.map(field => {
        const key = labelFor(field.key, "");
        return [key, record[key]];
      }).filter(([key]) => Boolean(key)));
      const endpoint = scope === "public" ? "records" : "organization-records";
      await apiRequest("POST", `/api/studio/modules/${encodeURIComponent(moduleKey)}/${endpoint}`, { values });
      setStatus(scope === "public" ? "Your public entry was accepted." : "Your entry was submitted to your organization workspace.");
      resetRecord();
      if (scope === "organization") {
        const refreshed = await organizationRecordsQuery.refetch();
        if (refreshed.error) throw refreshed.error;
      }
    } catch (requestError) { setStatusIsError(true); setStatus(requestError instanceof Error ? requestError.message : "Unable to submit your entry."); }
    finally { setRuntimeBusy(null); }
  };
  const removeRecord = async (item: JsonRecord) => {
    const id = recordId(item);
    if (!id) { setStatusIsError(true); setStatus("This record has no server deletion identifier."); return; }
    if (runtimeBusy || !window.confirm("Delete this organization record? This action is audited and cannot be undone.")) return;
    setRuntimeBusy("delete"); setStatus(null); setStatusIsError(false);
    try {
      await apiRequest("DELETE", `/api/studio/modules/${encodeURIComponent(moduleKey)}/organization-records/${encodeURIComponent(id)}`);
      const refreshed = await organizationRecordsQuery.refetch();
      if (refreshed.error) throw refreshed.error;
      setStatus("Record deleted from your organization workspace.");
    } catch (requestError) { setStatusIsError(true); setStatus(requestError instanceof Error ? requestError.message : "Unable to delete this record."); }
    finally { setRuntimeBusy(null); }
  };
  const endpointError = organizationRecordsQuery.error instanceof Error ? organizationRecordsQuery.error.message : "";
  const endpointCode = Number(endpointError.match(/^(\d{3}):/)?.[1] || 0);
  const authRequired = endpointCode === 401 || (isAuthenticated && organizationRecordsQuery.data === null);
  const forbidden = endpointCode === 403;
  const notFound = endpointCode === 404;
  const selectionRequired = endpointError.includes("ORG_SELECTION_REQUIRED");
  if (isLoading) return <main className="container max-w-3xl px-4 py-12" data-testid="studio-runtime-loading"><p role="status" aria-live="polite">Loading module…</p></main>;
  if (error || !data) return <main className="container max-w-3xl px-4 py-12" data-testid="studio-runtime-unavailable"><h1 className="text-2xl font-bold">Module unavailable</h1><p className="mt-2 text-muted-foreground">This published module could not be loaded (404 or a server error).</p><Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>Try again</Button></main>;
  return <main className="container max-w-3xl px-4 py-10 space-y-6" data-testid="studio-runtime-page"><header><Badge variant="secondary">Published module</Badge><h1 className="mt-3 text-3xl font-bold">{labelFor(manifest.title ?? manifest.name, moduleKey)}</h1><p className="mt-2 text-muted-foreground">{labelFor(manifest.description ?? manifest.summary, "This module accepts the fields shown below.")}</p></header>
    {hasOrganizationWorkspace && <Alert data-testid="studio-organization-message"><AlertTitle>Organization workspace data</AlertTitle><AlertDescription>Organization records require sign-in and an explicitly selected organization when you belong to more than one. Records are never shared across organizations; the server determines your organization.</AlertDescription></Alert>}
    <Card><CardHeader><CardTitle>{acceptsRecords ? "Submit a record" : "Available module"}</CardTitle><CardDescription>{acceptsRecords ? "Public and organization fields are intentionally submitted through separate, scope-specific paths." : "This published module does not accept record submissions."}</CardDescription></CardHeader><CardContent className="space-y-6">
      {hasOrganizationWorkspace && !authLoading && !isAuthenticated && <p data-testid="studio-organization-auth-required" className="text-sm text-muted-foreground">401: Sign in is required before organization records can be viewed or submitted.</p>}
       {hasOrganizationWorkspace && isAuthenticated && (authRequired || forbidden || notFound || organizationRecordsQuery.error) && <Alert variant="destructive" role="alert" data-testid="studio-organization-records-error"><AlertTitle>{selectionRequired ? "Choose an organization" : authRequired ? "401: Sign in required" : forbidden ? "403: Organization access denied" : notFound ? "404: Workspace records unavailable" : "Organization records unavailable"}</AlertTitle><AlertDescription>{selectionRequired ? "Choose an organization in the workspace switcher, then try again." : authRequired ? "Please sign in to access your organization workspace." : forbidden ? "Your account is not authorized for this organization workspace." : notFound ? "This organization records capability is not available for this module." : endpointError || "The server could not load organization records."}</AlertDescription></Alert>}
      {hasOrganizationWorkspace && isAuthenticated && organizationRecordsQuery.isLoading && <p className="text-sm text-muted-foreground" data-testid="studio-organization-records-loading">Loading organization records…</p>}
       {hasOrganizationWorkspace && isAuthenticated && !authRequired && !organizationRecordsQuery.error && !organizationRecordsQuery.isLoading && <section data-testid="studio-organization-records" className="space-y-2"><p className="text-sm font-medium">Your organization records</p>{organizationRecordsQuery.data?.truncated === true && <p className="text-xs text-muted-foreground">Showing the most recent 100 records.</p>}{records.length === 0 ? <p className="text-sm text-muted-foreground" data-testid="studio-organization-records-empty">No records are available for your organization.</p> : <ul className="space-y-2">{records.map((item, index) => <li key={recordId(item) || index} className="rounded-md border p-3 text-sm"><pre className="whitespace-pre-wrap">{JSON.stringify(item.values ?? item.data ?? {}, null, 2)}</pre><p className="mt-2 text-xs text-muted-foreground">Source: {labelFor(asObject(item.provenance).source, "organization workspace")} · Retained until: {labelFor(item.retentionUntil, "server policy")}</p>{recordId(item) && item.canDelete === true && <Button type="button" variant="outline" size="sm" disabled={runtimeBusy !== null} onClick={() => removeRecord(item)} data-testid={`studio-organization-delete-${recordId(item)}`}>Delete record</Button>}</li>)}</ul>}</section>}
      {hasPublicSubmission && <form className="space-y-4" onSubmit={(event) => submit(event, "public")} data-testid="studio-public-runtime-form"><p className="text-sm font-medium">Public submission</p>{publicFields.map((field, i) => { const key = labelFor(field.key ?? field.name, `public_field_${i}`); const label = labelFor(field.label, key); const type = String(field.type || "text"); return <div key={key}><Label htmlFor={`studio-public-field-${key}`}>{label}</Label>{type === "select" ? <select id={`studio-public-field-${key}`} required={field.required === true} value={typeof record[key] === "string" ? record[key] as string : ""} onChange={e => setRecord(current => ({ ...current, [key]: e.target.value }))} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" data-testid={`studio-public-field-${key}`}><option value="">Select an option</option>{Array.isArray(field.options) && field.options.map((option) => <option key={String(option)} value={String(option)}>{String(option)}</option>)}</select> : <input id={`studio-public-field-${key}`} type="checkbox" required={field.required === true} checked={record[key] === true} onChange={e => setRecord(current => ({ ...current, [key]: e.target.checked }))} data-testid={`studio-public-field-${key}`} />}</div>; })}<Button type="submit" disabled={runtimeBusy !== null} data-testid="studio-public-runtime-submit"><Send className="mr-2 h-4 w-4" />Submit public record</Button></form>}
      {hasOrganizationSubmission && <form className="space-y-4" onSubmit={(event) => submit(event, "organization")} data-testid="studio-organization-runtime-form"><p className="text-sm font-medium">Organization submission</p>{organizationFields.map((field, i) => { const key = labelFor(field.key ?? field.name, `organization_field_${i}`); const label = labelFor(field.label, key); const type = String(field.type || "text"); return <div key={key}><Label htmlFor={`studio-organization-field-${key}`}>{label}</Label>{type === "textarea" ? <Textarea id={`studio-organization-field-${key}`} required={field.required === true} value={typeof record[key] === "string" ? record[key] as string : ""} onChange={e => setRecord(current => ({ ...current, [key]: e.target.value }))} data-testid={`studio-organization-field-${key}`} /> : type === "select" ? <select id={`studio-organization-field-${key}`} required={field.required === true} value={typeof record[key] === "string" ? record[key] as string : ""} onChange={e => setRecord(current => ({ ...current, [key]: e.target.value }))} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" data-testid={`studio-organization-field-${key}`}><option value="">Select an option</option>{Array.isArray(field.options) && field.options.map((option) => <option key={String(option)} value={String(option)}>{String(option)}</option>)}</select> : type === "checkbox" ? <input id={`studio-organization-field-${key}`} type="checkbox" required={field.required === true} checked={record[key] === true} onChange={e => setRecord(current => ({ ...current, [key]: e.target.checked }))} data-testid={`studio-organization-field-${key}`} /> : <Input id={`studio-organization-field-${key}`} type={type === "date" ? "date" : "text"} required={field.required === true} value={typeof record[key] === "string" ? record[key] as string : ""} onChange={e => setRecord(current => ({ ...current, [key]: e.target.value }))} data-testid={`studio-organization-field-${key}`} />}</div>; })}<p className="text-xs text-muted-foreground">Do not enter names, contact information, or other personal information.</p><Button type="submit" disabled={!isAuthenticated || runtimeBusy !== null} data-testid="studio-organization-runtime-submit"><Send className="mr-2 h-4 w-4" />Submit organization record</Button></form>}
      {status && (statusIsError ? <Alert variant="destructive" role="alert" data-testid="studio-runtime-status"><AlertTitle>Studio request failed</AlertTitle><AlertDescription>{status}</AlertDescription></Alert> : <p role="status" className="text-sm" data-testid="studio-runtime-status">{status}</p>)}
    </CardContent></Card></main>;
}