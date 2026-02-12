import { curriculumDocuments } from "@shared/schema";

export async function seedCurriculumDocuments(db: any): Promise<void> {
  const documents = [
    // ============================================================
    // LEVEL 1 MODULE 1: What is AI? (Grade Band 3-5)
    // ============================================================
    {
      id: "doc_level_1_module_1_guide",
      moduleId: "level_1_module_1",
      levelId: 1,
      title: "Student Guide: What is AI?",
      gradeBand: "3-5",
      documentType: "curriculum_guide",
      standardsAlignment: ["ISTE 1.1 Empowered Learner", "ISTE 1.3 Knowledge Constructor", "CSTA 1B-CS-01"],
      content: `# What is AI? - Your Student Guide

## Welcome, Explorer!

Have you ever talked to Alexa or Siri? Have you ever noticed how YouTube seems to know exactly what videos you want to watch next? That is Artificial Intelligence - or AI for short - at work! AI is one of the most exciting things happening in our world right now, and you are about to learn all about it.

## What Exactly is AI?

AI stands for **Artificial Intelligence**. Let us break that down:
- **Artificial** means something made by people (not found in nature)
- **Intelligence** means the ability to learn and solve problems

So AI is a **smart helper made by people** that can learn from information and help us do things. Think of AI like a super-powered assistant that never gets tired, can read millions of books in seconds, and remembers everything it has ever learned.

But here is the really important part: **AI is not alive.** It does not have feelings. It does not get happy when you say "thank you" or sad when you ignore it. AI is a tool - like a really, really smart calculator.

## Key Vocabulary

Here are some important words you will need to know:

- **Artificial Intelligence (AI):** A computer program that can learn from information and make decisions
- **Algorithm:** A set of step-by-step instructions that tells a computer what to do (like a recipe!)
- **Data:** Information that AI uses to learn (words, pictures, numbers)
- **Pattern:** Something that repeats in a predictable way - AI is great at finding patterns!
- **Input:** What you give to AI (your question or instruction)
- **Output:** What AI gives back to you (the answer or result)

## Where Can You Find AI?

AI is hiding in more places than you might think! Here are some everyday examples:

**At Home:**
- Smart speakers (Alexa, Google Home) that answer your questions
- Netflix and YouTube recommendations ("You might also like...")
- Robot vacuums that learn the layout of your house
- Spell-check on your computer or tablet

**At School:**
- Educational apps that adjust to your learning level
- Search engines that help you find information
- Translation tools that help you read other languages

**For Fun:**
- Video game characters that react to what you do
- Filters on photos and videos
- Music apps that create playlists just for you

## What AI Can and Cannot Do

**AI CAN:**
- Read and process huge amounts of information very quickly
- Find patterns in data that humans might miss
- Answer questions based on what it has learned
- Create text, images, and music based on instructions
- Work 24 hours a day without getting tired

**AI CANNOT:**
- Feel emotions like happiness, sadness, or fear
- Truly understand what it is like to be a person
- Make moral decisions about right and wrong on its own
- Think creatively the way humans do
- Replace the love and care of real people

## Fun Activities

### Activity 1: AI Scavenger Hunt
Go around your home or classroom and find **5 things** that use AI. Write them down and share with a friend! Hint: think about anything that seems to "know" what you want.

### Activity 2: AI vs. Human Sorting Game
Make two columns: "Only Humans Can Do This" and "AI Can Help With This." Sort these activities:
- Give a friend a hug
- Translate a sentence to Spanish
- Write a poem about your feelings
- Recommend a movie you might like
- Comfort someone who is sad
- Sort thousands of photos by what is in them

### Activity 3: Draw Your AI Helper
If you could design your own AI helper, what would it look like? What would it do? Draw it and write three things it could help you with!

## Remember!

AI is an amazing tool, but it is just that - a **tool**. You are the creative, feeling, thinking human who gets to decide how to use it. Learning about AI now means you will be ready to use it wisely as you grow up. You are already on your way to becoming an AI Explorer!

## Check Your Understanding

1. What does AI stand for?
2. Name three places where you can find AI in your daily life.
3. What is one thing AI cannot do that humans can?
4. Why is AI more like a tool than a friend?
`,
    },
    {
      id: "doc_level_1_module_1_lesson",
      moduleId: "level_1_module_1",
      levelId: 1,
      title: "Teacher Guide: What is AI?",
      gradeBand: "3-5",
      documentType: "lesson_plan",
      standardsAlignment: ["ISTE 1.1 Empowered Learner", "ISTE 1.3 Knowledge Constructor", "CSTA 1B-CS-01", "ISTE 6.1 Facilitator"],
      content: `# Teacher Implementation Guide: What is AI?

## Module Overview
This module introduces students in grades 3-5 to the fundamental concept of Artificial Intelligence. Students will learn what AI is, discover where AI exists in their daily lives, and understand the important distinction between AI capabilities and human qualities like emotions and creativity.

## Learning Objectives
By the end of this module, students will be able to:
1. Define Artificial Intelligence in their own words
2. Identify at least 5 examples of AI in daily life
3. Distinguish between what AI can and cannot do
4. Understand that AI is a tool created by people

## Session Structure (2 sessions, 20 minutes each)

### Session 1: What is AI?
**Materials:** Whiteboard, markers, printed AI Scavenger Hunt worksheet

**Warm-Up (3 min):** Ask students: "Has anyone talked to Alexa, Siri, or Google today?" Let a few students share their experiences.

**Direct Instruction (7 min):** Introduce AI as a "smart helper made by people." Use the analogy of a super-powered student who reads millions of books. Emphasize that AI is NOT alive and does NOT have feelings. Write key vocabulary on the board.

**Guided Practice (7 min):** Lead the class through the AI vs. Human Sorting Game. Use large cards or a projected display. Have students vote on where each activity belongs. Discuss surprising answers.

**Wrap-Up (3 min):** Assign the AI Scavenger Hunt as homework. Students should find 5 things at home that use AI.

### Session 2: AI All Around Us
**Materials:** Students' completed scavenger hunts, drawing supplies

**Warm-Up (3 min):** Have students share their scavenger hunt findings in pairs.

**Discussion (7 min):** Create a class list of AI examples on the board. Categorize them (home, school, fun). Discuss which ones surprised students the most.

**Creative Activity (7 min):** Students draw their own AI helper and write three things it could do. Remind them: AI cannot feel emotions or make moral choices.

**Wrap-Up (3 min):** Gallery walk of AI helper drawings. Class pledge: "I will use AI as a helpful tool!"

## Differentiation Strategies

### For Students Who Need More Support:
- Provide picture cards for the sorting activity
- Pair with a buddy for the scavenger hunt
- Offer sentence starters: "AI is like a _____ because _____"
- Use simpler vocabulary: "smart computer helper" instead of "artificial intelligence"

### For Advanced Learners:
- Challenge them to find AI examples in unexpected places
- Ask them to write a paragraph comparing AI to a human brain
- Have them create a "Did You Know?" fact card about AI for younger students
- Encourage them to think about: "What problems could AI solve at our school?"

### For English Language Learners:
- Provide vocabulary cards with pictures and translations
- Use visual demonstrations whenever possible
- Allow drawing or acting out answers instead of writing
- Pair with a bilingual buddy when available

## Assessment Ideas

### Formative Assessment:
- Exit ticket: "Write or draw one thing AI can do and one thing only humans can do"
- Thumbs up/down during sorting activity to check understanding
- Observe scavenger hunt participation and discussion contributions

### Summative Assessment:
- Students create a mini-poster explaining what AI is in their own words
- Portfolio entry: AI helper drawing with written description
- Oral presentation: Share one AI example and explain how it works

## Family Connection
Send home a brief family letter explaining what students are learning about AI. Include conversation starters like: "Ask your child to show you where AI is in your home!" This builds a bridge between school learning and home life and helps families feel comfortable with the topic.

## Common Misconceptions to Address
- "AI is like a robot" - Clarify that AI is the brain/software, not a physical robot
- "AI can think like people" - Emphasize AI processes data but does not truly understand
- "AI is always right" - Plant the seed for Module 3 (AI Can Make Mistakes)
- "AI will take over the world" - Address fears gently, emphasizing AI as a tool
`,
    },
    {
      id: "doc_level_1_module_1_rubric",
      moduleId: "level_1_module_1",
      levelId: 1,
      title: "Assessment Rubric: What is AI?",
      gradeBand: "3-5",
      documentType: "assessment_rubric",
      standardsAlignment: ["ISTE 1.1 Empowered Learner", "CSTA 1B-CS-01"],
      content: `# Assessment Rubric: What is AI?

## Module: What is AI? | Grade Band: 3-5

### Criteria 1: Understanding of AI Definition
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student defines AI accurately in their own words, provides an original analogy, and explains why AI is different from living things. Demonstrates deep conceptual understanding beyond what was taught. |
| **Meeting (3)** | Student defines AI as a "smart helper made by people" or equivalent, and correctly states that AI is not alive and does not have feelings. Uses vocabulary appropriately. |
| **Approaching (2)** | Student has a partial understanding of AI. May define it as "a computer" or "a robot" without distinguishing AI from regular technology. May confuse AI with science fiction concepts. |
| **Beginning (1)** | Student cannot define AI or provides inaccurate definitions. Significant misconceptions remain, such as believing AI has feelings or is alive. |

### Criteria 2: Identifying AI in Daily Life
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student identifies 5 or more accurate AI examples across multiple categories (home, school, entertainment). Can explain HOW AI is being used in each example. Finds creative/non-obvious examples. |
| **Meeting (3)** | Student identifies 3-5 accurate examples of AI in daily life. Can name the device or app and generally explain that AI is involved. |
| **Approaching (2)** | Student identifies 1-2 accurate examples but may also include non-AI technology (e.g., a toaster). Limited understanding of where AI is used vs. regular technology. |
| **Beginning (1)** | Student cannot identify examples of AI in daily life or consistently confuses AI with non-AI technology. |

### Criteria 3: AI Capabilities vs. Limitations
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student accurately sorts all items in the AI vs. Human activity. Provides thoughtful explanations for why certain things require human qualities like empathy, creativity, and moral judgment. Can articulate nuance. |
| **Meeting (3)** | Student correctly identifies most capabilities and limitations of AI. Understands that AI cannot feel emotions or make moral decisions. Completes the sorting activity with few errors. |
| **Approaching (2)** | Student understands some AI limitations but may believe AI has some human qualities. Makes several errors in the sorting activity. Needs guidance to distinguish AI capabilities from human ones. |
| **Beginning (1)** | Student cannot distinguish between AI capabilities and human-only abilities. May believe AI has feelings or can replace human relationships. |

### Criteria 4: Engagement and Participation
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Actively participates in all activities. Asks thoughtful questions. Helps classmates understand concepts. Completes scavenger hunt with detailed observations and shares findings enthusiastically. |
| **Meeting (3)** | Participates in class activities and discussions. Completes the scavenger hunt. Shares at least one finding with the class or a partner. |
| **Approaching (2)** | Participates inconsistently. May complete the scavenger hunt partially. Limited engagement in discussions but shows effort when prompted. |
| **Beginning (1)** | Minimal participation in activities. Scavenger hunt incomplete or not attempted. Needs significant encouragement to engage with the material. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 14-16 | Exceeding Expectations |
| 10-13 | Meeting Expectations |
| 6-9 | Approaching Expectations |
| 4-5 | Beginning |

### Teacher Notes
- This is an introductory module; prioritize enthusiasm and curiosity over perfect accuracy
- Students who score "Beginning" may need pre-teaching of basic technology vocabulary
- Use formative assessments throughout to adjust instruction in real-time
- Celebrate all levels of achievement - every student is beginning their AI journey
`,
    },

    // ============================================================
    // LEVEL 1 MODULE 2: Talking to AI (Grade Band 3-5)
    // ============================================================
    {
      id: "doc_level_1_module_2_guide",
      moduleId: "level_1_module_2",
      levelId: 1,
      title: "Student Guide: Talking to AI",
      gradeBand: "3-5",
      documentType: "curriculum_guide",
      standardsAlignment: ["ISTE 1.1 Empowered Learner", "ISTE 1.5 Computational Thinker", "CSTA 1B-AP-08"],
      content: `# Talking to AI - Your Student Guide

## Hello Again, Explorer!

Now that you know what AI is, it is time to learn how to **talk** to it! Talking to AI is not like talking to your friends or family. AI needs very clear and specific instructions to help you. Think of it like giving directions to someone who has never been to your neighborhood before - the more details you give, the better they can find your house!

## The Big Idea: Garbage In, Garbage Out

There is a funny saying in the computer world: **"Garbage in, garbage out."** This means if you give AI unclear or messy instructions, you will get unclear or messy results. But if you give AI **clear and specific** instructions, you will get much better results!

**Example:**
- Vague instruction: "Tell me about animals" (AI does not know which animals, what facts, or how much to write!)
- Clear instruction: "Tell me three fun facts about dolphins that a third grader would understand"

See the difference? The second instruction tells AI exactly what you want!

## Key Vocabulary

- **Prompt:** The instruction or question you give to AI
- **Specific:** Giving exact details (not vague or general)
- **Context:** Extra information that helps AI understand what you need
- **Iterate:** Trying again with a better prompt when the first one does not work
- **Refine:** Making your prompt better and more detailed

## The Magic Recipe for Great Prompts

When you talk to AI, try to include these ingredients:

1. **WHO** is this for? (a kid, a teacher, a parent)
2. **WHAT** do you want? (a story, facts, a list, a poem)
3. **HOW** should it be? (funny, simple, short, detailed)
4. **ABOUT** what topic? (dinosaurs, space, cooking)

### Example:
"Write a **funny poem** (WHAT + HOW) **about frogs** (ABOUT) that a **third grader** (WHO) would enjoy."

That is so much better than just saying "Write a poem"!

## Fun Activities

### Activity 1: Silly vs. Clear Instructions
Try giving these instructions to AI (or a friend pretending to be AI) and see what happens:

**Silly/Vague:** "Make me something"
**Clear:** "Draw me a picture of a purple cat wearing a top hat on the moon"

**Silly/Vague:** "Help"
**Clear:** "Help me understand why the sky is blue using words a 9-year-old would know"

### Activity 2: Fix the Prompt!
These prompts are not very good. Can you make them better?
1. "Tell me stuff" → Try: "Tell me five interesting facts about outer space for kids"
2. "Write something" → Try: "Write a short story about a dog who discovers a treasure map"
3. "Math help" → Try: "Explain how to multiply 7 times 8 step by step"

### Activity 3: The Prompt Chain Game
Start with a simple prompt and keep making it better!
- Start: "Tell me about dogs"
- Better: "Tell me about golden retrievers"
- Even better: "Tell me three reasons golden retrievers make great family pets"
- Best: "Tell me three reasons golden retrievers make great family pets, written for a kid who is thinking about getting their first dog"

### Activity 4: Polite Prompting Practice
Did you know you can be polite to AI? While AI does not have feelings, practicing good communication helps YOU become a better communicator. Try adding "please" and "thank you" to your prompts!

## Tips for Talking to AI

1. **Be specific** - The more details you give, the better the result
2. **Try again** - If you do not like the answer, change your prompt and try again
3. **Ask follow-up questions** - You can say "Can you make that simpler?" or "Can you give me more details?"
4. **Check the answer** - Always make sure AI's response makes sense
5. **Be patient** - Great prompts take practice!

## Remember!

Learning to talk to AI is like learning any new skill - it takes practice! Every time you write a prompt, you are getting better at communicating clearly. This is a skill that will help you in school, at home, and when you grow up. Keep practicing, Explorer!

## Check Your Understanding

1. What does "garbage in, garbage out" mean?
2. What are the four ingredients of a great prompt?
3. Why is "Tell me about animals" not as good as "Tell me three fun facts about dolphins for a third grader"?
4. What can you do if AI gives you an answer you do not like?
`,
    },
    {
      id: "doc_level_1_module_2_lesson",
      moduleId: "level_1_module_2",
      levelId: 1,
      title: "Teacher Guide: Talking to AI",
      gradeBand: "3-5",
      documentType: "lesson_plan",
      standardsAlignment: ["ISTE 1.1 Empowered Learner", "ISTE 1.5 Computational Thinker", "CSTA 1B-AP-08", "CCSS.ELA-LITERACY.W.3.4"],
      content: `# Teacher Implementation Guide: Talking to AI

## Module Overview
This module teaches students how to communicate effectively with AI through clear, specific prompts. Students learn the concept of "garbage in, garbage out" and practice writing structured prompts using the WHO/WHAT/HOW/ABOUT framework.

## Learning Objectives
1. Give clear, specific instructions to AI
2. Understand the concept of "garbage in, garbage out"
3. Practice iterating and refining prompts
4. Use polite, precise communication skills

## Session Structure (2 sessions, 20 minutes each)

### Session 1: The Art of Clear Instructions
**Materials:** Whiteboard, prompt worksheets, access to age-appropriate AI tool (optional)

**Warm-Up (3 min):** Play "Robot Teacher" - tell a student volunteer to act as a robot and follow instructions literally. Give vague instructions like "Go there" and watch the humor. Then give specific instructions and compare.

**Direct Instruction (7 min):** Introduce "garbage in, garbage out" with visual examples on the board. Show side-by-side comparisons of vague vs. specific prompts and their results. Introduce the WHO/WHAT/HOW/ABOUT framework.

**Guided Practice (7 min):** As a class, transform three vague prompts into specific ones using the framework. Write them together on the board. Celebrate creative additions.

**Wrap-Up (3 min):** Each student writes one clear prompt on a sticky note. Post on the "Prompt Wall" for next session.

### Session 2: Prompt Practice Lab
**Materials:** Printed prompt worksheets, prompt chain templates, AI access (if available)

**Warm-Up (3 min):** Review the Prompt Wall from last session. Vote on the clearest prompt. Discuss why it won.

**Practice (10 min):** Students work in pairs on the "Fix the Prompt" activity. Each pair rewrites three vague prompts. If AI tools are available, test prompts and compare results. If not, pairs trade and evaluate each other's prompts.

**Prompt Chain (5 min):** Demonstrate the prompt chain concept. Start with a basic prompt and iterate as a class, making it better each time.

**Wrap-Up (2 min):** Share takeaways. Remind students that clear communication helps in ALL areas of life, not just with AI.

## Differentiation Strategies

### For Students Who Need More Support:
- Provide fill-in-the-blank prompt templates
- Use visual prompt builders with picture cues
- Offer a "prompt word bank" with helpful adjectives and details
- Model several examples before independent practice

### For Advanced Learners:
- Challenge them to write prompts with constraints (e.g., "under 20 words")
- Have them create a "Prompt Tips" poster for the classroom
- Ask them to test how different prompt styles change AI output
- Introduce the concept of follow-up prompts and conversation chains

### For English Language Learners:
- Provide bilingual prompt templates
- Allow prompts in their home language to demonstrate the concept
- Use visual examples extensively
- Focus on the structure of prompts rather than vocabulary sophistication

## Assessment Ideas

### Formative:
- Evaluate sticky note prompts for specificity
- Monitor pair work discussions for understanding of prompt quality
- Use "prompt rating" cards (1-5 stars) during class examples

### Summative:
- Students submit three improved prompts with explanations of what changed
- Compare before/after prompt results if AI tools are available
- Portfolio reflection: "What I learned about talking to AI"

## Cross-Curricular Connections
- **ELA:** Clear writing skills, descriptive language, specificity in communication
- **Math:** Following step-by-step instructions, precision in language
- **Social Studies:** How communication skills help in all aspects of life
`,
    },
    {
      id: "doc_level_1_module_2_rubric",
      moduleId: "level_1_module_2",
      levelId: 1,
      title: "Assessment Rubric: Talking to AI",
      gradeBand: "3-5",
      documentType: "assessment_rubric",
      standardsAlignment: ["ISTE 1.1 Empowered Learner", "ISTE 1.5 Computational Thinker", "CSTA 1B-AP-08"],
      content: `# Assessment Rubric: Talking to AI

## Module: Talking to AI | Grade Band: 3-5

### Criteria 1: Prompt Specificity
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student consistently writes highly specific prompts that include WHO, WHAT, HOW, and ABOUT. Prompts are creative and demonstrate deep understanding of what makes communication clear. |
| **Meeting (3)** | Student writes specific prompts that include at least 3 of the 4 framework elements. Prompts show clear intent and would produce useful AI responses. |
| **Approaching (2)** | Student writes prompts with some specific details but misses key elements. Prompts are better than vague but still lack full clarity. Needs prompting to add details. |
| **Beginning (1)** | Student writes vague, one-word or very general prompts. Does not yet demonstrate understanding of how specificity improves AI communication. |

### Criteria 2: Understanding "Garbage In, Garbage Out"
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student explains the concept in their own words with original examples. Can predict how changing a prompt would change the output. Applies concept independently. |
| **Meeting (3)** | Student understands that clear inputs lead to clear outputs and vague inputs lead to poor results. Can identify which of two prompts would produce better results. |
| **Approaching (2)** | Student has a basic understanding but struggles to apply it consistently. Can identify a vague prompt but may not know how to improve it without support. |
| **Beginning (1)** | Student does not yet understand the connection between prompt quality and output quality. Cannot distinguish between vague and specific prompts. |

### Criteria 3: Iteration and Refinement
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student independently refines prompts through multiple iterations. Shows creativity in adding context and constraints. Can guide others in improving their prompts. |
| **Meeting (3)** | Student can improve a prompt when given feedback or shown an example. Demonstrates willingness to try again and make changes. Participates in prompt chain activities. |
| **Approaching (2)** | Student makes minor improvements to prompts with teacher guidance. May add one detail but struggles to know what else to improve. |
| **Beginning (1)** | Student does not attempt to refine prompts or makes changes that do not improve clarity. May give up after the first attempt. |

### Criteria 4: Communication Skills
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student uses precise, descriptive language in all prompts. Demonstrates understanding that clear communication is a life skill beyond AI. Models good communication for peers. |
| **Meeting (3)** | Student uses clear language and includes relevant details in prompts. Shows effort to communicate precisely. Uses polite language when interacting with AI. |
| **Approaching (2)** | Student communicates basic ideas but lacks descriptive detail. Language may be imprecise or ambiguous. Inconsistent use of the prompt framework. |
| **Beginning (1)** | Student struggles to express ideas clearly in writing. Prompts are fragmentary or unclear. Needs significant support with written communication. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 14-16 | Exceeding Expectations |
| 10-13 | Meeting Expectations |
| 6-9 | Approaching Expectations |
| 4-5 | Beginning |
`,
    },

    // ============================================================
    // LEVEL 1 MODULE 3: AI Can Make Mistakes (Grade Band 3-5)
    // ============================================================
    {
      id: "doc_level_1_module_3_guide",
      moduleId: "level_1_module_3",
      levelId: 1,
      title: "Student Guide: AI Can Make Mistakes",
      gradeBand: "3-5",
      documentType: "curriculum_guide",
      standardsAlignment: ["ISTE 1.3 Knowledge Constructor", "ISTE 1.2 Digital Citizen", "CSTA 1B-IC-18"],
      content: `# AI Can Make Mistakes - Your Student Guide

## Important News, Explorer!

You have learned what AI is and how to talk to it. Now it is time for one of the most important lessons in your AI journey: **AI can make mistakes!** Even though AI is really smart and can read millions of books, it does not always get things right. Knowing this makes YOU smarter than AI in a very important way.

## Why Does AI Make Mistakes?

### Reason 1: AI Learns from People (And People Make Mistakes!)
AI learns by reading things that people have written. But people do not always write correct information. If AI reads wrong information, it might repeat that wrong information to you. It is like the game of telephone - if someone whispers the wrong thing, the message at the end is wrong too!

### Reason 2: AI Does Not Really "Understand"
When you read a story about a dog, you UNDERSTAND what a dog is - you can picture it, remember petting one, and know what it feels like. AI just knows that certain words go together. It knows "dog" goes with "bark" and "pet" and "tail," but it has never actually seen or touched a dog!

### Reason 3: AI Can Get Confused
Sometimes AI gets mixed up, especially with:
- Math problems (yes, even a computer can mess up math!)
- Recent events (AI may not know what happened yesterday)
- Facts about real people (it might mix up information)
- Jokes and sarcasm (AI does not always get humor)

## Key Vocabulary

- **Hallucination:** When AI confidently states something that is completely wrong (it "makes things up")
- **Bias:** When AI has unfair preferences because of the data it learned from
- **Fact-check:** Checking if information is true by looking at multiple sources
- **Source:** Where information comes from (a book, a website, an expert)
- **Verify:** Making sure something is correct and true
- **Critical thinking:** Thinking carefully about whether something is true before believing it

## The Two-Source Rule

Here is a super helpful rule to follow: **Always check important information with at least TWO trustworthy sources.** If AI tells you something important, ask a trusted adult OR look it up in a book or reliable website.

Think of it like being a detective - detectives do not believe the first thing they hear. They gather evidence from different places!

## Fun Activities

### Activity 1: Spot the Error!
AI answered these questions. Can you find what is wrong?

- "What is 15 + 28?" AI says: "15 + 28 = 42" (Hmm... is that right? Check it yourself!)
- "Who was the first person on the moon?" AI says: "Buzz Aldrin was the first person to walk on the moon" (Close, but not exactly right!)
- "How many states are in the United States?" AI says: "There are 52 states" (Wait a minute...)

### Activity 2: Ask an Adult!
Practice this important skill: When AI tells you something that seems surprising or important, ask a trusted adult to help you check it. Try it three times this week and write down what happened.

### Activity 3: Be a Fact Detective
Pick a topic you love (dinosaurs, ocean animals, space, etc.). Ask AI three questions about it. Then look up the answers in a book or trusted website. Did AI get them all right?

## When Should You Double-Check AI?

**ALWAYS check when:**
- AI tells you something about health or safety
- You are using AI information for schoolwork
- Something sounds too good (or too scary) to be true
- AI gives you information about a real person
- The information is about something very recent

**It is probably okay when:**
- AI helps you brainstorm silly story ideas
- You are using AI for fun creative projects
- AI generates a song or poem (creativity is flexible!)

## Remember!

Making mistakes is not bad - even humans make mistakes! The difference is that **you** can learn to recognize mistakes and fix them. When you fact-check AI, you are showing that you are a critical thinker. That is one of the most important skills you can have! Be proud that you are learning to think for yourself while still using AI as a helpful tool.

## Check Your Understanding

1. Name two reasons why AI might give a wrong answer.
2. What is the Two-Source Rule?
3. When should you ALWAYS double-check what AI tells you?
4. What does "hallucination" mean when talking about AI?
`,
    },
    {
      id: "doc_level_1_module_3_lesson",
      moduleId: "level_1_module_3",
      levelId: 1,
      title: "Teacher Guide: AI Can Make Mistakes",
      gradeBand: "3-5",
      documentType: "lesson_plan",
      standardsAlignment: ["ISTE 1.3 Knowledge Constructor", "ISTE 1.2 Digital Citizen", "CSTA 1B-IC-18", "CCSS.ELA-LITERACY.RI.3.1"],
      content: `# Teacher Implementation Guide: AI Can Make Mistakes

## Module Overview
This critical module teaches students that AI is not infallible. Students learn why AI makes mistakes, how to identify errors, and the importance of fact-checking. This module builds essential critical thinking skills that transfer to all areas of learning.

## Learning Objectives
1. Understand that AI learns from imperfect human-created data
2. Recognize that AI can give wrong, misleading, or fabricated answers
3. Practice fact-checking AI outputs using multiple sources
4. Develop the habit of consulting trusted adults when unsure

## Session Structure (2 sessions, 20 minutes each)

### Session 1: Even Smart Helpers Make Mistakes
**Materials:** Prepared AI "wrong answers," fact-checking worksheets

**Warm-Up (3 min):** Share a funny example: "I asked AI what sound a cat makes and it said 'Woof!'" Ask: "Why might AI get confused?" Discuss briefly.

**Direct Instruction (7 min):** Explain the three reasons AI makes mistakes using age-appropriate language. Use the telephone game analogy for learning from imperfect data. Show 3-4 examples of real AI mistakes (pre-screened for age-appropriateness).

**Guided Practice (7 min):** "Spot the Error" activity as a class. Present AI-generated responses with intentional mistakes. Have students identify what is wrong and discuss how they knew.

**Wrap-Up (3 min):** Introduce the Two-Source Rule. Practice with one example as a class.

### Session 2: Be a Fact Detective
**Materials:** Age-appropriate reference books, fact-checking worksheets, devices (optional)

**Warm-Up (3 min):** Review the Two-Source Rule. Ask: "Who checked something AI said this week?"

**Practice (10 min):** Students work in small groups as "Fact Detectives." Each group receives 3 AI-generated claims about a familiar topic. Groups must determine which are accurate and which are wrong using classroom resources.

**Discussion (5 min):** Groups share their findings. Discuss: "Was it easy or hard to spot mistakes? What clues helped you?"

**Wrap-Up (2 min):** Reinforce that checking AI is a sign of being SMART, not being rude to AI.

## Differentiation Strategies

### For Students Who Need More Support:
- Use simple, obvious AI mistakes first (e.g., "The sky is green")
- Provide a fact-checking checklist with steps
- Pair with a reading buddy for source comparison
- Use picture-based fact-checking activities

### For Advanced Learners:
- Introduce the concept of AI "hallucinations"
- Challenge them to find subtle AI mistakes on their own
- Ask them to create a "Fact-Check Guide" for classmates
- Explore why AI makes mistakes with certain types of questions

### For English Language Learners:
- Provide visual comparisons (correct vs. incorrect)
- Use familiar topics for fact-checking practice
- Offer translated key vocabulary
- Allow verbal rather than written responses

## Assessment Ideas

### Formative:
- Monitor group discussions during Fact Detective activity
- Check for understanding during error-spotting exercise
- Exit ticket: "Name one reason AI might be wrong"

### Summative:
- Fact Detective report: Document one AI mistake and how they found it
- Create a poster about the Two-Source Rule
- Teach a younger student or family member about checking AI

## Important Teacher Notes
- Be careful not to make students afraid of AI - the goal is critical thinking, not fear
- Emphasize that making mistakes is normal for both AI and humans
- Frame fact-checking as an empowering skill, not a burden
- Celebrate students who catch AI mistakes - they are practicing real critical thinking
`,
    },
    {
      id: "doc_level_1_module_3_rubric",
      moduleId: "level_1_module_3",
      levelId: 1,
      title: "Assessment Rubric: AI Can Make Mistakes",
      gradeBand: "3-5",
      documentType: "assessment_rubric",
      standardsAlignment: ["ISTE 1.3 Knowledge Constructor", "ISTE 1.2 Digital Citizen", "CSTA 1B-IC-18"],
      content: `# Assessment Rubric: AI Can Make Mistakes

## Module: AI Can Make Mistakes | Grade Band: 3-5

### Criteria 1: Understanding Why AI Makes Mistakes
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student explains multiple reasons AI can be wrong, using their own examples. Can articulate that AI learns from imperfect data and does not truly "understand." Demonstrates nuanced thinking. |
| **Meeting (3)** | Student identifies at least two reasons AI makes mistakes. Understands that AI learns from people who sometimes make mistakes and that AI does not truly understand information. |
| **Approaching (2)** | Student knows AI can be wrong but cannot explain why. May think AI mistakes are random rather than systemic. Needs prompts to articulate reasoning. |
| **Beginning (1)** | Student believes AI is always correct or cannot explain the concept of AI errors. May resist the idea that a "computer" can be wrong. |

### Criteria 2: Fact-Checking Skills
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student independently fact-checks AI responses using multiple sources. Chooses appropriate, trustworthy sources. Can evaluate source reliability and explain their process. |
| **Meeting (3)** | Student uses the Two-Source Rule when prompted. Can find information in books or trusted websites to verify AI claims. Asks adults for help verifying important information. |
| **Approaching (2)** | Student attempts to fact-check but may use unreliable sources or give up quickly. Needs teacher support to find appropriate verification sources. |
| **Beginning (1)** | Student does not attempt to verify AI information or does not understand the concept of fact-checking. Relies entirely on AI without question. |

### Criteria 3: Error Identification
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student identifies subtle AI errors, including misleading information and partial truths. Can explain what is wrong AND what the correct answer should be. Finds errors independently. |
| **Meeting (3)** | Student identifies obvious AI errors when presented with them. Can distinguish between correct and incorrect AI responses in structured activities. |
| **Approaching (2)** | Student identifies some errors with guidance. May spot very obvious mistakes but misses more subtle ones. Benefits from teacher or peer support. |
| **Beginning (1)** | Student cannot distinguish between correct and incorrect AI responses. Accepts all AI outputs as accurate. |

### Criteria 4: Critical Thinking Habits
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student demonstrates a habit of questioning AI outputs. Shares fact-checking findings with others. Shows curiosity about why AI was wrong. Applies critical thinking beyond AI contexts. |
| **Meeting (3)** | Student shows willingness to question AI when reminded. Completes fact-checking activities thoughtfully. Understands importance of verifying information. |
| **Approaching (2)** | Student is developing awareness but does not yet habitually question AI. Completes verification activities with prompting but does not initiate fact-checking independently. |
| **Beginning (1)** | Student shows minimal interest in questioning AI outputs. Does not engage with fact-checking activities or demonstrates frustration with the process. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 14-16 | Exceeding Expectations |
| 10-13 | Meeting Expectations |
| 6-9 | Approaching Expectations |
| 4-5 | Beginning |
`,
    },

    // ============================================================
    // LEVEL 1 MODULE 4: Creating with AI (Grade Band 3-5)
    // ============================================================
    {
      id: "doc_level_1_module_4_guide",
      moduleId: "level_1_module_4",
      levelId: 1,
      title: "Student Guide: Creating with AI",
      gradeBand: "3-5",
      documentType: "curriculum_guide",
      standardsAlignment: ["ISTE 1.6 Creative Communicator", "ISTE 1.4 Innovative Designer", "CSTA 1B-AP-10"],
      content: `# Creating with AI - Your Student Guide

## Time to Create, Explorer!

You have learned what AI is, how to talk to it, and that it can make mistakes. Now for the most exciting part: **using AI to create amazing things!** AI can help you make art, write stories, compose music, and bring your wildest ideas to life. But remember - YOU are the artist, the author, the creator. AI is just your super-powered paintbrush!

## The Big Idea: You + AI = Amazing

Here is something really important to understand: **AI cannot create without YOU.** AI needs your ideas, your imagination, and your direction. Without you telling it what to make, AI just sits there doing nothing. YOU are the creative genius. AI is the tool that helps you bring your ideas into the real world faster.

Think of it this way:
- A paintbrush cannot paint a masterpiece by itself - it needs an ARTIST
- A piano cannot play beautiful music by itself - it needs a MUSICIAN
- AI cannot create something wonderful by itself - it needs YOU!

## Key Vocabulary

- **Create:** To make something new that did not exist before
- **Collaborate:** Working together with someone (or something!) to make something
- **Inspire:** To fill someone with the urge to create or do something
- **Iterate:** Making something better by trying again and again
- **Original:** Something that comes from YOUR mind and ideas
- **Co-creation:** When you and AI work together to make something new

## What Can You Create with AI?

### Stories and Writing
- Start a story and let AI help you continue it
- Create characters and let AI help you describe them
- Write poems, songs, or letters with AI assistance
- Make a comic book script with AI help

### Art and Images
- Describe your dream playground and see AI draw it
- Design characters for a story you are writing
- Create birthday cards or posters with AI art tools
- Imagine a new animal and have AI help you visualize it

### Music and Sound
- Describe a mood and let AI suggest melodies
- Create sound effects for a story
- Make a simple song with AI tools

## Fun Activities

### Activity 1: Story Starter
Tell AI your story idea and let it help you write the first two sentences. Then YOU write the next two. Take turns back and forth! Remember, your ideas make the story special.

**Try this prompt:** "Help me start a story about a kid who finds a magic backpack that lets them travel anywhere in the world. Write 2 sentences to begin."

Then add YOUR sentences to continue the adventure!

### Activity 2: Art Co-Creator
Describe your dream creation to AI and see what it makes! Try describing:
- "A tree house in the clouds made of rainbow-colored wood"
- "A friendly robot chef making the world's tallest sandwich"
- "An underwater city where fish go to school"

### Activity 3: The Remix Challenge
Take something AI created and make it YOUR own! AI writes a poem? Change three lines to be about YOUR life. AI draws a picture? Add your own drawings around it. AI suggests a song? Change the words to be about something you love.

### Activity 4: Create Something Useful
Think of something that would help your family, classroom, or community. Use AI to help you create it! Ideas:
- A fun poster for a school event
- A recipe with AI suggestions for a family meal
- A thank-you note for someone special
- A guide to your favorite hobby for a friend

## The Creator's Checklist

Before you share something you made with AI, ask yourself:
1. Did I come up with the original idea? (YOUR creativity matters!)
2. Did I guide AI with clear, specific prompts? (YOUR communication!)
3. Did I review what AI made and make it better? (YOUR judgment!)
4. Would I be proud to put my name on this? (YOUR pride in your work!)
5. Did I give credit to AI for helping? (YOUR honesty!)

## Remember!

You are NOT cheating when you use AI to help you create. You are using a tool, just like using a calculator, a dictionary, or a paintbrush. What makes your creation special is YOUR idea, YOUR choices, and YOUR personal touch. No one else in the whole world thinks exactly like you do. That is your superpower!

## Check Your Understanding

1. Why is AI like a paintbrush?
2. What makes YOUR creations special even when AI helps?
3. Name three things you can create with AI's help.
4. What should you always do before sharing something you made with AI?
`,
    },
    {
      id: "doc_level_1_module_4_lesson",
      moduleId: "level_1_module_4",
      levelId: 1,
      title: "Teacher Guide: Creating with AI",
      gradeBand: "3-5",
      documentType: "lesson_plan",
      standardsAlignment: ["ISTE 1.6 Creative Communicator", "ISTE 1.4 Innovative Designer", "CSTA 1B-AP-10", "CCSS.ELA-LITERACY.W.3.3"],
      content: `# Teacher Implementation Guide: Creating with AI

## Module Overview
This module empowers students to use AI as a creative tool while understanding that human creativity, ideas, and judgment remain central to the creative process. Students explore AI-assisted creation in writing, art, and music.

## Learning Objectives
1. Use AI to make art, stories, and music
2. Understand that AI helps YOUR ideas come to life
3. Recognize that human creativity combined with AI tools produces awesome results
4. Practice ethical creation by giving credit and maintaining originality

## Session Structure (2 sessions, 20 minutes each)

### Session 1: You Are the Creator
**Materials:** Devices with age-appropriate AI tools, creation worksheets, art supplies for hybrid projects

**Warm-Up (3 min):** Show two creations: one made entirely by AI with no guidance, and one where a student directed AI carefully. Ask: "Which one is more interesting? Why?" Guide discussion toward the importance of human ideas.

**Direct Instruction (5 min):** Introduce the concept of AI as a creative tool (paintbrush analogy). Emphasize that every great creation starts with a HUMAN idea. Review the Creator's Checklist.

**Creative Lab (10 min):** Students choose one creative activity: Story Starter (writing), Art Co-Creator (visual), or Music Maker (audio). Circulate and help students craft clear prompts for their creative projects.

**Wrap-Up (2 min):** Quick share: Each student tells a partner about their creation and what THEY contributed vs. what AI contributed.

### Session 2: Make It Yours
**Materials:** Students' creations from Session 1, art supplies, revision worksheets

**Warm-Up (2 min):** Remind students: "Today we take what AI helped us start and make it truly OURS."

**Remix Activity (12 min):** Students revise, expand, and personalize their AI-assisted creations. Writers add their own paragraphs. Artists add hand-drawn elements. Everyone adds their personal touch.

**Gallery Walk & Sharing (5 min):** Display creations around the room. Students walk around, observe, and leave positive sticky-note comments for classmates.

**Wrap-Up (1 min):** Class discussion: "What made each creation special? Was it the AI or the person?"

## Differentiation Strategies

### For Students Who Need More Support:
- Provide prompt templates for each creative activity
- Offer paired creation time with a supportive partner
- Start with simpler creative tasks (2-sentence stories, single-object art)
- Provide sentence starters for reflection

### For Advanced Learners:
- Challenge them to create something useful for the school or community
- Ask them to combine multiple AI tools in one project
- Have them mentor peers in prompt crafting
- Encourage creation of a "how-to" guide for younger students

### For English Language Learners:
- Allow creation in home language with AI translation
- Focus on visual creation activities
- Provide bilingual vocabulary support
- Celebrate cultural elements in creative work

## Assessment Ideas

### Formative:
- Observe prompt quality during creative lab
- Listen to partner share conversations
- Review sticky-note feedback for engagement

### Summative:
- Final creation with reflection: "What was my idea? How did AI help? What did I add?"
- Creator's Checklist self-assessment
- Portfolio entry with process documentation
`,
    },
    {
      id: "doc_level_1_module_4_rubric",
      moduleId: "level_1_module_4",
      levelId: 1,
      title: "Assessment Rubric: Creating with AI",
      gradeBand: "3-5",
      documentType: "assessment_rubric",
      standardsAlignment: ["ISTE 1.6 Creative Communicator", "ISTE 1.4 Innovative Designer"],
      content: `# Assessment Rubric: Creating with AI

## Module: Creating with AI | Grade Band: 3-5

### Criteria 1: Creative Vision and Originality
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student demonstrates a strong, original creative vision. Ideas are imaginative and personal. Student can clearly articulate what makes their creation unique and reflects their individual perspective. |
| **Meeting (3)** | Student has a clear creative idea and uses AI to bring it to life. The creation reflects the student's interests and personality. Can explain what they contributed vs. what AI contributed. |
| **Approaching (2)** | Student has a basic idea but relies heavily on AI without adding personal touch. Creation is functional but lacks originality. Needs prompting to personalize their work. |
| **Beginning (1)** | Student does not contribute original ideas. Accepts AI output without modification. Cannot articulate their creative vision or personal contribution. |

### Criteria 2: Effective Use of AI as a Tool
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student writes highly effective prompts that produce excellent results. Iterates multiple times to refine output. Uses AI strategically as one tool among many. Demonstrates mastery of prompt skills from previous modules. |
| **Meeting (3)** | Student writes clear prompts that produce useful creative results. Can adjust prompts when initial results are not satisfactory. Uses AI appropriately as a creative assistant. |
| **Approaching (2)** | Student uses AI but prompts are vague or generic. Accepts first result without iterating. May struggle to get desired output from AI tools. |
| **Beginning (1)** | Student cannot effectively use AI tools for creation. Prompts are too vague to produce useful results. May become frustrated and give up. |

### Criteria 3: Revision and Personalization
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student significantly transforms AI output into something uniquely their own. Adds substantial personal elements. Final creation is clearly a collaboration, not just AI output. |
| **Meeting (3)** | Student adds personal touches to AI-generated content. Makes at least 3 meaningful modifications. Final creation shows evidence of human-AI collaboration. |
| **Approaching (2)** | Student makes minor changes to AI output. May add one or two elements but the creation is primarily AI-generated. |
| **Beginning (1)** | Student does not modify AI output. Submits AI-generated content without personalization. |

### Criteria 4: Ethical Creation Awareness
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student consistently gives credit to AI assistance. Understands and can explain the difference between using AI as a tool vs. having AI do all the work. Models ethical creation for peers. |
| **Meeting (3)** | Student acknowledges AI's role in the creative process. Completes the Creator's Checklist honestly. Shows awareness of ethical creation. |
| **Approaching (2)** | Student is developing awareness of ethical creation. May not consistently give credit or distinguish between their work and AI's contribution. |
| **Beginning (1)** | Student does not understand the ethical considerations of AI-assisted creation. May present AI work as entirely their own. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 14-16 | Exceeding Expectations |
| 10-13 | Meeting Expectations |
| 6-9 | Approaching Expectations |
| 4-5 | Beginning |
`,
    },

    // ============================================================
    // LEVEL 2 MODULE 1: The Art of Asking (Grade Band 3-5)
    // ============================================================
    {
      id: "doc_level_2_module_1_guide",
      moduleId: "level_2_module_1",
      levelId: 2,
      title: "Student Guide: The Art of Asking",
      gradeBand: "3-5",
      documentType: "curriculum_guide",
      standardsAlignment: ["ISTE 1.5 Computational Thinker", "ISTE 1.1 Empowered Learner", "CSTA 1B-AP-11", "CCSS.ELA-LITERACY.W.4.4"],
      content: `# The Art of Asking - Your Student Guide

## Level Up, AI Guide!

Welcome to Level 2! You already know the basics of AI, and now you are going to become a true AI Guide. The most important skill in this level? Learning to ask AMAZING questions. Great questions get great answers. And you are about to become a questioning champion!

## The 5 W's of Prompting

You have already learned about giving AI clear instructions. Now let us take it up a notch with the **5 W's of Prompting:**

1. **WHO** - Who are you talking to? Who is the answer for? "Act as a friendly science teacher explaining to a 4th grader..."
2. **WHAT** - What exactly do you want? "Give me a list of 5 facts..."
3. **WHEN** - When is this relevant? "In modern times..." or "During the dinosaur age..."
4. **WHERE** - Where does this apply? "In the United States..." or "In the ocean..."
5. **WHY** - Why do you need this? "I'm preparing for a science project about..."

## Key Vocabulary

- **Context:** Background information that helps AI understand your situation
- **Template:** A fill-in-the-blank pattern you can reuse for different prompts
- **Follow-up:** An additional question that builds on a previous answer
- **Prompt chain:** A series of connected prompts that build on each other
- **Refine:** Making your prompt more specific and detailed

## The Prompt Builder Template

Here is a template you can use anytime:

**"Act as a [WHO]. I need [WHAT] about [TOPIC]. It should be [HOW - tone/length/style]. This is for [WHY/AUDIENCE]."**

### Examples:
- "Act as a **fun science teacher**. I need **3 cool experiments** about **magnets**. They should be **safe and easy for kids to do at home**. This is for **a science fair project**."
- "Act as a **storyteller**. I need **a short adventure story** about **a brave turtle**. It should be **exciting and about 1 page long**. This is for **reading practice with my little brother**."

## Fun Activities

### Activity 1: Prompt Builder Mad Libs
Fill in the blanks to create your own prompts:
- "Act as a ________. I need ________ about ________. It should be ________. This is for ________."

Try making 5 different prompts using this template!

### Activity 2: Before and After Challenge
Write a vague prompt first, then use the 5 W's to make it amazing:
- BEFORE: "Tell me about weather"
- AFTER: "Act as a friendly meteorologist explaining to a 4th grader. Tell me 3 interesting facts about how thunderstorms form. Use simple words and include one fun comparison to help me remember. This is for my science notebook."

Compare the results!

### Activity 3: Prompt Chain Practice
Start with one question and then ask follow-up questions to dive deeper:
1. "What are the three biggest planets in our solar system?"
2. "Tell me more about Jupiter - what makes it special?"
3. "Could a person ever visit Jupiter? Why or why not?"
4. "What would you need to survive on a spaceship near Jupiter?"

See how each question builds on the last?

### Activity 4: Plan a Party with AI!
Use your new prompting skills to plan a pretend birthday party:
1. Ask AI for theme ideas based on your interests
2. Ask for a menu of easy-to-make snacks
3. Ask for game ideas that work indoors
4. Ask for invitation wording

Practice using the 5 W's in each prompt!

## Pro Tips for Amazing Prompts

1. **Give examples** of what you want: "Like the style of a Dr. Seuss book"
2. **Set limits:** "In 3 sentences or less"
3. **Ask for options:** "Give me 3 different versions to choose from"
4. **Request formatting:** "Use bullet points" or "Number your list"
5. **Build on answers:** "That was great! Now can you make it funnier?"

## Remember!

The Art of Asking is not just an AI skill - it is a LIFE skill! People who ask great questions learn faster, solve more problems, and understand the world better. Every time you practice writing a great prompt, you are becoming a better communicator. Keep asking, keep learning, keep growing!

## Check Your Understanding

1. What are the 5 W's of Prompting?
2. Write a prompt using the Prompt Builder Template about any topic you choose.
3. Why is a prompt chain useful?
4. How does giving AI context help you get better answers?
`,
    },
    {
      id: "doc_level_2_module_1_lesson",
      moduleId: "level_2_module_1",
      levelId: 2,
      title: "Teacher Guide: The Art of Asking",
      gradeBand: "3-5",
      documentType: "lesson_plan",
      standardsAlignment: ["ISTE 1.5 Computational Thinker", "ISTE 1.1 Empowered Learner", "CSTA 1B-AP-11", "CCSS.ELA-LITERACY.W.4.4", "ISTE 6.1 Facilitator"],
      content: `# Teacher Implementation Guide: The Art of Asking

## Module Overview
This module elevates students' prompting skills by introducing the 5 W's framework, prompt templates, prompt chains, and iterative refinement. Students transition from basic prompt writing to strategic AI communication.

## Learning Objectives
1. Master the 5 W's of prompting (Who, What, When, Where, Why)
2. Use context to improve AI responses
3. Iterate and refine prompts for better results
4. Apply prompt skills to real-world scenarios

## Session Structure (3 weeks, 2 sessions/week, 30 min each)

### Week 1: The 5 W's Framework
**Session 1:** Introduce the 5 W's with examples. Practice identifying W's in sample prompts. Class exercise: transform 3 weak prompts using all 5 W's.

**Session 2:** Introduce the Prompt Builder Template. Students create 5 prompts using Mad Libs format. Partners share and improve each other's prompts.

### Week 2: Chains and Context
**Session 1:** Teach prompt chaining. Demonstrate how follow-up questions deepen understanding. Students practice 3-step prompt chains on chosen topics.

**Session 2:** Focus on context. Show how the same question with different context produces different results. Before/After Challenge activity.

### Week 3: Real-World Application
**Session 1:** Plan a Party with AI activity. Students apply all skills to a fun, practical project. Work in small groups.

**Session 2:** Prompt Showcase. Students present their best prompts and results. Class votes on Most Creative, Most Specific, and Most Useful prompts.

## Differentiation Strategies

### For Students Who Need More Support:
- Provide pre-filled template cards with some W's completed
- Offer a "Prompt Word Bank" organized by category
- Use visual prompt builders with icons for each W
- Allow verbal prompt creation before writing

### For Advanced Learners:
- Introduce constraints (word limits, specific formats)
- Challenge them to teach the 5 W's to a younger class
- Have them create their own prompt templates for specific subjects
- Explore multi-step prompts for complex tasks

### For English Language Learners:
- Provide templates in home language alongside English
- Use visual cues for each W (icons, pictures)
- Allow mixed-language prompts
- Focus on the structure rather than vocabulary sophistication

## Assessment Ideas

### Formative:
- Review prompt quality during activities
- Partner feedback sessions
- Weekly "Best Prompt" nominations

### Summative:
- Prompt portfolio: Collection of 10 refined prompts with explanations
- Real-world prompt project: Use AI to complete a meaningful task using 5 W's
- Teaching moment: Student explains 5 W's to a partner and helps them write a prompt
`,
    },
    {
      id: "doc_level_2_module_1_rubric",
      moduleId: "level_2_module_1",
      levelId: 2,
      title: "Assessment Rubric: The Art of Asking",
      gradeBand: "3-5",
      documentType: "assessment_rubric",
      standardsAlignment: ["ISTE 1.5 Computational Thinker", "CSTA 1B-AP-11"],
      content: `# Assessment Rubric: The Art of Asking

## Module: The Art of Asking | Grade Band: 3-5

### Criteria 1: Use of 5 W's Framework
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student naturally incorporates all 5 W's into prompts. Creates sophisticated prompts that demonstrate strategic thinking about what information AI needs. Helps peers apply the framework. |
| **Meeting (3)** | Student includes 4-5 W's in most prompts. Understands how each W contributes to prompt quality. Can identify missing W's in others' prompts. |
| **Approaching (2)** | Student includes 2-3 W's in prompts. Understands the framework conceptually but inconsistently applies it. Needs reminders to include all elements. |
| **Beginning (1)** | Student includes 0-1 W's in prompts. Does not yet understand how the framework improves prompt quality. Prompts remain vague and unstructured. |

### Criteria 2: Prompt Chain and Iteration
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student creates effective prompt chains that build logically. Anticipates what information will be needed next. Iterates purposefully to refine results, showing strategic thinking. |
| **Meeting (3)** | Student creates 3-step prompt chains that build on previous answers. Shows ability to refine prompts when results are not ideal. Asks meaningful follow-up questions. |
| **Approaching (2)** | Student attempts prompt chains but follow-up questions may not logically connect. Makes some refinements with guidance. Prompt iterations show limited improvement. |
| **Beginning (1)** | Student does not attempt prompt chains or follow-up questions. Does not refine prompts after receiving results. Each prompt is independent with no building. |

### Criteria 3: Context and Audience Awareness
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student expertly tailors prompts to specific audiences and contexts. Understands how changing context changes results. Can explain why context matters for AI communication. |
| **Meeting (3)** | Student includes relevant context in prompts. Specifies the audience or purpose for the information. Demonstrates understanding of how context shapes AI responses. |
| **Approaching (2)** | Student sometimes includes context but may not understand its impact. Audience specification is generic or missing from prompts. |
| **Beginning (1)** | Student does not include context or audience information in prompts. Does not understand how context influences AI responses. |

### Criteria 4: Real-World Application
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student independently applies prompting skills to solve real problems or complete meaningful tasks. Transfers skills to new, unfamiliar contexts. Creates prompts that produce genuinely useful results. |
| **Meeting (3)** | Student applies prompting skills to structured real-world tasks (party planning, project research). Results are useful and demonstrate effective AI communication. |
| **Approaching (2)** | Student attempts real-world application with mixed results. Prompts produce partially useful results. Needs support to connect skills to practical situations. |
| **Beginning (1)** | Student cannot apply prompting skills to real-world tasks. Struggles to see the connection between prompt practice and practical use. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 14-16 | Exceeding Expectations |
| 10-13 | Meeting Expectations |
| 6-9 | Approaching Expectations |
| 4-5 | Beginning |
`,
    },

    // ============================================================
    // LEVEL 2 MODULE 2: AI Ethics & Responsibility (Grade Band 3-5)
    // ============================================================
    {
      id: "doc_level_2_module_2_guide",
      moduleId: "level_2_module_2",
      levelId: 2,
      title: "Student Guide: AI Ethics & Responsibility",
      gradeBand: "3-5",
      documentType: "curriculum_guide",
      standardsAlignment: ["ISTE 1.2 Digital Citizen", "CSTA 1B-IC-18", "CASEL SEL Responsible Decision-Making"],
      content: `# AI Ethics & Responsibility - Your Student Guide

## Being a Responsible AI Guide

You have been learning so much about AI! Now it is time for one of the most important lessons of all: **how to use AI the RIGHT way.** Just because you CAN do something with AI does not mean you SHOULD. Being responsible with AI makes you a true leader.

## What is Bias?

**Bias** means unfairly favoring one thing over another. AI can be biased because it learns from data created by people, and people sometimes have unfair ideas.

### How Bias Sneaks into AI:
- If AI mostly reads stories about boys being scientists, it might think only boys can be scientists (NOT TRUE!)
- If AI learns from data mostly about one country, it might not understand other cultures well
- If AI learns from old information, it might repeat outdated ideas

### Being a Bias Detective:
When you see AI's response, ask yourself:
- "Does this include everyone, or just some people?"
- "Would this seem fair to ALL my classmates?"
- "Is AI showing only one side of the story?"

## The "Help or Harm?" Test

Before using AI for anything, ask yourself this simple question: **"Does this help or harm?"**

**AI that HELPS:**
- Using AI to study for a test (learning!)
- Using AI to brainstorm ideas for a project
- Using AI to understand something difficult in a new way
- Using AI to create something kind for someone

**AI that HARMS:**
- Using AI to write your homework and pretending you wrote it (that is cheating)
- Using AI to create mean messages about someone (that is bullying)
- Using AI to trick people with fake information
- Using AI to copy someone else's work

## Key Vocabulary

- **Ethics:** Knowing the difference between right and wrong
- **Bias:** Unfairly favoring one thing or group over another
- **Responsibility:** Being accountable for your choices and actions
- **Fairness:** Treating everyone equally and justly
- **Cheating:** Pretending someone else's work (including AI's) is your own
- **Cyberbullying:** Using technology to hurt, embarrass, or scare someone

## Fun Activities

### Activity 1: Bias Detective
Look at these AI-generated descriptions and spot the bias:
- "Nurses are women who take care of sick people" (What is biased here?)
- "The brave firefighter saved the day. He was very strong." (Any assumptions?)
- "The best food in the world is pizza and hamburgers" (Whose perspective is this?)

### Activity 2: Is It OK? Scenario Cards
Read each scenario and decide: Is it OK to use AI this way? Why or why not?
1. Maya uses AI to help her understand what her math homework is asking
2. Jake uses AI to write his book report without reading the book
3. Sofia uses AI to create a get-well card for her grandmother
4. Tyler uses AI to write mean comments that look like they came from someone else
5. Aisha uses AI to translate a letter for her neighbor who speaks a different language

### Activity 3: Fairness Check
Ask AI the same question about different groups of people. Compare the answers. Are they fair? If not, why might that be?

### Activity 4: Create Your Own AI Rules
Write 5 rules for using AI responsibly. Think about:
- When is it OK to use AI for schoolwork?
- How should you treat information AI gives you?
- What should you NEVER use AI for?

## Your AI Responsibility Pledge

"I promise to use AI to help, not to harm. I will check AI for bias and mistakes. I will be honest about when AI helped me. I will treat everyone fairly, and I will speak up when I see AI being used in hurtful ways."

## Remember!

Being responsible with AI is not about being scared of it. It is about being WISE. You are learning skills that many adults do not have yet. When you use AI ethically, you are showing real leadership. The world needs people like you who think carefully about how to use powerful tools the right way!

## Check Your Understanding

1. What is bias, and how does it get into AI?
2. Give an example of AI helping and an example of AI harming.
3. What is the "Help or Harm?" test?
4. Why is it wrong to pretend AI's work is your own?
`,
    },
    {
      id: "doc_level_2_module_2_lesson",
      moduleId: "level_2_module_2",
      levelId: 2,
      title: "Teacher Guide: AI Ethics & Responsibility",
      gradeBand: "3-5",
      documentType: "lesson_plan",
      standardsAlignment: ["ISTE 1.2 Digital Citizen", "CSTA 1B-IC-18", "CASEL SEL Responsible Decision-Making", "CASEL SEL Social Awareness"],
      content: `# Teacher Implementation Guide: AI Ethics & Responsibility

## Module Overview
This module introduces fundamental concepts of AI ethics including bias, responsible use, and the distinction between helpful and harmful applications. Students develop critical awareness and a personal ethical framework for AI use.

## Learning Objectives
1. Understand bias in AI and how it occurs
2. Recognize when AI should and should not be used
3. Practice the "Does this help or harm?" test
4. Develop personal guidelines for responsible AI use

## Session Structure (3 weeks, 2 sessions/week, 30 min each)

### Week 1: Understanding Bias
**Session 1:** Define bias using age-appropriate examples from daily life (not just AI). Then connect to AI: explain how AI learns from biased data. Bias Detective activity.

**Session 2:** Deeper exploration of bias through examples. Students identify bias in AI-generated content. Class discussion about why bias is harmful and what we can do about it.

### Week 2: Help or Harm?
**Session 1:** Introduce the "Help or Harm?" test. Go through scenario cards as a class, discussing each one. Allow for nuanced discussion where answers are not black and white.

**Session 2:** Students create their own scenarios and trade with partners. Discuss edge cases where the answer is not obvious. Introduce the concept of academic honesty with AI.

### Week 3: Being Responsible Leaders
**Session 1:** Students draft their personal AI Rules (5 guidelines). Share in small groups and refine based on discussion.

**Session 2:** Class creates a shared "AI Responsibility Pledge." Each student signs it. Create a poster for the classroom.

## Differentiation Strategies

### For Students Who Need More Support:
- Use simple, clear-cut scenarios before introducing gray areas
- Provide picture cards for bias identification
- Create a "green light/red light" sorting activity for AI use cases
- Offer pre-written rule options for the personal guidelines activity

### For Advanced Learners:
- Introduce real-world examples of AI bias (age-appropriate)
- Challenge them to find bias in AI tools they use
- Have them research and present on a specific AI ethics topic
- Create a presentation for younger students about responsible AI use

### For English Language Learners:
- Use visual scenarios with pictures
- Provide key vocabulary in home language
- Allow discussion in home language before English sharing
- Use role-play for scenario exploration

## Important Teacher Notes
- This is a sensitive topic. Create a safe space for discussion.
- Avoid making students feel bad about past AI use; focus on future choices
- Be prepared for students to share concerns about AI being used harmfully
- Connect to existing school values and character education programs
- Some students may have experienced cyberbullying - be sensitive
`,
    },
    {
      id: "doc_level_2_module_2_rubric",
      moduleId: "level_2_module_2",
      levelId: 2,
      title: "Assessment Rubric: AI Ethics & Responsibility",
      gradeBand: "3-5",
      documentType: "assessment_rubric",
      standardsAlignment: ["ISTE 1.2 Digital Citizen", "CSTA 1B-IC-18", "CASEL SEL Responsible Decision-Making"],
      content: `# Assessment Rubric: AI Ethics & Responsibility

## Module: AI Ethics & Responsibility | Grade Band: 3-5

### Criteria 1: Understanding Bias
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student identifies subtle bias in AI outputs. Explains how bias enters AI systems through data and design. Connects AI bias to broader fairness concepts. Generates original examples. |
| **Meeting (3)** | Student identifies obvious bias in AI-generated content. Understands that AI learns bias from human-created data. Can give at least two examples of AI bias. |
| **Approaching (2)** | Student has a basic awareness of bias but struggles to identify it independently. May need prompting to recognize unfair assumptions in AI output. |
| **Beginning (1)** | Student does not understand the concept of AI bias or cannot identify biased content. May believe AI is always fair and neutral. |

### Criteria 2: Ethical Decision-Making
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student consistently applies the "Help or Harm?" test independently. Navigates gray areas with thoughtful reasoning. Advocates for responsible AI use among peers. |
| **Meeting (3)** | Student correctly evaluates most scenarios using the "Help or Harm?" test. Distinguishes between helpful and harmful AI uses. Makes responsible choices in structured activities. |
| **Approaching (2)** | Student evaluates clear-cut scenarios but struggles with nuanced situations. May not consistently apply ethical reasoning. Needs teacher guidance for complex decisions. |
| **Beginning (1)** | Student cannot distinguish between responsible and irresponsible AI use. Does not apply ethical reasoning to AI scenarios. |

### Criteria 3: Personal Responsibility Framework
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student creates thoughtful, comprehensive personal AI guidelines. Rules are specific, practical, and demonstrate deep ethical understanding. Can explain the reasoning behind each rule. |
| **Meeting (3)** | Student creates 5 meaningful personal AI rules. Rules address key ethical areas (honesty, fairness, safety). Participates in the class pledge meaningfully. |
| **Approaching (2)** | Student creates basic rules but they may be vague or incomplete. Participates in pledge but may not fully internalize the concepts. |
| **Beginning (1)** | Student cannot create meaningful AI guidelines. Does not engage with the pledge activity. Minimal understanding of personal responsibility in AI use. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },

    // ============================================================
    // LEVEL 2 MODULE 3: AI as a Learning Tool (Grade Band 3-5)
    // ============================================================
    {
      id: "doc_level_2_module_3_guide",
      moduleId: "level_2_module_3",
      levelId: 2,
      title: "Student Guide: AI as a Learning Tool",
      gradeBand: "3-5",
      documentType: "curriculum_guide",
      standardsAlignment: ["ISTE 1.1 Empowered Learner", "ISTE 1.3 Knowledge Constructor", "CSTA 1B-CS-02"],
      content: `# AI as a Learning Tool - Your Student Guide

## Your New Study Buddy!

Imagine having a tutor who is available 24/7, never gets tired, and can explain things in a hundred different ways until you understand. That is what AI can be for you! But here is the important part: AI is your **study buddy**, not your **homework doer**. There is a big difference, and you are smart enough to know it!

## The Difference Between Learning and Cheating

This is really important, so pay attention:

**Using AI to LEARN (Great!):**
- Asking AI to explain fractions a different way because you are stuck
- Having AI quiz you on vocabulary words
- Asking AI to give you practice problems
- Using AI to check your understanding after studying

**Using AI to CHEAT (Not great!):**
- Having AI write your essay and turning it in as yours
- Copying AI's answers without understanding them
- Using AI during a test when you are not supposed to
- Skipping the learning and just getting answers

The difference? When you LEARN with AI, your brain gets smarter. When you CHEAT with AI, your brain stays the same. Which do you want?

## Super Study Strategies with AI

### Strategy 1: Explain It Different Ways
If you do not understand something, ask AI to explain it in multiple ways:
- "Explain fractions like I am baking cookies"
- "Explain fractions using a pizza example"
- "Explain fractions as if they were parts of a soccer team"

One of those explanations will probably click!

### Strategy 2: Quiz Yourself
Ask AI to create practice questions for you:
- "Give me 5 practice questions about multiplication facts for 7's"
- "Create a vocabulary quiz about our solar system with 10 words"
- "Ask me true or false questions about the American Revolution"

### Strategy 3: The Explain-Back Method
After AI explains something, try explaining it BACK to AI in your own words:
- "I think fractions mean... Am I right?"
This is one of the BEST ways to learn because teaching helps your brain remember!

### Strategy 4: Fact-Check Race
When AI gives you an answer, see how fast you can verify it with another source. This builds your research skills AND makes sure you are getting accurate information!

## Key Vocabulary

- **Study buddy:** Someone (or something) that helps you learn but does not do the work for you
- **Academic honesty:** Being truthful about your work and what help you received
- **Critical thinking:** Analyzing information carefully instead of just accepting it
- **Verify:** Checking if information is accurate
- **Learning style:** The way you learn best (seeing, hearing, doing, reading)

## Fun Activities

### Activity 1: Explain It to Me Three Ways
Pick a topic you find tricky. Ask AI to explain it three different ways:
1. "Explain like I am telling a story"
2. "Explain using real-life examples"
3. "Explain using only simple words"

Which explanation helped you the most? That tells you something about your learning style!

### Activity 2: Study Buddy Challenge
Use AI as a study buddy for 15 minutes. Ask it to:
1. Quiz you on 10 facts from a subject you are studying
2. Explain your 2 hardest vocabulary words
3. Create a fun memory trick for something you keep forgetting

### Activity 3: Fact-Check Race
AI gives you 5 facts about a topic. Your mission: verify each one using a book or trusted website. Time yourself! Can you beat your record?

### Activity 4: Discover Your Learning Style
Ask AI to teach you the same concept in different ways. Notice which way helps you understand best:
- Visual (pictures and diagrams)
- Storytelling (narratives and examples)
- Hands-on (experiments and activities)
- Lists and facts (organized information)

## Remember!

Using AI as a learning tool is one of the smartest things you can do. It is like having a patient tutor who is always available. But always remember: the goal is for YOUR brain to grow. AI can help you get there, but it cannot do the learning for you. Keep your brain active, keep asking questions, and keep being curious!

## Check Your Understanding

1. What is the difference between using AI to learn and using AI to cheat?
2. Name three study strategies you can use with AI.
3. Why is the "explain-back method" a good way to learn?
4. How can AI help you discover your learning style?
`,
    },
    {
      id: "doc_level_2_module_3_lesson",
      moduleId: "level_2_module_3",
      levelId: 2,
      title: "Teacher Guide: AI as a Learning Tool",
      gradeBand: "3-5",
      documentType: "lesson_plan",
      standardsAlignment: ["ISTE 1.1 Empowered Learner", "ISTE 1.3 Knowledge Constructor", "CSTA 1B-CS-02", "ISTE 6.1 Facilitator"],
      content: `# Teacher Implementation Guide: AI as a Learning Tool

## Module Overview
This module teaches students to use AI as an effective study companion while maintaining academic integrity. Students learn to distinguish between AI-assisted learning and academic dishonesty, and develop practical strategies for using AI to deepen understanding.

## Learning Objectives
1. Use AI for research and self-directed study
2. Distinguish between AI-assisted learning and cheating
3. Develop critical thinking about AI outputs
4. Discover personal learning styles through AI interaction

## Session Structure (3 weeks, 2 sessions/week, 30 min each)

### Week 1: Your Study Buddy
**Session 1:** Introduce AI as a learning tool. Clear discussion about the learning vs. cheating distinction. Use visual anchor chart. Practice "Explain It Three Ways" activity.

**Session 2:** Teach the Explain-Back Method. Model with a class topic. Students practice in pairs: one uses AI to learn, then explains to partner without AI.

### Week 2: Study Strategies
**Session 1:** Study Buddy Challenge. Students use AI for 15 minutes of structured study. Teacher monitors and guides appropriate use. Debrief: "What worked? What did you learn?"

**Session 2:** Fact-Check Race activity. Students verify AI-provided facts. Discuss reliability of different sources. Build research skills alongside AI skills.

### Week 3: Learning Styles and Application
**Session 1:** Discover Your Learning Style activity. Students try different AI explanation formats. Reflect on which methods work best for them.

**Session 2:** Create a "How I Learn Best with AI" poster. Share strategies with class. Develop personal study plans that incorporate AI appropriately.

## Differentiation Strategies

### For Students Who Need More Support:
- Provide structured prompt templates for study activities
- Start with familiar, comfortable subjects for practice
- Offer a checklist: "Am I learning or cheating?"
- Pair with a study partner for guided AI interaction

### For Advanced Learners:
- Challenge them to create study guides for classmates using AI
- Explore using AI for independent research projects
- Have them compare AI explanations to textbook explanations
- Develop their own study strategies beyond the ones taught

## Assessment Ideas

### Formative:
- Observe study buddy sessions for appropriate AI use
- Review explain-back attempts for comprehension
- Monitor fact-check accuracy and speed improvement

### Summative:
- "How I Learn Best with AI" poster with personal reflection
- Demonstrate the explain-back method with a chosen topic
- Portfolio: Before/after comparison of understanding on a difficult topic
`,
    },
    {
      id: "doc_level_2_module_3_rubric",
      moduleId: "level_2_module_3",
      levelId: 2,
      title: "Assessment Rubric: AI as a Learning Tool",
      gradeBand: "3-5",
      documentType: "assessment_rubric",
      standardsAlignment: ["ISTE 1.1 Empowered Learner", "ISTE 1.3 Knowledge Constructor"],
      content: `# Assessment Rubric: AI as a Learning Tool

## Module: AI as a Learning Tool | Grade Band: 3-5

### Criteria 1: Appropriate AI Use for Learning
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student independently uses AI for genuine learning. Develops creative study strategies. Clearly articulates the difference between learning and cheating with nuanced understanding. Models appropriate use for peers. |
| **Meeting (3)** | Student uses AI appropriately as a study tool. Can distinguish between learning and cheating in most scenarios. Uses AI to deepen understanding rather than replace effort. |
| **Approaching (2)** | Student sometimes uses AI appropriately but may cross into having AI do the work. Understands the concept of academic honesty but inconsistently applies it. |
| **Beginning (1)** | Student primarily uses AI to get answers rather than to learn. Cannot distinguish between appropriate and inappropriate AI use for schoolwork. |

### Criteria 2: Study Strategy Application
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student independently applies multiple AI study strategies. Creates personalized approaches. Effectively uses explain-back method and self-quizzing. Can teach strategies to others. |
| **Meeting (3)** | Student uses at least 3 AI study strategies effectively. Completes study buddy activities with positive results. Shows improvement in understanding through AI-assisted study. |
| **Approaching (2)** | Student attempts study strategies but may not use them effectively. Benefits from structured guidance. Shows some improvement through AI study sessions. |
| **Beginning (1)** | Student does not effectively use AI study strategies. May become frustrated or give up when AI does not immediately provide the answer they want. |

### Criteria 3: Critical Evaluation of AI Responses
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student habitually verifies AI information. Uses multiple sources effectively. Can evaluate the quality and reliability of AI explanations. Demonstrates strong research skills. |
| **Meeting (3)** | Student fact-checks AI responses when prompted. Successfully verifies information using books or trusted websites. Understands that AI is not always accurate in educational contexts. |
| **Approaching (2)** | Student occasionally fact-checks but not consistently. May struggle to identify appropriate verification sources. Relies heavily on AI without questioning. |
| **Beginning (1)** | Student does not verify AI information. Accepts all AI responses as accurate. Does not use additional sources for verification. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },

    // ============================================================
    // LEVEL 2 MODULE 4: Creating Solutions with AI (Grade Band 3-5)
    // ============================================================
    {
      id: "doc_level_2_module_4_guide",
      moduleId: "level_2_module_4",
      levelId: 2,
      title: "Student Guide: Creating Solutions with AI",
      gradeBand: "3-5",
      documentType: "curriculum_guide",
      standardsAlignment: ["ISTE 1.4 Innovative Designer", "ISTE 1.6 Creative Communicator", "CSTA 1B-AP-12"],
      content: `# Creating Solutions with AI - Your Student Guide

## You Are a Problem Solver!

You have come so far on your AI journey! You know what AI is, how to talk to it, that it can make mistakes, and how to use it responsibly. Now it is time for the ultimate challenge: **using AI to solve REAL problems!** That is right - you are going to find problems in your world and use AI to help create solutions.

## Finding Problems Worth Solving

Great solutions start with noticing problems. Look around your world:

**At School:**
- Is it hard to find books you like in the library?
- Do students get confused about the lunch schedule?
- Is the playground missing something fun?

**At Home:**
- Does your family forget important dates or tasks?
- Is there a chore that takes too long?
- Does someone in your family need help with something?

**In Your Community:**
- Is there litter in your neighborhood park?
- Do new families have trouble finding fun things to do?
- Are there people who could use a kind gesture?

## The Problem-Solving Process

### Step 1: IDENTIFY the Problem
Write down the problem clearly. Who does it affect? Why does it matter?

### Step 2: BRAINSTORM with AI
Use AI to brainstorm possible solutions. Ask: "What are 5 creative ways a kid could help with [problem]?"

### Step 3: CHOOSE the Best Solution
From AI's ideas (and your own!), pick the one that is most realistic and helpful.

### Step 4: CREATE with AI's Help
Use AI to help you build your solution - whether it is a poster, a guide, a presentation, or a plan.

### Step 5: SHARE with Others
Present your solution to your class, family, or community!

## Key Vocabulary

- **Problem-solving:** Finding ways to fix challenges or make things better
- **Brainstorm:** Coming up with lots of ideas without judging them
- **Prototype:** A first version of your solution to test and improve
- **Pitch:** Presenting your idea to convince others it is a good solution
- **Community:** The group of people around you (school, neighborhood, town)
- **Impact:** The positive change your solution creates

## Fun Activities

### Activity 1: Problem Hunters
Walk around your school or neighborhood with a notebook. Write down 3 problems you notice. For each one, write: What is the problem? Who does it affect? Why does it matter?

### Activity 2: Solution Design
Pick your favorite problem from Activity 1. Use AI to help you:
1. Brainstorm 5 possible solutions
2. Choose the best one and explain why
3. Create a simple plan to make it happen
4. Design a poster or presentation about it

### Activity 3: Pitch Practice
Practice presenting your solution like a real inventor! Include:
- What the problem is (make people care!)
- Your solution (how it works)
- Why it will work (evidence and reasoning)
- What you need to make it happen (resources)

### Activity 4: Build Something Real!
Work with your team to actually CREATE your solution! It could be:
- A helpful guide for new students
- A recycling poster campaign
- A buddy system for lonely students
- A family organization app idea
- A community kindness challenge

## Remember!

Every great invention started as an idea in someone's head. YOU have ideas that could make the world better. AI is an incredible tool to help bring those ideas to life, but the ideas come from YOUR heart and YOUR observations about the world. You are never too young to be a problem solver. Start now!

## Check Your Understanding

1. What are the five steps of the Problem-Solving Process?
2. Why is brainstorming with AI helpful?
3. What makes a good pitch?
4. Name one real problem you could help solve with AI.
`,
    },
    {
      id: "doc_level_2_module_4_lesson",
      moduleId: "level_2_module_4",
      levelId: 2,
      title: "Teacher Guide: Creating Solutions with AI",
      gradeBand: "3-5",
      documentType: "lesson_plan",
      standardsAlignment: ["ISTE 1.4 Innovative Designer", "ISTE 1.6 Creative Communicator", "CSTA 1B-AP-12", "CCSS.ELA-LITERACY.SL.4.4"],
      content: `# Teacher Implementation Guide: Creating Solutions with AI

## Module Overview
This capstone module for Level 2 challenges students to apply all their AI skills to identify real problems and create meaningful solutions. Students work through the design thinking process using AI as a brainstorming and creation partner.

## Learning Objectives
1. Identify problems AI can help solve in their community
2. Design simple projects using AI tools
3. Present solutions to real audiences
4. Apply all previous AI skills in a meaningful context

## Session Structure (3 weeks, 2 sessions/week, 30 min each)

### Week 1: Problem Finding
**Session 1:** Problem Hunters activity. Students observe and document problems in school/community. Teach observation skills and empathy mapping. Class brainstorm of problems.

**Session 2:** Students select their problem. Research phase using AI and other sources to understand the problem deeply. Who is affected? What has already been tried?

### Week 2: Solution Design
**Session 1:** Brainstorming with AI. Students generate multiple solution ideas. Learn to evaluate ideas for feasibility and impact. Select their best solution.

**Session 2:** Create a prototype or plan. Use AI to help design posters, write guides, plan events, or create presentations. Focus on practical, achievable solutions.

### Week 3: Share and Celebrate
**Session 1:** Pitch practice. Students rehearse presenting their solutions. Peer feedback sessions. Refine presentations based on feedback.

**Session 2:** Solution Showcase! Students present to class, other classes, parents, or school staff. Celebrate every team's contribution. Reflect on the entire Level 2 journey.

## Differentiation Strategies

### For Students Who Need More Support:
- Provide a problem bank of pre-identified issues to choose from
- Offer step-by-step project templates
- Pair with a partner for all activities
- Simplify the presentation requirements

### For Advanced Learners:
- Challenge them to implement their solution beyond the classroom
- Add a community interview component to their research
- Have them mentor younger students through a simplified version
- Encourage multi-media presentations

## Assessment Ideas

### Formative:
- Problem identification quality and depth
- Brainstorming participation and AI prompt quality
- Prototype iteration and improvement

### Summative:
- Final presentation/pitch with rubric
- Written reflection on the design process
- Portfolio documenting the entire problem-solving journey
- Peer evaluations of presentations
`,
    },
    {
      id: "doc_level_2_module_4_rubric",
      moduleId: "level_2_module_4",
      levelId: 2,
      title: "Assessment Rubric: Creating Solutions with AI",
      gradeBand: "3-5",
      documentType: "assessment_rubric",
      standardsAlignment: ["ISTE 1.4 Innovative Designer", "ISTE 1.6 Creative Communicator", "CSTA 1B-AP-12"],
      content: `# Assessment Rubric: Creating Solutions with AI

## Module: Creating Solutions with AI | Grade Band: 3-5

### Criteria 1: Problem Identification
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student identifies a meaningful, specific problem with clear impact. Demonstrates empathy for those affected. Provides evidence of research and observation. Problem is well-defined and solvable. |
| **Meeting (3)** | Student identifies a real problem and explains who it affects and why it matters. Problem is specific enough to design a solution for. Shows awareness of the community impact. |
| **Approaching (2)** | Student identifies a problem but it may be too vague, too large, or not clearly defined. Limited explanation of impact or affected people. |
| **Beginning (1)** | Student struggles to identify a meaningful problem or selects an impractical one. Cannot explain why the problem matters or who it affects. |

### Criteria 2: Solution Design with AI
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student uses AI strategically throughout the design process. Brainstorms multiple solutions, evaluates them thoughtfully, and creates a detailed, practical prototype. AI use demonstrates mastery of all previous module skills. |
| **Meeting (3)** | Student uses AI to brainstorm and design a solution. Selected solution is practical and addresses the identified problem. Prototype or plan is complete and shows effort. |
| **Approaching (2)** | Student uses AI minimally in the design process. Solution may not fully address the problem. Prototype is incomplete or impractical. |
| **Beginning (1)** | Student does not effectively use AI in the design process. Solution is not connected to the identified problem. No prototype or plan created. |

### Criteria 3: Presentation and Communication
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student delivers a compelling, well-organized presentation. Clearly communicates the problem, solution, and potential impact. Engages the audience and responds to questions thoughtfully. |
| **Meeting (3)** | Student presents their solution clearly. Covers the problem, solution, and basic implementation plan. Speaks to the audience with confidence. |
| **Approaching (2)** | Student presents but may be disorganized or unclear. Covers some elements of the problem and solution. May struggle with audience engagement or questions. |
| **Beginning (1)** | Student does not present or presentation is too brief/unclear to evaluate. Cannot communicate the problem or solution effectively. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },

    // ============================================================
    // LEVEL 3 MODULE 1: Advanced Prompting (Grade Band 6-8)
    // ============================================================
    {
      id: "doc_level_3_module_1_guide",
      moduleId: "level_3_module_1",
      levelId: 3,
      title: "Student Guide: Advanced Prompting & Prompt Engineering",
      gradeBand: "6-8",
      documentType: "curriculum_guide",
      standardsAlignment: ["ISTE 1.5 Computational Thinker", "CSTA 2-AP-13", "CSTA 2-AP-17"],
      content: `# Advanced Prompting & Prompt Engineering - Your Student Guide

## Welcome to the Next Level

You are no longer just talking to AI - you are about to learn to **manage** it. Think of yourself as the director of a movie, and AI is your incredibly talented but literal-minded actor. The better your direction, the better the performance. This is where things get really interesting.

## What is Prompt Engineering?

Prompt engineering is the skill of crafting precise, strategic instructions that get AI to produce exactly what you need. It is not just about asking nicely - it is about understanding how AI thinks and structuring your requests accordingly.

Professional prompt engineers are actually hired by companies to write better prompts. This is a real, valuable skill you are developing.

## Key Techniques

### 1. Role Prompting
Tell AI WHO to be before telling it WHAT to do:
- "You are a marine biologist explaining ocean ecosystems to middle school students..."
- "Act as a debate coach helping me strengthen my argument about..."
- "You are a historical figure from the American Revolution. Respond as if I am interviewing you..."

### 2. Chain-of-Thought Prompting
Ask AI to show its reasoning step by step:
- "Solve this problem step by step, showing your work at each stage..."
- "Walk me through your reasoning for why this answer is correct..."
- "Think through this question out loud before giving your final answer..."

### 3. Format Specification
Tell AI exactly how to structure its response:
- "Respond using bullet points with no more than 2 sentences per point"
- "Create a table with 3 columns: Topic, Pro, and Con"
- "Write your response as a numbered list of exactly 5 items"

### 4. Constraint Setting
Set boundaries for AI's response:
- "Use only vocabulary that an 8th grader would know"
- "Keep your response under 200 words"
- "Do not include any information after the year 2020"
- "Explain this without using the word 'basically'"

### 5. Multi-Step Prompting
Break complex tasks into sequential prompts:
1. First prompt: "List the main causes of the Civil War"
2. Second prompt: "Now take the first cause and explain it in detail"
3. Third prompt: "How does this cause connect to issues we see today?"

## Key Vocabulary

- **Prompt engineering:** The practice of designing effective prompts for AI systems
- **Role prompting:** Assigning AI a specific identity or expertise
- **Chain-of-thought:** Asking AI to reason through steps visibly
- **Constraints:** Limitations or rules you set for AI's response
- **Iteration:** Revising and improving prompts based on results
- **A/B testing:** Comparing two different prompts to see which works better

## Activities

### Activity 1: Prompt Patterns Library
Create your own collection of prompt templates organized by purpose:
- Research template
- Creative writing template
- Study/review template
- Problem-solving template
- Comparison/analysis template

### Activity 2: Chain-of-Thought Practice
Take a complex question from any subject. Write two prompts:
1. A simple, direct question
2. A chain-of-thought version asking AI to reason step by step
Compare the results. Which is more helpful? When would you use each?

### Activity 3: A/B Testing
Write two different prompts that ask for the same thing but in different ways. Test both and document:
- Which produced better results?
- Why do you think one worked better?
- What would you change for next time?

### Activity 4: Prompt Challenge
Weekly challenge: Given a complex task, who can write the best prompt? Class votes on results (not the prompt itself - judge by output quality!).

## Pro Tips

1. **Start broad, then narrow:** Begin with a general prompt, then refine based on results
2. **Give examples:** Show AI what you want by providing 1-2 examples of ideal output
3. **Use "not" carefully:** Instead of saying what you do not want, describe what you DO want
4. **Layer your prompts:** Build on previous responses instead of starting over
5. **Save your best prompts:** Keep a personal prompt library for reuse

## Remember!

Prompt engineering is not just a tech skill - it is a thinking skill. When you learn to communicate precisely with AI, you are also learning to think more clearly, organize your thoughts better, and communicate more effectively with people too. These skills will serve you in every class, every job, and every relationship for the rest of your life.

## Check Your Understanding

1. What is the difference between a basic prompt and prompt engineering?
2. Describe three advanced prompting techniques and when you would use each.
3. Why is chain-of-thought prompting useful for complex questions?
4. What is A/B testing and how does it improve your prompts?
`,
    },
    {
      id: "doc_level_3_module_1_lesson",
      moduleId: "level_3_module_1",
      levelId: 3,
      title: "Teacher Guide: Advanced Prompting & Prompt Engineering",
      gradeBand: "6-8",
      documentType: "lesson_plan",
      standardsAlignment: ["ISTE 1.5 Computational Thinker", "CSTA 2-AP-13", "CSTA 2-AP-17", "CCSS.ELA-LITERACY.W.7.4"],
      content: `# Teacher Implementation Guide: Advanced Prompting & Prompt Engineering

## Module Overview
This module transforms students from AI users into strategic AI communicators through advanced prompting techniques including role prompting, chain-of-thought reasoning, format specification, and systematic prompt optimization through A/B testing.

## Learning Objectives
1. Master multi-step prompting and chain-of-thought reasoning
2. Use role prompting, format specification, and constraints
3. Debug and optimize prompts systematically
4. Apply prompt engineering to academic and creative tasks

## Session Structure (4 weeks, 2 sessions/week, 45 min each)

### Week 1: Role Prompting and Format Specification
**Session 1 (45 min):** Introduce prompt engineering as a professional skill. Teach role prompting with examples. Students practice writing 5 role prompts for different contexts. Test and compare results.

**Session 2 (45 min):** Format specification deep dive. Show how the same content looks different in paragraphs, bullets, tables, and numbered lists. Students practice specifying format in prompts. Introduce constraint setting.

### Week 2: Chain-of-Thought and Multi-Step
**Session 1 (45 min):** Teach chain-of-thought prompting with math and logic examples. Compare direct answers vs. reasoned responses. Students practice with subject-specific questions.

**Session 2 (45 min):** Multi-step prompting workshop. Students break complex tasks into prompt sequences. Practice with research, creative, and analytical tasks.

### Week 3: A/B Testing and Optimization
**Session 1 (45 min):** Introduce A/B testing methodology. Students write two versions of the same prompt, test both, and document results. Class discussion of findings.

**Session 2 (45 min):** Prompt debugging workshop. Students analyze prompts that produce poor results and identify why. Fix and retest. Build troubleshooting skills.

### Week 4: Prompt Patterns Library and Challenge
**Session 1 (45 min):** Students create their personal Prompt Patterns Library. Organize templates by purpose. Share best templates with class.

**Session 2 (45 min):** Prompt Challenge competition. Students receive complex tasks and compete to write the most effective prompt. Class votes on output quality. Celebrate winners and discuss what made winning prompts effective.

## Differentiation Strategies

### For Students Who Need More Support:
- Provide partially completed prompt templates to fill in
- Start with simpler role prompting before advancing
- Use familiar, engaging topics for practice
- Pair with a more experienced prompt writer

### For Advanced Learners:
- Introduce system prompts and temperature concepts
- Challenge them to create prompts that produce consistent, repeatable results
- Have them develop prompt engineering guides for specific subjects
- Explore few-shot and zero-shot prompting concepts

## Assessment Ideas

### Formative:
- Review prompt quality during practice sessions
- A/B testing documentation and analysis
- Peer feedback on prompt library entries

### Summative:
- Prompt Patterns Library (quality and variety of templates)
- Prompt Challenge performance (output quality, not just prompt cleverness)
- Written reflection on how prompt engineering has changed their AI use
- Practical demonstration: Given a new task, engineer an effective prompt live
`,
    },
    {
      id: "doc_level_3_module_1_rubric",
      moduleId: "level_3_module_1",
      levelId: 3,
      title: "Assessment Rubric: Advanced Prompting & Prompt Engineering",
      gradeBand: "6-8",
      documentType: "assessment_rubric",
      standardsAlignment: ["ISTE 1.5 Computational Thinker", "CSTA 2-AP-13", "CSTA 2-AP-17"],
      content: `# Assessment Rubric: Advanced Prompting & Prompt Engineering

## Module: Advanced Prompting & Prompt Engineering | Grade Band: 6-8

### Criteria 1: Technique Mastery
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student fluently uses all advanced techniques (role, chain-of-thought, format, constraints, multi-step). Combines techniques strategically. Creates novel prompt patterns for unique situations. |
| **Meeting (3)** | Student effectively uses at least 4 of the 5 advanced techniques. Applies appropriate technique for each task type. Prompt patterns library is comprehensive and organized. |
| **Approaching (2)** | Student uses 2-3 techniques with moderate success. May apply techniques inconsistently or in inappropriate contexts. Library is partial. |
| **Beginning (1)** | Student uses basic prompting without incorporating advanced techniques. Does not demonstrate understanding of when or how to apply different strategies. |

### Criteria 2: Systematic Optimization
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student conducts thorough A/B tests with clear documentation. Articulates WHY certain prompts work better. Shows iterative improvement over time. Develops optimization frameworks. |
| **Meeting (3)** | Student completes A/B tests and identifies which prompt works better. Can explain basic reasons for prompt effectiveness. Shows improvement through iteration. |
| **Approaching (2)** | Student attempts A/B testing but analysis is superficial. May not understand why one prompt outperforms another. Limited iteration. |
| **Beginning (1)** | Student does not systematically test or optimize prompts. Accepts first results without attempting improvement. |

### Criteria 3: Application and Transfer
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student independently applies prompt engineering across all subjects. Creates effective prompts for novel, complex tasks. Teaches techniques to others. Demonstrates creative applications. |
| **Meeting (3)** | Student applies prompt engineering to academic tasks across multiple subjects. Successfully uses techniques for research, creative, and analytical purposes. |
| **Approaching (2)** | Student applies techniques to familiar tasks but struggles with novel applications. Limited transfer across subjects. |
| **Beginning (1)** | Student cannot apply prompt engineering to real tasks. Techniques remain theoretical rather than practical. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },

    // ============================================================
    // LEVEL 3 MODULE 2: AI, Society & Ethics Deep Dive (Grade Band 6-8)
    // ============================================================
    {
      id: "doc_level_3_module_2_guide",
      moduleId: "level_3_module_2",
      levelId: 3,
      title: "Student Guide: AI, Society & Ethics Deep Dive",
      gradeBand: "6-8",
      documentType: "curriculum_guide",
      standardsAlignment: ["ISTE 1.2 Digital Citizen", "CSTA 2-IC-20", "CSTA 2-IC-21", "CASEL SEL Responsible Decision-Making"],
      content: `# AI, Society & Ethics Deep Dive - Your Student Guide

## The Big Picture

AI is not just a cool tool you use for homework. It is reshaping our entire world - from how doctors diagnose diseases to how judges make decisions in courtrooms. In this module, you are going to look at AI through a wider lens and grapple with some seriously important questions.

## Algorithmic Bias: When AI Is Unfair

Remember learning about bias? Now let us examine real cases:

### Case Study 1: Hiring Algorithms
Some companies used AI to screen job applications. The AI was trained on data from past employees (mostly men in tech). Result? The AI started rejecting women's applications. Not because women were less qualified, but because the AI learned that the "pattern" of a good employee looked male.

### Case Study 2: Facial Recognition
Facial recognition AI works better on some skin tones than others. Research showed error rates up to 34% for darker-skinned women, compared to less than 1% for lighter-skinned men. This is because the training data included mostly lighter-skinned faces.

### Case Study 3: Criminal Justice
Some courts use AI to predict whether someone might commit a crime again. Studies found these systems were biased against Black defendants, giving them higher risk scores even when they had similar backgrounds to white defendants.

## AI's Environmental Impact

Here is something most people do not think about: AI uses a LOT of energy.

- Training a single large AI model can produce as much carbon as five cars over their entire lifetimes
- Data centers (where AI runs) use about 1-2% of the world's electricity
- The water used to cool data centers could fill thousands of swimming pools

This does not mean AI is bad, but it means we need to think about sustainability.

## Key Vocabulary

- **Algorithmic bias:** When an AI system produces unfair results due to biased data or design
- **Surveillance:** Monitoring people's activities, often using technology like cameras and AI
- **Deepfake:** AI-generated fake video or audio that looks/sounds real
- **Regulation:** Rules and laws created by governments to control how something is used
- **Governance:** The system of rules and practices that control how organizations operate
- **Carbon footprint:** The total greenhouse gas emissions caused by an activity or product

## The Debate Zone

### Should AI Be Regulated? Consider These Perspectives:

**Arguments FOR regulation:**
- AI can cause real harm if misused (bias, deepfakes, surveillance)
- Companies may not self-regulate because AI makes them money
- People affected by AI decisions deserve protection
- We regulate other powerful technologies (cars, medicine, nuclear energy)

**Arguments AGAINST heavy regulation:**
- Too many rules could slow down beneficial AI development
- Technology changes faster than laws can keep up
- Different countries have different values - whose rules apply?
- Innovation happens best with freedom to experiment

What do YOU think? There is no single right answer, and that is what makes this discussion so important.

## Activities

### Activity 1: Bias Case Studies
Research one real-world case of AI bias. Prepare a 3-minute presentation covering:
- What happened
- Who was harmed
- Why the bias existed
- What could have been done differently

### Activity 2: Energy Cost Calculator
Research how much energy your favorite AI tools use. Calculate the environmental impact of your own AI usage over a month. What could companies do to reduce AI's carbon footprint?

### Activity 3: Policy Debate
Your class is Congress! Draft an AI regulation bill. You must balance:
- Protecting people from harm
- Allowing innovation to continue
- Being practical and enforceable
- Considering diverse perspectives

### Activity 4: Personal Ethics Framework
Create your own set of principles for ethical AI use. Consider:
- Privacy: What information should AI be allowed to collect?
- Fairness: How do we ensure AI treats everyone equally?
- Transparency: Should people know when AI is making decisions about them?
- Accountability: Who is responsible when AI makes a mistake?

## Remember!

These are not easy questions, and adults are still debating them. The fact that you are thinking about these issues now puts you ahead of most people. Your generation will be the one making critical decisions about AI's role in society. Start developing your ethical framework now.

## Check Your Understanding

1. Describe one real-world example of algorithmic bias and its impact.
2. How does AI affect the environment?
3. What are two arguments for AND two arguments against AI regulation?
4. Why is it important to have a personal ethics framework for AI?
`,
    },
    {
      id: "doc_level_3_module_2_lesson",
      moduleId: "level_3_module_2",
      levelId: 3,
      title: "Teacher Guide: AI, Society & Ethics Deep Dive",
      gradeBand: "6-8",
      documentType: "lesson_plan",
      standardsAlignment: ["ISTE 1.2 Digital Citizen", "CSTA 2-IC-20", "CSTA 2-IC-21", "CASEL SEL Responsible Decision-Making", "CCSS.ELA-LITERACY.RI.7.8"],
      content: `# Teacher Implementation Guide: AI, Society & Ethics Deep Dive

## Module Overview
This module challenges students to analyze AI's societal impact through real case studies of algorithmic bias, environmental considerations, and governance debates. Students develop critical analysis skills and personal ethical frameworks.

## Learning Objectives
1. Analyze algorithmic bias in real systems with specific case studies
2. Understand AI's environmental impact and sustainability concerns
3. Debate AI regulation and governance from multiple perspectives
4. Design a personal ethics framework for AI use

## Session Structure (4 weeks, 2 sessions/week, 45 min each)

### Week 1: Algorithmic Bias Deep Dive
**Session 1:** Present 3 real-world bias case studies. Guided analysis of each. Small group discussion: "What went wrong and who was harmed?"

**Session 2:** Students research their own bias case study. Prepare presentations. Discuss systemic causes of bias in AI.

### Week 2: Environmental Impact and Surveillance
**Session 1:** AI's carbon footprint exploration. Energy Cost Calculator activity. Discussion about sustainability in tech.

**Session 2:** AI surveillance discussion. Privacy implications. Students analyze their own digital footprint. Connect to real-world surveillance examples (age-appropriate).

### Week 3: Regulation and Governance Debate
**Session 1:** Introduction to AI regulation concepts. Compare approaches from different countries. Students begin drafting their "AI bill."

**Session 2:** Class Congress debate. Present and vote on AI regulation proposals. Debrief on compromise and complexity.

### Week 4: Personal Ethics Framework
**Session 1:** Students develop their personal AI ethics framework. Guided reflection on values, principles, and practical guidelines.

**Session 2:** Ethics framework presentations. Class discussion on common themes and differences. Create class ethics charter.

## Differentiation Strategies

### For Students Who Need More Support:
- Provide summarized versions of case studies
- Offer structured debate preparation templates
- Use graphic organizers for the ethics framework
- Allow collaborative work on all activities

### For Advanced Learners:
- Research international AI policy approaches
- Write a persuasive editorial on an AI ethics topic
- Lead a section of the class debate
- Connect bias analysis to data science concepts

## Important Notes
- Some case studies involve racial bias - create a safe, respectful discussion environment
- Encourage perspective-taking without diminishing real harm
- Connect to students' own experiences with technology
- Validate that these are genuinely difficult questions without easy answers
`,
    },
    {
      id: "doc_level_3_module_2_rubric",
      moduleId: "level_3_module_2",
      levelId: 3,
      title: "Assessment Rubric: AI, Society & Ethics Deep Dive",
      gradeBand: "6-8",
      documentType: "assessment_rubric",
      standardsAlignment: ["ISTE 1.2 Digital Citizen", "CSTA 2-IC-20", "CASEL SEL Responsible Decision-Making"],
      content: `# Assessment Rubric: AI, Society & Ethics Deep Dive

## Module: AI, Society & Ethics Deep Dive | Grade Band: 6-8

### Criteria 1: Bias Analysis
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student analyzes bias case studies with sophistication. Identifies root causes, systemic patterns, and proposes evidence-based solutions. Connects bias to broader social justice concepts. |
| **Meeting (3)** | Student accurately analyzes bias case studies. Identifies what went wrong, who was harmed, and why bias existed. Presents findings clearly. |
| **Approaching (2)** | Student has basic understanding of AI bias but analysis lacks depth. May identify the problem but struggles with root causes or solutions. |
| **Beginning (1)** | Student cannot analyze AI bias cases effectively. Does not demonstrate understanding of how or why bias occurs in AI systems. |

### Criteria 2: Ethical Reasoning
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student demonstrates nuanced ethical reasoning. Considers multiple stakeholder perspectives. Ethics framework is comprehensive, practical, and reflects deep personal reflection. |
| **Meeting (3)** | Student develops a clear personal ethics framework. Addresses key areas (privacy, fairness, transparency, accountability). Shows thoughtful engagement with ethical questions. |
| **Approaching (2)** | Student creates a basic ethics framework but it may be vague or incomplete. Limited engagement with the complexity of ethical questions. |
| **Beginning (1)** | Student cannot articulate ethical principles for AI use. Framework is missing or superficial. |

### Criteria 3: Debate and Argumentation
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student presents well-researched, compelling arguments. Anticipates counterarguments and addresses them. Demonstrates ability to consider and respect opposing viewpoints. |
| **Meeting (3)** | Student participates effectively in debates. Presents clear arguments with supporting evidence. Shows willingness to consider alternative perspectives. |
| **Approaching (2)** | Student participates in debates with limited evidence or reasoning. May struggle to articulate a clear position or consider opposing views. |
| **Beginning (1)** | Student does not participate meaningfully in debates. Cannot articulate a position or provide supporting reasoning. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },

    // ============================================================
    // LEVEL 3 MODULE 3: Introduction to How AI Works (Grade Band 6-8)
    // ============================================================
    {
      id: "doc_level_3_module_3_guide",
      moduleId: "level_3_module_3",
      levelId: 3,
      title: "Student Guide: Introduction to How AI Works",
      gradeBand: "6-8",
      documentType: "curriculum_guide",
      standardsAlignment: ["ISTE 1.5 Computational Thinker", "CSTA 2-DA-08", "CSTA 2-AP-13"],
      content: `# Introduction to How AI Works - Your Student Guide

## Peeking Under the Hood

You have been using AI like a pro. Now it is time to understand what is actually happening inside. AI is not magic - it is math, patterns, and a LOT of data. Understanding the basics of how AI works will make you an even better AI user and prepare you for building your own AI tools.

## Machine Learning: The Core Idea

At its heart, AI is about **pattern recognition.** Machine learning is a type of AI where computers learn from examples instead of being programmed with specific rules.

**Analogy:** Imagine learning to identify dogs. Nobody gave you a rulebook that says "a dog has four legs, fur, and a tail." Instead, people showed you thousands of dogs and said "that is a dog!" Eventually, your brain learned the pattern. Machine learning works the same way - just with math instead of a brain.

### The Three Steps of Machine Learning:
1. **Collect Data:** Gather thousands (or millions) of examples
2. **Train the Model:** The AI finds patterns in the data
3. **Make Predictions:** The AI uses those patterns to handle new situations

## Neural Networks: AI's "Brain"

Neural networks are inspired by the human brain (but much simpler). They are made of layers of connected "nodes" that process information:

- **Input Layer:** Receives the data (an image, text, numbers)
- **Hidden Layers:** Process the data and find patterns (the "thinking" part)
- **Output Layer:** Produces the result (a classification, prediction, or response)

Think of it like a factory assembly line: raw materials come in one end, workers in the middle transform them, and the finished product comes out the other end.

## Types of AI You Use Every Day

### Chatbots (Large Language Models)
- Predict the most likely next word based on patterns in text
- Trained on billions of words from books, websites, and articles
- Examples: ChatGPT, Google Gemini

### Image Recognition
- Identifies objects, faces, and scenes in pictures
- Trained on millions of labeled images
- Examples: Face unlock on phones, Google Photos search

### Recommendation Systems
- Predict what you might like based on your past behavior
- Find patterns in what similar users enjoyed
- Examples: Netflix, YouTube, Spotify suggestions

## Key Vocabulary

- **Machine learning:** AI that learns from data rather than explicit programming
- **Neural network:** A system inspired by the brain, made of connected processing nodes
- **Training data:** The examples used to teach an AI system
- **Model:** The trained AI system that can make predictions
- **Classification:** Sorting items into categories
- **Pattern recognition:** Identifying recurring themes or structures in data

## Activities

### Activity 1: Teachable Machine
Use Google's Teachable Machine to train a simple AI model. Teach it to recognize different hand gestures or objects. Experience firsthand how training data affects AI performance.

### Activity 2: Pattern Detective
Look at a set of data (weather patterns, sports statistics, or animal characteristics) and try to find the patterns yourself. Then compare your findings with what an AI might identify. How are they similar or different?

### Activity 3: Training Data Hunt
Choose an AI application (face recognition, language translation, music recommendations). Research what training data was needed and discuss: What biases might exist in that data?

### Activity 4: Build a Decision Tree
Create a manual decision tree to classify something (types of music, sports, animals). Walk through the tree with examples. Understand how this simplified version relates to how AI makes decisions.

## Remember!

Understanding how AI works does not require you to be a math genius or a computer scientist. The concepts are simpler than you think, and knowing the basics makes you a more informed and effective AI user. You are learning to see behind the curtain, and that knowledge is power.

## Check Your Understanding

1. Explain machine learning in your own words.
2. What are the three steps of machine learning?
3. How is a neural network similar to a factory assembly line?
4. Name three types of AI and give an example of each.
`,
    },
    {
      id: "doc_level_3_module_3_lesson",
      moduleId: "level_3_module_3",
      levelId: 3,
      title: "Teacher Guide: Introduction to How AI Works",
      gradeBand: "6-8",
      documentType: "lesson_plan",
      standardsAlignment: ["ISTE 1.5 Computational Thinker", "CSTA 2-DA-08", "CSTA 2-AP-13", "NGSS MS-ETS1-1"],
      content: `# Teacher Implementation Guide: Introduction to How AI Works

## Module Overview
This module demystifies AI by teaching students the fundamental concepts of machine learning, neural networks, and different AI types. Students gain conceptual understanding through hands-on activities and analogies.

## Learning Objectives
1. Understand machine learning basics (pattern recognition, training data)
2. Grasp neural network concepts (layers, training, inference)
3. Recognize different AI types and their applications
4. Connect theoretical understanding to practical AI use

## Session Structure (4 weeks, 2 sessions/week, 45 min each)

### Week 1: Machine Learning Fundamentals
**Session 1:** Introduction to machine learning with the "dog recognition" analogy. Three steps of ML. Interactive sorting activity to simulate pattern recognition.

**Session 2:** Hands-on with Google Teachable Machine. Students train their first AI model. Discuss: How did the amount and quality of training data affect results?

### Week 2: Neural Networks
**Session 1:** Neural network concepts using the factory assembly line analogy. Visual demonstrations of input, hidden, and output layers. Students draw their own neural network diagrams.

**Session 2:** Interactive neural network simulation. Students act as "nodes" in a human neural network, passing and transforming information. Connect the activity to real AI processing.

### Week 3: Types of AI
**Session 1:** Survey of AI types: chatbots, image recognition, recommendations. Students identify which type powers their favorite apps and tools.

**Session 2:** Deep dive into one AI type per group. Groups research and present how their assigned AI type works, what data it needs, and where bias might enter.

### Week 4: Building Understanding
**Session 1:** Decision Tree building activity. Students create manual classification systems. Connect to how AI makes similar decisions at massive scale.

**Session 2:** Synthesis and review. Students create "How AI Works" explainer content (video, poster, or guide) for a younger audience. Module reflection.

## Differentiation Strategies

### For Students Who Need More Support:
- Heavy use of analogies and visual aids
- Simplified Teachable Machine activities with step-by-step guides
- Pre-built decision tree templates to complete
- Focus on conceptual understanding over technical details

### For Advanced Learners:
- Introduce basic concepts of supervised vs. unsupervised learning
- Explore how transformers (the architecture behind ChatGPT) work
- Have them train models with deliberately biased data to see the impact
- Research emerging AI architectures and present findings

## Assessment Ideas

### Formative:
- Teachable Machine project quality and reflection
- Neural network diagram accuracy
- Decision tree functionality

### Summative:
- "How AI Works" explainer project (any format)
- Written assessment on ML concepts and AI types
- Practical demonstration: Train and evaluate a simple model
`,
    },
    {
      id: "doc_level_3_module_3_rubric",
      moduleId: "level_3_module_3",
      levelId: 3,
      title: "Assessment Rubric: Introduction to How AI Works",
      gradeBand: "6-8",
      documentType: "assessment_rubric",
      standardsAlignment: ["ISTE 1.5 Computational Thinker", "CSTA 2-DA-08"],
      content: `# Assessment Rubric: Introduction to How AI Works

## Module: Introduction to How AI Works | Grade Band: 6-8

### Criteria 1: Machine Learning Understanding
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student explains machine learning concepts clearly using original analogies. Understands the relationship between data quality, quantity, and model performance. Can discuss limitations of ML approaches. |
| **Meeting (3)** | Student correctly describes the three steps of machine learning. Understands that AI learns from patterns in data. Can explain training and prediction in their own words. |
| **Approaching (2)** | Student has basic awareness of machine learning but explanations are vague or partially incorrect. May confuse ML with traditional programming. |
| **Beginning (1)** | Student cannot explain machine learning concepts. Does not understand how AI learns from data. |

### Criteria 2: Technical Concept Application
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student successfully completes hands-on activities and extends them independently. Draws insightful connections between activities and real-world AI. Creates effective explainer content. |
| **Meeting (3)** | Student completes Teachable Machine and decision tree activities successfully. Can connect hands-on experience to theoretical concepts. |
| **Approaching (2)** | Student completes activities with significant support. Connections between hands-on work and concepts are limited. |
| **Beginning (1)** | Student struggles to complete hands-on activities. Cannot connect activities to AI concepts. |

### Criteria 3: AI Type Recognition
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student identifies AI types in unfamiliar applications. Explains how different types work and what data they need. Analyzes potential bias in training data for each type. |
| **Meeting (3)** | Student correctly identifies 3+ AI types and gives examples. Understands basic differences between chatbots, image recognition, and recommendation systems. |
| **Approaching (2)** | Student identifies 1-2 AI types but may confuse them or provide inaccurate examples. Limited understanding of how different AI types work. |
| **Beginning (1)** | Student cannot distinguish between different types of AI. Does not understand that different applications use different approaches. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },

    // ============================================================
    // LEVEL 3 MODULE 4: Building with AI Tools (Grade Band 6-8)
    // ============================================================
    {
      id: "doc_level_3_module_4_guide",
      moduleId: "level_3_module_4",
      levelId: 3,
      title: "Student Guide: Building with AI Tools",
      gradeBand: "6-8",
      documentType: "curriculum_guide",
      standardsAlignment: ["ISTE 1.4 Innovative Designer", "ISTE 1.5 Computational Thinker", "CSTA 2-AP-13", "CSTA 2-AP-17"],
      content: `# Building with AI Tools - Your Student Guide

## From User to Creator

This is it - the module where you go from someone who USES AI to someone who BUILDS with it. You have the knowledge, the skills, and the ethical foundation. Now it is time to create something real.

## No-Code AI Platforms

You do not need to be a professional programmer to build AI tools. No-code platforms let you create AI-powered applications using visual interfaces:

- **Google Teachable Machine:** Train image, sound, and pose recognition models
- **Scratch + AI extensions:** Build AI-powered games and stories
- **AI chatbot builders:** Create custom chatbots for specific purposes
- **Canva AI features:** Design with AI-assisted tools

## Understanding AI APIs

An **API** (Application Programming Interface) is like a menu at a restaurant. You do not need to know how the kitchen works - you just order what you want, and it gets delivered. AI APIs work the same way:

1. You send a request (your "order")
2. The AI service processes it (the "kitchen")
3. You receive the result (your "meal")

## Building Your Own Chatbot

A chatbot is one of the most practical AI projects you can build. Here is the process:

### Step 1: Define the Purpose
What will your chatbot do? Help with homework? Answer questions about a topic? Provide customer service for a pretend business?

### Step 2: Design the Personality
What is your chatbot's name? How should it talk? Formal or casual? Funny or serious?

### Step 3: Create the Knowledge Base
What information does your chatbot need to know? Gather facts, rules, and responses.

### Step 4: Build and Test
Use a chatbot building platform to create your bot. Test it with real users and improve based on feedback.

### Step 5: Iterate and Improve
No first version is perfect! Collect feedback, find problems, and make your chatbot better.

## Key Vocabulary

- **API:** Application Programming Interface - a way for programs to communicate
- **No-code:** Building applications without writing traditional code
- **Chatbot:** An AI program designed to have conversations
- **Prototype:** A first version of a product, built for testing
- **User testing:** Having real people try your product and give feedback
- **Sprint:** A focused period of rapid development (usually 1-2 weeks)

## Activities

### Activity 1: Platform Exploration
Try out at least 3 different no-code AI platforms. For each one, note:
- What can it do?
- How easy is it to use?
- What could you build with it?
- What are its limitations?

### Activity 2: Chatbot Builder
Create a custom chatbot for a specific purpose. Ideas:
- A school tour guide for new students
- A study helper for a specific subject
- A book recommendation bot
- A fun quiz bot about a topic you love

### Activity 3: API Integration
Using a simple web builder, connect an AI API to create a basic tool. Start small - maybe a text summarizer, a translation tool, or an image caption generator.

### Activity 4: Prototype Sprint
2-week rapid development project:
- Week 1: Design, plan, and build your prototype
- Week 2: Test, get feedback, and improve

## Remember!

You now have skills that many adults wish they had. Building with AI tools is not just a school project - it is preparation for the future. Whether you become a developer, a designer, a teacher, or anything else, the ability to build with AI will give you a massive advantage. Start building!

## Check Your Understanding

1. What is the difference between a no-code platform and traditional coding?
2. What are the five steps of building a chatbot?
3. Explain what an API does using the restaurant analogy.
4. Why is user testing important when building AI tools?
`,
    },
    {
      id: "doc_level_3_module_4_lesson",
      moduleId: "level_3_module_4",
      levelId: 3,
      title: "Teacher Guide: Building with AI Tools",
      gradeBand: "6-8",
      documentType: "lesson_plan",
      standardsAlignment: ["ISTE 1.4 Innovative Designer", "ISTE 1.5 Computational Thinker", "CSTA 2-AP-13", "CSTA 2-AP-17"],
      content: `# Teacher Implementation Guide: Building with AI Tools

## Module Overview
This capstone module for Level 3 transitions students from AI consumers to AI builders. Students explore no-code platforms, understand APIs conceptually, build functional chatbots, and complete a rapid prototype sprint.

## Learning Objectives
1. Use AI APIs and no-code platforms effectively
2. Build functional chatbots and simple AI applications
3. Integrate AI into websites and projects
4. Complete a 2-week rapid development cycle

## Session Structure (4 weeks, 2 sessions/week, 45 min each)

### Week 1: Platform Exploration
**Session 1:** Survey of no-code AI platforms. Teacher demo of 2-3 platforms. Students explore and document capabilities. API concept introduction with restaurant analogy.

**Session 2:** Deeper exploration. Students choose a platform and complete a guided tutorial. Share findings with class. Begin brainstorming project ideas.

### Week 2: Chatbot Building
**Session 1:** Chatbot design workshop. Define purpose, personality, and knowledge base. Students create their chatbot plan on paper before building.

**Session 2:** Building session. Students build their chatbots using chosen platform. Teacher circulates for support. Peer testing begins.

### Week 3: Prototype Sprint - Build Phase
**Session 1:** Students define their sprint project (can be chatbot expansion or new project). Create development plan. Begin building.

**Session 2:** Continued building. Mid-sprint check-in. Address blockers. Peer feedback session.

### Week 4: Prototype Sprint - Test and Present
**Session 1:** User testing session. Students test each other's projects. Collect structured feedback. Begin improvements.

**Session 2:** Final presentations. Students demo their projects. Class feedback and celebration. Module reflection: "What did you build and what did you learn?"

## Differentiation Strategies

### For Students Who Need More Support:
- Provide step-by-step platform tutorials with screenshots
- Offer pre-built chatbot templates to customize
- Pair with a tech-confident partner
- Simplify sprint project scope

### For Advanced Learners:
- Encourage API integration with simple web projects
- Challenge them to build multi-feature applications
- Have them create platform tutorials for classmates
- Introduce version control concepts

## Assessment Ideas

### Formative:
- Platform exploration notes quality
- Chatbot plan completeness before building
- Sprint progress check-ins

### Summative:
- Functional chatbot or AI project demonstration
- User testing results and iteration documentation
- Sprint reflection: Process, challenges, and learnings
- Peer evaluations of final projects
`,
    },
    {
      id: "doc_level_3_module_4_rubric",
      moduleId: "level_3_module_4",
      levelId: 3,
      title: "Assessment Rubric: Building with AI Tools",
      gradeBand: "6-8",
      documentType: "assessment_rubric",
      standardsAlignment: ["ISTE 1.4 Innovative Designer", "CSTA 2-AP-13", "CSTA 2-AP-17"],
      content: `# Assessment Rubric: Building with AI Tools

## Module: Building with AI Tools | Grade Band: 6-8

### Criteria 1: Technical Execution
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student builds a polished, functional AI project that works reliably. Demonstrates advanced platform features. Project goes beyond requirements with creative technical solutions. |
| **Meeting (3)** | Student builds a functional AI project (chatbot or application). Project works as intended for its defined purpose. Uses platform features appropriately. |
| **Approaching (2)** | Student creates a partially functional project. May have bugs or incomplete features. Demonstrates basic platform use but lacks polish. |
| **Beginning (1)** | Student does not complete a functional project. Struggles with platform tools. Project does not work as intended. |

### Criteria 2: Design and Planning
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student demonstrates thoughtful, user-centered design. Project addresses a real need. Planning documentation is comprehensive. Design decisions are well-reasoned and justified. |
| **Meeting (3)** | Student plans before building. Project has a clear purpose and target audience. Design is functional and appropriate. Documentation covers key decisions. |
| **Approaching (2)** | Student does minimal planning before building. Project purpose is vague. Design choices are not clearly justified. |
| **Beginning (1)** | Student begins building without planning. Project lacks clear purpose or audience. No design documentation. |

### Criteria 3: Iteration and Improvement
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student actively seeks and incorporates user feedback. Makes multiple meaningful improvements. Final version is significantly better than first version. Documents the iteration process. |
| **Meeting (3)** | Student collects user feedback and makes at least 2 improvements. Shows willingness to revise based on testing. Final version shows improvement from initial prototype. |
| **Approaching (2)** | Student collects minimal feedback. Makes 1 small improvement. Limited evidence of iteration or testing. |
| **Beginning (1)** | Student does not test or iterate. First version is submitted as final. No evidence of user feedback or improvement. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },

    // ============================================================
    // LEVEL 4 MODULE 1: Advanced AI Applications (Grade Band 9-12)
    // ============================================================
    {
      id: "doc_level_4_module_1_guide",
      moduleId: "level_4_module_1",
      levelId: 4,
      title: "Student Guide: Advanced AI Applications & Emerging Tech",
      gradeBand: "9-12",
      documentType: "curriculum_guide",
      standardsAlignment: ["ISTE 1.5 Computational Thinker", "ISTE 1.4 Innovative Designer", "CSTA 3A-AP-13", "CSTA 3A-IC-24"],
      content: `# Advanced AI Applications & Emerging Tech - Your Student Guide

## The Cutting Edge

The AI landscape is evolving at an unprecedented pace. What was science fiction five years ago is reality today. In this module, you will explore the most advanced AI systems being built right now and understand what they mean for your future.

## Multimodal AI

Traditional AI systems were specialists - text models handled text, image models handled images. Multimodal AI systems can work across multiple types of data simultaneously:

- **Text + Image:** Describe an image in words, or generate images from descriptions
- **Text + Audio:** Convert speech to text, generate spoken responses
- **Text + Video:** Analyze video content, generate video from descriptions
- **Text + Code:** Write, debug, and explain code from natural language

These systems understand context across modalities, making them dramatically more useful than single-mode AI.

## AI Agents

AI agents are systems that can take actions autonomously, not just generate text. They can:
- Browse the web and gather information
- Execute multi-step plans
- Use tools and APIs independently
- Collaborate with other AI agents
- Learn from their interactions and improve

This is a significant shift from AI as a question-answering system to AI as an autonomous worker.

## AI in Specialized Domains

### Healthcare
- AI analyzes medical images (X-rays, MRIs) with accuracy rivaling experienced radiologists
- Drug discovery accelerated from years to months
- Personalized treatment plans based on genetic data
- Mental health chatbots providing accessible support

### Climate Science
- Climate modeling with unprecedented accuracy
- Optimizing renewable energy systems
- Predicting extreme weather events
- Monitoring deforestation via satellite imagery

### Education
- Personalized learning paths adapted to individual students
- Automated assessment with detailed feedback
- Language translation removing barriers to education
- AI tutoring systems available 24/7

## Key Vocabulary

- **Multimodal:** Capable of processing multiple types of data (text, image, audio, video)
- **AI agent:** An AI system capable of autonomous action and decision-making
- **Code generation:** AI writing functional computer code from natural language descriptions
- **Foundation model:** A large AI model trained on broad data that can be adapted for many tasks
- **Transfer learning:** Using knowledge from one AI task to improve performance on another
- **Emerging technology:** New technology in early stages of development or adoption

## Activities

### Activity 1: Technology Forecast
Research 3 emerging AI technologies. For each one:
- What does it do?
- Who benefits from it?
- What are the risks?
- How might it change the world in 5, 10, and 20 years?

### Activity 2: Domain Deep-Dive
Choose a specialized domain (healthcare, climate, education, law, art). Research how AI is currently being used in that field:
- What problems has it solved?
- What new problems has it created?
- What ethical concerns exist?
- Where is it headed?

### Activity 3: Hands-On Experiments
Try using at least 3 cutting-edge AI tools. Document:
- What the tool does well
- Where it fails or struggles
- How it compares to simpler AI tools you have used before
- What impressed or concerned you

### Activity 4: Limitations Analysis
For each AI application you study, identify:
- What it CANNOT do (yet)
- Why those limitations exist
- What would need to happen to overcome them
- Whether overcoming them is desirable

## The Uncomfortable Questions

As AI becomes more capable, uncomfortable questions emerge:
- If AI can diagnose diseases better than doctors, should it replace them?
- If AI can write legal briefs, what happens to paralegals?
- If AI can generate art, what does that mean for human artists?
- If AI agents can work autonomously, what jobs remain uniquely human?

There are no easy answers. But thinking deeply about these questions now positions you to lead the conversation rather than just react to it.

## Remember!

You are studying AI at a pivotal moment in history. The technologies you explore in this module will fundamentally reshape society within your lifetime. Your understanding gives you agency - the ability to shape how these technologies are developed and deployed rather than simply being affected by them. That is a profound responsibility and an extraordinary opportunity.

## Check Your Understanding

1. What makes multimodal AI different from traditional AI systems?
2. How are AI agents different from chatbots?
3. Choose one domain and explain how AI is transforming it.
4. What is one AI limitation that you think is important and why?
`,
    },
    {
      id: "doc_level_4_module_1_lesson",
      moduleId: "level_4_module_1",
      levelId: 4,
      title: "Teacher Guide: Advanced AI Applications & Emerging Tech",
      gradeBand: "9-12",
      documentType: "lesson_plan",
      standardsAlignment: ["ISTE 1.5 Computational Thinker", "ISTE 1.4 Innovative Designer", "CSTA 3A-AP-13", "CSTA 3A-IC-24"],
      content: `# Teacher Implementation Guide: Advanced AI Applications & Emerging Tech

## Module Overview
This module explores cutting-edge AI capabilities including multimodal models, autonomous agents, and domain-specific applications. Students analyze both the potential and limitations of advanced AI systems.

## Learning Objectives
1. Explore cutting-edge AI: multimodal models, agents, code generation
2. Understand AI in specialized domains (healthcare, climate, education)
3. Analyze breakthrough technologies and their implications
4. Critically evaluate AI capabilities and limitations

## Session Structure (5 weeks, 2 sessions/week, 60 min each)

### Week 1: Multimodal AI
**Session 1:** Introduction to multimodal AI. Demos of text-to-image, speech-to-text, and cross-modal applications. Historical context: from narrow AI to multimodal systems.

**Session 2:** Hands-on exploration with multimodal tools. Students test capabilities and document results. Compare single-mode vs. multimodal performance.

### Week 2: AI Agents and Autonomy
**Session 1:** Introduction to AI agents. Demo of agent capabilities. Discussion: What changes when AI can take action, not just generate text?

**Session 2:** Explore autonomous AI implications. Research and debate: How much autonomy should AI systems have? What safeguards are needed?

### Week 3: Domain Deep-Dives
**Session 1:** Healthcare AI case studies. Students analyze real applications and their impact. Ethical considerations in medical AI.

**Session 2:** Climate AI and education AI. Students choose a domain for their deep-dive project. Begin research.

### Week 4: Limitations and Futures
**Session 1:** Limitations analysis workshop. For each major AI application, identify what it cannot do and why. Discuss whether all limitations should be overcome.

**Session 2:** Technology forecast presentations. Students present their research on emerging AI technologies and predictions.

### Week 5: Synthesis and Reflection
**Session 1:** "Uncomfortable questions" Socratic seminar. Structured discussion about AI's impact on work, creativity, and human identity.

**Session 2:** Module synthesis. Students create a position paper on one aspect of advanced AI. Reflect on their journey from AI Explorer to AI Innovator.

## Differentiation Strategies

### For Students Who Need More Support:
- Provide structured research templates
- Curate specific articles and resources for each domain
- Offer smaller-scope project options
- Partner with advanced learners for technology exploration

### For Advanced Learners:
- Independent research on a specific emerging AI technology
- Write a technical blog post or create a presentation for a wider audience
- Interview professionals using AI in their domain
- Explore the technical papers behind key AI breakthroughs

## Assessment Ideas

### Formative:
- Technology exploration documentation
- Domain deep-dive research progress
- Socratic seminar participation quality

### Summative:
- Technology Forecast presentation with research documentation
- Domain deep-dive report or presentation
- Position paper on an advanced AI topic
- Limitations analysis with supporting evidence
`,
    },
    {
      id: "doc_level_4_module_1_rubric",
      moduleId: "level_4_module_1",
      levelId: 4,
      title: "Assessment Rubric: Advanced AI Applications & Emerging Tech",
      gradeBand: "9-12",
      documentType: "assessment_rubric",
      standardsAlignment: ["ISTE 1.5 Computational Thinker", "CSTA 3A-AP-13", "CSTA 3A-IC-24"],
      content: `# Assessment Rubric: Advanced AI Applications & Emerging Tech

## Module: Advanced AI Applications & Emerging Tech | Grade Band: 9-12

### Criteria 1: Technical Understanding
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student demonstrates deep understanding of advanced AI concepts. Accurately explains multimodal systems, agents, and domain-specific AI. Makes insightful connections between technologies. Can analyze technical capabilities and limitations with sophistication. |
| **Meeting (3)** | Student correctly explains key concepts of multimodal AI, agents, and domain applications. Demonstrates understanding of how these systems differ from simpler AI. Identifies major capabilities and limitations. |
| **Approaching (2)** | Student has surface-level understanding of advanced AI concepts. Explanations contain inaccuracies or lack depth. Struggles to distinguish between different types of advanced AI. |
| **Beginning (1)** | Student cannot explain advanced AI concepts. Does not demonstrate understanding of multimodal systems, agents, or domain-specific applications. |

### Criteria 2: Critical Analysis
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student provides nuanced, well-researched analysis of AI applications. Considers multiple stakeholder perspectives. Identifies non-obvious implications and connections. Analysis is supported by evidence. |
| **Meeting (3)** | Student analyzes AI applications thoughtfully. Considers benefits, risks, and ethical implications. Domain deep-dive is comprehensive. Limitations analysis is accurate and relevant. |
| **Approaching (2)** | Student provides basic analysis but lacks depth or nuance. May focus only on benefits or only on risks. Limitations analysis is superficial. |
| **Beginning (1)** | Student does not engage in meaningful analysis. Cannot identify benefits, risks, or limitations of advanced AI applications. |

### Criteria 3: Future Thinking
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student demonstrates sophisticated forward-thinking about AI's trajectory. Technology forecast is well-researched and considers multiple scenarios. Engages deeply with societal implications. Position paper is compelling and original. |
| **Meeting (3)** | Student makes reasonable predictions about AI's future development. Considers societal implications. Technology forecast is supported by current trends. Engages with "uncomfortable questions" thoughtfully. |
| **Approaching (2)** | Student makes vague or unsupported predictions. Limited engagement with societal implications. Technology forecast lacks specificity or evidence. |
| **Beginning (1)** | Student cannot articulate a vision of AI's future. Does not engage with societal implications or predictions. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },

    // ============================================================
    // LEVEL 4 MODULE 2: AI Safety, Alignment & Responsible Development (9-12)
    // ============================================================
    {
      id: "doc_level_4_module_2_guide",
      moduleId: "level_4_module_2",
      levelId: 4,
      title: "Student Guide: AI Safety, Alignment & Responsible Development",
      gradeBand: "9-12",
      documentType: "curriculum_guide",
      standardsAlignment: ["ISTE 1.2 Digital Citizen", "CSTA 3A-IC-25", "CSTA 3A-IC-26", "CASEL SEL Responsible Decision-Making"],
      content: `# AI Safety, Alignment & Responsible Development - Your Student Guide

## Beyond Ethics: Safety and Alignment

You have already explored AI ethics. Now we go deeper into one of the most critical challenges facing humanity: how do we ensure that increasingly powerful AI systems remain safe, beneficial, and aligned with human values?

## The Alignment Problem

The alignment problem asks: How do we make sure AI does what we actually want, not just what we literally asked for?

**Example:** Tell AI to "maximize happiness" and it might decide to give everyone drugs. Tell it to "reduce suffering" and it might decide the easiest solution is to eliminate the beings who suffer. These are extreme examples, but they illustrate a real challenge: specifying human values precisely enough for machines is extraordinarily difficult.

## Key Concepts in AI Safety

### Specification Problem
How do you write down exactly what you want AI to do? Human values are complex, context-dependent, and sometimes contradictory. Translating them into code-compatible specifications is one of the hardest challenges in AI safety.

### Robustness
A safe AI system should work correctly even in unusual or adversarial situations. It should not fail catastrophically when encountering edge cases or deliberate attacks.

### Corrigibility
AI systems should allow humans to correct, modify, or shut them down. An AI that resists being turned off or modified is, by definition, unsafe.

### Scalable Oversight
As AI systems become more capable, humans need reliable ways to monitor and evaluate their behavior. This becomes harder as AI handles tasks that humans cannot easily verify.

## Responsible AI Frameworks

Several frameworks guide responsible AI development:

### The Asilomar AI Principles (2017)
- AI should benefit humanity
- Research should be collaborative, not secretive
- AI systems should be transparent and accountable
- Long-term risks should be taken seriously

### EU AI Act (2024)
- Categorizes AI applications by risk level
- Bans certain uses (social scoring, real-time surveillance)
- Requires transparency for high-risk systems
- Mandates human oversight for critical decisions

### Corporate Responsibility
Major AI companies publish their own safety principles. Critically evaluate these: Are they genuine commitments or just public relations?

## Key Vocabulary

- **Alignment:** Ensuring AI systems pursue goals that match human values and intentions
- **Existential risk:** A risk that could threaten the survival or long-term potential of humanity
- **Value alignment:** The challenge of encoding human values into AI systems
- **Red teaming:** Deliberately trying to make AI systems fail or behave badly to find vulnerabilities
- **Guardrails:** Safety measures designed to prevent AI from producing harmful outputs
- **Corrigibility:** An AI system's willingness to allow humans to correct or shut it down

## Activities

### Activity 1: Safety Scenarios
Analyze these scenarios and identify the safety challenges:
1. A self-driving car must choose between two dangerous maneuvers
2. An AI hiring tool systematically filters out certain demographics
3. A chatbot gives medical advice that contradicts a doctor's recommendation
4. An AI trading system crashes the stock market in seconds

### Activity 2: Alignment Problem Workshop
Try to write a complete specification for what "good" means in a specific context. Discover how hard it is to anticipate edge cases and unintended interpretations.

### Activity 3: Framework Comparison
Compare 3 different AI safety frameworks. Evaluate each one:
- What does it cover?
- What does it miss?
- Is it enforceable?
- Who does it protect?

### Activity 4: Design Safety Features
For a specific AI application, design your own safety guardrails:
- What could go wrong?
- How would you prevent it?
- How would you detect problems?
- How would humans maintain control?

## Your AI Ethics Statement

Write a personal AI ethics statement that addresses:
1. What you believe about AI's role in society
2. What responsibilities AI developers have
3. What responsibilities AI users have
4. What your personal principles are for AI use and development
5. How you would respond to an AI safety concern

## Remember!

The most important question about AI is not "What CAN it do?" but "What SHOULD it do?" You are among the first generation to grow up with powerful AI. Your voice in shaping how it develops matters. Do not let the conversation happen without you.

## Check Your Understanding

1. Explain the alignment problem in your own words.
2. What is corrigibility and why does it matter?
3. Compare two AI safety frameworks and their strengths.
4. Why is the specification problem so difficult?
`,
    },
    {
      id: "doc_level_4_module_2_lesson",
      moduleId: "level_4_module_2",
      levelId: 4,
      title: "Teacher Guide: AI Safety, Alignment & Responsible Development",
      gradeBand: "9-12",
      documentType: "lesson_plan",
      standardsAlignment: ["ISTE 1.2 Digital Citizen", "CSTA 3A-IC-25", "CSTA 3A-IC-26", "CASEL SEL Responsible Decision-Making"],
      content: `# Teacher Implementation Guide: AI Safety, Alignment & Responsible Development

## Module Overview
This module addresses the critical intersection of AI capability and safety. Students explore the alignment problem, analyze responsible AI frameworks, and develop personal ethics statements grounded in deep understanding of AI safety challenges.

## Learning Objectives
1. Understand AI safety research and the alignment problem
2. Explore value alignment challenges through hands-on exercises
3. Study and compare responsible AI frameworks
4. Develop a personal AI ethics statement

## Session Structure (5 weeks, 2 sessions/week, 60 min each)

### Week 1: The Alignment Problem
**Session 1:** Introduction to alignment through thought experiments. The "maximize happiness" example. Discussion of why specifying values is hard.

**Session 2:** Specification problem workshop. Students try to write complete specifications for AI behavior in specific contexts. Share and discuss the challenges encountered.

### Week 2: Safety Concepts
**Session 1:** Robustness, corrigibility, and scalable oversight. Case studies of AI systems that failed or behaved unexpectedly. Analysis of what went wrong.

**Session 2:** Red teaming exercise. Students attempt to identify failure modes in described AI systems. Practice thinking adversarially about AI safety.

### Week 3: Frameworks and Policy
**Session 1:** Survey of responsible AI frameworks (Asilomar Principles, EU AI Act, corporate policies). Students analyze strengths and weaknesses.

**Session 2:** Framework comparison activity. Students evaluate frameworks against specific scenarios. Discussion: What makes a good AI safety framework?

### Week 4: Design and Application
**Session 1:** Safety Scenarios analysis. Students work through complex safety dilemmas in small groups. Present and defend their analyses.

**Session 2:** Design Safety Features activity. Students create guardrail proposals for specific AI applications. Peer review and critique.

### Week 5: Personal Ethics Statement
**Session 1:** Guided reflection and drafting. Students develop their personal AI ethics statement. Peer feedback sessions.

**Session 2:** Ethics statement presentations. Class discussion on common themes and disagreements. Reflection on the module journey.

## Differentiation Strategies

### For Students Who Need More Support:
- Provide structured templates for ethics statements
- Use case studies with clear, age-appropriate examples
- Offer framework comparison charts to fill in
- Allow group rather than individual safety analysis

### For Advanced Learners:
- Read and analyze actual AI safety research papers
- Research and present on specific alignment approaches (RLHF, constitutional AI)
- Write a policy proposal for AI regulation
- Engage with the philosophical underpinnings of value alignment

## Important Notes
- Some students may feel anxious about AI safety risks - balance concern with empowerment
- Encourage nuanced thinking rather than alarmism or dismissiveness
- Connect to students' own values and experiences
- Emphasize that their engagement with these issues is itself part of the solution
`,
    },
    {
      id: "doc_level_4_module_2_rubric",
      moduleId: "level_4_module_2",
      levelId: 4,
      title: "Assessment Rubric: AI Safety, Alignment & Responsible Development",
      gradeBand: "9-12",
      documentType: "assessment_rubric",
      standardsAlignment: ["ISTE 1.2 Digital Citizen", "CSTA 3A-IC-25", "CSTA 3A-IC-26"],
      content: `# Assessment Rubric: AI Safety, Alignment & Responsible Development

## Module: AI Safety, Alignment & Responsible Development | Grade Band: 9-12

### Criteria 1: Safety Concept Understanding
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student demonstrates sophisticated understanding of alignment, robustness, corrigibility, and scalable oversight. Can analyze complex safety scenarios with nuance. Makes insightful connections between concepts. |
| **Meeting (3)** | Student correctly explains key safety concepts. Identifies safety challenges in given scenarios. Understands the alignment problem and its implications. |
| **Approaching (2)** | Student has surface understanding of safety concepts. Explanations lack depth or contain some inaccuracies. Struggles with complex scenarios. |
| **Beginning (1)** | Student cannot explain AI safety concepts. Does not understand the alignment problem or its significance. |

### Criteria 2: Framework Analysis
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student provides incisive analysis of multiple frameworks. Identifies gaps, contradictions, and enforcement challenges. Proposes improvements based on original thinking. Evaluation is well-supported. |
| **Meeting (3)** | Student compares frameworks effectively. Identifies strengths and weaknesses. Evaluates frameworks against specific scenarios. Analysis is thoughtful and accurate. |
| **Approaching (2)** | Student describes frameworks but comparison is superficial. Limited evaluation of strengths and weaknesses. Analysis lacks specificity. |
| **Beginning (1)** | Student cannot meaningfully analyze AI safety frameworks. Does not demonstrate understanding of regulatory approaches. |

### Criteria 3: Personal Ethics Statement
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Ethics statement is comprehensive, deeply personal, and intellectually rigorous. Reflects genuine engagement with the complexity of AI safety. Addresses multiple dimensions with nuance. Could serve as a model for others. |
| **Meeting (3)** | Ethics statement addresses all required elements. Reflects personal values and understanding of AI safety concepts. Shows evidence of thoughtful reflection. Is specific and actionable. |
| **Approaching (2)** | Ethics statement is generic or incomplete. May cover some elements but lacks depth or personal connection. Values are stated without supporting reasoning. |
| **Beginning (1)** | Ethics statement is missing or does not meaningfully engage with AI safety concepts. No evidence of personal reflection or value development. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },

    // ============================================================
    // LEVEL 4 MODULE 3: Entrepreneurship & AI Innovation (9-12)
    // ============================================================
    {
      id: "doc_level_4_module_3_guide",
      moduleId: "level_4_module_3",
      levelId: 4,
      title: "Student Guide: Entrepreneurship & AI Innovation",
      gradeBand: "9-12",
      documentType: "curriculum_guide",
      standardsAlignment: ["ISTE 1.4 Innovative Designer", "ISTE 1.6 Creative Communicator", "CSTA 3A-AP-13"],
      content: `# Entrepreneurship & AI Innovation - Your Student Guide

## From Idea to Impact

Every transformative company started with someone seeing a problem and building a solution. You now have both the AI skills and the ethical foundation to do exactly that. This module is about turning your knowledge into action through entrepreneurial thinking.

## Identifying Market Opportunities

The best AI businesses solve real problems for real people. To find opportunities:

### Listen and Observe
- What do people complain about repeatedly?
- What tasks take way too long?
- Where do existing solutions fall short?
- What would people pay to have done better, faster, or cheaper?

### The Problem-Solution Fit
Not every problem needs an AI solution. Good entrepreneurs ask:
- Is this problem painful enough that people want it solved?
- Can AI meaningfully improve the current situation?
- Is the technology mature enough to deliver?
- Can I build a sustainable business around this solution?

## Building a Business Model

### The Business Model Canvas
A business model canvas helps you think through every aspect of your venture:

1. **Value Proposition:** What unique value do you provide?
2. **Customer Segments:** Who are your customers?
3. **Channels:** How do you reach customers?
4. **Revenue Streams:** How do you make money?
5. **Key Resources:** What do you need to build this?
6. **Key Activities:** What must you do every day?
7. **Key Partners:** Who else do you need?
8. **Cost Structure:** What does it cost to operate?
9. **Customer Relationships:** How do you keep customers happy?

## Key Vocabulary

- **Entrepreneur:** Someone who creates a business to solve a problem
- **Value proposition:** The unique benefit your product provides to customers
- **Market research:** Studying potential customers and competitors
- **Minimum viable product (MVP):** The simplest version of your product that still delivers value
- **Pitch deck:** A presentation designed to convince investors to fund your idea
- **Competitive advantage:** What makes your solution better than alternatives

## Activities

### Activity 1: Problem-Solution Fit Interview
Interview 5 people about their daily frustrations. Ask:
- What is the most annoying part of your day?
- What task do you wish technology could do for you?
- What would you pay $10/month to have solved?

Document patterns and identify the most promising opportunities.

### Activity 2: Competitive Analysis
Choose an AI startup or product. Map:
- What problem does it solve?
- Who are its competitors?
- What is its competitive advantage?
- Where are the gaps it has not filled?

### Activity 3: Business Model Canvas
Complete a full Business Model Canvas for your AI venture idea. Be specific:
- Name your customers with demographics
- Price your product with justification
- List your costs realistically
- Identify your competitive moat

### Activity 4: Pitch Development
Create a 5-minute investor pitch covering:
1. The problem (make them feel it)
2. Your solution (show how it works)
3. Market opportunity (size and growth)
4. Business model (how you make money)
5. Team and timeline (why you and why now)

## Ethics in AI Entrepreneurship

As an AI entrepreneur, you have additional responsibilities:
- **Data privacy:** How will you protect user data?
- **Bias mitigation:** How will you ensure fairness?
- **Transparency:** Will users know AI is making decisions?
- **Accessibility:** Can everyone benefit from your solution?
- **Environmental impact:** What is your product's carbon footprint?

Building a profitable business AND doing the right thing is not a contradiction - it is a competitive advantage.

## Remember!

You do not need to be an adult to think like an entrepreneur. The skills you are developing - identifying problems, designing solutions, communicating value, and thinking ethically - will serve you whether you start a company, work for one, or pursue any other path. The entrepreneurial mindset is about creating value in the world.

## Check Your Understanding

1. What makes a good AI business opportunity?
2. Name 5 components of the Business Model Canvas and explain each.
3. Why is the MVP approach important?
4. How should ethical considerations shape AI entrepreneurship?
`,
    },
    {
      id: "doc_level_4_module_3_lesson",
      moduleId: "level_4_module_3",
      levelId: 4,
      title: "Teacher Guide: Entrepreneurship & AI Innovation",
      gradeBand: "9-12",
      documentType: "lesson_plan",
      standardsAlignment: ["ISTE 1.4 Innovative Designer", "ISTE 1.6 Creative Communicator", "CSTA 3A-AP-13", "CCSS.ELA-LITERACY.SL.11-12.4"],
      content: `# Teacher Implementation Guide: Entrepreneurship & AI Innovation

## Module Overview
Students develop entrepreneurial skills by identifying market opportunities for AI solutions, building business models, conducting competitive analysis, and creating investor-ready pitches.

## Learning Objectives
1. Identify market opportunities for AI solutions
2. Develop business models for AI products
3. Create investor pitches and business plans
4. Apply ethical thinking to AI entrepreneurship

## Session Structure (5 weeks, 2 sessions/week, 60 min each)

### Week 1: Opportunity Identification
**Session 1:** Entrepreneurial mindset introduction. Problem-finding exercises. Interview techniques for market research.

**Session 2:** Students conduct Problem-Solution Fit interviews (can be done as homework). Share findings and identify patterns. Class discussion of most promising opportunities.

### Week 2: Competitive Landscape
**Session 1:** Competitive analysis methodology. Demo with a well-known AI company. Students begin their own competitive analysis.

**Session 2:** Students present competitive analyses. Identify market gaps and opportunities. Begin selecting their venture idea.

### Week 3: Business Model Development
**Session 1:** Business Model Canvas introduction and walkthrough. Students draft their canvas for their selected idea.

**Session 2:** Peer review of business models. Expert feedback if available (invite local entrepreneur or virtual speaker). Refine canvas based on feedback.

### Week 4: Pitch Development
**Session 1:** Pitch structure and storytelling. Video examples of great pitches. Students begin developing their pitch decks.

**Session 2:** Pitch workshop. Practice and peer feedback. Focus on clarity, compelling narrative, and realistic projections.

### Week 5: Pitch Day and Ethics
**Session 1:** Ethics in AI entrepreneurship discussion. How to build responsible AI businesses. Students add ethics considerations to their pitches.

**Session 2:** Final Pitch Day! Students present to a panel (teachers, other students, invited guests). Q&A session. Awards for Best Problem, Best Solution, Best Pitch, and Most Ethical Approach.

## Differentiation Strategies

### For Students Who Need More Support:
- Provide Business Model Canvas templates with examples
- Offer pitch structure outlines with sentence starters
- Allow team-based ventures (2-3 students)
- Simplify financial projections to basic estimates

### For Advanced Learners:
- Create detailed financial projections
- Research and present on AI startup funding ecosystem
- Develop a prototype or mockup of their product
- Write a full business plan in addition to the pitch

## Assessment Ideas

### Formative:
- Interview documentation quality
- Competitive analysis thoroughness
- Business Model Canvas completeness

### Summative:
- Final pitch presentation (content, delivery, Q&A)
- Business Model Canvas with justifications
- Written reflection on the entrepreneurial journey
- Ethics integration in business plan
`,
    },
    {
      id: "doc_level_4_module_3_rubric",
      moduleId: "level_4_module_3",
      levelId: 4,
      title: "Assessment Rubric: Entrepreneurship & AI Innovation",
      gradeBand: "9-12",
      documentType: "assessment_rubric",
      standardsAlignment: ["ISTE 1.4 Innovative Designer", "CSTA 3A-AP-13"],
      content: `# Assessment Rubric: Entrepreneurship & AI Innovation

## Module: Entrepreneurship & AI Innovation | Grade Band: 9-12

### Criteria 1: Opportunity Identification and Market Research
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student identifies a compelling, validated market opportunity through thorough research. Interview data clearly supports the problem's significance. Demonstrates deep understanding of target customers. |
| **Meeting (3)** | Student identifies a real market opportunity with supporting research. Conducted interviews and competitive analysis. Problem and audience are clearly defined. |
| **Approaching (2)** | Student identifies a potential opportunity but research is limited. Audience or problem definition is vague. Competitive landscape is poorly understood. |
| **Beginning (1)** | Student does not identify a viable opportunity. No meaningful research conducted. Problem is not validated or clearly defined. |

### Criteria 2: Business Model Quality
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Business Model Canvas is comprehensive, realistic, and demonstrates sophisticated business thinking. All 9 components are well-developed with clear justifications. Financial projections are thoughtful. |
| **Meeting (3)** | Business Model Canvas covers all components with reasonable detail. Revenue model and cost structure are realistic. Value proposition is clear and connected to customer needs. |
| **Approaching (2)** | Business Model Canvas is incomplete or unrealistic. Some components are underdeveloped. Value proposition or revenue model lacks clarity. |
| **Beginning (1)** | Business Model Canvas is missing or fundamentally flawed. Does not demonstrate understanding of business model components. |

### Criteria 3: Pitch and Communication
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Pitch is compelling, well-structured, and professionally delivered. Storytelling engages the audience. Handles Q&A with confidence and insight. Visual aids are polished and effective. |
| **Meeting (3)** | Pitch covers all required elements clearly. Delivery is confident. Responds to questions adequately. Visual aids support the presentation. |
| **Approaching (2)** | Pitch is disorganized or missing key elements. Delivery is uncertain. Struggles with Q&A. Visual aids are basic or distracting. |
| **Beginning (1)** | Pitch is incomplete or not delivered. Cannot communicate the business idea effectively. No visual aids or preparation evident. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },

    // ============================================================
    // LEVEL 4 MODULE 4: Social Impact Innovation Studio (9-12)
    // ============================================================
    {
      id: "doc_level_4_module_4_guide",
      moduleId: "level_4_module_4",
      levelId: 4,
      title: "Student Guide: Social Impact Innovation Studio",
      gradeBand: "9-12",
      documentType: "curriculum_guide",
      standardsAlignment: ["ISTE 1.4 Innovative Designer", "ISTE 1.2 Digital Citizen", "CSTA 3A-IC-24", "CASEL SEL Social Awareness"],
      content: `# Social Impact Innovation Studio - Your Student Guide

## AI for Good

This is where everything comes together. You have the technical skills, the ethical framework, and the entrepreneurial mindset. Now the question is: How will you use all of that to make the world better?

## Choosing Your Challenge

The world faces massive challenges that AI could help address:

### Education Equity
- 258 million children worldwide do not attend school
- Learning gaps widened during the pandemic
- Quality education is unevenly distributed
- AI could personalize learning and increase access

### Healthcare Access
- 50% of the world's population lacks access to essential health services
- Rural and underserved communities face provider shortages
- Mental health services are overwhelmed
- AI could expand diagnostic and treatment capabilities

### Environmental Sustainability
- Climate change threatens ecosystems and communities worldwide
- Resource consumption exceeds sustainable levels
- Monitoring environmental changes requires massive data processing
- AI could optimize energy use and predict environmental risks

### Social Justice
- Algorithmic bias perpetuates existing inequalities
- Access to legal representation is unequal
- Misinformation undermines democratic processes
- AI tools could be designed to promote rather than undermine equity

## The Social Impact Design Process

### Phase 1: Understand
- Research the challenge deeply
- Interview people affected by the problem
- Understand existing solutions and their limitations
- Identify root causes, not just symptoms

### Phase 2: Define
- Narrow your focus to a specific, actionable problem
- Define success metrics: How will you know your solution works?
- Identify stakeholders: Who is affected? Who has power to change things?
- Set realistic scope: What can you accomplish?

### Phase 3: Ideate and Build
- Brainstorm multiple approaches
- Select the most promising idea
- Build a minimum viable product
- Test with real users from the affected community

### Phase 4: Measure and Iterate
- Collect outcome data
- Compare results to your success metrics
- Gather qualitative feedback from users
- Improve based on evidence

## Key Vocabulary

- **Social impact:** The effect an action has on the wellbeing of a community
- **Stakeholder:** Anyone who is affected by or has influence over your project
- **Root cause:** The underlying reason a problem exists (vs. surface symptoms)
- **Theory of change:** Your hypothesis about how your intervention creates impact
- **Impact measurement:** Quantifying the positive change your solution creates
- **Community-centered design:** Designing solutions WITH affected communities, not FOR them

## Activities

### Activity 1: Challenge Selection
Research three global or local challenges. For each, answer:
- Who is most affected?
- What existing solutions exist?
- Where are the gaps?
- How could AI help fill those gaps?

### Activity 2: Stakeholder Interviews
Talk to at least 3 people connected to your chosen challenge. Learn from their experiences. Listen more than you talk. Document insights that surprise you.

### Activity 3: Rapid Prototyping
Build a minimum viable product in 2 weeks. Focus on:
- The core functionality only
- Something testable with real users
- Quick iteration based on feedback
- Documentation of your process

### Activity 4: Impact Measurement
Design an impact measurement plan:
- What outcomes will you track?
- How will you collect data?
- What is your baseline (starting point)?
- How will you attribute change to your intervention vs. other factors?

## Remember!

The world's biggest challenges need people who combine technical skill with deep empathy. That is exactly what you are becoming. Your AI projects may start small, but the skills and mindset you are developing can scale. Start where you are, use what you have, and do what you can. That is how every great movement begins.

## Check Your Understanding

1. What makes a challenge well-suited for an AI-based solution?
2. Why is it important to interview stakeholders before building solutions?
3. What is community-centered design and why does it matter?
4. How do you measure the impact of a social innovation project?
`,
    },
    {
      id: "doc_level_4_module_4_lesson",
      moduleId: "level_4_module_4",
      levelId: 4,
      title: "Teacher Guide: Social Impact Innovation Studio",
      gradeBand: "9-12",
      documentType: "lesson_plan",
      standardsAlignment: ["ISTE 1.4 Innovative Designer", "ISTE 1.2 Digital Citizen", "CSTA 3A-IC-24", "CASEL SEL Social Awareness"],
      content: `# Teacher Implementation Guide: Social Impact Innovation Studio

## Module Overview
This capstone module for Level 4 challenges students to apply AI to social problems through a structured design thinking process. Students work in teams on complex projects, engage with community stakeholders, and measure impact.

## Learning Objectives
1. Apply AI to solving social problems through design thinking
2. Work in teams on complex, multi-week projects
3. Engage with community stakeholders authentically
4. Measure and communicate impact effectively

## Session Structure (5 weeks, 2 sessions/week, 60 min each)

### Week 1: Challenge Selection and Research
**Session 1:** Overview of global challenges where AI could help. Students explore options and begin research. Form teams based on shared interests.

**Session 2:** Deep research phase. Teams investigate their chosen challenge. Identify affected populations, existing solutions, and gaps.

### Week 2: Stakeholder Engagement
**Session 1:** Interview preparation. Teach empathetic interviewing techniques. Teams develop interview protocols. Practice in pairs.

**Session 2:** Stakeholder interviews (in-class or virtual). Teams interview people connected to their challenge. Document insights using structured notes.

### Week 3: Design and Build
**Session 1:** Ideation session. Teams brainstorm solutions. Evaluate feasibility and potential impact. Select their approach and define MVP.

**Session 2:** Build session 1. Teams begin developing their MVP. Check-ins with teacher for guidance. Peer feedback on designs.

### Week 4: Build and Test
**Session 1:** Build session 2. Continued development. Mid-point review with class.

**Session 2:** User testing. Teams test their MVP with target users (could be peers, community members, or stakeholders). Collect structured feedback.

### Week 5: Measure, Present, and Reflect
**Session 1:** Impact measurement and iteration. Teams analyze feedback, make improvements, and design impact measurement plans.

**Session 2:** Innovation Showcase. Teams present their projects to a broader audience (other classes, parents, community members). Celebrate achievements. Reflection on the entire Level 4 journey.

## Differentiation Strategies

### For Students Who Need More Support:
- Provide research guide with curated sources
- Offer structured project management templates
- Assign specific team roles to leverage individual strengths
- Simplify MVP scope while maintaining meaningful engagement

### For Advanced Learners:
- Connect with actual community organizations working on their challenge
- Develop deployment plans beyond the classroom
- Create detailed impact measurement frameworks
- Write a formal project report suitable for publication

## Assessment Ideas

### Formative:
- Research depth and quality
- Stakeholder interview preparation and execution
- MVP development progress
- Team collaboration and role fulfillment

### Summative:
- Final presentation to external audience
- Working MVP with documentation
- Impact measurement plan
- Individual reflection on the design process and personal growth
- Team evaluation (self and peer assessment)
`,
    },
    {
      id: "doc_level_4_module_4_rubric",
      moduleId: "level_4_module_4",
      levelId: 4,
      title: "Assessment Rubric: Social Impact Innovation Studio",
      gradeBand: "9-12",
      documentType: "assessment_rubric",
      standardsAlignment: ["ISTE 1.4 Innovative Designer", "CSTA 3A-IC-24", "CASEL SEL Social Awareness"],
      content: `# Assessment Rubric: Social Impact Innovation Studio

## Module: Social Impact Innovation Studio | Grade Band: 9-12

### Criteria 1: Problem Understanding and Research
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Team demonstrates deep, nuanced understanding of their social challenge. Research is thorough, multi-perspective, and evidence-based. Stakeholder engagement reveals genuine insights. Root causes are clearly identified. |
| **Meeting (3)** | Team understands their chosen challenge well. Research covers multiple sources and perspectives. Stakeholder interviews conducted and documented. Problem is clearly defined with context. |
| **Approaching (2)** | Team has surface understanding of the challenge. Research is limited in scope or depth. Stakeholder engagement is minimal or formulaic. Problem definition lacks specificity. |
| **Beginning (1)** | Team does not demonstrate meaningful understanding of the social challenge. Research is insufficient. No stakeholder engagement. Problem is poorly defined. |

### Criteria 2: Solution Design and Execution
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | MVP is functional, innovative, and directly addresses the identified problem. AI is applied appropriately and effectively. Design reflects community input. Multiple iterations show significant improvement. |
| **Meeting (3)** | MVP is functional and addresses the problem. AI application is appropriate. Design process is documented. At least one iteration based on user feedback. |
| **Approaching (2)** | MVP is partially functional or loosely connected to the problem. AI application may be superficial. Limited evidence of design process or iteration. |
| **Beginning (1)** | No functional MVP produced. AI is not meaningfully applied. Design process not followed. |

### Criteria 3: Impact Measurement and Communication
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Impact measurement plan is rigorous and realistic. Presentation is compelling and professional. Team can articulate theory of change, evidence of impact, and future plans. Engages audience effectively. |
| **Meeting (3)** | Impact measurement plan covers key outcomes. Presentation clearly communicates the problem, solution, and potential impact. Team responds to questions adequately. |
| **Approaching (2)** | Impact measurement is vague or incomplete. Presentation covers basics but lacks clarity or depth. Team struggles with Q&A. |
| **Beginning (1)** | No impact measurement plan. Presentation is not delivered or does not communicate the project effectively. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },

    // ============================================================
    // LEVEL 5 MODULE 1: AI Educator Pathway (Grade Band 9-12)
    // ============================================================
    {
      id: "doc_level_5_module_1_guide",
      moduleId: "level_5_module_1",
      levelId: 5,
      title: "Student Guide: AI Educator Pathway",
      gradeBand: "9-12",
      documentType: "curriculum_guide",
      standardsAlignment: ["ISTE 1.6 Creative Communicator", "ISTE 1.1 Empowered Learner", "ISTE 6.1 Facilitator"],
      content: `# AI Educator Pathway - Your Student Guide

## The Ultimate Test of Mastery: Teaching Others

There is an old saying: "If you cannot explain it simply, you do not understand it well enough." Teaching is not just sharing what you know - it is the deepest form of learning. By becoming an AI educator, you will solidify your own understanding while empowering the next generation.

## The Pedagogy of AI Education

Teaching AI to younger students requires different approaches than how you learned:

### For Grades K-2:
- Use stories and characters (AI as a friendly helper)
- Focus on concrete, tangible examples
- Keep sessions to 10-15 minutes
- Use physical activities and movement
- Avoid abstract concepts - keep it playful

### For Grades 3-5:
- Use analogies they can relate to (AI as a smart pet, a helpful robot)
- Introduce vocabulary gradually
- Sessions can be 20-30 minutes
- Include hands-on activities and games
- Connect to things they already know

### For Grades 6-8:
- Be honest about complexity
- Use real-world examples from their lives
- Sessions can be 30-45 minutes
- Encourage questions and discussion
- Challenge them to think critically

## Curriculum Development

Creating effective lessons involves:

### 1. Learning Objectives
What should students know or be able to do after your lesson? Write clear, measurable objectives.

### 2. Engagement Hook
How will you grab their attention in the first 2 minutes? Use a story, a demo, a question, or a surprising fact.

### 3. Core Content
What are the 2-3 key concepts? Keep it focused. It is better to teach a few things well than many things superficially.

### 4. Activity
How will students practice or apply what they learned? Active learning beats passive listening every time.

### 5. Assessment
How will you know students learned? Use informal checks throughout, not just a quiz at the end.

## Key Vocabulary

- **Pedagogy:** The art and science of teaching
- **Scaffolding:** Breaking complex concepts into smaller, manageable steps
- **Differentiation:** Adapting teaching to meet different students' needs
- **Formative assessment:** Checking understanding during the lesson, not just at the end
- **Learning objective:** A clear statement of what students will be able to do after instruction
- **Engagement:** Capturing and maintaining students' attention and interest

## Activities

### Activity 1: Pedagogy Training
Practice teaching AI concepts to different age groups. Observe how your approach needs to change. Record yourself and review for improvement.

### Activity 2: Curriculum Development
Create a complete lesson plan for teaching one AI concept to a younger audience. Include all 5 elements (objectives, hook, content, activity, assessment).

### Activity 3: Teaching Practicum
Lead a supervised teaching session with younger students. Observe reactions, adjust in real-time, and reflect afterward.

### Activity 4: Content Creation
Develop supplementary materials: a tutorial video, a study guide, or an interactive activity that could be used alongside your lesson.

## Remember!

Teaching is one of the most impactful things a person can do. When you teach a child about AI, you are shaping how they will interact with technology for the rest of their lives. That is an enormous responsibility and a beautiful privilege. You have earned the right to be here.

## Check Your Understanding

1. How should teaching AI to a 6-year-old differ from teaching a 12-year-old?
2. What are the five elements of an effective lesson?
3. Why is "active learning" more effective than just lecturing?
4. What is scaffolding and why is it important?
`,
    },
    {
      id: "doc_level_5_module_1_lesson",
      moduleId: "level_5_module_1",
      levelId: 5,
      title: "Teacher Guide: AI Educator Pathway",
      gradeBand: "9-12",
      documentType: "lesson_plan",
      standardsAlignment: ["ISTE 1.6 Creative Communicator", "ISTE 1.1 Empowered Learner", "ISTE 6.1 Facilitator", "CASEL SEL Relationship Skills"],
      content: `# Teacher Implementation Guide: AI Educator Pathway

## Module Overview
Students become certified peer educators by mastering pedagogical skills, developing curriculum for younger students, and leading supervised teaching sessions.

## Learning Objectives
1. Master pedagogical skills for teaching AI concepts
2. Create lessons appropriate for younger students
3. Lead supervised teaching sessions
4. Develop educational content (tutorials, videos, guides)

## Session Structure (12 weeks, 2 sessions/week, 60 min each)

### Weeks 1-3: Pedagogy Foundation
- Age-appropriate teaching strategies for K-2, 3-5, 6-8
- Lesson planning fundamentals
- Engagement and assessment techniques
- Observation of experienced teachers

### Weeks 4-6: Curriculum Development
- Students create original lesson plans
- Peer review and revision cycles
- Develop supporting materials
- Practice presentations to peers

### Weeks 7-9: Teaching Practicum
- Supervised teaching with younger students
- Post-session reflections and debriefs
- Iterative improvement of teaching approach
- Video recording and self-review

### Weeks 10-12: Content Creation and Certification
- Develop tutorials, videos, or guides
- Final portfolio assembly
- Certification presentations
- Celebration of achievements

## Differentiation Strategies

### For Students Who Need More Support:
- Provide detailed lesson plan templates
- Offer co-teaching opportunities before solo sessions
- Pair with experienced peer educators
- Start with smaller teaching groups

### For Advanced Learners:
- Develop multi-session curriculum series
- Mentor other student educators
- Create professional-quality video content
- Design assessment tools for measuring student learning

## Assessment: Portfolio including lesson plans, teaching reflections, student feedback, and educational content created.
`,
    },
    {
      id: "doc_level_5_module_1_rubric",
      moduleId: "level_5_module_1",
      levelId: 5,
      title: "Assessment Rubric: AI Educator Pathway",
      gradeBand: "9-12",
      documentType: "assessment_rubric",
      standardsAlignment: ["ISTE 6.1 Facilitator", "ISTE 1.6 Creative Communicator"],
      content: `# Assessment Rubric: AI Educator Pathway

## Module: AI Educator Pathway | Grade Band: 9-12

### Criteria 1: Lesson Design
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Lessons are creative, well-structured, and age-appropriate. Objectives are clear and measurable. Activities are engaging and effective. Assessment is integrated throughout. Materials are professional quality. |
| **Meeting (3)** | Lessons include all required elements. Content is age-appropriate. Activities support learning objectives. Assessment checks for understanding. |
| **Approaching (2)** | Lessons have some required elements but may be missing components. Age-appropriateness may be inconsistent. Activities loosely connected to objectives. |
| **Beginning (1)** | Lessons are incomplete or inappropriate for the target age group. Missing key elements. Activities do not support learning. |

### Criteria 2: Teaching Effectiveness
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Teaching is engaging, responsive, and effective. Students demonstrate clear learning. Adapts in real-time to student needs. Creates a positive, inclusive learning environment. |
| **Meeting (3)** | Teaching effectively communicates key concepts. Students are engaged. Responds to questions appropriately. Maintains a supportive learning environment. |
| **Approaching (2)** | Teaching communicates some concepts but may struggle with engagement or clarity. Limited responsiveness to student needs. |
| **Beginning (1)** | Teaching is ineffective. Students do not learn or engage. Cannot manage the teaching environment. |

### Criteria 3: Professional Growth
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student demonstrates significant growth as an educator. Reflections are insightful. Actively seeks and incorporates feedback. Portfolio showcases professional-quality work. |
| **Meeting (3)** | Student shows growth over the practicum. Reflections identify strengths and areas for improvement. Incorporates feedback. Portfolio is complete and organized. |
| **Approaching (2)** | Limited evidence of growth. Reflections are surface-level. Inconsistent incorporation of feedback. Portfolio is incomplete. |
| **Beginning (1)** | No evidence of growth. No meaningful reflection. Feedback not incorporated. Portfolio missing or minimal. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },

    // ============================================================
    // LEVEL 5 MODULE 2: AI Research Pathway (Grade Band 9-12)
    // ============================================================
    {
      id: "doc_level_5_module_2_guide",
      moduleId: "level_5_module_2",
      levelId: 5,
      title: "Student Guide: AI Research Pathway",
      gradeBand: "9-12",
      documentType: "curriculum_guide",
      standardsAlignment: ["ISTE 1.3 Knowledge Constructor", "ISTE 1.5 Computational Thinker", "CSTA 3A-DA-09"],
      content: `# AI Research Pathway - Your Student Guide

## Pushing the Boundaries of Knowledge

Research is how humanity advances. Every breakthrough in AI started with someone asking a question nobody had answered yet. In this pathway, you will conduct your own original research, contributing to our collective understanding of AI and its impact.

## The Research Process

### 1. Literature Review
Before you can ask new questions, you need to know what questions have already been answered:
- Search academic databases for existing research on your topic
- Read and summarize key papers
- Identify gaps in the existing knowledge
- Formulate your research question based on those gaps

### 2. Research Question
A good research question is:
- **Specific:** Not "Is AI good?" but "How does AI-generated feedback affect 8th-grade writing quality compared to peer feedback?"
- **Measurable:** You can collect data to answer it
- **Original:** It has not been definitively answered
- **Feasible:** You can actually conduct this research with your resources

### 3. Methodology
How will you answer your question? Common approaches:
- **Survey research:** Collect opinions and experiences from many people
- **Experimental:** Test a hypothesis by comparing groups
- **Case study:** Deep investigation of a specific example
- **Content analysis:** Systematically analyze texts, images, or other media
- **Mixed methods:** Combine quantitative data and qualitative interviews

### 4. Data Collection
Gather your data ethically and systematically:
- Get proper permissions (parental consent, school approval)
- Use consistent methods across all participants
- Record everything carefully
- Protect participant privacy

### 5. Analysis and Writing
Transform your data into knowledge:
- Organize and clean your data
- Look for patterns, trends, and surprises
- Draw conclusions supported by evidence
- Write clearly, accurately, and honestly

## Key Vocabulary

- **Literature review:** A summary of existing research on a topic
- **Hypothesis:** A testable prediction about what you expect to find
- **Methodology:** The approach and procedures used to conduct research
- **Quantitative data:** Numerical data that can be measured and counted
- **Qualitative data:** Descriptive data from interviews, observations, or open-ended responses
- **Peer review:** Having other researchers evaluate your work for quality and accuracy

## Activities

### Activity 1: Literature Review
Choose a topic related to AI in education, society, or ethics. Find and summarize 5 academic or credible sources. Identify a gap in the research.

### Activity 2: Research Design
Develop a complete research plan including:
- Research question
- Hypothesis
- Methodology
- Data collection procedures
- Timeline

### Activity 3: Data Collection and Analysis
Execute your research plan. Collect data, analyze it, and document your findings.

### Activity 4: Academic Writing
Write a formal research paper including: abstract, introduction, literature review, methodology, results, discussion, and conclusion.

## Remember!

Original research is among the most demanding academic work you can do. It requires patience, precision, and intellectual honesty. When you conduct research, you are not just completing a school project - you are contributing to human knowledge. Your findings, no matter how small, add to our understanding of the world.

## Check Your Understanding

1. What makes a good research question?
2. What are three different research methodologies?
3. Why is a literature review important before starting research?
4. What does intellectual honesty mean in research?
`,
    },
    {
      id: "doc_level_5_module_2_lesson",
      moduleId: "level_5_module_2",
      levelId: 5,
      title: "Teacher Guide: AI Research Pathway",
      gradeBand: "9-12",
      documentType: "lesson_plan",
      standardsAlignment: ["ISTE 1.3 Knowledge Constructor", "ISTE 1.5 Computational Thinker", "CSTA 3A-DA-09", "CCSS.ELA-LITERACY.W.11-12.7"],
      content: `# Teacher Implementation Guide: AI Research Pathway

## Module Overview
Students conduct independent research on AI applications or impacts, learning the full research process from literature review through academic writing.

## Learning Objectives
1. Conduct original research on AI applications or impacts
2. Develop research methodology and protocol
3. Collect and analyze data ethically
4. Produce a publication-ready research paper

## Session Structure (12 weeks, 2 sessions/week, 60 min each)

### Weeks 1-3: Research Foundation
- Literature review methodology
- Research question development
- Research ethics and IRB concepts
- Methodology selection

### Weeks 4-6: Research Design
- Develop research protocols
- Create data collection instruments
- Pilot testing
- Peer review of research designs

### Weeks 7-9: Data Collection and Analysis
- Execute research plans with mentorship
- Data cleaning and organization
- Quantitative and/or qualitative analysis
- Address challenges and pivot if needed

### Weeks 10-12: Writing and Presentation
- Academic writing instruction
- Drafting and revision cycles
- Peer review process
- Research symposium presentation

## Differentiation Strategies

### For Students Who Need More Support:
- Provide research question banks to choose from
- Offer structured literature review templates
- Simplify methodology to survey or interview-based
- Provide writing scaffolds for each paper section

### For Advanced Learners:
- Encourage mixed-methods approaches
- Connect with university researchers for mentorship
- Submit to student research competitions
- Develop multiple related studies

## Assessment: Research paper evaluated for question quality, methodology rigor, analysis accuracy, and writing clarity. Presentation evaluated for communication effectiveness and response to questions.
`,
    },
    {
      id: "doc_level_5_module_2_rubric",
      moduleId: "level_5_module_2",
      levelId: 5,
      title: "Assessment Rubric: AI Research Pathway",
      gradeBand: "9-12",
      documentType: "assessment_rubric",
      standardsAlignment: ["ISTE 1.3 Knowledge Constructor", "CSTA 3A-DA-09"],
      content: `# Assessment Rubric: AI Research Pathway

## Module: AI Research Pathway | Grade Band: 9-12

### Criteria 1: Research Question and Literature Review
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Research question is original, specific, and significant. Literature review is comprehensive (8+ quality sources), well-synthesized, and clearly identifies the gap the research addresses. |
| **Meeting (3)** | Research question is clear, specific, and researchable. Literature review covers 5+ relevant sources and identifies the research gap. Summary and synthesis are competent. |
| **Approaching (2)** | Research question is vague or too broad. Literature review includes fewer than 5 sources or sources are not well-connected to the research question. |
| **Beginning (1)** | Research question is missing or not researchable. Literature review is absent or includes irrelevant/low-quality sources. |

### Criteria 2: Methodology and Data
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Methodology is rigorous, well-justified, and appropriate for the research question. Data collection is thorough and ethical. Analysis is sophisticated and reveals meaningful patterns. |
| **Meeting (3)** | Methodology is appropriate and clearly described. Data collection follows the planned protocol. Analysis is competent and supports conclusions. Ethics are addressed. |
| **Approaching (2)** | Methodology has weaknesses or is poorly described. Data collection may be inconsistent. Analysis is basic or partially supports conclusions. |
| **Beginning (1)** | No coherent methodology. Data collection not executed or deeply flawed. Analysis absent or inaccurate. |

### Criteria 3: Academic Writing and Presentation
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Paper is publication-quality with clear argumentation, proper citations, and professional formatting. Presentation engages audience and demonstrates deep understanding. Responds to questions with expertise. |
| **Meeting (3)** | Paper includes all required sections. Writing is clear and well-organized. Citations are proper. Presentation communicates findings effectively. Handles basic questions. |
| **Approaching (2)** | Paper is missing sections or poorly organized. Writing lacks clarity. Citation practices are inconsistent. Presentation is basic. |
| **Beginning (1)** | Paper is incomplete or not submitted. Writing is unclear. No proper citations. Presentation not delivered or ineffective. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },

    // ============================================================
    // LEVEL 5 MODULE 3: AI Implementation Leadership (Grade Band 9-12)
    // ============================================================
    {
      id: "doc_level_5_module_3_guide",
      moduleId: "level_5_module_3",
      levelId: 5,
      title: "Student Guide: AI Implementation Leadership",
      gradeBand: "9-12",
      documentType: "curriculum_guide",
      standardsAlignment: ["ISTE 1.4 Innovative Designer", "ISTE 1.2 Digital Citizen", "CSTA 3A-IC-24"],
      content: `# AI Implementation Leadership - Your Student Guide

## Leading the AI Transformation

The biggest challenge with AI is not the technology itself - it is getting organizations and people to adopt it effectively and responsibly. Implementation leadership is about bridging the gap between what AI CAN do and what organizations actually DO with it.

## Organizational AI Readiness

Before implementing AI, organizations need assessment in several areas:

### Technical Readiness
- What technology infrastructure exists?
- What data is available and how clean is it?
- What technical skills does the staff have?
- What tools and platforms are accessible?

### Cultural Readiness
- How does the organization feel about change?
- What fears or misconceptions exist about AI?
- Who are the champions and who are the skeptics?
- What is the organization's history with technology adoption?

### Strategic Readiness
- Does AI align with organizational goals?
- What resources are available for implementation?
- What is the leadership's commitment level?
- What regulatory or compliance considerations exist?

## The Implementation Roadmap

### Phase 1: Assessment (Weeks 1-2)
Evaluate the organization's current state. Identify strengths, weaknesses, opportunities, and barriers. Document findings in a readiness report.

### Phase 2: Strategy (Weeks 3-4)
Design an implementation plan:
- Quick wins: What can be implemented immediately?
- Short-term goals: What can be achieved in 1-3 months?
- Long-term vision: Where should the organization be in 1-2 years?

### Phase 3: Pilot (Weeks 5-8)
Launch a small-scale pilot:
- Choose one area for initial implementation
- Train a small team
- Collect feedback and performance data
- Iterate based on results

### Phase 4: Scale and Sustain (Weeks 9-12)
Expand successful pilots:
- Document best practices
- Train additional staff
- Monitor ongoing performance
- Address emerging challenges

## Key Vocabulary

- **Change management:** The process of preparing and supporting people through organizational change
- **AI readiness:** An organization's preparedness to adopt AI technologies
- **Pilot program:** A small-scale test of a new approach before full implementation
- **Stakeholder buy-in:** Getting support and agreement from key decision-makers
- **KPIs (Key Performance Indicators):** Measurable values that demonstrate effectiveness
- **Scalability:** The ability to expand a solution from small-scale to large-scale

## Activities

### Activity 1: Organizational Assessment
Choose a real organization (your school, a local business, a nonprofit). Evaluate their AI readiness across all three dimensions. Present findings.

### Activity 2: Strategic Planning
Design an AI implementation roadmap for your chosen organization. Include timelines, milestones, resource needs, and risk mitigation.

### Activity 3: Change Management Simulation
Lead training and adoption activities. Practice addressing resistance, answering concerns, and building enthusiasm for AI adoption.

### Activity 4: Case Study Development
Document the entire implementation process as a case study. Include successes, failures, lessons learned, and recommendations.

## Remember!

Leadership is not about having all the answers. It is about asking the right questions, listening to the people affected, and guiding organizations through change with empathy and competence. Your combination of technical AI knowledge and human understanding makes you uniquely qualified to lead AI implementation.

## Check Your Understanding

1. What are the three dimensions of AI readiness?
2. What is the purpose of a pilot program?
3. Why is change management important when implementing AI?
4. How do you handle resistance to AI adoption?
`,
    },
    {
      id: "doc_level_5_module_3_lesson",
      moduleId: "level_5_module_3",
      levelId: 5,
      title: "Teacher Guide: AI Implementation Leadership",
      gradeBand: "9-12",
      documentType: "lesson_plan",
      standardsAlignment: ["ISTE 1.4 Innovative Designer", "ISTE 1.2 Digital Citizen", "CSTA 3A-IC-24", "CASEL SEL Relationship Skills"],
      content: `# Teacher Implementation Guide: AI Implementation Leadership

## Module Overview
Students lead real-world AI adoption projects by evaluating organizational readiness, creating strategic plans, conducting pilot programs, and managing change.

## Learning Objectives
1. Evaluate organizational AI readiness
2. Design AI implementation roadmaps
3. Lead training and adoption programs
4. Document processes through case study development

## Session Structure (12 weeks, 2 sessions/week, 60 min each)

### Weeks 1-3: Assessment Phase
- AI readiness framework introduction
- Site selection and initial assessment
- Stakeholder mapping and interviews
- Readiness report development

### Weeks 4-6: Strategy Phase
- Implementation roadmap development
- Resource planning and budgeting
- Risk assessment and mitigation
- Presentation to organization leadership

### Weeks 7-9: Pilot Phase
- Pilot program design and launch
- Training session development and delivery
- Data collection and monitoring
- Mid-point review and adjustment

### Weeks 10-12: Scale and Document
- Pilot evaluation and scaling recommendations
- Case study development
- Final presentations to all stakeholders
- Reflection and certification

## Differentiation Strategies

### For Students Who Need More Support:
- Provide assessment templates with guided questions
- Offer simplified roadmap frameworks
- Allow team-based projects with role specialization
- Provide mentorship from experienced implementers

### For Advanced Learners:
- Work with actual community organizations
- Develop comprehensive change management plans
- Create training curricula for organizational staff
- Write publishable case studies

## Assessment: Organizational assessment report, implementation roadmap, pilot results documentation, case study, and final presentation. Evaluated for thoroughness, practicality, leadership effectiveness, and documentation quality.
`,
    },
    {
      id: "doc_level_5_module_3_rubric",
      moduleId: "level_5_module_3",
      levelId: 5,
      title: "Assessment Rubric: AI Implementation Leadership",
      gradeBand: "9-12",
      documentType: "assessment_rubric",
      standardsAlignment: ["ISTE 1.4 Innovative Designer", "CSTA 3A-IC-24"],
      content: `# Assessment Rubric: AI Implementation Leadership

## Module: AI Implementation Leadership | Grade Band: 9-12

### Criteria 1: Assessment and Analysis
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Assessment is comprehensive, covering all three readiness dimensions with specific evidence. Identifies non-obvious challenges and opportunities. Stakeholder analysis is detailed and actionable. Report is professional quality. |
| **Meeting (3)** | Assessment covers all readiness dimensions with adequate detail. Key stakeholders are identified and analyzed. Report is well-organized and informative. |
| **Approaching (2)** | Assessment covers some dimensions but lacks depth or specificity. Stakeholder analysis is limited. Report needs significant improvement. |
| **Beginning (1)** | Assessment is superficial or incomplete. Critical dimensions are missing. No meaningful stakeholder analysis. |

### Criteria 2: Strategic Planning and Execution
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Implementation roadmap is detailed, realistic, and innovative. Milestones are well-defined. Risk mitigation is comprehensive. Pilot program demonstrates effective leadership and produces meaningful results. |
| **Meeting (3)** | Roadmap covers key phases with realistic timelines. Risk factors are identified. Pilot program is executed and documented. Results inform recommendations. |
| **Approaching (2)** | Roadmap lacks detail or realistic timelines. Limited risk analysis. Pilot is partially executed or poorly documented. |
| **Beginning (1)** | No coherent roadmap. Pilot not executed. No evidence of strategic planning. |

### Criteria 3: Leadership and Documentation
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student demonstrates outstanding leadership throughout the process. Case study is comprehensive, honest about challenges, and provides valuable insights for future implementers. Presentation is compelling. |
| **Meeting (3)** | Student shows effective leadership skills. Case study documents the process accurately. Presentation communicates key findings and recommendations clearly. |
| **Approaching (2)** | Leadership is inconsistent. Case study is incomplete or superficial. Presentation lacks clarity or depth. |
| **Beginning (1)** | No evidence of leadership. Case study missing or inadequate. Presentation not delivered or ineffective. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },

    // ============================================================
    // SUBJECT MODULES: ELA 3-5 Writing Workshop (Grade Band 3-5)
    // ============================================================
    {
      id: "doc_ela_3_5_module_1_guide",
      moduleId: "ela_3_5_module_1",
      levelId: 2,
      title: "Student Guide: Writing Workshop",
      gradeBand: "3-5",
      documentType: "curriculum_guide",
      standardsAlignment: ["CCSS.ELA-LITERACY.W.3.1", "CCSS.ELA-LITERACY.W.3.2", "CCSS.ELA-LITERACY.W.4.3", "CCSS.ELA-LITERACY.L.3.1"],
      content: `# Writing Workshop - Your Student Guide

## Welcome to the Author's Studio!

Every great book, every amazing article, every wonderful letter you have ever read was written by someone who once sat where you are sitting right now - learning to write! Writing is like a superpower. It lets you share your ideas, tell your stories, and make people feel things. And the best news? Anyone can get better at writing with practice!

## The Parts of a Great Paragraph

A paragraph is like a sandwich. It has three important parts:

### 1. The Topic Sentence (The Top Bun)
This is the first sentence. It tells your reader what the paragraph is going to be about.
- Example: "Dogs make the best pets for families."

### 2. Supporting Details (The Filling)
These are 3-4 sentences that give evidence, examples, or reasons that support your topic sentence.
- "Dogs are loyal and always happy to see you."
- "They can learn tricks and follow commands."
- "Playing with a dog gives families exercise and fun together."

### 3. The Closing Sentence (The Bottom Bun)
This wraps up your paragraph and reminds the reader of your main idea.
- "For all these reasons, a family dog brings love, fun, and togetherness to any home."

## Key Vocabulary

- **Topic sentence:** The sentence that tells what a paragraph is about
- **Supporting details:** Facts, examples, or reasons that back up the topic sentence
- **Closing sentence:** The last sentence that wraps up the paragraph
- **Descriptive writing:** Writing that uses sensory details to paint a picture with words
- **Sensory details:** Descriptions using the five senses (sight, sound, smell, taste, touch)
- **Revision:** Reading your writing again and making it better

## Sensory Details: Writing with Your Five Senses

Great writers help readers SEE, HEAR, SMELL, TASTE, and FEEL what they are describing.

**Instead of:** "The kitchen smelled good."
**Try:** "The warm, sweet smell of chocolate chip cookies filled the kitchen, making my stomach growl with excitement."

**Instead of:** "It was cold outside."
**Try:** "The icy wind bit my cheeks and made my fingers tingle inside my gloves."

## Fun Activities

### Activity 1: Paragraph Building Blocks
Write a paragraph about your favorite food using the sandwich structure:
1. Start with a topic sentence
2. Add 3 supporting details (use your senses!)
3. End with a closing sentence

### Activity 2: Descriptive Writing Challenge
Close your eyes and imagine your favorite place. Now describe it using ALL five senses. What do you see? Hear? Smell? Feel? Taste?

### Activity 3: Peer Review Practice
Trade paragraphs with a partner. Read their work and answer:
- What is the main idea?
- Which detail is the most interesting?
- What could be added to make it even better?

### Activity 4: Personal Narrative Draft
Write about a time something surprising happened to you. Include:
- Where and when it happened
- What you saw, heard, and felt
- Why it was surprising
- How it ended

## Tips for Better Writing

1. **Read your writing out loud** - If it sounds weird, fix it!
2. **Use specific words** - Instead of "nice," try "kind," "gentle," "friendly," or "thoughtful"
3. **Show, do not tell** - Instead of "I was scared," try "My heart pounded and my hands trembled"
4. **Take breaks** - Walk away from your writing and come back later with fresh eyes
5. **Celebrate your progress** - Every draft is better than a blank page!

## Remember!

You are a writer! Even if you are just starting out, every word you write makes you stronger. Do not worry about being perfect - focus on being YOU. Your voice, your stories, and your ideas are worth sharing with the world. Keep writing!

## Check Your Understanding

1. What are the three parts of a paragraph sandwich?
2. Give an example of a sensory detail for the sense of hearing.
3. What is the difference between "telling" and "showing" in writing?
4. Why is peer review helpful?
`,
    },
    {
      id: "doc_ela_3_5_module_1_lesson",
      moduleId: "ela_3_5_module_1",
      levelId: 2,
      title: "Teacher Guide: Writing Workshop",
      gradeBand: "3-5",
      documentType: "lesson_plan",
      standardsAlignment: ["CCSS.ELA-LITERACY.W.3.1", "CCSS.ELA-LITERACY.W.3.2", "CCSS.ELA-LITERACY.W.4.3", "CCSS.ELA-LITERACY.L.3.1"],
      content: `# Teacher Implementation Guide: Writing Workshop

## Module Overview
Students develop paragraph writing skills through structured instruction in topic sentences, supporting details, and conclusions. Emphasis on descriptive writing using sensory details and peer review.

## Learning Objectives
1. Write a complete paragraph with a topic sentence, supporting details, and conclusion
2. Use sensory details in descriptive writing
3. Participate in peer review and revise work
4. Write a personal narrative draft

## Session Structure (4 weeks, 2 sessions/week, 30 min each)

### Week 1: Paragraph Structure
**Session 1:** Introduce the paragraph sandwich analogy. Model writing a topic sentence. Class practice identifying topic sentences in sample paragraphs.

**Session 2:** Add supporting details. Model adding 3 supporting sentences. Students practice building paragraphs from provided topic sentences.

### Week 2: Descriptive Writing
**Session 1:** Introduce sensory details using a "mystery bag" activity (students describe objects using senses). Model transforming bland sentences into descriptive ones.

**Session 2:** Descriptive Writing Challenge. Students write about their favorite place using all five senses. Share with partners.

### Week 3: Peer Review and Revision
**Session 1:** Teach peer review protocols. Model giving constructive, kind feedback. Students practice with sample paragraphs before reviewing classmates' work.

**Session 2:** Revision workshop. Students improve their paragraphs based on peer feedback. Focus on adding details, strengthening word choice, and clarifying meaning.

### Week 4: Personal Narrative
**Session 1:** Personal narrative introduction. Brainstorm story ideas. Begin drafting.

**Session 2:** Continue drafting and revision. Share completed narratives. Celebrate writing achievements.

## Differentiation Strategies

### For Students Who Need More Support:
- Provide graphic organizers for paragraph planning
- Offer word banks for descriptive vocabulary
- Use sentence starters for topic and closing sentences
- Allow verbal storytelling before writing

### For Advanced Learners:
- Write multi-paragraph compositions
- Experiment with different paragraph structures
- Include dialogue in personal narratives
- Create writing mentor guides for classmates

## Assessment: Paragraph portfolio showing growth from initial to revised work. Personal narrative evaluated for structure, detail, voice, and conventions.
`,
    },
    {
      id: "doc_ela_3_5_module_1_rubric",
      moduleId: "ela_3_5_module_1",
      levelId: 2,
      title: "Assessment Rubric: Writing Workshop",
      gradeBand: "3-5",
      documentType: "assessment_rubric",
      standardsAlignment: ["CCSS.ELA-LITERACY.W.3.1", "CCSS.ELA-LITERACY.W.3.2", "CCSS.ELA-LITERACY.L.3.1"],
      content: `# Assessment Rubric: Writing Workshop

## Module: Writing Workshop | Grade Band: 3-5

### Criteria 1: Paragraph Structure
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Paragraphs have clear, engaging topic sentences, multiple well-developed supporting details, and satisfying closing sentences. Organization is logical and effective. |
| **Meeting (3)** | Paragraphs include a topic sentence, at least 3 supporting details, and a closing sentence. Structure is clear and follows the sandwich model. |
| **Approaching (2)** | Paragraphs have some structural elements but may be missing a topic or closing sentence. Supporting details may be insufficient or off-topic. |
| **Beginning (1)** | Writing lacks paragraph structure. No clear topic sentence, supporting details, or closing sentence. Ideas are disorganized. |

### Criteria 2: Descriptive and Sensory Writing
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Writing is vivid and engaging, using multiple sensory details that create strong mental images. Word choice is precise and varied. Shows rather than tells consistently. |
| **Meeting (3)** | Writing includes sensory details from at least 3 senses. Descriptive language adds interest. Some use of showing rather than telling. |
| **Approaching (2)** | Writing includes minimal sensory details. Descriptions are vague or generic. Relies mainly on telling rather than showing. |
| **Beginning (1)** | Writing lacks descriptive or sensory details. Word choice is basic and repetitive. No evidence of descriptive writing techniques. |

### Criteria 3: Revision and Growth
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Revised work shows significant improvement over drafts. Student incorporates peer feedback thoughtfully. Final work demonstrates clear growth in writing ability. |
| **Meeting (3)** | Revised work shows noticeable improvement. Student makes meaningful changes based on feedback. Participates constructively in peer review. |
| **Approaching (2)** | Revision shows minor improvements. Changes are surface-level (spelling, punctuation) rather than substantive. Limited engagement with peer feedback. |
| **Beginning (1)** | No meaningful revision attempted. Does not incorporate feedback. No evidence of growth from draft to final. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },

    // ============================================================
    // MATH 3-5: Multiplication & Division (Grade Band 3-5)
    // ============================================================
    {
      id: "doc_math_3_5_module_1_guide",
      moduleId: "math_3_5_module_1",
      levelId: 2,
      title: "Student Guide: Multiplication & Division",
      gradeBand: "3-5",
      documentType: "curriculum_guide",
      standardsAlignment: ["CCSS.MATH.CONTENT.3.OA.A.1", "CCSS.MATH.CONTENT.3.OA.A.2", "CCSS.MATH.CONTENT.3.OA.B.5", "CCSS.MATH.CONTENT.3.OA.C.7"],
      content: `# Multiplication & Division - Your Student Guide

## Ready for the Next Level!

You already know how to add and subtract like a champion. Now it is time to level up with **multiplication and division!** These are powerful math tools that let you solve bigger problems faster. Think of multiplication as a shortcut for adding the same number over and over, and division as a fair way to share things equally.

## What is Multiplication?

Multiplication is **repeated addition.** Instead of adding 4 + 4 + 4, you can say 3 x 4 = 12. That means "three groups of four."

### Ways to Think About Multiplication:
- **Groups:** 5 x 3 means "5 groups of 3 things"
- **Arrays:** 5 x 3 means "5 rows with 3 in each row" (like seats in a theater!)
- **Skip counting:** 5 x 3 means counting by 3's five times: 3, 6, 9, 12, 15

## What is Division?

Division is the **opposite of multiplication.** It means sharing things equally or figuring out how many groups you can make.

- 12 / 3 = 4 means "12 things shared equally among 3 groups gives 4 in each group"
- 12 / 3 = 4 also means "How many groups of 3 can you make from 12? Four groups!"

## Key Vocabulary

- **Factor:** A number being multiplied (in 3 x 4, both 3 and 4 are factors)
- **Product:** The answer to a multiplication problem (in 3 x 4 = 12, the product is 12)
- **Dividend:** The number being divided (in 12 / 3, the dividend is 12)
- **Divisor:** The number you divide by (in 12 / 3, the divisor is 3)
- **Quotient:** The answer to a division problem (in 12 / 3 = 4, the quotient is 4)
- **Array:** Objects arranged in rows and columns

## Multiplication Tricks and Tips

### The Commutative Property
3 x 7 = 7 x 3. The order does not matter! So if you know 7 x 3 = 21, you also know 3 x 7 = 21. This cuts your memorization in half!

### The Zero Property
Anything multiplied by 0 equals 0. 0 x 1,000,000 = 0!

### The Identity Property
Anything multiplied by 1 stays the same. 1 x 42 = 42!

### The 9's Trick
For 9 x any number (1-10), hold up all 10 fingers. Put down the finger that matches the number you are multiplying by. The fingers to the left are the tens, and the fingers to the right are the ones!

## Fun Activities

### Activity 1: Times Table Games
Practice your multiplication facts with flashcards, online games, or a multiplication chart. Try to beat your own speed record!

### Activity 2: Division Story Problems
Create your own division story problems about real life. Example: "You have 24 cookies to share equally among 6 friends. How many cookies does each friend get?"

### Activity 3: Real-World Math Challenges
Find multiplication and division in your daily life:
- How many total legs do 7 dogs have? (7 x 4 = 28)
- If 20 students split into groups of 4, how many groups? (20 / 4 = 5)

### Activity 4: Array Art
Create art using arrays! Draw 6 rows of 5 stars to make a flag. 4 rows of 3 flowers to make a garden. Make your arrays beautiful!

## Remember!

Math is not about being fast - it is about understanding. If multiplication feels hard right now, that is completely normal. Your brain is building new connections every time you practice. Keep at it, and one day these facts will feel as easy as 1 + 1 = 2. You have got this!

## Check Your Understanding

1. What is multiplication a shortcut for?
2. How are multiplication and division related?
3. What is the commutative property?
4. Solve: If you have 35 stickers to share equally among 5 friends, how many does each friend get?
`,
    },
    {
      id: "doc_math_3_5_module_1_lesson",
      moduleId: "math_3_5_module_1",
      levelId: 2,
      title: "Teacher Guide: Multiplication & Division",
      gradeBand: "3-5",
      documentType: "lesson_plan",
      standardsAlignment: ["CCSS.MATH.CONTENT.3.OA.A.1", "CCSS.MATH.CONTENT.3.OA.A.2", "CCSS.MATH.CONTENT.3.OA.C.7", "CCSS.MATH.PRACTICE.MP1"],
      content: `# Teacher Implementation Guide: Multiplication & Division

## Module Overview
Students master multiplication facts through conceptual understanding and practice, understand division as the inverse of multiplication, and apply both operations to real-world problems.

## Learning Objectives
1. Memorize multiplication facts through 12
2. Understand division as the inverse of multiplication
3. Solve multi-step word problems using multiplication and division
4. Apply math to real-world situations

## Session Structure (4 weeks, 2 sessions/week, 30 min each)

### Week 1: Multiplication Concepts
**Session 1:** Introduction to multiplication as repeated addition and groups. Array models with manipulatives. Explore the commutative property through array rotation.

**Session 2:** Skip counting connection to multiplication. Practice with 2s, 5s, and 10s. Times table chart introduction. Begin daily fact practice routine.

### Week 2: Multiplication Mastery
**Session 1:** Strategies for harder facts (3s, 4s, 6s, 7s, 8s, 9s). The 9s finger trick. Doubling strategies (if you know 3x, you can find 6x by doubling).

**Session 2:** Multiplication games and practice. Timed fact challenges (competing against self, not others). Array Art activity. Begin connecting to real-world problems.

### Week 3: Division Concepts
**Session 1:** Division as equal sharing and equal grouping. Use manipulatives to model division. Connect to multiplication: "If 3 x 4 = 12, then 12 / 3 = 4."

**Session 2:** Division fact practice using inverse multiplication facts. Division story problems. Remainders introduction for advanced students.

### Week 4: Application
**Session 1:** Multi-step word problems involving both operations. Problem-solving strategies. Students create their own word problems.

**Session 2:** Real-world math challenge stations. Students rotate through practical multiplication and division scenarios. Assessment and celebration.

## Differentiation Strategies

### For Students Who Need More Support:
- Provide manipulatives for all practice
- Focus on mastering facts through 6 before extending
- Use visual array cards alongside written facts
- Allow calculator for multi-step problems while building fact fluency

### For Advanced Learners:
- Introduce multi-digit multiplication
- Explore division with remainders
- Create challenging word problems for classmates
- Investigate multiplication patterns and number theory

## Assessment: Timed fact assessments (self-improvement focus), word problem portfolio, and real-world application project.
`,
    },
    {
      id: "doc_math_3_5_module_1_rubric",
      moduleId: "math_3_5_module_1",
      levelId: 2,
      title: "Assessment Rubric: Multiplication & Division",
      gradeBand: "3-5",
      documentType: "assessment_rubric",
      standardsAlignment: ["CCSS.MATH.CONTENT.3.OA.A.1", "CCSS.MATH.CONTENT.3.OA.C.7"],
      content: `# Assessment Rubric: Multiplication & Division

## Module: Multiplication & Division | Grade Band: 3-5

### Criteria 1: Fact Fluency
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student demonstrates automatic recall of multiplication facts through 12. Can quickly derive related division facts. Shows consistent improvement in timed practice. |
| **Meeting (3)** | Student recalls most multiplication facts through 10 with reasonable speed. Uses strategies for unknown facts. Shows improvement over time. |
| **Approaching (2)** | Student recalls facts for 2s, 5s, and 10s but struggles with others. Uses counting or fingers frequently. Some improvement but significant gaps remain. |
| **Beginning (1)** | Student cannot recall basic multiplication facts. Relies entirely on counting strategies. No improvement trajectory evident. |

### Criteria 2: Conceptual Understanding
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student explains multiplication as repeated addition, arrays, and groups. Understands and applies properties (commutative, identity, zero). Clearly explains the relationship between multiplication and division. |
| **Meeting (3)** | Student understands multiplication as repeated addition. Can use arrays to model multiplication. Understands that division is the inverse of multiplication. |
| **Approaching (2)** | Student has partial conceptual understanding. May rely on memorization without understanding. Struggles to explain the relationship between multiplication and division. |
| **Beginning (1)** | Student does not demonstrate conceptual understanding of multiplication or division. Cannot explain what the operations mean. |

### Criteria 3: Problem Solving
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student solves multi-step word problems independently. Creates original word problems. Applies multiplication and division to novel real-world situations. Explains reasoning clearly. |
| **Meeting (3)** | Student solves single and some multi-step word problems. Identifies the correct operation for word problems. Can apply facts to real-world scenarios with guidance. |
| **Approaching (2)** | Student solves simple word problems with support. May struggle to identify whether to multiply or divide. Limited application to real-world contexts. |
| **Beginning (1)** | Student cannot solve word problems involving multiplication or division. Cannot determine the correct operation to use. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },

    // ============================================================
    // SCIENCE 3-5: Ecosystems & Food Chains (Grade Band 3-5)
    // ============================================================
    {
      id: "doc_science_3_5_module_1_guide",
      moduleId: "science_3_5_module_1",
      levelId: 2,
      title: "Student Guide: Ecosystems & Food Chains",
      gradeBand: "3-5",
      documentType: "curriculum_guide",
      standardsAlignment: ["NGSS 5-LS2-1", "NGSS 5-PS3-1", "NGSS 3-LS4-3", "CCSS.ELA-LITERACY.RI.4.3"],
      content: `# Ecosystems & Food Chains - Your Student Guide

## Nature's Amazing Connections!

Did you know that everything in nature is connected? The sun feeds the plants, the plants feed the animals, and when living things return to the earth, they feed the soil that grows new plants. It is like a giant circle of life, and you are about to explore how it all works!

## What is an Ecosystem?

An **ecosystem** is a community of living things (plants, animals, insects, bacteria) AND the non-living things around them (water, soil, sunlight, air, rocks) all working together. Your backyard is an ecosystem! So is a pond, a forest, a desert, and even a puddle.

### Parts of an Ecosystem:
- **Biotic factors:** Living things (trees, birds, worms, fungi, bacteria)
- **Abiotic factors:** Non-living things (sunlight, water, temperature, soil, rocks)

Both are equally important. Take away the sunlight or water, and the whole ecosystem changes!

## Food Chains: Who Eats What?

A **food chain** shows the path of energy from one living thing to another. Energy starts with the sun and flows through the chain:

**Sun** provides energy to **Producers** (plants and algae) which are eaten by **Primary Consumers** (herbivores like rabbits) which are eaten by **Secondary Consumers** (carnivores like foxes) which are eaten by **Tertiary Consumers** (top predators like eagles)

And when anything dies, **Decomposers** (mushrooms, worms, bacteria) break it down and return nutrients to the soil!

## Key Vocabulary

- **Ecosystem:** A community of living and non-living things interacting together
- **Producer:** An organism that makes its own food using sunlight (plants)
- **Consumer:** An organism that eats other organisms for energy
- **Herbivore:** An animal that eats only plants
- **Carnivore:** An animal that eats only other animals
- **Omnivore:** An animal that eats both plants and animals
- **Decomposer:** An organism that breaks down dead material
- **Food web:** Many interconnected food chains in an ecosystem

## What Happens When a Food Chain is Disrupted?

If one part of a food chain is removed, it affects EVERYTHING else:
- If all the foxes disappear, rabbit populations explode, and they eat all the plants
- If a disease kills the grass, the rabbits have no food, and then the foxes have no food
- If pollution kills the decomposers, dead material piles up and nutrients cannot return to the soil

Everything is connected!

## Fun Activities

### Activity 1: Build a Food Chain Diagram
Choose an ecosystem (forest, ocean, desert, pond). Draw a food chain with at least 4 links. Label each organism as a producer, primary consumer, secondary consumer, or decomposer.

### Activity 2: Ecosystem Diorama
Build a mini ecosystem in a shoebox! Include both living and non-living parts. Label everything and explain how they connect.

### Activity 3: What If? Disruption Scenarios
What would happen if:
- All the bees disappeared from a meadow ecosystem?
- A new predator was introduced to a pond?
- A drought dried up half the water in a wetland?

Write or draw your predictions!

### Activity 4: Local Ecosystem Observation
Go outside and observe a small ecosystem (a garden, a park, a stream edge). Record:
- 5 living things you see
- 5 non-living things you see
- 2 food chain connections you can identify

## Remember!

You are PART of an ecosystem too! The choices we make affect the natural world around us. When you learn about ecosystems, you learn about your own connection to nature. Be curious, be observant, and be a protector of the ecosystems around you!

## Check Your Understanding

1. What is the difference between biotic and abiotic factors?
2. Where does the energy in a food chain originally come from?
3. What role do decomposers play in an ecosystem?
4. What might happen if all the primary consumers were removed from a food chain?
`,
    },
    {
      id: "doc_science_3_5_module_1_lesson",
      moduleId: "science_3_5_module_1",
      levelId: 2,
      title: "Teacher Guide: Ecosystems & Food Chains",
      gradeBand: "3-5",
      documentType: "lesson_plan",
      standardsAlignment: ["NGSS 5-LS2-1", "NGSS 5-PS3-1", "NGSS 3-LS4-3"],
      content: `# Teacher Implementation Guide: Ecosystems & Food Chains

## Module Overview
Students explore the interdependence of living things through the study of ecosystems, food chains, and energy flow. Emphasis on observation, prediction, and systems thinking.

## Learning Objectives
1. Define ecosystem and identify biotic and abiotic components
2. Trace energy flow through a food chain
3. Explain roles of producers, consumers, and decomposers
4. Predict consequences of food chain disruption

## Session Structure (4 weeks, 2 sessions/week, 30 min each)

### Week 1: Ecosystem Basics
**Session 1:** Define ecosystems. Sort biotic vs. abiotic factors using images and real objects. Introduce the idea that everything in nature is connected.

**Session 2:** Ecosystem exploration - observe the schoolyard or local area. Students document living and non-living things they find. Share and classify observations.

### Week 2: Food Chains
**Session 1:** Introduce food chains using physical cards students can arrange. Teach producer, consumer, decomposer roles. Build class food chains together.

**Session 2:** Students create their own food chain diagrams for different ecosystems. Introduce the concept of energy transfer - energy decreases at each level.

### Week 3: Disruption and Consequences
**Session 1:** "What if?" scenarios. Remove one organism from a food chain and predict cascading effects. Use string activities where students hold connected strings - when one lets go, everyone feels it.

**Session 2:** Case study of a real ecosystem disruption (e.g., wolf reintroduction in Yellowstone). Discuss how one change rippled through the entire ecosystem.

### Week 4: Synthesis Projects
**Session 1:** Ecosystem diorama construction. Students build and label their ecosystems. Include food chain connections.

**Session 2:** Project presentations. Local ecosystem observation reports. Assessment and celebration of learning.

## Differentiation Strategies

### For Students Who Need More Support:
- Use physical manipulatives for food chain building
- Provide pre-sorted organism cards with pictures and labels
- Offer simplified ecosystem options (pond, garden)
- Use visual prediction templates for disruption scenarios

### For Advanced Learners:
- Explore food WEBS (interconnected food chains)
- Research invasive species and their ecosystem impact
- Calculate energy transfer percentages (10% rule)
- Design a balanced ecosystem from scratch

## Assessment: Food chain diagram accuracy, ecosystem diorama completeness, disruption prediction reasoning, and local observation quality.
`,
    },
    {
      id: "doc_science_3_5_module_1_rubric",
      moduleId: "science_3_5_module_1",
      levelId: 2,
      title: "Assessment Rubric: Ecosystems & Food Chains",
      gradeBand: "3-5",
      documentType: "assessment_rubric",
      standardsAlignment: ["NGSS 5-LS2-1", "NGSS 5-PS3-1"],
      content: `# Assessment Rubric: Ecosystems & Food Chains

## Module: Ecosystems & Food Chains | Grade Band: 3-5

### Criteria 1: Ecosystem Understanding
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student accurately defines ecosystems and identifies both biotic and abiotic factors with specific examples. Explains how living and non-living components interact. Applies understanding to unfamiliar ecosystems. |
| **Meeting (3)** | Student defines ecosystem correctly. Identifies at least 3 biotic and 3 abiotic factors. Understands that components interact with each other. |
| **Approaching (2)** | Student has partial understanding. May confuse biotic and abiotic, or identify few examples. Limited understanding of interactions. |
| **Beginning (1)** | Student cannot define ecosystem or distinguish between living and non-living components. |

### Criteria 2: Food Chain Knowledge
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student accurately creates multi-level food chains and begins understanding food webs. Correctly labels all roles. Explains energy flow and transfer. Creates chains for multiple ecosystems. |
| **Meeting (3)** | Student creates a correct food chain with 4+ organisms. Labels producers, consumers, and decomposers correctly. Traces energy flow from sun through the chain. |
| **Approaching (2)** | Student creates a basic food chain but may have incorrect ordering or missing roles. Some confusion about which organisms are producers vs. consumers. |
| **Beginning (1)** | Student cannot create an accurate food chain. Does not understand the roles of producers, consumers, or decomposers. |

### Criteria 3: Systems Thinking
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student predicts cascading effects of ecosystem disruptions with detailed reasoning. Considers multiple consequences and indirect effects. Connects to real-world environmental issues. |
| **Meeting (3)** | Student predicts basic consequences of removing one organism from a food chain. Understands that changes affect multiple parts of the ecosystem. |
| **Approaching (2)** | Student makes simple predictions but does not consider cascading effects. Understanding of interconnection is limited. |
| **Beginning (1)** | Student cannot predict consequences of ecosystem disruption. Does not demonstrate understanding of interconnection. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },

    // ============================================================
    // SEL 3-5: Growth Mindset & Resilience (Grade Band 3-5)
    // ============================================================
    {
      id: "doc_sel_3_5_module_1_guide",
      moduleId: "sel_3_5_module_1",
      levelId: 2,
      title: "Student Guide: Growth Mindset & Resilience",
      gradeBand: "3-5",
      documentType: "curriculum_guide",
      standardsAlignment: ["CASEL SEL Self-Awareness", "CASEL SEL Self-Management", "CASEL SEL Responsible Decision-Making"],
      content: `# Growth Mindset & Resilience - Your Student Guide

## The Power of Yet!

Have you ever said "I can't do this!" and wanted to give up? Everyone has! But today you are going to learn about a secret weapon that can change EVERYTHING. It is just one tiny word: **YET.**

When you say "I can't do this," try adding "yet" to the end: "I can't do this YET." Feel the difference? That little word means you are on your way. You are learning. You are growing. You just have not arrived... yet!

## Fixed Mindset vs. Growth Mindset

### Fixed Mindset (The Stuck Mindset)
- "I'm just not a math person"
- "Some people are born smart, and I'm not"
- "If I fail, it means I'm not good enough"
- "Why try? I'll never be as good as them"

### Growth Mindset (The Growing Mindset)
- "I'm not a math person YET, but I'm learning"
- "Everyone can get smarter with practice"
- "If I fail, I learn something new"
- "I'll keep trying until I get better"

Which mindset sounds more hopeful? Which one leads to more learning?

## Your Brain is a Muscle!

Here is an amazing science fact: **your brain GROWS when you learn new things!** Scientists have discovered that when you struggle with something hard, your brain makes new connections. Those connections make you smarter. That means:

- Struggling is not a sign of weakness - it is your brain GROWING
- Making mistakes is not failing - it is LEARNING
- Being confused is not bad - it is the first step to UNDERSTANDING

## Key Vocabulary

- **Growth mindset:** The belief that abilities can be developed through effort and learning
- **Fixed mindset:** The belief that abilities are set and cannot change
- **Resilience:** The ability to bounce back from setbacks and keep going
- **Perseverance:** Continuing to try even when things are difficult
- **Self-talk:** The things you say to yourself in your head
- **Goal:** Something you want to achieve that you work toward

## Famous Failures Who Became Successes

- **Michael Jordan** was cut from his high school basketball team. He became the greatest basketball player of all time.
- **J.K. Rowling** was rejected by 12 publishers before Harry Potter was accepted. She became one of the most successful authors ever.
- **Thomas Edison** failed over 1,000 times before inventing the light bulb. He said, "I have not failed. I have just found 1,000 ways that do not work."
- **Albert Einstein** did not speak until he was 4 and was told he would "never amount to much." He changed our understanding of the universe.

## Fun Activities

### Activity 1: Fixed vs. Growth Mindset Sorting
Sort these statements into Fixed or Growth:
- "I'm terrible at spelling" vs. "Spelling is hard for me, but I'm improving"
- "She's just naturally talented" vs. "She practiced a lot to get that good"
- "I give up" vs. "I need to try a different approach"

### Activity 2: Reframing Negative Thoughts
Change these fixed mindset statements into growth mindset statements:
- "I'm so dumb" becomes...
- "This is impossible" becomes...
- "I'll never be good at art" becomes...

### Activity 3: Goal-Setting Workshop
Set one academic goal and one personal goal for this month. Write down:
- What is your goal?
- Why does it matter to you?
- What steps will you take?
- What will you do when it gets hard?

## Your Growth Mindset Pledge

"I am smart, and I can get smarter. Mistakes help me learn. Struggles make my brain stronger. I will keep trying, even when it is hard. I believe in the power of YET."

## Remember!

You are capable of amazing things. The only difference between you and the people you admire is time, practice, and the courage to keep going. Believe in yourself. Ask for help when you need it. And never, ever forget: you are not done growing!

## Check Your Understanding

1. What is the difference between a fixed mindset and a growth mindset?
2. How does struggling actually help your brain?
3. Name one famous person who failed before succeeding.
4. Why is the word "yet" so powerful?
`,
    },
    {
      id: "doc_sel_3_5_module_1_lesson",
      moduleId: "sel_3_5_module_1",
      levelId: 2,
      title: "Teacher Guide: Growth Mindset & Resilience",
      gradeBand: "3-5",
      documentType: "lesson_plan",
      standardsAlignment: ["CASEL SEL Self-Awareness", "CASEL SEL Self-Management", "CASEL SEL Responsible Decision-Making"],
      content: `# Teacher Implementation Guide: Growth Mindset & Resilience

## Module Overview
Students develop growth mindset beliefs through neuroscience-based understanding, famous failure case studies, reframing exercises, and personal goal-setting. This foundational SEL module builds resilience and positive self-talk habits.

## Learning Objectives
1. Understand the difference between fixed and growth mindset
2. Reframe negative self-talk with positive alternatives
3. View mistakes as learning opportunities
4. Set goals and track progress

## Session Structure (3 weeks, 2 sessions/week, 25 min each)

### Week 1: Understanding Mindsets
**Session 1:** "The Power of Yet" introduction. Fixed vs. Growth mindset sorting activity. Brain science: your brain grows with effort (use age-appropriate neuroscience visuals).

**Session 2:** Famous Failures research and sharing. Students select a person who failed before succeeding and share what they learned. Class discussion: What did these people have in common?

### Week 2: Reframing and Self-Talk
**Session 1:** Identify negative self-talk. Reframing exercises in pairs. Practice changing "I can't" to "I can't yet." Create reframing cards for common negative thoughts.

**Session 2:** Role-play scenarios where growth mindset helps. Students practice responding to setbacks with growth mindset language. Create a class growth mindset bulletin board.

### Week 3: Goal-Setting and Action
**Session 1:** Goal-setting workshop. Students set SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound). Create visual goal trackers.

**Session 2:** Growth Mindset Pledge ceremony. Students write and sign their personal pledges. Set up weekly check-ins for goal progress. Celebrate the journey.

## Differentiation Strategies

### For Students Who Need More Support:
- Use picture cards for mindset sorting
- Provide reframing sentence starters
- Set simple, short-term goals first
- Offer extra encouragement and positive reinforcement

### For Advanced Learners:
- Research the neuroscience of learning in more depth
- Create growth mindset presentations for younger students
- Set longer-term, more ambitious goals
- Become growth mindset ambassadors in the classroom

## Important Notes
- Some students may have experienced significant adversity and might feel that "just try harder" is dismissive. Be sensitive to individual circumstances.
- Growth mindset is not about denying difficulty - it is about believing in the possibility of growth. Validate that hard things ARE hard.
- Model growth mindset yourself - share your own learning struggles with students.

## Assessment: Mindset journal entries, reframing quality, goal-setting and tracking, and growth mindset pledge personal reflection.
`,
    },
    {
      id: "doc_sel_3_5_module_1_rubric",
      moduleId: "sel_3_5_module_1",
      levelId: 2,
      title: "Assessment Rubric: Growth Mindset & Resilience",
      gradeBand: "3-5",
      documentType: "assessment_rubric",
      standardsAlignment: ["CASEL SEL Self-Awareness", "CASEL SEL Self-Management"],
      content: `# Assessment Rubric: Growth Mindset & Resilience

## Module: Growth Mindset & Resilience | Grade Band: 3-5

### Criteria 1: Mindset Understanding
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student clearly explains both mindsets with original examples. Understands the neuroscience behind brain growth. Applies mindset concepts to new situations independently. Helps peers develop growth mindset. |
| **Meeting (3)** | Student distinguishes between fixed and growth mindset. Gives examples of each. Understands that the brain can grow with effort. |
| **Approaching (2)** | Student has basic awareness of mindset differences but may confuse concepts. Limited ability to give examples. |
| **Beginning (1)** | Student cannot distinguish between fixed and growth mindset. Does not understand the brain growth concept. |

### Criteria 2: Reframing Skills
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student independently reframes negative self-talk consistently. Creates original reframes. Catches and corrects fixed mindset language in real-time. Supports others in reframing. |
| **Meeting (3)** | Student reframes negative statements with growth mindset alternatives. Uses "yet" and other positive language when prompted. Shows effort to change self-talk patterns. |
| **Approaching (2)** | Student can reframe with guidance but does not do so independently. May understand the concept but struggle to apply it to personal situations. |
| **Beginning (1)** | Student cannot reframe negative self-talk. Does not demonstrate understanding of the reframing process. |

### Criteria 3: Goal-Setting and Perseverance
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student sets challenging, specific goals. Creates detailed action plans. Tracks progress consistently. Demonstrates resilience when facing setbacks. Adjusts goals and strategies based on experience. |
| **Meeting (3)** | Student sets clear goals with action steps. Tracks progress with the goal tracker. Shows effort to persevere through challenges. Completes goal-setting activities thoughtfully. |
| **Approaching (2)** | Student sets vague goals or goals that are too easy. Tracking is inconsistent. May give up when facing challenges. |
| **Beginning (1)** | Student does not set meaningful goals. No evidence of progress tracking. Gives up easily when challenged. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },

    // ============================================================
    // WELLNESS 3-5: Nutrition Science (Grade Band 3-5)
    // ============================================================
    {
      id: "doc_wellness_3_5_module_1_guide",
      moduleId: "wellness_3_5_module_1",
      levelId: 2,
      title: "Student Guide: Nutrition Science",
      gradeBand: "3-5",
      documentType: "curriculum_guide",
      standardsAlignment: ["NHES 1.5.1", "NHES 7.5.1", "NHES 7.5.2", "CCSS.ELA-LITERACY.RI.4.5"],
      content: `# Nutrition Science - Your Student Guide

## Becoming a Nutrition Detective!

You are now old enough to start making smart choices about what you eat! Food is not just about taste (even though that is important too). Food is FUEL for your body and brain. The right food gives you energy to play, focus in school, and feel your best. Let us become nutrition detectives and figure out what your body really needs!

## The Five Food Groups

Your body needs foods from ALL five groups to work its best:

### 1. Fruits
Colorful, sweet, and packed with vitamins! Fruits give you energy, help your immune system, and keep your skin healthy. Aim for lots of different colors.

### 2. Vegetables
Your body's maintenance crew! Vegetables have vitamins, minerals, and fiber that keep everything running smoothly. The more colorful your plate, the better!

### 3. Grains
Your body's fuel tank! Grains give you the energy to run, play, and think. Choose whole grains (brown rice, whole wheat bread) when you can - they last longer!

### 4. Protein
Your body's building blocks! Protein helps build muscles, repair injuries, and keep you strong. Meat, fish, beans, eggs, and nuts are all great protein sources.

### 5. Dairy
Strong bones and teeth! Dairy products like milk, cheese, and yogurt provide calcium and vitamin D. If you cannot have dairy, look for calcium in other foods like broccoli or fortified plant milks.

## Reading Nutrition Labels

Nutrition labels are like a food report card! Here is what to look for:

- **Serving size:** How much is one serving? You might be eating two servings without knowing it!
- **Calories:** Energy units. Active kids need about 1,600-2,200 calories per day.
- **Sugar:** Try to keep added sugar low. Natural sugar (from fruit) is different from added sugar.
- **Fiber:** Aim for lots of fiber - it helps your digestion and keeps you full longer.
- **Protein:** Check how much protein each serving provides.

## Key Vocabulary

- **Nutrients:** Substances in food that your body needs to grow and stay healthy
- **Vitamins:** Nutrients that help your body fight disease and work properly
- **Minerals:** Nutrients that help build bones, muscles, and other body parts
- **Fiber:** The part of plant foods that helps your digestion
- **Calories:** Units of energy that food provides to your body
- **Balanced meal:** A meal that includes foods from multiple food groups

## Fun Activities

### Activity 1: Food Group Sorting Challenge
Sort a list of foods into the five food groups. Can you think of 5 foods for each group?

### Activity 2: Nutrition Label Scavenger Hunt
Find 5 food items in your kitchen. Read the nutrition labels and compare them. Which has the most protein? The least sugar? The most fiber?

### Activity 3: Design Your Own Balanced Meal
Create a meal that includes at least one food from each food group. Draw your plate and label each food with its food group!

### Activity 4: Food Diary Reflection
Write down everything you eat for one day. At the end of the day, check: Did you eat from all five food groups? What was missing? What could you add tomorrow?

## How Food Affects Your Mood and Energy

- **Breakfast:** Eating a balanced breakfast helps you focus in school. Without breakfast, your brain runs on empty!
- **Sugar crashes:** Eating lots of sugar gives you quick energy followed by a crash. Balanced meals give you steady energy.
- **Water:** Your body is about 60% water. Staying hydrated helps your brain work, your body move, and your mood stay positive.
- **Sleep connection:** What you eat affects how you sleep, and how you sleep affects how you feel. It is all connected!

## Remember!

Nutrition is not about being perfect or never eating treats. It is about BALANCE. Learning to fuel your body well is one of the most powerful skills you can have. You deserve to feel energized, focused, and strong every single day. Start small, make one healthy choice at a time, and remember that taking care of your body is taking care of your future!

## Check Your Understanding

1. Name the five food groups and give an example from each.
2. What three things should you look for on a nutrition label?
3. Why is breakfast important for school performance?
4. What does a "balanced meal" include?
`,
    },
    {
      id: "doc_wellness_3_5_module_1_lesson",
      moduleId: "wellness_3_5_module_1",
      levelId: 2,
      title: "Teacher Guide: Nutrition Science",
      gradeBand: "3-5",
      documentType: "lesson_plan",
      standardsAlignment: ["NHES 1.5.1", "NHES 7.5.1", "NHES 7.5.2"],
      content: `# Teacher Implementation Guide: Nutrition Science

## Module Overview
Students learn about the five food groups, nutrition label reading, meal planning, and the connection between food and energy/mood. Emphasis on practical skills and positive relationships with food.

## Learning Objectives
1. Identify the five food groups and their benefits
2. Read and understand basic nutrition labels
3. Plan a balanced meal using multiple food groups
4. Understand how food affects energy and mood

## Session Structure (3 weeks, 2 sessions/week, 25 min each)

### Week 1: Food Groups
**Session 1:** Introduce the five food groups with visual aids. Food group sorting activity with real or pictured foods. Discuss why each group matters.

**Session 2:** "Eat the Rainbow" activity - explore why colorful plates are healthy plates. Students identify their favorite foods from each group. Discuss cultural food traditions and how they fit into food groups.

### Week 2: Nutrition Labels
**Session 1:** Label reading lesson with sample food packages. Guided practice identifying serving size, calories, sugar, fiber, and protein. Scavenger hunt preparation.

**Session 2:** Nutrition Label Scavenger Hunt results sharing. Compare findings. Discuss: What surprised you? What would you change about your snack choices based on what you learned?

### Week 3: Balanced Meals and Food-Mood Connection
**Session 1:** Balanced meal design activity. Students create their ideal meal using all five food groups. Discuss the food-mood connection: breakfast, sugar crashes, hydration.

**Session 2:** Food diary reflection and sharing (private reflection encouraged). Goal-setting: one nutrition improvement for the next week. Celebration of learning.

## Differentiation Strategies

### For Students Who Need More Support:
- Use physical food models or pictures instead of text
- Provide simplified nutrition label templates
- Focus on identifying food groups before label reading
- Use food group colors as visual cues

### For Advanced Learners:
- Research specific nutrients and their functions
- Calculate daily nutritional intake and compare to recommendations
- Design a week-long meal plan for a family
- Explore how nutrition science connects to sports performance

## Important Notes
- Be sensitive to students with food allergies, dietary restrictions, or food insecurity
- Focus on addition (adding nutritious foods) rather than restriction
- Avoid language that associates food with guilt or shame
- Include diverse cultural foods and traditions in examples
- Coordinate with school nutrition services if possible

## Assessment: Food group identification, nutrition label reading accuracy, balanced meal design, and food diary reflection quality.
`,
    },
    {
      id: "doc_wellness_3_5_module_1_rubric",
      moduleId: "wellness_3_5_module_1",
      levelId: 2,
      title: "Assessment Rubric: Nutrition Science",
      gradeBand: "3-5",
      documentType: "assessment_rubric",
      standardsAlignment: ["NHES 1.5.1", "NHES 7.5.1"],
      content: `# Assessment Rubric: Nutrition Science

## Module: Nutrition Science | Grade Band: 3-5

### Criteria 1: Food Group Knowledge
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student identifies all five food groups with multiple examples from each. Explains the specific benefits of each group. Sorts unfamiliar foods correctly. Connects food groups to overall health. |
| **Meeting (3)** | Student identifies all five food groups with at least 2 examples each. Understands the general purpose of each group. Correctly sorts most foods into their groups. |
| **Approaching (2)** | Student identifies 3-4 food groups. Examples may be limited or some foods miscategorized. Understanding of benefits is vague. |
| **Beginning (1)** | Student cannot identify food groups or categorize foods correctly. Does not understand the purpose of different food groups. |

### Criteria 2: Nutrition Label Reading
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student reads nutrition labels fluently. Compares products to make informed choices. Identifies serving sizes, calories, sugar, fiber, and protein independently. Uses label information to evaluate food quality. |
| **Meeting (3)** | Student reads basic nutrition label information with minimal guidance. Identifies serving size, calories, and at least 2 other nutrients. Understands that labels help make informed food choices. |
| **Approaching (2)** | Student reads some label information with significant guidance. May confuse serving sizes or nutrient values. Limited understanding of label purpose. |
| **Beginning (1)** | Student cannot read or interpret nutrition labels. Does not understand the purpose of nutrition information. |

### Criteria 3: Balanced Meal Planning
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student designs balanced meals that include all food groups. Considers nutritional variety, cultural preferences, and practical constraints. Explains food choices with nutritional reasoning. Shows creativity and personal connection. |
| **Meeting (3)** | Student designs a meal including at least 4 food groups. Meal is realistic and shows understanding of balance. Can explain basic nutritional reasoning for choices. |
| **Approaching (2)** | Student designs a meal with 2-3 food groups represented. Limited variety or impractical choices. Minimal nutritional reasoning. |
| **Beginning (1)** | Student cannot design a balanced meal. Food choices do not reflect understanding of food groups or nutritional balance. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },

    // ============================================================
    // ELA 6-8: Persuasive Writing & Rhetoric (Grade Band 6-8)
    // ============================================================
    {
      id: "doc_ela_6_8_module_1_guide",
      moduleId: "ela_6_8_module_1",
      levelId: 3,
      title: "Student Guide: Persuasive Writing & Rhetoric",
      gradeBand: "6-8",
      documentType: "curriculum_guide",
      standardsAlignment: ["CCSS.ELA-LITERACY.W.7.1", "CCSS.ELA-LITERACY.RI.7.8", "CCSS.ELA-LITERACY.SL.7.4"],
      content: `# Persuasive Writing & Rhetoric - Your Student Guide

## Words Have Power

Every day, people are trying to persuade you. Advertisements want you to buy things. Politicians want your support. Friends want you to agree with them. Understanding rhetoric - the art of persuasion - gives you the power to see through manipulation AND to communicate your own ideas more effectively.

## The Three Appeals: Ethos, Pathos, Logos

Ancient Greek philosopher Aristotle identified three ways to persuade:

### Ethos (Credibility)
"Trust me because of who I am." Ethos is about establishing your credibility and authority. A doctor talking about health has strong ethos. A celebrity selling vitamins has weaker ethos.

### Pathos (Emotion)
"Feel something." Pathos appeals to emotions - fear, hope, anger, sympathy, excitement. That sad puppy in the animal shelter commercial? Pure pathos. Effective, but can be manipulative.

### Logos (Logic)
"Here are the facts." Logos uses evidence, statistics, and logical reasoning to persuade. "Students who eat breakfast score 17% higher on tests" is logos.

The most effective persuasion uses ALL THREE together.

## Building Your Argument

### 1. Thesis Statement
Your thesis is your main argument in one clear sentence:
- Weak: "School uniforms are a topic people disagree about."
- Strong: "School uniforms should be eliminated because they suppress individual expression, create financial burden, and do not improve academic performance."

### 2. Supporting Arguments
Each body paragraph should contain:
- A clear claim (mini-thesis for that paragraph)
- Evidence (facts, statistics, expert quotes, examples)
- Analysis (explain WHY your evidence supports your claim)
- Transition to the next point

### 3. Counterargument
Address the opposing view and explain why your position is stronger. This shows you have considered multiple perspectives and strengthens your credibility (ethos).

### 4. Conclusion
Restate your thesis, summarize key points, and end with a call to action or memorable statement.

## Key Vocabulary

- **Rhetoric:** The art of effective persuasion through writing or speaking
- **Thesis statement:** A single sentence that states your main argument
- **Ethos, pathos, logos:** The three rhetorical appeals (credibility, emotion, logic)
- **Counterargument:** Acknowledging and responding to opposing viewpoints
- **Evidence:** Facts, data, or expert opinions that support your claims
- **Bias:** A tendency to favor one perspective over another, often unfairly

## Activities

### Activity 1: Thesis Statement Workshop
Write thesis statements for these topics:
- Should students have homework?
- Should the school day start later?
- Should school cafeterias only serve healthy food?

### Activity 2: Analyze Advertisements
Find 3 advertisements. For each, identify:
- Which appeal(s) does it use? (ethos, pathos, logos)
- Who is the target audience?
- What is the persuasive technique?
- Is it effective? Why or why not?

### Activity 3: Persuasive Essay
Write a 5-paragraph persuasive essay on a topic you care about. Include all three appeals and address at least one counterargument.

### Activity 4: Class Debate
Choose a side on a debatable topic. Prepare your argument using evidence and address potential counterarguments. Present to the class and respond to questions.

## Remember!

Rhetoric is not about winning arguments or manipulating people. It is about communicating your truth clearly and respectfully. When you understand how persuasion works, you become both a better communicator and a more critical consumer of information. That combination is incredibly powerful.

## Check Your Understanding

1. What are the three rhetorical appeals and give an example of each?
2. What makes a strong thesis statement?
3. Why is addressing counterarguments important?
4. How can you identify bias in persuasive content?
`,
    },
    {
      id: "doc_ela_6_8_module_1_lesson",
      moduleId: "ela_6_8_module_1",
      levelId: 3,
      title: "Teacher Guide: Persuasive Writing & Rhetoric",
      gradeBand: "6-8",
      documentType: "lesson_plan",
      standardsAlignment: ["CCSS.ELA-LITERACY.W.7.1", "CCSS.ELA-LITERACY.RI.7.8", "CCSS.ELA-LITERACY.SL.7.4"],
      content: `# Teacher Implementation Guide: Persuasive Writing & Rhetoric

## Module Overview
Students develop persuasive writing skills through rhetorical analysis, thesis construction, evidence-based argumentation, and debate. Emphasis on ethical persuasion and critical media literacy.

## Learning Objectives
1. Construct clear thesis statements and supporting arguments
2. Identify ethos, pathos, and logos in persuasive texts
3. Write a complete persuasive essay with counterargument
4. Analyze media for bias and persuasion techniques

## Session Structure (4 weeks, 2 sessions/week, 45 min each)

### Week 1: Rhetorical Appeals
Sessions 1-2: Introduce ethos, pathos, logos with engaging examples from media. Advertisement analysis activity. Students practice identifying appeals in various texts.

### Week 2: Building Arguments
Sessions 3-4: Thesis statement workshop. Evidence gathering and analysis. Practice constructing body paragraphs with claim-evidence-analysis structure.

### Week 3: Writing the Essay
Sessions 5-6: Persuasive essay drafting. Counterargument instruction. Peer review with structured feedback forms.

### Week 4: Debate and Revision
Sessions 7-8: Class debate preparation and execution. Essay revision based on peer and teacher feedback. Final presentations.

## Differentiation Strategies

### For Students Who Need More Support:
- Provide paragraph structure templates
- Offer evidence libraries on debate topics
- Use graphic organizers for essay planning
- Allow oral argumentation before written essays

### For Advanced Learners:
- Analyze propaganda techniques in historical contexts
- Write op-eds for the school newspaper
- Study logical fallacies and how to counter them
- Conduct independent media bias investigations

## Assessment: Persuasive essay (thesis strength, evidence quality, counterargument, writing conventions), advertisement analysis, and debate participation.
`,
    },
    {
      id: "doc_ela_6_8_module_1_rubric",
      moduleId: "ela_6_8_module_1",
      levelId: 3,
      title: "Assessment Rubric: Persuasive Writing & Rhetoric",
      gradeBand: "6-8",
      documentType: "assessment_rubric",
      standardsAlignment: ["CCSS.ELA-LITERACY.W.7.1", "CCSS.ELA-LITERACY.RI.7.8"],
      content: `# Assessment Rubric: Persuasive Writing & Rhetoric

## Module: Persuasive Writing & Rhetoric | Grade Band: 6-8

### Criteria 1: Thesis and Argumentation
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Thesis is compelling, specific, and arguable. Supporting arguments are well-organized with strong evidence and clear analysis. Counterargument is addressed substantively. Overall argument is cohesive and persuasive. |
| **Meeting (3)** | Thesis is clear and arguable. Body paragraphs include claims supported by evidence. Counterargument is acknowledged. Argument follows a logical structure. |
| **Approaching (2)** | Thesis is vague or too broad. Some supporting evidence but analysis is weak. Counterargument missing or superficial. Organization needs improvement. |
| **Beginning (1)** | No clear thesis. Lacks supporting evidence or logical structure. No counterargument addressed. |

### Criteria 2: Rhetorical Analysis
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student accurately identifies and analyzes all three appeals in multiple texts. Explains how appeals work together for persuasive effect. Detects subtle bias and manipulation techniques. |
| **Meeting (3)** | Student identifies ethos, pathos, and logos in given texts. Can explain how each appeal is being used. Recognizes basic persuasion techniques in advertisements. |
| **Approaching (2)** | Student identifies 1-2 appeals but may confuse them. Analysis of persuasion techniques is limited. |
| **Beginning (1)** | Student cannot identify rhetorical appeals. Does not demonstrate understanding of persuasion techniques. |

### Criteria 3: Writing Quality
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Writing is clear, engaging, and polished. Strong voice and word choice. Few to no errors in conventions. Effective use of transitions between paragraphs. Revision shows significant improvement. |
| **Meeting (3)** | Writing is clear and organized. Appropriate word choice and voice. Minor errors in conventions. Adequate transitions. Evidence of revision. |
| **Approaching (2)** | Writing is somewhat unclear or disorganized. Word choice is basic. Several errors in conventions. Limited transitions. Minimal revision. |
| **Beginning (1)** | Writing is unclear, disorganized, and contains many errors. No evidence of revision. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },

    // ============================================================
    // MATH 6-8: Pre-Algebra Foundations (Grade Band 6-8)
    // ============================================================
    {
      id: "doc_math_6_8_module_1_guide",
      moduleId: "math_6_8_module_1",
      levelId: 3,
      title: "Student Guide: Pre-Algebra Foundations",
      gradeBand: "6-8",
      documentType: "curriculum_guide",
      standardsAlignment: ["CCSS.MATH.CONTENT.6.EE.A.2", "CCSS.MATH.CONTENT.6.EE.B.5", "CCSS.MATH.CONTENT.7.EE.A.1"],
      content: `# Pre-Algebra Foundations - Your Student Guide

## Welcome to Algebra!

Algebra might sound intimidating, but here is a secret: you have been doing algebra your whole life! Every time you solved "3 + ___ = 7" you were solving an algebra problem. Now, instead of a blank, we use a letter. That is the biggest change. You have got this!

## Variables: Letters That Stand for Numbers

A **variable** is just a letter that represents a number you do not know yet. We use variables like x, y, n, or any letter:
- x + 5 = 12 means "What number plus 5 equals 12?" (x = 7)
- 3n = 15 means "3 times what number equals 15?" (n = 5)

Variables are not scary. They are just question marks dressed up as letters!

## Expressions vs. Equations

An **expression** is a math phrase without an equals sign: 3x + 5, 2y - 7, 4(n + 3)

An **equation** has an equals sign and can be solved: 3x + 5 = 20, 2y - 7 = 11

Think of an equation like a balance scale. Both sides must be equal!

## Solving Equations: The Balance Method

To solve an equation, you need to get the variable alone on one side. The rule: **whatever you do to one side, you must do to the other side.** Keep the scale balanced!

### Example: Solve x + 7 = 15
1. We want x alone, so subtract 7 from both sides
2. x + 7 - 7 = 15 - 7
3. x = 8
4. Check: 8 + 7 = 15 (correct!)

### Example: Solve 3x = 21
1. We want x alone, so divide both sides by 3
2. 3x / 3 = 21 / 3
3. x = 7
4. Check: 3(7) = 21 (correct!)

## Key Vocabulary

- **Variable:** A letter representing an unknown number
- **Expression:** A mathematical phrase without an equals sign
- **Equation:** A mathematical statement with an equals sign
- **Coefficient:** The number multiplied by a variable (in 3x, the coefficient is 3)
- **Constant:** A fixed number in an expression (in 3x + 5, the constant is 5)
- **Solve:** Finding the value of the variable that makes the equation true

## Activities

### Activity 1: Variable Exploration
Translate these word problems into equations:
- "A number plus 8 equals 15" becomes x + 8 = 15
- "Three times a number equals 24" becomes 3n = 24
- "A number minus 5 equals 10" becomes y - 5 = 10

### Activity 2: Balance Scale Equation Solver
Draw a balance scale. Put the equation on it and show each step of solving by keeping the scale balanced.

### Activity 3: Coordinate Plane Treasure Hunt
Plot points on a coordinate plane to find a hidden treasure. Each clue gives you a coordinate to plot!

### Activity 4: Real-World Equation Writing
Write equations for these situations:
- You have some money. After spending $15, you have $23 left. How much did you start with?
- Three friends split a pizza bill equally. Each paid $8. What was the total bill?

## Remember!

Algebra is a language - the language of patterns and relationships. Learning it opens doors to every math course after this, to science, engineering, computer science, and even art. Be patient with yourself. Practice a little every day. And remember: confusion is just the first step to understanding.

## Check Your Understanding

1. What is a variable?
2. What is the difference between an expression and an equation?
3. Solve: x + 12 = 20
4. Write an equation for: "Five times a number equals 35"
`,
    },
    {
      id: "doc_math_6_8_module_1_lesson",
      moduleId: "math_6_8_module_1",
      levelId: 3,
      title: "Teacher Guide: Pre-Algebra Foundations",
      gradeBand: "6-8",
      documentType: "lesson_plan",
      standardsAlignment: ["CCSS.MATH.CONTENT.6.EE.A.2", "CCSS.MATH.CONTENT.6.EE.B.5", "CCSS.MATH.CONTENT.7.EE.A.1"],
      content: `# Teacher Implementation Guide: Pre-Algebra Foundations

## Module Overview
Students transition from arithmetic to algebraic thinking through variables, expressions, equations, and the coordinate plane. Emphasis on conceptual understanding through the balance method and real-world applications.

## Learning Objectives
1. Understand variables and expressions
2. Solve one-step and two-step equations
3. Graph points on a coordinate plane
4. Translate word problems into equations

## Session Structure (5 weeks, 2 sessions/week, 45 min each)

### Week 1: Variables and Expressions
Sessions 1-2: Introduce variables as "unknown numbers." Practice translating words into algebraic expressions. Evaluate expressions for given values.

### Week 2: One-Step Equations
Sessions 3-4: The balance method for solving equations. Practice with addition/subtraction and multiplication/division equations. Check solutions by substitution.

### Week 3: Two-Step Equations
Sessions 5-6: Extend to two-step equations. Order of operations in reverse. Practice with varied difficulty levels.

### Week 4: Coordinate Plane
Sessions 7-8: Introduce the coordinate system. Plot points and create shapes. Treasure hunt activity. Connect to real-world graphing.

### Week 5: Application and Assessment
Sessions 9-10: Real-world equation writing. Multi-step problem solving. Assessment and review. Celebration of algebraic thinking growth.

## Differentiation Strategies

### For Students Who Need More Support:
- Use physical balance scales and manipulatives
- Start with single-step equations with small numbers
- Provide step-by-step solution templates
- Use color-coding for variables vs. constants

### For Advanced Learners:
- Introduce inequalities
- Solve multi-step equations with variables on both sides
- Explore linear relationships and graphing lines
- Challenge with real-world modeling problems

## Assessment: Equation solving accuracy, word-to-equation translation, coordinate plotting, and problem-solving process documentation.
`,
    },
    {
      id: "doc_math_6_8_module_1_rubric",
      moduleId: "math_6_8_module_1",
      levelId: 3,
      title: "Assessment Rubric: Pre-Algebra Foundations",
      gradeBand: "6-8",
      documentType: "assessment_rubric",
      standardsAlignment: ["CCSS.MATH.CONTENT.6.EE.A.2", "CCSS.MATH.CONTENT.6.EE.B.5"],
      content: `# Assessment Rubric: Pre-Algebra Foundations

## Module: Pre-Algebra Foundations | Grade Band: 6-8

### Criteria 1: Variable and Expression Understanding
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student fluently uses variables and evaluates complex expressions. Translates between verbal descriptions and algebraic notation effortlessly. Creates original expressions for given situations. |
| **Meeting (3)** | Student understands variables as representing unknowns. Evaluates expressions correctly for given values. Translates simple word problems into expressions. |
| **Approaching (2)** | Student has basic understanding of variables but makes frequent errors in evaluation. Struggles with word-to-expression translation. |
| **Beginning (1)** | Student does not understand variables or how to use them. Cannot evaluate or create algebraic expressions. |

### Criteria 2: Equation Solving
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student solves one and two-step equations accurately and efficiently. Checks all solutions. Explains the reasoning behind each step. Can solve equations with variables on both sides. |
| **Meeting (3)** | Student solves one-step equations accurately. Solves most two-step equations. Uses the balance method correctly. Checks solutions when prompted. |
| **Approaching (2)** | Student solves some one-step equations. Makes procedural errors in two-step equations. Understands the balance concept but applies it inconsistently. |
| **Beginning (1)** | Student cannot solve equations. Does not understand the balance method or how to isolate variables. |

### Criteria 3: Real-World Application
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student independently writes and solves equations for complex real-world scenarios. Interprets solutions in context. Creates original word problems that require algebraic thinking. |
| **Meeting (3)** | Student writes equations for structured word problems. Solves and interprets results in context. Connects algebra to practical situations. |
| **Approaching (2)** | Student writes basic equations with support. May struggle with interpreting solutions in context. Limited connection to real-world applications. |
| **Beginning (1)** | Student cannot translate word problems into equations. Does not connect algebra to real-world situations. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },

    // ============================================================
    // SEL 6-8: Identity & Self-Awareness (Grade Band 6-8)
    // ============================================================
    {
      id: "doc_sel_6_8_module_1_guide",
      moduleId: "sel_6_8_module_1",
      levelId: 3,
      title: "Student Guide: Identity & Self-Awareness",
      gradeBand: "6-8",
      documentType: "curriculum_guide",
      standardsAlignment: ["CASEL SEL Self-Awareness", "CASEL SEL Self-Management", "CASEL SEL Relationship Skills"],
      content: `# Identity & Self-Awareness - Your Student Guide

## Who Are You?

This might be the most important question you will ever ask yourself. And here is the beautiful, sometimes confusing truth: the answer is always evolving. Middle school is a time of massive change, and figuring out who you are is one of the bravest things you can do.

## The Layers of Identity

You are not just one thing. Your identity has many layers:

### Values
What matters most to you? Honesty? Loyalty? Creativity? Justice? Humor? Your values are your internal compass - they guide your decisions even when no one is watching.

### Interests
What makes you lose track of time? What would you do even if nobody was watching or you were not getting a grade? These passions are clues to who you really are.

### Strengths
What comes naturally to you? What do people come to you for? Maybe you are a great listener, a creative thinker, a natural leader, or a loyal friend. Own your strengths without apology.

### Culture and Heritage
Your family traditions, language, food, music, and history are treasures. They are part of what makes you unique. Never let anyone make you feel like your culture is less valuable than anyone else's.

### Experiences
Everything you have been through - the good, the difficult, the confusing - has shaped who you are. Your experiences are part of your story, and every story has value.

## Stress Management Toolkit

Middle school can be stressful. Here are proven strategies:

### Physical Strategies
- **Deep breathing:** Inhale for 4 counts, hold for 4, exhale for 4
- **Movement:** Walk, stretch, dance, or exercise
- **Sleep:** Aim for 8-10 hours per night

### Mental Strategies
- **Journaling:** Write down what you are feeling without judgment
- **Mindfulness:** Focus on the present moment, not worries about the future
- **Positive self-talk:** Replace "I can't handle this" with "This is hard, but I've gotten through hard things before"

### Social Strategies
- **Talk to someone:** A trusted adult, friend, or school counselor
- **Set boundaries:** It is okay to say "I need some space right now"
- **Ask for help:** Needing help is not weakness - it is wisdom

## Key Vocabulary

- **Identity:** The qualities, beliefs, and experiences that make you uniquely you
- **Values:** The principles and beliefs that guide your decisions and behavior
- **Self-awareness:** Understanding your own emotions, thoughts, and behaviors
- **Peer pressure:** The influence others your age have on your decisions
- **Boundaries:** Limits you set to protect your wellbeing and values
- **Resilience:** The ability to recover from difficulties and keep moving forward

## Activities

### Activity 1: Values Exploration Journal
List 10 values and rank them from most to least important to you. Write about a time when you had to choose between two values.

### Activity 2: Stress Management Toolkit
Create your personal stress management toolkit with at least one strategy from each category (physical, mental, social).

### Activity 3: Peer Pressure Scenarios
Read scenarios and practice responses to peer pressure. Role-play saying "no" confidently and kindly.

### Activity 4: Healthy Relationship Criteria
List 5 qualities of a healthy friendship and 5 red flags. Reflect on your own relationships.

## You Are Enough

Right now, exactly as you are, you are enough. You do not have to earn your worth through grades, popularity, appearance, or achievements. You matter because you exist. The world needs exactly who you are. Never forget that.

## Check Your Understanding

1. Name three layers of identity.
2. What is one stress management strategy from each category?
3. Why is it important to know your values?
4. What does "you are enough" mean to you?
`,
    },
    {
      id: "doc_sel_6_8_module_1_lesson",
      moduleId: "sel_6_8_module_1",
      levelId: 3,
      title: "Teacher Guide: Identity & Self-Awareness",
      gradeBand: "6-8",
      documentType: "lesson_plan",
      standardsAlignment: ["CASEL SEL Self-Awareness", "CASEL SEL Self-Management", "CASEL SEL Relationship Skills"],
      content: `# Teacher Implementation Guide: Identity & Self-Awareness

## Module Overview
Students explore personal identity, develop stress management strategies, navigate peer pressure, and build healthy relationship skills during the critical developmental period of middle school.

## Learning Objectives
1. Identify personal values and strengths
2. Develop healthy stress management strategies
3. Navigate peer pressure with confidence
4. Build and maintain healthy relationships

## Session Structure (4 weeks, 2 sessions/week, 30 min each)

### Week 1: Who Am I?
Sessions 1-2: Identity layers exploration. Values identification and ranking. Strengths inventory. Cultural identity celebration. Create "identity maps."

### Week 2: Managing Stress
Sessions 3-4: Stress management strategy introduction (physical, mental, social). Practice deep breathing and mindfulness. Personal toolkit creation. Journaling introduction.

### Week 3: Peer Pressure
Sessions 5-6: Peer pressure identification and role-play. Practice assertive communication. Boundary-setting skills. Real-life scenario discussions.

### Week 4: Healthy Relationships
Sessions 7-8: Qualities of healthy vs. unhealthy relationships. Communication skills practice. Conflict resolution strategies. Module reflection and toolkit completion.

## Important Notes
- Create a safe, confidential space for sharing
- Be prepared for students to share personal struggles
- Have counseling referral resources readily available
- Validate all experiences without judgment
- Be sensitive to diverse family structures and cultural backgrounds
- This module may surface emotional needs that require follow-up support

## Assessment: Values journal, stress management toolkit, peer pressure response quality, and personal reflection on identity and growth.
`,
    },
    {
      id: "doc_sel_6_8_module_1_rubric",
      moduleId: "sel_6_8_module_1",
      levelId: 3,
      title: "Assessment Rubric: Identity & Self-Awareness",
      gradeBand: "6-8",
      documentType: "assessment_rubric",
      standardsAlignment: ["CASEL SEL Self-Awareness", "CASEL SEL Self-Management"],
      content: `# Assessment Rubric: Identity & Self-Awareness

## Module: Identity & Self-Awareness | Grade Band: 6-8

### Criteria 1: Self-Knowledge
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student demonstrates deep self-awareness. Articulates personal values, strengths, and growth areas with honesty and nuance. Reflects on how identity influences decisions and relationships. |
| **Meeting (3)** | Student identifies personal values and strengths. Completes identity exploration activities thoughtfully. Shows developing self-awareness. |
| **Approaching (2)** | Student has basic self-knowledge but reflections are surface-level. May struggle to articulate values or strengths clearly. |
| **Beginning (1)** | Student shows minimal engagement with self-exploration. Cannot articulate values or strengths. |

### Criteria 2: Coping and Management Skills
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student creates a comprehensive, personalized stress management toolkit. Demonstrates multiple strategies effectively. Helps peers develop their own coping strategies. Shows consistent application. |
| **Meeting (3)** | Student identifies and practices multiple stress management strategies. Creates a personal toolkit. Demonstrates understanding of when and how to use different strategies. |
| **Approaching (2)** | Student identifies some strategies but toolkit is limited. May understand strategies conceptually but not apply them consistently. |
| **Beginning (1)** | Student does not demonstrate understanding of stress management strategies. Toolkit is missing or empty. |

### Criteria 3: Social Skills
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student navigates peer pressure scenarios with confidence and empathy. Sets clear boundaries while maintaining relationships. Demonstrates healthy relationship skills consistently. Supports others in developing these skills. |
| **Meeting (3)** | Student responds to peer pressure scenarios appropriately. Understands healthy relationship qualities. Can set basic boundaries. Participates in role-play activities. |
| **Approaching (2)** | Student has some understanding of peer pressure and boundaries but struggles in role-play scenarios. Limited understanding of healthy vs. unhealthy relationship dynamics. |
| **Beginning (1)** | Student cannot navigate peer pressure scenarios. Does not demonstrate understanding of healthy relationships or boundaries. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },

    // ============================================================
    // WELLNESS 6-8: Digital Wellness & Adolescent Health (Grade Band 6-8)
    // ============================================================
    {
      id: "doc_wellness_6_8_module_1_guide",
      moduleId: "wellness_6_8_module_1",
      levelId: 3,
      title: "Student Guide: Digital Wellness & Adolescent Health",
      gradeBand: "6-8",
      documentType: "curriculum_guide",
      standardsAlignment: ["NHES 1.8.1", "NHES 2.8.4", "NHES 7.8.1", "ISTE 1.2 Digital Citizen"],
      content: `# Digital Wellness & Adolescent Health - Your Student Guide

## Finding Balance in a Connected World

Your life is getting more complex every day - school, friends, activities, social media, and the constant pull of your devices. Learning to balance all of this while taking care of your physical and mental health is one of the most important skills you can develop. And here is the thing: even many adults have not figured this out yet. You are ahead of the game.

## The Science of Screens

Your brain responds to notifications, likes, and new content with a chemical called **dopamine** - the same chemical that makes you feel good when you eat your favorite food or score a goal. Tech companies know this. They DESIGN their apps to trigger dopamine hits, keeping you scrolling, watching, and clicking longer.

Understanding this is not about feeling bad. It is about taking back CONTROL.

## Digital Wellness Strategies

### The 20-20-20 Rule
Every 20 minutes of screen time, look at something 20 feet away for 20 seconds. This protects your eyes and gives your brain a mini-break.

### No Screens Before Bed
Blue light from screens tricks your brain into thinking it is daytime. Stop screens 30-60 minutes before bed for dramatically better sleep.

### Curate Your Feed
You control what you see. Unfollow accounts that make you feel bad about yourself. Follow accounts that inspire, educate, or genuinely make you happy.

### Real Is Greater Than Virtual
Prioritize face-to-face time. No screen can replace a real conversation, a real hug, or a real shared experience.

## Mental Health Awareness

Mental health is just as important as physical health. It is okay to not be okay sometimes. What matters is knowing when to reach out for help.

### Signs You Might Need Support:
- Persistent sadness or anxiety that does not go away
- Loss of interest in things you used to enjoy
- Changes in sleep or appetite
- Feeling overwhelmed or hopeless
- Withdrawing from friends and activities

### Where to Get Help:
- A trusted adult (parent, teacher, coach, relative)
- School counselor
- Crisis Text Line: Text HOME to 741741
- 988 Suicide and Crisis Lifeline: Call or text 988

**There is no shame in asking for help. It is one of the bravest things you can do.**

## Key Vocabulary

- **Digital wellness:** A healthy, balanced relationship with technology
- **Dopamine:** A brain chemical associated with pleasure and reward
- **Screen time:** The amount of time spent using a device with a screen
- **Mental health:** Your emotional, psychological, and social wellbeing
- **Boundaries:** Limits you set to protect your time, energy, and wellbeing
- **Mindfulness:** Paying attention to the present moment without judgment

## Activities

### Activity 1: Screen Time Audit
Track your screen time for 3 days. Categorize: productive, social, entertainment, mindless scrolling. What patterns do you notice?

### Activity 2: Social Media Impact Analysis
For one week, notice how you FEEL after using different social media platforms. Rate your mood before and after each session (1-10). What do you discover?

### Activity 3: Personal Wellness Plan
Create a plan covering: sleep, nutrition, exercise, screen time, social connections, and stress management. Set realistic, specific goals.

### Activity 4: Mental Health Resource Mapping
Create a map of all the mental health resources available to you (people, organizations, hotlines). Share anonymously with the class.

## Remember!

You have the power to decide how technology fits into YOUR life. Balance does not mean perfection - it means making intentional choices more often than automatic ones. Be the boss of your devices, not the other way around. And take care of your mind as carefully as you take care of everything else.

## Check Your Understanding

1. How does dopamine relate to screen time?
2. What is the 20-20-20 rule?
3. Name three signs that someone might need mental health support.
4. Where can you get help if you or a friend is struggling?
`,
    },
    {
      id: "doc_wellness_6_8_module_1_lesson",
      moduleId: "wellness_6_8_module_1",
      levelId: 3,
      title: "Teacher Guide: Digital Wellness & Adolescent Health",
      gradeBand: "6-8",
      documentType: "lesson_plan",
      standardsAlignment: ["NHES 1.8.1", "NHES 2.8.4", "NHES 7.8.1", "ISTE 1.2 Digital Citizen"],
      content: `# Teacher Implementation Guide: Digital Wellness & Adolescent Health

## Module Overview
Students develop digital wellness strategies, mental health awareness, and personal wellness plans. Emphasis on practical skills, self-awareness, and knowing when to seek help.

## Learning Objectives
1. Evaluate personal screen time habits and their impact
2. Understand the impact of social media on mental health
3. Develop a comprehensive personal wellness plan
4. Know when and how to seek help for mental health concerns

## Session Structure (4 weeks, 2 sessions/week, 30 min each)

### Week 1: Digital Wellness
Sessions 1-2: Science of screen time and dopamine. Screen Time Audit introduction. Discussion of intentional vs. automatic device use. Digital wellness strategies.

### Week 2: Social Media and Mental Health
Sessions 3-4: Social Media Impact Analysis results discussion. How social media affects self-image, comparison, and anxiety. Curating feeds for wellbeing. Discussion of cyberbullying prevention.

### Week 3: Mental Health Awareness
Sessions 5-6: Normalize mental health conversations. Signs and symptoms discussion. Where to get help - resource mapping. How to support a friend who is struggling. Crisis resources review.

### Week 4: Personal Wellness Plans
Sessions 7-8: Comprehensive wellness plan creation. Goal-setting across all dimensions (physical, mental, social, digital). Accountability partnerships. Module reflection and celebration.

## Critical Notes
- Have school counselor information readily available
- Be prepared for students to disclose mental health concerns
- Follow mandatory reporting requirements
- Create a judgment-free environment for mental health discussions
- Provide resources for students who may be experiencing abuse or neglect
- Coordinate with parents/guardians about the mental health content

## Assessment: Screen time audit, social media impact analysis, personal wellness plan, and mental health resource map.
`,
    },
    {
      id: "doc_wellness_6_8_module_1_rubric",
      moduleId: "wellness_6_8_module_1",
      levelId: 3,
      title: "Assessment Rubric: Digital Wellness & Adolescent Health",
      gradeBand: "6-8",
      documentType: "assessment_rubric",
      standardsAlignment: ["NHES 1.8.1", "NHES 7.8.1"],
      content: `# Assessment Rubric: Digital Wellness & Adolescent Health

## Module: Digital Wellness & Adolescent Health | Grade Band: 6-8

### Criteria 1: Digital Self-Awareness
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student demonstrates deep understanding of their digital habits and their impact. Screen time audit reveals thoughtful analysis and actionable insights. Articulates the science behind screen addiction. Takes concrete steps to improve digital habits. |
| **Meeting (3)** | Student completes screen time audit and identifies patterns. Understands how screen time affects wellbeing. Develops at least 2 strategies for healthier digital habits. |
| **Approaching (2)** | Student completes basic audit but analysis lacks depth. Limited understanding of how digital habits affect wellbeing. |
| **Beginning (1)** | Student does not complete audit or demonstrate awareness of digital habits and their impact. |

### Criteria 2: Mental Health Literacy
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student demonstrates strong mental health literacy. Can identify signs of distress in self and others. Knows multiple resources and when to use them. Can articulate how to support a struggling friend. Advocates for mental health awareness. |
| **Meeting (3)** | Student identifies basic signs of mental health challenges. Knows at least 3 help resources. Understands the importance of seeking help. Completes resource mapping activity. |
| **Approaching (2)** | Student has basic awareness but limited knowledge of resources. May not fully understand when to seek help. Resource mapping is incomplete. |
| **Beginning (1)** | Student does not demonstrate mental health literacy. Cannot identify resources or understand when to seek help. |

### Criteria 3: Personal Wellness Planning
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Wellness plan is comprehensive, specific, and realistic. Covers all dimensions (physical, mental, social, digital). Goals are SMART. Student shows evidence of implementing their plan. Reflects on progress thoughtfully. |
| **Meeting (3)** | Wellness plan covers multiple dimensions. Goals are clear and achievable. Shows understanding of the connection between different wellness areas. |
| **Approaching (2)** | Wellness plan is basic or covers only 1-2 dimensions. Goals are vague. Limited evidence of personal connection or implementation intent. |
| **Beginning (1)** | No wellness plan created or plan is not meaningful. Does not demonstrate understanding of personal wellness. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },

    // ============================================================
    // ELA 9-12: Critical Analysis & Research (Grade Band 9-12)
    // ============================================================
    {
      id: "doc_ela_9_12_module_1_guide",
      moduleId: "ela_9_12_module_1",
      levelId: 4,
      title: "Student Guide: Critical Analysis & Research",
      gradeBand: "9-12",
      documentType: "curriculum_guide",
      standardsAlignment: ["CCSS.ELA-LITERACY.W.11-12.1", "CCSS.ELA-LITERACY.RI.11-12.6", "CCSS.ELA-LITERACY.W.11-12.7"],
      content: `# Critical Analysis & Research - Your Student Guide

## Beyond Reading: Analyzing

At this level, you are not just consuming information - you are evaluating, challenging, and creating knowledge. Critical analysis is the foundation of every professional field, from medicine to law to technology. It is also your best defense against misinformation.

## Rhetorical Analysis: Reading Between the Lines

Every text has a purpose beyond its surface meaning. Rhetorical analysis asks:

### The SOAPS Method:
- **Speaker:** Who is communicating? What is their background and potential bias?
- **Occasion:** What prompted this text? What is the historical/social context?
- **Audience:** Who is the intended audience? How does this shape the message?
- **Purpose:** What does the author want the audience to think, feel, or do?
- **Subject:** What is the topic, and how is it framed?

### Identifying Bias
All texts have bias - even this guide. Bias is not inherently evil; it simply means a perspective. The key is recognizing it:
- What voices are included? What voices are missing?
- What evidence is presented? What evidence is omitted?
- What assumptions does the author make?
- How do word choices reveal the author's stance?

## Research Writing

### Finding Credible Sources
Not all sources are equal. Evaluate using the CRAAP test:
- **Currency:** Is the information recent enough for your topic?
- **Relevance:** Does it directly relate to your research question?
- **Authority:** Who is the author? What are their credentials?
- **Accuracy:** Is the information supported by evidence? Can you verify it?
- **Purpose:** Why was this published? To inform, persuade, sell, entertain?

### Proper Citation
Academic honesty requires giving credit. Use a consistent citation style (MLA, APA, or Chicago) and cite:
- Direct quotes
- Paraphrased ideas
- Statistics and data
- Unique ideas that are not common knowledge

### Research Paper Structure
1. **Introduction:** Hook, context, thesis statement
2. **Literature Review:** What do existing sources say?
3. **Body Paragraphs:** Your arguments with evidence and analysis
4. **Counterargument:** Acknowledge and address opposing views
5. **Conclusion:** Synthesize your findings and state significance

## Key Vocabulary

- **Rhetorical analysis:** Examining HOW a text persuades, not just WHAT it says
- **Bias:** A perspective or tendency that influences how information is presented
- **Synthesis:** Combining information from multiple sources to create new understanding
- **Primary source:** Original, firsthand accounts or evidence
- **Secondary source:** Analysis or interpretation of primary sources
- **Academic discourse:** Formal discussion and debate of ideas within scholarly communities

## Activities

### Activity 1: Rhetorical Analysis Essay
Analyze a speech, editorial, or advertisement using the SOAPS method. Identify specific rhetorical strategies and evaluate their effectiveness.

### Activity 2: Source Evaluation Workshop
Evaluate 5 sources on a controversial topic using the CRAAP test. Rank them from most to least credible. Justify your rankings.

### Activity 3: Research Paper Project
Conduct independent research on a topic of your choosing. Produce a properly cited research paper with thesis, evidence, counterargument, and conclusion.

### Activity 4: Socratic Seminar
Participate in a student-led discussion on a complex text. Ask probing questions, build on others' ideas, and support your interpretations with textual evidence.

## Remember!

Critical thinking is not about being cynical or negative. It is about asking better questions, demanding better evidence, and reaching better conclusions. In an age of information overload and AI-generated content, these skills are not just academic - they are survival skills.

## Check Your Understanding

1. What does the SOAPS acronym stand for?
2. How do you evaluate a source using the CRAAP test?
3. Why is addressing counterarguments important in research writing?
4. What is the difference between primary and secondary sources?
`,
    },
    {
      id: "doc_ela_9_12_module_1_lesson",
      moduleId: "ela_9_12_module_1",
      levelId: 4,
      title: "Teacher Guide: Critical Analysis & Research",
      gradeBand: "9-12",
      documentType: "lesson_plan",
      standardsAlignment: ["CCSS.ELA-LITERACY.W.11-12.1", "CCSS.ELA-LITERACY.RI.11-12.6", "CCSS.ELA-LITERACY.W.11-12.7", "CCSS.ELA-LITERACY.SL.11-12.1"],
      content: `# Teacher Implementation Guide: Critical Analysis & Research

## Module Overview
Students develop advanced analytical and research skills through rhetorical analysis, source evaluation, independent research, and academic discourse.

## Learning Objectives
1. Analyze texts for rhetorical strategies and bias
2. Conduct independent research using credible sources
3. Write a properly cited research paper
4. Participate in academic discourse and Socratic seminars

## Session Structure (5 weeks, 2 sessions/week, 60 min each)

### Week 1: Rhetorical Analysis
Sessions 1-2: SOAPS method introduction. Practice with diverse texts (speeches, editorials, advertisements, social media posts). Bias identification exercises.

### Week 2: Source Evaluation
Sessions 3-4: CRAAP test introduction. Source evaluation workshop with real-world examples. Primary vs. secondary sources. Database research skills.

### Week 3: Research Process
Sessions 5-6: Research question development. Source gathering and annotated bibliography. Thesis refinement. Outline creation.

### Week 4: Writing and Revision
Sessions 7-8: Research paper drafting. Peer review using structured rubrics. Revision strategies. Citation formatting.

### Week 5: Discourse and Presentation
Sessions 9-10: Socratic seminar preparation and execution. Research paper finalization. Peer presentation of findings. Reflection on analytical growth.

## Differentiation Strategies

### For Students Who Need More Support:
- Provide annotated example papers
- Offer source evaluation checklists
- Scaffold the research process with milestone deadlines
- Allow collaborative research with individual writing

### For Advanced Learners:
- Conduct original primary research
- Write for publication (school journal, local newspaper)
- Explore interdisciplinary connections
- Lead Socratic seminar discussions

## Assessment: Rhetorical analysis essay, annotated bibliography, research paper (thesis, evidence, analysis, counterargument, citations), and Socratic seminar participation.
`,
    },
    {
      id: "doc_ela_9_12_module_1_rubric",
      moduleId: "ela_9_12_module_1",
      levelId: 4,
      title: "Assessment Rubric: Critical Analysis & Research",
      gradeBand: "9-12",
      documentType: "assessment_rubric",
      standardsAlignment: ["CCSS.ELA-LITERACY.W.11-12.1", "CCSS.ELA-LITERACY.RI.11-12.6"],
      content: `# Assessment Rubric: Critical Analysis & Research

## Module: Critical Analysis & Research | Grade Band: 9-12

### Criteria 1: Analytical Thinking
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student conducts sophisticated rhetorical analysis. Identifies subtle bias, implicit assumptions, and nuanced persuasion techniques. Analysis is insightful and original. SOAPS analysis reveals deep understanding. |
| **Meeting (3)** | Student accurately applies SOAPS and identifies rhetorical strategies. Recognizes bias in texts. Analysis is thorough and well-supported. |
| **Approaching (2)** | Student applies analytical frameworks inconsistently. May identify obvious rhetorical strategies but misses nuance. Analysis lacks depth. |
| **Beginning (1)** | Student cannot conduct meaningful rhetorical analysis. Does not identify bias or persuasion techniques. |

### Criteria 2: Research Quality
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Research demonstrates exceptional source evaluation. Uses diverse, high-quality sources. Thesis is original and compelling. Evidence is well-integrated and analyzed. Citations are impeccable. Paper could serve as a model. |
| **Meeting (3)** | Research uses credible, relevant sources evaluated with CRAAP criteria. Thesis is clear and supported. Evidence is appropriately cited. Counterargument addressed. Paper is well-organized. |
| **Approaching (2)** | Research uses some credible sources but evaluation is inconsistent. Thesis may be vague. Evidence is present but not well-analyzed. Citation errors present. |
| **Beginning (1)** | Research relies on unreliable sources. No clear thesis. Insufficient evidence. Significant citation issues or plagiarism concerns. |

### Criteria 3: Academic Discourse
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student leads academic discussions with sophistication. Builds meaningfully on others' ideas. Asks probing questions. Supports interpretations with strong evidence. Demonstrates intellectual humility and curiosity. |
| **Meeting (3)** | Student participates actively in discussions. References texts to support ideas. Responds to others' contributions respectfully. Demonstrates preparation and engagement. |
| **Approaching (2)** | Student participates minimally. Contributions lack textual support. Limited engagement with others' ideas. |
| **Beginning (1)** | Student does not participate in academic discourse. No evidence of preparation or engagement. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },

    // ============================================================
    // SEL 9-12: Mental Health & Life Planning (Grade Band 9-12)
    // ============================================================
    {
      id: "doc_sel_9_12_module_1_guide",
      moduleId: "sel_9_12_module_1",
      levelId: 4,
      title: "Student Guide: Mental Health & Life Planning",
      gradeBand: "9-12",
      documentType: "curriculum_guide",
      standardsAlignment: ["CASEL SEL Self-Awareness", "CASEL SEL Self-Management", "CASEL SEL Responsible Decision-Making", "NHES 1.12.1"],
      content: `# Mental Health & Life Planning - Your Student Guide

## Real Talk

Let us be honest: being a teenager is not easy. The pressure from school, relationships, social media, family expectations, and figuring out your future can feel overwhelming. This module is about building the skills to navigate all of it - not perfectly, but authentically.

## Understanding Mental Health

Mental health is not just the absence of problems. It is your overall emotional, psychological, and social wellbeing. Everyone has mental health, and everyone's mental health fluctuates.

### Common Challenges:
- **Anxiety:** Persistent worry that interferes with daily life. Some anxiety is normal. When it controls you, that is a signal to seek help.
- **Depression:** More than just sadness. It is persistent hopelessness, loss of interest, and difficulty functioning. It is treatable.
- **Stress overload:** When demands exceed your capacity to cope. Signs include physical symptoms, irritability, and difficulty concentrating.
- **Burnout:** Exhaustion from prolonged stress, often from trying to do too much for too long.

### What is NOT true about mental health:
- "You should be able to handle it on your own" - FALSE
- "Mental health issues are a sign of weakness" - FALSE
- "If you talk about it, you will make it worse" - FALSE
- "Only certain people get mental health problems" - FALSE

## Life Planning Skills

### Goal Setting
Set goals in multiple life areas:
- Academic: What do you want to achieve this year?
- Personal: What skill do you want to develop?
- Relational: What relationship do you want to strengthen?
- Health: What wellness habit do you want to build?

### Decision-Making Framework
For big decisions, try:
1. **Define:** What exactly is the decision?
2. **Options:** What are ALL your options (not just the obvious ones)?
3. **Consequences:** For each option, what could go well? What could go wrong?
4. **Values check:** Which option aligns best with your values?
5. **Act:** Make your choice and commit
6. **Reflect:** After time passes, evaluate your decision

## Key Vocabulary

- **Mental health:** Your emotional, psychological, and social wellbeing
- **Self-advocacy:** Speaking up for your own needs and rights
- **Burnout:** Physical and emotional exhaustion from chronic stress
- **Coping strategies:** Methods used to manage stress and difficult emotions
- **Resilience:** The capacity to recover from difficulties
- **Boundaries:** Clear limits that protect your mental and emotional energy

## Activities

### Activity 1: Mental Health Awareness Workshop
Learn to recognize signs of mental health challenges in yourself and others. Practice having supportive conversations. Role-play how to check in on a friend.

### Activity 2: Stress Management Plan
Create a comprehensive stress management plan covering prevention (how to avoid unnecessary stress), intervention (what to do when stress hits), and recovery (how to bounce back).

### Activity 3: Goal Setting and Vision Board
Set SMART goals across life domains. Create a vision board (physical or digital) representing your aspirations. Develop action plans for each goal.

### Activity 4: Resource Mapping
Create a comprehensive map of support resources available to you: people, organizations, hotlines, apps, and community resources. Know where to turn before you need to.

## When to Seek Help

**Seek help immediately if you or someone you know:**
- Talks about wanting to die or kill themselves
- Looks for ways to harm themselves
- Talks about feeling hopeless or having no purpose
- Gives away important possessions
- Shows dramatic mood changes

**Resources:**
- 988 Suicide and Crisis Lifeline: Call or text 988
- Crisis Text Line: Text HOME to 741741
- Your school counselor
- A trusted adult

**There is no shame in asking for help. It takes courage and strength.**

## Remember!

You are at a pivotal point in your life. The skills you build now - emotional intelligence, self-advocacy, decision-making, and resilience - will serve you for decades. This is not just about surviving high school. It is about building the foundation for the life you want to live. You deserve support, you deserve happiness, and you deserve to thrive.

## Check Your Understanding

1. What is mental health, and why does everyone need to pay attention to it?
2. Name two common mental health challenges and their key signs.
3. What are the six steps of the Decision-Making Framework?
4. When should you seek immediate help for a mental health concern?
`,
    },
    {
      id: "doc_sel_9_12_module_1_lesson",
      moduleId: "sel_9_12_module_1",
      levelId: 4,
      title: "Teacher Guide: Mental Health & Life Planning",
      gradeBand: "9-12",
      documentType: "lesson_plan",
      standardsAlignment: ["CASEL SEL Self-Awareness", "CASEL SEL Self-Management", "CASEL SEL Responsible Decision-Making", "NHES 1.12.1"],
      content: `# Teacher Implementation Guide: Mental Health & Life Planning

## Module Overview
Students develop mental health literacy, stress management skills, goal-setting abilities, and decision-making frameworks as they prepare for increasing independence.

## Learning Objectives
1. Recognize signs of mental health challenges in self and others
2. Develop comprehensive stress management strategies
3. Set meaningful goals and create action plans
4. Know when and how to seek professional help

## Session Structure (5 weeks, 2 sessions/week, 35 min each)

### Week 1: Mental Health Literacy
Sessions 1-2: Define mental health. Debunk myths. Discuss common challenges (anxiety, depression, stress). Normalize the conversation. Share resources.

### Week 2: Stress Management
Sessions 3-4: Prevention, intervention, and recovery strategies. Create comprehensive stress management plans. Practice mindfulness and grounding techniques.

### Week 3: Supporting Others
Sessions 5-6: How to check in on a friend. Active listening skills. When to involve an adult. Role-play supportive conversations. Bystander intervention.

### Week 4: Goal Setting and Life Planning
Sessions 7-8: SMART goal setting across life domains. Vision board creation. Decision-making framework practice. Action plan development.

### Week 5: Resource Mapping and Reflection
Sessions 9-10: Comprehensive resource mapping. Mental health first aid concepts. Module reflection. Commitment to ongoing mental health maintenance.

## CRITICAL Teacher Notes
- Coordinate with school counselors BEFORE this unit
- Have crisis intervention procedures ready
- Be prepared for student disclosures - know your mandatory reporting obligations
- Provide a way for students to communicate privately if needed
- Follow up individually with any student who shows signs of distress
- This is NOT therapy - it is psychoeducation and skills development
- Ensure diverse representation in examples and resources
- Be sensitive to students who may have experienced trauma, loss, or mental health crises

## Assessment: Stress management plan, goal-setting and action plans, resource map, and personal reflection on mental health awareness growth.
`,
    },
    {
      id: "doc_sel_9_12_module_1_rubric",
      moduleId: "sel_9_12_module_1",
      levelId: 4,
      title: "Assessment Rubric: Mental Health & Life Planning",
      gradeBand: "9-12",
      documentType: "assessment_rubric",
      standardsAlignment: ["CASEL SEL Self-Awareness", "CASEL SEL Self-Management"],
      content: `# Assessment Rubric: Mental Health & Life Planning

## Module: Mental Health & Life Planning | Grade Band: 9-12

### Criteria 1: Mental Health Literacy
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student demonstrates comprehensive mental health literacy. Can articulate the difference between normal stress and clinical concerns. Identifies signs in self and others. Advocates for mental health awareness. Knows multiple resources and when to use them. |
| **Meeting (3)** | Student identifies common mental health challenges and their signs. Understands when to seek help. Knows key crisis resources. Can have basic supportive conversations about mental health. |
| **Approaching (2)** | Student has basic awareness of mental health concepts. Knowledge of resources is limited. May still hold some misconceptions about mental health. |
| **Beginning (1)** | Student does not demonstrate meaningful mental health literacy. Cannot identify signs of distress or appropriate resources. |

### Criteria 2: Self-Management Skills
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student creates a comprehensive, multi-layered stress management plan. Goals are SMART and span multiple life domains. Decision-making framework is applied to real situations. Shows evidence of implementation and reflection. |
| **Meeting (3)** | Student develops a functional stress management plan. Sets clear goals with action steps. Applies the decision-making framework. Shows understanding of prevention, intervention, and recovery. |
| **Approaching (2)** | Student creates basic plans that lack specificity. Goals are vague or limited to one domain. Limited application of decision-making framework. |
| **Beginning (1)** | Student does not create meaningful self-management tools. Goals are missing or impractical. No evidence of applying learned frameworks. |

### Criteria 3: Support and Advocacy
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student demonstrates strong ability to support others. Resource map is comprehensive. Can articulate when to involve professionals. Shows empathy and active listening skills. Advocates for reducing mental health stigma. |
| **Meeting (3)** | Student can identify when someone needs support. Resource map covers key categories. Demonstrates basic active listening. Participates in role-play activities appropriately. |
| **Approaching (2)** | Student has limited understanding of how to support others. Resource map is incomplete. Struggles with role-play scenarios. |
| **Beginning (1)** | Student cannot demonstrate support skills. No resource map. Does not engage with support-related activities. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },

    // ============================================================
    // WELLNESS 9-12: Holistic Wellness Planning (Grade Band 9-12)
    // ============================================================
    {
      id: "doc_wellness_9_12_module_1_guide",
      moduleId: "wellness_9_12_module_1",
      levelId: 4,
      title: "Student Guide: Holistic Wellness Planning",
      gradeBand: "9-12",
      documentType: "curriculum_guide",
      standardsAlignment: ["NHES 1.12.1", "NHES 6.12.1", "NHES 7.12.1", "SHAPE America Standard 3"],
      content: `# Holistic Wellness Planning - Your Student Guide

## Owning Your Wellbeing

As you prepare for greater independence - college, career, or whatever path you choose - taking ownership of your total wellbeing becomes essential. Holistic wellness means caring for your whole self: body, mind, relationships, and even finances. Nobody else is going to do this for you. But you are absolutely capable.

## The Dimensions of Wellness

### Physical Wellness
- **Nutrition:** Fuel your body with a variety of whole foods. Learn to cook basic meals. Understand macronutrients (protein, carbs, fats) and micronutrients (vitamins, minerals).
- **Exercise:** Aim for at least 150 minutes of moderate activity per week. Find movement you enjoy - you are more likely to stick with it.
- **Sleep:** 8-10 hours for teens. Non-negotiable. Sleep affects everything: mood, focus, athletic performance, immune function, and decision-making.

### Mental and Emotional Wellness
- **Stress management:** Develop a toolkit that works for YOU (meditation, exercise, journaling, therapy, creative expression)
- **Mindfulness:** Practice present-moment awareness daily, even for just 5 minutes
- **Professional support:** Know when to seek therapy or counseling. It is preventive care, not just crisis care.

### Social Wellness
- **Healthy relationships:** Surround yourself with people who support your growth
- **Communication:** Learn to express needs, set boundaries, and resolve conflicts
- **Community:** Find your people - groups, clubs, or communities where you belong

### Financial Wellness (yes, really!)
- **Budgeting basics:** Track income and expenses
- **Saving habits:** Start small, stay consistent
- **Financial literacy:** Understand credit, debt, and basic investing concepts

## Creating Your Wellness Blueprint

### Step 1: Assess
Honestly evaluate where you stand in each wellness dimension. No judgment - just awareness.

### Step 2: Prioritize
You cannot fix everything at once. Choose 1-2 areas to focus on first.

### Step 3: Set Goals
Make specific, measurable goals with realistic timelines.

### Step 4: Plan
Create daily, weekly, and monthly habits that support your goals.

### Step 5: Track and Adjust
Monitor your progress. Celebrate wins. Adjust what is not working. Be patient with yourself.

## Key Vocabulary

- **Holistic wellness:** Caring for all dimensions of health (physical, mental, social, financial)
- **Macronutrients:** Major nutrients needed in large amounts (protein, carbohydrates, fats)
- **Mindfulness:** Paying attention to the present moment without judgment
- **Preventive care:** Actions taken to maintain health before problems develop
- **Financial literacy:** Understanding how money works and how to manage it effectively
- **Accountability partner:** Someone who helps you stay committed to your goals

## Activities

### Activity 1: Personal Wellness Assessment
Rate yourself 1-10 in each wellness dimension. Identify your strongest and weakest areas. Reflect on why certain areas are stronger.

### Activity 2: Nutrition and Fitness Plan
Design a realistic, personalized nutrition and fitness plan. Include meals you actually enjoy and exercises you would actually do. Plan for a typical week.

### Activity 3: Mindfulness Practice Guide
Experiment with different mindfulness techniques (breathing exercises, body scans, guided meditations, walking meditation). Create a guide of what works best for you.

### Activity 4: Wellness Accountability Partnership
Partner with a classmate. Share your wellness goals. Check in weekly. Support each other without judgment. Celebrate progress together.

## Remember!

Wellness is not about perfection. It is about progress. Some days you will eat well, exercise, sleep enough, and meditate. Other days you will eat pizza for breakfast and binge-watch shows until 2 AM. That is called being human. The goal is to build habits that serve you MOST of the time, and to treat yourself with compassion when you fall short. You are worth taking care of.

## Check Your Understanding

1. Name the four dimensions of holistic wellness.
2. Why is sleep considered "non-negotiable" for teenagers?
3. What are the five steps of creating a Wellness Blueprint?
4. Why is financial wellness included in holistic health?
`,
    },
    {
      id: "doc_wellness_9_12_module_1_lesson",
      moduleId: "wellness_9_12_module_1",
      levelId: 4,
      title: "Teacher Guide: Holistic Wellness Planning",
      gradeBand: "9-12",
      documentType: "lesson_plan",
      standardsAlignment: ["NHES 1.12.1", "NHES 6.12.1", "NHES 7.12.1", "SHAPE America Standard 3"],
      content: `# Teacher Implementation Guide: Holistic Wellness Planning

## Module Overview
Students create comprehensive personal wellness plans covering physical, mental, social, and financial health as they prepare for greater independence.

## Learning Objectives
1. Create a personalized nutrition and fitness plan
2. Develop a mental health maintenance routine
3. Understand the connection between all dimensions of wellness
4. Build sustainable healthy habits for life beyond school

## Session Structure (4 weeks, 2 sessions/week, 35 min each)

### Week 1: Assessment and Physical Wellness
Sessions 1-2: Personal wellness assessment. Nutrition science review (macros, micros, hydration). Basic meal planning. Exercise recommendations and finding enjoyable movement.

### Week 2: Mental and Emotional Wellness
Sessions 3-4: Stress management review and expansion. Mindfulness practice introduction. When to seek professional support. Creating a mental health maintenance routine.

### Week 3: Social and Financial Wellness
Sessions 5-6: Healthy relationships and communication skills review. Community and belonging. Basic financial literacy: budgeting, saving, understanding credit. Why financial wellness matters for overall health.

### Week 4: Wellness Blueprint and Accountability
Sessions 7-8: Comprehensive wellness plan creation. Accountability partnership formation. Goal tracking setup. Module reflection and commitment ceremony.

## Differentiation Strategies

### For Students Who Need More Support:
- Provide wellness plan templates
- Focus on one dimension at a time
- Offer simplified financial literacy materials
- Allow modified fitness planning for students with physical limitations

### For Advanced Learners:
- Research the science behind specific wellness practices
- Create wellness guides for younger students
- Develop a community wellness initiative
- Explore the intersection of wellness and career planning

## Important Notes
- Be sensitive to students with eating disorders or body image issues when discussing nutrition
- Avoid prescriptive approaches - emphasize personalization
- Acknowledge that financial wellness looks different for every family
- Include culturally responsive wellness practices
- Coordinate with PE teachers and school counselors

## Assessment: Personal wellness assessment, nutrition and fitness plan, mindfulness practice log, and comprehensive Wellness Blueprint with accountability partnership documentation.
`,
    },
    {
      id: "doc_wellness_9_12_module_1_rubric",
      moduleId: "wellness_9_12_module_1",
      levelId: 4,
      title: "Assessment Rubric: Holistic Wellness Planning",
      gradeBand: "9-12",
      documentType: "assessment_rubric",
      standardsAlignment: ["NHES 1.12.1", "NHES 7.12.1"],
      content: `# Assessment Rubric: Holistic Wellness Planning

## Module: Holistic Wellness Planning | Grade Band: 9-12

### Criteria 1: Self-Assessment and Awareness
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student provides honest, detailed self-assessment across all wellness dimensions. Identifies patterns and connections between dimensions. Demonstrates deep self-awareness and readiness for change. Assessment reveals sophisticated understanding. |
| **Meeting (3)** | Student completes self-assessment across all dimensions. Identifies areas of strength and growth. Shows honest self-reflection. Understands connections between wellness areas. |
| **Approaching (2)** | Student completes basic self-assessment but lacks depth. May be unrealistic about strengths or weaknesses. Limited understanding of how dimensions connect. |
| **Beginning (1)** | Student does not complete meaningful self-assessment. Lacks self-awareness about wellness habits. |

### Criteria 2: Wellness Plan Quality
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Wellness Blueprint is comprehensive, personalized, and realistic. Covers all dimensions with specific, measurable goals. Daily, weekly, and monthly habits are well-designed. Plan reflects genuine personal investment. Shows evidence of early implementation. |
| **Meeting (3)** | Wellness Blueprint covers all dimensions. Goals are clear and achievable. Includes specific habits and timelines. Nutrition and fitness plans are realistic and personalized. |
| **Approaching (2)** | Wellness Blueprint covers some dimensions. Goals are vague or unrealistic. Plans lack specificity or personalization. |
| **Beginning (1)** | No meaningful wellness plan created. Goals are missing or impractical. No evidence of personal investment. |

### Criteria 3: Accountability and Implementation
| Level | Description |
|-------|-------------|
| **Exceeding (4)** | Student actively engages with accountability partner. Documents progress regularly. Adjusts plans based on experience. Demonstrates genuine lifestyle changes. Supports partner's wellness journey. |
| **Meeting (3)** | Student participates in accountability partnership. Tracks some progress. Shows effort toward goals. Communicates with partner regularly. |
| **Approaching (2)** | Student has limited engagement with accountability partnership. Minimal progress tracking. Shows little evidence of implementation. |
| **Beginning (1)** | Student does not engage with accountability partnership. No progress tracking. No evidence of implementation or intent. |

### Overall Module Score
| Score Range | Performance Level |
|-------------|-------------------|
| 10-12 | Exceeding Expectations |
| 7-9 | Meeting Expectations |
| 4-6 | Approaching Expectations |
| 3 | Beginning |
`,
    },
  ];

  await db.insert(curriculumDocuments).values(documents).onConflictDoNothing();
}
