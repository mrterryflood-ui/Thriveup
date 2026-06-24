import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Map, Search, TrendingUp, Users, DollarSign, Building2,
  HardHat, CheckCircle2, ChevronRight, AlertCircle, Target,
  FileText, Globe, Loader2, Star, Zap, BarChart3
} from "lucide-react";

const PM_ICONS: Record<string, any> = {
  PM1: Users,
  PM2: TrendingUp,
  PM3: DollarSign,
  PM4: HardHat,
  PM5: Building2,
};

const PM_COLORS: Record<string, string> = {
  PM1: "bg-blue-50 border-blue-200 text-blue-800",
  PM2: "bg-green-50 border-green-200 text-green-800",
  PM3: "bg-purple-50 border-purple-200 text-purple-800",
  PM4: "bg-orange-50 border-orange-200 text-orange-800",
  PM5: "bg-teal-50 border-teal-200 text-teal-800",
};

const CATEGORY_LABELS: Record<string, string> = {
  workforce: "Workforce & Human Capital",
  innovation: "Innovation & Entrepreneurship",
  infrastructure: "Infrastructure & Place-Making",
  economic_base: "Economic Base & Industry Diversification",
  quality_of_life: "Quality of Life & Resilience",
};

const CATEGORY_COLORS: Record<string, string> = {
  workforce: "bg-blue-100 text-blue-800",
  innovation: "bg-purple-100 text-purple-800",
  infrastructure: "bg-orange-100 text-orange-800",
  economic_base: "bg-green-100 text-green-800",
  quality_of_life: "bg-rose-100 text-rose-800",
};

const PROGRAM_COLORS: Record<string, string> = {
  "ThriveUp Navigator": "bg-indigo-50 border-indigo-200",
  "Trade Simulations & Workforce Training": "bg-amber-50 border-amber-200",
  "Child Care Infrastructure": "bg-pink-50 border-pink-200",
  "Chainweb ROI Engine": "bg-emerald-50 border-emerald-200",
  "Community Intelligence Platform": "bg-cyan-50 border-cyan-200",
  "Foster Care & Justice-Involved Workforce": "bg-violet-50 border-violet-200",
  "Integration Through Invitation (Shadow Workers)": "bg-rose-50 border-rose-200",
};

function ScoreDots({ score }: { score: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`Alignment score: ${score} of 5`}>
      {[1,2,3,4,5].map(i => (
        <span
          key={i}
          className={`inline-block w-2 h-2 rounded-full ${i <= score ? "bg-emerald-500" : "bg-gray-200"}`}
        />
      ))}
    </span>
  );
}

