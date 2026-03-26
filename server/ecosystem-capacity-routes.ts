import type { Express, Request, Response } from "express";

interface Platform {
  id: string;
  name: string;
  domain: string;
  domainCategory: string;
  description: string;
  capabilities: string[];
  populations: string[];
  naicsCodes: string[];
  grantAlignments: { source: string; program: string; role: string }[];
  interdependencies: { platform: string; capability: string }[];
  floorPrice: string;
  pricingModel: string;
  technicalSpecs: Record<string, string>;
  subPlatforms?: { name: string; description: string }[];
}

interface FundingStream {
  id: string;
  name: string;
  primaryPlatforms: string[];
  supportingPlatforms: string[];
  combinedValue: string;
}

interface PopulationSegment {
  id: string;
  name: string;
  primaryPlatforms: string[];
  supportingPlatforms: string[];
}

const PLATFORMS: Platform[] = [
  {
    id: "thriveup",
    name: "ThriveUp Academy",
    domain: "Community & Workforce",
    domainCategory: "community-workforce",
    description: "AI-powered workforce development and community enablement platform. The operational backbone for discovering, winning, executing, and sustaining federal grants across the entire ecosystem.",
    capabilities: [
      "50+ Career Pathways with AI Counseling",
      "24-Module Prevention Curriculum (8 substance topics, 3 age tiers)",
      "Grant Discovery Engine (SAM.gov, Grants.gov, AI fit scoring)",
      "Reentry Case Management (5 phases)",
      "Coalition Dashboard & 12-Sector Tracker",
      "Community Needs Assessment & Asset Mapping",
      "Dosage Tracking & Outcome Reporting",
      "WIOA Compliance (all 14 youth elements)",
      "Parent Education (13 modules)",
      "Community Intelligence Map with 8+ federal data sources",
    ],
    populations: ["Opportunity Youth (16-24)", "Returning Citizens", "Single Parents", "Veterans", "K-12 Students", "Community Leaders", "Seniors"],
    naicsCodes: ["541611", "541612", "541511", "541519", "611430"],
    grantAlignments: [
      { source: "CDC/ONDCP", program: "Drug-Free Communities (DFC)", role: "Primary" },
      { source: "DOL/ETA", program: "WIOA Title I Youth", role: "Primary" },
      { source: "DOJ/OJJDP", program: "Second Chance Act", role: "Primary" },
      { source: "SAMHSA", program: "Community Mental Health", role: "Supporting" },
      { source: "DOE", program: "Title I & IV", role: "Supporting" },
      { source: "HHS/ACF", program: "Community Services Block Grant", role: "Primary" },
    ],
    interdependencies: [
      { platform: "RPLICE", capability: "Outcome measurement via RE-AIM/CFIR for all workforce and prevention programs" },
      { platform: "LifeBridge", capability: "Community resource navigation layer for participants" },
      { platform: "Sankofa Health", capability: "Behavioral health screening and intervention" },
      { platform: "SafeReport", capability: "Mandatory reporting compliance for youth-serving programs" },
      { platform: "M2C Transition", capability: "Veteran-specific workforce pathways" },
      { platform: "Perfectly Different", capability: "Neurodivergent workforce pathways and accommodation" },
      { platform: "The Incubator", capability: "Federal contract/grant opportunity discovery pipeline" },
      { platform: "ISSS", capability: "K-12 prevention curriculum delivery and school partnerships" },
    ],
    floorPrice: "Bundled",
    pricingModel: "Grant infrastructure — included in grant budgets",
    technicalSpecs: { pages: "90+", domains: "11", architecture: "React + TypeScript, Express.js, PostgreSQL", ai: "OpenAI" },
  },
  {
    id: "sankofa",
    name: "Sankofa Health Network",
    domain: "Health Equity",
    domainCategory: "health-equity",
    description: "Five-platform health equity technology ecosystem addressing disparities in maternal care, women's health, men's health, mental wellness, and birth equity. 700,000+ curated health data records.",
    capabilities: [
      "Health Disparities Data Engine (CDC WONDER, HRSA HPSA, SVI)",
      "Community Health Worker (CHW) Tools",
      "Behavioral Health Screening (PHQ-9, GAD-7, AUDIT, DAST-10)",
      "Telehealth Readiness Infrastructure",
      "5 Sub-Platforms covering full health equity spectrum",
      "700,000+ Curated Health Data Records",
    ],
    populations: ["Women of Color", "Black Men", "Pregnant/Postpartum Individuals", "Health Professional Shortage Communities", "Mental Health Consumers"],
    naicsCodes: ["541690", "541720", "541511", "541519"],
    grantAlignments: [
      { source: "SAMHSA", program: "Community Mental Health Services", role: "Primary" },
      { source: "HHS/HRSA", program: "Community Health Center Grants", role: "Primary" },
      { source: "HHS/HRSA", program: "Maternal, Infant, Early Childhood", role: "Primary" },
      { source: "CDC", program: "REACH", role: "Primary" },
      { source: "HHS/OWH", program: "Office on Women's Health", role: "Primary" },
    ],
    interdependencies: [
      { platform: "RPLICE", capability: "RE-AIM evaluation of health equity interventions" },
      { platform: "LifeBridge", capability: "Bilingual community resource navigation for health consumers" },
      { platform: "MedLog", capability: "Medication adherence tracking for chronic disease patients" },
      { platform: "CogniCare", capability: "Cognitive support for patients with brain injury" },
      { platform: "ThriveUp", capability: "Parent education and family strengthening" },
    ],
    floorPrice: "$8,000,000+",
    pricingModel: "Ecosystem license, sub-platform licensing, SaaS for health systems",
    technicalSpecs: { pages: "223+", apiEndpoints: "700+", dataRecords: "700,000+", aiProviders: "4 (OpenAI, Anthropic, Gemini, custom)" },
    subPlatforms: [
      { name: "MCE (Minority Community Empowerment)", description: "Minority-owned business directory and economic empowerment" },
      { name: "HerHealth", description: "Women's health education and screening tools" },
      { name: "HealthyBlackMen", description: "Men's health screening, chronic disease prevention" },
      { name: "Mental Wellness Support", description: "Behavioral health screening, therapist directory, crisis intervention" },
      { name: "BirthRight", description: "Maternal and birth equity platform" },
    ],
  },
  {
    id: "rplice",
    name: "RPLICE",
    domain: "Health Equity",
    domainCategory: "health-equity",
    description: "Research-to-Practice Learning & Implementation Collaborative Environment. The implementation science engine behind the entire ecosystem, operationalizing CFIR, RE-AIM, and EPIS frameworks with AI-assisted project wizards and the proprietary MAP-GAP methodology.",
    capabilities: [
      "CFIR 5-Domain Assessment",
      "RE-AIM Outcome Evaluation",
      "EPIS Lifecycle Management",
      "MAP-GAP Execution Governance (Proprietary)",
      "Scholarly Research Service (6 academic databases)",
      "AI-Powered Project Wizard (6-step)",
      "Validation & Fidelity Hub",
      "ISSS Knowledge Engine",
    ],
    populations: ["Implementation Researchers", "Program Evaluators", "Grant Writers", "School Administrators", "Public Health Departments", "Federal Program Managers"],
    naicsCodes: ["541690", "541720", "541511", "541519"],
    grantAlignments: [
      { source: "NIH/NIMH", program: "Implementation Science R01/R21", role: "Primary" },
      { source: "AHRQ", program: "Health Services Research", role: "Primary" },
      { source: "CDC", program: "Program Evaluation Contracts", role: "Primary" },
      { source: "PCORI", program: "Patient-Centered Outcomes Research", role: "Primary" },
    ],
    interdependencies: [
      { platform: "ThriveUp", capability: "Outcome measurement for workforce and prevention programs" },
      { platform: "Sankofa Health", capability: "RE-AIM evaluation of health equity interventions" },
      { platform: "ISSS", capability: "Implementation science for K-12 education" },
      { platform: "SHIELD/ATLAS", capability: "Implementation governance for defense operations" },
      { platform: "The Incubator", capability: "Grant readiness infrastructure and evaluation planning" },
    ],
    floorPrice: "Contact for quote",
    pricingModel: "Enterprise or academic licensing",
    technicalSpecs: { linesOfCode: "536,000+", pages: "147", databaseTables: "167", apiEndpoints: "720+", aiProviders: "3", researchDatabases: "6" },
  },
  {
    id: "shield-atlas",
    name: "SHIELD/ATLAS",
    domain: "Defense & Emergency",
    domainCategory: "defense-emergency",
    description: "Defense and emergency management platform with 56 UI panels, ODIN AI decision engine, 5 live federal data feeds, and compliance with CAP, EDXL, and NIEF standards.",
    capabilities: [
      "EMSO, C-UAS, SDA, POSEIDON Defense Modules",
      "ODIN AI Decision Engine",
      "CAP/EDXL/NIEF Compliance",
      "5 Live Federal Data Feeds (NWS, USGS, FAA, DoD, FEMA)",
      "Multi-Agency Coordination",
      "Real-Time Threat Assessment",
    ],
    populations: ["DoD Operators", "DHA Personnel", "DHS Analysts", "FEMA Emergency Managers", "State/Local Emergency Management"],
    naicsCodes: ["541720", "541511", "541519"],
    grantAlignments: [
      { source: "DoD", program: "Defense Health Agency Contracts", role: "Primary" },
      { source: "DoD", program: "SOCOM/COCOM Task Orders", role: "Primary" },
      { source: "DHS", program: "Cybersecurity & Infrastructure", role: "Primary" },
      { source: "FEMA", program: "Emergency Management Performance Grants", role: "Primary" },
      { source: "DoD", program: "SBIR/STTR", role: "Primary" },
    ],
    interdependencies: [
      { platform: "RPLICE", capability: "Implementation governance for defense program deployment" },
      { platform: "The Incubator", capability: "Federal contract discovery for defense opportunities" },
      { platform: "M2C Transition", capability: "Veteran workforce for defense contractor staffing" },
      { platform: "CogniCare", capability: "TBI support for active duty and veterans" },
      { platform: "Unplanned", capability: "Team operations for defense workforce management" },
    ],
    floorPrice: "$3,500,000+",
    pricingModel: "IDIQ, BPA, or direct award contract vehicle",
    technicalSpecs: { linesOfCode: "57,000+", uiPanels: "56", automatedTests: "950", liveDataFeeds: "5" },
  },
  {
    id: "isss",
    name: "ISSS",
    domain: "Education",
    domainCategory: "education",
    description: "Implementation Science Support System for K-12 with 5-layer progressive unlock model, 7 role-specific portals, MTSS compliance for 45+ state mandates, and MAP-GAP governance integration.",
    capabilities: [
      "5-Layer Progressive Unlock Model",
      "7 Role-Specific Portals",
      "MTSS Compliance (45+ state mandates)",
      "ISSS Knowledge Engine",
      "PDSA Cycle Management",
      "Equity Indicator Monitoring",
    ],
    populations: ["K-12 School Districts", "State Education Agencies", "Education Service Centers", "Special Education Departments", "Title I/IV Coordinators"],
    naicsCodes: ["541690", "541511", "541519", "611430"],
    grantAlignments: [
      { source: "DOE", program: "Title I/IV/IDEA/OSEP", role: "Primary" },
      { source: "DOE", program: "Institute of Education Sciences (IES)", role: "Primary" },
      { source: "State", program: "Education Technology Contracts", role: "Primary" },
    ],
    interdependencies: [
      { platform: "RPLICE", capability: "Implementation science methodology and evaluation" },
      { platform: "ThriveUp", capability: "K-12 prevention curriculum and family engagement" },
      { platform: "Perfectly Different", capability: "IEP tools, neurodiversity support, special education" },
      { platform: "SafeReport", capability: "School incident reporting and mandatory reporting compliance" },
      { platform: "Sankofa Health", capability: "Student mental health screening" },
    ],
    floorPrice: "$10,000,000+",
    pricingModel: "Per-student SaaS or enterprise license",
    technicalSpecs: { portals: "7", unlockLayers: "5", stateCompliance: "45+" },
  },
  {
    id: "perfectly-different",
    name: "Perfectly Different",
    domain: "Education",
    domainCategory: "education",
    description: "Nonprofit neurodiversity-affirming support platform for individuals with autism, ADHD, AuDHD, and other neurodivergent conditions. AI-powered guidance, IEP/504 assistance, crisis resources, therapy tools.",
    capabilities: [
      "AI-Powered Neurodiversity Guidance",
      "IEP/504 Plan Assistance",
      "Crisis Resources & Safety Planning",
      "Therapy Tools & Strategies",
      "Community Support Network",
      "Neurodiversity Advocacy Tools",
    ],
    populations: ["Neurodivergent Individuals", "Youth with IEP/504 Plans", "Parents of Neurodivergent Youth", "Educators"],
    naicsCodes: ["541690", "541511", "541519"],
    grantAlignments: [
      { source: "DOE", program: "IDEA/Special Education", role: "Primary" },
      { source: "SAMHSA", program: "Mental Health Support", role: "Supporting" },
      { source: "CDC/ONDCP", program: "DFC (risk factor reduction)", role: "Supporting" },
    ],
    interdependencies: [
      { platform: "ISSS", capability: "IEP tools and special education accommodation" },
      { platform: "ThriveUp", capability: "Neurodivergent workforce pathways" },
      { platform: "Sankofa Health", capability: "Neurodivergent health needs" },
      { platform: "CogniCare", capability: "ADHD executive function overlap" },
      { platform: "SafeReport", capability: "Neurodivergent student protection reporting" },
    ],
    floorPrice: "Bundled",
    pricingModel: "School district SaaS",
    technicalSpecs: { architecture: "React + TypeScript, Express.js, PostgreSQL" },
  },
  {
    id: "m2c",
    name: "M2C Transition",
    domain: "Veterans",
    domainCategory: "veterans",
    description: "Free veteran support platform helping service members, veterans, and military families transition from military to civilian life with curated resources, transition planning, and community connections.",
    capabilities: [
      "Transition Planning Tools",
      "Benefits Guidance & Navigation",
      "Military Skills Translation",
      "Community Connections",
      "Military Family Support",
      "VA.gov Complement Resources",
    ],
    populations: ["Veterans", "Active Duty Transitioning", "Military Families", "Military Spouses"],
    naicsCodes: ["541612", "541511", "541519", "611430"],
    grantAlignments: [
      { source: "VA", program: "Veteran Employment Services", role: "Primary" },
      { source: "DOL/VETS", program: "Veteran Employment & Training", role: "Primary" },
      { source: "DOL/ETA", program: "WIOA Title I", role: "Supporting" },
    ],
    interdependencies: [
      { platform: "ThriveUp", capability: "Veteran-specific workforce pathways" },
      { platform: "CogniCare", capability: "TBI support for transitioning veterans" },
      { platform: "MedLog", capability: "VA medication tracking" },
      { platform: "SHIELD/ATLAS", capability: "Defense contractor staffing pipeline" },
      { platform: "The Incubator", capability: "Veteran-owned business federal contracting" },
    ],
    floorPrice: "Bundled",
    pricingModel: "Free for veterans, employer SaaS",
    technicalSpecs: { architecture: "React + TypeScript, Express.js, PostgreSQL" },
  },
  {
    id: "lifebridge",
    name: "LifeBridge",
    domain: "Community & Workforce",
    domainCategory: "community-workforce",
    description: "Free virtual 211 and Community Health Worker (CHW) hub connecting individuals to resources for housing, food, healthcare, mental health, substance abuse, domestic violence, child welfare, and senior services. 24/7 availability.",
    capabilities: [
      "24/7 Resource Navigation",
      "Housing & Food Assistance",
      "Healthcare & Mental Health Connections",
      "Substance Abuse Support",
      "Domestic Violence Resources",
      "Child Welfare & Senior Services",
      "Crisis Support",
      "Bilingual Resource Navigation",
    ],
    populations: ["All Community Members", "Individuals in Crisis", "Unhoused Individuals", "Substance Use Recovery", "Domestic Violence Survivors"],
    naicsCodes: ["541612", "541511", "541519"],
    grantAlignments: [
      { source: "CDC/ONDCP", program: "DFC (community prevention infrastructure)", role: "Supporting" },
      { source: "HHS/HRSA", program: "CHW Infrastructure", role: "Primary" },
      { source: "HUD", program: "Housing Stability", role: "Supporting" },
      { source: "SAMHSA", program: "Substance Abuse Resource Navigation", role: "Supporting" },
    ],
    interdependencies: [
      { platform: "ThriveUp", capability: "Resource matching complements community intelligence" },
      { platform: "Sankofa Health", capability: "Bilingual community resource navigation for health" },
      { platform: "SafeReport", capability: "Domestic violence and abuse resource navigation" },
      { platform: "CogniCare", capability: "Community cognitive support resources" },
      { platform: "MedLog", capability: "Medication assistance program navigation" },
    ],
    floorPrice: "Bundled",
    pricingModel: "CHW SaaS, 211 replacement",
    technicalSpecs: { architecture: "React + TypeScript, Express.js, PostgreSQL", availability: "24/7" },
  },
  {
    id: "the-incubator",
    name: "The Incubator",
    domain: "Business Intelligence",
    domainCategory: "business-intelligence",
    description: "Federal contracting intelligence platform with 10 live federal data sources, SAM.gov/Grants.gov monitoring, AI fit scoring, opportunity matching engine, and contract vehicle tracking.",
    capabilities: [
      "10 Live Federal Data Sources",
      "SAM.gov & Grants.gov Monitoring",
      "AI Fit Scoring for Opportunities",
      "NAICS Code Cross-Referencing",
      "Contract Vehicle Tracking",
      "Competitive Intelligence Dashboard",
      "Proposal Template Generation",
      "Past Performance Database",
    ],
    populations: ["GovCon Professionals", "Small Business Owners", "VOSB/SDVOSB Firms", "Federal Contractors"],
    naicsCodes: ["541611", "541511", "541519"],
    grantAlignments: [
      { source: "SBA", program: "SBIR/STTR", role: "Primary" },
      { source: "GSA", program: "Schedule Contracts", role: "Primary" },
      { source: "Any Federal", program: "Contract Opportunities", role: "Primary" },
    ],
    interdependencies: [
      { platform: "SHIELD/ATLAS", capability: "Defense contract discovery" },
      { platform: "RPLICE", capability: "Grant readiness infrastructure" },
      { platform: "ThriveUp", capability: "Grant discovery pipeline" },
      { platform: "M2C Transition", capability: "Veteran-owned business contracting" },
    ],
    floorPrice: "$1,500,000+",
    pricingModel: "SaaS or enterprise license",
    technicalSpecs: { liveDataSources: "10", architecture: "React + TypeScript, Express.js, PostgreSQL" },
  },
  {
    id: "safereport",
    name: "SafeReport",
    domain: "Compliance",
    domainCategory: "compliance",
    description: "Mandatory reporting compliance platform with 7-stage incident lifecycle management, 50-state regulation database, auto-generated compliance deadlines, tamper-evident audit trails, and cross-agency referencing.",
    capabilities: [
      "50-State Regulation Database",
      "7-Stage Incident Lifecycle Management",
      "Auto-Generated Compliance Deadlines",
      "Tamper-Evident Audit Trails",
      "Cross-Agency Referencing (CPS/DFPS/Courts)",
      "Court-Admissible Record Formatting",
    ],
    populations: ["Mandatory Reporters", "School Districts", "Healthcare Facilities", "Child Welfare Agencies", "Law Enforcement", "HR Departments"],
    naicsCodes: ["541511", "541519"],
    grantAlignments: [
      { source: "HHS/ACF", program: "CAPTA", role: "Primary" },
      { source: "DOJ/OJJDP", program: "Youth Safety Compliance", role: "Supporting" },
      { source: "DOE", program: "Title IX Compliance", role: "Supporting" },
      { source: "HHS/ACL", program: "Elder Justice Act", role: "Primary" },
    ],
    interdependencies: [
      { platform: "ISSS", capability: "School incident reporting and student safety" },
      { platform: "ThriveUp", capability: "Youth program mandatory reporting" },
      { platform: "Sankofa Health", capability: "Healthcare mandatory reporting" },
      { platform: "LifeBridge", capability: "Domestic violence and abuse resource navigation" },
      { platform: "CogniCare", capability: "Vulnerable adult (elder) reporting" },
    ],
    floorPrice: "Contact for quote",
    pricingModel: "Per-building or statewide licensing",
    technicalSpecs: { regulationCoverage: "50 states + DC", incidentLifecycle: "7 stages", security: "HIPAA-ready, FERPA-ready" },
  },
  {
    id: "cognicare",
    name: "CogniCare",
    domain: "Health Equity",
    domainCategory: "health-equity",
    description: "Cognitive support platform for individuals with TBI, dementia, ADHD, and other cognitive challenges. Provides memory aids, routine management, caregiver coordination, and progress tracking.",
    capabilities: [
      "Memory Aids & Routine Management",
      "Caregiver Coordination Hub",
      "Cognitive Assessment Tracking",
      "TBI Recovery Support",
      "Simplified Interface for Cognitive Impairment",
      "Progress Tracking & Reporting",
    ],
    populations: ["TBI Survivors", "Dementia/Alzheimer's Patients", "ADHD Adults", "Caregivers", "Veterans with TBI", "Assisted Living Residents"],
    naicsCodes: ["541690", "541511", "541519"],
    grantAlignments: [
      { source: "VA", program: "TBI/Polytrauma Research", role: "Primary" },
      { source: "NIH/NIA", program: "Alzheimer's & Dementia Research", role: "Primary" },
      { source: "DoD", program: "CDMRP (Military TBI)", role: "Primary" },
      { source: "HHS/ACL", program: "Administration for Community Living", role: "Primary" },
    ],
    interdependencies: [
      { platform: "M2C Transition", capability: "TBI support for transitioning veterans" },
      { platform: "MedLog", capability: "Medication adherence with cognitive-friendly interface" },
      { platform: "Sankofa Health", capability: "Cognitive health within health equity framework" },
      { platform: "LifeBridge", capability: "Community cognitive support resources" },
      { platform: "Perfectly Different", capability: "ADHD executive function overlap" },
    ],
    floorPrice: "Bundled",
    pricingModel: "Facility licensing, VA/DoD contracts",
    technicalSpecs: { architecture: "React + TypeScript, Express.js, PostgreSQL" },
  },
  {
    id: "medlog",
    name: "MedLog",
    domain: "Health Equity",
    domainCategory: "health-equity",
    description: "Medication tracking and adherence platform with one-tap dose logging, caregiver SMS alerts, streak tracking, refill management, and provider dashboard. Addresses $300B+ annual cost of medication non-adherence.",
    capabilities: [
      "One-Tap Dose Logging",
      "Caregiver SMS Alerts (No Login Required)",
      "Streak Tracking & Motivational Messaging",
      "Refill Management & Low Supply Alerts",
      "Provider Dashboard & Population Metrics",
      "Non-Adherence Pattern Identification",
    ],
    populations: ["Chronic Disease Patients", "Mental Health Medication Users", "Elderly on Multiple Medications", "Caregivers", "Clinical Teams", "Pharmacists"],
    naicsCodes: ["541511", "541519"],
    grantAlignments: [
      { source: "SAMHSA", program: "Medication-Assisted Treatment (MAT)", role: "Primary" },
      { source: "HRSA", program: "Ryan White HIV/AIDS Program", role: "Supporting" },
      { source: "CMS", program: "Innovation Center Demonstrations", role: "Primary" },
      { source: "VA", program: "Pharmacy & Medication Management", role: "Primary" },
    ],
    interdependencies: [
      { platform: "Sankofa Health", capability: "Medication adherence within health equity programs" },
      { platform: "CogniCare", capability: "Simplified medication interface for cognitive impairment" },
      { platform: "M2C Transition", capability: "VA medication tracking for veterans" },
      { platform: "LifeBridge", capability: "Medication assistance program navigation" },
      { platform: "Perfectly Different", capability: "ADHD medication tracking" },
    ],
    floorPrice: "Bundled",
    pricingModel: "Free for patients, health system SaaS, pharma partnerships",
    technicalSpecs: { architecture: "React + TypeScript, Express.js, PostgreSQL, PWA", sms: "Twilio" },
  },
  {
    id: "unplanned",
    name: "Unplanned",
    domain: "Community & Workforce",
    domainCategory: "community-workforce",
    description: "Mobile-first team operations platform for managing workplace disruptions. Quick issue capture, AI-suggested priority triage, smart routing, deadline warnings, resolution accountability, and performance analytics.",
    capabilities: [
      "Quick Issue Capture (3-tap from mobile)",
      "AI Priority Triage",
      "Smart Routing (skills-based, availability-aware)",
      "Resolution Accountability & SLA Tracking",
      "Performance Analytics & Disruption Patterns",
      "Interactive Demo Mode",
    ],
    populations: ["Frontline Managers", "Operations Teams", "Facility Managers", "HR Departments", "Small/Mid-Size Businesses", "Government Facility Managers"],
    naicsCodes: ["541511", "541519"],
    grantAlignments: [
      { source: "GSA", program: "Facility Management Contracts", role: "Supporting" },
      { source: "DoD", program: "Base Operations Support", role: "Supporting" },
      { source: "DOL", program: "Workplace Safety Programs", role: "Supporting" },
      { source: "Commercial", program: "Direct B2B Sales", role: "Primary" },
    ],
    interdependencies: [
      { platform: "ThriveUp", capability: "Workforce readiness training for operations skills" },
      { platform: "M2C Transition", capability: "Team operations training for transitioning veterans" },
      { platform: "SHIELD/ATLAS", capability: "Military-grade operations for defense workforce" },
      { platform: "SafeReport", capability: "Incident escalation to compliance reporting" },
      { platform: "The Incubator", capability: "Federal facility management contract pursuit" },
    ],
    floorPrice: "$5-12/employee/month",
    pricingModel: "Direct B2B SaaS, annual contracts, GSA Schedule rates",
    technicalSpecs: { architecture: "React + TypeScript, Express.js, PostgreSQL, PWA", design: "Mobile-first, thumb-zone optimized" },
  },
  {
    id: "mce",
    name: "Minority Center of Excellence",
    domain: "Business & Economic Development",
    domainCategory: "community-workforce",
    description: "First comprehensive digital ecosystem for minority-owned businesses across the entire business lifecycle. Features a 6-stage journey (Form, Certify, Win, Team, Connect, Grow), 656,794 curated records, 14 AI tools across 4 providers, dual-AI proposal review, SAM.gov live integration, 50-state + DC coverage, teaming hub, B2B networking, Business Health Score, and certification eligibility wizard for 9 federal programs.",
    capabilities: [
      "6-Stage Business Lifecycle Journey (Form, Certify, Win, Team, Connect, Grow)",
      "656,794 Curated Business Records",
      "14 AI Tools Across 4 Providers",
      "Dual-AI Proposal Review System",
      "SAM.gov Live Integration",
      "50-State + DC Coverage",
      "Teaming Hub & B2B Networking",
      "Business Health Score Dashboard",
      "Certification Eligibility Wizard (9 Federal Programs)",
      "GovCon Opportunity Matching Engine",
    ],
    populations: ["Minority-Owned Businesses", "VOSB/SDVOSB Firms", "8(a) Businesses", "HUBZone Businesses", "WOSB Firms", "APEX Accelerator Clients", "GovCon Professionals", "Nonprofit Organizations"],
    naicsCodes: ["541511", "541519", "541611", "541690"],
    grantAlignments: [
      { source: "SBA", program: "SBIR/STTR", role: "Primary" },
      { source: "DOC/MBDA", program: "Minority Business Development Agency Grants", role: "Primary" },
      { source: "SBA", program: "7(j) Management and Technical Assistance", role: "Primary" },
      { source: "SBA", program: "Community Advantage Program", role: "Primary" },
      { source: "DOT", program: "Disadvantaged Business Enterprise (DBE)", role: "Primary" },
    ],
    interdependencies: [
      { platform: "ThriveUp", capability: "Workforce development to business formation pipeline" },
      { platform: "The Incubator", capability: "Shared federal contract intelligence and opportunity matching" },
      { platform: "M2C Transition", capability: "Veteran entrepreneur support and VOSB certification guidance" },
      { platform: "LifeBridge", capability: "Community economic development and resource navigation" },
      { platform: "RPLICE", capability: "Minority business program evaluation and outcome measurement" },
      { platform: "Perfectly Different", capability: "Neurodivergent entrepreneur support and accommodation" },
    ],
    floorPrice: "$3,500,000-$5,000,000",
    pricingModel: "SaaS tiers: Free/$49/$149/$349+/mo",
    technicalSpecs: { pages: "66", apiEndpoints: "321", databaseTables: "77", linesOfCode: "633,077", dataRecords: "656,794", aiTools: "14", aiProviders: "4" },
  },
];

