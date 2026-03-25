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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { TrainingGuideButton } from "@/components/training-guide";
import {
  Heart, Users, Shield, ClipboardCheck, MapPin, Phone,
  Calendar, Activity, ChevronRight, CheckCircle2, AlertTriangle,
  Clock, Home, FileText, Star, GraduationCap, BookOpen,
  Stethoscope, Brain, ExternalLink, Plus, TrendingUp,
  ArrowRight, Sparkles, Building2, UserCheck, Clipboard, Lightbulb,
} from "lucide-react";

interface ScreeningReferral {
  id: string;
  clientName: string;
  screeningType: string;
  referralDate: string;
  status: string;
  provider: string;
  notes: string;
  priority: string;
}

interface HomeVisit {
  id: string;
  clientName: string;
  visitDate: string;
  visitType: string;
  duration: number;
  notes: string;
  followUpNeeded: boolean;
  followUpDate: string | null;
}

interface CommunityResource {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  hours: string;
  description: string;
  acceptingClients: boolean;
}

interface TrainingModule {
  id: string;
  title: string;
  category: string;
  description: string;
  duration: string;
  status: string;
  completedDate: string | null;
}

const SAMPLE_CASELOAD = [
  { id: "cl-1", name: "Client A", status: "active", riskLevel: "moderate", lastContact: "2026-03-15", nextFollowUp: "2026-03-22", screeningsComplete: 3, screeningsTotal: 5, notes: "Needs housing referral" },
  { id: "cl-2", name: "Client B", status: "active", riskLevel: "low", lastContact: "2026-03-16", nextFollowUp: "2026-03-30", screeningsComplete: 5, screeningsTotal: 5, notes: "All screenings complete" },
  { id: "cl-3", name: "Client C", status: "active", riskLevel: "high", lastContact: "2026-03-10", nextFollowUp: "2026-03-18", screeningsComplete: 1, screeningsTotal: 5, notes: "Urgent: substance use concerns, family crisis" },
  { id: "cl-4", name: "Client D", status: "active", riskLevel: "moderate", lastContact: "2026-03-14", nextFollowUp: "2026-03-21", screeningsComplete: 2, screeningsTotal: 5, notes: "Transportation barrier to appointments" },
  { id: "cl-5", name: "Client E", status: "inactive", riskLevel: "low", lastContact: "2026-02-28", nextFollowUp: null, screeningsComplete: 5, screeningsTotal: 5, notes: "Graduated from program" },
];

const SAMPLE_VISITS = [
  { id: "hv-1", clientName: "Client C", visitDate: "2026-03-17", visitType: "Initial Assessment", duration: 60, notes: "Completed intake, identified immediate needs for food assistance and counseling referral.", followUpNeeded: true, followUpDate: "2026-03-19" },
  { id: "hv-2", clientName: "Client A", visitDate: "2026-03-15", visitType: "Follow-Up", duration: 45, notes: "Reviewed housing options, connected with shelter coordinator.", followUpNeeded: true, followUpDate: "2026-03-22" },
  { id: "hv-3", clientName: "Client D", visitDate: "2026-03-14", visitType: "Screening", duration: 30, notes: "Completed behavioral health screening. Moderate risk identified.", followUpNeeded: false, followUpDate: null },
];

