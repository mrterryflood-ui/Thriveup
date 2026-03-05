
export interface StateResource {
  state: string;
  stateCode: string;
  category: string;
  subcategory: string;
  name: string;
  description: string;
  url: string;
  phone?: string;
  address?: string;
  eligibility?: string;
  ageRange?: string;
  tags: string[];
}

export interface ResourceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  subcategories: string[];
}

export const RESOURCE_CATEGORIES: ResourceCategory[] = [
  {
    id: "workforce",
    name: "Workforce Development",
    description: "Job training, career readiness, and employment services",
    icon: "Briefcase",
    subcategories: ["American Job Centers", "Job Training Programs", "WIOA Programs", "Youth Employment", "Apprenticeships", "Vocational Rehabilitation"]
  },
  {
    id: "education",
    name: "Education & Scholarships",
    description: "College prep, financial aid, scholarships, and GED programs",
    icon: "GraduationCap",
    subcategories: ["Financial Aid (FAFSA)", "Scholarships", "Community Colleges", "Trade Schools", "GED Programs", "Tutoring & Mentoring"]
  },
  {
    id: "housing",
    name: "Housing Assistance",
    description: "Affordable housing, rental assistance, and homelessness prevention",
    icon: "Home",
    subcategories: ["Public Housing", "Section 8 Vouchers", "Emergency Shelter", "Transitional Housing", "Rental Assistance", "Homeownership Programs"]
  },
  {
    id: "food",
    name: "Food & Nutrition",
    description: "SNAP, WIC, food banks, and school meal programs",
    icon: "Apple",
    subcategories: ["SNAP (Food Stamps)", "WIC", "School Meals", "Food Banks", "Summer Meals", "Community Gardens"]
  },
  {
    id: "healthcare",
    name: "Healthcare & Mental Health",
    description: "Medicaid, CHIP, community health centers, and counseling",
    icon: "Heart",
    subcategories: ["Medicaid", "CHIP", "Community Health Centers", "Mental Health Services", "Substance Abuse", "School-Based Health"]
  },
  {
    id: "legal",
    name: "Legal Aid & Advocacy",
    description: "Free legal services, civil rights, and youth advocacy",
    icon: "Scale",
    subcategories: ["Legal Aid", "Immigration Services", "Juvenile Justice", "Civil Rights", "Tenant Rights", "Youth Advocacy"]
  },
  {
    id: "youth",
    name: "Youth Development",
    description: "After-school programs, mentoring, leadership, and youth services",
    icon: "Users",
    subcategories: ["After-School Programs", "Mentoring", "Leadership Development", "Summer Programs", "Youth Centers", "Sports & Recreation"]
  },
  {
    id: "financial",
    name: "Financial Empowerment",
    description: "Banking, tax prep, financial coaching, and benefits enrollment",
    icon: "DollarSign",
    subcategories: ["Free Tax Prep (VITA)", "Financial Coaching", "Bank On Programs", "Benefits Enrollment", "Credit Building", "Emergency Assistance"]
  },
  {
    id: "technology",
    name: "Digital Access & Technology",
    description: "Internet access, computer literacy, and digital inclusion programs",
    icon: "Laptop",
    subcategories: ["Affordable Connectivity", "Digital Literacy", "Public Computer Access", "Device Programs", "STEM Programs", "Coding Bootcamps"]
  },
  {
    id: "transportation",
    name: "Transportation",
    description: "Transit passes, ride programs, and transportation assistance",
    icon: "Bus",
    subcategories: ["Transit Passes", "Ride Programs", "Vehicle Assistance", "Safe Routes", "Rural Transportation", "Bike Programs"]
  }
];

interface StateAgency {
  name: string;
  url: string;
  phone: string;
}

interface StateBenefits {
  snap: { name: string; url: string };
  medicaid: { name: string; url: string };
  tanf: { name: string; url: string };
  housing: { name: string; url: string };
  workforce: StateAgency;
  education: { name: string; url: string };
  legalAid: { name: string; url: string };
  youthServices: { name: string; url: string };
}

