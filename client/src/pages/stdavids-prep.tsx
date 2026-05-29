import { useState, useRef } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FileText, Users, Building2, MapPin, DollarSign,
  CheckCircle2, AlertTriangle, ArrowLeft, Printer,
  Phone, Mail, MessageSquare, Handshake, Heart,
  Shield, Briefcase, Globe, BarChart3, Star,
  ChevronRight, Clock, Target,
} from "lucide-react";

const DOCUMENTS = [
  {
    id: "listening-invite",
    title: "Community Listening Session — Invitation Script",
    category: "Community Voice",
    icon: MessageSquare,
    priority: "critical",
    description: "What to say when inviting community members to a listening session. St. David's scores community voice as their #1 criterion.",
    content: `COMMUNITY LISTENING SESSION — INVITATION SCRIPT
The Collaborative Advocate Foundation
President, TCAF

═══════════════════════════════════════════════════
WHO TO INVITE
═══════════════════════════════════════════════════

Target 5-10 people per session. Hold 2-3 sessions minimum.

Priority participants:
• People who have tried to enroll in SNAP, Medicaid, CHIP, WIC, or housing vouchers
• People who qualified but never completed enrollment
• People who lost benefits and couldn't get them back
• Community health workers or case managers who help people navigate benefits
• Parents navigating childcare subsidies
• Veterans transitioning to civilian services
• Immigrants or refugees who faced language barriers accessing services
• Individuals who experienced homelessness and tried to access resources

WHERE TO HOLD SESSIONS:
• Pflugerville Community Center or library
• Manor Community Center
• Local churches (especially those already doing community outreach)
• Partner agency offices (Foundation Communities, CommUnityCare)
• Virtual option via Zoom for people who can't attend in person

═══════════════════════════════════════════════════
WHAT TO SAY — THE INVITATION
═══════════════════════════════════════════════════

"I'm with The Collaborative Advocate Foundation here in Pflugerville. We're building something that's supposed to help people access benefits — SNAP, Medicaid, housing vouchers, childcare, all of it. But I don't want to build what I think you need. I want to hear what's actually happening when you try to get help.

What worked? What didn't? Where did the system lose you?

I'm not here to sell you anything. I'm here to listen so we can build something that actually works for you — not just for the people who designed it.

We're applying for funding from St. David's Foundation to expand these services across Central Texas. Your voice will directly shape what we build. This is your program — not ours."

═══════════════════════════════════════════════════
QUESTIONS TO ASK DURING THE SESSION
═══════════════════════════════════════════════════

Use the Three Realities framework to structure the conversation:

LIVED REALITY — What you actually experience:
1. "Have you ever tried to apply for public benefits? What was that experience like?"
2. "Where did you get stuck? What made you want to give up?"
3. "If you got benefits, how long did it take? If you didn't, what stopped you?"
4. "What would have made the process easier for you?"
5. "Do you know people who qualify for help but never apply? Why not?"

INSTITUTIONAL REALITY — What systems intend:
6. "When you went to an agency for help, did they understand your situation?"
7. "Did anyone help you navigate the process, or were you on your own?"
8. "Were there language barriers? Technology barriers? Transportation barriers?"
9. "Did you feel respected when you asked for help?"

GAP REALITY — Where the disconnect creates harm:
10. "What's the biggest gap between what help is supposed to exist and what you actually experience?"
11. "If you could change one thing about how people get connected to services, what would it be?"
12. "What does economic stability mean to you? Not the textbook definition — what does it actually feel like?"

═══════════════════════════════════════════════════
WHAT TO DOCUMENT
═══════════════════════════════════════════════════

For the St. David's application, you need:
• Date, location, and number of participants (NOT names — protect privacy)
• Key themes that emerged (group by Three Realities)
• Direct quotes (anonymous) that illustrate the gap
• How specific feedback shaped your program design
• Any surprises — things you didn't expect to hear

EXAMPLE DOCUMENTATION FORMAT:

"Listening Session #1 — Pflugerville Community Center — March [date], 2026
8 participants: 3 single mothers, 2 veterans, 1 elderly resident, 2 formerly incarcerated individuals

KEY THEMES:
Lived Reality: Participants described applying for SNAP as a '3-hour process that makes you feel like a criminal.' Two veterans said they didn't know they qualified for benefits beyond VA care. One mother said she lost childcare subsidies because she missed a recertification deadline — she didn't know it existed.

Institutional Reality: Benefits offices close at 5pm. Most participants work during those hours. Online applications require documents most don't have digitally. One participant was told to 'come back with a utility bill' — she was staying with a friend and had no utility bill.

Gap Reality: Every participant said the same thing in different words: 'The help exists, but it wasn't designed for people like me.'

PROGRAM DESIGN IMPACT: This session directly shaped our LifeBridge platform's mobile-first enrollment assistance, evening/weekend navigator availability, and document upload flexibility."

═══════════════════════════════════════════════════
LOGISTICS
═══════════════════════════════════════════════════

• Provide food/refreshments (budget $50-100 per session)
• Offer childcare if possible
• Session length: 60-90 minutes
• Have someone take notes (not Dr. Flood — you need to be fully present)
• Consider recording audio with consent for accuracy (but written notes are sufficient)
• Follow up with participants — let them know their input mattered`,
  },
  {
    id: "partner-outreach",
    title: "Partner Outreach — Phone/Email Scripts",
    category: "Partnerships",
    icon: Handshake,
    priority: "critical",
    description: "Ready-to-use scripts for contacting Foundation Communities, CommUnityCare, United Way, and other Central Texas partners.",
    content: `PARTNER OUTREACH SCRIPTS — ST. DAVID'S WE ALL BENEFIT 2.0
The Collaborative Advocate Foundation

═══════════════════════════════════════════════════
PRIORITY PARTNERS TO CONTACT
═══════════════════════════════════════════════════

1. Foundation Communities — Affordable housing + financial coaching in Austin
2. CommUnityCare Health Centers — FQHC serving uninsured/underinsured
3. United Way of Greater Austin — 2-1-1 referral network + benefits navigation
4. Integral Care — Behavioral health authority for Travis County
5. Any organization in Bastrop, Caldwell, or Hays counties (for geographic coverage)

═══════════════════════════════════════════════════
PHONE SCRIPT — INITIAL CALL
═══════════════════════════════════════════════════

"Hi, this is Dr. Terry Flood with The Collaborative Advocate Foundation. We're a veteran-founded, Black-led 501(c)(3) based in Pflugerville.

I'm reaching out because we're applying to St. David's Foundation's We All Benefit 2.0 grant — it's focused on economic stability through public benefits enrollment, financial coaching, and workforce development for Central Texas.

We've built a 15-service-platform technology ecosystem that includes LifeBridge for benefits navigation and Speech Bridge for multilingual access. We're not trying to replace what you do — we want to give you infrastructure that makes what you already do stronger. Shared data, coordinated referrals, tract-level community intelligence that goes deeper than county averages.

I'd like to talk about two possibilities:

Option 1: A letter of support — you endorse what we're building, and we reference your organization as a community partner.

Option 2: A collaborative application — we apply together for up to $1 million instead of $250K. That means we'd need an MOU and shared governance, but the funding goes much further.

What would make that conversation worth your time? I can send over a one-page summary of what our platforms do and how they'd support your work."

═══════════════════════════════════════════════════
EMAIL TEMPLATE — FOLLOW-UP
═══════════════════════════════════════════════════

Subject: Partnership Opportunity — St. David's We All Benefit 2.0 | The Collaborative Advocate Foundation

Dear [Name],

Thank you for taking my call. As discussed, I'm the President of The Collaborative Advocate Foundation (TCAF) — a veteran-founded, Black-led 501(c)(3) nonprofit based in Pflugerville, TX.

We are preparing an application for St. David's Foundation's "We All Benefit 2.0: Building Economic Stability" grant program, and I believe a partnership with [Organization Name] would strengthen both our work and the Central Texas communities we serve.

WHAT WE BRING TO THE TABLE:
• LifeBridge — A virtual 211 platform for housing navigation, benefits enrollment, food access, utilities assistance, and crisis support
• Speech Bridge — Multilingual translation and culturally responsive communication for immigrant and refugee communities
• ThriveUp Academy — Workforce development with 55 career pathways aligned to Central Texas growth sectors
• Financial Literacy module — Budgeting, credit repair, savings strategies, and our Stock Market Simulator for asset building
• Community Intelligence Maps — Tract-level data from 8 federal sources (CDC, Census, FBI, HUD, USDA, SAMHSA, BLS, SVI) that reveal the neighborhoods county averages hide
• MAP-GAP — Continuous quality improvement ensuring programs are implemented as designed, with real-time fidelity tracking

WHAT WE'RE ASKING:
[Option A — Letter of Support]
A letter of support for our application, endorsing the value of our technology platforms for Central Texas communities. I can provide a draft template for your review.

[Option B — Collaborative Application]
A collaborative application (3+ organizations) that unlocks up to $1,000,000 in funding. This would involve a Memorandum of Understanding outlining each partner's role, shared governance structure, and joint budget. Your organization's expertise in [their specialty] combined with our technology infrastructure creates a comprehensive economic stability initiative.

I'm available to meet in person, by phone, or virtually at your convenience. Our website is thrivingcommunitiesforall.com if you'd like to see the platforms in action.

Thank you for your time and your work serving Central Texas communities.

Respectfully,
Dr. Terry Flood, DHA
President, The Collaborative Advocate Foundation
U.S. Army Veteran — Bronze Star x2
EIN: 41-3618003
17912 Stefano Drive, Pflugerville, TX 78660
Email: president@thecollaborativeadvocate.org
Website: thrivingcommunitiesforall.com

═══════════════════════════════════════════════════
LETTER OF SUPPORT — TEMPLATE FOR PARTNERS
═══════════════════════════════════════════════════

(Send this to partners to make it easy for them to write their letter)

[Partner Organization Letterhead]
[Date]

St. David's Foundation
Attn: We All Benefit 2.0 Review Committee
[Address]

RE: Letter of Support for The Collaborative Advocate Foundation

Dear Review Committee,

[Organization Name] is pleased to support The Collaborative Advocate Foundation's (TCAF) application to the We All Benefit 2.0: Building Economic Stability grant program.

As a [describe organization's role in Central Texas], we have seen firsthand the enrollment gaps and economic instability facing the communities we serve. TCAF's technology platforms — particularly LifeBridge for benefits navigation and Speech Bridge for multilingual access — address barriers that our clients experience daily.

We support this application because:
1. TCAF's data infrastructure provides tract-level community intelligence that helps us understand WHERE the gaps are, not just that they exist
2. Their LifeBridge platform creates a coordinated referral pathway that reduces the fragmentation our clients face when navigating multiple agencies
3. Their commitment to serving ALL populations — including individuals experiencing homelessness, immigrants regardless of documentation status, and veterans — aligns with our mission

We look forward to collaborating with TCAF to improve economic stability outcomes for Central Texas residents.

Sincerely,
[Name, Title]
[Organization]

═══════════════════════════════════════════════════
MOU TEMPLATE — FOR COLLABORATIVE APPLICATION ($1M TRACK)
═══════════════════════════════════════════════════

MEMORANDUM OF UNDERSTANDING
Between The Collaborative Advocate Foundation and [Partner Organization]
For St. David's Foundation We All Benefit 2.0 Collaborative Application

PURPOSE: This MOU establishes the roles, responsibilities, and shared governance structure for a collaborative application to St. David's Foundation.

LEAD APPLICANT: The Collaborative Advocate Foundation (TCAF)
COLLABORATIVE PARTNER: [Organization Name]

TCAF RESPONSIBILITIES:
• Provide technology infrastructure (LifeBridge, Speech Bridge, ThriveUp Academy, MAP-GAP)
• Manage data collection, reporting, and outcome tracking
• Coordinate grant administration and financial reporting
• Provide community intelligence mapping and tract-level data analysis

PARTNER RESPONSIBILITIES:
• [Specific services the partner will provide]
• [Geographic coverage areas]
• [Number of participants they will serve]
• [In-kind or matching contributions]

SHARED GOVERNANCE:
• Monthly coordination meetings
• Quarterly outcome review with shared dashboard access
• Joint decision-making on program modifications
• Transparent budget reporting through MAP-GAP platform

DURATION: [Grant period] with option to continue partnership beyond grant funding

_________________________________    _______________
Dr. Terry Flood, TCAF                Date

_________________________________    _______________
[Partner Name, Title, Org]            Date`,
  },
  {
    id: "staffing-plan",
    title: "Staffing Plan & Team Qualifications",
    category: "Organizational Capacity",
    icon: Users,
    priority: "high",
    description: "Team structure showing named staff and planned hires. St. David's wants to see capacity beyond the founder.",
    content: `STAFFING PLAN — ST. DAVID'S WE ALL BENEFIT 2.0
The Collaborative Advocate Foundation

═══════════════════════════════════════════════════
CURRENT LEADERSHIP TEAM
═══════════════════════════════════════════════════

DR. TERRY FLOOD, DHA — Founder & Chief Executive Officer
• Doctor of Healthcare Administration
• MS in Implementation Science
• U.S. Army Veteran — Bronze Star x2
• 20+ years in workforce development, organizational change management, criminal justice, HR management, and Industrial-Organizational Psychology
• Designed and built the 15-service-platform MAP-GAP ecosystem
• Experience: Military leadership, community program design, implementation science research, curriculum development, technology platform architecture
• Role in this program: Executive oversight, program design, community engagement, funder relationships, strategic direction

MEREDITH SISNETT — Strategic Advisor
• Nonprofit strategy and grant development
• Community partnership building and coalition management
• Central Texas community knowledge
• Role in this program: Strategic guidance, partnership facilitation, grant narrative review, community relationship development

[Dr. Flood: Add Meredith's specific credentials/background here]

═══════════════════════════════════════════════════
POSITIONS TO BE HIRED UPON AWARD
═══════════════════════════════════════════════════

(These positions are budgeted in the grant and will be hired within 30 days of award)

COMMUNITY BENEFITS NAVIGATOR (2 positions — Full-time)
• Qualifications: Experience with Medicaid/SNAP/CHIP/WIC enrollment, bilingual (English/Spanish preferred), community health worker certification or equivalent
• Responsibilities: Conduct community outreach, assist with benefits applications, provide enrollment follow-up, track outcomes through LifeBridge platform, connect participants to financial coaching and workforce services
• Salary range: $40,000-$50,000 annually
• Why this role matters: These navigators ARE the ground-level connection between community members and the technology. They meet people where they are — physically and emotionally.

DATA & OUTCOMES ANALYST (1 position — Full-time)
• Qualifications: Experience with data analysis, community health data, GIS mapping, federal data sources. Bachelor's degree in public health, social science, data science, or related field
• Responsibilities: Manage 8 federal data source integrations, maintain tract-level community intelligence maps, produce outcome reports for St. David's, monitor implementation fidelity through RPLICE, generate quarterly impact dashboards
• Salary range: $50,000-$60,000 annually
• Why this role matters: This isn't a reporting job — it's a truth-telling job. This person ensures our data doesn't leave anyone invisible.

FINANCIAL COACH (1 position — Part-time or contracted)
• Qualifications: Accredited Financial Counselor (AFC) or equivalent certification, experience serving low-income populations, understanding of public benefits interaction with earned income
• Responsibilities: Provide individualized financial coaching, facilitate Financial Literacy module sessions, support participants with budgeting, credit repair, savings strategies, and understanding how earned income affects benefits (the "benefits cliff")
• Salary range: $25,000-$35,000 annually (part-time)

═══════════════════════════════════════════════════
ORGANIZATIONAL CAPACITY STATEMENT
═══════════════════════════════════════════════════

(Use this language in the LOI and full proposal)

"The Collaborative Advocate Foundation demonstrates organizational capacity through:

TECHNOLOGY INFRASTRUCTURE: A fully operational 15-service-platform ecosystem that has been designed, built, and deployed — not proposed. LifeBridge is live. Speech Bridge is live. ThriveUp Academy has 55 career pathways and 60+ deep lessons. RPLICE provides real-time implementation fidelity tracking. This is not a startup requesting funding to build something — this is an operating system requesting funding to deploy existing infrastructure to serve Central Texas communities.

LEADERSHIP: Dr. Terry Flood brings a rare combination of military discipline, academic rigor (DHA, MS Implementation Science), and lived understanding of the communities we serve. As a veteran and Black leader, Dr. Flood doesn't study these communities from the outside — he lives in them, builds for them, and is accountable to them.

METHODOLOGY: Our MAP-GAP continuous quality improvement framework and Three Realities community engagement methodology are proprietary intellectual property that has been developed, documented, and validated through the RPLICE implementation science platform. This means every program we deliver is measured against its own design — and when reality doesn't match intention, we adjust in 30-day cycles, not annual reports.

FISCAL RESPONSIBILITY: [Dr. Flood: Add 1-2 sentences about financial management capacity — who handles bookkeeping, any fiscal policies in place, board oversight of finances]"

═══════════════════════════════════════════════════
BOARD OF DIRECTORS
═══════════════════════════════════════════════════

[Dr. Flood: List your current board members with their titles and relevant expertise]

Example format:
• [Name] — [Title/Role], [Expertise relevant to this grant]
• [Name] — [Title/Role], [Expertise relevant to this grant]
• [Name] — [Title/Role], [Expertise relevant to this grant]

St. David's wants to see a board that reflects the community you serve and has relevant expertise (nonprofit governance, finance, community health, etc.)`,
  },
  {
    id: "county-coverage",
    title: "5-County Coverage Strategy",
    category: "Geographic Eligibility",
    icon: MapPin,
    priority: "high",
    description: "How to address service delivery across all 5 Central Texas counties St. David's requires.",
    content: `5-COUNTY COVERAGE STRATEGY — ST. DAVID'S WE ALL BENEFIT 2.0
The Collaborative Advocate Foundation

═══════════════════════════════════════════════════
THE REQUIREMENT
═══════════════════════════════════════════════════

St. David's Foundation serves a 5-county Central Texas area:
• Travis County — Austin, Pflugerville, Manor (YOUR PRIMARY BASE)
• Williamson County — Round Rock, Georgetown, Cedar Park (STRONG COVERAGE)
• Hays County — San Marcos, Kyle, Buda (NEEDS PARTNER OR PLAN)
• Bastrop County — Bastrop, Elgin, Smithville (NEEDS PARTNER OR PLAN)
• Caldwell County — Lockhart, Luling (NEEDS PARTNER OR PLAN)

You don't have to serve ALL 5 counties — but you need to explain your geographic focus and how underserved communities in your target area will be reached.

═══════════════════════════════════════════════════
WHAT TO SAY IN THE APPLICATION
═══════════════════════════════════════════════════

"The Collaborative Advocate Foundation delivers services across Central Texas through a hybrid model of digital access and community-based presence:

DIGITAL ACCESS — ALL 5 COUNTIES:
Our technology platforms serve every resident in the 5-county service area today. LifeBridge, Speech Bridge, ThriveUp Academy, and our Financial Literacy tools are accessible from any device, anywhere. A mother in Lockhart can access the same benefits navigation as a veteran in Pflugerville. Our community intelligence maps already have tract-level data for all five counties — Census tract 48021950200 in Bastrop and tract 48055950300 in Caldwell are as visible to us as tract 48453001703 in Travis.

COMMUNITY-BASED PRESENCE — TRAVIS & WILLIAMSON:
Our physical service delivery operates through community hubs in Pflugerville and Manor (Travis County), with partnerships extending into Williamson County. Community Benefits Navigators will conduct in-person outreach, enrollment assistance, and financial coaching sessions at community centers, libraries, churches, and partner agency locations.

EXTENDING REACH — HAYS, BASTROP, CALDWELL:
[Option A — If you have partners in those counties:]
Through our collaborative partnership with [Partner Name], in-person services extend to [County]. [Partner] provides [their services] while TCAF provides the technology infrastructure, data analysis, and implementation science validation that ensures coordinated service delivery.

[Option B — If you don't have partners yet:]
For Hays, Bastrop, and Caldwell counties, we will establish quarterly mobile service events in partnership with local organizations, bringing Community Benefits Navigators, enrollment assistance, and financial coaching directly to underserved communities. Our digital platforms ensure continuous access between events, and our data infrastructure identifies the specific Census tracts with the highest need for targeted outreach.

[Option C — For individual ($250K) application:]
Our application focuses on Travis and Williamson counties where we have established community presence and partnerships. Our data infrastructure covers all 5 counties, enabling us to expand geographic reach as capacity grows. We specifically target Census tracts where poverty exceeds 25% and benefits enrollment gaps are widest — these neighborhoods exist in both Travis and Williamson counties and are underserved by existing programs."

═══════════════════════════════════════════════════
POTENTIAL PARTNERS IN EACH COUNTY
═══════════════════════════════════════════════════

HAYS COUNTY:
• Hays County Food Bank — food access, benefits referral
• Community Action Inc. of Central Texas — anti-poverty programs (offices in San Marcos)
• Texas State University community engagement programs

BASTROP COUNTY:
• Bastrop County Emergency Food Pantry & Support
• Colorado River Alliance — community services
• Bastrop County Cares — community health initiatives

CALDWELL COUNTY:
• Community Action Inc. of Central Texas (Lockhart office)
• Caldwell County community health resources
• Local churches and faith-based organizations

[Dr. Flood: If you have any existing relationships in these counties, note them here]`,
  },
  {
    id: "track-decision",
    title: "Individual vs. Collaborative — Decision Framework",
    category: "Strategy",
    icon: Target,
    priority: "high",
    description: "Framework for deciding between $250K individual and $1M collaborative application tracks.",
    content: `INDIVIDUAL vs. COLLABORATIVE — DECISION FRAMEWORK
St. David's We All Benefit 2.0

═══════════════════════════════════════════════════
THE TWO TRACKS
═══════════════════════════════════════════════════

INDIVIDUAL TRACK: Up to $250,000
• Single organization applies alone
• Simpler application
• Full control over narrative and budget
• Faster to prepare
• Lower ceiling

COLLABORATIVE TRACK: Up to $1,000,000
• 3 or more organizations apply together
• Requires MOUs between all partners before LOI
• Shared governance structure required
• Joint budget with each partner's allocation
• More complex but MUCH higher ceiling
• St. David's PREFERS collaborative applications

═══════════════════════════════════════════════════
DECISION CRITERIA
═══════════════════════════════════════════════════

GO INDIVIDUAL ($250K) IF:
✓ You cannot secure 2+ partner commitments before the LOI deadline
✓ Partner conversations are still in early stages
✓ You want to move fast and maintain full control
✓ You're confident TCAF's capacity alone is sufficient for the ask
✓ You plan to build partnerships after the award

GO COLLABORATIVE ($1M) IF:
✓ You have 2+ partners ready to sign MOUs
✓ Partners bring geographic coverage you don't have (Hays, Bastrop, Caldwell)
✓ Partners bring credibility in benefits enrollment (Foundation Communities, CommUnityCare)
✓ You want to maximize funding ($1M vs $250K is a 4x difference)
✓ You can manage the complexity of shared governance

═══════════════════════════════════════════════════
MY RECOMMENDATION
═══════════════════════════════════════════════════

Start collaborative conversations NOW. Set a decision deadline of [2 weeks before LOI is due].

If by that date you have:
• 2+ signed MOUs → Submit COLLABORATIVE ($1M)
• 1 MOU or still negotiating → Submit INDIVIDUAL ($250K) with letters of support
• 0 commitments → Submit INDIVIDUAL ($250K) and reference partnerships in development

DO NOT let the collaborative track delay your submission. An individual application submitted on time beats a collaborative application submitted late — or not at all.

═══════════════════════════════════════════════════
BUDGET FRAMEWORK — INDIVIDUAL ($250K)
═══════════════════════════════════════════════════

Personnel:                    $145,000
  Program Director (Dr. Flood) — partial salary     $50,000
  Community Benefits Navigators (2)                  $80,000
  Financial Coach (part-time)                        $15,000

Technology & Infrastructure:   $35,000
  LifeBridge deployment & maintenance                $15,000
  Speech Bridge multilingual access                  $10,000
  Data infrastructure & reporting                    $10,000

Community Outreach:            $25,000
  Outreach events & materials                        $10,000
  Transportation assistance for participants         $8,000
  Childcare during program sessions                  $7,000

Evaluation & CQI:              $20,000
  RPLICE implementation fidelity tracking             $10,000
  External evaluation support                        $10,000

Indirect/Admin:                $25,000
  Insurance, office, supplies, admin                 $25,000

TOTAL:                         $250,000

═══════════════════════════════════════════════════
BUDGET FRAMEWORK — COLLABORATIVE ($1M)
═══════════════════════════════════════════════════

TCAF (Lead — Technology & Coordination):  $400,000
  Personnel, technology, data, evaluation, admin

Partner 1 (Benefits Enrollment):          $300,000
  Benefits navigators, enrollment specialists, 
  direct service delivery in their service area

Partner 2 (Geographic Extension):         $200,000
  Service delivery in Hays/Bastrop/Caldwell,
  community outreach, local partnerships

Shared Costs:                             $100,000
  Joint evaluation, shared governance,
  collaborative meetings, joint outreach events

TOTAL:                                  $1,000,000

[Dr. Flood: Adjust these numbers based on actual partner conversations and real salary data]`,
  },
  {
    id: "sustainability",
    title: "Sustainability Statement — Post-Grant Revenue",
    category: "Sustainability",
    icon: DollarSign,
    priority: "high",
    description: "What happens after the grant ends. St. David's wants to know they're not creating dependency.",
    content: `SUSTAINABILITY STATEMENT — BEYOND THE GRANT
The Collaborative Advocate Foundation

═══════════════════════════════════════════════════
USE THIS LANGUAGE IN YOUR APPLICATION
═══════════════════════════════════════════════════

"The Collaborative Advocate Foundation is not grant-dependent. St. David's funding accelerates deployment of existing infrastructure to serve Central Texas communities — it does not create dependency or build something from scratch.

Our sustainability model includes multiple revenue streams that continue beyond any single grant period:

1. GOVERNMENT CONTRACTS (Active)
TCAF is currently pursuing a government contract with Central Health (Solicitation #2603-002) for compensation and classification services. This represents ongoing operational revenue independent of foundation grants. Additionally, Collaboration & Implementation Professionals LLC (VOSB, EIN 41-4996540) provides HR consulting and implementation science services to government agencies and healthcare systems.

2. TECHNOLOGY LICENSING
Our RPLICE implementation science platform and MAP-GAP continuous quality improvement framework are proprietary technology with commercial licensing potential. Other nonprofits, government agencies, and community health systems can license our platforms to validate their own program implementation — creating recurring SaaS revenue.

3. DIVERSIFIED GRANT PORTFOLIO
TCAF maintains an active pipeline of $3.6M+ in federal and foundation grants across multiple funders (SSG Fox VA, Rare Impact Fund, Centene Foundation, BB Collective Research). This diversification means no single funder represents survival-level dependency.

4. CONSULTING REVENUE
Through M&T Consulting (EIN 41-4952178) and CIP LLC, Dr. Flood provides organizational change management, workforce development, and implementation science consulting. This revenue stream is independent of all grant activity.

5. TECHNOLOGY PERSISTS BEYOND FUNDING
The most important sustainability factor: our technology doesn't disappear when a grant ends. LifeBridge, Speech Bridge, ThriveUp Academy — these platforms are built, operational, and will continue serving communities regardless of any single funding source. St. David's investment creates a multiplier effect: every dollar builds capacity that serves the community permanently.

POST-GRANT TRANSITION PLAN:
• Months 1-12 (Grant Period): Deploy full service model, hire staff, establish community partnerships, build enrollment pipeline, measure outcomes
• Months 9-12 (Transition Planning): Secure continuation funding from diversified sources, train partner staff on platform usage, establish self-sustaining referral networks
• Months 12+: Technology continues operating, community partnerships sustain, consulting and licensing revenue maintain organizational capacity"

═══════════════════════════════════════════════════
KEY POINT FOR ST. DAVID'S
═══════════════════════════════════════════════════

"St. David's is not funding a program that dies when the check clears. You are investing in infrastructure that already exists, already works, and will continue working. Your funding buys deployment speed — not existence."`,
  },
  {
    id: "org-capacity",
    title: "Organizational Capacity Documents Checklist",
    category: "Organizational Capacity",
    icon: Building2,
    priority: "critical",
    description: "Everything you need to gather — financial statements, board list, prior results.",
    content: `ORGANIZATIONAL CAPACITY — DOCUMENTS CHECKLIST
The Collaborative Advocate Foundation

═══════════════════════════════════════════════════
DOCUMENTS YOU NEED TO GATHER
═══════════════════════════════════════════════════

□ IRS 501(c)(3) DETERMINATION LETTER
  Status: TCAF has this — EIN 41-3618003
  Action: Locate the original IRS letter and have a PDF ready

□ MOST RECENT FORM 990
  Action: [Dr. Flood — do you have your most recent 990? If TCAF is under $50K revenue, you may file 990-N (e-postcard) instead of full 990. Either way, have it ready.]

□ FINANCIAL STATEMENTS — LAST 2 FISCAL YEARS
  Action: Compile revenue, expenses, and balance sheet for FY2024 and FY2025. If you don't have audited financials, unaudited is acceptable for the LOI stage. For the full proposal, consider having a CPA prepare reviewed financials.
  
  [Dr. Flood: Who does your bookkeeping? If you're doing it yourself, consider engaging a bookkeeper or CPA before the full proposal stage. St. David's wants to see financial management capacity.]

□ BOARD OF DIRECTORS LIST
  Action: Create a one-page document listing:
  • Name
  • Title/Role on board
  • Professional expertise (healthcare, finance, education, community, etc.)
  • Term dates
  
  St. David's wants to see:
  • Board reflects the community you serve
  • Financial oversight expertise on the board
  • Independence (not all family members)
  
  [Dr. Flood: List your current board members here]

□ ORGANIZATIONAL CHART
  Action: Simple chart showing:
  President, TCAF → Program Staff (to be hired)
                   → Strategic Advisor (Meredith)
                   → Board of Directors (governance)

□ PRIOR PROGRAM RESULTS / PILOT DATA
  This is the trickiest one. St. David's wants evidence you can deliver.
  
  Options for demonstrating capacity:
  • Platform usage data (how many people have used LifeBridge, ThriveUp, etc.)
  • Any pilot program outcomes
  • Technology demonstrations showing the platforms work
  • Dr. Flood's prior program results from other roles
  • Military leadership and program management record
  
  [Dr. Flood: What results can you point to? Even small numbers matter — "12 participants completed our financial literacy pilot" is better than no data. Have you run any programs through TCAF yet, even informally?]

□ CERTIFICATES OF INSURANCE
  Action: General liability insurance certificate. If you don't have this yet, get a quote from a nonprofit insurance provider. Many require this before awarding funds.

□ FISCAL POLICIES
  Action: If you have a written fiscal policy document (who can spend money, approval thresholds, bookkeeping practices), include it. If not, create a simple 1-page document:
  
  "The Collaborative Advocate Foundation maintains the following fiscal policies:
  • All expenditures over $[amount] require board approval
  • Dr. Flood maintains authority for operational expenditures under $[amount]
  • Financial records are maintained using [QuickBooks/accounting software]
  • [Bookkeeper/CPA name] provides monthly financial reconciliation
  • Board reviews financial statements quarterly"

═══════════════════════════════════════════════════
PRIORITY ORDER — WHAT TO DO FIRST
═══════════════════════════════════════════════════

1. ★★★ Locate 501(c)(3) letter and most recent 990 (you probably have these)
2. ★★★ Create board list document (30 minutes)
3. ★★☆ Compile 2-year financial summary (may need bookkeeper)
4. ★★☆ Write organizational chart (15 minutes)
5. ★☆☆ Document any prior program results or pilot data
6. ★☆☆ Prepare fiscal policies document (30 minutes)
7. ★☆☆ Get insurance certificate (if not already in place)`,
  },
  {
    id: "christina-email",
    title: "Email to Christina Thompson — Timing Inquiry",
    category: "Strategy",
    icon: Mail,
    priority: "medium",
    description: "Ready-to-send email to St. David's program officer asking about the 2026 cycle timeline.",
    content: `EMAIL TO CHRISTINA THOMPSON — ST. DAVID'S FOUNDATION
Ready to send

═══════════════════════════════════════════════════

To: cthompson@stdavidsfoundation.org
Subject: Inquiry — We All Benefit 2.0 | 2026 Application Timeline

Dear Ms. Thompson,

My name is the President of The Collaborative Advocate Foundation, a veteran-founded, Black-led 501(c)(3) nonprofit based in Pflugerville, TX.

I'm writing to inquire about the timeline for the 2026 cycle of the "We All Benefit 2.0: Building Economic Stability" grant program. We are actively preparing our Letter of Intent and want to ensure we're aligned with your schedule.

We serve Central Texas communities through a 15-service-platform technology ecosystem focused on economic stability — including benefits navigation (LifeBridge), multilingual access (Speech Bridge), workforce development (ThriveUp Academy), and financial coaching. Our work is equity-focused and data-led, and we specifically measure impact for populations that most organizations don't count — individuals experiencing homelessness, immigrants regardless of documentation status, veterans transitioning to civilian life, and formerly incarcerated individuals rebuilding stability.

Two questions:
1. When does the 2026 LOI submission window open?
2. Are there any changes to the program priorities or application process from the 2024 cycle?

Thank you for your time and for St. David's Foundation's commitment to Central Texas communities.

Respectfully,
Dr. Terry Flood, DHA
President
The Collaborative Advocate Foundation
EIN: 41-3618003
17912 Stefano Drive, Pflugerville, TX 78660
Email: president@thecollaborativeadvocate.org
Website: thrivingcommunitiesforall.com
U.S. Army Veteran — Bronze Star x2

═══════════════════════════════════════════════════
NOTES ABOUT THIS EMAIL
═══════════════════════════════════════════════════

• Keep it short — program officers get hundreds of emails
• Don't pitch your full program — just show you're serious and prepared
• The mention of veteran-founded and Black-led matters for equity alignment
• Mentioning homeless, immigrant, and veteran populations signals you understand their priorities
• End with specific questions so she has something concrete to respond to
• If she responds with timing, immediately begin your LOI finalization`,
  },
];

