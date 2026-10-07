import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { TrainingGuideButton } from "@/components/training-guide";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MapPin, Users, Building2, Heart, Globe, ArrowRight, CheckCircle2,
  AlertTriangle, Target, Brain, Printer, ChevronRight, BarChart3,
  Zap, Home, Wifi, Layers, BookOpen, RefreshCw, Eye,
  TreePine, Coffee, Church, Scissors, Library, Truck,
  Monitor, Phone, Stethoscope, GraduationCap, Briefcase,
  Shield, Star, Plus, ClipboardCheck, Settings, Database,
  Signal, Laptop, Video, Network, TrendingUp, Activity,
  DollarSign, Clock, Scale, Microscope,
} from "lucide-react";
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

function createColorIcon(color: string) {
  return new L.DivIcon({
    className: "custom-div-icon",
    html: `<div style="background-color:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
}

type SpaceType = "library" | "park" | "community-center" | "faith-based" | "business" | "mobile-unit";

interface ThirdSpace {
  id: string;
  name: string;
  type: SpaceType;
  lat: number;
  lng: number;
  region: string;
  city: string;
  services: string[];
  partners: string[];
  capacity: number;
  hours: string;
  status: "active" | "proposed" | "planned";
}

const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  "library": "Library",
  "park": "Park / Recreation",
  "community-center": "Community Center",
  "faith-based": "Faith-Based",
  "business": "Business (Barbershop/Coffee)",
  "mobile-unit": "Mobile Unit",
};

const SPACE_TYPE_COLORS: Record<SpaceType, string> = {
  "library": "#3b82f6",
  "park": "#22c55e",
  "community-center": "#8b5cf6",
  "faith-based": "#f59e0b",
  "business": "#ec4899",
  "mobile-unit": "#06b6d4",
};

const SPACE_TYPE_ICONS: Record<SpaceType, typeof Library> = {
  "library": Library,
  "park": TreePine,
  "community-center": Building2,
  "faith-based": Church,
  "business": Coffee,
  "mobile-unit": Truck,
};

const THIRD_SPACES: ThirdSpace[] = [
  { id: "aus-1", name: "Austin Central Library", type: "library", lat: 30.2641, lng: -97.7468, region: "Central Texas", city: "Austin", services: ["Digital literacy", "Job search kiosks", "Health info", "Legal aid clinics"], partners: ["Austin Public Library", "Workforce Solutions"], capacity: 200, hours: "Mon-Sat 10am-9pm, Sun 12-6pm", status: "active" },
  { id: "aus-2", name: "Rosewood-Zaragosa Community Center", type: "community-center", lat: 30.2688, lng: -97.7155, region: "Central Texas", city: "Austin", services: ["Youth programs", "Senior services", "Health screenings", "Workforce training"], partners: ["City of Austin PARD", "CommUnity Care"], capacity: 150, hours: "Mon-Fri 8am-9pm, Sat 9am-5pm", status: "active" },
  { id: "aus-3", name: "Givens Recreation Center", type: "community-center", lat: 30.2584, lng: -97.7150, region: "Central Texas", city: "Austin", services: ["After-school programs", "Fitness", "Community meetings", "Nutrition classes"], partners: ["City of Austin", "YMCA"], capacity: 120, hours: "Mon-Fri 6am-9pm, Sat 8am-5pm", status: "active" },
  { id: "aus-4", name: "St. James Missionary Baptist Church", type: "faith-based", lat: 30.2720, lng: -97.7200, region: "Central Texas", city: "Austin", services: ["Food pantry", "Financial literacy", "Mentoring", "Health fairs"], partners: ["Greater Austin Black Chamber", "St. David's Foundation"], capacity: 300, hours: "Sun services, Wed 6-8pm, Events vary", status: "active" },
  { id: "aus-5", name: "Huston-Tillotson University Community Hub", type: "community-center", lat: 30.2617, lng: -97.7188, region: "Central Texas", city: "Austin", services: ["College readiness", "Career counseling", "Mental health", "Cultural programs"], partners: ["Huston-Tillotson", "United Way"], capacity: 100, hours: "Mon-Fri 9am-6pm", status: "active" },
  { id: "aus-6", name: "ThriveUp Mobile Wellness Unit - East Austin", type: "mobile-unit", lat: 30.2550, lng: -97.7080, region: "Central Texas", city: "Austin", services: ["Telehealth", "PHQ-9/GAD-7 screenings", "Benefits enrollment", "Medication management"], partners: ["ThriveUp", "CommUnity Care", "Integral Care"], capacity: 15, hours: "Tues/Thurs 10am-4pm rotating sites", status: "planned" },
  { id: "aus-7", name: "Carver Branch Library", type: "library", lat: 30.2636, lng: -97.7225, region: "Central Texas", city: "Austin", services: ["Computer access", "ESL classes", "Children's programs", "Community resources"], partners: ["Austin Public Library"], capacity: 80, hours: "Mon-Sat 10am-8pm", status: "active" },
  { id: "man-1", name: "Manor Community Library", type: "library", lat: 30.3425, lng: -97.5575, region: "Central Texas", city: "Manor", services: ["Computer lab", "After-school tutoring", "Job search", "Bilingual story time"], partners: ["City of Manor", "Manor ISD"], capacity: 60, hours: "Mon-Fri 10am-7pm, Sat 10am-4pm", status: "active" },
  { id: "man-2", name: "Manor ISD Family Resource Center", type: "community-center", lat: 30.3500, lng: -97.5500, region: "Central Texas", city: "Manor", services: ["Parent education", "Health referrals", "Food assistance", "School enrollment"], partners: ["Manor ISD", "Any Baby Can"], capacity: 40, hours: "Mon-Fri 8am-5pm during school year", status: "active" },
  { id: "man-3", name: "ShadowGlen Community Pavilion", type: "park", lat: 30.3380, lng: -97.5400, region: "Central Texas", city: "Manor", services: ["Community gatherings", "Health fairs", "Mobile unit stops", "Youth recreation"], partners: ["City of Manor", "Travis County"], capacity: 200, hours: "Dawn to dusk, events vary", status: "active" },
  { id: "man-4", name: "Manor Mobile Workforce Hub", type: "mobile-unit", lat: 30.3460, lng: -97.5560, region: "Central Texas", city: "Manor", services: ["Career assessments", "Resume building", "CDL info sessions", "I-35 job pipeline"], partners: ["ThriveUp", "Workforce Solutions", "TxDOT"], capacity: 12, hours: "Wed/Fri 9am-3pm", status: "proposed" },
  { id: "pfl-1", name: "Pflugerville Public Library", type: "library", lat: 30.4424, lng: -97.6201, region: "Central Texas", city: "Pflugerville", services: ["Computer access", "ESL/citizenship", "Tax prep assistance", "Children's literacy"], partners: ["City of Pflugerville", "PCDC"], capacity: 120, hours: "Mon-Thurs 10am-9pm, Fri-Sat 10am-6pm", status: "active" },
  { id: "pfl-2", name: "Pflugerville Recreation Center", type: "community-center", lat: 30.4500, lng: -97.6150, region: "Central Texas", city: "Pflugerville", services: ["Youth sports", "Senior programs", "Health screenings", "Community events"], partners: ["City of Pflugerville", "YMCA"], capacity: 200, hours: "Mon-Fri 6am-9pm, Sat 8am-6pm", status: "active" },
  { id: "pfl-3", name: "Branchview Social Services Hub", type: "community-center", lat: 30.4350, lng: -97.6300, region: "Central Texas", city: "Pflugerville", services: ["Housing navigation", "Benefits enrollment", "Mental health", "Case management"], partners: ["PCDC", "ThriveUp", "PfISD"], capacity: 50, hours: "Mon-Fri 9am-5pm", status: "planned" },
  { id: "sa-1", name: "BiblioTech - Bexar County Digital Library", type: "library", lat: 29.3550, lng: -98.4550, region: "Central Texas", city: "San Antonio", services: ["Digital devices lending", "Computer access", "GED prep", "Workforce programs"], partners: ["Bexar County", "SA Public Library"], capacity: 100, hours: "Mon-Sat 10am-8pm", status: "active" },
  { id: "sa-2", name: "Elvira Cisneros Senior Center", type: "community-center", lat: 29.4200, lng: -98.5100, region: "Central Texas", city: "San Antonio", services: ["Senior wellness", "Benefits counseling", "Nutrition", "Social activities"], partners: ["City of San Antonio", "WellMed"], capacity: 150, hours: "Mon-Fri 8am-5pm", status: "active" },
  { id: "hou-1", name: "Emancipation Community Center", type: "community-center", lat: 29.7480, lng: -95.3580, region: "Gulf Coast", city: "Houston", services: ["Youth development", "Workforce training", "Health fairs", "Cultural programs"], partners: ["City of Houston", "SHAPE Community Center"], capacity: 200, hours: "Mon-Sat 8am-8pm", status: "active" },
  { id: "hou-2", name: "Houston Public Library - Acres Homes", type: "library", lat: 29.8432, lng: -95.4279, region: "Gulf Coast", city: "Houston", services: ["Computer access", "After-school", "Job search", "Financial literacy"], partners: ["Houston Public Library", "Neighborhood Centers"], capacity: 80, hours: "Mon-Sat 10am-6pm", status: "active" },
  { id: "hou-3", name: "Wheeler Avenue Baptist Church Resource Center", type: "faith-based", lat: 29.7280, lng: -95.3640, region: "Gulf Coast", city: "Houston", services: ["Food distribution", "Health screenings", "Counseling", "Youth mentoring"], partners: ["Wheeler Avenue Baptist", "Houston Food Bank"], capacity: 250, hours: "Sun/Wed services, Resource center Mon-Fri 9-5", status: "active" },
  { id: "dal-1", name: "Martin Luther King Jr. Community Center", type: "community-center", lat: 32.7760, lng: -96.7630, region: "North Texas", city: "Dallas", services: ["Youth programs", "Job training", "Health screenings", "Senior services"], partners: ["City of Dallas", "Parkland Health"], capacity: 300, hours: "Mon-Sat 7am-10pm", status: "active" },
  { id: "dal-2", name: "Dallas Public Library - Oak Cliff", type: "library", lat: 32.7350, lng: -96.8500, region: "North Texas", city: "Dallas", services: ["Computer access", "ESL classes", "Citizenship prep", "Children's programs"], partners: ["Dallas Public Library", "Dallas ISD"], capacity: 100, hours: "Mon-Sat 10am-6pm", status: "active" },
  { id: "ep-1", name: "Chamizal National Memorial Community Center", type: "community-center", lat: 31.7670, lng: -106.4550, region: "West Texas", city: "El Paso", services: ["Cultural programs", "Health fairs", "Youth recreation", "Community meetings"], partners: ["NPS", "City of El Paso", "UTEP"], capacity: 200, hours: "Daily 8am-5pm, events vary", status: "active" },
  { id: "ep-2", name: "El Paso Public Library - Armijo", type: "library", lat: 31.7590, lng: -106.4430, region: "West Texas", city: "El Paso", services: ["Bilingual programs", "Computer access", "Health info", "Legal aid"], partners: ["El Paso Public Library", "UTEP"], capacity: 80, hours: "Mon-Sat 10am-6pm", status: "active" },
  { id: "rgv-1", name: "Pharr Community Resource Center", type: "community-center", lat: 26.1950, lng: -98.1840, region: "Rio Grande Valley", city: "Pharr", services: ["Health screenings", "Benefits enrollment", "Food distribution", "Workforce"], partners: ["City of Pharr", "Nuestra Clinica del Valle"], capacity: 120, hours: "Mon-Fri 8am-5pm", status: "active" },
  { id: "rgv-2", name: "McAllen Public Library", type: "library", lat: 26.2034, lng: -98.2300, region: "Rio Grande Valley", city: "McAllen", services: ["Digital literacy", "Citizenship prep", "Job search", "Children's programs"], partners: ["City of McAllen", "LRGV Development Council"], capacity: 150, hours: "Mon-Sat 10am-8pm", status: "active" },
  { id: "rgv-3", name: "Brownsville Community Health Center", type: "community-center", lat: 25.9017, lng: -97.4975, region: "Rio Grande Valley", city: "Brownsville", services: ["Primary care", "Dental", "Behavioral health", "WIC"], partners: ["Su Clinica", "UTRGV"], capacity: 100, hours: "Mon-Fri 8am-5pm", status: "active" },
  { id: "et-1", name: "Tyler Public Library", type: "library", lat: 32.3513, lng: -95.3011, region: "East Texas", city: "Tyler", services: ["Computer access", "GED prep", "Children's programs", "Community meetings"], partners: ["City of Tyler", "Tyler ISD"], capacity: 100, hours: "Mon-Sat 10am-7pm", status: "active" },
  { id: "et-2", name: "Lufkin Civic Center", type: "community-center", lat: 31.3382, lng: -94.7291, region: "East Texas", city: "Lufkin", services: ["Health fairs", "Job fairs", "Youth events", "Senior services"], partners: ["City of Lufkin", "Angelina County"], capacity: 500, hours: "Mon-Fri 8am-5pm, events vary", status: "active" },
];

const ECOSYSTEM_PLATFORMS = [
  { name: "ThriveUp", inPerson: true, virtual: true, mobile: true, kiosk: true, category: "Education & Youth" },
  { name: "LifeBridge", inPerson: true, virtual: true, mobile: true, kiosk: true, category: "Housing & Transitions" },
  { name: "Mission Transition", inPerson: true, virtual: true, mobile: true, kiosk: false, category: "Workforce" },
  { name: "MCE", inPerson: true, virtual: true, mobile: false, kiosk: false, category: "Business Development" },
  { name: "Collaborative Advocate", inPerson: true, virtual: true, mobile: false, kiosk: false, category: "Federal Contracting" },
  { name: "Whole-Person Health", inPerson: true, virtual: true, mobile: true, kiosk: true, category: "Health" },
  { name: "Sankofa Health", inPerson: true, virtual: true, mobile: true, kiosk: false, category: "Culturally Responsive Health" },
  { name: "Black Maternal Health", inPerson: true, virtual: true, mobile: true, kiosk: false, category: "Maternal Health" },
  { name: "Sankofa Feminine Health", inPerson: true, virtual: true, mobile: true, kiosk: false, category: "Women's Health" },
  { name: "Sankofa Men's Health", inPerson: true, virtual: true, mobile: true, kiosk: false, category: "Men's Health" },
  { name: "SafeCogniCare", inPerson: true, virtual: true, mobile: false, kiosk: false, category: "Cognitive Health" },
  { name: "ISSS", inPerson: true, virtual: true, mobile: false, kiosk: false, category: "School Wraparound" },
  { name: "Perfectly Different", inPerson: true, virtual: true, mobile: false, kiosk: false, category: "Neurodivergent Support" },
  { name: "BetterScience Lab", inPerson: false, virtual: true, mobile: false, kiosk: false, category: "Research & Data" },
  { name: "SafeReport", inPerson: true, virtual: true, mobile: true, kiosk: true, category: "Incident Reporting" },
  { name: "Talk Your Talk", inPerson: true, virtual: true, mobile: true, kiosk: true, category: "Communication Access" },
  { name: "Mission Transition (M2C)", inPerson: true, virtual: true, mobile: true, kiosk: true, category: "Benefits & Navigation" },
];

const SPACE_TYPE_SERVICE_SUPPORT: Record<SpaceType, string[]> = {
  "library": ["Digital literacy", "Job search", "Health info", "ESL/Citizenship", "Computer access", "Virtual telehealth"],
  "park": ["Health fairs", "Community events", "Mobile unit stops", "Youth recreation", "Nutrition classes"],
  "community-center": ["Workforce training", "Health screenings", "Youth programs", "Benefits enrollment", "Case management", "Mental health", "Telehealth"],
  "faith-based": ["Food distribution", "Mentoring", "Financial literacy", "Health fairs", "Counseling", "Community meetings"],
  "business": ["Health conversations", "Financial literacy", "Peer support", "Community info", "Referral touchpoints"],
  "mobile-unit": ["Telehealth", "Screenings", "Benefits enrollment", "Career assessments", "Medication management"],
};

const REGIONS = [
  {
    name: "Central Texas",
    population: "3.2M+",
    spaces: 14,
    density: "High",
    hub: "Austin/Manor/Pflugerville",
    gaps: ["Mobile unit coverage in rural Travis County", "After-hours services for shift workers", "Bilingual staffing at 40% of sites"],
    coverage: 78,
  },
  {
    name: "Gulf Coast",
    population: "7.1M+",
    spaces: 3,
    density: "Low",
    hub: "Houston",
    gaps: ["Massive underserved population ratio", "Coastal resilience services needed", "Transportation barriers to existing spaces"],
    coverage: 22,
  },
  {
    name: "North Texas",
    population: "8M+",
    spaces: 2,
    density: "Very Low",
    hub: "Dallas",
    gaps: ["Largest population with fewest third spaces per capita", "South Dallas/Oak Cliff need expansion", "Suburban sprawl limiting access"],
    coverage: 15,
  },
  {
    name: "West Texas",
    population: "1.1M+",
    spaces: 2,
    density: "Very Low",
    hub: "El Paso",
    gaps: ["Border community bilingual services", "Rural broadband limits virtual delivery", "Geographic distance between spaces"],
    coverage: 18,
  },
  {
    name: "Rio Grande Valley",
    population: "1.4M+",
    spaces: 3,
    density: "Low",
    hub: "McAllen/Pharr/Brownsville",
    gaps: ["Colonias lack basic infrastructure", "Healthcare desert in rural areas", "Transportation to service centers"],
    coverage: 25,
  },
  {
    name: "East Texas",
    population: "1.8M+",
    spaces: 2,
    density: "Very Low",
    hub: "Tyler/Lufkin",
    gaps: ["Rural isolation", "Broadband gaps prevent virtual services", "Aging population with limited mobility"],
    coverage: 12,
  },
];

const ACTIVATION_STEPS = [
  {
    title: "Site Assessment",
    items: [
      "Physical space available (minimum 500 sq ft for services)",
      "ADA accessibility confirmed",
      "Adequate parking or public transit access",
      "Restroom facilities available",
      "Climate control (heating/cooling)",
      "Existing foot traffic and community visibility",
      "Safety and security assessment completed",
      "Landlord/property owner agreement obtained",
    ],
  },
  {
    title: "Community Needs Mapping",
    items: [
      "Demographic data collected for service area (1-mile radius)",
      "Community survey distributed (minimum 50 responses)",
      "Key informant interviews conducted (5+ community leaders)",
      "Existing service inventory completed (what's already available nearby)",
      "Transportation access assessed for target population",
      "Language needs identified",
      "Top 3 priority service categories determined by community input",
      "Health disparities data pulled from CDC PLACES/BRFSS",
    ],
  },
  {
    title: "Partner Recruitment",
    items: [
      "Local government contact established (city/county)",
      "School district partnership explored",
      "Healthcare provider identified for telehealth services",
      "Workforce development board connection made",
      "Faith-based community leader recruited",
      "Local business sponsor identified",
      "CHW/promotora workforce pipeline planned",
      "MOU template drafted for primary partner",
    ],
  },
  {
    title: "Service Menu Builder",
    items: [
      "Identified which ThriveUp platforms to deploy at this space",
      "In-person vs. virtual delivery model determined per service",
      "Staff/volunteer requirements scoped",
      "Service schedule drafted",
      "Bilingual capability confirmed or planned",
      "Referral pathways mapped to regional providers",
      "Emergency protocols established",
      "Privacy/confidentiality setup for sensitive services (telehealth, counseling)",
    ],
  },
  {
    title: "Technology Requirements",
    items: [
      "Broadband speed tested (minimum 25 Mbps download for telehealth)",
      "Wi-Fi network configured for public and staff use",
      "Devices procured (tablets, laptops, kiosk station)",
      "Telehealth equipment set up (camera, screen, privacy booth)",
      "Medication-management kiosk installed (if offered through partner pharmacy or clinic)",
      "Digital signage configured for service information",
      "IT support plan established",
      "Data security and HIPAA compliance verified",
    ],
  },
  {
    title: "Funding & Sustainability",
    items: [
      "Startup budget developed ($25K-$100K depending on space type)",
      "Grant applications submitted (CDBG, foundation, state)",
      "In-kind contributions documented from partners",
      "Fee-for-service revenue model explored where appropriate",
      "Year 1 operating budget confirmed",
      "Sustainability plan drafted (3-year runway minimum)",
      "SALP indicators configured for outcome tracking",
      "Launch date set and community awareness campaign planned",
    ],
  },
];

const CFIR_THIRD_SPACES = [
  { domain: "Intervention Characteristics", score: 91, icon: Target, color: "bg-blue-500", findings: ["Third spaces provide natural community touchpoints reducing access barriers", "Multi-platform service delivery increases reach without requiring new infrastructure", "Evidence-based model draws from community health center and settlement house research"] },
  { domain: "Outer Setting", score: 87, icon: Globe, color: "bg-emerald-500", findings: ["ESRI 3rd Spaces mapping provides existing data infrastructure", "CDBG and foundation funding aligned with third space activation", "Strong community demand evidenced by survey data across all regions"] },
  { domain: "Inner Setting", score: 85, icon: Building2, color: "bg-violet-500", findings: ["ThriveUp ecosystem provides turnkey service delivery capability", "Existing partnerships in Austin/Manor/Pflugerville demonstrate model", "Technology infrastructure supports rapid deployment"] },
  { domain: "Individual Characteristics", score: 89, icon: Users, color: "bg-amber-500", findings: ["CHW workforce pipeline provides culturally responsive staffing", "Bilingual capability across 85% of planned deployment sites", "Community champion identification process embedded in activation toolkit"] },
  { domain: "Implementation Process", score: 93, icon: RefreshCw, color: "bg-rose-500", findings: ["6-step activation toolkit provides structured deployment process", "MAP-GAP CQI ensures continuous improvement", "SALP indicators track implementation fidelity in real time"] },
];

const REAIM_THIRD_SPACES = [
  { dimension: "Reach", letter: "R", score: 88, color: "from-blue-500 to-blue-600", description: "Third spaces are where community members already gather, maximizing organic reach vs. clinical settings" },
  { dimension: "Effectiveness", letter: "E", score: 85, color: "from-emerald-500 to-emerald-600", description: "Integrated service delivery model shows 3.2x higher engagement than single-service sites in pilot data" },
  { dimension: "Adoption", letter: "A", score: 82, color: "from-violet-500 to-violet-600", description: "Low-barrier activation model enables rapid partner adoption without major capital investment" },
  { dimension: "Implementation", letter: "I", score: 91, color: "from-amber-500 to-amber-600", description: "Structured toolkit and technology platform reduce implementation variability across sites" },
  { dimension: "Maintenance", letter: "M", score: 84, color: "from-rose-500 to-rose-600", description: "Multi-source funding model and community ownership transfer ensure sustainability beyond initial grant period" },
];

const SALP_INDICATORS = [
  { indicator: "Service Activation Rate", target: "80% of planned services active within 90 days", measurement: "Percentage of planned service menu items operational", current: 72 },
  { indicator: "Community Utilization", target: "50+ unique visitors per week per space", measurement: "Weekly unique individual count via check-in system", current: 45 },
  { indicator: "Service Completion Rate", target: "65% of initiated services completed", measurement: "Ratio of completed to initiated service episodes", current: 58 },
  { indicator: "Partner Engagement Score", target: "4.0/5.0 partner satisfaction", measurement: "Quarterly partner survey composite score", current: 78 },
  { indicator: "Digital Access Hours", target: "40 hours/week public access", measurement: "Hours technology resources available to community", current: 85 },
  { indicator: "Referral Conversion Rate", target: "40% of referrals result in service contact", measurement: "Percentage of referrals that convert to service engagement", current: 35 },
];

const ESRI_LAYERS = [
  { name: "ThriveUp Service Utilization", description: "Real-time heat map of service delivery across all third spaces", type: "Dynamic", format: "GeoJSON / Feature Service", update: "Real-time" },
  { name: "Community Needs Index", description: "Composite SDOH score by census tract overlaid on third space locations", type: "Static + Quarterly Update", format: "ArcGIS Feature Layer", update: "Quarterly" },
  { name: "Service Gap Analysis", description: "Areas with high need but no third space coverage within 3-mile radius", type: "Analytical", format: "Raster / Polygon", update: "Monthly" },
  { name: "Population Accessibility", description: "Drive-time and transit-time polygons showing population reach per space", type: "Network Analysis", format: "Network Dataset", update: "Annually" },
  { name: "Partner Network Density", description: "Organizations and referral pathways connected to each third space", type: "Relational", format: "Point + Line Feature Class", update: "Real-time" },
  { name: "Outcome Tracking Dashboard", description: "RE-AIM metrics and SALP indicators georeferenced to space locations", type: "Dashboard", format: "ArcGIS Dashboard", update: "Weekly" },
];

function ScoreGauge({ score, label, size = "md" }: { score: number; label: string; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-16 h-16" : "w-24 h-24";
  const textSize = size === "sm" ? "text-lg" : "text-2xl";
  const color = score >= 90 ? "#22c55e" : score >= 80 ? "#3b82f6" : score >= 70 ? "#eab308" : "#ef4444";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`relative ${dim}`}>
        <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="8" />
          <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="8" strokeDasharray={`${(score / 100) * 314} 314`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${textSize} font-bold`} style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground text-center">{label}</span>
    </div>
  );
}

function ProposeSpaceDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-propose-space"><Plus className="h-4 w-4 mr-1" /> Propose New Space</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Propose a New Third Space</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-4">
            <div>
              <Label htmlFor="propose-name">Space Name</Label>
              <Input id="propose-name" placeholder="e.g., Oak Hill Community Center" data-testid="input-propose-name" />
            </div>
            <div>
              <Label htmlFor="propose-type">Space Type</Label>
              <Select data-testid="select-propose-type">
                <SelectTrigger id="propose-type" data-testid="trigger-propose-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SPACE_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="propose-city">City</Label>
              <Input id="propose-city" placeholder="City, TX" data-testid="input-propose-city" />
            </div>
            <div>
              <Label htmlFor="propose-address">Address</Label>
              <Input id="propose-address" placeholder="Street address" data-testid="input-propose-address" />
            </div>
            <div>
              <Label htmlFor="propose-region">Region</Label>
              <Select data-testid="select-propose-region">
                <SelectTrigger id="propose-region" data-testid="trigger-propose-region">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="propose-capacity">Estimated Capacity</Label>
              <Input id="propose-capacity" type="number" placeholder="e.g., 100" data-testid="input-propose-capacity" />
            </div>
            <div>
              <Label htmlFor="propose-services">Services Needed (describe)</Label>
              <Textarea id="propose-services" placeholder="What services does this community need most?" data-testid="textarea-propose-services" />
            </div>
            <div>
              <Label htmlFor="propose-contact">Your Contact Email</Label>
              <Input id="propose-contact" type="email" placeholder="email@example.com" data-testid="input-propose-contact" />
            </div>
            <Button className="w-full" data-testid="button-submit-proposal" onClick={() => setOpen(false)}>Submit Proposal</Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default function ThirdSpacesPage() {
  const [activeTab, setActiveTab] = useState("map");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    document.title = "Third Spaces Enablement Platform | ThriveUp";
  }, []);

  const filteredSpaces = THIRD_SPACES.filter((s) => {
    if (filterType !== "all" && s.type !== filterType) return false;
    if (filterRegion !== "all" && s.region !== filterRegion) return false;
    return true;
  });

  const totalChecked = Object.values(checkedItems).filter(Boolean).length;
  const totalItems = ACTIVATION_STEPS.reduce((sum, step) => sum + step.items.length, 0);
  const activationProgress = totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0;

  const toggleCheck = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8" data-testid="third-spaces-page">
      <PageHeader
        title="Third Spaces"
        description="A Third Space is any community place that isn't home or work — a library, church, park, barbershop. These are where people already trust. TCAF brings services to them."
        actions={
          <div className="flex gap-2 flex-wrap">
            <TrainingGuideButton moduleId="third-spaces" />
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card data-testid="stat-total-spaces">
          <CardContent className="pt-5 pb-4 text-center">
            <div className="mx-auto w-11 h-11 rounded-full flex items-center justify-center mb-2 bg-blue-500"><Building2 className="h-5 w-5 text-white" /></div>
            <div className="text-2xl font-bold">{THIRD_SPACES.length}</div>
            <div className="text-sm font-medium">Total Spaces</div>
            <div className="text-xs text-muted-foreground">Across 6 regions</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-active-spaces">
          <CardContent className="pt-5 pb-4 text-center">
            <div className="mx-auto w-11 h-11 rounded-full flex items-center justify-center mb-2 bg-emerald-500"><CheckCircle2 className="h-5 w-5 text-white" /></div>
            <div className="text-2xl font-bold">{THIRD_SPACES.filter((s) => s.status === "active").length}</div>
            <div className="text-sm font-medium">Active</div>
            <div className="text-xs text-muted-foreground">Currently operational</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-population-reach">
          <CardContent className="pt-5 pb-4 text-center">
            <div className="mx-auto w-11 h-11 rounded-full flex items-center justify-center mb-2 bg-violet-500"><Users className="h-5 w-5 text-white" /></div>
            <div className="text-2xl font-bold">22.6M+</div>
            <div className="text-sm font-medium">Population Reach</div>
            <div className="text-xs text-muted-foreground">Within service regions</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-platforms-deployed">
          <CardContent className="pt-5 pb-4 text-center">
            <div className="mx-auto w-11 h-11 rounded-full flex items-center justify-center mb-2 bg-amber-500"><Globe className="h-5 w-5 text-white" /></div>
            <div className="text-2xl font-bold">20</div>
            <div className="text-sm font-medium">Ecosystem Platforms</div>
            <div className="text-xs text-muted-foreground">Deployable at third spaces</div>
          </CardContent>
        </Card>
      </div>

      {/* Plain-language guide to this tool */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800">
          <CardContent className="pt-4 pb-3">
            <p className="text-sm font-semibold text-violet-800 dark:text-violet-300 mb-1">What is a Third Space?</p>
            <p className="text-sm text-violet-700 dark:text-violet-400">
              Home is your first space. Work is your second. A Third Space is the library, the park, the church, the barbershop — places you already go because you trust them.
              TCAF partners with these spaces to bring health screenings, benefits enrollment, job coaching, and telehealth directly to where your neighbors already are.
              No waiting room. No paperwork barrier. Just help where people already show up.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800">
          <CardContent className="pt-4 pb-3">
            <p className="text-sm font-semibold mb-1">What each tab does</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li><strong>Statewide Map</strong> — interactive map of current and planned locations across Texas</li>
              <li><strong>Activation Toolkit</strong> — step-by-step checklist for site managers setting up a new space</li>
              <li><strong>Service Matrix</strong> — which services work at which types of spaces (library vs. park vs. faith center)</li>
              <li><strong>Regional Networks</strong> — gap analysis by Texas region: where we have spaces, where we don't</li>
              <li><strong>Impact &amp; RPLICE</strong> — implementation science scores and outcome tracking framework</li>
              <li><strong>ESRI Integration</strong> — GIS data layers available for mapping and planning partners</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-third-spaces">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-1 h-auto p-1">
          <TabsTrigger value="map" className="text-xs md:text-sm" data-testid="tab-map"><MapPin className="h-3.5 w-3.5 mr-1" /> Statewide Map</TabsTrigger>
          <TabsTrigger value="toolkit" className="text-xs md:text-sm" data-testid="tab-toolkit"><ClipboardCheck className="h-3.5 w-3.5 mr-1" /> Activation Toolkit</TabsTrigger>
          <TabsTrigger value="matrix" className="text-xs md:text-sm" data-testid="tab-matrix"><Layers className="h-3.5 w-3.5 mr-1" /> Service Matrix</TabsTrigger>
          <TabsTrigger value="regions" className="text-xs md:text-sm" data-testid="tab-regions"><Network className="h-3.5 w-3.5 mr-1" /> Regional Networks</TabsTrigger>
          <TabsTrigger value="impact" className="text-xs md:text-sm" data-testid="tab-impact"><Brain className="h-3.5 w-3.5 mr-1" /> Impact & RPLICE</TabsTrigger>
          <TabsTrigger value="esri" className="text-xs md:text-sm" data-testid="tab-esri"><Database className="h-3.5 w-3.5 mr-1" /> ESRI Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="mt-6 space-y-6" data-testid="content-map">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold">Texas Third Spaces Map</h2>
              <p className="text-muted-foreground text-sm">Interactive map of {THIRD_SPACES.length} third space locations across Texas</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]" data-testid="select-filter-type">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(SPACE_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterRegion} onValueChange={setFilterRegion}>
                <SelectTrigger className="w-[180px]" data-testid="select-filter-region">
                  <SelectValue placeholder="Filter by region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {REGIONS.map((r) => (
                    <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ProposeSpaceDialog />
            </div>
          </div>

          <Card data-testid="card-map">
            <CardContent className="p-0">
              <div className="h-[500px] rounded-md overflow-hidden">
                <MapContainer center={[31.0, -99.5]} zoom={6} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                  {filteredSpaces.map((space) => (
                    <Marker key={space.id} position={[space.lat, space.lng]} icon={createColorIcon(SPACE_TYPE_COLORS[space.type])}>
                      <Popup>
                        <div className="min-w-[220px]">
                          <p className="font-bold text-sm">{space.name}</p>
                          <p className="text-xs text-gray-600">{SPACE_TYPE_LABELS[space.type]} | {space.city}</p>
                          <p className="text-xs mt-1"><strong>Capacity:</strong> {space.capacity} | <strong>Status:</strong> {space.status}</p>
                          <p className="text-xs"><strong>Hours:</strong> {space.hours}</p>
                          <p className="text-xs mt-1"><strong>Services:</strong> {space.services.join(", ")}</p>
                          <p className="text-xs"><strong>Partners:</strong> {space.partners.join(", ")}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-map-legend">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Map Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {Object.entries(SPACE_TYPE_LABELS).map(([key, label]) => {
                  const Icon = SPACE_TYPE_ICONS[key as SpaceType];
                  return (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SPACE_TYPE_COLORS[key as SpaceType] }} />
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{label}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSpaces.slice(0, 9).map((space) => {
              const Icon = SPACE_TYPE_ICONS[space.type];
              return (
                <Card key={space.id} data-testid={`card-space-${space.id}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: SPACE_TYPE_COLORS[space.type] }}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm truncate">{space.name}</span>
                          <Badge variant={space.status === "active" ? "default" : "secondary"} className="text-xs">{space.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{space.city} | {SPACE_TYPE_LABELS[space.type]}</p>
                        <p className="text-xs text-muted-foreground mt-1">Capacity: {space.capacity} | {space.hours}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {space.services.slice(0, 3).map((s) => (
                            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                          ))}
                          {space.services.length > 3 && <Badge variant="outline" className="text-xs">+{space.services.length - 3}</Badge>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {filteredSpaces.length > 9 && (
            <p className="text-sm text-muted-foreground text-center" data-testid="text-more-spaces">Showing 9 of {filteredSpaces.length} spaces. Use filters to narrow results.</p>
          )}
        </TabsContent>

        <TabsContent value="toolkit" className="mt-6 space-y-6" data-testid="content-toolkit">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold">Space Activation Toolkit</h2>
              <p className="text-muted-foreground text-sm">Step-by-step guide for activating a new third space. Track your progress.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold">{activationProgress}% Complete</p>
                <p className="text-xs text-muted-foreground">{totalChecked} of {totalItems} items</p>
              </div>
              <div className="w-32">
                <Progress value={activationProgress} data-testid="progress-activation" />
              </div>
            </div>
          </div>

          {ACTIVATION_STEPS.map((step, stepIndex) => (
            <Card key={step.title} data-testid={`card-step-${stepIndex}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">{stepIndex + 1}</div>
                  <div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <CardDescription>
                      {step.items.filter((_, i) => checkedItems[`${stepIndex}-${i}`]).length} of {step.items.length} completed
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {step.items.map((item, itemIndex) => {
                    const key = `${stepIndex}-${itemIndex}`;
                    return (
                      <div key={key} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <Checkbox
                          id={key}
                          checked={!!checkedItems[key]}
                          onCheckedChange={() => toggleCheck(key)}
                          data-testid={`checkbox-${key}`}
                        />
                        <label htmlFor={key} className={`text-sm cursor-pointer flex-1 ${checkedItems[key] ? "line-through text-muted-foreground" : ""}`}>
                          {item}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="matrix" className="mt-6 space-y-6" data-testid="content-matrix">
          <div>
            <h2 className="text-2xl font-bold">Service Delivery Matrix</h2>
            <p className="text-muted-foreground text-sm mb-6">Which ThriveUp platforms can deliver services at third spaces and how.</p>
          </div>

          <Card data-testid="card-platform-matrix">
            <CardHeader>
              <CardTitle>Platform Delivery Modalities</CardTitle>
              <CardDescription>20 ecosystem platforms mapped to delivery channels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-semibold">Platform</th>
                      <th className="text-left py-2 pr-4 font-semibold">Category</th>
                      <th className="text-center py-2 px-2 font-semibold">In-Person</th>
                      <th className="text-center py-2 px-2 font-semibold">Virtual</th>
                      <th className="text-center py-2 px-2 font-semibold">Mobile Unit</th>
                      <th className="text-center py-2 px-2 font-semibold">Kiosk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ECOSYSTEM_PLATFORMS.map((p, i) => (
                      <tr key={p.name} className="border-b last:border-0" data-testid={`row-platform-${i}`}>
                        <td className="py-2 pr-4 font-medium">{p.name}</td>
                        <td className="py-2 pr-4 text-muted-foreground text-xs">{p.category}</td>
                        <td className="py-2 px-2 text-center">{p.inPerson ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <span className="text-muted-foreground">-</span>}</td>
                        <td className="py-2 px-2 text-center">{p.virtual ? <CheckCircle2 className="h-4 w-4 text-blue-500 mx-auto" /> : <span className="text-muted-foreground">-</span>}</td>
                        <td className="py-2 px-2 text-center">{p.mobile ? <CheckCircle2 className="h-4 w-4 text-amber-500 mx-auto" /> : <span className="text-muted-foreground">-</span>}</td>
                        <td className="py-2 px-2 text-center">{p.kiosk ? <CheckCircle2 className="h-4 w-4 text-violet-500 mx-auto" /> : <span className="text-muted-foreground">-</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> In-Person: Staff delivers on-site</div>
                <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3.5 w-3.5 text-blue-500" /> Virtual: Telehealth/video connection</div>
                <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3.5 w-3.5 text-amber-500" /> Mobile: Deployed via mobile unit</div>
                <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3.5 w-3.5 text-violet-500" /> Kiosk: Self-service station</div>
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-lg font-bold mb-4">Services by Space Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(SPACE_TYPE_SERVICE_SUPPORT).map(([type, services]) => {
                const Icon = SPACE_TYPE_ICONS[type as SpaceType];
                return (
                  <Card key={type} data-testid={`card-space-type-${type}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: SPACE_TYPE_COLORS[type as SpaceType] }}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <CardTitle className="text-sm">{SPACE_TYPE_LABELS[type as SpaceType]}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {services.map((s) => (
                          <li key={s} className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <ChevronRight className="h-3 w-3 flex-shrink-0 text-muted-foreground/50" />{s}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <Card data-testid="card-delivery-summary">
            <CardHeader>
              <CardTitle className="text-sm">Delivery Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-md bg-muted/30">
                  <p className="text-2xl font-bold text-emerald-600">{ECOSYSTEM_PLATFORMS.filter((p) => p.inPerson).length}</p>
                  <p className="text-xs text-muted-foreground">In-Person Capable</p>
                </div>
                <div className="text-center p-3 rounded-md bg-muted/30">
                  <p className="text-2xl font-bold text-blue-600">{ECOSYSTEM_PLATFORMS.filter((p) => p.virtual).length}</p>
                  <p className="text-xs text-muted-foreground">Virtual Capable</p>
                </div>
                <div className="text-center p-3 rounded-md bg-muted/30">
                  <p className="text-2xl font-bold text-amber-600">{ECOSYSTEM_PLATFORMS.filter((p) => p.mobile).length}</p>
                  <p className="text-xs text-muted-foreground">Mobile Unit Ready</p>
                </div>
                <div className="text-center p-3 rounded-md bg-muted/30">
                  <p className="text-2xl font-bold text-violet-600">{ECOSYSTEM_PLATFORMS.filter((p) => p.kiosk).length}</p>
                  <p className="text-xs text-muted-foreground">Kiosk Deployable</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regions" className="mt-6 space-y-6" data-testid="content-regions">
          <div>
            <h2 className="text-2xl font-bold">Regional Networks</h2>
            <p className="text-muted-foreground text-sm mb-6">Third space networks grouped by Texas region with coverage analysis.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REGIONS.map((region) => {
              const regionSpaces = THIRD_SPACES.filter((s) => s.region === region.name);
              return (
                <Card key={region.name} data-testid={`card-region-${region.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <CardTitle className="text-lg">{region.name}</CardTitle>
                      <Badge variant={region.density === "High" ? "default" : "secondary"} className="text-xs">{region.density} Density</Badge>
                    </div>
                    <CardDescription>Hub: {region.hub} | Population: {region.population}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold">{region.spaces} Active Spaces</p>
                        <p className="text-xs text-muted-foreground">{region.coverage}% population coverage</p>
                      </div>
                      <div className="w-24">
                        <Progress value={region.coverage} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1.5 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Service Gaps
                      </p>
                      <ul className="space-y-1">
                        {region.gaps.map((gap, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-red-400" />{gap}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {regionSpaces.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1.5">Spaces in Network:</p>
                        <div className="flex flex-wrap gap-1">
                          {regionSpaces.map((s) => (
                            <Badge key={s.id} variant="outline" className="text-xs">{s.name.length > 25 ? s.name.substring(0, 25) + "..." : s.name}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {(region.name === "Central Texas") && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button variant="outline" size="sm" onClick={() => window.location.href = "/austin"} data-testid={`button-region-austin-${region.name.toLowerCase().replace(/\s+/g, '-')}`}>
                          <MapPin className="h-3.5 w-3.5 mr-1" /> Austin Hub
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => window.location.href = "/manor"} data-testid={`button-region-manor-${region.name.toLowerCase().replace(/\s+/g, '-')}`}>
                          <MapPin className="h-3.5 w-3.5 mr-1" /> Manor Hub
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => window.location.href = "/pflugerville"} data-testid={`button-region-pflugerville-${region.name.toLowerCase().replace(/\s+/g, '-')}`}>
                          <MapPin className="h-3.5 w-3.5 mr-1" /> Pflugerville Hub
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card data-testid="card-statewide-summary">
            <CardHeader>
              <CardTitle>Statewide Network Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-md bg-muted/30">
                  <p className="text-2xl font-bold">{REGIONS.length}</p>
                  <p className="text-xs text-muted-foreground">Regions Covered</p>
                </div>
                <div className="text-center p-3 rounded-md bg-muted/30">
                  <p className="text-2xl font-bold">{THIRD_SPACES.length}</p>
                  <p className="text-xs text-muted-foreground">Total Third Spaces</p>
                </div>
                <div className="text-center p-3 rounded-md bg-muted/30">
                  <p className="text-2xl font-bold">{new Set(THIRD_SPACES.map((s) => s.city)).size}</p>
                  <p className="text-xs text-muted-foreground">Cities Served</p>
                </div>
                <div className="text-center p-3 rounded-md bg-muted/30">
                  <p className="text-2xl font-bold">{Math.round(REGIONS.reduce((s, r) => s + r.coverage, 0) / REGIONS.length)}%</p>
                  <p className="text-xs text-muted-foreground">Avg Coverage</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impact" className="mt-6 space-y-6" data-testid="content-impact">
          <div>
            <h2 className="text-2xl font-bold">Impact & RPLICE Assessment</h2>
            <p className="text-muted-foreground text-sm mb-6">Implementation science evaluation of third space deployment across Texas.</p>
          </div>

          <Card data-testid="card-cfir">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Microscope className="h-5 w-5" /> CFIR Assessment — Third Space Implementation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {CFIR_THIRD_SPACES.map((domain) => (
                <div key={domain.domain} className="flex items-start gap-4 p-4 rounded-lg bg-muted/30" data-testid={`cfir-${domain.domain.toLowerCase().replace(/\s+/g, '-')}`}>
                  <ScoreGauge score={domain.score} label={domain.domain} size="sm" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <domain.icon className="h-4 w-4" /> {domain.domain}
                    </h4>
                    <ul className="space-y-1">
                      {domain.findings.map((f, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0 text-emerald-500" />{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card data-testid="card-reaim">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> RE-AIM Evaluation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {REAIM_THIRD_SPACES.map((dim) => (
                  <div key={dim.letter} className="text-center" data-testid={`reaim-${dim.letter}`}>
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${dim.color} mx-auto flex items-center justify-center text-white text-xl font-bold mb-2`}>
                      {dim.letter}
                    </div>
                    <p className="text-sm font-semibold">{dim.dimension}</p>
                    <p className="text-lg font-bold">{dim.score}/100</p>
                    <p className="text-xs text-muted-foreground mt-1">{dim.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-three-realities">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5" /> Three Realities Analysis by Region</CardTitle>
              <CardDescription>What research says vs. what politics allow vs. what works on the ground</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    region: "Central Texas (Austin/Manor/Pflugerville)",
                    research: "Strong evidence for integrated service delivery at community touchpoints. CDC PLACES data supports targeted deployment.",
                    politics: "City of Manor actively seeking solutions. PCDC partnership-ready. ESRI mapping infrastructure exists.",
                    ground: "78% of Manor residents commute out — evening/weekend hours critical. Bilingual services mandatory for 52% Hispanic population.",
                  },
                  {
                    region: "Gulf Coast (Houston)",
                    research: "Settlement house model has 100+ year evidence base in Houston. Third spaces reduce ER utilization by connecting upstream services.",
                    politics: "Harris County has infrastructure but coordination gaps. Hurricane resilience adds urgency to distributed service model.",
                    ground: "Transportation is the #1 barrier. Third spaces must be within walking distance or on transit routes.",
                  },
                  {
                    region: "Rio Grande Valley",
                    research: "Colonias health data shows 3x national average for diabetes, 2x for obesity. Community-based delivery is only viable model.",
                    politics: "Border politics create funding complexity. FQHC network provides partnership backbone.",
                    ground: "Trust is earned through promotoras and community champions. Faith-based spaces have highest utilization rates.",
                  },
                ].map((r) => (
                  <div key={r.region} className="p-4 rounded-lg bg-muted/30" data-testid={`three-realities-${r.region.toLowerCase().split(' ')[0]}`}>
                    <h4 className="font-semibold text-sm mb-3">{r.region}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1"><BookOpen className="h-3 w-3" /> Research Says</p>
                        <p className="text-xs text-muted-foreground">{r.research}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1"><Building2 className="h-3 w-3" /> Politics Allow</p>
                        <p className="text-xs text-muted-foreground">{r.politics}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1"><Users className="h-3 w-3" /> Ground Truth</p>
                        <p className="text-xs text-muted-foreground">{r.ground}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-salp">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> SALP Indicators for Third Space Effectiveness</CardTitle>
              <CardDescription>Real-time fidelity tracking metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {SALP_INDICATORS.map((ind, i) => (
                  <div key={ind.indicator} className="p-3 rounded-lg bg-muted/30" data-testid={`salp-${i}`}>
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                      <p className="text-sm font-semibold">{ind.indicator}</p>
                      <Badge variant={ind.current >= 70 ? "default" : "secondary"} className="text-xs">{ind.current}%</Badge>
                    </div>
                    <Progress value={ind.current} className="mb-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Target: {ind.target}</span>
                      <span>{ind.measurement}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="esri" className="mt-6 space-y-6" data-testid="content-esri">
          <div>
            <h2 className="text-2xl font-bold">ESRI Integration</h2>
            <p className="text-muted-foreground text-sm mb-6">How ThriveUp data layers overlay onto ESRI's existing 3rd Spaces mapping infrastructure.</p>
          </div>

          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800" data-testid="card-esri-overview">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" /> ESRI + ThriveUp Integration Architecture
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                City of Manor and other Texas municipalities already use ESRI for 3rd Spaces mapping.
                ThriveUp layers directly into existing GIS infrastructure — no rip and replace, pure enhancement.
                Our data becomes additional feature layers in their ArcGIS environment.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-white/60 dark:bg-black/20">
                  <Database className="h-5 w-5 text-blue-600 mb-2" />
                  <h4 className="font-semibold text-sm mb-1">Data Integration</h4>
                  <p className="text-xs text-muted-foreground">REST API endpoints expose ThriveUp data as ArcGIS-compatible feature services. Standard GeoJSON format with ESRI feature service wrapper.</p>
                </div>
                <div className="p-4 rounded-lg bg-white/60 dark:bg-black/20">
                  <Layers className="h-5 w-5 text-indigo-600 mb-2" />
                  <h4 className="font-semibold text-sm mb-1">Layer Compatibility</h4>
                  <p className="text-xs text-muted-foreground">All ThriveUp layers use WKID 4326 (WGS 84) coordinate system. Compatible with ESRI's standard web mercator projection for seamless overlay.</p>
                </div>
                <div className="p-4 rounded-lg bg-white/60 dark:bg-black/20">
                  <Signal className="h-5 w-5 text-violet-600 mb-2" />
                  <h4 className="font-semibold text-sm mb-1">Real-Time Tracking</h4>
                  <p className="text-xs text-muted-foreground">Service utilization data streams via webhooks to ESRI's real-time data stores. Dashboard widgets update automatically as services are delivered.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-esri-layers">
            <CardHeader>
              <CardTitle>Data Layers Available for ESRI Integration</CardTitle>
              <CardDescription>Each layer can be added to existing ArcGIS Online maps or ArcGIS Enterprise environments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ESRI_LAYERS.map((layer, i) => (
                  <div key={layer.name} className="p-4 rounded-lg border" data-testid={`esri-layer-${i}`}>
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                      <h4 className="font-semibold text-sm">{layer.name}</h4>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">{layer.type}</Badge>
                        <Badge variant="secondary" className="text-xs">{layer.update}</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{layer.description}</p>
                    <p className="text-xs text-muted-foreground">Format: <span className="font-medium">{layer.format}</span></p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card data-testid="card-esri-api">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2"><Settings className="h-4 w-4" /> API Integration Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-md bg-muted/30 font-mono">
                    <p className="font-semibold text-foreground mb-1">GET /api/esri/third-spaces</p>
                    <p className="text-muted-foreground">Returns all third space locations as GeoJSON FeatureCollection</p>
                  </div>
                  <div className="p-3 rounded-md bg-muted/30 font-mono">
                    <p className="font-semibold text-foreground mb-1">GET /api/esri/utilization/:spaceId</p>
                    <p className="text-muted-foreground">Service utilization metrics for a specific space</p>
                  </div>
                  <div className="p-3 rounded-md bg-muted/30 font-mono">
                    <p className="font-semibold text-foreground mb-1">GET /api/esri/coverage-analysis</p>
                    <p className="text-muted-foreground">Population coverage polygons by space and region</p>
                  </div>
                  <div className="p-3 rounded-md bg-muted/30 font-mono">
                    <p className="font-semibold text-foreground mb-1">GET /api/esri/gap-analysis</p>
                    <p className="text-muted-foreground">Areas with unmet need beyond 3-mile service radius</p>
                  </div>
                  <div className="p-3 rounded-md bg-muted/30 font-mono">
                    <p className="font-semibold text-foreground mb-1">WebSocket /ws/esri/live-feed</p>
                    <p className="text-muted-foreground">Real-time service delivery events for dashboard widgets</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-esri-municipalities">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4" /> Municipal ESRI Deployments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { city: "City of Manor", status: "Active ESRI user", integration: "3rd Spaces map exists — add ThriveUp layers", priority: "Immediate" },
                    { city: "City of Pflugerville", status: "Active ESRI user", integration: "Branchview planning data integration", priority: "High" },
                    { city: "City of Austin", status: "Enterprise ESRI", integration: "Community map overlay, housing data layers", priority: "High" },
                    { city: "City of Houston", status: "Enterprise ESRI", integration: "Health equity layers, third space network", priority: "Medium" },
                    { city: "City of San Antonio", status: "Enterprise ESRI", integration: "BiblioTech integration, senior services mapping", priority: "Medium" },
                  ].map((m, i) => (
                    <div key={m.city} className="p-3 rounded-md border" data-testid={`esri-municipality-${i}`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="text-sm font-semibold">{m.city}</p>
                        <Badge variant={m.priority === "Immediate" ? "default" : "secondary"} className="text-xs">{m.priority}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{m.status} — {m.integration}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-esri-workflow">
            <CardHeader>
              <CardTitle className="text-sm">Integration Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 items-center">
                {["ThriveUp Data Collection", "GeoJSON Export", "ESRI Feature Service", "ArcGIS Online Map", "Municipal Dashboard", "Decision Support"].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted/50 text-xs font-medium">
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">{i + 1}</span>
                      {step}
                    </div>
                    {i < 5 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
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
