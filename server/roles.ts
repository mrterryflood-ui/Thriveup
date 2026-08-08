// Role authorization helpers.
//
// SECURITY MODEL: avatar `role` feeds authorization (requireAdmin, YHSI staff
// guard, AI adult mode) but the avatar endpoint is client-writable. Privileged
// roles may therefore only enter the avatar table through the admin-gated
// role endpoint (PATCH /api/admin/users/:userId/role) or direct server-side
// seeds — never from a client-supplied avatar payload.

export const PRIVILEGED_ROLES = new Set([
  "admin",
  "teacher",
  "facilitator",
  "case_manager",
  "staff",
  "parent",
  "adult",
]);

/**
 * Sanitize a client-supplied avatar role. Privileged values are demoted to the
 * user's existing role (update) or "student" (create). Non-privileged cosmetic
 * roles pass through.
 */
export function sanitizeAvatarRole(
  requested: string | undefined | null,
  existingRole: string | undefined | null,
): string {
  if (requested && !PRIVILEGED_ROLES.has(requested)) return requested;
  return existingRole ?? "student";
}
