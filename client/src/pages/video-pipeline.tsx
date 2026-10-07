import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { BackToTop } from "@/components/back-to-top";
import type { VideoRenderJob } from "@shared/schema";
import {
  Film, Play, Send, Clock, CheckCircle2, XCircle, Loader2,
  BarChart3, Globe, Code, Tv, ArrowRight, RefreshCw, Copy, Check,
} from "lucide-react";

type PipelineStats = {
  total: number;
  queued: number;
  rendering: number;
  complete: number;
  distributed: number;
  failed: number;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  queued: { label: "Queued", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", icon: Clock },
  rendering: { label: "Rendering", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", icon: Loader2 },
  complete: { label: "Complete", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", icon: CheckCircle2 },
  distributed: { label: "Distributed", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300", icon: Send },
  failed: { label: "Failed", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", icon: XCircle },
};

function DistributionBadges({ jobId, data, showLabel }: { jobId: number; data: unknown; showLabel?: boolean }) {
  const entries: [string, string][] = Object.entries((data || {}) as Record<string, string>);
  return (
    <div className={showLabel ? "mt-3 pt-3 border-t" : ""}>
      {showLabel && <p className="text-xs font-medium mb-2">Distribution Status</p>}
      <div className="flex flex-wrap gap-1">
        {entries.map(([platform, distState]) => (
          <Badge
            key={platform}
            variant="outline"
            className="text-[10px]"
            data-testid={`dist-status-${jobId}-${platform}`}
          >
            {platform}: {String(distState)}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default function VideoPipelinePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("queue");
  const [title, setTitle] = useState("");
  const [scriptContent, setScriptContent] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Video Production Pipeline | ThriveUp";
  }, []);

  const { data: jobsRaw, isLoading: jobsLoading } = useQuery<VideoRenderJob[]>({
    queryKey: ["/api/video-pipeline/jobs"],
    refetchInterval: 5000,
  });
  const jobs = jobsRaw ?? [];

  const { data: stats } = useQuery<PipelineStats>({
    queryKey: ["/api/video-pipeline/stats"],
    refetchInterval: 5000,
  });

  const renderMutation = useMutation({
    mutationFn: async (data: { title: string; scriptContent: string }) => {
      const res = await apiRequest("POST", "/api/video-pipeline/render", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-pipeline/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/video-pipeline/stats"] });
      setTitle("");
      setScriptContent("");
      toast({ title: "Render job created", description: "Video is now in the render queue." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to create render job. Please try again.", variant: "destructive" });
    },
  });

  const distributeMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await apiRequest("POST", `/api/video-pipeline/distribute/${jobId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-pipeline/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/video-pipeline/stats"] });
      toast({ title: "Distribution started", description: "Video is being distributed to all platforms." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Distribution failed. Please try again.", variant: "destructive" });
    },
  });

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = () => {
    if (!title.trim() || !scriptContent.trim()) return;
    renderMutation.mutate({ title: title.trim(), scriptContent: scriptContent.trim() });
  };

  const queuedJobs = jobs.filter(j => j.status === "queued" || j.status === "rendering");
  const completedJobs = jobs.filter(j => j.status === "complete");
  const distributedJobs = jobs.filter(j => j.status === "distributed");
  const failedJobs = jobs.filter(j => j.status === "failed");

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8" data-testid="video-pipeline-page">
      <PageHeader
        title="Video Production Pipeline"
        description="Auto-render and auto-distribute video content across the 15-service-platform ecosystem"
        breadcrumbs={[
          { label: "AI Tools", href: "/ai-tools" },
          { label: "Video Pipeline" },
        ]}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total", value: stats?.total ?? 0, icon: Film },
          { label: "Queued", value: stats?.queued ?? 0, icon: Clock },
          { label: "Rendering", value: stats?.rendering ?? 0, icon: Loader2 },
          { label: "Complete", value: stats?.complete ?? 0, icon: CheckCircle2 },
          { label: "Distributed", value: stats?.distributed ?? 0, icon: Send },
          { label: "Failed", value: stats?.failed ?? 0, icon: XCircle },
        ].map((s) => (
          <Card key={s.label} data-testid={`stat-${s.label.toLowerCase()}`}>
            <CardContent className="pt-4 pb-3 text-center">
              <s.icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-pipeline">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1 h-auto p-1">
          <TabsTrigger value="queue" data-testid="tab-queue">
            <Clock className="h-3.5 w-3.5 mr-1" /> Render Queue
          </TabsTrigger>
          <TabsTrigger value="submit" data-testid="tab-submit">
            <Play className="h-3.5 w-3.5 mr-1" /> Submit
          </TabsTrigger>
          <TabsTrigger value="distribution" data-testid="tab-distribution">
            <Globe className="h-3.5 w-3.5 mr-1" /> Distribution
          </TabsTrigger>
          <TabsTrigger value="roku" data-testid="tab-roku">
            <Tv className="h-3.5 w-3.5 mr-1" /> Roku/CTV
          </TabsTrigger>
          <TabsTrigger value="stats" data-testid="tab-stats">
            <BarChart3 className="h-3.5 w-3.5 mr-1" /> Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-6 space-y-4" data-testid="content-queue">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-xl font-bold">Render Queue</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/video-pipeline/jobs"] });
                queryClient.invalidateQueries({ queryKey: ["/api/video-pipeline/stats"] });
              }}
              data-testid="button-refresh-queue"
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>

          {jobsLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Film className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No render jobs yet</p>
                <p className="text-sm">Submit a video script to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => {
                const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.queued;
                const StatusIcon = cfg.icon;
                return (
                  <Card key={job.id} data-testid={`job-card-${job.id}`}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold truncate" data-testid={`job-title-${job.id}`}>{job.title}</h3>
                            <Badge className={cfg.color} data-testid={`job-status-${job.id}`}>
                              <StatusIcon className={`h-3 w-3 mr-1 ${job.status === "rendering" ? "animate-spin" : ""}`} />
                              {cfg.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{job.scriptContent}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                            {job.duration && <span>Duration: {Math.floor(job.duration / 60)}:{(job.duration % 60).toString().padStart(2, "0")}</span>}
                            {job.sourcePlatformId && <span>Source: {job.sourcePlatformId}</span>}
                            <span>Created: {new Date(job.createdAt!).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {job.status === "complete" && (
                            <Button
                              size="sm"
                              onClick={() => distributeMutation.mutate(job.id)}
                              disabled={distributeMutation.isPending}
                              data-testid={`button-distribute-${job.id}`}
                            >
                              <Send className="h-3.5 w-3.5 mr-1" /> Distribute
                            </Button>
                          )}
                          {job.mrssEntry && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopy(job.mrssEntry!, `mrss-${job.id}`)}
                              data-testid={`button-copy-mrss-${job.id}`}
                            >
                              {copiedField === `mrss-${job.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                          )}
                        </div>
                      </div>

                      {job.status === "distributed" && job.distributionStatus ? (
                        <DistributionBadges jobId={job.id} data={job.distributionStatus} showLabel />
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submit" className="mt-6 space-y-6" data-testid="content-submit">
          <Card data-testid="card-submit-job">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-purple-500" />
                Submit Video for Rendering
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Video Title</label>
                <Input
                  placeholder="e.g., ThriveUp Austin Housing Initiative Overview"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="input-video-title"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Script Content</label>
                <Textarea
                  placeholder="Paste or write your video script here..."
                  value={scriptContent}
                  onChange={(e) => setScriptContent(e.target.value)}
                  rows={8}
                  data-testid="input-script-content"
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={renderMutation.isPending || !title.trim() || !scriptContent.trim()}
                className="w-full"
                data-testid="button-submit-render"
              >
                {renderMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                ) : (
                  <><ArrowRight className="h-4 w-4 mr-2" /> Submit to Render Queue</>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Work Chain Integration</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Videos are automatically queued when a <code className="bg-muted px-1 rounded">video_script_ready</code> ecosystem event arrives from any platform.</p>
              <p>Once rendering completes, a <code className="bg-muted px-1 rounded">video_rendered</code> event triggers auto-distribution.</p>
              <p>The <code className="bg-muted px-1 rounded">video_produced</code> chain routes completed videos to downstream platforms.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="mt-6 space-y-4" data-testid="content-distribution">
          <h2 className="text-xl font-bold">Distribution Manager</h2>
          <p className="text-muted-foreground text-sm">
            Completed videos are auto-distributed to all 15 service platforms via ecosystem work chain events.
          </p>

          {completedJobs.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Ready for Distribution ({completedJobs.length})</h3>
              {completedJobs.map((job) => (
                <Card key={job.id} data-testid={`dist-ready-${job.id}`}>
                  <CardContent className="py-4 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <p className="text-xs text-muted-foreground">Render complete - ready for distribution</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => distributeMutation.mutate(job.id)}
                      disabled={distributeMutation.isPending}
                      data-testid={`button-dist-${job.id}`}
                    >
                      <Send className="h-3.5 w-3.5 mr-1" /> Distribute to All Platforms
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {distributedJobs.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Distributed ({distributedJobs.length})</h3>
              {distributedJobs.map((job) => (
                <Card key={job.id} data-testid={`dist-done-${job.id}`}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                      <p className="font-medium">{job.title}</p>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Distributed
                      </Badge>
                    </div>
                    {job.distributionStatus ? (
                      <DistributionBadges jobId={job.id} data={job.distributionStatus} />
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {completedJobs.length === 0 && distributedJobs.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No videos ready for distribution</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="roku" className="mt-6 space-y-4" data-testid="content-roku">
          <h2 className="text-xl font-bold">Roku/CTV Integration</h2>
          <p className="text-muted-foreground text-sm">
            MRSS feed entries and VAST ad tags are auto-generated for every completed video.
          </p>

          {jobs.filter(j => j.mrssEntry || j.vastTag).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Tv className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No Roku entries generated yet. Submit a video to the render queue.</p>
              </CardContent>
            </Card>
          ) : (
            jobs.filter(j => j.mrssEntry || j.vastTag).map((job) => (
              <Card key={job.id} data-testid={`roku-card-${job.id}`}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tv className="h-4 w-4 text-purple-500" />
                    {job.title}
                    <Badge variant="outline" className="ml-auto text-xs">
                      {STATUS_CONFIG[job.status]?.label || job.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {job.mrssEntry && (
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-sm font-medium">MRSS Feed Entry</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(job.mrssEntry!, `mrss-roku-${job.id}`)}
                          data-testid={`button-copy-roku-mrss-${job.id}`}
                        >
                          {copiedField === `mrss-roku-${job.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                      <pre className="bg-slate-950 text-green-400 p-3 rounded-md overflow-x-auto text-xs font-mono max-h-48" data-testid={`code-mrss-${job.id}`}>
                        {job.mrssEntry}
                      </pre>
                    </div>
                  )}
                  {job.vastTag && (
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-sm font-medium">VAST Ad Tag</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(job.vastTag!, `vast-roku-${job.id}`)}
                          data-testid={`button-copy-roku-vast-${job.id}`}
                        >
                          {copiedField === `vast-roku-${job.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                      <pre className="bg-slate-950 text-blue-400 p-3 rounded-md overflow-x-auto text-xs font-mono max-h-48" data-testid={`code-vast-${job.id}`}>
                        {job.vastTag}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="stats" className="mt-6 space-y-6" data-testid="content-stats">
          <h2 className="text-xl font-bold">Pipeline Statistics</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card data-testid="card-pipeline-overview">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Pipeline Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "Total Scripts Received", value: stats?.total ?? 0, color: "bg-muted" },
                    { label: "Videos Rendered", value: (stats?.complete ?? 0) + (stats?.distributed ?? 0), color: "bg-green-100 dark:bg-green-900/20" },
                    { label: "Distributed", value: stats?.distributed ?? 0, color: "bg-purple-100 dark:bg-purple-900/20" },
                    { label: "Pending", value: (stats?.queued ?? 0) + (stats?.rendering ?? 0), color: "bg-yellow-100 dark:bg-yellow-900/20" },
                    { label: "Failed", value: stats?.failed ?? 0, color: "bg-red-100 dark:bg-red-900/20" },
                  ].map((item) => (
                    <div key={item.label} className={`flex items-center justify-between p-3 rounded-md ${item.color}`}>
                      <span className="text-sm">{item.label}</span>
                      <span className="font-bold text-lg">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-throughput">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Film className="h-4 w-4" /> Throughput
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 rounded-md bg-muted/50">
                    <div className="text-3xl font-bold">{stats?.total ?? 0}</div>
                    <div className="text-sm text-muted-foreground">Total Jobs Processed</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 rounded-md bg-muted/50">
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">
                        {stats?.total ? Math.round(((stats.complete + stats.distributed) / stats.total) * 100) : 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">Success Rate</div>
                    </div>
                    <div className="text-center p-3 rounded-md bg-muted/50">
                      <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        {stats?.total ? Math.round((stats.distributed / stats.total) * 100) : 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">Distribution Rate</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <BackToTop />
    </div>
  );
}
