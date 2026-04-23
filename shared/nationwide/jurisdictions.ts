// RPLICE v2 — Replicable Contract
// Jurisdictions: all 50 states + DC + 5 inhabited U.S. territories.
// Used by NSF 26-508 TechAccess Coordination Hub generator and the
// federal-partner registry. Codes are USPS two-letter; FIPS state codes.

export interface Jurisdiction {
  code: string;
  name: string;
  capital: string;
  fips: string;
  type: "state" | "district" | "territory";
}

export const JURISDICTIONS: Jurisdiction[] = [
  { code: "AL", name: "Alabama",        capital: "Montgomery",      fips: "01", type: "state" },
  { code: "AK", name: "Alaska",         capital: "Juneau",          fips: "02", type: "state" },
  { code: "AZ", name: "Arizona",        capital: "Phoenix",         fips: "04", type: "state" },
  { code: "AR", name: "Arkansas",       capital: "Little Rock",     fips: "05", type: "state" },
  { code: "CA", name: "California",     capital: "Sacramento",      fips: "06", type: "state" },
  { code: "CO", name: "Colorado",       capital: "Denver",          fips: "08", type: "state" },
  { code: "CT", name: "Connecticut",    capital: "Hartford",        fips: "09", type: "state" },
  { code: "DE", name: "Delaware",       capital: "Dover",           fips: "10", type: "state" },
  { code: "FL", name: "Florida",        capital: "Tallahassee",     fips: "12", type: "state" },
  { code: "GA", name: "Georgia",        capital: "Atlanta",         fips: "13", type: "state" },
  { code: "HI", name: "Hawaii",         capital: "Honolulu",        fips: "15", type: "state" },
  { code: "ID", name: "Idaho",          capital: "Boise",           fips: "16", type: "state" },
  { code: "IL", name: "Illinois",       capital: "Springfield",     fips: "17", type: "state" },
  { code: "IN", name: "Indiana",        capital: "Indianapolis",    fips: "18", type: "state" },
  { code: "IA", name: "Iowa",           capital: "Des Moines",      fips: "19", type: "state" },
  { code: "KS", name: "Kansas",         capital: "Topeka",          fips: "20", type: "state" },
  { code: "KY", name: "Kentucky",       capital: "Frankfort",       fips: "21", type: "state" },
  { code: "LA", name: "Louisiana",      capital: "Baton Rouge",     fips: "22", type: "state" },
  { code: "ME", name: "Maine",          capital: "Augusta",         fips: "23", type: "state" },
  { code: "MD", name: "Maryland",       capital: "Annapolis",       fips: "24", type: "state" },
  { code: "MA", name: "Massachusetts",  capital: "Boston",          fips: "25", type: "state" },
  { code: "MI", name: "Michigan",       capital: "Lansing",         fips: "26", type: "state" },
  { code: "MN", name: "Minnesota",      capital: "Saint Paul",      fips: "27", type: "state" },
  { code: "MS", name: "Mississippi",    capital: "Jackson",         fips: "28", type: "state" },
  { code: "MO", name: "Missouri",       capital: "Jefferson City",  fips: "29", type: "state" },
  { code: "MT", name: "Montana",        capital: "Helena",          fips: "30", type: "state" },
  { code: "NE", name: "Nebraska",       capital: "Lincoln",         fips: "31", type: "state" },
  { code: "NV", name: "Nevada",         capital: "Carson City",     fips: "32", type: "state" },
  { code: "NH", name: "New Hampshire",  capital: "Concord",         fips: "33", type: "state" },
  { code: "NJ", name: "New Jersey",     capital: "Trenton",         fips: "34", type: "state" },
  { code: "NM", name: "New Mexico",     capital: "Santa Fe",        fips: "35", type: "state" },
  { code: "NY", name: "New York",       capital: "Albany",          fips: "36", type: "state" },
  { code: "NC", name: "North Carolina", capital: "Raleigh",         fips: "37", type: "state" },
  { code: "ND", name: "North Dakota",   capital: "Bismarck",        fips: "38", type: "state" },
  { code: "OH", name: "Ohio",           capital: "Columbus",        fips: "39", type: "state" },
  { code: "OK", name: "Oklahoma",       capital: "Oklahoma City",   fips: "40", type: "state" },
  { code: "OR", name: "Oregon",         capital: "Salem",           fips: "41", type: "state" },
  { code: "PA", name: "Pennsylvania",   capital: "Harrisburg",      fips: "42", type: "state" },
  { code: "RI", name: "Rhode Island",   capital: "Providence",      fips: "44", type: "state" },
  { code: "SC", name: "South Carolina", capital: "Columbia",        fips: "45", type: "state" },
  { code: "SD", name: "South Dakota",   capital: "Pierre",          fips: "46", type: "state" },
  { code: "TN", name: "Tennessee",      capital: "Nashville",       fips: "47", type: "state" },
  { code: "TX", name: "Texas",          capital: "Austin",          fips: "48", type: "state" },
  { code: "UT", name: "Utah",           capital: "Salt Lake City",  fips: "49", type: "state" },
  { code: "VT", name: "Vermont",        capital: "Montpelier",      fips: "50", type: "state" },
  { code: "VA", name: "Virginia",       capital: "Richmond",        fips: "51", type: "state" },
  { code: "WA", name: "Washington",     capital: "Olympia",         fips: "53", type: "state" },
  { code: "WV", name: "West Virginia",  capital: "Charleston",      fips: "54", type: "state" },
  { code: "WI", name: "Wisconsin",      capital: "Madison",         fips: "55", type: "state" },
  { code: "WY", name: "Wyoming",        capital: "Cheyenne",        fips: "56", type: "state" },
  { code: "DC", name: "District of Columbia",      capital: "Washington",   fips: "11", type: "district" },
  { code: "PR", name: "Puerto Rico",               capital: "San Juan",     fips: "72", type: "territory" },
  { code: "VI", name: "U.S. Virgin Islands",       capital: "Charlotte Amalie", fips: "78", type: "territory" },
  { code: "GU", name: "Guam",                      capital: "Hagåtña",      fips: "66", type: "territory" },
  { code: "AS", name: "American Samoa",            capital: "Pago Pago",    fips: "60", type: "territory" },
  { code: "MP", name: "Northern Mariana Islands",  capital: "Saipan",       fips: "69", type: "territory" },
];

export const JURISDICTIONS_BY_CODE: Record<string, Jurisdiction> = Object.fromEntries(
  JURISDICTIONS.map(j => [j.code, j])
);

export function getJurisdiction(code: string): Jurisdiction | undefined {
  return JURISDICTIONS_BY_CODE[code.toUpperCase()];
}
