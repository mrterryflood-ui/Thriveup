/**
 * Agency Intelligence Profiles — 28 Federal Agencies
 *
 * Static canonical layer: program offices, required forms (with live URLs),
 * mandatory performance systems, language dictionaries, evidence requirements,
 * budget rules, evaluation signals, and RAG text entries.
 *
 * Monthly resource-page refresh in agency-intelligence.ts augments these
 * static profiles with the latest guidance directly from agency websites.
 *
 * Sources: each agency's "how to apply / forms and resources" page.
 * Refresh cadence: 30 days (enforced in agency-intelligence.ts).
 */

export interface AgencyForm {
  name: string;
  description: string;
  url: string;
  required: boolean;
  whenRequired?: string;
}

export interface AgencyProgramOffice {
  id: string;
  name: string;
  focus: string;
  cfdaPrefix?: string;
  typicalAward?: string;
}

export interface AgencyProfile {
  agencyId: string;
  name: string;
  abbreviation: string;
  parentDepartment: string;
  resourcesUrl: string;
  howToApplyUrl: string;
  cfdaPrefix: string;
  programOffices: AgencyProgramOffice[];
  requiredForms: AgencyForm[];
  performanceSystem: {
    name: string;
    description: string;
    reportingFrequency: string;
    portalUrl?: string;
    keyMetrics: string[];
  };
  languageDictionary: string[];
  evidenceRequirements: {
    tier: string;
    description: string;
    examples: string[];
    cdepAccepted?: boolean;
  };
  budgetRules: {
    objectClasses: string[];
    matchRequired: string;
    indirectCostRule: string;
    notes: string;
  };
  evaluationSignals: {
    whatTheyScore: string[];
    commonDisqualifiers: string[];
    winFactors: string[];
  };
  ragEntries: Array<{
    title: string;
    content: string;
    keywords: string[];
  }>;
}

