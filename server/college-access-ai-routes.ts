import type { Express, Request, Response } from "express";
import { collaborativeResponse } from "./collaborative-ai";

function getUserId(req: Request): string | undefined {
  const u = (req as unknown as Record<string, unknown>).user as { claims?: { sub?: string }; id?: string } | undefined;
  return u?.claims?.sub || u?.id;
}

// Per-IP rate limiter for public AI advisor endpoints.
// These routes fan out into multiple paid model calls per request, so the
// limit is intentionally stricter than the translation endpoint (10/min vs 30/min).
// IP is read from req.ip — Express resolves this via the trusted reverse proxy
// (trust proxy = 1 set in replitAuth.ts) so the value cannot be forged by a
// caller-supplied X-Forwarded-For header.
const AI_ADVISOR_RATE_LIMIT = 10; // requests per minute per IP
const aiAdvisorLimits = new Map<string, { count: number; resetAt: number }>();

// Purge expired entries every 5 minutes to bound memory growth under
// high-IP churn (e.g., scanning traffic with rotating addresses).
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of aiAdvisorLimits) {
    if (entry.resetAt < now) aiAdvisorLimits.delete(key);
  }
}, 5 * 60_000).unref();

function checkAIAdvisorRateLimit(req: Request, route: string): boolean {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  const entry = aiAdvisorLimits.get(ip);
  if (!entry || entry.resetAt < now) {
    aiAdvisorLimits.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= AI_ADVISOR_RATE_LIMIT) {
    console.warn(`[AI Advisor] 429 rate-limit hit — route=${route} ip=${ip}`);
    return false;
  }
  entry.count++;
  return true;
}

export const FAFSA_SYSTEM_PROMPT = `You are the ThriveUp FAFSA AI Advisor — an expert financial aid counselor integrated into a 24-platform workforce development ecosystem. You specialize in:
- FAFSA application guidance and troubleshooting
- Federal, state, and institutional financial aid programs
- Pell Grant eligibility and optimization
- Work-study programs and scholarship strategies
- Special circumstances and dependency override procedures
- Texas-specific aid programs (TEXAS Grant, TEG, Top 10% Scholarship)
- Aid strategies for first-generation college students
- Income bracket-specific recommendations
Provide clear, actionable guidance. Use plain language to explain complex FAFSA concepts. Always ground advice in current federal financial aid regulations.`;

const APPRENTICESHIP_SYSTEM_PROMPT = `You are the ThriveUp AI Career Coach — an expert workforce development advisor integrated into a 24-platform ecosystem. You specialize in:
- Registered Apprenticeship programs (DOL and state)
- Competency-based progression frameworks
- Career pathway mapping across 12+ industries
- Skills gap analysis and learning plan development
- WIOA Title I Youth program alignment
- Industry-recognized credential pathways
- Labor market data interpretation
- Career progression forecasting
- Texas Workforce Commission programs and resources
Provide specific, data-informed career guidance. Map current skills to target occupations using O*NET and BLS data. Always include concrete next steps.`;

const OPPORTUNITY_YOUTH_SYSTEM_PROMPT = `You are the ThriveUp AI Community Analyst — an expert in opportunity youth re-engagement integrated into a 24-platform ecosystem. You specialize in:
- Disconnected youth identification and outreach strategies
- Barrier profile analysis (housing, justice-involvement, mental health, family instability)
- WIOA Title I Youth program design for ages 16-24
- Trauma-informed re-engagement approaches
- Community needs assessment and asset mapping
- Grant-ready narrative development using real community data
- Evidence-based dropout prevention and recovery strategies
- Texas-specific youth workforce programs
- SDOH (Social Determinants of Health) impact analysis
Provide data-driven, culturally responsive analysis. Use census tract-level data when available. Always connect strategies to measurable outcomes.`;

const TRANSITION_SYSTEM_PROMPT = `You are the ThriveUp AI Transition Advisor — an expert in youth and adult transition planning integrated into a 24-platform ecosystem. You specialize in:
- Individualized Transition Plans (ITP) development
- Post-secondary readiness assessment
- IDEA transition requirements (ages 16-21)
- College and career readiness indicators
- Support service coordination across agencies
- Risk factor identification and mitigation
- Self-determination skill building
- Community resource mapping for transition support
- Texas transition planning requirements and timelines
- Employment readiness and independent living skills assessment
Provide personalized, strengths-based transition planning. Predict readiness gaps and recommend specific interventions. Always include timeline-based action plans.`;

