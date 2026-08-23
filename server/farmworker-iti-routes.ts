import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./storage";
import { farmworkerItiEnrollments, insertFarmworkerItiEnrollmentSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { generateAIJSON } from "./ai-provider";
import { randomBytes } from "crypto";

// Worker type labels (English + Spanish)
const WORKER_TYPES = [
  { id: "seasonal",          en: "Seasonal Farmworker",               es: "Trabajador agrícola de temporada" },
  { id: "h2a",               en: "H-2A Visa Agricultural Worker",     es: "Trabajador agrícola con visa H-2A" },
  { id: "farmworker",        en: "Year-Round Farmworker",             es: "Trabajador agrícola todo el año" },
  { id: "promotora",         en: "Promotora / Community Health Worker",es: "Promotora / Trabajadora de salud comunitaria" },
  { id: "community-gardener",en: "Community Gardener",                es: "Jardinero/a comunitario/a" },
  { id: "backyard-grower",   en: "Backyard / Home Food Producer",     es: "Productor/a de alimentos en casa" },
  { id: "informal-food-producer", en: "Informal Food Producer",      es: "Productor/a informal de alimentos" },
];

// Benefits programs with immigration-awareness flags
const BENEFITS_PROGRAMS = [
  {
    id: "snap",
    name: { en: "SNAP (Food Stamps)", es: "SNAP (Cupones de alimentos)" },
    description: { en: "Monthly food assistance for eligible low-income households.", es: "Asistencia mensual de alimentos para hogares de bajos ingresos elegibles." },
    eligibility: { en: "US citizens, lawful permanent residents, certain legal immigrants with 5+ years residency. H-2A workers are generally NOT eligible.", es: "Ciudadanos estadounidenses, residentes permanentes legales, ciertos inmigrantes legales con 5+ años de residencia. Los trabajadores H-2A generalmente NO son elegibles." },
    applyUrl: "https://www.fns.usda.gov/snap/state-directory",
    h2aEligible: false,
    undocumentedEligible: false,
    citizenRequired: false, // LPRs with 5 years qualify
    consentKey: "consentSnapBenefits",
    income: "SNAP",
  },
  {
    id: "wic",
    name: { en: "WIC (Women, Infants, Children)", es: "WIC (Mujeres, Bebés y Niños)" },
    description: { en: "Nutrition support for pregnant women, new mothers, and children under 5.", es: "Apoyo nutricional para mujeres embarazadas, madres y niños menores de 5 años." },
    eligibility: { en: "Income-based. Immigration status does not affect WIC eligibility for children under 5.", es: "Basado en ingresos. El estatus migratorio NO afecta la elegibilidad de los niños menores de 5 años." },
    applyUrl: "https://www.fns.usda.gov/wic/wic-how-apply",
    h2aEligible: true,
    undocumentedEligible: true, // for children and mothers
    citizenRequired: false,
    consentKey: "consentWic",
    income: "WIC",
  },
  {
    id: "medicaid",
    name: { en: "Medicaid / CHIP", es: "Medicaid / CHIP" },
    description: { en: "Free or low-cost health coverage.", es: "Cobertura de salud gratuita o de bajo costo." },
    eligibility: { en: "Varies by state. Emergency Medicaid available regardless of immigration status. CHIP covers children in many states regardless of status.", es: "Varía por estado. Medicaid de emergencia disponible sin importar estatus migratorio. CHIP cubre a niños en muchos estados sin importar estatus." },
    applyUrl: "https://www.healthcare.gov/medicaid-chip/",
    h2aEligible: false, // H-2A must use employer insurance, but emergency Medicaid available
    undocumentedEligible: true, // emergency only
    citizenRequired: false,
    consentKey: "consentMedicaid",
    income: "Medicaid",
  },
  {
    id: "housing",
    name: { en: "Migrant and Seasonal Farmworker Housing", es: "Vivienda para trabajadores agrícolas migrantes y de temporada" },
    description: { en: "USDA Rural Development Section 514/516 farmworker housing assistance.", es: "Asistencia de vivienda para trabajadores agrícolas del USDA Desarrollo Rural." },
    eligibility: { en: "Migrant and seasonal farmworkers. Documentation not always required. Contact local rural housing authority.", es: "Trabajadores agrícolas migrantes y de temporada. No siempre se requiere documentación. Contacte a la autoridad de vivienda rural local." },
    applyUrl: "https://www.rd.usda.gov/programs-services/multi-family-housing-programs/farm-labor-housing-direct-loans-grants",
    h2aEligible: false, // H-2A employer provides housing
    undocumentedEligible: true, // many programs don't check
    citizenRequired: false,
    consentKey: "consentHousing",
    income: "Housing",
  },
  {
    id: "legal-aid",
    name: { en: "Agricultural Worker Legal Aid", es: "Asistencia legal para trabajadores agrícolas" },
    description: { en: "Free legal help for farmworkers: wage theft, unsafe conditions, H-2A violations, housing disputes.", es: "Ayuda legal gratuita para trabajadores: robo de salario, condiciones inseguras, violaciones de H-2A, disputas de vivienda." },
    eligibility: { en: "All farmworkers regardless of immigration status. No documentation required for initial consultation.", es: "Todos los trabajadores agrícolas sin importar estatus migratorio. No se requiere documentación para consulta inicial." },
    applyUrl: "https://www.farmworkerassist.org/",
    h2aEligible: true,
    undocumentedEligible: true,
    citizenRequired: false,
    consentKey: "consentLegalAid",
    income: "Legal Aid",
  },
  {
    id: "workforce",
    name: { en: "National Farmworker Jobs Program (NFJP)", es: "Programa Nacional de Empleo para Trabajadores Agrícolas (NFJP)" },
    description: { en: "Workforce training, career services, and job placement for farmworkers.", es: "Capacitación laboral, servicios de carrera y colocación de empleo para trabajadores agrícolas." },
    eligibility: { en: "Must be a current or recent farmworker. Legal work authorization required.", es: "Debe ser trabajador agrícola actual o reciente. Se requiere autorización legal de trabajo." },
    applyUrl: "https://www.dol.gov/agencies/eta/agriculture/national-farmworker-jobs-program",
    h2aEligible: false,
    undocumentedEligible: false,
    citizenRequired: false,
    consentKey: "consentWorkforce",
    income: "NFJP",
  },
];

function generateToken(): string {
  return `fw_${randomBytes(32).toString("base64url")}`;
}

// The client keeps this capability only in its 12-hour sessionStorage envelope.
// Match that boundary on the server so a copied capability cannot remain valid
// indefinitely after the browser-side envelope has expired.
const FARMWORKER_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const INVALID_FARMWORKER_TOKEN_ERROR = "Farmworker access token is invalid, revoked, or expired. Enroll again to receive a new token.";

function parseStrictBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function isExpired(enrolledAt: Date | null): boolean {
  return !enrolledAt || Date.now() - enrolledAt.getTime() >= FARMWORKER_TOKEN_TTL_MS;
}

async function getActiveEnrollment(token: unknown) {
  if (typeof token !== "string" || token.length === 0) return undefined;
  const [enrollment] = await db.select().from(farmworkerItiEnrollments)
    .where(eq(farmworkerItiEnrollments.accessToken, token));
  return enrollment && !isExpired(enrollment.enrolledAt) ? enrollment : undefined;
}

type RateLimitBucket = { count: number; resetAt: number };
const publicRateLimitBuckets = new Map<string, RateLimitBucket>();

function limitPublicRoute(name: string, max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const ip = (req.ip || req.socket?.remoteAddress || "unknown").trim();
    const key = `${name}:${ip}`;
    const bucket = publicRateLimitBuckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      publicRateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (bucket.count >= max) {
      const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSec));
      return res.status(429).json({ error: "Rate limit exceeded. Try again later.", retryAfterSec });
    }
    bucket.count += 1;
    next();
  };
}

