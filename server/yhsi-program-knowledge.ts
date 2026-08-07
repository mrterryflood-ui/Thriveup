// ── Foster Youth Program Knowledge Base ──────────────────────────────────────
// Every fact here is sourced from documents uploaded to this project:
//  [MV]  "McKinney-Vento Act: Quick Reference" (SchoolHouse Connection, Aug 2024)
//        — 42 U.S.C. § 11431 et seq. citations included per item.
//  [CH]  "John H. Chafee Foster Care Program for Successful Transition to
//        Adulthood" (ACF/acf.gov, current as of July 24, 2026).
// Do NOT add facts without a source document. No invented statistics.

export const PROGRAM_GUIDE = {
  sources: [
    {
      id: "mckinney_vento",
      title: "McKinney-Vento Act: Quick Reference (August 2024)",
      publisher: "SchoolHouse Connection",
      law: "42 U.S.C. § 11431 et seq.",
    },
    {
      id: "chafee",
      title: "John H. Chafee Foster Care Program for Successful Transition to Adulthood",
      publisher: "Administration for Children and Families (acf.gov)",
      law: "Title IV-E",
      currentAsOf: "2026-07-24",
    },
  ],

  mckinneyVento: {
    whoQualifies: {
      summary: "You qualify if you lack a fixed, regular, and adequate nighttime residence — including staying with others after losing housing (\"doubled up\"), living in motels, campgrounds, shelters, transitional housing, cars, parks, or substandard housing.",
      citation: "42 U.S.C. §11434a(2)",
      unaccompaniedYouth: "\"Unaccompanied youth\" means you are not in the physical custody of a parent or guardian — you have these rights on your own, without an adult.",
      unaccompaniedCitation: "42 U.S.C. §11434a(6)",
    },
    rights: [
      { right: "Immediate school enrollment", detail: "You must be enrolled in school immediately, even without documents and even if you missed enrollment deadlines.", citation: "42 U.S.C. §11432(g)(3)(C)" },
      { right: "Stay in your school of origin", detail: "You can stay in the same school for the whole time you are homeless — and through the end of the school year after you get permanent housing — if it's in your best interest. The law presumes it is.", citation: "42 U.S.C. §11432(g)(3)(A)-(B)" },
      { right: "Transportation to school", detail: "The school district must provide transportation to your school of origin, including until the end of the year after you get permanent housing.", citation: "42 U.S.C. §11432(g)(1)(J)(iii)" },
      { right: "Enrolled during any dispute", detail: "If there's a disagreement about your enrollment, you attend the school you chose while it's resolved — including all appeals.", citation: "42 U.S.C. §11432(g)(3)(E)(i)" },
      { right: "Independent student status for FAFSA", detail: "If you're an unaccompanied homeless youth, the school liaison must inform you of — and give you verification of — your status as an independent student for college financial aid. You do not need parent information on the FAFSA.", citation: "42 U.S.C. §11432(g)(6)(A)(x)(III)" },
      { right: "Credit for coursework you completed", detail: "States must identify and remove barriers so you receive appropriate credit for full or partial coursework completed at a prior school.", citation: "42 U.S.C. §11432(g)(1)(F)(ii)" },
      { right: "Referrals to services", detail: "The school liaison must refer you and your family to health, dental, mental health, housing, and substance abuse services.", citation: "42 U.S.C. §11432(g)(6)(A)(iv)" },
      { right: "Full participation", detail: "\"Enrollment\" means attending classes AND participating fully in school activities — sports and extracurriculars included. Barriers from fees, fines, and absences must be removed.", citation: "42 U.S.C. §11434A(1); §11432(g)(1)(I)" },
      { right: "A liaison in every district", detail: "Every school district must have a designated homeless liaison responsible for identifying and enrolling you and making sure you have a full and equal opportunity to succeed.", citation: "42 U.S.C. §11432(g)(1)(J)(ii); §§11432(g)(6)(A)(i)-(ii)" },
      { right: "College counseling", detail: "State plans must describe how you'll receive help from school counselors to prepare and improve readiness for college.", citation: "42 U.S.C. §11432(g)(1)(K)" },
    ],
    preschool: { detail: "School of origin rights include preschools, and liaisons must ensure access to Head Start, Early Head Start, and IDEA Part C early intervention for eligible children.", citation: "42 U.S.C. §11432(g)(3)(I); §11432(g)(3)(C)" },
  },

  chafee: {
    description: "The Chafee program funds support for youth in or formerly in foster care transitioning to adulthood: education, employment, financial management, housing, emotional support, and assured connections to caring adults. Funded at $143 million/year nationally; services vary by state and agency.",
    eligibility: [
      "Youth in foster care, ages 14 and older",
      "Young people in or formerly in foster care, ages 18 to 21 (up to 23 in some states)",
      "Youth who left foster care through adoption or guardianship at age 16 or older",
      "Youth likely to remain in foster care until 18",
    ],
    age23Note: "31 states plus DC and Puerto Rico serve young people up to age 23. Kansas is NOT on that list, so Chafee services in Kansas run to age 21. (States on the list include CO, CT, DE, FL, HI, ID, IL, IN, IA, KY, LA, ME, MD, MA, MI, MN, MO, NE, NM, NY, NH, ND, OR, PA, TN, UT, VT, VA, WA, WV, WI.)",
    etv: {
      description: "The Education and Training Voucher (ETV) program — about $43 million/year nationally — pays for post-secondary education and training for young adults who experienced foster care after age 14.",
      maxPerYear: 5000,
      maxYears: 5,
      maxAge: 26,
      detail: "Up to $5,000 per year toward unmet cost of attendance, available up to age 26, for no more than 5 total years.",
    },
    nytd: "States receiving Chafee funding must submit data to the National Youth in Transition Database (NYTD) on services provided and outcomes experienced.",
    howToAccess: "Contact your local child welfare agency or state program manager. In this program, staff track every youth's Chafee and ETV access in the entitlements tracker so no one misses what they're entitled to.",
  },
} as const;