const STATE_DATA: Record<string, StateBenefits> = {
  AL: {
    snap: { name: "Alabama DHR - Food Assistance", url: "https://dhr.alabama.gov/food-assistance/" },
    medicaid: { name: "Alabama Medicaid Agency", url: "https://medicaid.alabama.gov/" },
    tanf: { name: "Alabama FA Program", url: "https://dhr.alabama.gov/family-assistance/" },
    housing: { name: "Alabama Housing Finance Authority", url: "https://www.ahfa.com/" },
    workforce: { name: "Alabama Department of Commerce - Workforce", url: "https://www.madeinalabama.com/workforce-development/", phone: "334-242-0400" },
    education: { name: "Alabama Commission on Higher Education", url: "https://ache.edu/" },
    legalAid: { name: "Legal Services Alabama", url: "https://www.legalservicesalabama.org/" },
    youthServices: { name: "Alabama Department of Youth Services", url: "https://dys.alabama.gov/" }
  },
  AK: {
    snap: { name: "Alaska SNAP Benefits", url: "https://dpaweb.hss.state.ak.us/pal/pages/search/prior-authorization-list.aspx" },
    medicaid: { name: "Alaska Medicaid", url: "https://health.alaska.gov/dpa/Pages/medicaid/default.aspx" },
    tanf: { name: "Alaska ATAP", url: "https://health.alaska.gov/dpa/Pages/atap/default.aspx" },
    housing: { name: "Alaska Housing Finance Corporation", url: "https://www.ahfc.us/" },
    workforce: { name: "Alaska Department of Labor", url: "https://labor.alaska.gov/", phone: "907-465-2712" },
    education: { name: "Alaska Commission on Postsecondary Education", url: "https://acpe.alaska.gov/" },
    legalAid: { name: "Alaska Legal Services", url: "https://www.alsc-law.org/" },
    youthServices: { name: "Alaska Division of Juvenile Justice", url: "https://health.alaska.gov/djj/" }
  },
  AZ: {
    snap: { name: "Arizona DES - Nutrition Assistance", url: "https://des.az.gov/services/basic-needs/food-assistance/nutrition-assistance" },
    medicaid: { name: "AHCCCS (Arizona Medicaid)", url: "https://www.azahcccs.gov/" },
    tanf: { name: "Arizona Cash Assistance", url: "https://des.az.gov/services/basic-needs/financial-assistance" },
    housing: { name: "Arizona Department of Housing", url: "https://housing.az.gov/" },
    workforce: { name: "Arizona@Work", url: "https://www.azcommerce.com/workforce", phone: "602-542-5482" },
    education: { name: "Arizona Commission for Postsecondary Education", url: "https://highered.az.gov/" },
    legalAid: { name: "Community Legal Services", url: "https://clsaz.org/" },
    youthServices: { name: "Arizona Department of Child Safety", url: "https://dcs.az.gov/" }
  },
  AR: {
    snap: { name: "Arkansas DHS - SNAP", url: "https://humanservices.arkansas.gov/divisions/county-operations/supplemental-nutrition-assistance-program-snap/" },
    medicaid: { name: "Arkansas Medicaid", url: "https://humanservices.arkansas.gov/divisions/medical-services/" },
    tanf: { name: "Arkansas TEA Program", url: "https://humanservices.arkansas.gov/divisions/county-operations/transitional-employment-assistance/" },
    housing: { name: "Arkansas Development Finance Authority", url: "https://www.adfa.arkansas.gov/" },
    workforce: { name: "Arkansas Division of Workforce Services", url: "https://www.dws.arkansas.gov/", phone: "501-682-2121" },
    education: { name: "Arkansas Division of Higher Education", url: "https://scholarships.adhe.edu/" },
    legalAid: { name: "Legal Aid of Arkansas", url: "https://arlegalaid.org/" },
    youthServices: { name: "Arkansas Division of Youth Services", url: "https://humanservices.arkansas.gov/divisions/youth-services/" }
  },
  CA: {
    snap: { name: "CalFresh", url: "https://www.cdss.ca.gov/calfresh" },
    medicaid: { name: "Medi-Cal", url: "https://www.dhcs.ca.gov/services/medi-cal" },
    tanf: { name: "CalWORKs", url: "https://www.cdss.ca.gov/calworks" },
    housing: { name: "California HCD", url: "https://www.hcd.ca.gov/" },
    workforce: { name: "California Employment Development Department", url: "https://edd.ca.gov/", phone: "800-300-5616" },
    education: { name: "California Student Aid Commission", url: "https://www.csac.ca.gov/" },
    legalAid: { name: "Legal Aid Association of California", url: "https://laaconline.org/" },
    youthServices: { name: "California Department of Youth and Community Restoration", url: "https://dycr.ca.gov/" }
  },
  CO: {
    snap: { name: "Colorado SNAP", url: "https://cdhs.colorado.gov/snap" },
    medicaid: { name: "Health First Colorado (Medicaid)", url: "https://www.healthfirstcolorado.com/" },
    tanf: { name: "Colorado Works (TANF)", url: "https://cdhs.colorado.gov/colorado-works-tanf" },
    housing: { name: "Colorado Housing and Finance Authority", url: "https://www.chfainfo.com/" },
    workforce: { name: "Colorado Department of Labor and Employment", url: "https://cdle.colorado.gov/", phone: "303-318-8000" },
    education: { name: "Colorado Department of Higher Education", url: "https://highered.colorado.gov/" },
    legalAid: { name: "Colorado Legal Services", url: "https://www.coloradolegalservices.org/" },
    youthServices: { name: "Colorado Division of Youth Services", url: "https://cdhs.colorado.gov/our-services/youth-services" }
  },
  CT: {
    snap: { name: "Connecticut SNAP", url: "https://portal.ct.gov/dss/SNAP/Supplemental-Nutrition-Assistance-Program---SNAP" },
    medicaid: { name: "HUSKY Health (Connecticut Medicaid)", url: "https://www.huskyhealth.com/" },
    tanf: { name: "Connecticut TFA", url: "https://portal.ct.gov/dss/Economic-Security/Temporary-Family-Assistance/Temporary-Family-Assistance" },
    housing: { name: "Connecticut Housing Finance Authority", url: "https://www.chfa.org/" },
    workforce: { name: "Connecticut Department of Labor", url: "https://www.ctdol.state.ct.us/", phone: "860-263-6000" },
    education: { name: "Connecticut Office of Higher Education", url: "https://www.ctohe.org/" },
    legalAid: { name: "Statewide Legal Services of Connecticut", url: "https://www.slsct.org/" },
    youthServices: { name: "CT Department of Children and Families", url: "https://portal.ct.gov/dcf" }
  },
  DE: {
    snap: { name: "Delaware SNAP", url: "https://dhss.delaware.gov/dss/foodstamps.html" },
    medicaid: { name: "Delaware Medicaid", url: "https://dhss.delaware.gov/dhss/dmma/" },
    tanf: { name: "Delaware TANF", url: "https://dhss.delaware.gov/dss/tanf.html" },
    housing: { name: "Delaware State Housing Authority", url: "https://www.destatehousing.com/" },
    workforce: { name: "Delaware Department of Labor", url: "https://labor.delaware.gov/", phone: "302-761-8000" },
    education: { name: "Delaware Higher Education Office", url: "https://www.doe.k12.de.us/domain/226" },
    legalAid: { name: "Delaware Legal Help Link", url: "https://delegalhelplink.org/" },
    youthServices: { name: "Delaware Office of Youth Rehabilitative Services", url: "https://kids.delaware.gov/youth-rehabilitative-services/" }
  },
  FL: {
    snap: { name: "Florida SNAP", url: "https://www.myflfamilies.com/services/public-assistance/supplemental-nutrition-assistance-program" },
    medicaid: { name: "Florida Medicaid", url: "https://ahca.myflorida.com/medicaid" },
    tanf: { name: "Florida Temporary Cash Assistance", url: "https://www.myflfamilies.com/services/public-assistance/temporary-cash-assistance" },
    housing: { name: "Florida Housing Finance Corporation", url: "https://www.floridahousing.org/" },
    workforce: { name: "CareerSource Florida", url: "https://careersourceflorida.com/", phone: "866-352-2345" },
    education: { name: "Florida Office of Student Financial Assistance", url: "https://www.floridastudentfinancialaidsg.org/" },
    legalAid: { name: "Florida Legal Services", url: "https://www.floridalegal.org/" },
    youthServices: { name: "Florida Department of Juvenile Justice", url: "https://www.djj.state.fl.us/" }
  },
  GA: {
    snap: { name: "Georgia SNAP", url: "https://dfcs.georgia.gov/services/food-stamps" },
    medicaid: { name: "Georgia Medicaid", url: "https://medicaid.georgia.gov/" },
    tanf: { name: "Georgia TANF", url: "https://dfcs.georgia.gov/services/temporary-assistance-needy-families" },
    housing: { name: "Georgia Department of Community Affairs", url: "https://www.dca.ga.gov/" },
    workforce: { name: "Georgia Department of Labor", url: "https://dol.georgia.gov/", phone: "404-232-3180" },
    education: { name: "Georgia Student Finance Commission", url: "https://gsfc.georgia.gov/" },
    legalAid: { name: "Georgia Legal Services Program", url: "https://www.glsp.org/" },
    youthServices: { name: "Georgia Department of Juvenile Justice", url: "https://djj.georgia.gov/" }
  },
  HI: {
    snap: { name: "Hawaii SNAP", url: "https://humanservices.hawaii.gov/bessd/snap/" },
    medicaid: { name: "Med-QUEST (Hawaii Medicaid)", url: "https://medquest.hawaii.gov/" },
    tanf: { name: "Hawaii TANF", url: "https://humanservices.hawaii.gov/bessd/tanf/" },
    housing: { name: "Hawaii Public Housing Authority", url: "https://www.hpha.hawaii.gov/" },
    workforce: { name: "Hawaii Department of Labor", url: "https://labor.hawaii.gov/", phone: "808-586-8842" },
    education: { name: "University of Hawaii System", url: "https://www.hawaii.edu/" },
    legalAid: { name: "Legal Aid Society of Hawaii", url: "https://www.legalaidhawaii.org/" },
    youthServices: { name: "Hawaii Office of Youth Services", url: "https://humanservices.hawaii.gov/oys/" }
  },
  ID: {
    snap: { name: "Idaho SNAP", url: "https://healthandwelfare.idaho.gov/services-programs/financial-assistance/supplemental-nutrition-assistance-program-snap" },
    medicaid: { name: "Idaho Medicaid", url: "https://healthandwelfare.idaho.gov/services-programs/medicaid-health" },
    tanf: { name: "Idaho TAFI", url: "https://healthandwelfare.idaho.gov/services-programs/financial-assistance" },
    housing: { name: "Idaho Housing and Finance Association", url: "https://www.idahohousing.com/" },
    workforce: { name: "Idaho Department of Labor", url: "https://www.labor.idaho.gov/", phone: "208-332-3570" },
    education: { name: "Idaho State Board of Education", url: "https://boardofed.idaho.gov/" },
    legalAid: { name: "Idaho Legal Aid Services", url: "https://www.idaholegalaid.org/" },
    youthServices: { name: "Idaho Department of Juvenile Corrections", url: "https://www.idjc.idaho.gov/" }
  },
  IL: {
    snap: { name: "Illinois SNAP", url: "https://www.dhs.state.il.us/page.aspx?item=30357" },
    medicaid: { name: "Illinois Medicaid", url: "https://hfs.illinois.gov/" },
    tanf: { name: "Illinois TANF", url: "https://www.dhs.state.il.us/page.aspx?item=30358" },
    housing: { name: "Illinois Housing Development Authority", url: "https://www.ihda.org/" },
    workforce: { name: "Illinois Department of Commerce & Economic Opportunity", url: "https://dceo.illinois.gov/workforce.html", phone: "217-785-6006" },
    education: { name: "Illinois Student Assistance Commission", url: "https://www.isac.org/" },
    legalAid: { name: "Legal Aid Chicago", url: "https://www.legalaidchicago.org/" },
    youthServices: { name: "Illinois Department of Juvenile Justice", url: "https://idjj.illinois.gov/" }
  },
  IN: {
    snap: { name: "Indiana SNAP", url: "https://www.in.gov/fssa/dfr/snap-food-assistance/" },
    medicaid: { name: "Indiana Medicaid (FSSA)", url: "https://www.in.gov/medicaid/" },
    tanf: { name: "Indiana TANF", url: "https://www.in.gov/fssa/dfr/tanf-cash-assistance/" },
    housing: { name: "Indiana Housing & Community Development Authority", url: "https://www.in.gov/ihcda/" },
    workforce: { name: "Indiana Department of Workforce Development", url: "https://www.in.gov/dwd/", phone: "317-232-7670" },
    education: { name: "Indiana Commission for Higher Education", url: "https://www.in.gov/che/" },
    legalAid: { name: "Indiana Legal Services", url: "https://www.indianalegalservices.org/" },
    youthServices: { name: "Indiana Department of Child Services", url: "https://www.in.gov/dcs/" }
  },
  IA: {
    snap: { name: "Iowa SNAP", url: "https://dhs.iowa.gov/food-assistance" },
    medicaid: { name: "Iowa Medicaid", url: "https://dhs.iowa.gov/ime" },
    tanf: { name: "Iowa FIP", url: "https://dhs.iowa.gov/cash-assistance" },
    housing: { name: "Iowa Finance Authority", url: "https://www.iowafinance.com/" },
    workforce: { name: "Iowa Workforce Development", url: "https://www.iowaworkforcedevelopment.gov/", phone: "515-725-3000" },
    education: { name: "Iowa College Aid", url: "https://www.iowacollegeaid.gov/" },
    legalAid: { name: "Iowa Legal Aid", url: "https://www.iowalegalaid.org/" },
    youthServices: { name: "Iowa Division of Criminal & Juvenile Justice", url: "https://humanrights.iowa.gov/criminal-juvenile-justice" }
  },
  KS: {
    snap: { name: "Kansas SNAP", url: "https://www.dcf.ks.gov/services/ees/Pages/Food/FoodAssistance.aspx" },
    medicaid: { name: "KanCare (Kansas Medicaid)", url: "https://www.kancare.ks.gov/" },
    tanf: { name: "Kansas TANF", url: "https://www.dcf.ks.gov/services/ees/Pages/Cash/CashAssistance.aspx" },
    housing: { name: "Kansas Housing Resources Corporation", url: "https://www.kshousingcorp.org/" },
    workforce: { name: "Kansas Department of Commerce - Workforce", url: "https://www.kansascommerce.gov/workforce/", phone: "785-296-3481" },
    education: { name: "Kansas Board of Regents", url: "https://www.kansasregents.org/" },
    legalAid: { name: "Kansas Legal Services", url: "https://www.kansaslegalservices.org/" },
    youthServices: { name: "Kansas Department for Children and Families", url: "https://www.dcf.ks.gov/" }
  },
  KY: {
    snap: { name: "Kentucky SNAP", url: "https://chfs.ky.gov/agencies/dcbs/dfs/nab/Pages/snap.aspx" },
    medicaid: { name: "Kentucky Medicaid", url: "https://chfs.ky.gov/agencies/dms/Pages/default.aspx" },
    tanf: { name: "Kentucky KTAP", url: "https://chfs.ky.gov/agencies/dcbs/dfs/fb/Pages/ktap.aspx" },
    housing: { name: "Kentucky Housing Corporation", url: "https://www.kyhousing.org/" },
    workforce: { name: "Kentucky Education & Workforce Development Cabinet", url: "https://kwib.ky.gov/", phone: "502-564-0372" },
    education: { name: "Kentucky Higher Education Assistance Authority", url: "https://www.kheaa.com/" },
    legalAid: { name: "Legal Aid Network of Kentucky", url: "https://kyjustice.org/" },
    youthServices: { name: "Kentucky Department of Juvenile Justice", url: "https://djj.ky.gov/" }
  },
  LA: {
    snap: { name: "Louisiana SNAP", url: "https://www.dcfs.louisiana.gov/page/supplemental-nutrition-assistance-program-snap" },
    medicaid: { name: "Louisiana Medicaid (Healthy Louisiana)", url: "https://ldh.la.gov/healthy-louisiana" },
    tanf: { name: "Louisiana FITAP", url: "https://www.dcfs.louisiana.gov/page/family-independence-temporary-assistance-program-fitap" },
    housing: { name: "Louisiana Housing Corporation", url: "https://www.lhc.la.gov/" },
    workforce: { name: "Louisiana Workforce Commission", url: "https://www.laworks.net/", phone: "225-342-3111" },
    education: { name: "Louisiana Office of Student Financial Assistance", url: "https://mylosfa.la.gov/" },
    legalAid: { name: "Southeast Louisiana Legal Services", url: "https://slls.org/" },
    youthServices: { name: "Louisiana Office of Juvenile Justice", url: "https://ojj.la.gov/" }
  },
  ME: {
    snap: { name: "Maine SNAP", url: "https://www.maine.gov/dhhs/ofi/programs-services/food-supplement" },
    medicaid: { name: "MaineCare", url: "https://www.maine.gov/dhhs/oms/about-mainecare" },
    tanf: { name: "Maine TANF", url: "https://www.maine.gov/dhhs/ofi/programs-services/tanf" },
    housing: { name: "MaineHousing", url: "https://www.mainehousing.org/" },
    workforce: { name: "Maine Department of Labor", url: "https://www.maine.gov/labor/", phone: "207-623-7900" },
    education: { name: "Finance Authority of Maine", url: "https://www.famemaine.com/" },
    legalAid: { name: "Pine Tree Legal Assistance", url: "https://ptla.org/" },
    youthServices: { name: "Maine Department of Corrections - Juvenile", url: "https://www.maine.gov/corrections/juvenile-services" }
  },
  MD: {
    snap: { name: "Maryland SNAP", url: "https://dhs.maryland.gov/supplemental-nutrition-assistance-program/" },
    medicaid: { name: "Maryland Medicaid", url: "https://health.maryland.gov/mmcp/Pages/home.aspx" },
    tanf: { name: "Maryland TCA", url: "https://dhs.maryland.gov/temporary-cash-assistance/" },
    housing: { name: "Maryland Department of Housing", url: "https://dhcd.maryland.gov/" },
    workforce: { name: "Maryland Department of Labor", url: "https://www.dllr.state.md.us/", phone: "410-767-2173" },
    education: { name: "Maryland Higher Education Commission", url: "https://mhec.maryland.gov/" },
    legalAid: { name: "Maryland Legal Aid", url: "https://www.mdlab.org/" },
    youthServices: { name: "Maryland Department of Juvenile Services", url: "https://djs.maryland.gov/" }
  },
  MA: {
    snap: { name: "Massachusetts SNAP", url: "https://www.mass.gov/snap-benefits-food-stamps" },
    medicaid: { name: "MassHealth", url: "https://www.mass.gov/masshealth" },
    tanf: { name: "Massachusetts TAFDC", url: "https://www.mass.gov/transitional-aid-to-families-with-dependent-children-tafdc" },
    housing: { name: "MassHousing", url: "https://www.masshousing.com/" },
    workforce: { name: "MassHire", url: "https://www.mass.gov/masshire-career-centers", phone: "617-626-6600" },
    education: { name: "Massachusetts Department of Higher Education", url: "https://www.mass.edu/" },
    legalAid: { name: "Greater Boston Legal Services", url: "https://www.gbls.org/" },
    youthServices: { name: "Massachusetts Department of Youth Services", url: "https://www.mass.gov/orgs/department-of-youth-services" }
  },
  MI: {
    snap: { name: "Michigan Food Assistance", url: "https://www.michigan.gov/mdhhs/assistance-programs/food" },
    medicaid: { name: "Healthy Michigan Plan", url: "https://www.michigan.gov/healthymiplan" },
    tanf: { name: "Michigan Family Independence Program", url: "https://www.michigan.gov/mdhhs/assistance-programs/cash" },
    housing: { name: "Michigan State Housing Development Authority", url: "https://www.michigan.gov/mshda" },
    workforce: { name: "Michigan Works!", url: "https://www.michiganworks.org/", phone: "800-285-9675" },
    education: { name: "Michigan Student Aid", url: "https://www.michigan.gov/mistudentaid" },
    legalAid: { name: "Michigan Legal Help", url: "https://michiganlegalhelp.org/" },
    youthServices: { name: "Michigan DHHS Children's Services", url: "https://www.michigan.gov/mdhhs/doing-business/providers/children-services" }
  },
  MN: {
    snap: { name: "Minnesota SNAP", url: "https://mn.gov/dhs/people-we-serve/adults/economic-assistance/food-nutrition/programs-and-services/supplemental-nutrition-assistance-program.jsp" },
    medicaid: { name: "Minnesota Medical Assistance", url: "https://mn.gov/dhs/health-care/" },
    tanf: { name: "Minnesota MFIP", url: "https://mn.gov/dhs/people-we-serve/adults/economic-assistance/income/programs-and-services/mfip.jsp" },
    housing: { name: "Minnesota Housing", url: "https://www.mnhousing.gov/" },
    workforce: { name: "Minnesota DEED", url: "https://mn.gov/deed/", phone: "651-259-7114" },
    education: { name: "Minnesota Office of Higher Education", url: "https://www.ohe.state.mn.us/" },
    legalAid: { name: "Legal Aid State Support", url: "https://www.legalaidmn.org/" },
    youthServices: { name: "Minnesota Department of Human Services - Youth", url: "https://mn.gov/dhs/people-we-serve/children-and-families/" }
  },
  MS: {
    snap: { name: "Mississippi SNAP", url: "https://www.mdhs.ms.gov/economic-assistance/snap/" },
    medicaid: { name: "Mississippi Medicaid", url: "https://medicaid.ms.gov/" },
    tanf: { name: "Mississippi TANF", url: "https://www.mdhs.ms.gov/economic-assistance/tanf/" },
    housing: { name: "Mississippi Home Corporation", url: "https://www.mshomecorp.com/" },
    workforce: { name: "Mississippi Department of Employment Security", url: "https://mdes.ms.gov/", phone: "601-321-6000" },
    education: { name: "Mississippi Institutions of Higher Learning", url: "https://www.mississippi.edu/" },
    legalAid: { name: "Mississippi Center for Legal Services", url: "https://mscenterforlegalservices.org/" },
    youthServices: { name: "Mississippi Department of Youth Services", url: "https://www.mdhs.ms.gov/youth-services/" }
  },
  MO: {
    snap: { name: "Missouri SNAP", url: "https://dss.mo.gov/fsd/food-stamps/" },
    medicaid: { name: "MO HealthNet", url: "https://dss.mo.gov/mhd/" },
    tanf: { name: "Missouri Temporary Assistance", url: "https://dss.mo.gov/fsd/tempassist/" },
    housing: { name: "Missouri Housing Development Commission", url: "https://www.mhdc.com/" },
    workforce: { name: "Missouri Department of Higher Education & Workforce Development", url: "https://dhewd.mo.gov/", phone: "573-751-4212" },
    education: { name: "Missouri Student Financial Assistance", url: "https://dhewd.mo.gov/ppc/grants/" },
    legalAid: { name: "Legal Services of Eastern Missouri", url: "https://lsem.org/" },
    youthServices: { name: "Missouri Division of Youth Services", url: "https://dss.mo.gov/dys/" }
  },
  MT: {
    snap: { name: "Montana SNAP", url: "https://dphhs.mt.gov/hcsd/snap" },
    medicaid: { name: "Montana Medicaid", url: "https://dphhs.mt.gov/medicaid" },
    tanf: { name: "Montana TANF", url: "https://dphhs.mt.gov/hcsd/tanf" },
    housing: { name: "Montana Board of Housing", url: "https://housing.mt.gov/" },
    workforce: { name: "Montana Department of Labor & Industry", url: "https://dli.mt.gov/", phone: "406-444-2840" },
    education: { name: "Montana University System", url: "https://mus.edu/" },
    legalAid: { name: "Montana Legal Services Association", url: "https://www.mtlsa.org/" },
    youthServices: { name: "Montana OPI - Youth Services", url: "https://opi.mt.gov/" }
  },
  NE: {
    snap: { name: "Nebraska SNAP", url: "https://dhhs.ne.gov/pages/food-programs.aspx" },
    medicaid: { name: "Nebraska Medicaid", url: "https://dhhs.ne.gov/pages/medicaid.aspx" },
    tanf: { name: "Nebraska ADC", url: "https://dhhs.ne.gov/pages/public-assistance.aspx" },
    housing: { name: "Nebraska Investment Finance Authority", url: "https://www.nifa.org/" },
    workforce: { name: "Nebraska Department of Labor", url: "https://dol.nebraska.gov/", phone: "402-471-9000" },
    education: { name: "Nebraska Coordinating Commission for Postsecondary Education", url: "https://ccpe.nebraska.gov/" },
    legalAid: { name: "Legal Aid of Nebraska", url: "https://www.legalaidofnebraska.org/" },
    youthServices: { name: "Nebraska Children & Family Services", url: "https://dhhs.ne.gov/pages/children-family-services.aspx" }
  },
  NV: {
    snap: { name: "Nevada SNAP", url: "https://dwss.nv.gov/SNAP/Food_Stamp_Program/" },
    medicaid: { name: "Nevada Medicaid", url: "https://dhcfp.nv.gov/" },
    tanf: { name: "Nevada TANF", url: "https://dwss.nv.gov/TANF/Temporary_Assistance_for_Needy_Families/" },
    housing: { name: "Nevada Housing Division", url: "https://housing.nv.gov/" },
    workforce: { name: "Nevada DETR", url: "https://detr.nv.gov/", phone: "775-684-3849" },
    education: { name: "Nevada System of Higher Education", url: "https://nshe.nevada.edu/" },
    legalAid: { name: "Nevada Legal Services", url: "https://nevadalegalservices.org/" },
    youthServices: { name: "Nevada DCFS", url: "https://dcfs.nv.gov/" }
  },
  NH: {
    snap: { name: "New Hampshire SNAP", url: "https://www.dhhs.nh.gov/programs-services/food-nutrition/supplemental-nutrition-assistance-program-snap" },
    medicaid: { name: "NH Medicaid", url: "https://www.dhhs.nh.gov/programs-services/medicaid" },
    tanf: { name: "NH FAP", url: "https://www.dhhs.nh.gov/programs-services/financial-assistance" },
    housing: { name: "New Hampshire Housing", url: "https://www.nhhfa.org/" },
    workforce: { name: "NH Works", url: "https://www.nhworks.org/", phone: "603-228-4100" },
    education: { name: "New Hampshire Higher Education Assistance", url: "https://www.education.nh.gov/who-we-are/division-of-higher-education" },
    legalAid: { name: "NH Legal Assistance", url: "https://www.nhla.org/" },
    youthServices: { name: "NH DCYF", url: "https://www.dhhs.nh.gov/programs-services/child-protection" }
  },
  NJ: {
    snap: { name: "NJ SNAP", url: "https://www.nj.gov/humanservices/dfd/programs/njsnap/" },
    medicaid: { name: "NJ FamilyCare", url: "https://www.njfamilycare.org/" },
    tanf: { name: "NJ WorkFirst/TANF", url: "https://www.nj.gov/humanservices/dfd/programs/workfirst/" },
    housing: { name: "New Jersey Housing and Mortgage Finance Agency", url: "https://www.nj.gov/njhmfa/" },
    workforce: { name: "New Jersey Department of Labor", url: "https://www.nj.gov/labor/", phone: "609-292-1040" },
    education: { name: "NJ Higher Education Student Assistance Authority", url: "https://www.hesaa.org/" },
    legalAid: { name: "Legal Services of New Jersey", url: "https://www.lsnj.org/" },
    youthServices: { name: "NJ Juvenile Justice Commission", url: "https://www.nj.gov/oag/jjc/" }
  },
  NM: {
    snap: { name: "New Mexico SNAP", url: "https://www.hsd.state.nm.us/lookingforassistance/supplemental-nutrition-assistance-program-background/" },
    medicaid: { name: "NM Medicaid", url: "https://www.hsd.state.nm.us/lookingforassistance/medicaid-for-adults-and-children/" },
    tanf: { name: "NM TANF (NMWorks)", url: "https://www.hsd.state.nm.us/lookingforassistance/cash-assistance/" },
    housing: { name: "New Mexico Mortgage Finance Authority", url: "https://housingnm.org/" },
    workforce: { name: "New Mexico Department of Workforce Solutions", url: "https://www.dws.state.nm.us/", phone: "505-841-8405" },
    education: { name: "New Mexico Higher Education Department", url: "https://hed.nm.gov/" },
    legalAid: { name: "New Mexico Legal Aid", url: "https://www.newmexicolegalaid.org/" },
    youthServices: { name: "NM Children, Youth & Families", url: "https://cyfd.nm.gov/" }
  },
  NY: {
    snap: { name: "New York SNAP", url: "https://otda.ny.gov/programs/snap/" },
    medicaid: { name: "NY State of Health", url: "https://nystateofhealth.ny.gov/" },
    tanf: { name: "New York Family Assistance", url: "https://otda.ny.gov/programs/temporary-assistance/" },
    housing: { name: "NY Homes and Community Renewal", url: "https://hcr.ny.gov/" },
    workforce: { name: "New York State Department of Labor", url: "https://dol.ny.gov/", phone: "888-469-7365" },
    education: { name: "NY Higher Education Services Corporation", url: "https://www.hesc.ny.gov/" },
    legalAid: { name: "Legal Aid Society (NY)", url: "https://www.legalaidnyc.org/" },
    youthServices: { name: "NY Office of Children and Family Services", url: "https://ocfs.ny.gov/" }
  },
  NC: {
    snap: { name: "North Carolina FNS", url: "https://www.ncdhhs.gov/divisions/child-and-family-well-being/food-and-nutrition-services-food-stamps" },
    medicaid: { name: "NC Medicaid", url: "https://medicaid.ncdhhs.gov/" },
    tanf: { name: "NC Work First", url: "https://www.ncdhhs.gov/divisions/social-services/work-first-family-assistance" },
    housing: { name: "North Carolina Housing Finance Agency", url: "https://www.nchfa.com/" },
    workforce: { name: "NCWorks", url: "https://www.ncworks.gov/", phone: "919-707-1150" },
    education: { name: "NC State Education Assistance Authority", url: "https://www.ncseaa.edu/" },
    legalAid: { name: "Legal Aid of North Carolina", url: "https://www.legalaidnc.org/" },
    youthServices: { name: "NC Division of Juvenile Justice", url: "https://www.ncdps.gov/juvenile-justice" }
  },
  ND: {
    snap: { name: "North Dakota SNAP", url: "https://www.hhs.nd.gov/economic-assistance/snap" },
    medicaid: { name: "ND Medicaid", url: "https://www.hhs.nd.gov/healthcare/medicaid" },
    tanf: { name: "ND TANF", url: "https://www.hhs.nd.gov/economic-assistance/tanf" },
    housing: { name: "North Dakota Housing Finance Agency", url: "https://www.ndhfa.org/" },
    workforce: { name: "Job Service North Dakota", url: "https://www.jobsnd.com/", phone: "701-328-2868" },
    education: { name: "ND University System", url: "https://ndus.edu/" },
    legalAid: { name: "Legal Services of North Dakota", url: "https://www.legalassist.org/" },
    youthServices: { name: "ND Department of Corrections - Youth", url: "https://www.docr.nd.gov/youth-services" }
  },
  OH: {
    snap: { name: "Ohio SNAP", url: "https://jfs.ohio.gov/families/food-assistance" },
    medicaid: { name: "Ohio Medicaid", url: "https://medicaid.ohio.gov/" },
    tanf: { name: "Ohio Works First", url: "https://jfs.ohio.gov/families/cash-assistance" },
    housing: { name: "Ohio Housing Finance Agency", url: "https://ohiohome.org/" },
    workforce: { name: "OhioMeansJobs", url: "https://ohiomeansjobs.ohio.gov/", phone: "888-296-7541" },
    education: { name: "Ohio Department of Higher Education", url: "https://highered.ohio.gov/" },
    legalAid: { name: "Ohio State Legal Services", url: "https://www.oslsa.org/" },
    youthServices: { name: "Ohio Department of Youth Services", url: "https://dys.ohio.gov/" }
  },
  OK: {
    snap: { name: "Oklahoma SNAP", url: "https://oklahoma.gov/okdhs/services/snap.html" },
    medicaid: { name: "SoonerCare (Oklahoma Medicaid)", url: "https://www.okhca.org/soonercare" },
    tanf: { name: "Oklahoma TANF", url: "https://oklahoma.gov/okdhs/services/tanf.html" },
    housing: { name: "Oklahoma Housing Finance Agency", url: "https://www.ohfa.org/" },
    workforce: { name: "Oklahoma Employment Security Commission", url: "https://oesc.ok.gov/", phone: "405-557-7100" },
    education: { name: "Oklahoma State Regents for Higher Education", url: "https://www.okhighered.org/" },
    legalAid: { name: "Legal Aid Services of Oklahoma", url: "https://www.legalaidok.org/" },
    youthServices: { name: "Oklahoma Office of Juvenile Affairs", url: "https://oklahoma.gov/oja.html" }
  },
  OR: {
    snap: { name: "Oregon SNAP", url: "https://www.oregon.gov/dhs/assistance/food-benefits/pages/index.aspx" },
    medicaid: { name: "Oregon Health Plan", url: "https://www.oregon.gov/oha/hsd/ohp" },
    tanf: { name: "Oregon TANF", url: "https://www.oregon.gov/dhs/assistance/cash/pages/index.aspx" },
    housing: { name: "Oregon Housing and Community Services", url: "https://www.oregon.gov/ohcs" },
    workforce: { name: "Oregon Employment Department", url: "https://www.oregon.gov/employ/", phone: "503-947-1394" },
    education: { name: "Oregon Higher Education Coordinating Commission", url: "https://www.oregon.gov/highered" },
    legalAid: { name: "Legal Aid Services of Oregon", url: "https://lasoregon.org/" },
    youthServices: { name: "Oregon Youth Authority", url: "https://www.oregon.gov/oya/" }
  },
  PA: {
    snap: { name: "Pennsylvania SNAP", url: "https://www.dhs.pa.gov/Services/Assistance/Pages/SNAP.aspx" },
    medicaid: { name: "Pennsylvania Medical Assistance", url: "https://www.dhs.pa.gov/Services/Assistance/Pages/Medical-Assistance.aspx" },
    tanf: { name: "Pennsylvania TANF", url: "https://www.dhs.pa.gov/Services/Assistance/Pages/Cash-Assistance.aspx" },
    housing: { name: "Pennsylvania Housing Finance Agency", url: "https://www.phfa.org/" },
    workforce: { name: "PA CareerLink", url: "https://www.pacareerlink.pa.gov/", phone: "877-872-2568" },
    education: { name: "Pennsylvania Higher Education Assistance Agency", url: "https://www.pheaa.org/" },
    legalAid: { name: "Legal Aid Bureau (PA)", url: "https://palegalaid.net/" },
    youthServices: { name: "PA Department of Human Services - Youth", url: "https://www.dhs.pa.gov/Services/Children/Pages/default.aspx" }
  },
  RI: {
    snap: { name: "Rhode Island SNAP", url: "https://dhs.ri.gov/programs-and-services/supplemental-nutrition-assistance-program-snap" },
    medicaid: { name: "Rhode Island Medicaid", url: "https://eohhs.ri.gov/medicaid" },
    tanf: { name: "Rhode Island RI Works", url: "https://dhs.ri.gov/programs-and-services/ri-works" },
    housing: { name: "RIHousing", url: "https://www.rihousing.com/" },
    workforce: { name: "Rhode Island Department of Labor and Training", url: "https://dlt.ri.gov/", phone: "401-462-8000" },
    education: { name: "Rhode Island Office of Postsecondary Commissioner", url: "https://riopc.edu/" },
    legalAid: { name: "Rhode Island Legal Services", url: "https://www.rils.org/" },
    youthServices: { name: "RI Department of Children, Youth & Families", url: "https://dcyf.ri.gov/" }
  },
  SC: {
    snap: { name: "South Carolina SNAP", url: "https://dss.sc.gov/assistance/snap-food-stamps/" },
    medicaid: { name: "Healthy Connections (SC Medicaid)", url: "https://www.scdhhs.gov/" },
    tanf: { name: "South Carolina FI", url: "https://dss.sc.gov/assistance/fi/" },
    housing: { name: "SC State Housing Finance Authority", url: "https://www.schousing.com/" },
    workforce: { name: "SC Works", url: "https://www.scworks.org/", phone: "803-737-2400" },
    education: { name: "South Carolina Commission on Higher Education", url: "https://www.che.sc.gov/" },
    legalAid: { name: "South Carolina Legal Services", url: "https://www.sclegal.org/" },
    youthServices: { name: "SC Department of Juvenile Justice", url: "https://djj.sc.gov/" }
  },
  SD: {
    snap: { name: "South Dakota SNAP", url: "https://dss.sd.gov/economicassistance/snap/" },
    medicaid: { name: "South Dakota Medicaid", url: "https://dss.sd.gov/medicaid/" },
    tanf: { name: "South Dakota TANF", url: "https://dss.sd.gov/economicassistance/tanf/" },
    housing: { name: "South Dakota Housing Development Authority", url: "https://www.sdhda.org/" },
    workforce: { name: "South Dakota DLR", url: "https://dlr.sd.gov/", phone: "605-773-3101" },
    education: { name: "South Dakota Board of Regents", url: "https://www.sdbor.edu/" },
    legalAid: { name: "East River Legal Services", url: "https://www.erlservices.org/" },
    youthServices: { name: "SD Department of Corrections - Juvenile", url: "https://doc.sd.gov/juvenile/" }
  },
  TN: {
    snap: { name: "Tennessee SNAP", url: "https://www.tn.gov/humanservices/for-families/supplemental-nutrition-assistance-program-snap.html" },
    medicaid: { name: "TennCare", url: "https://www.tn.gov/tenncare.html" },
    tanf: { name: "Tennessee Families First", url: "https://www.tn.gov/humanservices/for-families/families-first-tanf.html" },
    housing: { name: "Tennessee Housing Development Agency", url: "https://thda.org/" },
    workforce: { name: "Tennessee Department of Labor & Workforce Development", url: "https://www.tn.gov/workforce.html", phone: "844-224-5818" },
    education: { name: "Tennessee Higher Education Commission", url: "https://www.tn.gov/thec.html" },
    legalAid: { name: "Legal Aid Society of Middle Tennessee", url: "https://las.org/" },
    youthServices: { name: "Tennessee Department of Children's Services", url: "https://www.tn.gov/dcs.html" }
  },
  TX: {
    snap: { name: "Texas SNAP", url: "https://www.hhs.texas.gov/services/food/snap-food-benefits" },
    medicaid: { name: "Texas Medicaid", url: "https://www.hhs.texas.gov/services/health/medicaid-chip" },
    tanf: { name: "Texas TANF", url: "https://www.hhs.texas.gov/services/financial/cash-help/tanf-cash-help" },
    housing: { name: "Texas Department of Housing & Community Affairs", url: "https://www.tdhca.state.tx.us/" },
    workforce: { name: "Texas Workforce Commission", url: "https://www.twc.texas.gov/", phone: "512-463-2222" },
    education: { name: "Texas Higher Education Coordinating Board", url: "https://www.highered.texas.gov/" },
    legalAid: { name: "Texas RioGrande Legal Aid", url: "https://www.trla.org/" },
    youthServices: { name: "Texas Juvenile Justice Department", url: "https://www.tjjd.texas.gov/" }
  },
  UT: {
    snap: { name: "Utah SNAP", url: "https://jobs.utah.gov/customereducation/programs/foodstamps/index.html" },
    medicaid: { name: "Utah Medicaid", url: "https://medicaid.utah.gov/" },
    tanf: { name: "Utah Family Employment Program", url: "https://jobs.utah.gov/customereducation/programs/fep/" },
    housing: { name: "Utah Housing Corporation", url: "https://utahhousingcorp.org/" },
    workforce: { name: "Utah Department of Workforce Services", url: "https://jobs.utah.gov/", phone: "801-526-9675" },
    education: { name: "Utah System of Higher Education", url: "https://ushe.edu/" },
    legalAid: { name: "Utah Legal Services", url: "https://www.utahlegalservices.org/" },
    youthServices: { name: "Utah Division of Juvenile Justice", url: "https://jjs.utah.gov/" }
  },
  VT: {
    snap: { name: "Vermont 3SquaresVT", url: "https://dcf.vermont.gov/benefits/3squaresvt" },
    medicaid: { name: "Vermont Green Mountain Care", url: "https://dvha.vermont.gov/" },
    tanf: { name: "Vermont Reach Up", url: "https://dcf.vermont.gov/benefits/reachup" },
    housing: { name: "Vermont Housing Finance Agency", url: "https://www.vhfa.org/" },
    workforce: { name: "Vermont Department of Labor", url: "https://labor.vermont.gov/", phone: "802-828-4000" },
    education: { name: "Vermont Student Assistance Corporation", url: "https://www.vsac.org/" },
    legalAid: { name: "Legal Services Vermont", url: "https://www.legalservicesvt.org/" },
    youthServices: { name: "Vermont Department for Children and Families", url: "https://dcf.vermont.gov/" }
  },
  VA: {
    snap: { name: "Virginia SNAP", url: "https://www.dss.virginia.gov/benefit/snap.cgi" },
    medicaid: { name: "Virginia Medicaid", url: "https://www.dmas.virginia.gov/" },
    tanf: { name: "Virginia TANF (VIEW)", url: "https://www.dss.virginia.gov/benefit/tanf/" },
    housing: { name: "Virginia Housing", url: "https://www.virginiahousing.com/" },
    workforce: { name: "Virginia Employment Commission", url: "https://www.vec.virginia.gov/", phone: "866-832-2363" },
    education: { name: "State Council of Higher Education for Virginia", url: "https://www.schev.edu/" },
    legalAid: { name: "Legal Aid Justice Center", url: "https://www.justice4all.org/" },
    youthServices: { name: "Virginia Department of Juvenile Justice", url: "https://djj.virginia.gov/" }
  },
  WA: {
    snap: { name: "Washington Basic Food", url: "https://www.dshs.wa.gov/esa/community-services-offices/basic-food" },
    medicaid: { name: "Washington Apple Health", url: "https://www.hca.wa.gov/free-or-low-cost-health-care/apple-health-medicaid-coverage" },
    tanf: { name: "Washington WorkFirst", url: "https://www.dshs.wa.gov/esa/community-services-offices/workfirst" },
    housing: { name: "Washington State Housing Finance Commission", url: "https://www.wshfc.org/" },
    workforce: { name: "WorkSource Washington", url: "https://www.worksourcewa.com/", phone: "360-902-9500" },
    education: { name: "Washington Student Achievement Council", url: "https://wsac.wa.gov/" },
    legalAid: { name: "Northwest Justice Project", url: "https://nwjustice.org/" },
    youthServices: { name: "WA Department of Children, Youth & Families", url: "https://www.dcyf.wa.gov/" }
  },
  WV: {
    snap: { name: "West Virginia SNAP", url: "https://dhhr.wv.gov/bcf/Services/familyassistance/Pages/SNAP.aspx" },
    medicaid: { name: "West Virginia Medicaid", url: "https://dhhr.wv.gov/bms/" },
    tanf: { name: "WV Works", url: "https://dhhr.wv.gov/bcf/Services/familyassistance/Pages/WV-Works.aspx" },
    housing: { name: "West Virginia Housing Development Fund", url: "https://www.wvhdf.com/" },
    workforce: { name: "WorkForce West Virginia", url: "https://workforcewv.org/", phone: "304-558-2660" },
    education: { name: "West Virginia Higher Education Policy Commission", url: "https://www.wvhepc.edu/" },
    legalAid: { name: "Legal Aid of West Virginia", url: "https://legalaidwv.org/" },
    youthServices: { name: "WV Division of Corrections and Rehabilitation - Juvenile", url: "https://dcr.wv.gov/juvenile" }
  },
  WI: {
    snap: { name: "Wisconsin FoodShare", url: "https://www.dhs.wisconsin.gov/foodshare/index.htm" },
    medicaid: { name: "Wisconsin BadgerCare Plus", url: "https://www.dhs.wisconsin.gov/badgercareplus/index.htm" },
    tanf: { name: "Wisconsin W-2", url: "https://dcf.wisconsin.gov/w2" },
    housing: { name: "Wisconsin Housing and Economic Development Authority", url: "https://www.wheda.com/" },
    workforce: { name: "Wisconsin Department of Workforce Development", url: "https://dwd.wisconsin.gov/", phone: "608-266-3131" },
    education: { name: "Wisconsin Higher Educational Aids Board", url: "https://heab.wi.gov/" },
    legalAid: { name: "Legal Action of Wisconsin", url: "https://www.legalaction.org/" },
    youthServices: { name: "Wisconsin Division of Juvenile Corrections", url: "https://doc.wi.gov/Pages/JuvenileCorrections/JuvenileCorrections.aspx" }
  },
  WY: {
    snap: { name: "Wyoming SNAP", url: "https://dfs.wyo.gov/assistance-programs/food-assistance/snap/" },
    medicaid: { name: "Wyoming Medicaid", url: "https://health.wyo.gov/healthcarefin/medicaid/" },
    tanf: { name: "Wyoming POWER", url: "https://dfs.wyo.gov/assistance-programs/cash-assistance/" },
    housing: { name: "Wyoming Community Development Authority", url: "https://www.wyomingcda.com/" },
    workforce: { name: "Wyoming Department of Workforce Services", url: "https://dws.wyo.gov/", phone: "307-777-8650" },
    education: { name: "Wyoming Community College Commission", url: "https://communitycolleges.wy.edu/" },
    legalAid: { name: "Legal Aid of Wyoming", url: "https://www.lawyoming.org/" },
    youthServices: { name: "Wyoming Department of Family Services", url: "https://dfs.wyo.gov/" }
  },
  DC: {
    snap: { name: "DC SNAP", url: "https://dhs.dc.gov/service/snap-supplemental-nutrition-assistance-program" },
    medicaid: { name: "DC Medicaid", url: "https://dhcf.dc.gov/service/medicaid" },
    tanf: { name: "DC TANF", url: "https://dhs.dc.gov/service/tanf-temporary-assistance-needy-families" },
    housing: { name: "DC Housing Authority", url: "https://www.dchousing.org/" },
    workforce: { name: "DC Department of Employment Services", url: "https://does.dc.gov/", phone: "202-724-7000" },
    education: { name: "DC Office of the State Superintendent of Education", url: "https://osse.dc.gov/" },
    legalAid: { name: "Legal Aid Society of DC", url: "https://www.legalaiddc.org/" },
    youthServices: { name: "DC Department of Youth Rehabilitation Services", url: "https://dyrs.dc.gov/" }
  },
  PR: {
    snap: { name: "Puerto Rico NAP", url: "https://www.familia.pr.gov/" },
    medicaid: { name: "Puerto Rico Medicaid", url: "https://www.salud.gov.pr/" },
    tanf: { name: "Puerto Rico TANF", url: "https://www.familia.pr.gov/" },
    housing: { name: "Puerto Rico Housing Finance Authority", url: "https://www.afv.pr.gov/" },
    workforce: { name: "PR Department of Labor", url: "https://www.trabajo.pr.gov/", phone: "787-754-2119" },
    education: { name: "Puerto Rico Council on Higher Education", url: "https://www.ce.pr.gov/" },
    legalAid: { name: "Legal Services of Puerto Rico", url: "https://www.servicioslegales.org/" },
    youthServices: { name: "PR Department of the Family", url: "https://www.familia.pr.gov/" }
  },
  VI: {
    snap: { name: "USVI SNAP", url: "https://www.dhs.gov.vi/" },
    medicaid: { name: "USVI Medicaid", url: "https://www.medicaid.gov/state-overviews/virgin-islands.html" },
    tanf: { name: "USVI TANF", url: "https://www.dhs.gov.vi/" },
    housing: { name: "Virgin Islands Housing Authority", url: "https://www.vihousing.org/" },
    workforce: { name: "VI Department of Labor", url: "https://www.vidol.gov/", phone: "340-773-1994" },
    education: { name: "University of the Virgin Islands", url: "https://www.uvi.edu/" },
    legalAid: { name: "Legal Services of the Virgin Islands", url: "https://www.lsvi.org/" },
    youthServices: { name: "VI Department of Human Services", url: "https://www.dhs.gov.vi/" }
  },
  GU: {
    snap: { name: "Guam SNAP", url: "https://dphss.guam.gov/division-of-public-welfare/" },
    medicaid: { name: "Guam Medicaid", url: "https://dphss.guam.gov/division-of-public-welfare/" },
    tanf: { name: "Guam TANF", url: "https://dphss.guam.gov/division-of-public-welfare/" },
    housing: { name: "Guam Housing Corporation", url: "https://www.ghura.org/" },
    workforce: { name: "Guam Department of Labor", url: "https://dol.guam.gov/", phone: "671-475-7046" },
    education: { name: "University of Guam", url: "https://www.uog.edu/" },
    legalAid: { name: "Guam Legal Services", url: "https://www.guamlegalservices.org/" },
    youthServices: { name: "Guam Department of Youth Affairs", url: "https://dya.guam.gov/" }
  },
  AS: {
    snap: { name: "American Samoa Food Assistance", url: "https://www.americansamoa.gov/" },
    medicaid: { name: "American Samoa Medicaid", url: "https://www.medicaid.gov/state-overviews/american-samoa.html" },
    tanf: { name: "American Samoa TANF", url: "https://www.americansamoa.gov/" },
    housing: { name: "American Samoa Housing Authority", url: "https://www.americansamoa.gov/" },
    workforce: { name: "AS Department of Human Resources", url: "https://www.americansamoa.gov/", phone: "684-633-4485" },
    education: { name: "American Samoa Community College", url: "https://www.amsamoa.edu/" },
    legalAid: { name: "Legal Services - American Samoa", url: "https://www.americansamoa.gov/" },
    youthServices: { name: "AS Department of Youth", url: "https://www.americansamoa.gov/" }
  }
};

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia", PR: "Puerto Rico", VI: "U.S. Virgin Islands",
  GU: "Guam", AS: "American Samoa"
};

