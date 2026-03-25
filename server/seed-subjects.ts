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
