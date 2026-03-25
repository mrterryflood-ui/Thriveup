import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { TrainingGuideButton } from "@/components/training-guide";
import {
  BookOpen, FlaskConical, Target, BarChart3, Users, Globe,
  CheckCircle2, ChevronRight, ExternalLink, Lightbulb, Brain,
  FileText, ArrowRight, Shield, Activity, Layers, Microscope,
  GraduationCap, Network, Sparkles, ClipboardCheck, TrendingUp,
  AlertTriangle, Info, Star, Compass, BookMarked,
} from "lucide-react";

const RE_AIM_DOMAINS = [
  {
    id: "reach",
    name: "Reach",
    icon: Users,
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    description: "The absolute number, proportion, and representativeness of individuals willing to participate in a given initiative.",
    questions: [
      { id: "r1", text: "What percentage of your target population is this program designed to reach?", options: ["<25%", "25-50%", "50-75%", ">75%"], scores: [1, 2, 3, 4] },
      { id: "r2", text: "How representative is your participant sample of the broader target population?", options: ["Not representative", "Somewhat", "Mostly", "Highly representative"], scores: [1, 2, 3, 4] },
      { id: "r3", text: "What strategies do you use to ensure equitable access?", options: ["None", "Basic outreach", "Targeted recruitment", "Multi-strategy equity plan"], scores: [1, 2, 3, 4] },
      { id: "r4", text: "How do you track participation rates across demographic groups?", options: ["Don't track", "Basic counts", "Disaggregated data", "Real-time dashboards"], scores: [1, 2, 3, 4] },
    ],
  },
  {
    id: "effectiveness",
    name: "Effectiveness",
    icon: Target,
    color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    description: "The impact of an intervention on important outcomes, including potential negative effects, quality of life, and economic outcomes.",
    questions: [
      { id: "e1", text: "What is the evidence level for your primary intervention?", options: ["Anecdotal", "Promising", "Evidence-informed", "Evidence-based (RCT)"], scores: [1, 2, 3, 4] },
      { id: "e2", text: "How do you measure primary outcomes?", options: ["Not measured", "Self-report only", "Validated instruments", "Multi-method triangulation"], scores: [1, 2, 3, 4] },
      { id: "e3", text: "Do you assess unintended consequences or negative effects?", options: ["Never", "Informally", "Periodically", "Systematically"], scores: [1, 2, 3, 4] },
      { id: "e4", text: "How do you assess quality of life or broader wellbeing impacts?", options: ["Not assessed", "Single measure", "Multiple domains", "Comprehensive framework"], scores: [1, 2, 3, 4] },
    ],
  },
  {
    id: "adoption",
    name: "Adoption",
    icon: Globe,
    color: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
    description: "The absolute number, proportion, and representativeness of settings and intervention agents willing to initiate a program.",
    questions: [
      { id: "a1", text: "How many settings/organizations have adopted this program?", options: ["1 site", "2-5 sites", "6-15 sites", ">15 sites"], scores: [1, 2, 3, 4] },
      { id: "a2", text: "What proportion of approached settings agreed to participate?", options: ["<25%", "25-50%", "50-75%", ">75%"], scores: [1, 2, 3, 4] },
      { id: "a3", text: "How well do participating settings represent the range of target settings?", options: ["Low diversity", "Some diversity", "Good diversity", "Highly representative"], scores: [1, 2, 3, 4] },
      { id: "a4", text: "What organizational supports exist for implementation?", options: ["None", "Basic training", "Training + coaching", "Comprehensive system"], scores: [1, 2, 3, 4] },
    ],
  },
  {
    id: "implementation",
    name: "Implementation",
    icon: ClipboardCheck,
    color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    description: "The intervention agents' fidelity to the various elements of an intervention's protocol, including consistency of delivery and adaptations made.",
    questions: [
      { id: "i1", text: "How do you assess implementation fidelity?", options: ["Not assessed", "Self-report", "Observation checklist", "Multi-rater validated tool"], scores: [1, 2, 3, 4] },
      { id: "i2", text: "What is the average fidelity score across implementing sites?", options: ["<50%", "50-70%", "70-85%", ">85%"], scores: [1, 2, 3, 4] },
      { id: "i3", text: "How are adaptations documented and evaluated?", options: ["Not documented", "Informal notes", "Structured log", "Adaptation framework"], scores: [1, 2, 3, 4] },
      { id: "i4", text: "What is the cost per participant for implementation?", options: ["Unknown", "Estimated", "Tracked", "Cost-effectiveness analyzed"], scores: [1, 2, 3, 4] },
    ],
  },
  {
    id: "maintenance",
    name: "Maintenance",
    icon: TrendingUp,
    color: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
    description: "The extent to which a program becomes institutionalized or part of routine organizational practices and policies.",
    questions: [
      { id: "m1", text: "How long has the program been sustained at implementing sites?", options: ["<6 months", "6-12 months", "1-3 years", ">3 years"], scores: [1, 2, 3, 4] },
      { id: "m2", text: "Is the program embedded in organizational policy or routine?", options: ["No", "Partially", "Mostly", "Fully institutionalized"], scores: [1, 2, 3, 4] },
      { id: "m3", text: "Are long-term participant outcomes tracked?", options: ["No follow-up", "6-month", "12-month", "Multi-year longitudinal"], scores: [1, 2, 3, 4] },
      { id: "m4", text: "What sustainability planning has occurred?", options: ["None", "Informal", "Written plan", "Funded sustainability model"], scores: [1, 2, 3, 4] },
    ],
  },
];