const FEDERAL_PROGRAMS: StateResource[] = [
  {
    state: "All States", stateCode: "US", category: "workforce", subcategory: "Youth Employment",
    name: "Job Corps", description: "Free education and vocational training for youth ages 16-24. Provides career training in over 100 career areas, GED and high school diploma programs, housing, meals, and job placement assistance.", url: "https://www.jobcorps.gov/", phone: "800-733-5627", eligibility: "Ages 16-24, low-income", ageRange: "16-24",
    tags: ["youth", "job training", "free", "residential", "GED", "federal"]
  },
  {
    state: "All States", stateCode: "US", category: "workforce", subcategory: "Youth Employment",
    name: "YouthBuild", description: "Provides education and career pathways for opportunity youth ages 16-24 who are out of school. Combines academic and construction skills training, leadership development, and community service.", url: "https://youthbuild.org/", phone: "617-623-9900", eligibility: "Ages 16-24, out of school", ageRange: "16-24",
    tags: ["youth", "construction", "GED", "leadership", "community service"]
  },
  {
    state: "All States", stateCode: "US", category: "workforce", subcategory: "Youth Employment",
    name: "AmeriCorps", description: "National service program providing opportunities to serve communities while earning education awards for college or trade school. Programs span education, environment, health, and disaster services.", url: "https://americorps.gov/", phone: "800-942-2677", eligibility: "Ages 17+", ageRange: "17+",
    tags: ["service", "education award", "community", "leadership", "federal"]
  },
  {
    state: "All States", stateCode: "US", category: "workforce", subcategory: "WIOA Programs",
    name: "WIOA Youth Program", description: "Workforce Innovation and Opportunity Act youth programs provide employment and training services to youth ages 14-24 facing barriers to employment. Includes tutoring, mentoring, work experiences, and occupational skills training.", url: "https://www.dol.gov/agencies/eta/youth", eligibility: "Ages 14-24, facing barriers", ageRange: "14-24",
    tags: ["WIOA", "federal", "job training", "mentoring", "work experience"]
  },
  {
    state: "All States", stateCode: "US", category: "workforce", subcategory: "Apprenticeships",
    name: "Registered Apprenticeship Program", description: "Earn-while-you-learn training programs registered with the U.S. Department of Labor. Provides structured on-the-job training combined with classroom instruction in over 1,000 occupations.", url: "https://www.apprenticeship.gov/", phone: "877-872-5627",
    eligibility: "Ages 16+", ageRange: "16+",
    tags: ["apprenticeship", "earn and learn", "federal", "skilled trades"]
  },
  {
    state: "All States", stateCode: "US", category: "education", subcategory: "Financial Aid (FAFSA)",
    name: "Federal Student Aid (FAFSA)", description: "Complete the Free Application for Federal Student Aid to access federal grants, loans, and work-study programs for college and career school. Pell Grants provide up to $7,395 per year for eligible students.", url: "https://studentaid.gov/", phone: "800-433-3243",
    eligibility: "All students", ageRange: "16+",
    tags: ["financial aid", "FAFSA", "Pell Grant", "federal", "college"]
  },
  {
    state: "All States", stateCode: "US", category: "education", subcategory: "Scholarships",
    name: "Federal TRIO Programs", description: "Outreach and student services programs for individuals from disadvantaged backgrounds. Includes Upward Bound, Talent Search, and Student Support Services to help students prepare for and succeed in college.", url: "https://www2.ed.gov/about/offices/list/ope/trio/index.html",
    eligibility: "First-generation, low-income students", ageRange: "14-24",
    tags: ["college prep", "first-generation", "tutoring", "mentoring", "federal"]
  },
  {
    state: "All States", stateCode: "US", category: "education", subcategory: "GED Programs",
    name: "GED Testing Service", description: "The official GED test is a group of four subject tests: Math, Science, Social Studies, and Reasoning Through Language Arts. Passing scores earn a high school equivalency credential accepted nationwide.", url: "https://ged.com/", eligibility: "Ages 16+", ageRange: "16+",
    tags: ["GED", "high school equivalency", "adult education"]
  },
  {
    state: "All States", stateCode: "US", category: "healthcare", subcategory: "Community Health Centers",
    name: "HRSA Health Center Finder", description: "Find federally-funded community health centers that provide comprehensive primary care services regardless of ability to pay. Services include medical, dental, mental health, and substance abuse treatment.", url: "https://findahealthcenter.hrsa.gov/", phone: "877-464-4772",
    eligibility: "All individuals", ageRange: "All ages",
    tags: ["health", "free", "sliding scale", "dental", "mental health", "federal"]
  },
  {
    state: "All States", stateCode: "US", category: "healthcare", subcategory: "CHIP",
    name: "Children's Health Insurance Program (CHIP)", description: "Provides low-cost health coverage to children in families that earn too much for Medicaid but cannot afford private insurance. Covers routine check-ups, immunizations, doctor visits, hospital care, and dental care.", url: "https://www.medicaid.gov/chip/index.html", phone: "877-543-7669",
    eligibility: "Children under 19", ageRange: "0-19",
    tags: ["children", "health insurance", "low-cost", "federal"]
  },
  {
    state: "All States", stateCode: "US", category: "food", subcategory: "School Meals",
    name: "National School Lunch Program", description: "Provides nutritionally balanced, low-cost or free lunches to children at school each school day. Available at public and nonprofit private schools and residential child care institutions.", url: "https://www.fns.usda.gov/nslp", eligibility: "School-age children", ageRange: "5-18",
    tags: ["free meals", "school", "nutrition", "federal"]
  },
  {
    state: "All States", stateCode: "US", category: "food", subcategory: "Summer Meals",
    name: "Summer Food Service Program", description: "Ensures children continue to receive nutritious meals when school is not in session during summer months. Sites include schools, parks, community centers, and churches.", url: "https://www.fns.usda.gov/sfsp", phone: "866-348-6479",
    eligibility: "Children 18 and under", ageRange: "0-18",
    tags: ["summer", "free meals", "nutrition", "federal"]
  },
  {
    state: "All States", stateCode: "US", category: "housing", subcategory: "Emergency Shelter",
    name: "National Runaway Safeline", description: "Provides crisis services, referrals, and resources for runaway, homeless, and at-risk youth. Offers a 24/7 hotline, online chat, and connections to local services and safe housing.", url: "https://www.1800runaway.org/", phone: "800-786-2929",
    eligibility: "Youth under 21", ageRange: "0-21",
    tags: ["emergency", "hotline", "homeless youth", "crisis", "federal"]
  },
  {
    state: "All States", stateCode: "US", category: "youth", subcategory: "Mentoring",
    name: "MENTOR: National Mentoring Partnership", description: "Connects young people with quality mentoring relationships and programs. Provides a national mentoring connector tool to find local mentoring programs in any community.", url: "https://www.mentoring.org/",
    eligibility: "Youth ages 6-24", ageRange: "6-24",
    tags: ["mentoring", "youth development", "national"]
  },
  {
    state: "All States", stateCode: "US", category: "youth", subcategory: "After-School Programs",
    name: "Boys & Girls Clubs of America", description: "Provides after-school programs for young people ages 6-18 including academic support, leadership programs, healthy lifestyles, workforce readiness, and character development.", url: "https://www.bgca.org/",
    eligibility: "Ages 6-18", ageRange: "6-18",
    tags: ["after-school", "youth", "leadership", "national"]
  },
  {
    state: "All States", stateCode: "US", category: "youth", subcategory: "Leadership Development",
    name: "4-H Youth Development", description: "Empowers young people ages 5-19 with skills to lead for a lifetime through hands-on learning in STEM, healthy living, agriculture, and civic engagement. Programs in every county nationwide.", url: "https://4-h.org/",
    eligibility: "Ages 5-19", ageRange: "5-19",
    tags: ["STEM", "agriculture", "leadership", "national"]
  },
  {
    state: "All States", stateCode: "US", category: "financial", subcategory: "Free Tax Prep (VITA)",
    name: "IRS Volunteer Income Tax Assistance (VITA)", description: "Free tax preparation service for individuals earning $64,000 or less, persons with disabilities, and limited English speakers. Certified volunteers prepare basic tax returns at community locations.", url: "https://www.irs.gov/individuals/free-tax-return-preparation-for-qualifying-taxpayers",
    eligibility: "Income under $64,000", ageRange: "All ages",
    tags: ["free", "taxes", "VITA", "federal"]
  },
  {
    state: "All States", stateCode: "US", category: "financial", subcategory: "Benefits Enrollment",
    name: "Benefits.gov", description: "Official U.S. government website to find and apply for government benefit programs. Covers over 1,000 federal, state, and local programs including food, housing, health, education, and employment assistance.", url: "https://www.benefits.gov/",
    eligibility: "All individuals", ageRange: "All ages",
    tags: ["benefits", "federal", "all programs", "eligibility"]
  },
  {
    state: "All States", stateCode: "US", category: "technology", subcategory: "Affordable Connectivity",
    name: "FCC Affordable Connectivity Program", description: "Helps low-income households afford broadband internet service by providing a discount of up to $30/month on internet service and a one-time discount of up to $100 for a laptop, desktop, or tablet.", url: "https://www.fcc.gov/acp",
    eligibility: "Low-income households", ageRange: "All ages",
    tags: ["internet", "broadband", "discount", "device", "federal"]
  },
  {
    state: "All States", stateCode: "US", category: "technology", subcategory: "Digital Literacy",
    name: "DigitalLiteracy.gov", description: "Connects individuals to digital literacy resources including computer basics, internet safety, online job searching, and using digital tools. Portal to local training programs nationwide.", url: "https://digitalliteracy.gov/",
    eligibility: "All individuals", ageRange: "All ages",
    tags: ["computer skills", "internet safety", "digital inclusion", "federal"]
  },
  {
    state: "All States", stateCode: "US", category: "legal", subcategory: "Youth Advocacy",
    name: "National Juvenile Defender Center", description: "Ensures excellence in juvenile defense by providing resources, training, and advocacy for youth in the justice system. Connects families with local juvenile defense attorneys.", url: "https://njdc.info/",
    eligibility: "Youth in justice system", ageRange: "10-21",
    tags: ["juvenile justice", "defense", "advocacy", "national"]
  },
  {
    state: "All States", stateCode: "US", category: "legal", subcategory: "Immigration Services",
    name: "USCIS Free Resources", description: "Official immigration information including citizenship application, work permits, green card renewal, DACA, and refugee services. Free official forms and naturalization test preparation materials.", url: "https://www.uscis.gov/", phone: "800-375-5283",
    eligibility: "Immigrants and refugees", ageRange: "All ages",
    tags: ["immigration", "citizenship", "DACA", "federal"]
  },
  {
    state: "All States", stateCode: "US", category: "workforce", subcategory: "American Job Centers",
    name: "American Job Center Finder", description: "Find your nearest American Job Center for free career services including resume help, job search assistance, career counseling, skills assessments, training referrals, and unemployment insurance. Nearly 2,400 centers nationwide.", url: "https://www.careeronestop.org/LocalHelp/AmericanJobCenters/find-american-job-centers.aspx", phone: "877-872-5627",
    eligibility: "All job seekers", ageRange: "16+",
    tags: ["job search", "resume", "career counseling", "free", "federal"]
  },
  {
    state: "All States", stateCode: "US", category: "workforce", subcategory: "Job Training Programs",
    name: "CareerOneStop", description: "U.S. Department of Labor sponsored portal for career exploration, training, and job search. Includes occupation profiles, salary data, certification finder, scholarship search, and training provider locator.", url: "https://www.careeronestop.org/",
    eligibility: "All individuals", ageRange: "14+",
    tags: ["career exploration", "training", "salary data", "federal"]
  },
  {
    state: "All States", stateCode: "US", category: "transportation", subcategory: "Vehicle Assistance",
    name: "Vehicles for Change", description: "Provides reliable used vehicles to families in need at affordable prices. Offers auto repair training and employment programs for underserved communities.", url: "https://vehiclesforchange.org/",
    eligibility: "Low-income families", ageRange: "18+",
    tags: ["car", "transportation", "affordable", "national"]
  }
];

