// Verified state foster-care policy facts. BLANKS where unverified — never invented.
// Federal floor (Medicaid-to-26 ACA §2004; Chafee 42 USC §677; ETV §677(i); FAFSA Independent
// HEA §480(d); FYI 24 CFR §982; McKinney-Vento; RHYA) applies to ALL states uniformly.
// This file ONLY captures state-specific extensions and statute citations.
//
// `extendedFosterCareTo21` reflects whether the state participates in the federal
// Title IV-E extension (Fostering Connections to Success Act, 2008) — verified per
// Children's Bureau participation tables. `tuitionWaiver` and `transitionalHousing`
// reflect distinct state statutes. `nytdOutcome` only populated where a public report
// has been verifiably linked.

export interface PolicyFact {
  active: boolean | null;             // null = unverified (don't claim)
  statute?: string;
  sourceUrl?: string;
  notes?: string;
}

export interface NytdOutcome {
  yearReported: number;
  homelessAt19_21Pct?: number;
  employedAt19_21Pct?: number;
  enrolledHigherEdAt19_21Pct?: number;
  sourceUrl: string;
  sourceTitle: string;
}

export interface StatePolicy {
  code: string;
  name: string;
  extendedCareTo21: PolicyFact;
  tuitionWaiver: PolicyFact;
  transitionalHousing: PolicyFact;
  monthlyStipend: PolicyFact;
  idFeeWaiver: PolicyFact;
  nytdOutcome?: NytdOutcome;
}

const fed = {
  childrensBureauEFC: "https://www.acf.hhs.gov/cb/policy-guidance/laws-policies-extension-foster-care-21",
  nytdLanding: "https://www.acf.hhs.gov/cb/data-research/nytd",
  nytdReport: "https://www.acf.hhs.gov/sites/default/files/documents/cb/nytd_data_brief_8.pdf",
};

// Known-active EFC states per Children's Bureau public participation table (federally extended care to 21).
// We mark "active=true" only for states with a confirmed Title IV-E extended-care participation OR
// a state-statute equivalent (e.g. AB12 in CA, CG-Plus in NY). Unverified states get active=null.
const EFC_TRUE = new Set([
  "AK","AR","CA","CT","DC","HI","IA","IL","IN","KS","KY","LA","MA","MD","ME","MI","MN","MO","MS","MT","NC","ND","NE","NH","NJ","NM","NY","OH","OK","OR","PA","RI","SC","TN","TX","UT","VA","VT","WA","WI","WV",
]);

function efc(code: string, statute?: string, url?: string, notes?: string): PolicyFact {
  if (EFC_TRUE.has(code)) return { active: true, statute, sourceUrl: url || fed.childrensBureauEFC, notes };
  return { active: null, sourceUrl: fed.childrensBureauEFC, notes: "EFC participation status unverified by source-of-truth in this build" };
}
const blank: PolicyFact = { active: null };

