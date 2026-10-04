/**
 * Per-route SEO metadata for server-side head injection.
 *
 * Each public URL should return its own <title>, <meta name="description">,
 * og:*, and twitter:* values in the initial HTML so crawlers and social
 * preview bots see route-specific content without executing JavaScript.
 *
 * The injectRouteMeta() function performs string replacement on the raw HTML
 * template before it is sent to the client.
 */

import { POSITIONING_LINE, POSITIONING_SHORT } from "@shared/canonical-claims";

const BASE_URL =
  process.env.PRODUCTION_URL ||
  process.env.REPLIT_DEPLOYMENT_URL ||
  "https://thrivingcommunitiesforall.com";

interface RouteMeta {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
}

const DEFAULT_META: RouteMeta = {
  title: "TCAF + ThriveUp | The Community Integration and Implementation Platform",
  description: POSITIONING_LINE,
  ogTitle: "TCAF + ThriveUp — The Community Integration and Implementation Platform",
  ogDescription: POSITIONING_SHORT,
};

/** Static path → metadata. Longest prefix wins for prefix-based lookups. */
const STATIC_META: Record<string, RouteMeta> = {
  "/community-banks": {
    title: "Community Bank Impact View | TCAF + ThriveUp",
    description: "A public county or metro snapshot for banks, funders, and CRA teams: poverty, vulnerability, housing, and child-care supply with every number labeled observed, modeled, or unavailable and traced to Census, CDC, or HUD.",
    ogTitle: "Community Bank Impact View",
    ogDescription: "Neighborhood evidence for community reinvestment decisions, with source and coverage disclosed on every number.",
  },
  "/pricing": {
    title: "Pricing & Plans | ThriveUp Academy",
    description:
      "Explore ThriveUp Academy partnership tiers, community access plans, and platform pricing designed to scale with every organization — from grassroots nonprofits to city agencies.",
    ogTitle: "ThriveUp Academy Pricing & Plans",
    ogDescription:
      "Flexible pricing built for nonprofits, city agencies, and community organizations. Scale AI-powered workforce development with a plan that fits your budget.",
  },
  "/partners": {
    title: "Community Partners | ThriveUp Academy",
    description:
      "ThriveUp Academy's national network of community partners — nonprofits, workforce boards, health agencies, and faith communities — connected through a 50-state architecture with local availability that varies.",
    ogTitle: "ThriveUp Academy Partner Network",
    ogDescription:
      "Discover how ThriveUp Academy partners with nonprofits, city agencies, and community organizations to deliver integrated workforce development and wraparound services.",
  },
  "/community-partners": {
    title: "Community Partners | ThriveUp Academy",
    description:
      "ThriveUp Academy's national network of community partners — nonprofits, workforce boards, health agencies, and faith communities — connected through a 50-state architecture with local availability that varies.",
    ogTitle: "ThriveUp Academy Partner Network",
    ogDescription:
      "Discover how ThriveUp Academy partners with nonprofits, city agencies, and community organizations to deliver integrated workforce development and wraparound services.",
  },
  "/voice": {
    title: "Community Voice | ThriveUp Academy",
    description:
      "Real stories from people in ThriveUp Academy programs — workforce trainees, returning citizens, foster youth, veterans, and community health workers sharing their journeys.",
    ogTitle: "Community Voice — ThriveUp Academy",
    ogDescription:
      "Hear directly from the communities we serve. Workforce trainees, returning citizens, foster youth, and veterans share their ThriveUp Academy journeys.",
  },
  "/foster-youth": {
    title: "Foster Youth Hub | ThriveUp Academy",
    description:
      "Wraparound support for current and former foster youth — housing navigation, transition planning, benefits access, educational pathways, and community connection through ThriveUp Academy.",
    ogTitle: "Foster Youth Hub — ThriveUp Academy",
    ogDescription:
      "Comprehensive support for current and former foster youth: housing, benefits, transition planning, educational pathways, and peer community — all in one place.",
  },
  "/foster-youth/toolkit": {
    title: "Foster Youth Toolkit | ThriveUp Academy",
    description:
      "Practical tools and resources for current and former foster youth navigating housing, education, employment, and benefits in Texas and beyond.",
    ogTitle: "Foster Youth Toolkit — ThriveUp Academy",
    ogDescription:
      "Housing guides, benefits checklists, education resources, and employment tools — practical support for foster youth navigating independence.",
  },
  "/foster-youth/transition-plan": {
    title: "Transition Planning for Foster Youth | ThriveUp Academy",
    description:
      "Build a personalized transition plan covering housing, employment, education, healthcare, and support networks — designed for youth aging out of foster care.",
    ogTitle: "Foster Youth Transition Planning — ThriveUp Academy",
    ogDescription:
      "Create a personalized plan for housing, employment, healthcare, and education as you transition out of foster care.",
  },
  "/foster-youth/rights": {
    title: "Know Your Rights — Foster Youth | ThriveUp Academy",
    description:
      "Every foster youth has rights. Learn about extended care, education rights, housing protections, and legal resources available in Texas.",
    ogTitle: "Foster Youth Rights — ThriveUp Academy",
    ogDescription:
      "Understand your legal rights as a current or former foster youth — extended care, education, housing, and more.",
  },
  "/foster-youth/benefits": {
    title: "Benefits for Foster Youth | ThriveUp Academy",
    description:
      "Find and apply for Medicaid, SNAP, housing assistance, education grants, and other benefits available to current and former foster youth.",
    ogTitle: "Foster Youth Benefits Navigator — ThriveUp Academy",
    ogDescription:
      "Discover benefits you qualify for as a current or former foster youth — Medicaid, SNAP, housing assistance, education grants, and more.",
  },
  "/safe-passage": {
    title: "Safe Passage — Domestic Violence & Safety Support | ThriveUp Academy",
    description:
      "Confidential safety planning, housing navigation, legal support, employment pathways, and benefits access for survivors of domestic violence and unsafe home situations.",
    ogTitle: "Safe Passage — ThriveUp Academy",
    ogDescription:
      "Confidential support for survivors: safety planning, housing navigation, legal help, employment pathways, and benefits access — all in one trusted place.",
  },
  "/safe-passage/safety-planning": {
    title: "Safety Planning | Safe Passage — ThriveUp Academy",
    description:
      "Create a confidential, personalized safety plan. Our guided tool helps survivors identify risks, plan safe exits, and connect with emergency resources.",
    ogTitle: "Safety Planning — ThriveUp Academy Safe Passage",
    ogDescription:
      "Build a confidential safety plan with step-by-step guidance for identifying risks, planning safe exits, and connecting with local resources.",
  },
  "/safe-passage/housing-assessment": {
    title: "Housing Assessment | Safe Passage — ThriveUp Academy",
    description:
      "Find safe housing options, emergency shelter, and transitional housing with our confidential assessment tool for survivors of domestic violence.",
    ogTitle: "Housing Assessment — ThriveUp Academy Safe Passage",
    ogDescription:
      "Assess your housing needs and find emergency shelter, transitional housing, and permanent housing options in your area.",
  },
  "/safe-passage/legal-navigator": {
    title: "Legal Navigator | Safe Passage — ThriveUp Academy",
    description:
      "Navigate protective orders, divorce, child custody, and immigration options with our confidential legal resource guide for domestic violence survivors.",
    ogTitle: "Legal Navigator — ThriveUp Academy Safe Passage",
    ogDescription:
      "Understand your legal options: protective orders, divorce, child custody, and immigration resources for domestic violence survivors.",
  },
  "/safe-passage/employment-pathway": {
    title: "Employment Pathway | Safe Passage — ThriveUp Academy",
    description:
      "Build financial independence through job training, resume support, career coaching, and employment placement — designed specifically for survivors rebuilding their lives.",
    ogTitle: "Employment Pathway — ThriveUp Academy Safe Passage",
    ogDescription:
      "Job training, resume support, and career coaching to help survivors build financial independence and stable employment.",
  },
  "/initiatives": {
    title: "Community Initiatives | ThriveUp Academy",
    description:
      "ThriveUp Academy's community initiatives — child care access, rural workforce development, farmworker support, and place-based programs serving communities across Texas and the nation.",
    ogTitle: "Community Initiatives — ThriveUp Academy",
    ogDescription:
      "Place-based and statewide initiatives addressing child care, rural workforce development, farmworker support, and community health across Texas and the nation.",
  },
  "/academy/trade-sims": {
    title: "Trade Simulations | ThriveUp Academy",
    description:
      "Hands-on trade simulation experiences in welding, electrical, HVAC, plumbing, and more — AI-powered career exploration for workforce-bound students and adult learners.",
    ogTitle: "Trade Simulations — ThriveUp Academy",
    ogDescription:
      "Explore skilled trades with AI-powered simulations in welding, electrical, HVAC, plumbing, and more. Career-connected learning for students and adult learners.",
  },
  "/about": {
    title: "About ThriveUp Academy",
    description:
      "ThriveUp Academy is a community-infrastructure platform connecting people to opportunity, grant funding, and coordinated services — built by and for under-resourced communities.",
    ogTitle: "About ThriveUp Academy",
    ogDescription:
      "Learn how ThriveUp Academy was built — our mission, leadership, implementation science foundation, and commitment to under-resourced communities nationwide.",
  },
  "/contact": {
    title: "Contact ThriveUp Academy",
    description:
      "Reach ThriveUp Academy's team for partnership inquiries, program questions, grant collaboration, or media requests. Based in Austin, TX — serving communities nationwide.",
    ogTitle: "Contact ThriveUp Academy",
    ogDescription:
      "Get in touch with ThriveUp Academy for partnership, program, or media inquiries. Based in Austin, TX, with a 50-state architecture and location-dependent availability.",
  },
  "/veterans": {
    title: "Veterans Program | ThriveUp Academy",
    description:
      "Workforce development, career transition support, mental health resources, and peer mentorship for veterans and military families through ThriveUp Academy.",
    ogTitle: "Veterans Program — ThriveUp Academy",
    ogDescription:
      "Career transition, workforce training, mental health resources, and peer mentorship for veterans and military families.",
  },
  "/reentry-program": {
    title: "Reentry Program | ThriveUp Academy",
    description:
      "Comprehensive reentry support for justice-involved individuals — job training, housing navigation, benefits access, mentorship, and legal resources through ThriveUp Academy.",
    ogTitle: "Reentry Program — ThriveUp Academy",
    ogDescription:
      "Job training, housing, benefits, mentorship, and legal resources for justice-involved individuals rebuilding their lives.",
  },
  "/get-help": {
    title: "Get Help | ThriveUp Academy",
    description:
      "Find the right support for your situation — benefits screening, housing navigation, workforce training, health resources, crisis support, and more through ThriveUp Academy.",
    ogTitle: "Get Help — ThriveUp Academy",
    ogDescription:
      "Find benefits, housing, workforce training, health services, and crisis support. ThriveUp Academy connects you to the right resource.",
  },
  "/impact": {
    title: "Community Impact | ThriveUp Academy",
    description:
      "ThriveUp Academy's measurable community impact — workforce placements, benefits accessed, lives served, and grant outcomes across our national network.",
    ogTitle: "Community Impact — ThriveUp Academy",
    ogDescription:
      "Measurable outcomes: workforce placements, benefits secured, grant impact, and community reach across ThriveUp Academy's national network.",
  },
  "/behavioral-health": {
    title: "Behavioral Health Program | ThriveUp Academy",
    description:
      "Trauma-informed behavioral health support, mental wellness resources, crisis navigation, and peer support services through ThriveUp Academy's community health network.",
    ogTitle: "Behavioral Health Program — ThriveUp Academy",
    ogDescription:
      "Trauma-informed mental wellness support, crisis navigation, and peer services integrated into community-based care.",
  },
  "/workforce-assessment": {
    title: "Workforce Assessment | ThriveUp Academy",
    description:
      "Assess your workforce readiness, identify skill gaps, and discover training pathways aligned to in-demand careers in your region.",
    ogTitle: "Workforce Assessment — ThriveUp Academy",
    ogDescription:
      "Assess your workforce skills, identify gaps, and find training pathways matched to in-demand jobs in your region.",
  },
  "/workforce-training": {
    title: "Workforce Training | ThriveUp Academy",
    description:
      "AI-enhanced workforce training programs covering digital skills, skilled trades, healthcare, and professional development for adult learners and job seekers.",
    ogTitle: "Workforce Training — ThriveUp Academy",
    ogDescription:
      "AI-enhanced training programs in digital skills, skilled trades, healthcare, and professional development for adult learners.",
  },
  "/resources": {
    title: "Resources | ThriveUp Academy",
    description:
      "Guides, toolkits, research, and community resources from ThriveUp Academy — covering workforce development, health equity, education access, and community infrastructure.",
    ogTitle: "Resources — ThriveUp Academy",
    ogDescription:
      "Guides, toolkits, and resources on workforce development, health equity, education access, and community infrastructure.",
  },
  "/privacy": {
    title: "Privacy Policy | ThriveUp Academy",
    description:
      "ThriveUp Academy's privacy policy — how we collect, use, and protect your data with community trust and dignity at the center of every decision.",
    ogTitle: "Privacy Policy — ThriveUp Academy",
    ogDescription:
      "How ThriveUp Academy handles your data — collected with consent, protected with care, and never sold.",
  },
  "/child-care": {
    title: "Child Care Access | ThriveUp Academy",
    description:
      "Find child care subsidies, provider networks, and family support resources through ThriveUp Academy's child care access initiative.",
    ogTitle: "Child Care Access — ThriveUp Academy",
    ogDescription:
      "Find child care subsidies, local providers, and family support resources — helping working families access affordable, quality care.",
  },
  "/rural-intel": {
    title: "Rural Intelligence | ThriveUp Academy",
    description:
      "Data, resources, and community support for rural communities — farm operations, workforce development, connectivity, and health services through ThriveUp Academy.",
    ogTitle: "Rural Intelligence — ThriveUp Academy",
    ogDescription:
      "Actionable data and support for rural communities: farm operations, workforce development, connectivity, and health resources.",
  },
  "/health-wellness": {
    title: "Health & Wellness | ThriveUp Academy",
    description:
      "Integrated health and wellness resources — benefits navigation, behavioral health, preventive care, and community health worker support through ThriveUp Academy.",
    ogTitle: "Health & Wellness — ThriveUp Academy",
    ogDescription:
      "Benefits navigation, behavioral health, preventive care, and CHW-delivered services integrated into community health support.",
  },
  "/ecosystem": {
    title: "Ecosystem Network | ThriveUp Academy",
    description:
      "ThriveUp Academy's connected ecosystem of organizations, platforms, and data networks — collaborating to deliver integrated services at scale.",
    ogTitle: "Ecosystem Network — ThriveUp Academy",
    ogDescription:
      "A connected network of organizations and platforms working together to deliver integrated community services at scale.",
  },
  "/our-approach": {
    title: "Our Approach | ThriveUp Academy",
    description:
      "ThriveUp Academy's implementation science approach — CFIR framework, community-driven design, data-driven impact measurement, and equity at every layer.",
    ogTitle: "Our Approach — ThriveUp Academy",
    ogDescription:
      "Implementation science, community-driven design, and equity-centered data practices behind ThriveUp Academy's community infrastructure platform.",
  },
  "/why-thriveup": {
    title: "Why ThriveUp Academy",
    description:
      "Why ThriveUp Academy is different — from community-owned infrastructure to stipended shadow workers, ITI consent architecture, and multi-disciplinary implementation science.",
    ogTitle: "Why ThriveUp Academy",
    ogDescription:
      "Community-owned infrastructure, dignity-first design, stipended shadow workers, and multi-disciplinary science — the ThriveUp difference.",
  },
  "/navigator": {
    title: "Community Navigator | ThriveUp Academy",
    description:
      "AI-powered community navigation — find benefits, services, training, and support tailored to your specific situation through ThriveUp Academy.",
    ogTitle: "Community Navigator — ThriveUp Academy",
    ogDescription:
      "Find benefits, services, and training matched to your situation with AI-powered community navigation.",
  },
  "/chainweb": {
    title: "ChainWeb — Social Determinants Network | ThriveUp Academy",
    description:
      "ChainWeb maps the interconnected social determinants of health and workforce outcomes, enabling community organizations to understand and address systemic barriers.",
    ogTitle: "ChainWeb — ThriveUp Academy",
    ogDescription:
      "Map the interconnected social determinants driving community outcomes — and coordinate cross-sector action to address them.",
  },
  "/opportunity-youth": {
    title: "Opportunity Youth | ThriveUp Academy",
    description:
      "Education, workforce, and mentorship programs for opportunity youth — young people ages 16–24 who are out of school and out of work — through ThriveUp Academy.",
    ogTitle: "Opportunity Youth — ThriveUp Academy",
    ogDescription:
      "Education reconnection, workforce training, and mentorship for opportunity youth ages 16–24.",
  },
  "/herhealth": {
    title: "HerHealth | ThriveUp Academy",
    description:
      "Culturally responsive women's health resources, maternal health support, and wellness navigation through ThriveUp Academy's HerHealth initiative.",
    ogTitle: "HerHealth — ThriveUp Academy",
    ogDescription:
      "Culturally responsive women's health resources, maternal support, and wellness navigation for underserved communities.",
  },
  "/this-week": {
    title: "This Week in the Community | ThriveUp Academy",
    description:
      "Weekly community intelligence — upcoming events, new resources, program updates, and opportunities from the ThriveUp Academy network.",
    ogTitle: "This Week in the Community — ThriveUp Academy",
    ogDescription:
      "Weekly community updates: events, new resources, program news, and opportunities from the ThriveUp Academy network.",
  },
};

