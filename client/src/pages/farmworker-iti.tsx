import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { HeartHandshake, ShieldCheck, Lock, Star, ChevronRight, ExternalLink, Globe } from "lucide-react";

const enrollSchema = z.object({
  workerType: z.enum(["seasonal","h2a","farmworker","promotora","community-gardener","backyard-grower","informal-food-producer"]),
  preferredLanguage: z.enum(["en","es"]).default("en"),
  stateFips: z.string().optional(),
  countyName: z.string().optional(),
  isH2aWorker: z.boolean().default(false),
  isDacaRecipient: z.boolean().default(false),
  isPermanentResident: z.boolean().default(false),
  hasUsWorkAuth: z.boolean().default(true),
});

const navSchema = z.object({
  workerType: z.enum(["seasonal","h2a","farmworker","promotora","community-gardener","backyard-grower","informal-food-producer"]),
  isH2aWorker: z.boolean().default(false),
  isDacaRecipient: z.boolean().default(false),
  isPermanentResident: z.boolean().default(false),
  hasUsWorkAuth: z.boolean().default(true),
  countyName: z.string().optional(),
});

const WORKER_TYPE_LABELS: Record<string, { en: string; es: string }> = {
  seasonal: { en: "Seasonal Farmworker", es: "Trabajador agrícola de temporada" },
  h2a: { en: "H-2A Visa Agricultural Worker", es: "Trabajador agrícola con visa H-2A" },
  farmworker: { en: "Year-Round Farmworker", es: "Trabajador agrícola todo el año" },
  promotora: { en: "Promotora / Community Health Worker", es: "Promotora / Trabajadora de salud comunitaria" },
  "community-gardener": { en: "Community Gardener", es: "Jardinero/a comunitario/a" },
  "backyard-grower": { en: "Backyard / Home Food Producer", es: "Productor/a de alimentos en casa" },
  "informal-food-producer": { en: "Informal Food Producer", es: "Productor/a informal de alimentos" },
};

const CONSENT_LABELS: Record<string, { en: string; es: string }> = {
  consentSnapBenefits: { en: "SNAP food assistance", es: "Asistencia de alimentos SNAP" },
  consentWic: { en: "WIC (Women, Infants, Children)", es: "WIC (Mujeres, Bebés y Niños)" },
  consentMedicaid: { en: "Medicaid / health coverage", es: "Medicaid / cobertura de salud" },
  consentHousing: { en: "Farmworker housing assistance", es: "Asistencia de vivienda para trabajadores" },
  consentLegalAid: { en: "Agricultural legal aid", es: "Asistencia legal agrícola" },
  consentWorkforce: { en: "Workforce training (NFJP)", es: "Capacitación laboral (NFJP)" },
  consentStipendPathway: { en: "Stipend opportunities", es: "Oportunidades de estipendio" },
  consentCredentialPathway: { en: "Credential pathways", es: "Vías de credenciales" },
};

const US_STATES = [
  { fips: "48", name: "Texas" }, { fips: "06", name: "California" }, { fips: "12", name: "Florida" },
  { fips: "13", name: "Georgia" }, { fips: "37", name: "North Carolina" }, { fips: "28", name: "Mississippi" },
  { fips: "05", name: "Arkansas" }, { fips: "01", name: "Alabama" }, { fips: "22", name: "Louisiana" },
  { fips: "47", name: "Tennessee" }, { fips: "40", name: "Oklahoma" }, { fips: "35", name: "New Mexico" },
  { fips: "04", name: "Arizona" }, { fips: "53", name: "Washington" }, { fips: "41", name: "Oregon" },
  { fips: "16", name: "Idaho" }, { fips: "30", name: "Montana" }, { fips: "17", name: "Illinois" },
  { fips: "39", name: "Ohio" }, { fips: "42", name: "Pennsylvania" }, { fips: "36", name: "New York" },
];

