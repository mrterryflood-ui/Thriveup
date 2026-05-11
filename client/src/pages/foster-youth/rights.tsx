import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Scale, ExternalLink } from "lucide-react";
import { CrisisStrip } from "@/components/foster-youth/crisis-strip";

interface Right {
  id: string;
  title: string;
  titleEs: string;
  source: string;
  plain: string;
  whatItMeans: string;
  howToUse: string;
}

const FEDERAL_RIGHTS: Right[] = [
  {
    id: "chafee",
    title: "John H. Chafee Foster Care Program for Successful Transition to Adulthood",
    titleEs: "Programa Chafee para una Transición Exitosa a la Vida Adulta",
    source: "42 USC §677 (extended by Family First Prevention Services Act, 2018)",
    plain: "If you spent any time in foster care after age 14, your state must offer you independent-living services through age 23.",
    whatItMeans: "Life skills training, education support, employment help, mentoring, healthcare info, financial literacy, housing assistance, and one-time stipends. Up to 30% of your state's Chafee allocation can be spent on room and board.",
    howToUse: "Ask any current or former caseworker for the name of your state's Independent Living Coordinator. In Texas, this is the DFPS Preparation for Adult Living (PAL) program: dfps.texas.gov/Child_Protection/Youth/Preparation_for_Adult_Living.asp",
  },
  {
    id: "etv",
    title: "Education and Training Voucher (ETV)",
    titleEs: "Vale de Educación y Capacitación",
    source: "42 USC §677(i)",
    plain: "Up to $5,000 per year for postsecondary education — through age 26 (extended by Family First Act).",
    whatItMeans: "Covers college, vocational school, trade certification, books, room and board, transportation, and childcare while you study. NOT a loan. NOT taxable. Eligible if you were in foster care at age 14+ or were adopted from foster care after age 16.",
    howToUse: "File FAFSA first (you qualify as an independent student — see the FAFSA tool). Then apply through your state ETV coordinator OR Foster Care to Success (fc2success.org), which administers ETV in many states.",
  },
  {
    id: "fyi",
    title: "HUD Foster Youth to Independence (FYI) initiative",
    titleEs: "Iniciativa Vivienda para Jóvenes en Transición (FYI)",
    source: "HUD Family Unification Program (FUP) youth set-aside, 24 CFR §982",
    plain: "Up to 36 months of housing-choice voucher rental assistance for youth ages 18–24 aging out of foster care.",
    whatItMeans: "A federal rental subsidy paid directly to your landlord. You pay ~30% of your income; HUD pays the rest. Combines with Chafee and PHA partnership to wrap supportive services. Time-limited (36 months) but can transition to a regular Housing Choice Voucher.",
    howToUse: "Eligibility requires referral from the Public Child Welfare Agency (PCWA) — your state foster care agency. Then apply at your local Public Housing Authority. Find your PHA: hud.gov/states.",
  },
  {
    id: "medicaid26",
    title: "Medicaid until age 26 — no income test",
    titleEs: "Medicaid Hasta los 26 Años — Sin Prueba de Ingresos",
    source: "Affordable Care Act §2004 (added 42 USC §1396a(a)(10)(A)(i)(IX))",
    plain: "If you were in foster care AND on Medicaid on your 18th birthday (or whatever age you aged out, up to 21 in extended-care states), you get free Medicaid until your 26th birthday. No income limit.",
    whatItMeans: "This is the same age-26 coverage middle-class kids get on their parents' insurance. It's federal entitlement. The 'Former Foster Care Children' (FFCC) Medicaid category cannot be denied based on your earnings.",
    howToUse: "Apply at your state Medicaid portal. In Texas: yourtexasbenefits.com — choose 'Former Foster Care Children'. If denied, cite ACA §2004 and request a fair hearing. Confirmed nationwide for ALL states starting 2023 (the 'state of residence' loophole was closed by the SUPPORT Act).",
  },
  {
    id: "fafsa-independent",
    title: "FAFSA Independent-Student Status",
    titleEs: "Estatus de Estudiante Independiente en FAFSA",
    source: "Higher Education Act §480(d)",
    plain: "If you were in foster care at any point after your 13th birthday, you file FAFSA as an INDEPENDENT student — your parents' income does not count.",
    whatItMeans: "You report only your own income (and your spouse's, if married). This usually unlocks much more federal aid: full Pell Grant ($7,395 max), subsidized loans, and need-based campus aid.",
    howToUse: "On FAFSA, answer YES to: 'At any time since you turned age 13, were you an orphan, in foster care, or a ward of the court?' That single answer changes everything. Combine with ETV for the full stack.",
  },
  {
    id: "mckinney-vento",
    title: "McKinney-Vento — School Stability",
    titleEs: "Ley McKinney-Vento — Estabilidad Escolar",
    source: "42 USC §11431 et seq. + ESSA Title IX §1112(c)(5)",
    plain: "If you experience homelessness while in school (K–12), you have the right to stay in your school of origin even if you move, plus immediate enrollment without typical paperwork.",
    whatItMeans: "Free transportation, immediate enrollment without immunization records (school helps you get them), free meals, and a designated McKinney-Vento liaison at every school district.",
    howToUse: "Tell your school's McKinney-Vento liaison your situation. They MUST act. Find your district's liaison: nche.ed.gov.",
  },
  {
    id: "ferpa-credit",
    title: "Free Credit Report at Ages 16, 17, and Exit",
    titleEs: "Reporte de Crédito Gratuito a los 16, 17 y al Salir del Sistema",
    source: "Child and Family Services Improvement and Innovation Act (2011) + Children's Bureau ACYF-CB-PI-20-12",
    plain: "CPS must provide you with a free copy of your credit report from all 3 bureaus annually starting at age 16, and check it for fraud.",
    whatItMeans: "Foster youth experience identity theft on their credit ~3x more often than peers. Catching it before age 18 is much easier than after.",
    howToUse: "Ask your caseworker. If they don't know, you can request your own free reports at annualcreditreport.com. Dispute any account you didn't open in writing to each bureau.",
  },
  {
    id: "rhya",
    title: "Runaway and Homeless Youth Act (RHYA) Programs",
    titleEs: "Programas de la Ley para Jóvenes Fugitivos y Sin Hogar",
    source: "34 USC §11201 et seq.",
    plain: "Federally funded programs: Basic Center (short-term shelter, ages under 18), Transitional Living (up to 21 months, ages 16–22), and Street Outreach.",
    whatItMeans: "Direct services. No CPS referral needed. Run by community organizations under HHS/ACF funding.",
    howToUse: "National Runaway Safeline: 1-800-RUNAWAY (786-2929) or 1800runaway.org — they refer to local RHYA programs.",
  },
];