export function registerFarmworkerItiRoutes(app: Express) {

  // Get worker type options + benefits overview (public, no auth)
  app.get("/api/farmworker-iti/options", async (req, res) => {
    const lang = (req.query.lang as string) || "en";
    const workerTypes = WORKER_TYPES.map(w => ({ id: w.id, label: lang === "es" ? w.es : w.en }));
    const benefits = BENEFITS_PROGRAMS.map(b => ({
      id: b.id,
      name: lang === "es" ? b.name.es : b.name.en,
      description: lang === "es" ? b.description.es : b.description.en,
      h2aEligible: b.h2aEligible,
      undocumentedEligible: b.undocumentedEligible,
      consentKey: b.consentKey,
    }));
    res.json({ workerTypes, benefits, source: "USDA, USDOL, Federal benefits programs" });
  });

  // Enroll (Integration Through Invitation — no credential check, all consent OFF)
  app.post("/api/farmworker-iti/enroll", limitPublicRoute("enroll", 10, 60 * 60 * 1000), async (req, res) => {
    try {
      const body = insertFarmworkerItiEnrollmentSchema.parse({ ...req.body, accessToken: generateToken() });
      const [enrollment] = await db.insert(farmworkerItiEnrollments).values(body).returning();
      const { accessToken, ...safe } = enrollment;

      const lang = req.body.preferredLanguage || "en";
      res.json({
        success: true,
        accessToken: enrollment.accessToken,
        enrollmentId: enrollment.id,
        message: lang === "es"
          ? "Bienvenido/a. Sus datos le pertenecen. Usted controla lo que se comparte."
          : "Welcome. Your data belongs to you. You control what is shared.",
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get enrollment + benefits referrals by token
  app.get("/api/farmworker-iti/me", async (req, res) => {
    const token = req.headers["x-farmworker-token"] as string;
    const enrollment = await getActiveEnrollment(token);
    if (!enrollment) return res.status(401).json({ error: INVALID_FARMWORKER_TOKEN_ERROR });
    const { accessToken: _, ...safe } = enrollment;
    // Build personalized benefits list based on immigration status + consents
    const eligibleBenefits = BENEFITS_PROGRAMS.filter(b => {
      if (enrollment.isH2aWorker && !b.h2aEligible && b.id !== "legal-aid" && b.id !== "wic") return false;
      return true;
    });
    res.json({ enrollment: safe, eligibleBenefits, totalEligibleBenefits: eligibleBenefits.length });
  });

  // Update consents
  app.patch("/api/farmworker-iti/consents", async (req, res) => {
    const token = req.headers["x-farmworker-token"] as string;
    const enrollment = await getActiveEnrollment(token);
    if (!enrollment) return res.status(401).json({ error: INVALID_FARMWORKER_TOKEN_ERROR });
    const allowed = ["consentSnapBenefits","consentWic","consentMedicaid","consentHousing","consentLegalAid","consentWorkforce","consentStipendPathway","consentCredentialPathway"];
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ error: "Consent updates must be a JSON object with boolean values." });
    }
    const updates: Record<string, boolean> = {};
    for (const key of allowed) {
      if (!(key in req.body)) continue;
      const value = parseStrictBoolean(req.body[key]);
      if (value === undefined) return res.status(400).json({ error: `${key} must be a boolean.` });
      updates[key] = value;
    }
    const [updated] = await db.update(farmworkerItiEnrollments).set(updates)
      .where(eq(farmworkerItiEnrollments.accessToken, token)).returning();
    const { accessToken: _, ...safe } = updated;
    res.json({ success: true, enrollment: safe });
  });

  // Revocation preserves the enrollment and its private data, but makes the
  // presented capability permanently unusable. The replacement is never
  // returned, so it cannot grant a new session.
  app.post("/api/farmworker-iti/revoke", async (req, res) => {
    const token = req.headers["x-farmworker-token"] as string;
    const enrollment = await getActiveEnrollment(token);
    if (!enrollment) return res.status(401).json({ error: INVALID_FARMWORKER_TOKEN_ERROR });
    const rotatedToken = generateToken();
    const [revoked] = await db.update(farmworkerItiEnrollments)
      .set({ accessToken: rotatedToken })
      .where(eq(farmworkerItiEnrollments.accessToken, token))
      .returning({ id: farmworkerItiEnrollments.id });
    if (!revoked) return res.status(401).json({ error: INVALID_FARMWORKER_TOKEN_ERROR });
    res.json({ success: true });
  });

  // Get AI-powered benefits navigation (personalized to worker profile)
  app.post("/api/farmworker-iti/benefits-navigator", limitPublicRoute("benefits-navigator", 10, 60 * 60 * 1000), async (req, res) => {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ error: "Benefits navigation input must be a JSON object." });
    }
    const body = req.body as Record<string, unknown>;
    const allowedWorkerTypes = new Set(WORKER_TYPES.map((worker) => worker.id));
    const workerType = body.workerType === undefined ? "farmworker" : body.workerType;
    if (typeof workerType !== "string" || !allowedWorkerTypes.has(workerType)) {
      return res.status(400).json({ error: "workerType must be a supported worker type." });
    }
    const booleanFields = ["isH2aWorker", "isDacaRecipient", "isPermanentResident", "hasUsWorkAuth"] as const;
    const profile: Record<(typeof booleanFields)[number], boolean> = {
      isH2aWorker: false,
      isDacaRecipient: false,
      isPermanentResident: false,
      hasUsWorkAuth: false,
    };
    for (const field of booleanFields) {
      if (body[field] === undefined) continue;
      const value = parseStrictBoolean(body[field]);
      if (value === undefined) return res.status(400).json({ error: `${field} must be a boolean.` });
      profile[field] = value;
    }
    const lang = body.lang === undefined ? "en" : body.lang;
    if (lang !== "en" && lang !== "es") {
      return res.status(400).json({ error: "lang must be either \"en\" or \"es\"." });
    }
    const countyName = body.countyName === undefined ? undefined : body.countyName;
    if (countyName !== undefined && (typeof countyName !== "string"
      || countyName.trim().length > 100
      || !/^[\p{L}\p{M} .,'-]+$/u.test(countyName.trim()))) {
      return res.status(400).json({ error: "countyName must be a county name of at most 100 characters." });
    }
    const safeCountyName = countyName?.trim() || "unknown";
    const { isH2aWorker, isDacaRecipient, isPermanentResident, hasUsWorkAuth } = profile;

    // Determine eligibility without requiring enrollment
    const isUndocumented = !hasUsWorkAuth && !isDacaRecipient && !isPermanentResident && !isH2aWorker;
    const eligible = BENEFITS_PROGRAMS.filter(b => {
      if (isH2aWorker && !b.h2aEligible && b.id !== "legal-aid" && b.id !== "wic") return false;
      if (isUndocumented && !b.undocumentedEligible) return false;
      return true;
    });

    const prompt = `You are a bilingual (English/Spanish) community health worker helping an agricultural worker navigate benefits. You are compassionate, plain-spoken, and immigration-status aware.

Worker profile: type=${workerType}, H-2A=${isH2aWorker}, DACA=${isDacaRecipient}, permanent resident=${isPermanentResident}, work auth=${hasUsWorkAuth}, county=${safeCountyName}, language preference=${lang}

Eligible programs: ${eligible.map(b => (lang === "es" ? b.name.es : b.name.en)).join(", ")}

Write a 3-4 sentence warm, plain-language summary of what this worker can access and what to do first. If H-2A, acknowledge their unique situation. If undocumented, focus on emergency Medicaid, WIC for children, and legal aid. If language is Spanish, respond in Spanish. Return as JSON: { message: string, topPriority: string, safetyNote: string }`;

    try {
      const result = await generateAIJSON(prompt, '{"message":"","topPriority":"","safetyNote":""}');
      res.json({ eligible, aiGuidance: result, totalEligible: eligible.length });
    } catch (err: any) {
      res.json({ eligible, aiGuidance: null, totalEligible: eligible.length, error: err.message });
    }
  });

  // Stipend pathway information
  app.get("/api/farmworker-iti/stipend-pathways", async (req, res) => {
    res.json({
      pathways: [
        {
          name: "Peer Agricultural Health Educator",
          stipend: "$500–$1,000/quarter",
          description: "Shadow farmworkers who become community health educators in their own agricultural networks.",
          requirements: ["Complete 8-hour orientation", "Log 20 peer outreach contacts/quarter", "Attend monthly cohort meeting"],
          credential: "Certificate of Completion — Peer Ag Health Education (ThriveUp / TCAF)",
          eligibility: "All farmworker types — no immigration status check",
        },
        {
          name: "Promotora de Campo (Field Promotora)",
          stipend: "$750/quarter",
          description: "Trusted farmworker community members who facilitate health navigation and ITI enrollment for co-workers.",
          requirements: ["Fluent in Spanish and/or indigenous language", "Complete promotora training", "Serve 30+ farmworkers/quarter"],
          credential: "Promotora de Campo Certificate (bilingual) — stackable toward CHW credential",
          eligibility: "All farmworker types — no immigration status check",
        },
        {
          name: "Community Garden Steward",
          stipend: "$300/quarter",
          description: "Community garden and backyard food producers who share knowledge and produce with neighbors in need.",
          requirements: ["Manage or support a community growing space", "Share harvest or knowledge with 5+ households/quarter"],
          credential: "Food Systems Community Leader Certificate",
          eligibility: "All types",
        },
      ],
      nfjpPathway: "National Farmworker Jobs Program (NFJP) — funded by USDOL — provides training stipends for career transitions. Ask your local workforce board about NFJP-funded training in your area.",
      source: "ThriveUp / TCAF Integration Through Invitation — ITI framework (2026)",
    });
  });
}
