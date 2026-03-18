import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Shield, Briefcase, Users, GraduationCap,
  ArrowRight, CheckCircle2, AlertTriangle, Lightbulb,
  Target, BarChart3, Activity, RefreshCw, Layers,
  ChevronRight, ChevronDown, BookOpen, Scale,
  Microscope, Brain, Globe, Clock, Heart,
  MapPin, Building2, FileBarChart, Compass,
} from "lucide-react";

interface CaseStudyPhase {
  title: string;
  description: string;
  details: string[];
}

interface CaseStudy {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Shield;
  color: string;
  iconBg: string;
  setting: string;
  timeline: string;
  challenge: {
    summary: string;
    dataPoints: string[];
  };
  mapGapApplication: {
    summary: string;
    phases: CaseStudyPhase[];
  };
  implementation: {
    summary: string;
    platforms: string[];
    stakeholders: string[];
    disciplines: Array<{ name: string; role: string }>;
  };
  outcomes: {
    summary: string;
    metrics: Array<{ label: string; value: string; change: string; positive: boolean }>;
    qualitative: string[];
  };
  lessonsLearned: {
    summary: string;
    lessons: Array<{ title: string; detail: string }>;
    replicationNotes: string;
  };
  crossLinks: Array<{ label: string; url: string }>;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: "substance-prevention",
    title: "Substance Use Prevention",
    subtitle: "Drug-Free Communities Coalition",
    icon: Shield,
    color: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    setting: "Urban Community, Southeast Texas",
    timeline: "24-Month Program Cycle (Year 1-2)",
    challenge: {
      summary: "A mid-size urban community faced escalating youth substance use, particularly vaping and marijuana. Schools reported a 40% increase in substance-related disciplinary actions over two years. Community survey data showed declining perception of risk among 12-17 year olds, and parent awareness of new substance delivery methods was critically low.",
      dataPoints: [
        "42% of 8th graders reported vaping in past 30 days (vs. 28% state average)",
        "Youth perception of risk for marijuana use dropped 18% in two years",
        "Only 3 of 12 required coalition sectors were actively engaged",
        "No coordinated prevention curriculum across district schools",
        "Parent awareness of vaping prevalence was below 25%",
      ],
    },
    mapGapApplication: {
      summary: "The MAP-GAP framework was deployed to systematically identify gaps, design evidence-based interventions, and coordinate a 12-sector coalition for sustained prevention.",
      phases: [
        {
          title: "Step 1: Identify the Problem",
          description: "Community health assessment and school discipline data revealed the scope. GIS mapping identified geographic concentration of substance availability near schools.",
          details: [
            "Administered SAMHSA Community Readiness Assessment",
            "Analyzed 3 years of Youth Risk Behavior Survey data",
            "Mapped retail tobacco/vape outlets within 1000ft of schools",
            "Conducted focus groups with youth, parents, and educators",
          ],
        },
        {
          title: "Step 2: Design the Intervention",
          description: "Three Realities analysis ensured the program fit local context. Selected Botvin LifeSkills and Too Good for Drugs curricula based on evidence and community fit.",
          details: [
            "Research: SAMHSA Strategic Prevention Framework, risk/protective factor model",
            "Politics: CDC/ONDCP DFC requirements, state marijuana legalization complexity",
            "Ground: Youth prefer peer-led programming; schools need bell-schedule compatible sessions",
          ],
        },
        {
          title: "Step 3: Coordinate Stakeholders",
          description: "Built a 12-sector coalition from initial 3-sector engagement. Each sector received role-specific dashboards with shared SMART goals.",
          details: [
            "Recruited healthcare, business, law enforcement, faith-based, and civic sectors",
            "Established quarterly coalition meetings with data review protocols",
            "Created shared dashboard with real-time SALP fidelity indicators",
          ],
        },
        {
          title: "Step 4: Execute with Fidelity",
          description: "SALP indicators tracked curriculum delivery, facilitator adherence, and participant engagement in real time across all school sites.",
          details: [
            "Trained 8 facilitators with competency verification before classroom entry",
            "Delivered 48 sessions per quarter across 6 school sites",
            "Monitored dosage hours: target 2 hours/student/month",
          ],
        },
        {
          title: "Step 5: Measure & Improve",
          description: "Continuous quality improvement loop identified delivery gaps at 2 school sites where facilitator turnover impacted fidelity scores.",
          details: [
            "Quarterly outcome reviews against baseline data",
            "Root cause analysis for 2 sites with fidelity below 70%",
            "Mid-cycle curriculum adaptation for vaping-specific content",
          ],
        },
        {
          title: "Step 6: Capture & Replicate",
          description: "MG-PATR protocol documented transferable components and context-dependent adaptations for replication in neighboring communities.",
          details: [
            "Documented 12 transferable core components",
            "Identified 5 context-dependent elements requiring local adaptation",
            "Created replication guide with Three Realities template",
          ],
        },
      ],
    },
    implementation: {
      summary: "Full ecosystem deployment across 6 school sites, community health centers, and coalition partner organizations.",
      platforms: ["ThriveUp Academy", "DFC Command Center", "Coalition Dashboard", "Dosage Tracking", "Sankofa Health", "Facilitator Hub"],
      stakeholders: ["Schools (6 sites)", "Law Enforcement", "Healthcare Providers", "Faith-Based Organizations", "Business Community", "Parents/Families", "Youth Advisory Council", "Civic Organizations", "Media Partners", "Higher Education", "Mental Health Providers", "Community Service Organizations"],
      disciplines: [
        { name: "Implementation Science", role: "CFIR and RE-AIM frameworks guided curriculum selection, adaptation, and fidelity monitoring" },
        { name: "Criminal Justice", role: "Youth diversion programs replaced punitive discipline; restorative justice circles implemented" },
        { name: "HR Management", role: "CHW workforce pipeline trained in substance use prevention; facilitator competency models ensured quality" },
        { name: "I-O Psychology", role: "Behavioral nudge architecture for youth engagement; perception of risk messaging calibrated to developmental stage" },
      ],
    },
    outcomes: {
      summary: "After 24 months, measurable improvements across all 4 CDC/ONDCP core measures with sustained coalition engagement.",
      metrics: [
        { label: "Youth Vaping (30-day)", value: "28%", change: "-14pp", positive: true },
        { label: "Perception of Risk", value: "72%", change: "+18pp", positive: true },
        { label: "Coalition Sectors", value: "12/12", change: "+9", positive: true },
        { label: "Curriculum Fidelity", value: "87%", change: "Above target", positive: true },
        { label: "Parent Awareness", value: "68%", change: "+43pp", positive: true },
        { label: "Disciplinary Actions", value: "-31%", change: "Reduction", positive: true },
      ],
      qualitative: [
        "Youth Advisory Council became self-sustaining and initiated peer-led campaigns",
        "3 coalition partners secured independent prevention funding aligned with shared goals",
        "School district adopted prevention curriculum as standard programming",
        "Parent engagement increased from sporadic attendance to regular participation in community events",
      ],
    },
    lessonsLearned: {
      summary: "Key insights that inform future DFC deployments and prevention program design.",
      lessons: [
        { title: "Facilitator Retention is Critical", detail: "Two sites experienced fidelity drops when trained facilitators left. Building a deeper bench of certified facilitators and cross-training is essential for sustained quality." },
        { title: "Youth Voice Drives Engagement", detail: "Peer-led components outperformed adult-delivered sessions in engagement metrics. Future programs should embed youth leadership from design phase, not just execution." },
        { title: "Data Transparency Builds Coalition Trust", detail: "Sharing real-time SALP fidelity data with all coalition sectors — including when numbers were bad — built trust faster than polished quarterly reports." },
        { title: "Adapt Content, Not Structure", detail: "Vaping-specific content additions were needed mid-cycle, but the MAP-GAP structure and SALP indicators remained stable. Content can flex; measurement infrastructure should not." },
      ],
      replicationNotes: "MG-PATR analysis identified that coalition-building timelines, school bell-schedule integration, and youth advisory structures are transferable. Substance-specific content, law enforcement partnerships, and parent engagement strategies require Three Realities adaptation for each new community.",
    },
    crossLinks: [
      { label: "MAP-GAP Framework", url: "/mapgap-framework" },
      { label: "Transparency Dashboard", url: "/transparency" },
      { label: "DFC Command Center", url: "/dfc-command-center" },
      { label: "Prevention Hub", url: "/prevention" },
      { label: "Coalition Dashboard", url: "/coalition" },
    ],
  },
  {
    id: "workforce-reentry",
    title: "Workforce Reentry",
    subtitle: "Second Chance Act Career Pathways",
    icon: Briefcase,
    color: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    setting: "Metropolitan Area, Mid-Atlantic Region",
    timeline: "18-Month Pilot with 36-Month Tracking",
    challenge: {
      summary: "A metropolitan area faced a 67% recidivism rate within 3 years of release. Returning citizens encountered fragmented service delivery: corrections, probation, workforce agencies, and community organizations operated in silos. Housing instability within the first 72 hours was the leading predictor of re-offense.",
      dataPoints: [
        "67% recidivism rate within 36 months of release",
        "Average time to first employment: 4.2 months post-release",
        "Only 22% of returning citizens had stable housing at 30 days",
        "5 separate agencies managing overlapping caseloads with no data sharing",
        "Employer willingness to hire justice-involved individuals: 18%",
      ],
    },
    mapGapApplication: {
      summary: "MAP-GAP was applied to unify fragmented reentry services into a coordinated pathway from pre-release planning through sustained community stability.",
      phases: [
        {
          title: "Step 1: Identify the Problem",
          description: "Institutional data from corrections, court records, and community organizations revealed the critical failure points in the reentry pipeline.",
          details: [
            "Analyzed 5 years of recidivism data by risk factor category",
            "Mapped service availability gaps by geography and service type",
            "Conducted interviews with 50 formerly incarcerated individuals",
            "Assessed employer attitudes and Ban-the-Box policy landscape",
          ],
        },
        {
          title: "Step 2: Design the Intervention",
          description: "Risk-Needs-Responsivity (RNR) assessment framework was adapted through Three Realities analysis for local implementation.",
          details: [
            "Research: RNR model, SAMHSA GAINS Center guidelines, cognitive-behavioral evidence base",
            "Politics: Second Chance Act requirements, state sentencing reform, victims' rights considerations",
            "Ground: Housing within 72 hours is critical; family reunification complexity; digital divide barriers",
          ],
        },
        {
          title: "Step 3: Coordinate Stakeholders",
          description: "Built a cross-agency coordination team linking corrections, probation, workforce boards, housing authorities, and community mentors.",
          details: [
            "Established data-sharing agreements across 5 agencies",
            "Created unified case management dashboard visible to all authorized parties",
            "Trained 12 peer mentors (formerly incarcerated) as community navigators",
          ],
        },
        {
          title: "Step 4: Execute with Fidelity",
          description: "Pre-release planning began 90 days before release. SALP indicators tracked contact frequency, service engagement, and milestone completion.",
          details: [
            "Pre-release assessment and transition plan initiated at 90 days",
            "Housing secured within 72 hours for 85% of participants",
            "Weekly case manager contact for first 90 days, biweekly thereafter",
          ],
        },
        {
          title: "Step 5: Measure & Improve",
          description: "6-month and 12-month outcome reviews identified that employment retention was the weakest link — triggering a targeted employer engagement initiative.",
          details: [
            "6-month recidivism check: 12% (vs. 31% historical comparison)",
            "Employment placement rate strong, but 30-day retention was 62% (target: 80%)",
            "Root cause: employer support structures insufficient; added workplace mentor program",
          ],
        },
        {
          title: "Step 6: Capture & Replicate",
          description: "MG-PATR documented the pre-release planning model, peer mentor training, and employer engagement toolkit for adaptation to other jurisdictions.",
          details: [
            "Peer mentor training curriculum documented for replication",
            "Employer engagement toolkit created with ROI data for hiring managers",
            "Three Realities template developed for new jurisdiction assessment",
          ],
        },
      ],
    },
    implementation: {
      summary: "Cross-agency deployment connecting corrections facilities, probation offices, workforce centers, housing authorities, and community organizations.",
      platforms: ["ThriveUp Academy", "LifeBridge", "Reentry Dashboard", "Case Management", "Outcome Reporting", "Workforce Dashboard"],
      stakeholders: ["Department of Corrections", "Probation & Parole", "Workforce Development Board", "Housing Authority", "Community Mentors", "Employers (12 partners)", "Behavioral Health Providers", "Legal Aid", "Faith-Based Organizations", "Family Support Services"],
      disciplines: [
        { name: "Implementation Science", role: "EPIS framework structured the institutional-to-community transition; fidelity tracking ensured evidence-based practices were followed" },
        { name: "Criminal Justice", role: "Risk-Needs-Responsivity assessment drove individualized reentry plans; restorative justice addressed community harm" },
        { name: "HR Management", role: "Workforce readiness assessment, credential recovery, employer engagement, and 90-day retention tracking" },
        { name: "I-O Psychology", role: "Cognitive-behavioral intervention design; motivation interviewing training; engagement systems for critical first 90 days" },
      ],
    },
    outcomes: {
      summary: "Pilot cohort of 120 participants showed significant improvement across all measured reentry outcomes at 12-month follow-up.",
      metrics: [
        { label: "12-Month Recidivism", value: "19%", change: "-48pp", positive: true },
        { label: "Housing at 30 Days", value: "87%", change: "+65pp", positive: true },
        { label: "Employment at 90 Days", value: "74%", change: "+52pp", positive: true },
        { label: "90-Day Job Retention", value: "78%", change: "Above target", positive: true },
        { label: "Service Coordination", value: "Unified", change: "5 agencies integrated", positive: true },
        { label: "Employer Partners", value: "12", change: "+10 new", positive: true },
      ],
      qualitative: [
        "Peer mentor model created a pipeline: 4 participants became mentors themselves within 12 months",
        "Cross-agency data sharing reduced duplicate assessments from 5 to 1 per participant",
        "Employer retention improved after workplace mentor program was introduced at 6-month review",
        "Family reunification support reduced a key re-offense risk factor for participants with children",
      ],
    },
    lessonsLearned: {
      summary: "Critical insights for scaling reentry programs across jurisdictions with different legal and community landscapes.",
      lessons: [
        { title: "72-Hour Housing is Non-Negotiable", detail: "Participants without stable housing within 72 hours of release were 4x more likely to re-offend. Housing-first approaches must be built into every reentry plan — not treated as a referral." },
        { title: "Peer Mentors Outperform Professional-Only Models", detail: "Participants paired with formerly incarcerated peer mentors had 23% better engagement than those with professional-only case management. Lived experience creates trust that credentials alone cannot." },
        { title: "Employer ROI Data Changes Minds", detail: "Shifting the employer conversation from 'give someone a chance' to 'here is the retention data and tax credit ROI' increased employer participation from 2 to 12 partners." },
        { title: "Pre-Release Planning is the Intervention", detail: "The 90-day pre-release planning process was more predictive of success than any post-release service. Programs that start at the gate are already behind." },
      ],
      replicationNotes: "MG-PATR identified that the pre-release timeline, peer mentor model, and unified case management dashboard are transferable. Employer landscapes, housing market dynamics, and legal frameworks (Ban-the-Box, sentencing reform) require Three Realities assessment for each new jurisdiction.",
    },
    crossLinks: [
      { label: "MAP-GAP Framework", url: "/mapgap-framework" },
      { label: "Transparency Dashboard", url: "/transparency" },
      { label: "Reentry Dashboard", url: "/reentry" },
      { label: "Justice Partners", url: "/justice-partners" },
      { label: "Workforce Dashboard", url: "/workforce-dashboard" },
    ],
  },
  {
    id: "youth-development",
    title: "Youth Development",
    subtitle: "ThriveUp Academy Implementation",
    icon: GraduationCap,
    color: "text-violet-600 dark:text-violet-400",
    iconBg: "bg-violet-100 dark:bg-violet-900/40",
    setting: "Title I School District, Urban Core",
    timeline: "Academic Year Pilot (10 months)",
    challenge: {
      summary: "A Title I school district with 82% economically disadvantaged students faced compounding challenges: low academic engagement, high suspension rates, minimal social-emotional learning infrastructure, and no structured career exposure for students. The district had received grant funding but lacked implementation capacity to deploy programs with fidelity.",
      dataPoints: [
        "Chronic absenteeism rate: 28% (vs. 14% state average)",
        "Suspension rate: 3.2x higher than district average for Black male students",
        "SEL programming existed in name only — no fidelity tracking, no dosage measurement",
        "0% of students had completed a career readiness assessment",
        "Teacher burnout: 34% turnover rate in the prior year",
      ],
    },
    mapGapApplication: {
      summary: "MAP-GAP was deployed to transform scattered youth programs into a cohesive, gamified learning ecosystem with measurable fidelity across academic, SEL, and career domains.",
      phases: [
        {
          title: "Step 1: Identify the Problem",
          description: "Student-level data analysis combined with teacher and parent focus groups revealed that disengagement — not ability — was the primary driver of poor outcomes.",
          details: [
            "Analyzed attendance, discipline, and grade data for 3 years of trends",
            "Surveyed 200 students on engagement, belonging, and career awareness",
            "Assessed existing SEL programs against evidence-based standards",
            "Mapped teacher capacity and training gaps for program delivery",
          ],
        },
        {
          title: "Step 2: Design the Intervention",
          description: "Three Realities analysis identified that traditional classroom SEL delivery was failing because it felt punitive to students. Gamified, student-driven design was the ground-level reality.",
          details: [
            "Research: CASEL competency framework, gamification learning theory, career development models",
            "Politics: Title I/IV funding requirements, district curriculum committee approval processes",
            "Ground: Students respond to avatar-based systems and peer competition; teachers need minimal prep burden",
          ],
        },
        {
          title: "Step 3: Coordinate Stakeholders",
          description: "Unified district leadership, teachers, parents, community mentors, and local employers around shared outcome goals with role-specific dashboards.",
          details: [
            "Trained 24 teachers with competency-verified onboarding process",
            "Recruited 8 community mentors for career pathway support",
            "Established parent engagement portal with progress visibility",
          ],
        },
        {
          title: "Step 4: Execute with Fidelity",
          description: "ThriveUp Academy platform deployed across 4 schools with SALP fidelity indicators tracking lesson delivery, student engagement, and dosage hours.",
          details: [
            "Weekly lesson delivery tracked against curriculum schedule",
            "Student engagement measured through platform interaction data",
            "Dosage target: 3 hours/student/week minimum across all modules",
          ],
        },
        {
          title: "Step 5: Measure & Improve",
          description: "Mid-year review revealed that 1 of 4 schools had low teacher adoption. Root cause analysis led to targeted professional development and a teacher champion model.",
          details: [
            "3 schools exceeded engagement targets; 1 school at 45% of target",
            "Teacher adoption barrier: perceived technology complexity",
            "Solution: Teacher champion model — 2 power users per school supporting peers",
          ],
        },
        {
          title: "Step 6: Capture & Replicate",
          description: "End-of-year MG-PATR analysis documented the teacher champion model as a critical success factor for district-wide replication.",
          details: [
            "Teacher champion model documented as required component for replication",
            "Student engagement patterns analyzed for grade-level customization",
            "Parent portal usage data informed redesign of family communication strategy",
          ],
        },
      ],
    },
    implementation: {
      summary: "Full ThriveUp Academy deployment across 4 Title I schools serving 1,200 students with integrated SEL, academic support, and career exposure.",
      platforms: ["ThriveUp Academy", "Panther Village", "Career Explorer", "Teacher Dashboard", "Parent Dashboard", "Dosage Tracking"],
      stakeholders: ["School District Leadership", "24 Teachers", "1,200 Students", "8 Community Mentors", "Parents/Families", "Local Employers (Career Day)", "School Counselors", "After-School Program Partners"],
      disciplines: [
        { name: "Implementation Science", role: "CASEL-aligned curriculum mapped to CFIR constructs; SALP fidelity indicators for every lesson module" },
        { name: "Criminal Justice", role: "Restorative practices replaced suspensions; conflict resolution modules integrated into SEL curriculum" },
        { name: "HR Management", role: "Career pathway assessments and exposure events; teacher professional development competency tracking" },
        { name: "I-O Psychology", role: "Gamification design (avatars, houses, quests, wallet system); engagement nudges calibrated by grade level" },
      ],
    },
    outcomes: {
      summary: "Academic year results across 4 schools showed measurable improvement in engagement, behavior, and career readiness with strong fidelity scores.",
      metrics: [
        { label: "Chronic Absenteeism", value: "19%", change: "-9pp", positive: true },
        { label: "Suspension Rate", value: "-42%", change: "Reduction", positive: true },
        { label: "SEL Competency Growth", value: "+28%", change: "Pre/post assessment", positive: true },
        { label: "Career Assessment Completion", value: "94%", change: "From 0%", positive: true },
        { label: "Student Engagement", value: "3.4 hrs/wk", change: "Above 3hr target", positive: true },
        { label: "Curriculum Fidelity", value: "83%", change: "Across all sites", positive: true },
      ],
      qualitative: [
        "Students reported feeling 'seen' by the avatar and house system — belonging increased measurably",
        "Teacher turnover in participating classrooms dropped to 12% (vs. 34% district-wide)",
        "Parent portal adoption reached 61% — highest digital engagement the district had achieved",
        "3 students initiated a peer mentoring program independently, inspired by the mentor module",
      ],
    },
    lessonsLearned: {
      summary: "Insights for scaling gamified youth development platforms across diverse school settings.",
      lessons: [
        { title: "Gamification is Not Optional", detail: "Traditional SEL delivery had less than 30% voluntary engagement. Gamified delivery achieved 78%. For youth populations, engagement design is not a feature — it is the intervention." },
        { title: "Teacher Champions Scale Better Than Mandates", detail: "The school that struggled had a top-down mandate without teacher buy-in. The schools that thrived had teacher champions who modeled usage. Peer influence works for adults too." },
        { title: "Career Exposure Changes Behavior", detail: "Students who completed career assessments showed 2x the improvement in academic engagement. Connecting 'why am I learning this' to 'what I want to become' is a powerful motivator." },
        { title: "Parent Visibility Reduces Chronic Absenteeism", detail: "Schools where parent portal adoption exceeded 50% had the largest absenteeism reductions. Parents who can see progress in real time become accountability partners." },
      ],
      replicationNotes: "MG-PATR identified that the gamification framework, house system, and teacher champion model are transferable. Grade-level content, career pathway options, and parent communication strategies require Three Realities adaptation for each new district's demographic and cultural context.",
    },
    crossLinks: [
      { label: "MAP-GAP Framework", url: "/mapgap-framework" },
      { label: "Transparency Dashboard", url: "/transparency" },
      { label: "Panther Village", url: "/academy" },
      { label: "Teacher Dashboard", url: "/teacher-dashboard" },
      { label: "Parent Dashboard", url: "/parents/dashboard" },
    ],
  },
  {
    id: "coalition-building",
    title: "Coalition Building",
    subtitle: "12-Sector Community Coalition",
    icon: Users,
    color: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    setting: "Suburban/Rural Mixed Community, Southern Region",
    timeline: "36-Month Coalition Development Cycle",
    challenge: {
      summary: "A suburban/rural community received DFC (Drug-Free Communities) funding but had no existing coalition infrastructure. Previous attempts at community coalitions had failed within 18 months due to lack of shared data, unclear roles, and 'meeting fatigue.' The community needed all 12 required sectors engaged with measurable accountability.",
      dataPoints: [
        "2 prior coalition attempts failed within 18 months",
        "Only healthcare and schools were consistently engaged in community health",
        "No shared data infrastructure — each organization tracked its own metrics in isolation",
        "Community readiness assessment scored 4/9 (Vague Awareness stage)",
        "'Meeting fatigue' cited by 73% of surveyed community leaders as barrier to participation",
      ],
    },
    mapGapApplication: {
      summary: "MAP-GAP was applied to build coalition infrastructure from scratch, with transparent accountability systems that maintained engagement by demonstrating value — not just requesting attendance.",
      phases: [
        {
          title: "Step 1: Identify the Problem",
          description: "Community readiness assessment and stakeholder mapping revealed that the problem wasn't unwillingness — it was lack of visible impact from prior coalition efforts.",
          details: [
            "Conducted Community Readiness Model assessment across all sectors",
            "Mapped existing community assets and identified sector representation gaps",
            "Surveyed 40 community leaders on barriers to coalition participation",
            "Analyzed why 2 prior coalition efforts had dissolved",
          ],
        },
        {
          title: "Step 2: Design the Intervention",
          description: "Three Realities analysis revealed that the traditional 'monthly meeting' model was the problem. The intervention was a data-driven, dashboard-first coalition with purpose-built accountability.",
          details: [
            "Research: Community coalition effectiveness research, SPF model, collective impact framework",
            "Politics: DFC 12-sector requirement, local government buy-in needed, school board politics",
            "Ground: Leaders want impact, not meetings. Dashboard visibility replaces meeting-heavy models.",
          ],
        },
        {
          title: "Step 3: Coordinate Stakeholders",
          description: "Recruited sector representatives by leading with data dashboards — showing what shared measurement looks like before asking for commitment.",
          details: [
            "Created sector-specific value propositions for each of 12 required sectors",
            "Demonstrated shared dashboard prototype before requesting MOUs",
            "Established tiered engagement model: Core Team (monthly), Full Coalition (quarterly), Community (annually)",
          ],
        },
        {
          title: "Step 4: Execute with Fidelity",
          description: "Coalition operations tracked through SALP indicators: meeting attendance, action item completion, sector engagement frequency, and shared goal progress.",
          details: [
            "SALP indicators tracked participation, action item completion, and data contribution",
            "Each sector assigned specific deliverables aligned with SMART goals",
            "Quarterly data reviews replaced lengthy narrative reports",
          ],
        },
        {
          title: "Step 5: Measure & Improve",
          description: "Year 1 review showed 3 sectors at risk of disengagement. Root cause: their data wasn't being reflected in coalition dashboards. Solution: expanded data integration.",
          details: [
            "9 of 12 sectors fully engaged at Year 1; 3 at risk",
            "At-risk sectors: media, civic organizations, faith-based — felt data contribution was one-way",
            "Added bidirectional data flows and sector-specific impact reports",
          ],
        },
        {
          title: "Step 6: Capture & Replicate",
          description: "The 'Dashboard-First Coalition' model was documented through MG-PATR as a replicable framework for building coalitions in communities with meeting fatigue.",
          details: [
            "Dashboard-First Coalition model documented with implementation timeline",
            "Tiered engagement model (Core/Full/Community) validated as sustainable",
            "Sector-specific recruitment playbooks created for each of 12 sectors",
          ],
        },
      ],
    },
    implementation: {
      summary: "Full 12-sector coalition deployment with shared data infrastructure, tiered engagement model, and transparent accountability systems.",
      platforms: ["DFC Command Center", "Coalition Dashboard", "DFC Reporting", "Platform Metrics", "Transparency Dashboard", "MAP-GAP CQI"],
      stakeholders: ["Youth (Youth Advisory Council)", "Parents/Families", "Business Community", "Media", "Schools", "Youth-Serving Organizations", "Law Enforcement", "Religious/Fraternal", "Civic/Volunteer", "Healthcare", "State/Local Government", "Other Substance Use Organizations"],
      disciplines: [
        { name: "Implementation Science", role: "Collective impact framework operationalized through CFIR; coalition readiness tracked using validated instruments" },
        { name: "Criminal Justice", role: "Law enforcement sector integration; juvenile justice data sharing agreements; diversion program coordination" },
        { name: "HR Management", role: "Coalition staffing model; volunteer management systems; sector representative role definitions" },
        { name: "I-O Psychology", role: "Meeting design psychology; engagement retention systems; value demonstration as motivation strategy" },
      ],
    },
    outcomes: {
      summary: "At 36 months, the coalition achieved full 12-sector engagement with measurable community-level substance use prevention outcomes.",
      metrics: [
        { label: "Sectors Engaged", value: "12/12", change: "From 3/12", positive: true },
        { label: "Community Readiness", value: "7/9", change: "+3 levels", positive: true },
        { label: "Meeting Attendance", value: "88%", change: "Above 80% target", positive: true },
        { label: "Action Item Completion", value: "82%", change: "Above 75% target", positive: true },
        { label: "Coalition Sustainability", value: "36+ months", change: "Longest in community history", positive: true },
        { label: "Data Sharing Partners", value: "8", change: "From 0", positive: true },
      ],
      qualitative: [
        "Coalition members reported feeling 'valued' rather than 'used' — a first for many sector representatives",
        "3 sectors (business, media, faith-based) independently initiated prevention campaigns using coalition data",
        "Community readiness moved from 'Vague Awareness' to 'Stabilization' — a 3-level improvement in 36 months",
        "The coalition model was presented at a national DFC conference as a replicable framework",
      ],
    },
    lessonsLearned: {
      summary: "Insights for building sustainable coalitions in communities with prior failed attempts and engagement fatigue.",
      lessons: [
        { title: "Lead with Data, Not Meetings", detail: "Showing sector representatives a live dashboard with their data integrated before asking for commitment changed the recruitment conversation from 'attend meetings' to 'see your impact.'" },
        { title: "Tiered Engagement Prevents Fatigue", detail: "Not everyone needs to attend every meeting. Core team monthly, full coalition quarterly, community annually. This tripled engagement compared to the 'everyone monthly' model that had failed twice." },
        { title: "Bidirectional Data Creates Ownership", detail: "Sectors that only contributed data without seeing it reflected in dashboards disengaged. Adding sector-specific impact reports turned data contributors into data owners." },
        { title: "Previous Failures are Data, Not Destiny", detail: "The community had failed twice before. Analyzing those failures through MAP-GAP revealed specific, addressable problems — not a fundamental inability to collaborate." },
      ],
      replicationNotes: "MG-PATR identified that the Dashboard-First model, tiered engagement structure, and sector recruitment playbooks are transferable. Community readiness levels, political dynamics, and sector availability vary significantly and require full Three Realities assessment before deployment.",
    },
    crossLinks: [
      { label: "MAP-GAP Framework", url: "/mapgap-framework" },
      { label: "Transparency Dashboard", url: "/transparency" },
      { label: "DFC Command Center", url: "/dfc-command-center" },
      { label: "Coalition Dashboard", url: "/coalition" },
      { label: "DFC Readiness", url: "/dfc-readiness" },
    ],
  },
];

