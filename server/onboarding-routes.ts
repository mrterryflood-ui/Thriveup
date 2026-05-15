import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { db } from "./storage";
import {
  onboardingJourneyTemplates, onboardingPhases, onboardingMilestones,
  onboardingJourneys, onboardingMilestoneCompletions, serviceRecords,
  insertOnboardingJourneySchema,
  insertOnboardingMilestoneCompletionSchema,
  insertOnboardingBaselineSnapshotSchema,
} from "@shared/schema";
import { eq, sql, and, desc } from "drizzle-orm";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user?.claims?.sub) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

const JOURNEY_TEMPLATES = [
  {
    name: "Returning Citizen Onboarding",
    population: "returning_citizen",
    description: "Structured 30-day onboarding for individuals re-entering society after incarceration, focused on stability, workforce readiness, and community connection.",
    phases: [
      {
        weekNumber: 1, name: "Intake & Orientation", sortOrder: 1,
        description: "Complete enrollment paperwork, meet your case manager, and get oriented with available services and the platform.",
        milestones: [
          { title: "Complete Intake Assessment", description: "Fill out the full intake assessment with personal info, background, and goals.", milestoneType: "intake", featureLink: "/intake", serviceCategory: "Case Management", serviceHoursCredit: 1.5, sortOrder: 1, isRequired: true },
          { title: "Meet Your Case Manager", description: "Have your first one-on-one meeting with your assigned case manager.", milestoneType: "meeting", featureLink: null, serviceCategory: "Case Management", serviceHoursCredit: 1, sortOrder: 2, isRequired: true },
          { title: "Platform Tour & Account Setup", description: "Explore the ThriveUp platform and set up your account preferences.", milestoneType: "platform", featureLink: "/dashboard", serviceCategory: "Digital Literacy", serviceHoursCredit: 0.5, sortOrder: 3, isRequired: true },
          { title: "Sign Consent & Privacy Forms", description: "Review and sign required consent forms for data collection and service participation.", milestoneType: "consent", featureLink: "/intake", serviceCategory: "Case Management", serviceHoursCredit: 0.5, sortOrder: 4, isRequired: true },
          { title: "ID & Document Check", description: "Verify you have necessary identification documents; begin recovery process if needed.", milestoneType: "document", featureLink: null, serviceCategory: "Legal Aid", serviceHoursCredit: 1, sortOrder: 5, isRequired: false },
        ],
      },
      {
        weekNumber: 2, name: "Assessment & Goal Setting", sortOrder: 2,
        description: "Complete workforce and wellness assessments to establish your baseline and set SMART goals.",
        milestones: [
          { title: "Complete Workforce Assessment", description: "Take the workforce readiness assessment to identify skills, barriers, and career interests.", milestoneType: "assessment", featureLink: "/workforce-assessment", serviceCategory: "Workforce Development", serviceHoursCredit: 1.5, sortOrder: 1, isRequired: true },
          { title: "Complete Daily Check-In", description: "Do your first daily wellness check-in to establish emotional and wellness baseline.", milestoneType: "wellness", featureLink: "/academy/self-assessment", serviceCategory: "Mental Health", serviceHoursCredit: 0.5, sortOrder: 2, isRequired: true },
          { title: "Set Short-Term Goals", description: "Work with your case manager to set 3 achievable 30-day goals.", milestoneType: "goals", featureLink: null, serviceCategory: "Case Management", serviceHoursCredit: 1, sortOrder: 3, isRequired: true },
          { title: "Housing Stability Plan", description: "Develop or review your housing stability plan with your case manager.", milestoneType: "plan", featureLink: "/reentry", serviceCategory: "Housing", serviceHoursCredit: 1, sortOrder: 4, isRequired: true },
          { title: "Review Reentry Dashboard", description: "Explore your reentry dashboard and understand milestones ahead.", milestoneType: "platform", featureLink: "/reentry", serviceCategory: "Case Management", serviceHoursCredit: 0.5, sortOrder: 5, isRequired: false },
        ],
      },
      {
        weekNumber: 3, name: "Service Connection & Skill Building", sortOrder: 3,
        description: "Connect with partner organizations, start building skills, and begin engaging with support services.",
        milestones: [
          { title: "First AI Tool Usage", description: "Use the AI Creation Studio or Spark companion for the first time.", milestoneType: "ai_tool", featureLink: "/ai-tools", serviceCategory: "Digital Literacy", serviceHoursCredit: 0.5, sortOrder: 1, isRequired: true },
          { title: "Attend First Workshop/Training", description: "Attend your first workforce training session or partner workshop.", milestoneType: "training", featureLink: "/workforce-training", serviceCategory: "Workforce Development", serviceHoursCredit: 2, sortOrder: 2, isRequired: true },
          { title: "Connect with Community Partner", description: "Get referred to and make first contact with at least one community partner organization.", milestoneType: "partner", featureLink: "/partners", serviceCategory: "Community Support", serviceHoursCredit: 1, sortOrder: 3, isRequired: true },
          { title: "Complete Job Readiness Activity", description: "Work on resume, interview prep, or other job readiness activity.", milestoneType: "job_readiness", featureLink: "/workforce-employers", serviceCategory: "Workforce Development", serviceHoursCredit: 1.5, sortOrder: 4, isRequired: true },
          { title: "Explore Health & Wellness Resources", description: "Review available health and wellness resources through the platform.", milestoneType: "health", featureLink: "/health-wellness", serviceCategory: "Health Services", serviceHoursCredit: 0.5, sortOrder: 5, isRequired: false },
        ],
      },
      {
        weekNumber: 4, name: "Progress Review & Plan Forward", sortOrder: 4,
        description: "Review your progress, celebrate achievements, and create your ongoing service plan.",
        milestones: [
          { title: "30-Day Progress Review Meeting", description: "Meet with case manager to review progress on 30-day goals and milestones.", milestoneType: "meeting", featureLink: null, serviceCategory: "Case Management", serviceHoursCredit: 1.5, sortOrder: 1, isRequired: true },
          { title: "Retake Workforce Assessment", description: "Retake the workforce assessment to measure progress since intake.", milestoneType: "assessment", featureLink: "/workforce-assessment", serviceCategory: "Workforce Development", serviceHoursCredit: 1, sortOrder: 2, isRequired: true },
          { title: "Create Forward Service Plan", description: "Develop your ongoing service plan for the next 60-90 days.", milestoneType: "plan", featureLink: null, serviceCategory: "Case Management", serviceHoursCredit: 1, sortOrder: 3, isRequired: true },
          { title: "Complete Satisfaction Survey", description: "Share feedback on your first 30 days to help us improve the program.", milestoneType: "survey", featureLink: null, serviceCategory: "Program Evaluation", serviceHoursCredit: 0.5, sortOrder: 4, isRequired: true },
          { title: "Celebrate & Share Success", description: "Recognize your achievements and share your story (optional) to inspire others.", milestoneType: "celebration", featureLink: null, serviceCategory: "Community Support", serviceHoursCredit: 0.5, sortOrder: 5, isRequired: false },
        ],
      },
    ],
  },
  {
    name: "Youth Onboarding",
    population: "youth",
    description: "Structured 30-day onboarding for youth participants focused on education, mentorship, and career exploration.",
    phases: [
      {
        weekNumber: 1, name: "Intake & Orientation", sortOrder: 1,
        description: "Get signed up, meet your mentor, and explore the academy campus.",
        milestones: [
          { title: "Complete Intake Assessment", description: "Fill out the intake form with your parent/guardian.", milestoneType: "intake", featureLink: "/intake", serviceCategory: "Case Management", serviceHoursCredit: 1, sortOrder: 1, isRequired: true },
          { title: "Create Your Avatar", description: "Build your unique avatar in Panther Village.", milestoneType: "platform", featureLink: "/academy/avatar", serviceCategory: "Digital Literacy", serviceHoursCredit: 0.5, sortOrder: 2, isRequired: true },
          { title: "Take the Campus Tour", description: "Explore Panther Village and discover all the features available.", milestoneType: "platform", featureLink: "/academy", serviceCategory: "Orientation", serviceHoursCredit: 0.5, sortOrder: 3, isRequired: true },
          { title: "Meet Your Mentor", description: "Have your first meeting or video call with your assigned mentor.", milestoneType: "meeting", featureLink: "/academy/mentors", serviceCategory: "Mentoring", serviceHoursCredit: 1, sortOrder: 4, isRequired: true },
          { title: "Parent/Guardian Orientation", description: "Parent or guardian completes orientation and consent forms.", milestoneType: "consent", featureLink: "/parents", serviceCategory: "Family Engagement", serviceHoursCredit: 1, sortOrder: 5, isRequired: true },
        ],
      },
      {
        weekNumber: 2, name: "Assessment & Goal Setting", sortOrder: 2,
        description: "Discover your interests, set goals, and establish your learning baseline.",
        milestones: [
          { title: "Complete Career Interest Assessment", description: "Explore career fields and save ones that interest you.", milestoneType: "assessment", featureLink: "/academy/careers", serviceCategory: "Career Development", serviceHoursCredit: 1, sortOrder: 1, isRequired: true },
          { title: "First Daily Check-In", description: "Complete your first emotional wellness check-in.", milestoneType: "wellness", featureLink: "/academy/self-assessment", serviceCategory: "Mental Health", serviceHoursCredit: 0.5, sortOrder: 2, isRequired: true },
          { title: "Set My Dream Goals", description: "Use the Dream Design tool to set your academic and career goals.", milestoneType: "goals", featureLink: "/academy/dreams", serviceCategory: "Goal Setting", serviceHoursCredit: 1, sortOrder: 3, isRequired: true },
          { title: "Start First Curriculum Module", description: "Begin your first lesson in the AI Mastery Curriculum.", milestoneType: "curriculum", featureLink: "/curriculum", serviceCategory: "Education", serviceHoursCredit: 1, sortOrder: 4, isRequired: true },
          { title: "Join a House", description: "Get assigned to a house and learn about the house point system.", milestoneType: "platform", featureLink: "/academy/houses", serviceCategory: "Community Building", serviceHoursCredit: 0.5, sortOrder: 5, isRequired: false },
        ],
      },
      {
        weekNumber: 3, name: "Service Connection & Skill Building", sortOrder: 3,
        description: "Dive into learning, connect with peers, and start building real skills.",
        milestones: [
          { title: "Use AI Creation Studio", description: "Create your first project using an AI tool from the studio.", milestoneType: "ai_tool", featureLink: "/ai-tools", serviceCategory: "Digital Literacy", serviceHoursCredit: 1, sortOrder: 1, isRequired: true },
          { title: "Complete a Daily Quest", description: "Finish at least one daily quest to earn Panther Power points.", milestoneType: "quest", featureLink: "/academy/quests", serviceCategory: "Education", serviceHoursCredit: 0.5, sortOrder: 2, isRequired: true },
          { title: "Chat with Spark AI Companion", description: "Have a learning conversation with Spark about a topic that interests you.", milestoneType: "ai_tool", featureLink: "/ai-companion", serviceCategory: "Digital Literacy", serviceHoursCredit: 0.5, sortOrder: 3, isRequired: true },
          { title: "Attend Group Workshop", description: "Participate in a group workshop or training session.", milestoneType: "training", featureLink: null, serviceCategory: "Education", serviceHoursCredit: 1.5, sortOrder: 4, isRequired: true },
          { title: "Write First Journal Entry", description: "Reflect on your journey so far in your personal journal.", milestoneType: "reflection", featureLink: "/academy/journal", serviceCategory: "Mental Health", serviceHoursCredit: 0.5, sortOrder: 5, isRequired: false },
        ],
      },
      {
        weekNumber: 4, name: "Progress Review & Plan Forward", sortOrder: 4,
        description: "Review your growth, celebrate wins, and map out your next 30 days.",
        milestones: [
          { title: "30-Day Check-In with Mentor", description: "Meet with your mentor to review your first month progress.", milestoneType: "meeting", featureLink: null, serviceCategory: "Mentoring", serviceHoursCredit: 1, sortOrder: 1, isRequired: true },
          { title: "Review Progress Report", description: "Look at your progress report showing completed activities and scores.", milestoneType: "review", featureLink: "/academy/progress-report", serviceCategory: "Education", serviceHoursCredit: 0.5, sortOrder: 2, isRequired: true },
          { title: "Update Career Pathway", description: "Review and update your career pathway plan based on what you learned.", milestoneType: "plan", featureLink: "/academy/pathway", serviceCategory: "Career Development", serviceHoursCredit: 1, sortOrder: 3, isRequired: true },
          { title: "Share Your Story", description: "Create a short reflection about your first 30 days (optional sharing).", milestoneType: "reflection", featureLink: "/academy/journal", serviceCategory: "Communication", serviceHoursCredit: 0.5, sortOrder: 4, isRequired: true },
          { title: "Earn First Badge", description: "Achieve at least one badge through learning activities.", milestoneType: "achievement", featureLink: "/achievements", serviceCategory: "Education", serviceHoursCredit: 0.5, sortOrder: 5, isRequired: false },
        ],
      },
    ],
  },
  {
    name: "Veteran Onboarding",
    population: "veteran",
    description: "Structured 30-day onboarding for veterans transitioning to civilian life, focused on translating military skills, VA benefits, and career placement.",
    phases: [
      {
        weekNumber: 1, name: "Intake & Orientation", sortOrder: 1,
        description: "Complete enrollment, connect with veteran-specific resources, and get oriented.",
        milestones: [
          { title: "Complete Intake Assessment", description: "Complete the full intake assessment with military service details.", milestoneType: "intake", featureLink: "/intake", serviceCategory: "Case Management", serviceHoursCredit: 1.5, sortOrder: 1, isRequired: true },
          { title: "Meet Your Veteran Navigator", description: "Have your first meeting with your dedicated veteran services navigator.", milestoneType: "meeting", featureLink: null, serviceCategory: "Case Management", serviceHoursCredit: 1, sortOrder: 2, isRequired: true },
          { title: "Platform Tour & Setup", description: "Learn to navigate the ThriveUp platform and set up your profile.", milestoneType: "platform", featureLink: "/dashboard", serviceCategory: "Digital Literacy", serviceHoursCredit: 0.5, sortOrder: 3, isRequired: true },
          { title: "VA Benefits Review", description: "Review your current VA benefits status and identify any unclaimed benefits.", milestoneType: "benefits", featureLink: null, serviceCategory: "Benefits Navigation", serviceHoursCredit: 1.5, sortOrder: 4, isRequired: true },
          { title: "Complete Consent Forms", description: "Sign consent and information sharing authorization forms.", milestoneType: "consent", featureLink: "/intake", serviceCategory: "Case Management", serviceHoursCredit: 0.5, sortOrder: 5, isRequired: true },
        ],
      },
      {
        weekNumber: 2, name: "Assessment & Goal Setting", sortOrder: 2,
        description: "Assess your transferable skills, identify barriers, and set transition goals.",
        milestones: [
          { title: "Complete Workforce Assessment", description: "Take the workforce assessment with focus on translating military skills.", milestoneType: "assessment", featureLink: "/workforce-assessment", serviceCategory: "Workforce Development", serviceHoursCredit: 1.5, sortOrder: 1, isRequired: true },
          { title: "Military Skills Translation", description: "Work with navigator to translate your MOS/rating into civilian job equivalents.", milestoneType: "career", featureLink: "/academy/careers", serviceCategory: "Career Development", serviceHoursCredit: 1.5, sortOrder: 2, isRequired: true },
          { title: "Daily Wellness Check-In", description: "Complete your first wellness check-in (confidential, peer-designed).", milestoneType: "wellness", featureLink: "/academy/self-assessment", serviceCategory: "Mental Health", serviceHoursCredit: 0.5, sortOrder: 3, isRequired: true },
          { title: "Set Transition Goals", description: "Define your 30-day, 90-day, and 6-month transition goals.", milestoneType: "goals", featureLink: null, serviceCategory: "Case Management", serviceHoursCredit: 1, sortOrder: 4, isRequired: true },
          { title: "Connect with Veteran Mentor", description: "Get matched with a veteran mentor who has successfully transitioned.", milestoneType: "mentor", featureLink: "/academy/mentor-finder", serviceCategory: "Mentoring", serviceHoursCredit: 0.5, sortOrder: 5, isRequired: false },
        ],
      },
      {
        weekNumber: 3, name: "Service Connection & Skill Building", sortOrder: 3,
        description: "Begin training, connect with veteran-serving organizations, and build civilian credentials.",
        milestones: [
          { title: "Attend Training or Workshop", description: "Begin a certification course or attend a workforce development workshop.", milestoneType: "training", featureLink: "/workforce-training", serviceCategory: "Workforce Development", serviceHoursCredit: 2, sortOrder: 1, isRequired: true },
          { title: "Connect with VSO Partner", description: "Meet with a Veteran Service Organization partner for additional support.", milestoneType: "partner", featureLink: "/partners", serviceCategory: "Veteran Services", serviceHoursCredit: 1, sortOrder: 2, isRequired: true },
          { title: "Use AI Career Tools", description: "Use AI tools to build a resume or practice interview questions.", milestoneType: "ai_tool", featureLink: "/ai-tools", serviceCategory: "Digital Literacy", serviceHoursCredit: 1, sortOrder: 3, isRequired: true },
          { title: "Financial Planning Session", description: "Review your financial situation and create a budget/savings plan.", milestoneType: "financial", featureLink: "/academy/financial-literacy", serviceCategory: "Financial Coaching", serviceHoursCredit: 1.5, sortOrder: 4, isRequired: true },
          { title: "Health & Wellness Review", description: "Review health resources and connect with veteran-specific health services.", milestoneType: "health", featureLink: "/health-wellness", serviceCategory: "Health Services", serviceHoursCredit: 0.5, sortOrder: 5, isRequired: false },
        ],
      },
      {
        weekNumber: 4, name: "Progress Review & Plan Forward", sortOrder: 4,
        description: "Evaluate progress, adjust goals, and establish your ongoing transition support plan.",
        milestones: [
          { title: "30-Day Review with Navigator", description: "Comprehensive review of your first 30 days with your veteran navigator.", milestoneType: "meeting", featureLink: null, serviceCategory: "Case Management", serviceHoursCredit: 1.5, sortOrder: 1, isRequired: true },
          { title: "Retake Workforce Assessment", description: "Retake the workforce assessment to measure progress.", milestoneType: "assessment", featureLink: "/workforce-assessment", serviceCategory: "Workforce Development", serviceHoursCredit: 1, sortOrder: 2, isRequired: true },
          { title: "Ongoing Service Plan", description: "Create a sustained transition plan for the next 60-90 days.", milestoneType: "plan", featureLink: null, serviceCategory: "Case Management", serviceHoursCredit: 1, sortOrder: 3, isRequired: true },
          { title: "Feedback & Recommendations", description: "Complete program feedback survey and receive personalized recommendations.", milestoneType: "survey", featureLink: null, serviceCategory: "Program Evaluation", serviceHoursCredit: 0.5, sortOrder: 4, isRequired: true },
          { title: "Peer Connection", description: "Connect with a veteran peer support group or network.", milestoneType: "community", featureLink: "/community", serviceCategory: "Peer Support", serviceHoursCredit: 1, sortOrder: 5, isRequired: false },
        ],
      },
    ],
  },
];

