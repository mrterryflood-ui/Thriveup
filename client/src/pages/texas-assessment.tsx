import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import {
  MapPin, Users, Briefcase, Heart, Shield, Building2,
  TrendingUp, Globe, ArrowRight, CheckCircle2,
  AlertTriangle, Target, Brain, Award,
  GraduationCap, Stethoscope, Baby,
  Printer, ChevronRight,
  BarChart3, DollarSign, Zap,
  Home, Wifi, Layers, Activity,
  Microscope, RefreshCw, BookOpen, Scale,
  Star, Eye, Compass,
  Play, Pause, Volume2, VolumeX, Maximize,
} from "lucide-react";
import featureVideoSrc from "@assets/learning-academy-web.mp4";
import featureVideoPoster from "@assets/learning-academy-poster.jpg";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BackToTop } from "@/components/back-to-top";

const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const TEXAS_STATS = [
  { icon: Users, label: "Population", value: "30M+", color: "bg-blue-500", detail: "2nd largest state in the US" },
  { icon: Shield, label: "Veterans", value: "1.7M", color: "bg-slate-500", detail: "Largest veteran population in US" },
  { icon: AlertTriangle, label: "Poverty Rate", value: "14.2%", color: "bg-red-500", detail: "Above national average of 12.4%" },
  { icon: Heart, label: "Maternal Mortality", value: "Crisis", color: "bg-pink-500", detail: "Black women 2.8x higher risk" },
  { icon: Home, label: "Housing Gap", value: "48,000+", color: "bg-orange-500", detail: "Units needed below 30% AMI in Austin" },
  { icon: Briefcase, label: "Workforce Gap", value: "12%", color: "bg-emerald-500", detail: "Chance at living wage w/o credentials" },
  { icon: Wifi, label: "Digital Divide", value: "23%", color: "bg-violet-500", detail: "Rural households lack broadband" },
  { icon: Stethoscope, label: "Rural Health", value: "Critical", color: "bg-rose-500", detail: "34 of 254 counties have no hospital" },
];

const HUB_LOCATIONS = [
  {
    name: "Austin Hub",
    lat: 30.2672,
    lng: -97.7431,
    color: "#3b82f6",
    focus: "Housing Crisis Response",
    population: "1,000,000+",
    keyStats: ["Median home $435K", "3,238 homeless (PIT 2025)", "85%+ ELI renters cost-burdened", "48,000+ units needed"],
    platforms: ["LifeBridge", "Mission Transition", "Whole-Person Health", "ISSS", "Sankofa Health"],
    grants: ["St. David's up to $1M", "WIOA $200-500K", "SAMHSA Mental Health"],
  },
  {
    name: "Manor Hub",
    lat: 30.3466,
    lng: -97.5567,
    color: "#10b981",
    focus: "Growth Without Gaps",
    population: "16,300+",
    keyStats: ["89% population growth since 2010", "78% commute outside for work", "Zero workforce center", "1 health clinic for 16K+ residents"],
    platforms: ["Mission Transition", "MCE", "ISSS", "Talk Your Talk", "Sankofa Health"],
    grants: ["Travis County CDBG", "TWC Skills Development $150K", "St. David's"],
  },
  {
    name: "Pflugerville Hub",
    lat: 30.4394,
    lng: -97.6200,
    color: "#8b5cf6",
    focus: "Infrastructure Before Growth",
    population: "76,500+",
    keyStats: ["330 affordable units coming (Branchview 2027)", "CDBG entitlement city", "Zero social infrastructure", "Samsung/Tesla corridor"],
    platforms: ["LifeBridge", "Collaborative Advocate", "Perfectly Different", "MCE", "ISSS"],
    grants: ["HUD CDBG $500K-2M", "PCDC $150K+", "SSG Fox up to $750K", "HRSA Community Health"],
  },
];

const DATA_LAYERS = [
  { id: "poverty", label: "Poverty Concentration", color: "#ef4444", lat: 30.28, lng: -97.72, radius: 8000, value: "18.7%" },
  { id: "poverty2", label: "East Austin Poverty", color: "#ef4444", lat: 30.26, lng: -97.70, radius: 5000, value: "22.4%" },
  { id: "food", label: "Food Desert — East Travis", color: "#22c55e", lat: 30.30, lng: -97.68, radius: 6000, value: "Limited Access" },
  { id: "food2", label: "Food Desert — Manor Area", color: "#22c55e", lat: 30.35, lng: -97.55, radius: 7000, value: "Limited Access" },
  { id: "health", label: "Health Burden — Del Valle", color: "#f97316", lat: 30.18, lng: -97.65, radius: 5500, value: "High" },
  { id: "housing", label: "Housing Instability — Central Austin", color: "#3b82f6", lat: 30.27, lng: -97.74, radius: 9000, value: "Critical" },
  { id: "housing2", label: "Housing Instability — North", color: "#3b82f6", lat: 30.40, lng: -97.68, radius: 6000, value: "High" },
];

