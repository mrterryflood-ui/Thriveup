/**
 * Personal RAG layer for the Navigator.
 *
 * Design constraints (user-stated):
 * 1. NOT a sales pitch — context informs the answer, it doesn't promote TCAF.
 * 2. AUDIENCE-AWARE — if the question is about an external org's needs,
 *    focus on THEIR situation, not on TCAF's grant pipeline or platform goals.
 *
 * Returns a formatted context block to inject into the system prompt,
 * plus an audience flag so the system prompt can shift its framing.
 */

import { db } from "./storage";
import {
  proposalPipeline,
  communityPartnerOrgs,
  initiatives,
  stakeholderCommitments,
} from "@shared/schema";
import { eq, desc, and, ne } from "drizzle-orm";

// ─── Known external orgs / contacts (expand as relationships grow) ────────────
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

const INTERNAL_SIGNALS = [
  "my grant", "my proposal", "my pipeline", "my applications",
  "my initiatives", "what do i have", "what have i saved",
  "my active", "my commitments", "tcaf's", "our proposal",
  "am i tracking", "what am i working on",
];

export interface PersonalContext {
  contextBlock: string;      // injected into system prompt as background facts
  audienceMode: "external" | "internal" | "neutral";
}

export async function getPersonalContext(
  userId: string | null,
  message: string,
): Promise<PersonalContext> {
  const lower = message.toLowerCase();

  // Detect audience mode
  const isExternal = EXTERNAL_ORG_SIGNALS.some(s => lower.includes(s));
  const isInternal = INTERNAL_SIGNALS.some(s => lower.includes(s));
  const audienceMode: PersonalContext["audienceMode"] =
    isExternal && !isInternal ? "external"
    : isInternal ? "internal"
    : "neutral";

  const parts: string[] = [];

  // ── Active proposals (always useful for authenticated users) ─────────────────
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

  // ── Partner organizations ─────────────────────────────────────────────────────
  try {
    const partners = await db
      .select()
      .from(communityPartnerOrgs)
      .where(ne(communityPartnerOrgs.status, "sunset"))
      .limit(20);

    if (partners.length > 0) {
      // If external mode: only surface the mentioned org's data
      // If internal/neutral: surface all active partners as a list
      let relevantPartners = partners;
      if (isExternal) {
        // Try to find the specific org being discussed
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

  // ── User's saved initiatives ──────────────────────────────────────────────────
  if (userId) {
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

  // ── Active commitments ────────────────────────────────────────────────────────
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

  if (parts.length === 0) {
    return { contextBlock: "", audienceMode };
  }

  // ── Audience-mode framing ─────────────────────────────────────────────────────
  const audienceInstruction =
    audienceMode === "external"
      ? `\n[AUDIENCE NOTE: The user is working with or on behalf of an external organization. Ground your response in what THEY need and what's useful for THEM. The personal context above is provided for accuracy — do not frame your answer around TCAF's funding goals, platform capabilities, or sales pitch. If the user is helping that org, help THEM help that org.]`
      : audienceMode === "internal"
      ? `\n[CONTEXT NOTE: The user is asking about their own work and pipeline. Use the personal context above to give an accurate, grounded answer about their specific situation.]`
      : `\n[CONTEXT NOTE: Use the personal context above only where directly relevant. Do not reference it if it doesn't apply to the question.]`;

  const contextBlock = `\n\n[YOUR PERSONAL CONTEXT — for accuracy only, not for promotion]:\n${parts.join("\n\n")}${audienceInstruction}`;

  return { contextBlock, audienceMode };
}
