import type { Express, Request, Response } from "express";
import { db } from "./storage";
import {
  parentEducationModules, parentEducationProgress, familyAssessments,
  insertParentEducationModuleSchema, insertParentEducationProgressSchema,
} from "@shared/schema";
import { eq, desc, and, count } from "drizzle-orm";
import { z } from "zod";
import { storage } from "./storage";
import { generateAIJSON } from "./ai-provider";

const familyAssessmentRequestSchema = z.object({
  riskResponses: z.record(z.string(), z.number().int().min(0).max(3)),
  protectiveResponses: z.record(z.string(), z.number().int().min(0).max(3)),
});

function getUserId(req: Request): string | undefined {
  const u = (req as unknown as Record<string, unknown>).user as { claims?: { sub?: string }; id?: string } | undefined;
  return u?.claims?.sub || u?.id;
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!getUserId(req)) return res.status(401).json({ error: "Unauthorized" });
  next();
}

async function requireAdmin(req: Request, res: Response, next: Function) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Authentication required" });
  try {
    const user = await storage.getUser(userId);
    if (user?.role === "admin" || user?.role === "teacher" || user?.role === "case_manager") return next();
  } catch (e) { console.error("Admin check error:", e); }
  return res.status(403).json({ error: "Admin access required" });
}

const FAMILY_RISK_QUESTIONS = [
  { id: "fr-1", domain: "parental_attitudes", text: "How clearly have you communicated your expectations about substance use to your child?", options: ["Very Clearly", "Somewhat Clearly", "Not Very Clearly", "Not at All"], scores: [0, 1, 2, 3] },
  { id: "fr-2", domain: "family_conflict", text: "How often does your family experience significant conflict or stress?", options: ["Rarely", "Sometimes", "Often", "Very Often"], scores: [0, 1, 2, 3] },
  { id: "fr-3", domain: "substance_history", text: "Has anyone in your household had challenges with alcohol or substance use?", options: ["No", "In the past", "Not sure", "Currently"], scores: [0, 1, 2, 3] },
  { id: "fr-4", domain: "supervision", text: "How well do you know where your child is and who they are with after school?", options: ["Always know", "Usually know", "Sometimes know", "Rarely know"], scores: [0, 1, 2, 3] },
  { id: "fr-5", domain: "community_risk", text: "How accessible are drugs or alcohol to youth in your neighborhood?", options: ["Very Difficult", "Somewhat Difficult", "Somewhat Easy", "Very Easy"], scores: [0, 1, 2, 3] },
  { id: "fr-6", domain: "peer_influence", text: "Are you aware of your child's friends using substances?", options: ["No, none", "Not sure", "Maybe a few", "Yes, several"], scores: [0, 1, 2, 3] },
];

const FAMILY_PROTECTIVE_QUESTIONS = [
  { id: "fp-1", domain: "family_bonding", text: "How often does your family eat meals together?", options: ["Daily", "Several times a week", "Occasionally", "Rarely"], scores: [3, 2, 1, 0] },
  { id: "fp-2", domain: "communication", text: "How comfortable is your child talking to you about difficult topics?", options: ["Very Comfortable", "Comfortable", "Somewhat Uncomfortable", "Very Uncomfortable"], scores: [3, 2, 1, 0] },
  { id: "fp-3", domain: "school_engagement", text: "How involved are you in your child's school activities and homework?", options: ["Very Involved", "Involved", "Somewhat Involved", "Not Involved"], scores: [3, 2, 1, 0] },
  { id: "fp-4", domain: "prosocial_activities", text: "Does your child participate in organized activities (sports, clubs, faith groups)?", options: ["Multiple activities", "One activity", "Occasionally", "None"], scores: [3, 2, 1, 0] },
  { id: "fp-5", domain: "adult_mentors", text: "Does your child have trusted adults outside the family they can talk to?", options: ["Several", "One or two", "Maybe one", "None"], scores: [3, 2, 1, 0] },
  { id: "fp-6", domain: "family_rules", text: "Does your family have clear rules and consistent consequences?", options: ["Very Clear", "Clear", "Somewhat Clear", "Not Clear"], scores: [3, 2, 1, 0] },
];

function generateFamilyRecommendations(riskScore: number, protectiveScore: number, maxRisk: number, maxProtective: number): string[] {
  const riskPct = (riskScore / maxRisk) * 100;
  const protPct = (protectiveScore / maxProtective) * 100;
  const recs: string[] = [];

  if (riskPct >= 50) {
    recs.push("Consider family counseling or a family strengthening program in your community");
    recs.push("Start regular one-on-one conversations with your child about substance use");
    recs.push("Review the Substance Prevention modules for concrete talking strategies");
  } else if (riskPct >= 25) {
    recs.push("Keep building open communication about substances and peer pressure");
    recs.push("Explore community activities to strengthen your child's protective network");
  } else {
    recs.push("Your family has low risk factors - continue your positive approaches");
  }

  if (protPct < 50) {
    recs.push("Focus on increasing family bonding activities like shared meals and outings");
    recs.push("Help your child find at least one organized activity or mentorship program");
    recs.push("Establish clear family rules about substance use and online safety");
  } else {
    recs.push("Strong protective factors! Share your family strategies with other parents");
  }

  recs.push("Visit SAMHSA's Family Guide at samhsa.gov for additional resources");
  return recs;
}


