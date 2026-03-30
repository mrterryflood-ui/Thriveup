import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/page-header";
import {
  FileText, Download, Printer, Globe, Users, Target,
  Building2, Heart, Shield, Briefcase, Brain, Award,
  Star, MapPin, DollarSign, TrendingUp, CheckCircle2,
  BarChart3, Microscope, Layers, Activity, RefreshCw,
  Zap, Home, GraduationCap, Baby, Stethoscope,
  ArrowRight, Clock, BookOpen, Lightbulb, Eye, Handshake,
} from "lucide-react";
import { BackToTop } from "@/components/back-to-top";
import jsPDF from "jspdf";

const ENTITIES = [
  { name: "The Collaborative Advocate Foundation", role: "Fiscal Agent & Research Engine", type: "501(c)(3) Nonprofit", ein: "41-3618003", icon: Building2 },
  { name: "Collaboration & Implementation Professionals LLC", role: "Technology & Consulting", type: "Veteran-Owned Small Business", ein: "41-4996540", icon: Briefcase },
  { name: "M&T Consulting Solutions LLC", role: "Strategic Advisory & Program Design", type: "Consulting Entity", ein: "41-4952178", icon: GraduationCap },
];

const PLATFORMS = [
  { name: "ThriveUp Academy", domain: "Youth & Education", color: "bg-violet-500" },
  { name: "ISSS", domain: "School Wraparound", color: "bg-blue-500" },
  { name: "WholeMind Learning", domain: "Adaptive Learning", color: "bg-indigo-500" },
  { name: "Perfectly Different", domain: "Neurodivergent Support", color: "bg-pink-500" },
  { name: "LifeBridge", domain: "Housing Transitions", color: "bg-emerald-500" },
  { name: "M2C Transition", domain: "Benefits & Community", color: "bg-teal-500" },
  { name: "Mission Transition", domain: "Military-to-Civilian", color: "bg-slate-500" },
  { name: "MCE", domain: "Minority Business Dev", color: "bg-amber-500" },
  { name: "Collaborative Advocate", domain: "VOSB Consulting", color: "bg-orange-500" },
  { name: "Whole-Person Health", domain: "Clinical Screenings", color: "bg-rose-500" },
  { name: "Sankofa Health", domain: "Culturally Responsive Health", color: "bg-red-500" },
  { name: "Black Maternal Health", domain: "Perinatal Care", color: "bg-fuchsia-500" },
  { name: "Sankofa Feminine Health", domain: "Women's Health", color: "bg-purple-500" },
  { name: "Sankofa Men's Health", domain: "Men's Health", color: "bg-cyan-500" },
  { name: "SafeCogniCare", domain: "Cognitive Health / TBI", color: "bg-sky-500" },
  { name: "PillScheduler", domain: "Medication Adherence", color: "bg-lime-500" },
  { name: "SafeReport", domain: "Community Safety", color: "bg-yellow-500" },
  { name: "Shield Atlas", domain: "Cybersecurity", color: "bg-gray-500" },
  { name: "RPLICE / Better Science", domain: "Research Validation", color: "bg-blue-600" },
  { name: "Video Creator AI", domain: "Content Production", color: "bg-violet-600" },
  { name: "Pinnacle Business", domain: "Business Development", color: "bg-orange-600" },
  { name: "LexiBridge", domain: "Legal Navigation", color: "bg-slate-600" },
  { name: "Code Canvas", domain: "Digital Skills Training", color: "bg-indigo-600" },
  { name: "Ecosystem Nexus", domain: "Cross-Platform Integration", color: "bg-teal-600" },
];

const REGIONAL_HUBS = [
  {
    name: "Austin Hub",
    focus: "Housing Crisis Response",
    color: "from-blue-600 to-indigo-700",
    stats: [
      { label: "Median Home Price", value: "$435,000" },
      { label: "Homeless (PIT 2025)", value: "3,238" },
      { label: "Youth Homeless", value: "934" },
      { label: "Cost-Burdened Renters", value: "85%+" },
    ],
    partners: ["CommUnity Care", "ECHO", "Workforce Solutions Capital Area", "AISD", "Travis County"],
    funding: ["St. David's Foundation (up to $1M)", "Travis County CDBG", "Foundation Grants"],
    platforms: ["LifeBridge", "Whole-Person Health", "Mission Transition", "MCE", "ISSS"],
  },
  {
    name: "Manor Hub",
    focus: "Growth Without Gaps",
    color: "from-emerald-600 to-teal-700",
    stats: [
      { label: "Population Growth", value: "400%+ (2010-2024)" },
      { label: "Median Income", value: "$72,000" },
      { label: "Youth Population", value: "38% under 18" },
      { label: "Infrastructure Gap", value: "Critical" },
    ],
    partners: ["Manor ISD", "Manor Economic Development", "Travis County Health", "Local Employers"],
    funding: ["WIOA Title I ($200-500K)", "DFC Grant ($625K)", "Foundation Grants"],
    platforms: ["ThriveUp Academy", "ISSS", "WholeMind", "Sankofa Health", "SafeReport"],
  },
  {
    name: "Pflugerville Hub",
    focus: "Infrastructure Before Growth",
    color: "from-amber-600 to-orange-700",
    stats: [
      { label: "Population", value: "75,000+" },
      { label: "Growth Rate", value: "52% (2010-2020)" },
      { label: "Median Income", value: "$85,000" },
      { label: "Digital Access Gap", value: "Significant" },
    ],
    partners: ["PfISD", "Pflugerville CDC", "Health Alliance for Austin Musicians", "Local Businesses"],
    funding: ["PCDC Community Grant ($150K+)", "Foundation Grants", "Corporate Partnerships"],
    platforms: ["ThriveUp Academy", "Perfectly Different", "PillScheduler", "Video Creator AI"],
  },
];

