import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, ChevronLeft, ChevronDown, ChevronUp, ExternalLink, AlertTriangle, Phone, CheckCircle2 } from "lucide-react";
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

interface LegalTopic {
  id: string; question: string; category: string;
  shortAnswer: string;
  steps: string[];
  legalBasis?: string;
  resources: { name: string; phone?: string; url: string; detail: string }[];
  warning?: string;
}

const TOPICS: LegalTopic[] = [
  {
    id: "break-lease", question: "Can I break my lease without penalty?", category: "Housing",
    shortAnswer: "Yes. Texas law specifically lets DV/SA/stalking survivors end a lease early with no fee — with the right documentation.",
    legalBasis: "Texas Property Code §92.0161",
    steps: [
      "Get one of the following: police report, active protective order, OR written statement from a qualified professional (DV shelter worker, counselor, sexual assault advocate, licensed social worker, or medical provider).",
      "Write a letter to your landlord stating you are terminating the lease under Texas Property Code §92.0161.",
      "Give 30 days written notice. You do not need to give more than 30 days.",
      "Send the letter via certified mail to create a paper trail.",
      "You owe rent only through the 30-day notice period — not beyond.",
    ],
    resources: [
      { name: "Texas RioGrande Legal Aid", phone: "512-374-2700", url: "https://www.trla.org", detail: "Free civil legal help for low-income Texans including lease issues" },
      { name: "Volunteer Legal Services Austin", phone: "512-476-5550", url: "https://www.vlsoct.org", detail: "Free legal help for qualifying Travis County residents" },
    ],
    warning: "Your landlord cannot charge you a lease-break fee or report you to a tenant screening service for exercising this right.",
  },
  {
    id: "protective-order", question: "How do I get a protective order?", category: "Safety",
    shortAnswer: "Three types are available in Texas — including one you can get the same day without the abuser present.",
    steps: [
      "Emergency Protective Order (EPO): Police issue this at the scene of a DV call. Lasts 31–61 days. You don't apply — officers issue it automatically if they make an arrest.",
      "Temporary Ex Parte Order: File at the Travis County courthouse. A judge can grant this the same day without the abuser present. Lasts until the full hearing (usually 14–20 days).",
      "Final Protective Order: After a hearing where both parties can appear. Lasts up to 2 years and is renewable. Can include provisions for child custody, use of the home, and more.",
      "To file: Go to Travis County Family Law Center, 1450 Collier St, Austin (or call SAFE Alliance for a legal advocate to go with you).",
      "Filing is free if you cannot afford the fee.",
    ],
    resources: [
      { name: "Travis County Family Law Center", phone: "512-854-9234", url: "https://www.traviscountytx.gov/courts/family-law-center", detail: "File for a protective order here, 1450 Collier St, Austin" },
      { name: "SAFE Alliance Legal Services", phone: "512-267-7233", url: "https://safeaustin.org", detail: "Free legal advocacy — they can go with you to court" },
      { name: "Texas Legal Services Center", phone: "512-477-6000", url: "https://www.tlsc.org", detail: "Protective order hotline — free help statewide" },
    ],
  },
  {
    id: "crime-victims-comp", question: "Can the state pay my expenses from the crime?", category: "Financial",
    shortAnswer: "Yes — Texas Crime Victims' Compensation can pay medical bills, counseling, lost wages, relocation costs, and more. Apply within 3 years.",
    legalBasis: "Texas Code of Criminal Procedure, Chapter 56B",
    steps: [
      "Report the crime to law enforcement first (or show you cooperated with investigation). Some exceptions apply — contact the OAG if you didn't report.",
      "Gather bills, receipts, and documentation of expenses caused by the crime.",
      "Apply online at oag.texas.gov/crime-victims or call 1-800-983-9933 for help.",
      "You have 3 years from the date of the crime to apply. Don't wait.",
      "An OAG crime victims' compensation specialist will contact you to help process your claim.",
    ],
    resources: [
      { name: "Texas AG Crime Victims' Compensation", phone: "1-800-983-9933", url: "https://www.oag.texas.gov/crime-victims", detail: "Apply online or call for free help with your application" },
      { name: "SAFE Alliance Victim Advocacy", phone: "512-267-7233", url: "https://safeaustin.org", detail: "Advocates who can help you document your claim" },
    ],
    warning: "This program pays for expenses not covered by insurance or other assistance. It does not require the abuser to be convicted or even arrested.",
  },
  {
    id: "immigration", question: "What are my options if I'm undocumented or on a visa?", category: "Immigration",
    shortAnswer: "VAWA allows you to apply for immigration status independently of your abusive spouse or parent. You have options — even without a police report.",
    steps: [
      "VAWA Self-Petition: If your abuser is a U.S. citizen or permanent resident, you can apply for immigration status on your own. USCIS will not contact your abuser. Work authorization included.",
      "U-Visa: For survivors who have been helpful to law enforcement in the investigation or prosecution of a crime. Requires a certification from law enforcement or a prosecutor.",
      "T-Visa: For survivors of human trafficking who cooperate with law enforcement.",
      "All three processes are confidential — USCIS is prohibited from sharing your information with immigration enforcement in most circumstances.",
      "You need an immigration attorney for all three. Contact Texas RioGrande Legal Aid immediately.",
    ],
    resources: [
      { name: "Texas RioGrande Legal Aid", phone: "512-374-2700", url: "https://www.trla.org", detail: "Free immigration legal services for DV/SA survivors in Texas" },
      { name: "National Immigrant Women's Advocacy Project", url: "https://www.niwap.org", detail: "Resources and referrals for immigrant survivors nationwide" },
    ],
    warning: "Do not pay anyone who is not a licensed attorney or accredited representative to help with your immigration case. Notarios cannot legally help with immigration matters in the US.",
  },
  {
    id: "employment-rights", question: "What are my rights at work?", category: "Employment",
    shortAnswer: "Texas law protects DV survivors at work — including paid leave and protection against termination.",
    legalBasis: "Texas Labor Code §51.012",
    steps: [
      "Paid DV leave: Employers with 50+ employees must allow you to use any accrued paid leave (vacation, sick leave) for DV-related needs — medical, legal, safety planning, counseling, or relocation.",
      "Job protection: Your employer cannot fire, demote, or retaliate against you for being a DV survivor, even if the abuser shows up at your workplace.",
      "Workplace safety: Talk to HR — they can issue a workplace safety plan, enforce a no-contact policy, and share a photo of the abuser with security.",
      "You do not have to tell your employer details. You can say you need leave for a 'personal safety matter.'",
      "If your employer violates these rights, contact the Texas Workforce Commission or an employment attorney.",
    ],
    resources: [
      { name: "Texas Workforce Commission", phone: "512-463-2999", url: "https://www.twc.texas.gov", detail: "File a workplace complaint if your rights are violated" },
      { name: "Texas Legal Aid Hotline", phone: "1-800-622-5065", url: "https://texaslawhelp.org", detail: "Free legal information about employment rights" },
    ],
  },
  {
    id: "children-custody", question: "What happens with my children?", category: "Children",
    shortAnswer: "You can get emergency legal protection for your children — same day if needed. Courts prioritize children's safety.",
    steps: [
      "Emergency Protective Order: When police issue an EPO for DV, it can include provisions protecting your children, prohibiting the abuser from contact.",
      "Suit Affecting Parent-Child Relationship (SAPCR): File for emergency temporary custody at the Travis County Family Law Center. A judge can grant temporary exclusive custody the same day without the abuser present.",
      "Supervised visitation: Courts can require any contact between the abuser and children to be supervised at a designated center.",
      "Include children in your final protective order — it can specify custody, visitation restrictions, and child support.",
      "Contact SAFE Alliance or legal aid for a legal advocate who specializes in family law with DV.",
    ],
    resources: [
      { name: "SAFE Alliance — SAFE Futures", phone: "512-267-7233", url: "https://safeaustin.org", detail: "Specialized advocacy for families navigating CPS and family court" },
      { name: "Travis County Family Law Center", phone: "512-854-9234", url: "https://www.traviscountytx.gov/courts/family-law-center", detail: "File for emergency custody orders" },
    ],
    warning: "If CPS is involved, contact a DV advocate immediately. A DV-informed CPS caseworker can make a significant difference in your case outcome.",
  },
  {
    id: "address-confidentiality", question: "How do I keep my new address private?", category: "Safety",
    shortAnswer: "Texas' Address Confidentiality Program (Safe at Home) gives you a substitute address for ALL government records — utility accounts, voter registration, court filings, licenses.",
    steps: [
      "Apply through the Texas AG's office at oag.texas.gov/acp or call 512-936-1700.",
      "You'll receive a substitute P.O. Box that appears on all government records instead of your real address.",
      "All mail sent to the substitute address is forwarded to you by the AG's office.",
      "Use the substitute address when you re-register to vote, apply for benefits, update your driver's license, and in any court filing.",
      "There is no fee. The program is confidential — even the AG's staff won't know your real address.",
    ],
    resources: [
      { name: "Texas AG — Address Confidentiality Program", phone: "512-936-1700", url: "https://www.oag.texas.gov/acp", detail: "Apply directly — no fee, fully confidential" },
    ],
    warning: "Apply before you update your driver's license or voter registration — once your new address is in a government database, it's harder to protect.",
  },
];

