import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Database, Globe, MapPin, Shield, Heart, GraduationCap,
  Building2, Users, Search, ExternalLink, CheckCircle2,
  AlertTriangle, Activity, BarChart3, Home, Briefcase,
  Scale, Baby, ChevronRight, Wifi, WifiOff, Clock,
  TrendingUp, FileText, Layers, Landmark, Target,
  Stethoscope, ShieldAlert, Leaf, DollarSign, Truck,
  BookOpen, Zap, ArrowRight
} from "lucide-react";

type SourceStatus = "live" | "available" | "planned" | "key-required";

interface DataSource {
  id: string;
  name: string;
  shortName: string;
  agency: string;
  description: string;
  dataTypes: string[];
  url: string;
  apiEndpoint?: string;
  status: SourceStatus;
  updateFrequency: string;
  geographyLevel: string;
  usedBy: string[];
  icon: typeof Database;
  category: "federal" | "state" | "local" | "internal";
  localCallout?: string;
}

const FEDERAL_SOURCES: DataSource[] = [
  {
    id: "census-acs",
    name: "U.S. Census Bureau -- American Community Survey (ACS)",
    shortName: "Census ACS",
    agency: "U.S. Census Bureau",
    description: "5-year estimates for demographics, income, poverty, education, employment, housing, insurance, disability, language, and broadband access at tract and county level.",
    dataTypes: ["Median Income (B19013)", "Poverty Rate (B17001)", "Unemployment (B23025)", "Rent Burden (B25070)", "Education Attainment (B15003)", "School Enrollment (B14001)", "Insurance (B27001)", "Disability (B18101)", "Limited English (B16004)"],
    url: "https://api.census.gov",
    apiEndpoint: "https://api.census.gov/data/2022/acs/acs5",
    status: "live",
    updateFrequency: "Annual (5-year rolling)",
    geographyLevel: "Census Tract, County, State, National",
    usedBy: ["SDOH Explorer", "Neighborhood Intel", "Grant Packages", "RPLICE Toolkit", "Community Map"],
    icon: Users,
    category: "federal"
  },
  {
    id: "cdc-places",
    name: "CDC PLACES -- Local Data for Better Health",
    shortName: "CDC PLACES",
    agency: "Centers for Disease Control and Prevention",
    description: "Census tract-level health outcome and prevention measures: high blood pressure, diabetes, mental health, obesity, sleep deprivation, and healthcare access.",
    dataTypes: ["High Blood Pressure (BPHIGH)", "Diabetes Prevalence (DIABETES)", "Mental Health (MHLTH)", "Obesity (OBESITY)", "Sleep Deprivation (SLEEP)", "Lack of Health Insurance (ACCESS2)"],
    url: "https://data.cdc.gov",
    apiEndpoint: "https://data.cdc.gov/resource/swc5-untb.json",
    status: "live",
    updateFrequency: "Annual",
    geographyLevel: "Census Tract, County",
    usedBy: ["SDOH Explorer", "Health Network", "Grant Packages", "HerHealth Network", "CHW Dashboard"],
    icon: Heart,
    category: "federal"
  },
  {
    id: "cdc-svi",
    name: "CDC/ATSDR Social Vulnerability Index (SVI)",
    shortName: "CDC SVI",
    agency: "CDC / Agency for Toxic Substances and Disease Registry",
    description: "Composite vulnerability ranking across 4 themes: Socioeconomic Status, Household Composition/Disability, Minority Status/Language, and Housing Type/Transportation.",
    dataTypes: ["Overall SVI Percentile", "Theme 1: Socioeconomic", "Theme 2: Household Composition", "Theme 3: Minority Status/Language", "Theme 4: Housing/Transportation"],
    url: "https://data.cdc.gov",
    apiEndpoint: "https://data.cdc.gov/resource/4d8n-kk8a.json",
    status: "live",
    updateFrequency: "Biennial",
    geographyLevel: "Census Tract, County",
    usedBy: ["SDOH Explorer", "Neighborhood Intel", "Grant Packages", "Community Map"],
    icon: ShieldAlert,
    category: "federal"
  },
  {
    id: "fbi-ucr",
    name: "FBI Uniform Crime Reporting (UCR) / Crime Data Explorer",
    shortName: "FBI UCR",
    agency: "Federal Bureau of Investigation",
    description: "State-level violent and property crime estimates, arrest data, juvenile arrest rates, and law enforcement statistics from the national incident-based reporting system.",
    dataTypes: ["Violent Crime Rate", "Property Crime Rate", "Juvenile Arrest Rate", "Homicide Rate", "Aggravated Assault", "Robbery", "Burglary", "Larceny"],
    url: "https://cde.ucr.cjis.gov",
    apiEndpoint: "https://api.usa.gov/crime/fbi/sapi/api/estimates/states",
    status: "key-required",
    updateFrequency: "Annual",
    geographyLevel: "State, Agency",
    usedBy: ["Justice Command Center", "Community Map", "Grant Packages"],
    icon: Shield,
    category: "federal"
  },
  {
    id: "sam-gov",
    name: "SAM.gov -- System for Award Management",
    shortName: "SAM.gov",
    agency: "General Services Administration",
    description: "Federal contract opportunities, entity registration verification, CAGE/NCAGE codes, UEI lookup, and 656,794+ curated procurement records for minority business matching.",
    dataTypes: ["Contract Opportunities", "Entity Registration", "CAGE Codes", "UEI Verification", "NAICS Codes", "Set-Aside Categories"],
    url: "https://sam.gov",
    apiEndpoint: "https://api.sam.gov",
    status: "live",
    updateFrequency: "Daily",
    geographyLevel: "National",
    usedBy: ["Grant Hub", "MCE Contracts", "Proposal Command", "Grant Discovery Engine"],
    icon: Landmark,
    category: "federal"
  },
  {
    id: "grants-gov",
    name: "Grants.gov -- Federal Grant Opportunities",
    shortName: "Grants.gov",
    agency: "U.S. Department of Health and Human Services",
    description: "Centralized federal grant opportunity search across all 26 federal agencies. Automated keyword scanning for workforce development, veteran services, behavioral health, maternal health, and more.",
    dataTypes: ["Grant Opportunities", "Funding Amounts", "Eligibility", "Deadlines", "CFDA Numbers"],
    url: "https://grants.gov",
    apiEndpoint: "https://www.grants.gov/grantsws/rest/opportunities/search/",
    status: "live",
    updateFrequency: "Daily (automated scan)",
    geographyLevel: "National",
    usedBy: ["Grant Hub", "Grant Discovery Engine", "Grant Command Center"],
    icon: Target,
    category: "federal"
  },
  {
    id: "usaspending",
    name: "USASpending.gov -- Federal Award Data",
    shortName: "USASpending",
    agency: "U.S. Department of the Treasury",
    description: "Real federal award spending data. Tracks active awards for workforce development, veteran transition, behavioral health, child welfare, community health, reentry services, housing assistance, and maternal health.",
    dataTypes: ["Award Amounts", "Recipient Organizations", "Award Dates", "Program Activity", "Funding Agency"],
    url: "https://usaspending.gov",
    apiEndpoint: "https://api.usaspending.gov",
    status: "live",
    updateFrequency: "Daily",
    geographyLevel: "National, State, County",
    usedBy: ["Grant Hub", "Grant Discovery Engine", "Ecosystem AI"],
    icon: DollarSign,
    category: "federal"
  },
  {
    id: "samhsa",
    name: "SAMHSA Treatment Locator",
    shortName: "SAMHSA",
    agency: "Substance Abuse and Mental Health Services Administration",
    description: "Behavioral health treatment facility locator for substance abuse and mental health services. Provider directories, evidence-based program registries, and treatment capacity data.",
    dataTypes: ["Treatment Facilities", "Service Types", "Insurance Accepted", "Special Programs", "Capacity"],
    url: "https://findtreatment.gov",
    apiEndpoint: "https://findtreatment.gov/locator/listing",
    status: "live",
    updateFrequency: "Quarterly",
    geographyLevel: "Address, ZIP Code, County",
    usedBy: ["Resource Finder", "Prevention Hub", "Health Network", "Benefits Screener"],
    icon: Stethoscope,
    category: "federal"
  },
  {
    id: "bls",
    name: "Bureau of Labor Statistics",
    shortName: "BLS",
    agency: "U.S. Department of Labor",
    description: "Labor market data including unemployment rates, wage data, occupational projections, and workforce statistics used for workforce development grant narratives.",
    dataTypes: ["Unemployment Rate", "Wage Data", "Occupational Outlook", "Labor Force Participation", "Industry Employment"],
    url: "https://bls.gov",
    status: "available",
    updateFrequency: "Monthly",
    geographyLevel: "State, Metro Area",
    usedBy: ["Workforce Dashboard", "Career Explorer", "Grant Packages"],
    icon: Briefcase,
    category: "federal"
  },
  {
    id: "hud",
    name: "HUD Fair Market Rents and Housing Data",
    shortName: "HUD",
    agency: "U.S. Department of Housing and Urban Development",
    description: "Fair Market Rents (FMR), income limits, public housing data, and housing affordability metrics used in housing stability initiatives.",
    dataTypes: ["Fair Market Rents", "Income Limits", "Housing Authority Data", "Homelessness Counts"],
    url: "https://huduser.gov",
    status: "available",
    updateFrequency: "Annual",
    geographyLevel: "County, Metro Area",
    usedBy: ["Austin Initiative", "Grant Packages", "Benefits Screener"],
    icon: Home,
    category: "federal"
  },
  {
    id: "usda-food",
    name: "USDA Food Access Research Atlas",
    shortName: "USDA Food Atlas",
    agency: "U.S. Department of Agriculture",
    description: "Food desert identification, SNAP retailer data, and food access metrics at the census tract level for community nutrition assessments.",
    dataTypes: ["Food Desert Status", "SNAP Retailers", "Low Income/Low Access", "Vehicle Access"],
    url: "https://ers.usda.gov/data-products/food-access-research-atlas/",
    status: "available",
    updateFrequency: "Periodic",
    geographyLevel: "Census Tract",
    usedBy: ["SDOH Explorer", "Community Map", "Grant Packages"],
    icon: Leaf,
    category: "federal"
  },
];

