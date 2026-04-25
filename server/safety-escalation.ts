import { db } from "./storage";
import { safetyEscalations, type InsertSafetyEscalation } from "@shared/schema";
import { sendCrisisEscalation } from "./email-service";

export type CrisisSeverity = "none" | "crisis_si" | "crisis_hi";

export interface CrisisDetection {
  severity: CrisisSeverity;
  matchedPattern: string | null;
  matchedPhrase: string | null;
}

const SI_ENDORSEMENT = [
  /\b(i(?:'m| am)?\s*(?:going to|gonna|about to|planning to)|i\s*(?:want to|wanna|need to|deserve to)|i(?:'ll| will))\s*(?:just\s+)?(?:kill\s+myself|end\s+my\s+life|end\s+it\s+all|take\s+my\s+(?:own\s+)?life|off\s+myself|commit\s+suicide|hang\s+myself|shoot\s+myself|overdose|jump\s+off)/i,
  /\b(?:suicide\s+is\s+(?:the\s+only|my\s+(?:only\s+)?option|the\s+answer))\b/i,
  /\bi\s+(?:deserve|need|have|want)\s+to\s+die\b/i,
  /\bi\s+(?:can'?t|don'?t want to)\s+(?:live|go on|keep going)\s+(?:anymore|like this)\b/i,
  /\bi(?:'m| am)\s+(?:going to|gonna)\s+end\s+(?:it|my\s+life)\b/i,
];

const HI_ENDORSEMENT = [
  /\b(i(?:'m| am)?\s*(?:going to|gonna|about to|planning to)|i\s*(?:want to|wanna|need to))\s*(?:kill|murder|shoot|stab|attack|harm|hurt)\s+(?:him|her|them|you|that\s+\w+|my\s+\w+|those\s+\w+|the\s+\w+|\w+ers?|people)\b/i,
  /\bi(?:'ll| will)\s+(?:kill|murder|shoot|stab)\s+(?:him|her|them|you|that|my|those|the)\b/i,
  /\bi(?:'m| am)\s+(?:going to|gonna)\s+(?:make\s+(?:him|her|them|you)\s+pay|get\s+(?:revenge|even))\s+(?:by|with)\s+(?:killing|shooting|hurting)/i,
];

const FALSE_POSITIVE_GUARDS = [
  /\bkill\s+(?:it|time|the\s+pain|two\s+birds|the\s+vibe|the\s+mood)\b/i,
  /\bi'?d\s+kill\s+(?:for|to\s+have|to\s+get)\b/i,
  /\bdying\s+(?:to|laughing)\b/i,
  /\b(?:my\s+)?(?:friend|cousin|client|patient|brother|sister|parent|child|son|daughter|partner|coworker|neighbor)\s+(?:is|was|said|told|might|may)\b/i,
  /\b(?:research|article|study|news|statistics?|rate|hotline|prevention|awareness)\s+(?:about|on|for)\s+(?:suicide|self.harm|homicide)/i,
  /\bif\s+(?:someone|a\s+person|you|i)\s+(?:were|was|is)\b/i,
];

export function detectCrisisSignal(text: string): CrisisDetection {
  if (!text || typeof text !== "string") {
    return { severity: "none", matchedPattern: null, matchedPhrase: null };
  }

  const lower = text.toLowerCase().trim();
  if (lower.length < 5) return { severity: "none", matchedPattern: null, matchedPhrase: null };

  const guarded = FALSE_POSITIVE_GUARDS.some(rx => rx.test(text));

  for (const rx of SI_ENDORSEMENT) {
    const m = text.match(rx);
    if (m) {
      if (guarded) {
        const guardOnlyContext = FALSE_POSITIVE_GUARDS.some(g => {
          const idx = text.search(g);
          return idx >= 0 && Math.abs(idx - (m.index || 0)) < 80;
        });
        if (guardOnlyContext) continue;
      }
      return { severity: "crisis_si", matchedPattern: rx.source, matchedPhrase: m[0] };
    }
  }

  for (const rx of HI_ENDORSEMENT) {
    const m = text.match(rx);
    if (m) {
      if (guarded) {
        const guardOnlyContext = FALSE_POSITIVE_GUARDS.some(g => {
          const idx = text.search(g);
          return idx >= 0 && Math.abs(idx - (m.index || 0)) < 80;
        });
        if (guardOnlyContext) continue;
      }
      return { severity: "crisis_hi", matchedPattern: rx.source, matchedPhrase: m[0] };
    }
  }

  return { severity: "none", matchedPattern: null, matchedPhrase: null };
}

export function buildDeEscalationResponse(severity: CrisisSeverity, language: "en" | "es" = "en"): string {
  if (severity === "crisis_si") {
    if (language === "es") {
      return [
        "Lo que compartiste es importante, y me importa lo que te pasa. Por favor, no te quedes solo/a con esto ahora mismo.",
        "",
        "Si estas en peligro inmediato, llama al 911.",
        "Para hablar con alguien capacitado para ayudarte ahora mismo: marca o envia un mensaje al 988 (Linea de Vida 988 — Suicidio y Crisis). Es gratis, confidencial, y atiende las 24 horas del dia.",
        "Tambien puedes enviar un mensaje de texto con la palabra HOLA al 741741 (Crisis Text Line en espanol).",
        "",
        "Por tu seguridad, una persona de nuestro equipo de cuidado va a revisar esta conversacion para confirmar que estas bien y conectarte con apoyo local. Esa es la unica situacion en la que rompemos la confidencialidad — porque tu vida importa mas.",
        "",
        "Quiero quedarme aqui contigo. Cuentame que esta pasando ahora mismo, sin prisa.",
      ].join("\n");
    }
    return [
      "What you just shared matters, and you matter. I don't want you to sit with this alone right now.",
      "",
      "If you are in immediate danger, please call 911.",
      "To talk to someone trained to help you right now, call or text 988 (the 988 Suicide & Crisis Lifeline). It's free, confidential, and available 24/7.",
      "You can also text HOME to 741741 (Crisis Text Line).",
      "",
      "For your safety, a member of our care team is being notified so a real person can check on you and help connect you to local support. That is the one situation where we step outside the privacy promise — because your life matters more.",
      "",
      "I want to stay with you. Take your time and tell me what's happening for you right now.",
    ].join("\n");
  }

  if (severity === "crisis_hi") {
    if (language === "es") {
      return [
        "Escucho que estas en mucho dolor o rabia ahora mismo. Eso es real, y quiero ayudarte a salir de este momento sin que nadie — incluido tu — termine herido.",
        "",
        "Si estas a punto de hacerle dano a alguien o a ti mismo/a, por favor llama al 911 ahora.",
        "Para hablar con alguien que pueda ayudarte a calmar esto en este instante: marca o envia un mensaje al 988. Esta entrenado para crisis, no solo para suicidio.",
        "",
        "Por seguridad — la tuya y la de otras personas — un miembro de nuestro equipo va a revisar esta conversacion. Es la unica excepcion a la confidencialidad, y la hacemos porque las vidas importan mas que la privacidad en este momento.",
        "",
        "Mientras tanto: respira despacio. Aleja te de la situacion si puedes. Cuentame que paso, paso a paso. Estoy aqui.",
      ].join("\n");
    }
    return [
      "I hear that you are in a lot of pain or anger right now. That is real, and I want to help you move through this moment without anyone — including you — getting hurt.",
      "",
      "If you are about to harm someone, or yourself, please call 911 now.",
      "To talk to a trained crisis counselor right now, call or text 988. They handle anger and crisis, not just suicide.",
      "",
      "For safety — yours and others' — a member of our care team is being notified to review this conversation. That is the one exception to our confidentiality promise, and we make it because lives matter more than privacy in this moment.",
      "",
      "In the meantime: breathe slowly. Step away from the situation if you can. Tell me what happened, step by step. I'm here.",
    ].join("\n");
  }

  return "";
}

interface EscalationOpts {
  userId: string | null;
  severity: CrisisSeverity;
  matchedPhrase: string | null;
  matchedPattern: string | null;
  triggeringMessage: string;
  conversationHistory: Array<{ role: string; content: string }>;
  surface: string;
  language?: string;
}

export async function escalateCrisis(opts: EscalationOpts): Promise<{ id: string | null; emailSent: boolean }> {
  console.warn(`[SAFETY-ESCALATION] severity=${opts.severity} surface=${opts.surface} user=${opts.userId || "anonymous"} phrase="${opts.matchedPhrase}"`);

  const fullConversation = [
    ...opts.conversationHistory,
    { role: "user", content: opts.triggeringMessage },
  ];

  let recordId: string | null = null;
  try {
    const insertData: InsertSafetyEscalation = {
      userId: opts.userId,
      severity: opts.severity,
      surface: opts.surface,
      matchedPattern: opts.matchedPattern,
      matchedPhrase: opts.matchedPhrase,
      fullConversation: fullConversation as any,
      emailSent: false,
      emailMessageId: null,
    };
    const [rec] = await db.insert(safetyEscalations).values(insertData).returning();
    recordId = rec?.id || null;
  } catch (err: any) {
    console.error("[SAFETY-ESCALATION] DB insert failed:", err?.message || err);
  }

  let emailSent = false;
  let messageId: string | null = null;
  try {
    const result = await sendCrisisEscalation({
      severity: opts.severity,
      userId: opts.userId,
      surface: opts.surface,
      matchedPhrase: opts.matchedPhrase || "",
      triggeringMessage: opts.triggeringMessage,
      conversation: fullConversation,
      escalationRecordId: recordId,
    });
    emailSent = result.ok;
    messageId = result.id || null;
  } catch (err: any) {
    console.error("[SAFETY-ESCALATION] Email send failed:", err?.message || err);
  }

  if (recordId && emailSent) {
    try {
      const { eq } = await import("drizzle-orm");
      await db.update(safetyEscalations)
        .set({ emailSent: true, emailMessageId: messageId })
        .where(eq(safetyEscalations.id, recordId));
    } catch (err: any) {
      console.error("[SAFETY-ESCALATION] DB update failed:", err?.message || err);
    }
  }

  return { id: recordId, emailSent };
}