export function getStatesList(): Array<{ code: string; name: string }> {
  return Object.entries(STATE_NAMES)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function searchResources(params: {
  stateCode?: string;
  categories?: string[];
  query?: string;
  ageRange?: string;
}): StateResource[] {
  const results: StateResource[] = [];
  const { stateCode, categories, query, ageRange } = params;

  if (stateCode && STATE_DATA[stateCode]) {
    const stateInfo = STATE_DATA[stateCode];
    const stateName = STATE_NAMES[stateCode] || stateCode;

    const addStateResource = (cat: string, subcat: string, info: { name: string; url: string; phone?: string }, desc: string, tags: string[]) => {
      results.push({
        state: stateName, stateCode, category: cat, subcategory: subcat,
        name: info.name, description: desc, url: info.url, phone: (info as any).phone,
        tags: [...tags, stateCode.toLowerCase(), stateName.toLowerCase()]
      });
    };

    addStateResource("food", "SNAP (Food Stamps)", stateInfo.snap,
      `Apply for SNAP food benefits in ${stateName}. SNAP helps low-income individuals and families buy nutritious food at grocery stores and farmers markets.`,
      ["SNAP", "food stamps", "nutrition", "state"]);

    addStateResource("healthcare", "Medicaid", stateInfo.medicaid,
      `${stateName} Medicaid program provides free or low-cost health coverage for eligible low-income adults, children, pregnant women, elderly adults, and people with disabilities.`,
      ["Medicaid", "health insurance", "free", "state"]);

    addStateResource("financial", "Emergency Assistance", stateInfo.tanf,
      `${stateName} Temporary Assistance for Needy Families (TANF) provides cash assistance and supportive services to help families achieve self-sufficiency.`,
      ["TANF", "cash assistance", "emergency", "state"]);

    addStateResource("housing", "Public Housing", stateInfo.housing,
      `${stateName} housing assistance programs including affordable housing, rental assistance, down payment help, and emergency shelter services.`,
      ["housing", "rental assistance", "affordable", "state"]);

    addStateResource("workforce", "American Job Centers", stateInfo.workforce,
      `${stateName} workforce development services including job search, career counseling, skills training, resume assistance, and employment workshops.`,
      ["workforce", "job search", "career", "training", "state"]);

    addStateResource("education", "Financial Aid (FAFSA)", stateInfo.education,
      `${stateName} higher education resources including state scholarships, grants, community colleges, and financial aid programs.`,
      ["education", "scholarships", "college", "state"]);

    addStateResource("legal", "Legal Aid", stateInfo.legalAid,
      `Free civil legal assistance for low-income residents of ${stateName}. Services include housing disputes, family law, consumer protection, and public benefits.`,
      ["legal aid", "free", "civil", "state"]);

    addStateResource("youth", "Youth Centers", stateInfo.youthServices,
      `${stateName} youth services including programs for at-risk youth, juvenile justice, foster care, and youth development.`,
      ["youth", "juvenile", "family services", "state"]);
  }

  for (const federal of FEDERAL_PROGRAMS) {
    results.push(federal);
  }

  let filtered = results;

  if (categories && categories.length > 0) {
    filtered = filtered.filter(r => categories.includes(r.category));
  }

  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.tags.some(t => t.includes(q)) ||
      r.subcategory.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  }

  if (ageRange) {
    const age = parseInt(ageRange);
    if (!isNaN(age)) {
      filtered = filtered.filter(r => {
        if (!r.ageRange || r.ageRange === "All ages") return true;
        const match = r.ageRange.match(/(\d+)-(\d+)/);
        if (match) {
          return age >= parseInt(match[1]) && age <= parseInt(match[2]);
        }
        const plusMatch = r.ageRange.match(/(\d+)\+/);
        if (plusMatch) return age >= parseInt(plusMatch[1]);
        return true;
      });
    }
  }

  return filtered;
}

