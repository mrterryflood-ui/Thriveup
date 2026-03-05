import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  ArrowLeft,
  FileText,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Calendar,
  BookOpen,
  Filter,
  ListChecks,
  Clock,
  Paperclip,
  Upload,
  Download,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import type { CurriculumDocument, Level, Module } from "@shared/schema";

const GRADE_BANDS = ["3-5", "6-8", "9-12"] as const;
const DOCUMENT_TYPES = [
  { value: "curriculum_guide", label: "Curriculum Guide" },
  { value: "lesson_plan", label: "Lesson Plan" },
  { value: "scope_sequence", label: "Scope & Sequence" },
  { value: "assessment_rubric", label: "Assessment Rubric" },
  { value: "standards_alignment", label: "Standards Alignment" },
] as const;

function formatDocType(type: string): string {
  const found = DOCUMENT_TYPES.find((d) => d.value === type);
  return found ? found.label : type;
}

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function renderMarkdown(content: string) {
  const lines = content.split("\n");
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];
  let key = 0;

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key++} className="list-disc pl-6 space-y-1 my-2">
          {listItems.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  }

  function renderInline(text: string) {
    const parts: (string | JSX.Element)[] = [];
    let remaining = text;
    let inlineKey = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const italicMatch = remaining.match(/\*(.+?)\*/);

      const match = boldMatch && italicMatch
        ? (boldMatch.index! <= italicMatch.index! ? boldMatch : italicMatch)
        : boldMatch || italicMatch;

      if (!match || match.index === undefined) {
        parts.push(remaining);
        break;
      }

      if (match.index > 0) {
        parts.push(remaining.slice(0, match.index));
      }

      const isBold = match[0].startsWith("**");
      if (isBold) {
        parts.push(
          <strong key={inlineKey++} className="font-semibold">
            {match[1]}
          </strong>
        );
      } else {
        parts.push(
          <em key={inlineKey++} className="italic">
            {match[1]}
          </em>
        );
      }

      remaining = remaining.slice(match.index + match[0].length);
    }

    return <>{parts}</>;
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("- ")) {
      listItems.push(trimmed.slice(2));
      continue;
    }

    flushList();

    if (trimmed === "") {
      elements.push(<div key={key++} className="h-3" />);
    } else if (trimmed === "---") {
      elements.push(<hr key={key++} className="my-4 border-border" />);
    } else if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={key++} className="text-lg font-semibold mt-4 mb-2">
          {renderInline(trimmed.slice(4))}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={key++} className="text-xl font-semibold mt-5 mb-2">
          {renderInline(trimmed.slice(3))}
        </h2>
      );
    } else if (trimmed.startsWith("# ")) {
      elements.push(
        <h1 key={key++} className="text-2xl font-bold mt-6 mb-3">
          {renderInline(trimmed.slice(2))}
        </h1>
      );
    } else {
      elements.push(
        <p key={key++} className="text-sm leading-relaxed">
          {renderInline(trimmed)}
        </p>
      );
    }
  }

  flushList();

  return <div className="prose-content space-y-0">{elements}</div>;
}

