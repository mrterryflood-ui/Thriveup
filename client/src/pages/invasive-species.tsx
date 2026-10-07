import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Bug, MapPin, AlertTriangle, Camera, BookOpen, ExternalLink, ChevronRight } from "lucide-react";

const THREAT_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200",
  moderate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200",
};

const CATEGORY_ICONS: Record<string, string> = { insect: "🦟", plant: "🌿", vertebrate: "🐗", pathogen: "🦠" };

const STATE_CODES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

const reportSchema = z.object({
  speciesCommonName: z.string().min(2, "Required"),
  speciesCategory: z.enum(["plant","insect","vertebrate","pathogen"]),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  locationDescription: z.string().optional(),
  observationDate: z.string().min(1, "Required"),
  acresAffectedEstimate: z.coerce.number().positive().optional(),
  severityLevel: z.enum(["low","moderate","high","critical"]).default("moderate"),
  notes: z.string().optional(),
});

const treatmentSchema = z.object({
  speciesName: z.string().min(2),
  countyName: z.string().optional(),
  stateName: z.string().optional(),
  cropContext: z.string().optional(),
});

export default function InvasiveSpeciesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterState, setFilterState] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterThreat, setFilterThreat] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState("");
  const [treatmentResult, setTreatmentResult] = useState<any>(null);
  const [lat, setLat] = useState("38.5");
  const [lng, setLng] = useState("-97.5");

  const reportForm = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: { speciesCategory: "insect", severityLevel: "moderate", observationDate: new Date().toISOString().split("T")[0] },
  });

  const treatForm = useForm<z.infer<typeof treatmentSchema>>({ resolver: zodResolver(treatmentSchema) });

  const { data: priorityList } = useQuery({
    queryKey: ["/api/invasive-species/priority-list", filterState, filterCategory, filterThreat],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterState) params.set("state", filterState);
      if (filterCategory) params.set("category", filterCategory);
      if (filterThreat) params.set("threat", filterThreat);
      const r = await apiRequest("GET", `/api/invasive-species/priority-list?${params}`);
      return r.json();
    },
  });

  const { data: liveObs, isLoading: obsLoading } = useQuery({
    queryKey: ["/api/invasive-species/county-observations", lat, lng],
    queryFn: async () => {
      const r = await apiRequest("GET", `/api/invasive-species/county-observations?lat=${lat}&lng=${lng}`);
      return r.json();
    },
    enabled: !!lat && !!lng,
  });

  const { data: communityReports } = useQuery({
    queryKey: ["/api/invasive-species/community-reports"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/invasive-species/community-reports");
      return r.json();
    },
  });

  const reportMutation = useMutation({
    mutationFn: async (values: z.infer<typeof reportSchema>) => {
      const r = await apiRequest("POST", "/api/invasive-species/report", { ...values, observationDate: new Date(values.observationDate) });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Sighting reported!", description: "Thank you — community reports protect crops and ecosystems." });
      reportForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/invasive-species/community-reports"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const treatMutation = useMutation({
    mutationFn: async (values: z.infer<typeof treatmentSchema>) => {
      const r = await apiRequest("POST", "/api/invasive-species/treatment-recommendation", values);
      return r.json();
    },
    onSuccess: (data) => setTreatmentResult(data),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5">
        <nav className="text-xs text-slate-500 mb-2 flex items-center gap-1"><Bug className="w-3 h-3" /><span>Invasive Species Watch — ThriveUp</span></nav>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">Invasive Species Watch</h1>
        <p className="mt-1 text-slate-500 max-w-2xl">USDA APHIS priority species list + live iNaturalist research-grade sightings + community reporting. Protect your operation before it arrives.</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <Tabs defaultValue="priority">
          <TabsList className="mb-6">
            <TabsTrigger value="priority" data-testid="tab-priority">⚠️ APHIS Priority List</TabsTrigger>
            <TabsTrigger value="live" data-testid="tab-live">🔴 Live iNaturalist</TabsTrigger>
            <TabsTrigger value="report" data-testid="tab-report">📍 Report a Sighting</TabsTrigger>
            <TabsTrigger value="treatment" data-testid="tab-treatment">💊 Treatment Guidance</TabsTrigger>
            <TabsTrigger value="community" data-testid="tab-community">🌐 Community Reports</TabsTrigger>
          </TabsList>

          {/* APHIS Priority List */}
          <TabsContent value="priority">
            <div className="flex flex-wrap gap-3 mb-5">
              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger className="w-36" data-testid="filter-state"><SelectValue placeholder="All states" /></SelectTrigger>
                <SelectContent>{STATE_CODES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-36"><SelectValue placeholder="All categories" /></SelectTrigger>
                <SelectContent>
                  {["insect","plant","vertebrate","pathogen"].map(c => <SelectItem key={c} value={c}>{CATEGORY_ICONS[c]} {c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterThreat} onValueChange={setFilterThreat}>
                <SelectTrigger className="w-36"><SelectValue placeholder="All threats" /></SelectTrigger>
                <SelectContent>
                  {["critical","high","moderate"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              {(filterState || filterCategory || filterThreat) && (
                <Button variant="ghost" size="sm" onClick={() => { setFilterState(""); setFilterCategory(""); setFilterThreat(""); }}>Clear</Button>
              )}
            </div>
            <div className="space-y-3">
              {priorityList?.species?.map((sp: any, i: number) => (
                <Card key={i} className={`border ${THREAT_COLORS[sp.threat] || ""}`} data-testid={`species-card-${i}`}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{CATEGORY_ICONS[sp.category] || "🦠"}</span>
                          <h3 className="font-bold text-slate-900 dark:text-slate-100">{sp.commonName}</h3>
                          <Badge className={`text-xs ${THREAT_COLORS[sp.threat]} border`}>{sp.threat}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 italic mb-2">{sp.scientificName}</p>
                        <div className="flex flex-wrap gap-1">
                          {sp.hostCrops?.map((c: string) => <span key={c} className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">{c}</span>)}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Confirmed in: {sp.statesConfirmed?.join(", ")}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0" onClick={() => { setSelectedSpecies(sp.commonName); }}>
                        Treatment →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!priorityList?.species?.length && <p className="text-slate-500 text-sm py-8 text-center">No species match current filters.</p>}
            </div>
          </TabsContent>

          {/* Live iNaturalist */}
          <TabsContent value="live">
            <Card className="mb-4">
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-3 items-end">
                  <div>
                    <label className="text-xs text-slate-500">Center Latitude</label>
                    <Input data-testid="input-lat" className="w-32 mt-1" value={lat} onChange={e => setLat(e.target.value)} placeholder="38.5" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Center Longitude</label>
                    <Input data-testid="input-lng" className="w-36 mt-1" value={lng} onChange={e => setLng(e.target.value)} placeholder="-97.5" />
                  </div>
                  <p className="text-xs text-slate-400">40-mile radius · research-grade only</p>
                </div>
              </CardContent>
            </Card>
            {obsLoading && <div className="text-center py-12"><Bug className="w-10 h-10 mx-auto text-orange-400 animate-pulse mb-3" /><p className="text-slate-500">Querying iNaturalist…</p></div>}
            {liveObs?.observations && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">{liveObs.total} invasive observations · <a href={liveObs.inatBrowseUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" />View on iNaturalist ↗</a></p>
                {liveObs.observations.map((o: any, i: number) => (
                  <Card key={i} data-testid={`obs-card-${i}`}>
                    <CardContent className="pt-3 pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm">{o.commonName}</p>
                          <p className="text-xs text-slate-500 italic">{o.scientificName}</p>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{o.locationGuess || "Location not specified"} · {o.observedOn}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{o.category || "unknown"}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Report */}
          <TabsContent value="report">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Camera className="w-5 h-5 text-orange-600" />Report an Invasive Species Sighting</CardTitle>
                <CardDescription>Community reports feed into USDA extension alerts. No account required.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...reportForm}>
                  <form onSubmit={reportForm.handleSubmit(v => reportMutation.mutate(v))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={reportForm.control} name="speciesCommonName" render={({ field }) => (
                        <FormItem><FormLabel>Species Common Name</FormLabel><FormControl><Input data-testid="input-species-name" placeholder="e.g. Spotted Lanternfly" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={reportForm.control} name="speciesCategory" render={({ field }) => (
                        <FormItem><FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              {["insect","plant","vertebrate","pathogen"].map(c => <SelectItem key={c} value={c}>{CATEGORY_ICONS[c]} {c}</SelectItem>)}
                            </SelectContent>
                          </Select><FormMessage /></FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={reportForm.control} name="latitude" render={({ field }) => (
                        <FormItem><FormLabel>Latitude</FormLabel><FormControl><Input data-testid="input-report-lat" type="number" step="0.0001" placeholder="e.g. 30.2672" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={reportForm.control} name="longitude" render={({ field }) => (
                        <FormItem><FormLabel>Longitude</FormLabel><FormControl><Input data-testid="input-report-lng" type="number" step="0.0001" placeholder="e.g. -97.7431" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={reportForm.control} name="locationDescription" render={({ field }) => (
                      <FormItem><FormLabel>Location Description</FormLabel><FormControl><Input data-testid="input-location-desc" placeholder="e.g. North fence line of cornfield, adjacent to creek" {...field} /></FormControl></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={reportForm.control} name="observationDate" render={({ field }) => (
                        <FormItem><FormLabel>Observation Date</FormLabel><FormControl><Input data-testid="input-obs-date" type="date" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={reportForm.control} name="severityLevel" render={({ field }) => (
                        <FormItem><FormLabel>Severity</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>{["low","moderate","high","critical"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select></FormItem>
                      )} />
                    </div>
                    <FormField control={reportForm.control} name="acresAffectedEstimate" render={({ field }) => (
                      <FormItem><FormLabel>Estimated Acres Affected</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={reportForm.control} name="notes" render={({ field }) => (
                      <FormItem><FormLabel>Notes</FormLabel><FormControl><Input placeholder="Any additional details..." {...field} /></FormControl></FormItem>
                    )} />
                    <Button data-testid="button-submit-report" type="submit" className="w-full" disabled={reportMutation.isPending}>
                      {reportMutation.isPending ? "Submitting…" : "Submit Sighting Report"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Treatment */}
          <TabsContent value="treatment">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-600" />AI Treatment Guidance</CardTitle>
                <CardDescription>Based on USDA APHIS + NRCS extension recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...treatForm}>
                  <form onSubmit={treatForm.handleSubmit(v => treatMutation.mutate(v))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={treatForm.control} name="speciesName" render={({ field }) => (
                        <FormItem><FormLabel>Species</FormLabel><FormControl><Input data-testid="input-treat-species" placeholder="e.g. Spotted Lanternfly" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={treatForm.control} name="stateName" render={({ field }) => (
                        <FormItem><FormLabel>State</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger></FormControl>
                            <SelectContent>{STATE_CODES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select></FormItem>
                      )} />
                    </div>
                    <FormField control={treatForm.control} name="cropContext" render={({ field }) => (
                      <FormItem><FormLabel>Crop Context</FormLabel><FormControl><Input placeholder="e.g. vineyard, corn, mixed pasture" {...field} /></FormControl></FormItem>
                    )} />
                    <Button data-testid="button-get-treatment" type="submit" className="w-full" disabled={treatMutation.isPending}>
                      {treatMutation.isPending ? "Querying APHIS guidance…" : "Get Treatment Guidance"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            {treatmentResult && (
              <Card>
                <CardContent className="pt-4 space-y-4">
                  {treatmentResult.immediateActions?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Immediate Actions</h4>
                      <ul className="space-y-1">{treatmentResult.immediateActions.map((a: string, i: number) => <li key={i} className="flex items-start gap-2 text-sm"><ChevronRight className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />{a}</li>)}</ul>
                    </div>
                  )}
                  {treatmentResult.usdaPrograms?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-2">USDA Programs</h4>
                      <ul className="space-y-1">{treatmentResult.usdaPrograms.map((p: string, i: number) => <li key={i} className="flex items-start gap-2 text-sm"><ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />{p}</li>)}</ul>
                    </div>
                  )}
                  {treatmentResult.reportingContacts?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold mb-2">Reporting Contacts</h4>
                      <ul className="space-y-1">{treatmentResult.reportingContacts.map((c: string, i: number) => <li key={i} className="text-sm text-slate-600 dark:text-slate-400">{c}</li>)}</ul>
                    </div>
                  )}
                  {treatmentResult.longTermStrategy && (
                    <div>
                      <h4 className="text-sm font-bold mb-2">Long-Term Strategy</h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{treatmentResult.longTermStrategy}</p>
                    </div>
                  )}
                  <p className="text-xs text-slate-400">{treatmentResult.sourceNote}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Community Reports */}
          <TabsContent value="community">
            <div className="space-y-3">
              <p className="text-sm text-slate-500">{communityReports?.total || 0} community-submitted sightings</p>
              {communityReports?.sightings?.length > 0 ? communityReports.sightings.map((s: any, i: number) => (
                <Card key={i} data-testid={`community-sighting-${i}`}>
                  <CardContent className="pt-3 pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm">{s.speciesCommonName}</p>
                        <p className="text-xs text-slate-500">{s.locationDescription || `${s.latitude?.toFixed(3)}, ${s.longitude?.toFixed(3)}`} · {new Date(s.observationDate).toLocaleDateString()}</p>
                        {s.notes && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{s.notes}</p>}
                      </div>
                      <Badge className={`text-xs ${THREAT_COLORS[s.severityLevel] || ""} border`}>{s.severityLevel}</Badge>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <div className="text-center py-12">
                  <Bug className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">No community sightings yet. Be the first to report one.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