const CATEGORIES = ["All", "Housing", "Safety", "Financial", "Immigration", "Employment", "Children"];

export default function LegalNavigatorPage() {
  const [filter, setFilter] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    if (!logged) {
      apiRequest("POST", "/api/safe-passage/log", { serviceType: "legal-navigation" }).catch(() => {});
      setLogged(true);
    }
  }, []);

  const filtered = filter === "All" ? TOPICS : TOPICS.filter(t => t.category === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50/20 dark:from-slate-950 dark:to-rose-950/10">
      <QuickExit />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/safe-passage" className="text-xs text-slate-500 hover:text-teal-600 flex items-center gap-1 mb-6">
          <ChevronLeft className="h-3 w-3" /> Back to Safe Passage
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
            <Scale className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 dark:text-slate-50">Your Legal Rights</h1>
            <p className="text-xs text-slate-500">Texas law specifically protects survivors. Plain language — no jargon.</p>
          </div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-5 text-xs text-amber-800 dark:text-amber-200">
          <strong>This is general legal information, not legal advice.</strong> For your specific situation, contact a legal aid organization — all listed below are free for qualifying individuals.
        </div>
        <div className="flex flex-wrap gap-2 mb-5">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filter === c ? "bg-rose-500 text-white border-rose-500" : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-rose-400"}`}
              data-testid={`filter-${c.toLowerCase()}`}>{c}</button>
          ))}
        </div>
        <div className="space-y-3">
          {filtered.map(topic => (
            <Card key={topic.id} className="border-slate-200 dark:border-slate-700">
              <CardContent className="p-0">
                <button className="w-full text-left p-4" onClick={() => setExpanded(expanded === topic.id ? null : topic.id)}
                  data-testid={`button-expand-${topic.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{topic.question}</span>
                        <Badge variant="outline" className="text-[10px]">{topic.category}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{topic.shortAnswer}</p>
                    </div>
                    {expanded === topic.id ? <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" /> : <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />}
                  </div>
                </button>
                {expanded === topic.id && (
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                    {topic.legalBasis && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Scale className="h-3 w-3" />
                        <span>Legal basis: <strong>{topic.legalBasis}</strong></span>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Steps:</p>
                      <ol className="space-y-2">
                        {topic.steps.map((s, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="text-[10px] font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                            <span className="text-xs text-slate-600 dark:text-slate-400">{s}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    {topic.warning && (
                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
                        <p className="text-xs text-amber-800 dark:text-amber-200"><strong>Important: </strong>{topic.warning}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Free legal help:</p>
                      <div className="space-y-2">
                        {topic.resources.map(r => (
                          <div key={r.name} className="flex items-start gap-2.5 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1">
                                  {r.name} <ExternalLink className="h-3 w-3" />
                                </a>
                                {r.phone && <a href={`tel:${r.phone.replace(/[^0-9]/g,"")}`} className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1"><Phone className="h-3 w-3" />{r.phone}</a>}
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{r.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Need immediate legal help?</p>
          <div className="space-y-1">
            <a href="tel:18006225065" className="flex items-center gap-2 text-xs text-rose-600 hover:underline"><Phone className="h-3 w-3" /> TX Legal Aid Hotline: 1-800-622-5065 (free, statewide)</a>
            <a href="tel:5123742700" className="flex items-center gap-2 text-xs text-rose-600 hover:underline"><Phone className="h-3 w-3" /> TX RioGrande Legal Aid: 512-374-2700</a>
            <a href="tel:5124765550" className="flex items-center gap-2 text-xs text-rose-600 hover:underline"><Phone className="h-3 w-3" /> Volunteer Legal Services Austin: 512-476-5550</a>
          </div>
        </div>
      </div>
    </div>
  );
}
