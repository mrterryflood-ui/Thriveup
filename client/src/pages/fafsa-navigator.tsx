import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  GraduationCap, DollarSign, FileText, Calendar, Search, CheckCircle2,
  ChevronRight, ChevronLeft, BookOpen, Landmark, Briefcase, Clock,
  AlertCircle, Star, Users, Building2, Award, Target, ArrowRight,
  ClipboardCheck, Shield, Info, Sparkles, HandHeart, MapPin
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

const WIZARD_STEPS = [
  { key: "welcome", label: "Welcome", icon: GraduationCap },
  { key: "aid-types", label: "Aid Types", icon: DollarSign },
  { key: "checklist", label: "Readiness", icon: ClipboardCheck },
  { key: "estimator", label: "Estimator", icon: Target },
  { key: "scholarships", label: "Scholarships", icon: Award },
  { key: "timeline", label: "Timeline", icon: Calendar },
];

export default function FafsaNavigatorPage() {
  const [activeTab, setActiveTab] = useState("wizard");
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-background dark:from-blue-950/10 dark:to-background" data-testid="fafsa-navigator">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
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
          </TabsList>

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
              </div>
            )}

            {wizardStep === 5 && (
              <div className="space-y-4" data-testid="wizard-timeline">
                <h2 className="text-lg font-bold flex items-center gap-2"><Calendar className="h-5 w-5" /> Financial Aid Timeline</h2>
                <p className="text-sm text-muted-foreground">Key dates and deadlines for the 2025-2026 FAFSA cycle.</p>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