export function registerParentEducationRoutes(app: Express) {

  app.get("/api/parent-education/modules", async (req, res) => {
    try {
      const { category } = req.query;
      const conditions = [eq(parentEducationModules.isActive, true)];
      if (category && typeof category === "string") {
        conditions.push(eq(parentEducationModules.category, category));
      }
      const modules = await db.select().from(parentEducationModules)
        .where(and(...conditions))
        .orderBy(parentEducationModules.orderIndex);
      res.json(modules);
    } catch (error) {
      console.error("Failed to fetch parent education modules:", error);
      res.status(500).json({ error: "Failed to fetch modules" });
    }
  });

  app.get("/api/parent-education/modules/:id", async (req, res) => {
    try {
      const [mod] = await db.select().from(parentEducationModules)
        .where(eq(parentEducationModules.id, String(req.params.id)));
      if (!mod) return res.status(404).json({ error: "Module not found" });
      res.json(mod);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch module" });
    }
  });

  app.post("/api/parent-education/modules", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertParentEducationModuleSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [mod] = await db.insert(parentEducationModules).values(parsed.data).returning();
      res.json(mod);
    } catch (error) {
      res.status(500).json({ error: "Failed to create module" });
    }
  });

  app.patch("/api/parent-education/modules/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertParentEducationModuleSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      const [updated] = await db.update(parentEducationModules)
        .set(parsed.data)
        .where(eq(parentEducationModules.id, String(req.params.id)))
        .returning();
      if (!updated) return res.status(404).json({ error: "Module not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update module" });
    }
  });

  app.delete("/api/parent-education/modules/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [deleted] = await db.delete(parentEducationModules)
        .where(eq(parentEducationModules.id, String(req.params.id)))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Module not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete module" });
    }
  });

  app.get("/api/parent-education/progress", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const progress = await db.select().from(parentEducationProgress)
        .where(eq(parentEducationProgress.visitorId, userId));
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.post("/api/parent-education/progress", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const parsed = insertParentEducationProgressSchema.safeParse({ ...req.body, visitorId: userId });
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });

      const existing = await db.select().from(parentEducationProgress).where(
        and(eq(parentEducationProgress.visitorId, userId), eq(parentEducationProgress.moduleId, String(parsed.data.moduleId)))
      );

      if (existing.length > 0) {
        const [updated] = await db.update(parentEducationProgress)
          .set({ status: parsed.data.status, completedAt: parsed.data.status === "completed" ? new Date() : null })
          .where(eq(parentEducationProgress.id, existing[0].id))
          .returning();
        return res.json(updated);
      }

      const [progress] = await db.insert(parentEducationProgress).values(parsed.data).returning();
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to update progress" });
    }
  });

  app.get("/api/parent-education/family-assessments", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const assessments = await db.select().from(familyAssessments)
        .where(eq(familyAssessments.visitorId, userId))
        .orderBy(desc(familyAssessments.completedAt));
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch family assessments" });
    }
  });

  app.post("/api/parent-education/family-assessments", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const parsed = familyAssessmentRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten().fieldErrors });
      }
      const { riskResponses, protectiveResponses } = parsed.data;

      let riskScore = 0;
      for (const q of FAMILY_RISK_QUESTIONS) {
        const answer = riskResponses[q.id];
        if (typeof answer === "number" && answer >= 0 && answer < q.scores.length) {
          riskScore += q.scores[answer];
        }
      }

      let protectiveScore = 0;
      for (const q of FAMILY_PROTECTIVE_QUESTIONS) {
        const answer = protectiveResponses[q.id];
        if (typeof answer === "number" && answer >= 0 && answer < q.scores.length) {
          protectiveScore += q.scores[answer];
        }
      }

      const maxRisk = FAMILY_RISK_QUESTIONS.length * 3;
      const maxProtective = FAMILY_PROTECTIVE_QUESTIONS.length * 3;
      const recommendations = generateFamilyRecommendations(riskScore, protectiveScore, maxRisk, maxProtective);

      const [assessment] = await db.insert(familyAssessments).values({
        visitorId: userId,
        familyRiskFactors: riskResponses,
        familyProtectiveFactors: protectiveResponses,
        riskScore,
        protectiveScore,
        recommendations,
      }).returning();

      res.json(assessment);
    } catch (error) {
      console.error("Failed to submit family assessment:", error);
      res.status(500).json({ error: "Failed to submit family assessment" });
    }
  });

  app.get("/api/parent-education/family-questions", (_req, res) => {
    res.json({ risk: FAMILY_RISK_QUESTIONS, protective: FAMILY_PROTECTIVE_QUESTIONS });
  });

  app.post("/api/parent-education/conversation-starters", requireAuth, async (req, res) => {
    try {
      const { topic, childAge, ageBand } = req.body;
      if (!topic) return res.status(400).json({ error: "topic is required" });

      const band = ageBand || (childAge ? (parseInt(childAge) <= 14 ? "10-14" : "15-18") : "10-14");
      const bandLabel = band === "10-14" ? "ages 10-14 (pre-teens/early teens)" : "ages 15-18 (older teens)";
      const ageContext = childAge ? `The child is ${childAge} years old (${bandLabel}).` : `The child is in the ${bandLabel} age group.`;

      const result = await generateAIJSON<{ starters: Array<{ opener: string; explanation: string; followUp: string; ageBand: string }> }>(
        `Generate 4 conversation starters for a parent who wants to talk to their child about "${topic}". ${ageContext} Each starter must be specifically tailored for the ${bandLabel} developmental stage. Younger children (10-14) need simpler language, concrete examples, and more reassurance. Older teens (15-18) can handle more direct discussion, autonomy-respecting language, and peer-focused framing. Each starter should have an opener (the exact phrase to say), an explanation of why it works for this age group, a follow-up question, and ageBand ("${band}"). Return JSON: { "starters": [{ "opener": "...", "explanation": "...", "followUp": "...", "ageBand": "${band}" }] }`,
        "You are a family counselor specializing in youth substance prevention and family strengthening. Generate age-band-appropriate, culturally sensitive conversation starters that build trust and open dialogue. Tailor language complexity and approach to the specific age band."
      );

      res.json(result);
    } catch (error) {
      console.error("Failed to generate conversation starters:", error);
      const band = req.body?.ageBand || "10-14";
      const fallbackStarters = band === "15-18" ? [
        { opener: "I read something about fentanyl in counterfeit pills. I'm not trying to lecture — I just want to make sure you know how to stay safe.", explanation: "Teens respond better when you respect their autonomy while showing genuine concern.", followUp: "Do your friends ever talk about stuff like this? What's the general attitude?", ageBand: "15-18" },
        { opener: "I know you're getting older and making more of your own choices. I respect that. I just want us to be honest with each other.", explanation: "Acknowledging their growing independence builds trust and keeps the door open.", followUp: "Is there anything you've wanted to ask me but felt weird about?", ageBand: "15-18" },
        { opener: "What's your take on vaping? I keep hearing different things and I'm curious what you actually think.", explanation: "Asking their opinion first shows respect and gives you insight into their perspective.", followUp: "Have you ever felt pressured to try something you weren't sure about?", ageBand: "15-18" },
        { opener: "If you or a friend were ever in a bad situation — no judgment, no punishment — I want you to call me. Deal?", explanation: "A safety agreement builds trust and gives them a practical escape plan.", followUp: "What would make it easier for you to reach out if you needed help?", ageBand: "15-18" },
      ] : [
        { opener: "I've been learning about how to keep our family safe and healthy. Can we talk about it?", explanation: "Opening with your own learning shows vulnerability and models curiosity for younger children.", followUp: "What have you heard about drugs or alcohol at school?", ageBand: "10-14" },
        { opener: "I want you to know you can always come to me, no matter what. What's something on your mind lately?", explanation: "Unconditional support creates a safe space — especially important for pre-teens finding their voice.", followUp: "Is there anything you've been worried about that you haven't told me?", ageBand: "10-14" },
        { opener: "I saw something on TV about vaping. Do you know what that is? What do kids at school say about it?", explanation: "Using media and asking about peers feels less confrontational for younger children.", followUp: "If someone offered you something you weren't sure about, what would you do?", ageBand: "10-14" },
        { opener: "Let's make a family deal — if you're ever somewhere that feels unsafe, you can call me and I'll come get you, no questions asked.", explanation: "A safety agreement gives younger children a concrete action plan they can rely on.", followUp: "Can you think of a situation where you might need to use our deal?", ageBand: "10-14" },
      ];
      res.json({ starters: fallbackStarters });
    }
  });

  app.get("/api/parent-education/dashboard", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const totalModules = await db.select({ count: count() }).from(parentEducationModules).where(eq(parentEducationModules.isActive, true));
      const userProgress = await db.select({ count: count() }).from(parentEducationProgress)
        .where(and(eq(parentEducationProgress.visitorId, userId), eq(parentEducationProgress.status, "completed")));
      const userAssessments = await db.select({ count: count() }).from(familyAssessments)
        .where(eq(familyAssessments.visitorId, userId));

      res.json({
        totalModules: totalModules[0]?.count || 0,
        completedModules: userProgress[0]?.count || 0,
        totalAssessments: userAssessments[0]?.count || 0,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });
}

