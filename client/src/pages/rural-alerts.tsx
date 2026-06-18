import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Flame, Droplets, Bug, Cloud, Building, RefreshCw, ExternalLink, MapPin, Zap } from "lucide-react";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA",
  "ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK",
  "OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

const STATE_NAMES: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",
  DE:"Delaware",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",
  KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",
  MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",
  NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",
  OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",
  TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",
  WI:"Wisconsin",WY:"Wyoming",
};

const SEVERITY_COLORS: Record<string, string> = {
  Extreme: "bg-red-600 text-white",
  Severe: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  Moderate: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Minor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  Unknown: "bg-slate-100 text-slate-700",
  critical: "bg-red-600 text-white",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  moderate: "bg-amber-100 text-amber-800",
  info: "bg-blue-100 text-blue-800",
};

const CATEGORY_ICONS: Record<string, any> = {
  wildfire: Flame, drought: Droplets, flood: Droplets, "severe-storm": Cloud,
  freeze: Cloud, heat: Zap, wind: Cloud, weather: Cloud,
};

function AlertCard({ alert }: { alert: any }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = CATEGORY_ICONS[alert.category] || AlertTriangle;
  const sev = alert.severity || alert.type || "Unknown";
  return (
    <Card className="border-l-4 border-l-amber-500 dark:border-l-amber-400" data-testid="alert-card">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Icon className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold text-sm">{alert.event || alert.title}</span>
              <Badge className={`text-xs ${SEVERITY_COLORS[sev] || SEVERITY_COLORS.Unknown}`}>{sev}</Badge>
            </div>
            {alert.areas && <p className="text-xs text-slate-500 flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" />{alert.areas}</p>}
            {alert.headline && <p className="text-sm text-slate-600 dark:text-slate-400">{alert.headline}</p>}
            {expanded && alert.description && <p className="text-xs text-slate-500 mt-2 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-2">{alert.description}</p>}
            {expanded && alert.instruction && <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mt-2">{alert.instruction}</p>}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setExpanded(e => !e)}>
              {expanded ? "Less" : "More"}
            </Button>
            {alert.expires && <p className="text-xs text-slate-400">Expires: {new Date(alert.expires).toLocaleDateString()}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WildfireCard({ fire }: { fire: any }) {
  return (
    <Card className="border-l-4 border-l-red-500" data-testid="wildfire-card">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-red-600" />
              <span className="font-bold text-sm">{fire.name}</span>
              {fire.percentContained !== null && <Badge variant="outline" className="text-xs">{fire.percentContained}% contained</Badge>}
            </div>
            <p className="text-xs text-slate-500">{fire.county}, {fire.state}</p>
            {fire.acres && <p className="text-sm font-semibold text-red-700 dark:text-red-400 mt-1">{fire.acres?.toLocaleString()} acres</p>}
            <p className="text-xs text-slate-400 mt-1">Cause: {fire.cause || "Under investigation"}</p>
          </div>
          <a href="https://www.nifc.gov/fire-information/active-incidents" target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
            <ExternalLink className="w-3 h-3" />NIFC ↗
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

function DisasterCard({ d }: { d: any }) {
  return (
    <Card className="border-l-4 border-l-blue-500" data-testid="disaster-card">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Building className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-sm">{d.title}</span>
              <Badge className="bg-blue-100 text-blue-800 text-xs">{d.incidentType}</Badge>
            </div>
            <p className="text-xs text-slate-500">{d.county} · DR-{d.disasterNumber}</p>
            {d.programsApproved?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {d.programsApproved.map((p: string) => <span key={p} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{p}</span>)}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1">Declared: {new Date(d.declarationDate).toLocaleDateString()}</p>
          </div>
          <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5 shrink-0">
            <ExternalLink className="w-3 h-3" />Apply ↗
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

function AphisCard({ alert }: { alert: any }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className={`border-l-4 ${alert.severity === "critical" ? "border-l-red-600" : alert.severity === "high" ? "border-l-orange-500" : "border-l-amber-400"}`} data-testid="aphis-card">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Bug className="w-4 h-4 text-red-600" />
              <span className="font-bold text-sm">{alert.title}</span>
              <Badge className={`text-xs ${SEVERITY_COLORS[alert.severity] || ""}`}>{alert.severity}</Badge>
            </div>
            {alert.states && <p className="text-xs text-slate-500 mb-1">States: {alert.states?.join(", ")}</p>}
            <p className="text-sm text-slate-600 dark:text-slate-400">{alert.summary}</p>
            {expanded && alert.actions && (
              <ul className="mt-2 space-y-1">
                {alert.actions.map((a: string, i: number) => <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5"><span className="text-red-500 shrink-0">•</span>{a}</li>)}
              </ul>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setExpanded(e => !e)}>
              {expanded ? "Less" : "Actions"}
            </Button>
            <a href={alert.reportUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
              <ExternalLink className="w-3 h-3" />APHIS ↗
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RuralAlertsPage() {
  const [state, setState] = useState("TX");

  const { data: feed, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["/api/rural-alerts/feed", state],
    queryFn: async () => {
      const r = await apiRequest("GET", `/api/rural-alerts/feed?state=${state}`);
      return r.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const weatherAlerts = feed?.sections?.weather?.alerts || [];
  const disasters = feed?.sections?.disasters?.declarations || [];
  const wildfires = feed?.sections?.wildfires?.incidents || [];
  const aphisCurated = feed?.sections?.aphis?.curated || [];
  const aphisLive = feed?.sections?.aphis?.live || [];

  const totalAlerts = weatherAlerts.length + disasters.length + wildfires.length + aphisCurated.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5">
        <nav className="text-xs text-slate-500 mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /><span>Rural Situational Intelligence — ThriveUp Academy</span></nav>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">Rural Situational Intelligence</h1>
            <p className="mt-1 text-slate-500 max-w-2xl">Live alerts: NOAA weather · FEMA disaster declarations · NIFC wildfires · USDA APHIS disease & pest outbreaks · U.S. Drought Monitor. All primary source, no delay.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={state} onValueChange={setState}>
              <SelectTrigger className="w-32" data-testid="select-alert-state"><SelectValue /></SelectTrigger>
              <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s} — {STATE_NAMES[s]}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} data-testid="button-refresh">
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isFetching ? "animate-spin" : ""}`} />Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Summary bar */}
        {feed && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-extrabold text-amber-700">{weatherAlerts.length}</p>
              <p className="text-xs text-slate-500">NOAA Weather Alerts</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-extrabold text-red-700">{wildfires.length}</p>
              <p className="text-xs text-slate-500">Active Wildfires</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-extrabold text-blue-700">{disasters.length}</p>
              <p className="text-xs text-slate-500">FEMA Disasters</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-extrabold text-orange-700">{aphisCurated.length}</p>
              <p className="text-xs text-slate-500">USDA APHIS Alerts</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-20">
            <AlertTriangle className="w-12 h-12 mx-auto text-amber-400 animate-pulse mb-4" />
            <p className="text-slate-500">Pulling live intelligence from NOAA, FEMA, NIFC, USDA APHIS…</p>
          </div>
        )}

        {feed && (
          <Tabs defaultValue="all">
            <TabsList className="mb-5 flex-wrap">
              <TabsTrigger value="all" data-testid="tab-all">All ({totalAlerts})</TabsTrigger>
              <TabsTrigger value="aphis" data-testid="tab-aphis"><Bug className="w-3.5 h-3.5 mr-1" />Disease & Pest ({aphisCurated.length})</TabsTrigger>
              <TabsTrigger value="weather" data-testid="tab-weather"><Cloud className="w-3.5 h-3.5 mr-1" />Weather ({weatherAlerts.length})</TabsTrigger>
              <TabsTrigger value="wildfire" data-testid="tab-wildfire"><Flame className="w-3.5 h-3.5 mr-1" />Wildfire ({wildfires.length})</TabsTrigger>
              <TabsTrigger value="disaster" data-testid="tab-disaster"><Building className="w-3.5 h-3.5 mr-1" />FEMA ({disasters.length})</TabsTrigger>
              <TabsTrigger value="drought" data-testid="tab-drought"><Droplets className="w-3.5 h-3.5 mr-1" />Drought</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="space-y-3">
                {aphisCurated.map((a: any, i: number) => <AphisCard key={i} alert={a} />)}
                {wildfires.slice(0, 5).map((f: any, i: number) => <WildfireCard key={i} fire={f} />)}
                {disasters.slice(0, 5).map((d: any, i: number) => <DisasterCard key={i} d={d} />)}
                {weatherAlerts.slice(0, 10).map((a: any, i: number) => <AlertCard key={i} alert={a} />)}
                {totalAlerts === 0 && <div className="text-center py-12 text-slate-500">No active alerts for {STATE_NAMES[state]}. Check individual tabs or try another state.</div>}
              </div>
            </TabsContent>

            <TabsContent value="aphis">
              <div className="space-y-3">
                {aphisCurated.length > 0
                  ? aphisCurated.map((a: any, i: number) => <AphisCard key={i} alert={a} />)
                  : <p className="text-center py-12 text-slate-500">No USDA APHIS alerts currently affecting {STATE_NAMES[state]}.</p>}
                {aphisLive.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-500 mb-2">USDA APHIS Latest News:</p>
                    {aphisLive.map((n: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <ExternalLink className="w-3 h-3 text-blue-500 shrink-0" />
                        <a href={n.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{n.title}</a>
                        <span className="text-xs text-slate-400 ml-auto shrink-0">{n.pubDate?.slice(0, 11)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="weather">
              <div className="space-y-3">
                {weatherAlerts.length > 0
                  ? weatherAlerts.map((a: any, i: number) => <AlertCard key={i} alert={a} />)
                  : <p className="text-center py-12 text-slate-500">No active NOAA weather alerts for {STATE_NAMES[state]}.</p>}
                <p className="text-xs text-slate-400 text-center">Source: NOAA National Weather Service · api.weather.gov</p>
              </div>
            </TabsContent>

            <TabsContent value="wildfire">
              <div className="space-y-3">
                {wildfires.length > 0
                  ? wildfires.map((f: any, i: number) => <WildfireCard key={i} fire={f} />)
                  : <p className="text-center py-12 text-slate-500">No active wildfires reported in {STATE_NAMES[state]}.</p>}
                <div className="flex justify-center mt-2">
                  <a href="https://www.nifc.gov/fire-information/active-incidents" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                    <ExternalLink className="w-3.5 h-3.5" />View all active incidents on NIFC ↗
                  </a>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="disaster">
              <div className="space-y-3">
                {disasters.length > 0
                  ? disasters.map((d: any, i: number) => <DisasterCard key={i} d={d} />)
                  : <p className="text-center py-12 text-slate-500">No major disaster declarations for {STATE_NAMES[state]} in the past 18 months.</p>}
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg p-4 mt-2">
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Disaster Assistance</p>
                  <div className="flex flex-wrap gap-3">
                    <a href="https://www.disasterassistance.gov/" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" />DisasterAssistance.gov</a>
                    <a href="https://www.fsa.usda.gov/programs-and-services/disaster-assistance-program/index" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" />USDA FSA Disaster Programs</a>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="drought">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Droplets className="w-5 h-5 text-blue-600" />U.S. Drought Monitor — {STATE_NAMES[state]}</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">The U.S. Drought Monitor is updated every Tuesday. Live map below covers current drought conditions by county.</p>
                    <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border">
                      <iframe
                        src={`https://droughtmonitor.unl.edu/CurrentMap/StateDroughtMonitor.aspx?${state}`}
                        className="w-full h-full"
                        title="U.S. Drought Monitor"
                        sandbox="allow-scripts allow-same-origin"
                      />
                    </div>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <a href={`https://droughtmonitor.unl.edu/CurrentMap/StateDroughtMonitor.aspx?${state}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                        <ExternalLink className="w-3.5 h-3.5" />Full Drought Monitor for {state} ↗
                      </a>
                      <a href="https://www.fsa.usda.gov/programs-and-services/disaster-assistance-program/drought/index" target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                        <ExternalLink className="w-3.5 h-3.5" />FSA Drought Programs ↗
                      </a>
                    </div>
                    <p className="text-xs text-slate-400 mt-3">Source: NOAA / USDA / University of Nebraska-Lincoln</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Drought Response Programs</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[
                        { name: "USDA Emergency Livestock Assistance Program (ELAP)", url: "https://www.fsa.usda.gov/programs-and-services/disaster-assistance-program/emergency-livestock-assistance/index", note: "Livestock feed and water transport costs during drought" },
                        { name: "Livestock Forage Disaster Program (LFP)", url: "https://www.fsa.usda.gov/programs-and-services/disaster-assistance-program/livestock-forage/index", note: "Compensation for grazing losses on rangeland" },
                        { name: "Emergency Conservation Program (ECP)", url: "https://www.fsa.usda.gov/programs-and-services/conservation-programs/emergency-conservation/index", note: "Restore farmland damaged by drought-caused erosion" },
                        { name: "NRCS Emergency Watershed Protection (EWP)", url: "https://www.nrcs.usda.gov/programs-and-services/emergency-programs/emergency-watershed-protection", note: "Restore watershed function after natural disasters" },
                      ].map((p, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">•</span>
                          <div>
                            <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline">{p.name}</a>
                            <p className="text-xs text-slate-500">{p.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Resource footer */}
        {feed?.resources && (
          <div className="mt-6 bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 mb-2">Emergency Resources</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(feed.resources).map(([key, url]: any) => (
                <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                  <ExternalLink className="w-3 h-3" />{key}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
