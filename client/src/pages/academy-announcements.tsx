import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Megaphone, Pin, Trash2, Plus } from "lucide-react";
import type { Announcement } from "@shared/schema";

const categories = [
  { value: "general", label: "General" },
  { value: "important", label: "Important" },
  { value: "event", label: "Event" },
  { value: "reminder", label: "Reminder" },
] as const;

function getCategoryBadge(category: string) {
  switch (category) {
    case "important":
      return <Badge variant="destructive">{category}</Badge>;
    case "event":
      return <Badge variant="secondary">{category}</Badge>;
    case "reminder":
      return <Badge variant="outline">{category}</Badge>;
    default:
      return <Badge>{category}</Badge>;
  }
}

export default function AcademyAnnouncementsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [pinned, setPinned] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const isAdmin = !!(user as any)?.isAdmin;

  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; category: string; pinned: boolean }) => {
      const res = await apiRequest("POST", "/api/announcements", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      setTitle("");
      setContent("");
      setCategory("general");
      setPinned(false);
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
    },
  });

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;
    createMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      category,
      pinned,
    });
  };

  const sorted = announcements
    ? [...announcements].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      })
    : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-[#800000] text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-announcements-title">
            <Megaphone className="h-8 w-8" /> Announcements
          </h1>
          <p className="mt-2 text-white/80" data-testid="text-announcements-description">
            Stay updated with the latest news from your teachers and administrators
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {isAdmin && (
          <div>
            {!showForm ? (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-[#800000]"
                data-testid="button-new-announcement"
              >
                <Plus className="h-4 w-4 mr-2" /> New Announcement
              </Button>
            ) : (
              <Card className="p-6" data-testid="card-new-announcement">
                <h2 className="text-xl font-semibold mb-4" data-testid="text-new-announcement-heading">
                  Create Announcement
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Title</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Announcement title"
                      data-testid="input-announcement-title"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Content</label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write your announcement..."
                      className="min-h-[100px]"
                      data-testid="textarea-announcement-content"
                    />
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[140px]">
                      <label className="text-sm font-medium text-muted-foreground mb-1 block">Category</label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger data-testid="select-category-trigger">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value} data-testid={`select-category-${cat.value}`}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end gap-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={pinned}
                          onCheckedChange={setPinned}
                          data-testid="switch-pinned"
                        />
                        <label className="text-sm font-medium">Pin to top</label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      data-testid="button-cancel-announcement"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!title.trim() || !content.trim() || createMutation.isPending}
                      className="bg-[#800000]"
                      data-testid="button-submit-announcement"
                    >
                      {createMutation.isPending ? "Posting..." : "Post Announcement"}
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {isLoading || authLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <Card className="p-8 text-center" data-testid="card-no-announcements">
            <p className="text-muted-foreground">No announcements yet.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {sorted.map((announcement) => (
              <Card key={announcement.id} className="p-4" data-testid={`card-announcement-${announcement.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-lg font-semibold" data-testid={`text-title-${announcement.id}`}>
                        {announcement.title}
                      </h3>
                      {getCategoryBadge(announcement.category)}
                      {announcement.pinned && (
                        <Badge variant="outline" className="gap-1" data-testid={`badge-pinned-${announcement.id}`}>
                          <Pin className="h-3 w-3" /> Pinned
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap mb-2" data-testid={`text-content-${announcement.id}`}>
                      {announcement.content}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground" data-testid={`text-meta-${announcement.id}`}>
                      <span>{announcement.createdByName}</span>
                      <span>-</span>
                      <span>
                        {announcement.createdAt
                          ? new Date(announcement.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : ""}
                      </span>
                    </div>
                  </div>

                  {isAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          data-testid={`button-delete-${announcement.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this announcement? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid={`button-cancel-delete-${announcement.id}`}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(announcement.id)}
                            className="bg-destructive text-destructive-foreground"
                            data-testid={`button-confirm-delete-${announcement.id}`}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
