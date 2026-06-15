import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, DollarSign, ChevronLeft, ChevronDown, ChevronUp, ExternalLink, CheckCircle2, Globe } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useEffect } from "react";
import { Link } from "wouter";

function QuickExit() {
  return (
    <button onClick={() => window.location.replace("https://www.weather.com")}
      className="fixed top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-lg flex items-center gap-1.5"
      data-testid="button-quick-exit">
      <AlertTriangle className="h-3.5 w-3.5" />Quick Exit
    </button>
  );
}

interface Benefit {
  id: string; title: string; category: string;
  whatItIs: string; howMuch: string;
  whatYouNeed: string[]; whatToSay: string;
  applyUrl: string; applyLabel: string; phone?: string;
  tags: string[];
}

const BENEFITS: Benefit[] = [
  {
    id: "cvcp", title: "Texas Crime Victims' Compensation", category: "Financial",
    whatItIs: "State program that pays for expenses caused by violent crime — including DV, sexual assault, and stalking. Most survivors don't know this exists.",
    howMuch: "Up to $50,000 — covers medical bills, counseling, lost wages, relocation, and more. Apply within 3 years of the crime.",
    whatYouNeed: ["Police report or crime victim statement", "Bills or receipts for expenses", "Proof of lost wages (if applicable)", "Application form"],
    whatToSay: "You don't have to call it DV. You can say you were the victim of a violent crime and want to apply for crime victims' compensation.",
    applyUrl: "https://www.oag.texas.gov/crime-victims", applyLabel: "Texas OAG — Crime Victims", phone: "1-800-983-9933",
    tags: ["financial", "all survivors"],
  },
  {
    id: "emergency-tanf", title: "Emergency TANF", category: "Financial",
    whatItIs: "A faster version of regular TANF (Temporary Assistance for Needy Families) for families in crisis. DV survivors often qualify immediately.",
    howMuch: "Up to $1,000 one-time emergency payment + potential monthly cash assistance. Much faster than regular TANF.",
    whatYouNeed: ["ID", "Proof of Texas residency", "Proof of income (or zero income)", "Children's birth certificates (if applicable)", "Social Security numbers"],
    whatToSay: "Tell them you are in a domestic violence situation and need emergency TANF. They are required to connect you with a DV liaison.",
    applyUrl: "https://yourtexasbenefits.com", applyLabel: "Your Texas Benefits", phone: "2-1-1",
    tags: ["financial", "families"],
  },
  {
    id: "vawa-housing", title: "VAWA Housing Protections", category: "Housing",
    whatItIs: "Federal law (Violence Against Women Act) protects survivors in HUD-assisted housing. Your landlord cannot evict you because of DV — even if the abuser is on the lease.",
    howMuch: "Lets you stay in your home or get the abuser removed from the lease. No cost.",
    whatYouNeed: ["Written certification to your landlord that you are a DV survivor (form HUD-5382)", "Your name on the lease (or ability to get it added)"],
    whatToSay: "Tell your housing manager or landlord: 'I want to invoke my VAWA protections as a domestic violence survivor.' They are legally required to respond.",
    applyUrl: "https://www.hud.gov/program_offices/housing/mfh/violence_against_women_act", applyLabel: "HUD VAWA Info",
    tags: ["housing", "renters"],
  },
  {
    id: "lease-break", title: "Texas Lease Termination Right", category: "Housing",
    whatItIs: "Texas Property Code §92.0161: survivors of DV, sexual assault, or stalking can terminate a lease early — no penalty, no lease-break fee.",
    howMuch: "No cost. Saves you from owing months of rent after leaving.",
    whatYouNeed: ["Written notice to your landlord (30 days)", "One of: police report, active protective order, or written statement from a DV shelter/counselor/medical provider"],
    whatToSay: "Send a written letter: 'I am terminating my lease under Texas Property Code §92.0161. I have enclosed [documentation]. My move-out date will be [date, 30 days from now].'",
    applyUrl: "https://statutes.capitol.texas.gov/Docs/PR/htm/PR.92.htm#92.0161", applyLabel: "TX Property Code §92.0161",
    tags: ["housing", "renters"],
  },
  {
    id: "acp", title: "Address Confidentiality Program (Safe at Home)", category: "Safety",
    whatItIs: "Texas AG's office provides a substitute mailing address for all government records — so your real address never appears in public records, utility records, or court filings.",
    howMuch: "Free. Protects you from an abuser who could find you through public records.",
    whatYouNeed: ["Apply within 90 days of relocating (recommended)", "Completed application", "Proof you are a DV/SA/stalking survivor (or recently relocated for safety)"],
    whatToSay: "Contact the AG's office directly — you don't need a police report. A written statement from a DV counselor or shelter is sufficient.",
    applyUrl: "https://www.oag.texas.gov/acp", applyLabel: "TX AG Address Confidentiality", phone: "512-936-1700",
    tags: ["safety", "all survivors"],
  },
  {
    id: "id-replacement", title: "Texas ID Replacement — Fee Waiver", category: "Financial",
    whatItIs: "Texas DPS waives the fee for replacing a driver's license or ID for DV survivors. Getting your ID back is often the first step to accessing everything else.",
    howMuch: "Normally $16 — waived for DV survivors with documentation.",
    whatYouNeed: ["Police report OR protective order OR written statement from a DV shelter or advocate", "Trip to a Texas DPS office (no appointment needed for this specific program)"],
    whatToSay: "At DPS: 'I am a domestic violence survivor and I need a replacement ID under the DV fee waiver program.' Present your documentation.",
    applyUrl: "https://www.dps.texas.gov/section/driver-license/driver-license-fees", applyLabel: "TX DPS",
    tags: ["financial", "documents"],
  },
  {
    id: "vawa-immigration", title: "VAWA Self-Petition (Immigration)", category: "Immigration",
    whatItIs: "If you are undocumented or have a visa tied to an abusive spouse or parent, VAWA allows you to apply for immigration status on your own — without the abuser's knowledge or cooperation.",
    howMuch: "Free to file. Grants work authorization and a path to a green card if approved.",
    whatYouNeed: ["Evidence of relationship to abusive U.S. citizen or permanent resident", "Evidence of abuse", "Evidence of good moral character"],
    whatToSay: "This is a confidential federal process. USCIS will not contact your abuser. You need a nonprofit immigration attorney — contact Texas RioGrande Legal Aid.",
    applyUrl: "https://www.trla.org", applyLabel: "TX RioGrande Legal Aid", phone: "512-374-2700",
    tags: ["immigration", "undocumented"],
  },
  {
    id: "childcare", title: "Childcare Emergency Slots — DV Priority", category: "Children",
    whatItIs: "Texas Workforce Commission maintains DV priority access for childcare assistance. Survivors can get immediate subsidized childcare faster than regular applicants.",
    howMuch: "Full or partial childcare subsidy while you stabilize, work, or attend training. Amount depends on income.",
    whatYouNeed: ["Proof of DV (police report, protective order, or shelter documentation)", "Child's birth certificate", "Proof of income", "TWC eligibility determination"],
    whatToSay: "When you call TWC: 'I am a domestic violence survivor and I am requesting priority access to childcare assistance.'",
    applyUrl: "https://www.twc.texas.gov/jobseekers/childcare-financial-assistance", applyLabel: "TX Workforce Commission", phone: "1-877-541-7905",
    tags: ["children", "families"],
  },
  {
    id: "snap", title: "SNAP — Food Benefits", category: "Food",
    whatItIs: "Monthly funds on an EBT card for groceries. DV survivors often qualify even if they previously shared income with an abuser — household can be counted separately.",
    howMuch: "Average $200–$500/month depending on household size and income. Applied for at same place as Medicaid.",
    whatYouNeed: ["ID", "Proof of income (or zero income)", "Proof of Texas address", "Social Security numbers"],
    whatToSay: "You can apply as a separate household from an abuser — even if you still live in the same home. Tell the worker 'I want to apply as a separate household due to domestic violence.'",
    applyUrl: "https://yourtexasbenefits.com", applyLabel: "Your Texas Benefits",
    tags: ["food", "all survivors"],
  },
  {
    id: "medicaid", title: "Medicaid — Health Coverage", category: "Health",
    whatItIs: "Free or low-cost health coverage including doctor visits, prescriptions, mental health, and counseling. Counseling is covered — including trauma therapy.",
    howMuch: "Free for most qualifying adults. Covers therapy, medical care, prescriptions.",
    whatYouNeed: ["ID", "Proof of income", "Social Security number", "Proof of residency"],
    whatToSay: "You do not need to explain why you need health coverage. Just apply. If you need mental health/counseling specifically, ask for a referral to a behavioral health provider.",
    applyUrl: "https://yourtexasbenefits.com", applyLabel: "Your Texas Benefits",
    tags: ["health", "all survivors"],
  },
];

