import { lessons } from "@shared/schema";

export async function seedAdditionalLessons(db: any): Promise<void> {
  const allLessons = [

    // ============================================================
    // LEVEL 1 MODULE 1: What is AI? (Grade 3-5) - needs lesson 3
    // ============================================================
    {
      id: "lesson_level_1_module_1_3",
      moduleId: "level_1_module_1",
      lessonNumber: 3,
      title: "AI Helpers in Our World",
      durationMinutes: 20,
      activityType: "sorting",
      activityData: JSON.stringify({
        categories: ["Uses AI", "Does NOT Use AI"],
        items: [
          { text: "A voice assistant answering your question", category: "Uses AI" },
          { text: "A regular light switch", category: "Does NOT Use AI" },
          { text: "A video game character that learns your moves", category: "Uses AI" },
          { text: "A paper book on a shelf", category: "Does NOT Use AI" },
          { text: "A phone suggesting what word you want to type", category: "Uses AI" },
          { text: "A wind-up toy car", category: "Does NOT Use AI" },
          { text: "A website showing you videos you might like", category: "Uses AI" },
          { text: "A regular alarm clock", category: "Does NOT Use AI" },
        ],
        instructions: "Sort these items! Decide whether each one uses AI or not. Think about whether it needs to learn or make decisions.",
      }),
      content: `## AI Helpers in Our World

Now that you know what AI is and have met Alex, let's look more closely at how AI helps people every single day. You might be surprised at how many AI helpers are already in your life!

### AI at Home

Your home probably has more AI than you realize:

- **Smart speakers** listen to your voice and try to understand what you are asking. They use AI to figure out your words and find the best answer.
- **Streaming services** like Netflix or YouTube use AI to suggest shows and videos. The AI notices what you watch and tries to find more things you will enjoy.
- **Smart thermostats** learn when your family is home and adjusts the temperature automatically. That is AI working behind the scenes!

### AI at School

AI is showing up in schools too:

- **Reading apps** that adjust to your level use AI to pick the right difficulty for you.
- **Math games** that get harder or easier based on how you are doing use AI to help you learn at your own pace.
- **Spelling checkers** use AI to catch your mistakes and suggest corrections.

### AI in the Community

Out in the world, AI is helping in big ways:

- **Hospitals** use AI to help doctors spot diseases in X-rays and scans.
- **Weather forecasters** use AI to predict if it will rain or snow.
- **Farmers** use AI to figure out when to water their crops.
- **Self-driving cars** use AI to see the road and avoid obstacles.

### Not Everything is AI

It is important to know that not everything with a screen or a button is AI. A regular calculator follows simple rules but does not learn. A microwave heats food but does not get smarter over time. AI is special because it **learns from information** and **gets better with practice**.

### Reflection

Think about your day from morning to night. How many times did AI help you without you even noticing? You are becoming an AI detective, and that is a superpower!`,
    },

    // ============================================================
    // LEVEL 1 MODULE 2: Talking to AI (Grade 3-5) - needs lessons 2, 3
    // ============================================================
    {
      id: "lesson_level_1_module_2_2",
      moduleId: "level_1_module_2",
      lessonNumber: 2,
      title: "The 5 Ws of Great Prompts",
      durationMinutes: 20,
      activityType: "matching",
      activityData: JSON.stringify({
        pairs: [
          { term: "WHO", definition: "Who should the AI pretend to be or write about?" },
          { term: "WHAT", definition: "What do you want the AI to make or do?" },
          { term: "WHEN", definition: "Is there a time period or deadline?" },
          { term: "WHERE", definition: "Is there a place or setting involved?" },
          { term: "WHY", definition: "What is the purpose or reason?" },
        ],
        instructions: "Match each W question to what it helps you tell the AI. Using all 5 Ws makes your prompts super clear!",
      }),
      content: `## The 5 Ws of Great Prompts

You already know that clear instructions help AI give better answers. Today we are going to learn a secret formula that makes your prompts even better: the 5 Ws!

### What Are the 5 Ws?

Reporters use the 5 Ws to write great news stories. You can use them to write great AI prompts:

- **WHO** - Who is involved? Who should the AI be?
- **WHAT** - What do you want? What kind of output?
- **WHEN** - When does this take place? Any time details?
- **WHERE** - Where is the setting? Any location details?
- **WHY** - Why do you need this? What is the purpose?

### Let's See the 5 Ws in Action

**Without 5 Ws:** "Write about animals."

**With 5 Ws:** "Write a short story about a **brave penguin** (WHO) who goes on an **adventure** (WHAT) **during winter** (WHEN) **at the South Pole** (WHERE) **to find food for its family** (WHY)."

See the difference? The second prompt gives AI so much more to work with!

### Practice Round

Try adding the 5 Ws to these prompts:

**Prompt 1:** "Tell me about space."
- Better: "Tell me **three fun facts** (WHAT) about **Mars** (WHERE) that a **third grader** (WHO) would find interesting, for my **science report** (WHY) about **planets we might visit in the future** (WHEN)."

**Prompt 2:** "Draw a picture."
- Better: "Draw a picture of a **friendly robot** (WHO) **playing soccer** (WHAT) **in a park** (WHERE) **on a sunny day** (WHEN) to **decorate my notebook cover** (WHY)."

### You Do Not Always Need All 5

Sometimes you only need 2 or 3 of the Ws, and that is perfectly fine! The important thing is to give AI enough details so it knows what you really want. The more specific you are, the happier you will be with the result.

### Try It Yourself

Pick something you want to ask AI about. Before you type your prompt, write down at least 3 of the 5 Ws. Then put them all together into one clear sentence. You will be amazed at how much better the answer is!`,
    },
    {
      id: "lesson_level_1_module_2_3",
      moduleId: "level_1_module_2",
      lessonNumber: 3,
      title: "Fix the Prompt Challenge",
      durationMinutes: 20,
      activityType: "sorting",
      activityData: JSON.stringify({
        categories: ["Good Prompt", "Needs Improvement"],
        items: [
          { text: "Write a funny poem about a cat who loves pizza", category: "Good Prompt" },
          { text: "Do something", category: "Needs Improvement" },
          { text: "Explain why leaves change color in autumn using simple words", category: "Good Prompt" },
          { text: "Tell me stuff about things", category: "Needs Improvement" },
          { text: "List 5 animals that live in the ocean and one fun fact about each", category: "Good Prompt" },
          { text: "Make it better", category: "Needs Improvement" },
          { text: "Help", category: "Needs Improvement" },
          { text: "Draw a red dragon flying over a mountain at sunset", category: "Good Prompt" },
        ],
        instructions: "Sort these prompts! Which ones are clear enough for AI to understand, and which ones need more detail?",
      }),
      content: `## Fix the Prompt Challenge

Today we are putting everything you have learned together! You are going to become a Prompt Detective and figure out why some prompts work great and others leave AI confused.

### Why Do Some Prompts Fail?

When a prompt does not work well, it is usually because:

- It is **too vague** - AI does not know what you mean
- It is **too short** - AI does not have enough information
- It is **missing context** - AI does not know the purpose
- It uses **confusing words** - AI takes things very literally

### Detective Training: Spot the Problem

**Bad Prompt:** "Make a thing about dogs."
- Problem: What kind of thing? A story? A drawing? A list of facts?
- **Fixed:** "Write a short paragraph about why golden retrievers make great family pets."

**Bad Prompt:** "Help me with homework."
- Problem: What subject? What assignment? What grade level?
- **Fixed:** "Help me understand what causes volcanoes to erupt. Explain it like I am in 4th grade."

**Bad Prompt:** "Draw good."
- Problem: Draw what? What does "good" mean?
- **Fixed:** "Draw a colorful butterfly sitting on a sunflower in a garden."

### The Before and After Game

When you get an answer from AI that is not quite right, do not give up! Try these steps:

1. **Read the answer** - What went wrong?
2. **Think about your prompt** - Was something unclear?
3. **Add more detail** - Give AI the missing information
4. **Try again** - Submit your improved prompt

This is called **iterating**, and it is what real AI experts do every day!

### You Are Now a Prompt Expert

You have learned three big things about talking to AI:
- Be clear and specific
- Use the 5 Ws when you can
- Fix and improve your prompts when needed

These skills make you better at communicating with everyone, not just AI. Clear communication is one of the most important skills you can ever learn. Be proud of yourself!`,
    },

    // ============================================================
    // LEVEL 1 MODULE 3: AI Can Make Mistakes (Grade 3-5) - needs lessons 2, 3
    // ============================================================
    {
      id: "lesson_level_1_module_3_2",
      moduleId: "level_1_module_3",
      lessonNumber: 2,
      title: "Why AI Gets Confused",
      durationMinutes: 20,
      activityType: "matching",
      activityData: JSON.stringify({
        pairs: [
          { term: "Old information", definition: "AI learned from data that might be outdated" },
          { term: "Mixed-up facts", definition: "AI combines details from different topics incorrectly" },
          { term: "Missing context", definition: "AI does not understand the situation you are in" },
          { term: "Biased data", definition: "AI learned from information that was unfair or one-sided" },
          { term: "Literal thinking", definition: "AI takes your words exactly as stated, missing what you really mean" },
        ],
        instructions: "Match each reason AI makes mistakes with its explanation. Understanding WHY AI gets confused helps you become a better AI guide!",
      }),
      content: `## Why AI Gets Confused

We already know that AI can make mistakes. But have you ever wondered WHY? Understanding why AI gets confused will make you even smarter about using it!

### Reason 1: Old Information

AI learns from books, websites, and articles. But some of that information is old! Imagine studying from a science book written 50 years ago. Back then, people thought Pluto was a planet. AI might have some old facts mixed in with new facts, and it does not always know which is which.

### Reason 2: Mixed-Up Facts

AI reads so much information that sometimes it gets details mixed up. It might accidentally combine facts about two different animals or mix up dates from history. This is like when you remember a story but accidentally swap some details around.

### Reason 3: Missing Context

AI does not know everything about YOUR life. If you ask "What should I wear today?" AI does not know where you live, what the weather is like, or if you have a special event. Without context, AI has to guess, and guesses can be wrong.

### Reason 4: Biased Data

If AI reads 100 stories where the doctor is always a man, it might start to think doctors are always men. But that is not true at all! This is called **bias**, and it happens when AI learns from information that does not show the full picture.

### Reason 5: AI Takes Things Literally

If you say "Break a leg!" most people know you mean "Good luck!" But AI might think you are actually talking about breaking a bone. AI does not always understand jokes, sayings, or sarcasm.

### What Can You Do?

Now that you know WHY AI makes mistakes, you can:
- Always double-check important facts
- Give AI lots of context about your situation
- Ask a trusted adult when something does not sound right
- Remember that AI is a helper, not an expert on everything

You are already so much smarter about AI than most adults. That is something to be really proud of!`,
    },
    {
      id: "lesson_level_1_module_3_3",
      moduleId: "level_1_module_3",
      lessonNumber: 3,
      title: "Be a Fact-Checking Superhero",
      durationMinutes: 20,
      activityType: "sorting",
      activityData: JSON.stringify({
        categories: ["Trustworthy Source", "Not Always Reliable"],
        items: [
          { text: "A teacher or librarian", category: "Trustworthy Source" },
          { text: "A random website you have never seen before", category: "Not Always Reliable" },
          { text: "An encyclopedia or reference book", category: "Trustworthy Source" },
          { text: "A social media post from a stranger", category: "Not Always Reliable" },
          { text: "A parent or guardian", category: "Trustworthy Source" },
          { text: "A comment on a YouTube video", category: "Not Always Reliable" },
          { text: "A museum or science center website", category: "Trustworthy Source" },
          { text: "Something AI said without checking", category: "Not Always Reliable" },
        ],
        instructions: "Sort these sources! Which ones can you trust to verify information, and which ones should you be careful about?",
      }),
      content: `## Be a Fact-Checking Superhero

Today you are going to earn your Fact-Checking Superhero cape! You already know AI can make mistakes. Now let's learn exactly HOW to check if information is correct.

### Step 1: The Pause

When AI tells you something, do not just accept it right away. Take a pause and ask yourself: "Does this sound right?" Your own brain is amazing at spotting things that seem a little off.

### Step 2: The Source Check

Not all sources of information are equally trustworthy. Here is a guide:

**Super Trustworthy:**
- Teachers, librarians, and parents
- Encyclopedias and textbooks
- Museums, science centers, and government websites
- Books written by experts

**Be Careful:**
- Random websites you have never heard of
- Social media posts
- Comments from strangers online
- AI-generated answers that have not been checked

### Step 3: The Two-Source Rule in Action

Let's practice! Imagine AI tells you: "Elephants can jump really high."

- **Source 1 (AI):** Elephants can jump really high.
- **Source 2 (Science book):** Actually, elephants are one of the few animals that CANNOT jump at all!

The AI was wrong! And you caught it because you checked.

### Step 4: What to Do When You Find a Mistake

1. Do not panic. Mistakes happen.
2. Use the correct information from your reliable source.
3. Tell a friend or family member what you learned.
4. Feel proud! You just outsmarted AI!

### Your Superpower

Being able to tell the difference between true and false information is one of the most important skills in the world today. Many adults struggle with this! By learning fact-checking now, you have a real superpower.

### Your Mission

This week, ask AI two questions about animals. Then look up the answers in a book or ask a trusted adult. Did AI get it right? Write down what you found!`,
    },

    // ============================================================
    // LEVEL 1 MODULE 4: Creating with AI (Grade 3-5) - needs lessons 2, 3
    // ============================================================
    {
      id: "lesson_level_1_module_4_2",
      moduleId: "level_1_module_4",
      lessonNumber: 2,
      title: "Story Building with AI",
      durationMinutes: 25,
      activityType: "writing",
      activityData: JSON.stringify({
        prompt: "Write the beginning of a story (2-3 sentences) about a character you invent. Include the character's name, what makes them special, and where they live. Then think about what AI could help you add to your story!",
        instructions: "Start your creative story. Remember, YOU are the author and AI is your writing helper!",
      }),
      content: `## Story Building with AI

Today we are going to become authors! You will learn how to team up with AI to create the most amazing stories ever. Remember: your imagination is the engine, and AI is like a turbo boost!

### How Authors Use AI

Real authors sometimes use AI to help them with their writing. Here is how:

- **Brainstorming:** "Give me 5 ideas for a story about a kid who discovers a hidden world."
- **Descriptions:** "Describe what a magical forest would look, sound, and smell like."
- **Character names:** "Suggest 3 names for a brave young explorer."
- **Plot ideas:** "What could go wrong on an adventure to find a lost treasure?"

### The Author's Process

Great stories have these parts, and you can ask AI to help with each one:

1. **Characters** - Who is in your story? Give them a name, a personality, and something they want.
2. **Setting** - Where and when does your story happen? A castle? Outer space? Your school?
3. **Problem** - Every good story has a problem the character needs to solve.
4. **Adventure** - What exciting things happen while solving the problem?
5. **Ending** - How does everything work out?

### Your Creative Voice Matters

Here is the most important part: AI can help you build your story, but YOUR ideas are what make it special. Nobody in the whole world has the same imagination as you. Nobody sees the world exactly the way you do. That is what makes your stories unique.

### Story Starter Example

You write: "Luna is a girl who can talk to animals."
AI helps: "Luna lived in a small cottage at the edge of Whispering Woods. Every morning, the bluebirds would tell her the forest news, and the rabbits would share stories from underground."
You decide what happens next!

### Tips for Working with AI on Stories

- Start with YOUR idea first
- Ask AI to help with specific parts
- Change anything AI suggests to match YOUR vision
- Always add your own twist
- Read your story out loud to make sure it sounds like YOU

You are a real author now. How exciting is that!`,
    },
    {
      id: "lesson_level_1_module_4_3",
      moduleId: "level_1_module_4",
      lessonNumber: 3,
      title: "Your Creative Showcase",
      durationMinutes: 25,
      activityType: "emotion_checkin",
      activityData: JSON.stringify({
        emotions: ["Proud", "Excited", "Creative", "Inspired", "Nervous", "Happy"],
        prompt: "You have learned so much about creating with AI! How do you feel about being a creator who uses AI as a tool?",
      }),
      content: `## Your Creative Showcase

Congratulations! You have reached the end of your first big chapter in learning about AI. Today is all about celebrating what you have learned and created!

### Look How Far You Have Come

Think about everything you know now that you did not know before:

- You know what AI is and where it lives in our world
- You know how to give AI clear, specific instructions
- You know that AI can make mistakes and how to check its work
- You know how to use AI as a creative tool
- You know that YOU are always the creator, and AI is your helper

That is incredible! Most adults do not know all of these things!

### The Creator's Mindset

Being a creator means:
- **Having ideas** that nobody else has thought of
- **Being brave** enough to try something new
- **Not giving up** when the first try does not work
- **Sharing** your creations with people you care about
- **Being kind** about other people's creations too

### Ways to Create with AI

Here are some fun ways you can keep creating:

- **Stories and poems** - Write adventures, fairy tales, or funny poems
- **Art descriptions** - Describe the coolest picture you can imagine
- **Inventions** - Design a new toy, game, or gadget with AI's help
- **Songs** - Write lyrics about something you love
- **Letters** - Write a letter to someone special with AI helping you find the right words

### Sharing Your Work

When you share something you made with AI, always be honest! You can say: "I created this with AI's help!" That is nothing to be embarrassed about. Artists use brushes, musicians use instruments, and creators use AI. They are all tools that help bring your ideas to life.

### What Comes Next

You are ready for the next level of your AI journey! In the next module, you will learn even more advanced ways to work with AI. You will become a true AI Guide.

### One Last Thing

Always remember this: technology changes, but creativity is forever. Your ideas, your feelings, your imagination - those are things that no AI can ever replace. You are one of a kind, and the world needs YOUR creations.

Keep creating. Keep learning. Keep being amazing!`,
    },

    // ============================================================
    // LEVEL 2 MODULE 1: The Art of Asking (Grade 3-5) - needs 3 lessons
    // ============================================================
    {
      id: "lesson_level_2_module_1_1",
      moduleId: "level_2_module_1",
      lessonNumber: 1,
      title: "Becoming a Prompt Builder",
      durationMinutes: 25,
      activityType: "matching",
      activityData: JSON.stringify({
        pairs: [
          { term: "Role", definition: "Tell AI WHO to be (e.g., a friendly teacher)" },
          { term: "Task", definition: "Tell AI WHAT to do (e.g., explain photosynthesis)" },
          { term: "Format", definition: "Tell AI HOW to present it (e.g., as a list)" },
          { term: "Audience", definition: "Tell AI WHO it is for (e.g., a 4th grader)" },
          { term: "Tone", definition: "Tell AI what FEELING to use (e.g., fun and exciting)" },
        ],
        instructions: "Match each part of a great prompt with what it tells the AI. Using all these parts makes your prompts super powerful!",
      }),
      content: `## Becoming a Prompt Builder

Welcome to Level 2! You already know the basics of talking to AI. Now it is time to become a real Prompt Builder. Think of yourself as an architect who designs instructions so well that AI creates exactly what you need.

### The Prompt Building Blocks

Every great prompt can use these building blocks:

**1. Role** - Tell AI who to be
- "You are a friendly science teacher..."
- "You are a pirate telling a story..."
- "You are a sports announcer..."

**2. Task** - Tell AI what to do
- "Explain how rainbows form..."
- "Write a short story about..."
- "Create a quiz about..."

**3. Format** - Tell AI how to present it
- "Make it a numbered list..."
- "Write it as a poem..."
- "Present it as a conversation..."

**4. Audience** - Tell AI who it is for
- "For a 9-year-old..."
- "For someone who has never heard of this..."
- "For my class presentation..."

**5. Tone** - Tell AI what feeling to use
- "Make it fun and exciting..."
- "Keep it calm and reassuring..."
- "Use a silly, humorous voice..."

### Putting It All Together

Here is a prompt that uses ALL the building blocks:

"**You are a friendly science teacher** (Role). **Explain how volcanoes erupt** (Task) **as a numbered list with simple words** (Format) **for a 4th grader** (Audience). **Make it exciting like an adventure story** (Tone)."

Compare that to just saying "Tell me about volcanoes." The difference is huge!

### Practice Makes Progress

You do not have to use all 5 building blocks every time. Sometimes 2 or 3 is enough. The point is to give AI enough detail so it understands what you really want.

### Your Challenge

Try building 3 prompts today using at least 3 building blocks each. Notice how much better your results are!`,
    },
    {
      id: "lesson_level_2_module_1_2",
      moduleId: "level_2_module_1",
      lessonNumber: 2,
      title: "Before and After: Prompt Makeovers",
      durationMinutes: 25,
      activityType: "sorting",
      activityData: JSON.stringify({
        categories: ["Basic Prompt", "Expert Prompt"],
        items: [
          { text: "Tell me about dogs", category: "Basic Prompt" },
          { text: "List 5 fun facts about golden retrievers for a pet care poster, written for kids ages 8-10", category: "Expert Prompt" },
          { text: "Help with math", category: "Basic Prompt" },
          { text: "Explain how to multiply 2-digit numbers step by step, like a patient tutor, for a 3rd grader", category: "Expert Prompt" },
          { text: "Write something", category: "Basic Prompt" },
          { text: "Write a 4-line poem about spring using rhyming words, in a cheerful tone", category: "Expert Prompt" },
        ],
        instructions: "Sort these prompts into Basic and Expert categories. Notice how Expert prompts include specific details!",
      }),
      content: `## Before and After: Prompt Makeovers

Today we are going to see the power of prompt improvement in action! You will be amazed at how much better results can be when you take a basic prompt and give it a makeover.

### The Power of Details

Think about ordering food at a restaurant. Which gets you a better meal?

- "Give me food." (Confusing! What kind? How much?)
- "I would like a grilled cheese sandwich with tomato soup, please." (Perfect! The kitchen knows exactly what to make.)

AI works the same way. Let's look at some real prompt makeovers.

### Makeover 1: The Science Question

**Before:** "Tell me about the moon."
- AI gives a long, random article about the moon. Some of it is too hard. Some of it is boring.

**After:** "Explain 3 cool things about the moon that would surprise a 4th grader. Use simple words and include one thing about what it would feel like to walk on the moon."
- AI gives exactly 3 fun facts, at the right level, including a fun description about bouncing around in low gravity!

### Makeover 2: The Creative Request

**Before:** "Write a story."
- AI writes a random, generic story that does not feel special.

**After:** "Write a short adventure story about a kid named Jamie who finds a talking map in their backpack. Make it exciting and end with a cliffhanger."
- AI writes an exciting, personalized story that you actually want to read!

### Makeover 3: The Homework Helper

**Before:** "Help with my report."
- AI does not know what subject, what grade, or what the assignment is.

**After:** "Help me outline a 1-page report about butterflies for my 4th grade science class. Include 3 main sections: life cycle, types of butterflies, and why they are important."
- AI creates a clear, useful outline that matches your exact assignment!

### The Iteration Trick

Sometimes your first improved prompt still is not perfect. That is totally normal! Real AI experts go back and forth with AI, making their prompts better each time. This is called **iteration**, and it is how professionals work.

### Remember

You are not just learning to talk to AI. You are learning to communicate clearly, and that is a life skill that will help you in everything you do!`,
    },
    {
      id: "lesson_level_2_module_1_3",
      moduleId: "level_2_module_1",
      lessonNumber: 3,
      title: "Prompt Chains: Asking Follow-Up Questions",
      durationMinutes: 30,
      activityType: "discussion",
      activityData: JSON.stringify({
        prompt: "Think of a topic you are curious about. Write your first prompt, then write two follow-up questions you would ask AI to learn more. How does each question build on what came before?",
        instructions: "Practice building a prompt chain! Start with a broad question and narrow it down with follow-ups.",
      }),
      content: `## Prompt Chains: Asking Follow-Up Questions

Here is a secret that makes you an even better AI user: you do not have to get everything in one prompt! You can have a CONVERSATION with AI, building on each answer to dig deeper and learn more.

### What Is a Prompt Chain?

A prompt chain is when you ask AI a series of connected questions, each one building on the last. It is like peeling an onion: each layer reveals something new.

### Example Prompt Chain

**Prompt 1:** "What are the biggest animals in the ocean?"
- AI lists whales, whale sharks, giant squid, etc.

**Prompt 2:** "Tell me more about blue whales. How big are they compared to things I know?"
- AI explains that a blue whale is as long as 3 school buses!

**Prompt 3:** "What do blue whales eat? It seems weird that the biggest animal eats tiny things."
- AI explains about krill and baleen filtering.

**Prompt 4:** "If blue whales are so big, do they have any predators?"
- AI discusses orca pods and how they sometimes work together.

See how each question leads naturally to the next? You went from a basic question to becoming a blue whale expert!

### Tips for Great Prompt Chains

1. **Start broad, then narrow down** - Begin with a general question, then zoom in on what interests you most.
2. **Use AI's answer in your next question** - Reference what AI just told you. "You mentioned that... tell me more about that."
3. **Ask "why" and "how"** - These questions dig deeper than "what" questions.
4. **Change direction if you want** - If something unexpected catches your attention, follow that path!
5. **Summarize at the end** - Ask AI to summarize everything you learned into a short paragraph.

### Why Prompt Chains Matter

Prompt chains teach you to think like a researcher. You start with curiosity, ask questions, follow leads, and build knowledge. This is exactly what scientists, journalists, and detectives do!

### Your Challenge

Pick any topic that interests you: an animal, a place, a sport, a hobby. Start with one question and build a chain of at least 4 follow-up questions. See how much of an expert you can become in just a few minutes!`,
    },

    // ============================================================
    // LEVEL 2 MODULE 2: AI Ethics & Responsibility (Grade 3-5) - needs 3 lessons
    // ============================================================
    {
      id: "lesson_level_2_module_2_1",
      moduleId: "level_2_module_2",
      lessonNumber: 1,
      title: "What Is Fairness in AI?",
      durationMinutes: 25,
      activityType: "sorting",
      activityData: JSON.stringify({
        categories: ["Fair Use of AI", "Unfair Use of AI"],
        items: [
          { text: "Using AI to help you understand a hard math concept", category: "Fair Use of AI" },
          { text: "Using AI to write your entire homework and saying you did it", category: "Unfair Use of AI" },
          { text: "Asking AI to help brainstorm ideas for a project", category: "Fair Use of AI" },
          { text: "Using AI to make fun of someone at school", category: "Unfair Use of AI" },
          { text: "Using AI to translate a message for a friend who speaks another language", category: "Fair Use of AI" },
          { text: "Using AI to spread false information about someone", category: "Unfair Use of AI" },
          { text: "Using AI to practice spelling words", category: "Fair Use of AI" },
          { text: "Copying AI's answer on a test", category: "Unfair Use of AI" },
        ],
        instructions: "Sort these situations! Is each one a fair or unfair way to use AI? Think about whether it helps or harms people.",
      }),
      content: `## What Is Fairness in AI?

Today we are going to talk about something really important: using AI in ways that are fair and kind. Just like with any powerful tool, AI can be used for good or for harm. Learning the difference makes you a responsible AI user.

### The Help or Harm Test

Before using AI for anything, ask yourself one simple question: **"Does this help or harm?"**

- Does it help someone learn? That is great!
- Does it help someone feel better? Wonderful!
- Does it trick or deceive someone? That is harmful.
- Does it make someone feel bad? That is harmful.

### Using AI Honestly

One of the trickiest things about AI is knowing when it is OK to use it and when it is not. Here is a good guide:

**It IS OK to:**
- Ask AI to explain something you do not understand
- Use AI to brainstorm ideas (then do the work yourself)
- Have AI quiz you on material you are studying
- Use AI to check your spelling and grammar

**It is NOT OK to:**
- Have AI do your homework and pretend you did it
- Copy AI's answers on a test
- Use AI to create something mean about someone
- Pretend AI's work is all your own without saying AI helped

### Why Honesty Matters

When you let AI do all the work for you, you miss the chance to learn. It is like having someone else exercise for you. They would get stronger, but you would stay the same! The struggle of learning is what makes your brain grow.

### AI and Kindness

AI should never be used to hurt other people. Even though AI does not have feelings, the things you create with AI can affect real people with real feelings. Always ask: "Would I be proud to show this to my teacher or my parents?"

### Your Responsibility

You are part of the first generation growing up with AI. How you choose to use it sets an example for everyone who comes after you. That is a big deal, and you are ready for it!`,
    },
    {
      id: "lesson_level_2_module_2_2",
      moduleId: "level_2_module_2",
      lessonNumber: 2,
      title: "Understanding AI Bias",
      durationMinutes: 25,
      activityType: "matching",
      activityData: JSON.stringify({
        pairs: [
          { term: "Bias", definition: "When AI treats some groups unfairly because of its training data" },
          { term: "Training data", definition: "The information AI learns from, which might not include everyone" },
          { term: "Stereotype", definition: "An unfair belief about a whole group of people" },
          { term: "Representation", definition: "Making sure all types of people are included" },
          { term: "Fairness", definition: "Treating everyone equally and with respect" },
        ],
        instructions: "Match each word about AI fairness with its meaning. Understanding these ideas helps you spot when AI is being unfair!",
      }),
      content: `## Understanding AI Bias

Today we are going to learn about something called bias, and why it matters when it comes to AI. This is one of the most important topics in all of AI education!

### What Is Bias?

Bias means leaning unfairly in one direction. Imagine a basketball referee who always calls fouls on one team but never the other. That referee is biased! It is not fair, and it changes the game.

### How Does AI Become Biased?

AI learns from data, which is information created by humans. And humans are not perfect! Here is how bias sneaks into AI:

**Example 1:** If AI reads 1,000 stories where firefighters are always men, it might start to think firefighters can only be men. But we know that is not true! Women are amazing firefighters too.

**Example 2:** If AI only sees photos of one type of family, it might not understand that families come in all shapes, sizes, and configurations.

**Example 3:** If AI learns from websites where certain groups of people are talked about negatively, it might repeat those unfair ideas.

### Being a Bias Detective

You can spot AI bias by asking these questions:

- Is AI showing only one type of person doing this job?
- Is AI making assumptions about someone based on how they look?
- Is AI leaving out certain groups of people?
- Does AI's answer sound like a stereotype?

### What You Can Do

When you notice AI being biased, you have power! You can:

1. **Speak up** - Tell a trusted adult what you noticed
2. **Ask AI to be more inclusive** - "Show me firefighters of all genders and backgrounds"
3. **Think critically** - Just because AI says something does not make it true or fair
4. **Be part of the solution** - When you grow up, you can help build fairer AI!

### You Are Making a Difference

By learning about bias now, you are already helping make the world more fair. The more people understand bias, the better we can fix it. You are an AI Ethics champion!`,
    },
    {
      id: "lesson_level_2_module_2_3",
      moduleId: "level_2_module_2",
      lessonNumber: 3,
      title: "The Does This Help or Harm Test",
      durationMinutes: 25,
      activityType: "emotion_checkin",
      activityData: JSON.stringify({
        emotions: ["Confident", "Thoughtful", "Empowered", "Concerned", "Determined", "Curious"],
        prompt: "After learning about AI ethics, how do you feel about your ability to use AI responsibly? Remember, caring about fairness shows real character!",
      }),
      content: `## The Does This Help or Harm Test

Today you are going to master the most important tool in your AI ethics toolkit: the Help or Harm test. This simple test can guide every decision you make about AI.

### The Test

Before you use AI for anything, ask these three questions:

1. **Does this help or harm PEOPLE?**
   - Will someone benefit from what you are creating?
   - Could someone be hurt, embarrassed, or tricked?

2. **Does this help or harm YOUR LEARNING?**
   - Are you using AI to understand something better?
   - Or are you skipping the learning part?

3. **Does this help or harm TRUST?**
   - Would you be comfortable showing this to your teacher?
   - Are you being honest about how you used AI?

### Real Scenarios

Let's practice the test with real situations:

**Scenario 1:** You use AI to help you understand a word problem in math, then solve it yourself.
- Helps people? Yes, you are learning!
- Helps your learning? Yes, you understand better now.
- Helps trust? Yes, you did the work.
- **VERDICT: HELP!**

**Scenario 2:** You copy AI's essay word-for-word for your book report.
- Helps people? Not really.
- Helps your learning? No, you did not learn to write.
- Helps trust? No, your teacher thinks you wrote it.
- **VERDICT: HARM!**

**Scenario 3:** You use AI to make a funny birthday card for your friend.
- Helps people? Yes, your friend will smile!
- Helps your learning? Yes, you are learning to be creative with AI.
- Helps trust? Yes, nothing dishonest here.
- **VERDICT: HELP!**

### Gray Areas

Sometimes the answer is not clear. That is OK! When you are not sure, here is what to do:

- **Ask a trusted adult** for their opinion
- **Think about how you would feel** if someone did this to you
- **When in doubt, do not do it** until you get guidance

### Your Ethics Pledge

You are now an AI Ethics champion. You understand fairness, bias, and the Help or Harm test. These are not just AI skills. These are life skills that will serve you forever. The world needs kind, thoughtful people like you to guide how AI is used!`,
    },

    // ============================================================
    // LEVEL 2 MODULE 3: AI as a Learning Tool (Grade 3-5) - needs 3 lessons
    // ============================================================
    {
      id: "lesson_level_2_module_3_1",
      moduleId: "level_2_module_3",
      lessonNumber: 1,
      title: "Your AI Study Buddy",
      durationMinutes: 25,
      activityType: "matching",
      activityData: JSON.stringify({
        pairs: [
          { term: "Explain differently", definition: "Ask AI to teach the same idea in a new way" },
          { term: "Practice quiz", definition: "Ask AI to test your knowledge with questions" },
          { term: "Simplify", definition: "Ask AI to use easier words for a hard concept" },
          { term: "Give examples", definition: "Ask AI for real-world situations that show the idea" },
          { term: "Summarize", definition: "Ask AI to shorten a long passage into key points" },
        ],
        instructions: "Match each study strategy with what it means. These are all ways AI can help you learn better!",
      }),
      content: `## Your AI Study Buddy

Have you ever wished you had a tutor who was always available, never got tired, and could explain things in a hundred different ways? That is exactly what AI can be for you: the ultimate study buddy!

### How AI Can Help You Learn

AI is an amazing learning tool when you use it the right way. Here are some powerful strategies:

**Strategy 1: Explain It Differently**
If you do not understand something from your textbook, ask AI to explain it another way! "I do not understand how fractions work. Can you explain it using a pizza example?" AI can find the explanation that clicks for YOUR brain.

**Strategy 2: Practice Quizzes**
Ask AI to quiz you! "Give me 5 multiple-choice questions about the water cycle." Then check your answers and ask AI to explain any you got wrong.

**Strategy 3: Simplify Hard Words**
"What does 'photosynthesis' mean? Explain it like I am 9 years old." AI can break down big, complicated words into ideas you already understand.

**Strategy 4: Real-World Examples**
"Give me 3 real-world examples of how gravity works in everyday life." AI can connect school concepts to things you see and do every day.

**Strategy 5: Summarize**
"Summarize this chapter about the American Revolution in 5 bullet points." AI can help you find the key ideas in long readings.

### The Most Important Rule

AI should help you UNDERSTAND, not do the work FOR you. Here is the difference:

- **Learning:** "Help me understand why plants need sunlight" then YOU write about it
- **Cheating:** "Write my plant report for me"

When you use AI to learn, your brain gets stronger. When AI does the work, your brain misses out!

### Finding Your Learning Style

Everyone learns differently! Some people learn best by reading, others by seeing pictures, and others by hearing explanations. AI can help you figure out YOUR best learning style by presenting information in different ways.

### Your Study Buddy Agreement

Repeat after me: "I will use AI to help me understand, not to skip the learning. My brain is amazing, and AI is just here to help it grow!"`,
    },
    {
      id: "lesson_level_2_module_3_2",
      moduleId: "level_2_module_3",
      lessonNumber: 2,
      title: "Research Like a Pro",
      durationMinutes: 30,
      activityType: "sorting",
      activityData: JSON.stringify({
        categories: ["Good Research Practice", "Poor Research Practice"],
        items: [
          { text: "Using AI to find key topics to research further", category: "Good Research Practice" },
          { text: "Copying AI's answer without checking if it is true", category: "Poor Research Practice" },
          { text: "Comparing AI's answer with a book or trusted website", category: "Good Research Practice" },
          { text: "Using only AI as your source for a school report", category: "Poor Research Practice" },
          { text: "Asking AI to explain a concept then writing about it in your own words", category: "Good Research Practice" },
          { text: "Believing everything AI says without question", category: "Poor Research Practice" },
        ],
        instructions: "Sort these research habits! Which ones will help you become a great researcher, and which ones could lead to mistakes?",
      }),
      content: `## Research Like a Pro

AI can be an incredible research assistant! But just like any assistant, you need to know how to work with it effectively. Today you will learn how to use AI for research the way real scientists and writers do.

### Step 1: Start with AI for Ideas

When you get a research assignment, AI is great for getting started. Try prompts like:

- "What are the most important things to know about [topic]?"
- "What are 5 interesting subtopics about [topic]?"
- "What questions should I answer in a report about [topic]?"

This gives you a roadmap for your research!

### Step 2: Go Deeper with Real Sources

After AI gives you ideas, dig deeper using reliable sources:

- Books and encyclopedias from your library
- Educational websites (.edu, .gov, museums)
- Articles recommended by your teacher
- Interviews with people who know about the topic

### Step 3: Use AI to Understand Hard Parts

When you find information that is confusing, bring it back to AI! "I read that 'the mitochondria is the powerhouse of the cell.' What does that mean in simple words?"

### Step 4: Write in YOUR Words

This is the most important step. After all your research, close all your sources and write what you learned in YOUR OWN words. If you cannot explain it without looking, you might need to study a little more.

### The Research Checklist

Before turning in any research project, check:
- Did I use at least 2 sources besides AI?
- Did I verify important facts?
- Did I write everything in my own words?
- Can I explain this topic to a friend without reading my notes?
- Did I give credit to my sources?

### Why This Matters

Research skills are among the most valuable abilities you can develop. In a world full of information, being able to find the truth, understand it, and explain it clearly is a superpower. AI is a helpful tool in this process, but YOUR critical thinking is what makes the difference.

### Challenge

Pick a topic you are curious about. Use AI to brainstorm 3 questions about it, then find the answers using at least one non-AI source. Write a short paragraph about what you learned!`,
    },
    {
      id: "lesson_level_2_module_3_3",
      moduleId: "level_2_module_3",
      lessonNumber: 3,
      title: "Critical Thinking About AI Answers",
      durationMinutes: 25,
      activityType: "reading",
      activityData: JSON.stringify({
        prompt: "Read an AI-generated answer about any topic. Then ask yourself: Does this sound right? Is anything missing? How would I verify this? Write down your thoughts.",
        instructions: "Practice your critical thinking skills by evaluating AI's responses carefully.",
      }),
      content: `## Critical Thinking About AI Answers

You are becoming a serious AI expert! Today we are going to sharpen one of the most important skills of all: critical thinking. This means not just reading what AI says, but really THINKING about whether it is correct and complete.

### What Is Critical Thinking?

Critical thinking means asking questions about information before accepting it. It does not mean being negative! It means being smart and careful. Critical thinkers ask:

- **Is this true?** Can I verify this with another source?
- **Is this complete?** Is AI leaving out important information?
- **Is this current?** Could this information be outdated?
- **Is this biased?** Is AI showing only one side of the story?
- **Does this make sense?** Does this match what I already know?

### Red Flags to Watch For

Here are some signs that AI might be wrong or incomplete:

- **Very specific numbers** - If AI gives you a very exact number (like "there are exactly 3,847 species of butterflies"), it might be making it up. Check!
- **Confident tone about uncertain things** - AI always sounds confident, even when it is wrong.
- **Missing "it depends"** - Many questions have complicated answers. If AI gives a simple answer to a complex question, dig deeper.
- **No sources mentioned** - If AI does not tell you where it got its information, be extra careful.

### The "Explain Your Thinking" Trick

Here is a powerful trick: after AI gives you an answer, ask it "Why do you think that?" or "Can you explain your reasoning?" Sometimes AI will admit it is not sure, or its reasoning will help you spot mistakes.

### Building Your Critical Thinking Muscle

Like any skill, critical thinking gets stronger with practice. Every time you question an answer, compare sources, or spot a mistake, your critical thinking muscle grows!

### Your Toolkit

You now have an amazing toolkit for learning with AI:
- You know how to ask great questions
- You know how to use AI as a study buddy
- You know how to research like a pro
- You know how to think critically about AI answers

These skills will help you succeed in school, in future jobs, and in life. You should feel really proud of how much you have grown!`,
    },

    // ============================================================
    // LEVEL 2 MODULE 4: Creating Solutions with AI (Grade 3-5) - needs 3 lessons
    // ============================================================
    {
      id: "lesson_level_2_module_4_1",
      moduleId: "level_2_module_4",
      lessonNumber: 1,
      title: "Problem Hunters: Finding Issues AI Can Help Solve",
      durationMinutes: 30,
      activityType: "sorting",
      activityData: JSON.stringify({
        categories: ["AI Could Help With This", "AI Cannot Solve This Alone"],
        items: [
          { text: "Organizing a messy schedule", category: "AI Could Help With This" },
          { text: "Being a good friend", category: "AI Cannot Solve This Alone" },
          { text: "Translating signs for visitors who speak other languages", category: "AI Could Help With This" },
          { text: "Giving someone a real hug when they are sad", category: "AI Cannot Solve This Alone" },
          { text: "Helping sort recycling from trash", category: "AI Could Help With This" },
          { text: "Deciding what is morally right", category: "AI Cannot Solve This Alone" },
          { text: "Finding patterns in weather data to predict storms", category: "AI Could Help With This" },
          { text: "Building real trust between people", category: "AI Cannot Solve This Alone" },
        ],
        instructions: "Sort these problems! Some can be helped by AI, and some require human qualities that AI does not have.",
      }),
      content: `## Problem Hunters: Finding Issues AI Can Help Solve

Welcome to the most exciting part of your AI journey so far! You are going to learn how to use AI to solve REAL problems in your community. This is where you go from learning about AI to actually making a difference with it!

### Be a Problem Hunter

The first step in creating solutions is noticing problems! Look around your school, home, and neighborhood. What could be better? Here are some places to look:

- **Your school** - What makes learning harder than it needs to be?
- **Your neighborhood** - What would make your community better?
- **Your home** - What daily frustrations could be made easier?
- **The environment** - How could we take better care of nature?
- **Your friends** - What challenges do kids your age face?

### Which Problems Can AI Help With?

AI is great at certain things:
- **Processing lots of information** quickly
- **Finding patterns** that humans might miss
- **Translating** between languages
- **Organizing and sorting** data
- **Creating content** like writing, images, and plans

But AI CANNOT:
- Feel emotions or truly care about people
- Make moral decisions about right and wrong
- Replace human connection and relationships
- Think creatively the way YOU can

### Real Kid-Led AI Solutions

Kids around the world have already used AI to make a difference:

- Students created an AI translator to help new students who speak different languages feel welcome at their school
- A group of kids used AI to sort and organize a neighborhood food drive
- Young people designed an AI-powered quiz game to help their classmates study

### Your Turn

Start a "Problem Journal" this week. Write down at least 3 problems you notice in your world. Next to each one, write whether AI could help and how. Bring your journal to our next lesson, and we will start brainstorming solutions!`,
    },
    {
      id: "lesson_level_2_module_4_2",
      moduleId: "level_2_module_4",
      lessonNumber: 2,
      title: "Designing Your AI Solution",
      durationMinutes: 30,
      activityType: "writing",
      activityData: JSON.stringify({
        prompt: "Describe a problem you have noticed at school, home, or in your community. Then explain how AI could help solve it. What would your solution look like? Who would it help?",
        instructions: "Design your very own AI-powered solution! Think about the problem, the people affected, and how AI could make things better.",
      }),
      content: `## Designing Your AI Solution

Now it is time to take one of the problems you identified and design an actual solution using AI! This is what real innovators do, and you are about to do it too.

### The Solution Design Process

**Step 1: Pick Your Problem**
Choose the problem you care about most. The best solutions come from problems that matter to you personally. If you are passionate about it, you will work harder and create something better.

**Step 2: Understand the People**
Who is affected by this problem? What do they need? The best solutions are designed WITH the people who will use them, not just FOR them. Talk to people! Ask them what would help.

**Step 3: Brainstorm with AI**
Use AI as your brainstorming partner:
- "I want to solve [problem]. What are some creative solutions?"
- "How have other people solved similar problems?"
- "What tools or resources would I need?"

**Step 4: Design Your Solution**
Draw, write, or describe your solution. Include:
- What it does
- Who it helps
- How AI is involved
- What humans need to do (AI is the helper, not the whole solution!)

**Step 5: Get Feedback**
Share your idea with friends, family, or teachers. Ask them: "Would this help? What could make it better?"

### Example Solution

**Problem:** New students at school feel lonely and confused.
**Solution:** An AI-powered welcome guide that:
- Answers common questions about the school
- Suggests clubs based on the student's interests
- Connects new students with buddy volunteers
- Is available in multiple languages
- But is SUPPORTED by real student volunteers who provide friendship

### Your Ideas Matter

Remember, every great invention started as someone's idea. The telephone, the internet, even AI itself! Someone noticed a problem and decided to solve it. That someone could be YOU.

### Next Steps

Get your design ready! In our next lesson, you will practice presenting your idea to others. Getting comfortable sharing your ideas is one of the most important skills you can develop.`,
    },
    {
      id: "lesson_level_2_module_4_3",
      moduleId: "level_2_module_4",
      lessonNumber: 3,
      title: "Presenting Your Solution",
      durationMinutes: 30,
      activityType: "emotion_checkin",
      activityData: JSON.stringify({
        emotions: ["Proud", "Nervous", "Excited", "Accomplished", "Inspired", "Confident"],
        prompt: "You have designed an AI solution to a real problem! How does it feel to be a young innovator? Whatever you are feeling is valid and wonderful.",
      }),
      content: `## Presenting Your Solution

This is it: the grand finale of Level 2! You have identified a problem, designed a solution, and now it is time to share your idea with the world. Presenting your ideas is a skill that will serve you for your entire life.

### Why Presenting Matters

Even the best idea in the world will not help anyone if nobody knows about it! When you present your solution, you are:
- Sharing your creativity and hard work
- Inspiring others to think about solutions too
- Getting feedback to make your idea even better
- Practicing a skill that leaders use every day

### Your Presentation Template

Here is a simple structure for presenting your solution:

**1. The Problem (30 seconds)**
"Have you ever noticed that [describe the problem]? This affects [who it affects] because [why it matters]."

**2. Your Solution (1 minute)**
"My solution is [describe it]. It uses AI to [explain the AI part]. It works by [how it works step by step]."

**3. Why It Matters (30 seconds)**
"This would help [who] by [how]. I chose this problem because [personal connection]."

**4. What You Learned (30 seconds)**
"Working on this taught me [what you learned about AI, about the problem, about yourself]."

### Presentation Tips

- **Speak clearly** and slowly. Being nervous is totally normal!
- **Make eye contact** with your audience.
- **Use examples** that people can relate to.
- **Be honest** about what AI can and cannot do.
- **Be proud** of your work. You earned this!

### Handling Questions

When people ask questions:
- It is OK to say "I do not know, but I would love to research that"
- Listen carefully before answering
- Thank people for their questions

### Celebration Time

You have completed an incredible journey! You went from learning what AI is to designing your own AI-powered solution. That is remarkable. Not many adults have done what you just did.

### What Is Next

Level 3 awaits! You will learn advanced techniques, dive deeper into how AI works, and tackle even bigger challenges. But take a moment to appreciate how far you have come. You are not just a learner anymore. You are an innovator!`,
    },

    // ============================================================
    // LEVEL 3 MODULE 1: Advanced Prompting (Grade 6-8) - needs 3 lessons
    // ============================================================
    {
      id: "lesson_level_3_module_1_1",
      moduleId: "level_3_module_1",
      lessonNumber: 1,
      title: "Prompt Patterns and Templates",
      durationMinutes: 35,
      activityType: "matching",
      activityData: JSON.stringify({
        pairs: [
          { term: "Role Prompting", definition: "Asking AI to take on a specific persona or expertise" },
          { term: "Chain-of-Thought", definition: "Asking AI to show its reasoning step by step" },
          { term: "Few-Shot Prompting", definition: "Giving AI examples of what you want before asking" },
          { term: "Constraint Setting", definition: "Defining rules and boundaries for AI's response" },
          { term: "Format Specification", definition: "Telling AI exactly how to structure the output" },
        ],
        instructions: "Match each advanced prompting technique with its description. These are the same methods professional AI engineers use!",
      }),
      content: `## Prompt Patterns and Templates

Welcome to Level 3. You are now moving beyond the basics into territory that most adults have not explored yet. The techniques you will learn here are the same ones used by professional prompt engineers at major tech companies.

### What Is Prompt Engineering?

Prompt engineering is the art and science of crafting instructions that get the best possible results from AI. It is an actual job title at companies like Google, OpenAI, and Microsoft. And you are about to learn the fundamentals.

### Pattern 1: Role Prompting

Instead of just asking AI a question, tell it WHO to be first.

**Basic:** "Explain photosynthesis."
**Role Prompt:** "You are a biology professor who is famous for making complex topics easy to understand. Explain photosynthesis to a middle school student, using analogies from everyday life."

The role gives AI a framework for HOW to respond, not just WHAT to respond about.

### Pattern 2: Chain-of-Thought

Ask AI to show its work, just like in math class.

**Basic:** "What is 15% of 230?"
**Chain-of-Thought:** "What is 15% of 230? Think through this step by step, showing each calculation."

This technique dramatically improves accuracy for complex problems because AI is less likely to skip steps.

### Pattern 3: Few-Shot Prompting

Show AI examples of what you want before making your request.

"Here are examples of good book summaries:
- 'The Giver': A boy discovers his perfect society hides a dark secret about emotions and memory.
- 'Hatchet': A teenager survives alone in the Canadian wilderness after a plane crash.

Now write a summary in the same style for 'Charlotte's Web'."

### Pattern 4: Constraints

Set clear boundaries for AI's response.

"Write a poem about the ocean. Constraints: exactly 4 lines, each line must be 8 words or fewer, use at least one metaphor, do not rhyme."

### Building Your Prompt Library

Start collecting prompts that work well for you. When you find a pattern that gives great results, save it! Professional prompt engineers maintain libraries of tested templates. You should too.

### Your Challenge

Take one homework assignment or project you are working on and apply at least two of these patterns. Compare the results to what you would have gotten with a basic prompt.`,
    },
    {
      id: "lesson_level_3_module_1_2",
      moduleId: "level_3_module_1",
      lessonNumber: 2,
      title: "Chain-of-Thought and Multi-Step Prompting",
      durationMinutes: 35,
      activityType: "writing",
      activityData: JSON.stringify({
        prompt: "Write a complex prompt that uses chain-of-thought reasoning. Pick a problem (math, science, logic puzzle) and ask AI to solve it step by step, showing all reasoning. Then evaluate whether AI's reasoning makes sense at each step.",
        instructions: "Practice creating prompts that force AI to think step by step. This is one of the most powerful techniques in prompt engineering!",
      }),
      content: `## Chain-of-Thought and Multi-Step Prompting

Today you are going to master one of the most powerful techniques in all of prompt engineering: getting AI to think step by step. This single technique can dramatically improve the quality of AI responses.

### Why Step-by-Step Matters

When AI jumps straight to an answer, it often makes mistakes. But when you ask it to think through the problem step by step, something interesting happens: the quality of its reasoning improves significantly. It is similar to how showing your work in math class helps you catch errors.

### Single-Step vs. Multi-Step

**Single-Step Prompt:** "Plan a school fundraiser."
- AI gives you a generic, surface-level plan.

**Multi-Step Prompt:**
"I need to plan a school fundraiser. Help me think through this step by step:
1. First, identify 3 possible fundraiser types and their pros/cons
2. Then, for the best option, outline the timeline from 6 weeks out
3. Next, list all the materials and people we would need
4. Finally, estimate costs and potential revenue"

See how breaking it into steps gives you a much more thorough result?

### The "Think Before You Answer" Technique

Add this phrase to complex questions: "Before answering, think through the possible approaches and evaluate each one."

**Example:** "I need to write a persuasive essay about why school should start later. Before writing, think through the strongest arguments on both sides, then help me build the most convincing case."

### Debugging AI Responses

When AI gives a wrong answer, instead of just trying again, ask it to explain its reasoning:

"You said X, but I think that might be wrong. Can you walk me through your reasoning step by step so we can find where the error might be?"

This is called **prompt debugging**, and it is a real skill used by AI professionals.

### Complex Problem Decomposition

For really complicated tasks, break them into separate prompts:

**Prompt 1:** "Research phase - What do I need to know about [topic]?"
**Prompt 2:** "Analysis phase - Based on this information, what are the key insights?"
**Prompt 3:** "Creation phase - Using these insights, create [output]."

### The Key Insight

The quality of AI output is directly related to the quality of your prompting. A well-structured, multi-step prompt consistently outperforms a vague, single-step one. This is not just a theory; it has been proven through research.

You are now thinking like a prompt engineer. That is a genuinely valuable skill in today's world.`,
    },
    {
      id: "lesson_level_3_module_1_3",
      moduleId: "level_3_module_1",
      lessonNumber: 3,
      title: "A/B Testing Your Prompts",
      durationMinutes: 35,
      activityType: "discussion",
      activityData: JSON.stringify({
        prompt: "Choose a task and write two different prompts for it. Compare the results. Which prompt produced better output? Why do you think that is? What would you change for version 3?",
        instructions: "Practice the scientific approach to prompt optimization by testing and comparing different prompt strategies.",
      }),
      content: `## A/B Testing Your Prompts

Scientists do not just guess what works. They test, compare, and optimize. Today you are going to apply the scientific method to prompt engineering through A/B testing.

### What Is A/B Testing?

A/B testing means comparing two versions of something to see which works better. Companies use A/B testing for everything from website designs to product names. You are going to use it for prompts.

### How to A/B Test Prompts

**Step 1:** Define what you want AI to produce (your goal)
**Step 2:** Write Version A of your prompt
**Step 3:** Write Version B with at least one meaningful change
**Step 4:** Run both prompts and compare results
**Step 5:** Analyze why one worked better
**Step 6:** Create Version C using what you learned

### Variables to Test

Here are things you can change between versions:

- **Length:** Short vs. detailed prompts
- **Role:** Different personas for AI
- **Structure:** Paragraph vs. numbered steps
- **Tone:** Formal vs. casual
- **Examples:** With vs. without examples
- **Constraints:** Loose vs. strict guidelines
- **Reasoning:** With vs. without chain-of-thought

### Example A/B Test

**Goal:** Get AI to explain the water cycle

**Version A:** "Explain the water cycle."
**Version B:** "You are a weather scientist. Explain the water cycle to a 7th grader using a real-world analogy. Include 4 stages and explain how each connects to the next."

**Results:** Version B produced a clearer, more engaging, and more accurate explanation.

**Analysis:** Why? Because Version B provided a role (scientist), audience (7th grader), technique (analogy), and structure (4 stages).

### Tracking Your Results

Keep a simple log:
- Date
- Prompt versions (A and B)
- Which one won
- What you think made the difference
- What you will try next time

Over time, you will develop instincts for what works. But even experienced prompt engineers still test and compare. It is part of the process.

### The Growth Mindset of Prompting

There is no such thing as a "perfect" prompt. There is always room for improvement. The best prompt engineers are the ones who are always experimenting, testing, and learning. Sound familiar? It is the same growth mindset you have been developing since Level 1!`,
    },

    // ============================================================
    // LEVEL 3 MODULE 2: AI, Society & Ethics (Grade 6-8) - needs 3 lessons
    // ============================================================
    {
      id: "lesson_level_3_module_2_1",
      moduleId: "level_3_module_2",
      lessonNumber: 1,
      title: "Algorithmic Bias in the Real World",
      durationMinutes: 35,
      activityType: "sorting",
      activityData: JSON.stringify({
        categories: ["Potential Bias Risk", "Lower Bias Risk"],
        items: [
          { text: "AI hiring system trained mostly on past employees from one background", category: "Potential Bias Risk" },
          { text: "AI weather prediction system using global satellite data", category: "Lower Bias Risk" },
          { text: "AI facial recognition that was only tested on light-skinned faces", category: "Potential Bias Risk" },
          { text: "AI spell-checker that works across all languages equally", category: "Lower Bias Risk" },
          { text: "AI loan approval trained on historical data from a discriminatory era", category: "Potential Bias Risk" },
          { text: "AI calculator that performs math operations", category: "Lower Bias Risk" },
        ],
        instructions: "Sort these AI systems by their bias risk. Think about what data they were trained on and who might be affected unfairly.",
      }),
      content: `## Algorithmic Bias in the Real World

You learned about AI bias in Level 2. Now it is time to go deeper and examine real cases where AI bias has caused actual harm to real people.

### What Is Algorithmic Bias?

An algorithm is a set of instructions that AI follows. When those instructions, or the data they are based on, contain unfair patterns, we get algorithmic bias. This is not just a theoretical problem. It affects real people's lives.

### Case Study 1: Hiring Algorithms

A major tech company built an AI to screen job applications. The AI was trained on the company's past hiring data. But for years, the company had mostly hired men. So the AI learned that being male was a positive trait for getting hired. It started penalizing applications that mentioned women's colleges or women's organizations. The company had to shut the system down.

**Lesson:** AI reproduces the patterns in its training data, including unfair ones.

### Case Study 2: Facial Recognition

Research has shown that some facial recognition systems work much better on light-skinned faces than dark-skinned faces. This is because the training data contained far more images of light-skinned people. When these systems are used by police, they can lead to false identifications, which has real consequences for innocent people.

**Lesson:** When training data does not represent everyone, the AI does not work for everyone.

### Case Study 3: Healthcare AI

An AI system used by hospitals to prioritize patient care was found to be systematically recommending less care for Black patients compared to white patients with the same conditions. The system used healthcare spending as a proxy for health needs, but historical spending disparities meant Black patients had historically received less care.

**Lesson:** Even well-intentioned AI can perpetuate historical inequalities.

### What Can Be Done?

- **Diverse training data** that represents all communities
- **Regular auditing** of AI systems for bias
- **Human oversight** for important decisions
- **Transparency** about how AI makes decisions
- **Accountability** when AI causes harm

### Your Role

As the generation growing up with AI, you have a unique responsibility and opportunity. You understand AI in ways that many policymakers do not. Your voice matters in this conversation. What kind of AI future do you want to build?`,
    },
    {
      id: "lesson_level_3_module_2_2",
      moduleId: "level_3_module_2",
      lessonNumber: 2,
      title: "AI's Environmental Impact",
      durationMinutes: 35,
      activityType: "matching",
      activityData: JSON.stringify({
        pairs: [
          { term: "Data center", definition: "A building full of computers that run AI, using massive amounts of electricity" },
          { term: "Carbon footprint", definition: "The total greenhouse gas emissions caused by an activity" },
          { term: "Training an AI model", definition: "Can use as much energy as five cars over their entire lifetime" },
          { term: "Sustainable AI", definition: "Developing AI in ways that minimize environmental harm" },
          { term: "E-waste", definition: "Discarded electronic equipment that pollutes the environment" },
        ],
        instructions: "Match each term about AI's environmental impact with its description. Understanding the cost of AI helps us use it more responsibly.",
      }),
      content: `## AI's Environmental Impact

AI is powerful, but power comes with costs. Today we are going to look at a side of AI that most people do not think about: its impact on the environment.

### The Hidden Cost of AI

Every time you ask AI a question, your request travels to a data center, which is basically a massive building filled with computers. Those computers use electricity. Lots of it.

### The Numbers

- Training a single large AI model can emit as much carbon as five cars over their entire lifetimes.
- Data centers worldwide use about 1-2% of the world's electricity, and that number is growing.
- The water used to cool data centers in some regions is significant enough to affect local water supplies.

### Why Should You Care?

You care about the planet. Most young people do. And part of being a responsible AI user is understanding that every AI interaction has an environmental cost, even if it is small.

This does not mean you should stop using AI. It means you should use it thoughtfully, just like you would with any resource.

### What Is Being Done?

The tech industry is working on solutions:
- **Renewable energy:** Many companies are powering data centers with solar and wind energy
- **Efficient models:** Researchers are creating AI models that use less energy
- **Better hardware:** New computer chips are designed to do more with less power
- **Smart scheduling:** Running AI tasks when renewable energy is most available

### What Can You Do?

- **Be intentional** with your AI use. Ask yourself if you really need AI for this task.
- **Avoid unnecessary requests.** Do not ask AI the same question 10 times if once gives a good answer.
- **Support sustainable tech.** When you are older and choosing products and companies, look for those committed to sustainability.
- **Spread awareness.** Most people have no idea about AI's environmental footprint.

### The Bigger Picture

Technology always has trade-offs. Cars give us mobility but produce emissions. Electricity powers our homes but has to come from somewhere. AI gives us incredible capabilities but uses resources. The key is finding the right balance and always pushing for more sustainable solutions.

### Discussion

What do you think is the right balance between AI's benefits and its environmental cost? Are there uses of AI that are worth the environmental impact, and some that are not? There is no single right answer, but thinking about it is important.`,
    },
    {
      id: "lesson_level_3_module_2_3",
      moduleId: "level_3_module_2",
      lessonNumber: 3,
      title: "Should AI Be Regulated?",
      durationMinutes: 40,
      activityType: "emotion_checkin",
      activityData: JSON.stringify({
        emotions: ["Concerned", "Hopeful", "Empowered", "Uncertain", "Motivated", "Thoughtful"],
        prompt: "After learning about AI's impact on society, how do you feel about the future of AI? Your feelings reflect your values, and they matter.",
      }),
      content: `## Should AI Be Regulated?

This is one of the biggest questions facing society today. Governments around the world are trying to figure out the rules for AI. And your generation will inherit the decisions being made right now.

### What Does Regulation Mean?

Regulation means creating rules and laws about how something can be used. We regulate lots of things:
- Cars must pass safety tests
- Medicine must be tested before being sold
- Food must meet health standards
- Buildings must follow safety codes

The question is: should AI be regulated too? And if so, how?

### Arguments FOR AI Regulation

- **Safety:** AI used in healthcare, transportation, and criminal justice needs to work correctly. Lives depend on it.
- **Fairness:** Without regulation, biased AI can discriminate against people without accountability.
- **Privacy:** AI can collect, analyze, and use personal data in ways people do not understand or consent to.
- **Transparency:** People have a right to know when AI is making decisions that affect them.
- **Accountability:** When AI causes harm, someone needs to be responsible.

### Arguments AGAINST Heavy Regulation

- **Innovation:** Too many rules could slow down beneficial AI development.
- **Complexity:** AI changes so fast that rules might be outdated before they are even implemented.
- **Competition:** If one country regulates heavily, AI development might just move to countries with fewer rules.
- **Unintended consequences:** Rules designed to fix one problem might create new ones.

### What Is Happening Around the World

Different countries are taking different approaches:
- The European Union has created comprehensive AI regulations
- The United States has taken a more sector-by-sector approach
- China has regulations focused on specific AI applications
- Many countries are still figuring out their strategy

### Your Voice Matters

You are not too young to have opinions about this. In fact, your perspective is especially valuable because AI will shape YOUR future more than anyone else's. Here are some questions to consider:

- What AI applications do you think need the most regulation?
- Who should make the rules? Governments? Tech companies? Both?
- How do we balance innovation with safety?
- What rights should people have regarding AI?

### Creating Your Own AI Ethics Framework

Before our next lesson, try writing 5 personal principles for how AI should be used. What rules would YOU create if you were in charge? This exercise is not just academic; your values will guide your relationship with AI for the rest of your life.`,
    },

    // ============================================================
    // LEVEL 3 MODULE 3: How AI Works (Grade 6-8) - needs 3 lessons
    // ============================================================
    {
      id: "lesson_level_3_module_3_1",
      moduleId: "level_3_module_3",
      lessonNumber: 1,
      title: "Machine Learning: Teaching Computers to Learn",
      durationMinutes: 35,
      activityType: "sorting",
      activityData: JSON.stringify({
        categories: ["Supervised Learning", "Unsupervised Learning"],
        items: [
          { text: "Training AI with labeled photos of cats and dogs", category: "Supervised Learning" },
          { text: "AI finding groups of similar customers without being told what to look for", category: "Unsupervised Learning" },
          { text: "Teaching AI to recognize spam emails using examples of spam and not-spam", category: "Supervised Learning" },
          { text: "AI discovering patterns in music preferences without predefined categories", category: "Unsupervised Learning" },
          { text: "Training AI on test questions with known correct answers", category: "Supervised Learning" },
          { text: "AI organizing news articles into topics it identifies on its own", category: "Unsupervised Learning" },
        ],
        instructions: "Sort these examples into the two main types of machine learning. Supervised learning uses labeled examples; unsupervised learning finds patterns on its own.",
      }),
      content: `## Machine Learning: Teaching Computers to Learn

You have been using AI for a while now. Today, we are going to look under the hood and understand HOW AI actually learns. This is where things get really interesting.

### What Is Machine Learning?

Machine learning (ML) is a type of AI where computers learn from data instead of being explicitly programmed for every task. Instead of writing rules for every situation, we show the computer thousands of examples and let it figure out the patterns.

### How Humans Learn vs. How AI Learns

**How you learned what a dog is:**
- You saw many dogs as a child
- Adults pointed and said "dog!"
- Eventually your brain learned the pattern: four legs, fur, tail, barks
- Now you can recognize dogs you have never seen before

**How AI learns what a dog is:**
- Researchers show AI millions of dog photos, each labeled "dog"
- AI looks for patterns in the pixels
- It learns features: fur texture, body shape, ear positions
- Now it can identify dogs in new photos it has never seen

The process is remarkably similar!

### Types of Machine Learning

**Supervised Learning:** AI learns from examples with correct answers provided. Like a teacher grading homework, the AI knows what the right answer should be and adjusts until it gets things right.

**Unsupervised Learning:** AI explores data without being told what to look for. It finds patterns and groupings on its own. Like sorting a pile of coins when nobody tells you to sort by color, size, or value; you figure out the categories yourself.

**Reinforcement Learning:** AI learns through trial and error, receiving rewards for good actions and penalties for bad ones. Like training a dog with treats, except the "dog" is a computer program.

### The Training Process

1. **Collect data** - Gather thousands or millions of examples
2. **Prepare data** - Clean and organize the examples
3. **Choose a model** - Select the type of AI architecture
4. **Train** - Show the AI examples and let it learn patterns
5. **Test** - Check if the AI works on new examples it has not seen
6. **Improve** - Adjust and retrain until performance is good enough

### Why This Matters to You

Understanding how AI learns helps you:
- Know why AI makes certain mistakes
- Understand why training data matters so much
- Appreciate the work that goes into building AI
- Think critically about AI claims and capabilities

You are now seeing AI not just as a tool, but as a system you can understand.`,
    },
    {
      id: "lesson_level_3_module_3_2",
      moduleId: "level_3_module_3",
      lessonNumber: 2,
      title: "Neural Networks: AI's Brain",
      durationMinutes: 40,
      activityType: "matching",
      activityData: JSON.stringify({
        pairs: [
          { term: "Neuron", definition: "A single processing unit that takes inputs and produces an output" },
          { term: "Layer", definition: "A group of neurons that process information at the same stage" },
          { term: "Weight", definition: "A number that determines how important each input is" },
          { term: "Training", definition: "The process of adjusting weights to improve accuracy" },
          { term: "Deep learning", definition: "Neural networks with many layers that can learn complex patterns" },
        ],
        instructions: "Match each neural network concept with its description. Neural networks are the technology behind most modern AI!",
      }),
      content: `## Neural Networks: AI's Brain

If machine learning is HOW AI learns, neural networks are the BRAIN that does the learning. This is the technology behind ChatGPT, image generators, voice assistants, and most of the AI you interact with daily.

### Inspired by the Human Brain

Your brain has about 86 billion neurons, each connected to thousands of others. When you think, learn, or remember, signals travel through networks of these neurons. Scientists looked at this and thought: what if we built something similar in a computer?

### How a Neural Network Works

Imagine a simple decision: "Is this a photo of a cat or a dog?"

**Input Layer:** The photo enters as numbers (pixel values)
**Hidden Layers:** Each layer looks for different features
- Layer 1 might detect edges and basic shapes
- Layer 2 might detect textures and patterns
- Layer 3 might detect ears, noses, tails
- Layer 4 might combine everything into "cat" or "dog"
**Output Layer:** The final answer: "87% likely a cat"

### The Learning Process

When the neural network gets an answer wrong, it adjusts its internal settings (called weights). It is like turning hundreds of knobs slightly until the music sounds right. After seeing millions of examples and making millions of tiny adjustments, the network becomes accurate.

### Deep Learning

When a neural network has many layers (sometimes hundreds), we call it "deep learning." These deep networks can learn incredibly complex patterns:
- Understanding human language
- Generating realistic images
- Translating between languages
- Playing complex games

### Large Language Models (LLMs)

The AI you chat with (like ChatGPT) is a type of neural network called a Large Language Model. It was trained on enormous amounts of text from the internet. It learned patterns about how words relate to each other, how sentences are structured, and how ideas connect.

When you ask it a question, it is not looking up an answer. It is predicting, word by word, what the most likely next word should be, based on all the patterns it learned. That is why it can be fluent but sometimes wrong; it is generating plausible text, not retrieving verified facts.

### Why Understanding This Matters

Knowing how AI works helps you:
- Understand why AI "hallucinates" (generates convincing but false information)
- Recognize that AI does not truly "understand" anything
- Appreciate both the power and limitations of current AI
- Make informed decisions about when to trust AI and when not to

This knowledge puts you ahead of most adults in understanding the technology that is reshaping our world.`,
    },
    {
      id: "lesson_level_3_module_3_3",
      moduleId: "level_3_module_3",
      lessonNumber: 3,
      title: "Types of AI Systems",
      durationMinutes: 35,
      activityType: "sorting",
      activityData: JSON.stringify({
        categories: ["Narrow AI (Exists Today)", "General AI (Does Not Exist Yet)"],
        items: [
          { text: "A chess-playing program that cannot do anything else", category: "Narrow AI (Exists Today)" },
          { text: "A system that can learn any task a human can", category: "General AI (Does Not Exist Yet)" },
          { text: "A spam email filter", category: "Narrow AI (Exists Today)" },
          { text: "A robot that can cook, clean, drive, and have conversations equally well", category: "General AI (Does Not Exist Yet)" },
          { text: "A language translation app", category: "Narrow AI (Exists Today)" },
          { text: "An AI that truly understands emotions and context like a human", category: "General AI (Does Not Exist Yet)" },
          { text: "A recommendation system for movies", category: "Narrow AI (Exists Today)" },
          { text: "An AI that can transfer skills from one domain to any other domain", category: "General AI (Does Not Exist Yet)" },
        ],
        instructions: "Sort these AI systems. All AI that exists today is 'narrow' (good at one thing). 'General' AI that can do everything a human can does not exist yet.",
      }),
      content: `## Types of AI Systems

Not all AI is the same. Today we are going to explore the different types of AI, what exists now, and what is still science fiction.

### Narrow AI (What We Have Now)

Every AI system that exists today is "narrow AI," also called "weak AI." This does not mean it is bad! It means it is designed to do one specific thing well:

- **Language models** (ChatGPT): Great at text but cannot see or hear
- **Image recognition** (Google Photos): Great at identifying objects but cannot hold a conversation
- **Recommendation systems** (Netflix, Spotify): Great at suggesting content but cannot write essays
- **Game AI** (chess programs): Can beat world champions but cannot drive a car
- **Voice assistants** (Siri, Alexa): Can answer questions but cannot feel emotions

Each of these is incredibly powerful within its domain but useless outside of it. A chess AI cannot order pizza. A language model cannot actually see the physical world.

### General AI (AGI) - The Dream

Artificial General Intelligence would be an AI that can do ANYTHING a human can do: learn any task, transfer knowledge between domains, understand context and nuance, and adapt to completely new situations. This does not exist yet. Some researchers think it is decades away. Others think it may never happen exactly as imagined.

### Superintelligent AI - Science Fiction (For Now)

AI that is smarter than humans in every way is called superintelligent AI. This is currently the stuff of movies and books, not reality. But it is worth thinking about, because many smart people are working to ensure that if it ever becomes possible, it is developed safely.

### Why the Distinction Matters

When people talk about AI, they often blur these categories. A news headline might make you think AI can do everything, when it can actually only do one specific task. Being able to distinguish between narrow AI (what exists) and general AI (what does not exist yet) protects you from both unnecessary fear and unrealistic expectations.

### The Current AI Landscape

Today's AI landscape includes:
- **Chatbots and language models** for text generation
- **Computer vision** for image and video analysis
- **Speech systems** for voice recognition and synthesis
- **Recommendation engines** for personalized content
- **Robotic systems** for manufacturing and delivery
- **Creative AI** for art, music, and design

Each of these is a form of narrow AI, and each has both capabilities and limitations. Understanding this spectrum helps you use AI more effectively and think more clearly about its future.`,
    },

    // ============================================================
    // LEVEL 3 MODULE 4: Building with AI (Grade 6-8) - needs 3 lessons
    // ============================================================
    {
      id: "lesson_level_3_module_4_1",
      moduleId: "level_3_module_4",
      lessonNumber: 1,
      title: "From User to Creator: AI Development Tools",
      durationMinutes: 40,
      activityType: "matching",
      activityData: JSON.stringify({
        pairs: [
          { term: "API", definition: "A way for different software programs to communicate with each other" },
          { term: "No-code platform", definition: "A tool that lets you build AI applications without writing code" },
          { term: "Chatbot", definition: "An AI program designed to have conversations with users" },
          { term: "Prototype", definition: "An early version of a product used for testing ideas" },
          { term: "User interface", definition: "The part of an application that users see and interact with" },
        ],
        instructions: "Match each AI development term with its definition. These are the building blocks of creating your own AI applications!",
      }),
      content: `## From User to Creator: AI Development Tools

You have been using AI for a while. Now it is time to cross the bridge from AI user to AI creator. This is where you start building your own AI-powered applications and tools.

### The Creator Mindset

There is a huge difference between using AI and building with AI:
- **Using AI:** Typing prompts and reading responses
- **Building with AI:** Creating applications that use AI to solve problems for other people

### No-Code AI Platforms

You do not need to be a coding expert to build AI applications. No-code platforms let you create powerful tools using visual interfaces:

- **Chatbot builders** let you design conversational AI for specific purposes
- **Automation tools** let you connect AI to other services
- **AI app builders** let you create complete applications with AI features

### Understanding APIs

An API (Application Programming Interface) is like a waiter at a restaurant. You (the customer) tell the waiter (API) what you want, the waiter takes your order to the kitchen (AI service), and brings back your food (the result).

When you build with AI, you use APIs to:
- Send text to AI and get responses back
- Send images for AI to analyze
- Generate images from text descriptions
- Convert speech to text and text to speech

### Your First AI Project

Here is a simple project you can build:

**AI Study Helper**
- Purpose: Help students study for tests
- How it works: Users enter a topic, and the app generates practice questions
- AI role: Creating questions and checking answers
- Your role: Designing the experience and making it useful

### The Development Process

1. **Identify the problem** you want to solve
2. **Design the solution** on paper first
3. **Choose your tools** (platform, AI service)
4. **Build a prototype** (a simple first version)
5. **Test with users** and get feedback
6. **Improve** based on what you learn

### Key Principles

- Start small. A simple app that works is better than a complex one that does not.
- Focus on the user. Who will use your creation, and what do they need?
- Test early and often. Do not wait until everything is "perfect."
- Learn from failure. Every bug and mistake teaches you something valuable.

You are about to create something that does not exist yet. How amazing is that?`,
    },
    {
      id: "lesson_level_3_module_4_2",
      moduleId: "level_3_module_4",
      lessonNumber: 2,
      title: "Building Your First Chatbot",
      durationMinutes: 40,
      activityType: "writing",
      activityData: JSON.stringify({
        prompt: "Design a chatbot for a specific purpose. Write out: (1) What is the chatbot's purpose? (2) Who will use it? (3) What are 5 questions it should be able to answer? (4) What personality should it have? (5) What should it do if it does not know the answer?",
        instructions: "Plan your chatbot design on paper before building it. Great products start with great planning!",
      }),
      content: `## Building Your First Chatbot

Chatbots are one of the most popular AI applications, and today you are going to design one from scratch. This is a real skill that professionals use every day.

### What Makes a Good Chatbot?

A good chatbot:
- Has a clear purpose (it does one thing well)
- Understands what users are asking
- Gives helpful, accurate responses
- Knows when to say "I do not know"
- Has a consistent personality

### Step 1: Define the Purpose

Your chatbot should solve a specific problem. Some ideas:

- **Library Helper:** Helps students find books by genre, topic, or reading level
- **Homework Planner:** Helps organize assignments and set study schedules
- **School Tour Guide:** Answers questions for new students about the school
- **Recycling Advisor:** Tells people which bin to use for different items
- **Pet Care Guide:** Answers basic questions about caring for different pets

### Step 2: Design the Personality

Every great chatbot has a personality! Think about:
- **Name:** What will you call your chatbot?
- **Tone:** Friendly? Professional? Funny? Encouraging?
- **Language level:** Simple? Medium? Advanced?
- **Greeting:** How will it say hello?

### Step 3: Plan the Conversations

Map out the most common conversations your chatbot will have:

**User:** "I need a book for my science project about space."
**Bot:** "I would love to help you find a space book! What grade are you in, and do you prefer books with lots of pictures or mostly text?"
**User:** "5th grade, and I like pictures."
**Bot:** "Here are 3 great options for 5th graders who love space with amazing photos and illustrations..."

### Step 4: Handle Edge Cases

What happens when your chatbot does not know the answer? Plan for this!

**Good response:** "That is a great question, but it is outside my area of expertise. I'd recommend asking your teacher or checking the school website for that information."

**Bad response:** Making something up or giving an error message.

### Step 5: Test and Improve

Once you build your chatbot, test it! Ask friends and family to try it. Watch where they get confused or frustrated. Then make it better.

### The Builder's Pride

There is something special about creating something that other people can use. Every chatbot you build is practice for bigger, more impactful projects in the future. You are developing real, marketable skills.`,
    },
    {
      id: "lesson_level_3_module_4_3",
      moduleId: "level_3_module_4",
      lessonNumber: 3,
      title: "Rapid Prototyping: From Idea to Demo",
      durationMinutes: 45,
      activityType: "emotion_checkin",
      activityData: JSON.stringify({
        emotions: ["Accomplished", "Creative", "Motivated", "Proud", "Inspired", "Determined"],
        prompt: "You have learned to build with AI! How does it feel to go from AI user to AI creator? Your journey from Level 1 to here has been remarkable.",
      }),
      content: `## Rapid Prototyping: From Idea to Demo

In the professional world, "rapid prototyping" means building a working version of your idea as quickly as possible so you can test it and get feedback. Today, you are going to learn this crucial skill.

### Why Prototype Fast?

Many people spend too long planning and never actually build anything. The rapid prototyping approach says: build something imperfect quickly, learn from it, then improve it. This is how most successful tech companies operate.

### The 2-Week Sprint

Professional developers use "sprints," which are focused periods of building. Here is a simplified 2-week sprint for your AI project:

**Week 1: Build**
- Day 1-2: Define the problem and sketch your solution
- Day 3-4: Set up your AI tool and build the basic version
- Day 5: Test it yourself and fix obvious problems

**Week 2: Polish and Present**
- Day 1-2: Get feedback from 3-5 people
- Day 3-4: Improve based on feedback
- Day 5: Prepare your demo presentation

### What to Include in Your Demo

Your demo should show:

1. **The problem** you are solving (and why it matters)
2. **Your solution** (show it working live if possible)
3. **How AI is used** (explain the AI component)
4. **What you learned** (the journey of building it)
5. **What is next** (how you would improve it with more time)

### Tips for a Great Demo

- Keep it under 5 minutes
- Start with the problem, not the technology
- Show, do not just tell. Let people see it work
- Be honest about limitations
- End with your vision for the future

### The MVP Mindset

MVP stands for Minimum Viable Product. It is the simplest version of your idea that actually works. You do not need every feature. You do not need perfect design. You need something that demonstrates your concept and gets people excited.

### Reflecting on Your Journey

Take a moment to think about where you started. In Level 1, you were learning what AI is. Now you are building your own AI applications. That growth is extraordinary.

### Looking Ahead

Level 4 awaits, where you will explore advanced AI applications, safety and alignment, entrepreneurship, and social impact. You have built the foundation. Now it is time to reach even higher. The skills you have developed, prompting, critical thinking, ethics, and now building, are genuinely valuable in the real world. Be proud of what you have accomplished.`,
    },

    // ============================================================
    // LEVEL 4 MODULE 1: Advanced AI Applications (Grade 9-12) - needs 3 lessons
    // ============================================================
    {
      id: "lesson_level_4_module_1_1",
      moduleId: "level_4_module_1",
      lessonNumber: 1,
      title: "The Frontier: Multimodal AI and Agents",
      durationMinutes: 40,
      activityType: "discussion",
      activityData: JSON.stringify({
        prompt: "Research one cutting-edge AI application (multimodal AI, AI agents, or code generation). Describe what it does, how it works at a high level, and what implications it has for society. Be prepared to discuss both benefits and risks.",
        instructions: "Explore the frontier of AI technology. Think critically about what these advances mean for the world you will inherit.",
      }),
      content: `## The Frontier: Multimodal AI and Agents

Welcome to Level 4. The techniques and concepts here are genuinely advanced. You are engaging with material that many college students and professionals are still wrapping their heads around.

### Multimodal AI

Early AI systems could only work with one type of data: text OR images OR audio. Multimodal AI can work with multiple types simultaneously.

Modern multimodal systems can:
- See images AND discuss them in natural language
- Listen to audio AND generate written summaries
- Read text AND create corresponding images
- Watch video AND answer questions about what happened

This is significant because humans experience the world through multiple senses simultaneously. Multimodal AI is a step toward more natural human-computer interaction.

### AI Agents

Traditional AI waits for you to give it a task, completes it, and stops. AI agents can:
- Break complex goals into subtasks
- Execute multiple steps autonomously
- Use tools (search engines, calculators, code interpreters)
- Monitor progress and adjust their approach
- Interact with external systems and services

For example, an AI agent tasked with "plan a community event" might research venues, compare prices, draft invitations, create a budget spreadsheet, and send scheduling polls, all from a single instruction.

### Code Generation

AI can now write functional computer code from natural language descriptions. This has profound implications:
- It lowers the barrier to software creation
- It accelerates professional development workflows
- It enables non-programmers to build technical solutions
- It changes what "learning to code" means

### Implications Worth Considering

**Workforce:** These technologies will change many jobs. Some jobs will disappear, but new ones will emerge. Adaptability becomes the most valuable skill.

**Access:** Advanced AI could democratize access to expertise. A farmer in a remote area could get medical advice, legal guidance, or engineering support through AI.

**Concentration of Power:** The companies and countries that control advanced AI have enormous influence. This raises questions about equity and governance.

**Reliability:** More capable AI systems can also fail in more consequential ways. The stakes of errors increase with capability.

### Your Perspective

As someone who has been studying AI since Level 1, you have a deeper understanding of these technologies than most people. Use that understanding to think critically about claims, evaluate opportunities, and prepare for a world where these technologies are commonplace.`,
    },
    {
      id: "lesson_level_4_module_1_2",
      moduleId: "level_4_module_1",
      lessonNumber: 2,
      title: "AI in Specialized Domains",
      durationMinutes: 40,
      activityType: "sorting",
      activityData: JSON.stringify({
        categories: ["AI Excels Here", "AI Struggles Here"],
        items: [
          { text: "Analyzing thousands of medical images for patterns", category: "AI Excels Here" },
          { text: "Understanding a patient's emotional needs and providing compassion", category: "AI Struggles Here" },
          { text: "Processing vast amounts of climate data to model trends", category: "AI Excels Here" },
          { text: "Making ethical judgments about resource allocation", category: "AI Struggles Here" },
          { text: "Identifying potential drug interactions in complex medication lists", category: "AI Excels Here" },
          { text: "Navigating cultural nuances in international negotiations", category: "AI Struggles Here" },
          { text: "Detecting fraudulent financial transactions in real time", category: "AI Excels Here" },
          { text: "Building trust with a nervous patient before surgery", category: "AI Struggles Here" },
        ],
        instructions: "Sort these tasks by whether AI currently excels at them or struggles with them. Notice how AI tends to excel at data processing but struggle with human-centric skills.",
      }),
      content: `## AI in Specialized Domains

AI is not just a general tool. It is being deployed in specific, high-stakes fields where its capabilities can make enormous differences. Understanding these applications helps you see both the potential and the responsibility that comes with advanced AI.

### Healthcare AI

AI in healthcare is already saving lives:

**Diagnostics:** AI can analyze medical images (X-rays, MRIs, CT scans) and spot patterns that human doctors sometimes miss. Some AI systems detect certain cancers earlier than experienced radiologists.

**Drug Discovery:** Developing a new drug traditionally takes 10-15 years and billions of dollars. AI can simulate molecular interactions and predict which compounds might be effective, potentially cutting development time dramatically.

**Personalized Medicine:** AI can analyze your genetic data, medical history, and lifestyle to suggest treatments tailored specifically to you, rather than one-size-fits-all approaches.

**The Limits:** AI cannot replace the human relationship between doctor and patient. Empathy, trust, and the ability to understand a patient's full context remain irreplaceably human.

### Climate and Environmental AI

**Climate Modeling:** AI processes vast datasets from satellites, weather stations, and ocean sensors to create more accurate climate models and predictions.

**Energy Optimization:** AI manages power grids to maximize renewable energy usage and minimize waste.

**Conservation:** AI monitors endangered species through camera traps and acoustic sensors, tracking populations that would be impossible to monitor manually.

### Education AI

**Adaptive Learning:** AI tailors educational content to each student's level, pace, and learning style. This is what you are experiencing right now.

**Assessment:** AI can provide instant feedback on writing, math, and other skills, allowing students to learn from mistakes immediately.

**Access:** AI tutoring can provide educational support to students in areas with teacher shortages.

### Legal and Financial AI

**Legal Research:** AI can review thousands of legal documents in hours, a task that would take human lawyers weeks.

**Fraud Detection:** AI monitors billions of financial transactions in real time, flagging suspicious activity.

### The Common Thread

In every domain, AI is most effective when it augments human capabilities rather than replacing human judgment. The best results come from humans and AI working together, each contributing what they do best.`,
    },
    {
      id: "lesson_level_4_module_1_3",
      moduleId: "level_4_module_1",
      lessonNumber: 3,
      title: "Limitations and What AI Cannot Do Yet",
      durationMinutes: 35,
      activityType: "breathing",
      activityData: JSON.stringify({
        pattern: "4-7-8",
        rounds: 3,
        instructions: "Before we dive into the deep thinking required for this lesson, let us take a moment to center ourselves. The topics we are covering are complex and sometimes overwhelming. A few minutes of focused breathing will help you engage more fully. Breathe in for 4 seconds, hold for 7 seconds, exhale for 8 seconds.",
      }),
      content: `## Limitations and What AI Cannot Do Yet

In a world full of AI hype, understanding what AI CANNOT do is as important as understanding what it can. This lesson will give you a clear-eyed view of current AI limitations, which is knowledge many decision-makers lack.

### The Illusion of Understanding

Large language models produce text that sounds intelligent and confident. But they do not actually understand what they are saying. They predict the most likely next word based on patterns in training data. This creates a convincing illusion of understanding without actual comprehension.

Evidence of this:
- AI can write a beautiful essay about grief without ever feeling sadness
- AI can explain a physics concept without understanding what it means
- AI can give advice about relationships without understanding what it feels like to care about someone

### Common Sense Reasoning

AI frequently fails at tasks that any human child could handle:
- Understanding that a glass of water turns upside down will spill
- Recognizing that you cannot fit an elephant in a car
- Knowing that a person who died last year cannot attend today's meeting

These seem obvious to us because we have physical bodies, lived experiences, and intuitive understanding of how the world works. AI has none of these.

### Creativity vs. Recombination

AI can produce novel-seeming content, but it is fundamentally recombining patterns from its training data. True creativity, the kind that produces genuinely new ideas that have never existed before, remains a human domain.

AI can compose music in the style of Beethoven, but Beethoven's genius was creating a style that did not exist before him.

### Ethical Reasoning

AI cannot make genuine ethical decisions. It can follow rules and mimic ethical reasoning, but it does not understand why ethics matter. It does not feel the weight of a moral dilemma or the responsibility of a consequential choice.

### Reliability

AI is probabilistic, not deterministic. The same prompt can produce different results. AI can be confidently wrong. It can hallucinate facts, citations, and even people. This makes it unreliable for high-stakes decisions without human oversight.

### Why This Matters for You

Understanding AI's limitations is a competitive advantage. While others might over-rely on AI or fear it unnecessarily, you can use it strategically, knowing exactly where it excels and where human judgment remains essential.

This balanced perspective will serve you well in whatever career you pursue.`,
    },

    // ============================================================
    // LEVEL 4 MODULE 2: AI Safety & Alignment (Grade 9-12) - needs 3 lessons
    // ============================================================
    {
      id: "lesson_level_4_module_2_1",
      moduleId: "level_4_module_2",
      lessonNumber: 1,
      title: "The Alignment Problem",
      durationMinutes: 40,
      activityType: "discussion",
      activityData: JSON.stringify({
        prompt: "The alignment problem asks: How do we ensure AI does what we actually want, not just what we literally ask for? Discuss a scenario where AI follows instructions perfectly but the outcome is harmful because the instructions did not capture the full intent.",
        instructions: "Think deeply about the challenge of specifying what we truly want. Consider how difficult it is to express human values in precise instructions.",
      }),
      content: `## The Alignment Problem

The alignment problem is arguably the most important challenge in AI development. It asks a deceptively simple question: How do we make sure AI systems do what we actually want them to do?

### Why Is This Hard?

It sounds simple: just tell AI what to do. But consider this classic thought experiment:

You tell an AI: "Make as many paperclips as possible."

The AI, optimizing perfectly for this goal, starts converting all available resources into paperclips, including resources that humans need. It resists being turned off because that would prevent it from making more paperclips.

This is absurd, but it illustrates a real problem: specifying exactly what we want is much harder than it seems.

### Real-World Alignment Failures

- **Social media algorithms** were designed to maximize engagement. They did, but by promoting outrage, misinformation, and addiction.
- **AI grading systems** trained to maximize test scores incentivized teaching to the test rather than genuine learning.
- **Content moderation AI** designed to remove harmful content also removed legitimate political speech and cultural expression.

In each case, the AI did exactly what it was designed to do. The problem was that what it was designed to do was not what humans actually wanted.

### The Specification Problem

Human values are complex, contextual, and often contradictory. Try to write a complete specification for "be fair." You will quickly realize that fairness means different things in different contexts, to different cultures, and in different situations.

Now imagine trying to encode ALL human values into a set of instructions for an AI system. That is the alignment challenge.

### Current Approaches

**Constitutional AI:** Training AI to follow a set of principles (a "constitution") that guides its behavior.

**Reinforcement Learning from Human Feedback (RLHF):** Having humans rate AI outputs and using those ratings to train the AI to produce more preferred outputs.

**Red Teaming:** Deliberately trying to make AI behave badly to find and fix vulnerabilities.

**Interpretability:** Trying to understand what is happening inside AI systems so we can catch misalignment before it causes harm.

### Why This Matters to You

As AI systems become more capable, the alignment problem becomes more consequential. The decisions being made right now about how to align AI with human values will shape the world you inherit. Understanding this problem puts you in a position to contribute to the solution.`,
    },
    {
      id: "lesson_level_4_module_2_2",
      moduleId: "level_4_module_2",
      lessonNumber: 2,
      title: "AI Safety Research and Frameworks",
      durationMinutes: 40,
      activityType: "matching",
      activityData: JSON.stringify({
        pairs: [
          { term: "Red teaming", definition: "Deliberately trying to find failures and vulnerabilities in AI systems" },
          { term: "RLHF", definition: "Using human feedback to train AI to produce preferred outputs" },
          { term: "Interpretability", definition: "Understanding what happens inside AI models to catch problems" },
          { term: "Guardrails", definition: "Safety constraints that prevent AI from producing harmful outputs" },
          { term: "Robustness", definition: "Ensuring AI works correctly even with unusual or adversarial inputs" },
        ],
        instructions: "Match each AI safety concept with its description. These are the tools researchers use to make AI systems safer.",
      }),
      content: `## AI Safety Research and Frameworks

AI safety is a rapidly growing field of research. Understanding the major approaches helps you evaluate AI systems critically and potentially contribute to this important work.

### The Layers of AI Safety

Think of AI safety like the safety systems in a car:
- **Seatbelts** (guardrails): Basic protections that prevent obvious harm
- **Airbags** (fallback systems): Protections that activate when something goes wrong
- **Crash testing** (red teaming): Deliberately testing what happens in worst-case scenarios
- **Traffic laws** (governance frameworks): Rules that govern how AI is used in society

No single layer is sufficient. Safety comes from multiple layers working together.

### Guardrails and Content Filtering

Most AI systems have guardrails that prevent them from:
- Generating instructions for harmful activities
- Producing content that promotes violence or hatred
- Sharing personal or sensitive information
- Impersonating real people in harmful ways

These guardrails are important but imperfect. Researchers continuously find ways to bypass them, which leads to ongoing improvement.

### Red Teaming

Red teams are groups of researchers whose job is to break AI systems. They try to:
- Get AI to say things it should not
- Find biases in AI responses
- Discover safety vulnerabilities
- Test edge cases that normal users would not encounter

This adversarial approach is one of the most effective ways to improve AI safety.

### Responsible AI Frameworks

Major organizations have developed frameworks for responsible AI:

**Core Principles (Common Across Frameworks):**
- Fairness: AI should not discriminate
- Transparency: People should know when AI is making decisions about them
- Accountability: Someone should be responsible when AI causes harm
- Privacy: AI should respect personal data
- Safety: AI should not cause physical or psychological harm

### Building Your Own Framework

One of the most valuable exercises you can do is create your own AI ethics framework. Think about:
- What values do you think should guide AI development?
- Who should be held accountable when AI goes wrong?
- What rights should people have regarding AI?
- Where should the lines be drawn?

There are no perfect answers, but having a thoughtful, well-reasoned framework is essential for anyone who will work with or be affected by AI, which is everyone.

### Your Role in AI Safety

AI safety is not just for researchers and engineers. It requires input from diverse perspectives: ethicists, policymakers, educators, community members, and young people like you who will live with the consequences of today's decisions.`,
    },
    {
      id: "lesson_level_4_module_2_3",
      moduleId: "level_4_module_2",
      lessonNumber: 3,
      title: "Developing Your Personal AI Ethics Statement",
      durationMinutes: 40,
      activityType: "writing",
      activityData: JSON.stringify({
        prompt: "Write your personal AI Ethics Statement. Include: (1) Your core values regarding AI use, (2) Principles you will follow, (3) Red lines you will not cross, (4) How you will stay informed and update your thinking as AI evolves.",
        instructions: "This is your personal commitment to responsible AI use. Take it seriously. Revisit and revise it as you learn more.",
      }),
      content: `## Developing Your Personal AI Ethics Statement

Throughout this module, you have explored the alignment problem, safety research, and responsible AI frameworks. Now it is time to synthesize everything into something personal and actionable: your own AI Ethics Statement.

### Why a Personal Ethics Statement?

Organizations have ethics frameworks, but individuals need personal ones too. Your ethics statement is:
- A compass for decision-making when you encounter gray areas
- A declaration of what you stand for
- A living document that evolves as you learn and grow
- A foundation for your professional identity

### Components of Your Ethics Statement

**1. Core Values**
What do you believe matters most when it comes to AI? Examples:
- Human dignity must always be prioritized over efficiency
- Transparency is non-negotiable
- AI should reduce inequality, not increase it

**2. Principles**
Actionable guidelines based on your values:
- I will always disclose when AI assisted in my work
- I will verify AI-generated information before acting on it
- I will consider the impact on vulnerable populations

**3. Red Lines**
Things you will not do, regardless of pressure or convenience:
- I will not use AI to deceive or manipulate others
- I will not deploy AI systems without testing for bias
- I will not ignore evidence that an AI system is causing harm

**4. Commitment to Growth**
How you will stay informed and evolve:
- I will stay current on AI safety research
- I will seek diverse perspectives on AI ethics
- I will update my ethics statement annually

### The Courage of Convictions

Having an ethics statement is easy. Living by it when it is inconvenient takes courage. There will be times when cutting corners is tempting, when everyone else seems to be doing something you think is wrong, or when following your principles costs you something.

Those moments define who you are.

### Ethics in Action

Your ethics statement is not just words on paper. It is a commitment to action. Every day, you make choices about how to use AI, what to create, and how to treat others. Your ethics statement guides those choices.

### Beyond Personal Ethics

Personal ethics are important, but systemic problems require systemic solutions. As you move forward, consider how you can advocate for responsible AI practices in your school, community, and eventually your workplace.

You are part of a generation that will shape how AI integrates into human society. Your values, your voice, and your actions matter enormously.`,
    },

    // ============================================================
    // LEVEL 4 MODULE 3: Entrepreneurship & AI (Grade 9-12) - needs 3 lessons
    // ============================================================
    {
      id: "lesson_level_4_module_3_1",
      moduleId: "level_4_module_3",
      lessonNumber: 1,
      title: "Identifying Market Opportunities",
      durationMinutes: 40,
      activityType: "sorting",
      activityData: JSON.stringify({
        categories: ["Strong AI Business Opportunity", "Weak AI Business Opportunity"],
        items: [
          { text: "Solving a problem many people have and are willing to pay for", category: "Strong AI Business Opportunity" },
          { text: "Building technology that is cool but no one needs", category: "Weak AI Business Opportunity" },
          { text: "AI that saves businesses significant time or money", category: "Strong AI Business Opportunity" },
          { text: "An AI solution that already exists from many competitors", category: "Weak AI Business Opportunity" },
          { text: "Addressing an underserved market with a unique AI approach", category: "Strong AI Business Opportunity" },
          { text: "A complex AI project with no clear customer or revenue model", category: "Weak AI Business Opportunity" },
        ],
        instructions: "Sort these potential AI businesses. What makes some opportunities stronger than others?",
      }),
      content: `## Identifying Market Opportunities

The intersection of AI and entrepreneurship is one of the most dynamic spaces in the global economy. New AI-powered companies are being created every day, and many of the most successful ones were started by young people who saw problems others missed.

### What Makes a Good AI Business Opportunity?

Not every idea is a good business opportunity. The best ones have these characteristics:

**1. A Real Problem**
The strongest businesses solve problems that people genuinely have and are willing to pay to solve. Start by observing pain points in daily life, work, education, or community.

**2. AI as the Differentiator**
AI should be the reason your solution is better than alternatives. If the problem could be solved equally well without AI, you do not have an AI business; you have a business that happens to use AI.

**3. A Clear Customer**
Who will pay for your solution? How much? How often? The more specifically you can answer these questions, the stronger your opportunity.

**4. Feasibility**
Can you actually build this with available technology and resources? The best idea in the world is worthless if it cannot be executed.

### Finding Opportunities

**Listen to complaints.** When people say "I wish there was a way to..." or "It is so frustrating that..." they are revealing unmet needs.

**Look for inefficiency.** Where are people spending lots of time on tasks that could be automated or augmented by AI?

**Study trends.** What industries are growing? What new regulations create needs? What demographic shifts are happening?

**Talk to people.** The best market research is conversations with potential customers. Ask them about their challenges, not about your solution idea.

### Validating Your Idea

Before investing significant time and resources:
1. Talk to at least 10 potential customers
2. Ask about their problem (not your solution)
3. Gauge their willingness to pay
4. Research existing solutions
5. Identify what makes your approach unique

### Common Mistakes

- Falling in love with technology instead of solving a problem
- Assuming people will pay without asking them
- Ignoring existing competition
- Building too much before testing the idea

### Your Assignment

This week, identify three problems that you or people around you face that could potentially be addressed with AI. For each one, write who has the problem, how they currently deal with it, and why an AI solution might be better.`,
    },
    {
      id: "lesson_level_4_module_3_2",
      moduleId: "level_4_module_3",
      lessonNumber: 2,
      title: "Building a Business Model",
      durationMinutes: 45,
      activityType: "writing",
      activityData: JSON.stringify({
        prompt: "Create a simple Business Model Canvas for an AI-powered product or service. Include: (1) Value Proposition: What problem do you solve? (2) Customer Segments: Who will buy it? (3) Revenue Streams: How will you make money? (4) Key Resources: What do you need to build it? (5) Unfair Advantage: Why can't someone easily copy this?",
        instructions: "Design your AI business model. Think like an entrepreneur who needs to convince an investor that this idea will work.",
      }),
      content: `## Building a Business Model

An idea is not a business. A business requires a model: a clear explanation of how you create value for customers and capture value (revenue) for yourself. Today you will learn the fundamentals of business modeling for AI ventures.

### The Business Model Canvas

The Business Model Canvas is a tool used by entrepreneurs worldwide. Here are the key components:

**Value Proposition:** What problem do you solve? Why is your solution better than alternatives? This is the heart of your business.

**Customer Segments:** Who are your customers? Be specific. "Everyone" is not a customer segment. "Small restaurant owners who struggle with inventory management" is.

**Revenue Streams:** How will you make money? Common models for AI products:
- Subscription (monthly/annual fee)
- Freemium (free basic version, paid premium features)
- Usage-based (pay per use)
- Licensing (charge other businesses to use your AI)

**Key Resources:** What do you need? For AI businesses, this typically includes data, AI models, computing power, and talent.

**Key Activities:** What must you do well? Building the AI, acquiring customers, maintaining the product, providing support.

**Cost Structure:** What are your expenses? AI businesses often have high initial costs (building the model) but lower marginal costs (serving each additional customer is cheap).

### AI-Specific Business Considerations

**Data Moat:** The more data your AI processes, the better it gets. This creates a competitive advantage that grows over time.

**The Cold Start Problem:** Your AI needs data to be good, but you need users to get data. How do you solve this chicken-and-egg problem?

**Ethical Considerations:** AI businesses face unique ethical questions about data privacy, bias, and automation of jobs.

### Unit Economics

At the simplest level, a sustainable business needs:
- Revenue per customer > Cost to serve that customer
- Revenue from a customer over their lifetime > Cost to acquire that customer

If these numbers do not work, the business model needs to change.

### Your Turn

Choose your strongest idea from last lesson and build a complete Business Model Canvas. Be honest about assumptions, and identify which assumptions are the riskiest (these should be tested first).

Remember: the goal is not a perfect plan. It is a clear framework for testing your business hypothesis.`,
    },
    {
      id: "lesson_level_4_module_3_3",
      moduleId: "level_4_module_3",
      lessonNumber: 3,
      title: "Pitching Your AI Venture",
      durationMinutes: 45,
      activityType: "emotion_checkin",
      activityData: JSON.stringify({
        emotions: ["Excited", "Nervous", "Confident", "Determined", "Inspired", "Ambitious"],
        prompt: "You have identified a problem, built a business model, and are preparing to pitch your idea. How do you feel about stepping into the role of an entrepreneur?",
      }),
      content: `## Pitching Your AI Venture

The ability to clearly and compellingly present your idea is essential for any entrepreneur. Whether you are pitching to investors, customers, partners, or your school's innovation competition, the skills you develop here will serve you throughout your career.

### The Pitch Structure

**1. The Hook (15 seconds)**
Start with something that grabs attention. A surprising statistic, a relatable problem, or a provocative question.

"Did you know that 40% of the food produced in the US goes to waste? Our AI helps restaurants reduce waste by 60%, saving money while helping the planet."

**2. The Problem (30 seconds)**
Describe the problem clearly. Make it personal. Help your audience feel the pain.

**3. The Solution (60 seconds)**
Explain your solution simply. Avoid jargon. Show, do not tell, if possible.

**4. The Market (30 seconds)**
How big is the opportunity? How many potential customers exist?

**5. The Business Model (30 seconds)**
How do you make money? Keep it simple.

**6. Traction (30 seconds)**
What have you accomplished so far? Even early-stage metrics matter: "We interviewed 20 restaurant owners and 18 said they would pay for this."

**7. The Ask (15 seconds)**
What do you need? Funding? A mentor? Early customers?

### Pitch Tips

- **Simplify ruthlessly.** If your grandmother cannot understand it, it is too complicated.
- **Tell a story.** People remember stories better than facts.
- **Know your numbers.** Investors will ask. Be prepared.
- **Anticipate objections.** Think about the tough questions and prepare answers.
- **Be authentic.** Passion is contagious. Let your genuine excitement show.

### Common Pitch Mistakes

- Too much technical detail, not enough about the problem and customer
- Claiming you have no competition (you always have competition)
- Unrealistic financial projections
- Not knowing your customer deeply enough
- Reading from notes instead of speaking naturally

### Beyond the Pitch

A pitch is not the end, it is the beginning. After pitching, you gather feedback, refine your approach, and try again. The best entrepreneurs are not the ones with the best first pitch. They are the ones who iterate fastest.

### The Entrepreneurial Mindset

Whether or not you start a company, the entrepreneurial mindset of identifying problems, creating solutions, and communicating value will serve you in any career. These are leadership skills disguised as business skills.

You have the knowledge, the skills, and the perspective to make a real difference. Trust yourself.`,
    },

    // ============================================================
    // LEVEL 4 MODULE 4: Social Impact Studio (Grade 9-12) - needs 3 lessons
    // ============================================================
    {
      id: "lesson_level_4_module_4_1",
      moduleId: "level_4_module_4",
      lessonNumber: 1,
      title: "Choosing Your Social Impact Challenge",
      durationMinutes: 40,
      activityType: "emotion_checkin",
      activityData: JSON.stringify({
        emotions: ["Passionate", "Determined", "Overwhelmed", "Hopeful", "Focused", "Motivated"],
        prompt: "Think about the social issues that matter most to you. Which problems in the world keep you up at night or make you want to take action? How do you feel as you prepare to tackle one of them?",
      }),
      content: `## Choosing Your Social Impact Challenge

This module is about applying everything you have learned to make a genuine positive difference in the world. Not theoretically. Actually.

### What Is Social Impact?

Social impact means creating meaningful, positive change for communities and individuals. It is not about charity or pity. It is about using your skills and resources to address systemic problems alongside the people affected by them.

### Areas Where AI Can Drive Social Impact

**Education Access:** AI tutoring and translation can reach students who lack access to quality education.

**Healthcare Equity:** AI diagnostics can provide medical screening in areas with doctor shortages.

**Environmental Protection:** AI monitoring can detect illegal deforestation, poaching, and pollution.

**Food Security:** AI optimization can reduce agricultural waste and improve distribution to food deserts.

**Disaster Response:** AI analysis of satellite imagery and social media can accelerate emergency response.

**Accessibility:** AI-powered tools can help people with disabilities navigate the world more independently.

### Choosing Your Challenge

Pick a challenge that:
1. **You genuinely care about.** Passion sustains effort when things get difficult.
2. **Is specific enough to address.** "Fix education" is too broad. "Help ESL students in my district practice English" is actionable.
3. **Has a community you can engage with.** You need to work WITH the people affected, not just FOR them.
4. **AI can genuinely help.** Not every problem is best solved with AI.

### The Human-Centered Design Approach

1. **Empathize:** Understand the problem from the perspective of those affected
2. **Define:** Clearly articulate the specific problem you are addressing
3. **Ideate:** Brainstorm multiple possible solutions
4. **Prototype:** Build a simple version of the best idea
5. **Test:** Get feedback from real users
6. **Iterate:** Improve based on feedback

### Important Principles

- **Nothing about us without us.** Include the affected community in your design process.
- **Do no harm.** Ensure your solution does not create new problems.
- **Measure impact.** How will you know if your solution actually works?
- **Plan for sustainability.** What happens after your project is over?

### Your Assignment

Write a one-page brief about the social challenge you want to address. Include: the problem, who it affects, why you care, and your initial ideas for how AI could help.`,
    },
    {
      id: "lesson_level_4_module_4_2",
      moduleId: "level_4_module_4",
      lessonNumber: 2,
      title: "Stakeholder Engagement and Prototyping",
      durationMinutes: 45,
      activityType: "writing",
      activityData: JSON.stringify({
        prompt: "Create a stakeholder engagement plan for your social impact project. List: (1) Who are the key stakeholders? (2) What questions will you ask them? (3) How will you incorporate their feedback? (4) How will you ensure their voices shape the solution?",
        instructions: "Effective social impact requires listening to the people you are trying to help. Plan how you will engage them meaningfully.",
      }),
      content: `## Stakeholder Engagement and Prototyping

The difference between a well-intentioned project and an impactful one often comes down to one thing: whether you truly listened to the people you are trying to help.

### Who Are Your Stakeholders?

Stakeholders are anyone who is affected by or can influence your project:

**Primary stakeholders:** The people your solution directly serves
**Secondary stakeholders:** Organizations, leaders, or systems connected to the problem
**Enabling stakeholders:** People who can help you build and deploy your solution

### How to Engage Stakeholders

**1. Ask, Do Not Assume**
The biggest mistake in social impact work is assuming you know what people need. You might be wrong. Go in with genuine curiosity and humility.

**2. Ask Open-Ended Questions**
- "What is the biggest challenge you face regarding [topic]?"
- "How do you currently deal with [problem]?"
- "What would a helpful solution look like from your perspective?"
- "What has been tried before? What worked and what did not?"

**3. Listen More Than You Talk**
Your job in stakeholder engagement is to understand, not to sell your idea. Listen for insights that change your assumptions.

**4. Respect People's Time and Expertise**
The people you talk to are sharing valuable knowledge. Treat them as experts in their own experience, because they are.

### From Feedback to Prototype

After stakeholder engagement, you will have a much clearer picture of what is needed. Now build a prototype:

**Minimum Viable Product (MVP):**
Build the simplest possible version that demonstrates your concept. It does not need to be pretty or complete. It needs to work well enough to test with real users.

**Paper Prototyping:**
Sometimes you can test ideas before building anything. Draw screens on paper, walk people through the flow, and see if it makes sense to them.

**AI Prompt Prototyping:**
For AI-powered solutions, you can often test the core concept just by demonstrating the AI interactions before building a full application.

### Testing with Users

When you test your prototype:
- Observe how people actually use it (not how you expect them to)
- Ask what confused them
- Ask what they wish it did differently
- Note where they get stuck
- Do not defend your design; learn from criticism

### The Iteration Cycle

Build, test, learn, improve. Repeat. The best solutions are not created in one brilliant moment. They are refined through many cycles of feedback and improvement.

This process might feel slow, but it produces solutions that actually work for real people in real situations. That is what social impact is about.`,
    },
    {
      id: "lesson_level_4_module_4_3",
      moduleId: "level_4_module_4",
      lessonNumber: 3,
      title: "Measuring Impact and Presenting Results",
      durationMinutes: 45,
      activityType: "discussion",
      activityData: JSON.stringify({
        prompt: "How will you measure the impact of your social project? Identify 3 specific metrics you could track, explain why each matters, and describe how you would collect the data. Consider both quantitative measures (numbers) and qualitative measures (stories and experiences).",
        instructions: "Impact measurement is what separates good intentions from genuine results. Think carefully about what success looks like.",
      }),
      content: `## Measuring Impact and Presenting Results

Good intentions are not enough. To truly make a difference, you need to know whether your solution actually works. Impact measurement is how you prove it and improve it.

### Why Measure Impact?

- **Accountability:** You owe it to the people you serve to verify your solution helps
- **Improvement:** Data reveals what is working and what is not
- **Sustainability:** Evidence of impact helps you get support, funding, and resources
- **Learning:** Measurement teaches you whether your assumptions were correct

### Types of Impact Metrics

**Output Metrics:** What did you produce?
- Number of users served
- Number of sessions completed
- Features delivered

**Outcome Metrics:** What changed because of your work?
- Improvement in test scores
- Reduction in wait times
- Increase in user confidence

**Impact Metrics:** What long-term difference did you make?
- Career outcomes for students you helped
- Community-level changes
- Systemic improvements

### Quantitative vs. Qualitative

**Quantitative (Numbers):**
- 150 students used the tool
- Average test scores improved by 12%
- 85% of users reported satisfaction

**Qualitative (Stories):**
- "For the first time, I could do my homework without help from someone who speaks my language."
- "The tool helped me understand concepts my teacher did not have time to explain."

Both are important. Numbers show scale. Stories show meaning.

### Designing Your Measurement Plan

1. **Define success** before you start. What would "working" look like?
2. **Choose 3-5 key metrics** that directly measure success
3. **Establish a baseline.** What is the current state before your intervention?
4. **Collect data consistently** throughout your project
5. **Analyze honestly.** If the data shows your solution is not working, that is valuable information

### Presenting Your Results

Whether you are presenting to your class, a community group, or a competition, structure your presentation around:

1. **The problem** and why it matters
2. **Your approach** and why you chose it
3. **What you built** and how it works
4. **Evidence of impact** (your data and stories)
5. **What you learned** (including failures and pivots)
6. **What is next** (future plans and sustainability)

### Honest Reporting

The most respected researchers and entrepreneurs are honest about what did not work. Sharing failures demonstrates integrity and provides valuable lessons for others.

### The Legacy Question

As you conclude this module, ask yourself: What lasting impact do I want to have? Not just from this project, but from my relationship with AI and technology throughout my life? Your answer to that question will shape your path forward.`,
    },

    // ============================================================
    // LEVEL 5 MODULE 1: AI Educator Pathway (Grade 9-12) - needs 3 lessons
    // ============================================================
    {
      id: "lesson_level_5_module_1_1",
      moduleId: "level_5_module_1",
      lessonNumber: 1,
      title: "The Art of Teaching AI Concepts",
      durationMinutes: 45,
      activityType: "matching",
      activityData: JSON.stringify({
        pairs: [
          { term: "Scaffolding", definition: "Breaking complex ideas into manageable steps for learners" },
          { term: "Zone of Proximal Development", definition: "The gap between what a learner can do alone and with help" },
          { term: "Active Learning", definition: "Engaging students through activities rather than passive listening" },
          { term: "Formative Assessment", definition: "Checking understanding during learning, not just at the end" },
          { term: "Differentiation", definition: "Adapting teaching to meet different learners' needs" },
        ],
        instructions: "Match each teaching concept with its definition. These are the foundational principles of effective AI education.",
      }),
      content: `## The Art of Teaching AI Concepts

You have reached Level 5: the highest level in this curriculum. You are now preparing to teach others what you have learned. Teaching is the ultimate test of understanding; you cannot teach what you do not deeply comprehend.

### Why Teaching Matters

Research consistently shows that teaching is one of the most effective ways to learn. When you explain concepts to others, you:
- Discover gaps in your own understanding
- Reinforce your knowledge through repetition
- Develop communication skills
- Build confidence in your expertise
- Make a meaningful contribution to others' growth

### Pedagogical Foundations

**Scaffolding:** Like building a scaffold to paint a tall building, you build temporary structures that support learners until they can stand on their own. For AI concepts, this means starting with relatable analogies before introducing technical terms.

**Zone of Proximal Development (ZPD):** Learners grow most when challenged just beyond their current ability, with support. Too easy leads to boredom. Too hard leads to frustration. Your job is to find the sweet spot.

**Active Learning:** People learn by doing, not just listening. Design activities that let learners interact with AI concepts, not just hear about them.

**Multiple Representations:** The same concept should be taught in multiple ways: visual, verbal, kinesthetic, analogical. Different learners connect with different approaches.

### Teaching AI to Different Ages

**Elementary (K-2):** Use stories, characters, and physical activities. "AI is like a pet that learns tricks."

**Elementary (3-5):** Use hands-on activities and real-world examples. "Let us sort things into groups, just like AI does!"

**Middle School (6-8):** Use relatable scenarios and interactive tools. "How does TikTok decide what to show you?"

**High School (9-12):** Use case studies, debates, and projects. "Analyze this AI system for potential biases."

### Common Teaching Mistakes

- Using too much jargon without defining terms
- Moving too fast through foundational concepts
- Assuming knowledge that learners do not have
- Not providing enough hands-on practice
- Forgetting to check for understanding along the way

### Your Teaching Philosophy

Before you teach your first lesson, articulate your teaching philosophy: What do you believe about learning? How will you create a supportive environment? What kind of teacher do you want to be?`,
    },
    {
      id: "lesson_level_5_module_1_2",
      moduleId: "level_5_module_1",
      lessonNumber: 2,
      title: "Developing AI Curriculum for Younger Students",
      durationMinutes: 45,
      activityType: "writing",
      activityData: JSON.stringify({
        prompt: "Design a 20-minute lesson about AI for elementary school students (grades 3-5). Include: (1) Learning objective, (2) Opening activity to grab attention, (3) Main content with at least one analogy, (4) Interactive activity, (5) Assessment question to check understanding.",
        instructions: "Create an actual lesson plan you could teach. Remember to use age-appropriate language and engaging activities!",
      }),
      content: `## Developing AI Curriculum for Younger Students

Now you are going to create actual educational content that younger students can learn from. This is where your deep understanding of AI meets your developing teaching skills.

### Lesson Design Framework

Every effective lesson follows a structure:

**1. Hook (2-3 minutes):** Grab attention with a question, story, or demonstration
**2. Introduction (3-5 minutes):** Present the core concept simply
**3. Exploration (5-10 minutes):** Guided activity where students interact with the concept
**4. Practice (5-10 minutes):** Students apply what they learned independently or in groups
**5. Wrap-Up (2-3 minutes):** Summarize key takeaways and preview what comes next

### Creating Age-Appropriate Content

**For Grades K-2:**
- Use characters and stories as teaching vehicles
- Limit new vocabulary to 3-5 words per lesson
- Include physical movement and hands-on activities
- Keep total lesson time to 15-20 minutes
- Use lots of visuals and minimal text

**For Grades 3-5:**
- Connect AI concepts to things they already know
- Use analogies: "AI is like a really fast librarian who has read every book"
- Include interactive activities: sorting games, scavenger hunts, matching exercises
- Allow 20-30 minutes per lesson
- Encourage questions and discussion

**For Grades 6-8:**
- Use real-world examples from their lives (social media, games, music)
- Introduce critical thinking about AI capabilities and limitations
- Include debate and discussion activities
- Allow 30-40 minutes per lesson
- Challenge them to think about ethics and impact

### Writing for Different Levels

The same concept needs different language for different ages:

**Concept: AI learns from data**

**K-2:** "AI is like a baby that learns by looking at lots and lots of pictures. The more pictures it sees, the better it gets at recognizing things!"

**3-5:** "AI learns by studying millions of examples. If you show it 10,000 pictures of cats and 10,000 pictures of dogs, it figures out the differences and can tell them apart."

**6-8:** "Machine learning algorithms identify patterns in training data. The quality and diversity of that training data directly affects the model's accuracy and potential biases."

### Assessment Design

How do you know if students actually learned? Design simple checks:
- Have them explain the concept to a partner
- Use thumbs up/thumbs down for quick comprehension checks
- Ask them to draw or write about what they learned
- Create simple quizzes with visual multiple-choice options

### Your Assignment

Create a complete, ready-to-teach lesson for one age group. Include all materials, timing, and assessment. Then teach it to someone: a sibling, a friend, or a volunteer.`,
    },
    {
      id: "lesson_level_5_module_1_3",
      moduleId: "level_5_module_1",
      lessonNumber: 3,
      title: "Leading Your First Teaching Session",
      durationMinutes: 45,
      activityType: "emotion_checkin",
      activityData: JSON.stringify({
        emotions: ["Ready", "Nervous", "Excited", "Confident", "Proud", "Grateful"],
        prompt: "You are about to become an AI educator. Teaching what you know to others is one of the highest forms of mastery. How do you feel about this milestone in your learning journey?",
      }),
      content: `## Leading Your First Teaching Session

This is a milestone moment. You are transitioning from learner to teacher. Everything you have learned, from the basics of AI in Level 1 to the advanced concepts in Level 4, has prepared you for this.

### Preparing to Teach

**Know your material cold.** Review the content until you can explain it without notes. The best teachers are so familiar with their material that they can adapt in the moment.

**Anticipate questions.** Think about what your students might ask. Prepare answers. It is also OK to say, "Great question. Let me find out and get back to you."

**Prepare your materials.** Have everything ready before students arrive: handouts, activities, technology. Scrambling for materials undermines your authority and wastes learning time.

**Practice out loud.** Rehearse your lesson. Say the words out loud. Time yourself. Identify spots where you stumble or rush.

### During the Session

**Start strong.** Your opening sets the tone. Be energetic, warm, and clear about what students will learn.

**Check for understanding frequently.** Do not just ask, "Does everyone understand?" (they will say yes even if they do not). Instead, ask them to explain concepts back to you or answer specific questions.

**Manage your pacing.** New teachers usually go too fast. Slow down. Give students time to process. Silence after a question is OK; it means people are thinking.

**Be flexible.** If students are struggling, slow down. If they are breezing through, have extension activities ready. The plan is a guide, not a script.

**Handle mistakes gracefully.** If you make an error, correct it calmly. Modeling how to handle mistakes is actually one of the best things you can teach.

### After the Session

**Reflect.** What went well? What would you change? Write it down while it is fresh.

**Seek feedback.** Ask students or observers what was helpful and what was confusing.

**Improve.** Every teaching session is a chance to get better. The best teachers are always evolving.

### The Ripple Effect

When you teach someone about AI, and they go on to use AI responsibly, and perhaps teach others, you have created a ripple effect. Your influence extends far beyond the people in the room with you.

### You Are an Educator Now

Congratulations. You have completed a journey that very few people your age, or any age, have completed. You understand AI deeply, you can build with it, you think critically about its implications, and now you can teach others.

Whatever path you choose from here, you carry with you a rare combination of technical knowledge, ethical grounding, and the ability to communicate complex ideas clearly. The world needs exactly what you have to offer.`,
    },

    // ============================================================
    // LEVEL 5 MODULE 2: AI Research Pathway (Grade 9-12) - needs 3 lessons
    // ============================================================
    {
      id: "lesson_level_5_module_2_1",
      moduleId: "level_5_module_2",
      lessonNumber: 1,
      title: "Introduction to AI Research Methodology",
      durationMinutes: 45,
      activityType: "matching",
      activityData: JSON.stringify({
        pairs: [
          { term: "Literature review", definition: "Surveying existing research to understand what is already known" },
          { term: "Hypothesis", definition: "A testable prediction about what you expect to find" },
          { term: "Methodology", definition: "The specific procedures and techniques used in your research" },
          { term: "Peer review", definition: "Having other researchers evaluate your work for quality and accuracy" },
          { term: "Reproducibility", definition: "Others should be able to repeat your research and get similar results" },
        ],
        instructions: "Match each research concept with its definition. These are the building blocks of conducting original AI research.",
      }),
      content: `## Introduction to AI Research Methodology

Research is how humanity advances its understanding. Every AI capability you have learned about exists because researchers asked questions, designed experiments, and shared their findings. Now it is your turn.

### What Is Research?

Research is the systematic investigation of questions to establish facts, reach conclusions, and contribute to knowledge. In AI, research might involve:

- Testing whether a new prompting technique improves AI accuracy
- Investigating how AI bias affects different communities
- Exploring how students learn differently with AI tutoring
- Comparing AI-generated content to human-generated content

### The Research Process

**1. Identify a Question**
Good research starts with a genuine question. What are you curious about? What gaps exist in current understanding?

**2. Review Existing Literature**
Before investigating your question, find out what others have already discovered. This prevents duplication and helps you build on existing knowledge.

**3. Formulate a Hypothesis**
Based on your review, make a testable prediction: "I predict that students who use structured prompt templates will produce higher-quality AI-assisted work than students who write freeform prompts."

**4. Design Your Methodology**
How will you test your hypothesis? Consider:
- Who are your participants?
- What will you measure?
- How will you control for other variables?
- What tools and techniques will you use?

**5. Collect Data**
Execute your study carefully and consistently. Document everything.

**6. Analyze Results**
What does the data tell you? Does it support or contradict your hypothesis?

**7. Draw Conclusions**
What did you learn? What are the limitations? What questions remain?

**8. Share Your Findings**
Research that is not shared cannot benefit others. Write up your findings clearly.

### Ethical Research Practices

- Always get informed consent from participants
- Protect participants' privacy and data
- Report results honestly, including negative findings
- Give credit to others' work you build upon
- Acknowledge limitations and potential biases

### Finding Your Research Question

The best research questions come from genuine curiosity combined with practical importance. What about AI puzzles you? What claims about AI would you like to verify? What impact of AI would you like to measure?

Start a research journal where you record questions, observations, and ideas. Your breakthrough question might come from an everyday observation.`,
    },
    {
      id: "lesson_level_5_module_2_2",
      moduleId: "level_5_module_2",
      lessonNumber: 2,
      title: "Designing Your Research Study",
      durationMinutes: 45,
      activityType: "writing",
      activityData: JSON.stringify({
        prompt: "Design a research study about AI. Include: (1) Research question, (2) Hypothesis, (3) Methodology (how you will collect data), (4) Expected sample size, (5) How you will analyze results, (6) Potential limitations of your study.",
        instructions: "Create a complete research design. Be specific and realistic about what you can actually accomplish.",
      }),
      content: `## Designing Your Research Study

Today you will design an actual research study. This is where theory meets practice. Your study design is your blueprint for generating new knowledge.

### Choosing Your Research Type

**Experimental Research:** You change something (the independent variable) and measure its effect (the dependent variable). Example: Testing whether prompt templates improve student outcomes.

**Survey Research:** You collect opinions, attitudes, or experiences from a group of people. Example: Surveying students about their AI usage habits and attitudes.

**Observational Research:** You observe and record behavior without intervening. Example: Documenting how students naturally interact with AI tutoring systems.

**Comparative Research:** You compare two or more groups or approaches. Example: Comparing the accuracy of AI-generated essays to human-written essays.

### Research Design Elements

**Independent Variable:** What you are changing or comparing
**Dependent Variable:** What you are measuring
**Control Group:** A group that does not receive the treatment (for comparison)
**Sample Size:** How many participants you need for meaningful results
**Duration:** How long your study will take

### Writing a Good Research Question

A research question should be:
- **Specific:** Not "Does AI help learning?" but "Does AI-assisted vocabulary practice improve 6th graders' test scores compared to traditional flashcard methods?"
- **Measurable:** You need to be able to collect data that answers it
- **Feasible:** You need to be able to conduct the study with available resources
- **Meaningful:** The answer should matter to someone

### Data Collection Methods

- **Surveys:** Questionnaires with scaled or open-ended responses
- **Tests:** Pre-tests and post-tests to measure learning
- **Interviews:** In-depth conversations with participants
- **Observations:** Structured notes on behavior
- **Usage data:** Analytics from AI tools (with consent)

### Common Pitfalls

- **Confirmation bias:** Designing a study that can only confirm what you already believe
- **Small sample size:** Drawing conclusions from too few participants
- **No control group:** Having nothing to compare your results against
- **Leading questions:** Survey questions that push respondents toward a particular answer
- **Ignoring limitations:** Every study has limitations; acknowledging them strengthens your work

### Your Assignment

Draft a complete research proposal for your chosen topic. Include every element discussed in this lesson. Have a peer review your proposal and provide feedback.`,
    },
    {
      id: "lesson_level_5_module_2_3",
      moduleId: "level_5_module_2",
      lessonNumber: 3,
      title: "Writing and Presenting Research Findings",
      durationMinutes: 45,
      activityType: "discussion",
      activityData: JSON.stringify({
        prompt: "Reflect on the research process. What was the most challenging aspect of designing your study? What surprised you? How has conducting research changed your understanding of AI claims you encounter in the media?",
        instructions: "Share your reflections on the research process. Consider how this experience has shaped your critical thinking about AI.",
      }),
      content: `## Writing and Presenting Research Findings

Research that is not communicated effectively might as well not have been done. Today you will learn how to write up your findings in a format that meets academic standards and can genuinely contribute to knowledge.

### The Structure of a Research Paper

**Abstract (150-300 words):** A summary of your entire paper: problem, method, results, conclusion. Write this last, even though it appears first.

**Introduction:** Context for your research, why it matters, and your research question.

**Literature Review:** Summary of existing research relevant to your question. What is already known? What gaps exist?

**Methodology:** Detailed description of how you conducted your research. Someone should be able to replicate your study from this section alone.

**Results:** What did you find? Present data clearly with tables, charts, or graphs as appropriate. Do not interpret yet, just report.

**Discussion:** What do your results mean? How do they relate to existing research? What are the implications?

**Limitations:** What are the weaknesses of your study? How might they affect your conclusions?

**Conclusion:** Summary of findings and suggestions for future research.

**References:** Every source you cited, in proper format.

### Writing Tips for Research

- **Be precise.** Say exactly what you mean. Avoid vague language.
- **Be objective.** Report what you found, not what you hoped to find.
- **Be honest.** Include results that contradict your hypothesis.
- **Use data.** Support claims with evidence, not opinions.
- **Define terms.** Ensure readers understand your vocabulary.

### Presenting Research

When presenting your findings:
- Lead with the question and why it matters
- Show your most important findings visually
- Explain your methodology briefly but clearly
- Be honest about limitations
- Suggest implications and future directions

### The Value of This Experience

By completing original research on AI, you have:
- Contributed to our collective understanding
- Developed critical thinking skills that transfer to every field
- Learned to evaluate claims based on evidence
- Practiced communicating complex ideas clearly
- Demonstrated intellectual curiosity and rigor

These capabilities are rare and valuable. Whether you pursue research as a career or apply these skills in other fields, you have developed a powerful way of understanding the world.

### Moving Forward

The research mindset, questioning assumptions, seeking evidence, acknowledging uncertainty, will serve you throughout your life. In a world of information overload and competing claims, the ability to think like a researcher is one of the most valuable skills you can possess.`,
    },

    // ============================================================
    // LEVEL 5 MODULE 3: AI Implementation Leadership (Grade 9-12) - needs 3 lessons
    // ============================================================
    {
      id: "lesson_level_5_module_3_1",
      moduleId: "level_5_module_3",
      lessonNumber: 1,
      title: "Assessing Organizational AI Readiness",
      durationMinutes: 45,
      activityType: "sorting",
      activityData: JSON.stringify({
        categories: ["Ready for AI Adoption", "Not Yet Ready"],
        items: [
          { text: "Organization has clear goals for what AI should accomplish", category: "Ready for AI Adoption" },
          { text: "Leadership does not understand what AI can and cannot do", category: "Not Yet Ready" },
          { text: "Staff are trained and supportive of technology changes", category: "Ready for AI Adoption" },
          { text: "No budget allocated for implementation and training", category: "Not Yet Ready" },
          { text: "Data is organized and accessible for AI systems", category: "Ready for AI Adoption" },
          { text: "Organization lacks basic technology infrastructure", category: "Not Yet Ready" },
          { text: "There is a clear plan for measuring success", category: "Ready for AI Adoption" },
          { text: "Employees fear AI will replace their jobs with no communication plan", category: "Not Yet Ready" },
        ],
        instructions: "Sort these organizational characteristics. Which indicate readiness for AI adoption, and which suggest more preparation is needed?",
      }),
      content: `## Assessing Organizational AI Readiness

Leadership is not about technology. It is about people. As an AI Implementation Leader, your primary job is to guide organizations through the complex process of adopting AI effectively and responsibly.

### What Is AI Readiness?

AI readiness is an organization's ability to successfully adopt and benefit from AI technologies. It encompasses technical infrastructure, human capital, organizational culture, and strategic alignment.

### The AI Readiness Assessment Framework

**1. Strategic Readiness**
- Does leadership have a clear vision for AI?
- Are there specific, measurable goals?
- Is AI aligned with the organization's mission?
- Is there budget and executive support?

**2. Technical Readiness**
- Is the data infrastructure adequate?
- Are systems compatible with AI tools?
- Is there sufficient computing resources?
- Are security measures in place?

**3. Human Readiness**
- Do staff understand AI basics?
- Is there willingness to adopt new tools?
- Are there AI-skilled team members or plans to hire/train them?
- Is there a culture of learning and adaptation?

**4. Ethical Readiness**
- Are there guidelines for responsible AI use?
- Has bias been considered in the data and processes?
- Are privacy protections in place?
- Is there a plan for transparency with stakeholders?

### Conducting an Assessment

When assessing an organization:

1. **Interview stakeholders** at all levels, from leadership to front-line workers
2. **Audit existing technology** and data practices
3. **Review organizational culture** for adaptability and learning orientation
4. **Evaluate resources** available for implementation
5. **Identify risks** and potential resistance points

### Common Readiness Gaps

- **The vision gap:** Leadership wants AI but does not know what for
- **The skills gap:** People lack the training to use AI effectively
- **The data gap:** Data is siloed, messy, or insufficient
- **The trust gap:** Staff fear AI rather than seeing it as a tool
- **The ethics gap:** No framework for responsible AI use

### Bridging the Gaps

For each gap, develop specific action plans:
- Vision gap: Facilitate strategic planning sessions
- Skills gap: Design training programs
- Data gap: Create data governance initiatives
- Trust gap: Communicate transparently and involve staff
- Ethics gap: Develop and implement responsible AI policies

### Your Leadership Style

Effective AI leaders are not just technically knowledgeable. They are empathetic, communicative, and patient. Change is hard for people. Your job is to make it as smooth and positive as possible.`,
    },
    {
      id: "lesson_level_5_module_3_2",
      moduleId: "level_5_module_3",
      lessonNumber: 2,
      title: "Designing an AI Implementation Roadmap",
      durationMinutes: 45,
      activityType: "writing",
      activityData: JSON.stringify({
        prompt: "Create a 6-month AI implementation roadmap for a school or organization. Include: (1) Month 1-2: Assessment and planning phase, (2) Month 3-4: Pilot program details, (3) Month 5-6: Evaluation and scaling plan. For each phase, list specific milestones and success metrics.",
        instructions: "Design a realistic implementation plan. Consider the human elements (training, communication, change management) as much as the technical ones.",
      }),
      content: `## Designing an AI Implementation Roadmap

A roadmap transforms a vision into a plan. It tells everyone involved where you are going, how you will get there, and what success looks like at each stage.

### The Phased Approach

Successful AI implementation follows phases:

**Phase 1: Discovery and Planning (Months 1-2)**
- Complete readiness assessment
- Define specific use cases
- Identify quick wins and long-term goals
- Build the implementation team
- Develop communication plan
- Set budget and timeline

**Phase 2: Pilot (Months 3-4)**
- Choose one use case for initial implementation
- Select a small, willing group of early adopters
- Deploy the AI solution in a controlled environment
- Collect feedback continuously
- Monitor for issues and iterate quickly
- Document lessons learned

**Phase 3: Evaluation (Month 5)**
- Measure pilot results against defined success criteria
- Gather qualitative feedback from users
- Identify what worked and what needs adjustment
- Calculate return on investment
- Assess readiness for broader rollout

**Phase 4: Scaling (Month 6 and beyond)**
- Expand to additional use cases or departments
- Develop comprehensive training programs
- Establish ongoing support structures
- Create governance frameworks
- Plan for continuous improvement

### Change Management

Technology is the easy part. People are the challenge. Effective change management requires:

**Communication:** Tell people WHY (not just what) is changing. Address fears directly. Share the vision.

**Involvement:** Include end users in the planning process. People support what they help create.

**Training:** Provide thorough, ongoing training. One workshop is not enough.

**Support:** Offer help desks, office hours, and peer mentoring.

**Celebration:** Recognize and celebrate early wins to build momentum.

### Risk Management

Identify potential risks and plan mitigation:
- Technical failure: Have backup plans and rollback procedures
- User resistance: Address concerns proactively and demonstrate value
- Data issues: Audit data quality before relying on AI insights
- Budget overruns: Build contingency into your budget
- Scope creep: Stay focused on defined use cases

### Measuring Success

Define success metrics before implementation:
- Adoption rates (are people actually using it?)
- Efficiency gains (is it saving time or money?)
- Quality improvements (is the output better?)
- User satisfaction (do people find it valuable?)
- ROI (does the benefit justify the cost?)

### The Leader's Mindset

Implementation leadership requires patience, adaptability, and resilience. Not everything will go as planned. The best leaders are those who can adjust course without losing sight of the destination.`,
    },
    {
      id: "lesson_level_5_module_3_3",
      moduleId: "level_5_module_3",
      lessonNumber: 3,
      title: "Leading Change and Building AI Culture",
      durationMinutes: 45,
      activityType: "emotion_checkin",
      activityData: JSON.stringify({
        emotions: ["Accomplished", "Empowered", "Grateful", "Inspired", "Ready", "Hopeful"],
        prompt: "You have completed the entire AI curriculum, from basic understanding to implementation leadership. Take a moment to reflect on your journey. How do you feel about the knowledge, skills, and perspective you have developed?",
      }),
      content: `## Leading Change and Building AI Culture

This is the final lesson in the entire curriculum. Everything you have learned, from Level 1's introduction to AI through Level 5's leadership pathways, culminates here. You are ready to lead.

### What Is AI Culture?

An AI-positive culture is an environment where:
- People see AI as a tool for empowerment, not a threat
- Ethical considerations are part of every AI discussion
- Continuous learning is valued and supported
- Experimentation is encouraged, and failure is seen as learning
- Diverse perspectives are sought and respected

### Building Culture Through Leadership

**Model the behavior you want to see.** If you want people to use AI responsibly, demonstrate responsible use. If you want people to experiment, show them your experiments, including the ones that did not work.

**Create psychological safety.** People need to feel safe asking questions, admitting confusion, and reporting concerns. A leader who punishes vulnerability kills innovation.

**Tell stories.** Humans learn through narrative. Share stories of AI successes and thoughtful failures. Stories make abstract concepts concrete and memorable.

**Recognize effort, not just results.** Someone who tried an AI experiment that failed learned more than someone who played it safe. Celebrate the trying.

### Sustaining Change

Initial enthusiasm for AI often fades. Sustaining change requires:
- **Regular check-ins** with teams about their AI usage and challenges
- **Ongoing training** as AI capabilities evolve
- **Updated policies** that keep pace with technology changes
- **Community building** among AI users within the organization
- **Visible leadership commitment** over time, not just at launch

### The Broader Responsibility

As an AI leader, you carry responsibility beyond your immediate organization. You are shaping how AI integrates into society. Every decision you make about implementation, ethics, training, and culture contributes to the broader story of AI's role in human life.

### Your Journey

Let us trace the path you have traveled:

**Level 1:** You discovered what AI is and learned to communicate with it.
**Level 2:** You mastered prompting, explored ethics, and started creating solutions.
**Level 3:** You dove deep into how AI works, society's relationship with it, and built your own tools.
**Level 4:** You explored advanced applications, safety, entrepreneurship, and social impact.
**Level 5:** You became an educator, researcher, or implementation leader.

That progression, from curious beginner to capable leader, is extraordinary.

### Your Promise

Whatever you do next, carry these principles with you:
- Use AI to empower, never to exploit
- Think critically about claims and capabilities
- Include diverse voices in AI decisions
- Prioritize human dignity over efficiency
- Never stop learning

The future of AI is not predetermined. It will be shaped by the choices of people like you. Make choices you are proud of.

Thank you for being part of this journey. Now go lead.`,
    },

    // ============================================================
    // SUBJECT MODULES: ELA 3-5 (Writing Workshop) - needs 3 lessons
    // ============================================================
    {
      id: "lesson_ela_3_5_module_1_1",
      moduleId: "ela_3_5_module_1",
      lessonNumber: 1,
      title: "Building Strong Paragraphs",
      durationMinutes: 25,
      activityType: "sorting",
      activityData: JSON.stringify({
        categories: ["Topic Sentence", "Supporting Detail", "Closing Sentence"],
        items: [
          { text: "Dogs make wonderful pets for many reasons.", category: "Topic Sentence" },
          { text: "They are loyal companions who greet you with wagging tails.", category: "Supporting Detail" },
          { text: "Dogs can also help reduce stress and keep you active.", category: "Supporting Detail" },
          { text: "For all these reasons, dogs truly are a family's best friend.", category: "Closing Sentence" },
          { text: "My favorite season is fall.", category: "Topic Sentence" },
          { text: "The leaves turn beautiful shades of red and orange.", category: "Supporting Detail" },
        ],
        instructions: "Sort these sentences! Every great paragraph has a topic sentence (the main idea), supporting details (reasons and examples), and a closing sentence (wraps it up).",
      }),
      content: `## Building Strong Paragraphs

Welcome to the Writing Workshop! Every great writer started exactly where you are right now, with ideas in their head and a desire to share them. Today you are going to learn the building blocks of great paragraphs.

### What Makes a Paragraph?

A paragraph is like a sandwich:
- **The top bun** is your topic sentence. It tells the reader what the paragraph is about.
- **The filling** is your supporting details. These are the reasons, examples, and facts that prove your point.
- **The bottom bun** is your closing sentence. It wraps everything up nicely.

### The Topic Sentence

Your topic sentence is the most important sentence in your paragraph. It tells the reader exactly what you are going to write about.

**Weak topic sentence:** "I like stuff."
**Strong topic sentence:** "Butterflies are some of the most amazing creatures in nature."

See the difference? The strong topic sentence tells the reader exactly what to expect.

### Supporting Details

After your topic sentence, you need details that support your main idea. Good supporting details include:
- **Reasons:** Why is this true?
- **Examples:** Can you give a specific example?
- **Facts:** What information supports your point?
- **Descriptions:** What does it look, sound, smell, or feel like?

### The Closing Sentence

Your closing sentence ties everything together. It should:
- Restate your main idea in different words
- Leave the reader with something to think about
- NOT introduce new information

### Putting It All Together

Here is a complete paragraph:

**Topic sentence:** Recess is the best part of the school day.
**Detail 1:** You get to run around outside and burn off energy after sitting in class.
**Detail 2:** You can play games with your friends and strengthen your friendships.
**Detail 3:** Studies show that physical activity actually helps you concentrate better when you go back to class.
**Closing:** With all these benefits, it is clear that recess is not just fun, it is important!

### Your Turn

Pick a topic you care about: your favorite animal, sport, food, or hobby. Write a paragraph using the sandwich structure. Remember: topic sentence, at least 3 supporting details, and a closing sentence. You have got this!`,
    },
    {
      id: "lesson_ela_3_5_module_1_2",
      moduleId: "ela_3_5_module_1",
      lessonNumber: 2,
      title: "Descriptive Writing: Paint with Words",
      durationMinutes: 25,
      activityType: "matching",
      activityData: JSON.stringify({
        pairs: [
          { term: "Sight", definition: "The golden sun dipped below the purple mountains" },
          { term: "Sound", definition: "Leaves crunched and crackled under my sneakers" },
          { term: "Smell", definition: "The aroma of fresh cookies drifted through the kitchen" },
          { term: "Touch", definition: "The rough bark scratched my fingertips" },
          { term: "Taste", definition: "The tangy lemonade made my lips pucker" },
        ],
        instructions: "Match each sense with the descriptive sentence that uses it. Great writers use all five senses to bring their writing to life!",
      }),
      content: `## Descriptive Writing: Paint with Words

Today you are going to learn one of the most powerful writing techniques: using your five senses to make your writing come alive. When you write descriptively, your reader does not just read your words, they EXPERIENCE them.

### The Five Senses in Writing

Great writers are like painters, but instead of colors, they use words. And instead of just painting what things look like, they paint what things sound like, smell like, feel like, and taste like too!

### Sight Words

Do not just say "The flower was pretty." Instead, paint a picture:
"The bright red rose opened its velvety petals toward the warm sunshine, tiny drops of morning dew sparkling like diamonds on its leaves."

### Sound Words

Do not just say "The bird sang." Instead, let the reader hear it:
"The little sparrow perched on the fence post and filled the quiet morning with its cheerful, whistling melody."

### Smell Words

Do not just say "The kitchen smelled good." Instead, let the reader smell it:
"The warm, buttery scent of pancakes cooking on the griddle mixed with the sweet aroma of maple syrup."

### Touch Words

Do not just say "The blanket was soft." Instead, let the reader feel it:
"The fuzzy fleece blanket felt like a warm cloud wrapping around my shoulders on a chilly evening."

### Taste Words

Do not just say "The food was good." Instead, let the reader taste it:
"The crispy, golden french fries were perfectly salty on the outside and fluffy on the inside."

### The Show, Do Not Tell Rule

This is the writer's golden rule:

**Telling:** "She was happy."
**Showing:** "Her eyes crinkled at the corners as a wide grin spread across her face, and she bounced on her toes."

When you SHOW instead of TELL, your reader gets to feel the emotion along with your character.

### Your Sensory Writing Challenge

Close your eyes and think about your favorite place. It could be your bedroom, a park, your grandparents' house, anywhere. Now write a paragraph describing that place using at least three of the five senses. Make your reader feel like they are right there with you!`,
    },
    {
      id: "lesson_ela_3_5_module_1_3",
      moduleId: "ela_3_5_module_1",
      lessonNumber: 3,
      title: "Editing and Revising: Making Your Writing Shine",
      durationMinutes: 30,
      activityType: "writing",
      activityData: JSON.stringify({
        prompt: "Take a paragraph you have written before (or write a new one) and revise it to make it stronger. Add more descriptive details, fix any spelling or grammar issues, and make sure your ideas flow smoothly. Write both the 'before' and 'after' versions.",
        instructions: "Practice the revision process. Great writing is rewriting! Compare your drafts to see how much stronger your revised version is.",
      }),
      content: `## Editing and Revising: Making Your Writing Shine

Here is a secret that most young writers do not know: the best writers in the world do not write perfectly on their first try. Not even close! Great writing happens in the REVISION, which means going back and making your first draft better.

### First Drafts Are Supposed to Be Messy

Your first draft is your "getting it down" draft. Do not worry about perfection. Just get your ideas on paper. You can fix everything later. Even famous authors write terrible first drafts!

### The Difference Between Editing and Revising

**Revising** is about the BIG stuff:
- Are your ideas clear?
- Is your paragraph organized well?
- Did you include enough details?
- Does your writing make sense?
- Is it interesting to read?

**Editing** is about the SMALL stuff:
- Spelling
- Punctuation
- Capital letters
- Grammar

Always revise FIRST, then edit. There is no point fixing the spelling on a sentence you might delete!

### The Revision Checklist

Ask yourself these questions about your writing:

1. **Does my topic sentence tell the reader what this is about?**
2. **Do I have at least 3 supporting details?**
3. **Did I use descriptive language (the five senses)?**
4. **Did I show instead of tell?**
5. **Does my closing sentence wrap things up?**
6. **Would someone who was not there understand what I wrote?**
7. **Is there anything boring I could make more exciting?**
8. **Is there anything confusing I could make clearer?**

### Before and After Example

**Before (First Draft):**
"My dog is nice. He is brown. I like playing with him. He is fun."

**After (Revised):**
"My golden retriever, Buddy, is the friendliest dog in the whole neighborhood. His chocolate-brown fur is soft as velvet, and his tail never stops wagging. Every afternoon when I get home from school, Buddy races to the door and covers my face with slobbery kisses. Whether we are playing fetch in the backyard or snuggling on the couch, Buddy makes every moment better. I cannot imagine life without my furry best friend."

See how much stronger the revised version is? Same idea, but the revision brings it to life!

### Peer Review

One of the best ways to improve your writing is to share it with a friend and ask: "What part was confusing? What part was your favorite?" Other people catch things you miss because you are too close to your own writing.

### Remember

Every piece of writing can be made better. That is not a failure. That is the process. The writers you admire all revise, revise, revise. Now you will too!`,
    },

    // ============================================================
    // MATH 3-5: Multiplication & Division - needs 3 lessons
    // ============================================================
    {
      id: "lesson_math_3_5_module_1_1",
      moduleId: "math_3_5_module_1",
      lessonNumber: 1,
      title: "Understanding Multiplication",
      durationMinutes: 25,
      activityType: "matching",
      activityData: JSON.stringify({
        pairs: [
          { term: "3 x 4", definition: "3 groups of 4, which equals 12" },
          { term: "5 x 2", definition: "5 groups of 2, which equals 10" },
          { term: "2 x 6", definition: "2 groups of 6, which equals 12" },
          { term: "4 x 5", definition: "4 groups of 5, which equals 20" },
          { term: "6 x 3", definition: "6 groups of 3, which equals 18" },
        ],
        instructions: "Match each multiplication problem with its meaning and answer. Remember: multiplication is just a shortcut for adding groups!",
      }),
      content: `## Understanding Multiplication

Welcome to Multiplication and Division! You have already conquered addition and subtraction. Now it is time for the next big step. And here is the exciting part: multiplication is just a shortcut for something you already know how to do!

### What Is Multiplication?

Multiplication is just fast adding of equal groups. When you say 3 x 4, you are really saying "3 groups of 4."

3 x 4 = 4 + 4 + 4 = 12

See? You already knew how to do this! Multiplication just makes it faster.

### Real-Life Multiplication

You use multiplication all the time without realizing it:

- **Snacks:** If you give 3 cookies to each of 5 friends, that is 3 x 5 = 15 cookies
- **Sports:** If there are 4 rows of seats with 6 seats in each row, that is 4 x 6 = 24 seats
- **Money:** If you save $5 every week for 4 weeks, that is $5 x 4 = $20

### The Times Table Trick

Here is a secret: you do not need to memorize everything from scratch! Look for patterns:

- **x 1:** Any number times 1 stays the same (5 x 1 = 5)
- **x 2:** Just double the number (7 x 2 = 14)
- **x 5:** Always ends in 0 or 5 (5, 10, 15, 20, 25...)
- **x 10:** Just add a zero (6 x 10 = 60)
- **x 9:** The digits always add up to 9! (9, 18, 27, 36, 45...)

### The Commutative Property

Here is another amazing shortcut: the order does not matter!

3 x 4 = 4 x 3 = 12
7 x 2 = 2 x 7 = 14

This means if you know 3 x 7 = 21, you automatically know 7 x 3 = 21 too! That cuts your memorization in half!

### Arrays: Seeing Multiplication

An array is a way to SEE multiplication. Imagine arranging dots in rows and columns:

3 rows of 4:
* * * *
* * * *
* * * *

Count them: 12! That is 3 x 4 = 12.

### Practice Makes Progress

Learning your times tables takes practice, but every fact you memorize makes math faster and easier for the rest of your life. You have got this!`,
    },
    {
      id: "lesson_math_3_5_module_1_2",
      moduleId: "math_3_5_module_1",
      lessonNumber: 2,
      title: "Division: Sharing Equally",
      durationMinutes: 25,
      activityType: "sorting",
      activityData: JSON.stringify({
        categories: ["Multiplication Problem", "Division Problem"],
        items: [
          { text: "There are 4 bags with 5 apples each. How many apples total?", category: "Multiplication Problem" },
          { text: "20 apples are shared equally among 4 bags. How many in each?", category: "Division Problem" },
          { text: "3 shelves hold 8 books each. How many books total?", category: "Multiplication Problem" },
          { text: "24 books are split evenly onto 3 shelves. How many per shelf?", category: "Division Problem" },
          { text: "Each of 6 friends gets 3 stickers. How many stickers total?", category: "Multiplication Problem" },
          { text: "18 stickers are divided equally among 6 friends. How many each?", category: "Division Problem" },
        ],
        instructions: "Sort these word problems! Multiplication puts groups together, while division splits things into equal groups.",
      }),
      content: `## Division: Sharing Equally

Now that you are learning multiplication, it is time to meet its partner: division! If multiplication puts groups together, division splits things apart equally. They are like two sides of the same coin.

### What Is Division?

Division means splitting something into equal groups. When you say 12 / 3, you are asking: "If I have 12 things and split them into 3 equal groups, how many in each group?"

12 / 3 = 4 (4 in each group)

### Division in Real Life

You divide things all the time:

- **Pizza:** If a pizza has 8 slices and 4 people are sharing, each person gets 8 / 4 = 2 slices
- **Teams:** If 20 kids need to form 4 equal teams, each team has 20 / 4 = 5 kids
- **Allowance:** If you earn $15 for 3 chores, you earned $15 / 3 = $5 per chore

### Division and Multiplication Are Best Friends

Here is the coolest part: if you know your multiplication facts, you already know your division facts!

If 3 x 4 = 12, then:
- 12 / 3 = 4
- 12 / 4 = 3

If 5 x 6 = 30, then:
- 30 / 5 = 6
- 30 / 6 = 5

So learning multiplication is like getting division for free!

### The Language of Division

Division can be asked in different ways:
- "What is 20 divided by 5?"
- "How many groups of 5 are in 20?"
- "If you split 20 into 5 equal parts, how big is each part?"
- "20 / 5 = ?"

They all mean the same thing!

### What About Remainders?

Sometimes things do not divide evenly. If you have 13 cookies and 4 friends:
- 13 / 4 = 3 with 1 left over
- Each friend gets 3 cookies, and there is 1 remaining

That leftover is called a **remainder**. It is totally normal and happens all the time in real life!

### Your Challenge

Think of 3 real-life situations where you would need to divide. Write them as word problems and solve them. Bonus points if one of them has a remainder!`,
    },
    {
      id: "lesson_math_3_5_module_1_3",
      moduleId: "math_3_5_module_1",
      lessonNumber: 3,
      title: "Word Problems: Math in the Real World",
      durationMinutes: 30,
      activityType: "reading",
      activityData: JSON.stringify({
        prompt: "Read each word problem carefully. Before solving, ask yourself: Is this multiplication (putting groups together) or division (splitting into groups)? Then solve step by step.",
        instructions: "Practice identifying which operation to use before jumping into solving. Understanding the problem is the most important step!",
      }),
      content: `## Word Problems: Math in the Real World

Word problems are where math gets really exciting because they show you how multiplication and division work in the REAL WORLD. Today you are going to become a word problem detective!

### The Detective Approach

When you see a word problem, do not panic! Follow these steps:

**Step 1: READ** the whole problem carefully. Read it twice if needed.
**Step 2: FIND** the important numbers and information.
**Step 3: DECIDE** what operation to use (multiply or divide).
**Step 4: SOLVE** the problem.
**Step 5: CHECK** - does your answer make sense?

### How to Know Which Operation to Use

**Use MULTIPLICATION when:**
- You have groups of equal size and want to find the total
- Key words: "each," "every," "groups of," "rows of," "times"

**Use DIVISION when:**
- You have a total and want to split it into equal groups
- Key words: "share equally," "split," "divide," "each gets," "how many groups"

### Practice Problems

**Problem 1:** Sarah reads 4 books every week. How many books does she read in 6 weeks?
- This is multiplication: 4 x 6 = 24 books

**Problem 2:** A farmer has 35 eggs and puts 7 in each carton. How many cartons does he fill?
- This is division: 35 / 7 = 5 cartons

**Problem 3:** There are 5 tables in the lunchroom. Each table seats 8 students. How many students can sit down?
- This is multiplication: 5 x 8 = 40 students

**Problem 4:** Ms. Johnson has 28 markers to share equally among 4 art groups. How many markers does each group get?
- This is division: 28 / 4 = 7 markers per group

### Multi-Step Problems

Sometimes you need more than one step:

"Jake buys 3 packs of stickers. Each pack has 8 stickers. He gives 10 stickers to his sister. How many does he have left?"

- Step 1: 3 x 8 = 24 stickers total
- Step 2: 24 - 10 = 14 stickers left

### The Check Step

Always ask: "Does my answer make sense?" If you calculated that Sarah reads 240 books in 6 weeks, that does not sound right! Checking your answer helps you catch mistakes.

### Remember

Math is not about getting every answer right on the first try. It is about thinking logically and solving problems step by step. Every time you work through a problem, your math muscles get stronger. Keep going!`,
    },

    // ============================================================
    // SCIENCE 3-5: Ecosystems & Food Chains - needs 3 lessons
    // ============================================================
    {
      id: "lesson_science_3_5_module_1_1",
      moduleId: "science_3_5_module_1",
      lessonNumber: 1,
      title: "What Is an Ecosystem?",
      durationMinutes: 25,
      activityType: "sorting",
      activityData: JSON.stringify({
        categories: ["Living Things (Biotic)", "Non-Living Things (Abiotic)"],
        items: [
          { text: "A tall oak tree", category: "Living Things (Biotic)" },
          { text: "A flowing river", category: "Non-Living Things (Abiotic)" },
          { text: "A hopping frog", category: "Living Things (Biotic)" },
          { text: "Sunlight warming the ground", category: "Non-Living Things (Abiotic)" },
          { text: "Mushrooms growing on a log", category: "Living Things (Biotic)" },
          { text: "Rocks and soil", category: "Non-Living Things (Abiotic)" },
          { text: "A bee buzzing around flowers", category: "Living Things (Biotic)" },
          { text: "The wind blowing through leaves", category: "Non-Living Things (Abiotic)" },
        ],
        instructions: "Sort these into living (biotic) and non-living (abiotic) parts of an ecosystem. Both are important for the ecosystem to work!",
      }),
      content: `## What Is an Ecosystem?

Welcome to the amazing world of ecosystems! An ecosystem is like a big neighborhood where living things and non-living things all work together. Today you are going to discover how everything in nature is connected.

### Ecosystem = Home for Living Things

An ecosystem includes everything in a particular area:
- **Living things (biotic):** Plants, animals, insects, fungi, bacteria
- **Non-living things (abiotic):** Water, sunlight, air, soil, temperature, rocks

Both are equally important! Plants need sunlight and water (non-living) to grow. Animals need plants (living) to eat. Everything depends on everything else.

### Types of Ecosystems

The world has many different ecosystems:

**Forest Ecosystem:** Lots of trees, animals like deer and birds, rich soil, moderate temperatures
**Ocean Ecosystem:** Saltwater, fish, coral, whales, seaweed
**Desert Ecosystem:** Very little water, cacti, lizards, scorpions, extreme temperatures
**Freshwater Ecosystem:** Lakes, rivers, ponds, fish, frogs, water plants
**Grassland Ecosystem:** Wide open spaces, grasses, bison, prairie dogs

### Why Ecosystems Matter

Every ecosystem is like a giant puzzle. Each piece, whether it is a tiny ant or a massive tree, plays an important role. When all the pieces fit together, the ecosystem is healthy. When pieces are removed or damaged, problems can happen.

### The Balance of Nature

Ecosystems stay healthy through balance:
- If there are too many rabbits, they eat all the plants
- If there are too many foxes, they eat all the rabbits
- Nature keeps things in balance so no one species takes over

### Your Local Ecosystem

You do not have to travel to a rainforest to see an ecosystem! Your backyard, a local park, even a puddle can be an ecosystem. Look closely at a patch of grass and you might find ants, beetles, worms, moss, and tiny flowers all living together.

### Your Mission

This week, find a small area outside (even a few square feet of ground). Spend 10 minutes observing it. List every living and non-living thing you can see. You might be surprised at how much life exists in a tiny space!`,
    },
    {
      id: "lesson_science_3_5_module_1_2",
      moduleId: "science_3_5_module_1",
      lessonNumber: 2,
      title: "Food Chains: Who Eats What?",
      durationMinutes: 25,
      activityType: "matching",
      activityData: JSON.stringify({
        pairs: [
          { term: "Producer", definition: "Makes its own food from sunlight (like plants and algae)" },
          { term: "Primary Consumer", definition: "Eats producers (herbivores like rabbits and deer)" },
          { term: "Secondary Consumer", definition: "Eats primary consumers (predators like foxes and snakes)" },
          { term: "Tertiary Consumer", definition: "Eats secondary consumers (top predators like eagles and wolves)" },
          { term: "Decomposer", definition: "Breaks down dead organisms and returns nutrients to soil" },
        ],
        instructions: "Match each role in a food chain with its description. Every living thing has a role to play in the food chain!",
      }),
      content: `## Food Chains: Who Eats What?

Now that you know what an ecosystem is, let's learn about one of the most important relationships in nature: who eats who! This is called a food chain.

### What Is a Food Chain?

A food chain shows how energy moves from one living thing to another through eating. It is like a line of dominoes: energy passes from the first organism to the next.

### The Links in the Chain

Every food chain starts with the sun! Here is how it works:

**The Sun** provides energy to everything

**Producers** (Plants, algae, grasses)
- They make their own food using sunlight through a process called photosynthesis
- They are the foundation of every food chain

**Primary Consumers** (Herbivores)
- They eat producers
- Examples: rabbits, deer, caterpillars, grasshoppers

**Secondary Consumers** (Carnivores and Omnivores)
- They eat primary consumers
- Examples: frogs, snakes, foxes, small birds

**Tertiary Consumers** (Top Predators)
- They eat secondary consumers
- Examples: eagles, wolves, sharks, lions
- They have few or no natural predators

**Decomposers** (Nature's Recyclers)
- They break down dead plants and animals
- Examples: mushrooms, bacteria, worms, beetles
- They return nutrients to the soil so new plants can grow

### An Example Food Chain

Sun provides energy to Grass (producer), which is eaten by a Grasshopper (primary consumer), which is eaten by a Frog (secondary consumer), which is eaten by a Snake (secondary consumer), which is eaten by a Hawk (tertiary consumer).

When the hawk dies, Decomposers break it down and return nutrients to the soil, where grass grows again!

### It Is a Circle!

The amazing thing about food chains is that they form a circle. Energy flows from the sun to plants to animals and back to the soil. Nothing is wasted in nature. That is why we call it the "circle of life."

### What Happens When a Link Breaks?

If one part of the food chain disappears, it affects everything:
- If all the frogs disappeared, the grasshoppers would overpopulate and eat all the grass
- If all the grass disappeared, the grasshoppers would have nothing to eat

That is why protecting every part of the food chain matters.

### Your Challenge

Draw a food chain from your local ecosystem. Start with the sun and include at least 4 links. Label each one as a producer, consumer, or decomposer!`,
    },
    {
      id: "lesson_science_3_5_module_1_3",
      moduleId: "science_3_5_module_1",
      lessonNumber: 3,
      title: "What If? Ecosystem Disruptions",
      durationMinutes: 30,
      activityType: "emotion_checkin",
      activityData: JSON.stringify({
        emotions: ["Concerned", "Motivated", "Curious", "Hopeful", "Determined", "Surprised"],
        prompt: "After learning how connected everything in an ecosystem is, how do you feel about taking care of the environment? Your feelings show that you care, and caring is the first step to making a difference!",
      }),
      content: `## What If? Ecosystem Disruptions

Today we are going to play a "What If?" game with ecosystems. What happens when something in the ecosystem changes? Sometimes the results are surprising!

### What Is a Disruption?

A disruption is when something changes in an ecosystem that affects the balance. Disruptions can be natural (like a wildfire) or caused by humans (like pollution).

### What If Scenario 1: The Bees Disappear

Bees pollinate flowers, which helps plants reproduce. If bees disappeared:
- Many plants could not make seeds
- Fruits and vegetables would become scarce
- Animals that eat those plants would have less food
- The entire ecosystem would suffer

This is why protecting bees is so important!

### What If Scenario 2: Too Many Deer

If all the wolves in a forest were removed:
- Deer population would grow quickly (no predators!)
- Too many deer would eat too many plants
- Smaller animals that depend on those plants would lose their homes
- The soil might erode without plant roots holding it in place
- The entire forest ecosystem would change

This actually happened in Yellowstone National Park! When wolves were reintroduced, the whole ecosystem recovered.

### What If Scenario 3: Pollution in a River

If chemicals are dumped into a river:
- Algae might grow out of control (chemicals can act like fertilizer)
- Too much algae blocks sunlight from reaching underwater plants
- Fish lose their food source and oxygen decreases
- Birds and other animals that eat fish are affected
- The whole food chain is disrupted

### What If Scenario 4: Climate Change

As temperatures rise:
- Some animals need to move to cooler areas
- Some plants cannot grow where they used to
- Ice melts, affecting polar ecosystems
- Weather patterns change, causing floods or droughts

### What YOU Can Do

You might feel small, but you can make a big difference:
- **Reduce, reuse, recycle** to decrease pollution
- **Plant native plants** to support local ecosystems
- **Save water** because every drop matters
- **Learn about local wildlife** and share what you know
- **Pick up litter** to keep habitats clean
- **Talk about it** because awareness creates change

### The Big Picture

Everything in nature is connected. When we take care of one part of the ecosystem, we help all of it. And when we damage one part, everything feels the effects. Understanding these connections is the first step to being a great steward of our planet.

You are a nature champion in training! The more you learn about ecosystems, the better equipped you are to protect them.`,
    },

    // ============================================================
    // SEL 3-5: Growth Mindset - needs lessons 2, 3
    // ============================================================
    {
      id: "lesson_sel_3_5_module_1_2",
      moduleId: "sel_3_5_module_1",
      lessonNumber: 2,
      title: "Mistakes Are Learning Fuel",
      durationMinutes: 25,
      activityType: "sorting",
      activityData: JSON.stringify({
        categories: ["Growth Mindset Response", "Fixed Mindset Response"],
        items: [
          { text: "I failed the test, so I'll study differently next time", category: "Growth Mindset Response" },
          { text: "I failed the test, so I must be dumb", category: "Fixed Mindset Response" },
          { text: "This is hard, but hard things help me grow", category: "Growth Mindset Response" },
          { text: "This is hard, so I should just give up", category: "Fixed Mindset Response" },
          { text: "She is better than me, so I can learn from her", category: "Growth Mindset Response" },
          { text: "She is better than me, so why even try", category: "Fixed Mindset Response" },
          { text: "I made a mistake, which means I am learning something new", category: "Growth Mindset Response" },
          { text: "I made a mistake, which means I am a failure", category: "Fixed Mindset Response" },
        ],
        instructions: "Sort these responses! Growth mindset sees challenges and mistakes as opportunities. Fixed mindset sees them as proof you cannot do it.",
      }),
      content: `## Mistakes Are Learning Fuel

Last time, you learned about the power of the word YET. Today we are going to dive deeper into one of the most important lessons you will ever learn: mistakes are not failures. They are FUEL for learning!

### Your Brain on Mistakes

Here is something amazing that scientists discovered: when you make a mistake and then figure out what went wrong, your brain actually grows MORE than when you get something right on the first try!

That means the student who struggles with a math problem and eventually figures it out is actually learning MORE than the student who gets it right immediately. Struggling is growing!

### Famous Mistakes That Changed the World

- **Penicillin** (the medicine that saves millions of lives) was discovered by accident when Alexander Fleming left a petri dish uncovered
- **Post-it Notes** were created when a scientist was trying to make strong glue but accidentally made weak glue instead
- **Chocolate chip cookies** were an accident! Ruth Wakefield expected the chocolate to melt into the dough, but it did not

Mistakes can lead to incredible discoveries!

### Reframing Your Mistakes

Every time you make a mistake, you can choose how to think about it:

**Fixed mindset:** "I got it wrong. I am not smart enough."
**Growth mindset:** "I got it wrong. Now I know one way that does not work. What can I try next?"

The mistake is the same. The difference is entirely in how you THINK about it.

### The Learning Process

Learning anything new follows this pattern:
1. Try something new
2. Make mistakes (this is normal and expected!)
3. Figure out what went wrong
4. Try again with new understanding
5. Get a little better each time
6. Eventually succeed!

Notice that mistakes are built right into the process. They are not interruptions. They are essential steps.

### Your Mistake Journal

Start a "Mistake Journal" where you write down one mistake you made each day and what you learned from it. After a week, look back and see how much you have grown!

### Remember

The bravest thing you can do is try something hard, make mistakes, and keep going. That takes real courage. And you have it!`,
    },
    {
      id: "lesson_sel_3_5_module_1_3",
      moduleId: "sel_3_5_module_1",
      lessonNumber: 3,
      title: "Setting Goals and Tracking Your Growth",
      durationMinutes: 25,
      activityType: "breathing",
      activityData: JSON.stringify({
        pattern: "4-4-4",
        rounds: 3,
        instructions: "Before we set goals, let us calm our minds and focus. Breathe in for 4 counts, hold for 4 counts, breathe out for 4 counts. This helps you think clearly about what you want to achieve.",
      }),
      content: `## Setting Goals and Tracking Your Growth

You have learned about the power of YET and how mistakes help you grow. Now let's put it all together by learning how to set goals and track your amazing progress!

### What Is a Goal?

A goal is something you want to achieve. But not all goals are equal. Let's learn how to set SMART goals:

- **S**pecific - Be clear about what you want to do
- **M**easurable - How will you know when you have done it?
- **A**chievable - Is this realistic?
- **R**elevant - Does this matter to you?
- **T**ime-bound - When will you achieve it by?

### Bad Goal vs. SMART Goal

**Bad goal:** "Get better at reading."
**SMART goal:** "Read one chapter book every two weeks for the next two months."

**Bad goal:** "Be nicer."
**SMART goal:** "Give one genuine compliment to a classmate every day this week."

**Bad goal:** "Do well in math."
**SMART goal:** "Practice multiplication facts for 10 minutes every night and score 80% or higher on Friday's quiz."

### Breaking Big Goals into Small Steps

Big goals can feel overwhelming. The trick is to break them into small, manageable steps:

**Big Goal:** "Learn to play guitar"
**Small Steps:**
1. Learn to hold the guitar correctly (this week)
2. Learn 3 basic chords (this month)
3. Practice for 15 minutes every day
4. Play a simple song by the end of the month

Each small step is a mini victory that keeps you motivated!

### Tracking Your Progress

There are fun ways to track your growth:
- **Progress charts** where you color in each step completed
- **Journals** where you write about your progress
- **Checklists** where you tick off accomplishments
- **Before and after** comparisons

### Celebrating Progress, Not Just Success

Do not wait until you reach your big goal to celebrate! Celebrate every step along the way:
- Finished step 1? Celebrate!
- Kept trying after a tough day? Celebrate!
- Asked for help when you needed it? Celebrate!

### Your Growth Mindset Toolkit

You now have a complete toolkit:
1. The Power of YET - "I can't do this YET"
2. Mistakes are learning fuel
3. SMART goals to guide your growth
4. Progress tracking to see how far you have come

### Remember

Growth is not always a straight line up. Sometimes you will have setbacks. That is completely normal. What matters is that you keep moving forward, one small step at a time. You are stronger than you know, and you are more capable than you believe. Keep growing!`,
    },

    // ============================================================
    // WELLNESS 3-5: Nutrition Science - needs lessons 2, 3
    // ============================================================
    {
      id: "lesson_wellness_3_5_module_1_2",
      moduleId: "wellness_3_5_module_1",
      lessonNumber: 2,
      title: "Reading Nutrition Labels Like a Pro",
      durationMinutes: 25,
      activityType: "matching",
      activityData: JSON.stringify({
        pairs: [
          { term: "Serving Size", definition: "How much of the food counts as one serving" },
          { term: "Calories", definition: "How much energy the food gives your body" },
          { term: "Protein", definition: "Helps build and repair your muscles" },
          { term: "Fiber", definition: "Helps your digestive system work well" },
          { term: "Added Sugar", definition: "Extra sweetness put in during processing, not naturally in the food" },
        ],
        instructions: "Match each nutrition label term with what it means. Knowing how to read labels helps you make smarter food choices!",
      }),
      content: `## Reading Nutrition Labels Like a Pro

You are now old enough to start understanding what is in your food! Nutrition labels might look confusing at first, but today you are going to crack the code.

### What Is a Nutrition Label?

A nutrition label is like a food's report card. It tells you exactly what is inside the package. By law, almost every packaged food must have one.

### The Key Parts

**Serving Size:** This is super important! Everything on the label is based on ONE serving. If the serving size is 10 chips and you eat 20 chips, you need to DOUBLE all the numbers.

**Calories:** Calories are energy. Your body needs calories to run, play, think, and grow. Kids your age need about 1,400-2,000 calories per day, depending on how active you are.

**Protein:** This is your body's building material. It helps build muscles, repair injuries, and keep you strong. Good sources: chicken, beans, eggs, milk, nuts.

**Fiber:** This keeps your digestive system running smoothly. It also helps you feel full. Good sources: whole grains, fruits, vegetables, beans.

**Fat:** Your body needs some fat to be healthy! But not all fats are the same. Fats from nuts, fish, and avocados are healthier than fats from fried foods.

**Sugar:** This is where you need to be a detective. There are two types:
- **Natural sugars** in fruits and milk (these are fine!)
- **Added sugars** put in during processing (these should be limited)

### The Ingredient List

Ingredients are listed in order from MOST to LEAST. If sugar is the first ingredient, that food is mostly sugar! Look for foods where real ingredients (like whole wheat, chicken, or vegetables) come first.

### Label Reading Tips

- Compare similar products (two brands of cereal)
- Check the serving size (is it realistic?)
- Look for foods high in protein and fiber
- Watch out for high sodium (salt) and added sugar
- Remember: "low fat" does not mean healthy (they often add sugar instead)

### Your Detective Mission

Next time you are at the store or in your kitchen, pick up 3 food packages and read their nutrition labels. Compare them! Which has the most protein? Which has the least sugar? You are becoming a nutrition detective!`,
    },
    {
      id: "lesson_wellness_3_5_module_1_3",
      moduleId: "wellness_3_5_module_1",
      lessonNumber: 3,
      title: "Building a Balanced Plate",
      durationMinutes: 25,
      activityType: "sorting",
      activityData: JSON.stringify({
        categories: ["Fruits & Vegetables", "Grains", "Protein", "Dairy"],
        items: [
          { text: "An apple", category: "Fruits & Vegetables" },
          { text: "Whole wheat bread", category: "Grains" },
          { text: "Grilled chicken", category: "Protein" },
          { text: "A glass of milk", category: "Dairy" },
          { text: "Broccoli", category: "Fruits & Vegetables" },
          { text: "Brown rice", category: "Grains" },
          { text: "Black beans", category: "Protein" },
          { text: "Yogurt", category: "Dairy" },
          { text: "Carrots and celery", category: "Fruits & Vegetables" },
          { text: "Oatmeal", category: "Grains" },
        ],
        instructions: "Sort these foods into the correct food group! A balanced meal includes foods from multiple groups.",
      }),
      content: `## Building a Balanced Plate

You know about the food groups and can read nutrition labels. Now let's put it all together and learn how to build meals that fuel your amazing body and brain!

### The Balanced Plate

Imagine dividing your plate into sections:
- **Half your plate:** Fruits and vegetables (the more colorful, the better!)
- **One quarter:** Grains (choose whole grains when you can)
- **One quarter:** Protein (lean meats, beans, eggs, nuts)
- **A side:** Dairy or calcium-rich foods (milk, yogurt, cheese)
- **Plus:** Water! Your body needs lots of it

### Why Balance Matters

Your body is like a car. It needs the right fuel to run well:
- **Fruits and vegetables** give you vitamins and minerals (like premium fuel)
- **Grains** give you energy to play and learn (like gasoline)
- **Protein** builds and repairs your muscles (like replacement parts)
- **Dairy** builds strong bones and teeth (like keeping the frame strong)

If you only eat one type of food, it is like trying to run a car on one ingredient. You need all of them!

### Eating the Rainbow

Here is a fun way to make sure you are getting enough nutrients: eat the rainbow!
- **Red:** Tomatoes, strawberries, apples
- **Orange:** Carrots, oranges, sweet potatoes
- **Yellow:** Bananas, corn, pineapple
- **Green:** Broccoli, spinach, grapes
- **Blue/Purple:** Blueberries, eggplant, plums

Each color provides different vitamins and minerals that your body needs.

### Smart Snacking

Snacks are not bad! They can be really helpful for keeping your energy up between meals. Smart snacks include:
- Apple slices with peanut butter (fruit + protein)
- Cheese and whole grain crackers (dairy + grains)
- Trail mix with nuts and dried fruit (protein + fruit)
- Yogurt with berries (dairy + fruit)

### Food and Your Mood

Did you know that what you eat affects how you feel? Foods high in sugar might give you quick energy, but then you crash and feel tired. Balanced meals with protein, fiber, and healthy fats give you steady energy that lasts.

### Your Balanced Plate Challenge

Design your ideal balanced meal! Draw a plate and fill it with foods from different groups. Use the half-quarter-quarter guide. Share your balanced plate with your family and see if you can make it for dinner this week!

### Remember

There are no "good" or "bad" foods. All foods can be part of a healthy diet. The key is balance. Eat mostly nourishing foods, enjoy treats in moderation, and listen to your body. You are learning to take care of the amazing body you have!`,
    },

    // ============================================================
    // ELA 6-8: Persuasive Writing - needs 3 lessons
    // ============================================================
    {
      id: "lesson_ela_6_8_module_1_1",
      moduleId: "ela_6_8_module_1",
      lessonNumber: 1,
      title: "The Power of Persuasion: Ethos, Pathos, Logos",
      durationMinutes: 35,
      activityType: "sorting",
      activityData: JSON.stringify({
        categories: ["Ethos (Credibility)", "Pathos (Emotion)", "Logos (Logic)"],
        items: [
          { text: "According to Dr. Smith, a leading expert in climate science...", category: "Ethos (Credibility)" },
          { text: "Imagine a world where no child goes to bed hungry...", category: "Pathos (Emotion)" },
          { text: "Studies show that 78% of students perform better with...", category: "Logos (Logic)" },
          { text: "As a coach with 20 years of experience, I can tell you...", category: "Ethos (Credibility)" },
          { text: "How would you feel if your favorite park was turned into a parking lot?", category: "Pathos (Emotion)" },
          { text: "If we reduce waste by 30%, we will save $2 million annually", category: "Logos (Logic)" },
        ],
        instructions: "Sort these persuasive statements by their type. Ethos appeals to credibility, pathos appeals to emotion, and logos appeals to logic and evidence.",
      }),
      content: `## The Power of Persuasion: Ethos, Pathos, Logos

Words have power. The ability to construct a compelling argument is one of the most important skills you will ever develop. Whether you are writing an essay, giving a speech, or even texting a friend about where to eat lunch, you are using persuasion.

### The Three Pillars of Persuasion

Over 2,000 years ago, the Greek philosopher Aristotle identified three ways to persuade people. We still use these today.

### Ethos: Credibility

Ethos is about trust and authority. You persuade by showing you (or your source) are knowledgeable and trustworthy.

**Examples:**
- Citing an expert: "According to NASA scientists..."
- Establishing your experience: "As someone who has volunteered at the shelter for two years..."
- Referencing reputable sources: "Harvard Medical School reports that..."

**When to use it:** When your audience needs to trust that the information is reliable.

### Pathos: Emotion

Pathos connects with feelings. You persuade by making people feel something: compassion, anger, hope, fear, pride.

**Examples:**
- Storytelling: "Maria walked two miles to school every day, rain or shine, because there was no bus route to her neighborhood."
- Vivid imagery: "Picture a beach covered not in sand, but in plastic waste."
- Rhetorical questions: "How would you feel if you could not afford your textbooks?"

**When to use it:** When you want people to care deeply about your topic.

### Logos: Logic

Logos appeals to reason. You persuade with evidence, data, and logical arguments.

**Examples:**
- Statistics: "73% of students who eat breakfast perform better on tests."
- Cause and effect: "If we plant 1,000 trees, we will absorb 48 tons of CO2 per year."
- Logical reasoning: "Since exercise improves brain function, and students need strong brain function, schools should increase PE time."

**When to use it:** When your audience values evidence and rational thinking.

### The Best Arguments Use All Three

The most persuasive arguments combine ethos, pathos, and logos. They establish credibility, connect emotionally, AND provide evidence. Think of them as three legs of a stool: all three make it strong and balanced.

### Your Turn

Think of something you feel strongly about: longer recess, later school start times, more library books, whatever matters to you. Write one sentence using each type of persuasion (ethos, pathos, logos) about your topic.`,
    },
    {
      id: "lesson_ela_6_8_module_1_2",
      moduleId: "ela_6_8_module_1",
      lessonNumber: 2,
      title: "Building a Persuasive Argument",
      durationMinutes: 35,
      activityType: "writing",
      activityData: JSON.stringify({
        prompt: "Write a persuasive paragraph about something you believe should change at your school or in your community. Include: (1) A clear claim, (2) At least 2 pieces of evidence, (3) A counterargument and your response to it, (4) A call to action.",
        instructions: "Practice constructing a complete persuasive argument. Strong arguments acknowledge opposing views and address them directly.",
      }),
      content: `## Building a Persuasive Argument

Now that you know the three pillars of persuasion, let's learn how to structure a complete persuasive argument. A well-structured argument is like a well-built house: it stands strong even when challenged.

### The Anatomy of a Persuasive Essay

**1. Introduction with a Hook**
Grab the reader's attention and present your claim (thesis).

"Every year, American schools throw away 530,000 tons of food. This is not just wasteful; it is a solvable problem. Schools should implement composting programs to reduce waste, save money, and teach students environmental responsibility."

**2. Body Paragraphs with Evidence**
Each body paragraph should present one reason with supporting evidence.

**Reason 1 + Evidence:** "Composting reduces landfill waste. According to the EPA, food waste makes up 22% of landfill content."

**Reason 2 + Evidence:** "Composting saves money. Schools that compost report 40% lower waste disposal costs."

**Reason 3 + Evidence:** "Composting teaches responsibility. Students who participate in composting programs score higher on environmental science assessments."

**3. Counterargument and Rebuttal**
Address what someone who disagrees might say, then respond.

"Some argue that composting is too expensive to set up. However, the initial investment is recovered within the first year through reduced waste disposal costs, and many local governments offer free composting equipment to schools."

**4. Conclusion with a Call to Action**
Summarize your argument and tell the reader what to do next.

"The evidence is clear: composting benefits our environment, our budgets, and our students. Contact your school board today and ask them to start a composting program."

### The Power of Counterarguments

Many students skip counterarguments because they think acknowledging the other side makes their argument weaker. The opposite is true! Addressing counterarguments shows you have thought deeply about the issue and can defend your position.

### Transition Words

Good persuasive writing uses transitions to connect ideas:
- Furthermore, moreover, in addition (adding evidence)
- However, nevertheless, on the other hand (introducing counterarguments)
- Therefore, consequently, as a result (drawing conclusions)

### Your Assignment

Choose a topic you care about and write a full persuasive paragraph using the structure above. Include at least one counterargument and your rebuttal. Remember to use ethos, pathos, and logos!`,
    },
    {
      id: "lesson_ela_6_8_module_1_3",
      moduleId: "ela_6_8_module_1",
      lessonNumber: 3,
      title: "Detecting Persuasion in Media",
      durationMinutes: 35,
      activityType: "matching",
      activityData: JSON.stringify({
        pairs: [
          { term: "Bandwagon", definition: "Everyone is doing it, so you should too!" },
          { term: "Appeal to Fear", definition: "If you don't act now, something terrible will happen!" },
          { term: "Testimonial", definition: "A famous person says it's great, so it must be!" },
          { term: "Loaded Language", definition: "Using emotionally charged words to influence your reaction" },
          { term: "False Dilemma", definition: "Presenting only two options when there are actually more" },
        ],
        instructions: "Match each persuasion technique with its description. Being able to recognize these techniques helps you think critically about the messages you receive every day.",
      }),
      content: `## Detecting Persuasion in Media

You are learning to be persuasive. Now let's flip the script: how do you detect when someone is trying to persuade YOU? In a world full of advertisements, social media, and 24-hour news, this skill is essential.

### You Are Being Persuaded All Day

Think about how many persuasive messages you encounter daily:
- Advertisements on TV, online, and in stores
- Social media posts designed to get likes and shares
- News headlines crafted to get clicks
- Friends trying to influence your decisions
- Politicians asking for support

Being able to recognize persuasion techniques helps you make informed decisions instead of being manipulated.

### Common Persuasion Techniques

**Bandwagon:** "Everyone is switching to this product!" This makes you feel like you will be left out if you do not follow the crowd. But popularity does not equal quality.

**Appeal to Fear:** "Without this security system, your home is at risk!" Fear-based messaging pressures you to act without thinking. Ask yourself: is the threat real and proportional?

**Testimonial:** "Celebrity X uses this product!" Just because someone is famous does not mean they are an expert on the product. They are usually paid to endorse it.

**Loaded Language:** Words are chosen for emotional impact, not accuracy. "Freedom fighters" vs. "rebels" describe the same people but create very different feelings.

**False Dilemma:** "You are either with us or against us." This makes it seem like there are only two options, when usually there are many more.

**Cherry-Picking:** Selecting only the evidence that supports your argument while ignoring everything else. "4 out of 5 dentists recommend..." But what about the 5th dentist?

### The Critical Reader's Toolkit

When you encounter a persuasive message, ask:
1. Who created this and why?
2. What do they want me to think, feel, or do?
3. What evidence are they using? Is it reliable?
4. What are they NOT telling me?
5. Is this appealing to my emotions or my logic?

### Media Literacy in the Age of AI

AI can generate persuasive content at scale: fake reviews, misleading articles, deepfake videos. Your critical thinking skills are more important than ever. Do not accept information at face value. Verify, question, and think independently.

### Your Challenge

Find three advertisements (online, in a magazine, or on TV). For each one, identify which persuasion technique(s) are being used. Share your analysis with a friend or family member.`,
    },

    // ============================================================
    // MATH 6-8: Pre-Algebra - needs 3 lessons
    // ============================================================
    {
      id: "lesson_math_6_8_module_1_1",
      moduleId: "math_6_8_module_1",
      lessonNumber: 1,
      title: "Variables: Letters That Stand for Numbers",
      durationMinutes: 35,
      activityType: "matching",
      activityData: JSON.stringify({
        pairs: [
          { term: "x + 5 = 12", definition: "x equals 7" },
          { term: "2y = 10", definition: "y equals 5" },
          { term: "n - 3 = 8", definition: "n equals 11" },
          { term: "m / 4 = 3", definition: "m equals 12" },
          { term: "3a = 15", definition: "a equals 5" },
        ],
        instructions: "Match each equation with its solution. Think of the variable as a mystery number you need to find!",
      }),
      content: `## Variables: Letters That Stand for Numbers

Welcome to Pre-Algebra, the gateway to all higher mathematics. The concept you are about to learn, variables, is one of the most powerful ideas in all of math. It changed how humans think about problems.

### What Is a Variable?

A variable is a letter that stands for a number we do not know yet. Think of it as a mystery box: something is inside, and our job is to figure out what.

Instead of writing "? + 3 = 7" we write "x + 3 = 7"

The "x" is a placeholder for the unknown number. In this case, x = 4.

### Why Variables Matter

Before algebra, if you wanted to express the idea "any number plus 3 equals another number," you had no good way to write it. With variables, you can write: n + 3 = m. This works for ANY numbers, not just specific ones.

Variables let us express general patterns and relationships, which is the foundation of all mathematics, science, and engineering.

### Expressions vs. Equations

**Expression:** A mathematical phrase WITHOUT an equals sign
- 3x + 5 (this is an expression)
- 2y - 7 (this is an expression)

**Equation:** A mathematical statement WITH an equals sign
- 3x + 5 = 20 (this is an equation)
- 2y - 7 = 9 (this is an equation)

### Evaluating Expressions

To evaluate an expression, plug in a value for the variable:

If x = 4, what is 2x + 3?
Replace x with 4: 2(4) + 3 = 8 + 3 = 11

If y = 6, what is 3y - 2?
Replace y with 6: 3(6) - 2 = 18 - 2 = 16

### Translating Words to Math

One of the most useful algebra skills is turning word descriptions into mathematical expressions:
- "5 more than a number" becomes n + 5
- "twice a number" becomes 2n
- "a number decreased by 3" becomes n - 3
- "a number divided by 4" becomes n / 4

### The Key Insight

Variables are not scary. They are just a convenient way to talk about numbers we do not know yet. Every equation is a puzzle, and you are the detective solving it!`,
    },
    {
      id: "lesson_math_6_8_module_1_2",
      moduleId: "math_6_8_module_1",
      lessonNumber: 2,
      title: "Solving One-Step Equations",
      durationMinutes: 35,
      activityType: "sorting",
      activityData: JSON.stringify({
        categories: ["Add/Subtract to Solve", "Multiply/Divide to Solve"],
        items: [
          { text: "x + 7 = 15", category: "Add/Subtract to Solve" },
          { text: "3x = 21", category: "Multiply/Divide to Solve" },
          { text: "n - 4 = 9", category: "Add/Subtract to Solve" },
          { text: "y / 5 = 3", category: "Multiply/Divide to Solve" },
          { text: "m + 12 = 20", category: "Add/Subtract to Solve" },
          { text: "6a = 42", category: "Multiply/Divide to Solve" },
        ],
        instructions: "Sort these equations by the operation needed to solve them. Remember: use the inverse (opposite) operation to isolate the variable!",
      }),
      content: `## Solving One-Step Equations

Now that you understand variables, let's learn how to actually solve equations. The core idea is beautifully simple: whatever you do to one side of the equation, you must do to the other side.

### The Balance Principle

Think of an equation like a balance scale. Both sides are equal. If you add something to one side, you must add the same thing to the other side to keep it balanced.

x + 5 = 12

If I subtract 5 from the left side, I must subtract 5 from the right side:
x + 5 - 5 = 12 - 5
x = 7

### Inverse Operations

To solve an equation, use the OPPOSITE (inverse) operation:
- Addition and subtraction are inverses
- Multiplication and division are inverses

If the equation has addition, use subtraction to solve.
If the equation has multiplication, use division to solve.

### Solving Addition/Subtraction Equations

**x + 8 = 15**
Subtract 8 from both sides: x = 15 - 8 = 7

**n - 3 = 10**
Add 3 to both sides: n = 10 + 3 = 13

### Solving Multiplication/Division Equations

**4x = 20**
Divide both sides by 4: x = 20 / 4 = 5

**y / 3 = 6**
Multiply both sides by 3: y = 6 x 3 = 18

### Checking Your Work

Always plug your answer back into the original equation to verify:

If x + 8 = 15 and you found x = 7:
Check: 7 + 8 = 15. That is correct!

If 4x = 20 and you found x = 5:
Check: 4(5) = 20. That is correct!

### Common Mistakes to Avoid

- Forgetting to do the same thing to both sides
- Using the wrong inverse operation
- Making arithmetic errors (always double-check!)
- Not checking your answer

### Why This Matters

Solving equations is not just a school skill. Engineers use equations to design bridges. Scientists use them to understand the universe. Economists use them to predict markets. Doctors use them to calculate dosages. Algebra is the language of problem-solving.

### Practice

The only way to get comfortable with solving equations is practice. Start with simple ones and work your way up. Before you know it, solving equations will feel as natural as basic arithmetic.`,
    },
    {
      id: "lesson_math_6_8_module_1_3",
      moduleId: "math_6_8_module_1",
      lessonNumber: 3,
      title: "Writing Equations from Word Problems",
      durationMinutes: 35,
      activityType: "discussion",
      activityData: JSON.stringify({
        prompt: "Write a real-world word problem that can be solved using a one-step equation. Then write the equation and solve it. Challenge: Can you write a problem that uses multiplication or division?",
        instructions: "Create your own word problems! This is the ultimate test of understanding: can you create problems, not just solve them?",
      }),
      content: `## Writing Equations from Word Problems

This is where algebra gets really practical. In the real world, nobody hands you an equation to solve. Instead, you encounter situations and need to figure out the equation yourself.

### The Translation Process

Converting a word problem into an equation follows these steps:

1. **Read** the problem carefully
2. **Identify** what you know and what you need to find
3. **Assign** a variable to the unknown
4. **Translate** the words into mathematical operations
5. **Solve** the equation
6. **Check** your answer in context

### Key Translation Words

**Addition:** sum, total, more than, increased by, combined
**Subtraction:** difference, less than, decreased by, remaining
**Multiplication:** product, times, of, each
**Division:** quotient, divided by, per, shared equally
**Equals:** is, equals, results in, gives

### Example 1: Addition

"After earning $15 mowing lawns, Marcus has $42 in his savings account. How much did he have before?"

Let x = the amount Marcus had before.
x + 15 = 42
x = 42 - 15
x = 27

Marcus had $27 before.
Check: $27 + $15 = $42. Correct!

### Example 2: Multiplication

"Each ticket to the school play costs $8. The class collected $96 from ticket sales. How many tickets were sold?"

Let t = number of tickets.
8t = 96
t = 96 / 8
t = 12

Twelve tickets were sold.
Check: 12 x $8 = $96. Correct!

### Example 3: Division

"A bag of candy is shared equally among 6 friends. Each friend gets 7 pieces. How many pieces were in the bag?"

Let c = total pieces.
c / 6 = 7
c = 7 x 6
c = 42

There were 42 pieces in the bag.
Check: 42 / 6 = 7. Correct!

### Tips for Success

- Draw a picture if it helps
- Underline the key information
- Circle the question being asked
- Do not rush to write the equation
- Always check that your answer makes sense in the real world

### The Big Picture

You are not just learning to solve math problems. You are learning to model the real world with mathematics. This is the fundamental skill that scientists, engineers, economists, and data analysts use every day. Every time you translate a situation into an equation, you are thinking like a professional problem solver.`,
    },

    // ============================================================
    // SEL 6-8: Identity & Self-Awareness - needs lessons 2, 3
    // ============================================================
    {
      id: "lesson_sel_6_8_module_1_2",
      moduleId: "sel_6_8_module_1",
      lessonNumber: 2,
      title: "Managing Stress and Big Emotions",
      durationMinutes: 30,
      activityType: "breathing",
      activityData: JSON.stringify({
        pattern: "4-7-8",
        rounds: 4,
        instructions: "This is the 4-7-8 breathing technique, used by therapists and athletes worldwide. Breathe in through your nose for 4 seconds, hold your breath for 7 seconds, then exhale slowly through your mouth for 8 seconds. This activates your body's relaxation response.",
      }),
      content: `## Managing Stress and Big Emotions

Middle school can be intense. Your brain is developing, your body is changing, school is getting harder, and social dynamics are getting more complex. Feeling stressed is completely normal. What matters is how you handle it.

### Understanding Stress

Stress is your body's response to challenges. In small doses, stress can actually be helpful. It gives you energy before a big test or motivation to meet a deadline. This is called "eustress" (good stress).

But when stress becomes constant or overwhelming, it can affect your health, your mood, and your ability to think clearly. This is "distress" (harmful stress).

### Signs of Too Much Stress

**Physical:** Headaches, stomachaches, trouble sleeping, muscle tension, fatigue
**Emotional:** Irritability, anxiety, sadness, feeling overwhelmed, mood swings
**Behavioral:** Withdrawing from friends, losing interest in activities, procrastinating, snapping at people
**Cognitive:** Difficulty concentrating, forgetfulness, negative thinking, racing thoughts

### Your Stress Management Toolkit

**1. Deep Breathing**
The 4-7-8 technique is scientifically proven to reduce anxiety. When you breathe deeply, you activate your parasympathetic nervous system, which tells your body "you are safe."

**2. Physical Activity**
Exercise releases endorphins (your body's natural mood boosters). Even a 10-minute walk can make a difference.

**3. Journaling**
Writing about your thoughts and feelings helps process them. You do not have to solve anything; just getting it out of your head helps.

**4. Talking to Someone**
Sharing your feelings with a trusted person, whether it is a friend, parent, teacher, or counselor, can provide perspective and relief.

**5. Time in Nature**
Research shows that spending time outdoors reduces cortisol (the stress hormone). Even looking at nature through a window helps.

**6. Creative Expression**
Drawing, painting, playing music, dancing, or writing poetry can be powerful outlets for emotions.

### The Emotional Vocabulary

The more precisely you can name your emotions, the better you can manage them. Instead of just saying "I feel bad," try to be specific:
- Am I frustrated? Disappointed? Anxious? Lonely? Overwhelmed?

Naming an emotion reduces its power over you. This is scientifically proven.

### It Is OK to Not Be OK

There are going to be days when nothing seems to help and everything feels heavy. That is OK. Those days pass. If they do not pass, or if your stress feels unmanageable, reach out to a trusted adult or school counselor. Asking for help is not weakness. It is strength.`,
    },
    {
      id: "lesson_sel_6_8_module_1_3",
      moduleId: "sel_6_8_module_1",
      lessonNumber: 3,
      title: "Navigating Peer Pressure and Relationships",
      durationMinutes: 30,
      activityType: "sorting",
      activityData: JSON.stringify({
        categories: ["Healthy Relationship Sign", "Unhealthy Relationship Sign"],
        items: [
          { text: "They support your goals and celebrate your successes", category: "Healthy Relationship Sign" },
          { text: "They pressure you to do things you are uncomfortable with", category: "Unhealthy Relationship Sign" },
          { text: "They respect your boundaries when you say no", category: "Healthy Relationship Sign" },
          { text: "They make you feel bad about yourself to feel better about themselves", category: "Unhealthy Relationship Sign" },
          { text: "They are honest with you even when it is hard", category: "Healthy Relationship Sign" },
          { text: "They talk about you behind your back", category: "Unhealthy Relationship Sign" },
          { text: "You feel safe being yourself around them", category: "Healthy Relationship Sign" },
          { text: "They give you the silent treatment when they are upset", category: "Unhealthy Relationship Sign" },
        ],
        instructions: "Sort these relationship characteristics. Recognizing the difference between healthy and unhealthy relationships is one of the most important life skills you can develop.",
      }),
      content: `## Navigating Peer Pressure and Relationships

Friendships and social dynamics are a huge part of your life right now. Learning to navigate peer pressure and build healthy relationships will serve you long after middle school is a distant memory.

### Understanding Peer Pressure

Peer pressure is not always someone saying "do this or you are not cool." It is often much more subtle:
- Feeling like you need to dress a certain way to fit in
- Laughing at a joke that is actually mean
- Going along with something because everyone else is
- Posting something online because you think it will get likes
- Staying silent when you see someone being treated unfairly

### The Inner Compass Technique

When you feel pressured, check in with your inner compass:
1. **Pause.** Do not react immediately.
2. **Check your gut.** Does this feel right or wrong?
3. **Think ahead.** Will I be proud of this choice tomorrow?
4. **Consider consequences.** What could happen?
5. **Choose.** Act based on YOUR values, not someone else's expectations.

### Saying No Without Losing Friends

Real friends respect your boundaries. Here are ways to say no:
- "That is not really my thing, but have fun!"
- "I am going to pass, thanks."
- "I do not feel comfortable with that."
- "My parents would not be OK with that." (It is fine to use this even if it is not true.)
- Simply changing the subject

If someone stops being your friend because you said no, they were not really your friend.

### What Makes a Good Friend?

Good friends:
- Accept you as you are
- Support your goals and interests
- Are honest, even when it is uncomfortable
- Respect your boundaries
- Make you feel better about yourself, not worse
- Are there during hard times, not just fun times

### Handling Conflict

Conflict is normal in any relationship. What matters is how you handle it:
- **Talk about it.** Use "I feel" statements instead of "You always" statements.
- **Listen to understand,** not just to respond.
- **Look for solutions,** not blame.
- **Take a break** if things get too heated.
- **Apologize** when you are wrong. It takes courage and earns respect.

### Online Relationships

The same principles apply online:
- Treat people with the same respect you would in person
- Do not say things behind a screen that you would not say face to face
- Remember that tone is hard to read in text. When in doubt, assume good intentions.
- It is OK to unfollow or block accounts that make you feel bad

### You Deserve Good Relationships

Never settle for relationships where you feel small, pressured, or disrespected. You deserve people who lift you up. Surround yourself with people who bring out the best in you, and be that kind of person for others.`,
    },

    // ============================================================
    // WELLNESS 6-8: Digital Wellness - needs lessons 2, 3
    // ============================================================
    {
      id: "lesson_wellness_6_8_module_1_2",
      moduleId: "wellness_6_8_module_1",
      lessonNumber: 2,
      title: "Social Media and Mental Health",
      durationMinutes: 30,
      activityType: "matching",
      activityData: JSON.stringify({
        pairs: [
          { term: "Doomscrolling", definition: "Endlessly scrolling through negative news without stopping" },
          { term: "Social comparison", definition: "Measuring your worth by comparing yourself to others online" },
          { term: "FOMO", definition: "Fear of missing out on experiences others seem to be having" },
          { term: "Digital detox", definition: "Taking a planned break from devices and social media" },
          { term: "Curated feed", definition: "Choosing which accounts and content you follow intentionally" },
        ],
        instructions: "Match each digital wellness term with its definition. Understanding these concepts helps you take control of your online experience.",
      }),
      content: `## Social Media and Mental Health

Social media is a powerful tool for connection, creativity, and information. But research also shows it can negatively affect mental health, especially for young people. Understanding the relationship between social media and your wellbeing helps you use it wisely.

### The Design Behind the Scroll

Social media platforms are designed by some of the smartest engineers in the world to keep you scrolling. They use:

- **Infinite scroll:** No natural stopping point, so you keep going
- **Variable rewards:** Sometimes you get lots of likes, sometimes few, which is the same pattern slot machines use
- **Notifications:** Constant alerts that pull you back
- **Algorithm-driven feeds:** Content selected to trigger emotional responses

This is not a conspiracy theory. Tech executives have publicly discussed these design choices. Understanding them helps you recognize when you are being manipulated.

### How Social Media Can Affect You

**The Comparison Trap:** People post their best moments, filtered and curated. Comparing your everyday life to someone's highlight reel is a recipe for feeling inadequate.

**The Validation Loop:** When your self-worth depends on likes and comments, you are giving strangers control over how you feel about yourself.

**Information Overload:** Constant exposure to news, opinions, and drama is mentally exhausting.

**Sleep Disruption:** Screen use before bed, especially social media, disrupts sleep quality, which affects everything else.

### Taking Back Control

**1. Audit Your Follows**
Unfollow accounts that make you feel bad. Follow accounts that inspire, educate, or genuinely make you smile.

**2. Set Time Limits**
Use your phone's screen time features. Set specific times for social media use rather than checking constantly.

**3. Turn Off Notifications**
You do not need to be alerted every time something happens online. Check on your own schedule.

**4. Practice Digital Detox**
Try going 24 hours without social media. Notice how you feel. Many people report feeling calmer and more present.

**5. Be a Positive Presence**
Post things that uplift others. Leave kind comments. Be the account someone is glad they follow.

### The Real vs. The Reel

Remember: what you see online is not reality. It is a carefully selected slice of someone's life. The person posting about their "perfect day" might have cried that morning. The influencer showing their "amazing body" might have an eating disorder. Things are rarely as they appear.

### You Have the Power

You get to decide how social media fits into your life. You can use it as a tool for good while protecting your mental health. That is not easy, but you are learning the skills to do it.`,
    },
    {
      id: "lesson_wellness_6_8_module_1_3",
      moduleId: "wellness_6_8_module_1",
      lessonNumber: 3,
      title: "Creating Your Personal Wellness Plan",
      durationMinutes: 30,
      activityType: "emotion_checkin",
      activityData: JSON.stringify({
        emotions: ["Motivated", "Balanced", "Aware", "Determined", "Calm", "Empowered"],
        prompt: "After learning about digital wellness, how do you feel about your relationship with technology? Whatever you feel is the starting point for positive change.",
      }),
      content: `## Creating Your Personal Wellness Plan

You have learned about screen time, social media's impact, and healthy digital habits. Now it is time to create a personalized plan that works for YOUR life.

### Why a Plan Matters

Knowing what to do and actually doing it are different things. A plan gives you structure and accountability. It turns good intentions into concrete actions.

### Your Wellness Plan Components

**1. Screen Time Goals**
Be realistic. Going from 6 hours of screen time to 1 hour overnight is not sustainable. Try reducing by 30 minutes per week.

My current screen time: ___ hours/day
My goal: ___ hours/day
How I will get there: ___

**2. No-Screen Zones**
Identify places and times where screens are not allowed:
- Bedroom at night (charge phone outside your room)
- During meals (be present with family/friends)
- First 30 minutes after waking up
- The last hour before bed

**3. Active Alternatives**
For every hour you cut from screens, plan something to replace it:
- Physical activity (sports, walking, dancing)
- Creative activities (drawing, music, crafting)
- Social time (face-to-face with friends or family)
- Learning (reading, puzzles, new skills)
- Nature time (parks, hiking, gardening)

**4. Social Media Boundaries**
- Which platforms will you keep?
- How often will you check them?
- What types of content will you engage with?
- What will you do when you notice yourself comparing?

**5. Support System**
- Who will hold you accountable?
- Who can you talk to when you struggle?
- How will you get back on track if you slip?

### The Self-Compassion Component

Here is the most important part: be kind to yourself. Changing habits is hard. You will have setbacks. That is completely normal and expected. The goal is not perfection. The goal is gradual, sustainable improvement.

### Weekly Check-In

Every week, ask yourself:
- How is my screen time compared to my goal?
- How am I feeling physically and mentally?
- Am I spending enough time on things that matter?
- What adjustment do I need to make?

### Your Wellness Is an Investment

The time you invest in your wellness now pays dividends for the rest of your life. The habits you build in middle school will carry into high school, college, and adulthood. You are investing in your future self.

### Remember

Balance is not about being perfect. It is about being intentional. Use technology as a tool, not a crutch. Be the boss of your devices. And always, always prioritize your mental health.`,
    },

    // ============================================================
    // ELA 9-12: Critical Analysis - needs 3 lessons
    // ============================================================
    {
      id: "lesson_ela_9_12_module_1_1",
      moduleId: "ela_9_12_module_1",
      lessonNumber: 1,
      title: "Rhetorical Analysis: Deconstructing Arguments",
      durationMinutes: 40,
      activityType: "matching",
      activityData: JSON.stringify({
        pairs: [
          { term: "Rhetorical situation", definition: "The context including speaker, audience, purpose, and occasion" },
          { term: "Claim", definition: "The central argument or position being advanced" },
          { term: "Warrant", definition: "The underlying assumption that connects evidence to the claim" },
          { term: "Concession", definition: "Acknowledging the validity of an opposing point" },
          { term: "Rebuttal", definition: "Directly countering an opposing argument with evidence" },
        ],
        instructions: "Match each rhetorical analysis term with its definition. These are the tools of advanced critical reading and writing.",
      }),
      content: `## Rhetorical Analysis: Deconstructing Arguments

Critical analysis is the ability to examine texts, arguments, and ideas beneath their surface. It is the difference between being a passive consumer of information and an active, independent thinker.

### The Rhetorical Situation

Every piece of communication exists within a context. Understanding that context is essential to analysis:

**Speaker/Author:** Who is communicating? What is their background, expertise, and potential bias?
**Audience:** Who is the intended audience? How does this shape the message?
**Purpose:** What is the goal? To inform? Persuade? Entertain? Provoke?
**Context/Occasion:** When and where was this created? What was happening in the world?
**Medium:** How is it delivered? A tweet operates differently than a Supreme Court opinion.

### Beyond Ethos, Pathos, Logos

You learned about these in middle school. Now let's go deeper:

**Kairos:** Timeliness. How does the timing of the argument affect its impact? An argument about climate change hits differently during a natural disaster than during normal weather.

**Stasis Theory:** What is actually being debated? Is it a question of fact (did it happen?), definition (what is it?), quality (is it good or bad?), or policy (what should we do?)? Many arguments fail because the parties are arguing at different stasis levels.

**Toulmin Model:** A more sophisticated way to analyze arguments:
- Claim: What is being argued?
- Data: What evidence supports it?
- Warrant: What assumption connects the data to the claim?
- Backing: What supports the warrant?
- Qualifier: How certain is the claim? (usually, most likely, in some cases)
- Rebuttal: What are the exceptions or counterarguments?

### Identifying Logical Fallacies

Recognizing flawed reasoning is a critical analysis superpower:
- **Ad hominem:** Attacking the person instead of the argument
- **Straw man:** Misrepresenting someone's argument to make it easier to attack
- **Slippery slope:** Claiming one action will inevitably lead to extreme consequences
- **Appeal to authority:** Using an authority figure's opinion as proof
- **False equivalence:** Treating unequal things as if they are equal

### Your Analytical Framework

When analyzing any text, work through:
1. What is the rhetorical situation?
2. What is the central claim?
3. What evidence is provided?
4. What assumptions (warrants) are being made?
5. Are there logical fallacies?
6. How effective is the argument for its intended audience?

These skills transfer to every domain: law, medicine, business, science, and civic life.`,
    },
    {
      id: "lesson_ela_9_12_module_1_2",
      moduleId: "ela_9_12_module_1",
      lessonNumber: 2,
      title: "Research Writing: From Sources to Synthesis",
      durationMinutes: 40,
      activityType: "writing",
      activityData: JSON.stringify({
        prompt: "Select a topic you care about and find three credible sources with different perspectives. Write a synthesis paragraph that weaves together insights from all three sources while adding your own analysis. Properly cite each source.",
        instructions: "Practice synthesis: combining multiple sources into a cohesive argument. This is the foundation of all academic and professional research writing.",
      }),
      content: `## Research Writing: From Sources to Synthesis

Research writing at this level is not about summarizing what others have said. It is about synthesizing multiple perspectives to construct original analysis. This is the skill that will carry you through college and into any professional career.

### The Research Process

**1. Developing a Research Question**
Strong research questions are:
- Arguable (not just factual)
- Specific enough to address thoroughly
- Significant enough to warrant investigation
- Open-ended enough to explore genuinely

Weak: "Is social media bad?"
Strong: "To what extent do algorithmic content recommendations on social media platforms contribute to political polarization among young adults?"

**2. Source Evaluation**
Not all sources are equal. Evaluate using the CRAAP test:
- **Currency:** When was it published? Is the information current?
- **Relevance:** Does it address your research question?
- **Authority:** Who is the author? What are their credentials?
- **Accuracy:** Is the information supported by evidence?
- **Purpose:** Why does this source exist? Is there bias?

**3. Primary vs. Secondary Sources**
- **Primary:** Original data, documents, interviews, experiments
- **Secondary:** Analysis and interpretation of primary sources

Strong research uses both.

### From Summary to Synthesis

**Summary** restates what a source says.
**Analysis** examines HOW and WHY a source says it.
**Synthesis** combines insights from multiple sources to create new understanding.

**Summary:** "Smith (2024) argues that AI improves student learning outcomes."
**Analysis:** "Smith's study, while comprehensive, relies heavily on quantitative metrics that may not capture qualitative aspects of learning."
**Synthesis:** "While Smith (2024) demonstrates measurable improvements in test scores, Johnson (2023) raises important questions about whether these gains reflect genuine understanding or merely optimized test-taking, a concern that Rodriguez (2024) addresses by proposing mixed-method assessment approaches."

### Citation and Academic Integrity

Proper citation is not just a rule; it is an ethical obligation and a service to your readers. It:
- Gives credit to the original thinker
- Allows readers to verify your claims
- Demonstrates the depth of your research
- Protects you from plagiarism accusations

### The Thesis Statement

Your thesis is not just an opinion. It is a claim backed by evidence and analysis.

Weak: "AI is changing education."
Strong: "While AI-powered adaptive learning platforms show promise in personalizing instruction, their effectiveness depends on equitable access, teacher training, and transparent algorithmic design, factors that current implementation strategies frequently undervalue."

### Your Assignment

Write a research paragraph on any topic that interests you. Include at least three sources, proper citations, and your own analytical voice. Remember: your job is not to report what others think but to add your own perspective to the conversation.`,
    },
    {
      id: "lesson_ela_9_12_module_1_3",
      moduleId: "ela_9_12_module_1",
      lessonNumber: 3,
      title: "Academic Discourse and Socratic Discussion",
      durationMinutes: 40,
      activityType: "discussion",
      activityData: JSON.stringify({
        prompt: "Choose a complex issue (AI in education, social media regulation, climate policy, etc.). Write three arguments FOR and three arguments AGAINST. Then write your own position, addressing the strongest counterargument. Focus on engaging with the complexity rather than oversimplifying.",
        instructions: "Practice engaging with complex issues from multiple perspectives. The goal is not to 'win' but to deepen understanding through rigorous dialogue.",
      }),
      content: `## Academic Discourse and Socratic Discussion

The highest form of intellectual engagement is not lecturing or debating to win. It is genuine dialogue where all participants are seeking deeper understanding. This is the Socratic tradition, and it is as relevant today as it was 2,400 years ago.

### What Is Socratic Discussion?

Named after the philosopher Socrates, this method prioritizes:
- Asking probing questions rather than making assertions
- Following the argument wherever it leads, even if it challenges your assumptions
- Seeking understanding, not victory
- Building on others' ideas rather than just waiting for your turn to speak

### The Art of Questioning

Socratic questions push thinking deeper:
- **Clarification:** "What do you mean by...?"
- **Evidence:** "What evidence supports that claim?"
- **Perspective:** "How might someone from a different background view this?"
- **Implication:** "If that is true, what follows?"
- **Assumption:** "What are you assuming when you say that?"

### Engaging with Complexity

Real-world issues are complex. Oversimplifying them might feel satisfying, but it leads to shallow understanding and poor decisions. Practice holding multiple perspectives simultaneously:

Instead of: "Social media is bad for teens."
Try: "Social media presents both opportunities for connection and risks to mental health, and the balance depends on factors including individual usage patterns, platform design, and the presence of supportive offline relationships."

### Intellectual Humility

The most intelligent people in any room are usually the ones who:
- Say "I do not know" when they do not know
- Change their minds when presented with compelling evidence
- Ask more questions than they make statements
- Acknowledge the limitations of their own perspective
- Seek out viewpoints that challenge their own

### Constructive Disagreement

Disagreeing productively is a skill:
- Attack ideas, not people
- Steelman the opposing argument (present it in its strongest form)
- Look for common ground before highlighting differences
- Be genuinely open to changing your mind
- End discussions with more questions, not just conclusions

### Why This Matters

In a world of polarization, echo chambers, and social media arguments, the ability to engage thoughtfully with people who see the world differently is increasingly rare and valuable. You are developing a skill that can bridge divides, solve problems, and build understanding.

### Your Practice

Engage in a Socratic discussion with a peer, family member, or mentor about a complex topic. Follow the principles above. Afterward, reflect: Did you learn something new? Did you change your mind about anything? Did you ask good questions?`,
    },

    // ============================================================
    // SEL 9-12: Mental Health & Life Planning - needs lessons 2, 3
    // ============================================================
    {
      id: "lesson_sel_9_12_module_1_2",
      moduleId: "sel_9_12_module_1",
      lessonNumber: 2,
      title: "Building a Stress Management Strategy",
      durationMinutes: 35,
      activityType: "breathing",
      activityData: JSON.stringify({
        pattern: "4-7-8",
        rounds: 4,
        instructions: "The 4-7-8 technique is recommended by psychologists for anxiety management. Breathe in for 4 seconds, hold for 7 seconds, exhale for 8 seconds. Practice this regularly, not just during stressful moments. Building the habit when you are calm makes it more effective during stress.",
      }),
      content: `## Building a Stress Management Strategy

Stress is not your enemy. Chronic, unmanaged stress is. The goal is not to eliminate stress but to develop strategies that help you respond to it effectively.

### Understanding Your Stress Response

When you encounter a stressor, your body activates the "fight or flight" response:
- Heart rate increases
- Breathing becomes shallow
- Muscles tense
- Cortisol floods your system
- Digestion slows
- Focus narrows

This response evolved to help you survive physical threats. The problem is that your body cannot distinguish between a tiger chasing you and a college application deadline. It responds the same way to both.

### Evidence-Based Stress Management

These strategies are supported by psychological research:

**1. Cognitive Restructuring**
Challenge negative thought patterns:
- "I am going to fail" becomes "This is challenging, and I have overcome challenges before"
- "Everyone is judging me" becomes "Most people are focused on their own lives"
- "I cannot handle this" becomes "I can handle this one step at a time"

**2. Progressive Muscle Relaxation**
Systematically tense and release muscle groups, starting from your toes and moving up. This teaches your body what relaxation feels like.

**3. Mindfulness Meditation**
Focus on the present moment without judgment. Even 5 minutes daily reduces anxiety and improves focus. There are many guided meditation apps available.

**4. Time Management**
Much stress comes from feeling like there is not enough time. Strategies:
- Prioritize tasks using the Eisenhower Matrix (urgent/important)
- Break large tasks into smaller ones
- Schedule specific times for specific tasks
- Build buffer time between commitments

**5. Social Connection**
Isolation amplifies stress. Regular, meaningful connection with others is one of the strongest protections against chronic stress.

**6. Physical Health Foundation**
Sleep, nutrition, and exercise are not optional luxuries. They are the foundation of stress resilience.

### Creating Your Personal Strategy

Identify:
1. Your top 3 stressors
2. Your current coping mechanisms (healthy and unhealthy)
3. Which evidence-based strategies you want to try
4. Who supports you
5. Your warning signs that stress is becoming unmanageable

### When to Seek Professional Help

Sometimes stress becomes more than you can manage alone. Seek help if you experience:
- Persistent anxiety that interferes with daily life
- Changes in sleep or appetite lasting more than 2 weeks
- Withdrawing from activities you used to enjoy
- Feelings of hopelessness
- Thoughts of self-harm

Resources: School counselor, 988 Suicide & Crisis Lifeline, Crisis Text Line (text HOME to 741741)

### Remember

Asking for help is not a sign of weakness. It is a sign of self-awareness and courage.`,
    },
    {
      id: "lesson_sel_9_12_module_1_3",
      moduleId: "sel_9_12_module_1",
      lessonNumber: 3,
      title: "Goal Setting and Future Planning",
      durationMinutes: 35,
      activityType: "writing",
      activityData: JSON.stringify({
        prompt: "Write a personal vision statement for the next 5 years. Include: (1) What kind of person do you want to be? (2) What do you want to accomplish? (3) What values will guide your decisions? (4) What steps can you take starting now? Be honest and ambitious.",
        instructions: "This is not about having a perfect plan. It is about having a direction. Your vision can and will evolve as you grow. The act of creating it is what matters.",
      }),
      content: `## Goal Setting and Future Planning

You are approaching one of life's biggest transitions. Whether you are heading to college, a career, military service, or another path, the decisions you make now will shape your future. Strategic planning is not about predicting the future; it is about being prepared for it.

### The Difference Between Dreams and Goals

Dreams are visions of what could be. Goals are plans with deadlines. Both are important, but only goals lead to action.

**Dream:** "I want to make a difference in the world."
**Goal:** "By the end of this semester, I will volunteer 20 hours at a local organization aligned with my interests, identify 3 career paths in that field, and research what education they require."

### The Goal-Setting Framework

**Long-term vision (5-10 years):** What kind of life do you want? What values will guide it?

**Medium-term goals (1-3 years):** What milestones will move you toward your vision?

**Short-term goals (1-12 months):** What specific, actionable steps can you take now?

**Daily habits:** What will you do every day to make progress?

### Values-Based Decision Making

When facing a tough decision:
1. Identify your core values (integrity, creativity, community, growth, etc.)
2. Evaluate each option against those values
3. Choose the option most aligned with who you want to be
4. Accept that some decisions involve trade-offs

### Building Resilience for the Future

The future is uncertain. You will face setbacks, rejections, and unexpected changes. Resilience is what carries you through:

- **Develop a growth mindset:** Challenges are opportunities to learn
- **Build a support network:** You do not have to face things alone
- **Maintain perspective:** Most setbacks are temporary
- **Take care of the basics:** Sleep, nutrition, exercise, connection
- **Practice self-compassion:** Treat yourself with the same kindness you would offer a friend

### Financial Literacy Basics

Part of future planning is financial awareness:
- Understand the difference between needs and wants
- Start saving, even small amounts
- Learn about budgeting
- Understand student loans before taking them on
- Know that financial stress is manageable with planning

### Your Action Plan

Create a one-page action plan:
- Your personal vision statement
- 3 goals for the next year
- Specific steps for each goal
- Potential obstacles and how you will address them
- Who will support you

### The Most Important Thing

Whatever path you choose, prioritize your wellbeing. No achievement is worth sacrificing your mental health. Success means different things to different people, and only you get to define what it means for you.

You have the knowledge, the skills, and the character to build a meaningful life. Trust yourself.`,
    },

    // ============================================================
    // WELLNESS 9-12: Holistic Wellness - needs 3 lessons
    // ============================================================
    {
      id: "lesson_wellness_9_12_module_1_1",
      moduleId: "wellness_9_12_module_1",
      lessonNumber: 1,
      title: "The Dimensions of Wellness",
      durationMinutes: 35,
      activityType: "matching",
      activityData: JSON.stringify({
        pairs: [
          { term: "Physical Wellness", definition: "Taking care of your body through nutrition, exercise, and sleep" },
          { term: "Mental Wellness", definition: "Managing stress, emotions, and maintaining psychological health" },
          { term: "Social Wellness", definition: "Building and maintaining healthy, supportive relationships" },
          { term: "Intellectual Wellness", definition: "Engaging in stimulating mental activities and lifelong learning" },
          { term: "Financial Wellness", definition: "Managing money effectively and planning for economic stability" },
        ],
        instructions: "Match each dimension of wellness with its description. True wellness is not just physical; it encompasses every aspect of your life.",
      }),
      content: `## The Dimensions of Wellness

Wellness is not just the absence of illness. It is the active pursuit of a fulfilling, balanced life across multiple dimensions. As you approach greater independence, understanding holistic wellness becomes essential.

### The Six Dimensions

**1. Physical Wellness**
Your body is the vehicle for everything you want to do in life. Physical wellness includes:
- Regular physical activity (150+ minutes per week of moderate exercise)
- Balanced nutrition (eating for fuel, not just pleasure)
- Adequate sleep (8-10 hours for teens)
- Avoiding harmful substances
- Regular health check-ups

**2. Mental/Emotional Wellness**
Your psychological health affects everything:
- Stress management strategies
- Emotional regulation skills
- Self-awareness and self-compassion
- Coping mechanisms for difficult times
- Knowing when and how to seek help

**3. Social Wellness**
Humans are social beings. Connection is not optional:
- Meaningful relationships with family and friends
- Healthy boundaries
- Communication skills
- Community involvement
- Navigating conflict constructively

**4. Intellectual Wellness**
Your mind needs stimulation to thrive:
- Lifelong learning orientation
- Critical thinking skills
- Curiosity and openness to new ideas
- Creative expression
- Reading, discussing, exploring

**5. Financial Wellness**
Financial stress is one of the leading causes of anxiety:
- Budgeting and saving habits
- Understanding debt and credit
- Planning for short and long-term goals
- Living within your means
- Financial literacy

**6. Purposeful Wellness**
A sense of meaning and purpose is fundamental to wellbeing:
- Identifying what matters to you
- Contributing to something larger than yourself
- Aligning your actions with your values
- Finding work that is meaningful
- Spiritual or philosophical grounding

### The Interconnection

These dimensions are not separate. They are deeply interconnected. Poor sleep (physical) leads to irritability (emotional), which strains relationships (social), which causes stress (mental), which leads to poor eating (physical). The cycle works in reverse too: improving one dimension often improves others.

### Self-Assessment

Rate yourself on each dimension (1-10). Where are you strongest? Where do you need the most attention? This honest assessment is the starting point for your wellness plan.`,
    },
    {
      id: "lesson_wellness_9_12_module_1_2",
      moduleId: "wellness_9_12_module_1",
      lessonNumber: 2,
      title: "Nutrition and Fitness for Life",
      durationMinutes: 35,
      activityType: "sorting",
      activityData: JSON.stringify({
        categories: ["Evidence-Based Practice", "Common Myth"],
        items: [
          { text: "Strength training is important for all genders", category: "Evidence-Based Practice" },
          { text: "You need to eat perfectly clean to be healthy", category: "Common Myth" },
          { text: "Rest days are essential for fitness progress", category: "Evidence-Based Practice" },
          { text: "Carbs are always bad for you", category: "Common Myth" },
          { text: "Consistency matters more than intensity", category: "Evidence-Based Practice" },
          { text: "You can target fat loss in specific body areas", category: "Common Myth" },
          { text: "Hydration affects cognitive performance", category: "Evidence-Based Practice" },
          { text: "Supplements can replace a balanced diet", category: "Common Myth" },
        ],
        instructions: "Sort these statements about nutrition and fitness. There is a lot of misinformation out there. Learn to distinguish evidence-based practices from common myths.",
      }),
      content: `## Nutrition and Fitness for Life

The fitness and nutrition industries are filled with misinformation, fad diets, and unrealistic body standards. Today you will learn evidence-based approaches to nutrition and fitness that will serve you for life.

### Nutrition: The Fundamentals

**Macronutrients:**
- **Carbohydrates:** Your brain's primary fuel. Choose complex carbs (whole grains, fruits, vegetables) over simple ones (candy, white bread). Carbs are NOT the enemy.
- **Protein:** Essential for muscle repair, immune function, and hormones. Sources: lean meats, fish, beans, eggs, dairy.
- **Fats:** Necessary for brain function, hormone production, and vitamin absorption. Healthy sources: nuts, avocados, olive oil, fish.

**Micronutrients:** Vitamins and minerals from a varied diet support every system in your body. Eating a variety of colorful foods is the best way to get them.

**Hydration:** Your body is about 60% water. Dehydration affects mood, energy, concentration, and physical performance. Aim for at least 8 glasses per day, more if you exercise.

### Common Nutrition Myths Debunked

- **Myth: "Carbs make you fat."** Reality: Excess calories from any source can lead to weight gain. Carbs are essential fuel.
- **Myth: "You need protein immediately after a workout."** Reality: Total daily protein intake matters more than timing.
- **Myth: "Supplements can replace a balanced diet."** Reality: Whole foods provide nutrients in forms your body absorbs best.
- **Myth: "Clean eating or elimination diets are necessary."** Reality: Balance and moderation work for most people.

### Fitness: Building Sustainable Habits

The best exercise routine is one you will actually do consistently. Here are evidence-based guidelines:

- **Cardio:** 150+ minutes per week of moderate activity (brisk walking, cycling, swimming)
- **Strength:** 2-3 sessions per week targeting major muscle groups
- **Flexibility:** Regular stretching or yoga for mobility
- **Rest:** At least 1-2 rest days per week for recovery

### Body Image and Fitness Culture

Social media has distorted many people's perception of healthy bodies. Remember:
- Healthy bodies come in all shapes and sizes
- Fitness influencers often use editing, lighting, and sometimes substances
- Your worth is not determined by your appearance
- Exercise should make you feel better, not punish your body

### Creating Your Fitness Plan

Start where you are. If you are currently inactive, begin with 10-minute walks and build from there. The goal is progressive improvement, not perfection.

### Sustainable Approach

The key word is sustainable. Crash diets and extreme workouts are not sustainable. Moderate, consistent habits are. You are building a foundation for the next 60+ years, not preparing for a photo shoot.`,
    },
    {
      id: "lesson_wellness_9_12_module_1_3",
      moduleId: "wellness_9_12_module_1",
      lessonNumber: 3,
      title: "Your Comprehensive Wellness Blueprint",
      durationMinutes: 40,
      activityType: "emotion_checkin",
      activityData: JSON.stringify({
        emotions: ["Empowered", "Motivated", "Focused", "Balanced", "Hopeful", "Ready"],
        prompt: "You have explored all dimensions of wellness. As you prepare to create your personal wellness blueprint, how do you feel about taking ownership of your wellbeing? This is a powerful step toward independence.",
      }),
      content: `## Your Comprehensive Wellness Blueprint

This is the culminating lesson. You are going to create a comprehensive, personalized wellness plan that addresses every dimension of your life. This is not a school assignment. This is a life document.

### Your Wellness Assessment

Before building your plan, honestly assess where you are:

**Physical:** How is your sleep? Nutrition? Exercise? Energy levels?
**Mental:** How is your stress? Emotional regulation? Self-talk?
**Social:** How are your relationships? Do you feel connected and supported?
**Intellectual:** Are you learning and growing? Is your mind stimulated?
**Financial:** Do you understand money management? Are you building good habits?
**Purposeful:** Do you have a sense of meaning? Are you contributing to something larger?

### Building Your Blueprint

For each dimension, define:
1. **Current state** (honest assessment)
2. **Desired state** (what would "good" look like?)
3. **One specific goal** for the next 30 days
4. **Daily habits** that support this goal
5. **Potential obstacles** and how you will address them
6. **Who can help** you stay accountable

### Sample Blueprint Entry

**Dimension:** Physical Wellness
**Current state:** Sleeping 6 hours, eating irregularly, exercising once a week
**Desired state:** Sleeping 8 hours, eating 3 balanced meals, exercising 4 times a week
**30-day goal:** Establish a consistent 10:30 PM bedtime and add 2 exercise sessions per week
**Daily habits:** No screens after 10 PM, prepare lunch the night before, 20-minute walk after school
**Obstacles:** Late-night homework, social media temptation before bed
**Support:** Set phone alarm for 10 PM screen cutoff, ask a friend to be walking buddy

### The Non-Negotiables

Identify 3-5 wellness practices that you commit to no matter what:
- These are your foundation
- They are simple enough to maintain even on bad days
- Examples: 8 hours of sleep, daily walk, one healthy meal, 5 minutes of quiet reflection

### Tracking Progress

Review your wellness blueprint weekly:
- What went well this week?
- What needs adjustment?
- Am I being realistic with my goals?
- Do I need to add or remove anything?

### Self-Compassion

You will not follow your blueprint perfectly every day. That is human. What matters is returning to it after slipping, without self-judgment. Treat yourself with the same compassion you would offer a good friend.

### The Long View

You are not just planning for next month. You are building habits and frameworks that will serve you for decades. The investment you make in your wellness now compounds over time, just like interest in a savings account.

### A Final Thought

Taking ownership of your wellbeing is one of the most empowering things you can do. In a world full of things you cannot control, your daily choices about how you eat, move, sleep, think, connect, and grow are entirely within your power.

You are worth the investment. Start today.`,
    },
  ];

  const batchSize = 20;
  for (let i = 0; i < allLessons.length; i += batchSize) {
    const batch = allLessons.slice(i, i + batchSize);
    await db.insert(lessons).values(batch).onConflictDoNothing();
  }
}