export default function CedsNavigatorPage() {
  const { regionId } = useParams<{ regionId?: string }>();
  const [selectedRegionId, setSelectedRegionId] = useState<string>(regionId || "");
  const [searchState, setSearchState] = useState("TX");
  const [countySearch, setCountySearch] = useState("");
  const [alignInput, setAlignInput] = useState("");
  const [alignState, setAlignState] = useState("TX");

  const { data: framework } = useQuery({
    queryKey: ["/api/ceds/framework"],
  });

  const { data: regions, isLoading: regionsLoading } = useQuery({
    queryKey: ["/api/ceds/regions", searchState],
    queryFn: () => fetch(`/api/ceds/regions?state=${searchState}`).then(r => r.json()),
  });

  const { data: regionDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["/api/ceds/regions", selectedRegionId],
    queryFn: () => fetch(`/api/ceds/regions/${selectedRegionId}`).then(r => r.json()),
    enabled: !!selectedRegionId,
  });

  const alignMutation = useMutation({
    mutationFn: (body: { programDescription: string; targetState: string }) =>
      apiRequest("POST", "/api/ceds/align", body).then(r => r.json()),
  });

  const selectedRegion = regionDetail?.region;
  const goals = regionDetail?.goals ?? [];
  const alignments = regionDetail?.alignments ?? [];
  const performanceMeasures = framework?.performanceMeasures ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
          <Map className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="heading-ceds-title">
            CEDS Regional Alignment
          </h1>
          <p className="text-gray-500 mt-1 max-w-2xl">
            Every assessment, proposal, and community intelligence output is anchored
            to EDA's Comprehensive Economic Development Strategy framework. Select your
            region to see how TCAF's programs map to its strategic goals and EDA's
            5 mandatory performance measures.
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Badge variant="outline" className="text-xs">EDA Framework</Badge>
            <Badge variant="outline" className="text-xs">12 TX Regions Seeded</Badge>
            <Badge variant="outline" className="text-xs">5 EDA Performance Measures</Badge>
            <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-200 text-yellow-800">
              NORTEX = WSNT Child Care Region
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: EDA Universal Performance Measures */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-2 border-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                EDA's 5 Performance Measures
              </CardTitle>
              <CardDescription className="text-xs">
                Required in every CEDS. These are what EDA reviewers score on.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {performanceMeasures.map((pm: any) => {
                const Icon = PM_ICONS[pm.id] ?? Target;
                return (
                  <div
                    key={pm.id}
                    className={`p-3 rounded-lg border text-sm ${PM_COLORS[pm.id] ?? "bg-gray-50 border-gray-200 text-gray-800"}`}
                    data-testid={`card-pm-${pm.id}`}
                  >
                    <div className="flex items-center gap-2 font-semibold mb-0.5">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{pm.id}: {pm.label}</span>
                    </div>
                    <p className="text-xs opacity-80 leading-snug">{pm.description}</p>
                    <div className="mt-1">
                      <Badge variant="outline" className="text-xs py-0 px-1.5">
                        Unit: {pm.unit}
                      </Badge>
                      {pm.edaWeight === "primary" && (
                        <Badge className="text-xs py-0 px-1.5 ml-1 bg-blue-600">primary</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Region selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Search className="w-4 h-4" />
                Select a Region
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={searchState} onValueChange={setSearchState}>
                <SelectTrigger data-testid="select-state">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TX">Texas</SelectItem>
                  <SelectItem value="OK">Oklahoma</SelectItem>
                  <SelectItem value="LA">Louisiana</SelectItem>
                </SelectContent>
              </Select>

              {regionsLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading regions…
                </div>
              )}

              <div className="space-y-1 max-h-80 overflow-y-auto">
                {(regions?.regions ?? []).map((r: any) => (
                  <button
                    key={r.id}
                    data-testid={`button-region-${r.eddAbbr}`}
                    onClick={() => setSelectedRegionId(String(r.id))}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between gap-2 border ${
                      selectedRegionId === String(r.id)
                        ? "bg-blue-50 border-blue-300 font-semibold"
                        : "border-transparent hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {r.distressedDesignation && (
                        <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                      )}
                      <span>{r.eddAbbr}</span>
                      <span className="text-gray-400 font-normal truncate">{r.planningOrg?.split(" ").slice(0,3).join(" ")}</span>
                    </span>
                    <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Region detail */}
        <div className="lg:col-span-2 space-y-4">

          {!selectedRegionId && (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center text-gray-400">
                <Globe className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Select a region to see CEDS goals and TCAF alignments</p>
                <p className="text-sm mt-1">Start with NORTEX — that's the WSNT child care region (RFP2026-004)</p>
              </CardContent>
            </Card>
          )}

          {selectedRegionId && detailLoading && (
            <Card>
              <CardContent className="py-16 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
              </CardContent>
            </Card>
          )}

          {selectedRegion && (
            <Tabs defaultValue="overview">
              <TabsList className="mb-4">
                <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="goals" data-testid="tab-goals">
                  Strategic Goals {goals.length > 0 && `(${goals.length})`}
                </TabsTrigger>
                <TabsTrigger value="tcaf" data-testid="tab-tcaf">TCAF Alignments</TabsTrigger>
                <TabsTrigger value="align-tool" data-testid="tab-align-tool">Align a Program</TabsTrigger>
              </TabsList>

              {/* Overview tab */}
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg" data-testid="text-region-name">
                          {selectedRegion.eddName}
                        </CardTitle>
                        <CardDescription className="mt-1">{selectedRegion.planningOrg}</CardDescription>
                      </div>
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        <Badge variant="outline">{selectedRegion.state}</Badge>
                        {selectedRegion.distressedDesignation && (
                          <Badge className="bg-amber-500 text-white text-xs">EDA Distressed</Badge>
                        )}
                        {selectedRegion.cedsYear && (
                          <Badge variant="outline" className="text-xs">CEDS {selectedRegion.cedsYear}</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedRegion.strategicVision && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wide">Strategic Vision</p>
                        <p className="text-sm text-blue-900" data-testid="text-strategic-vision">
                          {selectedRegion.strategicVision}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-lg font-bold text-gray-900">
                          {selectedRegion.populationServed?.toLocaleString() ?? "—"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">Population Served</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-lg font-bold text-gray-900">
                          {selectedRegion.countyNames?.length ?? "—"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">Counties</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-lg font-bold text-gray-900">
                          {goals.length || "—"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">Strategic Goals</p>
                      </div>
                    </div>

                    {selectedRegion.countyNames?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Counties</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedRegion.countyNames.map((c: string) => (
                            <Badge key={c} variant="outline" className="text-xs font-normal">{c}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedRegion.notes && (
                      <Alert>
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription className="text-sm">{selectedRegion.notes}</AlertDescription>
                      </Alert>
                    )}

                    {selectedRegion.edaUrl && (
                      <a
                        href={selectedRegion.edaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                        data-testid="link-edd-website"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        {selectedRegion.edaUrl}
                      </a>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Strategic Goals tab */}
              <TabsContent value="goals" className="space-y-3">
                {goals.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="py-10 text-center text-gray-400">
                      <Target className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No goals seeded for this region yet.</p>
                      <p className="text-xs mt-1">NORTEX has full goal coverage. Other regions use the EDA universal framework.</p>
                    </CardContent>
                  </Card>
                )}
                {goals.map((goal: any) => (
                  <Card key={goal.id} data-testid={`card-goal-${goal.goalNumber}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                          {goal.goalNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-gray-900 text-sm" data-testid={`text-goal-title-${goal.goalNumber}`}>
                              {goal.goalTitle}
                            </h3>
                            <Badge className={`text-xs ${CATEGORY_COLORS[goal.category] ?? "bg-gray-100 text-gray-800"}`}>
                              {CATEGORY_LABELS[goal.category] ?? goal.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{goal.goalDescription}</p>

                          {goal.edaMeasureIds?.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap mb-2">
                              {goal.edaMeasureIds.map((pmId: string) => {
                                const pm = performanceMeasures.find((p: any) => p.id === pmId);
                                return pm ? (
                                  <Badge key={pmId} variant="outline" className={`text-xs ${PM_COLORS[pmId] ?? ""}`}>
                                    {pmId}: {pm.label}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          )}

                          {goal.tcafAlignment && (
                            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2 py-1.5 flex items-start gap-1.5">
                              <Zap className="w-3 h-3 shrink-0 mt-0.5" />
                              <span><strong>TCAF connection:</strong> {goal.tcafAlignment}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* TCAF Alignments tab */}
              <TabsContent value="tcaf" className="space-y-3">
                <p className="text-sm text-gray-500 mb-4">
                  Every TCAF program mapped to EDA performance measures for this region.
                  Use <strong>proposalContext</strong> text directly in grant proposals.
                </p>
                {alignments.map((a: any) => {
                  const colorClass = PROGRAM_COLORS[a.tcafProgram] ?? "bg-gray-50 border-gray-200";
                  return (
                    <Card key={a.id} className={`border ${colorClass}`} data-testid={`card-alignment-${a.id}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 text-sm">{a.tcafProgram}</h3>
                          <div className="flex items-center gap-2 shrink-0">
                            <ScoreDots score={a.alignmentScore} />
                            {a.edaPerformanceMeasure && (
                              <Badge variant="outline" className={`text-xs ${PM_COLORS[a.edaPerformanceMeasure] ?? ""}`}>
                                {a.edaPerformanceMeasure}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{a.alignmentNotes}</p>
                        {a.proposalContext && (
                          <div className="bg-white border rounded p-2 mt-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                              Ready-to-paste proposal language
                            </p>
                            <p className="text-xs text-gray-700 leading-relaxed">{a.proposalContext}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>

              {/* Align a Program tab */}
              <TabsContent value="align-tool">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-600" />
                      AI CEDS Alignment Tool
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Describe any program, initiative, or grant project. Get back the matching EDA
                      performance measures, CEDS categories, and ready-to-paste proposal language.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-700">Program or Initiative Description</label>
                      <Textarea
                        value={alignInput}
                        onChange={e => setAlignInput(e.target.value)}
                        placeholder="e.g. Workforce training program for justice-involved adults in the 11-county North Texas region, providing CDL certification and trade skills (welding, electrical) with employer placement support…"
                        rows={4}
                        className="text-sm"
                        data-testid="textarea-align-input"
                      />
                    </div>
                    <div className="flex gap-3 items-end">
                      <div className="space-y-1 w-32">
                        <label className="text-xs font-semibold text-gray-700">Target State</label>
                        <Select value={alignState} onValueChange={setAlignState}>
                          <SelectTrigger data-testid="select-align-state" className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TX">Texas</SelectItem>
                            <SelectItem value="OK">Oklahoma</SelectItem>
                            <SelectItem value="LA">Louisiana</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={() => alignMutation.mutate({ programDescription: alignInput, targetState: alignState })}
                        disabled={alignInput.length < 20 || alignMutation.isPending}
                        data-testid="button-run-alignment"
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {alignMutation.isPending ? (
                          <><Loader2 className="w-4 h-4 animate-spin mr-2" />Aligning…</>
                        ) : (
                          <><Zap className="w-4 h-4 mr-2" />Align to CEDS</>
                        )}
                      </Button>
                    </div>

                    {alignMutation.isError && (
                      <Alert variant="destructive">
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>Alignment failed — check your session (sign in required).</AlertDescription>
                      </Alert>
                    )}

                    {alignMutation.data?.alignment && (() => {
                      const al = alignMutation.data.alignment;
                      return (
                        <div className="space-y-4 pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <span className="font-semibold text-sm">Alignment Complete</span>
                            <Badge className="bg-emerald-600 text-white">{al.alignmentScore}/5</Badge>
                          </div>

                          {al.primaryMeasures?.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">EDA Performance Measures</p>
                              <div className="flex gap-2 flex-wrap">
                                {al.primaryMeasures.map((pmId: string) => {
                                  const pm = performanceMeasures.find((p: any) => p.id === pmId);
                                  return pm ? (
                                    <Badge key={pmId} className={`${PM_COLORS[pmId] ?? ""} border text-xs`}>
                                      {pmId}: {pm.label}
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}

                          {al.proposalLanguage && (
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
                                Ready-to-paste Proposal Language
                              </p>
                              <p className="text-sm text-blue-900 leading-relaxed">{al.proposalLanguage}</p>
                            </div>
                          )}

                          {al.regionalGoalMatches?.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Regional CEDS Goal Matches</p>
                              <div className="space-y-2">
                                {al.regionalGoalMatches.map((g: any, i: number) => (
                                  <div key={i} className="flex gap-2 text-sm">
                                    <Star className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                      <span className="font-medium">{g.goalTitle}</span>
                                      {g.alignmentNote && <p className="text-gray-500 text-xs">{g.alignmentNote}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {al.evidenceAnchor && (
                            <div className="text-xs text-gray-500 border-t pt-2">
                              <strong>Evidence anchor:</strong> {al.evidenceAnchor}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Bottom: EDA Source note */}
      <div className="text-xs text-gray-400 flex items-center gap-2 pt-4 border-t">
        <FileText className="w-3 h-3" />
        <span>
          EDA performance measures sourced from CEDS Content Guidelines (EDA.gov).
          Regional CEDS documents published by each Economic Development District.
          County FIPS codes: U.S. Census Bureau standard 5-digit codes.
        </span>
      </div>
    </div>
  );
}
