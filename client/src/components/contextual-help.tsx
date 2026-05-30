import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  HelpCircle, X, ChevronRight, Printer, ArrowRight,
  CheckCircle2, Lightbulb, BookOpen, Workflow, FileText,
  Minimize2, Maximize2
} from "lucide-react";

interface HelpStep {
  title: string;
  detail: string;
}

interface QuickTip {
  tip: string;
}

interface PageHelp {
  pageName: string;
  summary: string;
  whoIsThisFor: string;
  quickStart: HelpStep[];
  workflow: HelpStep[];
  tips: QuickTip[];
  printableTitle: string;
  nextSteps: { label: string; path: string; why: string }[];
}

const PAGE_HELP: Record<string, PageHelp> = {
  "/": {
    pageName: "Home",
    summary: "Your starting point for the entire ThriveUp Academy ecosystem. From here you can access learning, career pathways, community tools, and more.",
    whoIsThisFor: "Everyone — students, staff, partners, and visitors.",
    quickStart: [
      { title: "Explore the platform", detail: "Scroll down to see all available features — curriculum, career pathways, AI tools, and community resources." },
      { title: "Start learning", detail: "Click 'Explore Curriculum' to see available subjects and start lessons." },
      { title: "Find your career path", detail: "Visit Career Pathways to explore 55+ careers matched to your interests." },
    ],
    workflow: [
      { title: "New student?", detail: "Home → Curriculum → Pick a subject → Start your first lesson." },
      { title: "Returning student?", detail: "Home → Dashboard → Resume where you left off." },
      { title: "Staff member?", detail: "Home → Dashboard → Check participant progress and outcomes." },
      { title: "Community partner?", detail: "Home → Stakeholder Ecosystem → View coordination and impact data." },
    ],
    tips: [
      { tip: "Use the sidebar menu to navigate between all platform sections." },
      { tip: "Your progress saves automatically — you can leave and come back anytime." },
      { tip: "Look for the help button (?) on any page for page-specific guidance." },
    ],
    printableTitle: "ThriveUp Academy — Quick Reference",
    nextSteps: [
      { label: "Curriculum", path: "/subjects", why: "Start learning with AI literacy, workforce readiness, or social-emotional learning." },
      { label: "Career Pathways", path: "/academy/careers", why: "Explore 55+ career paths matched to your interests and skills." },
      { label: "Dashboard", path: "/dashboard", why: "See your progress, achievements, and next steps." },
    ],
  },
  "/subjects": {
    pageName: "Curriculum Library",
    summary: "Browse all available learning subjects organized by grade band. Each subject has modules with deep, interactive lessons.",
    whoIsThisFor: "Students and educators looking for learning content.",
    quickStart: [
      { title: "Pick a subject", detail: "Choose from AI Literacy, Workforce Readiness, or Social-Emotional Learning." },
      { title: "Select your grade band", detail: "Content is organized by Grades 3-5, 6-8, and 9-12." },
      { title: "Open a module", detail: "Click any subject card to see its modules and start lessons." },
    ],
    workflow: [
      { title: "Choose a subject", detail: "Click any subject card that matches your learning goals." },
      { title: "Browse modules", detail: "Each subject has multiple modules — each covering a specific topic area." },
      { title: "Start a lesson", detail: "Each module has 3 deep lessons with reading content and interactive activities." },
      { title: "Complete the activity", detail: "Every lesson ends with a sorting or matching activity to test your understanding." },
      { title: "Track your progress", detail: "Completed lessons are marked — come back to finish the rest." },
    ],
    tips: [
      { tip: "Each lesson takes 30-45 minutes. You can pause and resume." },
      { tip: "AI Literacy lessons teach you to use AI responsibly — a critical modern skill." },
      { tip: "Workforce lessons are aligned with Texas TEKS standards for career readiness." },
    ],
    printableTitle: "Curriculum Library — Quick Reference",
    nextSteps: [
      { label: "AI Workforce Academy", path: "/ai-workforce", why: "Advanced AI training for career professionals." },
      { label: "Career Pathways", path: "/academy/careers", why: "Connect what you're learning to real career options." },
      { label: "Achievements", path: "/achievements", why: "See your badges and certificates earned through learning." },
    ],
  },
  "/dashboard": {
    pageName: "Dashboard",
    summary: "Your personalized command center showing progress, upcoming tasks, recent activity, and key metrics at a glance.",
    whoIsThisFor: "Logged-in students and staff members.",
    quickStart: [
      { title: "Check your progress", detail: "The top cards show your overall completion rate, lessons completed, and achievements earned." },
      { title: "Resume learning", detail: "Your recent activity shows where you left off — click to jump right back in." },
      { title: "View achievements", detail: "See badges and certificates you've earned through completing lessons and activities." },
    ],
    workflow: [
      { title: "Start of day", detail: "Open Dashboard → Check progress → See what's next." },
      { title: "Resume work", detail: "Click your most recent activity to pick up where you left off." },
      { title: "Explore new content", detail: "Click 'Explore Curriculum' to find new subjects and lessons." },
      { title: "Check milestones", detail: "View your achievements to see how close you are to the next badge." },
    ],
    tips: [
      { tip: "Dashboard updates in real-time as you complete lessons and activities." },
      { tip: "Staff members see aggregate data across all participants." },
      { tip: "Use the sidebar to navigate to specific tools and sections." },
    ],
    printableTitle: "Dashboard — Quick Reference",
    nextSteps: [
      { label: "Curriculum", path: "/subjects", why: "Find your next lesson to continue learning." },
      { label: "Achievements", path: "/achievements", why: "View your earned badges and certificates." },
      { label: "Career Pathways", path: "/academy/careers", why: "Explore career options aligned with your skills." },
    ],
  },
  "/grants": {
    pageName: "Grant Hub",
    summary: "Discover, track, and manage grant opportunities with AI-powered analysis, fit scoring, and application support.",
    whoIsThisFor: "Staff, administrators, and grant writers.",
    quickStart: [
      { title: "Browse opportunities", detail: "The main view shows available grants with deadlines, amounts, and fit scores." },
      { title: "Check fit scores", detail: "AI analyzes each grant against our organizational capabilities and rates the fit." },
      { title: "Track applications", detail: "Move grants through the pipeline: Discovered → Reviewing → Applying → Submitted." },
    ],
    workflow: [
      { title: "Discover grants", detail: "Browse the discovery feed or search by keyword, amount, or deadline." },
      { title: "Evaluate fit", detail: "Check AI fit scores and readiness checklists for each opportunity." },
      { title: "Prepare application", detail: "Use AI narrative generation to draft proposal sections." },
      { title: "Submit and track", detail: "Log submission and track through award/rejection." },
      { title: "Report outcomes", detail: "When funded, connect to program management for execution tracking." },
    ],
    tips: [
      { tip: "Grants with fit scores above 70% are strong matches for our organization." },
      { tip: "Always verify AI-generated narrative content before submission." },
      { tip: "Check the compliance calendar for upcoming deadlines." },
    ],
    printableTitle: "Grant Hub — Quick Reference",
    nextSteps: [
      { label: "Program Management", path: "/program-management", why: "Set up program execution for funded grants." },
      { label: "Outcome Reporting", path: "/outcomes", why: "Track outcomes required by grant funders." },
      { label: "Stakeholder Ecosystem", path: "/partners", why: "Coordinate with partners involved in grant activities." },
    ],
  },
  "/partners": {
    pageName: "Stakeholder Ecosystem",
    summary: "Manage community partnerships, MOUs, ambassadors, referrals, and track collective impact across your partner network.",
    whoIsThisFor: "Staff managing community partnerships and coordination.",
    quickStart: [
      { title: "View your partners", detail: "The Directory tab shows all partner organizations with verification status and contact info." },
      { title: "Track MOUs", detail: "The MOU Management tab tracks agreements, signatures, and renewal dates." },
      { title: "See collective impact", detail: "The Impact tab aggregates data across all partners to show your network's total reach." },
    ],
    workflow: [
      { title: "Add a new partner", detail: "Click 'Add Partner' → Fill in organization details → Save." },
      { title: "Create an MOU", detail: "Select a partner → MOU Management tab → Create MOU with terms and dates." },
      { title: "Log a referral", detail: "Select a partner → Click 'Referral' → Enter participant and service details." },
      { title: "Track engagement", detail: "Log events, volunteer hours, and resources distributed." },
      { title: "Generate impact report", detail: "Use Collective Impact tab to see aggregate outcomes across all partners." },
    ],
    tips: [
      { tip: "Verified partners show a green checkmark — verify status through documentation." },
      { tip: "Expiring MOUs are flagged automatically — renew before they lapse." },
      { tip: "The Coordination tab shows service gaps your network could fill." },
    ],
    printableTitle: "Stakeholder Ecosystem — Quick Reference",
    nextSteps: [
      { label: "Community Map", path: "/community-map", why: "See your partner coverage on the GIS map." },
      { label: "Outcome Reporting", path: "/outcomes", why: "Include partner data in grant outcome reports." },
      { label: "Coalition Dashboard", path: "/coalition", why: "View the broader coalition and cross-sector collaboration." },
    ],
  },
  "/community-map": {
    pageName: "Community Intelligence Map",
    summary: "Interactive GIS-powered map showing social determinants of health, community resources, and risk assessments powered by 8 federal data sources.",
    whoIsThisFor: "Staff, grant writers, and program planners who need community data.",
    quickStart: [
      { title: "Search a location", detail: "Enter a zip code, city, or address to center the map on that area." },
      { title: "Toggle data layers", detail: "Switch between Poverty, Health, Crime, Food Desert, Housing, Education, and Unemployment layers." },
      { title: "Read the Context Load Index", detail: "The composite risk score (0-100) summarizes overall community vulnerability." },
    ],
    workflow: [
      { title: "Define your area", detail: "Search for the community you're investigating." },
      { title: "Explore SDOH layers", detail: "Toggle each layer to understand different dimensions of community need." },
      { title: "Check the risk score", detail: "The Context Load Index gives a quick overall assessment." },
      { title: "Compare locations", detail: "Use the Compare feature to see two areas side-by-side." },
      { title: "Export for grants", detail: "Generate a Community Profile Report (PDF) to include in grant applications." },
    ],
    tips: [
      { tip: "The PDF export creates grant-ready community profiles with data citations." },
      { tip: "Data comes from CDC, Census Bureau, FBI, USDA, HUD, SAMHSA — all verified federal sources." },
      { tip: "Higher Context Load Index scores indicate greater community vulnerability and need." },
    ],
    printableTitle: "Community Intelligence Map — Quick Reference",
    nextSteps: [
      { label: "Grant Hub", path: "/grants", why: "Use community data to strengthen grant applications." },
      { label: "Program Engine", path: "/program-engine", why: "Design programs that address identified community needs." },
      { label: "Stakeholders", path: "/partners", why: "Find partners who serve the communities you've identified." },
    ],
  },
  "/outcomes": {
    pageName: "Outcome Reporting",
    summary: "Track and report program outcomes with real participant data, completion rates, credential attainment, and grant-aligned metrics.",
    whoIsThisFor: "Program managers, grant administrators, and evaluators.",
    quickStart: [
      { title: "View the dashboard", detail: "Top-level metrics show total participants, completion rates, and credential data." },
      { title: "Filter by program", detail: "Drill down into specific programs or time periods." },
      { title: "Export data", detail: "Use CSV export to generate reports for funders." },
    ],
    workflow: [
      { title: "Review current outcomes", detail: "Check the dashboard for up-to-date completion and credential rates." },
      { title: "Identify trends", detail: "Look for patterns in enrollment, completion, and drop-off." },
      { title: "Generate reports", detail: "Export data for quarterly grant reports." },
      { title: "Share with stakeholders", detail: "Use the transparency dashboard to share outcome data publicly." },
    ],
    tips: [
      { tip: "Outcome data updates in real-time as participants complete activities." },
      { tip: "Grant funders want to see measurable change — focus on completion rates and credentials." },
      { tip: "Compare outcomes across programs to identify what's working best." },
    ],
    printableTitle: "Outcome Reporting — Quick Reference",
    nextSteps: [
      { label: "Grant Hub", path: "/grants", why: "Reference outcome data in grant applications and reports." },
      { label: "MAP-GAP CQI", path: "/cqi", why: "Use outcomes to drive continuous quality improvement." },
      { label: "Transparency Dashboard", path: "/transparency", why: "Share outcome data with stakeholders publicly." },
    ],
  },
  "/ai-workforce": {
    pageName: "AI Workforce Academy",
    summary: "Professional AI training aligned with WIOA workforce standards. Seven tracks covering AI foundations through enterprise integration.",
    whoIsThisFor: "Adult learners building professional AI skills for career advancement.",
    quickStart: [
      { title: "Choose your track", detail: "Browse 7 AI training tracks from foundations to specialized enterprise skills." },
      { title: "Start with fundamentals", detail: "If you're new to AI, begin with 'AI Foundations & Ethics' track." },
      { title: "Check grant alignment", detail: "Scroll down to see how this training aligns with active grant requirements." },
    ],
    workflow: [
      { title: "Assess your level", detail: "Review track descriptions to find your starting point." },
      { title: "Enroll in a track", detail: "Select a track and begin with the first module." },
      { title: "Complete all modules", detail: "Each track has multiple modules with progressive difficulty." },
      { title: "Earn your credential", detail: "Completing a track earns a verifiable workforce credential." },
      { title: "Apply to careers", detail: "Use your credentials in the Career Pathways section." },
    ],
    tips: [
      { tip: "These tracks align with TWC, WIOA, and TEKS workforce standards." },
      { tip: "Employers in our network recognize ThriveUp AI credentials." },
      { tip: "Each track builds on the previous one — start with foundations." },
    ],
    printableTitle: "AI Workforce Academy — Quick Reference",
    nextSteps: [
      { label: "Career Pathways", path: "/academy/careers", why: "Explore careers that use the AI skills you're building." },
      { label: "Curriculum", path: "/subjects", why: "Access the full AI literacy lesson library." },
      { label: "Achievements", path: "/achievements", why: "View credentials earned through completed training." },
    ],
  },
  "/academy": {
    pageName: "Career Pathways",
    summary: "Explore 55+ career paths across technology, healthcare, business, trades, and creative industries with salary data and required skills.",
    whoIsThisFor: "Students and job seekers exploring career options.",
    quickStart: [
      { title: "Browse career clusters", detail: "Careers are organized by industry — click a cluster to see all careers in that field." },
      { title: "View career details", detail: "Each career shows salary range, education required, growth outlook, and key skills." },
      { title: "Match to your learning", detail: "See which ThriveUp courses align with each career path." },
    ],
    workflow: [
      { title: "Explore interests", detail: "Browse different career clusters to find what excites you." },
      { title: "Research 2-3 careers", detail: "Dive deep into careers that match your interests and values." },
      { title: "Check requirements", detail: "See what education, certifications, and skills each career needs." },
      { title: "Start building skills", detail: "Enroll in ThriveUp courses that align with your target career." },
      { title: "Connect with mentors", detail: "Use the Mentor Finder to connect with professionals in your target field." },
    ],
    tips: [
      { tip: "Don't limit yourself to one path — many skills transfer across careers." },
      { tip: "Salary ranges show entry-level through experienced — your first job starts at the lower end." },
      { tip: "Skilled trades often pay as much as or more than jobs requiring 4-year degrees." },
    ],
    printableTitle: "Career Pathways — Quick Reference",
    nextSteps: [
      { label: "Mentor Finder", path: "/academy/mentor-finder", why: "Connect with professionals in your target career field." },
      { label: "Curriculum", path: "/subjects", why: "Build skills that align with your career goals." },
      { label: "Financial Literacy", path: "/academy/financial-literacy", why: "Understand salary, benefits, and financial planning." },
    ],
  },
  "/reentry": {
    pageName: "Reentry Dashboard",
    summary: "Case management for justice-involved individuals with phase-based reentry plans, service tracking, risk assessment, and community reintegration support.",
    whoIsThisFor: "Case managers, reentry coordinators, and program staff.",
    quickStart: [
      { title: "View active cases", detail: "The dashboard shows all participants in your reentry program with their current phase." },
      { title: "Update case progress", detail: "Click any participant to view their plan, log services, and update milestones." },
      { title: "Track risk levels", detail: "Risk assessments are color-coded — red needs immediate attention." },
    ],
    workflow: [
      { title: "Intake", detail: "Complete the intake assessment to establish baseline risk and needs." },
      { title: "Create reentry plan", detail: "Build a phase-based plan with specific milestones and service goals." },
      { title: "Deliver services", detail: "Log each service delivery — housing, employment, counseling, mentoring." },
      { title: "Monitor progress", detail: "Track milestone completion and adjust the plan as needed." },
      { title: "Report outcomes", detail: "Export case data for grant reporting and program evaluation." },
    ],
    tips: [
      { tip: "Phase-based plans help participants see progress — celebrate phase transitions." },
      { tip: "Document every service delivery — this data supports grant compliance." },
      { tip: "Connect participants with community partners for wraparound support." },
    ],
    printableTitle: "Reentry Dashboard — Quick Reference",
    nextSteps: [
      { label: "Community Partners", path: "/partners", why: "Find service providers for housing, employment, and counseling." },
      { label: "Community Map", path: "/community-map", why: "Identify resources near the participant's location." },
      { label: "Outcome Reporting", path: "/outcomes", why: "Track reentry outcomes for grant reporting." },
    ],
  },
  "/workforce-dashboard": {
    pageName: "Workforce Dashboard",
    summary: "Track workforce development participants from intake through training, credential attainment, job placement, and retention.",
    whoIsThisFor: "Workforce development staff and program managers.",
    quickStart: [
      { title: "View participant pipeline", detail: "See participants at each stage: Intake → Training → Credentialed → Placed → Retained." },
      { title: "Track credentials", detail: "Monitor certification completion rates across all participants." },
      { title: "Check employer connections", detail: "View employer partners and job placement outcomes." },
    ],
    workflow: [
      { title: "Enroll participants", detail: "Complete intake assessment and enroll in appropriate training track." },
      { title: "Monitor training progress", detail: "Track module completion, attendance, and assessment scores." },
      { title: "Credential attainment", detail: "Record certifications and credentials earned." },
      { title: "Job placement", detail: "Connect credentialed participants with employer partners." },
      { title: "Retention tracking", detail: "Follow up at 30, 60, and 90 days to track job retention." },
    ],
    tips: [
      { tip: "WIOA requires tracking at specific intervals — use the compliance calendar." },
      { tip: "Credential data is one of the strongest metrics for grant reporting." },
      { tip: "Employer satisfaction surveys strengthen your evidence for renewals." },
    ],
    printableTitle: "Workforce Dashboard — Quick Reference",
    nextSteps: [
      { label: "AI Workforce Academy", path: "/ai-workforce", why: "Enroll participants in AI skills training." },
      { label: "Employers", path: "/workforce-dashboard", why: "Connect with hiring partners." },
      { label: "Outcome Reporting", path: "/outcomes", why: "Generate workforce outcome reports." },
    ],
  },
  "/cqi": {
    pageName: "MAP-GAP CQI",
    summary: "Continuous Quality Improvement dashboard using the MAP-GAP framework to identify gaps, prioritize improvements, and track implementation fidelity.",
    whoIsThisFor: "Program managers, quality improvement staff, and leadership.",
    quickStart: [
      { title: "Review gap assessments", detail: "See identified gaps across all programs with priority ratings." },
      { title: "Track improvement cycles", detail: "Each gap follows Map → Analyze → Plan → Execute → Reassess." },
      { title: "Monitor fidelity", detail: "Implementation fidelity scores show whether programs are running as designed." },
    ],
    workflow: [
      { title: "Identify gaps", detail: "Use outcome data and stakeholder feedback to identify service delivery gaps." },
      { title: "Prioritize", detail: "Rank gaps by severity, feasibility of improvement, and grant alignment." },
      { title: "Plan interventions", detail: "Design specific, measurable improvement actions for each gap." },
      { title: "Execute", detail: "Implement improvements with assigned owners and deadlines." },
      { title: "Reassess", detail: "Measure whether the improvement worked and iterate." },
    ],
    tips: [
      { tip: "CQI is ongoing — not a one-time event. Schedule regular assessment cycles." },
      { tip: "Connect gaps to specific grant requirements to prioritize strategically." },
      { tip: "Document everything — CQI evidence strengthens grant renewals." },
    ],
    printableTitle: "MAP-GAP CQI — Quick Reference",
    nextSteps: [
      { label: "Outcome Reporting", path: "/outcomes", why: "Use outcome data to identify and validate gaps." },
      { label: "Research Hub", path: "/research-hub", why: "Find evidence-based practices to address identified gaps." },
      { label: "Program Management", path: "/program-management", why: "Implement improvement plans within active programs." },
    ],
  },
  "/ecosystem-hub": {
    pageName: "Ecosystem Hub",
    summary: "Visual overview of the entire 26-platform self-governing ecosystem showing platform connections, governance health, and cross-platform coordination.",
    whoIsThisFor: "Leadership, administrators, and ecosystem managers.",
    quickStart: [
      { title: "View the ecosystem map", detail: "See all 26 platforms and how they connect to each other." },
      { title: "Check platform health", detail: "Color-coded status indicators show which platforms are online, degraded, or offline." },
      { title: "Explore connections", detail: "Click any platform to see its connections, dependencies, and role in the ecosystem." },
    ],
    workflow: [
      { title: "Morning check", detail: "Open the hub to verify all platforms are operational." },
      { title: "Investigate issues", detail: "Click degraded or offline platforms to see details and take action." },
      { title: "Review cross-platform data", detail: "Check how data flows between platforms." },
      { title: "Coordinate activities", detail: "Use platform connections to plan coordinated actions." },
    ],
    tips: [
      { tip: "The ecosystem hub gives you the 30,000-foot view — start here before drilling into any single platform." },
      { tip: "Platform connections show data dependencies — if one goes down, check its dependents." },
      { tip: "Use this view when presenting to funders to show the scope of the ecosystem." },
    ],
    printableTitle: "Ecosystem Hub — Quick Reference",
    nextSteps: [
      { label: "Ops Center", path: "/ops-center", why: "Deep-dive into platform health and monitoring." },
      { label: "Directive Compliance", path: "/directive-compliance", why: "Check if platforms are following ecosystem directives." },
      { label: "Transparency Dashboard", path: "/transparency", why: "Share ecosystem status with stakeholders." },
    ],
  },
};

