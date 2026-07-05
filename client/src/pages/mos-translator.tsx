import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Wrench, GraduationCap, ArrowRight, CheckCircle2, AlertTriangle, ChevronRight, Search } from "lucide-react";
import { Link } from "wouter";

type Branch = "Army" | "Navy" | "Marine Corps" | "Air Force" | "Coast Guard";

interface MOSEntry {
  code: string;
  branch: Branch;
  title: string;
  description: string;
  civTitles: string[];
  tradeSims: string[];
  creds: string[];
  gaps: string[];
}

const MOS_DATA: MOSEntry[] = [
  // ── ARMY ──────────────────────────────────────────────────────────────────
  { code: "11B", branch: "Army", title: "Infantryman", description: "Ground combat, weapons operation, small-unit tactics", civTitles: ["Security Officer", "Law Enforcement Officer", "Corrections Officer", "Emergency Management Specialist"], tradeSims: [], creds: ["OSHA 10", "CPR/AED", "Security Guard License"], gaps: ["Trade certification of choice", "Criminal Justice degree pathway"] },
  { code: "12B", branch: "Army", title: "Combat Engineer", description: "Construction, demolition, bridging, power generation", civTitles: ["Construction Manager", "Heavy Equipment Operator", "Electrician", "Civil Engineering Tech"], tradeSims: ["Electrical", "Construction"], creds: ["NCCER Core Curriculum", "OSHA 30"], gaps: ["State journeyman license", "EPA 608 if HVAC track"] },
  { code: "13B", branch: "Army", title: "Cannon Crewmember", description: "Artillery systems operation, heavy machinery", civTitles: ["Heavy Equipment Operator", "Industrial Machinery Mechanic", "Crane Operator"], tradeSims: [], creds: ["NCCCO Crane Certification", "OSHA 10"], gaps: ["Commercial Vehicle endorsement", "NCCER certification"] },
  { code: "15T", branch: "Army", title: "UH-60 Helicopter Repairer", description: "Aircraft maintenance, hydraulics, electrical systems", civTitles: ["Aviation Mechanic", "A&P Technician", "HVAC Technician", "Electrical Systems Tech"], tradeSims: ["HVAC", "Electrical"], creds: ["FAA A&P License", "EPA 608"], gaps: ["FAA testing fees + hours", "State electrical license"] },
  { code: "25B", branch: "Army", title: "Information Technology Specialist", description: "Networks, servers, cybersecurity, helpdesk", civTitles: ["IT Support Specialist", "Network Administrator", "Cybersecurity Analyst", "Systems Administrator"], tradeSims: [], creds: ["CompTIA A+", "Network+", "Security+"], gaps: ["CompTIA exam fees", "Cloud cert (AWS/Azure)"] },
  { code: "25U", branch: "Army", title: "Signal Support Systems Specialist", description: "Telecommunications, satellite, radio systems", civTitles: ["Telecom Technician", "Network Engineer", "Radio Frequency Technician"], tradeSims: [], creds: ["CompTIA Network+", "FCC License"], gaps: ["FCC exam", "Fiber splicing cert"] },
  { code: "31B", branch: "Army", title: "Military Police", description: "Law enforcement, investigations, force protection", civTitles: ["Police Officer", "Security Manager", "Investigator", "Probation Officer"], tradeSims: [], creds: ["State POST certification", "CPR/AED"], gaps: ["Academy training (state-specific)", "Background clearance process"] },
  { code: "35F", branch: "Army", title: "Intelligence Analyst", description: "Data analysis, threat assessment, reporting", civTitles: ["Data Analyst", "Intelligence Analyst", "Research Specialist", "Fraud Analyst"], tradeSims: [], creds: ["CompTIA Security+", "Data analytics certs"], gaps: ["Civilian clearance processing", "SQL/Python skills"] },
  { code: "42A", branch: "Army", title: "Human Resources Specialist", description: "Personnel records, benefits, payroll, staffing", civTitles: ["HR Generalist", "Benefits Administrator", "Talent Acquisition Specialist"], tradeSims: [], creds: ["SHRM-CP", "PHR"], gaps: ["SHRM exam fee", "Private sector HR experience"] },
  { code: "56M", branch: "Army", title: "Chaplain Assistant", description: "Counseling support, crisis intervention, pastoral care", civTitles: ["Social Worker", "Counselor", "Case Manager", "Chaplain"], tradeSims: [], creds: ["CACREP counseling license pathway", "CCTP trauma cert"], gaps: ["MSW or MDIV degree", "Supervised clinical hours"] },
  { code: "68W", branch: "Army", title: "Combat Medic Specialist", description: "Emergency trauma care, triage, patient transport", civTitles: ["EMT", "Paramedic", "Surgical Tech", "LVN/RN pathway", "Physician Assistant"], tradeSims: [], creds: ["NREMT", "EMT-B certification"], gaps: ["State EMS license", "Clinical practicum hours"] },
  { code: "88M", branch: "Army", title: "Motor Transport Operator", description: "CDL vehicles, convoys, logistics", civTitles: ["CDL Truck Driver", "Logistics Coordinator", "Fleet Manager", "Dispatcher"], tradeSims: [], creds: ["CDL Class A", "HAZMAT endorsement"], gaps: ["CDL exam fee", "Clean MVR record"] },
  { code: "91B", branch: "Army", title: "Wheeled Vehicle Mechanic", description: "Diesel engines, hydraulics, vehicle systems diagnostics", civTitles: ["Automotive Technician", "Diesel Mechanic", "Fleet Maintenance Tech"], tradeSims: ["Automotive"], creds: ["ASE Certification (A1–A8)", "CDL A (optional)"], gaps: ["ASE exam fees", "Civilian tool set"] },
  { code: "91D", branch: "Army", title: "Power Generation Equipment Repairer", description: "Generators, electrical systems, power distribution", civTitles: ["Electrician", "Power Plant Operator", "HVAC Technician"], tradeSims: ["Electrical", "HVAC"], creds: ["Journeyman Electrician License", "EPA 608"], gaps: ["State apprenticeship hours", "Electrical license exam"] },
  { code: "91E", branch: "Army", title: "Allied Trade Specialist", description: "Welding, machining, metalworking, fabrication", civTitles: ["Welder", "Machinist", "Metal Fabricator", "Structural Steel Worker"], tradeSims: ["Welding"], creds: ["AWS D1.1", "NCCER Welding", "CWI pathway"], gaps: ["AWS exam fees", "Welding portfolio"] },
  { code: "92G", branch: "Army", title: "Culinary Specialist", description: "Food service operations, nutrition, large-scale cooking", civTitles: ["Executive Chef", "Food Service Manager", "Catering Manager"], tradeSims: [], creds: ["ServSafe Manager", "ACF certification"], gaps: ["Culinary program completion", "Food handler license"] },
  { code: "92Y", branch: "Army", title: "Unit Supply Specialist", description: "Inventory management, procurement, warehouse operations", civTitles: ["Logistics Manager", "Supply Chain Coordinator", "Warehouse Supervisor"], tradeSims: [], creds: ["APICS CSCP", "Forklift certification"], gaps: ["ERP software training (SAP/Oracle)", "APICS exam fee"] },
  { code: "18B", branch: "Army", title: "Special Forces Weapons Sergeant", description: "Advanced weapons, training, unconventional warfare", civTitles: ["Weapons Instructor", "Training Director", "Security Consultant"], tradeSims: [], creds: ["NRA Instructor", "TCCC certification"], gaps: ["Civilian training certifications", "Business formation for consulting"] },
  // ── NAVY ──────────────────────────────────────────────────────────────────
  { code: "BM", branch: "Navy", title: "Boatswain's Mate", description: "Seamanship, deck operations, rigging, safety", civTitles: ["Harbor Master", "Marine Safety Inspector", "Dockmaster", "Rigger"], tradeSims: [], creds: ["TWIC Card", "USCG Merchant Mariner Credential"], gaps: ["Sea service documentation", "Drug screen for USCG"] },
  { code: "CE", branch: "Navy", title: "Construction Electrician", description: "Electrical systems installation, power distribution, construction", civTitles: ["Journeyman Electrician", "Construction Manager", "Electrical Contractor"], tradeSims: ["Electrical", "Construction"], creds: ["Journeyman Electrician License", "NCCER Electrical", "OSHA 30"], gaps: ["State license exam", "Civilian apprenticeship hours waiver"] },
  { code: "CM", branch: "Navy", title: "Construction Mechanic", description: "Heavy equipment operation, mechanical systems, construction", civTitles: ["Heavy Equipment Operator", "Construction Equipment Tech", "Fleet Mechanic"], tradeSims: ["Automotive"], creds: ["NCCCO", "NCCER Heavy Equipment", "CDL A"], gaps: ["CDL exam", "Civilian hours documentation"] },
  { code: "DC", branch: "Navy", title: "Damage Controlman", description: "Fire suppression, flooding control, HVAC, life safety systems", civTitles: ["HVAC Technician", "Fire Safety Inspector", "Industrial Mechanic"], tradeSims: ["HVAC", "Plumbing"], creds: ["EPA 608", "HVAC Excellence", "OSHA 30"], gaps: ["EPA 608 exam fee", "State contractor license"] },
  { code: "EN", branch: "Navy", title: "Engineman", description: "Marine diesel engines, propulsion systems, mechanical", civTitles: ["Marine Diesel Mechanic", "Industrial Engine Tech", "Fleet Mechanic"], tradeSims: ["Automotive"], creds: ["ASE Diesel (T2–T8)", "USCG Engineer license"], gaps: ["Civilian engine specs training", "ASE exam fees"] },
  { code: "ET", branch: "Navy", title: "Electronics Technician", description: "Radar, communications, electronic systems repair", civTitles: ["Electronics Tech", "Telecom Technician", "Avionics Tech"], tradeSims: ["Electrical"], creds: ["CompTIA A+", "FCC License", "CET certification"], gaps: ["FCC exam", "Civilian electronic systems exposure"] },
  { code: "HM", branch: "Navy", title: "Hospital Corpsman", description: "Emergency medicine, patient care, pharmacy support", civTitles: ["EMT/Paramedic", "Medical Assistant", "LVN", "PA pathway"], tradeSims: [], creds: ["NREMT", "CNA", "Phlebotomy cert"], gaps: ["NCLEX for nursing pathway", "Clinical hours for PA"] },
  { code: "IT", branch: "Navy", title: "Information Systems Technician", description: "Networks, cybersecurity, satellite communications", civTitles: ["Network Administrator", "Cybersecurity Analyst", "IT Manager"], tradeSims: [], creds: ["CompTIA Security+", "CISSP pathway", "CEH"], gaps: ["Civilian cloud certifications", "Security clearance transfer"] },
  { code: "MM", branch: "Navy", title: "Machinist's Mate", description: "Steam and mechanical systems, HVAC, pipefitting, valves", civTitles: ["HVAC Technician", "Pipefitter", "Stationary Engineer"], tradeSims: ["HVAC", "Plumbing"], creds: ["EPA 608", "HVAC Excellence", "UA Pipefitters cert"], gaps: ["EPA 608 exam", "Journeyman pipefitter apprenticeship credit"] },
  { code: "SW", branch: "Navy", title: "Steelworker", description: "Structural steel fabrication, welding, rigging", civTitles: ["Structural Steel Worker", "Welder", "Ironworker"], tradeSims: ["Welding"], creds: ["AWS D1.1", "NCCER Ironwork", "OSHA 30"], gaps: ["AWS certification exam", "Ironworkers union pathway"] },
  { code: "UT", branch: "Navy", title: "Utilities Technician", description: "Plumbing, electrical, HVAC, water treatment", civTitles: ["Plumber", "Electrician", "HVAC Technician", "Utilities Supervisor"], tradeSims: ["Plumbing", "Electrical", "HVAC"], creds: ["Journeyman Plumber", "EPA 608", "Journeyman Electrician"], gaps: ["Multiple state license exams", "Pick primary trade to prioritize"] },
  // ── MARINE CORPS ──────────────────────────────────────────────────────────
  { code: "0311", branch: "Marine Corps", title: "Rifleman", description: "Infantry tactics, weapons, small-unit leadership", civTitles: ["Police Officer", "Security Manager", "Emergency Services", "Corrections"], tradeSims: [], creds: ["State POST", "EMT-B", "OSHA 10"], gaps: ["Police academy (state)", "Degree requirements for federal LE"] },
  { code: "0811", branch: "Marine Corps", title: "Field Artillery Cannoneer", description: "Heavy weapons, precision targeting, teamwork under pressure", civTitles: ["Heavy Equipment Operator", "Industrial Machine Operator"], tradeSims: [], creds: ["NCCCO", "OSHA 30"], gaps: ["Crane/equipment operator license", "Civilian safety record"] },
  { code: "1141", branch: "Marine Corps", title: "Electrician", description: "Electrical installation, wiring, power systems", civTitles: ["Electrician", "Electrical Contractor", "Maintenance Tech"], tradeSims: ["Electrical"], creds: ["Journeyman Electrician License", "NCCER Electrical"], gaps: ["State license exam", "Apprenticeship hours documentation"] },
  { code: "1161", branch: "Marine Corps", title: "Plumber", description: "Plumbing systems, pipefitting, water treatment", civTitles: ["Plumber", "Pipefitter", "Plumbing Contractor"], tradeSims: ["Plumbing"], creds: ["Journeyman Plumber License", "OSHA 10"], gaps: ["State plumber license exam", "Apprenticeship hour waivers"] },
  { code: "3521", branch: "Marine Corps", title: "Automotive Organizational Mechanic", description: "Vehicle maintenance, diagnostics, engine repair", civTitles: ["Automotive Technician", "Fleet Mechanic", "Diesel Tech"], tradeSims: ["Automotive"], creds: ["ASE Certifications", "CDL A"], gaps: ["ASE exam fees", "Civilian diagnostic software training"] },
  { code: "3531", branch: "Marine Corps", title: "Motor Vehicle Operator", description: "CDL vehicles, convoy ops, transport logistics", civTitles: ["CDL Driver", "Logistics Coordinator", "Fleet Dispatcher"], tradeSims: [], creds: ["CDL Class A", "HAZMAT endorsement"], gaps: ["CDL exam fee", "Clean MVR"] },
  { code: "6043", branch: "Marine Corps", title: "Aircraft Structural Mechanic", description: "Aircraft skin, structural repair, welding, composite materials", civTitles: ["Aircraft Structural Mechanic", "Welder", "Composite Tech"], tradeSims: ["Welding"], creds: ["FAA A&P", "AWS D1.1"], gaps: ["FAA testing", "Civilian aircraft hours"] },
  // ── AIR FORCE ─────────────────────────────────────────────────────────────
  { code: "2A3X1", branch: "Air Force", title: "F-15 Crew Chief", description: "Aircraft maintenance, hydraulics, engines, avionics", civTitles: ["Aviation Mechanic", "A&P Technician", "Aerospace Tech"], tradeSims: ["Automotive", "Electrical"], creds: ["FAA A&P License", "CompTIA A+"], gaps: ["FAA testing fees + hours", "Civilian aircraft type ratings"] },
  { code: "2A6X4", branch: "Air Force", title: "Aircraft Fuel Systems", description: "Aviation fuel systems, safety, hazmat", civTitles: ["Aviation Fuel Tech", "HAZMAT Specialist", "Pipeline Inspector"], tradeSims: [], creds: ["HAZWOPER", "TWIC", "API 653"], gaps: ["HAZWOPER training", "Pipeline inspection cert"] },
  { code: "3D0X2", branch: "Air Force", title: "Cyber Systems Operations", description: "Offensive/defensive cyber, network security, threat analysis", civTitles: ["Cybersecurity Analyst", "Penetration Tester", "SOC Analyst"], tradeSims: [], creds: ["CompTIA Security+", "CEH", "CISSP"], gaps: ["Civilian clearance transfer", "Bug bounty portfolio"] },
  { code: "3D1X2", branch: "Air Force", title: "Cyber Transport Systems", description: "Network infrastructure, fiber, telecommunications", civTitles: ["Network Engineer", "Telecom Technician", "Systems Administrator"], tradeSims: [], creds: ["CompTIA Network+", "CCNA", "Fiber certification"], gaps: ["Cisco exam fees", "Fiber splicing hands-on cert"] },
  { code: "4N0X1", branch: "Air Force", title: "Aerospace Medical Service", description: "Emergency medicine, patient care, flight medicine", civTitles: ["EMT", "Medical Assistant", "Flight Medic"], tradeSims: [], creds: ["NREMT", "CNA", "EMT-B"], gaps: ["Civilian clinical hours", "NCLEX for nursing"] },
  { code: "3P0X1", branch: "Air Force", title: "Security Forces", description: "Law enforcement, force protection, investigations", civTitles: ["Police Officer", "Federal Agent", "Security Director"], tradeSims: [], creds: ["State POST", "CPR/AED"], gaps: ["Academy", "Federal application process"] },
  { code: "6C0X1", branch: "Air Force", title: "Contracting", description: "Federal procurement, contract management, acquisitions", civTitles: ["Contract Specialist", "Procurement Officer", "Acquisition Manager"], tradeSims: [], creds: ["DAWIA Level II", "CPCM", "FAR training"], gaps: ["Private sector contract exposure", "NCMA membership"] },
  { code: "6F0X1", branch: "Air Force", title: "Financial Management", description: "Military payroll, budgeting, financial analysis", civTitles: ["Financial Analyst", "Accountant", "Budget Analyst"], tradeSims: [], creds: ["CPA pathway", "CGFM", "CFA"], gaps: ["CPA exam (150 credit hours)", "Civilian GAAP vs. GAGAS differences"] },
  // ── COAST GUARD ───────────────────────────────────────────────────────────
  { code: "MK", branch: "Coast Guard", title: "Machinery Technician", description: "Marine diesel engines, hydraulics, HVAC, electrical", civTitles: ["Marine Diesel Mechanic", "HVAC Technician", "Industrial Mechanic"], tradeSims: ["HVAC", "Automotive"], creds: ["EPA 608", "USCG MMC", "ASE Diesel"], gaps: ["EPA 608 exam", "Civilian yard experience"] },
  { code: "ME", branch: "Coast Guard", title: "Maritime Enforcement Specialist", description: "Law enforcement, port security, investigations", civTitles: ["CBP Officer", "Port Security Officer", "Federal LE Agent"], tradeSims: [], creds: ["TWIC", "State POST (if lateral)"], gaps: ["Federal hiring process", "Background investigation timeline"] },
  { code: "DC-CG", branch: "Coast Guard", title: "Damage Controlman", description: "Firefighting, flooding, HazMat, mechanical systems", civTitles: ["Firefighter", "HVAC Tech", "Industrial Safety Specialist"], tradeSims: ["HVAC", "Plumbing"], creds: ["FFPM", "EPA 608", "OSHA 30"], gaps: ["Fire academy (state)", "EPA 608 exam"] },
];