async function seedOnboardingTemplates() {
  const existing = await db.select().from(onboardingJourneyTemplates);
  if (existing.length > 0) return;

  for (const template of JOURNEY_TEMPLATES) {
    const [t] = await db.insert(onboardingJourneyTemplates).values({
      name: template.name,
      population: template.population,
      description: template.description,
      totalDays: 30,
      isActive: true,
    }).returning();

    for (const phase of template.phases) {
      const [p] = await db.insert(onboardingPhases).values({
        templateId: t.id,
        weekNumber: phase.weekNumber,
        name: phase.name,
        description: phase.description,
        sortOrder: phase.sortOrder,
      }).returning();

      for (const milestone of phase.milestones) {
        await db.insert(onboardingMilestones).values({
          phaseId: p.id,
          templateId: t.id,
          title: milestone.title,
          description: milestone.description,
          milestoneType: milestone.milestoneType,
          featureLink: milestone.featureLink,
          serviceCategory: milestone.serviceCategory,
          serviceHoursCredit: milestone.serviceHoursCredit,
          sortOrder: milestone.sortOrder,
          isRequired: milestone.isRequired,
        });
      }
    }
  }
}

let seedingDone = false;
let seedingPromise: Promise<void> | null = null;

async function ensureSeeded() {
  if (seedingDone) return;
  if (!seedingPromise) seedingPromise = seedOnboardingTemplates().then(() => { seedingDone = true; });
  await seedingPromise;
}

