/**
 * Stakeholder Demo Door content — real-data-only.
 *
 * Narrative copy, value chains, story walks, cited benchmarks, and report
 * format templates. NO synthetic statistics about any city, ever: every
 * number shown to stakeholders comes from live platform routes (linked,
 * with source route and date on the tool itself) or from the cited
 * external benchmarks below.
 */

export type DemoAudienceKey = "banks" | "schools" | "governments" | "entities";

export interface DemoBenchmark {
  claim: string;
  source: string;
  year: string;
  url: string;
}

export interface DemoStep {
  label: string;
  route: string;
}

export interface DemoAudienceView {
  key: DemoAudienceKey;
  tab: string;
  headline: string;
  subcopy: string;
  chain: DemoStep[];
  story: {
    title: string;
    intro: string;
    steps: DemoStep[];
    zoomTitle: string;
    zoom: DemoStep[];
  };
  liveTools: string[];
  benchmarks: DemoBenchmark[];
  cta: { label: string; route: string };
}

export const DEMO_AUDIENCE_KEYS: DemoAudienceKey[] = ["banks", "schools", "governments", "entities"];

export function isValidDemoAudience(v: string | null | undefined): v is DemoAudienceKey {
  return !!v && (DEMO_AUDIENCE_KEYS as string[]).includes(v);
}

export const DEMO_VIEWS: Record<DemoAudienceKey, DemoAudienceView> = {
  banks: {
    key: "banks",
    tab: "Community Banks",
    headline: "See your assessment area like never before — and act on it.",
    subcopy:
      "One system follows a person from need to documented outcome, and links that journey to the organizations doing the work, the place-level evidence, and the funding that sustains it. Every number you will see comes from the live platform.",
    chain: [
      { label: "ZIP-level need", route: "/community-analysis" },
      { label: "Who does the work", route: "/community-gravity" },
      { label: "Community-development alignment", route: "/community-banks" },
      { label: "Referrals & participation", route: "/partners/join" },
      { label: "Modeled costs & benefits", route: "/chainweb" },
      { label: "Measurable outputs", route: "/impact" },
    ],
    story: {
      title: "A family, end to end",
      intro:
        "Walk one family's journey through the live platform. Every step is a real tool; every number inside it is real platform data.",
      steps: [
        { label: "Find help tonight", route: "/411" },
        { label: "Check eligibility", route: "/benefits-screener" },
        { label: "Family follow-through", route: "/parents" },
        { label: "Learn money skills", route: "/academy/financial-literacy" },
        { label: "Explore careers", route: "/academy/careers" },
        { label: "See the documented outcome", route: "/impact" },
      ],
      zoomTitle: "Then see the same place through your lens",
      zoom: [
        { label: "Who is doing the work", route: "/community-gravity" },
        { label: "County evidence", route: "/corridor-intelligence" },
        { label: "Model intervention costs and benefits", route: "/chainweb" },
        { label: "Your assessment area", route: "/community-banks" },
      ],
    },
    liveTools: [
      "/community-banks",
      "/community-gravity",
      "/community-analysis",
      "/chainweb",
      "/corridor-intelligence",
      "/community-story-pack",
    ],
    benchmarks: [
      {
        claim:
          "The number of community banks in the U.S. fell from 17,401 in 1984 to 6,146 in 2013 — consolidation makes differentiated community insight more valuable every year.",
        source: "FDIC via Statista",
        year: "1984–2013",
        url: "https://cashmere.io/v/FNLn63RQ7",
      },
      {
        claim:
          "In 2019, 23.3% of U.S. households with family income below $15,000 were unbanked, versus 0.6% above $75,000 — deposit growth and inclusion live in exactly the communities this platform maps.",
        source: "FDIC via Statista",
        year: "2019",
        url: "https://cashmere.io/v/uTZl4QmK4",
      },
      {
        claim:
          "findhelp, the U.S. community resource navigation platform, has raised $304M in total funding — institutions already pay for this category.",
        source: "PitchBook",
        year: "2026",
        url: "https://cashmere.io/v/EhdolS31L",
      },
    ],
    cta: { label: "Scope your assessment area now", route: "/community-banks" },
  },
  schools: {
    key: "schools",
    tab: "Schools & Universities",
    headline: "One campus for student readiness, family support, and evidence.",
    subcopy:
      "Students learn, families get connected, and the district sees progress — in one system, with measurement built in from day one.",
    chain: [
      { label: "Student learning", route: "/academy" },
      { label: "Family support", route: "/411" },
      { label: "Progress & evidence", route: "/academy/progress-report" },
      { label: "Community partners", route: "/partners" },
      { label: "District reporting", route: "/impact" },
    ],
    story: {
      title: "A campus, from adoption to evidence",
      intro:
        "The academy runs engagement, learning, and reporting in one place — every step below is a live tool.",
      steps: [
        { label: "The academy hub", route: "/academy" },
        { label: "Financial literacy", route: "/academy/financial-literacy" },
        { label: "Career explorer", route: "/academy/careers" },
        { label: "Progress report", route: "/academy/progress-report" },
        { label: "Longitudinal dashboard", route: "/academy/longitudinal" },
      ],
      zoomTitle: "The community around the campus",
      zoom: [
        { label: "Find community partners", route: "/partners" },
        { label: "See who is doing the work", route: "/community-gravity" },
      ],
    },
    liveTools: [
      "/academy",
      "/academy/financial-literacy",
      "/academy/careers",
      "/academy/progress-report",
      "/academy/longitudinal",
      "/academy/phased-rollout",
    ],
    benchmarks: [
      {
        claim:
          "Begin evaluation before the program starts; design indicators that reflect program goals; well-designed evaluation is worth the expense — ThriveUp builds measurement in from day one.",
        source: "Wiley, Advancing Health Literacy",
        year: "2012",
        url: "https://www.wiley.com/en-us/Advancing+Health+Literacy%3A+A+Framework+for+Understanding+and+Action-p-9780787984335",
      },
    ],
    cta: { label: "Open the learning hub", route: "/academy" },
  },
  governments: {
    key: "governments",
    tab: "Governments & Agencies",
    headline: "County-level evidence to coordination, without a data team.",
    subcopy:
      "Sourced county evidence, coalition coordination, and transparent reporting — one system from data to decisions.",
    chain: [
      { label: "Community evidence", route: "/corridor-intelligence" },
      { label: "Policy comparison", route: "/city-comparison" },
      { label: "Coalition coordination", route: "/coalition" },
      { label: "Shared outcomes", route: "/transparency" },
    ],
    story: {
      title: "A county, from evidence to accountability",
      intro: "Follow the county intelligence chain — every step is a live tool with sourced data.",
      steps: [
        { label: "County community intelligence", route: "/corridor-intelligence" },
        { label: "Community evidence vault", route: "/corridor/evidence" },
        { label: "Coalition operations", route: "/coalition" },
        { label: "Stakeholder transparency dashboard", route: "/transparency" },
      ],
      zoomTitle: "Compare and scale",
      zoom: [
        { label: "City comparison", route: "/city-comparison" },
        { label: "Where we operate", route: "/coverage" },
      ],
    },
    liveTools: [
      "/corridor-intelligence",
      "/corridor/evidence",
      "/city-comparison",
      "/coalition",
      "/transparency",
      "/coverage",
    ],
    benchmarks: [
      {
        claim:
          "211 handled 16.8 million requests for help in 2024 — need volume is enormous, but a helpline alone does not follow through.",
        source: "United Way Worldwide",
        year: "2024",
        url: "https://www.unitedway.org/news/211-helpline-data-reveals-most-pressing-us-community-needs",
      },
    ],
    cta: { label: "Open county intelligence", route: "/corridor-intelligence" },
  },
  entities: {
    key: "entities",
    tab: "Community Entities",
    headline: "Your organization, visible and coordinated.",
    subcopy:
      "IRS-record visibility, a real partner network, referrals with warm handoffs, and an effectiveness scorecard — in one system.",
    chain: [
      { label: "Join the network", route: "/partners/join" },
      { label: "Referrals & warm handoffs", route: "/collaboration-hub" },
      { label: "Effectiveness", route: "/partner-scorecard" },
      { label: "Data integration", route: "/agency-connector" },
      { label: "Community visibility", route: "/community-gravity" },
    ],
    story: {
      title: "An organization, from filing to scorecard",
      intro: "Organizations become visible through public records and become coordinated through live tools.",
      steps: [
        { label: "See who is doing the work", route: "/community-gravity" },
        { label: "Find community partners", route: "/partners" },
        { label: "Collaboration hub", route: "/collaboration-hub" },
        { label: "Partner effectiveness scorecard", route: "/partner-scorecard" },
      ],
      zoomTitle: "Connect your systems",
      zoom: [{ label: "Agency connector", route: "/agency-connector" }],
    },
    liveTools: [
      "/community-gravity",
      "/partners",
      "/collaboration-hub",
      "/partner-scorecard",
      "/agency-connector",
      "/partners/join",
    ],
    benchmarks: [],
    cta: { label: "Join as a partner", route: "/partners/join" },
  },
};

