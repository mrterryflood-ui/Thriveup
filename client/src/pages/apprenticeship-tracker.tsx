import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Wrench,
  Users,
  Building2,
  Clock,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Award,
  Briefcase,
  DollarSign,
  Target,
  Plus,
  Search,
  Calendar,
  Star,
  ClipboardCheck,
  FileText,
  UserCheck,
} from "lucide-react";

interface Apprentice {
  id: string;
  name: string;
  employer: string;
  trade: string;
  stage: "pre-apprenticeship" | "registered" | "journeyworker";
  hoursCompleted: number;
  hoursRequired: number;
  startDate: string;
  expectedCompletion: string;
  currentWage: string;
  startingWage: string;
  competencies: Competency[];
  mentorCheckins: MentorCheckin[];
  rapidsId: string;
  onetCode: string;
}

interface Competency {
  id: string;
  name: string;
  category: string;
  onetSkillCode: string;
  proficiencyLevel: number;
  targetLevel: number;
  verifiedDate?: string;
  verifiedBy?: string;
}

interface MentorCheckin {
  id: string;
  date: string;
  mentorName: string;
  notes: string;
  rating: number;
  areasOfStrength: string[];
  areasForImprovement: string[];
}

interface EmployerPartnerData {
  id: string;
  name: string;
  industry: string;
  activeApprentices: number;
  completedApprentices: number;
  trades: string[];
  contactName: string;
  contactEmail: string;
}

const EMPLOYER_PARTNERS: EmployerPartnerData[] = [
  {
    id: "heb",
    name: "H-E-B",
    industry: "Retail / Food Service",
    activeApprentices: 12,
    completedApprentices: 8,
    trades: ["Retail Management", "Supply Chain", "Culinary Arts"],
    contactName: "Maria Santos",
    contactEmail: "msantos@heb.com",
  },
  {
    id: "austin-energy",
    name: "Austin Energy",
    industry: "Utilities / Energy",
    activeApprentices: 8,
    completedApprentices: 5,
    trades: ["Electrical Line Worker", "Energy Technician", "HVAC"],
    contactName: "James Wilson",
    contactEmail: "jwilson@austinenergy.com",
  },
  {
    id: "samsung",
    name: "Samsung Austin Semiconductor",
    industry: "Manufacturing / Technology",
    activeApprentices: 15,
    completedApprentices: 10,
    trades: ["Semiconductor Manufacturing", "Process Technician", "Quality Assurance"],
    contactName: "David Kim",
    contactEmail: "dkim@samsung.com",
  },
  {
    id: "capital-metro",
    name: "Capital Metro",
    industry: "Transportation",
    activeApprentices: 6,
    completedApprentices: 4,
    trades: ["Diesel Mechanic", "Transit Operations", "Fleet Maintenance"],
    contactName: "Angela Brown",
    contactEmail: "abrown@capmetro.org",
  },
  {
    id: "goodwill",
    name: "Goodwill Central Texas",
    industry: "Nonprofit / Workforce Development",
    activeApprentices: 10,
    completedApprentices: 7,
    trades: ["IT Support", "Digital Marketing", "Office Administration"],
    contactName: "Robert Taylor",
    contactEmail: "rtaylor@goodwillcentraltx.org",
  },
];

