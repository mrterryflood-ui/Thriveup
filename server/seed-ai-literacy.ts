import { subjects, modules, lessons, quizQuestions, badges } from "@shared/schema";

export async function seedAILiteracyContent(db: any): Promise<void> {
  await db.insert(subjects).values([
    { id: "ai_6_8", name: "AI Literacy", description: "5 content areas: Understand AI Principles, Explore AI Uses, Direct AI Effectively, Evaluate AI Outputs, Use AI Responsibly — building critical AI skills for the modern workforce", gradeBand: "6-8", theme: "The AI Lab", color: "violet", iconName: "Cpu", sortOrder: 21 },
    { id: "ai_9_12", name: "AI Mastery", description: "Advanced AI literacy: LLM architecture, professional prompt engineering, evaluation frameworks, regulatory compliance (FERPA/COPPA/HIPAA), and organizational AI governance", gradeBand: "9-12", theme: "The AI Command Center", color: "violet", iconName: "Cpu", sortOrder: 22 },
  ]);

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
        "Use role prompting to get domain-specific expertise from AI",
        "Recognize and fix common prompt failures: vague instructions, missing context, wrong format requests",
      ],
      activities: [
        "Prompt autopsy — analyze 10 bad prompts, diagnose why they failed, and rewrite them using the CRAFT framework",
        "Prompt engineering challenge — complete 10 increasingly difficult prompt tasks, scoring outputs on a quality rubric each time",
        "Role prompting workshop — write prompts assigning AI 5 different expert roles and compare how outputs change with each role",
        "Context matters experiment — give AI the same question with zero context, some context, and rich context, then measure quality differences",
        "Iterative refinement lab — start with a basic prompt and improve the output through 5 rounds of refinement, documenting each change and why",
        "Build a personal prompt library — create, test, and document 10 reusable prompts for school tasks",
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
        "Explain why AI confidence level has no correlation with accuracy",
      ],
      activities: [
        "Hallucination hunt — give AI 10 factual questions and fact-check every response, documenting what it got right, wrong, and made up",
        "Fake citation detective — ask AI to provide sourced claims on 5 topics, then verify whether each source actually exists",
        "Bias detection workshop — generate AI responses on 5 culturally sensitive topics and analyze outputs for bias",
        "Completeness audit — ask AI to explain 3 complex topics and identify what critical information it left out",
        "AI vs. expert comparison — compare AI-generated explanations to textbook explanations on the same topic",
        "Build an evaluation checklist — create a personal AI output evaluation rubric with at least 10 criteria",
      ],
    },
    {
      id: "ai_68_responsible", levelId: 3, subjectId: "ai_6_8", moduleNumber: 5,
      title: "Use AI Responsibly", description: "Ethical, secure, and accountable AI use. Students learn what to never share with AI, how to cite AI-assisted work, understand intellectual property issues, and take personal responsibility for any AI output they use.",
      durationWeeks: 3,
      storyArcTitle: "Power and Responsibility",
      storyArcNarrative: "AI is powerful. Power without responsibility is dangerous. In this module, you learn the ethical framework for using AI — what to share and what to protect, how to give credit, how to think about fairness, and why you are always responsible for whatever AI helps you create.",
      learningObjectives: [
        "Identify categories of information that should never be shared with AI systems",
        "Explain how AI companies may use conversation data for training and why this matters for privacy",
        "Properly cite and disclose AI assistance in academic and professional work",
        "Describe intellectual property concerns with AI-generated content",
        "Apply ethical decision-making frameworks to AI use cases",
        "Take full accountability for AI-assisted outputs",
      ],
      activities: [
        "Privacy audit — review 10 real scenarios and classify whether sharing that information with AI is safe, risky, or dangerous",
        "Academic integrity workshop — rewrite 5 AI-assisted assignments with proper AI citation and disclosure",
        "Ethical dilemma discussions — debate 5 real AI ethics cases: deepfakes, AI art, AI in hiring, AI surveillance, AI in healthcare",
        "Terms of service investigation — read and summarize the data usage policies of 3 major AI tools",
        "Create an AI use policy — draft a responsible AI use policy for your school or club",
        "Accountability simulation — analyze 3 scenarios where AI produced harmful outputs and identify who is responsible",
      ],
    },
  ]);

  await db.insert(modules).values([
    {
      id: "ai_912_understand", levelId: 4, subjectId: "ai_9_12", moduleNumber: 1,
      title: "Understand AI Principles", description: "Deep understanding of AI architecture, machine learning methodologies, neural network concepts, training data implications, and the real capabilities and limitations of large language models in professional and academic contexts.",
      durationWeeks: 3,
      storyArcTitle: "The Architecture of Intelligence",
      storyArcNarrative: "At this level, 'AI is pattern matching' isn't enough. You need to understand HOW it matches patterns, WHY that creates both power and risk, and WHAT it means for your career, your community, and your future.",
      learningObjectives: [
        "Explain the transformer architecture and attention mechanism at a conceptual level",
        "Describe how large language models are trained: pre-training, fine-tuning with human feedback (RLHF), and alignment",
        "Analyze how training data composition affects model outputs — including bias, knowledge cutoffs, and cultural representation",
        "Compare and evaluate different AI model architectures by capability, limitations, and appropriate use cases",
        "Explain emergent capabilities — behaviors that appear at scale that weren't explicitly programmed",
        "Assess AI claims critically: distinguish real capabilities from marketing hype using technical understanding",
      ],
      activities: [
        "Architecture deep-dive presentation — research and present how transformers work using visual diagrams and real examples",
        "Training data audit — investigate what data sources major AI models were trained on and identify bias implications",
        "Model comparison report — test GPT-4, Claude, Gemini, and one open-source model on identical tasks and write an analytical comparison",
        "AI capability claims analysis — find 5 AI product marketing claims, research actual technology, and rate accuracy",
        "Emergent behavior investigation — research 3 examples of AI capabilities that emerged unexpectedly at scale",
        "Technical literacy test — demonstrate ability to read and understand AI news articles and research summaries",
      ],
    },
    {
      id: "ai_912_explore", levelId: 4, subjectId: "ai_9_12", moduleNumber: 2,
      title: "Explore AI Uses", description: "Professional-grade exploration of AI applications across industries — healthcare, criminal justice, education, business, government, creative arts — with critical analysis of real-world implementations, outcomes, and failures.",
      durationWeeks: 3,
      storyArcTitle: "AI in the Real World",
      storyArcNarrative: "AI isn't theoretical anymore. It's making bail decisions in courtrooms, diagnosing diseases in hospitals, grading student work in schools, and deciding who gets job interviews. In this module, you explore how AI is actually being used — the successes, the failures, and the ethical minefields.",
      learningObjectives: [
        "Analyze AI applications across at least 5 industries with specific examples of successful and failed implementations",
        "Evaluate the economic impact of AI adoption on workforce displacement and creation",
        "Design an AI-assisted workflow for a specific professional context that maintains human oversight",
        "Assess real-world AI failures and identify root causes",
        "Create a professional AI use case proposal with risk assessment and ethical considerations",
        "Demonstrate understanding of AI's role in workforce readiness",
      ],
      activities: [
        "Industry AI adoption case study — research a real company's AI implementation and present findings with data",
        "AI failure forensics — investigate 3 documented AI failures (COMPAS, Amazon hiring AI, healthcare algorithms)",
        "Workforce impact analysis — research how AI is changing 3 specific career fields and write a career adaptation plan",
        "AI workflow design project — design a complete AI-assisted workflow for a real organization with human oversight checkpoints",
        "Cost-benefit analysis — build a realistic cost-benefit model for an AI implementation",
        "Panel discussion — organize and lead a structured discussion on AI's impact on a specific industry",
      ],
    },
    {
      id: "ai_912_direct", levelId: 4, subjectId: "ai_9_12", moduleNumber: 3,
      title: "Direct AI Effectively", description: "Advanced prompt engineering including system prompts, chain-of-thought reasoning, few-shot learning, structured outputs, and building AI workflows for professional and academic applications.",
      durationWeeks: 3,
      storyArcTitle: "Engineering Intelligence",
      storyArcNarrative: "At this level, prompting isn't just about getting a good answer — it's about engineering reliable, repeatable AI outputs for professional use.",
      learningObjectives: [
        "Apply advanced prompt engineering techniques: system prompts, chain-of-thought, few-shot examples, structured output formats",
        "Design multi-step AI workflows that chain prompts together for complex tasks",
        "Build and test domain-specific prompt templates for professional use cases",
        "Use AI for metacognition — prompt AI to check its own work and identify weaknesses",
        "Implement output formatting controls including JSON, markdown, tables, and structured reports",
        "Evaluate prompt effectiveness using systematic testing with quality metrics",
      ],
      activities: [
        "Advanced prompt engineering lab — complete 15 progressively difficult prompt challenges using advanced techniques",
        "Professional prompt template library — build 15 tested prompt templates for academic and career tasks",
        "Multi-step workflow builder — design a 5-step AI workflow for research and annotated bibliography creation",
        "AI self-check experiment — develop prompts that ask AI to critique its own outputs and verify self-assessment accuracy",
        "Prompt A/B testing — write two prompts for the same task, run each 5 times, and analyze which produces better results",
        "Domain-specific application — build a complete prompt-based AI tool for a specific use case with documentation",
      ],
    },
    {
      id: "ai_912_evaluate", levelId: 4, subjectId: "ai_9_12", moduleNumber: 4,
      title: "Evaluate AI Outputs", description: "Advanced critical evaluation including systematic fact-checking methodologies, statistical claim verification, source analysis, detecting sophisticated AI-generated misinformation, and building evaluation frameworks.",
      durationWeeks: 3,
      storyArcTitle: "The Quality Firewall",
      storyArcNarrative: "At the professional level, AI output evaluation isn't optional — it's a job requirement. Companies lose millions to decisions based on unchecked AI outputs.",
      learningObjectives: [
        "Apply systematic fact-checking methodologies including lateral reading, source triangulation, and claim decomposition",
        "Detect sophisticated AI-generated misinformation including false statistics and fabricated research findings",
        "Evaluate statistical claims: check sample sizes, methodology, confidence intervals",
        "Build and deploy an organizational AI output evaluation framework with scoring rubrics",
        "Analyze how AI evaluation requirements differ across domains",
        "Conduct a comprehensive AI accuracy audit and produce a professional report",
      ],
      activities: [
        "Misinformation detection challenge — review 10 AI-generated paragraphs and identify every false claim",
        "Statistical claim audit — extract 10 statistical claims from AI outputs and verify each using primary sources",
        "Cross-domain evaluation workshop — evaluate AI output using journalism, healthcare, and academic frameworks",
        "Organizational evaluation framework — design a complete AI output evaluation framework for a specific organization",
        "Deepfake and AI content detection — analyze 10 pieces of content and determine which were AI-generated",
        "Comprehensive accuracy audit — choose one topic, generate AI content, fact-check everything, and write an audit report",
      ],
    },
    {
      id: "ai_912_responsible", levelId: 4, subjectId: "ai_9_12", moduleNumber: 5,
      title: "Use AI Responsibly", description: "Professional-grade responsible AI use: data privacy regulations (FERPA, COPPA, HIPAA), intellectual property law, organizational AI governance, algorithmic fairness, environmental impact, and leadership in ethical AI adoption.",
      durationWeeks: 3,
      storyArcTitle: "Leading with Integrity",
      storyArcNarrative: "At this level, responsible AI use isn't just about your personal behavior — it's about leading others. This module prepares you to lead AI decisions with integrity.",
      learningObjectives: [
        "Explain key data privacy regulations (FERPA, COPPA, HIPAA) and how they apply to AI use",
        "Analyze intellectual property issues with AI-generated content including copyright, fair use, and ownership",
        "Design an organizational AI governance policy addressing privacy, fairness, accountability, transparency, and security",
        "Evaluate algorithmic fairness by identifying and measuring disparate impact across demographic groups",
        "Assess the environmental impact of AI and make informed decisions about sustainable AI use",
        "Lead responsible AI adoption conversations that balance innovation with protection",
      ],
      activities: [
        "Regulatory compliance analysis — research FERPA, COPPA, HIPAA and evaluate 5 AI tools for compliance",
        "IP case study — analyze 3 real AI copyright cases and present legal analysis",
        "AI governance policy project — write a complete AI governance policy for a real organization",
        "Algorithmic fairness audit — test an AI system for demographic bias and document disparities",
        "Environmental impact assessment — calculate carbon footprint of common AI usage and design sustainable strategy",
        "Ethics leadership simulation — facilitate a structured discussion with competing stakeholders",
      ],
    },
  ]);

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
These tools create images from text descriptions.