function getPrintContent(help: PageHelp): string {
  let content = `${"=".repeat(60)}\n`;
  content += `${help.printableTitle}\n`;
  content += `ThriveUp Academy — The Collaborative Advocate Foundation\n`;
  content += `${"=".repeat(60)}\n\n`;
  content += `WHAT THIS PAGE DOES:\n${help.summary}\n\n`;
  content += `WHO IS THIS FOR:\n${help.whoIsThisFor}\n\n`;
  content += `${"─".repeat(40)}\n`;
  content += `QUICK START\n${"─".repeat(40)}\n`;
  help.quickStart.forEach((s, i) => {
    content += `${i + 1}. ${s.title}\n   ${s.detail}\n\n`;
  });
  content += `${"─".repeat(40)}\n`;
  content += `STEP-BY-STEP WORKFLOW\n${"─".repeat(40)}\n`;
  help.workflow.forEach((s, i) => {
    content += `Step ${i + 1}: ${s.title}\n   ${s.detail}\n\n`;
  });
  content += `${"─".repeat(40)}\n`;
  content += `TIPS\n${"─".repeat(40)}\n`;
  help.tips.forEach((t) => {
    content += `• ${t.tip}\n`;
  });
  content += `\n${"─".repeat(40)}\n`;
  content += `NEXT STEPS\n${"─".repeat(40)}\n`;
  help.nextSteps.forEach((n) => {
    content += `→ ${n.label}: ${n.why}\n`;
  });
  content += `\n${"=".repeat(60)}\n`;
  content += `Generated by ThriveUp Academy\n`;
  content += `thrivingcommunitiesforall.com\n`;
  return content;
}