const CFIR_DOMAINS = [
  {
    domain: "Intervention Characteristics",
    icon: Target,
    score: 92,
    color: "bg-blue-500",
    findings: [
      "15-service-platform ecosystem provides comprehensive intervention coverage across all SDOH domains",
      "Evidence-based frameworks (CFIR, RE-AIM, EPIS) embedded in platform architecture",
      "MAP-GAP provides continuous quality improvement cycle — preventing implementation drift",
      "Three Realities adaptation engine ensures interventions fit local context, not copy-paste",
    ],
    strengths: ["Strong evidence base", "Adaptability built-in", "Comprehensive coverage"],
  },
  {
    domain: "Outer Setting",
    icon: Globe,
    score: 88,
    color: "bg-emerald-500",
    findings: [
      "Texas regulatory environment supports community-based organizations for service delivery",
      "Five active grant pipelines aligned with federal/state/foundation priorities",
      "Strong partner network: City of Manor, PCDC, PfISD, St. David's Foundation",
      "CDBG entitlement status in Pflugerville provides direct HUD funding pathway",
    ],
    strengths: ["Policy alignment", "Funding diversity", "Partner readiness"],
  },
  {
    domain: "Inner Setting",
    icon: Building2,
    score: 85,
    color: "bg-violet-500",
    findings: [
      "Three organizational entities provide structural flexibility (Foundation, Academy, Collaborative Advocate)",
      "VOSB status enables federal contracting pipeline via 8(a) and HUBZone programs",
      "Doctoral-level leadership across 7 disciplines provides implementation science depth",
      "Technology infrastructure supports real-time fidelity tracking via SALP indicators",
    ],
    strengths: ["Leadership depth", "Organizational structure", "Technology readiness"],
  },
  {
    domain: "Individual Characteristics",
    icon: Users,
    score: 90,
    color: "bg-amber-500",
    findings: [
      "Dr. Terry Flood — 4 doctoral disciplines, Bronze Star (x2), 20+ years implementation experience",
      "CHW workforce pipeline designed for culturally responsive, bilingual service delivery",
      "Facilitator competency models ensure quality program delivery across all platforms",
      "Staff training protocols embedded in platform architecture — not external add-ons",
    ],
    strengths: ["Founder expertise", "Workforce pipeline", "Training infrastructure"],
  },
  {
    domain: "Implementation Process",
    icon: RefreshCw,
    score: 94,
    color: "bg-rose-500",
    findings: [
      "6-step MAP-GAP cycle provides structured implementation process with continuous feedback",
      "SALP indicators track fidelity in real time — visible to all stakeholders",
      "MG-PATR protocol enables systematic replication while preserving local adaptation",
      "Three Realities assessment prevents the #1 failure: copy-pasting programs across contexts",
    ],
    strengths: ["Structured process", "Real-time fidelity", "Replication protocol"],
  },
];

const REAIM_SCORES = [
  {
    dimension: "Reach",
    letter: "R",
    score: 88,
    color: "from-blue-500 to-blue-600",
    description: "How many of the target population will the intervention reach?",
    austin: { score: 90, detail: "1M+ population, 5,000+ individuals Year 1 target, 15-service-platform entry points" },
    manor: { score: 85, detail: "16,300+ residents, bilingual outreach, school-based deployment via Manor ISD" },
    pflugerville: { score: 88, detail: "76,500+ residents, Branchview 330-unit pipeline, PfISD 28,000 students" },
  },
  {
    dimension: "Effectiveness",
    letter: "E",
    score: 91,
    color: "from-emerald-500 to-emerald-600",
    description: "What is the impact on important outcomes?",
    austin: { score: 92, detail: "CFIR/RE-AIM validated, SALP fidelity tracking, evidence-based curricula" },
    manor: { score: 90, detail: "Closing workforce gap (78% commute), health desert bridge, school wraparound" },
    pflugerville: { score: 91, detail: "Pre-occupancy social infrastructure, CDBG optimization, supplier diversity pipeline" },
  },
  {
    dimension: "Adoption",
    letter: "A",
    score: 85,
    color: "from-violet-500 to-violet-600",
    description: "How many settings/organizations will adopt the intervention?",
    austin: { score: 87, detail: "St. David's evaluation underway, ECHO Housing in discovery, AISD outreach planned" },
    manor: { score: 83, detail: "City of Manor in active conversation, Manor ISD discovery underway, CommUnity Care identified" },
    pflugerville: { score: 86, detail: "PCDC contact identified (outreach planned), Samsung/Tesla supplier pipeline mapped, ACC campus in scope" },
  },
  {
    dimension: "Implementation",
    letter: "I",
    score: 94,
    color: "from-amber-500 to-amber-600",
    description: "To what extent is the intervention implemented as intended?",
    austin: { score: 94, detail: "MAP-GAP CQI, SALP indicators, dosage tracking, real-time dashboards" },
    manor: { score: 93, detail: "ESRI 3rd Spaces integration, bilingual deployment, mobile workforce hub" },
    pflugerville: { score: 95, detail: "Branchview timeline-driven deployment, CDBG compliance, phased rollout" },
  },
  {
    dimension: "Maintenance",
    letter: "M",
    score: 87,
    color: "from-rose-500 to-rose-600",
    description: "To what extent is the intervention sustained over time?",
    austin: { score: 88, detail: "Multi-grant revenue model, platform self-service, community ownership transfer" },
    manor: { score: 85, detail: "City partnership sustainability, school integration, ESRI data persistence" },
    pflugerville: { score: 88, detail: "CDBG annual entitlement, PCDC recurring grants, institutional partnerships" },
  },
];

