import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  Shield, ArrowRight, CheckCircle2, BarChart3, FileText,
  Users, Lock, Globe, Briefcase, Heart, Target, Building2,
  Clock, MapPin, Phone, Mail, BookOpen, TrendingUp,
  AlertTriangle, Activity, Award, Layers
} from "lucide-react";

type TabId = "overview" | "reentry-model" | "integration" | "outcomes" | "partners";

const VALUE_PROPS = [
  {
    icon: Target,
    title: "Individualized Reentry Plans",
    desc: "Phase-based plans (Pre-Release through Independence) with automated milestone tracking tied to evidence-based outcomes.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Progress Monitoring",
    desc: "Thrive analytics track six domains of wellbeing with configurable alert thresholds and early warning systems.",
  },
  {
    icon: FileText,
    title: "Court-Ready Reporting",
    desc: "Timestamped, exportable progress reports with milestone completion evidence suitable for court and probation review.",
  },
  {
    icon: Lock,
    title: "Secure API Integration",
    desc: "RESTful API endpoints for bidirectional data exchange. Receive referrals, send progress updates, track supervision compliance.",
  },
  {
    icon: Users,
    title: "Community Partner Network",
    desc: "Coordinated referral workflows with verified community partners. MOU tracking, service completion rates, and impact measurement.",
  },
  {
    icon: Shield,
    title: "DOJ-Aligned Outcome Tracking",
    desc: "Recidivism monitoring at 6/12/36 months, employment retention, education enrollment, housing stability, and behavioral health outcomes.",
  },
];

const INTEGRATION_ENDPOINTS = [
  { method: "POST", path: "/api/external/justice/referrals", desc: "Submit youth referral with demographics, release date, and supervision requirements" },
  { method: "GET", path: "/api/external/justice/referrals/:id/progress", desc: "Retrieve real-time progress including milestones, compliance, and plan status" },
  { method: "GET", path: "/api/external/justice/referrals/:id/report", desc: "Generate court-ready progress report with timestamped evidence" },
  { method: "GET", path: "/api/external/justice/health", desc: "Check API health status and available endpoints" },
];

const REENTRY_PHASES = [
  {
    phase: "Phase 1: Pre-Release",
    duration: "30-90 days before release",
    color: "bg-blue-500",
    activities: [
      "Risk/needs assessment (SAVRY, LSI-R)",
      "Individualized reentry plan development",
      "Family engagement and reunification planning",
      "Education and vocational interest assessment",
      "Behavioral health screening (PHQ-9, GAD-7)",
      "Community mentor matching",
    ],
    milestones: ["Assessment complete", "Plan approved", "Mentor assigned", "Family conference held"],
  },
  {
    phase: "Phase 2: Transition",
    duration: "Release day through 30 days",
    color: "bg-violet-500",
    activities: [
      "Warm handoff to community-based services",
      "Housing verification and stability check",
      "School enrollment or workforce registration",
      "Behavioral health service connection",
      "Supervision compliance orientation",
      "Emergency resource package distribution",
    ],
    milestones: ["Housing secured", "Enrolled in school/program", "First mentor meeting", "Compliance orientation complete"],
  },
  {
    phase: "Phase 3: Stabilization",
    duration: "30-180 days post-release",
    color: "bg-emerald-500",
    activities: [
      "Weekly check-ins with case manager",
      "Continued education/workforce participation",
      "Pro-social activity engagement tracking",
      "Behavioral health treatment adherence",
      "Financial literacy and budgeting workshops",
      "Community service and civic engagement",
    ],
    milestones: ["90-day retention", "First credential earned", "Stable housing at 90 days", "No new charges"],
  },
  {
    phase: "Phase 4: Growth",
    duration: "6-12 months post-release",
    color: "bg-amber-500",
    activities: [
      "Career pathway advancement",
      "Leadership development opportunities",
      "Peer mentoring training",
      "Independent living skills mastery",
      "Long-term goal setting and tracking",
      "Transition to reduced supervision",
    ],
    milestones: ["Employment secured", "Leadership role achieved", "6-month recidivism-free", "Supervision step-down"],
  },
  {
    phase: "Phase 5: Independence",
    duration: "12-36 months post-release",
    color: "bg-rose-500",
    activities: [
      "Self-directed goal management",
      "Alumni network participation",
      "Ongoing education or career advancement",
      "Community contribution and volunteerism",
      "Long-term outcome data collection",
      "Discharge planning and aftercare",
    ],
    milestones: ["12-month recidivism-free", "Stable employment", "Self-sufficiency achieved", "Program completion"],
  },
];