const CATEGORIES = ["All", "Financial", "Housing", "Safety", "Children", "Immigration", "Food", "Health"];

export default function BenefitsBridgePage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    if (!logged) {
      apiRequest("POST", "/api/safe-passage/log", { serviceType: "benefits-bridge" }).catch(() => {});
      setLogged(true);
    }
  }, []);

  const filtered = BENEFITS.filter(b => {
    const matchCat = filter === "All" || b.category === filter;
    const matchSearch = !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.whatItIs.toLowerCase().includes(search.toLowerCase()) || b.tags.some(t => t.includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50/20 dark:from-slate-950 dark:to-amber-950/10">
      <QuickExit />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/safe-passage" className="text-xs text-slate-500 hover:text-teal-600 flex items-center gap-1 mb-6">
          <ChevronLeft className="h-3 w-3" /> Back to Safe Passage
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 dark:text-slate-50">Benefits & Financial Help for Survivors</h1>
            <p className="text-xs text-slate-500">Programs specifically for DV/SA survivors — including ones most people miss</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filter === c ? "bg-amber-500 text-white border-amber-500" : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-amber-400"}`}
              data-testid={`filter-${c.toLowerCase()}`}>{c}</button>
          ))}
        </div>

        <div className="relative mb-5">
          <Input placeholder="Search benefits..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-4 text-sm" data-testid="input-search-benefits" />
        </div>

        <div className="space-y-3">
          {filtered.map(b => (
            <Card key={b.id} className="border-slate-200 dark:border-slate-700">
              <CardContent className="p-0">
                <button className="w-full text-left p-4" onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                  data-testid={`button-expand-${b.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{b.title}</span>
                        <Badge variant="outline" className="text-[10px]">{b.category}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{b.whatItIs}</p>
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mt-1">{b.howMuch}</p>
                    </div>
                    {expanded === b.id ? <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" /> : <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />}
                  </div>
                </button>

                {expanded === b.id && (
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">What you need to apply:</p>
                      <ul className="space-y-1">
                        {b.whatYouNeed.map(item => (
                          <li key={item} className="flex items-start gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5" /> What to say if you can't disclose the DV:
                      </p>
                      <p className="text-xs text-blue-800 dark:text-blue-200">{b.whatToSay}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a href={b.applyUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium transition-colors"
                        data-testid={`link-apply-${b.id}`}>
                        <ExternalLink className="h-3 w-3" /> {b.applyLabel}
                      </a>
                      {b.phone && (
                        <a href={`tel:${b.phone.replace(/[^0-9]/g, "")}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-amber-400 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-medium hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
                          Call {b.phone}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No benefits match your search. Try a different term or clear the filter.</p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          Need help applying? <a href="tel:211" className="underline text-amber-600">Call 2-1-1</a> for free local assistance connecting to benefits.
        </div>
      </div>
    </div>
  );
}