const GRANTS = [
  {
    name: "Rare Impact Fund",
    amount: "$250K-$500K",
    timeline: "1-2 years",
    deadline: "April 10, 2026",
    entity: "Collaborative Advocate Foundation",
    evidence: "Implementation science frameworks, SDOH impact data, culturally responsive program models",
    alignment: "Community health equity, youth mental health, workforce inclusion, underserved population access",
    status: "priority",
  },
  {
    name: "BB Collective Research Grant",
    amount: "$50,000",
    timeline: "1 year",
    deadline: "April 13, 2026",
    entity: "Collaborative Advocate Foundation",
    evidence: "MAP-GAP CQI methodology, RPLICE validation framework, CARE Model integration, CFIR/RE-AIM scoring",
    alignment: "Black-led research, implementation science, community-driven outcomes measurement, collaborative impact",
    status: "priority",
  },
  {
    name: "St. David's Foundation",
    amount: "Up to $1M",
    timeline: "2-3 years",
    deadline: "Opens March 30, 2026",
    entity: "Collaborative Advocate Foundation",
    evidence: "SDOH framework, health equity data, maternal mortality research, community health assessments",
    alignment: "Economic stability pathways, culturally responsive mental health, healthy births, community-driven change",
    status: "priority",
  },
  {
    name: "SSG Fox VA Suicide Prevention",
    amount: "Up to $750K",
    timeline: "3 years",
    deadline: "June 12-18, 2026",
    entity: "ThriveUp Academy",
    evidence: "VA suicide prevention protocols, Risk-Needs-Responsivity model, veteran-specific care pathways",
    alignment: "Veteran suicide prevention, whole-person health, transition support, community integration",
    status: "upcoming",
  },
  {
    name: "Centene Foundation Behavioral Health",
    amount: "Up to $500K",
    timeline: "2 years",
    deadline: "May 31, 2026",
    entity: "Collaborative Advocate Foundation",
    evidence: "Behavioral health integration models, SDOH screening protocols, culturally responsive care frameworks",
    alignment: "Behavioral health access, integrated care, community health workers, health equity",
    status: "upcoming",
  },
  {
    name: "DFC Grant",
    amount: "$625,000",
    timeline: "5 years",
    deadline: "April 14, 2026",
    entity: "ThriveUp Academy",
    evidence: "CDC Strategic Prevention Framework, SAMHSA evidence-based curricula, 12-sector coalition model",
    alignment: "Substance use prevention, youth engagement, coalition building, community readiness assessment",
    status: "preparing",
  },
  {
    name: "WIOA Title I Youth",
    amount: "$200K-$500K",
    timeline: "2-3 years",
    deadline: "Rolling",
    entity: "ThriveUp Academy",
    evidence: "WIOA performance accountability, competency-based education, sectoral employment strategies",
    alignment: "Workforce development, career pathways, credential attainment, employer partnerships",
    status: "active",
  },
];

const IMPACT_PROJECTIONS = [
  {
    category: "Year 1 Targets",
    color: "from-blue-500 to-blue-600",
    items: [
      { metric: "Individuals Served", value: "2,500+" },
      { metric: "Health Screenings", value: "1,000+" },
      { metric: "Workforce Enrollments", value: "250+" },
      { metric: "Housing Stabilizations", value: "150 families" },
      { metric: "Youth in Programs", value: "500+" },
      { metric: "Coalition Partners", value: "36+ organizations" },
    ],
  },
  {
    category: "Year 2 Targets",
    color: "from-emerald-500 to-emerald-600",
    items: [
      { metric: "Individuals Served", value: "5,000+" },
      { metric: "Health Screenings", value: "2,500+" },
      { metric: "Workforce Placements", value: "500+" },
      { metric: "Housing Stabilizations", value: "300 families" },
      { metric: "Youth in Programs", value: "1,200+" },
      { metric: "Platforms Active", value: "24/24" },
    ],
  },
  {
    category: "Year 3 Targets",
    color: "from-violet-500 to-violet-600",
    items: [
      { metric: "Individuals Served", value: "10,000+" },
      { metric: "Health Screenings", value: "5,000+" },
      { metric: "Workforce Placements", value: "1,000+" },
      { metric: "Housing Stabilizations", value: "500 families" },
      { metric: "Community Reach", value: "3 counties" },
      { metric: "Replication Sites", value: "2+ new markets" },
    ],
  },
];

