import { subjects, modules, lessons, quizQuestions, badges } from "@shared/schema";

export async function seedSubjects(db: any): Promise<void> {
  await db.insert(subjects).values([
    { id: "ela_3_5", name: "ELA & Writing", description: "Reading comprehension strategies, paragraph writing, and vocabulary adventures", gradeBand: "3-5", theme: "The Writer's Workshop", color: "rose", iconName: "BookOpen", sortOrder: 1 },
    { id: "ela_6_8", name: "ELA & Literature", description: "Literary analysis, essay writing, persuasive communication, and public speaking", gradeBand: "6-8", theme: "The Literary Guild", color: "rose", iconName: "BookOpen", sortOrder: 2 },
    { id: "ela_9_12", name: "ELA & Rhetoric", description: "Critical analysis, research writing, rhetoric, and advanced literary interpretation", gradeBand: "9-12", theme: "The Scholar's Forum", color: "rose", iconName: "BookOpen", sortOrder: 3 },
    { id: "math_3_5", name: "Math Adventurers", description: "Multiplication, division, fractions, and geometry through problem-solving quests", gradeBand: "3-5", theme: "The Problem-Solving Quest", color: "blue", iconName: "Calculator", sortOrder: 4 },
    { id: "math_6_8", name: "Math Pathfinders", description: "Pre-algebra, ratios, statistics, and mathematical reasoning", gradeBand: "6-8", theme: "The Logic Lab", color: "blue", iconName: "Calculator", sortOrder: 5 },
    { id: "math_9_12", name: "Math Mastery", description: "Algebra, geometry proofs, statistics, and real-world mathematical modeling", gradeBand: "9-12", theme: "The Analytics Studio", color: "blue", iconName: "Calculator", sortOrder: 6 },
    { id: "science_3_5", name: "Science Investigators", description: "Ecosystems, matter and energy, earth science, and the scientific method", gradeBand: "3-5", theme: "The Investigation Station", color: "emerald", iconName: "Microscope", sortOrder: 7 },
    { id: "science_6_8", name: "Science Scholars", description: "Biology, chemistry basics, physics concepts, and experimental design", gradeBand: "6-8", theme: "The Research Center", color: "emerald", iconName: "Microscope", sortOrder: 8 },
    { id: "science_9_12", name: "Science Innovators", description: "Advanced biology, chemistry, physics, and scientific research methodology", gradeBand: "9-12", theme: "The Innovation Lab", color: "emerald", iconName: "Microscope", sortOrder: 9 },
    { id: "social_3_5", name: "History & Geography", description: "American history, world cultures, geography, and civic responsibility", gradeBand: "3-5", theme: "The Time Travelers", color: "amber", iconName: "Globe", sortOrder: 10 },
    { id: "social_6_8", name: "Civics & Culture", description: "Government, economics, world history, and understanding diverse perspectives", gradeBand: "6-8", theme: "The Global Forum", color: "amber", iconName: "Globe", sortOrder: 11 },
    { id: "social_9_12", name: "Society & Government", description: "Political science, economics, sociology, and civic engagement", gradeBand: "9-12", theme: "The Leadership Council", color: "amber", iconName: "Globe", sortOrder: 12 },
    { id: "sel_3_5", name: "Social Skills Builder", description: "Emotional intelligence, conflict resolution, teamwork, and growth mindset", gradeBand: "3-5", theme: "The Teamwork Tower", color: "pink", iconName: "Heart", sortOrder: 13 },
    { id: "sel_6_8", name: "Emotional Intelligence", description: "Self-awareness, stress management, healthy relationships, and identity exploration", gradeBand: "6-8", theme: "The Inner Compass", color: "pink", iconName: "Heart", sortOrder: 14 },
    { id: "sel_9_12", name: "Life Skills & Leadership", description: "Mental health awareness, communication, leadership, and planning for the future", gradeBand: "9-12", theme: "The Leadership Journey", color: "pink", iconName: "Heart", sortOrder: 15 },
    { id: "wellness_3_5", name: "Wellness Warriors", description: "Nutrition science, fitness goals, sleep hygiene, and stress management", gradeBand: "3-5", theme: "The Wellness Quest", color: "teal", iconName: "Salad", sortOrder: 16 },
    { id: "wellness_6_8", name: "Health & Wellness", description: "Adolescent health, mental wellness, digital wellness, and healthy habits", gradeBand: "6-8", theme: "The Wellness Lab", color: "teal", iconName: "Salad", sortOrder: 17 },
    { id: "wellness_9_12", name: "Holistic Health", description: "Comprehensive wellness planning, mental health, nutrition, and lifelong fitness", gradeBand: "9-12", theme: "The Wellness Blueprint", color: "teal", iconName: "Salad", sortOrder: 18 },
    { id: "ai_6_8", name: "AI Foundations", description: "Understanding AI concepts, exploring AI tools, learning to prompt effectively, evaluating AI outputs, and using AI responsibly", gradeBand: "6-8", theme: "The AI Navigator", color: "violet", iconName: "Cpu", sortOrder: 21 },
    { id: "ai_9_12", name: "AI Mastery", description: "Advanced AI principles, real-world AI applications, prompt engineering, critical evaluation of AI outputs, and responsible AI leadership", gradeBand: "9-12", theme: "The AI Command Center", color: "violet", iconName: "Cpu", sortOrder: 22 },
  ]);

  // ============================================================
  // GRADES 3-5 CONTENT
  // ============================================================
  await db.insert(modules).values([
    {
      id: "ela_3_5_module_1", levelId: 2, subjectId: "ela_3_5", moduleNumber: 1,
      title: "Writing Workshop", description: "Craft powerful paragraphs with topic sentences, supporting details, and conclusions.",
      durationWeeks: 4,
      storyArcTitle: "The Author's Studio",
      storyArcNarrative: "Every great author started exactly where you are right now - with ideas in their head and a desire to share them. In the Author's Studio, you'll learn to turn your thoughts into organized, compelling writing that makes people want to keep reading!",
      learningObjectives: ["Write a complete paragraph with a topic sentence", "Use supporting details and examples", "Create descriptive writing using sensory details", "Edit and revise your own work"],
      activities: ["Paragraph building blocks", "Descriptive writing challenge", "Peer review practice", "Personal narrative draft"],
    },
    {
      id: "math_3_5_module_1", levelId: 2, subjectId: "math_3_5", moduleNumber: 1,
      title: "Multiplication & Division", description: "Master multiplication facts, understand division, and solve multi-step word problems.",
      durationWeeks: 4,
      storyArcTitle: "The Multiplication Mission",
      storyArcNarrative: "You've already conquered addition and subtraction. Now it's time for the next level: multiplication and division! These powerful operations let you solve bigger problems faster. You're ready!",
      learningObjectives: ["Memorize multiplication facts through 12", "Understand division as the inverse of multiplication", "Solve multi-step word problems", "Apply math to real-world situations"],
      activities: ["Times table games", "Division story problems", "Real-world math challenges", "Math fact practice"],
    },
    {
      id: "science_3_5_module_1", levelId: 2, subjectId: "science_3_5", moduleNumber: 1,
      title: "Ecosystems & Food Chains", description: "Explore how living things depend on each other and their environments to survive.",
      durationWeeks: 4,
      storyArcTitle: "The Ecosystem Explorers",
      storyArcNarrative: "In nature, everything is connected! The sun feeds the plants, the plants feed the animals, and when animals return to the earth, they feed the plants again. It's a beautiful circle of life. Let's explore how it all fits together.",
      learningObjectives: ["Define ecosystem and identify components", "Trace energy flow through a food chain", "Explain the roles of producers, consumers, and decomposers", "Predict what happens when a food chain is disrupted"],
      activities: ["Build a food chain diagram", "Ecosystem diorama project", "What if? disruption scenarios", "Local ecosystem observation"],
    },
    {
      id: "sel_3_5_module_1", levelId: 2, subjectId: "sel_3_5", moduleNumber: 1,
      title: "Growth Mindset & Resilience", description: "Develop the belief that you can grow through effort, learn from mistakes, and bounce back from setbacks.",
      durationWeeks: 3,
      storyArcTitle: "The Power of Yet",
      storyArcNarrative: "There's a magic word that changes everything: YET. When you think 'I can't do this,' add the word 'yet' and watch what happens: 'I can't do this YET.' That one word means you're on your way. Every expert was once a beginner.",
      learningObjectives: ["Understand the difference between fixed and growth mindset", "Reframe negative self-talk with positive alternatives", "View mistakes as learning opportunities", "Set goals and track progress toward them"],
      activities: ["Fixed vs. growth mindset sorting", "Reframing negative thoughts", "Famous failures who succeeded", "Personal goal-setting workshop"],
    },
    {
      id: "wellness_3_5_module_1", levelId: 2, subjectId: "wellness_3_5", moduleNumber: 1,
      title: "Nutrition Science", description: "Understand food groups, read nutrition labels, and plan balanced meals.",
      durationWeeks: 3,
      storyArcTitle: "The Nutrition Detective",
      storyArcNarrative: "You're now old enough to make smart choices about what you eat! Let's become nutrition detectives who can read food labels, understand what our bodies need, and plan meals that fuel our adventures.",
      learningObjectives: ["Identify the five food groups and their benefits", "Read and understand basic nutrition labels", "Plan a balanced meal", "Understand how food affects energy and mood"],
      activities: ["Food group sorting challenge", "Nutrition label scavenger hunt", "Design your own balanced meal", "Food diary reflection"],
    },
  ]);

  await db.insert(lessons).values([
    {
      id: "sel_3_5_m1_l1", moduleId: "sel_3_5_module_1", lessonNumber: 1,
      title: "The Power of Yet", durationMinutes: 25, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "I can't do math", right: "I can't do math YET" },
          { left: "I'm bad at reading", right: "I'm still learning to read" },
          { left: "I'll never be good at this", right: "I'll get better with practice" },
          { left: "This is too hard", right: "This is challenging and I'm growing" },
          { left: "I made a mistake", right: "I learned something new" },
        ],
        instructions: "Transform fixed mindset thoughts into growth mindset thoughts! Match the negative thought to its positive version.",
      }),
      content: `## The Power of Yet

Have you ever said "I can't do this!" and wanted to give up? Everyone has! But today you're going to learn a secret that changes everything.

### Fixed vs. Growth Mindset

A FIXED mindset says: "I'm either smart or I'm not. If I can't do it, I never will." This mindset makes people give up easily.

A GROWTH mindset says: "My brain can grow and learn new things. If I can't do it now, I can learn!" This mindset helps people keep trying.

### The Magic Word: YET

When you catch yourself saying "I can't," add the word YET:
- "I can't ride a bike" becomes "I can't ride a bike YET"
- "I don't understand fractions" becomes "I don't understand fractions YET"
- "I'm not good at drawing" becomes "I'm not good at drawing YET"

That one word changes everything because it reminds you that you're ON YOUR WAY.

### Your Brain Is Like a Muscle

Scientists have discovered something amazing: your brain GROWS when you learn new things! Every time you struggle with something hard, your brain makes new connections. That means struggling is actually making you SMARTER. The things that feel hardest are growing your brain the most!

### Famous People Who Failed First

- Michael Jordan was cut from his high school basketball team
- Walt Disney was told he "lacked imagination"
- Albert Einstein didn't speak until he was 4 years old
- J.K. Rowling's Harry Potter book was rejected 12 times

Every one of them kept going. And look what happened!

### Your Growth Mindset Pledge

Say this out loud: "I am smart, and I can get smarter. Mistakes help me learn. I will keep trying, even when it's hard. I believe in the power of YET."`,
    },
  ]);

  // ============================================================
  // GRADES 6-8 CONTENT
  // ============================================================
  await db.insert(modules).values([
    {
      id: "ela_6_8_module_1", levelId: 3, subjectId: "ela_6_8", moduleNumber: 1,
      title: "Persuasive Writing & Rhetoric", description: "Craft compelling arguments, analyze rhetoric in media, and develop your authentic voice.",
      durationWeeks: 4,
      storyArcTitle: "The Persuasion Lab",
      storyArcNarrative: "Words have power. The ability to construct a logical argument, appeal to emotions ethically, and present your case clearly is one of the most important skills you'll ever develop. In the Persuasion Lab, you'll learn to use words to change minds - and the world.",
      learningObjectives: ["Construct a thesis statement and supporting arguments", "Identify ethos, pathos, and logos in persuasive texts", "Write a complete persuasive essay", "Analyze media for bias and persuasion techniques"],
      activities: ["Thesis statement workshop", "Analyze advertisements for persuasion", "Persuasive essay draft and revision", "Class debate preparation"],
    },
    {
      id: "math_6_8_module_1", levelId: 3, subjectId: "math_6_8", moduleNumber: 1,
      title: "Pre-Algebra Foundations", description: "Variables, expressions, equations, and the bridge from arithmetic to algebra.",
      durationWeeks: 5,
      storyArcTitle: "The Algebra Gateway",
      storyArcNarrative: "Algebra is the language of patterns and relationships. Instead of just working with specific numbers, you'll learn to work with unknowns - using letters to represent numbers you need to find. This is how mathematicians, scientists, and engineers think.",
      learningObjectives: ["Understand variables and expressions", "Solve one-step and two-step equations", "Graph points on a coordinate plane", "Translate word problems into equations"],
      activities: ["Variable exploration game", "Balance scale equation solver", "Coordinate plane treasure hunt", "Real-world equation writing"],
    },
    {
      id: "sel_6_8_module_1", levelId: 3, subjectId: "sel_6_8", moduleNumber: 1,
      title: "Identity & Self-Awareness", description: "Explore who you are, manage stress, navigate social pressures, and build healthy relationships.",
      durationWeeks: 4,
      storyArcTitle: "The Inner Compass",
      storyArcNarrative: "Middle school is a time of big changes - your body, your friendships, your interests, and your identity are all evolving. It can feel overwhelming sometimes. Your Inner Compass is the part of you that knows who you are and what you value, even when everything around you is changing.",
      learningObjectives: ["Identify personal values and strengths", "Develop healthy stress management strategies", "Navigate peer pressure with confidence", "Build and maintain healthy relationships"],
      activities: ["Values exploration journal", "Stress management toolkit", "Peer pressure scenarios and responses", "Healthy relationship criteria"],
    },
    {
      id: "wellness_6_8_module_1", levelId: 3, subjectId: "wellness_6_8", moduleNumber: 1,
      title: "Digital Wellness & Adolescent Health", description: "Navigate screen time, social media, body changes, and mental health with confidence.",
      durationWeeks: 4,
      storyArcTitle: "The Balanced Life",
      storyArcNarrative: "Your life is getting more complex - school, friends, activities, devices, social media. Learning to balance all of it while taking care of your physical and mental health is an essential skill that even many adults are still working on. You're getting ahead of the game.",
      learningObjectives: ["Evaluate personal screen time habits", "Understand the impact of social media on mental health", "Develop a personal wellness plan", "Know when and how to seek help for mental health"],
      activities: ["Screen time audit", "Social media impact analysis", "Personal wellness plan creation", "Mental health resource mapping"],
    },
  ]);

  await db.insert(lessons).values([
    {
      id: "sel_6_8_m1_l1", moduleId: "sel_6_8_module_1", lessonNumber: 1,
      title: "Who Am I?", durationMinutes: 30, activityType: "emotion_check",
      activityData: JSON.stringify({
        type: "emotion_check",
        emotions: ["Confident", "Uncertain", "Curious", "Anxious", "Hopeful", "Overwhelmed", "Determined", "Confused"],
        prompt: "As you think about who you are and who you're becoming, which word best describes how you feel about it right now?",
        followUp: "Whatever you're feeling is completely normal. Identity exploration is one of the most important journeys you'll ever take.",
      }),
      content: `## Who Am I?

This might be the most important question you'll ever ask yourself. And here's the beautiful thing: the answer is always evolving.

### Identity Is a Journey

Right now, you might feel like you're changing faster than you can keep up with. Your interests might be shifting. Your friendships might be rearranging. You might look in the mirror and see someone different than you expected. All of this is NORMAL.

### The Layers of You

Your identity is made up of many layers:
- Your VALUES: What matters most to you? Honesty? Kindness? Creativity? Justice?
- Your INTERESTS: What makes you lose track of time? What would you do even if nobody was watching?
- Your STRENGTHS: What comes naturally to you? What do others come to you for?
- Your CULTURE: Your family traditions, language, heritage - these are treasures
- Your EXPERIENCES: Everything you've been through has shaped who you are

### It's Okay to Not Have It All Figured Out

Here's a secret that most adults won't tell you: NOBODY has it completely figured out. Adults are still learning about themselves too. You don't have to have all the answers right now.

### Comparing Yourself to Others

Social media makes it easy to compare yourself to others. But remember: you're seeing their highlight reel, not their real life. The only person you need to be better than is who you were yesterday.

### Your Values Compass

When things get confusing (and they will), come back to your values. Ask yourself:
- "Is this choice aligned with what I believe?"
- "Would I be proud of this decision tomorrow?"
- "Am I being true to myself, or trying to be someone else?"

### You Are Enough

Right now, exactly as you are, you are enough. You don't have to earn your worth through grades, popularity, appearance, or achievements. You matter because you exist. Never forget that.`,
    },
    {
      id: "wellness_6_8_m1_l1", moduleId: "wellness_6_8_module_1", lessonNumber: 1,
      title: "Digital Wellness", durationMinutes: 30, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Healthy Digital Habits", "Unhealthy Digital Habits"],
        items: [
          { text: "Taking breaks every 30 minutes", category: "Healthy Digital Habits" },
          { text: "Scrolling for hours before bed", category: "Unhealthy Digital Habits" },
          { text: "Using apps for learning", category: "Healthy Digital Habits" },
          { text: "Comparing yourself to influencers", category: "Unhealthy Digital Habits" },
          { text: "Setting screen time limits", category: "Healthy Digital Habits" },
          { text: "Checking phone first thing when waking up", category: "Unhealthy Digital Habits" },
          { text: "Connecting with friends through video calls", category: "Healthy Digital Habits" },
          { text: "Reading mean comments and dwelling on them", category: "Unhealthy Digital Habits" },
        ],
        instructions: "Sort these digital habits. Which ones support your wellbeing, and which ones might be harmful?",
      }),
      content: `## Digital Wellness

Your phone, tablet, and computer are powerful tools. They connect you to friends, help you learn, and entertain you. But like any powerful tool, they need to be used wisely.

### The Science of Screens

Your brain responds to notifications, likes, and new content with a chemical called dopamine - the same chemical that makes you feel good when you eat your favorite food. Tech companies DESIGN their apps to trigger dopamine hits, keeping you scrolling longer. Understanding this helps you take back control.

### Signs You Might Need a Digital Break

- You feel anxious when you're away from your phone
- You compare yourself negatively to people online
- You stay up late scrolling instead of sleeping
- You feel worse about yourself after using social media
- You have trouble concentrating on homework

### Building Healthy Habits

NO SCREENS BEFORE BED: The blue light from screens tricks your brain into thinking it's daytime. Stop screens 30-60 minutes before bed for better sleep.

THE 20-20-20 RULE: Every 20 minutes, look at something 20 feet away for 20 seconds. This protects your eyes.

CURATE YOUR FEED: Unfollow accounts that make you feel bad. Follow accounts that inspire, educate, or genuinely make you smile.

REAL > VIRTUAL: Prioritize face-to-face time with friends and family. No screen can replace a real conversation or a real hug.

### It's Not About Perfection

You don't have to quit technology - that's not realistic. The goal is BALANCE. Use technology intentionally, not automatically. Be the boss of your devices, not the other way around.

### You're In Control

You have the power to decide how technology fits into YOUR life. That's a skill many adults haven't mastered yet. By learning this now, you're setting yourself up for a healthier, happier life.`,
    },
  ]);

  // ============================================================
  // GRADES 9-12 CONTENT
  // ============================================================
  await db.insert(modules).values([
    {
      id: "ela_9_12_module_1", levelId: 4, subjectId: "ela_9_12", moduleNumber: 1,
      title: "Critical Analysis & Research", description: "Develop advanced analytical skills, craft research papers, and master academic discourse.",
      durationWeeks: 5,
      storyArcTitle: "The Scholar's Forum",
      storyArcNarrative: "At this level, you're not just consuming information - you're evaluating, synthesizing, and creating new knowledge. Critical analysis is the foundation of every professional field, from medicine to law to technology.",
      learningObjectives: ["Analyze texts for rhetorical strategies and bias", "Conduct independent research using credible sources", "Write a properly cited research paper", "Participate in academic discourse and debate"],
      activities: ["Rhetorical analysis essay", "Source evaluation workshop", "Research paper project", "Socratic seminar discussion"],
    },
    {
      id: "sel_9_12_module_1", levelId: 4, subjectId: "sel_9_12", moduleNumber: 1,
      title: "Mental Health & Life Planning", description: "Build mental health awareness, develop life skills, and prepare for the future with confidence.",
      durationWeeks: 5,
      storyArcTitle: "The Leadership Journey",
      storyArcNarrative: "You're approaching a major life transition. The skills you develop now - emotional intelligence, self-advocacy, decision-making, and resilience - will serve you for the rest of your life. This isn't just about school anymore. This is about building the life you want.",
      learningObjectives: ["Recognize signs of mental health challenges in self and others", "Develop comprehensive stress management strategies", "Set meaningful goals and create action plans", "Know when and how to seek professional help"],
      activities: ["Mental health awareness workshop", "Stress management plan", "Goal setting and vision board", "Resource mapping for support"],
    },
    {
      id: "wellness_9_12_module_1", levelId: 4, subjectId: "wellness_9_12", moduleNumber: 1,
      title: "Holistic Wellness Planning", description: "Create a comprehensive personal wellness plan covering physical, mental, social, and financial health.",
      durationWeeks: 4,
      storyArcTitle: "The Wellness Blueprint",
      storyArcNarrative: "As you prepare for greater independence, taking ownership of your total wellbeing becomes essential. A holistic approach to wellness - physical, mental, social, and even financial - gives you the foundation for a fulfilling life.",
      learningObjectives: ["Create a personalized nutrition and fitness plan", "Develop a mental health maintenance routine", "Understand the connection between physical and mental health", "Build healthy habits that last beyond school"],
      activities: ["Personal wellness assessment", "Nutrition and fitness plan design", "Mindfulness practice guide", "Wellness accountability partnership"],
    },
  ]);

  await db.insert(lessons).values([
    {
      id: "sel_9_12_m1_l1", moduleId: "sel_9_12_module_1", lessonNumber: 1,
      title: "Understanding Mental Health", durationMinutes: 35, activityType: "emotion_check",
      activityData: JSON.stringify({
        type: "emotion_check",
        emotions: ["I'm doing well", "I'm managing but it's tough", "I'm struggling more than usual", "I need support", "I'm not sure how I feel"],
        prompt: "Mental health check-in: How are you really doing? This is private and just for you. Be honest with yourself.",
        followUp: "Thank you for being honest. If you selected that you're struggling or need support, please talk to a trusted adult, school counselor, or call/text 988 (Suicide & Crisis Lifeline).",
      }),
      content: `## Understanding Mental Health

Mental health is just as important as physical health. You wouldn't ignore a broken arm, and you shouldn't ignore a struggling mind. Let's have an honest conversation about this.

### What IS Mental Health?

Mental health is about how you think, feel, and handle life. Good mental health doesn't mean being happy all the time - it means having the tools to navigate difficult emotions, relationships, and situations.

### Common Challenges

ANXIETY: Persistent worry that interferes with daily life. Some anxiety is normal (before a test, before a performance). But if worry controls your life, that's a signal to seek help.

DEPRESSION: More than feeling sad. It's a persistent heaviness that can affect your energy, sleep, appetite, concentration, and interest in things you normally enjoy. It's NOT a character flaw - it's a health condition.

STRESS: Your body's response to demands and pressures. Some stress motivates you. Too much stress harms your health and performance.

### Warning Signs to Watch For

In yourself or others:
- Withdrawing from friends and activities you used to enjoy
- Significant changes in sleep or appetite
- Persistent sadness, irritability, or anger
- Difficulty concentrating
- Feelings of hopelessness or worthlessness
- Using substances to cope

### Getting Help Is Strength

Asking for help is one of the BRAVEST things a person can do. Resources available to you:
- School counselor
- Trusted teacher, coach, or family member
- 988 Suicide & Crisis Lifeline (call or text 988)
- Crisis Text Line (text HOME to 741741)
- Your doctor or a therapist

### Taking Care of Your Mental Health Daily

- MOVE your body (exercise is proven to improve mood)
- SLEEP 8-10 hours (seriously, sleep matters)
- CONNECT with people who make you feel good
- LIMIT social media that makes you feel worse
- PRACTICE gratitude (name 3 good things each day)
- BE KIND to yourself (talk to yourself like you'd talk to a friend)

### You Matter

If you take nothing else from this lesson, take this: You matter. Your feelings matter. Your struggles are valid. And there is always someone who wants to help. Never hesitate to reach out.`,
    },
  ]);

  // ============================================================
  // QUIZZES FOR KEY MODULES
  // ============================================================
  await db.insert(quizQuestions).values([
    { id: "q_sel_35_1", moduleId: "sel_3_5_module_1", questionText: "What does having a 'growth mindset' mean?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "Believing you're either smart or you're not" }, { id: "b", text: "Believing you can learn and improve with effort" }, { id: "c", text: "Never making any mistakes" }, { id: "d", text: "Being the smartest in class" }]), correctAnswer: "b", explanation: "A growth mindset means believing that your brain can grow and learn new things through effort and practice. You can always improve!", points: 10 },
    { id: "q_sel_68_1", moduleId: "sel_6_8_module_1", questionText: "When you're struggling with your identity, the best thing to do is:", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "Pretend everything is fine" }, { id: "b", text: "Copy exactly what others are doing" }, { id: "c", text: "Explore your values and be patient with yourself" }, { id: "d", text: "Give up trying to figure it out" }]), correctAnswer: "c", explanation: "Identity exploration is a journey, not a destination. Being patient with yourself and exploring what you truly value is the healthiest approach.", points: 10 },
    { id: "q_sel_912_1", moduleId: "sel_9_12_module_1", questionText: "Asking for help with mental health is:", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "A sign of weakness" }, { id: "b", text: "Something only 'crazy' people do" }, { id: "c", text: "One of the bravest things you can do" }, { id: "d", text: "Not necessary if you're strong" }]), correctAnswer: "c", explanation: "Asking for help takes real courage and strength. Mental health is health, period. Everyone deserves support.", points: 10 },
  ]);

  // ============================================================
  // NEW SUBJECT BADGES
  // ============================================================
  // TEKS §127.15 CTE EMPLOYABILITY SKILLS — WORKFORCE READINESS
  // Aligned to 19 TAC §127.15 (Adopted 2025)
  // ============================================================
  await db.insert(subjects).values([
    { id: "wr_9_12", name: "Workforce Readiness", description: "TEKS §127.15-aligned employability skills: professional conduct, communication, teamwork, workplace safety, rights, and career leadership", gradeBand: "9-12", theme: "The Career Launchpad", color: "violet", iconName: "Briefcase", sortOrder: 19 },
    { id: "wr_6_8", name: "Career Foundations", description: "Introduction to workplace readiness skills: professionalism, teamwork, time management, and career exploration aligned to TEKS CTE standards", gradeBand: "6-8", theme: "The Career Explorer", color: "violet", iconName: "Briefcase", sortOrder: 20 },
  ]);

  await db.insert(modules).values([
    {
      id: "wr_professional_presence", levelId: 4, subjectId: "wr_9_12", moduleNumber: 1,
      title: "Professional Presence", description: "Workplace conduct, dress codes by industry, interview presentation, email and phone professionalism, and first impressions that open doors.",
      durationWeeks: 3,
      storyArcTitle: "Your Professional Brand",
      storyArcNarrative: "Before anyone hears your ideas, they see how you carry yourself. Professional presence is your personal brand — the way you dress, speak, and conduct yourself tells employers who you are before you say a word. In this module, you'll build a professional presence that opens doors in any industry.",
      learningObjectives: [
        "Identify appropriate professional dress codes across industries (office, trades, healthcare, tech)",
        "Demonstrate professional communication in email, phone, and face-to-face interactions",
        "Practice interview presentation skills including body language, eye contact, and tone",
        "Explain workplace behavioral expectations including punctuality, phone use, and social media boundaries",
        "Create a personal professional brand statement",
      ],
      activities: [
        "Industry dress code comparison activity — research 4 industries and present appropriate attire",
        "Professional email writing workshop — draft, peer-review, and revise workplace emails",
        "Mock interview practice with AI-powered feedback on tone, clarity, and professionalism",
        "Workplace scenario role-plays — handle difficult professional situations appropriately",
        "Personal brand builder — create a 30-second professional elevator pitch",
      ],
    },
    {
      id: "wr_workplace_rights", levelId: 4, subjectId: "wr_9_12", moduleNumber: 2,
      title: "Workplace Rights & Responsibilities", description: "Discrimination and harassment awareness, Title VII basics, reporting procedures, bystander responsibilities, and employee rights under federal and Texas law.",
      durationWeeks: 3,
      storyArcTitle: "Know Your Rights, Own Your Career",
      storyArcNarrative: "Every worker has legal protections. Understanding your rights — and your responsibilities — is not optional. This module prepares you to recognize discrimination and harassment, know how to report it, and understand the consequences. You'll also learn what employers owe you and what you owe them.",
      learningObjectives: [
        "Define workplace discrimination and identify its forms (race, gender, age, disability, religion, national origin)",
        "Define workplace harassment including sexual harassment and hostile work environment",
        "Explain employee rights under Title VII, ADA, and ADEA at an introductory level",
        "Describe reporting procedures for discrimination and harassment incidents",
        "Identify bystander responsibilities and intervention strategies",
        "Explain consequences of discrimination and harassment for perpetrators, organizations, and victims",
      ],
      activities: [
        "Case study analysis — read real EEOC cases (anonymized) and identify violations",
        "Scenario identification — is this harassment, discrimination, or neither?",
        "Reporting procedure walkthrough — practice documenting and reporting an incident",
        "Bystander intervention strategies — practice 5 intervention techniques",
        "Know Your Rights quiz — identify protections under federal employment law",
      ],
    },
    {
      id: "wr_workplace_safety", levelId: 4, subjectId: "wr_9_12", moduleNumber: 3,
      title: "Workplace Safety Essentials", description: "OSHA basics, hazard identification, PPE requirements, emergency procedures, safety plans, and the right to a safe work environment.",
      durationWeeks: 3,
      storyArcTitle: "Safety First — Always",
      storyArcNarrative: "No job is worth your health or your life. Workplace safety is not just a rule — it's a right. Whether you work in an office, a warehouse, a restaurant, or a construction site, you need to know how to stay safe, how to identify hazards, and what to do in an emergency. This module gives you that foundation.",
      learningObjectives: [
        "Explain OSHA's role and workers' right to a safe workplace",
        "Identify common workplace hazards across industries (physical, chemical, biological, ergonomic)",
        "Describe PPE requirements and proper use for different work environments",
        "Outline emergency procedures including evacuation, fire safety, and first aid basics",
        "Identify the components of a workplace safety plan",
        "Explain the right to refuse unsafe work and how to report safety violations",
      ],
      activities: [
        "Hazard hunt — identify safety risks in photos of real workplaces across 5 industries",
        "PPE matching game — match correct protective equipment to workplace scenarios",
        "Emergency procedure walkthrough — practice evacuation and emergency response steps",
        "Build a basic safety plan — create a safety checklist for a chosen workplace type",
        "OSHA rights quiz — know your rights as an employee in Texas",
        "Safety incident report — practice documenting a workplace safety concern",
      ],
    },
    {
      id: "wr_time_management", levelId: 4, subjectId: "wr_9_12", moduleNumber: 4,
      title: "Time & Priority Management", description: "Personal productivity systems, calendar skills, deadline management, prioritization frameworks, and group time coordination for the workplace.",
      durationWeeks: 3,
      storyArcTitle: "Master Your Time, Master Your Career",
      storyArcNarrative: "Time is the one resource you can never get back. The difference between people who succeed and people who struggle often comes down to how they manage their time. This module teaches you practical systems for prioritizing tasks, meeting deadlines, and coordinating with teams — skills every employer wants.",
      learningObjectives: [
        "Apply the Eisenhower Matrix (urgent/important) to prioritize tasks",
        "Create and maintain a weekly schedule using digital calendar tools",
        "Set SMART goals and break them into actionable daily tasks",
        "Identify and eliminate common time-wasting behaviors",
        "Coordinate group schedules and manage shared deadlines",
        "Explain how time management connects to work ethic and professional reputation",
      ],
      activities: [
        "Eisenhower Matrix workshop — categorize 20 real workplace tasks by urgency and importance",
        "Weekly planner challenge — build a realistic weekly schedule balancing school, work, and personal time",
        "SMART goal setter — write 3 career-related SMART goals with weekly milestones",
        "Time audit — track time use for 3 days and identify improvement areas",
        "Group project coordination — plan and schedule a team project with shared deadlines",
        "Deadline simulation — manage competing priorities under time pressure",
      ],
    },
    {
      id: "wr_work_ethic_leadership", levelId: 4, subjectId: "wr_9_12", moduleNumber: 5,
      title: "Work Ethic & Career Leadership", description: "Work ethic foundations, punctuality and dependability, meritocracy and equal opportunity, organizational structures, manager vs. leader roles, and building a career through character.",
      durationWeeks: 3,
      storyArcTitle: "Character Builds Careers",
      storyArcNarrative: "Skills get you hired. Character keeps you employed — and gets you promoted. Work ethic is not just about showing up. It's about being dependable, taking initiative, earning trust, and understanding how organizations work. This module teaches the character traits that employers value most and how leadership differs from management.",
      learningObjectives: [
        "Define work ethic and identify its core characteristics: punctuality, dependability, reliability, responsibility",
        "Explain the concepts of meritocracy and equal opportunity in the workplace",
        "Describe organizational structures and how different roles contribute to team success",
        "Compare and contrast the skills and characteristics of managers vs. leaders",
        "Identify how work ethic connects to career advancement and professional reputation",
        "Demonstrate accountability through self-assessment and reflection",
      ],
      activities: [
        "Work ethic self-assessment — rate yourself on 10 key workplace character traits",
        "Dependability tracker — use the attendance system to measure and improve punctuality over 2 weeks",
        "Organizational chart builder — map the structure of a real or simulated company",
        "Manager vs. Leader comparison — analyze case studies of both styles",
        "Meritocracy discussion — examine how effort and results connect to advancement",
        "Career character pledge — write a personal commitment to workplace excellence",
      ],
    },
    {
      id: "wr_career_foundations_teamwork", levelId: 3, subjectId: "wr_6_8", moduleNumber: 1,
      title: "Teamwork & Communication", description: "Group dynamics, conflict resolution, active listening, clear communication, and how teams produce better outcomes than individuals working alone.",
      durationWeeks: 3,
      storyArcTitle: "Better Together",
      storyArcNarrative: "No one succeeds alone. Every career — from healthcare to technology to the trades — depends on people working together. This module teaches you how to be the kind of team member everyone wants on their side.",
      learningObjectives: [
        "Describe the characteristics of effective teams and group dynamics",
        "Practice active listening and clear verbal and written communication",
        "Identify common sources of conflict in teams and apply resolution strategies",
        "Explain how diverse perspectives strengthen team outcomes",
      ],
      activities: [
        "Team challenge — solve a problem in small groups and reflect on group dynamics",
        "Active listening exercise — practice and evaluate listening skills with a partner",
        "Conflict resolution scenarios — role-play workplace disagreements and find solutions",
        "Communication clarity test — give instructions and evaluate how well they were understood",
      ],
    },
    {
      id: "wr_career_foundations_professionalism", levelId: 3, subjectId: "wr_6_8", moduleNumber: 2,
      title: "Introduction to Professionalism", description: "What it means to be professional, basic workplace expectations, respect in diverse environments, and understanding what managers do.",
      durationWeeks: 3,
      storyArcTitle: "Your Future Starts Now",
      storyArcNarrative: "Professionalism is not just for adults in offices. It starts with how you treat people, how you show up, and how you handle responsibility right now. This module introduces the standards that every workplace expects.",
      learningObjectives: [
        "Explain what professionalism means and why it matters in every career",
        "Identify basic workplace expectations including punctuality and responsibility",
        "Demonstrate respect for differences in diverse environments",
        "Describe what managers do and how they support teams",
      ],
      activities: [
        "Professional vs. unprofessional — sort workplace behaviors into categories",
        "Punctuality challenge — track on-time arrivals for one week and reflect",
        "Diversity appreciation activity — interview someone from a different background about their career",
        "Manager shadow report — describe what a manager does in a workplace you've observed",
      ],
    },
  ]);

  // ============================================================
  // AI LITERACY — 5 CONTENT AREAS
  // Aligned to AI Literacy Standards: Understand, Explore, Direct, Evaluate, Responsible Use
  // ============================================================
  await db.insert(modules).values([
    {
      id: "ai_68_understand", levelId: 3, subjectId: "ai_6_8", moduleNumber: 1,
      title: "Understand AI Principles", description: "Understanding AI's core concepts, capabilities, and limitations — the foundation for everything else. Students learn what AI actually is, how machine learning works at a conceptual level, and why AI can do remarkable things but also makes serious mistakes.",
      durationWeeks: 3,
      storyArcTitle: "What's Behind the Curtain",
      storyArcNarrative: "AI is everywhere — recommending your next video, filtering your photos, finishing your sentences. But what IS it? Most people use AI every day without understanding what it can and cannot do. That's like driving a car without knowing it needs brakes. In this module, you'll pull back the curtain and understand the real machine — not the science fiction version.",
      learningObjectives: [
        "Define artificial intelligence and distinguish it from traditional software programs",
        "Explain how machine learning works using the concept of pattern recognition from data",
        "Identify at least 5 AI systems they interact with daily and describe what each one does",
        "Describe the key limitations of AI: no understanding, no common sense, no lived experience",
        "Explain why AI can be confidently wrong (hallucinations) and what causes this",
        "Compare narrow AI (what exists today) vs. general AI (what does not exist yet)",
      ],
      activities: [
        "AI or Not AI? — classify 20 real technologies as AI-powered or traditional software and defend your answers",
        "Pattern recognition simulation — play the role of a machine learning model by finding patterns in datasets of images, text, and numbers",
        "AI in my life audit — document every AI interaction over 48 hours with a structured observation journal",
        "Limitation lab — test an AI assistant with questions requiring common sense, recent events, personal experience, and math to discover failure patterns",
        "AI timeline research project — create an annotated timeline of AI milestones from 1950 to present with significance explanations",
        "Concept map builder — create a visual map connecting AI concepts: data, algorithms, training, inference, output, feedback",
      ],
    },
    {
      id: "ai_68_explore", levelId: 3, subjectId: "ai_6_8", moduleNumber: 2,
      title: "Explore AI Uses", description: "Hands-on exploration of different AI tools and real-world use cases. Students directly interact with AI systems across categories — text, image, code, data — and learn how AI complements rather than replaces human expertise.",
      durationWeeks: 3,
      storyArcTitle: "The AI Toolkit",
      storyArcNarrative: "Knowing what AI is means nothing if you don't know what to DO with it. In this module, you stop being a spectator and become a practitioner. You'll use real AI tools for real tasks — writing, research, creativity, analysis — and learn when AI helps, when it hurts, and when a human does it better.",
      learningObjectives: [
        "Use at least 3 different categories of AI tools (text generation, image generation, data analysis, code assistance)",
        "Identify appropriate use cases for AI in education, healthcare, business, creative work, and community service",
        "Demonstrate how AI complements human expertise rather than replacing it with specific examples",
        "Compare outputs from multiple AI tools on the same task and analyze differences in quality and approach",
        "Explain the concept of AI as a tool amplifier — it makes skilled people more productive but doesn't replace skill",
        "Identify tasks where AI excels (pattern matching, speed, scale) vs. where humans excel (judgment, empathy, creativity, ethics)",
      ],
      activities: [
        "AI tool rotation — spend structured time with ChatGPT, Claude, Gemini, and an image generator completing the same 5 tasks across all tools and comparing results",
        "Career AI use case research — interview (or research) 3 professionals in different fields about how they use AI in their work and present findings",
        "Human + AI challenge — complete a complex project (research report, presentation, creative piece) first without AI, then with AI, and document what changed",
        "AI tool evaluation matrix — rate 5 AI tools across accuracy, usefulness, ease of use, cost, and limitations using a structured rubric",
        "Community use case design — identify a real problem in your school or community and design an AI-assisted solution, explaining exactly what AI does and what humans do",
        "AI capability mapping — create a Venn diagram showing AI strengths, human strengths, and the overlap zone where collaboration is most powerful",
      ],
    },
    {
      id: "ai_68_direct", levelId: 3, subjectId: "ai_6_8", moduleNumber: 3,
      title: "Direct AI Effectively", description: "The art and science of prompt engineering — providing the right context, instructions, and constraints to get useful AI outputs. Students learn that AI quality depends entirely on how you communicate with it.",
      durationWeeks: 3,
      storyArcTitle: "Speak the Language",
      storyArcNarrative: "An AI is only as good as the instructions it receives. Vague input produces vague output. Precise, well-structured prompts produce remarkable results. This is prompt engineering — and it's the single most valuable AI skill anyone can learn. In this module, you become fluent in communicating with AI systems.",
      learningObjectives: [
        "Write clear, specific prompts that consistently produce useful outputs",
        "Apply the CRAFT framework: Context, Role, Action, Format, Tone in every prompt",
        "Use iterative refinement — improve AI outputs through follow-up prompts and feedback",
        "Provide appropriate context including background information, constraints, audience, and purpose",
        "Use role prompting to get domain-specific expertise from AI (e.g., 'You are a science teacher explaining to 8th graders')",
        "Recognize and fix common prompt failures: vague instructions, missing context, wrong format requests",
      ],
      activities: [
        "Prompt autopsy — analyze 10 bad prompts, diagnose why they failed, and rewrite them using the CRAFT framework",
        "Prompt engineering challenge — complete 10 increasingly difficult prompt tasks, scoring outputs on a quality rubric each time",
        "Role prompting workshop — write prompts assigning AI 5 different expert roles and compare how outputs change with each role",
        "Context matters experiment — give AI the same question with zero context, some context, and rich context, then measure quality differences",
        "Iterative refinement lab — start with a basic prompt and improve the output through 5 rounds of refinement, documenting each change and why",
        "Build a personal prompt library — create, test, and document 10 reusable prompts for school tasks (essay outlines, study guides, project brainstorming, research summaries, peer review)",
      ],
    },
    {
      id: "ai_68_evaluate", levelId: 3, subjectId: "ai_6_8", moduleNumber: 4,
      title: "Evaluate AI Outputs", description: "Critical assessment of AI-generated content for accuracy, relevance, bias, and completeness. Students develop systematic methods for fact-checking AI and learn why blind trust in AI output is dangerous.",
      durationWeeks: 3,
      storyArcTitle: "Trust but Verify",
      storyArcNarrative: "AI can write a convincing paragraph about something that never happened. It can cite sources that don't exist. It can present biased information as neutral fact. If you can't tell the difference between good AI output and garbage, you'll make bad decisions based on confident-sounding lies. This module teaches you to be the human quality control that AI desperately needs.",
      learningObjectives: [
        "Apply a systematic 4-step evaluation framework: Accuracy, Relevance, Completeness, Bias (ARCB)",
        "Identify AI hallucinations — fabricated facts, fake citations, invented statistics — and verify claims using reliable sources",
        "Detect bias in AI outputs including cultural bias, recency bias, and training data bias",
        "Assess whether AI output is complete or has significant gaps that change the conclusion",
        "Cross-reference AI-generated information with at least 2 independent reliable sources",
        "Explain why AI confidence level has no correlation with accuracy — AI sounds equally sure whether right or wrong",
      ],
      activities: [
        "Hallucination hunt — give AI 10 factual questions and fact-check every response, documenting what it got right, wrong, and made up",
        "Fake citation detective — ask AI to provide sourced claims on 5 topics, then verify whether each source actually exists and says what AI claims",
        "Bias detection workshop — generate AI responses on 5 controversial or culturally sensitive topics and analyze outputs for cultural, political, and demographic bias",
        "Completeness audit — ask AI to explain 3 complex topics and identify what critical information it left out that would change the reader's understanding",
        "AI vs. expert comparison — compare AI-generated explanations to textbook or expert explanations on the same topic, identifying differences in accuracy and nuance",
        "Build an evaluation checklist — create a personal AI output evaluation rubric with at least 10 criteria, test it on 5 AI outputs, and refine based on results",
      ],
    },
    {
      id: "ai_68_responsible", levelId: 3, subjectId: "ai_6_8", moduleNumber: 5,
      title: "Use AI Responsibly", description: "Ethical, secure, and accountable AI use. Students learn what to never share with AI, how to cite AI-assisted work, understand intellectual property issues, and take personal responsibility for any AI output they use.",
      durationWeeks: 3,
      storyArcTitle: "Power and Responsibility",
      storyArcNarrative: "AI is powerful. Power without responsibility is dangerous. In this module, you learn the ethical framework for using AI — what to share and what to protect, how to give credit, how to think about fairness, and why you are always responsible for whatever AI helps you create. This isn't about fear. It's about being the kind of person who uses powerful tools wisely.",
      learningObjectives: [
        "Identify categories of information that should never be shared with AI systems (personal data, passwords, private health/financial info, others' personal information)",
        "Explain how AI companies may use conversation data for training and why this matters for privacy",
        "Properly cite and disclose AI assistance in academic and professional work",
        "Describe intellectual property concerns with AI-generated content (who owns it? can you copyright it?)",
        "Apply ethical decision-making frameworks to AI use cases (is it fair? is it honest? does it harm anyone?)",
        "Take full accountability for AI-assisted outputs — understanding that 'AI told me' is never an excuse",
      ],
      activities: [
        "Privacy audit — review 10 real scenarios and classify whether sharing that information with AI is safe, risky, or dangerous, explaining your reasoning",
        "Academic integrity workshop — rewrite 5 AI-assisted assignments with proper AI citation and disclosure following school and professional standards",
        "Ethical dilemma discussions — debate 5 real AI ethics cases: deepfakes, AI art vs. human artists, AI in hiring, AI surveillance, AI in healthcare decisions",
        "Terms of service investigation — read and summarize the data usage policies of 3 major AI tools in plain language",
        "Create an AI use policy — draft a responsible AI use policy for your school or club with specific rules, examples, and consequences",
        "Accountability simulation — analyze 3 scenarios where AI produced harmful or incorrect outputs and identify who is responsible and what they should have done differently",
      ],
    },
  ]);

  // AI LITERACY LESSONS — GRADES 6-8 (In-depth content for each module)
  await db.insert(lessons).values([
    {
      id: "ai_68_understand_l1", moduleId: "ai_68_understand", lessonNumber: 1,
      title: "What Is Artificial Intelligence?", durationMinutes: 35, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "Netflix recommendations", right: "AI — learns your preferences from viewing patterns" },
          { left: "Calculator app", right: "Not AI — follows fixed math rules every time" },
          { left: "Spam email filter", right: "AI — learns to recognize spam patterns from millions of examples" },
          { left: "Alarm clock", right: "Not AI — performs the same action at the set time" },
          { left: "Autocomplete on your phone", right: "AI — predicts words based on patterns in billions of texts" },
          { left: "Light switch", right: "Not AI — simple on/off mechanism with no learning" },
        ],
        instructions: "Classify each technology: Is it powered by AI, or is it traditional technology? Match each to its correct explanation.",
      }),
      content: `## What Is Artificial Intelligence?

Let's start with what AI actually is — and clear up what it isn't, because the movies have gotten most of it wrong.

### The Simple Definition

Artificial intelligence is software that can learn from data, find patterns, and make decisions or predictions based on those patterns. That's it. It's not thinking. It's not alive. It's very sophisticated pattern matching at incredible speed.

### How AI Is Different from Regular Software

Your calculator always adds 2 + 2 and gets 4. It follows fixed rules written by a programmer. It will never "learn" or change how it works.

AI is different. Instead of following fixed rules, AI learns patterns from data:
- Show it 10 million photos labeled "cat" and "dog" and it learns to tell them apart
- Feed it billions of sentences and it learns to predict what word comes next
- Give it millions of customer purchases and it learns to recommend what you might want

The key difference: **regular software follows rules humans write. AI discovers its own rules from data.**

### AI You Already Use Every Day

You interact with AI constantly, whether you know it or not:

**YOUR PHONE:** Autocomplete, face unlock, photo organization, voice assistant (Siri/Google Assistant)
**SOCIAL MEDIA:** Content recommendations, ad targeting, content moderation
**ENTERTAINMENT:** Netflix/Spotify recommendations, video game opponents that adapt to your skill level
**SCHOOL:** Spelling/grammar checkers, language translation, search engine results
**HOME:** Smart speakers, robot vacuums that learn your floor plan, smart thermostats

### What AI Cannot Do

This is critical. AI CANNOT:
- **Understand meaning** — it processes patterns in text but doesn't understand what words mean the way you do
- **Use common sense** — ask it "If I put a glass of water upside down on a table, what happens?" and it might give a wrong answer because it doesn't experience the physical world
- **Have experiences or feelings** — it generates text about emotions but has never felt anything
- **Know what's true** — it predicts likely text sequences, not truth. It sounds equally confident whether right or wrong
- **Think about itself** — it has no self-awareness, goals, desires, or consciousness

### Narrow AI vs. General AI

Every AI system that exists today is **narrow AI** — it does one thing well. The AI that beats humans at chess cannot write an email. The AI that generates images cannot drive a car.

**General AI** — a system that can do everything a human can — does not exist. No one knows when or if it will. Don't believe anyone who tells you otherwise.

### Why This Matters For You

Understanding what AI is and isn't is your first line of defense against being fooled by it, misusing it, or fearing it unnecessarily. The students who understand AI will make better decisions than those who don't — in school, in careers, and in life.`,
    },
    {
      id: "ai_68_explore_l1", moduleId: "ai_68_explore", lessonNumber: 1,
      title: "AI Tools in Action — Your First Hands-On Session", durationMinutes: 40, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["AI Does Best", "Human Does Best", "Best Together"],
        items: [
          { text: "Summarize a 50-page document in 30 seconds", category: "AI Does Best" },
          { text: "Decide whether to forgive a friend who hurt your feelings", category: "Human Does Best" },
          { text: "Research a topic and write a report with accurate sources", category: "Best Together" },
          { text: "Translate a paragraph from English to Spanish", category: "AI Does Best" },
          { text: "Comfort someone who is grieving", category: "Human Does Best" },
          { text: "Design a poster for a school event", category: "Best Together" },
          { text: "Check 10,000 photos for a specific face", category: "AI Does Best" },
          { text: "Judge whether a joke is appropriate for the audience", category: "Human Does Best" },
        ],
        instructions: "Sort each task into the correct category: What does AI do best alone? What do humans do best alone? What's best done together?",
      }),
      content: `## AI Tools in Action

It's time to stop reading about AI and start using it. In this lesson, you'll get hands-on with real AI tools and learn when they help, when they don't, and when human + AI together beats either one alone.

### The Five Categories of AI Tools

**1. Text Generation AI** (ChatGPT, Claude, Gemini)
These AI tools generate human-like text. They can write, summarize, explain, translate, brainstorm, and answer questions. They are the most widely used AI tools in the world right now.

**What they're great at:** Drafting text quickly, explaining concepts in different ways, summarizing long documents, brainstorming ideas, translating languages
**What they're bad at:** Guaranteeing accuracy, understanding nuance, making value judgments, citing real sources reliably

**2. Image Generation AI** (DALL-E, Midjourney, Stable Diffusion)
These tools create images from text descriptions. Describe what you want and the AI generates it.

**What they're great at:** Concept visualization, creative exploration, rapid prototyping of visual ideas
**What they're bad at:** Precise details (counting fingers, reading text in images), consistent characters across multiple images, anything requiring factual accuracy

**3. Code Assistance AI** (GitHub Copilot, Replit AI, Cursor)
These tools help write, debug, and explain computer code.

**What they're great at:** Writing common code patterns, explaining what existing code does, finding bugs, converting code between languages
**What they're bad at:** Complex architectural decisions, security-critical code, understanding business requirements

**4. Data Analysis AI**
These tools help analyze spreadsheets, databases, and datasets.

**What they're great at:** Finding patterns in large datasets, creating charts and summaries, cleaning messy data
**What they're bad at:** Understanding what the data means in context, making business decisions, knowing which data matters most

**5. Specialized AI Tools**
Voice transcription (Otter.ai), music generation (Suno), video editing, presentation design, and many more.

### The Human + AI Equation

Here is the most important insight about AI: **AI amplifies skill. It doesn't replace it.**

A student who understands history will use AI to write a better history paper than a student who doesn't. A doctor who understands medicine will use AI to make better diagnoses. A designer who understands design will use AI to create better designs.

AI doesn't make unskilled people skilled. It makes skilled people faster and more productive.

### When NOT to Use AI

- When the assignment is designed to develop YOUR thinking (practice, not products)
- When accuracy is life-or-death (medical, legal, financial decisions without expert review)
- When personal judgment and empathy are required
- When you need to cite specific, verified sources
- When sharing private or sensitive information would be required

### Your Responsibility

Every output AI produces for you is YOUR responsibility. If you submit AI-generated work with errors, those are YOUR errors. If AI writes something offensive and you share it, that's YOUR choice. The human in the loop — that's you — is always accountable.`,
    },
    {
      id: "ai_68_direct_l1", moduleId: "ai_68_direct", lessonNumber: 1,
      title: "The CRAFT Framework — Writing Prompts That Work", durationMinutes: 35, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "Write something about dogs", right: "Vague — AI doesn't know what type of content, for what audience, or what length" },
          { left: "You are a veterinarian. Write a 200-word guide for first-time puppy owners on feeding schedules, written at an 8th grade reading level.", right: "Excellent — has Role, Action, Format, Tone, and Context" },
          { left: "Tell me about the Civil War", right: "Too broad — which civil war? What aspect? What depth? For what purpose?" },
          { left: "You are a history teacher. Create a 5-question quiz about the causes of the American Civil War for 7th graders, including answer explanations.", right: "Excellent — specific role, clear deliverable, defined audience, actionable format" },
          { left: "Make a presentation", right: "Missing everything — topic, audience, length, style, purpose" },
          { left: "Create a 10-slide presentation outline about water conservation for a school assembly, with key talking points and suggested visuals for each slide.", right: "Strong — clear deliverable, topic, audience, format, and useful detail" },
        ],
        instructions: "Match each prompt to its evaluation. Why do some prompts work and others fail?",
      }),
      content: `## The CRAFT Framework — Writing Prompts That Work

The difference between getting useless AI output and getting remarkable AI output is almost always the prompt. This lesson teaches you a framework that works every time.

### Why Prompts Matter

When you talk to another person, they use context clues to understand you — your tone, your body language, your shared history, the situation you're in. AI has NONE of that. It only has the words you type. If your words are vague, the output will be generic. If your words are precise, the output will be specific and useful.

### The CRAFT Framework

**C — Context:** What background information does AI need? What's the situation?
"I'm an 8th grader working on a science fair project about renewable energy."

**R — Role:** What expert should AI act as?
"You are a renewable energy engineer who explains complex topics simply."

**A — Action:** What exactly should AI do?
"Create an outline for my research paper with 5 main sections."

**F — Format:** How should the output look?
"Use headers, bullet points, and keep each section description to 2-3 sentences."

**T — Tone:** What style should the writing have?
"Write in a professional but accessible tone appropriate for a middle school audience."

### Putting CRAFT Together

**Bad prompt:** "Help me with my science project."

**CRAFT prompt:** "I'm an 8th grader (CONTEXT) doing a science fair project on solar energy vs. wind energy. You are a renewable energy engineer who explains complex topics in simple terms (ROLE). Create a project outline with 5 sections: introduction, how solar works, how wind works, comparison, and conclusion (ACTION). Use headers and bullet points with 2-3 sentences per point (FORMAT). Keep the language professional but easy for a middle schooler to understand (TONE)."

The CRAFT prompt will produce output that is 10x more useful than the bad prompt. Every time.

### Iterative Refinement

Your first prompt rarely produces perfect output. That's normal. The key skill is **iterative refinement** — improving through follow-up prompts:

Round 1: Get the initial output
Round 2: "The solar section is too technical. Simplify the explanation of photovoltaic cells."
Round 3: "Add a real-world example of a community that switched to solar power."
Round 4: "The conclusion needs to take a position — which energy source is better for residential use and why?"

Each round gets you closer to exactly what you need. Professional AI users typically go through 3-5 rounds of refinement on important work.

### Common Prompt Failures and Fixes

| Problem | Why It Fails | Fix |
|---------|-------------|-----|
| "Write an essay" | No topic, length, audience, or purpose | Add all four: topic, word count, who it's for, what it should accomplish |
| "Make it better" | AI doesn't know what "better" means to you | Be specific: "Make the introduction more engaging by starting with a surprising statistic" |
| "Tell me everything about X" | Too broad to be useful | Narrow: "Explain the top 3 causes of X and their current impact" |
| Getting the same generic output | No role or context | Add a specific expert role and detailed context |

### The Prompt Library Concept

Professional AI users don't write prompts from scratch every time. They build a **prompt library** — a collection of tested, refined prompts they reuse and adapt. By the end of this module, you'll have your own.`,
    },
    {
      id: "ai_68_evaluate_l1", moduleId: "ai_68_evaluate", lessonNumber: 1,
      title: "The ARCB Framework — Never Trust AI Blindly", durationMinutes: 35, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Likely Accurate", "Needs Verification", "Probably Wrong"],
        items: [
          { text: "AI says water boils at 100°C at sea level", category: "Likely Accurate" },
          { text: "AI provides a specific statistic about your city's population with no source", category: "Needs Verification" },
          { text: "AI cites a research paper by 'Dr. Johnson et al., 2023' that you can't find anywhere", category: "Probably Wrong" },
          { text: "AI explains the basic steps of photosynthesis", category: "Likely Accurate" },
          { text: "AI claims a historical event happened on a specific date that seems unusual", category: "Needs Verification" },
          { text: "AI provides a working phone number for a local business", category: "Probably Wrong" },
          { text: "AI explains how a lever works in physics", category: "Likely Accurate" },
          { text: "AI recommends a specific medication dosage", category: "Probably Wrong" },
        ],
        instructions: "Sort each AI output into the correct trust category. Remember: AI sounds equally confident whether it's right or wrong.",
      }),
      content: `## The ARCB Framework — Never Trust AI Blindly

AI will lie to your face with perfect grammar and complete confidence. That's not a flaw you can fix — it's a fundamental characteristic of how these systems work. Your job is to catch it every time.

### Why AI Gets Things Wrong

AI doesn't "know" things the way you know your own name. It predicts the most likely next word in a sequence based on patterns in its training data. This means:

1. **If the training data was wrong, the AI will be wrong** — confidently
2. **If the question requires recent information, AI may be outdated** — it doesn't browse the internet in real time (unless specifically built to)
3. **If the answer requires reasoning beyond pattern matching, AI may fail** — it can stumble on basic logic problems
4. **If asked about specific facts (dates, numbers, citations), AI may fabricate them** — these are called "hallucinations"

### The ARCB Evaluation Framework

Every time you get output from AI, run it through ARCB:

**A — Accuracy:** Is the information factually correct?
- Check specific claims against reliable sources
- Verify any numbers, dates, or statistics
- Look up any citations — do they actually exist?
- Be especially skeptical of specific details (AI is more reliable on general concepts than specific facts)

**R — Relevance:** Does this actually answer my question?
- AI sometimes gives technically correct but irrelevant information
- Check: Does this address what I actually asked?
- Watch for AI "padding" — adding extra information that sounds impressive but doesn't help

**C — Completeness:** Is anything important missing?
- AI may present a partial picture as the complete story
- Ask yourself: What would an expert add to this?
- Check: Are there important counterarguments or alternative perspectives missing?

**B — Bias:** Is this presentation fair and balanced?
- AI can reflect biases from its training data
- Look for: one-sided presentations, cultural assumptions, stereotypes, missing perspectives
- Check: Would someone from a different background see this differently?

### Red Flags That Demand Verification

These should trigger immediate fact-checking:
- Specific statistics without sources ("Studies show that 73% of...")
- Named citations you haven't verified
- Medical, legal, or financial advice
- Claims about specific people, organizations, or events
- Information that confirms exactly what you wanted to hear (confirmation bias)
- Any claim that would significantly change a decision

### The Two-Source Rule

For any AI-generated information you plan to use in important work:
1. Find at least TWO independent, reliable sources that confirm it
2. If you can't confirm it with two sources, don't use it
3. If two sources contradict the AI, trust the sources

### A Hard Truth

AI sounds equally confident whether it's right or wrong. It doesn't say "I think" or "I'm not sure" unless you specifically prompt it to express uncertainty. This means your gut feeling of "this sounds right" is unreliable. Only verification is reliable.`,
    },
    {
      id: "ai_68_responsible_l1", moduleId: "ai_68_responsible", lessonNumber: 1,
      title: "Privacy, Ethics & Accountability in AI", durationMinutes: 35, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Safe to Share", "Risky — Think Twice", "Never Share"],
        items: [
          { text: "A general question about history for homework", category: "Safe to Share" },
          { text: "Your school essay draft for AI feedback", category: "Safe to Share" },
          { text: "Your home address and phone number", category: "Never Share" },
          { text: "Your friend's personal story without their permission", category: "Never Share" },
          { text: "A photo of yourself", category: "Risky — Think Twice" },
          { text: "Passwords or login credentials", category: "Never Share" },
          { text: "Your opinion on a school topic", category: "Safe to Share" },
          { text: "Private family financial information", category: "Never Share" },
          { text: "Your real name when creating an AI account", category: "Risky — Think Twice" },
        ],
        instructions: "Sort each piece of information into the correct privacy category when using AI tools.",
      }),
      content: `## Privacy, Ethics & Accountability in AI

AI is a power tool. Like any power tool, it can build something amazing or cause serious harm. The difference is the person using it. This lesson is about being the kind of person who uses AI wisely.

### What You Should Never Share with AI

Everything you type into an AI chatbot may be:
- **Stored on company servers** — potentially forever
- **Read by human reviewers** — companies hire people to review conversations for quality
- **Used to train future AI models** — your words might influence how AI responds to millions of other people

**NEVER share with AI:**
- Social Security numbers, passwords, or financial account numbers
- Private medical information (yours or anyone else's)
- Other people's personal information without their explicit consent
- Confidential information from a job or organization
- Anything you wouldn't want posted on a public billboard

**BE CAREFUL sharing:**
- Your full real name (consider using a first name only or pseudonym)
- Photos of yourself or others
- Your exact location or school name
- Personal stories that could identify you or others

### Academic Integrity and AI

Using AI in school raises important honesty questions:

**When AI use is typically OK:**
- Brainstorming ideas (the ideas still need to be yours)
- Getting explanations of concepts you're studying
- Checking grammar and spelling on YOUR writing
- Generating practice quiz questions to study from

**When AI use is typically NOT OK:**
- Having AI write your essay and submitting it as your own
- Using AI to complete assignments designed to develop YOUR skills
- Copying AI output without disclosure or citation
- Using AI on tests or quizzes unless explicitly permitted

**The Golden Rule:** If your teacher would feel deceived by how you used AI, you used it wrong.

### How to Cite AI

When you use AI assistance in your work, cite it. Here's a simple format:
"This section was drafted with assistance from [AI Tool Name], then revised and fact-checked by [Your Name]."

Being transparent about AI use shows integrity. Hiding it shows dishonesty.

### The Accountability Principle

This is the most important concept in responsible AI use:

**You are 100% responsible for anything AI helps you create.**

- If AI writes something inaccurate and you publish it: YOUR mistake
- If AI generates something offensive and you share it: YOUR choice
- If AI gives wrong advice and you follow it without checking: YOUR decision

"AI told me to" is never an acceptable excuse. You are the human in the loop. You have judgment, ethics, and responsibility. AI does not.

### Fairness and AI Bias

AI systems can perpetuate unfairness:
- Image generators that default to certain races or genders for certain professions
- Language models that associate certain groups with certain traits
- Hiring AI that disadvantages candidates from underrepresented backgrounds

Your responsibility: **Notice bias. Name it. Don't amplify it.** If AI generates something biased, don't use it uncritically. Push back, request better, or create your own balanced version.

### Your AI Ethics Code

Write your own personal AI ethics code. Include:
1. What you will and won't share with AI
2. How you will verify AI outputs before using them
3. How you will disclose AI assistance in your work
4. What you will do when you encounter AI bias
5. How you will help others use AI responsibly`,
    },
  ]);

  // ============================================================
  // AI LITERACY — GRADES 9-12 (Advanced Content Areas)
  // ============================================================
  await db.insert(modules).values([
    {
      id: "ai_912_understand", levelId: 4, subjectId: "ai_9_12", moduleNumber: 1,
      title: "Understand AI Principles", description: "Deep understanding of AI architecture, machine learning methodologies, neural network concepts, training data implications, and the real capabilities and limitations of large language models in professional and academic contexts.",
      durationWeeks: 3,
      storyArcTitle: "The Architecture of Intelligence",
      storyArcNarrative: "At this level, 'AI is pattern matching' isn't enough. You need to understand HOW it matches patterns, WHY that creates both power and risk, and WHAT it means for your career, your community, and your future. This module gives you the conceptual depth to make informed decisions about AI in any field you enter.",
      learningObjectives: [
        "Explain the transformer architecture and attention mechanism at a conceptual level",
        "Describe how large language models are trained: pre-training on internet text, fine-tuning with human feedback (RLHF), and alignment techniques",
        "Analyze how training data composition affects model outputs — including bias, knowledge cutoffs, and cultural representation",
        "Compare and evaluate different AI model architectures (GPT, Claude, Gemini, open-source models) by capability, limitations, and appropriate use cases",
        "Explain emergent capabilities — behaviors that appear at scale that weren't explicitly programmed",
        "Assess AI claims critically: distinguish real capabilities from marketing hype using technical understanding",
      ],
      activities: [
        "Architecture deep-dive presentation — research and present how transformers work using visual diagrams, analogies, and real examples",
        "Training data audit — investigate and document what data sources major AI models were trained on and identify potential bias implications",
        "Model comparison report — test GPT-4, Claude, Gemini, and one open-source model on identical tasks and write an analytical comparison of performance, style, and accuracy",
        "AI capability claims analysis — find 5 AI product marketing claims, research the actual technology, and rate each claim's accuracy on a documented scale",
        "Emergent behavior investigation — research and present 3 examples of AI capabilities that emerged unexpectedly at scale with analysis of why",
        "Technical literacy test — demonstrate ability to read and understand AI news articles, research summaries, and technical blog posts by summarizing and critiquing 3 pieces",
      ],
    },
    {
      id: "ai_912_explore", levelId: 4, subjectId: "ai_9_12", moduleNumber: 2,
      title: "Explore AI Uses", description: "Professional-grade exploration of AI applications across industries — healthcare, criminal justice, education, business, government, creative arts — with critical analysis of real-world implementations, outcomes, and failures.",
      durationWeeks: 3,
      storyArcTitle: "AI in the Real World",
      storyArcNarrative: "AI isn't theoretical anymore. It's making bail decisions in courtrooms, diagnosing diseases in hospitals, grading student work in schools, and deciding who gets job interviews. In this module, you explore how AI is actually being used — the successes, the failures, and the ethical minefields. Because understanding real-world AI applications is essential for anyone entering the workforce.",
      learningObjectives: [
        "Analyze AI applications across at least 5 industries with specific examples of both successful and failed implementations",
        "Evaluate the economic impact of AI adoption on workforce displacement and creation with data-supported arguments",
        "Design an AI-assisted workflow for a specific professional context that maintains human oversight and quality control",
        "Assess real-world AI failures (algorithmic bias in criminal justice, healthcare misdiagnosis, content moderation failures) and identify root causes",
        "Create a professional AI use case proposal that includes risk assessment, cost-benefit analysis, and ethical considerations",
        "Demonstrate understanding of AI's role in workforce readiness — what skills become more valuable and what skills become less valuable as AI advances",
      ],
      activities: [
        "Industry AI adoption case study — research a real company's AI implementation, document results (positive and negative), and present findings with data",
        "AI failure forensics — investigate 3 documented AI failures (COMPAS recidivism, Amazon hiring AI, healthcare algorithms), analyze what went wrong, and propose fixes",
        "Workforce impact analysis — research how AI is changing 3 specific career fields you're interested in and write a strategic career adaptation plan",
        "AI workflow design project — design a complete AI-assisted workflow for a real organization (school, nonprofit, small business) with human oversight checkpoints",
        "Cost-benefit analysis — build a realistic cost-benefit model for an AI implementation including hardware, software, training, maintenance, and risk costs",
        "Panel discussion — organize and lead a structured discussion on AI's impact on a specific industry with researched positions on multiple perspectives",
      ],
    },
    {
      id: "ai_912_direct", levelId: 4, subjectId: "ai_9_12", moduleNumber: 3,
      title: "Direct AI Effectively", description: "Advanced prompt engineering including system prompts, chain-of-thought reasoning, few-shot learning, structured outputs, and building AI workflows for professional and academic applications.",
      durationWeeks: 3,
      storyArcTitle: "Engineering Intelligence",
      storyArcNarrative: "At this level, prompting isn't just about getting a good answer — it's about engineering reliable, repeatable AI outputs for professional use. You'll learn advanced techniques used by AI engineers, researchers, and professionals who depend on AI quality in high-stakes work.",
      learningObjectives: [
        "Apply advanced prompt engineering techniques: system prompts, chain-of-thought, few-shot examples, and structured output formats",
        "Design multi-step AI workflows that chain prompts together for complex research, analysis, and content creation tasks",
        "Build and test domain-specific prompt templates for professional use cases (business analysis, research review, content creation, data analysis)",
        "Use AI for metacognition — prompt AI to check its own work, identify weaknesses in its reasoning, and improve its outputs",
        "Implement output formatting controls including JSON, markdown, tables, and structured reports",
        "Evaluate prompt effectiveness using systematic testing with multiple inputs and quality metrics",
      ],
      activities: [
        "Advanced prompt engineering lab — complete 15 progressively difficult prompt challenges using chain-of-thought, few-shot, and system prompt techniques, scoring outputs on precision, accuracy, and usefulness",
        "Professional prompt template library — build a library of 15 tested, documented prompt templates for real academic and career tasks with usage instructions and example outputs",
        "Multi-step workflow builder — design and test a 5-step AI workflow that takes a research question and produces a complete annotated bibliography with summaries and quality ratings",
        "AI self-check experiment — develop prompts that ask AI to critique its own outputs, identify potential errors, and rate its confidence level, then verify whether its self-assessment is accurate",
        "Prompt A/B testing — write two different prompts for the same task, run each 5 times, and statistically analyze which produces better results using a scoring rubric",
        "Domain-specific application — build a complete prompt-based AI tool for a specific use case (study guide generator, interview prep coach, writing feedback system) with documentation",
      ],
    },
    {
      id: "ai_912_evaluate", levelId: 4, subjectId: "ai_9_12", moduleNumber: 4,
      title: "Evaluate AI Outputs", description: "Advanced critical evaluation including systematic fact-checking methodologies, statistical claim verification, source analysis, detecting sophisticated AI-generated misinformation, and building evaluation frameworks for organizational use.",
      durationWeeks: 3,
      storyArcTitle: "The Quality Firewall",
      storyArcNarrative: "At the professional level, AI output evaluation isn't optional — it's a job requirement. Companies lose millions to decisions based on unchecked AI outputs. Researchers lose credibility citing AI hallucinations. Leaders make bad policy from biased AI analysis. You are the quality firewall between AI output and real-world consequences.",
      learningObjectives: [
        "Apply systematic fact-checking methodologies to AI outputs including lateral reading, source triangulation, and claim decomposition",
        "Detect sophisticated AI-generated misinformation including plausible-sounding false statistics, fabricated expert quotes, and invented research findings",
        "Evaluate statistical claims in AI outputs: check sample sizes, methodology descriptions, confidence intervals, and whether conclusions follow from data",
        "Build and deploy an organizational AI output evaluation framework with documented criteria, scoring rubrics, and quality gates",
        "Analyze how AI evaluation requirements differ across domains (journalism, healthcare, legal, academic, business) and adapt methods accordingly",
        "Conduct a comprehensive AI accuracy audit on a specific topic and produce a professional report documenting findings, methodology, and recommendations",
      ],
      activities: [
        "Misinformation detection challenge — review 10 AI-generated paragraphs containing a mix of accurate information and sophisticated fabrications, identify every false claim, and explain how you caught each one",
        "Statistical claim audit — extract 10 statistical claims from AI outputs, verify each using primary sources, and produce an accuracy report with evidence for every finding",
        "Cross-domain evaluation workshop — evaluate the same AI output using evaluation frameworks from journalism (AP standards), healthcare (evidence-based medicine), and academic (peer review) perspectives",
        "Organizational evaluation framework — design, test, and document a complete AI output evaluation framework for a specific organization (school, business, nonprofit) with training materials",
        "Deepfake and AI-generated content detection — analyze 10 pieces of content (text, images, and data) and determine which were AI-generated vs. human-created, documenting your methodology",
        "Comprehensive accuracy audit — choose one topic, generate extensive AI content on it, fact-check everything systematically, and write a professional audit report with findings and recommendations",
      ],
    },
    {
      id: "ai_912_responsible", levelId: 4, subjectId: "ai_9_12", moduleNumber: 5,
      title: "Use AI Responsibly", description: "Professional-grade responsible AI use: data privacy regulations (FERPA, COPPA, HIPAA), intellectual property law, organizational AI governance, algorithmic fairness, environmental impact of AI, and leadership in ethical AI adoption.",
      durationWeeks: 3,
      storyArcTitle: "Leading with Integrity",
      storyArcNarrative: "At this level, responsible AI use isn't just about your personal behavior — it's about leading others. Whether you become a business leader, healthcare worker, educator, engineer, or community advocate, you'll be making decisions about how AI is used in organizations that affect many people. This module prepares you to lead those decisions with integrity.",
      learningObjectives: [
        "Explain key data privacy regulations (FERPA, COPPA, HIPAA) and how they apply to AI use in education, healthcare, and with minors",
        "Analyze intellectual property issues with AI-generated content including copyright, fair use, and ownership under current and emerging law",
        "Design an organizational AI governance policy that addresses privacy, fairness, accountability, transparency, and security",
        "Evaluate algorithmic fairness by identifying and measuring disparate impact across demographic groups in AI systems",
        "Assess the environmental impact of AI (energy consumption, carbon footprint of training large models) and make informed decisions about sustainable AI use",
        "Lead responsible AI adoption conversations using frameworks that balance innovation with protection of vulnerable populations",
      ],
      activities: [
        "Regulatory compliance analysis — research FERPA, COPPA, and HIPAA requirements and evaluate 5 AI tools for compliance, producing a recommendation report",
        "Intellectual property case study — analyze 3 real AI copyright cases (AI-generated art lawsuits, code copyright, AI training data disputes) and present legal analysis with your position",
        "AI governance policy project — write a complete AI governance policy for a real organization (your school, a nonprofit, a small business) with implementation timeline and training plan",
        "Algorithmic fairness audit — test an AI system for demographic bias by analyzing outputs across different identity groups and documenting disparities with statistical evidence",
        "Environmental impact assessment — calculate the estimated carbon footprint of common AI usage patterns and design a sustainable AI use strategy",
        "Ethics leadership simulation — facilitate a structured discussion where stakeholders with competing interests (efficiency vs. fairness, innovation vs. privacy, cost vs. safety) negotiate an AI implementation plan",
      ],
    },
  ]);

  await db.insert(lessons).values([
    {
      id: "ai_912_understand_l1", moduleId: "ai_912_understand", lessonNumber: 1,
      title: "How Large Language Models Actually Work", durationMinutes: 40, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "Tokenization", right: "Breaking text into small pieces (tokens) the model can process" },
          { left: "Embeddings", right: "Converting tokens into numerical vectors that capture meaning relationships" },
          { left: "Attention mechanism", right: "Allowing the model to weigh which parts of the input matter most for each output" },
          { left: "Pre-training", right: "Learning language patterns from billions of text examples" },
          { left: "Fine-tuning (RLHF)", right: "Adjusting the model using human feedback to make outputs more helpful and safe" },
          { left: "Inference", right: "The process of generating an output from a new input prompt" },
          { left: "Hallucination", right: "Generating plausible-sounding but fabricated information" },
          { left: "Context window", right: "The maximum amount of text a model can consider at once" },
        ],
        instructions: "Match each AI concept to its correct definition. These are the building blocks of how modern AI systems work.",
      }),
      content: `## How Large Language Models Actually Work

You use LLMs every day. It's time to understand what's happening under the hood — not to become an AI engineer, but to make better decisions about when to trust them, when to question them, and where they're heading.

### The Core Mechanism: Next Token Prediction

At its foundation, a large language model does one thing: **predict the most likely next word (token) in a sequence.** That's it. Everything you see — essays, code, conversations, creative writing — comes from this single mechanism repeated billions of times.

When you type "The capital of France is ___", the model calculates the probability of every possible next token and picks the most likely one: "Paris." But it's not "looking up" the answer. It's predicting what text is most likely to follow that sequence based on patterns it learned during training.

### Training: How LLMs Learn

**Phase 1: Pre-training**
The model reads billions of pages of text from the internet — books, articles, websites, forums, code repositories. It learns statistical patterns: which words tend to follow which other words, in what contexts. This takes months and millions of dollars in computing power.

**Phase 2: Fine-tuning with Human Feedback (RLHF)**
Raw pre-trained models are not helpful or safe — they just complete text patterns. Fine-tuning uses human evaluators to rate thousands of model outputs. The model is then adjusted to produce outputs humans rated as more helpful, honest, and harmless. This is why ChatGPT gives structured, helpful answers instead of random text completion.

### The Transformer Architecture (Simplified)

The "transformer" is the AI architecture that made modern LLMs possible. Its key innovation is the **attention mechanism** — the ability to look at all parts of the input simultaneously and figure out which parts are most relevant to each other.

Example: In the sentence "The bank by the river was covered in moss," the attention mechanism helps the model understand that "bank" means "riverbank" (not a financial bank) by paying attention to "river" and "moss."

This ability to understand context and relationships across long text sequences is what makes transformers so powerful — and so convincing.

### Why LLMs Hallucinate

Hallucination isn't a bug that will be fixed. It's a fundamental consequence of how these models work:

1. LLMs generate **probable** text, not **true** text. If a false statement is consistent with patterns in the training data, it will be generated.
2. LLMs have no "knowledge base" they check against. They have patterns, probabilities, and statistics — no fact database.
3. LLMs cannot say "I don't know" naturally. They are trained to be helpful, which means generating an answer even when they should refuse.
4. Specific details (dates, numbers, citations) require exact recall from training data — and the model's "memory" is lossy and unreliable for specifics.

### What This Means for You

Understanding how LLMs work changes how you use them:
- **Trust general patterns more than specific facts** — LLMs are more reliable on "how does photosynthesis work?" than "what year was this paper published?"
- **Verify everything that matters** — the model doesn't know when it's wrong
- **Better prompts = better outputs** — because you're helping the model find better patterns
- **Context matters enormously** — the attention mechanism means the context you provide directly shapes the quality of outputs
- **Confidence ≠ accuracy** — the model generates with equal confidence whether right or wrong

### The Rate of Change

AI capabilities are advancing rapidly. Models in 2026 are significantly more capable than 2023 models. But the fundamental architecture and limitations described here still apply. Understanding the foundation helps you evaluate new developments critically rather than believing every headline.`,
    },
  ]);

  // AI LITERACY QUIZ QUESTIONS
  await db.insert(quizQuestions).values([
    { id: "q_ai_68_understand_1", moduleId: "ai_68_understand", questionText: "What is the fundamental difference between AI and traditional software?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "AI is faster than traditional software" }, { id: "b", text: "AI learns patterns from data instead of following fixed rules" }, { id: "c", text: "AI is always more accurate" }, { id: "d", text: "AI can think like a human" }]), correctAnswer: "b", explanation: "Traditional software follows rules programmed by humans. AI learns patterns from data and makes predictions based on those patterns. It doesn't think — it pattern-matches at scale.", points: 10 },
    { id: "q_ai_68_understand_2", moduleId: "ai_68_understand", questionText: "When AI generates false information with complete confidence, this is called:", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "A bug that will be fixed in the next update" }, { id: "b", text: "A hallucination — a fundamental characteristic of how AI works" }, { id: "c", text: "Proof that AI is broken" }, { id: "d", text: "An intentional lie by the AI" }]), correctAnswer: "b", explanation: "AI hallucinations occur because AI predicts probable text, not true text. It sounds equally confident whether right or wrong. This is a fundamental characteristic, not a bug.", points: 10 },
    { id: "q_ai_68_direct_1", moduleId: "ai_68_direct", questionText: "What does the CRAFT framework stand for in prompt engineering?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "Create, Research, Analyze, Format, Test" }, { id: "b", text: "Context, Role, Action, Format, Tone" }, { id: "c", text: "Clarity, Relevance, Accuracy, Fairness, Timing" }, { id: "d", text: "Command, Review, Apply, Fix, Transform" }]), correctAnswer: "b", explanation: "CRAFT stands for Context (background info), Role (expert persona), Action (what to do), Format (how it should look), and Tone (writing style). Using all five produces dramatically better AI outputs.", points: 10 },
    { id: "q_ai_68_evaluate_1", moduleId: "ai_68_evaluate", questionText: "What is the 'Two-Source Rule' for AI-generated information?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "Ask two different AI tools the same question" }, { id: "b", text: "Read the AI output twice before using it" }, { id: "c", text: "Verify important claims with at least two independent, reliable sources" }, { id: "d", text: "Generate the output two times to see if it's consistent" }]), correctAnswer: "c", explanation: "The Two-Source Rule means verifying any important AI-generated information with at least two independent, reliable sources outside of AI. If two sources contradict the AI, trust the sources.", points: 10 },
    { id: "q_ai_68_responsible_1", moduleId: "ai_68_responsible", questionText: "If AI generates an inaccurate report and you submit it as your work, who is responsible?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "The AI company that made the tool" }, { id: "b", text: "Nobody — it was an honest mistake" }, { id: "c", text: "You — you are 100% responsible for anything AI helps you create" }, { id: "d", text: "Your teacher for allowing AI use" }]), correctAnswer: "c", explanation: "The accountability principle: you are 100% responsible for anything AI helps you create. 'AI told me' is never an acceptable excuse. You are the human in the loop.", points: 10 },
    { id: "q_ai_912_understand_1", moduleId: "ai_912_understand", questionText: "Why do large language models hallucinate?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "Because they have bugs in their code that need fixing" }, { id: "b", text: "Because they generate probable text sequences, not verified truth, and have no fact database to check against" }, { id: "c", text: "Because they run out of memory" }, { id: "d", text: "Because they haven't been trained on enough data yet" }]), correctAnswer: "b", explanation: "Hallucination is a fundamental consequence of next-token prediction. LLMs generate statistically probable text, not verified truth. They have no knowledge base to fact-check against, and they sound equally confident whether right or wrong.", points: 10 },
    { id: "q_ai_912_evaluate_1", moduleId: "ai_912_evaluate", questionText: "Which evaluation approach is MOST reliable for verifying AI-generated statistical claims?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "Checking if the numbers seem reasonable" }, { id: "b", text: "Asking a different AI to verify the claim" }, { id: "c", text: "Tracing the claim to primary sources and verifying methodology, sample size, and whether the conclusion follows from the data" }, { id: "d", text: "Accepting it if it includes a citation" }]), correctAnswer: "c", explanation: "The most reliable verification traces statistical claims to their primary sources and evaluates methodology, sample size, and whether conclusions actually follow from the data. AI can fabricate citations, so the presence of a source doesn't mean accuracy.", points: 10 },
    { id: "q_ai_912_responsible_1", moduleId: "ai_912_responsible", questionText: "Which law specifically protects student educational records and applies to AI tools used in schools?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "HIPAA" }, { id: "b", text: "FERPA" }, { id: "c", text: "GDPR" }, { id: "d", text: "Section 508" }]), correctAnswer: "b", explanation: "FERPA (Family Educational Rights and Privacy Act) protects student educational records. Schools must ensure any AI tools they use comply with FERPA requirements for data privacy and parental consent.", points: 10 },
  ]);

  // AI LITERACY BADGES
  await db.insert(badges).values([
    { id: "ai_principles_explorer", name: "AI Principles Explorer", description: "Complete the Understand AI Principles module", category: "skill", levelRequirement: 3, rarity: "uncommon" },
    { id: "ai_tool_navigator", name: "AI Tool Navigator", description: "Complete the Explore AI Uses module", category: "skill", levelRequirement: 3, rarity: "uncommon" },
    { id: "prompt_engineer", name: "Prompt Engineer", description: "Complete the Direct AI Effectively module", category: "skill", levelRequirement: 3, rarity: "uncommon" },
    { id: "ai_fact_checker", name: "AI Fact Checker", description: "Complete the Evaluate AI Outputs module", category: "skill", levelRequirement: 3, rarity: "rare" },
    { id: "responsible_ai_user", name: "Responsible AI User", description: "Complete the Use AI Responsibly module", category: "character", levelRequirement: 3, rarity: "rare" },
    { id: "ai_literate", name: "AI Literate", description: "Complete all 5 AI Literacy content areas", category: "milestone", levelRequirement: 3, rarity: "legendary" },
    { id: "ai_master", name: "AI Master", description: "Complete all 5 Advanced AI Mastery modules (Grades 9-12)", category: "milestone", levelRequirement: 4, rarity: "legendary" },
  ]);

  // ============================================================
  await db.insert(badges).values([
    { id: "letter_learner", name: "Letter Learner", description: "Complete your first phonics lesson", category: "skill", levelRequirement: 1, rarity: "common" },
    { id: "reading_rocket", name: "Reading Rocket", description: "Complete 3 ELA/Reading lessons", category: "skill", levelRequirement: 1, rarity: "uncommon" },
    { id: "math_whiz", name: "Math Whiz", description: "Pass a math quiz", category: "skill", levelRequirement: 1, rarity: "common" },
    { id: "number_ninja", name: "Number Ninja", description: "Complete 3 math lessons", category: "skill", levelRequirement: 1, rarity: "uncommon" },
    { id: "science_star", name: "Science Star", description: "Complete a science lesson", category: "skill", levelRequirement: 1, rarity: "common" },
    { id: "nature_explorer", name: "Nature Explorer", description: "Complete 3 science lessons", category: "skill", levelRequirement: 1, rarity: "uncommon" },
    { id: "feelings_friend", name: "Feelings Friend", description: "Complete your first SEL lesson", category: "character", levelRequirement: 1, rarity: "common" },
    { id: "calm_champion", name: "Calm Champion", description: "Practice a breathing exercise", category: "character", levelRequirement: 1, rarity: "uncommon" },
    { id: "kindness_hero", name: "Kindness Hero", description: "Complete 3 SEL lessons", category: "character", levelRequirement: 1, rarity: "uncommon" },
    { id: "wellness_warrior", name: "Wellness Warrior", description: "Complete a wellness lesson", category: "milestone", levelRequirement: 1, rarity: "common" },
    { id: "healthy_habits", name: "Healthy Habits Hero", description: "Complete 3 wellness lessons", category: "milestone", levelRequirement: 1, rarity: "uncommon" },
    { id: "growth_mindset", name: "Growth Mindset Master", description: "Learn about growth mindset", category: "character", levelRequirement: 2, rarity: "uncommon" },
    { id: "whole_child", name: "Whole Child Champion", description: "Complete lessons in all 6 subject areas", category: "milestone", levelRequirement: 1, rarity: "rare" },
    { id: "super_scholar", name: "Super Scholar", description: "Complete 20 lessons across all subjects", category: "milestone", levelRequirement: 1, rarity: "rare" },
    { id: "empathy_expert", name: "Empathy Expert", description: "Complete all SEL modules in your grade band", category: "character", levelRequirement: 2, rarity: "rare" },
    { id: "self_care_star", name: "Self-Care Star", description: "Complete all wellness modules in your grade band", category: "milestone", levelRequirement: 2, rarity: "rare" },
    { id: "workforce_ready", name: "Workforce Ready", description: "Complete all 5 TEKS §127.15 Workforce Readiness modules", category: "milestone", levelRequirement: 4, rarity: "legendary" },
    { id: "safety_certified", name: "Safety Certified", description: "Complete the Workplace Safety Essentials module", category: "skill", levelRequirement: 4, rarity: "uncommon" },
    { id: "rights_advocate", name: "Rights Advocate", description: "Complete the Workplace Rights & Responsibilities module", category: "character", levelRequirement: 4, rarity: "uncommon" },
    { id: "time_master", name: "Time Master", description: "Complete the Time & Priority Management module", category: "skill", levelRequirement: 4, rarity: "uncommon" },
    { id: "career_leader", name: "Career Leader", description: "Complete the Work Ethic & Career Leadership module", category: "character", levelRequirement: 4, rarity: "rare" },
    { id: "professional_presence", name: "Professional Presence", description: "Complete the Professional Presence module", category: "skill", levelRequirement: 4, rarity: "uncommon" },
  ]);
}
