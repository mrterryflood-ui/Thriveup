// The community story: share a location or enter a ZIP, and ThriveUp tells
// the community and leadership story — schools, providers, social
// determinants, county context, live hazard context, with representatives
// and news linked through the official tools rather than fabricated.
// Sections can be toggled; the ZIP and the toggles are saved to this
// browser so the story reopens where the resident left it.
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search, ExternalLink } from "lucide-react";

type Section = {
  id: string;
  title: string;
  status: "live" | "unavailable" | "external" | "needs-zip";
  note: string;
  data?: unknown;
  links?: { label: string; url: string }[];
};
type Story = {
  community: { zip: string | null; lat: number | null; lon: number | null; name: string; county: string | null };
  generatedAt: string;
  sections: Section[];
  law: string;
};

const PREFS_KEY = "thriveup:community-story";
const ALL_SECTIONS = ["schools", "providers", "sdoh", "childcore", "community-context", "hazard", "reps", "news"];
type Prefs = { zip: string; hidden: string[] };

function loadPrefs(): Prefs {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) || "");
    return { zip: typeof p.zip === "string" ? p.zip : "", hidden: Array.isArray(p.hidden) ? p.hidden : [] };
  } catch {
    return { zip: "", hidden: [] };
  }
}

export default function CommunityStoryPage() {
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [zipDraft, setZipDraft] = useState(prefs.zip);
  const [locating, setLocating] = useState(false);
  const [point, setPoint] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const story = useQuery<Story, Error>({
    queryKey: ["/api/community/story", prefs.zip || point],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (prefs.zip) params.set("zip", prefs.zip);
      if (point) { params.set("lat", String(point.lat)); params.set("lon", String(point.lon)); }
      if (!prefs.zip && !point) throw new Error("Enter a ZIP code or share your location to open the story.");
      const r = await fetch(`/api/community/story?${params.toString()}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d?.message || "The story did not answer.");
      return d;
    },
    enabled: Boolean(prefs.zip || point),
    staleTime: 5 * 60_000,
  });

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setPoint({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setLocating(false); },
      () => setLocating(false),
      { timeout: 12_000 },
    );
  };

  const toggle = (id: string) =>
    setPrefs((p) => ({ ...p, hidden: p.hidden.includes(id) ? p.hidden.filter((x) => x !== id) : [...p.hidden, id] }));

  const visible = (s: Section) => !prefs.hidden.includes(s.id);
  const statusBadge = (s: Section) => (
    <Badge variant={s.status === "live" ? "default" : s.status === "external" ? "outline" : "secondary"} className="text-[10px] flex-none">
      {s.status === "external" ? "official tools" : s.status === "needs-zip" ? "needs ZIP" : s.status}
    </Badge>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">My Community Story</h1>
        <p className="text-sm text-muted-foreground">
          Share a location or enter a ZIP and ThriveUp tells the community and leadership story: schools, providers,
          social determinants, county context, and live hazard context. Representatives and news link to the official
          tools. Your ZIP and section choices are saved on this device.
        </p>
      </header>

      <Card className="p-4" data-testid="story-controls">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex gap-2">
            <Input
              value={zipDraft}
              onChange={(e) => setZipDraft(e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder="ZIP code"
              className="flex-1"
              aria-label="ZIP code"
              inputMode="numeric"
            />
            <Button onClick={() => { setPoint(null); setPrefs((p) => ({ ...p, zip: zipDraft })); }} disabled={zipDraft.length !== 5}>
              <Search className="w-4 h-4 mr-1" /> Open the story
            </Button>
          </div>
          <Button variant="outline" onClick={useMyLocation} disabled={locating}>
            <MapPin className="w-4 h-4 mr-1" /> {locating ? "Locating…" : "Use my location"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3" data-testid="story-toggles">
          <span className="text-[11px] text-muted-foreground py-0.5">Show:</span>
          {ALL_SECTIONS.map((id) => (
            <button
              key={id}
              onClick={() => toggle(id)}
              className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${prefs.hidden.includes(id) ? "opacity-40" : "bg-primary/10 border-primary/30"}`}
              aria-pressed={!prefs.hidden.includes(id)}
            >
              {id === "community-context" ? "context" : id === "childcore" ? "schools & providers" : id}
            </button>
          ))}
        </div>
      </Card>

      {story.isLoading && <p className="text-sm text-muted-foreground">Reading the community…</p>}
      {story.isError && (
        <Card className="p-4 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
          <p className="text-xs text-amber-700 dark:text-amber-400">{(story.error as Error)?.message}</p>
        </Card>
      )}

      {story.data && (
        <div className="space-y-3" data-testid="story-sections">
          <p className="text-sm font-medium">
            {story.data.community.name}
            {story.data.community.zip ? ` · ZIP ${story.data.community.zip}` : ""}
            {story.data.community.county ? ` · ${story.data.community.county}` : ""}
          </p>
          {story.data.sections.filter(visible).map((s) => (
            <Card key={s.id} className="p-4 space-y-2" data-testid={`story-${s.id}`}>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">{s.title}</h2>
                {statusBadge(s)}
              </div>
              <p className="text-xs text-muted-foreground">{s.note}</p>
              {s.id === "hazard" && s.data != null && typeof s.data === "object" && (
                <div className="text-xs space-y-1">
                  {((s.data as any).place?.name) && <div className="font-medium">{(s.data as any).place.name}</div>}
                  {((s.data as any).summary) && <p className="text-muted-foreground">{(s.data as any).summary}</p>}
                  {(((s.data as any).feeds) || []).slice(0, 5).map((f: any) => (
                    <div key={f.id} className="border rounded p-1.5 flex items-start gap-2">
                      <Badge variant={f.status === "live" ? "default" : "secondary"} className="text-[10px] flex-none">{f.status || "?"}</Badge>
                      <div className="min-w-0"><div className="font-medium truncate">{f.name || f.id}</div><p className="text-muted-foreground line-clamp-2">{f.detail}</p></div>
                    </div>
                  ))}
                </div>
              )}
              {s.id === "community-context" && s.data != null && typeof s.data === "object" && (
                <p className="text-xs border-l-2 pl-2 whitespace-pre-line">{(s.data as any).narrative || "The context service returned no narrative."}</p>
              )}
              {(s.id === "schools" || s.id === "providers" || s.id === "sdoh") && s.data != null && (
                <pre className="text-[11px] bg-muted rounded p-2 overflow-x-auto max-h-64 overflow-y-auto">{JSON.stringify(s.data, null, 1).slice(0, 4000)}</pre>
              )}
              {(s.id === "schools" || s.id === "providers" || s.id === "sdoh") && s.data == null && (
                <p className="text-xs text-muted-foreground">This section of the ChildCORE answer was empty. Empty is named, not assumed complete.</p>
              )}
              {s.links?.map((l) => (
                <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="text-xs underline flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> {l.label}
                </a>
              ))}
            </Card>
          ))}
          <footer className="text-[11px] text-muted-foreground border-t pt-3">{story.data.law}</footer>
        </div>
      )}
    </div>
  );
}
