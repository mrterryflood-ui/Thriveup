// RPLICE v2 — Replicable Contract
// Federal-partner registry for NSF 26-508 TechAccess Coordination Hubs.
//
// Three federal networks NSF requires Hubs to plug into:
//   1. USDA-NIFA Cooperative Extension — real land-grant institution per state
//      (1862 land-grants; territory equivalents). Verifiable via nifa.usda.gov.
//   2. DOL Employment & Training — American Job Centers, accessed via
//      CareerOneStop service locator (parameterized by state).
//   3. SBA Small Business Development Centers — accessed via SBA local-
//      assistance finder (parameterized by state).
//
// Every URL below resolves to a real, working federal resource.

import { JURISDICTIONS } from "./jurisdictions";

export interface ExtensionPartner {
  institution: string;
  url: string;
}

export interface FederalPartnerSet {
  jurisdictionCode: string;
  jurisdictionName: string;
  extension: ExtensionPartner;          // USDA-NIFA Cooperative Extension lead
  americanJobCenterLocator: string;     // DOL CareerOneStop, prefiltered to state
  sbdcLocator: string;                  // SBA SBDC, prefiltered to state
}

// 1862 + 1890 + territory land-grant Cooperative Extension lead institutions.
// Source: USDA-NIFA partner directory (nifa.usda.gov/grants/programs/capacity-grants).
const EXTENSION: Record<string, ExtensionPartner> = {
  AL: { institution: "Auburn University — Alabama Cooperative Extension System",         url: "https://www.aces.edu/" },
  AK: { institution: "University of Alaska Fairbanks — Cooperative Extension Service",    url: "https://www.uaf.edu/ces/" },
  AZ: { institution: "University of Arizona Cooperative Extension",                       url: "https://extension.arizona.edu/" },
  AR: { institution: "University of Arkansas Cooperative Extension Service",              url: "https://www.uaex.uada.edu/" },
  CA: { institution: "University of California Agriculture & Natural Resources",          url: "https://ucanr.edu/" },
  CO: { institution: "Colorado State University Extension",                               url: "https://extension.colostate.edu/" },
  CT: { institution: "UConn Extension",                                                    url: "https://extension.uconn.edu/" },
  DE: { institution: "University of Delaware Cooperative Extension",                      url: "https://www.udel.edu/academics/colleges/canr/cooperative-extension/" },
  FL: { institution: "University of Florida IFAS Extension",                              url: "https://sfyl.ifas.ufl.edu/" },
  GA: { institution: "University of Georgia Cooperative Extension",                       url: "https://extension.uga.edu/" },
  HI: { institution: "University of Hawai'i at Mānoa — CTAHR Cooperative Extension",      url: "https://www.ctahr.hawaii.edu/Site/Extension.aspx" },
  ID: { institution: "University of Idaho Extension",                                     url: "https://www.uidaho.edu/extension" },
  IL: { institution: "University of Illinois Extension",                                  url: "https://extension.illinois.edu/" },
  IN: { institution: "Purdue Extension",                                                  url: "https://extension.purdue.edu/" },
  IA: { institution: "Iowa State University Extension and Outreach",                      url: "https://www.extension.iastate.edu/" },
  KS: { institution: "Kansas State University Research and Extension",                    url: "https://www.ksre.k-state.edu/" },
  KY: { institution: "University of Kentucky Cooperative Extension Service",              url: "https://extension.ca.uky.edu/" },
  LA: { institution: "LSU AgCenter",                                                      url: "https://www.lsuagcenter.com/" },
  ME: { institution: "University of Maine Cooperative Extension",                         url: "https://extension.umaine.edu/" },
  MD: { institution: "University of Maryland Extension",                                  url: "https://extension.umd.edu/" },
  MA: { institution: "UMass Extension",                                                   url: "https://ag.umass.edu/" },
  MI: { institution: "Michigan State University Extension",                               url: "https://www.canr.msu.edu/outreach/" },
  MN: { institution: "University of Minnesota Extension",                                 url: "https://extension.umn.edu/" },
  MS: { institution: "Mississippi State University Extension Service",                    url: "https://extension.msstate.edu/" },
  MO: { institution: "University of Missouri Extension",                                  url: "https://extension.missouri.edu/" },
  MT: { institution: "Montana State University Extension",                                url: "https://www.montana.edu/extension/" },
  NE: { institution: "Nebraska Extension (University of Nebraska–Lincoln)",               url: "https://extension.unl.edu/" },
  NV: { institution: "University of Nevada, Reno Extension",                              url: "https://extension.unr.edu/" },
  NH: { institution: "UNH Cooperative Extension",                                         url: "https://extension.unh.edu/" },
  NJ: { institution: "Rutgers Cooperative Extension",                                     url: "https://njaes.rutgers.edu/extension/" },
  NM: { institution: "New Mexico State University Cooperative Extension Service",         url: "https://aces.nmsu.edu/ces/" },
  NY: { institution: "Cornell Cooperative Extension",                                     url: "https://cce.cornell.edu/" },
  NC: { institution: "NC State Extension",                                                url: "https://www.ces.ncsu.edu/" },
  ND: { institution: "NDSU Extension",                                                    url: "https://www.ndsu.edu/agriculture/extension" },
  OH: { institution: "Ohio State University Extension",                                   url: "https://extension.osu.edu/" },
  OK: { institution: "Oklahoma State University Extension",                               url: "https://extension.okstate.edu/" },
  OR: { institution: "Oregon State University Extension Service",                         url: "https://extension.oregonstate.edu/" },
  PA: { institution: "Penn State Extension",                                              url: "https://extension.psu.edu/" },
  RI: { institution: "URI Cooperative Extension",                                         url: "https://web.uri.edu/coopext/" },
  SC: { institution: "Clemson Cooperative Extension",                                     url: "https://www.clemson.edu/extension/" },
  SD: { institution: "SDSU Extension",                                                    url: "https://extension.sdstate.edu/" },
  TN: { institution: "University of Tennessee Extension",                                 url: "https://utia.tennessee.edu/extension/" },
  TX: { institution: "Texas A&M AgriLife Extension Service",                              url: "https://agrilifeextension.tamu.edu/" },
  UT: { institution: "Utah State University Extension",                                   url: "https://extension.usu.edu/" },
  VT: { institution: "UVM Extension",                                                     url: "https://www.uvm.edu/extension" },
  VA: { institution: "Virginia Cooperative Extension (Virginia Tech)",                    url: "https://ext.vt.edu/" },
  WA: { institution: "Washington State University Extension",                             url: "https://extension.wsu.edu/" },
  WV: { institution: "WVU Extension",                                                     url: "https://extension.wvu.edu/" },
  WI: { institution: "University of Wisconsin–Madison Division of Extension",             url: "https://extension.wisc.edu/" },
  WY: { institution: "University of Wyoming Extension",                                   url: "https://www.uwyo.edu/uwe/" },
  DC: { institution: "University of the District of Columbia — CAUSES Extension",         url: "https://www.udc.edu/causes/center-urban-agriculture-gardening-education/" },
  PR: { institution: "University of Puerto Rico — Agricultural Extension Service",        url: "https://www.uprm.edu/agricultura/sea/" },
  VI: { institution: "University of the Virgin Islands Cooperative Extension Service",    url: "https://www.uvi.edu/research/cooperative-extension-service/" },
  GU: { institution: "University of Guam Cooperative Extension & Outreach",               url: "https://www.uog.edu/extension/" },
  AS: { institution: "American Samoa Community College Land Grant Program",               url: "https://www.amsamoa.edu/landgrant" },
  MP: { institution: "Northern Marianas College — Cooperative Research, Extension & Education Service", url: "https://www.marianas.edu/crees" },
};