const SAMPLE_RESOURCES: CommunityResource[] = [
  { id: "cr-1", name: "Community Health Center", category: "Primary Care", address: "123 Main St", phone: "(555) 123-4567", hours: "Mon-Fri 8am-6pm", description: "Sliding-scale primary care, behavioral health, dental", acceptingClients: true },
  { id: "cr-2", name: "Behavioral Health Services", category: "Mental Health", address: "456 Oak Ave", phone: "(555) 234-5678", hours: "Mon-Sat 9am-7pm", description: "Counseling, substance use treatment, crisis services", acceptingClients: true },
  { id: "cr-3", name: "Food Pantry & Nutrition Center", category: "Food Access", address: "789 Elm St", phone: "(555) 345-6789", hours: "Tue-Thu 10am-4pm", description: "Emergency food, nutrition education, SNAP enrollment assistance", acceptingClients: true },
  { id: "cr-4", name: "Housing Navigation Services", category: "Housing", address: "321 Pine Rd", phone: "(555) 456-7890", hours: "Mon-Fri 9am-5pm", description: "Rapid rehousing, emergency shelter referrals, landlord mediation", acceptingClients: false },
  { id: "cr-5", name: "Workforce Development Center", category: "Employment", address: "654 Cedar Blvd", phone: "(555) 567-8901", hours: "Mon-Fri 8am-5pm", description: "Job training, resume workshops, career counseling, GED programs", acceptingClients: true },
  { id: "cr-6", name: "WIC & Maternal Health", category: "Maternal Health", address: "987 Maple Dr", phone: "(555) 678-9012", hours: "Mon-Wed-Fri 8am-4pm", description: "WIC enrollment, prenatal care coordination, breastfeeding support", acceptingClients: true },
  { id: "cr-7", name: "Substance Use Prevention Center", category: "Prevention", address: "147 Birch Ln", phone: "(555) 789-0123", hours: "Mon-Fri 9am-6pm", description: "Prevention education, youth programs, naloxone training", acceptingClients: true },
  { id: "cr-8", name: "Legal Aid Society", category: "Legal", address: "258 Walnut St", phone: "(555) 890-1234", hours: "Mon-Thu 9am-5pm", description: "Free legal representation, immigration assistance, tenant rights", acceptingClients: true },
];

const SAMPLE_TRAININGS: TrainingModule[] = [
  { id: "tr-1", title: "CHW Core Competencies", category: "Foundational", description: "Comprehensive overview of the 10 CHW core competencies including communication, advocacy, and cultural mediation.", duration: "8 hours", status: "completed", completedDate: "2026-02-15" },
  { id: "tr-2", title: "Motivational Interviewing", category: "Skills", description: "Evidence-based communication technique to strengthen personal motivation for change.", duration: "6 hours", status: "completed", completedDate: "2026-03-01" },
  { id: "tr-3", title: "Behavioral Health First Aid", category: "Clinical", description: "Recognize signs of mental health and substance use disorders; provide initial help and guide to appropriate care.", duration: "8 hours", status: "in_progress", completedDate: null },
  { id: "tr-4", title: "Trauma-Informed Care", category: "Clinical", description: "Understanding trauma and its impact on health; applying trauma-informed principles in community settings.", duration: "4 hours", status: "not_started", completedDate: null },
  { id: "tr-5", title: "Health Equity & Social Determinants", category: "Knowledge", description: "Understanding how social, economic, and environmental factors affect health outcomes in communities.", duration: "4 hours", status: "not_started", completedDate: null },
  { id: "tr-6", title: "Chronic Disease Self-Management", category: "Clinical", description: "Stanford model for helping clients manage chronic conditions through goal-setting and action planning.", duration: "6 hours", status: "not_started", completedDate: null },
  { id: "tr-7", title: "Cultural Humility in Practice", category: "Foundational", description: "Ongoing self-reflection and culturally responsive practices for serving diverse communities.", duration: "3 hours", status: "completed", completedDate: "2026-01-20" },
  { id: "tr-8", title: "Naloxone Administration (OEND)", category: "Skills", description: "Opioid Education and Naloxone Distribution — recognizing overdose and administering naloxone.", duration: "2 hours", status: "not_started", completedDate: null },
  { id: "tr-9", title: "Community Needs Assessment", category: "Knowledge", description: "Methods for assessing community health needs including surveys, focus groups, and data analysis.", duration: "4 hours", status: "not_started", completedDate: null },
  { id: "tr-10", title: "Data Collection & Documentation", category: "Skills", description: "Best practices for client documentation, HIPAA compliance, and data entry for outcome tracking.", duration: "3 hours", status: "in_progress", completedDate: null },
];