const FUNDING_STREAMS: FundingStream[] = [
  { id: "cdc-ondcp", name: "CDC/ONDCP Drug-Free Communities", primaryPlatforms: ["ThriveUp", "LifeBridge"], supportingPlatforms: ["Sankofa Health", "RPLICE", "SafeReport"], combinedValue: "Prevention + CHW + Evaluation" },
  { id: "dol-wioa", name: "DOL/WIOA Title I Youth", primaryPlatforms: ["ThriveUp", "M2C Transition"], supportingPlatforms: ["Perfectly Different", "Unplanned", "The Incubator"], combinedValue: "Workforce + Veterans + Neurodiverse" },
  { id: "doj-ojjdp", name: "DOJ Second Chance Act", primaryPlatforms: ["ThriveUp", "LifeBridge"], supportingPlatforms: ["SafeReport", "CogniCare", "RPLICE"], combinedValue: "Reentry + Resources + Compliance" },
  { id: "samhsa", name: "SAMHSA Community Mental Health", primaryPlatforms: ["Sankofa Health", "MedLog"], supportingPlatforms: ["CogniCare", "Perfectly Different", "LifeBridge"], combinedValue: "Health Equity + Adherence + Support" },
  { id: "doe", name: "DOE Title I/IV/IDEA/OSEP", primaryPlatforms: ["ISSS", "Perfectly Different"], supportingPlatforms: ["ThriveUp", "SafeReport", "RPLICE"], combinedValue: "Education + IEP + Compliance" },
  { id: "va-dod", name: "VA/DoD Veteran Services", primaryPlatforms: ["M2C Transition", "SHIELD/ATLAS"], supportingPlatforms: ["CogniCare", "MedLog", "The Incubator"], combinedValue: "Transition + Defense + Cognitive" },
  { id: "hhs-hrsa-acf", name: "HHS/HRSA/ACF Community Health", primaryPlatforms: ["Sankofa Health", "LifeBridge"], supportingPlatforms: ["MedLog", "ThriveUp", "Perfectly Different"], combinedValue: "Health + CHW + Family" },
  { id: "dod-defense", name: "DoD Defense Contracts", primaryPlatforms: ["SHIELD/ATLAS", "The Incubator"], supportingPlatforms: ["RPLICE", "M2C Transition", "Unplanned"], combinedValue: "Defense Ops + GovCon + Governance" },
  { id: "nih-ahrq", name: "NIH/AHRQ Research", primaryPlatforms: ["RPLICE", "Sankofa Health"], supportingPlatforms: ["Any platform as research subject"], combinedValue: "IS Engine + Health Data" },
  { id: "dhs-fema", name: "DHS/FEMA Emergency Management", primaryPlatforms: ["SHIELD/ATLAS", "LifeBridge"], supportingPlatforms: ["RPLICE", "Unplanned"], combinedValue: "EM Ops + Crisis Resources" },
  { id: "state-education", name: "State Education Contracts", primaryPlatforms: ["ISSS", "Perfectly Different"], supportingPlatforms: ["SafeReport", "ThriveUp"], combinedValue: "MTSS + IEP + Safety" },
  { id: "sba-sbir", name: "SBA/SBIR/STTR", primaryPlatforms: ["The Incubator", "SHIELD/ATLAS", "MCE"], supportingPlatforms: ["RPLICE", "Any platform"], combinedValue: "Innovation + Defense + Minority Business" },
  { id: "sba-doc-mbd", name: "SBA/DOC Minority Business Development", primaryPlatforms: ["MCE"], supportingPlatforms: ["ThriveUp", "The Incubator", "M2C Transition"], combinedValue: "Minority Business Lifecycle + Workforce + GovCon" },
];

