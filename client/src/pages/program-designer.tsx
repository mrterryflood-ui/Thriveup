import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Target, Users, CheckCircle2, ArrowRight, ArrowLeft,
  Search, Layers, Briefcase, Shield, Heart, Globe,
  FileText, Lightbulb, Zap, BarChart3,
  ChevronRight, Handshake, Brain, MapPin, Loader2,
  Home, Building2, Wifi, GraduationCap, Save, Download,
  Sparkles, ClipboardList,
} from "lucide-react";
import { DISCIPLINES } from "@/lib/mvv-content";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProgramDesign } from "@shared/schema";

const PROBLEM_DOMAINS = [
  { id: "school-to-prison", label: "School-to-Prison Pipeline", icon: GraduationCap, desc: "Zero-tolerance policies, suspension/expulsion disparities, restorative discipline, diversion programs" },
  { id: "substance-use", label: "Substance Use Crisis", icon: Heart, desc: "Prevention coalitions, harm reduction, recovery support, DFC alignment, community-based strategies" },
  { id: "workforce-gap", label: "Workforce Gap", icon: Briefcase, desc: "Employment barriers, skills gaps, career pathways, credential attainment, WIOA alignment" },
  { id: "health-equity", label: "Health Equity", icon: Heart, desc: "Behavioral health, maternal health, chronic disease, SDOH, health disparities, veteran health" },
  { id: "reentry-recidivism", label: "Reentry & Recidivism", icon: Shield, desc: "Recidivism reduction, diversion, restorative justice, reintegration, case management" },
  { id: "economic-development", label: "Economic Development", icon: Briefcase, desc: "Small business support, community wealth building, financial literacy, minority enterprise" },
  { id: "family-strengthening", label: "Family Strengthening", icon: Home, desc: "Parenting programs, family stability, child welfare prevention, intergenerational support" },
];

const STEP_LABELS = [
  "Problem Domain",
  "Community Context",
  "AI Intervention Design",
  "Program Summary",
];

interface ThreeRealities {
  research: string;
  political: string;
  ground: string;
}

interface CommunityContext {
  location: string;
  population: string;
  assets: string;
  barriers: string;
}

