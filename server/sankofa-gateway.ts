import { db } from "./storage";
import {
  healthAssessments,
  healthScreeningResults,
  wellnessResources,
  healthResourceCategories,
  gisResourceOverlays,
  type HealthAssessment,
  type HealthScreeningResult,
  type WellnessResource,
  type HealthResourceCategory,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface AssessmentQuestion {
  id: string;
  text: string;
  options: string[];
  scores: number[];
}

export interface ScoringRubric {
  maxScore: number;
  thresholds: Record<string, number>;
}

export interface HealthResourceRecommendation {
  id: string;
  name: string;
  category: string;
  address: string | null;
  contactInfo: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
}

export const SANKOFA_PRODUCT_LINES = [
  { id: "mental-wellness", name: "Mental Wellness", description: "Behavioral health screenings and mental wellness resources", color: "#6366f1" },
  { id: "herhealth", name: "HerHealth", description: "Women's health and wellness resources", color: "#ec4899" },
  { id: "healthy-black-men", name: "HealthyBlackMen", description: "Men's health initiatives and preventive care", color: "#14b8a6" },
  { id: "birthright", name: "BirthRight", description: "Maternal and infant health resources", color: "#f59e0b" },
  { id: "mce", name: "MCE (Multicultural Community Engagement)", description: "Community-centered health equity initiatives", color: "#8b5cf6" },
];

export async function getHealthResourceCategoriesList(): Promise<HealthResourceCategory[]> {
  return db.select().from(healthResourceCategories).where(eq(healthResourceCategories.isActive, true));
}

export async function getHealthAssessments(): Promise<HealthAssessment[]> {
  return db.select().from(healthAssessments).where(eq(healthAssessments.isActive, true));
}

export async function getHealthAssessment(id: string): Promise<HealthAssessment | undefined> {
  const [assessment] = await db.select().from(healthAssessments).where(eq(healthAssessments.id, id));
  return assessment;
}

export async function submitHealthScreening(data: {
  userId: string;
  assessmentId: string;
  assessmentType: string;
  responses: Record<string, number>;
  totalScore: number;
  maxScore: number;
  riskLevel: string;
  recommendations: string[];
}): Promise<HealthScreeningResult> {
  const [result] = await db.insert(healthScreeningResults).values(data).returning();
  return result;
}

export async function getUserScreeningResults(userId: string): Promise<HealthScreeningResult[]> {
  return db.select().from(healthScreeningResults)
    .where(eq(healthScreeningResults.userId, userId))
    .orderBy(desc(healthScreeningResults.completedAt));
}

export async function getWellnessResourcesByProductLine(productLine: string): Promise<WellnessResource[]> {
  return db.select().from(wellnessResources)
    .where(and(eq(wellnessResources.productLine, productLine), eq(wellnessResources.isActive, true)))
    .orderBy(wellnessResources.sortOrder);
}

export async function getAllWellnessResources(): Promise<WellnessResource[]> {
  return db.select().from(wellnessResources)
    .where(eq(wellnessResources.isActive, true))
    .orderBy(wellnessResources.sortOrder);
}

export async function getWellnessResource(id: string): Promise<WellnessResource | undefined> {
  const [resource] = await db.select().from(wellnessResources).where(eq(wellnessResources.id, id));
  return resource;
}

export function computeRiskLevel(totalScore: number, maxScore: number): string {
  const pct = (totalScore / maxScore) * 100;
  if (pct >= 75) return "low";
  if (pct >= 50) return "moderate";
  if (pct >= 25) return "elevated";
  return "high";
}

export function generateRecommendations(assessmentType: string, riskLevel: string): string[] {
  const recs: string[] = [];

  if (assessmentType === "behavioral-health") {
    if (riskLevel === "high" || riskLevel === "elevated") {
      recs.push("Consider speaking with a behavioral health professional");
      recs.push("Practice daily mindfulness or breathing exercises");
      recs.push("Reach out to a trusted friend, mentor, or family member");
    }
    if (riskLevel === "moderate") {
      recs.push("Maintain regular sleep and exercise routines");
      recs.push("Consider journaling to track mood patterns");
    }
    recs.push("Explore the Mental Wellness resources in the wellness library");
  }

  if (assessmentType === "stress-coping") {
    if (riskLevel === "high" || riskLevel === "elevated") {
      recs.push("Identify and reduce primary stress triggers where possible");
      recs.push("Practice progressive muscle relaxation techniques");
      recs.push("Connect with community support resources");
    }
    if (riskLevel === "moderate") {
      recs.push("Build a consistent self-care routine");
      recs.push("Try time management strategies to reduce overwhelm");
    }
    recs.push("Review stress management resources in the wellness library");
  }

  if (assessmentType === "holistic-wellness") {
    if (riskLevel === "high" || riskLevel === "elevated") {
      recs.push("Focus on improving one wellness area at a time");
      recs.push("Seek support from community health resources");
      recs.push("Set small, achievable daily wellness goals");
    }
    if (riskLevel === "moderate") {
      recs.push("Maintain balanced nutrition and regular physical activity");
      recs.push("Prioritize quality sleep and stress management");
    }
    recs.push("Explore culturally responsive resources across all product lines");
  }

  return recs;
}

const HEALTH_CATEGORIES = [
  "behavioral_health", "mental_health", "counseling", "substance_abuse",
  "health_center", "crisis_center", "wellness", "community_health",
];

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function getHealthResourceRecommendations(
  options: { state?: string; lat?: number; lng?: number } = {}
): Promise<HealthResourceRecommendation[]> {
  try {
    const allResources = await db.select().from(gisResourceOverlays)
      .where(eq(gisResourceOverlays.isActive, true));

    const healthResources = allResources.filter(r => {
      const cat = (r.category || "").toLowerCase();
      const name = (r.name || "").toLowerCase();
      const desc = (r.description || "").toLowerCase();
      return HEALTH_CATEGORIES.some(hc => cat.includes(hc) || name.includes(hc) || desc.includes(hc))
        || cat.includes("health") || name.includes("health") || name.includes("counseling")
        || name.includes("mental") || name.includes("behavioral");
    });

    let filtered = healthResources;
    if (options.state) {
      const stateFiltered = healthResources.filter(r => {
        const addr = (r.address || "").toUpperCase();
        return addr.includes(options.state!.toUpperCase());
      });
      if (stateFiltered.length > 0) filtered = stateFiltered;
    }

    if (options.lat != null && options.lng != null) {
      const userLat = options.lat;
      const userLng = options.lng;
      filtered.sort((a, b) => {
        const distA = (a.latitude != null && a.longitude != null)
          ? haversineDistance(userLat, userLng, a.latitude, a.longitude) : Infinity;
        const distB = (b.latitude != null && b.longitude != null)
          ? haversineDistance(userLat, userLng, b.latitude, b.longitude) : Infinity;
        return distA - distB;
      });
    }

    return filtered.slice(0, 20).map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      address: r.address,
      contactInfo: r.contactInfo,
      description: r.description,
      latitude: r.latitude,
      longitude: r.longitude,
    }));
  } catch (error) {
    console.error("[Sankofa Gateway] Error fetching health resource recommendations:", error);
    return [];
  }
}