const CFIR_DOMAINS = [
  { id: "intervention", name: "Intervention Characteristics", description: "Key attributes of the intervention being implemented including evidence strength, adaptability, complexity, and relative advantage.", icon: FlaskConical, color: "text-blue-600 dark:text-blue-400" },
  { id: "outer_setting", name: "Outer Setting", description: "The economic, political, and social context within which an organization resides. Includes patient needs, external policies, and peer pressure.", icon: Globe, color: "text-emerald-600 dark:text-emerald-400" },
  { id: "inner_setting", name: "Inner Setting", description: "Structural, political, and cultural contexts through which the implementation process will proceed. Includes networks, culture, and implementation climate.", icon: Layers, color: "text-violet-600 dark:text-violet-400" },
  { id: "individuals", name: "Characteristics of Individuals", description: "Knowledge, beliefs, self-efficacy, and stages of change of the individuals involved in implementing the intervention.", icon: Users, color: "text-amber-600 dark:text-amber-400" },
  { id: "process", name: "Implementation Process", description: "The activities and strategies used to implement the intervention including planning, engaging, executing, and reflecting/evaluating.", icon: Activity, color: "text-rose-600 dark:text-rose-400" },
];

const RESEARCH_LIBRARY = [
  { title: "SPF (Strategic Prevention Framework)", org: "SAMHSA", url: "https://www.samhsa.gov/resource/ebp/strategic-prevention-framework-spf", desc: "Five-step framework for community prevention: Assessment, Capacity, Planning, Implementation, Evaluation.", category: "Prevention" },
  { title: "RE-AIM Framework", org: "RE-AIM.org", url: "https://re-aim.org/", desc: "Framework for evaluating public health interventions across Reach, Effectiveness, Adoption, Implementation, Maintenance.", category: "Evaluation" },
  { title: "CFIR Research Guide", org: "CFIR Research Team", url: "https://cfirguide.org/", desc: "Comprehensive guide to the Consolidated Framework for Implementation Research with constructs, tools, and examples.", category: "Implementation" },
  { title: "NREPP (Evidence-Based Programs)", org: "SAMHSA", url: "https://www.samhsa.gov/resource-search/ebp", desc: "Registry of evidence-based programs and practices for behavioral health.", category: "Programs" },
  { title: "Communities That Care", org: "University of Washington", url: "https://www.communitiesthatcare.net/", desc: "Science-based prevention system that helps communities prevent youth problem behaviors.", category: "Prevention" },
  { title: "Implementation Science Journal", org: "BMC", url: "https://implementationscience.biomedcentral.com/", desc: "Open access journal publishing research on methods to promote the uptake of evidence into practice.", category: "Research" },
  { title: "Global Implementation Conference", org: "GIC", url: "https://gic.globalimplementation.org/", desc: "Leading conference for implementation science practitioners, researchers, and policymakers.", category: "Research" },
  { title: "NIRN Active Implementation Frameworks", org: "NIRN", url: "https://nirn.fpg.unc.edu/", desc: "National Implementation Research Network — science-based implementation frameworks and tools.", category: "Implementation" },
  { title: "CDC Evidence-Based Prevention", org: "CDC", url: "https://www.cdc.gov/substance-use-prevention/php/evidence-based-resources/index.html", desc: "CDC-recognized strategies and programs for substance use prevention.", category: "Prevention" },
  { title: "Dissemination & Implementation Models", org: "University of Washington", url: "https://dissemination-implementation.org/", desc: "Searchable repository of D&I models, theories, and frameworks.", category: "Dissemination" },
  { title: "PCORI Engagement Guide", org: "PCORI", url: "https://www.pcori.org/engagement", desc: "Tools and rubrics for meaningful community and stakeholder engagement in research.", category: "Engagement" },
  { title: "Health Equity Implementation Framework", org: "Various", url: "https://implementationscience.biomedcentral.com/articles/10.1186/s13012-019-0861-y", desc: "Framework integrating health equity determinants into CFIR implementation processes.", category: "Equity" },
];

