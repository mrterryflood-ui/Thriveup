import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Landmark, ExternalLink, Phone, Search, Info, Sparkles } from "lucide-react";
import { CrisisStrip } from "@/components/foster-youth/crisis-strip";
import { STATE_ILP } from "@/data/foster-youth/state-ilp";

interface Benefit {
  id: string;
  category: "housing" | "healthcare" | "education" | "income" | "id";
  title: string;
  applyUrl: string;
  applyPhone?: string;
  blurb: string;
}

// Federal benefits — apply to all states. Cited to statute / regulation.
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

const CATEGORY_LABEL: Record<Benefit["category"], string> = {
  housing: "Housing",
  healthcare: "Healthcare",
  education: "Education",
  income: "Income & Food",
  id: "Identity Documents",
};

function buildStateBenefits(stateCode: string): { benefits: Benefit[]; agencyBenefit: Benefit; hasExtras: boolean } {
  const state = STATE_ILP.find((s) => s.code === stateCode);
  if (!state) {
    return { benefits: [], agencyBenefit: {
      id: "fallback-211", category: "income", title: "Call 211", applyUrl: "https://www.211.org/", applyPhone: "2-1-1", blurb: "Local benefits navigation in any state.",
    }, hasExtras: false };
  }
  const agencyBenefit: Benefit = {
    id: `${stateCode.toLowerCase()}-agency`,
    category: "income",
    title: state.agencyName,
    applyUrl: state.agencyUrl,
    applyPhone: state.ilpPhone,
    blurb: state.ilpCoordinator
      ? `State child-welfare agency for ${state.name}. Independent Living coordinator: ${state.ilpCoordinator}.`
      : `Official ${state.name} child-welfare agency landing page. Named ILP coordinator and direct phone not yet verified — call 211 for warm handoff or use the agency's contact form.`,
  };
  const extras: Benefit[] = (state.stateExtras ?? []).map((e) => ({
    id: e.id, category: e.category, title: e.title, applyUrl: e.url, applyPhone: e.phone, blurb: e.blurb,
  }));
  return { benefits: extras, agencyBenefit, hasExtras: extras.length > 0 };
}

export default function FosterYouthBenefitsPage() {
  const [stateCode, setStateCode] = useState<string>("TX");
  const [filter, setFilter] = useState<string>("");

  const stateName = STATE_ILP.find((s) => s.code === stateCode)?.name ?? "";
  const { benefits: stateExtras, agencyBenefit, hasExtras } = useMemo(() => buildStateBenefits(stateCode), [stateCode]);
  const allBenefits = useMemo(() => [...FEDERAL_BENEFITS, agencyBenefit, ...stateExtras], [agencyBenefit, stateExtras]);

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
          <AlertTitle>50 states + DC — federal floor everywhere, state extras where statute exists</AlertTitle>
          <AlertDescription>
            Federal benefits are identical in every state and shown for all of them. Each state's Independent Living Program agency is linked to its official landing page. Where the named ILP coordinator's direct phone isn't yet verified, that field is left blank rather than fabricated — call 211 for a warm handoff. State-specific tuition waivers, transitional living allowances, and extended-care programs are added as we verify them.
          </AlertDescription>
        </Alert>

        <Alert className="mb-6 border-violet-200 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-900" data-testid="alert-intake-cta">
          <Sparkles className="h-4 w-4 text-violet-600" />
          <AlertTitle>Want a personalized plan instead?</AlertTitle>
          <AlertDescription>
            The AI-assisted intake takes 4 short steps and gives you a 30/60/90-day plan tailored to your state, age, and current situation.
            <Link href="/foster-youth/intake"><Button size="sm" className="ml-2" data-testid="button-go-intake">Start the intake</Button></Link>
          </AlertDescription>
        </Alert>

        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          <div data-testid="control-state-select">
            <label className="text-sm font-medium block mb-1">Your state</label>
            <Select value={stateCode} onValueChange={setStateCode}>
              <SelectTrigger data-testid="select-state-trigger"><SelectValue /></SelectTrigger>
              <SelectContent data-testid="select-state-content">
                {STATE_ILP.map((s) => (
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

        {!hasExtras && (
          <Alert className="mb-6" data-testid="alert-state-rolling">
            <Info className="h-4 w-4" />
            <AlertTitle>{stateName}: federal benefits + agency landing shown</AlertTitle>
            <AlertDescription>
              State-specific tuition waivers, transitional living allowances, and ID-fee waivers for {stateName} are being verified statute-by-statute. The federal floor (Medicaid to 26, ETV up to $5,000/yr, FYI vouchers, FAFSA Independent + Pell) applies in {stateName} just like everywhere else. Call 211 for local navigation.
            </AlertDescription>
          </Alert>
        )}

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