export default function CurriculumDocumentsPage() {
  const [, navigate] = useLocation();

  const { data: documents, isLoading } = useQuery<CurriculumDocument[]>({
    queryKey: ["/api/curriculum-documents"],
  });

  const { data: levels } = useQuery<Level[]>({
    queryKey: ["/api/levels"],
  });

  const [filter, setFilter] = useState<string>("all");

  const filteredDocs = documents?.filter((doc) => {
    if (filter === "all") return true;
    if (filter.startsWith("level-")) {
      return doc.levelId === parseInt(filter.split("-")[1]);
    }
    if (filter.startsWith("grade-")) {
      return doc.gradeBand === filter.split("grade-")[1];
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-6 w-96 mb-8" />
        <div className="flex gap-2 mb-6 flex-wrap">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <Skeleton key={i} className="h-9 w-20" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-curriculum-docs-heading">
            Curriculum Documents
          </h1>
          <p className="text-muted-foreground">
            Standards-aligned curriculum guides, lesson plans, and assessment rubrics organized by level and grade band.
          </p>
        </div>
        <Link href="/curriculum-documents/new">
          <Button data-testid="button-create-document">
            <Plus className="mr-1.5 h-4 w-4" /> Create Document
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          data-testid="filter-all"
        >
          All
        </Button>
        {[1, 2, 3, 4, 5].map((lvl) => (
          <Button
            key={lvl}
            variant={filter === `level-${lvl}` ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(`level-${lvl}`)}
            data-testid={`filter-level-${lvl}`}
          >
            Level {lvl}
          </Button>
        ))}
        {GRADE_BANDS.map((band) => (
          <Button
            key={band}
            variant={filter === `grade-${band}` ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(`grade-${band}`)}
            data-testid={`filter-grade-${band}`}
          >
            Grades {band}
          </Button>
        ))}
      </div>

      {filteredDocs && filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <Card
              key={doc.id}
              className="p-5 flex flex-col"
              data-testid={`card-document-${doc.id}`}
            >
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge variant="secondary">{doc.gradeBand}</Badge>
                <Badge variant="outline">{formatDocType(doc.documentType)}</Badge>
              </div>
              <h3 className="font-semibold mb-2 line-clamp-2" data-testid={`text-doc-title-${doc.id}`}>
                {doc.title}
              </h3>
              {doc.levelId && levels && (
                <p className="text-xs text-muted-foreground mb-1">
                  Level {doc.levelId}: {levels.find((l) => l.id === doc.levelId)?.title}
                </p>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-auto pt-3">
                <Calendar className="h-3 w-3" />
                {formatDate(doc.createdAt)}
              </p>
              <Link href={`/curriculum-documents/${doc.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  data-testid={`button-view-doc-${doc.id}`}
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-10 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2" data-testid="text-empty-state">
            No curriculum documents yet
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first curriculum document to get started with standards-aligned guides, lesson plans, and more.
          </p>
          <Link href="/curriculum-documents/new">
            <Button data-testid="button-create-first-document">
              <Plus className="mr-1.5 h-4 w-4" /> Create Your First Document
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

export function CurriculumDocumentViewPage() {
  const params = useParams<{ id: string }>();
  const docId = params.id || "";
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const { data: doc, isLoading } = useQuery<CurriculumDocument>({
    queryKey: ["/api/curriculum-documents", docId],
  });

  const { data: levels } = useQuery<Level[]>({
    queryKey: ["/api/levels"],
  });

  const { data: linkedModule } = useQuery<Module>({
    queryKey: ["/api/modules", doc?.moduleId || ""],
    enabled: !!doc?.moduleId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/curriculum-documents/${docId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/curriculum-documents"] });
      toast({ title: "Document deleted" });
      navigate("/curriculum-documents");
    },
    onError: (err: Error) => {
      toast({ title: "Error deleting document", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!doc) return null;

  if (isEditing) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6"
          onClick={() => setIsEditing(false)}
          data-testid="button-cancel-edit"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Document
        </Button>
        <h1 className="text-2xl font-bold mb-6" data-testid="text-edit-heading">
          Edit Document
        </h1>
        <DocumentForm
          existingDoc={doc}
          onSuccess={() => {
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ["/api/curriculum-documents", docId] });
          }}
        />
      </div>
    );
  }

  const levelInfo = doc.levelId ? levels?.find((l) => l.id === doc.levelId) : null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/curriculum-documents">
        <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-browse">
          <ArrowLeft className="mr-1 h-4 w-4" /> All Documents
        </Button>
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge variant="secondary" data-testid="badge-grade-band">{doc.gradeBand}</Badge>
          <Badge variant="outline" data-testid="badge-doc-type">{formatDocType(doc.documentType)}</Badge>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-3" data-testid="text-doc-title">
          {doc.title}
        </h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          {doc.createdAt && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> Created {formatDate(doc.createdAt)}
            </span>
          )}
          {doc.updatedAt && doc.updatedAt !== doc.createdAt && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> Updated {formatDate(doc.updatedAt)}
            </span>
          )}
        </div>
      </div>

      {(levelInfo || linkedModule) && (
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <BookOpen className="h-4 w-4 text-primary shrink-0" />
            {levelInfo && (
              <Link href={`/curriculum/${levelInfo.id}`}>
                <span className="text-sm hover:underline cursor-pointer" data-testid="link-level">
                  Level {levelInfo.id}: {levelInfo.title}
                </span>
              </Link>
            )}
            {linkedModule && (
              <Link href={`/module/${linkedModule.id}`}>
                <span className="text-sm hover:underline cursor-pointer" data-testid="link-module">
                  {linkedModule.title}
                </span>
              </Link>
            )}
          </div>
        </Card>
      )}

      {doc.standardsAlignment && doc.standardsAlignment.length > 0 && (
        <Card className="p-4 mb-6">
          <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm">
            <ListChecks className="h-4 w-4 text-primary" /> Standards Alignment
          </h3>
          <ul className="space-y-1">
            {doc.standardsAlignment.map((std, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {std}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-6 mb-6" data-testid="document-content">
        {renderMarkdown(doc.content)}
      </Card>

      <DocumentAttachments docId={docId} />

      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="outline"
          onClick={() => setIsEditing(true)}
          data-testid="button-edit-document"
        >
          <Pencil className="mr-1.5 h-4 w-4" /> Edit
        </Button>
        <Button
          variant="destructive"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          data-testid="button-delete-document"
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          {deleteMutation.isPending ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </div>
  );
}

interface DocumentAttachment {
  id: string;
  documentId: string | null;
  fileName: string;
  fileSize: number;
  contentType: string;
  objectPath: string;
  uploadedBy: string | null;
  uploadedAt: string | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function DocumentAttachments({ docId }: { docId: string }) {
  const { toast } = useToast();
  const { uploadFile, isUploading } = useUpload({
    onError: (err) => toast({ title: "Upload failed", description: err.message, variant: "destructive" }),
  });

  const { data: attachments, isLoading } = useQuery<DocumentAttachment[]>({
    queryKey: ["/api/curriculum-documents", docId, "attachments"],
  });

  const saveMutation = useMutation({
    mutationFn: async (meta: { fileName: string; fileSize: number; contentType: string; objectPath: string }) => {
      const res = await apiRequest("POST", `/api/curriculum-documents/${docId}/attachments`, meta);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/curriculum-documents", docId, "attachments"] });
      toast({ title: "File attached successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      await apiRequest("DELETE", `/api/curriculum-documents/${docId}/attachments/${attachmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/curriculum-documents", docId, "attachments"] });
      toast({ title: "Attachment removed" });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadFile(file);
    if (result) {
      saveMutation.mutate({
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type || "application/octet-stream",
        objectPath: result.objectPath,
      });
    }
    e.target.value = "";
  };

  return (
    <Card className="p-5 mb-6" data-testid="card-attachments">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <h3 className="font-semibold flex items-center gap-2 text-sm">
          <Paperclip className="h-4 w-4 text-primary" /> Attachments
        </h3>
        <label>
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading || saveMutation.isPending}
            data-testid="input-file-upload"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={isUploading || saveMutation.isPending}
            onClick={(e) => {
              const input = (e.currentTarget as HTMLElement).parentElement?.querySelector("input[type=file]") as HTMLInputElement;
              input?.click();
            }}
            data-testid="button-upload-file"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            {isUploading ? "Uploading..." : "Upload File"}
          </Button>
        </label>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : attachments && attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-muted/40"
              data-testid={`attachment-row-${att.id}`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <a
                    href={att.objectPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline truncate block"
                    data-testid={`link-attachment-${att.id}`}
                  >
                    {att.fileName}
                  </a>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(att.fileSize)} &middot; {att.contentType}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <a href={att.objectPath} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="ghost" data-testid={`button-download-${att.id}`} aria-label={`Download ${att.fileName}`}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </a>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(att.id)}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-attachment-${att.id}`}
                  aria-label={`Delete ${att.fileName}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-attachments">
          No files attached yet. Upload PDFs, images, or other documents.
        </p>
      )}
    </Card>
  );
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  gradeBand: z.string().min(1, "Grade band is required"),
  documentType: z.string().min(1, "Document type is required"),
  levelId: z.string().optional(),
  moduleId: z.string().optional(),
  standardsAlignment: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function DocumentForm({
  existingDoc,
  onSuccess,
}: {
  existingDoc?: CurriculumDocument;
  onSuccess?: () => void;
}) {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: levels } = useQuery<Level[]>({
    queryKey: ["/api/levels"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: existingDoc?.title || "",
      content: existingDoc?.content || "",
      gradeBand: existingDoc?.gradeBand || "3-5",
      documentType: existingDoc?.documentType || "curriculum_guide",
      levelId: existingDoc?.levelId?.toString() || "",
      moduleId: existingDoc?.moduleId || "",
      standardsAlignment: existingDoc?.standardsAlignment?.join(", ") || "",
    },
  });

  const selectedLevelId = form.watch("levelId");

  const { data: levelModules } = useQuery<Module[]>({
    queryKey: ["/api/levels", parseInt(selectedLevelId || "0"), "modules"],
    enabled: !!selectedLevelId && selectedLevelId !== "",
  });

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const body = {
        title: values.title,
        content: values.content,
        gradeBand: values.gradeBand,
        documentType: values.documentType,
        levelId: values.levelId ? parseInt(values.levelId) : null,
        moduleId: values.moduleId || null,
        standardsAlignment: values.standardsAlignment
          ? values.standardsAlignment.split(",").map((s) => s.trim()).filter(Boolean)
          : null,
      };

      if (existingDoc) {
        const res = await apiRequest("PATCH", `/api/curriculum-documents/${existingDoc.id}`, body);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/curriculum-documents", body);
        return res.json();
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/curriculum-documents"] });
      toast({ title: existingDoc ? "Document updated" : "Document created" });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(`/curriculum-documents/${data.id}`);
      }
    },
    onError: (err: Error) => {
      toast({ title: "Error saving document", description: err.message, variant: "destructive" });
    },
  });

  function onSubmit(values: FormValues) {
    createMutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter document title"
                  {...field}
                  data-testid="input-title"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content (Markdown)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write your curriculum document content using markdown..."
                  className="min-h-[300px] resize-y"
                  {...field}
                  data-testid="input-content"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="gradeBand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grade Band</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-grade-band">
                      <SelectValue placeholder="Select grade band" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {GRADE_BANDS.map((band) => (
                      <SelectItem key={band} value={band}>
                        Grades {band}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="documentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Document Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-document-type">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((dt) => (
                      <SelectItem key={dt.value} value={dt.value}>
                        {dt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="levelId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Level (Optional)</FormLabel>
                <Select
                  onValueChange={(val) => {
                    field.onChange(val);
                    form.setValue("moduleId", "");
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-level">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No Level</SelectItem>
                    {levels?.map((level) => (
                      <SelectItem key={level.id} value={level.id.toString()}>
                        Level {level.id}: {level.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="moduleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Module (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedLevelId || selectedLevelId === "none"}>
                  <FormControl>
                    <SelectTrigger data-testid="select-module">
                      <SelectValue placeholder={selectedLevelId && selectedLevelId !== "none" ? "Select module" : "Select a level first"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No Module</SelectItem>
                    {levelModules?.map((mod) => (
                      <SelectItem key={mod.id} value={mod.id}>
                        {mod.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="standardsAlignment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Standards Alignment (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., CSTA 1A-CS-01, ISTE 1.1, NGSS K-2-ETS1-1"
                  {...field}
                  data-testid="input-standards"
                />
              </FormControl>
              <p className="text-xs text-muted-foreground mt-1">
                Enter comma-separated standard codes
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            type="submit"
            disabled={createMutation.isPending}
            data-testid="button-submit-document"
          >
            {createMutation.isPending
              ? "Saving..."
              : existingDoc
              ? "Update Document"
              : "Create Document"}
          </Button>
          {!existingDoc && (
            <Link href="/curriculum-documents">
              <Button variant="outline" type="button" data-testid="button-cancel-create">
                Cancel
              </Button>
            </Link>
          )}
        </div>
      </form>
    </Form>
  );
}

export function CurriculumDocumentCreatePage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/curriculum-documents">
        <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-from-create">
          <ArrowLeft className="mr-1 h-4 w-4" /> All Documents
        </Button>
      </Link>
      <h1 className="text-2xl font-bold mb-6" data-testid="text-create-heading">
        Create Curriculum Document
      </h1>
      <DocumentForm />
    </div>
  );
}