const POPULATION_SEGMENTS: PopulationSegment[] = [
  { id: "returning-citizens", name: "Returning Citizens", primaryPlatforms: ["ThriveUp", "LifeBridge"], supportingPlatforms: ["SafeReport", "CogniCare", "RPLICE"] },
  { id: "opportunity-youth", name: "Opportunity Youth (16-24)", primaryPlatforms: ["ThriveUp", "Perfectly Different"], supportingPlatforms: ["LifeBridge", "MedLog", "RPLICE"] },
  { id: "k12-students", name: "K-12 Students", primaryPlatforms: ["ISSS", "Perfectly Different"], supportingPlatforms: ["ThriveUp", "SafeReport", "Sankofa Health"] },
  { id: "veterans", name: "Veterans", primaryPlatforms: ["M2C Transition", "CogniCare"], supportingPlatforms: ["MedLog", "ThriveUp", "SHIELD/ATLAS", "The Incubator"] },
  { id: "neurodivergent", name: "Neurodivergent Individuals", primaryPlatforms: ["Perfectly Different", "CogniCare"], supportingPlatforms: ["ISSS", "ThriveUp", "LifeBridge"] },
  { id: "people-in-crisis", name: "People in Crisis", primaryPlatforms: ["LifeBridge", "Sankofa Health"], supportingPlatforms: ["SafeReport", "MedLog", "CogniCare"] },
  { id: "seniors-caregivers", name: "Seniors/Caregivers", primaryPlatforms: ["CogniCare", "MedLog"], supportingPlatforms: ["LifeBridge", "SafeReport", "Sankofa Health"] },
  { id: "frontline-workers", name: "Frontline Workers", primaryPlatforms: ["Unplanned", "ThriveUp"], supportingPlatforms: ["M2C Transition", "SafeReport"] },
  { id: "govcon-professionals", name: "GovCon Professionals", primaryPlatforms: ["The Incubator", "RPLICE"], supportingPlatforms: ["SHIELD/ATLAS", "Unplanned"] },
  { id: "researchers", name: "Researchers", primaryPlatforms: ["RPLICE", "Sankofa Health"], supportingPlatforms: ["Any platform as implementation subject"] },
  { id: "healthcare-workers", name: "Healthcare Workers", primaryPlatforms: ["Sankofa Health", "MedLog"], supportingPlatforms: ["SafeReport", "CogniCare", "LifeBridge"] },
  { id: "educators", name: "Educators", primaryPlatforms: ["ISSS", "Perfectly Different"], supportingPlatforms: ["ThriveUp", "SafeReport", "RPLICE"] },
  { id: "minority-business-owners", name: "Minority Business Owners", primaryPlatforms: ["MCE", "ThriveUp", "The Incubator"], supportingPlatforms: ["M2C Transition", "LifeBridge", "RPLICE"] },
];

