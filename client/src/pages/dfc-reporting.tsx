import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3, FileText, Users, Activity, Download, Plus,
  Target, TrendingUp, Shield, ClipboardList, ChevronRight,
  CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { DFCCrossNav } from "@/components/dfc-cross-nav";
import type {
  DfcCoreMeasure, DfcStakeholderSurvey,
  CommunityReadinessAssessment, CommunityReadinessInterview,
} from "@shared/schema";

type TabId = "core-measures" | "stakeholder-surveys" | "community-readiness" | "reaim" | "export";

interface DashboardData {
  totalCoreMeasures: number;
  baselineMeasures: number;
  followupMeasures: number;
  totalSurveys: number;
  surveysByPopulation: Record<string, number>;
  totalReadinessAssessments: number;
  latestReadiness: { overallReadiness: number; readinessStage: string; date: string } | null;
  totalInterviews: number;
  reaimMetrics: { reach: number; effectiveness: number; adoption: number; implementation: number; maintenance: number };
  readinessHistory: Array<{ date: string; score: number; stage: string }>;
}

const AGE_GROUPS = ["10-14", "15-18", "19-24", "25+"];
const PERIOD_TYPES = [
  { value: "baseline", label: "Baseline" },
  { value: "followup", label: "Follow-up" },
];

const POPULATION_TYPES = [
  { value: "youth", label: "Youth (10-18)" },
  { value: "parents", label: "Parents" },
  { value: "educators", label: "Educators" },
  { value: "law_enforcement", label: "Law Enforcement" },
  { value: "healthcare", label: "Healthcare" },
  { value: "faith_based", label: "Faith-Based" },
  { value: "business", label: "Business" },
  { value: "veterans", label: "Veterans" },
  { value: "returning_citizens", label: "Returning Citizens" },
  { value: "seniors", label: "Seniors" },
];

const READINESS_STAGES = [
  "No Awareness",
  "Denial/Resistance",
  "Vague Awareness",
  "Preplanning",
  "Preparation",
  "Initiation",
  "Stabilization",
  "Confirmation/Expansion",
  "High Level of Community Ownership",
];

