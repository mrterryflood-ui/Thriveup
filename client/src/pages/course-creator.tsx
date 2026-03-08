import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
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
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  BookOpen,
  Plus,
  ArrowLeft,
  Trash2,
  Edit3,
  Users,
  Layers,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Globe,
  Eye,
  EyeOff,
  Clock,
  Video,
  FileText,
  HelpCircle,
  Zap,
  CheckCircle2,
  Briefcase,
  Heart,
  TrendingUp,
  Monitor,
  Dumbbell,
  Building2,
  HandHeart,
  Palette,
  DollarSign,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ErrorRetry } from "@/components/error-retry";
import type { AcademyCourse, CourseModule, CourseLesson, CourseEnrollment } from "@shared/schema";

const CATEGORIES = [
  { value: "all", label: "All", icon: Globe },
  { value: "coaching", label: "Coaching", icon: Users },
  { value: "creators", label: "Creators", icon: Palette },
  { value: "customer-training", label: "Customer Training", icon: Briefcase },
  { value: "enterprise-lms", label: "Enterprise LMS", icon: Building2 },
  { value: "finance", label: "Finance", icon: DollarSign },
  { value: "fitness", label: "Fitness", icon: Dumbbell },
  { value: "health", label: "Health", icon: Heart },
  { value: "non-profit", label: "Non-profit", icon: HandHeart },
  { value: "education", label: "Education", icon: GraduationCap },
  { value: "technology", label: "Technology", icon: Monitor },
];

const CONTENT_TYPE_CONFIG: Record<string, { icon: typeof FileText; label: string }> = {
  text: { icon: FileText, label: "Text" },
  video: { icon: Video, label: "Video" },
  quiz: { icon: HelpCircle, label: "Quiz" },
  interactive: { icon: Zap, label: "Interactive" },
};

interface CourseWithDetails extends AcademyCourse {
  modules: (CourseModule & { lessons: CourseLesson[] })[];
  enrollments: CourseEnrollment[];
}

function LoadingSkeleton() {

  useEffect(() => { document.title = "Course Creator | AI Mastery Academy"; }, []);
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Skeleton className="h-20 w-full rounded-md" />
      <Skeleton className="h-10 w-96" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}