**What they're great at:** Concept visualization, creative exploration, rapid prototyping of visual ideas
**What they're bad at:** Precise details (counting fingers, text in images), consistent characters, factual accuracy

**3. Code Assistance AI** (GitHub Copilot, Replit AI, Cursor)
These tools help write, debug, and explain computer code.

**What they're great at:** Writing common code patterns, explaining existing code, finding bugs, converting between languages
**What they're bad at:** Complex architectural decisions, security-critical code, understanding business requirements

**4. Data Analysis AI**
These tools help analyze spreadsheets, databases, and datasets.

**What they're great at:** Finding patterns in large datasets, creating charts, cleaning messy data
**What they're bad at:** Understanding context, making business decisions, knowing which data matters most

**5. Specialized AI Tools**
Voice transcription, music generation, video editing, presentation design, and many more.

### The Human + AI Equation

Here is the most important insight about AI: **AI amplifies skill. It doesn't replace it.**

A student who understands history will use AI to write a better history paper than a student who doesn't. A doctor who understands medicine will use AI to make better diagnoses. AI doesn't make unskilled people skilled. It makes skilled people faster and more productive.

### When NOT to Use AI

- When the assignment is designed to develop YOUR thinking
- When accuracy is life-or-death without expert review
- When personal judgment and empathy are required
- When you need to cite specific, verified sources
- When sharing private or sensitive information would be required

