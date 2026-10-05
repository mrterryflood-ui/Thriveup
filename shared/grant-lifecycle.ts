import { z } from "zod";

// Identity may be the ThriveUp grant id OR a stable external identifier GPP
// carries: an exact issuer/source URL or a SAM.gov notice id. Exact matching
// only — never fuzzy title matching.
export const gppLifecycleSchema = z.object({
  contractVersion: z.literal("v1"),
  eventId: z.string().uuid(),
  changes: z.array(z.object({
    grantId: z.string().min(1).max(100).optional(),
    externalId: z.string().min(1).max(300).optional(),
    status: z.enum(["expired", "cancelled", "reopened"]),
    sourceTimestamp: z.string().datetime({ offset: true }),
    sourceUrl: z.string().url().max(1000).refine(value => value.startsWith("https://"), "HTTPS issuer evidence required"),
    deadline: z.string().datetime({ offset: true }).optional(),
  }).strict().refine(change => change.grantId || change.externalId, "grantId or externalId required"))
    .min(1).max(100)
    .refine(changes => new Set(changes.map(change => change.grantId ?? `ext:${change.externalId}`)).size === changes.length, "Duplicate opportunity identity"),
}).strict();
export type GppLifecycleChange = z.infer<typeof gppLifecycleSchema>["changes"][number];
export type GppLifecycleEvent = z.infer<typeof gppLifecycleSchema>;