const CFIR_DOMAINS = [
  {
    domain: "Intervention Characteristics",
    score: 4.2,
    maxScore: 5,
    items: [
      "Evidence strength: 4 doctoral disciplines provide rigorous theoretical foundation",
      "Relative advantage: 24-platform ecosystem vs. siloed single-program approaches",
      "Adaptability: Three Realities framework ensures community-specific customization",
      "Complexity: MAP-GAP CQI reduces implementation complexity through structured cycles",
    ],
  },
  {
    domain: "Outer Setting",
    score: 4.0,
    maxScore: 5,
    items: [
      "Patient/community needs: Validated through Austin housing crisis data, Texas health disparities",
      "Cosmopolitanism: Cross-sector coalition model connects 12+ community sectors",
      "External policies: WIOA, DFC, VA grant alignment demonstrates regulatory fit",
      "Peer pressure: Pilot results from similar communities drive adoption momentum",
    ],
  },
  {
    domain: "Inner Setting",
    score: 3.8,
    maxScore: 5,
    items: [
      "Structural characteristics: Technology infrastructure supports all 24 platforms",
      "Networks & communications: Ecosystem Nexus provides cross-platform data sharing",
      "Culture: Veteran-founded, minority-led, community-ownership philosophy",
      "Implementation climate: Strong leadership commitment, dedicated staffing plan",
    ],
  },
  {
    domain: "Individual Characteristics",
    score: 4.1,
    maxScore: 5,
    items: [
      "Knowledge & beliefs: Dr. Terry Flood's 4-discipline expertise anchors methodology",
      "Self-efficacy: Staff training through facilitator certification pipeline",
      "Individual identification: Personal commitment to community transformation documented",
      "Other attributes: Bronze Star (x2) veteran, minority entrepreneur, doctoral researcher",
    ],
  },
  {
    domain: "Implementation Process",
    score: 4.3,
    maxScore: 5,
    items: [
      "Planning: MAP-GAP 6-step cycle provides structured implementation planning",
      "Engaging: SALP indicators ensure stakeholder-aligned performance measurement",
      "Executing: Real-time fidelity dashboards track implementation as designed",
      "Reflecting & evaluating: MG-PATR protocol captures lessons for replication",
    ],
  },
];

const REAIM_SCORES = [
  { dimension: "Reach", score: 85, description: "3 regional hubs covering Austin/Manor/Pflugerville triangle, 30M+ Texas population potential" },
  { dimension: "Effectiveness", score: 78, description: "SALP fidelity indicators, SMART goals, real-time outcome dashboards across all platforms" },
  { dimension: "Adoption", score: 82, description: "24 platforms operational, coalition partnerships across 12 sectors, employer engagement" },
  { dimension: "Implementation", score: 88, description: "MAP-GAP CQI cycle, CFIR-guided deployment, Three Realities adaptation framework" },
  { dimension: "Maintenance", score: 75, description: "MG-PATR replication protocol, continuous quality improvement, community ownership model" },
];

const PARTNERSHIP_VALUE = {
  whatWeOffer: [
    { tool: "MAP-GAP Framework", benefit: "Any partner can run structured improvement cycles on their own programs — no license, no fee, just better outcomes", icon: RefreshCw },
    { tool: "RPLICE Validation Tools", benefit: "CFIR assessments, RE-AIM scoring, Fidelity Checklists, and Three Realities diagnostics available to partners for self-evaluation", icon: Microscope },
    { tool: "CARE Model Integration", benefit: "Connect your community assessments directly to evidence-based response pathways across 24 platforms", icon: Heart },
    { tool: "Warm Handoff Network", benefit: "Bi-directional referral system with confirmation tracking — your clients get connected, not lost", icon: Handshake },
    { tool: "Shared Outcomes Dashboard", benefit: "Joint metric tracking so partners can show collective impact to funders, not just individual outputs", icon: BarChart3 },
    { tool: "Technology Infrastructure", benefit: "24 platforms covering health, housing, workforce, education, and safety — available as a backbone for partner programs", icon: Globe },
  ],
  whatWeLookFor: [
    "Community trust and established relationships we haven't built yet",
    "Domain expertise that deepens our evidence base (health equity, education research, policy analysis)",
    "Geographic reach beyond Austin/Manor/Pflugerville to scale validated models",
    "Complementary data that strengthens grant applications for both organizations",
    "Co-investigators and co-PIs for research-backed funding opportunities",
    "Honest feedback — our tools get better when partners tell us what doesn't work",
  ],
  jointOpportunities: [
    { opportunity: "BB Collective Research Grant (April 13)", description: "Joint proposal combining partner's community data with our RPLICE validation framework — stronger together than either alone", amount: "$50K" },
    { opportunity: "St. David's Foundation (March 30)", description: "Multi-organization application showing coordinated health equity impact across Central Texas", amount: "Up to $1M" },
    { opportunity: "Shared CFIR/RE-AIM Assessments", description: "Partners can use our tools to validate their own programs, producing publishable implementation science data", amount: "Research value" },
    { opportunity: "Joint Community Health Assessments", description: "Combined screening data from multiple orgs creates a more complete picture for funders and policymakers", amount: "Leverage" },
  ],
};

