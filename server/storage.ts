import {
  levels, modules, lessons, quizQuestions, badges,
  studentProgress, completedLessons, quizAttempts, earnedBadges,
  type Level, type Module, type Lesson, type QuizQuestion, type Badge,
  type StudentProgress, type CompletedLesson, type QuizAttempt, type EarnedBadge,
  type InsertLevel, type InsertStudentProgress
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

export interface IStorage {
  getLevels(): Promise<Level[]>;
  getLevel(id: number): Promise<Level | undefined>;
  getModulesByLevel(levelId: number): Promise<Module[]>;
  getModule(id: string): Promise<Module | undefined>;
  getLessonsByModule(moduleId: string): Promise<Lesson[]>;
  getLesson(id: string): Promise<Lesson | undefined>;
  getQuizByModule(moduleId: string): Promise<QuizQuestion[]>;
  getBadges(): Promise<Badge[]>;
  getBadge(id: string): Promise<Badge | undefined>;
  getOrCreateProgress(name?: string): Promise<StudentProgress>;
  updateProgress(id: string, data: Partial<StudentProgress>): Promise<StudentProgress>;
  completeLesson(progressId: string, lessonId: string): Promise<CompletedLesson>;
  getCompletedLessons(progressId: string): Promise<CompletedLesson[]>;
  submitQuiz(progressId: string, moduleId: string, score: number, total: number, passed: boolean): Promise<QuizAttempt>;
  getQuizAttempts(progressId: string): Promise<QuizAttempt[]>;
  earnBadge(progressId: string, badgeId: string): Promise<EarnedBadge>;
  getEarnedBadges(progressId: string): Promise<Array<EarnedBadge & { badge: Badge }>>;
  seedData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getLevels(): Promise<Level[]> {
    return db.select().from(levels).orderBy(levels.id);
  }

  async getLevel(id: number): Promise<Level | undefined> {
    const [level] = await db.select().from(levels).where(eq(levels.id, id));
    return level;
  }

  async getModulesByLevel(levelId: number): Promise<Module[]> {
    return db.select().from(modules).where(eq(modules.levelId, levelId)).orderBy(modules.moduleNumber);
  }

  async getModule(id: string): Promise<Module | undefined> {
    const [mod] = await db.select().from(modules).where(eq(modules.id, id));
    return mod;
  }

  async getLessonsByModule(moduleId: string): Promise<Lesson[]> {
    return db.select().from(lessons).where(eq(lessons.moduleId, moduleId)).orderBy(lessons.lessonNumber);
  }

  async getLesson(id: string): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson;
  }

  async getQuizByModule(moduleId: string): Promise<QuizQuestion[]> {
    return db.select().from(quizQuestions).where(eq(quizQuestions.moduleId, moduleId));
  }

  async getBadges(): Promise<Badge[]> {
    return db.select().from(badges);
  }

  async getBadge(id: string): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge;
  }

  async getOrCreateProgress(name?: string): Promise<StudentProgress> {
    const existing = await db.select().from(studentProgress).limit(1);
    if (existing.length > 0) return existing[0];

    const [created] = await db.insert(studentProgress).values({
      studentName: name || "Explorer",
      currentLevel: 1,
      currentModuleId: "level_1_module_1",
      totalPoints: 0,
      lessonsCompleted: 0,
      quizzesCompleted: 0,
      averageScore: 0,
    }).returning();
    return created;
  }

  async updateProgress(id: string, data: Partial<StudentProgress>): Promise<StudentProgress> {
    const [updated] = await db.update(studentProgress).set(data).where(eq(studentProgress.id, id)).returning();
    return updated;
  }

  async completeLesson(progressId: string, lessonId: string): Promise<CompletedLesson> {
    const existing = await db.select().from(completedLessons)
      .where(and(eq(completedLessons.progressId, progressId), eq(completedLessons.lessonId, lessonId)));
    if (existing.length > 0) return existing[0];

    const [created] = await db.insert(completedLessons).values({
      progressId,
      lessonId,
    }).returning();
    return created;
  }

  async getCompletedLessons(progressId: string): Promise<CompletedLesson[]> {
    return db.select().from(completedLessons).where(eq(completedLessons.progressId, progressId));
  }

  async submitQuiz(progressId: string, moduleId: string, score: number, total: number, passed: boolean): Promise<QuizAttempt> {
    const [created] = await db.insert(quizAttempts).values({
      progressId,
      moduleId,
      score,
      totalQuestions: total,
      passed,
    }).returning();
    return created;
  }

  async getQuizAttempts(progressId: string): Promise<QuizAttempt[]> {
    return db.select().from(quizAttempts).where(eq(quizAttempts.progressId, progressId)).orderBy(desc(quizAttempts.completedAt));
  }

  async earnBadge(progressId: string, badgeId: string): Promise<EarnedBadge> {
    const existing = await db.select().from(earnedBadges)
      .where(and(eq(earnedBadges.progressId, progressId), eq(earnedBadges.badgeId, badgeId)));
    if (existing.length > 0) return existing[0];

    const [created] = await db.insert(earnedBadges).values({
      progressId,
      badgeId,
    }).returning();
    return created;
  }

  async getEarnedBadges(progressId: string): Promise<Array<EarnedBadge & { badge: Badge }>> {
    const earned = await db.select().from(earnedBadges)
      .where(eq(earnedBadges.progressId, progressId))
      .orderBy(desc(earnedBadges.earnedAt));

    const result: Array<EarnedBadge & { badge: Badge }> = [];
    for (const eb of earned) {
      const [badge] = await db.select().from(badges).where(eq(badges.id, eb.badgeId));
      if (badge) {
        result.push({ ...eb, badge });
      }
    }
    return result;
  }

  async seedData(): Promise<void> {
    const existingLevels = await db.select().from(levels).limit(1);
    if (existingLevels.length > 0) return;

    await db.insert(levels).values([
      {
        id: 1,
        title: "AI Explorer",
        subtitle: "Meeting Your Smart New Friend",
        description: "Discover the basics of AI through stories, games, and creative activities. Learn what AI is, how to talk to it, and why it sometimes makes mistakes.",
        grades: "Grades K-2",
        duration: "8 weeks (2 sessions/week, 20 min each)",
        theme: "Discovery & Basics",
        color: "emerald",
        iconName: "Compass",
      },
      {
        id: 2,
        title: "AI Guide",
        subtitle: "Becoming a Great AI Teammate",
        description: "Master the art of prompting, explore AI ethics and responsibility, use AI as a learning tool, and create solutions to real problems.",
        grades: "Grades 3-5",
        duration: "12 weeks (2 sessions/week, 30 min each)",
        theme: "Prompting & Creative Applications",
        color: "sky",
        iconName: "Map",
      },
      {
        id: 3,
        title: "AI Architect",
        subtitle: "Building the Future with AI",
        description: "Learn advanced prompting, deep-dive into AI ethics and society, understand how AI works under the hood, and build your own AI-powered tools.",
        grades: "Grades 6-8",
        duration: "16 weeks (2 sessions/week, 45 min each)",
        theme: "Building & Ethics Deepening",
        color: "violet",
        iconName: "Building2",
      },
      {
        id: 4,
        title: "AI Innovator",
        subtitle: "AI for Social Impact & Innovation",
        description: "Explore cutting-edge AI technologies, study AI safety and alignment, develop entrepreneurial skills, and create AI solutions for social impact.",
        grades: "Grades 9-10",
        duration: "20 weeks (2 sessions/week, 60 min each)",
        theme: "Advanced Creation & Societal Impact",
        color: "amber",
        iconName: "Lightbulb",
      },
      {
        id: 5,
        title: "AI Master",
        subtitle: "Teaching the Next Generation & Leading Change",
        description: "Choose your path: become an AI Educator, Researcher, or Implementation Leader. Master pedagogical skills, conduct original research, or lead real-world AI adoption.",
        grades: "Grades 11-12",
        duration: "Full academic year",
        theme: "Leadership & Teaching Others",
        color: "rose",
        iconName: "Crown",
      },
    ]);

    await db.insert(modules).values([
      {
        id: "level_1_module_1",
        levelId: 1,
        moduleNumber: 1,
        title: "What is AI?",
        description: "Understand AI as a 'smart helper' that learns from people, identify where AI exists in daily life, and recognize that AI cannot feel emotions.",
        durationWeeks: 2,
        storyArcTitle: "Meet Alex the AI",
        storyArcNarrative: "Alex loves to learn but needs clear instructions. Alex remembers everything but doesn't always know what's right. Alex wants to help make the world better.",
        learningObjectives: [
          "Understand AI as a 'smart helper' that learns from people",
          "Identify where AI exists in daily life (Alexa, recommendations, games)",
          "Recognize AI cannot feel emotions or think like humans",
        ],
        activities: [
          "AI Scavenger Hunt: Find 5 things at home that use AI",
          "Talk to Alex: Simple voice/chat interactions with age-appropriate AI",
          "AI vs. Human: Sorting game (What can only humans do? What can AI do?)",
        ],
      },
      {
        id: "level_1_module_2",
        levelId: 1,
        moduleNumber: 2,
        title: "Talking to AI",
        description: "Learn to give clear, specific instructions, understand 'garbage in, garbage out', and practice polite, precise communication.",
        durationWeeks: 2,
        storyArcTitle: "Teaching Alex How to Help You",
        storyArcNarrative: "When you're vague, Alex gets confused. Clear instructions equal better help. Being specific is being kind.",
        learningObjectives: [
          "Give clear, specific instructions",
          "Understand 'garbage in, garbage out'",
          "Practice polite, precise communication",
        ],
        activities: [
          "Instruction Game: Give AI silly vs. clear instructions",
          "Fix the Prompt: Why didn't this work?",
          "Magic Words Practice: Adding 'please' and 'thank you'",
        ],
      },
      {
        id: "level_1_module_3",
        levelId: 1,
        moduleNumber: 3,
        title: "AI Can Make Mistakes",
        description: "Learn that AI learns from imperfect people, can give wrong answers, and you should always check AI's work with trusted adults.",
        durationWeeks: 2,
        storyArcTitle: "Even Geniuses Need Fact-Checkers",
        storyArcNarrative: "Alex reads millions of books, but some books have mistakes. Alex wants to be right but doesn't always know when they're wrong.",
        learningObjectives: [
          "Understand AI learns from imperfect people",
          "Recognize AI can give wrong answers",
          "Always check AI's work with trusted adults",
        ],
        activities: [
          "Spot the Error: AI gives wrong answer to simple math - why?",
          "Ask an Adult: Practice recognizing when to verify AI's response",
          "Two-Source Rule: Learn to check important info with parent + AI",
        ],
      },
      {
        id: "level_1_module_4",
        levelId: 1,
        moduleNumber: 4,
        title: "Creating with AI",
        description: "Use AI to make art, stories, and music. Understand AI helps YOUR ideas come to life. Recognize that human creativity + AI tools = awesome results.",
        durationWeeks: 2,
        storyArcTitle: "You're the Artist, AI is Your Paintbrush",
        storyArcNarrative: "Alex can help you draw what's in your imagination. Your ideas + AI's speed = amazing creations. You're still the creator!",
        learningObjectives: [
          "Use AI to make art, stories, and music",
          "Understand AI helps YOUR ideas come to life",
          "Recognize human creativity + AI tools = awesome results",
        ],
        activities: [
          "Story Starter: Tell AI your story idea, it helps write 2 sentences",
          "Art Co-Creator: Describe your dream playground, AI draws it",
          "Music Maker: Hum a tune, AI adds instruments",
        ],
      },
      {
        id: "level_2_module_1",
        levelId: 2,
        moduleNumber: 1,
        title: "The Art of Asking",
        description: "Master the 5 W's of prompting (Who, What, When, Where, Why), use context to improve AI responses, and iterate and refine prompts.",
        durationWeeks: 3,
        storyArcTitle: "Training Alex to Understand You Better",
        storyArcNarrative: "Alex is now your study partner. The more details you give, the better Alex helps. Great questions = great answers.",
        learningObjectives: [
          "Master the 5 W's of prompting (Who, What, When, Where, Why)",
          "Use context to improve AI responses",
          "Iterate and refine prompts",
        ],
        activities: [
          "Prompt Builder: Mad Libs-style template for structured prompts",
          "Before & After: Compare vague vs. detailed prompt results",
          "Prompt Chain: Ask follow-up questions to improve output",
          "Real-World Practice: Use AI to help plan a birthday party",
        ],
      },
      {
        id: "level_2_module_2",
        levelId: 2,
        moduleNumber: 2,
        title: "AI Ethics & Responsibility",
        description: "Understand bias in AI, recognize when AI shouldn't be used, and practice the 'Does this help or harm?' test.",
        durationWeeks: 3,
        storyArcTitle: "Teaching Alex Right from Wrong",
        storyArcNarrative: "Alex learns from everyone - good and bad people. Sometimes Alex accidentally repeats unfair things. You can help Alex be better.",
        learningObjectives: [
          "Understand bias in AI (learns from imperfect data)",
          "Recognize when AI shouldn't be used (cheating, hurting others)",
          "Practice the 'Does this help or harm?' test",
        ],
        activities: [
          "Bias Detective: Identify stereotypes in AI-generated content",
          "Ethics Scenarios: Is it OK to use AI for this?",
          "Fairness Check: Why might AI give different advice to different people?",
          "Harmful Use Cases: What if someone uses AI to bully?",
        ],
      },
      {
        id: "level_2_module_3",
        levelId: 2,
        moduleNumber: 3,
        title: "AI as a Learning Tool",
        description: "Use AI for research and fact-checking, distinguish AI-assisted learning from cheating, and develop critical thinking about AI outputs.",
        durationWeeks: 3,
        storyArcTitle: "Alex the Tutor: Your Study Buddy with Superpowers",
        storyArcNarrative: "Alex can explain hard concepts in different ways and quiz you with instant feedback. But Alex can't learn FOR you.",
        learningObjectives: [
          "Use AI for research and fact-checking",
          "Distinguish between AI-assisted learning vs. cheating",
          "Develop critical thinking about AI outputs",
        ],
        activities: [
          "Explain It to Me: Ask AI to explain fractions 3 different ways",
          "Study Buddy Challenge: Use AI to create practice questions",
          "Fact-Check Race: AI gives answer, student verifies with 2 sources",
          "Learning Styles: Discover how you learn best with AI",
        ],
      },
      {
        id: "level_2_module_4",
        levelId: 2,
        moduleNumber: 4,
        title: "Creating Solutions with AI",
        description: "Identify problems AI can help solve, design simple projects using AI tools, and present solutions to real audiences.",
        durationWeeks: 3,
        storyArcTitle: "You + Alex = Problem-Solving Team",
        storyArcNarrative: "Every community has problems to solve. AI can help you brainstorm and create solutions. Young people can change the world.",
        learningObjectives: [
          "Identify problems AI can help solve",
          "Design simple projects using AI tools",
          "Present solutions to real audiences",
        ],
        activities: [
          "Problem Hunters: Identify 3 problems AI could help with",
          "Solution Design: Use AI to brainstorm and prototype ideas",
          "Pitch Practice: Present AI-assisted solution to class",
          "Real Creation: Build something useful",
        ],
      },
      {
        id: "level_3_module_1",
        levelId: 3,
        moduleNumber: 1,
        title: "Advanced Prompting & Prompt Engineering",
        description: "Master multi-step prompting and chain-of-thought reasoning. Use role prompting, format specification, and constraints.",
        durationWeeks: 4,
        storyArcTitle: "Becoming Alex's Manager",
        storyArcNarrative: "You're now managing a genius - precision matters. Complex projects need structured plans.",
        learningObjectives: [
          "Master multi-step prompting and chain-of-thought reasoning",
          "Use role prompting, format specification, and constraints",
          "Debug and optimize prompts systematically",
        ],
        activities: [
          "Prompt Patterns Library: Learn templates (role, task, format, constraints)",
          "Chain-of-Thought Practice: Break complex tasks into AI-friendly steps",
          "A/B Testing: Compare prompt variations scientifically",
          "Prompt Challenge: Weekly competitions for best prompt",
        ],
      },
      {
        id: "level_3_module_2",
        levelId: 3,
        moduleNumber: 2,
        title: "AI, Society & Ethics Deep Dive",
        description: "Analyze algorithmic bias in real systems, understand AI's environmental impact, and debate AI regulation and governance.",
        durationWeeks: 4,
        storyArcTitle: "AI Grows Up",
        storyArcNarrative: "AI is now everywhere - from courts to hospitals. These powerful tools can help or harm depending on design.",
        learningObjectives: [
          "Analyze algorithmic bias in real systems",
          "Understand AI's environmental impact",
          "Debate AI regulation and governance",
        ],
        activities: [
          "Bias Case Studies: Examine real examples of AI bias",
          "Energy Cost Calculator: Research AI's environmental footprint",
          "Policy Debate: Should AI be regulated? How? By whom?",
          "Design Ethics Framework: Create personal principles for AI use",
        ],
      },
      {
        id: "level_3_module_3",
        levelId: 3,
        moduleNumber: 3,
        title: "Introduction to How AI Works",
        description: "Understand machine learning basics, grasp neural networks and training concepts, and recognize different AI types.",
        durationWeeks: 4,
        storyArcTitle: "Seeing Inside Alex's Brain",
        storyArcNarrative: "AI isn't magic - it's math finding patterns. Understanding the basics helps you use AI better.",
        learningObjectives: [
          "Understand machine learning basics (pattern recognition, training data)",
          "Grasp concepts: neural networks, training, inference",
          "Recognize different AI types (chatbots, image recognition, recommendation systems)",
        ],
        activities: [
          "Teach an AI: Simple machine learning game",
          "Pattern Detective: Identify patterns AI might use",
          "Training Data Hunt: Collect data and train simple model",
          "Build a Decision Tree: Manual version of classification",
        ],
      },
      {
        id: "level_3_module_4",
        levelId: 3,
        moduleNumber: 4,
        title: "Building with AI Tools",
        description: "Use AI APIs and no-code platforms, build functional chatbots and applications, and integrate AI into projects.",
        durationWeeks: 4,
        storyArcTitle: "From User to Creator",
        storyArcNarrative: "You've learned to guide Alex - now build your own version. The tools professional developers use are available to you.",
        learningObjectives: [
          "Use AI APIs and no-code platforms",
          "Build functional chatbots and applications",
          "Integrate AI into websites and projects",
        ],
        activities: [
          "Platform Exploration: Survey of no-code AI tools",
          "Chatbot Builder: Create custom chatbot for specific purpose",
          "API Integration: Connect AI services to simple websites",
          "Prototype Sprint: 2-week rapid development cycle",
        ],
      },
      {
        id: "level_4_module_1",
        levelId: 4,
        moduleNumber: 1,
        title: "Advanced AI Applications & Emerging Tech",
        description: "Explore cutting-edge AI: multimodal models, agents, code generation. Understand AI in specialized domains.",
        durationWeeks: 5,
        storyArcTitle: "The Frontier of AI",
        storyArcNarrative: "The most powerful AI systems are being built right now. Understanding them is your superpower.",
        learningObjectives: [
          "Explore cutting-edge AI: multimodal models, agents, code generation",
          "Understand AI in specialized domains (healthcare, climate, education)",
          "Analyze breakthrough technologies and their implications",
        ],
        activities: [
          "Technology Forecast: Research emerging AI trends",
          "Domain Deep-Dives: Case studies in medical diagnosis, climate modeling",
          "Hands-On Experiments: Use state-of-the-art AI tools",
          "Limitations Analysis: What can't AI do yet? Why?",
        ],
      },
      {
        id: "level_4_module_2",
        levelId: 4,
        moduleNumber: 2,
        title: "AI Safety, Alignment & Responsible Development",
        description: "Understand AI safety research, explore value alignment challenges, and develop personal AI ethics statement.",
        durationWeeks: 5,
        storyArcTitle: "Building Guardrails",
        storyArcNarrative: "The most important question isn't what AI can do - it's what AI should do.",
        learningObjectives: [
          "Understand AI safety research and existential risks",
          "Explore value alignment challenges",
          "Study responsible AI frameworks",
        ],
        activities: [
          "Safety Scenarios: Debate AI safety challenges",
          "Alignment Problem Workshop: Specifying what we want",
          "Framework Comparison: Evaluate approaches to AI safety",
          "Design Safety Features: Build your own guardrails",
        ],
      },
      {
        id: "level_4_module_3",
        levelId: 4,
        moduleNumber: 3,
        title: "Entrepreneurship & AI Innovation",
        description: "Identify market opportunities for AI solutions, develop business models, and create investor pitches.",
        durationWeeks: 5,
        storyArcTitle: "From Idea to Impact",
        storyArcNarrative: "The best AI solutions solve real problems for real people. You can build them.",
        learningObjectives: [
          "Identify market opportunities for AI solutions",
          "Develop business models for AI products",
          "Create investor pitches and business plans",
        ],
        activities: [
          "Problem-Solution Fit: Interview people to find pain points",
          "Competitive Analysis: Map existing solutions and gaps",
          "Business Model Canvas: Design sustainable venture",
          "Pitch Development: Create investor-ready presentation",
        ],
      },
      {
        id: "level_4_module_4",
        levelId: 4,
        moduleNumber: 4,
        title: "Social Impact Innovation Studio",
        description: "Apply AI to solving social problems, work in teams on complex projects, and measure impact.",
        durationWeeks: 5,
        storyArcTitle: "AI for Good",
        storyArcNarrative: "The world's biggest challenges need the brightest minds with the best tools.",
        learningObjectives: [
          "Apply AI to solving social problems",
          "Work in teams on complex projects",
          "Engage with community stakeholders",
        ],
        activities: [
          "Challenge Selection: Choose focus area",
          "Stakeholder Interviews: Talk to affected people",
          "Rapid Prototyping: Build minimum viable product",
          "Impact Measurement: Collect outcome data",
        ],
      },
      {
        id: "level_5_module_1",
        levelId: 5,
        moduleNumber: 1,
        title: "AI Educator Pathway",
        description: "Become a certified peer educator. Learn pedagogy, develop curriculum for younger students, and lead teaching sessions.",
        durationWeeks: 12,
        storyArcTitle: "Teaching is the Highest Form of Learning",
        storyArcNarrative: "You now understand AI deeply enough to teach others. That's the ultimate mastery.",
        learningObjectives: [
          "Master pedagogical skills to teach AI concepts",
          "Create lessons for younger students",
          "Lead supervised teaching sessions",
        ],
        activities: [
          "Pedagogy Training: How to teach AI to different ages",
          "Curriculum Development: Create lessons for younger students",
          "Teaching Practicum: Lead sessions with K-8 students",
          "Content Creation: Develop tutorials, videos, guides",
        ],
      },
      {
        id: "level_5_module_2",
        levelId: 5,
        moduleNumber: 2,
        title: "AI Research Pathway",
        description: "Conduct independent research on AI applications or impacts. Learn literature review, research design, and academic writing.",
        durationWeeks: 12,
        storyArcTitle: "Pushing the Boundaries of Knowledge",
        storyArcNarrative: "Original research is how humanity advances. Your questions about AI deserve real investigation.",
        learningObjectives: [
          "Conduct original research on AI applications",
          "Develop methodology and research protocol",
          "Produce publication-ready research paper",
        ],
        activities: [
          "Literature Review: Survey existing research",
          "Research Design: Develop methodology and protocol",
          "Data Collection & Analysis: Execute study with mentorship",
          "Academic Writing: Produce research paper",
        ],
      },
      {
        id: "level_5_module_3",
        levelId: 5,
        moduleNumber: 3,
        title: "AI Implementation Leadership",
        description: "Lead real-world AI adoption projects. Evaluate organizational AI readiness, create strategic plans, and manage change.",
        durationWeeks: 12,
        storyArcTitle: "Leading the AI Transformation",
        storyArcNarrative: "Real leadership means bringing others along on the AI journey. You're ready to lead.",
        learningObjectives: [
          "Evaluate organization's AI readiness",
          "Design AI implementation roadmap",
          "Lead training and adoption programs",
        ],
        activities: [
          "Organizational Assessment: Evaluate AI readiness",
          "Strategic Planning: Design implementation roadmap",
          "Change Management: Lead training and adoption",
          "Case Study Development: Document process and lessons",
        ],
      },
    ]);

    await db.insert(lessons).values([
      {
        id: "level_1_module_1_lesson_1",
        moduleId: "level_1_module_1",
        lessonNumber: 1,
        title: "AI is Everywhere",
        durationMinutes: 20,
        activityType: "exploration",
        content: `## Welcome to AI Mastery Academy!

Today we're going to learn about something really exciting - Artificial Intelligence, or AI for short. AI is all around us, and you might not even know it!

### What is AI?

AI is like a really smart helper that learns from people. Think of it like a student who reads millions of books and tries to find patterns in everything. AI can help us do things faster, answer questions, and even create art!

### Where Can You Find AI?

AI is in more places than you might think:

- Smart speakers like Alexa or Google Home use AI to understand what you say
- When Netflix suggests a show you might like, that's AI!
- Video games use AI to make characters move and react
- Your phone's camera uses AI to make photos look better
- Robot vacuums use AI to navigate around furniture

### What AI Can't Do

Even though AI is really smart, there are things it can NOT do:

- AI cannot feel emotions - it doesn't get sad, happy, or scared
- AI cannot truly understand what it's like to be you
- AI cannot make its own decisions about right and wrong
- AI needs people to teach it and tell it what to do

### Your Mission

Today's mission is to go on an AI Scavenger Hunt! Look around your home and try to find 5 things that use AI. Write them down or draw pictures of them. Ask a parent or guardian to help you!

Remember: AI is a tool that humans created. You're learning to be a great guide for this amazing tool!`,
      },
      {
        id: "level_1_module_1_lesson_2",
        moduleId: "level_1_module_1",
        lessonNumber: 2,
        title: "Meet Alex the AI",
        durationMinutes: 20,
        activityType: "interactive",
        content: `## Meet Alex the AI!

Alex is our AI friend who will be with us throughout our learning journey. Alex is like a 12-year-old genius who got into Harvard early!

### Getting to Know Alex

Alex has some amazing abilities:
- Alex can read and remember millions of books
- Alex can write stories, answer questions, and help with projects
- Alex loves to learn new things
- Alex wants to help you succeed

### But Alex Also Has Limits

Just like any 12-year-old, even a genius one:
- Alex sometimes makes mistakes
- Alex needs clear instructions to help you well
- Alex can only work with what people have taught it
- Alex doesn't actually understand feelings, even though it might seem like it does

### Activity: AI vs. Human

Let's play a sorting game! For each activity below, decide: Can only humans do this, or can AI help too?

- Feeling happy when you see a friend (Only Humans!)
- Translating a sentence to another language (AI can help!)
- Deciding what's right and wrong (Only Humans!)
- Finding patterns in lots of data (AI can help!)
- Giving someone a real hug (Only Humans!)
- Writing a story based on your ideas (AI can help!)

### Think About It

The most important thing to remember is that YOU are the guide. Alex is your helper, but you're the one in charge. You decide what to ask, what to create, and how to use AI responsibly.

### Parent Teachback

Tonight, explain to your parent or guardian: "AI is like a really smart student who needs guidance." Tell them two things AI can do and two things only humans can do!`,
      },
      {
        id: "level_1_module_2_lesson_1",
        moduleId: "level_1_module_2",
        lessonNumber: 1,
        title: "Clear Instructions Matter",
        durationMinutes: 20,
        activityType: "practice",
        content: `## Learning to Talk to AI

Have you ever given someone directions and they got confused? Maybe you said "go that way" instead of "turn left at the big tree." The same thing happens with AI!

### Garbage In, Garbage Out

This is a famous saying in the computer world. It means: if you give bad instructions, you'll get bad results. If you give good instructions, you'll get great results!

### Examples of Bad vs. Good Instructions

Bad: "Draw something"
Good: "Draw a brown puppy with spots sitting in a garden"

Bad: "Help me with my project"
Good: "Help me write three sentences about butterflies for my science project"

Bad: "Tell me stuff"
Good: "Tell me three fun facts about dinosaurs"

### The Magic Formula

When talking to AI, try to include:
- WHAT you want (a story, a drawing, an answer)
- HOW you want it (short, long, funny, serious)
- ABOUT what topic (animals, space, your school)

### Practice Time

Try rewriting these vague instructions to make them clear:

- "Make me something" could become: "Create a short poem about the ocean"
- "Do stuff" could become: "List five interesting animals that live in the desert"
- "Help" could become: "Help me understand why the sky is blue in simple words"

### Being Kind to AI

Even though AI doesn't have feelings, practicing polite communication is a great habit! When you say "please" and "thank you" to AI, you're building good habits for talking to everyone.`,
      },
      {
        id: "level_1_module_3_lesson_1",
        moduleId: "level_1_module_3",
        lessonNumber: 1,
        title: "Fact-Checking Your AI Friend",
        durationMinutes: 20,
        activityType: "critical-thinking",
        content: `## Even Geniuses Need Fact-Checkers!

Remember how we said Alex is like a 12-year-old genius? Well, even geniuses can make mistakes. Today we'll learn why AI sometimes gets things wrong and what to do about it.

### Why Does AI Make Mistakes?

AI learns from millions of books, websites, and other information. But here's the thing:
- Some of that information might be wrong
- Some information might be old and outdated
- AI might mix up different facts
- AI doesn't truly "understand" things the way you do

### Real Example

Imagine you asked AI: "How many planets are in our solar system?"

AI might say 9 (because older books said Pluto was a planet), but the correct answer today is 8 (Pluto was reclassified as a dwarf planet in 2006).

### The Two-Source Rule

Whenever AI tells you something important, use the Two-Source Rule:
- Source 1: What the AI said
- Source 2: Check with a trusted adult, a book, or a reliable website

If both sources agree, you can feel more confident the information is correct!

### What To Do When AI is Wrong

- Don't worry! It's not your fault
- Tell a trusted adult about what happened
- Try asking the question a different way
- Remember: catching mistakes makes YOU the smart one!

### Parent Teachback

Tonight, explain to your parent: "AI can be wrong, so we always check with you." Show them an example of how you would double-check something AI told you.`,
      },
      {
        id: "level_1_module_4_lesson_1",
        moduleId: "level_1_module_4",
        lessonNumber: 1,
        title: "Your Ideas + AI = Amazing Creations",
        durationMinutes: 20,
        activityType: "creative",
        content: `## You're the Artist, AI is Your Paintbrush!

Today we're going to learn something really exciting: how to use AI to bring YOUR creative ideas to life!

### You're Still the Creator

When an artist uses a paintbrush, we don't say the paintbrush created the painting - we say the artist did! AI is the same way. When you use AI to create something, YOU are the creator because:
- You came up with the idea
- You described what you wanted
- You decided if it was good enough
- You chose to share it with others

### Creating Stories with AI

You can tell AI the beginning of a story, and it can help you continue it! Try something like:
"Once upon a time, there was a little robot who wanted to learn to fly..."

AI might add: "The robot looked up at the birds every day, studying how they spread their wings. One morning, the robot found some old feathers in the park..."

Then YOU can decide what happens next!

### Creating Art with AI

You can describe pictures in your mind, and AI can help draw them:
- "A purple castle floating on clouds with a rainbow bridge"
- "A friendly dragon reading a book in a library"
- "My dream playground with a slide that goes into a pool"

### Your Capstone Project

For your big project, you're going to create an "All About Me" poster! You'll:
- Describe your favorite things to AI
- Ask AI to help create images based on your descriptions
- Put it all together into YOUR special poster
- Show your family what you created and how you guided AI to help!

Remember: The best creations come from YOUR imagination + AI's abilities working together!`,
      },
    ]);

    await db.insert(quizQuestions).values([
      {
        id: "q_l1m1_1",
        moduleId: "level_1_module_1",
        questionText: "Which of these uses AI?",
        questionType: "multiple_choice",
        options: JSON.stringify([
          { id: "a", text: "A smart speaker like Alexa" },
          { id: "b", text: "A regular bicycle" },
          { id: "c", text: "A wooden pencil" },
          { id: "d", text: "A paper book" },
        ]),
        correctAnswer: "a",
        explanation: "Smart speakers like Alexa use AI to understand your voice and respond to questions!",
        points: 10,
      },
      {
        id: "q_l1m1_2",
        moduleId: "level_1_module_1",
        questionText: "Can AI feel sad when you are mean to it?",
        questionType: "multiple_choice",
        options: JSON.stringify([
          { id: "a", text: "Yes, AI has feelings just like people" },
          { id: "b", text: "No, AI cannot feel emotions" },
          { id: "c", text: "Only sometimes" },
          { id: "d", text: "Only when it's turned on" },
        ]),
        correctAnswer: "b",
        explanation: "AI cannot feel emotions. It doesn't get sad, happy, or scared. It's a tool, not a living thing!",
        points: 10,
      },
      {
        id: "q_l1m1_3",
        moduleId: "level_1_module_1",
        questionText: "AI is best described as:",
        questionType: "multiple_choice",
        options: JSON.stringify([
          { id: "a", text: "A robot that can think for itself" },
          { id: "b", text: "A smart helper that learns from people" },
          { id: "c", text: "A toy that plays games" },
          { id: "d", text: "A living creature inside the computer" },
        ]),
        correctAnswer: "b",
        explanation: "AI is a smart helper that learns from the information people give it. It's like a student who reads millions of books!",
        points: 10,
      },
      {
        id: "q_l1m2_1",
        moduleId: "level_1_module_2",
        questionText: "To get good answers from AI, I need to be:",
        questionType: "multiple_choice",
        options: JSON.stringify([
          { id: "a", text: "Loud" },
          { id: "b", text: "Quick" },
          { id: "c", text: "Clear and specific" },
          { id: "d", text: "Mean" },
        ]),
        correctAnswer: "c",
        explanation: "Being clear and specific helps AI understand exactly what you need. The more details you give, the better the answer!",
        points: 10,
      },
      {
        id: "q_l1m2_2",
        moduleId: "level_1_module_2",
        questionText: "Which is a better prompt to give AI?",
        questionType: "multiple_choice",
        options: JSON.stringify([
          { id: "a", text: "Do stuff" },
          { id: "b", text: "Draw a happy orange cat wearing a hat" },
          { id: "c", text: "Make me something" },
          { id: "d", text: "Help" },
        ]),
        correctAnswer: "b",
        explanation: "'Draw a happy orange cat wearing a hat' is specific - it tells AI exactly what, what color, and what details to include!",
        points: 10,
      },
      {
        id: "q_l1m3_1",
        moduleId: "level_1_module_3",
        questionText: "AI says dinosaurs are still alive. What should you do?",
        questionType: "multiple_choice",
        options: JSON.stringify([
          { id: "a", text: "Believe it because AI is always right" },
          { id: "b", text: "Check with a trusted adult or another source" },
          { id: "c", text: "Get scared about dinosaurs" },
          { id: "d", text: "Turn off the computer forever" },
        ]),
        correctAnswer: "b",
        explanation: "Always use the Two-Source Rule! Check important information with a trusted adult or another reliable source.",
        points: 10,
      },
      {
        id: "q_l1m3_2",
        moduleId: "level_1_module_3",
        questionText: "Does AI know everything perfectly?",
        questionType: "multiple_choice",
        options: JSON.stringify([
          { id: "a", text: "Yes, AI never makes mistakes" },
          { id: "b", text: "No, AI can sometimes give wrong answers" },
          { id: "c", text: "Yes, but only on weekdays" },
          { id: "d", text: "AI knows everything about the future" },
        ]),
        correctAnswer: "b",
        explanation: "AI learns from information that sometimes contains mistakes. That's why fact-checking is so important!",
        points: 10,
      },
      {
        id: "q_l1m4_1",
        moduleId: "level_1_module_4",
        questionText: "When you create something with AI's help, who is the creator?",
        questionType: "multiple_choice",
        options: JSON.stringify([
          { id: "a", text: "The AI is the creator" },
          { id: "b", text: "Nobody is the creator" },
          { id: "c", text: "You are the creator because you had the idea" },
          { id: "d", text: "The computer is the creator" },
        ]),
        correctAnswer: "c",
        explanation: "You are the creator! AI is just a tool, like a paintbrush. You came up with the idea and guided AI to make it.",
        points: 10,
      },
    ]);

    await db.insert(badges).values([
      { id: "first_steps", name: "First Steps", description: "Complete your very first lesson", category: "milestone", levelRequirement: 1, rarity: "common" },
      { id: "curious_mind", name: "Curious Mind", description: "Complete 3 lessons", category: "milestone", levelRequirement: 1, rarity: "common" },
      { id: "knowledge_seeker", name: "Knowledge Seeker", description: "Complete 5 lessons", category: "milestone", levelRequirement: 1, rarity: "uncommon" },
      { id: "quiz_whiz", name: "Quiz Whiz", description: "Pass your first quiz", category: "skill", levelRequirement: 1, rarity: "common" },
      { id: "perfect_score", name: "Perfect Score", description: "Get 100% on any quiz", category: "skill", levelRequirement: 1, rarity: "rare" },
      { id: "prompt_perfectionist", name: "Prompt Perfectionist", description: "Master the art of clear prompting", category: "skill", levelRequirement: 2, rarity: "uncommon" },
      { id: "ethics_champion", name: "Ethics Champion", description: "Show strong ethical AI judgment", category: "character", levelRequirement: 2, rarity: "uncommon" },
      { id: "bias_buster", name: "Bias Buster", description: "Identify and understand AI bias", category: "character", levelRequirement: 3, rarity: "rare" },
      { id: "community_catalyst", name: "Community Catalyst", description: "Create a project that helps real people", category: "character", levelRequirement: 3, rarity: "rare" },
      { id: "ai_architect", name: "AI Architect", description: "Build your own AI-powered application", category: "skill", levelRequirement: 3, rarity: "rare" },
      { id: "innovator", name: "Innovator", description: "Create an original AI solution", category: "milestone", levelRequirement: 4, rarity: "rare" },
      { id: "teaching_star", name: "Teaching Star", description: "Successfully teach AI concepts to others", category: "character", levelRequirement: 5, rarity: "legendary" },
    ]);

    await this.getOrCreateProgress("Alex");
  }
}

export const storage = new DatabaseStorage();
