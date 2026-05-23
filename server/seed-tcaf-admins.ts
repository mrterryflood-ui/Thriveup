import { db } from "./storage";
import { users } from "@shared/schema";
import { eq, or, sql } from "drizzle-orm";

const TCAF_ADMIN_EMAILS = [
  "terryflood@thrivingcommunitiesforall.com",
  "msisnett@thrivingcommunitiesforall.com",
  "president@thecollaborativeadvocate.org",
];

export async function seedTcafAdmins(): Promise<void> {
  try {
    const result = await db.update(users)
      .set({ isTcafAdmin: true })
      .where(or(...TCAF_ADMIN_EMAILS.map(e => eq(users.email, e))))
      .returning({ id: users.id, email: users.email });
    if (result.length > 0) {
      console.log(`[Seed] Promoted ${result.length} TCAF admins: ${result.map(u => u.email).join(", ")}`);
    }
  } catch (err) {
    console.error("[Seed] TCAF admin promotion failed (non-fatal):", err);
  }
}
