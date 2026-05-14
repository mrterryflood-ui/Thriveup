/**
 * Idempotent demo seed for the Vann collaboration.
 * Creates two community-partner orgs (Sistahs Can We Talk + Iasis Christian Center),
 * a handful of households, ~12 weeks of weekly Wednesday youth attendance + scattered
 * services received. Clearly labeled as illustrative demo data.
 *
 * Safe to call on every boot — exits early if Sistahs CWT org already exists.
 */
import { db } from "./storage";
import {
  communityPartnerOrgs,
  households,
  householdMembers,
  communityPrograms,
  programEnrollments,
  programAttendance,
  householdServicesReceived,
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const SISTAHS_ID = "sistahs-cwt";
const IASIS_ID = "iasis-ccc";

export async function seedVannDemo(): Promise<{ skipped: boolean; orgs: string[] }> {
  const existing = await db.select().from(communityPartnerOrgs).where(eq(communityPartnerOrgs.id, SISTAHS_ID));
  if (existing.length) {
    return { skipped: true, orgs: [SISTAHS_ID, IASIS_ID] };
  }

  // ---------- ORGS ----------
  await db.insert(communityPartnerOrgs).values([
    {
      id: SISTAHS_ID,
      name: "Sistahs Can We Talk Inc.",
      orgType: "nonprofit",
      stateCode: "KS",
      city: "Wichita",
      websiteUrl: "http://www.sistahscanwetalk.com",
      primaryContactName: "Dr. J. Michelle Vann",
      primaryContactEmail: "",
      status: "demo",
      missionSummary: "Filling the gaps in the social disparities of health one woman at a time. BIPOC women's health, free cancer screenings, counseling, Healthy Me initiative, youth mentoring, digital storytelling.",
      notes: "ILLUSTRATIVE DEMO DATA — household names and details are placeholders for the Dr. Vann partnership conversation. No real Sistahs CWT member data is represented here.",
    },
    {
      id: IASIS_ID,
      name: "Iasis Christian Center",
      orgType: "faith",
      stateCode: "KS",
      city: "Wichita",
      websiteUrl: "https://www.iccwichita.org",
      primaryContactName: "Pastor William Vann (Senior Pastor); Dr. J. Michelle Vann (First Lady)",
      primaryContactEmail: "",
      status: "demo",
      missionSummary: "Pentecostal/Apostolic congregation, 37+ years in Wichita. Wednesday youth tracks: Joshua Generation (12+) and Academy of Excellence (≤11), 5:30–7pm, meal + transportation provided. Children's Ministry Sundays.",
      coiDisclosure: "Iasis Christian Center is led by Pastor William Vann, spouse of Dr. J. Michelle Vann (Sistahs Can We Talk Founder). On any federal grant application citing Iasis attendance data, disclose this relationship in the application's conflict-of-interest section. Routine disclosure — not a programmatic barrier.",
      notes: "ILLUSTRATIVE DEMO DATA — youth-program rosters are placeholders for the Dr. Vann partnership conversation. No real Iasis member data is represented here.",
    },
  ]);

  // ---------- PROGRAMS ----------
  const programs = {
    healthyMe: { id: "prog_healthy_me", orgId: SISTAHS_ID },
    sistahsMentoring: { id: "prog_sistahs_mentoring", orgId: SISTAHS_ID },
    quarterlyTeaching: { id: "prog_quarterly_teaching", orgId: SISTAHS_ID },
    joshuaGen: { id: "prog_joshua_gen", orgId: IASIS_ID },
    academyExcellence: { id: "prog_academy_excellence", orgId: IASIS_ID },
    childrensMinistry: { id: "prog_childrens_ministry", orgId: IASIS_ID },
  };
  await db.insert(communityPrograms).values([
    { id: programs.healthyMe.id, orgId: SISTAHS_ID, name: "Healthy Me Initiative", category: "women_wellness", ageMin: 18, ageMax: null, cadence: "weekly", scheduleNote: "Weekly women's wellness circle + on-the-ground health screenings", provides: ["curriculum", "screenings"], description: "Holistic women's wellness — mental, physical, emotional — addressing social determinants of health for BIPOC women.", active: true },
    { id: programs.sistahsMentoring.id, orgId: SISTAHS_ID, name: "Sistahs Mentoring Circle", category: "mentoring", ageMin: 11, ageMax: 17, cadence: "biweekly", scheduleNote: "Biweekly mentoring for girls 11–17", provides: ["curriculum"], description: "Nurturing new community leaders through structured girl-mentor pairings and small-group sessions.", active: true },
    { id: programs.quarterlyTeaching.id, orgId: SISTAHS_ID, name: "Quarterly Teaching Sessions", category: "adult_education", ageMin: 18, ageMax: null, cadence: "quarterly", scheduleNote: "Quarterly women's wellness education", provides: ["curriculum"], description: "Quarterly teaching for women needing to move forward — mindset, wellness, life skills.", active: true },
    { id: programs.joshuaGen.id, orgId: IASIS_ID, name: "Joshua Generation", category: "youth", ageMin: 12, ageMax: 18, cadence: "weekly", scheduleNote: "Wednesdays 5:30–7:00pm", provides: ["meal", "transportation", "curriculum"], description: "Wednesday youth ministry track for ages 12+, with provided meal and transportation. Spiritual and educational guidance.", active: true },
    { id: programs.academyExcellence.id, orgId: IASIS_ID, name: "Academy of Excellence", category: "youth", ageMin: 5, ageMax: 11, cadence: "weekly", scheduleNote: "Wednesdays 5:30–7:00pm", provides: ["meal", "transportation", "curriculum"], description: "Wednesday children's ministry track for ages 11 and under, with provided meal and transportation.", active: true },
    { id: programs.childrensMinistry.id, orgId: IASIS_ID, name: "Children's Ministry", category: "faith_formation", ageMin: 2, ageMax: 10, cadence: "weekly", scheduleNote: "Sundays 10:30am", provides: ["childcare", "curriculum"], description: "Sunday-morning children's ministry during worship service for ages 2–10.", active: true },
  ]);

  // ---------- HOUSEHOLDS + MEMBERS ----------
  // 8 placeholder families spread across both orgs (some families participate in both — that's the whole point).
  type SeededMember = {
    id: string; displayName: string; relationship: "parent" | "guardian" | "child" | "grandparent" | "spouse" | "other_adult";
    age?: number; lang?: string; phone?: string; email?: string; primary?: boolean;
    enrolledIn?: string[];
  };
  type SeededHh = { id: string; orgIds: string[]; name: string; lang: string; city: string; zip: string; members: SeededMember[] };

  const families: SeededHh[] = [
    {
      id: "hh_williams", orgIds: [IASIS_ID, SISTAHS_ID], name: "Williams Family (placeholder)", lang: "en", city: "Wichita", zip: "67214",
      members: [
        { id: "m_williams_mom", displayName: "L. Williams", relationship: "parent", age: 38, lang: "en", phone: "316-555-0101", email: "", primary: true, enrolledIn: [programs.healthyMe.id, programs.quarterlyTeaching.id] },
        { id: "m_williams_c1", displayName: "Williams child A", relationship: "child", age: 13, enrolledIn: [programs.joshuaGen.id, programs.sistahsMentoring.id] },
        { id: "m_williams_c2", displayName: "Williams child B", relationship: "child", age: 9, enrolledIn: [programs.academyExcellence.id, programs.childrensMinistry.id] },
        { id: "m_williams_c3", displayName: "Williams child C", relationship: "child", age: 5, enrolledIn: [programs.academyExcellence.id, programs.childrensMinistry.id] },
      ],
    },
    {
      id: "hh_johnson", orgIds: [IASIS_ID, SISTAHS_ID], name: "Johnson Family (placeholder)", lang: "en", city: "Wichita", zip: "67214",
      members: [
        { id: "m_johnson_mom", displayName: "K. Johnson", relationship: "parent", age: 41, lang: "en", phone: "316-555-0102", primary: true, enrolledIn: [programs.healthyMe.id] },
        { id: "m_johnson_c1", displayName: "Johnson child A", relationship: "child", age: 14, enrolledIn: [programs.joshuaGen.id] },
        { id: "m_johnson_c2", displayName: "Johnson child B", relationship: "child", age: 11, enrolledIn: [programs.academyExcellence.id] },
      ],
    },
    {
      id: "hh_garcia", orgIds: [IASIS_ID, SISTAHS_ID], name: "Garcia Family (placeholder, Spanish-preferred)", lang: "es", city: "Wichita", zip: "67213",
      members: [
        { id: "m_garcia_mom", displayName: "M. García", relationship: "parent", age: 36, lang: "es", phone: "316-555-0103", primary: true, enrolledIn: [programs.healthyMe.id] },
        { id: "m_garcia_c1", displayName: "García child A", relationship: "child", age: 13, lang: "es", enrolledIn: [programs.joshuaGen.id] },
        { id: "m_garcia_c2", displayName: "García child B", relationship: "child", age: 10, lang: "es", enrolledIn: [programs.academyExcellence.id] },
      ],
    },
    {
      id: "hh_tran", orgIds: [IASIS_ID, SISTAHS_ID], name: "Tran Family (placeholder, Vietnamese-preferred)", lang: "vi", city: "Wichita", zip: "67217",
      members: [
        { id: "m_tran_mom", displayName: "T. Trần", relationship: "parent", age: 44, lang: "vi", phone: "316-555-0104", primary: true, enrolledIn: [programs.healthyMe.id] },
        { id: "m_tran_d", displayName: "Trần daughter", relationship: "child", age: 15, lang: "en", enrolledIn: [programs.joshuaGen.id, programs.sistahsMentoring.id] },
      ],
    },
    {
      id: "hh_davis", orgIds: [IASIS_ID, SISTAHS_ID], name: "Davis Family (placeholder, single parent)", lang: "en", city: "Wichita", zip: "67214",
      members: [
        { id: "m_davis_mom", displayName: "R. Davis", relationship: "parent", age: 33, lang: "en", phone: "316-555-0105", primary: true, enrolledIn: [programs.healthyMe.id] },
        { id: "m_davis_d", displayName: "Davis daughter", relationship: "child", age: 12, enrolledIn: [programs.joshuaGen.id, programs.sistahsMentoring.id] },
      ],
    },
    {
      id: "hh_brown", orgIds: [IASIS_ID, SISTAHS_ID], name: "Brown Family (placeholder, grandparent caregiver)", lang: "en", city: "Wichita", zip: "67219",
      members: [
        { id: "m_brown_gma", displayName: "B. Brown", relationship: "grandparent", age: 64, lang: "en", phone: "316-555-0106", primary: true, enrolledIn: [programs.quarterlyTeaching.id] },
        { id: "m_brown_c1", displayName: "Brown grandchild A", relationship: "child", age: 16, enrolledIn: [programs.joshuaGen.id] },
        { id: "m_brown_c2", displayName: "Brown grandchild B", relationship: "child", age: 13, enrolledIn: [programs.joshuaGen.id, programs.sistahsMentoring.id] },
      ],
    },
    {
      id: "hh_anderson", orgIds: [IASIS_ID, SISTAHS_ID], name: "Anderson Family (placeholder, two-parent)", lang: "en", city: "Wichita", zip: "67220",
      members: [
        { id: "m_anderson_mom", displayName: "A. Anderson", relationship: "parent", age: 39, lang: "en", phone: "316-555-0107", primary: true, enrolledIn: [programs.healthyMe.id] },
        { id: "m_anderson_dad", displayName: "D. Anderson", relationship: "spouse", age: 41, lang: "en" },
        { id: "m_anderson_s", displayName: "Anderson son", relationship: "child", age: 11, enrolledIn: [programs.academyExcellence.id, programs.childrensMinistry.id] },
      ],
    },
    {
      id: "hh_thomas", orgIds: [IASIS_ID, SISTAHS_ID], name: "Thomas Family (placeholder, large household)", lang: "en", city: "Wichita", zip: "67214",
      members: [
        { id: "m_thomas_mom", displayName: "S. Thomas", relationship: "parent", age: 45, lang: "en", phone: "316-555-0108", primary: true, enrolledIn: [programs.healthyMe.id, programs.quarterlyTeaching.id] },
        { id: "m_thomas_c1", displayName: "Thomas child A", relationship: "child", age: 17, enrolledIn: [programs.joshuaGen.id, programs.sistahsMentoring.id] },
        { id: "m_thomas_c2", displayName: "Thomas child B", relationship: "child", age: 14, enrolledIn: [programs.joshuaGen.id] },
        { id: "m_thomas_c3", displayName: "Thomas child C", relationship: "child", age: 8, enrolledIn: [programs.academyExcellence.id] },
      ],
    },
  ];

  // Insert households once per (familyId, orgId) — a single family can appear under both orgs as separate household records (each org tracks separately).
  // For demo simplicity we insert one household row per (family × org) and one member row per (member × org), enrolling each member only in that org's programs.
  // This mirrors how SCWT and Iasis would each maintain their own roster of the same families.
  const programOrgMap: Record<string, string> = Object.fromEntries(Object.values(programs).map(p => [p.id, p.orgId]));
  const enrollmentRows: Array<{ id: string; memberId: string; programId: string; orgId: string; enrolledOn: Date }> = [];

  for (const fam of families) {
    for (const orgId of fam.orgIds) {
      const hhId = `${fam.id}__${orgId}`;
      await db.insert(households).values({
        id: hhId, orgId,
        householdName: fam.name,
        primaryLanguage: fam.lang,
        city: fam.city,
        zipCode: fam.zip,
      });
      for (const m of fam.members) {
        const memberId = `${m.id}__${orgId}`;
        await db.insert(householdMembers).values({
          id: memberId, householdId: hhId, orgId,
          displayName: m.displayName,
          relationship: m.relationship,
          ageYears: m.age ?? null,
          preferredLanguage: m.lang || fam.lang,
          contactPhone: m.phone || null,
          contactEmail: m.email || null,
          isPrimaryContact: !!m.primary,
        });
        for (const progId of m.enrolledIn || []) {
          if (programOrgMap[progId] !== orgId) continue; // only enroll in this org's programs
          enrollmentRows.push({
            id: `enr_${randomUUID()}`,
            memberId,
            programId: progId,
            orgId,
            enrolledOn: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // ~3 months ago
          });
        }
      }
    }
  }
  if (enrollmentRows.length) {
    await db.insert(programEnrollments).values(enrollmentRows);
  }

  // ---------- ATTENDANCE (12 Wednesdays for Joshua Gen + Academy + Children's Ministry, plus weekly Healthy Me) ----------
  const today = new Date();
  const weeklyWeds: Date[] = [];
  // last 12 Wednesdays
  const d = new Date(today);
  d.setHours(17, 30, 0, 0); // 5:30pm
  // step back to most recent Wednesday
  while (d.getDay() !== 3) d.setDate(d.getDate() - 1);
  for (let i = 0; i < 12; i++) {
    weeklyWeds.push(new Date(d));
    d.setDate(d.getDate() - 7);
  }
  weeklyWeds.reverse();

  const attendanceRows: Array<{
    id: string; enrollmentId: string; memberId: string; programId: string; orgId: string;
    sessionDate: Date; status: "present" | "absent" | "excused" | "late";
    receivedMeal: boolean; receivedTransport: boolean;
  }> = [];

  // pseudo-random attendance: ~85% present for youth, with some absences/excused
  function pickStatus(seed: number): "present" | "absent" | "excused" | "late" {
    const r = (seed * 9301 + 49297) % 233280 / 233280;
    if (r < 0.83) return "present";
    if (r < 0.91) return "late";
    if (r < 0.96) return "excused";
    return "absent";
  }

  for (const enr of enrollmentRows) {
    const prog = Object.values(programs).find(p => p.id === enr.programId);
    if (!prog) continue;
    // Only Joshua Gen / Academy / Children's Ministry get weekly attendance in this demo
    const isWeekly = [programs.joshuaGen.id, programs.academyExcellence.id, programs.childrensMinistry.id, programs.healthyMe.id].includes(enr.programId);
    if (!isWeekly) continue;
    const sessions = enr.programId === programs.healthyMe.id
      ? weeklyWeds.map(w => { const x = new Date(w); x.setDate(x.getDate() + 2); x.setHours(18, 0, 0, 0); return x; }) // Fridays for Healthy Me
      : weeklyWeds;
    for (let i = 0; i < sessions.length; i++) {
      const seed = enr.memberId.length + i + enr.programId.length;
      const status = pickStatus(seed);
      const present = status === "present" || status === "late";
      const meal = present && (enr.programId === programs.joshuaGen.id || enr.programId === programs.academyExcellence.id);
      const transport = present && (enr.programId === programs.joshuaGen.id || enr.programId === programs.academyExcellence.id) && (seed % 3 !== 0);
      attendanceRows.push({
        id: `att_${randomUUID()}`,
        enrollmentId: enr.id,
        memberId: enr.memberId,
        programId: enr.programId,
        orgId: enr.orgId,
        sessionDate: sessions[i],
        status, receivedMeal: meal, receivedTransport: transport,
      });
    }
  }
  // chunk inserts to keep payload reasonable
  for (let i = 0; i < attendanceRows.length; i += 500) {
    await db.insert(programAttendance).values(attendanceRows.slice(i, i + 500));
  }

  // ---------- SERVICES RECEIVED (scattered) ----------
  const services: Array<{
    id: string; householdId: string; orgId: string; serviceType: string; serviceDate: Date;
    recipientMemberId?: string | null; outcome: string; notes?: string;
  }> = [
    { id: `svc_${randomUUID()}`, householdId: `hh_williams__${SISTAHS_ID}`, orgId: SISTAHS_ID, serviceType: "cancer_screening", serviceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), recipientMemberId: `m_williams_mom__${SISTAHS_ID}`, outcome: "completed", notes: "Healthy Me on-the-ground screening event." },
    { id: `svc_${randomUUID()}`, householdId: `hh_johnson__${SISTAHS_ID}`, orgId: SISTAHS_ID, serviceType: "counseling", serviceDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), recipientMemberId: `m_johnson_mom__${SISTAHS_ID}`, outcome: "completed" },
    { id: `svc_${randomUUID()}`, householdId: `hh_garcia__${SISTAHS_ID}`, orgId: SISTAHS_ID, serviceType: "resource_referral", serviceDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), recipientMemberId: null, outcome: "referred_out", notes: "Referred to Wichita Children's Home for back-to-school support." },
    { id: `svc_${randomUUID()}`, householdId: `hh_tran__${SISTAHS_ID}`, orgId: SISTAHS_ID, serviceType: "digital_storytelling", serviceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), recipientMemberId: `m_tran_mom__${SISTAHS_ID}`, outcome: "completed", notes: "Story submitted to KDHE environmental-justice docket." },
    { id: `svc_${randomUUID()}`, householdId: `hh_davis__${SISTAHS_ID}`, orgId: SISTAHS_ID, serviceType: "phq9", serviceDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), recipientMemberId: `m_davis_mom__${SISTAHS_ID}`, outcome: "completed", notes: "PHQ-9 screen — score 8 (mild). No further referral indicated." },
    { id: `svc_${randomUUID()}`, householdId: `hh_brown__${SISTAHS_ID}`, orgId: SISTAHS_ID, serviceType: "food_assistance", serviceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), recipientMemberId: null, outcome: "completed" },
    { id: `svc_${randomUUID()}`, householdId: `hh_thomas__${SISTAHS_ID}`, orgId: SISTAHS_ID, serviceType: "cancer_screening", serviceDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), recipientMemberId: `m_thomas_mom__${SISTAHS_ID}`, outcome: "completed" },
    { id: `svc_${randomUUID()}`, householdId: `hh_anderson__${SISTAHS_ID}`, orgId: SISTAHS_ID, serviceType: "gad7", serviceDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), recipientMemberId: `m_anderson_mom__${SISTAHS_ID}`, outcome: "completed", notes: "GAD-7 score 4 (minimal)." },
  ];
  if (services.length) await db.insert(householdServicesReceived).values(services);

  return { skipped: false, orgs: [SISTAHS_ID, IASIS_ID] };
}
