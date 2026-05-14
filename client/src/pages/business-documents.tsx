import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Building2, FileText, Shield, Users, Globe, MapPin, Phone, Mail,
  Download, Printer, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Briefcase, GraduationCap, Heart, Target, Award, Scale, Landmark,
  DollarSign, Calendar, ExternalLink, Copy, Star,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EntityDocument {
  name: string;
  status: "complete" | "draft" | "needed";
  description: string;
  content?: string;
}

interface BusinessEntity {
  id: string;
  name: string;
  legalName: string;
  type: string;
  ein: string;
  stateId?: string;
  status: string;
  formation: string;
  state: string;
  county: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  responsibleParty: string;
  principalActivity: string;
  description: string;
  color: string;
  icon: typeof Building2;
  documents: EntityDocument[];
  keyFacts: { label: string; value: string }[];
}

const ENTITIES: BusinessEntity[] = [
  {
    id: "collaborative-advocate",
    name: "The Collaborative Advocate Foundation",
    legalName: "THE COLLABORATIVE ADVOCATE FOUNDATION",
    type: "501(c)(3) Nonprofit",
    ein: "41-3618503",
    status: "Active",
    formation: "Austin, TX",
    state: "TX",
    county: "Travis",
    address: "17912 Stefano Drive, Pflugerville, TX 78660",
    phone: "254-319-8460",
    email: "president@thecollaborativeadvocate.org",
    website: "https://thrivingcommunitiesforall.com",
    responsibleParty: "Dr. Terry Flood, President",
    principalActivity: "Workforce Development, Community Health, Veteran Services",
    description: "Veteran-founded, Black-led IRS-determined 501(c)(3) nonprofit (Letter 947, effective January 14, 2026; EIN 41-3618503) serving as the organizational backbone for the ThriveUp Academy ACOS ecosystem. Delivers workforce development, veteran transition services, community health programs, and youth education through an interdependent platform architecture. SAM.gov Active (UEI KDDVD1FGLW35; CAGE 209N1) — eligible to receive federal awards directly. Grant execution lead for WIOA, SSG Fox VA, St. David's Foundation, TWC, and federal/state workforce programs.",
    color: "border-violet-500",
    icon: Shield,
    keyFacts: [
      { label: "Tax Status", value: "501(c)(3) Tax-Exempt" },
      { label: "Founded By", value: "Dr. Terry Flood" },
      { label: "SAM.gov", value: "Registered (UEI Active)" },
      { label: "DUNS", value: "Registered" },
      { label: "Ecosystem", value: "24 Interdependent Platforms" },
      { label: "Service Areas", value: "Austin/Travis County, TX (Primary)" },
      { label: "Populations", value: "Veterans, Youth, Returning Citizens, Families" },
      { label: "Annual Grant Pipeline", value: "$3.55M–$6.25M+" },
    ],
    documents: [
      { name: "Executive Summary", status: "complete", description: "Organizational overview for funders and stakeholders",
        content: `THE COLLABORATIVE ADVOCATE FOUNDATION
Executive Summary

ORGANIZATION OVERVIEW
The Collaborative Advocate Foundation is a 501(c)(3) nonprofit organization headquartered in Austin, Texas. Founded by Dr. Terry Flood, a veteran and community advocate, the organization is veteran-founded and Black-led, delivering workforce development, community health, veteran transition services, and youth education through an innovative 24-platform technology ecosystem.

EIN: 41-3618503
Address: 17912 Stefano Drive, Pflugerville, TX 78660
Phone: 254-319-8460
Email: president@thecollaborativeadvocate.org
Website: thrivingcommunitiesforall.com

MISSION
To empower underserved communities through AI-powered workforce development, culturally responsive health services, and evidence-based programming that creates measurable, sustainable outcomes for veterans, youth, returning citizens, and families.

VISION
A future where every community member — regardless of background, circumstance, or ZIP code — has access to the tools, training, and support needed to thrive economically, physically, and socially.

THE ACOS ECOSYSTEM (24 Platforms)
The Collaborative Advocate Foundation operates through a unique Adaptive Capability Orchestration System (ACOS) — 24 interdependent platforms working as a unified ecosystem:

• ThriveUp Academy — AI-powered workforce development (central hub)
• Mission Transition (M2C) — Military-to-civilian career pipelines
• Emergency Management — Risk intelligence and community safety
• Whole-Person Health — Behavioral health and crisis support
• SafeReport — Mandatory reporter incident management
• ISSS — Integrated Supports for Thriving Youth
• Sankofa Health Network — Black maternal, feminine, and men's health
• Minority Center of Excellence — 656K+ SAM.gov contractor records
• Better Science Lab — Implementation science (CFIR/RE-AIM)
• LifeBridge — Virtual 211 resource navigation
• Perfectly Different — Neurodiversity support
• WholeMind Learning — Pre-K to 12th grade education
• PillScheduler — Medication management
• SafeCogniCare — Cognitive safety assessment
• Ecosystem Nexus — Cross-platform coordination
• Pinnacle Business Conglomerate — Contractor enablement
• LexiBridge — Dialect-aware communication
• Autoimmune Center of Excellence — Chronic disease management
• Video Creator AI — Content production
• Ad Targeting — Community outreach
• Code Canvas — System evaluation
• The Collaborative Advocate — Organizational backbone

KEY DIFFERENTIATORS
1. Interdependent Architecture: All 24 platforms share data, referrals, and outcomes — no siloed services
2. Evidence-Based: CFIR and RE-AIM frameworks built into every platform via Better Science Lab
3. Culturally Responsive: Designed by and for the communities served
4. Veteran-Founded: Lived experience informing program design
5. AI-Powered: Artificial intelligence enhancing (not replacing) human service delivery

GRANT PIPELINE: $3.55M–$6.25M+
• WIOA Formula Grants — $200K–$500K (Active)
• St. David's Foundation — Up to $1M (Active)
• SSG Fox Veterans Foundation — $750K (Active)
• TWC RFA 32026-00162 — Up to $2M (Submitted)
• Rare Impact Fund — $250K–$500K (LOI Submitted)
• PM C2 Transport — Contract Vehicle (In Progress)
• Space Force SkillBridge — $500K–$1.5M (Identified)

CONTACT
Dr. Terry Flood, President
Email: president@thecollaborativeadvocate.org
Phone: 254-319-8460
Cash App: $MRTDFLOOD
PayPal: paypal.me/CollaborativeAdvocate` },
      { name: "Capability Statement", status: "complete", description: "2-page capability overview for government and corporate partners",
        content: `THE COLLABORATIVE ADVOCATE FOUNDATION — CAPABILITY STATEMENT

CORE COMPETENCIES
✓ AI-Powered Workforce Development & Training
✓ Veteran Transition Services (Military-to-Civilian)
✓ Community Health & Behavioral Health Programs
✓ Youth Education & Prevention (Pre-K–12)
✓ Returning Citizen Reentry Support
✓ Community Health Worker (CHW) Training
✓ Evidence-Based Program Implementation (CFIR/RE-AIM)
✓ 24-Platform Technology Ecosystem Management

ORGANIZATION DATA
Legal Name: The Collaborative Advocate Foundation
EIN: 41-3618503
Type: 501(c)(3) Nonprofit
SAM.gov: Registered (UEI Active)
NAICS Codes: 611430, 624190, 621999, 611710
Address: 17912 Stefano Drive, Pflugerville, TX 78660
Phone: 254-319-8460
Email: president@thecollaborativeadvocate.org
Website: thrivingcommunitiesforall.com

DIFFERENTIATORS
• Only ecosystem with 24 interdependent platforms serving workforce, health, education, and veteran needs simultaneously
• Veteran-founded, Black-led organization with lived-experience credibility
• AI-enhanced service delivery across all program areas
• SAM.gov registered with active federal contracting eligibility
• Evidence-based frameworks (CFIR, RE-AIM) embedded in all programs
• Culturally responsive design serving Austin/Travis County communities

PAST PERFORMANCE
• 29+ workforce curriculum modules across 22 subjects
• 50+ career pathways with credential alignment
• 24 platforms operational with real-time health monitoring
• 221+ grant opportunities tracked in discovery engine
• Community Health Worker training pipeline established
• Military-to-civilian transition program active

KEY PERSONNEL
Dr. Terry Flood — President
• Veteran, community advocate, technology innovator
• 20+ years workforce development and community service
• SAM.gov and federal contracting experience

POPULATIONS SERVED
Veterans & Military Families | Youth (Pre-K–12) | Returning Citizens
Single Parents | Seniors | Career Changers | Minority Business Owners
Neurodivergent Individuals | Chronic Disease Populations

SERVICE AREA
Primary: Austin/Travis County, Texas
Secondary: Central Texas Region
Scalable: National (via technology platform)

CONTACT
Dr. Terry Flood | 254-319-8460 | president@thecollaborativeadvocate.org
Cash App: $MRTDFLOOD | PayPal: paypal.me/CollaborativeAdvocate` },
      { name: "Organizational Profile", status: "complete", description: "One-page overview for partnerships and introductions",
        content: `THE COLLABORATIVE ADVOCATE FOUNDATION
Organizational Profile

WHO WE ARE
The Collaborative Advocate Foundation is a 501(c)(3) nonprofit, veteran-founded and Black-led, headquartered in Pflugerville, Texas. Founded by Dr. Terry Flood, we operate a 24-platform Adaptive Capability Orchestration System (ACOS) delivering integrated workforce development, health equity, veteran transition, and youth education services.

WHAT WE DO
• Train and credential the workforce of tomorrow through AI-powered curriculum
• Support veterans transitioning from military to civilian careers
• Deliver culturally responsive community health programming
• Educate youth Pre-K through 12th grade with adaptive technology
• Connect returning citizens to career pathways and support services
• Enable minority and veteran-owned businesses through contracting support

HOW WE'RE DIFFERENT
Our 24 platforms don't operate in silos — they share data, route referrals, and produce unified outcome metrics. When a veteran enters Mission Transition, their health needs route to Whole-Person Health, their family's education needs connect to WholeMind Learning, and their business aspirations link to Minority Center of Excellence. One entry point, full-spectrum support.

BY THE NUMBERS
• 24 Active Technology Platforms
• 29+ Workforce Curriculum Modules
• 50+ Career Pathways
• 22 Academic Subjects
• $3.55M–$6.25M+ Grant Pipeline
• 221+ Grant Opportunities Tracked

EIN: 41-3618503
SAM.gov: Registered (UEI Active)
Address: 17912 Stefano Drive, Pflugerville, TX 78660
Phone: 254-319-8460 | Email: president@thecollaborativeadvocate.org` },
      { name: "Board of Directors / Leadership", status: "draft", description: "Board roster, bios, and governance structure",
        content: `THE COLLABORATIVE ADVOCATE FOUNDATION
Board of Directors & Leadership

PRESIDENT
Dr. Terry Flood
Veteran | Community Advocate | Technology Innovator
Email: president@thecollaborativeadvocate.org | Phone: 254-319-8460

[Additional board members to be added as appointed]

GOVERNANCE STRUCTURE
• Board of Directors (oversight and fiduciary responsibility)
• President (Dr. Terry Flood — day-to-day operations)
• Advisory Board (subject matter experts — see Advisory Board page)
• Program Directors (per-platform leadership)

BOARD MEETING SCHEDULE
[To be established]

BYLAWS
[On file with registered agent]` },
      { name: "501(c)(3) Determination Letter", status: "complete", description: "IRS tax-exempt status determination" },
      { name: "Articles of Incorporation", status: "complete", description: "State filing establishing the nonprofit entity" },
      { name: "Bylaws", status: "draft", description: "Organizational governance rules and procedures" },
      { name: "Conflict of Interest Policy", status: "needed", description: "Required for grant compliance and board governance" },
      { name: "Non-Discrimination Policy", status: "needed", description: "Required for federal and state grant eligibility" },
      { name: "Financial Statements", status: "needed", description: "Annual financial reports (990, audit, budget)" },
      { name: "SAM.gov Registration", status: "complete", description: "System for Award Management — federal contracting eligibility" },
      { name: "Insurance Certificate (COI)", status: "needed", description: "General liability and D&O insurance documentation" },
    ],
  },
  {
    id: "cip-llc",
    name: "Collaboration & Implementation Professionals LLC",
    legalName: "COLLABORATION AND IMPLEMENTATION PROFESSIONALS LLC",
    type: "For-Profit LLC",
    ein: "41-4996540",
    stateId: "806497375",
    status: "Active",
    formation: "March 17, 2026",
    state: "TX",
    county: "Travis",
    address: "17912 Stefano Drive, Pflugerville, TX 78660",
    phone: "254-319-8460",
    email: "president@thecollaborativeadvocate.org",
    website: "https://thrivingcommunitiesforall.com",
    responsibleParty: "Dr. Terry Flood",
    principalActivity: "Consulting, Implementation Science, Training",
    description: "For-profit consulting and implementation services firm providing workforce development consulting, implementation science methodology (CFIR/RE-AIM), organizational capacity building, and technology platform consulting. Serves as the revenue-generating arm offering paid consulting, training contracts, and platform licensing to organizations, government agencies, and corporate partners seeking to implement evidence-based community programs.",
    color: "border-blue-500",
    icon: Briefcase,
    keyFacts: [
      { label: "Entity Type", value: "Single Member LLC (Texas)" },
      { label: "State ID", value: "806497375" },
      { label: "Formed", value: "March 17, 2026" },
      { label: "Principal", value: "Dr. Terry Flood" },
      { label: "Services", value: "Consulting, Training, Platform Licensing" },
      { label: "Methodology", value: "CFIR, RE-AIM, MAP-GAP, RPLICE" },
      { label: "Service Area", value: "National" },
      { label: "Relationship", value: "Revenue arm supporting nonprofit mission" },
    ],
    documents: [
      { name: "Executive Summary", status: "complete", description: "Company overview for clients and partners",
        content: `COLLABORATION AND IMPLEMENTATION PROFESSIONALS LLC
Executive Summary

COMPANY OVERVIEW
Collaboration and Implementation Professionals LLC (CIP) is a Texas-based consulting firm specializing in implementation science, workforce development consulting, and technology-enabled program delivery. Founded by Dr. Terry Flood, CIP provides the for-profit consulting and revenue-generating services that complement the mission-driven work of The Collaborative Advocate Foundation.

EIN: 41-4996540
State ID: 806497375
Type: Single Member LLC (Texas)
Formed: March 17, 2026
Address: 17912 Stefano Drive, Pflugerville, TX 78660
Phone: 254-319-8460
Email: president@thecollaborativeadvocate.org

SERVICES OFFERED

1. Implementation Science Consulting
   • CFIR (Consolidated Framework for Implementation Research) assessments
   • RE-AIM (Reach, Effectiveness, Adoption, Implementation, Maintenance) evaluations
   • MAP-GAP continuous quality improvement methodology
   • RPLICE Decision Framework deployment
   • Fidelity measurement and program evaluation

2. Workforce Development Consulting
   • Curriculum design and alignment (WIOA, TWC, CTE standards)
   • Credential program development
   • Employer partnership facilitation
   • Career pathway mapping and design
   • Workforce outcome measurement systems

3. Technology Platform Consulting
   • Platform ecosystem architecture (ACOS methodology)
   • Multi-platform integration strategy
   • AI-enhanced service delivery design
   • Data flow and outcome tracking system design
   • White-label platform customization

4. Training & Professional Development
   • Community Health Worker (CHW) training programs
   • Evidence-based practice training
   • Leadership development programs
   • Peer mentor training and certification
   • Cultural responsiveness training

5. Government Contracting Support
   • Grant narrative development
   • SAM.gov and federal contracting readiness
   • Compliance and reporting systems
   • Proposal development and review

TARGET CLIENTS
• Government agencies (federal, state, local)
• Nonprofit organizations seeking evidence-based program implementation
• Healthcare systems and community health organizations
• Workforce development boards and training providers
• Educational institutions (K-12 and higher education)
• Corporate social responsibility programs

COMPETITIVE ADVANTAGES
• Proven 24-platform ecosystem demonstrating scalable architecture
• Evidence-based methodologies (CFIR, RE-AIM) integrated into all engagements
• Veteran-founded with lived-experience perspective
• AI-enhanced consulting accelerating client outcomes
• Existing relationships with Texas workforce and health agencies

CONTACT
Dr. Terry Flood | 254-319-8460 | president@thecollaborativeadvocate.org
Cash App: $MRTDFLOOD | PayPal: paypal.me/CollaborativeAdvocate` },
      { name: "Capability Statement", status: "complete", description: "2-page capability overview for government and corporate clients",
        content: `COLLABORATION AND IMPLEMENTATION PROFESSIONALS LLC — CAPABILITY STATEMENT

CORE COMPETENCIES
✓ Implementation Science Consulting (CFIR/RE-AIM)
✓ Workforce Development Program Design
✓ Technology Platform Architecture & Integration
✓ Evidence-Based Program Evaluation
✓ Government Grant & Contract Support
✓ Professional Development & Training Delivery
✓ AI-Enhanced Service Delivery Design
✓ Organizational Capacity Building

COMPANY DATA
Legal Name: Collaboration and Implementation Professionals LLC
EIN: 41-4996540
State ID: 806497375
Type: Single Member LLC (Texas)
Formed: March 17, 2026
NAICS Codes: 541611, 541618, 541690, 611430
Address: 17912 Stefano Drive, Pflugerville, TX 78660
Phone: 254-319-8460
Email: president@thecollaborativeadvocate.org

DIFFERENTIATORS
• Implementation science expertise with field-tested CFIR and RE-AIM deployment
• Proven 24-platform technology ecosystem as reference architecture
• MAP-GAP continuous quality improvement methodology (proprietary)
• RPLICE Decision Framework for evidence-based consulting decisions
• Veteran-founded firm with government contracting understanding
• AI-enhanced consulting accelerating client time-to-value

METHODOLOGIES
• CFIR — Consolidated Framework for Implementation Research
• RE-AIM — Reach, Effectiveness, Adoption, Implementation, Maintenance
• MAP-GAP — Continuous quality improvement framework
• RPLICE — Research, Plan, Leverage, Implement, Comply, Evaluate

KEY PERSONNEL
Dr. Terry Flood — Founder & Principal Consultant

SERVICE AREAS
Consulting: National
Training: National (in-person and virtual)
Technology: National (platform-based delivery)

CONTACT
Dr. Terry Flood | 254-319-8460 | president@thecollaborativeadvocate.org` },
      { name: "Service Catalog", status: "complete", description: "Detailed listing of all consulting services and pricing tiers",
        content: `COLLABORATION AND IMPLEMENTATION PROFESSIONALS LLC
Service Catalog

TIER 1: ASSESSMENT & STRATEGY
• Implementation Readiness Assessment
• Organizational Capacity Analysis
• Workforce Program Gap Analysis
• Technology Platform Audit
• Grant Readiness Evaluation

TIER 2: DESIGN & DEVELOPMENT
• Curriculum Design & Standards Alignment
• Program Logic Model Development
• Technology Architecture Design
• Data Collection & Outcome Systems
• Training Program Development

TIER 3: IMPLEMENTATION & SUPPORT
• On-Site Implementation Coaching
• Staff Training & Professional Development
• Quality Assurance & Fidelity Monitoring
• Grant Writing & Submission Support
• Ongoing Technical Assistance

TIER 4: EVALUATION & OPTIMIZATION
• Program Evaluation (formative & summative)
• Outcome Data Analysis & Reporting
• Continuous Quality Improvement Cycles
• Sustainability Planning
• Scale-Up Strategy Development

[Pricing available upon request — contact president@thecollaborativeadvocate.org]` },
      { name: "Articles of Organization", status: "complete", description: "Texas Secretary of State filing" },
      { name: "Operating Agreement", status: "draft", description: "LLC governance and member agreement" },
      { name: "W-9", status: "needed", description: "IRS tax identification form for clients" },
      { name: "Business License", status: "needed", description: "City/county business license documentation" },
      { name: "Insurance Certificate (COI)", status: "needed", description: "Professional liability and general liability insurance" },
      { name: "Client Contract Template", status: "needed", description: "Standard consulting engagement agreement" },
    ],
  },
  {
    id: "mt-consulting",
    name: "M&T Consulting Solutions LLC",
    legalName: "M&T CONSULTING SOLUTIONS LLC",
    type: "Single Member LLC",
    ein: "41-4952178",
    status: "Active",
    formation: "March 2026",
    state: "TX",
    county: "Travis",
    address: "17912 Stefano Drive, Pflugerville, TX 78660",
    phone: "254-319-8460",
    email: "president@thecollaborativeadvocate.org",
    website: "https://thrivingcommunitiesforall.com",
    responsibleParty: "Terry Flood Sr, Sole Member",
    principalActivity: "Consulting and Training",
    description: "Joint consulting venture between Dr. Terry Flood and Meredith (Banessa Alvarez, TPD). Provides specialized consulting and training services with a focus on workforce development, organizational consulting, and professional training delivery. Operates as a flexible consulting vehicle for engagements requiring a lean, specialized team approach.",
    color: "border-emerald-500",
    icon: Users,
    keyFacts: [
      { label: "Entity Type", value: "Single Member LLC (Texas)" },
      { label: "Formed", value: "March 2026" },
      { label: "Responsible Party", value: "Terry Flood Sr, Sole Member" },
      { label: "TPD", value: "Banessa Alvarez" },
      { label: "TPD Address", value: "1814 N Memorial Way, Houston, TX 77007" },
      { label: "Principal Activity", value: "Consulting and Training" },
      { label: "County", value: "Travis County, TX" },
      { label: "Name Control", value: "M&TC" },
    ],
    documents: [
      { name: "Executive Summary", status: "complete", description: "Company overview for clients and partners",
        content: `M&T CONSULTING SOLUTIONS LLC
Executive Summary

COMPANY OVERVIEW
M&T Consulting Solutions LLC is a Texas-based consulting and training firm founded in March 2026. The company provides specialized consulting services, workforce development training, and organizational capacity building for government agencies, nonprofits, and private sector clients.

EIN: 41-4952178
Type: Single Member LLC (Texas)
County: Travis
Formed: March 2026
Address: 17912 Stefano Drive, Pflugerville, TX 78660
Phone: 254-319-8460
Email: president@thecollaborativeadvocate.org
Responsible Party: Terry Flood Sr, Sole Member
TPD: Banessa Alvarez — 1814 N Memorial Way, Houston, TX 77007

SERVICES
• Workforce Development Consulting
• Professional Training & Facilitation
• Organizational Development & Capacity Building
• Program Design & Implementation Support
• Grant Support & Technical Assistance
• Community Engagement Strategy

RELATIONSHIP TO ECOSYSTEM
M&T Consulting Solutions operates as a specialized consulting vehicle complementing the broader ecosystem of The Collaborative Advocate Foundation (nonprofit mission delivery) and Collaboration and Implementation Professionals LLC (implementation science consulting). M&T focuses on lean, specialized engagements where a targeted two-person consulting approach provides maximum value.

CONTACT
Terry Flood Sr | 254-319-8460 | president@thecollaborativeadvocate.org
Cash App: $MRTDFLOOD | PayPal: paypal.me/CollaborativeAdvocate` },
      { name: "Capability Statement", status: "complete", description: "2-page capability overview",
        content: `M&T CONSULTING SOLUTIONS LLC — CAPABILITY STATEMENT

CORE COMPETENCIES
✓ Workforce Development Consulting
✓ Professional Training & Facilitation
✓ Organizational Capacity Building
✓ Program Design & Implementation
✓ Community Engagement Strategy
✓ Grant Support & Technical Assistance

COMPANY DATA
Legal Name: M&T Consulting Solutions LLC
EIN: 41-4952178
Type: Single Member LLC (Texas)
County: Travis
Address: 17912 Stefano Drive, Pflugerville, TX 78660
Phone: 254-319-8460
Email: president@thecollaborativeadvocate.org
Responsible Party: Terry Flood Sr, Sole Member

KEY PERSONNEL
Terry Flood Sr — Sole Member & Principal Consultant
Banessa Alvarez — Third Party Designee (TPD)

SERVICE AREA
Primary: Central Texas
Secondary: State of Texas
Available: National (virtual delivery)

CONTACT
Terry Flood Sr | 254-319-8460 | president@thecollaborativeadvocate.org` },
      { name: "Company Profile", status: "complete", description: "One-page overview",
        content: `M&T CONSULTING SOLUTIONS LLC
Company Profile

M&T Consulting Solutions is a Texas LLC providing consulting and training services. Founded by Terry Flood Sr with Banessa Alvarez as Third Party Designee, the company delivers targeted workforce development consulting, professional training, and organizational capacity building.

KEY INFORMATION
EIN: 41-4952178
Entity: Single Member LLC
State: Texas (Travis County)
Address: 17912 Stefano Drive, Pflugerville, TX 78660
Phone: 254-319-8460
Started: March 2026
Activity: Consulting and Training

The company operates alongside The Collaborative Advocate Foundation (501(c)(3) nonprofit) and Collaboration and Implementation Professionals LLC (for-profit consulting), forming a three-entity structure that provides maximum flexibility for grant-funded, contract, and private consulting engagements.` },
      { name: "Certificate of Formation", status: "complete", description: "Texas Secretary of State filing" },
      { name: "EIN Confirmation Letter", status: "complete", description: "IRS EIN assignment confirmation" },
      { name: "Operating Agreement", status: "needed", description: "LLC governance and member agreement" },
      { name: "W-9", status: "needed", description: "IRS tax identification form for clients" },
      { name: "Business License", status: "needed", description: "City/county business license documentation" },
      { name: "Insurance Certificate (COI)", status: "needed", description: "General liability insurance" },
    ],
  },
];

