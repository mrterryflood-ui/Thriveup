import { ExternalLink, Heart, Brain, Baby, Pill, Shield, Activity, Users, Stethoscope, Eye, Dna, Ribbon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HealthPlatform {
  id: string;
  name: string;
  url: string;
  icon: React.ReactNode;
  badges: string[];
  description: string;
  color: string;
}

const healthPlatforms: HealthPlatform[] = [
  {
    id: "herhealth",
    name: "HerHealth Network",
    url: "https://herhealthmatters2.com",
    icon: <Ribbon className="w-8 h-8" />,
    badges: ["Cancer", "Cardiovascular", "Autoimmune", "Reproductive", "Mental Health", "Metabolic", "Infectious", "70 Conditions", "Nia AI Navigator"],
    description: "Comprehensive women's health navigation platform covering 70 conditions across 7 specialized domains — cancer, cardiovascular, autoimmune, mental health, reproductive, metabolic, and infectious disease. Powered by Nia, a Perplexity-driven AI navigator delivering culturally responsive health guidance, screening pathways, and provider matching. Serves as the anchor health platform for CDMRP, NIH, and foundation grant submissions with SDOH-first design and P2P mesh architecture.",
    color: "from-pink-500 to-rose-600",
  },
  {
    id: "whole-person-health",
    name: "Whole-Person Health Ecosystem",
    url: "https://mentalwellnesssupport.net",
    icon: <Heart className="w-8 h-8" />,
    badges: ["C-SSRS", "PHQ-9", "GAD-7", "PCL-5", "AUDIT-C", "DAST-10", "Safety Plans", "20,670+ Resources"],
    description: "Central clinical hub and connective tissue for the entire 24-platform ecosystem delivering 6 validated screenings — C-SSRS (suicide), PHQ-9 (depression), GAD-7 (anxiety), PCL-5 (PTSD), AUDIT-C (alcohol), and DAST-10 (drugs). Auto-escalation to 988 Veterans Crisis Line, individualized safety plans, and Reach a Vet crisis pathway with 20,670+ curated resources. Every platform routes crisis, referral, and assessment data through this hub.",
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "sankofa",
    name: "Sankofa Health Network",
    url: "https://yourhealthbirthright.net",
    icon: <Users className="w-8 h-8" />,
    badges: ["Health Equity Gateway", "5 Sub-Platforms", "GIS Matching", "Culturally Responsive"],
    description: "Health equity gateway orchestrating 5 specialized sub-platforms — Maternal Health, Feminine Health, Men's Health, Cognitive Safety, and Medication Management. Delivers culturally responsive behavioral health assessments, GIS-powered resource matching, and population-specific health navigation for Black communities. Produces health equity outcome data with network architecture ensuring no single point of failure.",
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "thehealthyblkman",
    name: "TheHealthyBlkMan",
    url: "https://thehealthyblkman.com",
    icon: <Activity className="w-8 h-8" />,
    badges: ["Prostate Cancer", "Cardiovascular", "Diabetes", "Mental Health", "15 Health Domains", "Malik AI"],
    description: "Comprehensive health platform for Black men covering 15 health domains — from prostate cancer screening navigation and cardiovascular risk assessment to mental health stigma reduction and substance use recovery. Powered by Malik AI navigator with barbershop outreach model, veteran health pathway, and peer mentor matching. Addresses the 5-year life expectancy gap and 2x prostate cancer mortality disparity in Black men.",
    color: "from-emerald-500 to-green-600",
  },
  {
    id: "sankofa-maternal-health",
    name: "Black Maternal Health Network",
    url: "https://yourhealthbirthright.net",
    icon: <Baby className="w-8 h-8" />,
    badges: ["Maternal Mortality", "Doula Matching", "Prenatal/Postnatal", "EPDS Screening", "CHW Dispatch"],
    description: "Directly addressing the Black maternal mortality crisis with evidence-based interventions — comprehensive prenatal/postnatal care navigation, certified doula matching, maternal risk assessment, and community health worker dispatch. Includes maternal mental health screening (EPDS), breastfeeding support, and postpartum recovery planning with social determinant interventions. Targets the 3x maternal mortality gap in Black communities.",
    color: "from-rose-400 to-pink-600",
  },
  {
    id: "sankofa-feminine-health",
    name: "Holistic Black Feminine Health Hub",
    url: "https://yourfeminineneeds.com",
    icon: <Stethoscope className="w-8 h-8" />,
    badges: ["Reproductive Health", "OB/GYN", "Cancer Screening", "Menopause", "Provider Matching"],
    description: "Comprehensive OB/GYN health platform for Black women — reproductive health education, hormonal wellness tracking, preventive screening scheduling, cervical and breast cancer awareness, and culturally responsive provider matching. Integrates with Black Maternal Health Network for pregnancy pathways and SafeCogniCare for peripartum cognitive assessment. Produces population-specific health outcome data addressing reproductive health disparities.",
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
    id: "autoimmune-thrive",
    name: "Autoimmune Center of Excellence",
    url: "https://autoimmunethrive.com",
    icon: <Dna className="w-8 h-8" />,
    badges: ["80+ Conditions", "Symptom Tracking", "Flare Management", "AI Health Companion", "Longitudinal Data"],
    description: "Personal health companion for autoimmune disease management built by a founder with autoimmune disease — delivering authentic, lived-experience-informed longitudinal health outcome data. Daily symptom check-ins with trend analysis, flare tracking with trigger identification, and AI health companion providing personalized coaching across 80+ autoimmune conditions. The chronic disease data engine producing real longitudinal outcome data no other platform can generate.",
    color: "from-teal-500 to-emerald-600",
  },
  {
    id: "pillscheduler",
    name: "PillScheduler",
    url: "https://pillscheduler.net",
    icon: <Pill className="w-8 h-8" />,
    badges: ["Medication Management", "Drug Interactions", "Refill Alerts", "Adherence Scoring", "FDA Database"],
    description: "Comprehensive medication management platform for individuals managing complex multi-drug regimens — intelligent pill reminders with adaptive scheduling, FDA drug interaction database with real-time warnings, and medication adherence scoring with intervention triggers. Cognitive-capacity-aware interface adapts complexity based on SafeCogniCare assessment data. Critical for chronic disease, elderly, and veteran populations on VA prescriptions.",
    color: "from-blue-500 to-indigo-600",
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
    description: "Full-spectrum military-to-civilian transition platform with dedicated veteran health pathways — MOS career translation, VA benefits navigation, and proactive outreach during the first 12 months post-separation (highest suicide risk window). Integrates with Whole-Person Health for C-SSRS/PCL-5 crisis routing and Black Men's Health Hub for veteran-specific health navigation. Serves 318,000+ veterans in rural Texas relying on community provider networks.",
    color: "from-green-600 to-emerald-700",
  },
];

export default function HealthNetworkPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" data-testid="health-network-page">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Heart className="w-4 h-4" />
            13 Connected Health Platforms
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" data-testid="text-page-title">
            ThriveUp Health Network
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
            A connected ecosystem of health platforms serving under-resourced communities across Central Texas. 
            Every platform is free for individuals. Every screening is validated. Every resource is verified.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            <Badge variant="outline" className="text-xs">70+ Women's Health Conditions</Badge>
            <Badge variant="outline" className="text-xs">15 Men's Health Domains</Badge>
            <Badge variant="outline" className="text-xs">80+ Autoimmune Conditions</Badge>
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
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Visit {platform.name.split(" ")[0]}
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Card className="inline-block border-dashed">
            <CardContent className="p-5 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Ecosystem Integration</p>
              <p>All platforms share validated screening data, crisis routing, and resource navigation through the Whole-Person Health hub. 
              Every platform includes 988 Veterans Crisis Line access and SDOH Location Intelligence.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
