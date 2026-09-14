import { z } from "zod";

/**
 * A deliberately geography-agnostic place reference.
 *
 * This is not an address and must not be used to infer a person's identity.
 * Existing domestic ZIP/county markers remain valid in the legacy journey
 * field; this envelope is the extensible context used by new surfaces.
 */
export const communityContextSchema = z.object({
  countryCode: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "countryCode must be an ISO 3166-1 alpha-2 code").optional(),
  administrativeLevel: z.enum(["country", "region", "district", "locality", "community", "service_area"]).default("community"),
  region: z.string().trim().max(160).optional(),
  district: z.string().trim().max(160).optional(),
  localLabel: z.string().trim().max(160).optional(),
  serviceArea: z.string().trim().max(160).optional(),
  usFips: z.string().trim().regex(/^\d{5}$/, "usFips must be an explicit five-digit FIPS code").optional(),
  locale: z.string().trim().max(35).regex(/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/, "locale must be a BCP 47-style language tag").optional(),
  source: z.enum(["self_reported", "partner_reported", "official"]).default("self_reported"),
  confidence: z.enum(["reported", "verified"]).default("reported"),
}).strict().refine(
  (value) => Boolean(
    value.countryCode ||
    value.region ||
    value.district ||
    value.localLabel ||
    value.serviceArea ||
    value.usFips,
  ),
  { message: "At least one broad place field is required", path: ["localLabel"] },
).refine(
  (value) => !value.usFips || value.countryCode === "US",
  { message: "usFips may only be supplied with countryCode US", path: ["usFips"] },
);

export type CommunityContext = z.infer<typeof communityContextSchema>;