### Your Responsibility

Every output AI produces for you is YOUR responsibility. If you submit AI-generated work with errors, those are YOUR errors. The human in the loop — that's you — is always accountable.`,
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

The difference between getting useless AI output and getting remarkable AI output is almost always the prompt.

### Why Prompts Matter

When you talk to another person, they use context clues — tone, body language, shared history. AI has NONE of that. If your words are vague, the output will be generic. If your words are precise, the output will be specific and useful.

### The CRAFT Framework

**C — Context:** What background information does AI need?
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

The CRAFT prompt will produce output that is 10x more useful.

### Iterative Refinement

Your first prompt rarely produces perfect output. The key skill is **iterative refinement**:

Round 1: Get the initial output
Round 2: "The solar section is too technical. Simplify the explanation of photovoltaic cells."
Round 3: "Add a real-world example of a community that switched to solar power."
Round 4: "The conclusion needs to take a position — which energy source is better for residential use and why?"

Each round gets you closer to exactly what you need. Professional AI users typically go through 3-5 rounds.

### Common Prompt Failures and Fixes

| Problem | Why It Fails | Fix |
|---------|-------------|-----|
| "Write an essay" | No topic, length, audience, or purpose | Add all four |
| "Make it better" | AI doesn't know what "better" means to you | Be specific about what to improve |
| "Tell me everything about X" | Too broad to be useful | Narrow the scope |
| Getting generic output | No role or context | Add a specific expert role and detailed context |

