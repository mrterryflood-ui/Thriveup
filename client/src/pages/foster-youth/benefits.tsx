import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Landmark, ExternalLink, Phone, Search, Info } from "lucide-react";
import { CrisisStrip } from "@/components/foster-youth/crisis-strip";

const STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" }, { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" }, { code: "CO", name: "Colorado" }, { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" }, { code: "FL", name: "Florida" }, { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" }, { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" }, { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" }, { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" }, { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" }, { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" }, { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" }, { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" }, { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" }, { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" }, { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
];

interface Benefit {
  id: string;
  category: "housing" | "healthcare" | "education" | "income" | "id";
  title: string;
  applyUrl: string;
  applyPhone?: string;
  blurb: string;
}

// Federal benefits (apply to all states)
const FEDERAL_BENEFITS: Benefit[] = [
  { id: "fed-medicaid", category: "healthcare", title: "Medicaid (FFCC) until age 26 — no income test", applyUrl: "https://www.healthcare.gov/medicaid-chip/getting-medicaid-chip/", applyPhone: "1-800-318-2596", blurb: "ACA §2004 entitles every former foster youth to free Medicaid until 26th birthday." },
  { id: "fed-snap", category: "income", title: "SNAP (food assistance)", applyUrl: "https://www.fns.usda.gov/snap/state-directory", blurb: "Apply through your state portal. Most former foster youth qualify based on income." },
  { id: "fed-fafsa", category: "education", title: "FAFSA — Independent Student + Pell Grant", applyUrl: "https://studentaid.gov/h/apply-for-aid/fafsa", applyPhone: "1-800-433-3243", blurb: "Foster youth automatically qualify as independent students. Pell Grant up to $7,395/year." },
  { id: "fed-etv", category: "education", title: "Education and Training Voucher (up to $5,000/year, age up to 26)", applyUrl: "https://www.fc2success.org/programs/education-training-voucher-program/", blurb: "Federal voucher administered through your state ETV coordinator or Foster Care to Success." },
  { id: "fed-fyi", category: "housing", title: "HUD Foster Youth to Independence (FYI) voucher", applyUrl: "https://www.hud.gov/program_offices/public_indian_housing/programs/hcv/family_unification", blurb: "Up to 36 months rental assistance ages 18–24. Requires PCWA referral, then PHA application." },
  { id: "fed-rhya", category: "housing", title: "RHYA Transitional Living Programs", applyUrl: "https://www.acf.hhs.gov/fysb/programs/runaway-homeless-youth", applyPhone: "1-800-RUNAWAY (786-2929)", blurb: "Up to 21 months of supportive housing for ages 16–22. Run by local nonprofits." },
  { id: "fed-ssn", category: "id", title: "Social Security Card replacement", applyUrl: "https://www.ssa.gov/myaccount/", applyPhone: "1-800-772-1213", blurb: "Free. Online or in person at any SSA office." },
  { id: "fed-passport", category: "id", title: "U.S. Passport", applyUrl: "https://travel.state.gov/content/travel/en/passports.html", blurb: "$130 + $35 execution. Strongest proof of identity." },
];

