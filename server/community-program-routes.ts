import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./storage";
import {
  communityPartnerOrgs,
  households,
  householdMembers,
  communityPrograms,
  programEnrollments,
  programAttendance,
  householdServicesReceived,
  insertCommunityPartnerOrgSchema,
  insertHouseholdSchema,
  insertHouseholdMemberSchema,
  insertCommunityProgramSchema,
  insertProgramEnrollmentSchema,
  insertProgramAttendanceSchema,
  insertHouseholdServiceReceivedSchema,
  type CommunityPartnerOrg,
  type Household,
  type HouseholdMember,
  type CommunityProgram,
  type ProgramEnrollment,
  type ProgramAttendance,
  type HouseholdServiceReceived,
} from "@shared/schema";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { z } from "zod";

function getUser(req: Request) {
  const u = (req as unknown as Record<string, unknown>).user as
    | { claims?: { sub?: string; email?: string }; id?: string; role?: string }
    | undefined;
  return u;
}
function getUserId(req: Request): string | undefined {
  const u = getUser(req);
  return u?.claims?.sub || u?.id;
}
function isPrivileged(req: Request): boolean {
  const u = getUser(req);
  return !!u && (u.role === "admin" || u.role === "case_manager" || u.role === "teacher");
}
function requirePrivileged(req: Request, res: Response, next: NextFunction) {
  if (!getUser(req)) return res.status(401).json({ error: "Unauthorized" });
  if (!isPrivileged(req)) return res.status(403).json({ error: "Admin or case-manager role required" });
  return next();
}
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!getUser(req)) return res.status(401).json({ error: "Authentication required" });
  return next();
}

