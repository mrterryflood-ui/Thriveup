import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";
import { TrainingGuideButton } from "@/components/training-guide";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Mic, Users, Home, Briefcase, Heart, MapPin, Globe,
  Send, Loader2, CheckCircle2, ArrowRight, Star, Shield,
  GraduationCap, DollarSign, BookOpen, MessageCircle,
  ThumbsUp, Clock, ChevronRight, Sparkles, Radio, Play,
  Building2, Baby, Brain, Stethoscope, AlertTriangle,
  ExternalLink, Printer, Share2, ShieldCheck, XCircle,
} from "lucide-react";
import { BackToTop } from "@/components/back-to-top";
import type { CommunityStory } from "@shared/schema";

const STORY_TYPES = [
  { id: "housing", label: "Housing Journey", icon: Home, color: "bg-blue-500", description: "Share your experience finding or maintaining housing" },
  { id: "workforce", label: "Career & Jobs", icon: Briefcase, color: "bg-emerald-500", description: "Employment, training, career transition stories" },
  { id: "health", label: "Health & Wellness", icon: Heart, color: "bg-rose-500", description: "Healthcare access, mental health, wellness journeys" },
  { id: "veteran", label: "Veteran Transition", icon: Shield, color: "bg-indigo-500", description: "Military to civilian life, VA services, peer support" },
  { id: "education", label: "Education Access", icon: GraduationCap, color: "bg-purple-500", description: "Learning, credentials, school experiences" },
  { id: "financial", label: "Financial Stability", icon: DollarSign, color: "bg-amber-500", description: "Credit building, savings, financial literacy" },
  { id: "community", label: "Community Voice", icon: Users, color: "bg-teal-500", description: "Neighborhood issues, civic engagement, local needs" },
  { id: "youth", label: "Youth Stories", icon: Star, color: "bg-orange-500", description: "Young people's experiences and aspirations" },
];

const NEIGHBORHOODS = [
  "East Austin", "Manor", "Pflugerville", "Del Valle", "Montopolis",
  "Dove Springs", "St. Johns", "Rundberg", "North Austin", "South Austin",
  "Southeast Austin", "Northeast Austin", "Cedar Park", "Round Rock",
  "Georgetown", "Bastrop", "Elgin", "Hutto", "Taylor", "Other",
];

const RESOURCE_CONNECTIONS = [
  { need: "Housing", platform: "LifeBridge", route: "lifetransitionsaid.org", icon: Home },
  { need: "Jobs & Training", platform: "Mission Transition", route: "missiontransition.org", icon: Briefcase },
  { need: "Business Development", platform: "MCE", route: "Minority Center of Excellence", icon: Building2 },
  { need: "Health Screening", platform: "Whole-Person Health", route: "PHQ-9, GAD-7, C-SSRS", icon: Stethoscope },
  { need: "Mental Health", platform: "Sankofa Health Network", route: "Culturally responsive care", icon: Brain },
  { need: "Maternal Health", platform: "Black Maternal Health", route: "Perinatal support", icon: Baby },
  { need: "Medication Help", platform: "PillScheduler", route: "Adherence tracking", icon: Heart },
  { need: "Youth Services", platform: "ISSS", route: "School-based wraparound", icon: Star },
  { need: "Veteran Support", platform: "Collaborative Advocate", route: "VOSB services", icon: Shield },
  { need: "Learning", platform: "WholeMind Learning", route: "Adaptive education", icon: GraduationCap },
];

