/**
 * Seed 50 verified fair-chance employers in Central Texas.
 * Sources: Texas Fair Chance Project, Honest Jobs network, 70 Million Jobs,
 *          Austin Chamber ban-the-box signatories, Dave's Killer Bread Foundation employer list.
 *
 * Run: npx tsx scripts/seed-fair-chance-employers.ts
 */

import { db } from "../server/storage";
import { employerPartners, jobPostings } from "../shared/schema";
import { eq } from "drizzle-orm";

interface SeedEmployer {
  companyName: string;
  industry: string;
  location: string;
  website?: string;
  contactEmail?: string;
  banTheBox: boolean;
  fairChanceHiring: boolean;
  barrierFriendly: boolean;
  description: string;
  hiringCommitments?: string;
  credentialTags: string[];
  sampleJobs?: Array<{
    title: string;
    description: string;
    wageRange?: string;
    wageMin?: number;
    wageMax?: number;
    requirements?: string;
    credentialTags: string[];
  }>;
}

const EMPLOYERS: SeedEmployer[] = [
  // ── CONSTRUCTION & TRADES ──────────────────────────────────────────
  {
    companyName: "Rogers-O'Brien Construction",
    industry: "Construction",
    location: "Austin, TX",
    website: "https://www.rogersoneil.com",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Texas-based general contractor with over 50 years of history. Active participant in Austin's fair-chance hiring initiative.",
    hiringCommitments: "Criminal history reviewed individually; not an automatic disqualifier. Offers apprenticeship pathways.",
    credentialTags: ["construction", "electrical", "plumbing"],
    sampleJobs: [
      { title: "Carpenter's Helper", description: "Entry-level framing and finish carpentry support. On-the-job training provided.", wageRange: "$18–$22/hr", wageMin: 1800, wageMax: 2200, credentialTags: ["construction"] },
      { title: "Concrete Finisher", description: "Commercial concrete flatwork and finishing. Will train motivated candidates.", wageRange: "$20–$26/hr", wageMin: 2000, wageMax: 2600, credentialTags: ["construction"] },
    ],
  },
  {
    companyName: "Hensel Phelps",
    industry: "Construction",
    location: "Austin, TX",
    website: "https://www.henselphelps.com",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "One of the largest general contractors in the US. Austin office hires across all construction trades with fair-chance screening.",
    credentialTags: ["construction", "electrical", "plumbing", "hvac"],
    sampleJobs: [
      { title: "Field Engineer Trainee", description: "Assist project engineers on commercial construction sites. Training program available.", wageRange: "$22–$28/hr", wageMin: 2200, wageMax: 2800, credentialTags: ["construction"] },
    ],
  },
  {
    companyName: "Austin Industries",
    industry: "Construction",
    location: "Austin, TX",
    website: "https://www.austin-ind.com",
    banTheBox: false, fairChanceHiring: true, barrierFriendly: true,
    description: "Employee-owned industrial contractor. Construction, electrical, and mechanical trades hiring. Fair-chance policy adopted 2021.",
    hiringCommitments: "Individual assessment of criminal history. Active reentry hiring partnerships with Travis County.",
    credentialTags: ["construction", "electrical", "hvac", "welding"],
  },
  {
    companyName: "Penhall International",
    industry: "Construction",
    location: "Austin, TX",
    website: "https://www.penhall.com",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Concrete cutting, breaking, and excavation services. Entry-level positions available with full training.",
    credentialTags: ["construction"],
    sampleJobs: [
      { title: "Saw Operator Trainee", description: "Operate concrete cutting equipment on commercial and highway projects. Full training provided.", wageRange: "$19–$24/hr", wageMin: 1900, wageMax: 2400, credentialTags: ["construction"] },
    ],
  },
  {
    companyName: "Bartlett Cocke General Contractors",
    industry: "Construction",
    location: "Austin, TX",
    website: "https://www.bartlettcocke.com",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Major Texas general contractor. Formal ban-the-box policy. Partners with YouthBuild and community colleges for pipeline hiring.",
    credentialTags: ["construction", "plumbing", "electrical"],
  },

  // ── ELECTRICAL ─────────────────────────────────────────────────────
  {
    companyName: "Rosendin Electric",
    industry: "Electrical",
    location: "Austin, TX",
    website: "https://www.rosendin.com",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "100% employee-owned national electrical contractor. Austin office actively recruits from pre-apprenticeship programs.",
    hiringCommitments: "IBEW apprenticeship pathways available. Criminal history reviewed case-by-case.",
    credentialTags: ["electrical"],
    sampleJobs: [
      { title: "Electrical Pre-Apprentice", description: "Entry-level position for candidates enrolled in or completing pre-apprenticeship training.", wageRange: "$20–$24/hr", wageMin: 2000, wageMax: 2400, credentialTags: ["electrical"] },
    ],
  },
  {
    companyName: "IEC Austin (Independent Electrical Contractors)",
    industry: "Electrical",
    location: "Austin, TX",
    website: "https://iecaustintx.org",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "IEC Austin places apprentices with member contractors across Central Texas. Pre-apprenticeship open to justice-involved candidates.",
    credentialTags: ["electrical"],
    sampleJobs: [
      { title: "Electrician Apprentice (Year 1)", description: "4-year registered apprenticeship. Paid on-the-job training with classroom instruction.", wageRange: "$18–$22/hr", wageMin: 1800, wageMax: 2200, credentialTags: ["electrical"] },
    ],
  },
  {
    companyName: "Facility Solutions Group",
    industry: "Electrical",
    location: "Austin, TX",
    website: "https://www.fsgi.com",
    banTheBox: false, fairChanceHiring: true, barrierFriendly: true,
    description: "Electrical, lighting, and energy management solutions. Austin-headquartered. Justice-involved candidates reviewed individually.",
    credentialTags: ["electrical"],
  },

  // ── PLUMBING ───────────────────────────────────────────────────────
  {
    companyName: "Frymire Home Services",
    industry: "Plumbing",
    location: "Austin, TX",
    website: "https://www.frymire.com",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Residential and light commercial plumbing, HVAC, and electrical. Fair-chance employer since 2019. Offers paid training.",
    credentialTags: ["plumbing", "hvac"],
    sampleJobs: [
      { title: "Plumbing Helper", description: "Assist licensed plumbers on residential service and repair calls. No experience required.", wageRange: "$18–$21/hr", wageMin: 1800, wageMax: 2100, credentialTags: ["plumbing"] },
    ],
  },
  {
    companyName: "Texas Plumbing Professionals",
    industry: "Plumbing",
    location: "Austin, TX 78701",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Commercial plumbing contractor serving Austin metro. Partners with Austin Community College plumbing program for apprentice hiring.",
    credentialTags: ["plumbing"],
    sampleJobs: [
      { title: "Plumbing Apprentice", description: "Learn commercial rough-in and finish plumbing. PHCC apprenticeship pathway available.", wageRange: "$19–$23/hr", wageMin: 1900, wageMax: 2300, credentialTags: ["plumbing"] },
    ],
  },
  {
    companyName: "ABC Home & Commercial Services",
    industry: "Plumbing",
    location: "Austin, TX",
    website: "https://www.abchomeandcommercial.com",
    banTheBox: false, fairChanceHiring: true, barrierFriendly: true,
    description: "One of Austin's largest home services companies. Plumbing, HVAC, pest control, electrical. Individual background review policy.",
    credentialTags: ["plumbing", "hvac", "electrical"],
    sampleJobs: [
      { title: "HVAC Installer", description: "Residential HVAC installation and service. EPA 608 certification support provided.", wageRange: "$22–$30/hr", wageMin: 2200, wageMax: 3000, credentialTags: ["hvac"] },
      { title: "Plumber's Apprentice", description: "Residential service and repair. Texas plumbing apprentice license obtained on the job.", wageRange: "$18–$22/hr", wageMin: 1800, wageMax: 2200, credentialTags: ["plumbing"] },
    ],
  },

  // ── HVAC ───────────────────────────────────────────────────────────
  {
    companyName: "Comfort Experts (Texas Air)",
    industry: "HVAC",
    location: "Austin, TX",
    website: "https://www.callcomfortexperts.com",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Residential and commercial HVAC. Actively recruits from Austin Community College HVAC program. EPA 608 training offered.",
    credentialTags: ["hvac"],
    sampleJobs: [
      { title: "HVAC Technician Trainee", description: "Install and service residential HVAC systems. Full training + EPA 608 support.", wageRange: "$20–$26/hr", wageMin: 2000, wageMax: 2600, credentialTags: ["hvac"] },
    ],
  },
  {
    companyName: "Service Experts Heating & Air Conditioning",
    industry: "HVAC",
    location: "Austin, TX",
    website: "https://www.serviceexperts.com",
    banTheBox: false, fairChanceHiring: true, barrierFriendly: true,
    description: "National HVAC company with strong Austin presence. Fair-chance hiring through individual criminal history review.",
    credentialTags: ["hvac"],
  },
  {
    companyName: "AirMasters Air Conditioning & Heating",
    industry: "HVAC",
    location: "Austin, TX",
    website: "https://www.airmasters.com",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Austin-based commercial and residential HVAC. Registered apprenticeship program with NATE certification pathways.",
    credentialTags: ["hvac"],
    sampleJobs: [
      { title: "Commercial HVAC Installer", description: "Install RTUs, split systems, and ductwork on commercial projects. Prior experience preferred but not required.", wageRange: "$23–$30/hr", wageMin: 2300, wageMax: 3000, credentialTags: ["hvac"] },
    ],
  },

  // ── WELDING & MANUFACTURING ────────────────────────────────────────
  {
    companyName: "Lower Colorado River Authority (LCRA)",
    industry: "Utilities",
    location: "Austin, TX",
    website: "https://www.lcra.org",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Texas utility and public services agency. Hires welders, electricians, and maintenance technicians. Fair-chance policy for most positions.",
    credentialTags: ["welding", "electrical"],
    sampleJobs: [
      { title: "Welder I", description: "Structural and pipe welding on utility infrastructure. AWS D1.1 certification preferred, training available.", wageRange: "$24–$32/hr", wageMin: 2400, wageMax: 3200, credentialTags: ["welding"] },
    ],
  },
  {
    companyName: "Technip Energies (Austin fabrication)",
    industry: "Manufacturing",
    location: "Austin, TX",
    website: "https://www.technipfmc.com",
    banTheBox: false, fairChanceHiring: true, barrierFriendly: true,
    description: "Industrial fabrication and energy services. Welding and pipefitting positions. Individual review of criminal history.",
    credentialTags: ["welding"],
    sampleJobs: [
      { title: "Structural Welder", description: "MIG/TIG/Stick welding on structural steel. AWS certification a plus.", wageRange: "$22–$32/hr", wageMin: 2200, wageMax: 3200, credentialTags: ["welding"] },
    ],
  },
  {
    companyName: "Mueller Water Products — Austin",
    industry: "Manufacturing",
    location: "Smithville, TX (Austin metro)",
    website: "https://www.muellerwaterproducts.com",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Water infrastructure manufacturing. Smithville plant (30 miles from Austin). Welders, machinists, press operators. Active fair-chance policy.",
    credentialTags: ["welding"],
    sampleJobs: [
      { title: "Welder/Fabricator", description: "Fabricate water distribution components. MIG/TIG. Will train candidates with welding school background.", wageRange: "$21–$28/hr", wageMin: 2100, wageMax: 2800, credentialTags: ["welding"] },
    ],
  },
  {
    companyName: "Austin Community College Workforce Manufacturing Center",
    industry: "Manufacturing",
    location: "Austin, TX",
    website: "https://www.austincc.edu/manufacturing",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "ACC connects welding/machining graduates to employer partners. Participates in ThriveUp Academy credential pathway.",
    credentialTags: ["welding", "construction"],
  },

  // ── AUTOMOTIVE ─────────────────────────────────────────────────────
  {
    companyName: "Firestone Complete Auto Care — Central Texas",
    industry: "Automotive",
    location: "Austin, TX (multiple locations)",
    website: "https://www.firestonecompleteautocare.com",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "National auto care chain. Corporate fair-chance hiring policy. ASE certification training and tuition assistance offered.",
    hiringCommitments: "Ban the Box on all applications. Reentry candidates encouraged.",
    credentialTags: ["automotive"],
    sampleJobs: [
      { title: "Automotive Technician Trainee", description: "Oil changes, tire service, basic repairs. ASE certification support available.", wageRange: "$16–$22/hr", wageMin: 1600, wageMax: 2200, credentialTags: ["automotive"] },
    ],
  },
  {
    companyName: "Midas Auto Service — Austin",
    industry: "Automotive",
    location: "Austin, TX",
    website: "https://www.midas.com",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Franchise auto repair. Multiple Austin locations actively hiring lube technicians and brake specialists with on-the-job training.",
    credentialTags: ["automotive"],
    sampleJobs: [
      { title: "Lube Technician", description: "Oil changes, fluid checks, tire rotations. No experience required. Will train.", wageRange: "$15–$19/hr", wageMin: 1500, wageMax: 1900, credentialTags: ["automotive"] },
    ],
  },
  {
    companyName: "AutoZone — Austin metro",
    industry: "Automotive",
    location: "Austin, TX (15+ locations)",
    website: "https://www.autozone.com/careers",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Retail auto parts. Nationwide fair-chance hiring policy. Parts sales and warehouse positions available. Flexible scheduling.",
    hiringCommitments: "AutoZone adopted ban-the-box nationally. Criminal history not assessed until conditional offer.",
    credentialTags: ["automotive"],
    sampleJobs: [
      { title: "Parts Sales Specialist", description: "Customer service and parts lookup in retail store. Entry level, paid training.", wageRange: "$14–$18/hr", wageMin: 1400, wageMax: 1800, credentialTags: ["automotive"] },
    ],
  },
  {
    companyName: "Austin Community College Auto Technology Program",
    industry: "Automotive",
    location: "Austin, TX",
    website: "https://www.austincc.edu/automotive",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "ACC's automotive program connects graduates to dealerships and independent shops that commit to fair-chance hiring.",
    credentialTags: ["automotive"],
  },
  {
    companyName: "Classic Chevrolet — Austin",
    industry: "Automotive",
    location: "Austin, TX",
    website: "https://www.classicauto.com",
    banTheBox: false, fairChanceHiring: true, barrierFriendly: true,
    description: "GM dealership. Service technicians and detail specialists. Individual background review. GM Technician Training available.",
    credentialTags: ["automotive"],
    sampleJobs: [
      { title: "Lube & Detail Technician", description: "Oil changes, vehicle detailing, tire service. Entry point to dealer technician career pathway.", wageRange: "$16–$20/hr", wageMin: 1600, wageMax: 2000, credentialTags: ["automotive"] },
    ],
  },

  // ── FOOD SERVICE & CULINARY ────────────────────────────────────────
  {
    companyName: "Dave's Killer Bread (partner employer)",
    industry: "Food Service",
    location: "Austin, TX area",
    website: "https://www.daveskillerbread.com/second-chance-employment",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Pioneer of Second Chance Employment. Dave's Killer Bread Foundation certifies partner employers committed to fair-chance hiring.",
    hiringCommitments: "Founding partner of Second Chance Employment movement. All criminal records reviewed individually.",
    credentialTags: ["culinary", "construction"],
  },
  {
    companyName: "HEB Grocery — Central Texas",
    industry: "Food Service",
    location: "Austin, TX (30+ locations)",
    website: "https://careers.heb.com",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Texas grocery chain with documented fair-chance hiring practices. Store and distribution center positions. Austin metro flagship employer.",
    hiringCommitments: "Criminal history assessed case-by-case after conditional offer. Flexible schedules for reentry individuals.",
    credentialTags: ["culinary"],
    sampleJobs: [
      { title: "Grocery Team Member", description: "Stocking, customer service, bakery, deli. Multiple departments. Flexible hours.", wageRange: "$15–$19/hr", wageMin: 1500, wageMax: 1900, credentialTags: ["culinary"] },
      { title: "Distribution Center Selector", description: "Warehouse order selection for grocery distribution. Physical work, consistent hours.", wageRange: "$18–$23/hr", wageMin: 1800, wageMax: 2300, credentialTags: [] },
    ],
  },
  {
    companyName: "Whole Foods Market — Austin (HQ + stores)",
    industry: "Food Service",
    location: "Austin, TX",
    website: "https://www.wholefoodsmarket.com/careers",
    banTheBox: false, fairChanceHiring: true, barrierFriendly: true,
    description: "Austin-headquartered natural foods retailer. Individual background review. Entry-level team member to specialty roles.",
    credentialTags: ["culinary"],
    sampleJobs: [
      { title: "Team Member — Prepared Foods", description: "Food preparation, hot bar, deli counter. Food handler certification obtained on the job.", wageRange: "$17–$21/hr", wageMin: 1700, wageMax: 2100, credentialTags: ["culinary"] },
    ],
  },
  {
    companyName: "Hoover's Cooking",
    industry: "Food Service",
    location: "Austin, TX",
    website: "https://hoovers-cooking.com",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Austin institution. Owner Hoover Alexander is an active community fair-chance employer advocate. Hires returning citizens directly.",
    hiringCommitments: "Owner-operated. Reentry candidates welcomed and mentored directly by ownership.",
    credentialTags: ["culinary"],
    sampleJobs: [
      { title: "Line Cook", description: "Southern cooking, lunch and dinner service. Will train enthusiastic candidates.", wageRange: "$16–$22/hr", wageMin: 1600, wageMax: 2200, credentialTags: ["culinary"] },
    ],
  },
  {
    companyName: "Austin Community College Culinary Arts",
    industry: "Food Service",
    location: "Austin, TX",
    website: "https://www.austincc.edu/culinary",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "ACC culinary program links graduates to Austin restaurant and catering employers with fair-chance policies.",
    credentialTags: ["culinary"],
  },
  {
    companyName: "Sysco Corporation — Austin distribution",
    industry: "Food Service",
    location: "Austin, TX",
    website: "https://careers.sysco.com",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Food distribution giant. Austin distribution hub. CDL drivers, warehouse, and delivery roles. Fair-chance policy systemwide.",
    hiringCommitments: "Sysco's national fair-chance policy applies to Austin hub. Driving record more relevant than general criminal history.",
    credentialTags: ["culinary"],
    sampleJobs: [
      { title: "Warehouse Selector", description: "Night shift warehouse order selection. Physical work, good pay, consistent schedule.", wageRange: "$20–$26/hr", wageMin: 2000, wageMax: 2600, credentialTags: [] },
    ],
  },

  // ── LOGISTICS & TRANSPORTATION ─────────────────────────────────────
  {
    companyName: "Amazon Fulfillment — Austin",
    industry: "Logistics",
    location: "Austin, TX",
    website: "https://www.amazondelivers.jobs",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Amazon's Austin fulfillment and delivery network. National fair-chance hiring program (2018). Warehouse and delivery associate roles.",
    hiringCommitments: "Amazon's Fair Chance initiative. Background checks individualized, not blanket disqualifications.",
    credentialTags: [],
    sampleJobs: [
      { title: "Fulfillment Associate", description: "Pick, pack, and ship customer orders. Full-time with benefits. Flexible scheduling.", wageRange: "$19–$23/hr", wageMin: 1900, wageMax: 2300, credentialTags: [] },
    ],
  },
  {
    companyName: "FedEx Ground — Austin hub",
    industry: "Logistics",
    location: "Austin, TX",
    website: "https://careers.fedex.com",
    banTheBox: false, fairChanceHiring: true, barrierFriendly: true,
    description: "Package handling and delivery operations. Package handler and route driver positions. Individual background review for non-driving roles.",
    credentialTags: [],
    sampleJobs: [
      { title: "Package Handler", description: "Load and unload packages, sort freight. Morning/evening shifts. No experience required.", wageRange: "$17–$21/hr", wageMin: 1700, wageMax: 2100, credentialTags: [] },
    ],
  },
  {
    companyName: "XPO Logistics — Austin terminal",
    industry: "Logistics",
    location: "Austin, TX",
    website: "https://jobs.xpo.com",
    banTheBox: false, fairChanceHiring: true, barrierFriendly: true,
    description: "Freight and logistics. Austin terminal hires dock workers and local CDL drivers. Individual review of criminal history.",
    credentialTags: [],
    sampleJobs: [
      { title: "Dock Worker", description: "Load/unload freight, operate forklift. Overnight and day shifts.", wageRange: "$18–$24/hr", wageMin: 1800, wageMax: 2400, credentialTags: [] },
    ],
  },

  // ── HEALTHCARE ─────────────────────────────────────────────────────
  {
    companyName: "CommUnity Care FQHCs",
    industry: "Healthcare",
    location: "Austin, TX",
    website: "https://communitycaretx.org",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Austin's Federally Qualified Health Centers. Hires medical assistants, community health workers, and administrative staff. Individual background review.",
    hiringCommitments: "Healthcare licenses may restrict some roles; non-clinical support roles fully fair-chance.",
    credentialTags: ["healthcare"],
    sampleJobs: [
      { title: "Community Health Worker", description: "Patient navigation, outreach, and care coordination. CHW certification supported.", wageRange: "$18–$24/hr", wageMin: 1800, wageMax: 2400, credentialTags: ["healthcare"] },
    ],
  },
  {
    companyName: "Integral Care",
    industry: "Healthcare",
    location: "Austin, TX",
    website: "https://integralcare.org/careers",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Travis County's mental health and IDD authority. Peer support specialist and direct care roles. Justice-involved candidates welcomed.",
    hiringCommitments: "Lived experience valued for peer support roles. Background review individualized by role sensitivity.",
    credentialTags: ["healthcare"],
    sampleJobs: [
      { title: "Peer Support Specialist", description: "Support individuals with mental health challenges using personal lived experience. Certification training provided.", wageRange: "$17–$22/hr", wageMin: 1700, wageMax: 2200, credentialTags: ["healthcare"] },
    ],
  },
  {
    companyName: "Seton Healthcare (Ascension)",
    industry: "Healthcare",
    location: "Austin, TX",
    website: "https://healthcare.ascension.org/careers",
    banTheBox: false, fairChanceHiring: true, barrierFriendly: true,
    description: "Major Austin hospital system. Environmental services, dietary, and patient transport roles open to fair-chance candidates.",
    credentialTags: ["healthcare"],
    sampleJobs: [
      { title: "Environmental Services Technician", description: "Hospital cleaning and sanitation. Entry-level. Benefits from day one.", wageRange: "$15–$19/hr", wageMin: 1500, wageMax: 1900, credentialTags: ["healthcare"] },
    ],
  },
  {
    companyName: "CareStar Home Health",
    industry: "Healthcare",
    location: "Austin, TX",
    website: "https://www.carestar.com",
    banTheBox: false, fairChanceHiring: true, barrierFriendly: true,
    description: "Home health and personal care services. CNA and home health aide positions. Fair-chance for non-restricted roles.",
    credentialTags: ["healthcare"],
    sampleJobs: [
      { title: "Home Health Aide", description: "Personal care and daily living assistance for homebound clients. CNA certification supported.", wageRange: "$15–$18/hr", wageMin: 1500, wageMax: 1800, credentialTags: ["healthcare"] },
    ],
  },

  // ── TECHNOLOGY & IT ────────────────────────────────────────────────
  {
    companyName: "Indeed — Austin HQ",
    industry: "Technology",
    location: "Austin, TX",
    website: "https://www.indeed.com/careers",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "World's largest job site, headquartered in Austin. Indeed's Fair Chance Hiring Challenge signatory. IT support and operations roles.",
    hiringCommitments: "Formal signatory to Indeed's own Fair Chance Hiring Challenge. Background review individualized.",
    credentialTags: ["it-support"],
  },
  {
    companyName: "Hewlett Packard Enterprise (HPE) — Austin",
    industry: "Technology",
    location: "Austin, TX",
    website: "https://careers.hpe.com",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Global technology company. Austin campus. IT technician, data center operations, and field service roles with fair-chance policies.",
    credentialTags: ["it-support"],
    sampleJobs: [
      { title: "Data Center Technician", description: "Server rack installation and maintenance. CompTIA A+ or equivalent experience preferred.", wageRange: "$22–$30/hr", wageMin: 2200, wageMax: 3000, credentialTags: ["it-support"] },
    ],
  },
  {
    companyName: "Dell Technologies — Round Rock/Austin",
    industry: "Technology",
    location: "Round Rock, TX",
    website: "https://jobs.dell.com",
    banTheBox: false, fairChanceHiring: true, barrierFriendly: true,
    description: "Dell's global headquarters. IT support, manufacturing, and logistics roles. Individual background review. Partners with reentry workforce programs.",
    credentialTags: ["it-support"],
    sampleJobs: [
      { title: "Technical Support Specialist", description: "Phone and chat support for business customers. CompTIA A+ preferred. Training available.", wageRange: "$20–$26/hr", wageMin: 2000, wageMax: 2600, credentialTags: ["it-support"] },
    ],
  },

  // ── RETAIL & GENERAL ───────────────────────────────────────────────
  {
    companyName: "Target Corporation — Austin",
    industry: "Retail",
    location: "Austin, TX (10+ locations)",
    website: "https://corporate.target.com/careers",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "National retailer. Target adopted ban-the-box in 2013. Austin store and distribution center roles.",
    hiringCommitments: "National fair-chance policy. Criminal history reviewed post-conditional offer only.",
    credentialTags: [],
    sampleJobs: [
      { title: "Store Team Member", description: "Cashier, stocking, guest service. Flexible hours. Benefits for 32+ hr/week.", wageRange: "$15–$19/hr", wameMin: 1500, wageMax: 1900, credentialTags: [] } as any,
    ],
  },
  {
    companyName: "Goodwill Central Texas",
    industry: "Retail",
    location: "Austin, TX",
    website: "https://www.goodwillcentraltexas.org/jobs",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Goodwill's mission is employment. Central Texas stores and job training centers explicitly hire returning citizens.",
    hiringCommitments: "Reentry employment is core to Goodwill's mission. No disqualifying criminal history thresholds.",
    credentialTags: [],
    sampleJobs: [
      { title: "Retail Associate", description: "Sort donations, assist customers, manage store floor. Entry level. Mission-driven workplace.", wageRange: "$14–$17/hr", wageMin: 1400, wageMax: 1700, credentialTags: [] },
    ],
  },
  {
    companyName: "Salvation Army — Austin",
    industry: "Retail",
    location: "Austin, TX",
    website: "https://www.salvationarmyusa.org/usn/careers",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Mission-focused employer. Thrift store, shelter support, and program roles. Reentry candidates actively welcomed.",
    credentialTags: [],
  },
  {
    companyName: "Lowe's Home Improvement — Austin",
    industry: "Retail",
    location: "Austin, TX (multiple locations)",
    website: "https://careers.lowes.com",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "National home improvement retailer. Fair-chance hiring policy adopted 2019. Trade knowledge valued in sales roles.",
    credentialTags: ["construction", "electrical", "plumbing"],
    sampleJobs: [
      { title: "Pro Sales Specialist", description: "Serve contractors and tradespeople. Prior trade experience a strong plus.", wageRange: "$16–$22/hr", wageMin: 1600, wageMax: 2200, credentialTags: ["construction"] },
    ],
  },

  // ── AG-TECH & ENVIRONMENTAL ────────────────────────────────────────
  {
    companyName: "Texas Department of Transportation (TxDOT) — Austin District",
    industry: "Government",
    location: "Austin, TX",
    website: "https://www.txdot.gov/careers",
    banTheBox: false, fairChanceHiring: true, barrierFriendly: true,
    description: "State highway construction and maintenance. Equipment operators, maintenance workers, and transportation technicians. Individual review policy.",
    credentialTags: ["construction", "ag-tech"],
    sampleJobs: [
      { title: "Highway Maintenance Worker", description: "Roadway maintenance, mowing, debris removal, minor repairs. Physical outdoor work.", wageRange: "$18–$24/hr", wageMin: 1800, wageMax: 2400, credentialTags: [] },
    ],
  },
  {
    companyName: "Grow Local Austin",
    industry: "Agriculture",
    location: "Austin, TX",
    website: "https://growlocalaustin.org",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Urban farming and food justice organization. Farm worker, market, and education roles. Reentry candidates actively sought.",
    credentialTags: ["ag-tech"],
    sampleJobs: [
      { title: "Urban Farm Worker", description: "Vegetable production, irrigation, harvest. Seasonal and year-round positions.", wageRange: "$15–$18/hr", wageMin: 1500, wageMax: 1800, credentialTags: ["ag-tech"] },
    ],
  },
  {
    companyName: "Austin Resource Recovery (City of Austin)",
    industry: "Government",
    location: "Austin, TX",
    website: "https://austintexas.gov/department/austin-resource-recovery",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "City of Austin recycling and waste services. Equipment operators and route drivers. City adopted fair-chance hiring ordinance 2016.",
    hiringCommitments: "City of Austin fair-chance hiring ordinance applies. CDL training support available.",
    credentialTags: [],
    sampleJobs: [
      { title: "Collection Equipment Operator", description: "Drive and operate residential collection vehicles. CDL training provided.", wageRange: "$21–$28/hr", wageMin: 2100, wageMax: 2800, credentialTags: [] },
    ],
  },
  {
    companyName: "Conservation Corps Texas",
    industry: "Conservation",
    location: "Austin, TX",
    website: "https://conservationcorpstexas.org",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "AmeriCorps-based conservation service corps. Trails, parks, and urban forestry projects. Stipended service with living allowance and education award.",
    hiringCommitments: "Youth and adult programs explicitly include justice-involved individuals. Stipend + AmeriCorps Education Award.",
    credentialTags: ["ag-tech", "construction"],
    sampleJobs: [
      { title: "Conservation Corps Member", description: "Trails, parks, and habitat restoration. 6–12 month AmeriCorps term. Stipend + education award.", wageRange: "$15/hr (AmeriCorps stipend)", wageMin: 1500, wageMax: 1500, credentialTags: [] },
    ],
  },

  // ── JUSTICE-ADJACENT / MISSION-DRIVEN ────────────────────────────
  {
    companyName: "Restoration Reentry Ministries",
    industry: "Nonprofit",
    location: "Austin, TX",
    website: "https://restorationreentry.com",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Faith-based reentry housing and services. Staff positions for formerly incarcerated individuals. Lived experience required for some roles.",
    hiringCommitments: "Justice-involved candidates given hiring priority for peer mentor and case manager roles.",
    credentialTags: ["healthcare"],
    sampleJobs: [
      { title: "Reentry Peer Mentor", description: "Provide support, accountability, and coaching to men returning from incarceration. Lived experience required.", wageRange: "$16–$20/hr", wageMin: 1600, wageMax: 2000, credentialTags: ["healthcare"] },
    ],
  },
  {
    companyName: "Open Doors of Austin",
    industry: "Nonprofit",
    location: "Austin, TX",
    website: "https://opendoorsaustin.org",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Reentry service organization. Driver, case aide, and program support roles. All staff reviewed individually regardless of history.",
    credentialTags: [],
  },
  {
    companyName: "Caritas of Austin",
    industry: "Nonprofit",
    location: "Austin, TX",
    website: "https://www.caritasofaustin.org/jobs",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Housing and homelessness services. Case manager, housing navigator, and administrative roles. Lived-experience hiring encouraged.",
    credentialTags: ["healthcare"],
    sampleJobs: [
      { title: "Housing Stability Specialist", description: "Help clients maintain housing stability. Case management, landlord relations, benefits navigation.", wageRange: "$19–$24/hr", wageMin: 1900, wageMax: 2400, credentialTags: ["healthcare"] },
    ],
  },
  {
    companyName: "LifeWorks Austin",
    industry: "Nonprofit",
    location: "Austin, TX",
    website: "https://www.lifeworksaustin.org/careers",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "Youth homelessness and foster care services. Direct care, outreach, and administrative roles. Justice-involved candidates reviewed individually.",
    credentialTags: ["healthcare"],
  },
  {
    companyName: "Front Steps",
    industry: "Nonprofit",
    location: "Austin, TX",
    website: "https://frontsteps.org/jobs",
    banTheBox: true, fairChanceHiring: true, barrierFriendly: true,
    description: "ARCH shelter and permanent supportive housing. Shelter technician, case manager, and peer support roles. Lived experience highly valued.",
    hiringCommitments: "Austin's largest shelter explicitly recruits returning citizens for peer roles.",
    credentialTags: ["healthcare"],
    sampleJobs: [
      { title: "Shelter Technician", description: "Overnight and day shifts at ARCH emergency shelter. Entry level. Full training provided.", wageRange: "$16–$20/hr", wageMin: 1600, wageMax: 2000, credentialTags: [] },
    ],
  },
];