const landingRouteMeta = (label: string, description: string): RouteMeta => ({
  title: `${label} | ThriveUp Academy`,
  description,
  ogTitle: label,
  ogDescription: description,
});

Object.assign(STATIC_META, {
  "/benefits-screener": landingRouteMeta("Benefits Screener", "Screen for public benefits and get plain-language next-step guidance from ThriveUp Academy."),
  "/sdoh-explorer": landingRouteMeta("Community Data Explorer", "Explore source-labeled community conditions and social determinants of health to understand a place before choosing an intervention."),
  "/ecosystem-story": landingRouteMeta("Ecosystem Story", "Connect community conditions, partner capacity, evidence, and action into a story that stays honest about what is known."),
  "/for-nonprofits": landingRouteMeta("For Nonprofits", "TCAF helps nonprofits connect community evidence, program readiness, funding intelligence, implementation, and outcome reporting."),
  "/partners/join": landingRouteMeta("Join the Partner Network", "Connect your organization to a community-serving network with clear roles, capacity, referrals, and evidence boundaries."),
  "/curriculum": landingRouteMeta("Learning Pathways", "Build practical skills through guided learning pathways, workforce preparation, and community-serving technology."),
  "/academy/careers": landingRouteMeta("Career Pathways", "Explore career pathways, skill-building opportunities, and next steps through ThriveUp Academy."),
  "/youth-rights": landingRouteMeta("Youth Rights", "Find plain-language youth rights information, support pathways, and trusted next steps."),
  "/reentry": landingRouteMeta("Reentry Support", "Coordinate reentry planning, milestones, benefits, housing, workforce, and community support around the whole person."),
  "/coalition": landingRouteMeta("Coalition Portal", "Coordinate community partners, shared priorities, referrals, implementation, and outcome learning."),
  "/transition-plans": landingRouteMeta("Transition Plans", "Build a practical transition plan that connects readiness, benefits, education, work, and community support."),
  "/agency-connector": landingRouteMeta("Agency Connector", "Connect ThriveUp tools and data to an organization’s existing work while keeping privacy and governance boundaries visible."),
  "/health-network": landingRouteMeta("Health Network", "Connect people and partners to whole-person health, wellness, behavioral-health, and community-care pathways."),
  "/grants": landingRouteMeta("Grant Discovery", "Find funding opportunities and align them with community needs, organizational capacity, and funder requirements."),
  "/rplice-tools": landingRouteMeta("Better Science Lab and RPLICE Tools", "Use implementation-science frameworks, evidence-based practices, research translation, and planning tools."),
  "/mapgap-framework": landingRouteMeta("MAP-GAP Framework", "Move from mapping a community need to planning, action, measurement, adaptation, and learning."),
  "/academy": landingRouteMeta("ThriveUp Academy", "Build skills, explore pathways, and connect learning to workforce and community opportunity."),
  "/community-impact": landingRouteMeta("Community Impact", "Build a source-labeled community story: observe the place, connect evidence, choose an action, and learn from what changed."),
  "/services": landingRouteMeta("Services and Referrals", "Coordinate service pathways and referrals so people and organizations can move to the next step without starting over."),
  "/program-designer": landingRouteMeta("Program Designer", "Turn community evidence, implementation science, partner capacity, and lived context into an actionable program plan."),
  "/outcomes": landingRouteMeta("Outcome Reporting", "Track reach, implementation, fidelity, outcomes, and learning with clear boundaries between observed and modeled values."),
  "/community-compare": landingRouteMeta("Community Comparison", "Compare community conditions at the geography the source supports, with definitions, sources, and limitations visible."),
  "/community-map": landingRouteMeta("Community Map", "Map community conditions and service context to understand the place before selecting a response."),
  "/impact": landingRouteMeta("Impact and Learning", "Connect program activity, implementation, outcomes, and learning for stronger community-serving decisions."),
  "/community-data": landingRouteMeta("Community Data", "Explore official community indicators and cited local-service information without presenting estimates as observed facts."),
  "/grant-narrative": landingRouteMeta("Grant Narrative", "Prepare a funder-facing narrative grounded in community evidence, program design, outcomes, and disclosed assumptions."),
  "/proposal-pipeline": landingRouteMeta("Proposal Pipeline", "Organize funding pursuits from opportunity fit through drafting, review, submission, and follow-up."),
  "/coverage": landingRouteMeta("Coverage and Availability", "See how ThriveUp coverage varies by location and which pathways are available for a given community."),
  "/community": landingRouteMeta("Community Pathways", "Start with community context, trusted support, and practical next steps for people and organizations."),
  "/hub": landingRouteMeta("ThriveUp Hub", "Choose a family, community, nonprofit, funder, or partner pathway and move to the next useful step."),
  "/workbench": landingRouteMeta("Community Workbench", "Bring evidence, planning, partner roles, and implementation steps together in one working surface."),
  "/sparky": landingRouteMeta("Sparky", "Use guided assistance to find a practical next step while keeping sources, limits, and human judgment visible."),
  "/ai-companion": landingRouteMeta("AI Companion", "Get bounded navigation support that helps you explore options without replacing eligibility, clinical, or community judgment."),
  "/logic-model": landingRouteMeta("Logic Model Builder", "Connect activities, implementation measures, outcomes, and learning in a clear community-serving logic model."),
});