function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6" data-testid="step-indicator">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
              i < currentStep
                ? "bg-primary text-primary-foreground"
                : i === currentStep
                ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                : "bg-muted text-muted-foreground"
            }`}
            data-testid={`step-${i}`}
          >
            {i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
          </div>
          {i < totalSteps - 1 && (
            <div className={`w-12 h-0.5 transition-all duration-300 ${i < currentStep ? "bg-primary" : "bg-muted"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function CreateCourseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [instructorName, setInstructorName] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/admin/courses", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({ title: "Course Created", description: "Your new course has been created successfully." });
      resetAndClose();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create course. Please try again.", variant: "destructive" });
    },
  });

  function resetAndClose() {
    setStep(0);
    setSelectedCategory("");
    setTitle("");
    setDescription("");
    setDifficulty("beginner");
    setInstructorName("");
    setTouched({});
    onOpenChange(false);
  }

  function handleCreate() {
    if (!title.trim() || !selectedCategory) return;
    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      category: selectedCategory,
      difficultyLevel: difficulty,
      createdByName: instructorName.trim() || "Admin",
      createdBy: "admin",
      status: "draft",
      visibility: "private",
      pricingType: "free",
      currency: "USD",
      sortOrder: 0,
      certificateEnabled: false,
    });
  }

  const categoryOptions = CATEGORIES.filter((c) => c.value !== "all");

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetAndClose(); else onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-create-course-title">Create New Course</DialogTitle>
        </DialogHeader>

        <StepIndicator currentStep={step} totalSteps={3} />

        {step === 0 && (
          <div data-testid="section-step-category">
            <h3 className="font-semibold mb-4">Select a Category</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categoryOptions.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Card
                    key={cat.value}
                    className={`cursor-pointer hover-elevate p-4 text-center transition-all ${
                      selectedCategory === cat.value ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedCategory(cat.value)}
                    data-testid={`card-category-${cat.value}`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{cat.label}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
            {touched.category && !selectedCategory && (
              <p className="text-sm text-destructive mt-3" data-testid="error-category">Please select a category to continue</p>
            )}
            <div className="flex justify-end mt-6 gap-3">
              <Button variant="outline" onClick={resetAndClose} data-testid="button-cancel-create">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!selectedCategory) {
                    setTouched((p) => ({ ...p, category: true }));
                    return;
                  }
                  setStep(1);
                }}
                data-testid="button-next-step-1"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4" data-testid="section-step-details">
            <h3 className="font-semibold mb-2">Course Details</h3>
            <div>
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, title: true }))}
                placeholder="Enter course title"
                data-testid="input-create-title"
                aria-invalid={!!(touched.title && !title.trim())}
              />
              {touched.title && !title.trim() && (
                <p className="text-sm text-destructive mt-1" data-testid="error-create-title">Course title is required</p>
              )}
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your course"
                rows={3}
                data-testid="input-create-description"
              />
            </div>
            <div>
              <Label>Instructor Name</Label>
              <Input
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                placeholder="Instructor name"
                data-testid="input-create-instructor"
              />
            </div>
            <div>
              <Label>Difficulty Level</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger data-testid="select-create-difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(0)} data-testid="button-back-step-0">
                Back
              </Button>
              <Button
                onClick={() => {
                  if (!title.trim()) {
                    setTouched((p) => ({ ...p, title: true }));
                    return;
                  }
                  setStep(2);
                }}
                data-testid="button-next-step-2"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div data-testid="section-step-confirm">
            <h3 className="font-semibold mb-4">Confirm Course</h3>
            <Card className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Title</span>
                <span className="font-medium" data-testid="text-confirm-title">{title}</span>
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Category</span>
                <Badge variant="secondary" data-testid="text-confirm-category">{selectedCategory}</Badge>
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Difficulty</span>
                <span className="capitalize" data-testid="text-confirm-difficulty">{difficulty}</span>
              </div>
              {instructorName && (
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Instructor</span>
                  <span data-testid="text-confirm-instructor">{instructorName}</span>
                </div>
              )}
              {description && (
                <div className="pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Description</span>
                  <p className="text-sm mt-1" data-testid="text-confirm-description">{description}</p>
                </div>
              )}
            </Card>
            <div className="flex justify-between gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(1)} data-testid="button-back-step-1">
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                data-testid="button-confirm-create"
              >
                {createMutation.isPending ? "Creating..." : "Create Course"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LessonEditDialog({
  open,
  onOpenChange,
  lesson,
  moduleId,
  existingLessonCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: CourseLesson | null;
  moduleId: string;
  existingLessonCount: number;
}) {
  const { toast } = useToast();
  const [lessonTitle, setLessonTitle] = useState(lesson?.title ?? "");
  const [contentType, setContentType] = useState(lesson?.contentType ?? "text");
  const [content, setContent] = useState(lesson?.content ?? "");
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl ?? "");
  const [estimatedMinutes, setEstimatedMinutes] = useState(lesson?.estimatedMinutes?.toString() ?? "");
  const [lessonTouched, setLessonTouched] = useState<Record<string, boolean>>({});

  const isEditing = !!lesson;

  const createLessonMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", `/api/admin/courses/modules/${moduleId}/lessons`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({ title: "Lesson Created" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create lesson.", variant: "destructive" });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("PATCH", `/api/admin/courses/lessons/${lesson!.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({ title: "Lesson Updated" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update lesson.", variant: "destructive" });
    },
  });

  function handleSave() {
    if (!lessonTitle.trim()) {
      setLessonTouched((p) => ({ ...p, lessonTitle: true }));
      return;
    }
    const data: Record<string, unknown> = {
      title: lessonTitle.trim(),
      contentType,
      content: content.trim(),
      videoUrl: videoUrl.trim() || null,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
    };
    if (isEditing) {
      updateLessonMutation.mutate(data);
    } else {
      createLessonMutation.mutate({
        ...data,
        moduleId,
        sortOrder: existingLessonCount,
        isPublished: false,
      });
    }
  }

  const isPending = createLessonMutation.isPending || updateLessonMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-lesson-dialog-title">
            {isEditing ? "Edit Lesson" : "Add Lesson"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              onBlur={() => setLessonTouched((p) => ({ ...p, lessonTitle: true }))}
              placeholder="Lesson title"
              data-testid="input-lesson-title"
              aria-invalid={!!(lessonTouched.lessonTitle && !lessonTitle.trim())}
            />
            {lessonTouched.lessonTitle && !lessonTitle.trim() && (
              <p className="text-sm text-destructive mt-1" data-testid="error-lesson-title">Lesson title is required</p>
            )}
          </div>
          <div>
            <Label>Content Type</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger data-testid="select-lesson-content-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="interactive">Interactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Lesson content"
              rows={5}
              data-testid="input-lesson-content"
            />
          </div>
          {(contentType === "video") && (
            <div>
              <Label>Video URL</Label>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://..."
                data-testid="input-lesson-video-url"
              />
            </div>
          )}
          <div>
            <Label>Estimated Minutes</Label>
            <Input
              type="number"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              placeholder="e.g. 15"
              data-testid="input-lesson-minutes"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-lesson">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending || !lessonTitle.trim()} data-testid="button-save-lesson">
              {isPending ? "Saving..." : isEditing ? "Update Lesson" : "Add Lesson"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CourseEditor({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const { toast } = useToast();
  const [editorTab, setEditorTab] = useState("details");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newModuleDescription, setNewModuleDescription] = useState("");
  const [editorTouched, setEditorTouched] = useState<Record<string, boolean>>({});
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null);
  const [activeLessonModuleId, setActiveLessonModuleId] = useState("");

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCoverImage, setEditCoverImage] = useState("");
  const [editInstructor, setEditInstructor] = useState("");
  const [editDifficulty, setEditDifficulty] = useState("beginner");
  const [editPrice, setEditPrice] = useState("");
  const [editPublished, setEditPublished] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);

  const { data: course, isLoading } = useQuery<CourseWithDetails>({
    queryKey: ["/api/admin/courses", courseId],
  });

  if (course && !formInitialized) {
    setEditTitle(course.title);
    setEditDescription(course.description);
    setEditCategory(course.category);
    setEditCoverImage(course.coverImage ?? "");
    setEditInstructor(course.createdByName ?? "");
    setEditDifficulty(course.difficultyLevel ?? "beginner");
    setEditPrice(course.price?.toString() ?? "");
    setEditPublished(course.status === "published");
    setFormInitialized(true);
  }

  const updateCourseMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("PATCH", `/api/admin/courses/${courseId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId] });
      toast({ title: "Course Updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update course.", variant: "destructive" });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/admin/courses/${courseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({ title: "Course Deleted" });
      onBack();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete course.", variant: "destructive" });
    },
  });

  const createModuleMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", `/api/admin/courses/${courseId}/modules`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId] });
      toast({ title: "Module Created" });
      setNewModuleTitle("");
      setNewModuleDescription("");
      setShowAddModule(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create module.", variant: "destructive" });
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/courses/modules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId] });
      toast({ title: "Module Deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete module.", variant: "destructive" });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/courses/lessons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses", courseId] });
      toast({ title: "Lesson Deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete lesson.", variant: "destructive" });
    },
  });

  function toggleModule(moduleId: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  function handleSaveDetails() {
    if (!editTitle.trim()) {
      setEditorTouched((p) => ({ ...p, editTitle: true }));
      toast({ title: "Validation Error", description: "Course title is required.", variant: "destructive" });
      return;
    }
    updateCourseMutation.mutate({
      title: editTitle.trim(),
      description: editDescription.trim(),
      category: editCategory,
      coverImage: editCoverImage.trim() || null,
      createdByName: editInstructor.trim(),
      difficultyLevel: editDifficulty,
      price: editPrice ? parseFloat(editPrice) : null,
      status: editPublished ? "published" : "draft",
      publishedAt: editPublished ? new Date().toISOString() : null,
    });
  }

  function handleTogglePublish() {
    const newStatus = course?.status === "published" ? "draft" : "published";
    updateCourseMutation.mutate({
      status: newStatus,
      publishedAt: newStatus === "published" ? new Date().toISOString() : null,
    });
  }

  function handleAddModule() {
    if (!newModuleTitle.trim()) {
      setEditorTouched((p) => ({ ...p, moduleTitle: true }));
      return;
    }
    setEditorTouched((p) => ({ ...p, moduleTitle: false }));
    createModuleMutation.mutate({
      title: newModuleTitle.trim(),
      description: newModuleDescription.trim() || null,
      sortOrder: course?.modules?.length ?? 0,
      isPublished: false,
    });
  }

  function openLessonDialog(moduleId: string, lesson?: CourseLesson) {
    setActiveLessonModuleId(moduleId);
    setEditingLesson(lesson ?? null);
    setLessonDialogOpen(true);
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Button variant="ghost" onClick={onBack} data-testid="button-back-not-found">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <p className="text-muted-foreground mt-4">Course not found.</p>
      </div>
    );
  }

  const moduleCount = course.modules?.length ?? 0;
  const enrollmentCount = course.enrollments?.length ?? 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Button variant="ghost" onClick={onBack} className="mb-4" data-testid="button-back-to-list">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Courses
      </Button>

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold" data-testid="text-course-editor-title">{course.title}</h1>
          <Badge variant={course.status === "published" ? "default" : "secondary"} data-testid="badge-course-status">
            {course.status === "published" ? "Published" : "Draft"}
          </Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleTogglePublish}
            disabled={updateCourseMutation.isPending}
            data-testid="button-toggle-publish"
          >
            {course.status === "published" ? (
              <><EyeOff className="h-4 w-4 mr-2" /> Unpublish</>
            ) : (
              <><Eye className="h-4 w-4 mr-2" /> Publish</>
            )}
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteCourseMutation.mutate()}
            disabled={deleteCourseMutation.isPending}
            data-testid="button-delete-course"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      <Tabs value={editorTab} onValueChange={setEditorTab} data-testid="tabs-course-editor">
        <TabsList className="mb-6 flex-wrap" data-testid="tabs-editor-list">
          <TabsTrigger value="details" data-testid="tab-details">
            <FileText className="h-4 w-4 mr-1.5" /> Details
          </TabsTrigger>
          <TabsTrigger value="modules" data-testid="tab-modules">
            <Layers className="h-4 w-4 mr-1.5" /> Modules & Lessons
          </TabsTrigger>
          <TabsTrigger value="enrollments" data-testid="tab-enrollments">
            <Users className="h-4 w-4 mr-1.5" /> Enrollments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card className="p-6" data-testid="card-course-details">
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => setEditorTouched((p) => ({ ...p, editTitle: true }))}
                  data-testid="input-edit-title"
                  aria-invalid={!!(editorTouched.editTitle && !editTitle.trim())}
                />
                {editorTouched.editTitle && !editTitle.trim() && (
                  <p className="text-sm text-destructive mt-1" data-testid="error-edit-title">Course title is required</p>
                )}
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  data-testid="input-edit-description"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger data-testid="select-edit-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter((c) => c.value !== "all").map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <Select value={editDifficulty} onValueChange={setEditDifficulty}>
                    <SelectTrigger data-testid="select-edit-difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Thumbnail URL</Label>
                <Input
                  value={editCoverImage}
                  onChange={(e) => setEditCoverImage(e.target.value)}
                  placeholder="https://..."
                  data-testid="input-edit-thumbnail"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Instructor Name</Label>
                  <Input
                    value={editInstructor}
                    onChange={(e) => setEditInstructor(e.target.value)}
                    data-testid="input-edit-instructor"
                  />
                </div>
                <div>
                  <Label>Price</Label>
                  <Input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="0.00 (free)"
                    data-testid="input-edit-price"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={editPublished}
                  onCheckedChange={setEditPublished}
                  data-testid="switch-edit-published"
                />
                <Label>Published</Label>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveDetails}
                  disabled={updateCourseMutation.isPending}
                  data-testid="button-save-details"
                >
                  {updateCourseMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="modules">
          <div className="space-y-4" data-testid="section-modules">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" /> Modules ({moduleCount})
              </h2>
              <Button onClick={() => setShowAddModule(!showAddModule)} data-testid="button-add-module">
                <Plus className="h-4 w-4 mr-2" /> Add Module
              </Button>
            </div>

            {showAddModule && (
              <Card className="p-4" data-testid="card-add-module-form">
                <div className="space-y-3">
                  <div>
                    <Input
                      value={newModuleTitle}
                      onChange={(e) => setNewModuleTitle(e.target.value)}
                      onBlur={() => setEditorTouched((p) => ({ ...p, moduleTitle: true }))}
                      placeholder="Module title"
                      data-testid="input-new-module-title"
                      aria-invalid={!!(editorTouched.moduleTitle && !newModuleTitle.trim())}
                    />
                    {editorTouched.moduleTitle && !newModuleTitle.trim() && (
                      <p className="text-sm text-destructive mt-1" data-testid="error-module-title">Module title is required</p>
                    )}
                  </div>
                  <Input
                    value={newModuleDescription}
                    onChange={(e) => setNewModuleDescription(e.target.value)}
                    placeholder="Module description (optional)"
                    data-testid="input-new-module-description"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddModule(false)} data-testid="button-cancel-module">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddModule}
                      disabled={createModuleMutation.isPending || !newModuleTitle.trim()}
                      data-testid="button-save-module"
                    >
                      {createModuleMutation.isPending ? "Adding..." : "Add Module"}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {(course.modules ?? []).length === 0 ? (
              <Card className="p-8 text-center" data-testid="card-no-modules">
                <Layers className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No modules yet. Add your first module to get started.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {(course.modules ?? []).map((mod, modIdx) => {
                  const isExpanded = expandedModules.has(mod.id);
                  const lessonCount = mod.lessons?.length ?? 0;
                  return (
                    <Card key={mod.id} className="overflow-visible" data-testid={`card-module-${mod.id}`}>
                      <div
                        className="flex items-center gap-3 p-4 cursor-pointer hover-elevate"
                        onClick={() => toggleModule(mod.id)}
                        data-testid={`button-toggle-module-${mod.id}`}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium" data-testid={`text-module-title-${mod.id}`}>
                              {modIdx + 1}. {mod.title}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
                            </Badge>
                          </div>
                          {mod.description && (
                            <p className="text-sm text-muted-foreground mt-0.5 truncate">
                              {mod.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openLessonDialog(mod.id)}
                            data-testid={`button-add-lesson-${mod.id}`}
                            aria-label="Add lesson"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteModuleMutation.mutate(mod.id)}
                            data-testid={`button-delete-module-${mod.id}`}
                            aria-label="Delete module"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t px-4 pb-4">
                          {lessonCount === 0 ? (
                            <p className="text-sm text-muted-foreground py-3">No lessons in this module.</p>
                          ) : (
                            <div className="space-y-2 pt-3">
                              {(mod.lessons ?? []).map((lesson, lesIdx) => {
                                const typeConfig = CONTENT_TYPE_CONFIG[lesson.contentType] ?? CONTENT_TYPE_CONFIG.text;
                                const TypeIcon = typeConfig.icon;
                                return (
                                  <div
                                    key={lesson.id}
                                    className="flex items-center gap-3 p-2 rounded-md bg-muted/30"
                                    data-testid={`row-lesson-${lesson.id}`}
                                  >
                                    <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm font-medium" data-testid={`text-lesson-title-${lesson.id}`}>
                                        {lesIdx + 1}. {lesson.title}
                                      </span>
                                    </div>
                                    <Badge variant="secondary" className="text-xs" data-testid={`badge-lesson-type-${lesson.id}`}>
                                      {typeConfig.label}
                                    </Badge>
                                    {lesson.estimatedMinutes && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {lesson.estimatedMinutes}m
                                      </span>
                                    )}
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => openLessonDialog(mod.id, lesson)}
                                      data-testid={`button-edit-lesson-${lesson.id}`}
                                      aria-label="Edit lesson"
                                    >
                                      <Edit3 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => deleteLessonMutation.mutate(lesson.id)}
                                      data-testid={`button-delete-lesson-${lesson.id}`}
                                      aria-label="Delete lesson"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="enrollments">
          <Card data-testid="card-enrollments">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Enrolled Students ({enrollmentCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {enrollmentCount === 0 ? (
                <p className="text-muted-foreground text-center py-8" data-testid="text-no-enrollments">
                  No students enrolled yet.
                </p>
              ) : (
                <Table data-testid="table-enrollments">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Enrolled</TableHead>
                      <TableHead className="text-right">Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Accessed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(course.enrollments ?? []).map((enrollment) => (
                      <TableRow key={enrollment.id} data-testid={`row-enrollment-${enrollment.id}`}>
                        <TableCell className="font-medium" data-testid={`text-enrollment-name-${enrollment.id}`}>
                          {enrollment.userName || "Unknown"}
                        </TableCell>
                        <TableCell data-testid={`text-enrollment-date-${enrollment.id}`}>
                          {formatDate(enrollment.enrolledAt)}
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-enrollment-progress-${enrollment.id}`}>
                          {enrollment.progressPercent ?? 0}%
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={enrollment.status === "completed" ? "default" : "secondary"}
                            data-testid={`badge-enrollment-status-${enrollment.id}`}
                          >
                            {enrollment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground" data-testid={`text-enrollment-last-${enrollment.id}`}>
                          {formatDate(enrollment.lastAccessedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <LessonEditDialog
        open={lessonDialogOpen}
        onOpenChange={(o) => {
          setLessonDialogOpen(o);
          if (!o) {
            setEditingLesson(null);
            setActiveLessonModuleId("");
          }
        }}
        lesson={editingLesson}
        moduleId={activeLessonModuleId}
        existingLessonCount={
          (course.modules ?? []).find((m) => m.id === activeLessonModuleId)?.lessons?.length ?? 0
        }
      />
    </div>
  );
}

export default function CourseCreatorPage() {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: courses, isLoading, error, refetch } = useQuery<AcademyCourse[]>({
    queryKey: ["/api/admin/courses"],
  });

  if (selectedCourseId) {
    return (
      <CourseEditor
        courseId={selectedCourseId}
        onBack={() => setSelectedCourseId(null)}
      />
    );
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <div className="p-6"><ErrorRetry message="Failed to load courses." onRetry={refetch} /></div>;
  }

  const filteredCourses = (courses ?? []).filter((c) =>
    categoryFilter === "all" ? true : c.category === categoryFilter
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Course Creator"
        description="Build, manage, and publish your courses"
        breadcrumbs={[
          { label: "Academy", href: "/academy" },
          { label: "Course Creator" },
        ]}
      />
      <div
        className="rounded-md bg-gradient-to-r from-rose-900 to-red-950 dark:from-rose-950 dark:to-background p-8 mb-8"
        data-testid="section-hero"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="h-8 w-8 text-white" />
              <h1 className="text-3xl font-bold text-white" data-testid="text-page-title">
                Course Creator
              </h1>
            </div>
            <p className="text-rose-100 text-lg" data-testid="text-page-subtitle">
              Build, manage, and publish your courses
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-course">
            <Plus className="h-4 w-4 mr-2" /> Create Course
          </Button>
        </div>
      </div>

      <div className="mb-6 overflow-x-auto">
        <div className="flex items-center gap-2 flex-wrap" data-testid="section-category-filter">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = categoryFilter === cat.value;
            return (
              <Button
                key={cat.value}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(cat.value)}
                data-testid={`button-filter-${cat.value}`}
              >
                <Icon className="h-3.5 w-3.5 mr-1.5" /> {cat.label}
              </Button>
            );
          })}
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <Card className="p-12 text-center" data-testid="card-no-courses">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold mb-2">No Courses Found</h2>
          <p className="text-muted-foreground mb-4">
            {categoryFilter === "all"
              ? "Get started by creating your first course."
              : "No courses in this category. Try another filter or create a new course."}
          </p>
          <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-course-empty">
            <Plus className="h-4 w-4 mr-2" /> Create Course
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="grid-courses">
          {filteredCourses.map((course) => {
            const catConfig = CATEGORIES.find((c) => c.value === course.category);
            return (
              <Card
                key={course.id}
                className="cursor-pointer hover-elevate overflow-visible"
                onClick={() => setSelectedCourseId(course.id)}
                data-testid={`card-course-${course.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Badge variant="secondary" data-testid={`badge-category-${course.id}`}>
                      {catConfig?.label ?? course.category}
                    </Badge>
                    <Badge
                      variant={course.status === "published" ? "default" : "secondary"}
                      data-testid={`badge-status-${course.id}`}
                    >
                      {course.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-1 line-clamp-2" data-testid={`text-course-title-${course.id}`}>
                    {course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2" data-testid={`text-course-desc-${course.id}`}>
                    {course.description || "No description"}
                  </p>
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-3.5 w-3.5" />
                      <span className="capitalize">{course.difficultyLevel ?? "beginner"}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(course.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateCourseDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}