export function ContextualHelpButton() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<"start" | "workflow" | "tips" | "next">("start");
  const [isMinimized, setIsMinimized] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const basePath = "/" + (location.split("/").filter(Boolean)[0] || "");
  const help = PAGE_HELP[basePath] || PAGE_HELP[location] || null;

  useEffect(() => {
    setIsOpen(false);
    setIsMinimized(false);
    setActiveSection("start");
  }, [location]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const trigger = document.getElementById("contextual-help-trigger");
        if (trigger && trigger.contains(e.target as Node)) return;
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!help) return null;

  const handlePrint = () => {
    const content = getPrintContent(help);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`<html><head><title>${help.printableTitle}</title><style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; line-height: 1.6; color: #1a1a1a; max-width: 700px; margin: 0 auto; }
        pre { white-space: pre-wrap; font-family: inherit; font-size: 14px; }
        @media print { body { padding: 20px; } }
      </style></head><body><pre>${content}</pre></body></html>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => { setIsMinimized(false); setIsOpen(true); }}
        data-testid="contextual-help-restore"
        className="fixed bottom-24 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 print:hidden"
      >
        <HelpCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Help: {help.pageName}</span>
      </button>
    );
  }

  return (
    <>
      <button
        id="contextual-help-trigger"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="contextual-help-trigger"
        className="fixed bottom-24 right-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center print:hidden"
        title={`Help: ${help.pageName}`}
      >
        {isOpen ? <X className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          data-testid="contextual-help-panel"
          className="fixed bottom-40 right-6 z-50 w-[calc(100vw-3rem)] sm:w-[360px] max-h-[70vh] bg-background border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden print:hidden animate-in slide-in-from-bottom-4 duration-200"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">{help.pageName}</p>
                <p className="text-[11px] text-muted-foreground">{help.whoIsThisFor}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrint} title="Print quick reference" data-testid="contextual-help-print">
                <Printer className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setIsMinimized(true); setIsOpen(false); }} data-testid="contextual-help-minimize">
                <Minimize2 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)} data-testid="contextual-help-close">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="px-3 py-2 border-b border-border bg-muted/30">
            <p className="text-xs text-muted-foreground leading-relaxed">{help.summary}</p>
          </div>

          <div className="flex gap-1 px-3 py-2 border-b border-border overflow-x-auto">
            {([
              { id: "start" as const, label: "Quick Start", icon: Lightbulb },
              { id: "workflow" as const, label: "Workflow", icon: Workflow },
              { id: "tips" as const, label: "Tips", icon: BookOpen },
              { id: "next" as const, label: "Next Steps", icon: ArrowRight },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                data-testid={`help-tab-${tab.id}`}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeSection === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <tab.icon className="h-3 w-3" />
                {tab.label}
              </button>
            ))}
          </div>

          <ScrollArea className="flex-1 px-3 py-3">
            {activeSection === "start" && (
              <div className="space-y-2" data-testid="help-section-start">
                {help.quickStart.map((step, i) => (
                  <div key={i} className="flex gap-2.5 p-2.5 rounded-lg bg-muted/40 border border-border/50">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{step.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === "workflow" && (
              <div className="space-y-1" data-testid="help-section-workflow">
                {help.workflow.map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="flex flex-col items-center">
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-primary-foreground">{i + 1}</span>
                      </div>
                      {i < help.workflow.length - 1 && <div className="w-0.5 h-4 bg-primary/20" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-xs font-semibold">{step.title}</p>
                      <p className="text-[11px] text-muted-foreground">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === "tips" && (
              <div className="space-y-2" data-testid="help-section-tips">
                {help.tips.map((t, i) => (
                  <div key={i} className="flex gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">{t.tip}</p>
                  </div>
                ))}
              </div>
            )}

            {activeSection === "next" && (
              <div className="space-y-2" data-testid="help-section-next">
                {help.nextSteps.map((n, i) => (
                  <a
                    key={i}
                    href={n.path}
                    data-testid={`help-next-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                  >
                    <ArrowRight className="h-3.5 w-3.5 text-primary flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">{n.label}</p>
                      <p className="text-[11px] text-muted-foreground">{n.why}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </a>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="px-3 py-2 border-t border-border bg-muted/20">
            <button
              onClick={handlePrint}
              data-testid="help-print-reference"
              className="w-full flex items-center justify-center gap-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
            >
              <Printer className="h-3 w-3" />
              Print Quick Reference Card
            </button>
          </div>
        </div>
      )}
    </>
  );
}
