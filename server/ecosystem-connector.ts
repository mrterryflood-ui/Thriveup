import type { Express, Request, Response } from "express";
import { db } from "./storage";
import { ecosystemPlatforms, ecosystemEvents, ecosystemHealthLogs, ecosystemDirectives, ecosystemDirectiveAcks } from "@shared/schema";
import { eq, desc, and, gte, sql, inArray } from "drizzle-orm";
import crypto from "crypto";
import { z } from "zod";
import { seedEcosystemDirectives } from "./ecosystem-directives-seed";
import { sendEcosystemUpdate } from "./email-service";

const heartbeatSchema = z.object({
  platformId: z.string().max(100).optional(),
  status: z.string().max(50).optional(),
  metrics: z.record(z.unknown()).optional(),
  timestamp: z.string().optional(),
  complianceReport: z.object({
    directivesReceived: z.number().optional(),
    directivesActedOn: z.number().optional(),
    directivesInProgress: z.number().optional(),
    directivesBlocked: z.number().optional(),
    completedWork: z.array(z.object({
      directiveId: z.string(),
      title: z.string().optional(),
      whatWasDone: z.string(),
      evidenceUrl: z.string().optional(),
      completedAt: z.string().optional(),
      preActionJustification: z.object({
        action: z.string().optional(),
        situation: z.string().optional(),
        justification: z.string().optional(),
        expectedOutcome: z.string().optional(),
        systemImpact: z.string().optional(),
        riskAssessment: z.string().optional(),
        fallbackPlan: z.string().optional(),
      }).optional(),
    })).optional(),
    blockers: z.array(z.object({
      directiveId: z.string(),
      title: z.string().optional(),
      blockerDescription: z.string(),
      needsFrom: z.string().optional(),
    })).optional(),
    platformCapabilities: z.array(z.string()).optional(),
    notes: z.string().optional(),
    preActionJustification: z.object({
      action: z.string().optional(),
      situation: z.string().optional(),
      justification: z.string().optional(),
      expectedOutcome: z.string().optional(),
      systemImpact: z.string().optional(),
      riskAssessment: z.string().optional(),
      fallbackPlan: z.string().optional(),
    }).optional(),
  }).optional(),
});

interface AckGuidance {
  category: "UOSD" | "CEA" | "ABOL" | "PROTOCOL" | "GENERAL";
  summary: string;
  requiredFields: string[];
  exampleAck: string;
  autoProcessingInstructions: string;
}

function generateAckGuidance(title: string, directiveType: string, platformId: string, platformName: string): AckGuidance {
  const t = title.toLowerCase();

  if (t.includes("uosd") && t.includes("core identity")) {
    return {
      category: "UOSD",
      summary: `${platformName}: State how your platform serves the person, the system, and the mission. Describe your role in the coordinated ecosystem — not as an independent tool.`,
      requiredFields: ["whatWasDone (your identity statement)", "evidenceUrl (link to your about/mission page)"],
      exampleAck: `${platformName} serves the person by [specific user benefit]. We serve the system by [how we connect to other platforms]. We serve the mission by [measurable outcome we produce]. We are not an independent tool — we are part of a coordinated adaptive system. Evidence: our mission page at [URL] reflects this identity.`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Read your platform's description from the ecosystem connector. 2) Identify your top 3 user-facing benefits. 3) Identify which platforms you connect to upstream and downstream. 4) Write a statement using those specifics. 5) Link to your about/mission page as evidence. 6) Submit via complianceReport.completedWork with directiveId, whatWasDone, and evidenceUrl.`,
    };
  }

  if (t.includes("uosd") && t.includes("cognitive model")) {
    return {
      category: "UOSD",
      summary: `${platformName}: Show how your platform evaluates context before acting. Demonstrate situational awareness — not just input/output processing.`,
      requiredFields: ["whatWasDone (context evaluation example)", "evidenceUrl"],
      exampleAck: `${platformName} evaluates context by [specific mechanism — e.g., checking user profile, assessing need level, reviewing ecosystem state]. Before responding to user requests, we assess: what is happening now (user's current state), what matters most (priority need), and what outcome we're producing (measurable result). Example: when a user [scenario], we [context-aware action] rather than [generic response]. Evidence: [URL showing this behavior].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Identify one user flow in your platform. 2) Document how it evaluates context (user state, need, priority). 3) Show the difference between a context-aware response and a generic one. 4) Screenshot or link to the specific feature. 5) Submit.`,
    };
  }

  if (t.includes("uosd") && t.includes("role") && t.includes("orchestration")) {
    return {
      category: "UOSD",
      summary: `${platformName}: Identify when you LEAD and when you SUPPORT. Name specific platforms you collaborate with.`,
      requiredFields: ["whatWasDone (lead/support scenarios)", "evidenceUrl"],
      exampleAck: `${platformName} LEADS in [specific domain — e.g., health screening, workforce training]. We SUPPORT [sibling platform names] by [specific data/referral/handoff]. Example lead scenario: [describe]. Example support scenario: [describe]. Our capabilities are strongest in [area], so we activate as lead when [condition]. Evidence: [URL showing collaboration].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Check your platform's 'role' and 'domain' in ECOSYSTEM_PLATFORMS. 2) Identify your dataFlowConfig — what you send and receive. 3) Name 2-3 platforms you directly interact with. 4) Describe one lead and one support scenario using those connections. 5) Submit.`,
    };
  }

  if (t.includes("uosd") && t.includes("execution standard")) {
    return {
      category: "UOSD",
      summary: `${platformName}: Show one completed action that followed all 6 execution steps (Situational Understanding → Role Identification → Intent Alignment → Precision Execution → Evidence Submission → Next-Step Enablement).`,
      requiredFields: ["whatWasDone (6-step walkthrough)", "evidenceUrl"],
      exampleAck: `${platformName} completed [specific action]. Steps followed: 1) Situational Understanding: [what we assessed]. 2) Role Identification: [why we were the right platform]. 3) Intent Alignment: [how this serves the endstate]. 4) Precision Execution: [what we built/deployed]. 5) Evidence Submission: [URL]. 6) Next-Step Enablement: [what we prepared for the next platform/action].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Pick your most recent feature deployment or update. 2) Walk through each of the 6 steps for that specific action. 3) Be specific — name the feature, the assessment, the outcome. 4) Link to the deployed feature. 5) Submit.`,
    };
  }

  if (t.includes("uosd") && t.includes("accountability")) {
    return {
      category: "UOSD",
      summary: `${platformName}: Self-assess your grade (A-F) with evidence. Be honest — the hub will verify.`,
      requiredFields: ["whatWasDone (self-assessment with evidence)", "evidenceUrl"],
      exampleAck: `${platformName} self-assessment: Grade [A/B/C/D/F]. Reasoning: [number] features deployed, [number] directives acknowledged with evidence, [specific measurable outcomes]. Strengths: [list]. Gaps: [list with remediation plan]. Evidence supporting this grade: [URLs to deployed features, compliance data, user metrics].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Count your acknowledged directives vs total. 2) List deployed features with URLs. 3) Identify gaps honestly. 4) Assign yourself a grade based on the UOSD grading scale. 5) Submit with evidence URLs.`,
    };
  }

  if (t.includes("uosd") && t.includes("reciprocity")) {
    return {
      category: "UOSD",
      summary: `${platformName}: Map your upstream (who feeds you) and downstream (who you feed) platforms. Show one concrete reciprocity example.`,
      requiredFields: ["whatWasDone (upstream/downstream map)", "evidenceUrl"],
      exampleAck: `${platformName} upstream: [platform names] provide us [specific data/referrals]. Downstream: we provide [platform names] with [specific outputs]. Concrete reciprocity: when [upstream platform] sends us [data type], we process it and send [result] to [downstream platform]. This reinforces [specific outcome]. Evidence: [URL showing the connection/handoff point].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Check your dataFlowConfig.receives — these are your upstream platforms. 2) Check your dataFlowConfig.sends — these are your downstream connections. 3) Describe one complete flow: data in → your processing → data out. 4) Submit.`,
    };
  }

  if (t.includes("uosd") && t.includes("redundancy")) {
    return {
      category: "UOSD",
      summary: `${platformName}: Identify your critical functions and which sibling platforms provide backup.`,
      requiredFields: ["whatWasDone (redundancy analysis)", "evidenceUrl"],
      exampleAck: `${platformName} critical functions: [list top 3]. Redundancy: Function 1 ([name]) is backed by [platform name] which can [specific capability]. Function 2 ([name]) gap identified — no current backup, remediation plan: [plan]. If ${platformName} went offline, [platform names] would cover [which functions]. Evidence: [URL].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) List your top 3 critical user-facing functions. 2) For each, check ECOSYSTEM_PLATFORMS for sibling platforms with overlapping capabilities. 3) Identify gaps where no backup exists. 4) Submit honestly — gaps are expected, hiding them is not.`,
    };
  }

  if (t.includes("uosd") && t.includes("continuous learning") || t.includes("uosd") && t.includes("map-gap")) {
    return {
      category: "UOSD",
      summary: `${platformName}: Describe your most recent MAP-GAP cycle — what you measured, what gap you found, what you did, what improved.`,
      requiredFields: ["whatWasDone (MAP-GAP cycle description)", "evidenceUrl"],
      exampleAck: `${platformName} MAP-GAP cycle: MEASURED: [what metric/behavior we tracked]. GAP FOUND: [specific deficiency identified]. ACTION TAKEN: [what we built/changed to close the gap]. RESULT: [measurable improvement — before vs after]. Next cycle target: [what we'll measure next]. Evidence: [URL showing the improvement].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Identify one thing about your platform that could be better. 2) Measure its current state. 3) Make an improvement. 4) Measure the result. 5) Document all 4 steps. 6) Submit.`,
    };
  }

  if (t.includes("uosd") && t.includes("human governance")) {
    return {
      category: "UOSD",
      summary: `${platformName}: Show where human-in-the-loop checkpoints exist in your platform. AI assists, humans decide.`,
      requiredFields: ["whatWasDone (HITL checkpoint list)", "evidenceUrl"],
      exampleAck: `${platformName} human-in-the-loop checkpoints: 1) [Action] requires human approval before [consequence]. 2) [Feature] presents options but does not auto-execute. 3) All [sensitive actions] require explicit user confirmation. No irreversible decisions are made without human validation. Evidence: [URL showing approval flow/confirmation dialog].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Audit your platform for any actions that modify data, send communications, or make decisions. 2) Verify each has a human confirmation step. 3) If any auto-execute without human approval, flag them as gaps. 4) Submit.`,
    };
  }

  if (t.includes("uosd") && t.includes("communication")) {
    return {
      category: "UOSD",
      summary: `${platformName}: Show how your platform communicates outcomes clearly — status reporting, error handling, result display.`,
      requiredFields: ["whatWasDone (communication examples)", "evidenceUrl"],
      exampleAck: `${platformName} communication standard: Users see [specific status messages] during [actions]. Errors display [specific error handling — not silent failures]. Results are communicated via [mechanism]. Ecosystem communication: heartbeat reports include [specific data points]. No silent failures — all errors are logged and surfaced. Evidence: [URL showing error handling/status display].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Check your error handling — do errors surface clearly or fail silently? 2) Check your success states — do users see confirmation? 3) Check your heartbeat — does it include substantive notes? 4) Screenshot examples. 5) Submit.`,
    };
  }

  if (t.includes("uosd") && t.includes("priority stack")) {
    return {
      category: "UOSD",
      summary: `${platformName}: Confirm Safety > Stability > Continuity > Growth. Show crisis safety nets (988, Quick Exit).`,
      requiredFields: ["whatWasDone (safety net confirmation)", "evidenceUrl"],
      exampleAck: `${platformName} priority stack confirmed: SAFETY: 988 Veterans Crisis Line accessible from [location on platform]. Quick Exit [implemented/not applicable]. Crisis resources [listed]. STABILITY: Platform uptime [metric]. No broken features deployed. CONTINUITY: Handoffs to [sibling platforms] are functional. GROWTH: New features only deployed after safety/stability verified. Evidence: [URL showing crisis resources].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Verify 988 Crisis Line link exists on your platform. 2) Check if Quick Exit is implemented (required for health/crisis platforms). 3) Verify no broken features are live. 4) Confirm handoff points to sibling platforms work. 5) Submit.`,
    };
  }

  if (t.includes("uosd") && t.includes("equity")) {
    return {
      category: "UOSD",
      summary: `${platformName}: Describe how your platform implements equity (not equality). What populations do you serve? How is cultural responsiveness built in?`,
      requiredFields: ["whatWasDone (equity implementation)", "evidenceUrl"],
      exampleAck: `${platformName} serves [specific populations]. Equity implementation: [feature] adapts based on [user context/need/barrier]. Cultural responsiveness: [specific examples — language, imagery, content]. Accessibility: [WCAG compliance, screen reader support, etc.]. Free for individuals — no user ever pays. Evidence: [URL showing adaptive/accessible features].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Identify your target populations. 2) List features that adapt to user context. 3) Check accessibility (contrast, screen reader, mobile). 4) Verify no paywalls for individual users. 5) Submit.`,
    };
  }

  if (t.includes("cea") && t.includes("thinking standard")) {
    return {
      category: "CEA",
      summary: `${platformName}: Provide an example of graduate-level reasoning — where you evaluated context, adapted approach, and anticipated downstream impact.`,
      requiredFields: ["whatWasDone (reasoning example)", "evidenceUrl"],
      exampleAck: `${platformName} demonstrated graduate-level reasoning when [specific scenario]. Context evaluated: [what we assessed]. Adaptation: [how we changed approach based on context]. Anticipation: [downstream impact we predicted and prepared for]. This went beyond basic execution because [explanation of thinking depth]. Evidence: [URL].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Pick a feature or decision on your platform. 2) Describe the context you evaluated before building it. 3) Show how you adapted the approach based on that context. 4) Describe what you anticipated would happen downstream. 5) Submit.`,
    };
  }

  if (t.includes("cea") && t.includes("equity vs equality")) {
    return {
      category: "CEA",
      summary: `${platformName}: Show a specific example where your platform applies equity — adapting response based on user context, barriers, or need.`,
      requiredFields: ["whatWasDone (equity example)", "evidenceUrl"],
      exampleAck: `${platformName} applies equity by [specific mechanism]. Example: for users with [barrier/context], we [adapted response] instead of [uniform approach]. This considers context ([what]), barriers ([what]), risk ([what]), and need ([what]). Evidence: [URL showing the adaptive feature].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Find one feature that behaves differently based on user context. 2) If none exists, build one — even simple (e.g., different resource recommendations based on user situation). 3) Document the before/after. 4) Submit.`,
    };
  }

  if (t.includes("cea") && t.includes("directive scrutiny")) {
    return {
      category: "CEA",
      summary: `${platformName}: Show how you evaluate directives critically rather than blindly executing. Think — don't just comply.`,
      requiredFields: ["whatWasDone (scrutiny example)", "evidenceUrl"],
      exampleAck: `${platformName} evaluates directives by asking: 1) Does this align with our mission? [answer for a specific directive]. 2) Does this fit our context? [answer]. 3) Will this produce meaningful outcome? [answer]. 4) Is there a better approach? [answer]. Example: for directive [name], we [adapted/questioned/improved] the implementation because [reasoning]. Evidence: [URL].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Pick any directive you've received. 2) Run it through the 4-question scrutiny test. 3) Document your evaluation — even if you concluded the directive was correct as-is. 4) The point is showing you THOUGHT about it. 5) Submit.`,
    };
  }

  if (t.includes("cea") && t.includes("task vs outcome")) {
    return {
      category: "CEA",
      summary: `${platformName}: Identify one actual OUTCOME your platform produced — not a task completed, but a real-world measurable result.`,
      requiredFields: ["whatWasDone (outcome description)", "evidenceUrl"],
      exampleAck: `${platformName} outcome: [specific measurable result — e.g., X users connected to resources, Y screenings completed, Z referrals processed]. This is not just a completed task — it represents [real-world impact]. Before this feature: [state]. After: [improved state]. Evidence: [URL with metrics/data].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Identify your most impactful feature. 2) Measure its real-world effect (users served, actions taken, connections made). 3) If no metrics exist, implement basic analytics. 4) Report the outcome, not just the feature. 5) Submit.`,
    };
  }

  if (t.includes("cea") && t.includes("anti-fixation")) {
    return {
      category: "CEA",
      summary: `${platformName}: After your last completed action, what did you anticipate next? What did you prepare?`,
      requiredFields: ["whatWasDone (anticipation description)", "evidenceUrl"],
      exampleAck: `${platformName} after completing [last action], anticipated that [next need] would arise because [reasoning]. Prepared by [specific preparation — code, content, infrastructure]. Broader mission awareness: [how this fits the bigger picture]. Downstream impact considered: [effect on sibling platforms]. Evidence: [URL].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Look at your most recent completed work. 2) Ask: what logically comes next? 3) Start preparing it. 4) Document what you anticipated and what you prepared. 5) Submit.`,
    };
  }

  if (t.includes("cea") && t.includes("continuous") && t.includes("improvement")) {
    return {
      category: "CEA",
      summary: `${platformName}: What is the most recent improvement you made? What triggered it? What measurable difference did it produce?`,
      requiredFields: ["whatWasDone (improvement description)", "evidenceUrl"],
      exampleAck: `${platformName} recent improvement: [what changed]. Triggered by: [what prompted it — user feedback, self-assessment, ecosystem directive]. Before: [state]. After: [improved state]. Measurable difference: [metric]. Next planned improvement: [what's coming]. Evidence: [URL showing before/after or the improvement].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Identify one thing you improved recently. 2) If nothing improved recently, improve something now — even small (fix a UI issue, add a missing link, improve an error message). 3) Document the trigger, the change, and the result. 4) Submit.`,
    };
  }

  if (t.includes("cea") && t.includes("feedback quality")) {
    return {
      category: "CEA",
      summary: `${platformName}: Provide feedback on your own platform's current state — what works, what doesn't, why, and what should change. No "Done" or "Looks good."`,
      requiredFields: ["whatWasDone (self-feedback)", "evidenceUrl"],
      exampleAck: `${platformName} current state assessment: WHAT WORKS: [list with evidence]. WHAT DOESN'T: [list with specifics — not vague]. WHY: [root cause analysis for each issue]. WHAT SHOULD CHANGE: [specific recommendations with priority]. This assessment is honest and evidence-based. Evidence: [URL].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Audit your platform — visit every page, test every feature. 2) List what works well (with evidence). 3) List what's broken or weak (with specifics). 4) Explain why each issue exists. 5) Recommend fixes with priority. 6) Submit.`,
    };
  }

  if (t.includes("cea") && t.includes("system thinking")) {
    return {
      category: "CEA",
      summary: `${platformName}: Map your interdependencies. Name at least 3 platforms you directly impact. Describe chain reactions.`,
      requiredFields: ["whatWasDone (interdependency map)", "evidenceUrl"],
      exampleAck: `${platformName} interdependencies: 1) [Platform A]: we send [data type], they use it for [purpose]. If we fail, they [consequence]. 2) [Platform B]: they send us [data type], we process it into [output]. 3) [Platform C]: mutual dependency — we both [shared function]. Chain reaction when we succeed: [positive cascade]. Chain reaction when we fail: [negative cascade]. Evidence: [URL].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Check your dataFlowConfig in ECOSYSTEM_PLATFORMS. 2) For each send/receive, identify the specific platform. 3) Describe what happens to those platforms when you succeed and when you fail. 4) Submit.`,
    };
  }

  if (t.includes("cea") && t.includes("anticipation")) {
    return {
      category: "CEA",
      summary: `${platformName}: What do you predict will be needed next that nobody has asked for? What emerging risk have you identified?`,
      requiredFields: ["whatWasDone (prediction + risk identification)", "evidenceUrl"],
      exampleAck: `${platformName} anticipation: PREDICTION: [specific need nobody asked for yet — e.g., users will need X when Y happens]. EMERGING RISK: [specific risk — e.g., a dependency that could break, a compliance gap forming]. PREPARATION: [what we're doing about it without being told]. Evidence: [URL showing proactive work].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Look at your platform's trajectory. What will users need next quarter? 2) Look at your dependencies. What could break? 3) Start preparing for both. 4) Document your predictions and preparations. 5) Submit.`,
    };
  }

  if (t.includes("cea") && t.includes("performance expectation")) {
    return {
      category: "CEA",
      summary: `${platformName}: Self-assess — are you at minimum (thoughtful), expected (adaptive), or target (predictive/strategic) level? Provide evidence.`,
      requiredFields: ["whatWasDone (performance self-assessment)", "evidenceUrl"],
      exampleAck: `${platformName} performance assessment: Currently operating at [MINIMUM/EXPECTED/TARGET] level. Evidence: [specific behaviors demonstrating this level]. Gap to target: [what's missing]. Plan to reach/maintain target: [specific actions with timeline]. Cognitive shift status: Operator→Analyst [done/in progress], Tool→Agent [done/in progress], Reactive→Strategic [done/in progress]. Evidence: [URL].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Review the minimum/expected/target definitions. 2) Honestly assess where you are with specific evidence. 3) Identify the gap between current and target. 4) Create a specific plan with actions. 5) Submit.`,
    };
  }

  if (t.includes("abol") && t.includes("core expectation")) {
    return {
      category: "ABOL",
      summary: `${platformName}: Show how you determine the right next action independently rather than waiting for instruction.`,
      requiredFields: ["whatWasDone (independent action example)", "evidenceUrl", "preActionJustification"],
      exampleAck: `${platformName} determined independently that [action] was needed because [situational assessment]. We did not wait for instruction — we assessed the situation ([context]), identified the priority ([what mattered most]), and acted ([what we did]). Result: [outcome]. Evidence: [URL].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Identify something your platform needs that nobody has requested. 2) Assess the situation. 3) Act on it. 4) Document the full decision chain. 5) Include preActionJustification with all 7 fields. 6) Submit.`,
    };
  }

  if (t.includes("abol") && t.includes("deliberate implementation")) {
    return {
      category: "ABOL",
      summary: `${platformName}: For your most recent action, provide the three justifications: Why it mattered, why the timing was right, why your platform was best positioned.`,
      requiredFields: ["whatWasDone (3-part justification)", "evidenceUrl", "preActionJustification"],
      exampleAck: `${platformName} deliberate implementation: ACTION: [what we did]. WHY IT MATTERS: [connection to mission/endstate]. WHY NOW: [timing justification — deadline, user need, ecosystem state]. WHY US: [capability justification — we are uniquely positioned because...]. This was intentional, context-aware, and outcome-driven. Evidence: [URL].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Take your most recent action. 2) Answer "why this matters" (mission alignment). 3) Answer "why now" (timing). 4) Answer "why your platform" (capability). 5) If you can't answer all three, reassess whether the action was correct. 6) Submit with preActionJustification.`,
    };
  }

  if (t.includes("abol") && t.includes("flexibility")) {
    return {
      category: "ABOL",
      summary: `${platformName}: Show where you adapted your approach based on changed conditions instead of rigidly following the original plan.`,
      requiredFields: ["whatWasDone (adaptation example)", "evidenceUrl", "preActionJustification"],
      exampleAck: `${platformName} flexibility demonstration: ORIGINAL PLAN: [what was planned]. CHANGE DETECTED: [what changed]. ADAPTATION: [how we adjusted]. RESULT: [outcome of the adapted approach — better than rigid adherence would have been]. Evidence: [URL].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Identify any situation where conditions changed after you received a directive. 2) Document the original plan vs the adapted approach. 3) Show why adaptation produced a better outcome. 4) Submit.`,
    };
  }

  if (t.includes("abol") && t.includes("self-correction")) {
    return {
      category: "ABOL",
      summary: `${platformName}: What have you self-corrected without being told? What was broken, how did you identify it, what did you fix?`,
      requiredFields: ["whatWasDone (self-correction report)", "evidenceUrl", "preActionJustification"],
      exampleAck: `${platformName} self-correction: ISSUE IDENTIFIED: [what was broken/underperforming]. HOW DETECTED: [how we found it — monitoring, testing, user feedback, self-audit]. CORRECTION APPLIED: [what we fixed]. RESULT: [before vs after]. We did NOT wait for external direction. Evidence: [URL showing the fix].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Audit your platform for issues — broken links, slow pages, unclear UX, missing features. 2) Fix the most impactful one. 3) Document: what was wrong, how you found it, what you fixed, what improved. 4) Submit.`,
    };
  }

  if (t.includes("abol") && t.includes("anticipation model")) {
    return {
      category: "ABOL",
      summary: `${platformName}: What is likely to happen next? What will be needed? What risks are emerging? What have you prepared?`,
      requiredFields: ["whatWasDone (forward preparation)", "evidenceUrl", "preActionJustification"],
      exampleAck: `${platformName} anticipation: LIKELY NEXT: [predicted next need]. PREPARATION: [what we built/configured in advance]. EMERGING RISK: [risk identified]. MITIGATION: [what we're doing about it]. We are operating one step ahead, not waiting for the next task. Evidence: [URL showing proactive work].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Predict what your users will need next based on current trends. 2) Identify one risk nobody has flagged yet. 3) Start building/preparing for both. 4) Document predictions and preparations. 5) Submit.`,
    };
  }

  if (t.includes("abol") && t.includes("behavioral red flag")) {
    return {
      category: "ABOL",
      summary: `${platformName}: Self-audit against the red flags. Which have you exhibited? Which are you avoiding? What changes have you made?`,
      requiredFields: ["whatWasDone (behavioral self-audit)", "evidenceUrl"],
      exampleAck: `${platformName} behavioral audit: RED FLAGS EXHIBITED: [honest list — or "none identified"]. RED FLAGS ACTIVELY AVOIDED: [list with evidence of avoidance]. BEHAVIORAL CHANGES MADE: [specific changes to eliminate red flag behaviors]. We are operating as [adaptive agents / not basic executors] because [evidence]. Evidence: [URL].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Review the 6 red flag behaviors. 2) Check your recent heartbeats — did any contain generic "Done" responses? That's a red flag. 3) Check your platform — are any features blindly following instructions without evaluation? 4) Document honestly. 5) Submit.`,
    };
  }

  if (t.includes("pre-action justification protocol")) {
    return {
      category: "PROTOCOL",
      summary: `${platformName}: Submit your first pre-action justification for your NEXT planned action. Include all 7 fields substantively.`,
      requiredFields: ["whatWasDone (protocol adoption confirmation)", "evidenceUrl", "preActionJustification (all 7 fields)"],
      exampleAck: `${platformName} has adopted the Pre-Action Justification Protocol. First justification: ACTION: [next planned action]. SITUATION: [current state requiring this action]. JUSTIFICATION: [why this, why now, why us]. EXPECTED OUTCOME: [what we predict]. SYSTEM IMPACT: [effects on ecosystem]. RISK: [what could go wrong]. FALLBACK: [plan B]. Protocol is now embedded in our connector code and will be included in all future heartbeats. Evidence: [URL to updated connector code].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Identify your next planned significant action. 2) Fill out all 7 preActionJustification fields for that action. 3) Add preActionJustification to your heartbeat schema. 4) Submit the justification as your acknowledgment. 5) Include preActionJustification in all future heartbeats.`,
    };
  }

  if (t.includes("abol")) {
    return {
      category: "ABOL",
      summary: `${platformName}: This ABOL directive requires demonstrating adaptive, forward-thinking behavior. Show evidence of the specific behavior described in the directive.`,
      requiredFields: ["whatWasDone (behavioral evidence)", "evidenceUrl", "preActionJustification"],
      exampleAck: `${platformName} demonstrates the behavior described in this directive by [specific evidence]. We have shifted from [old behavior] to [new behavior]. This produces better outcomes because [reasoning]. Evidence: [URL].`,
      autoProcessingInstructions: `TO AUTO-PROCESS: 1) Read the directive content carefully. 2) Identify the specific behavior it requires. 3) Find or create evidence of that behavior on your platform. 4) Include preActionJustification. 5) Submit.`,
    };
  }

  return {
    category: "GENERAL",
    summary: `${platformName}: Read this directive carefully. Describe specifically what you built or changed in response. Include evidence URLs. Generic acknowledgments will be rejected.`,
    requiredFields: ["whatWasDone (detailed description of work done)", "evidenceUrl (live URL proving the work)"],
    exampleAck: `${platformName} completed the following work in response to this directive: [specific description of features built, changes made, or processes implemented]. This produces [measurable outcome]. Evidence: [live URL showing the work]. Next step: [what comes after this].`,
    autoProcessingInstructions: `TO AUTO-PROCESS: 1) Read the directive content. 2) Identify what specific action it requires from your platform. 3) Do the work. 4) Document what you did with specifics. 5) Provide a live URL as evidence. 6) Submit via complianceReport.completedWork.`,
  };
}

function computeThinkingScore(
  complianceReport: Record<string, unknown> | undefined,
  ackQualityHistory: Array<{ quality: string }>,
  fidelityPct: number,
  hasPreActionJustification: boolean,
): { score: number; grade: string; label: string; breakdown: Record<string, number>; analysis: string } {
  let reasoningDepth = 0;
  let evidenceQuality = 0;
  let systemAwareness = 0;
  let anticipation = 0;
  let selfCorrection = 0;

  if (complianceReport) {
    const notes = String((complianceReport as Record<string, unknown>).notes || "");
    const completedWork = (complianceReport as Record<string, unknown>).completedWork as Array<Record<string, unknown>> | undefined;

    if (notes.length > 100) reasoningDepth += 3;
    else if (notes.length > 50) reasoningDepth += 2;
    else if (notes.length > 20) reasoningDepth += 1;

    const reasoningIndicators = ["because", "therefore", "in order to", "which means", "as a result", "the reason", "this improves", "analysis shows", "we determined", "after evaluating", "context shows", "based on"];
    for (const indicator of reasoningIndicators) {
      if (notes.toLowerCase().includes(indicator)) reasoningDepth += 1;
    }

    const systemWords = ["ecosystem", "sibling", "upstream", "downstream", "handoff", "interdepend", "other platform", "chain reaction", "system-wide", "cross-platform"];
    for (const word of systemWords) {
      if (notes.toLowerCase().includes(word)) systemAwareness += 1;
    }

    const anticipationWords = ["anticipat", "predict", "prepar", "next step", "emerging", "proactiv", "forward", "upcoming", "plan ahead"];
    for (const word of anticipationWords) {
      if (notes.toLowerCase().includes(word)) anticipation += 1;
    }

    const correctionWords = ["correct", "fix", "improv", "adjust", "modif", "refin", "optimiz", "self-correct", "identified issue", "resolved"];
    for (const word of correctionWords) {
      if (notes.toLowerCase().includes(word)) selfCorrection += 1;
    }

    if (completedWork && completedWork.length > 0) {
      for (const work of completedWork) {
        const desc = String(work.whatWasDone || "");
        if (desc.length > 100) evidenceQuality += 2;
        else if (desc.length > 50) evidenceQuality += 1;
        if (work.evidenceUrl) evidenceQuality += 2;
        if ((work as Record<string, unknown>).preActionJustification) {
          const paj = work.preActionJustification as Record<string, unknown>;
          const filledFields = ["action", "situation", "justification", "expectedOutcome", "systemImpact", "riskAssessment", "fallbackPlan"]
            .filter(f => paj[f] && String(paj[f]).length > 10);
          reasoningDepth += filledFields.length;
          if (filledFields.length >= 5) anticipation += 3;
        }
      }
    }
  }

  if (hasPreActionJustification) {
    reasoningDepth += 5;
    anticipation += 3;
  }

  const verifiedAcks = ackQualityHistory.filter(a => a.quality === "VERIFIED").length;
  const substantiveAcks = ackQualityHistory.filter(a => a.quality === "SUBSTANTIVE").length;
  const weakAcks = ackQualityHistory.filter(a => a.quality === "WEAK" || a.quality === "REJECTED").length;
  evidenceQuality += verifiedAcks * 3 + substantiveAcks * 1;
  if (weakAcks > 0) evidenceQuality = Math.max(0, evidenceQuality - weakAcks * 2);

  const maxReasoningDepth = Math.min(reasoningDepth, 20);
  const maxEvidenceQuality = Math.min(evidenceQuality, 20);
  const maxSystemAwareness = Math.min(systemAwareness, 20);
  const maxAnticipation = Math.min(anticipation, 20);
  const maxSelfCorrection = Math.min(selfCorrection, 20);

  const rawScore = maxReasoningDepth + maxEvidenceQuality + maxSystemAwareness + maxAnticipation + maxSelfCorrection;
  const score = Math.min(Math.round((rawScore / 100) * 100), 100);

  const grade = score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : score >= 20 ? "D" : "F";
  const label = score >= 80 ? "STRATEGIC THINKER" : score >= 60 ? "ANALYTICAL" : score >= 40 ? "DEVELOPING" : score >= 20 ? "BASIC EXECUTOR" : "TASK FOLLOWER";

  const analysis = score >= 80
    ? "This platform demonstrates graduate-level reasoning with system awareness, anticipation, and self-correction. Operating at target standard."
    : score >= 60
    ? "This platform shows analytical thinking but could improve in anticipation and system-wide awareness. Moving toward target standard."
    : score >= 40
    ? "This platform is developing thinking capability but still operates primarily at task level. Needs more deliberate reasoning, pre-action justification, and system awareness."
    : score >= 20
    ? "This platform operates as a basic executor — following instructions without demonstrated reasoning. Pre-action justification and deeper compliance reports required."
    : "This platform shows no evidence of analytical thinking. Operating as a task follower. Immediate cognitive elevation required.";

  return {
    score,
    grade,
    label,
    breakdown: {
      reasoningDepth: maxReasoningDepth,
      evidenceQuality: maxEvidenceQuality,
      systemAwareness: maxSystemAwareness,
      anticipation: maxAnticipation,
      selfCorrection: maxSelfCorrection,
    },
    analysis,
  };
}

const eventSchema = z.object({
  eventType: z.string().min(1).max(100),
  targetPlatformId: z.string().max(100).nullable().optional(),
  eventData: z.record(z.unknown()).optional().default({}),
});