/** Prefix-based metadata for dynamic and nested routes. */
const PREFIX_META: Array<{ prefix: string; meta: RouteMeta }> = [
  {
    prefix: "/foster-youth/",
    meta: {
      title: "Foster Youth Support | ThriveUp Academy",
      description:
        "Resources, tools, and community support for current and former foster youth — housing, benefits, education, and transition planning through ThriveUp Academy.",
      ogTitle: "Foster Youth Support — ThriveUp Academy",
      ogDescription:
        "Housing, benefits, education, and transition planning resources for current and former foster youth.",
    },
  },
  {
    prefix: "/safe-passage/",
    meta: {
      title: "Safe Passage Support | ThriveUp Academy",
      description:
        "Confidential safety, housing, legal, and employment support for survivors through ThriveUp Academy's Safe Passage program.",
      ogTitle: "Safe Passage — ThriveUp Academy",
      ogDescription:
        "Confidential support for survivors: safety, housing, legal help, and employment pathways.",
    },
  },
  {
    prefix: "/initiatives/",
    meta: {
      title: "Community Initiative | ThriveUp Academy",
      description:
        "A ThriveUp Academy community initiative delivering place-based services, workforce development, and community infrastructure.",
      ogTitle: "Community Initiative — ThriveUp Academy",
      ogDescription:
        "Place-based community initiatives delivering workforce development and wraparound services.",
    },
  },
  {
    prefix: "/voice/",
    meta: {
      title: "Community Story | ThriveUp Academy",
      description:
        "A community member's story from ThriveUp Academy — real voices from workforce trainees, returning citizens, foster youth, and veterans.",
      ogTitle: "Community Story — ThriveUp Academy",
      ogDescription:
        "A real story from the ThriveUp Academy community — workforce trainees, returning citizens, foster youth, and veterans sharing their journeys.",
    },
  },
  {
    prefix: "/academy/trade-sims/",
    meta: {
      title: "Trade Simulation | ThriveUp Academy",
      description:
        "An AI-powered skilled trades simulation through ThriveUp Academy — hands-on career exploration in welding, electrical, HVAC, plumbing, and more.",
      ogTitle: "Trade Simulation — ThriveUp Academy",
      ogDescription:
        "AI-powered skilled trade simulation — explore career-connected learning in welding, electrical, HVAC, and more.",
    },
  },
  {
    prefix: "/rural-",
    meta: {
      title: "Rural Community Programs | ThriveUp Academy",
      description:
        "ThriveUp Academy rural community programs — workforce development, health access, connectivity, and economic opportunity for rural communities.",
      ogTitle: "Rural Community Programs — ThriveUp Academy",
      ogDescription:
        "Workforce development, health access, and economic opportunity programs for rural communities.",
    },
  },
  {
    prefix: "/child-care-",
    meta: {
      title: "Child Care Programs | ThriveUp Academy",
      description:
        "Regional child care access initiatives through ThriveUp Academy — connecting families to subsidies, providers, and support services.",
      ogTitle: "Child Care Programs — ThriveUp Academy",
      ogDescription:
        "Regional child care access — subsidies, providers, and family support services in your area.",
    },
  },
  {
    prefix: "/hub/",
    meta: {
      title: "Community Hub | ThriveUp Academy",
      description:
        "ThriveUp Academy Community Hub — connect, serve, fund, and grow your community impact through our integrated platform.",
      ogTitle: "Community Hub — ThriveUp Academy",
      ogDescription:
        "Connect, serve, fund, and grow — ThriveUp Academy's integrated community hub.",
    },
  },
  {
    prefix: "/align/",
    meta: {
      title: "Align | ThriveUp Academy",
      description:
        "Align your organization's mission with community impact — assessment tools, journey mapping, and coalition connection through ThriveUp Academy.",
      ogTitle: "Align — ThriveUp Academy",
      ogDescription:
        "Assess your organization's community impact alignment and find your path to greater collective impact.",
    },
  },
];

