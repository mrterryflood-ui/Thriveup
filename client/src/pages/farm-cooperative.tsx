import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Database, ShieldCheck, UserCheck, Lock, FlaskConical, Sprout, ChevronRight } from "lucide-react";

const enrollSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  farmName: z.string().optional(),
  farmType: z.enum(["row-crop","livestock","mixed","organic","specialty","beginning-farmer"]),
  primaryCommodity: z.string().optional(),
  totalAcres: z.coerce.number().positive().optional(),
  stateFips: z.string().min(2).max(2),
  countyFips: z.string().min(3).max(3),
  countyName: z.string().min(1, "Required"),
  preferredLanguage: z.enum(["en","es"]).default("en"),
  workerType: z.enum(["owner-operator","tenant","farmworker","seasonal","h2a","informal"]).default("owner-operator"),
  email: z.string().email().optional().or(z.literal("")),
});

const FARM_TYPES = [
  { value: "row-crop", label: "Row Crop (corn, soybeans, wheat, cotton…)" },
  { value: "livestock", label: "Livestock / Ranching" },
  { value: "mixed", label: "Mixed — crops + livestock" },
  { value: "organic", label: "Certified or Transitioning Organic" },
  { value: "specialty", label: "Specialty Crops (vegetables, fruits, nuts)" },
  { value: "beginning-farmer", label: "Beginning Farmer / Rancher (< 10 years)" },
];

const CONSENT_LABELS: Record<string, { en: string; es: string; note: string }> = {
  shareSoilData:        { en: "Share my soil test data with researchers",   es: "Compartir mis datos de suelo con investigadores",    note: "De-identified averages only" },
  shareYieldData:       { en: "Share my yield data with researchers",        es: "Compartir mis datos de rendimiento con investigadores", note: "Aggregated, no farm ID" },
  shareIncomeData:      { en: "Share my input cost/income data",            es: "Compartir datos de costos/ingresos",                 note: "Aggregated, no farm ID" },
  shareWithResearchers: { en: "Allow university research use",              es: "Permitir uso en investigación universitaria",        note: "Requires your explicit OK each study" },
  shareWithUsda:        { en: "Share aggregated data with USDA",            es: "Compartir datos agregados con USDA",                 note: "Supports federal program design" },
  shareWithFunders:     { en: "Allow citation in grant applications",        es: "Permitir citar en solicitudes de becas",            note: "No personal data, aggregate only" },
  allowPublicNaming:    { en: "Allow my farm name in public reports",        es: "Permitir nombre de granja en informes públicos",    note: "Your name, your choice" },
  interestedInStipend:  { en: "Interested in stipend opportunities",        es: "Interesado/a en oportunidades de estipendio",       note: "For data contribution + outreach" },
  interestedInCredentials: { en: "Interested in credential pathways",       es: "Interesado/a en vías de credenciales",             note: "Ag credentials & certifications" },
};

const DATA_TYPES = ["soil","yield","input-cost"];