export default function FarmworkerItiPage() {
  const { toast } = useToast();
  const [lang, setLang] = useState<"en" | "es">("en");
  const [token, setToken] = useState<string>(() => localStorage.getItem("fw_token") || "");
  const [tab, setTab] = useState(token ? "navigator" : "welcome");
  const [navResult, setNavResult] = useState<any>(null);

  const L = (en: string, es: string) => lang === "es" ? es : en;

  const enrollForm = useForm<z.infer<typeof enrollSchema>>({
    resolver: zodResolver(enrollSchema),
    defaultValues: { workerType: "seasonal", preferredLanguage: "en", isH2aWorker: false, isDacaRecipient: false, isPermanentResident: false, hasUsWorkAuth: true },
  });

  const navForm = useForm<z.infer<typeof navSchema>>({
    resolver: zodResolver(navSchema),
    defaultValues: { workerType: "seasonal", isH2aWorker: false, isDacaRecipient: false, isPermanentResident: false, hasUsWorkAuth: true },
  });

  const { data: options } = useQuery({
    queryKey: ["/api/farmworker-iti/options", lang],
    queryFn: async () => {
      const r = await apiRequest("GET", `/api/farmworker-iti/options?lang=${lang}`);
      return r.json();
    },
  });

  const { data: me } = useQuery({
    queryKey: ["/api/farmworker-iti/me", token],
    queryFn: async () => {
      if (!token) return null;
      const r = await apiRequest("GET", "/api/farmworker-iti/me", undefined, { "x-farmworker-token": token });
      return r.json();
    },
    enabled: !!token,
  });

  const { data: stipends } = useQuery({
    queryKey: ["/api/farmworker-iti/stipend-pathways"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/farmworker-iti/stipend-pathways");
      return r.json();
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async (values: z.infer<typeof enrollSchema>) => {
      const r = await apiRequest("POST", "/api/farmworker-iti/enroll", { ...values, preferredLanguage: lang });
      return r.json();
    },
    onSuccess: (data) => {
      if (data.accessToken) {
        localStorage.setItem("fw_token", data.accessToken);
        setToken(data.accessToken);
        setTab("navigator");
        toast({ title: data.message });
      }
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const consentMutation = useMutation({
    mutationFn: async (updates: Record<string, boolean>) => {
      const r = await apiRequest("PATCH", "/api/farmworker-iti/consents", updates, { "x-farmworker-token": token });
      return r.json();
    },
    onSuccess: () => toast({ title: L("Saved.", "Guardado.") }),
  });

  const navMutation = useMutation({
    mutationFn: async (values: z.infer<typeof navSchema>) => {
      const r = await apiRequest("POST", "/api/farmworker-iti/benefits-navigator", { ...values, lang });
      return r.json();
    },
    onSuccess: setNavResult,
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5">
        <nav className="text-xs text-slate-500 mb-2 flex items-center gap-1"><HeartHandshake className="w-3 h-3" /><span>Farmworker ITI — ThriveUp Academy</span></nav>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">
              {L("Farmworker Integration Through Invitation", "Integración a través de invitación para trabajadores agrícolas")}
            </h1>
            <p className="mt-1 text-slate-500 max-w-2xl">
              {L("No credential check. No immigration status check. Benefits navigation, stipend pathways, and credential opportunities for all farmworkers and food producers.",
                 "Sin verificación de credenciales. Sin verificación de estatus migratorio. Navegación de beneficios, vías de estipendio y oportunidades de credenciales para todos los trabajadores agrícolas.")}
            </p>
          </div>
          <Button variant="outline" size="sm" data-testid="button-language"
            onClick={() => { setLang(l => l === "en" ? "es" : "en"); enrollForm.setValue("preferredLanguage", lang === "en" ? "es" : "en"); }}>
            <Globe className="w-4 h-4 mr-1" />{lang === "en" ? "🇪🇸 Español" : "🇺🇸 English"}
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="welcome" data-testid="tab-welcome">{L("Welcome","Bienvenido/a")}</TabsTrigger>
            <TabsTrigger value="navigator" data-testid="tab-navigator">{L("Benefits Navigator","Navegador de beneficios")}</TabsTrigger>
            {token && <TabsTrigger value="consents" data-testid="tab-consents">{L("My Consents","Mis consentimientos")}</TabsTrigger>}
            <TabsTrigger value="stipends" data-testid="tab-stipends">{L("Stipend Pathways","Vías de estipendio")}</TabsTrigger>
          </TabsList>

          {/* Welcome + Enroll */}
          <TabsContent value="welcome">
            <Card className="mb-6 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-300 mb-1">
                      {L("Your safety first", "Tu seguridad primero")}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      {L("We do not ask for your name, Social Security number, immigration documents, or employer information. All 8 data-sharing consents are OFF by default. You decide what happens with your information.",
                         "No pedimos su nombre, número de seguro social, documentos de inmigración ni información del empleador. Los 8 consentimientos están DESACTIVADOS por defecto. Usted decide qué pasa con su información.")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{L("Join — No Documentation Required", "Únase — Sin documentación requerida")}</CardTitle>
                <CardDescription>{L("Creates a private access token stored only on your device.", "Crea un token de acceso privado guardado solo en su dispositivo.")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...enrollForm}>
                  <form onSubmit={enrollForm.handleSubmit(v => enrollMutation.mutate(v))} className="space-y-4">
                    <FormField control={enrollForm.control} name="workerType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{L("I am a…","Soy…")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger data-testid="select-worker-type"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {Object.entries(WORKER_TYPE_LABELS).map(([value, labels]) => (
                              <SelectItem key={value} value={value}>{lang === "es" ? labels.es : labels.en}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />

                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase">{L("Immigration/Work Status (optional — helps us find the right programs)","Estatus migratorio/laboral (opcional — nos ayuda a encontrar los programas correctos)")}</p>
                      {[
                        ["isH2aWorker", L("I have an H-2A visa", "Tengo visa H-2A")],
                        ["isDacaRecipient", L("I am a DACA recipient", "Soy beneficiario/a de DACA")],
                        ["isPermanentResident", L("I am a Lawful Permanent Resident (green card)", "Soy residente permanente legal")],
                        ["hasUsWorkAuth", L("I have U.S. work authorization", "Tengo autorización de trabajo en EE.UU.")],
                      ].map(([name, label]) => (
                        <FormField key={name as string} control={enrollForm.control} name={name as any} render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl><Checkbox data-testid={`check-${name}`} checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">{label}</FormLabel>
                          </FormItem>
                        )} />
                      ))}
                    </div>

                    <div>
                      <label className="text-sm font-medium">{L("State (optional)","Estado (opcional)")}</label>
                      <Select onValueChange={v => enrollForm.setValue("stateFips", v)}>
                        <SelectTrigger className="mt-1" data-testid="select-fw-state"><SelectValue placeholder={L("Select state","Seleccione estado")} /></SelectTrigger>
                        <SelectContent>{US_STATES.map(s => <SelectItem key={s.fips} value={s.fips}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>

                    <Button data-testid="button-fw-enroll" type="submit" className="w-full" disabled={enrollMutation.isPending}>
                      {enrollMutation.isPending ? L("Joining…","Uniéndose…") : L("Join — No Documentation Required","Únase — Sin documentación requerida")}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Benefits Navigator */}
          <TabsContent value="navigator">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-base">{L("Find Your Benefits","Encuentre sus beneficios")}</CardTitle>
                <CardDescription>{L("No account needed — answer a few questions to see what you may qualify for.","Sin cuenta necesaria — responda algunas preguntas para ver a qué puede calificar.")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...navForm}>
                  <form onSubmit={navForm.handleSubmit(v => navMutation.mutate(v))} className="space-y-4">
                    <FormField control={navForm.control} name="workerType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{L("I am a…","Soy…")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger data-testid="select-nav-worker-type"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {Object.entries(WORKER_TYPE_LABELS).map(([value, labels]) => (
                              <SelectItem key={value} value={value}>{lang === "es" ? labels.es : labels.en}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <div className="flex flex-wrap gap-4">
                      {[
                        ["isH2aWorker", L("H-2A visa worker","Visa H-2A")],
                        ["isDacaRecipient", L("DACA recipient","Beneficiario/a DACA")],
                        ["isPermanentResident", L("Permanent Resident","Residente Permanente")],
                        ["hasUsWorkAuth", L("Has work authorization","Tiene autorización de trabajo")],
                      ].map(([name, label]) => (
                        <FormField key={name as string} control={navForm.control} name={name as any} render={({ field }) => (
                          <FormItem className="flex items-center gap-1.5">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel className="text-xs font-normal cursor-pointer">{label}</FormLabel>
                          </FormItem>
                        )} />
                      ))}
                    </div>
                    <Button data-testid="button-find-benefits" type="submit" className="w-full" disabled={navMutation.isPending}>
                      {navMutation.isPending ? L("Finding programs…","Buscando programas…") : L("Find My Benefits","Encontrar mis beneficios")}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {navResult && (
              <div className="space-y-4">
                {/* AI Guidance */}
                {navResult.aiGuidance?.message && (
                  <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                    <CardContent className="pt-4">
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{navResult.aiGuidance.message}</p>
                      {navResult.aiGuidance.topPriority && (
                        <div className="mt-3 flex items-start gap-2">
                          <Star className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{L("Top priority:","Prioridad principal:")} {navResult.aiGuidance.topPriority}</p>
                        </div>
                      )}
                      {navResult.aiGuidance.safetyNote && (
                        <p className="text-xs text-slate-500 mt-3 italic">{navResult.aiGuidance.safetyNote}</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Eligible benefits */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{navResult.totalEligible} {L("programs may be available to you","programas pueden estar disponibles para usted")}</p>
                  {navResult.eligible?.map((b: any, i: number) => (
                    <Card key={i} data-testid={`benefit-card-${i}`}>
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{lang === "es" ? b.name?.es : b.name?.en}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{lang === "es" ? b.description?.es : b.description?.en}</p>
                            <p className="text-xs text-slate-500 mt-1 italic">{lang === "es" ? b.eligibility?.es : b.eligibility?.en}</p>
                          </div>
                          <a href={b.applyUrl} target="_blank" rel="noopener noreferrer"
                            className="shrink-0 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                            <ExternalLink className="w-3 h-3" />{L("Apply","Aplicar")} ↗
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {!navResult && !navMutation.isPending && (
              <div className="text-center py-12">
                <HeartHandshake className="w-14 h-14 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">{L("Answer a few questions above to find programs that may help you.","Responda algunas preguntas arriba para encontrar programas que pueden ayudarle.")}</p>
              </div>
            )}
          </TabsContent>

          {/* Consents (enrolled users) */}
          {token && (
            <TabsContent value="consents">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5 text-blue-600" />{L("Your 8-Layer Consent","Sus 8 capas de consentimiento")}</CardTitle>
                  <CardDescription>{L("All OFF by default. You control everything.","Todo DESACTIVADO por defecto. Usted controla todo.")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(CONSENT_LABELS).map(([key, labels]) => {
                      const currentValue = me?.enrollment?.[key] ?? false;
                      return (
                        <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                          <p className="text-sm text-slate-700 dark:text-slate-200">{lang === "es" ? labels.es : labels.en}</p>
                          <Switch
                            data-testid={`consent-${key}`}
                            checked={currentValue}
                            onCheckedChange={checked => consentMutation.mutate({ [key]: checked })}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-400 mt-4">
                    <ShieldCheck className="w-3 h-3 inline mr-1" />
                    {L("Your individual information is never shared. Only aggregates, only when you consent.","Su información individual nunca se comparte. Solo agregados, solo cuando usted consiente.")}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Stipend Pathways */}
          <TabsContent value="stipends">
            {stipends?.pathways ? (
              <div className="space-y-4">
                {stipends.pathways.map((p: any, i: number) => (
                  <Card key={i} data-testid={`stipend-card-${i}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-base">{p.name}</h3>
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-sm">{p.stipend}</Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{p.description}</p>
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-slate-500 mb-1">{L("Requirements","Requisitos")}</p>
                        <ul className="space-y-1">
                          {p.requirements?.map((r: string, j: number) => (
                            <li key={j} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                              <ChevronRight className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />{r}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
                        <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-0.5">{L("Credential","Credencial")}</p>
                        <p className="text-xs text-green-800 dark:text-green-300">{p.credential}</p>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">{L("Eligibility:","Elegibilidad:")} {p.eligibility}</p>
                    </CardContent>
                  </Card>
                ))}
                {stipends.nfjpPathway && (
                  <Card className="border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-4">
                      <p className="text-sm text-blue-700 dark:text-blue-400">{stipends.nfjpPathway}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="w-14 h-14 mx-auto text-amber-300 mb-4" />
                <p className="text-slate-500">{L("Loading stipend pathways…","Cargando vías de estipendio…")}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