// Compact, citation-backed digest for the Navigator's [YOUTH MODE] system
// prompt — keeps the AI grounded in the actual law, not its training data.
export const YOUTH_MODE_KNOWLEDGE = `
GROUNDED PROGRAM FACTS (from uploaded source documents — cite these, do not improvise):
- McKinney-Vento (42 U.S.C. §11431 et seq.): homeless students (including doubled-up, motels, cars, shelters) have the right to IMMEDIATE school enrollment without documents (§11432(g)(3)(C)); to stay in their school of origin with transportation provided (§11432(g)(3)(A), §11432(g)(1)(J)(iii)); to remain enrolled during disputes (§11432(g)(3)(E)(i)); and unaccompanied youth must receive verification of INDEPENDENT STUDENT status for FAFSA — no parent info needed (§11432(g)(6)(A)(x)(III)). Every school district has a homeless liaison required to help (§11432(g)(1)(J)(ii)).
- Chafee (Title IV-E, ACF): supports youth in/formerly in foster care ages 14+, and ages 18-21 in Kansas (Kansas is not among the 31 states serving to 23). Youth who left care through adoption/guardianship at 16+ also qualify. Covers education, employment, housing, financial management, and connections to caring adults.
- ETV: up to $5,000/year for post-secondary education/training, to age 26, max 5 years total, for youth who experienced foster care after age 14.
- Access route: local child welfare agency or state program manager; school district homeless liaison for McKinney-Vento rights.
- ON THIS PLATFORM (real, free, no signup): trade simulations at /academy/trade-sims (electrical, plumbing, HVAC, welding, automotive), career explorer at /academy/careers, workforce training tracker at /workforce-training, childcare careers at /child-care-workforce, and the full rights guide at /youth-rights. ETV can fund post-secondary training in these fields — help the youth build a plan to take to their child welfare agency. Never invent training providers or promise ETV approval; the agency decides.`;