const STATE_SOURCES: DataSource[] = [
  {
    id: "twc",
    name: "Texas Workforce Commission (TWC)",
    shortName: "TWC",
    agency: "State of Texas",
    description: "Texas labor market data, WIOA program data, workforce board statistics, apprenticeship registrations, and training provider performance. Critical for WIOA grant applications ($200K-$500K).",
    dataTypes: ["WIOA Enrollment", "Training Provider Outcomes", "Apprenticeship Data", "Labor Market Info", "Workforce Board Stats"],
    url: "https://twc.texas.gov",
    status: "available",
    updateFrequency: "Quarterly",
    geographyLevel: "Workforce Development Area, County",
    usedBy: ["Workforce Dashboard", "Grant Packages", "Apprenticeship Tracker"],
    icon: Briefcase,
    category: "state"
  },
  {
    id: "hhsc",
    name: "Texas Health and Human Services Commission (HHSC)",
    shortName: "TX HHSC",
    agency: "State of Texas",
    description: "Medicaid enrollment, CHIP, SNAP, TANF, and social services data for Texas. Provider directories and benefits eligibility information.",
    dataTypes: ["Medicaid Enrollment", "CHIP Coverage", "SNAP Recipients", "TANF Data", "Provider Directories"],
    url: "https://hhs.texas.gov",
    status: "available",
    updateFrequency: "Monthly",
    geographyLevel: "County, Service Area",
    usedBy: ["Benefits Screener", "Health Network", "Grant Packages"],
    icon: Heart,
    category: "state"
  },
  {
    id: "tea",
    name: "Texas Education Agency (TEA)",
    shortName: "TEA",
    agency: "State of Texas",
    description: "School performance data, STAAR scores, dropout rates, discipline data, special education, and Title I eligibility used for education grant narratives and ISSS implementation.",
    dataTypes: ["STAAR Performance", "Dropout Rates", "Discipline Data", "Special Ed Enrollment", "Title I Status", "Economically Disadvantaged %"],
    url: "https://tea.texas.gov",
    status: "available",
    updateFrequency: "Annual",
    geographyLevel: "Campus, District, Region",
    usedBy: ["ISSS", "ThriveUp", "Grant Packages", "RPLICE Toolkit"],
    icon: GraduationCap,
    category: "state"
  },
  {
    id: "tdcj",
    name: "Texas Department of Criminal Justice (TDCJ)",
    shortName: "TDCJ",
    agency: "State of Texas",
    description: "Incarceration statistics, recidivism rates, reentry data, and parole/probation metrics for Texas justice-involved population analysis.",
    dataTypes: ["Incarceration Rates", "Recidivism (3-Year)", "Parole Data", "Reentry Stats", "Facility Population"],
    url: "https://tdcj.texas.gov",
    status: "available",
    updateFrequency: "Annual",
    geographyLevel: "State, Facility, County",
    usedBy: ["Justice Command Center", "Reentry Dashboard", "Mission Transition"],
    icon: Scale,
    category: "state"
  },
  {
    id: "tjjd",
    name: "Texas Juvenile Justice Department (TJJD)",
    shortName: "TJJD",
    agency: "State of Texas",
    description: "Juvenile detention rates, diversion program data, and youth justice statistics by county for school-to-prison pipeline analysis.",
    dataTypes: ["Juvenile Detention Rate", "Diversion Programs", "Referral Data", "Commitment Data"],
    url: "https://tjjd.texas.gov",
    status: "available",
    updateFrequency: "Annual",
    geographyLevel: "County, Region",
    usedBy: ["Justice Command Center", "Prevention Hub", "Opportunity Youth"],
    icon: Users,
    category: "state"
  },
  {
    id: "dshs",
    name: "Texas DSHS Vital Statistics and Health Data",
    shortName: "TX DSHS",
    agency: "Texas Department of State Health Services",
    description: "Birth and death records, maternal mortality data, communicable disease surveillance, and community health assessments for Texas.",
    dataTypes: ["Maternal Mortality", "Birth Outcomes", "Communicable Disease", "Community Health Profiles"],
    url: "https://dshs.texas.gov",
    status: "available",
    updateFrequency: "Annual",
    geographyLevel: "County, Health Service Region",
    usedBy: ["HerHealth Network", "Sankofa Maternal Health", "Health Network"],
    icon: Baby,
    category: "state"
  },
];