function getRiskBadge(level: string) {
  switch (level) {
    case "low": return <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Low</Badge>;
    case "moderate": return <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Moderate</Badge>;
    case "high": return <Badge className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">High</Badge>;
    default: return <Badge variant="secondary" className="text-[10px]">{level}</Badge>;
  }
}

function getTrainingStatusBadge(status: string) {
  switch (status) {
    case "completed": return <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Completed</Badge>;
    case "in_progress": return <Badge className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">In Progress</Badge>;
    default: return <Badge variant="secondary" className="text-[10px]">Not Started</Badge>;
  }
}

export default function ChwDashboardPage() {
  useEffect(() => { document.title = "CHW Dashboard | ThriveUp"; }, []);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [trainingFilter, setTrainingFilter] = useState("all");

  const caseload = SAMPLE_CASELOAD;
  const visits = SAMPLE_VISITS;
  const resources = resourceFilter === "all" ? SAMPLE_RESOURCES : SAMPLE_RESOURCES.filter(r => r.category === resourceFilter);
  const resourceCategories = Array.from(new Set(SAMPLE_RESOURCES.map(r => r.category)));

  const trainings = trainingFilter === "all" ? SAMPLE_TRAININGS : SAMPLE_TRAININGS.filter(t => t.status === trainingFilter);
  const completedTrainings = SAMPLE_TRAININGS.filter(t => t.status === "completed").length;
  const totalTrainingHours = SAMPLE_TRAININGS.filter(t => t.status === "completed").reduce((sum, t) => sum + parseInt(t.duration), 0);

  const activeCases = caseload.filter(c => c.status === "active").length;
  const highRisk = caseload.filter(c => c.riskLevel === "high" && c.status === "active").length;
  const overdueFollowUps = caseload.filter(c => c.nextFollowUp && new Date(c.nextFollowUp) < new Date()).length;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto" data-testid="chw-dashboard-page">
      <PageHeader title="Community Health Worker Dashboard" breadcrumbs={[{ label: "CHW Dashboard" }]} />

      <div className="rounded-md bg-gradient-to-r from-teal-900 to-cyan-700 p-4 sm:p-6 lg:p-8 mb-8" data-testid="section-hero">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="rounded-md p-2.5 bg-white/10">
            <Heart className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white" data-testid="text-page-title">
            Community Health Worker Dashboard
          </h1>
          <TrainingGuideButton moduleId="chw-dashboard" />
        </div>
        <p className="text-teal-100 text-base sm:text-lg" data-testid="text-page-subtitle">
          Manage caseloads, track screenings, log home visits, connect to community resources, and build professional skills
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-6 flex-wrap" data-testid="tabs-chw">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="caseload" data-testid="tab-caseload">Caseload</TabsTrigger>
          <TabsTrigger value="visits" data-testid="tab-visits">Home Visits</TabsTrigger>
          <TabsTrigger value="resources" data-testid="tab-resources">Resources</TabsTrigger>
          <TabsTrigger value="training" data-testid="tab-training">Training</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="section-stats">
              <Card className="p-4 text-center" data-testid="stat-active-cases">
                <Users className="h-5 w-5 mx-auto text-teal-500 mb-1" />
                <p className="text-2xl font-bold">{activeCases}</p>
                <p className="text-xs text-muted-foreground">Active Cases</p>
              </Card>
              <Card className="p-4 text-center" data-testid="stat-high-risk">
                <AlertTriangle className="h-5 w-5 mx-auto text-red-500 mb-1" />
                <p className="text-2xl font-bold">{highRisk}</p>
                <p className="text-xs text-muted-foreground">High Risk</p>
              </Card>
              <Card className="p-4 text-center" data-testid="stat-visits-month">
                <Home className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                <p className="text-2xl font-bold">{visits.length}</p>
                <p className="text-xs text-muted-foreground">Visits This Month</p>
              </Card>
              <Card className="p-4 text-center" data-testid="stat-training-hours">
                <GraduationCap className="h-5 w-5 mx-auto text-violet-500 mb-1" />
                <p className="text-2xl font-bold">{totalTrainingHours}h</p>
                <p className="text-xs text-muted-foreground">Training Hours</p>
              </Card>
            </div>

            {overdueFollowUps > 0 && (
              <Card className="p-4 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20" data-testid="alert-overdue">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">{overdueFollowUps} overdue follow-up{overdueFollowUps > 1 ? "s" : ""}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Review your caseload and schedule follow-up visits.</p>
                  </div>
                  <Button size="sm" variant="outline" className="ml-auto shrink-0" onClick={() => setActiveTab("caseload")} data-testid="button-view-overdue">
                    View <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-5" data-testid="card-quick-actions">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" /> Quick Actions
                </h3>
                <div className="space-y-2">
                  {[
                    { label: "Log Home Visit", icon: Home, tab: "visits" },
                    { label: "View Caseload", icon: Users, tab: "caseload" },
                    { label: "Find Resources", icon: MapPin, tab: "resources" },
                    { label: "Continue Training", icon: GraduationCap, tab: "training" },
                  ].map((action, i) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={i}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setActiveTab(action.tab)}
                        data-testid={`button-quick-${action.tab}`}
                      >
                        <Icon className="h-4 w-4 mr-2" /> {action.label}
                      </Button>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-5" data-testid="card-training-progress">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-violet-500" /> Training Progress
                </h3>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Modules Completed</span>
                    <span className="font-semibold">{completedTrainings}/{SAMPLE_TRAININGS.length}</span>
                  </div>
                  <Progress value={(completedTrainings / SAMPLE_TRAININGS.length) * 100} className="h-2" data-testid="progress-training" />
                </div>
                <div className="space-y-2">
                  {SAMPLE_TRAININGS.filter(t => t.status === "in_progress").map(t => (
                    <div key={t.id} className="flex items-center gap-2 text-sm" data-testid={`text-training-inprogress-${t.id}`}>
                      <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card className="p-5" data-testid="card-priority-clients">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Priority Clients
              </h3>
              <div className="space-y-2">
                {caseload.filter(c => c.status === "active" && (c.riskLevel === "high" || c.riskLevel === "moderate")).map(client => (
                  <Card key={client.id} className="p-3" data-testid={`card-priority-client-${client.id}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <UserCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium truncate">{client.name}</span>
                        {getRiskBadge(client.riskLevel)}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{client.screeningsComplete}/{client.screeningsTotal} screenings</span>
                      </div>
                    </div>
                    {client.notes && (
                      <p className="text-xs text-muted-foreground mt-1 pl-6">{client.notes}</p>
                    )}
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="caseload">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Active Caseload ({activeCases} clients)</h3>
            </div>
            <div className="space-y-3" data-testid="section-caseload">
              {caseload.map(client => (
                <Card key={client.id} className="p-4" data-testid={`card-client-${client.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold">{client.name}</p>
                        {getRiskBadge(client.riskLevel)}
                        <Badge variant={client.status === "active" ? "default" : "secondary"} className="text-[10px]">{client.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Last: {new Date(client.lastContact).toLocaleDateString()}</span>
                        </div>
                        {client.nextFollowUp && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Next: {new Date(client.nextFollowUp).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <ClipboardCheck className="h-3 w-3" />
                          <span>{client.screeningsComplete}/{client.screeningsTotal} screenings</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress value={(client.screeningsComplete / client.screeningsTotal) * 100} className="h-1.5" />
                      </div>
                      {client.notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic">{client.notes}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="visits">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Home Visit Log</h3>
            </div>
            <div className="space-y-3" data-testid="section-visits">
              {visits.map(visit => (
                <Card key={visit.id} className="p-4" data-testid={`card-visit-${visit.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-semibold">{visit.clientName}</p>
                        <Badge variant="secondary" className="text-[10px]">{visit.visitType}</Badge>
                        <span className="text-xs text-muted-foreground">{visit.duration} min</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(visit.visitDate).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground mt-2">{visit.notes}</p>
                      {visit.followUpNeeded && visit.followUpDate && (
                        <div className="flex items-center gap-1 mt-2 text-xs">
                          <Clock className="h-3 w-3 text-amber-500" />
                          <span className="text-amber-600 dark:text-amber-400">Follow-up: {new Date(visit.followUpDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-5" data-testid="card-visit-tips">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" /> Home Visit Best Practices
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { tip: "Start with rapport building — ask how they're doing before business", icon: Heart },
                  { tip: "Document everything during or immediately after the visit", icon: Clipboard },
                  { tip: "Use motivational interviewing techniques for behavior change", icon: Brain },
                  { tip: "Always have a safety plan and check in with your supervisor", icon: Shield },
                  { tip: "Bring resource materials in the client's preferred language", icon: BookOpen },
                  { tip: "Follow up on referrals made during previous visits", icon: CheckCircle2 },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-2 text-sm" data-testid={`text-tip-${i}`}>
                      <Icon className="h-3.5 w-3.5 text-teal-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{item.tip}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger className="w-48" data-testid="select-resource-filter">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {resourceCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">{resources.length} resources</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="section-resources">
              {resources.map(resource => (
                <Card key={resource.id} className="p-4" data-testid={`card-resource-${resource.id}`}>
                  <div className="flex items-start gap-3">
                    <div className="rounded-md p-2 bg-teal-100 dark:bg-teal-900/30 shrink-0">
                      <Building2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm truncate">{resource.name}</h4>
                        {resource.acceptingClients ? (
                          <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 shrink-0">Accepting</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] shrink-0">Waitlist</Badge>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px] mb-2">{resource.category}</Badge>
                      <p className="text-xs text-muted-foreground">{resource.description}</p>
                      <div className="grid grid-cols-1 gap-1 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span>{resource.address}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span>{resource.phone}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>{resource.hours}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-4 text-center" data-testid="card-resource-finder-cta">
              <p className="text-sm text-muted-foreground mb-3">Need to find more community resources?</p>
              <a href="/resources">
                <Button variant="outline" size="sm" data-testid="button-open-resource-finder">
                  <MapPin className="h-4 w-4 mr-1" /> Open Resource Finder
                </Button>
              </a>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="training">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={trainingFilter} onValueChange={setTrainingFilter}>
                <SelectTrigger className="w-44" data-testid="select-training-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                </SelectContent>
              </Select>
              <div className="ml-auto flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{completedTrainings}/{SAMPLE_TRAININGS.length} complete</span>
                <Progress value={(completedTrainings / SAMPLE_TRAININGS.length) * 100} className="w-24 h-2" />
              </div>
            </div>

            <div className="space-y-3" data-testid="section-trainings">
              {trainings.map(training => (
                <Card key={training.id} className="p-4" data-testid={`card-training-${training.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="rounded-md p-2 bg-violet-100 dark:bg-violet-900/30 shrink-0">
                        <GraduationCap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-semibold text-sm">{training.title}</h4>
                          {getTrainingStatusBadge(training.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">{training.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {training.duration}
                          </span>
                          <Badge variant="outline" className="text-[10px]">{training.category}</Badge>
                          {training.completedDate && (
                            <span>Completed: {new Date(training.completedDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-5" data-testid="card-certification-info">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" /> CHW Certification Pathway
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Complete the required training modules to earn your CHW certification. Many states now recognize CHW certification for Medicaid reimbursement.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { title: "Core Competencies", hours: "80 hours", desc: "Foundation skills for community health work" },
                  { title: "Supervised Practicum", hours: "40 hours", desc: "Field experience under certified CHW" },
                  { title: "Continuing Education", hours: "20 hours/year", desc: "Annual CE requirements for recertification" },
                ].map((req, i) => (
                  <div key={i} className="p-3 rounded-md bg-muted/30" data-testid={`text-cert-req-${i}`}>
                    <p className="text-sm font-medium">{req.title}</p>
                    <p className="text-xs text-muted-foreground">{req.hours}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{req.desc}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
