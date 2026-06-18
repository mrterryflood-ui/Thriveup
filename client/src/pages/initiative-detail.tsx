import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Lightbulb, Clock, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Initiative } from "@shared/schema";

export default function InitiativeDetailPage() {
  const [, params] = useRoute("/initiatives/:slug");
  const slug = params?.slug ?? "";
  const { toast } = useToast();

  const { data: initiative, isLoading, isError } = useQuery<Initiative>({
    queryKey: ["/api/initiatives", slug],
    queryFn: async () => {
      const res = await fetch(`/api/initiatives/${slug}`, { credentials: "include" });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!slug,
  });

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(
      () => toast({ title: "Link copied to clipboard" }),
      () => toast({ title: "Could not copy link", variant: "destructive" }),
    );
  };

  const categoryColors: Record<string, string> = {
    partnership: "bg-blue-100 text-blue-800",
    program: "bg-green-100 text-green-800",
    grant: "bg-amber-100 text-amber-800",
    community: "bg-purple-100 text-purple-800",
    initiative: "bg-teal-100 text-teal-800",
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !initiative) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <Lightbulb className="h-12 w-12 text-muted-foreground/40 mx-auto" />
        <h1 className="text-xl font-semibold">Initiative not found</h1>
        <p className="text-muted-foreground text-sm">This initiative may have been deleted or made private.</p>
        <Link href="/initiatives">
          <Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" /> All Initiatives</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back nav */}
      <Link href="/initiatives">
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6" data-testid="button-back-initiatives">
          <ArrowLeft className="h-4 w-4" /> All Initiatives
        </button>
      </Link>

      {/* Header */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${categoryColors[initiative.category ?? "initiative"] ?? categoryColors.initiative}`}>
            {initiative.category}
          </span>
          {!initiative.isPublic && (
            <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">Private</span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-foreground leading-tight" data-testid="text-initiative-title">{initiative.title}</h1>
        {initiative.summary && (
          <p className="text-muted-foreground text-base leading-relaxed">{initiative.summary}</p>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {initiative.createdAt
                ? new Date(initiative.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                : ""}
            </span>
            {initiative.authorName && <span className="ml-1">· {initiative.authorName}</span>}
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={handleShare} data-testid="button-share-initiative">
            <Share2 className="h-3 w-3" /> Share
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2 text-sm leading-relaxed" data-testid="text-initiative-content">
        {initiative.content.split("\n").map((line, i) => {
          if (line.startsWith("### ")) return <h3 key={i} className="text-base font-semibold text-foreground mt-4 mb-1">{line.slice(4)}</h3>;
          if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-bold text-foreground mt-6 mb-2">{line.slice(3)}</h2>;
          if (line.startsWith("# ")) return <h1 key={i} className="text-xl font-bold text-foreground mt-6 mb-2">{line.slice(2)}</h1>;
          if (line.startsWith("- ") || line.startsWith("* ")) {
            const text = line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1");
            return <div key={i} className="flex gap-2 text-foreground/90"><span className="text-teal-600 shrink-0 mt-0.5">•</span><span>{text}</span></div>;
          }
          if (line.trim() === "") return <div key={i} className="h-2" />;
          const parts = line.split(/\*\*(.*?)\*\*/g);
          return (
            <p key={i} className="text-foreground/90">
              {parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="font-semibold text-foreground">{p}</strong> : p)}
            </p>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-border flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Generated by ThriveUp AI Navigator · The Collaborative Advocate Foundation</p>
        <Link href="/initiatives">
          <Button size="sm" variant="ghost" className="gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> All Initiatives
          </Button>
        </Link>
      </div>
    </div>
  );
}