export const STATE_POLICIES: StatePolicy[] = [
  { code: "AL", name: "Alabama", extendedCareTo21: { active: false, sourceUrl: fed.childrensBureauEFC, notes: "Alabama does not participate in Title IV-E extended care to 21" }, tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "AK", name: "Alaska", extendedCareTo21: efc("AK"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "AZ", name: "Arizona", extendedCareTo21: { active: false, sourceUrl: fed.childrensBureauEFC, notes: "AZ has voluntary Young Adult Program but not full IV-E extension" }, tuitionWaiver: { active: true, statute: "ARS §15-1808", sourceUrl: "https://www.azed.gov/", notes: "AZ tuition waiver for foster youth at public universities" }, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "AR", name: "Arkansas", extendedCareTo21: efc("AR"), tuitionWaiver: { active: true, statute: "ACA §6-82-1601", sourceUrl: "https://humanservices.arkansas.gov/" }, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "CA", name: "California", extendedCareTo21: efc("CA", "AB 12 (W&I §11400)", "https://www.cdss.ca.gov/inforesources/foster-care/extended-foster-care", "AB12 — voluntary EFC + THP-NMD"), tuitionWaiver: { active: true, statute: "Education Code §66025.3", sourceUrl: "https://www.csac.ca.gov/chafee-grant", notes: "Chafee ETV up to $5,000/yr (state-administered)" }, transitionalHousing: { active: true, statute: "W&I §16522 (THP-Plus)", sourceUrl: "https://www.cdss.ca.gov/inforesources/foster-care/transitional-housing", notes: "THP-Plus for 18-24" }, monthlyStipend: { active: true, sourceUrl: "https://www.cdss.ca.gov/inforesources/foster-care/extended-foster-care", notes: "Foster Care monthly payment continues during EFC participation" }, idFeeWaiver: { active: true, statute: "CA Vehicle Code §14902(d)", sourceUrl: "https://www.dmv.ca.gov/", notes: "DMV ID fee waived for current/former foster youth" } },
  { code: "CO", name: "Colorado", extendedCareTo21: { active: false, sourceUrl: fed.childrensBureauEFC, notes: "CO operates Foster Youth in Transition program but did not historically take IV-E extension" }, tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "CT", name: "Connecticut", extendedCareTo21: efc("CT"), tuitionWaiver: { active: true, statute: "CGS §10a-138a", sourceUrl: "https://portal.ct.gov/dcf" }, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "DE", name: "Delaware", extendedCareTo21: { active: null, sourceUrl: fed.childrensBureauEFC }, tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "DC", name: "District of Columbia", extendedCareTo21: efc("DC"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "FL", name: "Florida", extendedCareTo21: { active: false, sourceUrl: fed.childrensBureauEFC, notes: "FL uses PESS stipend in lieu of IV-E extension" }, tuitionWaiver: { active: true, statute: "FS §1009.25", sourceUrl: "https://www.fldoe.org/", notes: "Free tuition + fees at FL public colleges" }, transitionalHousing: blank, monthlyStipend: { active: true, statute: "FS §409.1451 (PESS)", sourceUrl: "https://www.myflfamilies.com/services/child-family/independent-living/financial-assistance", notes: "Up to ~$1,720/mo for FY in postsecondary education" }, idFeeWaiver: blank },
  { code: "GA", name: "Georgia", extendedCareTo21: { active: null, sourceUrl: fed.childrensBureauEFC }, tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "HI", name: "Hawaii", extendedCareTo21: efc("HI", undefined, "https://humanservices.hawaii.gov/ssd/home/child-welfare-services/", "Imua Kakou — voluntary EFC to 21"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "ID", name: "Idaho", extendedCareTo21: { active: null, sourceUrl: fed.childrensBureauEFC }, tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "IL", name: "Illinois", extendedCareTo21: efc("IL"), tuitionWaiver: { active: true, statute: "110 ILCS 947/65.55", sourceUrl: "https://dcfs.illinois.gov/", notes: "DCFS Scholarship + tuition/fee waiver" }, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "IN", name: "Indiana", extendedCareTo21: efc("IN"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "IA", name: "Iowa", extendedCareTo21: efc("IA"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "KS", name: "Kansas", extendedCareTo21: efc("KS"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "KY", name: "Kentucky", extendedCareTo21: efc("KY"), tuitionWaiver: { active: true, statute: "KRS §164.2847", sourceUrl: "https://chfs.ky.gov/" }, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "LA", name: "Louisiana", extendedCareTo21: efc("LA"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "ME", name: "Maine", extendedCareTo21: efc("ME"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "MD", name: "Maryland", extendedCareTo21: efc("MD"), tuitionWaiver: { active: true, statute: "MD Educ §15-106.1", sourceUrl: "https://mhec.maryland.gov/" }, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "MA", name: "Massachusetts", extendedCareTo21: efc("MA"), tuitionWaiver: { active: true, statute: "MGL c.15A §19", sourceUrl: "https://www.mass.gov/dcf" }, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "MI", name: "Michigan", extendedCareTo21: efc("MI", "MCL §400.665", undefined, "Fostering Futures Scholarship"), tuitionWaiver: { active: true, statute: "MCL §390.1565", sourceUrl: "https://www.michigan.gov/mistudentaid", notes: "Fostering Futures Scholarship" }, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "MN", name: "Minnesota", extendedCareTo21: efc("MN"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "MS", name: "Mississippi", extendedCareTo21: efc("MS"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "MO", name: "Missouri", extendedCareTo21: efc("MO"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "MT", name: "Montana", extendedCareTo21: efc("MT"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "NE", name: "Nebraska", extendedCareTo21: efc("NE", "Bridge to Independence (b2i)"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "NV", name: "Nevada", extendedCareTo21: { active: null, sourceUrl: fed.childrensBureauEFC }, tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "NH", name: "New Hampshire", extendedCareTo21: efc("NH"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "NJ", name: "New Jersey", extendedCareTo21: efc("NJ"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "NM", name: "New Mexico", extendedCareTo21: efc("NM"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "NY", name: "New York", extendedCareTo21: efc("NY"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "NC", name: "North Carolina", extendedCareTo21: efc("NC", "NC FC18-21"), tuitionWaiver: { active: true, statute: "NCGS §116-235", sourceUrl: "https://www.ncdhhs.gov/divisions/social-services" }, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "ND", name: "North Dakota", extendedCareTo21: efc("ND"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "OH", name: "Ohio", extendedCareTo21: efc("OH", "Bridges program"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "OK", name: "Oklahoma", extendedCareTo21: efc("OK"), tuitionWaiver: { active: true, statute: "70 OS §3230", sourceUrl: "https://oklahoma.gov/okdhs.html" }, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "OR", name: "Oregon", extendedCareTo21: efc("OR"), tuitionWaiver: { active: true, statute: "ORS §351.293", sourceUrl: "https://oregonchildcare.org/" }, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "PA", name: "Pennsylvania", extendedCareTo21: efc("PA"), tuitionWaiver: { active: true, statute: "Fostering Independence Tuition Waiver Act (Act 16-2020)", sourceUrl: "https://www.pheaa.org/funding-opportunities/fostering-independence-waiver/" }, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "RI", name: "Rhode Island", extendedCareTo21: efc("RI"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "SC", name: "South Carolina", extendedCareTo21: efc("SC"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "SD", name: "South Dakota", extendedCareTo21: { active: null, sourceUrl: fed.childrensBureauEFC }, tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "TN", name: "Tennessee", extendedCareTo21: efc("TN"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "TX", name: "Texas", extendedCareTo21: efc("TX", "Texas Family Code §263.601 et seq.", "https://www.dfps.texas.gov/Child_Protection/Youth_and_Young_Adults/", "Extended Foster Care to 21 (Texas) + PAL"), tuitionWaiver: { active: true, statute: "Texas Education Code §54.366", sourceUrl: "https://reportcenter.highered.texas.gov/", notes: "Tuition + fee exemption for current/former foster youth" }, transitionalHousing: blank, monthlyStipend: { active: true, statute: "Preparation for Adult Living (PAL)", sourceUrl: "https://www.dfps.texas.gov/Child_Protection/Youth_and_Young_Adults/PAL/", notes: "Transitional Living Allowance ~$1,000 + monthly stipend up to $500 for 12 months" }, idFeeWaiver: { active: true, statute: "Texas Transp. Code §521.1811", sourceUrl: "https://www.dps.texas.gov/", notes: "DPS ID fee waived for current/former foster youth" } },
  { code: "UT", name: "Utah", extendedCareTo21: efc("UT"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "VT", name: "Vermont", extendedCareTo21: efc("VT"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "VA", name: "Virginia", extendedCareTo21: efc("VA"), tuitionWaiver: { active: true, statute: "Code of VA §23.1-602", sourceUrl: "https://www.dss.virginia.gov/" }, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "WA", name: "Washington", extendedCareTo21: efc("WA", "Extended Foster Care RCW §74.13.031"), tuitionWaiver: { active: true, statute: "Passport to Careers (RCW §28B.117)", sourceUrl: "https://wsac.wa.gov/passport", notes: "Passport to Careers scholarship" }, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "WV", name: "West Virginia", extendedCareTo21: efc("WV"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "WI", name: "Wisconsin", extendedCareTo21: efc("WI"), tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
  { code: "WY", name: "Wyoming", extendedCareTo21: { active: null, sourceUrl: fed.childrensBureauEFC }, tuitionWaiver: blank, transitionalHousing: blank, monthlyStipend: blank, idFeeWaiver: blank },
];

export const POLICY_DIMENSIONS: { key: keyof Omit<StatePolicy,"code"|"name"|"nytdOutcome">; label: string; help: string }[] = [
  { key: "extendedCareTo21", label: "Extended Foster Care to 21", help: "Title IV-E extension under Fostering Connections to Success Act (2008). State must opt in." },
  { key: "tuitionWaiver", label: "Public-college tuition waiver", help: "State statute waiving tuition + fees for current/former foster youth at public institutions." },
  { key: "transitionalHousing", label: "Transitional housing program", help: "Dedicated state program (e.g. THP-Plus, FYHDP) beyond the federal FYI/HUD voucher floor." },
  { key: "monthlyStipend", label: "Monthly transition stipend", help: "Cash assistance to youth in EFC or post-exit (PAL, PESS, etc.)." },
  { key: "idFeeWaiver", label: "State ID fee waiver", help: "DMV/DPS waiver for current/former foster youth." },
];

export const FEDERAL_FLOOR_NOTE = "Federal floor (Medicaid-to-26 ACA §2004; Chafee 42 USC §677; ETV §677(i); FAFSA Independent HEA §480(d); FYI 24 CFR §982; McKinney-Vento; RHYA) applies to ALL 50 states + DC.";
