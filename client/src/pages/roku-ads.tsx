import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tv, Play, DollarSign, BarChart3, Zap, Clock,
  Copy, Check, Download, Loader2, Wand2,
  Monitor, Smartphone, Globe, Target, TrendingUp,
  FileText, Code, Film, Radio, Megaphone, ArrowRight, CheckCircle2,
} from "lucide-react";
import { BackToTop } from "@/components/back-to-top";

const AD_FORMATS = [
  { id: "pre-roll", label: "Pre-Roll", duration: ":15 or :30", description: "Before content starts", cpm: "$25–$40", icon: Play },
  { id: "mid-roll", label: "Mid-Roll", duration: ":15 or :30", description: "During content breaks", cpm: "$30–$45", icon: Film },
  { id: "post-roll", label: "Post-Roll", duration: ":15 or :30", description: "After content ends", cpm: "$15–$25", icon: Radio },
  { id: "interactive", label: "Interactive Overlay", duration: "Persistent", description: "Clickable overlays during playback", cpm: "$40–$60", icon: Monitor },
];

const CHANNEL_SPECS = [
  { spec: "Channel Poster (HD)", size: "540 x 405 px", format: "JPEG/PNG" },
  { spec: "Channel Poster (FHD)", size: "290 x 218 px", format: "JPEG/PNG" },
  { spec: "Splash Screen (HD)", size: "1280 x 720 px", format: "JPEG/PNG" },
  { spec: "Splash Screen (FHD)", size: "1920 x 1080 px", format: "JPEG/PNG" },
  { spec: "Content Thumbnail", size: "800 x 450 px", format: "JPEG/PNG" },
  { spec: "Logo (Small)", size: "108 x 108 px", format: "PNG (transparent)" },
];

