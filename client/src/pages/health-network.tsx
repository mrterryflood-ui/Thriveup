import { ExternalLink, Heart, Brain, Baby, Pill, Shield, Activity, Users, Stethoscope, Eye, Dna, Ribbon, Microscope } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HealthPlatform {
  id: string;
  name: string;
  url: string;
  icon: React.ReactNode;
  badges: string[];
  description: string;
  color: string;
  status?: "configured" | "evidence_surface" | "offline";
}

const healthPlatforms: HealthPlatform[] = [
  {
    id: "herhealth-womens",
    name: "HerHealth Matters",
    url: "https://herhealthmatters2.com",
    icon: <Ribbon className="w-8 h-8" />,
    badges: ["Cancer", "Cardiovascular", "Autoimmune", "Reproductive", "Mental Health", "Metabolic", "Infectious", "70 Conditions", "Nia AI Navigator"],
    description: "Comprehensive women's health navigation platform covering 70 conditions across 7 specialized domains — cancer, cardiovascular, autoimmune, mental health, reproductive, metabolic, and infectious disease. Powered by Nia, a Perplexity-driven AI navigator delivering culturally responsive health guidance, screening pathways, and provider-navigation information.",
    color: "from-pink-500 to-rose-600",
  },
  {
    id: "whole-person-health",
    name: "Whole-Person Health Ecosystem",
    url: "https://mentalwellnesssupport.net",
    icon: <Heart className="w-8 h-8" />,
    badges: ["C-SSRS", "PHQ-9", "GAD-7", "PCL-5", "AUDIT-C", "DAST-10", "Safety Plans", "20,670+ Resources"],
    description: "Central health-navigation hub for the ecosystem delivering 6 validated screenings — C-SSRS (suicide), PHQ-9 (depression), GAD-7 (anxiety), PCL-5 (PTSD), AUDIT-C (alcohol), and DAST-10 (drugs). Includes crisis resources, safety-plan support, and Reach a Vet pathways with 20,670+ curated resources. This public link does not establish a completed referral or clinical-data exchange.",
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "sankofa",
    name: "Sankofa Health Network",
    url: "https://herhealthmatters2.com",
    icon: <Users className="w-8 h-8" />,
    badges: ["Health Equity Gateway", "5 Sub-Platforms", "GIS Matching", "Culturally Responsive"],
    description: "Health and wellness gateway orchestrating specialized maternal, women's, men's, cognitive-safety, and medication-support services. Delivers behavioral-health assessments, resource matching, and responsive health navigation.",
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "sankofa-mens-health",
    name: "MaleHealth Matters",
    url: "https://malehealthmatters2.com",
    icon: <Activity className="w-8 h-8" />,
    badges: ["Prostate Cancer", "Cardiovascular", "Diabetes", "Mental Health", "15 Health Domains", "Malik AI"],
    description: "Comprehensive men's health platform covering preventive screening navigation, cardiovascular wellness, behavioral-health engagement, substance-use support, veteran pathways, and peer connection.",
    color: "from-emerald-500 to-green-600",
  },
  {
    id: "sankofa-maternal-health",
    name: "Maternal Health Network",
    url: "https://herhealthmatters2.com",
    icon: <Baby className="w-8 h-8" />,
    badges: ["Maternal Mortality", "Doula Matching", "Prenatal/Postnatal", "EPDS Screening", "CHW Dispatch"],
    description: "Prenatal and postpartum care navigation, doula matching, maternal mental-health screening, community-health-worker coordination, breastfeeding support, and postpartum recovery planning.",
    color: "from-rose-400 to-pink-600",
  },
  {
    id: "sankofa-feminine-health",
    name: "HerHealth Matters",
    url: "https://herhealthmatters2.com",
    icon: <Stethoscope className="w-8 h-8" />,
    badges: ["Reproductive Health", "OB/GYN", "Cancer Screening", "Menopause", "Provider Navigation"],
    description: "Women's health platform covering reproductive health education, hormonal wellness, preventive screening, cervical and breast health, menopause support, provider-navigation information, and maternal pathways.",
    color: "from-fuchsia-500 to-purple-600",
  },
  {
    id: "safecognicare",
    name: "SafeCogniCare",
    url: "https://safecognicare.com",
    icon: <Brain className="w-8 h-8" />,
    badges: ["TBI", "Dementia", "ADHD", "MoCA/MMSE", "Cognitive Safety", "Caregiver Support"],
    description: "Cognitive safety platform specializing in TBI, ADHD, dementia, and peripartum cognitive changes with validated cognitive health assessments (MoCA, MMSE, Trail Making). Early intervention tools with automated provider alerts, comprehensive safety protocols, and care coordination with family and providers. Critical for veteran populations with TBI prevalence and maternal health with peripartum cognitive changes.",
    color: "from-cyan-500 to-blue-600",
  },
  {
    id: "herhealth",
    name: "HerHealth Matters",
    url: "https://herhealthmatters2.com",
    icon: <Dna className="w-8 h-8" />,
    badges: ["Women's Health", "Chronic Disease Navigation", "Preventive Care", "Cultural Responsiveness", "Longitudinal Data"],
    description: "Women's health navigation, preventive care, chronic-disease support, symptom tracking, medication support, and pointers to potential clinical resources that require direct confirmation.",
    color: "from-teal-500 to-emerald-600",
  },
  {
    id: "perfectly-different",
    name: "Perfectly Different",
    url: "https://neurodifferentassistant.app",
    icon: <Shield className="w-8 h-8" />,
    badges: ["Autism", "ADHD", "AuDHD", "IEP/504", "Neurodiversity-Affirming"],
    description: "Neurodiversity-affirming support platform for autism, ADHD, and AuDHD populations — AI-powered daily guidance, comprehensive IEP/504 plan assistance with template library, and evidence-based therapy tools. Crisis resources with immediate routing to Whole-Person Health, community support groups, and executive function coaching. Produces neurodevelopmental outcome data for disability services and inclusion grants.",
    color: "from-yellow-500 to-amber-600",
  },
  {
    id: "lifebridge",
    name: "LifeBridge",
    url: "https://lifetransitionsaid.org",
    icon: <Users className="w-8 h-8" />,
    badges: ["Virtual 211", "SDOH Navigation", "Crisis Support", "20,670+ Resources", "CHW Hub"],
    description: "Virtual 211 and Community Health Worker coordination hub providing 24/7 resource navigation across housing, food, healthcare, mental health, substance abuse, and crisis support with 20,670+ verified resources. Addresses non-combat life events driving veteran suicide — divorce, job loss, health diagnosis, financial crisis — with evidence-based coping strategies. Social determinant engine scores needs across 7 domains and routes to specialized ecosystem platforms.",
    color: "from-sky-500 to-blue-600",
  },
  {
    id: "speech-bridge",
    name: "LexiBridge (Speech Bridge)",
    url: "https://lexibridge.net",
    icon: <Activity className="w-8 h-8" />,
    badges: ["12+ Dialects", "AAVE Support", "Multi-Language", "Health Literacy", "Accessibility"],
    description: "Dialect-aware, inclusive communication platform bridging language and communication gaps for underserved populations — advanced dialect recognition covering AAVE, Spanglish, Cajun, and 12+ regional dialects with real-time speech-to-text. Multi-language translation (English/Spanish/Vietnamese/Mandarin/Arabic) and culturally responsive communication training for providers. The critical accessibility layer ensuring every health platform serves populations regardless of language barriers.",
    color: "from-indigo-500 to-violet-600",
  },
  {
    id: "m2c",
    name: "Mission Transition (M2C)",
    url: "https://vetmissiontransition.com",
    icon: <Shield className="w-8 h-8" />,
    badges: ["Veteran Health", "TBI Pathway", "Military-to-Civilian", "Benefits Navigation", "Suicide Prevention"],
    description: "Full-spectrum military-to-civilian transition platform with dedicated veteran health pathways — MOS career translation, VA benefits navigation, and proactive outreach during the first 12 months post-separation. Integrates with Whole-Person Health for crisis routing and MaleHealth Matters for men's health navigation.",
    color: "from-green-600 to-emerald-700",
  },
  {
    id: "betterscience-ms-center",
    name: "RPLICE MS Center",
    url: "https://www.bettersciencelab.com/ms-center",
    icon: <Microscope className="w-8 h-8" />,
    badges: ["MS Center Evidence Surface", "Implementation Science", "Research Evidence"],
    description: "RPLICE evidence and implementation-intelligence surface for the MS Center lane. It is an evidence and learning resource, not a verified provider directory or referral receipt.",
    color: "from-slate-600 to-indigo-700",
    status: "evidence_surface",
  },
  {
    id: "autoimmune-thrive",
    name: "Autoimmune Center of Excellence",
    url: "https://autoimmunethrive.com",
    icon: <Dna className="w-8 h-8" />,
    badges: ["Autoimmune Care", "Symptom Tracking", "Flare Support"],
    description: "The catalog-configured autoimmune platform relevant to MS navigation. Its current catalog health flag must be checked before treating it as reachable; a configured URL is not proof of live service.",
    color: "from-blue-600 to-cyan-700",
    status: "offline",
  },
];