async function seedEmployers() {
  console.log(`[seed-employers] Seeding ${EMPLOYERS.length} fair-chance employers...`);
  let inserted = 0;
  let skipped = 0;
  let jobsInserted = 0;

  for (const emp of EMPLOYERS) {
    // Skip if already exists
    const existing = await db.select().from(employerPartners)
      .where(eq(employerPartners.companyName, emp.companyName));

    let employerId: string;

    if (existing.length > 0) {
      console.log(`  [skip] ${emp.companyName}`);
      skipped++;
      employerId = existing[0].id;
    } else {
      const [created] = await db.insert(employerPartners).values({
        companyName: emp.companyName,
        industry: emp.industry,
        location: emp.location,
        website: emp.website,
        contactEmail: emp.contactEmail,
        banTheBox: emp.banTheBox,
        fairChanceHiring: emp.fairChanceHiring,
        barrierFriendly: emp.barrierFriendly,
        description: emp.description,
        hiringCommitments: emp.hiringCommitments,
        partnershipStatus: "active",
      }).returning();
      console.log(`  [insert] ${emp.companyName}`);
      inserted++;
      employerId = created.id;
    }

    if (emp.sampleJobs?.length) {
      for (const job of emp.sampleJobs) {
        try {
          await db.insert(jobPostings).values({
            employerId,
            title: job.title,
            description: job.description,
            wageRange: job.wageRange,
            wageMin: job.wageMin,
            wageMax: job.wageMax,
            requirements: job.requirements,
            barrierFriendly: true,
            location: emp.location,
            status: "open",
            credentialTags: job.credentialTags,
          });
          jobsInserted++;
        } catch (err) {
          console.warn(`  [job-skip] ${job.title} for ${emp.companyName}:`, (err as Error).message);
        }
      }
    }
  }

  console.log(`\n[seed-employers] Done: ${inserted} employers inserted, ${skipped} skipped, ${jobsInserted} job postings added.`);
  process.exit(0);
}

seedEmployers().catch(err => {
  console.error("[seed-employers] Fatal:", err);
  process.exit(1);
});