// State Independent Living Coordinator URLs (Chafee/PAL/ILP — official state child welfare agency landing or ILP page where known)
const STATE_BENEFITS: Record<string, Benefit[]> = {
  TX: [
    { id: "tx-pal", category: "income", title: "Texas PAL (Preparation for Adult Living) — transitional living allowance + life skills", applyUrl: "https://www.dfps.texas.gov/Child_Protection/Youth/Preparation_for_Adult_Living.asp", applyPhone: "1-800-720-7777", blurb: "Texas's Chafee program. Up to ~$1,000/mo transitional living allowance for qualifying youth." },
    { id: "tx-extended", category: "housing", title: "Texas Extended Foster Care to age 21", applyUrl: "https://www.dfps.texas.gov/Child_Protection/Youth/Extended_Foster_Care.asp", blurb: "Voluntary extension. Sign before your 18th birthday or re-enter between 18 and 21." },
    { id: "tx-tuition", category: "education", title: "Texas Tuition and Fee Waiver — public colleges (Texas Education Code §54.366)", applyUrl: "https://www.collegeforalltexans.com/index.cfm?ObjectID=A3119543-FA2E-7B91-1D86027F47AA8AC8", blurb: "Tuition + mandatory fees waived at any Texas public college. Up to age 25 if continuously enrolled." },
    { id: "tx-id", category: "id", title: "Texas DPS ID/License Fee Waiver (Texas Transp. Code §521.1811)", applyUrl: "https://www.dps.texas.gov/section/driver-license", blurb: "Free state ID or driver's license under 21 if in foster care at age 16+." },
    { id: "tx-medicaid", category: "healthcare", title: "Texas Medicaid (FFCC) — apply via Your Texas Benefits", applyUrl: "https://www.yourtexasbenefits.com/", applyPhone: "2-1-1", blurb: "Choose 'Former Foster Care Children' category." },
    { id: "tx-snap", category: "income", title: "Texas SNAP — apply via Your Texas Benefits", applyUrl: "https://www.yourtexasbenefits.com/", applyPhone: "2-1-1", blurb: "Apply for SNAP, TANF, CHIP, and Medicaid in one application." },
  ],
};

// For all other states, we provide the federal benefits + a generic state-ILP-coordinator pointer.
function buildGenericState(stateCode: string, stateName: string): Benefit[] {
  return [
    {
      id: `${stateCode.toLowerCase()}-ilp`,
      category: "income",
      title: `${stateName} Chafee / Independent Living Program`,
      applyUrl: `https://www.google.com/search?q=${encodeURIComponent(stateName + " Chafee independent living program foster youth")}`,
      blurb: `Every state must offer Chafee independent-living services through age 23. Search for "${stateName} ILP coordinator" or call 211 from within ${stateName}.`,
    },
    {
      id: `${stateCode.toLowerCase()}-medicaid`,
      category: "healthcare",
      title: `${stateName} Medicaid (FFCC) — apply through state portal`,
      applyUrl: "https://www.healthcare.gov/medicaid-chip/getting-medicaid-chip/",
      blurb: `ACA §2004 entitles you to Medicaid until age 26. Apply through ${stateName}'s state Medicaid portal.`,
    },
    {
      id: `${stateCode.toLowerCase()}-211`,
      category: "income",
      title: `211 — ${stateName}`,
      applyUrl: "https://www.211.org/",
      applyPhone: "2-1-1",
      blurb: "Local benefits navigation, food pantries, emergency shelter, utility assistance.",
    },
  ];
}

const CATEGORY_LABEL: Record<Benefit["category"], string> = {
  housing: "Housing",
  healthcare: "Healthcare",
  education: "Education",
  income: "Income & Food",
  id: "Identity Documents",
};