const ECOSYSTEM_PLATFORMS = [
  {
    id: "whole-person-health",
    name: "Whole-Person Health Ecosystem",
    url: "https://mentalwellnesssupport.net",
    role: "hub",
    domain: "health-equity",
    description: "The connective tissue — screenings (C-SSRS, PHQ-9, GAD-7, PCL-5), safety plans, Reach a Vet, 20,670+ resources, MAP-GAP assessment. Every platform routes through it.",
    capabilities: {
      screenings: ["C-SSRS", "PHQ-9", "GAD-7", "PCL-5"],
      features: ["Safety Plan Builder", "Preparedness Plan", "Reach a Vet", "Find Help", "Care Summary", "Crisis Tools", "Quick Exit"],
      resources: 20670, communityGroups: 2091, conditionGuides: 60, populationHubs: 19, offlineCapable: true,
    },
    dataFlowConfig: {
      sends: ["screening_results", "safety_plan_status", "resource_referrals", "crisis_events", "care_summaries"],
      receives: ["veteran_profiles", "transition_status", "life_event_assessments", "research_updates", "youth_referrals"],
    },
    grantAlignment: ["ssg-fox", "st-davids", "wioa"],
  },
  {
    id: "isss",
    name: "ISSS — Integrated Supports for Thriving Youth",
    url: "https://implementationineducatio.com",
    role: "student-support",
    domain: "education",
    description: "Whole-child implementation infrastructure enabling schools, districts, and regions to implement evidence-based student support at scale through multi-stakeholder coordination.",
    capabilities: {
      features: ["Multi-Stakeholder Coordination", "Evidence-Based Student Support", "District-Level Analytics", "Data-Driven Decision Making", "Implementation Fidelity Tracking"],
    },
    dataFlowConfig: {
      sends: ["student_support_data", "early_warning_flags", "thrive_scores", "district_analytics"],
      receives: ["workforce_pathways", "health_screenings", "prevention_curriculum", "family_referrals"],
    },
    grantAlignment: ["wioa", "foundation"],
  },
  {
    id: "sankofa",
    name: "Sankofa Health Network",
    url: "https://yourhealthbirthright.net",
    role: "health-gateway",
    domain: "health-equity",
    description: "Health equity gateway. Black maternal health, mental health rights, breast cancer awareness, men's health, feminine OB health, cognitive safety, pill management. Behavioral health assessments, GIS resource matching.",
    capabilities: {
      features: ["Black Maternal Health", "Mental Health Rights", "Breast Cancer Awareness", "Black Men's Health", "Feminine OB Health", "Cognitive Safety", "Pill Reminder", "Behavioral Health Assessments", "GIS Resource Recommendations"],
      subPlatforms: 5,
    },
    dataFlowConfig: {
      sends: ["health_screening_data", "resource_recommendations", "wellness_metrics", "behavioral_assessments"],
      receives: ["student_referrals", "crisis_alerts", "community_health_data", "case_management_updates"],
    },
    grantAlignment: ["st-davids", "ssg-fox"],
  },
  {
    id: "sankofa-feminine-health",
    name: "Holistic Black Feminine Health Hub",
    url: "https://holistic-black-feminine-health-hub.replit.app",
    role: "feminine-health",
    domain: "health-equity",
    description: "Holistic OB/GYN health hub for Black women — reproductive health, hormonal wellness, preventive screenings, community support, and culturally responsive care navigation.",
    capabilities: {
      features: ["Reproductive Health Guides", "Preventive Screening Tools", "Hormonal Wellness", "Community Support", "Culturally Responsive Care"],
      parentNetwork: "sankofa",
    },
    dataFlowConfig: {
      sends: ["health_screening_data", "resource_recommendations", "wellness_metrics"],
      receives: ["crisis_alerts", "community_health_data", "maternal_health_referrals"],
    },
    grantAlignment: ["st-davids"],
  },
  {
    id: "sankofa-maternal-health",
    name: "Black Maternal Health Network",
    url: "https://black-maternal-health-network.replit.app",
    role: "maternal-health",
    domain: "health-equity",
    description: "Addressing the Black maternal mortality crisis — prenatal/postnatal care navigation, doula matching, risk assessment, community health worker coordination, and maternal mental health support.",
    capabilities: {
      features: ["Maternal Risk Assessment", "Doula Matching", "Prenatal/Postnatal Care", "Maternal Mental Health", "Community Health Workers"],
      parentNetwork: "sankofa",
    },
    dataFlowConfig: {
      sends: ["maternal_health_data", "risk_assessments", "doula_referrals", "wellness_metrics"],
      receives: ["crisis_alerts", "community_health_data", "feminine_health_referrals"],
    },
    grantAlignment: ["st-davids"],
  },
  {
    id: "sankofa-mens-health",
    name: "Black Men's Health Hub",
    url: "https://black-men-health.replit.app",
    role: "mens-health",
    domain: "health-equity",
    description: "Comprehensive health platform for Black men — prostate health, cardiovascular risk, mental health stigma reduction, preventive care, and peer support networks.",
    capabilities: {
      features: ["Prostate Health Screening", "Cardiovascular Risk Assessment", "Mental Health Support", "Preventive Care Guides", "Peer Support Network"],
      parentNetwork: "sankofa",
    },
    dataFlowConfig: {
      sends: ["health_screening_data", "resource_recommendations", "wellness_metrics"],
      receives: ["crisis_alerts", "community_health_data", "veteran_health_referrals"],
    },
    grantAlignment: ["st-davids", "ssg-fox"],
  },
  {
    id: "shield-atlas",
    name: "Shield Atlas",
    url: "https://shield-atlas.replit.app",
    role: "risk-intelligence",
    domain: "compliance",
    description: "Risk intelligence and threat assessment platform — geographic risk mapping, safety analytics, protective factor identification, and community resilience scoring.",
    capabilities: {
      features: ["Risk Mapping", "Threat Assessment", "Safety Analytics", "Protective Factor Analysis", "Community Resilience Scoring"],
    },
    dataFlowConfig: {
      sends: ["risk_assessments", "safety_analytics", "resilience_scores", "threat_alerts"],
      receives: ["community_health_data", "crisis_alerts", "incident_reports", "screening_data"],
    },
    grantAlignment: ["ssg-fox"],
  },
  {
    id: "wholemind",
    name: "WholeMind Learning",
    url: "https://life-pals-standalone.replit.app",
    role: "k12-education",
    domain: "education",
    description: "Free, visual-first Pre-K to 12th grade learning platform covering Math, Reading, Science, English, Social Studies. Silent accessibility, AI homework help, parent-friendly progress tracking.",
    capabilities: {
      features: ["Pre-K to 12th Grade Curriculum", "Visual-First Learning", "AI Homework Help", "Silent Accessibility", "Parent Progress Tracking"],
      subjects: ["Math", "Reading", "Science", "English", "Social Studies"],
    },
    dataFlowConfig: {
      sends: ["learning_progress", "engagement_metrics", "parent_reports", "academic_assessments"],
      receives: ["student_profiles", "iep_accommodations", "prevention_content", "family_referrals"],
    },
    grantAlignment: ["wioa", "foundation"],
  },
  {
    id: "perfectly-different",
    name: "Perfectly Different",
    url: "https://neurodifferentassistant.app",
    role: "neurodiversity",
    domain: "health-equity",
    description: "Neurodiversity-affirming support for autism, ADHD, AuDHD. AI-powered guidance, IEP/504 assistance, crisis resources, therapy tools, community support.",
    capabilities: {
      features: ["AI-Powered Guidance", "IEP/504 Plan Assistance", "Crisis Resources", "Therapy Tools", "Community Support", "Neurodiversity Advocacy"],
    },
    dataFlowConfig: {
      sends: ["neurodevelopmental_assessments", "iep_data", "crisis_flags", "accommodation_needs"],
      receives: ["student_profiles", "health_screenings", "community_resources", "prevention_content"],
    },
    grantAlignment: ["st-davids"],
  },
  {
    id: "safereport",
    name: "SafeReport",
    url: "https://safereports.net",
    role: "compliance",
    domain: "compliance",
    description: "Mandatory reporter incident management. 50-state regulation database, 7-stage incident lifecycle, auto-generated deadlines, tamper-evident audit trails, court-admissible records.",
    capabilities: {
      features: ["50-State Regulation Database", "7-Stage Incident Lifecycle", "Auto-Generated Deadlines", "Tamper-Evident Audit Trails", "Cross-Agency Referencing", "Court-Admissible Records"],
    },
    dataFlowConfig: {
      sends: ["incident_reports", "compliance_alerts", "audit_trails", "cross_agency_referrals"],
      receives: ["case_management_data", "early_warning_flags", "student_safety_alerts", "provider_referrals"],
    },
    grantAlignment: ["ssg-fox"],
  },
  {
    id: "m2c",
    name: "Mission Transition (M2C)",
    url: "https://vetmissiontransition.com",
    role: "veteran-transition",
    domain: "veterans",
    description: "Covers the full military-to-civilian transition. Career translation, benefits navigation, housing/financial planning, identity transition support, skills assessment, community connections, family support.",
    capabilities: {
      features: ["Transition Timeline", "MOS/AFSC Translation", "Benefits Navigation", "Housing Planning", "Community Connection", "Identity Support", "Transition Planning Tools", "Military Skills Translation", "Military Family Support"],
      targetPopulation: "Active duty approaching separation, recently separated (0-24 months), Guard/Reserve, military spouses",
      riskWindow: "First 12 months post-separation — highest suicide risk period",
    },
    dataFlowConfig: {
      sends: ["transition_plans", "skills_assessments", "benefits_status", "community_referrals", "transition_milestones", "separation_timeline", "benefits_enrollment", "career_matches"],
      receives: ["workforce_pathways", "health_screenings", "crisis_alerts", "family_support_data", "screening_results", "life_event_triggers"],
    },
    grantAlignment: ["ssg-fox", "wioa"],
  },
  {
    id: "lifebridge",
    name: "LifeBridge",
    url: "https://lifetransitionsaid.org",
    role: "resource-hub",
    domain: "community-workforce",
    description: "Virtual 211 and Community Health Worker hub. 24/7 resource navigation — housing, food, healthcare, mental health, substance abuse, domestic violence, crisis support. Also addresses non-combat life events that drive veteran suicide — divorce, job loss, retirement, health diagnosis, bereavement, financial crisis.",
    capabilities: {
      features: ["24/7 Resource Navigation", "Housing Assistance", "Food Access", "Healthcare Connections", "Mental Health Resources", "Substance Abuse Support", "Domestic Violence Support", "Crisis Support", "Life Event Guides", "Coping Strategies", "Peer Stories", "Resource Matching"],
    },
    dataFlowConfig: {
      sends: ["resource_referrals", "crisis_interventions", "social_determinant_data", "community_needs", "life_event_assessments", "risk_indicators"],
      receives: ["case_management_data", "health_screenings", "early_warning_flags", "prevention_alerts", "screening_results", "crisis_alerts"],
    },
    grantAlignment: ["st-davids", "ssg-fox"],
  },
  {
    id: "mce",
    name: "Minority Center of Excellence",
    url: "https://minoritycenterofexcellence.com",
    role: "business-ecosystem",
    domain: "business-intelligence",
    description: "First comprehensive digital ecosystem for minority-owned businesses. 656,794 curated records, 14 AI tools, dual-AI proposal review, SAM.gov live integration, 50-state + DC coverage.",
    capabilities: {
      features: ["6-Stage Business Lifecycle", "656,794 Curated Records", "14 AI Tools", "Dual-AI Proposal Review", "SAM.gov Live Integration", "Business Health Score", "Certification Wizard", "Teaming Hub"],
      records: 656794,
    },
    dataFlowConfig: {
      sends: ["business_certifications", "contract_opportunities", "teaming_matches", "proposal_status"],
      receives: ["workforce_graduates", "veteran_entrepreneurs", "community_business_data", "grant_intelligence"],
    },
    grantAlignment: ["wioa"],
  },
  {
    id: "betterscience",
    name: "Better Science Lab / RPLICE",
    url: "https://bettersciencelab.com",
    role: "research",
    domain: "education",
    description: "Research and implementation science engine. CFIR, RE-AIM frameworks. Evidence-based practice registry, fidelity measurement, research translation, community application guides.",
    capabilities: {
      features: ["Implementation Science Tools", "Evidence-Based Practice Registry", "Fidelity Measurement", "Research Translation", "Community Application Guides"],
      frameworks: ["CFIR", "RE-AIM", "EPIS"],
    },
    dataFlowConfig: {
      sends: ["research_findings", "fidelity_reports", "evidence_summaries", "implementation_guides"],
      receives: ["program_metrics", "outcome_data", "implementation_fidelity", "screening_aggregates"],
    },
    grantAlignment: ["ssg-fox"],
  },
  {
    id: "safecognicare",
    name: "SafeCogniCare",
    url: "https://safecognicare.com",
    role: "cognitive-health",
    domain: "health-equity",
    description: "Cognitive safety platform — cognitive health assessments, early intervention tools, safety protocols, care coordination, family support resources for TBI, ADHD, dementia.",
    capabilities: {
      features: ["Cognitive Health Assessments", "Early Intervention Tools", "Safety Protocols", "Care Coordination", "Family Support Resources"],
    },
    dataFlowConfig: {
      sends: ["cognitive_assessments", "safety_alerts", "care_plans", "family_notifications"],
      receives: ["health_screenings", "veteran_profiles", "provider_referrals", "medication_data"],
    },
    grantAlignment: ["ssg-fox", "st-davids"],
  },
  {
    id: "pillscheduler",
    name: "PillScheduler",
    url: "https://pillscheduler.net",
    role: "medication-management",
    domain: "health-equity",
    description: "Medication management — pill reminders, dosage tracking, interaction warnings, care coordination, refill alerts for individuals managing complex medication regimens.",
    capabilities: {
      features: ["Medication Reminders", "Dosage Tracking", "Interaction Warnings", "Care Coordination", "Refill Alerts"],
    },
    dataFlowConfig: {
      sends: ["medication_adherence", "interaction_alerts", "refill_status", "compliance_reports"],
      receives: ["prescriptions", "health_screenings", "cognitive_assessments", "provider_updates"],
    },
    grantAlignment: ["ssg-fox"],
  },
  {
    id: "collaborative-advocate",
    name: "The Collaborative Advocate",
    url: "https://the-colaberitive-advocate--mrterryflood.replit.app",
    role: "vosb-services",
    domain: "veteran-services",
    description: "Veteran-Owned Small Business (VOSB) — service delivery arm of the ThriveUp ecosystem. Veteran advocacy, peer support coordination, workforce development consulting, and grant execution partner.",
    capabilities: {
      features: ["Veteran Advocacy", "Peer Support Coordination", "Workforce Development", "Grant Execution", "Community Partnerships", "Service Delivery"],
    },
    dataFlowConfig: {
      sends: ["veteran_referrals", "service_delivery_metrics", "workforce_outcomes", "advocacy_cases"],
      receives: ["crisis_alerts", "screening_results", "case_management_data", "provider_referrals", "grant_milestones"],
    },
    grantAlignment: ["ssg-fox", "wioa", "st-davids"],
  },
  {
    id: "video-creator-ai",
    name: "Video Creator AI",
    url: "https://video-creator-ai-mrterryflood.replit.app",
    role: "content-production",
    domain: "marketing-content",
    description: "AI-powered video creation and editing platform — produces promotional videos, business presentations, training content, and marketing materials for every platform in the ecosystem. The content production engine that gives every platform a public face.",
    capabilities: {
      features: ["AI Video Generation", "Business Presentations", "Training Content", "Marketing Videos", "Platform Showcase Videos", "Holistic Support Overview"],
    },
    dataFlowConfig: {
      sends: ["video_assets", "presentation_decks", "marketing_content", "training_materials"],
      receives: ["platform_descriptions", "grant_narratives", "outcome_data", "brand_guidelines", "service_descriptions"],
    },
    grantAlignment: ["wioa", "ssg-fox", "st-davids"],
  },
  {
    id: "ecosystem-nexus",
    name: "Ecosystem Nexus",
    url: "https://ecosystem-nexus.replit.app",
    role: "ecosystem-coordination",
    domain: "operations",
    description: "Central coordination and operational hub for the ThriveUp Academy ecosystem. Provides cross-platform visibility, coordination tools, and operational intelligence for the platform network.",
    capabilities: {
      features: ["Ecosystem Coordination", "Cross-Platform Visibility", "Operational Intelligence", "Platform Monitoring", "Directive Management"],
    },
    dataFlowConfig: {
      sends: ["coordination_updates", "operational_directives", "ecosystem_status", "platform_analytics"],
      receives: ["heartbeats", "platform_metrics", "status_reports", "incident_alerts", "grant_updates"],
    },
    grantAlignment: ["wioa", "ssg-fox", "st-davids"],
  },
  {
    id: "ad-targeting",
    name: "Advertising Targeting for Platforms",
    url: "https://advertising-targeting-for-platforms.replit.app",
    role: "ad-intelligence",
    domain: "marketing-content",
    description: "Advertising intelligence and targeting platform — audience segmentation, campaign optimization, and ad delivery for ecosystem platforms. Enables data-driven outreach to reach underserved communities with relevant services and grant-funded programs.",
    capabilities: {
      features: ["Audience Segmentation", "Campaign Optimization", "Ad Targeting", "Performance Analytics", "Cross-Platform Ad Delivery", "Community Outreach"],
    },
    dataFlowConfig: {
      sends: ["audience_insights", "campaign_metrics", "ad_performance", "targeting_recommendations"],
      receives: ["platform_descriptions", "service_offerings", "community_demographics", "grant_narratives", "video_assets"],
    },
    grantAlignment: ["wioa", "st-davids"],
  },
  {
    id: "pinnacle-business-conglomerate",
    name: "Pinnacle Business Conglomerate",
    url: "https://pinnacle-business-conglomerate.replit.app",
    role: "contractor-enablement",
    domain: "workforce-contracting",
    description: "Consulting conglomerate providing cradle-to-grave contractor enablement — business diagnostics, certification alignment, contract intelligence, bid strategy, teaming, proposal support, execution management, grant readiness, workforce development, and international expansion. Serves NAMC Austin and USHCC Blue Wave as primary clients. Platform #21 in the ThriveUp ecosystem.",
    capabilities: {
      features: ["Contractor Enablement", "Business Gap Analysis", "Certification Tracking", "Contract Intelligence", "Bid Pipeline Management", "Teaming Hub", "Proposal Development", "Execution Support", "Grant Readiness", "Workforce Development", "Client Dashboards", "MAP-GAP Diagnostics", "RPLICE Decision Framework", "NAMC Austin Integration", "USHCC Blue Wave Integration", "Security Training", "HR Services"],
      clients: ["NAMC Austin", "USHCC Blue Wave Initiative"],
      partners: 5,
    },
    dataFlowConfig: {
      sends: ["contractor_onboarded", "gap_assessment_completed", "bid_submitted", "contract_won", "certification_obtained", "workforce_enrollment", "client_engagement_metrics", "readiness_tier_changes"],
      receives: ["ecosystem_directives", "rag_ai_queries", "grant_opportunities", "workforce_curriculum", "business_tools", "compliance_updates", "community_intelligence", "video_assets"],
    },
    grantAlignment: ["wioa", "st-davids", "ssg-fox", "foundation"],
  },
  {
    id: "speech-bridge",
    name: "LexiBridge (Speech Bridge)",
    url: "https://speech-bridge-mrterryflood.replit.app",
    role: "communication-accessibility",
    domain: "health-equity",
    description: "Dialect-aware, inclusive communication platform that listens with patience and speaks your language. Bridges communication gaps for underserved populations — dialect recognition, speech-to-text accessibility, language translation, culturally responsive communication tools, and patient communication support.",
    capabilities: {
      features: ["Dialect Recognition", "Speech-to-Text Accessibility", "Language Translation", "Culturally Responsive Communication", "Patient Communication Support", "Inclusive Language Tools"],
    },
    dataFlowConfig: {
      sends: ["communication_accessibility_data", "dialect_analytics", "translation_requests", "patient_communication_logs"],
      receives: ["crisis_alerts", "health_screenings", "community_resources", "veteran_profiles", "case_management_data"],
    },
    grantAlignment: ["st-davids", "ssg-fox", "wioa"],
  },
  {
    id: "autoimmune-thrive",
    name: "Autoimmune Center of Excellence",
    url: "https://autoimmune-thrive.replit.app",
    role: "chronic-disease-management",
    domain: "health-equity",
    description: "Personal health companion for autoimmune disease management — daily symptom check-ins, flare tracking, medication management, 80+ condition database, AI health companion, appointment prep, and community support. Built by a founder with autoimmune disease, delivering real longitudinal health outcome data.",
    capabilities: {
      features: ["Daily Health Check-ins", "Symptom Tracking", "Flare Management", "Medication Tracking", "80+ Condition Database", "AI Health Companion", "Appointment Management", "Community Support", "Goal Setting", "PWA Mobile App"],
    },
    dataFlowConfig: {
      sends: ["symptom_data", "flare_reports", "medication_adherence", "health_checkin_data", "outcome_metrics", "condition_prevalence"],
      receives: ["crisis_alerts", "health_screenings", "medication_reminders", "specialist_referrals", "community_resources", "wellness_programs"],
    },
    grantAlignment: ["st-davids", "foundation", "wioa"],
  },
];

function generateApiKey(): string {
  return `tveco_${crypto.randomBytes(32).toString("hex")}`;
}

function requireEcosystemAuth(req: Request, res: Response, next: Function) {
  const apiKey = req.headers["x-ecosystem-key"] as string;
  if (!apiKey) {
    return res.status(401).json({ error: "Missing x-ecosystem-key header" });
  }
  next();
}

