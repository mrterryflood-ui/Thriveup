/**
 * Navigation decision support, not eligibility, identity, or authorization.
 * Evidence is the versioned product routing catalog; no model confidence scores.
 */
export const WORKSPACE_IDS = ["residents", "organizations", "funders", "community"] as const;
export type WorkspaceId = typeof WORKSPACE_IDS[number];
export interface Workspace {
  id: WorkspaceId;
  label: string;
  purpose: string;
  audience: string;
}
export const WORKSPACES: Workspace[] = [
  { id: "residents", label: "Residents & families", purpose: "Find support and take your next step.", audience: "For yourself, your family, or someone you support." },
  { id: "organizations", label: "Organizations & practitioners", purpose: "Coordinate services and strengthen your organization.", audience: "For nonprofits, service teams, schools, and partners." },
  { id: "funders", label: "Funders & evaluators", purpose: "Examine evidence, methods, and outcomes.", audience: "For funders, reviewers, and evaluators." },
  { id: "community", label: "Community & policy", purpose: "Understand local conditions and explore responses.", audience: "For community leaders, researchers, and policymakers." },
];
export function isWorkspaceId(value: unknown): value is WorkspaceId {
  return typeof value === "string" && WORKSPACE_IDS.some(id => id === value);
}
export interface WorkspaceTask {
  id: string;
  label: string;
  description: string;
  workspace: WorkspaceId;
  href: string;
  nextStep: string;
  access: "public" | "authenticated" | "staff" | "admin";
  terms: string[];
  primary?: boolean;
}
export const WORKSPACE_TASKS: WorkspaceTask[] = [
  { id: "find-support", label: "Find food, housing or care", description: "Search resources and choose who to contact.", workspace: "residents", href: "/get-help", nextStep: "Search for a need, open a matching category, then choose a resource. Confirm location and availability with the provider.", access: "public", terms: ["housing", "rent", "food", "help", "shelter", "transportation"], primary: true },
  { id: "check-benefits", label: "Check benefits", description: "See programs that may fit your situation.", workspace: "residents", href: "/benefits-screener", nextStep: "Review the screening disclosure, then begin the household questions. Results are estimates, not an eligibility determination.", access: "public", terms: ["benefits", "snap", "medicaid", "qualify", "assistance"], primary: true },
  { id: "learn-work", label: "Learn skills or explore careers", description: "Choose a lesson or explore a learning path.", workspace: "residents", href: "/academy", nextStep: "Open the Learning Center for lessons, or explore another learning pathway. Each pathway has its own requirements.", access: "public", terms: ["learn", "learning", "career", "job", "jobs", "school", "training", "skills"], primary: true },
  { id: "health", label: "Explore health & wellbeing", description: "Wellness tools and connections to care.", workspace: "residents", href: "/health-wellness", nextStep: "Choose a wellness or care-navigation tool. This is not a diagnosis or emergency service.", access: "public", terms: ["health", "wellness", "wellbeing", "care"] },
  { id: "my-journey", label: "Continue my journey", description: "Review your saved personal progress.", workspace: "residents", href: "/my-journey", nextStep: "Sign in to see your own saved journey.", access: "authenticated", terms: ["journey", "progress"] },
  { id: "my-appointments", label: "My appointments", description: "Review your personal appointments.", workspace: "residents", href: "/my-appointments", nextStep: "Sign in to review your appointments.", access: "authenticated", terms: ["appointments"] },
  { id: "my-documents", label: "My documents", description: "Open your personal document vault.", workspace: "residents", href: "/my-documents", nextStep: "Sign in to manage your own documents.", access: "authenticated", terms: ["documents"] },
  { id: "coordinate-services", label: "Coordinate services", description: "Tools for practitioners supporting residents.", workspace: "organizations", href: "/for-nonprofits", nextStep: "Choose your organization's workflow. Staff tools retain their existing access checks.", access: "public", terms: ["referral", "referrals", "clients", "practitioner", "services", "nonprofit"], primary: true },
  { id: "organization-funding", label: "Find organizational funding", description: "Funding pathways—not personal benefits.", workspace: "organizations", href: "/hub/fund", nextStep: "Explore the funding workflow. Mission fit does not establish funder eligibility.", access: "public", terms: ["grant", "grants", "proposal", "proposals", "fundraising"], primary: true },
  { id: "partners", label: "Find community partners", description: "Explore organizations and collaboration.", workspace: "organizations", href: "/partners", nextStep: "Find a relevant partner and review its information before contacting it.", access: "public", terms: ["partners", "partnership", "coalition"] },
  { id: "community-gravity", label: "See who is doing the work", description: "Organizations that anchor each domain of community life, from public IRS records with staff verification.", workspace: "organizations", href: "/community-gravity", nextStep: "Choose a city and state, open a domain, then open an organization to see its filings, cited facts, and how to coordinate with it.", access: "public", terms: ["who is doing", "who does", "magnet", "gravity", "ein", "irs"] },
  { id: "case-management", label: "Review case-management approach", description: "Staff view of a demonstration risk chain.", workspace: "organizations", href: "/case-manager", nextStep: "Inspect the existing risk-chain demonstration. This is not a complete case-management system.", access: "staff", terms: ["case", "cases"] },
  { id: "chw", label: "Community health worker tools", description: "Practitioner referrals and service coordination.", workspace: "organizations", href: "/chw-dashboard", nextStep: "Use authorized CHW workflows; choosing this workspace does not grant access.", access: "staff", terms: ["chw"] },
  { id: "evaluate", label: "Examine evidence & outcomes", description: "Inspect impact information and how it is produced.", workspace: "funders", href: "/impact", nextStep: "Review sources and disclosures. Reported activity is not proof of causal impact.", access: "public", terms: ["evaluate", "evaluation", "evidence", "outcomes", "funder"], primary: true },
  { id: "methods", label: "Inspect methodology", description: "Understand the analytical approach and its limits.", workspace: "funders", href: "/methodology", nextStep: "Inspect methods and their stated limits before relying on findings.", access: "public", terms: ["method", "methodology", "fidelity"] },
  { id: "research", label: "Explore research", description: "Research supporting implementation and evaluation.", workspace: "funders", href: "/research-hub", nextStep: "Inspect the research source and its relevance to your setting.", access: "public", terms: ["research", "studies"] },
  { id: "community-banks", label: "Community bank impact view", description: "One place-scoped view of local conditions, working tools, and the connected ecosystem for CRA-minded sponsors.", workspace: "funders", href: "/community-banks", nextStep: "Choose an assessment area by ZIP or city, read the sourced indicators and coverage labels, then open any tool live for that place.", access: "public", terms: ["bank", "banks", "cra", "sponsor", "sponsorship", "reinvestment"] },
  { id: "funder-dashboard", label: "Funder reporting workspace", description: "Restricted reporting for authorized staff.", workspace: "funders", href: "/funder-dashboard", nextStep: "Open reporting with the existing staff authorization.", access: "staff", terms: ["reporting"] },
  { id: "community-analysis", label: "Understand my community", description: "Explore place-based conditions and evidence.", workspace: "community", href: "/community-analysis", nextStep: "Choose a geography, inspect source freshness, and distinguish observed from modeled evidence.", access: "public", terms: ["community", "county", "neighborhood", "map", "data", "policy"], primary: true },
  { id: "community-impact", label: "Explore community scenarios", description: "Compare conditions and possible responses.", workspace: "community", href: "/community-impact", nextStep: "Review scenario assumptions. Scenarios are not observed outcomes.", access: "public", terms: ["scenario", "scenarios", "planning"] },
  { id: "community-voice", label: "Share community perspectives", description: "Participate through the community workspace.", workspace: "community", href: "/community", nextStep: "Choose how to participate and review the applicable consent choices.", access: "public", terms: ["voice", "participate"] },
];
// One default decision surface, not the union of every audience's priorities.
export const HOME_ENTRY_TASK_IDS = ["find-support", "check-benefits", "learn-work"] as const;
export function homeEntryTasks(): WorkspaceTask[] {
  return HOME_ENTRY_TASK_IDS.flatMap(id => {
    const task = WORKSPACE_TASKS.find(item => item.id === id);
    return task?.access === "public" && task.workspace === "residents" ? [task] : [];
  });
}
export function entryTaskForPath(path: string): WorkspaceTask | undefined {
  const clean = path.split(/[?#]/)[0];
  return homeEntryTasks().find(task => task.href === clean);
}
export interface ViewerAccess { authenticated: boolean; staff: boolean; admin: boolean; loading?: boolean }
export function canUseTask(task: WorkspaceTask, viewer: ViewerAccess): boolean {
  if (task.access === "public") return true;
  if (!viewer.authenticated) return false;
  if (task.access === "authenticated") return true;
  return task.access === "admin" ? viewer.admin : viewer.staff || viewer.admin;
}
export function workspaceForPath(path: string): WorkspaceId | null {
  const clean = path.split(/[?#]/)[0];
  const explicit = clean.match(/^\/workspace\/([^/]+)$/)?.[1];
  if (isWorkspaceId(explicit)) return explicit;
  const match = [...WORKSPACE_TASKS].sort((a, b) => b.href.length - a.href.length)
    .find(task => clean === task.href || clean.startsWith(`${task.href}/`));
  if (match) return match.workspace;
  const groups: [WorkspaceId, string[]][] = [
    ["organizations", ["/hub/fund", "/hub/serve", "/grants", "/my-grants", "/grant-", "/loi-", "/rfp-", "/teaming", "/won-proposals", "/staffing", "/logic-model", "/for-nonprofits", "/for-partners", "/app/entity", "/cohort-onboarding", "/services", "/esign", "/chw-", "/partners", "/coalition", "/member-health"]],
    ["funders", ["/impact", "/methodology", "/research-hub", "/implementation", "/outcomes", "/dosage", "/pilot-reports", "/funder-", "/transparency", "/peer-review"]],
    ["community", ["/community", "/sdoh", "/equity-", "/city-comparison", "/neighborhood", "/gun-violence", "/voices", "/coverage", "/community-data", "/ceds", "/manor", "/austin", "/pflugerville", "/rural", "/agriculture", "/411"]],
    ["residents", ["/academy", "/subjects", "/subject", "/curriculum", "/mentorship", "/fafsa", "/workforce", "/apprenticeship", "/jobs", "/my-", "/benefits", "/get-help", "/resources", "/resource-directory", "/intake", "/foster-youth", "/youth-", "/justice", "/reentry", "/safe-passage", "/streets", "/veterans", "/health-", "/behavioral-health", "/prevention", "/parent", "/mos-", "/navigator", "/sparky", "/hub/grow"]],
  ];
  for (const [workspace, prefixes] of groups) {
    if (prefixes.some(prefix => clean === prefix || clean.startsWith(prefix.endsWith("-") ? prefix : `${prefix}/`))) return workspace;
  }
  return null;
}
export interface RoutingDecision {
  status: "suggested" | "clarify" | "unknown";
  taskIds: string[];
  reason: string;
  question?: string;
  evidence: "Product routing catalog";
  limits: string;
}
export function inferNavigation(input: string, workspace?: WorkspaceId): RoutingDecision {
  const text = input.toLowerCase().trim().slice(0, 600);
  const base = { evidence: "Product routing catalog" as const, limits: "Navigation suggestion only; no eligibility, identity, permissions, or service availability inferred." };
  if (!text) return { ...base, status: "unknown", taskIds: [], reason: "Describe a goal or choose a task." };
  if (/\b(911|suicide|suicidal|emergency|immediate danger)\b/.test(text)) {
    return { ...base, status: "suggested", taskIds: ["find-support"], reason: "This navigation guide is not an emergency service. If you are in immediate danger, call 911. In the U.S., call or text 988 for suicide or crisis support; the support page also lists crisis resources." };
  }
  // Remove rejected options before determining a financial goal's context.
  const affirmative = text.replace(/\bnon-profit\b/g, "nonprofit").replace(/\b(?:not|no|don't need|do not need|don't want|do not want)\s+(?:any\s+)?[a-z]+/g, "");
  const words = new Set(affirmative.match(/[a-z]+/g) ?? []);
  const financial = ["funding", "money", "financial"].some(term => words.has(term));
  const organizationFunding = financial && ["organization", "organizations", "nonprofit", "nonprofits", "business", "grant", "grants", "proposal", "proposals"].some(term => words.has(term));
  const educationFunding = financial && ["tuition", "college", "education", "training"].some(term => words.has(term));
  const personalFunding = financial && ["myself", "family", "personal", "individual", "housing", "rent", "food", "benefits", "assistance"].some(term => words.has(term));
  // A workspace display preference alone never resolves generic funding.
  if (financial && !organizationFunding && !educationFunding && !personalFunding) {
    return { ...base, status: "clarify", taskIds: ["find-support", "organization-funding", "learn-work"], reason: "Funding can mean personal support, organizational funding, or education support.", question: "Is this for yourself or your family, an organization, or education and training?" };
  }
  const candidates = WORKSPACE_TASKS.filter(task => {
    // "Nonprofit funding" describes an audience and goal, not two actions.
    if (organizationFunding && task.id === "coordinate-services") return task.terms.some(term => term !== "nonprofit" && words.has(term));
    return task.terms.some(term => words.has(term));
  });
  const addTask = (id: string) => {
    const task = WORKSPACE_TASKS.find(item => item.id === id);
    if (task && !candidates.includes(task)) candidates.push(task);
  };
  if (organizationFunding) addTask("organization-funding");
  if (educationFunding) addTask("learn-work");
  if (personalFunding && !candidates.some(task => task.workspace === "residents")) addTask("find-support");
  // A display preference must not erase another explicitly stated goal.
  const result = workspace ? [...candidates].sort((a, b) => Number(b.workspace === workspace) - Number(a.workspace === workspace)) : candidates;
  if (!result.length) return { ...base, status: "unknown", taskIds: [], reason: "No clear match in the routing catalog. Choose a workspace or use the Navigator for a broader conversation." };
  if (result.length > 1) return { ...base, status: "clarify", taskIds: result.map(task => task.id).slice(0, 5), reason: "Your description relates to more than one task.", question: "Which goal do you want to work on first?" };
  return { ...base, status: "suggested", taskIds: [result[0].id], reason: `${workspace && result[0].workspace !== workspace ? "This goal belongs to another workspace. " : ""}Your stated goal matches ${result[0].label.toLowerCase()}. You choose whether to continue.` };
}