const LOCAL_SOURCES: DataSource[] = [
  {
    id: "pfisd",
    name: "Pflugerville ISD -- Student Support Data",
    shortName: "PfISD",
    agency: "Pflugerville Independent School District",
    description: "Active ISSS pilot partner. Year 1: 5 high schools, 120 students. Data includes Thrive Scores, early warning flags, IEP compliance, CFIR fidelity scores, and practice-policy reports. Real implementation data powering Spencer Foundation research proposal.",
    dataTypes: ["Thrive Scores", "Early Warning Flags (78% flag-to-intervention)", "IEP Compliance (91%)", "CFIR Fidelity (7.2/10)", "Attendance", "Behavior", "Course Performance", "SEL Assessment"],
    url: "https://pfisd.net",
    status: "live",
    updateFrequency: "Real-time (via ISSS)",
    geographyLevel: "Campus, Student",
    usedBy: ["ISSS", "ThriveUp", "Spencer Foundation Grant", "RPLICE Toolkit"],
    icon: GraduationCap,
    category: "local",
    localCallout: "Active pilot -- Year 1 data collection in progress. 5 campuses, 120 students. Thrive Score improvement: 23%. Primary data source for Spencer Foundation Small Research Grant."
  },
  {
    id: "travis-county",
    name: "Travis County Data -- Justice, Health, and Social Services",
    shortName: "Travis County",
    agency: "Travis County, TX",
    description: "County-level justice data (jail population, diversion rates, reentry outcomes), health department data, and social service utilization for Central Texas baseline analysis.",
    dataTypes: ["Jail Population", "Pretrial Diversion", "Reentry Outcomes", "Mental Health Court", "Health Department Reports", "Child Welfare Referrals"],
    url: "https://traviscountytx.gov",
    status: "available",
    updateFrequency: "Varies",
    geographyLevel: "County, Precinct",
    usedBy: ["Justice Command Center", "Community Map", "Grant Packages", "Prevention Hub"],
    icon: Building2,
    category: "local",
    localCallout: "Travis County is the anchor county for TCAF's Central Texas operations. 1.3M population. Justice diversion data critical for re-entry grant narratives."
  },
  {
    id: "williamson-county",
    name: "Williamson County Data",
    shortName: "Williamson Co.",
    agency: "Williamson County, TX",
    description: "County data for the Pflugerville, Round Rock, and Georgetown corridor. Growth corridor demographics, justice statistics, and health access data for the St. David's 5-county service area.",
    dataTypes: ["Population Growth", "Justice Stats", "Health Access", "School District Data", "Housing Permits"],
    url: "https://wilco.org",
    status: "available",
    updateFrequency: "Varies",
    geographyLevel: "County, City",
    usedBy: ["Pflugerville Hub", "St. David's Prep", "Community Map", "Grant Packages"],
    icon: Building2,
    category: "local",
    localCallout: "Fastest-growing county in Central Texas. Pflugerville straddles Travis/Williamson county line. Critical for St. David's We All Benefit 2.0 (5-county service area)."
  },
  {
    id: "hays-bastrop-caldwell",
    name: "Hays, Bastrop, and Caldwell Counties",
    shortName: "Hays/Bastrop/Caldwell",
    agency: "Central Texas Counties",
    description: "Rural and suburban counties completing the St. David's 5-county target region. Higher vulnerability scores, limited healthcare access, and significant SDOH gaps compared to urban Travis County.",
    dataTypes: ["SVI Scores", "Healthcare Access", "Poverty Rate", "Broadband Access", "Food Desert Status"],
    url: "",
    status: "available",
    updateFrequency: "Annual (via Census/SVI)",
    geographyLevel: "County, Census Tract",
    usedBy: ["St. David's Prep", "SDOH Explorer", "Community Map"],
    icon: MapPin,
    category: "local",
    localCallout: "High-vulnerability rural counties. Bastrop SVI: 0.72 (high), Caldwell SVI: 0.81 (very high). Essential for demonstrating need in St. David's and RWJF proposals."
  },
  {
    id: "city-austin",
    name: "City of Austin Open Data",
    shortName: "Austin Data",
    agency: "City of Austin, TX",
    description: "Austin's open data portal with 311 service requests, affordable housing inventory, homelessness data (3,238 individuals), building permits, and transportation data. $435K median home price, 48,000+ unit housing gap.",
    dataTypes: ["311 Service Requests", "Affordable Housing Inventory", "Homeless Count (PIT)", "Building Permits", "Code Violations", "Transportation"],
    url: "https://data.austintexas.gov",
    status: "available",
    updateFrequency: "Varies (daily to annual)",
    geographyLevel: "Address, ZIP, Council District",
    usedBy: ["Austin Initiative", "Community Map", "Voices of Austin", "Grant Packages"],
    icon: MapPin,
    category: "local",
    localCallout: "Austin housing crisis: $435K median home, 48,000+ unit gap, 3,238 homeless. Gentrification displacement corridor (78702, 78721, 78723, 78741, 78744, 78745) tracked for equity analysis."
  },
  {
    id: "city-pflugerville",
    name: "City of Pflugerville and PCDC",
    shortName: "Pflugerville/PCDC",
    agency: "City of Pflugerville / Pflugerville Community Development Corporation",
    description: "Pflugerville municipal data and PCDC economic development metrics. Branchview development (330 affordable units, 2027 completion), Samsung/Tesla employment corridor analysis, and senior population growth data.",
    dataTypes: ["PCDC Grants", "Branchview Development", "Samsung/Tesla Corridor", "Senior Population", "Affordable Housing Pipeline"],
    url: "https://pflugervilletx.gov",
    status: "available",
    updateFrequency: "Varies",
    geographyLevel: "City",
    usedBy: ["Pflugerville Hub", "Grant Packages", "Workforce Dashboard"],
    icon: MapPin,
    category: "local",
    localCallout: "CDBG entitlement city. 330 affordable units coming (Branchview 2027) but ZERO social infrastructure. PCDC partnership opportunity ($150K+ grants). Samsung/Tesla workforce pipeline."
  },
  {
    id: "city-manor",
    name: "City of Manor Data",
    shortName: "Manor",
    agency: "City of Manor, TX",
    description: "Manor community data covering a predominantly Black and Hispanic community east of Austin. Health desert with limited healthcare facilities, Manor ISD data, and commute burden analysis.",
    dataTypes: ["Health Access Gaps", "Manor ISD Data", "Commute Data", "Demographics", "Food Access"],
    url: "https://cityofmanor.org",
    status: "available",
    updateFrequency: "Varies",
    geographyLevel: "City",
    usedBy: ["Manor Hub", "Community Map", "Grant Packages"],
    icon: MapPin,
    category: "local",
    localCallout: "Health desert community. Limited primary care, zero mental health facilities within city limits. High commute burden (avg 42 min). Workforce development gap with Samsung/Tesla corridor nearby."
  },
  {
    id: "echo",
    name: "ECHO -- Ending Community Homelessness Coalition",
    shortName: "ECHO",
    agency: "ECHO (Austin/Travis County CoC)",
    description: "Austin/Travis County Continuum of Care. Point-in-Time count data, homeless management information system (HMIS) outputs, housing placement rates, and coordinated entry data.",
    dataTypes: ["Point-in-Time Count", "Housing Placements", "Coordinated Entry", "HMIS Demographics", "Chronic Homelessness"],
    url: "https://austinecho.org",
    status: "available",
    updateFrequency: "Annual (PIT), Quarterly (HMIS)",
    geographyLevel: "CoC Region (Austin/Travis County)",
    usedBy: ["Austin Initiative", "Community Map", "Grant Packages"],
    icon: Home,
    category: "local",
    localCallout: "3,238 homeless individuals (2024 PIT). Austin's lead CoC agency. HMIS data critical for HUD CoC and ESG grant applications."
  },
  {
    id: "capcog",
    name: "Capital Area Council of Governments (CAPCOG)",
    shortName: "CAPCOG",
    agency: "CAPCOG",
    description: "10-county Central Texas regional planning organization. Regional transportation, public safety, aging services, and environmental quality data for the greater Austin metropolitan area.",
    dataTypes: ["Regional Planning", "Aging Services", "Criminal Justice", "Emergency Management", "Environmental Quality"],
    url: "https://capcog.org",
    status: "available",
    updateFrequency: "Varies",
    geographyLevel: "10-County Region",
    usedBy: ["Community Map", "SafeReport", "Grant Packages"],
    icon: Globe,
    category: "local",
    localCallout: "10-county regional planning body. Covers entire St. David's 5-county service area plus surrounding counties. Emergency management coordination hub."
  },
  {
    id: "foundation-communities",
    name: "Foundation Communities -- Affordable Housing",
    shortName: "Foundation Communities",
    agency: "Foundation Communities (Nonprofit)",
    description: "Austin's largest affordable housing provider. Resident services data, tax preparation (VITA), financial stability outcomes, and community learning center utilization.",
    dataTypes: ["Housing Units", "Resident Services", "VITA Tax Returns", "Financial Stability", "Education Programs"],
    url: "https://foundcom.org",
    status: "available",
    updateFrequency: "Annual",
    geographyLevel: "Property, City",
    usedBy: ["Austin Initiative", "Benefits Screener", "Grant Packages"],
    icon: Home,
    category: "local",
    localCallout: "2,700+ affordable housing units across Austin. Key partner for housing stability grants. VITA program serves 20,000+ tax returns annually."
  },
  {
    id: "stdavids-foundation",
    name: "St. David's Foundation Community Health Data",
    shortName: "St. David's",
    agency: "St. David's Foundation",
    description: "Community Health Needs Assessment (CHNA) data for the 5-county Central Texas service area. Health equity metrics, dental access gaps, behavioral health capacity, and community benefit spending.",
    dataTypes: ["CHNA Results", "Health Equity Metrics", "Dental Access", "Behavioral Health Capacity", "Community Benefit"],
    url: "https://stdavidsfoundation.org",
    status: "available",
    updateFrequency: "Triennial (CHNA), Annual (reports)",
    geographyLevel: "5-County Service Area",
    usedBy: ["St. David's Prep", "Health Network", "Grant Packages", "CHW Dashboard"],
    icon: Heart,
    category: "local",
    localCallout: "Primary funder target. We All Benefit 2.0 LOI due April 27. CHNA data anchors all health equity proposals for the 5-county Central Texas region."
  },
];

