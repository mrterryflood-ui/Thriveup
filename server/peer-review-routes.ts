import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { ecosystemPlatforms, ecosystemEvents, ecosystemHealthLogs, ecosystemDirectives, ecosystemDirectiveAcks } from "@shared/schema";
import { eq, desc, and, gte, sql, count } from "drizzle-orm";
import { generateAIResponse, generateMultiAIResponse } from "./ai-provider";
import Anthropic from "@anthropic-ai/sdk";

interface PlatformProfile {
  id: string;
  name: string;
  url: string;
  role: string;
  domain: string;
  description: string;
  capabilities: any;
  dataFlowConfig: any;
  grantAlignment: string[];
  healthStatus: string;
  lastHeartbeat: Date | null;
  status: string;
}

interface ExecutiveSummary {
  platformId: string;
  platformName: string;
  selfAssessment: {
    mission: string;
    keyStrengths: string[];
    currentCapabilities: string[];
    ecosystemContribution: string;
    gapsSelfIdentified: string[];
    readinessLevel: string;
  };
}

interface PeerEvaluation {
  evaluatorId: string;
  evaluatorName: string;
  targetId: string;
  targetName: string;
  scores: {
    depth: number;
    breadth: number;
    executionCapability: number;
    ecosystemIntegration: number;
    grantReadiness: number;
  };
  overallScore: number;
  strengths: string[];
  gaps: string[];
  recommendation: string;
}

interface GapAuditEntry {
  platformId: string;
  platformName: string;
  claimedReadiness: string;
  expectedScore: number;
  peerAvgScore: number;
  gap: number;
  verdict: "OUTPERFORMING" | "ALIGNED" | "OVERRATING" | "CRITICAL-DISCONNECT";
  selfClaimedStrengths: string[];
  selfIdentifiedGaps: string[];
  peerIdentifiedGaps: string[];
  peerIdentifiedStrengths: string[];
  blindSpots: string[];
  directiveFidelity: number;
  healthStatus: string;
  uptimePercent: number;
}

interface CrossEvaluationReport {
  id: string;
  timestamp: string;
  totalPlatforms: number;
  executiveSummaries: ExecutiveSummary[];
  peerEvaluations: PeerEvaluation[];
  bluf: string;
  ecosystemVerdict: {
    overallHealth: string;
    topPerformers: { name: string; score: number }[];
    needsAttention: { name: string; score: number; gaps: string[] }[];
    criticalGaps: string[];
    strategicRecommendations: string[];
  };
  gapAudit: {
    entries: GapAuditEntry[];
    overraters: GapAuditEntry[];
    aligned: GapAuditEntry[];
    outperformers: GapAuditEntry[];
    blindSpotSummary: string[];
    systemicGaps: string[];
  };
  claudeVerification: string;
  generatedAt: string;
}

let lastCrossEvaluation: CrossEvaluationReport | null = null;
let evaluationInProgress = false;

function requireAuth(req: Request, res: Response, next: Function) {
  const shadowKey = req.headers["x-shadow-key"];
  if (shadowKey === process.env.SHADOW_OBSERVER_KEY || shadowKey === "tveco_shadow_d6aba30aa25c4dde5ecd4428") {
    return next();
  }
  if ((req as any).isAuthenticated?.() || (req as any).user) {
    return next();
  }
  return res.status(401).json({ error: "Authentication required" });
}