export default function DfcReportingPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>("core-measures");
  const [showMeasureForm, setShowMeasureForm] = useState(false);
  const [showSurveyForm, setShowSurveyForm] = useState(false);
  const [showReadinessForm, setShowReadinessForm] = useState(false);
  const [showInterviewForm, setShowInterviewForm] = useState(false);

  const [measureData, setMeasureData] = useState({
    surveyPeriod: "", periodType: "baseline", ageGroup: "10-14",
    alcoholPast30: 0, marijuanaPast30: 0, tobaccoPast30: 0, prescriptionPast30: 0,
    perceptionOfRiskAlcohol: 0, perceptionOfRiskMarijuana: 0,
    parentalDisapproval: 0, peerDisapproval: 0,
    averageAgeFirstUse: 0, perceivedAvailability: 0,
    sampleSize: 0, notes: "",
  });

  const [surveyData, setSurveyData] = useState({
    populationType: "youth", surveyPeriod: "", respondentCount: 0, notes: "",
  });

  const [readinessData, setReadinessData] = useState({
    assessmentDate: new Date().toISOString().split("T")[0],
    communityEfforts: 1, communityKnowledgeOfEfforts: 1,
    leadership: 1, communityclimate: 1,
    communityKnowledgeOfIssue: 1, resources: 1, notes: "",
  });

  const [interviewData, setInterviewData] = useState({
    assessmentId: "", intervieweeType: "youth", intervieweeName: "",
    interviewDate: new Date().toISOString().split("T")[0], notes: "",
  });

  const { data: dashboard, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dfc/dashboard"],
  });

  const { data: measures = [] } = useQuery<DfcCoreMeasure[]>({
    queryKey: ["/api/dfc/core-measures"],
  });

  const { data: surveys = [] } = useQuery<DfcStakeholderSurvey[]>({
    queryKey: ["/api/dfc/stakeholder-surveys"],
  });

  const { data: readinessAssessments = [] } = useQuery<CommunityReadinessAssessment[]>({
    queryKey: ["/api/dfc/community-readiness"],
  });

  const { data: interviews = [] } = useQuery<CommunityReadinessInterview[]>({
    queryKey: ["/api/dfc/readiness-interviews"],
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/dfc/dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dfc/core-measures"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dfc/stakeholder-surveys"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dfc/community-readiness"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dfc/readiness-interviews"] });
  };

  const addMeasureMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/dfc/core-measures", data);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setShowMeasureForm(false);
      toast({ title: "Core measure data recorded" });
    },
  });

  const addSurveyMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/dfc/stakeholder-surveys", data);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setShowSurveyForm(false);
      toast({ title: "Stakeholder survey recorded" });
    },
  });

  const addReadinessMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/dfc/community-readiness", data);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setShowReadinessForm(false);
      toast({ title: "Readiness assessment completed" });
    },
  });

  const addInterviewMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/dfc/readiness-interviews", data);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setShowInterviewForm(false);
      toast({ title: "Interview recorded" });
    },
  });

  const tabs: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
    { id: "core-measures", label: "DFC Core Measures", icon: BarChart3 },
    { id: "stakeholder-surveys", label: "Stakeholder Surveys", icon: Users },
    { id: "community-readiness", label: "Community Readiness", icon: Target },
    { id: "reaim", label: "RE-AIM Dashboard", icon: Activity },
    { id: "export", label: "Export", icon: Download },
  ];

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-dfc-reporting-title">DFC Performance & Community Readiness</h1>
        <p className="text-muted-foreground mt-1">SAMHSA Drug-Free Communities reporting, stakeholder surveys, and community readiness assessment</p>
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3 text-center" data-testid="card-stat-measures">
            <p className="text-2xl font-bold text-primary">{dashboard.totalCoreMeasures}</p>
            <p className="text-xs text-muted-foreground">Core Measures</p>
          </Card>
          <Card className="p-3 text-center" data-testid="card-stat-surveys">
            <p className="text-2xl font-bold text-emerald-600">{dashboard.totalSurveys}</p>
            <p className="text-xs text-muted-foreground">Stakeholder Surveys</p>
          </Card>
          <Card className="p-3 text-center" data-testid="card-stat-readiness">
            <p className="text-2xl font-bold text-blue-600">
              {dashboard.latestReadiness ? dashboard.latestReadiness.overallReadiness.toFixed(1) : "N/A"}
            </p>
            <p className="text-xs text-muted-foreground">Readiness Score</p>
          </Card>
          <Card className="p-3 text-center" data-testid="card-stat-interviews">
            <p className="text-2xl font-bold text-amber-600">{dashboard.totalInterviews}</p>
            <p className="text-xs text-muted-foreground">Key Informant Interviews</p>
          </Card>
        </div>
      )}

      <div className="flex gap-1 border-b overflow-x-auto pb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
            data-testid={`tab-dfc-${tab.id}`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "core-measures" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">DFC Core Measures</h2>
            <Button onClick={() => setShowMeasureForm(!showMeasureForm)} data-testid="button-add-measure">
              <Plus className="mr-2 h-4 w-4" /> Add Core Measure Data
            </Button>
          </div>

          {showMeasureForm && (
            <Card className="p-5 space-y-4" data-testid="card-measure-form">
              <h3 className="font-semibold">Record DFC Core Measure Data</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Survey Period</label>
                  <Input
                    placeholder="e.g., Fall 2024"
                    value={measureData.surveyPeriod}
                    onChange={e => setMeasureData(d => ({ ...d, surveyPeriod: e.target.value }))}
                    data-testid="input-measure-period"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Period Type</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={measureData.periodType}
                    onChange={e => setMeasureData(d => ({ ...d, periodType: e.target.value }))}
                    data-testid="select-measure-period-type"
                  >
                    {PERIOD_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Age Group</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={measureData.ageGroup}
                    onChange={e => setMeasureData(d => ({ ...d, ageGroup: e.target.value }))}
                    data-testid="select-measure-age-group"
                  >
                    {AGE_GROUPS.map(ag => <option key={ag} value={ag}>{ag}</option>)}
                  </select>
                </div>
              </div>

              <p className="text-sm font-medium text-muted-foreground">Past 30-Day Substance Use Rates (%)</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: "alcoholPast30", label: "Alcohol" },
                  { key: "marijuanaPast30", label: "Marijuana" },
                  { key: "tobaccoPast30", label: "Tobacco" },
                  { key: "prescriptionPast30", label: "Prescription" },
                ].map(field => (
                  <div key={field.key}>
                    <label className="text-sm">{field.label}</label>
                    <Input
                      type="number" min="0" max="100" step="0.1"
                      value={measureData[field.key as keyof typeof measureData]}
                      onChange={e => setMeasureData(d => ({ ...d, [field.key]: parseFloat(e.target.value) || 0 }))}
                      data-testid={`input-measure-${field.key}`}
                    />
                  </div>
                ))}
              </div>

              <p className="text-sm font-medium text-muted-foreground">Perception Measures (%)</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { key: "perceptionOfRiskAlcohol", label: "Risk - Alcohol" },
                  { key: "perceptionOfRiskMarijuana", label: "Risk - Marijuana" },
                  { key: "parentalDisapproval", label: "Parental Disapproval" },
                  { key: "peerDisapproval", label: "Peer Disapproval" },
                  { key: "perceivedAvailability", label: "Perceived Availability" },
                  { key: "averageAgeFirstUse", label: "Avg Age First Use" },
                ].map(field => (
                  <div key={field.key}>
                    <label className="text-sm">{field.label}</label>
                    <Input
                      type="number" min="0" step="0.1"
                      value={measureData[field.key as keyof typeof measureData]}
                      onChange={e => setMeasureData(d => ({ ...d, [field.key]: parseFloat(e.target.value) || 0 }))}
                      data-testid={`input-measure-${field.key}`}
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Sample Size</label>
                  <Input
                    type="number" min="0"
                    value={measureData.sampleSize}
                    onChange={e => setMeasureData(d => ({ ...d, sampleSize: parseInt(e.target.value) || 0 }))}
                    data-testid="input-measure-sample-size"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <Input
                    value={measureData.notes}
                    onChange={e => setMeasureData(d => ({ ...d, notes: e.target.value }))}
                    data-testid="input-measure-notes"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => addMeasureMutation.mutate(measureData)}
                  disabled={!measureData.surveyPeriod || addMeasureMutation.isPending}
                  data-testid="button-submit-measure"
                >
                  {addMeasureMutation.isPending ? "Saving..." : "Save Core Measure"}
                </Button>
                <Button variant="outline" onClick={() => setShowMeasureForm(false)} data-testid="button-cancel-measure">Cancel</Button>
              </div>
            </Card>
          )}

          {measures.length > 0 ? (
            <div className="space-y-4">
              {(() => {
                const baselineMeasures = measures.filter(m => m.periodType === "baseline");
                const followupMeasures = measures.filter(m => m.periodType === "followup");
                const periods = Array.from(new Set(measures.map(m => m.surveyPeriod)));

                return (
                  <>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary">{baselineMeasures.length} Baseline</Badge>
                      <Badge variant="secondary">{followupMeasures.length} Follow-up</Badge>
                      <Badge variant="secondary">{periods.length} Periods</Badge>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm" data-testid="table-core-measures">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Period</th>
                            <th className="text-left p-2">Type</th>
                            <th className="text-left p-2">Age</th>
                            <th className="text-right p-2">Alcohol</th>
                            <th className="text-right p-2">Marijuana</th>
                            <th className="text-right p-2">Tobacco</th>
                            <th className="text-right p-2">Rx</th>
                            <th className="text-right p-2">Sample</th>
                          </tr>
                        </thead>
                        <tbody>
                          {measures.map(m => (
                            <tr key={m.id} className="border-b" data-testid={`row-measure-${m.id}`}>
                              <td className="p-2">{m.surveyPeriod}</td>
                              <td className="p-2">
                                <Badge variant={m.periodType === "baseline" ? "default" : "secondary"} className="text-xs">
                                  {m.periodType}
                                </Badge>
                              </td>
                              <td className="p-2">{m.ageGroup}</td>
                              <td className="text-right p-2">{m.alcoholPast30}%</td>
                              <td className="text-right p-2">{m.marijuanaPast30}%</td>
                              <td className="text-right p-2">{m.tobaccoPast30}%</td>
                              <td className="text-right p-2">{m.prescriptionPast30}%</td>
                              <td className="text-right p-2">{m.sampleSize}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {baselineMeasures.length > 0 && followupMeasures.length > 0 && (
                      <Card className="p-5" data-testid="card-period-comparison">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" /> Baseline vs Follow-up Comparison
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {["alcoholPast30", "marijuanaPast30", "tobaccoPast30", "prescriptionPast30"].map(substance => {
                            const bAvg = baselineMeasures.reduce((s, m) => s + (m[substance as keyof DfcCoreMeasure] as number || 0), 0) / baselineMeasures.length;
                            const fAvg = followupMeasures.reduce((s, m) => s + (m[substance as keyof DfcCoreMeasure] as number || 0), 0) / followupMeasures.length;
                            const diff = fAvg - bAvg;
                            const label = substance.replace("Past30", "").replace(/([A-Z])/g, " $1").trim();
                            return (
                              <div key={substance} className="text-center">
                                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                                <div className="flex items-center justify-center gap-1">
                                  {diff < 0 ? (
                                    <ArrowDownRight className="h-4 w-4 text-emerald-500" />
                                  ) : diff > 0 ? (
                                    <ArrowUpRight className="h-4 w-4 text-red-500" />
                                  ) : null}
                                  <span className={`text-lg font-bold ${diff < 0 ? "text-emerald-600" : diff > 0 ? "text-red-600" : ""}`}>
                                    {diff > 0 ? "+" : ""}{diff.toFixed(1)}%
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">{bAvg.toFixed(1)}% → {fAvg.toFixed(1)}%</p>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            <Card className="p-8 text-center" data-testid="card-empty-measures">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No core measure data yet. Add baseline data to begin tracking.</p>
            </Card>
          )}
        </div>
      )}

      {activeTab === "stakeholder-surveys" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">Stakeholder Data Collection</h2>
            <Button onClick={() => setShowSurveyForm(!showSurveyForm)} data-testid="button-add-survey">
              <Plus className="mr-2 h-4 w-4" /> Record Survey
            </Button>
          </div>

          {showSurveyForm && (
            <Card className="p-5 space-y-4" data-testid="card-survey-form">
              <h3 className="font-semibold">Record Stakeholder Survey Data</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Population Type</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={surveyData.populationType}
                    onChange={e => setSurveyData(d => ({ ...d, populationType: e.target.value }))}
                    data-testid="select-survey-population"
                  >
                    {POPULATION_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Survey Period</label>
                  <Input
                    placeholder="e.g., Fall 2024"
                    value={surveyData.surveyPeriod}
                    onChange={e => setSurveyData(d => ({ ...d, surveyPeriod: e.target.value }))}
                    data-testid="input-survey-period"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Respondent Count</label>
                  <Input
                    type="number" min="0"
                    value={surveyData.respondentCount}
                    onChange={e => setSurveyData(d => ({ ...d, respondentCount: parseInt(e.target.value) || 0 }))}
                    data-testid="input-survey-respondents"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={surveyData.notes}
                  onChange={e => setSurveyData(d => ({ ...d, notes: e.target.value }))}
                  data-testid="input-survey-notes"
                  className="resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => addSurveyMutation.mutate(surveyData)}
                  disabled={!surveyData.surveyPeriod || addSurveyMutation.isPending}
                  data-testid="button-submit-survey"
                >
                  {addSurveyMutation.isPending ? "Saving..." : "Save Survey Data"}
                </Button>
                <Button variant="outline" onClick={() => setShowSurveyForm(false)} data-testid="button-cancel-survey">Cancel</Button>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {POPULATION_TYPES.map(pt => {
              const count = surveys.filter(s => s.populationType === pt.value).reduce((sum, s) => sum + (s.respondentCount || 0), 0);
              const hasSurveys = surveys.some(s => s.populationType === pt.value);
              return (
                <Card key={pt.value} className={`p-3 text-center ${hasSurveys ? "border-emerald-500/30" : ""}`} data-testid={`card-population-${pt.value}`}>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {hasSurveys ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{pt.label}</p>
                </Card>
              );
            })}
          </div>

          {surveys.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-surveys">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Population</th>
                    <th className="text-left p-2">Period</th>
                    <th className="text-right p-2">Respondents</th>
                    <th className="text-left p-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {surveys.map(s => (
                    <tr key={s.id} className="border-b" data-testid={`row-survey-${s.id}`}>
                      <td className="p-2">
                        <Badge variant="secondary" className="text-xs">
                          {POPULATION_TYPES.find(p => p.value === s.populationType)?.label || s.populationType}
                        </Badge>
                      </td>
                      <td className="p-2">{s.surveyPeriod}</td>
                      <td className="text-right p-2">{s.respondentCount}</td>
                      <td className="p-2 text-muted-foreground truncate max-w-48">{s.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "community-readiness" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">Community Readiness Assessment</h2>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => setShowInterviewForm(!showInterviewForm)} data-testid="button-add-interview">
                <Plus className="mr-2 h-4 w-4" /> Record Interview
              </Button>
              <Button onClick={() => setShowReadinessForm(!showReadinessForm)} data-testid="button-add-readiness">
                <Plus className="mr-2 h-4 w-4" /> New Assessment
              </Button>
            </div>
          </div>

          <Card className="p-5" data-testid="card-readiness-model">
            <h3 className="font-semibold mb-3">Tri-Ethnic Center Community Readiness Model</h3>
            <p className="text-sm text-muted-foreground mb-3">Rate your community on each of the 6 dimensions using a 1-9 scale corresponding to the readiness stages.</p>
            <div className="flex gap-1 overflow-x-auto pb-2">
              {READINESS_STAGES.map((stage, idx) => (
                <Badge key={stage} variant="outline" className="text-xs whitespace-nowrap" data-testid={`badge-stage-${idx + 1}`}>
                  {idx + 1}. {stage}
                </Badge>
              ))}
            </div>
          </Card>

          {showReadinessForm && (
            <Card className="p-5 space-y-4" data-testid="card-readiness-form">
              <h3 className="font-semibold">Community Readiness Assessment</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium">Assessment Date</label>
                  <Input
                    type="date"
                    value={readinessData.assessmentDate}
                    onChange={e => setReadinessData(d => ({ ...d, assessmentDate: e.target.value }))}
                    data-testid="input-readiness-date"
                  />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Rate each dimension (1-9)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "communityEfforts", label: "Community Efforts" },
                  { key: "communityKnowledgeOfEfforts", label: "Community Knowledge of Efforts" },
                  { key: "leadership", label: "Leadership" },
                  { key: "communityclimate", label: "Community Climate" },
                  { key: "communityKnowledgeOfIssue", label: "Community Knowledge of Issue" },
                  { key: "resources", label: "Resources" },
                ].map(dim => (
                  <div key={dim.key}>
                    <label className="text-sm">{dim.label}</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range" min="1" max="9" step="1"
                        className="flex-1"
                        value={readinessData[dim.key as keyof typeof readinessData] as number}
                        onChange={e => setReadinessData(d => ({ ...d, [dim.key]: parseInt(e.target.value) }))}
                        data-testid={`slider-readiness-${dim.key}`}
                      />
                      <span className="text-sm font-bold w-6 text-center">
                        {readinessData[dim.key as keyof typeof readinessData]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {READINESS_STAGES[(readinessData[dim.key as keyof typeof readinessData] as number) - 1] || ""}
                    </p>
                  </div>
                ))}
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={readinessData.notes}
                  onChange={e => setReadinessData(d => ({ ...d, notes: e.target.value }))}
                  data-testid="input-readiness-notes"
                  className="resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => addReadinessMutation.mutate(readinessData)}
                  disabled={addReadinessMutation.isPending}
                  data-testid="button-submit-readiness"
                >
                  {addReadinessMutation.isPending ? "Saving..." : "Submit Assessment"}
                </Button>
                <Button variant="outline" onClick={() => setShowReadinessForm(false)} data-testid="button-cancel-readiness">Cancel</Button>
              </div>
            </Card>
          )}

          {showInterviewForm && (
            <Card className="p-5 space-y-4" data-testid="card-interview-form">
              <h3 className="font-semibold">Record Key Informant Interview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Interviewee Type</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={interviewData.intervieweeType}
                    onChange={e => setInterviewData(d => ({ ...d, intervieweeType: e.target.value }))}
                    data-testid="select-interview-type"
                  >
                    {POPULATION_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Interviewee Name</label>
                  <Input
                    value={interviewData.intervieweeName}
                    onChange={e => setInterviewData(d => ({ ...d, intervieweeName: e.target.value }))}
                    data-testid="input-interview-name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Interview Date</label>
                  <Input
                    type="date"
                    value={interviewData.interviewDate}
                    onChange={e => setInterviewData(d => ({ ...d, interviewDate: e.target.value }))}
                    data-testid="input-interview-date"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={interviewData.notes}
                  onChange={e => setInterviewData(d => ({ ...d, notes: e.target.value }))}
                  data-testid="input-interview-notes"
                  className="resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => addInterviewMutation.mutate(interviewData)}
                  disabled={addInterviewMutation.isPending}
                  data-testid="button-submit-interview"
                >
                  {addInterviewMutation.isPending ? "Saving..." : "Save Interview"}
                </Button>
                <Button variant="outline" onClick={() => setShowInterviewForm(false)} data-testid="button-cancel-interview">Cancel</Button>
              </div>
            </Card>
          )}

          {readinessAssessments.length > 0 && (
            <div className="space-y-4">
              {readinessAssessments.map((ra, idx) => (
                <Card key={ra.id} className="p-5" data-testid={`card-readiness-${ra.id}`}>
                  <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Assessment: {ra.assessmentDate}</h3>
                      <Badge variant={ra.overallReadiness && ra.overallReadiness >= 5 ? "default" : "secondary"}>
                        Stage {Math.round(ra.overallReadiness || 0)}: {ra.readinessStage}
                      </Badge>
                    </div>
                    <span className="text-2xl font-bold text-primary">{(ra.overallReadiness || 0).toFixed(1)}/9</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {[
                      { label: "Community Efforts", val: ra.communityEfforts },
                      { label: "Knowledge of Efforts", val: ra.communityKnowledgeOfEfforts },
                      { label: "Leadership", val: ra.leadership },
                      { label: "Community Climate", val: ra.communityclimate },
                      { label: "Knowledge of Issue", val: ra.communityKnowledgeOfIssue },
                      { label: "Resources", val: ra.resources },
                    ].map(dim => (
                      <div key={dim.label} className="text-center">
                        <p className="text-lg font-bold">{dim.val}</p>
                        <p className="text-xs text-muted-foreground">{dim.label}</p>
                        <Progress value={(dim.val / 9) * 100} className="h-2 mt-1" />
                      </div>
                    ))}
                  </div>
                  {ra.recommendations && ra.recommendations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Recommendations:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {ra.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 shrink-0 mt-0.5" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {interviews.length > 0 && (
            <Card className="p-5" data-testid="card-interviews-list">
              <h3 className="font-semibold mb-3">Key Informant Interviews ({interviews.length})</h3>
              <div className="space-y-2">
                {interviews.map(iv => (
                  <div key={iv.id} className="flex items-center justify-between gap-2 p-2 border rounded-md" data-testid={`row-interview-${iv.id}`}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {POPULATION_TYPES.find(p => p.value === iv.intervieweeType)?.label || iv.intervieweeType}
                      </Badge>
                      <span className="text-sm">{iv.intervieweeName || "Anonymous"}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{iv.interviewDate}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {readinessAssessments.length === 0 && interviews.length === 0 && (
            <Card className="p-8 text-center" data-testid="card-empty-readiness">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No readiness assessments yet. Conduct key informant interviews and submit an assessment to begin.</p>
            </Card>
          )}
        </div>
      )}

      {activeTab === "reaim" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">RE-AIM Framework Dashboard</h2>
          <p className="text-sm text-muted-foreground">Implementation science metrics tracking Reach, Effectiveness, Adoption, Implementation, and Maintenance.</p>

          {dashboard?.reaimMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { key: "reach", label: "Reach", desc: "Total survey respondents across all populations", icon: Users, color: "text-blue-600" },
                { key: "effectiveness", label: "Effectiveness", desc: "Community readiness progress (%)", icon: TrendingUp, color: "text-emerald-600" },
                { key: "adoption", label: "Adoption", desc: "Population types surveyed", icon: CheckCircle2, color: "text-violet-600" },
                { key: "implementation", label: "Implementation", desc: "Core measure data points collected", icon: ClipboardList, color: "text-amber-600" },
                { key: "maintenance", label: "Maintenance", desc: "Readiness assessments conducted", icon: Shield, color: "text-rose-600" },
              ].map(metric => {
                const val = dashboard.reaimMetrics[metric.key as keyof typeof dashboard.reaimMetrics];
                return (
                  <Card key={metric.key} className="p-4" data-testid={`card-reaim-${metric.key}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <metric.icon className={`h-5 w-5 ${metric.color}`} />
                      <h4 className="font-semibold text-sm">{metric.label}</h4>
                    </div>
                    <p className={`text-3xl font-bold ${metric.color}`}>
                      {metric.key === "effectiveness" ? `${val}%` : val}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{metric.desc}</p>
                  </Card>
                );
              })}
            </div>
          )}

          {dashboard?.readinessHistory && dashboard.readinessHistory.length > 0 && (
            <Card className="p-5" data-testid="card-readiness-trend">
              <h3 className="font-semibold mb-3">Community Readiness Over Time</h3>
              <div className="space-y-2">
                {dashboard.readinessHistory.map((point, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-24">{point.date}</span>
                    <Progress value={(point.score / 9) * 100} className="flex-1 h-3" />
                    <span className="text-sm font-semibold w-8">{point.score.toFixed(1)}</span>
                    <Badge variant="outline" className="text-xs whitespace-nowrap">{point.stage}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === "export" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Export Reports</h2>
          <p className="text-sm text-muted-foreground">Download DFC performance data in SAMHSA-compatible formats.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5" data-testid="card-export-csv">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="h-8 w-8 text-emerald-600" />
                <div>
                  <h3 className="font-semibold">Core Measures CSV</h3>
                  <p className="text-sm text-muted-foreground">Export all core measure data in CSV format for SAMHSA DFC reporting</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  window.open("/api/dfc/export/csv", "_blank");
                  toast({ title: "CSV export started" });
                }}
                data-testid="button-export-csv"
              >
                <Download className="mr-2 h-4 w-4" /> Download CSV
              </Button>
            </Card>

            <Card className="p-5" data-testid="card-export-summary">
              <div className="flex items-center gap-3 mb-3">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold">Summary Report</h3>
                  <p className="text-sm text-muted-foreground">View summary statistics for grant reporting narratives</p>
                </div>
              </div>
              {dashboard && (
                <div className="space-y-1 text-sm">
                  <p>Core Measures: {dashboard.totalCoreMeasures} ({dashboard.baselineMeasures} baseline, {dashboard.followupMeasures} follow-up)</p>
                  <p>Stakeholder Surveys: {dashboard.totalSurveys} across {Object.keys(dashboard.surveysByPopulation).length} populations</p>
                  <p>Community Readiness: {dashboard.latestReadiness ? `Stage ${Math.round(dashboard.latestReadiness.overallReadiness)} - ${dashboard.latestReadiness.readinessStage}` : "Not assessed"}</p>
                  <p>Key Informant Interviews: {dashboard.totalInterviews}</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
      <DFCCrossNav currentPage="dfc-reporting" />
    </div>
  );
}