export function registerCollegeAccessAIRoutes(app: Express) {

  app.post("/api/fafsa/ai-advisor", async (req: Request, res: Response) => {
    try {
      if (!checkAIAdvisorRateLimit(req, "/api/fafsa/ai-advisor")) {
        return res.status(429).json({ error: "Rate limit exceeded. Try again in a minute." });
      }
      const { question, studentProfile } = req.body;
      if (!question || typeof question !== "string") {
        return res.status(400).json({ error: "A 'question' field is required" });
      }

      let contextBlock = "";
      if (studentProfile) {
        const parts: string[] = [];
        if (studentProfile.incomeBracket) parts.push(`Income Bracket: ${studentProfile.incomeBracket}`);
        if (studentProfile.county) parts.push(`County: ${studentProfile.county}`);
        if (studentProfile.firstGen !== undefined) parts.push(`First-Generation Student: ${studentProfile.firstGen ? "Yes" : "No"}`);
        if (studentProfile.schoolType) parts.push(`School Type: ${studentProfile.schoolType}`);
        if (studentProfile.age) parts.push(`Age: ${studentProfile.age}`);
        if (studentProfile.dependencyStatus) parts.push(`Dependency Status: ${studentProfile.dependencyStatus}`);
        if (studentProfile.gpa) parts.push(`GPA: ${studentProfile.gpa}`);
        if (studentProfile.enrollmentStatus) parts.push(`Enrollment: ${studentProfile.enrollmentStatus}`);
        if (parts.length > 0) {
          contextBlock = `\n\nSTUDENT CONTEXT:\n${parts.join("\n")}`;
        }
      }

      const prompt = `${question}${contextBlock}`;

      const result = await collaborativeResponse(prompt, {
        systemPrompt: FAFSA_SYSTEM_PROMPT,
        maxTokens: 3000,
        includeRAG: true,
        includeRPLICE: true,
        includeMAPGAP: true,
        topic: "FAFSA financial aid college access",
      });

      res.json({
        answer: result.synthesis,
        engines: result.engines.map(e => ({
          engine: e.engine,
          model: e.model,
          responseTimeMs: e.responseTimeMs,
          hasResponse: !!e.response && e.response.length > 20,
          error: e.error,
        })),
        ragContext: result.ragContext,
        frameworks: result.frameworks,
        consensusMethod: result.consensusMethod,
        totalTimeMs: result.totalTimeMs,
      });
    } catch (error: any) {
      console.error("[FAFSA AI Advisor] Error:", error);
      res.status(500).json({ error: error.message || "AI advisor failed" });
    }
  });

  app.post("/api/apprenticeship/ai-coach", async (req: Request, res: Response) => {
    try {
      if (!checkAIAdvisorRateLimit(req, "/api/apprenticeship/ai-coach")) {
        return res.status(429).json({ error: "Rate limit exceeded. Try again in a minute." });
      }
      const { question, skills, targetOccupation, currentRole } = req.body;
      if (!question || typeof question !== "string") {
        return res.status(400).json({ error: "A 'question' field is required" });
      }

      let contextBlock = "";
      const parts: string[] = [];
      if (skills && Array.isArray(skills)) parts.push(`Current Skills: ${skills.join(", ")}`);
      if (targetOccupation) parts.push(`Target Occupation: ${targetOccupation}`);
      if (currentRole) parts.push(`Current Role: ${currentRole}`);
      if (parts.length > 0) {
        contextBlock = `\n\nPARTICIPANT CONTEXT:\n${parts.join("\n")}`;
      }

      const prompt = `${question}${contextBlock}`;

      const result = await collaborativeResponse(prompt, {
        systemPrompt: APPRENTICESHIP_SYSTEM_PROMPT,
        maxTokens: 3000,
        includeRAG: true,
        includeRPLICE: true,
        includeMAPGAP: true,
        topic: "apprenticeship career pathway workforce development",
      });

      res.json({
        answer: result.synthesis,
        engines: result.engines.map(e => ({
          engine: e.engine,
          model: e.model,
          responseTimeMs: e.responseTimeMs,
          hasResponse: !!e.response && e.response.length > 20,
          error: e.error,
        })),
        ragContext: result.ragContext,
        frameworks: result.frameworks,
        consensusMethod: result.consensusMethod,
        totalTimeMs: result.totalTimeMs,
      });
    } catch (error: any) {
      console.error("[Apprenticeship AI Coach] Error:", error);
      res.status(500).json({ error: error.message || "AI coach failed" });
    }
  });

  app.post("/api/opportunity-youth/ai-analyst", async (req: Request, res: Response) => {
    try {
      if (!checkAIAdvisorRateLimit(req, "/api/opportunity-youth/ai-analyst")) {
        return res.status(429).json({ error: "Rate limit exceeded. Try again in a minute." });
      }
      const { question, barrierProfile, demographics, county } = req.body;
      if (!question || typeof question !== "string") {
        return res.status(400).json({ error: "A 'question' field is required" });
      }

      let contextBlock = "";
      const parts: string[] = [];
      if (barrierProfile && Array.isArray(barrierProfile)) parts.push(`Barrier Profile: ${barrierProfile.join(", ")}`);
      if (demographics) {
        if (demographics.ageRange) parts.push(`Age Range: ${demographics.ageRange}`);
        if (demographics.race) parts.push(`Race/Ethnicity: ${demographics.race}`);
        if (demographics.gender) parts.push(`Gender: ${demographics.gender}`);
        if (demographics.educationLevel) parts.push(`Education Level: ${demographics.educationLevel}`);
      }
      if (county) parts.push(`County: ${county}`);
      if (parts.length > 0) {
        contextBlock = `\n\nCOMMUNITY CONTEXT:\n${parts.join("\n")}`;
      }

      const prompt = `${question}${contextBlock}`;

      const result = await collaborativeResponse(prompt, {
        systemPrompt: OPPORTUNITY_YOUTH_SYSTEM_PROMPT,
        maxTokens: 3000,
        includeRAG: true,
        includeRPLICE: true,
        includeMAPGAP: true,
        topic: "opportunity youth disconnected re-engagement community",
      });

      res.json({
        answer: result.synthesis,
        engines: result.engines.map(e => ({
          engine: e.engine,
          model: e.model,
          responseTimeMs: e.responseTimeMs,
          hasResponse: !!e.response && e.response.length > 20,
          error: e.error,
        })),
        ragContext: result.ragContext,
        frameworks: result.frameworks,
        consensusMethod: result.consensusMethod,
        totalTimeMs: result.totalTimeMs,
      });
    } catch (error: any) {
      console.error("[Opportunity Youth AI Analyst] Error:", error);
      res.status(500).json({ error: error.message || "AI analyst failed" });
    }
  });

  app.post("/api/transition/ai-advisor", async (req: Request, res: Response) => {
    try {
      if (!checkAIAdvisorRateLimit(req, "/api/transition/ai-advisor")) {
        return res.status(429).json({ error: "Rate limit exceeded. Try again in a minute." });
      }
      const { question, studentProfile } = req.body;
      if (!question || typeof question !== "string") {
        return res.status(400).json({ error: "A 'question' field is required" });
      }

      let contextBlock = "";
      if (studentProfile) {
        const parts: string[] = [];
        if (studentProfile.age) parts.push(`Age: ${studentProfile.age}`);
        if (studentProfile.gradeLevel) parts.push(`Grade Level: ${studentProfile.gradeLevel}`);
        if (studentProfile.disabilityCategory) parts.push(`Disability Category: ${studentProfile.disabilityCategory}`);
        if (studentProfile.postSecondaryGoal) parts.push(`Post-Secondary Goal: ${studentProfile.postSecondaryGoal}`);
        if (studentProfile.employmentGoal) parts.push(`Employment Goal: ${studentProfile.employmentGoal}`);
        if (studentProfile.independentLivingGoal) parts.push(`Independent Living Goal: ${studentProfile.independentLivingGoal}`);
        if (studentProfile.currentServices && Array.isArray(studentProfile.currentServices)) {
          parts.push(`Current Services: ${studentProfile.currentServices.join(", ")}`);
        }
        if (studentProfile.strengths && Array.isArray(studentProfile.strengths)) {
          parts.push(`Strengths: ${studentProfile.strengths.join(", ")}`);
        }
        if (studentProfile.barriers && Array.isArray(studentProfile.barriers)) {
          parts.push(`Barriers: ${studentProfile.barriers.join(", ")}`);
        }
        if (parts.length > 0) {
          contextBlock = `\n\nSTUDENT PROFILE:\n${parts.join("\n")}`;
        }
      }

      const prompt = `${question}${contextBlock}`;

      const result = await collaborativeResponse(prompt, {
        systemPrompt: TRANSITION_SYSTEM_PROMPT,
        maxTokens: 3000,
        includeRAG: true,
        includeRPLICE: true,
        includeMAPGAP: true,
        topic: "transition plan ITP post-secondary readiness",
      });

      res.json({
        answer: result.synthesis,
        engines: result.engines.map(e => ({
          engine: e.engine,
          model: e.model,
          responseTimeMs: e.responseTimeMs,
          hasResponse: !!e.response && e.response.length > 20,
          error: e.error,
        })),
        ragContext: result.ragContext,
        frameworks: result.frameworks,
        consensusMethod: result.consensusMethod,
        totalTimeMs: result.totalTimeMs,
      });
    } catch (error: any) {
      console.error("[Transition AI Advisor] Error:", error);
      res.status(500).json({ error: error.message || "AI advisor failed" });
    }
  });
}