const INTERNAL_SOURCES: DataSource[] = [
  {
    id: "rplice",
    name: "RPLICE -- Research-to-Practice Lifecycle Implementation and Community Evidence",
    shortName: "RPLICE",
    agency: "ThriveUp / TCAF",
    description: "Live AI-powered implementation science platform. CFIR 2.0, RE-AIM, EPIS frameworks. Multi-AI consensus engine (Gemini, Claude, OpenAI). Produces fidelity scores, readiness assessments, Proctor's 8 outcomes.",
    dataTypes: ["CFIR 2.0 Fidelity", "RE-AIM Scores", "EPIS Phases", "Readiness Assessments", "Implementation Outcomes", "Practice-Policy Reports"],
    url: "https://www.bettersciencelab.com",
    apiEndpoint: "https://salp-science--mrterryflood.replit.app/api",
    status: "live",
    updateFrequency: "Real-time",
    geographyLevel: "Program, District, Organization",
    usedBy: ["RPLICE Toolkit", "Grant Packages", "Research Hub", "Spencer Foundation Grant"],
    icon: Zap,
    category: "internal"
  },
  {
    id: "isss",
    name: "ISSS -- Integrated Supports for Thriving Youth",
    shortName: "ISSS",
    agency: "ThriveUp / TCAF",
    description: "Whole-child implementation infrastructure for K-12 schools. Measures Thrive Scores, early warning flags, IEP compliance, attendance, behavior, course performance, and SEL across 12 districts.",
    dataTypes: ["Thrive Scores (23% improvement)", "Early Warning Flags (78% flag-to-intervention)", "IEP Compliance (91%)", "CFIR Fidelity (7.2/10)", "Attendance/Behavior/Course"],
    url: "https://thrivingcommunitiesforall.com",
    status: "live",
    updateFrequency: "Real-time",
    geographyLevel: "Student, Campus, District",
    usedBy: ["ISSS Platform", "Spencer Foundation Grant", "RPLICE Toolkit", "ThriveUp"],
    icon: GraduationCap,
    category: "internal"
  },
  {
    id: "ecosystem-connector",
    name: "Ecosystem Connector -- 15-Platform Telemetry",
    shortName: "Ecosystem",
    agency: "ThriveUp / TCAF",
    description: "Real-time heartbeat monitoring, capability mapping, and cross-platform data exchange across the 15 ThriveUp service platforms. Feeds compliance enforcement, grant narratives, and stakeholder reports.",
    dataTypes: ["Platform Health", "Heartbeat Status", "Capability Mapping", "Cross-Platform Referrals", "Compliance Grades"],
    url: "https://thrivingcommunitiesforall.com/ecosystem",
    status: "live",
    updateFrequency: "Real-time (10-minute heartbeat)",
    geographyLevel: "Platform, Ecosystem",
    usedBy: ["Transparency Dashboard", "Directive Compliance", "Grant Packages", "Ecosystem Hub"],
    icon: Activity,
    category: "internal"
  },
  {
    id: "grant-discovery",
    name: "Grant Discovery Engine -- Multi-Source Scanner",
    shortName: "Grant Discovery",
    agency: "ThriveUp / TCAF",
    description: "Automated daily scanner across SAM.gov, Grants.gov, USASpending.gov, and curated foundation/corporate opportunities. Keyword matching across 15 categories, duplicate detection, and AI-powered fit scoring.",
    dataTypes: ["Federal Opportunities", "Foundation Grants", "Corporate Grants", "State Opportunities", "Fit Scores"],
    url: "https://thrivingcommunitiesforall.com/grants",
    status: "live",
    updateFrequency: "Daily (automated)",
    geographyLevel: "National",
    usedBy: ["Grant Hub", "Grant Command Center", "Ecosystem AI"],
    icon: Search,
    category: "internal"
  },
];