const TEXAS_RIGHTS: Right[] = [
  {
    id: "tx-pal",
    title: "Texas PAL — Preparation for Adult Living",
    titleEs: "Texas PAL — Preparación para la Vida Adulta",
    source: "Texas Family Code §263.6021 + Texas Admin. Code 40 §700.1402",
    plain: "Texas's Chafee program. Life skills training, transitional living allowance, ETV processing, aftercare case management.",
    whatItMeans: "Eligible: youth in DFPS conservatorship at age 16+. Includes monthly transitional living allowance (typically ~$1,000/mo for up to 12 months in qualifying programs), Circle of Support meetings, and a designated PAL staff member.",
    howToUse: "Ask your DFPS caseworker for your assigned PAL staff. dfps.texas.gov/Child_Protection/Youth/Preparation_for_Adult_Living.asp",
  },
  {
    id: "tx-extended",
    title: "Texas Extended Foster Care up to age 21",
    titleEs: "Cuidado Temporal Extendido de Texas Hasta los 21 Años",
    source: "Texas Family Code §263.602 (Texas opted in under Fostering Connections Act 2008)",
    plain: "If you're in DFPS care at 18, you can choose to stay in extended foster care up to age 21 if you're in school, working, in a job program, or have a documented medical condition.",
    whatItMeans: "Continued housing, Medicaid, monthly stipend, caseworker support, and the right to live in a Supervised Independent Living (SIL) setting (your own apartment with periodic check-ins).",
    howToUse: "Sign the voluntary extended foster care agreement BEFORE your 18th birthday. You can also re-enter between 18 and 21 if you initially exited.",
  },
  {
    id: "tx-id-fee",
    title: "Texas State ID Fee Waiver for Foster Youth Under 21",
    titleEs: "Exención de Tarifa de Identificación Estatal de Texas para Jóvenes en Cuidado Temporal Menores de 21 Años",
    source: "Texas Transp. Code §521.1811",
    plain: "Free Texas state ID or driver's license if you're under 21 and were in foster care at age 16+.",
    whatItMeans: "No $16 fee for state ID; no $25 fee for driver's license (the standard cost is waived).",
    howToUse: "Bring documentation of foster care status (court order, DFPS letter, or PAL verification) to any Texas DPS office.",
  },
  {
    id: "tx-tuition",
    title: "Texas Tuition and Fee Waiver — Public Colleges",
    titleEs: "Exención de Matrícula y Cuotas en Universidades Públicas de Texas",
    source: "Texas Education Code §54.366",
    plain: "Tuition AND mandatory fees waived at any Texas public college or university for youth who were in DFPS conservatorship.",
    whatItMeans: "This is one of the most generous foster-youth tuition waivers in the country. Eligible up to age 25 if continuously enrolled.",
    howToUse: "Apply directly to the college. Provide DFPS verification letter. Combine with Pell + ETV — they DO NOT count against the waiver.",
  },
];

