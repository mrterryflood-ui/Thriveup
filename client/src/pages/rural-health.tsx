import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EvidenceSummary } from "@/components/evidence-label";
import { Heart, Phone, MapPin, AlertTriangle, ExternalLink, Shield, Hospital, Baby, Stethoscope, ChevronRight } from "lucide-react";

const US_STATES = ["AL","AR","AZ","CA","CO","FL","GA","IA","ID","IL","IN","KS","KY","LA","MI","MN","MO","MS","MT","NC","ND","NE","NM","NY","OH","OK","OR","PA","SC","SD","TN","TX","VA","WA","WI","WY"];

const STATE_NAMES: Record<string, string> = {
  AL:"Alabama",AR:"Arkansas",AZ:"Arizona",CA:"California",CO:"Colorado",FL:"Florida",GA:"Georgia",
  IA:"Iowa",ID:"Idaho",IL:"Illinois",IN:"Indiana",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",
  MI:"Michigan",MN:"Minnesota",MO:"Missouri",MS:"Mississippi",MT:"Montana",NC:"North Carolina",
  ND:"North Dakota",NE:"Nebraska",NM:"New Mexico",NY:"New York",OH:"Ohio",OK:"Oklahoma",
  OR:"Oregon",PA:"Pennsylvania",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",
  VA:"Virginia",WA:"Washington",WI:"Wisconsin",WY:"Wyoming",
};