const CATEGORY_SEEDS = [
  { id: "cat-mental-health-awareness", name: "Mental Health Awareness", productLine: "mental-wellness", description: "Resources for understanding mental health conditions and warning signs", sortOrder: 1 },
  { id: "cat-coping-strategies", name: "Coping Strategies", productLine: "mental-wellness", description: "Evidence-based techniques for managing stress and anxiety", sortOrder: 2 },
  { id: "cat-social-wellness", name: "Social Wellness", productLine: "mental-wellness", description: "Building healthy relationships and support networks", sortOrder: 3 },
  { id: "cat-sleep-health", name: "Sleep Health", productLine: "mental-wellness", description: "Sleep hygiene and rest optimization", sortOrder: 4 },
  { id: "cat-womens-health", name: "Women's Health", productLine: "herhealth", description: "Health resources tailored for women across all life stages", sortOrder: 5 },
  { id: "cat-self-care", name: "Self-Care", productLine: "herhealth", description: "Culturally responsive self-care practices", sortOrder: 6 },
  { id: "cat-mens-health", name: "Men's Health", productLine: "healthy-black-men", description: "Preventive care and wellness for men", sortOrder: 7 },
  { id: "cat-stress-management", name: "Stress Management", productLine: "healthy-black-men", description: "Stress reduction and emotional regulation strategies", sortOrder: 8 },
  { id: "cat-maternal-health", name: "Maternal Health", productLine: "birthright", description: "Prenatal, postpartum, and maternal wellness resources", sortOrder: 9 },
  { id: "cat-health-equity", name: "Health Equity", productLine: "mce", description: "Addressing health disparities and promoting equitable access", sortOrder: 10 },
  { id: "cat-nutrition", name: "Nutrition", productLine: "mce", description: "Healthy eating and food access resources", sortOrder: 11 },
  { id: "cat-physical-activity", name: "Physical Activity", productLine: "mce", description: "Accessible fitness approaches for whole-body wellness", sortOrder: 12 },
];