const ENTITY_INFO = {
  foundation: {
    name: "The Collaborative Advocate Foundation",
    type: "501(c)(3) Nonprofit",
    samRegistered: true,
  },
  llc: {
    name: "The Collaborative Advocate LLC",
    type: "For-Profit VOSB",
    samRegistered: true,
    vosbCertified: true,
    cageCode: true,
  },
  leadership: [
    { name: "Dr. Terry Flood, DHA", role: "Co-Founder", bio: "Veteran. Doctor of Health Administration. Implementation scientist. Creator of MAP-GAP methodology. Architect of all 24 platforms." },
    { name: "Meredith Sisnett", role: "Co-Founder", bio: "Strategic operations leader. Community engagement, organizational development, and program execution." },
  ],
  setAsideEligibility: ["Veteran-Owned Small Business (VOSB)", "Small Business (SB)", "Small Disadvantaged Business (SDB)"],
};

const PROPRIETARY_METHODOLOGIES = [
  {
    name: "MAP-GAP Execution Governance",
    creator: "Dr. Terry Flood, DHA",
    fullName: "Market Analysis & Performance — Gap Analysis Protocol",
    modes: ["Simple (9 core functions)", "Full Governance (16 phases across 7 compartments)"],
    innovations: [
      "Three Realities Diagnostic (Designed vs. Operational vs. Experienced Reality)",
      "Behavioral Validation phase",
      "Prioritize \u2192 Validate \u2192 Recalibrate cycle",
      "REFLECT step (prediction, outcome, incongruity type, lessons learned)",
      "Cybernetic learning architecture for adaptive navigation",
    ],
    deployedIn: ["RPLICE", "ISSS", "ThriveUp", "LifeBridge", "SHIELD/ATLAS"],
  },
  {
    name: "SALP Framework",
    fullName: "System Anchor Learning Points",
    description: "Continuous monitoring and self-assessment with Persistent Health Monitor and Continuity Review process, anchored in MAP-GAP methodology.",
  },
  {
    name: "MG-PATR Execution Engine",
    fullName: "MAP-GAP Phase Aware Tactical Reviewer",
    description: "Cycle-based improvement with bidirectional phase navigation, SALP score integration, gap diagnosis and priority portfolio management.",
  },
  {
    name: "ISSS Knowledge Engine",
    description: "Implementation readiness assessment, outcome domain library, PDSA cycle management, fidelity dimension tracking, equity indicator monitoring, stakeholder engagement protocols.",
  },
  {
    name: "Three Realities Diagnostic",
    description: "Designed Reality (what was intended) vs. Operational Reality (what actually happens) vs. Experienced Reality (what participants experience). Used to diagnose implementation gaps.",
  },
];

