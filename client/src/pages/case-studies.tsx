import { useState } from "react";
import { Link } from "wouter";
import SectionTutorial from "@/components/section-tutorial";
import { SECTION_TUTORIALS } from "@/lib/tutorial-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrainingGuideButton } from "@/components/training-guide";
import {
  Shield, Briefcase, Users, GraduationCap,
  ArrowRight, CheckCircle2, AlertTriangle, Lightbulb,
  Target, BarChart3, Activity, RefreshCw, Layers,
  ChevronRight, ChevronDown, BookOpen, Scale,
  Microscope, Brain, Globe, Clock, Heart,
  MapPin, Building2, FileText, Rocket,
  ClipboardCheck, Eye, TrendingUp, Wrench,
  Search,
} from "lucide-react";

interface PlatformContribution {
  platformName: string;
  platformId: string;
  role: string;
  specificAction: string;
}

interface CaseStudy {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Shield;
  color: string;
  iconBg: string;
  setting: string;
  population: string;
  timeline: string;
  grantAlignment: string[];
  challenge: {
    summary: string;
    dataPoints: string[];
  };
  threeRealities: {
    research: string;
    politics: string;
    ground: string;
  };
  mapGapApplication: {
    discovery: string;
    assessment: string;
    design: string;
    implementation: string;
    measurement: string;
    improvement: string;
  };
  platformContributions: PlatformContribution[];
  stakeholders: string[];
  disciplines: Array<{ name: string; role: string }>;
  outcomes: {
    metrics: Array<{ label: string; value: string; change: string; positive: boolean }>;
    qualitative: string[];
  };
  lessonsLearned: string[];
  crossLinks: Array<{ label: string; url: string }>;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: "dfc-prevention",
    title: "Youth Substance Use Prevention",
    subtitle: "Drug-Free Communities Coalition Model",
    icon: Shield,
    color: "text-emerald-600",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    setting: "Urban/Suburban Community — Mixed demographics, high ACEs prevalence",
    population: "Youth ages 10-24, families, 12-sector community coalition",
    timeline: "5-year grant cycle with Year 1 implementation",
    grantAlignment: ["CDC/ONDCP Drug-Free Communities ($625K)", "SAMHSA Strategic Prevention Framework"],
    challenge: {
      summary: "Rising youth substance use rates, fragmented prevention efforts across agencies, no shared data or accountability, community distrust of top-down programs.",
      dataPoints: [
        "28% of high school students reported 30-day alcohol use (vs. 20% national avg)",
        "Youth perception of risk for marijuana use declined 15% over 3 years",
        "12 community organizations working in silos with no shared outcome tracking",
        "Zero evidence-based prevention curricula implemented with fidelity monitoring",
        "Parent engagement in prevention activities below 8%",
      ],
    },
    threeRealities: {
      research: "RPLICE identified 3 candidate EBPs through SAMHSA NREPP and Blueprints registry. RE-AIM scoring showed LifeSkills Training had highest Reach + Effectiveness combination for this demographic. Better Science Lab validated effect sizes from meta-analyses.",
      politics: "School board supportive but nervous about 'drug talk' in classrooms. Law enforcement wanted zero-tolerance approach. Faith community wanted family-centered model. The Incubator mapped DFC requirements showing coalition-based model satisfied all stakeholders.",
      ground: "LifeBridge data showed 40% of families requesting substance use resources were also navigating housing instability. SafeReport incident data showed bullying hotspots correlated with substance use patterns. ISSS readiness assessment revealed only 2 of 8 target schools had counseling capacity.",
    },
    mapGapApplication: {
      discovery: "The Incubator identified DFC opportunity on SAM.gov with 94% ecosystem fit score. ThriveUp Community Intelligence Map overlaid substance use survey data with social determinants. Sankofa Health surfaced co-occurring behavioral health patterns. SafeReport incident data revealed school safety correlations.",
      assessment: "RPLICE ran RE-AIM analysis on 3 candidate curricula. Better Science Lab reviewed longitudinal outcomes. Coalition Dashboard mapped 12-sector readiness — 4 sectors had active engagement, 8 needed recruitment. LifeBridge ground-truth showed families needed wraparound services alongside prevention.",
      design: "Program Designer mapped all 10 DFC requirements against ecosystem. 8 met, 2 partial (sustainability plan, independent evaluator). SALP fidelity indicators defined for every curriculum module. Talk Your Talk designed family-communication and school-engagement protective factor components. Perfectly Different ensured neurodivergent youth inclusion. Dosage targets set: 24 contact hours per youth participant.",
      implementation: "ThriveUp delivered 24-module prevention curriculum with daily quest engagement. RPLICE monitored SALP fidelity weekly — flagged 2 facilitators drifting from manual in Month 2, corrected before outcomes impacted. LifeBridge navigated families to housing, food, and crisis services. ISSS tracked school-level MTSS tier data. SafeReport captured safety incidents. HerHealth Network coordinated medication adherence support for participants in concurrent treatment programs.",
      measurement: "Transparency Dashboard showed all 7 stakeholder views with real-time SMART goal tracking. RPLICE produced RE-AIM evaluation quarterly. DFC Reporting module tracked all 4 ONDCP core measures. Better Science Lab prepared independent evaluation. Sankofa tracked PHQ-9 and wellness score changes. ISSS reported academic outcome improvements.",
      improvement: "MAP-GAP CQI identified facilitator fidelity as key variable — highest-fidelity facilitators produced 3x better outcomes. MG-PATR documented community-specific adaptations for future replication. The Incubator identified 2 additional grant opportunities based on demonstrated outcomes.",
    },
    platformContributions: [
      { platformName: "ThriveUp Academy", platformId: "thriveup", role: "Central Hub", specificAction: "Delivered 24-module prevention curriculum, managed coalition dashboard, ran dosage tracking, hosted Transparency Dashboard with 7 stakeholder views" },
      { platformName: "The Incubator", platformId: "incubator", role: "Grant Discovery", specificAction: "Identified DFC opportunity with 94% fit score, flagged 2 additional opportunities post-implementation" },
      { platformName: "RPLICE", platformId: "rplice", role: "Fidelity & Evidence", specificAction: "RE-AIM evaluation of candidate EBPs, weekly SALP fidelity monitoring, MG-PATR documentation for replication" },
      { platformName: "Better Science Lab", platformId: "betterscience", role: "Independent Evaluation", specificAction: "Meta-analysis validation, independent outcome evaluation, publication-ready findings" },
      { platformName: "Sankofa Health", platformId: "sankofa", role: "Behavioral Health", specificAction: "PHQ-9 screening, co-occurring behavioral health assessment, wellness content delivery" },
      { platformName: "LifeBridge", platformId: "lifebridge", role: "Resource Navigation", specificAction: "24/7 family navigation to housing, food, crisis services — 40% of prevention families needed wraparound" },
      { platformName: "SafeReport", platformId: "safereport", role: "Safety Monitoring", specificAction: "School safety incident tracking, bullying-substance use correlation data, mandatory reporting" },
      { platformName: "ISSS", platformId: "isss", role: "School Implementation", specificAction: "MTSS tier tracking, school readiness assessment, teacher fidelity observations, SEL curriculum integration" },
      { platformName: "Talk Your Talk", platformId: "talkyourtalk", role: "Communication & Engagement", specificAction: "89 spoken + 18 sign languages — strengthening school engagement and family communication as a protective factor" },
      { platformName: "Perfectly Different", platformId: "perfectly-different", role: "Neurodiversity Inclusion", specificAction: "Ensured all prevention curriculum was neurodiversity-affirming with alternative engagement pathways" },
      { platformName: "HerHealth Network", platformId: "herhealth", role: "Health Compliance", specificAction: "Medication adherence support and chronic-disease navigation for participants in concurrent treatment programs" },
    ],
    stakeholders: ["Schools (K-12)", "Law Enforcement", "Faith-Based Organizations", "Healthcare Providers", "Youth-Serving Organizations", "Parents/Families", "Business Community", "Media", "Civic Organizations", "Government Agencies", "Mental Health Providers", "Higher Education"],
    disciplines: [
      { name: "Implementation Science", role: "CFIR and RE-AIM frameworks ensured evidence-based program selection and fidelity monitoring through SALP indicators" },
      { name: "Criminal Justice", role: "Diversion pathway integration for youth encountering justice system; SafeReport data informed prevention targeting" },
      { name: "HR Management", role: "Facilitator competency model, coalition member role definitions, volunteer workforce development" },
      { name: "I-O Psychology", role: "Behavioral nudge design for youth engagement, gamified quest system, parent motivation strategies" },
    ],
    outcomes: {
      metrics: [
        { label: "30-Day Youth Alcohol Use", value: "19%", change: "-32% reduction", positive: true },
        { label: "Youth Risk Perception (Marijuana)", value: "71%", change: "+22% increase", positive: true },
        { label: "Parent Prevention Engagement", value: "34%", change: "+325% increase", positive: true },
        { label: "Coalition Sector Representation", value: "12/12", change: "100% coverage", positive: true },
        { label: "Curriculum Fidelity (SALP)", value: "89%", change: "Target: 85%", positive: true },
        { label: "Dosage Completion Rate", value: "78%", change: "24 hrs/participant", positive: true },
      ],
      qualitative: [
        "School counselors reported students using refusal skills vocabulary from curriculum in real situations",
        "Parent coalition members became volunteer facilitators — organic community ownership emerged",
        "Law enforcement shifted from zero-tolerance to collaborative prevention approach based on shared dashboard data",
        "Faith leaders integrated prevention messaging into youth programming using Three Realities cultural adaptation",
      ],
    },
    lessonsLearned: [
      "Facilitator fidelity is the single biggest predictor of outcomes — highest-fidelity facilitators produced 3x better results than lowest-fidelity",
      "Wraparound services (LifeBridge) are not optional — 40% of prevention families needed basic needs addressed before they could engage in prevention programming",
      "Real-time SALP monitoring catches drift within 2 weeks — traditional end-of-program evaluation misses it entirely",
      "Community ownership accelerates when stakeholders can SEE their impact through the Transparency Dashboard — data builds trust faster than promises",
      "Three Realities analysis prevented 2 politically toxic program elements that would have killed coalition support before implementation began",
    ],
    crossLinks: [
      { label: "Transparency Dashboard", url: "/transparency" },
      { label: "Coalition Dashboard", url: "/coalition" },
      { label: "Prevention Hub", url: "/prevention" },
      { label: "MAP-GAP CQI", url: "/cqi" },
      { label: "Program Designer", url: "/program-designer" },
    ],
  },
  {
    id: "workforce-reentry",
    title: "Workforce Reentry for Returning Citizens",
    subtitle: "Second Chance Act Implementation",
    icon: Scale,
    color: "text-amber-600",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    setting: "Metropolitan area — high incarceration rates, limited reentry services",
    population: "Returning citizens ages 18-45, formerly incarcerated individuals",
    timeline: "3-year grant cycle with 6-month pre-release engagement",
    grantAlignment: ["DOJ Second Chance Act", "WIOA Title I Adult Programs"],
    challenge: {
      summary: "65% 3-year recidivism rate, fragmented reentry services, employers unwilling to hire, no longitudinal tracking, substance use relapse without treatment continuity.",
      dataPoints: [
        "65% of released individuals re-arrested within 3 years",
        "Average 47 days between release and first service contact — critical window lost",
        "83% reported housing instability within 90 days of release",
        "Only 22% connected to employment within 6 months",
        "Zero integrated case management across corrections, courts, community agencies",
      ],
    },
    threeRealities: {
      research: "RPLICE evidence review showed Risk-Needs-Responsivity (RNR) model with cognitive-behavioral components produced strongest recidivism reduction. Better Science Lab meta-analysis confirmed employment within 90 days correlates with 40% lower re-arrest rates.",
      politics: "County corrections department supportive but constrained by state policy. Employers hesitant without liability protections. DA's office wanted accountability metrics. Veterans' affairs wanted veteran-specific pathways. MCE needed to demonstrate economic impact for VOSB credibility.",
      ground: "LifeBridge data showed returning citizens' top 3 needs: housing (83%), ID/documents (71%), transportation (68%) — all needed before employment was possible. SafeReport incident data showed most violations occurred in first 30 days. M2C identified 15% of target population were veterans needing specialized transition support.",
    },
    mapGapApplication: {
      discovery: "The Incubator flagged Second Chance Act NOFO with 87% ecosystem fit. ThriveUp mapped reentry service gaps in target area. LifeBridge 211 call data showed overwhelming unmet needs for returning citizens. SafeReport provided recidivism pattern data from justice partners.",
      assessment: "RPLICE scored 4 candidate reentry models through RE-AIM. Three Realities revealed political barrier: DA's office needed real-time accountability data — Transparency Dashboard solved this. M2C identified veteran sub-population needing specialized career translation services.",
      design: "Program Designer mapped Second Chance Act requirements: 7 met, 1 partial (housing services needed partner), 1 gap (CBT curriculum licensing). MCE designed economic mobility pathway for entrepreneurship track. M2C designed veteran-specific career translation. SALP indicators defined for every service component.",
      implementation: "ThriveUp case management began 6 months pre-release. LifeBridge navigated housing, documents, transportation immediately post-release. MCE connected entrepreneurially-inclined participants to small business development. M2C provided military-to-civilian career translation for veteran participants. SafeReport tracked safety incidents. RPLICE monitored SALP fidelity weekly. HerHealth Network coordinated MAT (Medication-Assisted Treatment) adherence support for participants in substance use treatment.",
      measurement: "Transparency Dashboard gave DA's office real-time recidivism tracking — trust-building data. RPLICE RE-AIM evaluation showed high Reach but moderate Implementation fidelity in housing services (partner constraint). MCE tracked economic mobility: businesses launched, contracts won. Workforce Dashboard tracked employment, wage progression, credential attainment.",
      improvement: "MAP-GAP CQI identified pre-release engagement as critical: participants with 3+ pre-release contacts had 45% lower recidivism. MG-PATR documented housing partner selection criteria for future deployments. The Incubator identified WIOA Title I as complementary funding for workforce components.",
    },
    platformContributions: [
      { platformName: "ThriveUp Academy", platformId: "thriveup", role: "Central Hub", specificAction: "Case management from pre-release through 36-month follow-up, career pathways, credential tracking, Transparency Dashboard" },
      { platformName: "The Incubator", platformId: "incubator", role: "Grant Discovery", specificAction: "Identified Second Chance Act NOFO at 87% fit, later identified WIOA complementary funding" },
      { platformName: "LifeBridge", platformId: "lifebridge", role: "Resource Navigation", specificAction: "Post-release housing, ID/documents, transportation navigation — 83% of participants needed housing support first" },
      { platformName: "MCE", platformId: "mce", role: "Economic Mobility", specificAction: "Entrepreneurship track for qualified participants, small business development, APEX Accelerators connection, contracting opportunities" },
      { platformName: "M2C Transition", platformId: "m2c", role: "Veteran Services", specificAction: "Military-to-civilian career translation for 15% veteran sub-population, VA benefit navigation" },
      { platformName: "RPLICE", platformId: "rplice", role: "Fidelity & Evidence", specificAction: "RNR model evaluation, weekly SALP fidelity monitoring, RE-AIM evaluation, MG-PATR documentation" },
      { platformName: "Better Science Lab", platformId: "betterscience", role: "Research", specificAction: "Meta-analysis of employment-recidivism correlation, independent outcome evaluation" },
      { platformName: "SafeReport", platformId: "safereport", role: "Safety & Compliance", specificAction: "Recidivism pattern tracking, incident reporting, justice partner data sharing, violation monitoring" },
      { platformName: "HerHealth Network", platformId: "herhealth", role: "Health Compliance", specificAction: "MAT adherence support and chronic-disease navigation for participants in substance use treatment programs" },
      { platformName: "Sankofa Health", platformId: "sankofa", role: "Behavioral Health", specificAction: "Behavioral health screening, substance use assessment, trauma-informed care coordination" },
    ],
    stakeholders: ["Corrections Department", "Probation/Parole", "District Attorney's Office", "Public Defender", "Employers", "Housing Providers", "Recovery Programs", "Veterans Affairs", "Workforce Board", "Faith Community"],
    disciplines: [
      { name: "Criminal Justice", role: "Risk-Needs-Responsivity assessment, reentry planning, diversion pathways, justice partner coordination through shared dashboards" },
      { name: "Implementation Science", role: "CFIR barriers analysis for corrections setting, SALP fidelity monitoring of all reentry service components" },
      { name: "HR Management", role: "Career pathway design, credential attainment tracking, employer engagement and job placement, workforce pipeline management" },
      { name: "I-O Psychology", role: "Motivation maintenance during transition, behavioral nudges for appointment compliance, mentor engagement design" },
    ],
    outcomes: {
      metrics: [
        { label: "3-Year Recidivism Rate", value: "31%", change: "-52% reduction", positive: true },
        { label: "90-Day Employment Rate", value: "67%", change: "+205% increase", positive: true },
        { label: "Housing Stability (6 months)", value: "74%", change: "Up from 17%", positive: true },
        { label: "Pre-Release Contacts", value: "4.2 avg", change: "Target: 3+", positive: true },
        { label: "Service Fidelity (SALP)", value: "82%", change: "Target: 80%", positive: true },
        { label: "Businesses Launched (MCE)", value: "12", change: "Veteran + minority-owned", positive: true },
      ],
      qualitative: [
        "DA's office became coalition advocate after seeing real-time accountability data through Transparency Dashboard",
        "Employer partners increased from 3 to 18 after seeing 90-day retention data published transparently",
        "Veteran participants connected to VA benefits through M2C generated $340K in annual benefit utilization",
        "LifeBridge housing navigation reduced average time-to-stable-housing from 47 days to 11 days",
      ],
    },
    lessonsLearned: [
      "Pre-release engagement is non-negotiable — 3+ contacts before release correlated with 45% lower recidivism vs. post-release-only engagement",
      "Housing must be solved before employment — LifeBridge data proved participants without stable housing had 4x higher program dropout",
      "Real-time accountability data (Transparency Dashboard) converted skeptics — the DA's office became the program's strongest advocate",
      "Veteran sub-population (M2C) had dramatically different needs and outcomes — one-size-fits-all reentry programs fail specific populations",
      "HerHealth Network MAT adherence support prevented 8 treatment discontinuations that would have triggered parole violations",
    ],
    crossLinks: [
      { label: "Reentry Dashboard", url: "/reentry" },
      { label: "Workforce Pipeline", url: "/workforce-dashboard" },
      { label: "Justice Partners", url: "/justice-partners" },
      { label: "APEX Accelerators", url: "/apex-accelerators" },
      { label: "Transparency Dashboard", url: "/transparency" },
      { label: "MAP-GAP CQI", url: "/cqi" },
    ],
  },
  {
    id: "youth-development",
    title: "Holistic Youth Development",
    subtitle: "My Brother's Keeper — School-to-Success Pipeline",
    icon: GraduationCap,
    color: "text-violet-600",
    iconBg: "bg-violet-100 dark:bg-violet-900/30",
    setting: "Chicago, IL — Urban school district with school-to-prison pipeline challenges",
    population: "Youth ages 10-18, families, school staff, community mentors",
    timeline: "Multi-year implementation across 8 target schools",
    grantAlignment: ["DOE Title I/IV", "CDC/ONDCP DFC", "DOJ OJJDP"],
    challenge: {
      summary: "School-to-prison pipeline driving youth into the justice system. High suspension rates, low graduation rates, ACEs prevalence, unaddressed social determinants of health.",
      dataPoints: [
        "Suspension rate 3x the state average, disproportionately affecting Black and Latino youth",
        "4-year graduation rate at 62% vs. 85% state average",
        "47% of students screened positive for 2+ ACEs (Adverse Childhood Experiences)",
        "Only 1 school counselor per 450 students (recommended: 1 per 250)",
        "Zero coordinated wraparound service delivery across school-community boundary",
      ],
    },
    threeRealities: {
      research: "RPLICE evidence review identified SEL (Social-Emotional Learning) as highest-impact intervention for this context. Better Science Lab confirmed MTSS (Multi-Tiered System of Supports) framework produces strongest outcomes when implemented with fidelity. Talk Your Talk's multilingual communication-access approach showed particular promise for multilingual families and students with learning differences.",
      politics: "Teachers union supportive but overworked — needed implementation to reduce burden, not add to it. School board wanted visible metrics for parents. Community members distrustful of 'programs that come and go.' Police department wanted to be seen as partners, not enforcers.",
      ground: "ISSS readiness assessment: only 2 of 8 schools had counseling capacity for Tier 2/3. LifeBridge data showed 35% of families had active housing/food navigation needs. Perfectly Different's assessment revealed 18% of target students were neurodivergent with no accommodations in prevention programming.",
    },
    mapGapApplication: {
      discovery: "ThriveUp Community Intelligence Map showed suspension-to-incarceration correlation geospatially. The Incubator identified 3 aligned grant opportunities. Sankofa Health screening revealed behavioral health patterns. SafeReport incident data showed bullying hotspots matching substance use risk zones.",
      assessment: "RPLICE Three Realities analysis prevented 2 program elements that would have been politically toxic (police-led classroom sessions, mandatory family counseling). Instead: mentors from community, voluntary family engagement. ISSS assessed school readiness at building level — resource constraints mapped.",
      design: "ThriveUp Program Designer mapped 3 grants simultaneously against ecosystem capabilities. Talk Your Talk designed family-communication and engagement supports across 89 spoken + 18 sign languages. Perfectly Different ensured all activities were neurodiversity-affirming. Sankofa built behavioral health screening protocol. SALP fidelity indicators defined per school per program component.",
      implementation: "ThriveUp delivered SEL curriculum with gamified engagement (quests, house points, avatar progression). ISSS tracked MTSS tier data per student. LifeBridge handled family wraparound services. SafeReport captured school safety incidents. Talk Your Talk strengthened family-school communication as a protective factor. Perfectly Different provided alternative engagement pathways for neurodivergent students. RPLICE monitored fidelity weekly per school.",
      measurement: "Transparency Dashboard showed per-school outcomes to school board and community. ISSS tracked suspension reduction, attendance, grades. RPLICE RE-AIM evaluation per school. Sankofa tracked behavioral health improvements. Better Science Lab ran independent comparison analysis between high-fidelity and low-fidelity implementation schools.",
      improvement: "MAP-GAP CQI revealed implementation quality varied dramatically by school — difference was principal buy-in and dedicated implementation coordinator. MG-PATR documented per-school adaptations. Washington DC deployment (next) used these lessons for different Three Realities.",
    },
    platformContributions: [
      { platformName: "ThriveUp Academy", platformId: "thriveup", role: "Central Hub", specificAction: "SEL curriculum delivery with gamified engagement, case management, Coalition Dashboard, Transparency Dashboard" },
      { platformName: "ISSS", platformId: "isss", role: "School Integration", specificAction: "MTSS tier tracking per student, school readiness assessment, teacher fidelity observations, SEL integration" },
      { platformName: "Talk Your Talk", platformId: "talkyourtalk", role: "Communication Access", specificAction: "89 spoken + 18 sign languages — strengthening school engagement and family communication as a critical protective factor" },
      { platformName: "Perfectly Different", platformId: "perfectly-different", role: "Inclusion", specificAction: "Neurodiversity-affirming curriculum adaptations, alternative engagement pathways for 18% neurodivergent students" },
      { platformName: "Sankofa Health", platformId: "sankofa", role: "Behavioral Health", specificAction: "ACE screening, behavioral health assessment, trauma-informed care coordination, wellness tracking" },
      { platformName: "LifeBridge", platformId: "lifebridge", role: "Family Services", specificAction: "Family wraparound service navigation — 35% needed housing/food support before engaging in programming" },
      { platformName: "SafeReport", platformId: "safereport", role: "School Safety", specificAction: "Bullying incident tracking, safety pattern analysis, anonymous student reporting system" },
      { platformName: "RPLICE", platformId: "rplice", role: "Fidelity", specificAction: "Weekly per-school SALP fidelity monitoring, RE-AIM evaluation, MG-PATR documentation" },
      { platformName: "Better Science Lab", platformId: "betterscience", role: "Research", specificAction: "High-fidelity vs low-fidelity school comparison analysis, effect size calculations" },
      { platformName: "The Incubator", platformId: "incubator", role: "Grant Discovery", specificAction: "Identified 3 aligned grant opportunities, cross-mapped requirements to reduce application burden" },
    ],
    stakeholders: ["Schools (8 buildings)", "Community Mentors", "Law Enforcement", "Parents/Families", "Employers", "Community Health Workers", "Faith-Based Organizations", "Youth-Serving Orgs"],
    disciplines: [
      { name: "Implementation Science", role: "CFIR barriers analysis per school, RE-AIM evaluation, SALP fidelity monitoring revealing per-school quality variation" },
      { name: "Criminal Justice", role: "Diversion programs through SafeReport, restorative justice integration, school-to-prison pipeline interruption" },
      { name: "HR Management", role: "Workforce exposure for older youth through MCE and career explorer, mentor recruitment and matching" },
      { name: "I-O Psychology", role: "Gamified engagement design (house points, quests, avatar), behavioral nudges for attendance, staff motivation systems" },
    ],
    outcomes: {
      metrics: [
        { label: "Suspension Rate", value: "Down 41%", change: "Across 8 schools", positive: true },
        { label: "Graduation Rate", value: "76%", change: "+14 points", positive: true },
        { label: "ACE-Informed Referrals", value: "234", change: "From zero baseline", positive: true },
        { label: "Student Engagement", value: "89%", change: "Daily quest completion", positive: true },
        { label: "Family Wraparound", value: "142", change: "Families served via LifeBridge", positive: true },
        { label: "SALP Fidelity Range", value: "71-94%", change: "Per-school variation", positive: true },
      ],
      qualitative: [
        "Principal buy-in proved to be the single strongest predictor of per-school success — MG-PATR now includes principal engagement protocol",
        "Neurodivergent students showed higher engagement with Perfectly Different alternative pathways than standard curriculum",
        "Community mentors from the neighborhood built trust faster than external program staff — organic community ownership emerged",
        "Police department shifted from enforcement mindset to collaborative prevention after seeing shared dashboard data reduce incidents",
      ],
    },
    lessonsLearned: [
      "Per-school SALP fidelity monitoring is essential — the 23-point spread between highest and lowest schools would have been invisible without it",
      "Principal buy-in is a prerequisite, not a nice-to-have — MAP-GAP CQI now includes principal engagement as a SALP indicator",
      "Neurodiversity inclusion (Perfectly Different) is not optional — 18% of students needed alternative pathways; without them, they would have been lost",
      "Family wraparound services (LifeBridge) must be concurrent, not sequential — families cannot engage in prevention while facing housing instability",
      "MG-PATR replication to DC required complete Three Realities re-assessment — same framework, different politics, different ground truth",
    ],
    crossLinks: [
      { label: "Prevention Hub", url: "/prevention" },
      { label: "Transparency Dashboard", url: "/transparency" },
      { label: "Parent Education", url: "/parent-education" },
      { label: "MAP-GAP Framework", url: "/mapgap-framework" },
      { label: "Ecosystem Story", url: "/ecosystem-story" },
      { label: "Program Lifecycle", url: "/program-lifecycle" },
    ],
  },
  {
    id: "rural-workforce",
    title: "Rural Workforce Revitalization",
    subtitle: "Appalachian Region Economic Transformation",
    icon: Building2,
    color: "text-blue-600",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    setting: "Appalachian Region — post-industrial economic decline, limited infrastructure",
    population: "Adults facing employment barriers, opioid-affected families, dislocated workers",
    timeline: "Multi-year regional initiative with phased community rollout",
    grantAlignment: ["WIOA Title I", "SAMHSA Opioid Response", "EDA Economic Adjustment", "USDA Rural Development"],
    challenge: {
      summary: "Post-industrial economic decline, opioid crisis, limited healthcare access, brain drain of young professionals. Different problem, different setting — same ecosystem, adapted through Three Realities.",
      dataPoints: [
        "Unemployment rate 2.4x national average since major employer closure",
        "Opioid overdose deaths increased 180% over 5 years",
        "Nearest behavioral health provider: 45-minute drive",
        "23% of working-age adults left the region in 3 years (brain drain)",
        "Zero telehealth infrastructure despite broadband availability",
      ],
    },
    threeRealities: {
      research: "RPLICE identified technology-enabled workforce models showing promise in similar rural settings. Better Science Lab reviewed Appalachian economic revitalization literature — community-owned social enterprises had highest sustainability. Sankofa Health evidence base showed telehealth MAT (Medication-Assisted Treatment) was as effective as in-person for opioid use disorder.",
      politics: "County commissioners desperate for economic solutions but distrustful of 'outside programs.' Local healthcare system wanted to maintain referral control. Chamber of Commerce needed visible employer engagement. Recovery community wanted peer-led approaches, not clinical-only.",
      ground: "LifeBridge data showed 68% of families were navigating opioid-related needs alongside employment barriers — you cannot separate the two. HerHealth Network assessment showed MAT adherence dropped 40% when patients had to drive 45 minutes to pharmacy. MCE assessment showed 3 minority-owned businesses ready for federal contracting with APEX Accelerator support.",
    },
    mapGapApplication: {
      discovery: "The Incubator identified 4 aligned grants across WIOA, SAMHSA, EDA, USDA — $2.1M combined pipeline. ThriveUp Community Intelligence Map showed economic decline correlated with health outcomes. Sankofa surfaced opioid use patterns. LifeBridge call data quantified service gaps.",
      assessment: "RPLICE Three Realities analysis: Research supported technology-enabled models. Politics demanded local ownership — program had to be OF the community, not FOR the community. Ground truth: MAT access and employment were inseparable issues. SafeCogniCare assessed elder population cognitive safety needs (20% of region over 65).",
      design: "Program Designer mapped 4 grants simultaneously — 80% requirement overlap reduced application burden. MCE designed social enterprise pathway. M2C designed veteran-specific transition for local military base population. HerHealth Network designed telehealth MAT adherence support system. Sankofa designed behavioral health telehealth protocol. SALP indicators adapted for rural context (lower dosage frequency, higher per-session intensity).",
      implementation: "ThriveUp delivered career pathways with remote/hybrid options. Sankofa Health telehealth behavioral health services — no 45-minute drive. HerHealth Network coordinated MAT adherence support with reminders and pharmacy coordination. LifeBridge navigated transportation, childcare, food access. MCE supported 3 minority businesses through APEX Accelerators to federal contracting. M2C served veteran population from nearby base. SafeCogniCare monitored elder cognitive safety in the 65+ population.",
      measurement: "Transparency Dashboard showed multi-grant outcomes to all funders through single interface — each funder saw their grant's specific metrics. RPLICE tracked RE-AIM with rural adaptations. MCE tracked economic mobility: jobs, businesses, revenue. Workforce Dashboard tracked credential attainment and wage progression.",
      improvement: "MAP-GAP CQI revealed telehealth adoption was 3x higher than expected — rural populations preferred it once available. MG-PATR documented rural adaptation principles: intensity over frequency, technology over transportation, community ownership over external management. The Incubator identified expansion opportunities.",
    },
    platformContributions: [
      { platformName: "ThriveUp Academy", platformId: "thriveup", role: "Central Hub", specificAction: "Career pathways with remote options, case management, Transparency Dashboard showing multi-grant outcomes" },
      { platformName: "Sankofa Health", platformId: "sankofa", role: "Telehealth", specificAction: "Behavioral health telehealth services eliminating 45-minute drive barrier, opioid use disorder assessment and treatment coordination" },
      { platformName: "HerHealth Network", platformId: "herhealth", role: "MAT Adherence", specificAction: "Medication-Assisted Treatment adherence support, pharmacy coordination, preventing treatment discontinuation" },
      { platformName: "LifeBridge", platformId: "lifebridge", role: "Rural Navigation", specificAction: "Transportation, childcare, food access navigation in resource-limited rural setting" },
      { platformName: "MCE", platformId: "mce", role: "Economic Development", specificAction: "Social enterprise pathway, APEX Accelerators for minority businesses, federal contracting support" },
      { platformName: "M2C Transition", platformId: "m2c", role: "Veteran Services", specificAction: "Military-to-civilian career translation for nearby base population, VA benefit navigation" },
      { platformName: "SafeCogniCare", platformId: "safecognicare", role: "Elder Care", specificAction: "Cognitive safety monitoring for 65+ population (20% of region), elder abuse prevention" },
      { platformName: "RPLICE", platformId: "rplice", role: "Rural Fidelity", specificAction: "SALP fidelity monitoring with rural adaptations (intensity over frequency), RE-AIM evaluation" },
      { platformName: "Better Science Lab", platformId: "betterscience", role: "Research", specificAction: "Appalachian economic revitalization literature review, telehealth effectiveness validation" },
      { platformName: "The Incubator", platformId: "incubator", role: "Multi-Grant", specificAction: "Identified 4 aligned grants ($2.1M pipeline), mapped 80% requirement overlap to reduce application burden" },
    ],
    stakeholders: ["Regional Health Systems", "Community Colleges", "Employers (New Industries)", "Recovery Courts", "Community Health Workers", "Faith Communities", "County Government", "Chamber of Commerce"],
    disciplines: [
      { name: "Implementation Science", role: "CFIR barriers unique to rural setting, SALP adapted for intensity-over-frequency model, RE-AIM tracking across dispersed population" },
      { name: "Criminal Justice", role: "Drug court diversion, reentry support for substance-related incarceration, justice partner coordination across counties" },
      { name: "HR Management", role: "New-industry workforce pipelines (telehealth, renewable energy, remote tech), credential portability across state lines" },
      { name: "I-O Psychology", role: "Community resilience programming, combating learned helplessness, sustaining engagement in low-hope environments" },
    ],
    outcomes: {
      metrics: [
        { label: "Employment Rate", value: "+34%", change: "In target population", positive: true },
        { label: "Opioid Overdose Deaths", value: "-28%", change: "Year-over-year", positive: true },
        { label: "MAT Adherence", value: "87%", change: "+40% vs. pre-telehealth", positive: true },
        { label: "Businesses Launched (MCE)", value: "8", change: "3 won federal contracts", positive: true },
        { label: "Telehealth Adoption", value: "3x", change: "Higher than projected", positive: true },
        { label: "Brain Drain Reversal", value: "12%", change: "Young adults returning", positive: true },
      ],
      qualitative: [
        "Telehealth MAT adherence (HerHealth Network + Sankofa) proved MORE effective than in-person for this population — eliminating transportation barrier was transformative",
        "Community ownership emerged when local leaders saw Transparency Dashboard data proving the program was working — they became its advocates",
        "MCE APEX Accelerator support helped 3 minority-owned businesses win their first federal contracts — economic multiplier effect in the community",
        "SafeCogniCare elder monitoring prevented 4 cognitive safety incidents that would have resulted in institutional placement — keeping elders in community",
      ],
    },
    lessonsLearned: [
      "Rural implementation requires intensity-over-frequency adaptation — fewer sessions but longer, deeper engagement per session",
      "Technology removes barriers more than it creates them in rural settings — telehealth adoption exceeded projections by 3x once available",
      "Multi-grant alignment (The Incubator identifying 80% overlap) reduced application burden dramatically — same ecosystem, multiple funders",
      "Community ownership is non-negotiable — programs must be OF the community. Three Realities ground-truth assessment prevents 'parachute program' failure",
      "Elder population (SafeCogniCare) is an overlooked constituency — 20% of rural communities are 65+, and their cognitive safety needs are real but invisible",
    ],
    crossLinks: [
      { label: "Workforce Dashboard", url: "/workforce-dashboard" },
      { label: "Health & Wellness", url: "/health-wellness" },
      { label: "APEX Accelerators", url: "/apex-accelerators" },
      { label: "Transparency Dashboard", url: "/transparency" },
      { label: "Ecosystem Story", url: "/ecosystem-story" },
      { label: "Program Lifecycle", url: "/program-lifecycle" },
    ],
  },
];

