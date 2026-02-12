import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, ThumbsUp, Send, LogIn } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { StudyTip } from "@shared/schema";

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

export default function StudyTips({ moduleId }: { moduleId: string }) {
  const [tipText, setTipText] = useState("");
  const { isAuthenticated } = useAuth();

  const { data: tips, isLoading } = useQuery<StudyTip[]>({
    queryKey: ["/api/modules", moduleId, "tips"],
  });

  const addTipMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/modules/${moduleId}/tips`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules", moduleId, "tips"] });
      setTipText("");
    },
  });

  const upvoteMutation = useMutation({
    mutationFn: async (tipId: string) => {
      const res = await apiRequest("POST", `/api/tips/${tipId}/upvote`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules", moduleId, "tips"] });
    },
  });

  return (
    <Card className="p-5 md:p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-primary" />
        Study Tips
      </h3>

      {isAuthenticated ? (
        <div className="flex gap-2 mb-4">
          <Textarea
            value={tipText}
            onChange={(e) => setTipText(e.target.value)}
            placeholder="Share a study tip for this module..."
            className="resize-none text-sm"
            rows={2}
            data-testid="input-study-tip"
          />
          <Button
            size="icon"
            onClick={() => {
              if (tipText.trim()) addTipMutation.mutate(tipText);
            }}
            disabled={!tipText.trim() || addTipMutation.isPending}
            data-testid="button-submit-tip"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="mb-4 p-3 rounded-md bg-muted/50 flex items-center gap-2">
          <LogIn className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground">
            <a href="/api/login" className="text-primary underline" data-testid="link-login-to-tip">Sign in</a> to share study tips
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : tips && tips.length > 0 ? (
        <div className="space-y-3">
          {tips.map((tip) => (
            <div
              key={tip.id}
              className="rounded-md p-3 bg-muted/50 flex gap-3"
              data-testid={`tip-${tip.id}`}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => upvoteMutation.mutate(tip.id)}
                disabled={upvoteMutation.isPending}
                className="shrink-0 toggle-elevate"
                data-testid={`button-upvote-${tip.id}`}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" data-testid={`text-tip-user-${tip.id}`}>
                      {tip.userName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(tip.createdAt)}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground" data-testid={`text-upvotes-${tip.id}`}>
                    {tip.upvotes} {tip.upvotes === 1 ? "upvote" : "upvotes"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{tip.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No tips yet. Share your study strategies!
        </p>
      )}
    </Card>
  );
}
