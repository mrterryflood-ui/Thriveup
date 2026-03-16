import { useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  X,
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export interface UploadedFile {
  name: string;
  size: number;
  contentType: string;
  objectPath: string;
}

interface MultiFileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
  label?: string;
}

type FileStatus = "pending" | "uploading" | "complete" | "error";

interface TrackedFile {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
  objectPath?: string;
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp", "ico"].includes(ext))
    return FileImage;
  if (["mp4", "mov", "avi", "mkv", "webm", "flv"].includes(ext))
    return FileVideo;
  if (["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(ext))
    return FileAudio;
  if (["zip", "rar", "7z", "tar", "gz", "bz2"].includes(ext))
    return FileArchive;
  if (["js", "ts", "tsx", "jsx", "py", "java", "cpp", "c", "go", "rs", "html", "css", "json", "xml"].includes(ext))
    return FileCode;
  if (["pdf", "doc", "docx", "txt", "rtf", "odt", "xls", "xlsx", "ppt", "pptx", "csv"].includes(ext))
    return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

let fileIdCounter = 0;

export function MultiFileUpload({
  onFilesUploaded,
  maxFiles = 10,
  maxSizeMB = 25,
  accept = "*/*",
  label = "Upload Files",
}: MultiFileUploadProps) {
  const [trackedFiles, setTrackedFiles] = useState<TrackedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const filesArray = Array.from(newFiles);
      setTrackedFiles((prev) => {
        const remaining = maxFiles - prev.length;
        if (remaining <= 0) return prev;
        const toAdd = filesArray.slice(0, remaining).map((file) => ({
          id: `file-${++fileIdCounter}`,
          file,
          status: "pending" as FileStatus,
          progress: 0,
          error:
            file.size > maxSizeBytes
              ? `File exceeds ${maxSizeMB}MB limit`
              : undefined,
        }));
        toAdd.forEach((tf) => {
          if (tf.error) tf.status = "error";
        });
        return [...prev, ...toAdd];
      });
    },
    [maxFiles, maxSizeBytes, maxSizeMB],
  );

  const removeFile = useCallback((id: string) => {
    setTrackedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        e.target.value = "";
      }
    },
    [addFiles],
  );

  const uploadAllFiles = useCallback(async () => {
    const pendingFiles = trackedFiles.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    const uploadedResults: UploadedFile[] = [];

    for (const tf of pendingFiles) {
      setTrackedFiles((prev) =>
        prev.map((f) =>
          f.id === tf.id ? { ...f, status: "uploading", progress: 30 } : f,
        ),
      );

      try {
        const res = await apiRequest("POST", "/api/uploads/request-url", {
          name: tf.file.name,
          size: tf.file.size,
          contentType: tf.file.type || "application/octet-stream",
        });
        const { uploadURL, objectPath } = await res.json();

        setTrackedFiles((prev) =>
          prev.map((f) => (f.id === tf.id ? { ...f, progress: 60 } : f)),
        );

        await fetch(uploadURL, {
          method: "PUT",
          body: tf.file,
          headers: {
            "Content-Type": tf.file.type || "application/octet-stream",
          },
        });

        setTrackedFiles((prev) =>
          prev.map((f) =>
            f.id === tf.id
              ? { ...f, status: "complete", progress: 100, objectPath }
              : f,
          ),
        );

        uploadedResults.push({
          name: tf.file.name,
          size: tf.file.size,
          contentType: tf.file.type || "application/octet-stream",
          objectPath,
        });
      } catch (err: any) {
        setTrackedFiles((prev) =>
          prev.map((f) =>
            f.id === tf.id
              ? {
                  ...f,
                  status: "error",
                  progress: 0,
                  error: err?.message || "Upload failed",
                }
              : f,
          ),
        );
      }
    }

    setIsUploading(false);
    if (uploadedResults.length > 0) {
      onFilesUploaded(uploadedResults);
    }
  }, [trackedFiles, onFilesUploaded]);

  const pendingCount = trackedFiles.filter((f) => f.status === "pending").length;
  const completeCount = trackedFiles.filter((f) => f.status === "complete").length;

  return (
    <div className="space-y-4" data-testid="multi-file-upload">
      <div
        className={`border-2 border-dashed rounded-md p-6 text-center transition-colors cursor-pointer ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover-elevate"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        data-testid="dropzone-area"
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium mb-1">{label}</p>
        <p className="text-xs text-muted-foreground">
          Drag & drop files here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Max {maxFiles} files, up to {maxSizeMB}MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          data-testid="input-file-picker"
        />
      </div>

      {trackedFiles.length > 0 && (
        <div className="space-y-2" data-testid="file-list">
          {trackedFiles.map((tf) => {
            const Icon = getFileIcon(tf.file.name);
            return (
              <Card
                key={tf.id}
                className="p-3 flex items-center gap-3"
                data-testid={`file-item-${tf.id}`}
              >
                <Icon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    data-testid={`text-filename-${tf.id}`}
                  >
                    {tf.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(tf.file.size)}
                  </p>
                  {tf.status === "uploading" && (
                    <Progress
                      value={tf.progress}
                      className="h-1.5 mt-1"
                      data-testid={`progress-${tf.id}`}
                    />
                  )}
                  {tf.status === "error" && tf.error && (
                    <p
                      className="text-xs text-destructive mt-0.5"
                      data-testid={`text-error-${tf.id}`}
                    >
                      {tf.error}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {tf.status === "uploading" && (
                    <Loader2
                      className="h-4 w-4 animate-spin text-muted-foreground"
                      data-testid={`icon-uploading-${tf.id}`}
                    />
                  )}
                  {tf.status === "complete" && (
                    <CheckCircle2
                      className="h-4 w-4 text-emerald-500"
                      data-testid={`icon-complete-${tf.id}`}
                    />
                  )}
                  {tf.status === "error" && (
                    <AlertCircle
                      className="h-4 w-4 text-destructive"
                      data-testid={`icon-error-${tf.id}`}
                    />
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(tf.id);
                    }}
                    disabled={tf.status === "uploading"}
                    data-testid={`button-remove-${tf.id}`}
                    aria-label={`Remove file ${tf.file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {trackedFiles.length > 0 && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs text-muted-foreground" data-testid="text-upload-summary">
            {trackedFiles.length} file{trackedFiles.length !== 1 ? "s" : ""} selected
            {completeCount > 0 && ` (${completeCount} uploaded)`}
          </p>
          {pendingCount > 0 && (
            <Button
              size="sm"
              onClick={uploadAllFiles}
              disabled={isUploading}
              data-testid="button-upload-all"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-1" />
                  Upload {pendingCount} file{pendingCount !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