// CareerOneStop is DOL/ETA's official AJC + workforce service locator.
// Parameterizing with location=<STATE> returns that state's centers.
function ajcLocator(stateCode: string): string {
  return `https://www.careeronestop.org/LocalHelp/AmericanJobCenters/find-american-job-centers.aspx?location=${stateCode}&radius=100`;
}

// SBA local-assistance finder, prefiltered to SBDCs in the chosen state.
function sbdcLocator(stateCode: string): string {
  return `https://www.sba.gov/local-assistance/find?type=Small%20Business%20Development%20Center&pageNumber=1&location=${stateCode}`;
}

export const FEDERAL_PARTNERS: FederalPartnerSet[] = JURISDICTIONS.map(j => ({
  jurisdictionCode: j.code,
  jurisdictionName: j.name,
  extension: EXTENSION[j.code],
  americanJobCenterLocator: ajcLocator(j.code),
  sbdcLocator: sbdcLocator(j.code),
}));

export const FEDERAL_PARTNERS_BY_CODE: Record<string, FederalPartnerSet> = Object.fromEntries(
  FEDERAL_PARTNERS.map(fp => [fp.jurisdictionCode, fp])
);

export function getFederalPartners(stateCode: string): FederalPartnerSet | undefined {
  return FEDERAL_PARTNERS_BY_CODE[stateCode.toUpperCase()];
}