export const AGENCY_PROFILES: AgencyProfile[] = [

  // ─── 1. SAMHSA ───────────────────────────────────────────────────────────────
  {
    agencyId: "samhsa",
    name: "Substance Abuse and Mental Health Services Administration",
    abbreviation: "SAMHSA",
    parentDepartment: "HHS",
    resourcesUrl: "https://www.samhsa.gov/grants/how-to-apply/forms-and-resources",
    howToApplyUrl: "https://www.samhsa.gov/grants/how-to-apply",
    cfdaPrefix: "93.2",
    programOffices: [
      { id: "csat", name: "Center for Substance Abuse Treatment (CSAT)", focus: "Treatment, recovery support, MAT, reentry, justice-involved", cfdaPrefix: "93.243", typicalAward: "$500K–$2M/yr" },
      { id: "cmhs", name: "Center for Mental Health Services (CMHS)", focus: "Community mental health, crisis services, peer support, first episode psychosis", cfdaPrefix: "93.958", typicalAward: "$500K–$3M/yr" },
      { id: "csap", name: "Center for Substance Abuse Prevention (CSAP)", focus: "Underage drinking, opioid prevention, SPF grants, community coalitions", cfdaPrefix: "93.184", typicalAward: "$250K–$1M/yr" },
    ],
    requiredForms: [
      { name: "SF-424 Application for Federal Assistance", description: "Standard federal grant application cover form", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "SF-424A Budget Information (Non-Construction)", description: "Budget summary by object class", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "SAMHSA Budget Template", description: "SAMHSA-specific budget with object class detail — mandatory, not just SF-424A", url: "https://www.samhsa.gov/grants/how-to-apply/forms-and-resources", required: true },
      { name: "Budget Narrative", description: "Line-item justification for every budget category", url: "https://www.samhsa.gov/grants/how-to-apply/forms-and-resources", required: true },
      { name: "Biographical Sketches and Position Descriptions", description: "All key personnel — Project Director, Evaluator, Clinical Lead", url: "https://www.samhsa.gov/grants/how-to-apply/forms-and-resources", required: true },
      { name: "Data Collection Instrument / Plan", description: "Section D/E: maps outcomes to specific GPRA/NOMs instruments by program", url: "https://www.samhsa.gov/grants/how-to-apply/forms-and-resources", required: true },
      { name: "SF-LLL Disclosure of Lobbying Activities", description: "Required if lobbying activities apply", url: "https://www.grants.gov/web/grants/forms/sf-lll.html", required: false, whenRequired: "If applicant engages in lobbying" },
      { name: "Intergovernmental Review (E.O. 12372)", description: "State Single Point of Contact review if state participates", url: "https://www.samhsa.gov/grants/how-to-apply/forms-and-resources", required: false, whenRequired: "Required in participating states" },
      { name: "Attachment 12 — Implementation Science Statement", description: "For IS pilot-eligible NOFOs: organization's IS capacity and participation election", url: "https://www.samhsa.gov/grants/how-to-apply/forms-and-resources", required: false, whenRequired: "IS pilot-eligible NOFOs only" },
    ],
    performanceSystem: {
      name: "SPARS — SAMHSA Performance Accountability and Reporting System",
      description: "Mandatory post-award data portal. CSAT/CSAP grants report GPRA client-level data quarterly. CMHS grants report NOMs (National Outcome Measures). All grantees submit semi-annual progress reports and Annual Performance Reports (APR) through SPARS.",
      reportingFrequency: "Quarterly (client-level GPRA/NOMs data) + Semi-annual progress reports + Annual Performance Report",
      portalUrl: "https://spars.samhsa.gov",
      keyMetrics: [
        "GPRA: employment/education status, housing stability, substance use days in past 30, criminal justice involvement",
        "NOMs (CMHS): Uniform Reporting System (URS) tables, mental health outcomes, recovery measures",
        "Service utilization: number of clients served, sessions, MAT initiations",
        "Disparities: race/ethnicity, gender, age, co-occurring disorders",
      ],
    },
    languageDictionary: [
      "recovery-oriented care", "trauma-informed care", "GPRA client", "evidence-based practice (EBP)",
      "community-defined evidence practice (CDEP)", "lived experience", "peer support specialist",
      "co-occurring disorders", "medication-assisted treatment (MAT) / medications for opioid use disorder (MOUD)",
      "whole-person care", "behavioral health continuum", "recovery capital", "stigma reduction",
      "National Outcome Measures (NOMs)", "Strategic Prevention Framework (SPF)", "SMART objectives",
      "cultural and linguistic competence", "health equity", "social determinants of health",
      "12-step facilitation", "Motivational Interviewing (MI)", "Seeking Safety", "SBIRT",
      "continuum of care", "single state authority (SSA)",
    ],
    evidenceRequirements: {
      tier: "SAMHSA Evidence-Based Practices Resource Center (EBPRC)",
      description: "SAMHSA requires use of an EBP from the EBPRC or documentation that the practice meets SAMHSA's evidence standards. Community-Defined Evidence Practices (CDEPs) accepted with documentation. IS pilot-eligible grants may substitute an implementation science approach.",
      examples: ["Seeking Safety (CSAT)", "Assertive Community Treatment (CMHS)", "LifeSkills Training (CSAP)", "Motivational Enhancement Therapy", "Multisystemic Therapy"],
      cdepAccepted: true,
    },
    budgetRules: {
      objectClasses: ["Personnel", "Fringe Benefits", "Travel", "Equipment", "Supplies", "Contractual", "Construction (typically unallowable)", "Other Direct Costs", "Indirect Costs"],
      matchRequired: "Most SAMHSA programs do NOT require match. Verify in specific NOFO — some State Formula Grants require match.",
      indirectCostRule: "10% de minimis allowed if no Negotiated Indirect Cost Rate Agreement (NICRA). NICRA rate allowed if organization has one.",
      notes: "SAMHSA budget template is MANDATORY — SF-424A alone is insufficient. Every line item must have narrative justification. Supplanting existing funds with federal grant dollars is prohibited and a common audit finding.",
    },
    evaluationSignals: {
      whatTheyScore: [
        "Statement of Need: local data, disparities, evidence of community need",
        "Proposed Implementation Approach: EBP selection, fidelity plan, cultural adaptation documentation",
        "Organizational Capacity: staff credentials, facilities, MOU partners",
        "Data Collection / Evaluation Plan: GPRA/NOMs alignment, evaluator independence",
        "Cultural Competence: language access, community engagement, CDEP documentation if applicable",
        "Sustainability Plan: beyond-grant funding strategy",
      ],
      commonDisqualifiers: [
        "Budget exceeds NOFO maximum award ceiling",
        "Missing SAMHSA budget template (SF-424A alone fails)",
        "EBP not from EBPRC without adequate justification",
        "Data collection plan doesn't map to GPRA/NOMs instruments",
        "Missing required attachments (biosketch, letters of support, PD/job descriptions)",
        "Page limit exceeded — SAMHSA is strict",
        "Not registered in SAM.gov or registration expired",
      ],
      winFactors: [
        "Local epidemiological data tied to specific zip codes or census tracts",
        "GPRA instruments explicitly named — reviewers know you understand post-award requirements",
        "Implementation science framing (CFIR, RE-AIM) signals infrastructure readiness",
        "Letters of support from Single State Authority (SSA) or county behavioral health",
        "CDEP documentation with community validation if adapting an EBP",
        "Project Director with LADC/LCDC/LCSW credential named in narrative",
      ],
    },
    ragEntries: [
      {
        title: "SAMHSA Grant Writing: GPRA and NOMs Alignment is Non-Negotiable",
        content: "Every SAMHSA service grant requires client-level data collection mapped to GPRA (Government Performance and Results Act) instruments for CSAT and CSAP programs, or NOMs (National Outcome Measures) for CMHS programs. GPRA domains include: employment/education status, housing stability, substance use frequency in past 30 days, criminal justice involvement, and social connectedness. NOMs domains include: employment, housing, criminal justice, mental health status, and social support. Reviewers look for EXPLICIT naming of these instruments in Section D (Data Collection Plan) — not just 'we will collect outcome data.' Failure to align Section D to GPRA/NOMs is one of the top-scored weaknesses in SAMHSA applications. The SPARS portal (spars.samhsa.gov) is where all grantees upload quarterly GPRA data post-award. Mention SPARS readiness by name — it signals you understand post-award accountability.",
        keywords: ["samhsa", "gpra", "noms", "spars", "data collection", "outcome measures", "grant writing", "quarterly reporting"],
      },
      {
        title: "SAMHSA Evidence Requirements: EBPRC, CDEPs, and IS Pilots",
        content: "SAMHSA requires use of an evidence-based practice (EBP) from the Evidence-Based Practices Resource Center (EBPRC) at samhsa.gov/ebprc. The EBPRC contains 60+ treatment guidelines, 14 toolkits, 16 advisories, and 4 screening/assessment tools. If adapting an EBP for a specific culture or community, the Cultural Adaptation Framework requires documentation of the adaptation process and community validation. Community-Defined Evidence Practices (CDEPs) are accepted when EBPs from the EBPRC are not appropriate for the target population — the CDEP must be documented through a formal community validation process. For IS pilot-eligible NOFOs, organizations may elect to participate in SAMHSA's implementation science pilot and submit Attachment 12. ThriveUp/RPLICE's CFIR 2.0, RE-AIM, and EPIS framework infrastructure is a direct match for IS pilot eligibility and should be named explicitly in IS pilot elections.",
        keywords: ["samhsa", "ebprc", "evidence-based practice", "cdep", "cultural adaptation", "implementation science", "is pilot", "attachment 12"],
      },
      {
        title: "SAMHSA Budget Template: Mandatory Requirements Beyond SF-424A",
        content: "SAMHSA requires its own budget template in ADDITION to the federal SF-424A form. The SAMHSA budget template details costs by object class: Personnel (with FTE %), Fringe (with rate basis), Travel (with per-diem justification), Equipment (items over $5,000 requiring prior approval), Supplies, Contractual (subcontractor scope and rate basis), Other Direct Costs (participant support, incentives with justification), and Indirect Costs (NICRA rate or 10% de minimis). Every line must have corresponding narrative justification. Common budget errors: listing a 100% FTE Project Director without justifying that no duties are split; listing participant incentives without citing SAMHSA's guidance on allowable incentive amounts; using indirect cost rate higher than NICRA without documentation. Supplanting (replacing existing state or local funding with SAMHSA federal dollars) is prohibited and is a frequent audit finding.",
        keywords: ["samhsa", "budget", "budget template", "sf-424a", "indirect cost", "nicra", "object class", "participant incentives"],
      },
      {
        title: "SAMHSA Statement of Need: Local Data Requirements",
        content: "SAMHSA reviewers expect the Statement of Need to anchor every statistic to a primary source. Acceptable sources: CBHSQ (Center for Behavioral Health Statistics and Quality) national data, State BRFSS data, county-level SAMHSA/NSDUH estimates, local hospital emergency department data, and census tract-level SDOH data. Avoid using national averages without local comparison — reviewers score 'specificity of local need.' The SDOH Location Intelligence layer in RPLICE pulls CDC PLACES, SVI, Census ACS, and EPA data at the ZIP code and census tract level — this is the baseline engine for every SAMHSA needs statement. Link local substance use/mental health rates to SDOH conditions (poverty, unemployment, housing instability) in the same paragraph to demonstrate two-way causality, which SAMHSA's recovery-capital framework explicitly requires.",
        keywords: ["samhsa", "statement of need", "local data", "cbhsq", "nsduh", "brfss", "sdoh", "census tract", "needs statement"],
      },
    ],
  },

  // ─── 2. HRSA ─────────────────────────────────────────────────────────────────
  {
    agencyId: "hrsa",
    name: "Health Resources and Services Administration",
    abbreviation: "HRSA",
    parentDepartment: "HHS",
    resourcesUrl: "https://www.hrsa.gov/grants/apply",
    howToApplyUrl: "https://www.hrsa.gov/grants/apply",
    cfdaPrefix: "93.9",
    programOffices: [
      { id: "bphc", name: "Bureau of Primary Health Care (BPHC)", focus: "FQHCs, look-alikes, Health Center Program", cfdaPrefix: "93.224", typicalAward: "$650K–$6M/yr" },
      { id: "bhw", name: "Bureau of Health Workforce (BHW)", focus: "NHSC, workforce diversity, Nurse Corps, CHW training", cfdaPrefix: "93.925", typicalAward: "$250K–$1.5M" },
      { id: "mchb", name: "Maternal and Child Health Bureau (MCHB)", focus: "Title V, home visiting, sickle cell, newborn screening", cfdaPrefix: "93.110", typicalAward: "$400K–$2M" },
      { id: "orhp", name: "Office of Rural Health Policy (ORHP)", focus: "Rural health networks, telehealth, flex programs", cfdaPrefix: "93.912", typicalAward: "$200K–$500K" },
    ],
    requiredForms: [
      { name: "SF-424 Application for Federal Assistance", description: "Standard federal cover form", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "SF-424A Budget Information", description: "Budget summary by object class", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "Budget Narrative", description: "Detailed justification per object class", url: "https://www.hrsa.gov/grants/apply", required: true },
      { name: "Project Narrative", description: "Program-specific sections per NOFO", url: "https://www.hrsa.gov/grants/apply", required: true },
      { name: "Organizational Chart", description: "Showing project leadership in organizational context", url: "https://www.hrsa.gov/grants/apply", required: true },
      { name: "Biosketches / Resumes for Key Personnel", description: "All key personnel", url: "https://www.hrsa.gov/grants/apply", required: true },
      { name: "Letters of Support / MOUs", description: "From key community partners, hospitals, health departments", url: "https://www.hrsa.gov/grants/apply", required: false, whenRequired: "Consortium/partnership applications" },
    ],
    performanceSystem: {
      name: "HRSA Performance Improvement Management System (PIMS)",
      description: "Grantees report into HRSA's Electronic Handbooks (EHBs) at grants.hrsa.gov. Bureau-specific reporting: BPHC grantees report via Uniform Data System (UDS); BHW grantees report workforce placement outcomes; MCHB reports via TVIS and AIMS.",
      reportingFrequency: "Annual (UDS for BPHC) + Semi-annual progress reports",
      portalUrl: "https://grants.hrsa.gov",
      keyMetrics: ["Patients served (UDS)", "Enabling services utilization", "Health outcomes (clinical quality measures)", "Workforce placements/completions", "HPSA designation status"],
    },
    languageDictionary: [
      "health professional shortage area (HPSA)", "medically underserved area/population (MUA/MUP)",
      "federally qualified health center (FQHC)", "sliding fee scale", "enabling services",
      "community health worker (CHW)", "patient-centered care", "cultural competency",
      "telehealth / telemedicine", "integrated behavioral health", "whole-person health",
      "social determinants of health (SDOH)", "health disparities", "maternal mortality",
      "sickle cell disease", "newborn screening", "Title V MCH Block Grant",
      "workforce pipeline", "loan repayment / National Health Service Corps (NHSC)",
      "rural health", "critical access hospital (CAH)",
    ],
    evidenceRequirements: {
      tier: "HRSA prefers evidence-based models but accepts 'promising practices' with pilot data",
      description: "HRSA values evidence-informed approaches aligned with Healthy People 2030 objectives. Clinical quality measures must align with HRSA UDS benchmarks. Community health worker programs should reference the C3 Project national CHW core competencies.",
      examples: ["FQHC Health Center model", "Home Visiting (Nurse-Family Partnership, MIECHV)", "C3 CHW competency framework", "Integrated behavioral health (SAMHSA-HRSA co-funded)"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Personnel", "Fringe", "Travel", "Equipment", "Supplies", "Contractual", "Other", "Indirect"],
      matchRequired: "Varies by program. Health Center Program requires 25% match in some categories. ORHP Network grants may require match. Verify per NOFO.",
      indirectCostRule: "NICRA or 10% de minimis. FQHCs typically have established indirect rates.",
      notes: "HRSA Electronic Handbooks (EHBs) require budget uploaded in EHB format, not just Grants.gov. Failure to upload in EHBs = incomplete application.",
    },
    evaluationSignals: {
      whatTheyScore: ["Need for project (HPSA/MUA data)", "Response to need (proposed services)", "Evaluative measures (data collection, performance monitoring)", "Organizational capabilities (fiscal, technical, experiential)", "Impact"],
      commonDisqualifiers: ["Not registered in SAM.gov", "Missing EHB upload", "Service area not in HPSA/MUA", "Budget exceeds ceiling"],
      winFactors: ["HPSA score and MUA designation quantified", "UDS data cited as baseline if existing FQHC", "CHW integration with C3 competency alignment", "SDOH navigation infrastructure demonstrated"],
    },
    ragEntries: [
      {
        title: "HRSA Grant Writing: HPSA and MUA Data Are the Baseline",
        content: "HRSA's primary lens for need is whether the proposed service area is designated as a Health Professional Shortage Area (HPSA) or Medically Underserved Area/Population (MUA/MUP). Every HRSA needs statement must cite the current HPSA score (0-25, higher = greater shortage), MUA designation, and local health outcome data. Find current HPSA/MUA designations at data.hrsa.gov. HRSA reviewers discount needs statements that use only national or state statistics — local designation data is required. If the service area has multiple HPSAs (primary care, mental health, dental), cite each separately with its score. ThriveUp's SDOH Location Intelligence layer (ZIP code to census tract) supports building this baseline in minutes.",
        keywords: ["hrsa", "hpsa", "mua", "health professional shortage area", "medically underserved", "needs statement", "shortage designation"],
      },
      {
        title: "HRSA Electronic Handbooks (EHBs): The Hidden Application Requirement",
        content: "Submitting on Grants.gov is necessary but NOT sufficient for HRSA grants. HRSA requires a parallel submission through its Electronic Handbooks (EHBs) at grants.hrsa.gov. The EHB submission requires uploading the same documents in HRSA's specific form structure. Missing EHB submission is a common disqualifier. Organizations must register in EHBs separately from SAM.gov registration. For Bureau of Primary Health Care applications (FQHCs, Health Center Look-Alikes, New Access Points), the entire application workflow runs inside EHBs. Budget, project narrative, clinical quality measure baselines, and service area maps are all submitted through EHBs.",
        keywords: ["hrsa", "ehb", "electronic handbooks", "grants.hrsa.gov", "application", "submission", "fqhc", "bphc"],
      },
    ],
  },

  // ─── 3. ACF ──────────────────────────────────────────────────────────────────
  {
    agencyId: "acf",
    name: "Administration for Children and Families",
    abbreviation: "ACF",
    parentDepartment: "HHS",
    resourcesUrl: "https://www.acf.hhs.gov/grants",
    howToApplyUrl: "https://www.acf.hhs.gov/grants/how-to-apply",
    cfdaPrefix: "93.6",
    programOffices: [
      { id: "ohs", name: "Office of Head Start (OHS)", focus: "Early childhood, Head Start, Early Head Start", cfdaPrefix: "93.600", typicalAward: "$500K–$10M" },
      { id: "ocse", name: "Office of Child Support Services (OCSE)", focus: "Child support, paternity, fatherhood programs", cfdaPrefix: "93.597", typicalAward: "$250K–$2M" },
      { id: "opre", name: "Office of Planning, Research & Evaluation (OPRE)", focus: "Research and evaluation grants, TANF, child welfare", cfdaPrefix: "93.647", typicalAward: "$500K–$3M" },
      { id: "ofrf", name: "Office of Family Assistance (OFA)", focus: "TANF, healthy marriages, fatherhood, HMRF", cfdaPrefix: "93.086", typicalAward: "$500K–$3M" },
      { id: "cb", name: "Children's Bureau (CB)", focus: "Child welfare, foster care, Title IV-E, family preservation", cfdaPrefix: "93.556", typicalAward: "$300K–$2M" },
      { id: "orr", name: "Office of Refugee Resettlement (ORR)", focus: "Refugee services, unaccompanied children, asylum seekers", cfdaPrefix: "93.566", typicalAward: "$500K–$5M" },
    ],
    requiredForms: [
      { name: "SF-424 Application for Federal Assistance", description: "Standard federal cover form", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "SF-424A Budget Information", description: "Budget by object class", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "Project Description / Program Narrative", description: "Section-specific per NOFO; must address all selection criteria in stated order", url: "https://www.acf.hhs.gov/grants", required: true },
      { name: "Budget Narrative", description: "Detailed line-by-line justification", url: "https://www.acf.hhs.gov/grants", required: true },
      { name: "Logic Model", description: "Required by most ACF program offices; inputs → activities → outputs → outcomes", url: "https://www.acf.hhs.gov/grants", required: true },
      { name: "Staff Resumes / Biosketches", description: "Key personnel qualifications", url: "https://www.acf.hhs.gov/grants", required: true },
    ],
    performanceSystem: {
      name: "ACF Program Information Report (PIR) and Online Data Collection (OLDC)",
      description: "Head Start grantees report through PIR annually. Child welfare grantees report through AFCARS and NCANDS. TANF/OFA grantees submit quarterly performance reports. Evaluation grantees follow study-specific reporting. All ACF grantees use OLDC or the GrantSolutions.gov portal.",
      reportingFrequency: "Quarterly performance reports + Annual Program Information Report (PIR) for Head Start",
      portalUrl: "https://eclkc.ohs.acf.hhs.gov",
      keyMetrics: ["Children and families served", "Enrollment and attendance", "School readiness outcomes", "Family engagement", "Child welfare case outcomes"],
    },
    languageDictionary: [
      "two-generation model", "family strengthening", "protective factors", "trauma-informed care",
      "kinship care", "aging out of foster care", "family preservation", "permanency",
      "reunification", "healthy marriage and responsible fatherhood (HMRF)", "school readiness",
      "developmental screening", "early intervention", "adverse childhood experiences (ACEs)",
      "Title IV-E", "TANF", "child welfare", "evidence-based home visiting",
      "strength-based approach", "wraparound services", "family stability",
      "fatherhood engagement", "co-parenting", "unaccompanied children",
    ],
    evidenceRequirements: {
      tier: "ACF's What Works Clearinghouse + Title IV-E Prevention Programs Clearinghouse",
      description: "ACF requires evidence-based or evidence-informed programs. Home visiting programs must be from the HHS Home Visiting Evidence of Effectiveness (HomVEE) database. Child welfare prevention programs use the Title IV-E Prevention Programs Clearinghouse (Tier 1 or 2). Fatherhood/HMRF programs reference ACF's own evidence review. Head Start applicants cite ACF Head Start Program Performance Standards.",
      examples: ["Nurse-Family Partnership (HomVEE)", "Parents as Teachers (HomVEE)", "Family Spirit (HomVEE)", "Multi-Systemic Therapy (IV-E Clearinghouse Tier 1)", "Functional Family Therapy"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Personnel", "Fringe", "Travel", "Equipment", "Supplies", "Contractual", "Other", "Indirect"],
      matchRequired: "Head Start requires 25% non-federal match (can be in-kind). Most other ACF programs do not require match. Verify per NOFO.",
      indirectCostRule: "NICRA or 10% de minimis. Head Start: indirect cost rate applies to modified total direct costs.",
      notes: "Head Start cost allocation principles under 45 CFR Part 75. All ACF grants must follow non-supplanting rules. Multi-year budgets often required — show scaling logic year-over-year.",
    },
    evaluationSignals: {
      whatTheyScore: ["Project design and approach", "Organizational capacity", "Relevant experience", "Logic model quality", "Evaluation design", "Sustainability"],
      commonDisqualifiers: ["Logic model missing", "Evidence base not aligned to NOFO program type", "Head Start match not documented", "Key personnel not named"],
      winFactors: ["Two-generation model explicitly named", "ACEs framework with trauma-informed approach", "Existing partnership with child welfare agency (MOUs)", "CFIR framing for implementation planning"],
    },
    ragEntries: [
      {
        title: "ACF Grant Writing: Two-Generation Model and ACEs Framework",
        content: "ACF funds the full spectrum of child and family services. Winning applications name the two-generation model explicitly: programs that simultaneously address children's development AND parents' economic stability, mental health, and social connectedness are scored higher than programs serving only one generation. The ACEs (Adverse Childhood Experiences) framework, developed from the CDC-Kaiser study, is expected language in any ACF proposal touching trauma, family instability, or child welfare. Name ACEs, cite the original Felitti et al. research, and show how the program addresses multiple ACE types. Protective factors language (from the Strengthening Families framework) is the ACF companion: safe stable nurturing relationships, knowledge of parenting and child development, concrete support in times of need, social connections, social and emotional competence of children.",
        keywords: ["acf", "two-generation", "aces", "trauma-informed", "child welfare", "family strengthening", "protective factors", "head start"],
      },
    ],
  },

  // ─── 4. DOL/ETA ──────────────────────────────────────────────────────────────
  {
    agencyId: "dol_eta",
    name: "Department of Labor — Employment and Training Administration",
    abbreviation: "DOL/ETA",
    parentDepartment: "DOL",
    resourcesUrl: "https://www.dol.gov/agencies/eta/grants",
    howToApplyUrl: "https://www.dol.gov/agencies/eta/grants/how-to-apply",
    cfdaPrefix: "17.2",
    programOffices: [
      { id: "wioa", name: "WIOA Title I Adult/Youth/Dislocated Worker", focus: "Workforce training, career pathways, OJT, employer partnerships", cfdaPrefix: "17.259", typicalAward: "$500K–$5M" },
      { id: "youthbuild", name: "YouthBuild", focus: "Disconnected youth 16-24, construction skills, HSD/GED, civic engagement", cfdaPrefix: "17.274", typicalAward: "$700K–$900K" },
      { id: "restart", name: "RESTART Initiative (FOA-ETA-26-17)", focus: "Justice-involved youth/young adults reentry, workforce, apprenticeship", cfdaPrefix: "17.2", typicalAward: "$2.5M–$7.5M" },
      { id: "apprenticeship", name: "ApprenticeshipUSA", focus: "Registered apprenticeships, pre-apprenticeship, expansion grants", cfdaPrefix: "17.201", typicalAward: "$500K–$5M" },
      { id: "jag", name: "Jobs for Veterans State Grants (JVSG)", focus: "Veterans employment, disabled veterans outreach", cfdaPrefix: "17.801", typicalAward: "Formula grant" },
    ],
    requiredForms: [
      { name: "SF-424 Application for Federal Assistance", description: "Standard federal cover form", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "SF-424A Budget Information", description: "Budget by object class", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "Budget Narrative", description: "Justification for all budget line items", url: "https://www.dol.gov/agencies/eta/grants", required: true },
      { name: "Project Narrative", description: "Addresses technical review criteria in stated order", url: "https://www.dol.gov/agencies/eta/grants", required: true },
      { name: "Work Plan / Project Timeline", description: "Milestones, deliverables, responsible parties", url: "https://www.dol.gov/agencies/eta/grants", required: true },
      { name: "Key Personnel Resumes", description: "Project Director and key staff", url: "https://www.dol.gov/agencies/eta/grants", required: true },
      { name: "LWDB / Workforce System Partner MOUs", description: "For WIOA and RESTART: required LWDB partnership letter", url: "https://www.dol.gov/agencies/eta/grants", required: false, whenRequired: "WIOA, RESTART — LWDB partnership required" },
      { name: "Subcontract Agreements or Letters of Commitment", description: "For consortium/subgrantee structures", url: "https://www.dol.gov/agencies/eta/grants", required: false, whenRequired: "Multi-party applications" },
    ],
    performanceSystem: {
      name: "Workforce Integrated Performance System (WIPS) / DOL Performance Accountability",
      description: "DOL uses common performance measures across WIOA programs. Primary indicators: Employment Rate 2nd Quarter After Exit, Employment Rate 4th Quarter After Exit, Median Earnings 2nd Quarter After Exit, Credential Attainment Rate, Measurable Skill Gains. Grantees report quarterly through ETA's reporting system.",
      reportingFrequency: "Quarterly participant-level data + Quarterly Performance Report (QPR)",
      portalUrl: "https://www.dol.gov/agencies/eta/performance",
      keyMetrics: [
        "Employment rate 2nd quarter after exit (Q2)",
        "Employment rate 4th quarter after exit (Q4)",
        "Median earnings 2nd quarter after exit",
        "Credential / educational attainment rate",
        "Measurable skill gains during program",
      ],
    },
    languageDictionary: [
      "career pathway", "sector strategy", "demand-driven", "industry-recognized credential (IRC)",
      "on-the-job training (OJT)", "work-based learning", "registered apprenticeship",
      "pre-apprenticeship", "occupational skills training", "credential attainment",
      "measurable skill gain", "employment retention", "median earnings",
      "individualized employment plan (IEP)", "co-enrollment", "co-location",
      "American Job Center (AJC)", "Local Workforce Development Board (LWDB)",
      "career services", "training services", "support services",
      "disconnected youth", "opportunity youth", "barrier to employment",
      "justice-involved", "reentry", "residential options", "period of performance",
    ],
    evidenceRequirements: {
      tier: "DOL/ETA uses the What Works in Workforce Development evidence framework",
      description: "DOL prefers programs with evidence from the What Works Clearinghouse or DOL's own Chief Evaluation Office evidence reviews. Career pathway models are scored favorably. RESTART and YouthBuild cite specific evidence for reentry interventions (RNR model, cognitive behavioral therapy, transitional jobs).",
      examples: ["Career Pathways", "Transitional Jobs", "Registered Apprenticeship", "YouthBuild model", "Cognitive Behavioral Intervention for Justice Involved (CBT-J)"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Personnel", "Fringe", "Travel", "Equipment", "Supplies", "Contractual", "Training/Participant Support", "Other Direct Costs", "Indirect"],
      matchRequired: "YouthBuild requires 25% match. RESTART: no match required but cost share is viewed favorably. WIOA formula grants: match required. Check specific FOA.",
      indirectCostRule: "NICRA or 10% de minimis on Modified Total Direct Costs (MTDC). DOL allows up to 15% indirect for some programs with justification.",
      notes: "Participant support costs (stipends, transportation, childcare) are tracked separately. DOL is sensitive to high administrative overhead. Section on cost per participant is standard and scored.",
    },
    evaluationSignals: {
      whatTheyScore: [
        "Statement of Need: local labor market data, employer demand, population barriers",
        "Project Design: career pathway structure, credential alignment, employer engagement",
        "Organizational Capacity: track record with target population, LWDB partnership",
        "Management Approach: project director experience, data systems",
        "Performance Goals: realistic but ambitious targets for the 5 primary indicators",
        "Budget: cost per participant, leveraged resources",
      ],
      commonDisqualifiers: [
        "Missing LWDB partnership letter for programs requiring it",
        "Performance targets that don't address all 5 primary indicators",
        "Budget without participant cost breakdown",
        "No employer engagement plan",
        "Project Director without workforce development experience",
      ],
      winFactors: [
        "Named employer partners with MOUs or letters of commitment",
        "Industry-recognized credentials tied to specific NAICS sector",
        "Existing co-enrollment agreements with LWDB/AJC",
        "Cost per participant competitive with comparable programs",
        "Evidence-based reentry intervention named (for RESTART, YouthBuild)",
      ],
    },
    ragEntries: [
      {
        title: "DOL/ETA Grant Writing: Five Primary Performance Indicators Are Non-Negotiable",
        content: "DOL uses five common performance indicators across all WIOA-aligned programs. Every proposal must include realistic, data-backed targets for all five: (1) Employment Rate 2nd Quarter After Exit — typically 65-75% for adult programs, 50-65% for youth/reentry; (2) Employment Rate 4th Quarter After Exit — 5-10 points lower than Q2 target; (3) Median Earnings 2nd Quarter After Exit — tied to local wage data and the target sector; (4) Credential Attainment Rate — percentage earning an industry-recognized credential or educational credential; (5) Measurable Skill Gains — percentage of participants making progress in English/math or achieving a skills checkpoint during enrollment. Reviewers flag applications that omit any of these five or set targets without local labor market data support. The Bureau of Labor Statistics QCEW and the local LWDB's labor market information should anchor every target.",
        keywords: ["dol", "eta", "wioa", "performance indicators", "employment rate", "credential attainment", "measurable skill gains", "median earnings"],
      },
      {
        title: "DOL RESTART: FOA-ETA-26-17 Intelligence and LWDB Requirement",
        content: "DOL's RESTART Initiative (FOA-ETA-26-17) targets justice-involved youth ages 15-17 and young adults ages 18-24. Award range: $2.5M–$7.5M over 42 months. Minimum enrollment at the $5.1M level: 680 participants. Cost per participant: ~$7,500. CRITICAL REQUIREMENT: Applications must include a partnership letter from a Local Workforce Development Board (LWDB) — without this, the application is incomplete. Contact Capital Area Workforce Solutions (CAWS) at capitalareaws.com for the Austin/Central Texas LWDB partnership. RESTART uses DOL's Three-Pillar framework: (1) Relief — immediate stabilization (housing, food, crisis support), (2) Stabilize — skills training and credential attainment, (3) Contribute — employer placement and 12-month retention. The proposal must show a pipeline from pre-release preparation through 12-month employment retention with specific milestones at each stage. Evidence-based reentry interventions (CBT-J, Motivational Interviewing, Risk-Need-Responsivity model) must be named.",
        keywords: ["dol", "restart", "foa-eta-26-17", "reentry", "justice-involved", "lwdb", "capital area workforce solutions", "three-pillar"],
      },
    ],
  },

  // ─── 5. NSF ───────────────────────────────────────────────────────────────────
  {
    agencyId: "nsf",
    name: "National Science Foundation",
    abbreviation: "NSF",
    parentDepartment: "Independent",
    resourcesUrl: "https://www.nsf.gov/funding/preparing_proposals",
    howToApplyUrl: "https://www.nsf.gov/bfa/dias/policy/docs/pappg.pdf",
    cfdaPrefix: "47",
    programOffices: [
      { id: "tip", name: "TIP — Technology, Innovation and Partnerships", focus: "Convergence accelerators, regional innovation, NSF TechAccess (26-508)", cfdaPrefix: "47.084", typicalAward: "$1M–$5M" },
      { id: "edu", name: "EDU — STEM Education Directorate", focus: "IUSE, STEM K-12, ATE, undergraduate research, equity in STEM", cfdaPrefix: "47.076", typicalAward: "$300K–$3M" },
      { id: "cise", name: "CISE — Computer and Information Science", focus: "AI, data science, cybersecurity, broadband, SoSDCI", cfdaPrefix: "47.070", typicalAward: "$300K–$3M" },
      { id: "sbe", name: "SBE — Social, Behavioral and Economic Sciences", focus: "Sociology, psychology, economics, community-based research", cfdaPrefix: "47.075", typicalAward: "$200K–$1M" },
    ],
    requiredForms: [
      { name: "Cover Sheet (Research.gov)", description: "PI info, institution, program solicitation — submitted via Research.gov or Grants.gov", url: "https://research.gov", required: true },
      { name: "Project Summary (1 page)", description: "Overview, intellectual merit, broader impacts — 3 paragraphs, 4,600 characters", url: "https://www.nsf.gov/bfa/dias/policy/docs/pappg.pdf", required: true },
      { name: "Project Description (15 pages standard)", description: "Technical narrative, broader impacts, education plan — page limit varies by solicitation", url: "https://www.nsf.gov/bfa/dias/policy/docs/pappg.pdf", required: true },
      { name: "References Cited", description: "Full citations — no page limit", url: "https://www.nsf.gov/bfa/dias/policy/docs/pappg.pdf", required: true },
      { name: "Biographical Sketches (3 pages)", description: "NSF-specific format for PI and Co-PIs — SciENcv system preferred", url: "https://www.nsf.gov/bfa/dias/policy/docs/pappg.pdf", required: true },
      { name: "Budget (R&R Budget form)", description: "Detailed budget with justification per year", url: "https://www.nsf.gov/bfa/dias/policy/docs/pappg.pdf", required: true },
      { name: "Facilities, Equipment, Other Resources", description: "Available infrastructure — no page limit", url: "https://www.nsf.gov/bfa/dias/policy/docs/pappg.pdf", required: true },
      { name: "Data Management and Sharing Plan (2 pages)", description: "How data will be managed, shared, preserved", url: "https://www.nsf.gov/bfa/dias/policy/docs/pappg.pdf", required: true },
      { name: "Mentoring Plan", description: "For proposals with postdocs", url: "https://www.nsf.gov/bfa/dias/policy/docs/pappg.pdf", required: false, whenRequired: "If proposal includes postdoctoral researchers" },
    ],
    performanceSystem: {
      name: "NSF Research.gov Annual and Final Project Reports",
      description: "NSF grantees submit Annual Project Reports and a Final Project Report through Research.gov. Reports cover: accomplishments, products (publications, datasets, code), participants, impacts (research and societal), and changes to project. NSF performs ongoing monitoring and site visits for large awards.",
      reportingFrequency: "Annual project report + Final project report",
      portalUrl: "https://research.gov",
      keyMetrics: ["Publications", "Data products", "Students/postdocs trained", "Broader impacts", "Patents/licenses", "Partnerships formed"],
    },
    languageDictionary: [
      "intellectual merit", "broader impacts", "transformative research", "convergence research",
      "use-inspired research", "translational research", "broadening participation",
      "underrepresented groups in STEM", "evidence-based undergraduate instruction",
      "IUSE (Improving Undergraduate STEM Education)", "ATE (Advanced Technological Education)",
      "data management plan", "open science", "reproducibility",
      "industry-academic partnership", "workforce development", "community college",
      "convergence accelerator", "regional innovation ecosystem", "technology readiness level (TRL)",
      "Principal Investigator (PI)", "Co-Principal Investigator (Co-PI)", "REU (Research Experience for Undergraduates)",
    ],
    evidenceRequirements: {
      tier: "NSF uses peer review (merit review) — two criteria: Intellectual Merit and Broader Impacts",
      description: "NSF does not use a tiered evidence framework like human services agencies. All proposals are evaluated on Intellectual Merit (scientific/technical contribution, approach, qualifications) and Broader Impacts (societal benefit, broadening participation, education, dissemination). TechAccess and ATE explicitly require evidence of prior work with the target population or technology domain.",
      examples: ["Published peer-reviewed evidence", "Pilot study data", "Preliminary findings from prior NSF awards", "Technical reports and white papers"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Senior Personnel", "Other Personnel", "Fringe Benefits", "Equipment", "Travel", "Participant Support", "Other Direct Costs", "Indirect/F&A"],
      matchRequired: "NSF does not typically require match for research grants. TechAccess (26-508) requires a 1:1 cost share at the full proposal stage. ATE: no match. Convergence Accelerator: match required at Phase 2.",
      indirectCostRule: "Facilities and Administrative (F&A) rate negotiated with cognizant federal agency. For nonprofits without a rate: 26% on modified total direct costs is a common starting point.",
      notes: "NSF prohibits charging publication costs to grants unless open-access compliance requires it. Indirect costs on participant support costs are zero. Equipment depreciation not charged; must justify equipment purchases.",
    },
    evaluationSignals: {
      whatTheyScore: ["Intellectual merit of the proposed activity", "Broader impacts of the proposed activity — societal benefit, diversity, education"],
      commonDisqualifiers: ["Project Summary missing the 3 required paragraphs (overview, intellectual merit, broader impacts)", "Biosketch exceeds 3 pages or uses non-NSF format", "Data management plan missing", "Page limit exceeded"],
      winFactors: ["Preliminary data demonstrating feasibility", "Named underrepresented groups and specific broadening participation plan", "Partnership letters from industry or community organizations for TechAccess/ATE", "Connection to prior NSF-funded work"],
    },
    ragEntries: [
      {
        title: "NSF Grant Writing: Intellectual Merit AND Broader Impacts Both Required",
        content: "NSF evaluates every proposal on exactly two criteria: Intellectual Merit (the scientific/technical contribution and quality of the approach) and Broader Impacts (the societal benefits, including broadening participation of underrepresented groups in STEM, education, and dissemination). Both are REQUIRED — proposals that excel on one but fail to address the other are rejected. The Project Summary must contain three labeled paragraphs: (1) Overview, (2) Intellectual Merit, (3) Broader Impacts. NSF reviewers scan the Project Summary first — if it doesn't have all three labeled sections, the proposal is scored lower before the full narrative is read. For TechAccess (NSF 26-508), the Broader Impacts section should explicitly name the communities, workforce segments, or geographic regions that will benefit from the AI education coordination infrastructure.",
        keywords: ["nsf", "intellectual merit", "broader impacts", "project summary", "peer review", "merit review", "techaccess", "nsf 26-508"],
      },
    ],
  },

  // ─── 6. DOJ/OJJDP ────────────────────────────────────────────────────────────
  {
    agencyId: "ojjdp",
    name: "Office of Juvenile Justice and Delinquency Prevention",
    abbreviation: "OJJDP",
    parentDepartment: "DOJ",
    resourcesUrl: "https://ojjdp.gov/grants",
    howToApplyUrl: "https://ojjdp.gov/grants/solicitations",
    cfdaPrefix: "16.5",
    programOffices: [
      { id: "sca", name: "Second Chance Act (SCA) — Youth", focus: "Reentry, transition planning, pre-release/post-release continuum", cfdaPrefix: "16.812", typicalAward: "$700K–$1M" },
      { id: "jjdp", name: "JJDP Act Title II Formula Grants", focus: "State formula, deinstitutionalization, disproportionate minority contact (DMC)", cfdaPrefix: "16.540", typicalAward: "Formula" },
      { id: "mentoring", name: "Mentoring to Succeed", focus: "Evidence-based mentoring for at-risk youth", cfdaPrefix: "16.726", typicalAward: "$300K–$500K" },
    ],
    requiredForms: [
      { name: "SF-424 Application for Federal Assistance", description: "Standard federal cover form", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "SF-424A Budget Information", description: "Budget by object class", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "Budget Detail Worksheet", description: "OJJDP-specific detailed budget with all personnel listed by name and rate", url: "https://ojjdp.gov/grants/forms.html", required: true },
      { name: "Project Abstract", description: "250-word project summary", url: "https://ojjdp.gov/grants/forms.html", required: true },
      { name: "Project Narrative", description: "Addresses criteria in stated order — Statement of the Problem, Project Design, Capabilities/Competencies, Plan for Collecting Data, Budget", url: "https://ojjdp.gov/grants/forms.html", required: true },
      { name: "Indirect Cost Agreement", description: "If claiming indirect costs above de minimis", url: "https://ojjdp.gov/grants/forms.html", required: false },
    ],
    performanceSystem: {
      name: "OJJDP Performance Measurement Tool (PMT)",
      description: "OJJDP grantees report semiannually through the Performance Measurement Tool (PMT) at ojjdppmt.ojp.gov. Measures vary by program but typically include: youth served, recidivism rates, school enrollment/completion, employment, substance use, and housing stability.",
      reportingFrequency: "Semi-annual performance reports via PMT + Annual Financial Reports",
      portalUrl: "https://ojjdppmt.ojp.gov",
      keyMetrics: ["Youth served", "Recidivism / re-arrest rate", "School enrollment / completion", "Employment at exit", "Housing stability", "Substance use reduction"],
    },
    languageDictionary: [
      "juvenile justice", "delinquency prevention", "disproportionate minority contact (DMC)",
      "deinstitutionalization of status offenders (DSO)", "sight and sound separation",
      "recidivism", "reentry", "pre-release planning", "post-release supervision",
      "evidence-based program", "risk-need-responsivity (RNR) model",
      "cognitive behavioral intervention (CBI)", "trauma-informed juvenile justice",
      "restorative justice", "diversion", "community-based alternatives",
      "youth development", "positive youth development (PYD)", "mentoring",
      "truancy", "gang prevention", "substance abuse among youth",
    ],
    evidenceRequirements: {
      tier: "OJJDP Model Programs Guide (MPG) — tiered evidence levels",
      description: "OJJDP uses the Model Programs Guide (MPG) at ojjdp.gov/mpg to classify programs as Effective, Promising, or No Effects. Applications must cite MPG evidence ratings. The Risk-Need-Responsivity (RNR) model is the dominant theoretical framework for reentry and supervision applications. Cognitive Behavioral Interventions (CBIs) are the most evidence-supported intervention type for justice-involved youth.",
      examples: ["Multisystemic Therapy (MST — MPG Effective)", "Functional Family Therapy (FFT — MPG Effective)", "Thinking for a Change (CBI — MPG Effective)", "Trauma-Focused CBT (TF-CBT — MPG Effective)"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Personnel", "Fringe", "Travel", "Equipment", "Supplies", "Contractual", "Construction", "Other", "Indirect"],
      matchRequired: "SCA requires 25% match (can be in-kind). Most OJJDP discretionary grants do not require match. Verify per solicitation.",
      indirectCostRule: "NICRA or 10% de minimis. DOJ OJP has specific rules — review DOJ Financial Guide.",
      notes: "DOJ OJP Financial Guide governs. Allowable costs include participant stipends for reentry programs. Funds may not be used for physical security/law enforcement equipment without justification.",
    },
    evaluationSignals: {
      whatTheyScore: [
        "Statement of the Problem: local recidivism data, DMC data, needs assessment",
        "Project Design: EBP selection from MPG, RNR alignment, service delivery plan",
        "Capabilities/Competencies: prior experience with justice-involved youth",
        "Plan for Collecting Data: performance measures mapped to PMT",
        "Budget: cost-per-participant, match documentation",
      ],
      commonDisqualifiers: ["EBP not in MPG without justification", "Missing match documentation", "Budget worksheet incomplete", "Performance measures not mapped to PMT"],
      winFactors: ["MPG Effective or Promising programs named", "RNR framework explicitly applied", "Existing JJDP Act compliance infrastructure", "Community supervision agency partner (MOUs from probation)"],
    },
    ragEntries: [
      {
        title: "OJJDP Grant Writing: Risk-Need-Responsivity and the Model Programs Guide",
        content: "OJJDP's intellectual framework for all reentry and delinquency prevention grants is the Risk-Need-Responsivity (RNR) model developed by Andrews and Bonta. Risk principle: target services to moderate/high-risk youth (assessed with a validated tool like YASI or YLS/CMI). Need principle: address criminogenic needs (antisocial attitudes, criminal peers, substance use, family, school, leisure, work). Responsivity principle: deliver services in a way that matches the youth's learning style and motivation. Every OJJDP proposal touching reentry must explicitly name the RNR model and show how the program addresses all three principles. The OJJDP Model Programs Guide (ojjdp.gov/mpg) is the evidence registry — every named intervention should have an MPG rating. Cognitive Behavioral Interventions (CBIs) like Thinking for a Change, Aggression Replacement Training, and Moral Reconation Therapy are the most evidence-supported and should be named when CBI is used.",
        keywords: ["ojjdp", "rnr", "risk-need-responsivity", "model programs guide", "mpg", "cognitive behavioral", "reentry", "juvenile justice", "second chance act"],
      },
    ],
  },

  // ─── 7. HUD ───────────────────────────────────────────────────────────────────
  {
    agencyId: "hud",
    name: "Department of Housing and Urban Development",
    abbreviation: "HUD",
    parentDepartment: "Independent",
    resourcesUrl: "https://www.hud.gov/program_offices/spm/gmomgmt/grantsinfo",
    howToApplyUrl: "https://www.hud.gov/grants",
    cfdaPrefix: "14",
    programOffices: [
      { id: "cpd", name: "Community Planning and Development (CPD)", focus: "CDBG, HOME, ESG, HOPWA, Choice Neighborhoods", cfdaPrefix: "14.218", typicalAward: "Formula (local); competitive $3M–$30M" },
      { id: "osp", name: "Office of Special Purpose Grants", focus: "YouthBuild (housing component), HUD Capacity Building", cfdaPrefix: "14.243", typicalAward: "$700K–$900K" },
      { id: "fhip", name: "Fair Housing Initiatives Program (FHIP)", focus: "Fair housing education, testing, enforcement", cfdaPrefix: "14.408", typicalAward: "$250K–$1M" },
    ],
    requiredForms: [
      { name: "SF-424 Application for Federal Assistance", description: "Standard federal cover form", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "HUD-2880 Applicant/Recipient Disclosure Form", description: "Disclosure of federal assistance, civil rights certifications", url: "https://www.hud.gov/sites/documents/2880.PDF", required: true },
      { name: "SF-424A Budget or HUD-specific Budget Form", description: "Budget by object class", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "Program Narrative", description: "Capacity, community need, program design, leveraged resources", url: "https://www.hud.gov/grants", required: true },
      { name: "Community Needs Assessment", description: "Local housing and poverty data with maps where applicable", url: "https://www.hud.gov/grants", required: true },
      { name: "SF-LLL Disclosure of Lobbying", description: "Required if lobbying activities", url: "https://www.grants.gov/web/grants/forms/sf-lll.html", required: false },
    ],
    performanceSystem: {
      name: "IDIS (Integrated Disbursement and Information System)",
      description: "CPD formula grantees (CDBG, HOME, ESG) report through IDIS. Competitive grant grantees report through HUD's reporting portal. HUD uses the Consolidated Plan and Annual Action Plan as the planning documents that frame all CPD grant reporting.",
      reportingFrequency: "Annual performance reports + CAPER (Consolidated Annual Performance and Evaluation Report) for CPD formula",
      portalUrl: "https://idis.hud.gov",
      keyMetrics: ["Units of housing created/preserved", "Persons assisted", "National Objectives met (LMI)", "Section 3 compliance (jobs for low-income residents)", "Fair housing certifications"],
    },
    languageDictionary: [
      "low-to-moderate income (LMI)", "national objective", "community development",
      "consolidated plan", "annual action plan", "CAPER", "CDBG entitlement community",
      "affordable housing", "housing unit", "homeownership", "rental assistance",
      "Section 3", "economic opportunities for low-income residents",
      "disproportionate housing needs", "overcrowding", "cost burden",
      "homeless", "chronically homeless", "housing first", "rapid rehousing",
      "transitional housing", "permanent supportive housing", "CoC (Continuum of Care)",
      "choice neighborhoods", "place-based investment", "mixed-income community",
    ],
    evidenceRequirements: {
      tier: "HUD Evidence and Innovation program + What Works in Housing",
      description: "HUD competitive grants require evidence-based or evidence-informed approaches. Choice Neighborhoods requires a transformation plan with needs assessment. CDBG competitive rounds use HUD's evidence tiers. Housing First is the required model for chronic homelessness programs (Continuum of Care, ESG).",
      examples: ["Housing First model (HUD-designated evidence base)", "Rapid Rehousing", "Permanent Supportive Housing with evidence-based wraparound", "Community Land Trust model"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Personnel", "Fringe", "Travel", "Equipment", "Supplies", "Contractual", "Construction", "Other", "Indirect"],
      matchRequired: "HOME requires 25% match. CDBG: generally no match but leverage is scored. ESG requires 100% match. Section 4 Capacity Building: 100% match required.",
      indirectCostRule: "NICRA or 10% de minimis. HUD has specific guidance under 2 CFR 200.",
      notes: "CDBG has 15% cap on public services. Section 3 requirements apply to construction/rehab projects over $200K — must document local hiring. Davis-Bacon prevailing wages required for construction.",
    },
    evaluationSignals: {
      whatTheyScore: ["Need for the project (LMI data, housing market analysis)", "Capacity of applicant", "Implementation approach", "Leveraged resources", "Evaluation plan"],
      commonDisqualifiers: ["Missing HUD-2880 form", "Section 3 plan absent for construction", "National Objective documentation insufficient"],
      winFactors: ["Section 3 employment plan with local hiring commitments", "Housing First model for homeless programs", "Consolidated Plan alignment (cite the entitlement jurisdiction's plan)", "Davis-Bacon compliance plan"],
    },
    ragEntries: [
      {
        title: "HUD Grant Writing: LMI National Objective and Section 3",
        content: "HUD's CDBG and HOME programs require that funded activities meet one of three National Objectives: (1) Benefit to Low-to-Moderate Income (LMI) persons — the most common; activities must document that at least 51% of beneficiaries are LMI; (2) Aid in the Prevention or Elimination of Slums and Blight; (3) Meet an Urgent Community Development Need (rare). For LMI benefit, cite census tract LMI data from HUD's CPD Maps (cpd.hud.gov) and the grantee jurisdiction's Consolidated Plan. Section 3 of the HUD Act requires that economic opportunities arising from HUD-funded projects (construction over $200K) go first to low-income persons in the project area. A Section 3 compliance plan with specific hiring targets is required in any proposal involving construction, renovation, or infrastructure.",
        keywords: ["hud", "cdbg", "lmi", "national objective", "section 3", "low-to-moderate income", "consolidated plan", "davis-bacon", "construction"],
      },
    ],
  },

  // ─── 8. EDA / CEDS ───────────────────────────────────────────────────────────
  {
    agencyId: "eda",
    name: "Economic Development Administration",
    abbreviation: "EDA",
    parentDepartment: "DOC",
    resourcesUrl: "https://www.eda.gov/funding",
    howToApplyUrl: "https://www.eda.gov/funding/programs",
    cfdaPrefix: "11.3",
    programOffices: [
      { id: "ceds", name: "Comprehensive Economic Development Strategy (CEDS)", focus: "Regional economic planning, community resilience, strategic alignment", cfdaPrefix: "11.302", typicalAward: "$100K–$300K for planning; $500K–$3M for implementation" },
      { id: "public_works", name: "Public Works Program", focus: "Infrastructure (water, sewer, broadband, industrial park)", cfdaPrefix: "11.300", typicalAward: "$500K–$10M" },
      { id: "edd", name: "Economic Development District (EDD) Support", focus: "District staffing, CEDS updates, regional coordination", cfdaPrefix: "11.302", typicalAward: "$200K–$500K" },
      { id: "bbba", name: "Build Back Better Regional Challenge (BBRC)", focus: "Industry cluster development, community resilience, coal/auto transition communities", cfdaPrefix: "11.307", typicalAward: "$25M–$65M" },
      { id: "good_jobs", name: "Good Jobs Challenge", focus: "Workforce development aligned to industry demand in distressed communities", cfdaPrefix: "11.307", typicalAward: "$25M–$50M" },
    ],
    requiredForms: [
      { name: "SF-424 Application for Federal Assistance", description: "Standard federal cover form", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "SF-424A Budget (Non-Construction) or SF-424C (Construction)", description: "Budget by object class — use SF-424C for Public Works", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "CEDS Document", description: "For planning and implementation: must reference or include the region's current CEDS document; must address all 5 EDA performance measures (PM1–PM5)", url: "https://www.eda.gov/funding/programs/ceds", required: true },
      { name: "Project Narrative", description: "Economic justification, CEDS alignment, technical approach, performance targets", url: "https://www.eda.gov/funding/programs", required: true },
      { name: "Economic Impact Analysis", description: "Jobs created/retained with methodology", url: "https://www.eda.gov/funding/programs", required: true },
      { name: "Matching Funds Documentation", description: "EDA requires non-federal match — must document source, availability, commitment", url: "https://www.eda.gov/funding/programs", required: true },
    ],
    performanceSystem: {
      name: "EDA Performance Reporting: 5 Universal Performance Measures (PM1–PM5)",
      description: "All EDA grantees report against the five universal performance measures: PM1 (Jobs Created), PM2 (Jobs Retained), PM3 (Private Investment Leveraged), PM4 (Construction/Infrastructure Jobs), PM5 (Businesses Assisted). Reports submitted semi-annually through EDA's grants management system. EDA also tracks CEDS progress through District Office monitoring.",
      reportingFrequency: "Semi-annual performance reports + Final closeout report",
      portalUrl: "https://grants.eda.gov",
      keyMetrics: ["Jobs created (FTE)", "Jobs retained", "Private investment leveraged ($)", "Construction jobs", "Businesses assisted"],
    },
    languageDictionary: [
      "comprehensive economic development strategy (CEDS)", "economic development district (EDD)",
      "distressed community", "economically distressed area", "per capita income (PCI)",
      "unemployment rate", "industry cluster", "supply chain", "workforce pipeline",
      "private investment leveraged", "jobs created", "jobs retained",
      "resilience", "economic diversification", "traded sector",
      "innovation ecosystem", "entrepreneur", "technology commercialization",
      "broadband access", "digital equity", "infrastructure investment",
      "SWOT analysis", "regional economic analysis (REA)", "target industry",
      "coal / auto / steel transition communities", "qualified opportunity zone",
    ],
    evidenceRequirements: {
      tier: "EDA does not use a formal evidence tier system — focus is on economic impact evidence",
      description: "EDA proposals require economic analysis demonstrating job creation and private investment leverage. Acceptable methodologies: IMPLAN, RIMS II, or similar input-output economic modeling. CEDS documents must include a SWOT analysis of the regional economy. Community Economic Development Organizations (CEDOs) should cite regional economic data from BLS QCEW, BEA CAINC, and Census ACS.",
      examples: ["IMPLAN economic impact model", "Regional economic analysis (REA)", "Industry cluster analysis", "SWOT analysis with quantified data"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Personnel", "Fringe", "Travel", "Equipment", "Supplies", "Contractual", "Construction", "Other", "Indirect"],
      matchRequired: "EDA requires minimum 20% non-federal match for most programs. Public Works: 50% match in non-distressed areas, 20% in distressed. BBRC and Good Jobs: up to 80% federal share. Match must be documented and committed.",
      indirectCostRule: "NICRA or 10% de minimis. Construction grants: indirect not applied to construction costs.",
      notes: "EDA uses a unique Eligible Area determination — projects must be in or primarily serve an area meeting EDA's economic distress criteria (20%+ poverty or 6%+ unemployment or per capita income ≤80% of U.S. average). Document this eligibility explicitly.",
    },
    evaluationSignals: {
      whatTheyScore: [
        "Economic distress criteria met (eligible area documentation)",
        "CEDS alignment: address PM1–PM5, cite regional CEDS document",
        "Multiplier effect: private investment leverage ratio",
        "Job quality: wages, benefits, advancement for distressed populations",
        "Regional collaboration: involvement of local governments, EDDs, private sector",
        "Technical and financial capacity of applicant",
      ],
      commonDisqualifiers: ["Eligible area not documented", "CEDS document absent or not referenced", "Match not committed in writing", "PM1–PM5 targets missing"],
      winFactors: ["High private investment leverage ratio (5:1 or higher)", "Explicitly named industry cluster with market analysis", "Partnership with Economic Development District (EDD)", "Jobs targeted to low-income or underrepresented workers"],
    },
    ragEntries: [
      {
        title: "EDA/CEDS Grant Writing: Five Performance Measures Frame Every Proposal",
        content: "EDA's five universal performance measures (PM1–PM5) must appear in every EDA grant proposal. PM1: Jobs Created (FTE jobs, permanent, not temporary). PM2: Jobs Retained (jobs that would have been lost without EDA investment, with documentation). PM3: Private Investment Leveraged (committed private dollars at time of application, with letters of commitment). PM4: Construction/Infrastructure Jobs (temporary construction employment during project). PM5: Businesses Assisted (received direct capital, technical assistance, or training). EDA reviewers look for specific, defensible numbers tied to an economic methodology. IMPLAN or RIMS II input-output analysis should underlie PM1 and PM3 estimates. The ThriveUp/RPLICE CEDS alignment engine (GET /api/ceds/align) maps any program description to these PM categories automatically. For communities: workforce development programs address PM1 (new jobs through training), PM5 (businesses in the sector served), and PM3 (private employer investment in hiring). Cite the region's current CEDS document and its strategic goals by name.",
        keywords: ["eda", "ceds", "pm1", "pm2", "pm3", "pm4", "pm5", "jobs created", "private investment", "economic development", "comprehensive economic development strategy"],
      },
      {
        title: "CEDS for Communities: Mapping Community Needs to Economic Development Language",
        content: "Communities applying to EDA or writing proposals that touch economic development must speak EDA's language, not just human services language. A workforce development program for justice-involved youth is not just 'reentry services' in EDA terms — it is: PM1 (creating jobs by building a qualified workforce pipeline for regional industry clusters), PM5 (assisting businesses by reducing employers' hiring and training costs), and a CEDS strategic goal under 'Workforce and Human Capital.' A small business incubator in a low-income community is: PM3 (leveraging private investment through entrepreneur capital formation), PM5 (businesses assisted), and a CEDS goal under 'Innovation and Entrepreneurship.' For broadband, digital equity, or infrastructure projects: PM4 (construction jobs) + PM3 (private ISP investment leveraged). Every community-serving program should be able to translate its work into PM language for EDA alignment. This is not just about writing EDA grants — it makes the program fundable by EDA AND by other funders who use economic development as a frame (DOL Good Jobs Challenge, Treasury CDFI, SBA).",
        keywords: ["ceds", "eda", "communities", "workforce", "economic development", "pm1", "pm3", "pm5", "reentry", "small business", "broadband", "digital equity"],
      },
    ],
  },

  // ─── 9. VA ────────────────────────────────────────────────────────────────────
  {
    agencyId: "va",
    name: "Department of Veterans Affairs — Veterans Health Administration",
    abbreviation: "VA/VHA",
    parentDepartment: "VA",
    resourcesUrl: "https://www.va.gov/health/grants",
    howToApplyUrl: "https://www.va.gov/health/grants",
    cfdaPrefix: "64",
    programOffices: [
      { id: "ssg_fox", name: "SSG Fox Suicide Prevention Grants (SFPG)", focus: "Community-based suicide prevention for veterans, service members, families", cfdaPrefix: "64.042", typicalAward: "$400K–$750K/yr" },
      { id: "gpo_hud_vash", name: "HUD-VASH", focus: "Housing vouchers + case management for homeless veterans", cfdaPrefix: "64.026", typicalAward: "Formula" },
      { id: "vcc", name: "Veterans Community Care Grants", focus: "Community care network support, telehealth", cfdaPrefix: "64.007", typicalAward: "Varies" },
    ],
    requiredForms: [
      { name: "SF-424 Application for Federal Assistance", description: "Standard federal cover form", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "SF-424A Budget Information", description: "Budget by object class", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "Project Narrative", description: "Section-specific per NOFO; SSG Fox: Statement of Need, Approach, Organizational Experience, Staff, Evaluation", url: "https://www.va.gov/health/grants", required: true },
      { name: "Letters of Support from VA Medical Center (VAMC)", description: "SSG Fox: partnership letter from local VAMC strongly preferred", url: "https://www.va.gov/health/grants", required: false, whenRequired: "SSG Fox — preferred, increases score" },
    ],
    performanceSystem: {
      name: "VA Grants Management System — Semi-Annual Progress Reports",
      description: "VA grantees submit semi-annual and final reports through VA's grants management system. SSG Fox: primary metrics include veterans served, crisis interventions, lethal means counseling sessions, peer support contacts, MISSION Act referrals, and suicide attempt/death tracking (where measurable).",
      reportingFrequency: "Semi-annual progress reports + Annual report + Final report",
      portalUrl: "https://www.va.gov/health/grants",
      keyMetrics: ["Veterans reached/served", "Crisis line contacts", "Lethal means counseling", "Peer support sessions", "Referrals to VA care", "Suicide attempts (where tracked)"],
    },
    languageDictionary: [
      "veteran-centered care", "peer support specialist", "lethal means counseling",
      "crisis intervention", "MISSION Act", "Veterans Crisis Line",
      "suicide prevention", "means restriction", "social isolation",
      "military culture competency", "transition support", "community-based outreach",
      "VA-community partnership", "VAMC", "Military Sexual Trauma (MST)",
      "TBI", "PTSD", "moral injury", "warrior transition",
      "Whole Health model (VA)", "evidence-based psychotherapy",
    ],
    evidenceRequirements: {
      tier: "VA prefers evidence-based suicide prevention interventions — VA/DoD Clinical Practice Guidelines",
      description: "SSG Fox requires evidence-based approaches. VA/DoD Clinical Practice Guidelines for suicide prevention are the reference standard. Lethal means counseling must follow validated protocols (e.g., CALM — Counseling on Access to Lethal Means). Peer support must use VA-trained peer specialists or equivalent certification.",
      examples: ["CALM lethal means counseling", "Safety Planning Intervention (SPI)", "Collaborative Assessment and Management of Suicidality (CAMS)", "Crisis Response Planning"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Personnel", "Fringe", "Travel", "Equipment", "Supplies", "Contractual", "Other", "Indirect"],
      matchRequired: "SSG Fox: no match required. Leverage and in-kind are valued.",
      indirectCostRule: "NICRA or 10% de minimis.",
      notes: "SSG Fox funds community-based organizations, not VA medical centers directly. Applicant must serve a geographic area with a demonstrable veteran population. VetMissionTransition.com platform on vetmissiontransition.com is TCAF's SSG Fox-aligned surface.",
    },
    evaluationSignals: {
      whatTheyScore: [
        "Statement of Need: local veteran suicide data, isolation indicators, VA service gaps",
        "Approach: evidence-based intervention, lethal means counseling plan",
        "Organizational Experience: prior work with veterans, military cultural competency",
        "Staff: credentials, peer support certification, veteran staff",
        "Evaluation: data collection plan, metrics alignment to national suicide prevention goals",
      ],
      commonDisqualifiers: ["No evidence of existing veteran relationships in the community", "Missing lethal means counseling component", "No VA partner mentioned"],
      winFactors: ["VAMC partnership letter", "Veteran-run or veteran-led organization", "Lethal means counseling protocol named (CALM)", "Connection to 988 Veterans Crisis Line pathway"],
    },
    ragEntries: [
      {
        title: "VA SSG Fox: Lethal Means Counseling and Military Culture Competency",
        content: "The SSG Fox Suicide Prevention Grants Program funds community organizations to reach veterans who are not accessing VA care. The two highest-scored elements in SSG Fox applications are: (1) Lethal means counseling — must name a specific protocol (CALM — Counseling on Access to Lethal Means is the VA standard) and describe how staff are trained; reviewers look for means restriction as a structural component, not just an add-on; (2) Military cultural competency — staff must demonstrate understanding of military culture, transition challenges, moral injury, and the reluctance of veterans to seek mental health care. Organizations with veteran peer support specialists score higher. The VetMissionTransition.com platform addresses non-combat life events driving veteran suicide and includes Reach a Vet, validated screenings (PCL-5, C-SSRS), and 20,670+ resources — this infrastructure directly maps to SSG Fox's required community-based outreach and safety planning components.",
        keywords: ["va", "ssg fox", "suicide prevention", "lethal means", "calm", "peer support", "veteran", "military culture", "988", "vetmissiontransition"],
      },
    ],
  },

  // ─── 10. DOJ/OVW ─────────────────────────────────────────────────────────────
  {
    agencyId: "doj_ovw",
    name: "Office on Violence Against Women",
    abbreviation: "OVW",
    parentDepartment: "DOJ",
    resourcesUrl: "https://www.justice.gov/ovw/grant-programs",
    howToApplyUrl: "https://www.justice.gov/ovw/applying-grants",
    cfdaPrefix: "16.5",
    programOffices: [
      { id: "stop", name: "STOP Formula Grant Program", focus: "Law enforcement, prosecution, victim services response to DV/SA", cfdaPrefix: "16.588", typicalAward: "Formula via state" },
      { id: "sasp", name: "Sexual Assault Services Program (SASP)", focus: "Direct services to sexual assault survivors", cfdaPrefix: "16.017", typicalAward: "Formula via state" },
      { id: "rural", name: "Rural Sexual Assault, DV, Dating Violence, Stalking Program", focus: "Rural and tribal areas", cfdaPrefix: "16.589", typicalAward: "$300K–$600K" },
      { id: "transitional_housing", name: "Transitional Housing Assistance Grant Program", focus: "Housing support for DV/SA survivors leaving shelter", cfdaPrefix: "16.736", typicalAward: "$300K–$500K" },
    ],
    requiredForms: [
      { name: "SF-424 Application for Federal Assistance", description: "Standard federal cover form", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "SF-424A Budget Information", description: "Budget by object class", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "Project Narrative", description: "Addresses all OVW required fields: project abstract, project description, evaluation, timeline", url: "https://www.justice.gov/ovw/applying-grants", required: true },
      { name: "Certification of Compliance with OVW Requirements", description: "Non-exclusion of domestic violence/sexual assault victims from housing programs", url: "https://www.justice.gov/ovw/applying-grants", required: true },
    ],
    performanceSystem: {
      name: "OVW Grant Management System (GMS) — Semi-Annual Progress Reports",
      description: "OVW grantees report through DOJ's Grants Management System (GMS). Reports include: number of victims served, services provided, training and technical assistance, policy changes, and system change activities.",
      reportingFrequency: "Semi-annual progress reports",
      portalUrl: "https://grants.ojp.usdoj.gov",
      keyMetrics: ["Victims served", "Services provided by type", "Training hours", "Policy changes implemented", "System changes documented"],
    },
    languageDictionary: [
      "domestic violence", "sexual assault", "dating violence", "stalking",
      "survivor-centered", "trauma-informed", "confidentiality", "safety planning",
      "lethality assessment", "protective order", "civil legal assistance",
      "culturally specific services", "underserved populations", "LGBTQ+ survivors",
      "immigrant and refugee victims", "elder abuse", "technology-facilitated abuse",
      "coordinated community response (CCR)", "multidisciplinary team (MDT)",
    ],
    evidenceRequirements: {
      tier: "OVW-funded programs use survivor-centered, trauma-informed evidence base",
      description: "OVW does not use a formal evidence tier registry. Evidence base is: survivor-centered, trauma-informed, culturally responsive approaches. Lethality Assessment Program (LAP) and Danger Assessment (DA) are referenced tools. Coordinated Community Response (CCR) model is the overarching framework.",
      examples: ["Lethality Assessment Program (LAP)", "Danger Assessment (Campbell)", "Trauma-Focused CBT", "Culturally Specific Services models"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Personnel", "Fringe", "Travel", "Equipment", "Supplies", "Contractual", "Other", "Indirect"],
      matchRequired: "STOP Formula: states must pass through 25% match to subgrantees. Rural and Transitional Housing programs: no match. Verify per program.",
      indirectCostRule: "NICRA or 10% de minimis.",
      notes: "OVW has specific confidentiality requirements — victim information may not be disclosed without informed consent. Programs must comply with VAWA confidentiality provisions.",
    },
    evaluationSignals: {
      whatTheyScore: ["Statement of need", "Project design", "Organizational experience", "Staff qualifications", "Evaluation plan"],
      commonDisqualifiers: ["Missing confidentiality certification", "No evidence of survivor input in program design", "No coordinated community response partnership"],
      winFactors: ["Survivor advisory panel in program governance", "CCR partnership with law enforcement and prosecution", "Culturally specific services for underserved populations", "Lethality Assessment Protocol named"],
    },
    ragEntries: [
      {
        title: "OVW Grant Writing: Survivor-Centered, Trauma-Informed, Culturally Responsive",
        content: "OVW's foundational principles — every proposal must reflect all three: Survivor-centered (the survivor's safety, autonomy, and expressed needs drive all decisions; programs do not require survivors to take specific actions to receive services), Trauma-informed (services recognize the neurobiological impacts of trauma, avoid re-traumatization, emphasize safety and control), and Culturally responsive (services are adapted to the specific cultural, linguistic, and contextual needs of the population served, not just translated). The Coordinated Community Response (CCR) model — bringing together law enforcement, prosecution, victim services, and community organizations — is the gold standard OVW framework. Applications should name existing CCR partnerships and describe the applicant's role in the local MDT (Multidisciplinary Team). VAWA confidentiality provisions are mandatory — describe how the organization protects victim information and does not share without explicit consent.",
        keywords: ["ovw", "domestic violence", "sexual assault", "survivor-centered", "trauma-informed", "coordinated community response", "vawa", "confidentiality", "culturally responsive"],
      },
    ],
  },

  // ─── 11. AmeriCorps ───────────────────────────────────────────────────────────
  {
    agencyId: "americorps",
    name: "AmeriCorps (Corporation for National and Community Service)",
    abbreviation: "AmeriCorps",
    parentDepartment: "Independent",
    resourcesUrl: "https://americorps.gov/partner/how-to-apply",
    howToApplyUrl: "https://americorps.gov/partner/how-to-apply",
    cfdaPrefix: "94",
    programOffices: [
      { id: "state_national", name: "AmeriCorps State and National", focus: "National service programs, education, human needs, environment, veterans, disaster", cfdaPrefix: "94.006", typicalAward: "$100K–$2M" },
      { id: "vista", name: "AmeriCorps VISTA", focus: "Poverty reduction, capacity building in low-income communities", cfdaPrefix: "94.013", typicalAward: "Member slots (no direct funding)" },
      { id: "seniors", name: "AmeriCorps Seniors (RSVP, Foster Grandparents)", focus: "Senior volunteers in community service", cfdaPrefix: "94.002", typicalAward: "$50K–$500K" },
      { id: "sif", name: "Social Innovation Fund (SIF) — Classic", focus: "Scaling evidence-based community solutions", cfdaPrefix: "94.019", typicalAward: "Varies" },
    ],
    requiredForms: [
      { name: "eGrants Application (AmeriCorps-specific portal)", description: "AmeriCorps State and National applications are submitted through eGrants.gov — NOT Grants.gov", url: "https://egrants.cns.gov", required: true },
      { name: "Program Design Narrative", description: "Community need, program design, member activities, performance measures", url: "https://americorps.gov/partner/how-to-apply", required: true },
      { name: "Budget (eGrants format)", description: "AmeriCorps-specific budget with member cost, program cost, and administrative cost categories", url: "https://americorps.gov/partner/how-to-apply", required: true },
      { name: "Member Service Activities and Training Plan", description: "Detailed description of member tasks, supervision, training hours", url: "https://americorps.gov/partner/how-to-apply", required: true },
    ],
    performanceSystem: {
      name: "AmeriCorps Performance Measurement Framework — eGrants Reporting",
      description: "AmeriCorps grantees report performance measures through eGrants. AmeriCorps uses national performance measures (NPMs) for core focus areas — Education, Economic Opportunity, Healthy Futures, Veterans/Military Families, Disaster Services, Environmental Stewardship, and Capacity Building. Grantees select relevant NPMs and report against them quarterly and at program end.",
      reportingFrequency: "Quarterly member enrollment reports + Semi-annual performance + Annual report",
      portalUrl: "https://egrants.cns.gov",
      keyMetrics: ["Members enrolled/completing service", "National Performance Measures met", "Community beneficiaries served", "Member education awards issued", "Retention rate"],
    },
    languageDictionary: [
      "member", "service year", "education award (Segal AmeriCorps Education Award)",
      "national performance measure (NPM)", "MSY (Member Service Year)",
      "cost per MSY", "living allowance", "term of service",
      "poverty alleviation", "capacity building", "national service",
      "focus area", "CNCS (now AmeriCorps)", "community need",
      "leveraged resources", "host site", "subgrantee",
      "evidence-based program", "scaling", "social innovation",
    ],
    evidenceRequirements: {
      tier: "AmeriCorps uses evidence standards from What Works Clearinghouse + Social Innovation Fund tiers",
      description: "AmeriCorps State and National programs must use evidence-based or evidence-informed interventions for the National Performance Measure outcomes they target. SIF Classic uses three tiers: Strong (randomized controlled trials), Moderate (quasi-experimental), or Preliminary (pre-post studies with comparison group).",
      examples: ["Afterschool programs with WWC evidence", "Workforce readiness with MDRC evidence", "Community health with Cochrane-level evidence for SIF"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Member Support Costs (living allowance, health insurance, childcare, workers comp, FICA)", "Program Operating Costs (staff, space, training)", "Administrative Costs (max 5% of total)"],
      matchRequired: "AmeriCorps State and National requires 24% non-federal match for established grantees (first-year applicants may qualify for reduced match). Match can be cash or in-kind.",
      indirectCostRule: "Administrative costs capped at 5% of total grant. Indirect costs apply within administrative cap.",
      notes: "AmeriCorps applications go through eGrants.gov, NOT Grants.gov. This is the #1 missed step. Budget is organized around member cost vs. program operating vs. admin — not standard federal object classes.",
    },
    evaluationSignals: {
      whatTheyScore: ["Alignment to focus area and community need", "Member activities and training plan", "Performance measure targets", "Organizational capacity", "Cost effectiveness (cost per MSY)"],
      commonDisqualifiers: ["Application submitted through Grants.gov instead of eGrants.gov", "Administrative costs exceed 5%", "National Performance Measures not selected or targeted incorrectly"],
      winFactors: ["Evidence-based program model named", "Strong organizational track record in focus area", "Cost per MSY competitive with similar programs", "Partner sites identified with commitment letters"],
    },
    ragEntries: [
      {
        title: "AmeriCorps: eGrants Portal and National Performance Measures",
        content: "AmeriCorps State and National applications are submitted through eGrants.gov (egrants.cns.gov), NOT Grants.gov. This is one of the most common application errors. AmeriCorps uses National Performance Measures (NPMs) — standardized outcome metrics for each focus area. For Education focus: NPMs include grade-level reading by 3rd grade, school completion, and educational engagement. For Economic Opportunity: job placement, financial stability. For Healthy Futures: food security, healthcare access, healthy behaviors. For Veterans/Military Families: transition support, mental health referrals. Programs must select the NPMs relevant to their work and report targets at the start of the grant year. AmeriCorps reviewers look for NPM targets that are ambitious but achievable given the number of members and scope. Member Service Year (MSY) is the unit of account — a full-time member serving 1700 hours = 1.0 MSY. Cost per MSY is a key efficiency metric reviewed against national averages ($13,000–$17,000 is typical for full-time members).",
        keywords: ["americorps", "egrants", "national performance measures", "npm", "msy", "member service year", "cost per msy", "egrants.gov", "service year"],
      },
    ],
  },

  // ─── 12. EPA Environmental Justice ───────────────────────────────────────────
  {
    agencyId: "epa",
    name: "Environmental Protection Agency — Environmental Justice Programs",
    abbreviation: "EPA",
    parentDepartment: "EPA",
    resourcesUrl: "https://www.epa.gov/environmentaljustice/environmental-justice-grants",
    howToApplyUrl: "https://www.epa.gov/grants/applying-epa-grants",
    cfdaPrefix: "66",
    programOffices: [
      { id: "ejcps", name: "EJ Collaborative Problem-Solving (EJCPS) Grant", focus: "Community-led solutions to local EJ issues", cfdaPrefix: "66.309", typicalAward: "$1M over 3 years" },
      { id: "ej_iwg", name: "EJ Thriving Communities Grantmaking Program (TCGM)", focus: "Subgrants to underserved communities via Regional EJ Hubs", cfdaPrefix: "66.615", typicalAward: "$100K–$500K (subgrants)" },
      { id: "brownfields", name: "Brownfields Assessment and Cleanup", focus: "Contaminated site assessment/cleanup in underserved communities", cfdaPrefix: "66.818", typicalAward: "$500K–$1.5M" },
    ],
    requiredForms: [
      { name: "SF-424 Application for Federal Assistance", description: "Standard federal cover form", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "SF-424A Budget Information", description: "Budget by object class", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "Quality Assurance Project Plan (QAPP)", description: "For any environmental sampling or data collection", url: "https://www.epa.gov/quality/quality-assurance-project-plans", required: false, whenRequired: "Any project involving environmental measurement or data collection" },
      { name: "Project Narrative", description: "Community description, environmental condition, solution approach, partnerships", url: "https://www.epa.gov/environmentaljustice", required: true },
    ],
    performanceSystem: {
      name: "EPA Grants Management System — Semi-Annual Progress Reports",
      description: "EPA grantees report through Grants.gov and EPA's reporting portal. EJ grantees report: environmental conditions addressed, community members engaged, policy changes achieved, cleanup actions completed.",
      reportingFrequency: "Semi-annual progress reports",
      portalUrl: "https://www.epa.gov/grants",
      keyMetrics: ["Community members engaged", "Environmental conditions addressed", "Policy changes", "Cleanup acres", "Air/water quality improvements"],
    },
    languageDictionary: [
      "environmental justice", "disproportionate burden", "cumulative impact",
      "overburdened community", "underserved community", "fence-line community",
      "EJSCREEN", "air quality", "water quality", "lead exposure",
      "toxic release", "brownfield", "remediation", "cleanup",
      "community-led", "meaningful involvement", "fair treatment",
      "Inflation Reduction Act (IRA)", "Justice40 initiative",
      "climate resilience", "clean energy transition",
    ],
    evidenceRequirements: {
      tier: "EPA EJ uses community-based participatory research principles",
      description: "EPA EJ grants prioritize community engagement and participatory approaches. Evidence base includes EPA's National Environmental Justice Advisory Council (NEJAC) recommendations and community-based participatory research (CBPR) principles. Environmental data must meet EPA quality assurance standards (QAPP).",
      examples: ["Community-based participatory research (CBPR)", "EJSCREEN analysis", "Cumulative impact analysis", "Community health assessment"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Personnel", "Fringe", "Travel", "Equipment", "Supplies", "Contractual", "Other", "Indirect"],
      matchRequired: "EJCPS: no match required. Brownfields: no match required. Verify per solicitation.",
      indirectCostRule: "NICRA or 10% de minimis. EPA applies under 2 CFR 200.",
      notes: "Justice40 initiative requires that 40% of benefits flow to disadvantaged communities — must address this in narrative.",
    },
    evaluationSignals: {
      whatTheyScore: ["Community identification and involvement", "Environmental condition addressed", "Solution approach", "Partnership and collaboration", "Outcomes and evaluation"],
      commonDisqualifiers: ["No evidence of community leadership in project design", "EJSCREEN data not used for need documentation", "QAPP missing when environmental sampling included"],
      winFactors: ["EJSCREEN cumulative burden percentile >80 for target area", "Community-based organization (CBO) as lead applicant", "Named environmental conditions with measurement plan", "Justice40 alignment explicitly stated"],
    },
    ragEntries: [
      {
        title: "EPA Environmental Justice: EJSCREEN and Justice40 Alignment",
        content: "EPA's environmental justice grants require that the target community meet EJ criteria — EJSCREEN (epa.gov/ejscreen) is the primary tool. Run an EJSCREEN report for the target census tracts and cite the percentile rankings for: particulate matter, ozone, diesel PM, air toxics cancer risk, drinking water non-compliance, wastewater discharge, proximity to RMP sites, proximity to Superfund sites, proximity to hazardous waste facilities, and the EJ Index composite score. Communities with EJSCREEN EJ Index scores at or above the 80th percentile nationally are considered overburdened. The Justice40 Initiative (IRA-funded) requires 40% of clean energy/climate benefits to flow to disadvantaged communities — cite Justice40 alignment explicitly in any EPA proposal. RPLICE's SDOH Location Intelligence integrates CDC PLACES and EPA data by census tract — use this to build the EJSCREEN comparison narrative.",
        keywords: ["epa", "environmental justice", "ejscreen", "justice40", "cumulative impact", "overburdened community", "census tract", "ira", "inflation reduction act"],
      },
    ],
  },

  // ─── 13. USDA/FNS ────────────────────────────────────────────────────────────
  {
    agencyId: "usda_fns",
    name: "USDA Food and Nutrition Service",
    abbreviation: "USDA/FNS",
    parentDepartment: "USDA",
    resourcesUrl: "https://www.fns.usda.gov/grants",
    howToApplyUrl: "https://www.fns.usda.gov/grants",
    cfdaPrefix: "10.5",
    programOffices: [
      { id: "snap_ed", name: "SNAP-Ed (Supplemental Nutrition Assistance Program Education)", focus: "Nutrition education, food insecurity, community outreach", cfdaPrefix: "10.561", typicalAward: "State-administered; subgrants $50K–$500K" },
      { id: "cacfp", name: "Child and Adult Care Food Program (CACFP)", focus: "Nutrition in child care, adult day care, after-school programs", cfdaPrefix: "10.558", typicalAward: "Reimbursement" },
      { id: "sfsp", name: "Summer Food Service Program (SFSP)", focus: "Free meals for children in low-income areas during summer", cfdaPrefix: "10.559", typicalAward: "Reimbursement" },
      { id: "gussd", name: "Gus Schumacher Nutrition Incentive Program (GusNIP)", focus: "Incentives for SNAP participants to purchase fruits/vegetables", cfdaPrefix: "10.331", typicalAward: "$100K–$1M" },
    ],
    requiredForms: [
      { name: "SF-424 Application for Federal Assistance", description: "Standard federal cover form", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "SNAP-Ed State Plan Alignment", description: "Must align with state SNAP-Ed implementing agency's plan", url: "https://www.fns.usda.gov/snap/snap-ed", required: true, whenRequired: "SNAP-Ed subgrantees" },
      { name: "Civil Rights Compliance Certification", description: "FNS requires civil rights compliance certification", url: "https://www.fns.usda.gov/cr", required: true },
    ],
    performanceSystem: {
      name: "FNS Reporting and Recordkeeping — State Agency Monitoring",
      description: "FNS grant reporting flows through state agencies for formula programs (SNAP-Ed, CACFP) and directly to FNS for competitive grants. SNAP-Ed: annual reports aligned to SNAP-Ed Evaluation Framework (reach, dosage, partnership, policy/systems/environment change). Nutrition incentive programs report redemption rates and health outcomes.",
      reportingFrequency: "Annual reports + Quarterly claims for reimbursement programs",
      portalUrl: "https://www.fns.usda.gov",
      keyMetrics: ["Participants reached", "Nutrition behaviors changed", "Policy/systems/environment (PSE) changes", "Food insecurity reduction", "SNAP redemptions (incentive programs)"],
    },
    languageDictionary: [
      "food security", "food insecurity", "SNAP", "nutrition education",
      "policy, systems, and environment (PSE) change", "food access",
      "food desert", "food swamp", "healthy eating", "meal pattern",
      "USDA dietary guidelines", "MyPlate", "EBT", "electronic benefits transfer",
      "WIC", "CACFP", "summer meals", "afterschool meals",
      "community eligibility provision (CEP)", "free and reduced-price meals",
      "GusNIP", "produce prescription", "nutrition incentive",
    ],
    evidenceRequirements: {
      tier: "SNAP-Ed Evaluation Framework + CDC Community Preventive Services Task Force",
      description: "SNAP-Ed programs must align with the SNAP-Ed Evaluation Framework and use evidence-based strategies from the CDC Community Preventive Services Task Force or the SNAP-Ed Toolkit. Nutrition incentive programs require evaluation designs that track redemption, dietary change, and health outcomes.",
      examples: ["SNAP-Ed Toolkit interventions", "Cooking Matters", "Supplemental Nutrition Program nutrition education curricula", "Produce Prescription programs"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Personnel", "Fringe", "Travel", "Supplies", "Contractual", "Other", "Indirect"],
      matchRequired: "GusNIP requires 50% match (non-federal). SNAP-Ed: no match at subgrantee level. Verify per program.",
      indirectCostRule: "NICRA or 10% de minimis under 2 CFR 200.",
      notes: "SNAP-Ed funds may only be used for allowable activities per FNS SNAP-Ed guidance. Cooking classes and PSE strategies both allowable; incentives (food) generally not allowed with SNAP-Ed funds.",
    },
    evaluationSignals: {
      whatTheyScore: ["Reach and dosage in low-income communities", "PSE change strategy", "Evidence-based curriculum", "Partnerships with other food access organizations", "Evaluation plan"],
      commonDisqualifiers: ["Activities not aligned to SNAP-Ed allowable uses", "No civil rights compliance certification", "Target population not primarily SNAP-eligible"],
      winFactors: ["PSE strategy in addition to direct education", "Partnership with food bank or SNAP-outreach organization", "SNAP-Ed Toolkit intervention named"],
    },
    ragEntries: [
      {
        title: "USDA/FNS SNAP-Ed: Policy Systems Environment Change is Required",
        content: "SNAP-Ed is moving beyond individual nutrition education to policy, systems, and environment (PSE) change strategies. Modern SNAP-Ed proposals are evaluated on whether they create lasting environmental change — not just whether they teach cooking classes. PSE strategies include: school meal policy improvements, community garden establishment, food pantry nutrition standards, grocery store placement changes, school vending policy, and worksite wellness programs. Every SNAP-Ed competitive proposal should include both direct education AND a PSE strategy component. Document how the PSE change will outlast the grant period (sustainability). Use SDOH data (food access scores, USDA food atlas data) to quantify the food environment of the target community. The USDA Food Environment Atlas is a free tool at ers.usda.gov/data-products/food-environment-atlas.",
        keywords: ["usda", "fns", "snap-ed", "policy systems environment", "pse", "food insecurity", "food access", "nutrition education", "food environment atlas"],
      },
    ],
  },

  // ─── 14. SBA ─────────────────────────────────────────────────────────────────
  {
    agencyId: "sba",
    name: "Small Business Administration",
    abbreviation: "SBA",
    parentDepartment: "Independent",
    resourcesUrl: "https://www.sba.gov/funding-programs/grants",
    howToApplyUrl: "https://www.sba.gov/funding-programs/grants",
    cfdaPrefix: "59",
    programOffices: [
      { id: "sbdc", name: "Small Business Development Centers (SBDC)", focus: "Technical assistance, business counseling, capital access", cfdaPrefix: "59.037", typicalAward: "Cooperative agreement; host institution" },
      { id: "wbc", name: "Women's Business Centers (WBC)", focus: "Entrepreneurship training for women, access to capital", cfdaPrefix: "59.043", typicalAward: "$150K–$250K" },
      { id: "sbir", name: "SBIR/STTR (Small Business Innovation Research)", focus: "R&D grants for small businesses — Phase I: $256K, Phase II: $1.7M", cfdaPrefix: "59.061", typicalAward: "$150K–$1.7M" },
      { id: "mbda", name: "Minority Business Development Agency (MBDA) Business Centers", focus: "Minority-owned business growth, capital access, government contracting", cfdaPrefix: "11.802", typicalAward: "$500K–$1M" },
    ],
    requiredForms: [
      { name: "SF-424 Application for Federal Assistance", description: "Standard federal cover form", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "SBIR/STTR Technical Volume", description: "Phase I: 6 pages; Phase II: 15 pages — structured per agency-specific solicitation", url: "https://www.sbir.gov/apply-for-funding", required: true, whenRequired: "SBIR/STTR only" },
      { name: "Commercialization Plan", description: "Phase II SBIR/STTR: detailed plan to commercialize R&D results", url: "https://www.sbir.gov", required: false, whenRequired: "Phase II SBIR only" },
    ],
    performanceSystem: {
      name: "SBA Reporting via Online Portal + SBIR.gov for SBIR/STTR",
      description: "SBA cooperative agreement grantees (SBDCs, WBCs) submit semi-annual performance reports. SBIR/STTR grantees use SBIR.gov for award tracking and outcome reporting. Key SBDC metrics: businesses counseled/trained, capital accessed, jobs created/retained.",
      reportingFrequency: "Semi-annual performance reports",
      portalUrl: "https://www.sba.gov/partners/sbdcs",
      keyMetrics: ["Businesses counseled/trained", "Capital accessed ($)", "Jobs created/retained", "Contracts won by clients", "Revenue increase", "New businesses started"],
    },
    languageDictionary: [
      "small business", "minority-owned business", "women-owned business",
      "veteran-owned business", "service-disabled veteran-owned (SDVO)",
      "HUBZone", "8(a) program", "small disadvantaged business (SDB)",
      "access to capital", "technical assistance", "business counseling",
      "government contracting", "NAICS code", "GSA schedule",
      "SBIR", "STTR", "commercialization", "technology transfer",
      "entrepreneurship", "startup", "scale-up",
    ],
    evidenceRequirements: {
      tier: "SBA does not use a formal evidence tier system for grants",
      description: "SBA SBDC and WBC grants are evaluated on organizational capacity and reach. SBIR/STTR uses scientific/technical peer review. MBDA Business Centers evaluated on client economic impact.",
      examples: ["SBDC national performance data", "America's SBDC network benchmarks", "Prior SBIR award commercialization data"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Personnel", "Fringe", "Travel", "Equipment", "Supplies", "Contractual", "Other", "Indirect"],
      matchRequired: "SBDC cooperative agreements: 50% non-federal match required (can include state funds). WBC: 50% non-federal match. SBIR: no match.",
      indirectCostRule: "NICRA or 10% de minimis.",
      notes: "SBA cooperative agreements are multi-year (typically 5 years) with annual renewals based on performance. SBIR Phase I: 6-month period of performance.",
    },
    evaluationSignals: {
      whatTheyScore: ["Organizational capability", "Service delivery plan", "Geographic coverage", "Outreach to underserved populations", "Cost effectiveness"],
      commonDisqualifiers: ["Missing 50% match commitment", "Insufficient coverage of underserved or minority entrepreneurs", "SBIR: technology not meeting program focus area"],
      winFactors: ["Named underserved populations (minorities, women, veterans, rural)", "Partnership with SBDC/WBC network", "Capital access partnerships with CDFIs or banks"],
    },
    ragEntries: [
      {
        title: "SBA Grant Writing: HUBZone, 8(a), and Small Business Set-Aside Language",
        content: "SBA programs use specific business certification terminology that must appear correctly in any SBA grant or contracting proposal. 8(a) Business Development Program: for socially and economically disadvantaged small businesses — 9-year program with developmental and transitional stages. HUBZone: Historically Underutilized Business Zone — business must be located in and primarily employ people in a designated HUBZone. SDVOSB: Service-Disabled Veteran-Owned Small Business — Dr. Flood's veteran status is relevant here. WOSB: Women-Owned Small Business. The 'socially disadvantaged' definition (8(a)) includes members of groups presumed to be socially disadvantaged: Black Americans, Hispanic Americans, Native Americans, Asian Pacific Americans, and Subcontinent Asian Americans. For MBDA Business Centers, the language centers on 'minority-owned business enterprises (MBEs)' and 'access to capital and markets for underrepresented entrepreneurs.'",
        keywords: ["sba", "8a", "hubzone", "sdvosb", "wosb", "small business", "minority business", "mbda", "access to capital", "government contracting"],
      },
    ],
  },

  // ─── 15. NEA ─────────────────────────────────────────────────────────────────
  {
    agencyId: "nea",
    name: "National Endowment for the Arts",
    abbreviation: "NEA",
    parentDepartment: "Independent",
    resourcesUrl: "https://www.arts.gov/grants",
    howToApplyUrl: "https://www.arts.gov/grants/apply",
    cfdaPrefix: "45.025",
    programOffices: [
      { id: "grants_for_arts", name: "Grants for Arts Projects (GAP)", focus: "Public engagement with diverse art forms, creative placemaking", cfdaPrefix: "45.025", typicalAward: "$10K–$100K" },
      { id: "our_town", name: "Our Town (Creative Placemaking)", focus: "Arts-based community development, place-based investment", cfdaPrefix: "45.025", typicalAward: "$25K–$150K" },
      { id: "research", name: "Research: Art Works", focus: "Research on the arts and culture's impact on communities", cfdaPrefix: "45.025", typicalAward: "$10K–$50K" },
    ],
    requiredForms: [
      { name: "NEA-specific application via Grants.gov or Applicant Portal", description: "NEA uses both Grants.gov (Phase 1) and its own portal", url: "https://www.arts.gov/grants/apply", required: true },
      { name: "Project Narrative", description: "Artistic excellence, artistic merit, public engagement, community benefit", url: "https://www.arts.gov/grants/apply", required: true },
      { name: "Work Samples", description: "Artistic work samples — specific format per grant program", url: "https://www.arts.gov/grants/apply", required: true },
      { name: "Budget", description: "Project budget — NEA max is typically 50% of project cost", url: "https://www.arts.gov/grants/apply", required: true },
    ],
    performanceSystem: {
      name: "NEA Grant Reporting via Arts.gov Portal",
      description: "NEA grantees submit final reports documenting artistic activities, public engagement, partnerships, and grant impact. Key metrics: performances/exhibitions, audiences reached, artists employed, community partners.",
      reportingFrequency: "Final report + any interim reports per award",
      portalUrl: "https://www.arts.gov/grants",
      keyMetrics: ["Performances/exhibitions", "Audiences reached", "Artists employed", "Community partners engaged", "Place-based outcomes for Our Town"],
    },
    languageDictionary: [
      "artistic excellence", "artistic merit", "public engagement",
      "creative placemaking", "arts and culture", "cultural equity",
      "diverse communities", "underserved communities", "rural arts",
      "indigenous arts", "community-based arts", "social practice",
      "artist residency", "arts education", "cultural heritage",
      "place-based", "livability", "economic vitality through arts",
    ],
    evidenceRequirements: {
      tier: "NEA uses peer panel review — artistic quality is primary criterion",
      description: "NEA grants are reviewed by peer panels of artists, arts administrators, and community members. Artistic excellence is required — evidence of artistic quality through work samples and track record. Our Town grants also require evidence of community engagement and partnership.",
      examples: ["Prior work samples demonstrating artistic quality", "Track record of community engagement", "Partnership letters from community organizations"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Personnel", "Fringe", "Travel", "Space", "Artist Fees", "Production Costs", "Other", "Indirect"],
      matchRequired: "NEA requires 1:1 match (NEA can cover up to 50% of project cost). Match can be cash or in-kind. Volunteer time valued at $28+/hr.",
      indirectCostRule: "NICRA or 10% de minimis. Arts organizations often have low or zero indirect.",
      notes: "NEA does not fund construction. Strong preference for projects that demonstrate community benefit, not just artistic presentation.",
    },
    evaluationSignals: {
      whatTheyScore: ["Artistic excellence of the work", "Potential to engage public audiences", "Community benefit and public good", "Organizational track record", "Budget feasibility"],
      commonDisqualifiers: ["No work samples", "Match not clearly documented", "No community engagement component"],
      winFactors: ["Strong work samples demonstrating artistic quality", "Named community partners with letters", "Cultural equity focus serving underserved communities", "Creative placemaking with economic development connection for Our Town"],
    },
    ragEntries: [
      {
        title: "NEA Grant Writing: Artistic Excellence + Public Engagement + Community Benefit",
        content: "NEA evaluates every application on three dimensions that must all be present: Artistic Excellence (the work must be of high artistic quality — demonstrated through work samples, artist track record, and production approach), Public Engagement (the work must be accessible to the public — describe how and where it will be presented, outreach strategy, anticipated audience), and Community Benefit (the work must create public good — describe the lasting impact on the community, cultural equity outcomes, and how the community was involved in shaping the project). Our Town (Creative Placemaking) grants additionally require evidence that arts and culture are integrated into a community development strategy — partnerships with non-arts organizations (housing, economic development, public health) strengthen the application significantly.",
        keywords: ["nea", "artistic excellence", "public engagement", "community benefit", "creative placemaking", "our town", "cultural equity", "arts"],
      },
    ],
  },

  // ─── 16. IMLS ────────────────────────────────────────────────────────────────
  {
    agencyId: "imls",
    name: "Institute of Museum and Library Services",
    abbreviation: "IMLS",
    parentDepartment: "Independent",
    resourcesUrl: "https://www.imls.gov/grants/apply-grant",
    howToApplyUrl: "https://www.imls.gov/grants/apply-grant",
    cfdaPrefix: "45.3",
    programOffices: [
      { id: "lg", name: "Library Services and Technology Act (LSTA) — Grants to States", focus: "Statewide library programs, digital inclusion, workforce development", cfdaPrefix: "45.310", typicalAward: "Formula via state" },
      { id: "na", name: "Museums for America / Museum Grants for African American History and Culture", focus: "Collections, community outreach, digital access, workforce", cfdaPrefix: "45.301", typicalAward: "$5K–$500K" },
      { id: "nia", name: "National Leadership Grants — Libraries/Museums", focus: "Research, innovation, collaboration for library/museum sector", cfdaPrefix: "45.312", typicalAward: "$250K–$1M" },
    ],
    requiredForms: [
      { name: "IMLS Application via Grants.gov or IMLS online portal", description: "Program-specific application package", url: "https://www.imls.gov/grants/apply-grant", required: true },
      { name: "Project Narrative", description: "Significance, approach, relevance to field, organizational capacity, evaluation", url: "https://www.imls.gov/grants/apply-grant", required: true },
      { name: "Schedule of Completion", description: "Milestones and timeline", url: "https://www.imls.gov/grants/apply-grant", required: true },
    ],
    performanceSystem: {
      name: "IMLS Performance Reporting — Interim and Final Reports via Grants.gov",
      description: "IMLS grantees submit interim and final reports. LSTA State grants report through state library administrative agencies. Direct grants report through IMLS portal. Key metrics: communities served, digital inclusion activities, collections digitized, partnerships.",
      reportingFrequency: "Interim reports + Final report",
      portalUrl: "https://www.imls.gov/grants/awarded-grants",
      keyMetrics: ["Community members served", "Collections digitized/accessible", "Digital inclusion participants", "Partner institutions", "Staff trained"],
    },
    languageDictionary: [
      "digital inclusion", "digital equity", "information literacy",
      "collections access", "digitization", "community engagement",
      "lifelong learning", "underserved communities", "rural libraries",
      "tribal libraries", "museum collections", "cultural heritage",
      "workforce development in libraries/museums", "LSTA", "e-rate",
    ],
    evidenceRequirements: {
      tier: "IMLS peer review — project significance and innovation",
      description: "IMLS grants are reviewed by peer panels. National Leadership Grants require demonstration of significance to the library or museum field. Museums for America requires evidence of community engagement and accessibility.",
      examples: ["Prior IMLS-funded research", "Field-wide evidence from library/museum associations", "Community needs assessment data"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Personnel", "Fringe", "Consultants", "Travel", "Supplies", "Equipment", "Other", "Indirect"],
      matchRequired: "Museums for America: no match required for smaller grants; larger awards may require match. National Leadership Grants: no match required. Verify per program.",
      indirectCostRule: "NICRA or 10% de minimis.",
      notes: "IMLS is an important but often overlooked funder for community organizations that partner with libraries or museums — especially for digital inclusion, workforce development, and cultural heritage programs.",
    },
    evaluationSignals: {
      whatTheyScore: ["Significance to the library/museum field", "Project approach", "Evaluation plan", "Organizational qualifications", "Impact"],
      commonDisqualifiers: ["No library or museum as lead or primary partner", "National Leadership: no clear contribution to knowledge in the field"],
      winFactors: ["Partnership with public library system (especially for digital inclusion)", "Community-centered approach serving underrepresented populations", "Scalable or replicable model with field-wide relevance"],
    },
    ragEntries: [
      {
        title: "IMLS Grant Writing: Digital Inclusion and Library Partnership",
        content: "IMLS is an underutilized funder for community organizations working on digital inclusion, workforce development, and community education. Key: the project must involve a library or museum as the lead or a primary partner. The Library Services and Technology Act (LSTA) funds digital equity programs through state library agencies — contact the Texas State Library and Archives Commission (TSLAC) for Texas-based LSTA subgrants. National Leadership Grants for Libraries fund innovation that advances the library field — proposals must demonstrate how the project will contribute knowledge or practice useful to libraries nationally. Digital inclusion language: 'digital literacy,' 'broadband access,' 'device access,' 'digital navigation,' 'technology training,' 'e-government services,' 'telehealth access.'",
        keywords: ["imls", "lsta", "digital inclusion", "digital equity", "library", "museum", "digital literacy", "tslac", "texas", "broadband"],
      },
    ],
  },

  // ─── 17. ORR ─────────────────────────────────────────────────────────────────
  {
    agencyId: "orr",
    name: "Office of Refugee Resettlement",
    abbreviation: "ORR",
    parentDepartment: "HHS/ACF",
    resourcesUrl: "https://www.acf.hhs.gov/orr/grant-funding",
    howToApplyUrl: "https://www.acf.hhs.gov/orr/grant-funding",
    cfdaPrefix: "93.566",
    programOffices: [
      { id: "matching_grants", name: "Matching Grants Program", focus: "Employment and self-sufficiency for newly arrived refugees", cfdaPrefix: "93.566", typicalAward: "$500K–$5M" },
      { id: "wilson_fish", name: "Wilson-Fish Alternative Program", focus: "Refugee resettlement alternative to state system", cfdaPrefix: "93.583", typicalAward: "Varies" },
      { id: "uac", name: "Unaccompanied Alien Children (UAC) Programs", focus: "Shelter, legal services, reunification for unaccompanied minors", cfdaPrefix: "93.676", typicalAward: "$1M–$10M+" },
      { id: "empower", name: "EMPOWER — Economic Mobility Programs", focus: "Economic self-sufficiency for refugees, asylees, Cuban/Haitian entrants", cfdaPrefix: "93.566", typicalAward: "$250K–$1M" },
    ],
    requiredForms: [
      { name: "SF-424 Application for Federal Assistance", description: "Standard federal cover form", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "SF-424A Budget Information", description: "Budget by object class", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "Program Narrative", description: "Section-by-section per ORR program requirements", url: "https://www.acf.hhs.gov/orr/grant-funding", required: true },
      { name: "Matching Funds Certification", description: "For Matching Grants — must show 1:1 cash or in-kind match", url: "https://www.acf.hhs.gov/orr/grant-funding", required: false, whenRequired: "Matching Grants Program only" },
    ],
    performanceSystem: {
      name: "ORR Performance Reporting System — Semi-Annual Reports",
      description: "ORR grantees report client-level data on employment outcomes, self-sufficiency, and family reunification. Matching Grants: 90-day employment placement rate is the primary metric. UAC: reunification with sponsor outcomes.",
      reportingFrequency: "Semi-annual performance reports",
      portalUrl: "https://www.acf.hhs.gov/orr",
      keyMetrics: ["Refugees/entrants served", "Employment at 90 days", "Employment at 180 days", "Self-sufficiency rate", "English language proficiency gains", "Family reunification (UAC)"],
    },
    languageDictionary: [
      "refugee", "asylee", "Special Immigrant Visa (SIV)", "Cuban/Haitian entrant",
      "unaccompanied alien child (UAC)", "unaccompanied minor", "resettlement",
      "self-sufficiency", "employment placement", "English language acquisition (ELA)",
      "cultural orientation", "matching grant", "reception and placement (R&P)",
      "sponsor", "legal guardian", "qualified alien", "trafficking survivor",
      "immigration status", "naturalization", "integration",
    ],
    evidenceRequirements: {
      tier: "ORR uses best practices from the refugee resettlement field",
      description: "ORR prioritizes evidence-based employment and integration models. 90-day employment placement is the standard benchmark. English language acquisition programs should align with adult education standards (WIOA Title II). Trauma-informed care for UAC/trafficking survivors is required.",
      examples: ["Employment First model", "Vocational English language training", "Trauma-informed case management for UAC"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Personnel", "Fringe", "Travel", "Supplies", "Contractual", "Other", "Indirect"],
      matchRequired: "Matching Grants: 1:1 match required (can be in-kind). Most other ORR programs: no match required.",
      indirectCostRule: "NICRA or 10% de minimis.",
      notes: "ORR eligibility categories matter: refugee, asylee, SIV holder, Cuban/Haitian entrant, Afghan parolee, Ukrainian parolee — each has specific eligibility. Not all programs serve all categories. Verify per NOFO.",
    },
    evaluationSignals: {
      whatTheyScore: ["Organizational experience with refugee/asylee populations", "Employment placement approach", "Language access (services in multiple languages)", "Cultural competency", "Partnerships with employers and community organizations"],
      commonDisqualifiers: ["No experience with refugee or immigrant populations", "Language access plan absent", "Match not documented for Matching Grants"],
      winFactors: ["Bilingual/bicultural staff", "Employer network for job placement", "Co-location with resettlement agency", "Employment First model named"],
    },
    ragEntries: [
      {
        title: "ORR Grant Writing: 90-Day Employment and Multilingual Service Delivery",
        content: "ORR's primary success metric for adult programs is the 90-day employment placement rate — the percentage of adult clients who are employed within 90 days of arrival or program enrollment. Strong applications target 70-85% placement at 90 days and document the employer network and job placement methodology. Multilingual service delivery is required — not just translation, but culturally and linguistically competent case management in the client's language. ThriveUp's Speech Bridge platform provides 107-language AI navigation — this is directly relevant to ORR language access requirements and should be cited. For UAC programs, trauma-informed care, legal screening (T/U visa identification, SIJS eligibility), and safe release protocols are the core requirements. LifeBridge (lifetransitionsaid.org) with its 20,670+ resources and refugee-specific navigation aligns directly with ORR reception and placement support goals.",
        keywords: ["orr", "refugee", "90-day employment", "self-sufficiency", "multilingual", "speech bridge", "language access", "unaccompanied children", "uac", "lifetransitionsaid"],
      },
    ],
  },

  // ─── 18. FEMA ────────────────────────────────────────────────────────────────
  {
    agencyId: "fema",
    name: "Federal Emergency Management Agency",
    abbreviation: "FEMA",
    parentDepartment: "DHS",
    resourcesUrl: "https://www.fema.gov/grants",
    howToApplyUrl: "https://www.fema.gov/grants",
    cfdaPrefix: "97",
    programOffices: [
      { id: "bric", name: "Building Resilient Infrastructure and Communities (BRIC)", focus: "Pre-disaster mitigation, community resilience, infrastructure", cfdaPrefix: "97.047", typicalAward: "$500K–$50M" },
      { id: "hmgp", name: "Hazard Mitigation Grant Program (HMGP)", focus: "Post-disaster mitigation, reducing future losses", cfdaPrefix: "97.039", typicalAward: "Post-disaster; varies" },
      { id: "empg", name: "Emergency Management Performance Grant (EMPG)", focus: "State/local emergency management capacity", cfdaPrefix: "97.042", typicalAward: "Formula" },
    ],
    requiredForms: [
      { name: "SF-424 Application for Federal Assistance", description: "Standard federal cover form", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "Benefit-Cost Analysis (BCA)", description: "Required for BRIC and HMGP — must show benefit-cost ratio ≥1.0", url: "https://www.fema.gov/grants/mitigation/benefit-cost", required: true, whenRequired: "BRIC and HMGP" },
      { name: "Hazard Mitigation Plan (HMP)", description: "Jurisdiction must have a current FEMA-approved HMP to be eligible", url: "https://www.fema.gov/emergency-managers/mitigation/planning", required: true, whenRequired: "All BRIC/HMGP applicants" },
    ],
    performanceSystem: {
      name: "FEMA Grants Outcomes — Mitigation Metrics",
      description: "FEMA grantees report through the FEMA Grants Management System. BRIC/HMGP: report on projects completed, lives/properties protected, estimated future losses avoided.",
      reportingFrequency: "Quarterly progress reports + Annual report",
      portalUrl: "https://www.fema.gov/grants",
      keyMetrics: ["Properties protected", "Lives at risk reduced", "Estimated future losses avoided ($)", "Critical infrastructure protected"],
    },
    languageDictionary: [
      "hazard mitigation", "natural hazard", "resilience", "pre-disaster mitigation",
      "benefit-cost analysis (BCA)", "benefit-cost ratio (BCR)", "avoided future losses",
      "hazard mitigation plan (HMP)", "whole community approach",
      "underserved communities", "equity in disaster preparedness",
      "critical infrastructure", "essential services",
      "climate adaptation", "floodplain management", "earthquake retrofit",
    ],
    evidenceRequirements: {
      tier: "FEMA BCA Tool — quantitative benefit-cost analysis required",
      description: "FEMA requires benefit-cost analysis (BCA) showing a ratio ≥1.0 for BRIC and HMGP projects. The FEMA BCA Toolkit is the required methodology. For non-structural projects (planning, outreach), a qualitative impact justification may be accepted.",
      examples: ["FEMA BCA Toolkit analysis", "HAZUS loss estimation", "NFIP flood claims reduction analysis"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Personnel", "Fringe", "Travel", "Equipment", "Supplies", "Contractual", "Construction", "Other", "Indirect"],
      matchRequired: "BRIC: 25% non-federal match. HMGP: 25% non-federal match. Match can be in-kind or from other federal sources if allowed.",
      indirectCostRule: "NICRA or 10% de minimis.",
      notes: "Jurisdiction must have a FEMA-approved Hazard Mitigation Plan to be eligible. Plan must be current (5-year cycle). Non-profits can apply through state or local government as sub-applicants.",
    },
    evaluationSignals: {
      whatTheyScore: ["Technical feasibility", "Cost-effectiveness (BCR)", "Contribution to community resilience", "Equity and underserved populations", "Coordination with local government"],
      commonDisqualifiers: ["No current FEMA-approved HMP", "BCA ratio below 1.0", "Non-profit applying directly (must apply through state/local government)"],
      winFactors: ["BCR significantly above 1.0", "Addresses multiple hazards", "Equity focus on underserved or low-income communities", "Co-benefits beyond hazard mitigation (health, economic, environmental)"],
    },
    ragEntries: [
      {
        title: "FEMA Grant Writing: Hazard Mitigation Plan Eligibility and BCA",
        content: "FEMA BRIC and HMGP grants require that the applicant jurisdiction have a current FEMA-approved Hazard Mitigation Plan (HMP). The plan must be approved within the last 5 years. Nonprofits cannot apply directly — they must partner with a state or local government that submits on their behalf. The Benefit-Cost Analysis (BCA) is the technical core of any BRIC/HMGP application: projects must show a benefit-cost ratio (BCR) of 1.0 or higher using FEMA's BCA Toolkit (fema.gov/grants/mitigation/benefit-cost). Benefits include: property losses avoided, lives saved, infrastructure protection, avoided emergency response costs. BRIC's equity priority (post-IRA) means projects explicitly serving underserved or low-income communities receive additional consideration — cite census tract poverty and disability rates, EJSCREEN scores, and FEMA's Community Disaster Resilience Zones (CDRZs).",
        keywords: ["fema", "bric", "hmgp", "hazard mitigation plan", "benefit-cost analysis", "bca", "bcr", "resilience", "underserved", "community disaster resilience zone"],
      },
    ],
  },

  // ─── 19. DOD/CDMRP ───────────────────────────────────────────────────────────
  {
    agencyId: "cdmrp",
    name: "Congressionally Directed Medical Research Programs",
    abbreviation: "CDMRP",
    parentDepartment: "DOD",
    resourcesUrl: "https://cdmrp.health.mil/funding",
    howToApplyUrl: "https://cdmrp.health.mil/funding/preapps",
    cfdaPrefix: "12.420",
    programOffices: [
      { id: "prmrp", name: "Peer Reviewed Medical Research Program (PRMRP)", focus: "Military-relevant medical research, veterans health, rare diseases", cfdaPrefix: "12.420", typicalAward: "$385K–$10M" },
      { id: "bcrp", name: "Breast Cancer Research Program (BCRP)", focus: "Breast cancer — $170M/yr; health disparities focus", cfdaPrefix: "12.420", typicalAward: "$200K–$3M" },
      { id: "pcrp", name: "Prostate Cancer Research Program (PCRP)", focus: "Prostate cancer — $110M/yr; Black men disparity", cfdaPrefix: "12.420", typicalAward: "$200K–$2M" },
      { id: "scdrp", name: "Sickle Cell Disease Research Program (SCDRP)", focus: "Sickle cell — $10M; disparities, novel therapies, care access", cfdaPrefix: "12.420", typicalAward: "$500K–$2M" },
    ],
    requiredForms: [
      { name: "Pre-Application (Required First Step)", description: "2-4 page pre-application reviewed for programmatic relevance before full proposal is invited", url: "https://cdmrp.health.mil/funding/preapps", required: true },
      { name: "Full Application via Grants.gov + eBRAP", description: "Full application submitted through Grants.gov AND uploaded to eBRAP (Electronic Biomedical Research Application Portal)", url: "https://ebrap.org", required: true },
      { name: "Research Strategy (15 pages typical)", description: "Significance, Innovation, Approach, Investigator, Environment", url: "https://cdmrp.health.mil/funding", required: true },
      { name: "Biomedical Research Application Portal (eBRAP) Upload", description: "ALL CDMRP applications must be registered and uploaded in eBRAP", url: "https://ebrap.org", required: true },
    ],
    performanceSystem: {
      name: "CDMRP Annual Progress Reports via eBRAP",
      description: "CDMRP grantees submit Annual Progress Reports (APRs) through eBRAP. Reports cover: specific aims accomplished, milestones met, publications/presentations, personnel changes, budget status.",
      reportingFrequency: "Annual progress reports + Final report",
      portalUrl: "https://ebrap.org",
      keyMetrics: ["Milestones met", "Publications", "Presentations", "Patents/licenses", "Data/biospecimen sharing", "Clinical impact"],
    },
    languageDictionary: [
      "military relevance", "veteran health", "Congressionally directed",
      "Peer-Reviewed Medical Research Program (PRMRP)", "research topic area",
      "research area descriptor (RAD)", "pre-application", "eBRAP",
      "health disparity", "racial disparity", "cancer disparities",
      "community-based participatory research (CBPR)", "implementation science",
      "dissemination and implementation (D&I)", "sickle cell disease",
      "prostate cancer", "breast cancer", "TNBC", "rare disease",
      "innovative approach", "translational research", "novel mechanism",
    ],
    evidenceRequirements: {
      tier: "CDMRP Programmatic Requirements — peer review by scientific and consumer reviewers",
      description: "CDMRP uses two-tier review: Tier 1 is peer scientific review; Tier 2 is programmatic review by CDMRP program management. Consumer reviewers (patients/advocates) participate in both tiers for all CDMRP programs. Every application must address the specific CDMRP research topic area (RAD) and demonstrate military relevance.",
      examples: ["NIH R01 study design adapted for CDMRP", "CBPR community-engaged research design", "Implementation science (CFIR/RE-AIM) for D&I awards"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Personnel", "Fringe", "Consultants", "Travel", "Equipment", "Supplies", "Contractual", "Patient Care Costs", "Other", "Indirect/F&A"],
      matchRequired: "CDMRP does not require match. Cost sharing is not encouraged.",
      indirectCostRule: "Negotiated F&A rate (standard NIH-equivalent). Indirect on construction and patient care costs prohibited.",
      notes: "CDMRP pre-application is required — do not submit full application without receiving invitation. eBRAP registration must happen before Grants.gov submission. Consumer reviewer participation means the lay abstract must be clear to non-scientists — this is scored.",
    },
    evaluationSignals: {
      whatTheyScore: [
        "Significance: does this advance military/veteran health? Is the problem important?",
        "Innovation: is the approach novel? Does it challenge existing knowledge?",
        "Approach: is the research design rigorous and feasible?",
        "Investigator: is the team qualified? Is there a mentor for early-career?",
        "Environment: does the setting provide the resources needed?",
        "Military Relevance: explicit connection to service member/veteran health",
        "Consumer Reviewer Score: lay abstract clarity, patient benefit",
      ],
      commonDisqualifiers: ["Pre-application not submitted or not invited", "eBRAP registration missing", "Military relevance not addressed", "Research topic area (RAD) not matched"],
      winFactors: ["Explicit military/veteran health connection", "Community-engaged or CBPR design for disparity focus", "Consumer-friendly lay abstract", "CFIR/RE-AIM for D&I awards strengthens implementation feasibility section"],
    },
    ragEntries: [
      {
        title: "CDMRP Grant Writing: eBRAP, Pre-Application Gate, and Military Relevance",
        content: "CDMRP is a two-step process: a mandatory pre-application (2-4 pages) must be submitted and reviewed before a full application is invited. Do not submit a full application without receiving an invitation to do so. ALL applications — both pre-application and full application — must be registered and uploaded in eBRAP (ebrap.org) in addition to Grants.gov. Failure to register in eBRAP is an automatic disqualifier. Military relevance is a required element for all CDMRP programs — even for health disparity research on conditions like sickle cell disease, the application must articulate how the research serves or informs care for service members, veterans, or military-connected individuals. Consumer reviewers (patients and advocates) score all CDMRP applications — the lay abstract must be clear, accessible, and compelling to a non-scientist. RPLICE's implementation science infrastructure (CFIR 2.0, 39 constructs in production code) directly supports CDMRP Dissemination and Implementation award applications.",
        keywords: ["cdmrp", "ebrap", "pre-application", "military relevance", "prmrp", "bcrp", "pcrp", "scdrp", "sickle cell", "implementation science", "consumer reviewer"],
      },
    ],
  },

  // ─── 20. CMS/CMMI ────────────────────────────────────────────────────────────
  {
    agencyId: "cms_cmmi",
    name: "Centers for Medicare & Medicaid Services — Center for Medicare and Medicaid Innovation",
    abbreviation: "CMS/CMMI",
    parentDepartment: "HHS",
    resourcesUrl: "https://innovation.cms.gov",
    howToApplyUrl: "https://innovation.cms.gov/innovation-models",
    cfdaPrefix: "93.778",
    programOffices: [
      { id: "aco_reach", name: "ACO REACH (Accountable Care Organization Realizing Equity, Access, Community Health)", focus: "Value-based care for Medicare beneficiaries, health equity", cfdaPrefix: "93.778", typicalAward: "Performance-based; varies" },
      { id: "ahead", name: "AHEAD — State-Based Total Cost of Care", focus: "State health system transformation, total cost of care", cfdaPrefix: "93.778", typicalAward: "$12M–$100M (state-level)" },
      { id: "ccbhc", name: "CCBHC Demonstration (Certified Community Behavioral Health Clinic)", focus: "Integrated behavioral health, whole-person care, Medicaid", cfdaPrefix: "93.778", typicalAward: "Prospective Payment System" },
    ],
    requiredForms: [
      { name: "Letters of Intent / Notice of Intent", description: "Most CMMI models require LOI before full application", url: "https://innovation.cms.gov", required: true },
      { name: "Model Application (CMMI-specific)", description: "Each model has a unique application — submitted through CMMI portal, not Grants.gov", url: "https://innovation.cms.gov", required: true },
    ],
    performanceSystem: {
      name: "CMMI Model Performance Dashboard",
      description: "CMMI tracks model performance against quality measures, cost savings, and equity metrics. Participants report through CMS quality reporting programs. CCBHC: prospective payment system with quality reporting.",
      reportingFrequency: "Quarterly performance measures + Annual evaluation reports",
      portalUrl: "https://innovation.cms.gov",
      keyMetrics: ["Quality measure performance", "Total cost of care", "Patient experience", "Health equity metrics (disparity reduction)", "Care coordination measures"],
    },
    languageDictionary: [
      "value-based care", "accountable care", "total cost of care",
      "quality measure", "HEDIS", "CCBHC", "integrated behavioral health",
      "whole-person care", "health equity", "social needs screening",
      "SDOH", "care coordination", "prospective payment",
      "FQHC", "Medicaid", "Medicare", "dual-eligible",
      "population health management", "risk stratification",
    ],
    evidenceRequirements: {
      tier: "CMMI requires evidence of care transformation readiness and quality improvement capacity",
      description: "CMMI models require evidence of existing quality improvement infrastructure, clinical quality measure reporting experience, and capacity to implement value-based care changes. CCBHC certification requires meeting 9 criteria including 24/7 crisis services, integrated primary care, and care coordination.",
      examples: ["Existing PCMH certification", "HEDIS quality measure reporting", "CCBHC certification criteria compliance"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Varies by model — most CMMI models are performance-based, not grant-based"],
      matchRequired: "Most CMMI models are NOT grants — they are alternative payment models with performance-based incentives.",
      indirectCostRule: "Not applicable to most CMMI models.",
      notes: "CMMI models are primarily for healthcare providers (hospitals, health centers, physician groups) and states. Nonprofits participate primarily through CCBHC demonstration or as care coordination partners in ACO REACH.",
    },
    evaluationSignals: {
      whatTheyScore: ["Readiness to implement the model", "Quality measure reporting history", "Care coordination infrastructure", "Population served (equity focus)", "Financial sustainability"],
      commonDisqualifiers: ["Not a Medicare/Medicaid provider", "No existing clinical quality infrastructure", "For CCBHC: not meeting all 9 certification criteria"],
      winFactors: ["Existing PCMH or FQHC certification", "Health equity focus serving dually eligible or low-income Medicare/Medicaid beneficiaries", "CCBHC certification in progress"],
    },
    ragEntries: [
      {
        title: "CMS/CMMI: CCBHC and Behavioral Health Integration Language",
        content: "The Certified Community Behavioral Health Clinic (CCBHC) demonstration is CMMI's most directly relevant program for behavioral health organizations. CCBHC certification requires meeting 9 criteria: (1) availability and accessibility of services including 24/7 crisis services; (2) care coordination across settings; (3) scope of services including primary care screening; (4) care planning; (5) quality and other reporting; (6) organizational authority, governance, and accreditation; (7) organizational infrastructure; (8) staffing (including peer support specialists); (9) availability of services to special populations. Organizations that currently provide community mental health services and want to expand into CCBHC should use SAMHSA's CCBHC criteria as the framework. The reimbursement model is prospective payment (daily rate), not grant funding. CCBHC is worth pursuing because it provides a sustainable funding stream independent of grant cycles.",
        keywords: ["cms", "cmmi", "ccbhc", "behavioral health", "prospective payment", "24/7 crisis", "peer support", "integrated care", "medicaid", "samhsa"],
      },
    ],
  },

  // ─── 21. BJA ─────────────────────────────────────────────────────────────────
  {
    agencyId: "bja",
    name: "Bureau of Justice Assistance",
    abbreviation: "BJA",
    parentDepartment: "DOJ",
    resourcesUrl: "https://bja.ojp.gov/funding",
    howToApplyUrl: "https://bja.ojp.gov/funding",
    cfdaPrefix: "16.7",
    programOffices: [
      { id: "sca_adult", name: "Second Chance Act — Adult Reentry", focus: "Adult reentry, employment, housing, substance use treatment", cfdaPrefix: "16.812", typicalAward: "$700K–$1.5M" },
      { id: "dpsc", name: "Drug Court Discretionary Grant Program", focus: "Drug courts, veterans treatment courts, mental health courts", cfdaPrefix: "16.585", typicalAward: "$400K–$1M" },
      { id: "justice_systems", name: "Justice Reinvestment Initiative (JRI)", focus: "System-level reform, data-driven justice reform", cfdaPrefix: "16.7", typicalAward: "Technical assistance" },
    ],
    requiredForms: [
      { name: "SF-424 Application for Federal Assistance", description: "Standard federal cover form", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "DOJ OJP Budget Detail Worksheet", description: "BJA requires OJP-specific budget detail worksheet", url: "https://ojp.gov/financeguide", required: true },
      { name: "Project Abstract (400 words)", description: "Brief project summary", url: "https://bja.ojp.gov/funding", required: true },
      { name: "Program Narrative", description: "Statement of the Problem, Project Design, Capabilities/Competencies, Plan for Collecting Data, Budget", url: "https://bja.ojp.gov/funding", required: true },
    ],
    performanceSystem: {
      name: "OJP Performance Measurement Tool (PMT) — GMS Reporting",
      description: "BJA grantees report through DOJ's Grants Management System (GMS) and Performance Measurement Tool (PMT). SCA Adult: recidivism, employment, housing, substance use, education outcomes at 6 and 12 months post-release.",
      reportingFrequency: "Semi-annual performance reports",
      portalUrl: "https://grants.ojp.usdoj.gov",
      keyMetrics: ["Participants served", "Recidivism rate (re-arrest, reconviction)", "Employment at 6/12 months", "Housing stability", "Substance use treatment completion", "Education/training completion"],
    },
    languageDictionary: [
      "adult reentry", "Second Chance Act", "justice-involved",
      "recidivism reduction", "evidence-based program", "risk-need-responsivity (RNR)",
      "cognitive behavioral intervention", "transitional housing",
      "employment upon release", "substance use disorder treatment",
      "medication-assisted treatment (MAT)", "peer mentorship",
      "trauma-informed", "desistance from crime", "case management",
      "continuity of care", "community supervision", "probation/parole",
      "reintegration", "pre-release planning",
    ],
    evidenceRequirements: {
      tier: "OJP Crime Solutions — crimesolutions.ojp.gov",
      description: "BJA requires use of evidence-based programs from crimesolutions.ojp.gov, rated Effective or Promising. The Risk-Need-Responsivity (RNR) model and Cognitive Behavioral Interventions (CBIs) are the dominant evidence-based frameworks for adult reentry. Validated risk assessment tools (LSI-R, COMPAS, ORAS) are expected for case management.",
      examples: ["Moral Reconation Therapy (MRT — OJP Effective)", "Thinking for a Change (OJP Effective)", "Transitional Jobs (OJP Promising)", "Motivational Interviewing (OJP Effective)"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Personnel", "Fringe", "Travel", "Equipment", "Supplies", "Contractual", "Other", "Indirect"],
      matchRequired: "SCA Adult: 25% match required (can be in-kind). Drug Courts: no match. Verify per solicitation.",
      indirectCostRule: "NICRA or 10% de minimis. DOJ Financial Guide governs.",
      notes: "DOJ OJP Financial Guide is the governing document for all BJA grants. Participant incentives, gift cards, and phone cards require special justification and must follow OJP guidance on allowable incentives.",
    },
    evaluationSignals: {
      whatTheyScore: ["Statement of the Problem (local recidivism data)", "Project Design (EBP selection, RNR application)", "Capabilities/Competencies (prior reentry experience)", "Data Collection Plan (PMT alignment)", "Budget (cost per participant, match)"],
      commonDisqualifiers: ["EBP not on crimesolutions.ojp.gov", "Missing match for SCA", "PMT performance measures not addressed"],
      winFactors: ["Named RNR-aligned risk assessment tool", "Employer partnerships for transitional employment", "Continuity-of-care plan from pre-release through 12 months post-release", "Peer mentor/mentorship component"],
    },
    ragEntries: [
      {
        title: "BJA Second Chance Act: RNR, CrimeSolutions, and Continuity of Care",
        content: "BJA's Second Chance Act (SCA) Adult Reentry grants fund community organizations to provide reentry services including employment, housing, treatment, and case management. The RNR (Risk-Need-Responsivity) model is required: use a validated risk assessment instrument (LSI-R, COMPAS, ORAS, STATIC-99 where appropriate) to target services to high/moderate-risk individuals (Risk), address criminogenic needs (antisocial attitudes, criminal peers, substance use, work/school, family, housing — the Central Eight), and match service delivery to learning style and motivation (Responsivity). Every named EBP must be rated Effective or Promising on OJP CrimeSolutions (crimesolutions.ojp.gov). The continuity of care from pre-release through 12 months post-release is a critical scored element — describe exactly how the case plan initiated inside the facility connects to services on the outside and who is responsible for each handoff.",
        keywords: ["bja", "second chance act", "sca", "adult reentry", "rnr", "crimesolutions", "lsi-r", "compas", "cognitive behavioral", "continuity of care", "recidivism"],
      },
    ],
  },

  // ─── 22. NIH D&I ─────────────────────────────────────────────────────────────
  {
    agencyId: "nih_di",
    name: "National Institutes of Health — Dissemination and Implementation Research",
    abbreviation: "NIH",
    parentDepartment: "HHS",
    resourcesUrl: "https://grants.nih.gov/grants/guide",
    howToApplyUrl: "https://grants.nih.gov/grants/apply-for-a-grant",
    cfdaPrefix: "93.3",
    programOffices: [
      { id: "r01", name: "R01 Research Project Grant", focus: "Full-scale implementation science, D&I research", cfdaPrefix: "93.307", typicalAward: "$500K–$2M/yr (up to 5 yrs)" },
      { id: "r03", name: "R03 Small Research Grant", focus: "Pilot/exploratory D&I studies, community-engaged research", cfdaPrefix: "93.307", typicalAward: "$50K/yr (up to 2 yrs)" },
      { id: "k_awards", name: "K-Career Development Awards (K01, K23)", focus: "Career development for implementation scientists", cfdaPrefix: "93.307", typicalAward: "$100K–$200K/yr" },
      { id: "par_25_144", name: "PAR-25-144 D&I Research in Health", focus: "CFIR, RE-AIM, EPIS, ERIC-based D&I studies in health contexts", cfdaPrefix: "93.307", typicalAward: "$500K/yr" },
    ],
    requiredForms: [
      { name: "SF-424 Research and Related (R&R) Application", description: "NIH-specific SF-424 variant submitted through Grants.gov or ASSIST", url: "https://grants.nih.gov/grants/apply-for-a-grant/forms", required: true },
      { name: "Research Strategy (12 pages for R01; 6 pages for R03)", description: "Significance, Innovation, Approach — the core scientific narrative", url: "https://grants.nih.gov/grants/guide", required: true },
      { name: "Specific Aims (1 page)", description: "The most important page — outlines the scientific problem, long-term goal, and 3-4 aims", url: "https://grants.nih.gov/grants/guide", required: true },
      { name: "NIH Biosketch (5 pages) via SciENcv", description: "All senior/key personnel — must use NIH format, generated in SciENcv", url: "https://grants.nih.gov/grants/forms/biosketch", required: true },
      { name: "Data Management and Sharing Plan", description: "Required for all NIH applications proposing research — describes data types, sharing timeline, repository", url: "https://grants.nih.gov/grants/guide/notice-files/NOT-OD-21-013.html", required: true },
      { name: "Human Subjects Protections (4 pages) or Exemption", description: "Required if human subjects involved — describe protections, IRB, consent", url: "https://grants.nih.gov/grants/guide", required: true },
    ],
    performanceSystem: {
      name: "NIH Research Performance Progress Reports (RPPR) via eRA Commons",
      description: "NIH grantees report annually through eRA Commons using the RPPR format. Reports cover: accomplishments, products (publications, data, tools), participants, impact, and changes. Final reports required within 120 days of project end.",
      reportingFrequency: "Annual RPPR + Final report",
      portalUrl: "https://public.era.nih.gov/commons",
      keyMetrics: ["Specific aims accomplished", "Publications", "Datasets produced", "Students/trainees", "Community partners engaged", "Implementation outcomes (fidelity, reach, adoption, sustainability)"],
    },
    languageDictionary: [
      "dissemination and implementation (D&I)", "implementation science",
      "CFIR (Consolidated Framework for Implementation Research)", "RE-AIM",
      "EPIS (Exploration, Preparation, Implementation, Sustainment)",
      "ERIC (Expert Recommendations for Implementing Change)",
      "implementation outcomes (acceptability, adoption, appropriateness, feasibility, fidelity, penetration, sustainability, cost)",
      "contextual determinants", "inner setting", "outer setting", "innovation",
      "implementation strategies", "stakeholder engagement",
      "community-based participatory research (CBPR)", "hybrid effectiveness-implementation trial",
      "Type 1/2/3 hybrid design", "pragmatic trial",
      "health disparity", "health equity", "underserved populations",
    ],
    evidenceRequirements: {
      tier: "NIH peer review — study section evaluation against NIH review criteria",
      description: "NIH uses peer review by study sections. Applications are scored 1-9 on: Significance, Investigators, Innovation, Approach, and Environment. D&I applications specifically must demonstrate a practice with sufficient evidence to justify implementation study (Tier 1 evidence), a clear implementation strategy, and measurement of implementation outcomes (Proctor et al. 2011 taxonomy is the standard).",
      examples: ["CFIR 2.0 determinant framework", "RE-AIM framework for evaluation", "EPIS for systems-level implementation", "ERIC expert recommendations for strategies"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Personnel (% effort)", "Fringe", "Consultants", "Equipment", "Supplies", "Travel", "Patient Care Costs", "Other Direct Costs", "Facilities and Administrative (F&A)"],
      matchRequired: "NIH does not require match for research grants.",
      indirectCostRule: "Negotiated F&A rate with NIH Division of Cost Allocation (DCA) or provisional rate. First-time NIH applicants without a rate: use 10% de minimis on MTDC.",
      notes: "Modular budgets used for R01s requesting up to $250K direct costs/year — request in $25K modules. Personnel % effort must be scientifically justified. NIH salary cap applies (Executive Level II = ~$221K).",
    },
    evaluationSignals: {
      whatTheyScore: ["Significance: does this address an important problem?", "Investigators: are they well-qualified?", "Innovation: does this challenge existing paradigms?", "Approach: rigorous, feasible, with potential pitfalls addressed?", "Environment: does the setting support the research?"],
      commonDisqualifiers: ["Specific Aims page doesn't stand alone as a compelling story", "Biosketch not in NIH format", "Data sharing plan missing", "Human subjects protection inadequate"],
      winFactors: ["Named D&I framework (CFIR, RE-AIM, EPIS) with evidence of fluency", "Pilot data demonstrating feasibility", "Community partner letters of support", "Named study section and program officer contact"],
    },
    ragEntries: [
      {
        title: "NIH D&I Grant Writing: CFIR, RE-AIM, and the Specific Aims Page",
        content: "NIH Dissemination and Implementation (D&I) grants are evaluated by study sections that expect fluency in implementation science frameworks. The three most important: (1) CFIR 2.0 (Consolidated Framework for Implementation Research) — identifies contextual determinants across 5 domains: Innovation, Inner Setting, Outer Setting, Individuals, and Implementation Process. ThriveUp/RPLICE has 39 CFIR 2.0 constructs in production code — this is a direct competitive advantage. (2) RE-AIM — evaluates program reach, effectiveness, adoption, implementation, and maintenance. Every NIH D&I proposal structures its evaluation around RE-AIM dimensions. (3) EPIS — four phases (Exploration, Preparation, Implementation, Sustainment) describes the systems-level implementation trajectory. The Specific Aims page is the most important page in the NIH application — it is the only page ALL reviewers read before scoring. It should: state the problem (1 paragraph with key statistics), present the long-term goal and objective, list 3-4 specific aims, and end with a one-sentence 'expected outcomes' statement. The Specific Aims page should be written for a non-specialist reviewer in your disease area.",
        keywords: ["nih", "d&i", "implementation science", "cfir", "re-aim", "epis", "specific aims", "study section", "peer review", "rplice", "39 constructs"],
      },
    ],
  },

  // ─── 23. USDA Rural Development ──────────────────────────────────────────────
  {
    agencyId: "usda_rd",
    name: "USDA Rural Development",
    abbreviation: "USDA/RD",
    parentDepartment: "USDA",
    resourcesUrl: "https://www.rd.usda.gov/programs-services/all-programs",
    howToApplyUrl: "https://www.rd.usda.gov/programs-services/all-programs",
    cfdaPrefix: "10.7",
    programOffices: [
      { id: "rbdg", name: "Rural Business Development Grant (RBDG)", focus: "Rural small business development, technical assistance, training", cfdaPrefix: "10.351", typicalAward: "$50K–$500K" },
      { id: "rcdi", name: "Rural Community Development Initiative (RCDI)", focus: "Community development organizations, housing, economic development in rural areas", cfdaPrefix: "10.446", typicalAward: "$50K–$250K" },
      { id: "cf_grants", name: "Community Facilities Direct Grants", focus: "Essential community facilities (health clinics, childcare, community centers)", cfdaPrefix: "10.766", typicalAward: "$50K–$1M" },
      { id: "reconnect", name: "ReConnect Broadband Program", focus: "Broadband infrastructure in rural areas", cfdaPrefix: "10.936", typicalAward: "$25M–$25M per project" },
    ],
    requiredForms: [
      { name: "RD Application Package (via USDA LINC or Grants.gov)", description: "USDA Rural Development uses its own application portal (LINC) for loans; Grants.gov for competitive grants", url: "https://usdalinc.sc.egov.usda.gov", required: true },
      { name: "SF-424 Application for Federal Assistance", description: "Standard federal cover form", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "Documentation of Rural Area Eligibility", description: "USDA RD requires documentation that the project area meets rural area definition (<50,000 population, not adjacent to metro area)", url: "https://www.rd.usda.gov", required: true },
    ],
    performanceSystem: {
      name: "USDA RD Reporting via Agency Reporting System",
      description: "USDA RD grantees report semi-annually through the USDA reporting system. CF grants: report on facilities built/improved and community members served. RBDG: report on businesses assisted, jobs created/retained. RCDI: report on housing units, community development activities.",
      reportingFrequency: "Semi-annual progress reports",
      portalUrl: "https://www.rd.usda.gov",
      keyMetrics: ["Rural area served (population)", "Jobs created/retained", "Businesses assisted", "Facilities constructed/improved", "Broadband households connected"],
    },
    languageDictionary: [
      "rural area", "rural community", "small rural town", "agricultural community",
      "essential community facility", "underserved rural community",
      "broadband access", "digital divide in rural areas",
      "rural economic development", "agricultural processing",
      "rural workforce", "rural health", "critical access hospital",
      "small and medium businesses (SMBs)", "rural main street",
    ],
    evidenceRequirements: {
      tier: "USDA RD does not use a formal evidence tier — project feasibility and community support",
      description: "USDA RD grants are evaluated on project feasibility, community need, and organizational capacity. Community support letters from local government (county commissioners, city council) are important. For CF grants, a needs assessment documenting the absence of the proposed facility is required.",
      examples: ["Community needs assessment", "Letters of support from local government", "Business plan for RBDG"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Personnel", "Fringe", "Travel", "Equipment", "Supplies", "Contractual", "Construction", "Other", "Indirect"],
      matchRequired: "RBDG: grantee must contribute at least 1:1 match. RCDI: match required. CF grants: match preferred. Verify per program.",
      indirectCostRule: "NICRA or 10% de minimis.",
      notes: "USDA RD eligibility is geographically defined — projects must be in rural areas as defined by USDA (not in a city of 50,000+, not contiguous to a metro area). Use the USDA Rural Area Eligibility tool at eligibility.sc.egov.usda.gov to verify.",
    },
    evaluationSignals: {
      whatTheyScore: ["Rural area eligibility", "Community need and support", "Project feasibility", "Organizational capacity", "Leverage and match"],
      commonDisqualifiers: ["Area not meeting USDA rural definition", "Missing local government support letters", "Match not documented"],
      winFactors: ["Strong local government endorsement (county commissioners)", "Project addresses identified rural infrastructure gap", "Partnership with local USDA Rural Development office"],
    },
    ragEntries: [
      {
        title: "USDA Rural Development: Rural Area Eligibility is the Gateway",
        content: "Every USDA Rural Development program requires that the project area meets USDA's rural area definition: a rural area is not a city or town with a population of 50,000 or more and is not adjacent to a large metropolitan area. Verify eligibility BEFORE application using the USDA eligibility mapping tool at eligibility.sc.egov.usda.gov. For programs like RCDI and CF grants, a letter from the local county commissioners or city council documenting the community need and supporting the project is a near-requirement. USDA RD State Offices are also key — a pre-application meeting with the USDA State Director or district office often surfaces administrative guidance that improves the application. For Texas: USDA Texas Rural Development office in Temple, TX handles all program applications.",
        keywords: ["usda", "rural development", "rural area", "eligibility", "50000 population", "county commissioners", "cf grants", "rbdg", "rcdi", "broadband"],
      },
    ],
  },

  // ─── 24. ACL ─────────────────────────────────────────────────────────────────
  {
    agencyId: "acl",
    name: "Administration for Community Living",
    abbreviation: "ACL",
    parentDepartment: "HHS",
    resourcesUrl: "https://acl.gov/grants",
    howToApplyUrl: "https://acl.gov/grants",
    cfdaPrefix: "93.0",
    programOffices: [
      { id: "older_adults", name: "Older Americans Act (OAA) Title III Programs", focus: "Home and community-based services, nutrition, caregiver support", cfdaPrefix: "93.044", typicalAward: "Formula via state/AAA" },
      { id: "ilnet", name: "IL-NET: Centers for Independent Living", focus: "Independent living for people with disabilities", cfdaPrefix: "93.433", typicalAward: "$200K–$500K" },
      { id: "assistive_tech", name: "Assistive Technology State Grant Program", focus: "AT devices and services for people with disabilities", cfdaPrefix: "93.464", typicalAward: "Formula via state" },
    ],
    requiredForms: [
      { name: "SF-424 Application for Federal Assistance", description: "Standard federal cover form", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "Project Narrative", description: "Addresses all ACL selection criteria in stated order", url: "https://acl.gov/grants", required: true },
    ],
    performanceSystem: {
      name: "ACL Reporting System — AoA NAPIS for OAA programs",
      description: "ACL grantees report through program-specific reporting systems. OAA Title III programs report through NAPIS (National Aging Program Information System). IL-NET reports through RSA reporting. All ACL grants use semi-annual progress reports.",
      reportingFrequency: "Semi-annual progress reports + Annual program reports",
      portalUrl: "https://acl.gov/grants",
      keyMetrics: ["Older adults/people with disabilities served", "Units of service", "Independence/community integration outcomes", "Caregiver support provided"],
    },
    languageDictionary: [
      "aging in place", "home and community-based services (HCBS)",
      "older adult", "person with a disability", "independent living",
      "self-determination", "consumer-directed", "caregiver support",
      "nutrition services", "congregate meals", "home-delivered meals",
      "assistive technology (AT)", "accessible", "reasonable accommodation",
      "ADA compliance", "universal design", "person-centered planning",
    ],
    evidenceRequirements: {
      tier: "ACL uses evidence-based programs for older adults — NCOA evidence registry",
      description: "ACL evidence-based disease prevention and health promotion programs are catalogued through the National Council on Aging (NCOA) and the Administration on Aging. Programs serving older adults with evidence from randomized trials (like PEARLS, Stepping On, CDSMP) are preferred.",
      examples: ["PEARLS (depression in older adults)", "Stepping On (fall prevention)", "CDSMP (chronic disease self-management)", "GRACE (Geriatric Resources for Assessment and Care)"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Personnel", "Fringe", "Travel", "Equipment", "Supplies", "Contractual", "Other", "Indirect"],
      matchRequired: "OAA programs: match varies by title. IL-NET: 10% match. Verify per program.",
      indirectCostRule: "NICRA or 10% de minimis.",
      notes: "ACL programs largely flow through state agencies (State Units on Aging, State VR agencies). Direct competitive grants to CBOs are available through ACL discretionary grant programs.",
    },
    evaluationSignals: {
      whatTheyScore: ["Need of target population", "Project approach (evidence-based)", "Organizational experience with older adults/people with disabilities", "Partnerships", "Evaluation"],
      commonDisqualifiers: ["Not serving older adults or people with disabilities", "No coordination with Area Agency on Aging (AAA)"],
      winFactors: ["Partnership with local AAA", "Evidence-based program from NCOA registry", "Person-centered, consumer-directed approach"],
    },
    ragEntries: [
      {
        title: "ACL Grant Writing: Older Adults, People with Disabilities, Independent Living",
        content: "ACL is the primary federal agency for aging and disability programs. The key language axis: person-centered, consumer-directed services that support 'aging in place' and 'independent living.' For older adults programs, alignment with the Older Americans Act (OAA) Title III priorities is required — nutrition, transportation, caregiver support, evidence-based health promotion, elder abuse prevention. For disability programs, Section 504 of the Rehabilitation Act and the ADA framework define the civil rights basis for services. Centers for Independent Living (CILs) are peer-run organizations — consumer-majority boards and peer staff are required. HCBS (Home and Community-Based Services) waiver alignment strengthens any proposal touching Medicaid-eligible populations with disabilities. Area Agencies on Aging (AAAs) are the local delivery network — partnership with the local AAA is expected in any OAA-funded program.",
        keywords: ["acl", "older adults", "disability", "independent living", "aging in place", "oaa", "hcbs", "area agency on aging", "aaa", "consumer-directed", "person-centered"],
      },
    ],
  },

  // ─── 25. DOE Education ────────────────────────────────────────────────────────
  {
    agencyId: "doe_education",
    name: "U.S. Department of Education",
    abbreviation: "ED",
    parentDepartment: "ED",
    resourcesUrl: "https://www2.ed.gov/fund/grants-apply.html",
    howToApplyUrl: "https://www2.ed.gov/fund/grants-apply.html",
    cfdaPrefix: "84",
    programOffices: [
      { id: "promise", name: "Promise Neighborhoods (84.215N)", focus: "Cradle-to-career pipeline, community schools, collective impact", cfdaPrefix: "84.215", typicalAward: "$4M–$6M over 5 years" },
      { id: "title1", name: "Title I, Part A — Improving Basic Programs", focus: "Schools with high concentrations of poverty", cfdaPrefix: "84.010", typicalAward: "Formula via state/LEA" },
      { id: "literacy", name: "Striving Readers / Innovative Approaches to Literacy (84.215G)", focus: "Literacy development, pre-K through 12", cfdaPrefix: "84.215", typicalAward: "$750K–$3M" },
      { id: "ies", name: "IES Research Grants (R305)", focus: "Education research and development", cfdaPrefix: "84.305", typicalAward: "$500K–$3M" },
    ],
    requiredForms: [
      { name: "ED Applications via Grants.gov (G5)", description: "ED competitive grants submitted through Grants.gov; formula grants managed through G5.gov", url: "https://www2.ed.gov/fund/grants-apply.html", required: true },
      { name: "Project Narrative", description: "Addresses all selection criteria including Absolute, Invitational, and Competitive Preference Priorities", url: "https://www2.ed.gov/fund/grants-apply.html", required: true },
      { name: "Evaluation Plan", description: "ED requires rigorous evaluation — must specify evaluation design, evaluator independence, data collection", url: "https://www2.ed.gov/fund/grants-apply.html", required: true },
      { name: "Community Analysis (Promise Neighborhoods)", description: "Data on community needs, strengths, assets for cradle-to-career pipeline", url: "https://www2.ed.gov/programs/promiseneighborhoods", required: false, whenRequired: "Promise Neighborhoods applications" },
    ],
    performanceSystem: {
      name: "ED Performance Reporting via ED-ASSIST and G5",
      description: "ED grantees report annually through ED's reporting system. Performance measures are program-specific. Promise Neighborhoods: 15 school readiness, K-12, and postsecondary outcomes. IES: research products, publications, tools, training.",
      reportingFrequency: "Annual performance reports",
      portalUrl: "https://g5.gov",
      keyMetrics: ["Students served", "School readiness outcomes", "Graduation rates", "Postsecondary enrollment", "Literacy outcomes", "Research products (IES)"],
    },
    languageDictionary: [
      "cradle-to-career", "community school", "collective impact", "promise neighborhood",
      "evidence-based intervention", "ESSA evidence tiers (Tier 1-4)",
      "whole-child approach", "trauma-informed school", "restorative practices",
      "MTSS (Multi-Tiered System of Supports)", "RTI (Response to Intervention)",
      "early childhood education", "school readiness", "third-grade reading proficiency",
      "chronic absenteeism", "discipline disparities", "school-to-prison pipeline",
      "postsecondary readiness", "dual enrollment", "FAFSA completion",
      "LEA (Local Education Agency)", "SEA (State Education Agency)", "IHE",
    ],
    evidenceRequirements: {
      tier: "ESSA Evidence Tiers 1-4 (What Works Clearinghouse + IES standards)",
      description: "ED uses the Every Student Succeeds Act (ESSA) evidence tiers: Tier 1 (Strong — RCT), Tier 2 (Moderate — quasi-experimental), Tier 3 (Promising — correlational with controls), Tier 4 (Demonstrates a Rationale — logic model with research basis). Competitive ED grants typically require Tier 1-3 evidence for proposed interventions. IES research grants generate the evidence base.",
      examples: ["KIPP Schools (WWC Tier 2)", "Success for All (WWC Tier 1)", "Becoming a Man (WWC Tier 1)", "YouthBuild (WWC Tier 3)"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Personnel", "Fringe", "Travel", "Equipment", "Supplies", "Contractual", "Construction", "Other", "Indirect"],
      matchRequired: "Promise Neighborhoods: no match required. Most ED competitive grants: no match. GEAR UP: 50% match required.",
      indirectCostRule: "NICRA or 10% de minimis under 2 CFR 200. ED: restricted indirect rate for some programs (capped at 26%).",
      notes: "ED uses Absolute, Competitive Preference, and Invitational Priorities in solicitations — address ALL priorities, especially Absolute (required to be funded) and Competitive Preference (earn extra points). Promise Neighborhoods requires an LEA partner — without a school district, the application is ineligible.",
    },
    evaluationSignals: {
      whatTheyScore: ["Absolute and Competitive Preference Priorities addressed", "Quality of project design (evidence base)", "Quality of management plan", "Quality of project evaluation", "Adequacy of resources"],
      commonDisqualifiers: ["Absolute Priority not addressed", "No independent external evaluator named", "Promise Neighborhoods: no LEA partner"],
      winFactors: ["Tier 1 or Tier 2 ESSA evidence for primary intervention", "Named external evaluator with education research credentials", "Community voice in design (Competitive Preference for equity)"],
    },
    ragEntries: [
      {
        title: "ED Grant Writing: ESSA Evidence Tiers and Priority Addressing",
        content: "Every U.S. Department of Education competitive grant solicitation specifies Absolute Priorities, Competitive Preference Priorities, and Invitational Priorities. Absolute Priorities MUST be addressed — proposals not addressing them are not reviewed. Competitive Preference Priorities earn additional points and can be the difference between funded and unfunded at the margin. Invitational Priorities do not earn points but signal ED's emerging interests — addressing them rarely hurts. The ESSA evidence framework (Tiers 1-4) governs evidence requirements: Tier 1 = strong evidence from a well-designed and implemented RCT; Tier 2 = moderate evidence from a quasi-experimental study; Tier 3 = promising evidence from well-designed and implemented correlational study with statistical controls; Tier 4 = demonstrates a rationale based on high-quality research or a well-specified logic model. For Promise Neighborhoods: the Community Analysis is a distinct required document — map all assets AND gaps in the cradle-to-career pipeline using census tract data, school performance data, and community survey data.",
        keywords: ["ed", "department of education", "essa", "evidence tiers", "promise neighborhoods", "competitive preference priority", "absolute priority", "lea partner", "wwc", "what works clearinghouse"],
      },
    ],
  },

  // ─── 26. Treasury/CDFI ────────────────────────────────────────────────────────
  {
    agencyId: "cdfi_fund",
    name: "Community Development Financial Institutions Fund (CDFI Fund)",
    abbreviation: "CDFI Fund",
    parentDepartment: "Treasury",
    resourcesUrl: "https://www.cdfifund.gov/programs-training/programs",
    howToApplyUrl: "https://www.cdfifund.gov/programs-training/programs",
    cfdaPrefix: "21.012",
    programOffices: [
      { id: "cdfi_program", name: "CDFI Program Financial Assistance (FA) and Technical Assistance (TA)", focus: "Capital for CDFIs serving low-income communities", cfdaPrefix: "21.012", typicalAward: "$500K–$10M" },
      { id: "nmtc", name: "New Markets Tax Credit Program (NMTC)", focus: "Tax credits for investments in low-income communities", cfdaPrefix: "21.011", typicalAward: "Allocation of tax credits" },
      { id: "bef", name: "Bond Guarantee Program (BGP)", focus: "Long-term debt capital for CDFIs", cfdaPrefix: "21.012", typicalAward: "$100M+ bond guarantee" },
      { id: "healthy_food", name: "Healthy Food Financing Initiative (HFFI)", focus: "Grocery stores and food access in food deserts", cfdaPrefix: "21.012", typicalAward: "$500K–$5M" },
    ],
    requiredForms: [
      { name: "CDFI Certification (Required Before Applying)", description: "Must be CDFI-certified before applying to CDFI Program — certification process takes 90+ days", url: "https://www.cdfifund.gov/programs-training/certification", required: true },
      { name: "Application via myCDFIfund.gov Portal", description: "All CDFI Fund applications submitted through myCDFIfund.gov, not Grants.gov", url: "https://my.cdfifund.gov", required: true },
      { name: "Strategic Plan and Business Plan", description: "3-year strategic plan demonstrating mission focus, target market, financial sustainability", url: "https://www.cdfifund.gov", required: true },
    ],
    performanceSystem: {
      name: "CDFI Fund Transaction Level Reporting (TLR)",
      description: "CDFI Program award recipients submit Transaction Level Reports (TLRs) documenting each loan/investment made with CDFI Fund capital. Reports include borrower demographics, loan terms, and community development outcomes.",
      reportingFrequency: "Annual Transaction Level Reports",
      portalUrl: "https://my.cdfifund.gov",
      keyMetrics: ["Loans/investments made", "Dollars deployed", "Low-income borrowers served", "Jobs created/retained", "Housing units financed", "Businesses capitalized"],
    },
    languageDictionary: [
      "community development financial institution (CDFI)", "low-income community",
      "low-income persons", "distressed community", "investment area",
      "new markets tax credit (NMTC)", "community development loan",
      "micro-enterprise", "small business lending", "housing finance",
      "financial inclusion", "unbanked", "underbanked",
      "community development entity (CDE)", "qualified active low-income business (QALICB)",
      "leverage", "permanent capital", "technical assistance",
    ],
    evidenceRequirements: {
      tier: "CDFI Fund uses financial and community development impact evidence",
      description: "CDFI Fund grants are evaluated on the applicant's track record deploying capital to underserved communities, financial health, and mission focus. Evidence includes: loan performance data, community impact metrics, and peer comparison data from the CDFI Data Project.",
      examples: ["CDFI Data Project peer benchmarks", "Prior award performance reports", "Audited financial statements"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Loan Fund Capital", "Technical Assistance Costs", "Administrative Costs"],
      matchRequired: "CDFI Program FA: 1:1 non-federal match required. TA grants: no match required. NMTC: no direct match but leverage structure required.",
      indirectCostRule: "CDFI Program: indirect costs generally not allowed on loan fund capital. TA grants: indirect up to NICRA.",
      notes: "CDFI certification takes 90+ days — must apply for certification well before application deadline. myCDFIfund.gov is the portal — NOT Grants.gov. This is a common error.",
    },
    evaluationSignals: {
      whatTheyScore: ["CDFI's track record in the target market", "Financial health and sustainability", "Mission alignment with target market", "Use of funds plan", "1:1 match commitment"],
      commonDisqualifiers: ["Not CDFI-certified", "Application submitted through wrong portal (Grants.gov instead of myCDFIfund.gov)", "Match not committed"],
      winFactors: ["Strong loan performance in low-income communities", "Growing loan portfolio", "Diverse capital sources (demonstrating leverage)", "Focus on underserved populations (minority, rural, women entrepreneurs)"],
    },
    ragEntries: [
      {
        title: "CDFI Fund: Certification Required, myCDFIfund.gov Portal, and Match",
        content: "The CDFI Fund finances community development financial institutions — banks, credit unions, loan funds, and venture funds that lend to underserved communities. The critical prerequisite: CDFI certification from the CDFI Fund, which takes 90-120 days and requires documenting: (1) primary mission is community development; (2) provides development services alongside financing; (3) serves a defined target market of low-income persons or communities; (4) is an accountability entity (board represents the target market). ALL applications go through myCDFIfund.gov — NOT Grants.gov. The 1:1 non-federal match requirement for Financial Assistance grants means the organization must have committed leverage from state/local government, foundations, or banks. NMTC (New Markets Tax Credits) is relevant for real estate projects in low-income census tracts — investor equity in exchange for 39% tax credit over 7 years. NMTC is not a grant but it is a CDFI Fund allocation that can finance ThriveUp's physical infrastructure.",
        keywords: ["cdfi", "cdfi fund", "certification", "mycdfifund.gov", "new markets tax credit", "nmtc", "low-income community", "financial assistance", "technical assistance", "1:1 match"],
      },
    ],
  },

  // ─── 27. DOL/VETS ─────────────────────────────────────────────────────────────
  {
    agencyId: "dol_vets",
    name: "Department of Labor — Veterans' Employment and Training Service",
    abbreviation: "DOL/VETS",
    parentDepartment: "DOL",
    resourcesUrl: "https://www.dol.gov/agencies/vets/programs/grants",
    howToApplyUrl: "https://www.dol.gov/agencies/vets/programs/grants",
    cfdaPrefix: "17.805",
    programOffices: [
      { id: "hire_vets", name: "HIRE Vets Medallion Program", focus: "Employer recognition for veteran hiring — medallion program", cfdaPrefix: "17.802", typicalAward: "Not a grant" },
      { id: "reap", name: "Workforce Opportunity for Rural Communities / Reemploy America Grants", focus: "Veterans employment in rural and dislocated areas", cfdaPrefix: "17.805", typicalAward: "$250K–$1M" },
      { id: "tap_partners", name: "Transition Assistance Program (TAP) Employer Partnerships", focus: "Industry partnerships for veteran transition", cfdaPrefix: "17.801", typicalAward: "Varies" },
    ],
    requiredForms: [
      { name: "SF-424 Application for Federal Assistance", description: "Standard federal cover form", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "SF-424A Budget Information", description: "Budget by object class", url: "https://www.grants.gov/web/grants/forms/sf-424-family.html", required: true },
      { name: "Project Narrative", description: "Veteran employment need, program design, organizational experience, evaluation", url: "https://www.dol.gov/agencies/vets/programs/grants", required: true },
    ],
    performanceSystem: {
      name: "DOL/VETS Reporting via VETS-4212 and Grants Management",
      description: "DOL/VETS grantees report veteran employment outcomes. Primary metrics: veterans employed at exit, employment retention at 6 months, wages, credential attainment.",
      reportingFrequency: "Quarterly performance reports",
      portalUrl: "https://www.dol.gov/agencies/vets",
      keyMetrics: ["Veterans served", "Employment at exit", "Employment at 6 months", "Wages at placement", "Credential attainment"],
    },
    languageDictionary: [
      "veteran", "service member", "transitioning service member",
      "post-9/11 veteran", "disabled veteran", "homeless veteran",
      "employment barriers", "occupational translation", "military skills",
      "DD-214", "VETS-4212", "TAP (Transition Assistance Program)",
      "military occupational specialty (MOS)", "civilian equivalency",
      "veteran preference", "priority of service",
    ],
    evidenceRequirements: {
      tier: "DOL/VETS uses DOL's evidence framework for workforce programs",
      description: "DOL/VETS programs are evaluated on veteran employment outcomes. Evidence base: DOL What Works Clearinghouse for workforce, plus veteran-specific literature on employment barriers (MOS translation, identity transition, mental health).",
      examples: ["TAP employment model", "American Job Center veteran services", "Vocational Rehabilitation model", "Peer employment support"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Personnel", "Fringe", "Travel", "Equipment", "Supplies", "Contractual", "Other", "Indirect"],
      matchRequired: "Verify per program — most DOL/VETS grants do not require match.",
      indirectCostRule: "NICRA or 10% de minimis.",
      notes: "Veterans receive priority of service in all DOL-funded employment and training programs. Programs that document veteran population reach are scored favorably.",
    },
    evaluationSignals: {
      whatTheyScore: ["Veteran population reach", "Employment approach", "Organizational experience with veterans", "Employer partnerships", "Evaluation plan"],
      commonDisqualifiers: ["No veteran-specific programming", "No employer network"],
      winFactors: ["Veteran-run or veteran-serving organization", "Named employer partners with commitment letters", "Connection to American Job Center for co-enrollment"],
    },
    ragEntries: [
      {
        title: "DOL/VETS: Priority of Service and Military Skills Translation",
        content: "DOL/VETS programs serve veterans, with focus on transitioning service members and veterans with employment barriers. Priority of service: by law, veterans receive priority over non-veterans for ALL DOL-funded training programs — document compliance explicitly. Military Occupational Specialty (MOS) translation is a core challenge — propose a specific tool or approach (e.g., O*NET Military Crosswalk, Hiring Our Heroes Transition Fellowships, CareerOneStop MOS translator) to bridge military experience to civilian credentials. VetMissionTransition.com addresses the full military-to-civilian transition: career translation, benefits navigation, identity transition, financial planning, family support — this platform directly maps to DOL/VETS program outcomes.",
        keywords: ["dol", "vets", "priority of service", "veteran", "mos translation", "military occupational specialty", "tap", "vetmissiontransition", "employment", "career transition"],
      },
    ],
  },

  // ─── 28. NEH ─────────────────────────────────────────────────────────────────
  {
    agencyId: "neh",
    name: "National Endowment for the Humanities",
    abbreviation: "NEH",
    parentDepartment: "Independent",
    resourcesUrl: "https://www.neh.gov/grants",
    howToApplyUrl: "https://www.neh.gov/grants/apply",
    cfdaPrefix: "45.149",
    programOffices: [
      { id: "public_programs", name: "Public Programs Division", focus: "Humanities for public audiences — exhibitions, documentaries, reading programs", cfdaPrefix: "45.164", typicalAward: "$5K–$1M" },
      { id: "preservation", name: "Preservation and Access", focus: "Digital preservation, archives, collections", cfdaPrefix: "45.149", typicalAward: "$50K–$350K" },
      { id: "education", name: "Education Programs", focus: "Humanities in education, teacher professional development", cfdaPrefix: "45.163", typicalAward: "$50K–$500K" },
    ],
    requiredForms: [
      { name: "NEH Application via Grants.gov or Applicant Portal", description: "NEH uses both Grants.gov and its own Applicant Portal depending on program", url: "https://www.neh.gov/grants/apply", required: true },
      { name: "Project Narrative", description: "Intellectual merit, public benefit, project design, organizational capacity", url: "https://www.neh.gov/grants/apply", required: true },
      { name: "Humanities Scholars / Advisors List", description: "Named humanities scholars who will guide the project", url: "https://www.neh.gov/grants/apply", required: true },
    ],
    performanceSystem: {
      name: "NEH Reporting via Grants Management Portal",
      description: "NEH grantees submit progress and final reports through the NEH grants management portal. Reports cover: activities completed, public engagement, dissemination, scholarly contributions.",
      reportingFrequency: "Interim reports + Final report",
      portalUrl: "https://www.neh.gov/grants/manage",
      keyMetrics: ["Public participants engaged", "Products created", "Scholars involved", "Institutions reached"],
    },
    languageDictionary: [
      "humanities", "humanistic inquiry", "cultural heritage",
      "public humanities", "digital humanities", "community humanities",
      "primary source", "archival research", "oral history",
      "documentary film", "exhibition", "public programming",
      "scholarly rigor", "interdisciplinary", "preservation",
      "accessibility", "diverse audiences", "underserved communities",
    ],
    evidenceRequirements: {
      tier: "NEH peer review — humanities merit and public benefit",
      description: "NEH grants are reviewed by peer panels of humanities scholars. Applications must demonstrate humanistic rigor (use of primary sources, scholarly methodology) AND public benefit. For public programs, named humanities scholars must be involved as advisors or consultants.",
      examples: ["Primary source archival research", "Peer-reviewed scholarly consultation", "Oral history methodology"],
      cdepAccepted: false,
    },
    budgetRules: {
      objectClasses: ["Personnel", "Fringe", "Consultants (Scholar Honoraria)", "Travel", "Supplies", "Production Costs", "Promotion/Distribution", "Indirect"],
      matchRequired: "Some NEH programs require cost sharing. Challenge Grants require 3:1 match. Verify per program.",
      indirectCostRule: "NICRA or 10% de minimis.",
      notes: "Scholar honoraria/consultants are a primary budget line in NEH projects. Document named scholars and their credentials in the budget narrative.",
    },
    evaluationSignals: {
      whatTheyScore: ["Intellectual merit of the humanities content", "Public benefit and audience reach", "Qualifications of humanities scholars involved", "Project feasibility and organizational capacity"],
      commonDisqualifiers: ["No named humanities scholars advising the project", "Scholarly content insufficient — too commercial or generic"],
      winFactors: ["Named distinguished humanities scholars with letters of commitment", "Community voice in project design", "Underserved communities as primary audience", "Preservation of at-risk cultural heritage"],
    },
    ragEntries: [
      {
        title: "NEH Grant Writing: Humanistic Merit and Named Scholars",
        content: "NEH funds humanities projects that serve the public through scholarly rigor. Every NEH application must identify the humanities content (history, literature, philosophy, language, culture, art) and name the humanities scholars who will guide the work — without named scholars, the application is scored significantly lower. For community-focused organizations, NEH's public programs and 'America's Historical and Cultural Organizations' grants support exhibitions, oral history projects, documentary films, reading and discussion programs, and digital humanities projects that bring scholarship to underserved communities. The NEH Bridging Cultures initiative supports projects that explore the history and diverse cultural heritage of the United States — ideal for organizations serving immigrant, refugee, or historically marginalized communities.",
        keywords: ["neh", "humanities", "public programs", "oral history", "digital humanities", "bridging cultures", "cultural heritage", "scholars", "community humanities"],
      },
    ],
  },

];

// ─── Quick-lookup helpers ─────────────────────────────────────────────────────

export function getProfileById(agencyId: string): AgencyProfile | undefined {
  return AGENCY_PROFILES.find(p => p.agencyId === agencyId);
}

export function getProfileByCfda(cfdaPrefix: string): AgencyProfile | undefined {
  return AGENCY_PROFILES.find(p => cfdaPrefix.startsWith(p.cfdaPrefix));
}

export function detectProfileFromGrant(opts: {
  agency?: string | null;
  cfda?: string | null;
  title?: string | null;
}): AgencyProfile | undefined {
  const { agency = "", cfda = "", title = "" } = opts;
  const lower = (s: string | null | undefined) => (s ?? "").toLowerCase();
  const ag = lower(agency);
  const ti = lower(title);
  const cf = lower(cfda);

  for (const p of AGENCY_PROFILES) {
    if (p.cfdaPrefix && cf && cf.startsWith(p.cfdaPrefix.toLowerCase())) return p;
    if (ag.includes(p.abbreviation.toLowerCase())) return p;
    if (ag.includes(p.agencyId.replace("_", " "))) return p;
    for (const office of p.programOffices) {
      if (office.cfdaPrefix && cf && cf.startsWith(office.cfdaPrefix.toLowerCase())) return p;
    }
  }

  // Keyword fallbacks
  if (ag.includes("samhsa") || ti.includes("samhsa") || ag.includes("substance abuse")) return getProfileById("samhsa");
  if (ag.includes("hrsa") || ti.includes("hrsa") || ag.includes("health resources")) return getProfileById("hrsa");
  if (ag.includes("acf") || ag.includes("children and families")) return getProfileById("acf");
  if (ag.includes("dol") || ag.includes("labor") || ti.includes("workforce") || ti.includes("wioa")) return getProfileById("dol_eta");
  if (ag.includes("nsf") || ag.includes("national science")) return getProfileById("nsf");
  if (ag.includes("ojjdp") || ag.includes("juvenile justice")) return getProfileById("ojjdp");
  if (ag.includes("hud") || ag.includes("housing and urban")) return getProfileById("hud");
  if (ag.includes("eda") || ag.includes("economic development admin")) return getProfileById("eda");
  if (ag.includes("va ") || ag.includes("veterans affairs") || ti.includes("veteran")) return getProfileById("va");
  if (ag.includes("ovw") || ag.includes("violence against women")) return getProfileById("doj_ovw");
  if (ag.includes("americorps") || ag.includes("cncs")) return getProfileById("americorps");
  if (ag.includes("epa") || ag.includes("environmental protection")) return getProfileById("epa");
  if (ag.includes("usda") && (ag.includes("food") || ag.includes("nutrition") || ag.includes("fns"))) return getProfileById("usda_fns");
  if (ag.includes("sba") || ag.includes("small business")) return getProfileById("sba");
  if (ag.includes("nea") || ag.includes("endowment for the arts")) return getProfileById("nea");
  if (ag.includes("imls") || ag.includes("museum and library")) return getProfileById("imls");
  if (ag.includes("orr") || ag.includes("refugee resettlement")) return getProfileById("orr");
  if (ag.includes("fema")) return getProfileById("fema");
  if (ag.includes("cdmrp") || ag.includes("congressionally directed medical")) return getProfileById("cdmrp");
  if (ag.includes("cms") || ag.includes("medicare") || ag.includes("medicaid") || ag.includes("cmmi")) return getProfileById("cms_cmmi");
  if (ag.includes("bja") || ag.includes("bureau of justice")) return getProfileById("bja");
  if (ag.includes("nih") || ag.includes("national institutes of health")) return getProfileById("nih_di");
  if (ag.includes("usda") && ag.includes("rural")) return getProfileById("usda_rd");
  if (ag.includes("acl") || ag.includes("community living")) return getProfileById("acl");
  if (ag.includes("department of education") || ag.includes("ed.gov") || ti.includes("title i")) return getProfileById("doe_education");
  if (ag.includes("cdfi") || ag.includes("community development financial")) return getProfileById("cdfi_fund");
  if (ag.includes("vets") || (ag.includes("dol") && (ag.includes("veteran") || ag.includes("vets")))) return getProfileById("dol_vets");
  if (ag.includes("neh") || ag.includes("endowment for the humanities")) return getProfileById("neh");

  return undefined;
}

export function getAllRagEntries(): Array<{ agencyId: string; title: string; content: string; keywords: string[] }> {
  return AGENCY_PROFILES.flatMap(p =>
    p.ragEntries.map(e => ({ agencyId: p.agencyId, ...e }))
  );
}
