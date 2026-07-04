import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import {
  FileText, Upload, Trash2, Download, Shield, ArrowRight,
  IdCard, Home, DollarSign, Heart, Scale, GraduationCap,
  Briefcase, FolderOpen, AlertCircle, CheckCircle2, Plus,
} from "lucide-react";

type Doc = {
  id: string;
  category: string;
  label: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  notes?: string;
  expiresAt?: string;
  uploadedAt: string;
};

const CATEGORIES = [
  { value: "identity",   label: "Identity",           icon: IdCard,       desc: "ID, birth certificate, passport, Social Security card" },
  { value: "housing",    label: "Housing",             icon: Home,         desc: "Lease, utility bills, eviction notice, housing voucher" },
  { value: "income",     label: "Income & Benefits",   icon: DollarSign,   desc: "Pay stubs, award letters, SNAP/Medicaid docs, W-2" },
  { value: "health",     label: "Health & Medical",    icon: Heart,        desc: "Insurance card, medical records, prescriptions, disability docs" },
  { value: "legal",      label: "Legal & Court",       icon: Scale,        desc: "Court orders, probation docs, custody papers, warrants cleared" },
  { value: "education",  label: "Education",           icon: GraduationCap, desc: "Transcripts, certificates, diplomas, IEP/504 plans" },
  { value: "employment", label: "Employment",          icon: Briefcase,    desc: "Resume, offer letters, credentials, licenses, background check" },
  { value: "other",      label: "Other",               icon: FolderOpen,   desc: "Anything else you need to keep safe" },
];

function categoryMeta(cat: string) {
  return CATEGORIES.find(c => c.value === cat) ?? CATEGORIES[CATEGORIES.length - 1];
}

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("identity");
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append("category", category);
      form.append("label", label || (file?.name ?? "Document"));
      if (notes) form.append("notes", notes);
      if (file) form.append("file", file);
      const res = await fetch("/api/my-documents", { method: "POST", body: form, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Document saved", description: "Your document is now stored securely." });
      setOpen(false);
      setLabel(""); setNotes(""); setFile(null); setCategory("identity");
      onSuccess();
    },
    onError: () => toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" data-testid="button-upload-document">
          <Plus className="h-4 w-4" /> Add Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Document type</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="select-doc-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value} data-testid={`option-cat-${c.value}`}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">{categoryMeta(category).desc}</p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Label (what is this?)</label>
            <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Texas ID, SNAP award letter, birth certificate" data-testid="input-doc-label" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Upload file</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.txt"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              data-testid="input-doc-file"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Notes (optional)</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes about this document…" rows={2} data-testid="input-doc-notes" />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-lg bg-muted/40">
            <Shield className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
            Your documents are stored in a private, encrypted vault. Only you can access them. We never share them without your explicit permission.
          </div>
          <Button className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending || (!file && !label)} data-testid="button-confirm-upload">
            {mutation.isPending ? "Saving…" : "Save Document"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DocCard({ doc, onDelete }: { doc: Doc; onDelete: (id: string) => void }) {
  const meta = categoryMeta(doc.category);
  const Icon = meta.icon;
  return (
    <Card className="border" data-testid={`card-doc-${doc.id}`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate" data-testid={`text-doc-label-${doc.id}`}>{doc.label}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
              {doc.fileSize && <span className="text-[11px] text-muted-foreground">{formatSize(doc.fileSize)}</span>}
              <span className="text-[11px] text-muted-foreground">Added {new Date(doc.uploadedAt).toLocaleDateString()}</span>
            </div>
            {doc.notes && <p className="text-xs text-muted-foreground mt-1 italic truncate">{doc.notes}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <a href={`/api/my-documents/${doc.id}/download`} target="_blank" rel="noopener noreferrer">
              <Button size="icon" variant="ghost" className="h-8 w-8" data-testid={`button-download-${doc.id}`} aria-label="Download">
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </a>
            <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-rose-600" onClick={() => onDelete(doc.id)} data-testid={`button-delete-doc-${doc.id}`} aria-label="Delete">
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyDocumentsPage() {
  const { isAuthenticated } = useAuth();
  const [filterCat, setFilterCat] = useState("all");
  const { toast } = useToast();

  const { data: docs = [], refetch } = useQuery<Doc[]>({
    queryKey: ["/api/my-documents"],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/my-documents/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/my-documents"] }); toast({ title: "Document removed" }); },
  });

  if (!isAuthenticated) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-16 text-center space-y-4" data-testid="page-documents-unauth">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
        <h1 className="text-2xl font-bold">My Document Vault</h1>
        <p className="text-muted-foreground max-w-md mx-auto">Store your important documents securely — ID, housing records, court papers, certificates. Only you can access them.</p>
        <a href="/api/login?returnTo=/my-documents">
          <Button className="gap-2" data-testid="button-signin-docs">Sign In to Open Your Vault <ArrowRight className="h-4 w-4" /></Button>
        </a>
      </div>
    );
  }

  const filtered = filterCat === "all" ? docs : docs.filter(d => d.category === filterCat);
  const byCategory: Record<string, number> = {};
  docs.forEach(d => { byCategory[d.category] = (byCategory[d.category] || 0) + 1; });

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8 pb-16 space-y-8" data-testid="page-my-documents">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" aria-hidden="true" /> My Document Vault
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Private. Encrypted. Only yours. Never shared without your permission.</p>
        </div>
        <UploadDialog onSuccess={refetch} />
      </div>

      {/* Category counts */}
      {docs.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="filter-doc-categories">
          <button
            onClick={() => setFilterCat("all")}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${filterCat === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
            data-testid="filter-all"
          >
            All ({docs.length})
          </button>
          {CATEGORIES.filter(c => byCategory[c.value]).map(c => (
            <button
              key={c.value}
              onClick={() => setFilterCat(c.value)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${filterCat === c.value ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
              data-testid={`filter-${c.value}`}
            >
              {c.label} ({byCategory[c.value]})
            </button>
          ))}
        </div>
      )}

      {/* Security notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-sm">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="font-semibold text-emerald-800 dark:text-emerald-300">Your vault is private.</p>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">Documents here are encrypted and stored in a private bucket. TCAF staff cannot view them. They are never included in grant reports or shared with funders. Only you can download or delete them.</p>
        </div>
      </div>

      {/* Docs list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3" data-testid="empty-state-documents">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto" aria-hidden="true" />
          <p className="font-semibold text-muted-foreground">{docs.length === 0 ? "Your vault is empty." : "No documents in this category."}</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {docs.length === 0
              ? "Upload your ID, housing documents, court records, certificates — anything important you might need later."
              : "Try a different category or upload your first document in this category."}
          </p>
          {docs.length === 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {["identity", "housing", "legal"].map(cat => {
                const m = categoryMeta(cat);
                return (
                  <Badge key={cat} variant="outline" className="text-xs cursor-default">
                    <m.icon className="h-3 w-3 mr-1" aria-hidden="true" />{m.label}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(doc => (
            <DocCard key={doc.id} doc={doc} onDelete={(id) => deleteMutation.mutate(id)} />
          ))}
        </div>
      )}

      {/* Tip */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-lg bg-muted/30 border">
        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" aria-hidden="true" />
        <span>
          <strong>Tip:</strong> Upload expired IDs, old documents, or documents that are hard to get again. They stay in your vault even after they expire, so you always have a copy when you need to prove something.
        </span>
      </div>
    </div>
  );
}