export default function BusinessDocumentsPage() {
  const [activeEntity, setActiveEntity] = useState("collaborative-advocate");
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const { toast } = useToast();

  const entity = ENTITIES.find(e => e.id === activeEntity)!;
  const completeCount = entity.documents.filter(d => d.status === "complete").length;
  const draftCount = entity.documents.filter(d => d.status === "draft").length;
  const neededCount = entity.documents.filter(d => d.status === "needed").length;
  const completePct = Math.round((completeCount / entity.documents.length) * 100);

  const copyContent = (content: string, name: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Copied to clipboard", description: `${name} content copied successfully.` });
  };

  const totalComplete = ENTITIES.reduce((sum, e) => sum + e.documents.filter(d => d.status === "complete").length, 0);
  const totalDocs = ENTITIES.reduce((sum, e) => sum + e.documents.length, 0);
  const overallPct = Math.round((totalComplete / totalDocs) * 100);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" data-testid="business-documents-page">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="page-title">
          <Building2 className="h-8 w-8 text-primary" />
          Business Documents Center
        </h1>
        <p className="text-muted-foreground mt-1">
          Standard business documents for all 3 entities — The Collaborative Advocate Foundation, CIP LLC, and M&T Consulting Solutions
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-primary">3</div>
            <div className="text-xs text-muted-foreground">Business Entities</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-emerald-600">{totalComplete}</div>
            <div className="text-xs text-muted-foreground">Documents Complete</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-amber-600">{totalDocs - totalComplete}</div>
            <div className="text-xs text-muted-foreground">Remaining</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold">{overallPct}%</div>
            <Progress value={overallPct} className="mt-1 h-2" />
            <div className="text-xs text-muted-foreground mt-1">Overall Completion</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeEntity} onValueChange={setActiveEntity}>
        <TabsList className="grid w-full grid-cols-3 h-auto">
          {ENTITIES.map(e => (
            <TabsTrigger key={e.id} value={e.id} className="flex flex-col py-3 gap-1" data-testid={`tab-${e.id}`}>
              <div className="flex items-center gap-2">
                <e.icon className="h-4 w-4" />
                <span className="text-xs md:text-sm font-medium truncate">{e.name.length > 25 ? e.name.slice(0, 22) + "..." : e.name}</span>
              </div>
              <Badge variant="outline" className="text-[10px]">{e.type}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {ENTITIES.map(ent => (
          <TabsContent key={ent.id} value={ent.id} className="space-y-4 mt-4">
            <Card className={`border-l-4 ${ent.color}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <ent.icon className="h-5 w-5" />
                      {ent.name}
                    </CardTitle>
                    <CardDescription className="mt-1">{ent.description}</CardDescription>
                  </div>
                  <Badge className="text-xs">{ent.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Legal Name:</span> {ent.legalName}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Landmark className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">EIN:</span> {ent.ein}
                    </div>
                    {ent.stateId && (
                      <div className="flex items-center gap-2 text-sm">
                        <Scale className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">State ID:</span> {ent.stateId}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Address:</span> {ent.address}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Phone:</span> {ent.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Email:</span> {ent.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Responsible Party:</span> {ent.responsibleParty}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {ent.keyFacts.map(kf => (
                      <div key={kf.label} className="flex items-center gap-2 text-sm">
                        <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span className="font-medium">{kf.label}:</span>
                        <span className="text-muted-foreground">{kf.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents — {ent.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-emerald-600">{completeCount} Complete</Badge>
                    <Badge variant="secondary">{draftCount} Draft</Badge>
                    <Badge variant="destructive">{neededCount} Needed</Badge>
                  </div>
                </div>
                <Progress value={Math.round((ent.documents.filter(d => d.status === "complete").length / ent.documents.length) * 100)} className="h-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ent.documents.map(doc => {
                    const isExpanded = expandedDoc === `${ent.id}-${doc.name}`;
                    return (
                      <div key={doc.name} className="border rounded-lg overflow-hidden" data-testid={`doc-${ent.id}-${doc.name.replace(/\s+/g, '-').toLowerCase()}`}>
                        <div
                          className={`flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50 transition-colors ${doc.content ? '' : 'cursor-default'}`}
                          onClick={() => doc.content && setExpandedDoc(isExpanded ? null : `${ent.id}-${doc.name}`)}
                        >
                          <div className="flex items-center gap-3">
                            {doc.status === "complete" ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                            ) : doc.status === "draft" ? (
                              <FileText className="h-5 w-5 text-amber-500 shrink-0" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                            )}
                            <div>
                              <div className="font-medium text-sm">{doc.name}</div>
                              <div className="text-xs text-muted-foreground">{doc.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={doc.status === "complete" ? "default" : doc.status === "draft" ? "secondary" : "destructive"}
                              className={`text-xs ${doc.status === "complete" ? "bg-emerald-600" : ""}`}
                            >
                              {doc.status === "complete" ? "Complete" : doc.status === "draft" ? "Draft" : "Needed"}
                            </Badge>
                            {doc.content && (
                              isExpanded ?
                                <ChevronUp className="h-4 w-4 text-muted-foreground" /> :
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        {isExpanded && doc.content && (
                          <div className="border-t bg-muted/30 p-4">
                            <div className="flex justify-end gap-2 mb-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); copyContent(doc.content!, doc.name); }}
                                data-testid={`copy-${doc.name.replace(/\s+/g, '-').toLowerCase()}`}
                              >
                                <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); window.print(); }}
                                data-testid={`print-${doc.name.replace(/\s+/g, '-').toLowerCase()}`}
                              >
                                <Printer className="h-3.5 w-3.5 mr-1" /> Print
                              </Button>
                            </div>
                            <pre className="whitespace-pre-wrap text-sm font-mono bg-background p-4 rounded-lg border leading-relaxed">
                              {doc.content}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Three-Entity Structure Overview
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-lg border border-violet-200 dark:border-violet-800">
              <div className="font-semibold text-violet-700 dark:text-violet-300">The Collaborative Advocate Foundation</div>
              <div className="text-xs text-muted-foreground mt-1">IRS-determined 501(c)(3) — Mission delivery, grant execution, and tax-exempt donations for the ecosystem. SAM.gov Active; CAGE 209N1.</div>
              <div className="text-xs font-mono mt-2">EIN: 41-3618503</div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="font-semibold text-blue-700 dark:text-blue-300">Collaboration & Implementation Professionals LLC</div>
              <div className="text-xs text-muted-foreground mt-1">For-Profit LLC — Revenue-generating consulting, implementation science, training contracts, and platform licensing.</div>
              <div className="text-xs font-mono mt-2">EIN: 41-4996540</div>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div className="font-semibold text-emerald-700 dark:text-emerald-300">M&T Consulting Solutions LLC</div>
              <div className="text-xs text-muted-foreground mt-1">Specialized LLC — Lean consulting and training engagements, flexible team approach for targeted projects.</div>
              <div className="text-xs font-mono mt-2">EIN: 41-4952178</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}