function PhaseCard({ phase, index, isExpanded, onToggle }: {
  phase: CaseStudyPhase; index: number; isExpanded: boolean; onToggle: () => void;
}) {
  const stepIcons = [Microscope, Target, Users, CheckCircle2, BarChart3, RefreshCw];
  const stepColors = [
    "from-blue-500 to-blue-600",
    "from-violet-500 to-violet-600",
    "from-emerald-500 to-emerald-600",
    "from-amber-500 to-amber-600",
    "from-rose-500 to-rose-600",
    "from-indigo-500 to-indigo-600",
  ];
  const Icon = stepIcons[index] || Target;
  const gradient = stepColors[index] || stepColors[0];

  return (
    <div
      className={`rounded-md border p-4 cursor-pointer transition-all ${isExpanded ? "ring-2 ring-primary/20" : ""}`}
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
      tabIndex={0}
      role="button"
      aria-expanded={isExpanded}
      data-testid={`phase-${index}`}
    >
      <div className="flex items-center gap-3">
        <div className={`rounded-full bg-gradient-to-br ${gradient} p-2 shrink-0`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold">{phase.title}</h4>
          <p className="text-xs text-muted-foreground">{phase.description}</p>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </div>
      {isExpanded && (
        <ul className="mt-3 space-y-1.5 pl-11 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          {phase.details.map((detail, i) => (
            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
              <ArrowRight className="h-3 w-3 text-primary shrink-0 mt-0.5" />
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CaseStudyView({ study }: { study: CaseStudy }) {
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set());
  const [activeSection, setActiveSection] = useState("challenge");
  const Icon = study.icon;

  function togglePhase(index: number) {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  const sections = [
    { id: "challenge", label: "Challenge", icon: AlertTriangle },
    { id: "mapgap", label: "MAP-GAP", icon: RefreshCw },
    { id: "implementation", label: "Implementation", icon: Activity },
    { id: "outcomes", label: "Outcomes", icon: BarChart3 },
    { id: "lessons", label: "Lessons", icon: Lightbulb },
  ];

  return (
    <div className="space-y-6" data-testid={`case-study-${study.id}`}>
      <div className="flex items-start gap-4">
        <div className={`rounded-lg ${study.iconBg} p-3 shrink-0`}>
          <Icon className={`h-6 w-6 ${study.color}`} />
        </div>
        <div>
          <h2 className="text-xl font-bold">{study.title}</h2>
          <p className="text-sm text-muted-foreground">{study.subtitle}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              <MapPin className="h-3 w-3 mr-1" />
              {study.setting}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {study.timeline}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="flex flex-wrap gap-1">
          {sections.map((s) => {
            const SIcon = s.icon;
            return (
              <TabsTrigger key={s.id} value={s.id} className="text-xs" data-testid={`tab-${study.id}-${s.id}`}>
                <SIcon className="h-3.5 w-3.5 mr-1" />
                {s.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="challenge" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{study.challenge.summary}</p>
          <Card>
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileBarChart className="h-4 w-4 text-primary" />
                Baseline Data Points
              </h4>
              <ul className="space-y-2">
                {study.challenge.dataPoints.map((point, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapgap" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{study.mapGapApplication.summary}</p>
          <div className="space-y-3">
            {study.mapGapApplication.phases.map((phase, i) => (
              <PhaseCard
                key={i}
                phase={phase}
                index={i}
                isExpanded={expandedPhases.has(i)}
                onToggle={() => togglePhase(i)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="implementation" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{study.implementation.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Active Platforms
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {study.implementation.platforms.map((p) => (
                    <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Stakeholders Engaged
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {study.implementation.stakeholders.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Four Disciplines Applied
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {study.implementation.disciplines.map((d) => {
                  const disciplineIcons: Record<string, typeof Microscope> = {
                    "Implementation Science": Microscope,
                    "Criminal Justice": Scale,
                    "HR Management": Briefcase,
                    "I-O Psychology": Brain,
                  };
                  const DIcon = disciplineIcons[d.name] || Target;
                  return (
                    <div key={d.name} className="p-3 rounded-md border">
                      <div className="flex items-center gap-2 mb-1.5">
                        <DIcon className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-semibold">{d.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{d.role}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outcomes" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{study.outcomes.summary}</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {study.outcomes.metrics.map((m) => (
              <Card key={m.label} data-testid={`metric-${study.id}-${m.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{m.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
                  <Badge
                    variant="outline"
                    className={`mt-2 text-[10px] ${m.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {m.positive ? <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> : <AlertTriangle className="h-2.5 w-2.5 mr-1" />}
                    {m.change}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" />
                Qualitative Outcomes
              </h4>
              <ul className="space-y-2">
                {study.outcomes.qualitative.map((q, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lessons" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{study.lessonsLearned.summary}</p>

          <div className="space-y-3">
            {study.lessonsLearned.lessons.map((lesson, i) => (
              <Card key={i} data-testid={`lesson-${study.id}-${i}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2 shrink-0">
                      <Lightbulb className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">{lesson.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{lesson.detail}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-2 border-indigo-300/50 dark:border-indigo-700/50 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-900/10">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                MG-PATR Replication Notes
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{study.lessonsLearned.replicationNotes}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap gap-2 pt-2">
        {study.crossLinks.map((link) => (
          <Link key={link.url} href={link.url}>
            <Button variant="outline" size="sm" data-testid={`link-${study.id}-${link.label.toLowerCase().replace(/\s+/g, '-')}`}>
              {link.label}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function CaseStudiesPage() {
  const [activeStudy, setActiveStudy] = useState(CASE_STUDIES[0].id);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Case Study Deep Dives</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl" data-testid="text-page-subtitle">
          Detailed case studies demonstrating the MAP-GAP methodology in action across substance use prevention,
          workforce reentry, youth development, and coalition building. Each study follows the complete cycle:
          Challenge, MAP-GAP Application, Implementation, Measured Outcomes, and Lessons Learned.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CASE_STUDIES.map((study) => {
          const Icon = study.icon;
          const isActive = activeStudy === study.id;
          return (
            <Card
              key={study.id}
              className={`cursor-pointer transition-all hover-elevate ${isActive ? "ring-2 ring-primary" : ""}`}
              onClick={() => setActiveStudy(study.id)}
              data-testid={`card-select-${study.id}`}
            >
              <CardContent className="p-4 text-center">
                <div className={`mx-auto w-10 h-10 rounded-lg ${study.iconBg} flex items-center justify-center mb-2`}>
                  <Icon className={`h-5 w-5 ${study.color}`} />
                </div>
                <h3 className="text-sm font-semibold">{study.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{study.subtitle}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {CASE_STUDIES.filter(s => s.id === activeStudy).map(study => (
        <CaseStudyView key={study.id} study={study} />
      ))}

      <Card className="bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-3 shrink-0">
              <Compass className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold">The Pattern Across All Case Studies</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Every case study follows the same structural pattern — MAP-GAP provides the operating system,
                SALP provides the measurement, Three Realities ensures local fit, and MG-PATR captures lessons
                for the next deployment. The content changes. The methodology holds.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Link href="/mapgap-framework">
                  <Button variant="outline" size="sm" data-testid="link-mapgap-framework">
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> MAP-GAP Framework
                  </Button>
                </Link>
                <Link href="/transparency">
                  <Button variant="outline" size="sm" data-testid="link-transparency-dashboard">
                    <Activity className="mr-1.5 h-3.5 w-3.5" /> Transparency Dashboard
                  </Button>
                </Link>
                <Link href="/research-hub">
                  <Button variant="outline" size="sm" data-testid="link-research-hub">
                    <Microscope className="mr-1.5 h-3.5 w-3.5" /> Research Hub
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}