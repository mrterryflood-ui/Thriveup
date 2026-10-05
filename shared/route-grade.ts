/**
 * R4 — honest two-grade presentation system.
 *
 * Operate-lane routes are operations utilities, not stakeholder-grade surfaces. The grade is derived
 * from the route registry (outcome + access) so it is declared on the page frame and in the tools
 * directory rather than discovered after the click. Everything outside the operate lane is held to the
 * stakeholder grade (polished at 375 / 1024 / 1440).
 */
import type { Access, Outcome } from "./route-registry.types";

export type RouteGrade = { id: "internal" | "operations"; label: string; title: string };

export function gradeFor(route: { outcome: Outcome; access: Access }): RouteGrade | null {
  if (route.outcome !== "operate") return null;
  if (route.access === "staff" || route.access === "admin") {
    return { id: "internal", label: "Internal tool", title: "Staff utility. Built for operations work, not polished for public presentation." };
  }
  return { id: "operations", label: "Operations tool", title: "Working tool for people running programs. Not polished for public presentation." };
}
