import { levels, modules, lessons, quizQuestions, badges } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedAILevels(db: any): Promise<void> {
  await db.insert(levels).values([
    {
      id: 1,
      title: "AI Explorer",
      subtitle: "Meeting Your Smart New Friend",
      description: "Discover the basics of AI through stories, games, and creative activities. Learn what AI is, how to talk to it, and why it sometimes makes mistakes.",
      grades: "Grades 3-5",
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
  ]).onConflictDoUpdate({ target: levels.id, set: { title: sql`excluded.title`, subtitle: sql`excluded.subtitle`, description: sql`excluded.description`, grades: sql`excluded.grades`, duration: sql`excluded.duration`, theme: sql`excluded.theme`, color: sql`excluded.color`, iconName: sql`excluded.icon_name` } });

  await db.insert(modules).values([
    {
      id: "level_1_module_1",
      levelId: 1,
      subjectId: null,
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
      subjectId: null,
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
      subjectId: null,
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
      subjectId: null,
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
      subjectId: null,
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
      subjectId: null,
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
      subjectId: null,
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
      subjectId: null,
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
      subjectId: null,
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
      subjectId: null,
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
      subjectId: null,
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
      subjectId: null,
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
      id: "level_3_module_5",
      levelId: 3,
      subjectId: null,
      moduleNumber: 5,
      title: "Vibe Coding & 3D Printing: Foundation First",
      description: "Explore the exciting world of AI-assisted coding ('vibe coding') and 3D printing — but learn why understanding the fundamentals is what makes these tools truly powerful. Without a foundation, you're just pressing buttons.",
      durationWeeks: 4,
      storyArcTitle: "The Builder's Secret: Know Before You Create",
      storyArcNarrative: "Everyone wants to build cool things with AI and 3D printers. But the students who truly succeed are the ones who understand WHY things work, not just HOW to click buttons. Alex learned this lesson too — copying code without understanding it led to bugs nobody could fix. The real builders know the foundation.",
      learningObjectives: [
        "Understand what 'vibe coding' means: using AI tools like Cursor, Replit Agent, and GitHub Copilot to write code through natural language conversations",
        "Learn why coding fundamentals (variables, loops, logic, debugging) are essential BEFORE relying on AI code generation",
        "Explore 3D printing technology: how CAD software, slicing, materials, and printer mechanics work together",
        "Recognize that AI-assisted tools amplify your skills — they don't replace the need to understand what you're building",
        "Practice the 'Foundation First' principle: learn the basics, then use AI to accelerate — not skip — the learning process",
        "Design, iterate, and print a simple 3D object while understanding every step of the process",
      ],
      activities: [
        "Foundation Challenge: Write a simple program by hand (HTML page, calculator, quiz game) — THEN rebuild it using vibe coding with AI. Compare: which version did you understand better? Which could you debug?",
        "Vibe Coding Lab: Use Replit's AI tools to build a small app by describing what you want in plain English. Document every prompt you used and evaluate: did the AI get it right? How did you know?",
        "The Debugging Test: AI generates code with 5 intentional bugs. Can you find and fix them? Students who understand the foundation catch bugs fast. Students who don't... struggle.",
        "3D Print Design Sprint: Learn TinkerCAD basics (shapes, measurements, alignment). Design a custom keychain, phone stand, or school mascot. Understand dimensions, materials, and structural integrity BEFORE hitting print.",
        "From Concept to Object: Walk through the full 3D printing pipeline — CAD design, export to STL, slicing software settings (layer height, infill, supports), material selection (PLA vs ABS), and printer calibration. Print your design and analyze: what would you change?",
        "AI + 3D Printing Mashup: Use AI to generate a 3D model description, then manually refine it in CAD software. Learn that AI gives you a starting point, but YOUR knowledge of geometry, physics, and design makes it actually work.",
        "Reflection Journal: Write about a time you tried to skip the fundamentals and it backfired. How does the 'Foundation First' principle apply to coding, 3D printing, AND real life?",
        "Capstone Presentation: Present your vibe-coded app AND your 3D printed object to the class. Explain what you learned about foundations, what the AI did well, and where YOUR knowledge was the difference-maker.",
      ],
    },
    {
      id: "level_4_module_1",
      levelId: 4,
      subjectId: null,
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
      subjectId: null,
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
      subjectId: null,
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
      subjectId: null,
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
      subjectId: null,
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
      subjectId: null,
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
      subjectId: null,
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
  ]).onConflictDoUpdate({ target: modules.id, set: { levelId: sql`excluded.level_id`, moduleNumber: sql`excluded.module_number`, title: sql`excluded.title`, description: sql`excluded.description`, durationWeeks: sql`excluded.duration_weeks`, storyArcTitle: sql`excluded.story_arc_title`, storyArcNarrative: sql`excluded.story_arc_narrative`, learningObjectives: sql`excluded.learning_objectives`, activities: sql`excluded.activities` } });

  await db.insert(lessons).values([
    {
      id: "level_1_module_1_lesson_1",
      moduleId: "level_1_module_1",
      lessonNumber: 1,
      title: "AI is Everywhere",
      durationMinutes: 20,
      activityType: "exploration",
      content: `## Welcome to ThriveUp Academy!

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
    {
      id: "level_3_module_5_lesson_1",
      moduleId: "level_3_module_5",
      lessonNumber: 1,
      title: "What is Vibe Coding?",
      durationMinutes: 45,
      activityType: "exploration",
      content: `## What is Vibe Coding?

Welcome to the future of coding — but with a warning label attached.

### The Rise of AI-Assisted Coding

"Vibe coding" is a term coined to describe a new way of writing software: instead of typing every line of code yourself, you describe what you want in plain English, and an AI tool writes the code for you. Tools like **Replit Agent**, **Cursor**, and **GitHub Copilot** can generate entire applications from natural language descriptions.

Sounds amazing, right? It IS amazing — but only if you understand what's happening under the hood.

### How These Tools Work

AI coding assistants are trained on millions of lines of code written by human developers. When you give them a prompt like "Build me a quiz app with a score counter," the AI:

1. Analyzes your request and breaks it into coding tasks
2. Generates code based on patterns it learned from existing code
3. Assembles the pieces into a working (hopefully!) application

### The Incredible Part

When you **understand** coding fundamentals — variables, loops, functions, logic, debugging — these tools become superpowers:
- You can evaluate whether the generated code is correct
- You can spot bugs before they become problems
- You can modify and improve what the AI creates
- You can ask better questions because you know the right terminology

### The Dangerous Part

When you **don't** understand the fundamentals:
- You can't tell if the code works correctly or just looks like it does
- You can't fix bugs because you don't understand what the code is doing
- You copy-paste without comprehension, building on a shaky foundation
- You become dependent on a tool instead of developing real skills

### The Foundation First Principle

The best developers in the world use AI tools every day. But they learned the fundamentals FIRST. AI didn't replace their knowledge — it amplified it.

Think of it this way: A calculator is an incredible tool. But if you don't understand multiplication, you won't know when the calculator gives you a wrong answer (and yes, you CAN enter things wrong!).

### Your Challenge

This week, we're going to prove this principle. You'll write code by hand first, then rebuild it with AI assistance. The difference in your understanding will be dramatic — and that's the lesson.`,
    },
    {
      id: "level_3_module_5_lesson_2",
      moduleId: "level_3_module_5",
      lessonNumber: 2,
      title: "The Foundation Test",
      durationMinutes: 45,
      activityType: "interactive",
      content: `## The Foundation Test: Prove It To Yourself

Today is the day you prove — to yourself — why foundations matter.

### The Experiment

We're going to do something simple but powerful:

**Step 1: Build It By Hand**
Write a simple program manually. Choose one:
- An HTML page with a button that counts clicks
- A basic calculator that adds, subtracts, multiplies, and divides
- A quiz game with 5 questions and a score

No AI. No copying. Just you, a text editor, and your brain. It will be slow. It will be frustrating. You might get stuck. That's the point.

**Step 2: Build It With AI**
Now rebuild the same thing using vibe coding. Describe what you want to Replit's AI tools in plain English. Watch as it generates the code in seconds.

**Step 3: Compare**

Ask yourself these questions:
- Which version do you understand better?
- If there's a bug in the AI version, can you find it? Can you fix it?
- Could you explain the AI-generated code to someone else line by line?
- If you needed to change one feature, which version would be easier to modify?

### What You'll Discover

Students who understand the foundation will notice:
- "Oh, the AI used a different approach than I did, but I can see why both work"
- "I found a bug in the AI's code because I knew what the output should be"
- "I can improve the AI's version because I understand the logic"

Students without the foundation will say:
- "It works... I think? I don't know how to check"
- "Something's broken but I have no idea where to look"
- "I need to ask the AI to fix the AI's code" (this is a red flag!)

### The Key Insight

**AI amplifies your existing knowledge. If your foundation is zero, AI amplifies zero.**

A chef who understands flavors, textures, and techniques can use a food processor to work faster. Someone who has never cooked before will just make a mess faster.

### Document Everything

Keep a journal of this experiment:
- What prompts did you give the AI?
- What did the AI get right? What did it get wrong?
- How did your manual coding experience help (or would have helped) you evaluate the AI's output?

This documentation isn't busywork — it's building your meta-skills: the ability to think about your own thinking.`,
    },
    {
      id: "level_3_module_5_lesson_3",
      moduleId: "level_3_module_5",
      lessonNumber: 3,
      title: "3D Printing: From Screen to Reality",
      durationMinutes: 45,
      activityType: "exploration",
      content: `## 3D Printing: From Screen to Reality

Welcome to the world of turning digital designs into physical objects. But first — the foundation.

### How 3D Printers Actually Work

A 3D printer builds objects layer by layer, from the bottom up. The most common type (FDM — Fused Deposition Modeling) works like a very precise hot glue gun:

1. **Filament** (a spool of plastic) feeds into the print head
2. The print head **heats** the filament until it melts
3. The melted plastic is **extruded** through a tiny nozzle
4. The printer moves in precise patterns, laying down one thin layer at a time
5. Each layer cools and hardens before the next one goes on top
6. Hundreds or thousands of layers stack up to form your object

### CAD: Computer-Aided Design

Before you can print anything, you need a digital 3D model. **TinkerCAD** is a free, browser-based CAD tool perfect for beginners:

- Start with basic shapes: cubes, cylinders, spheres, cones
- Combine shapes by grouping them together
- Subtract shapes by making them "holes" (a cylinder hole through a cube = a tube!)
- Precise measurements matter: 1mm off can mean the difference between parts that fit and parts that don't

### Materials Science: Know Your Plastics

Different materials have different properties. The foundation matters here too:

- **PLA (Polylactic Acid)**: Easiest to print with, made from corn starch, biodegradable. Great for models and prototypes. Not heat-resistant (your PLA phone stand will warp in a hot car!)
- **ABS (Acrylonitrile Butadiene Styrene)**: Stronger, heat-resistant, but harder to print. What LEGO bricks are made of. Needs a heated bed and good ventilation.
- **PETG (Polyethylene Terephthalate Glycol)**: A middle ground — stronger than PLA, easier than ABS. Good for functional parts.

### The Slicing Process

Your 3D model (an STL file) can't go directly to the printer. It needs to be "sliced" into layers by software like Cura or PrusaSlicer:

- **Layer height**: Thinner layers = smoother surface but longer print time
- **Infill**: How solid is the inside? 20% infill = mostly hollow (lighter, faster). 100% = completely solid (strongest, slowest)
- **Supports**: Overhanging parts need temporary supports that you remove after printing
- **Print speed**: Faster = rougher quality. Slower = better quality

### The Foundation Lesson

You COULD just download a model from the internet, hit "print," and wait. But:
- What if the dimensions are wrong?
- What if you chose the wrong material for your use case?
- What if the infill is too low and your object breaks?
- What if you don't understand supports and your print fails halfway through?

Understanding the machine, the materials, and the process IS the foundation. The fancy designs come AFTER you understand the fundamentals.

### Your Design Sprint

This week, design a simple object in TinkerCAD:
- A custom keychain, a phone stand, or your school mascot
- Measure twice, design once
- Think about: What material? What infill? Does it need supports?
- Document your design decisions and WHY you made them`,
    },
    {
      id: "level_3_module_5_lesson_4",
      moduleId: "level_3_module_5",
      lessonNumber: 4,
      title: "The Builder's Mindset",
      durationMinutes: 45,
      activityType: "creative",
      content: `## The Builder's Mindset: Capstone

This is the lesson where everything comes together. Vibe coding + 3D printing + the Foundation First principle.

### The Builder's Mindset

The best builders in the world — software developers, engineers, architects, artists — share one thing in common: they understand the fundamentals so deeply that their tools become extensions of their thinking.

- A master carpenter doesn't just know how to use a power saw. They understand wood grain, joinery, structural load, and finishing techniques. The power saw just makes them faster.
- A great chef doesn't just follow recipes. They understand flavor chemistry, heat transfer, and ingredient interactions. Kitchen tools just extend their capabilities.
- A skilled developer doesn't just use AI to generate code. They understand algorithms, data structures, and system design. AI tools just amplify their productivity.

### Your Capstone Project

You're going to combine everything from this module into two deliverables:

**Deliverable 1: Your Vibe-Coded App**
- Choose a problem that matters to you or your community
- Build a solution using AI-assisted coding tools
- BUT: be able to explain every piece of the code
- Document: What prompts did you use? What did the AI get right? Where did you have to intervene because of YOUR knowledge?

**Deliverable 2: Your 3D Printed Object**
- Design something functional — not just decorative
- Walk through the full pipeline: CAD design, STL export, slicing configuration, material selection, printing
- Document: What design decisions did you make? Why those dimensions? Why that material? Why that infill percentage?

### The Presentation

Present both projects to your class. For each, answer:

1. **What did you build and why?**
2. **What foundations did you need to understand?**
3. **How did AI/tools help you?**
4. **Where did YOUR knowledge make the difference?**
5. **What would have gone wrong if you had skipped the fundamentals?**

### The Bigger Picture

This module wasn't about teaching you to be afraid of AI tools or 3D printers. These are incredible technologies that are changing the world.

This module was about teaching you the secret that separates the people who USE these tools effectively from the people who are USED BY them:

**Foundation first. Tools second. Mastery comes from understanding, not from access.**

Everyone has access to AI coding tools. Everyone can buy a 3D printer. But the people who will build the future are the ones who took the time to understand the fundamentals — and then used these powerful tools to amplify what they already knew.

That's the Builder's Mindset. And now it's yours.

### Reflection

In your journal, write your answer to this question:

"Six months from now, AI tools will be even more powerful than they are today. How will the Foundation First principle help you use those future tools — tools that don't even exist yet?"

The answer: because foundations don't expire. Variables, logic, debugging, design thinking, materials science, problem-solving — these fundamentals transfer to EVERY new tool, EVERY new technology, EVERY new challenge.

That's the real superpower.`,
    },
  ]).onConflictDoUpdate({ target: lessons.id, set: { moduleId: sql`excluded.module_id`, title: sql`excluded.title`, content: sql`excluded.content`, lessonNumber: sql`excluded.lesson_number`, durationMinutes: sql`excluded.duration_minutes`, activityType: sql`excluded.activity_type`, activityData: sql`excluded.activity_data` } });

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
  ]).onConflictDoUpdate({ target: quizQuestions.id, set: { moduleId: sql`excluded.module_id`, questionText: sql`excluded.question_text`, questionType: sql`excluded.question_type`, options: sql`excluded.options`, correctAnswer: sql`excluded.correct_answer`, explanation: sql`excluded.explanation`, points: sql`excluded.points` } });

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
  ]).onConflictDoUpdate({ target: badges.id, set: { name: sql`excluded.name`, description: sql`excluded.description`, category: sql`excluded.category`, levelRequirement: sql`excluded.level_requirement`, rarity: sql`excluded.rarity` } });
}