const PORTFOLIO_STATS = {
  platforms: 14,
  platformsWithSub: 19,
  linesOfCode: "1,633,000+",
  dataRecords: "1,356,000+",
  functionalPages: "566+",
  apiEndpoints: "1,821+",
  databaseTables: "377+",
  stateCoverage: "50-state + DC",
  agesServed: "K-12 through seniors",
  combinedEcosystemValue: "$28,500,000+",
};

const NAICS_CODES = [
  { code: "541611", description: "Administrative Management Consulting", platforms: ["RPLICE", "The Incubator", "ThriveUp"] },
  { code: "541612", description: "Human Resources Consulting", platforms: ["ThriveUp", "M2C Transition", "Unplanned"] },
  { code: "541690", description: "Other Scientific & Technical Consulting", platforms: ["RPLICE", "ISSS", "Sankofa Health"] },
  { code: "541720", description: "Research & Development", platforms: ["RPLICE", "SHIELD/ATLAS", "Sankofa Health"] },
  { code: "541511", description: "Custom Computer Programming", platforms: ["All 24 platforms"] },
  { code: "541519", description: "Other Computer Related Services", platforms: ["All 24 platforms"] },
  { code: "611430", description: "Professional Development Training", platforms: ["ThriveUp", "ISSS", "M2C Transition"] },
];