function renderRight(r: Right) {
  return (
    <AccordionItem key={r.id} value={r.id} data-testid={`accordion-right-${r.id}`}>
      <AccordionTrigger className="text-left" data-testid={`accordion-trigger-${r.id}`}>
        <div className="flex flex-col items-start text-left gap-1">
          <span className="font-semibold" data-testid={`text-right-title-${r.id}`}>{r.title}</span>
          <span className="text-xs text-muted-foreground italic" data-testid={`text-right-title-es-${r.id}`}>{r.titleEs}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-3 text-sm" data-testid={`accordion-content-${r.id}`}>
        <div data-testid={`text-right-source-${r.id}`}><Badge variant="outline" className="text-xs">Legal source</Badge> <span className="text-muted-foreground">{r.source}</span></div>
        <div data-testid={`text-right-plain-${r.id}`}><strong>Plain English:</strong> {r.plain}</div>
        <div data-testid={`text-right-means-${r.id}`}><strong>What it means:</strong> {r.whatItMeans}</div>
        <div data-testid={`text-right-howto-${r.id}`}><strong>How to use it:</strong> {r.howToUse}</div>
      </AccordionContent>
    </AccordionItem>
  );
}

export default function FosterYouthRightsPage() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-foster-youth-rights">
      <CrisisStrip />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link href="/foster-youth">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-hub">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Foster Youth Hub
          </Button>
        </Link>

        <div className="flex items-start gap-4 mb-6 flex-wrap">
          <div className="rounded-xl p-3 bg-gradient-to-br from-amber-500 to-orange-600 shrink-0 shadow-md">
            <Scale className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-[280px]">
            <Badge variant="secondary" className="mb-2" data-testid="badge-tool">Tool 4 of 6</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight" data-testid="text-rights-title">My Rights</h1>
            <p className="text-muted-foreground italic" data-testid="text-rights-title-es">Mis Derechos</p>
          </div>
        </div>

        <p className="text-muted-foreground mb-6" data-testid="text-rights-intro">
          Plain-language explanations of the federal and Texas laws that exist specifically to protect youth aging out of foster care.
          Every entry shows the legal source so you (or your advocate) can cite it.
        </p>

        <h2 className="text-xl font-bold mb-3" data-testid="heading-federal">Federal rights (every state)</h2>
        <Accordion type="single" collapsible className="mb-8" data-testid="accordion-federal">
          {FEDERAL_RIGHTS.map(renderRight)}
        </Accordion>

        <h2 className="text-xl font-bold mb-3" data-testid="heading-texas">Texas-specific rights</h2>
        <p className="text-sm text-muted-foreground mb-3" data-testid="text-texas-intro">For other states, see the State Benefits page for state-by-state navigation.</p>
        <Accordion type="single" collapsible className="mb-8" data-testid="accordion-texas">
          {TEXAS_RIGHTS.map(renderRight)}
        </Accordion>

        <Card className="bg-primary/5 border-primary/30" data-testid="card-next">
          <CardHeader>
            <CardTitle data-testid="text-next-title">Next step</CardTitle>
            <CardDescription>Walk through each benefit on the State Benefits page — eligibility, application links, and warm-handoff phone numbers.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/foster-youth/benefits">
              <Button data-testid="button-go-benefits">Go to State Benefits →</Button>
            </Link>
            <a href="https://www.acf.hhs.gov/cb/grant-funding/john-h-chafee-foster-care-program-successful-transition-adulthood" target="_blank" rel="noreferrer">
              <Button variant="outline" data-testid="button-acf-chafee">
                <ExternalLink className="mr-2 h-4 w-4" /> ACF Chafee Program
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