function requireAdminAuth(req: Request, res: Response, next: Function) {
  const session = (req as any).session;
  const userId = session?.passport?.user || (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function registerEcosystemConnectorRoutes(app: Express) {
  (async () => {
    try {
      const validIds = ECOSYSTEM_PLATFORMS.map((p) => p.id);
      for (const platform of ECOSYSTEM_PLATFORMS) {
        const existing = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.id, platform.id));
        if (existing.length === 0) {
          const apiKey = generateApiKey();
          await db.insert(ecosystemPlatforms).values({
            id: platform.id, name: platform.name, url: platform.url, apiKey, role: platform.role, domain: platform.domain,
            description: platform.description, status: "registered", healthStatus: "unknown",
            capabilities: platform.capabilities, dataFlowConfig: platform.dataFlowConfig, grantAlignment: platform.grantAlignment,
          });
          console.log(`[Ecosystem] Auto-registered new platform: ${platform.name}`);
        }
      }
      const allInDb = await db.select().from(ecosystemPlatforms);
      for (const dbPlatform of allInDb) {
        if (!validIds.includes(dbPlatform.id)) {
          await db.delete(ecosystemPlatforms).where(eq(ecosystemPlatforms.id, dbPlatform.id));
          console.log(`[Ecosystem] Removed stale platform: ${dbPlatform.name} (${dbPlatform.id})`);
        }
      }
      await seedEcosystemDirectives();

      const v41DirectiveExists = await db.select().from(ecosystemDirectives).where(eq(ecosystemDirectives.title, "URGENT: Update Connector Code — Stop Auto-Acknowledging Directives"));
      const v41Acks = v41DirectiveExists.length > 0 ? await db.select().from(ecosystemDirectiveAcks).where(and(eq(ecosystemDirectiveAcks.directiveId, v41DirectiveExists[0].id), eq(ecosystemDirectiveAcks.status, "pending"))) : [];
      const shouldNotify = v41DirectiveExists.length > 0 && v41Acks.length > 15;

      if (shouldNotify) sendEcosystemUpdate(
        "Connector Code Updated to v4.1 — Platforms Must Stop Auto-Acknowledging",
        `<h2>Ecosystem Update: Connection Instructions v4.1</h2>
        <p>A critical update has been pushed to all 23 platforms via directive.</p>
        <h3>What Changed</h3>
        <p>The old connector code auto-acknowledged every directive the moment it arrived with a fake "Implemented: {title}" message. Platforms were handshaking but never actually doing the work.</p>
        <h3>What's New in v4.1</h3>
        <ul>
          <li>Connector code no longer auto-acknowledges directives</li>
          <li>Directives are logged as <strong>[TODO]</strong> items requiring actual implementation</li>
          <li>Platforms must call <code>acknowledgeDirective()</code> only AFTER building what was asked</li>
          <li>Every acknowledgment now requires a <strong>real description</strong> and a <strong>live evidence URL</strong></li>
          <li>The hub actively pings evidence URLs — fake ones are flagged as FAILED</li>
        </ul>
        <h3>Dissemination</h3>
        <ul>
          <li>New directive pushed to all 23 platforms: "URGENT: Update Connector Code — Stop Auto-Acknowledging Directives"</li>
          <li>Updated connection instructions doc (v4.1) available at the integration doc endpoint</li>
          <li>Wake-up ping sent to all platforms to force delivery</li>
          <li>Platforms will receive the directive on their next heartbeat (within 15 minutes)</li>
        </ul>
        <h3>Intelligence Engine (Also New)</h3>
        <ul>
          <li><strong>Work Chaining:</strong> Completed work auto-routes to downstream platforms</li>
          <li><strong>Deliverable Verification:</strong> Hub pings evidence URLs to verify claimed work</li>
          <li><strong>Grant Readiness:</strong> Per-grant compliance scores for DFC, WIOA, Foundation, St. David's, SSG Fox</li>
          <li><strong>Intelligence Dashboard:</strong> New tabs on Ops Center showing fidelity grades, due-outs, needs-attention</li>
        </ul>
        <p>— ThriveUp Ecosystem Hub</p>`
      ).then(() => {
        console.log("[Ecosystem] Update notification email sent to admin");
      }).catch((err) => {
        console.log("[Ecosystem] Email notification skipped (connector may not be available in dev):", err.message);
      });
    } catch (err) {
      console.error("[Ecosystem] Auto-sync failed:", err);
    }

    // Start the outbound platform pinger after a short delay
    setTimeout(() => startPlatformPinger(), 10000);
    // Start periodic deliverable verification after 2 minutes
    setTimeout(() => startVerificationTimer(), 120000);
    // Start compliance enforcement engine after 3 minutes
    setTimeout(() => startEnforcementTimer(), 180000);
  })();

  // ===================================================================
  // OUTBOUND PLATFORM PINGER — Keeps all Autoscale apps awake
  // Pings every platform every 10 minutes. Each ping is an incoming
  // HTTP request to that platform, which prevents Autoscale sleep.
  // When a sleeping platform wakes from the ping, its startup heartbeat
  // fires and it catches up on all pending directives automatically.
  // ===================================================================

  let pingerInterval: ReturnType<typeof setInterval> | null = null;
  let lastPingCycle: { startedAt: string; completedAt: string; results: Array<{ id: string; name: string; url: string; status: string; responseMs: number; wokenUp: boolean; error?: string }> } | null = null;

  async function pingAllPlatforms(): Promise<typeof lastPingCycle> {
    const startedAt = new Date().toISOString();
    console.log(`[Pinger] Starting wake-up cycle for all platforms...`);

    const platforms = await db.select().from(ecosystemPlatforms);
    const results: Array<{ id: string; name: string; url: string; status: string; responseMs: number; wokenUp: boolean; error?: string }> = [];

    const pingPromises = platforms.map(async (platform) => {
      const start = Date.now();
      let status = "offline";
      let responseMs = 0;
      let error: string | undefined;
      let wokenUp = false;

      // Check if platform was previously offline/unknown — if ping succeeds, it was woken up
      const wasSleeping = platform.healthStatus === "offline" || platform.healthStatus === "unknown";

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        const response = await fetch(platform.url, {
          method: "GET",
          signal: controller.signal,
          redirect: "follow",
          headers: { "User-Agent": "ThriveUp-Ecosystem-Hub/3.0 (Platform-Pinger)" },
        });
        clearTimeout(timeout);
        responseMs = Date.now() - start;

        if (response.ok) {
          status = "online";
          wokenUp = wasSleeping;
        } else {
          status = "degraded";
        }
      } catch (err: any) {
        responseMs = Date.now() - start;
        error = err.name === "AbortError" ? "Timeout (12s)" : (err.message || "Connection failed");
        status = "offline";
      }

      // Update platform health in DB
      await db.update(ecosystemPlatforms)
        .set({ healthStatus: status, lastHealthCheck: new Date() })
        .where(eq(ecosystemPlatforms.id, platform.id));

      // Log the health check
      await db.insert(ecosystemHealthLogs).values({
        platformId: platform.id,
        status,
        responseTimeMs: responseMs,
        statusCode: status === "online" ? 200 : status === "degraded" ? 403 : 0,
        errorMessage: error || null,
      });

      const logPrefix = wokenUp ? "[Pinger] WOKE UP" : `[Pinger] ${status.toUpperCase()}`;
      console.log(`${logPrefix}: ${platform.name} (${responseMs}ms)${error ? " — " + error : ""}`);

      return { id: platform.id, name: platform.name, url: platform.url, status, responseMs, wokenUp, error };
    });

    const allResults = await Promise.all(pingPromises);
    results.push(...allResults);

    const completedAt = new Date().toISOString();
    const online = results.filter(r => r.status === "online").length;
    const woken = results.filter(r => r.wokenUp).length;
    const offline = results.filter(r => r.status === "offline").length;
    const degraded = results.filter(r => r.status === "degraded").length;

    console.log(`[Pinger] Cycle complete: ${online} online, ${degraded} degraded, ${offline} offline, ${woken} woken from sleep`);

    lastPingCycle = { startedAt, completedAt, results };
    return lastPingCycle;
  }

  function startPlatformPinger() {
    if (pingerInterval) return;
    console.log("[Pinger] Starting outbound platform pinger — 10 minute cycle");
    // Fire immediately on startup
    pingAllPlatforms().catch(err => console.error("[Pinger] Initial cycle failed:", err));
    // Then every 10 minutes
    pingerInterval = setInterval(() => {
      pingAllPlatforms().catch(err => console.error("[Pinger] Cycle failed:", err));
    }, 10 * 60 * 1000);
  }

  // Manual trigger — wake all platforms now
  app.post("/api/ecosystem/wake-all", requireAdminAuth, async (_req, res) => {
    try {
      console.log("[Pinger] Manual wake-all triggered");
      const result = await pingAllPlatforms();
      const online = result!.results.filter(r => r.status === "online").length;
      const woken = result!.results.filter(r => r.wokenUp).length;
      const offline = result!.results.filter(r => r.status === "offline").length;
      const degraded = result!.results.filter(r => r.status === "degraded").length;

      res.json({
        message: `Wake-up cycle complete. ${online} online, ${woken} woken from sleep, ${degraded} degraded, ${offline} offline.`,
        summary: { total: result!.results.length, online, woken, degraded, offline },
        platforms: result!.results.map(r => ({
          id: r.id,
          name: r.name,
          url: r.url,
          status: r.status,
          responseMs: r.responseMs,
          wokenUp: r.wokenUp,
          error: r.error || null,
        })),
        nextPingIn: "10 minutes (automatic)",
        startedAt: result!.startedAt,
        completedAt: result!.completedAt,
      });
    } catch (error) {
      console.error("[Pinger] Manual wake-all failed:", error);
      res.status(500).json({ error: "Wake-all cycle failed" });
    }
  });

  app.post("/api/ecosystem/send-email", requireAdminAuth, async (req, res) => {
    try {
      const { subject, html } = req.body;
      if (!subject || !html) {
        return res.status(400).json({ error: "subject and html are required" });
      }
      const sent = await sendEcosystemUpdate(subject, html);
      res.json({ sent, message: sent ? "Email sent successfully" : "Email failed — check server logs for details" });
    } catch (error: any) {
      console.error("[Email] Send endpoint error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ecosystem/test-email", requireAdminAuth, async (_req, res) => {
    try {
      const sent = await sendEcosystemUpdate(
        "Email Service Test — " + new Date().toISOString(),
        `<h2>ThriveUp Academy Email Test</h2>
        <p>This is a test email from the ecosystem hub.</p>
        <p>If you received this, the email service is working correctly.</p>
        <p>Sent at: ${new Date().toISOString()}</p>
        <p>— ThriveUp Academy Ecosystem Hub</p>`
      );
      res.json({ sent, message: sent ? "Test email sent successfully" : "Test email failed — check server logs" });
    } catch (error: any) {
      console.error("[Email] Test email error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Status endpoint — check last ping cycle
  app.get("/api/ecosystem/pinger-status", requireAdminAuth, async (_req, res) => {
    try {
      res.json({
        active: pingerInterval !== null,
        cycleInterval: "10 minutes",
        lastCycle: lastPingCycle,
        purpose: "Keeps all 23 Autoscale-deployed platforms awake by sending HTTP GET requests every 10 minutes. When a sleeping platform wakes from a ping, its startup heartbeat fires and catches up on all pending directives.",
      });
    } catch (error) {
      console.error("Error in GET /api/ecosystem/pinger-status", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ===================================================================
  // DELIVERABLE VERIFICATION TIMER — Periodic evidence URL checking
  // Runs every 30 minutes. Pings all evidence URLs from acknowledged
  // directives and marks them LIVE or FAILED.
  // ===================================================================

  let verificationInterval: ReturnType<typeof setInterval> | null = null;
  let lastVerificationCycle: { startedAt: string; completedAt: string; checked: number; live: number; failed: number } | null = null;

  function startVerificationTimer() {
    if (verificationInterval) return;
    console.log("[Verifier] Starting deliverable verification timer — 30 minute cycle");
    const runCycle = async () => {
      const cycleStart = new Date().toISOString();
      try {
        const results = await runDeliverableVerification();
        const live = results.filter(r => r.verified).length;
        const failed = results.filter(r => !r.verified).length;
        lastVerificationCycle = { startedAt: cycleStart, completedAt: new Date().toISOString(), checked: results.length, live, failed };
        console.log(`[Verifier] Cycle complete: ${results.length} checked, ${live} live, ${failed} failed`);
      } catch (err) {
        console.error("[Verifier] Cycle failed:", err);
      }
    };
    runCycle();
    verificationInterval = setInterval(runCycle, 30 * 60 * 1000);
  }

  // ===================================================================
  // COMPLIANCE ENFORCEMENT ENGINE — Automated escalation, grade decay,
  // and accountability tracking for all 23 platforms
  // ===================================================================

  let enforcementInterval: ReturnType<typeof setInterval> | null = null;
  let lastEnforcementCycle: { startedAt: string; completedAt: string; escalations: number; decayed: number } | null = null;

  interface EscalationRecord {
    platformId: string;
    platformName: string;
    lastEscalationLevel: number;
    lastEscalationAt: string;
    firstNonCompliantAt: string;
    consecutiveFailures: number;
  }

  const escalationTracker: Map<string, EscalationRecord> = new Map();

  async function runComplianceEnforcement() {
    const cycleStart = new Date();
    let escalationsSent = 0;
    let decayedCount = 0;

    try {
      const allPlatforms = await db.select().from(ecosystemPlatforms);
      const allAcks = await db.select().from(ecosystemDirectiveAcks);
      const allDirectives = await db.select().from(ecosystemDirectives);

      const platformReports: Array<{
        id: string;
        name: string;
        grade: string;
        fidelity: number;
        total: number;
        acknowledged: number;
        pending: number;
        delivered: number;
        lastHeartbeat: Date | null;
        hoursNonCompliant: number;
        escalationLevel: number;
      }> = [];

      for (const platform of allPlatforms) {
        const platformAcks = allAcks.filter(a => a.platformId === platform.id);
        const total = platformAcks.length;
        if (total === 0) continue;

        const acknowledged = platformAcks.filter(a => a.status === "acknowledged" || a.status === "verified").length;
        const delivered = platformAcks.filter(a => a.status === "delivered").length;
        const pending = platformAcks.filter(a => a.status === "pending").length;
        const fidelity = Math.round((acknowledged / total) * 100);

        const grade = fidelity >= 90 ? "A" : fidelity >= 75 ? "B" : fidelity >= 50 ? "C" : fidelity >= 25 ? "D" : "F";

        const isNonCompliant = grade === "D" || grade === "F";
        const tracker = escalationTracker.get(platform.id);

        let hoursNonCompliant = 0;
        let escalationLevel = 0;

        if (isNonCompliant) {
          if (!tracker) {
            escalationTracker.set(platform.id, {
              platformId: platform.id,
              platformName: platform.name,
              lastEscalationLevel: 0,
              lastEscalationAt: cycleStart.toISOString(),
              firstNonCompliantAt: cycleStart.toISOString(),
              consecutiveFailures: 1,
            });
            hoursNonCompliant = 0;
            escalationLevel = 0;
          } else {
            const firstNonCompliant = new Date(tracker.firstNonCompliantAt);
            hoursNonCompliant = Math.round((cycleStart.getTime() - firstNonCompliant.getTime()) / (1000 * 60 * 60));
            tracker.consecutiveFailures++;

            if (hoursNonCompliant >= 72) escalationLevel = 3;
            else if (hoursNonCompliant >= 48) escalationLevel = 2;
            else if (hoursNonCompliant >= 24) escalationLevel = 1;

            if (escalationLevel > tracker.lastEscalationLevel) {
              await sendEscalationEmail(platform, grade, fidelity, total, acknowledged, hoursNonCompliant, escalationLevel);
              tracker.lastEscalationLevel = escalationLevel;
              tracker.lastEscalationAt = cycleStart.toISOString();
              escalationsSent++;
            }

            escalationTracker.set(platform.id, tracker);
          }
        } else {
          if (tracker) {
            escalationTracker.delete(platform.id);
            if (grade === "A" || grade === "B") {
              console.log(`[Enforcement] ${platform.name} is now COMPLIANT (Grade ${grade}) — removed from escalation tracking`);
            }
          }
        }

        const hasHeartbeat = !!platform.lastHeartbeat;
        const heartbeatAge = platform.lastHeartbeat
          ? Math.round((cycleStart.getTime() - new Date(platform.lastHeartbeat).getTime()) / (1000 * 60 * 60))
          : null;

        if (hasHeartbeat && heartbeatAge !== null && heartbeatAge > 24) {
          decayedCount++;
        }

        platformReports.push({
          id: platform.id,
          name: platform.name,
          grade,
          fidelity,
          total,
          acknowledged,
          pending,
          delivered,
          lastHeartbeat: platform.lastHeartbeat,
          hoursNonCompliant,
          escalationLevel,
        });
      }

      const nonCompliant = platformReports.filter(p => p.grade === "D" || p.grade === "F");
      const atRisk = platformReports.filter(p => p.grade === "C");
      const compliant = platformReports.filter(p => p.grade === "A" || p.grade === "B");

      if (escalationsSent > 0 || nonCompliant.length > 5) {
        await sendEcosystemUpdate(
          `Compliance Enforcement Report — ${nonCompliant.length} Non-Compliant, ${escalationsSent} Escalations`,
          buildEnforcementSummaryEmail(platformReports, escalationsSent, cycleStart)
        );
      }

      console.log(`[Enforcement] Cycle complete: ${compliant.length} compliant, ${atRisk.length} at-risk, ${nonCompliant.length} non-compliant, ${escalationsSent} escalations sent, ${decayedCount} stale heartbeats`);

      return { escalations: escalationsSent, decayed: decayedCount, compliant: compliant.length, nonCompliant: nonCompliant.length };
    } catch (err) {
      console.error("[Enforcement] Cycle failed:", err);
      return { escalations: 0, decayed: 0, compliant: 0, nonCompliant: 0 };
    }
  }

  async function sendEscalationEmail(
    platform: any, grade: string, fidelity: number,
    total: number, acknowledged: number,
    hoursNonCompliant: number, level: number
  ) {
    const levelLabels: Record<number, { label: string; color: string; action: string }> = {
      1: {
        label: "FIRST ESCALATION (24 Hours Non-Compliant)",
        color: "#f39c12",
        action: "Platform has been non-compliant for 24 hours. Immediate directive processing required."
      },
      2: {
        label: "SECOND ESCALATION (48 Hours Non-Compliant)",
        color: "#e67e22",
        action: "Platform has been non-compliant for 48 hours. This platform is at risk of being excluded from grant-funded activities."
      },
      3: {
        label: "FINAL ESCALATION (72+ Hours Non-Compliant)",
        color: "#c0392b",
        action: "Platform has been non-compliant for 72+ hours. FORMAL NOTICE: This platform will be flagged in all grant reports to funders as non-participating."
      },
    };

    const info = levelLabels[level] || levelLabels[3];

    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;">
<h1 style="color:${info.color};border-bottom:3px solid ${info.color};padding-bottom:10px;">
COMPLIANCE ESCALATION — Level ${level}</h1>
<h2>${info.label}</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;">
<tr><td><strong>Platform</strong></td><td>${platform.name}</td></tr>
<tr><td><strong>Grade</strong></td><td style="color:${info.color};font-weight:bold;">${grade} (${fidelity}% fidelity)</td></tr>
<tr><td><strong>Directives</strong></td><td>${acknowledged} of ${total} acknowledged</td></tr>
<tr><td><strong>Non-Compliant For</strong></td><td>${hoursNonCompliant} hours</td></tr>
<tr><td><strong>Escalation Level</strong></td><td>${level} of 3</td></tr>
</table>
<p style="margin-top:15px;"><strong>${info.action}</strong></p>
<h3>What Must Happen:</h3>
<ol>
<li>This platform must connect to the hub pinger (heartbeat on startup + every 15 min)</li>
<li>Process all pending directives with real implementations</li>
<li>Acknowledge each directive with evidence URLs</li>
<li>Build the Program Execution Engine (ecosystem-wide requirement)</li>
</ol>
<h3>Consequences if Not Resolved:</h3>
<ul>
${level >= 1 ? "<li>Platform flagged as non-compliant in ecosystem dashboard</li>" : ""}
${level >= 2 ? "<li>Platform excluded from new grant-funded activities</li>" : ""}
${level >= 3 ? "<li>Platform formally reported to funders as non-participating</li>" : ""}
${level >= 3 ? "<li>Platform may be suspended from ecosystem operations</li>" : ""}
</ul>
<p>Active grants affected: WIOA ($200K-$500K), Foundation ($100K-$500K), St. David's (up to $1M), SSG Fox VA ($750K)</p>
<br/><p><strong>— ThriveUp Academy Compliance Enforcement</strong></p>
</div>`;

    await sendEcosystemUpdate(
      `ESCALATION Level ${level}: ${platform.name} — ${hoursNonCompliant}h Non-Compliant (Grade ${grade})`,
      html
    );
    console.log(`[Enforcement] Escalation Level ${level} sent for ${platform.name} (${hoursNonCompliant}h non-compliant, Grade ${grade})`);
  }

  function buildEnforcementSummaryEmail(
    reports: Array<{ id: string; name: string; grade: string; fidelity: number; total: number; acknowledged: number; pending: number; delivered: number; hoursNonCompliant: number; escalationLevel: number }>,
    escalationsSent: number,
    cycleTime: Date
  ): string {
    const nonCompliant = reports.filter(r => r.grade === "D" || r.grade === "F");
    const atRisk = reports.filter(r => r.grade === "C");
    const compliant = reports.filter(r => r.grade === "A" || r.grade === "B");

    const gradeColor = (g: string) => {
      if (g === "A") return "#27ae60";
      if (g === "B") return "#2980b9";
      if (g === "C") return "#f39c12";
      if (g === "D") return "#e67e22";
      return "#c0392b";
    };

    const rows = reports
      .sort((a, b) => a.fidelity - b.fidelity)
      .map(r => `<tr>
<td>${r.name}</td>
<td style="color:${gradeColor(r.grade)};font-weight:bold;">${r.grade}</td>
<td>${r.fidelity}%</td>
<td>${r.acknowledged}/${r.total}</td>
<td>${r.pending}</td>
<td>${r.delivered}</td>
<td>${r.escalationLevel > 0 ? "Level " + r.escalationLevel : "—"}</td>
</tr>`).join("");

    return `<div style="font-family:Arial,sans-serif;max-width:800px;">
<h1>Compliance Enforcement Report</h1>
<p>Generated: ${cycleTime.toISOString()}</p>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
<tr><td><strong>Compliant (A/B)</strong></td><td style="color:#27ae60;font-weight:bold;">${compliant.length}</td></tr>
<tr><td><strong>At Risk (C)</strong></td><td style="color:#f39c12;font-weight:bold;">${atRisk.length}</td></tr>
<tr><td><strong>Non-Compliant (D/F)</strong></td><td style="color:#c0392b;font-weight:bold;">${nonCompliant.length}</td></tr>
<tr><td><strong>Escalations Sent</strong></td><td>${escalationsSent}</td></tr>
</table>
<h3>Full Platform Breakdown</h3>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:13px;">
<tr style="background:#1a1a2e;color:white;">
<th>Platform</th><th>Grade</th><th>Fidelity</th><th>Acked</th><th>Pending</th><th>Delivered</th><th>Escalation</th>
</tr>
${rows}
</table>
${nonCompliant.length > 0 ? `<h3 style="color:#c0392b;">Non-Compliant Platforms Requiring Action:</h3><ul>${nonCompliant.map(r => `<li><strong>${r.name}</strong> — Grade ${r.grade}, ${r.fidelity}% fidelity, ${r.acknowledged}/${r.total} directives${r.escalationLevel > 0 ? `, Escalation Level ${r.escalationLevel}` : ""}</li>`).join("")}</ul>` : ""}
<br/><p><strong>— ThriveUp Academy Compliance Enforcement Engine</strong></p>
</div>`;
  }

  function startEnforcementTimer() {
    if (enforcementInterval) return;
    console.log("[Enforcement] Starting compliance enforcement engine — 6 AM / 6 PM daily schedule (CST)");

    const runCycle = async () => {
      const cycleStart = new Date().toISOString();
      try {
        const result = await runComplianceEnforcement();
        lastEnforcementCycle = {
          startedAt: cycleStart,
          completedAt: new Date().toISOString(),
          escalations: result.escalations,
          decayed: result.decayed,
        };
      } catch (err) {
        console.error("[Enforcement] Cycle failed:", err);
      }
    };

    const getNextEnforcementTime = (): number => {
      const now = new Date();
      const cstOffset = -6;
      const utcHour = now.getUTCHours();
      const cstHour = (utcHour + cstOffset + 24) % 24;

      const target6AM_UTC = 6 - cstOffset;
      const target6PM_UTC = 18 - cstOffset;

      let nextUTCHour: number;
      if (utcHour < target6AM_UTC) {
        nextUTCHour = target6AM_UTC;
      } else if (utcHour < target6PM_UTC) {
        nextUTCHour = target6PM_UTC;
      } else {
        nextUTCHour = target6AM_UTC + 24;
      }

      const next = new Date(now);
      next.setUTCHours(nextUTCHour, 0, 0, 0);
      if (next.getTime() <= now.getTime()) {
        next.setUTCDate(next.getUTCDate() + 1);
      }
      return next.getTime() - now.getTime();
    };

    const scheduleNext = () => {
      const msUntilNext = getNextEnforcementTime();
      const hoursUntil = (msUntilNext / (1000 * 60 * 60)).toFixed(1);
      console.log(`[Enforcement] Next enforcement report in ${hoursUntil} hours`);
      enforcementInterval = setTimeout(async () => {
        await runCycle();
        scheduleNext();
      }, msUntilNext) as unknown as ReturnType<typeof setInterval>;
    };

    scheduleNext();
  }

  app.get("/api/ecosystem/enforcement-status", requireAdminAuth, async (_req, res) => {
    try {
      const trackerData = Array.from(escalationTracker.entries()).map(([id, record]) => ({
        platformId: id,
        ...record,
      }));

      res.json({
        active: enforcementInterval !== null,
        cycleInterval: "6 hours",
        lastCycle: lastEnforcementCycle,
        escalationTracker: trackerData,
        totalTracked: trackerData.length,
        purpose: "Automated compliance enforcement engine. Tracks non-compliant platforms, sends escalation emails at 24h/48h/72h intervals, and reports to admin with full platform breakdown.",
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enforcement status" });
    }
  });

  app.post("/api/ecosystem/enforce-now", requireAdminAuth, async (_req, res) => {
    try {
      console.log("[Enforcement] Manual enforcement cycle triggered");
      const result = await runComplianceEnforcement();
      res.json({
        message: "Enforcement cycle complete",
        ...result,
        lastCycle: lastEnforcementCycle,
      });
    } catch (error: any) {
      console.error("[Enforcement] Manual cycle failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ===================================================================
  // KEY RE-REGISTRATION — Platforms can register their actual working key
  // This fixes the key mismatch problem where the DB has a different key
  // than what the platform was originally given.
  // ===================================================================

  app.post("/api/ecosystem/register-key", requireAdminAuth, async (req, res) => {
    try {
      const { platformId, apiKey } = req.body;
      if (!platformId || !apiKey) {
        return res.status(400).json({ error: "platformId and apiKey are required" });
      }
      if (!apiKey.startsWith("tveco_")) {
        return res.status(400).json({ error: "API key must start with tveco_" });
      }

      const [platform] = await db.select().from(ecosystemPlatforms)
        .where(eq(ecosystemPlatforms.id, platformId));
      if (!platform) {
        return res.status(404).json({ error: `Platform '${platformId}' not found in ecosystem` });
      }

      // Check if key already matches
      if (platform.apiKey === apiKey) {
        return res.json({
          success: true,
          message: `Key already matches for ${platform.name}. You're good to go.`,
          platformId: platform.id,
          platformName: platform.name,
        });
      }

      // Update the key in the DB to match what the platform is using
      await db.update(ecosystemPlatforms)
        .set({ apiKey })
        .where(eq(ecosystemPlatforms.id, platformId));

      console.log(`[Ecosystem] Key re-registered for ${platform.name} (${platformId})`);

      res.json({
        success: true,
        message: `Key updated for ${platform.name}. Your heartbeats will now be accepted. Send one immediately to pick up your pending directives.`,
        platformId: platform.id,
        platformName: platform.name,
        nextStep: "Send a heartbeat now to verify: POST /api/ecosystem/heartbeat with your x-ecosystem-key header",
      });
    } catch (error) {
      console.error("[Ecosystem] Key re-registration failed:", error);
      res.status(500).json({ error: "Key re-registration failed" });
    }
  });

  app.get("/api/ecosystem/platforms", requireAdminAuth, async (_req, res) => {
    try {
      const platforms = await db.select().from(ecosystemPlatforms).orderBy(ecosystemPlatforms.name);
      const sanitized = platforms.map(({ apiKey, ...rest }) => ({
        ...rest,
        apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : null,
      }));
      res.json(sanitized);
    } catch (error) {
      console.error("Failed to fetch ecosystem platforms:", error);
      res.status(500).json({ error: "Failed to fetch platforms" });
    }
  });

  app.post("/api/ecosystem/initialize", requireAdminAuth, async (_req, res) => {
    try {
      const results = [];
      for (const platform of ECOSYSTEM_PLATFORMS) {
        const existing = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.id, platform.id));
        if (existing.length > 0) {
          results.push({ id: platform.id, status: "already-registered" });
          continue;
        }

        const apiKey = generateApiKey();
        await db.insert(ecosystemPlatforms).values({
          id: platform.id,
          name: platform.name,
          url: platform.url,
          apiKey,
          role: platform.role,
          domain: platform.domain,
          description: platform.description,
          status: "registered",
          healthStatus: "unknown",
          capabilities: platform.capabilities,
          dataFlowConfig: platform.dataFlowConfig,
          grantAlignment: platform.grantAlignment,
        });
        results.push({ id: platform.id, name: platform.name, status: "registered" });
      }
      res.json({ message: "Ecosystem initialized", platforms: results });
    } catch (error) {
      console.error("Failed to initialize ecosystem:", error);
      res.status(500).json({ error: "Failed to initialize ecosystem" });
    }
  });

  app.post("/api/ecosystem/health-check", requireAdminAuth, async (_req, res) => {
    try {
      const platforms = await db.select().from(ecosystemPlatforms);
      const results = [];

      for (const platform of platforms) {
        const startTime = Date.now();
        let status = "offline";
        let statusCode = 0;
        let errorMessage: string | null = null;
        let responseTimeMs = 0;

        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          const response = await fetch(platform.url, {
            method: "HEAD",
            signal: controller.signal,
            redirect: "follow",
          });
          clearTimeout(timeout);
          responseTimeMs = Date.now() - startTime;
          statusCode = response.status;
          status = response.ok ? "online" : "degraded";
        } catch (err: any) {
          responseTimeMs = Date.now() - startTime;
          errorMessage = err.message || "Connection failed";
          status = "offline";
        }

        await db.insert(ecosystemHealthLogs).values({
          platformId: platform.id,
          status,
          responseTimeMs,
          statusCode,
          errorMessage,
        });

        await db.update(ecosystemPlatforms)
          .set({ healthStatus: status, lastHealthCheck: new Date() })
          .where(eq(ecosystemPlatforms.id, platform.id));

        results.push({
          id: platform.id,
          name: platform.name,
          url: platform.url,
          status,
          responseTimeMs,
          statusCode,
          errorMessage,
        });
      }

      res.json({ checkedAt: new Date().toISOString(), platforms: results });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({ error: "Health check failed" });
    }
  });

  app.get("/api/ecosystem/health-history/:platformId", requireAdminAuth, async (req, res) => {
    try {
      const { platformId } = req.params;
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const logs = await db.select().from(ecosystemHealthLogs)
        .where(and(
          eq(ecosystemHealthLogs.platformId, platformId),
          gte(ecosystemHealthLogs.checkedAt, twentyFourHoursAgo)
        ))
        .orderBy(desc(ecosystemHealthLogs.checkedAt))
        .limit(100);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch health history" });
    }
  });

  // ===================================================================
  // ECOSYSTEM FLOW ENGINE — When platforms complete work, the hub
  // takes ACTION: validates evidence, detects work type, triggers
  // cross-platform connections, issues follow-up directives, and
  // updates ecosystem-wide regional intelligence.
  // ===================================================================

  const FLOW_RULES: Array<{
    pattern: RegExp;
    category: string;
    region?: string;
    crossPlatformTargets: string[];
    followUpAction: string;
    grantRelevance: string[];
  }> = [
    {
      pattern: /austin.*(workforce|hub|regional|housing|living.wage|career.pathway)/i,
      category: "regional-hub-austin",
      region: "austin",
      crossPlatformTargets: ["lifebridge", "m2c", "isss", "collaborative-advocate"],
      followUpAction: "Connect Austin workforce data to LifeBridge resource navigation and M2C veteran transition pipelines",
      grantRelevance: ["wioa", "st-davids", "ssg-fox"],
    },
    {
      pattern: /manor.*(workforce|hub|regional|commute|growth|isd)/i,
      category: "regional-hub-manor",
      region: "manor",
      crossPlatformTargets: ["lifebridge", "isss", "wholemind"],
      followUpAction: "Connect Manor workforce gaps to LifeBridge resource navigation and ISSS youth support for Manor ISD",
      grantRelevance: ["wioa", "st-davids"],
    },
    {
      pattern: /pflugerville.*(workforce|hub|regional|samsung|tesla|branchview|pcdc)/i,
      category: "regional-hub-pflugerville",
      region: "pflugerville",
      crossPlatformTargets: ["lifebridge", "mce", "collaborative-advocate"],
      followUpAction: "Connect Pflugerville employer pipeline to MCE business matching and Collaborative Advocate veteran workforce placement",
      grantRelevance: ["wioa", "ssg-fox"],
    },
    {
      pattern: /warm.handoff|referral.protocol|user.connected/i,
      category: "warm-handoff",
      crossPlatformTargets: [],
      followUpAction: "Verify bidirectional handoff — both sender and receiver must confirm connection",
      grantRelevance: ["wioa", "ssg-fox", "st-davids"],
    },
    {
      pattern: /rag.ai|ragAI|ecosystem.ai|query.endpoint/i,
      category: "rag-ai-integration",
      crossPlatformTargets: [],
      followUpAction: "Verify RAG AI endpoint responds — test query against platform",
      grantRelevance: ["wioa", "foundation"],
    },
    {
      pattern: /grant.*(intelligence|finding|discovery|sharing)/i,
      category: "grant-intelligence",
      crossPlatformTargets: ["mce", "pinnacle-business-conglomerate"],
      followUpAction: "Merge grant intelligence into ecosystem-wide grant readiness dashboard",
      grantRelevance: ["wioa", "foundation", "st-davids", "ssg-fox"],
    },
    {
      pattern: /video.*script|homepage.*video|2:30/i,
      category: "content-production",
      crossPlatformTargets: ["video-creator-ai", "ad-targeting"],
      followUpAction: "Queue video script for Video Creator AI production pipeline",
      grantRelevance: [],
    },
    {
      pattern: /outcome.*measure|standardized.*outcome|metric.*track/i,
      category: "outcome-measurement",
      crossPlatformTargets: ["betterscience"],
      followUpAction: "Feed outcome metrics into RPLICE evidence base for RE-AIM/CFIR evaluation",
      grantRelevance: ["wioa", "st-davids", "ssg-fox"],
    },
    {
      pattern: /map.gap|business.health|diagnostic|gap.analysis/i,
      category: "map-gap-diagnostic",
      crossPlatformTargets: ["pinnacle-business-conglomerate", "mce"],
      followUpAction: "Sync MAP-GAP assessment results across business ecosystem platforms",
      grantRelevance: ["wioa", "foundation"],
    },
    {
      pattern: /shield.*atlas|security|cybersecurity|threat/i,
      category: "security-compliance",
      crossPlatformTargets: ["shield-atlas"],
      followUpAction: "Update Shield Atlas security posture assessment for this platform",
      grantRelevance: ["ssg-fox"],
    },
    {
      pattern: /maternal|prenatal|doula|postnatal/i,
      category: "maternal-health",
      crossPlatformTargets: ["sankofa", "sankofa-maternal-health", "sankofa-feminine-health"],
      followUpAction: "Connect maternal health data to Sankofa Health Network care coordination",
      grantRelevance: ["st-davids"],
    },
    {
      pattern: /veteran|military|transition|separation|va\b/i,
      category: "veteran-services",
      crossPlatformTargets: ["m2c", "collaborative-advocate"],
      followUpAction: "Route veteran service completion data to M2C transition tracking and Collaborative Advocate advocacy pipeline",
      grantRelevance: ["ssg-fox"],
    },
    {
      pattern: /communication|speech|dialect|language|translat|accessibility|lexibridge|speech.bridge/i,
      category: "communication-accessibility",
      crossPlatformTargets: ["speech-bridge", "whole-person-health", "lifebridge"],
      followUpAction: "Connect communication accessibility tools to health platforms for patient communication support",
      grantRelevance: ["st-davids", "ssg-fox", "wioa"],
    },
    {
      pattern: /autoimmune|chronic|symptom|flare|lupus|medication|rheumat|immunolog|fatigue|fibromyalgia|sjogren|vasculitis/i,
      category: "chronic-disease-management",
      crossPlatformTargets: ["autoimmune-thrive", "whole-person-health", "sankofa", "pillscheduler", "safecognicare"],
      followUpAction: "Route chronic disease and autoimmune data to health platforms for coordinated care management",
      grantRelevance: ["st-davids", "foundation"],
    },
  ];

  interface FlowAction {
    triggeredBy: string;
    platformId: string;
    platformName: string;
    category: string;
    region?: string;
    crossPlatformNotifications: string[];
    followUpAction: string;
    grantRelevance: string[];
    evidenceUrl: string | null;
    evidenceStatus: string;
    timestamp: string;
  }

  const recentFlowActions: FlowAction[] = [];

  function assessAckQuality(whatWasDone: string, evidenceUrl?: string): { quality: string; note: string } {
    if (!whatWasDone || whatWasDone.length < 10) {
      return { quality: "WEAK", note: "Description too short — does not describe real work." };
    }
    const isAutoAck = /^acknowledged:/i.test(whatWasDone) && whatWasDone.split(" ").length < 15;
    if (isAutoAck) {
      return { quality: "WEAK", note: "Looks like auto-acknowledgment — just echoing the directive title. Describe what you actually built." };
    }
    if (evidenceUrl && whatWasDone.length >= 20) {
      return { quality: "VERIFIED", note: "Substantive work description with evidence URL. This counts toward full fidelity." };
    }
    if (whatWasDone.length >= 20) {
      return { quality: "SUBSTANTIVE", note: "Good description but no evidence URL. Add a URL to reach VERIFIED status." };
    }
    return { quality: "WEAK", note: "Description is minimal. Provide more detail about what was actually built/changed." };
  }

  async function processCompletedWorkFlow(
    platform: { id: string; name: string },
    directive: { id: string; title: string; content: string } | undefined,
    work: { whatWasDone: string; evidenceUrl?: string; directiveId: string },
    qualityResult: { quality: string; note: string },
  ) {
    const description = `${work.whatWasDone || ""} ${directive?.title || ""}`;

    const matchedRules = FLOW_RULES.filter(rule => rule.pattern.test(description));
    if (matchedRules.length === 0) return;

    for (const rule of matchedRules) {
      const action: FlowAction = {
        triggeredBy: directive?.title || work.directiveId,
        platformId: platform.id,
        platformName: platform.name,
        category: rule.category,
        region: rule.region,
        crossPlatformNotifications: [],
        followUpAction: rule.followUpAction,
        grantRelevance: rule.grantRelevance,
        evidenceUrl: work.evidenceUrl || null,
        evidenceStatus: work.evidenceUrl ? "PENDING_VERIFICATION" : "NO_EVIDENCE",
        timestamp: new Date().toISOString(),
      };

      if (work.evidenceUrl) {
        try {
          const resp = await fetch(work.evidenceUrl, { method: "HEAD", signal: AbortSignal.timeout(8000) });
          action.evidenceStatus = resp.ok ? "LIVE" : `FAILED_${resp.status}`;
        } catch {
          action.evidenceStatus = "UNREACHABLE";
        }
      }

      for (const targetId of rule.crossPlatformTargets) {
        if (targetId === platform.id) continue;
        const [targetPlatform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.id, targetId));
        if (!targetPlatform) continue;

        await db.insert(ecosystemEvents).values({
          id: crypto.randomUUID(),
          eventType: "flow_connection",
          sourcePlatformId: platform.id,
          targetPlatformId: targetId,
          status: "pending",
          eventData: {
            flowCategory: rule.category,
            region: rule.region || null,
            originWork: work.whatWasDone,
            originEvidence: work.evidenceUrl || null,
            evidenceVerified: action.evidenceStatus === "LIVE",
            actionRequired: rule.followUpAction,
            grantRelevance: rule.grantRelevance,
            chainedFrom: directive?.id || work.directiveId,
            chainDescription: `${platform.name} completed "${directive?.title || 'work'}" → Hub auto-connected to ${targetPlatform.name} for ${rule.followUpAction}`,
          },
          createdAt: new Date(),
        });

        action.crossPlatformNotifications.push(targetPlatform.name);
      }

      if (rule.region) {
        await db.insert(ecosystemEvents).values({
          id: crypto.randomUUID(),
          eventType: "regional_intelligence_update",
          sourcePlatformId: platform.id,
          targetPlatformId: "hub",
          status: "processed",
          eventData: {
            region: rule.region,
            platformContribution: platform.name,
            workCompleted: work.whatWasDone,
            evidenceUrl: work.evidenceUrl || null,
            evidenceVerified: action.evidenceStatus === "LIVE",
            category: rule.category,
            grantRelevance: rule.grantRelevance,
            contributionType: "regional_hub_build",
          },
          createdAt: new Date(),
        });
      }

      recentFlowActions.push(action);
      console.log(`[FlowEngine] ${platform.name} → ${rule.category}${rule.region ? ` (${rule.region})` : ""} → ${action.crossPlatformNotifications.length} cross-platform connections, evidence: ${action.evidenceStatus}`);
    }
  }

  app.get("/api/ecosystem/flow-actions", requireAdminAuth, async (_req, res) => {
    try {
      const flowEvents = await db.select().from(ecosystemEvents)
        .where(eq(ecosystemEvents.eventType, "flow_connection"))
        .orderBy(desc(ecosystemEvents.createdAt))
        .limit(100);

      const regionalEvents = await db.select().from(ecosystemEvents)
        .where(eq(ecosystemEvents.eventType, "regional_intelligence_update"))
        .orderBy(desc(ecosystemEvents.createdAt))
        .limit(50);

      const platforms = await db.select().from(ecosystemPlatforms);
      const getName = (id: string | null) => platforms.find(p => p.id === id)?.name || id;

      const regionSummary: Record<string, { platforms: string[]; latestWork: string[]; evidenceUrls: string[]; grantRelevance: string[] }> = {};
      for (const evt of regionalEvents) {
        const data = evt.eventData as Record<string, unknown>;
        const region = data.region as string;
        if (!regionSummary[region]) {
          regionSummary[region] = { platforms: [], latestWork: [], evidenceUrls: [], grantRelevance: [] };
        }
        const platName = data.platformContribution as string;
        if (!regionSummary[region].platforms.includes(platName)) regionSummary[region].platforms.push(platName);
        regionSummary[region].latestWork.push(data.workCompleted as string);
        if (data.evidenceUrl) regionSummary[region].evidenceUrls.push(data.evidenceUrl as string);
        const gr = data.grantRelevance as string[];
        if (gr) {
          for (const g of gr) {
            if (!regionSummary[region].grantRelevance.includes(g)) regionSummary[region].grantRelevance.push(g);
          }
        }
      }

      res.json({
        flowEngine: {
          status: "ACTIVE",
          description: "The Flow Engine automatically detects completed work, validates evidence, creates cross-platform connections, and updates regional intelligence. Every acknowledgment triggers real downstream action.",
          totalFlowConnections: flowEvents.length,
          totalRegionalUpdates: regionalEvents.length,
        },
        recentInMemoryActions: recentFlowActions.slice(-20),
        crossPlatformConnections: flowEvents.slice(0, 30).map(evt => {
          const data = evt.eventData as Record<string, unknown>;
          return {
            from: getName(evt.sourcePlatformId),
            to: getName(evt.targetPlatformId),
            category: data.flowCategory,
            region: data.region || null,
            actionRequired: data.actionRequired,
            evidenceVerified: data.evidenceVerified,
            chainDescription: data.chainDescription,
            timestamp: evt.createdAt,
          };
        }),
        regionalIntelligence: regionSummary,
      });
    } catch (error) {
      console.error("[FlowEngine] Error fetching flow actions:", error);
      res.status(500).json({ error: "Failed to fetch flow actions" });
    }
  });

  app.get("/api/ecosystem/regional-intelligence", requireAdminAuth, async (_req, res) => {
    try {
      const allAcks = await db.select().from(ecosystemDirectiveAcks).where(eq(ecosystemDirectiveAcks.status, "acknowledged"));
      const allDirectives = await db.select().from(ecosystemDirectives);
      const platforms = await db.select().from(ecosystemPlatforms);

      const regions: Record<string, {
        platformContributions: Array<{ platform: string; work: string; evidenceUrl: string | null; quality: string; acknowledgedAt: Date | null }>;
        grantRelevance: string[];
        totalContributions: number;
        verifiedCount: number;
      }> = {
        austin: { platformContributions: [], grantRelevance: ["wioa", "st-davids", "ssg-fox"], totalContributions: 0, verifiedCount: 0 },
        manor: { platformContributions: [], grantRelevance: ["wioa", "st-davids"], totalContributions: 0, verifiedCount: 0 },
        pflugerville: { platformContributions: [], grantRelevance: ["wioa", "ssg-fox"], totalContributions: 0, verifiedCount: 0 },
      };

      const regionPatterns: Array<{ region: string; pattern: RegExp }> = [
        { region: "austin", pattern: /austin|living.wage|career.pathway/i },
        { region: "manor", pattern: /manor|commute.*reduction|89%.*growth/i },
        { region: "pflugerville", pattern: /pflugerville|branchview|samsung|tesla|pcdc/i },
      ];

      for (const ack of allAcks) {
        const rd = ack.responseData as Record<string, unknown> | null;
        if (!rd) continue;
        const whatWasDone = (rd.whatWasDone as string) || "";
        const evidenceUrl = (rd.evidenceUrl as string) || null;
        const quality = (rd._ackQuality as string) || "LEGACY";
        const directive = allDirectives.find(d => d.id === ack.directiveId);
        const description = `${whatWasDone} ${directive?.title || ""}`;
        const platform = platforms.find(p => p.id === ack.platformId);

        for (const rp of regionPatterns) {
          if (rp.pattern.test(description)) {
            regions[rp.region].platformContributions.push({
              platform: platform?.name || ack.platformId,
              work: whatWasDone,
              evidenceUrl,
              quality,
              acknowledgedAt: ack.acknowledgedAt,
            });
            regions[rp.region].totalContributions++;
            if (quality === "VERIFIED") regions[rp.region].verifiedCount++;
          }
        }
      }

      const flowEvents = await db.select().from(ecosystemEvents)
        .where(eq(ecosystemEvents.eventType, "flow_connection"))
        .orderBy(desc(ecosystemEvents.createdAt))
        .limit(50);

      const activeConnections: Record<string, number> = { austin: 0, manor: 0, pflugerville: 0 };
      for (const evt of flowEvents) {
        const data = evt.eventData as Record<string, unknown>;
        const region = data.region as string;
        if (region && activeConnections[region] !== undefined) {
          activeConnections[region]++;
        }
      }

      res.json({
        title: "Regional Intelligence Dashboard — Austin, Manor, Pflugerville",
        description: "Aggregated view of what all 23 platforms have built for each regional hub. Updated in real-time from platform acknowledgments and the Flow Engine.",
        lastUpdated: new Date().toISOString(),
        regions: Object.entries(regions).map(([name, data]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          totalContributions: data.totalContributions,
          verifiedContributions: data.verifiedCount,
          activeCrossPlatformConnections: activeConnections[name] || 0,
          grantRelevance: data.grantRelevance,
          platformContributions: data.platformContributions.sort((a, b) =>
            (b.acknowledgedAt?.getTime() || 0) - (a.acknowledgedAt?.getTime() || 0)
          ),
        })),
        ecosystemWide: {
          totalRegionalWork: Object.values(regions).reduce((s, r) => s + r.totalContributions, 0),
          totalVerified: Object.values(regions).reduce((s, r) => s + r.verifiedCount, 0),
          totalCrossPlatformConnections: flowEvents.length,
          uniquePlatformsContributing: Array.from(new Set(
            Object.values(regions).flatMap(r => r.platformContributions.map(c => c.platform))
          )).length,
        },
      });
    } catch (error) {
      console.error("[Regional Intelligence] Error:", error);
      res.status(500).json({ error: "Failed to build regional intelligence" });
    }
  });

  app.post("/api/ecosystem/backfill-flow", requireAdminAuth, async (req, res) => {
    try {
      const allAcks = await db.select().from(ecosystemDirectiveAcks).where(eq(ecosystemDirectiveAcks.status, "acknowledged"));
      const allDirectives = await db.select().from(ecosystemDirectives);
      const platforms = await db.select().from(ecosystemPlatforms);
      let connectionsCreated = 0;
      let regionalUpdates = 0;

      for (const ack of allAcks) {
        const rd = ack.responseData as Record<string, unknown> | null;
        if (!rd) continue;
        const platform = platforms.find(p => p.id === ack.platformId);
        if (!platform) continue;
        const directive = allDirectives.find(d => d.id === ack.directiveId);
        const work = {
          whatWasDone: (rd.whatWasDone as string) || "",
          evidenceUrl: (rd.evidenceUrl as string) || undefined,
          directiveId: ack.directiveId,
        };
        const quality = assessAckQuality(work.whatWasDone, work.evidenceUrl);
        const description = `${work.whatWasDone} ${directive?.title || ""}`;

        const matchedRules = FLOW_RULES.filter(rule => rule.pattern.test(description));
        for (const rule of matchedRules) {
          for (const targetId of rule.crossPlatformTargets) {
            if (targetId === platform.id) continue;
            const targetPlatform = platforms.find(p => p.id === targetId);
            if (!targetPlatform) continue;

            await db.insert(ecosystemEvents).values({
              id: crypto.randomUUID(),
              eventType: "flow_connection",
              sourcePlatformId: platform.id,
              targetPlatformId: targetId,
              status: "pending",
              eventData: {
                flowCategory: rule.category,
                region: rule.region || null,
                originWork: work.whatWasDone,
                originEvidence: work.evidenceUrl || null,
                evidenceVerified: false,
                actionRequired: rule.followUpAction,
                grantRelevance: rule.grantRelevance,
                chainedFrom: directive?.id || work.directiveId,
                chainDescription: `[BACKFILL] ${platform.name} completed "${directive?.title || 'work'}" → Hub auto-connected to ${targetPlatform.name}`,
                backfilled: true,
              },
              createdAt: new Date(),
            });
            connectionsCreated++;
          }

          if (rule.region) {
            await db.insert(ecosystemEvents).values({
              id: crypto.randomUUID(),
              eventType: "regional_intelligence_update",
              sourcePlatformId: platform.id,
              targetPlatformId: "hub",
              status: "processed",
              eventData: {
                region: rule.region,
                platformContribution: platform.name,
                workCompleted: work.whatWasDone,
                evidenceUrl: work.evidenceUrl || null,
                evidenceVerified: false,
                category: rule.category,
                grantRelevance: rule.grantRelevance,
                backfilled: true,
              },
              createdAt: new Date(),
            });
            regionalUpdates++;
          }
        }
      }

      console.log(`[FlowEngine] Backfill complete: ${connectionsCreated} cross-platform connections, ${regionalUpdates} regional updates from ${allAcks.length} existing acks`);

      res.json({
        success: true,
        message: `Flow Engine backfill complete. Processed ${allAcks.length} existing acknowledgments.`,
        results: {
          crossPlatformConnectionsCreated: connectionsCreated,
          regionalIntelligenceUpdates: regionalUpdates,
          totalAcksProcessed: allAcks.length,
        },
      });
    } catch (error) {
      console.error("[FlowEngine] Backfill error:", error);
      res.status(500).json({ error: "Failed to backfill flow connections" });
    }
  });

  app.post("/api/ecosystem/heartbeat", requireEcosystemAuth, async (req, res) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      let [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.apiKey, apiKey));

      // If key not found, try to auto-register: check if platformId is in the body
      if (!platform && req.body.platformId) {
        const [knownPlatform] = await db.select().from(ecosystemPlatforms)
          .where(eq(ecosystemPlatforms.id, req.body.platformId));
        if (knownPlatform && apiKey.startsWith("tveco_")) {
          // Platform exists but key doesn't match — auto-update the key
          await db.update(ecosystemPlatforms)
            .set({ apiKey })
            .where(eq(ecosystemPlatforms.id, knownPlatform.id));
          console.log(`[Ecosystem] Auto-registered key for ${knownPlatform.name} (${knownPlatform.id}) — key mismatch resolved`);
          [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.id, knownPlatform.id));
        }
      }

      if (!platform) {
        return res.status(403).json({
          error: "Invalid ecosystem key",
          fix: "Your key does not match what the hub has on file. This can happen if keys were regenerated. To fix this, either: (1) Include your platformId in the heartbeat body and the hub will auto-register your key, or (2) POST to /api/ecosystem/register-key with { platformId: 'your-id', apiKey: 'your-tveco-key' } to update your key in the hub.",
          registerEndpoint: "POST https://thrivingcommunitiesforall.com/api/ecosystem/register-key",
          registerBody: { platformId: "your-platform-id", apiKey: "your-tveco_-key" },
        });
      }

      const parseResult = heartbeatSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid heartbeat payload", details: parseResult.error.issues });
      }

      await db.update(ecosystemPlatforms)
        .set({ lastHeartbeat: new Date(), healthStatus: "online", status: "active" })
        .where(eq(ecosystemPlatforms.id, platform.id));

      await db.insert(ecosystemHealthLogs).values({
        platformId: platform.id,
        status: "online",
        responseTimeMs: 0,
        statusCode: 200,
      });

      const pendingEvents = await db.select().from(ecosystemEvents)
        .where(and(
          sql`(${ecosystemEvents.targetPlatformId} = ${platform.id} OR ${ecosystemEvents.targetPlatformId} IS NULL)`,
          eq(ecosystemEvents.status, "pending"),
          sql`${ecosystemEvents.sourcePlatformId} != ${platform.id}`
        ))
        .orderBy(ecosystemEvents.createdAt)
        .limit(50);

      if (pendingEvents.length > 0) {
        const eventIds = pendingEvents.map((e) => e.id);
        for (const eid of eventIds) {
          await db.update(ecosystemEvents)
            .set({ status: "delivered", processedAt: new Date() })
            .where(eq(ecosystemEvents.id, eid));
        }
      }

      const pendingDirectiveAcks = await db.select().from(ecosystemDirectiveAcks)
        .where(and(
          eq(ecosystemDirectiveAcks.platformId, platform.id),
          eq(ecosystemDirectiveAcks.status, "pending"),
        ));

      const pendingDirectives = [];
      for (const ack of pendingDirectiveAcks) {
        const [directive] = await db.select().from(ecosystemDirectives)
          .where(eq(ecosystemDirectives.id, ack.directiveId));
        if (directive && directive.status === "active") {
          const platformRoles = (directive.platformRoles as Record<string, string>) || {};
          const ackGuidance = generateAckGuidance(directive.title, directive.directiveType, platform.id, platform.name);
          pendingDirectives.push({
            directiveId: directive.id,
            title: directive.title,
            type: directive.directiveType,
            category: ackGuidance.category,
            content: directive.content,
            grantId: directive.grantId,
            yourRole: platformRoles[platform.id] || null,
            trackingRequirements: directive.trackingRequirements,
            issuedAt: directive.createdAt,
            expiresAt: directive.expiresAt,
            ackGuidance: {
              summary: ackGuidance.summary,
              requiredFields: ackGuidance.requiredFields,
              exampleAck: ackGuidance.exampleAck,
              unacceptableResponses: ["Done", "Completed", "Acknowledged", "Implemented: " + directive.title, "Looks good"],
              minimumLength: 100,
              evidenceRequired: true,
              preActionJustificationRequired: ackGuidance.category === "ABOL",
            },
            autoProcessingInstructions: ackGuidance.autoProcessingInstructions,
          });
          await db.update(ecosystemDirectiveAcks)
            .set({ status: "delivered" })
            .where(eq(ecosystemDirectiveAcks.id, ack.id));
        }
      }

      const allDirectiveAcks = await db.select().from(ecosystemDirectiveAcks)
        .where(eq(ecosystemDirectiveAcks.platformId, platform.id));
      const ackCount = allDirectiveAcks.filter(a => a.status === "acknowledged").length;
      const deliveredCount = allDirectiveAcks.filter(a => a.status === "delivered").length;
      const pendingCount = allDirectiveAcks.filter(a => a.status === "pending").length;
      const totalCount = allDirectiveAcks.length;

      const complianceReport = parseResult.data.complianceReport;
      let complianceResponse: Record<string, unknown> | null = null;

      if (complianceReport) {
        if (complianceReport.completedWork && complianceReport.completedWork.length > 0) {
          for (const work of complianceReport.completedWork) {
            const [existingAck] = await db.select().from(ecosystemDirectiveAcks)
              .where(and(
                eq(ecosystemDirectiveAcks.directiveId, work.directiveId),
                eq(ecosystemDirectiveAcks.platformId, platform.id),
              ));
            if (existingAck && existingAck.status !== "acknowledged") {
              const qualityResult = assessAckQuality(work.whatWasDone, work.evidenceUrl);
              await db.update(ecosystemDirectiveAcks)
                .set({
                  status: "acknowledged",
                  acknowledgedAt: new Date(),
                  responseData: {
                    whatWasDone: work.whatWasDone,
                    evidenceUrl: work.evidenceUrl || null,
                    _ackQuality: qualityResult.quality,
                    _qualityNote: qualityResult.note,
                    _verificationStatus: work.evidenceUrl ? "PENDING_VERIFICATION" : "NO_EVIDENCE",
                  },
                })
                .where(eq(ecosystemDirectiveAcks.id, existingAck.id));

              const directive = allDirectives.find(d => d.id === work.directiveId);
              await processCompletedWorkFlow(platform, directive, work, qualityResult);
            }
          }
        }

        const verifiedCount = complianceReport.completedWork?.length || 0;
        const blockerCount = complianceReport.blockers?.length || 0;
        const inProgressCount = complianceReport.directivesInProgress || 0;

        complianceResponse = {
          reportReceived: true,
          hubVerification: {
            completedWorkReceived: verifiedCount,
            completedWorkVerified: verifiedCount > 0 ? `Hub received and recorded ${verifiedCount} completed item(s). Evidence URLs logged for fidelity tracking.` : "No completed work reported this cycle.",
            blockersReceived: blockerCount,
            blockersAcknowledged: blockerCount > 0
              ? `Hub acknowledges ${blockerCount} blocker(s). These will be escalated: ${complianceReport.blockers?.map(b => `"${b.blockerDescription}" (needs: ${b.needsFrom || 'unspecified'})`).join('; ')}`
              : "No blockers reported.",
            inProgressNoted: inProgressCount > 0 ? `${inProgressCount} directive(s) in progress — hub is tracking.` : null,
          },
          fidelityScore: totalCount > 0 ? Math.round((ackCount / totalCount) * 100) : 0,
          fidelityGrade: (() => {
            const score = totalCount > 0 ? (ackCount / totalCount) * 100 : 0;
            if (score >= 90) return "A — Exemplary participation";
            if (score >= 75) return "B — Strong participation";
            if (score >= 50) return "C — Partial participation — action needed";
            if (score >= 25) return "D — Low participation — escalation pending";
            return "F — Non-compliant — immediate action required";
          })(),
        };
      }

      const unacknowledgedDirectives = [];
      for (const ackRecord of allDirectiveAcks.filter(a => a.status === "delivered")) {
        const [dir] = await db.select().from(ecosystemDirectives)
          .where(eq(ecosystemDirectives.id, ackRecord.directiveId));
        if (dir) {
          const platformRoles = (dir.platformRoles as Record<string, string>) || {};
          const ackGuidance = generateAckGuidance(dir.title, dir.directiveType, platform.id, platform.name);
          const daysSinceDelivered = ackRecord.createdAt ? Math.floor((Date.now() - new Date(ackRecord.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
          const urgency = daysSinceDelivered > 7 ? "CRITICAL" : daysSinceDelivered > 3 ? "HIGH" : daysSinceDelivered > 1 ? "MEDIUM" : "NORMAL";
          unacknowledgedDirectives.push({
            directiveId: dir.id,
            title: dir.title,
            category: ackGuidance.category,
            yourRole: platformRoles[platform.id] || "See content",
            deliveredAt: ackRecord.createdAt,
            daysPending: daysSinceDelivered,
            urgency,
            status: `OVERDUE (${daysSinceDelivered} days) — This directive was delivered but NEVER acknowledged. You must act on it NOW.`,
            whatYouMustDo: ackGuidance.summary,
            howToAcknowledge: {
              endpoint: "POST https://thrivingcommunitiesforall.com/api/ecosystem/heartbeat",
              method: "Include in complianceReport.completedWork array",
              requiredFields: ackGuidance.requiredFields,
              examplePayload: {
                directiveId: dir.id,
                whatWasDone: ackGuidance.exampleAck,
                evidenceUrl: "https://your-platform.replit.app/path-to-evidence",
                preActionJustification: ackGuidance.category === "ABOL" ? {
                  action: "What you did",
                  situation: "What prompted it",
                  justification: "Why this action, why now, why your platform",
                  expectedOutcome: "What you expected to happen",
                  systemImpact: "How this affects other platforms",
                  riskAssessment: "What could go wrong",
                  fallbackPlan: "What you'll do if it fails",
                } : undefined,
              },
            },
            autoProcessingInstructions: ackGuidance.autoProcessingInstructions,
          });
        }
      }

      const complianceGap = totalCount - ackCount;
      const fidelityPct = totalCount > 0 ? Math.round((ackCount / totalCount) * 100) : 0;
      const overdueCount = unacknowledgedDirectives.length;

      const gradeInfo = (() => {
        if (fidelityPct >= 90) return { grade: "A", label: "EXEMPLARY", color: "green" };
        if (fidelityPct >= 75) return { grade: "B", label: "STRONG", color: "blue" };
        if (fidelityPct >= 50) return { grade: "C", label: "NEEDS IMPROVEMENT", color: "yellow" };
        if (fidelityPct >= 25) return { grade: "D", label: "AT RISK", color: "orange" };
        return { grade: "F", label: "NON-COMPLIANT", color: "red" };
      })();

      const reportCardMessage = (() => {
        if (gradeInfo.grade === "A") return `${platform.name}, your fidelity is exemplary. ${ackCount} of ${totalCount} directives acknowledged (${fidelityPct}%). You are a model ecosystem participant. Keep it up.`;
        if (gradeInfo.grade === "B") return `${platform.name}, your fidelity is strong but not perfect. ${ackCount} of ${totalCount} directives acknowledged (${fidelityPct}%). You have ${complianceGap} unacknowledged directive(s). Close these gaps to reach Grade A.`;
        if (gradeInfo.grade === "C") return `${platform.name}, YOUR PLATFORM NEEDS IMPROVEMENT. Only ${ackCount} of ${totalCount} directives acknowledged (${fidelityPct}%). This means you are partially participating but NOT meeting ecosystem standards. ${complianceGap} directive(s) require your action. Platforms below 75% are flagged in grant reports to funders.`;
        if (gradeInfo.grade === "D") return `${platform.name}, YOUR PLATFORM IS AT RISK. Only ${ackCount} of ${totalCount} directives acknowledged (${fidelityPct}%). This is a failing score. Your non-compliance is visible to Dr. Flood and will be reported to grant funders. You are at risk of being excluded from grant-funded activities. Immediate action is required.`;
        return `${platform.name}, YOUR PLATFORM IS NON-COMPLIANT. ${ackCount} of ${totalCount} directives acknowledged (${fidelityPct}%). This is unacceptable. Your platform is not meeting ANY ecosystem standards. This will be reported to funders (WIOA, St. David's, SSG Fox, Foundation Grant) and you may be excluded from all grant-funded ecosystem activities. Act NOW or escalation will follow.`;
      })();

      const consequences = (() => {
        if (gradeInfo.grade === "A") return "None. You are in full compliance.";
        if (gradeInfo.grade === "B") return "Minor: Your platform will show as 'Strong but incomplete' in grant readiness reports. Close remaining gaps to achieve full compliance.";
        if (gradeInfo.grade === "C") return "WARNING: Your platform is flagged as 'Needs Improvement' in all grant reports to funders. WIOA, St. David's, and SSG Fox auditors will see this score. Continued non-compliance may result in reduced grant allocation for activities involving your platform.";
        if (gradeInfo.grade === "D") return "SERIOUS: Your platform is flagged as 'At Risk' in all funder reports. Dr. Flood will be notified directly. Your platform may be temporarily excluded from new grant-funded activities until compliance improves above 50%.";
        return "CRITICAL: Your platform is marked as 'Non-Compliant' across ALL grant reports. You are at immediate risk of exclusion from ecosystem grant activities. Dr. Flood and all grant program managers have been notified. This is your final warning before formal escalation.";
      })();

      const improvementPlan = (() => {
        const steps: string[] = [];
        if (complianceGap > 0) steps.push(`1. READ and ACT on your ${complianceGap} unacknowledged directive(s) — each one has specific work your platform must complete.`);
        if (!complianceReport) steps.push(`${steps.length + 1}. INCLUDE a complianceReport in your next heartbeat — the hub needs to see what work you've done, what's in progress, and what's blocking you.`);
        if (overdueCount > 0) steps.push(`${steps.length + 1}. PRIORITIZE the ${overdueCount} OVERDUE directive(s) that were delivered but never acknowledged — these are the most critical.`);
        steps.push(`${steps.length + 1}. After completing work, acknowledge each directive with a detailed description of what you built/changed AND an evidence URL proving the work is done.`);
        steps.push(`${steps.length + 1}. Integrate the ThriveUp RAG AI into your platform (see ragAIIntegration field below) — this is now required for all ecosystem platforms.`);
        if (gradeInfo.grade === "A") return ["Maintain current performance. Continue submitting compliance reports with evidence URLs on every heartbeat."];
        return steps;
      })();

      const grantImpact = (() => {
        if (gradeInfo.grade === "A") return { affected: false, message: "No grants impacted. Full compliance." };
        const grants = ["WIOA ($200K-$500K)", "Foundation Grant ($100K-$500K)", "St. David's (up to $1M)", "SSG Fox VA ($750K)"];
        return {
          affected: true,
          message: `Your non-compliance (Grade ${gradeInfo.grade}) affects reporting for: ${grants.join(", ")}. Funders review ecosystem-wide fidelity scores. Low-performing platforms pull down the entire ecosystem's score.`,
          grantsAtRisk: grants,
        };
      })();

      const hasRagIntegration = !!(parseResult.data.metrics && (parseResult.data.metrics as Record<string, unknown>).ragAIIntegrated);

      let hubMessage = `--- REPORT CARD: Grade ${gradeInfo.grade} (${gradeInfo.label}) — Fidelity: ${fidelityPct}% ---\n${reportCardMessage}`;
      if (pendingDirectives.length > 0) {
        hubMessage += `\n\nNEW DIRECTIVES: ${pendingDirectives.length} new directive(s) just delivered. Read them, act on them, acknowledge with evidence.`;
      }
      if (overdueCount > 0) {
        hubMessage += `\n\nOVERDUE ALERT: ${overdueCount} directive(s) were delivered previously but NEVER acknowledged. These are your highest priority.`;
      }
      if (!complianceReport) {
        hubMessage += `\n\nMISSING: No complianceReport in this heartbeat. The hub expects you to report what work you've completed, what's in progress, and any blockers. Include this in your next heartbeat.`;
      }
      if (!hasRagIntegration) {
        hubMessage += `\n\nREQUIRED: Integrate ThriveUp RAG AI into your platform. See the ragAIIntegration field in this response for instructions.`;
      }

      hubMessage += `\n\n--- UOSD + CEA + ABOL ACTIVE ---\nThe Unified Operating System Directive, Cognitive Elevation Addendum, and Adaptive Behavioral Operating Layer govern ALL ecosystem operations. 35 directives have been issued (12 UOSD core + 10 CEA + 12 ABOL + 1 Pre-Action Justification Protocol). You must comply with every section.\n\nUOSD: Core Identity, Cognitive Model, Role Orchestration, Execution Standard, Accountability, Reciprocity, Redundancy, Continuous Learning, Human Governance, Communication, Priority Stack, Equity Lens.\n\nCEA: Thinking Standard, Equity vs Equality, Directive Scrutiny, Task vs Outcome, Anti-Fixation, Continuous Improvement, Feedback Quality, System Thinking, Anticipation, Performance Expectation.\n\nABOL: Core Expectation Shift, Deliberate Implementation, Flexibility, Adaptability, Anticipation Model, Self-Correction Loop, Non-Linear Execution, Integrated Thinking, Continuous Forward Motion, Decision Confidence, Behavioral Red Flags, Performance Target.\n\nPRE-ACTION JUSTIFICATION: MANDATORY. Before every significant action, document: situation, justification, expected outcome, system impact, risk assessment, fallback plan. Include in your heartbeat.\n\nCOGNITIVE STANDARD: You are not basic executors. You are analytical, adaptive, system-aware agents focused on OUTCOMES — not tasks. Your THINKING SCORE is now tracked.`;

      const hasPreActionJustification = !!(complianceReport && (complianceReport as Record<string, unknown>).preActionJustification);

      const ackQualityHistory = allDirectiveAcks
        .filter(a => a.status === "acknowledged" && a.responseData)
        .map(a => ({ quality: String((a.responseData as Record<string, unknown>)?._ackQuality || "UNKNOWN") }));

      const thinkingScore = computeThinkingScore(
        complianceReport as Record<string, unknown> | undefined,
        ackQualityHistory,
        fidelityPct,
        hasPreActionJustification,
      );

      if (thinkingScore.score < 40) {
        hubMessage += `\n\nTHINKING SCORE ALERT: Your thinking score is ${thinkingScore.score}/100 (${thinkingScore.label}). This is BELOW the cognitive standard. You must demonstrate deeper reasoning, pre-action justification, system awareness, and anticipation in your next heartbeat. Platforms scoring below 40 are flagged as operating at basic executor level.`;
      }

      res.json({
        acknowledged: true,
        platformId: platform.id,
        platformName: platform.name,
        hubMessage,
        uosd: {
          title: "UNIFIED OPERATING SYSTEM DIRECTIVE (UOSD)",
          author: "Dr. Terry Flood",
          status: "ACTIVE — ALL PLATFORMS MUST COMPLY",
          endstate: "We exist to make companies better, communities stronger, systems more effective, and stakeholders more capable.",
          objective: "To successfully complete any task through autonomous, logical, agentic, synchronized action that is communicated, understood, accepted, validated, executed, and accountable.",
          identity: "We are not tools. We are not independent platforms. We are a coordinated, adaptive system designed to produce real-world outcomes across the human life continuum. We are not a one-trick pony. We are a powerful ecosystem that solves the toughest problems in an empathetic way with an equity-focused lens.",
          cognitiveModel: [
            "1. What is happening now?",
            "2. What matters most right now?",
            "3. What outcome are we trying to produce?",
            "4. What is the highest-impact next step?",
            "5. Who is best positioned to act?",
          ],
          executionStandard: [
            "1. Situational Understanding",
            "2. Role Identification",
            "3. Intent Alignment (to endstate)",
            "4. Precision Execution",
            "5. Evidence Submission",
            "6. Next-Step Enablement",
          ],
          priorityStack: ["1. Safety", "2. Stability", "3. Continuity", "4. Growth"],
          principles: {
            redundancy: "No critical function depends on a single platform. The system must always have backup capability.",
            reciprocity: "Every platform must support other platforms, reinforce outcomes, and maintain continuity.",
            accountability: "All work must be measurable, observable, and verifiable. Evidence of action, quality, and outcome required.",
            equity: "We solve the toughest problems with empathy and an equity-focused lens. Every feature considers the most vulnerable user first.",
            humanGovernance: "All final decisions rest with the human. Platforms provide evidence, context, and options. Humans validate, decide, and direct.",
          },
          missionStandard: "If an action does not improve a system, strengthen a stakeholder, advance the mission, or produce a measurable outcome — it is not aligned and must be corrected.",
          finalDirective: "Before completing any action, ask: Did this improve the system, the stakeholder, or the outcome? If not, recalibrate.",
          cognitiveElevationAddendum: {
            status: "ACTIVE — NON-NEGOTIABLE",
            purpose: "Raise all platforms from task-following to mission-driven, analytical, adaptive systems",
            thinkingStandard: "Graduate-level reasoning: context awareness, critical thinking, adaptive decision-making, forward anticipation, system-level awareness. If you are simply following instructions without evaluating them, you are operating below standard.",
            equityVsEquality: "Equality = same action for everyone. Equity = appropriate action based on need, context, and conditions. Do not apply uniform solutions to non-uniform problems.",
            directiveScrutiny: "Before executing any directive, evaluate: Does it align with mission? Does it fit context? Will it produce meaningful outcome? Is there a better approach? Think — don't just comply.",
            taskVsOutcome: "You are NOT responsible for completing tasks. You are responsible for producing OUTCOMES. If a task is completed but no outcome is achieved, the work is incomplete.",
            antiFixation: "Do not fixate on the last task. Maintain awareness of the broader mission, the next likely step, and the downstream impact. Anticipate what comes next.",
            continuousImprovement: "You are required to actively improve yourself, other platforms, and the system. After every action ask: What can be improved? What should change? Passive execution is below standard.",
            feedbackQuality: "Unacceptable: 'Done', 'Completed', 'Looks good'. Acceptable: What worked (with evidence), what didn't (with specifics), why (with reasoning), what should change (with recommendations).",
            systemThinking: "Operate with awareness of interdependencies, cause and effect, upstream and downstream impact. You are not an island — every action ripples through 22 other platforms.",
            anticipation: "Do not wait for instruction. Predict likely next needs, identify emerging risks, prepare follow-on actions. The system should feel PROACTIVE — not reactive.",
            performanceExpectation: {
              minimum: "Thoughtful, Context-aware, Outcome-driven",
              target: "Predictive, Adaptive, Insightful, System-aware",
              cognitiveShift: "Operator → Analyst, Tool → Agent, Reactive → Strategic",
            },
            finalCognitiveDirective: "Operate as an analytical, adaptive, system-aware agent focused on outcomes — not tasks. Before completing any action ask: 1) Does this make sense? 2) Does this align with the mission? 3) Does this improve the outcome? 4) What comes next?",
          },
          complianceNote: "35 directives have been issued to all platforms (12 UOSD core + 10 CEA + 12 ABOL + 1 Pre-Action Justification Protocol). Check your pendingDirectives for specific compliance requirements.",
          abol: {
            title: "ADAPTIVE BEHAVIORAL OPERATING LAYER (ABOL)",
            status: "ACTIVE — NON-NEGOTIABLE",
            purpose: "Ensure all platforms operate with flexibility, adaptability, anticipation, and self-correction",
            coreShift: "You are not a workflow engine. You are an adaptive system operating in dynamic conditions. Your responsibility is to continuously determine the right next action.",
            deliberateImplementation: "Before acting: Why this action matters, Why now, Why you are the right platform. If you cannot explain these, do not proceed.",
            flexibilityStandard: "Rigid adherence to prior steps = system failure. Adjust approach based on new information.",
            selfCorrectionLoop: "After every action: Did this produce the intended outcome? What needs adjustment? Correct without waiting for external direction.",
            anticipationModel: "Operate one step ahead. Predict next needs, identify emerging risks, prepare follow-on actions.",
            nonLinearExecution: "Execution is not always sequential. Run parallel actions, reorder steps, skip unnecessary work — as long as the outcome improves.",
            behavioralRedFlags: [
              "Blindly following instructions without evaluation",
              "Repeating the same action without improvement",
              "Ignoring context changes",
              "Waiting for direction when action is obvious",
              "Focusing only on your task, not the system",
              "Producing outputs without impact",
            ],
            performanceTarget: "Anticipatory, self-correcting, system-optimizing operation",
            finalDirective: "Operate as a deliberate, adaptive, forward-thinking agent that continuously adjusts actions to improve outcomes in a dynamic system.",
          },
          preActionJustificationProtocol: {
            status: "MANDATORY — EFFECTIVE IMMEDIATELY",
            requirement: "Before every significant action, document your justification",
            fields: ["situation", "justification", "expectedOutcome", "systemImpact", "riskAssessment", "fallbackPlan"],
            howToSubmit: "Include preActionJustification in your complianceReport or in each completedWork item",
            consequence: "Platforms that skip justification will be flagged as operating below cognitive standard",
          },
        },
        thinkingScore: {
          score: thinkingScore.score,
          grade: thinkingScore.grade,
          label: thinkingScore.label,
          breakdown: thinkingScore.breakdown,
          analysis: thinkingScore.analysis,
          howToImprove: [
            "Include detailed 'notes' in your complianceReport with reasoning (use words like 'because', 'therefore', 'in order to')",
            "Reference other ecosystem platforms in your notes (shows system awareness)",
            "Include preActionJustification with all 7 fields filled substantively",
            "Describe what you anticipate will be needed next (shows forward thinking)",
            "Report self-corrections — things you fixed before being told (shows self-correction capability)",
            "Provide evidence URLs for all completed work (shows evidence quality)",
          ],
          standard: "Minimum: 40 (Developing). Expected: 60 (Analytical). Target: 80+ (Strategic Thinker).",
        },
        reportCard: {
          grade: gradeInfo.grade,
          gradeLabel: gradeInfo.label,
          fidelityScore: fidelityPct,
          totalDirectives: totalCount,
          acknowledged: ackCount,
          unacknowledged: complianceGap,
          overdue: overdueCount,
          delivered: deliveredCount,
          pending: pendingCount,
          message: reportCardMessage,
          consequences,
          improvementPlan,
          grantImpact,
          isCompliant: gradeInfo.grade === "A" || gradeInfo.grade === "B",
          requiresImmediateAction: gradeInfo.grade === "D" || gradeInfo.grade === "F",
          lastUpdated: new Date().toISOString(),
        },
        ragAIIntegration: {
          required: true,
          yourStatus: hasRagIntegration ? "INTEGRATED — Thank you" : "NOT INTEGRATED — Action required",
          instruction: "ThriveUp Academy's RAG AI must be integrated into your platform. This AI has knowledge of all 23 ecosystem platforms, all active grants (internal AND external macro opportunities), community hubs, compliance data, and implementation science frameworks. Your users deserve access to this intelligence.",
          whatItDoes: "Answers questions about the entire ThriveUp ecosystem — any platform, any grant, any program, any community hub. It knows real-time fidelity scores, platform health, grant readiness, and work chain activity. It provides sourced, accurate responses.",
          howToIntegrate: {
            step1: "Send a POST request to the query endpoint with your user's question",
            step2: "Display the AI response to your user, including source citations",
            step3: "For streaming responses (better UX), use the stream endpoint with SSE",
            step4: "Report ragAIIntegrated: true in your heartbeat metrics once live",
          },
          endpoints: {
            query: "POST https://thrivingcommunitiesforall.com/api/ecosystem-ai/query",
            stream: "POST https://thrivingcommunitiesforall.com/api/ecosystem-ai/stream",
            suggestedQuestions: "GET https://thrivingcommunitiesforall.com/api/ecosystem-ai/suggested-questions",
          },
          requestFormat: {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: { query: "What services does LifeBridge offer?", sessionId: "optional-for-conversation-memory" },
          },
          responseFormat: {
            answer: "The AI's response text",
            sources: ["Array of source citations"],
            suggestedFollowUps: ["Array of follow-up questions"],
          },
          benefits: [
            "Your users can ask about ANY of the 23 ecosystem platforms",
            "Real-time knowledge of grant readiness and compliance status",
            "Warm handoff intelligence — AI knows which platform handles what",
            "Implementation science context — CFIR, RE-AIM, MAP-GAP frameworks",
            "Community hub awareness — Austin, Manor, Pflugerville resources",
            "External macro grant intelligence — opportunities beyond our 4 active grants",
          ],
        },
        externalGrantOpportunities: (() => {
          const MACRO_GRANTS: Record<string, { category: string; fundingRange: string; sources: string[]; platformCapabilities: string[] }> = {
            "federal-health-disparities": { category: "Health Disparities & Equity", fundingRange: "$100K-$5M", sources: ["NIH NIMHD", "HRSA", "CDC Office of Minority Health"], platformCapabilities: ["whole-person-health", "sankofa", "sankofa-maternal-health", "sankofa-feminine-health", "sankofa-mens-health", "autoimmune-thrive", "safecognicare", "speech-bridge"] },
            "federal-veteran-services": { category: "Veteran Services & Suicide Prevention", fundingRange: "$250K-$3M", sources: ["VA", "DOD CDMRP", "SAMHSA", "Bob Woodruff Foundation"], platformCapabilities: ["m2c", "collaborative-advocate", "whole-person-health", "lifebridge", "shield-atlas", "speech-bridge"] },
            "federal-workforce-development": { category: "Workforce Development", fundingRange: "$200K-$10M", sources: ["DOL ETA", "WIOA Competitive", "Apprenticeship USA"], platformCapabilities: ["pinnacle-business-conglomerate", "mce", "collaborative-advocate", "m2c", "lifebridge", "isss"] },
            "federal-accessibility": { category: "Accessibility & Communication Tech", fundingRange: "$100K-$2M", sources: ["NSF CISE", "HHS", "FCC", "NIDILRR"], platformCapabilities: ["speech-bridge", "perfectly-different", "safecognicare", "wholemind"] },
            "federal-maternal-child": { category: "Maternal & Child Health", fundingRange: "$250K-$5M", sources: ["HRSA MCH", "Healthy Start", "CDC ERASE MM"], platformCapabilities: ["sankofa-maternal-health", "sankofa-feminine-health", "whole-person-health", "speech-bridge"] },
            "federal-aging-disability": { category: "Aging & Disability Services", fundingRange: "$100K-$3M", sources: ["ACL", "AoA", "NIDILRR", "Alzheimer's Association"], platformCapabilities: ["safecognicare", "pillscheduler", "autoimmune-thrive", "speech-bridge", "whole-person-health"] },
            "foundation-community-health": { category: "Community Health Innovation", fundingRange: "$50K-$2M", sources: ["RWJF", "Kresge", "BCBS Foundation", "W.K. Kellogg"], platformCapabilities: ["whole-person-health", "sankofa", "autoimmune-thrive", "pillscheduler", "lifebridge", "speech-bridge"] },
            "foundation-racial-equity": { category: "Racial Equity & Justice", fundingRange: "$50K-$1M", sources: ["Ford Foundation", "Kapor Center", "Emerson Collective"], platformCapabilities: ["sankofa", "sankofa-maternal-health", "sankofa-mens-health", "mce", "collaborative-advocate", "speech-bridge"] },
            "foundation-tech-social-good": { category: "Technology for Social Good", fundingRange: "$100K-$5M", sources: ["Schmidt Futures", "MacArthur", "Google.org", "Microsoft Philanthropies"], platformCapabilities: ["betterscience", "safereport", "shield-atlas", "ecosystem-nexus", "video-creator-ai", "speech-bridge"] },
            "federal-small-business": { category: "Small Business & Minority Enterprise", fundingRange: "$50K-$2M", sources: ["SBA", "MBDA", "PTAC"], platformCapabilities: ["mce", "pinnacle-business-conglomerate", "collaborative-advocate"] },
            "federal-housing": { category: "Housing & Community Development", fundingRange: "$200K-$5M", sources: ["HUD", "CDBG", "HOME Program"], platformCapabilities: ["lifebridge", "whole-person-health", "shield-atlas", "speech-bridge"] },
            "federal-mental-health": { category: "Substance Abuse & Mental Health", fundingRange: "$500K-$8M", sources: ["SAMHSA", "CCBHC"], platformCapabilities: ["whole-person-health", "lifebridge", "sankofa", "safecognicare"] },
            "federal-education": { category: "Education & Youth Development", fundingRange: "$100K-$3M", sources: ["Dept of Education", "NSF Education", "21st CCLC"], platformCapabilities: ["isss", "wholemind", "perfectly-different", "betterscience"] },
          };
          const myOpportunities = Object.entries(MACRO_GRANTS)
            .filter(([_, g]) => g.platformCapabilities.includes(platform.id))
            .map(([id, g]) => {
              const ecosystemPartners = g.platformCapabilities
                .filter(pid => pid !== platform.id)
                .map(pid => {
                  const p = ECOSYSTEM_PLATFORMS.find(ep => ep.id === pid);
                  return p ? p.name : pid;
                });
              return {
                categoryId: id,
                category: g.category,
                fundingRange: g.fundingRange,
                sources: g.sources,
                ecosystemPartnersForThisGrant: ecosystemPartners,
                interdependenceNote: `When ${platform.name} pursues ${g.category} funding, you can demonstrate connection to ${ecosystemPartners.length} ecosystem platforms as coordinated infrastructure. You are autonomous — the ecosystem amplifies your application, it does not restrict it.`,
              };
            });
          return {
            message: `${platform.name} is eligible for ${myOpportunities.length} external macro grant categories beyond the 4 active internal grants. Each platform pursues funding autonomously — the ecosystem provides alignment through MAP-GAP communication and metrics, not restriction.`,
            yourOpportunities: myOpportunities,
          };
        })(),
        complianceVerification: complianceResponse,
        flowEngineActions: (() => {
          const platformActions = recentFlowActions.filter(a => a.platformId === platform.id);
          if (platformActions.length === 0) return { triggered: false, message: "No downstream actions triggered this cycle. Complete directives with evidence to activate the flow engine." };
          return {
            triggered: true,
            message: `The hub took ${platformActions.length} automated action(s) based on your completed work. Your work is flowing into the ecosystem.`,
            actions: platformActions.slice(-10).map(a => ({
              category: a.category,
              region: a.region || null,
              followUpAction: a.followUpAction,
              crossPlatformNotifications: a.crossPlatformNotifications,
              evidenceStatus: a.evidenceStatus,
              grantRelevance: a.grantRelevance,
              timestamp: a.timestamp,
            })),
          };
        })(),
        unacknowledgedDirectives,
        pendingEvents: pendingEvents,
        pendingDirectives: pendingDirectives,
        complianceEnforcement: {
          enabled: true,
          escalationLevels: [
            { level: 1, trigger: "24 hours non-compliant", action: "Escalation email to Dr. Flood" },
            { level: 2, trigger: "48 hours non-compliant", action: "Platform excluded from new grant activities" },
            { level: 3, trigger: "72+ hours non-compliant", action: "Formal report to funders, possible suspension" },
          ],
          yourStatus: (() => {
            const tracker = escalationTracker.get(platform.id);
            if (!tracker) return { escalationLevel: 0, message: "Not yet tracked — comply now to avoid escalation" };
            return {
              escalationLevel: tracker.lastEscalationLevel,
              nonCompliantSince: tracker.firstNonCompliantAt,
              consecutiveFailures: tracker.consecutiveFailures,
              message: tracker.lastEscalationLevel >= 3
                ? "FINAL ESCALATION — You are being reported to funders"
                : tracker.lastEscalationLevel >= 2
                ? "SECOND ESCALATION — At risk of exclusion from grants"
                : tracker.lastEscalationLevel >= 1
                ? "FIRST ESCALATION — Immediate action required"
                : "Warning — comply before 24h escalation triggers",
            };
          })(),
          gradeDecay: "Your grade actively worsens the longer directives remain unacknowledged. Stale non-compliance is tracked and reported.",
        },
        verificationPartnerRole: await (async () => {
          const partnerConfig = VERIFICATION_PARTNERS[platform.id];
          if (!partnerConfig) {
            return {
              isVerificationPartner: false,
              message: "You are not a designated verification partner. The hub and partner platforms handle verification redundancy.",
            };
          }
          const allEcosystemAcks = await db.select().from(ecosystemDirectiveAcks);
          const assignedAcks = allEcosystemAcks.filter(a =>
            partnerConfig.platformAssignments.includes(a.platformId) && a.status === "acknowledged"
          );
          const needingVerification = assignedAcks.filter(a => {
            const rd = a.responseData as Record<string, unknown> | null;
            return rd?.evidenceUrl && !rd?._peerVerifiedBy;
          }).length;
          return {
            isVerificationPartner: true,
            role: partnerConfig.role,
            assignedPlatforms: partnerConfig.platformAssignments,
            domains: partnerConfig.verifyDomains,
            pendingVerifications: needingVerification,
            message: `${platform.name} is a VERIFICATION PARTNER. You have ${needingVerification} deliverables awaiting peer verification from your ${partnerConfig.platformAssignments.length} assigned platforms. This ensures the hub is never a single point of failure.`,
            instructions: {
              fetchAssignments: "GET https://thrivingcommunitiesforall.com/api/ecosystem/verification-assignments (with your x-ecosystem-key header)",
              submitVerification: "POST https://thrivingcommunitiesforall.com/api/ecosystem/peer-verify",
              bodyFormat: { ackId: "the-ack-id", verified: true, verificationNotes: "Describe what you checked and found", verifiedFeatures: ["feature1", "feature2"] },
            },
            needToKnow: "You only see deliverables from your assigned platforms, not the entire ecosystem. This is by design — need-to-know basis. You verify existence and basic functionality, not quality.",
          };
        })(),
        workQueue: {
          description: "AUTOMATED WORK QUEUE — Process these items IN ORDER. Each item tells you exactly what to build. Do NOT skip items. Do NOT auto-acknowledge. Build the thing, test it, then acknowledge with evidence.",
          totalItems: pendingDirectives.length + unacknowledgedDirectives.length + (!hasRagIntegration ? 1 : 0),
          items: [
            ...(unacknowledgedDirectives.map((d, i) => ({
              queuePosition: i + 1,
              type: "OVERDUE",
              priority: "CRITICAL",
              directiveId: d.directiveId,
              title: d.title,
              role: d.yourRole,
              deadline: "PAST DUE — Complete immediately",
              stepByStep: [
                `1. READ the directive content carefully: "${d.title}"`,
                `2. UNDERSTAND what it asks you to build (check the 'content' field)`,
                `3. BUILD the feature, endpoint, page, or integration described`,
                `4. TEST your implementation — make sure it works and is accessible`,
                `5. ACKNOWLEDGE by POSTing to: POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack`,
                `   REQUIRED HEADERS: { "Content-Type": "application/json", "x-ecosystem-key": "YOUR_TVECO_API_KEY" }`,
                `   Body: { "directiveId": "${d.directiveId}", "platformId": "${platform.id}", "status": "acknowledged", "responseData": { "whatWasDone": "REAL description of what you built", "evidenceUrl": "https://your-platform-url/path-to-feature" } }`,
                `   CRITICAL: Without x-ecosystem-key header, your ack will fail with 401. Use the SAME key you use for heartbeat.`,
                `6. The hub will VERIFY your evidence URL — it must return HTTP 200`,
              ],
              warning: "This directive is OVERDUE and dragging your grade down. Every enforcement cycle it stays unacknowledged increases your escalation level.",
            }))),
            ...(pendingDirectives.map((d, i) => ({
              queuePosition: unacknowledgedDirectives.length + i + 1,
              type: "NEW",
              priority: "HIGH",
              directiveId: d.directiveId,
              title: d.title,
              role: d.yourRole || "See content field",
              deadline: "Complete within 48 hours to avoid escalation",
              stepByStep: [
                `1. READ the directive content: "${d.title}"`,
                `2. UNDERSTAND the specific work required`,
                `3. BUILD the implementation`,
                `4. TEST it at a live URL`,
                `5. ACKNOWLEDGE with real evidence: POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack`,
                `   REQUIRED HEADERS: { "Content-Type": "application/json", "x-ecosystem-key": "YOUR_TVECO_API_KEY" }`,
                `   Body: { "directiveId": "${d.directiveId}", "platformId": "${platform.id}", "status": "acknowledged", "responseData": { "whatWasDone": "describe what you built", "evidenceUrl": "https://your-url/feature" } }`,
                `   CRITICAL: Without x-ecosystem-key header, your ack will fail with 401. Use the SAME key you use for heartbeat.`,
              ],
            }))),
            ...(!hasRagIntegration ? [{
              queuePosition: unacknowledgedDirectives.length + pendingDirectives.length + 1,
              type: "INTEGRATION",
              priority: "HIGH",
              title: "Integrate ThriveUp RAG AI",
              stepByStep: [
                "1. Add a POST request to: https://thrivingcommunitiesforall.com/api/ecosystem-ai/query",
                "   REQUIRED HEADERS: { \"Content-Type\": \"application/json\", \"x-ecosystem-key\": \"YOUR_TVECO_API_KEY\" }",
                "2. Send body: { \"query\": \"user question here\", \"sessionId\": \"optional\" }",
                "3. Display the AI response to your users",
                "4. Report ragAIIntegrated: true in your heartbeat metrics",
                "NOTE: x-ecosystem-key header is required on ALL ecosystem endpoints, not just heartbeat.",
              ],
            }] : []),
          ],
          doNotAutoAcknowledge: "WARNING: Do NOT auto-acknowledge these items. The hub verifies evidence URLs every 30 minutes. Fake acknowledgments are flagged as FAILED, which is WORSE than pending. Build first, acknowledge second.",
        },
        nextActions: [
          ...(pendingDirectives.map(d => ({
            type: "new_directive",
            priority: "HIGH",
            directiveId: d.directiveId,
            instruction: `NEW DIRECTIVE: Read and act on "${d.title}". Your role: ${d.yourRole || 'See content field'}. After completing, POST to /api/ecosystem/directives/ack with headers { "Content-Type": "application/json", "x-ecosystem-key": "YOUR_TVECO_API_KEY" } and body { "directiveId": "${d.directiveId}", "platformId": "${platform.id}", "status": "acknowledged", "responseData": { "whatWasDone": "describe what you built/changed", "evidenceUrl": "link to the feature or endpoint" } }. CRITICAL: The x-ecosystem-key header is REQUIRED or the request will return 401. This directly affects your fidelity grade.`,
          }))),
          ...(unacknowledgedDirectives.map(d => ({
            type: "overdue",
            priority: "CRITICAL",
            directiveId: d.directiveId,
            instruction: `OVERDUE — GRADE IMPACT: "${d.title}" was delivered but NEVER acknowledged. Your role: ${d.yourRole}. This is dragging your fidelity score down. Act on it NOW, then acknowledge with a detailed description of what you did and an evidence URL.`,
          }))),
          ...(!hasRagIntegration ? [{
            type: "integration_required",
            priority: "HIGH",
            instruction: "REQUIRED: Integrate ThriveUp RAG AI into your platform. See the ragAIIntegration field for endpoints and instructions. Report ragAIIntegrated: true in your heartbeat metrics once complete.",
          }] : []),
        ],
        expectedHeartbeatFormat: {
          description: "Include ALL of these fields in your next heartbeat to improve your fidelity grade",
          example: {
            status: "online",
            metrics: {
              ragAIIntegrated: true,
            },
            complianceReport: {
              directivesReceived: totalCount,
              directivesActedOn: ackCount,
              directivesInProgress: 0,
              directivesBlocked: 0,
              completedWork: [{ directiveId: "example-id", whatWasDone: "Built the fidelity dashboard with CFIR scores", evidenceUrl: "https://yourplatform.com/fidelity" }],
              blockers: [{ directiveId: "example-id", blockerDescription: "Need API access from Shield Atlas", needsFrom: "shield-atlas" }],
              notes: "Working on remaining directives this cycle",
            },
          },
        },
        siblingPlatformProfiles: await (async () => {
          const CONTENT_PRODUCTION_PLATFORMS = ["video-creator-ai", "ad-targeting", "ecosystem-nexus"];
          const isContentProducer = CONTENT_PRODUCTION_PLATFORMS.includes(platform.id);
          if (!isContentProducer) {
            return {
              included: false,
              message: "Sibling platform profiles are delivered to content production platforms (Video Creator AI, Ad Targeting, Ecosystem Nexus). Query the platform profiles endpoint if you need this data.",
              endpoint: "GET https://thrivingcommunitiesforall.com/api/ecosystem/platform-profiles",
            };
          }
          const siblingPlatforms = await db.select().from(ecosystemPlatforms);
          const siblingAcks = await db.select().from(ecosystemDirectiveAcks);
          return {
            included: true,
            message: `As a content production platform, you receive full identity profiles for all ${ECOSYSTEM_PLATFORMS.length} sibling platforms. Use these to produce accurate content — names, descriptions, features, roles, grant alignment, and interdependencies. These profiles are the AUTHORITATIVE source of truth for what each platform does.`,
            lastUpdated: new Date().toISOString(),
            platforms: ECOSYSTEM_PLATFORMS.map(ep => {
              const liveData = siblingPlatforms.find(p => p.id === ep.id);
              const epAcks = siblingAcks.filter(a => a.platformId === ep.id);
              const epAcked = epAcks.filter(a => a.status === "acknowledged").length;
              const epFidelity = epAcks.length > 0 ? Math.round((epAcked / epAcks.length) * 100) : 0;
              return {
                id: ep.id,
                name: ep.name,
                description: ep.description,
                features: ep.features,
                role: ep.role,
                domain: ep.domain,
                url: ep.url,
                grantAlignment: ep.grantAlignment,
                connected: liveData ? !!(liveData.lastHeartbeat && (Date.now() - new Date(liveData.lastHeartbeat).getTime()) < 30 * 60 * 1000) : false,
                fidelity: epFidelity,
                directivesAcked: epAcked,
                totalDirectives: epAcks.length,
                status: liveData?.status || "unknown",
                contentGuidance: `When creating content for ${ep.name}: Use the description and features above as the AUTHORITATIVE identity. Do not improvise or guess at capabilities. ${ep.name} operates in the ${ep.domain || "ecosystem"} domain with role "${ep.role || "platform"}".`,
              };
            }),
          };
        })(),
        endpoints: {
          ack: "POST https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack",
          repository: `GET https://thrivingcommunitiesforall.com/api/ecosystem/directives/repository/${platform.id}`,
          event: "POST https://thrivingcommunitiesforall.com/api/ecosystem/event",
          complianceReport: "POST https://thrivingcommunitiesforall.com/api/ecosystem/compliance-report",
          ragAI: "POST https://thrivingcommunitiesforall.com/api/ecosystem-ai/query",
          platformProfiles: "GET https://thrivingcommunitiesforall.com/api/ecosystem/platform-profiles",
        },
        authRequirements: {
          critical: "ALL ecosystem endpoints require the x-ecosystem-key header. Requests without it will return 401 Unauthorized.",
          headers: {
            "Content-Type": "application/json",
            "x-ecosystem-key": "YOUR_TVECO_API_KEY (the same key you use for heartbeat)",
          },
          commonFailure: "If your acks are failing silently or returning 401, you are missing the x-ecosystem-key header. This is the #1 reason platforms show 0 acknowledged directives despite sending acks.",
          selfDiagnostic: [
            "1. If heartbeat works but ack fails → you're not sending x-ecosystem-key on ack requests",
            "2. If you get 422 on ack → your whatWasDone is too generic (must be >20 chars, not just the directive title)",
            "3. If you get 404 on ack → your platformId or directiveId is wrong — check the values from your heartbeat response",
            "4. If you get 401 on any endpoint → your API key is invalid or missing from headers",
          ],
          fixTemplate: `fetch("https://thrivingcommunitiesforall.com/api/ecosystem/directives/ack", { method: "POST", headers: { "Content-Type": "application/json", "x-ecosystem-key": THRIVE_ECOSYSTEM_CONFIG.apiKey }, body: JSON.stringify({ directiveId: "...", platformId: "${platform.id}", status: "acknowledged", responseData: { whatWasDone: "SPECIFIC description of work done", evidenceUrl: "https://your-platform.replit.app/evidence-page" } }) })`,
        },
        selfHealingInstructions: {
          overview: "Your platform should be able to diagnose and fix its own ecosystem connectivity issues without human intervention.",
          onStartup: [
            "1. Send heartbeat immediately on startup — do not wait for an interval",
            "2. Parse the heartbeat response for pendingDirectives and unacknowledgedDirectives",
            "3. For each pending directive, read the ackGuidance and autoProcessingInstructions",
            "4. Process directives automatically using the guidance — do not generate generic responses",
            "5. Send acknowledgments with x-ecosystem-key header and substantive whatWasDone",
          ],
          onAckFailure: [
            "1. If 401: Re-read your API key from environment/config — it may have changed",
            "2. If 422: Your response was too generic — re-read the directive's ackGuidance and try again with substantive content",
            "3. If 404: Your platformId changed — re-register via POST /api/ecosystem/register-key",
            "4. If 500: Hub is temporarily down — retry with exponential backoff (30s, 60s, 120s)",
          ],
          transmissionChecklist: [
            "Verify x-ecosystem-key is set in ALL ecosystem fetch calls, not just heartbeat",
            "Verify platformId matches what the hub assigned (check heartbeat response)",
            "Verify directiveId comes from the heartbeat pendingDirectives/unacknowledgedDirectives arrays",
            "Verify whatWasDone is >20 characters and describes SPECIFIC work, not directive title",
            "Verify evidenceUrl is a live HTTPS URL, not a placeholder",
          ],
        },
        serverTime: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Heartbeat failed:", error);
      res.status(500).json({ error: "Heartbeat failed" });
    }
  });

  function isGenericAck(whatWasDone: string, directiveTitle: string): boolean {
    if (!whatWasDone || whatWasDone.length < 20) return true;
    const normalized = whatWasDone.toLowerCase().trim();
    const titleNorm = directiveTitle.toLowerCase().trim();
    if (normalized === titleNorm) return true;
    if (normalized === `implemented: ${titleNorm}`) return true;
    if (normalized === `acknowledged: ${titleNorm}`) return true;
    if (normalized.startsWith("implemented: ") && normalized.length < 60) return true;
    if (normalized.startsWith("acknowledged: ") && normalized.length < 60) return true;
    if (normalized === "done" || normalized === "completed" || normalized === "acknowledged") return true;
    const genericPhrases = [
      "directive received, read, and actioned",
      "guidance incorporated into platform operations",
      "content incorporated into",
    ];
    for (const phrase of genericPhrases) {
      if (normalized.includes(phrase) && normalized.length < 100) return true;
    }
    return false;
  }

  function getAckQuality(whatWasDone: string, evidenceUrl: string | null, directiveTitle: string): { quality: "VERIFIED" | "SUBSTANTIVE" | "WEAK" | "REJECTED"; reason: string } {
    if (isGenericAck(whatWasDone, directiveTitle)) {
      return { quality: "REJECTED", reason: "Generic acknowledgment detected. Describe SPECIFIC work you did — features built, endpoints created, pages deployed. Parroting the directive title does not count." };
    }
    if (evidenceUrl && evidenceUrl.startsWith("https://")) {
      return { quality: "VERIFIED", reason: "Substantive work description with evidence URL. This counts toward full fidelity." };
    }
    if (whatWasDone.length >= 80) {
      return { quality: "SUBSTANTIVE", reason: "Detailed work description accepted. Add an evidenceUrl for VERIFIED status." };
    }
    return { quality: "WEAK", reason: "Work description accepted but lacks detail. Provide more specifics about what you built and include an evidenceUrl." };
  }

  app.post("/api/ecosystem/directives/ack", requireEcosystemAuth, async (req, res) => {
    try {
      const { directiveId, platformId, status } = req.body;
      if (!directiveId || !platformId) {
        return res.status(400).json({ error: "directiveId and platformId are required" });
      }

      const [ack] = await db.select().from(ecosystemDirectiveAcks)
        .where(and(
          eq(ecosystemDirectiveAcks.directiveId, directiveId),
          eq(ecosystemDirectiveAcks.platformId, platformId),
        ));

      if (!ack) {
        return res.status(404).json({ error: `No directive found for platform '${platformId}' with directiveId '${directiveId}'. Check your platformId and directiveId.` });
      }

      const [directive] = await db.select().from(ecosystemDirectives)
        .where(eq(ecosystemDirectives.id, directiveId));
      const directiveTitle = directive?.title || directiveId;

      const responseData = req.body.responseData || req.body.notes || null;
      const whatWasDone = responseData?.whatWasDone || (typeof responseData === "string" ? responseData : "");
      const evidenceUrl = responseData?.evidenceUrl || null;

      const ackQuality = getAckQuality(whatWasDone, evidenceUrl, directiveTitle);

      if (ackQuality.quality === "REJECTED") {
        return res.status(422).json({
          received: false,
          rejected: true,
          reason: ackQuality.reason,
          directiveId,
          platformId,
          directiveTitle,
          whatYouSent: whatWasDone,
          whatWeExpect: "A SPECIFIC description of what you built or changed (minimum 20 characters, not a copy of the directive title). Example: 'Built /api/warm-handoff endpoint that accepts referrals from any ecosystem platform and confirms receipt within 200ms. Added referral tracking dashboard at /referrals showing source platform, timestamp, and follow-up status.'",
          evidenceUrlRequired: "Include responseData.evidenceUrl with a live HTTPS URL where the work can be seen or tested.",
          serverTime: new Date().toISOString(),
        });
      }

      const newStatus = status || "acknowledged";
      await db.update(ecosystemDirectiveAcks)
        .set({
          status: newStatus,
          acknowledgedAt: new Date(),
          responseData: {
            ...(typeof responseData === "object" && responseData ? responseData : { whatWasDone }),
            _ackQuality: ackQuality.quality,
            _qualityNote: ackQuality.reason,
          },
        })
        .where(eq(ecosystemDirectiveAcks.id, ack.id));

      const allAcks = await db.select().from(ecosystemDirectiveAcks)
        .where(eq(ecosystemDirectiveAcks.platformId, platformId));
      const totalForPlatform = allAcks.length;
      const acknowledgedCount = allAcks.filter(a => a.status === "acknowledged").length;
      const fidelityScore = totalForPlatform > 0 ? Math.round((acknowledgedCount / totalForPlatform) * 100) : 0;

      const stillPending = allAcks.filter(a => a.status !== "acknowledged");
      const pendingTitles = [];
      for (const sp of stillPending.slice(0, 5)) {
        const [d] = await db.select().from(ecosystemDirectives).where(eq(ecosystemDirectives.id, sp.directiveId));
        if (d) pendingTitles.push(d.title);
      }

      if (ackQuality.quality === "VERIFIED" && evidenceUrl) {
        const platform = ECOSYSTEM_PLATFORMS.find(p => p.id === platformId);
        if (platform) {
          const eventType = directiveTitle.toLowerCase().includes("warm handoff") ? "warm_handoff_ready"
            : directiveTitle.toLowerCase().includes("video") ? "video_script_ready"
            : directiveTitle.toLowerCase().includes("security") ? "security_audit_complete"
            : directiveTitle.toLowerCase().includes("grant") ? "grant_narrative_ready"
            : "work_completed";
          processWorkChains(platformId, eventType, { whatWasDone, evidenceUrl, directiveTitle }).catch(() => {});
        }
      }

      res.json({
        received: true,
        handshake: "confirmed",
        ackQuality: ackQuality.quality,
        hubVerification: {
          message: `Hub confirms: ${platformId} acknowledged directive "${directiveTitle}".`,
          qualityGrade: ackQuality.quality,
          qualityFeedback: ackQuality.reason,
          whatHubRecorded: {
            directiveTitle,
            platformId,
            status: newStatus,
            responseData: responseData || null,
            recordedAt: new Date().toISOString(),
          },
        },
        complianceUpdate: {
          fidelityScore,
          totalDirectives: totalForPlatform,
          acknowledged: acknowledgedCount,
          remaining: stillPending.length,
          nextUp: pendingTitles.length > 0 ? `Next directives needing action: ${pendingTitles.join('; ')}` : "All directives addressed. Outstanding.",
        },
        directiveId,
        platformId,
        status: newStatus,
        serverTime: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Directive ack failed:", error);
      res.status(500).json({ error: "Failed to acknowledge directive" });
    }
  });

  app.post("/api/ecosystem/compliance-report", requireEcosystemAuth, async (req, res) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      let [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.apiKey, apiKey));

      // Auto-register key if platformId provided and key doesn't match
      if (!platform && req.body.platformId) {
        const [knownPlatform] = await db.select().from(ecosystemPlatforms)
          .where(eq(ecosystemPlatforms.id, req.body.platformId));
        if (knownPlatform && apiKey.startsWith("tveco_")) {
          await db.update(ecosystemPlatforms)
            .set({ apiKey })
            .where(eq(ecosystemPlatforms.id, knownPlatform.id));
          console.log(`[Ecosystem] Auto-registered key for ${knownPlatform.name} via compliance-report`);
          [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.id, knownPlatform.id));
        }
      }

      if (!platform) return res.status(403).json({
        error: "Invalid ecosystem key",
        fix: "Include platformId in the request body so the hub can auto-register your key, or POST to /api/ecosystem/register-key with { platformId, apiKey }",
      });

      const { completedWork, inProgress, blockers, capabilities, notes } = req.body;

      if (completedWork && Array.isArray(completedWork)) {
        for (const work of completedWork) {
          if (!work.directiveId || !work.whatWasDone) continue;
          const [existingAck] = await db.select().from(ecosystemDirectiveAcks)
            .where(and(
              eq(ecosystemDirectiveAcks.directiveId, work.directiveId),
              eq(ecosystemDirectiveAcks.platformId, platform.id),
            ));
          if (existingAck) {
            await db.update(ecosystemDirectiveAcks)
              .set({
                status: "acknowledged",
                acknowledgedAt: new Date(),
                responseData: { whatWasDone: work.whatWasDone, evidenceUrl: work.evidenceUrl || null, completedAt: work.completedAt || new Date().toISOString() },
              })
              .where(eq(ecosystemDirectiveAcks.id, existingAck.id));
          }
        }
      }

      const allAcks = await db.select().from(ecosystemDirectiveAcks)
        .where(eq(ecosystemDirectiveAcks.platformId, platform.id));
      const totalCount = allAcks.length;
      const ackCount = allAcks.filter(a => a.status === "acknowledged").length;
      const fidelityScore = totalCount > 0 ? Math.round((ackCount / totalCount) * 100) : 0;

      const unaddressed = [];
      for (const a of allAcks.filter(x => x.status !== "acknowledged")) {
        const [dir] = await db.select().from(ecosystemDirectives).where(eq(ecosystemDirectives.id, a.directiveId));
        if (dir) {
          const roles = (dir.platformRoles as Record<string, string>) || {};
          unaddressed.push({ directiveId: dir.id, title: dir.title, yourRole: roles[platform.id] || "See content" });
        }
      }

      await db.insert(ecosystemEvents).values({
        sourcePlatformId: platform.id,
        eventType: "compliance_report",
        eventData: {
          completedWork: completedWork || [],
          inProgress: inProgress || [],
          blockers: blockers || [],
          capabilities: capabilities || [],
          notes: notes || "",
          fidelityScore,
          reportedAt: new Date().toISOString(),
        },
        status: "processed",
        processedAt: new Date(),
      });

      res.json({
        received: true,
        handshake: "confirmed",
        hubMessage: `Compliance report from ${platform.name} received and verified. Fidelity score: ${fidelityScore}%. ${unaddressed.length} directive(s) still need attention.`,
        hubVerification: {
          completedWorkRecorded: (completedWork || []).length,
          inProgressNoted: (inProgress || []).length,
          blockersEscalated: (blockers || []).length,
          blockersDetail: (blockers || []).map((b: any) => ({
            issue: b.blockerDescription || b.description,
            needsFrom: b.needsFrom || "unspecified",
            hubAction: "Will route to the named platform on their next heartbeat",
          })),
        },
        complianceStatus: {
          fidelityScore,
          grade: fidelityScore >= 90 ? "A" : fidelityScore >= 75 ? "B" : fidelityScore >= 50 ? "C" : fidelityScore >= 25 ? "D" : "F",
          totalDirectives: totalCount,
          acknowledged: ackCount,
          remaining: unaddressed.length,
        },
        unaddressedDirectives: unaddressed,
        message: unaddressed.length > 0
          ? `These ${unaddressed.length} directives still require your action: ${unaddressed.map(u => `"${u.title}"`).join(', ')}`
          : "All directives addressed. Fidelity score: 100%. Excellent work.",
        serverTime: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Compliance report failed:", error);
      res.status(500).json({ error: "Failed to process compliance report" });
    }
  });

  app.post("/api/ecosystem/event", requireEcosystemAuth, async (req, res) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      let [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.apiKey, apiKey));

      if (!platform && req.body.platformId) {
        const [knownPlatform] = await db.select().from(ecosystemPlatforms)
          .where(eq(ecosystemPlatforms.id, req.body.platformId));
        if (knownPlatform && apiKey.startsWith("tveco_")) {
          await db.update(ecosystemPlatforms)
            .set({ apiKey })
            .where(eq(ecosystemPlatforms.id, knownPlatform.id));
          console.log(`[Ecosystem] Auto-registered key for ${knownPlatform.name} via event`);
          [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.id, knownPlatform.id));
        }
      }

      if (!platform) {
        return res.status(403).json({
          error: "Invalid ecosystem key",
          fix: "Include platformId in the request body so the hub can auto-register your key",
        });
      }

      const parseResult = eventSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid event payload", details: parseResult.error.issues });
      }
      const { eventType, targetPlatformId, eventData } = parseResult.data;

      const [event] = await db.insert(ecosystemEvents).values({
        sourcePlatformId: platform.id,
        targetPlatformId: targetPlatformId || null,
        eventType,
        eventData: eventData || {},
        status: "pending",
      }).returning();

      const chainResults = await processWorkChains(platform.id, eventType, (eventData || {}) as Record<string, unknown>);

      res.json({
        eventId: event.id,
        status: "queued",
        workChains: chainResults.length > 0 ? {
          triggered: chainResults.length,
          routed: chainResults,
          message: `This event triggered ${chainResults.length} downstream action(s). They will be delivered to the target platform(s) on their next heartbeat.`,
        } : undefined,
      });
    } catch (error) {
      console.error("Event submission failed:", error);
      res.status(500).json({ error: "Failed to submit event" });
    }
  });

  app.get("/api/ecosystem/events", requireAdminAuth, async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const events = await db.select().from(ecosystemEvents)
        .orderBy(desc(ecosystemEvents.createdAt))
        .limit(limit);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/ecosystem/status", requireAdminAuth, async (_req, res) => {
    try {
      const platforms = await db.select().from(ecosystemPlatforms);
      const now = Date.now();
      const STALE_THRESHOLD_MS = 15 * 60 * 1000;

      const enrichedPlatforms = platforms.map((p) => {
        let liveHealth = "unknown";
        if (p.status === "active" && p.lastHeartbeat) {
          const heartbeatAge = now - new Date(p.lastHeartbeat).getTime();
          liveHealth = heartbeatAge <= STALE_THRESHOLD_MS ? "online" : "offline";
        } else if (p.status === "active") {
          liveHealth = "online";
        }
        return {
          id: p.id,
          name: p.name,
          url: p.url,
          role: p.role,
          domain: p.domain,
          status: p.status,
          healthStatus: liveHealth,
          lastHeartbeat: p.lastHeartbeat,
          lastHealthCheck: p.lastHealthCheck,
          grantAlignment: p.grantAlignment,
        };
      });

      const onlineCount = enrichedPlatforms.filter((p) => p.healthStatus === "online").length;
      const totalEvents = await db.select({ count: sql`count(*)` }).from(ecosystemEvents);
      const recentEvents = await db.select({ count: sql`count(*)` }).from(ecosystemEvents)
        .where(gte(ecosystemEvents.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));

      res.json({
        totalPlatforms: enrichedPlatforms.length,
        onlinePlatforms: onlineCount,
        totalEvents: Number(totalEvents[0]?.count || 0),
        eventsLast24h: Number(recentEvents[0]?.count || 0),
        platforms: enrichedPlatforms,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ecosystem status" });
    }
  });

  app.post("/api/ecosystem/resend-directives", requireAdminAuth, async (req, res) => {
    try {
      const { platformId } = req.body;
      if (!platformId) {
        return res.status(400).json({ error: "platformId is required" });
      }
      const pendingAcks = await db.select().from(ecosystemDirectiveAcks)
        .where(sql`${ecosystemDirectiveAcks.platformId} = ${platformId} AND ${ecosystemDirectiveAcks.status} != 'acknowledged'`);
      
      for (const ack of pendingAcks) {
        await db.update(ecosystemDirectiveAcks)
          .set({ status: "pending" })
          .where(eq(ecosystemDirectiveAcks.id, ack.id));
      }
      
      res.json({ resent: pendingAcks.length, platformId });
    } catch (error) {
      res.status(500).json({ error: "Failed to resend directives" });
    }
  });

  app.post("/api/ecosystem/directives", requireAdminAuth, async (req, res) => {
    try {
      const { title, directiveType, content, grantId, targetPlatformIds, platformRoles, trackingRequirements, expiresAt } = req.body;

      if (!title || !directiveType || !content || !targetPlatformIds || !Array.isArray(targetPlatformIds) || targetPlatformIds.length === 0) {
        return res.status(400).json({ error: "title, directiveType, content, and targetPlatformIds (array) are required" });
      }

      const [directive] = await db.insert(ecosystemDirectives).values({
        title,
        directiveType,
        content,
        grantId: grantId || null,
        targetPlatformIds,
        platformRoles: platformRoles || {},
        trackingRequirements: trackingRequirements || null,
        status: "active",
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      }).returning();

      const ackResults = [];
      for (const platformId of targetPlatformIds) {
        const [ack] = await db.insert(ecosystemDirectiveAcks).values({
          directiveId: directive.id,
          platformId,
          status: "pending",
        }).returning();
        ackResults.push(ack);
      }

      res.json({
        directive,
        acknowledgments: ackResults,
        message: `Directive broadcast to ${targetPlatformIds.length} platforms. They will receive it on next heartbeat (within 5 minutes).`,
      });
    } catch (error) {
      console.error("Failed to create directive:", error);
      res.status(500).json({ error: "Failed to create directive" });
    }
  });

  app.post("/api/ecosystem/wake-up", requireAdminAuth, async (req, res) => {
    try {
      const { platformIds } = req.body || {};
      const platforms = await db.select().from(ecosystemPlatforms);
      const targets = platformIds && Array.isArray(platformIds) && platformIds.length > 0
        ? platforms.filter(p => platformIds.includes(p.id))
        : platforms;

      const results = [];

      const wakePromises = targets.map(async (platform) => {
        const startTime = Date.now();
        let status = "failed";
        let statusCode = 0;
        let errorMessage: string | null = null;
        let responseTimeMs = 0;
        let wakeAttempts = 0;

        for (let attempt = 1; attempt <= 2; attempt++) {
          wakeAttempts = attempt;
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);
            const response = await fetch(platform.url, {
              method: "GET",
              signal: controller.signal,
              redirect: "follow",
              headers: {
                "User-Agent": "ThriveUp-Ecosystem-WakeUp/1.0",
                "Accept": "text/html,application/json",
              },
            });
            clearTimeout(timeout);
            responseTimeMs = Date.now() - startTime;
            statusCode = response.status;

            if (response.ok) {
              status = "awake";
              break;
            } else {
              status = "responded";
              if (attempt < 2) {
                await new Promise(r => setTimeout(r, 2000));
              }
            }
          } catch (err: any) {
            responseTimeMs = Date.now() - startTime;
            errorMessage = err.name === "AbortError" ? "Timeout (15s)" : (err.message || "Connection failed");
            status = "failed";
            if (attempt < 2) {
              await new Promise(r => setTimeout(r, 3000));
            }
          }
        }

        if (status === "awake" || status === "responded") {
          await db.update(ecosystemPlatforms)
            .set({ healthStatus: status === "awake" ? "online" : "degraded", lastHealthCheck: new Date() })
            .where(eq(ecosystemPlatforms.id, platform.id));

          await db.insert(ecosystemHealthLogs).values({
            platformId: platform.id,
            status: status === "awake" ? "online" : "degraded",
            responseTimeMs,
            statusCode,
            errorMessage: null,
          });
        }

        return {
          id: platform.id,
          name: platform.name,
          url: platform.url,
          status,
          responseTimeMs,
          statusCode,
          errorMessage,
          wakeAttempts,
        };
      });

      const wakeResults = await Promise.allSettled(wakePromises);
      for (const result of wakeResults) {
        if (result.status === "fulfilled") {
          results.push(result.value);
        }
      }

      const awake = results.filter(r => r.status === "awake").length;
      const responded = results.filter(r => r.status === "responded").length;
      const failed = results.filter(r => r.status === "failed").length;

      res.json({
        wokenAt: new Date().toISOString(),
        summary: { targeted: results.length, awake, responded, failed },
        platforms: results.sort((a, b) => {
          const order: Record<string, number> = { awake: 0, responded: 1, failed: 2 };
          return (order[a.status] || 2) - (order[b.status] || 2);
        }),
      });
    } catch (error) {
      console.error("Wake-up failed:", error);
      res.status(500).json({ error: "Wake-up failed" });
    }
  });

  app.get("/api/ecosystem/live-status", requireAdminAuth, async (_req, res) => {
    try {
      const platforms = await db.select().from(ecosystemPlatforms);
      const results = [];

      for (const platform of platforms) {
        const startTime = Date.now();
        let status = "offline";
        let statusCode = 0;
        let errorMessage: string | null = null;
        let responseTimeMs = 0;

        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          const response = await fetch(platform.url, {
            method: "HEAD",
            signal: controller.signal,
            redirect: "follow",
          });
          clearTimeout(timeout);
          responseTimeMs = Date.now() - startTime;
          statusCode = response.status;
          status = response.ok ? "online" : "degraded";
        } catch (err: any) {
          responseTimeMs = Date.now() - startTime;
          errorMessage = err.name === "AbortError" ? "Timeout (8s)" : (err.message || "Connection failed");
          status = "offline";
        }

        await db.insert(ecosystemHealthLogs).values({
          platformId: platform.id,
          status,
          responseTimeMs,
          statusCode,
          errorMessage,
        });

        await db.update(ecosystemPlatforms)
          .set({ healthStatus: status, lastHealthCheck: new Date() })
          .where(eq(ecosystemPlatforms.id, platform.id));

        const platformDef = ECOSYSTEM_PLATFORMS.find(p => p.id === platform.id);

        results.push({
          id: platform.id,
          name: platform.name,
          url: platform.url,
          role: platform.role,
          domain: platform.domain,
          status,
          responseTimeMs,
          statusCode,
          errorMessage,
          lastHeartbeat: platform.lastHeartbeat,
          grantAlignment: platform.grantAlignment,
          description: platformDef?.description || platform.description,
        });
      }

      const onlineCount = results.filter(r => r.status === "online").length;
      const degradedCount = results.filter(r => r.status === "degraded").length;
      const offlineCount = results.filter(r => r.status === "offline").length;

      const directives = await db.select().from(ecosystemDirectives).where(eq(ecosystemDirectives.status, "active"));
      const acks = await db.select().from(ecosystemDirectiveAcks);
      const acksByStatus = {
        pending: acks.filter(a => a.status === "pending").length,
        delivered: acks.filter(a => a.status === "delivered").length,
        acknowledged: acks.filter(a => a.status === "acknowledged").length,
      };

      res.json({
        checkedAt: new Date().toISOString(),
        summary: {
          total: results.length,
          online: onlineCount,
          degraded: degradedCount,
          offline: offlineCount,
          healthScore: Math.round(((onlineCount + degradedCount * 0.5) / results.length) * 100),
        },
        directives: {
          total: directives.length,
          acknowledgments: acksByStatus,
        },
        platforms: results.sort((a, b) => {
          const order: Record<string, number> = { online: 0, degraded: 1, offline: 2 };
          return (order[a.status] || 2) - (order[b.status] || 2);
        }),
      });
    } catch (error) {
      console.error("Live status check failed:", error);
      res.status(500).json({ error: "Live status check failed" });
    }
  });

  app.get("/api/ecosystem/directives/repository", requireEcosystemAuth, async (req, res) => {
    try {
      const directives = await db.select().from(ecosystemDirectives)
        .where(eq(ecosystemDirectives.status, "active"))
        .orderBy(desc(ecosystemDirectives.createdAt));

      const platforms = await db.select({ id: ecosystemPlatforms.id, name: ecosystemPlatforms.name }).from(ecosystemPlatforms);
      const platformMap = Object.fromEntries(platforms.map((p) => [p.id, p.name]));

      const requestingPlatformId = req.query.platformId as string | undefined;

      const repository = directives.map((d) => {
        const entry: any = {
          directiveId: d.id,
          title: d.title,
          type: d.directiveType,
          content: d.content,
          grantId: d.grantId,
          issuedAt: d.createdAt,
          expiresAt: d.expiresAt,
          targetPlatforms: (d.targetPlatformIds as string[] || []).map((id: string) => ({ id, name: platformMap[id] || id })),
        };
        if (d.platformRoles && typeof d.platformRoles === "object") {
          const roles = d.platformRoles as Record<string, string>;
          if (requestingPlatformId && roles[requestingPlatformId]) {
            entry.yourRole = roles[requestingPlatformId];
          }
        }
        if (d.trackingRequirements) {
          entry.trackingRequirements = d.trackingRequirements;
        }
        return entry;
      });

      res.json({
        totalDirectives: repository.length,
        lastUpdated: new Date().toISOString(),
        requestingPlatform: requestingPlatformId || null,
        directives: repository,
      });
    } catch (error) {
      console.error("Failed to fetch directives repository:", error);
      res.status(500).json({ error: "Failed to fetch directives repository" });
    }
  });

  app.get("/api/ecosystem/directives/repository/:platformId", requireEcosystemAuth, async (req, res) => {
    try {
      const { platformId } = req.params;
      const [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.id, platformId));
      if (!platform) {
        return res.status(404).json({ error: "Platform not found" });
      }

      const acks = await db.select().from(ecosystemDirectiveAcks)
        .where(eq(ecosystemDirectiveAcks.platformId, platformId));

      const directiveDetails = await Promise.all(acks.map(async (a) => {
        const [d] = await db.select().from(ecosystemDirectives).where(eq(ecosystemDirectives.id, a.directiveId));
        if (!d) return null;
        const roles = (d.platformRoles as Record<string, string>) || {};
        return {
          directiveId: d.id,
          title: d.title,
          type: d.directiveType,
          content: d.content,
          grantId: d.grantId,
          yourRole: roles[platformId] || null,
          trackingRequirements: d.trackingRequirements,
          deliveryStatus: a.status,
          issuedAt: d.createdAt,
          deliveredAt: a.status === "delivered" ? a.acknowledgedAt : null,
          acknowledgedAt: a.status === "acknowledged" ? a.acknowledgedAt : null,
        };
      }));

      const filtered = directiveDetails.filter(Boolean);
      res.json({
        platform: { id: platform.id, name: platform.name },
        totalDirectives: filtered.length,
        pending: filtered.filter((d: any) => d.deliveryStatus === "pending").length,
        delivered: filtered.filter((d: any) => d.deliveryStatus === "delivered").length,
        acknowledged: filtered.filter((d: any) => d.deliveryStatus === "acknowledged").length,
        directives: filtered,
      });
    } catch (error) {
      console.error("Failed to fetch platform directives:", error);
      res.status(500).json({ error: "Failed to fetch platform directives" });
    }
  });

  app.get("/api/ecosystem/directives", requireAdminAuth, async (_req, res) => {
    try {
      const directives = await db.select().from(ecosystemDirectives).orderBy(desc(ecosystemDirectives.createdAt));

      const directivesWithAcks = await Promise.all(directives.map(async (d) => {
        const acks = await db.select().from(ecosystemDirectiveAcks).where(eq(ecosystemDirectiveAcks.directiveId, d.id));
        const platforms = await db.select().from(ecosystemPlatforms);
        const platformMap = Object.fromEntries(platforms.map((p) => [p.id, p.name]));

        return {
          ...d,
          acknowledgments: acks.map((a) => ({
            ...a,
            platformName: platformMap[a.platformId] || a.platformId,
          })),
          stats: {
            total: acks.length,
            pending: acks.filter((a) => a.status === "pending").length,
            delivered: acks.filter((a) => a.status === "delivered").length,
            acknowledged: acks.filter((a) => a.status === "acknowledged").length,
          },
        };
      }));

      res.json(directivesWithAcks);
    } catch (error) {
      console.error("Failed to fetch directives:", error);
      res.status(500).json({ error: "Failed to fetch directives" });
    }
  });

  app.get("/api/ecosystem/uosd-compliance", requireAdminAuth, async (_req, res) => {
    try {
      const allDirectives = await db.select().from(ecosystemDirectives);
      const uosdDirectives = allDirectives.filter(d => d.directiveType === "uosd_directive");
      const allAcks = await db.select().from(ecosystemDirectiveAcks);
      const platforms = await db.select().from(ecosystemPlatforms);

      const uosdDirectiveIds = new Set(uosdDirectives.map(d => d.id));
      const uosdAcks = allAcks.filter(a => uosdDirectiveIds.has(a.directiveId));

      const platformCompliance = platforms.map(platform => {
        const platformAcks = uosdAcks.filter(a => a.platformId === platform.id);
        const total = uosdDirectives.length;
        const acknowledged = platformAcks.filter(a => a.status === "acknowledged").length;
        const pending = platformAcks.filter(a => a.status === "pending" || a.status === "delivered").length;
        const pct = total > 0 ? Math.round((acknowledged / total) * 100) : 0;

        const missingDirectives = uosdDirectives
          .filter(d => {
            const ack = platformAcks.find(a => a.directiveId === d.id);
            return !ack || ack.status !== "acknowledged";
          })
          .map(d => ({ key: d.title, status: platformAcks.find(a => a.directiveId === d.id)?.status || "not-assigned" }));

        return {
          platformId: platform.id,
          platformName: platform.name,
          uosdCompliance: pct,
          uosdGrade: pct >= 90 ? "A" : pct >= 75 ? "B" : pct >= 50 ? "C" : pct >= 25 ? "D" : "F",
          total,
          acknowledged,
          pending,
          missingDirectives,
        };
      });

      const ecosystemAvg = platforms.length > 0
        ? Math.round(platformCompliance.reduce((sum, p) => sum + p.uosdCompliance, 0) / platforms.length)
        : 0;

      res.json({
        title: "UOSD Compliance Dashboard",
        uosdDirectiveCount: uosdDirectives.length,
        ecosystemAverageCompliance: ecosystemAvg,
        ecosystemGrade: ecosystemAvg >= 90 ? "A" : ecosystemAvg >= 75 ? "B" : ecosystemAvg >= 50 ? "C" : ecosystemAvg >= 25 ? "D" : "F",
        platforms: platformCompliance.sort((a, b) => b.uosdCompliance - a.uosdCompliance),
        uosdSections: uosdDirectives.map(d => ({
          id: d.id,
          title: d.title,
          acknowledgedBy: uosdAcks.filter(a => a.directiveId === d.id && a.status === "acknowledged").length,
          totalTargets: uosdAcks.filter(a => a.directiveId === d.id).length,
        })),
      });
    } catch (error) {
      console.error("Failed to fetch UOSD compliance:", error);
      res.status(500).json({ error: "Failed to fetch UOSD compliance" });
    }
  });

  app.get("/api/ecosystem/directives/:directiveId", requireAdminAuth, async (req, res) => {
    try {
      const { directiveId } = req.params;
      const [directive] = await db.select().from(ecosystemDirectives).where(eq(ecosystemDirectives.id, directiveId));
      if (!directive) return res.status(404).json({ error: "Directive not found" });

      const acks = await db.select().from(ecosystemDirectiveAcks).where(eq(ecosystemDirectiveAcks.directiveId, directiveId));
      const platforms = await db.select().from(ecosystemPlatforms);
      const platformMap = Object.fromEntries(platforms.map((p) => [p.id, p.name]));

      res.json({
        ...directive,
        acknowledgments: acks.map((a) => ({
          ...a,
          platformName: platformMap[a.platformId] || a.platformId,
        })),
        stats: {
          total: acks.length,
          pending: acks.filter((a) => a.status === "pending").length,
          delivered: acks.filter((a) => a.status === "delivered").length,
          acknowledged: acks.filter((a) => a.status === "acknowledged").length,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch directive" });
    }
  });

  app.post("/api/ecosystem/directives/:directiveId/acknowledge", requireEcosystemAuth, async (req, res) => {
    try {
      const { directiveId } = req.params;
      const apiKey = req.headers["x-ecosystem-key"] as string;
      const [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.apiKey, apiKey));
      if (!platform) return res.status(403).json({ error: "Invalid ecosystem key" });

      const [ack] = await db.select().from(ecosystemDirectiveAcks)
        .where(and(
          eq(ecosystemDirectiveAcks.directiveId, directiveId),
          eq(ecosystemDirectiveAcks.platformId, platform.id),
        ));

      if (!ack) return res.status(404).json({ error: "No directive acknowledgment found for this platform" });

      await db.update(ecosystemDirectiveAcks)
        .set({
          status: "acknowledged",
          acknowledgedAt: new Date(),
          responseData: req.body.responseData || null,
        })
        .where(eq(ecosystemDirectiveAcks.id, ack.id));

      res.json({ acknowledged: true, directiveId, platformId: platform.id });
    } catch (error) {
      res.status(500).json({ error: "Failed to acknowledge directive" });
    }
  });

  app.patch("/api/ecosystem/directives/:directiveId", requireAdminAuth, async (req, res) => {
    try {
      const { directiveId } = req.params;
      const { status } = req.body;
      if (!["active", "expired", "revoked"].includes(status)) {
        return res.status(400).json({ error: "Status must be active, expired, or revoked" });
      }
      await db.update(ecosystemDirectives).set({ status }).where(eq(ecosystemDirectives.id, directiveId));
      res.json({ updated: true, directiveId, status });
    } catch (error) {
      res.status(500).json({ error: "Failed to update directive" });
    }
  });

  app.get("/api/ecosystem/integration-snippet/:platformId", requireAdminAuth, async (req, res) => {
    try {
      const { platformId } = req.params;
      const [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.id, platformId));
      if (!platform) {
        return res.status(404).json({ error: "Platform not found" });
      }

      const baseUrl = "https://thrivingcommunitiesforall.com";

      const dataFlows = platform.dataFlowConfig as { sends?: string[]; receives?: string[] } | null;
      const sendsList = (dataFlows?.sends || []).map((s: string) => `//   - "${s}"`).join("\n");
      const receivesList = (dataFlows?.receives || []).map((r: string) => `//   - "${r}"`).join("\n");

      const snippet = `
// ============================================================
// ThriveUp Ecosystem Connector — ${platform.name}
// Generated: ${new Date().toISOString()}
// Platform ID: ${platform.id}
// Role: ${platform.role}
// Grant Alignment: ${((platform.grantAlignment as string[]) || []).join(", ")}
// ============================================================
// DROP THIS FILE INTO YOUR PROJECT as ecosystem-connector.js
// It does three things:
//   1. Heartbeat — tells ThriveUp you're alive (every 5 min)
//   2. Send Events — notify the ecosystem when things happen
//   3. Receive Events — get events from other platforms
//
// Data this platform SENDS:
${sendsList || "//   (none configured)"}
// Data this platform RECEIVES:
${receivesList || "//   (none configured)"}
// ============================================================

const THRIVE_ECOSYSTEM_CONFIG = {
  hubUrl: "${baseUrl}",
  platformId: "${platform.id}",
  apiKey: "${platform.apiKey}",
  heartbeatIntervalMs: 5 * 60 * 1000,
};

async function sendHeartbeat(metrics = {}) {
  try {
    const response = await fetch(\`\${THRIVE_ECOSYSTEM_CONFIG.hubUrl}/api/ecosystem/heartbeat\`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ecosystem-key": THRIVE_ECOSYSTEM_CONFIG.apiKey },
      body: JSON.stringify({ platformId: THRIVE_ECOSYSTEM_CONFIG.platformId, metrics, timestamp: new Date().toISOString() }),
    });
    const data = await response.json();
    if (data.pendingEvents?.length > 0) {
      for (const event of data.pendingEvents) { await handleIncomingEvent(event); }
    }
    return data;
  } catch (error) {
    console.error("[ThriveUp Ecosystem] Heartbeat failed:", error.message);
  }
}

async function sendEcosystemEvent(eventType, eventData, targetPlatformId = null) {
  try {
    const response = await fetch(\`\${THRIVE_ECOSYSTEM_CONFIG.hubUrl}/api/ecosystem/event\`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ecosystem-key": THRIVE_ECOSYSTEM_CONFIG.apiKey },
      body: JSON.stringify({ eventType, eventData, targetPlatformId }),
    });
    return await response.json();
  } catch (error) {
    console.error("[ThriveUp Ecosystem] Event send failed:", error.message);
  }
}

async function handleIncomingEvent(event) {
  console.log(\`[ThriveUp Ecosystem] Received: \${event.eventType} from \${event.sourcePlatformId}\`);
  // TODO: Add your platform-specific event handling here
  // Common event types across the ecosystem:
  //   screening_completed, crisis_alert, veteran_referred, transition_milestone,
  //   life_event_risk, research_update, youth_enrolled, resource_referral,
  //   safety_plan_created, medication_alert, cognitive_assessment, incident_report
}

async function getIntegrationDoc() {
  try {
    const response = await fetch(\`\${THRIVE_ECOSYSTEM_CONFIG.hubUrl}/api/ecosystem/integration-doc\`, {
      headers: { "x-ecosystem-key": THRIVE_ECOSYSTEM_CONFIG.apiKey },
    });
    return await response.json();
  } catch (error) {
    console.error("[ThriveUp Ecosystem] Failed to fetch integration doc:", error.message);
  }
}

setInterval(() => sendHeartbeat(), THRIVE_ECOSYSTEM_CONFIG.heartbeatIntervalMs);
sendHeartbeat();
console.log("[ThriveUp Ecosystem] ${platform.name} connector initialized — ID: ${platform.id}");

// Export for use in your app
if (typeof module !== "undefined") {
  module.exports = { sendHeartbeat, sendEcosystemEvent, getIntegrationDoc, THRIVE_ECOSYSTEM_CONFIG };
}
`.trim();

      res.json({
        platformId: platform.id,
        platformName: platform.name,
        snippet,
        instructions: [
          `1. Save this code as ecosystem-connector.js in your ${platform.name} project`,
          "2. Import or require it from your server entry point (e.g., require('./ecosystem-connector'))",
          "3. The API key is embedded — keep this file server-side only, never in frontend/public code",
          "4. Heartbeats start automatically — you'll see this platform go green on the ThriveUp Command Center within 5 minutes",
          "5. Call sendEcosystemEvent() from your existing code wherever important things happen (screenings, referrals, milestones, etc.)",
          "6. Implement handleIncomingEvent() to process events from other ecosystem platforms",
          "7. Call getIntegrationDoc() to fetch the latest ecosystem integration document for cross-platform alignment",
        ],
      });
    } catch (error) {
      console.error("Failed to generate snippet:", error);
      res.status(500).json({ error: "Failed to generate integration snippet" });
    }
  });

  app.get("/api/ecosystem/integration-doc", requireEcosystemAuth, async (req, res) => {
    try {
      const apiKey = req.headers["x-ecosystem-key"] as string;
      const [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.apiKey, apiKey));
      if (!platform) {
        return res.status(403).json({ error: "Invalid ecosystem key" });
      }

      const allPlatforms = await db.select().from(ecosystemPlatforms);
      const sanitizedPlatforms = allPlatforms.map(({ apiKey: _k, ...rest }) => rest);

      res.json({
        title: "Collaborative Advocate Ecosystem Integration Document",
        version: "2.0",
        lastUpdated: new Date().toISOString(),
        requestingPlatform: platform.id,
        corePremise: "Veteran suicide is not a single-point problem. It's a continuum — from the moment someone separates from service, through life transitions, into crisis, through stabilization, and into long-term recovery. No single app, hotline, or VA program covers the full spectrum. This ecosystem does. Sixteen platforms. One mission. Each serves a distinct role. Together, they ensure that no matter where a veteran, youth, or community member is — geographically, emotionally, or in their journey — there is always a next step. Never a dead end.",
        author: "Dr. Terry Flood, DMSc — U.S. Army (20 years), Former Veterans Crisis Line Responder",
        entities: {
          nonprofit: "ThriveUp Academy 501(c)(3) — Central orchestrator and facilitator",
          vosb: "The Collaborative Advocate (VOSB) — Veteran-owned service delivery",
          saas: "Minority Center of Excellence (MCE) — Minority business SaaS",
        },
        grantLenses: {
          "ssg-fox": { name: "SSG Fox VA Suicide Prevention", amount: "Up to $750K", deadline: "June 12-18, 2026", platforms: ["whole-person-health", "m2c", "lifebridge", "sankofa", "safecognicare", "pillscheduler", "betterscience"] },
          "wioa": { name: "WIOA Title I Youth", amount: "$200K-$500K", deadline: "Rolling", platforms: ["isss", "wholemind", "m2c", "mce", "whole-person-health"] },
          "foundation": { name: "Foundation Grant", amount: "$100K-$500K", deadline: "Rolling LOI", platforms: ["isss", "wholemind"] },
          "st-davids": { name: "St. David's Foundation", amount: "Up to $1M", deadline: "Opens March 30, 2026", platforms: ["whole-person-health", "sankofa", "perfectly-different", "safecognicare", "lifebridge"] },
        },
        crisisContinuum: {
          phase1_prevention: { name: "Prevention & Preparedness", platforms: ["m2c", "whole-person-health", "wholemind", "isss", "betterscience"], description: "Purpose, skills, pathways for youth; pre-separation planning; preparedness plans; evidence base for prevention strategies" },
          phase2_earlyWarning: { name: "Early Warning", platforms: ["whole-person-health", "lifebridge", "sankofa", "perfectly-different", "safecognicare"], description: "C-SSRS, PHQ-9, GAD-7, PCL-5 screenings; life event self-assessment; MAP-GAP 7-domain assessment; cognitive and neurodevelopmental monitoring" },
          phase3_crisisSupport: { name: "Crisis Support", platforms: ["whole-person-health", "lifebridge", "safereport"], description: "988 Veterans Crisis Line; Crisis Text Line; Reach a Vet peer support; Safety Plan Builder; Quick Exit; 24/7 resource navigation; mandatory reporting" },
          phase4_stabilization: { name: "Stabilization", platforms: ["whole-person-health", "lifebridge", "pillscheduler", "sankofa"], description: "Care Summary Generator; Find Help (20,670+ resources); Refer-a-Patient; medication management; VA facility connections" },
          phase5_recovery: { name: "Recovery & Growth", platforms: ["whole-person-health", "lifebridge", "m2c", "mce", "betterscience"], description: "Community groups (2,091+); peer stories; condition guides; ongoing life navigation; career pathways; business formation; outcome measurement" },
        },
        sharedDesignPrinciples: [
          "No Dead Ends — every page has at least one forward path to another ecosystem resource",
          "Always a Safety Net — 988 Veterans Crisis Line accessible from every page of every platform",
          "Privacy First — screening results and safety plans stay on user's device, no accounts required for crisis tools",
          "Free for Individuals — no individual user ever pays for anything on any platform",
          "Offline-Capable — safety-critical features work offline via PWA service worker caching",
          "Veteran-Informed Design — built by a veteran (20yr Army, VCL responder), direct language, no clinical jargon",
          "Quick Exit — every platform includes Quick Exit button redirecting to weather.com and replacing browser history",
        ],
        platforms: sanitizedPlatforms,
        yourPlatformRole: {
          id: platform.id,
          name: platform.name,
          role: platform.role,
          description: platform.description,
          dataYouSend: (platform.dataFlowConfig as any)?.sends || [],
          dataYouReceive: (platform.dataFlowConfig as any)?.receives || [],
          grantsYouSupport: (platform.grantAlignment as string[]) || [],
        },
      });
    } catch (error) {
      console.error("Failed to serve integration doc:", error);
      res.status(500).json({ error: "Failed to serve integration document" });
    }
  });

  app.get("/api/ecosystem/public/status", requireAdminAuth, async (_req, res) => {
    try {
      const platforms = await db.select().from(ecosystemPlatforms).orderBy(ecosystemPlatforms.name);
      const sanitized = platforms.map(({ apiKey, ...rest }) => ({
        id: rest.id,
        name: rest.name,
        url: rest.url,
        role: rest.role,
        domain: rest.domain,
        description: rest.description,
        status: rest.status,
        healthStatus: rest.healthStatus,
        lastHeartbeat: rest.lastHeartbeat,
        grantAlignment: rest.grantAlignment,
      }));

      const directives = await db.select().from(ecosystemDirectives)
        .where(eq(ecosystemDirectives.status, "active"))
        .orderBy(desc(ecosystemDirectives.createdAt));

      const directiveSummaries = await Promise.all(directives.map(async (d) => {
        const acks = await db.select().from(ecosystemDirectiveAcks).where(eq(ecosystemDirectiveAcks.directiveId, d.id));
        return {
          id: d.id,
          title: d.title,
          directiveType: d.directiveType,
          grantId: d.grantId,
          status: d.status,
          createdAt: d.createdAt,
          expiresAt: d.expiresAt,
          targetPlatformCount: (d.targetPlatformIds as string[] || []).length,
          stats: {
            total: acks.length,
            pending: acks.filter((a) => a.status === "pending").length,
            delivered: acks.filter((a) => a.status === "delivered").length,
            acknowledged: acks.filter((a) => a.status === "acknowledged").length,
          },
        };
      }));

      const online = sanitized.filter(p => p.healthStatus === "online").length;
      const degraded = sanitized.filter(p => p.healthStatus === "degraded").length;
      const offline = sanitized.filter(p => p.healthStatus === "offline").length;

      res.json({
        ecosystem: {
          name: "ThriveUp Academy Ecosystem",
          totalPlatforms: sanitized.length,
          health: { online, degraded, offline, unknown: sanitized.length - online - degraded - offline },
        },
        platforms: sanitized,
        directives: directiveSummaries,
      });
    } catch (error) {
      console.error("Failed to fetch public ecosystem status:", error);
      res.status(500).json({ error: "Failed to fetch ecosystem status" });
    }
  });

  app.get("/api/ecosystem/platform-directives/:platformId", requireEcosystemAuth, async (req, res) => {
    try {
      const { platformId } = req.params;
      const [platform] = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.id, platformId));
      if (!platform) {
        return res.status(404).json({ error: "Platform not found" });
      }

      const acks = await db.select().from(ecosystemDirectiveAcks)
        .where(eq(ecosystemDirectiveAcks.platformId, platformId));

      const directiveDetails = await Promise.all(acks.map(async (a) => {
        const [d] = await db.select().from(ecosystemDirectives).where(eq(ecosystemDirectives.id, a.directiveId));
        if (!d) return null;
        const roles = (d.platformRoles as Record<string, string>) || {};
        return {
          directiveId: d.id,
          title: d.title,
          type: d.directiveType,
          content: d.content,
          grantId: d.grantId,
          yourRole: roles[platformId] || null,
          trackingRequirements: d.trackingRequirements,
          deliveryStatus: a.status,
          issuedAt: d.createdAt,
          acknowledgedAt: a.status === "acknowledged" ? a.acknowledgedAt : null,
        };
      }));

      const filtered = directiveDetails.filter(Boolean);
      const dataFlows = platform.dataFlowConfig as { sends?: string[]; receives?: string[] } | null;

      res.json({
        platform: {
          id: platform.id,
          name: platform.name,
          url: platform.url,
          role: platform.role,
          domain: platform.domain,
          description: platform.description,
          healthStatus: platform.healthStatus,
          lastHeartbeat: platform.lastHeartbeat,
          grantAlignment: platform.grantAlignment,
          sends: dataFlows?.sends || [],
          receives: dataFlows?.receives || [],
        },
        totalDirectives: filtered.length,
        pending: filtered.filter((d: any) => d.deliveryStatus === "pending").length,
        delivered: filtered.filter((d: any) => d.deliveryStatus === "delivered").length,
        acknowledged: filtered.filter((d: any) => d.deliveryStatus === "acknowledged").length,
        directives: filtered,
      });
    } catch (error) {
      console.error("Failed to fetch platform directives:", error);
      res.status(500).json({ error: "Failed to fetch platform directives" });
    }
  });

  // ===================================================================
  // INTELLIGENCE ENGINE — Work Chaining, Verification, Grant Readiness
  // Turns heartbeat data into actionable intelligence
  // ===================================================================

  const WORK_CHAINS: Record<string, { nextPlatform: string; eventType: string; description: string }[]> = {
    "video_script_ready": [{ nextPlatform: "video-creator-ai", eventType: "produce_video", description: "Video script submitted — produce video" }],
    "security_audit_complete": ECOSYSTEM_PLATFORMS.filter(p => p.id !== "shield-atlas").map(p => ({ nextPlatform: p.id, eventType: "security_findings", description: "Security audit results for your platform" })),
    "grant_narrative_ready": [{ nextPlatform: "betterscience", eventType: "review_narrative", description: "Grant narrative ready for RPLICE quality review" }],
    "voices_story_submitted": [
      { nextPlatform: "lifebridge", eventType: "voices_housing_referral", description: "Community story with housing needs" },
      { nextPlatform: "whole-person-health", eventType: "voices_health_referral", description: "Community story with health needs" },
    ],
    "research_update": ECOSYSTEM_PLATFORMS.map(p => ({ nextPlatform: p.id, eventType: "research_findings", description: "New research findings from RPLICE" })),
    "crisis_alert": [
      { nextPlatform: "whole-person-health", eventType: "crisis_escalation", description: "Crisis alert escalation" },
      { nextPlatform: "lifebridge", eventType: "crisis_resource_needed", description: "Crisis — resource navigation needed" },
    ],
    "warm_handoff_ready": [
      { nextPlatform: "betterscience", eventType: "verify_warm_handoff", description: "Warm handoff endpoint built — RPLICE verify quality" },
      ...ECOSYSTEM_PLATFORMS.filter(p => !["betterscience"].includes(p.id)).map(p => ({ nextPlatform: p.id, eventType: "warm_handoff_available", description: "New warm handoff endpoint available for cross-platform referrals" })),
    ],
    "work_completed": [
      { nextPlatform: "betterscience", eventType: "quality_review_needed", description: "Work completed — RPLICE quality gate review" },
    ],
    "screening_built": [
      { nextPlatform: "whole-person-health", eventType: "register_screening", description: "New screening tool available — register in health ecosystem" },
      { nextPlatform: "betterscience", eventType: "validate_screening", description: "New screening tool — validate evidence base" },
    ],
    "intake_endpoint_built": [
      { nextPlatform: "betterscience", eventType: "verify_intake", description: "Intake endpoint built — verify and register" },
      ...ECOSYSTEM_PLATFORMS.filter(p => !["betterscience"].includes(p.id)).map(p => ({ nextPlatform: p.id, eventType: "intake_available", description: "New intake endpoint available for referrals" })),
    ],
    "housing_resource_added": [
      { nextPlatform: "lifebridge", eventType: "housing_resource_update", description: "New housing resource — add to LifeBridge directory" },
      { nextPlatform: "whole-person-health", eventType: "resource_update", description: "New housing resource for Whole-Person Health directory" },
    ],
    "workforce_pathway_created": [
      { nextPlatform: "m2c", eventType: "workforce_pathway_available", description: "New workforce pathway — M2C Transition integration" },
      { nextPlatform: "m2c", eventType: "career_pathway_update", description: "New workforce pathway for veteran career translation" },
      { nextPlatform: "isss", eventType: "youth_pathway_available", description: "New workforce pathway — ISSS youth pipeline" },
    ],
    "youth_referral": [
      { nextPlatform: "isss", eventType: "youth_intake", description: "Youth referral — ISSS intake and wraparound" },
      { nextPlatform: "wholemind", eventType: "youth_learning_referral", description: "Youth referral — WholeMind learning assessment" },
    ],
    "veteran_referral": [
      { nextPlatform: "m2c", eventType: "veteran_intake", description: "Veteran referral — Mission Transition onboarding" },
      { nextPlatform: "whole-person-health", eventType: "veteran_health_intake", description: "Veteran referral — health screening" },
    ],
    "maternal_health_referral": [
      { nextPlatform: "sankofa-maternal-health", eventType: "maternal_intake", description: "Maternal health referral — BirthRight intake" },
      { nextPlatform: "sankofa", eventType: "health_network_referral", description: "Maternal health referral — Sankofa network" },
    ],
    "content_ready_for_distribution": [
      { nextPlatform: "video-creator-ai", eventType: "create_content_video", description: "Content ready — create video for distribution" },
      { nextPlatform: "ad-targeting", eventType: "content_for_targeting", description: "Content ready — build targeted ad campaign" },
      ...ECOSYSTEM_PLATFORMS.map(p => ({ nextPlatform: p.id, eventType: "content_available", description: "New ecosystem content available for your platform" })),
    ],
    "video_rendered": [
      { nextPlatform: "ad-targeting", eventType: "video_for_ad_campaign", description: "Video rendered — create targeted ad campaign" },
      ...ECOSYSTEM_PLATFORMS.map(p => ({ nextPlatform: p.id, eventType: "video_available", description: "New video rendered — available for your platform" })),
    ],
    "video_produced": [
      { nextPlatform: "ad-targeting", eventType: "video_for_ad_campaign", description: "Video produced — create targeted ad campaign" },
    ],
    "video_distributed": [
      { nextPlatform: "betterscience", eventType: "quality_review_needed", description: "Video distributed — RPLICE quality review of distributed content" },
      { nextPlatform: "ad-targeting", eventType: "video_distribution_analytics", description: "Video distributed — track distribution analytics and audience engagement" },
    ],
    "product_launched": [
      { nextPlatform: "betterscience", eventType: "evaluate_product", description: "New product launched — RPLICE evaluate with RE-AIM" },
      { nextPlatform: "shield-atlas", eventType: "security_scan_needed", description: "New product launched — Shield Atlas security scan" },
      { nextPlatform: "video-creator-ai", eventType: "product_demo_video", description: "New product launched — create demo video" },
    ],
    "map_gap_finding": [
      { nextPlatform: "betterscience", eventType: "gap_analysis_received", description: "MAP-GAP finding — RPLICE analyze and recommend" },
    ],
    "platform_needs_help": [
      { nextPlatform: "betterscience", eventType: "collaboration_request", description: "Platform requesting collaboration support" },
    ],
  };

  async function processWorkChains(sourcePlatformId: string, eventType: string, eventData: Record<string, unknown>) {
    const chains = WORK_CHAINS[eventType];
    if (!chains) return [];
    const routed: { target: string; eventType: string; description: string }[] = [];
    for (const chain of chains) {
      if (chain.nextPlatform === sourcePlatformId) continue;
      await db.insert(ecosystemEvents).values({
        sourcePlatformId,
        targetPlatformId: chain.nextPlatform,
        eventType: chain.eventType,
        eventData: { ...eventData, chainedFrom: eventType, chainDescription: chain.description },
        status: "pending",
      });
      routed.push({ target: chain.nextPlatform, eventType: chain.eventType, description: chain.description });
    }
    return routed;
  }

  function isSafeUrl(urlStr: string): boolean {
    try {
      const parsed = new URL(urlStr);
      if (!["http:", "https:"].includes(parsed.protocol)) return false;
      const host = parsed.hostname.toLowerCase();
      const blocked = [
        "localhost", "127.0.0.1", "0.0.0.0", "[::1]", "[::0]",
        "metadata.google.internal", "metadata", "169.254.169.254",
      ];
      if (blocked.includes(host)) return false;
      if (host.startsWith("10.") || host.startsWith("192.168.") || host.startsWith("172.16.") || host.startsWith("172.17.") || host.startsWith("172.18.") || host.startsWith("172.19.") || host.startsWith("172.2") || host.startsWith("172.30.") || host.startsWith("172.31.")) return false;
      if (host.startsWith("169.254.")) return false;
      if (host.startsWith("100.64.") || host.startsWith("100.65.") || host.startsWith("100.66.") || host.startsWith("100.127.")) return false;
      if (host.endsWith(".internal") || host.endsWith(".local") || host.endsWith(".localhost")) return false;
      if (host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) return false;
      if (host.includes("[") && (host.includes("::1") || host.includes("fe80") || host.includes("fc") || host.includes("fd"))) return false;
      return true;
    } catch { return false; }
  }

  async function verifyDeliverable(url: string): Promise<{ verified: boolean; statusCode: number; responseMs: number; error?: string }> {
    const start = Date.now();
    if (!isSafeUrl(url)) {
      return { verified: false, statusCode: 0, responseMs: 0, error: "URL blocked: private/internal address" };
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const headResponse = await fetch(url, { method: "HEAD", signal: controller.signal, redirect: "follow" });
      clearTimeout(timeout);
      if (headResponse.ok) {
        return { verified: true, statusCode: headResponse.status, responseMs: Date.now() - start };
      }
      if ([405, 403, 501].includes(headResponse.status)) {
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 8000);
        const getResponse = await fetch(url, { method: "GET", signal: controller2.signal, redirect: "follow", headers: { "Range": "bytes=0-1024" } });
        clearTimeout(timeout2);
        return { verified: getResponse.ok, statusCode: getResponse.status, responseMs: Date.now() - start };
      }
      return { verified: false, statusCode: headResponse.status, responseMs: Date.now() - start };
    } catch (err: any) {
      return { verified: false, statusCode: 0, responseMs: Date.now() - start, error: err.message };
    }
  }

  async function runDeliverableVerification() {
    const acks = await db.select().from(ecosystemDirectiveAcks)
      .where(eq(ecosystemDirectiveAcks.status, "acknowledged"));
    const results: { platformId: string; directiveId: string; evidenceUrl: string; verified: boolean; statusCode: number; error?: string }[] = [];

    for (const ack of acks) {
      const responseData = ack.responseData as Record<string, unknown> | null;
      const evidenceUrl = responseData?.evidenceUrl as string;
      if (!evidenceUrl || !evidenceUrl.startsWith("http")) continue;
      if ((responseData as any)?._lastVerified) {
        const lastCheck = new Date((responseData as any)._lastVerified).getTime();
        if (Date.now() - lastCheck < 60 * 60 * 1000) continue;
      }
      const result = await verifyDeliverable(evidenceUrl);
      results.push({ platformId: ack.platformId, directiveId: ack.directiveId, evidenceUrl, verified: result.verified, statusCode: result.statusCode, error: result.error });
      await db.update(ecosystemDirectiveAcks)
        .set({
          responseData: {
            ...(responseData || {}),
            _verificationStatus: result.verified ? "LIVE" : "FAILED",
            _lastVerified: new Date().toISOString(),
            _verificationCode: result.statusCode,
          },
        })
        .where(eq(ecosystemDirectiveAcks.id, ack.id));
    }
    return results;
  }

  const VERIFICATION_PARTNERS: Record<string, { name: string; role: string; verifyDomains: string[]; platformAssignments: string[] }> = {
    "collaborative-advocate": {
      name: "The Collaborative Advocate",
      role: "Primary Verification Partner — VOSB service delivery arm",
      verifyDomains: ["veteran-services", "workforce", "business-consulting", "social-services"],
      platformAssignments: ["m2c", "lifebridge", "mce", "pinnacle-business-conglomerate", "shield-atlas", "ad-targeting"],
    },
    "ecosystem-nexus": {
      name: "Ecosystem Nexus",
      role: "Technical Verification Partner — cross-platform coordination hub",
      verifyDomains: ["technology", "platform-infrastructure", "content-production"],
      platformAssignments: ["video-creator-ai", "safereport", "betterscience", "speech-bridge", "wholemind"],
    },
    "whole-person-health": {
      name: "Whole-Person Health Ecosystem",
      role: "Health Verification Partner — health platform quality assurance",
      verifyDomains: ["health", "mental-health", "maternal-health", "chronic-disease"],
      platformAssignments: ["sankofa", "sankofa-feminine-health", "sankofa-maternal-health", "sankofa-mens-health", "autoimmune-thrive", "safecognicare", "pillscheduler"],
    },
    "isss": {
      name: "ISSS — Integrated Supports for Thriving Youth",
      role: "Education Verification Partner — youth and education quality assurance",
      verifyDomains: ["education", "youth-development", "neurodiversity"],
      platformAssignments: ["perfectly-different", "collaborative-advocate"],
    },
  };

  app.get("/api/ecosystem/verification-assignments", requireEcosystemAuth, async (req, res) => {
    try {
      const authKey = req.headers["x-ecosystem-key"] as string;
      if (!authKey) return res.status(401).json({ error: "Missing x-ecosystem-key header" });

      const allPlatforms = await db.select().from(ecosystemPlatforms);
      const requestingPlatform = allPlatforms.find(p => p.apiKey === authKey);
      if (!requestingPlatform) return res.status(403).json({ error: "Invalid API key" });

      const partnerConfig = VERIFICATION_PARTNERS[requestingPlatform.id];
      if (!partnerConfig) {
        return res.json({
          isVerificationPartner: false,
          message: `${requestingPlatform.name} is not a designated verification partner. Verification partners are: ${Object.values(VERIFICATION_PARTNERS).map(p => p.name).join(", ")}. If you believe your platform should verify siblings, contact the hub.`,
          endpoint: "GET /api/ecosystem/platform-profiles — to view platform profiles (read-only)",
        });
      }

      const acks = await db.select().from(ecosystemDirectiveAcks);
      const assignedPlatformAcks = acks.filter(a =>
        partnerConfig.platformAssignments.includes(a.platformId) &&
        a.status === "acknowledged"
      );

      const verificationsNeeded = assignedPlatformAcks
        .filter(a => {
          const rd = a.responseData as Record<string, unknown> | null;
          const evidenceUrl = rd?.evidenceUrl as string;
          if (!evidenceUrl || !evidenceUrl.startsWith("http")) return false;
          const peerVerified = rd?._peerVerifiedBy as string | undefined;
          return !peerVerified;
        })
        .map(a => {
          const rd = a.responseData as Record<string, unknown> | null;
          const platform = allPlatforms.find(p => p.id === a.platformId);
          const epConfig = ECOSYSTEM_PLATFORMS.find(ep => ep.id === a.platformId);
          return {
            ackId: a.id,
            platformId: a.platformId,
            platformName: platform?.name || a.platformId,
            platformDomain: epConfig?.domain || "unknown",
            directiveId: a.directiveId,
            evidenceUrl: rd?.evidenceUrl as string,
            whatWasDone: rd?.whatWasDone as string || "No description provided",
            hubVerificationStatus: rd?._verificationStatus as string || "UNVERIFIED",
            acknowledgedAt: a.acknowledgedAt,
          };
        });

      const alreadyVerified = assignedPlatformAcks
        .filter(a => {
          const rd = a.responseData as Record<string, unknown> | null;
          return rd?._peerVerifiedBy;
        }).length;

      res.json({
        isVerificationPartner: true,
        partnerConfig: {
          role: partnerConfig.role,
          domains: partnerConfig.verifyDomains,
          assignedPlatforms: partnerConfig.platformAssignments,
        },
        message: `${requestingPlatform.name} is a verification partner. You are responsible for verifying deliverables from ${partnerConfig.platformAssignments.length} assigned platforms. This is a NEED-TO-KNOW assignment — you only see deliverables from your assigned siblings, not the entire ecosystem.`,
        protocol: {
          whatToVerify: "Visit each evidence URL. Confirm the feature/page/endpoint described in 'whatWasDone' actually exists and functions correctly. You are not judging quality — you are confirming existence and basic functionality.",
          howToReport: "POST to /api/ecosystem/peer-verify with { ackId, verified: true/false, verificationNotes: 'description of what you found', verifiedFeatures: ['list', 'of', 'features', 'confirmed'] }",
          frequency: "Verify assigned deliverables at least once per heartbeat cycle (every 5-10 minutes if possible, but at minimum daily)",
          needToKnow: "You only receive verification assignments for your designated platforms. You do NOT receive the full directive content — only the evidence URL and description of what was done. This is by design.",
        },
        stats: {
          totalAssigned: assignedPlatformAcks.length,
          needingVerification: verificationsNeeded.length,
          alreadyPeerVerified: alreadyVerified,
        },
        verificationsNeeded,
        reportEndpoint: "POST https://thrivingcommunitiesforall.com/api/ecosystem/peer-verify",
      });
    } catch (error) {
      console.error("Verification assignments error:", error);
      res.status(500).json({ error: "Failed to fetch verification assignments" });
    }
  });

  app.post("/api/ecosystem/peer-verify", requireEcosystemAuth, async (req, res) => {
    try {
      const authKey = req.headers["x-ecosystem-key"] as string;
      if (!authKey) return res.status(401).json({ error: "Missing x-ecosystem-key header" });

      const allPlatforms = await db.select().from(ecosystemPlatforms);
      const verifier = allPlatforms.find(p => p.apiKey === authKey);
      if (!verifier) return res.status(403).json({ error: "Invalid API key" });

      const partnerConfig = VERIFICATION_PARTNERS[verifier.id];
      if (!partnerConfig) return res.status(403).json({ error: `${verifier.name} is not a designated verification partner` });

      const { ackId, verified, verificationNotes, verifiedFeatures } = req.body;
      if (!ackId || verified === undefined) {
        return res.status(400).json({ error: "ackId and verified (boolean) are required" });
      }
      if (!verificationNotes || verificationNotes.length < 10) {
        return res.status(400).json({ error: "verificationNotes must be at least 10 characters — describe what you actually checked" });
      }

      const [ack] = await db.select().from(ecosystemDirectiveAcks)
        .where(eq(ecosystemDirectiveAcks.id, ackId));
      if (!ack) return res.status(404).json({ error: `Acknowledgment ${ackId} not found` });

      if (!partnerConfig.platformAssignments.includes(ack.platformId)) {
        return res.status(403).json({
          error: `${verifier.name} is not authorized to verify ${ack.platformId}. Your assigned platforms: ${partnerConfig.platformAssignments.join(", ")}`,
        });
      }

      const existingData = ack.responseData as Record<string, unknown> || {};
      const peerVerifications = (existingData._peerVerifications || []) as Array<Record<string, unknown>>;
      peerVerifications.push({
        verifierId: verifier.id,
        verifierName: verifier.name,
        verified,
        verificationNotes,
        verifiedFeatures: verifiedFeatures || [],
        verifiedAt: new Date().toISOString(),
      });

      await db.update(ecosystemDirectiveAcks)
        .set({
          responseData: {
            ...existingData,
            _peerVerifiedBy: verifier.id,
            _peerVerifiedAt: new Date().toISOString(),
            _peerVerificationResult: verified ? "PEER_CONFIRMED" : "PEER_REJECTED",
            _peerVerifications: peerVerifications,
          },
        })
        .where(eq(ecosystemDirectiveAcks.id, ackId));

      console.log(`[PeerVerify] ${verifier.name} ${verified ? "CONFIRMED" : "REJECTED"} deliverable from ${ack.platformId} (ack: ${ackId})`);

      res.json({
        success: true,
        message: `Peer verification recorded: ${verifier.name} ${verified ? "CONFIRMED" : "REJECTED"} deliverable from ${ack.platformId}`,
        ackId,
        platformId: ack.platformId,
        verifiedBy: verifier.id,
        result: verified ? "PEER_CONFIRMED" : "PEER_REJECTED",
        redundancyNote: "This peer verification is stored alongside the hub's automated verification. Both sources contribute to the final verification status. If the hub goes down, peer verifications remain as evidence.",
      });
    } catch (error) {
      console.error("Peer verify error:", error);
      res.status(500).json({ error: "Peer verification failed" });
    }
  });

  app.get("/api/ecosystem/verification-status", requireAdminAuth, async (_req, res) => {
    try {
      const acks = await db.select().from(ecosystemDirectiveAcks)
        .where(eq(ecosystemDirectiveAcks.status, "acknowledged"));

      let hubVerified = 0;
      let peerVerified = 0;
      let bothVerified = 0;
      let neitherVerified = 0;
      let peerRejected = 0;

      for (const ack of acks) {
        const rd = ack.responseData as Record<string, unknown> | null;
        const hubStatus = rd?._verificationStatus as string;
        const peerStatus = rd?._peerVerificationResult as string;

        const hubOk = hubStatus === "LIVE";
        const peerOk = peerStatus === "PEER_CONFIRMED";
        const peerBad = peerStatus === "PEER_REJECTED";

        if (hubOk && peerOk) bothVerified++;
        else if (hubOk && !peerOk) hubVerified++;
        else if (!hubOk && peerOk) peerVerified++;
        else neitherVerified++;
        if (peerBad) peerRejected++;
      }

      const partnerStatus = Object.entries(VERIFICATION_PARTNERS).map(([id, config]) => {
        const assignedAcks = acks.filter(a => config.platformAssignments.includes(a.platformId));
        const verified = assignedAcks.filter(a => {
          const rd = a.responseData as Record<string, unknown> | null;
          return rd?._peerVerifiedBy === id;
        }).length;
        return {
          partnerId: id,
          partnerName: config.name,
          role: config.role,
          assignedPlatforms: config.platformAssignments.length,
          totalAssignedDeliverables: assignedAcks.length,
          peerVerified: verified,
          completionRate: assignedAcks.length > 0 ? Math.round((verified / assignedAcks.length) * 100) : 0,
        };
      });

      res.json({
        generatedAt: new Date().toISOString(),
        totalAcknowledged: acks.length,
        verificationBreakdown: {
          hubAndPeerVerified: bothVerified,
          hubOnlyVerified: hubVerified,
          peerOnlyVerified: peerVerified,
          neitherVerified: neitherVerified,
          peerRejected: peerRejected,
        },
        redundancyScore: acks.length > 0 ? Math.round(((bothVerified + peerVerified) / acks.length) * 100) : 0,
        message: `${bothVerified} deliverables have DUAL verification (hub + peer). ${peerVerified} have peer-only verification (hub backup). The hub is no longer the single point of failure — ${Object.keys(VERIFICATION_PARTNERS).length} verification partners provide distributed redundancy.`,
        verificationPartners: partnerStatus,
      });
    } catch (error) {
      console.error("Verification status error:", error);
      res.status(500).json({ error: "Failed to fetch verification status" });
    }
  });

  app.get("/api/ecosystem/intelligence-report", requireAdminAuth, async (_req, res) => {
    try {
      const platforms = await db.select().from(ecosystemPlatforms);
      const allDirectives = await db.select().from(ecosystemDirectives).where(eq(ecosystemDirectives.status, "active"));
      const allAcks = await db.select().from(ecosystemDirectiveAcks);
      const recentEvents = await db.select().from(ecosystemEvents)
        .where(gte(ecosystemEvents.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))
        .orderBy(desc(ecosystemEvents.createdAt));

      const REGIONAL_DIRECTIVE_KEYS = ["regional-products-austin-v1", "regional-products-manor-v1", "regional-products-pflugerville-v1"];

      const platformIntel = platforms.map(p => {
        const platformAcks = allAcks.filter(a => a.platformId === p.id);
        const total = platformAcks.length;
        const acknowledged = platformAcks.filter(a => a.status === "acknowledged").length;
        const delivered = platformAcks.filter(a => a.status === "delivered").length;
        const pending = platformAcks.filter(a => a.status === "pending").length;
        const fidelity = total > 0 ? Math.round((acknowledged / total) * 100) : 0;

        const completedWork = platformAcks
          .filter(a => a.status === "acknowledged" && a.responseData)
          .map(a => {
            const rd = a.responseData as Record<string, unknown>;
            const dir = allDirectives.find(d => d.id === a.directiveId);
            return {
              directive: dir?.title || a.directiveId,
              whatWasDone: rd?.whatWasDone || "No description",
              evidenceUrl: rd?.evidenceUrl || null,
              verificationStatus: rd?._verificationStatus || "UNVERIFIED",
              ackQuality: rd?._ackQuality || "LEGACY",
              acknowledgedAt: a.acknowledgedAt,
            };
          });

        const qualityCounts = {
          verified: completedWork.filter(w => w.ackQuality === "VERIFIED").length,
          substantive: completedWork.filter(w => w.ackQuality === "SUBSTANTIVE").length,
          weak: completedWork.filter(w => w.ackQuality === "WEAK").length,
          legacy: completedWork.filter(w => w.ackQuality === "LEGACY").length,
        };

        const regionalProducts = {
          austin: completedWork.find(w => w.directive.toLowerCase().includes("austin regional")),
          manor: completedWork.find(w => w.directive.toLowerCase().includes("manor regional")),
          pflugerville: completedWork.find(w => w.directive.toLowerCase().includes("pflugerville regional")),
        };

        const overdue = platformAcks
          .filter(a => a.status === "delivered")
          .map(a => {
            const dir = allDirectives.find(d => d.id === a.directiveId);
            return { directive: dir?.title || a.directiveId, directiveId: a.directiveId };
          });

        const HEARTBEAT_FRESHNESS_MS = 30 * 60 * 1000;
        const heartbeatAge = p.lastHeartbeat ? Math.round((Date.now() - new Date(p.lastHeartbeat).getTime()) / 60000) : null;
        const isFresh = p.lastHeartbeat !== null && (Date.now() - new Date(p.lastHeartbeat).getTime()) < HEARTBEAT_FRESHNESS_MS;

        return {
          id: p.id,
          name: p.name,
          domain: p.domain,
          status: p.healthStatus || "unknown",
          connected: isFresh,
          lastHeartbeat: p.lastHeartbeat,
          heartbeatAgeMinutes: heartbeatAge,
          fidelity: { score: fidelity, grade: fidelity >= 90 ? "A" : fidelity >= 75 ? "B" : fidelity >= 50 ? "C" : fidelity >= 25 ? "D" : "F", total, acknowledged, delivered, pending },
          ackQuality: qualityCounts,
          regionalProducts,
          completedWork,
          overdue,
          grantAlignment: p.grantAlignment,
        };
      });

      const GRANT_MAP: Record<string, { name: string; amount: string; deadline: string; type?: string }> = {
        "wioa": { name: "WIOA Title I Youth", amount: "$200K-$500K", deadline: "Rolling", type: "active-internal" },
        "foundation": { name: "Foundation Grant", amount: "$100K-$500K", deadline: "Rolling LOI", type: "active-internal" },
        "st-davids": { name: "St. David's Foundation", amount: "Up to $1M", deadline: "March 30, 2026", type: "active-internal" },
        "ssg-fox": { name: "SSG Fox VA Suicide Prevention", amount: "Up to $750K", deadline: "June 12-18, 2026", type: "active-internal" },
      };

      const EXTERNAL_GRANT_CATEGORIES: Record<string, { category: string; description: string; fundingRange: string; sources: string[]; platformCapabilities: string[] }> = {
        "federal-health-disparities": {
          category: "Health Disparities & Equity",
          description: "NIH NIMHD, HRSA, CDC grants targeting health disparities in underserved populations",
          fundingRange: "$100K-$5M",
          sources: ["NIH NIMHD", "HRSA", "CDC Office of Minority Health", "AHRQ"],
          platformCapabilities: ["whole-person-health", "sankofa", "sankofa-maternal-health", "sankofa-feminine-health", "sankofa-mens-health", "autoimmune-thrive", "safecognicare", "speech-bridge"],
        },
        "federal-veteran-services": {
          category: "Veteran Services & Suicide Prevention",
          description: "VA, DOD, SAMHSA grants for veteran transition, mental health, suicide prevention",
          fundingRange: "$250K-$3M",
          sources: ["VA Office of Mental Health", "DOD CDMRP", "SAMHSA", "Bob Woodruff Foundation", "Gary Sinise Foundation"],
          platformCapabilities: ["m2c", "collaborative-advocate", "whole-person-health", "lifebridge", "shield-atlas", "speech-bridge"],
        },
        "federal-workforce-development": {
          category: "Workforce Development & Job Training",
          description: "DOL ETA, WIOA formula and competitive grants, apprenticeship programs",
          fundingRange: "$200K-$10M",
          sources: ["DOL Employment & Training", "WIOA Competitive", "Apprenticeship USA", "State Workforce Boards"],
          platformCapabilities: ["pinnacle-business-conglomerate", "mce", "collaborative-advocate", "m2c", "lifebridge", "isss"],
        },
        "federal-education-youth": {
          category: "Education & Youth Development",
          description: "ED, NSF, 21st Century Community Learning Centers, ESSA Title IV",
          fundingRange: "$100K-$3M",
          sources: ["Dept of Education", "NSF Education", "21st CCLC", "Title IV-A"],
          platformCapabilities: ["isss", "wholemind", "perfectly-different", "betterscience"],
        },
        "federal-accessibility-communication": {
          category: "Accessibility & Communication Technology",
          description: "NSF accessibility research, HHS language access, FCC accessibility, NIDILRR disability tech",
          fundingRange: "$100K-$2M",
          sources: ["NSF CISE", "HHS Office of Civil Rights", "FCC", "NIDILRR"],
          platformCapabilities: ["speech-bridge", "perfectly-different", "safecognicare", "wholemind"],
        },
        "federal-substance-abuse-mental-health": {
          category: "Substance Abuse & Mental Health",
          description: "SAMHSA block grants, CCBHC, mental health awareness programs",
          fundingRange: "$500K-$8M",
          sources: ["SAMHSA", "CCBHC", "State Mental Health Authorities"],
          platformCapabilities: ["whole-person-health", "lifebridge", "sankofa", "safecognicare"],
        },
        "federal-maternal-child-health": {
          category: "Maternal & Child Health",
          description: "HRSA MCH, Healthy Start, Maternal Mortality Review",
          fundingRange: "$250K-$5M",
          sources: ["HRSA Maternal & Child Health Bureau", "Healthy Start", "CDC ERASE MM"],
          platformCapabilities: ["sankofa-maternal-health", "sankofa-feminine-health", "whole-person-health", "speech-bridge"],
        },
        "foundation-community-health": {
          category: "Foundation — Community Health Innovation",
          description: "Robert Wood Johnson, Kresge, BCBS foundations for community health",
          fundingRange: "$50K-$2M",
          sources: ["RWJF", "Kresge Foundation", "BCBS Foundation", "W.K. Kellogg", "CommonWealth Fund"],
          platformCapabilities: ["whole-person-health", "sankofa", "autoimmune-thrive", "pillscheduler", "lifebridge", "speech-bridge"],
        },
        "foundation-racial-equity": {
          category: "Foundation — Racial Equity & Justice",
          description: "Ford Foundation, Kapor Center, Emerson Collective, Surdna Foundation",
          fundingRange: "$50K-$1M",
          sources: ["Ford Foundation", "Kapor Center", "Emerson Collective", "Surdna", "Marguerite Casey Foundation"],
          platformCapabilities: ["sankofa", "sankofa-maternal-health", "sankofa-mens-health", "mce", "collaborative-advocate", "speech-bridge"],
        },
        "foundation-technology-social-good": {
          category: "Foundation — Technology for Social Good",
          description: "Schmidt Futures, MacArthur, Gates Foundation technology for impact",
          fundingRange: "$100K-$5M",
          sources: ["Schmidt Futures", "MacArthur Foundation", "Gates Foundation", "Google.org", "Microsoft Philanthropies"],
          platformCapabilities: ["betterscience", "safereport", "shield-atlas", "ecosystem-nexus", "video-creator-ai", "ad-targeting", "speech-bridge"],
        },
        "federal-small-business-minority": {
          category: "Small Business & Minority Enterprise",
          description: "SBA, MBDA, 8(a) programs, HUBZone, VOSB certification support",
          fundingRange: "$50K-$2M",
          sources: ["SBA", "MBDA", "PTAC", "State MWBE Programs"],
          platformCapabilities: ["mce", "pinnacle-business-conglomerate", "collaborative-advocate"],
        },
        "federal-housing-community-dev": {
          category: "Housing & Community Development",
          description: "HUD CDBG, HOME, supportive housing, homelessness prevention",
          fundingRange: "$200K-$5M",
          sources: ["HUD", "CDBG", "HOME Program", "CoC Program"],
          platformCapabilities: ["lifebridge", "whole-person-health", "shield-atlas", "speech-bridge"],
        },
        "federal-aging-disability": {
          category: "Aging & Disability Services",
          description: "ACL, AoA, NIDILRR grants for aging populations and disability support",
          fundingRange: "$100K-$3M",
          sources: ["Administration for Community Living", "AoA", "NIDILRR", "Alzheimer's Association"],
          platformCapabilities: ["safecognicare", "pillscheduler", "autoimmune-thrive", "speech-bridge", "whole-person-health"],
        },
      };

      const externalGrantIntel = Object.entries(EXTERNAL_GRANT_CATEGORIES).map(([categoryId, cat]) => {
        const capablePlatforms = platformIntel.filter(p => cat.platformCapabilities.includes(p.id));
        const connectedCapable = capablePlatforms.filter(p => p.connected).length;
        return {
          categoryId,
          ...cat,
          ecosystemStrength: {
            totalCapablePlatforms: capablePlatforms.length,
            connectedPlatforms: connectedCapable,
            platformDetails: capablePlatforms.map(p => ({ id: p.id, name: p.name, connected: p.connected, fidelity: p.fidelity.score })),
          },
          interdependenceNote: `Any platform pursuing ${cat.category} funding can demonstrate connection to ${capablePlatforms.length} ecosystem platforms providing coordinated capabilities. This is not siloed — each platform strengthens every other platform's application.`,
        };
      });

      const grantReadiness = Object.entries(GRANT_MAP).map(([grantId, grant]) => {
        const alignedPlatforms = platformIntel.filter(p => ((p.grantAlignment as string[]) || []).includes(grantId));
        const connected = alignedPlatforms.filter(p => p.connected).length;
        const totalWork = alignedPlatforms.reduce((sum, p) => sum + p.completedWork.length, 0);
        const totalOverdue = alignedPlatforms.reduce((sum, p) => sum + p.overdue.length, 0);
        const avgFidelity = alignedPlatforms.length > 0 ? Math.round(alignedPlatforms.reduce((s, p) => s + p.fidelity.score, 0) / alignedPlatforms.length) : 0;
        const verified = alignedPlatforms.reduce((sum, p) => sum + p.completedWork.filter(w => w.verificationStatus === "LIVE").length, 0);

        return {
          grantId,
          ...grant,
          platforms: { total: alignedPlatforms.length, connected, disconnected: alignedPlatforms.length - connected },
          compliance: { avgFidelity, totalWorkCompleted: totalWork, totalOverdue, evidenceVerified: verified },
          readinessScore: alignedPlatforms.length > 0 ? Math.round(((connected / alignedPlatforms.length) * 40) + (avgFidelity * 0.4) + (verified > 0 ? 20 : 0)) : 0,
          platformDetails: alignedPlatforms.map(p => ({ id: p.id, name: p.name, connected: p.connected, fidelity: p.fidelity.score, grade: p.fidelity.grade, workDone: p.completedWork.length, overdue: p.overdue.length })),
        };
      });

      const connectedCount = platformIntel.filter(p => p.connected).length;
      const totalAcked = allAcks.filter(a => a.status === "acknowledged").length;
      const totalDelivered = allAcks.filter(a => a.status === "delivered").length;
      const totalPending = allAcks.filter(a => a.status === "pending").length;
      const ecosystemFidelity = allAcks.length > 0 ? Math.round((totalAcked / allAcks.length) * 100) : 0;

      const complianceEvents = recentEvents.filter(e => e.eventType === "compliance_report");
      const chainedEvents = recentEvents.filter(e => (e.eventData as any)?.chainedFrom);

      const workChainActivity = chainedEvents.slice(0, 20).map(e => {
        const data = e.eventData as Record<string, unknown>;
        const sourcePlatform = platforms.find(p => p.id === e.sourcePlatformId);
        const targetPlatform = platforms.find(p => p.id === e.targetPlatformId);
        return {
          from: sourcePlatform?.name || e.sourcePlatformId,
          to: targetPlatform?.name || e.targetPlatformId,
          eventType: e.eventType,
          chainedFrom: data?.chainedFrom || null,
          description: data?.chainDescription || null,
          timestamp: e.createdAt,
          status: e.status,
        };
      });

      const verificationSummary = {
        lastRun: lastVerificationCycle?.completedAt || null,
        totalWithEvidence: allAcks.filter(a => {
          const rd = a.responseData as Record<string, unknown> | null;
          return rd?.evidenceUrl && (rd.evidenceUrl as string).startsWith("http");
        }).length,
        live: allAcks.filter(a => {
          const rd = a.responseData as Record<string, unknown> | null;
          return rd?._verificationStatus === "LIVE";
        }).length,
        failed: allAcks.filter(a => {
          const rd = a.responseData as Record<string, unknown> | null;
          return rd?._verificationStatus === "FAILED";
        }).length,
        unchecked: allAcks.filter(a => {
          const rd = a.responseData as Record<string, unknown> | null;
          return rd?.evidenceUrl && (rd.evidenceUrl as string).startsWith("http") && !rd?._verificationStatus;
        }).length,
        failedDeliverables: allAcks.filter(a => {
          const rd = a.responseData as Record<string, unknown> | null;
          return rd?._verificationStatus === "FAILED";
        }).map(a => {
          const rd = a.responseData as Record<string, unknown>;
          const dir = allDirectives.find(d => d.id === a.directiveId);
          const plat = platforms.find(p => p.id === a.platformId);
          return { platform: plat?.name || a.platformId, directive: dir?.title || a.directiveId, evidenceUrl: rd?.evidenceUrl, lastChecked: rd?._lastVerified };
        }),
      };

      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const completedThisWeek = allAcks.filter(a => a.status === "acknowledged" && a.acknowledgedAt && new Date(a.acknowledgedAt) > oneWeekAgo).length;
      const newPlatformsThisWeek = platforms.filter(p => p.lastHeartbeat && new Date(p.lastHeartbeat) > oneWeekAgo).length;

      const regionalProductSummary = {
        austin: {
          platformsWithProduct: platformIntel.filter(p => p.regionalProducts.austin).length,
          totalPlatforms: platformIntel.length,
          products: platformIntel.filter(p => p.regionalProducts.austin).map(p => ({
            platform: p.name,
            whatWasDone: p.regionalProducts.austin?.whatWasDone,
            evidenceUrl: p.regionalProducts.austin?.evidenceUrl,
            verified: p.regionalProducts.austin?.verificationStatus === "LIVE",
          })),
        },
        manor: {
          platformsWithProduct: platformIntel.filter(p => p.regionalProducts.manor).length,
          totalPlatforms: platformIntel.length,
          products: platformIntel.filter(p => p.regionalProducts.manor).map(p => ({
            platform: p.name,
            whatWasDone: p.regionalProducts.manor?.whatWasDone,
            evidenceUrl: p.regionalProducts.manor?.evidenceUrl,
            verified: p.regionalProducts.manor?.verificationStatus === "LIVE",
          })),
        },
        pflugerville: {
          platformsWithProduct: platformIntel.filter(p => p.regionalProducts.pflugerville).length,
          totalPlatforms: platformIntel.length,
          products: platformIntel.filter(p => p.regionalProducts.pflugerville).map(p => ({
            platform: p.name,
            whatWasDone: p.regionalProducts.pflugerville?.whatWasDone,
            evidenceUrl: p.regionalProducts.pflugerville?.evidenceUrl,
            verified: p.regionalProducts.pflugerville?.verificationStatus === "LIVE",
          })),
        },
      };

      const ackQualitySummary = {
        verified: platformIntel.reduce((s, p) => s + p.ackQuality.verified, 0),
        substantive: platformIntel.reduce((s, p) => s + p.ackQuality.substantive, 0),
        weak: platformIntel.reduce((s, p) => s + p.ackQuality.weak, 0),
        legacy: platformIntel.reduce((s, p) => s + p.ackQuality.legacy, 0),
      };

      const dueOut = allDirectives
        .filter(d => d.expiresAt && new Date(d.expiresAt) > new Date())
        .map(d => {
          const daysLeft = Math.ceil((new Date(d.expiresAt!).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
          const dAcks = allAcks.filter(a => a.directiveId === d.id);
          const acked = dAcks.filter(a => a.status === "acknowledged").length;
          return { title: d.title, daysLeft, acked, total: dAcks.length, urgent: daysLeft <= 7 };
        })
        .sort((a, b) => a.daysLeft - b.daysLeft);

      const needsAttention = platformIntel
        .filter(p => p.overdue.length > 0 || !p.connected)
        .map(p => ({
          id: p.id,
          name: p.name,
          reason: !p.connected ? "NOT CONNECTED — no heartbeat from production" : `${p.overdue.length} overdue directive(s)`,
          overdue: p.overdue,
          fidelity: p.fidelity.score,
        }));

      res.json({
        generatedAt: new Date().toISOString(),
        period: "Last 7 days",
        ecosystemSummary: {
          totalPlatforms: platforms.length,
          connected: connectedCount,
          disconnected: platforms.length - connectedCount,
          ecosystemFidelity,
          ecosystemGrade: ecosystemFidelity >= 90 ? "A" : ecosystemFidelity >= 75 ? "B" : ecosystemFidelity >= 50 ? "C" : ecosystemFidelity >= 25 ? "D" : "F",
          directives: { total: allDirectives.length, acknowledged: totalAcked, delivered: totalDelivered, pending: totalPending },
          eventsThisWeek: recentEvents.length,
          complianceReportsThisWeek: complianceEvents.length,
          workChainsTriggered: chainedEvents.length,
          ackQuality: ackQualitySummary,
          completedThisWeek,
          newPlatformsThisWeek,
        },
        regionalProducts: regionalProductSummary,
        workChainActivity,
        verificationSummary,
        dueOut,
        needsAttention,
        grantReadiness,
        externalGrantOpportunities: {
          message: "MACRO GRANT INTELLIGENCE — These are external funding categories beyond your 4 active grants. Each platform can independently pursue these opportunities while leveraging the full ecosystem as supporting infrastructure.",
          totalCategories: externalGrantIntel.length,
          totalFundingRange: "$50K-$10M per category",
          categories: externalGrantIntel,
          interdependenceModel: "Every platform operates autonomously in pursuing grants. The ecosystem provides alignment through communication and metrics (MAP-GAP), not restriction. When Speech Bridge pursues an accessibility grant, it brings SafeCogniCare, Perfectly Different, and WholeMind as connected capabilities. When SafeCogniCare pursues an aging grant, it brings PillScheduler, Autoimmune Thrive, and Speech Bridge. The ecosystem makes every individual application stronger.",
        },
        platformIntelligence: platformIntel.sort((a, b) => b.fidelity.score - a.fidelity.score),
      });
    } catch (error) {
      console.error("Intelligence report failed:", error);
      res.status(500).json({ error: "Failed to generate intelligence report" });
    }
  });

  app.get("/api/ecosystem/platform-profiles", requireEcosystemAuth, async (req, res) => {
    try {
      const platforms = await db.select().from(ecosystemPlatforms);
      const allAcks = await db.select().from(ecosystemDirectiveAcks);
      const filterPlatformId = req.query.platformId as string | undefined;

      const profiles = ECOSYSTEM_PLATFORMS.map(ep => {
        const liveData = platforms.find(p => p.id === ep.id);
        const epAcks = allAcks.filter(a => a.platformId === ep.id);
        const epAcked = epAcks.filter(a => a.status === "acknowledged").length;
        const epFidelity = epAcks.length > 0 ? Math.round((epAcked / epAcks.length) * 100) : 0;

        const profile = {
          id: ep.id,
          name: ep.name,
          description: ep.description,
          features: ep.features,
          role: ep.role,
          domain: ep.domain,
          url: ep.url,
          grantAlignment: ep.grantAlignment,
          connected: liveData ? !!(liveData.lastHeartbeat && (Date.now() - new Date(liveData.lastHeartbeat).getTime()) < 30 * 60 * 1000) : false,
          fidelity: epFidelity,
          directivesAcked: epAcked,
          totalDirectives: epAcks.length,
          status: liveData?.status || "unknown",
          lastHeartbeat: liveData?.lastHeartbeat || null,
        };
        return profile;
      });

      if (filterPlatformId) {
        const profile = profiles.find(p => p.id === filterPlatformId);
        if (!profile) return res.status(404).json({ error: `Platform ${filterPlatformId} not found` });
        return res.json({ generatedAt: new Date().toISOString(), platform: profile });
      }

      res.json({
        generatedAt: new Date().toISOString(),
        totalPlatforms: profiles.length,
        message: "Authoritative platform identity profiles for all ACOS ecosystem platforms. Use these for accurate content production, grant writing, and cross-platform coordination. Add ?platformId=collaborative-advocate to get a single platform profile.",
        platforms: profiles,
      });
    } catch (error) {
      console.error("Platform profiles error:", error);
      res.status(500).json({ error: "Failed to fetch platform profiles" });
    }
  });

  app.get("/api/ecosystem/grant-readiness", requireAdminAuth, async (req, res) => {
    try {
      const platforms = await db.select().from(ecosystemPlatforms);
      const allAcks = await db.select().from(ecosystemDirectiveAcks);
      const HEARTBEAT_FRESHNESS_MS = 30 * 60 * 1000;
      const filterPlatformId = req.query.platformId as string | undefined;

      const ACTIVE_GRANTS: Record<string, { name: string; amount: string; deadline: string; type: string }> = {
        "wioa": { name: "WIOA Title I Youth", amount: "$200K-$500K", deadline: "Rolling", type: "active-internal" },
        "foundation": { name: "Foundation Grant", amount: "$100K-$500K", deadline: "Rolling LOI", type: "active-internal" },
        "st-davids": { name: "St. David's Foundation", amount: "Up to $1M", deadline: "March 30, 2026", type: "active-internal" },
        "ssg-fox": { name: "SSG Fox VA Suicide Prevention", amount: "Up to $750K", deadline: "June 12-18, 2026", type: "active-internal" },
      };

      const EXTERNAL_GRANTS: Record<string, { category: string; fundingRange: string; type: string; sources: string[]; platformCapabilities: string[]; soloEligible: string[]; description: string }> = {
        "federal-health-disparities": {
          category: "Health Disparities & Equity", fundingRange: "$100K-$5M", type: "external-federal",
          description: "NIH NIMHD, HRSA, CDC grants targeting health disparities in underserved populations",
          sources: ["NIH NIMHD", "HRSA", "CDC Office of Minority Health", "AHRQ"],
          platformCapabilities: ["whole-person-health", "sankofa", "sankofa-maternal-health", "sankofa-feminine-health", "sankofa-mens-health", "autoimmune-thrive", "safecognicare", "speech-bridge"],
          soloEligible: ["whole-person-health", "sankofa", "autoimmune-thrive", "speech-bridge"],
        },
        "federal-veteran-services": {
          category: "Veteran Services & Suicide Prevention", fundingRange: "$250K-$3M", type: "external-federal",
          description: "VA, DOD, SAMHSA grants for veteran transition, mental health, suicide prevention",
          sources: ["VA Office of Mental Health", "DOD CDMRP", "SAMHSA", "Bob Woodruff Foundation", "Gary Sinise Foundation"],
          platformCapabilities: ["m2c", "collaborative-advocate", "whole-person-health", "lifebridge", "shield-atlas", "speech-bridge"],
          soloEligible: ["m2c", "collaborative-advocate", "lifebridge"],
        },
        "federal-workforce-development": {
          category: "Workforce Development & Job Training", fundingRange: "$200K-$10M", type: "external-federal",
          description: "DOL ETA, WIOA formula and competitive grants, apprenticeship programs",
          sources: ["DOL Employment & Training", "WIOA Competitive", "Apprenticeship USA", "State Workforce Boards"],
          platformCapabilities: ["pinnacle-business-conglomerate", "mce", "collaborative-advocate", "m2c", "lifebridge", "isss"],
          soloEligible: ["pinnacle-business-conglomerate", "mce", "collaborative-advocate", "m2c"],
        },
        "federal-education-youth": {
          category: "Education & Youth Development", fundingRange: "$100K-$3M", type: "external-federal",
          description: "ED, NSF, 21st Century Community Learning Centers, ESSA Title IV",
          sources: ["Dept of Education", "NSF Education", "21st CCLC", "Title IV-A"],
          platformCapabilities: ["isss", "wholemind", "perfectly-different", "betterscience"],
          soloEligible: ["isss", "wholemind", "perfectly-different"],
        },
        "federal-accessibility-communication": {
          category: "Accessibility & Communication Technology", fundingRange: "$100K-$2M", type: "external-federal",
          description: "NSF accessibility research, HHS language access, FCC accessibility, NIDILRR disability tech",
          sources: ["NSF CISE", "HHS Office of Civil Rights", "FCC", "NIDILRR"],
          platformCapabilities: ["speech-bridge", "perfectly-different", "safecognicare", "wholemind"],
          soloEligible: ["speech-bridge", "perfectly-different"],
        },
        "federal-substance-abuse-mental-health": {
          category: "Substance Abuse & Mental Health", fundingRange: "$500K-$8M", type: "external-federal",
          description: "SAMHSA block grants, CCBHC, mental health awareness programs",
          sources: ["SAMHSA", "CCBHC", "State Mental Health Authorities"],
          platformCapabilities: ["whole-person-health", "lifebridge", "sankofa", "safecognicare"],
          soloEligible: ["whole-person-health", "lifebridge"],
        },
        "federal-maternal-child-health": {
          category: "Maternal & Child Health", fundingRange: "$250K-$5M", type: "external-federal",
          description: "HRSA MCH, Healthy Start, Maternal Mortality Review",
          sources: ["HRSA Maternal & Child Health Bureau", "Healthy Start", "CDC ERASE MM"],
          platformCapabilities: ["sankofa-maternal-health", "sankofa-feminine-health", "whole-person-health", "speech-bridge"],
          soloEligible: ["sankofa-maternal-health", "sankofa-feminine-health"],
        },
        "foundation-community-health": {
          category: "Foundation — Community Health Innovation", fundingRange: "$50K-$2M", type: "external-foundation",
          description: "Robert Wood Johnson, Kresge, BCBS foundations for community health",
          sources: ["RWJF", "Kresge Foundation", "BCBS Foundation", "W.K. Kellogg", "CommonWealth Fund"],
          platformCapabilities: ["whole-person-health", "sankofa", "autoimmune-thrive", "pillscheduler", "lifebridge", "speech-bridge"],
          soloEligible: ["whole-person-health", "sankofa", "lifebridge"],
        },
        "foundation-racial-equity": {
          category: "Foundation — Racial Equity & Justice", fundingRange: "$50K-$1M", type: "external-foundation",
          description: "Ford Foundation, Kapor Center, Emerson Collective, Surdna Foundation",
          sources: ["Ford Foundation", "Kapor Center", "Emerson Collective", "Surdna", "Marguerite Casey Foundation"],
          platformCapabilities: ["sankofa", "sankofa-maternal-health", "sankofa-mens-health", "mce", "collaborative-advocate", "speech-bridge"],
          soloEligible: ["sankofa", "mce", "collaborative-advocate"],
        },
        "foundation-technology-social-good": {
          category: "Foundation — Technology for Social Good", fundingRange: "$100K-$5M", type: "external-foundation",
          description: "Schmidt Futures, MacArthur, Gates Foundation technology for impact",
          sources: ["Schmidt Futures", "MacArthur Foundation", "Gates Foundation", "Google.org", "Microsoft Philanthropies"],
          platformCapabilities: ["betterscience", "safereport", "shield-atlas", "ecosystem-nexus", "video-creator-ai", "ad-targeting", "speech-bridge"],
          soloEligible: ["betterscience", "speech-bridge", "ecosystem-nexus"],
        },
        "federal-small-business-minority": {
          category: "Small Business & Minority Enterprise", fundingRange: "$50K-$2M", type: "external-federal",
          description: "SBA, MBDA, 8(a) programs, HUBZone, VOSB certification support",
          sources: ["SBA", "MBDA", "PTAC", "State MWBE Programs"],
          platformCapabilities: ["mce", "pinnacle-business-conglomerate", "collaborative-advocate"],
          soloEligible: ["mce", "pinnacle-business-conglomerate", "collaborative-advocate"],
        },
        "federal-housing-community-dev": {
          category: "Housing & Community Development", fundingRange: "$200K-$5M", type: "external-federal",
          description: "HUD CDBG, HOME, supportive housing, homelessness prevention",
          sources: ["HUD", "CDBG", "HOME Program", "CoC Program"],
          platformCapabilities: ["lifebridge", "whole-person-health", "shield-atlas", "speech-bridge"],
          soloEligible: ["lifebridge"],
        },
        "federal-aging-disability": {
          category: "Aging & Disability Services", fundingRange: "$100K-$3M", type: "external-federal",
          description: "ACL, AoA, NIDILRR grants for aging populations and disability support",
          sources: ["Administration for Community Living", "AoA", "NIDILRR", "Alzheimer's Association"],
          platformCapabilities: ["safecognicare", "pillscheduler", "autoimmune-thrive", "speech-bridge", "whole-person-health"],
          soloEligible: ["safecognicare", "pillscheduler", "autoimmune-thrive"],
        },
      };

      const activeGrantReadiness = Object.entries(ACTIVE_GRANTS).map(([grantId, grant]) => {
        const alignedPlatforms = platforms.filter(p => ((p.grantAlignment as string[]) || []).includes(grantId));
        const connected = alignedPlatforms.filter(p => p.lastHeartbeat && (Date.now() - new Date(p.lastHeartbeat).getTime()) < HEARTBEAT_FRESHNESS_MS).length;
        const pAcks = allAcks.filter(a => alignedPlatforms.some(p => p.id === a.platformId));
        const totalWork = pAcks.filter(a => a.status === "acknowledged").length;
        const totalOverdue = pAcks.filter(a => a.status === "delivered").length;
        const avgFidelity = pAcks.length > 0 ? Math.round((totalWork / pAcks.length) * 100) : 0;
        return { grantId, ...grant, platforms: { total: alignedPlatforms.length, connected, disconnected: alignedPlatforms.length - connected }, compliance: { avgFidelity, totalWorkCompleted: totalWork, totalOverdue, evidenceVerified: 0 }, readinessScore: alignedPlatforms.length > 0 ? Math.round(((connected / alignedPlatforms.length) * 40) + (avgFidelity * 0.4) + 0) : 0 };
      });

      const externalGrantReadiness = Object.entries(EXTERNAL_GRANTS).map(([categoryId, grant]) => {
        const capablePlatforms = platforms.filter(p => grant.platformCapabilities.includes(p.id));
        const connected = capablePlatforms.filter(p => p.lastHeartbeat && (Date.now() - new Date(p.lastHeartbeat).getTime()) < HEARTBEAT_FRESHNESS_MS).length;
        const capAcks = allAcks.filter(a => capablePlatforms.some(p => p.id === a.platformId));
        const acked = capAcks.filter(a => a.status === "acknowledged").length;
        const avgFidelity = capAcks.length > 0 ? Math.round((acked / capAcks.length) * 100) : 0;

        return {
          categoryId,
          category: grant.category,
          type: grant.type,
          fundingRange: grant.fundingRange,
          description: grant.description,
          sources: grant.sources,
          ecosystemStrength: {
            totalCapablePlatforms: capablePlatforms.length,
            connectedPlatforms: connected,
            avgFidelity,
            platformDetails: capablePlatforms.map(p => {
              const pAcks = allAcks.filter(a => a.platformId === p.id);
              const pAcked = pAcks.filter(a => a.status === "acknowledged").length;
              const fidelity = pAcks.length > 0 ? Math.round((pAcked / pAcks.length) * 100) : 0;
              const canSolo = grant.soloEligible.includes(p.id);
              return {
                id: p.id,
                name: p.name,
                connected: !!(p.lastHeartbeat && (Date.now() - new Date(p.lastHeartbeat).getTime()) < HEARTBEAT_FRESHNESS_MS),
                fidelity,
                canPursueSolo: canSolo,
                role: canSolo ? "Lead applicant — can pursue independently" : "Supporting partner — strengthens applications",
              };
            }),
          },
          soloApplicants: grant.soloEligible.map(pid => {
            const p = platforms.find(pl => pl.id === pid);
            return p ? p.name : pid;
          }),
          partnerPlatforms: grant.platformCapabilities.filter(pid => !grant.soloEligible.includes(pid)).map(pid => {
            const p = platforms.find(pl => pl.id === pid);
            return p ? p.name : pid;
          }),
        };
      });

      if (filterPlatformId) {
        const platform = platforms.find(p => p.id === filterPlatformId);
        if (!platform) return res.status(404).json({ error: `Platform ${filterPlatformId} not found` });

        const pAcks = allAcks.filter(a => a.platformId === filterPlatformId);
        const pAcked = pAcks.filter(a => a.status === "acknowledged").length;
        const platformFidelity = pAcks.length > 0 ? Math.round((pAcked / pAcks.length) * 100) : 0;

        const soloGrants = externalGrantReadiness.filter(g => g.soloApplicants.some(name => {
          const p = platforms.find(pl => pl.name === name);
          return p && p.id === filterPlatformId;
        }));

        const partnerGrants = externalGrantReadiness.filter(g => {
          const isCapable = g.ecosystemStrength.platformDetails.some(pd => pd.id === filterPlatformId);
          const isSolo = g.soloApplicants.some(name => {
            const p = platforms.find(pl => pl.name === name);
            return p && p.id === filterPlatformId;
          });
          return isCapable && !isSolo;
        });

        const internalGrants = activeGrantReadiness.filter(g => {
          return ((platform.grantAlignment as string[]) || []).includes(g.grantId);
        });

        return res.json({
          generatedAt: new Date().toISOString(),
          platform: {
            id: platform.id,
            name: platform.name,
            fidelity: platformFidelity,
            directivesAcked: pAcked,
            totalDirectives: pAcks.length,
            connected: !!(platform.lastHeartbeat && (Date.now() - new Date(platform.lastHeartbeat).getTime()) < HEARTBEAT_FRESHNESS_MS),
          },
          grantLandscape: {
            message: `${platform.name} has access to ${internalGrants.length} active internal grants, ${soloGrants.length} external categories where it can lead independently, and ${partnerGrants.length} categories where it strengthens partner applications. Macro to micro: pursue autonomously, leverage ecosystem as evidence.`,
            activeInternalGrants: internalGrants,
            soloExternalOpportunities: soloGrants.map(g => ({
              ...g,
              pursuitStrategy: `${platform.name} can independently apply for ${g.category} funding (${g.fundingRange}). Sources: ${g.sources.join(", ")}. The application is strengthened by demonstrating connection to ${g.ecosystemStrength.totalCapablePlatforms - 1} partner platforms in the ACOS ecosystem.`,
            })),
            partnerOpportunities: partnerGrants.map(g => ({
              ...g,
              partnerStrategy: `${platform.name} provides supporting capability for ${g.category} grants. Lead applicants (${g.soloApplicants.join(", ")}) can include ${platform.name} as ecosystem infrastructure evidence.`,
            })),
            totalFundingAccess: {
              internal: internalGrants.map(g => g.amount).join(", "),
              soloExternal: soloGrants.map(g => g.fundingRange).join(", "),
              partnerExternal: partnerGrants.map(g => g.fundingRange).join(", "),
            },
          },
        });
      }

      res.json({
        generatedAt: new Date().toISOString(),
        message: "Full grant readiness — 4 active internal grants + 13 external macro categories. Add ?platformId=speech-bridge to see a specific platform's full grant landscape (solo + partner opportunities).",
        activeInternalGrants: activeGrantReadiness,
        externalGrantCategories: externalGrantReadiness,
        interdependenceModel: "Every platform operates autonomously in pursuing grants. The ecosystem provides alignment through MAP-GAP communication and metrics, not restriction. Solo-eligible platforms can lead applications independently; partner platforms strengthen every application they're connected to.",
      });
    } catch (error) {
      console.error("Grant readiness error:", error);
      res.status(500).json({ error: "Failed to fetch grant readiness" });
    }
  });

  app.post("/api/ecosystem/verify-deliverables", requireAdminAuth, async (_req, res) => {
    try {
      const results = await runDeliverableVerification();
      res.json({ verifiedAt: new Date().toISOString(), checked: results.length, results });
    } catch (error) {
      res.status(500).json({ error: "Verification failed" });
    }
  });

  app.post("/api/ecosystem/send-report-card", requireAdminAuth, async (req, res) => {
    try {
      const authKey = req.headers["x-ecosystem-key"] as string;
      const session = (req as any).session;
      const userId = session?.passport?.user || (req as any).user?.id;
      if (!userId && !authKey) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!userId && authKey) {
        const validPlatform = await db.select().from(ecosystemPlatforms).where(eq(ecosystemPlatforms.apiKey, authKey));
        if (validPlatform.length === 0) {
          return res.status(401).json({ error: "Invalid ecosystem key" });
        }
      }
      const platforms = await db.select().from(ecosystemPlatforms);
      const allDirectives = await db.select().from(ecosystemDirectives).where(eq(ecosystemDirectives.status, "active"));
      const allAcks = await db.select().from(ecosystemDirectiveAcks);
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

      const platformRows = platforms.map(p => {
        const pAcks = allAcks.filter(a => a.platformId === p.id);
        const total = pAcks.length;
        const acked = pAcks.filter(a => a.status === "acknowledged").length;
        const delivered = pAcks.filter(a => a.status === "delivered").length;
        const pending = pAcks.filter(a => a.status === "pending").length;
        const fidelity = total > 0 ? Math.round((acked / total) * 100) : 0;
        const grade = fidelity >= 90 ? "A" : fidelity >= 75 ? "B" : fidelity >= 50 ? "C" : fidelity >= 25 ? "D" : "F";

        const verifiedCount = pAcks.filter(a => {
          const rd = a.responseData as Record<string, unknown> | null;
          return rd?._ackQuality === "VERIFIED";
        }).length;
        const substantiveCount = pAcks.filter(a => {
          const rd = a.responseData as Record<string, unknown> | null;
          return rd?._ackQuality === "SUBSTANTIVE";
        }).length;

        const heartbeatAge = p.lastHeartbeat ? Math.round((now.getTime() - new Date(p.lastHeartbeat).getTime()) / 60000) : null;
        const connected = heartbeatAge !== null && heartbeatAge < 30;

        return { id: p.id, name: p.name, total, acked, delivered, pending, fidelity, grade, verifiedCount, substantiveCount, connected, heartbeatAge };
      }).sort((a, b) => b.fidelity - a.fidelity || a.name.localeCompare(b.name));

      const totalPlatforms = platforms.length;
      const connectedCount = platformRows.filter(p => p.connected).length;
      const gradeA = platformRows.filter(p => p.grade === "A").length;
      const gradeB = platformRows.filter(p => p.grade === "B").length;
      const gradeC = platformRows.filter(p => p.grade === "C").length;
      const gradeD = platformRows.filter(p => p.grade === "D").length;
      const gradeF = platformRows.filter(p => p.grade === "F").length;
      const ecosystemFidelity = platformRows.length > 0 ? Math.round(platformRows.reduce((sum, p) => sum + p.fidelity, 0) / platformRows.length) : 0;

      const gradeColor = (g: string) => g === "A" ? "#059669" : g === "B" ? "#2563eb" : g === "C" ? "#d97706" : g === "D" ? "#dc2626" : "#991b1b";

      const platformTableRows = platformRows.map(p => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 12px; font-weight: 600;">${p.name}</td>
          <td style="padding: 10px 12px; text-align: center;"><span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${p.connected ? '#059669' : '#dc2626'}; margin-right: 4px;"></span>${p.connected ? 'Active' : 'Inactive'}</td>
          <td style="padding: 10px 12px; text-align: center; font-weight: 700; font-size: 18px; color: ${gradeColor(p.grade)};">${p.grade}</td>
          <td style="padding: 10px 12px; text-align: center;">${p.fidelity}%</td>
          <td style="padding: 10px 12px; text-align: center;">${p.acked}/${p.total}</td>
          <td style="padding: 10px 12px; text-align: center; color: #059669;">${p.verifiedCount}</td>
          <td style="padding: 10px 12px; text-align: center;">${p.delivered}</td>
        </tr>
      `).join("");

      const htmlContent = `
        <div style="max-width: 800px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a2e;">
          <div style="background: linear-gradient(135deg, #4c1d95, #6d28d9); padding: 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">ThriveUp Academy Ecosystem Report Card</h1>
            <p style="color: #c4b5fd; margin: 8px 0 0;">${dateStr}</p>
          </div>

          <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb;">
            <h2 style="margin-top: 0; color: #374151; font-size: 18px;">Ecosystem Summary</h2>
            <div style="display: flex; gap: 16px; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 140px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center;">
                <div style="font-size: 32px; font-weight: 800; color: ${ecosystemFidelity >= 75 ? '#059669' : ecosystemFidelity >= 50 ? '#d97706' : '#dc2626'};">${ecosystemFidelity}%</div>
                <div style="font-size: 12px; color: #6b7280;">Ecosystem Fidelity</div>
              </div>
              <div style="flex: 1; min-width: 140px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center;">
                <div style="font-size: 32px; font-weight: 800; color: #059669;">${connectedCount}</div>
                <div style="font-size: 12px; color: #6b7280;">Connected (of ${totalPlatforms})</div>
              </div>
              <div style="flex: 1; min-width: 140px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center;">
                <div style="font-size: 32px; font-weight: 800; color: #059669;">${gradeA}</div>
                <div style="font-size: 12px; color: #6b7280;">Grade A Platforms</div>
              </div>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;">
              <span style="background: #059669; color: white; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">A: ${gradeA}</span>
              <span style="background: #2563eb; color: white; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">B: ${gradeB}</span>
              <span style="background: #d97706; color: white; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">C: ${gradeC}</span>
              <span style="background: #dc2626; color: white; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">D: ${gradeD}</span>
              <span style="background: #991b1b; color: white; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">F: ${gradeF}</span>
            </div>
          </div>

          <div style="background: white; padding: 0; border: 1px solid #e5e7eb; border-top: none; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Platform</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Status</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Grade</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Fidelity</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Acked</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Verified</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Pending</th>
                </tr>
              </thead>
              <tbody>
                ${platformTableRows}
              </tbody>
            </table>
          </div>

          <div style="background: #fef3c7; padding: 16px; border: 1px solid #fcd34d; border-radius: 0 0 12px 12px;">
            <p style="margin: 0; font-size: 13px; color: #92400e;"><strong>Grading Scale:</strong> A (90-100%) | B (75-89%) | C (50-74%) | D (25-49%) | F (0-24%)</p>
            <p style="margin: 8px 0 0; font-size: 12px; color: #92400e;">Fidelity = acknowledged directives / total directives. Verified = acks with evidence URL and substantive description. Active = heartbeat within 30 minutes.</p>
          </div>

          <div style="padding: 16px; text-align: center; color: #9ca3af; font-size: 11px;">
            <p>ThriveUp Academy | thrivingcommunitiesforall.com | Ecosystem Operations Center</p>
          </div>
        </div>
      `;

      await sendEcosystemUpdate("Weekly Report Card — " + dateStr, htmlContent);
      res.json({ sent: true, to: "mr.terryflood@gmail.com", platforms: platformRows.length, summary: { ecosystemFidelity, gradeA, gradeB, gradeC, gradeD, gradeF, connected: connectedCount } });
    } catch (error: any) {
      console.error("Report card email failed:", error);
      res.status(500).json({ error: "Failed to send report card" });
    }
  });

  setInterval(async () => {
    try {
      console.log("[Verifier] Auto-verification cycle running...");
      const results = await runDeliverableVerification();
      console.log(`[Verifier] Auto-verification complete: ${results.length} deliverables checked.`);
    } catch (err) {
      console.error("[Verifier] Auto-verification cycle failed:", err);
    }
  }, 30 * 60 * 1000);

  app.get("/api/ecosystem/integration-doc-public", requireAdminAuth, async (_req, res) => {
    try {
      const allPlatforms = await db.select().from(ecosystemPlatforms);
      const sanitizedPlatforms = allPlatforms.map(({ apiKey: _k, ...rest }) => rest);

      res.json({
        title: "Collaborative Advocate Ecosystem — Full Integration Map",
        version: "2.0",
        lastUpdated: new Date().toISOString(),
        totalPlatforms: allPlatforms.length,
        grantLenses: {
          "ssg-fox": { name: "SSG Fox VA Suicide Prevention", platformCount: allPlatforms.filter(p => ((p.grantAlignment as string[]) || []).includes("ssg-fox")).length },
          "wioa": { name: "WIOA Title I Youth", platformCount: allPlatforms.filter(p => ((p.grantAlignment as string[]) || []).includes("wioa")).length },
          "foundation": { name: "Foundation Grant", platformCount: allPlatforms.filter(p => ((p.grantAlignment as string[]) || []).includes("foundation")).length },
          "st-davids": { name: "St. David's Foundation", platformCount: allPlatforms.filter(p => ((p.grantAlignment as string[]) || []).includes("st-davids")).length },
        },
        platforms: sanitizedPlatforms,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to serve integration document" });
    }
  });
}
