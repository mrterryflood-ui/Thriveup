import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Home, Stethoscope, Baby, Heart, DollarSign, Users, Shield, Building2,
  ChevronRight, ChevronLeft, CheckCircle2, Circle, Loader2, FileText,
  TrendingUp, MapPin, ClipboardList, RefreshCw, AlertCircle, AlertTriangle, Phone, Mail,
  Globe, Calendar, Target, Award, ArrowRight,
} from "lucide-react";
import type { BenefitsApplication } from "@shared/schema";

const COUNTIES = [
  { fips: "48453", name: "Travis County", target: 80, cities: "Austin, Del Valle, Manor, Pflugerville (south)" },
  { fips: "48491", name: "Williamson County", target: 350, cities: "Round Rock, Georgetown, Cedar Park, Pflugerville (north)" },
  { fips: "48209", name: "Hays County", target: 50, cities: "San Marcos, Kyle, Buda, Wimberley" },
  { fips: "48021", name: "Bastrop County", target: 100, cities: "Bastrop, Elgin, Smithville, Cedar Creek" },
  { fips: "48055", name: "Caldwell County", target: 100, cities: "Lockhart, Luling, Martindale" },
];

type AreaKey = "healthcare_access" | "mental_health" | "dental" | "healthy_aging" | "healthy_children_families";

const AREAS: { key: AreaKey; label: string; description: string; color: string }[] = [
  { key: "healthcare_access", label: "Healthcare Access", description: "Primary care coverage, prescriptions, hospital access", color: "#3b82f6" },
  { key: "mental_health", label: "Mental Health", description: "Behavioral health, counseling, substance use treatment", color: "#8b5cf6" },
  { key: "dental", label: "Dental", description: "Pediatric and adult dental coverage", color: "#06b6d4" },
  { key: "healthy_aging", label: "Healthy Aging", description: "Coverage and income supports for adults 65+ and disabled", color: "#a855f7" },
  { key: "healthy_children_families", label: "Healthy Children & Families", description: "Food, child health, family income supports", color: "#22c55e" },
];

type BenefitDef = {
  key: string;
  name: string;
  short: string;
  icon: any;
  color: string;
  category: "food" | "health" | "income" | "family" | "other";
  areas: AreaKey[];
  countyRestriction?: string[]; // FIPS codes; if set, only these counties
  annualValue: number;
  description: string;
  eligibility: string;
  documents: string[];
  applicationChannel: string;
  processingTime: string;
};

const BENEFITS: BenefitDef[] = [
  {
    key: "SNAP", name: "SNAP — Food Benefits", short: "SNAP", icon: Home, color: "#22c55e", category: "food",
    areas: ["healthy_children_families"],
    annualValue: 3024,
    description: "Monthly funds on a Lone Star Card for groceries.",
    eligibility: "Income at or below 130% of Federal Poverty Level. Mixed-status families: citizen children eligible regardless of parent status.",
    documents: ["Photo ID for all household members", "Proof of income (last 30 days pay stubs OR most recent tax return)", "Proof of residence (utility bill, lease, mail)", "Social Security numbers (or proof not required)", "Immigration documents if applicable (for non-citizen household members applying)", "Childcare expense receipts (if applicable)", "Disability verification (if applicable)"],
    applicationChannel: "Your Texas Benefits portal · 2-1-1 · HHSC office · TCAF CHW assist",
    processingTime: "Up to 30 days (7 days expedited if very low income)",
  },
  {
    key: "Medicaid", name: "Medicaid — Health Coverage", short: "Medicaid", icon: Stethoscope, color: "#3b82f6", category: "health",
    areas: ["healthcare_access", "mental_health", "dental", "healthy_aging", "healthy_children_families"],
    annualValue: 7200,
    description: "Free or low-cost health coverage — doctor visits, hospital, prescriptions, mental health.",
    eligibility: "Income limits vary by category. Pregnant women up to 198% FPL. Children up to 144% FPL. Adults with disabilities. Parents with very low income.",
    documents: ["Photo ID", "Proof of income (pay stubs, tax return)", "Proof of residence", "Social Security number", "Immigration documents (if applicable)", "Pregnancy verification (if applying as pregnant)", "Disability documentation (if applying as disabled)"],
    applicationChannel: "Your Texas Benefits portal · HealthCare.gov · TCAF CHW assist · FQHC partner (LSCC)",
    processingTime: "45 days standard · 90 days for disability determination",
  },
  {
    key: "CHIP", name: "CHIP — Children's Health Insurance", short: "CHIP", icon: Baby, color: "#06b6d4", category: "health",
    areas: ["healthcare_access", "dental", "healthy_children_families"],
    annualValue: 2400,
    description: "Health coverage for children whose families earn too much for Medicaid but can't afford private insurance.",
    eligibility: "Children under 19. Family income up to 201% FPL. Must be uninsured.",
    documents: ["Child's birth certificate or ID", "Parent/guardian photo ID", "Proof of income", "Proof of residence", "Social Security numbers", "Proof child has been uninsured 90+ days (for some applicants)"],
    applicationChannel: "Your Texas Benefits portal · TCAF CHW assist · School-based enrollment",
    processingTime: "Up to 45 days · Coverage starts month after approval",
  },
  {
    key: "WIC", name: "WIC — Women, Infants & Children", short: "WIC", icon: Heart, color: "#ec4899", category: "family",
    areas: ["healthy_children_families"],
    annualValue: 528,
    description: "Nutrition support, healthy food, breastfeeding support — pregnant women, new mothers, children under 5.",
    eligibility: "Income at or below 185% FPL. Pregnant, breastfeeding, postpartum women, infants, children under 5. Available regardless of immigration status.",
    documents: ["ID for parent/guardian", "ID for child (birth certificate or shot record)", "Proof of income", "Proof of address", "Proof of pregnancy (if applicable)"],
    applicationChannel: "Texas WIC clinics · TCAF CHW referral · scheduled appointment required",
    processingTime: "Same-day appointment if eligible",
  },
  {
    key: "EITC", name: "EITC — Earned Income Tax Credit", short: "EITC", icon: DollarSign, color: "#eab308", category: "income",
    areas: ["healthy_children_families"],
    annualValue: 3584,
    description: "Tax refund up to $7,830 (2025) for working families. Can claim up to 3 prior years if missed.",
    eligibility: "Must have earned income from work. Income limits vary by household size. Up to ~$66,800 for families with 3+ children.",
    documents: ["Tax return (or unfiled W-2s/1099s for prior years)", "Social Security numbers for ALL household members", "Birth certificates for qualifying children", "Proof child lived with you 6+ months", "Bank info for direct deposit"],
    applicationChannel: "VITA tax sites · Frost Bank workshops · IRS Free File · TCAF tax referral",
    processingTime: "Refund in 21 days if e-filed with direct deposit",
  },
  {
    key: "CTC", name: "CTC — Child Tax Credit", short: "CTC", icon: Users, color: "#14b8a6", category: "income",
    areas: ["healthy_children_families"],
    annualValue: 3600,
    description: "Up to $2,000 per qualifying child under 17. Refundable portion up to $1,700 per child.",
    eligibility: "Child must be under 17, US citizen/national/resident, claimed as dependent, lived with taxpayer 6+ months, has SSN.",
    documents: ["Tax return", "Child's Social Security number", "Proof of relationship (birth certificate)", "Proof child lived with you"],
    applicationChannel: "VITA tax sites · Frost Bank · IRS Free File · paid tax preparer",
    processingTime: "Filed with tax return — refund in 21 days",
  },
  {
    key: "Marketplace", name: "ACA Marketplace — Health Insurance", short: "Marketplace", icon: Building2, color: "#f97316", category: "health",
    areas: ["healthcare_access", "mental_health"],
    annualValue: 5400,
    description: "Subsidized health insurance plans. Many families pay $0–$50/month with tax credits.",
    eligibility: "US citizens and lawfully present immigrants. Not eligible for affordable employer coverage or Medicaid. Income above Medicaid limit.",
    documents: ["Photo ID", "Social Security number", "Proof of income (pay stubs, tax return, self-employment)", "Current insurance info (if any)", "Immigration documents (if applicable)"],
    applicationChannel: "HealthCare.gov · Marketplace navigator · TCAF assist (Open Enrollment Nov 1 – Jan 15, or Special Enrollment after qualifying life event)",
    processingTime: "Enrollment effective 1st of next month",
  },
  {
    key: "SSI", name: "SSI — Supplemental Security Income", short: "SSI", icon: Shield, color: "#8b5cf6", category: "other",
    areas: ["healthy_aging"],
    annualValue: 10092,
    description: "Monthly cash income for people with disabilities or age 65+ with very limited income/resources.",
    eligibility: "Disabled, blind, or 65+. Resources under $2,000 individual / $3,000 couple. Income limits.",
    documents: ["Photo ID", "Social Security number", "Birth certificate", "Proof of income and resources (bank statements, property)", "Medical records (for disability claims)", "Doctor contact info"],
    applicationChannel: "SSA office · ssa.gov · phone application · TCAF assist with SSDI/SSI navigator",
    processingTime: "3–6 months · Disability claims often longer",
  },
  {
    key: "TANF", name: "TANF — Temporary Cash Assistance", short: "TANF", icon: Award, color: "#a855f7", category: "income",
    areas: ["healthy_children_families"],
    annualValue: 3500,
    description: "Monthly cash assistance for very low-income families with children. Time-limited (5 years lifetime).",
    eligibility: "Families with children under 18. Income at or below very low threshold (~$200/mo for family of 3 in TX).",
    documents: ["IDs for all adults", "Birth certificates for children", "Social Security numbers", "Proof of income", "Proof of residence", "Proof of pregnancy (if applicable)"],
    applicationChannel: "Your Texas Benefits portal · HHSC office · TCAF CHW assist",
    processingTime: "45 days",
  },
  {
    key: "MAP", name: "MAP — Medical Access Program (Travis County only)", short: "MAP", icon: Stethoscope, color: "#dc2626", category: "health",
    areas: ["healthcare_access", "mental_health", "dental"],
    countyRestriction: ["48453"],
    annualValue: 4800,
    description: "Travis County's local low-income healthcare program — primary care, specialty care, dental, behavioral health, and prescriptions for residents not eligible for Medicaid.",
    eligibility: "TRAVIS COUNTY RESIDENTS ONLY. At or below 200% FPL. Not eligible for Medicaid or Medicare. Available regardless of immigration status.",
    documents: ["Photo ID (or alternative ID for immigrants)", "Proof of Travis County residence", "Proof of income (pay stubs, tax return)", "Proof of household composition", "Denial letter from Medicaid (if previously applied)"],
    applicationChannel: "CommUnityCare clinics · Central Health enrollment sites · TCAF CHW assist (Travis only)",
    processingTime: "Same-day enrollment at most clinics if documents are complete",
  },
];

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  intake: { label: "Intake", variant: "outline" },
  in_progress: { label: "In Progress", variant: "secondary" },
  submitted: { label: "Submitted", variant: "default" },
  approved: { label: "Approved", variant: "default" },
  denied: { label: "Denied", variant: "destructive" },
  withdrawn: { label: "Withdrawn", variant: "outline" },
};