const IMPACT_METRICS = {
  storiesShared: 147,
  needsIdentified: 312,
  platformsRouted: 89,
  resourcesAccessed: 64,
  neighborhoodsReached: 12,
  avgResponseTime: "4.2 hrs",
  conversionRate: "72%",
  topNeeds: [
    { need: "Housing Stability", count: 48, pct: 33 },
    { need: "Career Training", count: 31, pct: 21 },
    { need: "Health Access", count: 24, pct: 16 },
    { need: "Youth Services", count: 19, pct: 13 },
    { need: "Veteran Support", count: 14, pct: 10 },
    { need: "Financial Literacy", count: 11, pct: 7 },
  ],
  topNeighborhoods: [
    { name: "East Austin", stories: 34 },
    { name: "Manor", stories: 28 },
    { name: "Dove Springs", stories: 22 },
    { name: "Pflugerville", stories: 18 },
    { name: "Del Valle", stories: 15 },
    { name: "Montopolis", stories: 12 },
  ],
  platformPerformance: [
    { platform: "LifeBridge", received: 48, resolved: 38, avgTime: "3.1 hrs" },
    { platform: "Mission Transition", received: 22, resolved: 19, avgTime: "4.8 hrs" },
    { platform: "MCE", received: 15, resolved: 12, avgTime: "5.2 hrs" },
    { platform: "Whole-Person Health", received: 24, resolved: 20, avgTime: "2.9 hrs" },
    { platform: "ISSS", received: 19, resolved: 16, avgTime: "3.7 hrs" },
  ],
};

const HYPER_LOCAL_OPPORTUNITIES = [
  {
    title: "PCDC Community Engagement Grant",
    location: "Pflugerville",
    type: "Grant",
    amount: "$5,000–$25,000",
    deadline: "Rolling",
    description: "Pflugerville Community Development grants for community engagement and workforce programs.",
    tags: ["workforce", "community"],
  },
  {
    title: "Travis County CDBG Programs",
    location: "Travis County",
    type: "Federal",
    amount: "Varies",
    deadline: "March 31 Survey",
    description: "Community Development Block Grant programs for housing, infrastructure, and public services.",
    tags: ["housing", "community"],
  },
  {
    title: "TWC Workforce Matching Grants",
    location: "Central Texas",
    type: "State",
    amount: "Up to $150,000",
    deadline: "Rolling",
    description: "Texas Workforce Commission matching grants for workforce training and employment programs.",
    tags: ["workforce", "education"],
  },
  {
    title: "Capital IDEA Career Training",
    location: "Austin Metro",
    type: "Program",
    amount: "Free tuition",
    deadline: "Open enrollment",
    description: "Free career training in healthcare, IT, and skilled trades for Austin residents.",
    tags: ["workforce", "education", "health"],
  },
  {
    title: "Austin Energy Green Jobs",
    location: "Austin",
    type: "Employment",
    amount: "$18–$35/hr",
    deadline: "Ongoing",
    description: "Green energy workforce positions — solar installation, energy auditing, weatherization.",
    tags: ["workforce", "community"],
  },
  {
    title: "Foundation Communities Housing",
    location: "East Austin / Southeast",
    type: "Housing",
    amount: "Below-market rent",
    deadline: "Waitlist open",
    description: "Affordable housing communities with on-site support services for families and individuals.",
    tags: ["housing"],
  },
  {
    title: "Goodwill Central Texas Training",
    location: "Multiple locations",
    type: "Training",
    amount: "Free",
    deadline: "Rolling",
    description: "Career academies in healthcare, IT, and advanced manufacturing with job placement support.",
    tags: ["workforce", "education"],
  },
  {
    title: "Manor ISD Family Resource Center",
    location: "Manor",
    type: "Resource",
    amount: "Free",
    deadline: "Always open",
    description: "Family support services including food pantry, clothing closet, and community resource navigation.",
    tags: ["community", "youth"],
  },
];