const SIM_COLORS: Record<string, string> = {
  Electrical: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Plumbing: "bg-blue-100 text-blue-800 border-blue-200",
  HVAC: "bg-orange-100 text-orange-800 border-orange-200",
  Welding: "bg-red-100 text-red-800 border-red-200",
  Automotive: "bg-gray-100 text-gray-800 border-gray-200",
  "Ag-Tech": "bg-green-100 text-green-800 border-green-200",
};

const SIM_SLUGS: Record<string, string> = {
  Electrical: "electrical", Plumbing: "plumbing", HVAC: "hvac",
  Welding: "welding", Automotive: "automotive",
};

const BRANCHES: Branch[] = ["Army", "Navy", "Marine Corps", "Air Force", "Coast Guard"];

export default function MOSTranslatorPage() {
  const [selectedBranch, setSelectedBranch] = useState<Branch | "">("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MOSEntry | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOS_DATA.filter(m => {
      const branchMatch = !selectedBranch || m.branch === selectedBranch;
      const textMatch = !q || m.code.toLowerCase().includes(q) || m.title.toLowerCase().includes(q);
      return branchMatch && textMatch;
    });
  }, [selectedBranch, query]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">

        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-100 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-sm font-medium mb-2">
            <Shield className="h-4 w-4" />
            Veteran Credential Bridge
          </div>
          <h1 className="text-4xl font-bold tracking-tight">MOS Skills Translator</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Enter your MOS, rate, or AFSC to see your civilian credential equivalents, which TCAF Trade Sims apply, and exactly what gap you need to close.</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedBranch} onValueChange={(v) => { setSelectedBranch(v as Branch); setSelected(null); }}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-branch">
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All branches</SelectItem>
                  {BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search MOS code or job title (e.g. 68W, 91B, Combat Medic...)"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSelected(null); }}
                  data-testid="input-mos-search"
                />
              </div>
            </div>

            {!selected && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                {filtered.map(m => (
                  <button
                    key={`${m.branch}-${m.code}`}
                    onClick={() => setSelected(m)}
                    className="flex items-start gap-3 p-3 rounded-lg border text-left hover:bg-muted/50 transition-colors"
                    data-testid={`button-mos-${m.code}`}
                  >
                    <div className="mt-0.5">
                      <Badge variant="outline" className="text-xs font-mono">{m.code}</Badge>
                    </div>
                    <div>
                      <div className="text-sm font-medium">{m.title}</div>
                      <div className="text-xs text-muted-foreground">{m.branch}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto mt-0.5 shrink-0" />
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-muted-foreground text-sm">No MOS/rate found — try a code like "91B" or title like "Medic"</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {selected && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="font-mono text-sm" variant="outline">{selected.code}</Badge>
                  <Badge variant="secondary">{selected.branch}</Badge>
                </div>
                <h2 className="text-2xl font-bold">{selected.title}</h2>
                <p className="text-muted-foreground text-sm mt-1">{selected.description}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-xs text-muted-foreground hover:text-foreground underline">← Back</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><ArrowRight className="h-4 w-4 text-teal-600" /> Civilian Equivalents</CardTitle>
                  <CardDescription>Jobs your military experience directly translates to</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selected.civTitles.map(t => (
                    <div key={t} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      {t}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Wrench className="h-4 w-4 text-blue-600" /> TCAF Trade Sims</CardTitle>
                  <CardDescription>Your background aligns with these hands-on simulators</CardDescription>
                </CardHeader>
                <CardContent>
                  {selected.tradeSims.length > 0 ? (
                    <div className="space-y-3">
                      {selected.tradeSims.map(sim => (
                        <div key={sim} className="flex items-center justify-between">
                          <Badge variant="outline" className={`${SIM_COLORS[sim]} border`}>{sim}</Badge>
                          {SIM_SLUGS[sim] && (
                            <Link href={`/academy/trade-sims/${SIM_SLUGS[sim]}`}>
                              <Button size="sm" variant="outline" className="text-xs h-7" data-testid={`button-sim-${sim}`}>
                                Start Sim <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>Your MOS maps primarily to non-trade civilian paths.</p>
                      <Link href="/academy/trade-sims">
                        <Button size="sm" variant="outline" className="text-xs">Explore all Trade Sims</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4 text-violet-600" /> Credentials You Likely Qualify For</CardTitle>
                  <CardDescription>Based on your MOS training and documented experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selected.creds.map(c => (
                    <div key={c} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-violet-500 shrink-0" />
                      {c}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-amber-200 dark:border-amber-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" /> Gap Analysis
                  </CardTitle>
                  <CardDescription>What you still need to close to reach civilian employment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selected.gaps.map(g => (
                    <div key={g} className="flex items-start gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      {g}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 border-teal-200 dark:border-teal-800">
              <CardContent className="pt-5 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">Ready to start closing your gap?</p>
                  <p className="text-sm text-muted-foreground mt-0.5">The Navigator can build a step-by-step career plan from your MOS — including WIOA funding, Workforce Pell eligibility, and employer connections.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href="/workforce-pell">
                    <Button variant="outline" size="sm" data-testid="button-pell-check">Check Pell</Button>
                  </Link>
                  <Link href="/navigator">
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white" data-testid="button-navigator-cta">Ask Navigator</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
