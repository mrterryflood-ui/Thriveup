import { apiRequest } from "@/lib/queryClient";

export type JourneyDomain = "reentry" | "workforce" | "ai_training" | "benefits" | "community" | "geography";

export interface JourneyEventInput {
  participantId?: string;
  eventType: string;
  eventDomain: JourneyDomain;
  eventTitle: string;
  eventPayload?: Record<string, unknown>;
  sourcePage?: string;
}

export async function logJourneyEvent(input: JourneyEventInput): Promise<void> {
  try {
    await apiRequest("POST", "/api/resident/journey/event", {
      participantId: input.participantId || "demo",
      eventType: input.eventType,
      eventDomain: input.eventDomain,
      eventTitle: input.eventTitle,
      eventPayload: input.eventPayload || {},
      sourcePage: input.sourcePage || (typeof window !== "undefined" ? window.location.pathname : ""),
    });
  } catch (err) {
    if (typeof console !== "undefined") console.warn("[journey-log] event failed", err);
  }
}