/**
 * Returns the best-matching RouteMeta for the given pathname.
 * Falls back to DEFAULT_META if no match is found.
 */
export function getRouteMeta(pathname: string): RouteMeta & { canonical: string } {
  const clean = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");

  // Exact match first
  if (STATIC_META[clean]) {
    return { ...STATIC_META[clean], canonical: `${BASE_URL}${clean}` };
  }

  // Prefix match (longest prefix wins)
  let bestMatch: { prefix: string; meta: RouteMeta } | null = null;
  for (const entry of PREFIX_META) {
    if (
      clean.startsWith(entry.prefix) &&
      (!bestMatch || entry.prefix.length > bestMatch.prefix.length)
    ) {
      bestMatch = entry;
    }
  }
  if (bestMatch) {
    return { ...bestMatch.meta, canonical: `${BASE_URL}${clean}` };
  }

  // Default (homepage)
  return {
    ...DEFAULT_META,
    canonical: `${BASE_URL}${clean === "/" ? "" : clean}`,
  };
}

/**
 * Injects route-specific metadata into the HTML shell before it is sent.
 * Replaces: <title>, meta description, og:title, og:description,
 * og:url, twitter:title, twitter:description, and <link rel="canonical">.
 */
export function injectRouteMeta(html: string, pathname: string): string {
  const meta = getRouteMeta(pathname);

  let result = html;

  // <title>
  result = result.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(meta.title)}</title>`,
  );

  // meta description
  result = result.replace(
    /<meta name="description" content="[^"]*"\s*\/>/,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
  );

  // og:title
  result = result.replace(
    /<meta property="og:title" content="[^"]*"\s*\/>/,
    `<meta property="og:title" content="${escapeHtml(meta.ogTitle)}" />`,
  );

  // og:description
  result = result.replace(
    /<meta property="og:description" content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${escapeHtml(meta.ogDescription)}" />`,
  );

  // og:url
  result = result.replace(
    /<meta property="og:url" content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`,
  );

  // twitter:title
  result = result.replace(
    /<meta name="twitter:title" content="[^"]*"\s*\/>/,
    `<meta name="twitter:title" content="${escapeHtml(meta.ogTitle)}" />`,
  );

  // twitter:description
  result = result.replace(
    /<meta name="twitter:description" content="[^"]*"\s*\/>/,
    `<meta name="twitter:description" content="${escapeHtml(meta.ogDescription)}" />`,
  );

  // canonical — replace existing or inject before </head>
  if (/<link rel="canonical"/.test(result)) {
    result = result.replace(
      /<link rel="canonical" href="[^"]*"\s*\/>/,
      `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`,
    );
  } else {
    result = result.replace(
      "</head>",
      `  <link rel="canonical" href="${escapeHtml(meta.canonical)}" />\n</head>`,
    );
  }

  return result;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