export default function HealthNetworkPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" data-testid="health-network-page">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
             <Heart className="w-4 h-4" aria-hidden="true" />
             Ecosystem Health Platforms
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" data-testid="text-page-title">
            ThriveUp Health Network
          </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
             Public links to the community and healthcare platforms in the ecosystem, plus the RPLICE MS Center evidence surface.
             These cards are a catalog snapshot; reachability and provider verification are shown only when the source supports them.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            <Badge variant="outline" className="text-xs">70+ Women's Health Conditions</Badge>
            <Badge variant="outline" className="text-xs">15 Men's Health Domains</Badge>
             <Badge variant="outline" className="text-xs">MS Evidence Surface</Badge>
            <Badge variant="outline" className="text-xs">6 Validated Screenings</Badge>
            <Badge variant="outline" className="text-xs">20,670+ Resources</Badge>
            <Badge variant="outline" className="text-xs">SDOH-First Design</Badge>
            <Badge variant="outline" className="text-xs">988 Crisis Integration</Badge>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {healthPlatforms.map((platform) => (
            <Card
              key={platform.id}
              className="group overflow-hidden border hover:shadow-lg transition-all duration-200"
              data-testid={`card-platform-${platform.id}`}
            >
              <div className={`h-1.5 bg-gradient-to-r ${platform.color}`} />
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${platform.color} text-white shrink-0`}>
                    {platform.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm leading-tight" data-testid={`text-platform-name-${platform.id}`}>
                      {platform.name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{platform.url.replace("https://", "")}</p>
                     <Badge
                       variant={platform.status === "offline" ? "destructive" : "outline"}
                       className="mt-1 text-[10px] px-1.5 py-0"
                     >
                       {platform.status === "offline"
                         ? "Catalog snapshot — offline at last sync"
                         : platform.status === "evidence_surface"
                           ? "Public evidence surface"
                           : "Catalog snapshot — configured link"}
                     </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {platform.badges.map((badge) => (
                    <Badge
                      key={badge}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {badge}
                    </Badge>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  {platform.description}
                </p>

                 <a
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`link-visit-${platform.id}`}
                   className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                   <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                   Visit {platform.name.split(" ")[0]}
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Card className="inline-block border-dashed">
            <CardContent className="p-5 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Ecosystem Integration</p>
              <p>These links expose public platform surfaces. The MS intelligence handoff keeps platform configuration, reachability, RPLICE evidence, and AI-discovered provider leads as separate states; none of those states alone means a referral was accepted or completed.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