const ALL_SOURCES = [...FEDERAL_SOURCES, ...STATE_SOURCES, ...LOCAL_SOURCES, ...INTERNAL_SOURCES];

function getStatusBadge(status: SourceStatus) {
  switch (status) {
    case "live":
      return <Badge className="bg-green-600 text-white" data-testid="badge-status-live"><Wifi className="h-3 w-3 mr-1" /> Live API</Badge>;
    case "available":
      return <Badge variant="secondary" data-testid="badge-status-available"><CheckCircle2 className="h-3 w-3 mr-1" /> Available</Badge>;
    case "key-required":
      return <Badge variant="outline" className="border-amber-500 text-amber-600" data-testid="badge-status-key"><AlertTriangle className="h-3 w-3 mr-1" /> API Key Required</Badge>;
    case "planned":
      return <Badge variant="outline" data-testid="badge-status-planned"><Clock className="h-3 w-3 mr-1" /> Planned</Badge>;
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case "federal": return "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800";
    case "state": return "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800";
    case "local": return "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800";
    case "internal": return "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800";
    default: return "";
  }
}

function SourceCard({ source }: { source: DataSource }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = source.icon;
  return (
    <Card className={`transition-all ${getCategoryColor(source.category)} ${expanded ? "ring-2 ring-primary/20 shadow-lg" : "hover:shadow-md"}`} data-testid={`card-source-${source.id}`}>
      <button className="w-full text-left p-4" onClick={() => setExpanded(!expanded)} data-testid={`button-expand-${source.id}`}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-background shadow-sm shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm">{source.shortName}</h3>
              {getStatusBadge(source.status)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{source.agency}</p>
            <p className="text-sm mt-1 line-clamp-2">{source.description}</p>
          </div>
          <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </button>
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3">
          {source.localCallout && (
            <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700" data-testid={`callout-local-${source.id}`}>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Local Impact</span>
              </div>
              <p className="text-sm text-emerald-800 dark:text-emerald-300">{source.localCallout}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Data Types</p>
            <div className="flex flex-wrap gap-1">
              {source.dataTypes.map((dt) => (
                <Badge key={dt} variant="outline" className="text-xs">{dt}</Badge>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Update Frequency</p>
              <p>{source.updateFrequency}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Geography Level</p>
              <p>{source.geographyLevel}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Powers These Pages</p>
            <div className="flex flex-wrap gap-1">
              {source.usedBy.map((page) => (
                <Badge key={page} variant="secondary" className="text-xs">{page}</Badge>
              ))}
            </div>
          </div>
          {(source.url || source.apiEndpoint) && (
            <div className="flex gap-2 flex-wrap">
              {source.url && (
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline" data-testid={`link-url-${source.id}`}>
                  <ExternalLink className="h-3 w-3" /> Portal
                </a>
              )}
              {source.apiEndpoint && (
                <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">{source.apiEndpoint}</span>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function SummaryStats() {
  const live = ALL_SOURCES.filter(s => s.status === "live").length;
  const available = ALL_SOURCES.filter(s => s.status === "available").length;
  const federal = FEDERAL_SOURCES.length;
  const state = STATE_SOURCES.length;
  const local = LOCAL_SOURCES.length;
  const internal = INTERNAL_SOURCES.length;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      <Card className="p-3 text-center" data-testid="stat-total">
        <p className="text-2xl font-bold">{ALL_SOURCES.length}</p>
        <p className="text-xs text-muted-foreground">Total Sources</p>
      </Card>
      <Card className="p-3 text-center" data-testid="stat-live">
        <p className="text-2xl font-bold text-green-600">{live}</p>
        <p className="text-xs text-muted-foreground">Live APIs</p>
      </Card>
      <Card className="p-3 text-center" data-testid="stat-available">
        <p className="text-2xl font-bold text-blue-600">{available}</p>
        <p className="text-xs text-muted-foreground">Available</p>
      </Card>
      <Card className="p-3 text-center bg-blue-50 dark:bg-blue-950/30" data-testid="stat-federal">
        <p className="text-2xl font-bold text-blue-700">{federal}</p>
        <p className="text-xs text-muted-foreground">Federal</p>
      </Card>
      <Card className="p-3 text-center bg-amber-50 dark:bg-amber-950/30" data-testid="stat-state">
        <p className="text-2xl font-bold text-amber-700">{state}</p>
        <p className="text-xs text-muted-foreground">State (Texas)</p>
      </Card>
      <Card className="p-3 text-center bg-emerald-50 dark:bg-emerald-950/30 ring-2 ring-emerald-300 dark:ring-emerald-700" data-testid="stat-local">
        <p className="text-2xl font-bold text-emerald-700">{local}</p>
        <p className="text-xs text-muted-foreground">Local / Community</p>
      </Card>
      <Card className="p-3 text-center bg-purple-50 dark:bg-purple-950/30" data-testid="stat-internal">
        <p className="text-2xl font-bold text-purple-700">{internal}</p>
        <p className="text-xs text-muted-foreground">TCAF Internal</p>
      </Card>
    </div>
  );
}

function LocalHighlightBanner() {
  return (
    <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 p-4" data-testid="banner-local-highlight">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-emerald-200 dark:bg-emerald-800 shrink-0">
          <MapPin className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-emerald-800 dark:text-emerald-200">Local Data -- Central Texas Focus</h3>
          <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
            TCAF operates in a 5-county Central Texas region (Travis, Williamson, Hays, Bastrop, Caldwell) with deep community partnerships. 
            Local data sources are marked with green borders and include direct partnership data from PfISD (active ISSS pilot), 
            St. David's Foundation (CHNA data), ECHO (homeless CoC), Foundation Communities (affordable housing), and municipal open data from Austin, Pflugerville, and Manor.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge className="bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200">PfISD -- Active Pilot</Badge>
            <Badge className="bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200">St. David's 5-County</Badge>
            <Badge className="bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200">ECHO CoC</Badge>
            <Badge className="bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200">City of Austin</Badge>
            <Badge className="bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200">Pflugerville/PCDC</Badge>
            <Badge className="bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200">Manor</Badge>
            <Badge className="bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200">CAPCOG 10-County</Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function DataSourcesPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filtered = ALL_SOURCES.filter((s) => {
    const matchesSearch = !search || 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.shortName.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.dataTypes.some(dt => dt.toLowerCase().includes(search.toLowerCase())) ||
      s.agency.toLowerCase().includes(search.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "local") return matchesSearch && (s.category === "local");
    if (activeTab === "federal") return matchesSearch && s.category === "federal";
    if (activeTab === "state") return matchesSearch && s.category === "state";
    if (activeTab === "internal") return matchesSearch && s.category === "internal";
    if (activeTab === "live") return matchesSearch && s.status === "live";
    return matchesSearch;
  });

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl space-y-6" data-testid="page-data-sources">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Data Sources</h1>
        <p className="text-muted-foreground mt-1">
          All federal, state, local, and internal data sources powering the TCAF ecosystem -- {ALL_SOURCES.length} sources across {ALL_SOURCES.filter(s => s.status === "live").length} live APIs
        </p>
      </div>

      <SummaryStats />
      <LocalHighlightBanner />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sources, data types, agencies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-sources"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto" data-testid="tabs-source-categories">
          <TabsTrigger value="all" data-testid="tab-all">All ({ALL_SOURCES.length})</TabsTrigger>
          <TabsTrigger value="local" className="text-emerald-700 dark:text-emerald-400" data-testid="tab-local">Local ({LOCAL_SOURCES.length})</TabsTrigger>
          <TabsTrigger value="federal" data-testid="tab-federal">Federal ({FEDERAL_SOURCES.length})</TabsTrigger>
          <TabsTrigger value="state" data-testid="tab-state">State ({STATE_SOURCES.length})</TabsTrigger>
          <TabsTrigger value="internal" data-testid="tab-internal">TCAF Internal ({INTERNAL_SOURCES.length})</TabsTrigger>
          <TabsTrigger value="live" data-testid="tab-live">Live APIs ({ALL_SOURCES.filter(s => s.status === "live").length})</TabsTrigger>
        </TabsList>

        <div className="mt-4 space-y-3">
          {activeTab === "all" && (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-emerald-500" />
                  <h2 className="text-lg font-bold text-emerald-700 dark:text-emerald-400" data-testid="heading-local">Local and Community Data</h2>
                  <Badge className="bg-emerald-600 text-white">Priority</Badge>
                </div>
                <div className="grid gap-3">
                  {LOCAL_SOURCES.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.shortName.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase()) || s.dataTypes.some(dt => dt.toLowerCase().includes(search.toLowerCase()))).map(s => <SourceCard key={s.id} source={s} />)}
                </div>
              </div>

              <div className="space-y-3 mt-6">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-blue-500" />
                  <h2 className="text-lg font-bold" data-testid="heading-federal">Federal Data Sources</h2>
                </div>
                <div className="grid gap-3">
                  {FEDERAL_SOURCES.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.shortName.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase()) || s.dataTypes.some(dt => dt.toLowerCase().includes(search.toLowerCase()))).map(s => <SourceCard key={s.id} source={s} />)}
                </div>
              </div>

              <div className="space-y-3 mt-6">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-amber-500" />
                  <h2 className="text-lg font-bold" data-testid="heading-state">State Data Sources (Texas)</h2>
                </div>
                <div className="grid gap-3">
                  {STATE_SOURCES.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.shortName.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase()) || s.dataTypes.some(dt => dt.toLowerCase().includes(search.toLowerCase()))).map(s => <SourceCard key={s.id} source={s} />)}
                </div>
              </div>

              <div className="space-y-3 mt-6">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-purple-500" />
                  <h2 className="text-lg font-bold" data-testid="heading-internal">TCAF Internal Systems</h2>
                </div>
                <div className="grid gap-3">
                  {INTERNAL_SOURCES.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.shortName.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase()) || s.dataTypes.some(dt => dt.toLowerCase().includes(search.toLowerCase()))).map(s => <SourceCard key={s.id} source={s} />)}
                </div>
              </div>
            </>
          )}

          {activeTab !== "all" && (
            <div className="grid gap-3">
              {filtered.length === 0 && (
                <Card className="p-8 text-center text-muted-foreground" data-testid="text-no-results">
                  <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No data sources match your search.</p>
                </Card>
              )}
              {filtered.map(s => <SourceCard key={s.id} source={s} />)}
            </div>
          )}
        </div>
      </Tabs>

      <Card className="p-4 bg-muted/50" data-testid="card-data-flow">
        <h3 className="font-bold mb-2 flex items-center gap-2"><Layers className="h-5 w-5" /> Data Flow Architecture</h3>
        <div className="grid md:grid-cols-4 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-center">
            <p className="font-bold text-blue-700">Federal APIs</p>
            <p className="text-xs text-muted-foreground mt-1">Census, CDC, FBI, SAM.gov, Grants.gov, USASpending, SAMHSA, BLS, HUD, USDA</p>
            <ArrowRight className="h-4 w-4 mx-auto mt-2 text-blue-500" />
          </div>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-center">
            <p className="font-bold text-amber-700">State Layer</p>
            <p className="text-xs text-muted-foreground mt-1">TWC, HHSC, TEA, TDCJ, TJJD, DSHS</p>
            <ArrowRight className="h-4 w-4 mx-auto mt-2 text-amber-500" />
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-center ring-2 ring-emerald-300">
            <p className="font-bold text-emerald-700">Local Partners</p>
            <p className="text-xs text-muted-foreground mt-1">PfISD, Travis/Williamson Co., Austin, Pflugerville, Manor, ECHO, CAPCOG, St. David's</p>
            <ArrowRight className="h-4 w-4 mx-auto mt-2 text-emerald-500" />
          </div>
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-center">
            <p className="font-bold text-purple-700">TCAF Engine</p>
            <p className="text-xs text-muted-foreground mt-1">RPLICE, ISSS, Ecosystem Connector, Grant Discovery -- 15 service platforms</p>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link href="/sdoh-explorer">
          <Button variant="outline" size="sm" data-testid="link-sdoh-explorer"><BarChart3 className="h-4 w-4 mr-1" /> SDOH Explorer</Button>
        </Link>
        <Link href="/justice-command-center">
          <Button variant="outline" size="sm" data-testid="link-justice"><Shield className="h-4 w-4 mr-1" /> Justice Command Center</Button>
        </Link>
        <Link href="/neighborhood">
          <Button variant="outline" size="sm" data-testid="link-neighborhood"><MapPin className="h-4 w-4 mr-1" /> Neighborhood Intel</Button>
        </Link>
        <Link href="/community-map">
          <Button variant="outline" size="sm" data-testid="link-community-map"><Globe className="h-4 w-4 mr-1" /> Community Map</Button>
        </Link>
        <Link href="/rplice-tools">
          <Button variant="outline" size="sm" data-testid="link-rplice"><Zap className="h-4 w-4 mr-1" /> RPLICE Toolkit</Button>
        </Link>
        <Link href="/grants">
          <Button variant="outline" size="sm" data-testid="link-grants"><Target className="h-4 w-4 mr-1" /> Grant Hub</Button>
        </Link>
      </div>
    </div>
  );
}