export interface PartnerTool {
  id: string;
  label: string;
  description: string;
  path: string;
  icon: string;
  badge?: string;
  tags: string[];
}

export const TOOL_CATALOG: PartnerTool[] = [
  {
    id: "resource-navigator",
    label: "Resource Navigator",
    description:
      "Search 20,670+ verified community resources across housing, health, food, legal aid, and workforce — bilingual EN/ES, CHW-guided.",
    path: "/community-resource-directory",
    icon: "Compass",
    badge: "20K+ Resources",
    tags: ["all"],
  },
  {
    id: "benefits-screener",
    label: "Benefits Screener",
    description:
      "Screen participants for SNAP, Medicaid, housing assistance, and 40+ federal and state programs in under 5 minutes.",
    path: "/benefits-screener",
    icon: "Shield",
    tags: ["all"],
  },
  {
    id: "ai-companion",
    label: "AI Companion — SPARKY",
    description:
      "Warm, plain-language AI partner for staff and participants. Navigates platform tools, answers benefits questions, supports case planning.",
    path: "/ai-companion",
    icon: "Sparkles",
    badge: "AI-Powered",
    tags: ["all"],
  },
  {
    id: "community-map",
    label: "Community Intelligence Map",
    description:
      "GIS maps layered with CDC PLACES, Census, FBI, and USDA data. See your community's health, safety, and economic landscape by tract.",
    path: "/community-map",
    icon: "Map",
    tags: ["all"],
  },
  {
    id: "coalition-portal",
    label: "Coalition Portal",
    description:
      "Build and manage coalition structures, track member commitments, coordinate prevention launches, and log shared outcomes.",
    path: "/coalition-portal",
    icon: "Network",
    tags: ["all"],
  },
  {
    id: "collaboration-hub",
    label: "Collaboration Hub",
    description:
      "Shared workspace for cross-org coordination: joint proposals, meeting notes, action items, and partner communications.",
    path: "/collaboration-hub",
    icon: "Users",
    tags: ["all"],
  },
  {
    id: "grant-tools",
    label: "Grant Tools & RFP Engine",
    description:
      "AI-assisted grant writing, compliance matrix, RFP fidelity scoring, and a teaming network to find sub and prime partners.",
    path: "/rfp-fidelity",
    icon: "FileText",
    badge: "AI Writing",
    tags: ["all"],
  },
  {
    id: "ai-tools",
    label: "AI Tools Hub",
    description:
      "Full suite: document writer, data analyzer, presentation builder, and research assistant — all running on ethical AI.",
    path: "/ai-tools",
    icon: "Zap",
    tags: ["all"],
  },
  {
    id: "workforce-dashboard",
    label: "Workforce Pipeline Dashboard",
    description:
      "Track participant placement, retention, readiness scores, and employer commitments across the workforce pipeline.",
    path: "/workforce-dashboard",
    icon: "TrendingUp",
    tags: ["Workforce Development", "Education"],
  },
  {
    id: "chw-dashboard",
    label: "CHW Operations Dashboard",
    description:
      "Community health worker dispatch, SDOH risk scoring, care coordination tracking, and outreach task management.",
    path: "/chw-dashboard",
    icon: "Heart",
    tags: ["Behavioral Health", "Health Equity", "Maternal Health"],
  },
  {
    id: "benefits-command-center",
    label: "Benefits Command Center",
    description:
      "Full-spectrum eligibility, enrollment support, and ongoing benefits management for complex multi-program participants.",
    path: "/benefits-command-center",
    icon: "Command",
    tags: ["Housing", "Behavioral Health", "Health Equity", "Reentry & Justice", "Substance Use"],
  },
  {
    id: "reentry-dashboard",
    label: "Reentry Operations Dashboard",
    description:
      "Track returning citizens through intake, housing, employment, and legal milestones with automated risk flags.",
    path: "/reentry-dashboard",
    icon: "RotateCcw",
    tags: ["Reentry & Justice"],
  },
  {
    id: "foster-youth",
    label: "Foster Youth Tools",
    description:
      "End-to-end platform for aged-out foster youth: housing vouchers, ETV, Chafee, Medicaid-to-26, and FAFSA independent status — bilingual, no login required for youth.",
    path: "/foster-youth",
    icon: "Home",
    tags: ["Youth Development", "Foster Care", "Housing", "Education"],
  },
  {
    id: "academy",
    label: "ThriveUp Academy",
    description:
      "AI-powered learning platform for participants: workforce readiness, digital literacy, financial education, and credential pathways.",
    path: "/academy",
    icon: "GraduationCap",
    tags: ["Education", "Youth Development", "Workforce Development", "Reentry & Justice"],
  },
  {
    id: "parent-dashboard",
    label: "Family & Parent Dashboard",
    description:
      "Family Circles case coordination, parent engagement tracking, and multi-generational support planning.",
    path: "/parent-dashboard",
    icon: "Baby",
    tags: ["Youth Development", "Education", "Foster Care", "Domestic Violence"],
  },
  {
    id: "business-plan",
    label: "Platform Overview & Business Plan",
    description:
      "Shareable overview of the full TCAF ecosystem — for funders, boards, and prospective partners.",
    path: "/business-plan",
    icon: "Building2",
    tags: ["all"],
  },
];

export function getToolsForOrg(focusAreas: string[]): PartnerTool[] {
  if (!focusAreas || focusAreas.length === 0) {
    return TOOL_CATALOG.filter((t) => t.tags.includes("all"));
  }
  return TOOL_CATALOG.filter((tool) => {
    if (tool.tags.includes("all")) return true;
    return tool.tags.some((tag) => focusAreas.includes(tag));
  });
}

export const PARTNER_TYPE_PRESETS: Record<string, string[]> = {
  "Workforce Provider": ["Workforce Development", "Education", "Reentry & Justice"],
  "Health Organization": ["Behavioral Health", "Health Equity", "Maternal Health", "Substance Use"],
  "Housing Provider": ["Housing", "Reentry & Justice"],
  "Faith-Based Organization": ["Workforce Development", "Youth Development", "Food Security"],
  "Education / School": ["Education", "Youth Development"],
  "Justice / Reentry": ["Reentry & Justice", "Workforce Development"],
  "Youth Services": ["Youth Development", "Education", "Foster Care"],
  "Advocacy Organization": ["Civic Engagement"],
  "Community Health Worker Network": ["Health Equity", "Behavioral Health"],
  "Foster Care / Child Welfare": ["Foster Care", "Youth Development", "Housing"],
};