const IMPLEMENTATION_FRAMEWORKS = [
  { name: "CFIR", fullName: "Consolidated Framework for Implementation Research", description: "5-domain assessment" },
  { name: "RE-AIM", fullName: "Reach, Effectiveness, Adoption, Implementation, Maintenance", description: "Outcome evaluation" },
  { name: "EPIS", fullName: "Exploration, Preparation, Implementation, Sustainment", description: "Lifecycle management" },
  { name: "SPF", fullName: "Strategic Prevention Framework", description: "Prevention planning (SAMHSA)" },
];

function matchGrantOpportunity(query: string): {
  primaryPlatforms: Platform[];
  supportingPlatforms: Platform[];
  narrative: string;
  naicsCodes: string[];
  setAsideEligibility: string[];
  interdependencyStory: string;
  estimatedValueRange: string;
  competitiveAdvantages: string[];
  matchedFundingStream: FundingStream | null;
} {
  const q = query.toLowerCase();

  let matchedStream: FundingStream | null = null;
  for (const stream of FUNDING_STREAMS) {
    const streamTerms = stream.name.toLowerCase().split(/[\s\/]+/);
    if (streamTerms.some(t => t.length > 2 && q.includes(t))) {
      matchedStream = stream;
      break;
    }
  }

  const keywordMap: Record<string, string[]> = {
    "thriveup": ["workforce", "reentry", "prevention", "coalition", "youth", "wioa", "community", "grant"],
    "sankofa": ["health", "equity", "maternal", "mental", "behavioral", "chw", "disparit"],
    "rplice": ["implementation", "science", "research", "evaluation", "cfir", "re-aim", "epis"],
    "shield-atlas": ["defense", "military", "emergency", "dod", "dhs", "fema", "emso"],
    "isss": ["education", "school", "k-12", "mtss", "district", "title i", "idea", "iep"],
    "perfectly-different": ["neurodiversity", "autism", "adhd", "iep", "504", "special education", "neurodivers"],
    "m2c": ["veteran", "military", "transition", "va ", "dol/vets", "service member"],
    "lifebridge": ["211", "resource", "housing", "crisis", "domestic", "chw", "social determinant"],
    "the-incubator": ["contract", "sam.gov", "sbir", "sttr", "govcon", "federal contract"],
    "safereport": ["mandatory report", "compliance", "incident", "child welfare", "capta", "title ix"],
    "cognicare": ["cognitive", "tbi", "dementia", "alzheimer", "brain injury", "caregiver"],
    "medlog": ["medication", "adherence", "pharmacy", "dose", "prescription", "mat "],
    "unplanned": ["operations", "disruption", "facility", "workplace", "team operations"],
    "mce": ["minority", "mbe", "dbe", "8(a)", "hubzone", "wosb", "minority business", "certification", "small business", "sba", "mbda", "disadvantaged"],
  };

  const scoredPlatforms: { platform: Platform; score: number }[] = [];
  for (const platform of PLATFORMS) {
    let score = 0;
    const keywords = keywordMap[platform.id] || [];
    for (const kw of keywords) {
      if (q.includes(kw)) score += 3;
    }
    for (const ga of platform.grantAlignments) {
      if (q.includes(ga.source.toLowerCase()) || q.includes(ga.program.toLowerCase().substring(0, 10))) {
        score += 5;
      }
    }
    for (const pop of platform.populations) {
      if (q.includes(pop.toLowerCase().substring(0, 8))) score += 2;
    }
    if (score > 0) scoredPlatforms.push({ platform, score });
  }

  scoredPlatforms.sort((a, b) => b.score - a.score);

  let primaryPlatforms: Platform[];
  let supportingPlatforms: Platform[];

  if (matchedStream) {
    primaryPlatforms = PLATFORMS.filter(p => matchedStream!.primaryPlatforms.some(name => p.name.includes(name) || name.includes(p.name.split(" ")[0])));
    supportingPlatforms = PLATFORMS.filter(p => matchedStream!.supportingPlatforms.some(name => p.name.includes(name) || name.includes(p.name.split(" ")[0])));
  } else if (scoredPlatforms.length > 0) {
    const maxScore = scoredPlatforms[0].score;
    primaryPlatforms = scoredPlatforms.filter(sp => sp.score >= maxScore * 0.7).map(sp => sp.platform).slice(0, 3);
    supportingPlatforms = scoredPlatforms.filter(sp => sp.score < maxScore * 0.7 && sp.score > 0).map(sp => sp.platform).slice(0, 4);
  } else {
    primaryPlatforms = [PLATFORMS[0]];
    supportingPlatforms = PLATFORMS.slice(1, 4);
  }

  const allNaics = Array.from(new Set([...primaryPlatforms, ...supportingPlatforms].flatMap(p => p.naicsCodes)));

  const narrative = `The Collaborative Advocate brings ${primaryPlatforms.map(p => p.name).join(", ")} as primary platforms${supportingPlatforms.length > 0 ? `, supported by ${supportingPlatforms.map(p => p.name).join(", ")}` : ""}. This combination provides ${matchedStream?.combinedValue || "comprehensive technology infrastructure"} through our interdependent platform ecosystem. Our dual-entity structure (501(c)(3) Foundation + VOSB LLC) enables flexible contracting, and our proprietary MAP-GAP governance methodology ensures implementation fidelity and measurable outcomes.`;

  const interdependencyStory = primaryPlatforms.map(p => {
    const connections = p.interdependencies
      .filter(dep => [...primaryPlatforms, ...supportingPlatforms].some(sp => dep.platform.includes(sp.name.split(" ")[0]) || sp.name.includes(dep.platform.split(" ")[0])))
      .map(dep => `${dep.platform}: ${dep.capability}`);
    return connections.length > 0 ? `${p.name} connects to ${connections.join("; ")}` : "";
  }).filter(Boolean).join(". ");

  let estimatedValueRange = "$100K - $500K";
  if (q.includes("defense") || q.includes("dod")) estimatedValueRange = "$1M - $10M+";
  else if (q.includes("sbir")) estimatedValueRange = "$150K (Phase I) - $1M (Phase II)";
  else if (q.includes("wioa") || q.includes("samhsa")) estimatedValueRange = "$500K - $2M";
  else if (q.includes("dfc")) estimatedValueRange = "$125K/yr x 5yr ($625K total)";

  return {
    primaryPlatforms,
    supportingPlatforms,
    narrative,
    naicsCodes: allNaics,
    setAsideEligibility: ENTITY_INFO.setAsideEligibility,
    interdependencyStory,
    estimatedValueRange,
    competitiveAdvantages: [
      "VOSB Certification — eligible for veteran-owned set-aside contracts",
      "Complete IP Ownership — all 24 platforms, methodologies, and data architectures",
      `Proprietary Methodologies — MAP-GAP, SALP, Three Realities, MG-PATR, ISSS Knowledge Engine`,
      "Implementation Science Credibility — operationalized CFIR, RE-AIM, EPIS, SPF frameworks",
      `Portfolio Scale — ${PORTFOLIO_STATS.linesOfCode} LOC, ${PORTFOLIO_STATS.apiEndpoints} API endpoints, ${PORTFOLIO_STATS.databaseTables} database tables, ${PORTFOLIO_STATS.dataRecords} curated data records`,
      "Dual-Entity Structure — Foundation (grants) + LLC (contracts) for flexible engagement",
    ],
    matchedFundingStream: matchedStream,
  };
}

