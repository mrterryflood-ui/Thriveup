import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Plus, Trash2, ExternalLink, Clock } from "lucide-react";
import type { Initiative } from "@shared/schema";

export default function InitiativesPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: initiatives = [], isLoading } = useQuery<Initiative[]>({
    queryKey: ["/api/initiatives"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/initiatives/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives"] });
      toast({ title: "Initiative deleted" });
    },
  });

  const categoryColors: Record<string, string> = {
    partnership: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    program: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    grant: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    community: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    initiative: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="h-6 w-6 text-teal-600" />
            <h1 className="text-2xl font-bold text-foreground">My Initiatives</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Plans, proposals, and ideas saved from the AI Navigator — each one a live page you can share or build on.
          </p>
        </div>
        <Link href="/navigator">
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white gap-2 shrink-0" data-testid="button-new-initiative">
            <Plus className="h-4 w-4" /> New from Navigator
          </Button>
        </Link>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : initiatives.length === 0 ? (
        <Card className="border-dashed border-2 border-muted">
          <CardContent className="py-16 text-center space-y-4">
            <Lightbulb className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <div>
              <p className="font-semibold text-foreground">No initiatives yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Open the AI Navigator, get a plan you like, and click <strong>"Save as Initiative"</strong> to create your first page.
              </p>
            </div>
            <Link href="/navigator">
              <Button variant="outline" className="gap-2" data-testid="button-open-navigator">
                <Plus className="h-4 w-4" /> Open Navigator
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {initiatives.map((init) => (
            <Card key={init.id} className="hover:shadow-md transition-shadow" data-testid={`card-initiative-${init.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${categoryColors[init.category ?? "initiative"] ?? categoryColors.initiative}`}>
                        {init.category}
                      </span>
                      {!init.isPublic && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Private</span>
                      )}
                    </div>
                    <CardTitle className="text-lg leading-snug">
                      <Link href={`/initiatives/${init.slug}`} className="hover:text-teal-600 transition-colors" data-testid={`link-initiative-${init.id}`}>
                        {init.title}
                      </Link>
                    </CardTitle>
                    {init.summary && (
                      <CardDescription className="mt-1 line-clamp-2">{init.summary}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link href={`/initiatives/${init.slug}`}>
                      <Button size="icon" variant="ghost" className="h-8 w-8" data-testid={`button-view-initiative-${init.id}`}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    {user && init.authorId === user.id && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate(init.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-initiative-${init.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{init.createdAt ? new Date(init.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}</span>
                  {init.authorName && <span className="ml-2">by {init.authorName}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