function generatePDF(section: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text("ThriveUp Academy | The Collaborative Advocate Foundation", margin, y);
  y += 12;

  doc.setTextColor(0, 0, 0);

  switch (section) {
    case "executive": {
      doc.setFontSize(22);
      doc.text("Executive Summary", margin, y);
      y += 12;
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      const intro = "ThriveUp Academy is the direct-service brand of The Collaborative Advocate Foundation, a veteran-founded, minority-led 501(c)(3) nonprofit. The ecosystem comprises 3 legal entities, 24 integrated technology platforms, 3 regional hubs (Austin, Manor, Pflugerville), and 7 active grant pipelines — all validated through Dr. Terry Flood's proprietary implementation science methodologies: MAP-GAP, SALP, Three Realities, and MG-PATR. Our tools don't just serve our mission — they're built to make every partner organization more effective.";
      const lines = doc.splitTextToSize(intro, maxWidth);
      doc.text(lines, margin, y);
      y += lines.length * 6 + 10;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text("Three Entities", margin, y);
      y += 8;
      doc.setFontSize(10);
      ENTITIES.forEach((e) => {
        doc.setTextColor(0, 0, 0);
        doc.text(`${e.name} (${e.type})`, margin + 4, y);
        y += 5;
        doc.setTextColor(100, 100, 100);
        doc.text(`Role: ${e.role}`, margin + 8, y);
        y += 7;
      });

      y += 5;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text("Key Statistics", margin, y);
      y += 8;
      doc.setFontSize(10);
      const stats = [
        "24 integrated technology platforms",
        "3 regional hubs: Austin, Manor, Pflugerville",
        "7 active grant pipelines totaling $3.6M+",
        "4 doctoral disciplines: Implementation Science, Psychology, HR Management, Criminal Justice",
        "Proprietary methodologies: MAP-GAP, SALP, Three Realities, MG-PATR",
        "Tools built to strengthen every partner — not just our own programs",
        "Target: 10,000+ individuals served by Year 3",
      ];
      stats.forEach((s) => {
        doc.text(`  \u2022 ${s}`, margin, y);
        y += 6;
      });
      break;
    }
    case "hubs": {
      doc.setFontSize(22);
      doc.text("Regional Hub Profiles", margin, y);
      y += 14;

      REGIONAL_HUBS.forEach((hub) => {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text(`${hub.name}: ${hub.focus}`, margin, y);
        y += 10;

        doc.setFontSize(10);
        doc.text("Key Statistics:", margin + 4, y);
        y += 6;
        hub.stats.forEach((s) => {
          doc.setTextColor(100, 100, 100);
          doc.text(`  ${s.label}: ${s.value}`, margin + 8, y);
          y += 5;
        });
        y += 4;

        doc.setTextColor(0, 0, 0);
        doc.text("Partners:", margin + 4, y);
        y += 5;
        doc.setTextColor(100, 100, 100);
        doc.text(`  ${hub.partners.join(", ")}`, margin + 8, y);
        y += 6;

        doc.setTextColor(0, 0, 0);
        doc.text("Funding:", margin + 4, y);
        y += 5;
        doc.setTextColor(100, 100, 100);
        doc.text(`  ${hub.funding.join(", ")}`, margin + 8, y);
        y += 6;

        doc.setTextColor(0, 0, 0);
        doc.text("Key Platforms:", margin + 4, y);
        y += 5;
        doc.setTextColor(100, 100, 100);
        doc.text(`  ${hub.platforms.join(", ")}`, margin + 8, y);
        y += 12;
      });
      break;
    }
    case "grants": {
      doc.setFontSize(22);
      doc.text("Grant Readiness Snapshots", margin, y);
      y += 14;

      GRANTS.forEach((g) => {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(`${g.name} — ${g.amount}`, margin, y);
        y += 8;
        doc.setFontSize(10);
        doc.text(`Entity: ${g.entity}  |  Timeline: ${g.timeline}  |  Deadline: ${g.deadline}`, margin + 4, y);
        y += 7;
        doc.setTextColor(100, 100, 100);
        const evLines = doc.splitTextToSize(`Evidence Base: ${g.evidence}`, maxWidth - 8);
        doc.text(evLines, margin + 4, y);
        y += evLines.length * 5 + 3;
        const alLines = doc.splitTextToSize(`Alignment: ${g.alignment}`, maxWidth - 8);
        doc.text(alLines, margin + 4, y);
        y += alLines.length * 5 + 10;
      });
      break;
    }
    case "ecosystem": {
      doc.setFontSize(22);
      doc.text("24-Platform Ecosystem Overview", margin, y);
      y += 14;
      doc.setFontSize(10);
      PLATFORMS.forEach((p, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setTextColor(0, 0, 0);
        doc.text(`${i + 1}. ${p.name}`, margin, y);
        doc.setTextColor(100, 100, 100);
        doc.text(`— ${p.domain}`, margin + 60, y);
        y += 6;
      });
      break;
    }
    case "impact": {
      doc.setFontSize(22);
      doc.text("Impact Projections (Years 1-3)", margin, y);
      y += 14;

      IMPACT_PROJECTIONS.forEach((yr) => {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(yr.category, margin, y);
        y += 8;
        doc.setFontSize(10);
        yr.items.forEach((item) => {
          doc.setTextColor(100, 100, 100);
          doc.text(`  ${item.metric}: ${item.value}`, margin + 4, y);
          y += 6;
        });
        y += 8;
      });
      break;
    }
    case "partnership": {
      doc.setFontSize(22);
      doc.text("Partnership Value — Better Together", margin, y);
      y += 12;
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      const partnerIntro = "We don't just build tools for ourselves. Every methodology, framework, and platform in the ThriveUp ecosystem is designed to make our partners more effective. This is what we bring to the table — and what we're looking for in return.";
      const pLines = doc.splitTextToSize(partnerIntro, maxWidth);
      doc.text(pLines, margin, y);
      y += pLines.length * 6 + 10;

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("What We Offer Partners", margin, y);
      y += 8;
      doc.setFontSize(10);
      PARTNERSHIP_VALUE.whatWeOffer.forEach((item) => {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setTextColor(0, 0, 0);
        doc.text(`${item.tool}`, margin + 4, y);
        y += 5;
        doc.setTextColor(100, 100, 100);
        const bLines = doc.splitTextToSize(item.benefit, maxWidth - 12);
        doc.text(bLines, margin + 8, y);
        y += bLines.length * 5 + 4;
      });

      y += 6;
      if (y > 200) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("What We Look For in Partners", margin, y);
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      PARTNERSHIP_VALUE.whatWeLookFor.forEach((item) => {
        if (y > 265) { doc.addPage(); y = 20; }
        doc.text(`  \u2022 ${item}`, margin + 4, y);
        y += 6;
      });

      y += 6;
      if (y > 200) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Joint Opportunities", margin, y);
      y += 8;
      doc.setFontSize(10);
      PARTNERSHIP_VALUE.jointOpportunities.forEach((item) => {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setTextColor(0, 0, 0);
        doc.text(`${item.opportunity} (${item.amount})`, margin + 4, y);
        y += 5;
        doc.setTextColor(100, 100, 100);
        const oLines = doc.splitTextToSize(item.description, maxWidth - 12);
        doc.text(oLines, margin + 8, y);
        y += oLines.length * 5 + 6;
      });
      break;
    }
    case "rplice": {
      doc.setFontSize(22);
      doc.text("RPLICE Evidence Brief", margin, y);
      y += 12;
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      const rpliceIntro = "Implementation science validation of ThriveUp ecosystem using CFIR (Consolidated Framework for Implementation Research) domains and RE-AIM (Reach, Effectiveness, Adoption, Implementation, Maintenance) evaluation scoring.";
      const rLines = doc.splitTextToSize(rpliceIntro, maxWidth);
      doc.text(rLines, margin, y);
      y += rLines.length * 6 + 10;

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("CFIR Domain Scores", margin, y);
      y += 8;
      doc.setFontSize(10);
      CFIR_DOMAINS.forEach((d) => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setTextColor(0, 0, 0);
        doc.text(`${d.domain}: ${d.score}/${d.maxScore}`, margin + 4, y);
        y += 8;
      });

      y += 6;
      if (y > 200) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("RE-AIM Evaluation Scores", margin, y);
      y += 8;
      doc.setFontSize(10);
      REAIM_SCORES.forEach((r) => {
        doc.setTextColor(0, 0, 0);
        doc.text(`${r.dimension}: ${r.score}%`, margin + 4, y);
        y += 5;
        doc.setTextColor(100, 100, 100);
        const dLines = doc.splitTextToSize(r.description, maxWidth - 12);
        doc.text(dLines, margin + 8, y);
        y += dLines.length * 5 + 4;
      });
      break;
    }
  }

  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text(`Generated ${new Date().toLocaleDateString()} | ThriveUp Academy`, margin, doc.internal.pageSize.getHeight() - 10);

  doc.save(`ThriveUp_${section}_${new Date().toISOString().split("T")[0]}.pdf`);
}