const STAGES = ["registered", "screening", "intake", "documents", "submitted", "decision", "enrolled"];

interface WizardData {
  countyFips: string;
  countyName: string;
  zipCode: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  preferredLanguage: string;
  householdSize: string;
  annualIncome: string;
  hasChildren: boolean;
  isPregnant: boolean;
  isDisabled: boolean;
  isElderly: boolean;
  citizenshipStatus: string;
  selectedBenefits: string[];
  documentsCollected: string[];
  consentGiven: boolean;
  notes: string;
}

const INITIAL_WIZARD: WizardData = {
  countyFips: "", countyName: "", zipCode: "",
  applicantName: "", applicantPhone: "", applicantEmail: "",
  preferredLanguage: "English",
  householdSize: "1", annualIncome: "",
  hasChildren: false, isPregnant: false, isDisabled: false, isElderly: false,
  citizenshipStatus: "us_citizen",
  selectedBenefits: [], documentsCollected: [], consentGiven: false, notes: "",
};

function computeEligibility(d: WizardData): string[] {
  const income = parseFloat(d.annualIncome) || 0;
  const hh = parseInt(d.householdSize) || 1;
  const fpl = 15060 + (hh - 1) * 5380;
  const eligible: string[] = [];
  if (income <= fpl * 1.3) eligible.push("SNAP");
  if (income <= fpl * 1.38 || d.isDisabled || d.isElderly) eligible.push("Medicaid");
  if (d.hasChildren && income <= fpl * 2.01) eligible.push("CHIP");
  if (d.isPregnant || d.hasChildren) {
    if (income <= fpl * 1.85) eligible.push("WIC");
  }
  if (income > 0 && income <= fpl * 4.0) eligible.push("EITC");
  if (d.hasChildren && income <= fpl * 4.0) eligible.push("CTC");
  if (income > fpl * 1.38 && income <= fpl * 4.0) eligible.push("Marketplace");
  if (d.isDisabled || d.isElderly) eligible.push("SSI");
  if (d.hasChildren && income <= fpl * 0.2) eligible.push("TANF");
  // MAP — Travis County ONLY (FIPS 48453); 200% FPL; ineligible for Medicaid/Medicare; immigration-status-blind
  if (d.countyFips === "48453" && income <= fpl * 2.0 && !d.isElderly) eligible.push("MAP");
  return eligible;
}

function programsForCounty(fips: string): BenefitDef[] {
  return BENEFITS.filter(b => !b.countyRestriction || b.countyRestriction.includes(fips));
}