### The Prompt Library Concept

Professional AI users build a **prompt library** — tested, refined prompts they reuse and adapt. By the end of this module, you'll have your own.`,
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
          { text: "AI claims a historical event happened on a specific date", category: "Needs Verification" },
          { text: "AI provides a working phone number for a local business", category: "Probably Wrong" },
          { text: "AI explains how a lever works in physics", category: "Likely Accurate" },
          { text: "AI recommends a specific medication dosage", category: "Probably Wrong" },
        ],
        instructions: "Sort each AI output into the correct trust category. Remember: AI sounds equally confident whether it's right or wrong.",
      }),
      content: `## The ARCB Framework — Never Trust AI Blindly

AI will lie to your face with perfect grammar and complete confidence. Your job is to catch it every time.

### Why AI Gets Things Wrong

AI doesn't "know" things the way you know your own name. It predicts the most likely next word based on patterns. This means:

1. **If the training data was wrong, the AI will be wrong** — confidently
2. **If the question requires recent information, AI may be outdated**
3. **If the answer requires reasoning beyond pattern matching, AI may fail**
4. **If asked about specific facts, AI may fabricate them** — these are "hallucinations"

### The ARCB Evaluation Framework

Every time you get output from AI, run it through ARCB:

**A — Accuracy:** Is the information factually correct?
- Check specific claims against reliable sources
- Verify any numbers, dates, or statistics
- Look up any citations — do they actually exist?

**R — Relevance:** Does this actually answer my question?
- AI sometimes gives technically correct but irrelevant information
- Watch for AI "padding" — impressive-sounding filler

**C — Completeness:** Is anything important missing?
- AI may present a partial picture as the complete story
- Ask: What would an expert add?

**B — Bias:** Is this presentation fair and balanced?
- AI can reflect biases from its training data
- Look for one-sided presentations, cultural assumptions, stereotypes

### Red Flags That Demand Verification

- Specific statistics without sources
- Named citations you haven't verified
- Medical, legal, or financial advice
- Claims about specific people or events
- Information that confirms exactly what you wanted to hear

### The Two-Source Rule

For any AI-generated information you plan to use:
1. Find at least TWO independent, reliable sources that confirm it
2. If you can't confirm it with two sources, don't use it
3. If two sources contradict the AI, trust the sources

### A Hard Truth

AI sounds equally confident whether it's right or wrong. Your gut feeling of "this sounds right" is unreliable. Only verification is reliable.`,
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