function SectionCard({ title, description, icon: Icon, section, color }: {
  title: string;
  description: string;
  icon: typeof FileText;
  section: string;
  color: string;
}) {
  return (
    <Card className="hover-elevate" data-testid={`card-section-${section}`}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-3 mb-3">
          <div className={`rounded-md p-2.5 shrink-0 ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={() => generatePDF(section)} data-testid={`button-download-${section}`}>
            <Download className="h-3.5 w-3.5 mr-1" /> Download PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PresentationsPage() {
  const [activeTab, setActiveTab] = useState("executive");

  useEffect(() => {
    document.title = "Presentations Hub | ThriveUp Academy";
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10" data-testid="presentations-page">
      <PageHeader
        title="Presentations Hub"
        description="Downloadable, print-ready materials for funders, stakeholders, and partners"
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => window.print()} data-testid="button-print-all">
              <Printer className="h-4 w-4 mr-1" /> Print Page
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <SectionCard
          title="Executive Summary"
          description="One-page overview: 3 entities, 24 platforms, 3 hubs, 7 grants, Dr. Flood's methodologies"
          icon={FileText}
          section="executive"
          color="bg-violet-600"
        />
        <SectionCard
          title="Regional Hub Profiles"
          description="Austin, Manor, Pflugerville — key stats, partners, and funding per hub"
          icon={MapPin}
          section="hubs"
          color="bg-emerald-600"
        />
        <SectionCard
          title="Grant Readiness Snapshots"
          description="Per-grant one-pagers with alignment, budget, timeline, and evidence base"
          icon={Target}
          section="grants"
          color="bg-amber-600"
        />
        <SectionCard
          title="Ecosystem Overview"
          description="All 24 platforms, their domains, and interconnections"
          icon={Globe}
          section="ecosystem"
          color="bg-blue-600"
        />
        <SectionCard
          title="Impact Projections"
          description="Year 1-3 outcome targets, SALP indicators, community reach estimates"
          icon={TrendingUp}
          section="impact"
          color="bg-rose-600"
        />
        <SectionCard
          title="Partnership Value"
          description="What we offer partners, what we look for, and how working together creates shared impact"
          icon={Handshake}
          section="partnership"
          color="bg-emerald-600"
        />
        <SectionCard
          title="RPLICE Evidence Brief"
          description="CFIR/RE-AIM scoring, Three Realities application, implementation science validation"
          icon={Microscope}
          section="rplice"
          color="bg-indigo-600"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-presentations">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 gap-1 h-auto p-1">
          <TabsTrigger value="executive" className="text-xs" data-testid="tab-executive">
            <FileText className="h-3.5 w-3.5 mr-1" /> Executive
          </TabsTrigger>
          <TabsTrigger value="partnership" className="text-xs" data-testid="tab-partnership">
            <Handshake className="h-3.5 w-3.5 mr-1" /> Partnership
          </TabsTrigger>
          <TabsTrigger value="hubs" className="text-xs" data-testid="tab-hubs">
            <MapPin className="h-3.5 w-3.5 mr-1" /> Hubs
          </TabsTrigger>
          <TabsTrigger value="grants" className="text-xs" data-testid="tab-grants">
            <Target className="h-3.5 w-3.5 mr-1" /> Grants
          </TabsTrigger>
          <TabsTrigger value="ecosystem" className="text-xs" data-testid="tab-ecosystem">
            <Globe className="h-3.5 w-3.5 mr-1" /> Ecosystem
          </TabsTrigger>
          <TabsTrigger value="impact" className="text-xs" data-testid="tab-impact">
            <TrendingUp className="h-3.5 w-3.5 mr-1" /> Impact
          </TabsTrigger>
          <TabsTrigger value="rplice" className="text-xs" data-testid="tab-rplice">
            <Microscope className="h-3.5 w-3.5 mr-1" /> RPLICE
          </TabsTrigger>
        </TabsList>

        <TabsContent value="executive" className="mt-6 space-y-8" data-testid="content-executive">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold mb-1">Executive Summary</h2>
              <p className="text-muted-foreground">ThriveUp Academy ecosystem at a glance</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => generatePDF("executive")} data-testid="button-download-executive-inline">
              <Download className="h-4 w-4 mr-1" /> Download PDF
            </Button>
          </div>

          <div className="relative overflow-hidden rounded-md bg-gradient-to-br from-violet-900 via-indigo-800 to-blue-900 text-white p-8 md:p-10" data-testid="hero-executive">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-violet-400 blur-3xl" />
              <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-blue-400 blur-3xl" />
            </div>
            <div className="relative z-10 max-w-4xl">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">ThriveUp Academy</h1>
              <p className="text-lg text-blue-100 mb-4">
                A veteran-founded, minority-led 24-platform ecosystem built to make communities stronger — not just our programs, 
                but every partner we work with. Our tools, methodologies, and frameworks are designed to be shared, adapted, and 
                deployed by coalitions who believe we're always better together.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  <Shield className="h-3 w-3 mr-1" /> Veteran-Founded
                </Badge>
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  <Star className="h-3 w-3 mr-1" /> Minority-Led
                </Badge>
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  <Award className="h-3 w-3 mr-1" /> Bronze Star (x2)
                </Badge>
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  <Brain className="h-3 w-3 mr-1" /> 4 Doctoral Disciplines
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-md bg-white/10">
                  <div className="text-2xl font-bold">24</div>
                  <div className="text-xs text-blue-200">Platforms</div>
                </div>
                <div className="text-center p-3 rounded-md bg-white/10">
                  <div className="text-2xl font-bold">3</div>
                  <div className="text-xs text-blue-200">Regional Hubs</div>
                </div>
                <div className="text-center p-3 rounded-md bg-white/10">
                  <div className="text-2xl font-bold">7</div>
                  <div className="text-xs text-blue-200">Grant Pipelines</div>
                </div>
                <div className="text-center p-3 rounded-md bg-white/10">
                  <div className="text-2xl font-bold">$3.6M+</div>
                  <div className="text-xs text-blue-200">Pipeline Value</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Three Legal Entities</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ENTITIES.map((entity) => (
                <Card key={entity.name} data-testid={`card-entity-${entity.name.toLowerCase().replace(/\s+/g, '-').substring(0, 20)}`}>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="rounded-md p-2 bg-primary/10 shrink-0">
                        <entity.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{entity.name}</h4>
                        <Badge variant="outline" className="text-[10px] mt-1">{entity.type}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{entity.role}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card data-testid="card-methodologies">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-5 w-5 text-primary" />
                Dr. Terry Flood's Proprietary Methodologies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <RefreshCw className="h-4 w-4 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">MAP-GAP</p>
                      <p className="text-xs text-muted-foreground">Map, Analyze, Plan — Gap Assessment Protocol. The living operating system for community programs.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">SALP</p>
                      <p className="text-xs text-muted-foreground">Stakeholder-Aligned Longitudinal Performance Indicators. Real-time fidelity measurement.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Layers className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Three Realities</p>
                      <p className="text-xs text-muted-foreground">Research-Policy-Practice adaptation framework preventing copy-paste failures.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">MG-PATR</p>
                      <p className="text-xs text-muted-foreground">MAP-GAP Pilot, Adapt, Transfer, Replicate. Scaling without losing effectiveness.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partnership" className="mt-6 space-y-8" data-testid="content-partnership">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold mb-1">Better Together</h2>
              <p className="text-muted-foreground">We're good as a standalone — but we're always better together</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => generatePDF("partnership")} data-testid="button-download-partnership-inline">
              <Download className="h-4 w-4 mr-1" /> Download PDF
            </Button>
          </div>

          <div className="relative overflow-hidden rounded-md bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 text-white p-8 md:p-10" data-testid="hero-partnership">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-emerald-400 blur-3xl" />
              <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-cyan-400 blur-3xl" />
            </div>
            <div className="relative z-10 max-w-4xl">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">It's Not About Us. It's About All of Us.</h1>
              <p className="text-lg text-emerald-100 mb-4">
                Our tools, frameworks, and methodologies exist to make communities stronger. We don't hold them back
                behind licenses or fees. When a partner organization uses MAP-GAP to improve their own programs, that's
                a win for everyone those programs serve. Collaboration isn't a strategy — it's who we are.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center p-3 rounded-md bg-white/10">
                  <div className="text-2xl font-bold">6</div>
                  <div className="text-xs text-emerald-200">Open Frameworks</div>
                </div>
                <div className="text-center p-3 rounded-md bg-white/10">
                  <div className="text-2xl font-bold">24</div>
                  <div className="text-xs text-emerald-200">Platforms Available</div>
                </div>
                <div className="text-center p-3 rounded-md bg-white/10">
                  <div className="text-2xl font-bold">$0</div>
                  <div className="text-xs text-emerald-200">Cost to Partners</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              What We Bring to the Table
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PARTNERSHIP_VALUE.whatWeOffer.map((item) => (
                <Card key={item.tool} data-testid={`card-offer-${item.tool.toLowerCase().replace(/\s+/g, '-').substring(0, 20)}`}>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-md p-2 bg-emerald-500/10 shrink-0">
                        <item.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">{item.tool}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.benefit}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card data-testid="card-what-we-look-for">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                What We Look For in Partners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                We're not looking for organizations to "help us." We're looking for partners whose strengths complement ours —
                so that together, we serve communities neither of us could reach alone.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PARTNERSHIP_VALUE.whatWeLookFor.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Joint Opportunities — Stronger Together
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PARTNERSHIP_VALUE.jointOpportunities.map((item) => (
                <Card key={item.opportunity} data-testid={`card-joint-${item.opportunity.toLowerCase().replace(/\s+/g, '-').substring(0, 25)}`}>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="font-semibold text-sm">{item.opportunity}</h4>
                      <Badge variant="outline" className="text-xs shrink-0">{item.amount}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="border-emerald-200 dark:border-emerald-800" data-testid="card-collaboration-philosophy">
            <CardContent className="pt-6 pb-5">
              <div className="text-center max-w-2xl mx-auto">
                <Handshake className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">Our Collaboration Philosophy</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Every tool we build, every framework we develop, every methodology we validate — it's designed to be
                  shared. When our partners succeed, the communities we all serve succeed. That's not a tagline.
                  That's how Dr. Terry Flood built this from day one: veteran-founded, community-owned, coalition-driven.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs">Open Frameworks</Badge>
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-xs">Shared Data</Badge>
                  <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 text-xs">Joint Proposals</Badge>
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-xs">Coalition-Driven</Badge>
                  <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 text-xs">Community-Owned</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hubs" className="mt-6 space-y-8" data-testid="content-hubs">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold mb-1">Regional Hub Profiles</h2>
              <p className="text-muted-foreground">Austin, Manor, Pflugerville — the Central Texas triangle</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => generatePDF("hubs")} data-testid="button-download-hubs-inline">
              <Download className="h-4 w-4 mr-1" /> Download PDF
            </Button>
          </div>

          {REGIONAL_HUBS.map((hub) => (
            <Card key={hub.name} data-testid={`card-hub-${hub.name.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardContent className="pt-0 pb-5">
                <div className={`-mx-6 -mt-0 mb-5 px-6 py-4 rounded-t-md bg-gradient-to-r ${hub.color} text-white`}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <h3 className="text-lg font-bold">{hub.name}</h3>
                  </div>
                  <p className="text-sm text-white/80 mt-1">{hub.focus}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  {hub.stats.map((stat) => (
                    <div key={stat.label} className="text-center p-3 rounded-md bg-muted/50">
                      <div className="text-lg font-bold">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> Partners
                    </h4>
                    <ul className="space-y-1">
                      {hub.partners.map((p) => (
                        <li key={p} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" /> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" /> Funding
                    </h4>
                    <ul className="space-y-1">
                      {hub.funding.map((f) => (
                        <li key={f} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <ArrowRight className="h-3 w-3 text-primary mt-0.5 shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5" /> Key Platforms
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {hub.platforms.map((p) => (
                        <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="grants" className="mt-6 space-y-8" data-testid="content-grants">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold mb-1">Grant Readiness Snapshots</h2>
              <p className="text-muted-foreground">Per-grant one-pagers showing alignment, budget, timeline, and evidence base</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => generatePDF("grants")} data-testid="button-download-grants-inline">
              <Download className="h-4 w-4 mr-1" /> Download PDF
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {GRANTS.map((grant) => (
              <Card key={grant.name} data-testid={`card-grant-${grant.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-md p-2.5 bg-primary/10 shrink-0">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold">{grant.name}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{grant.amount}</Badge>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" /> {grant.timeline}
                          </Badge>
                          <Badge
                            className={`text-xs ${
                              grant.status === "priority" ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" :
                              grant.status === "active" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" :
                              grant.status === "preparing" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" :
                              "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                            }`}
                          >
                            {grant.status === "priority" ? "Priority" :
                             grant.status === "active" ? "Active" :
                             grant.status === "preparing" ? "Preparing" : "Upcoming"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Deadline</p>
                      <p className="text-sm font-semibold">{grant.deadline}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> Entity
                      </h4>
                      <p className="text-sm">{grant.entity}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                        <Microscope className="h-3 w-3" /> Evidence Base
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{grant.evidence}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Alignment
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{grant.alignment}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ecosystem" className="mt-6 space-y-8" data-testid="content-ecosystem">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold mb-1">24-Platform Ecosystem</h2>
              <p className="text-muted-foreground">Every tool is built to strengthen partners, not just serve our own programs</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => generatePDF("ecosystem")} data-testid="button-download-ecosystem-inline">
              <Download className="h-4 w-4 mr-1" /> Download PDF
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {PLATFORMS.map((platform, i) => (
              <Card key={platform.name} className="hover-elevate" data-testid={`card-platform-${i}`}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${platform.color}`} />
                    <h4 className="text-sm font-semibold truncate">{platform.name}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">{platform.domain}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card data-testid="card-ecosystem-interconnections">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Platform Interconnections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold mb-3">Data Flow Architecture</h4>
                  <ul className="space-y-2">
                    <li className="text-xs text-muted-foreground flex items-start gap-2">
                      <ArrowRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      <span>Single entry point across all 24 platforms — data follows the person</span>
                    </li>
                    <li className="text-xs text-muted-foreground flex items-start gap-2">
                      <ArrowRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      <span>Warm handoffs with confirmation tracking between platforms</span>
                    </li>
                    <li className="text-xs text-muted-foreground flex items-start gap-2">
                      <ArrowRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      <span>AI-powered early warning system detects risk across all touchpoints</span>
                    </li>
                    <li className="text-xs text-muted-foreground flex items-start gap-2">
                      <ArrowRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      <span>SALP fidelity indicators tracked in real time across ecosystem</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-3">Domain Coverage</h4>
                  <div className="space-y-2">
                    {[
                      { label: "Youth & Education", count: 5, total: 24 },
                      { label: "Housing & Transitions", count: 3, total: 24 },
                      { label: "Health & Wellness", count: 6, total: 24 },
                      { label: "Workforce & Business", count: 5, total: 24 },
                      { label: "Safety & Infrastructure", count: 5, total: 24 },
                    ].map((d) => (
                      <div key={d.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{d.label}</span>
                          <span className="font-medium">{d.count} platforms</span>
                        </div>
                        <Progress value={(d.count / d.total) * 100} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impact" className="mt-6 space-y-8" data-testid="content-impact">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold mb-1">Impact Projections</h2>
              <p className="text-muted-foreground">Year 1-3 outcome targets, SALP indicators, and community reach estimates</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => generatePDF("impact")} data-testid="button-download-impact-inline">
              <Download className="h-4 w-4 mr-1" /> Download PDF
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {IMPACT_PROJECTIONS.map((year) => (
              <Card key={year.category} data-testid={`card-impact-${year.category.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardContent className="pt-0 pb-5">
                  <div className={`-mx-6 -mt-0 mb-5 px-6 py-3 rounded-t-md bg-gradient-to-r ${year.color} text-white`}>
                    <h3 className="font-bold text-sm">{year.category}</h3>
                  </div>
                  <ul className="space-y-3">
                    {year.items.map((item) => (
                      <li key={item.metric} className="flex items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground">{item.metric}</span>
                        <span className="text-sm font-bold">{item.value}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card data-testid="card-salp-overview">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                SALP Indicator Framework
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold mb-3">Process Indicators</h4>
                  <ul className="space-y-2">
                    {[
                      "Service delivery adherence: 80%+ fidelity target",
                      "Dosage thresholds met for all participant groups",
                      "Staff competency verified through certification pipeline",
                      "Coalition engagement: 12+ sectors active and contributing",
                    ].map((item, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-3">Outcome Indicators</h4>
                  <ul className="space-y-2">
                    {[
                      "Housing stability at 6-month and 12-month marks",
                      "Workforce placement with 90-day retention tracking",
                      "Health screening completion and warm handoff rates",
                      "Youth program completion and credential attainment",
                    ].map((item, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <BarChart3 className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rplice" className="mt-6 space-y-8" data-testid="content-rplice">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold mb-1">RPLICE Evidence Brief</h2>
              <p className="text-muted-foreground">Implementation science validation: CFIR/RE-AIM scoring and Three Realities application</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => generatePDF("rplice")} data-testid="button-download-rplice-inline">
              <Download className="h-4 w-4 mr-1" /> Download PDF
            </Button>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              CFIR Domain Assessment
            </h3>
            <div className="space-y-4">
              {CFIR_DOMAINS.map((domain) => (
                <Card key={domain.domain} data-testid={`card-cfir-${domain.domain.toLowerCase().replace(/\s+/g, '-')}`}>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <h4 className="font-semibold text-sm">{domain.domain}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-primary">{domain.score}</span>
                        <span className="text-xs text-muted-foreground">/ {domain.maxScore}</span>
                      </div>
                    </div>
                    <Progress value={(domain.score / domain.maxScore) * 100} className="h-2 mb-3" />
                    <ul className="space-y-1.5">
                      {domain.items.map((item, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" /> {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              RE-AIM Evaluation Scoring
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {REAIM_SCORES.map((score) => (
                <Card key={score.dimension} data-testid={`card-reaim-${score.dimension.toLowerCase()}`}>
                  <CardContent className="pt-5 pb-4 text-center">
                    <div className="text-2xl font-bold text-primary mb-1">{score.score}%</div>
                    <h4 className="font-semibold text-sm mb-2">{score.dimension}</h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{score.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card data-testid="card-three-realities-overview">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Three Realities Application to Central Texas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Microscope className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">What Research Says</span>
                  </div>
                  <ul className="space-y-1.5">
                    {[
                      "Housing instability is the #1 social determinant of health",
                      "Coordinated entry systems reduce homelessness faster than siloed services",
                      "Implementation science frameworks (CFIR/RE-AIM) improve program fidelity 2-3x",
                      "Whole-person approaches produce better workforce outcomes than job-only programs",
                    ].map((item, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <ArrowRight className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">What Politics Allow</span>
                  </div>
                  <ul className="space-y-1.5">
                    {[
                      "Texas has limited Medicaid expansion — community health programs fill the gap",
                      "WIOA and DFC federal funding available for evidence-based programs",
                      "St. David's Foundation invests $100M+ annually in 5-county region",
                      "Travis County actively seeking innovative housing + workforce solutions",
                    ].map((item, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <ArrowRight className="h-3 w-3 text-purple-500 mt-0.5 shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Lightbulb className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">What Works on the Ground</span>
                  </div>
                  <ul className="space-y-1.5">
                    {[
                      "68% of Austin homeless became homeless IN Austin — local solutions needed",
                      "Manor's 400% growth creates opportunity for proactive infrastructure building",
                      "Pflugerville's tech-savvy population ready for digital-first solutions",
                      "Community health workers provide trusted entry points for underserved populations",
                    ].map((item, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <ArrowRight className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BackToTop />
    </div>
  );
}