export function registerOnboardingRoutes(app: Express) {
  ensureSeeded().catch(console.error);

  app.get("/api/onboarding/templates", async (_req: Request, res: Response) => {
    try {
      await ensureSeeded();
      const templates = await storage.getOnboardingTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/onboarding/templates/:id", async (req: Request, res: Response) => {
    try {
      const template = await storage.getOnboardingTemplate(req.params.id as string);
      if (!template) return res.status(404).json({ error: "Template not found" });
      const phases = await storage.getOnboardingPhases(template.id);
      const milestones = await storage.getOnboardingMilestones(template.id);
      res.json({ ...template, phases, milestones });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/onboarding/templates/population/:population", async (req: Request, res: Response) => {
    try {
      const templates = await storage.getOnboardingTemplates();
      const filtered = templates.filter(t => t.population === req.params.population as string);
      if (filtered.length === 0) return res.status(404).json({ error: "No template found for population" });
      const template = filtered[0];
      const phases = await storage.getOnboardingPhases(template.id);
      const milestones = await storage.getOnboardingMilestones(template.id);
      res.json({ ...template, phases, milestones });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/onboarding/journeys", requireAuth, async (req: Request, res: Response) => {
    try {
      const { participantId, templateId, participantName, population, userId } = req.body;
      if (!participantId || !templateId || !participantName || !population) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const existing = await storage.getOnboardingJourneyByParticipant(participantId);
      if (existing) return res.status(409).json({ error: "Journey already exists for this participant", journey: existing });

      const startDate = new Date().toISOString().split("T")[0];
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const journey = await storage.createOnboardingJourney({
        participantId,
        userId: userId || null,
        templateId,
        participantName,
        population,
        status: "active",
        currentPhaseWeek: 1,
        startDate,
        expectedEndDate: endDate,
      });
      res.status(201).json(journey);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/onboarding/journeys", async (_req: Request, res: Response) => {
    try {
      const journeys = await storage.getAllOnboardingJourneys();
      res.json(journeys);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/onboarding/journeys/:id", async (req: Request, res: Response) => {
    try {
      const journey = await storage.getOnboardingJourney(req.params.id as string);
      if (!journey) return res.status(404).json({ error: "Journey not found" });
      const template = await storage.getOnboardingTemplate(journey.templateId);
      const phases = template ? await storage.getOnboardingPhases(template.id) : [];
      const milestones = template ? await storage.getOnboardingMilestones(template.id) : [];
      const completions = await storage.getMilestoneCompletions(journey.id);
      const snapshots = await storage.getBaselineSnapshots(journey.id);
      res.json({ journey, template, phases, milestones, completions, snapshots });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/onboarding/journeys/participant/:participantId", async (req: Request, res: Response) => {
    try {
      const journey = await storage.getOnboardingJourneyByParticipant(req.params.participantId as string);
      if (!journey) return res.status(404).json({ error: "No journey found" });
      const template = await storage.getOnboardingTemplate(journey.templateId);
      const phases = template ? await storage.getOnboardingPhases(template.id) : [];
      const milestones = template ? await storage.getOnboardingMilestones(template.id) : [];
      const completions = await storage.getMilestoneCompletions(journey.id);
      res.json({ journey, template, phases, milestones, completions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/onboarding/journeys/:journeyId/milestones/:milestoneId/complete", requireAuth, async (req: Request, res: Response) => {
    try {
      const { journeyId, milestoneId } = req.params as Record<string, string>;
      const { completedBy, completedByName, notes } = req.body;

      const journey = await storage.getOnboardingJourney(journeyId);
      if (!journey) return res.status(404).json({ error: "Journey not found" });

      const existingCompletions = await storage.getMilestoneCompletions(journeyId);
      const alreadyCompleted = existingCompletions.find(c => c.milestoneId === milestoneId);
      if (alreadyCompleted) return res.status(409).json({ error: "Milestone already completed", completion: alreadyCompleted });

      const allMilestones = await storage.getOnboardingMilestones(journey.templateId);
      const milestone = allMilestones.find(m => m.id === milestoneId);
      if (!milestone) return res.status(404).json({ error: "Milestone not found" });

      let serviceRecordId: string | undefined;
      if (milestone.serviceHoursCredit && milestone.serviceHoursCredit > 0) {
        try {
          const [sr] = await db.insert(serviceRecords).values({
            participantId: journey.participantId,
            serviceCategory: milestone.serviceCategory || "Onboarding",
            serviceType: `Onboarding: ${milestone.title}`,
            providerName: completedByName || "System",
            serviceDate: new Date().toISOString().split("T")[0],
            durationMinutes: Math.round((milestone.serviceHoursCredit || 0) * 60),
            notes: `30-Day Onboarding milestone: ${milestone.title}`,
            outcome: "completed",
            status: "completed",
          }).returning();
          serviceRecordId = sr.id;
        } catch (e) {
          console.error("Failed to create service record for milestone:", e);
        }
      }

      const completion = await storage.createMilestoneCompletion({
        journeyId,
        milestoneId,
        participantId: journey.participantId,
        completedBy: completedBy || null,
        completedByName: completedByName || null,
        notes: notes || null,
        serviceRecordId: serviceRecordId || null,
      });

      const updatedCompletions = [...existingCompletions, completion];
      const phases = await storage.getOnboardingPhases(journey.templateId);
      let highestCompletedWeek = 1;
      for (const phase of phases) {
        const phaseMilestones = allMilestones.filter(m => m.phaseId === phase.id && m.isRequired);
        const phaseCompleted = phaseMilestones.every(m => updatedCompletions.some(c => c.milestoneId === m.id));
        if (phaseCompleted) highestCompletedWeek = Math.max(highestCompletedWeek, phase.weekNumber + 1);
      }

      const requiredMilestones = allMilestones.filter(m => m.isRequired);
      const allRequiredDone = requiredMilestones.every(m => updatedCompletions.some(c => c.milestoneId === m.id));

      if (allRequiredDone && journey.status !== "completed") {
        await storage.updateOnboardingJourney(journeyId, { status: "completed", completedAt: new Date(), currentPhaseWeek: 5 });
      } else if (highestCompletedWeek !== journey.currentPhaseWeek) {
        await storage.updateOnboardingJourney(journeyId, { currentPhaseWeek: Math.min(highestCompletedWeek, 4) });
      }

      res.status(201).json(completion);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/onboarding/journeys/:journeyId/baseline-snapshot", requireAuth, async (req: Request, res: Response) => {
    try {
      const { journeyId } = req.params as Record<string, string>;
      const journey = await storage.getOnboardingJourney(journeyId);
      if (!journey) return res.status(404).json({ error: "Journey not found" });

      const completions = await storage.getMilestoneCompletions(journeyId);
      const milestones = await storage.getOnboardingMilestones(journey.templateId);
      const completedCount = completions.length;
      const totalCount = milestones.length;
      const requiredCount = milestones.filter(m => m.isRequired).length;
      const requiredCompleted = milestones.filter(m => m.isRequired).filter(m => completions.some(c => c.milestoneId === m.id)).length;

      let totalServiceHours = 0;
      for (const c of completions) {
        const m = milestones.find(ms => ms.id === c.milestoneId);
        if (m?.serviceHoursCredit) totalServiceHours += m.serviceHoursCredit;
      }

      const snapshot = await storage.createBaselineSnapshot({
        journeyId,
        participantId: journey.participantId,
        snapshotType: "30_day",
        thriveScores: req.body.thriveScores || null,
        workforceAssessment: req.body.workforceAssessment || null,
        selfAssessmentAverages: req.body.selfAssessmentAverages || null,
        milestonesSummary: { completedCount, totalCount, requiredCount, requiredCompleted },
        totalServiceHours,
        notes: req.body.notes || null,
      });

      res.status(201).json(snapshot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/onboarding/cohort-progress", async (_req: Request, res: Response) => {
    try {
      const journeys = await storage.getAllOnboardingJourneys();
      const result = [];

      for (const journey of journeys) {
        const completions = await storage.getMilestoneCompletions(journey.id);
        const milestones = await storage.getOnboardingMilestones(journey.templateId);
        const totalRequired = milestones.filter(m => m.isRequired).length;
        const completedRequired = milestones.filter(m => m.isRequired).filter(m => completions.some(c => c.milestoneId === m.id)).length;

        const startDate = new Date(journey.startDate);
        const today = new Date();
        const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        result.push({
          journeyId: journey.id,
          participantId: journey.participantId,
          participantName: journey.participantName,
          population: journey.population,
          status: journey.status,
          currentPhaseWeek: journey.currentPhaseWeek,
          startDate: journey.startDate,
          expectedEndDate: journey.expectedEndDate,
          daysElapsed,
          totalMilestones: milestones.length,
          completedMilestones: completions.length,
          totalRequired,
          completedRequired,
          progressPercent: totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0,
          completedAt: journey.completedAt,
        });
      }

      const templates = await storage.getOnboardingTemplates();
      const milestoneStats: Record<string, { milestoneId: string; title: string; totalParticipants: number; completedCount: number }> = {};

      for (const template of templates) {
        const milestones = await storage.getOnboardingMilestones(template.id);
        const templateJourneys = journeys.filter(j => j.templateId === template.id);
        for (const m of milestones) {
          let completed = 0;
          for (const j of templateJourneys) {
            const completions = await storage.getMilestoneCompletions(j.id);
            if (completions.some(c => c.milestoneId === m.id)) completed++;
          }
          milestoneStats[m.id] = {
            milestoneId: m.id,
            title: m.title,
            totalParticipants: templateJourneys.length,
            completedCount: completed,
          };
        }
      }

      res.json({ participants: result, milestoneStats: Object.values(milestoneStats) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/onboarding/journeys/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const journey = await storage.getOnboardingJourney(req.params.id as string);
      if (!journey) return res.status(404).json({ error: "Journey not found" });
      const allowedFields = ["status", "currentPhaseWeek", "notes"] as const;
      const sanitized: Record<string, any> = {};
      for (const key of allowedFields) {
        if (key in req.body) sanitized[key] = req.body[key];
      }
      if (Object.keys(sanitized).length === 0) return res.status(400).json({ error: "No valid fields to update" });
      const updated = await storage.updateOnboardingJourney(req.params.id as string, sanitized);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