const OUTCOME_DOMAINS = [
  { domain: "Recidivism Prevention", icon: Shield, target: "75% reduction at 12 months", current: 68, color: "text-blue-600" },
  { domain: "Education Enrollment", icon: BookOpen, target: "90% enrolled within 30 days", current: 82, color: "text-violet-600" },
  { domain: "Employment Retention", icon: Briefcase, target: "70% employed at 6 months", current: 61, color: "text-emerald-600" },
  { domain: "Housing Stability", icon: Building2, target: "85% stable housing at 90 days", current: 78, color: "text-amber-600" },
  { domain: "Behavioral Health", icon: Heart, target: "80% engaged in treatment", current: 74, color: "text-rose-600" },
  { domain: "Supervision Compliance", icon: CheckCircle2, target: "90% meeting requirements", current: 85, color: "text-teal-600" },
];

const PARTNER_ORGANIZATIONS = [
  { name: "Texas Juvenile Justice Department (TJJD)", type: "State Agency", role: "Referral source, funding partner, policy alignment", region: "Statewide", status: "active" },
  { name: "Travis County Juvenile Probation", type: "County Agency", role: "Direct referrals, supervision coordination, court reporting", region: "Travis County", status: "active" },
  { name: "Williamson County Juvenile Services", type: "County Agency", role: "Referrals, data sharing, joint case planning", region: "Williamson County", status: "active" },
  { name: "Capital Area Private Defenders Office", type: "Legal Aid", role: "Defense-side referrals, legal advocacy coordination", region: "Central Texas", status: "active" },
  { name: "OJJDP Second Chance Act Grantees Network", type: "Federal Network", role: "Best practice sharing, evaluation framework alignment", region: "National", status: "active" },
  { name: "Austin/Travis County Reentry Roundtable", type: "Coalition", role: "Community coordination, resource mapping, gap analysis", region: "Austin Metro", status: "active" },
  { name: "Integral Care", type: "Behavioral Health", role: "Mental health and substance abuse treatment provider", region: "Travis County", status: "active" },
  { name: "American YouthWorks", type: "Workforce", role: "Job training, GED preparation, career pathways", region: "Central Texas", status: "active" },
  { name: "Communities In Schools", type: "Education", role: "School-based reentry support, dropout prevention", region: "Central Texas", status: "active" },
  { name: "LifeWorks", type: "Youth Services", role: "Emergency housing, counseling, workforce development", region: "Austin Metro", status: "active" },
];

const CAPABILITIES = [
  "Five-level AI mastery curriculum for digital literacy",
  "50+ school-to-career pipelines with structured progression",
  "Professional mentorship matching and coaching",
  "10 AI-powered creation tools for portfolio building",
  "Financial literacy education and entrepreneurship training",
  "Community resource finder covering all 50 states",
  "Bilingual support (English/Spanish)",
  "Wraparound support with multi-agency coordination",
];

const EVIDENCE_BASE = [
  { framework: "OJJDP Second Chance Act", alignment: "Full compliance with FY25 Youth Reentry Program requirements including structured reentry plans, evidence-based programming, and federal reporting" },
  { framework: "Risk-Need-Responsivity (RNR)", alignment: "Assessment tools (SAVRY, LSI-R) guide individualized plan development targeting criminogenic needs with responsive programming" },
  { framework: "Positive Youth Development (PYD)", alignment: "Strength-based approach through mentorship, leadership development, career pathways, and pro-social engagement" },
  { framework: "Trauma-Informed Care", alignment: "All services screened through trauma lens with PHQ-9/GAD-7 integration, behavioral health warm handoffs, and culturally responsive care" },
  { framework: "SAMHSA's SPF Model", alignment: "Community-level prevention strategies integrated with individual reentry services through coalition partnerships" },
];