const FIVE_DOMAINS = [
  {
    domain: "Workforce Development",
    icon: Briefcase,
    color: "bg-emerald-500",
    severity: "critical",
    stateData: [
      "Texas unemployment rate: 4.1% — but underemployment at 12.8% in rural areas",
      "I-35 corridor $10B+ construction creating 50,000+ jobs — pipeline underdeveloped",
      "Samsung (Taylor) + Tesla (Del Valle) = 20,000+ regional jobs with supplier networks",
      "Only 12% chance of living-wage employment without post-secondary credentials",
      "WIOA Title I Youth programs serve only 15% of eligible population statewide",
    ],
    thriveupResponse: [
      "Mission Transition — military-to-civilian career pathways with credential recovery",
      "MCE — minority business development, SBA 8(a)/HUBZone certification support",
      "ThriveUp — workforce readiness, career exploration, dual credit alignment",
      "Collaborative Advocate — VOSB federal contracting pipeline, employer partnerships",
    ],
    platforms: ["Mission Transition", "MCE", "ThriveUp", "Collaborative Advocate"],
  },
  {
    domain: "Housing Stability",
    icon: Home,
    color: "bg-blue-500",
    severity: "critical",
    stateData: [
      "Austin median home: $435K — only 2 of 75 zip codes affordable to median-income families",
      "3,238 homeless individuals (PIT 2025) — up 36% from 2023, youth nearly quadrupled",
      "85%+ of ELI renters paying >50% of income on housing across Austin metro",
      "Pflugerville: 330 affordable units coming by 2027 with zero social infrastructure planned",
      "Manor: 43% of renters cost-burdened, growing displacement pressure from Austin expansion",
    ],
    thriveupResponse: [
      "LifeBridge — housing transitions, SDOH coordination, resource navigation",
      "M2C Transition — benefits enrollment, community connections, day-to-day support",
      "Pre-Branchview social infrastructure buildout — services ready before units fill",
      "Anti-displacement monitoring — track resident movement, intervene before displacement",
    ],
    platforms: ["LifeBridge", "M2C Transition"],
  },
  {
    domain: "Health Equity",
    icon: Heart,
    color: "bg-rose-500",
    severity: "critical",
    stateData: [
      "Texas maternal mortality rate among worst in nation — Black women 2.8x higher risk",
      "34 of 254 Texas counties have no hospital — rural health desert expanding",
      "Manor: 1 health clinic for 16,300+ residents, zero OB/GYN within city limits",
      "Pflugerville: 6-8 week mental health wait times, no community health center",
      "Diabetes prevalence 14.2% in Manor — 40% above state average",
    ],
    thriveupResponse: [
      "Whole-Person Health — PHQ-9, GAD-7, C-SSRS screenings via platform",
      "Sankofa Health Network — culturally responsive health content, bilingual delivery",
      "Black Maternal Health Network — perinatal & postpartum care, doula coordination",
      "HerHealth Network — holistic women's health, chronic disease + medication adherence navigation",
    ],
    platforms: ["Whole-Person Health", "Sankofa Health", "Black Maternal Health", "HerHealth Network", "SafeCogniCare"],
  },
  {
    domain: "Youth & Education",
    icon: GraduationCap,
    color: "bg-violet-500",
    severity: "high",
    stateData: [
      "934 homeless youth in Austin (PIT 2025) — nearly quadrupled from 247 in 2020",
      "Texas graduation rate 90% but only 60% meet college/career readiness standards",
      "Manor ISD: 40% economically disadvantaged, graduation rate below state average",
      "PfISD: 1 counselor per 380 students (recommended 1:250), 400+ after-school waitlist",
      "College-going rate declining statewide — 52% to 47% over 3 years in Manor",
    ],
    thriveupResponse: [
      "ISSS — school-based wraparound services, MTSS compliance, academic support",
      "Talk Your Talk — communication access (89 spoken + 18 sign), SEL development, career exploration",
      "Perfectly Different — neurodivergent support, evaluations, family resources",
      "ThriveUp — youth engagement, gamified learning, STAAR prep",
    ],
    platforms: ["ISSS", "Talk Your Talk", "Perfectly Different", "ThriveUp"],
  },
  {
    domain: "Digital Infrastructure",
    icon: Wifi,
    color: "bg-indigo-500",
    severity: "moderate",
    stateData: [
      "23% of rural Texas households lack reliable broadband internet access",
      "Manor: no public computer lab or digital literacy center",
      "Pflugerville: digital divide persists in eastern neighborhoods",
      "City of Manor using ESRI for 3rd Spaces mapping — integration opportunity",
      "Limited digital government services — most require in-person Austin trips",
    ],
    thriveupResponse: [
      "SafeReport — compliance-grade clinical-setting AI, 0-PHI-egress, HITL-default-on",
      "Civic Signal — civic engagement and public-comment infrastructure across services",
      "Talk Your Talk — communication access (89 spoken + 18 sign), community content production",
      "ESRI integration overlay — ThriveUp data layers on city GIS infrastructure",
    ],
    platforms: ["SafeReport", "Civic Signal", "Talk Your Talk"],
  },
];