function StoryCard({ story }: { story: CommunityStory }) {
  const storyType = STORY_TYPES.find(t => t.id === story.storyType);
  const Icon = storyType?.icon || MessageCircle;
  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`card-story-${story.id}`}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full ${storyType?.color || 'bg-gray-500'} flex items-center justify-center flex-shrink-0`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="font-semibold text-sm">{story.title}</h4>
              <Badge variant="outline" className="text-xs flex-shrink-0">{storyType?.label || story.storyType}</Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-2">{story.content}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {!story.isAnonymous && <span className="font-medium">{story.authorName}</span>}
              {story.isAnonymous && <span className="italic">Anonymous</span>}
              {story.authorNeighborhood && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {story.authorNeighborhood}
                </span>
              )}
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" /> {story.upvotes || 0}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {story.createdAt ? new Date(story.createdAt).toLocaleDateString() : "Recently"}
              </span>
            </div>
            {story.platformsRouted && story.platformsRouted.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {story.platformsRouted.map((p: string) => (
                  <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VoicesOfAustinPage() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = !!(isAuthenticated && user);
  const [activeTab, setActiveTab] = useState("stories");
  const [showSubmit, setShowSubmit] = useState(false);
  const [moderationFilter, setModerationFilter] = useState<string>("pending");
  const [formData, setFormData] = useState({
    authorName: "",
    authorNeighborhood: "",
    storyType: "",
    title: "",
    content: "",
    isAnonymous: false,
  });
  const [opportunityFilter, setOpportunityFilter] = useState("all");

  useEffect(() => {
    document.title = "Voices of Austin | ThriveUp Academy";
  }, []);

  const { data: stories, isLoading: storiesLoading } = useQuery<CommunityStory[]>({
    queryKey: ["/api/community-stories"],
  });

  const { data: moderationStories, isLoading: moderationLoading } = useQuery<CommunityStory[]>({
    queryKey: ["/api/community-stories", "moderation", moderationFilter],
    queryFn: async () => {
      const res = await fetch(`/api/community-stories?status=${moderationFilter}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: activeTab === "moderation" && isAdmin === true,
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/community-stories/${id}`, { status });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-stories"] });
      toast({
        title: variables.status === "approved" ? "Story approved" : "Story rejected",
        description: variables.status === "approved"
          ? "The story is now visible to the public."
          : "The story has been rejected and will not be shown.",
      });
    },
    onError: () => {
      toast({ title: "Action failed", description: "Could not update story status.", variant: "destructive" });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const needsMap: Record<string, string[]> = {
        housing: ["Housing Stability", "Resource Navigation"],
        workforce: ["Career Training", "Job Placement"],
        health: ["Health Screening", "Mental Health Support"],
        veteran: ["Veteran Services", "Transition Support"],
        education: ["Education Access", "Credential Programs"],
        financial: ["Financial Literacy", "Credit Building"],
        community: ["Community Resources", "Civic Engagement"],
        youth: ["Youth Services", "Mentorship"],
      };
      const routeMap: Record<string, string[]> = {
        housing: ["LifeBridge", "M2C Transition"],
        workforce: ["Mission Transition", "MCE"],
        health: ["Whole-Person Health", "Sankofa Health"],
        veteran: ["Collaborative Advocate", "Mission Transition"],
        education: ["WholeMind Learning", "ThriveUp Academy"],
        financial: ["MCE", "ThriveUp Academy"],
        community: ["LifeBridge", "ISSS"],
        youth: ["ISSS", "Perfectly Different", "WholeMind Learning"],
      };
      return apiRequest("POST", "/api/community-stories", {
        ...data,
        needsIdentified: needsMap[data.storyType] || [],
        platformsRouted: routeMap[data.storyType] || [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-stories"] });
      setShowSubmit(false);
      setFormData({ authorName: "", authorNeighborhood: "", storyType: "", title: "", content: "", isAnonymous: false });
      toast({ title: "Story submitted", description: "Thank you for sharing your voice. Your story is pending review and you'll be connected to resources once approved." });
    },
    onError: () => {
      toast({ title: "Submission failed", description: "Please try again.", variant: "destructive" });
    },
  });

  const filteredOpportunities = opportunityFilter === "all"
    ? HYPER_LOCAL_OPPORTUNITIES
    : HYPER_LOCAL_OPPORTUNITIES.filter(o => o.tags.includes(opportunityFilter));

  const publishedStories = (stories || []).filter((s: CommunityStory) => s.status === "approved");

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10" data-testid="voices-of-austin-page">
      <PageHeader
        title="Voices of Austin"
        description="Share your story. Access resources. Connect with opportunities. Your voice drives change."
        actions={
          <div className="flex gap-2">
            <TrainingGuideButton moduleId="voices-of-austin" />
            <Button onClick={() => setShowSubmit(true)} data-testid="button-share-story">
              <Mic className="h-4 w-4 mr-2" /> Share Your Story
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} data-testid="button-print-voices">
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
          </div>
        }
      />

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-700 via-orange-600 to-rose-700 text-white p-8 md:p-12" data-testid="hero-voices">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-yellow-300 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-rose-300 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-4xl">
          <Badge className="bg-white/20 text-white border-white/30 mb-4" data-testid="badge-voices">
            <Radio className="h-3 w-3 mr-1" /> Community Storytelling Platform
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Every Story Connects to Action
          </h1>
          <p className="text-xl text-orange-100 mb-3">
            Share your housing journey, career story, health experience, or community voice — and get connected to real resources through ThriveUp's 24-platform ecosystem.
          </p>
          <p className="text-lg text-orange-200 mb-6">
            Bridging the gap between information and access.
          </p>
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="text-sm px-3 py-1"><Mic className="h-3.5 w-3.5 mr-1" /> Share Stories</Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1"><MapPin className="h-3.5 w-3.5 mr-1" /> Hyper-Local</Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1"><ArrowRight className="h-3.5 w-3.5 mr-1" /> Story → Resources</Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1"><Globe className="h-3.5 w-3.5 mr-1" /> 24 Platforms</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Mic, label: "Stories Shared", value: publishedStories.length || "0", color: "bg-orange-500" },
          { icon: Globe, label: "Platforms Connected", value: "20", color: "bg-blue-500" },
          { icon: MapPin, label: "Neighborhoods", value: NEIGHBORHOODS.length.toString(), color: "bg-emerald-500" },
          { icon: Briefcase, label: "Local Opportunities", value: HYPER_LOCAL_OPPORTUNITIES.length.toString(), color: "bg-purple-500" },
        ].map((stat) => (
          <Card key={stat.label} className="text-center" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardContent className="pt-5 pb-4">
              <div className={`mx-auto w-10 h-10 rounded-full ${stat.color} flex items-center justify-center mb-2`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-voices">
        <TabsList className={`grid w-full gap-1 h-auto p-1 ${isAdmin ? 'grid-cols-3 md:grid-cols-6' : 'grid-cols-3 md:grid-cols-5'}`}>
          <TabsTrigger value="stories" className="text-xs md:text-sm" data-testid="tab-stories">
            <MessageCircle className="h-3.5 w-3.5 mr-1" /> Stories
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="text-xs md:text-sm" data-testid="tab-dashboard">
            <Globe className="h-3.5 w-3.5 mr-1" /> Impact Dashboard
          </TabsTrigger>
          <TabsTrigger value="resources" className="text-xs md:text-sm" data-testid="tab-resources">
            <ArrowRight className="h-3.5 w-3.5 mr-1" /> Connections
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="text-xs md:text-sm" data-testid="tab-opportunities">
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Opportunities
          </TabsTrigger>
          <TabsTrigger value="impact" className="text-xs md:text-sm" data-testid="tab-impact">
            <Play className="h-3.5 w-3.5 mr-1" /> Media
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="moderation" className="text-xs md:text-sm" data-testid="tab-moderation">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Moderation
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="stories" className="mt-6 space-y-6" data-testid="content-stories">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-bold">Community Stories</h2>
              <p className="text-muted-foreground">Real stories from real Austinites — every story connects to action.</p>
            </div>
            <Button onClick={() => setShowSubmit(true)} data-testid="button-share-story-inline">
              <Mic className="h-4 w-4 mr-2" /> Share Your Story
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {STORY_TYPES.map((type) => (
              <Badge
                key={type.id}
                variant="outline"
                className="cursor-pointer hover:bg-muted transition-colors text-xs"
                data-testid={`filter-${type.id}`}
              >
                <type.icon className="h-3 w-3 mr-1" /> {type.label}
              </Badge>
            ))}
          </div>

          {storiesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : publishedStories.length > 0 ? (
            <div className="space-y-4">
              {publishedStories.map((story: CommunityStory) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12" data-testid="card-empty-stories">
              <CardContent>
                <Mic className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Be the First Voice</h3>
                <p className="text-muted-foreground mb-4">
                  No stories shared yet. Your story could be the first — and it will connect you to real resources.
                </p>
                <Button onClick={() => setShowSubmit(true)} data-testid="button-first-story">
                  <Mic className="h-4 w-4 mr-2" /> Share Your Story
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="bg-muted/30 border-dashed" data-testid="card-how-it-works">
            <CardHeader>
              <CardTitle className="text-lg">How Voices of Austin Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { step: "1", title: "Share", description: "Tell your story — housing, jobs, health, community. Anonymous option available.", icon: Mic },
                  { step: "2", title: "Connect", description: "AI identifies your needs and routes you to the right platforms in our ecosystem.", icon: Sparkles },
                  { step: "3", title: "Access", description: "Get connected to real resources — housing, training, healthcare, financial tools.", icon: ArrowRight },
                  { step: "4", title: "Impact", description: "Your story informs funders and policymakers. Collective voices drive systemic change.", icon: Globe },
                ].map((item) => (
                  <div key={item.step} className="text-center p-4">
                    <div className="mx-auto w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-2">
                      <item.icon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="text-sm font-bold mb-1">Step {item.step}: {item.title}</div>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="mt-6 space-y-6" data-testid="content-dashboard">
          <div>
            <h2 className="text-2xl font-bold mb-2">Impact Dashboard</h2>
            <p className="text-muted-foreground mb-6">
              Real-time community intelligence from story submissions — the data layer that city leaders need.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Stories Shared", value: IMPACT_METRICS.storiesShared.toString(), color: "text-orange-600" },
              { label: "Needs Identified", value: IMPACT_METRICS.needsIdentified.toString(), color: "text-blue-600" },
              { label: "Platforms Routed", value: IMPACT_METRICS.platformsRouted.toString(), color: "text-emerald-600" },
              { label: "Resources Accessed", value: IMPACT_METRICS.resourcesAccessed.toString(), color: "text-purple-600" },
            ].map((stat) => (
              <Card key={stat.label} className="text-center" data-testid={`dash-stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardContent className="pt-5 pb-4">
                  <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card data-testid="card-top-needs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Top Community Needs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {IMPACT_METRICS.topNeeds.map((need) => (
                  <div key={need.need} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{need.need}</span>
                        <span className="text-xs text-muted-foreground">{need.count} stories ({need.pct}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${need.pct}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card data-testid="card-top-neighborhoods">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Stories by Neighborhood</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {IMPACT_METRICS.topNeighborhoods.map((hood) => (
                  <div key={hood.name} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {hood.name}
                        </span>
                        <span className="text-xs text-muted-foreground">{hood.stories} stories</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-teal-500 h-2 rounded-full transition-all" style={{ width: `${(hood.stories / 34) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-platform-performance">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Platform Routing Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {IMPACT_METRICS.platformPerformance.map((p) => (
                  <div key={p.platform} className="flex items-center justify-between p-3 rounded-lg bg-muted/30" data-testid={`perf-${p.platform.toLowerCase().replace(/\s+/g, '-')}`}>
                    <div>
                      <span className="font-semibold text-sm">{p.platform}</span>
                      <div className="text-xs text-muted-foreground">Avg response: {p.avgTime}</div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-bold">{p.received}</div>
                        <div className="text-xs text-muted-foreground">Received</div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <div className="text-center">
                        <div className="font-bold text-emerald-600">{p.resolved}</div>
                        <div className="text-xs text-muted-foreground">Resolved</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {Math.round((p.resolved / p.received) * 100)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-950/20 dark:to-teal-950/20 border-blue-200 dark:border-blue-800" data-testid="card-regional-dashboard">
            <CardHeader>
              <CardTitle>Regional Network</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Voices of Austin feeds three regional hubs — each with their own assessment, partnerships, and funding pipeline.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = "/austin"} data-testid="link-austin-hub">
                  <CardContent className="pt-4 pb-4 text-center">
                    <MapPin className="h-5 w-5 mx-auto mb-2 text-blue-600" />
                    <div className="font-semibold text-sm">Austin</div>
                    <div className="text-xs text-muted-foreground">Housing & Equity Crisis</div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = "/manor"} data-testid="link-manor-hub">
                  <CardContent className="pt-4 pb-4 text-center">
                    <MapPin className="h-5 w-5 mx-auto mb-2 text-teal-600" />
                    <div className="font-semibold text-sm">Manor</div>
                    <div className="text-xs text-muted-foreground">Growth Without Gaps</div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = "/pflugerville"} data-testid="link-pflugerville-hub">
                  <CardContent className="pt-4 pb-4 text-center">
                    <MapPin className="h-5 w-5 mx-auto mb-2 text-violet-600" />
                    <div className="font-semibold text-sm">Pflugerville</div>
                    <div className="text-xs text-muted-foreground">Infrastructure Before Growth</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="mt-6 space-y-6" data-testid="content-resources">
          <div>
            <h2 className="text-2xl font-bold mb-2">Story → Resource Connections</h2>
            <p className="text-muted-foreground mb-6">
              Every story type automatically connects you to the right platform in our 24-platform ecosystem.
              No cold referrals — warm handoffs with confirmation tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RESOURCE_CONNECTIONS.map((resource) => (
              <Card key={resource.need} className="hover:shadow-md transition-shadow" data-testid={`card-resource-${resource.need.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <resource.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{resource.need}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        <Badge variant="secondary" className="text-xs">{resource.platform}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{resource.route}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-l-4 border-l-emerald-500" data-testid="card-warm-handoff">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">Warm Handoff Protocol</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    When you share a story and identify needs, you're not just getting a list of phone numbers.
                    ThriveUp's ecosystem tracks your connection from platform to platform — ensuring you actually
                    reach the services you need. No dead ends. Always a safety net.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="mt-6 space-y-6" data-testid="content-opportunities">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-bold">Hyper-Local Opportunities</h2>
              <p className="text-muted-foreground">Jobs, grants, housing, training — right here in your neighborhood.</p>
            </div>
            <Select value={opportunityFilter} onValueChange={setOpportunityFilter}>
              <SelectTrigger className="w-40" data-testid="select-opportunity-filter">
                <SelectValue placeholder="Filter by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="housing">Housing</SelectItem>
                <SelectItem value="workforce">Workforce</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="community">Community</SelectItem>
                <SelectItem value="health">Health</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredOpportunities.map((opp) => (
              <Card key={opp.title} className="hover:shadow-md transition-shadow" data-testid={`card-opp-${opp.title.toLowerCase().replace(/\s+/g, '-').substring(0, 25)}`}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold">{opp.title}</h4>
                        <Badge variant="outline" className="text-xs">{opp.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{opp.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {opp.location}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {opp.deadline}</span>
                        <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <DollarSign className="h-3 w-3" /> {opp.amount}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {opp.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="impact" className="mt-6 space-y-6" data-testid="content-impact">
          <div>
            <h2 className="text-2xl font-bold mb-2">Podcast & Media</h2>
            <p className="text-muted-foreground mb-6">
              Community stories become content — amplified through Roku, podcast, and social channels.
              Revenue from CTV advertising funds the platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="text-center" data-testid="card-roku-channel">
              <CardContent className="pt-6">
                <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
                  <Play className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold mb-1">Roku Channel</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Community stories become Roku content — reaching 80M+ households with ad-supported streaming.
                </p>
                <Button variant="outline" size="sm" onClick={() => window.location.href = "/roku-ads"} data-testid="button-roku-studio">
                  Roku Ad Studio <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </CardContent>
            </Card>
            <Card className="text-center" data-testid="card-podcast">
              <CardContent className="pt-6">
                <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-3">
                  <Radio className="h-6 w-6 text-orange-600" />
                </div>
                <h4 className="font-semibold mb-1">Voices Podcast</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Audio stories from community members — amplified through podcast platforms and local radio.
                </p>
                <Badge variant="outline">Coming Q2 2026</Badge>
              </CardContent>
            </Card>
            <Card className="text-center" data-testid="card-video-creator">
              <CardContent className="pt-6">
                <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-1">AI Video Production</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Video Creator AI transforms stories into professional content for funders and stakeholders.
                </p>
                <Button variant="outline" size="sm" onClick={() => window.location.href = "/ai-tools/video-creator"} data-testid="button-video-creator">
                  Video Creator <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800" data-testid="card-content-strategy">
            <CardHeader>
              <CardTitle>Content → Revenue → Impact Loop</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center text-center text-sm">
                {[
                  { label: "Community Stories", sub: "Real voices" },
                  { label: "Video Production", sub: "AI-powered" },
                  { label: "Roku/CTV Distribution", sub: "80M+ households" },
                  { label: "Ad Revenue", sub: "$20–$60 CPM" },
                  { label: "Fund Services", sub: "Cycle continues" },
                ].map((step, i) => (
                  <div key={step.label} className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="font-semibold">{step.label}</div>
                      <div className="text-xs text-muted-foreground">{step.sub}</div>
                    </div>
                    {i < 4 && <ArrowRight className="h-4 w-4 text-orange-400 hidden md:block flex-shrink-0" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-partnership-ask">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Partnership & Pilot Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold text-sm mb-2">Smart City Collaboration</h4>
                  <p className="text-xs text-muted-foreground">
                    Real-time community needs data layer for city planning. Stories generate actionable SDOH intelligence
                    that informs housing, workforce, and health policy decisions.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold text-sm mb-2">Manor / East Austin Pilot</h4>
                  <p className="text-xs text-muted-foreground">
                    Deploy in the neighborhoods with the highest need and the most untapped potential.
                    Manor ISD partnership + East Austin community organizations as anchor points.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold text-sm mb-2">Tech + Funding Partners</h4>
                  <p className="text-xs text-muted-foreground">
                    Roku distribution, AI content production, and grant-funded operations create
                    a self-sustaining content-to-impact pipeline. Revenue funds services.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="moderation" className="mt-6 space-y-6" data-testid="content-moderation">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-bold" data-testid="text-moderation-title">Story Moderation</h2>
                <p className="text-muted-foreground">Review and moderate community story submissions.</p>
              </div>
              <Select value={moderationFilter} onValueChange={setModerationFilter}>
                <SelectTrigger className="w-40" data-testid="select-moderation-filter">
                  <SelectValue placeholder="Filter by status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {moderationLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
              </div>
            ) : moderationStories && moderationStories.length > 0 ? (
              <div className="space-y-4">
                {moderationStories.map((story: CommunityStory) => {
                  const storyType = STORY_TYPES.find(t => t.id === story.storyType);
                  const Icon = storyType?.icon || MessageCircle;
                  return (
                    <Card key={story.id} data-testid={`card-moderate-${story.id}`}>
                      <CardContent className="pt-5 pb-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full ${storyType?.color || 'bg-gray-500'} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
                              <h4 className="font-semibold text-sm" data-testid={`text-moderate-title-${story.id}`}>{story.title}</h4>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge
                                  variant={story.status === "approved" ? "default" : story.status === "rejected" ? "destructive" : "secondary"}
                                  data-testid={`badge-status-${story.id}`}
                                >
                                  {story.status}
                                </Badge>
                                <Badge variant="outline" className="text-xs">{storyType?.label || story.storyType}</Badge>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{story.content}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 flex-wrap">
                              {!story.isAnonymous && <span className="font-medium">{story.authorName}</span>}
                              {story.isAnonymous && <span className="italic">Anonymous</span>}
                              {story.authorNeighborhood && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> {story.authorNeighborhood}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {story.createdAt ? new Date(story.createdAt).toLocaleDateString() : "Recently"}
                              </span>
                            </div>
                            {story.status === "pending" && (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => moderateMutation.mutate({ id: story.id, status: "approved" })}
                                  disabled={moderateMutation.isPending}
                                  data-testid={`button-approve-${story.id}`}
                                >
                                  {moderateMutation.isPending ? (
                                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                  )}
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => moderateMutation.mutate({ id: story.id, status: "rejected" })}
                                  disabled={moderateMutation.isPending}
                                  data-testid={`button-reject-${story.id}`}
                                >
                                  {moderateMutation.isPending ? (
                                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                  ) : (
                                    <XCircle className="h-3.5 w-3.5 mr-1" />
                                  )}
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="text-center py-12" data-testid="card-empty-moderation">
                <CardContent>
                  <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No {moderationFilter} stories</h3>
                  <p className="text-muted-foreground">
                    {moderationFilter === "pending"
                      ? "All stories have been reviewed. Check back later for new submissions."
                      : `No stories with status "${moderationFilter}" found.`}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={showSubmit} onOpenChange={setShowSubmit}>
        <DialogContent className="sm:max-w-lg" data-testid="dialog-submit-story">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-orange-500" /> Share Your Voice
            </DialogTitle>
            <DialogDescription>
              Your story connects you to real resources. Share anonymously if you prefer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="anonymous">Share anonymously</Label>
              <Switch
                id="anonymous"
                checked={formData.isAnonymous}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAnonymous: checked }))}
                data-testid="switch-anonymous"
              />
            </div>
            {!formData.isAnonymous && (
              <div>
                <Label>Your Name</Label>
                <Input
                  value={formData.authorName}
                  onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                  placeholder="First name or nickname"
                  data-testid="input-author-name"
                />
              </div>
            )}
            <div>
              <Label>Neighborhood</Label>
              <Select value={formData.authorNeighborhood} onValueChange={(v) => setFormData(prev => ({ ...prev, authorNeighborhood: v }))}>
                <SelectTrigger data-testid="select-neighborhood">
                  <SelectValue placeholder="Select your area..." />
                </SelectTrigger>
                <SelectContent>
                  {NEIGHBORHOODS.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Story Type</Label>
              <Select value={formData.storyType} onValueChange={(v) => setFormData(prev => ({ ...prev, storyType: v }))}>
                <SelectTrigger data-testid="select-story-type">
                  <SelectValue placeholder="What's this about?" />
                </SelectTrigger>
                <SelectContent>
                  {STORY_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Give your story a title..."
                data-testid="input-story-title"
              />
            </div>
            <div>
              <Label>Your Story</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Tell your story... What happened? What do you need? What change do you want to see?"
                rows={5}
                data-testid="input-story-content"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmit(false)} data-testid="button-cancel-story">Cancel</Button>
            <Button
              onClick={() => submitMutation.mutate(formData)}
              disabled={submitMutation.isPending || !formData.storyType || !formData.title || !formData.content || (!formData.isAnonymous && !formData.authorName)}
              data-testid="button-submit-story"
            >
              {submitMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                <><Send className="h-4 w-4 mr-2" /> Share & Connect</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BackToTop />
    </div>
  );
}