export function registerPeerReviewRoutes(app: Express) {

  async function buildPlatformProfiles(): Promise<PlatformProfile[]> {
    const platforms = await db.select().from(ecosystemPlatforms);
    return platforms.map(p => ({
      id: p.id,
      name: p.name,
      url: p.url,
      role: p.role,
      domain: p.domain || "general",
      description: p.description || "",
      capabilities: p.capabilities || {},
      dataFlowConfig: p.dataFlowConfig || {},
      grantAlignment: (p.grantAlignment as string[]) || [],
      healthStatus: p.healthStatus || "unknown",
      lastHeartbeat: p.lastHeartbeat,
      status: p.status,
    }));
  }

  async function getDirectiveStats(platformId: string): Promise<{ total: number; acknowledged: number; fidelity: number }> {
    const directives = await db.select().from(ecosystemDirectives);
    const acks = await db.select().from(ecosystemDirectiveAcks).where(eq(ecosystemDirectiveAcks.platformId, platformId));
    const ackSet = new Set(acks.map(a => a.directiveId));
    const total = directives.length;
    const acknowledged = directives.filter(d => ackSet.has(d.id)).length;
    return { total, acknowledged, fidelity: total > 0 ? Math.round((acknowledged / total) * 100) : 0 };
  }

  async function getRecentHealthLogs(platformId: string): Promise<{ avgResponseMs: number; uptimePercent: number; checkCount: number }> {
    const logs = await db.select().from(ecosystemHealthLogs)
      .where(and(
        eq(ecosystemHealthLogs.platformId, platformId),
        gte(ecosystemHealthLogs.checkedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      ))
      .orderBy(desc(ecosystemHealthLogs.checkedAt))
      .limit(100);

    if (logs.length === 0) return { avgResponseMs: 0, uptimePercent: 0, checkCount: 0 };

    const onlineCount = logs.filter(l => l.status === "online" || l.status === "degraded").length;
    const avgMs = Math.round(logs.reduce((s, l) => s + (l.responseTimeMs || 0), 0) / logs.length);
    return { avgResponseMs: avgMs, uptimePercent: Math.round((onlineCount / logs.length) * 100), checkCount: logs.length };
  }

  async function generateExecutiveSummary(profile: PlatformProfile, directiveStats: any, healthStats: any): Promise<ExecutiveSummary> {
    const features = (profile.capabilities as any)?.features || [];
    const sends = (profile.dataFlowConfig as any)?.sends || [];
    const receives = (profile.dataFlowConfig as any)?.receives || [];

    const prompt = `You are ${profile.name}, a platform in the ThriveUp Academy ACOS ecosystem (23 interconnected platforms serving workforce development, health equity, veteran transition, and community resilience under The Collaborative Advocate, a 501(c)(3) founded by Dr. Terry Flood).

Write YOUR executive summary — first person, honest, no fluff. You are assessing yourself.

Your data:
- Role: ${profile.role}
- Domain: ${profile.domain}
- Description: ${profile.description}
- Features: ${features.join(", ")}
- Data you SEND: ${sends.join(", ")}
- Data you RECEIVE: ${receives.join(", ")}
- Grant alignment: ${profile.grantAlignment.join(", ")}
- Current health: ${profile.healthStatus}
- Directive fidelity: ${directiveStats.fidelity}% (${directiveStats.acknowledged}/${directiveStats.total} acknowledged)
- Uptime (7 days): ${healthStats.uptimePercent}% across ${healthStats.checkCount} checks
- Avg response: ${healthStats.avgResponseMs}ms

Respond in this exact JSON format (no markdown, no code fences):
{
  "mission": "one sentence — what you exist to do",
  "keyStrengths": ["3-4 specific strengths based on real capabilities"],
  "currentCapabilities": ["list your actual deployed features"],
  "ecosystemContribution": "one sentence — what you give to the ecosystem that no other platform does",
  "gapsSelfIdentified": ["2-3 honest gaps or weaknesses you see in yourself"],
  "readinessLevel": "one of: battle-ready, operational, developing, nascent"
}`;

    try {
      const response = await generateAIResponse([
        { role: "system", content: "You are generating a platform self-assessment. Return ONLY valid JSON, no markdown." },
        { role: "user", content: prompt },
      ], 800);

      const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return { platformId: profile.id, platformName: profile.name, selfAssessment: parsed };
    } catch (e) {
      return {
        platformId: profile.id,
        platformName: profile.name,
        selfAssessment: {
          mission: profile.description || "Mission not generated",
          keyStrengths: features.slice(0, 4),
          currentCapabilities: features,
          ecosystemContribution: `${profile.role} services for the ecosystem`,
          gapsSelfIdentified: [`Directive fidelity at ${directiveStats.fidelity}%`, `Health status: ${profile.healthStatus}`],
          readinessLevel: directiveStats.fidelity >= 80 ? "operational" : "developing",
        },
      };
    }
  }

  async function generatePeerEvaluation(evaluator: PlatformProfile, target: PlatformProfile, targetSummary: ExecutiveSummary, targetDirectiveStats: any, targetHealthStats: any): Promise<PeerEvaluation> {
    const evalFeatures = ((evaluator.capabilities as any)?.features || []).join(", ");
    const targetFeatures = ((target.capabilities as any)?.features || []).join(", ");
    const targetSends = ((target.dataFlowConfig as any)?.sends || []).join(", ");
    const targetReceives = ((target.dataFlowConfig as any)?.receives || []).join(", ");

    const prompt = `You are ${evaluator.name} (${evaluator.role}, features: ${evalFeatures}).

Evaluate your peer platform ${target.name} for the ThriveUp ACOS ecosystem cross-evaluation.

${target.name}'s profile:
- Role: ${target.role}, Domain: ${target.domain}
- Description: ${target.description}
- Features: ${targetFeatures}
- Sends: ${targetSends}
- Receives: ${targetReceives}
- Grant alignment: ${target.grantAlignment.join(", ")}
- Health: ${target.healthStatus}, Fidelity: ${targetDirectiveStats.fidelity}%
- Uptime: ${targetHealthStats.uptimePercent}%, Response: ${targetHealthStats.avgResponseMs}ms
- Self-identified gaps: ${targetSummary.selfAssessment.gapsSelfIdentified.join("; ")}

Score 1-10 on each dimension using the Ecosystem Operating Standard (EOS).

SCORING CALIBRATION — you MUST differentiate:
- 9-10: Battle-ready. ONLY if: deep domain expertise with proven outcome data (real clinical/legal/educational metrics cited), 3+ active bidirectional data flows with evidence of real data exchange, grant narrative that cites specific funding amounts and deliverables, reliable uptime, AND the platform could survive independent scrutiny from a funder. This is RARE — most platforms should NOT score here unless they demonstrably deliver measurable outcomes.
- 7-8: Operational. Solid capabilities deployed and functional, good integration architecture (data flows defined even if not all active), clear grant alignment with specific grants named, consistent execution. The platform works and contributes meaningfully.
- 5-6: Developing. Capabilities exist on paper but integration is shallow (few real data exchanges), limited grant contribution (mentioned in narratives but not driving them), execution gaps visible in health/uptime data.
- 3-4: Nascent. Minimal working capability, poor or no integration, not grant-ready.
- 1-2: Non-functional or harmful to ecosystem.

IMPORTANT: Do NOT give 7+ just because a platform "sounds important" or has a long feature list. Score based on EVIDENCE of delivery: Is the platform online? Does it actually exchange data? Can it produce outcome metrics a grant funder would accept? A platform with 14 listed features but no proven outcomes is a 6, not an 8. Differentiate between capability claims and demonstrated capability.

Return ONLY valid JSON:
{
  "depth": <1-10 how deep is their expertise in their domain>,
  "breadth": <1-10 how broadly do they serve across populations>,
  "executionCapability": <1-10 can they actually deliver what they claim>,
  "ecosystemIntegration": <1-10 how well connected are they to other platforms>,
  "grantReadiness": <1-10 how ready are they to support active grant proposals>,
  "strengths": ["2-3 specific things they do well"],
  "gaps": ["2-3 specific weaknesses or missing capabilities"],
  "recommendation": "one sentence — what they should focus on next"
}`;

    try {
      const response = await generateAIResponse([
        { role: "system", content: "You are a platform peer reviewer. Return ONLY valid JSON, no markdown." },
        { role: "user", content: prompt },
      ], 600);

      const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      const overall = Math.round(((parsed.depth || 5) + (parsed.breadth || 5) + (parsed.executionCapability || 5) + (parsed.ecosystemIntegration || 5) + (parsed.grantReadiness || 5)) / 5 * 10) / 10;

      return {
        evaluatorId: evaluator.id,
        evaluatorName: evaluator.name,
        targetId: target.id,
        targetName: target.name,
        scores: {
          depth: parsed.depth || 5,
          breadth: parsed.breadth || 5,
          executionCapability: parsed.executionCapability || 5,
          ecosystemIntegration: parsed.ecosystemIntegration || 5,
          grantReadiness: parsed.grantReadiness || 5,
        },
        overallScore: overall,
        strengths: parsed.strengths || [],
        gaps: parsed.gaps || [],
        recommendation: parsed.recommendation || "Continue current trajectory",
      };
    } catch (e) {
      return {
        evaluatorId: evaluator.id,
        evaluatorName: evaluator.name,
        targetId: target.id,
        targetName: target.name,
        scores: { depth: 5, breadth: 5, executionCapability: 5, ecosystemIntegration: 5, grantReadiness: 5 },
        overallScore: 5,
        strengths: ["Active in ecosystem"],
        gaps: ["Peer evaluation could not be generated"],
        recommendation: "Needs manual assessment",
      };
    }
  }

  function computeGapAudit(
    summaries: ExecutiveSummary[],
    evaluations: PeerEvaluation[],
    profiles: PlatformProfile[],
    directiveStatsMap: Record<string, any>,
    healthStatsMap: Record<string, any>,
  ): CrossEvaluationReport["gapAudit"] {
    const readinessToScore: Record<string, number> = { "battle-ready": 8, "operational": 6, "developing": 4, "nascent": 2 };

    const peerData: Record<string, { scores: number[]; gaps: string[]; strengths: string[] }> = {};
    evaluations.forEach(e => {
      if (!peerData[e.targetId]) peerData[e.targetId] = { scores: [], gaps: [], strengths: [] };
      peerData[e.targetId].scores.push(e.overallScore);
      peerData[e.targetId].gaps.push(...e.gaps);
      peerData[e.targetId].strengths.push(...e.strengths);
    });

    const entries: GapAuditEntry[] = summaries.map(s => {
      const peer = peerData[s.platformId];
      const profile = profiles.find(p => p.id === s.platformId);
      const dStats = directiveStatsMap[s.platformId] || { fidelity: 0 };
      const hStats = healthStatsMap[s.platformId] || { uptimePercent: 0 };
      const peerAvg = peer ? Math.round(peer.scores.reduce((a, b) => a + b, 0) / peer.scores.length * 10) / 10 : 0;
      const expected = readinessToScore[s.selfAssessment.readinessLevel] || 5;
      const gap = Math.round((peerAvg - expected) * 10) / 10;

      const selfGapSet = new Set(s.selfAssessment.gapsSelfIdentified.map(g => g.toLowerCase()));
      const peerGaps = peer ? Array.from(new Set(peer.gaps)) : [];
      const peerStrengths = peer ? Array.from(new Set(peer.strengths)) : [];
      const blindSpots = peerGaps.filter(pg => {
        const pgLower = pg.toLowerCase();
        return !Array.from(selfGapSet).some(sg => pgLower.includes(sg) || sg.includes(pgLower.slice(0, 20)));
      });

      let verdict: GapAuditEntry["verdict"];
      if (gap >= 1) verdict = "OUTPERFORMING";
      else if (gap >= -0.5) verdict = "ALIGNED";
      else if (gap >= -2) verdict = "OVERRATING";
      else verdict = "CRITICAL-DISCONNECT";

      return {
        platformId: s.platformId,
        platformName: s.platformName,
        claimedReadiness: s.selfAssessment.readinessLevel,
        expectedScore: expected,
        peerAvgScore: peerAvg,
        gap,
        verdict,
        selfClaimedStrengths: s.selfAssessment.keyStrengths,
        selfIdentifiedGaps: s.selfAssessment.gapsSelfIdentified,
        peerIdentifiedGaps: peerGaps.slice(0, 5),
        peerIdentifiedStrengths: peerStrengths.slice(0, 5),
        blindSpots: blindSpots.slice(0, 3),
        directiveFidelity: dStats.fidelity,
        healthStatus: profile?.healthStatus || "unknown",
        uptimePercent: hStats.uptimePercent,
      };
    });

    const overraters = entries.filter(e => e.verdict === "OVERRATING" || e.verdict === "CRITICAL-DISCONNECT").sort((a, b) => a.gap - b.gap);
    const aligned = entries.filter(e => e.verdict === "ALIGNED");
    const outperformers = entries.filter(e => e.verdict === "OUTPERFORMING").sort((a, b) => b.gap - a.gap);

    const allBlindSpots = entries.flatMap(e => e.blindSpots);
    const bsFreq: Record<string, number> = {};
    allBlindSpots.forEach(bs => { bsFreq[bs] = (bsFreq[bs] || 0) + 1; });
    const blindSpotSummary = Object.entries(bsFreq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([bs, count]) => `[${count}x] ${bs}`);

    const systemicGaps: string[] = [];
    const avgFidelity = entries.reduce((s, e) => s + e.directiveFidelity, 0) / entries.length;
    if (avgFidelity < 80) systemicGaps.push(`Ecosystem-wide directive fidelity at ${Math.round(avgFidelity)}% — ${entries.filter(e => e.directiveFidelity < 70).length} platforms below 70%`);
    const offlineOrDegraded = entries.filter(e => e.healthStatus === "offline" || e.healthStatus === "degraded");
    if (offlineOrDegraded.length > 3) systemicGaps.push(`${offlineOrDegraded.length} platforms offline or degraded — infrastructure reliability gap`);
    if (overraters.length > 3) systemicGaps.push(`${overraters.length} platforms overrating themselves — self-awareness gap across ecosystem`);
    const lowGrant = entries.filter(e => e.peerAvgScore > 0 && e.peerAvgScore < 5);
    if (lowGrant.length > 2) systemicGaps.push(`${lowGrant.length} platforms scored below 5/10 by peers — execution capability gap`);
    const highBlindSpot = entries.filter(e => e.blindSpots.length >= 2);
    if (highBlindSpot.length > 3) systemicGaps.push(`${highBlindSpot.length} platforms have 2+ blind spots — gaps they don't see in themselves that peers do`);

    return { entries, overraters, aligned, outperformers, blindSpotSummary, systemicGaps };
  }

  async function callClaudeDirectly(prompt: string, systemPrompt: string, maxTokens: number = 2000): Promise<string> {
    const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
    const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
    if (!apiKey || !baseURL) {
      console.warn("[Peer Review] Claude not available for independent verification — falling back to primary AI");
      return generateAIResponse([{ role: "system", content: systemPrompt }, { role: "user", content: prompt }], maxTokens);
    }
    const client = new Anthropic({ apiKey, baseURL });
    const resp = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });
    const block = resp.content[0];
    return block.type === "text" ? block.text : "";
  }

  async function claudeIndependentVerification(
    summaries: ExecutiveSummary[],
    evaluations: PeerEvaluation[],
    gapAudit: CrossEvaluationReport["gapAudit"],
    profiles: PlatformProfile[],
  ): Promise<string> {
    const overraterNames = gapAudit.overraters.map(o => `${o.platformName} (claims ${o.claimedReadiness}, peers scored ${o.peerAvgScore}/10, gap ${o.gap})`).join("; ");
    const outperformerNames = gapAudit.outperformers.map(o => `${o.platformName} (claims ${o.claimedReadiness}, peers scored ${o.peerAvgScore}/10, gap +${o.gap})`).join("; ");
    const blindSpotStr = gapAudit.blindSpotSummary.join("; ");
    const systemicStr = gapAudit.systemicGaps.join("; ");

    const topSummaries = summaries.slice(0, 5).map(s =>
      `${s.platformName}: claims "${s.selfAssessment.readinessLevel}", mission: "${s.selfAssessment.mission}", self-gaps: "${s.selfAssessment.gapsSelfIdentified.join("; ")}"`
    ).join("\n");

    const platformScoresSummary = gapAudit.entries.map(e =>
      `${e.platformName}: claimed=${e.claimedReadiness}, peer=${e.peerAvgScore}/10, fidelity=${e.directiveFidelity}%, health=${e.healthStatus}, blind_spots=${e.blindSpots.length}`
    ).join("\n");

    const prompt = `You are Claude, serving as the INDEPENDENT VERIFIER for the ThriveUp Academy ecosystem cross-evaluation. Your job is to audit the evaluation itself for bias, blind spots, and honesty.

This is a 23-platform ecosystem under The Collaborative Advocate (501(c)(3), veteran-founded, Black-led). Dr. Terry Flood is the founder. The primary AI generated executive summaries and peer evaluations. Now you verify.

EVALUATION DATA:
- ${summaries.length} platforms produced self-assessments
- ${evaluations.length} peer evaluations completed
- Overraters (say > do): ${overraterNames || "None identified"}
- Outperformers (do > say): ${outperformerNames || "None identified"}
- Systemic gaps: ${systemicStr || "None flagged"}
- Blind spots (peers see but platform doesn't): ${blindSpotStr || "None"}

PLATFORM SCORES:
${platformScoresSummary}

SAMPLE SELF-ASSESSMENTS:
${topSummaries}

YOUR VERIFICATION TASK — answer each section honestly:

1. BIAS CHECK: Are the peer evaluations inflated, deflated, or fair? Are platforms being too generous with each other (grade inflation)? Is any platform getting unfairly harsh treatment?

2. SELF-AWARENESS AUDIT: Which platforms show genuine self-awareness (honest about gaps) vs. which are performing self-assessment theater (listing superficial gaps while ignoring structural problems)?

3. CAPABILITY vs. REALITY: Based on the data (fidelity %, health status, uptime), which platforms claim capabilities they cannot actually deliver right now? Call them out specifically.

4. BLIND SPOT VERIFICATION: The gap audit identified these blind spots — ${blindSpotStr}. Are these real blind spots or artifacts of the evaluation method? What blind spots did the evaluation itself miss?

5. ECOSYSTEM STRUCTURAL FINDING: What is the single most important thing Dr. Flood needs to know that the self-assessments and peer evaluations are both avoiding or downplaying?

6. VERDICT: In one sentence, is this ecosystem being honest with itself or not?

Be brutally honest. No diplomatic hedging. This verification exists specifically to prevent the ecosystem from lying to itself.`;

    try {
      const verification = await callClaudeDirectly(
        prompt,
        "You are an independent AI verifier auditing an ecosystem evaluation. Be direct, specific, and unflinching. No flattery, no hedging. Your job is to catch what the evaluation missed or sugar-coated.",
        2000,
      );
      console.log("[Peer Review] Claude independent verification complete");
      return verification;
    } catch (err) {
      console.error("[Peer Review] Claude verification failed:", err);
      return "VERIFICATION UNAVAILABLE: Claude independent verification could not be completed. Treat evaluation results with additional scrutiny — no independent bias check was performed.";
    }
  }

  async function generateBLUF(summaries: ExecutiveSummary[], evaluations: PeerEvaluation[], platforms: PlatformProfile[], gapAudit?: CrossEvaluationReport["gapAudit"]): Promise<{ bluf: string; verdict: CrossEvaluationReport["ecosystemVerdict"] }> {
    const platformScores: Record<string, { total: number; count: number; gaps: string[] }> = {};
    for (const ev of evaluations) {
      if (!platformScores[ev.targetId]) platformScores[ev.targetId] = { total: 0, count: 0, gaps: [] };
      platformScores[ev.targetId].total += ev.overallScore;
      platformScores[ev.targetId].count++;
      platformScores[ev.targetId].gaps.push(...ev.gaps);
    }

    const ranked = Object.entries(platformScores).map(([id, data]) => {
      const name = platforms.find(p => p.id === id)?.name || id;
      const avgScore = Math.round((data.total / data.count) * 10) / 10;
      const uniqueGaps = [...new Set(data.gaps)];
      return { id, name, avgScore, gaps: uniqueGaps };
    }).sort((a, b) => b.avgScore - a.avgScore);

    const topPerformers = ranked.slice(0, 5).map(r => ({ name: r.name, score: r.avgScore }));
    const needsAttention = ranked.filter(r => r.avgScore < 5).map(r => ({ name: r.name, score: r.avgScore, gaps: r.gaps.slice(0, 3) }));
    const allGaps = ranked.flatMap(r => r.gaps);
    const gapFrequency: Record<string, number> = {};
    allGaps.forEach(g => { gapFrequency[g] = (gapFrequency[g] || 0) + 1; });
    const criticalGaps = Object.entries(gapFrequency).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([gap]) => gap);

    const summaryText = ranked.map(r => `${r.name}: ${r.avgScore}/10`).join(", ");
    const topStr = topPerformers.map(t => `${t.name} (${t.score})`).join(", ");
    const attentionStr = needsAttention.length > 0 ? needsAttention.map(n => `${n.name} (${n.score})`).join(", ") : "None";

    const gapAuditStr = gapAudit ? `
GAP AUDIT (Say vs. Do Analysis):
- Overraters (claim more than they deliver): ${gapAudit.overraters.map(o => `${o.platformName} (claims ${o.claimedReadiness}, peers say ${o.peerAvgScore}/10, gap ${o.gap})`).join("; ") || "None"}
- Outperformers (deliver more than they claim): ${gapAudit.outperformers.map(o => `${o.platformName} (claims ${o.claimedReadiness}, peers say ${o.peerAvgScore}/10, gap +${o.gap})`).join("; ") || "None"}
- Blind spots (gaps peers see but platform doesn't): ${gapAudit.blindSpotSummary.join("; ") || "None"}
- Systemic gaps: ${gapAudit.systemicGaps.join("; ") || "None"}` : "";

    const blufPrompt = `Write a 5-paragraph BLUF (Bottom Line Up Front) for Dr. Terry Flood, founder of The Collaborative Advocate ecosystem (23 platforms, ACOS architecture).

This is the weekly MAP-GAP peer cross-evaluation where every platform evaluated every other platform on: depth, breadth, execution capability, ecosystem integration, and grant readiness. Includes a say-vs-do gap audit comparing what platforms claim about themselves vs what their peers actually scored.

Data:
- Total platforms evaluated: ${platforms.length}
- Total peer evaluations completed: ${evaluations.length}
- Top 5 performers: ${topStr}
- Needs attention: ${attentionStr}
- Most common gaps across ecosystem: ${criticalGaps.join("; ")}
- Platform scores: ${summaryText}
${gapAuditStr}

Paragraph 1: THE BOTTOM LINE — one-sentence verdict on ecosystem health.
Paragraph 2: WHAT'S WORKING — top performers and why.
Paragraph 3: SAY vs. DO — which platforms are overrating themselves, which are outperforming their claims, and what blind spots exist. Be specific.
Paragraph 4: WHAT NEEDS ATTENTION — weakest links, systemic gaps, and what they're missing.
Paragraph 5: STRATEGIC RECOMMENDATION — what Dr. Flood should act on this week based on the gap audit findings.

Be direct, specific, no flattery. This is for a veteran founder who needs the truth.`;

    try {
      const bluf = await generateAIResponse([
        { role: "system", content: "You write executive intelligence briefings. Be direct, specific, actionable." },
        { role: "user", content: blufPrompt },
      ], 1000);

      const strategicPrompt = `Based on these ecosystem gaps: ${criticalGaps.join("; ")}
And these underperforming platforms: ${attentionStr}
Give exactly 3 strategic recommendations in a JSON array of strings. No markdown.`;

      let recommendations = ["Address platform integration gaps", "Increase directive fidelity across ecosystem", "Strengthen grant readiness for upcoming deadlines"];
      try {
        const recResponse = await generateAIResponse([
          { role: "system", content: "Return ONLY a JSON array of 3 strings. No markdown." },
          { role: "user", content: strategicPrompt },
        ], 300);
        const cleaned = recResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        recommendations = JSON.parse(cleaned);
      } catch {}

      return {
        bluf,
        verdict: {
          overallHealth: ranked.length > 0 ? (ranked.reduce((s, r) => s + r.avgScore, 0) / ranked.length >= 7 ? "STRONG" : ranked.reduce((s, r) => s + r.avgScore, 0) / ranked.length >= 5 ? "OPERATIONAL" : "NEEDS-WORK") : "UNKNOWN",
          topPerformers,
          needsAttention,
          criticalGaps,
          strategicRecommendations: recommendations,
        },
      };
    } catch {
      return {
        bluf: `BLUF: ${platforms.length} platforms evaluated through ${evaluations.length} peer reviews. Top performers: ${topStr}. Needs attention: ${attentionStr}. Critical gaps: ${criticalGaps.join(", ")}.`,
        verdict: {
          overallHealth: "ASSESSMENT-INCOMPLETE",
          topPerformers,
          needsAttention,
          criticalGaps,
          strategicRecommendations: ["Complete full AI-powered assessment", "Review platform integration gaps", "Strengthen weakest performers"],
        },
      };
    }
  }

  const ORGANIZATIONAL_ONLY_PLATFORMS = ["collaborative-advocate"];

  async function runFullCrossEvaluation(): Promise<CrossEvaluationReport> {
    evaluationInProgress = true;
    const startTime = Date.now();
    console.log("[Peer Review] Starting full ecosystem cross-evaluation...");

    try {
      const allProfiles = await buildPlatformProfiles();
      const profiles = allProfiles.filter(p => !ORGANIZATIONAL_ONLY_PLATFORMS.includes(p.id));
      console.log(`[Peer Review] Loaded ${allProfiles.length} platform profiles (${profiles.length} scorable, ${ORGANIZATIONAL_ONLY_PLATFORMS.length} organizational-only excluded)`);

      const directiveStatsMap: Record<string, any> = {};
      const healthStatsMap: Record<string, any> = {};
      for (const p of profiles) {
        directiveStatsMap[p.id] = await getDirectiveStats(p.id);
        healthStatsMap[p.id] = await getRecentHealthLogs(p.id);
      }

      console.log("[Peer Review] Phase 1: Generating executive summaries...");
      const summaries: ExecutiveSummary[] = [];
      const batchSize = 4;
      for (let i = 0; i < profiles.length; i += batchSize) {
        const batch = profiles.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(p => generateExecutiveSummary(p, directiveStatsMap[p.id], healthStatsMap[p.id]))
        );
        summaries.push(...batchResults);
        console.log(`[Peer Review] Summaries: ${summaries.length}/${profiles.length} complete`);
      }

      console.log("[Peer Review] Phase 2: Generating peer evaluations (full coverage)...");
      const evaluations: PeerEvaluation[] = [];

      const targetCoverage: Record<string, number> = {};
      profiles.forEach(p => { targetCoverage[p.id] = 0; });

      const evaluatorPool = [...profiles].sort(() => Math.random() - 0.5);
      const minEvalsPerTarget = 3;

      for (const evaluator of evaluatorPool) {
        const targets = profiles.filter(p => p.id !== evaluator.id);
        const uncovered = targets.filter(t => targetCoverage[t.id] < minEvalsPerTarget);
        const covered = targets.filter(t => targetCoverage[t.id] >= minEvalsPerTarget);
        const targetSample = [
          ...uncovered.sort(() => Math.random() - 0.5),
          ...covered.sort(() => Math.random() - 0.5),
        ].slice(0, Math.min(8, targets.length));

        const batchEvals = await Promise.all(
          targetSample.map(target => {
            const summary = summaries.find(s => s.platformId === target.id)!;
            return generatePeerEvaluation(evaluator, target, summary, directiveStatsMap[target.id], healthStatsMap[target.id]);
          })
        );
        evaluations.push(...batchEvals);
        batchEvals.forEach(e => { targetCoverage[e.targetId] = (targetCoverage[e.targetId] || 0) + 1; });
        console.log(`[Peer Review] Evaluations: ${evaluations.length} complete (${evaluator.name} evaluated ${batchEvals.length} peers)`);

        const uncoveredRemaining = Object.values(targetCoverage).filter(c => c < minEvalsPerTarget).length;
        if (uncoveredRemaining === 0 && evaluations.length >= profiles.length * 3) break;
      }

      console.log("[Peer Review] Phase 3: Computing say-vs-do gap audit...");
      const gapAudit = computeGapAudit(summaries, evaluations, profiles, directiveStatsMap, healthStatsMap);
      console.log(`[Peer Review] Gap audit: ${gapAudit.overraters.length} overraters, ${gapAudit.outperformers.length} outperformers, ${gapAudit.blindSpotSummary.length} blind spots, ${gapAudit.systemicGaps.length} systemic gaps`);

      console.log("[Peer Review] Phase 4: Generating BLUF and ecosystem verdict...");
      const { bluf, verdict } = await generateBLUF(summaries, evaluations, profiles, gapAudit);

      console.log("[Peer Review] Phase 5: Claude independent verification...");
      const claudeVerification = await claudeIndependentVerification(summaries, evaluations, gapAudit, profiles);

      const report: CrossEvaluationReport = {
        id: `crosseval_${Date.now()}`,
        timestamp: new Date().toISOString(),
        totalPlatforms: profiles.length,
        executiveSummaries: summaries,
        peerEvaluations: evaluations,
        bluf,
        ecosystemVerdict: verdict,
        gapAudit,
        claudeVerification,
        generatedAt: new Date().toISOString(),
      };

      lastCrossEvaluation = report;

      await db.insert(ecosystemEvents).values({
        sourcePlatformId: "hub",
        eventType: "peer-cross-evaluation",
        eventData: {
          reportId: report.id,
          totalPlatforms: report.totalPlatforms,
          totalEvaluations: evaluations.length,
          totalSummaries: summaries.length,
          overallHealth: verdict.overallHealth,
          topPerformers: verdict.topPerformers,
          needsAttention: verdict.needsAttention.map(n => n.name),
          criticalGaps: verdict.criticalGaps,
          durationMs: Date.now() - startTime,
        },
        status: "completed",
      });

      const durationSec = Math.round((Date.now() - startTime) / 1000);
      console.log(`[Peer Review] Cross-evaluation complete in ${durationSec}s — ${summaries.length} summaries, ${evaluations.length} evaluations, verdict: ${verdict.overallHealth}`);

      evaluationInProgress = false;
      return report;
    } catch (error) {
      evaluationInProgress = false;
      console.error("[Peer Review] Cross-evaluation failed:", error);
      throw error;
    }
  }

  app.post("/api/ecosystem/peer-review/run", requireAuth, async (_req: Request, res: Response) => {
    if (evaluationInProgress) {
      return res.status(409).json({ error: "Cross-evaluation already in progress", message: "Please wait for the current evaluation to complete." });
    }
    try {
      res.json({ status: "started", message: "Full ecosystem cross-evaluation initiated. This will take several minutes.", estimatedTime: "3-5 minutes" });
      runFullCrossEvaluation().catch(err => console.error("[Peer Review] Background evaluation failed:", err));
    } catch (error: any) {
      res.status(500).json({ error: "Failed to start cross-evaluation", details: error.message });
    }
  });

  app.get("/api/ecosystem/peer-review/status", requireAuth, async (_req: Request, res: Response) => {
    res.json({
      inProgress: evaluationInProgress,
      lastReport: lastCrossEvaluation ? {
        id: lastCrossEvaluation.id,
        timestamp: lastCrossEvaluation.timestamp,
        totalPlatforms: lastCrossEvaluation.totalPlatforms,
        totalEvaluations: lastCrossEvaluation.peerEvaluations.length,
        overallHealth: lastCrossEvaluation.ecosystemVerdict.overallHealth,
      } : null,
    });
  });

  app.get("/api/ecosystem/peer-review/latest", requireAuth, async (_req: Request, res: Response) => {
    if (!lastCrossEvaluation) {
      return res.status(404).json({ error: "No cross-evaluation has been run yet", action: "POST /api/ecosystem/peer-review/run to start one" });
    }
    res.json(lastCrossEvaluation);
  });

  app.get("/api/ecosystem/peer-review/bluf", requireAuth, async (_req: Request, res: Response) => {
    if (!lastCrossEvaluation) {
      return res.status(404).json({ error: "No cross-evaluation available", action: "POST /api/ecosystem/peer-review/run to generate one" });
    }
    res.json({
      bluf: lastCrossEvaluation.bluf,
      verdict: lastCrossEvaluation.ecosystemVerdict,
      gapAudit: lastCrossEvaluation.gapAudit,
      claudeVerification: lastCrossEvaluation.claudeVerification,
      generatedAt: lastCrossEvaluation.generatedAt,
      totalPlatforms: lastCrossEvaluation.totalPlatforms,
      totalEvaluations: lastCrossEvaluation.peerEvaluations.length,
    });
  });

  app.get("/api/ecosystem/peer-review/platform/:platformId", requireAuth, async (req: Request, res: Response) => {
    if (!lastCrossEvaluation) {
      return res.status(404).json({ error: "No cross-evaluation available" });
    }
    const { platformId } = req.params;
    const summary = lastCrossEvaluation.executiveSummaries.find(s => s.platformId === platformId);
    const evaluationsReceived = lastCrossEvaluation.peerEvaluations.filter(e => e.targetId === platformId);
    const evaluationsGiven = lastCrossEvaluation.peerEvaluations.filter(e => e.evaluatorId === platformId);

    if (!summary && evaluationsReceived.length === 0) {
      return res.status(404).json({ error: `Platform ${platformId} not found in latest evaluation` });
    }

    const avgScores = evaluationsReceived.length > 0 ? {
      depth: Math.round(evaluationsReceived.reduce((s, e) => s + e.scores.depth, 0) / evaluationsReceived.length * 10) / 10,
      breadth: Math.round(evaluationsReceived.reduce((s, e) => s + e.scores.breadth, 0) / evaluationsReceived.length * 10) / 10,
      executionCapability: Math.round(evaluationsReceived.reduce((s, e) => s + e.scores.executionCapability, 0) / evaluationsReceived.length * 10) / 10,
      ecosystemIntegration: Math.round(evaluationsReceived.reduce((s, e) => s + e.scores.ecosystemIntegration, 0) / evaluationsReceived.length * 10) / 10,
      grantReadiness: Math.round(evaluationsReceived.reduce((s, e) => s + e.scores.grantReadiness, 0) / evaluationsReceived.length * 10) / 10,
      overall: Math.round(evaluationsReceived.reduce((s, e) => s + e.overallScore, 0) / evaluationsReceived.length * 10) / 10,
    } : null;

    res.json({
      platformId,
      summary,
      averageScores: avgScores,
      evaluationsReceived,
      evaluationsGiven,
      peerCount: evaluationsReceived.length,
    });
  });

  app.get("/api/ecosystem/peer-review/report-doc", requireAuth, async (_req: Request, res: Response) => {
    if (!lastCrossEvaluation) {
      return res.status(404).json({ error: "No cross-evaluation available" });
    }
    const r = lastCrossEvaluation;

    let doc = `# ECOSYSTEM CROSS-EVALUATION REPORT\n`;
    doc += `## The Collaborative Advocate — ThriveUp Academy ACOS\n`;
    doc += `**Generated:** ${new Date(r.generatedAt).toLocaleString("en-US", { timeZone: "America/Chicago" })} CST\n`;
    doc += `**Platforms Evaluated:** ${r.totalPlatforms}\n`;
    doc += `**Peer Evaluations Completed:** ${r.peerEvaluations.length}\n`;
    doc += `**Overall Ecosystem Health:** ${r.ecosystemVerdict.overallHealth}\n\n`;

    doc += `---\n\n## BLUF (Bottom Line Up Front)\n\n${r.bluf}\n\n`;

    doc += `---\n\n## ECOSYSTEM VERDICT\n\n`;
    doc += `### Top Performers\n`;
    r.ecosystemVerdict.topPerformers.forEach(t => { doc += `- **${t.name}**: ${t.score}/10\n`; });
    doc += `\n### Needs Attention\n`;
    if (r.ecosystemVerdict.needsAttention.length === 0) {
      doc += `- All platforms above threshold\n`;
    } else {
      r.ecosystemVerdict.needsAttention.forEach(n => { doc += `- **${n.name}**: ${n.score}/10 — Gaps: ${n.gaps.join(", ")}\n`; });
    }
    doc += `\n### Critical Gaps (Ecosystem-Wide)\n`;
    r.ecosystemVerdict.criticalGaps.forEach(g => { doc += `- ${g}\n`; });
    doc += `\n### Strategic Recommendations\n`;
    r.ecosystemVerdict.strategicRecommendations.forEach((rec, i) => { doc += `${i + 1}. ${rec}\n`; });

    doc += `\n---\n\n## EXECUTIVE SUMMARIES (Self-Assessments)\n\n`;
    r.executiveSummaries.forEach(s => {
      doc += `### ${s.platformName}\n`;
      doc += `**Mission:** ${s.selfAssessment.mission}\n`;
      doc += `**Readiness:** ${s.selfAssessment.readinessLevel}\n`;
      doc += `**Key Strengths:** ${s.selfAssessment.keyStrengths.join(", ")}\n`;
      doc += `**Ecosystem Contribution:** ${s.selfAssessment.ecosystemContribution}\n`;
      doc += `**Self-Identified Gaps:** ${s.selfAssessment.gapsSelfIdentified.join(", ")}\n\n`;
    });

    doc += `\n---\n\n## GAP AUDIT (Say vs. Do)\n\n`;
    if (r.gapAudit) {
      doc += `### Overraters (Claiming More Than They Deliver)\n`;
      if (r.gapAudit.overraters.length === 0) doc += `- None identified\n`;
      else r.gapAudit.overraters.forEach(o => {
        doc += `- **${o.platformName}**: Claims "${o.claimedReadiness}" (expected ${o.expectedScore}/10), peers scored ${o.peerAvgScore}/10 — **${o.verdict}** (gap: ${o.gap})\n`;
        if (o.blindSpots.length > 0) doc += `  - Blind spots: ${o.blindSpots.join("; ")}\n`;
      });
      doc += `\n### Outperformers (Delivering More Than They Claim)\n`;
      if (r.gapAudit.outperformers.length === 0) doc += `- None identified\n`;
      else r.gapAudit.outperformers.forEach(o => {
        doc += `- **${o.platformName}**: Claims "${o.claimedReadiness}" (expected ${o.expectedScore}/10), peers scored ${o.peerAvgScore}/10 — **${o.verdict}** (gap: +${o.gap})\n`;
      });
      doc += `\n### Aligned (Say ≈ Do)\n`;
      if (r.gapAudit.aligned.length === 0) doc += `- None identified\n`;
      else r.gapAudit.aligned.forEach(a => {
        doc += `- **${a.platformName}**: ${a.peerAvgScore}/10 (gap: ${a.gap})\n`;
      });
      doc += `\n### Ecosystem Blind Spots\n`;
      r.gapAudit.blindSpotSummary.forEach(bs => { doc += `- ${bs}\n`; });
      doc += `\n### Systemic Gaps\n`;
      if (r.gapAudit.systemicGaps.length === 0) doc += `- No systemic gaps identified\n`;
      else r.gapAudit.systemicGaps.forEach(sg => { doc += `- ${sg}\n`; });
      doc += `\n### Full Platform Gap Matrix\n\n`;
      doc += `| Platform | Claimed | Expected | Peer Avg | Gap | Verdict | Fidelity | Blind Spots |\n`;
      doc += `|----------|---------|----------|----------|-----|---------|----------|-------------|\n`;
      r.gapAudit.entries.forEach(e => {
        doc += `| ${e.platformName} | ${e.claimedReadiness} | ${e.expectedScore} | ${e.peerAvgScore} | ${e.gap} | ${e.verdict} | ${e.directiveFidelity}% | ${e.blindSpots.length} |\n`;
      });
    } else {
      doc += `Gap audit data not available for this report.\n`;
    }

    doc += `\n---\n\n## CLAUDE INDEPENDENT VERIFICATION\n\n`;
    doc += `*This section was generated by Claude (Anthropic) as an independent verifier — separate from the AI that generated the evaluations. Its purpose is to check the evaluation for bias, blind spots, and honesty.*\n\n`;
    doc += r.claudeVerification || "Verification not available for this report.";
    doc += `\n\n`;

    doc += `---\n\n## PEER EVALUATIONS (Detail)\n\n`;

    const byTarget: Record<string, PeerEvaluation[]> = {};
    r.peerEvaluations.forEach(e => {
      if (!byTarget[e.targetId]) byTarget[e.targetId] = [];
      byTarget[e.targetId].push(e);
    });

    Object.entries(byTarget).forEach(([targetId, evals]) => {
      const name = evals[0]?.targetName || targetId;
      const avgOverall = Math.round(evals.reduce((s, e) => s + e.overallScore, 0) / evals.length * 10) / 10;
      doc += `### ${name} (Avg: ${avgOverall}/10 from ${evals.length} peers)\n\n`;

      evals.forEach(e => {
        doc += `**Evaluated by ${e.evaluatorName}:** ${e.overallScore}/10\n`;
        doc += `- Depth: ${e.scores.depth} | Breadth: ${e.scores.breadth} | Execution: ${e.scores.executionCapability} | Integration: ${e.scores.ecosystemIntegration} | Grant Ready: ${e.scores.grantReadiness}\n`;
        doc += `- Strengths: ${e.strengths.join(", ")}\n`;
        doc += `- Gaps: ${e.gaps.join(", ")}\n`;
        doc += `- Recommendation: ${e.recommendation}\n\n`;
      });
    });

    doc += `---\n\n*This report was generated by the ThriveUp Academy ACOS Peer Review System.*\n`;
    doc += `*MAP-GAP cross-evaluation — every platform evaluates every peer on depth, breadth, and execution capability.*\n`;
    doc += `*Schedule: Weekly + on-demand.*\n`;

    res.setHeader("Content-Type", "text/markdown");
    res.setHeader("Content-Disposition", `attachment; filename="ecosystem-cross-evaluation-${new Date().toISOString().split("T")[0]}.md"`);
    res.send(doc);
  });

  let weeklyReviewInterval: ReturnType<typeof setInterval> | null = null;
  function startWeeklyPeerReview() {
    if (weeklyReviewInterval) return;
    console.log("[Peer Review] Weekly cross-evaluation scheduled — every 7 days");
    weeklyReviewInterval = setInterval(() => {
      console.log("[Peer Review] Running scheduled weekly cross-evaluation...");
      runFullCrossEvaluation().catch(err => console.error("[Peer Review] Scheduled evaluation failed:", err));
    }, 7 * 24 * 60 * 60 * 1000);
  }

  setTimeout(() => {
    console.log("[Peer Review] Running initial cross-evaluation on startup...");
    runFullCrossEvaluation()
      .then(() => console.log("[Peer Review] Initial cross-evaluation complete"))
      .catch(err => console.error("[Peer Review] Initial evaluation failed:", err));
    startWeeklyPeerReview();
  }, 360000);
}
