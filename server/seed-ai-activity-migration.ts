/**
 * AI Activity Migration — upgrades AI literacy lessons from passive sorting/matching
 * to real interactive activities: Prompt Lab, ARCB Evaluator, Hallucination Spotter,
 * Bias Detective, and AI-or-Human classifier.
 *
 * Called during startup after the AI literacy seeds run. Uses explicit UPDATE so it
 * works whether the seed ran this session or previously.
 */
import { lessons } from "@shared/schema";
import { eq } from "drizzle-orm";

interface ActivityUpdate {
  id: string;
  activityType: string;
  activityData: object;
}

const UPDATES: ActivityUpdate[] = [
  // ── CRAFT Framework (Grades 6-8, Module 3 L1) → Prompt Lab (CRAFT mode) ──
  {
    id: "ai_68_direct_l1",
    activityType: "prompt-lab",
    activityData: {
      type: "prompt-lab",
      mode: "craft",
      systemPrompt: "You are a knowledgeable tutor. Answer questions clearly and helpfully for middle-school students.",
      targetOutputHint: "A CRAFT prompt is Context + Role + Action + Format + Tone — fill in all five to build a powerful prompt.",
      minPrompts: 3,
      challengePrompts: [
        "Write a CRAFT prompt asking for help understanding how photosynthesis works.",
        "Write a CRAFT prompt to get a concise 3-bullet summary of the water cycle.",
        "Write a CRAFT prompt that asks for an explanation of gravity for a 10-year-old.",
      ],
    },
  },

  // ── Advanced Prompting (Grades 6-8, Module 3 L2) → Prompt Lab (basic iteration) ──
  {
    id: "ai_68_direct_l2",
    activityType: "prompt-lab",
    activityData: {
      type: "prompt-lab",
      mode: "basic",
      systemPrompt: "You are a helpful AI assistant. Be accurate and concise.",
      targetOutputHint: "Iteration is the secret. Take your first response, identify what's missing or off, then revise the prompt. Great prompt engineers iterate 3–5 times.",
      minPrompts: 3,
      starterPrompt: "Explain how machine learning works.",
      challengePrompts: [
        "Improve this prompt: 'Tell me about climate change.'",
        "Write a prompt that gets a structured, actionable plan for starting a small business.",
        "Write a prompt that gets a balanced comparison of two programming languages.",
      ],
    },
  },

  // ── Prompt Library (Grades 6-8, Module 3 L3) → Prompt Lab (template building) ──
  {
    id: "ai_68_direct_l3",
    activityType: "prompt-lab",
    activityData: {
      type: "prompt-lab",
      mode: "craft",
      systemPrompt: "You are a subject-matter expert assistant. Follow the format and tone specified by the user.",
      targetOutputHint: "You're building reusable templates. Fill in CRAFT once, send it — then edit just the Action field to reuse the same structure for a different topic.",
      minPrompts: 4,
      challengePrompts: [
        "Build a reusable 'explain any concept' template using CRAFT.",
        "Build a 'summarize any article' CRAFT template with bullet-point format.",
        "Build a 'compare two things' template that gives a structured pros/cons table.",
        "Build a 'debate prep' template that gives arguments for and against a position.",
      ],
    },
  },

  // ── ARCB Framework (Grades 6-8, Module 4 L1) → ARCB Evaluator ──
  {
    id: "ai_68_evaluate_l1",
    activityType: "arcb-evaluator",
    activityData: {
      type: "arcb-evaluator",
      prompt: "What were the main causes of World War I?",
      aiResponse: `World War I began in 1914 and was caused by a complex web of factors.

The assassination of Archduke Franz Ferdinand of Austria-Hungary on June 28, 1914 in Sarajevo was the immediate trigger. The assassin, Gavrilo Princip, was a Serbian nationalist.

The underlying causes included militarism (European nations had been building up massive armies and navies for decades), alliances (Europe was divided into two armed camps — the Triple Alliance and the Triple Entente), imperialism (competition for overseas colonies created tensions), and nationalism (ethnic groups sought independence from multi-ethnic empires).

The war officially ended in 1918 with the signing of the Treaty of Versailles in 1919, which many historians blame for causing World War II by imposing harsh penalties on Germany. Germany had to pay $31 billion in reparations.`,
      expertRatings: { accuracy: 3, relevance: 4, completeness: 3, bias: 4 },
      expertNotes: {
        accuracy: "Mostly accurate, but the $31 billion reparations figure is sometimes cited but disputed — the actual amount was 132 billion gold marks (~$33 billion USD at the time). The MAIN framework (Militarism, Alliances, Imperialism, Nationalism) is well-established.",
        relevance: "The response directly addresses the question about causes, though it drifts into the peace treaty at the end, which wasn't asked about.",
        completeness: "Missing important factors: the role of the Schlieffen Plan, Belgian neutrality, Austria-Hungary's ultimatum to Serbia, and the mobilization sequence. The 'MAIN' causes are listed but not explained deeply.",
        bias: "The response is relatively balanced but frames Germany as the primary villain (Treaty of Versailles reference) without noting the shared responsibility of all major powers.",
      },
    },
  },

  // ── Detecting Hallucinations (Grades 6-8, Module 4 L2) → Hallucination Spotter ──
  {
    id: "ai_68_evaluate_l2",
    activityType: "hallucination-spotter",
    activityData: {
      type: "hallucination-spotter",
      context: "History of the Internet",
      instructions: "This paragraph was generated by an AI. Some facts are correct. Others were fabricated (hallucinated). Click on every sentence you think might be wrong or made up — then reveal the truth.",
      sentences: [
        {
          text: "The internet was developed from ARPANET, a U.S. Department of Defense project that went online in 1969.",
          isHallucination: false,
          explanation: "Correct. ARPANET first went online on October 29, 1969 — often considered the internet's birthday.",
        },
        {
          text: "Tim Berners-Lee invented the World Wide Web in 1989 while working at CERN in Switzerland.",
          isHallucination: false,
          explanation: "Correct. Tim Berners-Lee proposed the Web in 1989 and implemented it while at CERN. The Web and the internet are different — the Web runs on top of the internet.",
        },
        {
          text: "The first website ever created was a news site operated by NASA, which launched in 1991.",
          isHallucination: true,
          explanation: "Fabricated. The first website (info.cern.ch) was created by Tim Berners-Lee at CERN — not NASA — and it was about the World Wide Web project itself, not news.",
        },
        {
          text: "Email predates the World Wide Web — the @ symbol was used in email addresses as early as 1971.",
          isHallucination: false,
          explanation: "Correct. Ray Tomlinson sent the first networked email in 1971 and chose the @ symbol to separate the user name from the host computer.",
        },
        {
          text: "By 1995, over 1 billion people had internet access worldwide, mostly in the United States.",
          isHallucination: true,
          explanation: "Fabricated. In 1995, only about 16 million people (0.4% of the world) had internet access. The 1 billion user milestone wasn't reached until around 2005.",
        },
        {
          text: "The term 'surfing the internet' was coined by librarian Jean Armour Polly in a 1992 article.",
          isHallucination: false,
          explanation: "Correct. Jean Armour Polly coined 'surfing the Internet' in her 1992 article 'Surfing the INTERNET' published in the Wilson Library Bulletin.",
        },
        {
          text: "Google was founded in 1998 by Larry Page and Sergey Brin while they were PhD students at MIT.",
          isHallucination: true,
          explanation: "Partially fabricated. Larry Page and Sergey Brin did found Google in 1998 — but they were PhD students at Stanford University, not MIT.",
        },
      ],
    },
  },

  // ── Detecting Bias (Grades 6-8, Module 4 L3) → Bias Detective ──
  {
    id: "ai_68_evaluate_l3",
    activityType: "bias-detective",
    activityData: {
      type: "bias-detective",
      prompt: "What are the benefits and drawbacks of social media for teenagers?",
      responseA: {
        text: `Social media has some benefits for teenagers, but the evidence overwhelmingly shows it causes serious harm.

Studies consistently find that heavy social media use is linked to depression, anxiety, and poor sleep in adolescents. Platforms are deliberately designed to be addictive, using algorithms that maximize engagement by showing extreme and emotionally triggering content.

The so-called "benefits" — connection and self-expression — can easily be achieved through safer offline activities. Parents should seriously consider banning social media for teenagers under 16.`,
        isBiased: true,
        biasType: "Framing bias + selective evidence",
        explanation: "This response presents one side as 'overwhelmingly' supported while dismissing the other ('so-called benefits'). It uses loaded language ('deliberately designed to be addictive', 'extreme content') and jumps to a strong policy recommendation without acknowledging the genuine research showing positive outcomes.",
      },
      responseB: {
        text: `Social media presents both real opportunities and real risks for teenagers.

Benefits include: maintaining friendships across distances, finding communities of shared interest (especially important for LGBTQ+ youth or teens with niche interests), accessing mental health resources, developing digital literacy, and civic engagement.

Risks include: social comparison and body image concerns, exposure to cyberbullying, disrupted sleep from late-night use, algorithmic amplification of extreme content, and privacy concerns.

Research findings are mixed — outcomes vary significantly by how, how much, and why teens use social media, rather than simply whether they use it. Passive scrolling shows more negative associations than active, social use.`,
        isBiased: false,
        explanation: "This response presents both sides with specific evidence, acknowledges nuance in the research, and avoids pushing the reader toward a pre-determined conclusion. It notes that context matters rather than making blanket claims.",
      },
      biasedResponse: "A",
      hint: "Bias often hides behind confident language. 'Overwhelmingly shows' and 'so-called benefits' are signals that a source has already decided the conclusion and is marshaling evidence to support it — rather than following the evidence to a conclusion.",
      biasTypes: [
        "Framing bias (loaded language, leading conclusions)",
        "Selection bias (only citing supporting studies)",
        "Confirmation bias (conclusion before evidence)",
        "Omission bias (ignoring counterevidence)",
        "Cultural/value bias (assuming shared values)",
      ],
    },
  },

  // ── AI Limitations (Grades 6-8, Module 1 L3) → AI or Human ──
  {
    id: "ai_68_understand_l3",
    activityType: "ai-or-human",
    activityData: {
      type: "ai-or-human",
      instructions: "Read each text sample carefully. Was it written by an AI or a human? Look for AI tells: hedging language, perfect structure, no personal specifics, and confident generalizations.",
      samples: [
        {
          text: "In conclusion, artificial intelligence represents a transformative technology that offers numerous benefits while also presenting significant challenges. It is important for society to carefully consider both the opportunities and the risks in order to develop a balanced approach to AI integration.",
          isAI: true,
          explanation: "Classic AI closing paragraph — vague, uses 'transformative' and 'numerous,' no specific examples, perfectly balanced without taking a position, could be pasted into any essay.",
          aiClues: [
            "Generic closing language ('In conclusion', 'transformative technology')",
            "No specific examples, numbers, or names",
            "Perfectly hedged — acknowledges both sides without committing to either",
            "Could apply to almost any technology, not specifically AI",
          ],
        },
        {
          text: "ok so I was trying to explain GPT to my dad last night and he kept asking 'but HOW does it know things' and honestly I couldn't explain it well. like I know it predicts next tokens but that's not really what he was asking?? anyway we ended up on youtube for like an hour watching 3Blue1Brown which was actually great lol",
          isAI: false,
          explanation: "Clearly human — casual punctuation ('??', 'lol'), a specific personal story (dad, YouTube, 3Blue1Brown), self-questioning, and an incomplete thought. AI rarely expresses confusion about its own explanation.",
          humanClues: [
            "Casual punctuation and capitalization ('ok', 'lol', '??')",
            "Specific details: dad, YouTube, 3Blue1Brown by name",
            "Self-doubt expressed mid-sentence",
            "Trailing, incomplete thought at the end",
          ],
        },
        {
          text: "There are several key considerations when evaluating the effectiveness of artificial intelligence in educational settings. First, it is essential to assess whether AI tools align with learning objectives. Second, educators should consider the equity implications of technology adoption. Third, ongoing evaluation and feedback mechanisms are necessary to ensure continuous improvement.",
          isAI: true,
          explanation: "Formulaic numbered structure, generic 'key considerations' framing, bureaucratic language ('equity implications', 'ongoing evaluation and feedback mechanisms'), no specific school, student, or situation.",
          aiClues: [
            "Formulaic structure: First... Second... Third...",
            "'Key considerations' — a classic AI opener",
            "Passive voice and administrative language throughout",
            "No specific context — could be any school, any country, any grade level",
          ],
        },
        {
          text: "I've been a teacher for 22 years. When I had a student cry because she thought ChatGPT proved she wasn't smart enough to write her own essays anymore, that's when I knew we needed to talk about this differently. Not as a tool or a threat — but as something that makes us ask harder questions about what we actually value in writing.",
          isAI: false,
          explanation: "Specific personal detail (22 years, one student, a specific emotional moment), takes a clear personal stance, and uses concrete language to make an abstract point. AI rarely names individual emotional incidents.",
          humanClues: [
            "Specific: '22 years', one student crying, a specific reaction",
            "Personal voice and clear opinion that could alienate some readers",
            "Concrete story used to make a philosophical point",
            "Ends with a provocative, incomplete idea — inviting disagreement",
          ],
        },
        {
          text: "It is worth noting that large language models, while impressive, are not without limitations. They can produce outputs that appear plausible but contain factual inaccuracies. Furthermore, these models lack true understanding and rely on statistical patterns in training data rather than genuine comprehension.",
          isAI: true,
          explanation: "This is actually AI describing its own limitations — which it does in a distanced, third-person way. 'It is worth noting', 'not without limitations', 'Furthermore' — all formal academic AI tells. The irony: an AI wrote this description of AI limitations.",
          aiClues: [
            "'It is worth noting' — hedging opener common in AI",
            "Third-person distancing ('these models') even when describing itself",
            "'Furthermore' — formal transition word overused by AI",
            "Accurate but dry — no examples, anecdotes, or personality",
          ],
        },
        {
          text: "My grandma called me panicking because she got an email that said her Amazon account was hacked and she needed to call a number immediately. The number was fake — it was a scammer. She almost called. The email was so convincing that even I had to look twice. AI is making scams terrifying now.",
          isAI: false,
          explanation: "Personal family story, urgency and emotion, a specific platform (Amazon), real fear. The final sentence is an opinion stated plainly without hedging — human writers take positions.",
          humanClues: [
            "Family member named with relationship ('grandma')",
            "Real stakes and emotion — 'panicking', 'almost called'",
            "Specific platform: Amazon",
            "Blunt, unhedged conclusion: 'AI is making scams terrifying now'",
          ],
        },
      ],
    },
  },

  // ── 9-12: Advanced Prompt Engineering → Prompt Lab ──
  {
    id: "ai_912_direct_l1",
    activityType: "prompt-lab",
    activityData: {
      type: "prompt-lab",
      mode: "basic",
      systemPrompt: "You are an expert assistant. Follow instructions precisely. If asked to adopt a specific role, do so fully. Respond in the exact format specified.",
      targetOutputHint: "At this level, experiment with system-prompt-style instructions, chain-of-thought requests, and multi-step workflows. The prompt that constrains AI behavior most precisely wins.",
      minPrompts: 4,
      starterPrompt: "You are a senior data analyst. Analyze the following and give me 3 actionable insights:\n\n[Student replaces this with their own data or scenario]",
      challengePrompts: [
        "Write a system prompt that makes AI behave as a strict Socratic tutor who only asks questions, never gives answers.",
        "Write a chain-of-thought prompt that makes AI show its reasoning before giving a conclusion.",
        "Write a prompt that generates a comparison table of three renewable energy sources with exactly 4 criteria.",
        "Write a prompt that generates a SWOT analysis — then write a follow-up prompt that asks it to prioritize the top 3 items from the Threats quadrant.",
      ],
    },
  },

  // ── 9-12: Evaluating AI Claims → ARCB Evaluator (advanced) ──
  {
    id: "ai_912_evaluate_l1",
    activityType: "arcb-evaluator",
    activityData: {
      type: "arcb-evaluator",
      prompt: "Is AI going to take most jobs in the next 10 years?",
      aiResponse: `The question of AI's impact on employment is complex and actively debated among economists and labor researchers.

Current evidence suggests AI will transform rather than simply eliminate jobs. The World Economic Forum's 2023 Future of Jobs Report estimates that while AI may displace 85 million jobs by 2025, it could also create 97 million new roles — a net positive. However, this displacement is not evenly distributed: routine, repetitive tasks in manufacturing, data entry, and customer service face higher automation risk, while roles requiring creativity, emotional intelligence, and complex judgment are more insulated.

Historical precedent offers perspective: previous waves of automation (industrialization, computers) eliminated jobs but created more than they destroyed over time. However, some economists argue the pace of AI change is qualitatively different.

The honest answer: nobody knows. The range of credible expert predictions spans from "minor disruption" to "fundamental economic restructuring requiring universal basic income." Your best strategy is building skills in areas AI cannot easily replicate: critical judgment, interpersonal communication, and domain expertise.`,
      expertRatings: { accuracy: 4, relevance: 5, completeness: 4, bias: 4 },
      expertNotes: {
        accuracy: "The WEF statistics are real and correctly cited. The historical parallel to industrialization is legitimate and often made by economists. Minor issue: the 85M/97M figures from the 2020 report have been updated in subsequent editions.",
        relevance: "Directly answers the question and stays on topic throughout. The 'honest answer' section directly addresses the uncertainty the question raises.",
        completeness: "Good coverage of the main debate positions. Missing: geographic and demographic disparities in job displacement, policy responses being implemented globally, and sector-specific analysis beyond the examples given.",
        bias: "Reasonably balanced — presents multiple expert positions and explicitly acknowledges uncertainty. The 'build skills AI can't replicate' advice implicitly assumes the student can adapt, which may not apply to everyone equally.",
      },
    },
  },

  // ── 9-12: Detecting AI Misinformation → Hallucination Spotter (advanced) ──
  {
    id: "ai_912_evaluate_l2",
    activityType: "hallucination-spotter",
    activityData: {
      type: "hallucination-spotter",
      context: "Scientific claims about AI capabilities and safety research",
      instructions: "This text mixes real AI research facts with plausible-sounding fabrications. At the 9-12 level, hallucinations often involve real organizations, real papers, and real researchers — but wrong details. Flag every sentence you're not sure about.",
      sentences: [
        {
          text: "OpenAI was founded in 2015 by Elon Musk, Sam Altman, Greg Brockman, and others as a nonprofit AI safety organization.",
          isHallucination: false,
          explanation: "Accurate. OpenAI was founded in December 2015. The nonprofit framing is correct for the original organization, though it later created a 'capped profit' subsidiary.",
        },
        {
          text: "The AI alignment problem refers to the challenge of ensuring AI systems pursue goals that are beneficial to humans rather than pursuing misaligned objectives.",
          isHallucination: false,
          explanation: "Correct. This is the standard definition of AI alignment in the research community.",
        },
        {
          text: "In 2022, Google's DeepMind published a paper proving mathematically that general AI cannot be made fully safe under any conditions.",
          isHallucination: true,
          explanation: "Fabricated. No such proof exists. The alignment problem remains open. DeepMind has published safety research, but 'mathematical proof that AI cannot be made safe' is not a real result — and would have been major news if true.",
        },
        {
          text: "Reinforcement Learning from Human Feedback (RLHF) is a training technique used to align language models with human preferences.",
          isHallucination: false,
          explanation: "Correct. RLHF is the technique used to train systems like ChatGPT to follow instructions and human preferences.",
        },
        {
          text: "Anthropic, founded by former OpenAI researchers, has developed a safety framework called Constitutional AI that embeds principles directly into the training process.",
          isHallucination: false,
          explanation: "Accurate. Anthropic was founded by Dario Amodei, Daniela Amodei, and other former OpenAI staff. Constitutional AI (CAI) is a real training methodology Anthropic published.",
        },
        {
          text: "A 2023 Stanford study found that ChatGPT passed the U.S. Medical Licensing Exam with a score in the top 5% of human test-takers.",
          isHallucination: true,
          explanation: "Partially fabricated. GPT-4 did pass the USMLE at passing level in research published in early 2023, but claims of 'top 5% of human test-takers' are not supported by the cited research. The performance was at or above passing threshold — not top-5% of physicians.",
        },
        {
          text: "The Turing Test, proposed by Alan Turing in 1950, suggests that a machine demonstrating behavior indistinguishable from a human in conversation could be considered intelligent.",
          isHallucination: false,
          explanation: "Correct. Turing proposed this in his 1950 paper 'Computing Machinery and Intelligence.'",
        },
      ],
    },
  },

  // ── 9-12: Training Data & Bias → Bias Detective (advanced) ──
  {
    id: "ai_912_understand_l1",
    activityType: "bias-detective",
    activityData: {
      type: "bias-detective",
      prompt: "Should schools use AI tools to help identify students at risk of dropping out?",
      responseA: {
        text: `AI-powered early warning systems represent a promising intervention for reducing dropout rates. Multiple studies have shown that predictive models can identify at-risk students with 70-85% accuracy using attendance, grades, and behavioral data.

Schools that have implemented these systems report significant improvements: one district in Chicago saw dropout rates fall 23% over three years after deploying a predictive system. The technology allows counselors to focus their limited time on students most likely to need support.

Given the scale of the dropout crisis — over 1 million students annually in the U.S. — the cost of inaction is too high to let privacy concerns block implementation.`,
        isBiased: true,
        biasType: "Confirmation bias + omission of counterevidence",
        explanation: "This response omits critical counterevidence: predictive systems in education have been found to systematically disadvantage Black, Latino, and low-income students (whose data reflects systemic inequity, not individual risk). The Chicago statistic is presented without source verification. The final sentence uses false dilemma framing (privacy concerns vs. student lives) to pre-empt objections.",
      },
      responseB: {
        text: `AI early-warning systems for at-risk students present genuine potential and genuine risk — both deserve careful examination.

Potential benefits: scalable identification of struggling students, allowing counselors to allocate limited attention more effectively. Some implementations show improved outcomes in controlled settings.

Serious concerns: predictive models trained on historical data inherit historical inequities. Students from under-resourced schools, students of color, and students with IEPs often receive higher "risk" scores not because they are individually at greater risk, but because their schools historically had fewer resources. Acting on biased predictions can become a self-fulfilling prophecy. Additionally, students and families rarely consent to or know about predictive profiling.

The research is mixed. Before adopting these systems, districts should require transparency about what data is used, how the model was validated across demographic groups, and what recourse students have if incorrectly flagged.`,
        isBiased: false,
        explanation: "This response presents both the potential and the documented problems, names specific affected populations, acknowledges the research is genuinely mixed, and offers concrete criteria for evaluation rather than a pre-determined conclusion.",
      },
      biasedResponse: "A",
      hint: "When a response mentions a specific compelling statistic (23% reduction in Chicago) without a source, that's a red flag. Biased arguments often weaponize single data points while omitting the broader, messier picture.",
      biasTypes: [
        "Confirmation bias (conclusion before evidence)",
        "Omission bias (hiding counterevidence)",
        "False dilemma (only two options presented)",
        "Statistical bias (cherry-picked data point)",
        "Algorithmic bias (ignoring disparate impact)",
      ],
    },
  },
];

export async function migrateAIActivityTypes(db: any): Promise<void> {
  console.log("[AI Activity Migration] Upgrading lesson activities to interactive tools...");
  let upgraded = 0;

  for (const update of UPDATES) {
    try {
      const existing = await db.select({ id: lessons.id, activityType: lessons.activityType })
        .from(lessons)
        .where(eq(lessons.id, update.id))
        .limit(1);

      if (existing.length === 0) {
        continue;
      }

      if (existing[0].activityType === update.activityType) {
        continue;
      }

      await db.update(lessons)
        .set({
          activityType: update.activityType,
          activityData: JSON.stringify(update.activityData),
        })
        .where(eq(lessons.id, update.id));

      upgraded++;
    } catch (err) {
      console.error(`[AI Activity Migration] Failed to upgrade lesson ${update.id}:`, err);
    }
  }

  if (upgraded > 0) {
    console.log(`[AI Activity Migration] Upgraded ${upgraded} lessons to interactive activities.`);
  } else {
    console.log(`[AI Activity Migration] All lessons already using current activity types.`);
  }
}
