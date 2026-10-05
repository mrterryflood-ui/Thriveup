import { z } from "zod";

export const gppLifecycleSchema = z.object({
  contractVersion: z.literal("v1"),
  eventId: z.string().uuid(),
  changes: z.array(z.object({
    grantId: z.string().min(1).max(100),
    status: z.enum(["expired", "cancelled", "reopened"]),
    sourceTimestamp: z.string().datetime({ offset: true }),
    sourceUrl: z.string().url().max(1000).refine(value => value.startsWith("https://"), "HTTPS issuer evidence required"),
    deadline: z.string().datetime({ offset: true }).optional(),
  }).strict()).min(1).max(100).refine(changes => new Set(changes.map(change => change.grantId)).size === changes.length, "Duplicate opportunity identity"),
}).strict();
export type GppLifecycleEvent = z.infer<typeof gppLifecycleSchema>;