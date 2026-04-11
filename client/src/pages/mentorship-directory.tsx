import { useState, useMemo } from "react";
import { MapPin, Users, Heart, Briefcase, Shield, Scale, Brain, Paintbrush, Rocket, Search, Phone, Globe, Star, ChevronDown, ChevronUp, Loader2, Sparkles, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ProgramCategory =
  | "youth"
  | "men"
  | "women"
  | "stem"
  | "veteran"
  | "reentry"
  | "business"
  | "health"
  | "fatherhood"
  | "disability"
  | "arts"
  | "faith";

interface MentorshipProgram {
  id: string;
  name: string;
  organization: string;
  url: string;
  phone?: string;
  address?: string;
  category: ProgramCategory;
  categories: ProgramCategory[];
  zipCodes: string[];
  agesServed?: string;
  cost: string;
  description: string;
  programs: string[];
  badges: string[];
  impact?: string;
  ecosystemConnection?: string;
}

const categoryConfig: Record<ProgramCategory, { label: string; color: string; icon: React.ReactNode }> = {
  youth: { label: "Youth Mentoring", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: <Users className="w-5 h-5" /> },
  men: { label: "Men & Boys", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200", icon: <Shield className="w-5 h-5" /> },
  women: { label: "Women & Girls", color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200", icon: <Heart className="w-5 h-5" /> },
  stem: { label: "STEM & Technology", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200", icon: <Brain className="w-5 h-5" /> },
  veteran: { label: "Veterans", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: <Shield className="w-5 h-5" /> },
  reentry: { label: "Reentry & Justice", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200", icon: <Scale className="w-5 h-5" /> },
  business: { label: "Business & Entrepreneurship", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200", icon: <Briefcase className="w-5 h-5" /> },
  health: { label: "Health & Wellness", color: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200", icon: <Heart className="w-5 h-5" /> },
  fatherhood: { label: "Fatherhood", color: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200", icon: <Users className="w-5 h-5" /> },
  disability: { label: "Disability Services", color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200", icon: <Heart className="w-5 h-5" /> },
  arts: { label: "Arts & Creative", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", icon: <Paintbrush className="w-5 h-5" /> },
  faith: { label: "Faith-Based", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: <Star className="w-5 h-5" /> },
};

const mentorshipPrograms: MentorshipProgram[] = [
  {
    id: "100-black-men",
    name: "100 Black Men of Austin",
    organization: "100 Black Men of America, Inc. — Austin Chapter",
    url: "https://www.100blackmenaustin.org",
    phone: "",
    address: "Austin, TX (serves Central Texas)",
    category: "men",
    categories: ["men", "youth", "stem"],
    zipCodes: ["78702", "78721", "78723", "78741", "78744", "78752", "78753", "78660", "78664", "78665", "78681"],
    agesServed: "K-12 and Collegiate",
    cost: "Free",
    description: "Since 1995, 100 Black Men of Austin has inspired change by being the example. Focused on enhancing education and economic opportunities for young African-American men and women through mentorship, leadership development, and community engagement. Partners with Texas Empowerment Academy in East Austin.",
    programs: ["Saturday Leadership Academy (SLA)", "Collegiate 100", "Cultural Competency Initiative", "Stock Market Game", "Golf & Life Skills (PGA Tour/First Tee)", "STEM & Drone Training", "HBCU Scholarships", "Foster Care Bike Drive"],
    badges: ["Leadership", "STEM", "Financial Literacy", "Scholarships", "Cultural Competency", "Since 1995"],
    impact: "Lobbied to keep Black history in Texas curriculum. Registered 20,000 new voters. Built nearly 100 bikes for foster children.",
    ecosystemConnection: "Partner for TWC workforce grant (Neighborhood Champions model). ISSS youth pipeline. TheHealthyBlkMan health navigation.",
  },
  {
    id: "bbbs",
    name: "Big Brothers Big Sisters of Central Texas",
    organization: "BBBS Lone Star",
    url: "https://www.bigmentoring.org",
    phone: "(512) 472-5437",
    address: "4800 Manor Rd, Bldg K, Austin, TX 78723",
    category: "youth",
    categories: ["youth"],
    zipCodes: ["78702", "78721", "78723", "78741", "78744", "78745", "78748", "78752", "78753", "78758", "78660", "78664", "78665", "78681", "78613", "78626", "78634", "78641", "78610", "78640"],
    agesServed: "Ages 6-16",
    cost: "Free",
    description: "Creates caring, one-to-one relationships between children and adult volunteers serving as mentors, role models, and guides. Bigs and Littles meet in the community 3-4 times per month for a minimum of one year. Covers Travis, Williamson, and Hays counties.",
    programs: ["Community-Based Mentoring", "School-Based Mentoring", "Operation Bigs (Military Families)", "Sister to Sister", "Brother to Brother", "Promising Futures Scholarship"],
    badges: ["1-on-1 Mentoring", "Military Families", "Scholarships", "90,000 Hours/Year"],
    impact: "1,500 Littles served. 90,000 hours of mentoring annually — valued at nearly $2 million.",
    ecosystemConnection: "LifeBridge referral partner. Whole-Person Health crisis routing. ISSS wraparound services integration.",
  },
  {
    id: "aayhf",
    name: "African American Youth Harvest Foundation",
    organization: "AAYHF",
    url: "https://aayhf.org",
    phone: "(512) 428-4480",
    address: "6633 US-290 Suite 307, Austin, TX 78723",
    category: "youth",
    categories: ["youth", "men"],
    zipCodes: ["78702", "78721", "78723", "78741", "78744", "78752", "78753", "78660", "78664", "78665", "78681"],
    agesServed: "Youth (all ages)",
    cost: "Free",
    description: "Founded in 2007 to provide culturally competent, community-driven support for African American youth and families. Partners with the National CARES Mentoring Movement to connect mentors with youth. CEO Michael Lofton describes it as 'a one-stop-shop and ecosystem for support.'",
    programs: ["National CARES Mentoring Movement", "Small Group Mentoring", "1-on-1 Mentoring", "Community Resource Hub"],
    badges: ["Culturally Competent", "CARES Movement", "One-Stop-Shop", "Since 2007"],
    impact: "Central hub for African American youth mentorship in the Austin area.",
    ecosystemConnection: "Sankofa Health Network referral partner. LifeBridge SDOH navigation. Neighborhood Champions pipeline.",
  },
  {
    id: "young-austin",
    name: "Young Austin Project",
    organization: "Young Austin Project",
    url: "https://www.youngaustinproject.com",
    phone: "",
    address: "East Austin, TX",
    category: "youth",
    categories: ["youth", "reentry"],
    zipCodes: ["78702", "78721", "78723", "78741", "78744", "78745"],
    agesServed: "Teens & Young Adults",
    cost: "Free",
    description: "Mentors are Austin-born and Austin-raised — people who've walked the same streets, faced the same struggles, and lived the same stories as the youth they guide. Programs include soft skills training, career development, job placement, mentorship, and counseling for East Austin teens disconnected from resources due to gentrification.",
    programs: ["Soft Skills Training", "Career Development", "Job Placement", "Community Mentorship", "Fatherhood Initiative", "Counseling Services"],
    badges: ["East Austin Native Mentors", "Anti-Gentrification", "Career Pipeline", "Fatherhood"],
    ecosystemConnection: "TWC workforce pipeline. TheHealthyBlkMan peer connection. LifeBridge resource navigation.",
  },
  {
    id: "explore-austin",
    name: "Explore Austin",
    organization: "Explore Austin",
    url: "https://exploreaustin.org",
    phone: "",
    address: "Austin, TX 78744",
    category: "youth",
    categories: ["youth"],
    zipCodes: ["78744", "78741", "78745", "78748"],
    agesServed: "6th-12th Grade",
    cost: "Free",
    description: "Outdoor adventure-based mentoring and leadership development program. Connects underserved youth with caring adult mentors through outdoor experiences — hiking, camping, kayaking, and community service. Builds confidence, resilience, and environmental stewardship.",
    programs: ["Outdoor Adventure Mentoring", "Leadership Development", "Community Service Projects", "Environmental Education"],
    badges: ["Outdoor Adventure", "Leadership", "Environmental", "South Austin"],
  },
  {
    id: "friends-children",
    name: "Friends of the Children — Austin",
    organization: "Friends of the Children",
    url: "https://friendsaustin.org",
    phone: "",
    address: "East Austin, TX",
    category: "youth",
    categories: ["youth"],
    zipCodes: ["78702", "78721", "78723", "78741"],
    agesServed: "Ages 4-6 through high school (K-12 commitment)",
    cost: "Free",
    description: "Long-term professional mentoring — not volunteer-based. Paid, professional mentors ('Friends') are matched with children as early as age 4 and commit to walking alongside them through high school graduation. One of the most intensive mentoring models in the country, targeting the highest-risk youth.",
    programs: ["Professional Long-Term Mentoring (12+ years)", "K-12 Through Graduation Commitment", "Career Exposure", "Family Support"],
    badges: ["Professional Mentors", "12-Year Commitment", "Highest-Risk Youth", "Paid Staff"],
    impact: "83% of Friends of the Children graduates avoid the juvenile justice system. 93% avoid early parenting.",
    ecosystemConnection: "ISSS youth wraparound. Whole-Person Health mental wellness. LifeBridge family stabilization.",
  },
  {
    id: "aisd-mentoring",
    name: "Austin ISD Mentoring Network",
    organization: "Austin Independent School District",
    url: "https://www.austinisd.org/mentoring",
    phone: "",
    address: "All AISD Schools",
    category: "youth",
    categories: ["youth"],
    zipCodes: ["78702", "78704", "78721", "78723", "78741", "78744", "78745", "78748", "78752", "78753", "78758"],
    agesServed: "K-12 Students",
    cost: "Free",
    description: "District-wide school-based mentoring network connecting community volunteers with students across all AISD campuses. Mentors meet with students on campus during school hours. Includes training, background checks, and ongoing support for mentor-student pairs.",
    programs: ["School-Based Mentoring", "Lunch Buddy Program", "Academic Tutoring", "College & Career Readiness"],
    badges: ["All AISD Schools", "School-Based", "Background Checked", "District-Wide"],
    ecosystemConnection: "ISSS school integration. TWC workforce pipeline for high schoolers.",
  },
  {
    id: "seedling",
    name: "Seedling Mentor Program",
    organization: "Seedling Foundation",
    url: "https://www.seedlingmentors.org",
    phone: "",
    address: "Central Texas (120+ schools)",
    category: "youth",
    categories: ["youth", "reentry"],
    zipCodes: ["78702", "78721", "78723", "78741", "78744", "78745", "78748", "78752", "78753"],
    agesServed: "School-Age Children",
    cost: "Free",
    description: "Serves children who have a parent or family member who is incarcerated. Trained volunteer mentors meet with students weekly at school, providing stability, consistency, and a caring adult relationship during one of the most disruptive experiences a child can face.",
    programs: ["School-Based Mentoring for Children of Incarcerated Parents", "Weekly On-Campus Visits", "Mentor Training Program"],
    badges: ["Children of Incarcerated Parents", "120+ Schools", "Weekly Meetings", "Stability Focus"],
    impact: "Operating in 120+ schools across Central Texas.",
    ecosystemConnection: "ISSS wraparound. LifeBridge family navigation. Reentry coordination with justice-involved families.",
  },
  {
    id: "austin-angels",
    name: "Austin Angels — Dare to Dream",
    organization: "Austin Angels",
    url: "https://www.austinangels.com/daretodream.html",
    phone: "",
    address: "Austin, TX",
    category: "youth",
    categories: ["youth"],
    zipCodes: ["78702", "78721", "78723", "78741", "78744", "78745", "78748", "78752", "78753", "78758"],
    agesServed: "Ages 11-22 (Foster Care Youth)",
    cost: "Free",
    description: "Mentorship program specifically for youth in foster care ages 11-22. Matches young people with trained mentors who provide guidance through the challenges of aging out of the foster care system — housing, education, employment, and life skills.",
    programs: ["Dare to Dream Mentoring", "Foster Care Youth Support", "Aging Out Transition Support", "Life Skills Development"],
    badges: ["Foster Care Youth", "Ages 11-22", "Aging Out Support", "Life Skills"],
    ecosystemConnection: "LifeBridge housing/SDOH navigation. Workforce pipeline via TWC grant. Whole-Person Health crisis support.",
  },
  {
    id: "apie",
    name: "Austin Partners in Education (APIE)",
    organization: "APIE",
    url: "https://www.austinpartners.org",
    phone: "",
    address: "Austin, TX",
    category: "youth",
    categories: ["youth"],
    zipCodes: ["78702", "78704", "78721", "78723", "78741", "78744", "78745", "78748", "78752", "78753", "78758"],
    agesServed: "K-12 Students",
    cost: "Free",
    description: "Provides volunteer-based tutoring and mentoring in AISD schools with a focus on college and career readiness. Classroom coaching, math and reading tutoring, and one-on-one college readiness mentoring for students who may be first-generation college-goers.",
    programs: ["College Readiness Mentoring", "Classroom Coaching", "Math Tutoring", "Reading Tutoring"],
    badges: ["College Readiness", "First-Generation", "AISD Schools", "Tutoring + Mentoring"],
    ecosystemConnection: "ISSS academic support. TWC workforce readiness pipeline.",
  },
  {
    id: "austin-voices",
    name: "Austin Voices for Education & Youth",
    organization: "Austin Voices",
    url: "https://austinvoices.org",
    phone: "",
    address: "Austin, TX",
    category: "youth",
    categories: ["youth", "health"],
    zipCodes: ["78702", "78721", "78723", "78741", "78744", "78753"],
    agesServed: "K-12 Students & Families",
    cost: "Free",
    description: "Builds bridges between schools, families, and communities. Provides parent engagement, family resource navigation, and student mentoring programs with a focus on schools in historically under-resourced neighborhoods.",
    programs: ["Family Engagement", "Student Mentoring", "Community Schools Initiative", "Resource Navigation"],
    badges: ["Family Engagement", "Community Schools", "Under-Resourced Areas"],
    ecosystemConnection: "LifeBridge family resource navigation. ISSS school-family bridge.",
  },
  {
    id: "aaul-girl",
    name: "Austin Area Urban League — G.I.R.L. Program",
    organization: "Austin Area Urban League",
    url: "https://aaul.org/girl-mentorship-program/",
    phone: "",
    address: "Austin metro area",
    category: "women",
    categories: ["women", "youth"],
    zipCodes: ["78702", "78721", "78723", "78741", "78744", "78745", "78752", "78753", "78660", "78664", "78665", "78681"],
    agesServed: "Young Black Women/Girls",
    cost: "Free",
    description: "Running September through July, the G.I.R.L. (Growing Into Remarkable Leaders) program features monthly 1-on-1 meetings — in-person, virtual, phone, email, or social media — plus job shadowing, service-learning projects, and casual social interactions. Mentors complete training and a background check.",
    programs: ["1-on-1 Monthly Mentoring", "Job Shadowing", "Service-Learning Projects", "Leadership Development"],
    badges: ["Black Women & Girls", "Year-Long Program", "Job Shadowing", "Leadership"],
    ecosystemConnection: "HerHealth Network women's health navigation. Feminine Health Hub. Workforce pipeline via TWC grant.",
  },
  {
    id: "con-mi-madre",
    name: "Con Mi MADRE",
    organization: "Con Mi MADRE (Mothers and Daughters Raising Expectations)",
    url: "https://www.conmimadre.org",
    phone: "",
    address: "Austin, TX",
    category: "women",
    categories: ["women", "youth"],
    zipCodes: ["78741", "78744", "78745", "78748", "78753"],
    agesServed: "Latina Middle & High School Girls + Mothers",
    cost: "Free",
    description: "University of Texas-affiliated program increasing college-going rates among Latina girls by engaging both the student and her mother. Provides college prep workshops, campus visits, mother-daughter leadership development, career exploration, and STEM exposure with UT Austin Latina mentors.",
    programs: ["Mother-Daughter Mentoring", "College Prep Workshops", "Campus Visits", "Career & STEM Exploration", "Culturally Relevant Curriculum (English & Spanish)"],
    badges: ["Latina Girls + Mothers", "UT Austin Affiliated", "College Pipeline", "Bilingual"],
    ecosystemConnection: "LexiBridge language accessibility. ISSS family engagement model.",
  },
  {
    id: "mhec",
    name: "Maternal Health Equity Collaborative (MHEC)",
    organization: "Black Mamas ATX, Mama Sana, GALS, Healing Hands",
    url: "https://www.mhecatx.org",
    phone: "",
    address: "Central Texas",
    category: "health",
    categories: ["health", "women"],
    zipCodes: ["78702", "78721", "78723", "78741", "78744", "78745", "78748", "78753", "78660", "78664", "78665", "78681"],
    agesServed: "Pregnant & Postpartum Women",
    cost: "Free",
    description: "Collaboration of Black Mamas ATX, Mama Sana Vibrant Woman, Giving Austin Labor Support, and Healing Hands Community Doula Project advancing birth equity in Central Texas. Respite childcare (76 families served, 2,900 hours), Gap Fund ($25,000+ distributed), and advocacy that helped Austin win the Merck for Mothers Safer Childbirth Cities Grant.",
    programs: ["Community Doula Support", "Respite Childcare", "Gap Fund (Financial Support)", "Birth Equity Advocacy", "Peer Mentorship for New Mothers"],
    badges: ["Birth Equity", "Doula Support", "Black & Brown Families", "Merck Grant Recipient"],
    impact: "76 families served with 2,900 hours of childcare. $25,000+ distributed through Gap Fund.",
    ecosystemConnection: "Black Maternal Health Network clinical partner. HerHealth reproductive health. Whole-Person Health EPDS screening.",
  },
  {
    id: "black-mamas",
    name: "Black Mamas ATX",
    organization: "Black Mamas ATX",
    url: "https://blackmamasatx.com",
    phone: "",
    address: "Austin, TX",
    category: "health",
    categories: ["health", "women"],
    zipCodes: ["78702", "78721", "78723", "78741", "78744", "78753"],
    agesServed: "Black Mothers (Before, During, After Childbirth)",
    cost: "Free",
    description: "Mission: ensure Black women survive and thrive before, during, and after childbirth. Culturally-congruent doula training, monthly Mamas Support Groups, and evidence-based programming to reduce the 2.5x higher maternal death rate for Black mothers. Women receiving services stay an average of 18 months.",
    programs: ["Mamas Support Groups", "Doula Training", "Maternal Health Navigation", "Community Outreach"],
    badges: ["Black Maternal Health", "Doula Training", "18-Month Retention", "2.5x Disparity Focus"],
    impact: "Black mothers in Texas die at 2.5x the rate of white mothers. 21% of pregnancy-related deaths were Black mothers (2019-2020).",
    ecosystemConnection: "Black Maternal Health Network direct partner. CDMRP PRMRP letter of support potential. HerHealth reproductive domain.",
  },
  {
    id: "gals-doula",
    name: "Giving Austin Labor Support (GALS)",
    organization: "GALS",
    url: "https://www.givingaustinlaborsupport.org",
    phone: "",
    address: "Austin, TX",
    category: "health",
    categories: ["health", "women"],
    zipCodes: ["78702", "78721", "78723", "78741", "78744", "78745"],
    agesServed: "Pregnant Women (including incarcerated)",
    cost: "Free",
    description: "Provides free, on-call volunteer doula services to mothers including those in the Travis County Correctional Facility. Offers perinatal childcare for Black families and families of color during doctor's visits, mental health care, birth, and postpartum respite.",
    programs: ["Free Doula Services", "Incarcerated Mothers Doula Program", "Perinatal Childcare", "Postpartum Respite"],
    badges: ["Free Doulas", "Incarcerated Mothers", "Perinatal Support", "Volunteer-Based"],
    ecosystemConnection: "Black Maternal Health Network. Reentry coordination for justice-involved mothers.",
  },
  {
    id: "safe-fatherhood",
    name: "SAFE Alliance — Fatherhood Program",
    organization: "SAFE Alliance",
    url: "https://www.safeaustin.org/our-services/prevention-and-education/fatherhood/",
    phone: "",
    address: "Travis & Williamson County",
    category: "fatherhood",
    categories: ["fatherhood"],
    zipCodes: ["78702", "78721", "78723", "78741", "78744", "78745", "78748", "78752", "78753", "78758", "78660", "78664", "78665", "78681", "78613", "78626"],
    agesServed: "Fathers with children ages 0-11",
    cost: "Free",
    description: "Evidence-based parenting classes tailored for fathers and father figures with children aged 0-11 in Travis or Williamson County. Sessions focus on building healthy family relationships, emotional regulation, and coping strategies.",
    programs: ["Evidence-Based Parenting Classes", "Emotional Regulation Training", "Healthy Relationship Building", "Coping Strategies"],
    badges: ["Fathers & Father Figures", "Evidence-Based", "Ages 0-11", "Free Classes"],
    ecosystemConnection: "Dads Care 2 partner network. TheHealthyBlkMan men's health navigation. LifeBridge family stability.",
  },
  {
    id: "goodwill-fatherhood",
    name: "Goodwill Central Texas — Fatherhood Works",
    organization: "Goodwill Central Texas",
    url: "https://www.goodwillcentraltexas.org",
    phone: "",
    address: "Central Texas (metro-wide)",
    category: "fatherhood",
    categories: ["fatherhood", "reentry"],
    zipCodes: ["78702", "78721", "78723", "78741", "78744", "78745", "78748", "78752", "78753", "78758", "78660", "78664", "78665", "78681", "78613", "78610", "78640"],
    agesServed: "Fathers 18+ with children up to 24",
    cost: "Free",
    description: "Free program for dads and father figures providing parenting workshops, job search assistance, financial literacy training, and career certifications. Holistic approach supporting responsible parenting alongside economic self-sufficiency.",
    programs: ["Parenting Workshops", "Job Search Assistance", "Financial Literacy", "Career Certifications"],
    badges: ["Workforce + Parenting", "Career Certs", "Financial Literacy", "Free"],
    ecosystemConnection: "TWC workforce pipeline. Workforce dashboard integration. LifeBridge employment navigation.",
  },
  {
    id: "tori",
    name: "Texas Offenders Reentry Initiative (T.O.R.I.)",
    organization: "T.O.R.I.",
    url: "https://medc-tori.org",
    phone: "",
    address: "Austin, TX",
    category: "reentry",
    categories: ["reentry", "faith"],
    zipCodes: ["78702", "78721", "78723", "78741", "78744", "78745", "78752", "78753"],
    agesServed: "Returning Citizens (Adults)",
    cost: "Free",
    description: "Faith-based reentry program providing mentorship, job training, housing assistance, and comprehensive reentry support for formerly incarcerated individuals. Active graduating classes demonstrate pathway from incarceration to self-sufficiency.",
    programs: ["Reentry Mentoring", "Job Training", "Housing Assistance", "Life Skills", "Faith-Based Support"],
    badges: ["Reentry", "Faith-Based", "Job Training", "Housing"],
    ecosystemConnection: "Reentry Dashboard integration. LifeBridge SDOH navigation. Justice Command Center referral partner.",
  },
  {
    id: "atc-reentry",
    name: "Austin/Travis County Reentry Roundtable",
    organization: "A/TCRRT",
    url: "https://reentryroundtable.org",
    phone: "",
    address: "Travis County, TX (includes Pflugerville, Manor)",
    category: "reentry",
    categories: ["reentry"],
    zipCodes: ["78702", "78721", "78723", "78741", "78744", "78745", "78748", "78752", "78753", "78758", "78660", "78664", "78653"],
    agesServed: "Returning Citizens (Adults)",
    cost: "Free",
    description: "Partially funded by Travis County, the Roundtable brings public awareness and coordinates services for people returning from incarceration. Includes Executive Committee, Planning Committee, Evidence-Based Practice, Ex-offender, and Support Services subcommittees. Contact: info@reentryroundtable.org.",
    programs: ["Service Coordination", "Public Awareness", "Case Navigation", "Reentry Planning"],
    badges: ["Travis County Funded", "Coalition", "Service Navigation", "Updated April 2024"],
    ecosystemConnection: "Justice Command Center data partner. LifeBridge referral network. Workforce pipeline via TWC grant.",
  },
  {
    id: "travis-county-jprt",
    name: "Travis County Justice Planning Reentry Task Force",
    organization: "Travis County",
    url: "https://traviscountytx.gov/criminal-justice",
    phone: "",
    address: "Travis County, TX",
    category: "reentry",
    categories: ["reentry"],
    zipCodes: ["78702", "78721", "78723", "78741", "78744", "78745", "78748", "78752", "78753", "78758"],
    agesServed: "Adults with Criminal Records",
    cost: "Free",
    description: "Government program providing employment, workforce readiness, and reentry support to individuals with criminal records. Team of nine professionals ensures individuals struggling with barriers have everything they need to become productive Travis County residents.",
    programs: ["Employment Services", "Workforce Readiness", "Reentry Support", "Barrier Reduction"],
    badges: ["Government Program", "Employment Focus", "9-Person Team", "Travis County"],
    ecosystemConnection: "Justice Command Center government partner. Workforce dashboard integration.",
  },
  {
    id: "score-austin",
    name: "SCORE Austin",
    organization: "SCORE / U.S. Small Business Administration",
    url: "https://www.score.org/austin",
    phone: "(512) 928-2425",
    address: "Austin, TX (serves Central Texas metro)",
    category: "business",
    categories: ["business"],
    zipCodes: ["78701", "78702", "78704", "78721", "78723", "78741", "78744", "78745", "78748", "78752", "78753", "78758", "78660", "78664", "78665", "78681", "78613", "78626"],
    agesServed: "Adults (Business Owners & Entrepreneurs)",
    cost: "Free",
    description: "50+ volunteer mentors — experienced entrepreneurs, corporate managers, and executives — providing free small business counseling, low-cost workshops, and customized services. Backed by the U.S. Small Business Administration. Business owners who receive 3+ hours of mentoring report higher revenues.",
    programs: ["Free Business Counseling", "Business Plan Development", "Financing Guidance", "Women Entrepreneurs Conference", "HR & Operations Mentoring"],
    badges: ["SBA Backed", "50+ Mentors", "Free", "Business Plans"],
    impact: "One client secured a 5-year barbering contract at a military base serving 10,000 soldiers.",
    ecosystemConnection: "Pinnacle Business Conglomerate pipeline. Minority Center of Excellence. TWC entrepreneurship track.",
  },
  {
    id: "ati",
    name: "Austin Technology Incubator (ATI)",
    organization: "University of Texas at Austin",
    url: "https://ati.utexas.edu",
    phone: "",
    address: "Austin, TX",
    category: "business",
    categories: ["business", "stem"],
    zipCodes: ["78701", "78702", "78705", "78712"],
    agesServed: "Entrepreneurs & Founders",
    cost: "Varies",
    description: "Founded in 1989, ATI is the longest active technology incubator in the United States. Empowers university and community entrepreneurs through customized approaches to commercialize breakthrough innovations. Diversity and inclusion programs mentor minority founders.",
    programs: ["Startup Acceleration", "Technology Commercialization", "Minority Founder Mentoring", "Student Pitch Events"],
    badges: ["UT Austin", "Longest Active US Incubator", "Since 1989", "Tech Startups"],
    ecosystemConnection: "Pinnacle Business Conglomerate tech pipeline. Better Science Lab/RPLICE research commercialization.",
  },
  {
    id: "creative-action",
    name: "Creative Action",
    organization: "Creative Action",
    url: "https://creativeaction.org",
    phone: "",
    address: "Austin, TX",
    category: "arts",
    categories: ["arts", "youth"],
    zipCodes: ["78702", "78704", "78721", "78723", "78741", "78744", "78745", "78748"],
    agesServed: "PreK-18 (Paid teen programs 14-18)",
    cost: "Free/Affordable",
    description: "Largest arts education organization in Central Texas. 800+ weekly programming hours across six school districts, reaching 20,000+ youth annually. Young artists ages 14-18 can get paid to make visual art, theatre, or film. 75% of youth served are from low-income communities.",
    programs: ["Arts-Based Youth Development", "Teen Paid Programs (14-18)", "In-School Programs", "After-School Programs", "Social Justice Education"],
    badges: ["Largest in Central TX", "20,000+ Youth", "Paid Teen Programs", "75% Low-Income"],
    ecosystemConnection: "ISSS after-school programming. Video Creator AI content pipeline.",
  },
  {
    id: "bgcaa",
    name: "Boys & Girls Clubs of the Austin Area",
    organization: "BGCAA",
    url: "https://www.bgcaustin.org",
    phone: "",
    address: "28 locations across Austin metro",
    category: "youth",
    categories: ["youth", "stem"],
    zipCodes: ["78702", "78721", "78723", "78741", "78744", "78745", "78748", "78752", "78753", "78758", "78660", "78664", "78665", "78681", "78613", "78634", "78641", "78610", "78640"],
    agesServed: "Youth (K-12)",
    cost: "Free/Low Cost",
    description: "Over 10,000 youth annually across 28 club locations including the newly renovated Chalmers Courts Club in East Austin (doubled capacity). STEM Academy addresses the opportunity gap in applied sciences for underrepresented youth. Academic support, leadership development, athletics, and arts education.",
    programs: ["BGC Double A STEM Academy", "Academic Support & Tutoring", "Leadership Development", "Athletics", "Arts Education", "College Readiness"],
    badges: ["28 Locations", "10,000+ Youth", "STEM Academy", "East Austin Hub"],
    impact: "Chalmers Courts Club renovation doubled capacity. Expanded to eight Manor ISD elementary schools.",
    ecosystemConnection: "ISSS after-school partner. STEM pipeline for TWC workforce. Manor Hub community connection.",
  },
  {
    id: "arc-austin",
    name: "The Arc of the Capital Area",
    organization: "The Arc",
    url: "https://www.arcaustin.org",
    phone: "",
    address: "Austin, Hutto, Leander TX",
    category: "disability",
    categories: ["disability"],
    zipCodes: ["78731", "78634", "78641", "78748", "78758"],
    agesServed: "Adults with IDD",
    cost: "Varies",
    description: "Since 1949, empowering adults with intellectual and developmental disabilities. Serves 1,000+ individuals annually across 17 counties. Art and education programs emphasize self-determination, social skills, and employment readiness. Campuses in Austin, Hutto, and Leander.",
    programs: ["Employment Services", "Art & Education Program", "Caregiver Resources", "Volunteer Mentorship", "Self-Determination Training"],
    badges: ["Since 1949", "1,000+ Served", "17 Counties", "IDD Focus"],
    ecosystemConnection: "Perfectly Different neurodiversity pipeline. LifeBridge disability navigation. PillScheduler medication management.",
  },
  {
    id: "age-central-tx",
    name: "AGE of Central Texas",
    organization: "AGE of Central Texas",
    url: "https://ageofcentraltx.org",
    phone: "",
    address: "9400 Alice Mae Ln, Austin, TX 78748",
    category: "health",
    categories: ["health", "disability"],
    zipCodes: ["78748", "78745", "78741", "78744", "78758"],
    agesServed: "Older Adults & Caregivers",
    cost: "Free/Sliding Scale",
    description: "35+ years improving lives of older adults and caregivers. Support groups for general caregiving (in-person, South Austin), dementia caregiving (virtual), and early-stage memory loss. Adult day health care, caregiver education, and intergenerational programs.",
    programs: ["Caregiver Support Groups", "Adult Day Health Care", "Dementia Caregiving Support", "Caregiver Education", "Intergenerational Programs"],
    badges: ["35+ Years", "Caregiver Support", "Dementia Focus", "South Austin"],
    ecosystemConnection: "SafeCogniCare cognitive health. PillScheduler medication management. LifeBridge senior navigation.",
  },
  {
    id: "latinitas",
    name: "Latinitas",
    organization: "Latinitas",
    url: "https://latinitasmagazine.org",
    phone: "",
    address: "Austin, TX",
    category: "women",
    categories: ["women", "youth", "stem"],
    zipCodes: ["78702", "78704", "78721", "78741", "78744", "78745", "78748"],
    agesServed: "Girls Ages 9-14",
    cost: "Free/Low Cost",
    description: "Media, technology, and leadership mentoring for Latina girls. Programs include digital storytelling, coding workshops, entrepreneurship camps, and leadership development with a culturally affirming lens. Building the next generation of Latina innovators.",
    programs: ["Media & Digital Storytelling", "Coding Workshops", "Entrepreneurship Camps", "Leadership Development"],
    badges: ["Latina Girls", "Media & Tech", "Coding", "Entrepreneurship"],
    ecosystemConnection: "LexiBridge language accessibility. ISSS youth STEM pipeline.",
  },
  {
    id: "fountain-of-life",
    name: "Fountain of Life Ministries / Dads Care 2",
    organization: "Fountain of Life Ministries (Eric Hargrave)",
    url: "https://www.gofountain.org",
    phone: "",
    address: "Austin, TX (Cross-county — Manor, Pflugerville, Del Valle)",
    category: "fatherhood",
    categories: ["fatherhood", "faith", "reentry"],
    zipCodes: ["78702", "78721", "78723", "78741", "78744", "78660", "78653", "78617"],
    agesServed: "Fathers & Father Figures",
    cost: "Free",
    description: "Fatherhood empowerment, reentry support, workforce development, and parenting education. Operates father-specific benefits enrollment through fatherhood programming and mentoring. Cross-county reach serving fathers facing barriers like unemployment, incarceration reentry, housing instability, and child support challenges.",
    programs: ["Fatherhood Empowerment", "Reentry Support", "Workforce Development", "Parenting Education", "Benefits Enrollment"],
    badges: ["Faith-Based", "Fatherhood", "Reentry", "Cross-County"],
    ecosystemConnection: "Coalition partner (TWC RFA 32026-00162). TheHealthyBlkMan. LifeBridge benefits navigation. St. David's WAB2 partner.",
  },
];

const austinZipCodes = [...new Set(mentorshipPrograms.flatMap(p => p.zipCodes))].sort();

const austinMetroZips = new Set([
  "78660", "78664", "78665", "78681", "78717", "78728", "78729", "78750", "78753", "78758",
  "78759", "78613", "78626", "78628", "78633", "78634", "78641", "78642", "78645", "78646",
  "78652", "78653", "78654", "78669", "78610", "78612", "78615", "78616", "78617", "78619",
  "78621", "78640", "78644", "78648", "78656", "78659", "78662", "78666", "78667", "78676",
  "78680", "78682", "78683", "78691",
  ...austinZipCodes,
]);

function isAustinMetro(zip: string): boolean {
  return austinMetroZips.has(zip);
}

export default function MentorshipDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedZip, setSelectedZip] = useState<string>("all");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [zipSearch, setZipSearch] = useState("");
  const [aiResults, setAiResults] = useState<MentorshipProgram[]>([]);
  const [aiSearching, setAiSearching] = useState(false);
  const [aiSearchedZip, setAiSearchedZip] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"search" | "austin">("search");
  const { toast } = useToast();

  const handleNationwideSearch = async () => {
    if (!zipSearch || !/^\d{5}$/.test(zipSearch)) {
      toast({ title: "Enter a valid 5-digit zip code", variant: "destructive" });
      return;
    }
    setAiSearching(true);
    setAiResults([]);
    setAiSearchedZip(zipSearch);
    setActiveTab("search");
    try {
      const res = await apiRequest("POST", "/api/mentorship/search", {
        zipCode: zipSearch,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        query: searchQuery || undefined,
      });
      const data = await res.json();
      if (data.programs && Array.isArray(data.programs)) {
        const aiPrograms = data.programs as MentorshipProgram[];

        if (isAustinMetro(zipSearch)) {
          const aiNames = new Set(aiPrograms.map((p: MentorshipProgram) => p.name.toLowerCase()));
          const curatedToMerge = mentorshipPrograms.filter(
            (cp) => !aiNames.has(cp.name.toLowerCase())
          ).map(cp => ({ ...cp, ecosystemConnection: (cp.ecosystemConnection || "") + " [Curated Austin Program]" }));
          setAiResults([...curatedToMerge, ...aiPrograms]);
        } else {
          setAiResults(aiPrograms);
        }

        if (aiPrograms.length === 0 && !isAustinMetro(zipSearch)) {
          toast({ title: "No programs found for this area. Try a nearby zip code." });
        }
      }
    } catch (err: any) {
      toast({ title: "Search failed", description: err.message, variant: "destructive" });
    } finally {
      setAiSearching(false);
    }
  };

  const displayPrograms = activeTab === "austin" ? mentorshipPrograms : aiResults;

  const filteredPrograms = useMemo(() => {
    return displayPrograms.filter(program => {
      const matchesSearch = searchQuery === "" ||
        program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        program.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        program.programs.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === "all" || program.categories.includes(selectedCategory as ProgramCategory);
      const matchesZip = activeTab === "search" || selectedZip === "all" || program.zipCodes.includes(selectedZip);
      return matchesSearch && matchesCategory && matchesZip;
    });
  }, [searchQuery, selectedCategory, selectedZip, displayPrograms, activeTab]);

  const toggleExpanded = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const source = activeTab === "austin" ? mentorshipPrograms : aiResults;
    for (const cat of Object.keys(categoryConfig)) {
      counts[cat] = source.filter(p => p.categories.includes(cat as ProgramCategory)).length;
    }
    return counts;
  }, [activeTab, aiResults]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <Users className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent" data-testid="text-page-title">
              Nationwide Mentorship Directory
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto" data-testid="text-page-subtitle">
            Find real mentorship programs anywhere in the United States. Enter your zip code and we'll search for programs near you.
            These are not our programs — these are community partners we connect you to.
          </p>
        </div>

        <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">AI-Powered Mentorship Search</h3>
              <Badge variant="secondary" className="text-[10px]">Powered by Perplexity</Badge>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Enter any US zip code (e.g. 90210, 10001, 78702)"
                  value={zipSearch}
                  onChange={(e) => setZipSearch(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  className="pl-10 text-lg h-12"
                  onKeyDown={(e) => e.key === "Enter" && handleNationwideSearch()}
                  data-testid="input-zip-search"
                />
              </div>
              <Button
                onClick={handleNationwideSearch}
                disabled={aiSearching || zipSearch.length !== 5}
                className="h-12 px-8 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                data-testid="button-search-nationwide"
              >
                {aiSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {aiSearching ? "Searching..." : "Find Programs"}
              </Button>
            </div>
            {aiSearchedZip && !aiSearching && aiResults.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Found {aiResults.length} mentorship programs near <strong>{aiSearchedZip}</strong>
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "search" ? "default" : "outline"}
            onClick={() => setActiveTab("search")}
            className="gap-2"
            data-testid="tab-search-results"
          >
            <Sparkles className="w-4 h-4" />
            Search Results
            {aiResults.length > 0 && <Badge variant="secondary" className="ml-1">{aiResults.length}</Badge>}
          </Button>
          <Button
            variant={activeTab === "austin" ? "default" : "outline"}
            onClick={() => setActiveTab("austin")}
            className="gap-2"
            data-testid="tab-austin-curated"
          >
            <Zap className="w-4 h-4" />
            Austin Curated ({mentorshipPrograms.length})
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
          {Object.entries(categoryConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(selectedCategory === key ? "all" : key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === key
                  ? "ring-2 ring-primary shadow-md scale-105 " + config.color
                  : "bg-muted/50 hover:bg-muted text-muted-foreground"
              }`}
              data-testid={`filter-category-${key}`}
            >
              {config.icon}
              <span className="truncate">{config.label}</span>
              {categoryCounts[key] > 0 && <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">{categoryCounts[key]}</Badge>}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Filter by name, skill, population..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          {activeTab === "austin" && (
            <Select value={selectedZip} onValueChange={setSelectedZip}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-zip-code">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <SelectValue placeholder="All Zip Codes" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zip Codes</SelectItem>
                {austinZipCodes.map(zip => (
                  <SelectItem key={zip} value={zip}>{zip}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {(selectedCategory !== "all" || selectedZip !== "all" || searchQuery) && (
            <Button
              variant="ghost"
              onClick={() => { setSelectedCategory("all"); setSelectedZip("all"); setSearchQuery(""); }}
              className="text-sm"
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground" data-testid="text-result-count">
            {activeTab === "search" && !aiSearchedZip
              ? "Enter a zip code above to search for mentorship programs nationwide"
              : `Showing ${filteredPrograms.length} programs${activeTab === "search" && aiSearchedZip ? ` near ${aiSearchedZip}` : " (Austin curated)"}`
            }
          </p>
          {selectedZip !== "all" && activeTab === "austin" && (
            <Badge variant="outline" className="gap-1">
              <MapPin className="w-3 h-3" /> {selectedZip}
            </Badge>
          )}
        </div>

        {aiSearching && (
          <div className="text-center py-16">
            <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
            <h3 className="text-lg font-semibold mb-2">Searching for mentorship programs near {zipSearch}...</h3>
            <p className="text-muted-foreground">Powered by Perplexity AI — finding real, verified programs in your area.</p>
          </div>
        )}

        {activeTab === "search" && !aiSearchedZip && !aiSearching && (
          <div className="text-center py-16">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Search Any Zip Code in the U.S.</h3>
            <p className="text-muted-foreground mb-4">Enter a zip code above to discover mentorship programs near that location.</p>
            <p className="text-sm text-muted-foreground">Or switch to the <strong>Austin Curated</strong> tab to browse our {mentorshipPrograms.length} hand-verified Austin programs.</p>
          </div>
        )}

        <div className="grid gap-4">
          {!aiSearching && (activeTab === "austin" || (activeTab === "search" && aiSearchedZip)) && filteredPrograms.map((program) => {
            const isExpanded = expandedCards.has(program.id);
            const primaryCat = categoryConfig[program.category];
            return (
              <Card key={program.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-program-${program.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className={primaryCat.color + " text-xs"}>
                          {primaryCat.label}
                        </Badge>
                        {program.categories.filter(c => c !== program.category).map(cat => (
                          <Badge key={cat} variant="outline" className="text-[10px]">
                            {categoryConfig[cat].label}
                          </Badge>
                        ))}
                        {program.cost === "Free" && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-[10px]">Free</Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg leading-tight" data-testid={`text-program-name-${program.id}`}>
                        {program.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">{program.organization}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {program.url && (
                        <a href={program.url} target="_blank" rel="noopener noreferrer" data-testid={`link-website-${program.id}`}>
                          <Button variant="outline" size="sm" className="gap-1.5">
                            <Globe className="w-3.5 h-3.5" /> Website
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-foreground/80 mb-3" data-testid={`text-description-${program.id}`}>{program.description}</p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {program.badges.map((badge, i) => (
                      <Badge key={i} variant="secondary" className="text-[11px]">{badge}</Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
                    {program.agesServed && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {program.agesServed}
                      </span>
                    )}
                    {program.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {program.phone}
                      </span>
                    )}
                    {program.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {program.address}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {program.zipCodes.slice(0, isExpanded ? undefined : 5).map(zip => (
                      <Badge
                        key={zip}
                        variant="outline"
                        className={`text-[10px] cursor-pointer hover:bg-primary/10 ${selectedZip === zip ? "border-primary bg-primary/10" : ""}`}
                        onClick={() => {
                          if (activeTab === "austin") setSelectedZip(selectedZip === zip ? "all" : zip);
                        }}
                        data-testid={`badge-zip-${program.id}-${zip}`}
                      >
                        <MapPin className="w-2.5 h-2.5 mr-0.5" /> {zip}
                      </Badge>
                    ))}
                    {!isExpanded && program.zipCodes.length > 5 && (
                      <Badge variant="outline" className="text-[10px]">+{program.zipCodes.length - 5} more</Badge>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-3 border-t pt-3">
                      <div>
                        <h4 className="text-sm font-semibold mb-1.5">Programs & Services</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {program.programs.map((p, i) => (
                            <Badge key={i} className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[11px]">{p}</Badge>
                          ))}
                        </div>
                      </div>
                      {program.impact && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Impact</h4>
                          <p className="text-sm text-muted-foreground">{program.impact}</p>
                        </div>
                      )}
                      {program.ecosystemConnection && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">ThriveUp Ecosystem Connection</h4>
                          <p className="text-sm text-muted-foreground italic">{program.ecosystemConnection}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(program.id)}
                    className="mt-2 text-xs gap-1"
                    data-testid={`button-expand-${program.id}`}
                  >
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {isExpanded ? "Show Less" : "Show Programs & Impact"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!aiSearching && activeTab === "search" && aiSearchedZip && filteredPrograms.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No programs found near {aiSearchedZip}</h3>
            <p className="text-muted-foreground">Try a nearby zip code or adjust your category filter.</p>
          </div>
        )}
        {activeTab === "austin" && filteredPrograms.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Austin programs match your filter</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
          </div>
        )}

        <Card className="mt-8 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-2" data-testid="text-ecosystem-note-title">How ThriveUp Connects You</h3>
            <p className="text-sm text-muted-foreground mb-3">
              ThriveUp Academy does not run these mentorship programs. We are the connective tissue — our 24-platform ecosystem routes you to the right program based on your zip code, needs, and goals. When you engage with any of our platforms (LifeBridge, Whole-Person Health, ISSS, TheHealthyBlkMan, etc.), we identify mentorship needs and connect you directly to these community partners.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <Rocket className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
                <span><strong>Youth & Education:</strong> ISSS routes students to school-based mentors, after-school programs, and college readiness partners.</span>
              </div>
              <div className="flex items-start gap-2">
                <Briefcase className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                <span><strong>Workforce & Reentry:</strong> TWC grant pipeline connects to SCORE, Goodwill, T.O.R.I., and Travis County programs.</span>
              </div>
              <div className="flex items-start gap-2">
                <Heart className="w-4 h-4 mt-0.5 text-rose-500 shrink-0" />
                <span><strong>Health & Family:</strong> Health Network platforms route to MHEC, Black Mamas ATX, SAFE Fatherhood, and doula services.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>Austin curated data compiled from public sources. AI search results powered by Perplexity. Programs, availability, and eligibility may change.</p>
          <p className="mt-1">Know a mentorship program we should feature? Contact us through the Collaboration Hub.</p>
        </div>
      </div>
    </div>
  );
}