export default function StDavidsPrep() {
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = (docId: string) => {
    const doc = DOCUMENTS.find(d => d.id === docId);
    if (!doc) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${doc.title} — TCAF</title>
          <style>
            body { font-family: 'Georgia', serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1a1a1a; }
            h1 { font-size: 18px; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px; }
            pre { white-space: pre-wrap; font-family: 'Georgia', serif; font-size: 13px; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <h1>${doc.title}</h1>
          <pre>${doc.content}</pre>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const categories = [...new Set(DOCUMENTS.map(d => d.category))];

  return (
    <div className="min-h-screen bg-background" data-testid="stdavids-prep-page">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/grant-packages">
            <Button variant="ghost" size="sm" data-testid="button-back-grants">
              <ArrowLeft className="h-4 w-4 mr-1" /> Grant Packages
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold" data-testid="text-stdavids-title">
              CTX Benefits Initiative — Field Preparation Docs
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-3xl">
            Community listening scripts, outreach email templates, and field-ready documents
            for CTX Benefits Initiative operations. Print any document, send any email, make any call.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="text-sm">Up to $250K Individual</Badge>
            <Badge variant="outline" className="text-sm">Up to $1M Collaborative</Badge>
            <Badge variant="outline" className="text-sm">5-County Central Texas</Badge>
            <Badge variant="outline" className="text-sm">LOI-First Process</Badge>
          </div>
        </div>

        <Card className="mb-8 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20" data-testid="card-we-all-benefit-2">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <DollarSign className="h-6 w-6 text-green-600 mt-0.5 shrink-0" />
              <div className="w-full">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-green-900 dark:text-green-200 text-lg">NEW: We All Benefit 2.0 — Building Economic Stability</h3>
                  <Badge className="bg-green-600 text-white">APPLICATION OPEN</Badge>
                </div>
                <p className="text-sm text-green-800 dark:text-green-300 mb-3">
                  Separate grant opportunity from St. David's Foundation investing in community-informed organizations providing core economic stability services for historically marginalized communities.
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <div className="bg-white/60 dark:bg-green-900/30 rounded-lg p-3">
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase">LOI Deadline</p>
                    <p className="font-bold text-green-900 dark:text-green-200">April 27, 5 PM CT</p>
                  </div>
                  <div className="bg-white/60 dark:bg-green-900/30 rounded-lg p-3">
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase">Full App (If Invited)</p>
                    <p className="font-bold text-green-900 dark:text-green-200">June 18, 5 PM CT</p>
                  </div>
                  <div className="bg-white/60 dark:bg-green-900/30 rounded-lg p-3">
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase">Focus Areas</p>
                    <p className="font-bold text-green-900 dark:text-green-200 text-sm">Income, Food, Health</p>
                  </div>
                  <div className="bg-white/60 dark:bg-green-900/30 rounded-lg p-3">
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase">More Info</p>
                    <a href="https://lnkd.in/gPkAUS-u" target="_blank" rel="noopener noreferrer" className="font-bold text-green-700 dark:text-green-300 underline text-sm" data-testid="link-wab2-info">lnkd.in/gPkAUS-u</a>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-green-800 dark:text-green-300">
                  <p className="font-semibold">TCAF Alignment — Why We're a Strong Fit:</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span><strong>Income Supports</strong> — LifeBridge navigation, MCE business development, workforce platforms</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span><strong>Food Security</strong> — Community resource coordination via Resource Directory</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span><strong>Healthcare Access</strong> — Whole Person Health, Sankofa Health Suite, CHW Dashboard</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span><strong>Benefits Enrollment</strong> — AI navigator + case management for SNAP, Medicaid, CHIP, WIC, housing</span>
                    </div>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-2 italic">
                    This is a SEPARATE opportunity from the general St. David's health equity grant. Both can be pursued simultaneously.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">RPLICE Assessment: 68/100 — 5 Items Need Your Input</h3>
                <div className="grid sm:grid-cols-2 gap-2 text-sm text-amber-800 dark:text-amber-300">
                  <div className="flex items-center gap-2"><Star className="h-3 w-3" /> Community Listening Sessions (Critical #1)</div>
                  <div className="flex items-center gap-2"><Star className="h-3 w-3" /> Partner Letters of Support (Critical #2)</div>
                  <div className="flex items-center gap-2"><Star className="h-3 w-3" /> Organizational Capacity Docs (Critical #3)</div>
                  <div className="flex items-center gap-2"><Clock className="h-3 w-3" /> Staffing Plan — 2+ beyond Dr. Flood</div>
                  <div className="flex items-center gap-2"><Clock className="h-3 w-3" /> Implementation Timeline (30/60/90/180/365)</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-lg font-semibold mb-3">Preparation Documents</h2>
            {categories.map(cat => (
              <div key={cat}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 mt-4">{cat}</p>
                {DOCUMENTS.filter(d => d.category === cat).map(doc => {
                  const Icon = doc.icon;
                  const isActive = activeDoc === doc.id;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => setActiveDoc(doc.id)}
                      className={`w-full text-left p-3 rounded-lg mb-2 transition-colors border ${
                        isActive
                          ? 'bg-primary/10 border-primary/30'
                          : 'bg-card border-border hover:bg-muted/50'
                      }`}
                      data-testid={`button-doc-${doc.id}`}
                    >
                      <div className="flex items-start gap-2">
                        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${isActive ? 'text-primary' : ''}`}>{doc.title}</span>
                            {doc.priority === 'critical' && (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Critical</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{doc.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="lg:col-span-2">
            {activeDoc ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-xl" data-testid="text-active-doc-title">
                      {DOCUMENTS.find(d => d.id === activeDoc)?.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {DOCUMENTS.find(d => d.id === activeDoc)?.description}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrint(activeDoc)}
                    data-testid="button-print-doc"
                  >
                    <Printer className="h-4 w-4 mr-1" /> Print
                  </Button>
                </CardHeader>
                <CardContent>
                  <div ref={printRef} className="bg-muted/30 rounded-lg p-6 max-h-[70vh] overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed" data-testid="text-doc-content">
                      {DOCUMENTS.find(d => d.id === activeDoc)?.content}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="flex items-center justify-center min-h-[400px]">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium">Select a document to view</p>
                  <p className="text-sm mt-1">Click any document on the left to see it here</p>
                  <p className="text-sm mt-3">Start with the <strong>Community Listening Session</strong> script — it's your #1 priority</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        <Card className="mt-8 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="p-6">
            <h3 className="font-semibold text-green-900 dark:text-green-200 mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> Recommended Action Sequence
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1">
                <p className="font-medium text-green-800 dark:text-green-300">This Week</p>
                <p className="text-green-700 dark:text-green-400">1. Email Christina Thompson</p>
                <p className="text-green-700 dark:text-green-400">2. Call Foundation Communities</p>
                <p className="text-green-700 dark:text-green-400">3. Locate 501(c)(3) letter + 990</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-green-800 dark:text-green-300">Next Week</p>
                <p className="text-green-700 dark:text-green-400">4. Schedule Listening Session #1</p>
                <p className="text-green-700 dark:text-green-400">5. Call CommUnityCare + United Way</p>
                <p className="text-green-700 dark:text-green-400">6. Write board list document</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-green-800 dark:text-green-300">Week 3</p>
                <p className="text-green-700 dark:text-green-400">7. Hold Listening Session #1</p>
                <p className="text-green-700 dark:text-green-400">8. Decide Individual vs. Collaborative</p>
                <p className="text-green-700 dark:text-green-400">9. Compile 2-year financials</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-green-800 dark:text-green-300">Week 4</p>
                <p className="text-green-700 dark:text-green-400">10. Hold Listening Session #2</p>
                <p className="text-green-700 dark:text-green-400">11. Collect partner letters/MOUs</p>
                <p className="text-green-700 dark:text-green-400">12. Finalize and submit LOI</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