const CATEGORY_NAME_TO_ID: Record<string, string> = {};
for (const c of CATEGORY_SEEDS) {
  CATEGORY_NAME_TO_ID[c.name] = c.id;
}

export async function seedHealthData(): Promise<void> {
  const existingCategories = await db.select().from(healthResourceCategories);
  if (existingCategories.length === 0) {
    await db.insert(healthResourceCategories).values(CATEGORY_SEEDS);
  }

  const existingAssessments = await db.select().from(healthAssessments);
  if (existingAssessments.length === 0) {
    await db.insert(healthAssessments).values([
    {
      id: "assessment-behavioral-health",
      title: "Behavioral Health Screening",
      description: "A brief screening to assess your current mental and behavioral wellness. This is not a clinical diagnosis — it helps identify areas where you may benefit from additional support.",
      assessmentType: "behavioral-health",
      productLine: "mental-wellness",
      questions: [
        { id: "bh1", text: "Over the past 2 weeks, how often have you felt down, depressed, or hopeless?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"], scores: [3, 2, 1, 0] },
        { id: "bh2", text: "How often have you had little interest or pleasure in doing things?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"], scores: [3, 2, 1, 0] },
        { id: "bh3", text: "How would you rate your overall emotional well-being right now?", options: ["Excellent", "Good", "Fair", "Poor"], scores: [3, 2, 1, 0] },
        { id: "bh4", text: "How well are you sleeping most nights?", options: ["Very well", "Fairly well", "Not very well", "Poorly"], scores: [3, 2, 1, 0] },
        { id: "bh5", text: "How connected do you feel to people who care about you?", options: ["Very connected", "Somewhat connected", "Not very connected", "Not at all connected"], scores: [3, 2, 1, 0] },
        { id: "bh6", text: "How often do you feel anxious or worried?", options: ["Rarely", "Sometimes", "Often", "Almost always"], scores: [3, 2, 1, 0] },
        { id: "bh7", text: "How confident are you in your ability to handle daily challenges?", options: ["Very confident", "Somewhat confident", "Not very confident", "Not at all confident"], scores: [3, 2, 1, 0] },
        { id: "bh8", text: "How often do you engage in activities that bring you joy?", options: ["Daily", "A few times a week", "Rarely", "Never"], scores: [3, 2, 1, 0] },
      ],
      scoringRubric: { maxScore: 24, thresholds: { low: 18, moderate: 12, elevated: 6, high: 0 } },
    },
    {
      id: "assessment-stress-coping",
      title: "Stress & Coping Evaluation",
      description: "Evaluate your current stress levels and coping strategies. Understanding your stress patterns can help you build healthier responses.",
      assessmentType: "stress-coping",
      productLine: "mental-wellness",
      questions: [
        { id: "sc1", text: "In the last month, how often have you felt that you were unable to control important things in your life?", options: ["Never", "Almost never", "Sometimes", "Fairly often", "Very often"], scores: [4, 3, 2, 1, 0] },
        { id: "sc2", text: "How often have you felt confident about your ability to handle personal problems?", options: ["Very often", "Fairly often", "Sometimes", "Almost never", "Never"], scores: [4, 3, 2, 1, 0] },
        { id: "sc3", text: "How often have you felt that things were going your way?", options: ["Very often", "Fairly often", "Sometimes", "Almost never", "Never"], scores: [4, 3, 2, 1, 0] },
        { id: "sc4", text: "How often have you felt difficulties were piling up so high that you could not overcome them?", options: ["Never", "Almost never", "Sometimes", "Fairly often", "Very often"], scores: [4, 3, 2, 1, 0] },
        { id: "sc5", text: "How would you rate your current coping strategies?", options: ["Very effective", "Somewhat effective", "Not very effective", "Ineffective"], scores: [3, 2, 1, 0] },
        { id: "sc6", text: "Do you have people you can turn to for emotional support?", options: ["Yes, several", "Yes, a few", "One person", "No one"], scores: [3, 2, 1, 0] },
        { id: "sc7", text: "How often do you take time for self-care activities?", options: ["Daily", "A few times a week", "Rarely", "Never"], scores: [3, 2, 1, 0] },
      ],
      scoringRubric: { maxScore: 25, thresholds: { low: 19, moderate: 13, elevated: 7, high: 0 } },
    },
    {
      id: "assessment-holistic-wellness",
      title: "Holistic Wellness Check",
      description: "A comprehensive wellness check covering physical, emotional, social, and spiritual dimensions of health from a culturally responsive perspective.",
      assessmentType: "holistic-wellness",
      productLine: "mce",
      questions: [
        { id: "hw1", text: "How would you rate your overall physical health?", options: ["Excellent", "Good", "Fair", "Poor"], scores: [3, 2, 1, 0] },
        { id: "hw2", text: "How often do you engage in physical activity (walking, exercise, etc.)?", options: ["Daily", "A few times a week", "Rarely", "Never"], scores: [3, 2, 1, 0] },
        { id: "hw3", text: "How well do you feel you eat nutritious meals?", options: ["Very well", "Fairly well", "Not very well", "Poorly"], scores: [3, 2, 1, 0] },
        { id: "hw4", text: "How would you rate your emotional resilience?", options: ["Very strong", "Strong", "Developing", "Struggling"], scores: [3, 2, 1, 0] },
        { id: "hw5", text: "How connected do you feel to your cultural identity and community?", options: ["Very connected", "Somewhat connected", "Slightly connected", "Not connected"], scores: [3, 2, 1, 0] },
        { id: "hw6", text: "How meaningful do you find your daily activities and purpose?", options: ["Very meaningful", "Somewhat meaningful", "Not very meaningful", "Not meaningful"], scores: [3, 2, 1, 0] },
        { id: "hw7", text: "How supported do you feel by your community?", options: ["Very supported", "Somewhat supported", "Slightly supported", "Not supported"], scores: [3, 2, 1, 0] },
        { id: "hw8", text: "How well do you manage your financial wellness?", options: ["Very well", "Fairly well", "Not very well", "Poorly"], scores: [3, 2, 1, 0] },
        { id: "hw9", text: "How often do you practice activities that nourish your spirit (prayer, meditation, nature, art)?", options: ["Daily", "Weekly", "Rarely", "Never"], scores: [3, 2, 1, 0] },
      ],
      scoringRubric: { maxScore: 27, thresholds: { low: 20, moderate: 14, elevated: 7, high: 0 } },
    },
  ]);
  }

  const existingResources = await db.select().from(wellnessResources);
  if (existingResources.length === 0) {
  await db.insert(wellnessResources).values([
    {
      title: "Understanding Your Mental Health",
      description: "A guide to recognizing signs of stress, anxiety, and depression in yourself and others.",
      content: "Mental health is a vital part of overall wellness. This resource covers the basics of mental health awareness, including common signs of stress, anxiety, and depression. Understanding these signs early can help you seek support and build resilience. Key topics include: recognizing emotional patterns, understanding triggers, the importance of social connection, and when to seek professional help. Remember: seeking help is a sign of strength, not weakness.",
      productLine: "mental-wellness",
      category: "Mental Health Awareness",
      categoryId: "cat-mental-health-awareness",
      resourceType: "article",
      tags: ["mental health", "awareness", "stress", "anxiety"],
      iconName: "brain",
      sortOrder: 1,
    },
    {
      title: "Breathing & Grounding Techniques",
      description: "Simple breathing exercises and grounding techniques to manage stress and anxiety in the moment.",
      content: "When stress or anxiety feels overwhelming, these techniques can help you regain a sense of calm. Box Breathing: Inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat 4 times. 5-4-3-2-1 Grounding: Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. Progressive Muscle Relaxation: Starting from your toes, tense each muscle group for 5 seconds, then release. Move up through your body. These are evidence-based techniques used in behavioral health settings.",
      productLine: "mental-wellness",
      category: "Coping Strategies",
      categoryId: "cat-coping-strategies",
      resourceType: "guide",
      tags: ["breathing", "grounding", "coping", "anxiety"],
      iconName: "wind",
      sortOrder: 2,
    },
    {
      title: "Building Healthy Relationships",
      description: "Understanding healthy communication patterns and building supportive relationships.",
      content: "Healthy relationships are foundational to mental wellness. This resource covers: active listening skills, setting healthy boundaries, recognizing unhealthy relationship patterns, and building trust. Strong social connections are one of the most powerful protective factors for mental health. Learn how to cultivate relationships that support your growth and wellbeing.",
      productLine: "mental-wellness",
      category: "Social Wellness",
      categoryId: "cat-social-wellness",
      resourceType: "article",
      tags: ["relationships", "communication", "boundaries"],
      iconName: "users",
      sortOrder: 3,
    },
    {
      title: "Women's Wellness Guide",
      description: "Comprehensive wellness resources addressing women's unique health needs and self-care practices.",
      content: "HerHealth focuses on the unique wellness needs of women across all life stages. This guide covers: nutrition and physical health for women, mental health considerations including postpartum wellness, stress management in caregiving roles, building support networks, and self-advocacy in healthcare settings. Cultural context matters — this resource is designed with the experiences of Black women and women of color at the center.",
      productLine: "herhealth",
      category: "Women's Health",
      categoryId: "cat-womens-health",
      resourceType: "guide",
      tags: ["women", "wellness", "self-care", "nutrition"],
      iconName: "heart",
      sortOrder: 4,
    },
    {
      title: "Self-Care Rituals for Women",
      description: "Culturally responsive self-care practices rooted in community traditions.",
      content: "Self-care isn't selfish — it's essential. This resource offers practical self-care strategies rooted in cultural traditions: creating morning rituals that center your mind, body care practices, journaling for emotional processing, community-based healing circles, and creative expression as therapy. Small daily practices can create significant shifts in overall wellbeing.",
      productLine: "herhealth",
      category: "Self-Care",
      categoryId: "cat-self-care",
      resourceType: "article",
      tags: ["self-care", "rituals", "women", "culture"],
      iconName: "sparkles",
      sortOrder: 5,
    },
    {
      title: "Men's Health: Breaking the Silence",
      description: "Resources encouraging men to prioritize their physical and mental health.",
      content: "HealthyBlackMen challenges the stigma around men seeking help. This resource addresses: preventive health screenings men should know about, recognizing depression and anxiety in men, the impact of racial stress on health, building brotherhood and support networks, and redefining strength to include vulnerability and self-awareness. Taking care of yourself is not a weakness — it's the foundation of being there for your family and community.",
      productLine: "healthy-black-men",
      category: "Men's Health",
      categoryId: "cat-mens-health",
      resourceType: "article",
      tags: ["men", "health", "stigma", "prevention"],
      iconName: "shield",
      sortOrder: 6,
    },
    {
      title: "Stress Management for Men",
      description: "Practical strategies for managing stress, anger, and emotional health.",
      content: "Men often face unique pressures that can build up silently. This guide offers: physical activity as stress relief, mindfulness practices adapted for men, healthy outlets for anger and frustration, the importance of talking about your feelings, and when and how to seek professional support. You don't have to carry everything alone — community and connection are part of the solution.",
      productLine: "healthy-black-men",
      category: "Stress Management",
      categoryId: "cat-stress-management",
      resourceType: "guide",
      tags: ["stress", "anger", "men", "management"],
      iconName: "activity",
      sortOrder: 7,
    },
    {
      title: "Maternal Wellness Guide",
      description: "Resources for expecting and new mothers covering prenatal and postpartum wellness.",
      content: "BirthRight provides comprehensive support for maternal wellness. This guide covers: prenatal nutrition and health, managing pregnancy-related stress and anxiety, recognizing signs of postpartum depression, building a birth support team, breastfeeding support and resources, and navigating the healthcare system as a person of color. Black maternal health is a critical issue — you deserve culturally competent care and support.",
      productLine: "birthright",
      category: "Maternal Health",
      categoryId: "cat-maternal-health",
      resourceType: "guide",
      tags: ["maternal", "prenatal", "postpartum", "pregnancy"],
      iconName: "baby",
      sortOrder: 8,
    },
    {
      title: "Community Health Equity",
      description: "Understanding health disparities and advocating for equitable health access.",
      content: "MCE focuses on addressing health inequities through community engagement. This resource covers: understanding social determinants of health, navigating barriers to healthcare access, community-based health advocacy, the connection between workforce development and health outcomes, and culturally responsive health education. Health equity means everyone has a fair opportunity to be as healthy as possible — and that starts with understanding the systems that impact our communities.",
      productLine: "mce",
      category: "Health Equity",
      categoryId: "cat-health-equity",
      resourceType: "article",
      tags: ["equity", "community", "advocacy", "social determinants"],
      iconName: "globe",
      sortOrder: 9,
    },
    {
      title: "Nutrition & Food Access",
      description: "Guidance on healthy eating, food access challenges, and community food resources.",
      content: "Good nutrition is foundational to health, but access isn't equal. This resource addresses: practical tips for healthy eating on a budget, understanding food deserts and their impact, local food assistance programs and community gardens, cultural foods and nutritional benefits, meal planning strategies for busy families, and connecting with community food resources. Eating well shouldn't be a privilege — it's a right.",
      productLine: "mce",
      category: "Nutrition",
      categoryId: "cat-nutrition",
      resourceType: "guide",
      tags: ["nutrition", "food access", "community", "budget"],
      iconName: "apple",
      sortOrder: 10,
    },
    {
      title: "Sleep Wellness",
      description: "Understanding the importance of quality sleep and building healthy sleep habits.",
      content: "Quality sleep is essential for mental and physical health. This resource covers: why sleep matters for emotional regulation, creating a sleep-friendly environment, managing screen time before bed, dealing with insomnia and sleep anxiety, the relationship between stress and sleep quality, and when to seek help for sleep issues. Good sleep habits can dramatically improve your overall wellness score.",
      productLine: "mental-wellness",
      category: "Sleep Health",
      categoryId: "cat-sleep-health",
      resourceType: "article",
      tags: ["sleep", "wellness", "habits", "rest"],
      iconName: "moon",
      sortOrder: 11,
    },
    {
      title: "Physical Activity for Whole-Body Wellness",
      description: "Moving your body as medicine — accessible fitness approaches for all levels.",
      content: "Physical activity is one of the most powerful tools for both physical and mental health. This guide offers: walking programs that fit into any schedule, strength training basics without a gym, yoga and stretching for stress relief, community sports and group activities, adapting exercise for different ability levels, and connecting movement to cultural practices like dance. Even 15 minutes of daily movement can make a significant difference.",
      productLine: "mce",
      category: "Physical Activity",
      categoryId: "cat-physical-activity",
      resourceType: "guide",
      tags: ["exercise", "fitness", "movement", "activity"],
      iconName: "dumbbell",
      sortOrder: 12,
    },
  ]);
  }
}
