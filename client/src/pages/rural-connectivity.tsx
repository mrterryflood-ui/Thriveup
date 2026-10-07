import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wifi, Radio, Building, Zap, Truck, ExternalLink, ChevronRight, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export default function RuralConnectivityPage() {
  const [lat, setLat] = useState("30.2672");
  const [lng, setLng] = useState("-97.7431");
  const [stateFips, setStateFips] = useState("48");
  const [countyFips, setCountyFips] = useState("453");
  const [isRural, setIsRural] = useState(true);

  const snapshotMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("GET", `/api/rural-connectivity/snapshot?lat=${lat}&lng=${lng}&rural=${isRural}&stateFips=${stateFips}&countyFips=${countyFips}`);
      return r.json();
    },
  });

  const { data: cfPrograms } = useQuery({
    queryKey: ["/api/rural-connectivity/community-facilities"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/rural-connectivity/community-facilities"); return r.json(); },
  });

  const snap = snapshotMutation.data;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5">
        <nav className="text-xs text-slate-500 mb-2 flex items-center gap-1"><Wifi className="w-3 h-3" /><span>Rural Connectivity & Infrastructure — ThriveUp</span></nav>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">Rural Connectivity & Infrastructure</h1>
        <p className="mt-1 text-slate-500 max-w-2xl">FCC broadband availability · USDA ReConnect eligibility · Community Facilities grants · Service desert scoring · Cell coverage alternatives.</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Location input */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div><label className="text-xs text-slate-500 block mb-1">Latitude</label><Input data-testid="input-conn-lat" className="w-32" value={lat} onChange={e => setLat(e.target.value)} /></div>
              <div><label className="text-xs text-slate-500 block mb-1">Longitude</label><Input data-testid="input-conn-lng" className="w-36" value={lng} onChange={e => setLng(e.target.value)} /></div>
              <div><label className="text-xs text-slate-500 block mb-1">State FIPS</label><Input className="w-16" value={stateFips} onChange={e => setStateFips(e.target.value)} /></div>
              <div><label className="text-xs text-slate-500 block mb-1">County FIPS</label><Input className="w-20" value={countyFips} onChange={e => setCountyFips(e.target.value)} /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={isRural} onChange={e => setIsRural(e.target.checked)} id="rural-check" />
                <label htmlFor="rural-check" className="text-sm">Rural area</label>
              </div>
              <Button data-testid="button-conn-analyze" onClick={() => snapshotMutation.mutate()} disabled={snapshotMutation.isPending}>
                {snapshotMutation.isPending ? "Analyzing…" : "Analyze Connectivity"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="broadband">
          <TabsList className="mb-5 flex-wrap">
            <TabsTrigger value="broadband" data-testid="tab-broadband"><Wifi className="w-3.5 h-3.5 mr-1" />Broadband</TabsTrigger>
            <TabsTrigger value="reconnect" data-testid="tab-reconnect">ReConnect</TabsTrigger>
            <TabsTrigger value="community" data-testid="tab-community"><Building className="w-3.5 h-3.5 mr-1" />Community Facilities</TabsTrigger>
            <TabsTrigger value="energy" data-testid="tab-energy"><Zap className="w-3.5 h-3.5 mr-1" />Energy (REAP)</TabsTrigger>
            <TabsTrigger value="desert" data-testid="tab-desert"><AlertTriangle className="w-3.5 h-3.5 mr-1" />Service Deserts</TabsTrigger>
          </TabsList>

          {/* Broadband */}
          <TabsContent value="broadband">
            {snap?.broadband ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className={`rounded-xl border p-4 text-center ${snap.broadband.summary?.isBroadbandDesert ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                    {snap.broadband.summary?.isBroadbandDesert
                      ? <><XCircle className="w-8 h-8 mx-auto text-red-600 mb-1" /><p className="text-sm font-bold text-red-700">Broadband Desert</p></>
                      : <><CheckCircle2 className="w-8 h-8 mx-auto text-green-600 mb-1" /><p className="text-sm font-bold text-green-700">Broadband Available</p></>}
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 border rounded-xl p-4 text-center">
                    <p className="text-2xl font-extrabold">{snap.broadband.summary?.totalProviders || 0}</p>
                    <p className="text-xs text-slate-500">ISPs at this location</p>
                  </div>
                  <div className={`rounded-xl border p-4 text-center ${snap.broadband.summary?.hasHighSpeed ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
                    {snap.broadband.summary?.hasHighSpeed ? <CheckCircle2 className="w-6 h-6 mx-auto text-green-600 mb-1" /> : <XCircle className="w-6 h-6 mx-auto text-amber-600 mb-1" />}
                    <p className="text-xs font-semibold">100/20 Mbps{snap.broadband.summary?.hasHighSpeed ? " ✓" : " ✗"}</p>
                  </div>
                  <div className={`rounded-xl border p-4 text-center ${snap.broadband.reConnectEligible ? "bg-blue-50 border-blue-200" : "bg-slate-50"}`}>
                    <p className="text-xs font-semibold text-slate-600">ReConnect Eligible</p>
                    <p className="text-xl font-bold mt-1">{snap.broadband.reConnectEligible ? "✓ Yes" : "✗ No"}</p>
                  </div>
                </div>
                {snap.broadband.summary?.note && (
                  <div className={`border rounded-lg p-3 text-sm ${snap.broadband.summary.isBroadbandDesert ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"}`}>
                    {snap.broadband.summary.note}
                  </div>
                )}
                {snap.broadband.providers?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Available Providers</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {snap.broadband.providers.map((p: any, i: number) => (
                          <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                            <div><p className="text-sm font-semibold">{p.provider}</p><p className="text-xs text-slate-500">{p.technology}</p></div>
                            <p className="text-xs font-semibold">{p.maxDownMbps} ↓ / {p.maxUpMbps} ↑ Mbps</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {/* Satellite alternatives */}
                {snap.broadband.summary?.isBroadbandDesert && snap.cellCoverage?.alternativeSolutions && (
                  <Card className="border-blue-200">
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Alternative Connectivity Solutions</CardTitle></CardHeader>
                    <CardContent>
                      {snap.cellCoverage.alternativeSolutions.map((s: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 py-1.5 border-b last:border-0 border-slate-100">
                          <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                          <div>
                            <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline">{s.name}</a>
                            <p className="text-xs text-slate-500">{s.note}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
                <a href={snap.broadband.sourceUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  <ExternalLink className="w-3 h-3" />View on FCC Broadband Map ↗
                </a>
              </div>
            ) : (
              <div className="text-center py-20"><Wifi className="w-14 h-14 mx-auto text-slate-300 mb-4" /><p className="text-slate-500">Enter your location coordinates above and click Analyze Connectivity</p></div>
            )}
          </TabsContent>

          {/* ReConnect */}
          <TabsContent value="reconnect">
            {snap?.reconnect ? (
              <div className="space-y-4">
                <div className={`rounded-xl border p-5 ${snap.reconnect.eligible ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {snap.reconnect.eligible ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : <XCircle className="w-6 h-6 text-slate-400" />}
                    <p className="font-bold text-lg">{snap.reconnect.eligible ? "Potentially ReConnect Eligible" : "May not qualify for ReConnect"}</p>
                  </div>
                  {snap.reconnect.reason && <p className="text-sm text-slate-600">{snap.reconnect.reason}</p>}
                </div>
                {snap.reconnect.programs?.map((p: any, i: number) => (
                  <Card key={i} data-testid={`reconnect-program-${i}`}>
                    <CardHeader className="pb-2"><CardTitle className="text-base">{p.name}</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{p.description}</p>
                      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                        <div><p className="text-xs text-slate-500">Max Award</p><p className="font-semibold">{p.maxAward}</p></div>
                        <div><p className="text-xs text-slate-500">Match Required</p><p className="font-semibold">{p.match}</p></div>
                      </div>
                      <p className="text-xs font-semibold mb-1">Eligible Uses:</p>
                      <div className="flex flex-wrap gap-1 mb-3">{p.eligibleUses?.map((u: string) => <span key={u} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{u}</span>)}</div>
                      <a href={p.applicationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"><ExternalLink className="w-3.5 h-3.5" />Apply for ReConnect ↗</a>
                    </CardContent>
                  </Card>
                ))}
                <Card className="border-blue-200">
                  <CardContent className="pt-4">
                    <p className="text-sm font-semibold mb-2">Digital Equity Programs</p>
                    <a href={snap.reconnect.digitalEquity?.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"><ExternalLink className="w-3.5 h-3.5" />{snap.reconnect.digitalEquity?.program} ↗</a>
                    <p className="text-xs text-slate-500 mt-1">{snap.reconnect.digitalEquity?.description}</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-20"><p className="text-slate-500">Click Analyze Connectivity to check ReConnect eligibility for your location</p></div>
            )}
          </TabsContent>

          {/* Community Facilities */}
          <TabsContent value="community">
            {cfPrograms?.programs ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 mb-2">USDA Rural Development programs for community infrastructure — hospitals, clinics, schools, fire stations, community centers</p>
                {cfPrograms.programs.map((p: any, i: number) => (
                  <Card key={i} data-testid={`cf-program-${i}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <CardDescription>{p.administrator}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{p.description}</p>
                      {p.eligibleProjects && (
                        <div className="mb-2">
                          <p className="text-xs font-semibold text-slate-500 mb-1">Eligible Projects:</p>
                          <div className="flex flex-wrap gap-1">{p.eligibleProjects.map((e: string) => <span key={e} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{e}</span>)}</div>
                        </div>
                      )}
                      {(p.maxGrant || p.loanTerms || p.maxLoan) && (
                        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                          {p.maxGrant && <div><p className="text-xs text-slate-500">Max Grant</p><p className="font-semibold text-green-700">{p.maxGrant}</p></div>}
                          {p.maxLoan && <div><p className="text-xs text-slate-500">Max Loan</p><p className="font-semibold">{p.maxLoan}</p></div>}
                          {p.loanTerms && <div><p className="text-xs text-slate-500">Loan Terms</p><p className="font-semibold">{p.loanTerms}</p></div>}
                          {p.eligibility && <div className="col-span-2"><p className="text-xs text-slate-500">Eligibility</p><p className="text-xs">{p.eligibility}</p></div>}
                        </div>
                      )}
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"><ExternalLink className="w-3.5 h-3.5" />Apply / Learn more ↗</a>
                    </CardContent>
                  </Card>
                ))}
                <p className="text-xs text-slate-400">Find your USDA RD office: <a href={cfPrograms.findOffice} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">USDA State Offices ↗</a></p>
              </div>
            ) : <div className="text-center py-12"><Building className="w-14 h-14 mx-auto text-slate-300 mb-4" /><p className="text-slate-500">Loading Community Facilities programs…</p></div>}
          </TabsContent>

          {/* Energy */}
          <TabsContent value="energy">
            {cfPrograms?.programs ? (
              <div className="space-y-4">
                {cfPrograms.programs.filter((p: any) => p.name.includes("Energy") || p.name.includes("REAP")).map((p: any, i: number) => (
                  <Card key={i} data-testid={`reap-program-${i}`}>
                    <CardHeader className="pb-2"><CardTitle className="text-base">{p.name}</CardTitle><CardDescription>{p.administrator}</CardDescription></CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{p.description}</p>
                      {p.eligibleProjects && <div className="flex flex-wrap gap-1 mb-3">{p.eligibleProjects.map((e: string) => <span key={e} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{e}</span>)}</div>}
                      {p.maxGrant && <p className="text-sm font-bold text-green-700 mb-2">{p.maxGrant}</p>}
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"><ExternalLink className="w-3.5 h-3.5" />Apply for REAP ↗</a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : <div className="text-center py-12"><Zap className="w-14 h-14 mx-auto text-slate-300 mb-4" /><p className="text-slate-500">Loading REAP energy programs…</p></div>}
          </TabsContent>

          {/* Service Deserts */}
          <TabsContent value="desert">
            {snap?.desertScore ? (
              <div className="space-y-4">
                {snap.desertScore.census && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border p-4 text-center">
                      <p className="text-2xl font-extrabold">{parseInt(snap.desertScore.census.totalPop || "0").toLocaleString()}</p>
                      <p className="text-xs text-slate-500">County population</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-xl p-4 text-center">
                      <p className="text-2xl font-extrabold text-amber-700">{snap.desertScore.census.noVehiclePct}%</p>
                      <p className="text-xs text-slate-500">No vehicle households</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-xl p-4 text-center">
                      <p className="text-2xl font-extrabold text-blue-700">${parseInt(snap.desertScore.census.medianHouseholdIncome || "0").toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Median household income</p>
                    </div>
                  </div>
                )}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Service Desert Indicators</CardTitle></CardHeader>
                  <CardContent>
                    {Object.entries(snap.desertScore.desertIndicators || {}).map(([key, val]: any) => (
                      <div key={key} className="flex items-start gap-2 py-1.5 border-b last:border-0 border-slate-100 dark:border-slate-800">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                          <p className="text-xs text-slate-500">{val.description}</p>
                        </div>
                        <a href={val.checkUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline shrink-0"><ExternalLink className="w-3 h-3" /></a>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Transportation Programs</CardTitle></CardHeader>
                  <CardContent>
                    {snap.desertScore.programs?.map((p: string, i: number) => (
                      <p key={i} className="text-sm flex items-start gap-2 py-1"><ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />{p}</p>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-20"><Truck className="w-14 h-14 mx-auto text-slate-300 mb-4" /><p className="text-slate-500">Click Analyze Connectivity to score service desert depth for this location</p></div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