// Direct enrollment portals — by program, per county.
// Most TX safety-net programs use one statewide portal; WIC/MAP/VITA differ by county.
type PortalLink = { label: string; url: string; type: "state_portal" | "federal_portal" | "local_clinic" | "tax_site" | "phone" };
const COUNTY_PORTALS: Record<string, Record<string, PortalLink[]>> = {
  // Travis (48453)
  "48453": {
    SNAP: [{ label: "Your Texas Benefits (apply online)", url: "https://www.yourtexasbenefits.com/", type: "state_portal" }, { label: "HHSC Office — 1431 Collier St, Austin", url: "https://www.hhs.texas.gov/services/your-texas-benefits/find-office", type: "local_clinic" }, { label: "2-1-1 Texas (phone help)", url: "tel:211", type: "phone" }],
    Medicaid: [{ label: "Your Texas Benefits", url: "https://www.yourtexasbenefits.com/", type: "state_portal" }, { label: "Lone Star Circle of Care (FQHC)", url: "https://www.lscctx.org/", type: "local_clinic" }, { label: "CommUnityCare", url: "https://communitycaretx.org/", type: "local_clinic" }],
    CHIP: [{ label: "Your Texas Benefits", url: "https://www.yourtexasbenefits.com/", type: "state_portal" }, { label: "AISD school enrollment events", url: "https://www.austinisd.org/", type: "local_clinic" }],
    WIC: [{ label: "Texas WIC — find clinic", url: "https://texaswic.org/find-wic-clinic", type: "state_portal" }, { label: "Travis County WIC: 7800 Shoal Creek Blvd, Austin", url: "https://texaswic.org/find-wic-clinic", type: "local_clinic" }, { label: "Schedule appointment: 512-972-4942", url: "tel:5129724942", type: "phone" }],
    EITC: [{ label: "Foundation Communities VITA", url: "https://foundcom.org/community-tax-center/", type: "tax_site" }, { label: "United Way VITA", url: "https://www.unitedwayaustin.org/program/vita/", type: "tax_site" }, { label: "IRS Free File", url: "https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free", type: "federal_portal" }],
    CTC: [{ label: "Foundation Communities VITA", url: "https://foundcom.org/community-tax-center/", type: "tax_site" }, { label: "IRS Free File", url: "https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free", type: "federal_portal" }],
    Marketplace: [{ label: "HealthCare.gov", url: "https://www.healthcare.gov/", type: "federal_portal" }, { label: "Foundation Communities — Insure Central Texas", url: "https://foundcom.org/insure-central-texas/", type: "local_clinic" }],
    SSI: [{ label: "Apply on ssa.gov", url: "https://www.ssa.gov/benefits/ssi/", type: "federal_portal" }, { label: "SSA Field Office: 1029 Camino La Costa, Austin", url: "https://secure.ssa.gov/ICON/main.jsp", type: "local_clinic" }, { label: "Phone: 1-800-772-1213", url: "tel:18007721213", type: "phone" }],
    TANF: [{ label: "Your Texas Benefits", url: "https://www.yourtexasbenefits.com/", type: "state_portal" }],
    MAP: [{ label: "Central Health MAP — apply online", url: "https://www.centralhealth.net/medical-access-program-map/", type: "local_clinic" }, { label: "CommUnityCare enrollment sites", url: "https://communitycaretx.org/services/eligibility/", type: "local_clinic" }, { label: "Enrollment hotline: 512-978-8130", url: "tel:5129788130", type: "phone" }],
  },
  // Williamson (48491)
  "48491": {
    SNAP: [{ label: "Your Texas Benefits", url: "https://www.yourtexasbenefits.com/", type: "state_portal" }, { label: "HHSC Round Rock: 1801 Old Settlers Blvd", url: "https://www.hhs.texas.gov/services/your-texas-benefits/find-office", type: "local_clinic" }],
    Medicaid: [{ label: "Your Texas Benefits", url: "https://www.yourtexasbenefits.com/", type: "state_portal" }, { label: "Lone Star Circle of Care (Williamson clinics)", url: "https://www.lscctx.org/locations/", type: "local_clinic" }],
    CHIP: [{ label: "Your Texas Benefits", url: "https://www.yourtexasbenefits.com/", type: "state_portal" }],
    WIC: [{ label: "Texas WIC — find clinic", url: "https://texaswic.org/find-wic-clinic", type: "state_portal" }, { label: "Williamson WIC: 100 W. 3rd St, Georgetown", url: "https://texaswic.org/find-wic-clinic", type: "local_clinic" }, { label: "Phone: 512-943-3636", url: "tel:5129433636", type: "phone" }],
    EITC: [{ label: "United Way Williamson VITA", url: "https://www.uwwc.org/financial-stability/vita/", type: "tax_site" }, { label: "IRS Free File", url: "https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free", type: "federal_portal" }],
    CTC: [{ label: "United Way Williamson VITA", url: "https://www.uwwc.org/financial-stability/vita/", type: "tax_site" }, { label: "IRS Free File", url: "https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free", type: "federal_portal" }],
    Marketplace: [{ label: "HealthCare.gov", url: "https://www.healthcare.gov/", type: "federal_portal" }, { label: "Foundation Communities — Insure Central Texas", url: "https://foundcom.org/insure-central-texas/", type: "local_clinic" }],
    SSI: [{ label: "Apply on ssa.gov", url: "https://www.ssa.gov/benefits/ssi/", type: "federal_portal" }, { label: "SSA Field Office: 1300 N IH-35, Round Rock", url: "https://secure.ssa.gov/ICON/main.jsp", type: "local_clinic" }],
    TANF: [{ label: "Your Texas Benefits", url: "https://www.yourtexasbenefits.com/", type: "state_portal" }],
  },
  // Hays (48209)
  "48209": {
    SNAP: [{ label: "Your Texas Benefits", url: "https://www.yourtexasbenefits.com/", type: "state_portal" }, { label: "HHSC San Marcos: 401 Broadway St", url: "https://www.hhs.texas.gov/services/your-texas-benefits/find-office", type: "local_clinic" }],
    Medicaid: [{ label: "Your Texas Benefits", url: "https://www.yourtexasbenefits.com/", type: "state_portal" }, { label: "CommUnityCare Hays clinic", url: "https://communitycaretx.org/", type: "local_clinic" }],
    CHIP: [{ label: "Your Texas Benefits", url: "https://www.yourtexasbenefits.com/", type: "state_portal" }],
    WIC: [{ label: "Texas WIC — find clinic", url: "https://texaswic.org/find-wic-clinic", type: "state_portal" }, { label: "Hays WIC: 401-B Broadway, San Marcos", url: "https://texaswic.org/find-wic-clinic", type: "local_clinic" }, { label: "Phone: 512-393-5520", url: "tel:5123935520", type: "phone" }],
    EITC: [{ label: "Hays County VITA at SMTX library", url: "https://www.uwhayscaldwell.org/vita", type: "tax_site" }, { label: "IRS Free File", url: "https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free", type: "federal_portal" }],
    CTC: [{ label: "Hays County VITA", url: "https://www.uwhayscaldwell.org/vita", type: "tax_site" }, { label: "IRS Free File", url: "https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free", type: "federal_portal" }],
    Marketplace: [{ label: "HealthCare.gov", url: "https://www.healthcare.gov/", type: "federal_portal" }],
    SSI: [{ label: "Apply on ssa.gov", url: "https://www.ssa.gov/benefits/ssi/", type: "federal_portal" }, { label: "SSA Field Office: 600 IH-35 N, San Marcos", url: "https://secure.ssa.gov/ICON/main.jsp", type: "local_clinic" }],
    TANF: [{ label: "Your Texas Benefits", url: "https://www.yourtexasbenefits.com/", type: "state_portal" }],
  },
  // Bastrop (48021)
  "48021": {
    SNAP: [{ label: "Your Texas Benefits", url: "https://www.yourtexasbenefits.com/", type: "state_portal" }, { label: "HHSC Bastrop: 906 Old Austin Hwy", url: "https://www.hhs.texas.gov/services/your-texas-benefits/find-office", type: "local_clinic" }],
    Medicaid: [{ label: "Your Texas Benefits", url: "https://www.yourtexasbenefits.com/", type: "state_portal" }, { label: "Lone Star Circle of Care — Bastrop", url: "https://www.lscctx.org/locations/", type: "local_clinic" }],
    CHIP: [{ label: "Your Texas Benefits", url: "https://www.yourtexasbenefits.com/", type: "state_portal" }],
    WIC: [{ label: "Texas WIC — find clinic", url: "https://texaswic.org/find-wic-clinic", type: "state_portal" }, { label: "Bastrop WIC: 803 Pecan St, Bastrop", url: "https://texaswic.org/find-wic-clinic", type: "local_clinic" }],
    EITC: [{ label: "Bastrop County VITA (BCAA)", url: "https://www.bcaa.org/", type: "tax_site" }, { label: "IRS Free File", url: "https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free", type: "federal_portal" }],
    CTC: [{ label: "Bastrop County VITA", url: "https://www.bcaa.org/", type: "tax_site" }, { label: "IRS Free File", url: "https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free", type: "federal_portal" }],
    Marketplace: [{ label: "HealthCare.gov", url: "https://www.healthcare.gov/", type: "federal_portal" }],
    SSI: [{ label: "Apply on ssa.gov", url: "https://www.ssa.gov/benefits/ssi/", type: "federal_portal" }],
    TANF: [{ label: "Your Texas Benefits", url: "https://www.yourtexasbenefits.com/", type: "state_portal" }],
  },
  // Caldwell (48055)
  "48055": {
    SNAP: [{ label: "Your Texas Benefits", url: "https://www.yourtexasbenefits.com/", type: "state_portal" }, { label: "HHSC Lockhart: 1701 S Colorado", url: "https://www.hhs.texas.gov/services/your-texas-benefits/find-office", type: "local_clinic" }],
    Medicaid: [{ label: "Your Texas Benefits", url: "https://www.yourtexasbenefits.com/", type: "state_portal" }, { label: "Community Action — Caldwell", url: "https://www.uwhayscaldwell.org/", type: "local_clinic" }],
    CHIP: [{ label: "Your Texas Benefits", url: "https://www.yourtexasbenefits.com/", type: "state_portal" }],
    WIC: [{ label: "Texas WIC — find clinic", url: "https://texaswic.org/find-wic-clinic", type: "state_portal" }, { label: "Caldwell WIC: 1403 Blackjack St, Lockhart", url: "https://texaswic.org/find-wic-clinic", type: "local_clinic" }],
    EITC: [{ label: "Hays/Caldwell VITA", url: "https://www.uwhayscaldwell.org/vita", type: "tax_site" }, { label: "IRS Free File", url: "https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free", type: "federal_portal" }],
    CTC: [{ label: "Hays/Caldwell VITA", url: "https://www.uwhayscaldwell.org/vita", type: "tax_site" }, { label: "IRS Free File", url: "https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free", type: "federal_portal" }],
    Marketplace: [{ label: "HealthCare.gov", url: "https://www.healthcare.gov/", type: "federal_portal" }],
    SSI: [{ label: "Apply on ssa.gov", url: "https://www.ssa.gov/benefits/ssi/", type: "federal_portal" }],
    TANF: [{ label: "Your Texas Benefits", url: "https://www.yourtexasbenefits.com/", type: "state_portal" }],
  },
};