const VAST_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<VAST version="4.2" xmlns="http://www.iab.com/VAST">
  <Ad id="thriveup-[AD_ID]" sequence="1">
    <InLine>
      <AdSystem>ThriveUp Ad Server</AdSystem>
      <AdTitle>[CAMPAIGN_NAME]</AdTitle>
      <Impression><![CDATA[https://track.thriveup.org/imp?id=[AD_ID]]]></Impression>
      <Creatives>
        <Creative>
          <Linear>
            <Duration>00:00:30</Duration>
            <MediaFiles>
              <MediaFile delivery="progressive" type="video/mp4"
                width="1920" height="1080" bitrate="5000">
                <![CDATA[https://cdn.thriveup.org/ads/[AD_FILE].mp4]]>
              </MediaFile>
            </MediaFiles>
          </Linear>
        </Creative>
      </Creatives>
    </InLine>
  </Ad>
</VAST>`;

const RAF_SNIPPET = `' Roku Ad Framework (RAF) Integration
' BrightScript — ThriveUp Channel
Sub RunUserInterface()
    screen = CreateObject("roSGScreen")
    scene = screen.CreateScene("ThriveUpScene")
    screen.Show()

    ' Initialize RAF
    RAF = Roku_Ads()
    RAF.setAdPrefs(true, 1)

    ' Set VAST ad URL for pre-roll
    RAF.setAdUrl("https://ads.thriveup.org/vast?pos=preroll&channel=thriveup")

    ' Configure ad breaks
    adPods = RAF.getAds()
    if adPods <> invalid and adPods.Count() > 0
        keepPlaying = RAF.showAds(adPods)
        if not keepPlaying then return
    end if

    ' Play content
    videoNode = scene.findNode("videoPlayer")
    videoNode.control = "play"

    ' Mid-roll at natural break points
    videoNode.observeField("position", "onPositionChange")
End Sub

Sub onPositionChange()
    position = m.videoNode.position
    ' Insert mid-roll at configured break points
    for each breakPoint in m.adBreakPoints
        if position >= breakPoint.time and not breakPoint.shown
            RAF = Roku_Ads()
            RAF.setAdUrl(breakPoint.vastUrl)
            adPods = RAF.getAds()
            if adPods <> invalid
                breakPoint.shown = true
                m.videoNode.control = "pause"
                RAF.showAds(adPods)
                m.videoNode.control = "play"
            end if
        end if
    end for
End Sub`;

const MRSS_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>ThriveUp Channel</title>
    <description>AI-Powered Workforce Development & Community Impact</description>
    <item>
      <title>[VIDEO_TITLE]</title>
      <link>https://thrivingcommunitiesforall.com/watch/[VIDEO_ID]</link>
      <description>[VIDEO_DESCRIPTION]</description>
      <media:content url="https://cdn.thriveup.org/video/[FILE].mp4"
        type="video/mp4" duration="[DURATION_SECONDS]" />
      <media:thumbnail url="https://cdn.thriveup.org/thumbs/[THUMB].jpg" />
      <media:category>Education</media:category>
      <media:rating scheme="urn:v-chip">TV-G</media:rating>
      <roku:adBreaks>
        <roku:adBreak time="0" type="preroll" />
        <roku:adBreak time="[MID_TIME]" type="midroll" />
        <roku:adBreak time="[END_TIME]" type="postroll" />
      </roku:adBreaks>
    </item>
  </channel>
</rss>`;

export default function RokuAdsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [contentDescription, setContentDescription] = useState("");
  const [contentDuration, setContentDuration] = useState("5-15");
  const [generatedScript, setGeneratedScript] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const completedJobsQuery = useQuery<any[]>({
    queryKey: ["/api/video-pipeline/jobs"],
  });

  useEffect(() => {
    document.title = "Roku & CTV Ad Studio | Video Creator AI | ThriveUp";
  }, []);

  const generateMutation = useMutation({
    mutationFn: async (data: { prompt: string }) => {
      const res = await fetch("/api/ai-tools/generate-roku-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to generate");
      return res.json();
    },
    onSuccess: (data: any) => {
      setGeneratedScript(data.script || data.content || "");
      toast({ title: "Script generated", description: "Roku-optimized video script with ad breaks ready." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Generation failed. Please try again.", variant: "destructive" });
    },
  });

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "Copied", description: `${field} copied to clipboard.` });
  };

  const handleGenerate = () => {
    if (!contentDescription.trim()) return;
    const durationGuide = contentDuration === "under-5" ? "under 5 minutes (pre-roll only)" :
      contentDuration === "5-15" ? "5-15 minutes (pre-roll + 1 mid-roll)" :
      contentDuration === "15-30" ? "15-30 minutes (pre-roll + 2 mid-rolls + post-roll)" :
      "30+ minutes (pre-roll + mid-roll every 8-10 min + post-roll)";

    generateMutation.mutate({
      prompt: `Create a Roku/CTV-optimized video script for: ${contentDescription}

Target duration: ${durationGuide}
Include VAST ad tag positions, RAF integration notes, MRSS feed entry, and revenue estimates.
This is for the ThriveUp channel on Roku — content focuses on workforce development, housing stability, health equity, veteran services, and community impact in Austin, Texas.
Channel: ThriveUp (501(c)(3))
Brand: Dr. Terry Flood's 15-service-platform AI ecosystem
Audience: Central Texas community, veterans, families, funders, policymakers`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10" data-testid="roku-ads-page">
      <PageHeader
        title="Roku & CTV Ad Studio"
        description="Video Creator AI integration for Roku streaming, CTV advertising, and OTT content distribution"
        breadcrumbs={[
          { label: "AI Tools", href: "/ai-tools" },
          { label: "Video Creator", href: "/ai-tools/video-creator" },
          { label: "Roku & CTV Ads" },
        ]}
      />

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900 via-violet-800 to-indigo-900 text-white p-8 md:p-12" data-testid="hero-roku">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 right-8 w-64 h-64 rounded-full bg-purple-400 blur-3xl" />
          <div className="absolute bottom-8 left-8 w-80 h-80 rounded-full bg-indigo-400 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <Tv className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Stream Your Impact</h1>
            <p className="text-lg text-purple-200 mb-4">
              Turn ThriveUp's 15-service-platform ecosystem content into Roku channels with monetized ad breaks.
              Reach millions on connected TVs while generating revenue to fund community services.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-white/20 border-white/30 text-white"><Tv className="h-3 w-3 mr-1" /> Roku Direct Publisher</Badge>
              <Badge className="bg-white/20 border-white/30 text-white"><Code className="h-3 w-3 mr-1" /> VAST 4.2</Badge>
              <Badge className="bg-white/20 border-white/30 text-white"><Zap className="h-3 w-3 mr-1" /> RAF Integration</Badge>
              <Badge className="bg-white/20 border-white/30 text-white"><DollarSign className="h-3 w-3 mr-1" /> $20–$60 CPM</Badge>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-roku">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1 h-auto p-1">
          <TabsTrigger value="overview" className="text-xs md:text-sm" data-testid="tab-overview">
            <BarChart3 className="h-3.5 w-3.5 mr-1" /> Overview
          </TabsTrigger>
          <TabsTrigger value="generate" className="text-xs md:text-sm" data-testid="tab-generate">
            <Wand2 className="h-3.5 w-3.5 mr-1" /> Generate
          </TabsTrigger>
          <TabsTrigger value="vast" className="text-xs md:text-sm" data-testid="tab-vast">
            <Code className="h-3.5 w-3.5 mr-1" /> VAST Tags
          </TabsTrigger>
          <TabsTrigger value="raf" className="text-xs md:text-sm" data-testid="tab-raf">
            <Tv className="h-3.5 w-3.5 mr-1" /> RAF Code
          </TabsTrigger>
          <TabsTrigger value="mrss" className="text-xs md:text-sm" data-testid="tab-mrss">
            <Globe className="h-3.5 w-3.5 mr-1" /> MRSS Feed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-8" data-testid="content-overview">
          <div>
            <h2 className="text-2xl font-bold mb-2">CTV Ad Formats & Revenue</h2>
            <p className="text-muted-foreground mb-6">
              Connected TV delivers the highest CPMs in digital advertising. Roku reaches 80M+ households.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {AD_FORMATS.map((format) => (
              <Card key={format.id} className="hover:shadow-lg transition-shadow" data-testid={`card-format-${format.id}`}>
                <CardContent className="pt-5 pb-4 text-center">
                  <div className="mx-auto w-11 h-11 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
                    <format.icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h4 className="font-semibold mb-1">{format.label}</h4>
                  <Badge variant="outline" className="mb-2">{format.duration}</Badge>
                  <p className="text-xs text-muted-foreground mb-2">{format.description}</p>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{format.cpm}</div>
                  <div className="text-xs text-muted-foreground">CPM Range</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card data-testid="card-revenue-calculator">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                Revenue Projections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-sm text-muted-foreground mb-1">10,000 Views/Month</div>
                  <div className="text-3xl font-bold text-emerald-600">$200–$600</div>
                  <div className="text-xs text-muted-foreground">Monthly Revenue</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-sm text-muted-foreground mb-1">100,000 Views/Month</div>
                  <div className="text-3xl font-bold text-emerald-600">$2,000–$6,000</div>
                  <div className="text-xs text-muted-foreground">Monthly Revenue</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-sm text-muted-foreground mb-1">1M Views/Month</div>
                  <div className="text-3xl font-bold text-emerald-600">$20,000–$60,000</div>
                  <div className="text-xs text-muted-foreground">Monthly Revenue</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Based on Roku CTV average CPM of $20–$60. Actual rates vary by targeting, content vertical, and season.
                Non-profit educational content qualifies for premium inventory rates.
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-channel-specs">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-blue-500" />
                Roku Channel Asset Specifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {CHANNEL_SPECS.map((spec) => (
                  <div key={spec.spec} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm">
                    <span className="font-medium">{spec.spec}</span>
                    <div className="text-right">
                      <div className="font-mono text-xs">{spec.size}</div>
                      <div className="text-xs text-muted-foreground">{spec.format}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20" data-testid="card-thriveup-channel">
            <CardHeader>
              <CardTitle>ThriveUp Roku Channel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">Content Categories</h4>
                  {[
                    "Workforce Development Training",
                    "Housing Stability Resources",
                    "Health & Wellness Education",
                    "Veteran Transition Support",
                    "Youth Empowerment Programs",
                    "Community Impact Stories",
                    "Grant & Funder Presentations",
                    "Austin Housing Initiative",
                  ].map((cat) => (
                    <div key={cat} className="flex items-center gap-2 text-sm">
                      <Play className="h-3 w-3 text-purple-500" /> {cat}
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Channel Strategy</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>Distribution:</strong> Roku Direct Publisher + Samsung TV Plus + Amazon Fire TV</p>
                    <p><strong>Ad Model:</strong> AVOD (Ad-Supported Video on Demand) — free for viewers, ad-monetized</p>
                    <p><strong>Content Cadence:</strong> 2-3 new videos/week from Video Creator AI</p>
                    <p><strong>Revenue Split:</strong> 60/40 (ThriveUp/Roku) on Direct Publisher</p>
                    <p><strong>Target Audience:</strong> Central Texas community + national veteran/workforce audience</p>
                    <p><strong>Launch:</strong> Q2 2026 aligned with Austin grant deployment</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate" className="mt-6 space-y-6" data-testid="content-generate">
          <Card data-testid="card-generator">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-500" />
                AI Script Generator — Roku Optimized
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Content Description</label>
                <Textarea
                  placeholder="Describe your video content... e.g., 'A 10-minute overview of ThriveUp's Austin Housing Initiative for funders and community stakeholders'"
                  value={contentDescription}
                  onChange={(e) => setContentDescription(e.target.value)}
                  rows={4}
                  data-testid="input-content-description"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Target Duration</label>
                <Select value={contentDuration} onValueChange={setContentDuration}>
                  <SelectTrigger data-testid="select-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-5">Under 5 minutes (pre-roll only)</SelectItem>
                    <SelectItem value="5-15">5–15 minutes (pre-roll + 1 mid-roll)</SelectItem>
                    <SelectItem value="15-30">15–30 minutes (pre-roll + 2 mid-rolls + post-roll)</SelectItem>
                    <SelectItem value="30-plus">30+ minutes (full ad schedule)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !contentDescription.trim()}
                className="w-full"
                data-testid="button-generate-script"
              >
                {generateMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Roku Script...</>
                ) : (
                  <><Wand2 className="h-4 w-4 mr-2" /> Generate Roku-Optimized Script</>
                )}
              </Button>
            </CardContent>
          </Card>

          {generatedScript && (
            <Card data-testid="card-generated-script">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Film className="h-5 w-5 text-purple-500" />
                    Generated Script
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleCopy(generatedScript, "Script")} data-testid="button-copy-script">
                      {copiedField === "Script" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      const blob = new Blob([generatedScript], { type: "text/markdown" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url; a.download = "roku-script.md"; a.click();
                    }} data-testid="button-download-script">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-sm font-mono bg-muted/30 p-4 rounded-lg max-h-[600px] overflow-y-auto" data-testid="text-generated-script">
                  {generatedScript}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="vast" className="mt-6 space-y-6" data-testid="content-vast">
          <Card data-testid="card-vast-template">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-blue-500" />
                  VAST 4.2 Ad Tag Template
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => handleCopy(VAST_TEMPLATE, "VAST")} data-testid="button-copy-vast">
                  {copiedField === "VAST" ? <><Check className="h-4 w-4 mr-1" /> Copied</> : <><Copy className="h-4 w-4 mr-1" /> Copy</>}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-950 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono" data-testid="code-vast">
                {VAST_TEMPLATE}
              </pre>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p><strong>Replace placeholders:</strong></p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li><code>[AD_ID]</code> — Unique identifier for the ad placement</li>
                  <li><code>[CAMPAIGN_NAME]</code> — Advertiser campaign name</li>
                  <li><code>[AD_FILE]</code> — Filename of the ad creative MP4</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="raf" className="mt-6 space-y-6" data-testid="content-raf">
          <Card data-testid="card-raf-code">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Tv className="h-5 w-5 text-purple-500" />
                  Roku Ad Framework (RAF) — BrightScript
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => handleCopy(RAF_SNIPPET, "RAF")} data-testid="button-copy-raf">
                  {copiedField === "RAF" ? <><Check className="h-4 w-4 mr-1" /> Copied</> : <><Copy className="h-4 w-4 mr-1" /> Copy</>}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-950 text-blue-400 p-4 rounded-lg overflow-x-auto text-xs font-mono" data-testid="code-raf">
                {RAF_SNIPPET}
              </pre>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <h4 className="font-semibold text-sm mb-1">Pre-Roll</h4>
                  <p className="text-xs text-muted-foreground">RAF.setAdUrl() before content playback. Highest completion rate (95%+).</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <h4 className="font-semibold text-sm mb-1">Mid-Roll</h4>
                  <p className="text-xs text-muted-foreground">Position-based triggers via observeField. Insert at natural content breaks.</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <h4 className="font-semibold text-sm mb-1">Post-Roll</h4>
                  <p className="text-xs text-muted-foreground">Trigger on content completion. Best for call-to-action placements.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mrss" className="mt-6 space-y-6" data-testid="content-mrss">
          <Card data-testid="card-mrss-template">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-green-500" />
                  MRSS Feed Template — Roku Direct Publisher
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => handleCopy(MRSS_TEMPLATE, "MRSS")} data-testid="button-copy-mrss">
                  {copiedField === "MRSS" ? <><Check className="h-4 w-4 mr-1" /> Copied</> : <><Copy className="h-4 w-4 mr-1" /> Copy</>}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-950 text-amber-400 p-4 rounded-lg overflow-x-auto text-xs font-mono" data-testid="code-mrss">
                {MRSS_TEMPLATE}
              </pre>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p><strong>Roku Direct Publisher</strong> uses MRSS feeds to automatically publish content to Roku channels. Update the feed, and content appears on the channel within minutes.</p>
                <div className="flex items-center gap-2 text-xs mt-2">
                  <Badge variant="outline">TV-G Rating</Badge>
                  <Badge variant="outline">Education Category</Badge>
                  <Badge variant="outline">Ad-Supported (AVOD)</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card data-testid="card-pipeline-ready-videos">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            Pipeline-Ready Videos for Roku Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedJobsQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (() => {
            const completedJobs = (completedJobsQuery.data || []).filter(
              (j: any) => j.status === "complete" || j.status === "distributed"
            );
            return completedJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Film className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No completed videos in the pipeline yet.</p>
                <p className="text-xs mt-1">Submit scripts from the Video Script Generator or AI Script Generator to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedJobs.map((job: any) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between gap-4 p-4 rounded-md bg-muted/50"
                    data-testid={`pipeline-video-${job.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                        <Film className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{job.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                          {job.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {Math.floor(job.duration / 60)}:{String(job.duration % 60).padStart(2, "0")}
                            </span>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {job.status === "distributed" ? "Distributed" : "Ready"}
                          </Badge>
                          {job.createdAt && (
                            <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {job.renderUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(job.renderUrl, `video-${job.id}`)}
                          data-testid={`button-copy-video-url-${job.id}`}
                        >
                          {copiedField === `video-${job.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground text-center pt-2">
                  {completedJobs.length} video{completedJobs.length !== 1 ? "s" : ""} ready for Roku channel distribution via MRSS feed.
                </p>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      <BackToTop />
    </div>
  );
}
