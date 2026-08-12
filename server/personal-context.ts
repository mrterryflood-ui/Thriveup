/**
 * Personal RAG layer for the Navigator.
 *
 * Writing mode awareness (per Dr. Flood, 2026-06-20):
 *
 * The AI writes differently depending on WHO is asking and WHO it's writing FOR:
 *
 *   tcaf_internal   — Dr. Flood / TCAF staff writing FOR TCAF (grants, proposals,
 *                     strategic docs). Full technical vocabulary, TCAF as protagonist,
 *                     implementation science authority, evidence-forward.
 *
 *   partner_assist  — Dr. Flood / TCAF helping a specific PARTNER org (El Buen,
 *                     United Way, a church, a local nonprofit). Their mission, their
 *                     voice, their community. TCAF is the backbone, not the hero.
 *                     Help THEM tell their story, not TCAF's.
 *
 *   partner_user    — A staff member from a partner org is logged in. Their tools,
 *                     their data, their IGN pathway come first. Never lead with
 *                     TCAF's pipeline or grant goals unless directly asked.
 *
 *   community_member — A resident, family, or individual seeking help. Plain language,
 *                     warm, resource-focused. IGN: meet them where they are.
 *
 *   neutral         — Default. Use personal context only where directly relevant.
 *
 * Design constraints:
 * 1. NOT a sales pitch — context informs the answer, never promotes TCAF.
 * 2. AUDIENCE-AWARE — if the question is about an external org's needs,
 *    focus on THEIR situation, not TCAF's grant pipeline or platform goals.
 * 3. TCAF is never a threat — it is infrastructure that amplifies partner missions.
 */

import { db } from "./storage";
import {
  proposalPipeline,
  communityPartnerOrgs,
  initiatives,
  stakeholderCommitments,
} from "@shared/schema";
import { eq, desc, and, ne } from "drizzle-orm";

// ─── Known external orgs / contacts ──────────────────────────────────────────
const EXTERNAL_ORG_SIGNALS = [
  "el buen", "isaac pozos", "ebs",
  "united way", "uwatx",
  "dr. vann", "vann", "sistahs", "iasis", "pastor william",
  "austin public health", "travis county", "williamson county",
  "wilco", "twc", "wsnt", "workforce commission",
  "austin community college", "acc",
  "children's hospital", "st. david", "seton", "ascension",
  "salvation army", "catholic charities", "caritas", "front steps",
  "foundcare", "planned parenthood", "austin recovery",
  "they need", "their organization", "their program", "their data",
  "help them", "for them", "what should i tell", "how do i pitch",
  "proposal for", "present to", "show them", "send to",
  "our partner", "this partner", "the partner",
];

// ─── TCAF-internal writing signals ───────────────────────────────────────────
const TCAF_INTERNAL_SIGNALS = [
  "my grant", "my proposal", "my pipeline", "my applications",
  "my initiatives", "what do i have", "what have i saved",
  "my active", "my commitments", "tcaf's", "our proposal",
  "am i tracking", "what am i working on",
  "write for tcaf", "write our", "draft our", "tcaf narrative",
  "our capabilities", "our platform", "our ecosystem",
];

// ─── Community member / resident help signals ─────────────────────────────────
const COMMUNITY_MEMBER_SIGNALS = [
  "i need help", "my family", "i qualify", "do i qualify",
  "how do i apply", "i can't afford", "we can't pay",
  "housing help", "food stamps", "snap", "medicaid",
  "i was laid off", "i lost my job", "eviction", "homeless",
  "my kids", "childcare help", "i need to find",
  "what do i do", "where can i go",
];

export type AudienceMode =
  | "tcaf_internal"
  | "partner_assist"
  | "partner_user"
  | "community_member"
  | "neutral";

export interface PersonalContext {
  contextBlock: string;
  audienceMode: AudienceMode;
}