const dataSubmitSchema = z.object({
  dataType: z.enum(["soil","yield","input-cost"]),
  commodity: z.string().optional(),
  cropYear: z.coerce.number().min(2000).max(2030).optional(),
  acreage: z.coerce.number().positive().optional(),
  // Soil
  soilPh: z.coerce.number().min(0).max(14).optional(),
  organicMatterPct: z.coerce.number().min(0).max(100).optional(),
  nitrogenLbsAc: z.coerce.number().optional(),
  phosphorusLbsAc: z.coerce.number().optional(),
  potassiumLbsAc: z.coerce.number().optional(),
  // Yield
  yieldPerAcre: z.coerce.number().optional(),
  yieldUnit: z.string().optional(),
  // Cost
  seedCostPerAc: z.coerce.number().optional(),
  fertCostPerAc: z.coerce.number().optional(),
  chemCostPerAc: z.coerce.number().optional(),
  fuelCostPerAc: z.coerce.number().optional(),
  laborCostPerAc: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export default function FarmCooperativePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string>(() => localStorage.getItem("prod_token") || "");
  const [tab, setTab] = useState(token ? "dashboard" : "enroll");
  const [dataType, setDataType] = useState("soil");
  const [lang, setLang] = useState<"en" | "es">("en");

  const L = (en: string, es: string) => lang === "es" ? es : en;

  const enrollForm = useForm<z.infer<typeof enrollSchema>>({ resolver: zodResolver(enrollSchema), defaultValues: { farmType: "row-crop", workerType: "owner-operator", preferredLanguage: "en" } });
  const dataForm = useForm<z.infer<typeof dataSubmitSchema>>({ resolver: zodResolver(dataSubmitSchema), defaultValues: { dataType: "soil" } });

  const { data: profile } = useQuery({
    queryKey: ["/api/farm-cooperative/profile", token],
    queryFn: async () => {
      if (!token) return null;
      const r = await apiRequest("GET", "/api/farm-cooperative/profile", undefined, { "x-producer-token": token });
      return r.json();
    },
    enabled: !!token,
  });

  const enrollMutation = useMutation({
    mutationFn: async (values: z.infer<typeof enrollSchema>) => {
      const r = await apiRequest("POST", "/api/farm-cooperative/enroll", values);
      return r.json();
    },
    onSuccess: (data) => {
      if (data.accessToken) {
        try { localStorage.setItem("prod_token", data.accessToken); } catch {}
        setToken(data.accessToken);
        setTab("dashboard");
        toast({ title: L("Welcome to the cooperative!", "¡Bienvenido/a a la cooperativa!"), description: data.message });
        queryClient.invalidateQueries({ queryKey: ["/api/farm-cooperative/profile"] });
      }
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const consentMutation = useMutation({
    mutationFn: async (updates: Record<string, boolean>) => {
      const r = await apiRequest("PATCH", "/api/farm-cooperative/consents", updates, { "x-producer-token": token });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: L("Consent settings saved.", "Configuración guardada.") });
      queryClient.invalidateQueries({ queryKey: ["/api/farm-cooperative/profile", token] });
    },
  });

  const dataMutation = useMutation({
    mutationFn: async (values: z.infer<typeof dataSubmitSchema>) => {
      const r = await apiRequest("POST", "/api/farm-cooperative/submit-data", values, { "x-producer-token": token });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: L("Data submitted!", "¡Datos enviados!"), description: L("Thank you for contributing to the cooperative.", "Gracias por contribuir a la cooperativa.") });
      dataForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/farm-cooperative/profile", token] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const aiInsightsMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/farm-cooperative/ai-insights", {}, { "x-producer-token": token });
      return r.json();
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5">
        <nav className="text-xs text-slate-500 mb-2 flex items-center gap-1">
          <Database className="w-3 h-3" /><span>Producer Data Cooperative — ThriveUp Academy</span>
        </nav>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">Producer Data Cooperative</h1>
            <p className="mt-1 text-slate-500 max-w-2xl">Your farm data stays yours. You control what's shared, with whom, and when. No extraction.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setLang(l => l === "en" ? "es" : "en")}>
              {lang === "en" ? "🇪🇸 Español" : "🇺🇸 English"}
            </Button>
            {token && <Button variant="ghost" size="sm" onClick={() => { try { localStorage.removeItem("prod_token"); } catch {} setToken(""); setTab("enroll"); }}>Sign out</Button>}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="enroll" data-testid="tab-enroll">{L("Enroll","Inscribirse")}</TabsTrigger>
            {token && <TabsTrigger value="dashboard" data-testid="tab-dashboard">{L("My Data Vault","Mi bóveda de datos")}</TabsTrigger>}
            {token && <TabsTrigger value="consents" data-testid="tab-consents">{L("My Consents","Mis consentimientos")}</TabsTrigger>}
            {token && <TabsTrigger value="submit" data-testid="tab-submit">{L("Submit Data","Enviar datos")}</TabsTrigger>}
          </TabsList>

          {/* Enroll Tab */}
          <TabsContent value="enroll">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserCheck className="w-5 h-5 text-green-600" />{L("Join the Cooperative","Únase a la cooperativa")}</CardTitle>
                <CardDescription>{L("No credential check. No immigration status check. All consent is OFF by default.","Sin verificación de credenciales. Sin verificación de estatus migratorio. Todo el consentimiento está DESACTIVADO por defecto.")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...enrollForm}>
                  <form onSubmit={enrollForm.handleSubmit(v => enrollMutation.mutate(v))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={enrollForm.control} name="firstName" render={({ field }) => (
                        <FormItem><FormLabel>{L("First Name","Nombre")}</FormLabel><FormControl><Input data-testid="input-first-name" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={enrollForm.control} name="lastName" render={({ field }) => (
                        <FormItem><FormLabel>{L("Last Name","Apellido")}</FormLabel><FormControl><Input data-testid="input-last-name" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={enrollForm.control} name="farmName" render={({ field }) => (
                      <FormItem><FormLabel>{L("Farm or Ranch Name (optional)","Nombre de granja (opcional)")}</FormLabel><FormControl><Input data-testid="input-farm-name" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={enrollForm.control} name="farmType" render={({ field }) => (
                      <FormItem><FormLabel>{L("Farm Type","Tipo de granja")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger data-testid="select-farm-type"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>{FARM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={enrollForm.control} name="primaryCommodity" render={({ field }) => (
                        <FormItem><FormLabel>{L("Primary Commodity","Cultivo principal")}</FormLabel><FormControl><Input data-testid="input-commodity" placeholder="e.g. Corn, Cattle" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={enrollForm.control} name="totalAcres" render={({ field }) => (
                        <FormItem><FormLabel>{L("Total Acres","Total de acres")}</FormLabel><FormControl><Input data-testid="input-acres" type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField control={enrollForm.control} name="countyName" render={({ field }) => (
                        <FormItem className="col-span-2"><FormLabel>{L("County","Condado")}</FormLabel><FormControl><Input data-testid="input-county" placeholder="e.g. Travis County, TX" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={enrollForm.control} name="stateFips" render={({ field }) => (
                        <FormItem><FormLabel>State FIPS</FormLabel><FormControl><Input data-testid="input-state-fips" placeholder="48" maxLength={2} {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={enrollForm.control} name="countyFips" render={({ field }) => (
                      <FormItem><FormLabel>County FIPS</FormLabel><FormControl><Input data-testid="input-county-fips" placeholder="453" maxLength={3} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-300">
                      <ShieldCheck className="w-4 h-4 inline mr-2" />
                      {L("All 8 data-sharing consents are OFF by default. You can turn them on — or leave them all off — after enrolling.","Los 8 consentimientos de uso de datos están DESACTIVADOS por defecto. Puede activarlos — o dejarlos todos desactivados — después de inscribirse.")}
                    </div>
                    <Button data-testid="button-enroll" type="submit" className="w-full" disabled={enrollMutation.isPending}>
                      {enrollMutation.isPending ? L("Enrolling…","Inscribiendo…") : L("Join — No Credential Check","Unirse — Sin verificación de credenciales")}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            {profile && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Sprout className="w-5 h-5 text-green-600" />{profile.profile?.farmName || `${profile.profile?.firstName} ${profile.profile?.lastName}`}</CardTitle>
                    <CardDescription>{profile.profile?.farmType} · {profile.profile?.countyName} · {profile.profile?.totalAcres ? `${profile.profile.totalAcres} acres` : ""}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-700" data-testid="stat-submissions">{profile.submissionCount}</div>
                        <div className="text-xs text-slate-500">{L("Data submissions","Envíos de datos")}</div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-700">{profile.profile?.primaryCommodity || "—"}</div>
                        <div className="text-xs text-slate-500">{L("Primary crop","Cultivo principal")}</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                        <div className="text-2xl font-bold text-slate-700">{profile.profile?.workerType === "owner-operator" ? "Owner" : profile.profile?.workerType}</div>
                        <div className="text-xs text-slate-500">{L("Producer type","Tipo de productor")}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><FlaskConical className="w-4 h-4 text-purple-600" />{L("AI Insights from My Data","Perspectivas de IA de mis datos")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {aiInsightsMutation.data?.insights ? (
                      <ul className="space-y-2">
                        {aiInsightsMutation.data.insights.map((insight: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <ChevronRight className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div>
                        <p className="text-sm text-slate-500 mb-3">{profile.submissionCount > 0 ? L("Generate AI insights from your submitted farm data.","Genera perspectivas de IA desde tus datos de granja.") : L("Submit some farm data first to generate insights.","Primero envía datos de granja para generar perspectivas.")}</p>
                        {profile.submissionCount > 0 && (
                          <Button data-testid="button-ai-insights" variant="outline" size="sm" onClick={() => aiInsightsMutation.mutate()} disabled={aiInsightsMutation.isPending}>
                            {aiInsightsMutation.isPending ? L("Analyzing…","Analizando…") : L("Generate Insights","Generar perspectivas")}
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Consents Tab */}
          <TabsContent value="consents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5 text-blue-600" />{L("Your 8-Layer Data Consent","Sus 8 capas de consentimiento de datos")}</CardTitle>
                <CardDescription>{L("Every switch defaults to OFF. Turn on only what you're comfortable with. You can change this anytime.","Cada interruptor está DESACTIVADO por defecto. Active solo lo que le parezca bien. Puede cambiar esto en cualquier momento.")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(CONSENT_LABELS).map(([key, labels]) => {
                    const currentValue = profile?.consents?.[key] ?? false;
                    return (
                      <div key={key} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{lang === "es" ? labels.es : labels.en}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{labels.note}</p>
                        </div>
                        <Switch
                          data-testid={`consent-${key}`}
                          checked={currentValue}
                          onCheckedChange={checked => consentMutation.mutate({ [key]: checked })}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-xs text-slate-500">
                  <ShieldCheck className="w-3 h-3 inline mr-1" />
                  {L("Your individual data is never disclosed. Only de-identified aggregates are shared when you consent.","Sus datos individuales nunca se divulgan. Solo se comparten agregados de identificación cuando usted consiente.")}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Submit Data Tab */}
          <TabsContent value="submit">
            <Card>
              <CardHeader>
                <CardTitle>{L("Submit Farm Data","Enviar datos de granja")}</CardTitle>
                <CardDescription>{L("All submissions are private by default. Use the Consents tab to control sharing.","Todos los envíos son privados por defecto. Use la pestaña de Consentimientos para controlar el uso.")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-6">
                  {DATA_TYPES.map(t => (
                    <Button key={t} data-testid={`btn-datatype-${t}`} variant={dataType === t ? "default" : "outline"} size="sm" onClick={() => { setDataType(t); dataForm.setValue("dataType", t as any); }}>
                      {t === "soil" ? L("Soil Test","Análisis de suelo") : t === "yield" ? L("Yield","Rendimiento") : L("Input Costs","Costos de insumos")}
                    </Button>
                  ))}
                </div>
                <Form {...dataForm}>
                  <form onSubmit={dataForm.handleSubmit(v => dataMutation.mutate(v))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={dataForm.control} name="commodity" render={({ field }) => (
                        <FormItem><FormLabel>{L("Commodity","Cultivo")}</FormLabel><FormControl><Input data-testid="input-data-commodity" placeholder="Corn" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={dataForm.control} name="cropYear" render={({ field }) => (
                        <FormItem><FormLabel>{L("Crop Year","Año de cosecha")}</FormLabel><FormControl><Input data-testid="input-crop-year" type="number" placeholder="2024" {...field} /></FormControl></FormItem>
                      )} />
                    </div>
                    {dataType === "soil" && (
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={dataForm.control} name="soilPh" render={({ field }) => (
                          <FormItem><FormLabel>Soil pH</FormLabel><FormControl><Input data-testid="input-soil-ph" type="number" step="0.1" placeholder="6.8" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={dataForm.control} name="organicMatterPct" render={({ field }) => (
                          <FormItem><FormLabel>Organic Matter %</FormLabel><FormControl><Input data-testid="input-om" type="number" step="0.1" placeholder="3.2" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={dataForm.control} name="nitrogenLbsAc" render={({ field }) => (
                          <FormItem><FormLabel>Nitrogen (lbs/ac)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={dataForm.control} name="phosphorusLbsAc" render={({ field }) => (
                          <FormItem><FormLabel>Phosphorus (lbs/ac)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={dataForm.control} name="potassiumLbsAc" render={({ field }) => (
                          <FormItem><FormLabel>Potassium (lbs/ac)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                        )} />
                      </div>
                    )}
                    {dataType === "yield" && (
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={dataForm.control} name="yieldPerAcre" render={({ field }) => (
                          <FormItem><FormLabel>Yield per Acre</FormLabel><FormControl><Input data-testid="input-yield" type="number" step="0.1" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={dataForm.control} name="yieldUnit" render={({ field }) => (
                          <FormItem><FormLabel>Unit</FormLabel>
                            <Select onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="bu/ac" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="bu/ac">bu/ac</SelectItem>
                                <SelectItem value="lbs/ac">lbs/ac</SelectItem>
                                <SelectItem value="cwt/ac">cwt/ac</SelectItem>
                                <SelectItem value="tons/ac">tons/ac</SelectItem>
                              </SelectContent>
                            </Select></FormItem>
                        )} />
                        <FormField control={dataForm.control} name="acreage" render={({ field }) => (
                          <FormItem><FormLabel>Acres planted</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                        )} />
                      </div>
                    )}
                    {dataType === "input-cost" && (
                      <div className="grid grid-cols-2 gap-4">
                        {[["seedCostPerAc","Seed ($/ac)"],["fertCostPerAc","Fertilizer ($/ac)"],["chemCostPerAc","Chemicals ($/ac)"],["fuelCostPerAc","Fuel ($/ac)"],["laborCostPerAc","Labor ($/ac)"]].map(([name, label]) => (
                          <FormField key={name} control={dataForm.control} name={name as any} render={({ field }) => (
                            <FormItem><FormLabel>{label}</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
                          )} />
                        ))}
                      </div>
                    )}
                    <Button data-testid="button-submit-data" type="submit" className="w-full" disabled={dataMutation.isPending}>
                      {dataMutation.isPending ? L("Submitting…","Enviando…") : L("Submit Farm Data","Enviar datos de granja")}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