export async function fetchBLSWageData(stateCode: string, occupationCode?: string): Promise<any> {
  try {
    const areaCode = BLS_STATE_CODES[stateCode];
    if (!areaCode) return null;

    const seriesId = occupationCode
      ? `OEUM${areaCode}000000${occupationCode}01`
      : `OEUM${areaCode}00000000000001`;

    const response = await fetch("https://api.bls.gov/publicAPI/v2/timeseries/data/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seriesid: [seriesId],
        startyear: "2023",
        endyear: "2024"
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data?.Results?.series?.[0]?.data || null;
  } catch {
    return null;
  }
}

const BLS_STATE_CODES: Record<string, string> = {
  AL: "0100", AK: "0200", AZ: "0400", AR: "0500", CA: "0600",
  CO: "0800", CT: "0900", DE: "1000", FL: "1200", GA: "1300",
  HI: "1500", ID: "1600", IL: "1700", IN: "1800", IA: "1900",
  KS: "2000", KY: "2100", LA: "2200", ME: "2300", MD: "2400",
  MA: "2500", MI: "2600", MN: "2700", MS: "2800", MO: "2900",
  MT: "3000", NE: "3100", NV: "3200", NH: "3300", NJ: "3400",
  NM: "3500", NY: "3600", NC: "3700", ND: "3800", OH: "3900",
  OK: "4000", OR: "4100", PA: "4200", RI: "4400", SC: "4500",
  SD: "4600", TN: "4700", TX: "4800", UT: "4900", VT: "5000",
  VA: "5100", WA: "5300", WV: "5400", WI: "5500", WY: "5600",
  DC: "1100", PR: "7200"
};

export function getResourceCategories(): ResourceCategory[] {
  return RESOURCE_CATEGORIES;
}

export function getStateName(code: string): string {
  return STATE_NAMES[code] || code;
}