export async function getPersonalContext(
  userId: string | null,
  message: string,
): Promise<PersonalContext> {
  const lower = message.toLowerCase();

  // ─── Detect audience mode ─────────────────────────────────────────────────
  const isExternalOrg    = EXTERNAL_ORG_SIGNALS.some(s => lower.includes(s));
  const isTcafInternal   = TCAF_INTERNAL_SIGNALS.some(s => lower.includes(s));
  const isCommunityMember = COMMUNITY_MEMBER_SIGNALS.some(s => lower.includes(s));

  let audienceMode: AudienceMode;
  if (isExternalOrg && !isTcafInternal) {
    audienceMode = "partner_assist";
  } else if (isTcafInternal) {
    audienceMode = "tcaf_internal";
  } else if (isCommunityMember) {
    audienceMode = "community_member";
  } else {
    audienceMode = "neutral";
  }

  const parts: string[] = [];

  // ── Active proposals ───────────────────────────────────────────────────────
  // Only inject TCAF pipeline for internal or neutral contexts — not when
  // writing for a partner (their story, not ours).
  if (audienceMode === "tcaf_internal" || audienceMode === "neutral") {
    try {
      const proposals = await db
        .select()
        .from(proposalPipeline)
        .orderBy(proposalPipeline.priority)
        .limit(12);

      if (proposals.length > 0) {
        const now = new Date();
        const lines = proposals
          .map(p => {
            const data = p.data as Record<string, any>;
            const title = data.title || data.name || data.grantName || p.id;
            const agency = data.agency || data.entity || "";
            const status = data.status || "active";
            const deadline = p.deadline
              ? `due ${p.deadline.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              : "";
            const overdue = p.deadline && p.deadline < now ? " (OVERDUE)" : "";
            const nextActions = Array.isArray(data.nextActions) && data.nextActions.length
              ? ` | next: ${data.nextActions.slice(0, 2).join("; ")}`
              : "";
            return `  • ${title}${agency ? ` (${agency})` : ""} — ${status}${deadline ? `, ${deadline}` : ""}${overdue}${nextActions}`;
          })
          .join("\n");
        parts.push(`Active grant proposals (${proposals.length}):\n${lines}`);
      }
    } catch {
      // non-fatal
    }
  }

  // ── Partner organizations ──────────────────────────────────────────────────
  try {
    const partners = await db
      .select()
      .from(communityPartnerOrgs)
      .where(ne(communityPartnerOrgs.status, "sunset"))
      .limit(20);

    if (partners.length > 0) {
      let relevantPartners = partners;

      if (audienceMode === "partner_assist") {
        // Surface the specific org being discussed — their data, not ours
        const mentioned = partners.filter(p =>
          EXTERNAL_ORG_SIGNALS.some(s =>
            s.length > 4 && lower.includes(s) && p.name.toLowerCase().includes(s.split(" ")[0])
          ) || lower.includes(p.name.toLowerCase().slice(0, 8))
        );
        relevantPartners = mentioned.length > 0 ? mentioned : partners.slice(0, 5);
      }

      const lines = relevantPartners.map(p => {
        let info = `  • ${p.name}`;
        if (p.primaryContactName) info += ` | contact: ${p.primaryContactName}`;
        if (p.missionSummary) info += ` | ${p.missionSummary.slice(0, 120)}`;
        if (p.notes) info += ` | notes: ${p.notes.slice(0, 120)}`;
        return info;
      }).join("\n");
      parts.push(`Partner organizations:\n${lines}`);
    }
  } catch {
    // non-fatal
  }

  // ── User's saved initiatives ───────────────────────────────────────────────
  if (userId && (audienceMode === "tcaf_internal" || audienceMode === "neutral")) {
    try {
      const userInitiatives = await db
        .select()
        .from(initiatives)
        .where(eq(initiatives.authorId, userId))
        .orderBy(desc(initiatives.createdAt))
        .limit(10);

      if (userInitiatives.length > 0) {
        const lines = userInitiatives.map(i =>
          `  • "${i.title}"${i.summary ? ` — ${i.summary.slice(0, 100)}` : ""}`
        ).join("\n");
        parts.push(`Your saved initiatives (${userInitiatives.length}):\n${lines}`);
      }
    } catch {
      // non-fatal
    }
  }

  // ── Active commitments ─────────────────────────────────────────────────────
  if (audienceMode === "tcaf_internal" || audienceMode === "neutral") {
    try {
      const commitments = await db
        .select()
        .from(stakeholderCommitments)
        .where(ne(stakeholderCommitments.status, "delivered"))
        .limit(10);

      if (commitments.length > 0) {
        const lines = commitments.map(c =>
          `  • ${c.sectorName}: ${c.commitmentType} (${c.status})${c.contactName ? ` — ${c.contactName}` : ""}`
        ).join("\n");
        parts.push(`Active stakeholder commitments:\n${lines}`);
      }
    } catch {
      // non-fatal
    }
  }

  if (parts.length === 0) {
    return { contextBlock: "", audienceMode };
  }

  // ── Audience-mode writing instructions ────────────────────────────────────
  // These tell the AI HOW to write, not just what context it has.
  const audienceInstruction = (() => {
    switch (audienceMode as AudienceMode) {
      case "tcaf_internal":
        return `
[WRITING MODE: TCAF INTERNAL]
The user is writing on behalf of TCAF — for grants, proposals, strategic documents, or internal planning.
Use full technical vocabulary. TCAF is the subject and protagonist. Lead with implementation science authority,
evidence-forward language, and TCAF's verified capabilities (CFIR/RE-AIM, RPLICE, 15 platforms, 651 grants,
IGN framework, two-entity strategy). Do not soften or hedge TCAF's strengths — they are real and documented.
Mirror the RFP or document structure if one is visible. Be authoritative, precise, and funder-ready.`;

      case "partner_assist":
        return `
[WRITING MODE: PARTNER ASSIST]
The user is helping a specific partner organization — writing FOR them or ON THEIR BEHALF.
Center their mission, their voice, their community, and their outcomes. TCAF is the backbone infrastructure
that makes their work stronger — not the hero of this story. Use their terminology. Help them tell their story.
Do not frame TCAF as a competitor or replacement — frame it as the capacity-building infrastructure they rely on.
TCAF is not a threat to nonprofits. TCAF is infrastructure that amplifies what they already do.
If writing a proposal for the partner, write from their perspective with their organizational identity front and center.`;

      case "partner_user":
        return `
[WRITING MODE: PARTNER USER]
A staff member from a partner organization is asking. Their tools, their data, their IGN pathway, and their
community outcomes come first. Never lead with TCAF's grant pipeline or platform goals unless directly asked.
Answer from the perspective of what is most useful for their work and their organization's mission.`;

      case "community_member":
        return `
[WRITING MODE: COMMUNITY MEMBER]
A resident, family member, or individual seeking help is asking. Use plain, warm, direct language.
No jargon. No acronyms without explanation. Meet them where they are — at their level of readiness and comfort.
Lead with empathy before information. Tell them what they can do, not what the system requires of them.
If they are in crisis, surface help resources first (988, 211, local shelter). IGN applies: guide step by step,
check in, redirect gently if needed. Never make them feel judged or like a burden.`;

      default:
        return `
[CONTEXT NOTE: Use the personal context above only where directly relevant. Do not reference it if it doesn't apply to the question.]`;
    }
  })();

  const contextBlock = `\n\n[YOUR PERSONAL CONTEXT — for accuracy and writing calibration, not for promotion]:\n${parts.join("\n\n")}${audienceInstruction}`;

  return { contextBlock, audienceMode };
}
