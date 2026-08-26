import { FormEvent, useEffect, useMemo, useState } from "react";
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
import { CheckCircle2, Code2, Eye, FileClock, Loader2, LockKeyhole, Send, ShieldCheck, Sparkles, Upload } from "lucide-react";

type JsonRecord = Record<string, unknown>;
interface StudioModule { moduleKey: string; key?: string; name?: string; title?: string; updatedAt?: string; publishedAt?: string; status?: string; manifest?: JsonRecord; version?: number; lifecycleStage?: string; }
interface ValidationResult { valid?: boolean; error?: JsonRecord; errors?: Array<string | JsonRecord>; warnings?: Array<string | JsonRecord>; message?: string; }
interface StudioCapability { moduleTypes?: string[]; fieldTypes?: string[]; actionTypes?: string[]; aiDrafting?: boolean; }

const asObject = (value: unknown): JsonRecord => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
const labelFor = (value: unknown, fallback: string) => typeof value === "string" && value.trim() ? value : fallback;
const readableIssue = (issue: string | JsonRecord) => typeof issue === "string" ? issue : labelFor(issue.message ?? issue.error ?? issue.path, "Validation issue");

function ManifestPreview({ manifest }: { manifest: JsonRecord }) {
  const title = labelFor(manifest.title ?? manifest.name, "Untitled module");
  const description = labelFor(manifest.description ?? manifest.summary, "No description has been provided.");
  const fields = Array.isArray(manifest.fields) ? manifest.fields.map(asObject) : [];
  const actions = Array.isArray(manifest.actions) ? manifest.actions.map(asObject) : [];
  return (
    <section aria-label="Rendered manifest preview" data-testid="studio-rendered-preview" className="space-y-4">
      <div><h3 className="font-semibold">{title}</h3><p className="text-sm text-muted-foreground">{description}</p></div>
      {fields.length > 0 && <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Fields</p><div className="flex flex-wrap gap-2">{fields.map((field, index) => <Badge variant="secondary" key={`${labelFor(field.key, "field")}-${index}`}>{labelFor(field.label ?? field.key, `Field ${index + 1}`)}</Badge>)}</div></div>}
       {actions.length > 0 && <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Allowed actions</p><div className="flex flex-wrap gap-2">{actions.map((action, index) => <Badge variant="outline" key={`${labelFor(action.type, "action")}-${index}`}>{labelFor(action.label ?? action.type, `Action ${index + 1}`)}</Badge>)}</div></div>}
    </section>
  );
}

