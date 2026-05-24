import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link, useParams } from "wouter";
import { IntegrationInvitation } from "@/components/integration-invitation";
import { useAuth } from "@/hooks/use-auth";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, MessageCircle, ThumbsUp, AlertTriangle, Send, Loader2, ShieldCheck, Languages,
  BookOpen, Brain, Settings,
} from "lucide-react";
import type { CommunityVoiceProject, CommunityVoicePin } from "@shared/schema";

interface ProjectResponse { project: CommunityVoiceProject; }
interface PinsResponse { pins: CommunityVoicePin[]; }

const CATEGORY_COLORS: Record<string, string> = {
  "service-working": "#10b981",
  "gap-need": "#ef4444",
  "assistance-request": "#f59e0b",
  "safety-concern": "#dc2626",
  "transportation": "#06b6d4",
  "housing": "#3b82f6",
  "food-access": "#22c55e",
  "mental-health": "#8b5cf6",
  "workforce-training": "#eab308",
  "youth-services": "#ec4899",
  "veteran-services": "#0ea5e9",
  "story": "#a855f7",
  "other": "#64748b",
};

function colorFor(cat: string) { return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.other; }

function ClickToPin({ enabled, onPick }: { enabled: boolean; onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) { if (enabled) onPick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

function RecenterOnce({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  return null;
}

export default function VoiceProjectPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const { user } = useAuth();
  const isAdmin = (user as { role?: string } | null)?.role === "admin";
  const { toast } = useToast();

  // Local capability tokens for pins this browser created.
  const tokenKey = `voice:pin-tokens:${slug}`;
  const [myPinTokens, setMyPinTokens] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(tokenKey) || "{}"); } catch { return {}; }
  });
  useEffect(() => { localStorage.setItem(tokenKey, JSON.stringify(myPinTokens)); }, [tokenKey, myPinTokens]);

  const { data: projectData, isLoading: projectLoading } = useQuery<ProjectResponse>({
    queryKey: ["/api/voice/projects", slug],
    enabled: !!slug,
  });
  const project = projectData?.project;

  const { data: pinsData, isLoading: pinsLoading } = useQuery<PinsResponse>({
    queryKey: ["/api/voice/projects", slug, "pins"],
    enabled: !!slug,
  });
  const pins = pinsData?.pins ?? [];

  // Form state
  const [pickMode, setPickMode] = useState(false);
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [category, setCategory] = useState<string>("");
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [anonymized, setAnonymized] = useState(true);
  const [lang, setLang] = useState("en");
  const [activeTab, setActiveTab] = useState<"map" | "list">("map");

  const center = useMemo<[number, number]>(() => [project?.centerLat ?? 30.4394, project?.centerLng ?? -97.62], [project]);
  const zoom = project?.defaultZoom ?? 12;
  const categories = (project?.pinCategories ?? []) as string[];

  const submitMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await apiRequest("POST", `/api/voice/projects/${slug}/pins`, payload);
      return await res.json();
    },
    onSuccess: (resp: { pin: CommunityVoicePin; accessToken: string; crisisRouted: boolean }) => {
      setMyPinTokens((m) => ({ ...m, [resp.pin.id]: resp.accessToken }));
      queryClient.invalidateQueries({ queryKey: ["/api/voice/projects", slug, "pins"] });
      // Reset form
      setPicked(null); setCategory(""); setBody(""); setPickMode(false);
      toast({
        title: resp.crisisRouted ? "Pin posted — and we're routing support" : "Pin posted",
        description: resp.crisisRouted
          ? "Your input mentioned something serious. Whole-Person Health and LifeBridge have been notified to reach out with help."
          : "Thanks for sharing. Your voice is part of the data now.",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Could not post pin", description: err.message, variant: "destructive" });
    },
  });

  const reactMutation = useMutation({
    mutationFn: async ({ pinId }: { pinId: string }) => {
      const res = await apiRequest("POST", `/api/voice/pins/${pinId}/reactions`, { reactionType: "up" });
      return await res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/voice/projects", slug, "pins"] }); },
  });

  const handleSubmit = useCallback(() => {
    if (!picked) { toast({ title: "Pick a location on the map first", variant: "destructive" }); return; }
    if (!category) { toast({ title: "Pick a category", variant: "destructive" }); return; }
    if (body.trim().length < 3) { toast({ title: "Add a few words to share what's happening", variant: "destructive" }); return; }
    const needsEmail = project?.accessMode !== "public";
    if (needsEmail && !authorEmail) { toast({ title: "This project requires an email address", variant: "destructive" }); return; }
    submitMutation.mutate({
      lat: picked.lat, lng: picked.lng, category, body: body.trim(),
      originalLanguage: lang, anonymized,
      authorEmail: authorEmail || undefined,
      authorName: authorName || undefined,
    });
  }, [picked, category, body, lang, anonymized, authorEmail, authorName, project, submitMutation, toast]);

  if (projectLoading) {
    return <div className="container mx-auto px-4 py-6"><Skeleton className="h-[600px] w-full" /></div>;
  }
  if (!project) {
    return <div className="container mx-auto px-4 py-6"><p>Project not found.</p></div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl" data-testid={`page-voice-project-${slug}`}>
      <PageHeader
        title={project.name}
        description={project.description ?? undefined}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Voice", href: "/voice" },
          { label: project.name },
        ]}
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="outline" className="gap-1"><MapPin className="h-3 w-3" />{pins.length} pins</Badge>
        {project.crisisRoutingEnabled && (
          <Badge variant="outline" className="gap-1 text-emerald-700 dark:text-emerald-400 border-emerald-300">
            <ShieldCheck className="h-3 w-3" /> Crisis-routed to WPH + LifeBridge
          </Badge>
        )}
        <Badge variant="outline" className="gap-1"><Languages className="h-3 w-3" /> 89 languages supported</Badge>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <Link href={`/voice/${slug}/story`} data-testid="nav-story">
          <Button variant="outline" size="sm"><BookOpen className="h-4 w-4 mr-1" />Story</Button>
        </Link>
        {isAdmin && (
          <>
            <Link href={`/voice/${slug}/insights`} data-testid="nav-insights">
              <Button variant="outline" size="sm"><Brain className="h-4 w-4 mr-1" />Insights</Button>
            </Link>
            <Link href={`/voice/${slug}/admin`} data-testid="nav-admin">
              <Button variant="outline" size="sm"><Settings className="h-4 w-4 mr-1" />Admin</Button>
            </Link>
          </>
        )}
      </div>

      <IntegrationInvitation
        surface="voice-project"
        surfaceContext={slug}
        prompt={slug === "north-wilco-childcare-gaps"
          ? "Are you already holding North Williamson County together?"
          : "Are you doing this work in your community?"}
        description={slug === "north-wilco-childcare-gaps"
          ? "If you're watching kids that aren't yours so their parents can work the night shift at Samsung Taylor or Applied Materials Hutto — if you're the abuela, the auntie, the neighbor, the family home daycare with no license but a full house — you ARE the childcare system in North Wilco. We want to hear you on your terms. No license check. No proof asked. You decide what we do with what you share."
          : undefined}
        suggestedRoleTags={slug === "north-wilco-childcare-gaps"
          ? ["informal caregiver", "family home daycare", "abuela / grandmother", "shift-work parent", "bilingual care", "infant care", "extended-hours care", "special-needs care"]
          : undefined}
        className="mb-5"
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "map" | "list")}>
        <TabsList>
          <TabsTrigger value="map" data-testid="tab-voice-map">Map</TabsTrigger>
          <TabsTrigger value="list" data-testid="tab-voice-list">List</TabsTrigger>
        </TabsList>

        <TabsContent value="map">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <Card className="lg:col-span-2">
              <CardContent className="p-0">
                <div className="h-[560px] rounded-md overflow-hidden">
                  <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
                    <RecenterOnce center={center} zoom={zoom} />
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap contributors'
                    />
                    <ClickToPin enabled={pickMode} onPick={(la, ln) => { setPicked({ lat: la, lng: ln }); setPickMode(false); }} />
                    {pins.map((p) => (
                      <CircleMarker
                        key={p.id}
                        center={[p.lat, p.lng]}
                        radius={9}
                        pathOptions={{ color: colorFor(p.category), fillColor: colorFor(p.category), fillOpacity: 0.75, weight: 1.5 }}
                      >
                        <Popup>
                          <div className="min-w-[200px]">
                            <div className="flex items-center gap-1 mb-1">
                              <Badge variant="outline" className="text-[10px]">{p.category}</Badge>
                              {p.crisisFlag && <Badge variant="destructive" className="text-[10px] gap-1"><AlertTriangle className="h-3 w-3" />Crisis-routed</Badge>}
                            </div>
                            <p className="text-sm mb-2 whitespace-pre-wrap" data-testid={`text-pin-body-${p.id}`}>{p.body}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{p.anonymized ? "Anonymous" : (p.authorName || "Anonymous")}</span>
                              <Button size="sm" variant="ghost" className="h-6 gap-1 text-xs"
                                onClick={() => reactMutation.mutate({ pinId: p.id })}
                                data-testid={`button-upvote-${p.id}`}>
                                <ThumbsUp className="h-3 w-3" /> {p.upvotes ?? 0}
                              </Button>
                            </div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                    {picked && (
                      <CircleMarker center={[picked.lat, picked.lng]} radius={12}
                        pathOptions={{ color: "#0ea5e9", fillColor: "#0ea5e9", fillOpacity: 0.5, weight: 2, dashArray: "4 3" }}>
                        <Popup>New pin will go here</Popup>
                      </CircleMarker>
                    )}
                  </MapContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5 space-y-3">
                <div>
                  <Label className="text-xs">Step 1 — Location</Label>
                  <Button
                    variant={pickMode ? "default" : "outline"}
                    className="w-full justify-start gap-2 mt-1"
                    onClick={() => setPickMode((m) => !m)}
                    data-testid="button-pick-location"
                  >
                    <MapPin className="h-4 w-4" />
                    {picked ? `${picked.lat.toFixed(4)}, ${picked.lng.toFixed(4)}` : pickMode ? "Click on the map…" : "Pick a spot on the map"}
                  </Button>
                </div>

                <div>
                  <Label className="text-xs">Step 2 — Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-1" data-testid="select-pin-category"><SelectValue placeholder="What is this about?" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (<SelectItem key={c} value={c}>{c.replace(/-/g, " ")}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Step 3 — What's happening?</Label>
                  <Textarea
                    placeholder="Share what's working, what's a gap, or what help is needed here…"
                    rows={4}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="mt-1"
                    data-testid="textarea-pin-body"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">{body.length}/2000</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Name (optional)</Label>
                    <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="mt-1" data-testid="input-author-name" />
                  </div>
                  <div>
                    <Label className="text-xs">Language</Label>
                    <Select value={lang} onValueChange={setLang}>
                      <SelectTrigger className="mt-1" data-testid="select-language"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="vi">Tiếng Việt</SelectItem>
                        <SelectItem value="zh">中文</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="ko">한국어</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="tl">Tagalog</SelectItem>
                        <SelectItem value="hi">हिन्दी</SelectItem>
                        <SelectItem value="my">မြန်မာ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {project.accessMode !== "public" && (
                  <div>
                    <Label className="text-xs">Email (required for this project)</Label>
                    <Input type="email" value={authorEmail} onChange={(e) => setAuthorEmail(e.target.value)} className="mt-1" data-testid="input-author-email" />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Post anonymously</Label>
                  <Switch checked={anonymized} onCheckedChange={setAnonymized} data-testid="switch-anonymize" />
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                  data-testid="button-submit-pin"
                >
                  {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Drop pin
                </Button>

                {project.crisisRoutingEnabled && (
                  <p className="text-[10px] text-muted-foreground border-t pt-2">
                    <ShieldCheck className="h-3 w-3 inline mr-1" />
                    If your message indicates a crisis, our Whole-Person Health team and LifeBridge will be notified to reach out with help. You're not alone.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="list">
          {pinsLoading ? (
            <Skeleton className="h-40 mt-4" />
          ) : pins.length === 0 ? (
            <Card className="mt-4"><CardContent className="py-10 text-center text-muted-foreground">No pins yet. Be the first to share.</CardContent></Card>
          ) : (
            <div className="space-y-2 mt-4">
              {pins.map((p) => (
                <Card key={p.id} data-testid={`card-pin-${p.id}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="h-3 w-3 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: colorFor(p.category) }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <Badge variant="outline" className="text-[10px]">{p.category}</Badge>
                          {p.sentiment && <Badge variant="outline" className="text-[10px]">{p.sentiment}</Badge>}
                          {p.crisisFlag && <Badge variant="destructive" className="text-[10px]">Crisis-routed</Badge>}
                          <span className="text-[10px] text-muted-foreground">{new Date(p.createdAt as unknown as string).toLocaleString()}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap" data-testid={`text-listpin-body-${p.id}`}>{p.body}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{p.anonymized ? "Anonymous" : (p.authorName || "Anonymous")}</span>
                          <span>·</span>
                          <span>{(p.lat as number).toFixed(3)}, {(p.lng as number).toFixed(3)}</span>
                          <Button size="sm" variant="ghost" className="h-6 gap-1 ml-auto"
                            onClick={() => reactMutation.mutate({ pinId: p.id })}
                            data-testid={`button-list-upvote-${p.id}`}>
                            <ThumbsUp className="h-3 w-3" /> {p.upvotes ?? 0}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
