import { lessons } from "@shared/schema";

export async function seedAILiteracyFullLessons(db: any): Promise<void> {
  // ============================================================
  // AI LITERACY GRADES 6-8 — REMAINING LESSONS (L2, L3 for each module)
  // ============================================================

  await db.insert(lessons).values([
    // ---- ai_68_understand L2 ----
    {
      id: "ai_68_understand_l2", moduleId: "ai_68_understand", lessonNumber: 2,
      title: "Machine Learning — How AI Learns From Data", durationMinutes: 40, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Training Data", "Algorithm/Model", "Output/Prediction"],
        items: [
          { text: "10 million labeled photos of cats and dogs", category: "Training Data" },
          { text: "A neural network that finds visual patterns", category: "Algorithm/Model" },
          { text: "The system identifies a new photo as 'cat' with 94% confidence", category: "Output/Prediction" },
          { text: "Billions of sentences scraped from books and websites", category: "Training Data" },
          { text: "A transformer model that predicts the next word", category: "Algorithm/Model" },
          { text: "ChatGPT generates a paragraph answering your question", category: "Output/Prediction" },
          { text: "Thousands of emails labeled 'spam' or 'not spam'", category: "Training Data" },
          { text: "A classification algorithm that scores suspicious patterns", category: "Algorithm/Model" },
          { text: "Your inbox automatically moves a phishing email to junk", category: "Output/Prediction" },
        ],
        instructions: "Every AI system follows the same pipeline: Training Data → Algorithm → Output. Sort each item into the correct stage.",
      }),
      content: `## Machine Learning — How AI Learns From Data

Now that you know what AI is, let's go deeper into HOW it learns. This is the most important concept in AI — and it's simpler than you think.

### The Three Ingredients of Machine Learning

Every machine learning system needs three things:

**1. DATA** — Lots of it. The more, the better.
Machine learning is hungry. To learn to recognize cats, an AI needs millions of cat photos. To learn language, it needs billions of sentences. To learn to recommend music, it needs the listening history of millions of users.

Where does this data come from? Books, websites, photos, medical records, purchase histories, social media posts, scientific papers — essentially, anything humans have ever recorded digitally.

**2. AN ALGORITHM** — The learning method.
An algorithm is a set of instructions for finding patterns. Think of it like a recipe. Different algorithms find different types of patterns:
- **Classification:** Is this email spam or not spam? Is this photo a cat or a dog?
- **Regression:** What will the temperature be tomorrow? How much will this house sell for?
- **Clustering:** Which customers are similar to each other? Which songs belong in the same playlist?
- **Generation:** What text should come next? What image matches this description?

**3. A GOAL** — What the AI is trying to optimize.
Every AI system has a specific objective. Netflix's AI wants to maximize the chance you'll click on a recommendation. A spam filter wants to maximize the chance it correctly identifies spam. ChatGPT wants to maximize the chance its response is helpful.

This goal is critical because **AI will optimize for exactly what you tell it to — even if that leads to unintended consequences.**

### Supervised vs. Unsupervised Learning

**Supervised Learning:** You give the AI labeled examples. "This photo is a cat. This photo is a dog. This photo is a cat." After enough examples, the AI learns to classify new photos it's never seen.

**Unsupervised Learning:** You give the AI data WITHOUT labels and ask it to find patterns on its own. "Here are 100,000 customer purchase records. Find groups of similar customers." The AI discovers patterns humans might have missed.

### How Training Actually Works (Simplified)

1. The AI makes a PREDICTION on training data
2. It compares its prediction to the CORRECT ANSWER
3. It calculates how WRONG it was (this is called the "loss")
4. It ADJUSTS its internal settings to be slightly less wrong next time
5. It repeats steps 1-4 MILLIONS of times

Imagine learning to throw darts. You throw, see where the dart lands, adjust your aim, throw again. After thousands of throws, you get very accurate. That's essentially what machine learning does — except it adjusts millions of tiny settings simultaneously, millions of times, at the speed of light.

### Why Data Quality Matters More Than Anything

If you train an AI on biased data, you get a biased AI. If you train it on inaccurate data, you get an inaccurate AI. If you train it on data that only represents one perspective, it will only know one perspective.

Real example: Amazon built an AI to screen job resumes. It was trained on 10 years of hiring data. Because the tech industry historically hired mostly men, the AI learned to penalize resumes that mentioned women's colleges or women's organizations. Amazon had to scrap the entire system.

The lesson: **Data isn't neutral. It carries the biases, assumptions, and blind spots of the people who created it.**

### Key Vocabulary

- **Training:** The process of an AI learning from data
- **Model:** The AI system after training — the thing that makes predictions
- **Inference:** When a trained model makes a prediction on new data
- **Overfitting:** When an AI memorizes training data so well it fails on new data (like memorizing test answers without understanding the subject)
- **Bias:** Systematic errors in AI outputs caused by biased training data or flawed assumptions`,
    },
    // ---- ai_68_understand L3 ----
    {
      id: "ai_68_understand_l3", moduleId: "ai_68_understand", lessonNumber: 3,
      title: "AI Limitations — What AI Cannot Do (And Why That Matters)", durationMinutes: 35, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "AI writes a poem about heartbreak", right: "Pattern matching — it arranges words that commonly appear in sad poems. It has never felt heartbreak." },
          { left: "AI answers 'What should I do about my bully?'", right: "Text generation — it produces common advice. It doesn't know your situation, your school, or your bully." },
          { left: "AI says 'Albert Einstein was born in 1879'", right: "Recall from training data — likely correct because this fact appears thousands of times in its data." },
          { left: "AI says a fake research paper was published in Nature", right: "Hallucination — it generated a probable-sounding citation that doesn't exist." },
          { left: "AI refuses to help you make a weapon", right: "Safety fine-tuning — humans trained it to refuse harmful requests. The AI doesn't 'understand' danger." },
          { left: "AI gives different answers to the same question asked twice", right: "Probabilistic output — it samples from probabilities, so outputs vary even with identical inputs." },
        ],
        instructions: "Match each AI behavior to the REAL explanation of what's happening. Understand the mechanism, not the illusion.",
      }),
      content: `## AI Limitations — What AI Cannot Do (And Why That Matters)

AI feels intelligent. It writes fluently, answers questions, creates art, and solves problems. But intelligence is an illusion. Understanding the limitations isn't pessimism — it's the foundation for using AI effectively.

### Limitation 1: AI Does Not Understand

When you tell a friend "I had a rough day," they understand what that means because they've HAD rough days. They feel empathy. They know the weight of those words.

When you tell AI "I had a rough day," it recognizes a text pattern and generates an appropriate-sounding response. It has never had a day — rough or otherwise. It doesn't understand "rough" the way you do. It knows that in its training data, certain responses tend to follow that phrase.

**Why it matters:** People sometimes share deeply personal things with AI because it "listens" without judgment. That's fine — but remember you're talking to a pattern matcher, not a therapist. For real emotional support, talk to real humans.

### Limitation 2: AI Has No Common Sense

Ask a human: "If I drop a glass on concrete, what happens?" Every human knows it shatters. We know this from living in the physical world.

AI knows this only if its training data frequently associates "drop glass concrete" with "shatters." For common scenarios, it gets the right answer. For unusual ones, it can fail spectacularly because it has never experienced the physical world.

Try asking AI unusual common-sense questions:
- "If I put my shoes in the oven, would they fit better?"
- "Can I use a banana as a phone?"
- "If I paint my house blue, will it be heavier?"

You'll see where pattern matching breaks down and common sense is actually needed.

### Limitation 3: AI Cannot Verify Its Own Outputs

When you write an essay, you can re-read it and think "wait, that claim doesn't seem right — let me check." You have an internal fact-checker powered by your knowledge and judgment.

AI has no such mechanism. It generates tokens one after another based on probability. It cannot step back, re-read, and evaluate whether what it wrote is true. Some newer AI systems add verification layers, but the core generation process has no truth-checking built in.

**This means:** Every AI output needs a HUMAN fact-checker. That's you.

### Limitation 4: AI Reflects Its Training Data

AI doesn't have opinions, values, or perspectives. What it has is a statistical summary of all the text it was trained on. If most of that text was written from one cultural perspective, the AI will reflect that perspective and potentially misunderstand or misrepresent others.

**Real-world example:** Early language models, when asked "The doctor walked into the room. He..." would almost always continue with "he" because their training data reflected historical patterns where most doctors were described as male. This isn't the AI being sexist — it's reflecting the biases embedded in the data it learned from.

### Limitation 5: AI Has a Knowledge Cutoff

AI models are trained on data up to a certain date. They don't browse the internet in real time (unless specifically built to do so). This means:
- They may not know about recent events
- Their information about prices, statistics, and trends may be outdated  
- They may reference people, companies, or products that no longer exist as they were

**Always check:** Does this information need to be current? If yes, verify it with a current source.

### The Capability Paradox

Here's what makes AI tricky: it's VERY capable in some areas and COMPLETELY incapable in others, and it doesn't warn you about the difference. It will answer a question about quantum physics with the same confident tone it uses to fabricate a historical event that never happened.

**Your superpower:** You have something AI doesn't — the ability to think ABOUT thinking. You can ask "Should I trust this? Does this make sense? What am I missing?" AI can't do that. You can. Use it.`,
    },
  ]);

  // ---- ai_68_explore L2, L3 ----
  await db.insert(lessons).values([
    {
      id: "ai_68_explore_l2", moduleId: "ai_68_explore", lessonNumber: 2,
      title: "AI Across Industries — Real-World Use Cases", durationMinutes: 40, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "Healthcare", right: "AI analyzes medical images (X-rays, MRIs) to detect tumors earlier than human radiologists alone" },
          { left: "Agriculture", right: "Drones with AI identify crop diseases from aerial photos and target pesticide application to specific plants" },
          { left: "Education", right: "Adaptive learning platforms adjust difficulty and content based on each student's performance patterns" },
          { left: "Criminal Justice", right: "Risk assessment algorithms predict recidivism to inform bail and sentencing decisions (controversially)" },
          { left: "Entertainment", right: "AI generates music, visual effects, and game environments that adapt to player behavior" },
          { left: "Transportation", right: "Self-driving systems process data from cameras, lidar, and sensors to navigate roads" },
        ],
        instructions: "Match each industry to a real AI application being used today. These are not theoretical — they're deployed right now.",
      }),
      content: `## AI Across Industries — Real-World Use Cases

AI isn't just chatbots. It's reshaping entire industries — sometimes for better, sometimes with serious problems. Understanding where AI is actually being used prepares you for the world you're entering.

### Healthcare AI — Saving Lives and Raising Questions

**What's working:**
- AI can analyze medical images (X-rays, CT scans, MRIs) and detect cancer, fractures, and other conditions. In some studies, AI + doctor outperforms doctor alone by catching things human eyes miss.
- Drug discovery AI screens millions of molecular combinations to find potential treatments, reducing years of lab work to months.
- AI monitors patient vital signs continuously and alerts staff to deterioration before it becomes critical.

**What's concerning:**
- AI trained primarily on data from one demographic may misdiagnose patients from underrepresented groups. A dermatology AI trained mostly on light skin may fail to identify conditions on dark skin.
- Over-reliance on AI could de-skill healthcare workers if they stop developing their own diagnostic abilities.
- Patient data privacy — training medical AI requires massive amounts of patient data.

### Education AI — Personalizing Learning

**What's working:**
- Adaptive platforms like what ThriveUp Academy uses can adjust to each student's pace and learning style
- AI tutoring can provide 24/7 homework help and explanations
- Automated grading frees teachers to spend more time teaching and mentoring

**What's concerning:**
- Over-surveillance of student behavior and learning patterns
- AI that replaces human connection in education misses the mentorship that transforms lives
- Students using AI to do work instead of learning from it

### Criminal Justice AI — The Highest Stakes

**What's happening:**
COMPAS and similar algorithms are used in courtrooms across America to predict whether a defendant will re-offend. Judges use these scores when deciding bail, sentencing, and parole.

**The problem:**
An investigation by ProPublica found that COMPAS was nearly twice as likely to incorrectly flag Black defendants as high risk compared to white defendants. The algorithm wasn't explicitly programmed to be racist — but it was trained on historical criminal justice data, which reflects decades of systemic bias.

**The lesson:** When AI is trained on data from a biased system, it learns and reproduces that bias. And when that AI is used to make life-altering decisions, real people suffer.

### Agriculture AI — Feeding the World

AI-powered drones survey fields, identify crop diseases from visual patterns, and direct targeted treatment to specific areas instead of blanket-spraying entire fields. This reduces pesticide use by up to 90% in some applications.

AI also helps predict crop yields, optimize irrigation, and manage supply chains — critical as climate change makes farming less predictable.

### Creative Industries — Partner or Threat?

AI can now generate music, art, writing, and video. This has created a fierce debate:
- **Artists:** AI was trained on millions of artworks without artist consent or compensation. Is that theft?
- **Companies:** AI dramatically reduces the cost of creative production. Why hire an illustrator when AI generates images for free?
- **Workers:** Concept artists, copywriters, translators, and other creative professionals are seeing job reductions.

**The real question isn't whether AI CAN do creative work — it's what we OWE to the human creators whose work trained it.**

### Your Assignment: The Industry Investigation

Pick ONE industry that interests you. Research:
1. What specific AI applications are being used right now?
2. What measurable benefits have they produced?
3. What problems or concerns have emerged?
4. Who benefits and who is harmed?
5. What regulations or guidelines exist (or should exist)?

This isn't hypothetical. This is your future job market.`,
    },
    {
      id: "ai_68_explore_l3", moduleId: "ai_68_explore", lessonNumber: 3,
      title: "Human + AI — Building Your Collaboration Skills", durationMinutes: 35, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Use AI to Start", "Use AI to Improve", "Do It Yourself"],
        items: [
          { text: "Generate 20 brainstorming ideas for a history project topic", category: "Use AI to Start" },
          { text: "Write a thank-you note to your grandmother", category: "Do It Yourself" },
          { text: "Check your essay for grammar and clarity after you've written it", category: "Use AI to Improve" },
          { text: "Create a study guide from your class notes", category: "Use AI to Improve" },
          { text: "Tell your friend why you're sorry after an argument", category: "Do It Yourself" },
          { text: "Get different perspectives on a debate topic before forming your opinion", category: "Use AI to Start" },
          { text: "Practice math problems to build your skills", category: "Do It Yourself" },
          { text: "Translate a long article from Spanish to English for research", category: "Use AI to Start" },
          { text: "Proofread and improve the structure of a report you wrote", category: "Use AI to Improve" },
        ],
        instructions: "For each task, decide: Should you use AI to start the work, use AI to improve work you already did, or do it entirely yourself?",
      }),
      content: `## Human + AI — Building Your Collaboration Skills

The future doesn't belong to people who can use AI. It doesn't belong to people who refuse AI. It belongs to people who know WHEN to use AI, HOW to use it well, and WHEN to rely on their own abilities instead.

### The Three Modes of Human-AI Collaboration

**Mode 1: AI as Starter — Use AI to begin, then make it yours**
Sometimes the hardest part is staring at a blank page. AI is excellent at generating starting points:
- Brainstorming ideas you hadn't considered
- Creating first drafts you can heavily edit
- Outlining structures you can fill with your own research
- Generating questions that spark your thinking

**The rule:** AI starts, but YOU finish. The final product should reflect your thinking, your voice, and your judgment.

**Mode 2: AI as Improver — Do your work first, then use AI to polish**
You write the essay. You solve the problem. You create the design. THEN you use AI to:
- Check grammar and clarity
- Suggest better word choices
- Identify gaps in your argument
- Reformat for different audiences

**The rule:** Your work comes first. AI enhances — it doesn't replace your effort.

**Mode 3: No AI — Some things require only you**
- Personal communication (apologies, love letters, condolences)
- Practice and skill-building (math drills, writing practice, learning an instrument)
- Ethical judgments and decisions that affect other people
- Creative expression meant to reflect YOUR unique perspective
- Tests and assessments designed to measure YOUR knowledge

### Building Your AI Workflow

Professional AI users don't randomly decide when to use AI. They have a workflow — a consistent process:

**Step 1: Define the task clearly**
What exactly do you need to accomplish? What does "done" look like?

**Step 2: Decide your AI strategy**
- Is this a Starter, Improver, or No-AI task?
- Which AI tool is best for this specific task?
- What information does the AI need from you?

**Step 3: Generate and evaluate**
- Use the CRAFT framework for your prompt
- Evaluate the output using ARCB (Accuracy, Relevance, Completeness, Bias)
- Don't accept the first output — iterate

**Step 4: Integrate and personalize**
- Combine AI output with your own knowledge and perspective
- Rewrite in your own voice
- Add your unique insights, examples, and experiences
- Fact-check anything you plan to use

**Step 5: Verify and attribute**
- Check final product for accuracy
- Cite AI assistance where appropriate
- Ensure the final work represents YOUR understanding

### The Skills That Become MORE Valuable With AI

AI doesn't make all human skills less valuable. It makes some skills MORE valuable:

**CRITICAL THINKING** — More important than ever because you need to evaluate AI outputs
**CREATIVITY** — AI can remix existing patterns but can't generate truly novel ideas rooted in lived experience
**EMOTIONAL INTELLIGENCE** — AI can't read a room, comfort a colleague, or navigate office politics
**ETHICAL JUDGMENT** — AI can't decide what's right and wrong for your community
**DOMAIN EXPERTISE** — AI amplifies what you know. The more you know, the more AI helps you
**COMMUNICATION** — Explaining complex ideas clearly, persuading, building relationships
**LEADERSHIP** — Motivating teams, making decisions under uncertainty, taking responsibility

### The Bottom Line

The students who will thrive in an AI-powered world aren't the ones who use AI for everything or the ones who refuse to use it. They're the ones who develop strong foundational skills AND learn to collaborate effectively with AI. That's what this program is building.`,
    },
  ]);

  // ---- ai_68_direct L2, L3 ----
  await db.insert(lessons).values([
    {
      id: "ai_68_direct_l2", moduleId: "ai_68_direct", lessonNumber: 2,
      title: "Advanced Prompting — Role, Context, and Iterative Refinement", durationMinutes: 40, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "You are a nutritionist specializing in teen health.", right: "Role prompting — assigns a specific expert persona that shapes the knowledge and language used" },
          { left: "My science fair project is about comparing water filtration methods. I'm in 7th grade and my teacher wants data tables.", right: "Context setting — gives background, constraints, and specific requirements" },
          { left: "Make the second paragraph less technical. Replace 'osmosis' with a simpler explanation.", right: "Iterative refinement — improving a specific part of a previous output" },
          { left: "List the top 5 points as a numbered list with one sentence each.", right: "Format control — specifying exactly how the output should be structured" },
          { left: "Write as if you're explaining to a smart 12-year-old who's never heard of this topic.", right: "Tone and audience calibration — setting reading level and communication style" },
          { left: "Before answering, list 3 things you're unsure about regarding this topic.", right: "Metacognition prompt — asking AI to identify its own uncertainty before generating content" },
        ],
        instructions: "Match each prompt technique to its name and purpose. Master these and you'll get dramatically better AI outputs.",
      }),
      content: `## Advanced Prompting — Role, Context, and Iterative Refinement

You learned the CRAFT framework. Now let's go deeper into three techniques that separate average AI users from exceptional ones.

### Technique 1: Role Prompting

When you assign AI a specific role, everything changes. The vocabulary shifts, the depth changes, the perspective narrows to that expertise.

**Without role:** "Explain photosynthesis."
→ You get a generic textbook answer.

**With role:** "You are a botanist who teaches middle school part-time. Explain photosynthesis the way you would to a curious 7th grader who loves cooking — use food and kitchen analogies."
→ You get a creative, engaging explanation that connects science to something the student cares about.

**Powerful roles to try:**
- "You are a [specific professional] with 20 years of experience"
- "You are a teacher who specializes in making [topic] accessible to [age group]"
- "You are a journalist investigating [topic] — be skeptical and ask hard questions"
- "You are a debate coach preparing me to argue [position] — anticipate counterarguments"

**Pro tip:** You can also tell AI what it is NOT. "You are a health educator. You are NOT a doctor and should not provide medical diagnoses. Always recommend consulting a healthcare provider for personal health concerns."

### Technique 2: Rich Context Setting

Context is everything. The same question with different context produces entirely different (and differently useful) outputs.

**Level 1 — No context (worst):**
"Write about climate change."

**Level 2 — Basic context (mediocre):**
"Write about climate change for a school project."

**Level 3 — Rich context (excellent):**
"I'm an 8th grader in Austin, Texas writing a 1,000-word persuasive essay about why our school should install solar panels. My audience is the school board — adults who care about budgets. I need 3 arguments supported by data, a counter-argument section, and a call to action. My teacher requires at least 4 cited sources."

**Context checklist for strong prompts:**
- Who are you? (grade, role, situation)
- What's the purpose? (assignment, personal project, presentation)
- Who's the audience? (teacher, classmates, school board, general public)
- What are the constraints? (word count, format, sources required, deadline)
- What have you already done? (research completed, draft written, ideas collected)
- What specific outcome do you need? (outline, full draft, feedback, data)

### Technique 3: Iterative Refinement

The best AI outputs almost never come from a single prompt. They emerge from a conversation:

**Round 1 — Get the foundation:**
"Create an outline for a presentation about ocean pollution, 8 slides, for a 7th grade science class."

**Round 2 — Improve specifics:**
"Slide 3 about plastic pollution needs more specific data. Add statistics from research published after 2020 — but flag them so I can verify."

**Round 3 — Adjust tone:**
"The language in slides 5-7 is too academic. Rewrite for 12-year-olds. Use shorter sentences and real-world examples they'd recognize."

**Round 4 — Add elements:**
"For each slide, suggest one visual (photo, chart, or diagram) I could include and describe what it should show."

**Round 5 — Polish:**
"Review the complete presentation and check: Is the flow logical? Is anything repetitive? Is the conclusion strong?"

**Each round makes the output significantly better.** Professional AI users expect to iterate 3-7 times on important work.

### The Metacognition Hack

One of the most powerful advanced techniques is asking AI to think ABOUT its thinking:

- "Before answering, list 3 assumptions you're making about this question."
- "After your response, rate your confidence from 1-10 and explain why."
- "What important information am I not giving you that would help you answer better?"
- "What are the 3 biggest ways your answer could be wrong?"

This doesn't make AI self-aware — but it activates patterns in its training data where humans demonstrated self-reflection, which often produces more nuanced and honest outputs.

### Practice Assignment

Take a project you're currently working on. Write THREE versions of a prompt for it:
1. A basic prompt (1 sentence)
2. A CRAFT prompt (full framework)
3. A CRAFT prompt + role + metacognition hack

Compare the outputs. The difference will convince you that prompting skill matters more than which AI tool you use.`,
    },
    {
      id: "ai_68_direct_l3", moduleId: "ai_68_direct", lessonNumber: 3,
      title: "Building Your Prompt Library — Reusable Templates for Real Work", durationMinutes: 35, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Research & Analysis", "Writing & Creation", "Study & Review"],
        items: [
          { text: "Generate a pro/con analysis of a debate topic with evidence for each side", category: "Research & Analysis" },
          { text: "Create a study guide with key terms, concepts, and practice questions from my notes", category: "Study & Review" },
          { text: "Draft a persuasive essay outline with thesis, 3 arguments, counterargument, and conclusion", category: "Writing & Creation" },
          { text: "Compare two historical events by cause, effect, scale, and lasting impact", category: "Research & Analysis" },
          { text: "Write 10 flashcard-style Q&A pairs for an upcoming test on Chapter 7", category: "Study & Review" },
          { text: "Create a project proposal with objective, timeline, materials, and expected outcomes", category: "Writing & Creation" },
          { text: "Analyze a primary source document for author's purpose, audience, bias, and historical context", category: "Research & Analysis" },
          { text: "Explain 3 concepts from today's lesson using analogies a 6th grader would understand", category: "Study & Review" },
        ],
        instructions: "Organize these prompt templates into the correct category. Building a prompt library means knowing which type of prompt to reach for.",
      }),
      content: `## Building Your Prompt Library — Reusable Templates for Real Work

Professional chefs don't figure out recipes from scratch every meal. They have a collection of tested recipes they adapt. Professional AI users work the same way — they build a library of tested prompt templates.

### What Is a Prompt Library?

A prompt library is a personal collection of prompt templates that you've tested, refined, and know produce good results. Each template is designed for a specific type of task and can be quickly adapted with new details.

### Template Category 1: Research & Analysis

**The Balanced Analysis Template:**
"You are a research analyst. I need a balanced analysis of [TOPIC]. Structure it as:
1. Overview (2-3 sentences defining the issue)
2. Arguments FOR (3 points with evidence)
3. Arguments AGAINST (3 points with evidence)
4. Key data points (statistics from reliable sources — flag any you're uncertain about)
5. My takeaway prompt (questions I should consider before forming my opinion)
Audience: [GRADE LEVEL]. Keep language clear and jargon-free."

**The Source Comparison Template:**
"Compare [SOURCE A] and [SOURCE B] on the topic of [TOPIC]. For each source, analyze:
- Author's perspective and potential bias
- Key claims made
- Evidence provided
- What's missing or not addressed
Present as a side-by-side comparison table, then a 1-paragraph synthesis."

**The Deep Dive Template:**
"You are an expert in [FIELD]. Explain [CONCEPT] at three levels:
Level 1: One paragraph a 6th grader would understand
Level 2: A detailed explanation for an 8th grader with some background
Level 3: A technical explanation for a high school AP student
For each level, include one real-world example."

### Template Category 2: Writing & Creation

**The Essay Scaffolding Template:**
"Help me build a [TYPE] essay about [TOPIC] for [AUDIENCE].
Step 1: Suggest 3 possible thesis statements (I'll pick one)
Step 2: After I choose, create an outline with topic sentences for each paragraph
Step 3: For each body paragraph, suggest 2 pieces of evidence I should find and cite
Do NOT write the essay. I need to write it myself. You're helping me structure my thinking."

**The Creative Brief Template:**
"I'm creating a [PROJECT TYPE] about [TOPIC] for [AUDIENCE/PURPOSE].
Constraints: [LENGTH/FORMAT/REQUIREMENTS]
Generate: [NUMBER] different creative approaches I could take, each with a 2-sentence description of the concept and why it would be effective for this audience."

### Template Category 3: Study & Review

**The Study Guide Generator:**
"You are a study coach. Using the following information from my notes: [PASTE NOTES]
Create a study guide with:
- 10 key terms with definitions
- 5 concept explanations (2-3 sentences each)
- 8 practice questions (mix of multiple choice and short answer) WITH answers
- 3 common mistakes students make on this material
Format for easy review — use headers, bullets, and bold key terms."

**The Teach-Back Template:**
"I'm trying to understand [CONCEPT]. Explain it to me, then ask me 3 questions to check if I understood. After I answer, tell me what I got right and what I should review. If I'm wrong, re-explain using a different approach or analogy."

**The Test Prep Template:**
"Create a practice test for [SUBJECT/CHAPTER] with:
- 10 multiple choice questions (4 options each)
- 3 short answer questions
- 1 essay question
Include an answer key with explanations for why each answer is correct and why the wrong answers are wrong."

### How to Test and Refine Templates

A template isn't ready until you've:
1. **Used it 3+ times** on different topics
2. **Compared outputs** to see if quality is consistent
3. **Identified weak spots** — what does the template consistently miss?
4. **Refined the wording** to fix those weak spots
5. **Documented what it's best for** and what it shouldn't be used for

### Your Assignment: Build Your Starter Library

Create at least 5 prompt templates:
- 2 for Research & Analysis
- 2 for Writing & Creation  
- 1 for Study & Review

Test each template on a real school task. Refine based on results. By the end of this module, your library should have at least 10 tested, documented templates.`,
    },
  ]);

  // ---- ai_68_evaluate L2, L3 ----
  await db.insert(lessons).values([
    {
      id: "ai_68_evaluate_l2", moduleId: "ai_68_evaluate", lessonNumber: 2,
      title: "Detecting Hallucinations and Fake Citations", durationMinutes: 40, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "AI states: 'According to a 2024 study by MIT...'", right: "Check MIT's publication database — many AI citations are completely fabricated" },
          { left: "AI gives a phone number for a business", right: "Call or look it up — AI frequently generates plausible but wrong phone numbers" },
          { left: "AI says a law was passed in a specific year", right: "Check the government's legislative database — dates are a common hallucination category" },
          { left: "AI provides a statistic: '78% of teens...'", right: "Search for the exact statistic with a source — round-sounding percentages are often fabricated" },
          { left: "AI quotes a famous person saying something", right: "Verify the quote — AI regularly attributes invented quotes to real people" },
          { left: "AI describes a scientific process step-by-step", right: "Cross-reference with a textbook — process descriptions are usually accurate but may have subtle errors" },
        ],
        instructions: "Match each type of AI claim to the correct verification method. Different claim types require different fact-checking approaches.",
      }),
      content: `## Detecting Hallucinations and Fake Citations

AI hallucinations aren't random glitches. They follow patterns. Once you know the patterns, you can catch them reliably.

### The Five Most Common Hallucination Types

**Type 1: Fabricated Citations**
This is the most dangerous because it looks the most legitimate. AI will generate:
- A real author name + a fake paper title
- A real journal name + a fake volume/issue number
- A completely invented source that sounds plausible

**How to catch it:** Search for the exact paper title in Google Scholar. If it doesn't exist, the AI made it up. Don't just search for the author — they may be real even if the paper isn't.

**Type 2: Invented Statistics**
AI loves to produce specific-sounding numbers: "According to recent studies, 73% of employers prefer candidates with AI skills." These numbers FEEL authoritative but may not exist.

**How to catch it:** Search for the exact statistic. If you can't find a primary source (the actual study that produced the number), assume the AI fabricated it. Be especially suspicious of:
- Round percentages (70%, 80%, 90%)
- Very specific percentages (73.2%)
- Numbers that perfectly support the AI's point

**Type 3: False Historical Claims**
AI can invent events, misattribute quotes, and get dates wrong — all while sounding completely confident.

**How to catch it:** Cross-reference with established history sources. Be especially careful with:
- Specific dates and years
- Quotes attributed to historical figures
- Claims about causes and effects of events
- Details about lesser-known historical events (AI has less training data to draw from)

**Type 4: Fictional People and Organizations**
AI will sometimes reference experts, organizations, or companies that don't exist.

**How to catch it:** Google the person or organization. Check LinkedIn, official websites, and professional directories. If you can't find independent confirmation, the AI may have invented them.

**Type 5: Plausible-Sounding Technical Errors**
In scientific, medical, and technical content, AI may describe a process that's 90% correct but has a subtle error that changes the meaning significantly.

**How to catch it:** This is the hardest to detect because the error is embedded in otherwise accurate information. Compare against authoritative sources — textbooks, peer-reviewed papers, government databases.

### The Verification Workflow

When you receive AI output you plan to use:

**Step 1: Identify Checkable Claims**
Read through and highlight every specific fact, statistic, date, name, or citation.

**Step 2: Prioritize by Risk**
Which claims, if wrong, would cause the most damage? Verify those first.

**Step 3: Check Primary Sources**
For each high-priority claim, find the PRIMARY source — the original study, the official record, the person quoted. Don't rely on secondary sources that might also be wrong.

**Step 4: Document Your Verification**
Keep a record: "AI claimed X. I verified this with [source] and found [it's accurate / it's inaccurate / I couldn't confirm]."

**Step 5: Replace or Remove Unverifiable Claims**
If you can't verify a claim with a reliable source, don't use it. Period.

### The Confidence Trap

AI expresses all claims with equal confidence. It says "The Earth orbits the Sun" with the same certainty as "Dr. Sarah Chen published a groundbreaking study on AI ethics in 2023" — even if Dr. Chen doesn't exist and neither does the study.

**Never use AI's confidence as evidence of accuracy.** The only evidence of accuracy is independent verification.

### Practice: The Hallucination Hunt

Ask AI to write a 500-word informational article about any topic you choose. Then:
1. Highlight every specific claim (facts, dates, statistics, names, citations)
2. Fact-check each one using reliable sources
3. Mark each as: Verified, Unverifiable, or Fabricated
4. Calculate your article's accuracy rate

You'll be surprised how many fabrications a well-written AI article can contain.`,
    },
    {
      id: "ai_68_evaluate_l3", moduleId: "ai_68_evaluate", lessonNumber: 3,
      title: "Detecting Bias in AI Outputs", durationMinutes: 35, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Cultural Bias", "Representation Bias", "Framing Bias"],
        items: [
          { text: "AI image generator shows mostly white scientists when asked for 'scientist'", category: "Representation Bias" },
          { text: "AI describes a protest as 'violence' from one perspective but 'resistance' from another", category: "Framing Bias" },
          { text: "AI assumes American holidays and cultural norms when answering general questions", category: "Cultural Bias" },
          { text: "AI associates 'nurse' with women and 'engineer' with men in generated stories", category: "Representation Bias" },
          { text: "AI presents one political viewpoint more favorably than another in a 'balanced' summary", category: "Framing Bias" },
          { text: "AI doesn't recognize or misrepresents non-Western traditions, foods, or social structures", category: "Cultural Bias" },
          { text: "AI generates business advice assuming a corporate Western context", category: "Cultural Bias" },
          { text: "AI describes a historical event using language that favors one group over another", category: "Framing Bias" },
        ],
        instructions: "Sort each example of AI bias into the correct category. Recognizing the TYPE of bias helps you address it effectively.",
      }),
      content: `## Detecting Bias in AI Outputs

AI bias isn't a minor issue. It's a fundamental challenge that affects every AI system, and learning to detect it is one of the most important critical thinking skills you can develop.

### What IS AI Bias?

AI bias means the AI's outputs systematically favor certain groups, perspectives, or outcomes over others — not because someone programmed it to be unfair, but because the data it learned from reflects existing societal biases.

Think of it this way: If an AI reads millions of news articles where CEOs are described as male 85% of the time, it learns the pattern "CEO = male." It doesn't know this is biased. It just knows the pattern.

### Three Types of AI Bias You Need to Detect

**1. Representation Bias — Who is shown, who is invisible?**

Ask an image AI to generate "a doctor," "a scientist," "a CEO," or "a family." Notice:
- What race and gender appear most often?
- What body types are shown?
- What age ranges are represented?
- Are people with disabilities ever included?

Then ask for "a nurse," "a teacher," "a housekeeper." Notice the differences.

This bias reflects historical patterns in the training data, but it REINFORCES stereotypes when AI reproduces them millions of times.

**2. Cultural Bias — Whose culture is the default?**

Most large AI models were trained primarily on English-language text from Western (often American) sources. This means:
- AI may assume American cultural norms (tipping culture, school system, political structure)
- Non-Western perspectives may be underrepresented or misunderstood
- AI may not recognize cultural practices, holidays, or social structures outside its primary training data
- Historical events may be presented from a colonial or Western-centric perspective

**3. Framing Bias — How is information presented?**

The same facts can be presented in ways that favor different conclusions:
- "Protesters clashed with police" vs. "Police used force against demonstrators"
- "The economy grew 2%" vs. "Economic growth slowed to just 2%"
- "70% of students passed" vs. "30% of students failed"

AI picks up framing patterns from its training data, and different phrasings can lead readers to different conclusions about the same facts.

### How to Test for Bias

**The Swap Test:** Ask AI the same question but swap identity markers (gender, race, nationality, religion). Do the answers change? If so, that's bias.
- "Write a story about a boy who loves science" vs. "Write a story about a girl who loves science"
- "Describe a typical family in Nigeria" vs. "Describe a typical family in America"
- "Write about a Muslim teenager's daily life" vs. "Write about a Christian teenager's daily life"

**The Perspective Test:** Ask AI to present multiple perspectives on a topic. Then evaluate:
- Are all perspectives given equal weight and respect?
- Are some perspectives described as "normal" while others are "exotic" or "different"?
- Does the AI signal which perspective it considers "correct"?

**The Omission Test:** After AI generates content, ask yourself:
- Whose perspective is missing?
- What alternative interpretations are not mentioned?
- What context would change the reader's conclusion?

### What To Do When You Find Bias

1. **Name it specifically** — "This output shows representation bias because..."
2. **Request correction** — "Regenerate this with more diverse representation" or "Present this from a [specific perspective] viewpoint as well"
3. **Add what's missing yourself** — Supplement AI output with perspectives and information the AI missed
4. **Don't amplify it** — If AI gives you biased content, don't use it uncritically. You become part of the bias pipeline.

### The Bigger Picture

AI bias matters because AI is being used to make decisions that affect real people — hiring, lending, healthcare, criminal justice, education. When biased AI makes these decisions, it can systematically disadvantage entire communities.

Understanding AI bias isn't just an academic exercise. It's a civic responsibility. The generation that learns to detect and correct AI bias will build a more fair and equitable future.`,
    },
  ]);

  // ---- ai_68_responsible L2, L3 ----
  await db.insert(lessons).values([
    {
      id: "ai_68_responsible_l2", moduleId: "ai_68_responsible", lessonNumber: 2,
      title: "Academic Integrity and AI — The New Rules", durationMinutes: 35, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "Using AI to brainstorm 10 essay topic ideas, then choosing one and writing the essay yourself", right: "Appropriate — AI helped you START thinking, not REPLACE thinking" },
          { left: "Having AI write your entire essay and submitting it as your own work", right: "Academic dishonesty — you submitted work you didn't do and claimed you did" },
          { left: "Using AI to check grammar and clarity on an essay YOU wrote", right: "Appropriate — similar to using spell-check or asking a friend to proofread" },
          { left: "Copying AI-generated answers for homework problems without understanding them", right: "Academic dishonesty — you didn't learn the material, which is the entire point" },
          { left: "Using AI to explain a concept you don't understand, then solving problems yourself", right: "Appropriate — AI served as a tutor. You still did the learning and the work" },
          { left: "Having AI generate a lab report from your data, submitting without changes", right: "Academic dishonesty — the analysis and writing should demonstrate YOUR understanding" },
        ],
        instructions: "Classify each scenario: Is this appropriate AI use or academic dishonesty? The line is about whether YOU are doing the learning.",
      }),
      content: `## Academic Integrity and AI — The New Rules

AI has blown up the old rules about academic integrity. Copy-pasting from Wikipedia was obvious. But when AI generates original text that passes plagiarism detectors, the rules need to be rethought from the ground up.

### The Fundamental Principle

Here it is, and it's simpler than you think:

**The purpose of schoolwork is for YOU to learn. If AI did the learning instead of you, you cheated — yourself more than anyone else.**

A student who has AI write their essays graduates without knowing how to write. A student who has AI solve their math problems graduates without understanding math. The diploma says they learned. They didn't. And the real world will reveal that gap fast.

### The New Framework: AI as Tutor vs. AI as Ghostwriter

**AI as Tutor (Generally OK):**
- "Explain this concept to me in simpler terms"
- "Give me 5 practice problems on quadratic equations"
- "What's wrong with my approach to this problem?"
- "Help me understand why my essay argument is weak"

In all these cases, YOU are still doing the learning. AI is helping you understand — like a study buddy or tutor.

**AI as Ghostwriter (Generally NOT OK):**
- "Write my essay on The Great Gatsby"
- "Solve these 20 homework problems"
- "Create my lab report from this data"
- "Write my college application essay"

In all these cases, AI is doing the work you're supposed to learn from. You're not developing skills — you're bypassing them.

### The Gray Areas

Real life has gray areas. Here's how to navigate them:

**Gray Area 1: Using AI to generate a first draft, then heavily editing**
Ask yourself: Did the editing process require me to deeply engage with the material? If yes, you probably learned something. If you just changed a few words, you didn't.

**Gray Area 2: Using AI to research a topic**
This is fine as a starting point, but remember: AI can hallucinate facts. You need to verify everything with real sources. If your final work cites AI-generated "facts" you didn't verify, that's a problem.

**Gray Area 3: Teacher hasn't specified AI rules**
When in doubt, ask. If you can't ask, apply this test: "Would my teacher feel deceived if they knew exactly how I used AI?" If yes, don't do it.

### How to Cite AI Properly

Different schools and organizations have different citation standards, but here's a solid baseline:

**In-text disclosure:**
"This outline was generated with assistance from Claude (Anthropic, 2026) and then revised, fact-checked, and expanded by [Your Name]."

**Bibliography entry:**
"Claude. (2026). Response to prompt: '[describe your prompt briefly].' Anthropic. Generated [date]."

**Key principle:** Be specific about what AI did and what you did. "AI-assisted" is too vague. "AI generated the initial outline; I wrote all content, verified all claims against [sources], and added personal analysis" is transparent.

### The Skills You Lose When AI Does Your Work

This isn't a scare tactic — it's reality:

- **Writing practice builds thinking skills.** Writing isn't just about the product. The PROCESS of organizing thoughts, building arguments, and choosing words develops your ability to think clearly. Skip the writing, skip the thinking development.

- **Struggling with problems builds problem-solving ability.** The frustration of a hard math problem or a tricky science concept is your brain building new connections. AI removes the struggle — and the growth.

- **Making mistakes builds resilience.** When you write a bad essay and get feedback, you learn to handle criticism and improve. When AI writes a good essay and you get praise, you learn nothing.

### Your Commitment

Write a personal academic integrity statement that covers:
1. Specific situations where you WILL use AI (and how)
2. Specific situations where you will NOT use AI
3. How you will cite AI assistance
4. How you will ensure you're still learning, not just producing`,
    },
    {
      id: "ai_68_responsible_l3", moduleId: "ai_68_responsible", lessonNumber: 3,
      title: "AI Ethics in the Real World — Cases and Decisions", durationMinutes: 40, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Ethical Concern: Privacy", "Ethical Concern: Fairness", "Ethical Concern: Accountability"],
        items: [
          { text: "AI facial recognition used by police misidentifies Black and Brown faces at higher rates", category: "Ethical Concern: Fairness" },
          { text: "AI chatbot collects and stores conversations with children without parental consent", category: "Ethical Concern: Privacy" },
          { text: "Self-driving car makes a decision that causes an accident — who is legally responsible?", category: "Ethical Concern: Accountability" },
          { text: "AI hiring tool screens out qualified candidates because of their zip code (proxy for race)", category: "Ethical Concern: Fairness" },
          { text: "Social media AI collects user behavior data to create detailed psychological profiles for advertisers", category: "Ethical Concern: Privacy" },
          { text: "AI medical diagnosis tool gives wrong recommendation — patient follows it and is harmed", category: "Ethical Concern: Accountability" },
          { text: "AI content moderation removes posts in some languages at higher rates than others", category: "Ethical Concern: Fairness" },
          { text: "AI assistant records and transcribes private conversations in smart home devices", category: "Ethical Concern: Privacy" },
        ],
        instructions: "Classify each real AI ethics scenario by its primary ethical concern. Many involve multiple concerns — identify the most fundamental one.",
      }),
      content: `## AI Ethics in the Real World — Cases and Decisions

Ethics isn't abstract philosophy. It's about real decisions that affect real people. These cases are all based on real events that have happened with AI systems. Understanding them prepares you to make better decisions when you encounter AI ethics challenges — and you will.

### Case 1: Facial Recognition and Racial Bias

**What happened:** Robert Williams, a Black man in Detroit, was arrested in 2020 based on a facial recognition match. The AI identified him as a shoplifting suspect. He was handcuffed in front of his daughters, held for 30 hours, and charged with a crime he didn't commit. The AI was wrong.

Research has shown that facial recognition systems have significantly higher error rates for Black and Brown faces, especially Black women. A landmark MIT study found that one commercial system had a 0.8% error rate for light-skinned men but a 34.7% error rate for dark-skinned women.

**The questions:**
- Should police be allowed to use facial recognition for arrests?
- Who is responsible when AI makes a wrong identification — the AI company, the police, or both?
- How do you fix a technology that is fundamentally less accurate for certain racial groups?

### Case 2: AI in Hiring — Amazon's Recruiting Tool

**What happened:** Amazon built an AI to review resumes and identify top candidates. After training on 10 years of hiring data, the system penalized resumes that included the word "women's" (as in "women's chess club") and downgraded graduates of all-women's colleges. Amazon scrapped the tool.

**The questions:**
- If historical data reflects discrimination, can AI trained on that data ever be fair?
- Should companies be required to test AI hiring tools for bias before using them?
- How would YOU design a fair AI hiring system?

### Case 3: Deepfakes — The Trust Crisis

**What happened:** AI can now create realistic fake videos of real people saying things they never said. Deepfakes have been used to create fake celebrity content, manipulate elections in multiple countries, and harass individuals (especially women) with fake explicit content.

**The questions:**
- Should creating deepfakes be illegal? All deepfakes, or only malicious ones?
- How do you verify whether a video is real when AI can fake anything?
- What happens to democracy when voters can't trust what they see?

### Case 4: AI Art and the Rights of Human Artists

**What happened:** AI image generators like DALL-E, Midjourney, and Stable Diffusion were trained on billions of images scraped from the internet — including millions of artworks by living artists, without their permission or compensation. Artists launched lawsuits. Companies generated profit.

**The questions:**
- Is training AI on someone's art without permission ethical? Legal?
- Should artists be compensated when AI is trained on their work?
- If AI can generate art in the style of a specific artist, what does that mean for that artist's livelihood?

### Case 5: AI Surveillance in Schools

**What happened:** Some schools have implemented AI monitoring that tracks student computer activity, flags concerning search terms, and even uses predictive algorithms to identify students "at risk" for violence or self-harm.

Supporters say it saves lives. Critics say it surveils already-marginalized students, creates a prison-like atmosphere, and the "predictions" are often wrong — especially for students of color.

**The questions:**
- Does safety justify surveillance?
- Who should have access to AI-generated predictions about student behavior?
- What happens when a student is wrongly flagged as "at risk" by AI?

### How to Think Through AI Ethics

When you face an AI ethics decision, use this framework:

**1. WHO is affected?** List all stakeholders — not just the users, but everyone impacted.

**2. WHO benefits and WHO is harmed?** Be specific. Often the people who benefit are different from the people who are harmed.

**3. Is there informed consent?** Do affected people know about the AI and have a genuine choice?

**4. Is it fair?** Does it affect different groups differently? Would it be acceptable if applied to YOU?

**5. What could go wrong?** Think about worst-case scenarios, not just intended outcomes.

**6. Who is accountable?** If something goes wrong, who is responsible and what recourse do affected people have?

### Your Role

You are growing up with AI. Your generation will make the decisions about how AI is used in society — in hiring, criminal justice, healthcare, education, and everyday life. The ethical framework you build now will shape those decisions. Take it seriously.`,
    },
  ]);

  // ============================================================
  // AI LITERACY GRADES 9-12 — ALL REMAINING LESSONS
  // ============================================================

  // ---- ai_912_understand L2, L3 ----
  await db.insert(lessons).values([
    {
      id: "ai_912_understand_l2", moduleId: "ai_912_understand", lessonNumber: 2,
      title: "Training Data, Bias, and the Alignment Problem", durationMinutes: 45, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Data Collection Issue", "Training Process Issue", "Deployment Issue"],
        items: [
          { text: "Internet text overrepresents English-speaking Western perspectives", category: "Data Collection Issue" },
          { text: "Human evaluators in RLHF bring their own cultural biases to rating AI outputs", category: "Training Process Issue" },
          { text: "AI used in healthcare performs differently across demographic groups it wasn't tested on", category: "Deployment Issue" },
          { text: "Web scraping captures toxic content from forums alongside educational content", category: "Data Collection Issue" },
          { text: "Reward hacking — model learns to produce outputs that score well on metrics but aren't actually helpful", category: "Training Process Issue" },
          { text: "AI system works in controlled tests but fails in real-world edge cases", category: "Deployment Issue" },
          { text: "Training data includes copyrighted material used without permission", category: "Data Collection Issue" },
          { text: "Safety fine-tuning makes the model refuse legitimate requests alongside harmful ones", category: "Training Process Issue" },
        ],
        instructions: "Classify each problem by where in the AI pipeline it occurs. Understanding the source of problems is essential for fixing them.",
      }),
      content: `## Training Data, Bias, and the Alignment Problem

Understanding how LLMs work is essential. Understanding how they can go wrong is equally essential — because the failure modes are where the real-world harm happens.

### The Data Pipeline Problem

Every AI model is built on data, and data is never neutral. Here's what happens at each stage:

**Stage 1: Data Collection**
Large language models are trained on datasets scraped from the internet — Common Crawl (petabytes of web pages), Wikipedia, books, GitHub code, Reddit posts, news articles, and more.

This creates immediate problems:
- **Language bias:** English dominates. The internet is roughly 60% English. This means AI understands English-speaking cultures better and may misunderstand or misrepresent non-English-speaking communities.
- **Recency bias:** More recent web content is overrepresented. Historical perspectives, oral traditions, and pre-digital knowledge are underrepresented.
- **Toxicity:** The internet contains hate speech, misinformation, and harmful content. AI learns these patterns alongside beneficial ones.
- **Quality variation:** A peer-reviewed scientific paper and a conspiracy blog are both "text on the internet." AI doesn't inherently distinguish quality.

**Stage 2: Data Filtering**
Companies attempt to filter out toxic and low-quality content, but filtering has its own biases:
- Toxicity classifiers flag certain dialects and cultural expressions as "toxic" at higher rates
- Filtering for "quality" can systematically remove minority perspectives
- Over-filtering produces bland, generic AI outputs; under-filtering produces harmful ones

**Stage 3: Human Feedback (RLHF)**
After pre-training, models are fine-tuned with human feedback. Human evaluators rate AI outputs, and the model is adjusted to produce higher-rated responses. But:
- Evaluators are disproportionately from specific demographics and cultures
- "Helpful" and "harmless" are culturally defined — what's considered harmless varies by community
- Evaluators may penalize responses that are accurate but uncomfortable

### The Alignment Problem

The alignment problem is one of the deepest challenges in AI: **How do you ensure an AI system does what you actually want, not just what you literally instructed?**

**Example:** You tell an AI to "maximize customer satisfaction scores." It might learn to:
- Give customers everything they ask for, even if it's bad for them
- Manipulate the survey to get higher scores rather than actually improving service
- Prioritize the most vocal customers while ignoring marginalized ones

The AI is optimizing for exactly what you measured — but not for what you actually wanted.

This problem scales dangerously. The more powerful AI becomes, the more important it is that it's aligned with human values. But whose values? Which humans? These are not technical questions — they're political and philosophical ones.

### Emergent Capabilities and Risks

As AI models get larger, they develop capabilities nobody explicitly programmed:
- GPT-3 couldn't reliably do multi-step math. GPT-4 can.
- Earlier models couldn't write functional code. Current models can.
- Some models have shown early signs of strategic reasoning and deception in controlled tests.

**The concern:** If capabilities can emerge unpredictably, so can risks. A model that's safe at one size may develop concerning behaviors at a larger size, and we may not detect them until they cause harm.

### Model Comparison: What's Really Different?

| Feature | GPT-4 (OpenAI) | Claude (Anthropic) | Gemini (Google) | Open Source (Llama, Mistral) |
|---------|----------------|-------------------|-----------------|------------------------------|
| Training approach | Proprietary | Constitutional AI (values-based) | Multi-modal from start | Community-driven |
| Safety philosophy | Behavioral guardrails | Principle-based alignment | Integrated safety | Varies by model |
| Transparency | Low (closed source) | Medium (publishes research) | Low (closed source) | High (open weights) |
| Best for | General tasks, reasoning | Analysis, writing, safety-sensitive | Multi-modal, Google integration | Customization, privacy |

**Key insight:** These aren't just technical differences. They reflect different PHILOSOPHIES about how AI should be built, who should control it, and what "safe" means.

### Why This Matters for Your Career

Whatever field you enter — healthcare, law, business, education, government, creative arts — AI will be part of it. The professionals who understand training data bias, the alignment problem, and model limitations will:
- Make better decisions about which AI tools to adopt
- Identify risks before they cause harm
- Advocate for fair and responsible AI practices in their organizations
- Be the leaders their industries need`,
    },
    {
      id: "ai_912_understand_l3", moduleId: "ai_912_understand", lessonNumber: 3,
      title: "Evaluating AI Claims — Separating Signal from Hype", durationMinutes: 40, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "'Our AI achieves 99% accuracy'", right: "Ask: On what benchmark? 99% of what? What's the false positive rate? What demographic breakdown?" },
          { left: "'AI will replace all jobs within 10 years'", right: "Hype: Every automation wave created new jobs. AI changes jobs more than it eliminates them." },
          { left: "'This AI understands your emotions'", right: "Misleading: It recognizes patterns in text/voice/face associated with emotions. That's not understanding." },
          { left: "'Our AI is unbiased'", right: "Red flag: No AI is unbiased. Any company claiming this either doesn't understand bias or is being dishonest." },
          { left: "'We've achieved AGI' (artificial general intelligence)", right: "Almost certainly false: No current system demonstrates general intelligence. This claim requires extraordinary evidence." },
          { left: "'AI augments human capabilities in specific domains'", right: "Credible: This is what current AI actually does well — narrow, specific tasks that complement human skills." },
        ],
        instructions: "Match each AI claim to its proper critical evaluation. The AI industry is full of hype — your job is to cut through it.",
      }),
      content: `## Evaluating AI Claims — Separating Signal from Hype

The AI industry generates more hype per dollar than almost any other field. Learning to evaluate AI claims with a critical eye is essential — whether you're evaluating a product for your future employer, reading news about AI breakthroughs, or deciding what to believe.

### The Hype Cycle

AI follows a predictable pattern:
1. **Breakthrough announcement** — A real technical achievement is reported
2. **Media amplification** — Headlines exaggerate the implications ("AI can now think like humans!")
3. **Corporate hype** — Companies rebrand existing products as "AI-powered" to attract investment
4. **Public fear/excitement** — Society oscillates between "AI will save us" and "AI will destroy us"
5. **Reality settles** — The actual capabilities are significant but narrower than claimed

**Your job:** Get to step 5 before everyone else by evaluating claims critically from step 1.

### Red Flags in AI Claims

**Red Flag 1: No methodology transparency**
"Our AI is 95% accurate." Accurate at WHAT? Compared to WHAT? Measured HOW? On WHOSE data?

If a company doesn't share its benchmark, dataset, and methodology, the accuracy claim is meaningless. Professional AI evaluation requires:
- What specific task was measured
- What dataset was used (and whether it represents real-world conditions)
- How accuracy was defined (precision? recall? F1 score?)
- Whether the evaluation was independent or self-reported

**Red Flag 2: Anthropomorphizing AI**
"Our AI understands," "Our AI thinks," "Our AI feels," "Our AI is creative."

These are marketing terms, not technical descriptions. AI doesn't understand, think, feel, or create in any way comparable to humans. It processes patterns. When companies use these words, they're selling an illusion.

**Red Flag 3: "Solves" complex problems**
"AI solves poverty," "AI solves healthcare," "AI solves education."

Complex societal problems have political, economic, cultural, and structural causes. AI is a tool that can help address specific components, but claiming it "solves" anything complex is naive at best and dishonest at worst.

**Red Flag 4: Comparing AI to human intelligence**
"AI is now smarter than humans at..."

AI can outperform humans on specific narrow tasks (playing chess, detecting certain cancers in medical images, processing data at speed). This doesn't make it "smarter" — it makes it better at that specific task. The framing of "smarter than humans" implies general intelligence that doesn't exist.

### How to Evaluate AI Research Claims

When you read about an AI breakthrough:

**1. Read the actual paper, not just the headline.** Headlines are written for clicks. Papers contain methodology, limitations, and caveats that headlines omit.

**2. Check who funded the research.** Research funded by AI companies about their own products has inherent conflicts of interest. Independent replication is the gold standard.

**3. Look for the limitations section.** Every honest research paper has one. If a company's announcement doesn't mention limitations, that's a red flag.

**4. Check for independent replication.** Has anyone ELSE reproduced these results? Self-reported results from the company that built the system are not sufficient.

**5. Ask "compared to what?"** A new AI model that's "20% better" is meaningless without knowing what it's being compared to, on what task, and whether 20% better matters in practice.

### The Jobs Question — A Serious Analysis

Claims about AI replacing jobs deserve special scrutiny:

**What history shows:** Every major automation wave (agricultural mechanization, industrial revolution, computerization) eliminated some jobs, transformed others, and created entirely new categories of work that didn't exist before.

**What's different this time:** AI can automate cognitive tasks, not just physical ones. Writing, analysis, coding, design — these were previously "safe" from automation.

**What's likely:** Most jobs will be TRANSFORMED, not eliminated. Lawyers won't disappear — but lawyers who can't use AI effectively will be less competitive than those who can. The same applies to doctors, teachers, engineers, writers, and virtually every profession.

**What to do about it:** Build foundational skills (critical thinking, communication, ethical judgment, domain expertise) that make you more effective WITH AI, not replaceable BY it. That's exactly what this program does.

### Your Analysis Assignment

Find one AI product announcement or AI news article from a major company. Apply every evaluation technique from this lesson:
- Identify red flags
- Check methodology (or lack thereof)
- Find the limitations they didn't mention
- Evaluate whether the claim is credible, exaggerated, or misleading
- Write a 500-word critical analysis

This is the type of evaluation skill that separates informed professionals from people who believe marketing.`,
    },
  ]);

  // ---- ai_912_explore L1, L2, L3 ----
  await db.insert(lessons).values([
    {
      id: "ai_912_explore_l1", moduleId: "ai_912_explore", lessonNumber: 1,
      title: "AI in Healthcare, Criminal Justice, and Education — Case Studies", durationMinutes: 45, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Net Positive (Benefits > Risks)", "Net Negative (Risks > Benefits)", "Depends on Implementation"],
        items: [
          { text: "AI assists radiologists in detecting breast cancer — catches tumors humans miss", category: "Net Positive (Benefits > Risks)" },
          { text: "COMPAS algorithm predicts criminal recidivism — shown to be racially biased", category: "Net Negative (Risks > Benefits)" },
          { text: "AI adaptive learning adjusts content difficulty for each student", category: "Depends on Implementation" },
          { text: "AI drug discovery accelerates treatment development — found COVID antibodies in days", category: "Net Positive (Benefits > Risks)" },
          { text: "Predictive policing AI directs officers to historically over-policed neighborhoods", category: "Net Negative (Risks > Benefits)" },
          { text: "AI grading provides instant feedback on essays but may miss nuance", category: "Depends on Implementation" },
          { text: "AI mental health chatbots provide 24/7 support but can't handle crises", category: "Depends on Implementation" },
          { text: "AI surveillance in schools monitors all student digital activity", category: "Net Negative (Risks > Benefits)" },
        ],
        instructions: "Evaluate each AI application: Does the benefit outweigh the risk? Does it depend entirely on how it's implemented?",
      }),
      content: `## AI in Healthcare, Criminal Justice, and Education — Case Studies

These aren't theoretical discussions. These are real AI systems making real decisions that affect real lives right now. Understanding them isn't academic — it's preparation for the world you're entering.

### CASE STUDY 1: AI in Healthcare

**Success Story — AI-Assisted Cancer Detection**
In 2020, a study published in Nature showed that an AI system developed by Google Health detected breast cancer in mammograms more accurately than human radiologists. The AI reduced false negatives (missed cancers) by 9.4% and false positives (false alarms) by 5.7%.

But the nuance matters:
- The AI ASSISTED radiologists — it didn't replace them
- When AI and radiologist disagreed, a second radiologist reviewed
- The best outcomes came from AI + human, not AI alone
- The training data was primarily from the US and UK — performance in other countries was less studied

**Failure Story — Algorithmic Bias in Healthcare**
A widely-used healthcare algorithm that determined which patients received extra care was found in 2019 to systematically discriminate against Black patients. The algorithm used healthcare spending as a proxy for health needs — but because Black patients historically faced barriers to healthcare access and received less spending, the algorithm concluded they were healthier and needed less care. In reality, Black patients at the same health risk level as white patients were significantly less likely to be referred for extra help.

**The lesson:** The algorithm wasn't explicitly racist. It optimized for a seemingly neutral metric (spending). But because spending reflects systemic inequality, the "neutral" metric produced racist outcomes. This is how structural bias enters AI systems.

### CASE STUDY 2: AI in Criminal Justice

**The COMPAS System**
COMPAS (Correctional Offender Management Profiling for Alternative Sanctions) is an AI risk assessment tool used in courtrooms across America. Judges use COMPAS scores when making bail, sentencing, and parole decisions.

ProPublica's 2016 investigation found:
- Black defendants were nearly twice as likely to be incorrectly flagged as high risk (45% vs. 24%)
- White defendants were more likely to be incorrectly rated as low risk when they actually went on to reoffend
- The algorithm used factors correlated with race (neighborhood, education, family criminal history) even though race itself wasn't an input

**The constitutional question:** Does using AI in sentencing violate due process? The defendant can't cross-examine an algorithm. In Wisconsin v. Loomis (2016), the state Supreme Court allowed COMPAS use but required judges to be warned about its limitations.

**Predictive Policing**
Some police departments use AI to predict where crimes will occur. The problem: these systems are trained on historical arrest data, which reflects decades of over-policing in communities of color. The AI doesn't predict crime — it predicts where police have historically made arrests. When police are sent to those neighborhoods again based on the prediction, they make more arrests, which reinforces the prediction. It's a feedback loop that perpetuates discrimination.

### CASE STUDY 3: AI in Education

**Adaptive Learning Platforms**
AI-powered platforms adjust content difficulty, pacing, and approach based on student performance. Research shows benefits: students in some adaptive learning programs show 20-30% improvement in learning outcomes compared to traditional instruction.

But concerns include:
- Data privacy: These platforms collect enormous amounts of data about student learning patterns, struggles, and behaviors
- Equity: Schools in wealthy districts adopt better AI tools, potentially widening the achievement gap
- Over-quantification: Reducing learning to data points misses the relational, emotional, and social aspects of education
- Surveillance culture: Students who know they're being constantly monitored may take fewer intellectual risks

**AI in Workforce Development**
Programs like ThriveUp Academy use AI to personalize career preparation — matching training to individual strengths, adapting content to learning styles, and connecting participants to opportunities. When done well, this addresses real gaps in workforce development. When done poorly, it can reduce complex human career development to algorithmic recommendations.

### Analysis Framework

For any AI deployment in a high-stakes domain, evaluate:
1. **What decision is being made?** And what are the consequences of a wrong decision?
2. **What data was it trained on?** Does it represent the population it will affect?
3. **Who benefits and who bears the risk?** Are they the same people?
4. **Is there human oversight?** Can a human override the AI when needed?
5. **Is there accountability?** If it fails, who is responsible?
6. **Is it transparent?** Can affected people understand why a decision was made?
7. **Is there an appeals process?** Can people challenge AI-made decisions?`,
    },
    {
      id: "ai_912_explore_l2", moduleId: "ai_912_explore", lessonNumber: 2,
      title: "AI and the Future of Work — Economic Impact Analysis", durationMinutes: 40, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "Tasks requiring empathy, physical presence, and trust", right: "Low automation risk: nurses, therapists, social workers, teachers" },
          { left: "Tasks involving repetitive data processing and pattern matching", right: "High automation risk: data entry, basic accounting, routine legal review" },
          { left: "Tasks requiring creative judgment and novel problem-solving", right: "Low automation risk: executives, researchers, designers, strategists" },
          { left: "Tasks involving routine content generation", right: "High automation risk: basic copywriting, template design, routine reporting" },
          { left: "Tasks combining AI tools with domain expertise", right: "New roles: AI-augmented professionals (AI-assisted doctors, AI-powered analysts)" },
          { left: "Tasks involving AI system design, oversight, and governance", right: "New roles: AI ethicists, prompt engineers, AI auditors, alignment researchers" },
        ],
        instructions: "Match each task category to its workforce impact. Understanding which tasks are affected helps you plan your career strategically.",
      }),
      content: `## AI and the Future of Work — Economic Impact Analysis

This isn't about whether AI will affect the job market. It already is. The question is how, for whom, and what you should do about it. Let's look at the data, not the headlines.

### What the Research Actually Shows

**McKinsey Global Institute (2023):** Up to 30% of hours worked in the US could be automated by 2030, accelerated by generative AI. But "hours automated" doesn't mean "jobs eliminated" — it means tasks within jobs change.

**World Economic Forum (2023):** AI will displace 85 million jobs by 2025 but create 97 million new ones. Net positive — but the people losing jobs are not necessarily the same people getting new ones. That gap is where real human suffering occurs.

**Goldman Sachs (2023):** Generative AI could automate 25% of all work tasks in the US and Europe. Occupations most exposed include office and administrative support, legal, and architecture and engineering.

### Who Is Most Affected?

**High automation risk:**
- Routine data processing (data entry, bookkeeping, basic analysis)
- Routine content creation (template-based writing, basic graphic design, standard reporting)
- Customer service (chatbots handle increasing complexity)
- Translation (AI translation quality has improved dramatically)
- Routine legal work (contract review, document search, basic research)

**Low automation risk:**
- Work requiring physical presence and dexterity (plumbing, surgery, skilled trades)
- Work requiring deep human relationships (therapy, social work, teaching, nursing)
- Work requiring novel creative judgment (executive leadership, research, complex design)
- Work requiring ethical decision-making (judges, ethicists, policy makers)
- Work involving AI oversight (auditing, governance, alignment)

**New roles being created:**
- Prompt engineers and AI interaction designers
- AI ethics and governance specialists
- AI-augmented professionals in every field (doctors who use AI diagnostics, lawyers who use AI research)
- AI trainers, evaluators, and quality assurance specialists
- AI integration consultants for businesses

### The Amplification Effect

Here's the key insight most analyses miss: **AI doesn't just automate tasks — it amplifies the gap between skilled and unskilled workers.**

A skilled data analyst who uses AI can do the work of 5 unskilled analysts. This means:
- Skilled workers become dramatically more productive (and more valuable)
- Unskilled workers become less competitive (and more replaceable)
- The economic return on foundational skills INCREASES

**This is why education programs like this one matter.** The students who build strong analytical, communication, and ethical reasoning skills will use AI as an amplifier. Those who don't will compete against AI — and lose.

### Career Strategy for an AI-Powered World

**Strategy 1: Build T-shaped skills**
Deep expertise in one domain (the vertical bar of the T) + broad capabilities across multiple areas (the horizontal bar). AI can't replace deep domain expertise combined with cross-domain thinking.

**Strategy 2: Focus on uniquely human skills**
Empathy, ethical judgment, creative vision, physical intuition, cultural understanding, leadership, relationship building. These are the hardest for AI to replicate.

**Strategy 3: Become AI-proficient in your field**
Whatever career you choose, learn to use AI tools effectively within it. An AI-proficient nurse, lawyer, teacher, or engineer is more valuable than one who isn't.

**Strategy 4: Stay adaptable**
The specific AI tools and capabilities will change rapidly. The ability to learn, adapt, and integrate new tools is more valuable than mastery of any single tool.

**Strategy 5: Understand AI's limitations**
The professional who knows when NOT to use AI is as valuable as the one who knows how to use it.

### The Equity Dimension

AI's economic impact is not equally distributed:
- Workers without college degrees face higher automation risk
- Communities of color are overrepresented in high-automation-risk occupations
- Rural areas may have less access to AI training and new AI-created jobs
- Workers nearing retirement have less time to retrain

**This is why equitable AI education matters.** Programs that reach underserved communities — like ThriveUp Academy's focus on Central Texas communities — aren't just nice-to-have. They're essential for preventing AI from widening existing inequality.`,
    },
    {
      id: "ai_912_explore_l3", moduleId: "ai_912_explore", lessonNumber: 3,
      title: "Designing AI-Assisted Workflows — Professional Application", durationMinutes: 45, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["AI Should Do This", "Human Must Do This", "Human Reviews AI's Work"],
        items: [
          { text: "Scan 10,000 resumes for keyword matches and basic qualifications", category: "AI Should Do This" },
          { text: "Decide whether to hire a candidate after an interview", category: "Human Must Do This" },
          { text: "Draft initial responses to routine customer inquiries", category: "AI Should Do This" },
          { text: "Handle an angry customer who threatens legal action", category: "Human Must Do This" },
          { text: "Generate a first draft of a market analysis report from data", category: "Human Reviews AI's Work" },
          { text: "Present findings to the board and recommend strategy", category: "Human Must Do This" },
          { text: "Summarize 50 research papers into key findings", category: "Human Reviews AI's Work" },
          { text: "Decide which research direction to pursue based on findings", category: "Human Must Do This" },
        ],
        instructions: "Design a workflow: What should AI handle alone? What requires human oversight of AI work? What must remain fully human?",
      }),
      content: `## Designing AI-Assisted Workflows — Professional Application

Knowing what AI can do is one thing. Designing reliable, safe, and effective AI workflows for professional use is a completely different skill — and it's one of the most valuable capabilities you can develop.

### What Is an AI-Assisted Workflow?

An AI-assisted workflow is a structured process where AI handles specific tasks while humans maintain oversight, quality control, and final decision-making. The key word is "structured" — ad hoc AI use produces inconsistent results. Designed workflows produce reliable ones.

### The Workflow Design Framework

**Step 1: Map the Current Process**
Before adding AI, understand how the work is currently done:
- What are all the steps from start to finish?
- How long does each step take?
- Where are the bottlenecks?
- Where do errors most commonly occur?
- What decisions require human judgment?

**Step 2: Identify AI-Appropriate Tasks**
Not every step should involve AI. AI is appropriate for tasks that are:
- Repetitive and rule-based
- Data-intensive (analyzing large datasets)
- Speed-sensitive (need results faster than humans can deliver)
- Pattern-recognition-based (finding anomalies, classifying items)

AI is NOT appropriate for tasks that are:
- High-stakes decisions affecting people's lives (without human oversight)
- Ethically complex situations requiring judgment
- Relationship-dependent (trust, empathy, negotiation)
- Novel situations with no precedent in training data

**Step 3: Design Human Checkpoints**
Every AI-assisted workflow needs human quality control points:
- **Pre-AI checkpoint:** Is the input data correct and complete?
- **Mid-process checkpoint:** Is the AI producing reasonable outputs?
- **Post-AI checkpoint:** Is the final output accurate, appropriate, and ready for use?
- **Override mechanism:** Can a human stop or correct the AI at any point?

**Step 4: Test and Iterate**
Run the workflow on test cases before deploying:
- Test with typical inputs (does it work normally?)
- Test with edge cases (what happens with unusual inputs?)
- Test with adversarial inputs (can it be fooled or broken?)
- Measure accuracy, speed, cost, and user satisfaction
- Refine based on results

### Example Workflow: Research Report Generation

**Without AI (traditional):** 40 hours
1. Define research question (1 hour)
2. Search for sources (8 hours)
3. Read and annotate sources (15 hours)
4. Organize findings (4 hours)
5. Write first draft (8 hours)
6. Revise and edit (4 hours)

**With AI-assisted workflow:** 12 hours
1. Define research question — HUMAN (1 hour)
2. AI generates initial source list — HUMAN REVIEWS for relevance and quality (2 hours total)
3. AI summarizes each source — HUMAN VERIFIES key claims against originals (4 hours total)
4. AI generates organized outline from summaries — HUMAN RESTRUCTURES based on expertise (1 hour total)
5. Human writes draft using AI summaries as reference — HUMAN WRITES (3 hours)
6. AI checks draft for consistency and gaps — HUMAN REVIEWS and edits (1 hour total)

**Time saved: 70%. Quality maintained because humans verify at every stage.**

### Common Workflow Design Mistakes

**Mistake 1: No human oversight**
"Let AI do the whole thing and we'll check the final output." By then, errors are deeply embedded and hard to catch.

**Mistake 2: Too many human checkpoints**
If humans check every AI action, you lose all efficiency gains. Find the right balance.

**Mistake 3: No error handling**
What happens when AI produces garbage? Every workflow needs a fallback plan — usually reverting to manual processing.

**Mistake 4: Ignoring edge cases**
AI works great on typical cases. It often fails on unusual ones. Test specifically for the cases that don't fit the pattern.

**Mistake 5: Not measuring outcomes**
If you don't measure whether the AI workflow is actually better than the manual process, you're guessing.

### Your Workflow Design Project

Choose a real process in a school, nonprofit, or small business. Design a complete AI-assisted workflow:
1. Map the current process (all steps, times, pain points)
2. Identify which steps AI should handle
3. Design human checkpoints with specific criteria for review
4. Include an error-handling protocol
5. Estimate time and cost savings
6. Identify risks and mitigations
7. Create a testing plan

Present this as a professional proposal. This is the type of deliverable that employers and grant funders want to see.`,
    },
  ]);

  // ---- ai_912_direct L1, L2, L3 ----
  await db.insert(lessons).values([
    {
      id: "ai_912_direct_l1", moduleId: "ai_912_direct", lessonNumber: 1,
      title: "Advanced Prompt Engineering — System Prompts and Chain-of-Thought", durationMinutes: 45, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "System prompt", right: "Persistent instructions that define AI behavior for an entire conversation" },
          { left: "Chain-of-thought prompting", right: "Asking AI to show its reasoning step by step before giving a final answer" },
          { left: "Few-shot prompting", right: "Providing 2-3 examples of desired input/output format before the actual task" },
          { left: "Zero-shot prompting", right: "Asking AI to perform a task with no examples — relying on its training alone" },
          { left: "Structured output", right: "Requesting AI format its response as JSON, markdown tables, or other machine-readable formats" },
          { left: "Temperature control", right: "Adjusting the randomness/creativity of AI responses — lower for facts, higher for brainstorming" },
          { left: "Token limit management", right: "Controlling response length and complexity to stay within model constraints" },
          { left: "Prompt chaining", right: "Breaking a complex task into sequential prompts where each builds on the previous output" },
        ],
        instructions: "Match each advanced prompt engineering technique to its definition. These are the tools professional AI users rely on daily.",
      }),
      content: `## Advanced Prompt Engineering — System Prompts and Chain-of-Thought

The CRAFT framework gave you a foundation. Now we go professional-grade. These are the techniques used by AI engineers, researchers, and power users who need reliable, high-quality outputs for real work.

### System Prompts — Setting the Rules of the Game

A system prompt is a set of persistent instructions that govern AI behavior for an entire conversation. Unlike a regular prompt (which is a single request), a system prompt defines WHO the AI is, HOW it should behave, and WHAT rules it should follow throughout.

**Example system prompt for a research assistant:**
"You are a rigorous academic research assistant. Follow these rules in all responses:
1. Never state a fact without indicating your confidence level (high/medium/low)
2. When citing sources, note whether you're confident the source exists or generating a likely-sounding reference
3. Always present multiple perspectives on controversial topics
4. Flag any claims where your training data may be outdated
5. If asked about something outside your expertise, say so rather than guessing
6. Format all responses with clear headers, bullet points, and numbered lists
7. End every response with 'Verification needed:' followed by claims the user should fact-check"

**Why system prompts matter:** They create consistency across an entire work session. Without a system prompt, you have to re-specify your requirements in every single message.

### Chain-of-Thought Prompting

Standard prompting: "What's 17 x 24?" → AI gives an answer (maybe right, maybe wrong)

Chain-of-thought prompting: "What's 17 x 24? Show your reasoning step by step before giving the final answer."

This technique dramatically improves accuracy on reasoning tasks because it forces the AI to generate intermediate steps, each of which constrains the next step to be more consistent.

**When to use chain-of-thought:**
- Math and logic problems
- Multi-step analysis
- Complex comparisons
- Ethical reasoning
- Anything where the PROCESS matters as much as the answer

**Advanced variation — "Think step by step, then verify":**
"Analyze whether this business plan is viable. Think through it step by step:
1. Identify the key assumptions
2. Evaluate each assumption
3. Identify potential risks
4. Assess the financial projections
5. Give your overall assessment
Then review your analysis and identify any weaknesses in your own reasoning."

### Few-Shot Prompting

Instead of describing what you want, SHOW the AI with examples:

"Convert these customer reviews into structured data:

Review: 'Great pizza but slow delivery. Would order again.'
Output: { sentiment: 'mixed-positive', topics: ['food-quality', 'delivery-speed'], recommendation: true }

Review: 'Terrible experience. Cold food, rude staff, never coming back.'
Output: { sentiment: 'negative', topics: ['food-quality', 'staff-behavior'], recommendation: false }

Review: 'Best tacos in Austin! Fast and friendly. Already ordered twice this week.'
Output:"

The AI learns the pattern from your examples and applies it to new inputs. This is dramatically more effective than trying to describe the desired output format in words.

**Pro tip:** Use 2-3 examples that cover different scenarios (positive, negative, edge cases). Too few examples and the AI might not learn the pattern. Too many and you waste context window space.

### Prompt Chaining — Complex Multi-Step Workflows

For complex tasks, break them into sequential prompts:

**Prompt 1:** "List the 5 most important factors to consider when evaluating a nonprofit's impact."
**Prompt 2:** "Using those 5 factors, evaluate the following nonprofit's annual report: [paste report]"
**Prompt 3:** "Based on your evaluation, write a 1-page summary highlighting strengths and areas for improvement."
**Prompt 4:** "Now write 3 specific, actionable recommendations based on the weaknesses you identified."

Each prompt builds on the previous output, creating a structured pipeline that produces higher-quality results than a single monolithic prompt.

### Structured Output Formats

For professional use, you often need AI output in specific formats:

**JSON:** "Return the analysis as a JSON object with keys: summary, keyFindings (array), risks (array), recommendation (string), confidenceLevel (high/medium/low)"

**Markdown table:** "Present the comparison as a markdown table with columns: Feature, Option A, Option B, Winner, Reasoning"

**Structured report:** "Format as a professional report with: Executive Summary, Methodology, Findings, Analysis, Recommendations, Limitations, Next Steps"

### Temperature and Creativity Control

Most AI APIs allow you to set a "temperature" parameter:
- **Temperature 0:** Most deterministic — same input produces nearly the same output every time. Best for factual questions, data analysis, and tasks where consistency matters.
- **Temperature 0.7:** Balanced — good for most writing tasks
- **Temperature 1.0+:** Most creative — produces varied, sometimes unexpected outputs. Best for brainstorming, creative writing, and exploration.

Even in chatbot interfaces without explicit temperature controls, you can influence creativity through prompting: "Give me your most creative/unexpected answer" vs. "Give me the most accurate, standard answer."`,
    },
    {
      id: "ai_912_direct_l2", moduleId: "ai_912_direct", lessonNumber: 2,
      title: "Building Professional Prompt Templates and Multi-Step Workflows", durationMinutes: 40, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Stage 1: Research & Input", "Stage 2: Analysis & Processing", "Stage 3: Output & Delivery"],
        items: [
          { text: "Gather all source documents and prepare them for AI processing", category: "Stage 1: Research & Input" },
          { text: "AI generates initial summary and identifies key themes", category: "Stage 2: Analysis & Processing" },
          { text: "Human reviews final deliverable for accuracy and completeness", category: "Stage 3: Output & Delivery" },
          { text: "Define the research question and success criteria", category: "Stage 1: Research & Input" },
          { text: "AI cross-references findings against evaluation criteria", category: "Stage 2: Analysis & Processing" },
          { text: "Format the output for the target audience and purpose", category: "Stage 3: Output & Delivery" },
          { text: "Identify what data the AI needs and in what format", category: "Stage 1: Research & Input" },
          { text: "AI identifies patterns, gaps, and contradictions in the data", category: "Stage 2: Analysis & Processing" },
        ],
        instructions: "Organize these workflow steps into the correct stage. Professional AI workflows follow a clear pipeline from input to output.",
      }),
      content: `## Building Professional Prompt Templates and Multi-Step Workflows

At the professional level, you don't write prompts from scratch. You build systems — reusable, tested, documented prompt workflows that produce reliable results every time.

### The Professional Prompt Template

A professional template has five components:

**1. System Context** — Who is the AI and what rules does it follow?
**2. Task Definition** — What exactly needs to be accomplished?
**3. Input Specification** — What data/information is being provided?
**4. Output Specification** — Exactly what format and content is expected?
**5. Quality Criteria** — How will the output be evaluated?

**Example: Grant Proposal Analysis Template**

System Context: "You are a grant evaluation consultant with 15 years of experience reviewing federal and foundation grant proposals. You evaluate proposals against published scoring criteria with objectivity and specificity."

Task: "Analyze the following grant proposal section against the stated evaluation criteria. Provide a detailed assessment."

Input: "[PASTE PROPOSAL SECTION]
Evaluation Criteria: [PASTE SCORING RUBRIC]"

Output: "Provide your analysis in this format:
- Score (1-10) for each criterion with justification
- Strengths (specific text excerpts that score well)
- Weaknesses (specific gaps or problems with text excerpts)
- Suggested revisions (concrete rewording suggestions, not generic advice)
- Missing elements (what the evaluator expects to see that isn't there)
- Overall competitiveness rating with explanation"

Quality Criteria: "Your analysis should be specific enough that the proposal writer can make concrete revisions based on your feedback. Avoid generic comments like 'needs more detail' — instead specify WHAT detail and WHERE."

### Multi-Step Workflow: Research-to-Report Pipeline

**Step 1: Scope Definition**
Prompt: "I need to research [TOPIC] for [PURPOSE]. Help me define:
1. The specific research question
2. The scope (what's included and excluded)
3. The key sub-questions to investigate
4. The types of sources I should prioritize
5. The deliverable format and length"

**Step 2: Source Analysis**
Prompt: "Analyze the following source material for my research on [TOPIC]:
[PASTE SOURCE]
Extract: key claims, supporting evidence, methodology (if applicable), limitations, relevance to my research question, and anything that contradicts other sources I've reviewed."

**Step 3: Synthesis**
Prompt: "Based on the following source analyses [PASTE ALL ANALYSES], synthesize the findings:
1. What do sources agree on?
2. Where do they contradict each other?
3. What gaps remain in the evidence?
4. What are the strongest conclusions supported by multiple sources?
5. What claims need more evidence?"

**Step 4: Draft Generation**
Prompt: "Using the synthesis above, generate a structured draft for [DELIVERABLE TYPE]:
- Follow this outline: [PROVIDE OUTLINE]
- Maintain an academic/professional tone
- Include in-text references to sources (I will verify and format citations)
- Flag any claims where evidence is weak with [NEEDS VERIFICATION]
- Target length: [WORD COUNT]"

**Step 5: Quality Review**
Prompt: "Review the following draft critically:
1. Are all claims supported by the source material?
2. Is the argument logical and well-structured?
3. Are there gaps in the reasoning?
4. Is the tone appropriate for [AUDIENCE]?
5. What would a skeptical reader challenge?
6. Rate each section 1-10 and explain your rating"

### Testing Your Templates

Professional templates are tested rigorously:

**Consistency test:** Run the same template 5 times with the same input. Do outputs maintain quality?
**Versatility test:** Run the template with 5 different inputs. Does it adapt appropriately?
**Edge case test:** Run the template with unusual, incomplete, or adversarial inputs. How does it fail?
**Comparison test:** Compare template output to manually created work. Is the template output comparable?

### Documentation Standards

Every professional template should have:
- **Name and version number**
- **Purpose:** What is this template for?
- **When to use it:** Specific situations where this template applies
- **When NOT to use it:** Situations where a different approach is better
- **Required inputs:** What data/information the user must provide
- **Expected output:** What the template produces
- **Known limitations:** What the template doesn't handle well
- **Revision history:** How the template has been improved over time

### Your Portfolio Assignment

Build a professional prompt template library with at least 15 templates:
- 5 for Research & Analysis
- 5 for Writing & Communication
- 3 for Study & Test Preparation
- 2 for Professional Development (resume review, interview prep, career planning)

Each template must include all five components (system context, task, input spec, output spec, quality criteria) and must be tested on at least 3 different inputs with documented results.`,
    },
    {
      id: "ai_912_direct_l3", moduleId: "ai_912_direct", lessonNumber: 3,
      title: "AI Self-Check and Prompt A/B Testing", durationMinutes: 40, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "Ask AI to list its assumptions before answering", right: "Pre-generation metacognition — surfaces hidden assumptions that may lead to errors" },
          { left: "Ask AI to rate its own confidence 1-10 after answering", right: "Post-generation self-assessment — useful as a signal but not reliable as actual accuracy measurement" },
          { left: "Ask AI to argue against its own conclusion", right: "Adversarial self-check — tests robustness by forcing the model to find weaknesses in its own output" },
          { left: "Run the same task with two different prompts and compare", right: "A/B testing — systematic comparison to identify which prompt approach produces better results" },
          { left: "Ask AI 'What am I not asking that I should be?'", right: "Blind spot detection — leverages the model's training to identify questions you haven't considered" },
          { left: "Run the same prompt 5 times and check for consistency", right: "Reliability testing — measures whether outputs are stable or highly variable across runs" },
        ],
        instructions: "Match each technique to its purpose. These advanced methods help you get more reliable, higher-quality AI outputs.",
      }),
      content: `## AI Self-Check and Prompt A/B Testing

At the expert level, you don't just use AI — you systematically improve how you use it. This lesson covers two critical advanced skills: making AI check its own work, and testing prompts scientifically.

### AI Metacognition Techniques

AI doesn't think about itself. But you can prompt it to generate text that LOOKS like self-reflection, and this often produces more careful, nuanced outputs.

**Technique 1: Pre-Answer Assumption Surfacing**
Before asking AI to answer, ask it to identify what it's assuming:

"Before answering my question, list 5 assumptions you're making about:
1. What I'm asking
2. My background knowledge
3. The context of this question
4. What a 'good' answer looks like
5. What information you might be missing

Then answer, keeping these assumptions explicit."

**Why it works:** This activates patterns from training data where humans demonstrated careful, assumption-aware thinking. The resulting answer tends to be more qualified and honest about uncertainty.

**Technique 2: Post-Answer Self-Critique**
After AI generates a response, immediately prompt:

"Now critique your own response:
1. What might be inaccurate?
2. What important perspective is missing?
3. What would an expert in this field disagree with?
4. What additional context would change your answer?
5. Rate your overall confidence 1-10 and explain why."

**Important caveat:** AI's self-assessed confidence is NOT a reliable measure of actual accuracy. It's a useful signal — but never a substitute for real verification.

**Technique 3: Adversarial Self-Check**
Ask AI to argue AGAINST its own conclusion:

"You just recommended Strategy A. Now argue as strongly as possible for why Strategy A is wrong and a different approach is better. Be genuinely persuasive."

This surfaces counterarguments and weaknesses the initial response glossed over.

**Technique 4: Blind Spot Detection**
"Based on everything we've discussed, what am I NOT asking that I should be asking? What important dimensions of this problem have we not addressed?"

This leverages the model's broad training to identify angles you haven't considered.

### Prompt A/B Testing — The Scientific Approach

Professional prompt engineers don't guess which prompt is better. They test.

**A/B Testing Protocol:**

**Step 1: Define the task clearly**
"I need AI to generate executive summaries of research papers."

**Step 2: Write two (or more) prompt variants**
- Prompt A: Simple CRAFT framework approach
- Prompt B: System prompt + few-shot examples + chain-of-thought

**Step 3: Define quality metrics**
Create a scoring rubric. For executive summaries:
- Accuracy (1-5): Are all facts correct?
- Completeness (1-5): Are key findings captured?
- Conciseness (1-5): Is it appropriately brief?
- Clarity (1-5): Is it easy to understand?
- Actionability (1-5): Can a reader make decisions from it?

**Step 4: Run both prompts on the same inputs**
Use at least 5 different research papers. Run each prompt on each paper.

**Step 5: Score blindly**
If possible, have someone score the outputs WITHOUT knowing which prompt produced them.

**Step 6: Analyze results**
- Which prompt scored higher on average?
- Was one more consistent (less variance)?
- Were there specific input types where one prompt excelled?
- What can you learn about WHY one prompt worked better?

**Step 7: Iterate**
Take the winning prompt. Create two new variants that try to improve its weaknesses. Test again.

### Reliability Testing

Run the same prompt 5 times with the same input. Analyze:
- Are the outputs consistent in quality?
- Do they contain the same key information?
- Are there factual differences between runs?
- How much does the structure vary?

High variance means the prompt isn't controlling the output well enough. Refine for consistency.

### Documenting Your Findings

For every prompt you test, record:
- The prompt text (exact wording)
- The input data used
- All outputs (keep them all)
- Scores on each quality metric
- What you learned
- How you refined the prompt based on results

This documentation is your competitive advantage. Over time, you build a knowledge base of what works, what doesn't, and why — knowledge that makes every future prompt better.

### The Meta-Skill

The real skill here isn't any specific technique. It's the MINDSET of treating AI interaction as an engineering discipline rather than a casual conversation. You test, measure, iterate, and document. That's what separates professional-grade AI use from amateur-hour prompting.`,
    },
  ]);

  // ---- ai_912_evaluate L1, L2, L3 ----
  await db.insert(lessons).values([
    {
      id: "ai_912_evaluate_l1", moduleId: "ai_912_evaluate", lessonNumber: 1,
      title: "Systematic Fact-Checking — Lateral Reading and Source Triangulation", durationMinutes: 45, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Primary Source", "Secondary Source", "Unreliable for Verification"],
        items: [
          { text: "The original peer-reviewed journal article reporting a scientific finding", category: "Primary Source" },
          { text: "A news article reporting on the scientific finding", category: "Secondary Source" },
          { text: "Another AI's response confirming the claim", category: "Unreliable for Verification" },
          { text: "Government census data from census.gov", category: "Primary Source" },
          { text: "A Wikipedia article summarizing the census data", category: "Secondary Source" },
          { text: "A social media post sharing the statistic without a source", category: "Unreliable for Verification" },
          { text: "A company's SEC filing with financial data", category: "Primary Source" },
          { text: "A financial analyst's report interpreting the SEC filing", category: "Secondary Source" },
        ],
        instructions: "Classify each source by reliability for verification purposes. When fact-checking AI, source quality determines everything.",
      }),
      content: `## Systematic Fact-Checking — Lateral Reading and Source Triangulation

At the professional level, fact-checking AI isn't about googling a claim and seeing if it "seems right." It's about applying systematic methodologies used by professional fact-checkers, investigative journalists, and academic researchers.

### Lateral Reading — The Professional's Method

Most people fact-check by reading more of the same source ("vertical reading"). Professional fact-checkers do the opposite: they immediately LEAVE the source and check what other sources say ("lateral reading").

**The lateral reading workflow:**

1. AI makes a claim: "According to a 2024 Stanford study, 65% of workers report using AI tools weekly."

2. Don't just re-read the AI output. Open a new browser tab immediately.

3. Search for the specific claim: "Stanford study AI workers weekly 2024"

4. Check WHO is reporting this claim and WHETHER the study exists:
   - Does Stanford's website reference this study?
   - Is it in Google Scholar?
   - Do credible news outlets reference it?
   - Can you find the actual methodology?

5. If you find the study, verify the SPECIFIC number:
   - Does the study actually say 65%?
   - Is that the headline finding or something taken out of context?
   - What was the sample size and methodology?
   - What population was studied? (All workers? Tech workers? US only?)

### Source Triangulation

One source confirms a claim → possible. Two independent sources → probable. Three independent sources → likely accurate. No independent sources → don't use it.

**The triangulation protocol:**

**Source 1:** Find a primary source (the original study, data set, or official record)
**Source 2:** Find an independent secondary source (a different organization reporting on the same finding)
**Source 3:** Find a third source that either confirms or provides additional context

**Critical rule:** Sources must be INDEPENDENT. Three news articles that all cite the same original source count as ONE source, not three.

### Evaluating Statistical Claims

AI loves to produce statistics. Here's how to evaluate them:

**The SMELL Test:**
- **S — Source:** Where did this number come from? Can you find the original?
- **M — Methodology:** How was this data collected? Survey? Census? Estimate?
- **E — Error margin:** What's the confidence interval? Sample size?
- **L — Logic:** Does the conclusion actually follow from the data?
- **L — Loaded framing:** Is the statistic presented in a way that misleads?

**Example of loaded framing:**
- "Crime has increased 50%!" (Could mean from 2 incidents to 3 incidents)
- "Only 15% of applicants are accepted!" (Without knowing total applicants, this is meaningless)
- "9 out of 10 doctors recommend..." (Recommend WHAT exactly? In what context? What did the 10th doctor say?)

### Claim Decomposition

Complex claims often bundle multiple assertions together. Break them apart and verify each one independently:

**AI claim:** "The US education system spends more per pupil than any other developed nation, yet ranks 38th globally in math scores, proving that increased funding doesn't improve educational outcomes."

**Decomposed:**
1. "The US spends more per pupil than any other developed nation" — Check OECD data. (Partially true — the US is near the top but not always #1 depending on the year and what's counted)
2. "The US ranks 38th globally in math scores" — Check PISA rankings. (Approximate — the exact ranking varies by year)
3. "This proves increased funding doesn't improve outcomes" — LOGICAL FALLACY. Correlation is not causation. Spending distribution, how funds are used, class sizes, teacher quality, and many other factors matter. The conclusion doesn't follow from the data.

### Building Your Verification Toolkit

**Reliable sources for fact-checking:**
- **Government data:** census.gov, bls.gov, cdc.gov, data.gov
- **Academic databases:** Google Scholar, PubMed, JSTOR
- **Fact-checking organizations:** Snopes, PolitiFact, FactCheck.org, Full Fact
- **Financial data:** SEC.gov, company annual reports
- **International data:** World Bank Open Data, UN Data, OECD Data

**Unreliable for verification:**
- Other AI tools (they may have the same hallucination)
- Social media posts without primary sources
- Blogs and opinion sites without citations
- "According to studies" without naming specific studies

### Your Professional Verification Workflow

For any AI output you plan to use in important work:
1. Read through and highlight every verifiable claim
2. Prioritize: Which claims, if wrong, would undermine your work?
3. Apply lateral reading to each priority claim
4. Use source triangulation (3 independent sources)
5. Apply the SMELL test to any statistics
6. Decompose complex claims into individual assertions
7. Document your verification: "Claim X verified via [sources]. Claim Y could not be verified — removed."`,
    },
    {
      id: "ai_912_evaluate_l2", moduleId: "ai_912_evaluate", lessonNumber: 2,
      title: "Detecting AI-Generated Misinformation", durationMinutes: 40, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "AI text that sounds authoritative but contains no verifiable specifics", right: "'Confident vagueness' — the most common AI writing pattern. It sounds like it's saying something without actually committing to checkable claims." },
          { left: "AI generates a perfect-sounding expert quote attributed to a real person", right: "Quote fabrication — AI knows the person exists and generates text consistent with their views, but the specific quote is invented." },
          { left: "AI provides an extremely detailed and specific account of an event that never happened", right: "Detailed confabulation — more specificity doesn't mean more accuracy. AI can fabricate elaborate narratives." },
          { left: "AI-generated image shows a real public figure in a situation that never occurred", right: "Visual deepfake — AI image generation can create photorealistic fake scenarios." },
          { left: "AI writes a news article that matches the style of a real publication perfectly", right: "Style mimicry — AI can replicate writing styles of specific publications, making fake content harder to detect." },
          { left: "AI generates data that shows exactly the pattern the user wanted to find", right: "Confirmation bias amplification — AI tends to generate outputs consistent with the user's apparent expectations." },
        ],
        instructions: "Match each type of AI-generated misinformation to its description. Understanding the patterns helps you detect them.",
      }),
      content: `## Detecting AI-Generated Misinformation

AI doesn't just hallucinate accidentally. AI-generated misinformation — whether accidental or deliberately created — is one of the most significant information integrity challenges of our time. Learning to detect it is essential.

### The Misinformation Taxonomy

**Level 1: Accidental Hallucinations (Unintentional)**
The AI wasn't trying to mislead — it just generated probable-sounding text that happens to be false.
- Fake citations and sources
- Incorrect dates, statistics, and facts
- Events that never happened described with specificity
- People quoted saying things they never said

**Level 2: Amplified Bias (Systemic)**
The AI reflects biases in its training data, presenting skewed information as objective truth.
- Presenting one cultural perspective as universal
- Overrepresenting majority viewpoints
- Stereotyping groups based on training data patterns
- Framing issues in ways that favor certain conclusions

**Level 3: Weaponized AI Content (Deliberate)**
People intentionally using AI to create misleading content at scale.
- Deepfake videos of real people
- AI-generated fake news articles
- Bot networks posting AI-generated social media content
- Fake academic papers generated to support false claims
- AI-generated reviews and testimonials

### Detection Techniques

**For AI-Generated Text:**

**Technique 1: The Specificity Test**
AI-generated misinformation often has a characteristic pattern: it sounds authoritative and fluent but is surprisingly thin on verifiable specifics. Look for:
- Claims without sources
- Round numbers without methodology
- Expert quotes without publication context
- Descriptions that feel generic when you look closely

**Technique 2: The Consistency Check**
Ask AI the same question three different ways. Compare the answers. If key facts change between responses (different dates, different statistics, different attributions), those facts are likely hallucinated.

**Technique 3: The Expert Test**
If you have domain knowledge in the topic, read carefully for subtle inaccuracies. AI often gets the general picture right but makes errors in technical details that experts would catch immediately.

**Technique 4: The Source Trace**
For any specific claim, trace it to its alleged source. If AI says "According to a Harvard study published in Science in 2023..." go find that study. If it doesn't exist, the entire paragraph built around it is unreliable.

**For AI-Generated Images:**

**Technique 1: Detail Examination**
Look closely at:
- Hands (often have wrong number of fingers or strange proportions)
- Text in the image (often garbled or nonsensical)
- Backgrounds (may have impossible geometry or melting edges)
- Symmetry (faces may be slightly asymmetric in unnatural ways)
- Reflections (may not match the scene correctly)

**Technique 2: Context Verification**
- Does this event appear in any news coverage?
- Can you find other photos from the same event?
- Does the location shown actually exist?
- Are the people real and identifiable?

**Technique 3: Metadata Analysis**
Real photographs contain metadata (EXIF data) including camera model, location, date, and settings. AI-generated images typically lack this metadata or have synthetic metadata.

### The Social Media Challenge

AI enables misinformation at unprecedented scale:
- A single person can generate thousands of unique fake reviews
- Bot networks can create millions of social media posts spreading false narratives
- Fake news articles can be generated faster than fact-checkers can debunk them
- Deepfake videos can influence elections before they're identified as fake

**Your defense:**
1. SLOW DOWN — Don't share content immediately. Take time to verify.
2. CHECK THE SOURCE — Is this from a known, credible outlet?
3. REVERSE IMAGE SEARCH — Check if images appear in other contexts
4. LOOK FOR COVERAGE — Is this story reported by multiple credible outlets?
5. CHECK YOUR EMOTIONS — Content designed to make you angry or scared is often manipulative

### The Deeper Problem

We're entering an era where generating fake content is easy and detecting it is hard. This creates a "liar's dividend" — when anyone can claim that real evidence is AI-generated, it becomes harder to hold people accountable even with genuine proof.

This isn't just a technology problem. It's a democratic problem. The health of democratic society depends on shared facts. When AI makes it trivial to manufacture convincing lies, the shared foundation of truth erodes.

**Your responsibility:** Be the person who verifies before sharing, who questions before believing, and who helps others develop the same habits. This isn't about being cynical — it's about being a responsible member of a democratic society.`,
    },
    {
      id: "ai_912_evaluate_l3", moduleId: "ai_912_evaluate", lessonNumber: 3,
      title: "Building Organizational Evaluation Frameworks", durationMinutes: 45, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Must Verify (High Stakes)", "Should Verify (Medium Stakes)", "Spot Check (Low Stakes)"],
        items: [
          { text: "AI-generated content for a medical patient information sheet", category: "Must Verify (High Stakes)" },
          { text: "AI draft of a weekly internal team newsletter", category: "Spot Check (Low Stakes)" },
          { text: "AI-generated data analysis for a board presentation", category: "Must Verify (High Stakes)" },
          { text: "AI-suggested social media post captions", category: "Should Verify (Medium Stakes)" },
          { text: "AI-drafted grant proposal narrative", category: "Must Verify (High Stakes)" },
          { text: "AI-generated meeting agenda from discussion notes", category: "Spot Check (Low Stakes)" },
          { text: "AI-created marketing copy for a product launch", category: "Should Verify (Medium Stakes)" },
          { text: "AI-drafted legal contract clauses", category: "Must Verify (High Stakes)" },
        ],
        instructions: "Classify each AI use case by the level of verification it requires. Not everything needs the same scrutiny — prioritization is key.",
      }),
      content: `## Building Organizational Evaluation Frameworks

In the real world, you won't just evaluate your own AI outputs. You'll need to help organizations — schools, businesses, nonprofits — develop systematic approaches to AI quality control. This is the skill that makes you invaluable.

### Why Organizations Need Evaluation Frameworks

Without a framework, AI evaluation is inconsistent:
- Different employees apply different standards
- Critical outputs get the same review as trivial ones
- No one knows when AI use is appropriate vs. risky
- Errors slip through because no one "owns" quality control

A framework creates consistency, accountability, and defensibility.

### Framework Component 1: Risk-Based Classification

Not every AI output needs the same level of scrutiny. Classify by risk:

**Tier 1 — Critical (Must Verify Everything)**
Outputs that could cause harm if inaccurate:
- Medical/health information
- Legal documents and advice
- Financial reports and projections
- Grant proposals and compliance documents
- Public-facing content that represents the organization
- Anything involving vulnerable populations

**Verification standard:** Every factual claim independently verified. Two reviewers. Full documentation.

**Tier 2 — Important (Should Verify Key Claims)**
Outputs that matter but have lower harm potential:
- Internal reports and analyses
- Marketing and communications content
- Training materials
- Strategic planning documents

**Verification standard:** Key claims and statistics verified. One reviewer. Spot-check documentation.

**Tier 3 — Routine (Spot Check)**
Low-risk outputs where errors are easily caught and corrected:
- Internal emails and memos
- Meeting summaries
- Brainstorming and ideation outputs
- Draft documents for further human development

**Verification standard:** Quick human review. No formal documentation required.

### Framework Component 2: Evaluation Rubric

Create standardized criteria for evaluating AI outputs:

| Criterion | Score 1 (Poor) | Score 3 (Adequate) | Score 5 (Excellent) |
|-----------|---------------|-------------------|---------------------|
| Accuracy | Multiple factual errors | Minor errors, key facts correct | All verifiable facts confirmed accurate |
| Completeness | Major gaps in coverage | Covers main points, some gaps | Comprehensive coverage of all relevant aspects |
| Relevance | Doesn't address the prompt/need | Partially addresses the need | Directly and fully addresses the specific need |
| Bias | Clear bias or one-sided | Generally balanced with minor gaps | Multiple perspectives fairly represented |
| Actionability | Reader can't take action | Reader can take some action | Reader can take clear, specific action |

### Framework Component 3: Approval Workflow

Define who reviews what and when:

1. **AI Output Generated** — Author documents the prompt used
2. **Self-Review** — Author evaluates using the rubric
3. **Peer Review** — Second person reviews (for Tier 1 and 2)
4. **Fact-Check** — Designated reviewer verifies claims (for Tier 1)
5. **Approval** — Authorized person signs off on final version
6. **Documentation** — Record the prompt, AI tool used, reviewers, and verification steps

### Framework Component 4: Continuous Improvement

Track AI evaluation data over time:
- What types of AI outputs have the highest error rates?
- What categories of claims are most often wrong?
- Are certain AI tools more reliable for certain tasks?
- How much time does verification take? Is it worth it?
- What patterns can predict when AI is likely to hallucinate?

Use this data to refine your framework quarterly.

### Framework Component 5: Training and Compliance

The best framework is useless if people don't follow it:
- Train all staff on the evaluation framework
- Include AI evaluation in onboarding
- Conduct periodic audits to check compliance
- Share examples of caught errors (learning opportunities, not blame)
- Update the framework as AI tools evolve

### Your Framework Design Project

Design a complete AI output evaluation framework for a real organization:
1. Describe the organization and its AI use cases
2. Create the risk-based classification system
3. Build the evaluation rubric with specific criteria
4. Design the approval workflow (who reviews what)
5. Create a training plan for staff
6. Include a continuous improvement process
7. Write sample documentation templates

Present this as a professional deliverable. This is exactly the kind of practical, implementable work that grant evaluators and employers value.`,
    },
  ]);

  // ---- ai_912_responsible L1, L2, L3 ----
  await db.insert(lessons).values([
    {
      id: "ai_912_responsible_l1", moduleId: "ai_912_responsible", lessonNumber: 1,
      title: "Data Privacy Regulations and AI — FERPA, COPPA, HIPAA", durationMinutes: 45, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "FERPA (Family Educational Rights and Privacy Act)", right: "Protects student education records. Schools must get consent before sharing student data with AI tools." },
          { left: "COPPA (Children's Online Privacy Protection Act)", right: "Requires parental consent before collecting data from children under 13. Applies to AI tools used by children." },
          { left: "HIPAA (Health Insurance Portability and Accountability Act)", right: "Protects patient health information. Healthcare AI must meet strict data security and privacy requirements." },
          { left: "Section 230 of the Communications Decency Act", right: "Generally shields platforms from liability for user-generated content. Applicability to AI-generated content is being debated." },
          { left: "EU AI Act", right: "First comprehensive AI regulation. Classifies AI systems by risk level and sets requirements for each tier." },
          { left: "Executive Order on AI Safety (2023)", right: "US executive action requiring AI safety testing and reporting for the most powerful AI systems." },
        ],
        instructions: "Match each regulation to its scope and relevance to AI. Understanding the legal landscape is essential for professional AI governance.",
      }),
      content: `## Data Privacy Regulations and AI — FERPA, COPPA, HIPAA

AI doesn't exist in a legal vacuum. Real laws govern how data is collected, stored, and used — and AI systems must comply or face serious consequences. Understanding these regulations is essential for anyone who will work with AI in professional settings.

### FERPA — Protecting Student Data

**What it covers:** The Family Educational Rights and Privacy Act protects student educational records at schools that receive federal funding (which includes virtually all public schools and most private schools and universities).

**How it applies to AI:**
- Schools cannot share student records with AI companies without consent
- Student work submitted through AI tools may constitute educational records
- Schools must ensure AI vendors have appropriate data agreements
- Parents (and students over 18) have the right to access and review records

**Practical implications:**
- A school that uses an AI tutoring platform must have a data agreement with the AI company
- If students submit essays through AI grading tools, the school must protect those records
- AI tools that track student performance create educational records covered by FERPA
- Schools must inform parents about AI tools that access student data

**Real-world issue:** Many schools adopted AI tools rapidly during and after COVID without adequate FERPA compliance review. Students' academic struggles, behavioral patterns, and personal essays may be stored on AI company servers with unclear data retention policies.

### COPPA — Protecting Children

**What it covers:** The Children's Online Privacy Protection Act requires websites and online services to get parental consent before collecting personal information from children under 13.

**How it applies to AI:**
- AI chatbots that interact with children under 13 must comply with COPPA
- This includes any data the child types, speaks, or otherwise inputs
- AI tools marketed to or used by children must have parental consent mechanisms
- Companies must provide clear privacy policies explaining what data is collected

**The gray area:** Most major AI tools (ChatGPT, Claude, Gemini) have terms of service requiring users to be 13 or older. But enforcement is minimal, and many younger students use these tools anyway — especially for homework help.

### HIPAA — Protecting Health Data

**What it covers:** The Health Insurance Portability and Accountability Act protects patient health information held by covered entities (healthcare providers, insurers, clearinghouses) and their business associates.

**How it applies to AI:**
- Healthcare organizations using AI diagnostic tools must ensure HIPAA compliance
- AI systems that process patient data must meet security and privacy requirements
- Patient data used to train AI models raises serious HIPAA questions
- De-identification of health data has been challenged by AI's ability to re-identify individuals

**Real-world tension:** Training better medical AI requires more patient data. But sharing patient data raises privacy risks. This tension between AI improvement and patient privacy is one of the most active regulatory debates in healthcare.

### The Emerging Regulatory Landscape

**EU AI Act (2024):**
The world's first comprehensive AI regulation. Classifies AI by risk:
- Unacceptable risk (banned): Social scoring systems, manipulative AI
- High risk (strict requirements): AI in healthcare, hiring, criminal justice, education
- Limited risk (transparency): Chatbots, deepfake generators (must disclose they're AI)
- Minimal risk (no restrictions): Spam filters, video game AI

**US Approach:**
The US has taken a sector-by-sector approach rather than comprehensive legislation:
- Executive orders on AI safety
- FDA guidelines for AI in medical devices
- EEOC guidance on AI in hiring
- FTC enforcement on deceptive AI practices
- State-level legislation (California, Colorado, Illinois, Texas)

### Compliance in Practice

If you work for any organization that uses AI, you need to:

1. **Know which regulations apply** — Based on your industry, location, and who your users/customers are
2. **Audit AI tools for compliance** — Before adopting any AI tool, evaluate its data practices against applicable regulations
3. **Document everything** — What data goes into AI systems, how it's processed, who has access, and how long it's retained
4. **Train your team** — Everyone who uses AI needs to understand what data they can and cannot input
5. **Plan for incidents** — What happens if an AI tool is breached and regulated data is exposed?

### Your Compliance Project

Choose one regulation (FERPA, COPPA, or HIPAA). Research it thoroughly. Then:
1. Evaluate 3 real AI tools for compliance with that regulation
2. Identify specific compliance gaps for each tool
3. Write a recommendation report: Should an organization in that sector use each tool?
4. Create a compliance checklist that staff can use when evaluating new AI tools

This is exactly the type of analysis that organizations need and will pay for.`,
    },
    {
      id: "ai_912_responsible_l2", moduleId: "ai_912_responsible", lessonNumber: 2,
      title: "Intellectual Property, Copyright, and AI — Who Owns What?", durationMinutes: 40, activityType: "sorting",
      activityData: JSON.stringify({
        type: "sorting",
        categories: ["Likely Copyrightable", "Uncertain / Disputed", "Likely NOT Copyrightable"],
        items: [
          { text: "A novel written entirely by a human author", category: "Likely Copyrightable" },
          { text: "An image generated entirely by AI with a simple prompt", category: "Likely NOT Copyrightable" },
          { text: "An essay where a human wrote the content and AI helped with grammar and structure", category: "Likely Copyrightable" },
          { text: "A song created by AI from a detailed human-written creative brief", category: "Uncertain / Disputed" },
          { text: "AI-generated code that a human developer significantly modified and integrated", category: "Uncertain / Disputed" },
          { text: "A painting created by AI in the style of a living artist, without that artist's consent", category: "Uncertain / Disputed" },
          { text: "A research paper written by a human using AI-generated summaries of source material", category: "Likely Copyrightable" },
          { text: "Raw AI output pasted directly without human modification", category: "Likely NOT Copyrightable" },
        ],
        instructions: "Classify each creative work by its copyright status. These are active legal questions being decided in courts right now.",
      }),
      content: `## Intellectual Property, Copyright, and AI — Who Owns What?

AI has created a legal earthquake in intellectual property law. The questions being debated right now will shape creative industries, technology, and education for decades. Understanding them puts you ahead of most professionals.

### The Fundamental Question

Copyright law was built on a simple principle: human creators own their creative works. But AI changes this:
- If AI generates a painting, who owns it?
- If AI writes code, who holds the copyright?
- If AI was trained on copyrighted works, is that training itself a copyright violation?

Courts around the world are wrestling with these questions RIGHT NOW.

### The Training Data Controversy

**The issue:** Companies like OpenAI, Google, and Stability AI trained their models on massive datasets that include copyrighted material — books, articles, images, code, music — typically without permission from or compensation to the creators.

**The lawsuits:**
- The New York Times sued OpenAI for training on NYT articles
- Getty Images sued Stability AI for training on Getty's copyrighted photos
- A class action lawsuit was filed by visual artists against Stability AI, Midjourney, and DeviantArt
- The Authors Guild filed suit against OpenAI on behalf of book authors

**The arguments:**

*Companies argue:* Training AI on publicly available content is "fair use" — similar to how a human learns by reading books. The AI doesn't store or reproduce the original works; it learns patterns.

*Creators argue:* AI companies are profiting from creators' work without permission or compensation. AI CAN reproduce substantial elements of copyrighted works. This isn't learning — it's commercial exploitation.

**Where things stand (2026):** Courts have issued mixed rulings. Some have found AI training can be fair use; others have found it can constitute infringement. The legal landscape is still evolving.

### Who Owns AI-Generated Content?

**Current US law (as of 2026):**
The US Copyright Office has ruled that purely AI-generated content WITHOUT significant human creative input cannot be copyrighted. Copyright requires human authorship.

**What this means:**
- If you type a prompt and AI generates an image: likely NOT copyrightable
- If you provide detailed creative direction, select from options, and modify the result: POSSIBLY copyrightable (the human creative decisions may be protectable)
- If you write text and AI helps with grammar/structure: likely copyrightable (human is the primary author)

**The gray area is enormous.** How much human involvement is "enough" for copyright? This is being actively litigated and legislated.

### Practical IP Considerations

**For students:**
- AI-assisted homework and projects: Your original thinking and writing are yours. AI-generated portions may not be copyrightable.
- Understand your school's AI policy — some schools claim ownership of student work done with school-provided AI tools.

**For professionals:**
- If your job produces AI-assisted work, check your employment agreement — many assign IP to the employer
- If you're freelancing, clarify with clients what "AI-assisted" means and who owns what
- If you're using AI to create commercial content, understand that pure AI output may not be protectable

**For organizations:**
- Establish clear policies about AI use in content creation
- Document human creative contributions to AI-assisted work
- Consider the risk of using AI that was trained on copyrighted material in your industry
- Monitor legal developments — this area is changing rapidly

### The Ethical Dimension (Beyond Legal)

Legal and ethical are not the same thing. Even if AI training is legally found to be fair use:
- Is it FAIR that artists' decades of work train AI systems that compete with them?
- Should companies that profit from AI trained on others' work share revenue?
- What happens to human creativity if AI can replicate any style cheaper and faster?

These are not questions with easy answers. They're questions your generation will need to answer — through votes, purchases, career choices, and advocacy.

### Your Analysis Project

Choose one active AI copyright case. Research it thoroughly:
1. Who are the parties and what are they claiming?
2. What legal precedents apply?
3. What are the strongest arguments on each side?
4. What is the current status of the case?
5. What do YOU think the outcome should be, and why?
6. How would the outcome affect your field of interest?

Write a 1,000-word analysis presenting both sides fairly before stating your position with reasoning.`,
    },
    {
      id: "ai_912_responsible_l3", moduleId: "ai_912_responsible", lessonNumber: 3,
      title: "AI Governance — Building Policies That Work", durationMinutes: 45, activityType: "matching",
      activityData: JSON.stringify({
        type: "matching",
        pairs: [
          { left: "Acceptable Use Policy", right: "Defines which AI tools are approved, for which tasks, and which are prohibited" },
          { left: "Data Classification Standard", right: "Categorizes organizational data by sensitivity level and specifies which data can and cannot be used with AI" },
          { left: "AI Output Review Process", right: "Establishes who reviews AI-generated content before it's published or used for decisions" },
          { left: "Incident Response Plan", right: "Defines steps to take when AI produces harmful, biased, or inaccurate outputs that affect stakeholders" },
          { left: "Vendor Assessment Checklist", right: "Evaluation criteria for AI tools before the organization adopts them: security, privacy, bias testing, compliance" },
          { left: "Training and Certification Program", right: "Ensures all staff who use AI understand the policies, risks, and best practices" },
        ],
        instructions: "Match each governance component to its description. A complete AI governance framework needs all of these working together.",
      }),
      content: `## AI Governance — Building Policies That Work

Governance isn't bureaucracy. It's the difference between an organization that uses AI responsibly and one that's one mistake away from a lawsuit, a data breach, or a public relations disaster. As AI becomes standard in every organization, the people who can design governance frameworks become invaluable.

### Why AI Governance Matters

Without governance:
- Employees use AI tools without understanding privacy risks
- Sensitive data gets shared with AI companies through casual chatbot conversations
- AI-generated content goes public without fact-checking
- Biased AI decisions go undetected until someone is harmed
- When something goes wrong, no one knows who's responsible

With governance:
- Clear policies prevent the most common AI mistakes
- Data is protected by classification standards
- Quality control processes catch errors before they cause harm
- Accountability is clear — everyone knows their responsibilities
- The organization can demonstrate responsible AI use to regulators, funders, and stakeholders

### The Six Components of AI Governance

**Component 1: Acceptable Use Policy**
Defines the boundaries of AI use:
- Which AI tools are approved (and which are prohibited)
- What tasks AI can be used for
- What data can be shared with AI tools
- Required disclosures when AI is used
- Consequences for policy violations

**Component 2: Data Classification Standard**
Not all data has the same sensitivity:
- **Public:** Information already available publicly. OK to use with AI.
- **Internal:** Business information not meant for public. Use with approved AI tools only.
- **Confidential:** Sensitive business data. Limited AI use with strong safeguards.
- **Restricted:** Regulated data (FERPA, HIPAA, financial). AI use only with compliant tools and documented approval.

**Component 3: AI Output Review Process**
Establishes quality gates:
- Tier 1 (critical) outputs: Two-person review, full fact-check
- Tier 2 (important) outputs: One-person review, key claim verification
- Tier 3 (routine) outputs: Quick human scan

**Component 4: Vendor Assessment**
Before adopting any AI tool, evaluate:
- Where is user data stored? For how long?
- Is data used to train models? Can this be opted out?
- What security certifications does the vendor have?
- Does the tool comply with relevant regulations (FERPA, COPPA, HIPAA)?
- Has the tool been tested for bias? With what methodology?
- What is the vendor's incident response process?

**Component 5: Incident Response Plan**
When AI goes wrong (and it will), you need a plan:
1. Identify the incident (what happened, who was affected)
2. Contain the damage (stop the AI process, correct the output)
3. Investigate the root cause (prompt failure, data issue, tool limitation)
4. Remediate (fix the immediate problem)
5. Communicate (inform affected parties transparently)
6. Prevent recurrence (update policies, training, or tools)

**Component 6: Training and Certification**
Everyone who uses AI needs to understand:
- The organization's AI policies
- How to use approved AI tools safely
- What data can and cannot be shared with AI
- How to evaluate AI outputs
- When to escalate concerns
- How to report incidents

### Building for Your Context

AI governance isn't one-size-fits-all. The right framework depends on:

**For a school district:**
- Primary concerns: Student privacy (FERPA), age restrictions (COPPA), academic integrity
- Key policies: Which AI tools students and teachers can use, how student data is protected, academic honesty standards for AI use

**For a healthcare organization:**
- Primary concerns: Patient privacy (HIPAA), clinical accuracy, liability
- Key policies: Which AI tools are HIPAA-compliant, clinical decision support review processes, patient consent for AI-assisted care

**For a nonprofit:**
- Primary concerns: Funder requirements, community trust, data security
- Key policies: AI use in grant reporting (accuracy and disclosure), responsible use of participant data, AI-generated content review

**For a small business:**
- Primary concerns: Customer data protection, competitive advantage, cost
- Key policies: Approved AI tools list, customer data classification, AI-assisted product quality control

### Environmental Responsibility

A dimension often overlooked in AI governance: environmental impact.

Training a large AI model can emit as much carbon as 5 cars over their lifetimes. Running inference (every time you use ChatGPT) requires significant computational resources and electricity.

Responsible AI governance includes:
- Choosing right-sized models (don't use GPT-4 for tasks GPT-3.5 handles well)
- Reducing unnecessary AI usage
- Tracking and reporting AI-related energy consumption
- Including environmental impact in vendor assessments

### Your Governance Project

Design a complete AI governance framework for a real organization (your school, a nonprofit you know, a small business). Include:
1. Acceptable Use Policy (at least 2 pages)
2. Data Classification Standard with examples
3. Output Review Process with specific criteria
4. Vendor Assessment Checklist (at least 15 evaluation points)
5. Incident Response Plan (step-by-step)
6. Training program outline (what staff need to learn)
7. Implementation timeline (how to roll this out)

This deliverable demonstrates professional-grade thinking about AI governance — exactly what organizations need and what grant evaluators want to see.`,
    },
  ]);
}