export default function RuralHealthPage() {
  const [state, setState] = useState("TX");
  const [lat, setLat] = useState("30.2672");
  const [lng, setLng] = useState("-97.7431");
  const [medicare, setMedicare] = useState(false);
  const [medicaid, setMedicaid] = useState(false);

  const { data: snapshot, isLoading: snapLoading, refetch } = useQuery({
    queryKey: ["/api/rural-health/snapshot", state, lat, lng],
    queryFn: async () => {
      const r = await apiRequest("GET", `/api/rural-health/snapshot?state=${state}&lat=${lat}&lng=${lng}`);
      return r.json();
    },
  });

  const { data: grants } = useQuery({
    queryKey: ["/api/rural-health/grants"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/rural-health/grants"); return r.json(); },
  });

  const stress = snapshot?.farmStress;
  const hospitals = snapshot?.hospitals;
  const telehealth = snapshot?.telehealth;
  const maternal = snapshot?.maternal;
  const fqhc = snapshot?.fqhc || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5">
        <nav className="text-xs text-slate-500 mb-2 flex items-center gap-1"><Heart className="w-3 h-3" /><span>Rural Healthcare Hub — ThriveUp</span></nav>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">Rural Healthcare Hub</h1>
        <p className="mt-1 text-slate-500 max-w-2xl">Farm stress crisis lines · FQHC finder · Hospital closure risk · Telehealth access · Maternal care deserts · Rural health grants. No jargon. Real resources.</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Crisis banner — always visible */}
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="w-5 h-5 text-red-600 shrink-0" />
            <p className="font-bold text-red-800 dark:text-red-300">In Crisis? Call Now — 24/7</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-white dark:bg-slate-900 rounded-lg px-3 py-2">
              <p className="font-bold text-lg text-red-700">988</p>
              <p className="text-xs text-slate-600">Suicide & Crisis Lifeline — Press 2 for Veterans</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg px-3 py-2">
              <p className="font-bold text-base text-red-700">1-833-897-2474</p>
              <p className="text-xs text-slate-600">AgriStress Helpline — Farm-specific crisis counselors</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg px-3 py-2">
              <p className="font-bold text-base text-red-700">1-800-FARM-AID</p>
              <p className="text-xs text-slate-600">Farm Aid Hotline — Financial crisis + referrals</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg px-3 py-2">
              <p className="font-bold text-base text-red-700">Text HOME to 741741</p>
              <p className="text-xs text-slate-600">Crisis Text Line — 24/7 text-based support</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6 items-end">
          <div>
            <label className="text-xs text-slate-500 block mb-1">State</label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger className="w-48" data-testid="select-health-state"><SelectValue /></SelectTrigger>
              <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s} — {STATE_NAMES[s]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Latitude (for FQHC search)</label>
            <Input data-testid="input-health-lat" className="w-32" value={lat} onChange={e => setLat(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Longitude</label>
            <Input data-testid="input-health-lng" className="w-36" value={lng} onChange={e => setLng(e.target.value)} />
          </div>
          <Button onClick={() => refetch()} disabled={snapLoading} data-testid="button-health-search">
            {snapLoading ? "Loading…" : "Get Rural Health Snapshot"}
          </Button>
        </div>

        <Tabs defaultValue="stress">
          <TabsList className="mb-5 flex-wrap">
            <TabsTrigger value="stress" data-testid="tab-stress"><Heart className="w-3.5 h-3.5 mr-1" />Farm Stress</TabsTrigger>
            <TabsTrigger value="fqhc" data-testid="tab-fqhc"><MapPin className="w-3.5 h-3.5 mr-1" />Find Care (FQHC)</TabsTrigger>
            <TabsTrigger value="hospitals" data-testid="tab-hospitals"><Hospital className="w-3.5 h-3.5 mr-1" />Hospitals</TabsTrigger>
            <TabsTrigger value="telehealth" data-testid="tab-telehealth"><Stethoscope className="w-3.5 h-3.5 mr-1" />Telehealth</TabsTrigger>
            <TabsTrigger value="maternal" data-testid="tab-maternal"><Baby className="w-3.5 h-3.5 mr-1" />Maternal</TabsTrigger>
            <TabsTrigger value="grants" data-testid="tab-health-grants">Grants</TabsTrigger>
          </TabsList>

          {/* Farm Stress */}
          <TabsContent value="stress">
            {stress ? (
              <div className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-xl p-4">
                  <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">The farm stress crisis is real — not weakness</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">{stress.stigmaNote}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {stress.crisis?.hotlines?.map((h: any, i: number) => (
                    <Card key={i} className="border-red-200 dark:border-red-800" data-testid={`hotline-${i}`}>
                      <CardContent className="pt-4 pb-3">
                        <p className="font-bold text-red-700 text-lg">{h.number}</p>
                        <p className="font-semibold text-sm">{h.name}</p>
                        <p className="text-xs text-slate-500">{h.available}</p>
                        {h.note && <p className="text-xs text-slate-400 italic mt-1">{h.note}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">{stress.mentalHealth?.programName}</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{stress.mentalHealth?.description}</p>
                    <a href={stress.mentalHealth?.findCounselor} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                      <ExternalLink className="w-3.5 h-3.5" />Find a farm stress counselor near you ↗
                    </a>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Financial Counseling & Legal Help</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stress.financialCounseling?.programs?.map((p: any, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          <div>
                            <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline">{p.name}</a>
                            <p className="text-xs text-slate-500">{p.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                {stress.crisis?.stateResources?.map((r: any, i: number) => (
                  <Card key={i} className="border-green-200 dark:border-green-800">
                    <CardContent className="pt-3 pb-3">
                      <p className="font-semibold text-sm">{r.name}</p>
                      {r.phone && <p className="text-sm text-green-700 font-bold">{r.phone}</p>}
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5 mt-1"><ExternalLink className="w-3 h-3" />Learn more ↗</a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12"><Heart className="w-14 h-14 mx-auto text-slate-300 mb-4" /><p className="text-slate-500">Select your state above to load farm stress resources</p></div>
            )}
          </TabsContent>

          {/* FQHC */}
          <TabsContent value="fqhc">
            {snapLoading && <div className="text-center py-12"><MapPin className="w-10 h-10 mx-auto text-green-400 animate-pulse mb-3" /><p className="text-slate-500">Searching for health centers within 60 miles…</p></div>}
            {!snapLoading && fqhc.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">{fqhc.length} Federally Qualified Health Centers within 60 miles — all offer sliding-scale fees, no patient turned away</p>
                {fqhc.map((c: any, i: number) => (
                  <Card key={i} data-testid={`fqhc-${i}`}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-sm">{c.name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{c.address}</p>
                          {c.phone && <p className="text-sm font-semibold text-green-700 mt-1">{c.phone}</p>}
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            {c.acceptsMedicaid && <Badge className="text-xs bg-green-100 text-green-800">Medicaid ✓</Badge>}
                            {c.acceptsMedicare && <Badge className="text-xs bg-blue-100 text-blue-800">Medicare ✓</Badge>}
                            {c.telehealth && <Badge className="text-xs bg-purple-100 text-purple-800">Telehealth ✓</Badge>}
                            <Badge className="text-xs bg-amber-100 text-amber-800">Sliding Scale ✓</Badge>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {c.distanceMiles && <p className="text-sm font-bold text-slate-700">{typeof c.distanceMiles === "number" ? c.distanceMiles.toFixed(1) : c.distanceMiles} mi</p>}
                          {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5 mt-1"><ExternalLink className="w-3 h-3" />Website</a>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !snapLoading && (
              <div className="text-center py-12">
                <MapPin className="w-14 h-14 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 mb-3">Enter your coordinates above and click "Get Rural Health Snapshot"</p>
                <a href="https://findahealthcenter.hrsa.gov/" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                  <ExternalLink className="w-3.5 h-3.5" />Search directly on HRSA Find a Health Center ↗
                </a>
              </div>
            )}
          </TabsContent>

          {/* Hospitals */}
          <TabsContent value="hospitals">
            {hospitals ? (
              <div className="space-y-4">
                {hospitals.hospitalsAtRisk && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-xl p-4 text-center">
                      <p className="text-3xl font-extrabold text-red-700">{hospitals.hospitalsAtRisk}</p>
                      <p className="text-xs text-slate-500">Rural hospitals at risk of closing</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-xl p-4 text-center">
                      <p className="text-3xl font-extrabold text-amber-700">{hospitals.closedSince2010}</p>
                      <p className="text-xs text-slate-500">Closed since 2010</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-xl p-4 text-center">
                      <p className="text-3xl font-extrabold text-blue-700">{hospitals.criticalAccessHospitals}</p>
                      <p className="text-xs text-slate-500">Critical Access Hospitals</p>
                    </div>
                  </div>
                )}
                {hospitals.note && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700"><AlertTriangle className="w-4 h-4 inline mr-1" />{hospitals.note}</div>}
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm font-semibold mb-2">National Context</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{hospitals.nationalContext?.totalClosedSince2010} rural hospitals have closed nationally since 2010. {hospitals.nationalContext?.totalAtRisk} are currently at risk.</p>
                    <div className="flex flex-wrap gap-3">
                      <a href={hospitals.findHospital} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"><ExternalLink className="w-3.5 h-3.5" />Find Critical Access Hospitals (CMS) ↗</a>
                      <a href={hospitals.ruralHealthInfo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"><ExternalLink className="w-3.5 h-3.5" />Rural Health Info ↗</a>
                    </div>
                    <p className="text-xs text-slate-400 mt-3">Source: {hospitals.source}</p>
                  </CardContent>
                </Card>
              </div>
            ) : <div className="text-center py-12"><p className="text-slate-500">Select your state above to load hospital data</p></div>}
          </TabsContent>

          {/* Telehealth */}
          <TabsContent value="telehealth">
            {telehealth ? (
              <div className="space-y-4">
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">✅ Permanent Medicare Telehealth Expansions</CardTitle></CardHeader>
                  <CardContent>
                    {telehealth.permanentExpansions?.map((e: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 py-1.5 border-b last:border-0 border-slate-100">
                        <Shield className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <div><p className="text-xs font-semibold text-slate-700">{e.program}</p><p className="text-xs text-slate-500">{e.benefit}</p></div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                {telehealth.ruralSpecific?.length > 0 && (
                  <Card className="border-blue-200">
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Rural-Specific Telehealth</CardTitle></CardHeader>
                    <CardContent>
                      {telehealth.ruralSpecific.map((e: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 py-1.5">
                          <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold">{e.program}</p>
                            <p className="text-xs text-slate-500">{e.benefit}</p>
                            {e.url && <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Learn more ↗</a>}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
                <div className="flex justify-center">
                  <a href={telehealth.findProvider} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                    <ExternalLink className="w-3.5 h-3.5" />Find a telehealth provider — HHS Telehealth.gov ↗
                  </a>
                </div>
              </div>
            ) : <div className="text-center py-12"><p className="text-slate-500">Select your state to load telehealth eligibility</p></div>}
          </TabsContent>

          {/* Maternal */}
          <TabsContent value="maternal">
            {maternal ? (
              <div className="space-y-4">
                <div className="bg-pink-50 dark:bg-pink-950/20 border border-pink-200 rounded-xl p-4">
                  <p className="font-semibold text-pink-800 dark:text-pink-300 mb-1">National fact</p>
                  <p className="text-sm text-pink-700 dark:text-pink-400">{maternal.nationalFact}</p>
                </div>
                {maternal.context?.countiesWithNoOB && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                      <p className="text-3xl font-extrabold text-red-700">{maternal.context.countiesWithNoOB}</p>
                      <p className="text-xs text-slate-500">Counties with no OB provider</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                      <p className="text-3xl font-extrabold text-amber-700">{maternal.context.desertPct}%</p>
                      <p className="text-xs text-slate-500">of counties are maternity care deserts</p>
                    </div>
                  </div>
                )}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Solutions</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {maternal.solutions?.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm"><ChevronRight className="w-4 h-4 text-pink-500 mt-0.5 shrink-0" />{s}</li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <a href={maternal.hrsa?.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"><ExternalLink className="w-3 h-3" />{maternal.hrsa?.program} ↗</a>
                      <a href={maternal.marchOfDimes} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"><ExternalLink className="w-3 h-3" />March of Dimes Report ↗</a>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : <div className="text-center py-12"><Baby className="w-14 h-14 mx-auto text-slate-300 mb-4" /><p className="text-slate-500">Select your state to load maternal health data</p></div>}
          </TabsContent>

          {/* Grants */}
          <TabsContent value="grants">
            {grants?.programs ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 mb-4">Rural health funding opportunities for nonprofits, health centers, and community organizations</p>
                {grants.programs.map((p: any, i: number) => (
                  <Card key={i} data-testid={`health-grant-${i}`}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-sm">{p.name}</p>
                          {p.amount && <Badge className="text-xs bg-green-100 text-green-800 mt-1">{p.amount}</Badge>}
                        </div>
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5 shrink-0">
                          <ExternalLink className="w-3 h-3" />Apply ↗
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : <div className="text-center py-12"><p className="text-slate-500">Loading health grant opportunities…</p></div>}
          </TabsContent>
        </Tabs>
        <EvidenceSummary
          claims={[{
            value: snapshot?.hospitals?.hospitalsAtRisk ?? null,
            unit: "rural hospitals at risk of closing",
            source: "CDC PLACES + TCAF Health Network",
            sourceId: "cdc-places",
            asOfDate: null,
            geographyKey: STATE_NAMES[state],
            confidence: "estimated",
            decisionCaption: "Use rural health indicators to identify communities for service and referral planning.",
          }]}
        />
      </div>
    </div>
  );
}
