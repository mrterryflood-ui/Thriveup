import { interventionPlaybooks } from "@shared/schema";

export async function seedPlaybooks(db: any): Promise<void> {
  console.log("[Seed Playbooks] Seeding intervention playbooks...");

  const playbooks = [
    {
      name: "Re-Engage Nudge",
      triggerClass: "engagement_drift",
      flagLevel: "watch",
      objective:
        "Re-engage student showing early signs of disengagement through encouraging AI check-in and advisor activity review.",
      scripts: [
        {
          role: "spark_ai",
          type: "check_in",
          message:
            "Hey! I noticed you haven't been around as much lately. Everything okay? Your learning journey matters, and I want to make sure you have what you need to keep going strong.",
        },
        {
          role: "advisor",
          type: "activity_review",
          message:
            "I see your activity has slowed down recently. Let's look at what's been going on and find ways to get you back on track. What's one thing that would make learning feel easier right now?",
        },
      ],
      resourceOptions: [
        "Spark AI encouraging check-in message",
        "Advisor activity log review",
        "Personalized lesson recommendations based on interests",
        "Flexible scheduling options",
      ],
      thirtyDayTargets: [
        "Complete at least 3 lessons per week for 4 consecutive weeks",
        "Log 2 self-assessment check-ins per week",
        "Respond to at least 1 Spark AI check-in per week",
      ],
      followUpCadence: "biweekly",
      successIndicators: [
        "Lesson completion rate returns to within 80% of baseline",
        "Student responds to check-ins within 48 hours",
        "Self-assessment frequency stabilizes at 2+ per week",
      ],
    },
    {
      name: "Reflection Boost",
      triggerClass: "decision_pattern_risk",
      flagLevel: "watch",
      objective:
        "Improve decision-making quality through additional reflection prompts in CYOA scenarios and scheduled mentor check-in.",
      scripts: [
        {
          role: "system",
          type: "reflection_prompt",
          message:
            "Before you make this choice, take a moment to think: What might happen if you choose this path? What would you tell a friend in this situation?",
        },
        {
          role: "mentor",
          type: "check_in",
          message:
            "I'd love to hear about some decisions you've been making in your scenarios. What's one choice you're proud of, and one you might do differently?",
        },
      ],
      resourceOptions: [
        "Enhanced reflection prompts in CYOA scenarios",
        "Mentor check-in scheduling",
        "Decision reflection journal template",
        "Consequence mapping worksheet",
      ],
      thirtyDayTargets: [
        "Demonstrate deliberate choice-making in 75% of CYOA decisions",
        "Complete 2 mentor check-in sessions",
        "Write 4 decision reflection journal entries",
      ],
      followUpCadence: "biweekly",
      successIndicators: [
        "Impulsive choice ratio drops below 25%",
        "Student engages meaningfully with reflection prompts",
        "Mentor reports positive engagement in check-ins",
      ],
    },
    {
      name: "Community Resource Connection",
      triggerClass: "context_shock",
      flagLevel: "watch",
      objective:
        "Connect student and family with community resources to address emerging environmental stressors.",
      scripts: [
        {
          role: "advisor",
          type: "check_in",
          message:
            "I wanted to check in with you. Sometimes things happening outside of school can affect how we feel and learn. Is there anything going on that I can help with?",
        },
        {
          role: "advisor",
          type: "family_outreach",
          message:
            "We want to share some community resources that might be helpful for your family. These are free services available in your area.",
        },
      ],
      resourceOptions: [
        "GIS resource overlay for family",
        "Community service directory",
        "Advisor supportive check-in",
        "Family resource guide",
      ],
      thirtyDayTargets: [
        "Family accesses at least 1 community resource",
        "Student maintains current engagement levels",
        "Advisor conducts 2 supportive check-ins",
      ],
      followUpCadence: "biweekly",
      successIndicators: [
        "Family confirms receipt and review of resource information",
        "Student engagement metrics remain stable",
        "Context Load Index does not increase further",
      ],
    },
    {
      name: "Structured Re-Entry",
      triggerClass: "engagement_drift",
      flagLevel: "support",
      objective:
        "Provide structured support for re-engagement through advisor sessions, modified timelines, and daily check-ins.",
      scripts: [
        {
          role: "advisor",
          type: "re_entry_session",
          message:
            "Let's work together to create a plan that feels manageable. We can adjust your milestones and build in daily check-ins so you always have support nearby.",
        },
        {
          role: "advisor",
          type: "daily_check_in",
          message:
            "Quick check-in: How are you feeling about today's learning goals? Remember, even small progress counts.",
        },
      ],
      resourceOptions: [
        "Advisor re-entry planning session",
        "Modified milestone timeline",
        "Daily check-in schedule for 2 weeks",
        "Reduced lesson load with gradual increase",
        "Peer buddy assignment",
      ],
      thirtyDayTargets: [
        "Return to 80% of baseline lesson completion rate",
        "Attend all scheduled daily check-ins for 2 weeks",
        "Complete modified milestone plan on schedule",
        "Participate in at least 1 peer collaboration activity",
      ],
      followUpCadence: "daily",
      successIndicators: [
        "Daily check-in attendance rate of 90%+",
        "Lesson completion increases week-over-week for 3 consecutive weeks",
        "Student self-reports increased confidence in learning plan",
        "Thrive Domain A score stabilizes or improves",
      ],
    },
    {
      name: "Decision Workshop",
      triggerClass: "decision_pattern_risk",
      flagLevel: "support",
      objective:
        "Build decision-making skills through structured advisor workshops on consequence mapping and revised CYOA practice.",
      scripts: [
        {
          role: "advisor",
          type: "workshop_session_1",
          message:
            "Today we're going to learn about consequence mapping. For every decision, there are short-term and long-term effects. Let's practice identifying them together.",
        },
        {
          role: "advisor",
          type: "workshop_session_2",
          message:
            "Let's look at some of your recent scenario choices and map out what happened. Then we'll practice making the same decisions with more information.",
        },
        {
          role: "advisor",
          type: "workshop_session_3",
          message:
            "For our final session, you'll work through a new scenario using everything you've learned about consequence mapping. I'll be here to help.",
        },
      ],
      resourceOptions: [
        "3-session consequence mapping workshop curriculum",
        "Revised CYOA scenarios with guided decision points",
        "Decision quality scoring rubric",
        "Peer discussion group on decision-making",
        "Financial literacy supplemental materials",
      ],
      thirtyDayTargets: [
        "Complete all 3 workshop sessions",
        "Show improved decision quality scores in CYOA scenarios",
        "Reduce impulsive choice ratio to below 20%",
        "Write 2 reflection essays on decision-making growth",
      ],
      followUpCadence: "weekly",
      successIndicators: [
        "Workshop attendance and participation is strong",
        "CYOA decision quality improves by 25%+",
        "Pathway revision frequency stabilizes",
        "Student can articulate consequence mapping process",
      ],
    },
    {
      name: "Stability Bridge",
      triggerClass: "context_shock",
      flagLevel: "support",
      objective:
        "Bridge student through environmental instability with counselor referral, increased mentor contact, and family resources.",
      scripts: [
        {
          role: "counselor",
          type: "initial_referral",
          message:
            "I'm here to help you navigate what's going on. Everything you share with me is confidential. Let's talk about what support would be most helpful right now.",
        },
        {
          role: "mentor",
          type: "weekly_session",
          message:
            "I'm going to be checking in with you every week now. Think of me as an extra person in your corner. What's on your mind this week?",
        },
      ],
      resourceOptions: [
        "School counselor referral",
        "Weekly mentor sessions (upgraded from biweekly)",
        "Family resource packet with local services",
        "Emergency contact information",
        "Academic flexibility plan",
      ],
      thirtyDayTargets: [
        "Student connects with counselor within 1 week",
        "Attend all weekly mentor sessions",
        "Family reviews and utilizes resource packet",
        "Thrive scores stabilize (no further decline)",
      ],
      followUpCadence: "weekly",
      successIndicators: [
        "Counselor confirms ongoing engagement",
        "Mentor reports stable or improving well-being",
        "Family accesses 2+ community resources",
        "Domain E and F scores show stabilization trend",
      ],
    },
    {
      name: "Full Navigation Plan",
      triggerClass: "engagement_drift",
      flagLevel: "stabilize",
      objective:
        "Coordinate comprehensive re-engagement through team meetings, daily advisor touchpoints, and parent conference.",
      scripts: [
        {
          role: "advisor",
          type: "team_meeting",
          message:
            "We've assembled your support team because we believe in you and want to make sure you have everything you need. Let's create a plan together.",
        },
        {
          role: "advisor",
          type: "daily_touchpoint",
          message:
            "Good morning! Here's your plan for today. Remember, I'm just a message away if you need anything.",
        },
        {
          role: "advisor",
          type: "parent_conference",
          message:
            "Thank you for joining us. We want to share our observations and work together to support your child's learning journey.",
        },
      ],
      resourceOptions: [
        "Coordinated team meeting (advisor, mentor, counselor)",
        "Daily advisor touchpoints",
        "Parent/guardian conference",
        "Modified academic expectations",
        "Alternative learning pathways",
        "Attendance support plan",
      ],
      thirtyDayTargets: [
        "Re-engage with at least 1 lesson daily",
        "Attend all daily advisor touchpoints",
        "Complete the co-created re-entry plan",
        "Parent/guardian attends conference and follow-up",
      ],
      followUpCadence: "daily",
      successIndicators: [
        "Daily touchpoint attendance is 95%+",
        "Lesson engagement resumes within 1 week",
        "Parent/guardian is engaged in support plan",
        "Thrive composite score shows upward trajectory",
        "Student expresses renewed sense of belonging",
      ],
    },
    {
      name: "Guided Recovery",
      triggerClass: "decision_pattern_risk",
      flagLevel: "stabilize",
      objective:
        "Provide intensive support for decision-making recovery through dedicated mentor, structured journaling, and weekly reviews.",
      scripts: [
        {
          role: "mentor",
          type: "intensive_pairing",
          message:
            "I'm going to be working closely with you over the next month. Together, we'll build stronger decision-making skills. I believe in your ability to grow.",
        },
        {
          role: "advisor",
          type: "weekly_review",
          message:
            "Let's review your decision journal together. I see some really strong thinking here. Let's talk about areas where you can continue to grow.",
        },
      ],
      resourceOptions: [
        "Intensive mentor pairing (3x per week)",
        "Structured decision journaling system",
        "Weekly advisor review sessions",
        "Customized CYOA scenarios with scaffolding",
        "Financial literacy intervention module",
        "Peer mentoring opportunity",
      ],
      thirtyDayTargets: [
        "Complete daily decision journal entries for 30 days",
        "Attend all mentor sessions (3x per week)",
        "Demonstrate measurable improvement in CYOA outcome quality",
        "Complete financial literacy intervention module",
      ],
      followUpCadence: "daily",
      successIndicators: [
        "Decision journal completion rate is 90%+",
        "CYOA decision quality improves by 40%+",
        "Mentor reports consistent engagement and growth",
        "Pathway revisions decrease to 1 or fewer per month",
        "Student demonstrates ability to articulate decision rationale",
      ],
    },
    {
      name: "Wraparound Support",
      triggerClass: "context_shock",
      flagLevel: "stabilize",
      objective:
        "Coordinate multi-agency wraparound support with daily check-ins, crisis resources, and modified academic expectations.",
      scripts: [
        {
          role: "counselor",
          type: "crisis_response",
          message:
            "Your safety and well-being come first. Let's make sure you have the support you need right now, and then we'll figure out the rest together.",
        },
        {
          role: "advisor",
          type: "daily_check_in",
          message:
            "Checking in on you today. How are you doing? Remember, there's no wrong answer. I'm here to help no matter what.",
        },
        {
          role: "coordinator",
          type: "agency_coordination",
          message:
            "We're connecting you with additional support services. You don't have to navigate this alone.",
        },
      ],
      resourceOptions: [
        "Multi-agency coordination meeting",
        "Daily advisor and counselor check-ins",
        "Crisis hotline and emergency resources",
        "Modified academic expectations and timeline",
        "Transportation and basic needs assistance referrals",
        "Family support services coordination",
        "Mental health services referral",
      ],
      thirtyDayTargets: [
        "Active connections with 2+ support agencies",
        "Attend daily check-ins (advisor or counselor)",
        "Thrive scores show stabilization (no further decline)",
        "Family engages with at least 1 support service",
        "Modified academic plan is created and accepted",
      ],
      followUpCadence: "daily",
      successIndicators: [
        "Daily check-in attendance is 90%+",
        "Support agencies confirm active engagement",
        "Context Load Index stabilizes or improves",
        "Domain E and F scores stop declining",
        "Student reports feeling supported and safe",
        "Family confirms access to needed resources",
      ],
    },
  ];

  try {
    for (const playbook of playbooks) {
      await db
        .insert(interventionPlaybooks)
        .values({
          name: playbook.name,
          triggerClass: playbook.triggerClass,
          flagLevel: playbook.flagLevel,
          objective: playbook.objective,
          scripts: playbook.scripts,
          resourceOptions: playbook.resourceOptions,
          thirtyDayTargets: playbook.thirtyDayTargets,
          followUpCadence: playbook.followUpCadence,
          successIndicators: playbook.successIndicators,
          isActive: true,
        })
        .onConflictDoNothing();
    }

    console.log(
      `[Seed Playbooks] Successfully seeded ${playbooks.length} intervention playbooks`
    );
  } catch (error) {
    console.error("[Seed Playbooks] Error seeding playbooks:", error);
    throw error;
  }
}