export const DEMO_FUNDING_ASK = {
  title: "The funding ask",
  body:
    "You already fund United Way and 211 in this community — keep doing it. Those dollars fund the find help step. The same investment goes much deeper here: through eligibility, stability, learning, and earning to a documented outcome. The chainweb model shows intervention costs and benefits, so leadership sees the return on community thriving, not just the spend.",
  note: "An extension of existing community-development and philanthropy budgets, not a replacement ask.",
};

export const DEMO_FORMAT_EXAMPLE = {
  badge: "Format example — report layout, not data.",
  title: "Quarterly community engagement report",
  caption:
    "What your report will look like. Placeholder fields only — this layout carries no city data. Your real report is generated from live platform data.",
  fields: [
    "Community served: ______",
    "Referrals connected: ______",
    "Partner organizations active: ______",
    "Learning milestones completed: ______",
    "Documented outcomes: ______",
    "Sources and dates: attached to every figure",
  ],
};

export const DEMO_GO_LIVE: DemoStep[] = [
  { label: "Invite partners", route: "/partners/join" },
  { label: "Select your place", route: "/coverage" },
  { label: "Connect your data", route: "/agency-connector" },
  { label: "Run the work", route: "/workspaces" },
  { label: "Report outcomes", route: "/transparency" },
];

export const DEMO_LIVE_UNAVAILABLE = "Live data unavailable in this preview.";

export const DEMO_HONESTY_FOOTER =
  "Real data only. Every number on this page comes from a live platform tool or a cited source. We never present synthetic data about a city. Format examples show report layouts only.";