const SAMPLE_APPRENTICES: Apprentice[] = [
  {
    id: "app-001",
    name: "Marcus Johnson",
    employer: "Samsung Austin Semiconductor",
    trade: "Process Technician",
    stage: "registered",
    hoursCompleted: 3200,
    hoursRequired: 6000,
    startDate: "2024-08-15",
    expectedCompletion: "2026-08-15",
    currentWage: "$22.50/hr",
    startingWage: "$18.00/hr",
    rapidsId: "RAP-2024-TX-0892",
    onetCode: "51-9199.00",
    competencies: [
      { id: "c1", name: "Wafer Processing", category: "Technical", onetSkillCode: "2.A.1.e", proficiencyLevel: 4, targetLevel: 5, verifiedDate: "2025-03-01", verifiedBy: "David Kim" },
      { id: "c2", name: "Quality Control", category: "Technical", onetSkillCode: "2.A.1.d", proficiencyLevel: 3, targetLevel: 5 },
      { id: "c3", name: "Safety Protocols", category: "Safety", onetSkillCode: "2.B.1.a", proficiencyLevel: 5, targetLevel: 5, verifiedDate: "2025-01-15", verifiedBy: "Safety Team" },
      { id: "c4", name: "Equipment Maintenance", category: "Technical", onetSkillCode: "2.A.2.a", proficiencyLevel: 3, targetLevel: 4 },
      { id: "c5", name: "Team Communication", category: "Workplace", onetSkillCode: "2.B.3.a", proficiencyLevel: 4, targetLevel: 5 },
    ],
    mentorCheckins: [
      { id: "mc1", date: "2025-05-01", mentorName: "David Kim", notes: "Marcus is progressing well. Ready for advanced wafer processing module.", rating: 4, areasOfStrength: ["Technical aptitude", "Punctuality"], areasForImprovement: ["Documentation"] },
      { id: "mc2", date: "2025-04-01", mentorName: "David Kim", notes: "Completed safety recertification. Showing strong leadership potential.", rating: 5, areasOfStrength: ["Safety awareness", "Team collaboration"], areasForImprovement: ["Time management on complex tasks"] },
    ],
  },
  {
    id: "app-002",
    name: "Aisha Williams",
    employer: "Austin Energy",
    trade: "Electrical Line Worker",
    stage: "registered",
    hoursCompleted: 5400,
    hoursRequired: 8000,
    startDate: "2023-06-01",
    expectedCompletion: "2026-06-01",
    currentWage: "$28.00/hr",
    startingWage: "$19.50/hr",
    rapidsId: "RAP-2023-TX-0567",
    onetCode: "49-9051.00",
    competencies: [
      { id: "c6", name: "Line Installation", category: "Technical", onetSkillCode: "2.A.1.a", proficiencyLevel: 4, targetLevel: 5 },
      { id: "c7", name: "Electrical Theory", category: "Knowledge", onetSkillCode: "2.C.1.a", proficiencyLevel: 5, targetLevel: 5, verifiedDate: "2025-02-20", verifiedBy: "James Wilson" },
      { id: "c8", name: "Pole Climbing", category: "Physical", onetSkillCode: "2.A.3.a", proficiencyLevel: 5, targetLevel: 5, verifiedDate: "2024-12-01", verifiedBy: "Field Supervisor" },
      { id: "c9", name: "Storm Response", category: "Emergency", onetSkillCode: "2.B.2.a", proficiencyLevel: 4, targetLevel: 5 },
    ],
    mentorCheckins: [
      { id: "mc3", date: "2025-05-10", mentorName: "James Wilson", notes: "Aisha is on track for early completion. Exceptional field performance.", rating: 5, areasOfStrength: ["Field skills", "Problem solving"], areasForImprovement: ["Administrative paperwork"] },
    ],
  },
  {
    id: "app-003",
    name: "Carlos Rivera",
    employer: "H-E-B",
    trade: "Culinary Arts",
    stage: "pre-apprenticeship",
    hoursCompleted: 400,
    hoursRequired: 4000,
    startDate: "2025-01-10",
    expectedCompletion: "2027-01-10",
    currentWage: "$15.50/hr",
    startingWage: "$14.00/hr",
    rapidsId: "PRE-2025-TX-0123",
    onetCode: "35-1011.00",
    competencies: [
      { id: "c10", name: "Food Safety", category: "Safety", onetSkillCode: "2.B.1.b", proficiencyLevel: 3, targetLevel: 5 },
      { id: "c11", name: "Knife Skills", category: "Technical", onetSkillCode: "2.A.1.b", proficiencyLevel: 2, targetLevel: 5 },
      { id: "c12", name: "Menu Planning", category: "Knowledge", onetSkillCode: "2.C.2.a", proficiencyLevel: 1, targetLevel: 4 },
    ],
    mentorCheckins: [
      { id: "mc4", date: "2025-04-15", mentorName: "Maria Santos", notes: "Carlos is enthusiastic and learning quickly. Ready to move to registered apprenticeship.", rating: 4, areasOfStrength: ["Attitude", "Customer service"], areasForImprovement: ["Knife technique", "Speed"] },
    ],
  },
  {
    id: "app-004",
    name: "Tameka Davis",
    employer: "Goodwill Central Texas",
    trade: "IT Support",
    stage: "journeyworker",
    hoursCompleted: 4000,
    hoursRequired: 4000,
    startDate: "2023-01-15",
    expectedCompletion: "2025-01-15",
    currentWage: "$26.00/hr",
    startingWage: "$16.00/hr",
    rapidsId: "RAP-2023-TX-0234",
    onetCode: "15-1232.00",
    competencies: [
      { id: "c13", name: "Help Desk Support", category: "Technical", onetSkillCode: "2.A.1.c", proficiencyLevel: 5, targetLevel: 5, verifiedDate: "2025-01-10", verifiedBy: "Robert Taylor" },
      { id: "c14", name: "Network Configuration", category: "Technical", onetSkillCode: "2.A.2.b", proficiencyLevel: 5, targetLevel: 5, verifiedDate: "2025-01-10", verifiedBy: "Robert Taylor" },
      { id: "c15", name: "Customer Communication", category: "Workplace", onetSkillCode: "2.B.3.b", proficiencyLevel: 5, targetLevel: 5, verifiedDate: "2025-01-10", verifiedBy: "Robert Taylor" },
      { id: "c16", name: "System Administration", category: "Technical", onetSkillCode: "2.A.2.c", proficiencyLevel: 5, targetLevel: 5, verifiedDate: "2024-11-20", verifiedBy: "IT Director" },
    ],
    mentorCheckins: [
      { id: "mc5", date: "2025-01-10", mentorName: "Robert Taylor", notes: "Tameka has successfully completed all requirements. Transitioned to journeyworker status.", rating: 5, areasOfStrength: ["Technical mastery", "Leadership", "Mentoring others"], areasForImprovement: [] },
    ],
  },
  {
    id: "app-005",
    name: "DeShawn Thompson",
    employer: "Capital Metro",
    trade: "Diesel Mechanic",
    stage: "registered",
    hoursCompleted: 2800,
    hoursRequired: 6000,
    startDate: "2024-03-01",
    expectedCompletion: "2027-03-01",
    currentWage: "$21.00/hr",
    startingWage: "$17.00/hr",
    rapidsId: "RAP-2024-TX-0456",
    onetCode: "49-3031.00",
    competencies: [
      { id: "c17", name: "Diesel Engine Repair", category: "Technical", onetSkillCode: "2.A.1.f", proficiencyLevel: 3, targetLevel: 5 },
      { id: "c18", name: "Brake Systems", category: "Technical", onetSkillCode: "2.A.1.g", proficiencyLevel: 4, targetLevel: 5, verifiedDate: "2025-02-15", verifiedBy: "Angela Brown" },
      { id: "c19", name: "Diagnostic Tools", category: "Technical", onetSkillCode: "2.A.2.d", proficiencyLevel: 3, targetLevel: 5 },
      { id: "c20", name: "Preventive Maintenance", category: "Technical", onetSkillCode: "2.A.2.e", proficiencyLevel: 4, targetLevel: 5 },
    ],
    mentorCheckins: [
      { id: "mc6", date: "2025-04-20", mentorName: "Angela Brown", notes: "DeShawn is making steady progress. Brake systems certification completed ahead of schedule.", rating: 4, areasOfStrength: ["Hands-on skills", "Reliability"], areasForImprovement: ["Diagnostic technology", "Written documentation"] },
    ],
  },
  {
    id: "app-006",
    name: "Jasmine Patel",
    employer: "Samsung Austin Semiconductor",
    trade: "Quality Assurance",
    stage: "registered",
    hoursCompleted: 1600,
    hoursRequired: 4000,
    startDate: "2024-10-01",
    expectedCompletion: "2026-10-01",
    currentWage: "$20.00/hr",
    startingWage: "$17.50/hr",
    rapidsId: "RAP-2024-TX-0789",
    onetCode: "17-2112.00",
    competencies: [
      { id: "c21", name: "Statistical Process Control", category: "Technical", onetSkillCode: "2.A.4.a", proficiencyLevel: 3, targetLevel: 5 },
      { id: "c22", name: "Metrology", category: "Technical", onetSkillCode: "2.A.4.b", proficiencyLevel: 2, targetLevel: 5 },
      { id: "c23", name: "Documentation Standards", category: "Workplace", onetSkillCode: "2.B.3.c", proficiencyLevel: 4, targetLevel: 5 },
    ],
    mentorCheckins: [
      { id: "mc7", date: "2025-04-28", mentorName: "David Kim", notes: "Jasmine excels in documentation. Needs more hands-on metrology experience.", rating: 4, areasOfStrength: ["Attention to detail", "Documentation"], areasForImprovement: ["Metrology equipment", "Statistical analysis software"] },
    ],
  },
];

