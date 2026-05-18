import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { MapPin, MessageCircle, ArrowRight, ShieldCheck, Globe } from "lucide-react";
import type { CommunityVoiceProject } from "@shared/schema";

interface ProjectsResponse {
  projects: CommunityVoiceProject[];
}

export default function VoiceIndexPage() {
  const { data, isLoading } = useQuery<ProjectsResponse>({
    queryKey: ["/api/voice/projects"],
  });

  const projects = data?.projects ?? [];

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl" data-testid="page-voice-index">
      <PageHeader
        title="Community Voice"
        description="Map-pin community engagement. Residents and partners drop pins where services are working, where gaps remain, and where help is needed. Every input routes to the right platform — and feeds the chain web."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Community Intelligence" },
          { label: "Voice" },
        ]}
      />

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Crisis-aware by default</p>
                <p className="text-xs text-muted-foreground mt-1">High-risk inputs route silently to Whole-Person Health and LifeBridge.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Multi-language input</p>
                <p className="text-xs text-muted-foreground mt-1">Type or speak in any of 89 languages via Talk Your Talk; English mirror stored for analytics.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <MessageCircle className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Input → insight → impact</p>
                <p className="text-xs text-muted-foreground mt-1">Pins cluster into themes, themes become grant narrative, narrative ships as donor outcome receipts.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground" data-testid="empty-voice-projects">
            No public projects yet. Check back soon.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <Link key={p.id} href={`/voice/${p.slug}`} data-testid={`link-voice-project-${p.slug}`}>
              <Card className="cursor-pointer hover-elevate active-elevate-2 transition-shadow">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <h3 className="font-semibold text-base truncate" data-testid={`text-voice-name-${p.slug}`}>{p.name}</h3>
                      </div>
                      {p.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">{p.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <Badge variant="outline" className="text-xs">{p.accessMode === "public" ? "Open to all" : p.accessMode === "email" ? "Email required" : "Hybrid"}</Badge>
                        {p.crisisRoutingEnabled && <Badge variant="outline" className="text-xs">Crisis-routed</Badge>}
                        <Badge variant="outline" className="text-xs">{(p.pinCategories ?? []).length} categories</Badge>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 text-xs text-muted-foreground">
        <p>
          Built on TCAF's existing GIS + census + health stack, Talk Your Talk language substrate, Whole-Person Health safety floor, and Civic Signal civic-intelligence layer. A better alternative to Social Pinpoint, PublicInput, EngagementHQ, CitizenLab.
        </p>
      </div>
    </div>
  );
}