export default function JusticePartnersPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<{
    totalPlans: number;
    activePlans: number;
    completedPlans: number;
    totalMilestones: number;
    completedMilestones: number;
    averageCompletionRate: number;
  }>({
    queryKey: ["/api/reentry/dashboard"],
  });

  const tabs: { id: TabId; label: string; icon: typeof Shield }[] = [
    { id: "overview", label: "Overview", icon: Shield },
    { id: "reentry-model", label: "Reentry Model", icon: Target },
    { id: "integration", label: "API Integration", icon: Globe },
    { id: "outcomes", label: "Outcomes", icon: BarChart3 },
    { id: "partners", label: "Partners", icon: Users },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-8">
      <section className="text-center py-8">
        <Badge variant="secondary" className="mb-4" data-testid="badge-justice">
          <Shield className="mr-1 h-3 w-3" /> For Juvenile Justice Partners
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="text-justice-title">
          Community-Based Reentry Ecosystem
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
          ThriveUp provides a comprehensive, evidence-based platform for youth reentry, workforce development, and whole-child support — designed to integrate with juvenile justice agency workflows.
        </p>
      </section>

      {dashboardLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : dashboardData ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 text-center" data-testid="card-stat-active-plans">
            <p className="text-2xl font-bold text-primary">{dashboardData.activePlans}</p>
            <p className="text-xs text-muted-foreground">Active Reentry Plans</p>
          </Card>
          <Card className="p-4 text-center" data-testid="card-stat-completed-plans">
            <p className="text-2xl font-bold text-emerald-600">{dashboardData.completedPlans}</p>
            <p className="text-xs text-muted-foreground">Completed Plans</p>
          </Card>
          <Card className="p-4 text-center" data-testid="card-stat-milestones">
            <p className="text-2xl font-bold text-violet-600">{dashboardData.completedMilestones}/{dashboardData.totalMilestones}</p>
            <p className="text-xs text-muted-foreground">Milestones Hit</p>
          </Card>
          <Card className="p-4 text-center" data-testid="card-stat-completion-rate">
            <p className="text-2xl font-bold text-amber-600">{dashboardData.averageCompletionRate}%</p>
            <p className="text-xs text-muted-foreground">Avg Completion Rate</p>
          </Card>
        </div>
      ) : null}

      <div className="flex gap-1 border-b overflow-x-auto pb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
            data-testid={`tab-justice-${tab.id}`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {VALUE_PROPS.map(prop => (
              <Card key={prop.title} className="p-5" data-testid={`card-value-${prop.title.toLowerCase().replace(/\s/g, '-')}`}>
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                    <prop.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{prop.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{prop.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6" data-testid="card-platform-capabilities">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="h-6 w-6 text-primary" />
              <h2 className="font-semibold text-xl">Platform Capabilities</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CAPABILITIES.map(cap => (
                <div key={cap} className="flex items-start gap-2 p-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span className="text-sm">{cap}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6" data-testid="card-evidence-base">
            <div className="flex items-center gap-3 mb-4">
              <Award className="h-6 w-6 text-primary" />
              <h2 className="font-semibold text-xl">Evidence Base & Framework Alignment</h2>
            </div>
            <div className="space-y-4">
              {EVIDENCE_BASE.map(eb => (
                <div key={eb.framework} className="p-4 rounded-lg border">
                  <h4 className="font-semibold text-sm mb-1">{eb.framework}</h4>
                  <p className="text-sm text-muted-foreground">{eb.alignment}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-violet-600 to-indigo-700 text-white border-none" data-testid="card-grant-alignment">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold mb-3">Grant-Aligned for OJJDP Second Chance Act</h2>
              <p className="text-white/80 max-w-2xl mx-auto mb-6">
                Our platform is purpose-built to support OJJDP FY25 Second Chance Act Youth Reentry Program requirements, including structured reentry plans, evidence-based programming, community partnerships, and federal reporting compliance.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Link href="/reentry">
                  <Button size="lg" className="bg-white text-violet-700 min-h-[44px]" data-testid="button-view-reentry" aria-label="View reentry dashboard">
                    <Shield className="mr-2 h-5 w-5" /> View Reentry Dashboard
                  </Button>
                </Link>
                <Link href="/outcomes">
                  <Button size="lg" variant="outline" className="text-white border-white/40 bg-white/15 min-h-[44px]" data-testid="button-view-outcomes" aria-label="View outcome reporting">
                    <BarChart3 className="mr-2 h-5 w-5" /> Outcome Reporting
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "reentry-model" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-1">Five-Phase Reentry Model</h2>
            <p className="text-muted-foreground text-sm">Evidence-based progression from pre-release through independence, with measurable milestones at each phase.</p>
          </div>

          <div className="space-y-4">
            {REENTRY_PHASES.map((phase, idx) => (
              <Card key={phase.phase} className="p-5" data-testid={`card-phase-${idx + 1}`}>
                <div className="flex items-start gap-4">
                  <div className={`${phase.color} text-white rounded-full w-10 h-10 flex items-center justify-center font-bold shrink-0`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <h3 className="font-semibold text-lg">{phase.phase}</h3>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" /> {phase.duration}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Activities</p>
                        <ul className="space-y-1.5">
                          {phase.activities.map(a => (
                            <li key={a} className="flex items-start gap-2 text-sm">
                              <Activity className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Milestones</p>
                        <ul className="space-y-1.5">
                          {phase.milestones.map(m => (
                            <li key={m} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-emerald-500 shrink-0" />
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-5" data-testid="card-six-domains">
            <div className="flex items-center gap-3 mb-4">
              <Layers className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Six Domains of Wellbeing Tracked</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Every youth in the reentry program is assessed and tracked across six core domains using validated instruments, ensuring holistic support and early intervention when any domain shows decline.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { domain: "Education", desc: "School enrollment, attendance, grade progression, credential attainment" },
                { domain: "Employment", desc: "Job readiness, placement, retention, wage progression" },
                { domain: "Housing", desc: "Stability, safety, independent living skills" },
                { domain: "Health", desc: "Physical health, behavioral health, substance use, medication adherence" },
                { domain: "Social", desc: "Pro-social relationships, family engagement, community connection" },
                { domain: "Legal", desc: "Supervision compliance, court requirements, restitution progress" },
              ].map(d => (
                <div key={d.domain} className="p-3 rounded-lg border">
                  <p className="font-semibold text-sm mb-1">{d.domain}</p>
                  <p className="text-xs text-muted-foreground">{d.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "integration" && (
        <div className="space-y-6">
          <Card className="p-6" data-testid="card-integration-api">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="h-6 w-6 text-primary" />
              <h2 className="font-semibold text-xl">Justice System Integration API</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Secure, API-key authenticated endpoints for juvenile justice agencies to submit referrals and receive real-time progress updates.
            </p>
            <div className="space-y-3">
              {INTEGRATION_ENDPOINTS.map(ep => (
                <div key={ep.path} className="flex items-start gap-3 p-3 rounded-lg border">
                  <Badge variant={ep.method === "POST" ? "default" : "secondary"} className="shrink-0 mt-0.5">{ep.method}</Badge>
                  <div>
                    <code className="text-sm font-mono text-primary">{ep.path}</code>
                    <p className="text-sm text-muted-foreground mt-0.5">{ep.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6" data-testid="card-integration-workflow">
            <h3 className="font-semibold text-lg mb-4">Integration Workflow</h3>
            <div className="space-y-4">
              {[
                { step: "1", title: "API Key Provisioning", desc: "Justice agency receives an API key and documentation for the ThriveUp integration endpoints. Key scoping limits access to agency-specific data only." },
                { step: "2", title: "Referral Submission", desc: "Agency submits youth referral via POST with demographics, release date, risk level, supervision requirements, and assigned case worker." },
                { step: "3", title: "Plan Assignment", desc: "ThriveUp auto-generates an individualized reentry plan based on risk/needs assessment data. Plan is shared back via API for agency review." },
                { step: "4", title: "Progress Monitoring", desc: "Agency polls GET endpoint for real-time milestone completion, compliance status, and early warning alerts. Webhook option available for push notifications." },
                { step: "5", title: "Court Reporting", desc: "Agency generates timestamped progress reports suitable for court review, including milestone evidence, compliance data, and outcome metrics." },
              ].map(s => (
                <div key={s.step} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{s.title}</p>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6" data-testid="card-data-security">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Data Security & Compliance</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "CJIS Security Policy compliance for criminal justice data",
                "FERPA compliance for education records",
                "HIPAA compliance for behavioral health data",
                "42 CFR Part 2 compliance for substance abuse records",
                "API key rotation and audit logging",
                "Role-based access controls with least privilege",
                "Data encryption at rest and in transit (TLS 1.3)",
                "Automated data retention and expungement policies",
              ].map(item => (
                <div key={item} className="flex items-start gap-2 p-2">
                  <Shield className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "outcomes" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-1">DOJ-Aligned Outcome Tracking</h2>
            <p className="text-muted-foreground text-sm">Six core outcome domains monitored at 6, 12, and 36 months post-release with configurable targets.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {OUTCOME_DOMAINS.map(od => (
              <Card key={od.domain} className="p-5" data-testid={`card-outcome-${od.domain.toLowerCase().replace(/\s/g, '-')}`}>
                <div className="flex items-center gap-2 mb-3">
                  <od.icon className={`h-5 w-5 ${od.color}`} />
                  <h3 className="font-semibold text-sm">{od.domain}</h3>
                </div>
                <Progress value={od.current} className="h-2 mb-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Current: {od.current}%</span>
                  <span>Target: {od.target}</span>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6" data-testid="card-reporting-schedule">
            <h3 className="font-semibold text-lg mb-4">Federal Reporting Alignment</h3>
            <div className="space-y-3">
              {[
                { period: "Monthly", reports: "Enrollment counts, active caseload, milestone completions, referral volume", audience: "Program managers, supervisors" },
                { period: "Quarterly", reports: "Outcome progress by domain, recidivism data, compliance rates, service utilization", audience: "OJJDP program officers, state administrators" },
                { period: "Semi-Annual", reports: "GMS performance reports, budget reconciliation, cost per outcome analysis", audience: "Federal grantor, state oversight" },
                { period: "Annual", reports: "Comprehensive outcome evaluation, recidivism at 6/12 months, employment/education retention, cost-benefit analysis", audience: "All stakeholders, legislative reports" },
              ].map(r => (
                <div key={r.period} className="p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">{r.period}</Badge>
                  </div>
                  <p className="text-sm mb-1">{r.reports}</p>
                  <p className="text-xs text-muted-foreground">Audience: {r.audience}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6" data-testid="card-early-warning">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold text-lg">Early Warning System</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Automated alerts trigger when a youth's progress across any wellbeing domain drops below configurable thresholds, enabling proactive intervention before crisis.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { level: "Watch", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400", desc: "Minor deviation from plan. Case manager notified for review at next check-in." },
                { level: "Alert", color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400", desc: "Significant concern across multiple domains. Immediate case conference scheduled." },
                { level: "Critical", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400", desc: "Imminent risk. Supervisor and partner agencies notified. Emergency response protocol activated." },
              ].map(lvl => (
                <div key={lvl.level} className={`p-4 rounded-lg ${lvl.color}`}>
                  <p className="font-semibold text-sm mb-1">{lvl.level}</p>
                  <p className="text-xs">{lvl.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "partners" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-1">Justice Partner Network</h2>
            <p className="text-muted-foreground text-sm">Coordinated partnerships spanning state agencies, county systems, legal aid, behavioral health, and workforce development.</p>
          </div>

          <div className="space-y-3">
            {PARTNER_ORGANIZATIONS.map(partner => (
              <Card key={partner.name} className="p-4" data-testid={`card-partner-${partner.name.toLowerCase().replace(/\s/g, '-').substring(0, 30)}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-semibold text-sm">{partner.name}</h4>
                      <Badge variant="secondary" className="text-xs">{partner.type}</Badge>
                      <Badge variant="outline" className="text-xs">
                        <MapPin className="h-3 w-3 mr-1" /> {partner.region}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{partner.role}</p>
                  </div>
                  <Badge variant={partner.status === "active" ? "default" : "secondary"} className="shrink-0">
                    {partner.status === "active" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : null}
                    {partner.status === "active" ? "Active" : "Pending"}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6" data-testid="card-ecosystem-integration">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Ecosystem Service Integration</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Justice-involved youth access the full ThriveUp ecosystem through coordinated referral pathways, ensuring no gap in services from release through independence.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { platform: "ThriveUp", service: "AI mastery curriculum, career pathways, certifications" },
                { platform: "LifeBridge", service: "Housing navigation, transitional support, stability tracking" },
                { platform: "Mission Transition", service: "Workforce training, job placement, employer connections" },
                { platform: "Whole-Person Health", service: "PHQ-9/GAD-7 screening, behavioral health referrals" },
                { platform: "Sankofa Health", service: "Culturally responsive care, community healing" },
                { platform: "ISSS", service: "School-based wraparound, IEP coordination" },
                { platform: "Perfectly Different", service: "Neurodiversity support — IEP/504 navigation, special education advocacy" },
                { platform: "SafeReport", service: "Mandatory-reporter incident management, longitudinal screening (PHQ-9/GAD-7/C-SSRS)" },
              ].map(p => (
                <div key={p.platform} className="flex items-start gap-2 p-3 rounded-lg border">
                  <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{p.platform}</p>
                    <p className="text-xs text-muted-foreground">{p.service}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <div className="text-center py-4">
        <p className="text-muted-foreground">
          For integration inquiries, contact:{" "}
          <a href="mailto:programs@thecollaborativeadvocate.org" className="font-medium text-foreground" data-testid="link-contact-1">programs@thecollaborativeadvocate.org</a>
        </p>
      </div>
    </div>
  );
}