const COMPETENCY_FRAMEWORK = [
  { category: "Technical Skills", onetGroup: "2.A", description: "Hands-on trade-specific abilities", color: "bg-blue-500" },
  { category: "Safety & Compliance", onetGroup: "2.B.1", description: "OSHA and industry safety standards", color: "bg-red-500" },
  { category: "Workplace Skills", onetGroup: "2.B.3", description: "Communication, teamwork, professionalism", color: "bg-emerald-500" },
  { category: "Knowledge Areas", onetGroup: "2.C", description: "Theory and academic foundations", color: "bg-purple-500" },
  { category: "Physical Abilities", onetGroup: "2.A.3", description: "Physical requirements for trade", color: "bg-amber-500" },
  { category: "Emergency Response", onetGroup: "2.B.2", description: "Crisis and emergency procedures", color: "bg-orange-500" },
];

const RAPIDS_REQUIREMENTS = [
  { requirement: "Employer Registration", description: "Employer registered with DOL RAPIDS system", status: "complete" },
  { requirement: "Written Training Plan", description: "Structured OJT plan with competency benchmarks", status: "complete" },
  { requirement: "Related Technical Instruction", description: "Minimum 144 hours/year of classroom instruction", status: "complete" },
  { requirement: "Progressive Wage Schedule", description: "Documented wage increases tied to skill attainment", status: "complete" },
  { requirement: "Safety Training", description: "OSHA-compliant safety orientation and ongoing training", status: "complete" },
  { requirement: "Mentor Assignment", description: "Qualified journeyworker assigned as mentor", status: "complete" },
  { requirement: "Equal Employment Opportunity", description: "EEO plan on file with registration agency", status: "in-progress" },
  { requirement: "Apprenticeship Agreement", description: "Signed agreement between apprentice and sponsor", status: "complete" },
];

