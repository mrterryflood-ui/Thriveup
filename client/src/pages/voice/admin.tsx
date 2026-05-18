import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Settings, MessageCircle, Archive, RotateCcw, Eye, EyeOff, ShieldAlert, Save } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Project = {
  id: number; slug: string; name: string; description: string | null;
  accessMode: "public" | "email" | "hybrid";
  crisisRoutingEnabled: boolean;
  pinCategories: string[];
  status: string;
  publiclyVisible: boolean;
  centerLat: number; centerLng: number; defaultZoom: number;
};

type Pin = {
  id: string; body: string; category: string; status: string; createdAt: string;
  displayName: string | null; anonymized: boolean; sentiment: string | null; crisisFlag: boolean;
  crisisRoutedTo: string | null; lat: number; lng: number;
};

export default function VoiceAdminPage() {
  const [, params] = useRoute("/voice/:slug/admin");
  const slug = params?.slug ?? "";
  const { toast } = useToast();

  const projectQ = useQuery<{ project: Project }>({ queryKey: ["/api/voice/projects", slug], enabled: !!slug });
  const pinsQ = useQuery<{ pins: Pin[] }>({ queryKey: ["/api/voice/projects", slug, "admin", "pins"], enabled: !!slug });
  const project = projectQ.data?.project;
  const pins = pinsQ.data?.pins ?? [];

  // Local form state, hydrated when project loads.
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [accessMode, setAccessMode] = useState<Project["accessMode"]>("public");
  const [crisisRoutingEnabled, setCrisis] = useState(true);
  const [publiclyVisible, setPubliclyVisible] = useState(true);
  const [status, setStatus] = useState("active");
  // Hydrate via useEffect keyed on slug + project id so navigating between
  // projects re-syncs the form. Setting state during render is an anti-pattern
  // and can leak stale values across slug transitions.
  useEffect(() => {
    if (!project) return;
    setName(project.name);
    setDescription(project.description ?? "");
    setAccessMode(project.accessMode);
    setCrisis(project.crisisRoutingEnabled);
    setPubliclyVisible(project.publiclyVisible);
    setStatus(project.status);
  }, [project?.id, slug]);

  const saveSettings = useMutation({
    mutationFn: async () => apiRequest("PATCH", `/api/voice/projects/${slug}`, {
      name, description: description || null, accessMode, crisisRoutingEnabled, publiclyVisible, status,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/voice/projects", slug] });
      toast({ title: "Settings saved", description: "Your project is updated. Thanks for keeping it current." });
    },
    onError: () => toast({ title: "Couldn't save", variant: "destructive" }),
  });

  const updatePin = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Pin> }) => apiRequest("PATCH", `/api/voice/pins/${id}/admin`, patch),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/voice/projects", slug, "admin", "pins"] });
    },
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  const published = pins.filter((p) => p.status === "published");
  const archived = pins.filter((p) => p.status === "archived");
  const flagged = pins.filter((p) => p.crisisFlag);

  return (
    <div className="container max-w-6xl py-8 px-4">
      <Link href={`/voice/${slug}`} data-testid="link-back"><Button variant="ghost" size="sm" className="mb-3"><ArrowLeft className="h-4 w-4 mr-1" />Back to map</Button></Link>
      <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 mb-1"><Settings className="h-7 w-7 text-primary" />Admin</h1>
      <p className="text-muted-foreground mb-6">{project?.name ?? "Loading…"}</p>

      <Tabs defaultValue="moderation">
        <TabsList>
          <TabsTrigger value="moderation" data-testid="tab-moderation"><MessageCircle className="h-4 w-4 mr-1" />Pins ({pins.length})</TabsTrigger>
          <TabsTrigger value="crisis" data-testid="tab-crisis"><ShieldAlert className="h-4 w-4 mr-1" />Safety routing ({flagged.length})</TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings"><Settings className="h-4 w-4 mr-1" />Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="moderation" className="space-y-4 mt-4">
          <div className="grid sm:grid-cols-3 gap-3 mb-3">
            <Card><CardContent className="pt-5"><div className="text-2xl font-bold">{published.length}</div><div className="text-xs text-muted-foreground">Live on the map</div></CardContent></Card>
            <Card><CardContent className="pt-5"><div className="text-2xl font-bold">{archived.length}</div><div className="text-xs text-muted-foreground">Archived</div></CardContent></Card>
            <Card><CardContent className="pt-5"><div className="text-2xl font-bold">{flagged.length}</div><div className="text-xs text-muted-foreground">Routed for safety</div></CardContent></Card>
          </div>
          <div className="space-y-2">
            {pins.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No pins yet — share your project link with your community.</p>}
            {pins.map((p) => (
              <Card key={p.id} className={p.status === "archived" ? "opacity-60" : ""} data-testid={`admin-pin-${p.id}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge variant="outline">{p.category}</Badge>
                        {p.sentiment && <Badge variant="outline" className="text-xs">{p.sentiment}</Badge>}
                        {p.crisisFlag && <Badge variant="destructive" className="text-xs"><ShieldAlert className="h-3 w-3 mr-1" />crisis</Badge>}
                        <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
                        <span className="text-xs text-muted-foreground">· {p.anonymized || !p.displayName ? "Anonymous" : p.displayName}</span>
                      </div>
                      <p className="text-sm">{p.body}</p>
                      <div className="text-xs text-muted-foreground mt-1">{p.lat.toFixed(4)}, {p.lng.toFixed(4)}</div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {p.status === "published" ? (
                        <Button size="sm" variant="outline" onClick={() => updatePin.mutate({ id: p.id, patch: { status: "archived" } })} data-testid={`button-archive-${p.id}`}><Archive className="h-3 w-3 mr-1" />Archive</Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => updatePin.mutate({ id: p.id, patch: { status: "published" } })} data-testid={`button-restore-${p.id}`}><RotateCcw className="h-3 w-3 mr-1" />Restore</Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => updatePin.mutate({ id: p.id, patch: { anonymized: !p.anonymized } })} data-testid={`button-anon-${p.id}`}>
                        {p.anonymized ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="crisis" className="space-y-3 mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Pins routed to our safety net</CardTitle><CardDescription>These were automatically forwarded to Whole-Person Health and LifeBridge for outreach.</CardDescription></CardHeader>
            <CardContent>
              {flagged.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No crisis-routed pins. Quiet days are good days.</p>
              ) : (
                <div className="space-y-3">
                  {flagged.map((p) => (
                    <div key={p.id} className="rounded-lg border bg-destructive/5 p-3" data-testid={`crisis-pin-${p.id}`}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <Badge variant="destructive" className="mb-1"><ShieldAlert className="h-3 w-3 mr-1" />Routed</Badge>
                          <p className="text-sm">{p.body}</p>
                          <p className="text-xs text-muted-foreground mt-1">Routed to {p.crisisRoutedTo ?? "—"} · {new Date(p.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Project settings</CardTitle><CardDescription>Update what residents see and how you receive their voices.</CardDescription></CardHeader>
            <CardContent className="space-y-5 max-w-2xl">
              <div className="space-y-2"><Label htmlFor="a-name">Name</Label><Input id="a-name" value={name} onChange={(e) => setName(e.target.value)} data-testid="input-admin-name" /></div>
              <div className="space-y-2"><Label htmlFor="a-desc">Description</Label><Textarea id="a-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} data-testid="input-admin-desc" /></div>
              <div className="space-y-2">
                <Label>Access mode</Label>
                <Select value={accessMode} onValueChange={(v) => setAccessMode(v as Project["accessMode"])}>
                  <SelectTrigger data-testid="select-access"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public (anyone)</SelectItem>
                    <SelectItem value="email">Email required</SelectItem>
                    <SelectItem value="hybrid">Hybrid (optional email)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><div className="font-medium text-sm">Publicly visible</div><div className="text-xs text-muted-foreground">Anyone with the link can view the map.</div></div>
                <Switch checked={publiclyVisible} onCheckedChange={setPubliclyVisible} data-testid="switch-public" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><div className="font-medium text-sm">Crisis routing</div><div className="text-xs text-muted-foreground">Forward unsafe pins silently to Whole-Person Health + LifeBridge.</div></div>
                <Switch checked={crisisRoutingEnabled} onCheckedChange={setCrisis} data-testid="switch-crisis-admin" />
              </div>
              <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending} data-testid="button-save-settings">
                <Save className="h-4 w-4 mr-1" />{saveSettings.isPending ? "Saving…" : "Save settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