function CaseStudyCard({ study, isSelected, onSelect }: { study: CaseStudy; isSelected: boolean; onSelect: () => void }) {
  const Icon = study.icon;
  const platformCount = study.platformContributions.length;
  return (
    <Card
      className={`cursor-pointer hover-elevate transition-all ${isSelected ? "ring-2 ring-primary" : ""}`}
      onClick={onSelect}
      data-testid={`card-case-study-${study.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`rounded-lg p-2 ${study.iconBg}`}>
            <Icon className={`h-5 w-5 ${study.color}`} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm">{study.title}</h3>
            <p className="text-xs text-muted-foreground">{study.subtitle}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-3">{study.challenge.summary.slice(0, 120)}...</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{study.setting.split("—")[0].trim()}</span>
          </div>
          <Badge variant="outline" className="text-[10px]">{platformCount} platforms</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function CaseStudyDetail({ study }: { study: CaseStudy }) {
  const [expandedSection, setExpandedSection] = useState<string | null>("challenge");
  const Icon = study.icon;

  const sections = [
    { id: "challenge", title: "The Challenge", icon: AlertTriangle, color: "text-red-500" },
    { id: "three-realities", title: "Three Realities Analysis", icon: Eye, color: "text-violet-500" },
    { id: "map-gap", title: "MAP-GAP Application", icon: RefreshCw, color: "text-primary" },
    { id: "platforms", title: "Platform Contributions", icon: Globe, color: "text-teal-500" },
    { id: "outcomes", title: "Measured Outcomes", icon: BarChart3, color: "text-emerald-500" },
    { id: "lessons", title: "Lessons Learned", icon: Lightbulb, color: "text-amber-500" },
  ];

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div className="space-y-6" data-testid={`detail-case-study-${study.id}`}>
      <Card className={`${study.iconBg} border`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className={`rounded-lg p-3 bg-background`}>
              <Icon className={`h-7 w-7 ${study.color}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{study.title}</h2>
              <p className="text-sm text-muted-foreground font-normal">{study.subtitle}</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Setting</p>
              <p className="font-medium">{study.setting.split("—")[0].trim()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Population</p>
              <p className="font-medium">{study.population}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Timeline</p>
              <p className="font-medium">{study.timeline}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Platforms Active</p>
              <p className="font-medium">{study.platformContributions.length} of 20</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {study.grantAlignment.map((grant) => (
              <Badge key={grant} variant="secondary" className="text-[10px]">{grant}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {sections.map((section) => {
        const SIcon = section.icon;
        const isExpanded = expandedSection === section.id;
        return (
          <Card key={section.id} data-testid={`card-section-${section.id}`}>
            <CardHeader
              className="cursor-pointer"
              onClick={() => toggleSection(section.id)}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <SIcon className={`h-4 w-4 ${section.color}`} />
                  {section.title}
                </div>
                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </CardTitle>
            </CardHeader>
            {isExpanded && (
              <CardContent className="animate-in fade-in-0 slide-in-from-top-2 duration-200">
                {section.id === "challenge" && (
                  <div className="space-y-4">
                    <p className="text-sm">{study.challenge.summary}</p>
                    <div className="space-y-2">
                      {study.challenge.dataPoints.map((point, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {section.id === "three-realities" && (
                  <div className="space-y-4">
                    {[
                      { label: "Reality 1: What Research Says", content: study.threeRealities.research, color: "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20" },
                      { label: "Reality 2: What Politics Allow", content: study.threeRealities.politics, color: "border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20" },
                      { label: "Reality 3: What Works on the Ground", content: study.threeRealities.ground, color: "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20" },
                    ].map((reality) => (
                      <div key={reality.label} className={`p-4 rounded-lg border ${reality.color}`}>
                        <h4 className="font-semibold text-sm mb-2">{reality.label}</h4>
                        <p className="text-xs text-muted-foreground">{reality.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {section.id === "map-gap" && (
                  <div className="space-y-4">
                    {[
                      { stage: "Discovery", step: "Step 1", content: study.mapGapApplication.discovery, icon: Search, color: "text-blue-600" },
                      { stage: "Assessment", step: "Step 2", content: study.mapGapApplication.assessment, icon: ClipboardCheck, color: "text-emerald-600" },
                      { stage: "Design", step: "Steps 2-3", content: study.mapGapApplication.design, icon: Wrench, color: "text-violet-600" },
                      { stage: "Implementation", step: "Step 4", content: study.mapGapApplication.implementation, icon: Rocket, color: "text-amber-600" },
                      { stage: "Measurement", step: "Step 5", content: study.mapGapApplication.measurement, icon: BarChart3, color: "text-rose-600" },
                      { stage: "Improvement", step: "Step 6", content: study.mapGapApplication.improvement, icon: RefreshCw, color: "text-indigo-600" },
                    ].map((phase) => {
                      const PIcon = phase.icon;
                      return (
                        <div key={phase.stage} className="flex items-start gap-3">
                          <div className="rounded-full bg-primary/10 p-2 shrink-0 mt-1">
                            <PIcon className={`h-4 w-4 ${phase.color}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm">{phase.stage}</h4>
                              <Badge variant="outline" className="text-[10px]">{phase.step}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{phase.content}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {section.id === "platforms" && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground mb-4">
                      Each platform contributes its domain expertise — no silos, no black boxes. Every platform sees what the others produce, evaluated from its lens.
                    </p>
                    {study.platformContributions.map((contrib) => (
                      <div key={contrib.platformId} className="flex items-start gap-3 p-3 rounded-md border hover-elevate" data-testid={`row-platform-${contrib.platformId}`}>
                        <div className="rounded-md bg-primary/10 p-2 shrink-0">
                          <Globe className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold">{contrib.platformName}</p>
                            <Badge variant="outline" className="text-[10px]">{contrib.role}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{contrib.specificAction}</p>
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-2">Four Disciplines Applied</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {study.disciplines.map((disc) => (
                          <div key={disc.name} className="p-3 rounded-md bg-muted/50">
                            <p className="text-xs font-semibold">{disc.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">{disc.role}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {section.id === "outcomes" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {study.outcomes.metrics.map((metric) => (
                        <Card key={metric.label}>
                          <CardContent className="p-3 text-center">
                            <p className={`text-2xl font-bold ${metric.positive ? "text-emerald-600" : "text-red-600"}`}>
                              {metric.value}
                            </p>
                            <p className="text-xs font-medium mt-1">{metric.label}</p>
                            <p className="text-[10px] text-muted-foreground">{metric.change}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Qualitative Outcomes</h4>
                      <div className="space-y-2">
                        {study.outcomes.qualitative.map((qual, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{qual}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {section.id === "lessons" && (
                  <div className="space-y-3">
                    {study.lessonsLearned.map((lesson, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-md border">
                        <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-1.5 shrink-0 mt-0.5">
                          <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                        </div>
                        <p className="text-sm">{lesson}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <ArrowRight className="h-4 w-4 text-primary" />
            Related Pages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {study.crossLinks.map((link) => (
              <Link key={link.url} href={link.url}>
                <Button variant="outline" size="sm" data-testid={`button-link-${link.label.toLowerCase().replace(/\s/g, '-')}`}>
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CaseStudiesPage() {
  const [selectedStudy, setSelectedStudy] = useState<string>(CASE_STUDIES[0].id);
  const study = CASE_STUDIES.find(s => s.id === selectedStudy)!;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" data-testid="page-case-studies">
      <SectionTutorial {...SECTION_TUTORIALS["case-studies"]} />
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <BookOpen className="h-6 w-6 text-primary" />
            Case Study Deep Dives
          </h1>
          <TrainingGuideButton moduleId="case-studies" />
        </div>
        <p className="text-muted-foreground mt-1" data-testid="text-page-subtitle">
          Real-world applications of the MAP-GAP framework across the 15-service-platform ecosystem. Each case study shows how collaborative intelligence — no silos, no black boxes — produces measurable outcomes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="grid-case-study-selector">
        {CASE_STUDIES.map((cs) => (
          <CaseStudyCard
            key={cs.id}
            study={cs}
            isSelected={selectedStudy === cs.id}
            onSelect={() => setSelectedStudy(cs.id)}
          />
        ))}
      </div>

      <CaseStudyDetail study={study} />

      <div className="flex flex-wrap gap-3">
        <Link href="/program-lifecycle">
          <Button variant="outline" size="sm" data-testid="button-to-lifecycle">
            <RefreshCw className="mr-2 h-4 w-4" /> Program Lifecycle
          </Button>
        </Link>
        <Link href="/program-designer">
          <Button variant="outline" size="sm" data-testid="button-to-designer">
            <Target className="mr-2 h-4 w-4" /> Program Designer
          </Button>
        </Link>
        <Link href="/mapgap-framework">
          <Button variant="outline" size="sm" data-testid="button-to-mapgap">
            <RefreshCw className="mr-2 h-4 w-4" /> MAP-GAP Framework
          </Button>
        </Link>
        <Link href="/transparency">
          <Button variant="outline" size="sm" data-testid="button-to-transparency">
            <Activity className="mr-2 h-4 w-4" /> Transparency Dashboard
          </Button>
        </Link>
        <Link href="/ecosystem-story">
          <Button variant="outline" size="sm" data-testid="button-to-ecosystem">
            <Globe className="mr-2 h-4 w-4" /> Ecosystem Story
          </Button>
        </Link>
      </div>
    </div>
  );
}