const PORTAL_TYPE_LABEL: Record<string, string> = {
  state_portal: "State Portal",
  federal_portal: "Federal Portal",
  local_clinic: "Local Site",
  tax_site: "VITA / Tax Site",
  phone: "Phone",
};

const WIZARD_STEPS = [
  { key: "location", label: "Location" },
  { key: "household", label: "Household" },
  { key: "situation", label: "Situation" },
  { key: "results", label: "Eligibility" },
  { key: "documents", label: "Documents" },
  { key: "register", label: "Register" },
];

export default function WAB2EnrollmentHubPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState("dashboard");
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>(INITIAL_WIZARD);
  const [eligibility, setEligibility] = useState<string[]>([]);

  const [filterCounty, setFilterCounty] = useState<string>("all");
  const [filterBenefit, setFilterBenefit] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const dashboardQuery = useQuery<any>({ queryKey: ["/api/benefits/wab2/dashboard"] });
  const applicationsQuery = useQuery<BenefitsApplication[]>({ queryKey: ["/api/benefits/applications", "wab2"] });
  const networkQuery = useQuery<{ localOwned: number; peerMirrored: number; networkTotal: number; byPeer: Record<string, number>; peers: Array<{ id: string; url: string }> }>({
    queryKey: ["/api/rplice/network-totals"],
    refetchInterval: 30000,
  });
  const rpliceStateQuery = useQuery<any>({
    queryKey: ["/api/rplice/state", wizardData.countyFips],
    enabled: !!wizardData.countyFips,
  });

  // RPLICE-driven prioritization: reorder eligible programs by mapgap.refreshed; surface partner picker; show alerts
  const rpliceState = rpliceStateQuery.data;
  const activeAlerts: Array<{ id: string; program: string; severity: string; message: string }> = rpliceState?.activeAlerts || [];
  const rpliceCountyPartners: Array<{ id: string; name: string; programs: string[]; address?: string; phone?: string }> = rpliceState?.partners || [];
  const prioritizedPrograms: string[] = rpliceState?.prioritizedPrograms || [];
  const orderedEligibility = useMemo(() => {
    if (!prioritizedPrograms.length) return eligibility;
    const ranked = [...eligibility].sort((a, b) => {
      const ai = prioritizedPrograms.indexOf(a);
      const bi = prioritizedPrograms.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
    return ranked;
  }, [eligibility, prioritizedPrograms]);

  const filteredApps = useMemo(() => {
    const apps = applicationsQuery.data || [];
    return apps.filter(a => a.source === "wab2")
      .filter(a => filterCounty === "all" || a.countyFips === filterCounty)
      .filter(a => filterBenefit === "all" || a.benefitType === filterBenefit)
      .filter(a => filterStatus === "all" || a.status === filterStatus);
  }, [applicationsQuery.data, filterCounty, filterBenefit, filterStatus]);

  const createApp = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest("POST", "/api/benefits/applications", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/benefits/applications", "wab2"] });
      queryClient.invalidateQueries({ queryKey: ["/api/benefits/wab2/dashboard"] });
    },
  });

  const updateApp = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await apiRequest("PATCH", `/api/benefits/applications/${id}`, updates);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/benefits/applications", "wab2"] });
      queryClient.invalidateQueries({ queryKey: ["/api/benefits/wab2/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rplice/network-totals"] });
      toast({ title: "Application updated" });
      // Mirror status/stage changes to peers (LifeBridge) so their handshake stays in sync.
      // Skip if this row originated from a peer — we don't echo peer-owned data back.
      if (data?.id && !data?.isPeerMirrored) {
        apiRequest("POST", "/api/rplice/sync", {
          origin: "thriveup",
          events: [{
            type: "benefit.enrollment.updated",
            origin: "thriveup",
            payload: {
              externalId: data.id,
              residentRef: data.id,
              program: data.benefitType,
              benefitType: data.benefitType,
              county: (data.countyName || "").toLowerCase().replace(/\s*county$/i, "").trim(),
              countyFips: data.countyFips,
              countyName: data.countyName,
              status: data.status,
              stage: data.stage,
              estimatedAnnualValue: data.estimatedAnnualValue || 0,
            },
          }],
        }).catch((err) => console.warn("Peer-mirror update sync failed:", err));
      }
    },
  });

  const handleEligibilityCalc = () => {
    const e = computeEligibility(wizardData);
    setEligibility(e);
    setWizardData(d => ({ ...d, selectedBenefits: e }));
    setWizardStep(3);
  };

  const handleRegisterAll = async () => {
    if (!wizardData.consentGiven) {
      toast({ title: "Consent required", description: "Please confirm consent before registering.", variant: "destructive" });
      return;
    }
    if (!wizardData.applicantName || !wizardData.countyFips) {
      toast({ title: "Missing info", description: "Name and county are required.", variant: "destructive" });
      return;
    }
    if (wizardData.selectedBenefits.length === 0) {
      toast({ title: "No benefits selected", description: "Select at least one benefit to register for.", variant: "destructive" });
      return;
    }
    let created = 0;
    for (const benefit of wizardData.selectedBenefits) {
      const def = BENEFITS.find(b => b.key === benefit);
      try {
        const createdApp = await createApp.mutateAsync({
          countyFips: wizardData.countyFips,
          countyName: wizardData.countyName,
          zipCode: wizardData.zipCode || null,
          benefitType: benefit,
          applicantName: wizardData.applicantName,
          applicantPhone: wizardData.applicantPhone || null,
          applicantEmail: wizardData.applicantEmail || null,
          preferredLanguage: wizardData.preferredLanguage,
          householdSize: parseInt(wizardData.householdSize),
          annualIncome: parseFloat(wizardData.annualIncome) || 0,
          hasChildren: wizardData.hasChildren,
          citizenshipStatus: wizardData.citizenshipStatus,
          documentsCollected: wizardData.documentsCollected,
          documentsMissing: def ? def.documents.filter(doc => !wizardData.documentsCollected.includes(doc)) : [],
          consentGiven: wizardData.consentGiven,
          status: "intake",
          stage: "registered",
          source: "wab2",
          notes: wizardData.notes || null,
          estimatedAnnualValue: def?.annualValue || 0,
        });
        created++;
        // Peer-mirror this enrollment to the RPLICE network (e.g. LifeBridge at lifetransitionsaid.org).
        // Fire-and-forget — don't block wizard completion on network latency.
        if (createdApp?.id) {
          apiRequest("POST", "/api/rplice/sync", {
            origin: "thriveup",
            events: [{
              type: "benefit.enrollment.created",
              origin: "thriveup",
              payload: {
                externalId: createdApp.id,
                residentRef: createdApp.id,
                program: benefit,
                county: (wizardData.countyName || "").toLowerCase().replace(/\s*county$/i, "").trim(),
                countyFips: wizardData.countyFips,
                countyName: wizardData.countyName,
                zipCode: wizardData.zipCode || null,
                benefitType: benefit,
                applicantName: wizardData.applicantName,
                applicantPhone: wizardData.applicantPhone || null,
                applicantEmail: wizardData.applicantEmail || null,
                preferredLanguage: wizardData.preferredLanguage,
                householdSize: parseInt(wizardData.householdSize),
                annualIncome: parseFloat(wizardData.annualIncome) || 0,
                hasChildren: wizardData.hasChildren,
                citizenshipStatus: wizardData.citizenshipStatus,
                consentGiven: wizardData.consentGiven,
                status: "intake",
                stage: "registered",
                estimatedAnnualValue: def?.annualValue || 0,
              },
            }],
          }).catch((err) => console.warn("Peer-mirror sync failed:", err));
        }
      } catch (e) {
        console.error(`Failed to register ${benefit}:`, e);
      }
    }
    toast({
      title: "Registered",
      description: `${created} of ${wizardData.selectedBenefits.length} application${created === 1 ? "" : "s"} created. View in Tracker.`,
    });
    setWizardData(INITIAL_WIZARD);
    setEligibility([]);
    setWizardStep(0);
    setTab("tracker");
  };

  const dashboard = dashboardQuery.data;

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6" data-testid="page-wab2-enrollment-hub">
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="text-hub-title">
              WAB2 Enrollment Hub
            </h1>
            <p className="text-muted-foreground mt-1">
              Engine — not directory. 5 St. David's areas · 5 Central Texas counties · CHW-driven enrollment with RPLICE intelligence
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild data-testid="link-workspace">
              <Link href="/st-davids-wab2">
                <FileText className="h-3.5 w-3.5 mr-1" />
                Project Workspace
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild data-testid="link-screener">
              <Link href="/benefits-screener">
                <ClipboardList className="h-3.5 w-3.5 mr-1" />
                Public Screener
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5" data-testid="tabs-hub">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">Outcomes</TabsTrigger>
          <TabsTrigger value="forms" data-testid="tab-forms">Forms</TabsTrigger>
          <TabsTrigger value="wizard" data-testid="tab-wizard">Enrollment Wizard</TabsTrigger>
          <TabsTrigger value="tracker" data-testid="tab-tracker">Tracker</TabsTrigger>
          <TabsTrigger value="counties" data-testid="tab-counties">Counties</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {dashboardQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : dashboard ? (
            <>
              {networkQuery.data && (
                <Card data-testid="card-network-totals" className="border-primary/40 bg-primary/5">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5" />
                          Network View — No Double Counting
                        </div>
                        <div className="text-2xl font-semibold mt-1" data-testid="text-network-total">
                          {networkQuery.data.networkTotal.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">total enrollments across the RPLICE network</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <span data-testid="text-local-owned" className="font-medium text-foreground">{networkQuery.data.localOwned.toLocaleString()}</span> enrolled on ThriveUp
                          {" · "}
                          <span data-testid="text-peer-mirrored" className="font-medium text-foreground">{networkQuery.data.peerMirrored.toLocaleString()}</span> mirrored from peer platform{networkQuery.data.peerMirrored === 1 ? "" : "s"}
                          {Object.keys(networkQuery.data.byPeer || {}).length > 0 && (
                            <> ({Object.entries(networkQuery.data.byPeer).map(([k, v]) => `${v} via ${k}`).join(" · ")})</>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {(networkQuery.data.peers || []).map(p => (
                          <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" data-testid={`link-peer-${p.id}`}>
                            <Badge variant="outline" className="gap-1 hover-elevate">
                              <ArrowRight className="h-3 w-3" />
                              {p.id}
                            </Badge>
                          </a>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card data-testid="card-total-registered">
                  <CardContent className="pt-4 pb-3">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Registered</div>
                    <div className="text-2xl font-semibold mt-1">{dashboard.totals.registered}</div>
                    <div className="text-xs text-muted-foreground">total applications</div>
                  </CardContent>
                </Card>
                <Card data-testid="card-enrolled">
                  <CardContent className="pt-4 pb-3">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Enrolled</div>
                    <div className="text-2xl font-semibold mt-1 text-green-600 dark:text-green-500">{dashboard.totals.enrolled}</div>
                    <div className="text-xs text-muted-foreground">{Math.round(dashboard.totals.conversionRate * 100)}% conversion</div>
                  </CardContent>
                </Card>
                <Card data-testid="card-in-progress">
                  <CardContent className="pt-4 pb-3">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">In Progress</div>
                    <div className="text-2xl font-semibold mt-1">{dashboard.totals.inProgress}</div>
                    <div className="text-xs text-muted-foreground">in flight</div>
                  </CardContent>
                </Card>
                <Card data-testid="card-economic-impact">
                  <CardContent className="pt-4 pb-3">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Annual Value Unlocked</div>
                    <div className="text-2xl font-semibold mt-1 text-primary">
                      ${(dashboard.totals.estimatedAnnualValue / 1000).toFixed(1)}K
                    </div>
                    <div className="text-xs text-muted-foreground">estimated</div>
                  </CardContent>
                </Card>
              </div>

              <Card data-testid="card-target-progress">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-4 w-4" />
                    Year 1 Targets — Progress by Benefit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboard.targetProgress.map((tp: any) => (
                      <div key={tp.benefit} data-testid={`progress-benefit-${tp.benefit}`}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium">{tp.benefit}</span>
                          <span className="text-muted-foreground tabular-nums">
                            {tp.actual} / {tp.target} ({tp.progressPct}%)
                          </span>
                        </div>
                        <Progress value={Math.min(tp.progressPct, 100)} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-county-progress">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4" />
                    Year 1 Targets — Progress by County
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboard.countyProgress.map((cp: any) => (
                      <div key={cp.countyFips} data-testid={`progress-county-${cp.countyFips}`}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium">{cp.countyName}</span>
                          <span className="text-muted-foreground tabular-nums">
                            {cp.actual} / {cp.target} ({cp.progressPct}%)
                          </span>
                        </div>
                        <Progress value={Math.min(cp.progressPct, 100)} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-by-area">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-4 w-4" />
                    St. David's 5 Priority Areas — Outcomes
                  </CardTitle>
                  <CardDescription>The renewal-reporting lens: programs grouped by their Foundation focus area.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {AREAS.map(area => {
                      const a = dashboard.byArea?.[area.key] || { registered: 0, enrolled: 0, estimatedValue: 0 };
                      return (
                        <div key={area.key} className="p-3 border rounded-md" data-testid={`area-${area.key}`} style={{ borderTopColor: area.color, borderTopWidth: 3 }}>
                          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: area.color }}>{area.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{area.description}</div>
                          <div className="mt-2 flex justify-between items-baseline">
                            <span className="text-2xl font-semibold">{a.enrolled}</span>
                            <span className="text-xs text-muted-foreground">enrolled</span>
                          </div>
                          <div className="text-xs text-muted-foreground">{a.registered} registered · ${Math.round(a.estimatedValue / 1000)}K value</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {(dashboard.renewalMatrix?.length || 0) > 0 && (
                <Card data-testid="card-renewal-matrix">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Award className="h-4 w-4" />
                      Renewal Report Matrix — County × Area × Program × Language
                    </CardTitle>
                    <CardDescription>The exact format St. David's needs at renewal: "in 90 days we enrolled X residents in Caldwell County in WIC, X in Hays in Medicaid Dental..."</CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-semibold">County</th>
                          <th className="text-left p-2 font-semibold">Area</th>
                          <th className="text-left p-2 font-semibold">Program</th>
                          <th className="text-left p-2 font-semibold">Language</th>
                          <th className="text-right p-2 font-semibold">Enrolled</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.renewalMatrix.slice(0, 50).map((row: any, i: number) => {
                          const areaLabel = AREAS.find(a => a.key === row.area)?.label || row.area;
                          return (
                            <tr key={i} className="border-b last:border-0" data-testid={`matrix-row-${i}`}>
                              <td className="p-2">{row.countyName}</td>
                              <td className="p-2">{areaLabel}</td>
                              <td className="p-2 font-mono">{row.program}</td>
                              <td className="p-2">{row.language}</td>
                              <td className="p-2 text-right font-semibold">{row.enrolled}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}

              {dashboard.byLanguage && Object.keys(dashboard.byLanguage).length > 0 && (
                <Card data-testid="card-by-language">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Globe className="h-4 w-4" />
                      Language Access — Outcomes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(dashboard.byLanguage).map(([lang, v]: any) => (
                        <div key={lang} className="p-2 border rounded-md" data-testid={`lang-${lang}`}>
                          <div className="text-xs text-muted-foreground">{lang}</div>
                          <div className="text-base font-semibold">{v.enrolled} <span className="text-xs text-muted-foreground font-normal">/ {v.registered}</span></div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card data-testid="card-pipeline-stages">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4" />
                    Pipeline by Stage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                    {STAGES.map((stage) => (
                      <div key={stage} className="text-center p-2 border rounded-md" data-testid={`stage-${stage}`}>
                        <div className="text-xs text-muted-foreground capitalize">{stage}</div>
                        <div className="text-lg font-semibold mt-1">{dashboard.byStage[stage] || 0}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Failed to load dashboard.</p>
          )}
        </TabsContent>

        <TabsContent value="forms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Programs by St. David's Priority Area · Document Checklists & Application Channels</CardTitle>
              <CardDescription>Each program is grouped by the Foundation areas it advances. MAP appears for Travis County only.</CardDescription>
            </CardHeader>
          </Card>
          {AREAS.map(area => {
            const programsInArea = BENEFITS.filter(b => b.areas.includes(area.key));
            return (
              <Card key={area.key} data-testid={`forms-area-${area.key}`} style={{ borderLeftColor: area.color, borderLeftWidth: 4 }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm" style={{ color: area.color }}>{area.label}</CardTitle>
                  <CardDescription className="text-xs">{area.description} · {programsInArea.length} programs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {programsInArea.map(p => (
                      <Badge key={p.key} variant="outline" data-testid={`area-program-${area.key}-${p.key}`}>
                        {p.short}{p.countyRestriction ? " (Travis only)" : ""}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          <Separator />
          <div className="grid md:grid-cols-2 gap-4">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <Card key={b.key} data-testid={`form-${b.key}`}>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md" style={{ backgroundColor: `${b.color}20` }}>
                        <Icon className="h-5 w-5" style={{ color: b.color }} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{b.name}</CardTitle>
                        <CardDescription className="mt-1">{b.description}</CardDescription>
                      </div>
                      <Badge variant="outline" className="shrink-0">${b.annualValue.toLocaleString()}/yr</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <div className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-1">Eligibility</div>
                      <p className="text-sm">{b.eligibility}</p>
                    </div>
                    <div>
                      <div className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-1">Documents Needed</div>
                      <ul className="text-xs space-y-1">
                        {b.documents.map((doc, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            <span>{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <div>
                        <div className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-0.5">How to Apply</div>
                        <p className="text-xs">{b.applicationChannel}</p>
                      </div>
                      <div>
                        <div className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-0.5">Processing</div>
                        <p className="text-xs">{b.processingTime}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-1.5">Direct Enrollment by County</div>
                      <div className="space-y-2">
                        {COUNTIES.filter(c => !b.countyRestriction || b.countyRestriction.includes(c.fips)).map(county => {
                          const links = COUNTY_PORTALS[county.fips]?.[b.key] || [];
                          if (links.length === 0) return null;
                          return (
                            <div key={county.fips} className="text-xs" data-testid={`portal-${b.key}-${county.fips}`}>
                              <div className="font-medium text-muted-foreground mb-0.5">{county.name}</div>
                              <div className="flex flex-wrap gap-1">
                                {links.map((l, i) => (
                                  <a
                                    key={i}
                                    href={l.url}
                                    target={l.type === "phone" ? undefined : "_blank"}
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded border hover-elevate text-[10px]"
                                    data-testid={`link-${b.key}-${county.fips}-${i}`}
                                  >
                                    {l.type === "phone" ? <Phone className="h-2.5 w-2.5" /> : <ArrowRight className="h-2.5 w-2.5" />}
                                    {l.label}
                                  </a>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="wizard" className="space-y-4">
          <Card data-testid="card-wizard">
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="text-base">Enrollment Wizard</CardTitle>
                  <CardDescription>
                    Step {wizardStep + 1} of {WIZARD_STEPS.length}: {WIZARD_STEPS[wizardStep].label}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  {WIZARD_STEPS.map((s, i) => (
                    <div
                      key={s.key}
                      className={`h-1.5 w-8 rounded-full ${i <= wizardStep ? "bg-primary" : "bg-muted"}`}
                    />
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {wizardStep === 0 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="county">County *</Label>
                    <Select
                      value={wizardData.countyFips}
                      onValueChange={(v) => {
                        const c = COUNTIES.find(x => x.fips === v);
                        setWizardData(d => ({ ...d, countyFips: v, countyName: c?.name || "" }));
                      }}
                    >
                      <SelectTrigger id="county" data-testid="select-county">
                        <SelectValue placeholder="Select county" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTIES.map(c => (
                          <SelectItem key={c.fips} value={c.fips}>{c.name} — {c.cities}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input
                      id="zip"
                      value={wizardData.zipCode}
                      onChange={(e) => setWizardData(d => ({ ...d, zipCode: e.target.value }))}
                      placeholder="78660"
                      data-testid="input-zip"
                    />
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="name">Applicant Name *</Label>
                      <Input
                        id="name"
                        value={wizardData.applicantName}
                        onChange={(e) => setWizardData(d => ({ ...d, applicantName: e.target.value }))}
                        data-testid="input-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={wizardData.applicantPhone}
                        onChange={(e) => setWizardData(d => ({ ...d, applicantPhone: e.target.value }))}
                        data-testid="input-phone"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={wizardData.applicantEmail}
                        onChange={(e) => setWizardData(d => ({ ...d, applicantEmail: e.target.value }))}
                        data-testid="input-email"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="lang">Preferred Language</Label>
                    <Select
                      value={wizardData.preferredLanguage}
                      onValueChange={(v) => setWizardData(d => ({ ...d, preferredLanguage: v }))}
                    >
                      <SelectTrigger id="lang" data-testid="select-language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Spanish">Español</SelectItem>
                        <SelectItem value="Vietnamese">Tiếng Việt</SelectItem>
                        <SelectItem value="Chinese">中文</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="hh-size">Household Size *</Label>
                      <Input
                        id="hh-size"
                        type="number"
                        min="1"
                        value={wizardData.householdSize}
                        onChange={(e) => setWizardData(d => ({ ...d, householdSize: e.target.value }))}
                        data-testid="input-household-size"
                      />
                    </div>
                    <div>
                      <Label htmlFor="income">Annual Household Income *</Label>
                      <Input
                        id="income"
                        type="number"
                        min="0"
                        value={wizardData.annualIncome}
                        onChange={(e) => setWizardData(d => ({ ...d, annualIncome: e.target.value }))}
                        placeholder="e.g. 28000"
                        data-testid="input-income"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Citizenship Status</Label>
                    <Select
                      value={wizardData.citizenshipStatus}
                      onValueChange={(v) => setWizardData(d => ({ ...d, citizenshipStatus: v }))}
                    >
                      <SelectTrigger data-testid="select-citizenship">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us_citizen">US Citizen</SelectItem>
                        <SelectItem value="lawful_permanent">Lawful Permanent Resident</SelectItem>
                        <SelectItem value="other_lawful">Other Lawfully Present</SelectItem>
                        <SelectItem value="mixed_status">Mixed-Status Household</SelectItem>
                        <SelectItem value="prefer_not">Prefer Not to Say</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Citizen children in mixed-status households remain eligible for SNAP, Medicaid, CHIP, and WIC.
                    </p>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-3">
                  {[
                    { key: "hasChildren", label: "Has children under 18 in household" },
                    { key: "isPregnant", label: "Pregnant or recently postpartum" },
                    { key: "isDisabled", label: "Has a disability" },
                    { key: "isElderly", label: "Age 65 or older in household" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center gap-2 p-2.5 border rounded-md">
                      <Checkbox
                        id={item.key}
                        checked={(wizardData as any)[item.key]}
                        onCheckedChange={(v) => setWizardData(d => ({ ...d, [item.key]: !!v }))}
                        data-testid={`checkbox-${item.key}`}
                      />
                      <Label htmlFor={item.key} className="cursor-pointer flex-1">{item.label}</Label>
                    </div>
                  ))}
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-3">
                  {activeAlerts.length > 0 && (
                    <div className="space-y-2">
                      {activeAlerts.map(a => (
                        <div
                          key={a.id}
                          className={`p-3 border rounded-md text-sm flex items-start gap-2 ${
                            a.severity === "critical" ? "border-red-500/50 bg-red-50 dark:bg-red-950/30" :
                            a.severity === "warning" ? "border-amber-500/50 bg-amber-50 dark:bg-amber-950/30" :
                            "border-blue-500/50 bg-blue-50 dark:bg-blue-950/30"
                          }`}
                          data-testid={`alert-rplice-${a.id}`}
                        >
                          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-semibold">RPLICE alert · {a.program}:</span> {a.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {prioritizedPrograms.length > 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      Programs reordered by RPLICE MAP-Gap intelligence for {wizardData.countyName}.
                    </p>
                  )}
                  {orderedEligibility.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No benefits identified. Adjust prior steps.</p>
                  ) : (
                    <>
                      <p className="text-sm">
                        Based on your household, you appear eligible for <strong>{orderedEligibility.length}</strong> programs.
                        Select which to register for:
                      </p>
                      {orderedEligibility.map((key) => {
                        const def = BENEFITS.find(b => b.key === key);
                        if (!def) return null;
                        const Icon = def.icon;
                        const checked = wizardData.selectedBenefits.includes(key);
                        return (
                          <label
                            key={key}
                            className="flex items-start gap-3 p-3 border rounded-md cursor-pointer hover-elevate"
                            data-testid={`benefit-${key}`}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(v) => {
                                setWizardData(d => ({
                                  ...d,
                                  selectedBenefits: v
                                    ? [...d.selectedBenefits, key]
                                    : d.selectedBenefits.filter(b => b !== key),
                                }));
                              }}
                            />
                            <Icon className="h-5 w-5 mt-0.5" style={{ color: def.color }} />
                            <div className="flex-1">
                              <div className="font-semibold text-sm">{def.name}</div>
                              <div className="text-xs text-muted-foreground">{def.description}</div>
                            </div>
                            <Badge variant="outline" className="shrink-0">${def.annualValue.toLocaleString()}/yr</Badge>
                          </label>
                        );
                      })}
                      <div className="text-sm font-medium pt-2 border-t">
                        Total estimated annual value:{" "}
                        <span className="text-primary">
                          ${wizardData.selectedBenefits.reduce((s, k) => s + (BENEFITS.find(b => b.key === k)?.annualValue || 0), 0).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Check off documents already collected. Missing documents will be tracked on each application.
                  </p>
                  {wizardData.selectedBenefits.map(bk => {
                    const def = BENEFITS.find(b => b.key === bk);
                    if (!def) return null;
                    return (
                      <div key={bk} className="space-y-2">
                        <div className="font-semibold text-sm">{def.name}</div>
                        {def.documents.map((doc, i) => (
                          <div key={i} className="flex items-start gap-2 pl-2">
                            <Checkbox
                              checked={wizardData.documentsCollected.includes(doc)}
                              onCheckedChange={(v) => {
                                setWizardData(d => ({
                                  ...d,
                                  documentsCollected: v
                                    ? [...d.documentsCollected, doc]
                                    : d.documentsCollected.filter(x => x !== doc),
                                }));
                              }}
                              id={`doc-${bk}-${i}`}
                            />
                            <Label htmlFor={`doc-${bk}-${i}`} className="text-xs cursor-pointer">{doc}</Label>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}

              {wizardStep === 5 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="notes">Notes for Navigator</Label>
                    <Textarea
                      id="notes"
                      value={wizardData.notes}
                      onChange={(e) => setWizardData(d => ({ ...d, notes: e.target.value }))}
                      placeholder="Anything the CHW or partner should know — special circumstances, preferred contact times, family concerns..."
                      data-testid="textarea-notes"
                    />
                  </div>
                  <div className="p-3 border rounded-md bg-muted/30 space-y-2">
                    <div className="text-sm font-semibold">Registration Summary</div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div>Applicant: {wizardData.applicantName || "—"}</div>
                      <div>County: {wizardData.countyName || "—"} {wizardData.zipCode && `(${wizardData.zipCode})`}</div>
                      <div>Household size: {wizardData.householdSize} · Income: ${wizardData.annualIncome || "0"}</div>
                      <div>Programs: {wizardData.selectedBenefits.join(", ") || "none selected"}</div>
                      <div>Documents collected: {wizardData.documentsCollected.length}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 border border-amber-200 dark:border-amber-900 rounded-md bg-amber-50 dark:bg-amber-950/20">
                    <Checkbox
                      id="consent"
                      checked={wizardData.consentGiven}
                      onCheckedChange={(v) => setWizardData(d => ({ ...d, consentGiven: !!v }))}
                      data-testid="checkbox-consent"
                    />
                    <Label htmlFor="consent" className="text-xs cursor-pointer">
                      I confirm the applicant has consented to register their information with TCAF for the purpose of
                      benefits enrollment assistance. TCAF will not collect or store immigration status. Information is
                      shared only with assigned CHW/partner and HHSC application systems chosen by the applicant.
                    </Label>
                  </div>
                </div>
              )}

              <Separator />
              <div className="flex justify-between gap-2">
                <Button
                  variant="outline"
                  onClick={() => setWizardStep(s => Math.max(0, s - 1))}
                  disabled={wizardStep === 0}
                  data-testid="button-wizard-back"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                {wizardStep === 2 ? (
                  <Button onClick={handleEligibilityCalc} data-testid="button-check-eligibility">
                    Check Eligibility
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : wizardStep === 5 ? (
                  <Button
                    onClick={handleRegisterAll}
                    disabled={createApp.isPending || !wizardData.consentGiven}
                    data-testid="button-register"
                  >
                    {createApp.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    Register {wizardData.selectedBenefits.length} Application{wizardData.selectedBenefits.length === 1 ? "" : "s"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setWizardStep(s => s + 1)}
                    disabled={
                      (wizardStep === 0 && (!wizardData.countyFips || !wizardData.applicantName)) ||
                      (wizardStep === 1 && (!wizardData.householdSize || !wizardData.annualIncome))
                    }
                    data-testid="button-wizard-next"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracker" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle className="text-base">Application Tracker</CardTitle>
                  <CardDescription>
                    {filteredApps.length} of {(applicationsQuery.data || []).filter(a => a.source === "wab2").length} WAB2 applications
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => applicationsQuery.refetch()} data-testid="button-refresh">
                  <RefreshCw className={`h-3.5 w-3.5 mr-1 ${applicationsQuery.isFetching ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Select value={filterCounty} onValueChange={setFilterCounty}>
                  <SelectTrigger data-testid="filter-county">
                    <SelectValue placeholder="All counties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All counties</SelectItem>
                    {COUNTIES.map(c => <SelectItem key={c.fips} value={c.fips}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterBenefit} onValueChange={setFilterBenefit}>
                  <SelectTrigger data-testid="filter-benefit">
                    <SelectValue placeholder="All benefits" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All benefits</SelectItem>
                    {BENEFITS.map(b => <SelectItem key={b.key} value={b.key}>{b.short}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger data-testid="filter-status">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {applicationsQuery.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredApps.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No applications match the current filters.
                  <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={() => setTab("wizard")}>
                      Register first application <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredApps.map(app => {
                    const def = BENEFITS.find(b => b.key === app.benefitType);
                    const Icon = def?.icon || FileText;
                    const statusCfg = STATUS_CONFIG[app.status] || { label: app.status, variant: "outline" as const };
                    return (
                      <div
                        key={app.id}
                        className="p-3 border rounded-md bg-card"
                        data-testid={`application-${app.id}`}
                      >
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="flex items-start gap-2 min-w-0">
                            <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: def?.color || "currentColor" }} />
                            <div className="min-w-0">
                              <div className="font-medium text-sm flex items-center gap-2 flex-wrap">
                                <span>{app.applicantName}</span>
                                <span className="text-muted-foreground">·</span>
                                <span>{def?.short || app.benefitType}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {app.countyName} {app.zipCode && `(${app.zipCode})`} · HH {app.householdSize}
                                {app.applicantPhone && <> · <Phone className="h-3 w-3 inline" /> {app.applicantPhone}</>}
                                {app.preferredLanguage !== "English" && <> · <Globe className="h-3 w-3 inline" /> {app.preferredLanguage}</>}
                              </div>
                              {app.documentsMissing && app.documentsMissing.length > 0 && (
                                <div className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                                  Missing {app.documentsMissing.length} document{app.documentsMissing.length === 1 ? "" : "s"}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={statusCfg.variant} data-testid={`status-${app.id}`}>{statusCfg.label}</Badge>
                            <Select
                              value={app.status}
                              onValueChange={(v) => updateApp.mutate({ id: app.id, updates: { status: v } })}
                            >
                              <SelectTrigger className="w-32 h-8 text-xs" data-testid={`update-status-${app.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {(app.status === "submitted" || app.outcome) && (
                          <div className="mt-2 pt-2 border-t flex items-center gap-2 flex-wrap">
                            <Label className="text-xs">Outcome:</Label>
                            <Select
                              value={app.outcome || ""}
                              onValueChange={(v) => updateApp.mutate({ id: app.id, updates: { outcome: v, status: v === "approved" ? "approved" : v === "denied" ? "denied" : app.status, stage: v === "approved" ? "enrolled" : app.stage } })}
                            >
                              <SelectTrigger className="w-32 h-7 text-xs" data-testid={`update-outcome-${app.id}`}>
                                <SelectValue placeholder="Pending" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="denied">Denied</SelectItem>
                                <SelectItem value="withdrawn">Withdrawn</SelectItem>
                              </SelectContent>
                            </Select>
                            {app.outcome === "approved" && app.estimatedAnnualValue && (
                              <Badge variant="outline" className="text-xs">
                                ${app.estimatedAnnualValue.toLocaleString()}/yr unlocked
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Direct enrollment portal links for THIS application's county+program */}
                        {(() => {
                          const links = COUNTY_PORTALS[app.countyFips]?.[app.benefitType] || [];
                          if (links.length === 0 || app.status === "approved" || app.status === "denied") return null;
                          return (
                            <div className="mt-2 pt-2 border-t">
                              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Submit / Continue Online</div>
                              <div className="flex flex-wrap gap-1">
                                {links.map((l, i) => (
                                  <a key={i} href={l.url} target={l.type === "phone" ? undefined : "_blank"} rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded border hover-elevate text-[10px]"
                                    data-testid={`tracker-link-${app.id}-${i}`}>
                                    {l.type === "phone" ? <Phone className="h-2.5 w-2.5" /> : <ArrowRight className="h-2.5 w-2.5" />}
                                    {l.label}
                                  </a>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Receipt capture — record confirmation # + receipt URL when CHW submits */}
                        {(app.status === "submitted" || app.status === "in_progress" || app.outcome === "approved") && (
                          <div className="mt-2 pt-2 border-t space-y-2">
                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Submission Receipt</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <Input
                                placeholder="Confirmation # (e.g. YTB123456789)"
                                defaultValue={app.confirmationNumber || ""}
                                onBlur={(e) => {
                                  const v = e.currentTarget.value.trim();
                                  if (v !== (app.confirmationNumber || "")) {
                                    updateApp.mutate({ id: app.id, updates: { confirmationNumber: v, submittedAt: app.submittedAt || new Date().toISOString() } });
                                  }
                                }}
                                className="h-8 text-xs"
                                data-testid={`input-confirmation-${app.id}`}
                              />
                              <Input
                                placeholder="Receipt URL (screenshot, PDF link)"
                                defaultValue={app.receiptUrl || ""}
                                onBlur={(e) => {
                                  const v = e.currentTarget.value.trim();
                                  if (v !== (app.receiptUrl || "")) updateApp.mutate({ id: app.id, updates: { receiptUrl: v } });
                                }}
                                className="h-8 text-xs"
                                data-testid={`input-receipt-${app.id}`}
                              />
                            </div>
                            {app.confirmationNumber && (
                              <div className="text-[10px] text-green-600 dark:text-green-500 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Receipt captured
                                {app.receiptUrl && <> · <a href={app.receiptUrl} target="_blank" rel="noopener noreferrer" className="underline">view receipt</a></>}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Denial → appeal workflow */}
                        {app.outcome === "denied" && (
                          <div className="mt-2 pt-2 border-t space-y-2 bg-red-50 dark:bg-red-950/20 -mx-3 -mb-3 px-3 pb-3 rounded-b-md">
                            <div className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-400 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Denial — Appeal Workflow
                            </div>
                            <Textarea
                              placeholder="Denial reason (verbatim from notice — needed for appeal)"
                              defaultValue={app.denialReason || ""}
                              onBlur={(e) => {
                                const v = e.currentTarget.value.trim();
                                if (v !== (app.denialReason || "")) updateApp.mutate({ id: app.id, updates: { denialReason: v } });
                              }}
                              className="text-xs min-h-[60px]"
                              data-testid={`input-denial-${app.id}`}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                              <Select
                                value={app.appealStatus || ""}
                                onValueChange={(v) => updateApp.mutate({ id: app.id, updates: { appealStatus: v, appealFiledAt: v && v !== "not_filed" ? (app.appealFiledAt || new Date().toISOString()) : null } })}
                              >
                                <SelectTrigger className="h-8 text-xs" data-testid={`appeal-status-${app.id}`}>
                                  <SelectValue placeholder="Appeal status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="not_filed">Not filed</SelectItem>
                                  <SelectItem value="preparing">Preparing</SelectItem>
                                  <SelectItem value="filed">Appeal filed</SelectItem>
                                  <SelectItem value="hearing_scheduled">Hearing scheduled</SelectItem>
                                  <SelectItem value="overturned">Overturned (approved)</SelectItem>
                                  <SelectItem value="upheld">Denial upheld</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                placeholder="Appeal notes / hearing date"
                                defaultValue={app.appealNotes || ""}
                                onBlur={(e) => {
                                  const v = e.currentTarget.value.trim();
                                  if (v !== (app.appealNotes || "")) updateApp.mutate({ id: app.id, updates: { appealNotes: v } });
                                }}
                                className="h-8 text-xs"
                                data-testid={`input-appeal-notes-${app.id}`}
                              />
                            </div>
                            {app.appealStatus === "overturned" && (
                              <Button size="sm" variant="outline" className="text-xs"
                                onClick={() => updateApp.mutate({ id: app.id, updates: { outcome: "approved", status: "approved", stage: "enrolled" } })}
                                data-testid={`button-mark-enrolled-${app.id}`}>
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Mark enrolled (appeal won)
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="counties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">5-County Coverage</CardTitle>
              <CardDescription>Y1 enrollment targets by county. Williamson is TCAF's HQ build-out priority.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {COUNTIES.map(c => {
                  const countyApps = (applicationsQuery.data || []).filter(a => a.source === "wab2" && a.countyFips === c.fips);
                  const enrolled = countyApps.filter(a => a.outcome === "approved").length;
                  const pct = c.target > 0 ? Math.round((enrolled / c.target) * 100) : 0;
                  return (
                    <Card key={c.fips} data-testid={`county-${c.fips}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <CardTitle className="text-sm">{c.name}</CardTitle>
                            <CardDescription className="text-xs mt-0.5">{c.cities}</CardDescription>
                          </div>
                          <Badge variant="outline">FIPS {c.fips}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Y1 Target</span>
                          <span className="font-semibold tabular-nums">{enrolled} / {c.target} ({pct}%)</span>
                        </div>
                        <Progress value={Math.min(pct, 100)} className="h-2" />
                        <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                          <div>
                            <div className="text-lg font-semibold">{countyApps.length}</div>
                            <div className="text-xs text-muted-foreground">Registered</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-green-600 dark:text-green-500">{enrolled}</div>
                            <div className="text-xs text-muted-foreground">Enrolled</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold">
                              {countyApps.filter(a => ["intake", "in_progress", "submitted"].includes(a.status)).length}
                            </div>
                            <div className="text-xs text-muted-foreground">In Flight</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
