// State Independent Living Program (Chafee) directory.
// Honest disclosure: where I have a verified official state agency landing URL,
// it is included. Where the named ILP coordinator phone is not yet verified,
// the field is left BLANK rather than fabricated. Federal floor (Medicaid to
// 26, ETV, FYI, FAFSA Independent, Pell, RHYA, SNAP, SSN, Passport) applies
// to ALL states uniformly and lives in benefits.tsx FEDERAL_BENEFITS.
//
// Naming convention: each state's child welfare agency landing page or, where
// the state has a dedicated youth/transition page, that page directly.
// "211" works in every state for warm benefits navigation.

export interface StateILP {
  code: string;
  name: string;
  agencyName: string;            // e.g. "Texas DFPS — Preparation for Adult Living"
  agencyUrl: string;             // verified official landing
  ilpCoordinator?: string;       // BLANK when not verified
  ilpPhone?: string;             // BLANK when not verified
  // Statute-based state benefits we know exist and link to. Empty array means
  // "federal floor only" — honest, not aspirational.
  stateExtras?: Array<{
    id: string;
    category: "housing" | "healthcare" | "education" | "income" | "id";
    title: string;
    url: string;
    phone?: string;
    blurb: string;
  }>;
}

export const STATE_ILP: StateILP[] = [
  { code: "AL", name: "Alabama", agencyName: "Alabama DHR — Independent Living", agencyUrl: "https://dhr.alabama.gov/child-welfare/" },
  { code: "AK", name: "Alaska", agencyName: "Alaska OCS — Independent Living Program", agencyUrl: "https://health.alaska.gov/en/division-of-family-and-community-services/office-of-childrens-services/" },
  { code: "AZ", name: "Arizona", agencyName: "Arizona DCS — Young Adult Program", agencyUrl: "https://dcs.az.gov/services/independent-living-program" },
  { code: "AR", name: "Arkansas", agencyName: "Arkansas DCFS — Transitional Youth Services", agencyUrl: "https://humanservices.arkansas.gov/divisions-shared-services/children-family-services/" },
  { code: "CA", name: "California", agencyName: "California ILP — Independent Living Program", agencyUrl: "https://www.cdss.ca.gov/inforesources/independent-living-program",
    stateExtras: [
      { id: "ca-thpp", category: "housing", title: "California THP-Plus & THP-NMD (Extended Foster Care to 21 / AB12)", url: "https://www.cdss.ca.gov/inforesources/foster-care/extended-foster-care", blurb: "Voluntary extended foster care to age 21 (AB12); transitional housing program for non-minor dependents." },
      { id: "ca-tuition", category: "education", title: "California Chafee ETV up to $5,000/yr (state-administered)", url: "https://www.csac.ca.gov/chafee-grant", blurb: "California-administered Chafee ETV. Apply through CSAC. Plus the Cal Grant program for any CA resident." },
    ],
  },
  { code: "CO", name: "Colorado", agencyName: "Colorado CDHS — Foster Youth in Transition", agencyUrl: "https://cdhs.colorado.gov/our-services/child-and-family-services/foster-care-and-adoption/foster-youth-in-transition" },
  { code: "CT", name: "Connecticut", agencyName: "Connecticut DCF — Adolescent & Juvenile Services", agencyUrl: "https://portal.ct.gov/dcf",
    stateExtras: [
      { id: "ct-tuition", category: "education", title: "Connecticut Tuition Waiver (UConn / CSCU) for foster youth", url: "https://portal.ct.gov/dcf", blurb: "Tuition waivers available at Connecticut public colleges for current/former foster youth — confirm current eligibility with DCF." },
    ],
  },
  { code: "DE", name: "Delaware", agencyName: "Delaware DSCYF — Office of Independent Living", agencyUrl: "https://kids.delaware.gov/" },
  { code: "DC", name: "District of Columbia", agencyName: "DC CFSA — Office of Youth Empowerment", agencyUrl: "https://cfsa.dc.gov/page/older-youth-services" },
  { code: "FL", name: "Florida", agencyName: "Florida DCF — Independent Living Services", agencyUrl: "https://www.myflfamilies.com/services/child-family/independent-living",
    stateExtras: [
      { id: "fl-pess", category: "income", title: "Florida PESS — Postsecondary Education Services & Support stipend", url: "https://www.myflfamilies.com/services/child-family/independent-living/financial-assistance", blurb: "Up to ~$1,720/mo for foster youth enrolled in postsecondary education, ages 18–23." },
      { id: "fl-tuition", category: "education", title: "Florida State Tuition Exemption (FS §1009.25)", url: "https://www.fldoe.org/", blurb: "Free tuition + fees at Florida public colleges for current/former foster youth." },
    ],
  },
  { code: "GA", name: "Georgia", agencyName: "Georgia DFCS — Independent Living Program (ILP/EYS)", agencyUrl: "https://dfcs.georgia.gov/services/independent-living-program-ilp" },
  { code: "HI", name: "Hawaii", agencyName: "Hawaii DHS — Imua Kakou (Voluntary Foster Care to 21)", agencyUrl: "https://humanservices.hawaii.gov/ssd/home/child-welfare-services/" },
  { code: "ID", name: "Idaho", agencyName: "Idaho DHW — Independent Living Program", agencyUrl: "https://healthandwelfare.idaho.gov/services-programs/children-families" },
  { code: "IL", name: "Illinois", agencyName: "Illinois DCFS — Youth in Transition", agencyUrl: "https://dcfs.illinois.gov/safe-kids/youth-in-care/transition-services.html" },
  { code: "IN", name: "Indiana", agencyName: "Indiana DCS — Older Youth Services", agencyUrl: "https://www.in.gov/dcs/child-welfare-manual/older-youth-services/",
    stateExtras: [
      { id: "in-fceea", category: "education", title: "Indiana FCEEA — Foster Care Education Equity Act (tuition + fees)", url: "https://www.in.gov/che/state-financial-aid/state-financial-aid-by-program/", blurb: "Tuition assistance for current/former Indiana foster youth at participating institutions." },
    ],
  },
  { code: "IA", name: "Iowa", agencyName: "Iowa HHS — Preparation for Adult Living (PAL)", agencyUrl: "https://hhs.iowa.gov/programs/welcome-iowa-hhs/families/foster-care-adoption" },
  { code: "KS", name: "Kansas", agencyName: "Kansas DCF — Independent Living Program", agencyUrl: "https://www.dcf.ks.gov/services/PPS/Pages/IL.aspx" },
  { code: "KY", name: "Kentucky", agencyName: "Kentucky DCBS — Independent Living", agencyUrl: "https://www.chfs.ky.gov/agencies/dcbs/dpp/Pages/independentliving.aspx",
    stateExtras: [
      { id: "ky-tuition", category: "education", title: "Kentucky Tuition Waiver (KRS 164.2847)", url: "https://kheaa.com/", blurb: "Tuition + mandatory fees waived at Kentucky public colleges for current/former foster youth." },
    ],
  },
  { code: "LA", name: "Louisiana", agencyName: "Louisiana DCFS — Young Adult Program", agencyUrl: "https://www.dcfs.louisiana.gov/page/young-adult-program" },
  { code: "ME", name: "Maine", agencyName: "Maine OCFS — Youth Transition Services", agencyUrl: "https://www.maine.gov/dhhs/ocfs" },
  { code: "MD", name: "Maryland", agencyName: "Maryland DHS — Ready by 21", agencyUrl: "https://dhs.maryland.gov/foster-care/" },
  { code: "MA", name: "Massachusetts", agencyName: "Massachusetts DCF — Adolescent Outreach Program", agencyUrl: "https://www.mass.gov/orgs/department-of-children-families",
    stateExtras: [
      { id: "ma-tuition", category: "education", title: "Massachusetts Tuition & Fee Waiver (state colleges) for DCF youth", url: "https://www.mass.gov/info-details/foster-child-grant-program", blurb: "Foster Child Grant covers tuition and fees at MA public colleges for current/former DCF youth." },
    ],
  },
  { code: "MI", name: "Michigan", agencyName: "Michigan MDHHS — Youth in Transition (YIT)", agencyUrl: "https://www.michigan.gov/mdhhs/adult-child-serv/foster-care/youth-in-transition",
    stateExtras: [
      { id: "mi-fyit", category: "education", title: "Michigan Fostering Futures Scholarship", url: "https://www.michigan.gov/mistudentaid", blurb: "Up to $3,000/yr for Michigan foster youth attending Michigan colleges." },
    ],
  },
  { code: "MN", name: "Minnesota", agencyName: "Minnesota DHS — Foster Care to 21", agencyUrl: "https://mn.gov/dhs/people-we-serve/children-and-families/services/adolescent-services/" },
  { code: "MS", name: "Mississippi", agencyName: "Mississippi MDCPS — Independent Living Program", agencyUrl: "https://www.mdcps.ms.gov/" },
  { code: "MO", name: "Missouri", agencyName: "Missouri DSS — Older Youth Transitional Services", agencyUrl: "https://dss.mo.gov/cd/older-youth-program/" },
  { code: "MT", name: "Montana", agencyName: "Montana CFSD — Independent Living Program", agencyUrl: "https://dphhs.mt.gov/cfsd" },
  { code: "NE", name: "Nebraska", agencyName: "Nebraska DHHS — Bridge to Independence (B2i)", agencyUrl: "https://dhhs.ne.gov/Pages/Bridge-to-Independence.aspx" },
  { code: "NV", name: "Nevada", agencyName: "Nevada DCFS — Independent Living Program", agencyUrl: "https://dcfs.nv.gov/Programs/CWS/IL/IndLivPro/" },
  { code: "NH", name: "New Hampshire", agencyName: "New Hampshire DCYF — Youth Transition Services", agencyUrl: "https://www.dhhs.nh.gov/programs-services/childcare-parenting-and-childbirth/dcyf" },
  { code: "NJ", name: "New Jersey", agencyName: "New Jersey DCF — Office of Adolescent Services", agencyUrl: "https://www.nj.gov/dcf/adolescent/" },
  { code: "NM", name: "New Mexico", agencyName: "New Mexico CYFD — Fostering Connections", agencyUrl: "https://www.cyfd.nm.gov/protective-services/fostering-connections/" },
  { code: "NY", name: "New York", agencyName: "New York OCFS — Independent Living", agencyUrl: "https://ocfs.ny.gov/programs/youth/independent-living/",
    stateExtras: [
      { id: "ny-tuition", category: "education", title: "New York TAP + Foster Youth College Success Initiative", url: "https://www.hesc.ny.gov/", blurb: "Need-based aid for NY residents; foster youth qualify as independent students at NYS public colleges." },
    ],
  },
  { code: "NC", name: "North Carolina", agencyName: "North Carolina DSS — LINKS / Foster Care 18 to 21", agencyUrl: "https://www.ncdhhs.gov/divisions/social-services/child-welfare-services/links-program",
    stateExtras: [
      { id: "nc-edu", category: "education", title: "NC Reach — full-tuition scholarship for NC foster youth at UNC/community colleges", url: "https://www.ncreach.org/", blurb: "Covers tuition, fees, room & board, books at NC public colleges for foster youth in custody at 18." },
    ],
  },
  { code: "ND", name: "North Dakota", agencyName: "North Dakota DHHS — Independent Living Program", agencyUrl: "https://www.hhs.nd.gov/cfs/foster-care" },
  { code: "OH", name: "Ohio", agencyName: "Ohio JFS — Bridges (Foster Care to 21)", agencyUrl: "https://bridgestosuccess.jfs.ohio.gov/" },
  { code: "OK", name: "Oklahoma", agencyName: "Oklahoma DHS — Successful Adulthood (SA) Program", agencyUrl: "https://oklahoma.gov/okdhs/services/cw/successful-adulthood.html",
    stateExtras: [
      { id: "ok-tuition", category: "education", title: "Oklahoma Tuition Waiver (70 O.S. §3230)", url: "https://www.okhighered.org/", blurb: "Tuition waiver for current/former Oklahoma foster youth at OK public colleges through age 26." },
    ],
  },
  { code: "OR", name: "Oregon", agencyName: "Oregon DHS — Independent Living Program (ILP)", agencyUrl: "https://www.oregon.gov/odhs/foster-care/Pages/ilp.aspx",
    stateExtras: [
      { id: "or-tuition", category: "education", title: "Oregon Foster Youth Tuition & Fee Waiver (community + university)", url: "https://oregonstudentaid.gov/", blurb: "Tuition + fees waived at OR public community colleges and universities for foster youth." },
    ],
  },
  { code: "PA", name: "Pennsylvania", agencyName: "Pennsylvania DHS — Independent Living", agencyUrl: "https://www.dhs.pa.gov/Services/Children/Pages/Foster-Care-Independent-Living.aspx",
    stateExtras: [
      { id: "pa-fy2c", category: "education", title: "Pennsylvania Fostering Independence Tuition Waiver (Act 16 of 2019)", url: "https://www.education.pa.gov/", blurb: "Tuition + fees waived at PA public/private colleges for foster youth, up to age 26." },
    ],
  },
  { code: "RI", name: "Rhode Island", agencyName: "Rhode Island DCYF — Office of Youth Development", agencyUrl: "https://dcyf.ri.gov/" },
  { code: "SC", name: "South Carolina", agencyName: "South Carolina DSS — Independent Living Program", agencyUrl: "https://dss.sc.gov/foster-care-and-adoption/" },
  { code: "SD", name: "South Dakota", agencyName: "South Dakota DSS — Independent Living Program", agencyUrl: "https://dss.sd.gov/childprotection/" },
  { code: "TN", name: "Tennessee", agencyName: "Tennessee DCS — Independent Living / Extension of Foster Care", agencyUrl: "https://www.tn.gov/dcs/program-areas/youth-in-transition.html",
    stateExtras: [
      { id: "tn-promise", category: "education", title: "Tennessee Promise + ETSU/UT Foster Youth Programs", url: "https://www.tn.gov/tnpromise.html", blurb: "TN Promise covers community college tuition; foster youth qualify for additional state-administered ETV." },
    ],
  },
  { code: "TX", name: "Texas", agencyName: "Texas DFPS — Preparation for Adult Living (PAL)", agencyUrl: "https://www.dfps.texas.gov/Child_Protection/Youth/Preparation_for_Adult_Living.asp", ilpPhone: "1-800-720-7777",
    stateExtras: [
      { id: "tx-pal", category: "income", title: "Texas PAL transitional living allowance + life skills", url: "https://www.dfps.texas.gov/Child_Protection/Youth/Preparation_for_Adult_Living.asp", phone: "1-800-720-7777", blurb: "Texas's Chafee program. Up to ~$1,000/mo transitional living allowance for qualifying youth." },
      { id: "tx-extended", category: "housing", title: "Texas Extended Foster Care to age 21", url: "https://www.dfps.texas.gov/Child_Protection/Youth/Extended_Foster_Care.asp", blurb: "Voluntary extension. Sign before your 18th birthday or re-enter between 18 and 21." },
      { id: "tx-tuition", category: "education", title: "Texas Tuition & Fee Waiver — public colleges (TEC §54.366)", url: "https://www.collegeforalltexans.com/index.cfm?ObjectID=A3119543-FA2E-7B91-1D86027F47AA8AC8", blurb: "Tuition + mandatory fees waived at any Texas public college. Up to age 25 if continuously enrolled." },
      { id: "tx-id", category: "id", title: "Texas DPS ID/License Fee Waiver (Transp. Code §521.1811)", url: "https://www.dps.texas.gov/section/driver-license", blurb: "Free state ID or driver's license under 21 if in foster care at age 16+." },
      { id: "tx-medicaid", category: "healthcare", title: "Texas Medicaid (FFCC) — Your Texas Benefits", url: "https://www.yourtexasbenefits.com/", phone: "2-1-1", blurb: "Choose 'Former Foster Care Children' category." },
      { id: "tx-snap", category: "income", title: "Texas SNAP — Your Texas Benefits", url: "https://www.yourtexasbenefits.com/", phone: "2-1-1", blurb: "Apply for SNAP, TANF, CHIP, and Medicaid in one application." },
    ],
  },
  { code: "UT", name: "Utah", agencyName: "Utah DCFS — Transition to Adult Living (TAL)", agencyUrl: "https://dcfs.utah.gov/services/youth-services/" },
  { code: "VT", name: "Vermont", agencyName: "Vermont DCF — Youth Development Program", agencyUrl: "https://dcf.vermont.gov/fsd/youth-development" },
  { code: "VA", name: "Virginia", agencyName: "Virginia DSS — Fostering Futures (Foster Care to 21)", agencyUrl: "https://www.dss.virginia.gov/family/fc/futures.cgi",
    stateExtras: [
      { id: "va-tuition", category: "education", title: "Virginia Tuition Waiver (Code §23.1-624) — Great Aspirations Scholarship", url: "https://www.schev.edu/", blurb: "Tuition + fees waived at VA public colleges for foster youth + youth adopted from VA foster care." },
    ],
  },
  { code: "WA", name: "Washington", agencyName: "Washington DCYF — Independent Living Program", agencyUrl: "https://www.dcyf.wa.gov/services/youth-transition-success/independent-living-services",
    stateExtras: [
      { id: "wa-passport", category: "education", title: "Washington Passport to Careers", url: "https://wsac.wa.gov/passport", blurb: "Up to ~$13,500/yr scholarship + support for WA foster youth at colleges or apprenticeships." },
    ],
  },
  { code: "WV", name: "West Virginia", agencyName: "West Virginia DHHR — Modified Adoption / Transitional Living", agencyUrl: "https://dhhr.wv.gov/bcf/" },
  { code: "WI", name: "Wisconsin", agencyName: "Wisconsin DCF — Youth Transitioning Out of Foster Care", agencyUrl: "https://dcf.wisconsin.gov/youthservices" },
  { code: "WY", name: "Wyoming", agencyName: "Wyoming DFS — Independent Living Program", agencyUrl: "https://dfs.wyo.gov/protective-services/foster-care/" },
];