const GRANT_ALIGNMENT = [
  {
    grant: "WIOA Title I Youth",
    amount: "$200K–$500K",
    source: "Workforce Solutions Capital Area",
    deadline: "Rolling",
    status: "active",
    needsAddressed: [
      "Youth workforce development for 16-24 age group across three hubs",
      "I-35 corridor construction career pathways — CDL, OSHA, heavy equipment",
      "14 required youth elements covered through ecosystem platform integration",
    ],
    platforms: ["ThriveUp", "Mission Transition", "MCE", "Talk Your Talk"],
    cfirAlignment: "Strong — competency-based education models, career pathway mapping, employer partnerships",
    reamScore: 88,
  },
  {
    grant: "Foundation Grants",
    amount: "$100K–$500K",
    source: "Multiple Foundations",
    deadline: "Rolling LOI",
    status: "active",
    needsAddressed: [
      "Community-based health equity initiatives in underserved areas",
      "Culturally responsive service delivery for diverse populations",
      "Evidence-based program models with measurable outcomes",
    ],
    platforms: ["Sankofa Health", "Whole-Person Health", "LifeBridge", "ISSS"],
    cfirAlignment: "Strong — CFIR/RE-AIM framework provides evidence base funders require",
    reamScore: 86,
  },
  {
    grant: "St. David's Foundation",
    amount: "Up to $1M",
    source: "St. David's Foundation",
    deadline: "Opens March 30, 2026",
    status: "priority",
    needsAddressed: [
      "100% geographic overlap — Bastrop, Caldwell, Hays, Travis, Williamson counties",
      "Healthcare workforce development pathways — $10.1M available pool",
      "Culturally responsive mental health — $4.2M pool, maternal health $7.3M pool",
      "Community-driven change — $9.1M pool for community decision-making initiatives",
    ],
    platforms: ["All 15 service platforms", "Mission Transition", "Sankofa Health", "Black Maternal Health"],
    cfirAlignment: "Perfect — every St. David's priority maps to at least 3 ecosystem platforms",
    reamScore: 94,
  },
  {
    grant: "SSG Fox VA Suicide Prevention",
    amount: "Up to $750K",
    source: "Department of Veterans Affairs",
    deadline: "June 12–18, 2026",
    status: "upcoming",
    needsAddressed: [
      "1.7M Texas veterans — largest veteran population in the nation",
      "Veteran suicide prevention through holistic support, not just crisis intervention",
      "Housing, employment, and behavioral health integration for veteran populations",
    ],
    platforms: ["Collaborative Advocate", "Whole-Person Health", "LifeBridge", "SafeCogniCare"],
    cfirAlignment: "Strong — veteran-founded organization, VOSB status, Bronze Star (x2) founder credibility",
    reamScore: 90,
  },
];

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    moderate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  };
  return <Badge className={`text-xs ${colors[severity] || ""}`}>{severity.toUpperCase()}</Badge>;
}

function ScoreGauge({ score, label, size = "md" }: { score: number; label: string; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-16 h-16" : "w-24 h-24";
  const textSize = size === "sm" ? "text-lg" : "text-2xl";
  const color = score >= 90 ? "#22c55e" : score >= 80 ? "#3b82f6" : score >= 70 ? "#eab308" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`relative ${dim}`}>
        <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${(score / 100) * 314} 314`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${textSize} font-bold`} style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground text-center">{label}</span>
    </div>
  );
}