function StageIndicator({ stage }: { stage: Apprentice["stage"] }) {
  const stages = [
    { key: "pre-apprenticeship", label: "Pre-Apprenticeship" },
    { key: "registered", label: "Registered Apprenticeship" },
    { key: "journeyworker", label: "Journeyworker" },
  ];
  const currentIndex = stages.findIndex(s => s.key === stage);

  return (
    <div className="flex items-center gap-1" data-testid="stage-indicator">
      {stages.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${i < currentIndex ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : i === currentIndex ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-muted text-muted-foreground"}`}>
            {i < currentIndex && <CheckCircle2 className="h-3 w-3" />}
            {s.label}
          </div>
          {i < stages.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
        </div>
      ))}
    </div>
  );
}

function DashboardOverview({ apprentices }: { apprentices: Apprentice[] }) {
  const totalActive = apprentices.filter(a => a.stage !== "journeyworker").length;
  const totalCompleted = apprentices.filter(a => a.stage === "journeyworker").length;
  const avgCompletion = Math.round(
    apprentices.reduce((sum, a) => sum + (a.hoursCompleted / a.hoursRequired) * 100, 0) / apprentices.length
  );
  const totalEmployers = EMPLOYER_PARTNERS.length;

  const statCards = [
    { label: "Active Apprentices", value: totalActive, icon: Users, color: "bg-gradient-to-br from-blue-500 to-blue-600" },
    { label: "Completed (Journeyworkers)", value: totalCompleted, icon: Award, color: "bg-gradient-to-br from-emerald-500 to-emerald-600" },
    { label: "Avg. Completion Rate", value: `${avgCompletion}%`, icon: TrendingUp, color: "bg-gradient-to-br from-purple-500 to-purple-600" },
    { label: "Employer Partners", value: totalEmployers, icon: Building2, color: "bg-gradient-to-br from-amber-500 to-amber-600" },
  ];

  const stageBreakdown = {
    pre: apprentices.filter(a => a.stage === "pre-apprenticeship").length,
    registered: apprentices.filter(a => a.stage === "registered").length,
    journeyworker: apprentices.filter(a => a.stage === "journeyworker").length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="section-dashboard-stats">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-4" data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${stat.color}`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6" data-testid="card-pathway-funnel">
        <h2 className="font-semibold text-base mb-4 flex items-center gap-2">
          <Target className="h-4 w-4" /> Apprenticeship Pathway
        </h2>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="text-center" data-testid="stage-count-pre">
            <div className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center bg-amber-500 text-white font-bold text-lg">
              {stageBreakdown.pre}
            </div>
            <p className="text-xs font-medium">Pre-Apprenticeship</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 hidden sm:block" />
          <div className="text-center" data-testid="stage-count-registered">
            <div className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center bg-blue-500 text-white font-bold text-lg">
              {stageBreakdown.registered}
            </div>
            <p className="text-xs font-medium">Registered</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 hidden sm:block" />
          <div className="text-center" data-testid="stage-count-journeyworker">
            <div className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center bg-emerald-500 text-white font-bold text-lg">
              {stageBreakdown.journeyworker}
            </div>
            <p className="text-xs font-medium">Journeyworker</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5" data-testid="card-employer-engagement">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Employer Engagement
          </h3>
          <div className="space-y-3">
            {EMPLOYER_PARTNERS.map((emp) => (
              <div key={emp.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30" data-testid={`employer-row-${emp.id}`}>
                <div>
                  <p className="text-sm font-medium">{emp.name}</p>
                  <p className="text-xs text-muted-foreground">{emp.industry}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{emp.activeApprentices} active</Badge>
                  <Badge variant="outline" className="text-xs">{emp.completedApprentices} completed</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5" data-testid="card-completion-rates">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Individual Progress
          </h3>
          <div className="space-y-3">
            {apprentices.map((app) => {
              const pct = Math.round((app.hoursCompleted / app.hoursRequired) * 100);
              return (
                <div key={app.id} className="space-y-1" data-testid={`progress-row-${app.id}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{app.name}</span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">{app.hoursCompleted.toLocaleString()} / {app.hoursRequired.toLocaleString()} hours</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ApprenticeCard({ apprentice, onClick }: { apprentice: Apprentice; onClick: () => void }) {
  const pct = Math.round((apprentice.hoursCompleted / apprentice.hoursRequired) * 100);
  const verifiedCount = apprentice.competencies.filter(c => c.verifiedDate).length;

  return (
    <Card
      className="p-5 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
      data-testid={`card-apprentice-${apprentice.id}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-semibold text-sm" data-testid={`text-name-${apprentice.id}`}>{apprentice.name}</h3>
          <p className="text-xs text-muted-foreground">{apprentice.trade} at {apprentice.employer}</p>
        </div>
        <Badge
          variant="secondary"
          className={`text-xs shrink-0 ${apprentice.stage === "journeyworker" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : apprentice.stage === "registered" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"}`}
        >
          {apprentice.stage === "pre-apprenticeship" ? "Pre-Apprenticeship" : apprentice.stage === "registered" ? "Registered" : "Journeyworker"}
        </Badge>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Hours</span>
          <span className="font-medium">{apprentice.hoursCompleted.toLocaleString()} / {apprentice.hoursRequired.toLocaleString()} ({pct}%)</span>
        </div>
        <Progress value={pct} className="h-1.5" />
      </div>

      <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {apprentice.currentWage}</span>
        <span className="flex items-center gap-1"><Award className="h-3 w-3" /> {verifiedCount}/{apprentice.competencies.length} competencies</span>
        <span className="flex items-center gap-1"><UserCheck className="h-3 w-3" /> {apprentice.mentorCheckins.length} check-ins</span>
      </div>
    </Card>
  );
}

function ApprenticeDetail({ apprentice, onClose }: { apprentice: Apprentice; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState("overview");
  const pct = Math.round((apprentice.hoursCompleted / apprentice.hoursRequired) * 100);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="dialog-apprentice-detail">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-apprentice-name">{apprentice.name}</DialogTitle>
        </DialogHeader>

        <StageIndicator stage={apprentice.stage} />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="hours" data-testid="tab-hours">Hours</TabsTrigger>
            <TabsTrigger value="competencies" data-testid="tab-competencies">Skills</TabsTrigger>
            <TabsTrigger value="mentoring" data-testid="tab-mentoring">Mentoring</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Employer</p>
                <p className="text-sm font-medium">{apprentice.employer}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Trade</p>
                <p className="text-sm font-medium">{apprentice.trade}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">RAPIDS ID</p>
                <p className="text-sm font-medium">{apprentice.rapidsId}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">O*NET Code</p>
                <p className="text-sm font-medium">{apprentice.onetCode}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="text-sm font-medium">{new Date(apprentice.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expected Completion</p>
                <p className="text-sm font-medium">{new Date(apprentice.expectedCompletion).toLocaleDateString()}</p>
              </div>
            </div>

            <Card className="p-4 bg-muted/30">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2"><DollarSign className="h-3 w-3" /> Wage Progression</h4>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Starting</p>
                  <p className="text-sm font-medium">{apprentice.startingWage}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Current</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{apprentice.currentWage}</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="hours" className="space-y-4 mt-4">
            <div className="text-center mb-4">
              <p className="text-3xl font-bold">{apprentice.hoursCompleted.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">of {apprentice.hoursRequired.toLocaleString()} hours completed</p>
              <Progress value={pct} className="h-3 mt-3" />
              <p className="text-sm font-medium mt-1">{pct}% Complete</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 bg-muted/30">
                <p className="text-xs text-muted-foreground">Hours Remaining</p>
                <p className="text-lg font-bold">{(apprentice.hoursRequired - apprentice.hoursCompleted).toLocaleString()}</p>
              </Card>
              <Card className="p-3 bg-muted/30">
                <p className="text-xs text-muted-foreground">Avg Hours/Week</p>
                <p className="text-lg font-bold">
                  {Math.round(apprentice.hoursCompleted / Math.max(1, Math.ceil((new Date().getTime() - new Date(apprentice.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000))))}
                </p>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="competencies" className="space-y-3 mt-4">
            {apprentice.competencies.map((comp) => (
              <div key={comp.id} className="p-3 rounded-md bg-muted/30" data-testid={`competency-${comp.id}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <p className="text-sm font-medium">{comp.name}</p>
                    <p className="text-xs text-muted-foreground">{comp.category} | O*NET: {comp.onetSkillCode}</p>
                  </div>
                  {comp.verifiedDate ? (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">In Progress</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={(comp.proficiencyLevel / comp.targetLevel) * 100} className="h-1.5 flex-1" />
                  <span className="text-xs font-medium">{comp.proficiencyLevel}/{comp.targetLevel}</span>
                </div>
                {comp.verifiedDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Verified {new Date(comp.verifiedDate).toLocaleDateString()} by {comp.verifiedBy}
                  </p>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="mentoring" className="space-y-3 mt-4">
            {apprentice.mentorCheckins.map((checkin) => (
              <Card key={checkin.id} className="p-4" data-testid={`checkin-${checkin.id}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{checkin.mentorName}</p>
                    <p className="text-xs text-muted-foreground">{new Date(checkin.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < checkin.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{checkin.notes}</p>
                {checkin.areasOfStrength.length > 0 && (
                  <div className="mb-1.5">
                    <p className="text-xs font-medium mb-1">Strengths:</p>
                    <div className="flex gap-1 flex-wrap">
                      {checkin.areasOfStrength.map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {checkin.areasForImprovement.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1">Areas for Growth:</p>
                    <div className="flex gap-1 flex-wrap">
                      {checkin.areasForImprovement.map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function CompetencyFrameworkSection() {
  return (
    <Card className="p-5" data-testid="card-competency-framework">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <ClipboardCheck className="h-4 w-4" /> Competency Framework (O*NET Aligned)
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {COMPETENCY_FRAMEWORK.map((cat) => (
          <div key={cat.category} className="flex items-start gap-3 p-3 rounded-md bg-muted/30" data-testid={`framework-${cat.onetGroup}`}>
            <div className={`w-2 h-full min-h-[40px] rounded-full ${cat.color} shrink-0`} />
            <div>
              <p className="text-sm font-medium">{cat.category}</p>
              <p className="text-xs text-muted-foreground">O*NET Group: {cat.onetGroup}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RapidsComplianceSection() {
  const completedCount = RAPIDS_REQUIREMENTS.filter(r => r.status === "complete").length;

  return (
    <Card className="p-5 border-blue-200 dark:border-blue-800/50" data-testid="card-rapids-compliance">
      <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
        <FileText className="h-4 w-4" /> DOL RAPIDS Registration Requirements
      </h3>
      <p className="text-xs text-muted-foreground mb-3">
        {completedCount} of {RAPIDS_REQUIREMENTS.length} requirements met
      </p>
      <Progress value={(completedCount / RAPIDS_REQUIREMENTS.length) * 100} className="h-2 mb-4" />
      <div className="space-y-2">
        {RAPIDS_REQUIREMENTS.map((req, i) => (
          <div key={i} className="flex items-start gap-3 p-2 rounded-md bg-muted/30" data-testid={`rapids-req-${i}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${req.status === "complete" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>
              {req.status === "complete" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            </div>
            <div>
              <p className="text-sm font-medium">{req.requirement}</p>
              <p className="text-xs text-muted-foreground">{req.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function EmployerDashboardSection() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EMPLOYER_PARTNERS.map((emp) => (
          <Card key={emp.id} className="p-5" data-testid={`card-employer-detail-${emp.id}`}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <h3 className="font-semibold text-sm">{emp.name}</h3>
                <p className="text-xs text-muted-foreground">{emp.industry}</p>
              </div>
              <Badge variant="secondary" className="text-xs">{emp.activeApprentices + emp.completedApprentices} total</Badge>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-center">
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{emp.activeApprentices}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{emp.completedApprentices}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">
                  {emp.activeApprentices + emp.completedApprentices > 0
                    ? Math.round((emp.completedApprentices / (emp.activeApprentices + emp.completedApprentices)) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Completion</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {emp.trades.map((trade) => (
                <Badge key={trade} variant="outline" className="text-xs">{trade}</Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Contact: {emp.contactName} ({emp.contactEmail})</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function LogHoursDialog({ apprentices, onClose }: { apprentices: Apprentice[]; onClose: () => void }) {
  const [selectedApprentice, setSelectedApprentice] = useState("");
  const [hours, setHours] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="dialog-log-hours">
        <DialogHeader>
          <DialogTitle>Log Apprenticeship Hours</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Apprentice</label>
            <Select value={selectedApprentice} onValueChange={setSelectedApprentice}>
              <SelectTrigger data-testid="select-apprentice">
                <SelectValue placeholder="Select apprentice" />
              </SelectTrigger>
              <SelectContent>
                {apprentices.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name} - {a.trade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Hours</label>
            <Input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Enter hours worked"
              data-testid="input-hours"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              data-testid="input-date"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe work performed..."
              data-testid="input-notes"
            />
          </div>
          <Button className="w-full" onClick={onClose} data-testid="button-submit-hours">
            Log Hours
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MentorCheckinDialog({ apprentices, onClose }: { apprentices: Apprentice[]; onClose: () => void }) {
  const [selectedApprentice, setSelectedApprentice] = useState("");
  const [mentorName, setMentorName] = useState("");
  const [rating, setRating] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="dialog-mentor-checkin">
        <DialogHeader>
          <DialogTitle>Record Mentor Check-In</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Apprentice</label>
            <Select value={selectedApprentice} onValueChange={setSelectedApprentice}>
              <SelectTrigger data-testid="select-checkin-apprentice">
                <SelectValue placeholder="Select apprentice" />
              </SelectTrigger>
              <SelectContent>
                {apprentices.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name} - {a.trade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Mentor Name</label>
            <Input
              value={mentorName}
              onChange={(e) => setMentorName(e.target.value)}
              placeholder="Enter mentor name"
              data-testid="input-mentor-name"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Rating (1-5)</label>
            <Select value={rating} onValueChange={setRating}>
              <SelectTrigger data-testid="select-rating">
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Needs Improvement</SelectItem>
                <SelectItem value="2">2 - Below Expectations</SelectItem>
                <SelectItem value="3">3 - Meets Expectations</SelectItem>
                <SelectItem value="4">4 - Exceeds Expectations</SelectItem>
                <SelectItem value="5">5 - Outstanding</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Check-In Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Document progress, observations, and recommendations..."
              data-testid="input-checkin-notes"
            />
          </div>
          <Button className="w-full" onClick={onClose} data-testid="button-submit-checkin">
            Record Check-In
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ApprenticeshipTrackerPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [selectedApprentice, setSelectedApprentice] = useState<Apprentice | null>(null);
  const [showLogHours, setShowLogHours] = useState(false);
  const [showMentorCheckin, setShowMentorCheckin] = useState(false);

  const filteredApprentices = SAMPLE_APPRENTICES.filter((a) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.trade.toLowerCase().includes(search.toLowerCase()) && !a.employer.toLowerCase().includes(search.toLowerCase())) return false;
    if (stageFilter !== "all" && a.stage !== stageFilter) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" data-testid="section-apprenticeship-tracker">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PageHeader
          title="Apprenticeship Tracking System"
          description="Track registered apprenticeships, log hours, monitor competencies, and manage employer partnerships"
          icon={<Wrench className="h-7 w-7" />}
        />
      </div>

      <div className="flex gap-3 flex-wrap">
        <Button onClick={() => setShowLogHours(true)} data-testid="button-log-hours">
          <Plus className="h-4 w-4 mr-2" /> Log Hours
        </Button>
        <Button variant="outline" onClick={() => setShowMentorCheckin(true)} data-testid="button-mentor-checkin">
          <UserCheck className="h-4 w-4 mr-2" /> Mentor Check-In
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" data-testid="tab-main-dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="apprentices" data-testid="tab-main-apprentices">Apprentices</TabsTrigger>
          <TabsTrigger value="employers" data-testid="tab-main-employers">Employers</TabsTrigger>
          <TabsTrigger value="competencies" data-testid="tab-main-competencies">Competencies</TabsTrigger>
          <TabsTrigger value="compliance" data-testid="tab-main-compliance">RAPIDS</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <DashboardOverview apprentices={SAMPLE_APPRENTICES} />
        </TabsContent>

        <TabsContent value="apprentices" className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search apprentices by name, trade, or employer..."
                className="pl-9"
                data-testid="input-search-apprentices"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { value: "all", label: "All Stages" },
                { value: "pre-apprenticeship", label: "Pre-Apprenticeship" },
                { value: "registered", label: "Registered" },
                { value: "journeyworker", label: "Journeyworker" },
              ].map((f) => (
                <Badge
                  key={f.value}
                  variant={stageFilter === f.value ? "default" : "outline"}
                  className={`cursor-pointer ${stageFilter === f.value ? "bg-blue-600 text-white" : ""}`}
                  onClick={() => setStageFilter(f.value)}
                  data-testid={`filter-stage-${f.value}`}
                >
                  {f.label}
                </Badge>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground" data-testid="text-apprentice-count">
            {filteredApprentices.length} apprentice{filteredApprentices.length !== 1 ? "s" : ""}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="section-apprentice-grid">
            {filteredApprentices.map((apprentice) => (
              <ApprenticeCard
                key={apprentice.id}
                apprentice={apprentice}
                onClick={() => setSelectedApprentice(apprentice)}
              />
            ))}
          </div>

          {filteredApprentices.length === 0 && (
            <Card className="p-8 text-center" data-testid="card-no-apprentices">
              <Users className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No apprentices found matching your search.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="employers" className="mt-6">
          <EmployerDashboardSection />
        </TabsContent>

        <TabsContent value="competencies" className="mt-6">
          <CompetencyFrameworkSection />
        </TabsContent>

        <TabsContent value="compliance" className="mt-6">
          <RapidsComplianceSection />
        </TabsContent>
      </Tabs>

      {selectedApprentice && (
        <ApprenticeDetail
          apprentice={selectedApprentice}
          onClose={() => setSelectedApprentice(null)}
        />
      )}

      {showLogHours && (
        <LogHoursDialog
          apprentices={SAMPLE_APPRENTICES}
          onClose={() => setShowLogHours(false)}
        />
      )}

      {showMentorCheckin && (
        <MentorCheckinDialog
          apprentices={SAMPLE_APPRENTICES}
          onClose={() => setShowMentorCheckin(false)}
        />
      )}
    </div>
  );
}