AI is a power tool. Like any power tool, it can build something amazing or cause serious harm. The difference is the person using it.

### What You Should Never Share with AI

Everything you type into an AI chatbot may be:
- **Stored on company servers** — potentially forever
- **Read by human reviewers** — companies hire people to review conversations
- **Used to train future AI models** — your words might influence future AI

**NEVER share with AI:**
- Social Security numbers, passwords, or financial account numbers
- Private medical information (yours or anyone else's)
- Other people's personal information without their consent
- Confidential information from a job or organization
- Anything you wouldn't want posted on a public billboard

### Academic Integrity and AI

**When AI use is typically OK:**
- Brainstorming ideas
- Getting explanations of concepts you're studying
- Checking grammar on YOUR writing
- Generating practice quiz questions

**When AI use is typically NOT OK:**
- Having AI write your essay and submitting it as your own
- Using AI to complete assignments designed to develop YOUR skills
- Copying AI output without disclosure
- Using AI on tests unless explicitly permitted

**The Golden Rule:** If your teacher would feel deceived by how you used AI, you used it wrong.

### How to Cite AI

When you use AI assistance, cite it:
"This section was drafted with assistance from [AI Tool Name], then revised and fact-checked by [Your Name]."

### The Accountability Principle

**You are 100% responsible for anything AI helps you create.**

- If AI writes something inaccurate and you publish it: YOUR mistake
- If AI generates something offensive and you share it: YOUR choice
- If AI gives wrong advice and you follow it: YOUR decision

"AI told me to" is never an acceptable excuse.

### Fairness and AI Bias

AI systems can perpetuate unfairness:
- Image generators defaulting to certain races for certain professions
- Language models associating certain groups with certain traits
- Hiring AI disadvantaging underrepresented candidates

Your responsibility: **Notice bias. Name it. Don't amplify it.**

### Your AI Ethics Code

Write your own personal AI ethics code. Include:
1. What you will and won't share with AI
2. How you will verify AI outputs
3. How you will disclose AI assistance
4. What you will do when you encounter bias
5. How you will help others use AI responsibly`,
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

At its foundation, a large language model does one thing: **predict the most likely next word (token) in a sequence.** Everything you see — essays, code, conversations, creative writing — comes from this single mechanism repeated billions of times.

When you type "The capital of France is ___", the model calculates the probability of every possible next token and picks the most likely one: "Paris." But it's not "looking up" the answer. It's predicting what text is most likely to follow that sequence based on patterns learned during training.

### Training: How LLMs Learn

**Phase 1: Pre-training**
The model reads billions of pages of text from the internet — books, articles, websites, forums, code repositories. It learns statistical patterns: which words tend to follow which other words. This takes months and millions of dollars.

**Phase 2: Fine-tuning with Human Feedback (RLHF)**
Raw pre-trained models are not helpful or safe — they just complete text patterns. Fine-tuning uses human evaluators to rate thousands of outputs. The model is adjusted to produce outputs rated as more helpful, honest, and harmless. This is why ChatGPT gives structured, helpful answers instead of random text.

### The Transformer Architecture (Simplified)

The "transformer" is the architecture that made modern LLMs possible. Its key innovation is the **attention mechanism** — the ability to look at all parts of the input simultaneously and figure out which parts are most relevant.

Example: In "The bank by the river was covered in moss," the attention mechanism helps the model understand "bank" means "riverbank" by paying attention to "river" and "moss."

### Why LLMs Hallucinate

Hallucination isn't a bug that will be fixed. It's fundamental to how these models work:

1. LLMs generate **probable** text, not **true** text
2. LLMs have no "knowledge base" they check against — just patterns and probabilities
3. LLMs cannot say "I don't know" naturally — they are trained to be helpful
4. Specific details (dates, numbers, citations) require exact recall — and the model's memory is lossy

### What This Means for You

- **Trust general patterns more than specific facts**
- **Verify everything that matters**
- **Better prompts = better outputs** — you're helping the model find better patterns
- **Context matters enormously** — the attention mechanism means your context directly shapes quality
- **Confidence ≠ accuracy** — the model generates with equal confidence whether right or wrong

### The Rate of Change

AI capabilities are advancing rapidly. But the fundamental architecture and limitations described here still apply. Understanding the foundation helps you evaluate new developments critically.`,
    },
  ]);

  await db.insert(quizQuestions).values([
    { id: "q_ai_68_understand_1", moduleId: "ai_68_understand", questionText: "What is the fundamental difference between AI and traditional software?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "AI is faster than traditional software" }, { id: "b", text: "AI learns patterns from data instead of following fixed rules" }, { id: "c", text: "AI is always more accurate" }, { id: "d", text: "AI can think like a human" }]), correctAnswer: "b", explanation: "Traditional software follows rules programmed by humans. AI learns patterns from data and makes predictions based on those patterns.", points: 10 },
    { id: "q_ai_68_understand_2", moduleId: "ai_68_understand", questionText: "When AI generates false information with complete confidence, this is called:", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "A bug that will be fixed in the next update" }, { id: "b", text: "A hallucination — a fundamental characteristic of how AI works" }, { id: "c", text: "Proof that AI is broken" }, { id: "d", text: "An intentional lie by the AI" }]), correctAnswer: "b", explanation: "AI hallucinations occur because AI predicts probable text, not true text. It sounds equally confident whether right or wrong.", points: 10 },
    { id: "q_ai_68_direct_1", moduleId: "ai_68_direct", questionText: "What does the CRAFT framework stand for in prompt engineering?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "Create, Research, Analyze, Format, Test" }, { id: "b", text: "Context, Role, Action, Format, Tone" }, { id: "c", text: "Clarity, Relevance, Accuracy, Fairness, Timing" }, { id: "d", text: "Command, Review, Apply, Fix, Transform" }]), correctAnswer: "b", explanation: "CRAFT: Context, Role, Action, Format, Tone. Using all five produces dramatically better AI outputs.", points: 10 },
    { id: "q_ai_68_evaluate_1", moduleId: "ai_68_evaluate", questionText: "What is the 'Two-Source Rule' for AI-generated information?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "Ask two different AI tools the same question" }, { id: "b", text: "Read the AI output twice before using it" }, { id: "c", text: "Verify important claims with at least two independent, reliable sources" }, { id: "d", text: "Generate the output two times to check consistency" }]), correctAnswer: "c", explanation: "Verify any important AI-generated information with at least two independent, reliable sources.", points: 10 },
    { id: "q_ai_68_responsible_1", moduleId: "ai_68_responsible", questionText: "If AI generates an inaccurate report and you submit it as your work, who is responsible?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "The AI company" }, { id: "b", text: "Nobody — it was an honest mistake" }, { id: "c", text: "You — you are 100% responsible for anything AI helps you create" }, { id: "d", text: "Your teacher for allowing AI use" }]), correctAnswer: "c", explanation: "You are 100% responsible for anything AI helps you create. 'AI told me' is never an acceptable excuse.", points: 10 },
    { id: "q_ai_912_understand_1", moduleId: "ai_912_understand", questionText: "Why do large language models hallucinate?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "Because they have bugs that need fixing" }, { id: "b", text: "Because they generate probable text, not verified truth, with no fact database to check against" }, { id: "c", text: "Because they run out of memory" }, { id: "d", text: "Because they haven't been trained on enough data" }]), correctAnswer: "b", explanation: "Hallucination is fundamental to next-token prediction. LLMs generate statistically probable text, not verified truth.", points: 10 },
    { id: "q_ai_912_evaluate_1", moduleId: "ai_912_evaluate", questionText: "Which evaluation approach is MOST reliable for verifying AI-generated statistical claims?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "Checking if the numbers seem reasonable" }, { id: "b", text: "Asking a different AI to verify" }, { id: "c", text: "Tracing the claim to primary sources and verifying methodology and sample size" }, { id: "d", text: "Accepting it if it includes a citation" }]), correctAnswer: "c", explanation: "Trace statistical claims to primary sources and evaluate methodology, sample size, and whether conclusions follow from data.", points: 10 },
    { id: "q_ai_912_responsible_1", moduleId: "ai_912_responsible", questionText: "Which law specifically protects student educational records and applies to AI tools used in schools?", questionType: "multiple_choice", options: JSON.stringify([{ id: "a", text: "HIPAA" }, { id: "b", text: "FERPA" }, { id: "c", text: "GDPR" }, { id: "d", text: "Section 508" }]), correctAnswer: "b", explanation: "FERPA protects student educational records. Schools must ensure AI tools comply with FERPA requirements.", points: 10 },
  ]);

  await db.insert(badges).values([
    { id: "ai_principles_explorer", name: "AI Principles Explorer", description: "Complete the Understand AI Principles module", category: "skill", levelRequirement: 3, rarity: "uncommon" },
    { id: "ai_tool_navigator", name: "AI Tool Navigator", description: "Complete the Explore AI Uses module", category: "skill", levelRequirement: 3, rarity: "uncommon" },
    { id: "prompt_engineer", name: "Prompt Engineer", description: "Complete the Direct AI Effectively module", category: "skill", levelRequirement: 3, rarity: "uncommon" },
    { id: "ai_fact_checker", name: "AI Fact Checker", description: "Complete the Evaluate AI Outputs module", category: "skill", levelRequirement: 3, rarity: "rare" },
    { id: "responsible_ai_user", name: "Responsible AI User", description: "Complete the Use AI Responsibly module", category: "character", levelRequirement: 3, rarity: "rare" },
    { id: "ai_literate", name: "AI Literate", description: "Complete all 5 AI Literacy content areas", category: "milestone", levelRequirement: 3, rarity: "legendary" },
    { id: "ai_master", name: "AI Master", description: "Complete all 5 Advanced AI Mastery modules (Grades 9-12)", category: "milestone", levelRequirement: 4, rarity: "legendary" },
  ]);
}