export default function StudioPage() {
  const [prompt, setPrompt] = useState("");
  const [rawManifest, setRawManifest] = useState("");
  const [manifest, setManifest] = useState<JsonRecord | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [selectedKey, setSelectedKey] = useState("");
  const [versions, setVersions] = useState<JsonRecord[]>([]);
  const [busy, setBusy] = useState<"draft" | "validate" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const { data: capability } = useQuery<StudioCapability>({ queryKey: ["/api/admin/studio/capability"], queryFn: getQueryFn({ on401: "sessionExpired" }) });
  const { data: moduleResponse } = useQuery<{ modules?: StudioModule[] }>({ queryKey: ["/api/admin/studio/modules"], queryFn: getQueryFn({ on401: "sessionExpired" }) });
  const modules = moduleResponse?.modules ?? [];

  const parsedManifest = useMemo(() => {
    try { return rawManifest.trim() ? asObject(JSON.parse(rawManifest)) : null; } catch { return null; }
  }, [rawManifest]);

  useEffect(() => {
    if (!selectedKey && modules[0]) setSelectedKey(modules[0].moduleKey || modules[0].key || "");
  }, [modules, selectedKey]);
  useEffect(() => {
    if (!selectedKey) { setVersions([]); return; }
    apiRequest("GET", `/api/admin/studio/modules/${encodeURIComponent(selectedKey)}/versions`)
      .then(res => res.json()).then((data: unknown) => setVersions(Array.isArray(data) ? data.map(asObject) : Array.isArray(asObject(data).versions) ? (asObject(data).versions as unknown[]).map(asObject) : []))
      .catch((requestError: Error) => setError(requestError.message));
  }, [selectedKey]);

  const generateDraft = async () => {
    if (!prompt.trim()) return;
    setBusy("draft"); setError(null); setValidation(null);
    try {
      const result = asObject(await (await apiRequest("POST", "/api/admin/studio/draft", { prompt: prompt.trim() })).json());
      const next = asObject(result.manifest ?? result.draft);
      if (!Object.keys(next).length) throw new Error("The draft response did not include a manifest.");
       setManifest(next); setRawManifest(JSON.stringify(next, null, 2));
       setSelectedKey(labelFor(next.moduleKey, ""));
       queryClient.invalidateQueries({ queryKey: ["/api/admin/studio/modules"] });
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Draft generation failed."); }
    finally { setBusy(null); }
  };
  const validate = async () => {
    if (!parsedManifest) { setError("Raw manifest must be valid JSON before validation."); return; }
    setBusy("validate"); setError(null);
    try {
      const result = asObject(await (await apiRequest("POST", "/api/admin/studio/validate", { manifest: parsedManifest })).json());
       const response = result as ValidationResult;
       if (response.valid === false && response.error?.fieldErrors) {
         response.errors = Object.entries(asObject(response.error.fieldErrors)).flatMap(([field, issues]) =>
           Array.isArray(issues) ? issues.map((issue) => `${field}: ${String(issue)}`) : [],
         );
       }
       setValidation(response); setManifest(parsedManifest);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Validation failed."); }
    finally { setBusy(null); }
  };
  const publish = async () => {
    if (!selectedKey || !parsedManifest) { setError("Select a module and provide valid manifest JSON before publishing."); return; }
    setBusy("publish"); setError(null);
    try {
       await apiRequest("POST", `/api/admin/studio/modules/${encodeURIComponent(selectedKey)}/publish`, { manifest: parsedManifest, makePublic: true });
      setConfirmPublish(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/studio/modules"] });
       const refreshed = await apiRequest("GET", `/api/admin/studio/modules/${encodeURIComponent(selectedKey)}/versions`);
       setVersions((asObject(await refreshed.json()).versions as unknown[] || []).map(asObject));
      setError(null);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Publish failed."); }
    finally { setBusy(null); }
  };

  return <main className="container max-w-7xl px-4 py-8 space-y-6" data-testid="studio-page">
    <header className="rounded-xl border bg-gradient-to-r from-primary/10 via-background to-background p-6">
      <div className="flex items-start gap-4"><div className="rounded-lg bg-primary p-3 text-primary-foreground"><Sparkles /></div><div><p className="text-sm font-medium text-primary">Admin · Internal Tools</p><h1 className="text-3xl font-bold">Prompt-to-Publish Studio</h1><p className="mt-2 max-w-3xl text-muted-foreground">Turn a reviewed natural-language brief into a constrained module manifest. Drafts are not published. The runtime accepts safe fields and declared views only—never arbitrary code.</p></div></div>
       <div className="mt-4 flex flex-wrap gap-2"><Badge variant="secondary" data-testid="studio-capability-status">Manifest-only capability</Badge><Badge variant="outline"><LockKeyhole className="mr-1 h-3 w-3" />No arbitrary code execution</Badge></div>
    </header>
    {error && <Alert variant="destructive" data-testid="studio-error"><AlertTitle>Studio request failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
    <div className="grid gap-6 lg:grid-cols-2">
       <Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Describe the module</CardTitle><CardDescription>Generation produces a reviewable draft only; it cannot make a public change.</CardDescription></CardHeader><CardContent className="space-y-3"><Label htmlFor="studio-prompt">Natural-language prompt</Label><Textarea id="studio-prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Create an intake module for…" className="min-h-32" data-testid="studio-prompt-input" /><Button onClick={generateDraft} disabled={!prompt.trim() || busy !== null || !capability?.aiDrafting} data-testid="studio-generate-button">{busy === "draft" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Generate draft</Button></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Security boundary</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground"><p>Studio manifests describe content, fields, and approved views. They do not accept scripts, external executable code, or custom runtime behavior.</p><p>Validation checks the current manifest. Publishing requires an explicit confirmation and is separate from drafting.</p></CardContent></Card>
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="flex gap-2"><Code2 className="h-5 w-5" />Raw manifest JSON</CardTitle><CardDescription>Edit the manifest directly, then validate it before publishing.</CardDescription></CardHeader><CardContent className="space-y-3"><Textarea aria-label="Raw manifest JSON" value={rawManifest} onChange={e => { setRawManifest(e.target.value); setValidation(null); }} placeholder={'{\n  "title": "…",\n  "fields": []\n}'} className="min-h-[360px] font-mono text-xs" data-testid="studio-manifest-json" /><Button variant="outline" onClick={validate} disabled={!rawManifest.trim() || busy !== null} data-testid="studio-validate-button">{busy === "validate" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Validate manifest</Button>
        {rawManifest && !parsedManifest && <p className="text-sm text-destructive" data-testid="studio-json-error">JSON is not valid yet.</p>}
         {validation && <Alert variant={validation.valid === false ? "destructive" : "default"} data-testid="studio-validation-results"><AlertTitle>{validation.valid === false ? "Validation needs attention" : "Validation complete"}</AlertTitle><AlertDescription className="space-y-1">{validation.message && <p>{validation.message}</p>}{validation.errors?.map((issue, i) => <p key={i}>Error: {readableIssue(issue)}</p>)}{validation.warnings?.map((issue, i) => <p key={i}>Warning: {readableIssue(issue)}</p>)}</AlertDescription></Alert>}</CardContent></Card>
      <Card><CardHeader><CardTitle className="flex gap-2"><Eye className="h-5 w-5" />Safe rendered preview</CardTitle><CardDescription>Preview uses text and declared fields only; it does not execute manifest content.</CardDescription></CardHeader><CardContent>{(parsedManifest || manifest) ? <ManifestPreview manifest={parsedManifest || manifest!} /> : <p className="text-sm text-muted-foreground" data-testid="studio-preview-empty">Generate or paste a manifest to preview it.</p>}</CardContent></Card>
    </div>
     <Card><CardHeader><CardTitle className="flex gap-2"><Upload className="h-5 w-5" />Publish reviewed version</CardTitle><CardDescription>Choose the draft’s module key. Confirmed publishing makes the declarative module reachable at its safe runtime URL.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="flex-1"><Label htmlFor="studio-module">Module</Label><select id="studio-module" value={selectedKey} onChange={e => setSelectedKey(e.target.value)} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" data-testid="studio-module-select"><option value="">Select a module</option>{modules.map(module => { const key = module.moduleKey || module.key || ""; return <option key={key} value={key}>{module.manifest && labelFor(module.manifest.title, key)}</option>; })}</select></div><Button onClick={() => setConfirmPublish(true)} disabled={!selectedKey || !parsedManifest || labelFor(parsedManifest.moduleKey, "") !== selectedKey || busy !== null} data-testid="studio-publish-button"><Upload className="mr-2 h-4 w-4" />Publish manifest</Button></CardContent></Card>
    <Card data-testid="studio-version-history"><CardHeader><CardTitle className="flex gap-2"><FileClock className="h-5 w-5" />Module & version history</CardTitle></CardHeader><CardContent>{!selectedKey ? <p className="text-sm text-muted-foreground">Select a module to view version history.</p> : versions.length ? <ul className="space-y-2">{versions.map((version, index) => <li className="rounded-md border p-3 text-sm" key={String(version.id ?? version.version ?? index)}><span className="font-medium">{labelFor(version.version ?? version.name, `Version ${index + 1}`)}</span><span className="ml-2 text-muted-foreground">{labelFor(version.createdAt ?? version.publishedAt ?? version.updatedAt, "Date unavailable")}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">No version records are available for this module.</p>}</CardContent></Card>
    <Dialog open={confirmPublish} onOpenChange={setConfirmPublish}><DialogContent data-testid="studio-publish-confirmation"><DialogHeader><DialogTitle>Publish this manifest?</DialogTitle><DialogDescription>This makes the reviewed manifest available through the public module runtime. Drafting and validation alone do not publish anything.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setConfirmPublish(false)}>Cancel</Button><Button onClick={publish} disabled={busy === "publish"} data-testid="studio-confirm-publish-button">{busy === "publish" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm publish</Button></DialogFooter></DialogContent></Dialog>
  </main>;
}

export function StudioRuntimePage() {
  const [, params] = useRoute("/studio/:moduleKey");
  const moduleKey = params?.moduleKey || "";
   const { data, isLoading, error } = useQuery<JsonRecord>({ queryKey: [`/api/studio/modules/${encodeURIComponent(moduleKey)}`], queryFn: getQueryFn({ on401: "returnNull" }), enabled: !!moduleKey, retry: false });
  const module = asObject(data?.module ?? data);
  const manifest = asObject(module.manifest ?? data?.manifest ?? module);
  const fields = Array.isArray(manifest.fields) ? manifest.fields.map(asObject) : [];
  const actions = Array.isArray(manifest.actions) ? manifest.actions.map(asObject) : [];
  const [record, setRecord] = useState<JsonRecord>({});
  const [status, setStatus] = useState<string | null>(null);
  useEffect(() => {
    setRecord(current => {
      const normalized = { ...current };
      for (const field of fields) {
        const key = labelFor(field.key, "");
        if (key && !(key in normalized)) normalized[key] = field.type === "checkbox" ? false : "";
      }
      return normalized;
    });
  }, [manifest]);
  const acceptsRecords = actions.some((action) => action.type === "submit-record");
  const submit = async (event: FormEvent) => { event.preventDefault(); setStatus(null); try { await apiRequest("POST", `/api/studio/modules/${encodeURIComponent(moduleKey)}/records`, { values: record }); setStatus("Your entry was submitted."); setRecord({}); } catch (requestError) { setStatus(requestError instanceof Error ? requestError.message : "Unable to submit your entry."); } };
  if (isLoading) return <main className="container max-w-3xl px-4 py-12" data-testid="studio-runtime-loading">Loading module…</main>;
  if (error || !data) return <main className="container max-w-3xl px-4 py-12" data-testid="studio-runtime-unavailable"><h1 className="text-2xl font-bold">Module unavailable</h1><p className="mt-2 text-muted-foreground">This published module could not be loaded.</p></main>;
  return <main className="container max-w-3xl px-4 py-10 space-y-6" data-testid="studio-runtime-page"><header><Badge variant="secondary">Published module</Badge><h1 className="mt-3 text-3xl font-bold">{labelFor(manifest.title ?? manifest.name, moduleKey)}</h1><p className="mt-2 text-muted-foreground">{labelFor(manifest.description ?? manifest.summary, "This module accepts the fields shown below.")}</p></header><Card><CardHeader><CardTitle>{acceptsRecords ? "Submit a record" : "Available module"}</CardTitle><CardDescription>{acceptsRecords ? "Only safe, declared fields are accepted. Submitted values are never displayed publicly." : "This published module does not accept record submissions."}</CardDescription></CardHeader><CardContent>{acceptsRecords && <form className="space-y-4" onSubmit={submit} data-testid="studio-runtime-form">{fields.map((field, i) => { const key = labelFor(field.key ?? field.name, `field_${i}`); const label = labelFor(field.label, key); const type = String(field.type || "text"); return <div key={key}><Label htmlFor={`studio-field-${key}`}>{label}</Label>{type === "textarea" ? <Textarea id={`studio-field-${key}`} required={field.required === true} value={typeof record[key] === "string" ? record[key] as string : ""} onChange={e => setRecord(current => ({ ...current, [key]: e.target.value }))} data-testid={`studio-runtime-field-${key}`} /> : type === "select" ? <select id={`studio-field-${key}`} required={field.required === true} value={typeof record[key] === "string" ? record[key] as string : ""} onChange={e => setRecord(current => ({ ...current, [key]: e.target.value }))} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" data-testid={`studio-runtime-field-${key}`}><option value="">Select an option</option>{Array.isArray(field.options) && field.options.map((option) => <option key={String(option)} value={String(option)}>{String(option)}</option>)}</select> : type === "checkbox" ? <input id={`studio-field-${key}`} type="checkbox" checked={record[key] === true} onChange={e => setRecord(current => ({ ...current, [key]: e.target.checked }))} data-testid={`studio-runtime-field-${key}`} /> : <Input id={`studio-field-${key}`} type={type === "date" ? "date" : "text"} required={field.required === true} value={typeof record[key] === "string" ? record[key] as string : ""} onChange={e => setRecord(current => ({ ...current, [key]: e.target.value }))} data-testid={`studio-runtime-field-${key}`} />}</div>; })}<Button type="submit" disabled={fields.length === 0} data-testid="studio-runtime-submit"><Send className="mr-2 h-4 w-4" />Submit</Button>{status && <p role="status" className="text-sm" data-testid="studio-runtime-status">{status}</p>}</form>}</CardContent></Card></main>;
}