function requireAuth(req: Request, res: Response, next: Function) {
  const u = (req as unknown as Record<string, unknown>).user as { claims?: { sub?: string }; id?: string } | undefined;
  const userId = u?.claims?.sub || u?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized — sign in to access ecosystem portfolio" });
  next();
}

export function registerEcosystemCapacityRoutes(app: Express) {
  app.get("/api/ecosystem/portfolio", requireAuth, (_req: Request, res: Response) => {
    res.json({
      platforms: PLATFORMS,
      entityInfo: ENTITY_INFO,
      proprietaryMethodologies: PROPRIETARY_METHODOLOGIES,
      implementationFrameworks: IMPLEMENTATION_FRAMEWORKS,
      portfolioStats: PORTFOLIO_STATS,
      naicsCodes: NAICS_CODES,
    });
  });

  app.post("/api/ecosystem/grant-match", requireAuth, (req: Request, res: Response) => {
    const { query, fundingStreamId } = req.body;

    let searchQuery = query || "";
    if (fundingStreamId) {
      const stream = FUNDING_STREAMS.find(f => f.id === fundingStreamId);
      if (stream) {
        searchQuery = stream.name + " " + searchQuery;
      }
    }

    if (!searchQuery.trim()) {
      return res.status(400).json({ error: "Please provide a query or select a funding stream" });
    }

    const result = matchGrantOpportunity(searchQuery);
    res.json(result);
  });

  app.get("/api/ecosystem/opportunity-matrix", requireAuth, (_req: Request, res: Response) => {
    res.json({
      fundingStreams: FUNDING_STREAMS,
      populationSegments: POPULATION_SEGMENTS,
      platforms: PLATFORMS.map(p => ({ id: p.id, name: p.name, domain: p.domain })),
    });
  });

  app.get("/api/ecosystem/funding-streams", requireAuth, (_req: Request, res: Response) => {
    res.json(FUNDING_STREAMS);
  });
}