export default function FosterYouthBenefitsPage() {
  const [stateCode, setStateCode] = useState<string>("TX");
  const [filter, setFilter] = useState<string>("");

  const stateName = STATES.find((s) => s.code === stateCode)?.name ?? "";

  const stateBenefits = useMemo(() => {
    return STATE_BENEFITS[stateCode] ?? buildGenericState(stateCode, stateName);
  }, [stateCode, stateName]);

  const allBenefits = useMemo(() => [...FEDERAL_BENEFITS, ...stateBenefits], [stateBenefits]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return allBenefits;
    const q = filter.toLowerCase();
    return allBenefits.filter((b) => b.title.toLowerCase().includes(q) || b.blurb.toLowerCase().includes(q));
  }, [allBenefits, filter]);

  const byCategory = useMemo(() => {
    const grouped: Record<string, Benefit[]> = {};
    for (const b of filtered) {
      if (!grouped[b.category]) grouped[b.category] = [];
      grouped[b.category].push(b);
    }
    return grouped;
  }, [filtered]);

  const isCustomState = !!STATE_BENEFITS[stateCode];

  return (
    <div className="min-h-screen bg-background" data-testid="page-foster-youth-benefits">
      <CrisisStrip />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Link href="/foster-youth">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-hub">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Foster Youth Hub
          </Button>
        </Link>

        <div className="flex items-start gap-4 mb-6 flex-wrap">
          <div className="rounded-xl p-3 bg-gradient-to-br from-emerald-500 to-green-600 shrink-0 shadow-md">
            <Landmark className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-[280px]">
            <Badge variant="secondary" className="mb-2" data-testid="badge-tool">Tool 5 of 6</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight" data-testid="text-benefits-title">State Benefits Navigator</h1>
            <p className="text-muted-foreground italic" data-testid="text-benefits-title-es">Navegador de Beneficios Estatales</p>
          </div>
        </div>

        <Alert className="mb-6" data-testid="alert-50-states">
          <Info className="h-4 w-4" />
          <AlertTitle>50 states + DC, Texas first</AlertTitle>
          <AlertDescription>
            Federal benefits are the same everywhere. State Chafee/ILP programs, tuition waivers, and Medicaid portals vary. Texas is fully detailed today; other states show federal benefits + a state-specific Chafee/ILP search pointer. Real warm-handoff numbers being added on a rolling basis.
          </AlertDescription>
        </Alert>

        {/* Selectors */}
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          <div data-testid="control-state-select">
            <label className="text-sm font-medium block mb-1">Your state</label>
            <Select value={stateCode} onValueChange={setStateCode}>
              <SelectTrigger data-testid="select-state-trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent data-testid="select-state-content">
                {STATES.map((s) => (
                  <SelectItem key={s.code} value={s.code} data-testid={`option-state-${s.code}`}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div data-testid="control-filter">
            <label className="text-sm font-medium block mb-1">Filter</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="housing, medicaid, id..." className="pl-8" data-testid="input-filter" />
            </div>
          </div>
        </div>

        {!isCustomState && (
          <Alert className="mb-6" data-testid="alert-state-rolling">
            <Info className="h-4 w-4" />
            <AlertTitle>{stateName}: federal benefits shown + Chafee/ILP search pointer</AlertTitle>
            <AlertDescription>
              State-specific tuition waivers, ID-fee waivers, and extended-care policies are being added state by state. For now: call 211 from within {stateName} for local benefits navigation, and search "{stateName} Chafee independent living program."
            </AlertDescription>
          </Alert>
        )}

        {/* Benefits by category */}
        {(Object.keys(CATEGORY_LABEL) as Benefit["category"][]).map((cat) => {
          const items = byCategory[cat];
          if (!items || items.length === 0) return null;
          return (
            <section key={cat} className="mb-8" data-testid={`section-cat-${cat}`}>
              <h2 className="text-xl font-bold mb-3" data-testid={`heading-cat-${cat}`}>{CATEGORY_LABEL[cat]}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map((b) => (
                  <Card key={b.id} data-testid={`card-benefit-${b.id}`}>
                    <CardHeader>
                      <CardTitle className="text-base" data-testid={`text-benefit-title-${b.id}`}>{b.title}</CardTitle>
                      <CardDescription data-testid={`text-benefit-blurb-${b.id}`}>{b.blurb}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      <a href={b.applyUrl} target="_blank" rel="noreferrer">
                        <Button size="sm" data-testid={`button-apply-${b.id}`}>
                          <ExternalLink className="mr-1 h-3 w-3" /> Apply
                        </Button>
                      </a>
                      {b.applyPhone && (
                        <a href={`tel:${b.applyPhone.replace(/[^0-9]/g, "")}`}>
                          <Button size="sm" variant="outline" data-testid={`button-call-${b.id}`}>
                            <Phone className="mr-1 h-3 w-3" /> {b.applyPhone}
                          </Button>
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