interface ContentSection {
  _meta?: boolean;
  title: string;
  titleEs?: string;
  content: string;
  contentEs?: string;
  descriptionEs?: string;
}

interface SeedModule {
  id: string;
  title: string;
  titleEs?: string;
  description: string;
  descriptionEs?: string;
  category: string;
  targetAudience: string;
  orderIndex: number;
  isActive: boolean;
  contentSections: ContentSection[];
}

async function updateExistingModulesWithBilingualContent(allModules: Array<{ id: string; contentSections: ContentSection[] }>) {
  for (const mod of allModules) {
    const existing = await db.select().from(parentEducationModules).where(eq(parentEducationModules.id, mod.id));
    if (existing.length > 0) {
      const currentSections = Array.isArray(existing[0].contentSections) ? existing[0].contentSections as ContentSection[] : [];
      const hasMeta = currentSections.some((s) => s._meta);
      if (!hasMeta) {
        await db.update(parentEducationModules)
          .set({ contentSections: mod.contentSections })
          .where(eq(parentEducationModules.id, mod.id));
      }
    }
  }
}

export async function seedParentEducationData() {
  const existing = await db.select().from(parentEducationModules);

  const preventionModules = [
    {
      id: "pe-prev-1",
      title: "Understanding Youth Substance Use",
      titleEs: "Entendiendo el Uso de Sustancias en Jovenes",
      description: "Learn the warning signs, risk factors, and how to recognize when your child may be exposed to substances.",
      descriptionEs: "Aprenda las senales de advertencia, factores de riesgo y como reconocer cuando su hijo puede estar expuesto a sustancias.",
      category: "substance_prevention",
      targetAudience: "Parents of youth ages 10-24",
      orderIndex: 1,
      isActive: true,
      contentSections: [
        { title: "Why This Matters", titleEs: "Por Que Esto Importa", content: "Youth substance use is a growing concern. Early education helps parents recognize risk factors before they escalate.", contentEs: "El uso de sustancias juvenil es una preocupacion creciente. La educacion temprana ayuda a los padres a reconocer factores de riesgo." },
        { title: "Warning Signs", titleEs: "Senales de Advertencia", content: "Changes in behavior, friend groups, academic performance, sleep patterns, and physical appearance can all indicate substance exposure.", contentEs: "Cambios en el comportamiento, grupos de amigos, rendimiento academico y apariencia fisica pueden indicar exposicion a sustancias." },
        { title: "Risk Factors", titleEs: "Factores de Riesgo", content: "Family history, peer pressure, community access, lack of supervision, and mental health challenges increase vulnerability.", contentEs: "Historial familiar, presion de companeros, acceso comunitario y desafios de salud mental aumentan la vulnerabilidad." },
        { title: "What You Can Do", titleEs: "Que Puede Hacer", content: "Open communication, clear expectations, monitoring, and building strong family bonds are your most powerful tools.", contentEs: "Comunicacion abierta, expectativas claras, monitoreo y vinculos familiares fuertes son sus herramientas mas poderosas." },
      ],
    },
    {
      id: "pe-prev-2",
      title: "Talking to Your Child About Alcohol",
      titleEs: "Hablando con Su Hijo Sobre el Alcohol",
      description: "Age-appropriate strategies for discussing alcohol use, its effects, and setting family expectations.",
      descriptionEs: "Estrategias apropiadas para la edad para discutir el uso de alcohol y establecer expectativas familiares.",
      category: "substance_prevention",
      targetAudience: "Parents of youth ages 10-18",
      orderIndex: 2,
      isActive: true,
      contentSections: [
        { title: "Start Early", titleEs: "Comience Temprano", content: "Children form attitudes about alcohol by age 9-13. Starting conversations early establishes your family's values.", contentEs: "Los ninos forman actitudes sobre el alcohol entre los 9-13 anos. Comenzar conversaciones temprano establece los valores familiares." },
        { title: "Facts to Share", titleEs: "Datos Para Compartir", content: "Alcohol affects the developing brain, impairs judgment, and is the most commonly used substance among teens.", contentEs: "El alcohol afecta el cerebro en desarrollo, deteriora el juicio y es la sustancia mas comun entre adolescentes." },
        { title: "Conversation Strategies", titleEs: "Estrategias de Conversacion", content: "Use media moments, ask open-ended questions, share your family values without lecturing, and listen more than you talk.", contentEs: "Use momentos de medios, haga preguntas abiertas, comparta valores familiares sin dar sermones y escuche mas de lo que habla." },
        { title: "Setting Expectations", titleEs: "Estableciendo Expectativas", content: "Clear, consistent rules about alcohol use - with explained reasons - are more effective than fear-based messaging.", contentEs: "Reglas claras y consistentes sobre el alcohol - con razones explicadas - son mas efectivas que mensajes basados en el miedo." },
      ],
    },
    {
      id: "pe-prev-3",
      title: "Vaping, Cannabis & New Threats",
      titleEs: "Vapeo, Cannabis y Nuevas Amenazas",
      description: "Stay informed about the latest substances youth are exposed to including vaping, cannabis, and fentanyl.",
      descriptionEs: "Mantengase informado sobre las sustancias mas recientes a las que los jovenes estan expuestos.",
      category: "substance_prevention",
      targetAudience: "Parents of youth ages 12-24",
      orderIndex: 3,
      isActive: true,
      contentSections: [
        { title: "The Vaping Crisis", titleEs: "La Crisis del Vapeo", content: "E-cigarettes and vapes are marketed to youth with appealing flavors. Nicotine is highly addictive and damages developing lungs.", contentEs: "Los cigarrillos electronicos se comercializan a jovenes con sabores atractivos. La nicotina es altamente adictiva." },
        { title: "Cannabis Facts", titleEs: "Datos Sobre Cannabis", content: "Marijuana potency has increased dramatically. Regular use during adolescence can affect brain development and academic performance.", contentEs: "La potencia de la marihuana ha aumentado dramaticamente. El uso regular durante la adolescencia afecta el desarrollo cerebral." },
        { title: "The Fentanyl Danger", titleEs: "El Peligro del Fentanilo", content: "Fentanyl is now found in counterfeit pills and other substances. Even tiny amounts can be lethal. Awareness saves lives.", contentEs: "El fentanilo se encuentra en pastillas falsificadas. Cantidades pequenas pueden ser letales. La conciencia salva vidas." },
        { title: "Staying Current", titleEs: "Manteniendose Actualizado", content: "Follow NIDA and CDC resources to stay informed about emerging drug trends affecting youth.", contentEs: "Siga los recursos de NIDA y CDC para mantenerse informado sobre tendencias emergentes de drogas." },
      ],
    },
    {
      id: "pe-prev-4",
      title: "Peer Pressure & Social Media Influence",
      titleEs: "Presion de Companeros e Influencia de Redes Sociales",
      description: "Help your child navigate peer pressure and recognize substance marketing in social media.",
      descriptionEs: "Ayude a su hijo a navegar la presion de companeros y reconocer el marketing de sustancias en redes sociales.",
      category: "substance_prevention",
      targetAudience: "Parents of youth ages 10-18",
      orderIndex: 4,
      isActive: true,
      contentSections: [
        { title: "Understanding Peer Pressure", titleEs: "Entendiendo la Presion de Companeros", content: "Peer pressure can be direct (offers) or indirect (social norms). Help your child recognize both types.", contentEs: "La presion puede ser directa (ofertas) o indirecta (normas sociales). Ayude a su hijo a reconocer ambos tipos." },
        { title: "Social Media Risks", titleEs: "Riesgos de Redes Sociales", content: "Substance use is often glamorized on social media. Teach media literacy to help your child critically evaluate content.", contentEs: "El uso de sustancias se glamoriza en redes sociales. Ensene alfabetizacion mediatica." },
        { title: "Building Refusal Skills", titleEs: "Construyendo Habilidades de Rechazo", content: "Practice saying no with your child. Role-play scenarios so they have ready responses when pressured.", contentEs: "Practique decir no con su hijo. Simule escenarios para que tengan respuestas listas." },
        { title: "Positive Peer Networks", titleEs: "Redes Positivas de Companeros", content: "Encourage friendships with peers who make healthy choices. Organized activities build natural protective networks.", contentEs: "Fomente amistades con companeros que tomen decisiones saludables." },
      ],
    },
    {
      id: "pe-prev-5",
      title: "Prescription Drug Safety at Home",
      titleEs: "Seguridad de Medicamentos Recetados en el Hogar",
      description: "Secure medications, educate your family, and prevent prescription drug misuse.",
      descriptionEs: "Asegure medicamentos, eduque a su familia y prevenga el mal uso de medicamentos recetados.",
      category: "substance_prevention",
      targetAudience: "All parents and guardians",
      orderIndex: 5,
      isActive: true,
      contentSections: [
        { title: "Secure Your Medications", titleEs: "Asegure Sus Medicamentos", content: "Lock up or safely store all prescription medications. Track pill counts and dispose of unused medications properly.", contentEs: "Guarde bajo llave todos los medicamentos recetados. Cuente las pastillas y deseche los no utilizados." },
        { title: "Educate Your Family", titleEs: "Eduque a Su Familia", content: "Explain that prescription drugs are only safe when used as prescribed by a doctor for the person they were prescribed to.", contentEs: "Explique que los medicamentos recetados solo son seguros cuando se usan segun lo prescrito por un medico." },
        { title: "Disposal Resources", titleEs: "Recursos de Eliminacion", content: "Use DEA Take-Back events or pharmacy disposal programs to safely get rid of unused medications.", contentEs: "Use eventos de devolucion de la DEA o programas de eliminacion en farmacias." },
        { title: "Warning Signs", titleEs: "Senales de Advertencia", content: "Missing medications, unusual pill bottles, and changes in behavior may indicate prescription drug misuse.", contentEs: "Medicamentos faltantes, frascos inusuales y cambios de comportamiento pueden indicar mal uso." },
      ],
    },
    {
      id: "pe-prev-6",
      title: "Building Healthy Coping Skills as a Family",
      titleEs: "Construyendo Habilidades de Afrontamiento Saludables en Familia",
      description: "Teach your family positive alternatives to stress and emotional challenges.",
      descriptionEs: "Ensene a su familia alternativas positivas al estres y desafios emocionales.",
      category: "substance_prevention",
      targetAudience: "All family members",
      orderIndex: 6,
      isActive: true,
      contentSections: [
        { title: "Why Coping Skills Matter", titleEs: "Por Que Importan las Habilidades de Afrontamiento", content: "Youth who lack healthy coping strategies are more likely to turn to substances when stressed or upset.", contentEs: "Los jovenes sin estrategias saludables de afrontamiento son mas propensos a recurrir a sustancias." },
        { title: "Family Coping Activities", titleEs: "Actividades Familiares de Afrontamiento", content: "Exercise together, practice deep breathing, engage in creative activities, and establish routines that reduce stress.", contentEs: "Hagan ejercicio juntos, practiquen respiracion profunda y establezcan rutinas que reduzcan el estres." },
        { title: "Emotional Check-Ins", titleEs: "Chequeos Emocionales", content: "Create a family habit of checking in about emotions. Normalize talking about feelings without judgment.", contentEs: "Creen el habito familiar de hablar sobre emociones. Normalicen hablar de sentimientos sin juicio." },
        { title: "When to Seek Help", titleEs: "Cuando Buscar Ayuda", content: "If your child shows persistent anxiety, depression, or behavioral changes, connect with a school counselor or mental health professional.", contentEs: "Si su hijo muestra ansiedad persistente, depresion o cambios de comportamiento, conecte con un consejero escolar." },
      ],
    },
    {
      id: "pe-prev-7",
      title: "Creating a Prevention Action Plan",
      titleEs: "Creando un Plan de Accion de Prevencion",
      description: "Develop a personalized family plan for substance prevention and healthy decision-making.",
      descriptionEs: "Desarrolle un plan familiar personalizado para la prevencion de sustancias y la toma de decisiones saludables.",
      category: "substance_prevention",
      targetAudience: "All parents and guardians",
      orderIndex: 7,
      isActive: true,
      contentSections: [
        { title: "Assess Your Family", titleEs: "Evalue a Su Familia", content: "Use the Family Assessment tool to identify your family's risk and protective factors.", contentEs: "Use la herramienta de Evaluacion Familiar para identificar los factores de riesgo y proteccion de su familia." },
        { title: "Set Family Goals", titleEs: "Establezca Metas Familiares", content: "Choose 2-3 specific actions your family will take this month to strengthen prevention efforts.", contentEs: "Elija 2-3 acciones especificas que su familia tomara este mes para fortalecer los esfuerzos de prevencion." },
        { title: "Build Your Network", titleEs: "Construya Su Red", content: "Connect with other parents, school counselors, community resources, and mentorship programs.", contentEs: "Conecte con otros padres, consejeros escolares, recursos comunitarios y programas de mentoria." },
        { title: "Review and Adjust", titleEs: "Revise y Ajuste", content: "Revisit your plan monthly. Celebrate progress and adjust strategies as your child grows and situations change.", contentEs: "Revise su plan mensualmente. Celebre el progreso y ajuste estrategias." },
      ],
    },
  ];

  const strengtheningModules = [
    {
      id: "pe-fam-1",
      title: "Strengthening Family Communication",
      titleEs: "Fortaleciendo la Comunicacion Familiar",
      description: "Build deeper, more honest communication patterns that create trust and connection.",
      descriptionEs: "Construya patrones de comunicacion mas profundos y honestos que creen confianza y conexion.",
      category: "family_strengthening",
      targetAudience: "All families",
      orderIndex: 8,
      isActive: true,
      contentSections: [
        { title: "Active Listening", titleEs: "Escucha Activa", content: "Put down devices, make eye contact, and reflect back what you hear. Let your child finish speaking before responding.", contentEs: "Deje los dispositivos, haga contacto visual y refleje lo que escucha. Deje que su hijo termine de hablar." },
        { title: "I-Statements", titleEs: "Declaraciones Yo", content: "Replace 'You always...' with 'I feel... when...' to reduce defensiveness and open genuine dialogue.", contentEs: "Reemplace 'Tu siempre...' con 'Yo siento... cuando...' para reducir la defensividad." },
        { title: "Family Meetings", titleEs: "Reuniones Familiares", content: "Hold regular family meetings to discuss schedules, concerns, and celebrations. Give everyone a voice.", contentEs: "Realice reuniones familiares regulares. Dele voz a todos." },
        { title: "Digital Communication", titleEs: "Comunicacion Digital", content: "Establish healthy texting and social media habits. Be available for digital check-ins throughout the day.", contentEs: "Establezca habitos saludables de mensajes y redes sociales." },
      ],
    },
    {
      id: "pe-fam-2",
      title: "Positive Discipline & Boundaries",
      titleEs: "Disciplina Positiva y Limites",
      description: "Set clear, consistent boundaries while maintaining a warm and supportive relationship.",
      descriptionEs: "Establezca limites claros y consistentes mientras mantiene una relacion calida y de apoyo.",
      category: "family_strengthening",
      targetAudience: "Parents of youth ages 10-18",
      orderIndex: 9,
      isActive: true,
      contentSections: [
        { title: "Clear Expectations", titleEs: "Expectativas Claras", content: "State rules clearly, explain the reasons behind them, and ensure your child understands the consequences.", contentEs: "Establezca reglas claramente, explique las razones y asegurese de que su hijo entienda las consecuencias." },
        { title: "Consistent Follow-Through", titleEs: "Seguimiento Consistente", content: "Enforce consequences fairly and consistently. Inconsistency undermines trust and authority.", contentEs: "Aplique consecuencias justa y consistentemente. La inconsistencia socava la confianza." },
        { title: "Natural Consequences", titleEs: "Consecuencias Naturales", content: "When safe, allow children to experience natural consequences of their choices as learning opportunities.", contentEs: "Cuando sea seguro, permita que los ninos experimenten consecuencias naturales como oportunidades de aprendizaje." },
        { title: "Repair After Conflict", titleEs: "Reparar Despues del Conflicto", content: "After disagreements, reconnect. Acknowledge your own mistakes and model how to repair relationships.", contentEs: "Despues de desacuerdos, reconecte. Reconozca sus errores y modele como reparar relaciones." },
      ],
    },
    {
      id: "pe-fam-3",
      title: "Building Family Resilience",
      titleEs: "Construyendo Resiliencia Familiar",
      description: "Develop family strengths that help you navigate challenges and bounce back from adversity.",
      descriptionEs: "Desarrolle fortalezas familiares que les ayuden a navegar desafios y recuperarse de la adversidad.",
      category: "family_strengthening",
      targetAudience: "All families",
      orderIndex: 10,
      isActive: true,
      contentSections: [
        { title: "Family Identity", titleEs: "Identidad Familiar", content: "Create shared traditions, stories, and values that give your family a sense of purpose and belonging.", contentEs: "Cree tradiciones, historias y valores compartidos que den a su familia un sentido de proposito." },
        { title: "Problem-Solving Together", titleEs: "Resolviendo Problemas Juntos", content: "Face challenges as a team. Involve children in age-appropriate problem-solving to build confidence.", contentEs: "Enfrenten desafios en equipo. Involucre a los ninos en la resolucion de problemas." },
        { title: "Support Networks", titleEs: "Redes de Apoyo", content: "Maintain connections with extended family, neighbors, faith communities, and parent groups.", contentEs: "Mantenga conexiones con familia extendida, vecinos, comunidades de fe y grupos de padres." },
        { title: "Self-Care for Parents", titleEs: "Autocuidado para Padres", content: "You cannot pour from an empty cup. Prioritize your own mental health and well-being.", contentEs: "No puede dar de una taza vacia. Priorice su salud mental y bienestar." },
      ],
    },
    {
      id: "pe-fam-4",
      title: "Cultural Strengths & Family Heritage",
      titleEs: "Fortalezas Culturales y Herencia Familiar",
      description: "Leverage your family's cultural traditions and heritage as protective factors.",
      descriptionEs: "Aproveche las tradiciones culturales y la herencia de su familia como factores protectores.",
      category: "family_strengthening",
      targetAudience: "All families",
      orderIndex: 11,
      isActive: true,
      contentSections: [
        { title: "Cultural Identity", titleEs: "Identidad Cultural", content: "A strong cultural identity is a powerful protective factor. Share your family's history, language, and traditions.", contentEs: "Una identidad cultural fuerte es un poderoso factor protector. Comparta la historia y tradiciones de su familia." },
        { title: "Intergenerational Wisdom", titleEs: "Sabiduria Intergeneracional", content: "Connect children with elders and extended family to pass down wisdom, values, and coping strategies.", contentEs: "Conecte a los ninos con los mayores para transmitir sabiduria, valores y estrategias de afrontamiento." },
        { title: "Community Belonging", titleEs: "Pertenencia Comunitaria", content: "Participate in cultural community events and organizations that reinforce positive identity and belonging.", contentEs: "Participe en eventos culturales comunitarios que refuercen la identidad positiva." },
        { title: "Navigating Two Worlds", titleEs: "Navegando Dos Mundos", content: "Help children integrate their cultural heritage with their school and peer environments with pride and confidence.", contentEs: "Ayude a los ninos a integrar su herencia cultural con su entorno escolar con orgullo y confianza." },
      ],
    },
    {
      id: "pe-fam-5",
      title: "Supporting Your Child's Mental Health",
      titleEs: "Apoyando la Salud Mental de Su Hijo",
      description: "Recognize mental health needs and create a supportive home environment.",
      descriptionEs: "Reconozca las necesidades de salud mental y cree un ambiente hogare\u00f1o de apoyo.",
      category: "family_strengthening",
      targetAudience: "All parents and guardians",
      orderIndex: 12,
      isActive: true,
      contentSections: [
        { title: "Recognizing Signs", titleEs: "Reconociendo Senales", content: "Persistent sadness, withdrawal, anger, sleep changes, or academic decline may signal mental health concerns.", contentEs: "Tristeza persistente, aislamiento, enojo, cambios de sueno o deterioro academico pueden indicar problemas de salud mental." },
        { title: "Creating Safety", titleEs: "Creando Seguridad", content: "Make your home a safe space for emotional expression. Validate feelings without minimizing or dismissing them.", contentEs: "Haga de su hogar un espacio seguro para la expresion emocional. Valide los sentimientos sin minimizarlos." },
        { title: "Professional Resources", titleEs: "Recursos Profesionales", content: "Know your school counselor, community mental health resources, and crisis hotlines (988 Suicide & Crisis Lifeline).", contentEs: "Conozca su consejero escolar, recursos comunitarios de salud mental y lineas de crisis (988)." },
        { title: "Reducing Stigma", titleEs: "Reduciendo el Estigma", content: "Talk openly about mental health. Seeking help is a sign of strength, not weakness.", contentEs: "Hable abiertamente sobre salud mental. Buscar ayuda es una senal de fortaleza, no de debilidad." },
      ],
    },
    {
      id: "pe-fam-6",
      title: "Parent Self-Care & Wellness",
      titleEs: "Autocuidado y Bienestar para Padres",
      description: "Prioritize your own well-being to be a stronger, more present parent.",
      descriptionEs: "Priorice su propio bienestar para ser un padre mas fuerte y presente.",
      category: "family_strengthening",
      targetAudience: "All parents and guardians",
      orderIndex: 13,
      isActive: true,
      contentSections: [
        { title: "Stress Management", titleEs: "Manejo del Estres", content: "Identify your stress triggers and develop healthy coping strategies like exercise, journaling, or mindfulness.", contentEs: "Identifique sus desencadenantes de estres y desarrolle estrategias saludables de afrontamiento." },
        { title: "Setting Boundaries", titleEs: "Estableciendo Limites", content: "It's okay to say no. Protecting your time and energy is essential for effective parenting.", contentEs: "Esta bien decir no. Proteger su tiempo y energia es esencial para la crianza efectiva." },
        { title: "Building Your Support Network", titleEs: "Construyendo Su Red de Apoyo", content: "Connect with other parents, support groups, and community resources. You don't have to do this alone.", contentEs: "Conecte con otros padres, grupos de apoyo y recursos comunitarios. No tiene que hacerlo solo." },
        { title: "Modeling Wellness", titleEs: "Modelando el Bienestar", content: "When your child sees you taking care of yourself, they learn that self-care is important and healthy.", contentEs: "Cuando su hijo lo ve cuidandose, aprende que el autocuidado es importante y saludable." },
      ],
    },
    {
      id: "pe-fam-7",
      title: "Co-Parenting Communication",
      titleEs: "Comunicación de Co-Crianza",
      description: "Build healthy communication patterns between co-parents to create stability for your children.",
      descriptionEs: "Construya patrones de comunicación saludables entre co-padres para crear estabilidad para sus hijos.",
      category: "family_strengthening",
      targetAudience: "Co-parents and blended families",
      orderIndex: 14,
      isActive: true,
      contentSections: [
        { title: "Putting Children First", titleEs: "Poniendo a los Niños Primero", content: "Keep communication focused on your children's needs. Use 'we' language when discussing parenting decisions.", contentEs: "Mantenga la comunicación enfocada en las necesidades de sus hijos. Use lenguaje 'nosotros' al discutir decisiones de crianza." },
        { title: "Healthy Boundaries", titleEs: "Límites Saludables", content: "Establish clear communication channels. Use text or email for logistics, save emotional discussions for private moments away from children.", contentEs: "Establezca canales de comunicación claros. Use texto o correo para logística, guarde las discusiones emocionales para momentos privados." },
        { title: "Consistency Across Homes", titleEs: "Consistencia Entre Hogares", content: "Agree on key rules, bedtimes, and expectations. Children thrive when both homes share similar boundaries.", contentEs: "Acuerden reglas clave, horarios y expectativas. Los niños prosperan cuando ambos hogares comparten límites similares." },
        { title: "Conflict Resolution for Co-Parents", titleEs: "Resolución de Conflictos para Co-Padres", content: "When disagreements arise, use 'I feel' statements, take cooling-off periods, and consider mediation. Never put children in the middle.", contentEs: "Cuando surjan desacuerdos, use declaraciones 'Yo siento', tómese periodos de enfriamiento y considere la mediación." },
      ],
    },
    {
      id: "pe-fam-8",
      title: "Rebuilding Family Bonds After Separation",
      titleEs: "Reconstruyendo Vínculos Familiares Después de la Separación",
      description: "Strategies for reconnecting with your children after incarceration, deployment, or extended separation.",
      descriptionEs: "Estrategias para reconectarse con sus hijos después de encarcelamiento, despliegue o separación prolongada.",
      category: "family_strengthening",
      targetAudience: "Returning parents and guardians",
      orderIndex: 15,
      isActive: true,
      contentSections: [
        { title: "Patience and Realistic Expectations", titleEs: "Paciencia y Expectativas Realistas", content: "Reunification takes time. Children may feel confused, angry, or distant. Allow them to set the pace of reconnection.", contentEs: "La reunificación toma tiempo. Los niños pueden sentirse confundidos, enojados o distantes. Permítales establecer el ritmo." },
        { title: "Rebuilding Trust", titleEs: "Reconstruyendo la Confianza", content: "Show up consistently. Keep promises, even small ones. Trust is rebuilt through repeated reliable actions, not grand gestures.", contentEs: "Preséntese consistentemente. Cumpla promesas, incluso pequeñas. La confianza se reconstruye con acciones confiables repetidas." },
        { title: "Age-Appropriate Conversations", titleEs: "Conversaciones Apropiadas para la Edad", content: "Be honest about where you've been using age-appropriate language. Children cope better when they understand the situation.", contentEs: "Sea honesto sobre dónde ha estado usando lenguaje apropiado para la edad. Los niños manejan mejor cuando entienden la situación." },
        { title: "Professional Support", titleEs: "Apoyo Profesional", content: "Family counseling, reentry programs, and support groups can guide the reunification process. You don't have to navigate this alone.", contentEs: "Consejería familiar, programas de reingreso y grupos de apoyo pueden guiar el proceso. No tiene que navegarlo solo." },
      ],
    },
    {
      id: "pe-fam-9",
      title: "Family Meetings & Conflict Resolution",
      titleEs: "Reuniones Familiares y Resolución de Conflictos",
      description: "Structure productive family meetings and teach conflict resolution skills to the whole family.",
      descriptionEs: "Estructure reuniones familiares productivas y enseñe habilidades de resolución de conflictos a toda la familia.",
      category: "family_strengthening",
      targetAudience: "All families",
      orderIndex: 16,
      isActive: true,
      contentSections: [
        { title: "Setting Up Family Meetings", titleEs: "Organizando Reuniones Familiares", content: "Choose a regular time. Set ground rules: everyone speaks, no interrupting, decisions by consensus. Keep meetings short (15-30 minutes).", contentEs: "Elija un horario regular. Establezca reglas: todos hablan, sin interrupciones, decisiones por consenso. Mantenga reuniones cortas." },
        { title: "Agenda and Structure", titleEs: "Agenda y Estructura", content: "Start with appreciations (what went well this week). Discuss old business, raise new concerns, plan activities. End on a positive note.", contentEs: "Comience con agradecimientos (qué salió bien esta semana). Discuta asuntos pendientes, nuevas preocupaciones, y planifique actividades." },
        { title: "Teaching Conflict Resolution", titleEs: "Enseñando Resolución de Conflictos", content: "Model the process: identify the problem, share feelings, brainstorm solutions, agree on a plan, follow up. Practice with small disagreements first.", contentEs: "Modele el proceso: identifique el problema, comparta sentimientos, genere soluciones, acuerden un plan, y haga seguimiento." },
        { title: "When Conflict Escalates", titleEs: "Cuando el Conflicto Escala", content: "Use a family signal for 'time out.' Everyone takes a break, calms down, then returns to discuss. Teach that stepping away is strength, not weakness.", contentEs: "Use una señal familiar para 'tiempo fuera.' Todos toman un descanso, se calman y regresan. Enseñe que alejarse es fortaleza." },
      ],
    },
  ];

  const allModules = ([...preventionModules, ...strengtheningModules] as SeedModule[]).map(m => {
    const { titleEs, descriptionEs, id, title, description, category, targetAudience, orderIndex, isActive, contentSections } = m;
    const sections: ContentSection[] = [...contentSections];
    if (titleEs || descriptionEs) {
      sections.unshift({ _meta: true, title: "", content: "", titleEs: titleEs || "", descriptionEs: descriptionEs || "" });
    }
    return { id, title, description, category, targetAudience, orderIndex, isActive, contentSections: sections };
  });

  if (existing.length > 0) {
    await updateExistingModulesWithBilingualContent(allModules);
    const existingIds = new Set(existing.map(e => e.id));
    const newModules = allModules.filter(m => !existingIds.has(m.id));
    if (newModules.length > 0) {
      await db.insert(parentEducationModules).values(newModules);
    }
  } else {
    await db.insert(parentEducationModules).values(allModules);
  }
}