function MapLegend() {
  return (
    <Card className="absolute bottom-4 right-4 z-[1000] w-52" data-testid="card-map-legend">
      <CardContent className="p-3 space-y-2">
        <p className="text-xs font-semibold">Map Legend</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Austin Hub</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Manor Hub</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-violet-500" />
            <span>Pflugerville Hub</span>
          </div>
        </div>
        <div className="border-t pt-1.5 space-y-1.5">
          <p className="text-xs font-semibold">Data Layers</p>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-red-500 opacity-40" />
            <span>Poverty</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-green-500 opacity-40" />
            <span>Food Desert</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-orange-500 opacity-40" />
            <span>Health Burden</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-blue-500 opacity-40" />
            <span>Housing Instability</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PlatformTourVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [playError, setPlayError] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      const attempt = videoRef.current.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt
          .then(() => {
            setPlayError(false);
            setIsPlaying(true);
            setShowOverlay(false);
          })
          .catch(() => {
            // Playback refused (codec, network, or browser policy). Surface it
            // instead of leaving the overlay to imply the video is broken.
            setPlayError(true);
            setIsPlaying(false);
            setShowOverlay(true);
          });
        return;
      }
      setIsPlaying(true);
      setShowOverlay(false);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowOverlay(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      togglePlay();
    }
  };

  return (
    <Card className="overflow-hidden shadow-xl border-2 border-primary/10" data-testid="card-feature-video">
      <div className="relative group">
        <video
          ref={videoRef}
          src={featureVideoSrc}
          poster={featureVideoPoster}
          preload="none"
          className="w-full aspect-video bg-black"
          aria-label="ThriveUp platform tour with Arthur Wakanda"
          onEnded={() => { setIsPlaying(false); setShowOverlay(true); }}
          onClick={togglePlay}
          playsInline
          data-testid="video-feature-guide"
        />

        {showOverlay && !isPlaying && (
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 flex flex-col items-center justify-center cursor-pointer"
            onClick={togglePlay}
            onKeyDown={handleOverlayKeyDown}
            role="button"
            tabIndex={0}
            aria-label="Play platform tour video"
            data-testid="overlay-video-play"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/90 flex items-center justify-center shadow-2xl mb-4 transition-transform hover:scale-110">
              <Play className="h-10 w-10 md:h-12 md:w-12 text-violet-700 ml-1" />
            </div>
            <p className="text-white text-lg md:text-xl font-semibold" data-testid="text-video-title">Watch the Platform Tour</p>
            <p className="text-white/70 text-sm mt-1" data-testid="text-video-subtitle">7 minutes with Arthur Wakanda</p>
          </div>
        )}

        {playError && (
          <div
            className="absolute top-2 left-2 right-2 rounded-md bg-red-600/90 text-white text-xs px-3 py-2 text-center"
            role="alert"
            data-testid="banner-video-playback-error"
          >
            The video could not start. Check your connection, then press play again.
          </div>
        )}

        <div className={`absolute bottom-0 left-0 right-0 p-2 sm:p-3 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-between gap-2 transition-opacity ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
          <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-white/20 min-h-[44px] min-w-[44px]" onClick={togglePlay} aria-label={isPlaying ? "Pause video" : "Play video"} data-testid="button-video-playpause">
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-1">
            <span className="text-white/70 text-xs px-2 py-1 rounded bg-white/10 hidden sm:inline-flex items-center gap-1" data-testid="text-video-cc-indicator" aria-label="Closed captions available">
              CC
            </span>
            <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-white/20 min-h-[44px] min-w-[44px]" onClick={toggleMute} aria-label={isMuted ? "Unmute video" : "Mute video"} data-testid="button-video-mute">
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-white/20 min-h-[44px] min-w-[44px]" onClick={toggleFullscreen} aria-label="Toggle fullscreen" data-testid="button-video-fullscreen">
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function TexasAssessmentPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedHub, setSelectedHub] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Texas State Needs Assessment | ThriveUp";
  }, []);

  const totalGrantValue = "$2.675M–$4.375M";

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10" data-testid="texas-assessment-page">
      <PageHeader
        title="Texas State Needs Assessment"
        description="Comprehensive analysis with GIS mapping, RPLICE validation, and grant alignment for Austin/Manor/Pflugerville"
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/austin"} data-testid="button-austin-link">
              <MapPin className="h-4 w-4 mr-1" /> Austin
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/manor"} data-testid="button-manor-link">
              <MapPin className="h-4 w-4 mr-1" /> Manor
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/pflugerville"} data-testid="button-pflugerville-link">
              <MapPin className="h-4 w-4 mr-1" /> Pflugerville
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} data-testid="button-print">
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
          </div>
        }
      />

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-900 via-red-800 to-blue-900 text-white p-8 md:p-12" data-testid="hero-texas">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-red-400 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-blue-400 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-4xl">
          <Badge className="bg-white/20 text-white border-white/30 mb-4" data-testid="badge-texas">
            <Star className="h-3 w-3 mr-1" /> Texas State Needs Assessment
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            The Lone Star State Needs a New Approach
          </h1>
          <p className="text-xl text-red-100 mb-3">
            30 million Texans. 1.7 million veterans. 14.2% poverty. A maternal mortality crisis.
            Rural health deserts. A housing emergency. The data demands action — and the right tools.
          </p>
          <p className="text-lg text-red-200 mb-6">
            Three regional hubs. Twenty-four platforms. Five grants. One ecosystem. RPLICE validated.
          </p>
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="text-sm px-3 py-1"><Users className="h-3.5 w-3.5 mr-1" /> 30M+ Population</Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1"><Shield className="h-3.5 w-3.5 mr-1" /> 1.7M Veterans</Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1"><Globe className="h-3.5 w-3.5 mr-1" /> 3 Regional Hubs</Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1"><Brain className="h-3.5 w-3.5 mr-1" /> RPLICE Validated</Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1"><DollarSign className="h-3.5 w-3.5 mr-1" /> {totalGrantValue}</Badge>
          </div>
        </div>
      </div>

      <div className="text-center mb-6">
        <Badge variant="secondary" className="mb-4">
          <Play className="mr-1 h-3 w-3" /> Platform Tour
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-video-heading">
          See ThriveUp in Action
        </h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          A 7-minute tour of the platform — from community intelligence and grant discovery to workforce pipelines, AI tools, and partner coordination.
        </p>
      </div>
      <PlatformTourVideo />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TEXAS_STATS.map((stat) => (
          <Card key={stat.label} className="text-center" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardContent className="pt-5 pb-4">
              <div className={`mx-auto w-11 h-11 rounded-full flex items-center justify-center mb-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-2xl font-bold mb-0.5">{stat.value}</div>
              <div className="text-sm font-medium">{stat.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.detail}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-texas">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1 h-auto p-1">
          <TabsTrigger value="overview" className="text-xs md:text-sm" data-testid="tab-overview">
            <BarChart3 className="h-3.5 w-3.5 mr-1" /> State Overview
          </TabsTrigger>
          <TabsTrigger value="gis" className="text-xs md:text-sm" data-testid="tab-gis">
            <MapPin className="h-3.5 w-3.5 mr-1" /> GIS Map
          </TabsTrigger>
          <TabsTrigger value="rplice" className="text-xs md:text-sm" data-testid="tab-rplice">
            <Microscope className="h-3.5 w-3.5 mr-1" /> RPLICE Analysis
          </TabsTrigger>
          <TabsTrigger value="domains" className="text-xs md:text-sm" data-testid="tab-domains">
            <Layers className="h-3.5 w-3.5 mr-1" /> 5-Domain Assessment
          </TabsTrigger>
          <TabsTrigger value="grants" className="text-xs md:text-sm" data-testid="tab-grants">
            <DollarSign className="h-3.5 w-3.5 mr-1" /> Grant Alignment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6" data-testid="content-overview">
          <div>
            <h2 className="text-2xl font-bold mb-2">Texas State Overview</h2>
            <p className="text-muted-foreground mb-6">
              Key population, demographic, and socioeconomic data points from CDC, Census Bureau, and state agencies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card data-testid="card-demographics">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" /> Demographics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm"><span>Total Population</span><span className="font-bold">30.03M</span></div>
                <div className="flex justify-between text-sm"><span>Hispanic/Latino</span><span className="font-bold">40.2%</span></div>
                <div className="flex justify-between text-sm"><span>White (non-Hispanic)</span><span className="font-bold">39.7%</span></div>
                <div className="flex justify-between text-sm"><span>Black/African American</span><span className="font-bold">12.9%</span></div>
                <div className="flex justify-between text-sm"><span>Asian</span><span className="font-bold">5.4%</span></div>
                <div className="flex justify-between text-sm"><span>Median Age</span><span className="font-bold">35.1 years</span></div>
                <div className="flex justify-between text-sm"><span>Veterans</span><span className="font-bold">1.7M</span></div>
                <div className="flex justify-between text-sm"><span>Urban Population</span><span className="font-bold">84.7%</span></div>
              </CardContent>
            </Card>

            <Card data-testid="card-economics">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-500" /> Economic Indicators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm"><span>Median Household Income</span><span className="font-bold">$67,321</span></div>
                <div className="flex justify-between text-sm"><span>Poverty Rate</span><span className="font-bold text-red-500">14.2%</span></div>
                <div className="flex justify-between text-sm"><span>Child Poverty Rate</span><span className="font-bold text-red-500">19.1%</span></div>
                <div className="flex justify-between text-sm"><span>Unemployment Rate</span><span className="font-bold">4.1%</span></div>
                <div className="flex justify-between text-sm"><span>Underemployment (Rural)</span><span className="font-bold text-orange-500">12.8%</span></div>
                <div className="flex justify-between text-sm"><span>Uninsured Rate</span><span className="font-bold text-red-500">17.3%</span></div>
                <div className="flex justify-between text-sm"><span>SNAP Recipients</span><span className="font-bold">3.6M</span></div>
                <div className="flex justify-between text-sm"><span>GDP Rank</span><span className="font-bold">#2 Nationally</span></div>
              </CardContent>
            </Card>

            <Card data-testid="card-health-overview">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5 text-rose-500" /> Health Disparities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm"><span>Uninsured Adults</span><span className="font-bold text-red-500">20.3%</span></div>
                <div className="flex justify-between text-sm"><span>Maternal Mortality (Black)</span><span className="font-bold text-red-500">2.8x higher</span></div>
                <div className="flex justify-between text-sm"><span>Diabetes Prevalence</span><span className="font-bold">12.1%</span></div>
                <div className="flex justify-between text-sm"><span>Obesity Rate</span><span className="font-bold">34.8%</span></div>
                <div className="flex justify-between text-sm"><span>Mental Health Provider Gap</span><span className="font-bold text-orange-500">Severe</span></div>
                <div className="flex justify-between text-sm"><span>Counties Without Hospital</span><span className="font-bold text-red-500">34 of 254</span></div>
                <div className="flex justify-between text-sm"><span>Opioid Deaths (Annual)</span><span className="font-bold">4,100+</span></div>
                <div className="flex justify-between text-sm"><span>Veteran Suicide Rate</span><span className="font-bold text-red-500">1.5x civilian</span></div>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-regional-context">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> Central Texas Regional Context
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {HUB_LOCATIONS.map((hub) => (
                  <div key={hub.name} className="space-y-3" data-testid={`card-hub-${hub.name.toLowerCase().replace(/\s+/g, '-')}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: hub.color }} />
                      <h4 className="font-semibold">{hub.name}</h4>
                    </div>
                    <Badge variant="outline" className="text-xs">{hub.focus}</Badge>
                    <p className="text-xs text-muted-foreground">Population: {hub.population}</p>
                    <ul className="space-y-1">
                      {hub.keyStats.map((stat, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                          {stat}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30" data-testid="card-data-sources">
            <CardContent className="pt-5">
              <h4 className="text-sm font-semibold mb-2">Data Sources</h4>
              <p className="text-xs text-muted-foreground">
                U.S. Census Bureau American Community Survey (ACS) 2022 | CDC PLACES 2023 | CDC Social Vulnerability Index (SVI) |
                Texas Health and Human Services Commission | Bureau of Labor Statistics (BLS) | USDA Food Access Research Atlas |
                HUD Comprehensive Housing Affordability Strategy (CHAS) | SAMHSA National Survey on Drug Use and Health |
                Texas Education Agency (TEA) | Austin/Travis County PIT Count 2025
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gis" className="mt-6 space-y-6" data-testid="content-gis">
          <div>
            <h2 className="text-2xl font-bold mb-2">Interactive GIS Map — Central Texas</h2>
            <p className="text-muted-foreground mb-6">
              Austin/Manor/Pflugerville triangle with data layers for poverty, health burden, housing instability, and food deserts.
              Click on hub markers for detailed information.
            </p>
          </div>

          <div className="relative rounded-lg overflow-hidden border" data-testid="map-container">
            <MapContainer
              center={[30.33, -97.68]}
              zoom={11}
              style={{ height: "600px", width: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {DATA_LAYERS.map((layer) => (
                <Circle
                  key={layer.id}
                  center={[layer.lat, layer.lng]}
                  radius={layer.radius}
                  pathOptions={{
                    color: layer.color,
                    fillColor: layer.color,
                    fillOpacity: 0.15,
                    weight: 1,
                    opacity: 0.4,
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">{layer.label}</p>
                      <p className="text-muted-foreground">Value: {layer.value}</p>
                    </div>
                  </Popup>
                </Circle>
              ))}

              {HUB_LOCATIONS.map((hub) => (
                <Marker
                  key={hub.name}
                  position={[hub.lat, hub.lng]}
                  icon={customIcon}
                  eventHandlers={{
                    click: () => setSelectedHub(hub.name),
                  }}
                >
                  <Popup>
                    <div className="text-sm space-y-2 min-w-[200px]">
                      <p className="font-bold text-base">{hub.name}</p>
                      <p className="font-semibold" style={{ color: hub.color }}>{hub.focus}</p>
                      <p>Population: {hub.population}</p>
                      <div>
                        <p className="font-semibold text-xs mb-1">Key Challenges:</p>
                        <ul className="space-y-0.5">
                          {hub.keyStats.map((stat, i) => (
                            <li key={i} className="text-xs">{stat}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-xs mb-1">Active Platforms:</p>
                        <div className="flex flex-wrap gap-1">
                          {hub.platforms.map((p) => (
                            <span key={p} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{p}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-xs mb-1">Grant Targets:</p>
                        <div className="flex flex-wrap gap-1">
                          {hub.grants.map((g) => (
                            <span key={g} className="text-[10px] bg-blue-50 px-1.5 py-0.5 rounded">{g}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            <MapLegend />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {HUB_LOCATIONS.map((hub) => (
              <Card
                key={hub.name}
                className={`cursor-pointer hover-elevate ${selectedHub === hub.name ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedHub(hub.name)}
                data-testid={`card-hub-detail-${hub.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: hub.color }} />
                    <h3 className="font-bold">{hub.name}</h3>
                  </div>
                  <Badge variant="outline" className="text-xs mb-3">{hub.focus}</Badge>
                  <div className="space-y-1.5">
                    {hub.keyStats.slice(0, 3).map((stat, i) => (
                      <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        {stat}
                      </p>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t">
                    {hub.platforms.slice(0, 3).map((p) => (
                      <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                    ))}
                    {hub.platforms.length > 3 && (
                      <Badge variant="secondary" className="text-xs">+{hub.platforms.length - 3}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rplice" className="mt-6 space-y-8" data-testid="content-rplice">
          <div>
            <h2 className="text-2xl font-bold mb-2">RPLICE Implementation Science Analysis</h2>
            <p className="text-muted-foreground mb-6">
              CFIR (Consolidated Framework for Implementation Research) domain assessment and RE-AIM evaluation
              scoring for the ThriveUp ecosystem across three regional hubs.
            </p>
          </div>

          <Card className="bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-950/20 dark:to-violet-950/20 border-blue-200 dark:border-blue-800" data-testid="card-cfir-overview">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Microscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                CFIR Domain Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap justify-center gap-6 mb-6">
                {CFIR_DOMAINS.map((d) => (
                  <ScoreGauge key={d.domain} score={d.score} label={d.domain} size="sm" />
                ))}
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Overall CFIR Readiness Score: <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">89.8 / 100</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {CFIR_DOMAINS.map((domain) => (
              <Card key={domain.domain} data-testid={`card-cfir-${domain.domain.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${domain.color} flex items-center justify-center`}>
                        <domain.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{domain.domain}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={domain.score} className="h-2 w-24" />
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{domain.score}/100</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {domain.strengths.map((s) => (
                        <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {domain.findings.map((finding, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                        {finding}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gradient-to-r from-emerald-50 to-amber-50 dark:from-emerald-950/20 dark:to-amber-950/20 border-emerald-200 dark:border-emerald-800" data-testid="card-reaim">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                RE-AIM Evaluation Framework
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap justify-center gap-6 mb-4">
                {REAIM_SCORES.map((r) => (
                  <ScoreGauge key={r.dimension} score={r.score} label={`${r.letter} — ${r.dimension}`} />
                ))}
              </div>

              <div className="space-y-4">
                {REAIM_SCORES.map((r) => (
                  <div key={r.dimension} className="border rounded-lg p-4" data-testid={`card-reaim-${r.dimension.toLowerCase()}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${r.color} flex items-center justify-center text-white font-bold text-sm`}>
                        {r.letter}
                      </div>
                      <div>
                        <h4 className="font-semibold">{r.dimension}</h4>
                        <p className="text-xs text-muted-foreground">{r.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 rounded-md bg-muted/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Austin</span>
                          <span className="text-xs font-bold">{r.austin.score}/100</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{r.austin.detail}</p>
                      </div>
                      <div className="p-3 rounded-md bg-muted/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Manor</span>
                          <span className="text-xs font-bold">{r.manor.score}/100</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{r.manor.detail}</p>
                      </div>
                      <div className="p-3 rounded-md bg-muted/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">Pflugerville</span>
                          <span className="text-xs font-bold">{r.pflugerville.score}/100</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{r.pflugerville.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Combined RE-AIM Score: <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">89.0 / 100</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Scores above 80 indicate strong implementation readiness across all RE-AIM dimensions
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-three-realities-texas">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Three Realities — Texas Application
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-400">What Research Says</h4>
                  </div>
                  <ul className="space-y-1.5">
                    <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-400" />
                      SAMHSA Strategic Prevention Framework validates coalition-based substance use prevention
                    </li>
                    <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-400" />
                      WIOA workforce development frameworks demonstrate competency-based training ROI
                    </li>
                    <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-400" />
                      Housing First evidence base shows 80% housing retention when combined with wraparound
                    </li>
                    <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-400" />
                      CFIR/RE-AIM implementation science ensures fidelity to evidence-based practice
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-purple-500" />
                    <h4 className="font-semibold text-sm text-purple-700 dark:text-purple-400">What Politics Allow</h4>
                  </div>
                  <ul className="space-y-1.5">
                    <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-purple-400" />
                      Texas prioritizes community-based solutions over government-run programs
                    </li>
                    <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-purple-400" />
                      CDBG entitlement status in Pflugerville creates direct federal funding pathway
                    </li>
                    <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-purple-400" />
                      VOSB/veteran-founded status provides bipartisan credibility and procurement advantage
                    </li>
                    <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-purple-400" />
                      St. David's Foundation $100M+ annual investment creates strong philanthropic alignment
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Compass className="h-4 w-4 text-emerald-500" />
                    <h4 className="font-semibold text-sm text-emerald-700 dark:text-emerald-400">What Works on the Ground</h4>
                  </div>
                  <ul className="space-y-1.5">
                    <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-emerald-400" />
                      Manor/Pflugerville residents need services brought TO them — 78% commute out for work
                    </li>
                    <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-emerald-400" />
                      52% Hispanic community in Manor requires bilingual, culturally responsive delivery
                    </li>
                    <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-emerald-400" />
                      I-35 construction + Samsung + Tesla creating immediate workforce pipeline demand
                    </li>
                    <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-emerald-400" />
                      Digital platform delivery overcomes transportation barriers in suburban/rural areas
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains" className="mt-6 space-y-6" data-testid="content-domains">
          <div>
            <h2 className="text-2xl font-bold mb-2">5-Domain Statewide Assessment</h2>
            <p className="text-muted-foreground mb-6">
              Analysis across Workforce, Housing, Health, Youth, and Digital Infrastructure — with specific Texas data
              points and how ThriveUp addresses each domain.
            </p>
          </div>

          {FIVE_DOMAINS.map((domain) => (
            <Card key={domain.domain} data-testid={`card-domain-${domain.domain.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${domain.color} flex items-center justify-center`}>
                      <domain.icon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg">{domain.domain}</CardTitle>
                  </div>
                  <SeverityBadge severity={domain.severity} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Texas Data Points
                  </h4>
                  <ul className="space-y-1.5">
                    {domain.stateData.map((point, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <ChevronRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-red-400" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> ThriveUp Response
                  </h4>
                  <ul className="space-y-1.5">
                    {domain.thriveupResponse.map((response, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <ArrowRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-emerald-400" />
                        {response}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-1 pt-3 border-t">
                  <span className="text-xs text-muted-foreground mr-2">Platforms:</span>
                  {domain.platforms.map((p) => (
                    <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="grants" className="mt-6 space-y-6" data-testid="content-grants">
          <div>
            <h2 className="text-2xl font-bold mb-2">Grant Alignment — 4 Active Pipelines</h2>
            <p className="text-muted-foreground mb-6">
              How the Texas needs assessment maps to active grants — WIOA, Foundation,
              St. David's, and SSG Fox.
            </p>
          </div>

          <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 border-emerald-200 dark:border-emerald-800" data-testid="card-grant-summary">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                {GRANT_ALIGNMENT.map((grant) => (
                  <div key={grant.grant} className="space-y-1">
                    <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{grant.amount}</div>
                    <div className="text-xs font-medium">{grant.grant}</div>
                    <Badge variant="outline" className={`text-[10px] ${
                      grant.status === "priority" ? "border-emerald-500 text-emerald-700 dark:text-emerald-400" :
                      grant.status === "preparing" ? "border-blue-500 text-blue-700 dark:text-blue-400" :
                      grant.status === "active" ? "border-amber-500 text-amber-700 dark:text-amber-400" :
                      "border-violet-500 text-violet-700 dark:text-violet-400"
                    }`}>
                      {grant.status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="text-center mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Combined Pipeline Value: <span className="font-bold text-emerald-700 dark:text-emerald-400 text-lg">{totalGrantValue}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {GRANT_ALIGNMENT.map((grant) => (
            <Card key={grant.grant} data-testid={`card-grant-${grant.grant.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="text-lg">{grant.grant}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">{grant.source} | Deadline: {grant.deadline}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-sm font-bold">{grant.amount}</Badge>
                    <Badge variant="outline" className={`text-xs ${
                      grant.status === "priority" ? "border-emerald-500 text-emerald-700 dark:text-emerald-400" :
                      grant.status === "preparing" ? "border-blue-500 text-blue-700 dark:text-blue-400" :
                      grant.status === "active" ? "border-amber-500 text-amber-700 dark:text-amber-400" :
                      "border-violet-500 text-violet-700 dark:text-violet-400"
                    }`}>
                      {grant.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-primary" /> Needs Addressed
                  </h4>
                  <ul className="space-y-1.5">
                    {grant.needsAddressed.map((need, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-emerald-500" />
                        {need}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-md bg-muted/30">
                    <h4 className="text-xs font-semibold mb-1 flex items-center gap-1">
                      <Microscope className="h-3 w-3" /> CFIR Alignment
                    </h4>
                    <p className="text-xs text-muted-foreground">{grant.cfirAlignment}</p>
                  </div>
                  <div className="p-3 rounded-md bg-muted/30">
                    <h4 className="text-xs font-semibold mb-1 flex items-center gap-1">
                      <Eye className="h-3 w-3" /> RE-AIM Score
                    </h4>
                    <div className="flex items-center gap-2">
                      <Progress value={grant.reamScore} className="h-2 flex-1" />
                      <span className="text-xs font-bold">{grant.reamScore}/100</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 pt-3 border-t">
                  <span className="text-xs text-muted-foreground mr-2">Platforms:</span>
                  {grant.platforms.map((p) => (
                    <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="bg-muted/30" data-testid="card-grant-timeline">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Grant Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {GRANT_ALIGNMENT
                  .sort((a, b) => {
                    const order: Record<string, number> = { priority: 0, preparing: 1, active: 2, upcoming: 3 };
                    return (order[a.status] ?? 4) - (order[b.status] ?? 4);
                  })
                  .map((grant, i) => (
                    <div key={grant.grant} className="flex items-center gap-4" data-testid={`row-timeline-${i}`}>
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        grant.status === "priority" ? "bg-emerald-500" :
                        grant.status === "preparing" ? "bg-blue-500" :
                        grant.status === "active" ? "bg-amber-500" :
                        "bg-violet-500"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{grant.grant}</p>
                      </div>
                      <p className="text-xs text-muted-foreground flex-shrink-0">{grant.deadline}</p>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">{grant.amount}</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BackToTop />
    </div>
  );
}