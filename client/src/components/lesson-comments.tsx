import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, ThumbsUp, Heart, Star, Zap, Send, LogIn } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { LessonComment } from "@shared/schema";

const REACTION_CONFIG = [
  { type: "helpful", label: "Helpful", icon: ThumbsUp },
  { type: "inspiring", label: "Inspiring", icon: Star },
  { type: "challenging", label: "Challenging", icon: Zap },
  { type: "fun", label: "Fun", icon: Heart },
] as const;

function formatTimeAgo(date: string | Date | null): string {
  if (!date) return "";
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function LessonComments({ lessonId }: { lessonId: string }) {
  const [commentText, setCommentText] = useState("");
  const { isAuthenticated } = useAuth();

  const { data: comments, isLoading: commentsLoading } = useQuery<LessonComment[]>({
    queryKey: ["/api/lessons", lessonId, "comments"],
  });

  const { data: reactions, isLoading: reactionsLoading } = useQuery<Record<string, number>>({
    queryKey: ["/api/lessons", lessonId, "reactions"],
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/lessons/${lessonId}/comments`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", lessonId, "comments"] });
      setCommentText("");
    },
  });

  const addReactionMutation = useMutation({
    mutationFn: async (reactionType: string) => {
      const res = await apiRequest("POST", `/api/lessons/${lessonId}/reactions`, { reactionType });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", lessonId, "reactions"] });
    },
  });

  return (
    <Card className="p-5 md:p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        Reactions & Comments
      </h3>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {reactionsLoading ? (
          <Skeleton className="h-9 w-64" />
        ) : (
          REACTION_CONFIG.map(({ type, label, icon: Icon }) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => isAuthenticated ? addReactionMutation.mutate(type) : (window.location.href = "/api/login")}
              disabled={addReactionMutation.isPending}
              data-testid={`button-reaction-${type}`}
            >
              <Icon className="h-4 w-4 mr-1" />
              {label}
              {(reactions?.[type] ?? 0) > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">
                  {reactions?.[type]}
                </span>
              )}
            </Button>
          ))
        )}
      </div>

      {isAuthenticated ? (
        <div className="flex gap-2 mb-4">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Share your thoughts about this lesson..."
            className="resize-none text-sm"
            rows={2}
            data-testid="input-comment"
          />
          <Button
            size="icon"
            onClick={() => {
              if (commentText.trim()) addCommentMutation.mutate(commentText);
            }}
            disabled={!commentText.trim() || addCommentMutation.isPending}
            data-testid="button-submit-comment"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="mb-4 p-3 rounded-md bg-muted/50 flex items-center gap-2">
          <LogIn className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground">
            <a href="/api/login" className="text-primary underline" data-testid="link-login-to-comment">Sign in</a> to leave comments and reactions
          </span>
        </div>
      )}

      {commentsLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-md p-3 bg-muted/50"
              data-testid={`comment-${comment.id}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                <span className="text-sm font-medium" data-testid={`text-comment-user-${comment.id}`}>
                  {comment.userName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{comment.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No comments yet. Be the first to share your thoughts!
        </p>
      )}
    </Card>
  );
}