const TRANSLATION_STEPS = [
  { step: 1, title: "Identify the Evidence", desc: "Select research findings, systematic reviews, or evidence-based practices to translate.", icon: Microscope },
  { step: 2, title: "Assess Fit & Context", desc: "Evaluate how the evidence fits your community context using CFIR and equity lenses.", icon: Compass },
  { step: 3, title: "Adapt with Fidelity", desc: "Make culturally responsive adaptations while preserving core components.", icon: FlaskConical },
  { step: 4, title: "Plan Implementation", desc: "Develop an implementation plan with stakeholder engagement, training, and support systems.", icon: ClipboardCheck },
  { step: 5, title: "Execute & Monitor", desc: "Implement with real-time fidelity monitoring and continuous quality improvement.", icon: Activity },
  { step: 6, title: "Evaluate & Disseminate", desc: "Measure outcomes using RE-AIM, document learnings, and share findings.", icon: BarChart3 },
];

function ReAimTool() {
  const [activeReAim, setActiveReAim] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (questionId: string, score: number) => {
    setResponses({ ...responses, [questionId]: score });
  };

  const calculateDomainScore = (domainId: string) => {
    const domain = RE_AIM_DOMAINS.find(d => d.id === domainId);
    if (!domain) return 0;
    const answered = domain.questions.filter(q => responses[q.id] !== undefined);
    if (answered.length === 0) return 0;
    const total = answered.reduce((sum, q) => sum + (responses[q.id] || 0), 0);
    return Math.round((total / (answered.length * 4)) * 100);
  };

  const allAnswered = RE_AIM_DOMAINS.every(d =>
    d.questions.every(q => responses[q.id] !== undefined)
  );

  if (showResults) {
    return (
      <div className="space-y-6" data-testid="section-reaim-results">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">RE-AIM Evaluation Results</h3>
          <Button variant="outline" size="sm" onClick={() => { setShowResults(false); setResponses({}); }} data-testid="button-reset-reaim">
            New Evaluation
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {RE_AIM_DOMAINS.map(domain => {
            const score = calculateDomainScore(domain.id);
            const Icon = domain.icon;
            return (
              <Card key={domain.id} className="p-4 text-center" data-testid={`card-reaim-score-${domain.id}`}>
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${domain.color} mb-2`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold">{score}%</p>
                <p className="text-xs text-muted-foreground">{domain.name}</p>
                <Progress value={score} className="h-1.5 mt-2" />
              </Card>
            );
          })}
        </div>
        <Card className="p-5" data-testid="card-reaim-composite">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Composite RE-AIM Score</h4>
            <span className="text-2xl font-bold">
              {Math.round(RE_AIM_DOMAINS.reduce((sum, d) => sum + calculateDomainScore(d.id), 0) / 5)}%
            </span>
          </div>
          <Progress value={Math.round(RE_AIM_DOMAINS.reduce((sum, d) => sum + calculateDomainScore(d.id), 0) / 5)} className="h-3" />
          <div className="mt-4 space-y-2">
            {RE_AIM_DOMAINS.map(d => {
              const score = calculateDomainScore(d.id);
              if (score < 50) {
                return (
                  <div key={d.id} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <span><strong>{d.name}</strong> scored below 50% — consider strengthening strategies in this area.</span>
                  </div>
                );
              }
              return null;
            }).filter(Boolean)}
          </div>
        </Card>
      </div>
    );
  }

  if (activeReAim) {
    const domain = RE_AIM_DOMAINS.find(d => d.id === activeReAim)!;
    const Icon = domain.icon;
    return (
      <div className="space-y-4" data-testid={`section-reaim-${activeReAim}`}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setActiveReAim(null)} data-testid="button-back-reaim">
            ← Back
          </Button>
          <div className={`rounded-md p-2 ${domain.color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">{domain.name}</h3>
            <p className="text-xs text-muted-foreground">{domain.description}</p>
          </div>
        </div>
        <div className="space-y-4">
          {domain.questions.map((q, qi) => (
            <Card key={q.id} className="p-4" data-testid={`card-reaim-question-${q.id}`}>
              <p className="text-sm font-medium mb-3">{q.text}</p>
              <div className="grid grid-cols-2 gap-2">
                {q.options.map((opt, oi) => (
                  <Button
                    key={oi}
                    variant={responses[q.id] === q.scores[oi] ? "default" : "outline"}
                    className="text-left h-auto py-2 px-3 text-sm"
                    onClick={() => handleAnswer(q.id, q.scores[oi])}
                    data-testid={`button-reaim-option-${q.id}-${oi}`}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        The RE-AIM framework evaluates programs across five dimensions. Complete each domain to generate your program evaluation.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {RE_AIM_DOMAINS.map(domain => {
          const Icon = domain.icon;
          const score = calculateDomainScore(domain.id);
          const answered = domain.questions.filter(q => responses[q.id] !== undefined).length;
          return (
            <Card
              key={domain.id}
              className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setActiveReAim(domain.id)}
              data-testid={`card-reaim-domain-${domain.id}`}
            >
              <div className="flex items-start gap-3 mb-2">
                <div className={`rounded-md p-2 ${domain.color} shrink-0`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">{domain.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{domain.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-muted-foreground">{answered}/{domain.questions.length} answered</span>
                {answered > 0 && <Badge variant="secondary" className="text-[10px]">{score}%</Badge>}
              </div>
              {answered > 0 && <Progress value={score} className="h-1 mt-2" />}
            </Card>
          );
        })}
      </div>
      {allAnswered && (
        <div className="flex justify-center pt-4">
          <Button onClick={() => setShowResults(true)} data-testid="button-view-reaim-results">
            View RE-AIM Results <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

function CfirExplorer() {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  const CFIR_CONSTRUCTS: Record<string, Array<{ name: string; description: string; rating: string }>> = {
    intervention: [
      { name: "Evidence Strength & Quality", description: "Stakeholders' perceptions of the quality and validity of evidence supporting the belief that the intervention will have desired outcomes.", rating: "How strong is the empirical evidence base?" },
      { name: "Adaptability", description: "The degree to which an intervention can be adapted, tailored, refined, or reinvented to meet local needs.", rating: "Can the program be modified while maintaining fidelity?" },
      { name: "Trialability", description: "The ability to test the intervention on a small scale in the organization and reverse course if warranted.", rating: "Can you pilot before full rollout?" },
      { name: "Complexity", description: "Perceived difficulty of the intervention, reflected by duration, scope, radicalness, disruptiveness, intricacy, and number of steps.", rating: "How complex is implementation?" },
      { name: "Design Quality & Packaging", description: "Perceived excellence in how the intervention is bundled, presented, and assembled.", rating: "Is the program well-designed and packaged for use?" },
      { name: "Cost", description: "Costs of the intervention implementation including investment, supply, and opportunity costs.", rating: "What is the total cost of implementation?" },
    ],
    outer_setting: [
      { name: "Patient Needs & Resources", description: "The extent to which patient/client needs are accurately known and prioritized by the organization.", rating: "How well do you understand community needs?" },
      { name: "Cosmopolitanism", description: "The degree to which an organization is networked with other external organizations.", rating: "How connected is your organization externally?" },
      { name: "Peer Pressure", description: "Mimetic or competitive pressure to implement an intervention.", rating: "Are peer organizations implementing similar programs?" },
      { name: "External Policies & Incentives", description: "External strategies to spread interventions, including policy/regulations, guidelines, mandates, and financial incentives.", rating: "What external policies support implementation?" },
    ],
    inner_setting: [
      { name: "Structural Characteristics", description: "The social architecture, age, maturity, and size of an organization.", rating: "Is the organizational structure supportive?" },
      { name: "Networks & Communications", description: "The nature and quality of social networks and formal/informal communications within an organization.", rating: "How effective are internal communications?" },
      { name: "Culture", description: "Norms, values, and basic assumptions of a given organization.", rating: "Does the culture support innovation and change?" },
      { name: "Implementation Climate", description: "The absorptive capacity for change, shared receptivity, and the extent to which use of the intervention will be rewarded and supported.", rating: "Is the climate ready for this change?" },
      { name: "Readiness for Implementation", description: "Tangible, immediate indicators of organizational commitment to implementation including leadership engagement, available resources, and access to knowledge/information.", rating: "Are resources and leadership support available?" },
    ],
    individuals: [
      { name: "Knowledge & Beliefs", description: "Individuals' attitudes toward and value placed on the intervention, as well as familiarity with facts, truths, and principles.", rating: "Do staff understand and believe in the program?" },
      { name: "Self-Efficacy", description: "Individual belief in their own capabilities to execute courses of action to achieve implementation goals.", rating: "Do implementers feel capable of delivering the program?" },
      { name: "Individual Stage of Change", description: "Characterization of the phase an individual is in as they progress toward sustained use of the intervention.", rating: "Where are individuals in their readiness to change?" },
      { name: "Individual Identification with Organization", description: "How individuals perceive the organization and their relationship with that organization.", rating: "Do staff identify with the organization's mission?" },
      { name: "Other Personal Attributes", description: "Other characteristics including tolerance of ambiguity, intellectual ability, motivation, values, competence, capacity, innovation, and learning style.", rating: "What other individual factors affect implementation?" },
    ],
    process: [
      { name: "Planning", description: "The degree to which a scheme or method of behavior and tasks for implementing an intervention are developed in advance.", rating: "How thorough is the implementation plan?" },
      { name: "Engaging", description: "Attracting and involving appropriate individuals in the implementation and use of the intervention.", rating: "Are key stakeholders effectively engaged?" },
      { name: "Executing", description: "Carrying out or accomplishing the implementation according to plan.", rating: "How well is the plan being executed?" },
      { name: "Reflecting & Evaluating", description: "Quantitative and qualitative feedback about the progress and quality of implementation, including regular debriefing.", rating: "Is there systematic reflection and evaluation?" },
    ],
  };

  return (
    <div className="space-y-6" data-testid="section-cfir-explorer">
      <p className="text-sm text-muted-foreground">
        Explore the five CFIR domains to understand implementation determinants. Use these constructs to assess your organization's readiness and identify barriers.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CFIR_DOMAINS.map(domain => {
          const Icon = domain.icon;
          const constructs = CFIR_CONSTRUCTS[domain.id] || [];
          const isSelected = selectedDomain === domain.id;
          return (
            <Card
              key={domain.id}
              className={`p-4 cursor-pointer transition-colors ${isSelected ? "border-primary" : "hover:border-primary/50"}`}
              onClick={() => setSelectedDomain(isSelected ? null : domain.id)}
              data-testid={`card-cfir-domain-${domain.id}`}
            >
              <div className="flex items-start gap-3 mb-2">
                <Icon className={`h-5 w-5 ${domain.color} shrink-0`} />
                <div>
                  <h4 className="font-semibold text-sm">{domain.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{domain.description}</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-[10px] mt-2">{constructs.length} constructs</Badge>
            </Card>
          );
        })}
      </div>

      {selectedDomain && CFIR_CONSTRUCTS[selectedDomain] && (
        <div className="space-y-3" data-testid={`section-cfir-constructs-${selectedDomain}`}>
          <h3 className="font-semibold flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            {CFIR_DOMAINS.find(d => d.id === selectedDomain)?.name} — Constructs
          </h3>
          {CFIR_CONSTRUCTS[selectedDomain].map((construct, i) => (
            <Card key={i} className="p-4" data-testid={`card-cfir-construct-${i}`}>
              <h4 className="font-semibold text-sm mb-1">{construct.name}</h4>
              <p className="text-xs text-muted-foreground mb-2">{construct.description}</p>
              <div className="flex items-center gap-2 text-xs">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-muted-foreground italic">{construct.rating}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TranslationPipeline() {
  return (
    <div className="space-y-6" data-testid="section-translation-pipeline">
      <p className="text-sm text-muted-foreground">
        The Research-to-Practice Translation Pipeline guides the systematic process of moving evidence into community implementation.
      </p>
      <div className="space-y-4">
        {TRANSLATION_STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.step} className="flex gap-4" data-testid={`card-translation-step-${step.step}`}>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{step.step}</span>
                </div>
                {i < TRANSLATION_STEPS.length - 1 && (
                  <div className="w-0.5 flex-1 bg-indigo-200 dark:bg-indigo-800 my-1" />
                )}
              </div>
              <Card className="flex-1 p-4 mb-2">
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">{step.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      <Card className="p-5 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30" data-testid="card-mapgap-methodology">
        <div className="flex items-start gap-3">
          <div className="rounded-md p-2 bg-indigo-100 dark:bg-indigo-900/30 shrink-0">
            <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">MAP-GAP Methodology Integration</h4>
            <p className="text-xs text-muted-foreground mb-2">
              ThriveUp's proprietary MAP-GAP (Measure, Analyze, Plan — Gap Analysis Protocol) methodology integrates with standard implementation science frameworks to provide continuous quality improvement throughout the translation pipeline.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-[10px]">Continuous Monitoring</Badge>
              <Badge variant="secondary" className="text-[10px]">Gap Identification</Badge>
              <Badge variant="secondary" className="text-[10px]">Action Planning</Badge>
              <Badge variant="secondary" className="text-[10px]">Fidelity Tracking</Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function ResearchHubPage() {
  useEffect(() => { document.title = "Research & Implementation Science Hub | ThriveUp"; }, []);
  const [activeTab, setActiveTab] = useState("overview");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredLibrary = categoryFilter === "all"
    ? RESEARCH_LIBRARY
    : RESEARCH_LIBRARY.filter(r => r.category === categoryFilter);

  const categories = Array.from(new Set(RESEARCH_LIBRARY.map(r => r.category)));

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto" data-testid="research-hub-page">
      <PageHeader title="Research & Implementation Science" breadcrumbs={[{ label: "Research Hub" }]} actions={<TrainingGuideButton moduleId="research-hub" />} />

      <div className="rounded-md bg-gradient-to-r from-indigo-900 to-violet-700 p-4 sm:p-6 lg:p-8 mb-8" data-testid="section-hero">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="rounded-md p-2.5 bg-white/10">
            <Microscope className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white" data-testid="text-page-title">
            Research & Implementation Science Hub
          </h1>
        </div>
        <p className="text-indigo-100 text-base sm:text-lg" data-testid="text-page-subtitle">
          Tools for implementation scientists, researchers, public health professionals, and community health workers to evaluate, translate, and sustain evidence-based practices
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-6 flex-wrap" data-testid="tabs-research">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="reaim" data-testid="tab-reaim">RE-AIM Tool</TabsTrigger>
          <TabsTrigger value="cfir" data-testid="tab-cfir">CFIR Explorer</TabsTrigger>
          <TabsTrigger value="translation" data-testid="tab-translation">Translation Pipeline</TabsTrigger>
          <TabsTrigger value="library" data-testid="tab-library">Research Library</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="section-overview-cards">
              <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab("reaim")} data-testid="card-goto-reaim">
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-md p-2 bg-blue-100 dark:bg-blue-900/30">
                    <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-sm">RE-AIM Evaluation</h3>
                </div>
                <p className="text-xs text-muted-foreground">Interactive tool to evaluate programs across Reach, Effectiveness, Adoption, Implementation, and Maintenance.</p>
              </Card>
              <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab("cfir")} data-testid="card-goto-cfir">
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-md p-2 bg-violet-100 dark:bg-violet-900/30">
                    <Layers className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <h3 className="font-semibold text-sm">CFIR Explorer</h3>
                </div>
                <p className="text-xs text-muted-foreground">Navigate the Consolidated Framework for Implementation Research — 5 domains, 39 constructs.</p>
              </Card>
              <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab("translation")} data-testid="card-goto-translation">
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-md p-2 bg-emerald-100 dark:bg-emerald-900/30">
                    <ArrowRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-sm">Translation Pipeline</h3>
                </div>
                <p className="text-xs text-muted-foreground">Research-to-practice framework for moving evidence into community implementation.</p>
              </Card>
              <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab("library")} data-testid="card-goto-library">
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-md p-2 bg-amber-100 dark:bg-amber-900/30">
                    <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-sm">Research Library</h3>
                </div>
                <p className="text-xs text-muted-foreground">Curated collection of implementation science frameworks, journals, and toolkits.</p>
              </Card>
            </div>

            <Card className="p-5" data-testid="card-who-is-this-for">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" /> Who Is This Hub For?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: "Implementation Scientists", desc: "Evaluate and optimize program translation from research to practice using validated frameworks.", icon: FlaskConical },
                  { title: "Public Health Professionals", desc: "Design community-level interventions grounded in evidence and equity principles.", icon: Shield },
                  { title: "Community Health Workers", desc: "Access practical tools and resources for frontline health promotion and navigation.", icon: Users },
                  { title: "Program Evaluators", desc: "Use RE-AIM and CFIR tools to systematically assess program quality and impact.", icon: BarChart3 },
                  { title: "Grant Writers & Researchers", desc: "Reference validated frameworks and evidence registries for proposals and publications.", icon: FileText },
                  { title: "Prevention Coordinators", desc: "Select, adapt, and monitor evidence-based prevention programs for your community.", icon: Shield },
                ].map((role, i) => {
                  const Icon = role.icon;
                  return (
                    <div key={i} className="flex items-start gap-3" data-testid={`text-role-${i}`}>
                      <Icon className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{role.title}</p>
                        <p className="text-xs text-muted-foreground">{role.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-5" data-testid="card-frameworks-overview">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <BookMarked className="h-4 w-4 text-muted-foreground" /> Frameworks & Methodologies
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "RE-AIM", desc: "Reach, Effectiveness, Adoption, Implementation, Maintenance — public health planning and evaluation.", badge: "Evaluation" },
                  { name: "CFIR", desc: "Consolidated Framework for Implementation Research — 5 domains, 39 constructs for understanding implementation.", badge: "Implementation" },
                  { name: "SPF", desc: "SAMHSA's Strategic Prevention Framework — Assessment, Capacity, Planning, Implementation, Evaluation.", badge: "Prevention" },
                  { name: "MAP-GAP", desc: "ThriveUp's proprietary Measure-Analyze-Plan Gap Analysis Protocol for continuous quality improvement.", badge: "CQI" },
                  { name: "SALP", desc: "Strategic Alignment & Leverage Protocol — aligning program activities with evidence-based outcomes.", badge: "Strategy" },
                  { name: "Three Realities", desc: "Understanding how perception, experience, and systemic factors shape individual and community outcomes.", badge: "Equity" },
                ].map((fw, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-muted/30" data-testid={`text-framework-${i}`}>
                    <Star className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{fw.name}</p>
                        <Badge variant="secondary" className="text-[10px]">{fw.badge}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{fw.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reaim">
          <ReAimTool />
        </TabsContent>

        <TabsContent value="cfir">
          <CfirExplorer />
        </TabsContent>

        <TabsContent value="translation">
          <TranslationPipeline />
        </TabsContent>

        <TabsContent value="library">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-44" data-testid="select-category-filter">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">{filteredLibrary.length} resources</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="section-library-grid">
              {filteredLibrary.map((resource, i) => (
                <Card key={i} className="p-4" data-testid={`card-library-${i}`}>
                  <div className="flex items-start gap-3">
                    <div className="rounded-md p-2 bg-indigo-100 dark:bg-indigo-900/30 shrink-0">
                      <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">{resource.title}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{resource.org}</p>
                      <p className="text-xs text-muted-foreground mt-1">{resource.desc}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px]">{resource.category}</Badge>
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400" data-testid={`link-library-${i}`}>
                          Visit <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
