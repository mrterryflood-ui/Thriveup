import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import {
  Shield, ExternalLink, Search, MapPin, Phone, Globe, Heart,
  Scale, Users, Building2, BookOpen, Briefcase, GraduationCap,
  Church, HandHeart, Baby, Flag, AlertTriangle, Stethoscope,
  Home, ChevronDown, ChevronUp, ArrowRight, Star, Filter,
  Megaphone, Gavel, Award, Landmark, Layers
} from "lucide-react";

type OrgCategory = "civil-rights" | "legal-aid" | "chambers" | "faith" | "veteran" | "health" | "housing" | "employment" | "education" | "family" | "crisis" | "ecosystem";

interface Organization {
  name: string;
  description: string;
  website: string;
  chapterFinder?: string;
  phone?: string;
  focus: string[];
  national: boolean;
  stateCount?: number;
  logo?: string;
}

interface CategoryData {
  id: OrgCategory;
  label: string;
  icon: typeof Shield;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  organizations: Organization[];
}

const RESOURCE_CATEGORIES: CategoryData[] = [
  {
    id: "civil-rights",
    label: "Civil Rights & Advocacy",
    icon: Scale,
    color: "text-amber-400",
    bgColor: "bg-amber-900/20",
    borderColor: "border-amber-700/50",
    description: "National organizations fighting for equal rights, racial justice, and protection of marginalized communities. Every organization listed has local chapters, know-your-rights resources, and direct advocacy services.",
    organizations: [
      { name: "NAACP", description: "The nation's oldest and largest civil rights organization. Fights for political, educational, social, and economic equality of all persons. Over 2,200 local units across the country.", website: "https://naacp.org", chapterFinder: "https://naacp.org/find-local-unit", phone: "410-580-5777", focus: ["Racial Justice", "Voting Rights", "Criminal Justice Reform", "Education Equity"], national: true, stateCount: 50 },
      { name: "ACLU (American Civil Liberties Union)", description: "Defends individual rights and liberties guaranteed by the Constitution. Free legal assistance for civil liberties violations, know-your-rights resources, and policy advocacy in all 50 states.", website: "https://aclu.org", chapterFinder: "https://www.aclu.org/about/affiliates", phone: "212-549-2500", focus: ["Constitutional Rights", "Criminal Justice", "Immigration", "LGBTQ+ Rights", "Racial Justice"], national: true, stateCount: 50 },
      { name: "National Urban League", description: "Empowers African Americans and other underserved communities to secure economic self-reliance, parity, power, and civil rights. 90+ affiliates in 36 states providing direct services.", website: "https://nul.org", chapterFinder: "https://nul.org/local-affiliates", phone: "212-558-5300", focus: ["Economic Empowerment", "Education", "Health", "Workforce Development", "Civil Rights"], national: true, stateCount: 36 },
      { name: "Southern Poverty Law Center (SPLC)", description: "Monitors hate groups and extremist activity, uses litigation, education, and advocacy to protect the rights of the most vulnerable. Free legal services for marginalized communities in the Deep South and beyond.", website: "https://splcenter.org", phone: "334-956-8200", focus: ["Hate Group Monitoring", "Immigrant Justice", "LGBTQ+ Rights", "Children's Rights", "Criminal Justice Reform"], national: true },
      { name: "National Action Network (NAN)", description: "Founded by Rev. Al Sharpton. Promotes a modern civil rights agenda focused on policing, criminal justice reform, voting rights, and economic equity. Chapters in 106 cities.", website: "https://nationalactionnetwork.net", chapterFinder: "https://nationalactionnetwork.net/chapters/", phone: "212-690-3070", focus: ["Police Accountability", "Voting Rights", "Economic Justice", "Youth Empowerment"], national: true },
      { name: "Color of Change", description: "The largest online racial justice organization. Uses technology and media to create social change, with campaigns targeting corporate accountability, criminal justice, and media representation.", website: "https://colorofchange.org", focus: ["Corporate Accountability", "Criminal Justice", "Media Representation", "Tech Accountability"], national: true },
      { name: "Equal Justice Initiative (EJI)", description: "Founded by Bryan Stevenson, author of Just Mercy. Provides legal representation to the wrongly condemned, challenges racial bias in the criminal justice system. Free legal help for those who cannot afford it.", website: "https://eji.org", phone: "334-269-1803", focus: ["Wrongful Conviction", "Death Penalty", "Juvenile Justice", "Racial Justice History"], national: true },
      { name: "Lawyers' Committee for Civil Rights Under Law", description: "Uses legal advocacy to achieve racial justice, fighting discrimination in education, employment, housing, voting, and criminal justice.", website: "https://lawyerscommittee.org", phone: "202-662-8600", focus: ["Voting Rights", "Fair Housing", "Economic Justice", "Criminal Justice"], national: true },
      { name: "MALDEF (Mexican American Legal Defense and Educational Fund)", description: "The nation's leading Latino legal civil rights organization. Promotes social change through advocacy, communications, community education, and litigation.", website: "https://maldef.org", phone: "213-629-2512", focus: ["Immigration", "Education", "Employment", "Voting Rights", "Public Resource Equity"], national: true },
      { name: "Asian Americans Advancing Justice", description: "The nation's largest legal and civil rights organization for Asian Americans. Focuses on anti-Asian hate, immigration, voting rights, and community safety.", website: "https://advancingjustice-aajc.org", phone: "202-296-2300", focus: ["Anti-Hate", "Immigration", "Voting Rights", "Language Access"], national: true },
      { name: "National Congress of American Indians (NCAI)", description: "The oldest and largest organization protecting tribal sovereignty, treaty rights, and the interests of Native peoples. Advocacy at federal, state, and local levels.", website: "https://ncai.org", phone: "202-466-7767", focus: ["Tribal Sovereignty", "Treaty Rights", "Native Youth", "Health Equity"], national: true },
      { name: "Human Rights Campaign (HRC)", description: "The largest LGBTQ+ civil rights organization. Works for equal rights through lobbying, education, and grassroots campaigns. State-by-state equality scorecards and local resources.", website: "https://hrc.org", chapterFinder: "https://www.hrc.org/in-your-area", phone: "202-628-4160", focus: ["LGBTQ+ Equality", "Anti-Discrimination", "Healthcare Access", "Youth Safety"], national: true, stateCount: 50 },
    ],
  },
  {
    id: "legal-aid",
    label: "Legal Aid & Justice Reform",
    icon: Gavel,
    color: "text-red-400",
    bgColor: "bg-red-900/20",
    borderColor: "border-red-700/50",
    description: "Free and low-cost legal help, record expungement, wrongful conviction support, and justice reform organizations. Everyone deserves a fair shot — these organizations make sure the law works for everyone.",
    organizations: [
      { name: "Legal Services Corporation (LSC)", description: "Federally funded. The single largest funder of civil legal aid for low-income Americans. Find a local legal aid office that provides FREE civil legal help — housing, family, consumer, employment law.", website: "https://lsc.gov", chapterFinder: "https://www.lsc.gov/about-lsc/what-legal-aid/get-legal-help", phone: "202-295-1500", focus: ["Free Legal Help", "Housing", "Family Law", "Consumer Protection"], national: true, stateCount: 50 },
      { name: "Innocence Project", description: "Exonerates wrongfully convicted people through DNA testing and reforms the criminal justice system to prevent future injustice. Has freed 375+ people.", website: "https://innocenceproject.org", phone: "212-364-5340", focus: ["Wrongful Conviction", "DNA Evidence", "Criminal Justice Reform", "Post-Conviction"], national: true },
      { name: "National Reentry Resource Center", description: "The nation's primary source of information for reentry and criminal justice reform. Resources for formerly incarcerated people, families, and the organizations that serve them.", website: "https://nationalreentryresourcecenter.org", focus: ["Reentry Services", "Employment", "Housing", "Family Reunification"], national: true },
      { name: "Clean Slate Initiative", description: "Advancing state and federal policies that automatically clear eligible criminal records. Over 100 million Americans have a criminal record — Clean Slate helps them move forward.", website: "https://cleanslateinitiative.org", focus: ["Record Expungement", "Automatic Clearance", "Employment Access", "Housing Access"], national: true },
      { name: "Prison Policy Initiative", description: "Non-partisan research and advocacy organization that produces data and analysis on mass incarceration, money bail, prison conditions, and re-entry barriers.", website: "https://prisonpolicy.org", phone: "413-527-0845", focus: ["Mass Incarceration Data", "Bail Reform", "Prison Conditions", "Re-entry Barriers"], national: true },
      { name: "The Sentencing Project", description: "Promotes effective and humane responses to crime. Provides data, analysis, and advocacy to reduce the U.S. prison population and address racial disparities.", website: "https://sentencingproject.org", phone: "202-628-0871", focus: ["Sentencing Reform", "Racial Disparities", "Juvenile Justice", "Disenfranchisement"], national: true },
      { name: "National Legal Aid & Defender Association (NLADA)", description: "The oldest and largest national membership organization promoting equal access to justice. Connects people with public defenders and legal aid.", website: "https://nlada.org", phone: "202-452-0620", focus: ["Public Defense", "Civil Legal Aid", "Access to Justice", "Defender Training"], national: true },
    ],
  },
  {
    id: "chambers",
    label: "Chambers of Commerce",
    icon: Building2,
    color: "text-emerald-400",
    bgColor: "bg-emerald-900/20",
    borderColor: "border-emerald-700/50",
    description: "Business networks, economic development, and entrepreneurship support. Chambers of commerce connect businesses with resources, advocacy, and opportunities — especially critical for minority-owned businesses breaking barriers.",
    organizations: [
      { name: "U.S. Chamber of Commerce", description: "The world's largest business organization representing over 3 million businesses. Local chambers in every state provide networking, advocacy, and business development resources.", website: "https://uschamber.com", chapterFinder: "https://www.uschamber.com/co/chambers", phone: "202-659-6000", focus: ["Business Advocacy", "Economic Policy", "Small Business", "Workforce Development"], national: true, stateCount: 50 },
      { name: "National Black Chamber of Commerce (NBCC)", description: "Dedicated to the economic empowerment of Black-owned businesses. Over 190 affiliate chapters providing technical assistance, access to capital, and business development.", website: "https://nationalbcc.org", chapterFinder: "https://nationalbcc.org/membership/find-a-chapter", phone: "202-466-6888", focus: ["Black Business Development", "Access to Capital", "Technical Assistance", "Procurement"], national: true },
      { name: "U.S. Hispanic Chamber of Commerce (USHCC)", description: "Promotes Hispanic-owned businesses. Represents 4.37 million Hispanic-owned businesses contributing over $800 billion to the economy annually.", website: "https://ushcc.com", chapterFinder: "https://ushcc.com/local-hispanic-chambers/", phone: "202-842-1212", focus: ["Hispanic Business Growth", "Government Contracting", "Corporate Partnerships", "Policy Advocacy"], national: true },
      { name: "Asian/Pacific Islander American Chamber of Commerce", description: "Advocates for Asian American and Pacific Islander business community. Provides access to capital, business education, and networking opportunities.", website: "https://national-apacc.org", focus: ["AAPI Business Development", "Capital Access", "Mentoring", "Trade Development"], national: true },
      { name: "National LGBT Chamber of Commerce (NGLCC)", description: "The exclusive certifying body for LGBTQ+-owned businesses. Provides certification, corporate partnerships, and business development resources.", website: "https://nglcc.org", chapterFinder: "https://nglcc.org/affiliate-chambers", phone: "202-234-9181", focus: ["LGBTQ+ Business Certification", "Corporate Supplier Diversity", "Business Development", "Advocacy"], national: true },
      { name: "National Veteran-Owned Business Association (NaVOBA)", description: "Certifies veteran-owned businesses (SDVBE/VOB) and connects them with corporate and government buyers. Critical for veteran entrepreneurs.", website: "https://navoba.org", focus: ["Veteran Business Certification", "Government Contracting", "Corporate Procurement", "Business Development"], national: true },
      { name: "U.S. Women's Chamber of Commerce", description: "Supports women-owned businesses with training, certification, government contracting support, and policy advocacy for economic parity.", website: "https://uswcc.org", phone: "202-607-2488", focus: ["Women Business Certification", "Government Contracting", "Training", "Advocacy"], national: true },
      { name: "National Indian American Chamber of Commerce", description: "Promotes the business interests of Native American and American Indian communities. Connects tribal enterprises with mainstream business opportunities.", website: "https://nativeamericanchamber.com", focus: ["Native Business Development", "Tribal Enterprise", "Federal Contracting", "Economic Sovereignty"], national: true },
      { name: "Greater Austin Black Chamber of Commerce", description: "Austin's premier Black business network. Programs include business incubation, mentorship, procurement access, and community economic development.", website: "https://austinbcc.org", phone: "512-904-4117", focus: ["Austin Black Business", "Mentorship", "Procurement", "Community Development"], national: false },
      { name: "Greater Austin Hispanic Chamber of Commerce", description: "Empowers Austin's Hispanic business community. Provides networking, advocacy, and business development resources for over 3,000 members.", website: "https://gahcc.org", phone: "512-476-7502", focus: ["Austin Hispanic Business", "Networking", "Advocacy", "Economic Development"], national: false },
    ],
  },
  {
    id: "faith",
    label: "Faith-Based & Spiritual Organizations",
    icon: Church,
    color: "text-violet-400",
    bgColor: "bg-violet-900/20",
    borderColor: "border-violet-700/50",
    description: "Faith communities have always been the backbone of social justice. These organizations provide direct services — food, shelter, counseling, reentry support, youth mentoring — alongside spiritual care and community organizing.",
    organizations: [
      { name: "National Council of Churches (NCC)", description: "Represents 38 member communions (denominations) with 30+ million individual members. The leading voice of ecumenical Christianity in the U.S., focused on social justice, peace, and community.", website: "https://nationalcouncilofchurches.us", phone: "202-544-2350", focus: ["Ecumenical Unity", "Social Justice", "Poverty Reduction", "Mass Incarceration"], national: true },
      { name: "African Methodist Episcopal (AME) Church", description: "Founded in 1816 — the oldest independent Black denomination. Over 2.5 million members across 7,000+ congregations. Historically central to the civil rights movement.", website: "https://ame-church.com", focus: ["Black Community Development", "Social Justice", "Education", "Community Service"], national: true, stateCount: 39 },
      { name: "National Baptist Convention, USA", description: "The largest African American religious convention with approximately 7.5 million members across 31,000 churches. Focuses on education, foreign mission, and community development.", website: "https://nationalbaptist.com", focus: ["Education", "Community Development", "Youth Ministry", "Social Justice"], national: true },
      { name: "Catholic Charities USA", description: "One of the nation's largest social service networks. Serves over 15 million people annually through 2,700 agencies — food, shelter, disaster relief, immigration, counseling, and more. No religious requirement to receive services.", website: "https://catholiccharitiesusa.org", chapterFinder: "https://www.catholiccharitiesusa.org/find-help/", phone: "703-549-1390", focus: ["Poverty Reduction", "Immigration", "Disaster Relief", "Housing", "Counseling"], national: true, stateCount: 50 },
      { name: "The Salvation Army", description: "International faith-based organization providing disaster relief, homelessness services, anti-trafficking, addiction recovery, and after-school programs in thousands of U.S. locations.", website: "https://salvationarmyusa.org", chapterFinder: "https://www.salvationarmyusa.org/usn/plugins/gdoUnitPages498702/", phone: "1-800-725-2769", focus: ["Disaster Relief", "Homelessness", "Addiction Recovery", "Youth Programs"], national: true, stateCount: 50 },
      { name: "Prison Fellowship", description: "Founded by Chuck Colson. The nation's largest Christian nonprofit serving current and formerly incarcerated men, women, and their families. Programs in 800+ prisons.", website: "https://prisonfellowship.org", phone: "800-206-9764", focus: ["Prison Ministry", "Reentry Support", "Children of Incarcerated", "Criminal Justice Reform"], national: true },
      { name: "Islamic Society of North America (ISNA)", description: "The largest Muslim community organization in North America. Provides chaplaincy, education, community development, and interfaith dialogue programs.", website: "https://isna.net", phone: "317-839-8157", focus: ["Interfaith Dialogue", "Community Development", "Education", "Chaplaincy"], national: true },
      { name: "Jewish Family Services (JFS)", description: "Network of 125+ agencies providing social services regardless of religion — mental health counseling, food assistance, refugee resettlement, senior care, and family support.", website: "https://networkjewishfamilyservice.org", chapterFinder: "https://www.networkjewishfamilyservice.org/agency-members", focus: ["Mental Health", "Refugee Services", "Senior Care", "Food Assistance"], national: true },
      { name: "Bread for the World", description: "A collective Christian voice urging the nation's decision-makers to end hunger at home and abroad. Grassroots advocacy, policy research, and community organizing.", website: "https://bread.org", phone: "202-639-9400", focus: ["Hunger Advocacy", "Nutrition Policy", "Global Poverty", "Community Organizing"], national: true },
      { name: "Kairos Prison Ministry", description: "Interdenominational ministry present in over 500 correctional institutions. Short courses, mentoring, and aftercare for incarcerated individuals and their families.", website: "https://kairosprisonministry.org", phone: "407-629-4948", focus: ["Prison Ministry", "Mentoring", "Family Support", "Aftercare"], national: true },
    ],
  },
  {
    id: "veteran",
    label: "Veteran Services & Support",
    icon: Shield,
    color: "text-blue-400",
    bgColor: "bg-blue-900/20",
    borderColor: "border-blue-700/50",
    description: "Veteran suicide is not a single-point problem — it's a continuum from separation through crisis and into recovery. These organizations cover the full spectrum of veteran needs.",
    organizations: [
      { name: "U.S. Department of Veterans Affairs (VA)", description: "Federal agency providing healthcare, benefits, education (GI Bill), disability compensation, home loans, and burial services to veterans and families. Facilities in every state.", website: "https://va.gov", chapterFinder: "https://www.va.gov/find-locations/", phone: "1-800-827-1000", focus: ["Healthcare", "Benefits", "Education", "Disability", "Housing"], national: true, stateCount: 50 },
      { name: "Disabled American Veterans (DAV)", description: "1.3 million members. Free benefits assistance, transportation to VA, employment programs, and advocacy for all veterans. Free claims assistance — never charges for help.", website: "https://dav.org", chapterFinder: "https://www.dav.org/membership/chapters-and-departments/", phone: "877-426-2838", focus: ["Benefits Claims", "Transportation", "Employment", "Legislative Advocacy"], national: true, stateCount: 50 },
      { name: "Veterans of Foreign Wars (VFW)", description: "Oldest major veterans organization. 1.5 million members across 6,000+ posts. Service officers help with VA claims for free. Community service, youth scholarships, and legislative advocacy.", website: "https://vfw.org", chapterFinder: "https://www.vfw.org/find-a-post", phone: "816-756-3390", focus: ["VA Claims Assistance", "Community Service", "Youth Scholarships", "Legislation"], national: true, stateCount: 50 },
      { name: "Team Red White & Blue", description: "Enriches veterans' lives through physical and social activity. Local chapters host weekly social fitness events — running, CrossFit, yoga, community service — to combat isolation.", website: "https://teamrwb.org", chapterFinder: "https://members.teamrwb.org/", focus: ["Social Fitness", "Community", "Mental Health", "Transition Support"], national: true },
      { name: "Wounded Warrior Project", description: "Serves veterans and service members who incurred physical or mental injury post-9/11. Free programs in mental health, career counseling, long-term rehabilitation, and caregiver support.", website: "https://woundedwarriorproject.org", phone: "904-296-7350", focus: ["Mental Health", "Career Transition", "Physical Rehab", "Caregiver Support"], national: true },
      { name: "IAVA (Iraq and Afghanistan Veterans of America)", description: "Post-9/11 generation's leading veteran empowerment organization. Quick-reaction force for policy, community building, and direct services for the newest generation of veterans.", website: "https://iava.org", focus: ["Policy Advocacy", "Burn Pit Exposure", "Mental Health", "Community"], national: true },
      { name: "Cohen Veterans Network", description: "National network of mental health clinics providing high-quality, accessible, and integrated mental health care for post-9/11 veterans and their families. Sliding scale fees.", website: "https://cohenveteransnetwork.org", chapterFinder: "https://www.cohenveteransnetwork.org/clinics/", focus: ["Mental Health", "Family Therapy", "PTSD", "Anxiety & Depression"], national: true },
    ],
  },
  {
    id: "health",
    label: "Health & Wellness",
    icon: Stethoscope,
    color: "text-pink-400",
    bgColor: "bg-pink-900/20",
    borderColor: "border-pink-700/50",
    description: "Healthcare access for everyone — regardless of insurance status, income, or location. Community health centers, mental health resources, substance abuse treatment, and maternal health.",
    organizations: [
      { name: "SAMHSA (Substance Abuse & Mental Health Services Admin)", description: "Federal agency providing treatment locators, helplines, and grants. Free, confidential 24/7 helpline for substance abuse and mental health in English and Spanish.", website: "https://samhsa.gov", chapterFinder: "https://findtreatment.gov", phone: "1-800-662-4357", focus: ["Substance Abuse", "Mental Health", "Treatment Locator", "Prevention"], national: true, stateCount: 50 },
      { name: "NAMI (National Alliance on Mental Illness)", description: "The nation's largest grassroots mental health organization. Free support groups, education programs, and advocacy. Over 600 local affiliates and 48 state organizations.", website: "https://nami.org", chapterFinder: "https://www.nami.org/Your-Local-NAMI/Find-Your-Local-NAMI", phone: "1-800-950-6264", focus: ["Mental Health Support Groups", "Family Education", "Crisis Intervention", "Advocacy"], national: true, stateCount: 48 },
      { name: "Community Health Centers (HRSA)", description: "Federally Qualified Health Centers serving 30+ million people at 14,000+ sites. Provide primary care, dental, behavioral health, and pharmacy services on a sliding fee scale — no one turned away.", website: "https://findahealthcenter.hrsa.gov", chapterFinder: "https://findahealthcenter.hrsa.gov", phone: "1-877-464-4772", focus: ["Primary Care", "Dental", "Behavioral Health", "Sliding Scale"], national: true, stateCount: 50 },
      { name: "National Health Service Corps (NHSC)", description: "Places healthcare providers in underserved communities. If you're in a medically underserved area, NHSC-supported providers offer care on a sliding fee scale.", website: "https://nhsc.hrsa.gov", focus: ["Provider Placement", "Underserved Communities", "Loan Repayment", "Primary Care"], national: true },
      { name: "Planned Parenthood", description: "2.4 million patients at 600+ health centers. Reproductive healthcare, sex education, STI testing, cancer screenings. Sliding scale fees, many services free with Medicaid.", website: "https://plannedparenthood.org", chapterFinder: "https://www.plannedparenthood.org/health-center", phone: "1-800-230-7526", focus: ["Reproductive Health", "STI Testing", "Cancer Screening", "Sex Education"], national: true, stateCount: 50 },
    ],
  },
  {
    id: "housing",
    label: "Housing & Homelessness",
    icon: Home,
    color: "text-purple-400",
    bgColor: "bg-purple-900/20",
    borderColor: "border-purple-700/50",
    description: "Stable housing is the foundation of everything — employment, health, family stability, and reentry success. These organizations provide direct housing assistance, counseling, and advocacy.",
    organizations: [
      { name: "HUD (Housing and Urban Development)", description: "Federal agency overseeing housing assistance, fair housing enforcement, and homelessness prevention. Free housing counseling in every state through HUD-approved agencies.", website: "https://hud.gov", chapterFinder: "https://www.hud.gov/findhelp", phone: "1-800-569-4287", focus: ["Housing Assistance", "Fair Housing", "Homelessness Prevention", "Section 8"], national: true, stateCount: 50 },
      { name: "National Alliance to End Homelessness", description: "Policy-focused organization analyzing homelessness data, advocating for evidence-based solutions, and providing tools for local communities to end homelessness.", website: "https://endhomelessness.org", phone: "202-638-1526", focus: ["Policy Advocacy", "Data Analysis", "Community Solutions", "Rapid Re-Housing"], national: true },
      { name: "Habitat for Humanity", description: "Has helped more than 46 million people build or improve safe, affordable homes. Local affiliates accept applications from low-income families for homeownership and home repair.", website: "https://habitat.org", chapterFinder: "https://www.habitat.org/local/find-your-local-habitat", phone: "1-800-422-4828", focus: ["Homeownership", "Home Repair", "Affordable Housing", "Community Building"], national: true, stateCount: 50 },
      { name: "National Low Income Housing Coalition", description: "Research and advocacy focused on achieving socially just public policy that ensures people with the lowest incomes have affordable and decent homes.", website: "https://nlihc.org", phone: "202-662-1530", focus: ["Affordable Housing Policy", "Research", "Advocacy", "Rental Assistance"], national: true },
      { name: "Oxford House", description: "Network of 3,500+ self-supporting recovery houses in all 50 states. Democratically run — residents share expenses. No time limit. Critical for reentry and recovery housing.", website: "https://oxfordhouse.org", chapterFinder: "https://www.oxfordhouse.org/find-a-house", phone: "301-587-2916", focus: ["Recovery Housing", "Self-Supporting", "Reentry", "Sober Living"], national: true, stateCount: 50 },
    ],
  },
  {
    id: "employment",
    label: "Employment & Workforce",
    icon: Briefcase,
    color: "text-green-400",
    bgColor: "bg-green-900/20",
    borderColor: "border-green-700/50",
    description: "No one stays free without income. These organizations provide job training, fair-chance employment, career pathways for people with records, and workforce development for underserved communities.",
    organizations: [
      { name: "American Job Centers (CareerOneStop)", description: "Federally funded one-stop career centers in every state. Free job search help, resume writing, skills assessment, training referrals, and unemployment insurance. Over 2,400 locations.", website: "https://careeronestop.org", chapterFinder: "https://www.careeronestop.org/LocalHelp/AmericanJobCenters/find-american-job-centers.aspx", phone: "1-877-872-5627", focus: ["Job Search", "Skills Training", "Resume Help", "Career Counseling"], national: true, stateCount: 50 },
      { name: "Goodwill Industries International", description: "156 local organizations across the U.S. and Canada. Beyond thrift stores — career coaching, skills training, digital literacy, financial education, and job placement for people facing barriers.", website: "https://goodwill.org", chapterFinder: "https://www.goodwill.org/locator/", phone: "1-800-741-0186", focus: ["Career Coaching", "Skills Training", "Digital Literacy", "Job Placement"], national: true, stateCount: 50 },
      { name: "Center for Employment Opportunities (CEO)", description: "Immediate, paid employment for people recently released from incarceration. Transitional jobs with coaching, then placement into permanent, unsubsidized employment.", website: "https://ceoworks.org", phone: "212-422-4430", focus: ["Reentry Employment", "Transitional Jobs", "Career Coaching", "Fair Chance"], national: true },
      { name: "Dave's Killer Bread Foundation", description: "Second Chance Employment — helps employers hire people with criminal backgrounds. Tools, training, and technical assistance for creating fair-chance hiring policies.", website: "https://dkbfoundation.org", focus: ["Second Chance Employment", "Employer Education", "Fair Chance Hiring", "Reentry"], national: true },
      { name: "National HIRE Network", description: "Federal policy advocacy for people with criminal records seeking employment. Legal guides, know-your-rights resources, and state-by-state employment laws for people with records.", website: "https://hirenetwork.org", focus: ["Employment Rights", "Record Barriers", "Policy Advocacy", "Legal Guides"], national: true },
      { name: "Federal Bonding Program", description: "FREE fidelity bonds for employers who hire at-risk job applicants including ex-offenders, people in recovery, welfare recipients, and others. Removes the insurance barrier to hiring.", website: "https://bonds4jobs.com", focus: ["Free Bonding", "Employer Insurance", "At-Risk Employment", "Barrier Removal"], national: true, stateCount: 50 },
    ],
  },
  {
    id: "education",
    label: "Education & Literacy",
    icon: GraduationCap,
    color: "text-cyan-400",
    bgColor: "bg-cyan-900/20",
    borderColor: "border-cyan-700/50",
    description: "Education is the #1 protective factor against crime, poverty, and recidivism. These resources provide free learning opportunities from GED to college degrees, digital literacy, and financial education.",
    organizations: [
      { name: "Khan Academy", description: "Free, world-class education for anyone, anywhere. Courses in math, science, computing, economics, SAT prep, and more. Used by over 150 million learners worldwide.", website: "https://khanacademy.org", focus: ["Free Education", "Math", "Science", "SAT Prep", "Computing"], national: true },
      { name: "Federal Student Aid (FAFSA)", description: "Apply for federal student aid — Pell Grants, loans, and work-study. Since 2023, people with drug convictions can again receive federal student aid. Incarcerated people can receive Pell Grants for prison education.", website: "https://studentaid.gov", phone: "1-800-433-3243", focus: ["Pell Grants", "Student Loans", "Work-Study", "FAFSA"], national: true, stateCount: 50 },
      { name: "Coursera / edX (Free Courses)", description: "Access courses from top universities for free. Coursera for Campus and edX provide audit access to thousands of courses in business, technology, healthcare, and more.", website: "https://coursera.org", focus: ["University Courses", "Professional Certificates", "Technology", "Business"], national: true },
      { name: "National Center for Education Statistics (NCES)", description: "Primary federal entity for collecting and analyzing education data. Find schools, colleges, libraries, and education data for your community.", website: "https://nces.ed.gov", chapterFinder: "https://nces.ed.gov/ccd/schoolsearch/", focus: ["Education Data", "School Finder", "College Navigator", "Library Search"], national: true, stateCount: 50 },
      { name: "Literacy USA / ProLiteracy", description: "The largest adult literacy and basic education membership organization. Find local literacy programs offering free reading, writing, math, and English language instruction.", website: "https://proliteracy.org", chapterFinder: "https://www.proliteracy.org/what-we-do/find-a-program", focus: ["Adult Literacy", "ESL", "GED Prep", "Basic Education"], national: true },
    ],
  },
  {
    id: "family",
    label: "Family & Children Services",
    icon: Baby,
    color: "text-orange-400",
    bgColor: "bg-orange-900/20",
    borderColor: "border-orange-700/50",
    description: "Two-parent households below 60% → poverty above 17% — every case. Family stability is community stability. These organizations support parents, children, and family reunification.",
    organizations: [
      { name: "Head Start / Early Head Start", description: "Free early childhood education, health, nutrition, and parent engagement for children 0-5 from low-income families. Over 1,600 grantees serving nearly 1 million children.", website: "https://eclkc.ohs.acf.hhs.gov", chapterFinder: "https://eclkc.ohs.acf.hhs.gov/center-locator", phone: "1-866-763-6481", focus: ["Early Childhood", "Preschool", "Parent Support", "Nutrition"], national: true, stateCount: 50 },
      { name: "Boys & Girls Clubs of America", description: "4,700+ clubs serving 4.6 million young people. After-school programs, mentoring, academic support, career exploration, and leadership development for youth ages 6-18.", website: "https://bgca.org", chapterFinder: "https://www.bgca.org/get-involved/find-a-club", phone: "404-487-5700", focus: ["After-School Programs", "Mentoring", "Academic Support", "Youth Development"], national: true, stateCount: 50 },
      { name: "Big Brothers Big Sisters of America", description: "The nation's largest youth mentoring network. One-to-one mentoring for children ages 5-18 — community-based and school-based programs proven to improve outcomes.", website: "https://bbbs.org", chapterFinder: "https://www.bbbs.org/find-a-local-agency/", phone: "813-720-8778", focus: ["Youth Mentoring", "One-to-One", "School-Based", "Community-Based"], national: true },
      { name: "National Fatherhood Initiative", description: "Provides skill-building resources for fathers. Programs in prisons, communities, military, schools, and social service agencies. 24/7 Fatherhood resources.", website: "https://fatherhood.org", phone: "301-948-0599", focus: ["Father Engagement", "Prison Programs", "Parenting Skills", "Family Stability"], national: true },
      { name: "Children's Defense Fund", description: "Founded by Marian Wright Edelman. Champions policies and programs that lift children out of poverty, protect them from abuse, and ensure access to healthcare and education.", website: "https://childrensdefense.org", phone: "202-628-8787", focus: ["Child Poverty", "Healthcare", "Education", "Child Welfare"], national: true },
    ],
  },
  {
    id: "crisis",
    label: "Crisis & Emergency Services",
    icon: AlertTriangle,
    color: "text-red-400",
    bgColor: "bg-red-900/20",
    borderColor: "border-red-700/50",
    description: "When someone is in crisis, speed saves lives. These are the numbers and resources that work 24/7 — suicide prevention, domestic violence, sexual assault, substance abuse, child abuse, and trafficking.",
    organizations: [
      { name: "988 Suicide & Crisis Lifeline", description: "Call or text 988. Free, confidential 24/7 support for anyone in suicidal crisis or emotional distress. Veterans: press 1. Spanish: press 2. Deaf/hard of hearing: use TTY.", website: "https://988lifeline.org", phone: "988", focus: ["Suicide Prevention", "Crisis Support", "Veterans", "Deaf/HoH"], national: true, stateCount: 50 },
      { name: "National Domestic Violence Hotline", description: "24/7 confidential support for domestic violence victims. Safety planning, local shelter referrals, legal advocacy. Over 20 million calls answered since 1996.", website: "https://thehotline.org", phone: "1-800-799-7233", focus: ["Domestic Violence", "Safety Planning", "Shelter Referral", "Legal Advocacy"], national: true, stateCount: 50 },
      { name: "Crisis Text Line", description: "Text HOME to 741741. Free 24/7 crisis counseling via text message. Trained crisis counselors help with depression, anxiety, self-harm, suicidal thoughts, and any painful emotion.", website: "https://crisistextline.org", phone: "Text HOME to 741741", focus: ["Text-Based Crisis Support", "Youth", "Depression", "Anxiety"], national: true },
      { name: "RAINN (Rape, Abuse & Incest National Network)", description: "The nation's largest anti-sexual violence organization. Free, confidential 24/7 hotline, online chat, and local service provider referrals.", website: "https://rainn.org", phone: "1-800-656-4673", focus: ["Sexual Assault", "Survivor Support", "Prevention", "Policy"], national: true },
      { name: "National Human Trafficking Hotline", description: "24/7 confidential anti-trafficking hotline. Report tips, request services, ask for help. Connects victims with local services for safety, shelter, legal aid, and case management.", website: "https://humantraffickinghotline.org", phone: "1-888-373-7888", focus: ["Human Trafficking", "Victim Services", "Reporting", "Prevention"], national: true },
      { name: "National Child Abuse Hotline", description: "24/7 hotline for reporting suspected child abuse or neglect, or for parents seeking help. Professional crisis counselors provide intervention, referrals, and support.", website: "https://childhelp.org", phone: "1-800-422-4453", focus: ["Child Abuse", "Neglect Reporting", "Parent Support", "Crisis Intervention"], national: true },
    ],
  },
  {
    id: "ecosystem",
    label: "ThriveUp ACOS Ecosystem",
    icon: Layers,
    color: "text-cyan-400",
    bgColor: "bg-cyan-900/20",
    borderColor: "border-cyan-700/50",
    description: "The 24-platform ACOS ecosystem built by The Collaborative Advocate Foundation. Each platform serves a distinct role — together, they ensure no matter where someone is in their journey, there is always a next step. Never a dead end.",
    organizations: [
      { name: "ThriveUp Academy (ISSS)", description: "AI-powered K-12 and adult education platform with culturally responsive curriculum, SEL integration, STAAR prep, financial literacy, career pathways, and mentoring.", website: "/academy/hub", focus: ["K-12 Education", "SEL", "Financial Literacy", "Career Pathways"], national: true },
      { name: "Whole Person Health (WPH)", description: "Integrative health platform addressing physical, mental, social, and spiritual wellbeing. Community Health Worker dashboards, maternal health, preventive care.", website: "/health-wellness", focus: ["Integrative Health", "CHW", "Maternal Health", "Preventive Care"], national: true },
      { name: "SHIELD ATLAS", description: "Veteran and first responder crisis intervention, peer support, and transition services. Connected to 988 Veterans Crisis Line and local VA facilities.", website: "/ecosystem", focus: ["Veteran Crisis", "Peer Support", "Transition", "First Responders"], national: true },
      { name: "SafeReport", description: "Anonymous community safety reporting. Allows individuals to report concerns without fear of retaliation — school safety, workplace issues, community threats.", website: "/ecosystem", focus: ["Anonymous Reporting", "School Safety", "Workplace", "Community Safety"], national: true },
      { name: "LifeBridge", description: "Life transition aid connecting people in crisis with immediate resources — housing, food, employment, legal aid, mental health. The bridge between where you are and where you need to be.", website: "/ecosystem", focus: ["Life Transitions", "Crisis Resources", "Resource Navigation", "Warm Handoffs"], national: true },
      { name: "WholeMind AI", description: "Mental health and cognitive wellness platform with AI-guided interventions, mindfulness training, trauma-informed care modules, and peer support communities.", website: "/ecosystem", focus: ["Mental Health", "AI Interventions", "Mindfulness", "Trauma-Informed Care"], national: true },
      { name: "Perfectly Different", description: "Neurodiversity and disability inclusion platform. Accommodations support, strength-based assessments, IEP/504 guidance, and community for neurodivergent individuals.", website: "/ecosystem", focus: ["Neurodiversity", "Disability Inclusion", "IEP/504", "Accommodations"], national: true },
      { name: "M2C (Mentor to Career)", description: "Workforce mentoring pipeline connecting mentors with job seekers, particularly those re-entering from justice involvement. Employer partnerships and career coaching.", website: "/ecosystem", focus: ["Workforce Mentoring", "Career Coaching", "Reentry Employment", "Employer Partnerships"], national: true },
      { name: "Sankofa Health Suite", description: "Culturally responsive health platforms — Sankofa Feminine Health, Sankofa Maternal Health, and Sankofa Men's Health — addressing health disparities in communities of color.", website: "/ecosystem", focus: ["Feminine Health", "Maternal Health", "Men's Health", "Health Equity"], national: true },
      { name: "MCE (Minority Contracting Enterprise)", description: "Government and corporate contracting support for minority-owned businesses. Contract matching, bid preparation, compliance tracking, and capacity building.", website: "/mce-contracts", focus: ["Government Contracting", "Minority Business", "Bid Preparation", "Compliance"], national: true },
    ],
  },
];