interface AIRecommendation {
  title?: string;
  disciplines?: Array<{ name: string; role: string }>;
  platforms?: Array<{ name: string; purpose: string }>;
  stakeholders?: Array<{ type: string; role: string }>;
  salpIndicators?: Array<{ indicator: string; measurementMethod: string }>;
  programStructure?: { phases: Array<{ name: string; duration: string; activities: string[] }> };
  grantAlignments?: Array<{ grantName: string; alignmentScore: number; keyAlignments: string[] }>;
  raw?: string;
  error?: string;
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-2 mb-6" data-testid="step-indicator">
      {STEP_LABELS.map((label, i) => {
        const stepNum = i + 1;
        const isActive = currentStep === stepNum;
        const isComplete = currentStep > stepNum;
        return (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold shrink-0 ${
              isComplete ? "bg-primary text-primary-foreground" :
              isActive ? "bg-primary text-primary-foreground" :
              "bg-muted text-muted-foreground"
            }`} data-testid={`step-circle-${stepNum}`}>
              {isComplete ? <CheckCircle2 className="h-4 w-4" /> : stepNum}
            </div>
            <span className={`text-xs hidden sm:inline ${isActive ? "font-semibold" : "text-muted-foreground"}`} data-testid={`step-label-${stepNum}`}>
              {label}
            </span>
            {i < STEP_LABELS.length - 1 && (
              <div className={`flex-1 h-px ${isComplete ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Step1ProblemDomain({
  selected,
  onSelect,
  customDomain,
  onCustomChange,
}: {
  selected: string;
  onSelect: (id: string) => void;
  customDomain: string;
  onCustomChange: (val: string) => void;
}) {
  return (
    <div className="space-y-6" data-testid="step-1-content">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
          <Search className="h-5 w-5 text-primary" />
          Step 1: Identify the Problem Domain
        </h2>
        <p className="text-sm text-muted-foreground">
          What community problem are you trying to solve? Select a domain or describe a custom challenge.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROBLEM_DOMAINS.map((domain) => {
          const Icon = domain.icon;
          const isSelected = selected === domain.id;
          return (
            <Card
              key={domain.id}
              className={`cursor-pointer hover-elevate transition-all ${isSelected ? "ring-2 ring-primary" : ""}`}
              onClick={() => onSelect(domain.id)}
              data-testid={`card-domain-${domain.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-md bg-primary/10 p-2 shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm">{domain.label}</h3>
                </div>
                <p className="text-xs text-muted-foreground">{domain.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Or describe a custom problem domain:</label>
        <Textarea
          value={customDomain}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder="Describe the specific community challenge you want to address..."
          className="resize-none"
          data-testid="input-custom-domain"
        />
      </div>
    </div>
  );
}

function Step2CommunityContext({
  context,
  onContextChange,
  realities,
  onRealitiesChange,
}: {
  context: CommunityContext;
  onContextChange: (ctx: CommunityContext) => void;
  realities: ThreeRealities;
  onRealitiesChange: (r: ThreeRealities) => void;
}) {
  return (
    <div className="space-y-6" data-testid="step-2-content">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
          <MapPin className="h-5 w-5 text-primary" />
          Step 2: Community Context & Three Realities
        </h2>
        <p className="text-sm text-muted-foreground">
          Describe the community you're serving and analyze through the Three Realities lens.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" /> Community Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Location / Service Area</label>
            <Input
              value={context.location}
              onChange={(e) => onContextChange({ ...context, location: e.target.value })}
              placeholder="e.g., East Austin, TX; Rural Appalachian Region"
              data-testid="input-location"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Target Population</label>
            <Input
              value={context.population}
              onChange={(e) => onContextChange({ ...context, population: e.target.value })}
              placeholder="e.g., Youth ages 14-24 facing employment barriers"
              data-testid="input-population"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Community Assets</label>
            <Textarea
              value={context.assets}
              onChange={(e) => onContextChange({ ...context, assets: e.target.value })}
              placeholder="Existing organizations, resources, strengths, and infrastructure..."
              className="resize-none"
              data-testid="input-assets"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Barriers & Challenges</label>
            <Textarea
              value={context.barriers}
              onChange={(e) => onContextChange({ ...context, barriers: e.target.value })}
              placeholder="Transportation, digital access, language barriers, funding gaps..."
              className="resize-none"
              data-testid="input-barriers"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" /> The Three Realities
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            MAP-GAP adapts every program through three lenses — what research says, what politics allow, and what works on the ground.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Research Reality</label>
            <Textarea
              value={realities.research}
              onChange={(e) => onRealitiesChange({ ...realities, research: e.target.value })}
              placeholder="What does the evidence say? What frameworks, studies, or best practices apply?"
              className="resize-none"
              data-testid="input-reality-research"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Political Reality</label>
            <Textarea
              value={realities.political}
              onChange={(e) => onRealitiesChange({ ...realities, political: e.target.value })}
              placeholder="What do local policies, regulations, and political dynamics allow or restrict?"
              className="resize-none"
              data-testid="input-reality-political"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Ground Reality</label>
            <Textarea
              value={realities.ground}
              onChange={(e) => onRealitiesChange({ ...realities, ground: e.target.value })}
              placeholder="What actually works in this specific community? What have people tried before?"
              className="resize-none"
              data-testid="input-reality-ground"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Step3AIDesign({
  recommendation,
  isLoading,
  onGenerate,
}: {
  recommendation: AIRecommendation | null;
  isLoading: boolean;
  onGenerate: () => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="step-3-loading">
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
          <h3 className="font-semibold text-lg mb-2">Generating Intervention Design...</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            AI is analyzing your problem domain, community context, and Three Realities to design a tailored intervention using MAP-GAP principles.
          </p>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="space-y-6" data-testid="step-3-empty">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
            Step 3: AI-Generated Intervention Design
          </h2>
          <p className="text-sm text-muted-foreground">
            Let AI design a tailored intervention based on your inputs using the MAP-GAP framework.
          </p>
        </div>
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Ready to Generate</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Click below to generate an AI-powered intervention design based on your problem domain, community context, and Three Realities analysis.
            </p>
            <Button onClick={onGenerate} data-testid="button-generate-recommendation">
              <Sparkles className="mr-2 h-4 w-4" /> Generate Intervention Design
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="step-3-content">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-primary" />
          Step 3: AI-Generated Intervention Design
        </h2>
        <p className="text-sm text-muted-foreground">
          Review and refine the AI-generated design below.
        </p>
      </div>

      {recommendation.title && (
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-primary" data-testid="text-recommended-title">{recommendation.title}</h3>
          </CardContent>
        </Card>
      )}

      {recommendation.disciplines && recommendation.disciplines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" /> Recommended Disciplines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendation.disciplines.map((d, i) => {
              const disc = DISCIPLINES.find(dd => dd.name.toLowerCase().includes(d.name.toLowerCase()));
              return (
                <div key={i} className="flex items-start gap-3" data-testid={`discipline-${i}`}>
                  <div className={`rounded-md p-2 shrink-0 ${disc ? disc.color : "bg-muted"}`}>
                    <Brain className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.role}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {recommendation.platforms && recommendation.platforms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" /> Platforms Activated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recommendation.platforms.map((p, i) => (
                <div key={i} className="p-3 rounded-md border" data-testid={`platform-${i}`}>
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.purpose}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {recommendation.stakeholders && recommendation.stakeholders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Stakeholder Coordination
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {recommendation.stakeholders.map((s, i) => (
                <Badge key={i} variant="outline" className="text-xs" data-testid={`stakeholder-${i}`}>
                  <span className="font-semibold mr-1">{s.type}:</span> {s.role}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {recommendation.salpIndicators && recommendation.salpIndicators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> SALP Fidelity Indicators
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendation.salpIndicators.map((s, i) => (
              <div key={i} className="flex items-start gap-3" data-testid={`salp-${i}`}>
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{s.indicator}</p>
                  <p className="text-xs text-muted-foreground">{s.measurementMethod}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {recommendation.programStructure?.phases && recommendation.programStructure.phases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" /> Program Structure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendation.programStructure.phases.map((phase, i) => (
              <div key={i} className="relative" data-testid={`phase-${i}`}>
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary p-2.5 shrink-0">
                    <span className="text-primary-foreground font-bold text-xs">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-semibold text-sm">{phase.name}</h4>
                      <Badge variant="outline" className="text-xs">{phase.duration}</Badge>
                    </div>
                    <div className="space-y-1">
                      {phase.activities.map((act, j) => (
                        <div key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <ArrowRight className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {i < recommendation.programStructure!.phases.length - 1 && (
                  <div className="absolute left-4 top-10 bottom-0 w-px bg-border" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {recommendation.grantAlignments && recommendation.grantAlignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Grant Alignment Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendation.grantAlignments.map((g, i) => (
              <div key={i} className="p-3 rounded-md border" data-testid={`grant-alignment-${i}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                  <h4 className="font-semibold text-sm">{g.grantName}</h4>
                  <Badge variant={g.alignmentScore >= 80 ? "default" : "secondary"} className="text-xs">
                    {g.alignmentScore}% Match
                  </Badge>
                </div>
                <Progress value={g.alignmentScore} className="h-1.5 mb-2" />
                <div className="flex flex-wrap gap-1.5">
                  {g.keyAlignments?.map((a, j) => (
                    <Badge key={j} variant="outline" className="text-[10px]">{a}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        <Button variant="outline" onClick={onGenerate} data-testid="button-regenerate">
          <Sparkles className="mr-2 h-4 w-4" /> Regenerate Design
        </Button>
      </div>
    </div>
  );
}

function Step4Summary({
  problemDomain,
  customDomain,
  context,
  realities,
  recommendation,
  onSave,
  isSaving,
  savedDesign,
}: {
  problemDomain: string;
  customDomain: string;
  context: CommunityContext;
  realities: ThreeRealities;
  recommendation: AIRecommendation | null;
  onSave: (title: string) => void;
  isSaving: boolean;
  savedDesign: ProgramDesign | null;
}) {
  const domainLabel = PROBLEM_DOMAINS.find(d => d.id === problemDomain)?.label || customDomain || problemDomain;
  const [title, setTitle] = useState(recommendation?.title || `${domainLabel} Program`);

  useEffect(() => {
    if (recommendation?.title) setTitle(recommendation.title);
  }, [recommendation?.title]);

  return (
    <div className="space-y-6" data-testid="step-4-content">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
          <FileText className="h-5 w-5 text-primary" />
          Step 4: Program Summary
        </h2>
        <p className="text-sm text-muted-foreground">
          Review your complete program design and save it.
        </p>
      </div>

      <Card className="border-2 border-primary/20">
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Program Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for this program design"
              data-testid="input-program-title"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Problem Domain</p>
              <p className="text-sm" data-testid="text-summary-domain">{domainLabel}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Location</p>
              <p className="text-sm" data-testid="text-summary-location">{context.location || "Not specified"}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Target Population</p>
              <p className="text-sm" data-testid="text-summary-population">{context.population || "Not specified"}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Status</p>
              <Badge variant={savedDesign ? "default" : "secondary"} data-testid="badge-summary-status">
                {savedDesign ? "Saved" : "Draft"}
              </Badge>
            </div>
          </div>

          {(realities.research || realities.political || realities.ground) && (
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Three Realities</p>
              <div className="space-y-2 text-sm">
                {realities.research && (
                  <div>
                    <span className="font-medium">Research:</span>{" "}
                    <span className="text-muted-foreground">{realities.research}</span>
                  </div>
                )}
                {realities.political && (
                  <div>
                    <span className="font-medium">Political:</span>{" "}
                    <span className="text-muted-foreground">{realities.political}</span>
                  </div>
                )}
                {realities.ground && (
                  <div>
                    <span className="font-medium">Ground:</span>{" "}
                    <span className="text-muted-foreground">{realities.ground}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {recommendation?.disciplines && (
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Disciplines</p>
              <div className="flex flex-wrap gap-1.5">
                {recommendation.disciplines.map((d, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{d.name}</Badge>
                ))}
              </div>
            </div>
          )}

          {recommendation?.grantAlignments && (
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Grant Alignments</p>
              <div className="flex flex-wrap gap-1.5">
                {recommendation.grantAlignments.map((g, i) => (
                  <Badge key={i} variant="outline" className="text-xs border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300">
                    {g.grantName} ({g.alignmentScore}%)
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => onSave(title)} disabled={isSaving || !title.trim()} data-testid="button-save-design">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {savedDesign ? "Update Design" : "Save Program Design"}
        </Button>
        <Button variant="outline" data-testid="button-export-design" onClick={() => {
          const doc = [
            `# ${title}`,
            `## Program Design Document`,
            `**Generated:** ${new Date().toLocaleDateString()}`,
            `**Organization:** The Collaborative Advocate Foundation / ThriveUp Academy`,
            ``,
            `## Problem Domain`,
            domainLabel,
            ``,
            `## Community Context`,
            `- **Location:** ${context.location || "Not specified"}`,
            `- **Target Population:** ${context.population || "Not specified"}`,
            `- **Community Assets:** ${context.assets || "Not specified"}`,
            `- **Barriers:** ${context.barriers || "Not specified"}`,
            ``,
            `## Three Realities Assessment`,
            realities.research ? `- **Research Reality:** ${realities.research}` : "",
            realities.political ? `- **Political Reality:** ${realities.political}` : "",
            realities.ground ? `- **Ground Reality:** ${realities.ground}` : "",
            ``,
            recommendation ? `## AI-Generated Program Design` : "",
            recommendation?.disciplines ? `### Academic Disciplines\n${recommendation.disciplines.map(d => `- **${d.name}:** ${d.role}`).join("\n")}` : "",
            recommendation?.programStructure?.phases ? `### Program Structure\n${recommendation.programStructure.phases.map(p => `#### ${p.name} (${p.duration})\n${p.activities.map(a => `- ${a}`).join("\n")}`).join("\n\n")}` : "",
            recommendation?.stakeholders ? `### Key Stakeholders\n${recommendation.stakeholders.map(s => `- **${s.type}:** ${s.role}`).join("\n")}` : "",
            recommendation?.salpIndicators ? `### SALP Indicators\n${recommendation.salpIndicators.map(s => `- **${s.indicator}:** ${s.measurementMethod}`).join("\n")}` : "",
            recommendation?.grantAlignments ? `### Grant Alignments\n${recommendation.grantAlignments.map(g => `- **${g.grantName}:** ${g.alignmentScore}% alignment\n  Key alignments: ${(g.keyAlignments || []).join(", ")}`).join("\n")}` : "",
            recommendation?.platforms ? `### Ecosystem Platform Integration\n${recommendation.platforms.map(p => `- **${p.name}:** ${p.purpose}`).join("\n")}` : "",
          ].filter(Boolean).join("\n");

          const blob = new Blob([doc], { type: "text/markdown" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-program-design.md`;
          a.click();
          URL.revokeObjectURL(url);
        }}>
          <Download className="mr-2 h-4 w-4" /> Export Document
        </Button>
        <Link href="/grants">
          <Button variant="outline" data-testid="button-to-grants">
            <Target className="mr-2 h-4 w-4" /> Find Matching Grants
          </Button>
        </Link>
        <Link href="/cqi">
          <Button variant="outline" data-testid="button-to-cqi">
            <BarChart3 className="mr-2 h-4 w-4" /> MAP-GAP CQI
          </Button>
        </Link>
      </div>

      {savedDesign && (
        <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300" data-testid="text-save-confirmation">
                Program design saved successfully!
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                ID: {savedDesign.id}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ProgramDesignerPage() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [problemDomain, setProblemDomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [communityContext, setCommunityContext] = useState<CommunityContext>({
    location: "", population: "", assets: "", barriers: "",
  });
  const [threeRealities, setThreeRealities] = useState<ThreeRealities>({
    research: "", political: "", ground: "",
  });
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedDesign, setSavedDesign] = useState<ProgramDesign | null>(null);

  useEffect(() => {
    document.title = "Program Designer — MAP-GAP Wizard | ThriveUp Academy";
  }, []);

  const saveMutation = useMutation({
    mutationFn: async (title: string) => {
      const body = {
        title,
        problemDomain: problemDomain || customDomain,
        threeRealities,
        communityContext,
        recommendations: recommendation,
        grantAlignments: recommendation?.grantAlignments || null,
        status: "draft",
      };
      if (savedDesign) {
        const res = await apiRequest("PATCH", `/api/program-designs/${savedDesign.id}`, body);
        return res.json();
      }
      const res = await apiRequest("POST", "/api/program-designs", body);
      return res.json();
    },
    onSuccess: (data) => {
      setSavedDesign(data);
      queryClient.invalidateQueries({ queryKey: ["/api/program-designs"] });
      toast({ title: "Saved", description: "Program design saved successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    setRecommendation(null);
    try {
      const res = await apiRequest("POST", "/api/program-designs/generate-recommendation", {
        problemDomain: problemDomain || customDomain,
        communityContext,
        threeRealities,
      });
      const data = await res.json();
      setRecommendation(data);
    } catch (err: any) {
      toast({ title: "Generation Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const canProceed = (s: number) => {
    if (s === 1) return !!(problemDomain || customDomain.trim());
    if (s === 2) return !!(communityContext.location.trim());
    if (s === 3) return !!recommendation;
    return true;
  };

  const handleNext = () => {
    if (step === 2 && !recommendation) {
      setStep(3);
      handleGenerate();
    } else {
      setStep(Math.min(step + 1, 4));
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6" data-testid="page-program-designer">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <Lightbulb className="h-6 w-6 text-primary" />
          MAP-GAP Program Designer
        </h1>
        <p className="text-muted-foreground mt-1" data-testid="text-page-subtitle">
          Design community intervention programs using the MAP-GAP framework — problem-first, evidence-based, adapted through the Three Realities.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <StepIndicator currentStep={step} />
          <Progress value={(step / 4) * 100} className="h-1.5 mb-6" />

          {step === 1 && (
            <Step1ProblemDomain
              selected={problemDomain}
              onSelect={setProblemDomain}
              customDomain={customDomain}
              onCustomChange={setCustomDomain}
            />
          )}
          {step === 2 && (
            <Step2CommunityContext
              context={communityContext}
              onContextChange={setCommunityContext}
              realities={threeRealities}
              onRealitiesChange={setThreeRealities}
            />
          )}
          {step === 3 && (
            <Step3AIDesign
              recommendation={recommendation}
              isLoading={isGenerating}
              onGenerate={handleGenerate}
            />
          )}
          {step === 4 && (
            <Step4Summary
              problemDomain={problemDomain}
              customDomain={customDomain}
              context={communityContext}
              realities={threeRealities}
              recommendation={recommendation}
              onSave={(title) => saveMutation.mutate(title)}
              isSaving={saveMutation.isPending}
              savedDesign={savedDesign}
            />
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(step - 1, 1))}
              disabled={step === 1}
              data-testid="button-prev-step"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <div className="text-sm text-muted-foreground" data-testid="text-step-counter">
              Step {step} of 4
            </div>
            {step < 4 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed(step)}
                data-testid="button-next-step"
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setStep(1);
                  setProblemDomain("");
                  setCustomDomain("");
                  setCommunityContext({ location: "", population: "", assets: "", barriers: "" });
                  setThreeRealities({ research: "", political: "", ground: "" });
                  setRecommendation(null);
                  setSavedDesign(null);
                }}
                variant="outline"
                data-testid="button-new-design"
              >
                <Zap className="mr-2 h-4 w-4" /> New Design
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}