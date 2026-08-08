import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GraduationCap, DollarSign, FileText, Calendar, Search, CheckCircle2,
  ChevronRight, ChevronLeft, BookOpen, Landmark, Briefcase, Clock,
  AlertCircle, Star, Users, Building2, Award, Target, ArrowRight,
  ClipboardCheck, Shield, Info, Sparkles, HandHeart, MapPin,
  MessageSquare, Loader2, Cpu, ExternalLink, BarChart3, Compass,
  Route, Heart, Hammer, LayoutDashboard, Send, Zap
} from "lucide-react";

const AID_TYPES = [
  {
    id: "pell",
    name: "Pell Grant",
    type: "Grant (Free Money)",
    icon: Sparkles,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    maxAmount: "$7,395/year",
    description: "Federal grant for undergraduate students with exceptional financial need. You do NOT have to pay this back.",
    eligibility: ["Demonstrate financial need (EFC/SAI below threshold)", "Be an undergraduate student", "Be enrolled at least half-time", "U.S. citizen or eligible noncitizen", "Have a valid Social Security number"],
    tips: "Apply early — Pell Grants are first-come, first-served at some schools. File your FAFSA as soon as it opens (October 1)."
  },
  {
    id: "loans",
    name: "Federal Student Loans",
    type: "Loan (Must Repay)",
    icon: Landmark,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    maxAmount: "$5,500-$12,500/year",
    description: "Low-interest loans from the federal government. Subsidized loans don't accrue interest while you're in school.",
    eligibility: ["Complete FAFSA", "Be enrolled at least half-time", "Maintain satisfactory academic progress", "Not be in default on other federal loans"],
    tips: "Always take subsidized loans before unsubsidized. The government pays the interest while you're in school."
  },
  {
    id: "workstudy",
    name: "Federal Work-Study",
    type: "Employment (Earn Money)",
    icon: Briefcase,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    maxAmount: "Varies by school",
    description: "Part-time employment program for students with financial need. Jobs are often on campus or with approved community partners.",
    eligibility: ["Demonstrate financial need via FAFSA", "Be enrolled at least half-time", "Maintain satisfactory academic progress"],
    tips: "Work-study jobs often relate to your field of study. Ask your financial aid office about available positions early."
  },
  {
    id: "state",
    name: "Texas State Aid (TEXAS Grant)",
    type: "Grant (Free Money)",
    icon: MapPin,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    maxAmount: "Up to $10,000/year",
    description: "The TEXAS Grant provides aid to Texas residents attending public universities. The Texas Educational Opportunity Grant covers community colleges.",
    eligibility: ["Texas resident", "Demonstrate financial need", "Enrolled at a Texas public institution", "Complete recommended or distinguished high school program", "Register for Selective Service (if required)"],
    tips: "File your TASFA (Texas Application for State Financial Aid) if you're not eligible for FAFSA."
  },
  {
    id: "institutional",
    name: "Institutional Aid",
    type: "Scholarship/Grant (Free Money)",
    icon: Building2,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
    maxAmount: "Varies widely",
    description: "Many colleges offer their own scholarships and grants based on merit, need, or specific criteria. Some require separate applications.",
    eligibility: ["Admission to the institution", "May require separate scholarship applications", "May require maintaining a specific GPA", "Some are need-based, others merit-based"],
    tips: "Contact your school's financial aid office directly. Many institutional scholarships go unclaimed because students don't know to apply."
  },
];

const CHECKLIST_ITEMS = [
  { id: "fsa-id", category: "FSA ID Setup", label: "Create your FSA ID at studentaid.gov", description: "You'll need an email address, Social Security number, and date of birth. Your parent/guardian also needs one if you're a dependent.", priority: "high" },
  { id: "fsa-parent", category: "FSA ID Setup", label: "Parent/guardian creates their FSA ID", description: "If you're under 24 and a dependent student, at least one parent must also create an FSA ID to sign the FAFSA.", priority: "high" },
  { id: "ssn", category: "Personal Documents", label: "Social Security number (yours and parents')", description: "Required for identity verification and matching tax records.", priority: "high" },
  { id: "drivers-license", category: "Personal Documents", label: "Driver's license or state ID number", description: "Optional but speeds up the process.", priority: "medium" },
  { id: "tax-returns", category: "Financial Documents", label: "Federal income tax returns (IRS Form 1040)", description: "You'll need your (and your parents') most recent federal tax return. The IRS Data Retrieval Tool can auto-fill this.", priority: "high" },
  { id: "w2", category: "Financial Documents", label: "W-2 forms and other income records", description: "Gather all W-2s from employers for you and your parents.", priority: "high" },
  { id: "untaxed-income", category: "Financial Documents", label: "Records of untaxed income", description: "Child support received, interest income, veterans benefits, military/clergy allowances.", priority: "medium" },
  { id: "bank-statements", category: "Financial Documents", label: "Bank statements and investment records", description: "Current balance of savings, checking, and investment accounts.", priority: "medium" },
  { id: "alien-reg", category: "Personal Documents", label: "Alien registration number (if not U.S. citizen)", description: "Required for eligible noncitizens — permanent residents, refugees, asylum seekers.", priority: "medium" },
  { id: "dependency", category: "Dependency Status", label: "Determine your dependency status", description: "If you're under 24 and not married, not a veteran, and not supporting dependents, you're likely a dependent student.", priority: "high" },
  { id: "school-list", category: "School Selection", label: "List of schools you're considering (up to 20)", description: "You can list up to 20 schools on the FAFSA. Each will receive your financial information to create an aid offer.", priority: "high" },
  { id: "selective-service", category: "Personal Documents", label: "Selective Service registration (males 18-25)", description: "Males must register with Selective Service to receive federal student aid.", priority: "medium" },
];

const TIMELINE_EVENTS = [
  { month: "October 1", title: "FAFSA Opens", description: "File as early as possible! Some aid is first-come, first-served.", type: "deadline", priority: "critical" },
  { month: "October - December", title: "Complete & Submit FAFSA", description: "Use the IRS Data Retrieval Tool to import tax info. List all schools you're considering.", type: "action", priority: "high" },
  { month: "January 15", title: "Texas Priority Deadline", description: "File by this date to receive priority consideration for Texas state financial aid (TEXAS Grant, TEOG).", type: "deadline", priority: "critical" },
  { month: "February - March", title: "Review Student Aid Report (SAR)", description: "You'll receive your SAR within 3-5 days of filing. Review it for accuracy and make corrections if needed.", type: "action", priority: "high" },
  { month: "March 15", title: "Many Institutional Scholarship Deadlines", description: "Check each school's deadline for institutional scholarships. Some require separate applications.", type: "deadline", priority: "high" },
  { month: "March - April", title: "Receive Financial Aid Award Letters", description: "Schools send award letters showing your aid package. Compare offers carefully.", type: "milestone", priority: "high" },
  { month: "April - May", title: "Compare & Accept Aid Offers", description: "Compare net cost across schools. Accept, reduce, or decline each type of aid offered.", type: "action", priority: "high" },
  { month: "May 1", title: "National College Decision Day", description: "Commit to your chosen school and submit enrollment deposit.", type: "deadline", priority: "critical" },
  { month: "June", title: "Complete Loan Entrance Counseling", description: "If accepting federal loans, complete entrance counseling and sign your Master Promissory Note at studentaid.gov.", type: "action", priority: "medium" },
  { month: "July - August", title: "Verify Final Aid & Register for Classes", description: "Confirm your aid is finalized. Some students may be selected for FAFSA verification — respond promptly.", type: "action", priority: "medium" },
  { month: "Next October", title: "Renew FAFSA for Next Year", description: "FAFSA must be filed every year! The renewal form pre-fills prior year data.", type: "deadline", priority: "high" },
];