const CATEGORY_FILTER_ALL = "all";

export default function CommunityResourceDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORY_FILTER_ALL);
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["civil-rights", "ecosystem"]));

  const toggleOrg = (key: string) => {
    setExpandedOrgs(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredCategories = useMemo(() => {
    let cats = RESOURCE_CATEGORIES;
    if (selectedCategory !== CATEGORY_FILTER_ALL) {
      cats = cats.filter(c => c.id === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      cats = cats.map(cat => ({
        ...cat,
        organizations: cat.organizations.filter(org =>
          org.name.toLowerCase().includes(q) ||
          org.description.toLowerCase().includes(q) ||
          org.focus.some(f => f.toLowerCase().includes(q))
        ),
      })).filter(cat => cat.organizations.length > 0);
    }
    return cats;
  }, [searchQuery, selectedCategory]);

  const totalOrgs = RESOURCE_CATEGORIES.reduce((sum, c) => sum + c.organizations.length, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="bg-gradient-to-r from-slate-900 via-amber-900/30 to-slate-900 border-b border-slate-700 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-amber-600/20 rounded-xl border border-amber-500/30">
              <HandHeart className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" data-testid="page-title">
                National Advocacy & Resource Directory
              </h1>
              <p className="text-sm text-amber-300">
                Every organization, every resource, every link — for every community that needs it
              </p>
            </div>
          </div>

          <Card className="p-4 bg-slate-800/60 border-amber-700/30 mb-4">
            <p className="text-sm text-slate-300 leading-relaxed">
              Great products do nothing if people can't use them. This directory puts{" "}
              <strong className="text-amber-300">{totalOrgs} organizations</strong> across{" "}
              <strong className="text-amber-300">{RESOURCE_CATEGORIES.length} categories</strong> at your fingertips — civil rights organizations like the ACLU and NAACP, chambers of commerce,
              faith-based organizations, veteran services, legal aid, and the full ThriveUp ACOS ecosystem. Every entry has a real website link, phone number where available,
              and chapter/location finders so you can connect with help in your community today.
            </p>
          </Card>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> All 50 States + DC</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {totalOrgs} Organizations</span>
            <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {RESOURCE_CATEGORIES.length} Categories</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> The Collaborative Advocate Foundation</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search organizations, services, or topics..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500"
              data-testid="input-search"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={selectedCategory === CATEGORY_FILTER_ALL ? "default" : "outline"}
              onClick={() => setSelectedCategory(CATEGORY_FILTER_ALL)}
              className="text-xs"
              data-testid="filter-all"
            >
              <Filter className="w-3 h-3 mr-1" /> All
            </Button>
            {RESOURCE_CATEGORIES.map(cat => (
              <Button
                key={cat.id}
                size="sm"
                variant={selectedCategory === cat.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat.id)}
                className="text-xs"
                data-testid={`filter-${cat.id}`}
              >
                <cat.icon className="w-3 h-3 mr-1" /> {cat.label.split("&")[0].trim()}
              </Button>
            ))}
          </div>
        </div>

        {filteredCategories.length === 0 && (
          <Card className="p-8 bg-slate-800/60 border-slate-700 text-center">
            <Search className="w-8 h-8 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">No organizations found matching "{searchQuery}"</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => { setSearchQuery(""); setSelectedCategory(CATEGORY_FILTER_ALL); }} data-testid="button-clear-search">
              Clear Search
            </Button>
          </Card>
        )}

        <div className="space-y-6">
          {filteredCategories.map(cat => (
            <div key={cat.id}>
              <button
                onClick={() => toggleCategory(cat.id)}
                className={`w-full p-5 rounded-lg border ${cat.borderColor} ${cat.bgColor} flex items-center justify-between text-left hover:opacity-90 transition-all`}
                data-testid={`category-${cat.id}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-slate-800/50 rounded-lg">
                    <cat.icon className={`w-6 h-6 ${cat.color}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      {cat.label}
                      <Badge variant="outline" className="text-xs">{cat.organizations.length} orgs</Badge>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{cat.description}</p>
                  </div>
                </div>
                {expandedCategories.has(cat.id) ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
              </button>

              {expandedCategories.has(cat.id) && (
                <div className="mt-3 space-y-3 pl-2">
                  <p className="text-sm text-slate-400 px-2">{cat.description}</p>
                  {cat.organizations.map((org, i) => {
                    const key = `${cat.id}-${i}`;
                    const isExpanded = expandedOrgs.has(key);
                    const isEcosystem = cat.id === "ecosystem";
                    return (
                      <Card key={i} className="bg-slate-800/60 border-slate-700 overflow-hidden" data-testid={`org-${cat.id}-${i}`}>
                        <button
                          onClick={() => toggleOrg(key)}
                          className="w-full p-4 flex items-start justify-between text-left hover:bg-slate-700/30 transition-all"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold text-white">{org.name}</h3>
                              {org.national && <Badge variant="outline" className="text-xs text-blue-400 border-blue-400/30">National</Badge>}
                              {org.stateCount && <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">{org.stateCount} states</Badge>}
                            </div>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{org.description}</p>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />}
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-3 border-t border-slate-700 pt-3">
                            <p className="text-xs text-slate-300 leading-relaxed">{org.description}</p>

                            <div className="flex flex-wrap gap-1">
                              {org.focus.map((f, j) => (
                                <Badge key={j} className="text-xs bg-slate-700/50 text-slate-300">{f}</Badge>
                              ))}
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                              {isEcosystem ? (
                                <Button size="sm" variant="outline" className="text-xs" asChild>
                                  <Link href={org.website}>
                                    <ArrowRight className="w-3 h-3 mr-1" /> Go to Platform
                                  </Link>
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" className="text-xs" asChild>
                                  <a href={org.website} target="_blank" rel="noopener noreferrer">
                                    <Globe className="w-3 h-3 mr-1" /> Visit Website
                                  </a>
                                </Button>
                              )}
                              {org.chapterFinder && (
                                <Button size="sm" variant="outline" className="text-xs" asChild>
                                  <a href={org.chapterFinder} target="_blank" rel="noopener noreferrer">
                                    <MapPin className="w-3 h-3 mr-1" /> Find Local Chapter
                                  </a>
                                </Button>
                              )}
                              {org.phone && (
                                <Button size="sm" variant="outline" className="text-xs" asChild>
                                  <a href={`tel:${org.phone.replace(/[^0-9+]/g, "")}`}>
                                    <Phone className="w-3 h-3 mr-1" /> {org.phone}
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <Card className="mt-8 p-6 bg-gradient-to-br from-cyan-900/20 to-slate-800/60 border-cyan-700/30">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-cyan-600/20 rounded-lg shrink-0">
              <Layers className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Connected to the ThriveUp ACOS Ecosystem</h3>
              <p className="text-sm text-slate-300 mb-3">
                Every resource on this page connects back to the 24-platform ACOS ecosystem. When someone finds the NAACP, they can also find a mentor through M2C. When they find legal aid, they can find housing through LifeBridge. When they find a church, they can find education through ThriveUp Academy. No dead ends. Just doors.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="text-xs" asChild>
                  <Link href="/ecosystem"><Layers className="w-3 h-3 mr-1" /> Ecosystem Connector</Link>
                </Button>
                <Button size="sm" variant="outline" className="text-xs" asChild>
                  <Link href="/ecosystem-hub-legacy"><ArrowRight className="w-3 h-3 mr-1" /> Ecosystem Hub</Link>
                </Button>
                <Button size="sm" variant="outline" className="text-xs" asChild>
                  <Link href="/justice-command-center"><Shield className="w-3 h-3 mr-1" /> Justice Command Center</Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-6 text-center text-xs text-slate-500 pb-8">
          <p>The Collaborative Advocate Foundation (501(c)(3)) | EIN: 41-3618003 | Dr. Terry Flood, Founder</p>
          <p className="mt-1">Veteran-founded. Black-led. Community-driven. 17912 Stefano Drive, Pflugerville, TX 78660</p>
        </div>
      </div>
    </div>
  );
}