const MAX_BULK_ROWS = 2000;
const MAX_CSV_BYTES = 2 * 1024 * 1024;

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQ = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (inQ) {
      if (c === '"' && input[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQ = false; }
      else { field += c; }
    } else {
      if (c === '"') { inQ = true; }
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else { field += c; }
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows.filter(r => r.length && r.some(v => v.trim().length));
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function registerCommunityProgramRoutes(app: Express) {
  // ---------- Orgs ----------
  app.get("/api/community/orgs", requireAuth, async (_req, res) => {
    try {
      const orgs = await db.select().from(communityPartnerOrgs).orderBy(asc(communityPartnerOrgs.name));
      res.json({ orgs });
    } catch (err) {
      console.error("[community] list orgs failed", err);
      res.status(500).json({ error: "Failed to list community orgs" });
    }
  });

  app.get("/api/community/orgs/:orgId", requireAuth, async (req, res) => {
    try {
      const orgId = String(req.params.orgId);
      const [org] = await db.select().from(communityPartnerOrgs).where(eq(communityPartnerOrgs.id, orgId));
      if (!org) return res.status(404).json({ error: "Org not found" });
      res.json({ org });
    } catch (err) {
      console.error("[community] get org failed", err);
      res.status(500).json({ error: "Failed to load org" });
    }
  });

  app.post("/api/community/orgs", requirePrivileged, async (req, res) => {
    try {
      const parsed = insertCommunityPartnerOrgSchema.parse(req.body);
      const [row] = await db.insert(communityPartnerOrgs).values(parsed).returning();
      res.json({ org: row });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", issues: err.issues });
      console.error("[community] create org failed", err);
      res.status(500).json({ error: "Failed to create org" });
    }
  });

  // ---------- Programs ----------
  app.get("/api/community/orgs/:orgId/programs", requireAuth, async (req, res) => {
    try {
      const orgId = String(req.params.orgId);
      const programs = await db.select().from(communityPrograms).where(eq(communityPrograms.orgId, orgId)).orderBy(asc(communityPrograms.name));
      res.json({ programs });
    } catch (err) {
      console.error("[community] list programs failed", err);
      res.status(500).json({ error: "Failed to list programs" });
    }
  });

  app.post("/api/community/orgs/:orgId/programs", requirePrivileged, async (req, res) => {
    try {
      const orgId = String(req.params.orgId);
      const parsed = insertCommunityProgramSchema.parse({ ...req.body, orgId });
      const id = `prog_${randomUUID()}`;
      const [row] = await db.insert(communityPrograms).values({ ...parsed, id }).returning();
      res.json({ program: row });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", issues: err.issues });
      console.error("[community] create program failed", err);
      res.status(500).json({ error: "Failed to create program" });
    }
  });

  // ---------- Households (list w/ aggregates) ----------
  app.get("/api/community/orgs/:orgId/households", requireAuth, async (req, res) => {
    try {
      const orgId = String(req.params.orgId);
      const rows = await db.select().from(households).where(eq(households.orgId, orgId)).orderBy(asc(households.householdName));
      const ids = rows.map(r => r.id);
      let memberCounts: Record<string, number> = {};
      let enrollmentCounts: Record<string, number> = {};
      if (ids.length) {
        const members = await db.select().from(householdMembers).where(inArray(householdMembers.householdId, ids));
        memberCounts = members.reduce((acc, m) => {
          acc[m.householdId] = (acc[m.householdId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const memberIds = members.map(m => m.id);
        if (memberIds.length) {
          const enrolls = await db.select().from(programEnrollments)
            .where(and(inArray(programEnrollments.memberId, memberIds), eq(programEnrollments.status, "active")));
          const memberToHh = new Map(members.map(m => [m.id, m.householdId]));
          enrollmentCounts = enrolls.reduce((acc, e) => {
            const hh = memberToHh.get(e.memberId);
            if (hh) acc[hh] = (acc[hh] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
        }
      }
      res.json({
        households: rows.map(h => ({
          ...h,
          memberCount: memberCounts[h.id] || 0,
          activeEnrollmentCount: enrollmentCounts[h.id] || 0,
        })),
      });
    } catch (err) {
      console.error("[community] list households failed", err);
      res.status(500).json({ error: "Failed to list households" });
    }
  });

  app.post("/api/community/orgs/:orgId/households", requirePrivileged, async (req, res) => {
    try {
      const orgId = String(req.params.orgId);
      const parsed = insertHouseholdSchema.parse({ ...req.body, orgId });
      const id = `hh_${randomUUID()}`;
      const [row] = await db.insert(households).values({ ...parsed, id }).returning();
      res.json({ household: row });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", issues: err.issues });
      console.error("[community] create household failed", err);
      res.status(500).json({ error: "Failed to create household" });
    }
  });

  // ---------- Household detail (members + enrollments + attendance summary + services) ----------
  app.get("/api/community/households/:householdId", requireAuth, async (req, res) => {
    try {
      const householdId = String(req.params.householdId);
      const expectedOrgId = typeof req.query.orgId === "string" ? req.query.orgId : "";
      if (!expectedOrgId) return res.status(400).json({ error: "orgId query parameter required for tenant scoping" });
      const [household] = await db.select().from(households).where(eq(households.id, householdId));
      if (!household) return res.status(404).json({ error: "Household not found" });
      if (household.orgId !== expectedOrgId) return res.status(404).json({ error: "Household not found" });
      const members = await db.select().from(householdMembers).where(eq(householdMembers.householdId, householdId)).orderBy(desc(householdMembers.isPrimaryContact), asc(householdMembers.ageYears));
      const memberIds = members.map(m => m.id);
      let enrollments: ProgramEnrollment[] = [];
      let attendance: ProgramAttendance[] = [];
      if (memberIds.length) {
        enrollments = await db.select().from(programEnrollments).where(inArray(programEnrollments.memberId, memberIds));
        attendance = await db.select().from(programAttendance).where(inArray(programAttendance.memberId, memberIds)).orderBy(desc(programAttendance.sessionDate)).limit(200);
      }
      const services = await db.select().from(householdServicesReceived).where(eq(householdServicesReceived.householdId, householdId)).orderBy(desc(householdServicesReceived.serviceDate)).limit(100);
      res.json({ household, members, enrollments, attendance, services });
    } catch (err) {
      console.error("[community] household detail failed", err);
      res.status(500).json({ error: "Failed to load household" });
    }
  });

  app.post("/api/community/households/:householdId/members", requirePrivileged, async (req, res) => {
    try {
      const householdId = String(req.params.householdId);
      const [household] = await db.select().from(households).where(eq(households.id, householdId));
      if (!household) return res.status(404).json({ error: "Household not found" });
      const parsed = insertHouseholdMemberSchema.parse({ ...req.body, householdId, orgId: household.orgId });
      const id = `m_${randomUUID()}`;
      const [row] = await db.insert(householdMembers).values({ ...parsed, id }).returning();
      res.json({ member: row });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", issues: err.issues });
      console.error("[community] add member failed", err);
      res.status(500).json({ error: "Failed to add member" });
    }
  });

  // ---------- Enrollments ----------
  app.post("/api/community/enrollments", requirePrivileged, async (req, res) => {
    try {
      const parsed = insertProgramEnrollmentSchema.parse(req.body);
      const [mem] = await db.select().from(householdMembers).where(eq(householdMembers.id, parsed.memberId));
      const [prog] = await db.select().from(communityPrograms).where(eq(communityPrograms.id, parsed.programId));
      if (!mem || !prog) return res.status(404).json({ error: "Member or program not found" });
      if (mem.orgId !== prog.orgId || mem.orgId !== parsed.orgId) {
        return res.status(400).json({ error: "Cross-tenant enrollment not allowed" });
      }
      const id = `enr_${randomUUID()}`;
      const [row] = await db.insert(programEnrollments).values({ ...parsed, id }).returning();
      res.json({ enrollment: row });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", issues: err.issues });
      console.error("[community] enroll failed", err);
      res.status(500).json({ error: "Failed to enroll" });
    }
  });

  // ---------- Attendance (single or bulk) ----------
  app.post("/api/community/attendance", requirePrivileged, async (req, res) => {
    try {
      const userId = getUserId(req);
      const items = Array.isArray(req.body?.items) ? req.body.items : [req.body];
      if (items.length > MAX_BULK_ROWS) return res.status(400).json({ error: `Too many rows (max ${MAX_BULK_ROWS})` });
      const inserted: ProgramAttendance[] = [];
      for (const raw of items) {
        const parsed = insertProgramAttendanceSchema.parse({
          ...raw,
          sessionDate: raw.sessionDate ? new Date(raw.sessionDate) : new Date(),
          recordedBy: userId,
        });
        const [mem] = await db.select().from(householdMembers).where(eq(householdMembers.id, parsed.memberId));
        const [prog] = await db.select().from(communityPrograms).where(eq(communityPrograms.id, parsed.programId));
        if (!mem || !prog) return res.status(404).json({ error: "Member or program not found" });
        if (mem.orgId !== prog.orgId || mem.orgId !== parsed.orgId) {
          return res.status(400).json({ error: "Cross-tenant attendance not allowed" });
        }
        if (parsed.enrollmentId) {
          const [enr] = await db.select().from(programEnrollments).where(eq(programEnrollments.id, parsed.enrollmentId));
          if (!enr) return res.status(404).json({ error: "Enrollment not found" });
          if (enr.memberId !== parsed.memberId || enr.programId !== parsed.programId || enr.orgId !== parsed.orgId) {
            return res.status(400).json({ error: "Enrollment does not match member/program/org" });
          }
        }
        const id = `att_${randomUUID()}`;
        const [row] = await db.insert(programAttendance).values({ ...parsed, id }).returning();
        inserted.push(row);
      }
      res.json({ recorded: inserted.length, attendance: inserted });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", issues: err.issues });
      console.error("[community] attendance failed", err);
      res.status(500).json({ error: "Failed to record attendance" });
    }
  });

  // ---------- Services received ----------
  app.post("/api/community/services", requirePrivileged, async (req, res) => {
    try {
      const userId = getUserId(req);
      const parsed = insertHouseholdServiceReceivedSchema.parse({
        ...req.body,
        serviceDate: req.body.serviceDate ? new Date(req.body.serviceDate) : new Date(),
        recordedBy: userId,
      });
      const [hh] = await db.select().from(households).where(eq(households.id, parsed.householdId));
      if (!hh) return res.status(404).json({ error: "Household not found" });
      if (hh.orgId !== parsed.orgId) {
        return res.status(400).json({ error: "Cross-tenant service record not allowed" });
      }
      if (parsed.recipientMemberId) {
        const [recip] = await db.select().from(householdMembers).where(eq(householdMembers.id, parsed.recipientMemberId));
        if (!recip) return res.status(404).json({ error: "Recipient member not found" });
        if (recip.householdId !== parsed.householdId || recip.orgId !== parsed.orgId) {
          return res.status(400).json({ error: "Recipient member does not belong to this household/org" });
        }
      }
      const id = `svc_${randomUUID()}`;
      const [row] = await db.insert(householdServicesReceived).values({ ...parsed, id }).returning();
      res.json({ service: row });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", issues: err.issues });
      console.error("[community] record service failed", err);
      res.status(500).json({ error: "Failed to record service" });
    }
  });

  // ---------- Stats ----------
  app.get("/api/community/orgs/:orgId/stats", requireAuth, async (req, res) => {
    try {
      const orgId = String(req.params.orgId);
      const [{ count: householdCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(households).where(eq(households.orgId, orgId));
      const [{ count: memberCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(householdMembers).where(eq(householdMembers.orgId, orgId));
      const [{ count: programCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(communityPrograms).where(and(eq(communityPrograms.orgId, orgId), eq(communityPrograms.active, true)));
      const [{ count: attendanceCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(programAttendance).where(eq(programAttendance.orgId, orgId));
      const [{ count: presentCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(programAttendance).where(and(eq(programAttendance.orgId, orgId), eq(programAttendance.status, "present")));
      const [{ count: serviceCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(householdServicesReceived).where(eq(householdServicesReceived.orgId, orgId));
      const [{ count: mealCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(programAttendance).where(and(eq(programAttendance.orgId, orgId), eq(programAttendance.receivedMeal, true)));
      const [{ count: transportCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(programAttendance).where(and(eq(programAttendance.orgId, orgId), eq(programAttendance.receivedTransport, true)));

      // Per-program reach: members enrolled per program
      const programs = await db.select().from(communityPrograms).where(eq(communityPrograms.orgId, orgId));
      const programRows: Array<{ programId: string; programName: string; category: string; enrolled: number; present: number }> = [];
      for (const p of programs) {
        const [{ count: enrolledCnt }] = await db.select({ count: sql<number>`count(*)::int` }).from(programEnrollments).where(and(eq(programEnrollments.programId, p.id), eq(programEnrollments.status, "active")));
        const [{ count: presentCnt }] = await db.select({ count: sql<number>`count(*)::int` }).from(programAttendance).where(and(eq(programAttendance.programId, p.id), eq(programAttendance.status, "present")));
        programRows.push({ programId: p.id, programName: p.name, category: p.category, enrolled: Number(enrolledCnt) || 0, present: Number(presentCnt) || 0 });
      }
      const attendanceRate = attendanceCount ? Math.round((Number(presentCount) / Number(attendanceCount)) * 100) : null;
      res.json({
        orgId,
        households: Number(householdCount) || 0,
        members: Number(memberCount) || 0,
        activePrograms: Number(programCount) || 0,
        totalAttendanceEvents: Number(attendanceCount) || 0,
        presentEvents: Number(presentCount) || 0,
        attendanceRate,
        servicesRecorded: Number(serviceCount) || 0,
        mealsServed: Number(mealCount) || 0,
        transportProvided: Number(transportCount) || 0,
        programs: programRows,
      });
    } catch (err) {
      console.error("[community] stats failed", err);
      res.status(500).json({ error: "Failed to compute stats" });
    }
  });

  // ---------- CSV export ----------
  app.get("/api/community/orgs/:orgId/export.csv", requireAuth, async (req, res) => {
    try {
      const orgId = String(req.params.orgId);
      const hh = await db.select().from(households).where(eq(households.orgId, orgId));
      const ms = await db.select().from(householdMembers).where(eq(householdMembers.orgId, orgId));
      const byHh = new Map(hh.map(h => [h.id, h]));
      const lines: string[] = [];
      lines.push(["household_name","member_name","relationship","age","language","city","zip","contact_phone","contact_email"].join(","));
      for (const m of ms) {
        const h = byHh.get(m.householdId);
        lines.push([
          csvEscape(h?.householdName),
          csvEscape(m.displayName),
          csvEscape(m.relationship),
          csvEscape(m.ageYears),
          csvEscape(m.preferredLanguage || h?.primaryLanguage),
          csvEscape(h?.city),
          csvEscape(h?.zipCode),
          csvEscape(m.contactPhone),
          csvEscape(m.contactEmail),
        ].join(","));
      }
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${orgId}-households.csv"`);
      res.send(lines.join("\n"));
    } catch (err) {
      console.error("[community] export csv failed", err);
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });

  // ---------- CSV bulk upload (households + members) ----------
  // Expected columns: household_name, member_name, relationship, age, language, city, zip, contact_phone, contact_email, is_primary_contact
  app.post("/api/community/orgs/:orgId/households/bulk-csv", requirePrivileged, async (req, res) => {
    try {
      const orgId = String(req.params.orgId);
      const userId = getUserId(req);
      const csv = String(req.body?.csv || "");
      if (!csv) return res.status(400).json({ error: "Missing csv string in body" });
      if (csv.length > MAX_CSV_BYTES) return res.status(413).json({ error: "CSV too large" });
      const rows = parseCsv(csv);
      if (rows.length < 2) return res.status(400).json({ error: "CSV must have a header row and at least one data row" });
      const header = rows[0].map(h => h.trim().toLowerCase());
      const idx = (k: string) => header.indexOf(k);
      if (idx("household_name") < 0 || idx("member_name") < 0 || idx("relationship") < 0) {
        return res.status(400).json({ error: "Required columns: household_name, member_name, relationship" });
      }
      const data = rows.slice(1);
      if (data.length > MAX_BULK_ROWS) return res.status(400).json({ error: `Too many rows (max ${MAX_BULK_ROWS})` });

      // group by household_name
      const byHh = new Map<string, { meta: { city?: string; zip?: string; language?: string }; members: Array<Record<string, string>> }>();
      const errors: Array<{ row: number; reason: string }> = [];
      data.forEach((r, i) => {
        const hhName = (r[idx("household_name")] || "").trim();
        const memberName = (r[idx("member_name")] || "").trim();
        const relationship = (r[idx("relationship")] || "").trim();
        if (!hhName || !memberName || !relationship) { errors.push({ row: i + 2, reason: "Missing required field" }); return; }
        if (!byHh.has(hhName)) {
          byHh.set(hhName, {
            meta: {
              city: idx("city") >= 0 ? r[idx("city")] : undefined,
              zip: idx("zip") >= 0 ? r[idx("zip")] : undefined,
              language: idx("language") >= 0 ? r[idx("language")] : undefined,
            },
            members: [],
          });
        }
        byHh.get(hhName)!.members.push({
          name: memberName, relationship,
          age: idx("age") >= 0 ? r[idx("age")] : "",
          language: idx("language") >= 0 ? r[idx("language")] : "",
          phone: idx("contact_phone") >= 0 ? r[idx("contact_phone")] : "",
          email: idx("contact_email") >= 0 ? r[idx("contact_email")] : "",
          primary: idx("is_primary_contact") >= 0 ? r[idx("is_primary_contact")] : "",
        });
      });

      let hhCreated = 0;
      let memberCreated = 0;
      for (const [name, info] of Array.from(byHh.entries())) {
        const hhId = `hh_${randomUUID()}`;
        await db.insert(households).values({
          id: hhId, orgId,
          householdName: name,
          primaryLanguage: (info.meta.language || "en").trim() || "en",
          city: info.meta.city || null,
          zipCode: info.meta.zip || null,
        });
        hhCreated++;
        for (const m of info.members) {
          const ageNum = m.age ? parseInt(m.age, 10) : NaN;
          const primary = /^(1|true|yes|y)$/i.test((m.primary || "").trim());
          await db.insert(householdMembers).values({
            id: `m_${randomUUID()}`,
            householdId: hhId,
            orgId,
            displayName: m.name,
            relationship: m.relationship as HouseholdMember["relationship"],
            ageYears: Number.isFinite(ageNum) ? ageNum : null,
            preferredLanguage: m.language?.trim() || null,
            contactPhone: m.phone?.trim() || null,
            contactEmail: m.email?.trim() || null,
            isPrimaryContact: primary,
          });
          memberCreated++;
        }
      }
      res.json({ ok: true, householdsCreated: hhCreated, membersCreated: memberCreated, errors, uploadedBy: userId });
    } catch (err) {
      console.error("[community] bulk csv failed", err);
      res.status(500).json({ error: "Bulk upload failed" });
    }
  });
}