const SCHOLARSHIPS = [
  { name: "Gates Scholarship", amount: "Full ride", deadline: "September 15", demographics: ["Low-income", "Minority", "First-generation"], gpa: "3.3+", interests: ["Any field"], description: "Covers full cost of attendance for exceptional minority students with financial need." },
  { name: "Dell Scholars Program", amount: "$20,000", deadline: "December 1", demographics: ["Low-income", "First-generation"], gpa: "2.4+", interests: ["Any field"], description: "For students who have overcome significant obstacles. Includes laptop, textbook credits, and support services." },
  { name: "Hispanic Scholarship Fund", amount: "Up to $5,000", deadline: "February 15", demographics: ["Hispanic/Latino"], gpa: "3.0+", interests: ["Any field"], description: "Awards to Hispanic students pursuing a degree at accredited institutions." },
  { name: "United Negro College Fund", amount: "Varies", deadline: "Rolling", demographics: ["African American"], gpa: "2.5+", interests: ["Any field"], description: "Multiple scholarship programs for African American students at UNCF member institutions." },
  { name: "TEXAS Grant", amount: "Up to $10,000/year", deadline: "January 15 (FAFSA)", demographics: ["Texas resident"], gpa: "2.5+", interests: ["Any field"], description: "State grant for Texas residents attending public universities. Need-based." },
  { name: "Terry Foundation Scholarship", amount: "Full tuition + living", deadline: "Varies by school", demographics: ["Texas resident"], gpa: "3.0+", interests: ["Leadership"], description: "One of the largest private scholarship programs in Texas. Full tuition, fees, room, board, and stipend." },
  { name: "Ron Brown Scholar Program", amount: "$40,000", deadline: "January 9", demographics: ["African American"], gpa: "3.0+", interests: ["Community service", "Leadership"], description: "For academically talented and community-minded African American students." },
  { name: "Amazon Future Engineer Scholarship", amount: "$40,000", deadline: "January", demographics: ["Low-income", "First-generation"], gpa: "3.0+", interests: ["Computer Science", "Engineering"], description: "For students pursuing computer science degrees. Includes a paid internship at Amazon." },
  { name: "Jack Kent Cooke Foundation", amount: "Up to $55,000/year", deadline: "November", demographics: ["Low-income"], gpa: "3.5+", interests: ["Any field"], description: "For high-achieving students with financial need transferring from community colleges." },
  { name: "QuestBridge National College Match", amount: "Full ride", deadline: "September 27", demographics: ["Low-income"], gpa: "3.5+", interests: ["Any field"], description: "Matches outstanding low-income students with full scholarships at top colleges." },
  { name: "Coca-Cola Scholars Program", amount: "$20,000", deadline: "October 31", demographics: ["Any"], gpa: "3.0+", interests: ["Leadership", "Community service"], description: "For high school seniors who demonstrate leadership and service." },
  { name: "Austin Community Foundation", amount: "Varies", deadline: "March", demographics: ["Central Texas resident"], gpa: "Varies", interests: ["Various"], description: "Multiple scholarship funds for Central Texas residents across many categories." },
];

const INCOME_BRACKETS = [
  { label: "Under $20,000", value: "under20k", pellEstimate: "$7,395", totalEstimate: "$12,000 - $20,000" },
  { label: "$20,000 - $30,000", value: "20k-30k", pellEstimate: "$6,500 - $7,395", totalEstimate: "$10,000 - $18,000" },
  { label: "$30,000 - $40,000", value: "30k-40k", pellEstimate: "$4,500 - $6,500", totalEstimate: "$8,000 - $15,000" },
  { label: "$40,000 - $50,000", value: "40k-50k", pellEstimate: "$2,500 - $4,500", totalEstimate: "$6,000 - $12,000" },
  { label: "$50,000 - $60,000", value: "50k-60k", pellEstimate: "$1,000 - $2,500", totalEstimate: "$4,000 - $10,000" },
  { label: "$60,000 - $75,000", value: "60k-75k", pellEstimate: "$0 - $1,000", totalEstimate: "$2,000 - $8,000" },
  { label: "Over $75,000", value: "over75k", pellEstimate: "Likely $0", totalEstimate: "$0 - $5,000" },
];

const SCHOOL_TYPES = [
  { label: "Community College (2-year)", value: "community", avgCost: "$4,000 - $8,000/year" },
  { label: "Public University (in-state)", value: "public-in", avgCost: "$10,000 - $15,000/year" },
  { label: "Public University (out-of-state)", value: "public-out", avgCost: "$22,000 - $40,000/year" },
  { label: "Private University", value: "private", avgCost: "$35,000 - $55,000/year" },
  { label: "Trade/Technical School", value: "trade", avgCost: "$5,000 - $15,000/year" },
];

interface EstimatorData {
  incomeBracket: string;
  schoolType: string;
  householdSize: string;
  isFirstGen: boolean;
  isMinority: boolean;
  county: string;
}

const PROCESS_STEPS = [
  { key: "explore", label: "Explore Aid Types", icon: Search, description: "Learn about grants, loans, work-study, and scholarships", produces: "Knowledge of all aid options available to you" },
  { key: "readiness", label: "Check Readiness", icon: ClipboardCheck, description: "Gather documents and verify eligibility requirements", produces: "A completed checklist of everything you need to file" },
  { key: "estimate", label: "Estimate Award", icon: Target, description: "Calculate your expected financial aid package", produces: "Estimated Pell Grant, total aid, and net cost of attendance" },
  { key: "scholarships", label: "Find Scholarships", icon: Award, description: "Match with scholarships based on your profile", produces: "A personalized list of scholarships you qualify for" },
  { key: "apply", label: "Apply", icon: FileText, description: "Submit your FAFSA and scholarship applications", produces: "Submitted FAFSA and pending scholarship applications" },
  { key: "track", label: "Track Status", icon: BarChart3, description: "Monitor your applications and award letters", produces: "Real-time status of all your financial aid applications" },
];

const WIZARD_STEPS = [
  { key: "welcome", label: "Welcome", icon: GraduationCap },
  { key: "aid-types", label: "Aid Types", icon: DollarSign },
  { key: "checklist", label: "Readiness", icon: ClipboardCheck },
  { key: "estimator", label: "Estimator", icon: Target },
  { key: "scholarships", label: "Scholarships", icon: Award },
  { key: "timeline", label: "Timeline", icon: Calendar },
];

interface AIAdvisorResponse {
  answer: string;
  engines: Array<{ engine: string; model: string; responseTimeMs: number; hasResponse: boolean; error?: string }>;
  ragContext?: { documentsUsed: number; topics: string[] };
  frameworks?: string[];
  consensusMethod?: string;
  totalTimeMs?: number;
}

function ExampleCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-dashed border-2 border-amber-400 dark:border-amber-600 bg-amber-50/30 dark:bg-amber-950/10" data-testid={`card-example-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <Badge variant="outline" className="shrink-0 border-amber-500 text-amber-700 dark:text-amber-400">EXAMPLE</Badge>
          <div>
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FafsaNavigatorPage() {
  const [activeTab, setActiveTab] = useState("wizard");
  const isFosterMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("audience") === "foster";
  const [wizardStep, setWizardStep] = useState(0);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [estimatorData, setEstimatorData] = useState<EstimatorData>({
    incomeBracket: "",
    schoolType: "",
    householdSize: "4",
    isFirstGen: false,
    isMinority: false,
    county: "",
  });
  const [scholarshipFilters, setScholarshipFilters] = useState({
    demographics: "",
    interest: "",
    minGpa: "",
  });
  const [expandedAid, setExpandedAid] = useState<string | null>(null);
  const [activeProcessStep, setActiveProcessStep] = useState<string | null>(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState<AIAdvisorResponse | null>(null);
  const [aiHistory, setAiHistory] = useState<Array<{ question: string; response: AIAdvisorResponse }>>([]);

  const aiMutation = useMutation({
    mutationFn: async (question: string) => {
      const res = await apiRequest("POST", "/api/fafsa/ai-advisor", {
        question,
        studentProfile: {
          incomeBracket: estimatorData.incomeBracket || undefined,
          county: estimatorData.county || undefined,
          firstGen: estimatorData.isFirstGen,
          schoolType: estimatorData.schoolType || undefined,
        },
      });
      return res.json() as Promise<AIAdvisorResponse>;
    },
    onSuccess: (data) => {
      setAiResponse(data);
      setAiHistory(prev => [...prev, { question: aiQuestion, response: data }]);
      setAiQuestion("");
    },
  });

  const handleAskAI = () => {
    if (!aiQuestion.trim()) return;
    aiMutation.mutate(aiQuestion.trim());
  };

  const toggleCheckItem = (id: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const checklistProgress = Math.round((checkedItems.size / CHECKLIST_ITEMS.length) * 100);

  const selectedBracket = INCOME_BRACKETS.find(b => b.value === estimatorData.incomeBracket);
  const selectedSchool = SCHOOL_TYPES.find(s => s.value === estimatorData.schoolType);

  const filteredScholarships = useMemo(() => {
    return SCHOLARSHIPS.filter(s => {
      if (scholarshipFilters.demographics && !s.demographics.some(d => d.toLowerCase().includes(scholarshipFilters.demographics.toLowerCase()))) return false;
      if (scholarshipFilters.interest && !s.interests.some(i => i.toLowerCase().includes(scholarshipFilters.interest.toLowerCase()))) return false;
      return true;
    });
  }, [scholarshipFilters]);

  const wizardProgress = Math.round(((wizardStep + 1) / WIZARD_STEPS.length) * 100);

  const groupedChecklist = useMemo(() => {
    const groups: Record<string, typeof CHECKLIST_ITEMS> = {};
    CHECKLIST_ITEMS.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-background dark:from-blue-950/10 dark:to-background" data-testid="page-fafsa-navigator">
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-fafsa-title">FAFSA & Financial Aid Navigator</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your step-by-step guide to understanding, applying for, and maximizing financial aid for college.
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline">ThriveUp Academy</Badge>
            <Badge variant="outline">The Collaborative Advocate Foundation</Badge>
            <Badge variant="secondary">5-County Service Area</Badge>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-100 flex items-start gap-2" data-testid="banner-facts-source">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Aid amounts, income brackets, deadlines, and scholarship details on this page are <strong>reference examples last reviewed August 2026</strong> and can change each year. Always confirm current figures and deadlines at the official source of truth,{" "}
            <a href="https://studentaid.gov" target="_blank" rel="noreferrer" className="underline font-semibold">studentaid.gov</a>.
          </span>
        </div>

        <Card className="mb-6" data-testid="card-process-flow">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3">YOUR FINANCIAL AID JOURNEY</p>
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {PROCESS_STEPS.map((step, i) => {
                const Icon = step.icon;
                const isActive = activeProcessStep === step.key;
                return (
                  <div key={step.key} className="flex items-center shrink-0">
                    <button
                      onClick={() => setActiveProcessStep(isActive ? null : step.key)}
                      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                        isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                      }`}
                      data-testid={`button-process-${step.key}`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-[10px] font-medium whitespace-nowrap">{step.label}</span>
                    </button>
                    {i < PROCESS_STEPS.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0 mx-0.5" />
                    )}
                  </div>
                );
              })}
            </div>
            {activeProcessStep && (
              <div className="mt-3 pt-3 border-t" data-testid={`text-process-detail-${activeProcessStep}`}>
                {(() => {
                  const step = PROCESS_STEPS.find(s => s.key === activeProcessStep);
                  if (!step) return null;
                  return (
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                        <step.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{step.label}</p>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                        <p className="text-xs mt-1"><span className="font-medium">Produces:</span> {step.produces}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        {isFosterMode && (
          <div className="rounded-lg border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4 mb-4" data-testid="callout-foster-mode" data-page-testid="page-fafsa-navigator">
            <div className="flex items-start gap-3">
              <HandHeart className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-1" data-testid="text-foster-mode-title">Foster Youth Mode — Independent Student + ETV pathway</h3>
                <p className="text-sm text-amber-900 dark:text-amber-100 mb-2" data-testid="text-foster-mode-body">
                  If you spent any time in foster care after age 13, you file FAFSA as an <strong>independent student</strong> — your parents' income does not count. On top of Pell Grant, you may also qualify for the <strong>Education and Training Voucher (ETV)</strong> — up to <strong>$5,000/year through age 26</strong>. Combine both for the strongest aid package.
                </p>
                <ul className="text-sm text-amber-900 dark:text-amber-100 list-disc pl-5 space-y-1" data-testid="list-foster-mode-actions">
                  <li>On FAFSA, answer <strong>YES</strong> to: "Were you in foster care, an orphan, or a ward of the court at any time since you turned 13?"</li>
                  <li>Apply for ETV through your state ETV coordinator or <a href="https://www.fc2success.org/programs/education-training-voucher-program/" target="_blank" rel="noreferrer" className="underline">Foster Care to Success</a>.</li>
                  <li>If you're in Texas: combine with the <strong>Texas Tuition and Fee Waiver</strong> (Texas Education Code §54.366) for any Texas public college.</li>
                  <li>See your full rights at <a href="/foster-youth/rights" className="underline">Foster Youth — My Rights</a>.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard" className="gap-1">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="wizard" data-testid="tab-wizard" className="gap-1">
              <BookOpen className="h-4 w-4" /> Guide
            </TabsTrigger>
            <TabsTrigger value="checklist" data-testid="tab-checklist" className="gap-1">
              <ClipboardCheck className="h-4 w-4" /> Checklist
            </TabsTrigger>
            <TabsTrigger value="estimator" data-testid="tab-estimator" className="gap-1">
              <Target className="h-4 w-4" /> Estimator
            </TabsTrigger>
            <TabsTrigger value="scholarships" data-testid="tab-scholarships" className="gap-1">
              <Award className="h-4 w-4" /> Scholarships
            </TabsTrigger>
            <TabsTrigger value="ai-advisor" data-testid="tab-ai-advisor" className="gap-1">
              <MessageSquare className="h-4 w-4" /> AI Advisor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2" data-testid="text-dashboard-title">
              <LayoutDashboard className="h-5 w-5" /> Your Financial Aid Dashboard
            </h2>
            <p className="text-sm text-muted-foreground">A holistic view of your financial aid journey progress and opportunities.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Card data-testid="card-dashboard-estimated-aid">
                <CardContent className="pt-4 pb-4 text-center">
                  <DollarSign className="h-6 w-6 mx-auto text-green-600 mb-1" />
                  <p className="text-xs text-muted-foreground">Total Estimated Aid</p>
                  <p className="text-xl font-bold text-green-600" data-testid="text-dashboard-total-aid">
                    {selectedBracket ? selectedBracket.totalEstimate : "Complete estimator"}
                  </p>
                </CardContent>
              </Card>
              <Card data-testid="card-dashboard-scholarships">
                <CardContent className="pt-4 pb-4 text-center">
                  <Award className="h-6 w-6 mx-auto text-amber-600 mb-1" />
                  <p className="text-xs text-muted-foreground">Scholarship Matches</p>
                  <p className="text-xl font-bold text-amber-600" data-testid="text-dashboard-scholarship-count">
                    {filteredScholarships.length}
                  </p>
                </CardContent>
              </Card>
              <Card data-testid="card-dashboard-readiness">
                <CardContent className="pt-4 pb-4 text-center">
                  <ClipboardCheck className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                  <p className="text-xs text-muted-foreground">Readiness Completion</p>
                  <p className="text-xl font-bold text-blue-600" data-testid="text-dashboard-readiness-pct">
                    {checklistProgress}%
                  </p>
                </CardContent>
              </Card>
              <Card data-testid="card-dashboard-pell">
                <CardContent className="pt-4 pb-4 text-center">
                  <Sparkles className="h-6 w-6 mx-auto text-purple-600 mb-1" />
                  <p className="text-xs text-muted-foreground">Est. Pell Grant</p>
                  <p className="text-xl font-bold text-purple-600" data-testid="text-dashboard-pell">
                    {selectedBracket ? selectedBracket.pellEstimate : "--"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card data-testid="card-dashboard-summary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Compass className="h-4 w-4" /> Your Financial Aid Picture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm">FAFSA Readiness</span>
                    <span className="text-sm font-medium">{checkedItems.size}/{CHECKLIST_ITEMS.length} items</span>
                  </div>
                  <Progress value={checklistProgress} className="h-2" data-testid="progress-dashboard-readiness" />
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-sm">Income Bracket</span>
                  <Badge variant="outline" data-testid="text-dashboard-income">{estimatorData.incomeBracket ? INCOME_BRACKETS.find(b => b.value === estimatorData.incomeBracket)?.label : "Not set"}</Badge>
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-sm">School Type</span>
                  <Badge variant="outline" data-testid="text-dashboard-school">{estimatorData.schoolType ? SCHOOL_TYPES.find(s => s.value === estimatorData.schoolType)?.label : "Not set"}</Badge>
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-sm">First-Generation</span>
                  <Badge variant={estimatorData.isFirstGen ? "default" : "outline"} data-testid="text-dashboard-firstgen">{estimatorData.isFirstGen ? "Yes" : "No"}</Badge>
                </div>
                {estimatorData.isFirstGen && (
                  <div className="flex items-start gap-2 bg-green-50 dark:bg-green-950/20 rounded-md p-3">
                    <HandHeart className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <p className="text-xs">First-generation students often qualify for additional scholarships and support programs. Check the Scholarships tab for matches.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <ExampleCard
              title="Application Tracker"
              description="This is an example — the real version would show live status updates for each FAFSA submission, scholarship application, and award letter. To enable this, connect your StudentAid.gov FSA ID and let the system track your progress automatically."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card className="hover-elevate" data-testid="card-dashboard-next-deadline">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 h-10 w-10 rounded-md bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Next Deadline</p>
                      <p className="font-semibold text-sm">Texas Priority Deadline</p>
                      <p className="text-xs text-muted-foreground">January 15 — File FAFSA by this date</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover-elevate" data-testid="card-dashboard-quick-action">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 h-10 w-10 rounded-md bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Quick Action</p>
                      <p className="font-semibold text-sm">
                        {checklistProgress < 100 ? "Complete your readiness checklist" : "You're ready to file!"}
                      </p>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab("checklist")} data-testid="button-dashboard-go-checklist" className="mt-1">
                        {checklistProgress < 100 ? "Go to Checklist" : "Review Checklist"} <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card data-testid="card-cross-page-links">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Route className="h-4 w-4" /> Connected Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Link href="/apprenticeship-tracker">
                    <Button variant="outline" className="w-full justify-start gap-2" data-testid="link-career-pathways">
                      <Briefcase className="h-4 w-4" /> View Career Pathways <ExternalLink className="h-3 w-3 ml-auto" />
                    </Button>
                  </Link>
                  <Link href="/benefits-screener">
                    <Button variant="outline" className="w-full justify-start gap-2" data-testid="link-benefits-eligibility">
                      <Heart className="h-4 w-4" /> Check Benefits Eligibility <ExternalLink className="h-3 w-3 ml-auto" />
                    </Button>
                  </Link>
                  <Link href="/workforce-dashboard">
                    <Button variant="outline" className="w-full justify-start gap-2" data-testid="link-workforce-options">
                      <Hammer className="h-4 w-4" /> Explore Workforce Options <ExternalLink className="h-3 w-3 ml-auto" />
                    </Button>
                  </Link>
                  <Link href="/transition-plans">
                    <Button variant="outline" className="w-full justify-start gap-2" data-testid="link-transition-plan">
                      <Route className="h-4 w-4" /> My Transition Plan <ExternalLink className="h-3 w-3 ml-auto" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wizard" className="space-y-4">
            <div className="mb-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Step {wizardStep + 1} of {WIZARD_STEPS.length}: {WIZARD_STEPS[wizardStep].label}</span>
                <span>{wizardProgress}%</span>
              </div>
              <Progress value={wizardProgress} className="h-2" />
              <div className="flex justify-between mt-2">
                {WIZARD_STEPS.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setWizardStep(i)}
                      className={`flex flex-col items-center cursor-pointer ${i <= wizardStep ? 'text-primary' : 'text-muted-foreground/40'}`}
                      data-testid={`button-wizard-step-${s.key}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[10px] hidden md:inline mt-0.5">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {wizardStep === 0 && (
              <Card data-testid="wizard-welcome">
                <CardContent className="pt-6 space-y-4">
                  <div className="text-center space-y-3">
                    <Sparkles className="h-12 w-12 mx-auto text-yellow-500" />
                    <h2 className="text-xl font-bold">Welcome to Your Financial Aid Journey</h2>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                      College is more affordable than you think. We'll walk you through every type of financial aid, 
                      help you prepare your FAFSA documents, estimate your aid package, and find scholarships you qualify for.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { icon: DollarSign, title: "Free Money First", desc: "Grants and scholarships you never have to repay" },
                      { icon: Shield, title: "Know Your Options", desc: "Understand every type of aid before you decide" },
                      { icon: Calendar, title: "Never Miss a Deadline", desc: "Key dates and timeline to stay on track" },
                    ].map(item => {
                      const Icon = item.icon;
                      return (
                        <Card key={item.title} className="text-center">
                          <CardContent className="pt-4 pb-4 space-y-1">
                            <Icon className="h-8 w-8 mx-auto text-blue-600" />
                            <p className="font-semibold text-sm">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                    <CardContent className="pt-4 space-y-2 text-sm">
                      <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> <strong>85%</strong> of first-time, full-time students receive some form of financial aid</p>
                      <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> The average Pell Grant covers <strong>$7,395/year</strong> in tuition costs</p>
                      <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> Many scholarships go <strong>unclaimed</strong> every year — we help you find them</p>
                      <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> FAFSA is <strong>100% free</strong> to file — never pay someone to fill it out</p>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Link href="/apprenticeship-tracker">
                      <Button variant="outline" size="sm" className="w-full gap-1" data-testid="link-welcome-careers">
                        <Briefcase className="h-3 w-3" /> Career Pathways
                      </Button>
                    </Link>
                    <Link href="/benefits-screener">
                      <Button variant="outline" size="sm" className="w-full gap-1" data-testid="link-welcome-benefits">
                        <Heart className="h-3 w-3" /> Benefits
                      </Button>
                    </Link>
                    <Link href="/workforce-dashboard">
                      <Button variant="outline" size="sm" className="w-full gap-1" data-testid="link-welcome-workforce">
                        <Hammer className="h-3 w-3" /> Workforce
                      </Button>
                    </Link>
                    <Link href="/transition-plans">
                      <Button variant="outline" size="sm" className="w-full gap-1" data-testid="link-welcome-transition">
                        <Route className="h-3 w-3" /> Transition
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {wizardStep === 1 && (
              <div className="space-y-3" data-testid="wizard-aid-types">
                <h2 className="text-lg font-bold flex items-center gap-2"><DollarSign className="h-5 w-5" /> Types of Financial Aid</h2>
                <p className="text-sm text-muted-foreground">Understanding the difference between grants, loans, and work-study is the first step to making smart financial decisions.</p>
                {AID_TYPES.map(aid => {
                  const Icon = aid.icon;
                  const isExpanded = expandedAid === aid.id;
                  return (
                    <Card key={aid.id} className={aid.bgColor} data-testid={`card-aid-${aid.id}`}>
                      <CardContent className="pt-4 pb-4">
                        <button
                          className="w-full text-left"
                          onClick={() => setExpandedAid(isExpanded ? null : aid.id)}
                          data-testid={`button-expand-${aid.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`h-6 w-6 shrink-0 ${aid.color}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold">{aid.name}</h3>
                                <Badge variant="secondary" className="text-xs">{aid.type}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5">{aid.description}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-sm">{aid.maxAmount}</p>
                              <ChevronRight className={`h-4 w-4 ml-auto transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </div>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t space-y-2">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Eligibility Requirements:</p>
                              <ul className="space-y-1">
                                {aid.eligibility.map(req => (
                                  <li key={req} className="text-xs flex items-start gap-1.5">
                                    <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0 mt-0.5" />
                                    <span>{req}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="flex items-start gap-1.5 bg-yellow-50 dark:bg-yellow-950/20 rounded-md p-2">
                              <Info className="h-3 w-3 text-yellow-600 shrink-0 mt-0.5" />
                              <p className="text-xs">{aid.tips}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                <ExampleCard
                  title="Institutional Aid Detail"
                  description="This is an example — the real version would pull your specific institution's grant and scholarship programs, showing exact amounts and application requirements. To set this up, work with your financial aid office to import your school's institutional aid database."
                />
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-3" data-testid="wizard-checklist">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h2 className="text-lg font-bold flex items-center gap-2"><ClipboardCheck className="h-5 w-5" /> FAFSA Readiness Checklist</h2>
                  <Badge variant={checklistProgress === 100 ? "default" : "secondary"} data-testid="badge-checklist-progress">
                    {checkedItems.size}/{CHECKLIST_ITEMS.length} complete
                  </Badge>
                </div>
                <Progress value={checklistProgress} className="h-2" />
                {Object.entries(groupedChecklist).map(([category, items]) => (
                  <Card key={category}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4" /> {category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {items.map(item => {
                        const isChecked = checkedItems.has(item.id);
                        return (
                          <button
                            key={item.id}
                            onClick={() => toggleCheckItem(item.id)}
                            className={`w-full text-left flex items-start gap-3 p-2.5 rounded-md border transition-colors ${isChecked ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' : 'border-border'}`}
                            data-testid={`button-check-${item.id}`}
                          >
                            <div className={`mt-0.5 shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center ${isChecked ? 'border-green-500 bg-green-500' : 'border-muted-foreground/30'}`}>
                              {isChecked && <CheckCircle2 className="h-3 w-3 text-white" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className={`text-sm font-medium ${isChecked ? 'line-through text-muted-foreground' : ''}`}>{item.label}</p>
                                {item.priority === "high" && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Required</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-4" data-testid="wizard-estimator">
                <h2 className="text-lg font-bold flex items-center gap-2"><Target className="h-5 w-5" /> Aid Estimator</h2>
                <p className="text-sm text-muted-foreground">Get a rough estimate of your financial aid package based on your family's situation.</p>
                <Card>
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <Label>Family Income Bracket</Label>
                      <Select value={estimatorData.incomeBracket} onValueChange={v => setEstimatorData({...estimatorData, incomeBracket: v})}>
                        <SelectTrigger data-testid="select-income-bracket"><SelectValue placeholder="Select income range" /></SelectTrigger>
                        <SelectContent>
                          {INCOME_BRACKETS.map(b => (
                            <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Type of School</Label>
                      <Select value={estimatorData.schoolType} onValueChange={v => setEstimatorData({...estimatorData, schoolType: v})}>
                        <SelectTrigger data-testid="select-school-type"><SelectValue placeholder="Select school type" /></SelectTrigger>
                        <SelectContent>
                          {SCHOOL_TYPES.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label} — {s.avgCost}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Household Size</Label>
                      <Select value={estimatorData.householdSize} onValueChange={v => setEstimatorData({...estimatorData, householdSize: v})}>
                        <SelectTrigger data-testid="select-household-size"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5,6,7,8].map(n => (
                            <SelectItem key={n} value={String(n)}>{n} {n === 1 ? "person" : "people"}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>County</Label>
                      <Select value={estimatorData.county} onValueChange={v => setEstimatorData({...estimatorData, county: v})}>
                        <SelectTrigger data-testid="select-county"><SelectValue placeholder="Select your county" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="travis">Travis County</SelectItem>
                          <SelectItem value="williamson">Williamson County</SelectItem>
                          <SelectItem value="hays">Hays County</SelectItem>
                          <SelectItem value="bastrop">Bastrop County</SelectItem>
                          <SelectItem value="caldwell">Caldwell County</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-md">
                      <Label>First-generation college student?</Label>
                      <Switch checked={estimatorData.isFirstGen} onCheckedChange={v => setEstimatorData({...estimatorData, isFirstGen: v})} data-testid="switch-first-gen" />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-md">
                      <Label>Underrepresented minority?</Label>
                      <Switch checked={estimatorData.isMinority} onCheckedChange={v => setEstimatorData({...estimatorData, isMinority: v})} data-testid="switch-minority" />
                    </div>
                  </CardContent>
                </Card>

                {selectedBracket && selectedSchool && (
                  <Card className="border-blue-500 bg-blue-50/50 dark:bg-blue-950/20" data-testid="card-estimate-results">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" /> Your Estimated Aid</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-background rounded-md border">
                          <p className="text-xs text-muted-foreground">Estimated Pell Grant</p>
                          <p className="text-lg font-bold text-green-600" data-testid="text-pell-estimate">{selectedBracket.pellEstimate}</p>
                        </div>
                        <div className="text-center p-3 bg-background rounded-md border">
                          <p className="text-xs text-muted-foreground">Total Estimated Aid</p>
                          <p className="text-lg font-bold text-blue-600" data-testid="text-total-estimate">{selectedBracket.totalEstimate}</p>
                        </div>
                      </div>
                      <div className="text-center p-3 bg-background rounded-md border">
                        <p className="text-xs text-muted-foreground">Average Cost of Attendance</p>
                        <p className="text-lg font-bold" data-testid="text-school-cost">{selectedSchool.avgCost}</p>
                        <p className="text-xs text-muted-foreground">({selectedSchool.label})</p>
                      </div>
                      {estimatorData.isFirstGen && (
                        <div className="flex items-start gap-2 bg-green-50 dark:bg-green-950/20 rounded-md p-3">
                          <HandHeart className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                          <p className="text-xs">As a first-generation student, you may qualify for additional institutional grants and special scholarship programs like the Dell Scholars Program and QuestBridge.</p>
                        </div>
                      )}
                      {estimatorData.isMinority && (
                        <div className="flex items-start gap-2 bg-purple-50 dark:bg-purple-950/20 rounded-md p-3">
                          <Users className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                          <p className="text-xs">As an underrepresented minority student, you may qualify for targeted scholarships like the Gates Scholarship, HSF, UNCF, and Ron Brown Scholar Program.</p>
                        </div>
                      )}
                      <div className="flex items-start gap-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-md p-3">
                        <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                        <p className="text-xs">This is a rough estimate only. Your actual aid will depend on your full FAFSA results, the school's policies, and available funding. Use the federal Student Aid Estimator at studentaid.gov for a more precise calculation.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {wizardStep === 4 && (
              <div className="space-y-4" data-testid="wizard-scholarships">
                <h2 className="text-lg font-bold flex items-center gap-2"><Award className="h-5 w-5" /> Scholarship Finder</h2>
                <p className="text-sm text-muted-foreground">Scholarships matched to students in our 5-county Central Texas service area.</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1" data-testid="text-scholarship-source"><Info className="h-3 w-3" /> Amounts and deadlines are reference examples last reviewed August 2026 — confirm current details on each scholarship's official site.</p>
                <Card>
                  <CardContent className="pt-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Filter by Demographics</Label>
                        <Select value={scholarshipFilters.demographics} onValueChange={v => setScholarshipFilters({...scholarshipFilters, demographics: v})}>
                          <SelectTrigger data-testid="select-demographics-filter"><SelectValue placeholder="All demographics" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All demographics</SelectItem>
                            <SelectItem value="low-income">Low-income</SelectItem>
                            <SelectItem value="first-generation">First-generation</SelectItem>
                            <SelectItem value="african american">African American</SelectItem>
                            <SelectItem value="hispanic">Hispanic/Latino</SelectItem>
                            <SelectItem value="texas">Texas resident</SelectItem>
                            <SelectItem value="minority">Minority</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Filter by Interest</Label>
                        <Select value={scholarshipFilters.interest} onValueChange={v => setScholarshipFilters({...scholarshipFilters, interest: v})}>
                          <SelectTrigger data-testid="select-interest-filter"><SelectValue placeholder="All interests" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All interests</SelectItem>
                            <SelectItem value="any">Any field of study</SelectItem>
                            <SelectItem value="leadership">Leadership</SelectItem>
                            <SelectItem value="community">Community service</SelectItem>
                            <SelectItem value="computer">Computer Science / Tech</SelectItem>
                            <SelectItem value="engineering">Engineering</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button variant="outline" onClick={() => setScholarshipFilters({ demographics: "", interest: "", minGpa: "" })} data-testid="button-clear-filters" className="w-full">
                          Clear Filters
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <p className="text-sm text-muted-foreground" data-testid="text-scholarship-count">
                  Showing {filteredScholarships.length} of {SCHOLARSHIPS.length} scholarships
                </p>
                <div className="space-y-2">
                  {filteredScholarships.map((s, i) => (
                    <Card key={i} data-testid={`card-scholarship-${i}`}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-sm">{s.name}</h3>
                              <Badge variant="default" className="text-xs shrink-0">{s.amount}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge variant="outline" className="text-[10px]">GPA: {s.gpa}</Badge>
                              <Badge variant="outline" className="text-[10px]">Deadline: {s.deadline}</Badge>
                              {s.demographics.map(d => (
                                <Badge key={d} variant="secondary" className="text-[10px]">{d}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <ExampleCard
                  title="Institutional Scholarship Database"
                  description="This is an example — to add real scholarships specific to your institution, work with your financial aid office to import your institution's scholarship database. The system can automatically match students to eligible scholarships based on their profile."
                />
              </div>
            )}

            {wizardStep === 5 && (
              <div className="space-y-4" data-testid="wizard-timeline">
                <h2 className="text-lg font-bold flex items-center gap-2"><Calendar className="h-5 w-5" /> Financial Aid Timeline</h2>
                <p className="text-sm text-muted-foreground">Key dates and deadlines for the 2025-2026 FAFSA cycle.</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1" data-testid="text-timeline-source"><Info className="h-3 w-3" /> Deadlines are typical dates last reviewed August 2026 and vary by year and school — verify at <a href="https://studentaid.gov" target="_blank" rel="noreferrer" className="underline">studentaid.gov</a>.</p>
                <div className="space-y-2">
                  {TIMELINE_EVENTS.map((event, i) => (
                    <Card key={i} data-testid={`card-timeline-${i}`}>
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-start gap-3">
                          <div className={`shrink-0 mt-0.5 h-8 w-8 rounded-md flex items-center justify-center ${
                            event.type === 'deadline' ? 'bg-red-100 dark:bg-red-950/30' :
                            event.type === 'milestone' ? 'bg-green-100 dark:bg-green-950/30' :
                            'bg-blue-100 dark:bg-blue-950/30'
                          }`}>
                            {event.type === 'deadline' ? <AlertCircle className="h-4 w-4 text-red-600" /> :
                             event.type === 'milestone' ? <Star className="h-4 w-4 text-green-600" /> :
                             <Clock className="h-4 w-4 text-blue-600" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm">{event.title}</p>
                              <Badge variant={event.priority === 'critical' ? 'destructive' : 'outline'} className="text-[10px]">
                                {event.month}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                  <CardContent className="pt-4 text-center space-y-2">
                    <CheckCircle2 className="h-10 w-10 mx-auto text-green-600" />
                    <h3 className="font-bold">Ready to Start?</h3>
                    <p className="text-sm text-muted-foreground">Visit <strong>studentaid.gov</strong> to create your FSA ID and begin your FAFSA application.</p>
                    <Button onClick={() => window.open("https://studentaid.gov", "_blank")} data-testid="button-start-fafsa">
                      Go to StudentAid.gov <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
                <ExampleCard
                  title="Personalized Timeline Reminders"
                  description="This is an example — the real version would send you SMS/email reminders before each deadline based on your selected schools and state. To enable this, connect your phone number or email in your profile settings."
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setWizardStep(Math.max(0, wizardStep - 1))}
                disabled={wizardStep === 0}
                data-testid="button-wizard-prev"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                onClick={() => setWizardStep(Math.min(WIZARD_STEPS.length - 1, wizardStep + 1))}
                disabled={wizardStep === WIZARD_STEPS.length - 1}
                data-testid="button-wizard-next"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="checklist" className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-lg font-bold flex items-center gap-2"><ClipboardCheck className="h-5 w-5" /> FAFSA Readiness Checklist</h2>
              <Badge variant={checklistProgress === 100 ? "default" : "secondary"} data-testid="badge-checklist-tab-progress">
                {checklistProgress}% complete ({checkedItems.size}/{CHECKLIST_ITEMS.length})
              </Badge>
            </div>
            <Progress value={checklistProgress} className="h-3" />
            {Object.entries(groupedChecklist).map(([category, items]) => (
              <Card key={category}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">{category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {items.map(item => {
                    const isChecked = checkedItems.has(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleCheckItem(item.id)}
                        className={`w-full text-left flex items-start gap-3 p-3 rounded-md border transition-colors ${isChecked ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' : 'border-border'}`}
                        data-testid={`button-checklist-${item.id}`}
                      >
                        <div className={`mt-0.5 shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center ${isChecked ? 'border-green-500 bg-green-500' : 'border-muted-foreground/30'}`}>
                          {isChecked && <CheckCircle2 className="h-3 w-3 text-white" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-medium ${isChecked ? 'line-through text-muted-foreground' : ''}`}>{item.label}</p>
                            {item.priority === "high" && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Required</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
            <ExampleCard
              title="Document Upload & Verification"
              description="This is an example — the real version would let you upload and verify each document (tax returns, W-2s, bank statements) directly. To enable this, your institution's financial aid office would integrate their document verification system."
            />
          </TabsContent>

          <TabsContent value="estimator" className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><Target className="h-5 w-5" /> Financial Aid Estimator</h2>
            <p className="text-sm text-muted-foreground">
              Answer a few questions to get a rough estimate of your potential financial aid package.
            </p>
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <Label>Family Income Bracket</Label>
                  <Select value={estimatorData.incomeBracket} onValueChange={v => setEstimatorData({...estimatorData, incomeBracket: v})}>
                    <SelectTrigger data-testid="select-estimator-income"><SelectValue placeholder="Select income range" /></SelectTrigger>
                    <SelectContent>
                      {INCOME_BRACKETS.map(b => (
                        <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Type of School</Label>
                  <Select value={estimatorData.schoolType} onValueChange={v => setEstimatorData({...estimatorData, schoolType: v})}>
                    <SelectTrigger data-testid="select-estimator-school"><SelectValue placeholder="Select school type" /></SelectTrigger>
                    <SelectContent>
                      {SCHOOL_TYPES.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Household Size</Label>
                  <Select value={estimatorData.householdSize} onValueChange={v => setEstimatorData({...estimatorData, householdSize: v})}>
                    <SelectTrigger data-testid="select-estimator-household"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8].map(n => (
                        <SelectItem key={n} value={String(n)}>{n} {n === 1 ? "person" : "people"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <Label>First-generation college student?</Label>
                  <Switch checked={estimatorData.isFirstGen} onCheckedChange={v => setEstimatorData({...estimatorData, isFirstGen: v})} data-testid="switch-estimator-first-gen" />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <Label>Underrepresented minority?</Label>
                  <Switch checked={estimatorData.isMinority} onCheckedChange={v => setEstimatorData({...estimatorData, isMinority: v})} data-testid="switch-estimator-minority" />
                </div>
              </CardContent>
            </Card>

            {selectedBracket && selectedSchool && (
              <Card className="border-blue-500 bg-blue-50/50 dark:bg-blue-950/20" data-testid="card-estimator-results">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Your Estimated Financial Aid Package</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Card className="text-center">
                      <CardContent className="pt-4 pb-4">
                        <DollarSign className="h-6 w-6 mx-auto text-green-600 mb-1" />
                        <p className="text-xs text-muted-foreground">Pell Grant</p>
                        <p className="text-lg font-bold text-green-600" data-testid="text-est-pell">{selectedBracket.pellEstimate}</p>
                      </CardContent>
                    </Card>
                    <Card className="text-center">
                      <CardContent className="pt-4 pb-4">
                        <Star className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                        <p className="text-xs text-muted-foreground">Total Estimated Aid</p>
                        <p className="text-lg font-bold text-blue-600" data-testid="text-est-total">{selectedBracket.totalEstimate}</p>
                      </CardContent>
                    </Card>
                    <Card className="text-center">
                      <CardContent className="pt-4 pb-4">
                        <Building2 className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                        <p className="text-xs text-muted-foreground">Avg Cost of Attendance</p>
                        <p className="text-lg font-bold" data-testid="text-est-cost">{selectedSchool.avgCost}</p>
                      </CardContent>
                    </Card>
                  </div>
                  {estimatorData.isFirstGen && (
                    <div className="flex items-start gap-2 bg-green-50 dark:bg-green-950/20 rounded-md p-3 border border-green-200 dark:border-green-800">
                      <HandHeart className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">First-Generation Bonus Opportunities</p>
                        <p className="text-xs text-muted-foreground">Dell Scholars ($20K), QuestBridge (Full Ride), Jack Kent Cooke (up to $55K/yr), and many institutional grants specifically for first-gen students.</p>
                      </div>
                    </div>
                  )}
                  {estimatorData.isMinority && (
                    <div className="flex items-start gap-2 bg-purple-50 dark:bg-purple-950/20 rounded-md p-3 border border-purple-200 dark:border-purple-800">
                      <Users className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Diversity Scholarship Opportunities</p>
                        <p className="text-xs text-muted-foreground">Gates Scholarship (Full Ride), HSF (up to $5K), UNCF (Varies), Ron Brown ($40K), and numerous institutional diversity scholarships.</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-md p-3">
                    <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">These are estimates based on national averages. Actual amounts depend on your complete FAFSA results, school policies, and available funding. Visit <strong>studentaid.gov/aid-estimator</strong> for a more precise calculation.</p>
                  </div>
                </CardContent>
              </Card>
            )}
            <ExampleCard
              title="Net Price Calculator Integration"
              description="This is an example — the real version would integrate with your specific school's Net Price Calculator to give you a precise cost-after-aid estimate. Each accredited institution is required to offer one. Ask your financial aid office for the link."
            />
          </TabsContent>

          <TabsContent value="scholarships" className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><Award className="h-5 w-5" /> Scholarship Search & Match</h2>
            <p className="text-sm text-muted-foreground">
              Find scholarships matched to your profile. These are curated for students in our 5-county Central Texas service area.
            </p>
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Demographics</Label>
                    <Select value={scholarshipFilters.demographics} onValueChange={v => setScholarshipFilters({...scholarshipFilters, demographics: v === "all" ? "" : v})}>
                      <SelectTrigger data-testid="select-schol-demographics"><SelectValue placeholder="All" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="low-income">Low-income</SelectItem>
                        <SelectItem value="first-generation">First-generation</SelectItem>
                        <SelectItem value="african american">African American</SelectItem>
                        <SelectItem value="hispanic">Hispanic/Latino</SelectItem>
                        <SelectItem value="texas">Texas resident</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Field of Interest</Label>
                    <Select value={scholarshipFilters.interest} onValueChange={v => setScholarshipFilters({...scholarshipFilters, interest: v === "all" ? "" : v})}>
                      <SelectTrigger data-testid="select-schol-interest"><SelectValue placeholder="All" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All fields</SelectItem>
                        <SelectItem value="any">Any field</SelectItem>
                        <SelectItem value="leadership">Leadership</SelectItem>
                        <SelectItem value="community">Community Service</SelectItem>
                        <SelectItem value="computer">Computer Science</SelectItem>
                        <SelectItem value="engineering">Engineering</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" onClick={() => setScholarshipFilters({ demographics: "", interest: "", minGpa: "" })} data-testid="button-clear-schol-filters" className="w-full">
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm text-muted-foreground" data-testid="text-schol-count">
                {filteredScholarships.length} scholarships found
              </p>
              <Badge variant="outline">{SCHOLARSHIPS.length} total in database</Badge>
            </div>

            <div className="space-y-2">
              {filteredScholarships.map((s, i) => (
                <Card key={i} data-testid={`card-schol-${i}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 h-10 w-10 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Award className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{s.name}</h3>
                          <Badge>{s.amount}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" /> {s.deadline}
                          </Badge>
                          <Badge variant="outline" className="text-xs">GPA: {s.gpa}</Badge>
                          {s.demographics.map(d => (
                            <Badge key={d} variant="secondary" className="text-xs">{d}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <ExampleCard
              title="Local Scholarship Database"
              description="This is an example — to add real scholarships from your institution or community, work with your financial aid office to import your institution's scholarship database. The system can automatically match students to eligible scholarships based on GPA, demographics, and field of study."
            />
          </TabsContent>

          <TabsContent value="ai-advisor" className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-lg font-bold flex items-center gap-2" data-testid="text-ai-advisor-title">
                <MessageSquare className="h-5 w-5" /> Ask AI Financial Aid Advisor
              </h2>
              <Badge variant="secondary" className="gap-1">
                <Cpu className="h-3 w-3" /> 4-Engine Collaborative AI
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Get personalized financial aid guidance powered by our multi-engine AI system. Your student profile context is sent automatically for more relevant answers.
            </p>

            <Card data-testid="card-ai-advisor-input">
              <CardContent className="pt-4 space-y-3">
                <Label>Your Question</Label>
                <Textarea
                  value={aiQuestion}
                  onChange={e => setAiQuestion(e.target.value)}
                  placeholder="e.g., Am I eligible for the Pell Grant if my family makes $35,000? What scholarships should I apply for as a first-generation student?"
                  className="resize-none"
                  rows={3}
                  data-testid="input-ai-question"
                />
                <p className="text-xs text-muted-foreground flex items-start gap-1.5" data-testid="text-ai-privacy-note">
                  <Shield className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground">Privacy:</strong> Your question and any profile context (income range, county, first-gen status) are sent to our AI providers to generate an answer. Do not enter your Social Security number, FSA ID, or other sensitive personal identifiers. This is general guidance, not official financial-aid advice — verify everything at <a href="https://studentaid.gov" target="_blank" rel="noreferrer" className="underline">studentaid.gov</a>.
                  </span>
                </p>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {estimatorData.incomeBracket && (
                      <Badge variant="outline" className="text-xs" data-testid="badge-ai-context-income">
                        Income: {INCOME_BRACKETS.find(b => b.value === estimatorData.incomeBracket)?.label}
                      </Badge>
                    )}
                    {estimatorData.isFirstGen && (
                      <Badge variant="outline" className="text-xs" data-testid="badge-ai-context-firstgen">First-Gen</Badge>
                    )}
                    {estimatorData.county && (
                      <Badge variant="outline" className="text-xs" data-testid="badge-ai-context-county">
                        {estimatorData.county.charAt(0).toUpperCase() + estimatorData.county.slice(1)} County
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={handleAskAI}
                    disabled={!aiQuestion.trim() || aiMutation.isPending}
                    data-testid="button-ask-ai"
                  >
                    {aiMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Thinking...</>
                    ) : (
                      <><Send className="h-4 w-4 mr-1" /> Ask Advisor</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                "Am I eligible for the Pell Grant?",
                "What's the difference between subsidized and unsubsidized loans?",
                "How do I apply for work-study?",
                "What Texas-specific aid programs exist?",
              ].map((q, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs text-left h-auto py-2 whitespace-normal"
                  onClick={() => { setAiQuestion(q); }}
                  data-testid={`button-ai-suggestion-${i}`}
                >
                  {q}
                </Button>
              ))}
            </div>

            {aiMutation.isPending && (
              <Card data-testid="card-ai-loading">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <p className="text-sm font-medium">AI Advisor is analyzing your question...</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs gap-1"><Cpu className="h-3 w-3" /> Engine 1: Processing</Badge>
                    <Badge variant="outline" className="text-xs gap-1"><Cpu className="h-3 w-3" /> Engine 2: Processing</Badge>
                    <Badge variant="outline" className="text-xs gap-1"><Cpu className="h-3 w-3" /> Engine 3: Processing</Badge>
                    <Badge variant="outline" className="text-xs gap-1"><Cpu className="h-3 w-3" /> Engine 4: Processing</Badge>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            )}

            {aiMutation.isError && (
              <Card className="border-red-300 dark:border-red-800" data-testid="card-ai-error">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                    <p className="text-sm text-red-600">Failed to get AI response. Please try again.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {aiResponse && !aiMutation.isPending && (
              <Card data-testid="card-ai-response">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between gap-2 flex-wrap">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-yellow-500" /> AI Advisor Response
                    </span>
                    {aiResponse.totalTimeMs && (
                      <Badge variant="outline" className="text-xs" data-testid="badge-ai-response-time">
                        {(aiResponse.totalTimeMs / 1000).toFixed(1)}s
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="prose prose-sm max-w-none dark:prose-invert" data-testid="text-ai-answer">
                    <p className="text-sm whitespace-pre-wrap">{aiResponse.answer}</p>
                  </div>
                  <div className="pt-2 border-t space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Engines Used</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {aiResponse.engines.map((e, i) => (
                        <Badge
                          key={i}
                          variant={e.hasResponse ? "secondary" : "outline"}
                          className="text-xs gap-1"
                          data-testid={`badge-ai-engine-${i}`}
                        >
                          <Cpu className="h-3 w-3" />
                          {e.engine}{e.model ? ` (${e.model})` : ""}
                          {e.hasResponse ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : null}
                          {e.error ? <AlertCircle className="h-3 w-3 text-red-500" /> : null}
                        </Badge>
                      ))}
                    </div>
                    {aiResponse.ragContext && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs gap-1" data-testid="badge-ai-rag">
                          <BookOpen className="h-3 w-3" />
                          RAG: {aiResponse.ragContext.documentsUsed} docs
                        </Badge>
                        {aiResponse.ragContext.topics?.map((t, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                    )}
                    {aiResponse.consensusMethod && (
                      <Badge variant="outline" className="text-xs" data-testid="badge-ai-consensus">
                        Consensus: {aiResponse.consensusMethod}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {aiHistory.length > 1 && (
              <Card data-testid="card-ai-history">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Previous Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {aiHistory.slice(0, -1).reverse().map((item, i) => (
                    <button
                      key={i}
                      className="w-full text-left p-2 rounded-md border text-sm hover-elevate"
                      onClick={() => {
                        setAiResponse(item.response);
                        setAiQuestion(item.question);
                      }}
                      data-testid={`button-ai-history-${i}`}
                    >
                      <p className="text-xs text-muted-foreground truncate">{item.question}</p>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            <ExampleCard
              title="AI-Powered Document Review"
              description="This is an example — the real version would let you upload your FAFSA draft or financial documents and the AI would review them for errors, missing information, and optimization opportunities. To enable this, integrate document upload with your institution's verification system."
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
